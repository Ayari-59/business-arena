import { compter } from "@/lib/format";
import { majuscule } from "./regles";

/**
 * CE QUE L'ENSEIGNANT LIT DU RETOUR DES NOTES, écrit une fois : l'encart de la page de
 * l'examen (« Notes envoyées à Moodle : 24/25 · 1 erreur : … ») et la ligne de la page de
 * l'activité. Les nombres se lisent du journal, jamais écrits à la main.
 */

export interface EtatDuRetour {
  /** « Moodle », « Canvas », ou « la plateforme de cours ». */
  plateforme: string;
  /** La plateforme accorde-t-elle le retour des notes à au moins une activité de l'examen ? */
  accorde: boolean;
  publie: boolean;
  /** Les lignes du journal qui portent l'état présent (notes publiées, ou leur retrait). */
  attendues: number;
  envoyees: number;
  enCours: number;
  erreurs: { message: string; n: number; temporaire: boolean }[];
  /** Des candidats venus de la plateforme dont l'identifiant n'a pas été gardé (venus avant). */
  sansAdresse: number;
  /** Des copies retenues remises sans note : rien ne part pour elles. */
  sansNote: number;
}

export interface PhrasesDuRetour {
  titre: string;
  /** La ligne principale ; `chiffre` : « 24/25 », mis en valeur. */
  resume: { avant: string; chiffre: string | null; apres: string };
  details: string[];
  /** Le bouton « Renvoyer les notes » a-t-il un sens ? */
  renvoi: boolean;
}

export function phrasesDuRetour(e: EtatDuRetour): PhrasesDuRetour {
  const P = majuscule(e.plateforme);
  const titre = `Le carnet de notes de ${e.plateforme}`;
  if (!e.accorde) {
    return {
      titre,
      resume: {
        avant: `${P} n'a pas accordé le retour des notes à l'activité de cet examen : les notes se recopient à la main.`,
        chiffre: null,
        apres: "",
      },
      details: ["L'administrateur de la plateforme peut l'accorder dans les réglages de l'outil Business Arena."],
      renvoi: false,
    };
  }
  const details: string[] = [];
  for (const err of e.erreurs) {
    details.push(`${compter(err.n, "erreur")} : ${err.message}${err.temporaire ? " Nouvel essai prévu." : ""}`);
  }
  if (e.enCours > 0) details.push(`${compter(e.enCours, "envoi en cours", "envois en cours")}.`);
  if (e.publie && e.sansAdresse > 0) {
    details.push(
      `${compter(e.sansAdresse, "candidat venu", "candidats venus")} d'une plateforme de cours sans adresse dans le carnet : ${
        e.sansAdresse > 1 ? "qu'ils rouvrent" : "qu'il rouvre"
      } l'activité depuis le cours, puis renvoyez les notes.`,
    );
  }
  if (e.publie && e.sansNote > 0) {
    details.push(`${compter(e.sansNote, "copie remise", "copies remises")} sans note : rien ne part pour ${e.sansNote > 1 ? "elles" : "elle"}.`);
  }
  if (e.attendues === 0) {
    return {
      titre,
      resume: {
        avant: e.publie
          ? `${P} accepte les notes de cet examen. Aucune note à envoyer pour l'instant : elles partent pour chaque candidat venu de ${e.plateforme}, dès que sa copie est notée.`
          : `${P} accepte les notes de cet examen. Elles y partiront à la publication des résultats, pour chaque candidat venu de ${e.plateforme}.`,
        chiffre: null,
        apres: "",
      },
      details,
      renvoi: false,
    };
  }
  return {
    titre,
    resume: {
      avant: e.publie ? `Notes envoyées à ${e.plateforme} : ` : `Notes retirées de ${e.plateforme} : `,
      chiffre: `${e.envoyees}/${e.attendues}`,
      apres: e.publie ? "" : " (en attente d'une nouvelle publication)",
    },
    details,
    renvoi: true,
  };
}

/** La ligne de la page de l'activité (/lti/activite) : la plateforme a-t-elle accordé le retour des notes ? */
export function phraseDeLActivite(args: { plateforme: string; accorde: boolean; colonne: boolean }): string {
  const P = majuscule(args.plateforme);
  if (!args.accorde) {
    return `${P} n'a pas accordé le retour des notes à cette activité : les notes d'un examen se recopieront à la main.`;
  }
  return args.colonne
    ? `${P} accepte les notes de cette activité, dans la colonne qu'elle a créée : celles d'un examen y partiront à la publication des résultats. Pour une partie de classe, seule la progression y part (en cours, terminée), jamais une note.`
    : `${P} accepte les notes de cette activité : celles d'un examen y partiront à la publication des résultats. Pour une partie de classe, rien ne part tant que ${args.plateforme} n'a pas créé de colonne de notes pour l'activité.`;
}
