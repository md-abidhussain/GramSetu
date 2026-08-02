import React from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const PageLayout = ({ children, title = 'Infrastructure Audit' }) => {
  const { user } = useAuth();
  
  // Show sidebar for any logged-in user (Phase 3 navigation & logout visibility)
  const showSidebar = !!user;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-dark-50">
      {showSidebar && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default PageLayout;
