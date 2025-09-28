import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App routes', () => {
  const renderWithRoute = (route: string) =>
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );

  it('renders shopping page title', () => {
    renderWithRoute('/shopping');
    expect(screen.getByRole('heading', { level: 1, name: 'Покупки' })).toBeInTheDocument();
  });

  it('renders calendar page title', () => {
    renderWithRoute('/calendar');
    expect(screen.getByRole('heading', { level: 1, name: 'Календарь' })).toBeInTheDocument();
  });

  it('renders budget page title', () => {
    renderWithRoute('/budget');
    expect(screen.getByRole('heading', { level: 1, name: 'Бюджет' })).toBeInTheDocument();
  });
});
