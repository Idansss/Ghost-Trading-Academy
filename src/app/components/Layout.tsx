import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, BookOpen, Zap, Sun, Moon, BarChart2,
  GraduationCap, Calculator, Users, Bell, Ghost, Settings,
  ChevronLeft, ChevronRight, Search, LogOut, User, Menu, X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/journal', label: 'My Journal', icon: BookOpen },
  { path: '/signals', label: 'Signals', icon: Zap },
  { path: '/outlook', label: 'Daily Outlook', icon: Sun },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/education', label: 'Education Hub', icon: GraduationCap },
  { path: '/calculator', label: 'Calculator', icon: Calculator },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
];

const ADMIN_ITEMS = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/signals', label: 'Signals', icon: Zap },
  { path: '/admin/members', label: 'Members', icon: Users },
  { path: '/admin/outlook', label: 'Post Outlook', icon: Sun },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/': { title: 'Dashboard', sub: 'Trading Command Center' },
  '/journal': { title: 'My Journal', sub: 'Track your trades' },
  '/signals': { title: 'Signals', sub: 'Live trade ideas' },
  '/outlook': { title: 'Daily Outlook', sub: 'Saturday, May 17, 2025' },
  '/analytics': { title: 'Analytics', sub: 'Performance breakdown' },
  '/education': { title: 'Education Hub', sub: 'Resources & guides' },
  '/calculator': { title: 'Calculator', sub: 'Position sizing' },
  '/community': { title: 'Community', sub: 'Member activity' },
  '/notifications': { title: 'Notifications', sub: 'Updates & alerts' },
  '/admin': { title: 'Admin Overview', sub: 'Platform management' },
  '/admin/signals': { title: 'Signal Management', sub: 'Admin panel' },
  '/admin/members': { title: 'Member Management', sub: 'Admin panel' },
  '/admin/outlook': { title: 'Post Outlook', sub: 'Admin panel' },
};

const NOTIFICATIONS_PREVIEW = [
  { id: 1, type: 'signal', title: 'BTC Signal Updated', msg: 'SL moved to breakeven on BTC/USDT long', time: '2 min ago', unread: true, color: 'var(--gold)' },
  { id: 2, type: 'tp', title: 'ETH TP1 Hit ✓', msg: 'Take profit 1 hit on ETH/USDT short', time: '45 min ago', unread: true, color: 'var(--g-success)' },
  { id: 3, type: 'recap', title: 'Weekly Recap Posted', msg: 'May 12–17 weekly performance recap', time: '2 hrs ago', unread: false, color: 'var(--g-info)' },
  { id: 4, type: 'resource', title: 'New PDF Available', msg: 'Risk Management Mastery guide added', time: '5 hrs ago', unread: false, color: 'var(--g-info)' },
  { id: 5, type: 'signal', title: 'SOL Signal Active', msg: 'New long signal posted for SOL/USDT', time: '1 day ago', unread: false, color: 'var(--gold)' },
];

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Ghost Trading Academy', sub: '' };
  const isMarketOpen = new Date().getHours() >= 9 && new Date().getHours() < 17;
  const unreadCount = 3;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const s = {
    sidebar: {
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-border)',
      width: collapsed ? 72 : 240,
      transition: 'width 0.2s ease',
    },
    topbar: {
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--bg-border)',
    },
    content: {
      background: 'var(--bg-base)',
      marginLeft: 0,
    },
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={s.sidebar}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b flex-shrink-0" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
            <Ghost size={16} style={{ color: 'var(--gold)' }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs leading-tight whitespace-nowrap" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Ghost Trading</p>
              <p className="text-[10px] leading-tight whitespace-nowrap" style={{ color: 'var(--gold)', fontWeight: 500 }}>APEX VIP</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} currentPath={location.pathname} onClick={() => setMobileOpen(false)} />
          ))}

          {/* Admin section */}
          <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Admin</p>
            )}
            {ADMIN_ITEMS.map(item => (
              <NavItem key={item.path} item={item} collapsed={collapsed} currentPath={location.pathname} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 py-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center h-8 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* User card */}
        <div className="px-2 pb-3">
          <div
            className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontFamily: 'Inter', border: '1px solid var(--gold)' }}>
              AR
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Alex Rivera</p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{ background: 'var(--gold-muted)', color: 'var(--gold)' }}>VIP</span>
                </div>
                <Settings size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col h-full z-10" style={s.sidebar}>
            <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <div className="flex items-center gap-2">
                <Ghost size={18} style={{ color: 'var(--gold)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ghost Trading</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
              {NAV_ITEMS.map(item => (
                <NavItem key={item.path} item={item} collapsed={false} currentPath={location.pathname} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex md:hidden items-center justify-between px-4 h-14 flex-shrink-0" style={s.topbar}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-primary)' }}><Menu size={22} /></button>
          <span className="text-sm font-bold tracking-widest" style={{ color: 'var(--gold)' }}>APEX VIP</span>
          <div className="flex items-center gap-2">
            <button className="relative" onClick={() => setNotifOpen(v => !v)} style={{ color: 'var(--text-primary)' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'var(--g-danger)', color: '#fff' }}>{unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-6 h-14 flex-shrink-0" style={s.topbar}>
          <div>
            <h1 className="text-base" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pageInfo.title}</h1>
            {pageInfo.sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pageInfo.sub}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* Market status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: isMarketOpen ? 'var(--g-success)' : 'var(--g-danger)' }} />
              <span style={{ color: isMarketOpen ? 'var(--g-success)' : 'var(--g-danger)', fontWeight: 500 }}>
                {isMarketOpen ? 'Market open' : 'Market closed'}
              </span>
            </div>

            {/* Date */}
            <span className="text-xs hidden lg:block" style={{ color: 'var(--text-muted)' }}>Tue, May 17 · 2025</span>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Search */}
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => toast.info('Search coming soon')}
            >
              <Search size={16} />
            </button>

            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setNotifOpen(v => !v)}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--g-danger)' }} />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                    <button className="text-xs" style={{ color: 'var(--gold)' }}>Mark all as read</button>
                  </div>
                  <div>
                    {NOTIFICATIONS_PREVIEW.map(n => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ background: n.unread ? 'var(--bg-elevated)' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'var(--bg-elevated)' : 'transparent')}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `color-mix(in srgb, ${n.color} 15%, transparent)` }}>
                          <Bell size={12} style={{ color: n.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{n.msg}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                        </div>
                        {n.unread && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--gold)' }} />}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid var(--bg-border)' }}>
                    <button className="text-xs font-medium" style={{ color: 'var(--gold)' }} onClick={() => { navigate('/notifications'); setNotifOpen(false); }}>View all →</button>
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="relative" ref={userRef}>
              <button
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--gold-muted)', color: 'var(--gold)', border: '1px solid var(--gold)' }}
                onClick={() => setUserOpen(v => !v)}
              >
                AR
              </button>

              {userOpen && (
                <div className="absolute right-0 top-10 w-44 rounded-xl shadow-2xl z-50 overflow-hidden py-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  {[
                    { icon: User, label: 'Profile' },
                    { icon: Settings, label: 'Settings' },
                  ].map(item => (
                    <button key={item.label} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <item.icon size={14} /> {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--bg-border)', margin: '4px 0' }} />
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'var(--g-danger)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--g-danger-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate('/auth/login')}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex md:hidden flex-shrink-0 border-t" style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-border)' }}>
          {[
            { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/journal', icon: BookOpen, label: 'Journal' },
            { path: '/signals', icon: Zap, label: 'Signals' },
            { path: '/education', icon: GraduationCap, label: 'Education' },
            { path: '/community', icon: Users, label: 'Community' },
          ].map(item => {
            const active = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} className="flex-1 flex flex-col items-center py-2 relative">
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: 'var(--gold)' }} />}
                <item.icon size={20} style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }} />
                <span className="text-[10px] mt-0.5" style={{ color: active ? 'var(--gold)' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function NavItem({ item, collapsed, currentPath, onClick }: {
  item: typeof NAV_ITEMS[0];
  collapsed: boolean;
  currentPath: string;
  onClick: () => void;
}) {
  const active = currentPath === item.path;
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm relative transition-colors"
      style={{
        background: active ? 'var(--gold-muted)' : 'transparent',
        color: active ? 'var(--gold)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: 'var(--gold)' }} />}
      <item.icon size={16} className="flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'var(--g-danger)', color: '#fff' }}>{item.badge}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
