import { useState } from 'react';
import { Shield, Settings as SettingsIcon, Sun, Moon, Monitor } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../lib/storage';
import { usuarios as usuariosApi } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificacoes } from '../contexts/NotificacoesContext';

export default function Configuracoes() {
  const user = getCurrentUser()!;
  const { mode, setMode } = useTheme();
  const { enabled: notificacoes, permission, setEnabled: setNotificacoes } = useNotificacoes();
  const [nome, setNome] = useState(user.login);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [departamento] = useState(user.cargo);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    usuariosApi.atualizar(user.id, { login: nome }).then(() => {
      setCurrentUser({ ...user, login: nome });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '960px' }}>

      {/* ── Page Header ── */}
      <div>
        <h1
          className="font-extrabold text-text-primary tracking-tight"
          style={{ fontSize: '28px', lineHeight: 1.2 }}
        >
          Configuracoes de Perfil
        </h1>
        <p
          className="text-text-secondary font-medium"
          style={{ fontSize: '14px', marginTop: '6px' }}
        >
          Gerencie suas informacoes pessoais, seguranca e preferencias do sistema.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div
        className="bg-surface-container-lowest"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '32px' }}
      >
        {/* Avatar + Info */}
        <div className="flex items-center" style={{ gap: '20px', marginBottom: '28px' }}>
          <div
            className="bg-primary-container flex items-center justify-center text-white font-bold"
            style={{ width: '64px', height: '64px', borderRadius: '50%', fontSize: '22px', flexShrink: 0 }}
          >
            {nome.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="font-bold text-text-primary" style={{ fontSize: '18px' }}>{nome}</h3>
            <span
              className="inline-flex items-center font-bold bg-primary-fixed text-primary uppercase tracking-wider"
              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', marginTop: '6px' }}
            >
              {user.cargo}
            </span>
            <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
              Atualize sua foto e detalhes pessoais aqui.
            </p>
          </div>
          <button
            className="bg-primary text-white font-bold hover:bg-primary-dark transition-all"
            style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '13px', flexShrink: 0 }}
          >
            Alterar Foto
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-surface-container-low text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Email Corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@erpindustrial.com.br"
              className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Telefone
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="+55 (11) 98765-4321"
              className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Departamento
            </label>
            <input
              type="text"
              value={departamento}
              readOnly
              className="w-full bg-surface-container text-text-secondary cursor-not-allowed"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Security ── */}
      <div
        className="bg-surface-container-lowest"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '32px' }}
      >
        <div className="flex items-center" style={{ gap: '10px', marginBottom: '24px' }}>
          <div
            className="bg-surface-container-low flex items-center justify-center"
            style={{ width: '40px', height: '40px', borderRadius: '10px' }}
          >
            <Shield size={20} className="text-text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary" style={{ fontSize: '16px' }}>Seguranca</h3>
            <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Altere sua senha de acesso ao sistema</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Senha Atual
            </label>
            <input
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              placeholder="••••••"
              className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Nova Senha
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Minimo 8 caracteres"
              className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full bg-surface-container-low text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              style={{ padding: '12px 20px', fontSize: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div
        className="bg-surface-container-lowest"
        style={{ borderRadius: '12px', border: '1px solid var(--color-border)', padding: '32px' }}
      >
        <div className="flex items-center" style={{ gap: '10px', marginBottom: '24px' }}>
          <div
            className="bg-surface-container-low flex items-center justify-center"
            style={{ width: '40px', height: '40px', borderRadius: '10px' }}
          >
            <SettingsIcon size={20} className="text-text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary" style={{ fontSize: '16px' }}>Preferencias do Sistema</h3>
            <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Personalize a aparencia e notificacoes</p>
          </div>
        </div>

        {/* Theme Selector */}
        <p className="font-extrabold text-text-primary uppercase tracking-widest" style={{ fontSize: '11px', marginBottom: '12px' }}>
          Tema da Interface
        </p>
        <div className="flex" style={{ gap: '12px', marginBottom: '28px' }}>
          {([
            { key: 'light' as const, icon: Sun, label: 'Claro' },
            { key: 'dark' as const, icon: Moon, label: 'Escuro' },
            { key: 'system' as const, icon: Monitor, label: 'Sistema' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex flex-col items-center transition-all ${
                mode === key
                  ? 'bg-primary-fixed text-primary'
                  : 'bg-surface-container-lowest text-text-secondary hover:bg-surface-container-high/50'
              }`}
              style={{
                gap: '8px',
                padding: '20px 32px',
                borderRadius: '10px',
                border: mode === key ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              }}
            >
              <Icon size={22} />
              <span className="font-bold" style={{ fontSize: '12px' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Notifications Toggle */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(195, 198, 215, 0.15)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary" style={{ fontSize: '14px' }}>Notificacoes no Navegador</p>
              <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>Receba alertas de novas ordens e prazos</p>
            </div>
            <button
              onClick={() => setNotificacoes(!notificacoes)}
              disabled={permission === 'denied'}
              className={`transition-colors ${notificacoes ? 'bg-primary' : 'bg-surface-container-high'}`}
              style={{ width: '44px', height: '24px', borderRadius: '12px', position: 'relative', flexShrink: 0, opacity: permission === 'denied' ? 0.5 : 1, cursor: permission === 'denied' ? 'not-allowed' : 'pointer' }}
            >
              <div
                className="bg-white"
                style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  position: 'absolute', top: '2px',
                  left: notificacoes ? '22px' : '2px',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>
          {permission === 'denied' && (
            <p className="text-warning" style={{ fontSize: '12px', marginTop: '8px' }}>
              Permissão bloqueada pelo navegador. Acesse as configurações do navegador para permitir notificações deste site.
            </p>
          )}
          {permission === 'default' && !notificacoes && (
            <p className="text-text-muted" style={{ fontSize: '12px', marginTop: '8px' }}>
              Ao ativar, o navegador pedirá sua permissão.
            </p>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end" style={{ gap: '12px' }}>
        <button
          className="text-text-secondary hover:text-text-primary transition-colors"
          style={{ padding: '12px 20px', fontSize: '13px' }}
        >
          Descartar Alteracoes
        </button>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-primary-dark text-white font-bold transition-all"
          style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '13px' }}
        >
          {saved ? 'Salvo!' : 'Salvar Perfil'}
        </button>
      </div>
    </div>
  );
}
