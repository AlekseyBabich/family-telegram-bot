import { describe, expect, it } from 'vitest';
import { buildShoppingSections, type ShoppingItemRecord } from './shoppingData';

describe('buildShoppingSections', () => {
  const makeRecord = (overrides: Partial<ShoppingItemRecord> & { id: string; title: string }) => ({
    checked: false,
    titleLower: overrides.title?.toLocaleLowerCase('ru-RU'),
    qty: undefined,
    unit: undefined,
    ...overrides
  });

  it('sorts items alphabetically within each section and keeps checked items after unchecked', () => {
    const result = buildShoppingSections({
      unchecked: [
        makeRecord({ id: '1', title: 'яблоко' }),
        makeRecord({ id: '2', title: 'Абрикос' }),
        makeRecord({ id: '3', title: 'банан' })
      ],
      checked: [
        makeRecord({ id: '4', title: 'Черника', checked: true }),
        makeRecord({ id: '5', title: 'апельсин', checked: true })
      ]
    });

    expect(result.uncheckedItems.map((item) => item.title)).toEqual([
      'Абрикос',
      'банан',
      'яблоко'
    ]);
    expect(result.checkedItems.map((item) => item.title)).toEqual(['апельсин', 'Черника']);
    expect(result.allItems.map((item) => item.title)).toEqual([
      'Абрикос',
      'банан',
      'яблоко',
      'апельсин',
      'Черника'
    ]);
  });

  it('preserves optional fields when mapping snapshots', () => {
    const result = buildShoppingSections({
      unchecked: [
        makeRecord({ id: '10', title: 'Молоко', qty: 2, unit: 'л' })
      ],
      checked: [
        makeRecord({ id: '11', title: 'Хлеб', checked: true, qty: 1, unit: 'шт' })
      ]
    });

    expect(result.uncheckedItems[0]).toMatchObject({ qty: 2, unit: 'л', done: false });
    expect(result.checkedItems[0]).toMatchObject({ qty: 1, unit: 'шт', done: true });
  });
});
