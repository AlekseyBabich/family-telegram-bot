export type CheckItem = {
  id: string;
  title: string;
  done: boolean;
};

export type ShoppingListData = {
  title: string;
  items: CheckItem[];
};

type RawShoppingList = {
  title: string;
  prefix: string;
  items: string[];
};

const RAW_SHOPPING_DATA: RawShoppingList[] = [
  {
    title: 'Еда',
    prefix: 'food',
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
    prefix: 'household',
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
    prefix: 'things',
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

export const sortItems = (items: CheckItem[]): CheckItem[] =>
  [...items].sort((a, b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));

export const createInitialShoppingLists = (): ShoppingListData[] =>
  RAW_SHOPPING_DATA.map(({ title, prefix, items }) =>
    ({
      title,
      items: sortItems(
        items.map((itemTitle, index) => ({
          id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
          title: itemTitle,
          done: false
        }))
      )
    })
  );
