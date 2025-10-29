import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TenantBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/tenant/dashboard' },
    { icon: Search, label: 'Properties', path: '/tenant/browse' },
    { icon: DollarSign, label: 'Payments', path: '/tenant/payments' },
    { icon: User, label: 'Profile', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", active && "fill-primary/10")} />
              <span className={cn("text-xs", active && "font-semibold")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TenantBottomNav;
