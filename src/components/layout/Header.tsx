import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Menu, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

interface HeaderProps {
  onMenuToggle: () => void;
  onSearch?: (query: string) => void;
  user?: { name: string; email: string; avatar?: string };
  notifications?: Array<{ id: string; title: string; time: string; read: boolean }>;
  onNotificationRead?: (id: string) => void;
  onLogout?: () => void;
}

export function Header({
  onMenuToggle,
  onSearch,
  user,
  notifications = [],
  onNotificationRead,
  onLogout,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-28 flex items-center gap-4 px-4',
        'bg-bg-primary border-b border-border-color',
        'shadow-sm'
      )}
    >
      <button
        onClick={onMenuToggle}
        className={cn(
          'p-2 rounded-md hover:bg-bg-tertiary',
          'focus:outline-none focus:ring-2 focus:ring-verde-discreto',
          'md:hidden'
        )}
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6 text-text-primary" />
      </button>

      <Link to="/dashboard" className="flex items-center shrink-0" aria-label={BRAND.name}>
        <img
          src={BRAND.logo}
          alt={BRAND.name}
          className="h-[72px] md:h-[84px] w-auto max-w-[300px] md:max-w-[360px] object-contain"
        />
      </Link>

      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar..."
            onChange={(e) => onSearch?.(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl',
              'bg-bg-secondary border border-border-color',
              'text-text-primary placeholder:text-text-secondary',
              'focus:outline-none focus:ring-2 focus:ring-verde-discreto'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              'p-2 rounded-md hover:bg-bg-tertiary relative',
              'focus:outline-none focus:ring-2 focus:ring-verde-discreto'
            )}
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-erro text-branco text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-bg-primary border border-border-color rounded-md shadow-lg py-2 z-50">
              <h3 className="px-4 py-2 text-sm font-semibold text-text-primary border-b border-border-color">
                Notificações
              </h3>
              {notifications.length === 0 ? (
                <p className="px-4 py-4 text-sm text-text-secondary text-center">Sem notificações</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onNotificationRead?.(n.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-bg-tertiary',
                        'border-b border-border-color last:border-0',
                        !n.read && 'bg-verde-discreto/5'
                      )}
                    >
                      <p className="text-sm text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-secondary">{n.time}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md hover:bg-bg-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-verde-discreto'
            )}
            aria-label="Perfil"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-verde-discreto flex items-center justify-center text-branco text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden md:block text-sm text-text-primary">{user?.name || 'Usuário'}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-primary border border-border-color rounded-md shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-border-color">
                <p className="text-sm font-medium text-text-primary">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email || ''}</p>
              </div>
              <Link to="/perfil" className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary">
                <User className="w-4 h-4" /> Meu Perfil
              </Link>
              <Link to="/configuracoes" className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary">
                <Settings className="w-4 h-4" /> Configurações
              </Link>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-erro hover:bg-bg-tertiary"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
