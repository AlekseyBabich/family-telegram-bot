import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
>;

export const Button = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const classes = [styles.button, styles[variant]];

  if (fullWidth) {
    classes.push(styles.fullWidth);
  }

  if (className) {
    classes.push(className);
  }

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {children}
    </button>
  );
};
