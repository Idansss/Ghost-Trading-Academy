import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Journal } from './pages/Journal';
import { Signals } from './pages/Signals';
import { Outlook } from './pages/Outlook';
import { Analytics } from './pages/Analytics';
import { Education } from './pages/Education';
import { Calculator } from './pages/Calculator';
import { Community } from './pages/Community';
import { Notifications } from './pages/Notifications';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminSignals } from './pages/admin/AdminSignals';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminOutlook } from './pages/admin/AdminOutlook';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'journal', Component: Journal },
      { path: 'signals', Component: Signals },
      { path: 'outlook', Component: Outlook },
      { path: 'analytics', Component: Analytics },
      { path: 'education', Component: Education },
      { path: 'calculator', Component: Calculator },
      { path: 'community', Component: Community },
      { path: 'notifications', Component: Notifications },
      { path: 'admin', Component: AdminOverview },
      { path: 'admin/signals', Component: AdminSignals },
      { path: 'admin/members', Component: AdminMembers },
      { path: 'admin/outlook', Component: AdminOutlook },
    ],
  },
  { path: '/auth/login', Component: Login },
  { path: '/auth/register', Component: Register },
]);
