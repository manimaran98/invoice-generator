import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async updateCurrent(organizationId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.legalName != null && { legalName: dto.legalName }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.invoicePrefix != null && { invoicePrefix: dto.invoicePrefix }),
      },
    });
  }

  async listMembers(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
