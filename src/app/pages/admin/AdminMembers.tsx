import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Pause, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_MEMBERS = [
  { id: 1, name: 'Alex Rivera', email: 'alex@example.com', role: 'ADMIN', status: 'ACTIVE', expiry: '—' },
  { id: 2, name: 'Sarah Kim', email: 'sarah@example.com', role: 'VIP', status: 'ACTIVE', expiry: 'Aug 3, 2025' },
  { id: 3, name: 'Jake Thompson', email: 'jake@example.com', role: 'MEMBER', status: 'TRIAL', expiry: 'May 24, 2025' },
  { id: 4, name: 'Lena Park', email: 'lena@example.com', role: 'VIP', status: 'EXPIRED', expiry: 'May 1, 2025' },
  { id: 5, name: 'Ryan Collins', email: 'ryan@example.com', role: 'VIP', status: 'ACTIVE', expiry: 'Jul 5, 2025' },
  { id: 6, name: 'Mia Chen', email: 'mia@example.com', role: 'MEMBER', status: 'ACTIVE', expiry: '—' },
  { id: 7, name: 'Tom Reyes', email: 'tom@example.com', role: 'VIP', status: 'ACTIVE', expiry: 'Sep 10, 2025' },
];

const STATUS_STYLES: Record<string, [string, string]> = {
  ACTIVE: ['var(--g-success-muted)', 'var(--g-success)'],
  EXPIRED: ['var(--g-danger-muted)', 'var(--g-danger)'],
  TRIAL: ['rgba(251,191,36,0.13)', '#F59E0B'],
  SUSPENDED: ['rgba(100,116,139,0.13)', '#64748B'],
};

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function AdminMembers() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ id: number; role: string } | null>(null);

  function applyRoleChange() {
    if (!confirmRoleChange) return;
    setMembers(ms => ms.map(m => m.id === confirmRoleChange.id ? { ...m, role: confirmRoleChange.role } : m));
    toast.success('Role updated');
    setConfirmRoleChange(null);
  }

  function suspend(id: number) {
    setMembers(ms => ms.map(m => m.id === id ? { ...m, status: m.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : m));
    toast.success('Member status updated');
  }

  function remove(id: number) {
    setMembers(ms => ms.filter(m => m.id !== id));
    toast.success('Member removed');
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}>ADMIN</div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Member Management</h1>
        </div>
        <button onClick={() => toast.info('Add member coming soon')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>
          <Plus size={14} /> Add member
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="rounded-2xl overflow-hidden" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Expiry', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="transition-colors" style={{ borderBottom: i < members.length - 1 ? '1px solid var(--bg-border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                  <td className="px-5 py-3">
                    <select
                      defaultValue={m.role}
                      onChange={e => setConfirmRoleChange({ id: m.id, role: e.target.value })}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg outline-none"
                      style={{ background: 'var(--bg-elevated)', color: m.role === 'MEMBER' ? 'var(--text-muted)' : 'var(--gold)', border: '1px solid var(--bg-border)' }}>
                      {['MEMBER', 'VIP', 'ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: STATUS_STYLES[m.status]?.[0] ?? 'var(--bg-elevated)', color: STATUS_STYLES[m.status]?.[1] ?? 'var(--text-muted)' }}>{m.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono cursor-pointer" style={{ color: 'var(--text-muted)' }}
                    onClick={() => toast.info('Date picker coming soon')}>{m.expiry}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => suspend(m.id)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'rgba(251,191,36,0.13)', color: '#F59E0B' }}><Pause size={12} /></button>
                      <button onClick={() => remove(m.id)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Role change confirm dialog */}
      {confirmRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmRoleChange(null)} />
          <div className="relative p-6 rounded-2xl w-full max-w-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Change role?</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to change this member's role to <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{confirmRoleChange.role}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRoleChange(null)} className="flex-1 py-2 rounded-xl text-sm" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={applyRoleChange} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
