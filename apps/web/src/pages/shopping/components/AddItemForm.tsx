import { useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { TextField } from './TextField';
import { Button } from './Button';
import styles from './AddItemForm.module.css';

export type AddItemFormState = {
  category: string;
  title: string;
};

type AddItemFormProps = {
  state: AddItemFormState;
  categoryOptions: string[];
  onCategoryChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  autoFocusTitle?: boolean;
};

export const AddItemForm = ({
  state,
  categoryOptions,
  onCategoryChange,
  onTitleChange,
  onSubmit,
  onCancel,
  autoFocusTitle = false
}: AddItemFormProps) => {
  const isSubmitDisabled = useMemo(() => state.title.trim().length === 0, [state.title]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <TextField
          kind="select"
          label="Категория"
          value={state.category}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onCategoryChange(event.target.value)
          }
          required
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </TextField>
        <TextField
          label="Название"
          value={state.title}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTitleChange(event.target.value)}
          placeholder="Что добавить?"
          autoFocus={autoFocusTitle}
          required
        />
      </div>
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
          Добавить
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отменить
        </Button>
      </div>
    </form>
  );
};
