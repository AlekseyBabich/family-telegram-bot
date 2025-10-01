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

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;
    const computedBodyPaddingRight = Number.parseFloat(
      window.getComputedStyle(body).paddingRight || '0'
    );
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const scrollY = window.scrollY;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${computedBodyPaddingRight + scrollbarWidth}px`;
    }
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      documentElement.style.overflow = previousHtmlOverflow;
      if (
        typeof window !== 'undefined' &&
        typeof window.scrollTo === 'function' &&
        scrollY !== 0
      ) {
        try {
          window.scrollTo(0, scrollY);
        } catch (error) {
          // Ignore unsupported scroll operations (e.g. in test environments).
        }
      }
    };
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
