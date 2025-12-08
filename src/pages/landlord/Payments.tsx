import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { DollarSign, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import LandlordLayout from '@/components/layout/LandlordLayout';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_on: string | null;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  properties: {
    title: string;
    rent_amount: number;
  };
  units: {
    label: string;
    rent_amount: number | null;
  } | null;
  user_profiles: {
    full_name: string;
    phone: string | null;
  };
}

const LandlordPayments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);

    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', user?.id);

    if (!properties || properties.length === 0) {
      setLoading(false);
      return;
    }

    const propertyIds = properties.map(p => p.id);

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        properties(title, rent_amount),
        units(label, rent_amount),
        user_profiles!payments_tenant_id_fkey(full_name, phone)
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setPayments(data as any);
    }
    setLoading(false);
  };

  const markAsPaid = async (paymentId: string) => {
    const { error } = await supabase.rpc('mark_payment_as_paid', {
      _payment_id: paymentId,
      _provider_ref: 'manual',
      _paid_on: new Date().toISOString(),
    });

    if (error) {
      toast({ title: 'Failed to mark as paid', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment marked as paid' });
      fetchPayments();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <LandlordLayout>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Payments</h2>
        <p className="text-muted-foreground text-sm">View and manage tenant payments</p>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">Tenant Payments</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading payments...</p>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payments yet</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const expectedRent = payment.units?.rent_amount ?? payment.properties.rent_amount;
                      const balance = expectedRent - payment.amount;
                      
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.created_at), 'PP')}</TableCell>
                          <TableCell>{payment.user_profiles.full_name}</TableCell>
                          <TableCell>{payment.user_profiles.phone || 'N/A'}</TableCell>
                          <TableCell>{payment.units?.label || 'N/A'}</TableCell>
                          <TableCell className="font-medium">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {balance > 0 ? (
                              <span className="text-destructive font-medium">
                                {payment.currency} {balance.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => markAsPaid(payment.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {payments.map((payment) => {
                  const expectedRent = payment.units?.rent_amount ?? payment.properties.rent_amount;
                  const balance = expectedRent - payment.amount;
                  
                  return (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{payment.user_profiles.full_name}</p>
                            <p className="text-xs text-muted-foreground">{payment.units?.label || 'N/A'}</p>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {format(new Date(payment.created_at), 'PP')}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-primary">
                              {payment.currency} {payment.amount.toLocaleString()}
                            </p>
                            {balance > 0 && (
                              <p className="text-xs text-destructive">
                                Balance: {payment.currency} {balance.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(payment.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </LandlordLayout>
  );
};

export default LandlordPayments;
