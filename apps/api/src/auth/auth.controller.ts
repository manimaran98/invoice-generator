import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchOrgDto } from './dto/switch-org.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('switch-organization')
  @UseGuards(JwtAuthGuard)
  switchOrganization(
    @CurrentUser() user: RequestUser,
    @Body() dto: SwitchOrgDto,
  ) {
    return this.auth.switchOrganization(user.userId, dto.organizationId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        memberships: {
          include: { organization: { select: { id: true, legalName: true } } },
        },
      },
    });
    return {
      user: { id: dbUser.id, email: dbUser.email },
      activeOrganizationId: user.orgId,
      organizations: dbUser.memberships.map((m) => ({
        id: m.organizationId,
        legalName: m.organization.legalName,
        role: m.role,
      })),
    };
  }
}
