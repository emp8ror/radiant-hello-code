import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut,
  Plus,
  ClipboardList
} from 'lucide-react';
import nestPayLogo from '@/assets/nest-pay-logo.png';

interface LandlordSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LandlordSideDrawer = ({ open, onOpenChange }: LandlordSideDrawerProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = () => {
    onOpenChange(false);
    signOut();
  };

  const menuItems = [
    { icon: Building2, label: 'Dashboard', path: '/landlord/dashboard' },
    { icon: Plus, label: 'Add Property', path: '/landlord/properties/new' },
    { icon: Users, label: 'Tenants', path: '/landlord/tenants' },
    { icon: ClipboardList, label: 'Tenant Requests', path: '/landlord/requests' },
    { icon: DollarSign, label: 'Payments', path: '/landlord/payments' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader className="border-b pb-4 mb-4">
          <SheetTitle className="flex items-center gap-3">
            <img src={nestPayLogo} alt="NEST PAY" className="h-10 w-10" />
            <span className="font-extrabold">NEST PAY</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start h-12"
                onClick={() => handleNavigation(item.path)}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            );
          })}
          
          <div className="border-t my-4" />
          
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LandlordSideDrawer;
