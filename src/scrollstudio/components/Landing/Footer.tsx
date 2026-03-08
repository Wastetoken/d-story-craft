import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12 md:px-10 lg:px-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
              <h3 className="text-xl font-bold text-white">ScrollStudio 3D</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">Create immersive 3D narratives with scroll-based animations and cinematic camera movements.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">Documentation</a></li>
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">Examples</a></li>
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">Templates</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">GitHub</a></li>
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">Twitter</a></li>
              <li><a href="#" className="text-slate-400 transition-colors hover:text-white">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-500 text-center">© {new Date().getFullYear()} ScrollStudio 3D. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
