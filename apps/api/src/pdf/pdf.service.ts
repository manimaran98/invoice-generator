import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PdfJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PdfJobMessage = {
  pdfJobId: string;
  invoiceId: string;
  organizationId: string;
};

@Injectable()
export class PdfService {
  constructor(
    @InjectQueue('pdf') private readonly pdfQueue: Queue<PdfJobMessage>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueue(invoiceId: string, organizationId: string) {
    const row = await this.prisma.pdfJob.create({
      data: {
        invoiceId,
        organizationId,
        status: PdfJobStatus.QUEUED,
      },
    });
    const job = await this.pdfQueue.add(
      'render',
      {
        pdfJobId: row.id,
        invoiceId,
        organizationId,
      } satisfies PdfJobMessage,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    await this.prisma.pdfJob.update({
      where: { id: row.id },
      data: { bullJobId: String(job.id) },
    });
    return { pdfJobId: row.id, bullJobId: job.id };
  }

  latestJobForInvoice(invoiceId: string, organizationId: string) {
    return this.prisma.pdfJob.findFirst({
      where: { invoiceId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDownload(invoiceId: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    const job = await this.latestJobForInvoice(invoiceId, organizationId);
    if (!job || job.status !== PdfJobStatus.DONE || !job.storagePath) {
      throw new NotFoundException('PDF not ready');
    }
    return {
      path: job.storagePath,
      filename: `${invoice.number.replace(/[^\w.-]+/g, '_')}.pdf`,
    };
  }
}
