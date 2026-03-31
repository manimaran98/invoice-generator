import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  create(organizationId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        organizationId,
        name: dto.name,
        email: dto.email,
        address: dto.address,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateClientDto) {
    await this.findOne(id, organizationId);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.client.delete({ where: { id } });
  }
}
