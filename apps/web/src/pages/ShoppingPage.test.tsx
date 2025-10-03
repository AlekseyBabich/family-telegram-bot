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

  const getChecklistItemAt = (screenIndex: number) => {
    const screenElement = screen.getByTestId(`shopping-screen-${screenIndex}`);
    return within(screenElement).getAllByRole('button')[0];
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
