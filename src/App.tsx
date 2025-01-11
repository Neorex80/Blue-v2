import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, Menu, ChevronRight, Sparkles, Cpu, Brain, Gauge, StopCircle, Settings, Copy, Check, ImagePlus, Users, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { streamWithGroq } from './lib/groq';
import { MarkdownRenderer } from './components/markdown-renderer';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { models } from './lib/models';
import { Database } from './lib/database.types';

type Persona = Database['public']['Tables']['personas']['Row'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  persona_id?: string | null;
  timestamp: Date;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedModel, setSelectedModel] = useState('mixtral-8x7b-32768');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard shortcuts
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    inputRef.current?.focus();
  });

  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    setIsSidebarOpen(prev => !prev);
  });

  useHotkeys('esc', () => {
    if (isLoading) {
      handleStopGeneration();
    }
  });

  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    createNewChat();
  });

  useHotkeys('mod+enter', (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSubmit(e);
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load chats and check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        await loadChats();
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  // Load persona if specified in URL
  useEffect(() => {
    const personaId = searchParams.get('persona');
    if (personaId) {
      loadPersona(personaId);
    }
  }, [searchParams]);

  const loadPersona = async (personaId: string) => {
    try {
      const { data: persona, error } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();

      if (error) throw error;

      if (persona) {
        setCurrentPersona(persona);
        setSelectedModel(persona.model);
      }
    } catch (error) {
      console.error('Error loading persona:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      
      // Check if we have a valid session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (chatsData) {
        const loadedChats = await Promise.all(chatsData.map(async (chat) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

          return {
            id: chat.id,
            title: chat.title,
            model: chat.model,
            persona_id: chat.persona_id,
            timestamp: new Date(chat.created_at),
            messages: messages?.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
              model: chat.model
            })) || []
          };
        }));

        setChats(loadedChats);
        setLoadingChats(false);
        
        // If persona is selected, filter chats for that persona
        const personaId = searchParams.get('persona');
        if (personaId) {
          const personaChats = loadedChats.filter(chat => chat.persona_id === personaId);
          if (personaChats.length > 0) {
            setCurrentChat(personaChats[0].id);
            setMessages(personaChats[0].messages);
          } else {
            createNewChat();
          }
        } else if (loadedChats.length > 0 && !currentChat) {
          setCurrentChat(loadedChats[0].id);
          setMessages(loadedChats[0].messages);
          setSelectedModel(loadedChats[0].model);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
        console.error('Supabase connection error:', error);
        // Let the user know they need to connect to Supabase
        navigate('/auth');
      } else {
        console.error('Error loading chats:', error);
      }
    } finally {
      setLoadingChats(false);
    }
  };

  const createNewChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const personaId = searchParams.get('persona');

      const { data: chat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: currentPersona ? `Chat with ${currentPersona.name}` : 'New Chat',
          model: selectedModel,
          persona_id: personaId || null
        })
        .select()
        .single();

      if (error) throw error;

      if (chat) {
        setChats(prev => [{
          id: chat.id,
          title: chat.title,
          model: chat.model,
          persona_id: chat.persona_id,
          timestamp: new Date(chat.created_at),
          messages: []
        }, ...prev]);
        setCurrentChat(chat.id);
        setMessages([]);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChat === chatId) {
        const nextChat = chats.find(c => c.id !== chatId);
        if (nextChat) {
          setCurrentChat(nextChat.id);
          setMessages(nextChat.messages);
        } else {
          setCurrentChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    const userMessage = input;
    const newUserMessage = { 
      role: 'user' as const, 
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setStreamingContent('');

    try {
      let fullResponse = '';
      for await (const chunk of streamWithGroq(
        userMessage, 
        selectedModel, 
        abortControllerRef.current.signal,
        messages,
        currentPersona?.system_prompt
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      const newAssistantMessage = { 
        role: 'assistant' as const, 
        content: fullResponse,
        timestamp: new Date(),
        model: selectedModel
      };

      setMessages(prev => [...prev, newAssistantMessage]);

      if (currentChat) {
        await supabase.from('messages').insert([
          {
            chat_id: currentChat,
            role: newUserMessage.role,
            content: newUserMessage.content
          },
          {
            chat_id: currentChat,
            role: newAssistantMessage.role,
            content: newAssistantMessage.content
          }
        ]);

        // Update chat title if it's the first message
        const chat = chats.find(c => c.id === currentChat);
        if (chat && chat.messages.length === 0) {
          const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
          await supabase
            .from('chats')
            .update({ title })
            .eq('id', currentChat);
          
          setChats(prev => prev.map(c => 
            c.id === currentChat ? { ...c, title } : c
          ));
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm z-40",
          "opacity-0 pointer-events-none transition-opacity duration-300",
          isSidebarOpen && "opacity-100 pointer-events-auto"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative w-72 bg-[#0F0F0F] border-r border-white/10 h-full z-50",
        "transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {currentPersona ? (
              <div>
                <h2 className="font-semibold">{currentPersona.name}</h2>
                <p className="text-sm text-gray-400">
                  {models.find(m => m.id === currentPersona.model)?.name}
                </p>
              </div>
            ) : (
              <span className="font-semibold text-lg">Blue Assistant</span>
            )}
          </div>
          
          <button 
            onClick={createNewChat}
            className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
            <kbd className="ml-auto text-xs text-gray-500">⌘N</kbd>
          </button>

          <div className="mt-6 flex-1 overflow-y-auto space-y-2">
            {loadingChats ? (
              <div className="flex items-center justify-center py-4">
                <div className="loading-dots flex space-x-2">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            ) : chats
              .filter(chat => currentPersona ? chat.persona_id === currentPersona.id : !chat.persona_id)
              .map((chat) => (
                <div
                  key={chat.id}
                  className={cn("group relative",
                    currentChat === chat.id 
                      ? "bg-white/10 rounded-lg" 
                      : ""
                  )}
                >
                  <button
                    onClick={() => {
                      setCurrentChat(chat.id);
                      setMessages(chat.messages);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Bot className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(chat.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => navigate('/personas')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <Users className="w-4 h-4" />
              <span>Personas</span>
            </button>
            <button
              onClick={() => navigate('/images')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Image Generation</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {currentPersona && (
            <div className="flex items-center space-x-3">
              <img
                src={currentPersona.avatar_url}
                alt={currentPersona.name}
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-medium">{currentPersona.name}</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !currentPersona ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="w-12 h-12 text-blue-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {currentPersona ? `Chat with ${currentPersona.name}` : 'Welcome to Blue'}
              </h1>
              <p className="text-gray-400 mb-8 max-w-md">
                I'm here to help you with any questions or tasks you have. Feel free to start a conversation!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                {[
                  { icon: <Sparkles className="w-4 h-4" />, text: "What can you help me with?" },
                  { icon: <Brain className="w-4 h-4" />, text: "Tell me about yourself" },
                  { icon: <Gauge className="w-4 h-4" />, text: "Show me an example" },
                  { icon: <Cpu className="w-4 h-4" />, text: "What are your capabilities?" }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(item.text);
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-300">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full max-w-3xl mx-auto",
                  message.role === 'assistant' ? "justify-start" : "justify-end"
                )}
              >
                <div className={cn(
                  "flex items-start space-x-4 rounded-2xl p-4 group",
                  message.role === 'assistant' 
                    ? "bg-white/5" 
                    : "bg-blue-600/10"
                )}>
                  {message.role === 'assistant' && currentPersona ? (
                    <img
                      src={currentPersona.avatar_url}
                      alt={currentPersona.name}
                      className="w-8 h-8 rounded-lg"
                    />
                  ) : message.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0 relative">
                    <button
                      onClick={() => handleCopyMessage(message.content, `${index}`)}
                      className={cn(
                        "absolute right-0 top-0 p-1.5 rounded-lg transition-all duration-200",
                        copiedMessageId === `${index}`
                          ? "bg-green-600/10 text-green-400"
                          : "bg-white/5 text-gray-400 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {copiedMessageId === `${index}` ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <MarkdownRenderer content={message.content} />
                    {message.model && (
                      <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                        <span>{models.find(m => m.id === message.model)?.name}</span>
                        <span>•</span>
                        <span>{format(message.timestamp, 'h:mm a')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && streamingContent && (
            <div className="flex w-full max-w-3xl mx-auto">
              <div className="flex items-start space-x-4 rounded-2xl p-4 bg-white/5">
                {currentPersona ? (
                  <img
                    src={currentPersona.avatar_url}
                    alt={currentPersona.name}
                    className="w-8 h-8 rounded-lg"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <MarkdownRenderer content={streamingContent} isStreaming={true} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  ref={inputRef}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${currentPersona ? currentPersona.name : 'Blue'}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white placeholder-gray-500"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-xs text-gray-500">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded">⌘K</kbd>
                  <span>to focus</span>
                </div>
              </div>
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="p-3 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    "p-3 rounded-xl transition-colors",
                    input.trim()
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  )}
                  title="Send message (⌘↵)"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}