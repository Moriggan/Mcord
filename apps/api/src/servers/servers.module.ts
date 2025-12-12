import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { PrismaService } from '../prisma.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [ServersService, PrismaService],
  controllers: [ServersController],
  exports: [ServersService]
})
export class ServersModule {}
