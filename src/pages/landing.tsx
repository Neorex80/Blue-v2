import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Brain, MessageSquare, Users, ArrowRight, Lock, Globe, Github, Linkedin, Zap, Shield, Workflow, Cpu, Code, Palette, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, useScroll, useTransform } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden pattern-grid">
      {/* Background Patterns */}
      <div className="fixed inset-0 pattern-dots opacity-50" />
      
      {/* Hero Section */}
      <div className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent"
          style={{ opacity, scale, y }}
        />
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
              animate={{
                x: ['0vw', '100vw'],
                y: [Math.random() * 100 + 'vh', Math.random() * 100 + 'vh']
              }}
              transition={{
                duration: Math.random() * 10 + 20,
                repeat: Infinity,
                ease: 'linear',
                delay: -Math.random() * 20
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-40 h-40 mx-auto lg:mx-0 mb-8 transform-gpu"
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <motion.div
                  animate={{
                    rotateY: [0, 360]
                  }}
                  transition={{
                    duration: 20,
                    ease: "linear",
                    repeat: Infinity
                  }}
                  className="absolute inset-0 group"
                >
                  {/* Core Logo */}
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 animate-pulse shadow-2xl" />
                  <div className="absolute inset-[3px] rounded-[2rem] bg-black flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Animated Circuit Lines */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-pulse" />
                        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                      </div>
                      <Bot className="w-20 h-20 text-blue-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  {/* Decorative Orbs */}
                  <div className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="absolute -left-2 top-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <Brain className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 right-1/4 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg">
                    <Cpu className="w-4 h-4 text-white animate-pulse" />
                  </div>
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-6xl sm:text-7xl font-bold mb-6 tracking-tight"
              >
                Meet <span className="relative">
                  <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                    Blue
                  </span>
                  <span className="absolute -inset-1 bg-blue-500/20 blur-xl rounded-full"></span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-12"
              >
                Your AI companion for meaningful conversations. Experience natural, intelligent chat powered by advanced language models.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={() => navigate('/auth')}
                  className="group relative inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-lg font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 w-3 bg-gradient-to-r from-white/0 via-white/20 to-white/0 skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out_infinite]" />
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>

            {/* Chat Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 shadow-2xl">
                <div className="absolute top-2 left-4 flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-blue-600/10 text-blue-400 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                      Hey Blue! Can you help me understand quantum computing?
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]"
                    >
                      I'd be happy to explain quantum computing! At its core, quantum computing leverages quantum mechanics principles like superposition and entanglement to perform computations...
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="inline-flex items-center h-4 space-x-1 ml-2"
                      >
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent opacity-30" />
          <div className="absolute inset-0 pattern-dots opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Experience the Future of AI
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover a new level of AI interaction with features that adapt to your needs
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Feature: Advanced Chat */}
            <motion.div variants={item} className="relative">
              <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 h-full">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Advanced AI Chat</h3>
                    <p className="text-gray-400">Powered by state-of-the-art language models</p>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-blue-600/10 text-blue-400 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                      Can you explain quantum computing?
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
                      I'd be happy to explain! Quantum computing uses quantum mechanics...
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl -z-10" />
            </motion.div>
            {/* Feature: Image Generation */}
            <motion.div variants={item} className="relative">
              <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 h-full">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Image Generation</h3>
                    <p className="text-gray-400">Create stunning visuals with AI</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse" />
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse delay-100" />
                </div>
                <div className="mt-4">
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <p className="text-sm text-gray-400">
                        "A magical forest with glowing mushrooms..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl -z-10" />
            </motion.div>

            {/* Feature: Custom Personas */}
            <motion.div variants={item} className="relative">
              <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 h-full">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Custom Personas</h3>
                    <p className="text-gray-400">Create and share AI personalities</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-xl p-4 flex items-center space-x-3">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=professor&backgroundColor=b91c1c"
                      alt="Professor"
                      className="w-10 h-10 rounded-lg"
                    />
                    <div>
                      <p className="font-medium">Professor</p>
                      <p className="text-xs text-gray-400">Science Expert</p>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 flex items-center space-x-3">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=chef&backgroundColor=047857"
                      alt="Chef"
                      className="w-10 h-10 rounded-lg"
                    />
                    <div>
                      <p className="font-medium">Chef</p>
                      <p className="text-xs text-gray-400">Culinary Guide</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl -z-10" />
            </motion.div>

            {/* Feature: Enterprise Security */}
            <motion.div variants={item} className="relative">
              <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 h-full">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Enterprise Security</h3>
                    <p className="text-gray-400">Your data, protected</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-xl p-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm text-gray-400">End-to-end encryption</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm text-gray-400">Enterprise-grade security</p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* User Journey Section */}
      <div className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get started with Blue in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            
            {[
              {
                step: 1,
                title: "Create Your Account",
                description: "Sign up in seconds and get instant access to Blue's powerful AI capabilities",
                icon: Users
              },
              {
                step: 2,
                title: "Choose Your AI Model",
                description: "Select from our range of advanced language models tailored to your needs",
                icon: Brain
              },
              {
                step: 3,
                title: "Start Chatting",
                description: "Engage in meaningful conversations and unlock AI's full potential",
                icon: MessageSquare
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.2 }}
                className="relative z-10"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-gray-400">© {new Date().getFullYear()} Blue. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/Neorex80"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-6 h-6" />
              </a>
              <a
                href="https://www.linkedin.com/in/devrex/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}