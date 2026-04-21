import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Pencil, Copy, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const SIGNALS = [
  { id: 1, coin: 'BTC/USDT', dir: 'LONG', status: 'ACTIVE', rr: '2.4', posted: 'May 17, 08:32' },
  { id: 2, coin: 'ETH/USDT', dir: 'SHORT', status: 'PENDING', rr: '2.1', posted: 'May 17, 11:15' },
  { id: 3, coin: 'SOL/USDT', dir: 'LONG', status: 'WIN', rr: '2.6', posted: 'May 16, 06:50' },
  { id: 4, coin: 'BNB/USDT', dir: 'SHORT', status: 'CANCELLED', rr: '1.8', posted: 'May 14, 09:00' },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  ACTIVE: ['rgba(212,165,32,0.13)', 'var(--gold)'],
  PENDING: ['rgba(251,191,36,0.13)', '#F59E0B'],
  WIN: ['var(--g-success-muted)', 'var(--g-success)'],
  LOSS: ['var(--g-danger-muted)', 'var(--g-danger)'],
  CANCELLED: ['rgba(100,116,139,0.13)', '#64748B'],
};

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function AdminSignals() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    coin: 'BTC/USDT', dir: 'LONG' as 'LONG' | 'SHORT', entry: '', sl: '', tp1: '', tp2: '', tp3: '',
    risk: 'LOW' as 'LOW' | 'MED' | 'HIGH', tf: '4H', reasoning: '', vipOnly: true, status: 'ACTIVE',
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}>ADMIN</div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Signal Management</h1>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>
          <Plus size={14} /> Post signal
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {['Coin', 'Direction', 'Status', 'R:R', 'Posted', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNALS.map((s, i) => (
                <tr key={s.id} className="transition-colors" style={{ borderBottom: i < SIGNALS.length - 1 ? '1px solid var(--bg-border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3 text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{s.coin}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                      background: s.dir === 'LONG' ? 'var(--g-success-muted)' : 'var(--g-danger-muted)',
                      color: s.dir === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)',
                    }}>{s.dir}</span>
                  </td>
                  <td className="px-5 py-3">
                    <select defaultValue={s.status} className="text-[11px] font-bold px-2 py-1 rounded-lg outline-none"
                      style={{ background: STATUS_COLORS[s.status][0], color: STATUS_COLORS[s.status][1], border: 'none' }}
                      onChange={e => toast.success(`Status updated to ${e.target.value}`)}>
                      {['ACTIVE', 'PENDING', 'WIN', 'LOSS', 'CANCELLED'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--g-info)' }}>{s.rr}R</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{s.posted}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toast.info('Edit signal')} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}><Pencil size={12} /></button>
                      <button onClick={() => toast.success('Signal copied!')} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}><Copy size={12} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post signal drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-full max-w-md h-full flex flex-col shadow-2xl" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Post new signal</p>
              <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Coin pair</label>
                <input value={form.coin} onChange={e => setForm({ ...form, coin: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Direction</label>
                <div className="flex gap-2">
                  {(['LONG', 'SHORT'] as const).map(d => (
                    <button key={d} onClick={() => setForm({ ...form, dir: d })} className="flex-1 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: form.dir === d ? (d === 'LONG' ? 'var(--g-success-muted)' : 'var(--g-danger-muted)') : 'var(--bg-elevated)', color: form.dir === d ? (d === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)') : 'var(--text-muted)', border: `1px solid ${form.dir === d ? (d === 'LONG' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'var(--bg-border)'}` }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'entry', label: 'Entry Zone' }, { key: 'sl', label: 'Stop Loss' },
                  { key: 'tp1', label: 'TP 1' }, { key: 'tp2', label: 'TP 2' }, { key: 'tp3', label: 'TP 3' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Risk Level</label>
                <div className="flex gap-2">
                  {(['LOW', 'MED', 'HIGH'] as const).map(r => {
                    const colors: Record<string, string> = { LOW: 'var(--g-success)', MED: '#F59E0B', HIGH: 'var(--g-danger)' };
                    return (
                      <button key={r} onClick={() => setForm({ ...form, risk: r })} className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: form.risk === r ? `color-mix(in srgb, ${colors[r]} 15%, transparent)` : 'var(--bg-elevated)', color: form.risk === r ? colors[r] : 'var(--text-muted)', border: `1px solid ${form.risk === r ? colors[r] : 'var(--bg-border)'}` }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Timeframe</label>
                <select value={form.tf} onChange={e => setForm({ ...form, tf: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>
                  {['15m', '30m', '1H', '4H', '1D', '1W'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Reasoning</label>
                <textarea rows={4} value={form.reasoning} onChange={e => setForm({ ...form, reasoning: e.target.value })} placeholder="Explain the trade setup, confluences, and bias..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>VIP only</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Only visible to VIP members</p>
                </div>
                <button onClick={() => setForm({ ...form, vipOnly: !form.vipOnly })} className="w-10 h-5 rounded-full relative transition-colors"
                  style={{ background: form.vipOnly ? 'var(--gold)' : 'var(--bg-border)' }}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: form.vipOnly ? 'calc(100% - 18px)' : '2px' }} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={() => { toast.success('Signal posted!'); setDrawerOpen(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>Post signal</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteId(null)} />
          <div className="relative p-6 rounded-2xl w-full max-w-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delete signal?</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl text-sm" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={() => { toast.success('Signal deleted'); setDeleteId(null); }} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--g-danger)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
