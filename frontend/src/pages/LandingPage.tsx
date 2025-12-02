'use client';

import { Button } from '../components/ui/button';
import { Camera, Shield, TrendingUp, CheckCircle, Users, Bell, FileText, ArrowRight, Sparkles, Zap, ChevronLeft, ChevronRight, Flame, Droplet, AlertTriangle, Trash2, BarChart3, Eye, Clock, MapPin } from 'lucide-react';
import { motion, useInView, Variants } from 'motion/react';
import { useState, useRef, useEffect, useMemo } from 'react';

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

// Animated section wrapper
function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0, 
  direction = "up" 
}: { 
  children: React.ReactNode, 
  className?: string, 
  delay?: number, 
  direction?: "up" | "left" | "right" 
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Memoize variants to prevent re-render issues
  const variants: Variants = useMemo(() => ({
    hidden: {
      opacity: 0,
      y: direction === "up" ? 50 : 0,
      x: direction === "left" ? -50 : direction === "right" ? 50 : 0
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }), [direction, delay]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage({ onSignIn, onGetStarted }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselFeatures = [
    {
      icon: Camera,
      title: 'CCTV Integration',
      description: 'Connect your existing cameras for real-time monitoring and instant alerts.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Track trends, violations, and compliance metrics with intuitive charts.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Hygiene Detection',
      description: 'AI-powered detection of PPE violations, spills, pests, and fire hazards.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Bell,
      title: 'Real Time Alerts',
      description: 'Instant notifications via email for critical violations.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: FileText,
      title: 'Compliance Reports',
      description: 'Generate detailed reports for audits and regulatory compliance.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Users,
      title: 'Multi Branch Management',
      description: 'Manage multiple locations from a single centralized dashboard.',
      color: 'from-indigo-500 to-indigo-600',
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselFeatures.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselFeatures.length) % carouselFeatures.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Fixed Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
          backgroundImage: "url('/images/landing_page_background.jpg')",
          }}
        />
        
        {/* Solid Dark Overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/90" />

        {/* Gradient Overlay for Style */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/80 to-slate-900/95" />
        
        {/* Additional subtle pattern overlay */}
        <div className="absolute inset-0 opacity-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br  rounded-xl flex items-center justify-center shadow-xl">
                <img 
                  src="/images/Kitcheneye_logo.png" 
                  alt="KitchenEye Logo" 
                  className="w-14 h-14" 
                />
              </div>

              <span className="text-2xl text-white tracking-tight">
                Kitchen<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Eye</span>
              </span>
            </motion.div>
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" onClick={onSignIn} className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={onGetStarted} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
                >
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20 pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-300 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Sparkles className="w-5 h-5" />
                <span>AI-Powered Technology</span>
              </motion.div>
            </motion.div>

            <motion.h1 
              className="text-6xl lg:text-7xl mb-8 tracking-tight text-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              KitchenEYE – AI-Powered
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Kitchen Hygiene Monitoring
              </span>
            </motion.h1>

            <motion.p 
              className="text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Real-time violation detection with Fire, Smoke, PPE & Hygiene Monitoring.
            </motion.p>

            <motion.div 
              className="flex gap-6 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={onGetStarted} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/50 text-lg px-8 py-6 group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={onSignIn} 
                  className="border-2 border-white/20 text-dark hover:bg-/10 text-lg px-8 py-6 backdrop-blur-sm"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              {[
                { value: '500+', label: 'Kitchens Protected' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '24/7', label: 'Live Monitoring' }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="text-4xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Carousel Section */}
        <section className="py-32 px-6">
          <AnimatedSection className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl mb-6 text-white">
                Complete Monitoring Solution
              </h2>
              <p className="text-xl text-slate-400">
                Everything you need to maintain safety and compliance
              </p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div 
                  className="flex gap-6"
                  animate={{ x: `-${currentSlide * (100 / 3)}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {[...carouselFeatures, ...carouselFeatures].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="min-w-[calc(33.333%-16px)] p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                      whileHover={{ y: -10, scale: 1.02 }}
                    >
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl mb-3 text-white">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Carousel Navigation Arrows */}
              <motion.button
                onClick={prevSlide}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                onClick={nextSlide}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>

              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {carouselFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section A: Why KitchenEye? - Slide from Left */}
        <section className="py-32 px-6">
          <AnimatedSection direction="left" className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="grid grid-cols-3 gap-8">
                {[
                  { icon: Eye, title: 'Real-Time Monitoring', desc: '24/7 AI surveillance' },
                  { icon: Shield, title: 'Compliance Ready', desc: 'Audit-ready reports' },
                  { icon: Zap, title: 'Instant Alerts', desc: 'Immediate notifications' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -10, scale: 1.05 }}
                    className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg mb-2 text-white">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div>
                <h2 className="text-5xl mb-6 text-white">
                  Why KitchenEye?
                </h2>
                <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                  Transform your kitchen safety with AI-powered monitoring that never sleeps. 
                  Detect violations before they become problems.
                </p>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span>Reduce violations by 85% with predictive AI detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span>Save 20+ hours per week on manual inspection tasks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <span>Maintain 100% compliance with automated reporting</span>
                  </li>
                </ul>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section B: Real-Time Alerts - Slide from Right */}
        <section className="py-32 px-6">
          <AnimatedSection direction="right" className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-5xl mb-6 text-white">
                  Real-Time Alerts
                </h2>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Get notified instantly when violations occur. Our AI system sends immediate alerts 
                  to your team so you can respond before issues escalate.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: Bell, title: 'Instant Email Notifications', desc: 'Immediate alerts sent to designated personnel' },
                    { icon: Camera, title: 'Photo Evidence Included', desc: 'Visual proof attached to every alert' },
                    { icon: Clock, title: 'Timestamp & Location', desc: 'Know exactly when and where violations occur' },
                    { icon: MapPin, title: 'Multi-Location Support', desc: 'Monitor all your branches from one dashboard' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 10 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="mb-1 text-white">{item.title}</h4>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20"
                >
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-8 flex flex-col justify-center items-center">
                    <Bell className="w-24 h-24 text-blue-400 mb-6" />
                    <h3 className="text-2xl text-white mb-4">Alert Dashboard</h3>
                    <div className="space-y-3 w-full">
                      {['PPE Violation Detected', 'Spill Alert - Zone A', 'Fire Risk - Kitchen 2'].map((alert, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-sm text-white"
                        >
                          {alert}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section C: Violation Detection Modules - Cards Slide Up */}
        <section className="py-32 px-6">
          <AnimatedSection className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl mb-6 text-white">
                Violation Detection Modules
              </h2>
              <p className="text-xl text-slate-400">
                Comprehensive AI monitoring for all safety risks
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: Flame, 
                  title: 'Fire & Smoke Detection', 
                  desc: 'Detect smoke and fire hazards instantly with thermal AI monitoring',
                  gradient: 'from-orange-500 to-red-600',
                  emoji: '🔥'
                },
                { 
                  icon: Droplet, 
                  title: 'Spill Detection', 
                  desc: 'Identify floor hazards and liquid spills before accidents happen',
                  gradient: 'from-blue-500 to-cyan-600',
                  emoji: '💧'
                },
                { 
                  icon: AlertTriangle, 
                  title: 'PPE Non-Compliance', 
                  desc: 'Monitor for missing gloves, hairnets, masks and other PPE violations',
                  gradient: 'from-yellow-500 to-orange-600',
                  emoji: '🧤'
                },
                { 
                  icon: Trash2, 
                  title: 'Dirty Surfaces', 
                  desc: 'Detect unsanitary conditions and cleanliness violations in real-time',
                  gradient: 'from-purple-500 to-pink-600',
                  emoji: '🧹'
                }
              ].map((module, index) => (
                <AnimatedSection key={index} delay={index * 0.15} direction="up">
                  <motion.div
                    whileHover={{ y: -15, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="h-full p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  >
                    <motion.div 
                      className="text-5xl mb-6"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      {module.emoji}
                    </motion.div>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <module.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl mb-3 text-white">{module.title}</h3>
                    <p className="text-slate-400">{module.desc}</p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <motion.div
              className="relative p-16 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20 overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
              
              <div className="relative">
                <h2 className="text-5xl lg:text-6xl mb-6 text-white">
                  Ready to Transform Your Kitchen Safety?
                </h2>
                
                <p className="text-xl text-slate-300 mb-10">
                  Join hundreds of restaurants and commercial kitchens using KitchenEye
                </p>
                
                <div className="flex gap-6 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      onClick={onGetStarted} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/50 text-lg px-10 py-6 group"
                    >
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-2 border-white/20 text-dark hover:bg-white/10 text-lg px-10 py-6 backdrop-blur-sm"
                    >
                      Schedule Demo
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <AnimatedSection className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xl">
                    <img 
                      src="/images/Kitcheneye_logo.png" 
                      alt="KitchenEye Logo" 
                      className="w-14 h-14" 
                    />
                  </div>

                  <span className="text-xl text-white tracking-tight">
                    Kitchen<span className="text-blue-400">Eye</span>
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  AI-powered hygiene monitoring for modern commercial kitchens. 
                  Keeping your kitchen safe, compliant, and efficient 24/7.
                </p>
              </div>
              
              <div>
                <h4 className="mb-4 text-white">Product</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="mb-4 text-white">Company</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="mb-4 text-white">Legal</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © 2025 KitchenEye. All rights reserved.
              </p>
              <div className="flex gap-6">
                {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </footer>
      </div>
    </div>
  );
}
