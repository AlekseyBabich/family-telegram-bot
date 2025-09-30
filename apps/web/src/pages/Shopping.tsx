import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import styles from './shopping/ShoppingLayout.module.css';
import {
  createInitialShoppingLists,
  sortItems,
  type CheckItem,
  type ShoppingListData
} from './shoppingData';
import { Checklist } from './shopping/components/Checklist';
import { PagerDots } from './shopping/components/PagerDots';
import { Dialog } from './shopping/components/Dialog';
import { AddItemForm, type AddItemFormState } from './shopping/components/AddItemForm';
import { RenameItemForm } from './shopping/components/RenameItemForm';
import { ContextMenu } from './shopping/components/ContextMenu';

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

type ContextMenuState = {
  listIndex: number;
  itemId: string;
  title: string;
  anchor: { x: number; y: number };
};

type RenameState = {
  listIndex: number;
  itemId: string;
  value: string;
};

const clampPosition = (position: { x: number; y: number }) => {
  if (typeof window === 'undefined') {
    return position;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = 120;
  const padding = 16;

  return {
    x: Math.min(Math.max(position.x, padding), viewportWidth - menuWidth - padding),
    y: Math.min(Math.max(position.y, padding), viewportHeight - menuHeight - padding)
  };
};

const Shopping = () => {
  const [lists, setLists] = useState<ShoppingListData[]>(() => createInitialShoppingLists());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 768;
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormState, setAddFormState] = useState<AddItemFormState>({ category: '', title: '' });
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState | null>(null);
  const [renameState, setRenameState] = useState<RenameState | null>(null);

  const listCount = lists.length;
  const currentList = lists[currentIndex] ?? lists[0];

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

  const openAddDialog = useCallback(
    (categoryTitle: string) => {
      const fallbackCategory = lists[0]?.title ?? '';
      const category = categoryTitle || fallbackCategory;
      if (!category) {
        return;
      }
      setAddFormState({ category, title: '' });
      setAddDialogOpen(true);
    },
    [lists]
  );

  const closeAddDialog = useCallback(() => {
    setAddDialogOpen(false);
    setAddFormState((prev) => ({ ...prev, title: '' }));
  }, []);

  const openContextMenu = useCallback((listIndex: number, item: CheckItem, position: { x: number; y: number }) => {
    setContextMenuState({
      listIndex,
      itemId: item.id,
      title: item.title,
      anchor: clampPosition(position)
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuState(null);
  }, []);

  const startRename = useCallback((state: RenameState) => {
    setRenameState(state);
  }, []);

  const cancelRename = useCallback(() => {
    setRenameState(null);
  }, []);

  const applyRename = useCallback(() => {
    setRenameState((current) => {
      if (!current) {
        return current;
      }

      const trimmedValue = current.value.trim();
      if (!trimmedValue) {
        return null;
      }

      setLists((prevLists) =>
        prevLists.map((list, index) => {
          if (index !== current.listIndex) {
            return list;
          }

          return {
            ...list,
            items: sortItems(
              list.items.map((item) =>
                item.id === current.itemId
                  ? {
                      ...item,
                      title: trimmedValue
                    }
                  : item
              )
            )
          };
        })
      );

      return null;
    });
  }, []);

  const deleteItem = useCallback((listIndex: number, itemId: string) => {
    setLists((prevLists) =>
      prevLists.map((list, index) => {
        if (index !== listIndex) {
          return list;
        }

        return {
          ...list,
          items: sortItems(list.items.filter((item) => item.id !== itemId))
        };
      })
    );
  }, []);

  const addItem = useCallback(() => {
    const trimmed = addFormState.title.trim();
    if (!addFormState.category || !trimmed) {
      return;
    }

    const newItem: CheckItem = {
      id: createItemId(addFormState.category),
      title: trimmed,
      done: false
    };

    let addedIndex = -1;

    setLists((prevLists) =>
      prevLists.map((list, index) => {
        if (list.title !== addFormState.category) {
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

    closeAddDialog();
  }, [addFormState, closeAddDialog, currentIndex, isDesktop]);

  const categoryOptions = useMemo(() => lists.map((list) => list.title), [lists]);

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
    onSwipedLeft: () => setCurrentIndex((index) => Math.min(Math.max(listCount - 1, 0), index + 1)),
    onSwipedRight: () => setCurrentIndex((index) => Math.max(0, index - 1)),
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

  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${currentIndex * 100}%)`
    }),
    [currentIndex]
  );

  const activeContext = contextMenuState;

  if (!currentList) {
    return null;
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        {!isDesktop ? <h1 className={styles.currentTitle}>{currentList.title}</h1> : null}
      </header>
      {isDesktop ? (
        <div className={styles.desktopGrid} aria-label="Списки покупок">
          {lists.map((list, index) => (
            <Checklist
              key={list.title}
              title={list.title}
              items={list.items}
              onToggle={(itemId) => handleToggleItem(index, itemId)}
              onAdd={() => openAddDialog(list.title)}
              onOpenActions={(item, position) => openContextMenu(index, item, position)}
            />
          ))}
        </div>
      ) : (
        <div className={`${styles.mobileContent} shopping-content`} {...swipeHandlers}>
          <div className={styles.mobileTrackWrapper}>
            <div className={`${styles.mobileTrack} shopping-track`} style={trackStyle}>
              {lists.map((list, index) => (
                <div key={list.title} className={styles.mobilePanel}>
                  <Checklist
                    title={list.title}
                    items={list.items}
                    showTitle={false}
                    onToggle={(itemId) => handleToggleItem(index, itemId)}
                    onAdd={() => openAddDialog(list.title)}
                    onOpenActions={(item, position) => openContextMenu(index, item, position)}
                  />
                </div>
              ))}
            </div>
          </div>
          <PagerDots count={listCount} currentIndex={currentIndex} onSelect={setCurrentIndex} />
        </div>
      )}

      <Dialog
        open={addDialogOpen}
        onClose={closeAddDialog}
        title="Добавить позицию"
        labelledBy="shopping-add-dialog-title"
      >
        <AddItemForm
          state={addFormState}
          categoryOptions={categoryOptions}
          onCategoryChange={(value) => setAddFormState((prev) => ({ ...prev, category: value }))}
          onTitleChange={(value) => setAddFormState((prev) => ({ ...prev, title: value }))}
          onSubmit={addItem}
          onCancel={closeAddDialog}
        />
      </Dialog>

      <Dialog
        open={Boolean(renameState)}
        onClose={cancelRename}
        title="Переименовать"
        labelledBy="shopping-rename-dialog-title"
      >
        {renameState ? (
          <RenameItemForm
            value={renameState.value}
            onChange={(value) => setRenameState((prev) => (prev ? { ...prev, value } : prev))}
            onSubmit={applyRename}
            onCancel={cancelRename}
          />
        ) : null}
      </Dialog>

      <ContextMenu
        open={Boolean(activeContext)}
        anchor={activeContext?.anchor ?? null}
        onClose={closeContextMenu}
        onRename={() => {
          if (!activeContext) {
            return;
          }
          startRename({
            listIndex: activeContext.listIndex,
            itemId: activeContext.itemId,
            value: activeContext.title
          });
        }}
        onDelete={() => {
          if (!activeContext) {
            return;
          }
          deleteItem(activeContext.listIndex, activeContext.itemId);
        }}
      />
    </section>
  );
};

export default Shopping;
