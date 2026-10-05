/**
 * ÉPISODE 48 — LE GRAND COMPTE QUI VEUT L'EXCLUSIVITÉ, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Kenji montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Un contrat de trois ans se juge sur des années, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, la
 * valeur actuelle de tout ce que les décisions ont engagé, recalculée chaque
 * semaine avec ce que le trimestre apprend. Elle bouge quand on décide, et
 * quand le trimestre révèle : la réponse de Sarlève, le chantier suspendu,
 * la revue des prix, le carnet de commandes du groupe.
 */
import {
  CONTRAT,
  CONTRIBUTION_PROPOSEE,
  CLAUSES,
  D,
  EXTENSION,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PLUS_TARD,
  REGION,
  REVELATION,
  REVUE,
  RUPTURE,
  CONQUETE,
  SANS_EXCLUSIVITE,
  SCENARIOS,
  SUSPENSION,
  TAUX,
  EFFET,
  analyseFavorable,
  conqueteReussie,
  evenements,
  hasard,
  partDeSarleve,
  simuler,
  statut,
  tableauDeBord,
  valeurDeLExtension,
  type Trimestre,
} from "@/engine/episodes/grand-compte-exclusif";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/grand-compte-exclusif";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des millions d'euros : « 5 M€ », « 1,5 M€ ». */
const millions = (v: number) => `${nombre(v / 1_000_000)} M€`;
/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const AUGUSTIN = { de: "Augustin Delcourt", role: "Directeur des achats, groupe Sarlève" } as const;
const NADIR = { de: "Nadir Boumediene", role: "Chargé d'affaires, compte Sarlève" } as const;
const ELIOTT = { de: "Eliott Brasseur", role: "Directeur régional Lyon-Rhône" } as const;
const WEN = { de: "Wen Zhao", role: "Contrôleuse de gestion commerciale" } as const;
const RONAN = { de: "Ronan Le Gall", role: "Analyste, cabinet Ardoise Conseil" } as const;

/** Le plafond de dépendance que la direction commerciale s'est fixé : un quart du chiffre de la région. */
export const PLAFOND_DE_PART = 0.25;

/** La contribution annuelle aux conditions proposées, en k€ : ce que la prévision de la semaine 1 demande. */
export const CONTRIBUTION_EN_KE = CONTRIBUTION_PROPOSEE / 1000;

const STATUTS = ["signe", "plusTard", "lestrade"] as const;

/** Le prix concédé selon la réponse de la semaine 1 et ce qu'a fait Sarlève. */
const concessionDe = (d1: number, plusTard: boolean) =>
  (d1 === 1 ? CLAUSES.concession : d1 === 2 ? SANS_EXCLUSIVITE.concession : 0) +
  (plusTard ? PLUS_TARD.concession : 0);

/** Ce que vaut l'extension sous chaque carnet, et en espérance, aux conditions du contrat. */
export function chiffresDeLExtension(concession: number) {
  const parScenario = SCENARIOS.map((_, s) => valeurDeLExtension(s, { concession }));
  const esperance = parScenario.reduce((acc, v, s) => acc + SCENARIOS[s]!.chance * v, 0);
  return { parScenario, esperance };
}

/** Un point de prix sur les années 2 et 3, au volume annoncé, actualisé au taux du groupe. */
export const VALEUR_D_UN_POINT = CONTRAT.ca * REVUE.baisse * ((1 + TAUX) ** -2 + (1 + TAUX) ** -3);

/** Ce que les décisions révèlent, dans l'ordre où un directeur commercial les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de chiffrer ce que le contrat coûtait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    dependance:
      "Votre diagnostic de la semaine 1 était juste : le volume de Sarlève avait de la valeur, mais il créait une dépendance qu'il fallait chiffrer et borner par contrat.",
    marge:
      "En semaine 1, vous avez chiffré ce que le contrat coûtait : une vraie partie du problème, mais pas la principale. Le danger n'était pas la marge de la première année, c'était le pouvoir que la dépendance donnait à Sarlève ensuite.",
    volume:
      "En semaine 1, vous avez vu trois ans de volume garanti ; les volumes du contrat étaient indicatifs, et rien ne garantissait les prix au-delà de la première année.",
    risque:
      "En semaine 1, vous avez vu le risque, sans voir qu'il se bornait : décliner donnait le contrat à Lestrade, qui en sortait renforcé.",
  };
  const justes = ["dependance", "marge"];
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
    score: d === "dependance" ? 1 : d === "marge" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du grand compte : ni signer le volume tel quel, ni le refuser par principe, ni immobiliser ce que le client demande, ni prendre encore plus de volume sans vous informer, ni persister malgré le signal, ni céder à la revue des prix parce que vous dépendiez de lui."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : signer le volume ou le refuser sans le chiffrer, immobiliser ce que le client demande, écrire aux clients exclus et passer à autre chose, étendre sans s'informer, tenir le cap malgré le signal, céder à la revue des prix.${
            t.resilie ? " Sarlève a en plus résilié à la revue des prix." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    CONTRIBUTION_EN_KE,
    "de contribution annuelle aux conditions proposées",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const d1 = p.chemin[D.reponse];
  const d5 = p.chemin[D.signal];
  const carnet = SCENARIOS[t.scenario]!.nom.toLowerCase();
  let texte: string;
  let score: number;
  if (d1 === 3) {
    score = 0;
    texte = `Vous avez refusé par principe : Lestrade a pris le contrat, et ses volumes lui servent à attaquer vos artisans. Le carnet de Sarlève a finalement été : ${carnet}. Des clauses auraient borné le risque sans laisser le terrain au concurrent.`;
  } else if (d1 === 0) {
    score = 0;
    texte = `Vous avez signé le volume sans borner la dépendance : trois ans d'exclusivité, aucune indexation, aucun volume minimal, un stock dédié à vos risques. Le carnet de Sarlève a été : ${carnet}${
      t.scenario === 0
        ? " ; cette fois, le pari a tenu, il aurait perdu une fois sur deux."
        : " : tout le poids de la baisse est resté chez Arvel."
    }`;
  } else if (d1 === 2) {
    score = 0.6;
    texte =
      t.statut === "lestrade"
        ? "Vous avez refusé l'exclusivité, ce qui gardait vos clients, mais c'était ce que Sarlève voulait le plus : il est parti chez Lestrade. Une exclusivité limitée dans le temps aurait gardé les deux."
        : "Vous avez refusé l'exclusivité, ce qui gardait vos clients ; Sarlève l'a payé d'un point de prix, mais rien ne bornait le reste de la dépendance : ni volume minimal, ni indexation, ni reprise du stock.";
  } else {
    score = d5 === 1 ? 1 : 0.6;
    texte = `Vous avez pris le volume en bornant la dépendance par contrat : exclusivité de deux ans, indexation, volume minimal, reprise du stock dédié.${
      d5 === 1
        ? " Au premier signal, vous avez révisé l'engagement au lieu de le confirmer."
        : " Au premier signal pourtant, vous n'avez pas ramené la cellule au volume réel."
    } Le carnet de Sarlève a été : ${carnet}.`;
  }
  const dependance: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, dependance];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  dependance,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer avant de signer",
      texte:
        "Rejouez l'épisode en lisant d'abord le contrat ligne par ligne et ce qu'il coûte à Arvel : la cellule, le crédit client, le stock et la marge des clients exclus reprennent l'essentiel de ce que le volume rapporte.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Chiffrer la dépendance, pas seulement le volume",
      texte:
        "Un grand compte se juge à ce qu'il coûte autant qu'à ce qu'il rapporte : les clients qu'on ne livre plus, ce qu'on immobilise pour lui, et ce que vaut votre position le jour où il renégocie. Ne signez ni ne refusez avant de l'avoir chiffré.",
    };
  }
  if (dependance!.score === 0) {
    return {
      titre: "Borner la dépendance par contrat",
      texte:
        "Ni signer tel quel, ni refuser : négocier les clauses qui bornent la dépendance — une exclusivité limitée dans le temps, l'indexation des prix, un volume minimal, la reprise des actifs dédiés — puis réviser l'engagement au premier signal.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir la dépendance derrière la marge",
      texte:
        "Un contrat rentable la première année peut ne plus l'être la deuxième : la part du client, les actifs dédiés et les clients perdus donnent au client le pouvoir de renégocier. C'est cette dépendance qu'il faut chiffrer.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la contribution",
      texte:
        "Posez-le ligne par ligne : la marge sur coût variable, moins la cellule, plus les remises, moins le crédit client (sur des créances toutes taxes comprises), le portage du stock et la marge des clients exclus.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a changé à la valeur estimée. */
const FENETRES: readonly [number, number][] = [
  [2, 4],
  [3, 6],
  [5, 7],
  [7, 10],
  [8, 13],
  [11, 13],
];

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

export const EPISODE_EXCLUSIVITE: Episode<Trimestre> = {
  code: "grand-compte-exclusif",
  numero: 48,
  domaine: "Portefeuille clients et dépendance",
  titre: "Le grand compte qui veut l'exclusivité",
  resume:
    "Un groupe de construction offre trois ans de volume, près d'un quart de la région, contre l'exclusivité, des prix serrés et des actifs dédiés. Chiffrer la dépendance, et la borner.",
  persona:
    "Vous êtes Kenji Lefranc, directeur commercial grands comptes d'Arvel Distribution : les entreprises générales, les promoteurs et les bailleurs de la région, une équipe de cinq chargés d'affaires. Le groupe Sarlève vous propose le plus gros contrat de l'histoire de la région Lyon-Rhône ; vous portez la réponse au comité de direction.",
  mandat: [
    {
      fort: millions(CONTRAT.ca),
      texte: "de chiffre d'affaires par an proposés par Sarlève, trois ans",
    },
    {
      fort: millions(REGION.ca),
      texte: "de chiffre d'affaires de la région Lyon-Rhône l'an dernier",
    },
    { fort: taux(TAUX, 0), texte: "le taux d'actualisation du groupe" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la valeur créée : la valeur actuelle, au taux du groupe, de tout ce que vos décisions ont engagé, recalculée en semaine 13 avec ce que le trimestre a révélé, clients perdus et actifs dédiés compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre portefeuille grands comptes",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'acheteur de Sarlève en profite pour faire baisser le prix de Lestrade, qu'il vous opposera.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...AUGUSTIN,
        alerte: true,
        texte: `Monsieur Lefranc, pendant que vous réfléchissiez, Lestrade a revu son offre. Il faudra en tenir compte : ${euros(perdu)} de moins pour vous.`,
      };
    },
  },
  prevision: {
    libelle:
      "la contribution annuelle du contrat aux conditions proposées, cellule, crédit client, portage du stock et clients perdus déduits, en milliers d'euros",
    unite: "k€",
    placeholder: "100",
    min: -500,
    max: 1500,
    step: 1,
    reel: () => CONTRIBUTION_EN_KE,
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
          ? `valeur actuelle à ${taux(TAUX, 0)}, avec ce que le trimestre a révélé`
          : "rien n'est encore engagé",
    },
    {
      cle: "commandes",
      nom: "Commandes de Sarlève",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine && (l.commandes ?? 0) > 0
          ? `livrées dans la semaine ; rythme annoncé : ${kE(CONTRAT.ca / 52)}`
          : "aucune livraison",
    },
    {
      cle: "part",
      nom: "Part de Sarlève dans la région",
      format: (v) => taux(v, 1),
      formatEcart: (v) => `${nombre(v * 100, 1)} pt`,
      sensBon: -1,
      aide: () => `plafond que vous vous êtes fixé : ${taux(PLAFOND_DE_PART, 0)}`,
      jauge: (l) =>
        (l.part ?? 0) > 0
          ? {
              part: Math.min(1, (l.part ?? 0) / PLAFOND_DE_PART),
              enRetard: (l.part ?? 0) > PLAFOND_DE_PART,
            }
          : null,
    },
    {
      cle: "stock",
      nom: "Stock dédié",
      format: kE,
      sensBon: -1,
      aide: () => `possédé par Arvel ; ${kE(CONTRAT.stock)} demandés par le contrat`,
    },
    {
      cle: "marge",
      nom: "Contribution du trimestre",
      format: kE,
      sensBon: 1,
      aide: () => "marge du contrat, moins la cellule et la marge des clients exclus",
    },
  ],
  contexte(l, decisions): Contexte {
    const code = l.statut ?? -1;
    const st = code >= 0 ? STATUTS[code]! : "";
    const d1 = decisions[D.reponse] ?? NEUTRE[D.reponse];
    const contrat = st === "signe" || st === "plusTard";
    const ext = chiffresDeLExtension(concessionDe(d1, st === "plusTard"));
    const stock = l.stock ?? 0;
    return {
      statut: st,
      clauses: contrat && d1 === 1,
      exclusivite: contrat && d1 !== 2,
      valeur: kE(l.valeur ?? 0),
      part: taux(l.part ?? 0, 1),
      partExtension: taux(partDeSarleve(CONTRAT.ca + EXTENSION.ca, d1 === 2 ? 0 : undefined), 0),
      extSolide: kE(ext.parScenario[0]!),
      extTassement: kE(-ext.parScenario[1]!),
      extRetournement: kE(-ext.parScenario[2]!),
      extEsperance: kES(ext.esperance),
      stockDedie: stock > 0 ? kE(stock) : "",
      stockVergnes: kE(stock * SUSPENSION.stock),
      baisse: kE(VALEUR_D_UN_POINT),
      rupture: kE(l.rupture ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Part de Sarlève, sem. ${a}`, s.part > 0 ? taux(s.part, 1) : "aucun contrat"],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-400000, -200000, 0, 200000, 400000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `commandes de Sarlève ${kE(s.commandes!)} · stock dédié ${kE(s.stock!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.reponse && (choix === 1 || choix === 2)) {
      // Sarlève répond à la contre-proposition selon le hasard du trimestre.
      const st = statut([choix], graine);
      const r =
        choix === 1
          ? st === "signe"
            ? REPONSES.clausesAccepte
            : st === "plusTard"
              ? REPONSES.clausesPlusTard
              : REPONSES.clausesLestrade
          : st === "signe"
            ? REPONSES.sansExclusiviteAccepte
            : st === "plusTard"
              ? REPONSES.sansExclusivitePlusTard
              : REPONSES.sansExclusiviteLestrade;
      return [{ ...AUGUSTIN, texte: r }];
    }
    if (etape === D.extension && choix === 2) {
      return [
        {
          ...RONAN,
          texte: analyseFavorable(graine) ? REPONSES.analyseFavorable : REPONSES.analyseDefavorable,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dans = (w: number) => w >= de && w <= a;
    const contrat = t.statut !== "lestrade";
    const lies: Message[] = [];
    if (arrive.signature) {
      lies.push({
        ...AUGUSTIN,
        heure: `sem. ${PLUS_TARD.signature}`,
        texte: REPONSES.signatureTardive,
      });
    }
    if (contrat && dans(EFFET[D.extension]) && chemin[D.extension] !== 1) {
      lies.push({
        ...AUGUSTIN,
        heure: `sem. ${EFFET[D.extension]}`,
        texte: t.etendu ? REPONSES.extensionSignee : REPONSES.extensionRefusee,
      });
    }
    const tranches =
      contrat && chemin[D.stock] === 2 && t.signature !== null && t.signature < RUPTURE.semaine;
    if (tranches && dans(RUPTURE.semaine)) {
      lies.push({
        ...NADIR,
        heure: `sem. ${RUPTURE.semaine}`,
        alerte: t.rupture,
        texte: t.rupture ? REPONSES.rupture : REPONSES.pasDeRupture,
      });
    }
    if (arrive.conquete) {
      lies.push({
        ...ELIOTT,
        heure: `sem. ${CONQUETE.semaine}`,
        alerte: !t.conquete,
        texte: t.conquete ? REPONSES.conqueteReussie : REPONSES.conqueteRatee,
      });
    }
    if (contrat && chemin[D.revue] !== 0 && dans(EFFET[D.revue])) {
      lies.push({
        ...AUGUSTIN,
        heure: `sem. ${EFFET[D.revue]}`,
        alerte: t.resilie,
        texte: t.resilie ? REPONSES.revueResilie : REPONSES.revueAccepte,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.carnet) {
      imprevus.push({
        ...WEN,
        heure: `sem. ${REVELATION}`,
        texte: REPONSES.carnet[t.scenario]!,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : la valeur actuelle, au taux du groupe, de tout ce qu'elles ont engagé, recalculée avec ce que le trimestre a révélé, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const contrat = t.statut !== "lestrade";
      const d1 = t.chemin[D.reponse];
      const exclusivite = contrat && d1 !== 2;
      const d3 = t.chemin[D.exclus];
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Le contrat",
          valeur: !contrat ? "chez Lestrade" : t.resilie ? "résilié" : "signé",
          aide: !contrat
            ? "Sarlève a signé avec le concurrent"
            : t.resilie
              ? "Sarlève part au terme de la première année"
              : "trois ans avec Sarlève",
          tenu: contrat && !t.resilie,
        },
        {
          nom: "Part de Sarlève",
          valeur: t.part > 0 ? taux(t.part, 1) : "aucune",
          aide: `du chiffre de la région ; plafond ${taux(PLAFOND_DE_PART, 0)}`,
          tenu: t.part > 0 && t.part <= PLAFOND_DE_PART,
        },
        {
          nom: "Moulinier et Batival",
          valeur: !exclusivite
            ? "toujours clients"
            : d3 === 2
              ? "retour préparé"
              : d3 === 1
                ? "remplacés ?"
                : "perdus",
          aide: !exclusivite
            ? "aucune exclusivité ne les écarte"
            : d1 === 1
              ? "exclus pendant deux ans"
              : "exclus pendant trois ans",
          tenu: !exclusivite || d3 === 2,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const d1 = t.chemin[D.reponse];
      const reponse =
        d1 === 0
          ? "a signé le contrat tel qu'il le proposait."
          : d1 === 3
            ? "a signé avec Lestrade après le refus d'Arvel."
            : t.statut === "signe"
              ? "a accepté la contre-proposition."
              : t.statut === "plusTard"
                ? "a consulté Lestrade, puis signé en semaine 6, trois dixièmes de point plus cher."
                : "est parti chez Lestrade plutôt que d'accepter la contre-proposition.";
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        { titre: "Sarlève", texte: reponse },
        {
          titre: "Le carnet de commandes",
          texte: `${SCENARIOS[t.scenario]!.nom} : ${REPONSES.carnet[t.scenario]!.split(" : ").slice(1).join(" : ")}`,
        },
        {
          titre: "Le chantier des Vergnes",
          texte: `Suspendu en semaine ${SUSPENSION.semaine} dans tous les cas : ${taux(SUSPENSION.volume, 0)} du volume de l'année.`,
        },
        {
          titre: "La revue des prix",
          texte:
            t.statut === "lestrade"
              ? "Sans contrat, pas de revue."
              : t.chemin[D.revue] === 0
                ? "Vous avez accordé le point : Sarlève n'avait aucune raison de partir."
                : t.resilie
                  ? "Sarlève a résilié au terme de la première année."
                  : "Sarlève a accepté votre réponse et reste trois ans.",
        },
        ...(t.analyse !== null
          ? [
              {
                titre: "L'analyse du carnet",
                texte: t.analyse
                  ? "a conclu que Sarlève était solide."
                  : "a conclu que l'activité de Sarlève fléchissait.",
              },
            ]
          : []),
        ...(t.conquete !== null
          ? [
              {
                titre: "La campagne de conquête",
                texte: conqueteReussie(graine)
                  ? "a fait signer une entreprise générale."
                  : "n'a rien donné.",
              },
            ]
          : []),
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      return valeurA(t, a) - valeurA(t, de - 1);
    },
  },
  comportements,
  axe,
};
