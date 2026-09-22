import { Link, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../auth/AuthContext";
import styles from "./Layout.module.css";

export function Layout() {
  const { theme, toggle } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <img src="/logo.svg" alt="" className={styles.logo} />
          With Bare Brains
        </Link>
        <div className={styles.headerActions}>
          <Link to="/sobre" className={styles.navLink}>
            Sobre
          </Link>
          {isAuthenticated && (
            <button className={styles.navLink} onClick={handleLogout} title="Sair">
              Sair
            </button>
          )}
          <Link
            to="/novo"
            className={styles.newButton}
            aria-label="Escrever novo artigo"
            title="Escrever novo artigo"
          >
            +
          </Link>
          <button
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? "◐" : "◑"}
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
