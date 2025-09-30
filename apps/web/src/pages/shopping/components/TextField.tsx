import type {
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  RefObject,
  SelectHTMLAttributes
} from 'react';
import styles from './TextField.module.css';

type FieldBaseProps = {
  label: ReactNode;
  helperText?: ReactNode;
  inputRef?: RefObject<HTMLInputElement | HTMLSelectElement>;
};

type TextInputProps = PropsWithChildren<
  FieldBaseProps & InputHTMLAttributes<HTMLInputElement>
> & { kind?: 'text' };

type SelectInputProps = PropsWithChildren<
  FieldBaseProps & SelectHTMLAttributes<HTMLSelectElement>
> & { kind: 'select' };

type FieldProps = TextInputProps | SelectInputProps;

export const TextField = ({
  label,
  helperText,
  inputRef,
  kind = 'text',
  className,
  children,
  ...rest
}: FieldProps) => {
  const labelClassName = [styles.label, className].filter(Boolean).join(' ');

  const controlProps = {
    className: styles.control,
    ref: inputRef as RefObject<HTMLInputElement & HTMLSelectElement>,
    ...rest
  };

  return (
    <label className={labelClassName}>
      <span className={styles.labelText}>{label}</span>
      {kind === 'select' ? (
        <select
          {...(controlProps as SelectHTMLAttributes<HTMLSelectElement>)}
          className={`${styles.control} ${styles.select}`}
        >
          {children}
        </select>
      ) : (
        <input
          {...(controlProps as InputHTMLAttributes<HTMLInputElement>)}
          type={rest.type ?? 'text'}
        />
      )}
      {helperText ? <span className={styles.helper}>{helperText}</span> : null}
    </label>
  );
};
