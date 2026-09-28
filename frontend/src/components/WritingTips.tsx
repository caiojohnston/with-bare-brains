import { useEffect, useState } from "react";
import styles from "./WritingTips.module.css";

const TIPS = [
  {
    title: "Leia um pedaço pequeno, não o capítulo inteiro",
    body: "Escolha um conceito só — uma etapa de algoritmo, uma definição. Pedaço grande demais vira decoreba.",
  },
  {
    title: "Feche a fonte antes de escrever",
    body: "Escrever com o livro/site aberto do lado é cópia disfarçada. Fechar força a memória a trabalhar de verdade.",
  },
  {
    title: "Escreva de cabeça, como se explicasse pra alguém",
    body: "Sem espiar. Onde a explicação travar ou enrolar é exatamente onde o conceito não foi entendido ainda.",
  },
  {
    title: "Compare com a fonte só depois",
    body: "Reabra e confira o que escreveu. Corrija erros e lacunas ali — é esse comparar que fixa o conteúdo.",
  },
  {
    title: "Repita em ciclos curtos",
    body: "Ler → fechar → escrever → comparar → próximo pedaço. O artigo nasce em vários ciclos, não em uma sentada só.",
  },
  {
    title: "Elimine a distração, não resista a ela",
    body: "Celular fora da sala, redes sociais bloqueadas no navegador durante a escrita. Força de vontade é recurso finito.",
  },
  {
    title: "Um Pomodoro, uma tarefa escrita antes de sentar",
    body: "Ex.: \"escrever a explicação da partição do quicksort\". Tarefa vaga é desculpa pronta pra procrastinar.",
  },
];

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.74c.54.4 1 1.03 1 1.76v.5h6v-.5c0-.73.46-1.36 1-1.76A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

export function WritingTips() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        title="Dicas de ouro para escrever e estudar"
        aria-haspopup="dialog"
      >
        <LightbulbIcon />
      </button>

      {open && (
        <div className={styles.overlay} role="presentation" onClick={() => setOpen(false)}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Dicas de ouro para escrever e estudar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <h3>Dicas de ouro para escrever e estudar</h3>
              <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <ol className={styles.tipList}>
              {TIPS.map((tip) => (
                <li key={tip.title}>
                  <strong>{tip.title}</strong>
                  <p>{tip.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
