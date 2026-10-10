/**
 * LE RETOUR APRÈS UN ÉPISODE : les phrases des nouveaux blocs du bilan.
 *
 * Chaque phrase cite une décision de la partie, ou un nombre calculé sur elle :
 * une phrase qui pourrait s'afficher à n'importe qui n'a pas sa place. Les
 * mots « tient », « exposé », « chance » viennent après le fait qui les
 * justifie, jamais seuls. Pas de note globale de la partie : elle mélangerait
 * résultat et qualité, exactement ce que le bilan sépare.
 */
import { COMPETENCES, type CodeCompetence } from "@/config/episodes/competences";
import type { Episode } from "@/config/episodes/types";
import {
  SEUIL_QUALITE,
  SEUIL_ROBUSTESSE,
  type MesuresDeLaPartie,
} from "@/pedagogy/episodes/mesures";
import type { Observation } from "./observations";

const D = (d: number) => `D${d + 1}`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Ce que dit la place du tirage parmi les trente : un fait, puis le mot qui le résume. */
export function lectureDuTirage(place: number, sur: number): string {
  const rang = place === 1 ? "le meilleur" : `le ${place}e`;
  const mot =
    place <= Math.round(sur * 0.2)
      ? "vous avez eu de la chance"
      : place <= Math.round(sur * 0.4)
        ? "vous avez eu un peu de chance"
        : place > Math.round(sur * 0.8)
          ? "vous avez eu de la malchance"
          : place > Math.round(sur * 0.6)
            ? "vous avez eu un peu de malchance"
            : "des aléas ordinaires";
  return `Avec vos choix, votre trimestre est ${rang} sur ${sur} tirages des aléas : ${mot}.`;
}

/** « Vos choix tenaient-ils ? » : robustesse, options trompeuses, plus fort regret, place du tirage. */
export function phrasesDeRobustesse(ep: Episode, m: MesuresDeLaPartie): string[] {
  const kE = ep.bilan.formatObjectif;
  const option = (d: number, k: number) => `« ${ep.etapes[d]!.options[k]!.t} »`;
  const n = m.decisions.length;
  const tiennent = m.decisions.filter((x) => x.choisie.robustesse >= SEUIL_ROBUSTESSE).length;
  const phrases = [
    `${tiennent} de vos ${n} choix tiennent quand les aléas tournent mal : leur pire cas reste proche du meilleur pire cas possible.`,
  ];
  const exposes = m.decisions
    .filter((x) => x.choisie.robustesse < SEUIL_ROBUSTESSE && x.plusSure.p10 - x.choisie.p10 >= 500)
    .sort((a, b) => b.plusSure.p10 - b.choisie.p10 - (a.plusSure.p10 - a.choisie.p10))
    .slice(0, 2);
  for (const x of exposes) {
    phrases.push(
      `${D(x.d)} · ${option(x.d, x.choisie.option)} : dans les 3 pires tirages sur 30, ce choix coûte ${kE(x.plusSure.p10 - x.choisie.p10)} de plus que ${option(x.d, x.plusSure.option)}. Il est exposé.`,
    );
  }
  for (const x of m.decisions.filter((y) => y.choisie.trompeuse).slice(0, 1)) {
    const fois = Math.round(x.choisie.victoires * 30);
    phrases.push(
      `${D(x.d)} · ${option(x.d, x.choisie.option)} fait mieux que la meilleure option sur ${fois} tirages sur 30, mais moins bien en moyenne : un bon résultat avec ce choix ne prouverait pas qu'il était bon.`,
    );
  }
  const regret = [...m.decisions].sort(
    (a, b) => b.meilleure.moyenne - b.choisie.moyenne - (a.meilleure.moyenne - a.choisie.moyenne),
  )[0];
  if (regret && regret.meilleure.moyenne - regret.choisie.moyenne >= 1000) {
    phrases.push(
      `Le plus coûteux : ${D(regret.d)}, ${option(regret.d, regret.choisie.option)}, ${kE(regret.meilleure.moyenne - regret.choisie.moyenne)} sous ${option(regret.d, regret.meilleure.option)} en moyenne sur trente tirages.`,
    );
  }
  phrases.push(lectureDuTirage(m.tirage.place, m.tirage.sur));
  return phrases;
}

export interface CompetenceObservee {
  code: CodeCompetence;
  nom: string;
  poids: number;
  phrase: string;
}

/** « Ce que cet épisode a observé » : compétence par compétence, des décomptes. */
export function competencesObservees(observations: readonly Observation[]): CompetenceObservee[] {
  return COMPETENCES.map((c) => {
    const os = observations.filter((o) => o.competence === c.code);
    const decisions = os.filter((o) => o.source === "principale" || o.source === "secondaire");
    const bonnes = decisions.filter((o) => o.valeur >= SEUIL_QUALITE).length;
    const morceaux: string[] = [];
    if (decisions.length) {
      morceaux.push(
        `${pluriel(decisions.length, "décision")} (${pluriel(bonnes, "bonne")}${
          decisions.some((o) => o.source === "secondaire") ? ", dont certaines en second plan" : ""
        } : ${decisions.map((o) => D(o.decision!)).join(", ")})`,
      );
    }
    const info = os.filter((o) => o.source === "information");
    if (info.length) {
      const vues = info.reduce((n, o) => n + (o.sources?.vues ?? 0), 0);
      const sur = info.reduce((n, o) => n + (o.sources?.sur ?? 0), 0);
      morceaux.push(`${vues} des ${sur} informations décisives consultées avant de décider`);
    }
    for (const o of os) {
      if (o.source === "diagnostic") {
        morceaux.push(
          o.valeur === 1
            ? "diagnostic de la semaine 1 juste"
            : o.valeur > 0
              ? "diagnostic de la semaine 1 proche : une vraie cause, pas la principale"
              : "diagnostic de la semaine 1 à revoir",
        );
      }
      if (o.source === "revision") {
        morceaux.push(
          o.aLEpreuve
            ? o.valeur === 1
              ? "diagnostic faux corrigé à la réévaluation"
              : "diagnostic faux non corrigé à la réévaluation"
            : o.valeur === 1
              ? "diagnostic juste maintenu à la réévaluation"
              : "diagnostic juste abandonné à la réévaluation",
        );
      }
      if (o.source === "prevision") {
        morceaux.push(
          `prévision ${o.valeur === 1 ? "juste" : o.valeur > 0 ? "proche" : "loin du réel"}, avec ${o.confiance} % de confiance`,
        );
      }
    }
    const reflexes = os.filter((o) => o.source === "reflexe");
    if (reflexes.length) {
      const evites = reflexes.filter((o) => o.valeur === 1).length;
      morceaux.push(`réponse réflexe évitée ${evites} fois sur ${reflexes.length}`);
    }
    return {
      code: c.code,
      nom: c.nom,
      poids: os.reduce((s, o) => s + o.poids, 0),
      phrase: morceaux.join(" ; "),
    };
  })
    .filter((x) => x.poids > 0)
    .sort((a, b) => b.poids - a.poids);
}
