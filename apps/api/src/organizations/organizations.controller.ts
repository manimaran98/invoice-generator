import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload.interface';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: RequestUser) {
    return this.orgs.getCurrent(user.orgId);
  }

  @Patch('current')
  updateCurrent(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgs.updateCurrent(user.orgId, dto);
  }

  @Get('members')
  listMembers(@CurrentUser() user: RequestUser) {
    return this.orgs.listMembers(user.orgId);
  }
}
