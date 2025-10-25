import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Search } from 'lucide-react';

const JoinProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState(searchParams.get('code') || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user]);

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.rpc('request_join_property_by_code', {
      _property_code: joinCode.trim(),
      _tenant: user?.id,
      _message: message || null,
    });

    if (error) {
      toast({
        title: 'Join request failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Request submitted',
        description: 'The landlord will review your request.',
      });
      navigate('/tenant/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tenant/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Join Property</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Request to Join a Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRequest} className="space-y-4">
              <div>
                <Label htmlFor="joinCode">Property Join Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="joinCode"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter join code (e.g., ABCD-123456)"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => navigate('/tenant/browse')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get the join code from the landlord or property listing
                </p>
              </div>

              <div>
                <Label htmlFor="message">Message to Landlord (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself or mention any specific requirements..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/tenant/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JoinProperty;
