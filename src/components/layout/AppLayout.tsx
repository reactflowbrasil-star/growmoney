import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  navItems: Array<{ label: string; href: string; icon: ReactNode; badge?: string }>;
  user?: { name: string; email: string; avatar?: string };
  logo?: string;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string; time: string; read: boolean }>;
  onNotificationRead?: (id: string) => void;
  onLogout?: () => void;
}

export function AppLayout({
  children,
  navItems,
  user,
  logo,
  onMenuToggle,
  onSearch,
  notifications,
  onNotificationRead,
  onLogout,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar items={navItems} logo={logo} user={user} />
      <div className="transition-[margin-left] duration-300 ease-in-out ml-16 md:ml-64">
        <Header
          onMenuToggle={onMenuToggle || (() => {})}
          onSearch={onSearch || (() => {})}
          user={user}
          notifications={notifications}
          onNotificationRead={onNotificationRead}
          onLogout={onLogout}
        />
        <main className="p-4 md:p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}