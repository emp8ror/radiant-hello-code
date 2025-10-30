import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DoorOpen } from 'lucide-react';

interface Unit {
  id: string;
  label: string;
  unit_type: string;
  description: string | null;
  rent_amount: number | null;
  is_available: boolean;
}

interface UnitSelectorProps {
  propertyId: string;
  selectedUnitId: string | null;
  onUnitSelect: (unitId: string | null) => void;
  currency: string;
}

export const UnitSelector = ({ propertyId, selectedUnitId, onUnitSelect, currency }: UnitSelectorProps) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, [propertyId]);

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_available', true)
      .order('label');

    if (data && !error) {
      setUnits(data);
    }
    setLoading(false);
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading available units...</p>;
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-6 border rounded-lg bg-muted/50">
        <DoorOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No vacant units available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please contact the landlord for availability
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="unit-select">Select Unit (Optional)</Label>
        <Select value={selectedUnitId || ''} onValueChange={(value) => onUnitSelect(value || null)}>
          <SelectTrigger id="unit-select">
            <SelectValue placeholder="Choose a unit or leave blank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No specific unit</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.label} - {currency} {unit.rent_amount?.toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUnit && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{selectedUnit.label}</h4>
            <Badge variant="outline" className="capitalize">{selectedUnit.unit_type}</Badge>
          </div>
          {selectedUnit.description && (
            <p className="text-sm text-muted-foreground">{selectedUnit.description}</p>
          )}
          <p className="text-sm font-semibold">
            Rent: {currency} {selectedUnit.rent_amount?.toLocaleString()} /month
          </p>
        </div>
      )}
    </div>
  );
};
