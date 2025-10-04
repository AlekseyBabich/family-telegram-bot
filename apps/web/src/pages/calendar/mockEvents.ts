export type CalendarEvent = {
  id: string;
  dateISO: string;
  title: string;
};

type RandomGenerator = () => number;

const createRandom = (seed: number): RandomGenerator => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const TITLE_PARTS = [
  'Встреча',
  'Созвон',
  'Семья',
  'Друзья',
  'Праздник',
  'Покупки',
  'Спорт',
  'Врач',
  'Поручение',
  'Дети'
];

const ensureOverflowDay = (events: CalendarEvent[], year: number, month: number) => {
  if (events.length < 4) {
    return events;
  }

  const counts = new Map<string, number>();

  for (const event of events) {
    const dayKey = event.dateISO.slice(0, 10);
    counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
  }

  const hasOverflow = Array.from(counts.values()).some((count) => count > 3);

  if (hasOverflow) {
    return events;
  }

  const firstDayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(1).padStart(
    2,
    '0'
  )}`;
  const overflowDateISO = new Date(Date.UTC(year, month, 1, 9, 0, 0)).toISOString();

  for (let index = 0; index < Math.min(4, events.length); index += 1) {
    events[index] = {
      ...events[index],
      dateISO: overflowDateISO,
      id: `${events[index].id}-d${index}`
    };
  }

  counts.set(firstDayKey, Math.min(4, events.length));
  return events;
};

export const generateMonthlyMockEvents = (year: number, month: number): CalendarEvent[] => {
  const random = createRandom(year * 100 + month + 1);
  const eventsCount = 10 + Math.floor(random() * 11);
  const events: CalendarEvent[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < eventsCount; index += 1) {
    const day = 1 + Math.floor(random() * daysInMonth);
    const date = new Date(Date.UTC(year, month, day, 9, 0, 0));
    const titleIndex = Math.floor(random() * TITLE_PARTS.length);
    const titleSuffix = Math.floor(random() * 9) + 1;
    events.push({
      id: `${year}-${month}-${index}`,
      dateISO: date.toISOString(),
      title: `${TITLE_PARTS[titleIndex]} #${titleSuffix}`
    });
  }

  events.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  ensureOverflowDay(events, year, month);

  return events;
};
