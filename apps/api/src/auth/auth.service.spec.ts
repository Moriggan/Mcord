import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const prisma: any = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
};

const users = new UsersService(prisma as any);
const jwt = new JwtService({ secret: 'test' });
const service = new AuthService(prisma as any, users, jwt);

describe('AuthService', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
  });

  it('registers user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({ id: '1', ...data }));
    const res = await service.register({ email: 'a@test.com', username: 'test', password: 'password' });
    expect(res.accessToken).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'bad', password: 'bad' } as any)).rejects.toBeTruthy();
  });
});
