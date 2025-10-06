import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { createInitialShoppingLists, type CheckItem, type ShoppingListData } from '../pages/shoppingData';
import * as shoppingDataModule from '../pages/shoppingData';

vi.mock('../pages/shopping/hooks/useShoppingLists', () => {
  type ShoppingErrorMock = {
    source:
      | 'subscribe:checked'
      | 'subscribe:unchecked'
      | 'addItem'
      | 'toggleChecked'
      | 'renameItem'
      | 'removeItem';
    userMessage: string;
    error: unknown;
  };

  type AddItemMockArgs = {
    slug: string;
    title: string;
    updateList: (slug: string, updater: (items: CheckItem[]) => CheckItem[]) => void;
    defaultAddItem: (slug: string, title: string) => Promise<void>;
  };

  const mockImpls: { addItem?: (args: AddItemMockArgs) => Promise<void> | void } = {};

  const setMockAddItemImplementation = (
    impl?: (args: AddItemMockArgs) => Promise<void> | void
  ) => {
    mockImpls.addItem = impl ?? undefined;
  };

  const resetMocks = () => {
    mockImpls.addItem = undefined;
  };

  const registryKey = 'app';
  const globalRegistry = (globalThis as {
    __shoppingHooksTestRegistry?: Record<
      string,
      {
        __setMockAddItemImplementation: typeof setMockAddItemImplementation;
        __resetShoppingMocks: () => void;
      }
    >;
  }).__shoppingHooksTestRegistry;
  if (!globalRegistry) {
    (globalThis as any).__shoppingHooksTestRegistry = {
      [registryKey]: {
        __setMockAddItemImplementation: setMockAddItemImplementation,
        __resetShoppingMocks: resetMocks
      }
    };
  } else {
    globalRegistry[registryKey] = {
      __setMockAddItemImplementation: setMockAddItemImplementation,
      __resetShoppingMocks: resetMocks
    };
  }

  return {
    useShoppingLists: () => {
      const [lists, setLists] = React.useState<ShoppingListData[]>(() =>
        shoppingDataModule.createInitialShoppingLists()
      );
      const [error, setError] = React.useState<ShoppingErrorMock | null>(null);

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

      const defaultAddItem = React.useCallback(
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

      const addItem = React.useCallback(
        async (slug: string, title: string) => {
          try {
            const impl = mockImpls.addItem;
            if (impl) {
              await impl({ slug, title, updateList, defaultAddItem });
            } else {
              await defaultAddItem(slug, title);
            }
            setError((current) => (current?.source === 'addItem' ? null : current));
          } catch (err) {
            setError({
              source: 'addItem',
              userMessage: 'Не удалось добавить позицию. Попробуйте ещё раз.',
              error: err
            });
            throw err;
          }
        },
        [defaultAddItem]
      );

      const toggleChecked = React.useCallback(
        async (slug: string, item: { id: string; done: boolean }) => {
          updateList(slug, (items) =>
            items.map((entry) =>
              entry.id === item.id ? { ...entry, done: !entry.done } : entry
            )
          );
          setError((current) => (current?.source === 'toggleChecked' ? null : current));
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
          setError((current) => (current?.source === 'renameItem' ? null : current));
        },
        [updateList]
      );

      const removeItem = React.useCallback(
        async (slug: string, itemId: string) => {
          updateList(slug, (items) => items.filter((entry) => entry.id !== itemId));
          setError((current) => (current?.source === 'removeItem' ? null : current));
        },
        [updateList]
      );

      const clearError = React.useCallback(() => setError(null), []);

      return React.useMemo(
        () => ({
          lists,
          addItem,
          toggleChecked,
          renameItem,
          removeItem,
          error,
          clearError
        }),
        [lists, addItem, toggleChecked, renameItem, removeItem, error, clearError]
      );
    },
    __setMockAddItemImplementation: setMockAddItemImplementation,
    __resetShoppingMocks: resetMocks
  };
});

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
  window.dispatchEvent(new Event('resize'));
};

const getShoppingHooksModule = () => {
  const registry = (globalThis as {
    __shoppingHooksTestRegistry?: Record<
      string,
      {
        __setMockAddItemImplementation: (
          impl?: (args: {
            slug: string;
            title: string;
            updateList: (slug: string, updater: (items: CheckItem[]) => CheckItem[]) => void;
            defaultAddItem: (slug: string, title: string) => Promise<void>;
          }) => Promise<void> | void
        ) => void;
        __resetShoppingMocks: () => void;
      }
    >;
  }).__shoppingHooksTestRegistry;

  const entry = registry?.app;
  if (!entry) {
    throw new Error('Shopping hooks test registry is not initialised');
  }

  return entry;
};

const getRenderedLists = () =>
  screen
    .getAllByRole('list')
    .filter((list) => within(list).queryByTestId('shopping-add-entry'));

describe('Shopping page responsive behaviour', () => {
  beforeEach(() => {
    setViewportWidth(1024);
  });

afterEach(() => {
  cleanup();
  getShoppingHooksModule().__resetShoppingMocks();
});

  it('shows pager and switches lists via dots on mobile screens', () => {
    setViewportWidth(500);

    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'ЕДА' })).toBeInTheDocument();

    const firstDot = screen.getByRole('button', { name: 'Перейти к списку 1' });
    const secondDot = screen.getByRole('button', { name: 'Перейти к списку 2' });
    expect(firstDot).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(secondDot);

    expect(secondDot).toHaveAttribute('aria-pressed', 'true');

    const track = document.querySelector('.shopping-track') as HTMLElement;
    expect(track.style.transform).toContain('-100%');
  });

  it('renders all lists side by side on desktop screens', () => {
    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Еда' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Бытовое' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Вещи' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Перейти к списку/i })).not.toBeInTheDocument();
  });

  it('renders checklist items with emoji icons that toggle on click', async () => {
    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const initialLists = createInitialShoppingLists();
    const renderedLists = getRenderedLists();
    expect(renderedLists).toHaveLength(initialLists.length);

    initialLists.forEach((initialList, index) => {
      const renderedButtons = within(renderedLists[index]).getAllByRole('button');
      const checklistButtons = renderedButtons.filter((button) =>
        button.hasAttribute('aria-pressed')
      );
      expect(checklistButtons).toHaveLength(initialList.items.length);
      checklistButtons.forEach((button) => {
        expect(button).toHaveTextContent('❌');
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    const firstInitialList = initialLists[0];
    const firstRenderedList = renderedLists[0];
    const firstItemTitle = firstInitialList.items[0]?.title ?? '';
    const checklistButtons = within(firstRenderedList)
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-pressed'));
    const firstItem = checklistButtons[0];
    expect(firstItem).toBeDefined();
    expect(firstItem).toHaveTextContent(firstItemTitle);

    fireEvent.click(firstItem);
    const checkedButton = await screen.findByRole('button', { name: firstItemTitle });
    expect(checkedButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(checkedButton);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: firstItemTitle })
      ).toHaveAttribute('aria-pressed', 'false')
    );
  });

  it('never applies strikethrough styling to checklist text', () => {
    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const firstInitialList = createInitialShoppingLists()[0];
    const firstList = getRenderedLists()[0];
    const firstItemTitle = firstInitialList.items[0]?.title ?? '';
    const firstItem = within(firstList).getAllByRole('button')[0];
    expect(firstItem).toHaveTextContent(firstItemTitle);

    fireEvent.click(firstItem);

    expect(firstItem).not.toHaveStyle({ textDecoration: 'line-through' });
    expect(firstItem).not.toHaveStyle({ textDecorationLine: 'line-through' });
  });

  it('keeps swipe handlers attached without logging console errors', () => {
    const originalHref = window.location.href;
    window.history.pushState({}, '', '/shopping?debugSwipe=1');
    setViewportWidth(500);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const content = document.querySelector('.shopping-content') as HTMLElement | null;
    expect(content).not.toBeNull();

    if (content) {
      fireEvent.touchStart(content, {
        touches: [{ clientX: 10, clientY: 10 }]
      });
      fireEvent.touchMove(content, {
        touches: [{ clientX: 60, clientY: 12 }]
      });
      fireEvent.touchEnd(content, {
        changedTouches: [{ clientX: 60, clientY: 12 }]
      });
    }

    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    window.history.pushState({}, '', originalHref);
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('keeps the active tab after adding an item on mobile', async () => {
    setViewportWidth(500);

    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const secondDot = screen.getByRole('button', { name: 'Перейти к списку 2' });
    fireEvent.click(secondDot);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Перейти к списку 2' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );

    const lists = getRenderedLists();
    const householdPanel = lists[1]?.parentElement as HTMLElement;
    const addButton = within(householdPanel).getByRole('button', { name: '+ добавить' });
    fireEvent.click(addButton);

    const titleInput = screen.getByLabelText('Название');
    fireEvent.change(titleInput, { target: { value: 'Абажур настольный' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Перейти к списку 2' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
  });

  it('keeps the active tab after renaming an item on mobile', () => {
    setViewportWidth(500);

    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const thirdDot = screen.getByRole('button', { name: 'Перейти к списку 3' });
    fireEvent.click(thirdDot);
    expect(thirdDot).toHaveAttribute('aria-pressed', 'true');

    const lists = getRenderedLists();
    const thirdList = lists[2];
    const firstItem = within(thirdList).getAllByRole('button')[0];

    fireEvent.contextMenu(firstItem, { clientX: 100, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Переименовать' }));

    const renameInput = screen.getByLabelText('Название');
    fireEvent.change(renameInput, { target: { value: 'Новый плед' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(thirdDot).toHaveAttribute('aria-pressed', 'true');
  });
});
