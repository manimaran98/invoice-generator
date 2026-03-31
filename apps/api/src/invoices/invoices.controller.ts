import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload.interface';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.invoices.list(user.orgId);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoices.create(user.orgId, user.userId, dto);
  }

  @Get(':id/pdf/status')
  @Header('Cache-Control', 'no-store')
  pdfStatus(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.invoices.getPdfStatus(id, user.orgId);
  }

  @Get(':id/pdf/download')
  async pdfDownload(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    const { path: filePath, filename } =
      await this.invoices.getPdfDownloadPath(id, user.orgId);
    const stream = createReadStream(filePath);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Post(':id/pdf')
  requestPdf(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.invoices.requestPdf(id, user.orgId);
  }

  @Get(':id')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.invoices.findOne(id, user.orgId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(id, user.orgId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.invoices.remove(id, user.orgId);
  }
}
