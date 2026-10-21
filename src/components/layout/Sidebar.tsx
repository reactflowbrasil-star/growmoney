import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  items: NavItem[];
  logo?: string;
  user?: { name: string; email: string; avatar?: string };
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ items, logo = BRAND.logo, user, onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col',
        'bg-bg-primary border-r border-border-color',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Navegação principal"
    >
      <div className="flex items-center h-16 px-3 border-b border-border-color gap-2">
        <img
          src={logo}
          alt={BRAND.name}
          className={cn(
            'object-contain object-left transition-all',
            collapsed ? 'h-8 w-8 mx-auto' : 'h-9 w-auto max-w-[148px]'
          )}
        />
        <button
          type="button"
          onClick={toggleCollapse}
          className={cn(
            'ml-auto p-1.5 rounded-lg text-text-secondary hover:bg-bg-tertiary',
            collapsed && 'mx-auto mt-2'
          )}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <span className="text-xs font-bold">{collapsed ? '»' : '«'}</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const active =
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand/15 text-brand'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              )}
              title={item.label}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-brand/20 text-brand">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {user && !collapsed && (
        <div className="border-t border-border-color p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold shrink-0">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
