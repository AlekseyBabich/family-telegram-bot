import { ChecklistItem } from './ChecklistItem';
import styles from './Checklist.module.css';
import type { CheckItem } from '../shoppingData';
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
}: ChecklistProps) => (
  <div className={styles.panel}>
    {showTitle ? <h2 className={styles.heading}>{title}</h2> : null}
    <ul className={styles.items}>
      {items.length === 0 ? (
        <li className={styles.emptyState} aria-live="polite">
          список пуст
        </li>
      ) : null}
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          item={item}
          onToggle={() => onToggle(item.id)}
          onOpenActions={
            onOpenActions ? (position) => onOpenActions(item, position) : undefined
          }
        />
      ))}
      <li className={styles.addItem} data-testid="shopping-add-entry">
        <Button variant="secondary" onClick={onAdd} fullWidth>
          + добавить
        </Button>
      </li>
    </ul>
  </div>
);
