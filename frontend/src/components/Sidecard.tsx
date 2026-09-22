import type { Sidecard as SidecardData } from "../types/api";
import styles from "./Sidecard.module.css";

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function Sidecard({ data, title }: { data: SidecardData; title: string }) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <aside className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <dl className={styles.list}>
        {Object.entries(data).map(([key, value]) => (
          <div className={styles.row} key={key}>
            <dt className={styles.key}>{key}</dt>
            <dd className={styles.value}>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
