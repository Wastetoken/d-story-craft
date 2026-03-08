import React, { useState, useRef } from 'react';
import { useStore } from '../../useStore';

const TutorialSection: React.FC<{ title: string; children: React.ReactNode; icon: string }> = ({ title, children, icon }) => (
  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
        <i className={`fa-solid ${icon} text-white/80 text-sm`}></i>
      </div>
      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white italic">{title}</h3>
    </div>
    <div className="text-[11px] leading-relaxed text-zinc-400 space-y-3 pl-14">
      {children}
    </div>
  </div>
);

export const Handbook: React.FC = () => {
  const { showHandbook, setShowHandbook } = useStore();
  const [activeTab, setActiveTab] = useState<'directing' | 'optics' | 'atmosphere' | 'fx' | 'canvas' | 'distribution'>('directing');
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopyAll = () => {
    const allDocs = `SCROLLSTUDIO MANUAL — FULL DOCUMENTATION

═══ DIRECTING ═══

MULTI-CHAPTER SYSTEM
Projects are organized into Chapters. Each chapter holds a unique 3D model, lighting rig, camera path, and narrative sequence.
• Auto-Distribute: Automatically spans chapters across the total scroll progress so they tile evenly.
• Chapter Transitions: Smooth cinematic flares trigger when the scroll crosses between chapters.
• Independent Timelines: Each chapter has its own keyframes, story beats, and DOM sections — fully self-contained.

TIMELINE & KEYFRAMES
The timeline at the bottom of the studio has three rows:
• Keyframes Row: Capture camera positions at any scroll percentage. The engine builds a smooth Catmull-Rom Spline between them.
• Story Row: Add narrative beats — full-screen text moments that fade in and out at specific scroll points.
• DOM Row: Add HTML content sections that appear over the 3D scene. Drag bars to set when they enter and exit.
Use the + button on the left of each row to add items. Drag bar edges to resize timing. Drag bar bodies to reposition.

CAMERA CONTROLS
Two camera modes for different tasks:
• Free Mode: Orbit, pan, and zoom freely to compose your shot. This is where you set up each keyframe.
• Cinema Mode: Locks the camera to the interpolated path. Scrub the timeline to preview the exact scroll experience.
• Spline Alpha: Adjust path tension — lower values give tighter curves, higher values give sweeping arcs.

═══ CANVAS EDITOR ═══

DOM SECTIONS OVERVIEW
DOM Sections are HTML content cards that appear over the 3D canvas during the scroll. They're how you add text, calls to action, and storytelling elements to your experience.
Think of it like compositing titles over video — the 3D scene is the backdrop, and your content floats over it.

DIRECT CANVAS EDITING
DOM sections are edited directly on the viewport — not in the sidebar. This is the same pattern used by Spline, Webflow, and Framer.
• Click a section to select it. A selection outline and resize handles appear.
• Drag the section body to reposition it anywhere on the canvas. Position is stored as viewport percentages.
• Drag handles on the right edge, bottom edge, or corner to resize.
• Double-click any text (headline, subheading, body) to edit it inline. Click away to save.
• Click outside all sections to deselect.

FLOATING PROPERTIES PANEL
When a section is selected, a small floating panel appears near it with quick-access controls:
• Card Style: Glass, Solid, Outline, or None — controls the card's visual treatment.
• Font Variant: Display, Sans, Mono, or Serif — sets the typography style.
• Colors: Text, background, and accent color pickers.
• Opacity: Background opacity slider (hidden when card style is "none").
• Delete: Red trash button to remove the section entirely.

TIMING & SCROLL RANGE
Each DOM section has a progress (entry) and exitProgress (exit) value. These control when the section is visible during the scroll.
Set these by dragging the section's bar on the DOM row in the timeline. The left edge is entry, the right edge is exit.

═══ OPTICS ═══

CINEMATIC LENSES
Control Depth of Field with precision. Use Aperture to expand the blur area and Focus Distance to hit your target.
Pro Tip: Increase Bokeh Scale (up to 10) for high-end dreamlike backgrounds. Pair this with a low FOV for macro shots.

FIELD OF VIEW
Lower FOV (20-30) compresses space for a professional "product shot" look. Higher FOV (60-80) creates dynamic, fast-moving perspectives.

═══ ATMOSPHERE ═══

STUDIO LIGHTING
Each chapter has an Environment Map. Presets like Studio, City, and Night provide fundamentally different reflection and lighting profiles.

VOLUMETRIC FOG
Fog density adds a sense of massive scale. Match the Fog Color to your background to create an infinite, seamless void.

BACKGROUND & PAGE CHROME
The Layout tab in the sidebar controls Page Chrome — the overall page appearance in the export:
• Page Background Color: The color behind the 3D canvas.
• Navigation Bar: Optional top bar with logo text, links, and customizable colors.
• Footer: Optional bottom section with configurable text.
• Scroll Indicator: Animated "scroll down" hint for the viewer.

═══ VISUAL FX ═══

VISUAL GRADE
The final layer of fidelity:
• Bloom: High-intensity light spill from emissive surfaces.
• Scanlines & Grain: Adds an analog/technical texture to the digital render.
• Camera Shake: Subtle procedural noise for handheld cinematic realism.
• Vignette: Focuses the eye by darkening corners.

═══ DISTRIBUTION ═══

DIRECT-TO-WEB (ZIP)
The Self-Contained Export is the fastest path to a live page. It bundles a custom vanilla JS engine — no React, no build step.
• What's in the ZIP: index.html, project.json, ScrollyPipeline.js, and an optional assets/ folder.
• Asset Strategy: Choose between embedding models as Base64 in the JSON (maximum portability) or keeping them as external .glb files (better performance).
• Local Preview: Due to CORS, open the ZIP contents via a local server — npx serve . or VS Code Live Server.
• Deploy: Upload the folder to Vercel, Netlify, or any static host. It works out of the box.

REACT INTEGRATION (JSON)
For existing React applications, export the Project JSON and feed it into the ScrollyEngine component:

  import { ScrollyEngine } from './ScrollyEngine';
  import data from './project.json';
  export default function Page() {
    return <ScrollyEngine data={data} />;
  }

Required packages: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing

WHAT GETS EXPORTED
The export captures your complete scene:
• Camera path with all keyframes and spline interpolation
• DOM sections with free positioning (x/y/width/height as viewport %)
• Story beats with fade-in/out timing
• Post-processing settings (bloom, fog, DoF, vignette)
• Page chrome (nav bar, footer, background, scroll indicator)
• 3D model with environment and lighting`;

    navigator.clipboard.writeText(allDocs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!showHandbook) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={() => setShowHandbook(false)}
      />

      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0a0a0a] border border-zinc-800/50 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="shrink-0 p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <div className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500">System Documentation v4.0</div>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">ScrollStudio Manual</h2>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Mastering the high-fidelity spatial narrative engine.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className={`w-10 h-10 rounded-full ${copied ? 'bg-emerald-500 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white hover:text-black'} text-white flex items-center justify-center transition-all border`}
              title="Copy all documentation"
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-xs`}></i>
            </button>
            <button
              onClick={() => setShowHandbook(false)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all border border-white/10"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 border-r border-white/5 p-6 space-y-2 bg-black/20 shrink-0 overflow-y-auto">
            {[
              { id: 'directing', label: 'Directing', icon: 'fa-video', desc: 'Paths & Timeline' },
              { id: 'canvas', label: 'Canvas Editor', icon: 'fa-object-group', desc: 'DOM Sections' },
              { id: 'optics', label: 'Optics', icon: 'fa-circle-dot', desc: 'Lenses & Blur' },
              { id: 'atmosphere', label: 'Atmosphere', icon: 'fa-cloud-sun', desc: 'Light & Space' },
              { id: 'fx', label: 'Visual FX', icon: 'fa-wand-magic-sparkles', desc: 'The Final Grade' },
              { id: 'distribution', label: 'Distribution', icon: 'fa-box-open', desc: 'Going Live' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex flex-col gap-1 px-5 py-4 rounded-2xl transition-all text-left border ${activeTab === tab.id ? 'bg-white border-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.15)]' : 'bg-transparent border-transparent text-zinc-600 hover:bg-white/5 hover:border-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                </div>
                <span className={`text-[9px] font-bold opacity-50 ml-6 ${activeTab === tab.id ? 'text-black' : ''}`}>{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto p-12 space-y-12 bg-gradient-to-br from-transparent to-white/[0.01]">

            {activeTab === 'directing' && (
              <div className="space-y-10">
                <TutorialSection title="Multi-Chapter System" icon="fa-layer-group">
                  <p>Projects are organized into <b className="text-white italic">Chapters</b>. Each chapter holds a unique 3D model, lighting rig, camera path, and narrative sequence.</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Auto-Distribute:</b> Automatically spans chapters across the total scroll progress so they tile evenly.</li>
                    <li><b className="text-white">Chapter Transitions:</b> Smooth cinematic flares trigger when the scroll crosses between chapters.</li>
                    <li><b className="text-white">Independent Timelines:</b> Each chapter has its own keyframes, story beats, and DOM sections — fully self-contained.</li>
                  </ul>
                </TutorialSection>

                <TutorialSection title="Timeline & Keyframes" icon="fa-camera-retro">
                  <p>The timeline at the bottom of the studio has three rows:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Keyframes Row:</b> Capture camera positions at any scroll percentage. The engine builds a smooth <b className="text-white">Catmull-Rom Spline</b> between them.</li>
                    <li><b className="text-white">Story Row:</b> Add narrative beats — full-screen text moments that fade in and out at specific scroll points.</li>
                    <li><b className="text-white">DOM Row:</b> Add HTML content sections that appear over the 3D scene. Drag bars to set when they enter and exit.</li>
                  </ul>
                  <p className="mt-2">Use the <b className="text-white">+</b> button on the left of each row to add items. Drag bar edges to resize timing. Drag bar bodies to reposition.</p>
                </TutorialSection>

                <TutorialSection title="Camera Controls" icon="fa-arrows-up-down-left-right">
                  <p>Two camera modes for different tasks:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Free Mode:</b> Orbit, pan, and zoom freely to compose your shot. This is where you set up each keyframe.</li>
                    <li><b className="text-white">Cinema Mode:</b> Locks the camera to the interpolated path. Scrub the timeline to preview the exact scroll experience.</li>
                    <li><b className="text-white">Spline Alpha:</b> Adjust path tension — lower values give tighter curves, higher values give sweeping arcs.</li>
                  </ul>
                </TutorialSection>
              </div>
            )}

            {activeTab === 'canvas' && (
              <div className="space-y-10">
                <TutorialSection title="DOM Sections Overview" icon="fa-object-group">
                  <p>DOM Sections are HTML content cards that appear over the 3D canvas during the scroll. They're how you add text, calls to action, and storytelling elements to your experience.</p>
                  <p>Think of it like compositing titles over video — the 3D scene is the backdrop, and your content floats over it.</p>
                </TutorialSection>

                <TutorialSection title="Direct Canvas Editing" icon="fa-hand-pointer">
                  <p>DOM sections are edited directly on the viewport — not in the sidebar. This is the same pattern used by Spline, Webflow, and Framer.</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Click</b> a section to select it. A selection outline and resize handles appear.</li>
                    <li><b className="text-white">Drag</b> the section body to reposition it anywhere on the canvas. Position is stored as viewport percentages.</li>
                    <li><b className="text-white">Drag handles</b> on the right edge, bottom edge, or corner to resize.</li>
                    <li><b className="text-white">Double-click</b> any text (headline, subheading, body) to edit it inline. Click away to save.</li>
                    <li><b className="text-white">Click outside</b> all sections to deselect.</li>
                  </ul>
                </TutorialSection>

                <TutorialSection title="Floating Properties Panel" icon="fa-sliders">
                  <p>When a section is selected, a small floating panel appears near it with quick-access controls:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Card Style:</b> Glass, Solid, Outline, or None — controls the card's visual treatment.</li>
                    <li><b className="text-white">Font Variant:</b> Display, Sans, Mono, or Serif — sets the typography style.</li>
                    <li><b className="text-white">Colors:</b> Text, background, and accent color pickers.</li>
                    <li><b className="text-white">Opacity:</b> Background opacity slider (hidden when card style is "none").</li>
                    <li><b className="text-white">Delete:</b> Red trash button to remove the section entirely.</li>
                  </ul>
                </TutorialSection>

                <TutorialSection title="Timing & Scroll Range" icon="fa-clock">
                  <p>Each DOM section has a <b className="text-white">progress</b> (entry) and <b className="text-white">exitProgress</b> (exit) value. These control when the section is visible during the scroll.</p>
                  <p>Set these by dragging the section's bar on the <b className="text-white">DOM row</b> in the timeline. The left edge is entry, the right edge is exit.</p>
                </TutorialSection>
              </div>
            )}

            {activeTab === 'optics' && (
              <div className="space-y-10">
                <TutorialSection title="Cinematic Lenses" icon="fa-circle-dot">
                  <p>Control Depth of Field with precision. Use <b className="text-white">Aperture</b> to expand the blur area and <b className="text-white">Focus Distance</b> to hit your target.</p>
                  <p><b className="text-white italic underline">Pro Tip:</b> Increase <b className="text-white">Bokeh Scale</b> (up to 10) for high-end dreamlike backgrounds. Pair this with a low FOV for macro shots.</p>
                </TutorialSection>

                <TutorialSection title="Field of View" icon="fa-magnifying-glass">
                  <p>Lower FOV (20-30) compresses space for a professional "product shot" look. Higher FOV (60-80) creates dynamic, fast-moving perspectives.</p>
                </TutorialSection>
              </div>
            )}

            {activeTab === 'atmosphere' && (
              <div className="space-y-10">
                <TutorialSection title="Studio Lighting" icon="fa-sun">
                  <p>Each chapter has an <b className="text-white">Environment Map</b>. Presets like <b className="text-white">Studio</b>, <b className="text-white">City</b>, and <b className="text-white">Night</b> provide fundamentally different reflection and lighting profiles.</p>
                </TutorialSection>

                <TutorialSection title="Volumetric Fog" icon="fa-cloud">
                  <p>Fog density adds a sense of massive scale. Match the <b className="text-white">Fog Color</b> to your background to create an infinite, seamless void.</p>
                </TutorialSection>

                <TutorialSection title="Background & Page Chrome" icon="fa-palette">
                  <p>The <b className="text-white">Layout tab</b> in the sidebar controls Page Chrome — the overall page appearance in the export:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Page Background Color:</b> The color behind the 3D canvas.</li>
                    <li><b className="text-white">Navigation Bar:</b> Optional top bar with logo text, links, and customizable colors.</li>
                    <li><b className="text-white">Footer:</b> Optional bottom section with configurable text.</li>
                    <li><b className="text-white">Scroll Indicator:</b> Animated "scroll down" hint for the viewer.</li>
                  </ul>
                </TutorialSection>
              </div>
            )}

            {activeTab === 'fx' && (
              <div className="space-y-10">
                <TutorialSection title="Visual Grade" icon="fa-wand-magic-sparkles">
                  <p>The final layer of fidelity:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">Bloom:</b> High-intensity light spill from emissive surfaces.</li>
                    <li><b className="text-white">Scanlines & Grain:</b> Adds an analog/technical texture to the digital render.</li>
                    <li><b className="text-white">Camera Shake:</b> Subtle procedural noise for handheld cinematic realism.</li>
                    <li><b className="text-white">Vignette:</b> Focuses the eye by darkening corners.</li>
                  </ul>
                </TutorialSection>
              </div>
            )}

            {activeTab === 'distribution' && (
              <div className="space-y-10">
                <TutorialSection title="Direct-to-Web (ZIP)" icon="fa-file-zipper">
                  <p>The <b className="text-white">Self-Contained Export</b> is the fastest path to a live page. It bundles a custom vanilla JS engine — no React, no build step.</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><b className="text-white">What's in the ZIP:</b> <code className="text-emerald-400">index.html</code>, <code className="text-emerald-400">project.json</code>, <code className="text-emerald-400">ScrollyPipeline.js</code>, and an optional <code className="text-emerald-400">assets/</code> folder.</li>
                    <li><b className="text-white">Asset Strategy:</b> Choose between embedding models as Base64 in the JSON (maximum portability) or keeping them as external .glb files (better performance).</li>
                    <li><b className="text-white">Local Preview:</b> Due to CORS, open the ZIP contents via a local server — <code className="text-emerald-400">npx serve .</code> or VS Code Live Server.</li>
                    <li><b className="text-white">Deploy:</b> Upload the folder to Vercel, Netlify, or any static host. It works out of the box.</li>
                  </ul>
                </TutorialSection>

                <TutorialSection title="React Integration (JSON)" icon="fa-code">
                  <p>For existing React applications, export the <b className="text-white">Project JSON</b> and feed it into the <code className="text-emerald-400">ScrollyEngine</code> component:</p>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-4 mt-2 font-mono text-[10px] text-emerald-400 leading-relaxed">
                    {`import { ScrollyEngine } from './ScrollyEngine';`}<br/>
                    {`import data from './project.json';`}<br/><br/>
                    {`export default function Page() {`}<br/>
                    {`  return <ScrollyEngine data={data} />;`}<br/>
                    {`}`}
                  </div>
                  <p className="mt-3">Required packages: <code className="text-emerald-400">three</code>, <code className="text-emerald-400">@react-three/fiber</code>, <code className="text-emerald-400">@react-three/drei</code>, <code className="text-emerald-400">@react-three/postprocessing</code></p>
                </TutorialSection>

                <TutorialSection title="What Gets Exported" icon="fa-list-check">
                  <p>The export captures your complete scene:</p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>Camera path with all keyframes and spline interpolation</li>
                    <li>DOM sections with free positioning (x/y/width/height as viewport %)</li>
                    <li>Story beats with fade-in/out timing</li>
                    <li>Post-processing settings (bloom, fog, DoF, vignette)</li>
                    <li>Page chrome (nav bar, footer, background, scroll indicator)</li>
                    <li>3D model with environment and lighting</li>
                  </ul>
                </TutorialSection>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-10 border-t border-white/5 flex justify-center bg-black/40">
          <button
            onClick={() => setShowHandbook(false)}
            className="px-12 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-4"
          >
            Continue Designing
            <i className="fa-solid fa-arrow-right text-[8px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
