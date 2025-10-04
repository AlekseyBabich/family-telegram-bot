import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CalendarEvent = {
  id: string;
  dateISO: string;
  title: string;
};

const eventsByMonth = vi.hoisted((): Record<string, CalendarEvent[]> => ({
  '2024-4': [
    { id: 'm1', dateISO: '2024-05-13T09:00:00.000Z', title: 'Понедельник' },
    { id: 'm2', dateISO: '2024-05-14T09:30:00.000Z', title: 'Вторник' },
    { id: 'm3', dateISO: '2024-05-15T08:00:00.000Z', title: 'Событие 1' },
    { id: 'm4', dateISO: '2024-05-15T10:00:00.000Z', title: 'Событие 2' },
    { id: 'm5', dateISO: '2024-05-15T12:00:00.000Z', title: 'Событие 3' },
    { id: 'm6', dateISO: '2024-05-15T14:00:00.000Z', title: 'Событие 4' },
    { id: 'm7', dateISO: '2024-05-19T09:00:00.000Z', title: 'Воскресенье' },
    { id: 'm8', dateISO: '2024-05-21T09:00:00.000Z', title: 'Событие 5' },
    { id: 'm9', dateISO: '2024-05-22T09:00:00.000Z', title: 'Событие 6' },
    { id: 'm10', dateISO: '2024-05-25T09:00:00.000Z', title: 'Событие 7' }
  ],
  '2024-5': [
    { id: 'j1', dateISO: '2024-06-10T09:00:00.000Z', title: 'Июнь' }
  ]
}));

vi.mock('./calendar/mockEvents', () => ({
  generateMonthlyMockEvents: vi.fn((year: number, month: number) => {
    const map = eventsByMonth as Record<string, CalendarEvent[]>;
    return map[`${year}-${month}`] ?? [];
  })
}));

import Calendar from './Calendar';

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
  window.dispatchEvent(new Event('resize'));
};

const resetViewportWidth = () => setViewportWidth(1024);

describe('Calendar page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T09:00:00.000Z'));
  });

  afterEach(() => {
    resetViewportWidth();
    cleanup();
    vi.useRealTimers();
  });

  it('renders the month grid starting on Monday with leading and trailing days', () => {
    render(<Calendar />);

    const monthGrid = screen.getByTestId('calendar-month-grid');
    const dayButtons = within(monthGrid).getAllByRole('button');

    const firstRowNumbers = dayButtons.slice(0, 7).map((button) => button.textContent?.trim());
    expect(firstRowNumbers).toEqual(['29', '30', '1', '2', '3', '4', '5']);

    const lastRowNumbers = dayButtons
      .slice(-7)
      .map((button) => button.textContent?.trim());
    expect(lastRowNumbers).toEqual(['27', '28', '29', '30', '31', '1', '2']);
  });

  it('highlights today and updates the selected day display when another day is chosen', () => {
    render(<Calendar />);

    const todayButton = screen.getByTestId('calendar-day-2024-05-15');
    expect(todayButton.className).toContain('calendar-day-today');
    expect(todayButton.className).toContain('calendar-day-selected');

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('15 мая 2024');

    const newDayButton = screen.getByTestId('calendar-day-2024-05-21');
    fireEvent.click(newDayButton);

    expect(newDayButton.className).toContain('calendar-day-selected');
    expect(status).toHaveTextContent('21 мая 2024');
  });

  it('renders the header with today\'s long-form date in bold and without the "Календарь" title', () => {
    render(<Calendar />);

    const todayHeading = screen.getByTestId('calendar-header-today');
    expect(todayHeading).toHaveTextContent('15 мая 2024');
    const boldElement = within(todayHeading).getByText('15 мая 2024');
    expect(boldElement.tagName).toBe('STRONG');
    expect(screen.queryByText('Календарь')).not.toBeInTheDocument();
  });

  it('switches months and years using the header arrows and opens a month from the year view', () => {
    render(<Calendar />);

    const nextMonthButton = screen.getByRole('button', { name: 'Следующий месяц' });
    fireEvent.click(nextMonthButton);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('июнь 2024');

    const yearTab = screen.getByRole('button', { name: 'Перейти к году' });
    fireEvent.click(yearTab);

    const nextYearButton = screen.getByRole('button', { name: 'Следующий год' });
    fireEvent.click(nextYearButton);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2025');

    const mayButton = screen.getByRole('button', { name: 'Открыть май 2025' });
    fireEvent.click(mayButton);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('май 2025');
  });

  it('changes views using the bottom navigation buttons', () => {
    render(<Calendar />);

    const weekButton = screen.getByRole('button', { name: 'Перейти к неделе' });
    const yearButton = screen.getByRole('button', { name: 'Перейти к году' });
    const monthButton = screen.getByRole('button', { name: 'Перейти к месяцу' });

    fireEvent.click(weekButton);
    expect(weekButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(yearButton);
    expect(yearButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(monthButton);
    expect(monthButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('lays out the week view with stacked columns and a wide Sunday tile on mobile width', () => {
    setViewportWidth(390);
    render(<Calendar />);

    const weekButton = screen.getByRole('button', { name: 'Перейти к неделе' });
    fireEvent.click(weekButton);

    const weekGrid = screen.getByTestId('calendar-week-grid');
    const dayTiles = within(weekGrid).getAllByRole('button');
    expect(dayTiles).toHaveLength(7);

    const sundayTile = screen.getByTestId('week-day-2024-05-19');
    expect(sundayTile.className).toContain('calendar-week-sunday');

    const mondayTile = screen.getByTestId('week-day-2024-05-13');
    expect(mondayTile).toHaveTextContent('Понедельник, 13');
    expect(sundayTile).toHaveTextContent('Воскресенье, 19');

    const expectedClassMap: Record<string, string> = {
      'week-day-2024-05-13': 'calendar-week-day--monday',
      'week-day-2024-05-14': 'calendar-week-day--tuesday',
      'week-day-2024-05-15': 'calendar-week-day--wednesday',
      'week-day-2024-05-16': 'calendar-week-day--thursday',
      'week-day-2024-05-17': 'calendar-week-day--friday',
      'week-day-2024-05-18': 'calendar-week-day--saturday',
      'week-day-2024-05-19': 'calendar-week-day--sunday'
    };

    Object.entries(expectedClassMap).forEach(([testId, className]) => {
      expect(screen.getByTestId(testId).className).toContain(className);
    });

    const captions = weekGrid.querySelectorAll('[data-caption-size="shared"]');
    expect(captions).toHaveLength(7);
    captions.forEach((caption) => {
      expect(caption.getAttribute('data-caption-size')).toBe('shared');
      expect(caption.getAttribute('data-nowrap')).toBe('true');
    });
  });

  it('renders at most three events per day in the week view and shows a +N indicator', () => {
    setViewportWidth(390);
    render(<Calendar />);

    fireEvent.click(screen.getByRole('button', { name: 'Перейти к неделе' }));

    const wednesdayTile = screen.getByTestId('week-day-2024-05-15');
    const eventsList = within(wednesdayTile).getByRole('list');
    const eventItems = within(eventsList).getAllByRole('listitem');
    const visibleTitles = eventItems.map((item) => item.textContent);

    expect(visibleTitles).toEqual(['•Событие 1', '•Событие 2', '•Событие 3', '+1']);

    const bulletItems = eventItems.slice(0, 3);
    bulletItems.forEach((item) => {
      expect(item.textContent?.startsWith('•')).toBe(true);
    });
  });

  it('hides empty-state placeholders on days without events and highlights today with dedicated markers', () => {
    setViewportWidth(390);
    render(<Calendar />);

    fireEvent.click(screen.getByRole('button', { name: 'Перейти к неделе' }));

    const todayTile = screen.getByTestId('week-day-2024-05-15');
    expect(todayTile).toHaveClass('calendar-day-today');
    expect(todayTile).toHaveAttribute('data-today', 'true');

    const thursdayTile = screen.getByTestId('week-day-2024-05-16');
    const thursdayEvents = within(thursdayTile).getByRole('list');
    expect(within(thursdayEvents).queryByText(/нет событий/i)).not.toBeInTheDocument();
  });

  it('renders bottom navigation without console warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    setViewportWidth(390);
    render(<Calendar />);

    fireEvent.click(screen.getByRole('button', { name: 'Перейти к неделе' }));

    expect(screen.getByTestId('calendar-week-grid')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-bottom-nav')).toBeInTheDocument();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('opens the day modal from month and week views with localized heading', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    let dialog = screen.getByRole('dialog');
    let heading = within(dialog).getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/^[А-ЯЁ][а-яё]+, \d+ [а-яё]+$/);
    expect(heading.textContent).toContain('мая');
    const subheading = within(dialog).getByText('Список дел');
    expect(subheading).toBeInTheDocument();
    expect(subheading.parentElement).toHaveClass('calendar-day-dialog-header');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Назад' }));

    fireEvent.click(screen.getByRole('button', { name: 'Перейти к неделе' }));
    fireEvent.click(screen.getByTestId('week-day-2024-05-14'));

    dialog = screen.getByRole('dialog');
    heading = within(dialog).getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/^[А-ЯЁ][а-яё]+, \d+ [а-яё]+$/);
    expect(heading.textContent).toContain('мая');
  });

  it('centers actions, time input, and aligns event times inside the day modal', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    const dialog = screen.getByRole('dialog');
    const actionsWrapper = within(dialog).getByTestId('calendar-day-dialog-actions');
    expect(actionsWrapper.className).toBe('calendar-day-dialog-actions');

    const actionButtons = within(actionsWrapper).getAllByTestId('calendar-day-dialog-action');
    expect(actionButtons).toHaveLength(2);
    actionButtons.forEach((button) => {
      expect(button.className).toContain('calendar-day-dialog-action-button');
    });
    expect(actionButtons[0]).toHaveTextContent('+ добавить');
    expect(actionButtons[0]).toHaveAttribute('type', 'submit');
    expect(actionButtons[1]).toHaveTextContent('Назад');
    expect(actionButtons[1]).toHaveAttribute('type', 'button');

    const timeField = within(dialog).getByTestId('calendar-day-time-field');
    expect(timeField.className).toBe('calendar-day-form-field calendar-day-time-field');

    const [firstEvent] = within(dialog).getAllByTestId('calendar-day-event');
    expect(firstEvent.className).toContain('calendar-day-event-button');
    const eventTime = within(firstEvent).getByText(/\d{2}:\d{2}/);
    expect(eventTime.className).toBe('calendar-day-event-time');
    expect(eventTime).toHaveAttribute('data-nowrap', 'true');
  });

  it('adds events with 30-minute time picker and sorts items placing untimed last', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    const dialog = screen.getByRole('dialog');
    const descriptionInput = within(dialog).getByLabelText('Описание');
    const timeInput = within(dialog).getByLabelText('Время');
    expect(timeInput).toHaveAttribute('step', '1800');
    expect(timeInput).toHaveAttribute('inputmode', 'none');

    fireEvent.change(descriptionInput, {
      target: { value: 'Прогулка в парке' }
    });
    fireEvent.change(timeInput, { target: { value: '10:30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '+ добавить' }));

    fireEvent.change(descriptionInput, {
      target: { value: 'Очень длинное событие без времени для проверки переноса' }
    });
    fireEvent.change(timeInput, { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '+ добавить' }));

    const eventButtons = within(dialog).getAllByTestId('calendar-day-event');
    const eventTexts = eventButtons.map((button) =>
      button.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    );

    const secondIndex = eventTexts.findIndex((text) => text.includes('Событие 2'));
    const thirdIndex = eventTexts.findIndex((text) => text.includes('Событие 3'));
    const walkIndex = eventTexts.findIndex((text) => text.includes('Прогулка в парке'));
    expect(secondIndex).toBeGreaterThanOrEqual(0);
    expect(thirdIndex).toBeGreaterThanOrEqual(0);
    expect(walkIndex).toBeGreaterThan(secondIndex);
    expect(walkIndex).toBeLessThan(thirdIndex);

    const lastButton = eventButtons[eventButtons.length - 1];
    expect(lastButton.textContent).toContain(
      'Очень длинное событие без времени для проверки переноса'
    );
    const lastTime =
      lastButton.querySelector('.calendar-day-event-time')?.textContent ?? '';
    expect(lastTime.trim()).toBe('');
  });

  it('renders bullet events without checkboxes and preserves long text', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    const dialog = screen.getByRole('dialog');
    const descriptionInput = within(dialog).getByLabelText('Описание');
    const timeInput = within(dialog).getByLabelText('Время');

    fireEvent.change(descriptionInput, {
      target: { value: 'Очень длинное описание события для проверки переноса текста' }
    });
    fireEvent.change(timeInput, { target: { value: '16:30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '+ добавить' }));

    const addedButton = within(dialog)
      .getAllByTestId('calendar-day-event')
      .find((button) =>
        button.textContent?.includes(
          'Очень длинное описание события для проверки переноса текста'
        )
      );

    expect(addedButton).toBeDefined();
    expect(addedButton?.textContent?.trim().startsWith('•')).toBe(true);
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(addedButton?.textContent).toContain(
      'Очень длинное описание события для проверки переноса текста'
    );
  });

  it('removes an event via the context menu delete action', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    const dialog = screen.getByRole('dialog');
    const targetButton = within(dialog)
      .getAllByTestId('calendar-day-event')
      .find((button) => button.textContent?.includes('Событие 2'));

    expect(targetButton).toBeDefined();
    if (!targetButton) {
      throw new Error('Target event not found');
    }

    fireEvent.click(targetButton);
    const deleteAction = screen.getByRole('menuitem', { name: 'Удалить' });
    fireEvent.click(deleteAction);

    const remainingTexts = within(dialog)
      .getAllByTestId('calendar-day-event')
      .map((button) => button.textContent ?? '');
    expect(remainingTexts.some((text) => text.includes('Событие 2'))).toBe(false);
  });

  it('closes only via the back button without reacting to backdrop or Esc', () => {
    render(<Calendar />);

    fireEvent.click(screen.getByTestId('calendar-day-2024-05-15'));

    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(screen.getByTestId('calendar-day-dialog-backdrop'));
    fireEvent.mouseUp(screen.getByTestId('calendar-day-dialog-backdrop'));
    expect(screen.getByRole('dialog')).toBe(dialog);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBe(dialog);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Назад' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
