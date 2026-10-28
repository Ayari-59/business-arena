import { SCENARIOS } from "@/config/scenarios/registry";
import { PageDeLaLiasse, type SecteurDeLaLiasse } from "./liasse-a-imprimer";

/**
 * LA LIASSE À IMPRIMER, côté serveur.
 *
 * La page était un composant client qui importait le registre des scénarios :
 * avec lui partaient, dans un fichier JavaScript public, les corrigés de toutes
 * les situations (bonnes réponses, explications). Le serveur lit ici ce que la
 * liasse demande de chaque secteur, son titre et les codes de ses événements,
 * et le composant client ne reçoit que cela (audit, P1-2).
 */
export default function Page() {
  const secteurs: SecteurDeLaLiasse[] = SCENARIOS.map((d) => ({
    code: d.code,
    titre: d.title,
    evenements: d.scenario.events.map((e) => e.code),
  }));
  return <PageDeLaLiasse secteurs={secteurs} />;
}
