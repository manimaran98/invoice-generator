import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string, activeOrgId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        memberships: {
          include: {
            organization: { select: { id: true, legalName: true } },
          },
        },
      },
    });
    return {
      user: { id: user.id, email: user.email },
      activeOrganizationId: activeOrgId,
      organizations: user.memberships.map((m) => ({
        id: m.organizationId,
        legalName: m.organization.legalName,
        role: m.role,
      })),
    };
  }
}
