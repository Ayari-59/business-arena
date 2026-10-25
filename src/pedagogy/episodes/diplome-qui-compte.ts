/**
 * LE DIPLÔME QUI COMPTE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la saison montre, ce que la
 * courbe trace, ce sur quoi le bilan juge Noa, et ce que ses décisions
 * révèlent de sa compréhension des liens entre le diplôme, l'emploi et le
 * salaire.
 *
 * Noa n'est pas à la direction : le tableau de bord montre ce que suit
 * l'assistance aux ressources humaines (les postes de cuisine tenus avec ou
 * sans CAP, les postes vides, les départs), et le bilan parle de diplôme,
 * d'expérience, de réseau et de grille de salaires.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  OBJECTIF_DEPARTS,
  OBJECTIF_SANS_CAP,
  OBJECTIF_VIDES,
  PERTE_PAR_JOUR,
  SAISONNIERS,
  TABLEAU_DES_DIPLOMES,
  DEBUT,
  SEMAINES_AVANT_DEPART,
  SEMAINE_DEPART_KARIM,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/diplome-qui-compte";
import {
  DIAGNOSTICS,
  ETAPES,
  PREVISION,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/diplome-qui-compte";
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
/** Un écart au budget de la saison : positif, la saison a coûté moins que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0
    ? `${kE1(v)} sous le budget de la saison`
    : `${kE1(-v)} au-delà du budget de la saison`;
/** Les lignes extrêmes du tableau fictif, pour les textes du bilan. */
const SANS_DIPLOME = TABLEAU_DES_DIPLOMES[0];
const CAP = TABLEAU_DES_DIPLOMES[1];

/** Les seuils de la prévision des titulaires du CAP : juste, et proche. */
export const SEUILS_PREVISION = { juste: 2, proche: 5 } as const;

/** Les décisions qui font raisonner sur le diplôme, l'emploi et le salaire, et leur bon choix. */
export const DIPLOME_EMPLOI_SALAIRE = [
  [D.recherche, O.recherche.lyceesEtCfa],
  [D.affectation, O.affectation.chacunSaPlace],
  [D.salaires, O.salaires.grille],
  [D.chef, O.chef.essai],
  [D.explication, O.explication.grille],
] as const;

/** Ce que les décisions révèlent, dans l'ordre où l'assistance aux ressources humaines les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où étaient les titulaires du CAP",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    rarete: `Votre diagnostic de la semaine 1 était juste : avec un CAP, ${pc(CAP.emploi)} des jeunes sont en emploi, contre ${pc(SANS_DIPLOME.emploi)} sans diplôme. Les titulaires du CAP de cuisine étaient rares, parce que déjà employés.`,
    logement:
      "En semaine 1, vous avez pensé au logement : une vraie difficulté des saisonniers, mais ceux qui refusaient nos postes de cuisine avaient déjà un emploi.",
    jeunes:
      "En semaine 1, vous avez retenu la motivation des jeunes ; le tableau montrait plutôt que les diplômés de cuisine étaient déjà embauchés.",
    salaires:
      "En semaine 1, vous avez retenu des salaires trop bas partout ; les postes sans qualification se remplissaient, seuls ceux de cuisine restaient vides.",
  };
  const justes = ["rarete", "logement"];
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
    score: d === "rarete" ? 1 : d === "logement" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = new Set(
    REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec]) => dec),
  ).size;
  const reflexes: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais choisi la réponse réflexe : ni le moins cher, ni le minimum pour tous, ni le seul réseau, ni le diplôme comme seule règle."
        : `Vous avez choisi la réponse réflexe ${n} fois sur ${ETAPES.length} décisions : le moins cher, le minimum pour tous, le seul réseau, le diplôme comme seule règle, ou une réponse qui ferme la discussion.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.candidatsCap,
    "parmi les candidatures",
    "titulaires du CAP",
    SEUILS_PREVISION,
    (e) => `${nombre(e, 0)} candidat${e >= 2 ? "s" : ""}`,
  );

  const bons = DIPLOME_EMPLOI_SALAIRE.filter(
    ([dec, o]) => p.chemin[dec] === o,
  ).length;
  const lien: Constat = {
    score: bons === DIPLOME_EMPLOI_SALAIRE.length ? 1 : bons >= 3 ? 0.6 : 0,
    texte:
      bons === DIPLOME_EMPLOI_SALAIRE.length
        ? "Vous avez raisonné sur le lien entre le diplôme, l'emploi et le salaire : chercher les diplômés là où ils sont, les placer au poste qui demande leur qualification, les payer selon la grille, reconnaître aussi l'expérience, et l'expliquer."
        : `Sur ${DIPLOME_EMPLOI_SALAIRE.length} décisions où le diplôme, l'emploi et le salaire étaient liés, vous en avez tranché ${bons} en tenant compte des deux : ce que le diplôme garantit, et ce que l'expérience apporte.`,
  };

  return [information, diagnostic, reflexes, calibrage, lien];
}

export function axe([
  information,
  diagnostic,
  reflexes,
  calibrage,
  lien,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le tableau avant de recruter",
      texte:
        "Rejouez l'épisode en lisant d'abord le tableau des diplômes et en triant les candidatures : les titulaires du CAP de cuisine étaient déjà presque tous employés.",
    };
  }
  if (lien!.score === 0) {
    return {
      titre: "Relier le diplôme, l'emploi et le salaire",
      texte:
        "Un diplôme aide à trouver un emploi et donne droit à un meilleur salaire, mais il ne dit pas tout : le poste demande une qualification, l'expérience compte, et une grille rend les écarts justes.",
    };
  }
  if (reflexes!.score === 0) {
    return {
      titre: "Ne pas payer le moins cher partout",
      texte:
        "Prendre les moins chers, payer tout le monde au minimum ou ne recruter que par le réseau coûte ensuite en plats ratés, en départs et en postes vides.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher qui a le diplôme",
      texte:
        "Quand un poste qualifié reste vide, regardez où sont ceux qui ont le diplôme demandé : un diplôme recherché, c'est un marché où les candidats ont le choix.",
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

const MARWA = { de: "Marwa Selmi", role: "Chargée de recrutement" } as const;
const MOUNIR = {
  de: "Mounir Belghazi",
  role: "Directeur des ressources humaines",
} as const;

export const EPISODE_DIPLOME: Episode<Trimestre> = {
  code: "diplome-qui-compte",
  numero: 63,
  domaine: "Diplôme, emploi et salaire",
  titre: "Le diplôme qui compte",
  resume:
    "Recruter les saisonniers de l'été : qui a le diplôme, où le trouver, à quel poste et à quel salaire. Le diplôme compte, l'expérience et le réseau aussi.",
  persona:
    "Vous êtes Noa Martin, en alternance au service des ressources humaines du Groupe Escale, à Annecy. Avec Marwa Selmi, chargée de recrutement, vous préparez le recrutement des saisonniers de l'été, sous la responsabilité de Mounir Belghazi, directeur des ressources humaines.",
  mandat: [
    {
      fort: `${OBJECTIF_VIDES}`,
      texte: "poste vide en cuisine, au plus, en moyenne",
    },
    {
      fort: `${OBJECTIF_SANS_CAP}`,
      texte: "poste de cuisine tenu sans CAP, au plus, en moyenne",
    },
    { fort: `${OBJECTIF_DEPARTS}`, texte: "départs sur la saison, au plus" },
    { fort: kE1(BUDGET), texte: "de budget pour les saisonniers" },
  ],
  jugement: `Mounir compte en euros ce que la saison a coûté : les salaires, les postes vides, les plats ratés, les départs et les remplacements, les tensions. Il en retire ce que rapportent les saisonniers qui reviendront l'an prochain, et compare au budget de la saison, ${kE1(BUDGET)}.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre saison",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours, les meilleurs candidats signent ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...MARWA,
        alerte: true,
        texte: `Pendant ce temps, deux candidats ont signé dans un autre hôtel : environ ${euros(perdu)} de recrutement à refaire.`,
      };
    },
  },
  prevision: {
    libelle: `le nombre de titulaires du CAP parmi les candidatures. Repère : ${PREVISION.candidatures} candidatures, dont environ ${pc(PREVISION.part)} avec un CAP`,
    unite: "titulaires du CAP",
    placeholder: "20",
    min: 0,
    max: 200,
    step: 1,
    reel: (t) => t.candidatsCap,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "cap",
      nom: "Cuisine tenue par un CAP",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "postes de cuisine tenus par un titulaire du CAP",
    },
    {
      cle: "sansCap",
      nom: "Cuisine tenue sans CAP",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_SANS_CAP} au plus`,
    },
    {
      cle: "vides",
      nom: "Postes vides en cuisine",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_VIDES} au plus`,
    },
    {
      cle: "departs",
      nom: "Départs",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "dans la semaine",
    },
    {
      cle: "couts",
      nom: "Coût de la saison",
      format: kE1,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE1(l.budgetADate ?? 0)} de budget sur ${kE1(BUDGET)}`
          : `budget : ${kE1(BUDGET)} pour la saison`,
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
      cap: nombre(l.cap ?? 0, 0),
      sansCap: nombre(l.sansCap ?? 0, 0),
      vides: nombre(l.vides ?? 0, 0),
      departs: nombre(l.departs ?? 0, 0),
      couts: kE1(l.couts ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [
        `Départs, sem. ${de} à ${a}`,
        nombre(
          semaines.reduce((x, w) => x + w.departs, 0),
          0,
        ),
      ],
      [`Cuisine sans CAP, sem. ${a}`, nombre(t.semaines[a]!.sansCap, 0)],
      ["Coût de la période", kE1(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Postes vides en cuisine, semaine par semaine",
    cle: "vides",
    cible: OBJECTIF_VIDES,
    libelleCible: `objectif : ${OBJECTIF_VIDES} au plus`,
    graduations: [1, 3, 6],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.vides!, 0)} postes vides · ${nombre(s.departs!, 0)} départs`,
      `${nombre(s.cap!, 0)} avec un CAP · ${nombre(s.sansCap!, 0)} sans CAP en cuisine`,
    ],
  },
  reactions: () => null,
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.departsDeLaPlonge) {
      lies.push({
        ...MARWA,
        heure: `sem. ${DEBUT[D.affectation] + SEMAINES_AVANT_DEPART}`,
        alerte: true,
        texte: REPONSES.departsDeLaPlonge,
      });
    }
    if (arrive.departKarim) {
      lies.push({
        ...MOUNIR,
        heure: `sem. ${SEMAINE_DEPART_KARIM}`,
        alerte: true,
        texte: REPONSES.departKarim,
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
      "Écart au budget de la saison, salaires, postes vides, plats ratés, départs et retours de l'an prochain compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Postes vides en cuisine",
          valeur: nombre(t.videsMoyens),
          aide: `en moyenne ; objectif ${OBJECTIF_VIDES} au plus`,
          tenu: t.videsMoyens <= OBJECTIF_VIDES,
        },
        {
          nom: "Cuisine tenue sans CAP",
          valeur: nombre(t.sansCapMoyens),
          aide: `en moyenne ; objectif ${OBJECTIF_SANS_CAP} au plus`,
          tenu: t.sansCapMoyens <= OBJECTIF_SANS_CAP,
        },
        {
          nom: "Départs",
          valeur: nombre(t.departs, 0),
          aide: `sur la saison ; objectif ${OBJECTIF_DEPARTS} au plus`,
          tenu: t.departs <= OBJECTIF_DEPARTS,
        },
        {
          nom: "Retours l'an prochain",
          valeur: `${nombre(t.retours, 0)} sur ${SAISONNIERS}`,
          aide: "saisonniers qui reviendront",
          tenu: t.retours >= SAISONNIERS / 2,
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
          titre: "Les candidatures",
          texte: `${t.candidatsCap} titulaires du CAP parmi les ${PREVISION.candidatures} candidatures.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
