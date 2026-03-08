import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../../useStore';
import { DOMSection, PageChrome } from '../../types';
import { FONT_VARIANT_MAP, LAYOUT_CLASSES_MAP } from '../../domSectionConstants';
import { DEFAULT_PAGE_CHROME } from '../../useStore';

// ---- Safe Zone Brackets ----
const SafeZoneBrackets: React.FC<{ cardRef: React.RefObject<HTMLDivElement | null> }> = ({ cardRef }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    if (cardRef.current) {
      setRect(cardRef.current.getBoundingClientRect());
    }
  }, [cardRef]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    const interval = setInterval(updateRect, 200);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [updateRect]);

  if (!rect) return null;

  const size = 24;
  const stroke = 2.5;
  const color = 'rgba(255,255,255,0.9)';

  const corners = [
    { x: rect.left, y: rect.top, d: `M${size},0 L0,0 L0,${size}` },
    { x: rect.right, y: rect.top, d: `M0,0 L${size},0 L${size},${size}` },
    { x: rect.right, y: rect.bottom, d: `M${size},0 L${size},${size} L0,${size}` },
    { x: rect.left, y: rect.bottom, d: `M0,0 L0,${size} L${size},${size}` },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          style={{
            position: 'fixed',
            left: c.x - (i === 0 || i === 3 ? size : 0),
            top: c.y - (i === 0 || i === 1 ? size : 0),
            pointerEvents: 'none',
            zIndex: 61,
          }}
        >
          <path d={c.d} fill="none" stroke={color} strokeWidth={stroke} />
        </svg>
      ))}
    </>
  );
};

// ---- Scroll Behavior HUD ----
const ScrollBehaviorHUD: React.FC<{ section: DOMSection }> = ({ section }) => {
  const { updateDOMSection } = useStore();

  const toggles: { key: keyof Pick<DOMSection, 'verticalScroll' | 'horizontalScroll' | 'pin'>; label: string; icon: string }[] = [
    { key: 'verticalScroll', label: 'V-Scroll', icon: 'fa-arrows-up-down' },
    { key: 'horizontalScroll', label: 'H-Scroll', icon: 'fa-arrows-left-right' },
    { key: 'pin', label: 'Pin', icon: 'fa-thumbtack' },
  ];

  return (
    <div className="fixed top-6 right-6 z-[200] pointer-events-auto">
      <div className="glass-panel rounded-xl border border-white/10 shadow-2xl p-3 space-y-2 min-w-[160px]">
        <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Scroll Behavior</div>
        {toggles.map(t => (
          <div key={t.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className={`fa-solid ${t.icon} text-[10px] text-white/40`} />
              <span className="text-[10px] text-white/70 font-bold">{t.label}</span>
            </div>
            <button
              onClick={() => updateDOMSection(section.id, { [t.key]: !section[t.key] })}
              className={`w-8 h-4 rounded-full transition-colors relative ${(section[t.key] as boolean) ? 'bg-amber-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${(section[t.key] as boolean) ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
        {/* Scroll direction */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <span className="text-[10px] text-white/70 font-bold">Direction</span>
          <div className="flex gap-1">
            {(['vertical', 'horizontal'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => updateDOMSection(section.id, { scrollDirection: dir })}
                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                  section.scrollDirection === dir
                    ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                    : 'bg-white/5 text-white/40 border border-white/10'
                }`}
              >
                {dir === 'vertical' ? 'V' : 'H'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- hexToRgb util ----
function hexToRgb(hex: string): string {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!result) return '128, 128, 128';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ---- Main Preview ----
export const DOMSectionPreview: React.FC = () => {
  const { mode, currentProgress, chapters, activeChapterId, selectedDOMSectionId } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const activeChapter = useMemo(() => {
    if (mode === 'edit') return chapters.find(c => c.id === activeChapterId);
    return chapters.find(c => currentProgress >= c.startProgress && currentProgress <= c.endProgress) || chapters[0];
  }, [mode, chapters, activeChapterId, currentProgress]);

  const chrome: PageChrome = activeChapter?.pageChrome || DEFAULT_PAGE_CHROME;

  const activeSection: DOMSection | null = useMemo(() => {
    if (!activeChapter) return null;
    const sections = activeChapter.domSections || [];
    // If a section is selected, show it. Otherwise show the one at current progress.
    if (selectedDOMSectionId) {
      const sel = sections.find(s => s.id === selectedDOMSectionId);
      if (sel) return sel;
    }
    return sections.find(s => currentProgress >= s.progress && currentProgress < s.exitProgress) || null;
  }, [activeChapter, currentProgress, selectedDOMSectionId]);

  if (mode !== 'edit') return null;
  // Always show the overlay frame when in edit mode with a chapter loaded
  if (!activeChapter) return null;

  const section = activeSection;
  const font = section ? FONT_VARIANT_MAP[section.fontVariant] : null;
  const layoutClasses = section ? LAYOUT_CLASSES_MAP[section.layout] : '';

  const cardBg = (() => {
    if (!section || section.cardStyle === 'none') return 'transparent';
    if (section.cardStyle === 'glass' || section.cardStyle === 'solid')
      return `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
    return 'transparent';
  })();

  const cardBorder = section?.cardStyle === 'outline' ? `2px solid ${section.accentColor}` : 'none';
  const backdropFilter = section?.cardStyle === 'glass' ? 'blur(20px)' : 'none';

  return (
    <>
      {/* Full viewport overlay - transparent to show 3D canvas through */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 50,
          background: `rgba(${hexToRgb(chrome.pageBackgroundColor)}, 0.08)`,
        }}
      >
        {/* Nav preview */}
        {chrome.showNav && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-between items-center px-12 py-6"
            style={{
              background: `rgba(${hexToRgb(chrome.navBackgroundColor)}, ${chrome.navBackgroundOpacity})`,
              color: chrome.navTextColor,
              zIndex: 52,
            }}
          >
            <span className="font-bold text-sm">{chrome.navTitle || ''}</span>
          </div>
        )}

        {/* Progress bar preview */}
        {chrome.showProgressBar && (
          <div
            className="absolute top-0 left-0 h-[3px]"
            style={{
              width: `${currentProgress * 100}%`,
              background: chrome.progressBarColor,
              zIndex: 53,
            }}
          />
        )}

        {/* DOM Section content card */}
        {section && font && (
          <div className={`absolute inset-0 flex flex-col ${layoutClasses}`}>
            <div
              ref={cardRef}
              className="max-w-lg p-8 rounded-2xl relative"
              style={{
                background: cardBg,
                border: cardBorder,
                backdropFilter,
                fontFamily: font.fontFamily,
                color: section.textColor,
              }}
            >
              {section.headline && (
                <h2 className="text-4xl mb-3" style={{ fontWeight: font.headingWeight, color: section.textColor }}>
                  {section.headline}
                </h2>
              )}
              {section.subheading && (
                <h3 className="text-xl mb-3" style={{ fontWeight: font.bodyWeight, color: section.textColor, opacity: 0.8 }}>
                  {section.subheading}
                </h3>
              )}
              {section.bodyText && (
                <p className="text-sm leading-relaxed mb-4" style={{ fontWeight: font.bodyWeight, color: section.textColor, opacity: 0.7 }}>
                  {section.bodyText}
                </p>
              )}
              {section.buttonLabel && (
                <span
                  className="inline-block px-6 py-2 text-xs font-bold uppercase rounded-lg"
                  style={{ backgroundColor: section.accentColor, color: section.backgroundColor }}
                >
                  {section.buttonLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer preview */}
        {chrome.showFooter && (
          <div
            className="absolute bottom-0 left-0 right-0 text-center py-6 px-8"
            style={{
              color: chrome.footerTextColor,
              background: chrome.footerBackgroundColor,
              zIndex: 52,
            }}
          >
            <span className="text-sm">{chrome.footerText}</span>
          </div>
        )}
      </div>

      {/* Safe zone brackets on the card */}
      {section && <SafeZoneBrackets cardRef={cardRef} />}

      {/* Scroll behavior HUD */}
      {section && <ScrollBehaviorHUD section={section} />}
    </>
  );
};
