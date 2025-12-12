import { Injectable } from '@nestjs/common';
import { PermissionBits } from '@mcord/shared';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) {}

  async createServer(userId: string, name: string) {
    const server = await this.prisma.server.create({
      data: {
        name,
        ownerId: userId
      }
    });
    const everyone = await this.prisma.role.create({
      data: {
        name: '@everyone',
        permissions: PermissionBits.VIEW_CHANNEL | PermissionBits.SEND_MESSAGES,
        serverId: server.id
      }
    });
    const adminRole = await this.prisma.role.create({
      data: {
        name: 'Admin',
        permissions:
          PermissionBits.VIEW_CHANNEL |
          PermissionBits.SEND_MESSAGES |
          PermissionBits.MANAGE_CHANNELS |
          PermissionBits.MANAGE_ROLES |
          PermissionBits.ADMINISTRATOR,
        serverId: server.id
      }
    });
    const memberRole = await this.prisma.role.create({
      data: {
        name: 'Member',
        permissions: PermissionBits.VIEW_CHANNEL | PermissionBits.SEND_MESSAGES,
        serverId: server.id
      }
    });
    const member = await this.prisma.serverMember.create({
      data: {
        userId,
        serverId: server.id
      }
    });
    await this.prisma.memberRole.create({ data: { memberId: member.id, roleId: adminRole.id } });
    await this.prisma.memberRole.create({ data: { memberId: member.id, roleId: memberRole.id } });
    await this.prisma.channel.create({ data: { name: 'general', serverId: server.id } });
    return { server, roles: { everyone: everyone.id, admin: adminRole.id, member: memberRole.id } };
  }

  listServersForUser(userId: string) {
    return this.prisma.server.findMany({
      where: { members: { some: { userId } } },
      include: { channels: true }
    });
  }
}
