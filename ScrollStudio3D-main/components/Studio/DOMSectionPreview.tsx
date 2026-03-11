import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../../useStore';
import { DOMSection, PageChrome, DOMSectionCardStyle, DOMSectionFontVariant } from '../../types';
import { FONT_VARIANT_MAP } from '../../domSectionConstants';
import { DEFAULT_PAGE_CHROME } from '../../useStore';

// ---- hexToRgb util ----
function hexToRgb(hex: string): string {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!result) return '128, 128, 128';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ---- Viewport Safe Zone Frame ----
// Always visible in edit mode. Shows the exact viewport boundary that maps to the preview/export.
// Anything outside this frame will not appear in the final output.
const ViewportSafeZone: React.FC = () => {
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const update = () => setBounds({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const size = 28;
  const stroke = 2;
  const color = 'rgba(255,255,255,0.5)';
  const inset = 12; // px inset from viewport edges
  const corners = [
    { x: inset, y: inset, d: `M${size},0 L0,0 L0,${size}` },
    { x: bounds.w - inset, y: inset, d: `M0,0 L${size},0 L${size},${size}` },
    { x: bounds.w - inset, y: bounds.h - inset, d: `M${size},0 L${size},${size} L0,${size}` },
    { x: inset, y: bounds.h - inset, d: `M0,0 L0,${size} L${size},${size}` },
  ];

  return (
    <>
      {/* Corner brackets */}
      {corners.map((c, i) => (
        <svg key={i} width={size} height={size} style={{
          position: 'fixed',
          left: i === 0 || i === 3 ? c.x : c.x - size,
          top: i === 0 || i === 1 ? c.y : c.y - size,
          pointerEvents: 'none', zIndex: 61,
        }}>
          <path d={c.d} fill="none" stroke={color} strokeWidth={stroke} />
        </svg>
      ))}
      {/* "SAFE ZONE" label */}
      <div style={{
        position: 'fixed',
        bottom: inset + 6,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 61,
      }}>
        <span style={{
          fontSize: '8px',
          fontWeight: 800,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
        }}>
          Safe Zone
        </span>
      </div>
    </>
  );
};

// ---- Element Selection Brackets ----
const SelectionBrackets: React.FC<{ sectionId: string }> = ({ sectionId }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLDivElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    const interval = setInterval(update, 200);
    window.addEventListener('resize', update);
    return () => { clearInterval(interval); window.removeEventListener('resize', update); };
  }, [sectionId]);

  if (!rect) return null;
  const size = 20;
  const stroke = 2;
  const color = 'rgba(245,158,11,0.7)';
  const corners = [
    { x: rect.left, y: rect.top, d: `M${size},0 L0,0 L0,${size}` },
    { x: rect.right, y: rect.top, d: `M0,0 L${size},0 L${size},${size}` },
    { x: rect.right, y: rect.bottom, d: `M${size},0 L${size},${size} L0,${size}` },
    { x: rect.left, y: rect.bottom, d: `M0,0 L0,${size} L${size},${size}` },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <svg key={i} width={size} height={size} style={{
          position: 'fixed',
          left: c.x - (i === 0 || i === 3 ? size : 0),
          top: c.y - (i === 0 || i === 1 ? size : 0),
          pointerEvents: 'none', zIndex: 61,
        }}>
          <path d={c.d} fill="none" stroke={color} strokeWidth={stroke} />
        </svg>
      ))}
    </>
  );
};

// ---- Scroll Behavior HUD ----
const ScrollBehaviorHUD: React.FC<{ section: DOMSection }> = ({ section }) => {
  const { updateDOMSection } = useStore();

  const setScrollDir = (dir: 'vertical' | 'horizontal') => {
    updateDOMSection(section.id, {
      verticalScroll: dir === 'vertical',
      horizontalScroll: dir === 'horizontal',
      scrollDirection: dir,
    });
  };

  return (
    <div className="fixed top-6 right-6 z-[200] pointer-events-auto">
      <div className="glass-panel rounded-xl border border-white/10 shadow-2xl p-3 space-y-2 min-w-[160px]">
        <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Scroll Behavior</div>
        {/* Scroll direction — mutually exclusive */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70 font-bold">Direction</span>
          <div className="flex gap-1">
            {(['vertical', 'horizontal'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => setScrollDir(dir)}
                className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase transition-all ${
                  section.scrollDirection === dir
                    ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {dir === 'vertical' ? 'Vertical' : 'Horizontal'}
              </button>
            ))}
          </div>
        </div>
        {/* Pin — independent toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-thumbtack text-[10px] text-white/40" />
            <span className="text-[10px] text-white/70 font-bold">Pin</span>
          </div>
          <button
            onClick={() => updateDOMSection(section.id, { pin: !section.pin })}
            className={`w-8 h-4 rounded-full transition-colors relative ${section.pin ? 'bg-amber-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${section.pin ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Floating Properties Panel ----
const CARD_STYLES: DOMSectionCardStyle[] = ['glass', 'solid', 'outline', 'none'];
const FONT_VARIANTS: DOMSectionFontVariant[] = ['display', 'sans', 'mono', 'serif'];

const FloatingPropertiesPanel: React.FC<{ section: DOMSection; anchorRect: DOMRect | null }> = ({ section, anchorRect }) => {
  const { updateDOMSection, removeDOMSection, setSelectedDOMSection } = useStore();

  // Position below the element if space, above if near bottom
  const style: React.CSSProperties = useMemo(() => {
    if (!anchorRect) return { display: 'none' };
    const below = anchorRect.bottom + 8;
    const above = anchorRect.top - 260;
    const top = below + 250 < window.innerHeight ? below : Math.max(8, above);
    return {
      position: 'fixed',
      left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 320)),
      top,
      zIndex: 200,
    };
  }, [anchorRect]);

  return (
    <div style={style} className="pointer-events-auto w-[300px]">
      <div className="glass-panel rounded-xl border border-amber-500/30 shadow-2xl p-3 space-y-3">
        {/* Card Style */}
        <div>
          <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Card Style</div>
          <div className="flex gap-1">
            {CARD_STYLES.map(s => (
              <button key={s} onClick={() => updateDOMSection(section.id, { cardStyle: s })}
                className={`flex-1 py-1 rounded text-[8px] font-bold uppercase transition-all ${
                  section.cardStyle === s ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-white/40 border border-white/10'
                }`}>{s}</button>
            ))}
          </div>
        </div>
        {/* Font */}
        <div>
          <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Font</div>
          <div className="flex gap-1">
            {FONT_VARIANTS.map(f => (
              <button key={f} onClick={() => updateDOMSection(section.id, { fontVariant: f })}
                className={`flex-1 py-1 rounded text-[8px] font-bold uppercase transition-all ${
                  section.fontVariant === f ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-white/40 border border-white/10'
                }`}>{f}</button>
            ))}
          </div>
        </div>
        {/* Colors */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <input type="color" value={section.textColor} onChange={e => updateDOMSection(section.id, { textColor: e.target.value })} className="w-6 h-6 rounded border-none cursor-pointer" />
            <span className="text-[7px] text-white/40">Text</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <input type="color" value={section.backgroundColor} onChange={e => updateDOMSection(section.id, { backgroundColor: e.target.value })} className="w-6 h-6 rounded border-none cursor-pointer" />
            <span className="text-[7px] text-white/40">Bg</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <input type="color" value={section.accentColor} onChange={e => updateDOMSection(section.id, { accentColor: e.target.value })} className="w-6 h-6 rounded border-none cursor-pointer" />
            <span className="text-[7px] text-white/40">Accent</span>
          </div>
          {section.cardStyle !== 'none' && (
            <div className="flex-1 ml-2">
              <div className="text-[7px] text-white/40 mb-0.5">Opacity {section.backgroundOpacity.toFixed(2)}</div>
              <input type="range" min="0" max="1" step="0.01" value={section.backgroundOpacity}
                onChange={e => updateDOMSection(section.id, { backgroundOpacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/10 rounded-full appearance-none accent-amber-500" />
            </div>
          )}
        </div>
        {/* Delete */}
        <button
          onClick={() => { removeDOMSection(section.id); setSelectedDOMSection(null); }}
          className="w-full py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-wider transition-all"
        >
          <i className="fa-solid fa-trash mr-1"></i> Delete Section
        </button>
      </div>
    </div>
  );
};

// ---- Canvas Section Element ----
const CanvasSectionElement: React.FC<{
  section: DOMSection;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
}> = ({ section, isSelected, isEditMode, onSelect }) => {
  const { updateDOMSection } = useStore();
  const elRef = useRef<HTMLDivElement>(null);
  const font = FONT_VARIANT_MAP[section.fontVariant];

  const cardBg = (() => {
    if (section.cardStyle === 'none') return 'transparent';
    if (section.cardStyle === 'glass' || section.cardStyle === 'solid')
      return `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
    return 'transparent';
  })();
  const cardBorder = section.cardStyle === 'outline' ? `2px solid ${section.accentColor}` : 'none';
  const backdropFilter = section.cardStyle === 'glass' ? 'blur(20px)' : 'none';

  // ---- Drag to move ----
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSX = section.x;
    const startSY = section.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / window.innerWidth) * 100;
      const dy = ((ev.clientY - startY) / window.innerHeight) * 100;
      updateDOMSection(section.id, {
        x: Math.max(0, Math.min(100 - section.width, startSX + dx)),
        y: Math.max(0, Math.min(95, startSY + dy)),
      });
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [isEditMode, section.id, section.x, section.y, section.width, updateDOMSection, onSelect]);

  // ---- Resize handles ----
  const handleResize = useCallback((e: React.MouseEvent, edge: 'right' | 'bottom' | 'corner') => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = section.width;
    const startH = section.height;

    const onMove = (ev: MouseEvent) => {
      const dxPct = ((ev.clientX - startX) / window.innerWidth) * 100;
      const dyPct = ((ev.clientY - startY) / window.innerHeight) * 100;
      if (edge === 'right' || edge === 'corner') {
        updateDOMSection(section.id, { width: Math.max(10, Math.min(100 - section.x, startW + dxPct)) });
      }
      if (edge === 'bottom' || edge === 'corner') {
        updateDOMSection(section.id, { height: Math.max(10, Math.min(100 - section.y, startH + dyPct)) });
      }
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [isEditMode, section.id, section.x, section.y, section.width, section.height, updateDOMSection]);

  // ---- Inline text editing ----
  const handleTextBlur = useCallback((field: 'headline' | 'subheading' | 'bodyText', e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent || '';
    updateDOMSection(section.id, { [field]: text });
  }, [section.id, updateDOMSection]);

  return (
    <div
      ref={elRef}
      data-section-id={section.id}
      className={`absolute transition-shadow ${isEditMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        left: `${section.x}%`,
        top: `${section.y}%`,
        width: `${section.width}%`,
        minHeight: `${section.height}%`,
        outline: isSelected ? '2px solid rgba(245,158,11,0.7)' : 'none',
        outlineOffset: '4px',
      }}
      onMouseDown={isEditMode ? handleDragStart : undefined}
      onClick={(e) => { e.stopPropagation(); if (isEditMode) onSelect(); }}
    >
      <div
        className="w-full h-full p-8 rounded-2xl"
        style={{
          background: cardBg,
          border: cardBorder,
          backdropFilter,
          fontFamily: font.fontFamily,
          color: section.textColor,
          cursor: isEditMode ? 'grab' : 'default',
        }}
      >
        {/* Headline */}
        <h2
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleTextBlur('headline', e)}
          className="text-4xl mb-3 outline-none focus:ring-1 focus:ring-amber-500/30 focus:rounded"
          style={{ fontWeight: font.headingWeight, color: section.textColor, cursor: isEditMode ? 'text' : 'default' }}
        >
          {section.headline}
        </h2>
        {/* Subheading */}
        <h3
          contentEditable={isEditMode}
          suppressContentEditableWarning
          onBlur={(e) => handleTextBlur('subheading', e)}
          className="text-xl mb-3 outline-none focus:ring-1 focus:ring-amber-500/30 focus:rounded"
          style={{ fontWeight: font.bodyWeight, color: section.textColor, opacity: 0.8, cursor: isEditMode ? 'text' : 'default' }}
        >
          {section.subheading}
        </h3>
        {/* Body */}
        {(section.bodyText || isEditMode) && (
          <p
            contentEditable={isEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleTextBlur('bodyText', e)}
            className="text-sm leading-relaxed mb-4 outline-none focus:ring-1 focus:ring-amber-500/30 focus:rounded"
            style={{ fontWeight: font.bodyWeight, color: section.textColor, opacity: 0.7, cursor: isEditMode ? 'text' : 'default', minHeight: isEditMode ? '1.5em' : undefined }}
          >
            {section.bodyText || (isEditMode ? 'Body text...' : '')}
          </p>
        )}
        {/* Button */}
        {section.buttonLabel && (
          <span className="inline-block px-6 py-2 text-xs font-bold uppercase rounded-lg"
            style={{ backgroundColor: section.accentColor, color: section.backgroundColor }}>
            {section.buttonLabel}
          </span>
        )}
      </div>

      {/* Resize handles (edit mode only, selected only) */}
      {isEditMode && isSelected && (
        <>
          {/* Right edge */}
          <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-amber-500/20 transition-colors"
            onMouseDown={(e) => handleResize(e, 'right')} />
          {/* Bottom edge */}
          <div className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-amber-500/20 transition-colors"
            onMouseDown={(e) => handleResize(e, 'bottom')} />
          {/* Corner */}
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-amber-500/40 rounded-tl-lg hover:bg-amber-500/60 transition-colors"
            onMouseDown={(e) => handleResize(e, 'corner')} />
        </>
      )}
    </div>
  );
};

// ---- Main Preview ----
export const DOMSectionPreview: React.FC = () => {
  const { mode, currentProgress, chapters, activeChapterId, selectedDOMSectionId, setSelectedDOMSection } = useStore();
  const selectedElRef = useRef<HTMLDivElement>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);

  const activeChapter = useMemo(() => {
    if (mode === 'edit') return chapters.find(c => c.id === activeChapterId);
    return chapters.find(c => currentProgress >= c.startProgress && currentProgress <= c.endProgress) || chapters[0];
  }, [mode, chapters, activeChapterId, currentProgress]);

  const chrome: PageChrome = activeChapter?.pageChrome || DEFAULT_PAGE_CHROME;
  const allSections = activeChapter?.domSections || [];

  // In preview mode, only show sections at current progress
  const visibleSections = useMemo(() => {
    if (mode === 'edit') return allSections;
    return allSections.filter(s => currentProgress >= s.progress && currentProgress < s.exitProgress);
  }, [mode, allSections, currentProgress]);

  const selectedSection = useMemo(() => {
    if (!selectedDOMSectionId) return null;
    return allSections.find(s => s.id === selectedDOMSectionId) || null;
  }, [selectedDOMSectionId, allSections]);

  // Track selected element rect for properties panel and brackets
  useEffect(() => {
    if (!selectedDOMSectionId) { setSelectedRect(null); return; }
    const update = () => {
      const el = document.querySelector(`[data-section-id="${selectedDOMSectionId}"]`) as HTMLDivElement | null;
      if (el) setSelectedRect(el.getBoundingClientRect());
    };
    update();
    const interval = setInterval(update, 200);
    window.addEventListener('resize', update);
    return () => { clearInterval(interval); window.removeEventListener('resize', update); };
  }, [selectedDOMSectionId]);

  if (!activeChapter) return null;

  const isEdit = mode === 'edit';

  // In preview mode: show sections whose progress range includes currentProgress
  // Section visibility in edit mode: show all but dim non-active ones
  const isInRange = (s: DOMSection) => currentProgress >= s.progress && currentProgress < s.exitProgress;

  return (
    <>
      {/* Full viewport overlay */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 50,
          background: `rgba(${hexToRgb(chrome.pageBackgroundColor)}, 0.08)`,
          pointerEvents: 'none',
        }}
        onClick={() => { if (isEdit) setSelectedDOMSection(null); }}
      >
        {/* Nav preview */}
        {chrome.showNav && (
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-12 py-6"
            style={{ background: `rgba(${hexToRgb(chrome.navBackgroundColor)}, ${chrome.navBackgroundOpacity})`, color: chrome.navTextColor, zIndex: 52 }}>
            <span className="font-bold text-sm">{chrome.navTitle || ''}</span>
          </div>
        )}

        {/* Progress bar preview */}
        {chrome.showProgressBar && (
          <div className="absolute top-0 left-0 h-[3px]"
            style={{ width: `${currentProgress * 100}%`, background: chrome.progressBarColor, zIndex: 53 }} />
        )}

        {/* DOM Section elements */}
        {visibleSections.map(section => (
          <CanvasSectionElement
            key={section.id}
            section={section}
            isSelected={section.id === selectedDOMSectionId}
            isEditMode={isEdit}
            onSelect={() => setSelectedDOMSection(section.id)}
          />
        ))}

        {/* Footer preview */}
        {chrome.showFooter && (
          <div className="absolute bottom-0 left-0 right-0 text-center py-6 px-8"
            style={{ color: chrome.footerTextColor, background: chrome.footerBackgroundColor, zIndex: 52 }}>
            <span className="text-sm">{chrome.footerText}</span>
          </div>
        )}
      </div>

      {/* Safe zone brackets on selected element */}
      {isEdit && selectedSection && selectedRect && (
        <SafeZoneBrackets targetRef={{ current: document.querySelector(`[data-section-id="${selectedDOMSectionId}"]`) as HTMLDivElement | null }} />
      )}

      {/* Floating properties panel */}
      {isEdit && selectedSection && (
        <FloatingPropertiesPanel section={selectedSection} anchorRect={selectedRect} />
      )}

      {/* Scroll behavior HUD */}
      {isEdit && selectedSection && <ScrollBehaviorHUD section={selectedSection} />}
    </>
  );
};
