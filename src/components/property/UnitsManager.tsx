import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, DoorOpen } from 'lucide-react';

interface Unit {
  id: string;
  label: string;
  unit_type: string;
  description: string | null;
  rent_amount: number | null;
  is_available: boolean;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_phone: string | null;
  tenant_status: string | null;
  last_payment_date: string | null;
}

interface UnitsManagerProps {
  propertyId: string;
  propertyRentAmount: number;
  propertyCurrency: string;
}

export const UnitsManager = ({ propertyId, propertyRentAmount, propertyCurrency }: UnitsManagerProps) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({
    label: '',
    unit_type: 'standard',
    description: '',
    rent_amount: propertyRentAmount,
  });

  useEffect(() => {
    fetchUnits();
  }, [propertyId]);

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('unit_occupancy')
      .select('*')
      .eq('property_id', propertyId)
      .order('label');

    if (data && !error) {
      setUnits(data);
    }
    setLoading(false);
  };

  const handleAddUnit = async () => {
    if (!newUnit.label.trim()) {
      toast({ title: 'Unit name is required', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('units').insert({
      property_id: propertyId,
      label: newUnit.label,
      unit_type: newUnit.unit_type,
      description: newUnit.description || null,
      rent_amount: newUnit.rent_amount,
    });

    if (error) {
      toast({ title: 'Failed to add unit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Unit added successfully' });
      setIsAddDialogOpen(false);
      setNewUnit({
        label: '',
        unit_type: 'standard',
        description: '',
        rent_amount: propertyRentAmount,
      });
      fetchUnits();
    }
  };

  const handleMarkVacant = async (unitId: string) => {
    const { error } = await supabase
      .from('units')
      .update({ tenant_id: null })
      .eq('id', unitId);

    if (error) {
      toast({ title: 'Failed to mark as vacant', description: error.message, variant: 'destructive' });
    } else {
      // Also update tenant_properties status
      await supabase
        .from('tenant_properties')
        .update({ status: 'inactive' })
        .eq('unit_id', unitId)
        .eq('status', 'active');
      
      toast({ title: 'Unit marked as vacant' });
      fetchUnits();
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (error) {
      toast({ title: 'Failed to delete unit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Unit deleted successfully' });
      fetchUnits();
    }
  };

  const vacantUnits = units.filter(u => u.is_available);
  const occupiedUnits = units.filter(u => !u.is_available);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Units</h3>
          <p className="text-sm text-muted-foreground">
            {units.length} total · {occupiedUnits.length} occupied · {vacantUnits.length} vacant
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Unit Name *</Label>
                <Input
                  id="label"
                  placeholder="e.g. Unit 1, Room A, Apt 2B"
                  value={newUnit.label}
                  onChange={(e) => setNewUnit({ ...newUnit, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_type">Unit Type</Label>
                <Select
                  value={newUnit.unit_type}
                  onValueChange={(value) => setNewUnit({ ...newUnit, unit_type: value })}
                >
                  <SelectTrigger id="unit_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="1-bedroom">1 Bedroom</SelectItem>
                    <SelectItem value="2-bedroom">2 Bedroom</SelectItem>
                    <SelectItem value="3-bedroom">3 Bedroom</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional details about the unit"
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rent_amount">Monthly Rent ({propertyCurrency})</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  value={newUnit.rent_amount}
                  onChange={(e) => setNewUnit({ ...newUnit, rent_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddUnit} className="flex-1">Add Unit</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading units...</p>
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No units added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add units to start managing tenants</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <Card key={unit.id} className={unit.is_available ? 'border-green-500/30' : 'border-blue-500/30'}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{unit.label}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{unit.unit_type}</p>
                  </div>
                  <Badge variant={unit.is_available ? 'default' : 'secondary'}>
                    {unit.is_available ? 'Vacant' : 'Occupied'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {unit.description && (
                  <p className="text-sm text-muted-foreground">{unit.description}</p>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-semibold">
                    {propertyCurrency} {unit.rent_amount?.toLocaleString() || 0}
                  </p>
                </div>
                
                {!unit.is_available && unit.tenant_name && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{unit.tenant_name}</span>
                    </div>
                    {unit.tenant_phone && (
                      <p className="text-xs text-muted-foreground">{unit.tenant_phone}</p>
                    )}
                    {unit.last_payment_date && (
                      <p className="text-xs text-muted-foreground">
                        Last payment: {new Date(unit.last_payment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!unit.is_available && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkVacant(unit.id)}
                      className="flex-1"
                    >
                      Mark Vacant
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUnit(unit.id)}
                    disabled={!unit.is_available}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
