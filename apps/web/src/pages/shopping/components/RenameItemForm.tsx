import type { ChangeEvent, FormEvent } from 'react';
import { TextField } from './TextField';
import { Button } from './Button';
import styles from './RenameItemForm.module.css';

type RenameItemFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export const RenameItemForm = ({ value, onChange, onSubmit, onCancel }: RenameItemFormProps) => {
  const isDisabled = value.trim().length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDisabled) {
      return;
    }
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label="Название"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        autoFocus
        required
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isDisabled}>
          Сохранить
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
};
