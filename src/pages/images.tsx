import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { generateImage } from '@/lib/aiml';
import { Database } from '@/lib/database.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImagePlus, ChevronLeft, Heart, Globe2, Lock, Loader2, AlertCircle, Download, Share2, Sparkles } from 'lucide-react';

type GeneratedImage = Database['public']['Tables']['generated_images']['Row'];

export default function ImagesPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [publicImages, setPublicImages] = useState<(GeneratedImage & { likes: number })[]>([]);
  const [rateLimit, setRateLimit] = useState<{
    remaining: number;
    reset_time: string;
    total: number;
  } | null>(null);
  const [promptSuggestions] = useState([
    "A magical forest with glowing mushrooms and fairy lights",
    "A futuristic cityscape at sunset with flying cars",
    "An underwater palace with mermaids and sea creatures",
    "A steampunk-inspired mechanical dragon",
    "A cozy cafe in Paris on a rainy evening"
  ]);

  useEffect(() => {
    loadImages();
    checkRateLimit();
  }, []);

  const checkRateLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_limit_type: 'image'
      });

      if (error) throw error;
      setRateLimit(data);
    } catch (error) {
      console.error('Error checking rate limit:', error);
    }
  };

  const loadImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load user's images
      const { data: userImages } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userImages) {
        setImages(userImages);
      }

      // Load public images with like counts
      const { data: publicImagesData } = await supabase
        .from('generated_images')
        .select(`
          *,
          likes:image_likes(count)
        `)
        .eq('is_public', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (publicImagesData) {
        setPublicImages(
          publicImagesData.map(img => ({
            ...img,
            likes: img.likes?.[0]?.count || 0
          }))
        );
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check rate limit
      if (rateLimit && rateLimit.remaining === 0) {
        const resetTime = new Date(rateLimit.reset_time);
        throw new Error(`Rate limit reached. Try again after ${resetTime.toLocaleTimeString()}`);
      }

      const imageUrl = await generateImage(prompt);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: image, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          prompt: prompt,
          image_url: imageUrl,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      if (image) {
        setImages([image, ...images]);
        // Increment rate limit counter
        await supabase.rpc('increment_rate_limit', { p_user_id: user.id, p_limit_type: 'image' });
        await checkRateLimit();
        setPrompt('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeImage = async (imageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('image_likes')
        .insert({
          image_id: imageId,
          user_id: user.id
        });

      setPublicImages(
        publicImages.map(img => 
          img.id === imageId 
            ? { ...img, likes: img.likes + 1 }
            : img
        )
      );
    } catch (error) {
      console.error('Error liking image:', error);
    }
  };

  const handleTogglePublic = async (imageId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ is_public: !isPublic })
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.map(img =>
        img.id === imageId
          ? { ...img, is_public: !isPublic }
          : img
      ));
    } catch (error) {
      console.error('Error updating image visibility:', error);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>
        </div>

        <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Image</h2>
          <div className="space-y-4">
            {rateLimit && rateLimit.remaining >= 0 && (
              <div className="text-sm text-gray-400">
                {rateLimit.remaining === 0 ? (
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <p>Generation limit reached. Resets at {new Date(rateLimit.reset_time).toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <p>{rateLimit.remaining} of {rateLimit.total} generations remaining today</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="my-images" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="my-images" className="data-[state=active]:bg-white/10">
              <ImagePlus className="w-4 h-4 mr-2" />
              My Images
            </TabsTrigger>
            <TabsTrigger value="public-images" className="data-[state=active]:bg-white/10">
              <Globe2 className="w-4 h-4 mr-2" />
              Public Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-images">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                    <img
                      src={image.image_url}
                      alt={image.prompt.slice(0, 100)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <div className="flex space-x-2">
                        <a
                          href={image.image_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(image.image_url);
                            // You could add a toast notification here
                          }}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePublic(image.id, image.is_public)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {image.is_public ? (
                        <>
                          <Globe2 className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Private</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="px-3 py-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="public-images">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                    <img
                      src={image.image_url}
                      alt={image.prompt.slice(0, 100)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <div className="flex space-x-2">
                        <a
                          href={image.image_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {image.prompt}
                  </p>
                  <button
                    onClick={() => handleLikeImage(image.id)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-sm">{image.likes}</span>
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}