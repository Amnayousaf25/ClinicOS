import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import AppSidebar from './AppSidebar';
import { Menu, CalendarDays } from 'lucide-react';
import Logo from './Logo';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { email, role } = useAuth();

  const greeting = dayjs().hour() < 12 ? 'Good morning' : dayjs().hour() < 17 ? 'Good afternoon' : 'Good evening';
  const userName = (email || 'staff')
    .split('@')[0]
    .replace(/\./g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={role} email={email} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} />
      <AppSidebar mobile role={role} email={email} sidebarOpen={sidebarOpen} onSidebarOpenChange={setSidebarOpen} />

      {/* Top bar */}
      <div className="lg:ml-[72px] h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <Logo size="sm" />
        </div>

        {/* Greeting — desktop */}
        <div className="hidden lg:flex items-center gap-3 ml-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-[0_2px_12px_hsl(var(--primary)/0.35)]">
            {role === 'admin' ? 'A' : 'S'}
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-foreground">
              {greeting}, {userName} <span className="text-base">👋</span>
            </p>
            <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">
              {role === 'admin' ? 'Administrator' : 'Staff Member'}
            </p>
          </div>
        </div>

        {/* Date badge */}
        <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-1.5 rounded-xl border border-border/50">
          <CalendarDays className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">{dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
      </div>

      <main className="lg:ml-[72px] p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
