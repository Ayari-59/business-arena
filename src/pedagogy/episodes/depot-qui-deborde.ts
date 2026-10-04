/**
 * ÉPISODE 3 — LE DÉPÔT QUI DÉBORDE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Camille montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NB_REFERENCES_A,
  NEUTRE,
  OBJECTIF_SERVICE,
  PERTE_PAR_JOUR,
  SEUIL_OCCUPATION,
  evenements,
  fournisseurTient,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/depot-qui-deborde";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/depot-qui-deborde";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le stock que la direction financière attend en fin de trimestre. */
const OBJECTIF_STOCK = 1300000;
/** La couverture qu'un dépôt de négoce vise : trois semaines de ventes. */
const COUVERTURE_CIBLE = 21;
/** L'écart d'inventaire toléré sur les A en fin de trimestre. */
const ECART_TOLERE = 25000;

const jours = (v: number) => `${nombre(v, 0)} j`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart au budget : positif, le dépôt est resté en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

/** Ce que les décisions révèlent, dans l'ordre où un responsable de dépôt les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient que les ruptures et le stock n'étaient pas sur les mêmes références",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    repartition:
      "Votre diagnostic de la semaine 1 était juste : le stock était là, mais sur les références qui dormaient, pas sur celles qui se vendaient.",
    inventaire:
      "En semaine 1, vous avez vu l'inventaire faux : une vraie cause, mais pas la principale. Les paramètres de réapprovisionnement sous-dimensionnaient les A de 26 % et sur-dimensionnaient les C.",
    volume:
      "En semaine 1, vous avez retenu un manque de stock ; le dépôt en portait 1,4 M€, presque tout sur des références qui ne sortaient pas.",
    fournisseurs:
      "En semaine 1, vous avez retenu les retards fournisseurs ; Visseries ne pesait qu'un quart des A, et les ruptures touchaient tout le reste.",
  };
  const justes = ["repartition", "inventaire"];
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
    score: d === "repartition" ? 1 : d === "inventaire" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à une rupture ou au trop-plein en ajoutant du stock ou de la place : vous avez déplacé le stock vers ce qui se vend."
        : `Face aux ruptures et au trop-plein, vous avez ajouté du stock ou de la place ${n} fois sur ${ETAPES.length} décisions. Ce stock en plus allait surtout là où il n'en manquait pas, et il remplissait un dépôt déjà plein${
            t.premiereSemaineSaturee !== null
              ? ` : dès la semaine ${t.premiereSemaineSaturee}, on stockait dans les allées`
              : ""
          }.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.service * 100,
    "de taux de service en semaine 3",
    "%",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const fiabilise = p.chemin[D.inventaire] === 0 || p.chemin[D.inventaire] === 1;
  const allege = p.chemin[D.place] === 1;
  const reel = (fiabilise ? 1 : 0) + (allege ? 1 : 0);
  const stockReel: Constat = {
    score: reel === 2 ? 1 : reel === 1 ? 0.6 : 0,
    texte: `${
      fiabilise
        ? "Vous avez remis l'inventaire en accord avec le rayon avant de piloter sur ses chiffres."
        : `Vous avez piloté sur un inventaire faux : en fin de trimestre, le système comptait encore ${kE(t.ecartFinal)} de références A qui n'étaient pas en rayon.`
    } ${
      allege
        ? "Et vous avez fait de la place en sortant les dormants, plutôt qu'en louant de la place pour eux."
        : "Les 800 k€ de dormants sont restés dans les allées."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, stockReel];
}

export function axe([information, diagnostic, reflexe, calibrage, stockReel]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder le stock référence par référence",
      texte:
        "Rejouez l'épisode en extrayant d'abord les ventes, le stock et les ruptures par classe ABC : les ruptures étaient sur les A, le stock sur les C. Un total ne le montre pas.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Mettre le stock au bon endroit avant d'en ajouter",
      texte:
        "Commander plus de tout remonte un peu ce qui manque et beaucoup ce qui dort, puis remplit le dépôt au point de ralentir ce qui doit entrer. Réallouez avant de rajouter.",
    };
  }
  if (stockReel!.score === 0) {
    return {
      titre: "Savoir ce qu'on a vraiment",
      texte:
        "Un inventaire faux fait rompre les références qu'on croit avoir, et des dormants occupent la place de ce qui se vend. Comptez ce qui tourne, sortez ce qui dort.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Classer avant de commander",
      texte:
        "Quand un dépôt rompt et déborde à la fois, le problème n'est pas la quantité de stock mais sa répartition. Une classe ABC à jour le montre en une heure.",
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

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a coûté là. */
const FENETRES: readonly [number, number][] = [
  [2, 5],
  [4, 7],
  [6, 10],
  [8, 11],
  [9, 13],
  [12, 13],
];

const MARC = { de: "Marc Perrin", role: "Directeur commercial, Visseries du Dauphiné" } as const;

export const EPISODE_DEPOT: Episode<Trimestre> = {
  code: "depot-qui-deborde",
  numero: 3,
  domaine: "Opérations et stocks",
  titre: "Le dépôt qui déborde",
  resume:
    "Un dépôt en rupture sur ce qui se vend et plein de ce qui dort. Mettre le stock au bon endroit avant d'en ajouter.",
  persona:
    "Vous êtes Camille Brunet, responsable du dépôt régional d'Arvel Distribution, à Saint-Priest. Votre équipe : une vingtaine de préparateurs et de caristes, et trois approvisionneurs, qui fournissent les agences de la région.",
  mandat: [
    { fort: taux(OBJECTIF_SERVICE, 0), texte: "de taux de service aux agences, au moins" },
    { fort: kE(OBJECTIF_STOCK), texte: "de stock en fin de trimestre, au plus" },
    { fort: taux(SEUIL_OCCUPATION, 0), texte: "d'occupation du dépôt, au plus" },
    {
      fort: kE(BUDGET),
      texte: "de budget : possession du stock, ruptures et coûts exceptionnels",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget du dépôt, en comptant le coût de possession du stock, la marge perdue sur les ruptures, la saturation du dépôt et les dépenses exceptionnelles.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre dépôt",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les agences en rupture se dépannent en express, à la charge du dépôt.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Agnès Roux",
        role: "Contrôleuse de gestion",
        alerte: true,
        texte: `Pendant ce temps, les agences ont commandé en dépannage express chez des confrères : ${euros(perdu)} refacturés au dépôt.`,
      };
    },
  },
  prevision: {
    libelle: "le taux de service aux agences en semaine 3, en %",
    unite: "%",
    placeholder: "91",
    min: 50,
    max: 100,
    step: 0.5,
    reel: (t) => t.semaines[3]!.service * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => `objectif : ${taux(OBJECTIF_SERVICE, 0)} au moins`,
    },
    {
      cle: "ruptures",
      nom: "Références A en rupture",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `sur ${nombre(NB_REFERENCES_A, 0)} références A`,
    },
    {
      cle: "couverture",
      nom: "Couverture de stock",
      format: jours,
      sensBon: -1,
      aide: () => `en jours de ventes ; cible : ${COUVERTURE_CIBLE} jours`,
    },
    {
      cle: "stock",
      nom: "Valeur du stock",
      format: kE,
      sensBon: -1,
      aide: () => `objectif de fin de trimestre : ${kE(OBJECTIF_STOCK)}`,
    },
    {
      cle: "occupation",
      nom: "Occupation du dépôt",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: () => `des emplacements ; au-delà de ${taux(SEUIL_OCCUPATION, 0)}, tout ralentit`,
      jauge: (l) =>
        l.occupation === null || l.occupation === undefined
          ? null
          : { part: Math.min(1, l.occupation), enRetard: l.occupation > SEUIL_OCCUPATION },
    },
  ],
  contexte(l, decisions) {
    return {
      service: taux(l.service ?? 0),
      ruptures: nombre(l.ruptures ?? 0, 0),
      stock: kE(l.stock ?? 0),
      couverture: jours(l.couverture ?? 0),
      occupation: taux(l.occupation ?? 0, 0),
      classees: decisions[D.stocks] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`Service, sem. ${a}`, taux(t.semaines[a]!.service)],
      [`Stock, sem. ${a}`, kE(t.semaines[a]!.stock)],
      ["Coût de la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Taux de service aux agences, semaine par semaine",
    cle: "service",
    cible: OBJECTIF_SERVICE,
    libelleCible: `objectif : ${taux(OBJECTIF_SERVICE, 0)} au moins`,
    graduations: [0.6, 0.7, 0.8, 0.9, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `service ${taux(s.service!)} · ${nombre(s.ruptures!, 0)} références A en rupture`,
      `stock ${kE(s.stock!)} · occupation ${taux(s.occupation!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.fournisseur && choix === 1) {
      // Seul le choix compte : Visseries répond selon le hasard du trimestre.
      return [
        {
          ...MARC,
          alerte: !fournisseurTient(graine),
          texte: fournisseurTient(graine)
            ? REPONSES.fournisseurTient
            : REPONSES.fournisseurNeTientPas,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.inventaireComplet) {
      lies.push({
        de: "Bruno Ferreira",
        role: "Chef d'équipe préparation",
        heure: "sem. 4",
        texte:
          "Dépôt fermé jeudi et vendredi pour l'inventaire. Tout le monde a compté, les intérimaires aussi.",
      });
    }
    if (arrive.saturation) {
      const t = simuler(chemin, graine);
      lies.push({
        de: "Bruno Ferreira",
        role: "Chef d'équipe préparation",
        heure: `sem. ${t.premiereSemaineSaturee}`,
        alerte: true,
        texte:
          "Le dépôt est plein : on stocke dans les allées, et on a refusé deux camions au quai, dont un de références A en rupture.",
      });
    }
    if (arrive.clientPerdu) {
      lies.push({
        de: "Olivier Jacquet",
        role: "Responsable de l'agence de Vénissieux",
        heure: "sem. 9",
        alerte: true,
        texte:
          "Delorme Construction passe ses prochains chantiers chez un concurrent : « trop de lignes manquantes ces dernières semaines ». C'était notre plus gros client artisan.",
      });
    }
    if (arrive.livraisonGroupee) {
      lies.push({
        ...MARC,
        heure: "sem. 12",
        texte:
          "Nous avons rattrapé notre retard : vos commandes doublées partent toutes cette semaine. Trois camions.",
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, ruptures et saturation comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget du dépôt, possession du stock, marge perdue sur les ruptures, saturation et dépenses comprises, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Taux de service",
          valeur: taux(t.serviceFin),
          aide: `semaines 10 à 13 ; objectif ${taux(OBJECTIF_SERVICE, 0)}`,
          tenu: t.serviceFin >= OBJECTIF_SERVICE - 0.02,
        },
        {
          nom: "Valeur du stock",
          valeur: kE(t.stockFinal),
          aide: `en semaine 13 ; objectif ${kE(OBJECTIF_STOCK)}`,
          tenu: t.stockFinal <= OBJECTIF_STOCK,
        },
        {
          nom: "Occupation du dépôt",
          valeur: taux(t.occupationFinale, 0),
          aide: `en semaine 13 ; plafond ${taux(SEUIL_OCCUPATION, 0)}`,
          tenu: t.occupationFinale <= SEUIL_OCCUPATION,
        },
        {
          nom: "Écart d'inventaire",
          valeur: kE(t.ecartFinal),
          aide: `sur les A, en semaine 13 ; toléré ${kE(ECART_TOLERE)}`,
          tenu: t.ecartFinal <= ECART_TOLERE,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.fournisseurATenu === null
          ? []
          : [
              {
                titre: "Visseries du Dauphiné",
                texte: t.fournisseurATenu
                  ? "a tenu les commandes à date fixe : deux semaines de délai dès la semaine 6."
                  : "n'a pas tenu : vos commandes régulières sont passées après celles d'un autre client.",
              },
            ]),
        {
          titre: "Les clients",
          texte: t.clientPerdu
            ? "Delorme Construction est parti chez un concurrent en semaine 9, lassé des ruptures."
            : "Delorme Construction, le plus gros client artisan, est resté.",
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      let c = 0;
      for (let w = de; w <= a; w += 1) c -= t.semaines[w]!.cout;
      return c;
    },
  },
  comportements,
  axe,
};
