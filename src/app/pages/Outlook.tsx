import { motion } from 'motion/react';
import { XCircle } from 'lucide-react';

const COINS_TO_WATCH = [
  { coin: 'BTC/USDT', note: 'Key OB at 96,200–96,450. Watching for retest entry.' },
  { coin: 'ETH/USDT', note: 'Structure bullish on 4H. 3,180 is key support.' },
  { coin: 'SOL/USDT', note: 'Daily demand zone holding. Potential 10%+ move.' },
  { coin: 'XRP/USDT', note: 'Breaking out of 3-week consolidation. Watch 0.55.' },
];

const KEY_LEVELS = [
  { coin: 'BTC/USDT', resistance: '$98,200', support: '$96,200' },
  { coin: 'ETH/USDT', resistance: '$3,380', support: '$3,180' },
  { coin: 'SOL/USDT', resistance: '$189', support: '$174' },
  { coin: 'XRP/USDT', resistance: '$0.58', support: '$0.53' },
];

const AVOID = [
  'Chasing moves already 5%+ extended',
  'Trading during low volume hours (2–5 AM)',
  'FOMO entries without confirmed retest',
  'Overleveraging — keep risk at 1% max per trade',
];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Outlook() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1100px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="flex flex-wrap items-center gap-3">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 22 }}>Saturday, May 17, 2025</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Daily market outlook</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: 'var(--g-success-muted)', color: 'var(--g-success)', border: '1px solid rgba(74,222,128,0.25)' }}>BULLISH</span>
      </motion.div>

      {/* Market bias card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.06 }}
        className="p-5 rounded-2xl" style={{ ...card, borderLeft: '4px solid var(--g-success)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Market bias today</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Bitcoin is maintaining its bullish structure with price consolidating above the weekly order block at $96,200. The 4H structure shows a clear Break of Structure (BOS) to the upside with multiple higher highs forming. Ethereum is confirming with a clean BOS on the 4H chart. Overall HTF bias remains bullish across the top-cap altcoins. Key confluence zones are holding as support — this is a continuation environment, not a reversal setup. Focus on demand zone entries and avoid chasing breakouts. The macro environment supports further upside with reduced selling pressure from recent FUD cycle.
        </p>
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coins to watch */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.12 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Coins to watch</p>
          <div className="space-y-3">
            {COINS_TO_WATCH.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: 'var(--gold-muted)', color: 'var(--gold)', border: '1px solid rgba(212,165,32,0.2)' }}>{c.coin}</span>
                <p className="text-xs leading-relaxed pt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.note}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key levels */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.18 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Key levels</p>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                <th className="text-left pb-2 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Coin</th>
                <th className="text-left pb-2 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Resistance</th>
                <th className="text-left pb-2 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Support</th>
              </tr>
            </thead>
            <tbody>
              {KEY_LEVELS.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < KEY_LEVELS.length - 1 ? '1px solid var(--bg-border)' : 'none' }}>
                  <td className="py-2.5 text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{row.coin}</td>
                  <td className="py-2.5 text-xs font-mono" style={{ color: 'var(--g-danger)' }}>{row.resistance}</td>
                  <td className="py-2.5 text-xs font-mono" style={{ color: 'var(--g-success)' }}>{row.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* What to avoid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.24 }}
        className="p-5 rounded-2xl" style={{ ...card, borderLeft: '4px solid var(--g-danger)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>What to avoid today</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AVOID.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--g-danger-muted)', border: '1px solid rgba(248,113,113,0.18)' }}>
              <XCircle size={14} style={{ color: 'var(--g-danger)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
