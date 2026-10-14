import React from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileNav from './MobileNav.jsx';
import IdentityBand from './IdentityBand.jsx';
import SiteFooter from './SiteFooter.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const PageLayout = ({ children, title = 'Infrastructure Audit' }) => {
  const { user } = useAuth();
  const showSidebar = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* First thing a keyboard user reaches, so they can pass the navigation. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <IdentityBand />

      <div className="flex min-h-0 flex-1">
        {showSidebar && <Sidebar />}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} />
          <MobileNav />

          <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <SiteFooter />
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
