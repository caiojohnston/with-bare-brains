import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./SearchBox.module.css";

export function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (value.trim()) next.set("q", value.trim());
    navigate(`/busca?${next.toString()}`);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <input
        className={styles.input}
        type="search"
        placeholder="Buscar artigos…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Buscar artigos"
      />
      <button className={styles.button} type="submit">
        Buscar
      </button>
    </form>
  );
}
