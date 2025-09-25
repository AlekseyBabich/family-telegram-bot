import { FormEvent } from 'react';

interface ShoppingModalProps {
  isOpen: boolean;
  listId: string;
  title: string;
  listOptions: { id: string; label: string }[];
  onListChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ShoppingModal = ({
  isOpen,
  listId,
  title,
  listOptions,
  onListChange,
  onTitleChange,
  onClose,
  onSubmit,
}: ShoppingModalProps) => {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const isSubmitDisabled = title.trim().length === 0;

  return (
    <div className="shopping-modal-overlay" role="dialog" aria-modal="true">
      <div className="shopping-modal">
        <h2 className="shopping-modal-title">Добавить продукт</h2>
        <form className="shopping-modal-form" onSubmit={handleSubmit}>
          <label className="shopping-modal-field">
            <span className="shopping-modal-label">В какой список?</span>
            <select value={listId} onChange={(event) => onListChange(event.target.value)}>
              {listOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="shopping-modal-field">
            <span className="shopping-modal-label">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Например, яблоки"
            />
          </label>

          <div className="shopping-modal-actions">
            <button type="button" className="shopping-modal-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="shopping-modal-submit" disabled={isSubmitDisabled}>
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShoppingModal;
