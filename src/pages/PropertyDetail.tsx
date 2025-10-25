import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, DollarSign, Star, Building2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PropertyDetails {
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
  rent_due_day: number | null;
  is_active: boolean;
  owner_id: string;
  average_rating: number | null;
  review_count: number | null;
  join_code: string;
}

interface PropertyImage {
  id: string;
  image_url: string;
  is_cover: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  tenant_id: string;
  user_profiles: {
    full_name: string;
  };
}

const PropertyDetail = () => {
  const { id } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProperty();
  }, [id, user]);

  const fetchProperty = async () => {
    setLoading(true);

    const { data: propData, error } = await supabase
      .from('property_summary')
      .select('*')
      .eq('id', id)
      .single();

    if (propData && !error) {
      setProperty(propData as PropertyDetails);
      setIsOwner(propData.owner_id === user?.id);
    }

    const { data: imgData } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', id)
      .order('is_cover', { ascending: false });

    if (imgData) {
      setImages(imgData);
    }

    const { data: reviewData } = await supabase
      .from('property_reviews')
      .select(`
        *,
        user_profiles(full_name)
      `)
      .eq('property_id', id)
      .order('created_at', { ascending: false });

    if (reviewData) {
      setReviews(reviewData as any);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Property not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Property Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {images.length > 0 ? (
          <div className="mb-8">
            <img
              src={images[0].image_url}
              alt={property.title}
              className="w-full h-96 object-cover rounded-lg"
            />
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {images.slice(1, 5).map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt="Property"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-muted flex items-center justify-center rounded-lg mb-8">
            <Building2 className="h-24 w-24 text-muted-foreground" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{property.title}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[property.address, property.city, property.region, property.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                </div>
                <Badge variant={property.is_active ? 'default' : 'secondary'}>
                  {property.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {property.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{property.description}</p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-xl mb-4">Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{review.user_profiles.full_name}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rent Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    {property.rent_currency} {property.rent_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">per {property.rent_due_interval}</p>
                </div>

                {property.rent_due_day && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Due on day {property.rent_due_day} of month</span>
                  </div>
                )}

                {property.review_count && property.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{property.average_rating?.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({property.review_count} reviews)</span>
                  </div>
                )}

                <Separator />

                {isOwner ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Join Code</p>
                      <code className="block p-2 bg-muted rounded text-center font-mono">
                        {property.join_code}
                      </code>
                    </div>
                    <Button className="w-full" onClick={() => navigate(`/landlord/properties/${id}/edit`)}>
                      Edit Property
                    </Button>
                  </>
                ) : userRole === 'tenant' ? (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/tenant/join?code=${property.join_code}`)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request to Join
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
