import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type FormEvent,
  type ChangeEvent
} from 'react';
import { useSwipeable } from 'react-swipeable';
import './Shopping.css';

import {
  createInitialShoppingLists,
  sortItems,
  type CheckItem,
  type ShoppingListData
} from './shoppingData';

type ShoppingListViewProps = ShoppingListData & {
  showTitle?: boolean;
  onToggle: (itemId: string) => void;
  onAdd: () => void;
};

type ShoppingPagerProps = {
  lists: ShoppingListData[];
  currentIndex: number;
  onToggle: (listIndex: number, itemId: string) => void;
  onAdd: (listIndex: number) => void;
};

type PageDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
};

const createItemId = (listTitle: string) => {
  const normalized = listTitle
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${normalized}-${crypto.randomUUID()}`;
  }

  return `${normalized}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const ShoppingListView = ({ title, items, showTitle = true, onToggle, onAdd }: ShoppingListViewProps) => (
  <div className="shopping-panel">
    {showTitle ? <h2 className="shopping-list-title">{title}</h2> : null}
    <ul className="shopping-items">
      {items.map((item) => {
        const handleKeyDown = (event: ReactKeyboardEvent<HTMLLIElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle(item.id);
          }
        };

        return (
          <li
            key={item.id}
            className="check-item"
            role="button"
            tabIndex={0}
            aria-pressed={item.done}
            onClick={() => onToggle(item.id)}
            onKeyDown={handleKeyDown}
          >
            <span className="check-item__icon" aria-hidden="true">
              {item.done ? '✅' : '❌'}
            </span>
            <span className="check-item__title">{item.title}</span>
          </li>
        );
      })}
    </ul>
    <div className="shopping-add-action">
      <button type="button" className="shopping-add-button" onClick={onAdd}>
        + добавить
      </button>
    </div>
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

const ShoppingPager = ({ lists, currentIndex, onToggle, onAdd }: ShoppingPagerProps) => {
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
            onAdd={() => onAdd(index)}
          />
        ))}
      </div>
    </div>
  );
};

const Shopping = () => {
  const [lists, setLists] = useState<ShoppingListData[]>(() => createInitialShoppingLists());
  const listCount = lists.length;

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 768;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');

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

  const handleOpenModal = useCallback(
    (categoryTitle: string) => {
      const nextCategory = categoryTitle || lists[0]?.title || '';
      if (!nextCategory) {
        return;
      }

      setModalCategory(nextCategory);
      setModalTitle('');
      setIsModalOpen(true);
    },
    [lists]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalTitle('');
  }, []);

  useEffect(() => {
    if (!isModalOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseModal, isModalOpen]);

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

  const categoryOptions = useMemo(() => lists.map((list) => list.title), [lists]);
  const trimmedModalTitle = modalTitle.trim();
  const isAddDisabled = trimmedModalTitle.length === 0;

  const handleModalSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const titleToAdd = modalTitle.trim();
      if (!modalCategory || !titleToAdd) {
        return;
      }

      const itemId = createItemId(modalCategory);
      const newItem: CheckItem = { id: itemId, title: titleToAdd, done: false };
      let addedIndex = -1;

      setLists((prevLists) =>
        prevLists.map((list, index) => {
          if (list.title !== modalCategory) {
            return list;
          }

          addedIndex = index;
          return {
            ...list,
            items: sortItems([...list.items, newItem])
          };
        })
      );

      if (!isDesktop && addedIndex !== -1 && addedIndex !== currentIndex) {
        setCurrentIndex(addedIndex);
      }

      handleCloseModal();
    },
    [currentIndex, handleCloseModal, isDesktop, modalCategory, modalTitle]
  );

  const handleModalTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setModalTitle(event.target.value);
  }, []);

  const handleModalCategoryChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setModalCategory(event.target.value);
  }, []);

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
              onAdd={() => handleOpenModal(list.title)}
            />
          ))}
        </div>
      ) : (
        <div className="shopping-content" {...swipeHandlers}>
          <ShoppingPager
            lists={lists}
            currentIndex={currentIndex}
            onToggle={handleToggleItem}
            onAdd={(index) => handleOpenModal(lists[index]?.title ?? '')}
          />
          <PageDots count={listCount} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        </div>
      )}
      {isModalOpen ? (
        <div className="shopping-modal-overlay" role="presentation" onClick={handleCloseModal}>
          <div
            className="shopping-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="shopping-modal-title" className="shopping-modal-title">
              Добавить позицию
            </h2>
            <form className="shopping-modal-form" onSubmit={handleModalSubmit}>
              <label className="shopping-modal-field">
                <span className="shopping-modal-label">Категория</span>
                <select
                  className="shopping-modal-select"
                  value={modalCategory}
                  onChange={handleModalCategoryChange}
                  required
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shopping-modal-field">
                <span className="shopping-modal-label">Название</span>
                <input
                  className="shopping-modal-input"
                  type="text"
                  value={modalTitle}
                  onChange={handleModalTitleChange}
                  placeholder="Что добавить?"
                  autoFocus
                  required
                />
              </label>
              <div className="shopping-modal-actions">
                <button
                  type="submit"
                  className="shopping-modal-button shopping-modal-button-primary"
                  disabled={isAddDisabled}
                >
                  Добавить
                </button>
                <button
                  type="button"
                  className="shopping-modal-button shopping-modal-button-secondary"
                  onClick={handleCloseModal}
                >
                  Отменить
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Shopping;
