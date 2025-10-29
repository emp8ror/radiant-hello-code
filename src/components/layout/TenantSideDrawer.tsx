import { Settings, LogOut, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TenantSideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TenantSideDrawer = ({ open, onOpenChange }: TenantSideDrawerProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: Settings, label: 'Settings', onClick: () => navigate('/settings') },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
  ];

  const handleSignOut = () => {
    onOpenChange(false);
    signOut();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 py-2 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DrawerClose key={item.label} asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12"
                  onClick={item.onClick}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </DrawerClose>
            );
          })}
          <Separator className="my-4" />
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TenantSideDrawer;
