import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import nestPayLogo from '@/assets/nest-pay-logo.png';
import LandlordBottomNav from './LandlordBottomNav';
import LandlordSideDrawer from './LandlordSideDrawer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LandlordLayoutProps {
  children: ReactNode;
}

const LandlordLayout = ({ children }: LandlordLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Header */}
      <header className="hidden md:block border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/landlord/dashboard')}>
            <img src={nestPayLogo} alt="NEST PAY" className="h-14 w-14" />
            <h1 className="text-2xl font-brand tracking-wide">NEST PAY</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isActive('/landlord/requests') ? 'default' : 'outline'}
              onClick={() => navigate('/landlord/requests')}
              size="sm"
            >
              Tenant Requests
            </Button>
            <Button
              variant={isActive('/landlord/payments') ? 'default' : 'outline'}
              onClick={() => navigate('/landlord/payments')}
              size="sm"
            >
              Payments
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
          <div className="flex items-center gap-2" onClick={() => navigate('/landlord/dashboard')}>
            <img src={nestPayLogo} alt="NEST PAY" className="h-12 w-12" />
            <h1 className="text-xl font-brand tracking-wide">NEST PAY</h1>
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

      {/* Floating Add Property Button - Mobile Only */}
      {location.pathname === '/landlord/dashboard' && (
        <Button
          onClick={() => navigate('/landlord/properties/new')}
          className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <LandlordBottomNav />

      {/* Side Drawer */}
      <LandlordSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default LandlordLayout;
