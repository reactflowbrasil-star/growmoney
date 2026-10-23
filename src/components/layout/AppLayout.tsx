import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { cn } from '@/lib/utils';
import { getRecentDashboardActivity } from '@/services/dashboard-activity-service';
import { navItems } from '@/config/nav';

export function AppLayout() {
  const { user, logout, empresaAtiva } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; read: boolean }>>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const activity = await getRecentDashboardActivity(empresaAtiva?.id || null, 8);
      const readIds = new Set<string>(JSON.parse(localStorage.getItem(`growmoney-read-notifications:${user.id}`) || '[]'));
      setNotifications(activity.map((item) => ({
        id: item.id,
        title: `${item.actorName} ${item.action === 'created' ? 'criou' : item.action === 'updated' ? 'alterou' : 'excluiu'} ${item.entity.replace(/[_-]+/g, ' ')}`,
        time: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(item.occurredAt)),
        read: readIds.has(item.id),
      })));
    } catch {
      setNotifications([]);
    }
  }, [empresaAtiva?.id, user]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  const markNotificationRead = (id: string) => {
    if (!user?.id) return;
    setNotifications((current) => {
      const storageKey = `growmoney-read-notifications:${user.id}`;
      const readIds = new Set<string>(JSON.parse(localStorage.getItem(storageKey) || '[]'));
      readIds.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...readIds].slice(-100)));
      return current.map((notification) => notification.id === id ? { ...notification, read: true } : notification);
    });
  };

  // Fecha drawer mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const layoutUser = user ? { name: user.nome, email: user.email, avatar: user.avatar } : undefined;
  const visibleNavItems = [
    ...navItems.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon className="w-5 h-5" /> })),
    ...(isAdmin ? [{ label: 'Painel Admin', href: '/admin', icon: <ShieldCheck className="w-5 h-5" />, prominent: true }] : []),
  ];

  return (
    <div className="min-h-dvh bg-transparent">
      <div className="hidden md:block">
        <Sidebar
          items={visibleNavItems}
          user={layoutUser}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      <div
        className={cn(
          'md:hidden fixed inset-0 z-50 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[min(100%,20rem)] bg-bg-primary shadow-xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar
            items={visibleNavItems}
            user={layoutUser}
            embedded
            onCollapse={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out',
          'md:ml-72',
          sidebarCollapsed && 'md:ml-24'
        )}
      >
        <Header
          onMenuToggle={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              setMobileOpen((o) => !o);
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
          user={layoutUser}
          notifications={notifications}
          onNotificationRead={markNotificationRead}
          onLogout={handleLogout}
        />
        <main className="p-4 md:p-6 lg:p-8 mobile-nav-pad animate-in" role="main">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav isAdmin={isAdmin} />
    </div>
  );
}

