import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const PropertyForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; image_url: string; is_cover: boolean }>>([]);
  const [units, setUnits] = useState<Array<{ id?: string; label: string; description: string; rent_amount: string; is_available: boolean }>>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    region: '',
    country: 'Uganda',
    rent_amount: '',
    rent_currency: 'UGX',
    rent_due_interval: 'monthly',
    rent_due_day: '',
    is_active: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchProperty();
    }
  }, [id, user]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      setFormData({
        title: data.title,
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country || 'Uganda',
        rent_amount: data.rent_amount.toString(),
        rent_currency: data.rent_currency || 'UGX',
        rent_due_interval: data.rent_due_interval || 'monthly',
        rent_due_day: data.rent_due_day?.toString() || '',
        is_active: data.is_active,
      });

      // Fetch existing images
      const { data: imgData } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id);
      
      if (imgData) {
        setExistingImages(imgData);
      }

      // Fetch existing units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', id);
      
      if (unitsData) {
        setUnits(unitsData.map(unit => ({
          id: unit.id,
          label: unit.label,
          description: unit.description || '',
          rent_amount: unit.rent_amount?.toString() || '',
          is_available: unit.is_available || true,
        })));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string, imageUrl: string) => {
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (!deleteError) {
      // Delete from storage
      const path = imageUrl.split('/').pop();
      if (path) {
        await supabase.storage.from('property-images').remove([path]);
      }
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast({ title: 'Image removed' });
    }
  };

  const uploadImages = async (propertyId: string) => {
    setUploading(true);
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${propertyId}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('property-images')
        .upload(fileName, image);

      if (uploadError) {
        toast({ title: 'Image upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      await supabase.from('property_images').insert({
        property_id: propertyId,
        image_url: publicUrl,
        filename: image.name,
        is_cover: existingImages.length === 0 && images.indexOf(image) === 0,
      });
    }
    setUploading(false);
  };

  const addUnit = () => {
    setUnits([...units, { label: '', description: '', rent_amount: '', is_available: true }]);
  };

  const removeUnit = async (index: number) => {
    const unit = units[index];
    if (unit.id) {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unit.id);
      
      if (error) {
        toast({ title: 'Failed to delete unit', description: error.message, variant: 'destructive' });
        return;
      }
    }
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: string, value: string | boolean) => {
    const newUnits = [...units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setUnits(newUnits);
  };

  const saveUnits = async (propertyId: string) => {
    for (const unit of units) {
      const unitData = {
        property_id: propertyId,
        label: unit.label,
        description: unit.description,
        rent_amount: unit.rent_amount ? parseFloat(unit.rent_amount) : null,
        is_available: unit.is_available,
      };

      if (unit.id) {
        await supabase
          .from('units')
          .update(unitData)
          .eq('id', unit.id);
      } else {
        await supabase
          .from('units')
          .insert(unitData);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const propertyData = {
      ...formData,
      rent_amount: parseFloat(formData.rent_amount),
      rent_due_day: formData.rent_due_day ? parseInt(formData.rent_due_day) : null,
      owner_id: user?.id,
    };

    if (id) {
      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id);

      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        await uploadImages(id);
        await saveUnits(id);
        toast({ title: 'Property updated successfully' });
        navigate('/landlord/dashboard');
      }
    } else {
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        toast({ title: 'Creation failed', description: error.message, variant: 'destructive' });
      } else if (data) {
        await uploadImages(data.id);
        await saveUnits(data.id);
        toast({ title: 'Property created successfully' });
        navigate('/landlord/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/landlord/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{id ? 'Edit Property' : 'Add New Property'}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Modern 2-bedroom apartment"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kampala"
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Central"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rent_amount">Rent Amount *</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    required
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    placeholder="500000"
                  />
                </div>

                <div>
                  <Label htmlFor="rent_currency">Currency</Label>
                  <Select value={formData.rent_currency} onValueChange={(value) => setFormData({ ...formData, rent_currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rent_due_day">Due Day (1-31)</Label>
                  <Input
                    id="rent_due_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.rent_due_day}
                    onChange={(e) => setFormData({ ...formData, rent_due_day: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Listing</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Units (Optional)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {units.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No units added. Add units if this property has multiple rentable units (e.g., apartments, rooms, parking spaces).
                </p>
              ) : (
                units.map((unit, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Unit {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnit(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`unit-label-${index}`}>Unit Label *</Label>
                          <Input
                            id={`unit-label-${index}`}
                            required={units.length > 0}
                            value={unit.label}
                            onChange={(e) => updateUnit(index, 'label', e.target.value)}
                            placeholder="e.g., Apt 101, Room A"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`unit-rent-${index}`}>Unit Rent Amount</Label>
                          <Input
                            id={`unit-rent-${index}`}
                            type="number"
                            value={unit.rent_amount}
                            onChange={(e) => updateUnit(index, 'rent_amount', e.target.value)}
                            placeholder="Leave empty to use property default"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`unit-description-${index}`}>Description</Label>
                        <Textarea
                          id={`unit-description-${index}`}
                          value={unit.description}
                          onChange={(e) => updateUnit(index, 'description', e.target.value)}
                          placeholder="Unit details..."
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`unit-available-${index}`}
                          checked={unit.is_available}
                          onCheckedChange={(checked) => updateUnit(index, 'is_available', checked)}
                        />
                        <Label htmlFor={`unit-available-${index}`}>Available for rent</Label>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Property Images</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload images</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>

                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Existing Images</p>
                    <div className="grid grid-cols-3 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.id} className="relative group">
                          <img src={img.image_url} alt="Property" className="w-full h-24 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(img.id, img.image_url)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">New Images to Upload</p>
                    <div className="grid grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {loading || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                id ? 'Update Property' : 'Create Property'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/landlord/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PropertyForm;
