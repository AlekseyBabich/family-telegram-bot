import styles from './PagerDots.module.css';

type PagerDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

export const PagerDots = ({ count, currentIndex, onSelect, className }: PagerDotsProps) => {
  const containerClassName = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName} role="tablist" aria-label="Списки покупок" style={{ pointerEvents: 'auto' }}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex;
        return (
          <button
            key={index}
            type="button"
            className={`${styles.dot} ${isActive ? styles.active : ''}`.trim()}
            aria-label={`Перейти к списку ${index + 1}`}
            aria-pressed={isActive}
            onClick={() => onSelect(index)}
          />
        );
      })}
    </div>
  );
};
