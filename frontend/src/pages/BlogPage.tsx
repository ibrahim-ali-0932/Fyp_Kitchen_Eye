import React, { useRef } from "react";
import { Button } from "../components/ui/button";
import { Camera, Shield, Bell, BarChart3, CheckCircle } from "lucide-react";
import { motion, useInView, Variants } from "motion/react";
import { useMemo } from "react";

interface BlogPageProps {
  onBack: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  onBlog: () => void;
}

// Animated section wrapper (same as LandingPage)
function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants: Variants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: direction === "up" ? 50 : 0,
        x: direction === "left" ? -50 : direction === "right" ? 50 : 0,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: 0.8,
          delay: delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    }),
    [direction, delay]
  );

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

export default function BlogPage({
  onBack,
  onSignIn,
  onGetStarted,
  onBlog,
}: BlogPageProps) {
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const scrollToHero = () =>
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToFooter = () =>
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="relative min-h-screen">
      {/* Fixed Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url('/images/bg-2.jpg')",
            filter: "brightness(0.8) contrast(1.2)",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-slate-900/40" />
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
              <div className="w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-xl">
                <img
                  src="/images/Kitcheneye_logo.png"
                  alt="KitchenEye Logo"
                  className="w-14 h-14"
                />
              </div>
              <span className="text-2xl text-white tracking-tight">
                Kitchen
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Eye
                </span>
              </span>
            </motion.div>
            <div className="flex items-center gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    onBack();
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Home
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={scrollToFooter}
                  className="text-white hover:bg-white/10"
                >
                  Contact us
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={onSignIn}
                  className="text-white hover:bg-white/10"
                >
                  Our Team
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    onBlog();
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Blog
                </Button>
              </motion.div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  onClick={onSignIn}
                  className="text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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

        {/* Blog Content */}
        <article className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Revolutionizing Kitchen Safety with
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                AI-Powered Monitoring
              </span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed">
              Discover how KitchenEye is transforming commercial kitchen
              operations through intelligent automation, real-time violation
              detection, and comprehensive compliance management.
            </p>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img
              src="/images/landing_page_background.jpg"
              alt="KitchenEye AI Monitoring System"
              className="w-full h-[500px] object-cover"
            />
          </motion.div>

          {/* Main Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-12"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-white mb-6">
                  What is KitchenEye?
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  KitchenEye is an advanced AI-powered monitoring system
                  designed specifically for commercial kitchens. Our platform
                  leverages cutting-edge computer vision and machine learning
                  technologies to ensure food safety, hygiene compliance, and
                  operational excellence in real-time.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Whether you're managing a single restaurant or a chain of
                  establishments, KitchenEye provides comprehensive monitoring
                  solutions that help prevent violations before they occur,
                  maintain regulatory compliance, and protect your brand
                  reputation.
                </p>
              </div>
            </motion.section>

            {/* Core Features Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                Core Features & Capabilities
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Feature 1 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    CCTV Integration
                  </h3>
                  <p className="text-slate-300">
                    Seamlessly connect your existing security cameras to our AI
                    platform. No need for expensive hardware upgrades—KitchenEye
                    works with your current infrastructure.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    AI-Powered Detection
                  </h3>
                  <p className="text-slate-300">
                    Our advanced machine learning models can detect PPE
                    violations, spills, fire hazards, and unsanitary conditions
                    with remarkable accuracy, 24/7.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Real-Time Alerts
                  </h3>
                  <p className="text-slate-300">
                    Get instant email notifications when violations are
                    detected, complete with photo evidence, timestamps, and
                    location data for immediate response.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Analytics Dashboard
                  </h3>
                  <p className="text-slate-300">
                    Track trends, identify patterns, and generate comprehensive
                    reports for audits and compliance documentation.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* How It Works */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-12"
            >
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h2 className="text-3xl font-bold text-white mb-8">
                  How KitchenEye Works
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Camera Integration
                      </h3>
                      <p className="text-slate-300">
                        Connect your existing CCTV cameras to the KitchenEye
                        platform. Our system supports most modern IP cameras and
                        can be set up in minutes.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        AI Analysis
                      </h3>
                      <p className="text-slate-300">
                        Our advanced AI models continuously analyze video feeds
                        in real-time, detecting violations and potential hazards
                        with industry-leading accuracy.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Instant Notifications
                      </h3>
                      <p className="text-slate-300">
                        When a violation is detected, designated personnel
                        receive immediate email alerts with detailed
                        information, photos, and recommended actions.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Compliance Reporting
                      </h3>
                      <p className="text-slate-300">
                        Generate comprehensive reports for audits, track
                        compliance metrics over time, and maintain detailed
                        violation history for regulatory requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Benefits Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                Key Benefits for Your Business
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Reduce Violations by 85%",
                    description:
                      "Proactive AI detection helps prevent violations before they occur, significantly reducing compliance issues and potential fines.",
                  },
                  {
                    title: "Save 20+ Hours Per Week",
                    description:
                      "Automate manual inspection tasks and free up your staff to focus on food quality and customer service.",
                  },
                  {
                    title: "Maintain 100% Compliance",
                    description:
                      "Automated reporting ensures you always have audit-ready documentation and maintain regulatory compliance effortlessly.",
                  },
                  {
                    title: "Protect Brand Reputation",
                    description:
                      "Prevent food safety incidents that could damage your reputation and customer trust.",
                  },
                  {
                    title: "Multi-Location Management",
                    description:
                      "Monitor all your kitchen locations from a single centralized dashboard, perfect for restaurant chains.",
                  },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="flex gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-slate-300">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Use Cases */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-8">
                Who Can Benefit from KitchenEye?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Restaurants",
                    description:
                      "Fine dining, casual dining, and fast-casual restaurants can all benefit from automated kitchen monitoring.",
                  },
                  {
                    title: "Hotel Kitchens",
                    description:
                      "Maintain high standards across multiple food service outlets with centralized monitoring.",
                  },
                  {
                    title: "Catering Services",
                    description:
                      "Ensure compliance and safety standards for off-site catering operations.",
                  },
                  {
                    title: "Food Manufacturing",
                    description:
                      "Monitor production lines and processing areas for hygiene and safety compliance.",
                  },
                  {
                    title: "Healthcare Facilities",
                    description:
                      "Critical for maintaining food safety standards in hospital and care facility kitchens.",
                  },
                  {
                    title: "Educational Institutions",
                    description:
                      "School and university cafeterias can maintain safety standards with automated monitoring.",
                  },
                ].map((useCase, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-300">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Technology Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Advanced Technology Stack
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  KitchenEye leverages state-of-the-art technologies to deliver
                  reliable, accurate, and scalable monitoring solutions:
                </p>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Computer Vision:</strong>{" "}
                      Advanced image recognition algorithms trained on millions
                      of kitchen scenarios
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Machine Learning:</strong>{" "}
                      Deep learning models that continuously improve detection
                      accuracy
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">
                        Cloud Infrastructure:
                      </strong>{" "}
                      Scalable, secure, and reliable cloud-based processing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">
                        Real-Time Processing:
                      </strong>{" "}
                      Sub-second detection and alert generation
                    </span>
                  </li>
                </ul>
              </div>
            </motion.section>
          </div>
        </article>

        {/* Footer */}
        <footer
          ref={footerRef}
          className="border-t border-white/10 bg-slate-900/50 backdrop-blur-xl"
        >
          <AnimatedSection className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
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
                <h4 className="mb-4 text-white">Contact Us</h4>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="hover:text-white transition-colors cursor-pointer">
                    KitchenEye@gmail.com
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    +923325095951
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    Muslim Town, faislabad, Pakistan
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    Currently working in Faislabad, Pakistan
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-white">About KitchenEye</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  KitchenEye revolutionizes kitchen safety through cutting-edge
                  AI technology, providing real-time monitoring, automated
                  violation detection, and comprehensive reporting for
                  commercial kitchens worldwide. We help restaurants and food
                  service establishments maintain the highest standards of
                  hygiene while reducing manual inspection time and ensuring
                  regulatory compliance.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                © 2025 KitchenEye. All rights reserved.
              </p>
              <div className="flex gap-6">
                {["Twitter", "LinkedIn", "Facebook", "Instagram"].map(
                  (social) => (
                    <a
                      key={social}
                      href="#"
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {social}
                    </a>
                  )
                )}
              </div>
            </div>
          </AnimatedSection>
        </footer>
      </div>
    </div>
  );
}
