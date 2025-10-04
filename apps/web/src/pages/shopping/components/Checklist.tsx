import { useMemo } from 'react';
import { ChecklistItem } from './ChecklistItem';
import styles from './Checklist.module.css';
import { sortItems, type CheckItem } from '../../shoppingData';
import { Button } from './Button';

type ChecklistProps = {
  title: string;
  items: CheckItem[];
  showTitle?: boolean;
  onToggle: (itemId: string) => void;
  onAdd: () => void;
  onOpenActions?: (item: CheckItem, position: { x: number; y: number }) => void;
};

export const Checklist = ({
  title,
  items,
  showTitle = true,
  onToggle,
  onAdd,
  onOpenActions
}: ChecklistProps) => {
  const { selectedItems, unselectedItems } = useMemo(() => {
    const selected = items.filter((item) => item.done);
    const unselected = items.filter((item) => !item.done);

    return {
      selectedItems: sortItems(selected),
      unselectedItems: sortItems(unselected)
    };
  }, [items]);

  return (
    <div className={styles.panelGroup}>
      {showTitle ? <h2 className={styles.heading}>{title}</h2> : null}
      <ul className={styles.items}>
        {items.length === 0 ? (
          <li className={styles.emptyState} aria-live="polite">
            список пуст
          </li>
        ) : null}

        {selectedItems.length > 0 ? (
          <li className={styles.section} data-testid="shopping-section-selected">
            <div className={styles.panel}>
              <ul className={styles.sectionItems} aria-label="Отмеченные позиции">
                {selectedItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={() => onToggle(item.id)}
                    onOpenActions={
                      onOpenActions ? (position) => onOpenActions(item, position) : undefined
                    }
                  />
                ))}
              </ul>
            </div>
          </li>
        ) : null}

        {unselectedItems.length > 0 ? (
          <li className={styles.section} data-testid="shopping-section-unselected">
            <div className={styles.panel}>
              <ul className={styles.sectionItems} aria-label="Неотмеченные позиции">
                {unselectedItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={() => onToggle(item.id)}
                    onOpenActions={
                      onOpenActions ? (position) => onOpenActions(item, position) : undefined
                    }
                  />
                ))}
              </ul>
            </div>
          </li>
        ) : null}

        <li className={styles.addItem} data-testid="shopping-add-entry">
          <Button variant="secondary" onClick={onAdd} fullWidth>
            + добавить
          </Button>
        </li>
      </ul>
    </div>
  );
};
