import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../../useStore';
import { DOMSection } from '../../types';
import { FONT_VARIANT_MAP, LAYOUT_CLASSES_MAP } from '../../domSectionConstants';

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
    const interval = setInterval(updateRect, 500);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [updateRect]);

  if (!rect) return null;

  const size = 20;
  const stroke = 2;
  const color = 'rgba(255,255,255,0.6)';

  const brackets = [
    // Top-left
    { x: rect.left, y: rect.top, rotate: 0 },
    // Top-right
    { x: rect.right, y: rect.top, rotate: 90 },
    // Bottom-right
    { x: rect.right, y: rect.bottom, rotate: 180 },
    // Bottom-left
    { x: rect.left, y: rect.bottom, rotate: 270 },
  ];

  return (
    <>
      {brackets.map((b, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          style={{
            position: 'fixed',
            left: b.x - (i === 0 || i === 3 ? size : 0),
            top: b.y - (i === 0 || i === 1 ? size : 0),
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          <path
            d={
              i === 0 ? `M${size},0 L0,0 L0,${size}` :
              i === 1 ? `M0,0 L${size},0 L${size},${size}` :
              i === 2 ? `M${size},0 L${size},${size} L0,${size}` :
              `M0,0 L0,${size} L${size},${size}`
            }
            fill="none"
            stroke={color}
            strokeWidth={stroke}
          />
        </svg>
      ))}
    </>
  );
};

export const DOMSectionPreview: React.FC = () => {
  const { mode, currentProgress, chapters, activeChapterId } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const activeChapter = useMemo(() => {
    if (mode === 'edit') return chapters.find(c => c.id === activeChapterId);
    return chapters.find(c => currentProgress >= c.startProgress && currentProgress <= c.endProgress) || chapters[0];
  }, [mode, chapters, activeChapterId, currentProgress]);

  const activeSection: DOMSection | null = useMemo(() => {
    if (!activeChapter) return null;
    const sections = activeChapter.domSections || [];
    return sections.find(s => currentProgress >= s.progress && currentProgress < s.exitProgress) || null;
  }, [activeChapter, currentProgress]);

  if (mode !== 'edit' || !activeSection) return null;

  const section = activeSection;
  const font = FONT_VARIANT_MAP[section.fontVariant];
  const layoutClasses = LAYOUT_CLASSES_MAP[section.layout];

  const cardBg = (() => {
    if (section.cardStyle === 'none') return 'transparent';
    if (section.cardStyle === 'glass') return `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
    if (section.cardStyle === 'solid') return `rgba(${hexToRgb(section.backgroundColor)}, ${section.backgroundOpacity})`;
    return 'transparent';
  })();

  const cardBorder = section.cardStyle === 'outline' ? `2px solid ${section.accentColor}` : 'none';
  const backdropFilter = section.cardStyle === 'glass' ? 'blur(20px)' : 'none';

  return (
    <>
      <div
        className={`fixed inset-0 flex flex-col ${layoutClasses} pointer-events-none`}
        style={{ zIndex: 55, opacity: 0.6 }}
      >
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
          {/* PREVIEW badge */}
          <div
            className="absolute top-2 right-2 px-2 py-1 text-[8px] font-bold uppercase tracking-widest border border-dashed border-white/60 rounded text-white"
            style={{ opacity: 1 }}
          >
            PREVIEW
          </div>

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
      <SafeZoneBrackets cardRef={cardRef} />
    </>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '128, 128, 128';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
