import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LandlordLayout from '@/components/layout/LandlordLayout';

interface Property {
  id: string;
  title: string;
  address: string;
  rent_amount: number;
  rent_currency: string;
  is_active: boolean;
  cover_image: string | null;
  average_rating: number | null;
  review_count: number | null;
}

const LandlordDashboard = () => {
  const { user, userRole } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalTenants: 0,
    totalRevenue: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole === 'tenant') {
      navigate('/tenant/dashboard');
      return;
    }
    fetchProperties();
  }, [user, userRole, navigate]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('property_summary')
      .select('*')
      .eq('owner_id', user?.id);

    if (data && !error) {
      setProperties(data as Property[]);
      calculateStats(data as Property[]);
    }
    setLoading(false);
  };

  const calculateStats = async (props: Property[]) => {
    const activeProps = props.filter(p => p.is_active);
    
    const { data: tenantData } = await supabase
      .from('tenant_properties')
      .select('id, property_id')
      .eq('status', 'active')
      .in('property_id', props.map(p => p.id));
    
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .in('property_id', props.map(p => p.id));

    const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    setStats({
      totalProperties: props.length,
      activeProperties: activeProps.length,
      totalTenants: tenantData?.length || 0,
      totalRevenue,
    });
  };

  return (
    <LandlordLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-sm md:text-base">Manage your properties and tenants</p>
        </div>
        <Button onClick={() => navigate('/landlord/properties/new')} className="hidden md:flex">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Properties</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold">{stats.totalProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold text-primary">{stats.activeProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Tenants</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-2xl md:text-3xl font-bold">{stats.totalTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">UGX {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Section */}
      <Card id="properties">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">Your Properties</CardTitle>
          <CardDescription className="text-sm">Manage and view all your rental properties</CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading properties...</p>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No properties yet</p>
              <Button onClick={() => navigate('/landlord/properties/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/landlord/properties/${property.id}`)}>
                  {property.cover_image ? (
                    <img src={property.cover_image} alt={property.title} className="w-full h-36 md:h-48 object-cover" />
                  ) : (
                    <div className="w-full h-36 md:h-48 bg-muted flex items-center justify-center">
                      <Building2 className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3 md:p-4">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-semibold text-base md:text-lg line-clamp-1">{property.title}</h3>
                      <Badge variant={property.is_active ? "default" : "secondary"} className="shrink-0 text-xs">
                        {property.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mb-2">{property.address}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary text-sm md:text-base">
                        {property.rent_currency} {Number(property.rent_amount).toLocaleString()}
                      </span>
                      {property.review_count && property.review_count > 0 && (
                        <div className="flex items-center gap-1 text-xs md:text-sm">
                          <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                          <span>{property.average_rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground">({property.review_count})</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </LandlordLayout>
  );
};

export default LandlordDashboard;
