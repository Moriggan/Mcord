import { PermissionBits } from '@mcord/shared';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const prisma: any = {
    server: {
      findUnique: jest.fn()
    },
    channel: {
      findUnique: jest.fn()
    }
  };
  const service = new PermissionsService(prisma as any);

  it('computes overrides', async () => {
    prisma.channel.findUnique.mockResolvedValue({
      overrides: [
        { roleId: 'member', allowBits: 0, denyBits: PermissionBits.SEND_MESSAGES },
        { roleId: 'admin', allowBits: PermissionBits.SEND_MESSAGES, denyBits: 0 }
      ],
      server: {
        roles: [
          { id: 'everyone', name: '@everyone', permissions: PermissionBits.VIEW_CHANNEL },
          { id: 'member', name: 'Member', permissions: PermissionBits.SEND_MESSAGES }
        ],
        members: [
          {
            roles: [{ role: { id: 'member', permissions: PermissionBits.SEND_MESSAGES } }],
            userId: 'u1'
          }
        ]
      }
    });
    const perms = await service.getChannelPermissions('u1', 'c1');
    expect(perms & PermissionBits.SEND_MESSAGES).toBe(0);
  });

  it('grants admin', async () => {
    prisma.server.findUnique.mockResolvedValue({
      roles: [
        { id: 'everyone', name: '@everyone', permissions: PermissionBits.VIEW_CHANNEL },
        { id: 'admin', name: 'Admin', permissions: PermissionBits.ADMINISTRATOR }
      ],
      members: [
        { roles: [{ role: { id: 'admin', permissions: PermissionBits.ADMINISTRATOR } }], userId: 'u1' }
      ]
    });
    const perms = await service.getServerPermissions('u1', 's1');
    expect(perms & PermissionBits.MANAGE_CHANNELS).toBeTruthy();
  });
});
