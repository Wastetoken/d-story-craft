import { DOMSectionFontVariant, DOMSectionLayout } from './types';

export const FONT_VARIANT_MAP: Record<DOMSectionFontVariant, {
  googleFontUrl: string;
  fontFamily: string;
  headingWeight: string;
  bodyWeight: string;
}> = {
  display:  { googleFontUrl: 'Bebas+Neue', fontFamily: "'Bebas Neue', sans-serif", headingWeight: '400', bodyWeight: '400' },
  sans:     { googleFontUrl: 'Inter:wght@300;400;700;900', fontFamily: "'Inter', sans-serif", headingWeight: '900', bodyWeight: '300' },
  mono:     { googleFontUrl: 'JetBrains+Mono:wght@300;400;700', fontFamily: "'JetBrains Mono', monospace", headingWeight: '700', bodyWeight: '300' },
  serif:    { googleFontUrl: 'Playfair+Display:wght@400;700;900', fontFamily: "'Playfair Display', serif", headingWeight: '700', bodyWeight: '400' },
};

export const LAYOUT_CSS_MAP: Record<DOMSectionLayout, string> = {
  'left':          'align-items: flex-start; justify-content: center; padding-left: 8vw;',
  'right':         'align-items: flex-end;   justify-content: center; padding-right: 8vw;',
  'center':        'align-items: center;     justify-content: center;',
  'bottom-left':   'align-items: flex-start; justify-content: flex-end; padding-left: 8vw;  padding-bottom: 8vh;',
  'bottom-right':  'align-items: flex-end;   justify-content: flex-end; padding-right: 8vw; padding-bottom: 8vh;',
  'bottom-center': 'align-items: center;     justify-content: flex-end; padding-bottom: 8vh;',
};

// Tailwind-compatible layout classes for live preview
export const LAYOUT_CLASSES_MAP: Record<DOMSectionLayout, string> = {
  'left':          'items-start justify-center pl-[8vw]',
  'right':         'items-end justify-center pr-[8vw]',
  'center':        'items-center justify-center',
  'bottom-left':   'items-start justify-end pl-[8vw] pb-[8vh]',
  'bottom-right':  'items-end justify-end pr-[8vw] pb-[8vh]',
  'bottom-center': 'items-center justify-end pb-[8vh]',
};
