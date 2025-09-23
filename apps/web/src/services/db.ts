import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import type { BasicUser } from './auth';

export type ShoppingCategory = 'food' | 'household' | 'clothes';

export interface ShoppingItem {
  id: string;
  text: string;
  category: ShoppingCategory;
  isDone: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const toDate = (value?: Timestamp | null): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

const logAction = async (
  user: BasicUser | null,
  action: string,
  target: Record<string, unknown>
) => {
  const logsRef = collection(db, 'logs');
  await addDoc(logsRef, {
    user: user ? { id: user.id, name: user.name } : null,
    action,
    target,
    timestamp: serverTimestamp()
  });
};

export const subscribeShoppingByCategory = (
  category: ShoppingCategory,
  callback: (items: ShoppingItem[]) => void
) => {
  const shoppingRef = collection(db, 'shopping');
  const q = query(
    shoppingRef,
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as {
        text: string;
        category: ShoppingCategory;
        isDone: boolean;
        createdAt?: Timestamp;
        updatedAt?: Timestamp;
      };

      return {
        id: docSnap.id,
        text: data.text,
        category: data.category,
        isDone: data.isDone,
        createdAt: toDate(data.createdAt ?? null),
        updatedAt: toDate(data.updatedAt ?? null)
      } satisfies ShoppingItem;
    });

    callback(items);
  });
};

export const addShoppingItem = async (
  category: ShoppingCategory,
  text: string,
  user: BasicUser | null
) => {
  const shoppingRef = collection(db, 'shopping');
  const payload = {
    category,
    text,
    isDone: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const newDoc = await addDoc(shoppingRef, payload);
  await logAction(user, 'shopping:add', { id: newDoc.id, category, text });
};

export const toggleShoppingItem = async (
  id: string,
  isDone: boolean,
  user: BasicUser | null
) => {
  const itemRef = doc(db, 'shopping', id);
  await updateDoc(itemRef, { isDone, updatedAt: serverTimestamp() });
  await logAction(user, 'shopping:update', { id, isDone });
};

export const deleteShoppingItem = async (id: string, user: BasicUser | null) => {
  const itemRef = doc(db, 'shopping', id);
  await deleteDoc(itemRef);
  await logAction(user, 'shopping:delete', { id });
};

export const subscribeCalendar = (
  callback: (events: CalendarEvent[]) => void
) => {
  const calendarRef = collection(db, 'calendar');
  const q = query(calendarRef, orderBy('date', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as {
        title: string;
        date: string;
        description?: string;
        createdAt?: Timestamp;
        updatedAt?: Timestamp;
      };

      return {
        id: docSnap.id,
        title: data.title,
        date: data.date,
        description: data.description,
        createdAt: toDate(data.createdAt ?? null),
        updatedAt: toDate(data.updatedAt ?? null)
      } satisfies CalendarEvent;
    });

    callback(events);
  });
};

export const addCalendarEvent = async (
  event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
  user: BasicUser | null
) => {
  const calendarRef = collection(db, 'calendar');
  const payload = {
    title: event.title,
    date: event.date,
    description: event.description || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const newDoc = await addDoc(calendarRef, payload);
  await logAction(user, 'calendar:add', { id: newDoc.id, title: event.title });
  return newDoc.id;
};

export const updateCalendarEvent = async (
  id: string,
  event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  user: BasicUser | null
) => {
  const eventRef = doc(db, 'calendar', id);
  await updateDoc(eventRef, { ...event, updatedAt: serverTimestamp() });
  await logAction(user, 'calendar:update', { id, ...event });
};

export const deleteCalendarEvent = async (id: string, user: BasicUser | null) => {
  const eventRef = doc(db, 'calendar', id);
  await deleteDoc(eventRef);
  await logAction(user, 'calendar:delete', { id });
};

export const ensureBudgetPlaceholder = async () => {
  const budgetRef = collection(db, 'budget');
  const snap = await getDocs(query(budgetRef, limit(1)));

  if (snap.empty) {
    await addDoc(budgetRef, {
      placeholder: true,
      createdAt: serverTimestamp()
    });
  }
};

export const sendNotify = async (text: string) => {
  if (!text.trim()) {
    return;
  }

  const endpoint = import.meta.env.VITE_NOTIFY_ENDPOINT || '/notify';
  const apiKey = import.meta.env.VITE_NOTIFY_API_KEY;

  if (!apiKey) {
    console.warn('VITE_NOTIFY_API_KEY не задан. Уведомление не будет отправлено.');
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Notify request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Не удалось отправить уведомление', error);
  }
};
