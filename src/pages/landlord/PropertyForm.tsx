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
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const PropertyForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; image_url: string; is_cover: boolean }>>([]);
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

              <div className="flex gap-4 pt-4">
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
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default PropertyForm;
