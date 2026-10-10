/**
 * ÉPISODE 91 — RECONSTRUIRE OU REGROUPER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi de l'opération montre à Noëlle Grandperrin,
 * ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 *
 * Un EHPAD se reconstruit pour des décennies, l'épisode dure un trimestre :
 * le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE pour l'association,
 * la VAN sur vingt ans des flux différentiels de la voie choisie, déficit
 * d'hébergement compris, recalculée chaque semaine avec ce que le trimestre
 * apprend : le territoire, les diagnostics, les élus, le terrain, l'aide.
 * Et, à côté, ce que les résidents paieront : la hausse du prix de journée.
 */
import {
  D,
  ETUDE,
  JOURS_SANS_PERTE,
  LISSAGE,
  MONTBARD_NEUF,
  NEUTRE,
  NOMS_DES_VOIES,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PLAFOND,
  RATTRAPAGE,
  RESERVE,
  REVELATIONS,
  SCENARIOS,
  TAUX_EMPRUNT,
  VOIES,
  argiles,
  evenements,
  hasard,
  hausse,
  haussesDeLaVoie,
  journeesTarif,
  lissageLong,
  prixFacture,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/reconstruire-ou-regrouper";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/reconstruire-ou-regrouper";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
/** Un prix par jour, au centime. */
export const eurosJour = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const points = (v: number) => `${nombre(v * 100, 1)} pt`;

const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const ARS = { de: "Délégation départementale", role: "ARS" } as const;
const TARIFICATION = {
  de: "Service de la tarification",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const LIESEL = { de: "Liesel Pradalié", role: "Consultante, étude de besoins" } as const;
const ROSALINDE = { de: "Rosalinde Charvolin", role: "Responsable des travaux du siège" } as const;
const RADEGONDE = { de: "Radegonde Pichonnat", role: "Maire de Montbard" } as const;
const BAKARY = { de: "Bakary Gagnepain", role: "Directeur de l'EHPAD d'Auxonne" } as const;
const DEPARTEMENT = { de: "Conseil départemental", role: "Direction de l'autonomie" } as const;

/** La hausse de Montbard reconstruit, hors aide, à l'offre de la banque : ce que la semaine 1 demande. */
export const HAUSSE_MONTBARD = hausse(MONTBARD_NEUF);

/** Ce que l'étude recommande, selon le scénario qu'elle trouve. */
const AJUSTEMENTS = [
  "Elle recommande de garder 64 places permanentes à Auxonne, sans hébergement temporaire.",
  "Elle recommande une unité protégée de 14 places au lieu de 12 à Montbard.",
  "Elle recommande de passer 8 places permanentes de plus en hébergement temporaire et en accueil de jour, avec une plateforme de répit pour les aidants.",
] as const;

/**
 * L'ÉCART AU PLAFOND d'une voie : pour chaque opération, la hausse hors aide
 * et avec aide ; le déficit d'hébergement annuel si la hausse est présentée
 * en une fois ; l'écart cumulé des cinq années de rattrapage, que la réserve
 * de compensation couvre, et ce qui reste au-delà.
 */
export function ecartAuPlafond(voie: number, tauxEmprunt = TAUX_EMPRUNT, indice = 1) {
  const chemin = [voie, 1, 1, 1, 1, 1];
  const sans = haussesDeLaVoie(chemin, { aide: false, taux: tauxEmprunt, indice });
  const avec = haussesDeLaVoie(chemin, { aide: true, taux: tauxEmprunt, indice });
  const ops = VOIES[voie]!;
  const parAn = (hs: number[]) =>
    hs.reduce((t, h, i) => t + Math.max(0, h - PLAFOND) * journeesTarif(ops[i]!), 0);
  const lissage = (hs: number[]) =>
    hs.reduce((t, h, i) => {
      let s = 0;
      for (let k = 0; k < LISSAGE.long; k += 1) s += h - prixFacture(h, 1, k, LISSAGE.long);
      return t + s * journeesTarif(ops[i]!);
    }, 0);
  const reste = (hs: number[]) =>
    hs.reduce(
      (t, h, i) =>
        t + Math.max(0, h - PLAFOND - RATTRAPAGE * LISSAGE.long) * journeesTarif(ops[i]!),
      0,
    );
  return {
    ops,
    sans,
    avec,
    depasse: sans.some((h) => h > PLAFOND),
    deficitSansAide: parAn(sans),
    deficitAvecAide: parAn(avec),
    lissageSansAide: lissage(sans),
    lissageAvecAide: lissage(avec),
    resteSansAide: reste(sans),
  };
}

const nomCourt = (id: string) =>
  id === "montbardNeuf" || id === "renovationMontbard"
    ? "Montbard"
    : id === "regroupement"
      ? "Is-sur-Tille"
      : id === "miseAuxNormes"
        ? "les deux EHPAD"
        : "Auxonne";

/** Ce que les décisions révèlent, dans l'ordre où une directrice du patrimoine les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de comparer les voies et de calculer la hausse de Montbard",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    differentiel:
      "Votre diagnostic de la semaine 1 était juste : les voies se comparent sur ce qu'elles changent pour l'association, année après année, et sur ce qu'elles font au prix de journée, au regard du plafond, de l'aide probable et des besoins du territoire.",
    plafond:
      "En semaine 1, vous avez vu le plafond du département : une vraie contrainte, mais pas un critère. La voie qui fait le moins monter le prix garde des chambres doubles que plus personne ne choisit.",
    cout: "En semaine 1, vous avez retenu le coût de construction ; mais les résidents paient l'immobilier par le prix de journée, et ce que l'association garde ou perd tient à l'occupation, au plafond et à l'aide.",
    echelle:
      "En semaine 1, vous avez retenu les économies d'échelle ; elles sont réelles, mais un grand établissement éloigné des familles dépend d'élus qui n'en veulent pas, et ses amortissements dépassent le plafond.",
  };
  const justes = ["differentiel", "plafond"];
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
    score: d === "differentiel" ? 1 : d === "plafond" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'une direction pressée : ni la voie la moins chère ou la plus grande, ni le dossier déposé sans savoir, ni la hausse présentée sans regarder le plafond, ni le programme figé contre les faits, ni le terrain le moins cher, ni le silence."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : construire au moins cher ou au plus grand, déposer vite, présenter ses charges sans regarder le plafond, ne pas rouvrir un programme voté, prendre le terrain le moins cher, se taire tant que rien n'est arrêté.${
            t.rumeur ? " Une rumeur a en plus couru dans la presse locale." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    HAUSSE_MONTBARD,
    "de hausse du prix de journée pour Montbard reconstruit, hors aide",
    "€ par jour",
    { juste: 0.5, proche: 1.5 },
    (e) => `${nombre(e, 2)} €`,
  );

  const voie = t.refus ? 3 : t.voie;
  const d3 = p.chemin[D.plafond];
  let prix: Constat;
  if (t.refus) {
    prix = {
      score: 0,
      texte:
        "Le regroupement est tombé : les élus ont obtenu le refus du transfert des autorisations. Il ne reste que la mise aux normes, des chambres doubles et un trimestre perdu.",
    };
  } else if (voie === 0 || voie === 3) {
    prix = {
      score: 0.6,
      texte: `Votre voie restait sous le plafond : ${eurosJour(t.hausse)} par jour de hausse. Mais elle l'était en gardant des chambres doubles que les familles refusent : l'occupation attendue n'est que de ${taux(t.occupation)}.`,
    };
  } else if (d3 === 1) {
    prix = {
      score: 1,
      texte: `Vous avez fait entrer la hausse dans le prix de journée par étapes, la réserve de compensation couvrant l'écart : ${eurosJour(t.hausse)} par jour au bout du compte${
        t.aide ? ", aide comprise" : ", sans l'aide que le comité n'a pas accordée"
      }, et ${kE(t.deficit)} de déficit d'hébergement en valeur actuelle, pour l'essentiel couvert par la réserve.`,
    };
  } else if (d3 === 2) {
    prix = {
      score: 0,
      texte:
        "Vous avez sorti 30 % des places de l'habilitation à l'aide sociale pour y fixer un prix libre : ces places ne se remplissent qu'avec les familles aisées, les bénéficiaires de l'aide sociale attendent plus longtemps, et le département, qui cofinance l'aide à l'investissement, s'en est souvenu.",
    };
  } else {
    prix = {
      score: 0,
      texte: `Vous avez présenté la hausse entière : le département l'a ramenée à ${PLAFOND} € par jour, et l'écart reste au déficit de la section hébergement, ${kE(t.deficit)} en valeur actuelle sur vingt ans. Un rattrapage prévu au plan l'aurait fait entrer dans le prix.`,
    };
  }

  return [information, diagnostic, reflexe, calibrage, prix];
}

export function axe([information, diagnostic, reflexe, calibrage, prix]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Calculer avant de choisir",
      texte:
        "Rejouez l'épisode en mettant d'abord les trois voies au même format, avec le plan de financement de Montbard et la règle du département : la hausse de Montbard n'était pas calculée, et c'est elle qui décide de tout le reste.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Le moins cher à construire n'est pas le moins cher",
      texte:
        "Les résidents paient l'immobilier par le prix de journée : ce que l'association garde ou perd tient à l'occupation que le bâtiment attire, au plafond du département, à l'aide et aux besoins du territoire. Comparez des flux différentiels sur vingt ans, pas des coûts de construction.",
    };
  }
  if (prix!.score === 0) {
    return {
      titre: "Faire entrer la hausse dans le prix de journée",
      texte:
        "Au-delà du plafond, l'écart reste à l'association, ou l'on sort des places de l'habilitation. Prévoyez au plan de financement un rattrapage par étapes, couvert par la réserve de compensation, et un dossier qui obtient l'aide.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Comparer les voies sur leurs flux différentiels",
      texte:
        "Une voie ne se juge ni à son coût de construction, ni à la seule hausse qu'elle impose : elle se juge à ce qu'elle change pour l'association sur vingt ans, et à ce qu'elle fait payer aux résidents au regard du plafond.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du prix de journée",
      texte:
        "La hausse vaut les amortissements et les intérêts de la première année, moins les charges qui disparaissent avec l'ancien bâtiment et les économies, divisés par les journées à 97 % d'occupation. Pas l'annuité de l'emprunt, et pas à 100 %.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);
const nomScenario = (s: number) => SCENARIOS[s]!.nom;

export const EPISODE_RECONSTRUCTION: Episode<Trimestre> = {
  code: "reconstruire-ou-regrouper",
  numero: 91,
  domaine: "Décider d'un investissement immobilier",
  titre: "Reconstruire ou regrouper",
  resume:
    "Deux EHPAD vétustes, trois voies, un plafond de prix de journée et une aide qui se mérite. Juger sur les flux différentiels et sur ce que paieront les résidents, pas sur le coût de construction.",
  persona:
    "Vous êtes Noëlle Grandperrin, directrice du patrimoine et des investissements de l'Association Solvanne, à Dijon. Les EHPAD d'Auxonne (64 places) et de Montbard (70 places) datent des années 1970 : chambres doubles, pas de pièce rafraîchie, normes incendie à reprendre. Le conseil d'administration attend votre recommandation ; vous avez de septembre à novembre pour la mener jusqu'au dossier d'aide.",
  mandat: [
    { fort: "134 places", texte: "à Auxonne et à Montbard, toutes habilitées à l'aide sociale" },
    {
      fort: `${PLAFOND} €`,
      texte: "par jour : le plafond de hausse du prix de journée à l'ouverture",
    },
    { fort: "4 %", texte: "le taux auquel le conseil juge les opérations, sur vingt ans" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins pour l'association" },
  ],
  jugement:
    "La direction générale juge le trimestre sur la valeur créée pour l'association : la VAN sur vingt ans, au taux de 4 %, des flux différentiels de la voie engagée, déficit d'hébergement compris, recalculée en semaine 13 avec ce que le trimestre a appris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre opération",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du conseil se boucle dans l'urgence avec le programmiste, payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...URSULE,
        alerte: true,
        texte: `Pour tenir la date du conseil, j'ai fait boucler le dossier par le programmiste : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "la hausse du prix de journée hébergement de Montbard reconstruit, hors aide, en euros par jour",
    unite: "€ par jour",
    placeholder: "12",
    min: 0,
    max: 40,
    step: 0.01,
    reel: () => HAUSSE_MONTBARD,
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
          ? "VAN sur vingt ans, avec ce que le trimestre a appris"
          : "rien n'est encore engagé",
    },
    {
      cle: "hausse",
      nom: "Hausse du prix de journée",
      format: eurosJour,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `nécessaire, aide espérée comprise ; plafond ${PLAFOND} €`
          : "aucune opération engagée",
      jauge: (l) =>
        l.hausse === null
          ? null
          : { part: Math.min(1, (l.hausse ?? 0) / PLAFOND), enRetard: (l.hausse ?? 0) > PLAFOND },
    },
    {
      cle: "aide",
      nom: "Aide à l'investissement",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= REVELATIONS.aides
          ? "décidée par l'ARS et le département"
          : "espérée, selon le dossier",
    },
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => "Auxonne et Montbard ; cible 97 %",
    },
    {
      cle: "demandes",
      nom: "Demandes d'admission",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `semaine ${semaine}, deux EHPAD` : "par semaine, ces dernières années",
    },
  ],
  contexte(l, decisions): Contexte {
    const voie = decisions[D.voie] ?? NEUTRE[D.voie];
    const e = ecartAuPlafond(voie, l.taux ?? TAUX_EMPRUNT, l.indice ?? 1);
    const detailHausses = `Hausse nécessaire : ${e.ops
      .map(
        (op, i) =>
          `${nomCourt(op.id)} ${eurosJour(e.sans[i]!)} par jour hors aide${
            op.aide ? `, ${eurosJour(e.avec[i]!)} avec ${kE(op.aide)} d'aide` : ""
          }`,
      )
      .join(" ; ")} ; plafond ${PLAFOND} €.`;
    const scenario = l.scenario;
    return {
      voie,
      voieNom: NOMS_DES_VOIES[voie]!,
      hausseHorsAide: eurosJour(Math.max(...e.sans)),
      depasse: e.depasse,
      detailHausses,
      deficitSansAide: kE(e.deficitSansAide),
      deficitAvecAide: kE(e.deficitAvecAide),
      lissageSansAide: kE(e.lissageSansAide),
      lissageAvecAide: kE(e.lissageAvecAide),
      resteSansAide: e.resteSansAide > 500 ? kE(e.resteSansAide) : "",
      etude: decisions[D.dossier] === 1,
      scenarioEtude: scenario === null || scenario === undefined ? "" : nomScenario(scenario),
      ajustementEtude: scenario === null || scenario === undefined ? "" : AJUSTEMENTS[scenario]!,
      demandesMoyennes: nombre(l.demandesMoyennes ?? 0, 1),
      scenarioSignal: nomScenario(l.signal ?? 1),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Hausse du prix de journée, sem. ${a}`, eurosJour(s.hausse)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [250000, 500000, 750000, 1000000, 1500000, 2000000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `hausse ${eurosJour(s.hausse!)} par jour · aide ${kE(s.aide!)} · ${nombre(s.demandes!, 0)} demandes`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.plafond && choix === 1) {
      // Le département répond au plan de rattrapage selon le hasard du trimestre.
      return [
        {
          ...TARIFICATION,
          texte: lissageLong(graine) ? REPONSES.lissageLong : REPONSES.lissageCourt,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.etude) {
      lies.push({
        ...LIESEL,
        heure: `sem. ${ETUDE.semaine}`,
        texte: `Notre étude est remise : sur vos deux territoires, c'est le scénario « ${nomScenario(h.scenario)} » qui se dessine. ${AJUSTEMENTS[h.scenario]!}`,
      });
    }
    if (arrive.diagnostics) {
      lies.push({
        ...ROSALINDE,
        heure: `sem. ${REVELATIONS.diagnostics}`,
        alerte: h.depassement > 0.05,
        texte: `Les diagnostics amiante et structure des deux bâtiments sont rendus : ${taux(h.depassement, 0)} de dépassement à prévoir au-delà des aléas, ${kE(h.depassement * 7200000)} que le plan validé ne couvrira pas.`,
      });
    }
    if (arrive.elus) {
      lies.push({
        ...DEPARTEMENT,
        heure: `sem. ${REVELATIONS.elus}`,
        alerte: t.refus,
        texte: t.refus ? REPONSES.refus : REPONSES.accord,
      });
    }
    if (arrive.sondages) {
      lies.push({
        ...RADEGONDE,
        heure: `sem. ${REVELATIONS.sondages}`,
        alerte: argiles(graine),
        texte: argiles(graine) ? REPONSES.argiles : REPONSES.pasDArgiles,
      });
    }
    if (arrive.aides) {
      lies.push({
        ...ARS,
        heure: `sem. ${REVELATIONS.aides}`,
        alerte: !t.aide,
        texte: t.aide
          ? `${REPONSES.aideOui} ${kE(t.montantAide)} : la hausse nécessaire tombe à ${eurosJour(t.hausse)} par jour.`
          : REPONSES.aideNon,
      });
    }
    if (arrive.rumeur) {
      lies.push({
        ...BAKARY,
        heure: `sem. ${REVELATIONS.rumeur}`,
        alerte: true,
        texte: REPONSES.rumeur,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.schema) {
      imprevus.push({
        ...DEPARTEMENT,
        heure: `sem. ${REVELATIONS.schema}`,
        texte: `Le projet de schéma départemental de l'autonomie est publié : pour l'Auxois et le Val de Saône, il retient le scénario « ${nomScenario(h.scenario)} ».`,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée pour l'association, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite pour l'association, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée pour l'association : la VAN sur vingt ans, au taux de 4 %, des flux différentiels de la voie engagée, déficit d'hébergement compris, recalculée avec ce que le trimestre a appris, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const voie = t.refus ? 3 : t.voie;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Prix de journée",
          valeur: `+${eurosJour(t.hausse)} par jour`,
          aide:
            t.reste > 1000
              ? `nécessaire ; ${kE(t.reste)} par an que le prix ne couvrira jamais`
              : t.deficit > 1000
                ? `nécessaire ; ${kE(t.deficit)} d'écart les premières années, couvert par la réserve`
                : `nécessaire ; plafond ${PLAFOND} €, sans déficit d'hébergement`,
          tenu: t.reste <= 1000 && t.deficit <= RESERVE,
        },
        {
          nom: "Aide à l'investissement",
          valeur: t.aide ? kE(t.montantAide) : voie === 3 ? "aucune" : "refusée",
          aide:
            voie === 3
              ? "aucune opération à financer"
              : `chance du dossier : ${taux(t.chanceAide, 0)}`,
          tenu: t.aide,
        },
        {
          nom: "Occupation attendue",
          valeur: taux(t.occupation),
          aide: voie === 3 ? "dans les bâtiments actuels" : "à la mise en service ; cible 97 %",
          tenu: t.occupation >= 0.95,
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
          titre: "Le territoire",
          texte: `Le schéma départemental a retenu le scénario « ${nomScenario(h.scenario)} » ; les demandes des six premières semaines laissaient croire au scénario « ${nomScenario(h.signal)} ».`,
        },
        {
          titre: "L'ARS et le département",
          texte:
            t.voie === 3 || t.refus
              ? "N'ont eu aucune aide à décider."
              : t.aide
                ? `ont accordé ${kE(t.montantAide)} d'aide, à un dossier qui avait ${taux(t.chanceAide, 0)} de chances.`
                : `ont refusé l'aide, à un dossier qui avait ${taux(t.chanceAide, 0)} de chances.`,
        },
        {
          titre: "Le chantier",
          texte:
            t.voie === 0
              ? `Les diagnostics ont révélé ${taux(t.depassement, 0)} de dépassement sur la rénovation.`
              : t.voie === 1
                ? t.refus
                  ? "Les élus ont obtenu le refus du transfert des autorisations."
                  : "L'ARS et le département ont accepté le transfert des autorisations."
                : t.voie === 2
                  ? t.argiles
                    ? "Les sondages de la friche ont trouvé des argiles gonflantes."
                    : `Le terrain de Montbard n'a pas réservé de surprise${
                        argiles(graine) ? ", mais la friche du bourg avait des argiles" : ""
                      }.`
                  : "Rien n'a été engagé au-delà des normes incendie ; les chambres doubles restent.",
        },
        {
          titre: "Les familles",
          texte: t.rumeur
            ? "Une rumeur a couru dans la presse locale : des demandes retirées, une résidente partie."
            : "Aucune rumeur n'a couru.",
        },
      ];
    },
  },
  comportements,
  axe,
};
