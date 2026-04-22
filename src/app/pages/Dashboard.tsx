import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

const equityData = [
  { date: 'May 1', balance: 10000 }, { date: 'May 2', balance: 10180 }, { date: 'May 3', balance: 10050 },
  { date: 'May 4', balance: 10320 }, { date: 'May 5', balance: 10210 }, { date: 'May 6', balance: 10480 },
  { date: 'May 7', balance: 10700 }, { date: 'May 8', balance: 10580 }, { date: 'May 9', balance: 10820 },
  { date: 'May 10', balance: 10960 }, { date: 'May 11', balance: 10750 }, { date: 'May 12', balance: 11100 },
  { date: 'May 13', balance: 11280 }, { date: 'May 14', balance: 11050 }, { date: 'May 15', balance: 11340 },
  { date: 'May 16', balance: 11620 }, { date: 'May 17', balance: 11800 }, { date: 'May 18', balance: 11550 },
  { date: 'May 19', balance: 11900 }, { date: 'May 20', balance: 12100 }, { date: 'May 21', balance: 11980 },
  { date: 'May 22', balance: 12250 }, { date: 'May 23', balance: 12150 }, { date: 'May 24', balance: 12400 },
  { date: 'May 25', balance: 12300 }, { date: 'May 26', balance: 12550 }, { date: 'May 27', balance: 12420 },
  { date: 'May 28', balance: 12680 }, { date: 'May 29', balance: 12750 }, { date: 'May 30', balance: 12800 },
];

const monthlyPnl = [
  { month: 'Jan', pnl: 12.4 }, { month: 'Feb', pnl: -3.2 }, { month: 'Mar', pnl: 18.6 },
  { month: 'Apr', pnl: 8.9 }, { month: 'May', pnl: 11.8 },
];

const trades = [
  { pair: 'BTC/USDT', dir: 'LONG', entry: '$96,450', rr: '2.4R', setup: 'OB Retest', outcome: 'WIN', pnl: '+3.8%' },
  { pair: 'ETH/USDT', dir: 'SHORT', entry: '$3,290', rr: '2.1R', setup: 'Supply FVG', outcome: 'PENDING', pnl: '—' },
  { pair: 'SOL/USDT', dir: 'LONG', entry: '$174.50', rr: '2.6R', setup: 'Demand Zone', outcome: 'WIN', pnl: '+5.1%' },
  { pair: 'XRP/USDT', dir: 'LONG', entry: '$0.548', rr: '1.8R', setup: 'BOS Retest', outcome: 'LOSS', pnl: '-1.0%' },
  { pair: 'BNB/USDT', dir: 'SHORT', entry: '$612.00', rr: '2.3R', setup: 'OB+FVG', outcome: 'WIN', pnl: '+2.9%' },
];

const kpis = [
  { label: 'Total P&L (May)', value: '+11.8%', color: 'var(--g-success)', sub: '+$1,180 this month', trend: 'up' },
  { label: 'Win Rate', value: '75%', color: 'var(--gold)', sub: '9 of 12 trades', trend: 'up' },
  { label: 'Avg R:R', value: '2.3R', color: 'var(--g-info)', sub: 'Target: ≥2R', trend: 'up' },
  { label: 'Total Trades', value: '12', color: 'var(--text-primary)', sub: 'May 2025', trend: null },
];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

type TooltipPayloadItem = {
  value?: number;
  name?: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const name = payload[0]?.name;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-mono font-semibold">{name === 'pnl' ? `${value > 0 ? '+' : ''}${value}%` : `$${value.toLocaleString()}`}</p>
    </div>
  );
};

export function Dashboard() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px]">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.06 }}
            className="p-4 rounded-2xl"
            style={card}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</p>
            <p className="font-mono text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.trend === 'up' && <TrendingUp size={11} style={{ color: 'var(--g-success)' }} />}
              {kpi.trend === 'down' && <TrendingDown size={11} style={{ color: 'var(--g-danger)' }} />}
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Equity Curve */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.24 }}
          className="md:col-span-3 p-5 rounded-2xl" style={card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Equity Curve</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>May 2025</p>
            </div>
            <span className="font-mono text-sm font-semibold" style={{ color: 'var(--g-success)' }}>$12,800</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={equityData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" stroke="#4ADE80" strokeWidth={2} fill="url(#equityGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly P&L */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.30 }}
          className="md:col-span-2 p-5 rounded-2xl" style={card}>
          <div className="mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly P&L</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>2025 performance</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyPnl} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPnl.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? '#4ADE80' : '#F87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Trades */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.36 }}
          className="md:col-span-2 rounded-2xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Trades</p>
            <button className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--gold)' }}>
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  {['Pair', 'Direction', 'Entry', 'R:R', 'Setup', 'Outcome', 'P&L'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} className="transition-colors" style={{ borderBottom: i < trades.length - 1 ? '1px solid var(--bg-border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{t.pair}</td>
                    <td className="px-4 py-3">
                      <DirPill dir={t.dir} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{t.entry}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--g-info)' }}>{t.rr}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{t.setup}</td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={t.outcome} /></td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: t.pnl.startsWith('+') ? 'var(--g-success)' : t.pnl.startsWith('-') ? 'var(--g-danger)' : 'var(--text-muted)' }}>{t.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Side cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.42 }}
          className="flex flex-col gap-4">
          {/* Today's Bias */}
          <div className="p-4 rounded-2xl" style={card}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Today&apos;s Bias</p>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--g-success-muted)', color: 'var(--g-success)' }}>BULLISH</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              BTC is holding above the weekly OB at $96,200. Structure is bullish on the 4H. Multiple confluences align for continuation to $99,200. ETH confirming with clean BOS.
            </p>
          </div>
          {/* Active Signals */}
          <div className="p-4 rounded-2xl" style={card}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Signals</p>
              <span className="font-mono font-bold text-sm" style={{ color: 'var(--gold)' }}>3 active</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>BTC/USDT, ETH/USDT, SOL/USDT currently live</p>
            <button className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--gold)' }}>
              View signals <ArrowUpRight size={12} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DirPill({ dir }: { dir: string }) {
  const isLong = dir === 'LONG';
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
      background: isLong ? 'var(--g-success-muted)' : 'var(--g-danger-muted)',
      color: isLong ? 'var(--g-success)' : 'var(--g-danger)'
    }}>{dir}</span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, [string, string]> = {
    WIN: ['var(--g-success-muted)', 'var(--g-success)'],
    LOSS: ['var(--g-danger-muted)', 'var(--g-danger)'],
    PENDING: ['rgba(251,191,36,0.13)', '#F59E0B'],
    BREAKEVEN: ['rgba(148,163,184,0.13)', '#94A3B8'],
    CANCELLED: ['rgba(100,116,139,0.13)', '#64748B'],
  };
  const [bg, color] = styles[outcome] || styles.BREAKEVEN;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: bg, color }}>{outcome}</span>
  );
}
