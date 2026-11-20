import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { makeIsCurrent, navItemsFor } from './navItems.js';

/**
 * Mobile-first horizontal scrolling navigation.
 * Touch-friendly (min 44px height), clean borders, zero horizontal page overflow.
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
    <nav aria-label="Portal sections" className="border-b border-surface-border bg-white md:hidden">
      <ul className="flex gap-1.5 overflow-x-auto px-3 py-2 no-scrollbar">
        {items.map((item) => {
          const current = isCurrent(item.path);
          return (
            <li key={item.path} className="shrink-0">
              <NavLink
                to={item.path}
                aria-current={current ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors min-h-[40px] touch-manipulation ${
                  current
                    ? 'bg-brand-100 text-brand-900 font-semibold'
                    : 'text-stone-700 hover:bg-surface-subtle'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0 text-brand-600" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileNav;
