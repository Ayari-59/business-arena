/**
 * CE QUE L'ANIMATEUR D'UNE COHORTE VOIT : des agrégats, jamais une personne.
 *
 * Une cohorte suit le programme ensemble ; son animateur prépare les débriefs.
 * Il lui faut savoir où en est le groupe, quelles compétences il maîtrise ou
 * non, et, épisode par épisode, comment les choix se sont répartis. Il ne lui
 * faut ni un nom, ni un profil individuel : le profil appartient au manager,
 * et un profil vu par l'entreprise devient une note, que chacun cherche
 * ensuite à soigner plutôt qu'à bien décider.
 *
 * D'où une règle sans exception : aucun chiffre en dessous de cinq personnes.
 * Une moyenne sur trois managers se lit presque nominativement dans une équipe
 * qui se connaît. Sous ce seuil de membres, l'animateur ne voit que deux
 * totaux : combien de membres, combien d'épisodes joués. Au-dessus, la
 * répartition des choix d'un épisode attend aussi cinq joueurs de cet épisode.
 */
import { COMPETENCES, type CodeCompetence } from "@/config/episodes/competences";
import type { Episode } from "@/config/episodes/types";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { construireProfil, type Profil } from "./profil";
import type { PartieEnregistree } from "./types";

export const SEUIL_D_ANONYMAT = 5;

export interface RepartitionDUneDecision {
  d: number;
  titre: string;
  /** La part des joueurs qui ont pris chaque option, dans l'ordre des options. */
  options: readonly { texte: string; part: number }[];
  /** La part des joueurs dont le choix était bon, au sens du bilan. */
  bonnes: number;
}

export interface EpisodeDeLaCohorte {
  code: string;
  numero: number;
  titre: string;
  /** Combien de membres l'ont joué pour la première fois, hors Découverte. */
  joueurs: number;
  /** `null` sous le seuil d'anonymat. */
  decisions: readonly RepartitionDUneDecision[] | null;
}

export interface VueDeCohorte {
  membres: number;
  /** Les membres dont au moins une partie compte au profil. */
  actifs: number;
  episodesJoues: number;
  /** Assez de membres pour montrer autre chose que des totaux. */
  detail: boolean;
  /** Combien de membres ont 0, 1, 2… épisodes qui comptent (le dernier palier : « 6 et plus »). */
  avancement: readonly { episodes: number; membres: number }[] | null;
  competences: readonly {
    code: CodeCompetence;
    nom: string;
    /** Les membres qui ont un score, indicatif au moins. */
    membres: number;
    /** La moyenne de leurs scores ; `null` sous le seuil. */
    moyenne: number | null;
  }[];
  episodes: readonly EpisodeDeLaCohorte[];
}

const PALIERS = 6;

export function agregerCohorte(
  membres: readonly (readonly PartieEnregistree[])[],
  episodes: readonly Episode[] = EPISODES,
): VueDeCohorte {
  const profils: Profil[] = membres.map((parties) => construireProfil(parties, episodes));
  const detail = membres.length >= SEUIL_D_ANONYMAT;
  const comptees = profils.map((p) => p.comptees.length);

  const competences = COMPETENCES.filter((c) => c.score).map((c) => {
    const scores = profils
      .map((p) => p.competences.find((l) => l.competence.code === c.code)?.score)
      .filter((s): s is number => s != null);
    return {
      code: c.code,
      nom: c.nom,
      membres: scores.length,
      moyenne:
        scores.length >= SEUIL_D_ANONYMAT
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
    };
  });

  const parEpisode = episodes
    .map((ep): EpisodeDeLaCohorte => {
      const jouees = profils.flatMap((p) => p.comptees.filter((x) => x.ep.code === ep.code));
      const assez = jouees.length >= SEUIL_D_ANONYMAT;
      return {
        code: ep.code,
        numero: ep.numero,
        titre: ep.titre,
        joueurs: jouees.length,
        decisions: assez
          ? ep.etapes.map((e, d) => ({
              d,
              titre: e.titre,
              options: e.options.map((o, k) => ({
                texte: o.t,
                part:
                  jouees.filter((x) => x.enregistree.partie.chemin[d] === k).length / jouees.length,
              })),
              bonnes: jouees.filter((x) => x.mesures.decisions[d]!.bonne).length / jouees.length,
            }))
          : null,
      };
    })
    .filter((e) => e.joueurs > 0)
    .sort((a, b) => b.joueurs - a.joueurs || a.numero - b.numero);

  return {
    membres: membres.length,
    actifs: comptees.filter((n) => n > 0).length,
    episodesJoues: comptees.reduce((a, b) => a + b, 0),
    detail,
    avancement: detail
      ? Array.from({ length: PALIERS + 1 }, (_, i) => ({
          episodes: i,
          membres: comptees.filter((n) => (i === PALIERS ? n >= PALIERS : n === i)).length,
        }))
      : null,
    competences: detail ? competences : competences.map((c) => ({ ...c, moyenne: null })),
    episodes: detail ? parEpisode : [],
  };
}
