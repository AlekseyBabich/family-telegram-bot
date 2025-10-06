import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Shopping from './Shopping';
import { createInitialShoppingLists, type CheckItem, type ShoppingListData } from './shoppingData';
import * as shoppingDataModule from './shoppingData';

vi.mock('./shopping/hooks/useShoppingLists', () => {
  return {
    useShoppingLists: () => {
      const [lists, setLists] = React.useState<ShoppingListData[]>(() =>
        shoppingDataModule.createInitialShoppingLists()
      );

      const updateList = React.useCallback(
        (slug: string, updater: (items: CheckItem[]) => CheckItem[]) => {
          setLists((current) =>
            current.map((list) =>
              list.slug === slug
                ? { ...list, items: shoppingDataModule.sortItems(updater(list.items)) }
                : list
            )
          );
        },
        []
      );

      const addItem = React.useCallback(
        async (slug: string, title: string) => {
          updateList(slug, (items) => [
            ...items,
            {
              id: `mock-${Math.random().toString(36).slice(2)}`,
              title,
              done: false,
              titleLower: title.toLocaleLowerCase('ru-RU')
            }
          ]);
        },
        [updateList]
      );

      const toggleChecked = React.useCallback(
        async (slug: string, item: { id: string; done: boolean }) => {
          updateList(slug, (items) =>
            items.map((entry) =>
              entry.id === item.id ? { ...entry, done: !entry.done } : entry
            )
          );
        },
        [updateList]
      );

      const renameItem = React.useCallback(
        async (slug: string, itemId: string, value: string) => {
          updateList(slug, (items) =>
            items.map((entry) =>
              entry.id === itemId
                ? {
                    ...entry,
                    title: value,
                    titleLower: value.toLocaleLowerCase('ru-RU')
                  }
                : entry
            )
          );
        },
        [updateList]
      );

      const removeItem = React.useCallback(
        async (slug: string, itemId: string) => {
          updateList(slug, (items) => items.filter((entry) => entry.id !== itemId));
        },
        [updateList]
      );

      return React.useMemo(
        () => ({
          lists,
          addItem,
          toggleChecked,
          renameItem,
          removeItem
        }),
        [lists, addItem, toggleChecked, renameItem, removeItem]
      );
    }
  };
});

type SwipePoint = { x: number; y: number };

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width
  });
  window.dispatchEvent(new Event('resize'));
};

const dispatchSwipe = (
  element: HTMLElement,
  start: SwipePoint,
  moves: SwipePoint[],
  end: SwipePoint
) => {
  fireEvent.touchStart(element, {
    touches: [{ identifier: 0, clientX: start.x, clientY: start.y }]
  });

  moves.forEach((point) => {
    fireEvent.touchMove(element, {
      touches: [{ identifier: 0, clientX: point.x, clientY: point.y }]
    });
  });

  fireEvent.touchEnd(element, {
    changedTouches: [{ identifier: 0, clientX: end.x, clientY: end.y }]
  });
};

describe('Shopping mobile swipe container', () => {
  beforeEach(() => {
    setViewportWidth(390);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const renderShopping = () => render(<Shopping />);

  const getTrack = () => screen.getByTestId('shopping-track');

  const getChecklistItemAt = (screenIndex: number) => {
    const screenElement = screen.getByTestId(`shopping-screen-${screenIndex}`);
    return within(screenElement).getAllByRole('button')[0];
  };

  const getListForScreen = (screenIndex: number) => {
    const screenElement = screen.getByTestId(`shopping-screen-${screenIndex}`);
    return within(screenElement).getAllByRole('list')[0];
  };

  const expectAddButtonAsLastItem = (screenIndex: number) => {
    const list = getListForScreen(screenIndex);
    const lastElement = list.lastElementChild as HTMLElement | null;
    expect(lastElement).not.toBeNull();
    const addButton = within(lastElement as HTMLElement).getByRole('button', { name: '+ добавить' });
    expect(addButton).toBeInTheDocument();
    const position = window.getComputedStyle(lastElement as HTMLElement).position;
    expect(position === '' || position === 'static').toBe(true);
    expect(position).not.toBe('sticky');
    expect(position).not.toBe('fixed');
  };

  const extractButtonTitles = (container: HTMLElement) =>
    within(container)
      .getAllByRole('button')
      .map((element) => element.textContent?.trim())
      .filter((title): title is string => Boolean(title && title !== '+ добавить'));

  it('renders the first screen by default', async () => {
    renderShopping();

    const firstPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 1' });
    await waitFor(() => expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true'));
    await waitFor(() => expect(getTrack().style.transform).toContain('0%'));
  });

  it('moves to the next screen after a horizontal swipe', async () => {
    renderShopping();

    const content = screen.getByTestId('shopping-mobile-content');
    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));
    const secondPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 2' });
    await waitFor(() => expect(secondPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('cycles screens when tapping the navigation arrows', async () => {
    renderShopping();

    const nextButton = await screen.findByRole('button', { name: 'Следующий список' });
    const secondPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 2' });
    const thirdPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 3' });

    fireEvent.click(nextButton);
    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));
    await waitFor(() => expect(secondPagerDot).toHaveAttribute('aria-pressed', 'true'));

    fireEvent.click(nextButton);
    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));
    await waitFor(() => expect(thirdPagerDot).toHaveAttribute('aria-pressed', 'true'));

    fireEvent.click(nextButton);
    await waitFor(() => expect(getTrack().style.transform).toContain('0%'));
    const firstPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 1' });
    await waitFor(() => expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('updates the header with an uppercase category name for the active screen', async () => {
    renderShopping();

    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('ЕДА');

    const nextButton = await screen.findByRole('button', { name: 'Следующий список' });

    fireEvent.click(nextButton);
    await waitFor(() => expect(heading).toHaveTextContent('БЫТОВОЕ'));

    fireEvent.click(nextButton);
    await waitFor(() => expect(heading).toHaveTextContent('ВЕЩИ'));
  });

  it('marks checklist items with pan-y touch action so swipes start over them', () => {
    renderShopping();

    const firstItem = getChecklistItemAt(0);
    expect(firstItem.style.touchAction).toBe('pan-y');
  });

  it('detects a horizontal swipe that starts on a checklist item', async () => {
    renderShopping();

    const firstItem = getChecklistItemAt(0);

    dispatchSwipe(
      firstItem,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));
  });

  it('wraps to the first screen after swiping left on the last screen', async () => {
    renderShopping();

    const nextButton = await screen.findByRole('button', { name: 'Следующий список' });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));

    const lastItem = getChecklistItemAt(2);
    dispatchSwipe(
      lastItem,
      { x: 260, y: 220 },
      [
        { x: 210, y: 216 },
        { x: 160, y: 212 }
      ],
      { x: 100, y: 208 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('0%'));
    const firstPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 1' });
    await waitFor(() => expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('wraps to the last screen after swiping right on the first screen', async () => {
    renderShopping();

    const firstItem = getChecklistItemAt(0);

    dispatchSwipe(
      firstItem,
      { x: 100, y: 220 },
      [
        { x: 150, y: 224 },
        { x: 200, y: 228 }
      ],
      { x: 250, y: 232 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));
    const thirdPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 3' });
    await waitFor(() => expect(thirdPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('keeps pager dots visible while swiping and after wrap-around', async () => {
    renderShopping();

    const overlay = await screen.findByTestId('shopping-pager-overlay');
    expect(overlay).toBeInTheDocument();
    expect(window.getComputedStyle(overlay).pointerEvents).toBe('none');

    const firstPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 1' });
    expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true');

    const content = screen.getByTestId('shopping-mobile-content');
    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    const secondPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 2' });
    await waitFor(() => expect(secondPagerDot).toHaveAttribute('aria-pressed', 'true'));
    const dotsContainer = overlay.querySelector('[role="tablist"]') as HTMLElement | null;
    expect(dotsContainer).not.toBeNull();
    expect(window.getComputedStyle(dotsContainer as HTMLElement).pointerEvents).toBe('auto');

    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    const thirdPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 3' });
    await waitFor(() => expect(thirdPagerDot).toHaveAttribute('aria-pressed', 'true'));

    dispatchSwipe(
      content,
      { x: 260, y: 220 },
      [
        { x: 210, y: 216 },
        { x: 160, y: 212 }
      ],
      { x: 100, y: 208 }
    );

    await waitFor(() => expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('allows horizontal swipes that start on the pager dots and ignores vertical drags there', async () => {
    renderShopping();

    const dots = await screen.findByRole('tablist', { name: 'Списки покупок' });
    const content = screen.getByTestId('shopping-mobile-content');

    dispatchSwipe(
      dots,
      { x: 220, y: 420 },
      [
        { x: 190, y: 416 },
        { x: 150, y: 412 }
      ],
      { x: 120, y: 408 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));

    const afterHorizontal = getTrack().style.transform;

    dispatchSwipe(
      dots,
      { x: 200, y: 420 },
      [
        { x: 202, y: 460 },
        { x: 204, y: 500 }
      ],
      { x: 206, y: 540 }
    );

    await waitFor(() => expect(getTrack().style.transform).toBe(afterHorizontal));

    // Ensure swiping elsewhere still works after interacting with dots.
    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));
  });

  it('allows swiping in the blank space below the add button for short lists', async () => {
    vi.spyOn(shoppingDataModule, 'createInitialShoppingLists').mockReturnValue([
      {
        title: 'Короткий',
        slug: 'short',
        items: [
          {
            id: 'short-1',
            title: 'Единичный предмет',
            done: false
          }
        ]
      },
      {
        title: 'Второй',
        slug: 'second',
        items: [
          {
            id: 'second-1',
            title: 'Другой предмет',
            done: false
          }
        ]
      }
    ]);

    renderShopping();

    const list = getListForScreen(0);

    dispatchSwipe(
      list,
      { x: 240, y: 620 },
      [
        { x: 200, y: 616 },
        { x: 150, y: 612 }
      ],
      { x: 110, y: 608 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));

    const afterHorizontal = getTrack().style.transform;

    dispatchSwipe(
      list,
      { x: 200, y: 620 },
      [
        { x: 202, y: 660 },
        { x: 204, y: 700 }
      ],
      { x: 206, y: 740 }
    );

    await waitFor(() => expect(getTrack().style.transform).toBe(afterHorizontal));
  });

  it('renders the empty state message when a list has no items and keeps paging functional', async () => {
    vi.spyOn(shoppingDataModule, 'createInitialShoppingLists').mockReturnValue([
      {
        title: 'Пустой',
        slug: 'empty',
        items: []
      },
      {
        title: 'Соседний',
        slug: 'neighbor',
        items: [
          {
            id: 'neighbor-1',
            title: 'Соседний предмет',
            done: false
          }
        ]
      }
    ]);

    renderShopping();

    const firstList = getListForScreen(0);
    expect(within(firstList).getByText('список пуст')).toBeInTheDocument();
    expect(within(firstList).getByRole('button', { name: '+ добавить' })).toBeInTheDocument();

    const content = screen.getByTestId('shopping-mobile-content');

    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 110, y: 228 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));

    const secondList = getListForScreen(1);
    expect(within(secondList).queryByText('список пуст')).not.toBeInTheDocument();
  });

  it('separates checked items above unchecked ones and keeps alphabetical order inside sections', () => {
    renderShopping();

    const firstScreen = screen.getByTestId('shopping-screen-0');

    fireEvent.click(within(firstScreen).getByRole('button', { name: 'Авокадо' }));
    fireEvent.click(within(firstScreen).getByRole('button', { name: 'Рис жасмин' }));

    const list = getListForScreen(0);

    const selectedSection = within(list).getByTestId('shopping-section-selected');
    const selectedTitles = extractButtonTitles(selectedSection);
    const sortedSelected = [...selectedTitles].sort((a, b) =>
      a.localeCompare(b, 'ru', { sensitivity: 'base' })
    );
    expect(selectedTitles).toEqual(sortedSelected);

    const unselectedSection = within(list).getByTestId('shopping-section-unselected');
    const unselectedTitles = extractButtonTitles(unselectedSection);
    expect(unselectedTitles).not.toContain('Авокадо');
    expect(unselectedTitles).not.toContain('Рис жасмин');
    const sortedUnselected = [...unselectedTitles].sort((a, b) =>
      a.localeCompare(b, 'ru', { sensitivity: 'base' })
    );
    expect(unselectedTitles).toEqual(sortedUnselected);
  });

  it('moves items between sections when toggled', async () => {
    renderShopping();

    const firstScreen = screen.getByTestId('shopping-screen-0');
    const avocadoButton = within(firstScreen).getByRole('button', { name: 'Авокадо' });

    fireEvent.click(avocadoButton);

    const list = getListForScreen(0);

    await waitFor(() =>
      expect(within(list).getByTestId('shopping-section-selected')).toBeInTheDocument()
    );

    const selectedSection = within(list).getByTestId('shopping-section-selected');
    expect(within(selectedSection).getByRole('button', { name: 'Авокадо' })).toBeInTheDocument();

    fireEvent.click(within(selectedSection).getByRole('button', { name: 'Авокадо' }));

    await waitFor(() =>
      expect(within(list).queryByTestId('shopping-section-selected')).not.toBeInTheDocument()
    );

    const unselectedSection = within(list).getByTestId('shopping-section-unselected');
    expect(within(unselectedSection).getByRole('button', { name: 'Авокадо' })).toBeInTheDocument();
  });

  it('keeps the add button trailing items when list content changes', async () => {
    renderShopping();

    const lists = createInitialShoppingLists();

    lists.forEach((_, index) => expectAddButtonAsLastItem(index));

    for (let index = 0; index < lists.length; index += 1) {
      const listElement = getListForScreen(index);
      const addEntry = within(listElement).getByTestId('shopping-add-entry');
      const addButton = within(addEntry).getByRole('button', { name: '+ добавить' });

      fireEvent.click(addButton);

      const categorySelect = await screen.findByLabelText('Категория');
      fireEvent.change(categorySelect, { target: { value: lists[index]?.title ?? '' } });

      const titleInput = await screen.findByLabelText('Название');
      const newItemTitle = `Новый элемент ${index + 1}`;
      fireEvent.change(titleInput, { target: { value: newItemTitle } });

      fireEvent.click(await screen.findByRole('button', { name: 'Добавить' }));

      await waitFor(() =>
        expect(within(getListForScreen(index)).getByRole('button', { name: newItemTitle })).toBeInTheDocument()
      );

      expectAddButtonAsLastItem(index);

      const createdItem = within(getListForScreen(index)).getByRole('button', {
        name: newItemTitle
      });

      fireEvent.contextMenu(createdItem, { clientX: 100, clientY: 100 });

      fireEvent.click(await screen.findByRole('menuitem', { name: 'Удалить' }));

      await waitFor(() =>
        expect(
          within(getListForScreen(index)).queryByRole('button', { name: newItemTitle })
        ).not.toBeInTheDocument()
      );

      expectAddButtonAsLastItem(index);
    }
  });

  it('ignores a mostly vertical drag that starts on a checklist item', async () => {
    renderShopping();

    const firstItem = getChecklistItemAt(0);
    const initialTransform = getTrack().style.transform;

    dispatchSwipe(
      firstItem,
      { x: 180, y: 240 },
      [
        { x: 176, y: 280 },
        { x: 172, y: 320 }
      ],
      { x: 170, y: 360 }
    );

    await waitFor(() => expect(getTrack().style.transform).toBe(initialTransform));
  });

  it('ignores a mostly vertical swipe gesture', async () => {
    renderShopping();

    const content = screen.getByTestId('shopping-mobile-content');
    dispatchSwipe(
      content,
      { x: 180, y: 240 },
      [
        { x: 176, y: 280 },
        { x: 172, y: 320 }
      ],
      { x: 170, y: 360 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('0%'));
    const firstPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 1' });
    await waitFor(() => expect(firstPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });

  it('keeps the current screen when toggling checklist items', async () => {
    renderShopping();

    const initialTransform = getTrack().style.transform;
    const firstScreen = screen.getByTestId('shopping-screen-0');
    const firstList = within(firstScreen).getAllByRole('list')[0];
    const firstItem = within(firstList).getAllByRole('button')[0];

    fireEvent.click(firstItem);

    await waitFor(() => expect(getTrack().style.transform).toBe(initialTransform));
  });

  it('keeps pager position when interacting with inputs inside other lists', async () => {
    renderShopping();

    const lists = createInitialShoppingLists();
    const content = screen.getByTestId('shopping-mobile-content');

    dispatchSwipe(
      content,
      { x: 240, y: 240 },
      [
        { x: 200, y: 236 },
        { x: 150, y: 232 }
      ],
      { x: 100, y: 228 }
    );

    const secondScreen = screen.getByTestId('shopping-screen-1');
    const addButton = within(secondScreen).getByRole('button', { name: '+ добавить' });

    fireEvent.click(addButton);

    const categorySelect = await screen.findByLabelText('Категория');
    fireEvent.change(categorySelect, { target: { value: lists[1]?.title ?? '' } });
    const titleInput = await screen.findByLabelText('Название');
    fireEvent.change(titleInput, { target: { value: 'Мыло' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Добавить' }));

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));
    const secondPagerDot = await screen.findByRole('button', { name: 'Перейти к списку 2' });
    await waitFor(() => expect(secondPagerDot).toHaveAttribute('aria-pressed', 'true'));
  });
});
