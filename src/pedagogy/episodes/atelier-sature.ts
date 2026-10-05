/**
 * ÉPISODE 36 — L'ATELIER SATURÉ, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi de l'atelier de Florent montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BAILLEUR,
  BUDGET,
  CHANCE_CONTRE,
  D,
  DISPONIBLES,
  JOURS_SANS_PERTE,
  MARGE_CLIENT,
  NEUTRE,
  PERTE_PAR_JOUR,
  evenements,
  hasard,
  prixBailleur,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/atelier-sature";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/atelier-sature";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const parHeure = (v: number) => `${nombre(v, 0)} €/h`;
const heures = (v: number) => `${nombre(v, 0)} h`;
/** Un écart au budget : positif, l'atelier a fait mieux que son budget de marge. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget de marge` : `${kE(-v)} sous le budget de marge`;

/** Le repère de la tuile : la marge par heure de machine d'un planning bien classé. */
export const REPERE_MARGE_HEURE = 620;

const DELPHINE = {
  de: "Delphine Arcand",
  role: "Responsable des achats, Alvéole Habitat",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable d'atelier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les fiches de coût et la charge de chaque poste",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    facteurRare:
      "Votre diagnostic de la semaine 1 était juste : la machine était le goulot, et le planning donnait ses heures à des pièces qui les payaient mal.",
    capacite:
      "En semaine 1, vous avez vu le manque de capacité : une vraie contrainte, mais pas le levier immédiat. Avant d'ajouter des heures, il fallait donner celles qu'on avait aux pièces qui les paient le mieux.",
    escaliers:
      "En semaine 1, vous avez retenu le manque d'escaliers ; c'était la pièce qui payait le moins bien l'heure de machine, 400 € contre 810 € pour une fenêtre.",
    prix: "En semaine 1, vous avez retenu le prix des fenêtres, sur la foi d'un coût complet ; les charges fixes réparties ne changent pas avec ce qu'on fabrique, et la fenêtre était la pièce qui payait le mieux l'heure de machine.",
  };
  const justes = ["facteurRare", "capacite"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "facteurRare" ? 1 : d === "capacite" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais jugé une pièce sur sa marge ou son taux de marge seuls : vous avez toujours regardé ce qu'elle rapportait par heure de machine."
        : `Machine pleine, vous avez choisi ${n} fois sur ${ETAPES.length} décisions ce que dicte la marge d'une pièce plutôt que sa marge par heure de machine : l'escalier d'abord, le prix qui couvre le coût variable, l'heure d'arrêt comptée au salaire.${
            t.clientParti
              ? " Les Menuiseries Daubrée sont parties, faute de fenêtres."
              : t.bailleurSigne && p.chemin[D.bailleur] === 0
                ? " La commande du bailleur a pris des heures mieux payées qu'elle."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.margeHeureEscalier,
    "de marge sur coût variable par heure de centre d'usinage pour l'escalier",
    "€",
    { juste: 10, proche: 40 },
    (e) => `${nombre(e, 0)} €`,
  );

  // L'heure de machine valorisée à ce qu'elle rapporte : le prix de la commande, les heures achetées, l'arrêt.
  const prixJuste = p.chemin[D.bailleur] !== 0;
  const heuresAchetees = p.chemin[D.goulot] === 1 || p.chemin[D.goulot] === 2;
  const arretJuste = p.chemin[D.broche] !== 1;
  const promoteur = p.chemin[D.fin] === 1;
  const bons = [prixJuste, heuresAchetees, arretJuste, promoteur].filter(Boolean).length;
  const opportunite: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      prixJuste
        ? "Vous n'avez pas vendu d'heures de machine en dessous de ce qu'elles rapportaient."
        : "Vous avez accepté la commande du bailleur parce que son prix couvrait le coût variable : ses heures de machine étaient prises à des pièces mieux payées."
    } ${
      heuresAchetees
        ? "Vous avez acheté des heures de machine moins cher qu'elles ne rapportaient."
        : p.chemin[D.goulot] === 0
          ? "Vous avez sorti de la machine la pièce qui la payait le mieux."
          : "Vous n'avez rien fait pour desserrer le goulot."
    } ${
      promoteur
        ? "Vous avez pris les escaliers du promoteur, qui payaient l'heure de machine mieux que la dernière pièce servie."
        : "Vous n'avez pas pris les escaliers du promoteur, qui payaient l'heure de machine mieux que la dernière pièce servie."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, opportunite];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  opportunite,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Trouver le goulot avant de trancher",
      texte:
        "Rejouez l'épisode en relevant d'abord la charge de chaque poste et les fiches de coût : seule la machine refusait des pièces, et les fiches donnaient de quoi calculer ce que chaque pièce rapporte par heure de machine.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Classer par heure de machine, pas par pièce",
      texte:
        "Quand une ressource est pleine, une pièce se juge sur sa marge sur coût variable par heure de cette ressource. L'escalier avait la plus forte marge unitaire et le meilleur taux ; il payait l'heure de machine deux fois moins qu'une fenêtre.",
    };
  }
  if (opportunite!.score === 0) {
    return {
      titre: "Donner un prix à l'heure de machine",
      texte:
        "Une heure de machine pleine vaut ce que rapporte la pièce qu'on refuse pour la libérer. C'est ce qu'il faut ajouter au coût variable d'une commande, compter dans un arrêt, et comparer au prix d'une heure ajoutée.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher la ressource qui manque",
      texte:
        "Avant de juger les produits, cherchez ce qui limite l'atelier : tant qu'une seule ressource est pleine, c'est elle qui fixe ce que rapporte chaque choix.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte:
        "Marge sur coût variable de l'escalier, prix moins coûts variables, divisée par ses heures de machine : c'est le chiffre qui fixait le prix plancher de toute commande. Les charges fixes réparties n'y entrent pas.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a apporté là. */
const FENETRES: readonly [number, number][] = [
  [1, 3],
  [4, 7],
  [6, 9],
  [8, 11],
  [10, 13],
  [12, 13],
];

export const EPISODE_ATELIER_SATURE: Episode<Trimestre> = {
  code: "atelier-sature",
  numero: 36,
  domaine: "Contrôle de gestion : coûts et décisions",
  titre: "L'atelier saturé",
  resume:
    "Un atelier de menuiserie sur mesure dont la machine est pleine, un carnet qui déborde, des commandes qui arrivent. Juger chaque pièce sur ce qu'elle rapporte par heure de machine.",
  persona:
    "Vous êtes Florent Sauvageot, responsable de l'atelier de menuiserie sur mesure d'Arvel Distribution, à Rillieux-la-Pape. Votre atelier fabrique des fenêtres, des portes d'entrée et des escaliers pour les artisans clients des agences : onze menuisiers, et un centre d'usinage à commande numérique par où tout passe, conduit par Sékou Traoré.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge de l'atelier sur le trimestre, au moins" },
    { fort: `${DISPONIBLES} heures`, texte: "d'usinage par semaine, en une équipe" },
    { fort: "pas de nouvelle machine", texte: "avant le budget de l'an prochain" },
    { fort: "les délais promis", texte: "aux commandes signées, tenus" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge de l'atelier, la marge sur coût variable moins les frais engagés pour le désaturer et les pertes, en écart à son budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre atelier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le planning continue de tourner au premier arrivé, premier servi.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Soizic Le Bihan",
        role: "Contrôleuse de gestion",
        alerte: true,
        texte: `Pendant ce temps, la machine a continué de servir les pièces dans l'ordre d'arrivée : ${euros(perdu)} de marge qu'un autre planning aurait faite.`,
      };
    },
  },
  prevision: {
    libelle: "la marge sur coût variable par heure de centre d'usinage de l'escalier, en euros",
    unite: "€",
    placeholder: "0",
    min: 0,
    max: 5000,
    step: 1,
    reel: (t) => t.margeHeureEscalier,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge de l'atelier",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "charge",
      nom: "Charge du centre d'usinage",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: () => "heures demandées sur heures disponibles",
    },
    {
      cle: "margeHeure",
      nom: "Marge par heure de machine",
      format: parHeure,
      sensBon: 1,
      aide: () => "marge sur coût variable par heure d'usinage disponible",
    },
    {
      cle: "caPerdu",
      nom: "Devis perdus faute de machine",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? "chiffre d'affaires, depuis le début du trimestre" : "chiffre d'affaires",
    },
    {
      cle: "tauxMarge",
      nom: "Taux de marge sur coût variable",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `marge sur coût variable / chiffre d'affaires, sem. ${semaine}` : "ce mois-ci",
    },
  ],
  contexte(l, decisions) {
    return {
      marge: kE(l.marge ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      charge: taux(l.charge ?? 0, 0),
      margeHeure: parHeure(l.margeHeure ?? 0),
      caPerdu: kE(l.caPerdu ?? 0),
      tauxMarge: taux(l.tauxMarge ?? 0),
      regle: decisions[D.planning] ?? NEUTRE[D.planning],
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    const mcv = semaines.reduce((x, w) => x + w.mcv, 0);
    const h = semaines.reduce((x, w) => x + w.heuresDisponibles, 0);
    return [
      ["Marge de la période", kE(contribution)],
      [`Heures de machine, sem. ${a}`, heures(t.semaines[a]!.heuresDisponibles)],
      ["Marge par heure de machine", parHeure(h > 0 ? mcv / h : 0)],
    ];
  },
  courbe: {
    titre: "Marge de l'atelier, semaine par semaine",
    cle: "contribution",
    cible: BUDGET / 13,
    libelleCible: `budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [0, 10000, 20000, 30000, 40000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.contribution!)} · ${heures(s.heuresDisponibles!)} de machine, ${parHeure(s.margeHeure!)}`,
      `${nombre(s.fenetres!, 0)} fenêtres, ${nombre(s.portes!, 0)} portes, ${nombre(s.escaliers!)} escaliers`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.bailleur && choix === 1) {
      // Le bailleur répond à la contre-proposition selon le hasard du trimestre.
      const signe = hasard(graine).uBailleur < CHANCE_CONTRE;
      return [{ ...DELPHINE, texte: signe ? REPONSES.contreAcceptee : REPONSES.contreRefusee }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (t.bailleurSigne && de <= BAILLEUR.de && a >= BAILLEUR.de) {
      lies.push({
        de: "Lucien Bouvard",
        role: "Chef d'équipe assemblage",
        heure: `sem. ${BAILLEUR.de}`,
        texte: `Premières portes palières d'Alvéole Habitat sur la machine, à ${euros(prixBailleur(chemin))} la porte : 7 h 30 de machine par semaine jusqu'à la semaine ${BAILLEUR.a}.`,
      });
    }
    if (arrive.clientParti) {
      lies.push({
        de: "Jean-Marc Daubrée",
        role: "Gérant, Menuiseries Daubrée",
        heure: "sem. 7",
        alerte: true,
        texte: REPONSES.clientParti,
      });
    }
    if (arrive.equipe) {
      lies.push({
        de: "Sékou Traoré",
        role: "Opérateur du centre d'usinage",
        heure: "sem. 8",
        texte: REPONSES.equipe,
      });
    }
    if (arrive.industriel) {
      lies.push({
        de: "Lucien Bouvard",
        role: "Chef d'équipe assemblage",
        heure: "sem. 8",
        texte: REPONSES.industriel,
      });
    }
    if (arrive.casse) {
      lies.push({
        de: "Sékou Traoré",
        role: "Opérateur du centre d'usinage",
        heure: `sem. ${t.casse}`,
        alerte: true,
        texte: REPONSES.casse,
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
    titre: (t) => ecartAuBudget(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Marge de l'atelier, marge sur coût variable moins les frais engagés et les pertes, en écart à son budget, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const prix = t.bailleurSigne
        ? t.margeBailleur / BAILLEUR.quantite + BAILLEUR.coutVariable
        : 0;
      return [
        {
          nom: "Marge de l'atelier",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.marge >= BUDGET,
        },
        {
          nom: "Marge par heure de machine",
          valeur: parHeure(t.margeHeure),
          aide: `sur le trimestre ; repère ${parHeure(REPERE_MARGE_HEURE)}`,
          tenu: t.margeHeure >= REPERE_MARGE_HEURE,
        },
        {
          nom: "Fenêtres servies",
          valeur: taux(t.serviceFenetres, 0),
          aide: t.clientParti
            ? "les Menuiseries Daubrée sont parties"
            : "des fenêtres demandées sur le trimestre",
          tenu: t.serviceFenetres >= 0.9 && !t.clientParti,
        },
        {
          nom: "Commande du bailleur",
          valeur: t.bailleurSigne ? `signée à ${euros(prix)}` : "pas signée",
          aide: t.bailleurSigne
            ? `${kE(t.margeBailleur)} de marge sur coût variable, pour 45 heures de machine`
            : "aucune heure de machine prise",
          tenu: !t.bailleurSigne || prix > BAILLEUR.prixPropose,
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
          titre: "La machine",
          texte: t.casse
            ? `La broche a cassé en semaine ${t.casse} : deux jours d'arrêt et 6 500 € de réparation.`
            : "La broche a tenu jusqu'à la fin du trimestre.",
        },
        {
          titre: "Les clients",
          texte: [
            h.uBailleur < CHANCE_CONTRE
              ? "Alvéole Habitat était prêt à payer 1 650 € la porte"
              : "Alvéole Habitat n'aurait pas payé 1 650 € la porte",
            t.clientParti
              ? `les Menuiseries Daubrée sont parties en semaine 7 (${kE(MARGE_CLIENT)} de marge du négoce)`
              : "les Menuiseries Daubrée sont restées",
          ]
            .join(", ")
            .concat("."),
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      let c = 0;
      for (let w = de; w <= a; w += 1) c += t.semaines[w]!.contribution;
      return c;
    },
  },
  comportements,
  axe,
};
