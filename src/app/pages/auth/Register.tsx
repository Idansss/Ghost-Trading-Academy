import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Ghost, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#F87171', '#F59E0B', '#60A5FA', '#4ADE80'];

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => getStrength(password), [password]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!terms) { toast.error('Please accept the terms'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Account created! Welcome to Ghost Trading.');
      navigate('/');
    }, 1400);
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
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
            <Ghost size={28} style={{ color: 'var(--gold)' }} />
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 20 }}>Create your account</h1>
          <span className="inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest" style={{ background: 'var(--gold-muted)', color: 'var(--gold)', border: '1px solid rgba(212,165,32,0.25)' }}>APEX VIP</span>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Rivera" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" required style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(s => (
                      <div key={s} className="flex-1 h-1 rounded-full transition-colors" style={{ background: s <= strength ? STRENGTH_COLORS[strength] : 'var(--bg-elevated)' }} />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, borderColor: confirm && confirm !== password ? 'var(--g-danger)' : 'var(--bg-border)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderColor = confirm && confirm !== password ? 'var(--g-danger)' : 'var(--bg-border)')} />
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5" style={{ accentColor: 'var(--gold)' }} />
              <label htmlFor="terms" className="text-xs" style={{ color: 'var(--text-muted)' }}>
                I agree to the <span style={{ color: 'var(--gold)' }}>Terms of Service</span> and <span style={{ color: 'var(--gold)' }}>Privacy Policy</span>
              </label>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button onClick={() => navigate('/auth/login')} className="font-semibold" style={{ color: 'var(--gold)' }}>Sign in</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
