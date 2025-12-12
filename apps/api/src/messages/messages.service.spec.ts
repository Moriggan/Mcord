import { MessagesService } from './messages.service';
import { PermissionsService } from '../permissions/permissions.service';
import { GatewayService } from '../gateway/gateway.service';

const prisma: any = {
  message: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  }
};

const permissions: any = {
  ensure: jest.fn(),
  getChannelPermissions: jest.fn()
};
const gateway: any = {
  emitMessageCreate: jest.fn(),
  emitMessageUpdate: jest.fn(),
  emitMessageDelete: jest.fn()
};

const service = new MessagesService(prisma as any, permissions as PermissionsService, gateway as GatewayService);

describe('MessagesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a message when permitted', async () => {
    permissions.ensure.mockResolvedValue(true);
    prisma.message.create.mockResolvedValue({ id: 'm1', channelId: 'c1', authorId: 'u1', content: 'hello', createdAt: new Date() });
    const res = await service.create('c1', 'u1', 'hello');
    expect(res.id).toBe('m1');
    expect(gateway.emitMessageCreate).toHaveBeenCalled();
  });

  it('prevents delete without permission', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', channelId: 'c1', authorId: 'other' });
    permissions.getChannelPermissions.mockResolvedValue(0);
    await expect(service.delete('m1', 'u1')).rejects.toBeTruthy();
  });
});
