import { FormEvent, useEffect, useState } from 'react';
import type { BasicUser } from '../services/auth';
import SectionCard from './SectionCard';
import {
  addShoppingItem,
  deleteShoppingItem,
  subscribeShoppingByCategory,
  toggleShoppingItem,
  type ShoppingCategory,
  type ShoppingItem
} from '../services/db';
import { TEXT } from '../constants/ru';

interface ShoppingListProps {
  category: ShoppingCategory;
  user: BasicUser | null;
}

const ShoppingList = ({ category, user }: ShoppingListProps) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeShoppingByCategory(category, setItems);
    return () => unsubscribe();
  }, [category]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addShoppingItem(category, value, user);
      setInputValue('');
    } catch (error) {
      console.error('Failed to add shopping item', error);
      const message =
        error instanceof Error ? error.message : TEXT.shopping.genericError;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItem = async (item: ShoppingItem) => {
    await toggleShoppingItem(item.id, !item.done, user);
  };

  const removeItem = async (item: ShoppingItem) => {
    if (!confirm(TEXT.shopping.deleteConfirm(item.title))) {
      return;
    }
    await deleteShoppingItem(item.id, user);
  };

  const label = TEXT.shopping.categories[category];

  return (
    <>
      {error && <div className="toast toast-error">{error}</div>}
      <SectionCard
        title={TEXT.shopping.sectionTitle(label)}
        actions={
          <form className="inline-form" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder={TEXT.shopping.addPlaceholder}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) {
                  setError(null);
                }
              }}
              disabled={isSubmitting}
            />
            <button type="submit" disabled={isSubmitting}>
              {TEXT.shopping.addButton}
            </button>
          </form>
        }
      >
        <ul className="shopping-list">
          {items.map((item) => (
            <li key={item.id} className={item.done ? 'done' : ''}>
              <button
                type="button"
                className="check-btn"
                onClick={() => toggleItem(item)}
                aria-label={
                  item.done
                    ? TEXT.shopping.toggleDone.undone
                    : TEXT.shopping.toggleDone.done
                }
              >
                {item.done ? '✔' : '○'}
              </button>
              <span className="item-text">{item.title}</span>
              <button type="button" className="delete-btn" onClick={() => removeItem(item)}>
                ✕
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="empty">{TEXT.shopping.empty}</li>}
        </ul>
      </SectionCard>
    </>
  );
};

export default ShoppingList;
