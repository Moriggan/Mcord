import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { MessagesService } from './messages.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('channels/:id/messages')
  list(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('before') before?: string,
    @Query('limit') limit?: string
  ) {
    return this.messagesService.list(id, user.id, before, limit ? parseInt(limit, 10) : 50);
  }

  @Post('channels/:id/messages')
  create(@Param('id') id: string, @CurrentUser() user: any, @Body('content') content: string) {
    return this.messagesService.create(id, user.id, content);
  }

  @Patch('messages/:id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body('content') content: string) {
    return this.messagesService.update(id, user.id, content);
  }

  @Delete('messages/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.delete(id, user.id);
  }
}
