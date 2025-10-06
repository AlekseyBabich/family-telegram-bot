import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import styles from './shopping/ShoppingLayout.module.css';
import {
  SHOPPING_LISTS,
  type CheckItem,
  type ShoppingListData
} from './shoppingData';
import { Checklist } from './shopping/components/Checklist';
import { PagerDots } from './shopping/components/PagerDots';
import { Dialog } from './shopping/components/Dialog';
import { AddItemForm, type AddItemFormState } from './shopping/components/AddItemForm';
import { RenameItemForm } from './shopping/components/RenameItemForm';
import { ContextMenu } from './shopping/components/ContextMenu';
import { useShoppingLists } from './shopping/hooks/useShoppingLists';

type ContextMenuState = {
  listSlug: ShoppingListData['slug'];
  itemId: string;
  title: string;
  anchor: { x: number; y: number };
};

type RenameState = {
  listSlug: ShoppingListData['slug'];
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
  const { lists, addItem, toggleChecked, renameItem, removeItem } = useShoppingLists();
  const [activeListId, setActiveListId] = useState<string>(() => SHOPPING_LISTS[0]?.title ?? '');
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
  // apps/web/src/pages/Shopping.tsx: currentIndex mirrors the horizontal pager position for swipe gestures.
  const currentIndex = useMemo(() => {
    if (listCount === 0) {
      return 0;
    }
    const foundIndex = lists.findIndex((list) => list.title === activeListId);
    return foundIndex === -1 ? 0 : foundIndex;
  }, [activeListId, listCount, lists]);
  const currentList = lists[currentIndex] ?? lists[0];

  useEffect(() => {
    if (!listCount) {
      return;
    }

    const isActiveValid = lists.some((list) => list.title === activeListId);
    if (!isActiveValid) {
      setActiveListId(lists[0]?.title ?? '');
    }
  }, [activeListId, listCount, lists]);

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
      setActiveListId(lists[0]?.title ?? '');
    }
  }, [isDesktop, lists]);

  const selectListByIndex = useCallback(
    (index: number) => {
      const total = lists.length;
      if (total === 0) {
        return;
      }

      const normalizedIndex = ((index % total) + total) % total;
      const target = lists[normalizedIndex];
      if (!target) {
        return;
      }

      setActiveListId(target.title);
    },
    [lists]
  );

  const goToNextList = useCallback(() => {
    selectListByIndex(currentIndex + 1);
  }, [currentIndex, selectListByIndex]);

  const goToPreviousList = useCallback(() => {
    selectListByIndex(currentIndex - 1);
  }, [currentIndex, selectListByIndex]);

  const handleToggleItem = useCallback(
    (list: ShoppingListData, itemId: string) => {
      const target = list.items.find((entry) => entry.id === itemId);
      if (!target) {
        return;
      }

      void toggleChecked(list.slug, target);
    },
    [toggleChecked]
  );

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

  const openContextMenu = useCallback((list: ShoppingListData, item: CheckItem, position: { x: number; y: number }) => {
    setContextMenuState({
      listSlug: list.slug,
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

      void renameItem(current.listSlug, current.itemId, trimmedValue);
      return null;
    });
  }, [renameItem]);

  const deleteItem = useCallback(
    (listSlug: ShoppingListData['slug'], itemId: string) => {
      void removeItem(listSlug, itemId);
    },
    [removeItem]
  );

  const submitNewItem = useCallback(() => {
    const trimmed = addFormState.title.trim();
    if (!addFormState.category || !trimmed) {
      return;
    }

    const targetList = lists.find((entry) => entry.title === addFormState.category);
    if (!targetList) {
      return;
    }

    void (async () => {
      await addItem(targetList.slug, trimmed);
      closeAddDialog();
    })();
  }, [addFormState, addItem, closeAddDialog, lists]);

  const categoryOptions = useMemo(() => lists.map((list) => list.title), [lists]);

  const isSwipeDebugEnabled = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return new URLSearchParams(window.location.search).get('debugSwipe') === '1';
  }, []);

  // apps/web/src/pages/Shopping.tsx: mobileContent (see render) spans the full swipe surface, so handlers live here.
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
    onSwipedLeft: () => {
      goToNextList();
    },
    onSwipedRight: () => {
      goToPreviousList();
    },
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
    trackMouse: true,
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
        {!isDesktop && listCount > 0 ? (
          <div className={styles.mobileHeaderNav}>
            <button
              type="button"
              className={styles.navButton}
              onClick={goToPreviousList}
              aria-label="Предыдущий список"
              disabled={listCount <= 1}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <h1 className={styles.currentTitle}>{currentList.title.toUpperCase()}</h1>
            <button
              type="button"
              className={styles.navButton}
              onClick={goToNextList}
              aria-label="Следующий список"
              disabled={listCount <= 1}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : null}
      </header>
      {isDesktop ? (
        <div className={styles.desktopGrid} aria-label="Списки покупок">
          {lists.map((list) => (
            <Checklist
              key={list.title}
              title={list.title}
              items={list.items}
              onToggle={(itemId) => handleToggleItem(list, itemId)}
              onAdd={() => openAddDialog(list.title)}
              onOpenActions={(item, position) => openContextMenu(list, item, position)}
            />
          ))}
        </div>
      ) : (
        // apps/web/src/pages/Shopping.tsx: handlers live on mobileContent because CSS (touch-action: pan-y)
        // is applied there to keep vertical scroll responsive while capturing horizontal swipes.
        <div
          className={`${styles.mobileContent} shopping-content`}
          data-testid="shopping-mobile-content"
          {...swipeHandlers}
        >
          <div className={styles.mobileTrackWrapper}>
            <div
              className={`${styles.mobileTrack} shopping-track`}
              style={trackStyle}
              data-testid="shopping-track"
            >
              {lists.map((list, index) => (
                <div
                  key={list.title}
                  className={styles.mobilePanel}
                  data-testid={`shopping-screen-${index}`}
                >
                  <div className={styles.mobilePanelInner}>
                    <Checklist
                      title={list.title}
                      items={list.items}
                      showTitle={false}
                      onToggle={(itemId) => handleToggleItem(list, itemId)}
                      onAdd={() => openAddDialog(list.title)}
                      onOpenActions={(item, position) => openContextMenu(list, item, position)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className={styles.mobileFooter}
            data-testid="shopping-pager-overlay"
            style={{ pointerEvents: 'none' }}
          >
            <PagerDots
              count={listCount}
              currentIndex={currentIndex}
              onSelect={selectListByIndex}
              className={styles.mobileFooterDots}
            />
          </div>
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
          onSubmit={submitNewItem}
          onCancel={closeAddDialog}
          autoFocusTitle={isDesktop}
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
            autoFocusInput={isDesktop}
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
            listSlug: activeContext.listSlug,
            itemId: activeContext.itemId,
            value: activeContext.title
          });
        }}
        onDelete={() => {
          if (!activeContext) {
            return;
          }
          deleteItem(activeContext.listSlug, activeContext.itemId);
        }}
      />
    </section>
  );
};

export default Shopping;
