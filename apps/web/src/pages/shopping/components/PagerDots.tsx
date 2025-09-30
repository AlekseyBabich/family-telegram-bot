import styles from './PagerDots.module.css';

type PagerDotsProps = {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
};

export const PagerDots = ({ count, currentIndex, onSelect }: PagerDotsProps) => {
  return (
    <div className={styles.container} role="tablist" aria-label="Списки покупок">
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
