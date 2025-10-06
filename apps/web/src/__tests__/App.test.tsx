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

  it('renders shopping current list heading', () => {
    renderWithRoute('/shopping');
    expect(screen.getByRole('heading', { name: 'Еда' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Покупки' })
    ).not.toBeInTheDocument();
  });

  it('renders calendar page content', () => {
    renderWithRoute('/calendar');
    expect(screen.getByTestId('calendar-bottom-nav')).toBeInTheDocument();
  });

  it('renders budget page title', () => {
    renderWithRoute('/budget');
    expect(screen.getByRole('heading', { level: 1, name: 'Бюджет' })).toBeInTheDocument();
  });
});
