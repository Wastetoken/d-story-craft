import { FONT_VARIANT_MAP, LAYOUT_CSS_MAP } from '../../domSectionConstants';
import { DOMSection, PageChrome, DOMSectionFontVariant } from '../../types';

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '128, 128, 128';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export const SCROLLY_PIPELINE_JS = `
/**
 * ScrollyPipeline.js
 * Core engine for ScrollStudio3D exported projects.
 */

class ScrollyPipeline {
  constructor(options) {
    this.container = options.container || document.body;
    this.data = options.data;
    this.chapters = this.data.chapters;
    this.assets = this.data.embeddedAssets || {};
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.scroll = { offset: 0, target: 0 };
    this.chapterInstances = new Map();
    this.activeChapterId = null;
    this.curves = new Map();
    
    this.init();
  }

  async init() {
    this.setupPostProcessing();
    this.setupLighting();
    this.setupOverlay();
    
    if (this.data.typography && this.data.typography.fonts) {
      this.data.typography.fonts.forEach(f => this.loadFont(f));
    }

    await this.loadAllChapters();
    this.setupDOMSections();
    this.setupScroll();
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    this.animate();
    this.update(0);
  }

  setupDOMSections() {
    this.domSectionEls = [];
    this.chapters.forEach(chapter => {
      (chapter.domSections || []).forEach(section => {
        const el = document.querySelector('[data-section-id="' + section.id + '"]');
        if (!el) return;
        const card = el.querySelector('.content-card');
        this.domSectionEls.push({
          card: card,
          progress: section.progress,
          exitProgress: section.exitProgress
        });
      });
    });
    this.domSectionEls.sort(function(a, b) { return a.progress - b.progress; });

    this.progressBarEl = document.getElementById('scrolly-progress-bar') || null;
  }

  setupOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scrolly-overlay';
    this.overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;';
    this.container.appendChild(this.overlay);
    
    this.beats = this.chapters.flatMap(c => c.narrativeBeats || []);
    this.beatElements = new Map();
    
    this.beats.forEach(beat => {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;display:none;flex-direction:column;justify-content:center;padding:10vw;transition:opacity 0.8s, transform 0.8s;';
      
      const content = document.createElement('div');
      const style = beat.style || {};
      const borderRadius = style.borderRadius || 30;
      const padding = style.padding || 40;
      const blur = style.backdropBlur || 30;
      
      content.style.cssText = "background:rgba(0,0,0,0.4);backdrop-filter:blur(" + blur + "px);border-radius:" + borderRadius + "px;padding:" + padding + "px;border:1px solid rgba(255,255,255,0.1);max-width:800px;pointer-events:auto;";
      
      const title = document.createElement('h2');
      title.innerText = beat.title;
      title.style.cssText = "font-size:clamp(2rem, 8vw, 6rem);margin-bottom:1.5rem;line-height:0.85;font-weight:900;text-transform:uppercase;font-style:italic;";
      if (style.titleColor) title.style.color = style.titleColor;
      if (style.textGlow) title.style.textShadow = "0 0 40px " + (style.titleColor || '#ffffff') + "88";
      
      const desc = document.createElement('p');
      desc.innerText = beat.description;
      desc.style.cssText = "font-size:1.15rem;line-height:1.6;opacity:0.6;max-width:500px;";
      if (style.descriptionColor) desc.style.color = style.descriptionColor;
      
      content.appendChild(title);
      content.appendChild(desc);
      el.appendChild(content);
      
      if (style.textAlign === 'center') {
          el.style.alignItems = 'center';
          el.style.textAlign = 'center';
      } else if (style.textAlign === 'right') {
          el.style.alignItems = 'flex-end';
          el.style.textAlign = 'right';
      } else {
          el.style.alignItems = 'flex-start';
          el.style.textAlign = 'left';
      }
      
      this.overlay.appendChild(el);
      this.beatElements.set(beat.id, el);
    });

    this.hotspotElements = new Map();
    this.chapters.forEach(chapter => {
        (chapter.spatialAnnotations || []).forEach(h => {
            const el = document.createElement('div');
            el.className = 'hotspot';
            el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;transition:opacity 0.4s;width:280px;padding:1.5rem;background:rgba(5,5,5,0.9);backdrop-filter:blur(32px);border-radius:1.5rem;border:1px solid rgba(255,255,255,0.1);color:white;";
            
            const title = document.createElement('h4');
            title.innerText = h.label;
            title.style.cssText = "margin:0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;";
            
            const content = document.createElement('p');
            content.innerText = h.content;
            content.style.cssText = "margin:0.5rem 0 0 0;font-size:11px;line-height:1.6;opacity:0.6;font-weight:500;";
            
            el.appendChild(title);
            el.appendChild(content);
            this.overlay.appendChild(el);
            this.hotspotElements.set(h.id, { el, pos: new THREE.Vector3(...h.position), visibleAt: h.visibleAt });
        });
    });
  }

  loadFont(font) {
    if (font.source === 'cdn' && font.url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.url;
      document.head.appendChild(link);
    } else if (font.source === 'local') {
      const style = document.createElement('style');
      const src = font.data ? font.data : font.localPath;
      if (!src) return;
      style.textContent = "@font-face { font-family: '" + font.name + "'; src: url('" + src + "') format('woff2'); font-display: swap; }";
      document.head.appendChild(style);
    }
  }

  setupPostProcessing() {
    if (window.THREE.UnrealBloomPass) {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);
    }
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.directionalLight.position.set(10, 10, 5);
    this.scene.add(this.directionalLight);
  }

  async loadAllChapters() {
    const loader = new THREE.GLTFLoader();
    for (const chapter of this.chapters) {
      const modelUrl = this.assets[chapter.id] || chapter.modelUrl;
      const gltf = await new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const normScale = 10 / maxDim;
      model.scale.set(normScale, normScale, normScale);
      
      const newBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      newBox.getCenter(center);
      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -newBox.min.y;
      
      const config = chapter.environment || {};
      model.scale.multiplyScalar(config.modelScale || 1);
      if (config.modelPosition) model.position.add(new THREE.Vector3(...config.modelPosition));
      if (config.modelRotation) model.rotation.set(...config.modelRotation);
      
      const overrides = chapter.materialOverrides || {};
      model.traverse(node => {
          if (node.isMesh) {
              const settings = overrides[node.name];
              if (settings) {
                  const mats = Array.isArray(node.material) ? node.material : [node.material];
                  mats.forEach(mat => {
                      if (mat.isMeshStandardMaterial) {
                          mat.color.set(settings.color);
                          mat.emissive.set(settings.emissive);
                          mat.emissiveIntensity = settings.emissiveIntensity;
                          mat.metalness = settings.metalness;
                          mat.roughness = settings.roughness;
                          mat.wireframe = !!settings.wireframe;
                      }
                  });
              }
          }
      });
      this.chapterInstances.set(chapter.id, model);
      const sorted = [...chapter.cameraPath].sort((a, b) => a.progress - b.progress);
      if (sorted.length >= 2) {
          const points = sorted.map(k => new THREE.Vector3(...k.position));
          const targets = sorted.map(k => new THREE.Vector3(...k.target));
          const posCurve = new THREE.CatmullRomCurve3(points);
          const targetCurve = new THREE.CatmullRomCurve3(targets);
          const alpha = config.splineAlpha ?? 0.5;
          const curveType = alpha === 0 ? 'centripetal' : alpha === 1 ? 'chordal' : 'catmullrom';
          posCurve.curveType = curveType;
          targetCurve.curveType = curveType;
          this.curves.set(chapter.id, { posCurve, targetCurve, sorted });
      } else if (sorted.length === 1) {
          this.curves.set(chapter.id, { sorted });
      }
    }
  }

  setupScroll() {
    const totalHeight = this.chapters.length * 400;
    document.body.style.height = totalHeight + 'vh';
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.scroll.target = scrollY / maxScroll;
    });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
  }

  update(progress) {
    const currentChapter = this.chapters.find(c => progress >= c.startProgress && progress <= c.endProgress) || this.chapters[0];
    if (this.activeChapterId !== currentChapter.id) {
        if (this.activeChapterId && this.chapterInstances.has(this.activeChapterId)) {
            this.scene.remove(this.chapterInstances.get(this.activeChapterId));
        }
        this.activeChapterId = currentChapter.id;
        const model = this.chapterInstances.get(this.activeChapterId);
        if (model) this.scene.add(model);
        const config = currentChapter.environment || {};
        this.scene.background = new THREE.Color(config.backgroundColor || '#030303');
        this.ambientLight.intensity = config.ambientIntensity ?? 0.5;
        this.directionalLight.intensity = config.directionalIntensity ?? 1.5;
        this.renderer.toneMappingExposure = config.exposure ?? 1.0;
        if (this.bloomPass) {
            this.bloomPass.intensity = config.bloomIntensity ?? 1.5;
            this.bloomPass.threshold = config.bloomThreshold ?? 0.1;
        }
    }

    const curves = this.curves.get(currentChapter.id);
    if (curves) {
        const duration = currentChapter.endProgress - currentChapter.startProgress;
        const localT = duration === 0 ? 0 : (progress - currentChapter.startProgress) / duration;
        if (curves.posCurve) {
            const pos = curves.posCurve.getPointAt(localT);
            const target = curves.targetCurve.getPointAt(localT);
            this.camera.position.copy(pos);
            this.camera.lookAt(target);
            let i = 0;
            const kfs = curves.sorted;
            while (i < kfs.length - 2 && localT > kfs[i + 1].progress) i++;
            const kfA = kfs[i];
            const kfB = kfs[i+1] || kfA;
            const segT = kfA === kfB ? 0 : (localT - kfA.progress) / (kfB.progress - kfA.progress);
            const alpha = Math.max(0, Math.min(1, segT));
            this.camera.fov = kfA.fov + (kfB.fov - kfA.fov) * alpha;
            this.camera.updateProjectionMatrix();
        } else if (curves.sorted && curves.sorted[0]) {
            const kf = curves.sorted[0];
            this.camera.position.set(...kf.position);
            this.camera.lookAt(new THREE.Vector3(...kf.target));
            this.camera.fov = kf.fov;
            this.camera.updateProjectionMatrix();
        }
    }

    this.beats.forEach((beat, idx) => {
        const nextBeat = this.beats[idx + 1];
        const end = nextBeat ? nextBeat.progress : 1.1;
        const isActive = progress >= beat.progress && progress < end;
        const el = this.beatElements.get(beat.id);
        if (isActive) {
            el.style.display = 'flex';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0px)';
        } else {
            const dist = Math.abs(progress - beat.progress);
            const opacity = Math.max(0, 1 - dist * 10);
            if (opacity <= 0) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex';
                el.style.opacity = opacity;
                el.style.transform = "translateY(" + ((1 - opacity) * 30) + "px)";
            }
        }
    });

    // DOM sections
    this.domSectionEls.forEach(function(item) {
      if (!item.card) return;
      var isActive = progress >= item.progress && progress < item.exitProgress;
      if (isActive) {
        item.card.classList.add('is-active');
      } else {
        item.card.classList.remove('is-active');
      }
    });

    // Progress bar
    if (this.progressBarEl) {
      this.progressBarEl.style.width = (progress * 100) + '%';
    }

    this.hotspotElements.forEach(h => {
        const distance = Math.abs(progress - h.visibleAt);
        const opacity = Math.max(0, Math.min(1, (0.08 - distance) * 20));
        
        if (opacity <= 0) {
            h.el.style.opacity = '0';
        } else {
            const vector = h.pos.clone().project(this.camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
            
            h.el.style.opacity = opacity;
            h.el.style.transform = "translate(-50%, -50%) translate(" + x + "px, " + y + "px)";
        }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.scroll.offset += (this.scroll.target - this.scroll.offset) * 0.1;
    this.update(this.scroll.offset);
    if (this.composer) {
        this.composer.render();
    } else {
        this.renderer.render(this.scene, this.camera);
    }
  }
}

window.ScrollyPipeline = ScrollyPipeline;
`;

export const INDEX_HTML_TEMPLATE = (projectData: any) => {
  const projectName = projectData.manifest?.projectName || 'ScrollStudio Export';
  const chapters = projectData.chapters || [];
  const chrome: PageChrome = chapters[0]?.pageChrome || {};

  // Collect all DOM sections across chapters sorted by progress
  const allSections: DOMSection[] = [];
  chapters.forEach((ch: any) => {
    (ch.domSections || []).forEach((s: DOMSection) => allSections.push(s));
  });
  allSections.sort((a, b) => a.progress - b.progress);

  // Collect unique font variants used
  const usedFonts = new Set<DOMSectionFontVariant>();
  allSections.forEach(s => usedFonts.add(s.fontVariant));

  const fontLinks = Array.from(usedFonts).map(v => {
    const f = FONT_VARIANT_MAP[v];
    return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=${f.googleFontUrl}&display=swap" rel="stylesheet">`;
  }).join('\n    ');

  const navHtml = chrome.showNav ? `
    <nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:2rem 4rem;display:flex;justify-content:space-between;align-items:center;background:rgba(${hexToRgb(chrome.navBackgroundColor || '#ffffff')}, ${chrome.navBackgroundOpacity ?? 0});color:${chrome.navTextColor || '#888888'};pointer-events:auto;">
      <span style="font-weight:bold;font-size:1.2rem;">${chrome.navTitle || ''}</span>
    </nav>` : '';

  const progressBarHtml = chrome.showProgressBar ? `
    <div style="position:fixed;top:0;left:0;height:3px;z-index:60;background:${chrome.progressBarColor || '#888888'};width:0%;transition:width 0.1s;" id="scrolly-progress-bar"></div>` : '';

  const noiseHtml = chrome.showNoiseOverlay ? `
    <div style="position:fixed;inset:0;z-index:5;pointer-events:none;opacity:${chrome.noiseOpacity ?? 0.05};background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 512 512%22><filter id=%22n%22><feTurbulence baseFrequency=%220.7%22/></filter><rect width=%22512%22 height=%22512%22 filter=%22url(%23n)%22 opacity=%220.4%22/></svg>');background-size:256px;"></div>` : '';

  const vignetteHtml = chrome.showVignette ? `
    <div style="position:fixed;inset:0;z-index:5;pointer-events:none;background:radial-gradient(circle, transparent 30%, rgba(${hexToRgb(chrome.vignetteColor || '#000000')}, ${chrome.vignetteOpacity ?? 0.5}) 100%);"></div>` : '';

  const scanlinesHtml = chrome.showScanlines ? `
    <div style="position:fixed;inset:0;z-index:6;pointer-events:none;background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${hexToRgb(chrome.scanlinesColor || '#000000')},${chrome.scanlinesOpacity ?? 0.1}) 2px, rgba(${hexToRgb(chrome.scanlinesColor || '#000000')},${chrome.scanlinesOpacity ?? 0.1}) 4px);"></div>` : '';

  const footerHtml = chrome.showFooter ? `
    <footer style="position:relative;z-index:10;padding:3rem;text-align:center;color:${chrome.footerTextColor || '#888888'};background:${chrome.footerBackgroundColor || '#ffffff'};">${chrome.footerText || ''}</footer>` : '';

  const sectionsHtml = allSections.map(section => {
    const font = FONT_VARIANT_MAP[section.fontVariant];
    const layoutCss = LAYOUT_CSS_MAP[section.layout];

    let cardBg = 'transparent';
    let cardBorder = 'none';
    let cardBackdrop = 'none';

    if (section.cardStyle === 'glass') {
      cardBg = `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
      cardBackdrop = 'blur(20px)';
    } else if (section.cardStyle === 'solid') {
      cardBg = `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
    } else if (section.cardStyle === 'outline') {
      cardBorder = `2px solid ${section.accentColor}`;
    }

    const headlineHtml = section.headline ? `<h2 style="font-size:clamp(2rem,5vw,4rem);font-weight:${font.headingWeight};margin:0 0 0.5rem 0;line-height:1.1;color:${section.textColor};">${section.headline}</h2>` : '';
    const subheadingHtml = section.subheading ? `<h3 style="font-size:clamp(1rem,2vw,1.5rem);font-weight:${font.bodyWeight};margin:0 0 0.75rem 0;opacity:0.8;color:${section.textColor};">${section.subheading}</h3>` : '';
    const bodyHtml = section.bodyText ? `<p style="font-size:1rem;line-height:1.7;font-weight:${font.bodyWeight};opacity:0.7;color:${section.textColor};max-width:500px;">${section.bodyText}</p>` : '';
    const buttonHtml = section.buttonLabel ? `<a href="${section.buttonUrl || '#'}" style="display:inline-block;margin-top:1.5rem;padding:0.75rem 2rem;background:${section.accentColor};color:${section.backgroundColor};font-size:0.85rem;font-weight:bold;text-decoration:none;border-radius:0.5rem;text-transform:uppercase;letter-spacing:0.05em;">${section.buttonLabel}</a>` : '';

    return `
      <section class="scrolly-section" data-section-id="${section.id}" style="display:flex;flex-direction:column;${layoutCss}">
        <div class="content-card" style="max-width:550px;padding:2.5rem;border-radius:1.5rem;font-family:${font.fontFamily};background:${cardBg};border:${cardBorder};backdrop-filter:${cardBackdrop};opacity:0;transform:translateY(30px);transition:opacity 0.8s ease, transform 0.8s ease;">
          ${headlineHtml}
          ${subheadingHtml}
          ${bodyHtml}
          ${buttonHtml}
        </div>
      </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} • ScrollStudio Export</title>
    ${fontLinks}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${chrome.pageBackgroundColor || '#ffffff'}; overflow-x: hidden; }
        #app { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 0; pointer-events: none; }
        .scrolly-section { position: relative; z-index: 10; min-height: 100vh; pointer-events: none; }
        .content-card { pointer-events: auto; }
        .content-card.is-active { opacity: 1 !important; transform: translateY(0) !important; }
    </style>
    <!-- Dependencies -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"><\/script>
    <script src="ScrollyPipeline.js"><\/script>
</head>
<body>
    ${progressBarHtml}
    ${noiseHtml}
    ${vignetteHtml}
    ${scanlinesHtml}
    ${navHtml}

    <div id="app"></div>

    <main style="position:relative;z-index:10;">
      ${sectionsHtml}
    </main>

    ${footerHtml}

    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const response = await fetch('project.json');
                const projectData = await response.json();
                const pipeline = new ScrollyPipeline({
                    container: document.getElementById('app'),
                    data: projectData
                });
            } catch (e) {
                console.error("Failed to initialize scrolly pipeline:", e);
                document.body.innerHTML = '<div style="padding:40px; text-align:center;"><h1>Failed to load project</h1><p>' + e.message + '</p></div>';
            }
        });
    <\/script>
</body>
</html>`;
};

export const README_MD_TEMPLATE = (projectName: string) => `# ${projectName}

This is a self-contained scrollytelling experience exported from **ScrollStudio3D**.

## How to Run

### 1. Local Preview
Due to browser security restrictions on loading local files (CORS), you cannot simply double-click index.html to open it. You must run it through a local server.

**Option A: VS Code Live Server**
If you use VS Code, install the "Live Server" extension, right-click index.html, and select "Open with Live Server".

**Option B: Python (Built-in)**
Run this command in the project folder:
\`\`\`bash
python -m http.server 8000
\`\`\`
Then visit http://localhost:8000 in your browser.

**Option C: Node.js (npx)**
\`\`\`bash
npx serve .
\`\`\`

## Project Structure
- index.html: The entry point.
- project.json: Your project configuration, including chapters, camera paths, and narrative beats.
- ScrollyPipeline.js: The core engine that powers the experience.
- assets/: (Optional) Any external 3D models or media.

## Customization
You can modify the style block in index.html to change the global appearance, or edit project.json to adjust the narrative flow.`;
