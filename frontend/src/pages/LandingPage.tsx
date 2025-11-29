import { Button } from "../components/ui/button";
import {
  Camera,
  Shield,
  TrendingUp,
  CheckCircle,
  Users,
  Bell,
  FileText,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { useState } from "react";

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export default function LandingPage({
  onSignIn,
  onGetStarted,
}: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KitchenEye
            </span>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" onClick={onSignIn}>
                Sign In
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 text-blue-700 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI-Powered Monitoring</span>
            </motion.div>

            <motion.h1
              className="text-5xl lg:text-6xl mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                KitchenEye – Smart AI Monitoring
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                for Hygiene & Safety
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-slate-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Real-time AI detection for spills, PPE violations, pests, and fire
              hazards. Keep your kitchen safe and compliant 24/7.
            </motion.p>

            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30 group"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onSignIn}
                  className="border-2 hover:border-blue-600 hover:text-blue-600"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {[
                { value: "500+", label: "Kitchens" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Monitoring" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoYm9hcmQlMjBhbmFseXRpY3MlMjBzY3JlZW58ZW58MXx8fHwxNzYzNzk2MzQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Dashboard analytics"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Floating Cards */}
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm">No Violations</div>
                  <div className="text-xs text-slate-600">Last 24 hours</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm">Real-time</div>
                  <div className="text-xs text-slate-600">AI Detection</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-4xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Complete Hygiene Monitoring Solution
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Everything you need to maintain safety and compliance
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Camera,
              title: "CCTV Integration",
              description:
                "Connect your existing cameras for real-time monitoring and instant alerts.",
              color: "from-blue-500 to-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: TrendingUp,
              title: "Dashboard Analytics",
              description:
                "Track trends, violations, and compliance metrics with intuitive charts.",
              color: "from-green-500 to-green-600",
              bg: "bg-green-50",
            },
            {
              icon: Shield,
              title: "Hygiene Detection",
              description:
                "AI-powered detection of PPE violations, spills, pests, and fire hazards.",
              color: "from-purple-500 to-purple-600",
              bg: "bg-purple-50",
            },
            {
              icon: Bell,
              title: "Real-Time Alerts",
              description:
                "Instant notifications via email for critical violations.",
              color: "from-orange-500 to-orange-600",
              bg: "bg-orange-50",
            },
            {
              icon: FileText,
              title: "Compliance Reports",
              description:
                "Generate detailed reports for audits and regulatory compliance.",
              color: "from-red-500 to-red-600",
              bg: "bg-red-50",
            },
            {
              icon: Users,
              title: "Multi-Branch Management",
              description:
                "Manage multiple locations from a single centralized dashboard.",
              color: "from-indigo-500 to-indigo-600",
              bg: "bg-indigo-50",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="p-6 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />
              <motion.div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                animate={
                  hoveredFeature === index ? { rotate: [0, -10, 10, 0] } : {}
                }
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-xl mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Detection Types */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <motion.div
          className="bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 rounded-3xl p-12 shadow-xl border relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />

          <motion.div
            className="text-center mb-16 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              What We Detect
            </h2>
            <p className="text-xl text-slate-600">
              Comprehensive AI monitoring for all safety risks
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              {
                icon: "🧤",
                title: "PPE Violations",
                desc: "Missing gloves, hairnets, masks",
                gradient: "from-orange-500 to-red-500",
              },
              {
                icon: "💧",
                title: "Spills",
                desc: "Floor hazards and liquid spills",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: "🐀",
                title: "Pest Detection",
                desc: "Rodents and insects",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: "🔥",
                title: "Fire Hazards",
                desc: "Smoke and fire detection",
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, rotate: [0, -2, 2, 0] }}
                className="p-8 rounded-2xl bg-white border-2 border-white shadow-xl text-center relative overflow-hidden group cursor-pointer"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {item.icon}
                </motion.div>
                <h4 className="mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 border-2 shadow-2xl">
            <motion.h2
              className="text-4xl lg:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Ready to Transform Your Hygiene Monitoring?
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-slate-600 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join hundreds of restaurants and commercial kitchens using
              KitchenEye
            </motion.p>

            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:border-blue-600 hover:text-blue-600"
                >
                  Schedule Demo
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-br from-slate-900 to-blue-900 text-white mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            className="grid md:grid-cols-4 gap-8 mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="tracking-tight">KitchenEye</span>
              </div>
              <p className="text-sm text-slate-300">
                AI-powered hygiene monitoring for modern kitchens
              </p>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
          <div className="pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
            © 2024 KitchenEye. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
