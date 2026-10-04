/**
 * LE BILAN DU TRIMESTRE : séparer la qualité d'une décision de son résultat.
 *
 * Un trimestre réussi ne prouve pas qu'on a bien décidé, et un trimestre raté
 * ne prouve pas le contraire. Le bilan rejoue donc chaque décision sous trente
 * tirages du même hasard, les quatre autres choix inchangés :
 *
 *   · la QUALITÉ d'une décision se lit sur la moyenne des trente tirages ;
 *   · la CHANCE, sur l'écart entre ce que le joueur a vécu dans la fenêtre de
 *     semaines que la décision couvre et ce qu'il aurait vécu en moyenne.
 *
 * Les deux se croisent en quatre cas — mérité, malchance, chance, leçon — qui
 * sont la seule chose que le joueur doit emporter : la case « chance » est
 * celle d'une décision à ne pas refaire, même si elle a payé.
 *
 * Tout est pur : le même état de partie donne le même bilan.
 */
import {
  D,
  GRAINES_DU_BILAN,
  fenetre,
  moyenne,
  rejouer,
  simuler,
  type Chemin,
  type Rejeu,
  type Trimestre,
} from "@/engine/episodes/trimestre-qui-derape";
import {
  ETAPES,
  REFERENCES,
  REMISES_REFLEXES,
  type Etape,
  type IdDiagnostic,
} from "@/config/episodes/trimestre-qui-derape";

/** L'état d'une partie, tel que le bilan le lit. */
export interface PartieJouee {
  graine: number;
  chemin: Chemin;
  /** Les sources consultées, étape par étape. */
  consultes: readonly (readonly string[])[];
  jours: number;
  diagnostic: IdDiagnostic;
  reevaluation: { choix: "maintient" | "corrige"; principal: IdDiagnostic | null };
  /** La prévision de transformation en semaine 4, en pourcentage. */
  prevision: number;
  confiance: number;
}

/** Les informations sans lesquelles chaque décision se prend à l'aveugle. */
const DECISIVES: readonly (readonly string[])[] = ETAPES.map((e) =>
  e.sources.filter((s) => s.nature === "decisive").map((s) => s.id),
);

/** La fenêtre de semaines sur laquelle chaque décision agit d'abord, et si elle porte la pénalité de délai. */
const FENETRES: readonly [number, number, boolean][] = [
  [2, 4, false],
  [5, 5, false],
  // La décision d'équipe se joue sur l'arrêt possible de Julie, semaines 8 à 11.
  [6, 11, false],
  [8, 9, true],
  [10, 11, false],
  [12, 13, false],
];

export type Cas = "bonne-fav" | "bonne-defav" | "faible-fav" | "faible-defav";

export const CAS: Record<Cas, { nom: string; aide: string }> = {
  "bonne-fav": { nom: "Mérité", aide: "bonne décision, bon résultat" },
  "bonne-defav": { nom: "Malchance", aide: "bonne décision, à refaire quand même" },
  "faible-fav": { nom: "Chance", aide: "décision faible, à ne pas refaire" },
  "faible-defav": { nom: "Leçon", aide: "décision faible, résultat faible" },
};

export interface DecisionAnalysee {
  d: number;
  e: Etape;
  pris: Rejeu;
  meilleur: Rejeu;
  /** L'option qui protège le mieux dans les mauvais tirages. */
  plusSur: Rejeu;
  rang: number;
  n: number;
  bonne: boolean;
  favorable: boolean;
  cas: Cas;
}

export interface Analyse {
  trimestre: Trimestre;
  /** Le résultat moyen des choix du joueur sur les trente tirages. */
  attendu: number;
  decisions: DecisionAnalysee[];
  references: { nom: string; valeur: number }[];
}

/**
 * Une décision est BONNE quand elle capte au moins 70 % de l'écart entre la
 * pire et la meilleure option, ou qu'elle est à moins de 1 000 € de la
 * meilleure : deux options presque à égalité sont toutes deux de bons choix.
 * L'option la PLUS SÛRE l'est aussi tant qu'elle reste à moins de 3 000 € de
 * la meilleure : payer un peu d'espérance pour se protéger d'un mauvais
 * tirage est une décision défendable, pas une erreur.
 */
export function analyser(p: PartieJouee): Analyse {
  const trimestre = simuler(p.chemin, p.graine, p.jours);
  const attendu = moyenne(GRAINES_DU_BILAN.map((g) => simuler(p.chemin, g, p.jours).objectif));
  const decisions = ETAPES.map((e, d): DecisionAnalysee => {
    const options = rejouer(p.chemin, d, e.options.length, p.jours);
    const tri = [...options].sort((a, b) => b.attendu - a.attendu);
    const pris = options[p.chemin[d]!]!;
    const meilleur = tri[0]!;
    const pire = tri.at(-1)!;
    const efficacite = (pris.attendu - pire.attendu) / Math.max(1, meilleur.attendu - pire.attendu);
    const plusSur = options.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    const bonne =
      efficacite >= 0.7 ||
      meilleur.attendu - pris.attendu < 1000 ||
      (pris === plusSur && meilleur.attendu - pris.attendu < 3000);
    const [de, a, dso] = FENETRES[d]!;
    const vecu = fenetre(trimestre, de, a, dso);
    const enMoyenne = moyenne(
      GRAINES_DU_BILAN.map((g) => fenetre(simuler(p.chemin, g, p.jours), de, a, dso)),
    );
    const favorable = vecu >= enMoyenne;
    return {
      d,
      e,
      pris,
      meilleur,
      plusSur,
      rang: tri.indexOf(pris) + 1,
      n: options.length,
      bonne,
      favorable,
      cas: `${bonne ? "bonne" : "faible"}-${favorable ? "fav" : "defav"}`,
    };
  });
  const references = REFERENCES.map((r) => ({
    nom: r.nom,
    valeur: simuler(r.chemin as unknown as Chemin, p.graine, p.jours).objectif,
  }));
  return { trimestre, attendu, decisions, references };
}

/* ------------------------------------------------------------------------- */

const nombre = (v: number, d = 1) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });

export interface Constat {
  /** 1 : acquis ; entre 0 et 1 : en partie ; 0 : à travailler. */
  score: number;
  texte: string;
}

const JUSTES: readonly IdDiagnostic[] = ["karim", "livraison"];

/** Quatre comportements observés, dans l'ordre où le joueur les a eus. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const total = DECISIVES.flat().length;
  const vues = DECISIVES.reduce(
    (s, ids, i) => s + ids.filter((id) => p.consultes[i]?.includes(id)).length,
    0,
  );
  const lesDeuxDuDebut = DECISIVES[0]!.every((id) => p.consultes[0]?.includes(id));
  const information: Constat = {
    score: vues / total,
    texte: `Avant de décider, vous avez consulté ${vues} des ${total} informations décisives${
      lesDeuxDuDebut ? ", dont, en semaine 1, les deux qui révélaient les vraies causes" : ""
    }.`,
  };

  const d = p.diagnostic;
  const prixVus = p.consultes[0]?.includes("prix");
  const lecture: Record<IdDiagnostic, string> = {
    karim:
      "Votre diagnostic de la semaine 1 était juste : les clients de Karim n'étaient plus suivis.",
    livraison:
      "En semaine 1, vous avez vu le délai de livraison : une vraie cause, mais pas la principale. Les clients de Karim n'étaient plus suivis.",
    prix: `En semaine 1, vous avez retenu le prix comme problème principal${
      prixVus
        ? ", alors que l'analyse des prix que vous aviez consultée les montrait alignés"
        : " ; l'analyse des prix, que vous n'avez pas consultée, les montrait alignés"
    }.`,
    motivation:
      "En semaine 1, vous avez retenu la motivation de l'équipe ; rien dans les informations disponibles ne l'indiquait.",
  };
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (JUSTES.includes(r.principal) && !JUSTES.includes(d)) {
      suite = " En semaine 4, vous l'avez corrigé à bon escient.";
    } else if (!JUSTES.includes(r.principal) && JUSTES.includes(d)) {
      suite = " En semaine 4, vous avez abandonné une bonne piste.";
    }
  } else if (!JUSTES.includes(d)) {
    suite = " En semaine 4, vous l'avez maintenu malgré les signaux sur la livraison.";
  }
  const diagnostic: Constat = {
    score: d === "karim" ? 1 : d === "livraison" ? 0.6 : 0,
    texte: lecture[d] + suite,
  };

  const remises = REMISES_REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const remise: Constat = {
    score: remises === 0 ? 1 : remises === 1 ? 0.6 : 0,
    texte:
      remises === 0
        ? "Vous n'avez jamais répondu à une baisse par une remise générale."
        : `Face à une difficulté, vous avez choisi la remise ${remises} fois sur ${REMISES_REFLEXES.length}. À chaque fois, sur trente tirages, elle coûtait plus de marge qu'elle n'en rapportait.`,
  };

  const reel = t.semaines[4]!.transfo * 100;
  const ecart = Math.abs(p.prevision - reel);
  const tropSur = ecart > 2.5 && p.confiance >= 70;
  const calibrage: Constat = {
    score: ecart <= 1 ? 1 : ecart <= 2.5 ? 0.6 : 0,
    texte: `Vous aviez prévu ${nombre(p.prevision)} % de transformation en semaine 4, avec une confiance de ${p.confiance} % ; réalisé : ${nombre(reel)} %, soit un écart de ${nombre(ecart)} point${ecart >= 2 ? "s" : ""}${
      tropSur ? ". Votre confiance était plus forte que votre précision" : ""
    }.`,
  };

  const reaffecte = p.chemin[D.karim] === 1;
  const choixEquipe = p.chemin[D.equipe];
  const arret = t.arret
    ? " Julie s'est arrêtée quatre semaines, des semaines 8 à 11."
    : " Julie a tenu jusqu'au bout du trimestre.";
  const equipe: Constat =
    choixEquipe === 0
      ? {
          score: 1,
          texte: `Face à la surcharge de Julie, vous avez réduit sa charge : c'est ce qui diminuait le plus le risque qu'elle s'arrête, pour presque rien.${arret}`,
        }
      : choixEquipe === 1
        ? {
            score: 0.6,
            texte: `Face à la surcharge de Julie, vous avez pris un intérimaire : le choix le plus sûr, mais 6 000 € de marge pour un risque qu'on pouvait réduire autrement.${arret}`,
          }
        : choixEquipe === 2
          ? {
              score: 0,
              texte: `Face à la surcharge de Julie, vous avez accordé une prime : elle reconnaît l'effort, mais ne retire aucune heure de travail. Le risque d'arrêt restait entier.${arret}`,
            }
          : {
              score: reaffecte ? 0 : 0.6,
              texte: `Vous avez demandé à Julie de tenir${reaffecte ? ", alors qu'elle portait en plus une partie des comptes de Karim" : ""}.${arret}`,
            };

  return [information, diagnostic, remise, calibrage, equipe];
}

/** L'axe de travail : un seul, le premier qui manque dans l'ordre où un manager les apprend. */
export function axeDeTravail([information, diagnostic, remise, calibrage, equipe]: Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Vérifier la cause avant d'agir",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le détail par commercial : la moyenne de l'agence cachait deux portefeuilles qui décrochaient.",
    };
  }
  if (remise!.score === 0) {
    return {
      titre: "Questionner le réflexe remise",
      texte:
        "Avant chaque remise, chiffrez ce qu'elle coûte sur toutes les ventes, pas seulement ce qu'elle peut faire gagner.",
    };
  }
  if (equipe!.score === 0) {
    return {
      titre: "Protéger la capacité de l'équipe",
      texte:
        "Quand une personne est surchargée, la question n'est pas de la motiver mais de lui retirer du travail. Une équipe qui s'arrête coûte plus cher que tout ce qu'on lui demandait.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où la moyenne décroche",
      texte:
        "Un indicateur global qui baisse se décompose : par commercial, par client, par produit. La cause est presque toujours locale.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}
