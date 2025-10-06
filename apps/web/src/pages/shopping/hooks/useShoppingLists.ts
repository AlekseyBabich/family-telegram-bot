import { useCallback, useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { db } from '../../../shared/firebase';
import {
  SHOPPING_LISTS,
  buildShoppingSections,
  type CheckItem,
  type ShoppingItemRecord,
  type ShoppingListData
} from '../../shoppingData';
import { createShoppingService, type ShoppingService } from '../firestore';

type ListState = ShoppingListData;

type SnapshotState = {
  checked: ShoppingItemRecord[];
  unchecked: ShoppingItemRecord[];
};

const INITIAL_LISTS: ListState[] = SHOPPING_LISTS.map((meta) => ({
  title: meta.title,
  slug: meta.slug,
  items: []
}));

export const useShoppingLists = () => {
  const service: ShoppingService = useMemo(() => createShoppingService(db), []);
  const [lists, setLists] = useState<ListState[]>(INITIAL_LISTS);

  useEffect(() => {
    const unsubscribers = SHOPPING_LISTS.map((meta) => {
      let snapshotState: SnapshotState = { checked: [], unchecked: [] };

      const updateList = () => {
        const { allItems } = buildShoppingSections(snapshotState);
        setLists((current) =>
          current.map((list) =>
            list.slug === meta.slug
              ? {
                  ...list,
                  items: allItems
                }
              : list
          )
        );
      };

      const { checked, unchecked } = service.getQueries(meta.slug);

      const unsubscribeUnchecked = onSnapshot(
        unchecked,
        (querySnapshot) => {
          snapshotState = {
            ...snapshotState,
            unchecked: querySnapshot.docs.map((docSnapshot) => {
              const data = docSnapshot.data();
              return {
                id: docSnapshot.id,
                title: data.title ?? '',
                titleLower: data.titleLower,
                checked: false,
                qty: data.qty,
                unit: data.unit
              } satisfies ShoppingItemRecord;
            })
          };
          updateList();
        },
        (error) => {
          if (import.meta.env.DEV) {
            console.error('[shopping] Failed to subscribe to unchecked items', error);
          }
        }
      );

      const unsubscribeChecked = onSnapshot(
        checked,
        (querySnapshot) => {
          snapshotState = {
            ...snapshotState,
            checked: querySnapshot.docs.map((docSnapshot) => {
              const data = docSnapshot.data();
              return {
                id: docSnapshot.id,
                title: data.title ?? '',
                titleLower: data.titleLower,
                checked: true,
                qty: data.qty,
                unit: data.unit
              } satisfies ShoppingItemRecord;
            })
          };
          updateList();
        },
        (error) => {
          if (import.meta.env.DEV) {
            console.error('[shopping] Failed to subscribe to checked items', error);
          }
        }
      );

      return () => {
        unsubscribeChecked();
        unsubscribeUnchecked();
      };
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [service]);

  const addItem = useCallback(
    async (listSlug: (typeof SHOPPING_LISTS)[number]['slug'], title: string) => {
      try {
        await service.addItem(listSlug, title);
      } catch (error) {
        console.error('[shopping] Unable to add item', error);
      }
    },
    [service]
  );

  const toggleChecked = useCallback(
    async (
      listSlug: (typeof SHOPPING_LISTS)[number]['slug'],
      item: Pick<CheckItem, 'id' | 'done'>
    ) => {
      try {
        await service.toggleChecked(listSlug, item.id, !item.done);
      } catch (error) {
        console.error('[shopping] Unable to toggle item', error);
      }
    },
    [service]
  );

  const renameItem = useCallback(
    async (
      listSlug: (typeof SHOPPING_LISTS)[number]['slug'],
      itemId: string,
      title: string
    ) => {
      try {
        await service.renameItem(listSlug, itemId, title);
      } catch (error) {
        console.error('[shopping] Unable to rename item', error);
      }
    },
    [service]
  );

  const removeItem = useCallback(
    async (listSlug: (typeof SHOPPING_LISTS)[number]['slug'], itemId: string) => {
      try {
        await service.removeItem(listSlug, itemId);
      } catch (error) {
        console.error('[shopping] Unable to remove item', error);
      }
    },
    [service]
  );

  return {
    lists,
    addItem,
    toggleChecked,
    renameItem,
    removeItem
  };
};
