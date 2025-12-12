import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionBits } from '@mcord/shared';
import { PrismaService } from '../prisma.service';

const ALL_PERMISSIONS =
  PermissionBits.VIEW_CHANNEL |
  PermissionBits.SEND_MESSAGES |
  PermissionBits.MANAGE_CHANNELS |
  PermissionBits.MANAGE_ROLES |
  PermissionBits.ADMINISTRATOR;

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private applyRoles(base: number, roles: { permissions: number }[]) {
    let perms = base;
    for (const role of roles) {
      perms |= role.permissions;
    }
    if (perms & PermissionBits.ADMINISTRATOR) {
      perms = ALL_PERMISSIONS;
    }
    return perms;
  }

  private applyOverrides(perms: number, overrides: { allowBits: number; denyBits: number; roleId: string }[], roleIds: string[]) {
    let result = perms;
    for (const override of overrides) {
      if (!roleIds.includes(override.roleId)) continue;
      result = (result & ~override.denyBits) | override.allowBits;
    }
    return result;
  }

  async getServerPermissions(userId: string, serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        roles: true,
        members: {
          where: { userId },
          include: { roles: { include: { role: true } } }
        }
      }
    });
    if (!server) throw new UnauthorizedException('Server not found');
    const member = server.members[0];
    if (!member) throw new UnauthorizedException('Not a member');
    const everyone = server.roles.find((r) => r.name === '@everyone');
    const memberRoles = member.roles.map((mr) => mr.role);
    const base = everyone?.permissions ?? 0;
    return this.applyRoles(base, memberRoles);
  }

  async getChannelPermissions(userId: string, channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        overrides: true,
        server: {
          include: {
            roles: true,
            members: {
              where: { userId },
              include: { roles: { include: { role: true } } }
            }
          }
        }
      }
    });
    if (!channel) throw new UnauthorizedException('Channel not found');
    const member = channel.server.members[0];
    if (!member) throw new UnauthorizedException('Not a member');
    const everyone = channel.server.roles.find((r) => r.name === '@everyone');
    const memberRoles = member.roles.map((mr) => mr.role);
    const base = this.applyRoles(everyone?.permissions ?? 0, memberRoles);
    const roleIds = [everyone?.id, ...memberRoles.map((r) => r.id)].filter(Boolean) as string[];
    return this.applyOverrides(base, channel.overrides, roleIds);
  }

  async ensure(userId: string, channelId: string, bit: PermissionBits) {
    const perms = await this.getChannelPermissions(userId, channelId);
    if (!(perms & bit)) {
      throw new UnauthorizedException('Insufficient permissions');
    }
    return perms;
  }
}
