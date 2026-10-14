import {
  Activity,
  Award,
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  Users
} from 'lucide-react';

// One list, used by the sidebar on a wide screen and the row of links on a
// narrow one. Keeping two copies in step is how a link ends up in one place
// and not the other.
//
// Citizens report problems. Officials review what citizens reported. Neither
// needs the other's menu, so each item says who it is for.
export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, audience: 'official' },
  { name: 'Tenders', path: '/tenders', icon: FileText, audience: 'official' },
  { name: 'Projects', path: '/projects', icon: Activity, audience: 'official' },
  { name: 'Contractors', path: '/contractors', icon: Users, audience: 'official' },
  { name: 'Analytics', path: '/contractors-analysis', icon: BarChart3, audience: 'official' },
  { name: 'New report', path: '/verify?tab=submit', icon: ShieldAlert, audience: 'citizen' },
  { name: 'My reports', path: '/verify?tab=track', icon: FileText, audience: 'citizen' },
  { name: 'Rewards', path: '/verify?tab=rewards', icon: Award, audience: 'citizen' },
  { name: 'Updates', path: '/verify?tab=notifications', icon: Bell, audience: 'citizen' }
];

export const isCitizenUser = (user) =>
  Boolean(user && (user.isCitizen || user.role === 'citizen'));

export const navItemsFor = (user) =>
  NAV_ITEMS.filter((item) => item.audience === (isCitizenUser(user) ? 'citizen' : 'official'));

/**
 * The citizen sections are one route with a ?tab= value, so React Router's own
 * active matching cannot tell them apart. This compares the whole URL.
 */
export const makeIsCurrent = (currentUrl) => (path) =>
  currentUrl === path || (path === '/verify?tab=submit' && currentUrl === '/verify');
