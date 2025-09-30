import { Menu, MenuButton } from './Menu';
import styles from './ContextMenu.module.css';

type ContextMenuProps = {
  open: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export const ContextMenu = ({ open, anchor, onClose, onRename, onDelete }: ContextMenuProps) => {
  return (
    <Menu open={open} anchor={anchor} onClose={onClose}>
      <MenuButton
        onClick={() => {
          onClose();
          onRename();
        }}
      >
        Переименовать
      </MenuButton>
      <MenuButton
        className={styles.danger}
        onClick={() => {
          onClose();
          onDelete();
        }}
      >
        Удалить
      </MenuButton>
    </Menu>
  );
};
