import type { ShoppingCategory } from '../services/db';

export const TEXT = {
  header: {
    title: 'Семейный помощник',
    guest: 'Гость',
    tabs: {
      shopping: 'Покупки',
      calendar: 'Календарь',
      budget: 'Бюджет'
    }
  },
  shopping: {
    categories: {
      food: 'Еда',
      household: 'Бытовое',
      clothes: 'Одежда'
    } as Record<ShoppingCategory, string>,
    sectionTitle: (label: string) => `Список: ${label}`,
    addPlaceholder: 'Добавить...',
    addButton: 'Добавить',
    empty: 'Пока пусто',
    genericError: 'Не удалось сохранить покупку. Попробуйте ещё раз.',
    deleteConfirm: (name: string) => `Удалить «${name}»?`,
    toggleDone: {
      done: 'Отметить выполненным',
      undone: 'Отметить невыполненным'
    }
  },
  calendar: {
    title: 'Ближайшие события',
    empty: 'Нет событий',
    form: {
      namePlaceholder: 'Название',
      datePlaceholder: 'Дата (ГГГГ-ММ-ДД)',
      descriptionPlaceholder: 'Описание (необязательно)',
      addButton: 'Добавить'
    },
    prompts: {
      name: 'Название',
      date: 'Дата (ГГГГ-ММ-ДД)',
      description: 'Описание'
    },
    actions: {
      edit: 'Изменить',
      delete: 'Удалить'
    },
    deleteConfirm: (name: string) => `Удалить событие «${name}»?`,
    notify: {
      added: (title: string, date: string) => `Добавлено событие: ${title} (${date})`,
      updated: (title: string, date: string) => `Обновлено событие: ${title} (${date})`,
      deleted: (title: string) => `Удалено событие: ${title}`
    }
  },
  budget: {
    placeholder:
      'Раздел в разработке. Скоро здесь появится совместное планирование расходов.'
  }
} as const;
