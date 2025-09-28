import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './Shopping.css';

type ShoppingListData = {
  title: string;
  items: string[];
};

type ShoppingListViewProps = ShoppingListData & {
  showTitle?: boolean;
};

type ShoppingPagerProps = {
  lists: ShoppingListData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
};

type PageDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
};

const createItems = () => Array.from({ length: 10 }, (_, index) => `Пункт ${index + 1}`);

const LISTS: ShoppingListData[] = [
  { title: 'Еда', items: createItems() },
  { title: 'Бытовое', items: createItems() },
  { title: 'Вещи', items: createItems() }
];

const ShoppingListView = ({ title, items, showTitle = true }: ShoppingListViewProps) => (
  <div className="shopping-panel">
    {showTitle ? <h2 className="shopping-list-title">{title}</h2> : null}
    <ul className="shopping-items">
      {items.map((item) => (
        <li key={`${title}-${item}`} className="shopping-item">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const PageDots = ({ count, currentIndex, onSelect }: PageDotsProps) => {
  return (
    <div className="shopping-dots" role="tablist" aria-label="Списки покупок">
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex;
        return (
          <button
            key={index}
            type="button"
            className={`shopping-dot${isActive ? ' shopping-dot-active' : ''}`}
            aria-label={`Перейти к списку ${index + 1}`}
            aria-pressed={isActive}
            onClick={() => onSelect(index)}
          />
        );
      })}
    </div>
  );
};

const SWIPE_THRESHOLD = 12;
const LONG_PRESS_DURATION = 1000;

type GestureState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
  isVerticalScroll: boolean;
  longPressActive: boolean;
  longPressTimeout: ReturnType<typeof setTimeout> | null;
  hasPointerCapture: boolean;
};

const ShoppingPager = ({ lists, currentIndex, onIndexChange }: ShoppingPagerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gestureStateRef = useRef<GestureState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    isVerticalScroll: false,
    longPressActive: false,
    longPressTimeout: null,
    hasPointerCapture: false
  });

  const resetGestureState = () => {
    const state = gestureStateRef.current;
    if (state.longPressTimeout) {
      clearTimeout(state.longPressTimeout);
      state.longPressTimeout = null;
    }
    state.pointerId = null;
    state.startX = 0;
    state.startY = 0;
    state.startTime = 0;
    state.isSwiping = false;
    state.isVerticalScroll = false;
    state.longPressActive = false;
    state.hasPointerCapture = false;
  };

  useEffect(() => {
    return () => {
      resetGestureState();
    };
  }, []);

  const handlePointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    const topNav = document.querySelector('.top-tabs');
    if (topNav && topNav.contains(event.target as Node)) {
      return;
    }

    const state = gestureStateRef.current;
    if (state.pointerId !== null) {
      return;
    }

    const container = event.currentTarget;

    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    state.isSwiping = false;
    state.isVerticalScroll = false;
    state.longPressActive = false;
    state.longPressTimeout = setTimeout(() => {
      const activeState = gestureStateRef.current;
      if (activeState.pointerId !== event.pointerId) {
        return;
      }
      activeState.longPressActive = true;
      activeState.isSwiping = false;
      activeState.isVerticalScroll = false;
      activeState.longPressTimeout = null;
    }, LONG_PRESS_DURATION);

    if (container.setPointerCapture) {
      try {
        container.setPointerCapture(event.pointerId);
        state.hasPointerCapture = true;
      } catch (error) {
        state.hasPointerCapture = false;
      }
    }
  };

  const cancelLongPressTimer = () => {
    const state = gestureStateRef.current;
    if (state.longPressTimeout) {
      clearTimeout(state.longPressTimeout);
      state.longPressTimeout = null;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    const state = gestureStateRef.current;
    if (state.pointerId !== event.pointerId) {
      return;
    }

    if (state.longPressActive) {
      event.preventDefault();
      return;
    }

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (state.longPressTimeout && (absDeltaX >= SWIPE_THRESHOLD || absDeltaY >= SWIPE_THRESHOLD)) {
      cancelLongPressTimer();
    }

    if (!state.isSwiping && !state.isVerticalScroll) {
      if (absDeltaX >= SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
        state.isSwiping = true;
        event.preventDefault();
      } else if (absDeltaY >= SWIPE_THRESHOLD && absDeltaY > absDeltaX) {
        state.isVerticalScroll = true;
      }
      return;
    }

    if (state.isSwiping) {
      event.preventDefault();
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    const state = gestureStateRef.current;
    if (state.pointerId !== event.pointerId) {
      return;
    }

    cancelLongPressTimer();

    const container = event.currentTarget;
    if (state.hasPointerCapture && container.releasePointerCapture) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore release errors
      }
      state.hasPointerCapture = false;
    }

    if (!state.longPressActive && !state.isVerticalScroll) {
      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX >= SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
        if (deltaX < 0) {
          onIndexChange(Math.min(lists.length - 1, currentIndex + 1));
        } else if (deltaX > 0) {
          onIndexChange(Math.max(0, currentIndex - 1));
        }
      }
    }

    resetGestureState();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = gestureStateRef.current;
    if (state.pointerId !== event.pointerId) {
      return;
    }

    cancelLongPressTimer();

    const container = event.currentTarget;
    if (state.hasPointerCapture && container.releasePointerCapture) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore release errors
      }
      state.hasPointerCapture = false;
    }

    resetGestureState();
  };

  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${currentIndex * 100}%)`
    }),
    [currentIndex]
  );

  return (
    <div
      ref={containerRef}
      className="shopping-mobile"
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerCancel}
    >
      <div className="shopping-track" style={trackStyle}>
        {lists.map((list) => (
          <ShoppingListView key={list.title} {...list} showTitle={false} />
        ))}
      </div>
    </div>
  );
};

const Shopping = () => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 768;
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setCurrentIndex(0);
    }
  }, [isDesktop]);

  const currentList = LISTS[currentIndex];

  return (
    <section className="shopping-page">
      <header className="shopping-header">
        {!isDesktop && (
          <h1 className="shopping-current-title">{currentList.title}</h1>
        )}
      </header>
      {isDesktop ? (
        <div className="shopping-desktop-grid" aria-label="Списки покупок">
          {LISTS.map((list) => (
            <ShoppingListView key={list.title} {...list} />
          ))}
        </div>
      ) : (
        <>
          <ShoppingPager
            lists={LISTS}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />
          <PageDots count={LISTS.length} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        </>
      )}
    </section>
  );
};

export default Shopping;
