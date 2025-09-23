import { FormEvent, useEffect, useState } from 'react';
import type { BasicUser } from '../services/auth';
import SectionCard from './SectionCard';
import {
  addCalendarEvent,
  deleteCalendarEvent,
  sendNotify,
  subscribeCalendar,
  updateCalendarEvent,
  type CalendarEvent
} from '../services/db';
import { TEXT } from '../constants/ru';

interface CalendarListProps {
  user: BasicUser | null;
}

const CalendarList = ({ user }: CalendarListProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeCalendar(setEvents);
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setDescription('');
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !date.trim()) {
      return;
    }

    const payload = {
      title: title.trim(),
      date: date.trim(),
      description: description.trim() ? description.trim() : undefined
    };

    const eventId = await addCalendarEvent(payload, user);
    await sendNotify(TEXT.calendar.notify.added(payload.title, payload.date));
    resetForm();
    return eventId;
  };

  const handleDelete = async (calendarEvent: CalendarEvent) => {
    if (!confirm(TEXT.calendar.deleteConfirm(calendarEvent.title))) {
      return;
    }

    await deleteCalendarEvent(calendarEvent.id, user);
    await sendNotify(TEXT.calendar.notify.deleted(calendarEvent.title));
  };

  const handleEdit = async (calendarEvent: CalendarEvent) => {
    const newTitle = prompt(TEXT.calendar.prompts.name, calendarEvent.title);
    if (newTitle === null) {
      return;
    }

    const newDate = prompt(TEXT.calendar.prompts.date, calendarEvent.date);
    if (newDate === null) {
      return;
    }

    const newDescription = prompt(
      TEXT.calendar.prompts.description,
      calendarEvent.description ?? ''
    );

    const payload = {
      title: newTitle.trim() || calendarEvent.title,
      date: newDate.trim() || calendarEvent.date,
      description: newDescription?.trim() ? newDescription.trim() : undefined
    };

    await updateCalendarEvent(calendarEvent.id, payload, user);
    await sendNotify(TEXT.calendar.notify.updated(payload.title, payload.date));
  };

  return (
    <SectionCard
      title={TEXT.calendar.title}
      actions={
        <form className="calendar-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder={TEXT.calendar.form.namePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            aria-label={TEXT.calendar.form.datePlaceholder}
          />
          <input
            type="text"
            placeholder={TEXT.calendar.form.descriptionPlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">{TEXT.calendar.form.addButton}</button>
        </form>
      }
    >
      <ul className="calendar-list">
        {events.map((calendarEvent) => (
          <li key={calendarEvent.id}>
            <div>
              <strong>{calendarEvent.title}</strong>
              <span className="calendar-date">{calendarEvent.date}</span>
              {calendarEvent.description && (
                <p className="calendar-description">{calendarEvent.description}</p>
              )}
            </div>
            <div className="calendar-actions">
              <button type="button" onClick={() => handleEdit(calendarEvent)}>
                {TEXT.calendar.actions.edit}
              </button>
              <button type="button" onClick={() => handleDelete(calendarEvent)}>
                {TEXT.calendar.actions.delete}
              </button>
            </div>
          </li>
        ))}
        {events.length === 0 && <li className="empty">{TEXT.calendar.empty}</li>}
      </ul>
    </SectionCard>
  );
};

export default CalendarList;
