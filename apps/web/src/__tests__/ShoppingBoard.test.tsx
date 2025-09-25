import { describe, expect, it, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  within,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import ShoppingBoard from '../components/ShoppingBoard';
import { LONG_PRESS_DURATION_MS } from '../components/ShoppingPager';

const getDesktopListTitles = (listId: string) => {
  const list = screen.getByTestId(`shopping-list-${listId}`);
  const items = Array.from(list.querySelectorAll('li')) as HTMLLIElement[];
  return items.map((item) => item.dataset.itemTitle ?? '');
};

describe('ShoppingBoard interactions', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('toggles item state on tap and keeps done items sorted', async () => {
    render(<ShoppingBoard />);
    const foodList = screen.getByTestId('shopping-list-list-1');
    const user = userEvent.setup();

    const milkItem = within(foodList).getByText('Молоко').closest('li');
    const breadItem = within(foodList).getByText('Хлеб').closest('li');
    expect(milkItem).not.toBeNull();
    expect(breadItem).not.toBeNull();
    if (!milkItem || !breadItem) {
      throw new Error('Required items not found');
    }

    await user.click(milkItem);
    await user.click(breadItem);

    expect(milkItem).toHaveAttribute('aria-pressed', 'true');
    expect(breadItem).toHaveAttribute('aria-pressed', 'true');

    const updatedTitles = getDesktopListTitles('list-1');
    expect(updatedTitles.slice(0, 2)).toEqual(['Молоко', 'Хлеб']);
  });

  it('opens delete menu on long press and removes the item', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ShoppingBoard />);

    const pager = screen.getByTestId('shopping-pager');
    Object.defineProperty(pager, 'clientWidth', { value: 320, configurable: true });

    const firstPage = screen.getByTestId('shopping-pager-page-list-1');
    const breadItem = within(firstPage).getByText('Хлеб').closest('li');
    expect(breadItem).not.toBeNull();
    if (!breadItem) {
      throw new Error('Bread item not found');
    }

    fireEvent.pointerDown(breadItem, {
      pointerId: 1,
      clientX: 12,
      clientY: 20,
      pointerType: 'touch',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LONG_PRESS_DURATION_MS);
    });

    fireEvent.pointerUp(breadItem, {
      pointerId: 1,
      clientX: 12,
      clientY: 20,
      pointerType: 'touch',
    });

    const deleteButton = await screen.findByRole('button', { name: 'Удалить' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Хлеб')).not.toBeInTheDocument();
    });
  });

  it('adds a new item through the modal in the active list', async () => {
    render(<ShoppingBoard />);
    const user = userEvent.setup();

    const addButton = screen.getByRole('button', { name: 'Добавить' });
    await user.click(addButton);

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByPlaceholderText('Например, яблоки');
    await user.type(input, 'Арбуз');

    const submit = within(dialog).getByRole('button', { name: 'Добавить' });
    await user.click(submit);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const foodList = screen.getByTestId('shopping-list-list-1');
    expect(within(foodList).getByText('Арбуз')).toBeInTheDocument();
  });

  it('changes the active list when swiping between pages', async () => {
    render(<ShoppingBoard />);

    const pager = screen.getByTestId('shopping-pager');
    Object.defineProperty(pager, 'clientWidth', { value: 320, configurable: true });

    fireEvent.pointerDown(pager, {
      pointerId: 5,
      clientX: 240,
      clientY: 10,
      pointerType: 'touch',
    });

    fireEvent.pointerMove(pager, {
      pointerId: 5,
      clientX: 120,
      clientY: 12,
      pointerType: 'touch',
    });

    fireEvent.pointerUp(pager, {
      pointerId: 5,
      clientX: 120,
      clientY: 12,
      pointerType: 'touch',
    });

    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    });
  });
});
