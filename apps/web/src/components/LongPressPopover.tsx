import { useEffect, useMemo, useRef } from 'react';

interface LongPressPopoverProps {
  anchorRect: DOMRect;
  onDelete: () => void;
  onClose: () => void;
}

const POPOVER_WIDTH = 160;
const POPOVER_MARGIN = 8;

const LongPressPopover = ({ anchorRect, onDelete, onClose }: LongPressPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const position = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : anchorRect.right;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : anchorRect.bottom;
    const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    const top = Math.min(
      anchorRect.top + anchorRect.height / 2 + scrollY,
      viewportHeight + scrollY - POPOVER_MARGIN
    );

    const preferredLeft =
      anchorRect.left + anchorRect.width + POPOVER_MARGIN + scrollX;
    const maxLeft = viewportWidth + scrollX - POPOVER_WIDTH - POPOVER_MARGIN;

    return {
      top,
      left: Math.max(POPOVER_MARGIN + scrollX, Math.min(preferredLeft, maxLeft)),
    };
  }, [anchorRect]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!popoverRef.current || popoverRef.current.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="shopping-popover"
      style={{ top: position.top, left: position.left }}
      role="menu"
    >
      <button type="button" className="shopping-popover-action" onClick={onDelete}>
        Удалить
      </button>
    </div>
  );
};

export default LongPressPopover;
