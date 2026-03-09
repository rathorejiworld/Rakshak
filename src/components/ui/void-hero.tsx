"use client";

import React from 'react';
import { Canvas, useFrame } from "@react-three/fiber";
import { Geometry, Base, Subtraction } from '@react-three/csg'
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Bloom, N8AO, SMAA, EffectComposer } from '@react-three/postprocessing'
import { useRef } from "react";
import { Mesh } from "three";
import { KernelSize } from "postprocessing";
import { ShatterButton } from './shatter-button'

function Shape() {
  const meshRef = useRef<Mesh>(null);
  const innerSphereRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.z += delta * 0.2;
    }
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.x += delta * 0.3;
      innerSphereRef.current.rotation.y += delta * 0.5;
      innerSphereRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <meshPhysicalMaterial 
          roughness={0.05}
          metalness={1}
          clearcoat={1}
          clearcoatRoughness={0.03}
          color="#60a5fa"
          emissive="#3b82f6"
          emissiveIntensity={0.4}
        />

        <Geometry>
          <Base>
            <primitive
              object={new RoundedBoxGeometry(2, 2, 2, 7, 0.2)}
            />
          </Base>

          <Subtraction>
            <sphereGeometry args={[1.25, 64, 64]} />
          </Subtraction>
        </Geometry>
      </mesh>
      
      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial 
          color="#93c5fd"
          emissive="#93c5fd"
          emissiveIntensity={3.5}
        />
      </mesh>
    </>
  );
}

function Environment() {
  return (
    <>
      <directionalLight position={[-5, 5, -5]} intensity={0.2} color="#e6f3ff" />
      <directionalLight position={[0, -5, 10]} intensity={0.4} color="#fff5e6" />
      <ambientLight intensity={0.8} color="#404040" />
      <pointLight position={[8, 3, 8]} intensity={0.2} color="#ffeecc" distance={20} />
      <pointLight position={[-8, 3, -8]} intensity={0.2} color="#ccf0ff" distance={20} />
      <directionalLight position={[0, -10, 0]} intensity={0.2} color="#f0f0f0" />
    </>
  );
}

function Scene() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [5, 5, 5], fov: 50 }}
      dpr={[1, 1.5]}                 // cap DPR for mobile perf
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Environment />
      <Shape />
      <EffectComposer multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2} intensity={1} aoSamples={6} denoiseSamples={4} />
        <Bloom
          kernelSize={3}
          luminanceThreshold={0}
          luminanceSmoothing={0.35}
          intensity={0.9}            // stronger bloom
        />
        <Bloom
          kernelSize={KernelSize.HUGE}
          luminanceThreshold={0}
          luminanceSmoothing={0}
          intensity={0.8}            // stronger large-kernel bloom
        />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}

interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
  primaryButton: { text: string; onClick: () => void };
  secondaryButton: { text: string; onClick: () => void };
  trustIndicators: Array<{ icon: React.ReactNode; text: string }>;
}

export const Hero: React.FC<HeroProps> = ({ 
  title, 
  subtitle,
  description, 
  primaryButton,
  secondaryButton,
  trustIndicators
}) => {
  // Check if this is background-only render (empty title)
  const isBackgroundOnly = !title && !subtitle && !description

  if (isBackgroundOnly) {
    // Render only the 3D scene without any content
    return (
      <div className="h-screen w-screen relative bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-100">
          <Scene />
        </div>
      </div>
    )
  }

  // Full hero with content
  return (
    <div className="h-screen w-screen relative bg-black overflow-hidden">
      {/* 3D Scene Background - Blue Proton Cube */}
      <div className="absolute inset-0 opacity-90">
        <Scene />
      </div>

      {/* Gradient Overlay - Darker */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-blue-400/20 mb-8 animate-fadeInDown hover:bg-blue-500/15 transition-all duration-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-300 font-medium tracking-wide">{subtitle}</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[0.9] tracking-tight animate-fadeInUp">
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 mb-10 leading-relaxed font-light max-w-3xl animate-fadeInUp delay-100">
              {description}
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-4 mb-10 animate-fadeInUp delay-200">
              {trustIndicators.map((indicator, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {indicator.icon}
                  <span className="text-sm font-semibold text-white">{indicator.text}</span>
                </div>
              ))}
            </div>

            {/* Buttons with Shatter Effect */}
            <div className="flex flex-col sm:flex-row gap-5 animate-fadeInUp delay-300">
              <ShatterButton
                onClick={primaryButton.onClick}
                shatterColor="#ffffff"
                className="!bg-white !text-black !border-none font-bold py-5 px-12 text-lg"
              >
                {primaryButton.text}
              </ShatterButton>

              <ShatterButton
                onClick={secondaryButton.onClick}
                shatterColor="#ff4444"
                className="!bg-transparent !text-white !border-2 !border-white font-bold py-5 px-12 text-lg backdrop-blur-md"
              >
                <span className="mr-3 text-2xl">🚨</span>
                {secondaryButton.text}
              </ShatterButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// New VoidHeroBackground component
export const VoidHeroBackground = ({ className = "" }: { className?: string }) => (
  <div className={`w-full h-full ${className}`}>
    <Scene />
  </div>
);

/**
 * Fixed, single-instance cube background to sit behind the whole page.
 * Keep content clickable with pointer-events-none. Use z-0 (not negative)
 * so it renders behind sections but remains visible through transparent areas.
 */
export const FixedCubeBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 opacity-30">
      <Scene />
    </div>
    {/* subtle dark overlay for readability; safe on light text */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/40" />
  </div>
);
