import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, DollarSign, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import nestPayLogo from '@/assets/nest-pay-logo.png';
import TenantBottomNav from './TenantBottomNav';
import TenantSideDrawer from './TenantSideDrawer';
import { cn } from '@/lib/utils';

interface TenantLayoutProps {
  children: ReactNode;
}

const TenantLayout = ({ children }: TenantLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Header */}
      <header className="hidden md:block border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={nestPayLogo} alt="NEST PAY" className="h-10 w-10" />
            <h1 className="text-lg font-bold">NEST PAY</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isActive('/tenant/browse') ? 'default' : 'outline'}
              onClick={() => navigate('/tenant/browse')}
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Properties
            </Button>
            <Button
              variant={isActive('/tenant/payments') ? 'default' : 'outline'}
              onClick={() => navigate('/tenant/payments')}
              size="sm"
            >
              My Payments
            </Button>
            <Button
              variant={isActive('/settings') ? 'default' : 'outline'}
              onClick={() => navigate('/settings')}
              size="sm"
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDrawerOpen(true)}
              size="sm"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden border-b bg-card sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={nestPayLogo} alt="NEST PAY" className="h-10 w-10" />
            <h1 className="text-lg font-bold">NEST PAY</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "container mx-auto px-4 py-6",
        "pb-24 md:pb-6" // Extra padding on mobile for bottom nav
      )}>
        {children}
      </main>

      {/* Floating Pay Rent Button - Mobile Only */}
      {location.pathname === '/tenant/dashboard' && (
        <Button
          onClick={() => navigate('/tenant/pay')}
          className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <DollarSign className="h-6 w-6" />
        </Button>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <TenantBottomNav />

      {/* Side Drawer */}
      <TenantSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default TenantLayout;
