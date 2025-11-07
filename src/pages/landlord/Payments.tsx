import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/landlord/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Payments</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading payments...</p>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payments yet</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LandlordPayments;
