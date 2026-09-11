import type {Caption} from '@remotion/captions';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Props = {
  src: string;
};

const isCaption = (value: unknown): value is Caption => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Caption>;
  return typeof candidate.text === 'string'
    && typeof candidate.startMs === 'number'
    && typeof candidate.endMs === 'number'
    && candidate.endMs > candidate.startMs;
};

const findCaption = (captions: Caption[], timeMs: number) => {
  let lower = 0;
  let upper = captions.length - 1;
  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2);
    const caption = captions[middle];
    if (timeMs < caption.startMs) upper = middle - 1;
    else if (timeMs >= caption.endMs) lower = middle + 1;
    else return caption;
  }
  return null;
};

export const CaptionOverlay = ({src}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`Loading review captions: ${src}`));

  const loadCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile(src));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload) || !payload.every(isCaption)) {
        throw new Error('invalid Caption[] JSON');
      }
      setCaptions(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      continueRender(handle);
    }
  }, [handle, src]);

  useEffect(() => {
    loadCaptions();
  }, [loadCaptions]);

  const activeCaption = useMemo(
    () => captions ? findCaption(captions, frame / fps * 1000) : null,
    [captions, fps, frame],
  );

  if (error) {
    return (
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
        <div style={{marginBottom: 48, padding: '10px 16px', borderRadius: 10, background: 'rgba(130, 20, 45, .92)', fontFamily: 'Inter, Arial, sans-serif', fontSize: 22}}>
          Субтитры не загружены: {error}
        </div>
      </AbsoluteFill>
    );
  }

  if (!activeCaption) return null;

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none', zIndex: 1000}}>
      <div
        style={{
          maxWidth: 1520,
          margin: '0 80px 52px',
          padding: '14px 24px 16px',
          borderRadius: 14,
          background: 'rgba(0, 0, 0, .82)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, .35)',
          color: '#fff',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: 42,
          fontWeight: 650,
          lineHeight: 1.22,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, .9)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {activeCaption.text}
      </div>
    </AbsoluteFill>
  );
};
