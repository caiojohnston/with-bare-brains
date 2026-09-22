import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Search } from "./pages/Search";
import { ArticleView } from "./pages/ArticleView";
import { ArticleEditor } from "./pages/ArticleEditor";

function NotFound() {
  return <p>Página não encontrada.</p>;
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/busca" element={<Search />} />
        <Route path="/novo" element={<ArticleEditor />} />
        <Route path="/artigo/:id" element={<ArticleView />} />
        <Route path="/artigo/:id/editar" element={<ArticleEditor />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
