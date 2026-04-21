import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend
} from 'recharts';
import { Star, TrendingDown, Target, Calendar, AlertTriangle, Flame } from 'lucide-react';

const MONTHLY_DATA = [
  { month: 'January', trades: 14, wins: 11, losses: 3, winRate: 78.6, pnl: 12.4 },
  { month: 'February', trades: 10, wins: 6, losses: 4, winRate: 60.0, pnl: -3.2 },
  { month: 'March', trades: 18, wins: 15, losses: 3, winRate: 83.3, pnl: 18.6 },
  { month: 'April', trades: 12, wins: 9, losses: 3, winRate: 75.0, pnl: 8.9 },
  { month: 'May', trades: 12, wins: 9, losses: 3, winRate: 75.0, pnl: 11.8 },
];

const monthlyPnl = [
  { month: 'Jan', pnl: 12.4 }, { month: 'Feb', pnl: -3.2 }, { month: 'Mar', pnl: 18.6 },
  { month: 'Apr', pnl: 8.9 }, { month: 'May', pnl: 11.8 },
];

const cumulativeEquity = [
  { month: 'Jan', equity: 11240 }, { month: 'Feb', equity: 10880 }, { month: 'Mar', equity: 12904 },
  { month: 'Apr', equity: 14053 }, { month: 'May', equity: 15712 },
];

const winLossData = [
  { name: 'WIN', value: 75, fill: '#4ADE80' },
  { name: 'LOSS', value: 25, fill: '#F87171' },
];

const setupData = [
  { setup: 'Break & Retest', rate: 80 },
  { setup: 'OB + FVG', rate: 75 },
  { setup: 'Demand Zone', rate: 67 },
  { setup: 'Liquidity Sweep', rate: 50 },
];

const INSIGHTS = [
  { icon: Star, border: 'var(--gold)', bg: 'var(--gold-muted)', title: 'Best month: March', detail: '+18.6% — your strongest month' },
  { icon: TrendingDown, border: 'var(--g-danger)', bg: 'var(--g-danger-muted)', title: 'Rough month: February', detail: '-3.2% — review those trades' },
  { icon: Target, border: 'var(--gold)', bg: 'var(--gold-muted)', title: 'Top setup: Break & Retest', detail: '80% win rate across 12 trades' },
  { icon: Calendar, border: 'var(--gold)', bg: 'var(--gold-muted)', title: 'Best day: Tuesday', detail: '82% win rate on Tuesdays' },
  { icon: AlertTriangle, border: 'var(--g-danger)', bg: 'var(--g-danger-muted)', title: 'Avoid Fridays', detail: 'Highest loss rate on Fridays (3 of 4)' },
  { icon: Flame, border: 'var(--g-success)', bg: 'var(--g-success-muted)', title: '3-trade win streak 🔥', detail: 'Stay disciplined and stick to the plan' },
];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-mono font-semibold">{typeof payload[0]?.value === 'number' && payload[0]?.name === 'pnl' ? `${payload[0].value > 0 ? '+' : ''}${payload[0].value}%` : payload[0]?.name === 'equity' ? `$${payload[0].value?.toLocaleString()}` : `${payload[0]?.value}%`}</p>
    </div>
  );
};

export function Analytics() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Monthly performance table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="rounded-2xl overflow-hidden" style={card}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {['Month', 'Trades', 'Wins', 'Losses', 'Win Rate', 'P&L %'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_DATA.map((row, i) => {
                const isCurrent = row.month === 'May';
                return (
                  <tr key={i} style={{
                    background: isCurrent ? 'var(--gold-muted)' : 'transparent',
                    borderBottom: i < MONTHLY_DATA.length - 1 ? '1px solid var(--bg-border)' : 'none',
                  }}>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: isCurrent ? 'var(--gold)' : 'var(--text-primary)', fontWeight: isCurrent ? 600 : 400 }}>
                      {row.month} {isCurrent && <span className="text-[10px] ml-1" style={{ color: 'var(--gold)' }}>← current</span>}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{row.trades}</td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--g-success)' }}>{row.wins}</td>
                    <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--g-danger)' }}>{row.losses}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)', maxWidth: 80 }}>
                          <div className="h-full rounded-full" style={{ width: `${row.winRate}%`, background: row.winRate >= 70 ? 'var(--g-success)' : row.winRate >= 50 ? 'var(--gold)' : 'var(--g-danger)' }} />
                        </div>
                        <span className="text-xs font-mono font-semibold" style={{ color: row.winRate >= 70 ? 'var(--g-success)' : 'var(--text-secondary)' }}>{row.winRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono font-semibold" style={{ color: row.pnl >= 0 ? 'var(--g-success)' : 'var(--g-danger)' }}>
                      {row.pnl >= 0 ? '+' : ''}{row.pnl}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.06 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Monthly P&L</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>2025 breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyPnl} barSize={32} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#4ADE80' : '#F87171'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.12 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Cumulative equity growth</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>All time</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulativeEquity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="equity" stroke="var(--gold)" strokeWidth={2.5} dot={{ fill: 'var(--gold)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Win/Loss donut */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.18 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Win / Loss ratio</p>
          <div className="flex items-center gap-6">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={winLossData} cx={75} cy={75} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {winLossData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-mono font-bold text-2xl" style={{ color: 'var(--g-success)' }}>75%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>win rate</p>
              </div>
            </div>
            <div className="space-y-3">
              {winLossData.map(d => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                    <p className="font-mono text-xl font-bold" style={{ color: d.fill }}>{d.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Setup performance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.24 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Setup performance</p>
          <div className="space-y-4">
            {setupData.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.setup}</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: s.rate >= 70 ? 'var(--g-success)' : 'var(--gold)' }}>{s.rate}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.rate}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: s.rate >= 70 ? 'var(--g-success)' : 'var(--gold)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance insights */}
      <div>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Performance insights</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INSIGHTS.map((ins, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.08 }}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ ...card, borderLeft: `4px solid ${ins.border}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ins.bg }}>
                <ins.icon size={14} style={{ color: ins.border }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{ins.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ins.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
