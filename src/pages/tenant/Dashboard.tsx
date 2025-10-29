import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, DollarSign, LogOut, Calendar, Star } from 'lucide-react';
import nestPayLogo from '@/assets/nest-pay-logo.png';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TenantProperty {
  id: string;
  status: string;
  joined_at: string | null;
  last_payment_date: string | null;
  property_id: string;
  properties: {
    title: string;
    address: string;
    rent_amount: number;
    rent_currency: string;
    rent_due_day: number | null;
  };
}

const TenantDashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole === 'landlord') {
      navigate('/landlord/dashboard');
      return;
    }
    fetchProperties();
  }, [user, userRole, navigate]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenant_properties')
      .select(`
        *,
        properties (
          title,
          address,
          rent_amount,
          rent_currency,
          rent_due_day
        )
      `)
      .eq('tenant_id', user?.id);

    if (data && !error) {
      setProperties(data as any);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={nestPayLogo} alt="NEST PAY" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">NEST PAY</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/tenant/browse')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Properties
            </Button>
            <Button variant="outline" onClick={() => navigate('/tenant/payments')}>
              My Payments
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Settings
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Tenant Dashboard</h2>
            <p className="text-muted-foreground">Your properties and payment status</p>
          </div>
          <Button onClick={() => navigate('/tenant/join')} size="lg">
            <Search className="h-4 w-4 mr-2" />
            Join Property
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Properties</CardTitle>
            <CardDescription>Properties you have joined or requested to join</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading properties...</p>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">You haven't joined any properties yet</p>
                <Button onClick={() => navigate('/tenant/browse')}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Available Properties
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((tp) => (
                  <Card key={tp.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{tp.properties.title}</h3>
                            {getStatusBadge(tp.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{tp.properties.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-primary">
                            {tp.properties.rent_currency} {Number(tp.properties.rent_amount).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">per month</p>
                        </div>
                      </div>

                      {tp.status === 'active' && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Joined Date</p>
                            <p className="font-medium">{tp.joined_at ? format(new Date(tp.joined_at), 'PP') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Last Payment</p>
                            <p className="font-medium">{tp.last_payment_date ? format(new Date(tp.last_payment_date), 'PP') : 'No payments yet'}</p>
                          </div>
                          {tp.properties.rent_due_day && (
                            <div>
                              <p className="text-sm text-muted-foreground">Rent Due Day</p>
                              <p className="font-medium">Day {tp.properties.rent_due_day} of month</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        {tp.status === 'active' && (
                          <>
                            <Button onClick={() => navigate(`/tenant/pay/${tp.property_id}`)} className="flex-1">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Pay Rent
                            </Button>
                            <Button variant="outline" onClick={() => navigate(`/property/${tp.property_id}`)}>
                              View Details
                            </Button>
                            <Button variant="outline" onClick={() => navigate(`/tenant/review/${tp.property_id}`)}>
                              <Star className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </>
                        )}
                        {tp.status === 'pending' && (
                          <Button variant="outline" disabled className="flex-1">
                            Waiting for Approval
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TenantDashboard;
