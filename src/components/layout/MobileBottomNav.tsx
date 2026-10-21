import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/configuracoes', label: 'Mais', icon: MoreHorizontal },
];

export function MobileBottomNav() {
  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 inset-x-0 z-40',
        'border-t border-border-color bg-bg-primary/95 backdrop-blur-xl',
        'safe-pb'
      )}
      aria-label="Navegação mobile"
    >
      <ul className="grid grid-cols-5 h-16">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors pressable',
                  isActive ? 'text-brand' : 'text-text-secondary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

