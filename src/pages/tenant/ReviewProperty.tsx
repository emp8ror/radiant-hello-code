import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Star } from 'lucide-react';

interface Property {
  id: string;
  title: string;
}

const ReviewProperty = () => {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProperty();
    checkExistingReview();
  }, [propertyId, user]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title')
      .eq('id', propertyId)
      .single();

    if (data && !error) {
      setProperty(data);
    }
  };

  const checkExistingReview = async () => {
    const { data } = await supabase
      .from('property_reviews')
      .select('*')
      .eq('property_id', propertyId)
      .eq('tenant_id', user?.id)
      .maybeSingle();

    if (data) {
      setExistingReview(data);
      setRating(data.rating);
      setComment(data.comment || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const reviewData = {
      property_id: propertyId,
      tenant_id: user?.id,
      rating,
      comment: comment || null,
    };

    let error;

    if (existingReview) {
      ({ error } = await supabase
        .from('property_reviews')
        .update(reviewData)
        .eq('id', existingReview.id));
    } else {
      ({ error } = await supabase
        .from('property_reviews')
        .insert(reviewData));
    }

    if (error) {
      toast({
        title: 'Review submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: existingReview ? 'Review updated' : 'Review submitted',
        description: 'Thank you for your feedback!',
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
            <h1 className="text-2xl font-bold">
              {existingReview ? 'Update Review' : 'Write a Review'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{property.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Rating *</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="comment">Your Review (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this property..."
                  rows={6}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading || rating === 0} className="flex-1">
                  {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
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

export default ReviewProperty;
