import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PermissionBits } from '@mcord/shared';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;
  const user = await prisma.user.create({
    data: {
      email,
      username: 'demo',
      password: await bcrypt.hash('password', 10)
    }
  });
  const server = await prisma.server.create({ data: { name: 'Demo Server', ownerId: user.id } });
  const everyone = await prisma.role.create({
    data: { name: '@everyone', permissions: PermissionBits.VIEW_CHANNEL | PermissionBits.SEND_MESSAGES, serverId: server.id }
  });
  const admin = await prisma.role.create({
    data: {
      name: 'Admin',
      permissions:
        PermissionBits.VIEW_CHANNEL |
        PermissionBits.SEND_MESSAGES |
        PermissionBits.MANAGE_CHANNELS |
        PermissionBits.MANAGE_ROLES |
        PermissionBits.ADMINISTRATOR,
      serverId: server.id
    }
  });
  const memberRole = await prisma.role.create({
    data: { name: 'Member', permissions: PermissionBits.VIEW_CHANNEL | PermissionBits.SEND_MESSAGES, serverId: server.id }
  });
  const member = await prisma.serverMember.create({ data: { userId: user.id, serverId: server.id } });
  await prisma.memberRole.createMany({
    data: [
      { memberId: member.id, roleId: admin.id },
      { memberId: member.id, roleId: memberRole.id }
    ]
  });
  await prisma.channel.create({ data: { name: 'general', serverId: server.id } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
