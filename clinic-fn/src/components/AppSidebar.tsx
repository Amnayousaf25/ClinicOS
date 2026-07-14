import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, LayoutDashboard, Settings, FileText, Users, BarChart3, LogOut, X, CalendarDays, UserCog } from 'lucide-react';
import Logo from './Logo';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Role } from '@/types';

interface AppSidebarProps {
  mobile?: boolean;
  role: Role;
  email: string;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
}

const AppSidebar = ({ mobile, role, email, sidebarOpen, onSidebarOpenChange }: AppSidebarProps) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('clinicos_token');
    localStorage.removeItem('clinicos_refresh_token');
    sessionStorage.removeItem('clinicos_token');
    sessionStorage.removeItem('clinicos_refresh_token');
    queryClient.removeQueries({ queryKey: ['auth-me'] });
    queryClient.clear();
    onSidebarOpenChange(false);
    // Explicit navigation — without this the route stays on the current
    // protected page until something else re-renders AppRoutes (e.g. a
    // refresh). The auth gate uses a non-reactive `localStorage.getItem`
    // read so we have to push the user to a public route ourselves.
    navigate('/', { replace: true });
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'staff'] },
    { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'staff'] },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar', roles: ['admin'] },
    { to: '/intake-forms', icon: ClipboardList, label: 'Intake Forms', roles: ['admin', 'staff'] },
    { to: '/patients', icon: Users, label: 'Patients', roles: ['admin'] },
    { to: '/staff', icon: UserCog, label: 'Staff', roles: ['admin'] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
    { to: '/sms-reminders', icon: FileText, label: 'SMS Reminders', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];

  const filtered = navItems.filter((item) => item.roles.includes(role));

  const handleNavClick = () => {
    if (mobile) onSidebarOpenChange(false);
  };

  const sidebarContent = (
    <aside className={cn(
      'bg-card border-r border-border flex flex-col z-40',
      mobile ? 'w-72 h-full' : 'fixed left-0 top-0 bottom-0 w-[72px] hidden lg:flex'
    )}>
      <div
        className={cn(
          'h-16 flex items-center',
          mobile ? 'justify-between px-6' : 'justify-center'
        )}
      >
        {mobile ? <Logo size="md" /> : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-[0_4px_20px_hsl(var(--primary)/0.35)] relative cursor-pointer">
                C
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="px-3 py-2">
              <Logo size="sm" />
            </TooltipContent>
          </Tooltip>
        )}
        {mobile && (
          <button onClick={() => onSidebarOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-none">
        {mobile && <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3.5 pt-3 pb-2">Menu</p>}
        {filtered.map((item) => {
          const active = location.pathname === item.to;
          if (mobile) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-primary-glow'
                    : 'text-sidebar-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            );
          }
          return (
            <Tooltip key={item.to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-xl transition-all mx-auto',
                    active
                      ? 'bg-primary text-primary-foreground shadow-primary-glow'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border space-y-2">
        {mobile ? (
          <>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-3d">
                {role === 'admin' ? 'A' : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{role === 'admin' ? 'Admin' : 'Staff'}</p>
                <p className="text-[10px] truncate text-muted-foreground">{email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="flex items-center justify-center w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 transition-colors mx-auto"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Sign Out</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );

  if (mobile) {
    return (
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => onSidebarOpenChange(false)} />
        )}
        <div className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
};

export default AppSidebar;
