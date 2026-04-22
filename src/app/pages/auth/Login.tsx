import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ghost, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Welcome back, Alex!');
      navigate('/');
    }, 1200);
  }

  const inputStyle = {
    width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
        className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
            <Ghost size={28} style={{ color: 'var(--gold)' }} />
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 20 }}>Ghost Trading Academy</h1>
          <span className="inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest" style={{ background: 'var(--gold-muted)', color: 'var(--gold)', border: '1px solid rgba(212,165,32,0.25)' }}>GHOST VIP</span>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded" style={{ accentColor: 'var(--gold)' }} />
              <label htmlFor="remember" className="text-xs" style={{ color: 'var(--text-muted)' }}>Remember me</label>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity" style={{ background: 'var(--gold)', color: '#0C0C0E', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
          </div>

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <button onClick={() => navigate('/auth/register')} className="font-semibold" style={{ color: 'var(--gold)' }}>Register</button>
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Need help?{' '}
          <button className="underline" style={{ color: 'var(--text-muted)' }}>Contact admin</button>
        </p>
      </motion.div>
    </div>
  );
}
