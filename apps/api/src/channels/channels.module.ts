import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { PrismaService } from '../prisma.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [ChannelsService, PrismaService],
  controllers: [ChannelsController],
  exports: [ChannelsService]
})
export class ChannelsModule {}
