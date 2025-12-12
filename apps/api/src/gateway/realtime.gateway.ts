import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionBits, GatewayEvents } from '@mcord/shared';
import { Server, Socket } from 'socket.io';
import { RedisService } from './redis.service';
import { GatewayService } from './gateway.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly permissions: PermissionsService,
    private readonly redis: RedisService,
    private readonly gatewayService: GatewayService
  ) {}

  afterInit() {
    this.gatewayService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'devsecret' });
      client.data.user = { id: decoded.sub, email: decoded.email, username: decoded.username };
      await this.redis.getClient().set(`presence:${decoded.sub}`, 'online');
      this.gatewayService.emitPresence({ userId: decoded.sub, status: 'online' });
    } catch (e) {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      await this.redis.getClient().set(`presence:${user.id}`, 'offline');
      this.gatewayService.emitPresence({ userId: user.id, status: 'offline' });
    }
  }

  @SubscribeMessage('join')
  async joinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    const user = client.data.user;
    if (!user) return;
    await this.permissions.ensure(user.id, data.channelId, PermissionBits.VIEW_CHANNEL);
    client.join(`channel:${data.channelId}`);
  }

  @SubscribeMessage('typing_start')
  async typing(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    const user = client.data.user;
    if (!user) return;
    await this.permissions.ensure(user.id, data.channelId, PermissionBits.SEND_MESSAGES);
    const key = `typing:${user.id}:${data.channelId}`;
    const redis = this.redis.getClient();
    const existing = await redis.get(key);
    if (existing) return;
    await redis.setex(key, 4, '1');
    this.gatewayService.emitTyping({ channelId: data.channelId, userId: user.id });
  }
}
