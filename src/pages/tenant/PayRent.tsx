import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, CreditCard } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Property {
  id: string;
  title: string;
  rent_amount: number;
  rent_currency: string;
}

const PayRent = () => {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'manual' | 'online'>('manual');
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProperty();
  }, [propertyId, user]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, rent_amount, rent_currency')
      .eq('id', propertyId)
      .single();

    if (data && !error) {
      setProperty(data);
      setAmount(data.rent_amount.toString());
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input before submission
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (parsedAmount > 100000000) {
      toast({
        title: 'Validation Error',
        description: 'Amount exceeds maximum allowed',
        variant: 'destructive',
      });
      return;
    }

    if (method === 'online' && !provider) {
      toast({
        title: 'Validation Error',
        description: 'Please select a payment provider',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const paymentData = {
      tenant_id: user?.id,
      property_id: propertyId,
      amount: parsedAmount,
      currency: property?.rent_currency || 'UGX',
      method: method,
      provider: method === 'online' ? provider : null,
      status: 'pending',
    };

    const { error } = await supabase
      .from('payments')
      .insert(paymentData);

    if (error) {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Payment submitted',
        description: method === 'manual'
          ? 'Your payment has been recorded and is pending landlord confirmation.'
          : 'Your payment is being processed. You will be notified once completed.',
      });
      navigate('/tenant/dashboard');
    }

    setLoading(false);
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tenant/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Pay Rent</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Pay Rent for {property.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
                <p className="text-3xl font-bold text-primary">
                  {property.rent_currency} {property.rent_amount.toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label>Payment Method *</Label>
                <RadioGroup value={method} onValueChange={(value: any) => setMethod(value)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Manual Payment</p>
                          <p className="text-sm text-muted-foreground">
                            Cash, bank transfer, or other offline method
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-muted-foreground">
                            Mobile money, card payment (Coming soon)
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {method === 'online' && (
                <div>
                  <Label htmlFor="provider">Payment Provider *</Label>
                  <Select value={provider} onValueChange={setProvider} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="airtel_money">Airtel Money</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Online payment integration coming soon
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || (method === 'online' && !provider)} className="flex-1">
                  {loading ? 'Processing...' : 'Submit Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/tenant/dashboard')}>
                  Cancel
                </Button>
              </div>

              {method === 'manual' && (
                <p className="text-sm text-muted-foreground text-center">
                  Your payment will be marked as pending until the landlord confirms receipt.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PayRent;
