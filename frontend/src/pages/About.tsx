import styles from "./About.module.css";

export function About() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Sobre</h1>
      <p className={styles.text}>
        Cognitive Offloading ou Hollowed Mind é como a literatura descreve o processo
        de terceirização do raciocínio lógico para a IA generativa, que contorna o
        esforço deliberado necessário à consolidação de fundamentos teóricos. O
        fenômeno gera competência ilusória, o usuário produz código funcional mas sem
        repertório algorítmico para auditar falhas sutis (efeito Dunning-Kruger). A
        literatura aponta uma assimetria entre novatos e veteranos, mas na minha
        visão a imunidade dos veteranos é comportamental, não estrutural. Eles não
        perdem fundamentos porque escolhem não delegar tudo e não aceitam saídas da
        IA como verdade, mas se um veterano se submeter à mesma terceirização
        irrestrita, ele sofre a mesma erosão. A IA prejudica quem faz uso indevido
        dela.
      </p>
      <p className={styles.citation}>Lin, 2026; Li, 2025; Klein, 2025.</p>
    </div>
  );
}
