import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ChannelsService } from './channels.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get('servers/:id/channels')
  list(@Param('id') id: string, @CurrentUser() user: any) {
    return this.channelsService.list(id, user.id);
  }

  @Post('servers/:id/channels')
  create(@Param('id') id: string, @Body('name') name: string, @CurrentUser() user: any) {
    return this.channelsService.create(id, user.id, name);
  }
}
