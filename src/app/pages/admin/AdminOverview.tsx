import { motion } from 'motion/react';
import { Users, Crown, Zap, BookOpen } from 'lucide-react';

const STATS = [
  { label: 'Total members', value: '248', icon: Users, color: 'var(--g-info)' },
  { label: 'VIP members', value: '91', icon: Crown, color: 'var(--gold)' },
  { label: 'Signals this month', value: '18', icon: Zap, color: 'var(--g-success)' },
  { label: 'Trades logged', value: '1,204', icon: BookOpen, color: 'var(--text-secondary)' },
];

const MEMBERS = [
  { name: 'Alex Rivera', email: 'alex@example.com', role: 'ADMIN', status: 'ACTIVE', joined: 'Jan 12, 2025' },
  { name: 'Sarah Kim', email: 'sarah@example.com', role: 'VIP', status: 'ACTIVE', joined: 'Feb 3, 2025' },
  { name: 'Jake Thompson', email: 'jake@example.com', role: 'MEMBER', status: 'TRIAL', joined: 'May 10, 2025' },
  { name: 'Lena Park', email: 'lena@example.com', role: 'VIP', status: 'EXPIRED', joined: 'Mar 1, 2025' },
  { name: 'Ryan Collins', email: 'ryan@example.com', role: 'VIP', status: 'ACTIVE', joined: 'Apr 5, 2025' },
];

const STATUS_STYLES: Record<string, [string, string]> = {
  ACTIVE: ['var(--g-success-muted)', 'var(--g-success)'],
  EXPIRED: ['var(--g-danger-muted)', 'var(--g-danger)'],
  TRIAL: ['rgba(251,191,36,0.13)', '#F59E0B'],
};

const ROLE_STYLES: Record<string, [string, string]> = {
  ADMIN: ['rgba(212,165,32,0.13)', 'var(--gold)'],
  VIP: ['rgba(212,165,32,0.08)', 'var(--gold)'],
  MEMBER: ['var(--bg-elevated)', 'var(--text-muted)'],
};

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function AdminOverview() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}>ADMIN</div>
        <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Admin Overview</h1>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-2xl" style={card}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <s.icon size={13} style={{ color: s.color }} />
              </div>
            </div>
            <p className="font-mono font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent members */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
        className="rounded-2xl overflow-hidden" style={card}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent members</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBERS.map((m, i) => (
                <tr key={i} className="transition-colors" style={{ borderBottom: i < MEMBERS.length - 1 ? '1px solid var(--bg-border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: ROLE_STYLES[m.role][0], color: ROLE_STYLES[m.role][1] }}>{m.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: STATUS_STYLES[m.status][0], color: STATUS_STYLES[m.status][1] }}>{m.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{m.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
