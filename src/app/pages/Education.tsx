import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Play, Download } from 'lucide-react';
import { toast } from 'sonner';

const RESOURCES = [
  {
    id: 1, type: 'PDF', title: 'ICT Concepts Complete Guide', topic: 'Foundation',
    desc: 'Master ICT concepts including order blocks, fair value gaps, market structure, and institutional flow analysis.',
    meta: '48 pages', topicColor: ['rgba(212,165,32,0.13)', 'var(--gold)'],
  },
  {
    id: 2, type: 'PDF', title: 'Risk Management Mastery', topic: 'Risk',
    desc: 'Complete guide to professional risk management, position sizing, and capital preservation strategies.',
    meta: '32 pages', topicColor: ['var(--g-danger-muted)', 'var(--g-danger)'],
  },
  {
    id: 3, type: 'PDF', title: 'Candlestick Cheat Sheet', topic: 'Patterns',
    desc: 'Quick reference for all major candlestick patterns with real trading examples and confluence notes.',
    meta: '12 pages', topicColor: ['var(--g-success-muted)', 'var(--g-success)'],
  },
  {
    id: 4, type: 'PDF', title: 'Pre-Trade Entry Checklist', topic: 'Psychology',
    desc: 'A proven 7-step checklist to follow before entering any trade. Eliminate emotion from trading.',
    meta: '4 pages', topicColor: ['var(--g-info-muted)', 'var(--g-info)'],
  },
  {
    id: 5, type: 'VIDEO', title: 'Market Structure Deep Dive', topic: 'Structure',
    desc: 'Comprehensive breakdown of market structure: BOS, CHoCH, HH/HL/LH/LL, and how to trade each.',
    meta: '42 min', topicColor: ['rgba(212,165,32,0.13)', 'var(--gold)'],
  },
  {
    id: 6, type: 'VIDEO', title: 'How to Set SL & TP Properly', topic: 'Risk',
    desc: 'Learn the correct way to place stop losses and take profits based on structure, not emotions.',
    meta: '28 min', topicColor: ['var(--g-danger-muted)', 'var(--g-danger)'],
  },
  {
    id: 7, type: 'VIDEO', title: 'Psychology of Trading', topic: 'Psychology',
    desc: 'How to handle losses, FOMO, revenge trading, and develop the mindset of a professional trader.',
    meta: '35 min', topicColor: ['var(--g-info-muted)', 'var(--g-info)'],
  },
  {
    id: 8, type: 'VIDEO', title: 'Live Trade Walkthrough', topic: 'Live',
    desc: 'Real-time trade execution from analysis to entry management, showing every decision step by step.',
    meta: '55 min', topicColor: ['var(--g-success-muted)', 'var(--g-success)'],
  },
];

const FILTERS = ['All', 'PDFs', 'Videos', 'Guides'];

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Education() {
  const [filter, setFilter] = useState('All');

  const filtered = RESOURCES.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'PDFs') return r.type === 'PDF';
    if (filter === 'Videos') return r.type === 'VIDEO';
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-sm transition-colors relative"
            style={{
              color: filter === f ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: filter === f ? 600 : 400,
              borderBottom: `2px solid ${filter === f ? 'var(--gold)' : 'transparent'}`,
              background: 'transparent',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Resource grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((r, i) => (
          <motion.div key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className="p-4 rounded-2xl cursor-pointer transition-all group"
            style={card}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid var(--gold)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid var(--bg-border)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}>
            {/* Top row: type badge + topic */}
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                background: r.type === 'PDF' ? 'var(--g-danger-muted)' : 'var(--g-info-muted)',
                color: r.type === 'PDF' ? 'var(--g-danger)' : 'var(--g-info)',
              }}>{r.type}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: r.topicColor[0], color: r.topicColor[1] }}>{r.topic}</span>
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{
              background: r.type === 'PDF' ? 'var(--g-danger-muted)' : 'var(--g-info-muted)',
            }}>
              {r.type === 'PDF'
                ? <FileText size={18} style={{ color: 'var(--g-danger)' }} />
                : <Play size={18} style={{ color: 'var(--g-info)' }} />
              }
            </div>

            {/* Title + desc */}
            <p className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
            <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{r.meta}</span>
              <button
                onClick={() => toast.success(`${r.type === 'PDF' ? 'Downloading' : 'Opening'} "${r.title}"`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                style={{ background: 'var(--gold-muted)', color: 'var(--gold)', border: '1px solid rgba(212,165,32,0.2)' }}>
                {r.type === 'PDF' ? <Download size={11} /> : <Play size={11} />}
                {r.type === 'PDF' ? 'Download' : 'Watch'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
