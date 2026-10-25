/**
 * L'EDI QUI S'IMPOSE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Lou montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de sa
 * manière d'organiser les échanges entre la laiterie et ses partenaires.
 *
 * Lou n'est pas à la direction : le tableau de bord montre ce que suit
 * l'administration des ventes (les erreurs de saisie, les messages rejetés,
 * les palettes refusées, les factures refusées), et le bilan parle de formats
 * communs et d'interopérabilité, pas de stratégie.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  MESSAGES_PAR_COMMANDE,
  NEUTRE,
  O,
  OBJECTIF_ERREURS,
  OBJECTIF_PALETTES,
  OBJECTIF_REJETS,
  PERTE_PAR_JOUR,
  RECEPTION,
  SEMAINES,
  SEMAINE_FACTURE_ELECTRONIQUE,
  SEMAINE_INCIDENT,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/edi-qui-s-impose";
import {
  DIAGNOSTICS,
  ETAPES,
  PREVISION,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/edi-qui-s-impose";
import type {
  Constat,
  Episode,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";
import { kE1 } from "./libre-service-qui-perd";

const pc = (v: number) => taux(v, 0);
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart au budget : positif, les échanges ont coûté moins que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0
    ? `${kE1(v)} sous le budget des échanges`
    : `${kE1(-v)} au-delà du budget des échanges`;

/** Les seuils de la prévision des commandes de la semaine 3 : juste, et proche. */
export const SEUILS_PREVISION = { juste: 8, proche: 20 } as const;

/** Les décisions d'échange entre organisations, et la bonne option : un langage commun avec chaque partenaire. */
export const LANGAGE_COMMUN = [
  [D.reception, O.reception.relier],
  [D.rejets, O.rejets.fiches],
  [D.securite, O.securite.canalReconnu],
  [D.facture, O.facture.plateforme],
  [D.transport, O.transport.standard],
] as const;

/** Ce que les décisions révèlent, dans l'ordre où l'administration des ventes les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce que coûtait la ressaisie",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    ressaisie: `Votre diagnostic de la semaine 1 était juste : ${pc(RECEPTION[O.reception.ressaisir].erreur)} des commandes recopiées portaient une erreur, et l'enseigne voulait des messages lus sans ressaisie.`,
    codes:
      "En semaine 1, vous avez vu les codes des fiches articles : une vraie cause des rejets, mais pas la principale. Le gros des coûts venait des commandes recopiées.",
    volumes:
      "En semaine 1, vous avez retenu les volumes ; ils avaient à peine bougé. C'est la ressaisie qui coûtait.",
    enseigne:
      "En semaine 1, vous avez accusé l'enseigne ; elle demandait un langage commun, que toute la grande distribution utilise déjà.",
  };
  const justes = ["ressaisie", "codes"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "ressaisie" ? 1 : d === "codes" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = new Set(
    REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec]) => dec),
  ).size;
  const reflexes: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais choisi la réponse réflexe : ni dérogation, ni PDF, ni format maison, ni raccordement sans compter."
        : `Vous avez choisi la réponse réflexe ${n} fois sur ${ETAPES.length} décisions : garder ses habitudes, appeler numérique un PDF, inventer son propre format ou tout raccorder sans compter.${
            t.incident
              ? ` En semaine ${SEMAINE_INCIDENT}, une facture a été détournée sur le canal mal protégé.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.commandes,
    "Celtis en semaine 3",
    "commandes",
    SEUILS_PREVISION,
    (e) => `${nombre(e, 0)} commande${e >= 2 ? "s" : ""}`,
  );

  const communs = LANGAGE_COMMUN.filter(
    ([dec, o]) => p.chemin[dec] === o,
  ).length;
  const langage: Constat = {
    score: communs === LANGAGE_COMMUN.length ? 1 : communs >= 3 ? 0.6 : 0,
    texte:
      communs === LANGAGE_COMMUN.length
        ? "Avec l'enseigne, le transporteur et la plateforme de facturation, vous avez choisi chaque fois le standard que tous savent lire : les messages passent sans ressaisie ni rejet."
        : `Sur ${LANGAGE_COMMUN.length} échanges avec d'autres organisations, vous avez choisi ${communs} fois le standard commun. Ailleurs, un format maison, un PDF ou une ressaisie obligeaient quelqu'un à recopier ou à rejeter.`,
  };

  return [information, diagnostic, reflexes, calibrage, langage];
}

export function axe([
  information,
  diagnostic,
  reflexes,
  calibrage,
  langage,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter ce que coûte une ressaisie",
      texte:
        "Rejouez l'épisode en comptant d'abord les erreurs de saisie et en lisant le cahier des charges de l'enseigne : la ressaisie coûtait plus que n'importe quel outil.",
    };
  }
  if (langage!.score === 0) {
    return {
      titre: "Parler le langage des partenaires",
      texte:
        "Un échange entre organisations ne marche que sur un format que chacun sait lire. Un PDF, un tableur maison ou un chiffrement inconnu obligent l'autre à recopier, ou à rejeter.",
    };
  }
  if (reflexes!.score === 0) {
    return {
      titre: "Résister aux habitudes",
      texte:
        "Garder le fax, renvoyer un PDF, raccorder tout le monde sans compter : chaque réflexe paraît simple, et coûte ensuite en rejets, en refus ou en raccordements inutiles.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui coûte",
      texte:
        "Avant d'accuser l'enseigne ou les volumes, comptez les erreurs : c'est la ressaisie qui faisait les pénalités.",
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
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const MALO = { de: "Malo Jézéquel", role: "Service informatique" } as const;
const CELTIS = {
  de: "Bastien Ollivier",
  role: "Responsable des échanges, Celtis",
} as const;
const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;

export const EPISODE_EDI: Episode<Trimestre> = {
  code: "edi-qui-s-impose",
  numero: 104,
  domaine: "Système d'information et échanges entre organisations",
  titre: "L'EDI qui s'impose",
  resume:
    "Une enseigne impose l'échange de données informatisé : commandes, avis d'expédition, factures. Parler le même langage que ses partenaires, sans ressaisie.",
  persona:
    "Vous êtes Lou Le Bihan, à l'administration des ventes de la Laiterie de Kerbrélan, à Loudéac. Vous recevez les commandes des enseignes, préparez les avis d'expédition et les factures, avec Gwenola Rio. Vous rendez compte à Naïm Lefeuvre, directeur des grands comptes. Celtis, la première enseigne cliente, passe à l'EDI.",
  mandat: [
    {
      fort: pc(OBJECTIF_ERREURS),
      texte: "de commandes saisies avec une erreur, au plus",
    },
    {
      fort: `${OBJECTIF_REJETS}`,
      texte: "messages rejetés par semaine, au plus",
    },
    {
      fort: `${OBJECTIF_PALETTES}`,
      texte: "palettes refusées par semaine, au plus",
    },
    { fort: "0", texte: "facture refusée par l'enseigne" },
  ],
  jugement: `Naïm compte en euros ce que les échanges avec les clients ont coûté : le temps de saisie, les erreurs, les rejets, les palettes et les factures refusées, les incidents et les outils. Il le compare au budget de l'administration des ventes, ${kE1(BUDGET)}.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos échanges",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours, les commandes s'entassent et sont recopiées dans l'urgence, avec des erreurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...NAIM,
        alerte: true,
        texte: `Pendant que tu cherchais, des commandes recopiées dans l'urgence sont parties avec des erreurs : environ ${euros(perdu)} de pénalités.`,
      };
    },
  },
  prevision: {
    libelle: `le nombre de commandes de Celtis reçues en semaine 3. Repère : ${PREVISION.magasins} magasins, qui commandent chacun ${PREVISION.parMagasin} fois par semaine`,
    unite: "commandes",
    placeholder: "50",
    min: 0,
    max: 1000,
    step: 1,
    reel: (t) => t.semaines[3]!.commandes,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "erreurs",
      nom: "Commandes saisies avec une erreur",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: -1,
      aide: () => `objectif : ${pc(OBJECTIF_ERREURS)} au plus`,
    },
    {
      cle: "rejets",
      nom: "Messages rejetés",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () =>
        `objectif : ${OBJECTIF_REJETS} par semaine au plus ; ${MESSAGES_PAR_COMMANDE} messages par commande`,
    },
    {
      cle: "palettes",
      nom: "Palettes refusées",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_PALETTES} par semaine au plus`,
    },
    {
      cle: "factures",
      nom: "Factures refusées",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () =>
        `à partir de la semaine ${SEMAINE_FACTURE_ELECTRONIQUE} ; objectif : aucune`,
    },
    {
      cle: "couts",
      nom: "Coût des échanges",
      format: kE1,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE1(l.budgetADate ?? 0)} de budget sur ${kE1(BUDGET)}`
          : `budget : ${kE1(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.couts ?? 0) / BUDGET)),
              enRetard: (l.couts ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l) {
    return {
      erreurs: taux(l.erreurs ?? 0, 1),
      rejets: nombre(l.rejets ?? 0, 0),
      palettes: nombre(l.palettes ?? 0, 0),
      factures: nombre(l.factures ?? 0, 0),
      couts: kE1(l.couts ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [
        `Messages rejetés, sem. ${de} à ${a}`,
        nombre(
          semaines.reduce((x, w) => x + w.rejets, 0),
          0,
        ),
      ],
      [`Erreurs de saisie, sem. ${a}`, taux(t.semaines[a]!.erreurs, 1)],
      ["Coût de la période", kE1(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Messages rejetés, semaine par semaine",
    cle: "rejets",
    cible: OBJECTIF_REJETS,
    libelleCible: `objectif : ${OBJECTIF_REJETS} au plus`,
    graduations: [10, 30, 60],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.rejets!, 0)} messages rejetés · ${taux(s.erreurs!, 1)} d'erreurs de saisie`,
      `${nombre(s.palettes!, 0)} palettes refusées · ${nombre(s.factures!, 0)} factures refusées`,
    ],
  },
  reactions: () => null,
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.incident) {
      lies.push({
        ...MALO,
        heure: `sem. ${SEMAINE_INCIDENT}`,
        alerte: true,
        texte: REPONSES.incident,
      });
    }
    if (arrive.facturesRefusees) {
      lies.push({
        ...CELTIS,
        heure: `sem. ${SEMAINE_FACTURE_ELECTRONIQUE}`,
        alerte: true,
        texte: REPONSES.facturesRefusees,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({
      semaine: x.semaine,
      titre: x.imprevu.titre,
    })),

  bilan: {
    titre: (t) => ecartAuBudget(t.objectif),
    formatObjectif: kE1,
    noteDesBarres:
      "Écart au budget des échanges, saisie, erreurs, rejets, refus, incidents et outils compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Erreurs de saisie",
          valeur: taux(t.erreursMoyennes, 1),
          aide: `en moyenne ; objectif ${pc(OBJECTIF_ERREURS)} au plus`,
          tenu: t.erreursMoyennes <= OBJECTIF_ERREURS,
        },
        {
          nom: "Messages rejetés",
          valeur: nombre(t.rejets, 0),
          aide: `sur le trimestre ; objectif ${OBJECTIF_REJETS * SEMAINES} au plus`,
          tenu: t.rejets <= OBJECTIF_REJETS * SEMAINES,
        },
        {
          nom: "Palettes refusées",
          valeur: nombre(t.palettesRefusees, 0),
          aide: `sur le trimestre ; objectif ${OBJECTIF_PALETTES * SEMAINES} au plus`,
          tenu: t.palettesRefusees <= OBJECTIF_PALETTES * SEMAINES,
        },
        {
          nom: "Factures refusées",
          valeur: nombre(t.facturesRefusees, 0),
          aide: "sur le trimestre ; objectif : aucune",
          tenu: t.facturesRefusees < 1,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.incident
          ? [
              {
                titre: `Semaine ${SEMAINE_INCIDENT}`,
                texte: "une facture a été détournée sur le canal mal protégé.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
