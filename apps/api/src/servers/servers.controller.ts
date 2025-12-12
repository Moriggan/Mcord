import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body('name') name: string) {
    return this.serversService.createServer(user.id, name);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.serversService.listServersForUser(user.id);
  }
}
