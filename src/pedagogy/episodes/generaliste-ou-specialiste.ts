/**
 * ÉPISODE 78 — RESTER GÉNÉRALISTE OU SE SPÉCIALISER, tel que l'interface et
 * le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Victoire montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Un positionnement se juge sur des années, l'épisode sur un trimestre : le
 * tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, en écart au plan d'avant
 * Halden — le résultat du trimestre, plus une année au régime atteint —,
 * recalculée chaque semaine avec ce que le trimestre révèle : la riposte de
 * Halden, le compte du test, les clients historiques, le plan régional, la
 * réponse du GHT. Dès la semaine 1, elle dit ce que coûterait l'inaction.
 */
import {
  COUT_ALIGNEMENT,
  D,
  DEMANDES,
  EN_CONCURRENCE,
  ETUDE,
  EXPERTE,
  GENERALISTE,
  GHT,
  HALDEN,
  HISTORIQUES,
  JOURS_OUVRES,
  JOURS_SANS_PERTE,
  KEROUAL,
  NEUTRE,
  OCCUPATION_CIBLE,
  PAR_SEMAINE,
  PERTE_PAR_JOUR,
  PLAN,
  PRE_DIAGNOSTICS,
  REPOSITIONNEMENT,
  SANTE,
  SCENARIOS,
  SEMAINES,
  SEUIL_DEMANDES,
  TRANSFORMATION,
  demandesEntrantes,
  erreurDuTest,
  evenements,
  hasard,
  keroualPrend,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/generaliste-ou-specialiste";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/generaliste-ou-specialiste";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
/** Des millions d'euros au centième : « 10,53 M€ ». */
const mE = (v: number) =>
  `${(v / 1e6).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;
const points = (v: number) => `${nombre(v * 100)} pt`;
const DIZAINES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
];

const MAHDI = { de: "Mahdi Ouertani", role: "Associé, missions généralistes" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const SIXTE = { de: "Sixte Dauvergne", role: "Associé, Kéroual Consulting" } as const;
const GLENN = {
  de: "Glenn Tanguel",
  role: "Directeur des achats du GHT Loire-Océan",
} as const;
const ARS = { de: "Agence régionale de santé", role: "Communiqué" } as const;

/** Ce que coûte par an la remise de 10 % aux clients historiques, à volumes constants. */
export const COUT_REMISE_HISTORIQUES =
  HISTORIQUES.remise * HISTORIQUES.part * GENERALISTE.jours * GENERALISTE.tjm;
/** Les jours que les clients historiques retireraient s'ils partaient. */
export const JOURS_HISTORIQUES_PERDUS = HISTORIQUES.part * HISTORIQUES.perte * GENERALISTE.jours;
/** Ce que Kéroual rapporterait au plus : trois consultants, de la semaine 7 à fin janvier. */
export const REGIE_MAXIMALE =
  KEROUAL.oui * PAR_SEMAINE * KEROUAL.tjm * (SEMAINES - 6 + KEROUAL.semainesEnJanvier);
/** Le chiffre d'affaires du programme du GHT, à chaque prix, et l'ancrage au volume actuel de l'équipe. */
export const CA_GHT = GHT.jours * SANTE.tjm;
export const caGht = (option: number) => CA_GHT * (1 - GHT.remises[option]!);
export const ancrageGht = (option: number) => GHT.ancrage[option]! * SANTE.jours * SANTE.tjm;

const etapeSuivante = (d1: number) =>
  d1 === 1
    ? "les six recrutements seniors"
    : d1 === 2
      ? "garder le pôle de quarante plutôt que d'en rendre treize au généraliste"
      : "créer un pôle de douze en janvier";

/** Ce que les décisions révèlent, dans l'ordre où une présidente de cabinet les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient où Halden gagne et ce que vaut chaque jour de TJM",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    specialisation:
      "Votre diagnostic de la semaine 1 était juste : sur le généraliste, Halden gagne au prix et peut toujours baisser plus ; l'avantage défendable d'Atlas est là où ses références sont rares, et il se construit par étapes.",
    differenciation:
      "En semaine 1, vous avez vu qu'il ne fallait pas suivre Halden sur le prix, mais vous comptiez vous différencier partout : sur les missions que tout le monde sait faire, la qualité ne se voit pas dans une note où le prix pèse lourd ; elle se voit là où l'on a des références.",
    prix: "En semaine 1, vous avez cru qu'il fallait s'aligner pour garder les volumes : 10 % de TJM sur tous les jours, c'est 10 % de marge pure, puisque les salaires ne baissent pas, pour protéger les 8 % de jours que Halden prenait ; et Halden recasse six fois sur dix.",
    data: "En semaine 1, vous avez voulu repositionner le cabinet sur la data : un marché qui croît, mais où Atlas n'a ni références ni expertise rare. Un avantage se construit là où l'on est déjà crédible.",
  };
  const justes = ["specialisation", "differenciation"];
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
    score: d === "specialisation" ? 1 : d === "differenciation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'un cabinet sous pression : ni suivre Halden sur le prix, ni tout réorienter d'un coup, ni vous afficher avant d'avoir testé, ni acheter la paix des clients par une remise, ni brader les jours libres, ni tenir le plan contre les chiffres, ni payer une référence par une remise."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : suivre Halden sur le prix ou tout réorienter d'un coup, s'afficher avant d'avoir testé, acheter la paix par une remise, brader les jours libres, tenir le plan contre les chiffres, payer une référence par une remise.${
            t.recasse
              ? " Halden a recassé ses prix : l'écart est revenu, et nos baisses sont restées."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_ALIGNEMENT / 1000,
    "de marge perdue par an à baisser de 10 % les TJM généralistes",
    "k€",
    { juste: 20, proche: 100 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const parEtapes = p.chemin[D.positionnement] === 1;
  const revise = p.chemin[D.cap] === 1;
  const strategie: Constat = {
    score: parEtapes && revise ? 1 : parEtapes || revise ? 0.6 : 0,
    texte:
      parEtapes && revise
        ? "Vous vous êtes spécialisée là où Atlas avait ses références, par étapes, et vous avez décidé l'étape suivante sur les chiffres du test, avec la règle fixée d'avance."
        : parEtapes
          ? "Vous vous êtes spécialisée par étapes là où Atlas avait ses références, mais l'étape suivante n'a pas suivi les chiffres du test : une spécialisation concentre le risque, elle se révise."
          : revise
            ? "Vous avez su réviser l'étape suivante sur les chiffres du test, mais votre positionnement de septembre ne construisait pas, par étapes, l'avantage là où Atlas avait ses références."
            : "Vous n'avez ni construit par étapes un avantage là où Atlas avait ses références, ni révisé votre cap sur les chiffres du test.",
  };

  return [information, diagnostic, reflexe, calibrage, strategie];
}

export function axe([information, diagnostic, reflexe, calibrage, strategie]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer où le concurrent gagne avant de répondre",
      texte:
        "Rejouez l'épisode en commençant par les jours et les TJM par type de mission, et par ce que Halden a fait à Lille : il gagne là où le prix décide, il ne suit pas là où les références comptent.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas se battre sur le prix de ce que tout le monde sait faire",
      texte:
        "Dans un cabinet, une baisse de TJM est de la marge pure, et un concurrent qui a une pyramide plus large la suivra. Cherchez l'avantage là où vos références sont rares, et défendez vos clients par la relation, pas par la remise.",
    };
  }
  if (strategie!.score === 0) {
    return {
      titre: "Se spécialiser par étapes, et réviser sur les chiffres",
      texte:
        "Une spécialisation concentre le risque : commencez par déplacer ceux que le concurrent laisse sans mission, testez avec une règle fixée d'avance, puis engagez des recrutements si, et seulement si, les chiffres le justifient.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où l'avantage est défendable",
      texte:
        "Un avantage défendable se trouve là où l'on a déjà des références et une expertise rare : c'est là que les acheteurs notent la technique avant le prix, et que le concurrent ne vous suit pas.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer une baisse de prix dans un cabinet",
      texte:
        "Dans un cabinet, les salaires ne baissent pas avec les prix : 10 % de TJM sur 11 700 jours à 900 €, c'est 1 053 k€ de résultat en moins par an, à volumes constants, pas 10 % d'une marge.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions : un plan régional gelé, ou un test qui se trompe, met une spécialisation à l'épreuve.",
  };
}

const valeurA = (t: Trimestre, w: number) =>
  w <= 0 ? t.semaines[1]!.position : t.semaines[w]!.valeur;

const nomScenario = { porteur: "renforcé", moyen: "reconduit", gel: "gelé" } as const;

export const EPISODE_POSITIONNEMENT: Episode<Trimestre> = {
  code: "generaliste-ou-specialiste",
  numero: 78,
  domaine: "Positionner un cabinet",
  titre: "Rester généraliste ou se spécialiser",
  resume:
    "Un cabinet national ouvre à Nantes avec des prix bas sur les missions généralistes. Construire un avantage là où vos références sont rares, par étapes, plutôt que suivre son prix.",
  persona:
    "Vous êtes Victoire Lanoë, présidente d'Atlas Conseil : 240 collaborateurs, cinq practices, un siège à Nantes et des bureaux à Rennes, Bordeaux et Paris. Halden Partners ouvre un bureau à Nantes dans quinze jours, avec des prix 15 % sous les vôtres sur les missions généralistes. Le comité de direction attend votre recommandation de positionnement pour les trois ans qui viennent.",
  mandat: [
    {
      fort: mE(GENERALISTE.jours * GENERALISTE.tjm),
      texte: "de missions généralistes à Nantes et à Rennes, à 900 € le jour",
    },
    {
      fort: mE(SANTE.jours * SANTE.tjm),
      texte: "de missions santé, à 1 050 € le jour, avec 14 consultants",
    },
    { fort: "765 €", texte: "le TJM affiché par Halden sur les missions généralistes" },
    {
      fort: "0 k€",
      texte: "de valeur au moins : ne pas sortir du trimestre plus faible qu'avant Halden",
    },
  ],
  jugement:
    "Le comité juge le trimestre sur la valeur créée estimée en semaine 13, en écart au plan d'avant Halden : le résultat du trimestre, plus une année au régime atteint, recalculée avec ce que le trimestre a révélé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre cabinet",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le comité est reporté pendant que des propositions partent sans arbitrage.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...MAHDI,
        alerte: true,
        texte: `Sans arbitrage du comité, deux directeurs de mission ont baissé leurs prix sur des propositions en cours. On estime le manque à ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge perdue par an si Atlas baisse de 10 % ses TJM généralistes, à volumes constants, en milliers d'euros",
    unite: "k€",
    placeholder: "500",
    min: 0,
    max: 5000,
    step: 1,
    reel: () => COUT_ALIGNEMENT / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "en écart au plan : le trimestre, et un an au régime atteint"
          : "en écart au plan, si l'on ne fait rien",
    },
    {
      cle: "occupation",
      nom: "Occupation des généralistes",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => `cible du cabinet : ${taux(OCCUPATION_CIBLE, 0)}`,
      jauge: (l) =>
        l.occupation == null
          ? null
          : {
              part: Math.min(1, l.occupation / OCCUPATION_CIBLE),
              enRetard: l.occupation < OCCUPATION_CIBLE - 0.05,
            },
    },
    {
      cle: "tjmG",
      nom: "TJM des missions généralistes",
      format: euros,
      sensBon: 1,
      aide: () => `avant Halden : ${euros(GENERALISTE.tjm)} ; Halden : ${euros(HALDEN.tjm)}`,
    },
    {
      cle: "joursH",
      nom: "Jours santé facturés",
      format: (v) => `${nombre(v, 0)} j`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "dans la semaine" : `par semaine ; ${SANTE.consultants} consultants santé`,
    },
    {
      cle: "intercontrat",
      nom: "Généralistes sans mission",
      format: (v) => nombre(Math.max(0, v), 0),
      sensBon: -1,
      aide: () => `sur ${GENERALISTE.consultants} généralistes à Nantes et à Rennes`,
    },
  ],
  contexte(l, decisions): Contexte {
    const d1 = decisions[D.positionnement] ?? NEUTRE[D.positionnement];
    const d2 = decisions[D.premierPas] ?? NEUTRE[D.premierPas];
    const joursHist = HISTORIQUES.part * GENERALISTE.jours;
    return {
      // Ce que les messages lisent des décisions.
      d1,
      aligne: d1 === 0,
      pole: d1 === 1 || d1 === 2,
      testRegle: d2 === 1,
      recasse: l.recasse === 1,
      // Semaine 1 : les chiffres du cabinet et de Halden.
      joursG: nombre(GENERALISTE.jours, 0),
      tjmG: euros(GENERALISTE.tjm),
      caG: mE(GENERALISTE.jours * GENERALISTE.tjm),
      consultantsG: GENERALISTE.consultants,
      occG: taux(GENERALISTE.jours / (GENERALISTE.consultants * JOURS_OUVRES)),
      cible: taux(OCCUPATION_CIBLE, 0),
      joursH: nombre(SANTE.jours, 0),
      tjmH: euros(SANTE.tjm),
      caH: mE(SANTE.jours * SANTE.tjm),
      consultantsH: SANTE.consultants,
      occH: taux(SANTE.jours / (SANTE.consultants * JOURS_OUVRES)),
      transfoG: taux(TRANSFORMATION.generaliste, 0),
      transfoH: taux(TRANSFORMATION.sante, 0),
      transfoHalden: taux(TRANSFORMATION.avecHalden),
      tjmHalden: euros(HALDEN.tjm),
      enConcurrence: `${DIZAINES[Math.round(EN_CONCURRENCE * 10)]} sur dix`,
      marchePorteur: nombre(SCENARIOS.porteur.marche, 0),
      marcheMoyen: nombre(SCENARIOS.moyen.marche, 0),
      // Semaine 2 : le premier pas.
      etude: kE(ETUDE),
      seuilDemandes: SEUIL_DEMANDES,
      repositionnement: kE(REPOSITIONNEMENT),
      salaireExperte: kE(EXPERTE.salaire),
      erreurEtude: taux(erreurDuTest(1), 0),
      erreurCampagne: taux(erreurDuTest(0), 0),
      erreurExperte: taux(erreurDuTest(2), 0),
      erreurRien: taux(erreurDuTest(3), 0),
      // Semaine 4 : les clients historiques.
      partHistoriques: taux(HISTORIQUES.part, 0),
      joursHistoriques: nombre(joursHist, 0),
      perteHistoriques: taux(HISTORIQUES.perte, 0),
      chanceHistoriques: taux(l.chanceHistoriques ?? 0, 0),
      joursPerdus: nombre(JOURS_HISTORIQUES_PERDUS, 0),
      coutRemise: kE(COUT_REMISE_HISTORIQUES),
      coutReferent: kE(HISTORIQUES.referent.an),
      // Semaine 6 : l'intercontrat.
      intercontrat: nombre(Math.max(0, l.intercontrat ?? 0), 0),
      regie: kE(REGIE_MAXIMALE),
      coutPre: kE(PRE_DIAGNOSTICS.cout),
      // Semaine 8 : les chiffres du test.
      demandes: l.demandes ?? DEMANDES.centre,
      porteur: taux(l.porteur ?? SCENARIOS.porteur.chance, 0),
      porteurAvant: taux(SCENARIOS.porteur.chance, 0),
      etapeSuivante: etapeSuivante(d1),
      etapePorteur: kES(l.etapePorteur ?? 0),
      etapeMoyen: kES(l.etapeMoyen ?? 0),
      etapeGel: kES(l.etapeGel ?? 0),
      // Semaine 10 : le GHT.
      caGht: kE(CA_GHT),
      caGht15: kE(caGht(0)),
      caGht7: kE(caGht(2)),
      ancrage15Taux: taux(GHT.ancrage[0], 0),
      ancrage15: kE(ancrageGht(0)),
      ancrage7Taux: taux(GHT.ancrage[2], 0),
      ancrage7: kE(ancrageGht(2)),
      chanceJalons: taux(l.chanceGht1 ?? 0, 0),
      chanceTel: taux(l.chanceGht3 ?? 0, 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Occupation des généralistes, sem. ${a}`, taux(s.occupation, 0)],
    ];
  },
  courbe: {
    titre: "Chiffre d'affaires des missions, semaine par semaine",
    cle: "ca",
    cible: PLAN,
    libelleCible: `plan d'avant Halden : ${kE(PLAN)} par semaine`,
    graduations: [200000, 225000, 250000, 275000],
    format: kE,
    details: (s) => [
      `chiffre d'affaires ${kE(s.ca!)} · généralistes occupés à ${taux(s.occupation!, 0)}`,
      `valeur créée estimée ${kE(s.valeur!)} · ${nombre(s.joursH!, 0)} jours santé`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.intercontrat && choix === 2) {
      // Kéroual répond selon ses propres besoins : la réponse ne dépend que du hasard.
      return [
        {
          ...SIXTE,
          texte: keroualPrend(graine) === KEROUAL.oui ? REPONSES.keroualOui : REPONSES.keroualNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const lies: Message[] = [];
    if (arrive.ouverture) {
      lies.push({ ...MAHDI, heure: "sem. 3", texte: REPONSES.ouverture });
    }
    if (
      arrive.recasse &&
      (t.recasse || chemin[D.positionnement] === 0 || chemin[D.intercontrat] === 0)
    ) {
      lies.push({
        ...MAHDI,
        heure: "sem. 8",
        alerte: t.recasse,
        texte: t.recasse ? REPONSES.recasse : REPONSES.pasDeRecasse,
      });
    }
    if (arrive.historiques && (t.historiques || chemin[D.positionnement] !== 3)) {
      lies.push({
        ...PRUNE,
        heure: "sem. 9",
        alerte: t.historiques,
        texte: t.historiques ? REPONSES.historiquesPartent : REPONSES.historiquesRestent,
      });
    }
    if (arrive.ght) {
      lies.push({
        ...GLENN,
        heure: "sem. 12",
        alerte: !t.ght,
        texte: t.ght ? REPONSES.ghtOui : REPONSES.ghtNon,
      });
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.budget) {
      imprevus.push({ ...ARS, heure: "sem. 11", texte: REPONSES.budget[t.scenario] });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur perdue sur le plan, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée estimée en semaine 13, en écart au plan d'avant Halden : le résultat du trimestre, plus une année au régime atteint, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: "en écart au plan d'avant Halden ; objectif : 0 k€ au moins",
          tenu: t.objectif >= 0,
        },
        {
          nom: "Prix des missions généralistes",
          valeur: euros(t.regime.tjmG),
          aide: `l'an prochain ; ${euros(GENERALISTE.tjm)} avant Halden`,
          tenu: t.regime.tjmG >= GENERALISTE.tjm * 0.98,
        },
        {
          nom: "Activité santé",
          valeur: `${nombre(t.regime.joursH, 0)} j par semaine`,
          aide: `l'an prochain ; ${nombre(SANTE.jours / 52, 0)} avant Halden, 60 visés`,
          tenu: t.regime.joursH >= 60,
        },
        {
          nom: "Clients historiques",
          valeur: t.historiques ? "partis en partie" : "gardés",
          aide: t.historiques
            ? `${nombre(JOURS_HISTORIQUES_PERDUS, 0)} jours par an en moins`
            : "ils ont renouvelé leurs missions",
          tenu: !t.historiques,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le plan régional",
          texte: `a été ${nomScenario[t.scenario]} : ${
            t.scenario === "porteur"
              ? "les établissements ont lancé leurs projets, et un positionnement lisible attirait beaucoup de demande."
              : t.scenario === "moyen"
                ? "les établissements ont poursuivi leurs projets au même rythme."
                : "les établissements ont reporté leurs projets ; peu de demande, quoi qu'on ait fait."
          }`,
        },
        {
          titre: "Halden",
          texte: t.recasse
            ? "a recassé ses prix à 700 € en semaine 8 : l'écart est revenu."
            : "n'a pas recassé ses prix : il ne l'aurait fait presque qu'en réponse à une baisse de notre part.",
        },
        {
          titre: "Le compte du test",
          texte: `a donné ${demandesTexte(t)} demandes entrantes en six semaines : ${
            t.testBon ? "au-delà" : "en deçà"
          } de la règle des ${SEUIL_DEMANDES}${
            (t.testBon && t.scenario !== "porteur") || (!t.testBon && t.scenario === "porteur")
              ? " ; cette fois, il s'est trompé"
              : ""
          }.`,
        },
        {
          titre: "Le GHT Loire-Océan",
          texte: t.ght ? "a signé le programme de transformation." : "a choisi un autre cabinet.",
        },
      ];
    },
  },
  comportements,
  axe,
};

/** Les demandes entrantes du test, telles que la semaine 8 les a comptées. */
function demandesTexte(t: Trimestre): string {
  return nombre(demandesEntrantes(t.signal), 0);
}
