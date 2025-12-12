import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { GatewayEvents, MessagePayload, PresencePayload, TypingPayload } from '@mcord/shared';

@Injectable()
export class GatewayService {
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitMessageCreate(payload: MessagePayload) {
    this.server?.to(`channel:${payload.channelId}`).emit(GatewayEvents.MESSAGE_CREATE, payload);
  }

  emitMessageUpdate(payload: MessagePayload) {
    this.server?.to(`channel:${payload.channelId}`).emit(GatewayEvents.MESSAGE_UPDATE, payload);
  }

  emitMessageDelete(channelId: string, payload: MessagePayload) {
    this.server?.to(`channel:${channelId}`).emit(GatewayEvents.MESSAGE_DELETE, payload);
  }

  emitPresence(payload: PresencePayload) {
    this.server?.emit(GatewayEvents.PRESENCE_UPDATE, payload);
  }

  emitTyping(payload: TypingPayload) {
    this.server?.to(`channel:${payload.channelId}`).emit(GatewayEvents.TYPING_START, payload);
  }
}
