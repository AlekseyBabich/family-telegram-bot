import { createPortal } from 'react-dom';
import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './Dialog.module.css';

type DialogProps = PropsWithChildren<{
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  ariaDescribedBy?: string;
}>;

export const Dialog = ({
  open,
  title,
  onClose,
  labelledBy,
  ariaDescribedBy,
  children
}: DialogProps) => {
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const content = (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className={styles.header}>
            <h2 id={labelledBy} className={styles.title}>
              {title}
            </h2>
          </div>
        ) : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
};
