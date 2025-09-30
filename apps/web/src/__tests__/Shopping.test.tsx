import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { createInitialShoppingLists } from '../pages/shoppingData';

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Shopping page responsive behaviour', () => {
  beforeEach(() => {
    setViewportWidth(1024);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows pager and switches lists via dots on mobile screens', () => {
    setViewportWidth(500);

    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Еда' })).toBeInTheDocument();

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

  it('renders checklist items with emoji icons that toggle on click', () => {
    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const initialLists = createInitialShoppingLists();
    const renderedLists = screen.getAllByRole('list');
    expect(renderedLists).toHaveLength(initialLists.length);

    initialLists.forEach((initialList, index) => {
      const renderedItems = within(renderedLists[index]).getAllByRole('button');
      expect(renderedItems).toHaveLength(initialList.items.length);
      renderedItems.forEach((button) => {
        expect(button).toHaveTextContent('❌');
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });

    const firstInitialList = initialLists[0];
    const firstRenderedList = renderedLists[0];
    const firstItemTitle = firstInitialList.items[0]?.title ?? '';
    const firstItem = within(firstRenderedList).getAllByRole('button')[0];
    expect(firstItem).toHaveTextContent(firstItemTitle);

    fireEvent.click(firstItem);
    expect(firstItem).toHaveTextContent('✅');
    expect(firstItem).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(firstItem);
    expect(firstItem).toHaveTextContent('❌');
    expect(firstItem).toHaveAttribute('aria-pressed', 'false');
  });

  it('never applies strikethrough styling to checklist text', () => {
    render(
      <MemoryRouter initialEntries={["/shopping"]}>
        <App />
      </MemoryRouter>
    );

    const firstInitialList = createInitialShoppingLists()[0];
    const firstList = screen.getAllByRole('list')[0];
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
});
