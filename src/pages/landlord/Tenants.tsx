import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import LandlordLayout from '@/components/layout/LandlordLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Home, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';

interface Tenant {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  tenant_phone: string | null;
  property_title: string;
  unit_label: string | null;
  rent_amount: number;
  rent_currency: string;
  joined_at: string | null;
  last_payment_date: string | null;
  payment_expires_at: string | null;
  status: string;
}

const LandlordTenants = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTenants();
  }, [user, authLoading]);

  const fetchTenants = async () => {
    setLoading(true);
    
    // Get landlord's properties
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, rent_amount, rent_currency')
      .eq('owner_id', user?.id);

    if (!properties || properties.length === 0) {
      setTenants([]);
      setLoading(false);
      return;
    }

    const propertyIds = properties.map(p => p.id);

    // Get tenant_properties with tenant info
    const { data: tenantProperties } = await supabase
      .from('tenant_properties')
      .select(`
        id,
        tenant_id,
        property_id,
        unit_id,
        status,
        joined_at,
        last_payment_date
      `)
      .in('property_id', propertyIds)
      .eq('status', 'active');

    if (!tenantProperties || tenantProperties.length === 0) {
      setTenants([]);
      setLoading(false);
      return;
    }

    // Get tenant profiles
    const tenantIds = [...new Set(tenantProperties.map(tp => tp.tenant_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone')
      .in('id', tenantIds);

    // Get units
    const unitIds = tenantProperties.filter(tp => tp.unit_id).map(tp => tp.unit_id);
    const { data: units } = await supabase
      .from('units')
      .select('id, label, rent_amount')
      .in('id', unitIds);

    // Get latest payments with expiry info
    const { data: payments } = await supabase
      .from('payments')
      .select('tenant_id, property_id, payment_expires_at, paid_on, status')
      .in('tenant_id', tenantIds)
      .eq('status', 'paid')
      .order('paid_on', { ascending: false });

    // Map to tenant list
    const tenantList: Tenant[] = tenantProperties.map(tp => {
      const property = properties.find(p => p.id === tp.property_id);
      const profile = profiles?.find(p => p.id === tp.tenant_id);
      const unit = units?.find(u => u.id === tp.unit_id);
      const latestPayment = payments?.find(
        p => p.tenant_id === tp.tenant_id && p.property_id === tp.property_id
      );

      return {
        id: tp.id,
        tenant_id: tp.tenant_id,
        tenant_name: profile?.full_name || null,
        tenant_phone: profile?.phone || null,
        property_title: property?.title || 'Unknown Property',
        unit_label: unit?.label || null,
        rent_amount: unit?.rent_amount || property?.rent_amount || 0,
        rent_currency: property?.rent_currency || 'UGX',
        joined_at: tp.joined_at,
        last_payment_date: tp.last_payment_date,
        payment_expires_at: latestPayment?.payment_expires_at || null,
        status: tp.status,
      };
    });

    setTenants(tenantList);
    setLoading(false);
  };

  const getPaymentStatus = (tenant: Tenant) => {
    if (!tenant.payment_expires_at) {
      if (!tenant.last_payment_date) {
        return { status: 'never_paid', label: 'Never Paid', variant: 'destructive' as const };
      }
      return { status: 'unknown', label: 'Status Unknown', variant: 'secondary' as const };
    }

    const expiryDate = new Date(tenant.payment_expires_at);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, now);

    if (isPast(expiryDate)) {
      return { status: 'expired', label: 'Payment Overdue', variant: 'destructive' as const };
    }
    if (daysUntilExpiry <= 7) {
      return { status: 'expiring_soon', label: `Expires in ${daysUntilExpiry} days`, variant: 'warning' as const };
    }
    return { status: 'active', label: 'Paid', variant: 'success' as const };
  };

  return (
    <LandlordLayout>
      <div className="p-4 md:p-8 pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">View all your tenants and their payment status</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No active tenants yet</p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Tenants will appear here once they join your properties
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tenants.map((tenant) => {
              const paymentStatus = getPaymentStatus(tenant);
              
              return (
                <Card key={tenant.id} className="overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between md:justify-start md:gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {tenant.tenant_name || 'Unknown Tenant'}
                              </h3>
                              {tenant.tenant_phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {tenant.tenant_phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={paymentStatus.variant === 'success' ? 'default' : paymentStatus.variant === 'warning' ? 'secondary' : 'destructive'}
                            className={paymentStatus.variant === 'success' ? 'bg-green-500' : paymentStatus.variant === 'warning' ? 'bg-yellow-500 text-yellow-950' : ''}
                          >
                            {paymentStatus.variant === 'success' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {paymentStatus.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Property</p>
                            <p className="font-medium flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {tenant.property_title}
                            </p>
                          </div>
                          
                          {tenant.unit_label && (
                            <div>
                              <p className="text-muted-foreground">Unit</p>
                              <p className="font-medium">{tenant.unit_label}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-muted-foreground">Rent</p>
                            <p className="font-medium">
                              {tenant.rent_currency} {tenant.rent_amount.toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Joined</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {tenant.joined_at 
                                ? format(new Date(tenant.joined_at), 'MMM d, yyyy')
                                : 'Unknown'
                              }
                            </p>
                          </div>
                        </div>

                        {tenant.payment_expires_at && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Payment valid until: </span>
                            <span className={paymentStatus.status === 'expired' ? 'text-destructive font-medium' : 'font-medium'}>
                              {format(new Date(tenant.payment_expires_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}

                        {tenant.last_payment_date && !tenant.payment_expires_at && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Last payment: </span>
                            <span className="font-medium">
                              {format(new Date(tenant.last_payment_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default LandlordTenants;