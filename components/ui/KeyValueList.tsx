import styles from "./KeyValueList.module.css";

type KeyValueItem = {
  label: string;
  value: React.ReactNode;
};

type KeyValueListProps = {
  items: KeyValueItem[];
  className?: string;
};

export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <dl className={`${styles.list} ${className ?? ""}`.trim()}>
      {items.map((item, index) => (
        <div className={styles.row} key={`${item.label}-${index}`}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
