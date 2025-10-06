import { useCallback, useEffect, useMemo, useState } from 'react';
import { onSnapshot, type Unsubscribe } from 'firebase/firestore';
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

type ShoppingErrorSource =
  | 'subscribe:checked'
  | 'subscribe:unchecked'
  | 'addItem'
  | 'toggleChecked'
  | 'renameItem'
  | 'removeItem';

const errorMessages: Record<ShoppingErrorSource, string> = {
  'subscribe:checked': 'Не удалось загрузить отмеченные позиции. Проверьте подключение.',
  'subscribe:unchecked': 'Не удалось загрузить список. Проверьте подключение.',
  addItem: 'Не удалось добавить позицию. Попробуйте ещё раз.',
  toggleChecked: 'Не удалось обновить позицию. Попробуйте ещё раз.',
  renameItem: 'Не удалось переименовать позицию. Попробуйте ещё раз.',
  removeItem: 'Не удалось удалить позицию. Попробуйте ещё раз.'
};

export type ShoppingError = {
  source: ShoppingErrorSource;
  userMessage: string;
  error: unknown;
};

export const useShoppingLists = () => {
  const service: ShoppingService = useMemo(() => createShoppingService(db), []);
  const [lists, setLists] = useState<ListState[]>(INITIAL_LISTS);
  const [error, setError] = useState<ShoppingError | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const clearErrorForSource = useCallback((source: ShoppingErrorSource) => {
    setError((current) => (current?.source === source ? null : current));
  }, []);

  const reportError = useCallback(
    (source: ShoppingErrorSource, throwable: unknown) => {
      const userMessage = errorMessages[source];
      console.error(`[shopping] ${userMessage}`, throwable);
      setError({ source, userMessage, error: throwable });
    },
    []
  );

  useEffect(() => {
    const unsubscribers: Unsubscribe[] = SHOPPING_LISTS.map((meta) => {
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
          clearErrorForSource('subscribe:unchecked');
        },
        (error) => {
          reportError('subscribe:unchecked', error);
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
          clearErrorForSource('subscribe:checked');
        },
        (error) => {
          reportError('subscribe:checked', error);
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
  }, [service, clearErrorForSource, reportError]);

  const addItem = useCallback(
    async (listSlug: (typeof SHOPPING_LISTS)[number]['slug'], title: string) => {
      try {
        await service.addItem(listSlug, title);
        clearErrorForSource('addItem');
      } catch (throwable) {
        reportError('addItem', throwable);
        throw throwable;
      }
    },
    [service, clearErrorForSource, reportError]
  );

  const toggleChecked = useCallback(
    async (
      listSlug: (typeof SHOPPING_LISTS)[number]['slug'],
      item: Pick<CheckItem, 'id' | 'done'>
    ) => {
      try {
        await service.toggleChecked(listSlug, item.id, !item.done);
        clearErrorForSource('toggleChecked');
      } catch (throwable) {
        reportError('toggleChecked', throwable);
        throw throwable;
      }
    },
    [service, clearErrorForSource, reportError]
  );

  const renameItem = useCallback(
    async (
      listSlug: (typeof SHOPPING_LISTS)[number]['slug'],
      itemId: string,
      title: string
    ) => {
      try {
        await service.renameItem(listSlug, itemId, title);
        clearErrorForSource('renameItem');
      } catch (throwable) {
        reportError('renameItem', throwable);
        throw throwable;
      }
    },
    [service, clearErrorForSource, reportError]
  );

  const removeItem = useCallback(
    async (listSlug: (typeof SHOPPING_LISTS)[number]['slug'], itemId: string) => {
      try {
        await service.removeItem(listSlug, itemId);
        clearErrorForSource('removeItem');
      } catch (throwable) {
        reportError('removeItem', throwable);
        throw throwable;
      }
    },
    [service, clearErrorForSource, reportError]
  );

  return {
    lists,
    addItem,
    toggleChecked,
    renameItem,
    removeItem,
    error,
    clearError
  };
};
