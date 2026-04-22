import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const ANNOUNCEMENTS = [
  { id: 1, border: 'var(--gold)', title: 'BTC SL moved to breakeven', time: '2 min ago', sub: 'Protecting profits on the BTC/USDT long signal. SL updated to $96,200.' },
  { id: 2, border: 'var(--g-success)', title: 'ETH TP1 hit ✓', time: '45 min ago', sub: 'First take profit hit on the ETH/USDT short. Move SL to entry.' },
  { id: 3, border: 'var(--g-info)', title: 'Weekly recap posted', time: '2 hrs ago', sub: 'May 12–17 weekly performance recap is now available in the community.' },
  { id: 4, border: 'rgba(148,163,184,0.5)', title: 'New PDF: Risk Management Mastery', time: '5 hrs ago', sub: 'New resource added to the Education Hub. 32 pages of risk management content.' },
];

const WINS = [
  { initials: 'JK', name: 'Jake K.', coin: 'BTC/USDT', time: '1h ago', pnl: '+6.2%', msg: 'Followed the signal perfectly — held through the retest and took TP2. Patience pays off 🙌', likes: 24 },
  { initials: 'SM', name: 'Sara M.', coin: 'SOL/USDT', time: '3h ago', pnl: '+5.1%', msg: 'SOL demand zone entry was textbook. Held all the way to TP3. Best trade this week!', likes: 18 },
  { initials: 'RL', name: 'Ryan L.', coin: 'BNB/USDT', time: '6h ago', pnl: '+3.8%', msg: 'OB+FVG confluence on BNB worked out perfectly. Ghost Trading signals on fire! 🔥', likes: 31 },
];

const RECAP_STATS = [
  { label: 'Trades', value: '12' },
  { label: 'Win Rate', value: '75%' },
  { label: 'Best Trade', value: '+8.1%' },
  { label: 'Total P&L', value: '+18.4%' },
];

const MONTHLY_SNAP = [
  { month: 'Jan', pnl: 12.4 }, { month: 'Feb', pnl: -3.2 }, { month: 'Mar', pnl: 18.6 },
  { month: 'Apr', pnl: 8.9 }, { month: 'May', pnl: 11.8 }, { month: 'Jun', pnl: null },
];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Community() {
  return (
    <div className="p-4 md:p-6 max-w-[1200px]">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Left column */}
        <div className="md:col-span-3 space-y-4">
          {/* Announcements */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
            className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Announcements</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {ANNOUNCEMENTS.map(a => (
                <div key={a.id} className="px-5 py-4 flex items-start gap-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: a.border }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{a.time}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Member wins */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.06 }}
            className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Member wins</p>
            </div>
            <div className="divide-y">
              {WINS.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  className="px-5 py-4" style={{ borderBottom: i < WINS.length - 1 ? '1px solid var(--bg-border)' : 'none' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: 'var(--g-success-muted)', color: 'var(--g-success)', border: '1px solid rgba(74,222,128,0.25)' }}>
                      {w.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{w.name}</span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{w.coin}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{w.time}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--g-success-muted)', color: 'var(--g-success)' }}>{w.pnl}</span>
                      </div>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{w.msg}</p>
                      <button className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <Heart size={12} /> {w.likes} likes
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4">
          {/* Weekly recap */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.12 }}
            className="p-5 rounded-2xl" style={card}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly recap</p>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>May 12–17</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RECAP_STATS.map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="font-mono font-bold text-base mt-0.5" style={{ color: s.value.startsWith('+') ? 'var(--g-success)' : s.value.endsWith('%') ? 'var(--gold)' : 'var(--text-primary)' }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>What we learned</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>Patience with entries paid off this week. Waiting for confirmed OB retests prevented chasing and improved win rate to 75%.</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Next week focus</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>Watch $99,200 resistance on BTC for a breakout or rejection. ETH $3,380 key resistance. Stay patient and wait for setups.</p>
              </div>
            </div>
          </motion.div>

          {/* Monthly snapshot */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.18 }}
            className="p-5 rounded-2xl" style={card}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly snapshot</p>
            <div className="grid grid-cols-3 gap-2">
              {MONTHLY_SNAP.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl text-center" style={{
                  background: m.pnl === null ? 'var(--bg-elevated)' : m.pnl >= 0 ? 'var(--g-success-muted)' : 'var(--g-danger-muted)',
                  border: `1px solid ${m.pnl === null ? 'var(--bg-border)' : m.pnl >= 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.month}</p>
                  <p className="font-mono font-bold text-xs mt-0.5" style={{ color: m.pnl === null ? 'var(--text-muted)' : m.pnl >= 0 ? 'var(--g-success)' : 'var(--g-danger)' }}>
                    {m.pnl === null ? '—' : `${m.pnl > 0 ? '+' : ''}${m.pnl}%`}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
