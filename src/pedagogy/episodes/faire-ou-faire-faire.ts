/**
 * ÉPISODE 33 — FAIRE OU FAIRE FAIRE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord des livraisons de Maëlys montre,
 * ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  BUDGET,
  COUT_COMPLET,
  D,
  EVITABLE_LOINTAINE,
  GRAND_COMPTE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PENALITE_RETARD,
  PERTE_PAR_JOUR,
  RETARDS,
  evenements,
  hasard,
  prixContrat,
  seRedresse,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/faire-ou-faire-faire";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/faire-ou-faire-faire";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le plafond de retards que la direction fixe pour le trimestre. */
const PLAFOND_RETARDS = 0.07;
/** Au-delà, la capacité payée à l'arrêt n'est plus un résidu : c'est une décision. */
const PLAFOND_ARRET = 10000;

/** Un écart au budget : positif, la logistique est restée en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

const MALO = { de: "Malo Mazoyer", role: "Responsable commercial, Transports Ventajol" } as const;
const NOUR = { de: "Nour Bensalem", role: "Planificatrice des tournées" } as const;
const VIVIANE = {
  de: "Viviane Chatelard",
  role: "Conductrice de travaux, Bâtiments Sirand",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où une responsable des livraisons les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient quels coûts disparaîtraient vraiment",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    evitables:
      "Votre diagnostic de la semaine 1 était juste : le coût complet mêlait des coûts qui auraient disparu avec Ventajol et d'autres qui seraient restés ; seuls les premiers se comparaient à son prix.",
    lointaines:
      "En semaine 1, vous avez vu que les tournées lointaines coûtaient cher à faire soi-même : c'était vrai, mais ce n'était qu'un cas de la règle. Seuls les coûts évitables se comparent à un prix, et c'est la même règle qui disait de garder l'agglomération.",
    productivite:
      "En semaine 1, vous avez retenu la productivité des chauffeurs ; elle était dans la norme, et ce n'est pas elle qui faisait l'écart entre le coût complet et le prix de Ventajol.",
    flotte:
      "En semaine 1, vous avez retenu l'âge de la flotte ; renouveler des porteurs n'aurait rien dit de la vraie question : quels coûts disparaissent si un autre livre à votre place.",
  };
  const justes = ["evitables", "lointaines"];
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
    score: d === "evitables" ? 1 : d === "lointaines" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais comparé un prix à un coût qui ne pouvait pas disparaître : ni au coût complet, ni à un coût déjà engagé."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} l'option qui compare un prix au coût complet, ou qui raisonne sur un coût déjà engagé plutôt que sur celui qu'on peut encore éviter.${
            t.arret > PLAFOND_ARRET
              ? ` Sur le trimestre, ${kE(t.arret)} ont payé des porteurs et des chauffeurs à l'arrêt.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    EVITABLE_LOINTAINE,
    "de coût évitable par livraison lointaine",
    "€",
    { juste: 2, proche: 7 },
    (e) => `${nombre(e)} €`,
  );

  // Faire faire là où les coûts disparaissent, et s'en protéger.
  const [d1, d2, d3, , , d6] = p.chemin;
  const toutConfie = d1 === 0 || d1 === 3;
  const lointaines = !toutConfie && (d1 === 1 || d3 === 1);
  const protege = d2 === 2 || d6 === 1 || d6 === 3;
  const domaine: Constat = {
    score: lointaines && protege ? 1 : lointaines || (protege && !toutConfie) ? 0.6 : 0,
    texte: `${
      toutConfie
        ? "Vous avez tout confié à Ventajol, agglomération comprise : les chauffeurs et les porteurs sont restés payés à attendre."
        : d1 === 1
          ? "Vous avez confié les tournées lointaines dès la semaine 3 : là, les kilomètres, les intérimaires et les heures supplémentaires coûtaient plus que le prix de Ventajol."
          : d3 === 1
            ? "Vous avez confié les tournées lointaines à l'échéance de la location, quand son loyer est devenu évitable."
            : "Vous avez gardé les tournées lointaines, où faire faire coûtait pourtant moins que ce que cela aurait fait disparaître."
    } ${
      d2 === 2
        ? "Votre contrat faisait porter à Ventajol une partie de ses retards."
        : d6 === 1 || d6 === 3
          ? "Quand son service a dérapé, vous avez réagi plutôt que de subir."
          : "Vous dépendiez de lui sans contrepartie quand son service a dérapé."
    }${t.grandCompte ? " Bâtiments Sirand a appliqué sa pénalité." : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lister ce qui disparaît vraiment",
      texte:
        "Rejouez l'épisode en décomposant d'abord le coût complet et en lisant les contrats : chauffeurs en CDI, porteurs achetés, garage et siège restaient payés quoi qu'il arrive.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Comparer un prix aux seuls coûts évitables",
      texte:
        "Un prix sous le coût complet ne dit rien : ce qui compte, c'est ce que la décision fait disparaître de vos comptes, et à partir de quand. Les coûts déjà engagés ne plaident ni pour ni contre.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Faire faire là où c'est juste, et s'en protéger",
      texte:
        "La leçon n'est pas de tout faire soi-même : là où les coûts évitables dépassent le prix, confiez. Mais un prestataire peut déraper : un contrat qui lui fait porter ses retards, ou une seconde source, se paie moins cher qu'une pénalité.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer les coûts qui partent de ceux qui restent",
      texte:
        "Avant de comparer deux options, rangez chaque ligne de coût : disparaît-elle avec la décision, et quand ? Le coût complet est fait pour fixer des prix, pas pour choisir entre faire et faire faire.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul du coût évitable ligne par ligne, et comparez-le au vôtre : c'est le moyen le plus rapide de ne plus en oublier une.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_FAIRE_FAIRE: Episode<Trimestre> = {
  code: "faire-ou-faire-faire",
  numero: 33,
  domaine: "Contrôle de gestion",
  titre: "Faire ou faire faire",
  resume:
    "Un transporteur propose de reprendre les livraisons sous le coût complet de la flotte. Comparer son prix aux seuls coûts qui disparaîtraient, à l'horizon où ils disparaissent.",
  persona:
    "Vous êtes Maëlys Tissier, responsable des livraisons de la plateforme Arvel de Corbas. Votre flotte : six porteurs achetés et trois en location, six chauffeurs en CDI et trois intérimaires, quelque trois cents livraisons sur chantier par semaine, de l'agglomération lyonnaise au Nord-Isère.",
  mandat: [
    { fort: kE(BUDGET), texte: "de budget pour la logistique de livraison, pénalités comprises" },
    { fort: taux(PLAFOND_RETARDS, 0), texte: "de livraisons en retard, au plus" },
    { fort: "aucun licenciement", texte: "ce trimestre : la direction l'a exclu" },
    { fort: "vendredi", texte: "pour votre recommandation sur l'offre de Ventajol" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de la logistique de livraison, en comptant les pénalités que les clients facturent pour les retards.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos livraisons",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les tournées de la semaine partent sans avoir été revues : heures supplémentaires et retards.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...NOUR,
        alerte: true,
        texte: `Pendant ce temps, les tournées sont parties sans être revues : heures supplémentaires et retards, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le coût évitable d'une livraison en zone lointaine, d'ici la semaine 6, en €",
    unite: "€",
    placeholder: "60",
    min: 0,
    max: 200,
    step: 0.5,
    reel: () => EVITABLE_LOINTAINE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "couts",
      nom: "Coût de la logistique",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.couts ?? 0) / BUDGET),
              enRetard: (l.couts ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "coutLivraison",
      nom: "Coût d'une livraison, tout compris",
      format: euros,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "flotte, transporteur et pénalités, cette semaine"
          : `coût complet de la flotte : ${euros(COUT_COMPLET)}, plus les pénalités`,
    },
    {
      cle: "retard",
      nom: "Livraisons en retard",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `plafond : ${taux(PLAFOND_RETARDS, 0)}`,
    },
    {
      cle: "penalites",
      nom: "Pénalités clients",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "facturées depuis le début du trimestre"
          : `${euros(PENALITE_RETARD)} par livraison en retard`,
    },
    {
      cle: "arret",
      nom: "Capacité payée à l'arrêt",
      format: euros,
      sensBon: -1,
      aide: () => "porteurs et chauffeurs payés sans tournée, cette semaine",
    },
  ],
  contexte(l, decisions) {
    const contrat = decisions[D.contrat] ?? NEUTRE[D.contrat];
    const d1 = decisions[D.offre];
    const d3 = decisions[D.location];
    const lointainesConfiees = d1 === 0 || d1 === 1 || (d3 !== undefined && (d1 === 3 || d3 === 1));
    return {
      couts: kE(l.couts ?? 0),
      coutLivraison: euros(l.coutLivraison ?? 0),
      coutCompletAgglo: l.coutCompletAgglo ? euros(l.coutCompletAgglo) : "",
      retard: taux(l.retard ?? 0),
      retardLointaines: taux(l.retardLointaines ?? RETARDS.lointaines, 0),
      retardTransporteur: taux(l.retardTransporteur ?? RETARDS.transporteur, 0),
      confie: (l.partConfiee ?? 0) > 0 || d1 === 0 || d1 === 1,
      lointainesConfiees,
      louesLibres: lointainesConfiees && (d3 === 0 || d3 === 2),
      prixAgglo: euros(prixContrat(contrat, "agglo")),
      prixLointaines: euros(prixContrat(contrat, "lointaines")),
      priorite: contrat !== 3,
      service: contrat === 2,
      hausse: l.hausse === 1,
      derapage: l.derapage ?? 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      ["Coût de la période", kE(cout)],
      [`Retards, sem. ${a}`, taux(t.semaines[a]!.retard)],
      [`Confié au transporteur, sem. ${a}`, taux(t.semaines[a]!.partConfiee, 0)],
    ];
  },
  courbe: {
    titre: "Coût de la logistique, semaine par semaine",
    cle: "cout",
    cible: BUDGET / 13,
    libelleCible: `budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [15000, 20000, 30000, 45000],
    format: kE,
    details: (s) => [
      `coût de la semaine ${kE(s.cout!)} · ${taux(s.retard!, 0)} de livraisons en retard`,
      `${taux(s.partConfiee!, 0)} des livraisons confiées · ${euros(s.arret!)} payés à l'arrêt`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.prestataire && choix === 1) {
      // Ventajol répond à la mise en demeure selon le hasard du trimestre.
      return [{ ...MALO, texte: seRedresse(graine) ? REPONSES.redressement : REPONSES.refus }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.derapage) {
      lies.push({
        ...NOUR,
        heure: `sem. ${h.derapage.semaine}`,
        alerte: true,
        texte: REPONSES.derapage(taux(t.semaines[h.derapage.semaine]!.retardTransporteur, 0)),
      });
    }
    if (arrive.hausse) {
      lies.push({ ...MALO, heure: "sem. 10", texte: REPONSES.hausse });
    }
    if (arrive.grandCompte) {
      lies.push({ ...VIVIANE, heure: "sem. 13", alerte: true, texte: REPONSES.sirand });
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, pénalités comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de la logistique de livraison, pénalités clients comprises, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût de la logistique",
          valeur: kE(t.cout),
          aide: `budget ${kE(BUDGET)}, pénalités comprises`,
          tenu: t.cout <= BUDGET,
        },
        {
          nom: "Retards",
          valeur: taux(t.retardMoyen),
          aide: `en moyenne ; plafond ${taux(PLAFOND_RETARDS, 0)}`,
          tenu: t.retardMoyen <= PLAFOND_RETARDS,
        },
        {
          nom: "Bâtiments Sirand",
          valeur: t.grandCompte ? "pénalité appliquée" : "pas de pénalité",
          aide: t.grandCompte
            ? `${euros(GRAND_COMPTE.penalite)} au titre du contrat-cadre`
            : `moins de ${taux(GRAND_COMPTE.seuil, 0)} de retards en fin de trimestre`,
          tenu: !t.grandCompte,
        },
        {
          nom: "Capacité à l'arrêt",
          valeur: kE(t.arret),
          aide: "porteurs et chauffeurs payés sans tournée",
          tenu: t.arret <= PLAFOND_ARRET,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La pointe de printemps",
          texte: `${taux(h.pointe - 1, 0)} de livraisons en plus en agglomération, des semaines 8 à 10.`,
        },
        {
          titre: "Transports Ventajol",
          texte: [
            `son service a dérapé à partir de la semaine ${h.derapage.semaine}, à ${taux(h.derapage.taux, 0)} de retards`,
            t.hausse
              ? t.redressement
                ? "sa hausse de 9 % a été suspendue"
                : "il a appliqué une hausse de 9 % en semaine 11"
              : null,
            t.redressement ? "il s'est redressé après votre mise en demeure" : null,
            t.grandCompte
              ? "Bâtiments Sirand a appliqué sa pénalité"
              : "Bâtiments Sirand n'a pas appliqué de pénalité",
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
