import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/types/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
        },
      });
      const org = await tx.organization.create({
        data: {
          legalName: `${dto.email.split('@')[0]}'s organization`,
          invoicePrefix: 'INV',
        },
      });
      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: MembershipRole.OWNER,
        },
      });
      return { user, organizationId: org.id, role: MembershipRole.OWNER };
    });
    const accessToken = this.signToken({
      sub: result.user.id,
      orgId: result.organizationId,
      role: result.role,
    });
    return { accessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }
    const accessToken = this.signToken({
      sub: user.id,
      orgId: membership.organizationId,
      role: membership.role,
    });
    return { accessToken };
  }

  async switchOrganization(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });
    if (!membership) {
      throw new UnauthorizedException('Not a member of this organization');
    }
    const accessToken = this.signToken({
      sub: userId,
      orgId: membership.organizationId,
      role: membership.role,
    });
    return { accessToken };
  }

  private signToken(payload: JwtPayload) {
    return this.jwt.sign(payload);
  }
}
