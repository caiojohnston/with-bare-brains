import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Login } from "./pages/Login";
import { Search } from "./pages/Search";
import { ArticleView } from "./pages/ArticleView";
import { ArticleEditor } from "./pages/ArticleEditor";
import { RequireAuth } from "./auth/RequireAuth";

function NotFound() {
  return <p>Página não encontrada.</p>;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/busca" element={<Search />} />
        <Route
          path="/novo"
          element={
            <RequireAuth>
              <ArticleEditor />
            </RequireAuth>
          }
        />
        <Route path="/artigo/:id" element={<ArticleView />} />
        <Route
          path="/artigo/:id/editar"
          element={
            <RequireAuth>
              <ArticleEditor />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
