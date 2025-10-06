import { describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { createShoppingService, type ShoppingService } from './firestore';
import type { ShoppingServiceDeps } from './firestore';

type ItemData = {
  title: string;
  titleLower?: string;
  checked: boolean;
  qty?: number;
  unit?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type QueryListener = (snapshot: {
  docs: Array<{ id: string; data: () => ItemData }>;
}) => void;

const collator = new Intl.Collator('ru-RU', { sensitivity: 'base' });

class FakeFirestore {
  private familyDoc: Record<string, unknown> | null = null;
  private listDocs = new Map<string, Record<string, unknown>>();
  private items = new Map<string, Map<string, ItemData>>();
  private listeners = new Map<string, { checked: Set<QueryListener>; unchecked: Set<QueryListener> }>();
  private idCounter = 0;

  public readonly deps: ShoppingServiceDeps = {
    collection: (_db, ...segments: string[]) => ({
      kind: 'collection',
      path: segments.join('/'),
      slug: segments[3]
    }),
    doc: (_db, ...segments: string[]) => ({
      kind: 'doc',
      path: segments.join('/'),
      slug: segments[3],
      id: segments[5]
    }),
    getDoc: async (ref: { path: string; slug?: string; id?: string }) => {
      if (ref.path === 'families/dev-family') {
        const exists = this.familyDoc !== null;
        return {
          exists: () => exists,
          data: () => this.familyDoc
        };
      }

      if (ref.slug && !ref.id) {
        const data = this.listDocs.get(ref.slug) ?? null;
        return {
          exists: () => data !== null,
          data: () => data
        };
      }

      if (ref.slug && ref.id) {
        const list = this.items.get(ref.slug);
        const data = list?.get(ref.id) ?? null;
        return {
          exists: () => data !== null,
          data: () => data
        };
      }

      return {
        exists: () => false,
        data: () => null
      };
    },
    setDoc: async (ref: { path: string; slug?: string }, data: Record<string, unknown>) => {
      if (ref.path === 'families/dev-family') {
        this.familyDoc = data;
        return;
      }

      if (ref.slug && !ref.path.endsWith('/items')) {
        this.listDocs.set(ref.slug, data);
        this.ensureList(ref.slug);
      }
    },
    addDoc: async (
      collectionRef: { slug?: string },
      data: ItemData & { createdAt?: unknown; updatedAt?: unknown }
    ) => {
      if (!collectionRef.slug) {
        return { id: '' };
      }

      const id = `item-${this.idCounter += 1}`;
      const items = this.ensureList(collectionRef.slug);
      items.set(id, data);
      this.notify(collectionRef.slug);
      return { id };
    },
    updateDoc: async (
      ref: { slug?: string; id?: string },
      data: Partial<ItemData> & { updatedAt?: unknown }
    ) => {
      if (!ref.slug || !ref.id) {
        return;
      }
      const items = this.ensureList(ref.slug);
      const current = items.get(ref.id);
      if (!current) {
        return;
      }
      items.set(ref.id, { ...current, ...data });
      this.notify(ref.slug);
    },
    deleteDoc: async (ref: { slug?: string; id?: string }) => {
      if (!ref.slug || !ref.id) {
        return;
      }
      const items = this.ensureList(ref.slug);
      items.delete(ref.id);
      this.notify(ref.slug);
    },
    where: (field: string, _op: string, value: unknown) => ({ field, value }),
    orderBy: (field: string) => ({ field }),
    query: (
      collectionRef: { slug?: string },
      whereClause: { field: string; value: unknown }
    ) => ({
      slug: collectionRef.slug as string,
      checked: Boolean(whereClause.value)
    }),
    serverTimestamp: () => new Date().toISOString()
  };

  public onSnapshot(
    queryRef: { slug: string; checked: boolean },
    callback: QueryListener
  ): () => void {
    const listeners = this.ensureListeners(queryRef.slug);
    const targetSet = queryRef.checked ? listeners.checked : listeners.unchecked;
    targetSet.add(callback);
    callback(this.createSnapshot(queryRef.slug, queryRef.checked));
    return () => {
      targetSet.delete(callback);
    };
  }

  public getItems(slug: string): Array<{ id: string; data: ItemData }> {
    const items = this.ensureList(slug);
    return Array.from(items.entries()).map(([id, data]) => ({ id, data }));
  }

  private ensureList(slug: string): Map<string, ItemData> {
    if (!this.items.has(slug)) {
      this.items.set(slug, new Map());
    }
    this.ensureListeners(slug);
    return this.items.get(slug) as Map<string, ItemData>;
  }

  private ensureListeners(slug: string) {
    if (!this.listeners.has(slug)) {
      this.listeners.set(slug, { checked: new Set(), unchecked: new Set() });
    }
    return this.listeners.get(slug) as { checked: Set<QueryListener>; unchecked: Set<QueryListener> };
  }

  private notify(slug: string) {
    const listeners = this.ensureListeners(slug);
    listeners.checked.forEach((listener) => listener(this.createSnapshot(slug, true)));
    listeners.unchecked.forEach((listener) => listener(this.createSnapshot(slug, false)));
  }

  private createSnapshot(slug: string, checked: boolean) {
    const list = this.ensureList(slug);
    const filtered = Array.from(list.entries())
      .filter(([, value]) => value.checked === checked)
      .sort(([, a], [, b]) => {
        const left = a.titleLower ?? a.title;
        const right = b.titleLower ?? b.title;
        const base = collator.compare(left, right);
        if (base !== 0) {
          return base;
        }
        return collator.compare(a.title, b.title);
      })
      .map(([id, data]) => ({ id, data }));

    return {
      docs: filtered.map(({ id, data }) => ({ id, data: () => data }))
    };
  }
}

describe('shopping firestore service (in-memory)', () => {
  const createService = () => {
    const fake = new FakeFirestore();
    const service: ShoppingService = createShoppingService(fake as unknown as Firestore, fake.deps);
    return { fake, service };
  };

  it('adds new items with unchecked state and lowercase title', async () => {
    const { fake, service } = createService();
    await service.ensureDevData();

    await service.addItem('food', 'Абрикос');
    const items = fake.getItems('food');
    expect(items).toHaveLength(1);
    expect(items[0]?.data.checked).toBe(false);
    expect(items[0]?.data.titleLower).toBe('абрикос');
  });

  it('moves items across checked queries and preserves ordering', async () => {
    const { fake, service } = createService();
    await service.ensureDevData();

    const uncheckedHistory: string[][] = [];
    const checkedHistory: string[][] = [];
    const latestUncheckedDocs: Array<{ id: string; data: () => ItemData }> = [];

    const queries = service.getQueries('food');
    const unsubscribeUnchecked = fake.onSnapshot(queries.unchecked, (snapshot) => {
      latestUncheckedDocs.splice(0, latestUncheckedDocs.length, ...snapshot.docs);
      uncheckedHistory.push(snapshot.docs.map((doc) => doc.data().title));
    });
    const unsubscribeChecked = fake.onSnapshot(queries.checked, (snapshot) => {
      checkedHistory.push(snapshot.docs.map((doc) => doc.data().title));
    });

    await service.addItem('food', 'Банан');
    await service.addItem('food', 'Абрикос');

    expect(uncheckedHistory.at(-1)).toEqual(['Абрикос', 'Банан']);

    const bananaDoc = latestUncheckedDocs.find((doc) => doc.data().title === 'Банан');
    expect(bananaDoc).toBeDefined();
    await service.toggleChecked('food', bananaDoc?.id ?? '', true);

    expect(uncheckedHistory.at(-1)).toEqual(['Абрикос']);
    expect(checkedHistory.at(-1)).toEqual(['Банан']);

    await service.removeItem('food', bananaDoc?.id ?? '');
    expect(checkedHistory.at(-1)).toEqual([]);

    unsubscribeUnchecked();
    unsubscribeChecked();
  });
});
