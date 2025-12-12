import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionBits } from '@mcord/shared';
import { PrismaService } from '../prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService
  ) {}

  async list(serverId: string, userId: string) {
    await this.permissions.getServerPermissions(userId, serverId);
    return this.prisma.channel.findMany({ where: { serverId } });
  }

  async create(serverId: string, userId: string, name: string) {
    const perms = await this.permissions.getServerPermissions(userId, serverId);
    if (!(perms & PermissionBits.MANAGE_CHANNELS)) {
      throw new UnauthorizedException('No permission to create channels');
    }
    return this.prisma.channel.create({ data: { name, serverId } });
  }
}
