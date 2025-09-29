import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useSwipeable } from 'react-swipeable';
import './Shopping.css';

type CheckItem = {
  id: string;
  title: string;
  done: boolean;
};

type ShoppingListData = {
  title: string;
  items: CheckItem[];
};

type ShoppingListViewProps = ShoppingListData & {
  showTitle?: boolean;
  onToggle: (itemId: string) => void;
};

type ShoppingPagerProps = {
  lists: ShoppingListData[];
  currentIndex: number;
  onToggle: (listIndex: number, itemId: string) => void;
};

type PageDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
};

const createItems = (prefix: string): CheckItem[] =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `Пункт ${index + 1}`,
    done: false
  }));

const createInitialLists = (): ShoppingListData[] => [
  { title: 'Еда', items: createItems('food') },
  { title: 'Бытовое', items: createItems('household') },
  { title: 'Вещи', items: createItems('things') }
];

const ShoppingListView = ({ title, items, showTitle = true, onToggle }: ShoppingListViewProps) => (
  <div className="shopping-panel">
    {showTitle ? <h2 className="shopping-list-title">{title}</h2> : null}
    <ul className="shopping-items">
      {items.map((item) => {
        const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(item.id);
          }
        };

        return (
          <li
            key={item.id}
            className="shopping-item"
            role="button"
            tabIndex={0}
            aria-pressed={item.done}
            onClick={() => onToggle(item.id)}
            onKeyDown={handleKeyDown}
          >
            <span className="shopping-item-icon" aria-hidden="true">
              {item.done ? '✅' : '❌'}
            </span>
            <span className="shopping-item-title">{item.title}</span>
          </li>
        );
      })}
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

const ShoppingPager = ({ lists, currentIndex, onToggle }: ShoppingPagerProps) => {
  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${currentIndex * 100}%)`
    }),
    [currentIndex]
  );

  return (
    <div className="shopping-mobile">
      <div className="shopping-track" style={trackStyle}>
        {lists.map((list, index) => (
          <ShoppingListView
            key={list.title}
            {...list}
            showTitle={false}
            onToggle={(itemId) => onToggle(index, itemId)}
          />
        ))}
      </div>
    </div>
  );
};

const Shopping = () => {
  const [lists, setLists] = useState<ShoppingListData[]>(() => createInitialLists());
  const listCount = lists.length;

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 768;
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNextPage = useCallback(() => {
    setCurrentIndex((index) => Math.min(Math.max(listCount - 1, 0), index + 1));
  }, [listCount]);

  const goToPrevPage = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleToggleItem = useCallback((listIndex: number, itemId: string) => {
    setLists((prevLists) =>
      prevLists.map((list, index) => {
        if (index !== listIndex) {
          return list;
        }

        return {
          ...list,
          items: list.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  done: !item.done
                }
              : item
          )
        };
      })
    );
  }, []);

  const isSwipeDebugEnabled = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return new URLSearchParams(window.location.search).get('debugSwipe') === '1';
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipeStart: (eventData) => {
      if (!isSwipeDebugEnabled) {
        return;
      }

      const target = eventData.event?.target as HTMLElement | null;
      console.log('[shopping] swipe start', target?.tagName ?? 'unknown', eventData);
    },
    onSwiping: (eventData) => {
      if (!isSwipeDebugEnabled) {
        return;
      }

      const target = eventData.event?.target as HTMLElement | null;
      console.log('[shopping] swiping', target?.tagName ?? 'unknown', eventData.dir);
    },
    onSwipedLeft: () => goToNextPage(),
    onSwipedRight: () => goToPrevPage(),
    onSwiped: (eventData) => {
      if (!isSwipeDebugEnabled) {
        return;
      }

      const target = eventData.event?.target as HTMLElement | null;
      console.log('[shopping] swiped', target?.tagName ?? 'unknown', eventData.dir, eventData);
    },
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

  const currentList = lists[currentIndex] ?? lists[0];

  if (!currentList) {
    return null;
  }

  return (
    <section className="shopping-page">
      <header className="shopping-header">
        {!isDesktop && (
          <h1 className="shopping-current-title">{currentList.title}</h1>
        )}
      </header>
      {isDesktop ? (
        <div className="shopping-desktop-grid" aria-label="Списки покупок">
          {lists.map((list, index) => (
            <ShoppingListView
              key={list.title}
              {...list}
              onToggle={(itemId) => handleToggleItem(index, itemId)}
            />
          ))}
        </div>
      ) : (
        <div className="shopping-content" {...swipeHandlers}>
          <ShoppingPager
            lists={lists}
            currentIndex={currentIndex}
            onToggle={handleToggleItem}
          />
          <PageDots count={listCount} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        </div>
      )}
    </section>
  );
};

export default Shopping;
