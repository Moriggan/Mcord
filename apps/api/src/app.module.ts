import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { ServersModule } from './servers/servers.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { GatewayModule } from './gateway/gateway.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MeController } from './me.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PermissionsModule,
    ServersModule,
    ChannelsModule,
    MessagesModule,
    GatewayModule
  ],
  controllers: [MeController],
  providers: [PrismaService]
})
export class AppModule {}
