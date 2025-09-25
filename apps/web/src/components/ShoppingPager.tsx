import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
} from 'react';
import LongPressPopover from './LongPressPopover';

export interface ShoppingPagerItem {
  id: string;
  title: string;
  done: boolean;
}

export interface ShoppingPagerColumn {
  id: string;
  title: string;
  items: ShoppingPagerItem[];
}

interface ShoppingPagerProps {
  columns: ShoppingPagerColumn[];
  activeColumnId: string;
  onActiveColumnChange: (columnId: string) => void;
  onToggleItem: (columnId: string, itemId: string) => void;
  onDeleteItem: (columnId: string, itemId: string) => void;
}

interface PopoverState {
  columnId: string;
  itemId: string;
  anchorRect: DOMRect;
}

const SWIPE_THRESHOLD_PX = 64;
export const LONG_PRESS_DURATION_MS = 1000;
const LONG_PRESS_SWIPE_CANCEL_PX = 12;

const ShoppingPager = ({
  columns,
  activeColumnId,
  onActiveColumnChange,
  onToggleItem,
  onDeleteItem,
}: ShoppingPagerProps) => {
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const containerWidthRef = useRef(1);
  const isDraggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, columns.findIndex((column) => column.id === activeColumnId))
  );
  const longPressCancelRef: MutableRefObject<(() => void) | null> = useRef(null);
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);

  useEffect(() => {
    const nextIndex = columns.findIndex((column) => column.id === activeColumnId);
    if (nextIndex >= 0 && nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      setDragOffset(0);
      dragOffsetRef.current = 0;
    }
  }, [activeColumnId, columns, currentIndex]);

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= columns.length) {
      return;
    }

    const nextColumnId = columns[currentIndex]?.id;
    if (nextColumnId && nextColumnId !== activeColumnId) {
      onActiveColumnChange(nextColumnId);
    }
  }, [activeColumnId, columns, currentIndex, onActiveColumnChange]);

  const cancelLongPress = useCallback(() => {
    if (longPressCancelRef.current) {
      longPressCancelRef.current();
      longPressCancelRef.current = null;
    }
  }, []);

  const registerLongPressCancel = useCallback(
    (cancel: () => void) => {
      cancelLongPress();
      longPressCancelRef.current = cancel;
    },
    [cancelLongPress]
  );

  const closePopover = useCallback(() => {
    setPopoverState(null);
  }, []);

  const handleToggleItem = useCallback(
    (columnId: string, itemId: string) => {
      closePopover();
      onToggleItem(columnId, itemId);
    },
    [closePopover, onToggleItem]
  );

  const handleDeleteItem = useCallback(() => {
    if (!popoverState) {
      return;
    }

    onDeleteItem(popoverState.columnId, popoverState.itemId);
    closePopover();
  }, [closePopover, onDeleteItem, popoverState]);

  const handleItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLLIElement>, columnId: string, itemId: string) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Space') {
        event.preventDefault();
        handleToggleItem(columnId, itemId);
      }
    },
    [handleToggleItem]
  );

  const slideToIndex = useCallback(
    (nextIndex: number) => {
      const clampedIndex = Math.max(0, Math.min(columns.length - 1, nextIndex));
      setCurrentIndex(clampedIndex);
      setDragOffset(0);
      dragOffsetRef.current = 0;
      setIsSwiping(false);
      isDraggingRef.current = false;
      cancelLongPress();
      closePopover();
    },
    [cancelLongPress, closePopover, columns.length]
  );

  const beginPointer = useCallback(
    (event: PointerEvent) => {
      if (!pagesRef.current) {
        return;
      }

      pointerIdRef.current = event.pointerId;
      pagesRef.current.setPointerCapture(event.pointerId);
      containerWidthRef.current = pagesRef.current.clientWidth || 1;
      startXRef.current = event.clientX;
      dragOffsetRef.current = 0;
      startYRef.current = event.clientY;
      isDraggingRef.current = false;
      setIsSwiping(false);
      cancelLongPress();
    },
    [cancelLongPress]
  );

  const updatePointer = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - startXRef.current;
      const deltaY = event.clientY - startYRef.current;

      if (!isDraggingRef.current) {
        if (Math.abs(deltaX) > LONG_PRESS_SWIPE_CANCEL_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDraggingRef.current = true;
          setIsSwiping(true);
          cancelLongPress();
        }
      }

      if (isDraggingRef.current) {
        event.preventDefault();
        dragOffsetRef.current = deltaX;
        setDragOffset(deltaX);
      }
    },
    [cancelLongPress]
  );

  const endPointer = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      if (pagesRef.current?.hasPointerCapture(event.pointerId)) {
        pagesRef.current.releasePointerCapture(event.pointerId);
      }

      pointerIdRef.current = null;
      cancelLongPress();

      if (isDraggingRef.current) {
        const deltaX = dragOffsetRef.current;
        if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
          if (deltaX < 0) {
            slideToIndex(currentIndex + 1);
          } else {
            slideToIndex(currentIndex - 1);
          }
        } else {
          setDragOffset(0);
          dragOffsetRef.current = 0;
          setIsSwiping(false);
          isDraggingRef.current = false;
        }
      } else {
        setIsSwiping(false);
      }
    },
    [cancelLongPress, currentIndex, slideToIndex]
  );

  useEffect(() => {
    const node = pagesRef.current;
    if (!node) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => beginPointer(event);
    const handlePointerMove = (event: PointerEvent) => updatePointer(event);
    const handlePointerUp = (event: PointerEvent) => endPointer(event);

    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerup', handlePointerUp);
    node.addEventListener('pointercancel', handlePointerUp);

    return () => {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', handlePointerUp);
      node.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [beginPointer, endPointer, updatePointer]);

  useEffect(() => {
    return () => cancelLongPress();
  }, [cancelLongPress]);

  const dragOffsetPercent = useMemo(() => {
    if (containerWidthRef.current === 0) {
      return 0;
    }

    return (dragOffset / containerWidthRef.current) * 100;
  }, [dragOffset]);

  const pagesStyle = useMemo(
    () => ({
      transform: `translateX(calc(${-100 * currentIndex}% + ${dragOffsetPercent}%))`,
      transition: isSwiping ? 'none' : 'transform 0.3s ease',
    }),
    [currentIndex, dragOffsetPercent, isSwiping]
  );

  const handleTabClick = useCallback(
    (index: number) => {
      slideToIndex(index);
    },
    [slideToIndex]
  );

  const handleLongPress = useCallback(
    (columnId: string, itemId: string, anchorRect: DOMRect) => {
      setPopoverState({ columnId, itemId, anchorRect });
    },
    []
  );

  const popover = popoverState ? (
    <LongPressPopover
      anchorRect={popoverState.anchorRect}
      onDelete={handleDeleteItem}
      onClose={closePopover}
    />
  ) : null;

  return (
    <div className="shopping-mobile" data-testid="shopping-mobile" aria-live="polite">
      <div className="shopping-tabs" role="tablist">
        {columns.map((column, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={column.id}
              type="button"
              className={`shopping-tab ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(index)}
            >
              {column.title}
            </button>
          );
        })}
      </div>

      <div
        className="shopping-pager"
        ref={pagesRef}
        data-testid="shopping-pager"
      >
        <div className="shopping-pager-pages" style={pagesStyle}>
          {columns.map((column) => (
            <div
              key={column.id}
              className="shopping-pager-page"
              role="tabpanel"
              data-testid={`shopping-pager-page-${column.id}`}
            >
              <ul className="shopping-items">
                {column.items.map((item) => (
                  <ShoppingPagerListItem
                    key={item.id}
                    columnId={column.id}
                    item={item}
                    isSwiping={isSwiping}
                    onToggle={handleToggleItem}
                    onLongPress={handleLongPress}
                    onKeyDown={handleItemKeyDown}
                    registerLongPressCancel={registerLongPressCancel}
                    cancelLongPress={cancelLongPress}
                    closePopover={closePopover}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="shopping-indicators" role="presentation">
        {columns.map((column, index) => (
          <span
            key={column.id}
            className={`shopping-indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      {popover}
    </div>
  );
};

interface ShoppingPagerListItemProps {
  columnId: string;
  item: ShoppingPagerItem;
  isSwiping: boolean;
  onToggle: (columnId: string, itemId: string) => void;
  onLongPress: (columnId: string, itemId: string, anchorRect: DOMRect) => void;
  onKeyDown: (event: KeyboardEvent<HTMLLIElement>, columnId: string, itemId: string) => void;
  registerLongPressCancel: (cancel: () => void) => void;
  cancelLongPress: () => void;
  closePopover: () => void;
}

const ShoppingPagerListItem = ({
  columnId,
  item,
  isSwiping,
  onToggle,
  onLongPress,
  onKeyDown,
  registerLongPressCancel,
  cancelLongPress,
  closePopover,
}: ShoppingPagerListItemProps) => {
  const timerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const startXRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      closePopover();
      pointerActiveRef.current = true;
      longPressTriggeredRef.current = false;
      startXRef.current = event.clientX;
      const anchorRect = event.currentTarget.getBoundingClientRect();
      const timer = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPress(columnId, item.id, anchorRect);
      }, LONG_PRESS_DURATION_MS);
      timerRef.current = timer;

      registerLongPressCancel(() => {
        clearTimer();
        pointerActiveRef.current = false;
      });
    },
    [clearTimer, closePopover, columnId, item.id, onLongPress, registerLongPressCancel]
  );

  const cancelLongPressInternal = useCallback(() => {
    cancelLongPress();
    clearTimer();
    pointerActiveRef.current = false;
  }, [cancelLongPress, clearTimer]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLLIElement>) => {
      if (!pointerActiveRef.current || timerRef.current === null) {
        return;
      }

      const deltaX = Math.abs(event.clientX - startXRef.current);
      if (deltaX > LONG_PRESS_SWIPE_CANCEL_PX) {
        cancelLongPressInternal();
      }
    },
    [cancelLongPressInternal]
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerActiveRef.current) {
      return;
    }

    pointerActiveRef.current = false;

    if (timerRef.current !== null) {
      clearTimer();
      cancelLongPress();
    }
  }, [cancelLongPress, clearTimer]);

  const handlePointerCancel = useCallback(() => {
    if (!pointerActiveRef.current) {
      return;
    }

    pointerActiveRef.current = false;
    cancelLongPressInternal();
  }, [cancelLongPressInternal]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLLIElement>) => {
      if (isSwiping || longPressTriggeredRef.current) {
        event.preventDefault();
        event.stopPropagation();
        longPressTriggeredRef.current = false;
        return;
      }

      onToggle(columnId, item.id);
    },
    [columnId, isSwiping, item.id, onToggle]
  );

  const handleFocus = useCallback(() => {
    closePopover();
  }, [closePopover]);

  return (
    <li
      className="shopping-item"
      tabIndex={0}
      role="button"
      aria-pressed={item.done}
      data-item-id={item.id}
      data-item-title={item.title}
      onClick={handleClick}
      onKeyDown={(event) => onKeyDown(event, columnId, item.id)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onFocus={handleFocus}
    >
      <span className={`shopping-item-icon ${item.done ? 'done' : 'pending'}`} aria-hidden="true">
        {item.done ? '✔' : '−'}
      </span>
      <span className="shopping-item-title">{item.title}</span>
    </li>
  );
};

export default ShoppingPager;
