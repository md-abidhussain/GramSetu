import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { makeIsCurrent, navItemsFor } from './navItems.js';

/**
 * The navigation on a narrow screen, where the sidebar is hidden.
 *
 * A row that scrolls sideways rather than a menu behind a button: there are
 * only four or five places to go, and a visible link is one tap instead of two.
 */
const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isCurrent = makeIsCurrent(location.pathname + location.search);
  const items = navItemsFor(user);

  if (!user) {
    return null;
  }

  return (
    <nav aria-label="Sections" className="border-b border-slate-200 bg-white md:hidden">
      <ul className="flex gap-1 overflow-x-auto px-2 py-2">
        {items.map((item) => {
          const current = isCurrent(item.path);
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                aria-current={current ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  current ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileNav;
