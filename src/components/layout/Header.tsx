import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Menu, LogOut, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from '@/components/brand/BrandLogo';

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 md:h-16 flex items-center gap-2 md:gap-4 px-3 md:px-4',
        'bg-bg-primary/90 backdrop-blur-xl border-b border-border-color'
      )}
    >
      <button
        onClick={onMenuToggle}
        className="p-2.5 rounded-xl hover:bg-bg-tertiary pressable focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      <Link to="/dashboard" className="flex items-center shrink-0 md:hidden" aria-label={BRAND.name}>
        <BrandLogo linkTo={false} heightClass="h-9" className="max-w-[min(26vw,120px)]" />
      </Link>

      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar no sistema…"
            onChange={(e) => onSearch?.(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 text-sm rounded-xl',
              'bg-bg-secondary border border-border-color',
              'text-text-primary placeholder:text-text-secondary',
              'focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40',
              'transition-shadow'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-2.5 rounded-xl hover:bg-bg-tertiary relative pressable"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5 text-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-erro rounded-full ring-2 ring-bg-primary" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-bg-primary border border-border-color rounded-2xl shadow-lg py-2 z-50 animate-in">
              <h3 className="px-4 py-2 text-sm font-semibold border-b border-border-color">Notificações</h3>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-secondary text-center">Sem notificações</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onNotificationRead?.(n.id)}
                      className="w-full text-left px-4 py-3 hover:bg-bg-tertiary border-b border-border-color last:border-0"
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
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-bg-tertiary pressable"
            aria-label="Perfil"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-text-primary max-w-[100px] truncate">
              {user?.name || 'Usuário'}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-bg-primary border border-border-color rounded-2xl shadow-lg py-2 z-50 animate-in">
              <div className="px-4 py-2 border-b border-border-color">
                <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email || ''}</p>
              </div>
              <Link to="/perfil" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-tertiary">
                <User className="w-4 h-4" /> Meu perfil
              </Link>
              <Link to="/configuracoes" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-tertiary">
                <Settings className="w-4 h-4" /> Configurações
              </Link>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-erro hover:bg-erro/10"
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

