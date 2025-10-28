import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, X, User } from 'lucide-react';

interface JoinRequest {
  id: string;
  status: string;
  created_at: string;
  invitation_message: string | null;
  tenant_id: string;
  property_id: string;
  properties: {
    title: string;
  };
  tenant: {
    full_name: string;
    phone: string;
  } | null;
}

const JoinRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
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
      .from('tenant_properties')
      .select(`
        *,
        properties(title),
        tenant:user_profiles!tenant_properties_tenant_id_user_profiles_fkey(full_name, phone)
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId: string) => {
    const { error } = await supabase
      .from('tenant_properties')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Failed to approve', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request approved' });
      fetchRequests();
    }
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('tenant_properties')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Failed to reject', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request rejected' });
      fetchRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      pending: 'secondary',
      rejected: 'destructive',
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
            <h1 className="text-2xl font-bold">Tenant Join Requests</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Join Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No join requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.tenant?.full_name || 'Unknown Tenant'}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Property: {request.properties.title}
                          </p>
                          {request.tenant?.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {request.tenant.phone}
                            </p>
                          )}
                          {request.invitation_message && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              "{request.invitation_message}"
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(request.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
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

export default JoinRequests;
