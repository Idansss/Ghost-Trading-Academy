import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

const ALL_TRADES = [
  { id: 1, date: 'May 17', pair: 'BTC/USDT', dir: 'LONG', entry: 96450, sl: 95200, tp: 98800, rr: '2.3R', setup: 'OB Retest', outcome: 'WIN', pnl: 3.8 },
  { id: 2, date: 'May 15', pair: 'ETH/USDT', dir: 'SHORT', entry: 3290, sl: 3360, tp: 3180, rr: '1.7R', setup: 'Supply FVG', outcome: 'PENDING', pnl: 0 },
  { id: 3, date: 'May 14', pair: 'SOL/USDT', dir: 'LONG', entry: 174.5, sl: 169.0, tp: 183.0, rr: '2.6R', setup: 'Demand Zone', outcome: 'WIN', pnl: 5.1 },
  { id: 4, date: 'May 12', pair: 'XRP/USDT', dir: 'LONG', entry: 0.548, sl: 0.530, tp: 0.580, rr: '1.8R', setup: 'BOS Retest', outcome: 'LOSS', pnl: -1.0 },
  { id: 5, date: 'May 10', pair: 'BNB/USDT', dir: 'SHORT', entry: 612.0, sl: 628.0, tp: 580.0, rr: '2.0R', setup: 'OB+FVG', outcome: 'WIN', pnl: 2.9 },
  { id: 6, date: 'May 8', pair: 'ADA/USDT', dir: 'LONG', entry: 0.430, sl: 0.415, tp: 0.465, rr: '2.3R', setup: 'Structure', outcome: 'WIN', pnl: 2.5 },
  { id: 7, date: 'May 6', pair: 'AVAX/USDT', dir: 'SHORT', entry: 34.20, sl: 35.50, tp: 32.0, rr: '1.7R', setup: 'Liquidity Sweep', outcome: 'BREAKEVEN', pnl: 0 },
  { id: 8, date: 'May 4', pair: 'DOT/USDT', dir: 'LONG', entry: 6.85, sl: 6.60, tp: 7.40, rr: '2.2R', setup: 'Demand Zone', outcome: 'WIN', pnl: 4.2 },
  { id: 9, date: 'May 2', pair: 'LINK/USDT', dir: 'LONG', entry: 12.40, sl: 11.90, tp: 13.50, rr: '2.2R', setup: 'OB Retest', outcome: 'LOSS', pnl: -1.0 },
  { id: 10, date: 'May 1', pair: 'BTC/USDT', dir: 'SHORT', entry: 95800, sl: 96600, tp: 94200, rr: '2.0R', setup: 'Supply Zone', outcome: 'WIN', pnl: 3.2 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHLY_SNAPSHOT = [12.4, -3.2, 18.6, 8.9, 11.8, null, null, null, null, null, null, null];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };
type Trade = (typeof ALL_TRADES)[number];
type SortableTradeKey = keyof Trade;
type TradeForm = {
  pair: string;
  dir: 'LONG' | 'SHORT';
  entry: string;
  sl: string;
  tp: string;
  tp2: string;
  tp3: string;
  pnl: string;
  outcome: string;
  setup: string;
  date: string;
  notes: string;
};
type TradeFormFieldKey = keyof TradeForm;
const JOURNAL_TABLE_HEADERS: { label: string; key: SortableTradeKey }[] = [
  { label: "Date", key: "date" },
  { label: "Pair", key: "pair" },
  { label: "Dir", key: "dir" },
  { label: "Entry", key: "entry" },
  { label: "SL", key: "sl" },
  { label: "TP", key: "tp" },
  { label: "R:R", key: "rr" },
  { label: "Setup", key: "setup" },
  { label: "Outcome", key: "outcome" },
  { label: "P&L%", key: "pnl" },
];

export function Journal() {
  const [activeMonth, setActiveMonth] = useState('May');
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [dirFilter, setDirFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortableTradeKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [form, setForm] = useState<TradeForm>({
    pair: '', dir: 'LONG' as 'LONG' | 'SHORT', entry: '', sl: '', tp: '',
    tp2: '', tp3: '', pnl: '', outcome: 'WIN', setup: '', date: '', notes: '',
  });

  const filteredTrades = useMemo(() => {
    let t = [...ALL_TRADES];
    if (search) t = t.filter(tr => tr.pair.toLowerCase().includes(search.toLowerCase()) || tr.setup.toLowerCase().includes(search.toLowerCase()));
    if (outcomeFilter !== 'All') t = t.filter(tr => tr.outcome === outcomeFilter);
    if (dirFilter !== 'All') t = t.filter(tr => tr.dir === dirFilter);
    if (sortKey) {
      t.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return t;
  }, [search, outcomeFilter, dirFilter, sortKey, sortDir]);

  const wins = filteredTrades.filter(t => t.outcome === 'WIN').length;
  const totalPnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);
  const bestTrade = Math.max(...filteredTrades.map(t => t.pnl));
  const worstTrade = Math.min(...filteredTrades.filter(t => t.pnl < 0).map(t => t.pnl), 0);

  function handleSort(key: SortableTradeKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortIcon({ k }: { k: string }) {
    if (sortKey !== k) return <ChevronsUpDown size={11} style={{ color: 'var(--text-muted)' }} />;
    return sortDir === 'asc' ? <ChevronUp size={11} style={{ color: 'var(--gold)' }} /> : <ChevronDown size={11} style={{ color: 'var(--gold)' }} />;
  }

  const rr = filteredTrades.filter(t => t.rr).reduce((s, t) => s + parseFloat(t.rr), 0) / (filteredTrades.length || 1);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px]">
      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {MONTHS.map(m => (
          <button key={m} onClick={() => setActiveMonth(m)}
            className="px-4 py-1.5 text-sm rounded-full flex-shrink-0 transition-colors"
            style={{
              background: activeMonth === m ? 'var(--gold-muted)' : 'var(--bg-elevated)',
              color: activeMonth === m ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: activeMonth === m ? 600 : 400,
              borderBottom: activeMonth === m ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
            {m}
          </button>
        ))}
      </div>

      {/* Mini KPI cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'P&L', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(1)}%`, color: totalPnl >= 0 ? 'var(--g-success)' : 'var(--g-danger)' },
          { label: 'Win Rate', value: `${filteredTrades.length ? Math.round(wins / filteredTrades.length * 100) : 0}%`, color: 'var(--gold)' },
          { label: 'Trades', value: `${filteredTrades.length}`, color: 'var(--text-primary)' },
          { label: 'Avg R:R', value: `${rr.toFixed(1)}R`, color: 'var(--g-info)' },
          { label: 'Best Trade', value: `+${bestTrade.toFixed(1)}%`, color: 'var(--g-success)' },
          { label: 'Worst Trade', value: `${worstTrade.toFixed(1)}%`, color: 'var(--g-danger)' },
        ].map(k => (
          <div key={k.label} className="p-3 rounded-xl" style={card}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k.label}</p>
            <p className="font-mono font-bold text-base mt-0.5" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Table header controls */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>May 2025 trades</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trades..." className="text-xs bg-transparent outline-none w-32" style={{ color: 'var(--text-primary)' }} />
            </div>
            {/* Outcome filter */}
            <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}>
              {['All', 'WIN', 'LOSS', 'PENDING', 'BREAKEVEN', 'CANCELLED'].map(o => <option key={o}>{o}</option>)}
            </select>
            {/* Dir filter */}
            <select value={dirFilter} onChange={e => setDirFilter(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)' }}>
              {['All', 'LONG', 'SHORT'].map(d => <option key={d}>{d}</option>)}
            </select>
            {/* Export */}
            <button onClick={() => toast.success('CSV exported!')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>
              <Download size={12} /> Export
            </button>
            {/* Add trade */}
            <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>
              <Plus size={12} /> Add trade
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                {JOURNAL_TABLE_HEADERS.map(h => (
                  <th key={h.key} className="px-4 py-2.5 text-left cursor-pointer" onClick={() => handleSort(h.key)}>
                    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {h.label} <SortIcon k={h.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="group transition-colors"
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)', borderBottom: '1px solid var(--bg-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)')}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{t.date}</td>
                  <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{t.pair}</td>
                  <td className="px-4 py-3"><DirPill dir={t.dir} /></td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{t.entry}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--g-danger)' }}>{t.sl}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--g-success)' }}>{t.tp}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--g-info)' }}>{t.rr}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{t.setup}</td>
                  <td className="px-4 py-3"><OutcomeBadge outcome={t.outcome} /></td>
                  <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: t.pnl > 0 ? 'var(--g-success)' : t.pnl < 0 ? 'var(--g-danger)' : 'var(--text-muted)' }}>
                    {t.pnl !== 0 ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} onClick={() => setOpenRow(openRow === t.id ? null : t.id)}>
                        <MoreHorizontal size={15} />
                      </button>
                      {openRow === t.id && (
                        <div className="absolute right-0 top-6 w-28 rounded-xl shadow-2xl z-20 py-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                          <button className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }} onClick={() => { toast.success('Edit coming soon'); setOpenRow(null); }}>Edit</button>
                          <button className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--g-danger)' }} onClick={() => { toast.success('Trade deleted'); setOpenRow(null); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly snapshot */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <p className="text-xs mb-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Year snapshot</p>
          <div className="flex gap-1.5">
            {MONTHS.map((m, i) => {
              const v = MONTHLY_SNAPSHOT[i];
              return (
                <div key={m} className="flex-1 rounded-lg p-2 text-center min-w-0" style={{
                  background: v === null ? 'var(--bg-elevated)' : v >= 0 ? 'var(--g-success-muted)' : 'var(--g-danger-muted)',
                  border: `1px solid ${v === null ? 'var(--bg-border)' : v >= 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`
                }}>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{m}</p>
                  <p className="text-[10px] font-mono font-semibold" style={{ color: v === null ? 'var(--text-muted)' : v >= 0 ? 'var(--g-success)' : 'var(--g-danger)' }}>
                    {v === null ? '—' : `${v > 0 ? '+' : ''}${v}%`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Trade Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative ml-auto w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)' }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Log new trade</p>
              <button onClick={() => setDrawerOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Pair + suggestion chips */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Trading Pair</label>
                <input value={form.pair} onChange={e => setForm({ ...form, pair: e.target.value })} placeholder="BTC/USDT" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, pair: p })} className="px-2 py-1 rounded text-[11px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Direction toggle */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Direction</label>
                <div className="flex gap-2">
                  {(['LONG', 'SHORT'] as const).map(d => (
                    <button key={d} onClick={() => setForm({ ...form, dir: d })}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{
                        background: form.dir === d ? (d === 'LONG' ? 'var(--g-success-muted)' : 'var(--g-danger-muted)') : 'var(--bg-elevated)',
                        color: form.dir === d ? (d === 'LONG' ? 'var(--g-success)' : 'var(--g-danger)') : 'var(--text-muted)',
                        border: `1px solid ${form.dir === d ? (d === 'LONG' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'var(--bg-border)'}`,
                      }}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Price fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'entry', label: 'Entry Price' }, { key: 'sl', label: 'Stop Loss' },
                  { key: 'tp', label: 'Take Profit' }, { key: 'tp2', label: 'TP2 (optional)' },
                  { key: 'tp3', label: 'TP3 (optional)' }, { key: 'pnl', label: 'P&L %' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                    <input type="number" value={form[f.key as TradeFormFieldKey]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
                  </div>
                ))}
              </div>

              {/* Live R:R preview */}
              {form.entry && form.sl && form.tp && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--gold-muted)', border: '1px solid rgba(212,165,32,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>R:R Ratio</p>
                      <p className="font-mono font-bold text-lg" style={{ color: 'var(--gold)' }}>
                        {Math.abs((parseFloat(form.tp) - parseFloat(form.entry)) / (parseFloat(form.entry) - parseFloat(form.sl))).toFixed(1)}R
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Risk</p>
                      <p className="font-mono font-bold text-lg" style={{ color: 'var(--g-danger)' }}>
                        {Math.abs((parseFloat(form.entry) - parseFloat(form.sl)) / parseFloat(form.entry) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Outcome + Setup + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Outcome</label>
                  <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>
                    {['WIN', 'LOSS', 'PENDING', 'BREAKEVEN', 'CANCELLED'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Trade Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Setup Type</label>
                <input value={form.setup} onChange={e => setForm({ ...form, setup: e.target.value })} placeholder="e.g. OB Retest, Demand Zone..." className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Trade notes, reasoning, lessons learned..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {/* Drawer footer */}
            <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--bg-border)' }}>
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={() => { toast.success('Trade logged!'); setDrawerOpen(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--gold)', color: '#0C0C0E' }}>Save trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DirPill({ dir }: { dir: string }) {
  const isLong = dir === 'LONG';
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: isLong ? 'var(--g-success-muted)' : 'var(--g-danger-muted)', color: isLong ? 'var(--g-success)' : 'var(--g-danger)' }}>{dir}</span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, [string, string]> = {
    WIN: ['var(--g-success-muted)', 'var(--g-success)'],
    LOSS: ['var(--g-danger-muted)', 'var(--g-danger)'],
    PENDING: ['rgba(251,191,36,0.13)', '#F59E0B'],
    BREAKEVEN: ['rgba(148,163,184,0.13)', '#94A3B8'],
    CANCELLED: ['rgba(100,116,139,0.13)', '#64748B'],
  };
  const [bg, color] = map[outcome] || map.BREAKEVEN;
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: bg, color }}>{outcome}</span>;
}
