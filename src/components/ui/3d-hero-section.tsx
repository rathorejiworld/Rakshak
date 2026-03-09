"use client";

import React, { useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';
import { Shield, Heart, Scale, ArrowRight, CheckCircle2, Lock, Users, Sparkles } from 'lucide-react';
import { FixedCubeBackground } from '@/components/ui/void-hero';

function HeroSplineBackground() {
  const orbVariants = {
    float: (delay: number) => ({
      scale: [1, 1.08, 1],
      opacity: [0.35, 0.6, 0.35],
      y: [0, -18, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      },
    }),
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', pointerEvents: 'auto', overflow: 'hidden' }}>
      <Spline
        style={{ width: '100%', height: '100vh', pointerEvents: 'auto' }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: `
            radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 25%, transparent 75%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.9))
          `,
          pointerEvents: 'none',
        }}
      />
      {/* Animated gradient orbs - smooth float */}
      <motion.div
        custom={0}
        variants={orbVariants}
        animate="float"
        className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        custom={0.6}
        variants={orbVariants}
        animate="float"
        className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        custom={1.2}
        variants={orbVariants}
        animate="float"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
      />
    </div>
  );
}

interface HeroContentProps {
  ctaButtons: {
    primary: { text: string; onClick: () => void };
    secondary: { text: string; onClick: () => void };
  };
  trustIndicators: Array<{
    icon: React.ReactNode;
    text: string;
    color: string;
  }>;
}

function HeroContent({ ctaButtons, trustIndicators }: HeroContentProps) {
  return (
    <div className="text-white px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center pt-24 pb-16 gap-10">
      <div className="w-full lg:w-1/2 pr-0 lg:pr-8 space-y-6 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 mx-auto lg:mx-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm px-5 py-2.5 rounded-full border border-blue-400/30 animate-fadeInDown hover:scale-105 transition-transform duration-300 cursor-default group">
          <Shield className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
          <span className="text-sm text-blue-300 font-semibold">Your Shield of Support</span>
          <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
        </div>
        
        <h1 className="font-bold leading-tight tracking-tight animate-fadeInUp">
          <span className="block text-[clamp(2.5rem,5vw,4.5rem)] sm:text-[clamp(3rem,6vw,5.5rem)] md:text-[clamp(3.5rem,7vw,6.5rem)] lg:text-[clamp(4rem,7.5vw,7rem)] bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
            Rakshak
          </span>
          <span className="block mt-2 text-[clamp(1.8rem,4vw,3.2rem)] sm:text-[clamp(2rem,4.5vw,3.6rem)] md:text-[clamp(2.2rem,5vw,4rem)] lg:text-[clamp(2.4rem,5.5vw,4.5rem)] drop-shadow-2xl">
            Support When You Need It Most
          </span>
        </h1>
        
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-4 text-sm text-gray-300 opacity-90 animate-fadeInUp delay-100">
          <span className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/30 hover:bg-blue-500/20 transition-all duration-300">
            <Scale className="w-4 h-4 text-blue-400" />
            Legal Guidance
          </span>
          <span className="flex items-center gap-1.5 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/30 hover:bg-pink-500/20 transition-all duration-300">
            <Heart className="w-4 h-4 text-pink-400" />
            Emotional Support
          </span>
          <span className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/30 hover:bg-green-500/20 transition-all duration-300">
            <Shield className="w-4 h-4 text-green-400" />
            Secure & Private
          </span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col items-center lg:items-start animate-fadeInUp delay-200 space-y-8">
        <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-xl leading-relaxed text-gray-200 text-center lg:text-left">
          AI-powered legal and emotional support platform providing safe, confidential assistance 24/7.
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-2">
          {trustIndicators.map((indicator, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="group-hover:scale-110 transition-transform">
                {indicator.icon}
              </div>
              <span className="text-sm font-semibold">{indicator.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full sm:w-auto pointer-events-auto">
          <button 
            onClick={ctaButtons.primary.onClick}
            className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold py-4 px-10 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center w-full sm:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            <span className="relative z-10 flex items-center">
              {ctaButtons.primary.text}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
          
          <button 
            onClick={ctaButtons.secondary.onClick}
            className="group relative border-2 border-white/80 text-white font-bold py-4 px-10 rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:border-transparent hover:scale-105 flex items-center justify-center w-full sm:w-auto backdrop-blur-md bg-white/5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Shield className="w-5 h-5 mr-2 relative z-10 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">{ctaButtons.secondary.text}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  ctaButtons?: {
    primary: { text: string; onClick: () => void };
    secondary: { text: string; onClick: () => void };
  };
}

const HeroSection = ({ ctaButtons }: HeroSectionProps) => {
  const heroContentRef = useRef<HTMLDivElement>(null);

  const defaultButtons = {
    primary: { text: 'Get Started Free', onClick: () => {} },
    secondary: { text: 'Emergency Help', onClick: () => {} }
  };

  const buttons = ctaButtons || defaultButtons;

  const trustIndicators = [
    { icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, text: '100% Confidential', color: 'green' },
    { icon: <Lock className="w-4 h-4 text-blue-400" />, text: 'Secure & Encrypted', color: 'blue' },
    { icon: <Users className="w-4 h-4 text-purple-400" />, text: 'Professional Support', color: 'purple' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;
          const maxScroll = 500;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          const translateY = scrollPosition * 0.5;
          
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = opacity.toString();
            heroContentRef.current.style.transform = `translateY(${translateY}px)`;
          }
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Single fixed cube background for the whole page */}
      <FixedCubeBackground />

      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground />
        </div>

        <div 
          ref={heroContentRef} 
          style={{
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100vh',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 10, 
            pointerEvents: 'none'
          }}
        >
          <HeroContent ctaButtons={buttons} trustIndicators={trustIndicators} />
        </div>
      </div>

      {/* Smooth transition section */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" style={{ marginTop: '-20vh' }}>
        <div className="h-40" />
      </div>
    </div>
  );
};

export { HeroSection };
