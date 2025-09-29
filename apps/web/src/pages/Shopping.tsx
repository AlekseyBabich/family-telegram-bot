import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
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

const ShoppingPager = ({ lists, currentIndex }: ShoppingPagerProps) => {
  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${currentIndex * 100}%)`
    }),
    [currentIndex]
  );

  return (
    <div className="shopping-mobile">
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

  const goToNextPage = useCallback(() => {
    setCurrentIndex((index) => Math.min(LISTS.length - 1, index + 1));
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextPage(),
    onSwipedRight: () => goToPrevPage(),
    delta: 12,
    preventScrollOnSwipe: true,
    trackTouch: true,
    touchEventOptions: { passive: false },
    rotationAngle: 0
  });

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
    <section
      className="shopping-page"
      {...(!isDesktop ? swipeHandlers : {})}
    >
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
          />
          <PageDots count={LISTS.length} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        </>
      )}
    </section>
  );
};

export default Shopping;
