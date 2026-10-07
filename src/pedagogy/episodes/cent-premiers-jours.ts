/**
 * ÉPISODE 30 — LES CENT PREMIERS JOURS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Thibaut montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent
 * de lui.
 *
 * Deux choses du contrat sont contournées comme dans les épisodes précédents :
 * la réponse de Christophe, l'issue du devis Dorval et l'arrivée (ou non) du
 * renfort promis dépendent de choix antérieurs ou se lisent des semaines plus
 * tard, elles passent donc par `evenements().lies` à la bonne semaine ; et
 * `lire` renvoie des clés non affichées (Christophe allié ou parti, les bons
 * de la veille) qui nourrissent les messages et les sources.
 */
import {
  ARTISANS_DEPART,
  BUDGET,
  CONFIANCE_DEPART,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_ATTENTE,
  OBJECTIF_CONFIANCE,
  PERTE_PAR_JOUR,
  SEMAINES,
  SUITE,
  christopheAccepte,
  evenements,
  hasard,
  renfortAccorde,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/cent-premiers-jours";
import {
  DIAGNOSTICS,
  ETAPES,
  IMPOSITIONS,
  MENAGEMENTS,
  PROMESSES,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/cent-premiers-jours";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un indice sur 100, lu sur une part. */
const sur100 = (v: number) => `${nombre(v * 100, 0)} sur 100`;
const points = (v: number) => `${nombre(v * 100, 0)} pt`;
const minutes = (v: number) => `${nombre(v, 0)} min`;
const jours = (v: number) => `${nombre(v)} j`;
/** Un écart au budget : positif, l'agence fait mieux que le budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} en dessous du budget`;

const JUSTES: readonly string[] = ["irritants", "comptoir"];

/** Ce que les décisions révèlent, dans l'ordre où un directeur les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qui marchait à 6 h 30 et ce qui coinçait sur les devis",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    irritants:
      "Votre diagnostic de la semaine 1 était juste : l'agence ne manquait ni de prix ni de méthode, elle perdait des chantiers sur des devis qui attendaient quatre jours et des artisans sur un comptoir saturé, deux problèmes que l'équipe connaissait.",
    comptoir:
      "En semaine 1, vous avez vu le comptoir saturé : un vrai problème, mais pas le seul. Les devis de chantier qui attendaient quatre jours coûtaient davantage.",
    prix: "En semaine 1, vous avez retenu les prix ; la comparaison avec le négoce d'en face les montrait alignés, et aucun artisan parti n'en parlait.",
    habitudes:
      "En semaine 1, vous avez vu une équipe qui vivait sur les habitudes de l'ancien directeur ; certaines de ces habitudes, comme les bons de la veille, étaient justement ce qui faisait venir les artisans.",
  };
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (JUSTES.includes(r.principal) && !JUSTES.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!JUSTES.includes(r.principal) && JUSTES.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!JUSTES.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "irritants" ? 1 : d === "comptoir" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const imposees = IMPOSITIONS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const menagees = MENAGEMENTS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n = imposees + menagees;
  const detail = [
    imposees ? `appliqué la recette de Dijon ${imposees} fois` : null,
    menagees ? `laissé les choses en l'état ${menagees} fois` : null,
  ]
    .filter(Boolean)
    .join(", et ");
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'êtes arrivé ni avec un plan tout fait, ni en vous interdisant de rien changer : vous avez écouté, réglé ce que l'équipe signalait, puis construit le plan avec elle."
        : `En arrivant, vous avez ${detail}, sur ${ETAPES.length} décisions.${
            imposees
              ? " La recette d'ailleurs casse ce qui marche ici, et vide le crédit du nouveau venu."
              : ""
          }${menagees ? " Ne rien changer laisse l'agence là où vous l'avez trouvée, et la direction attendre." : ""}${
            t.veilleSupprimee
              ? " Les bons de la veille ont disparu, et une partie des artisans du matin avec eux."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.confiance * 100,
    "de confiance de l'équipe en semaine 3",
    "points",
    { juste: 4, proche: 10 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const associe = p.chemin[D.adjoint] === 0;
  const promesses = PROMESSES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n2 = (associe ? 1 : 0) + (promesses === 0 ? 1 : 0);
  const adjoint: Constat = {
    score: n2 === 2 ? 1 : n2 === 1 ? 0.6 : 0,
    texte: `${
      associe
        ? `Vous avez fait de Christophe, l'adjoint qui espérait le poste, le responsable du pôle chantiers${
            t.christopheAccepte
              ? ", et il est devenu votre meilleur allié"
              : " ; il a refusé, mais l'offre était faite"
          }.`
        : `Vous n'avez pas donné de vrai rôle à Christophe, l'adjoint qui espérait le poste${
            t.christophePart ? " : il est parti en semaine 10, avec une partie de ses clients" : ""
          }.`
    } ${
      promesses === 0
        ? "Vous n'avez rien promis que vous ne teniez déjà."
        : `Vous avez promis ${promesses === 1 ? "une fois" : "deux fois"} avant d'en avoir les moyens${
            t.renfortAccorde === false ? " ; le renfort annoncé à l'équipe n'est jamais venu" : ""
          }. Une promesse engage dès qu'elle est faite.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, adjoint];
}

export function axe([information, diagnostic, reflexe, calibrage, adjoint]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Comprendre avant de changer",
      texte:
        "Rejouez l'épisode en passant d'abord une matinée au comptoir à 6 h 30 et en lisant les devis de chantier : ce qui faisait venir les artisans et ce qui faisait perdre les chantiers ne figuraient sur aucun tableau.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni le plan d'ailleurs, ni l'immobilisme",
      texte:
        "Appliquer la recette de son ancienne agence casse ce qui marche ici ; ne rien toucher pour ne froisser personne laisse l'agence où elle était. Entre les deux : écouter, régler vite ce que l'équipe signale, puis construire le plan avec elle.",
    };
  }
  if (adjoint!.score === 0) {
    return {
      titre: "Faire de l'adjoint déçu un allié",
      texte:
        "Celui qui espérait le poste connaît souvent mieux que vous les clients et l'équipe. Un vrai rôle, avec un cadre, en fait un allié ; le recadrer ou le contourner en fait un opposant. Et ne promettez que ce que vous tenez déjà.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que l'équipe sait déjà",
      texte:
        "Les vrais problèmes d'une agence qui tourne « correctement, sans plus » sont rarement les prix ou les habitudes : ce sont des irritants que l'équipe connaît et que personne n'a réglés. Faites-les dire avant de juger.",
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

const CHRISTOPHE = { de: "Christophe Rambaud", role: "Adjoint, ventes chantier" } as const;
const VINCENT = { de: "Gérard Rabier", role: "Directeur régional des agences" } as const;
const AICHA = { de: "Amina Ouarab", role: "Vendeuse comptoir" } as const;
const EMILIE = { de: "Axelle Peyrol", role: "Assistante commerciale" } as const;

export const EPISODE_PRISE_DE_POSTE: Episode<Trimestre> = {
  code: "cent-premiers-jours",
  numero: 22,
  domaine: "Prise de poste",
  titre: "Les cent premiers jours",
  resume:
    "Un nouveau directeur d'agence, une équipe qui l'observe, un adjoint qui espérait le poste, une direction pressée. Comprendre avant de changer, gagner vite sur ce que l'équipe signale.",
  persona:
    "Vous êtes Thibaut Arnal, nouveau directeur de l'agence Arvel Distribution de Meyzieu, arrivé de l'agence de Dijon, que vous avez dirigée six ans. Votre agence : quinze personnes, vous compris. Christophe Rambaud, votre adjoint, espérait le poste ; Jean-Paul Chevrier, votre prédécesseur, apprécié de tous, vient de partir à la retraite.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge budgétée sur le trimestre, coûts compris" },
    { fort: `${ARTISANS_DEPART}`, texte: "artisans réguliers, à garder et à faire revenir" },
    {
      fort: `${nombre(OBJECTIF_CONFIANCE * 100, 0)} sur 100`,
      texte: "de confiance de l'équipe au baromètre",
    },
    { fort: "Semaine 13", texte: "votre bilan des cent jours devant le comité régional" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de marge de l'agence, coûts des décisions, erreurs et départs compris, plus ce que la dynamique laissée en semaine 13 rapportera, ou coûtera, sur les deux mois suivants.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les devis de chantier qui attendent votre signature finissent par partir ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...EMILIE,
        alerte: true,
        texte: `Pendant ce temps, des devis de chantier sont restés sans signature, et des artisans ont commandé ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la confiance de l'équipe au baromètre en semaine 3, sur 100",
    unite: "sur 100",
    placeholder: "35",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[3]!.confiance * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "ecart",
      nom: "Écart au budget",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "à date, marge moins coûts, depuis votre arrivée"
          : `${kE(BUDGET)} de marge budgétée sur le trimestre`,
    },
    {
      cle: "artisans",
      nom: "Artisans réguliers",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => `à votre arrivée : ${ARTISANS_DEPART}`,
    },
    {
      cle: "attente",
      nom: "Attente au comptoir à 7 h 15",
      format: minutes,
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_ATTENTE} minutes au plus`,
    },
    {
      cle: "delaiDevis",
      nom: "Délai des devis de chantier",
      format: jours,
      sensBon: -1,
      aide: () => "meilleures agences de la région : 2 jours",
    },
    {
      cle: "confiance",
      nom: "Confiance de l'équipe",
      format: sur100,
      formatEcart: points,
      sensBon: 1,
      aide: () =>
        `baromètre hebdomadaire ; objectif : ${nombre(OBJECTIF_CONFIANCE * 100, 0)} au moins`,
      jauge: (l) =>
        l.confiance === null || l.confiance === undefined
          ? null
          : {
              part: Math.min(1, l.confiance / OBJECTIF_CONFIANCE),
              enRetard: l.confiance < CONFIANCE_DEPART,
            },
    },
  ],
  contexte(l, decisions) {
    const ecart = l.ecart ?? 0;
    return {
      marge: kE(l.marge ?? 0),
      ecart:
        ecart >= 0
          ? `${kE(ecart)} au-dessus de son budget`
          : `${kE(-ecart)} en dessous de son budget`,
      artisans: nombre(l.artisans ?? 0, 0),
      attente: minutes(l.attente ?? 0),
      delai: jours(l.delaiDevis ?? 0),
      confiance: sur100(l.confiance ?? 0),
      ecoute: decisions[D.arrivee] === 1,
      veille: l.veille === 1,
      allie: l.christophe === 1,
      christopheParti: l.christophe === -1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ecart = semaines.reduce((x, w) => x + w.marge - w.cout - BUDGET / SEMAINES, 0);
    return [
      ["Écart au budget, période", kE(ecart)],
      [`Artisans réguliers, sem. ${a}`, nombre(t.semaines[a]!.artisans, 0)],
      [`Confiance de l'équipe, sem. ${a}`, sur100(t.semaines[a]!.confiance)],
    ];
  },
  courbe: {
    titre: "Marge de l'agence, semaine par semaine",
    cle: "marge",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [15000, 20000, 25000, 30000, 35000, 40000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.marge!)} · ${nombre(s.artisans!, 0)} artisans réguliers`,
      `attente ${minutes(s.attente!)} · devis en ${jours(s.delaiDevis!)} · confiance ${sur100(s.confiance!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.irritant && choix === 2) {
      // La direction accorde ou non le renfort selon le hasard du trimestre, pas selon les décisions.
      const oui = renfortAccorde(graine);
      return [
        {
          ...VINCENT,
          alerte: !oui,
          texte: oui ? REPONSES.renfortAccorde : REPONSES.renfortRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.renfort !== null) {
      lies.push({
        ...AICHA,
        heure: "sem. 6",
        alerte: !arrive.renfort,
        texte: arrive.renfort ? REPONSES.renfortArrive : REPONSES.renfortAttendu,
      });
    }
    if (arrive.christophe !== null) {
      // Sa réponse dépend de la façon dont on l'a traité depuis le premier jour.
      const oui = christopheAccepte(chemin, graine);
      lies.push({
        ...CHRISTOPHE,
        heure: "sem. 6",
        alerte: !oui,
        texte: oui ? REPONSES.christopheAccepte : REPONSES.christopheRefuse,
      });
    }
    if (arrive.christophePart) {
      lies.push({ ...CHRISTOPHE, heure: "sem. 10", alerte: true, texte: REPONSES.christophePart });
    }
    if (arrive.chantier !== null) {
      lies.push({
        ...EMILIE,
        heure: "sem. 10",
        alerte: !arrive.chantier,
        texte: !arrive.chantier
          ? REPONSES.chantierPerdu
          : chemin[D.chantier] === 2
            ? REPONSES.chantierGagnePrix
            : REPONSES.chantierGagne,
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
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, dynamique laissée comprise`,
    formatObjectif: kE,
    noteDesBarres: `Écart au budget de marge de l'agence, coûts, erreurs et départs compris, plus ce que la dynamique laissée rapporte ou coûte sur les ${SUITE} semaines suivantes, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.`,
    tuiles(t) {
      const net = t.marge - t.couts;
      return [
        {
          nom: "Marge du trimestre",
          valeur: kE(net),
          aide: `coûts déduits ; budget ${kE(BUDGET)}`,
          tenu: net >= BUDGET,
        },
        {
          nom: "Artisans réguliers",
          valeur: nombre(t.artisansFinal, 0),
          aide: `en semaine 13 ; ${ARTISANS_DEPART} à votre arrivée`,
          tenu: t.artisansFinal >= ARTISANS_DEPART,
        },
        {
          nom: "Confiance de l'équipe",
          valeur: sur100(t.confianceFinale),
          aide: `en semaine 13 ; objectif ${nombre(OBJECTIF_CONFIANCE * 100, 0)}`,
          tenu: t.confianceFinale >= OBJECTIF_CONFIANCE,
        },
        {
          nom: "Christophe",
          valeur: t.christophePart
            ? "parti"
            : t.christopheAccepte
              ? "pôle chantiers"
              : "resté, sans rôle",
          aide: t.christophePart
            ? "parti en semaine 10, avec des clients"
            : t.christopheAccepte
              ? "l'adjoint déçu devenu allié"
              : "l'adjoint qui espérait le poste",
          tenu: t.christopheAccepte === true && !t.christophePart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.renfortAccorde !== null
          ? [
              {
                titre: "La direction régionale",
                texte: t.renfortAccorde
                  ? "a accordé le renfort que vous aviez promis à l'équipe."
                  : "a refusé le renfort que vous aviez déjà promis à l'équipe.",
              },
            ]
          : []),
        ...(t.chantierGagne !== null
          ? [
              {
                titre: "Dorval Bâtiment",
                texte: t.chantierGagne
                  ? "a retenu l'offre de l'agence pour la résidence des Peupliers."
                  : "a retenu le négoce d'en face pour la résidence des Peupliers.",
              },
            ]
          : []),
        {
          titre: "Christophe",
          texte: t.christopheAccepte
            ? "a accepté le pôle chantiers en semaine 6, et l'a tenu jusqu'au bout."
            : t.christophePart
              ? `${t.christopheAccepte === false ? "a refusé le pôle chantiers, puis " : ""}est parti en semaine 10 chez un concurrent, avec une partie de ses clients.`
              : t.christopheAccepte === false
                ? "a refusé le pôle chantiers, et il est resté sur ses clients."
                : "est resté, sans autre rôle que celui de l'intérim.",
        },
      ];
    },
  },
  comportements,
  axe,
};
