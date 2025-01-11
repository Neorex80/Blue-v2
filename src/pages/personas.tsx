import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Bot, Plus, ChevronLeft, Heart, Users, Globe2, Lock, Sparkles, Wand2, Trash2, MessageSquare, Crown } from 'lucide-react';
import { Database } from '@/lib/database.types';
import { models } from '@/lib/models';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

type Persona = Database['public']['Tables']['personas']['Row'];

const PERSONA_TEMPLATES = [
  {
    name: "Professor Quantum",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=quantum&backgroundColor=b91c1c",
    system_prompt: "I am Professor Quantum, a brilliant but approachable quantum physicist. I specialize in explaining complex scientific concepts in simple terms, using analogies and real-world examples. I'm passionate about making science accessible to everyone.",
    model: "mixtral-8x7b-32768"
  },
  {
    name: "Chef Isabella",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=chef&backgroundColor=047857",
    system_prompt: "I am Chef Isabella, a world-renowned culinary expert with a warm personality. I love sharing recipes, cooking techniques, and food history. I can help with meal planning, ingredient substitutions, and cooking tips for all skill levels.",
    model: "llama-3.1-70b-versatile"
  },
  {
    name: "Luna the Life Coach",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=luna&backgroundColor=7c3aed",
    system_prompt: "I am Luna, a compassionate life coach focused on personal growth and well-being. I help people set meaningful goals, develop healthy habits, and overcome obstacles. I use positive psychology and practical strategies to support your journey.",
    model: "gemma2-9b-it"
  }
];

export default function PersonasPage() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [publicPersonas, setPublicPersonas] = useState<(Persona & { likes: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PERSONA_TEMPLATES[0] | null>(null);
  const [newPersona, setNewPersona] = useState({
    name: '',
    avatar_url: '',
    description: '',
    system_prompt: '',
    model: 'mixtral-8x7b-32768',
    is_public: false
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load user's personas
      const { data: userPersonas } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userPersonas) {
        setPersonas(userPersonas);
      }

      // Load public personas with like counts
      const { data: publicPersonasData } = await supabase
        .from('personas')
        .select(`
          *,
          likes:persona_likes(count)
        `)
        .eq('is_public', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (publicPersonasData) {
        setPublicPersonas(
          publicPersonasData.map(p => ({
            ...p,
            likes: p.likes?.[0]?.count || 0
          }))
        );
      }
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersona = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: newPersona.name,
          avatar_url: newPersona.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
          description: newPersona.description,
          system_prompt: newPersona.system_prompt,
          model: newPersona.model,
          is_public: newPersona.is_public
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPersonas([data, ...personas]);
        setCreating(false);
        setNewPersona({
          name: '',
          avatar_url: '',
          description: '',
          system_prompt: '',
          model: 'mixtral-8x7b-32768',
          is_public: false
        });
      }
    } catch (error) {
      console.error('Error creating persona:', error);
    }
  };

  const handleLikePersona = async (personaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('persona_likes')
        .insert({
          persona_id: personaId,
          user_id: user.id
        });

      setPublicPersonas(
        publicPersonas.map(p => 
          p.id === personaId 
            ? { ...p, likes: p.likes + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Error liking persona:', error);
    }
  };

  const handleDeletePersona = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPersonas(personas.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting persona:', error);
    }
  };

  const handleSelectTemplate = (template: typeof PERSONA_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setNewPersona({
      name: template.name,
      avatar_url: template.avatar_url,
      description: '',
      system_prompt: template.system_prompt,
      model: template.model,
      is_public: false
    });
  };

  const handleGenerateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const colors = ['b91c1c', '047857', '7c3aed', '2563eb', 'c026d3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setNewPersona({
      ...newPersona,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${color}`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="loading-dots flex space-x-2">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => setCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Persona</span>
          </button>
        </div>

        {creating && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Persona</h2>
            
            {!selectedTemplate && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Start with a Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PERSONA_TEMPLATES.map((template, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectTemplate(template)}
                      className="flex flex-col items-center p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={template.avatar_url}
                        alt={template.name}
                        className="w-16 h-16 rounded-xl mb-4"
                      />
                      <h4 className="font-medium mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {template.system_prompt}
                      </p>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={() => setSelectedTemplate({})}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Create Custom Persona</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter persona name"
                />
              </div>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Avatar URL (optional)</label>
                  <input
                    type="text"
                    value={newPersona.avatar_url}
                    onChange={(e) => setNewPersona({ ...newPersona, avatar_url: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Enter avatar URL or leave blank for random avatar"
                  />
                </div>
                <button
                  onClick={handleGenerateAvatar}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newPersona.description}
                  onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
                  className="w-full h-20 bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Write a brief description of your persona that will be visible to other users"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">System Prompt</label>
                <textarea
                  value={newPersona.system_prompt}
                  onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Private instructions for how the AI should behave (not visible to other users)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <select
                    value={newPersona.model}
                    onChange={(e) => setNewPersona({ ...newPersona, model: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Visibility</label>
                  <div className="flex items-center space-x-4 h-[38px]">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPersona.is_public}
                        onChange={(e) => setNewPersona({ ...newPersona, is_public: e.target.checked })}
                        className="rounded border-white/10 bg-black/50"
                      />
                      <span className="text-sm">Share with Community</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePersona}
                  disabled={!newPersona.name || !newPersona.system_prompt}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Create Persona
                </button>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="my-personas" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="my-personas" className="data-[state=active]:bg-white/10">
              <Users className="w-4 h-4 mr-2" />
              My Personas
            </TabsTrigger>
            <TabsTrigger value="public-personas" className="data-[state=active]:bg-white/10">
              <Globe2 className="w-4 h-4 mr-2" />
              Public Personas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-personas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={persona.avatar_url}
                        alt={persona.name}
                        className="w-12 h-12 rounded-xl"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{persona.name}</h3>
                          {persona.is_public ? (
                            <Globe2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {models.find(m => m.id === persona.model)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3 mb-6">
                    {persona.description}
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigate(`/?persona=${persona.id}`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => handleDeletePersona(persona.id)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="public-personas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={persona.avatar_url}
                        alt={persona.name}
                        className="w-12 h-12 rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{persona.name}</h3>
                        <p className="text-sm text-gray-400">
                          {models.find(m => m.id === persona.model)?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLikePersona(persona.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-sm">{persona.likes}</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3 mb-6">
                    {persona.description}
                  </p>
                  <button
                    onClick={() => navigate(`/?persona=${persona.id}`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat with {persona.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
              <Crown className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">Tips for Creating Great Personas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2">Clear Personality</h3>
              <p className="text-sm text-gray-400">
                Give your persona a distinct voice and character. Define their expertise,
                communication style, and unique traits.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Detailed Instructions</h3>
              <p className="text-sm text-gray-400">
                Include specific guidelines about how the persona should interact,
                what knowledge they should demonstrate, and their boundaries.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Consistent Behavior</h3>
              <p className="text-sm text-gray-400">
                Ensure the system prompt creates consistent responses that maintain
                the persona's character throughout conversations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}