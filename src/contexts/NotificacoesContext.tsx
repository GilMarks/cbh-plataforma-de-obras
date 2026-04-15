import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { solicitacoes as solicitacoesApi } from '../lib/api';
import type { Solicitacao } from '../lib/types';

const STORAGE_KEY = 'cbh_notif_enabled';
const SEEN_KEY = 'cbh_notif_seen';
const POLL_INTERVAL = 30_000;

export interface Notificacao {
  id: string;   // stable: derived from data, not Date.now()
  titulo: string;
  corpo: string;
  href?: string;
  read: boolean;
}

interface NotificacoesContextType {
  enabled: boolean;
  permission: NotificationPermission;
  setEnabled: (v: boolean) => void;
  notificacoes: Notificacao[];
  unread: number;
  markAllRead: () => void;
}

const NotificacoesContext = createContext<NotificacoesContextType>({
  enabled: false,
  permission: 'default',
  setEnabled: () => {},
  notificacoes: [],
  unread: 0,
  markAllRead: () => {},
});

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids).slice(-200)));
}

// IDs are derived from data state — stable across polls
function buildNotifs(sols: Solicitacao[], seen: Set<string>): Notificacao[] {
  const notifs: Notificacao[] = [];

  const pendentes = sols.filter(s => s.statusAutorizacao === 'Aguardando');
  if (pendentes.length > 0) {
    const id = `pend-${pendentes.map(s => s.id).sort().join('-')}`;
    notifs.push({
      id,
      titulo: `${pendentes.length} solicitaç${pendentes.length === 1 ? 'ão pendente' : 'ões pendentes'}`,
      corpo: `Aguardando autorização: ${pendentes.map(s => s.obraNome).slice(0, 2).join(', ')}${pendentes.length > 2 ? ` e mais ${pendentes.length - 2}` : ''}`,
      href: '/obra/fabricacao',
      read: seen.has(id),
    });
  }

  const incompletas = sols.filter(
    s => s.statusAutorizacao === 'Autorizado' &&
      (s.saldoPainel > 0 || s.saldoPilar > 0 || s.saldoSapata > 0)
  );
  if (incompletas.length > 0) {
    const id = `incomp-${incompletas.map(s => s.id).sort().join('-')}`;
    notifs.push({
      id,
      titulo: `${incompletas.length} ordens em aberto`,
      corpo: `Fabricação incompleta: ${incompletas.map(s => s.obraNome).slice(0, 2).join(', ')}${incompletas.length > 2 ? ` +${incompletas.length - 2}` : ''}`,
      href: '/fabrica/controle',
      read: seen.has(id),
    });
  }

  return notifs;
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() =>
    localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const seenRef = useRef<Set<string>>(getSeenIds());

  const unread = notificacoes.filter(n => !n.read).length;

  const setEnabled = async (v: boolean) => {
    if (v && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        setEnabledState(false);
        localStorage.setItem(STORAGE_KEY, 'false');
        return;
      }
    }
    setEnabledState(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  };

  const markAllRead = () => {
    setNotificacoes(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      updated.forEach(n => seenRef.current.add(n.id));
      saveSeenIds(seenRef.current);
      return updated;
    });
  };

  const poll = async () => {
    try {
      const sols = await solicitacoesApi.listar();
      const built = buildNotifs(sols, seenRef.current);

      // Fire browser notifications for newly unread ones
      if (enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        built.filter(n => !n.read).forEach(n => {
          new Notification(n.titulo, { body: n.corpo, icon: '/favicon.ico', tag: n.id });
        });
      }

      setNotificacoes(built);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <NotificacoesContext.Provider value={{ enabled, permission, setEnabled, notificacoes, unread, markAllRead }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export const useNotificacoes = () => useContext(NotificacoesContext);
