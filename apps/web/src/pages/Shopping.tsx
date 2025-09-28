import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './Shopping.css';

type ShoppingListData = {
  title: string;
  items: string[];
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

const ShoppingListView = ({ title, items }: ShoppingListData) => (
  <div className="shopping-panel">
    <h2 className="shopping-list-title">{title}</h2>
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
const VERTICAL_CANCEL_THRESHOLD = 40;

const ShoppingPager = ({ lists, currentIndex, onIndexChange }: ShoppingPagerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const allowSwipeRef = useRef(true);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore if pointer capture is not supported
      }
    }
    startPointRef.current = { x: event.clientX, y: event.clientY };
    allowSwipeRef.current = true;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!startPointRef.current || !allowSwipeRef.current) {
      return;
    }
    const deltaX = event.clientX - startPointRef.current.x;
    const deltaY = event.clientY - startPointRef.current.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      allowSwipeRef.current = false;
    }
  };

  const finishSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!startPointRef.current) {
      return;
    }

    const deltaX = event.clientX - startPointRef.current.x;
    const deltaY = event.clientY - startPointRef.current.y;

    const target = event.currentTarget;
    if (target.releasePointerCapture) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore if pointer capture is not supported
      }
    }

    startPointRef.current = null;

    if (!allowSwipeRef.current) {
      return;
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaY) < VERTICAL_CANCEL_THRESHOLD) {
      if (deltaX < 0) {
        onIndexChange(Math.min(lists.length - 1, currentIndex + 1));
      } else if (deltaX > 0) {
        onIndexChange(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handlePointerCancel = () => {
    startPointRef.current = null;
    allowSwipeRef.current = true;
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishSwipe}
      onPointerCancel={handlePointerCancel}
    >
      <div className="shopping-track" style={trackStyle}>
        {lists.map((list) => (
          <ShoppingListView key={list.title} {...list} />
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

  return (
    <section className="shopping-page">
      <header className="shopping-header">
        <h1 className="shopping-title">Покупки</h1>
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
