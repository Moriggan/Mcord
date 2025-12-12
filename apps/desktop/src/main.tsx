import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { GatewayEvents, TypingPayload, MessagePayload, PresencePayload } from '@mcord/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

declare global {
  interface Window {
    mcord?: {
      saveToken: (token: string) => void;
      loadToken: () => string;
      clearToken: () => void;
    };
  }
}

interface Server {
  id: string;
  name: string;
}

interface Channel {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message extends MessagePayload {
  author?: User;
}

const client = axios.create({ baseURL: API_URL });

function AuthForm({ onAuth }: { onAuth: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      const payload = mode === 'login' ? { email, password } : { email, password, username };
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await client.post(url, payload);
      onAuth(data.accessToken, data.user);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="auth">
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === 'register' && (
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      )}
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button onClick={submit}>{mode === 'login' ? 'Login' : 'Create account'}</button>
      <p className="toggle" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account?' : 'Have an account?'}
      </p>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState<TypingPayload | null>(null);
  const [presence, setPresence] = useState<Record<string, string>>({});

  const socket: Socket | null = useMemo(() => {
    if (!token) return null;
    const s = io(API_URL, { auth: { token } });
    return s;
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on(GatewayEvents.MESSAGE_CREATE, (msg: MessagePayload) => {
      setMessages((prev) => [msg as Message, ...prev]);
    });
    socket.on(GatewayEvents.MESSAGE_UPDATE, (msg: MessagePayload) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    });
    socket.on(GatewayEvents.MESSAGE_DELETE, (msg: MessagePayload) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    });
    socket.on(GatewayEvents.TYPING_START, (payload: TypingPayload) => {
      setTyping(payload);
      setTimeout(() => setTyping(null), 4000);
    });
    socket.on(GatewayEvents.PRESENCE_UPDATE, (payload: PresencePayload) => {
      setPresence((prev) => ({ ...prev, [payload.userId]: payload.status }));
    });
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    const saved = window.mcord?.loadToken?.();
    if (saved) {
      setToken(saved);
      client.defaults.headers.common.Authorization = `Bearer ${saved}`;
      client.get('/auth/me').then(({ data }) => setUser(data));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    loadServers();
  }, [token]);

  const loadServers = async () => {
    const { data } = await client.get('/servers');
    setServers(data);
    if (data[0]) {
      selectServer(data[0].id);
    }
  };

  const selectServer = async (id: string) => {
    setSelectedServer(id);
    const { data } = await client.get(`/servers/${id}/channels`);
    setChannels(data);
    if (data[0]) {
      selectChannel(data[0].id);
    }
  };

  const selectChannel = async (id: string) => {
    setSelectedChannel(id);
    if (socket) socket.emit('join', { channelId: id });
    const { data } = await client.get(`/channels/${id}/messages`);
    setMessages(data);
  };

  const send = async () => {
    if (!content.trim() || !selectedChannel) return;
    await client.post(`/channels/${selectedChannel}/messages`, { content });
    setContent('');
  };

  const handleAuth = (tok: string, usr: User) => {
    setToken(tok);
    setUser(usr);
    window.mcord?.saveToken?.(tok);
  };

  if (!token || !user) {
    return (
      <div className="layout">
        <AuthForm onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="servers">
        <h3>Servers</h3>
        {servers.map((s) => (
          <button key={s.id} className={s.id === selectedServer ? 'active' : ''} onClick={() => selectServer(s.id)}>
            {s.name}
          </button>
        ))}
      </aside>
      <section className="channels">
        <h3>Channels</h3>
        {channels.map((c) => (
          <div key={c.id} className={c.id === selectedChannel ? 'active' : ''} onClick={() => selectChannel(c.id)}>
            #{c.name}
          </div>
        ))}
      </section>
      <main className="chat">
        <header>
          <div>Logged in as {user.username}</div>
          {typing && typing.channelId === selectedChannel && <div className="typing">Someone is typing...</div>}
        </header>
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className="message">
              <div className="meta">
                <span className="author">{m.author?.username || m.authorId}</span>
                <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                {m.editedAt && <span className="edited">(edited)</span>}
              </div>
              <div className="content">{m.deletedAt ? 'Deleted message' : m.content}</div>
            </div>
          ))}
        </div>
        <footer>
          <input
            value={content}
            placeholder="Message"
            onChange={(e) => {
              setContent(e.target.value);
              if (socket && selectedChannel) socket.emit('typing_start', { channelId: selectedChannel });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
          />
          <button onClick={send}>Send</button>
        </footer>
      </main>
      <aside className="presence">
        <h3>Presence</h3>
        {Object.entries(presence).map(([id, status]) => (
          <div key={id}>
            {id}: {status}
          </div>
        ))}
      </aside>
    </div>
  );
}

import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
