import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Shopping from './Shopping';
import { createInitialShoppingLists } from './shoppingData';

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

  const getFirstChecklistItem = () => {
    const firstScreen = screen.getByTestId('shopping-screen-0');
    return within(firstScreen).getAllByRole('button')[0];
  };

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

  it('marks checklist items with pan-y touch action so swipes start over them', () => {
    renderShopping();

    const firstItem = getFirstChecklistItem();
    expect(firstItem.style.touchAction).toBe('pan-y');
  });

  it('detects a horizontal swipe that starts on a checklist item', async () => {
    renderShopping();

    const firstItem = getFirstChecklistItem();

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

  it('ignores a mostly vertical drag that starts on a checklist item', async () => {
    renderShopping();

    const firstItem = getFirstChecklistItem();
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

  it('stops at the bounds when swiping beyond available screens', async () => {
    renderShopping();

    const content = screen.getByTestId('shopping-mobile-content');

    // Swipe right on the first screen – should stay at index 0.
    dispatchSwipe(
      content,
      { x: 100, y: 220 },
      [
        { x: 150, y: 224 },
        { x: 200, y: 228 }
      ],
      { x: 250, y: 232 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('0%'));

    // Swipe left twice to reach the last screen.
    dispatchSwipe(
      content,
      { x: 260, y: 220 },
      [
        { x: 210, y: 216 },
        { x: 160, y: 212 }
      ],
      { x: 120, y: 208 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));

    dispatchSwipe(
      content,
      { x: 260, y: 220 },
      [
        { x: 210, y: 216 },
        { x: 160, y: 212 }
      ],
      { x: 100, y: 208 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));

    // One more left swipe should keep us at the last screen.
    dispatchSwipe(
      content,
      { x: 250, y: 220 },
      [
        { x: 200, y: 216 },
        { x: 150, y: 212 }
      ],
      { x: 90, y: 208 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-200%'));

    // Swiping right once should return to the middle screen.
    dispatchSwipe(
      content,
      { x: 100, y: 220 },
      [
        { x: 150, y: 224 },
        { x: 200, y: 228 }
      ],
      { x: 240, y: 232 }
    );

    await waitFor(() => expect(getTrack().style.transform).toContain('-100%'));
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
