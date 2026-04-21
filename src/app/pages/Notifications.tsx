import { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, CheckCircle, XCircle, FileText, BarChart2, Bell } from 'lucide-react';
import { toast } from 'sonner';

const ALL_NOTIFS = [
  { id: 1, type: 'signal', icon: Zap, title: 'BTC Signal Updated', msg: 'SL moved to breakeven on the BTC/USDT long position. Manage your trade accordingly.', time: '2 min ago', unread: true, category: 'Signals', color: 'var(--gold)' },
  { id: 2, type: 'tp', icon: CheckCircle, title: 'ETH TP1 Hit ✓', msg: 'Take profit 1 has been hit on the ETH/USDT short signal. Consider moving SL to entry.', time: '45 min ago', unread: true, category: 'Signals', color: 'var(--g-success)' },
  { id: 3, type: 'sl', icon: XCircle, title: 'XRP SL Hit ✗', msg: 'Stop loss triggered on XRP/USDT long. Loss of -1.0%. Review your trade in the journal.', time: '1.5 hrs ago', unread: true, category: 'Signals', color: 'var(--g-danger)' },
  { id: 4, type: 'recap', icon: BarChart2, title: 'Weekly Recap Posted', msg: 'The May 12–17 weekly performance recap is now available. Check your stats and insights.', time: '2 hrs ago', unread: false, category: 'Recaps', color: 'var(--g-info)' },
  { id: 5, type: 'resource', icon: FileText, title: 'New PDF Available', msg: 'Risk Management Mastery guide added to the Education Hub. 32 pages of curated content.', time: '5 hrs ago', unread: false, category: 'Resources', color: 'var(--g-info)' },
  { id: 6, type: 'signal', icon: Zap, title: 'SOL Signal Active', msg: 'New long signal posted for SOL/USDT. Entry zone: $174–$176. Check Signals page.', time: '1 day ago', unread: false, category: 'Signals', color: 'var(--gold)' },
  { id: 7, type: 'announce', icon: Bell, title: 'Community Update', msg: 'New announcement pinned in the community. BTC position management instructions updated.', time: '1 day ago', unread: false, category: 'Recaps', color: 'var(--gold)' },
  { id: 8, type: 'resource', icon: FileText, title: 'ICT Guide Updated', msg: 'The ICT Concepts Complete Guide has been updated with 8 new pages on FVG analysis.', time: '2 days ago', unread: false, category: 'Resources', color: 'var(--g-info)' },
];

const FILTERS = ['All', 'Unread', 'Signals', 'Resources', 'Recaps'];
const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Notifications() {
  const [filter, setFilter] = useState('All');
  const [notifs, setNotifs] = useState(ALL_NOTIFS);

  const filtered = notifs.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return n.unread;
    return n.category === filter;
  });

  const unreadCount = notifs.filter(n => n.unread).length;

  function markAllRead() {
    setNotifs(ns => ns.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  }

  function markRead(id: number) {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[800px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 20 }}>Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--g-danger)', color: '#fff' }}>{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
            Mark all as read
          </button>
        )}
      </motion.div>

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

      {/* Notification list */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications in this category</p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <motion.div key={n.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => markRead(n.id)}
              className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors"
              style={{
                background: n.unread ? 'var(--bg-elevated)' : 'transparent',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--bg-border)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'var(--bg-elevated)' : 'transparent')}>
              {/* Icon */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `color-mix(in srgb, ${n.color} 15%, transparent)` }}>
                <n.icon size={14} style={{ color: n.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{n.msg}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
              </div>

              {/* Unread dot */}
              {n.unread && (
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: 'var(--gold)' }} />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
