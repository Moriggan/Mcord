import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PermissionsModule } from '../permissions/permissions.module';
import { RedisService } from './redis.service';
import { RealtimeGateway } from './realtime.gateway';
import { GatewayService } from './gateway.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PermissionsModule, JwtModule.register({})],
  providers: [RealtimeGateway, RedisService, GatewayService, PrismaService],
  exports: [GatewayService, RedisService]
})
export class GatewayModule {}
