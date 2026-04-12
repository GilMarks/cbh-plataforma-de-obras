import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowRight, Factory, BarChart3, Wrench, type LucideIcon } from 'lucide-react';
import { getAll, setCurrentUser } from '../lib/storage';
import { STORAGE_KEYS, type Usuario } from '../lib/types';
import { getPrimeiraRotaPermitida } from '../lib/permissions';
import logoWhite from '../assets/logo-white.png';
import logoFull from '../assets/logo-full.png';

interface Feature { icon: LucideIcon; title: string; desc: string }

const FEATURES: Feature[] = [
  { icon: Factory,  title: 'Controle de Fabricação', desc: 'Rastreio em tempo real de painéis, pilares e sapatas.' },
  { icon: BarChart3, title: 'Gestão Financeira',     desc: 'Fluxo de caixa, contas a pagar e visão executiva.' },
  { icon: Wrench,   title: 'Rastreio de Ferramentas', desc: 'Controle de estoque de materiais e equipamentos.' },
];

export default function Login() {
  const navigate = useNavigate();
  const [login, setLogin]           = useState('');
  const [senha, setSenha]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const usuarios = getAll<Usuario>(STORAGE_KEYS.USUARIOS);
      const user = usuarios.find(u => u.login === login && u.senha === senha && u.ativo === 1);

      if (!user) {
        setError('Usuário ou senha inválidos');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      navigate(getPrimeiraRotaPermitida(user.cargo));
    }, 500);
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col overflow-hidden relative"
        style={{ width: '45%', backgroundColor: '#0d1117', padding: '56px 48px' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.07,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 3, background: 'linear-gradient(90deg, #004ac6, #2563eb, transparent)' }}
        />

        <div className="relative z-10">
          <img src={logoWhite} alt="CBH" className="h-11 w-auto object-contain" />
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p style={{ fontSize: 11, fontWeight: 800, color: '#004ac6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            Plataforma Industrial
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Construction<br />Business Hub
          </h1>
          <p style={{ fontSize: 15, color: '#8b949e', lineHeight: 1.6, maxWidth: 340, marginBottom: 48 }}>
            Gestão inteligente para a indústria de pré-moldados. Produção, finanças e obras em um único lugar.
          </p>

          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 rounded-[10px]"
                style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-lg p-2"
                  style={{ color: '#004ac6', backgroundColor: 'rgba(0,74,198,0.15)' }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10" style={{ fontSize: 11, color: '#30363d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          CBH V2.3 &copy; 2026
        </p>
      </div>

      {/* Right panel — form */}
      <div className="bg-surface flex-1 flex flex-col items-center justify-center px-8 py-14">

        <div className="lg:hidden mb-10 text-center">
          <img src={logoFull} alt="CBH" className="h-9 w-auto object-contain" />
        </div>

        <div className="bg-surface-container-lowest w-full rounded-[16px]" style={{ maxWidth: 500, border: '1px solid var(--color-border)', padding: '52px 60px' }}>

          <div className="mb-10">
            <h2 className="text-text-primary" style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Bem-Vindo ao sistema
            </h2>
            <p className="text-text-secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Insira suas credenciais para acessar a plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Usuário */}
            <div>
              <label className="block text-text-muted mb-1.5" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Usuário
              </label>
              <div className="relative">
                <User size={15} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="ex: engenheiro_chefe"
                  required
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 16 }}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-text-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Senha
                </label>
                <button type="button" className="text-primary" style={{ fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-text-muted hover:text-text-primary transition-colors absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-0.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Lembrar */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="text-text-secondary" style={{ fontSize: 13 }}>Lembrar deste dispositivo</span>
            </label>

            {/* Erro */}
            {error && (
              <div
                className="bg-danger-bg text-danger-text rounded-lg px-4 py-3"
                style={{ border: '1px solid rgba(220,38,38,0.25)', fontSize: 13, fontWeight: 500 }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? 'Entrando...' : 'Entrar na plataforma'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-text-muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              CBH V2.3 &copy; 2026 — Gestão de Precisão Industrial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
