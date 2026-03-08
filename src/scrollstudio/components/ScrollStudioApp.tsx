import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../useStore';
import { LandingPage } from './Landing/LandingPage';
import { useFontLoader } from '../hooks/useFontLoader';

const ScrollStudioApp: React.FC = () => {
  const { mode, currentProgress, chapters, activeChapterId, setMode, isPlacingHotspot, setActiveChapter, setSelectedMesh, typography, landingMode, setLandingMode } = useStore();

  useFontLoader(typography.fonts);

  // Show landing page if in landing mode
  if (landingMode) {
    return (
      <div className="w-full relative">
        <LandingPage />
      </div>
    );
  }

  // Studio mode - placeholder for now, full studio components coming next
  return (
    <div className="w-full relative bg-[#050505] h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white italic uppercase">Initialize Engine</h2>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em]">Upload a .GLB model to begin</p>
          <label className="inline-flex flex-col items-center justify-center px-12 py-6 bg-white hover:bg-emerald-400 text-black rounded-[2rem] cursor-pointer transition-all duration-500 shadow-xl">
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Connect Model</span>
            <span className="text-[8px] opacity-40 uppercase font-bold tracking-widest mt-2">Supports .glb / .gltf</span>
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file) + `#.${file.name.split('.').pop()?.toLowerCase() || 'glb'}`;
                useStore.getState().addChapter(url, file.name.split('.')[0].toUpperCase());
              }
            }} />
          </label>
          <button onClick={() => setLandingMode(true)} className="block mx-auto text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors mt-4">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScrollStudioApp;
