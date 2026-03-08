import React, { useRef, useCallback, useMemo, useState } from 'react';
import { useStore } from '../../useStore';
import { Keyframe, StorySection, DOMSection } from '../../types';

type DragState = {
  type: 'move' | 'resize-left' | 'resize-right';
  trackType: 'beat' | 'dom';
  id: string;
  startX: number;
  startProgress: number;
  startExitProgress: number;
} | null;

export const ImprovedTimeline: React.FC = () => {
  const {
    currentProgress, setCurrentProgress, chapters, activeChapterId, mode,
    updateSection, updateDOMSection, addDOMSection, setSelectedDOMSection,
    selectedDOMSectionId, setSelectedKeyframe, selectedKeyframeId
  } = useStore();

  const activeChapter = useMemo(() =>
    chapters.find(c => c.id === activeChapterId),
    [chapters, activeChapterId]
  );

  const [dragState, setDragState] = useState<DragState>(null);

  if (!activeChapter || !activeChapter.modelUrl) return null;

  const keyframes = activeChapter.cameraPath;
  const beats = activeChapter.narrativeBeats;
  const domSections = activeChapter.domSections || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[110] px-6 pb-4 pointer-events-none flex items-end">
      <div className="w-full max-w-7xl mx-auto flex items-end gap-4">
        <div className="flex-1 pointer-events-auto">
          <div className="glass-panel rounded-2xl px-6 py-4 border border-white/10 shadow-2xl relative space-y-1">
            {/* Progress display */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass-panel px-3 py-1 rounded-lg border border-white/10 shadow-xl">
              <span className="text-[10px] font-bold text-emerald-400">{(currentProgress * 100).toFixed(1)}%</span>
            </div>

            {/* KEYFRAMES ROW */}
            <TimelineTrackRow
              label="Keyframes"
              color="blue"
              currentProgress={currentProgress}
              onSeek={setCurrentProgress}
            >
              {keyframes.map((kf) => (
                <div
                  key={kf.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedKeyframe(kf.id); setCurrentProgress(kf.progress); }}
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-5 rounded-sm cursor-pointer transition-all hover:scale-125 z-10 ${
                    kf.id === selectedKeyframeId ? 'bg-blue-400 ring-2 ring-blue-300' : 'bg-blue-500/80 hover:bg-blue-400'
                  }`}
                  style={{ left: `${kf.progress * 100}%`, transform: 'translate(-50%, -50%)' }}
                  title={`Keyframe @ ${(kf.progress * 100).toFixed(1)}%`}
                />
              ))}
            </TimelineTrackRow>

            {/* STORY BEATS ROW */}
            <TimelineTrackRow
              label="Story"
              color="purple"
              currentProgress={currentProgress}
              onSeek={setCurrentProgress}
              onAdd={() => {
                const event = new CustomEvent('add-story-beat');
                window.dispatchEvent(event);
              }}
            >
              {beats.map((beat, idx) => {
                const nextBeat = beats[idx + 1];
                const endProgress = nextBeat ? nextBeat.progress : Math.min(beat.progress + 0.1, 1);
                return (
                  <DraggableBar
                    key={beat.id}
                    id={beat.id}
                    trackType="beat"
                    progress={beat.progress}
                    exitProgress={endProgress}
                    color="purple"
                    label={beat.title || 'Beat'}
                    isSelected={false}
                    onSelect={() => setCurrentProgress(beat.progress)}
                    onMove={(newStart, newEnd) => {
                      updateSection(beat.id, { progress: newStart });
                    }}
                    onResizeLeft={(newStart) => {
                      updateSection(beat.id, { progress: newStart });
                    }}
                    onResizeRight={() => {/* beats don't have explicit exitProgress */}}
                  />
                );
              })}
            </TimelineTrackRow>

            {/* DOM SECTIONS ROW */}
            <TimelineTrackRow
              label="DOM"
              color="amber"
              currentProgress={currentProgress}
              onSeek={setCurrentProgress}
              onAdd={() => {
                if (activeChapterId) {
                  addDOMSection(activeChapterId);
                  // Will select via effect after add
                  setTimeout(() => {
                    const state = useStore.getState();
                    const ch = state.chapters.find(c => c.id === activeChapterId);
                    if (ch && ch.domSections.length > 0) {
                      const newest = ch.domSections.reduce((a, b) =>
                        Math.abs(b.progress - currentProgress) < Math.abs(a.progress - currentProgress) ? b : a
                      );
                      setSelectedDOMSection(newest.id);
                      window.dispatchEvent(new CustomEvent('open-layout-tab'));
                    }
                  }, 50);
                }
              }}
            >
              {domSections.map((ds) => (
                <DraggableBar
                  key={ds.id}
                  id={ds.id}
                  trackType="dom"
                  progress={ds.progress}
                  exitProgress={ds.exitProgress}
                  color="amber"
                  label={ds.headline || 'Section'}
                  isSelected={ds.id === selectedDOMSectionId}
                  onSelect={() => {
                    setSelectedDOMSection(ds.id);
                    setCurrentProgress(ds.progress);
                    window.dispatchEvent(new CustomEvent('open-layout-tab'));
                  }}
                  onMove={(newStart, newEnd) => {
                    updateDOMSection(ds.id, { progress: newStart, exitProgress: newEnd });
                  }}
                  onResizeLeft={(newStart) => {
                    updateDOMSection(ds.id, { progress: newStart });
                  }}
                  onResizeRight={(newEnd) => {
                    updateDOMSection(ds.id, { exitProgress: newEnd });
                  }}
                />
              ))}
            </TimelineTrackRow>

            {/* Chapter pills */}
            <div className="flex justify-end pt-1">
              <div className="flex gap-1.5">
                {chapters.map((c) => (
                  <div
                    key={c.id}
                    className={`w-6 h-1 rounded-full transition-all ${
                      c.id === activeChapterId
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {mode === 'edit' && (
          <div className="pointer-events-auto flex gap-2">
            <CaptureButton />
            <PlaybackButton />
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Track Row ----
const TimelineTrackRow: React.FC<{
  label: string;
  color: 'blue' | 'purple' | 'amber';
  currentProgress: number;
  onSeek: (p: number) => void;
  onAdd?: () => void;
  children: React.ReactNode;
}> = ({ label, color, currentProgress, onSeek, onAdd, children }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const colorMap = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', dot: 'bg-blue-400' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400', dot: 'bg-purple-400' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', dot: 'bg-amber-400' },
  };
  const c = colorMap[color];

  const handleClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    onSeek(progress);
  };

  return (
    <div className="flex items-center gap-2 h-7">
      <div className="flex items-center gap-1.5 shrink-0" style={{ width: onAdd ? '72px' : '80px' }}>
        <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span className={`text-[8px] font-bold uppercase tracking-wider ${c.text} opacity-70`}>{label}</span>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className={`w-5 h-5 rounded ${c.bg} text-white text-[10px] flex items-center justify-center hover:scale-110 transition-transform shrink-0`}
          title={`Add ${label}`}
        >
          +
        </button>
      )}
      <div
        ref={trackRef}
        onClick={handleClick}
        className="flex-1 h-5 bg-white/5 rounded relative cursor-crosshair overflow-visible"
      >
        {/* Playhead line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/60 z-20 pointer-events-none"
          style={{ left: `${currentProgress * 100}%` }}
        />
        {children}
      </div>
    </div>
  );
};

// ---- Draggable Bar ----
const DraggableBar: React.FC<{
  id: string;
  trackType: 'beat' | 'dom';
  progress: number;
  exitProgress: number;
  color: 'purple' | 'amber';
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newStart: number, newEnd: number) => void;
  onResizeLeft: (newStart: number) => void;
  onResizeRight: (newEnd: number) => void;
}> = ({ id, progress, exitProgress, color, label, isSelected, onSelect, onMove, onResizeLeft, onResizeRight }) => {
  const barRef = useRef<HTMLDivElement>(null);

  const colorMap = {
    purple: {
      bg: isSelected ? 'bg-purple-500/60' : 'bg-purple-500/30',
      border: isSelected ? 'border-purple-400' : 'border-purple-500/40',
      handle: 'bg-purple-300',
    },
    amber: {
      bg: isSelected ? 'bg-amber-500/60' : 'bg-amber-500/30',
      border: isSelected ? 'border-amber-400' : 'border-amber-500/40',
      handle: 'bg-amber-300',
    },
  };
  const c = colorMap[color];

  const left = `${progress * 100}%`;
  const width = `${Math.max((exitProgress - progress) * 100, 0.5)}%`;

  const getProgressFromMouseEvent = useCallback((e: MouseEvent | React.MouseEvent): number => {
    if (!barRef.current?.parentElement) return 0;
    const trackRect = barRef.current.parentElement.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - trackRect.left) / trackRect.width));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startP = progress;
    const startE = exitProgress;
    const duration = exitProgress - progress;

    const handleMouseMove = (ev: MouseEvent) => {
      const currentP = getProgressFromMouseEvent(ev);
      if (type === 'move') {
        const delta = currentP - getProgressFromMouseEvent({ clientX: startX, clientY: 0 } as any);
        let newStart = Math.max(0, Math.min(1 - duration, startP + delta));
        let newEnd = newStart + duration;
        onMove(newStart, newEnd);
      } else if (type === 'resize-left') {
        const newStart = Math.max(0, Math.min(exitProgress - 0.01, currentP));
        onResizeLeft(newStart);
      } else if (type === 'resize-right') {
        const newEnd = Math.max(progress + 0.01, Math.min(1, currentP));
        onResizeRight(newEnd);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [progress, exitProgress, onMove, onResizeLeft, onResizeRight, getProgressFromMouseEvent]);

  return (
    <div
      ref={barRef}
      className={`absolute top-0.5 bottom-0.5 rounded border ${c.bg} ${c.border} cursor-grab active:cursor-grabbing z-10 flex items-center group`}
      style={{ left, width }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Left handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize ${c.handle} opacity-0 group-hover:opacity-60 rounded-l transition-opacity`}
        onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
      />
      {/* Label */}
      <span className="text-[7px] font-bold text-white/80 truncate px-2 pointer-events-none select-none">
        {label}
      </span>
      {/* Right handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize ${c.handle} opacity-0 group-hover:opacity-60 rounded-r transition-opacity`}
        onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
      />
    </div>
  );
};

// ---- Buttons ----
const CaptureButton: React.FC = () => {
  const { currentProgress } = useStore();
  const onCapture = () => {
    window.dispatchEvent(new CustomEvent('capture-keyframe', { detail: { progress: currentProgress } }));
  };
  return (
    <button onClick={onCapture} className="group relative glass-panel w-16 h-16 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center transition-all hover:scale-105 hover:border-blue-500/50 active:scale-95">
      <i className="fa-solid fa-camera text-lg text-white/70 group-hover:text-blue-400 transition-colors mb-0.5"></i>
      <span className="text-[7px] font-bold uppercase tracking-wider text-white/40">Capture</span>
    </button>
  );
};

const PlaybackButton: React.FC = () => {
  const { setMode } = useStore();
  return (
    <button onClick={() => setMode('preview')} className="group relative glass-panel w-16 h-16 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center transition-all hover:scale-105 hover:border-purple-500/50 active:scale-95">
      <i className="fa-solid fa-play text-lg text-white/70 group-hover:text-purple-400 transition-colors mb-0.5"></i>
      <span className="text-[7px] font-bold uppercase tracking-wider text-white/40">Preview</span>
    </button>
  );
};
