import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Lock, Copy, Crown, X } from 'lucide-react';
import { toast } from 'sonner';

const SIGNALS = [
  {
    id: 1, pair: 'BTC/USDT', dir: 'LONG', tf: '4H', status: 'ACTIVE',
    entry: '96,200–96,450', sl: '95,100', tp1: '97,800', tp2: '99,200', tp3: '101,500', rr: '2.4',
    time: '08:32 AM', risk: 'LOW',
    reason: 'Clean BOS on 4H with OB retest. HTF bias bullish. Multiple confluences confirmed across daily, 4H, and 1H. Volume spike at OB level.',
  },
  {
    id: 2, pair: 'ETH/USDT', dir: 'SHORT', tf: '1H', status: 'PENDING',
    entry: '3,280–3,300', sl: '3,360', tp1: '3,180', tp2: '3,060', tp3: '2,940', rr: '2.1',
    time: '11:15 AM', risk: 'MED',
    reason: 'Supply zone with FVG confluence. Daily bias bearish. Waiting for price to enter supply zone before entry activation.',
  },
  {
    id: 3, pair: 'SOL/USDT', dir: 'LONG', tf: '4H', status: 'WIN',
    entry: '174–176', sl: '169', tp1: '183', tp2: '189', tp3: '196', rr: '2.6',
    time: '06:50 AM', risk: 'LOW',
    reason: 'Weekly OB holding. Strong demand with multiple timeframe confluence. TP3 hit at $196. All targets taken.',
  },
];

const STATUS_COLORS: Record<string, [string, string]> = {
  ACTIVE: ['rgba(212,165,32,0.13)', 'var(--gold)'],
  PENDING: ['rgba(251,191,36,0.13)', '#F59E0B'],
  WIN: ['var(--g-success-muted)', 'var(--g-success)'],
  LOSS: ['var(--g-danger-muted)', 'var(--g-danger)'],
  CANCELLED: ['rgba(100,116,139,0.13)', '#64748B'],
};

const RISK_COLORS: Record<string, string> = {
  LOW: 'var(--g-success)', MED: '#F59E0B', HIGH: 'var(--g-danger)',
};

const FILTERS = ['All', 'Active', 'Pending', 'Win', 'Loss', 'Cancelled'];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Signals() {
  const [filter, setFilter] = useState('All');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1000px]">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm transition-colors"
            style={{
              background: filter === f ? 'var(--gold)' : 'var(--bg-elevated)',
              color: filter === f ? '#0C0C0E' : 'var(--text-muted)',
              fontWeight: filter === f ? 600 : 400,
              border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--bg-border)'}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div className="space-y-4">
        {SIGNALS.filter(s => filter === 'All' || s.status.toLowerCase() === filter.toLowerCase()).map((sig, i) => (
          <motion.div key={sig.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.08 }}
            className="rounded-2xl overflow-hidden"
            style={{ ...card, borderLeft: `4px solid ${sig.dir === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)'}` }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: sig.dir === 'LONG' ? 'var(--g-success-muted)' : 'var(--g-danger-muted)' }}>
                  {sig.dir === 'LONG' ? <ArrowUpRight size={16} style={{ color: 'var(--g-success)' }} /> : <ArrowDownRight size={16} style={{ color: 'var(--g-danger)' }} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: 16 }}>{sig.pair}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>{sig.tf}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: STATUS_COLORS[sig.status][0], color: STATUS_COLORS[sig.status][1] }}>{sig.status}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: sig.dir === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)' }}>{sig.dir}</span>
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{sig.time}</span>
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              {[
                { label: 'Entry Zone', value: sig.entry, color: 'var(--text-primary)' },
                { label: 'Stop Loss', value: sig.sl, color: 'var(--g-danger)' },
                { label: 'TP 1', value: sig.tp1, color: 'var(--g-success)' },
                { label: 'TP 2', value: sig.tp2, color: 'var(--g-success)' },
                { label: 'TP 3', value: sig.tp3, color: 'var(--g-success)' },
                { label: 'R:R', value: `${sig.rr}R`, color: 'var(--g-info)' },
              ].map((cell, ci) => (
                <div key={ci} className="px-4 py-3" style={{ borderRight: ci < 5 ? '1px solid var(--bg-border)' : 'none' }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{cell.label}</p>
                  <p className="font-mono font-semibold text-xs" style={{ color: cell.color }}>{cell.value}</p>
                </div>
              ))}
            </div>

            {/* Reasoning */}
            <div className="px-5 pt-3 pb-1">
              <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--gold-muted)', border: '1px solid rgba(212,165,32,0.2)' }}>
                <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  💡 {sig.reason}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sig.dir === 'LONG' ? 'var(--g-success-muted)' : 'var(--g-danger-muted)', color: sig.dir === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)' }}>{sig.dir}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: RISK_COLORS[sig.risk], border: '1px solid var(--bg-border)' }}>Risk: {sig.risk}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>{sig.tf}</span>
              </div>
              <button onClick={() => toast.success(`${sig.pair} signal copied!`)} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--gold)' }}>
                <Copy size={12} /> Copy signal
              </button>
            </div>
          </motion.div>
        ))}

        {/* VIP gated card */}
        {filter === 'All' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.32 }}
            className="rounded-2xl overflow-hidden relative" style={{ ...card, borderLeft: '4px solid var(--gold)' }}>
            <div className="blur-sm pointer-events-none select-none px-5 py-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full" style={{ background: 'var(--gold-muted)' }} />
                <div className="space-y-1">
                  <div className="h-4 w-28 rounded" style={{ background: 'var(--bg-elevated)' }} />
                  <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-elevated)' }} />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded" style={{ background: 'var(--bg-elevated)' }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl" style={{ background: 'rgba(12,12,14,0.82)' }}>
              <Lock size={28} style={{ color: 'var(--gold)' }} className="mb-3" />
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontSize: 15 }}>VIP Members Only</p>
              <p className="text-xs text-center max-w-[240px] mb-4" style={{ color: 'var(--text-muted)' }}>Upgrade to unlock all signals, daily outlook, and premium resources</p>
              <button onClick={() => setUpgradeOpen(true)} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>
                Upgrade to VIP
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const features = [
    'All VIP signals — entry zones, SL, TP, and full reasoning',
    'Daily market outlook and watchlist',
    'Premium education library (PDFs & videos)',
    'Priority trade alerts and TP/SL updates',
    'Member community and weekly recaps',
    'Professional position sizing tools',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-[480px] rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
          <X size={14} />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
            <Crown size={28} style={{ color: 'var(--gold)' }} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 22 }}>Unlock Apex VIP</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Get access to every signal, resource, and premium feature</p>
        </div>
        <ul className="space-y-2.5 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-sm font-bold mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }}>✓</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-xl" style={{ border: '1px solid var(--bg-border)', background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Monthly</p>
            <p className="font-mono font-bold mb-0.5" style={{ color: 'var(--text-primary)', fontSize: 24 }}>$49<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/mo</span></p>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Cancel anytime</p>
            <button className="w-full py-2 rounded-lg text-sm" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>Select Monthly</button>
          </div>
          <div className="p-4 rounded-xl relative" style={{ border: '2px solid var(--gold)', background: 'var(--gold-muted)' }}>
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>POPULAR</span>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>3 Months</p>
            <p className="font-mono font-bold mb-0.5" style={{ color: 'var(--text-primary)', fontSize: 24 }}>$119<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/3mo</span></p>
            <p className="text-[11px] mb-3" style={{ color: 'var(--g-success)' }}>Save $28 vs monthly</p>
            <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>Select 3 Months</button>
          </div>
        </div>
        <div className="text-center pt-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Contact admin to activate your subscription</p>
          <button onClick={() => toast.info('Opening Telegram...')} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--g-info-muted)', color: 'var(--g-info)', border: '1px solid rgba(147,197,253,0.2)' }}>
            📱 Message on Telegram
          </button>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>Manually activated within 24 hours</p>
        </div>
      </motion.div>
    </div>
  );
}
