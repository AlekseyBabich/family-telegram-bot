import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Query
} from 'firebase/firestore';
import { SHOPPING_LISTS } from '../shoppingData';

const FAMILY_ID = 'dev-family';

type ShoppingListMeta = (typeof SHOPPING_LISTS)[number];

type ShoppingItemDocument = {
  title: string;
  titleLower?: string;
  checked: boolean;
  qty?: number;
  unit?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
};

export type ShoppingListQueries = {
  checked: Query<ShoppingItemDocument>;
  unchecked: Query<ShoppingItemDocument>;
};

type FirestoreDeps = {
  collection: typeof collection;
  doc: typeof doc;
  getDoc: typeof getDoc;
  setDoc: typeof setDoc;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  where: typeof where;
  orderBy: typeof orderBy;
  query: typeof query;
  serverTimestamp: typeof serverTimestamp;
};

const defaultDeps: FirestoreDeps = {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  query,
  serverTimestamp
};

export type ShoppingServiceDeps = FirestoreDeps;

export const createShoppingService = (db: Firestore, deps: FirestoreDeps = defaultDeps) => {
  const familyRef = deps.doc(db, 'families', FAMILY_ID);

  const listDoc = (slug: ShoppingListMeta['slug']) =>
    deps.doc(db, 'families', FAMILY_ID, 'lists', slug);

  const listItems = (slug: ShoppingListMeta['slug']) =>
    deps.collection(db, 'families', FAMILY_ID, 'lists', slug, 'items');

  const itemDoc = (slug: ShoppingListMeta['slug'], itemId: string) =>
    deps.doc(db, 'families', FAMILY_ID, 'lists', slug, 'items', itemId);

  const buildQuery = (slug: ShoppingListMeta['slug'], checked: boolean) =>
    deps.query(listItems(slug), deps.where('checked', '==', checked), deps.orderBy('titleLower'));

  const ensureListDocument = async (meta: ShoppingListMeta) => {
    const snapshot = await deps.getDoc(listDoc(meta.slug));
    if (!snapshot.exists()) {
      await deps.setDoc(listDoc(meta.slug), {
        name: meta.title,
        slug: meta.slug,
        createdAt: deps.serverTimestamp(),
        updatedAt: deps.serverTimestamp()
      });
    }
  };

  return {
    getFamilyRef: () => familyRef,
    getListDoc: listDoc,
    getItemsCollection: listItems,
    getQueries(slug: ShoppingListMeta['slug']): ShoppingListQueries {
      return {
        checked: buildQuery(slug, true),
        unchecked: buildQuery(slug, false)
      };
    },
    async ensureDevData(): Promise<void> {
      const familySnapshot = await deps.getDoc(familyRef);
      if (!familySnapshot.exists()) {
        await deps.setDoc(familyRef, {
          createdAt: deps.serverTimestamp(),
          updatedAt: deps.serverTimestamp()
        });
      }

      await Promise.all(SHOPPING_LISTS.map((meta) => ensureListDocument(meta)));
    },
    async addItem(listSlug: ShoppingListMeta['slug'], title: string): Promise<void> {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        return;
      }

      await deps.addDoc(listItems(listSlug), {
        title: normalizedTitle,
        titleLower: normalizedTitle.toLocaleLowerCase('ru-RU'),
        checked: false,
        createdAt: deps.serverTimestamp(),
        updatedAt: deps.serverTimestamp()
      });
    },
    async toggleChecked(
      listSlug: ShoppingListMeta['slug'],
      itemId: string,
      nextChecked: boolean
    ): Promise<void> {
      await deps.updateDoc(itemDoc(listSlug, itemId), {
        checked: nextChecked,
        updatedAt: deps.serverTimestamp()
      });
    },
    async renameItem(
      listSlug: ShoppingListMeta['slug'],
      itemId: string,
      title: string
    ): Promise<void> {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        return;
      }

      await deps.updateDoc(itemDoc(listSlug, itemId), {
        title: normalizedTitle,
        titleLower: normalizedTitle.toLocaleLowerCase('ru-RU'),
        updatedAt: deps.serverTimestamp()
      });
    },
    async removeItem(listSlug: ShoppingListMeta['slug'], itemId: string): Promise<void> {
      await deps.deleteDoc(itemDoc(listSlug, itemId));
    }
  };
};

export type ShoppingService = ReturnType<typeof createShoppingService>;
