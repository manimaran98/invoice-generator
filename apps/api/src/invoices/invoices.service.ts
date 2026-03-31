import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PdfService } from '../pdf/pdf.service';

function lineTotals(items: { quantity: number; unitPriceCents: number }[]) {
  let subtotal = 0;
  for (const li of items) {
    subtotal += Math.round(Number(li.quantity) * li.unitPriceCents);
  }
  return subtotal;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  list(organizationId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!inv) {
      throw new NotFoundException('Invoice not found');
    }
    return inv;
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreateInvoiceDto,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    if (!dto.lineItems?.length) {
      throw new BadRequestException('At least one line item required');
    }
    const subtotal = lineTotals(dto.lineItems);
    const taxCents = dto.taxCents ?? 0;
    const totalCents = subtotal + taxCents;

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: organizationId },
        data: { invoiceSeq: { increment: 1 } },
        select: { invoiceSeq: true, invoicePrefix: true },
      });
      const number = `${org.invoicePrefix}-${String(org.invoiceSeq).padStart(5, '0')}`;

      return tx.invoice.create({
        data: {
          organizationId,
          clientId: dto.clientId,
          number,
          currency: dto.currency ?? 'USD',
          issueDate: new Date(dto.issueDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          notes: dto.notes,
          subtotalCents: subtotal,
          taxCents,
          totalCents,
          createdByUserId: userId,
          lineItems: {
            create: dto.lineItems.map((li, i) => ({
              description: li.description,
              quantity: new Prisma.Decimal(li.quantity),
              unitPriceCents: li.unitPriceCents,
              sortOrder: li.sortOrder ?? i,
            })),
          },
        },
        include: {
          client: true,
          lineItems: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async update(id: string, organizationId: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(id, organizationId);
    if (existing.status !== InvoiceStatus.DRAFT && dto.lineItems) {
      throw new BadRequestException('Only draft invoices can edit line items');
    }

    let subtotal = existing.subtotalCents;
    let taxCents = dto.taxCents ?? existing.taxCents;
    let totalCents = existing.totalCents;

    if (dto.lineItems) {
      if (!dto.lineItems.length) {
        throw new BadRequestException('At least one line item required');
      }
      subtotal = lineTotals(dto.lineItems);
      totalCents = subtotal + taxCents;
    } else if (dto.taxCents != null) {
      totalCents = existing.subtotalCents + taxCents;
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.lineItems) {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          ...(dto.issueDate && { issueDate: new Date(dto.issueDate) }),
          ...(dto.dueDate !== undefined && {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.taxCents != null && { taxCents }),
          ...(dto.status && { status: dto.status }),
          ...(dto.lineItems && {
            subtotalCents: subtotal,
            totalCents,
            lineItems: {
              create: dto.lineItems.map((li, i) => ({
                description: li.description,
                quantity: new Prisma.Decimal(li.quantity),
                unitPriceCents: li.unitPriceCents,
                sortOrder: li.sortOrder ?? i,
              })),
            },
          }),
          ...(!dto.lineItems && dto.taxCents != null && { totalCents }),
        },
        include: {
          client: true,
          lineItems: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.findOne(id, organizationId);
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be deleted');
    }
    return this.prisma.invoice.delete({ where: { id } });
  }

  async requestPdf(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.pdf.enqueue(id, organizationId);
  }

  getPdfStatus(id: string, organizationId: string) {
    return this.pdf.latestJobForInvoice(id, organizationId);
  }

  async getPdfDownloadPath(id: string, organizationId: string) {
    return this.pdf.resolveDownload(id, organizationId);
  }
}
