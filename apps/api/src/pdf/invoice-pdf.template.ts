import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  Client,
  Invoice,
  InvoiceLineItem,
  Organization,
} from '@prisma/client';

export type InvoicePdfModel = {
  organization: Organization;
  client: Client;
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
};

function formatMoney(cents: number, currency: string) {
  const n = (cents / 100).toFixed(2);
  return `${currency} ${n}`;
}

export async function renderInvoicePdf(
  model: InvoicePdfModel,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 48;
  const margin = 48;
  const lineHeight = 14;
  const o = model.organization;
  const c = model.client;
  const inv = model.invoice;

  const draw = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? 11;
    const f = opts?.bold ? fontBold : font;
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.1, 0.12),
    });
    y -= lineHeight;
  };

  draw(o.legalName, { bold: true, size: 16 });
  if (o.address) {
    for (const line of o.address.split('\n')) {
      draw(line);
    }
  }
  if (o.taxId) draw(`Tax ID: ${o.taxId}`);
  y -= 8;
  draw(`Invoice ${inv.number}`, { bold: true, size: 14 });
  draw(`Status: ${inv.status}`);
  draw(`Issue: ${inv.issueDate.toISOString().slice(0, 10)}`);
  if (inv.dueDate) {
    draw(`Due: ${inv.dueDate.toISOString().slice(0, 10)}`);
  }
  draw(`Currency: ${inv.currency}`);
  y -= 8;
  draw('Bill to', { bold: true });
  draw(c.name);
  if (c.email) draw(c.email);
  if (c.address) {
    for (const line of c.address.split('\n')) {
      draw(line);
    }
  }
  y -= 8;
  draw('Line items', { bold: true });
  y -= 4;
  page.drawText('Description', {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.22),
  });
  page.drawText('Qty', {
    x: margin + 260,
    y,
    size: 10,
    font: fontBold,
  });
  page.drawText('Unit', {
    x: margin + 300,
    y,
    size: 10,
    font: fontBold,
  });
  page.drawText('Total', {
    x: margin + 400,
    y,
    size: 10,
    font: fontBold,
  });
  y -= lineHeight;

  for (const li of model.lineItems) {
    if (y < 100) {
      page = doc.addPage([612, 792]);
      y = height - 48;
      draw('(continued)', { bold: true, size: 12 });
      y -= 8;
    }
    const lineTotal =
      Math.round(Number(li.quantity) * li.unitPriceCents) / 100;
    const desc = li.description.length > 40
      ? `${li.description.slice(0, 37)}...`
      : li.description;
    page.drawText(desc, { x: margin, y, size: 10, font });
    page.drawText(String(li.quantity), {
      x: margin + 260,
      y,
      size: 10,
      font,
    });
    page.drawText((li.unitPriceCents / 100).toFixed(2), {
      x: margin + 300,
      y,
      size: 10,
      font,
    });
    page.drawText((lineTotal).toFixed(2), {
      x: margin + 400,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;
  }

  y -= 8;
  draw(`Subtotal: ${formatMoney(inv.subtotalCents, inv.currency)}`);
  draw(`Tax: ${formatMoney(inv.taxCents, inv.currency)}`);
  draw(`Total: ${formatMoney(inv.totalCents, inv.currency)}`, { bold: true });
  if (inv.notes) {
    y -= 8;
    draw('Notes', { bold: true });
    for (const line of inv.notes.split('\n')) {
      draw(line);
    }
  }

  return doc.save();
}
