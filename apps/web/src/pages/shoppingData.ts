export type CheckItem = {
  id: string;
  title: string;
  done: boolean;
  qty?: number;
  unit?: string;
  titleLower?: string;
};

export type ShoppingListData = {
  title: string;
  slug: string;
  items: CheckItem[];
};

type RawShoppingList = {
  title: string;
  slug: 'food' | 'household' | 'stuff';
  items: string[];
};

const RAW_SHOPPING_DATA: RawShoppingList[] = [
  {
    title: 'Еда',
    slug: 'food',
    items: [
      'Авокадо',
      'Базилик свежий',
      'Булочки для бургеров',
      'Гречневая крупа',
      'Йогурт греческий',
      'Клубника',
      'Кофе молотый',
      'Кукурузные хлопья',
      'Лосось филе',
      'Масло оливковое',
      'Молоко',
      'Мороженое пломбир',
      'Огурцы',
      'Пармезан',
      'Перец болгарский',
      'Помидоры черри',
      'Рис жасмин',
      'Сметана',
      'Сыр брынза',
      'Хлеб цельнозерновой'
    ]
  },
  {
    title: 'Бытовое',
    slug: 'household',
    items: [
      'Антисептик для рук',
      'Бумажные полотенца',
      'Губки для посуды',
      'Дезинфицирующее средство',
      'Зубная паста',
      'Капсулы для стирки',
      'Крем для обуви',
      'Мешки для мусора',
      'Мыло жидкое',
      'Освежитель воздуха',
      'Перчатки резиновые',
      'Пленка пищевая',
      'Порошок чистящий',
      'Салфетки влажные',
      'Средство для мытья стекол',
      'Средство для плиты',
      'Туалетная бумага',
      'Универсальный очиститель',
      'Фольга алюминиевая',
      'Щетки для уборки'
    ]
  },
  {
    title: 'Вещи',
    slug: 'stuff',
    items: [
      'Батарейки АА',
      'Блокнот в клетку',
      'Вешалки деревянные',
      'Гирлянда светодиодная',
      'Зонт складной',
      'Кабель USB-C',
      'Кружка дорожная',
      'Маркеры текстовые',
      'Носки теплые',
      'Органайзер для шкафа',
      'Плед флисовый',
      'Повербанк',
      'Рамка для фото',
      'Ручки гелевые',
      'Скетчбук',
      'Термос компактный',
      'Фонарик ручной',
      'Чехол для ноутбука',
      'Шнур удлинитель',
      'Эко-сумка'
    ]
  }
];

const collator = new Intl.Collator('ru-RU', { sensitivity: 'base' });

const sortByLocale = <T extends { title: string; titleLower?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const left = a.titleLower ?? a.title;
    const right = b.titleLower ?? b.title;
    const base = collator.compare(left, right);
    if (base !== 0) {
      return base;
    }
    return collator.compare(a.title, b.title);
  });

export const sortItems = (items: CheckItem[]): CheckItem[] => sortByLocale(items);

export const SHOPPING_LISTS: ReadonlyArray<{ title: string; slug: RawShoppingList['slug'] }> =
  RAW_SHOPPING_DATA.map(({ title, slug }) => ({ title, slug }));

export const createInitialShoppingLists = (): ShoppingListData[] =>
  RAW_SHOPPING_DATA.map(({ title, slug, items }) => ({
    title,
    slug,
    items: sortItems(
      items.map((itemTitle, index) => ({
        id: `${slug}-${String(index + 1).padStart(2, '0')}`,
        title: itemTitle,
        done: false,
        titleLower: itemTitle.toLocaleLowerCase('ru-RU')
      }))
    )
  }));

export type ShoppingItemRecord = {
  id: string;
  title: string;
  titleLower?: string;
  checked: boolean;
  qty?: number;
  unit?: string;
};

export const buildShoppingSections = (input: {
  unchecked: ShoppingItemRecord[];
  checked: ShoppingItemRecord[];
}): {
  uncheckedItems: CheckItem[];
  checkedItems: CheckItem[];
  allItems: CheckItem[];
} => {
  const uncheckedItems = sortItems(
    input.unchecked.map((record) => ({
      id: record.id,
      title: record.title,
      done: false,
      qty: record.qty,
      unit: record.unit,
      titleLower: record.titleLower
    }))
  );

  const checkedItems = sortItems(
    input.checked.map((record) => ({
      id: record.id,
      title: record.title,
      done: true,
      qty: record.qty,
      unit: record.unit,
      titleLower: record.titleLower
    }))
  );

  return {
    uncheckedItems,
    checkedItems,
    allItems: [...uncheckedItems, ...checkedItems]
  };
};
