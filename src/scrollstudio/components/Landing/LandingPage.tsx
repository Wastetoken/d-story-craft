import React from 'react';
import { Background } from './Background';
import { Hero } from './Hero';
import { Footer } from './Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Background />
      <Hero />
      <Footer />
    </div>
  );
};
