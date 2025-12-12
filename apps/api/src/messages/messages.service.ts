import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionBits } from '@mcord/shared';
import { PrismaService } from '../prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly gateway: GatewayService
  ) {}

  async list(channelId: string, userId: string, before?: string, limit = 50) {
    await this.permissions.ensure(userId, channelId, PermissionBits.VIEW_CHANNEL);
    return this.prisma.message.findMany({
      where: {
        channelId,
        createdAt: before ? { lt: new Date(before) } : undefined
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: true }
    });
  }

  async create(channelId: string, userId: string, content: string) {
    await this.permissions.ensure(userId, channelId, PermissionBits.SEND_MESSAGES);
    const message = await this.prisma.message.create({
      data: { channelId, authorId: userId, content }
    });
    const payload = {
      id: message.id,
      content: message.content,
      channelId,
      authorId: userId,
      createdAt: message.createdAt.toISOString()
    };
    this.gateway.emitMessageCreate(payload);
    return message;
  }

  async update(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new UnauthorizedException('Message not found');
    const perms = await this.permissions.getChannelPermissions(userId, message.channelId);
    if (message.authorId !== userId && !(perms & PermissionBits.ADMINISTRATOR)) {
      throw new UnauthorizedException('Cannot edit');
    }
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() }
    });
    this.gateway.emitMessageUpdate({
      id: updated.id,
      content: updated.content,
      channelId: updated.channelId,
      authorId: updated.authorId,
      createdAt: updated.createdAt.toISOString(),
      editedAt: updated.editedAt?.toISOString()
    });
    return updated;
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new UnauthorizedException('Message not found');
    const perms = await this.permissions.getChannelPermissions(userId, message.channelId);
    if (message.authorId !== userId && !(perms & PermissionBits.ADMINISTRATOR)) {
      throw new UnauthorizedException('Cannot delete');
    }
    const deleted = await this.prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
    this.gateway.emitMessageDelete(message.channelId, {
      id: deleted.id,
      content: deleted.content,
      channelId: deleted.channelId,
      authorId: deleted.authorId,
      createdAt: deleted.createdAt.toISOString(),
      deletedAt: deleted.deletedAt?.toISOString()
    });
    return deleted;
  }
}
