import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BIASES = [
  { key: 'BULLISH', color: 'var(--g-success)', bg: 'var(--g-success-muted)', border: 'rgba(74,222,128,0.3)' },
  { key: 'BEARISH', color: 'var(--g-danger)', bg: 'var(--g-danger-muted)', border: 'rgba(248,113,113,0.3)' },
  { key: 'NEUTRAL', color: '#94A3B8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.3)' },
  { key: 'RANGING', color: '#F59E0B', bg: 'rgba(251,191,36,0.13)', border: 'rgba(251,191,36,0.3)' },
];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function AdminOutlook() {
  const [bias, setBias] = useState('BULLISH');
  const [biasText, setBiasText] = useState('');
  const [coins, setCoins] = useState([
    { coin: 'BTC/USDT', note: '' }, { coin: 'ETH/USDT', note: '' },
  ]);
  const [levels, setLevels] = useState([
    { coin: 'BTC/USDT', resistance: '', support: '' },
    { coin: 'ETH/USDT', resistance: '', support: '' },
  ]);
  const [avoids, setAvoids] = useState(['Chasing extended moves', 'Trading low volume hours']);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[900px]">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}>ADMIN</div>
        <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Post Daily Outlook</h1>
      </div>

      {/* Market bias */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="p-5 rounded-2xl" style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Market bias</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {BIASES.map(b => (
            <button key={b.key} onClick={() => setBias(b.key)} className="py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: bias === b.key ? b.bg : 'var(--bg-elevated)',
                color: bias === b.key ? b.color : 'var(--text-muted)',
                border: `1px solid ${bias === b.key ? b.border : 'var(--bg-border)'}`,
                transform: bias === b.key ? 'scale(1.02)' : 'scale(1)',
              }}>
              {b.key}
            </button>
          ))}
        </div>
        <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Bias explanation</label>
        <textarea rows={4} value={biasText} onChange={e => setBiasText(e.target.value)} placeholder="Explain today's market bias, key confluences, and overall direction..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
      </motion.div>

      {/* Coins to watch */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.06 }}
        className="p-5 rounded-2xl" style={card}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Coins to watch</p>
          <button onClick={() => setCoins([...coins, { coin: '', note: '' }])} className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
            <Plus size={12} /> Add coin
          </button>
        </div>
        <div className="space-y-2">
          {coins.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={c.coin} onChange={e => setCoins(cs => cs.map((x, j) => j === i ? { ...x, coin: e.target.value } : x))} placeholder="Pair" className="w-28 px-3 py-2 rounded-lg text-sm font-mono outline-none flex-shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              <input value={c.note} onChange={e => setCoins(cs => cs.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} placeholder="Note about this coin..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              <button onClick={() => setCoins(cs => cs.filter((_, j) => j !== i))} className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key levels */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.12 }}
        className="p-5 rounded-2xl" style={card}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Key levels</p>
          <button onClick={() => setLevels([...levels, { coin: '', resistance: '', support: '' }])} className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
            <Plus size={12} /> Add level
          </button>
        </div>
        <div className="space-y-2">
          {levels.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.coin} onChange={e => setLevels(ls => ls.map((x, j) => j === i ? { ...x, coin: e.target.value } : x))} placeholder="Pair" className="w-28 px-3 py-2 rounded-lg text-sm font-mono outline-none flex-shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              <input value={l.resistance} onChange={e => setLevels(ls => ls.map((x, j) => j === i ? { ...x, resistance: e.target.value } : x))} placeholder="Resistance" className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--g-danger)' }} />
              <input value={l.support} onChange={e => setLevels(ls => ls.map((x, j) => j === i ? { ...x, support: e.target.value } : x))} placeholder="Support" className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--g-success)' }} />
              <button onClick={() => setLevels(ls => ls.filter((_, j) => j !== i))} className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What to avoid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.18 }}
        className="p-5 rounded-2xl" style={card}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>What to avoid today</p>
          <button onClick={() => setAvoids([...avoids, ''])} className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
            <Plus size={12} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {avoids.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={a} onChange={e => setAvoids(as => as.map((x, j) => j === i ? e.target.value : x))} placeholder="What traders should avoid..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              <button onClick={() => setAvoids(as => as.filter((_, j) => j !== i))} className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: 'var(--g-danger-muted)', color: 'var(--g-danger)' }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <div className="flex justify-end">
        <button onClick={() => toast.success('Daily outlook posted!')} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>
          Post outlook
        </button>
      </div>
    </div>
  );
}
