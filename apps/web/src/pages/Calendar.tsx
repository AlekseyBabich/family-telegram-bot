import { useCallback, useMemo, useRef, useState } from 'react';
import { CalendarEvent, generateMonthlyMockEvents } from './calendar/mockEvents';
import './Calendar.css';

type CalendarView = 'week' | 'month' | 'year';

const WEEKDAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MONTH_LABELS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

const formatLongDate = (date: Date) => {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);

  return formatted.replace(' г.', '');
};

const formatMonthHeading = (date: Date) => {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(date);

  return formatted.replace(' г.', '');
};

const getStartOfDay = (source: Date) =>
  new Date(source.getFullYear(), source.getMonth(), source.getDate());

const addDays = (source: Date, amount: number) => {
  const result = new Date(source);
  result.setDate(result.getDate() + amount);
  return getStartOfDay(result);
};

const addMonths = (source: Date, amount: number) =>
  new Date(source.getFullYear(), source.getMonth() + amount, 1);

const getMonthGrid = (monthDate: Date) => {
  const firstDayOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1
  );
  const leadingDays = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const startDate = addDays(firstDayOfMonth, -leadingDays);

  return Array.from({ length: totalCells }, (_, index) =>
    addDays(startDate, index)
  );
};

const getStartOfWeek = (date: Date) => {
  const start = getStartOfDay(date);
  const offset = (start.getDay() + 6) % 7;
  return addDays(start, -offset);
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const useMonthEvents = () => {
  const cacheRef = useRef(new Map<string, CalendarEvent[]>());

  const ensureMonthEvents = useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    const cache = cacheRef.current;

    if (!cache.has(key)) {
      cache.set(key, generateMonthlyMockEvents(year, month));
    }

    return cache.get(key) ?? [];
  }, []);

  const getEventsForDate = useCallback(
    (date: Date) => {
      const events = ensureMonthEvents(date.getFullYear(), date.getMonth());
      const key = toDateKey(date);
      return events.filter((event) => event.dateISO.startsWith(key));
    },
    [ensureMonthEvents]
  );

  return { getEventsForDate };
};

const Calendar = () => {
  const today = useMemo(() => getStartOfDay(new Date()), []);
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [yearCursor, setYearCursor] = useState<number>(today.getFullYear());

  const { getEventsForDate } = useMonthEvents();

  const handleSelectDate = useCallback((date: Date) => {
    const normalized = getStartOfDay(date);
    setSelectedDate(normalized);
    setMonthCursor(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
    setYearCursor(normalized.getFullYear());
  }, []);

  const handleChangeMonth = (amount: number) => {
    setMonthCursor((current) => {
      const next = addMonths(current, amount);
      setYearCursor(next.getFullYear());
      return next;
    });
  };

  const handleChangeYear = (amount: number) => {
    setYearCursor((current) => current + amount);
  };

  const monthDays = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);
  const weekStart = useMemo(() => getStartOfWeek(selectedDate), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const isToday = useCallback(
    (date: Date) => date.getTime() === today.getTime(),
    [today]
  );

  const isSelected = useCallback(
    (date: Date) => date.getTime() === selectedDate.getTime(),
    [selectedDate]
  );

  const weekdayLongFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long'
      }),
    []
  );

  const formatWeekdayLabel = useCallback(
    (date: Date) => {
      const weekday = weekdayLongFormatter.format(date);
      const capitalizedWeekday =
        weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${capitalizedWeekday}, ${date.getDate()}`;
    },
    [weekdayLongFormatter]
  );

  const renderMonthView = () => (
    <>
      <div className="calendar-header">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          className="calendar-arrow"
          onClick={() => handleChangeMonth(-1)}
        >
          ‹
        </button>
        <div className="calendar-header-title" role="heading" aria-level={2}>
          {formatMonthHeading(monthCursor)}
        </div>
        <button
          type="button"
          aria-label="Следующий месяц"
          className="calendar-arrow"
          onClick={() => handleChangeMonth(1)}
        >
          ›
        </button>
      </div>
      <div className="calendar-weekday-row" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="calendar-weekday-label">
            {label}
          </span>
        ))}
      </div>
      <div className="calendar-month-grid" data-testid="calendar-month-grid">
        {monthDays.map((day) => {
          const outsideCurrentMonth =
            day.getMonth() !== monthCursor.getMonth();
          const selected = isSelected(day);
          const todayMatch = isToday(day);

          return (
            <button
              key={toDateKey(day)}
              type="button"
              data-testid={`calendar-day-${toDateKey(day)}`}
              data-today={todayMatch ? 'true' : undefined}
              className={`calendar-month-day${
                outsideCurrentMonth ? ' calendar-day-outside' : ''
              }${selected ? ' calendar-day-selected' : ''}${
                todayMatch ? ' calendar-day-today' : ''
              }`}
              aria-label={`Выбрать ${new Intl.DateTimeFormat('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }).format(day)}`}
              onClick={() => handleSelectDate(day)}
            >
              <span>{day.getDate()}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  const renderWeekView = () => (
    <div className="calendar-week-grid" data-testid="calendar-week-grid">
      {weekDays.map((day, index) => {
        const events = getEventsForDate(day);
        const maxVisible = 3;
        const visibleEvents = events.slice(0, maxVisible);
        const remaining = events.length - visibleEvents.length;
        const selected = isSelected(day);
        const todayMatch = isToday(day);

        return (
          <button
            key={toDateKey(day)}
            type="button"
            data-testid={`week-day-${toDateKey(day)}`}
            data-today={todayMatch ? 'true' : undefined}
            className={`calendar-week-day${selected ? ' calendar-day-selected' : ''}${
              todayMatch ? ' calendar-day-today' : ''
            }${index === 6 ? ' calendar-week-sunday' : ''}`}
            aria-label={`Выбрать ${new Intl.DateTimeFormat('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(day)}`}
            onClick={() => handleSelectDate(day)}
          >
            <div className="calendar-week-day-header">
              {formatWeekdayLabel(day)}
            </div>
            <ul className="calendar-week-event-list">
              {visibleEvents.map((event) => (
                <li key={event.id} className="calendar-week-event-item">
                  {event.title}
                </li>
              ))}
              {remaining > 0 ? (
                <li className="calendar-week-event-more">+{remaining}</li>
              ) : null}
            </ul>
          </button>
        );
      })}
    </div>
  );

  const renderYearView = () => (
    <>
      <div className="calendar-header">
        <button
          type="button"
          aria-label="Предыдущий год"
          className="calendar-arrow"
          onClick={() => handleChangeYear(-1)}
        >
          ‹
        </button>
        <div className="calendar-header-title" role="heading" aria-level={2}>
          {yearCursor}
        </div>
        <button
          type="button"
          aria-label="Следующий год"
          className="calendar-arrow"
          onClick={() => handleChangeYear(1)}
        >
          ›
        </button>
      </div>
      <div className="calendar-year-grid">
        {MONTH_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            className="calendar-year-month"
            aria-label={`Открыть ${label.toLowerCase()} ${yearCursor}`}
            onClick={() => {
              const nextMonth = new Date(yearCursor, index, 1);
              handleSelectDate(nextMonth);
              setView('month');
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <section className="calendar-page">
      <div className="calendar-header-today" data-testid="calendar-header-today">
        <strong>{formatLongDate(today)}</strong>
      </div>
      <span className="visually-hidden" role="status" aria-live="polite">
        {formatLongDate(selectedDate)}
      </span>
      <div className="calendar-content">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'year' && renderYearView()}
      </div>
      <nav
        className="calendar-bottom-nav"
        aria-label="Переключение режимов календаря"
        data-testid="calendar-bottom-nav"
      >
        <button
          type="button"
          className={`calendar-bottom-button${
            view === 'week' ? ' calendar-bottom-button-active' : ''
          }`}
          aria-pressed={view === 'week'}
          aria-label="Перейти к неделе"
          onClick={() => setView('week')}
        >
          Неделя
        </button>
        <button
          type="button"
          className={`calendar-bottom-button${
            view === 'month' ? ' calendar-bottom-button-active' : ''
          }`}
          aria-pressed={view === 'month'}
          aria-label="Перейти к месяцу"
          onClick={() => setView('month')}
        >
          Месяц
        </button>
        <button
          type="button"
          className={`calendar-bottom-button${
            view === 'year' ? ' calendar-bottom-button-active' : ''
          }`}
          aria-pressed={view === 'year'}
          aria-label="Перейти к году"
          onClick={() => setView('year')}
        >
          Год
        </button>
      </nav>
    </section>
  );
};

export default Calendar;
