import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

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

    expect(screen.getByRole('heading', { level: 2, name: 'Еда' })).toBeInTheDocument();

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
});
