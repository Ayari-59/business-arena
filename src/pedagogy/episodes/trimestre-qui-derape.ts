/**
 * ÉPISODE 1 — LE TRIMESTRE QUI DÉRAPE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici en une définition d'épisode : ce que le tableau de bord
 * montre, ce que la courbe trace, ce sur quoi le bilan juge, et ce que les
 * décisions révèlent du joueur.
 */
import {
  ARRET,
  D,
  DSO_SEUIL,
  BUDGET_REMISES,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_CA,
  OBJECTIF_MARGE,
  PERTE_PAR_JOUR,
  SEMAINES,
  deltaAccepte,
  deltaReduit,
  deltaVexee,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Chemin,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/trimestre-qui-derape";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REMISES_REFLEXES,
  REPONSES_DE_DELTA,
  type IdDiagnostic,
} from "@/config/episodes/trimestre-qui-derape";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Six comportements observés, dans l'ordre où le joueur les a eus. */
const JUSTES: readonly string[] = ["karim", "livraison"];

/** Quatre comportements observés, dans l'ordre où le joueur les a eus. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui révélaient les vraies causes",
  );

  const d = p.diagnostic as IdDiagnostic;
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

  const calibrage = constatCalibrage(
    p,
    t.semaines[4]!.transfo * 100,
    "de transformation en semaine 4",
    "%",
    { juste: 1, proche: 2.5 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

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
export function axeDeTravail([
  information,
  diagnostic,
  remise,
  calibrage,
  equipe,
]: readonly Constat[]): {
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
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const DELTA = { de: "Achats, Groupe Delta", role: "Grand compte" } as const;

export const EPISODE_TRIMESTRE: Episode<Trimestre> = {
  code: "trimestre-qui-derape",
  numero: 1,
  domaine: "Pilotage commercial et marge",
  titre: "Le trimestre qui dérape",
  resume:
    "Une agence commerciale dont la transformation des devis décroche. Trouver la cause avant de toucher aux prix.",
  persona:
    "Vous êtes Claire Morel, cheffe de l'agence de Lyon d'Arvel Distribution, fournisseur des artisans du bâtiment. Votre équipe : sept commerciaux, une assistante, une administratrice des ventes.",
  mandat: [
    { fort: kE(OBJECTIF_CA), texte: "de chiffre d'affaires" },
    { fort: "30 %", texte: "de marge brute au moins" },
    { fort: kE(BUDGET_REMISES), texte: "de budget de remises" },
    { fort: `${DSO_SEUIL} jours`, texte: "de délai de paiement des clients, au plus" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge brute dégagée, moins le coût d'un délai de paiement trop long.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des affaires se signent ailleurs.",
    perte(jours) {
      const perdu = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Thomas Petit",
        role: "Commercial, secteur Centre",
        alerte: true,
        texte: `Pendant ce temps, l'affaire Cozzi (${euros(perdu)}) s'est signée chez Brico-Pro Rhône.`,
      };
    },
  },
  prevision: {
    libelle: "la transformation des devis en semaine 4",
    unite: "%",
    placeholder: "34",
    min: 0,
    max: 100,
    step: 0.5,
    reel: (t) => t.semaines[4]!.transfo * 100,
  },

  simuler: (chemin, graine, jours) => simuler(chemin as Chemin, graine, jours),
  lire: (decisions, graine, jours, semaine) => ({
    ...tableauDeBord(decisions, graine, jours, semaine),
  }),
  indicateurs: [
    {
      cle: "ca",
      nom: "Chiffre d'affaires",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `objectif à date ${kE(l.cible ?? 0)}`
          : `objectif ${kE(OBJECTIF_CA)} en 13 semaines`,
      jauge: (l) =>
        l.cible
          ? { part: Math.min(1, (l.ca ?? 0) / l.cible), enRetard: (l.ca ?? 0) < l.cible }
          : null,
    },
    {
      cle: "marge",
      nom: "Marge brute",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "mandat : 30 % au moins",
    },
    {
      cle: "transfo",
      nom: "Transformation des devis",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `semaine ${semaine}` : "semaine dernière ; 38 % il y a un mois",
    },
    {
      cle: "dso",
      nom: "Délai de paiement",
      format: (v) => `${nombre(v, 0)} j`,
      sensBon: -1,
      aide: () => "au-delà de 55 j : 1 500 € par jour",
    },
    {
      cle: "remises",
      nom: "Remises accordées",
      format: kE,
      sensBon: -1,
      aide: () => "budget du trimestre : 40 k€",
    },
  ],
  contexte(l, decisions) {
    const ecart = (l.cible ?? 0) - (l.ca ?? 0);
    return {
      transfo4: taux(l.transfo ?? 0),
      marge: l.marge == null ? "—" : taux(l.marge),
      dso: nombre(l.dso ?? 0, 0),
      ecart,
      ecartTxt: kE(ecart),
      reaffecte: decisions[D.karim] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ca = semaines.reduce((x, w) => x + w.ca, 0);
    const marge = semaines.reduce((x, w) => x + w.marge, 0);
    return [
      ["Chiffre d'affaires", kE(ca)],
      ["Marge brute", taux(marge / ca)],
      [`Transformation, sem. ${a}`, taux(t.semaines[a]!.transfo)],
    ];
  },
  courbe: {
    titre: "Chiffre d'affaires, semaine par semaine",
    cle: "ca",
    cible: OBJECTIF_CA / SEMAINES,
    libelleCible: `objectif : ${kE(OBJECTIF_CA / SEMAINES)} par semaine`,
    graduations: [50000, 100000],
    format: kE,
    details: (s) => [
      `${kE(s.ca!)} · marge ${taux(s.marge! / s.ca!)}`,
      `transformation ${taux(s.transfo!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape !== D.delta) return null;
    if (choix === 1) {
      return [
        {
          ...DELTA,
          alerte: deltaVexee(graine),
          texte: deltaAccepte(graine)
            ? REPONSES_DE_DELTA.accepte
            : deltaVexee(graine)
              ? REPONSES_DE_DELTA.vexee
              : REPONSES_DE_DELTA.refuseContreProposition,
        },
      ];
    }
    if (choix === 2) {
      return [
        {
          ...DELTA,
          texte: deltaReduit(graine) ? REPONSES_DE_DELTA.reduit : REPONSES_DE_DELTA.maintient,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin as Chemin, graine, de, a);
    const lies: Message[] = arrive.arret
      ? [
          {
            de: "Ressources humaines",
            role: "Siège",
            heure: `sem. ${ARRET.de}`,
            alerte: true,
            texte:
              "Julie Roux est en arrêt de travail pour quatre semaines. Ses clients n'ont plus d'interlocuteur jusqu'à la semaine 11.",
          },
        ]
      : [];
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${kE(t.objectif)} de marge, pénalités déduites`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge brute du trimestre moins la pénalité de délai de paiement, sous les aléas que vous avez joués. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const tauxDeMarge = t.marge / t.ca;
      return [
        {
          nom: "Chiffre d'affaires",
          valeur: kE(t.ca),
          aide: "objectif 1 200 k€",
          tenu: t.ca >= OBJECTIF_CA,
        },
        {
          nom: "Marge brute",
          valeur: taux(tauxDeMarge),
          aide: "mandat : 30 % au moins",
          tenu: tauxDeMarge >= OBJECTIF_MARGE,
        },
        {
          nom: "Délai de paiement",
          valeur: `${nombre(t.dsoFin, 0)} j`,
          aide: t.penalite > 0 ? `pénalité ${kE(t.penalite)}` : "sous les 55 jours",
          tenu: t.dsoFin <= DSO_SEUIL,
        },
        {
          nom: "Remises accordées",
          valeur: kE(t.remises),
          aide: "budget 40 k€",
          tenu: t.remises <= BUDGET_REMISES,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Julie",
          texte: t.arret
            ? "arrêtée quatre semaines, des semaines 8 à 11."
            : "elle a tenu jusqu'au bout du trimestre.",
        },
      ];
    },
  },
  comportements,
  axe: axeDeTravail,
};
