import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfService } from './pdf.service';
import { PdfProcessor } from './pdf.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'pdf' })],
  providers: [PdfService, PdfProcessor],
  exports: [PdfService],
})
export class PdfModule {}
