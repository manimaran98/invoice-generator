import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PdfJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PdfJobMessage } from './pdf.service';
import { renderInvoicePdf } from './invoice-pdf.template';

@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<PdfJobMessage>): Promise<void> {
    const { pdfJobId, invoiceId, organizationId } = job.data;
    const baseDir =
      this.config.get<string>('PDF_STORAGE_DIR') ?? './storage/pdfs';

    await this.prisma.pdfJob.update({
      where: { id: pdfJobId },
      data: { status: PdfJobStatus.PROCESSING },
    });

    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: {
          client: true,
          lineItems: { orderBy: { sortOrder: 'asc' } },
          organization: true,
        },
      });
      if (!invoice) {
        throw new Error('Invoice not found for PDF');
      }

      const bytes = await renderInvoicePdf({
        organization: invoice.organization,
        client: invoice.client,
        invoice,
        lineItems: invoice.lineItems,
      });

      const dir = path.join(baseDir, organizationId);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${invoiceId}.pdf`);
      fs.writeFileSync(filePath, Buffer.from(bytes));

      await this.prisma.pdfJob.update({
        where: { id: pdfJobId },
        data: {
          status: PdfJobStatus.DONE,
          storagePath: filePath,
          errorMessage: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`PDF job ${pdfJobId} failed: ${message}`);
      await this.prisma.pdfJob.update({
        where: { id: pdfJobId },
        data: {
          status: PdfJobStatus.FAILED,
          errorMessage: message,
        },
      });
      throw err;
    }
  }
}
