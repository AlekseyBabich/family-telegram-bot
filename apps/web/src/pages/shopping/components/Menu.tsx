import { createPortal } from 'react-dom';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import styles from './Menu.module.css';

type MenuProps = PropsWithChildren<{
  open: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  labelledBy?: string;
}>;

export const Menu = ({ open, anchor, onClose, labelledBy, children }: MenuProps) => {
  useEffect(() => {
    if (!open) {
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

  if (!open || !anchor) {
    return null;
  }

  const content = (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
      onContextMenu={(event) => {
        event.preventDefault();
        onClose();
      }}
      onWheel={(event) => event.preventDefault()}
      onTouchMove={(event) => event.preventDefault()}
    >
      <div
        className={styles.menu}
        style={{ top: anchor.y, left: anchor.x }}
        role="menu"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
};

export const MenuButton = (
  props: PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>
) => {
  const { children, className, ...rest } = props;
  return (
    <button
      type="button"
      className={[styles.menuButton, className].filter(Boolean).join(' ')}
      role="menuitem"
      {...rest}
    >
      {children}
    </button>
  );
};
