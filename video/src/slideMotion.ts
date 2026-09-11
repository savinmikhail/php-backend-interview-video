import type {CSSProperties} from 'react';
import {Easing, interpolate} from 'remotion';

export const enter = (frame: number): CSSProperties => ({
  opacity: interpolate(frame, [0, 12], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }),
  transform: `translateY(${interpolate(frame, [0, 14], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

export const reveal = (frame: number, delay: number): CSSProperties => ({
  opacity: interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }),
  transform: `translateY(${interpolate(frame, [delay, delay + 12], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })}px)`,
});
