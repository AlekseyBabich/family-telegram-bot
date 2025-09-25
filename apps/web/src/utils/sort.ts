export interface SortableItem {
  title: string;
  done: boolean;
}

export const sortItems = <T extends SortableItem>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? -1 : 1;
    }

    return a.title.localeCompare(b.title, ['ru', 'en'], {
      sensitivity: 'base',
    });
  });

export type { SortableItem as Item };
