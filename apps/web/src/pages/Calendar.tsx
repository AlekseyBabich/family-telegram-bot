import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState
} from 'react';
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

const getEventTime = (event: CalendarEvent) => {
  const match = event.dateISO.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

const sortCalendarEvents = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    const timeA = getEventTime(a);
    const timeB = getEventTime(b);

    if (timeA && timeB) {
      return timeA.localeCompare(timeB, 'ru');
    }

    if (timeA && !timeB) {
      return -1;
    }

    if (!timeA && timeB) {
      return 1;
    }

    return a.title.localeCompare(b.title, 'ru');
  });
};

const generateEventId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const getDateKeyFromISO = (isoString: string) => isoString.slice(0, 10);

const Calendar = () => {
  const today = useMemo(() => getStartOfDay(new Date()), []);
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [yearCursor, setYearCursor] = useState<number>(today.getFullYear());
  const [isDayModalOpen, setDayModalOpen] = useState(false);
  const [customEventsByDate, setCustomEventsByDate] = useState<
    Record<string, CalendarEvent[]>
  >({});
  const [removedEventIds, setRemovedEventIds] = useState<Set<string>>(new Set());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<
    | {
        event: CalendarEvent;
        position: { x: number; y: number };
      }
    | null
  >(null);

  const { getEventsForDate } = useMonthEvents();

  const handleSelectDate = useCallback((date: Date) => {
    const normalized = getStartOfDay(date);
    setSelectedDate(normalized);
    setMonthCursor(new Date(normalized.getFullYear(), normalized.getMonth(), 1));
    setYearCursor(normalized.getFullYear());
  }, []);

  const handleOpenDayModal = useCallback(
    (date: Date) => {
      handleSelectDate(date);
      setFormError(null);
      setContextMenu(null);
      setDayModalOpen(true);
    },
    [handleSelectDate]
  );

  const handleCloseDayModal = useCallback(() => {
    setDayModalOpen(false);
    setContextMenu(null);
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

  const getAugmentedEventsForDate = useCallback(
    (date: Date) => {
      const dateKey = toDateKey(date);
      const baseEvents = getEventsForDate(date).filter(
        (event) => !removedEventIds.has(event.id)
      );
      const customEvents = customEventsByDate[dateKey] ?? [];

      return [...baseEvents, ...customEvents];
    },
    [customEventsByDate, getEventsForDate, removedEventIds]
  );

  const dayEvents = useMemo(
    () => sortCalendarEvents(getAugmentedEventsForDate(selectedDate)),
    [getAugmentedEventsForDate, selectedDate]
  );

  const formatDayDialogHeading = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return (date: Date) => {
      const formatted = formatter.format(date);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };
  }, []);

  const handleAddEvent = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = newEventTitle.trim();
      if (!trimmedTitle) {
        setFormError('Описание обязательно');
        return;
      }

      const dateKey = toDateKey(selectedDate);
      const time = newEventTime;
      const timeSegment = time ? `T${time}:00` : '';
      const newEvent: CalendarEvent = {
        id: generateEventId(),
        dateISO: `${dateKey}${timeSegment}`,
        title: trimmedTitle
      };

      setCustomEventsByDate((current) => {
        const eventsForDate = current[dateKey] ?? [];
        return {
          ...current,
          [dateKey]: [...eventsForDate, newEvent]
        };
      });
      setNewEventTitle('');
      setNewEventTime('');
      setFormError(null);
    },
    [newEventTime, newEventTitle, selectedDate]
  );

  const handleDeleteEvent = useCallback(
    (eventToDelete: CalendarEvent) => {
      const dateKey = getDateKeyFromISO(eventToDelete.dateISO);
      const customEvents = customEventsByDate[dateKey] ?? [];

      if (customEvents.some((item) => item.id === eventToDelete.id)) {
        setCustomEventsByDate((current) => {
          const existing = current[dateKey] ?? [];
          const remaining = existing.filter(
            (item) => item.id !== eventToDelete.id
          );

          if (remaining.length === 0) {
            const { [dateKey]: _removed, ...rest } = current;
            return rest;
          }

          return {
            ...current,
            [dateKey]: remaining
          };
        });
      } else {
        setRemovedEventIds((current) => {
          const next = new Set(current);
          next.add(eventToDelete.id);
          return next;
        });
      }

      setContextMenu(null);
    },
    [customEventsByDate]
  );

  const handleEventClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, calendarEvent: CalendarEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const nativeEvent = event.nativeEvent as MouseEvent;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = nativeEvent.clientX || rect.left + rect.width / 2;
      const y = nativeEvent.clientY || rect.top + rect.height / 2;

      setContextMenu({
        event: calendarEvent,
        position: { x, y }
      });
    },
    []
  );

  const handleTimeFieldFocus = useCallback((element: HTMLInputElement | null) => {
    element?.showPicker?.();
  }, []);

  const handleTimeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Backspace',
        'Delete',
        'Home',
        'End'
      ];

      if (!allowedKeys.includes(event.key)) {
        event.preventDefault();
      }
    },
    []
  );

  const hasEvents = dayEvents.length > 0;
  const dialogTitleId = 'calendar-day-dialog-title';

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
              onClick={() => handleOpenDayModal(day)}
            >
              <span>{day.getDate()}</span>
            </button>
          );
        })}
      </div>
    </>
  );

  const WEEK_GRID_CLASSNAMES = useMemo(
    () => [
      'calendar-week-day--monday',
      'calendar-week-day--tuesday',
      'calendar-week-day--wednesday',
      'calendar-week-day--thursday',
      'calendar-week-day--friday',
      'calendar-week-day--saturday',
      'calendar-week-sunday calendar-week-day--sunday'
    ],
    []
  );

  const renderWeekView = () => (
    <div className="calendar-week-grid" data-testid="calendar-week-grid">
      {weekDays.map((day, index) => {
        const events = sortCalendarEvents(getAugmentedEventsForDate(day));
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
            } ${WEEK_GRID_CLASSNAMES[index] ?? ''}`.trim()}
            aria-label={`Выбрать ${new Intl.DateTimeFormat('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(day)}`}
            onClick={() => handleOpenDayModal(day)}
          >
            <div
              className="calendar-week-day-caption"
              data-caption-size="shared"
              data-nowrap="true"
            >
              {formatWeekdayLabel(day)}
            </div>
            <ul className="calendar-week-event-list">
              {visibleEvents.map((eventItem) => (
                <li key={eventItem.id} className="calendar-week-event-item">
                  <span className="calendar-week-event-bullet" aria-hidden="true">
                    •
                  </span>
                  <span className="calendar-week-event-text">{eventItem.title}</span>
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

  const menuPosition = (() => {
    if (!contextMenu) {
      return null;
    }

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const maxLeft = viewportWidth ? Math.max(viewportWidth - 160, 16) : contextMenu.position.x;
    const safeLeft = viewportWidth
      ? Math.min(Math.max(contextMenu.position.x, 16), maxLeft)
      : contextMenu.position.x;
    const maxTop = viewportHeight ? Math.max(viewportHeight - 80, 16) : contextMenu.position.y - 20;
    const safeTop = viewportHeight
      ? Math.min(Math.max(contextMenu.position.y - 20, 16), maxTop)
      : contextMenu.position.y - 20;

    return { top: safeTop, left: safeLeft };
  })();

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
      {isDayModalOpen ? (
        <div
          className="calendar-day-dialog-backdrop"
          data-testid="calendar-day-dialog-backdrop"
        >
          <div
            className="calendar-day-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onMouseDownCapture={() => setContextMenu(null)}
          >
            <header className="calendar-day-dialog-header">
              <h2 id={dialogTitleId}>{formatDayDialogHeading(selectedDate)}</h2>
            </header>
            <div className="calendar-day-dialog-body">
              <ul className="calendar-day-dialog-events" data-testid="calendar-day-event-list">
                {hasEvents ? (
                  dayEvents.map((eventItem) => {
                    const time = getEventTime(eventItem);

                    return (
                      <li key={eventItem.id} className="calendar-day-event-item">
                        <button
                          type="button"
                          className="calendar-day-event-button"
                          onClick={(clickEvent) =>
                            handleEventClick(clickEvent, eventItem)
                          }
                          aria-haspopup="menu"
                          aria-expanded={
                            contextMenu?.event.id === eventItem.id ? 'true' : undefined
                          }
                          data-testid="calendar-day-event"
                        >
                          <span
                            className="calendar-day-event-bullet"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span className="calendar-day-event-title">
                            {eventItem.title}
                          </span>
                          <span className="calendar-day-event-time">
                            {time ?? ''}
                          </span>
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="calendar-day-event-empty">Событий нет</li>
                )}
              </ul>
              <form className="calendar-day-dialog-form" onSubmit={handleAddEvent}>
                <div className="calendar-day-form-field">
                  <label htmlFor="calendar-day-description">Описание</label>
                  <input
                    id="calendar-day-description"
                    name="description"
                    type="text"
                    required
                    value={newEventTitle}
                    onChange={(event) => {
                      setNewEventTitle(event.target.value);
                      if (formError) {
                        setFormError(null);
                      }
                    }}
                    placeholder="Введите описание"
                  />
                </div>
                <div className="calendar-day-form-field">
                  <label htmlFor="calendar-day-time">Время</label>
                  <input
                    id="calendar-day-time"
                    name="time"
                    type="time"
                    step={1800}
                    inputMode="none"
                    value={newEventTime}
                    onChange={(event) => setNewEventTime(event.target.value)}
                    onFocus={(event) => handleTimeFieldFocus(event.target)}
                    onKeyDown={handleTimeKeyDown}
                    placeholder="--:--"
                  />
                </div>
                {formError ? (
                  <div className="calendar-day-dialog-error" role="alert">
                    {formError}
                  </div>
                ) : null}
                <button type="submit" className="calendar-day-dialog-submit">
                  Добавить
                </button>
              </form>
            </div>
            <div className="calendar-day-dialog-footer">
              <button
                type="button"
                className="calendar-day-dialog-back"
                onClick={handleCloseDayModal}
              >
                Назад
              </button>
            </div>
          </div>
          {contextMenu && menuPosition ? (
            <div
              className="calendar-day-context-menu"
              role="menu"
              aria-label="Действия с событием"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => handleDeleteEvent(contextMenu.event)}
              >
                Удалить
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default Calendar;
