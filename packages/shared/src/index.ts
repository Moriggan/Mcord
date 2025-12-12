export enum GatewayEvents {
  MESSAGE_CREATE = 'MESSAGE_CREATE',
  MESSAGE_UPDATE = 'MESSAGE_UPDATE',
  MESSAGE_DELETE = 'MESSAGE_DELETE',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
  TYPING_START = 'TYPING_START'
}

export enum PermissionBits {
  VIEW_CHANNEL = 1 << 0,
  SEND_MESSAGES = 1 << 1,
  MANAGE_CHANNELS = 1 << 2,
  MANAGE_ROLES = 1 << 3,
  ADMINISTRATOR = 1 << 4
}

export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline';
}

export interface TypingPayload {
  channelId: string;
  userId: string;
}

export interface MessagePayload {
  id: string;
  content: string;
  channelId: string;
  authorId: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  username?: string;
}
