import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Check, X, User } from 'lucide-react';
import LandlordLayout from '@/components/layout/LandlordLayout';

interface JoinRequest {
  id: string;
  status: string;
  created_at: string;
  invitation_message: string | null;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  properties: {
    title: string;
  };
  tenant: {
    full_name: string;
    phone: string;
  } | null;
  units: {
    label: string;
    unit_type: string;
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
        tenant:user_profiles!tenant_properties_tenant_id_user_profiles_fkey(full_name, phone),
        units(label, unit_type)
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId: string, unitId: string | null, tenantId: string) => {
    const { error: updateError } = await supabase
      .from('tenant_properties')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      toast({ title: 'Failed to approve', description: updateError.message, variant: 'destructive' });
      return;
    }

    // If a unit was selected, mark it as occupied
    if (unitId) {
      const { error: unitError } = await supabase
        .from('units')
        .update({ tenant_id: tenantId })
        .eq('id', unitId);

      if (unitError) {
        toast({ title: 'Warning', description: 'Request approved but unit update failed', variant: 'destructive' });
      }
    }

    toast({ title: 'Request approved' });
    fetchRequests();
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
    <LandlordLayout>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Tenant Requests</h2>
        <p className="text-muted-foreground text-sm">Manage join requests from tenants</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">Join Requests</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No join requests yet</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base md:text-lg truncate">{request.tenant?.full_name || 'Unknown Tenant'}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">
                          Property: {request.properties.title}
                        </p>
                        {request.units && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Unit: {request.units.label} ({request.units.unit_type})
                          </p>
                        )}
                        {request.tenant?.phone && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Phone: {request.tenant.phone}
                          </p>
                        )}
                        {request.invitation_message && (
                          <p className="text-xs md:text-sm mt-2 p-2 bg-muted rounded">
                            "{request.invitation_message}"
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.id, request.unit_id, request.tenant_id)}
                          className="flex-1"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1 md:mr-2" />
                          <span className="hidden sm:inline">Approve</span>
                          <span className="sm:hidden">OK</span>
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1 md:mr-2" />
                          <span className="hidden sm:inline">Reject</span>
                          <span className="sm:hidden">No</span>
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
    </LandlordLayout>
  );
};

export default JoinRequests;
