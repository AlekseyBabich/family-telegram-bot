import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent
} from 'react';
import type { CheckItem } from '../shoppingData';
import styles from './ChecklistItem.module.css';

type ChecklistItemProps = {
  item: CheckItem;
  onToggle: () => void;
  onOpenActions?: (position: { x: number; y: number }) => void;
};

const LONG_PRESS_DELAY = 600;
const LONG_PRESS_MOVE_THRESHOLD = 10;

export const ChecklistItem = ({ item, onToggle, onOpenActions }: ChecklistItemProps) => {
  const longPressTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    startPointRef.current = null;
    lastPointRef.current = null;
    activePointerIdRef.current = null;
    activeTouchIdRef.current = null;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const triggerContextMenu = useCallback(
    (point?: { x: number; y: number }) => {
      if (!onOpenActions) {
        return;
      }

      const resolvedPoint = point ?? lastPointRef.current ?? startPointRef.current;
      if (!resolvedPoint) {
        return;
      }

      suppressClickRef.current = true;
      onOpenActions(resolvedPoint);
    },
    [onOpenActions]
  );

  const startLongPressTimer = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
    }

    longPressTimeoutRef.current = window.setTimeout(() => {
      triggerContextMenu();
      clearLongPress();
    }, LONG_PRESS_DELAY);
  }, [clearLongPress, triggerContextMenu]);

  const updateLastPoint = useCallback((point: { x: number; y: number }) => {
    lastPointRef.current = point;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (!onOpenActions || !event.isPrimary) {
        if (!event.isPrimary) {
          clearLongPress();
        }
        return;
      }

      const isTouchLike = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (!isTouchLike) {
        return;
      }

      suppressClickRef.current = false;
      clearLongPress();
      const point = { x: event.clientX, y: event.clientY };
      startPointRef.current = point;
      updateLastPoint(point);
      activePointerIdRef.current = event.pointerId;
      startLongPressTimer();
    },
    [clearLongPress, onOpenActions, startLongPressTimer, updateLastPoint]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (
        longPressTimeoutRef.current === null ||
        startPointRef.current === null ||
        activePointerIdRef.current === null ||
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      const deltaX = event.clientX - startPointRef.current.x;
      const deltaY = event.clientY - startPointRef.current.y;
      if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_THRESHOLD) {
        clearLongPress();
        return;
      }

      updateLastPoint({ x: event.clientX, y: event.clientY });
    },
    [clearLongPress, updateLastPoint]
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
        return;
      }
      clearLongPress();
    },
    [clearLongPress]
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLLIElement>) => {
      if (!onOpenActions) {
        return;
      }

      if (typeof window !== 'undefined' && 'PointerEvent' in window) {
        return;
      }

      if (event.touches.length !== 1) {
        clearLongPress();
        return;
      }

      const touch = event.touches[0];
      suppressClickRef.current = false;
      clearLongPress();
      const point = { x: touch.clientX, y: touch.clientY };
      startPointRef.current = point;
      updateLastPoint(point);
      activeTouchIdRef.current = touch.identifier;
      startLongPressTimer();
    },
    [clearLongPress, onOpenActions, startLongPressTimer, updateLastPoint]
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLLIElement>) => {
      if (typeof window !== 'undefined' && 'PointerEvent' in window) {
        return;
      }

      if (
        longPressTimeoutRef.current === null ||
        startPointRef.current === null ||
        activeTouchIdRef.current === null
      ) {
        return;
      }

      if (event.touches.length !== 1) {
        clearLongPress();
        return;
      }

      const trackedTouch = Array.from(event.touches).find(
        (touch) => touch.identifier === activeTouchIdRef.current
      );

      if (!trackedTouch) {
        clearLongPress();
        return;
      }

      const deltaX = trackedTouch.clientX - startPointRef.current.x;
      const deltaY = trackedTouch.clientY - startPointRef.current.y;
      if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_THRESHOLD) {
        clearLongPress();
        return;
      }

      updateLastPoint({ x: trackedTouch.clientX, y: trackedTouch.clientY });
    },
    [clearLongPress, updateLastPoint]
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLLIElement>) => {
      if (typeof window !== 'undefined' && 'PointerEvent' in window) {
        return;
      }

      if (activeTouchIdRef.current === null) {
        clearLongPress();
        return;
      }

      const endedTouch = Array.from(event.changedTouches).some(
        (touch) => touch.identifier === activeTouchIdRef.current
      );

      if (endedTouch || event.touches.length === 0) {
        clearLongPress();
      }
    },
    [clearLongPress]
  );

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLLIElement>) => {
      if (!onOpenActions) {
        return;
      }

      event.preventDefault();
      suppressClickRef.current = true;
      triggerContextMenu({ x: event.clientX, y: event.clientY });
    },
    [triggerContextMenu, onOpenActions]
  );

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLLIElement>) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        suppressClickRef.current = false;
        return;
      }

      onToggle();
    },
    [onToggle]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLLIElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <li
      className={`${styles.item} ${item.done ? styles.done : ''}`.trim()}
      role="button"
      tabIndex={0}
      aria-pressed={item.done}
      // Keep horizontal swipe gestures available even when they start on the item itself.
      style={{ touchAction: 'pan-y' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      <span className={styles.icon} aria-hidden="true">
        {item.done ? '✅' : '❌'}
      </span>
      <span
        className={`${styles.title} ${item.done ? styles.doneTitle : ''}`.trim()}
      >
        {item.title}
      </span>
    </li>
  );
};
