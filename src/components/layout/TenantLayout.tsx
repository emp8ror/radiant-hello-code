import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, DollarSign, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import nestPayLogo from '@/assets/nest-pay-logo.png';
import TenantBottomNav from './TenantBottomNav';
import TenantSideDrawer from './TenantSideDrawer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ActiveProperty {
  property_id: string;
  properties: {
    title: string;
    rent_amount: number;
    rent_currency: string;
  };
}

interface TenantLayoutProps {
  children: ReactNode;
}

const TenantLayout = ({ children }: TenantLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProperties, setActiveProperties] = useState<ActiveProperty[]>([]);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user) {
      fetchActiveProperties();
    }
  }, [user]);

  const fetchActiveProperties = async () => {
    const { data } = await supabase
      .from('tenant_properties')
      .select(`
        property_id,
        properties (
          title,
          rent_amount,
          rent_currency
        )
      `)
      .eq('tenant_id', user?.id)
      .eq('status', 'active');

    if (data) {
      setActiveProperties(data as ActiveProperty[]);
    }
  };

  const handlePayRentClick = () => {
    if (activeProperties.length === 0) {
      return; // No active properties
    }
    if (activeProperties.length === 1) {
      navigate(`/tenant/pay/${activeProperties[0].property_id}`);
    } else {
      setPropertyDialogOpen(true);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    setPropertyDialogOpen(false);
    navigate(`/tenant/pay/${propertyId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Header */}
      <header className="hidden md:block border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={nestPayLogo} alt="NEST PAY" className="h-14 w-14" />
            <h1 className="text-2xl font-brand tracking-wide">NEST PAY</h1>
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
          <div className="flex items-center gap-2">
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

      {/* Floating Pay Rent Button - Mobile Only */}
      {location.pathname === '/tenant/dashboard' && activeProperties.length > 0 && (
        <Button
          onClick={handlePayRentClick}
          className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          size="icon"
        >
          <DollarSign className="h-6 w-6" />
        </Button>
      )}

      {/* Property Selection Dialog */}
      <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Property</DialogTitle>
            <DialogDescription>
              Choose which property you want to pay rent for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {activeProperties.map((tp) => (
              <Button
                key={tp.property_id}
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => handlePropertySelect(tp.property_id)}
              >
                <span className="font-medium">{tp.properties.title}</span>
                <span className="text-primary">
                  {tp.properties.rent_currency} {tp.properties.rent_amount.toLocaleString()}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile Only */}
      <TenantBottomNav />

      {/* Side Drawer */}
      <TenantSideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default TenantLayout;
