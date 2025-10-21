import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building2, Search, Star, ArrowLeft, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  region: string;
  country: string;
  rent_amount: number;
  rent_currency: string;
  rent_due_interval: string;
  cover_image: string | null;
  average_rating: number | null;
  review_count: number | null;
}

const BrowseProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProperties();
  }, [user, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.region?.toLowerCase().includes(query)
      );
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('property_summary')
      .select('*')
      .eq('is_active', true);

    if (data && !error) {
      setProperties(data as Property[]);
      setFilteredProperties(data as Property[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tenant/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Browse Properties</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading properties...</p>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No properties found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                {property.cover_image ? (
                  <img
                    src={property.cover_image}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="line-clamp-2">
                      {[property.address, property.city, property.region, property.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-bold text-xl text-primary">
                        {property.rent_currency} {Number(property.rent_amount).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/{property.rent_due_interval}</span>
                    </div>
                    {property.review_count && property.review_count > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{property.average_rating?.toFixed(1)}</span>
                        <span className="text-muted-foreground">({property.review_count})</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {property.description || 'No description available'}
                  </p>
                  <Button className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/property/${property.id}`);
                  }}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseProperties;
