import { after } from "next/server";

/**
 * HORS DE LA REQUÊTE DE L'ENSEIGNANT : l'envoi des notes part après la réponse
 * (`after`, next/server), l'enseignant ne l'attend pas et une plateforme lente ne
 * ralentit pas sa page. Hors d'une requête (un script, un test), la tâche part tout de
 * suite, sans être attendue. Une panne n'est jamais remontée : le journal d'envoi dit
 * ce qui n'est pas parti.
 */
export function plusTard(tache: () => Promise<unknown>): void {
  const sure = () =>
    tache().catch((e) => {
      console.error("[lti-notes] envoi interrompu :", e instanceof Error ? e.message : e);
    });
  try {
    after(sure);
  } catch {
    void sure();
  }
}
