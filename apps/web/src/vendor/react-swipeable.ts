import { useCallback, useMemo, useRef } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

export type SwipeDirection = 'Left' | 'Right' | 'Up' | 'Down';

export type SwipeEventData = {
  event: ReactPointerEvent<Element> | ReactTouchEvent<Element>;
  deltaX: number;
  deltaY: number;
  absX: number;
  absY: number;
  velocity: number;
  dir: SwipeDirection;
};

export type SwipeCallback = (eventData: SwipeEventData) => void;

export type SwipeableConfig = {
  onSwiped?: SwipeCallback;
  onSwipedLeft?: SwipeCallback;
  onSwipedRight?: SwipeCallback;
  onSwipedUp?: SwipeCallback;
  onSwipedDown?: SwipeCallback;
  delta?: number;
  preventScrollOnSwipe?: boolean;
  trackTouch?: boolean;
  trackMouse?: boolean;
  touchEventOptions?: AddEventListenerOptions;
  rotationAngle?: number;
};

export type SwipeableHandlers = {
  onTouchStart?: (event: ReactTouchEvent<Element>) => void;
  onTouchMove?: (event: ReactTouchEvent<Element>) => void;
  onTouchEnd?: (event: ReactTouchEvent<Element>) => void;
  onTouchCancel?: (event: ReactTouchEvent<Element>) => void;
  onPointerDown?: (event: ReactPointerEvent<Element>) => void;
  onPointerMove?: (event: ReactPointerEvent<Element>) => void;
  onPointerUp?: (event: ReactPointerEvent<Element>) => void;
  onPointerCancel?: (event: ReactPointerEvent<Element>) => void;
};

type SwipeState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
  isVerticalScroll: boolean;
};

const DEFAULT_CONFIG: Required<
  Pick<
    SwipeableConfig,
    'delta' | 'preventScrollOnSwipe' | 'trackTouch' | 'trackMouse' | 'rotationAngle'
  >
> = {
  delta: 10,
  preventScrollOnSwipe: false,
  trackTouch: true,
  trackMouse: false,
  rotationAngle: 0,
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const useSwipeable = (config: SwipeableConfig): SwipeableHandlers => {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  configRef.current = { ...DEFAULT_CONFIG, ...config };

  const stateRef = useRef<SwipeState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    isVerticalScroll: false,
  });

  const resetState = useCallback(() => {
    stateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      isSwiping: false,
      isVerticalScroll: false,
    };
  }, []);

  const triggerSwipe = useCallback(
    (
      event: ReactPointerEvent<Element> | ReactTouchEvent<Element>,
      deltaX: number,
      deltaY: number,
    ) => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const duration = Math.max(1, now() - stateRef.current.startTime);
      const velocity = Math.sqrt(absX * absX + absY * absY) / duration;
      let dir: SwipeDirection = 'Left';

      if (absX > absY) {
        dir = deltaX > 0 ? 'Right' : 'Left';
      } else {
        dir = deltaY > 0 ? 'Down' : 'Up';
      }

      const eventData: SwipeEventData = {
        event,
        deltaX,
        deltaY,
        absX,
        absY,
        velocity,
        dir,
      };

      const cfg = configRef.current;
      cfg.onSwiped?.(eventData);
      switch (dir) {
        case 'Left':
          cfg.onSwipedLeft?.(eventData);
          break;
        case 'Right':
          cfg.onSwipedRight?.(eventData);
          break;
        case 'Up':
          cfg.onSwipedUp?.(eventData);
          break;
        case 'Down':
          cfg.onSwipedDown?.(eventData);
          break;
      }
    },
    [],
  );

  const startTracking = useCallback((x: number, y: number, pointerId: number | null) => {
    const state = stateRef.current;
    state.pointerId = pointerId;
    state.startX = x;
    state.startY = y;
    state.startTime = now();
    state.isSwiping = false;
    state.isVerticalScroll = false;
  }, []);

  const handleMove = useCallback(
    (event: ReactPointerEvent<Element> | ReactTouchEvent<Element>, x: number, y: number) => {
      const state = stateRef.current;
      const cfg = configRef.current;
      const deltaX = x - state.startX;
      const deltaY = y - state.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!state.isSwiping && !state.isVerticalScroll) {
        if (absX >= cfg.delta && absX >= absY) {
          state.isSwiping = true;
        } else if (absY >= cfg.delta && absY > absX) {
          state.isVerticalScroll = true;
        }
      }

      if (state.isSwiping && cfg.preventScrollOnSwipe) {
        event.preventDefault();
      }
    },
    [],
  );

  const endTracking = useCallback(
    (
      event: ReactPointerEvent<Element> | ReactTouchEvent<Element>,
      x: number,
      y: number,
    ) => {
      const state = stateRef.current;
      const cfg = configRef.current;
      const deltaX = x - state.startX;
      const deltaY = y - state.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (state.isSwiping && absX >= cfg.delta) {
        triggerSwipe(event, deltaX, deltaY);
      }

      if (!state.isVerticalScroll && !state.isSwiping && absX >= cfg.delta && absX > absY) {
        triggerSwipe(event, deltaX, deltaY);
      }

      resetState();
    },
    [resetState, triggerSwipe],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<Element>) => {
      if (!configRef.current.trackTouch) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      startTracking(touch.clientX, touch.clientY, null);
    },
    [startTracking],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<Element>) => {
      if (!configRef.current.trackTouch) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      handleMove(event, touch.clientX, touch.clientY);
    },
    [handleMove],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<Element>) => {
      if (!configRef.current.trackTouch) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        resetState();
        return;
      }

      endTracking(event, touch.clientX, touch.clientY);
    },
    [endTracking, resetState],
  );

  const shouldHandlePointerType = useCallback((pointerType: string) => {
    if (pointerType === 'touch' || pointerType === 'pen') {
      return true;
    }

    if (pointerType === 'mouse') {
      return configRef.current.trackMouse;
    }

    return false;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<Element>) => {
      if (!shouldHandlePointerType(event.pointerType)) {
        return;
      }

      if (event.pointerType === 'mouse' && event.buttons !== 1) {
        return;
      }

      startTracking(event.clientX, event.clientY, event.pointerId);
    },
    [shouldHandlePointerType, startTracking],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<Element>) => {
      const state = stateRef.current;
      if (!shouldHandlePointerType(event.pointerType) || state.pointerId !== event.pointerId) {
        return;
      }

      handleMove(event, event.clientX, event.clientY);
    },
    [handleMove, shouldHandlePointerType],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<Element>) => {
      const state = stateRef.current;
      if (!shouldHandlePointerType(event.pointerType) || state.pointerId !== event.pointerId) {
        return;
      }

      endTracking(event, event.clientX, event.clientY);
    },
    [endTracking, shouldHandlePointerType],
  );

  const handlers = useMemo<SwipeableHandlers>(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: resetState,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: resetState,
    }),
    [
      handlePointerDown,
      handlePointerEnd,
      handlePointerMove,
      handleTouchEnd,
      handleTouchMove,
      handleTouchStart,
      resetState,
    ],
  );

  return handlers;
};

export default useSwipeable;
