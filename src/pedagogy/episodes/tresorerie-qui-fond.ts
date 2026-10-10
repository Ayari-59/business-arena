/**
 * ÉPISODE 11 — LA TRÉSORERIE QUI FOND, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de trésorerie de Béatrice montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  AUTORISATION,
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_DSO,
  OBJECTIF_STOCK,
  PERTE_PAR_JOUR,
  banqueAccordeSansDossier,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/tresorerie-qui-fond";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/tresorerie-qui-fond";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v)} j`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n >= 2 ? "s" : ""}`;
/** Un écart au budget : positif, la filiale est restée en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

const BANQUE = {
  de: "Olivier Peyrache",
  role: "Chargé d'affaires entreprises, la banque",
} as const;
const AURORE = { de: "Aurore Mazet", role: "Responsable du recouvrement" } as const;

/** Ce que les décisions révèlent, dans l'ordre où une responsable financière les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où dormait l'argent",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    bfr: "Votre diagnostic de la semaine 1 était juste : la marge tenait, mais la croissance, les retards de paiement et le stock immobilisaient chaque semaine plus de cash qu'elle n'en dégageait.",
    clients:
      "En semaine 1, vous avez vu les retards de paiement : une vraie cause, mais pas la seule. Le stock immobilisait presque autant que les créances, et la croissance elle-même les gonflait.",
    rentabilite:
      "En semaine 1, vous avez cru à un problème de rentabilité ; le compte de résultat était bon. L'argent ne se perdait pas, il dormait au bilan.",
    fournisseurs:
      "En semaine 1, vous avez retenu le paiement des fournisseurs ; à 48 jours, il était dans la norme. Les payer plus tard, c'est emprunter au prêteur le plus cher.",
  };
  const justes = ["bfr", "clients"];
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
    score: d === "bfr" ? 1 : d === "clients" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché le cash par réflexe chez les fournisseurs ou chez le factor : vous êtes allée le chercher là où il dormait, dans les créances et le stock."
        : `Sous la pression du découvert, vous avez choisi ${n} fois sur ${ETAPES.length} la solution qui libère du cash tout de suite et le reprend plus tard : décaler les fournisseurs, tout affacturer, couper les commandes, braquer un client.${
            t.norviaCoupe
              ? " L'assureur-crédit de Norvia a coupé sa couverture."
              : t.remisePerdue
                ? " Norvia a supprimé sa remise de fin de trimestre."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.decouvert / 1000,
    "de découvert en fin de semaine 3",
    "k€",
    { juste: 40, proche: 120 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const banque = p.chemin[D.banque];
  const prevenue = banque === 0;
  const picPrepare = p.chemin[D.pic] === 1 || p.chemin[D.pic] === 2;
  const points = (prevenue ? 1 : 0) + (picPrepare ? 1 : 0);
  const rejets = t.rejets.length;
  const relation: Constat = {
    score: points === 2 ? 1 : points === 1 ? 0.6 : 0,
    texte: `${
      prevenue
        ? "Vous êtes allée voir la banque tôt, prévision à l'appui, avant qu'elle ne s'inquiète."
        : banque === 1
          ? "Vous avez demandé de l'argent à la banque sans lui montrer de prévision."
          : banque === 2
            ? "Vous avez remplacé la banque par un factor, sur tout votre chiffre d'affaires."
            : "Vous avez fait attendre la banque."
    } ${
      picPrepare
        ? "Vous avez financé le pic de la semaine 12 avant qu'il n'arrive."
        : "Le pic de la semaine 12 n'a pas été financé à l'avance."
    }${rejets ? ` La banque a rejeté ${pluriel(rejets, "virement")} faute de provision.` : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, relation];
}

export function axe([information, diagnostic, reflexe, calibrage, relation]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher où dort l'argent",
      texte:
        "Rejouez l'épisode en ouvrant d'abord la balance âgée et la décomposition du BFR : quinze clients faisaient l'essentiel du retard, et le stock immobilisait presque autant que les créances.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Libérer le cash là où il dort",
      texte:
        "Décaler les fournisseurs ou tout affacturer donne du cash tout de suite et le reprend plus tard, en pénalités, en remises perdues et en commissions. Cherchez d'abord dans les créances et le stock.",
    };
  }
  if (relation!.score === 0) {
    return {
      titre: "Parler à la banque avant qu'elle ne s'inquiète",
      texte:
        "Une banque prête à qui lui montre une prévision semaine par semaine, et resserre la ligne de qui la fait attendre. Allez la voir tôt, chiffres en main, et préparez les pics avant qu'ils n'arrivent.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Décomposer le besoin en fonds de roulement",
      texte:
        "Quand la trésorerie baisse alors que l'activité est bonne, regardez les postes du bilan un par un : créances, stock, fournisseurs. Chaque jour de délai a un prix.",
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

export const EPISODE_TRESORERIE: Episode<Trimestre> = {
  code: "tresorerie-qui-fond",
  numero: 9,
  domaine: "Trésorerie et besoin en fonds de roulement",
  titre: "La trésorerie qui fond",
  resume:
    "Une filiale qui vend plus et dont le découvert se creuse. Chercher le cash là où il dort avant de l'emprunter au plus cher.",
  persona:
    "Vous êtes Béatrice Castagnier, responsable administrative et financière d'Arvel Matériaux Rhône Sud, la filiale d'Arvel Distribution qui exploite six agences au sud de Lyon. Votre équipe : Thierry Gallet, chef comptable, Mehdi Saïdi à la comptabilité fournisseurs, et Aurore Mazet avec deux personnes au recouvrement.",
  mandat: [
    { fort: kE(AUTORISATION), texte: "d'autorisation de découvert, à ne pas dépasser" },
    { fort: `${OBJECTIF_DSO} jours`, texte: "de délai de paiement clients, au plus" },
    { fort: `${OBJECTIF_STOCK} jours`, texte: "de stock, au plus" },
    { fort: kE(BUDGET), texte: "de budget de frais financiers et de pertes" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de frais financiers et de pertes : agios, commissions, affacturage, impayés, stock déprécié, remises perdues et ventes manquées, escomptes obtenus déduits.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre trésorerie",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les virements de la semaine passent au-delà de l'autorisation et coûtent des commissions.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...BANQUE,
        alerte: true,
        texte: `Pendant ce temps, le compte a dépassé l'autorisation plusieurs jours : commissions et intérêts majorés, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le découvert en fin de semaine 3, en milliers d'euros",
    unite: "k€",
    placeholder: "1150",
    min: 0,
    max: 3000,
    step: 10,
    reel: (t) => t.semaines[3]!.decouvert / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "decouvert",
      nom: "Découvert utilisé",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `autorisation : ${kE(l.autorisation ?? AUTORISATION)}`,
      jauge: (l) => {
        const decouvert = l.decouvert ?? null;
        if (decouvert === null || !l.autorisation) return null;
        return {
          part: Math.min(1, decouvert / l.autorisation),
          enRetard: decouvert > l.autorisation,
        };
      },
    },
    {
      cle: "dso",
      nom: "Délai de paiement clients",
      format: jours,
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_DSO} jours au plus`,
    },
    {
      cle: "stock",
      nom: "Stock",
      format: jours,
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_STOCK} jours au plus`,
    },
    {
      cle: "bfr",
      nom: "Besoin en fonds de roulement",
      format: kE,
      sensBon: -1,
      aide: () => "créances + stock − fournisseurs",
    },
    {
      cle: "couts",
      nom: "Frais financiers et pertes",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
    },
  ],
  contexte(l, decisions) {
    const decouvert = l.decouvert ?? 0;
    const autorisation = l.autorisation ?? AUTORISATION;
    return {
      decouvert: kE(decouvert),
      autorisation: kE(autorisation),
      marge: kE(Math.max(0, autorisation - decouvert)),
      dso: jours(l.dso ?? 0),
      stock: jours(l.stock ?? 0),
      bfr: kE(l.bfr ?? 0),
      cimier: kE(l.cimier ?? 0),
      previsionPic: kE(l.previsionPic ?? 0),
      semainePic: l.semainePic ?? 13,
      picAvecEscompte: kE(l.picAvecEscompte ?? 0),
      premierDepassement: l.premierDepassement || 13,
      relanceCiblee: decisions[D.relance] === 1,
      banquePrevenue: decisions[D.banque] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`Découvert, sem. ${a}`, kE(t.semaines[a]!.decouvert)],
      [`Délai clients, sem. ${a}`, jours(t.semaines[a]!.dso)],
      ["Frais et pertes de la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Découvert, semaine par semaine",
    cle: "decouvert",
    cible: AUTORISATION,
    libelleCible: `autorisation de départ : ${kE(AUTORISATION)}`,
    graduations: [500000, 1000000, 1500000, 2000000],
    format: (v) => `${nombre(v / 1e6)} M€`,
    details: (s) => [
      `découvert ${kE(s.decouvert!)} · autorisation ${kE(s.autorisation!)}${
        s.factor ? ` · factor ${kE(s.factor)}` : ""
      }`,
      `délai clients ${jours(s.dso!)} · stock ${jours(s.stock!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.banque && choix === 1) {
      // La réponse du comité à une demande sans dossier dépend du hasard du trimestre.
      return [
        {
          ...BANQUE,
          texte: banqueAccordeSansDossier(graine) ? REPONSES.accord : REPONSES.refus,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.norviaCoupe) {
      lies.push({
        de: "Stéphanie Royer",
        role: "Directrice commerciale, Norvia",
        heure: "sem. 6",
        alerte: true,
        texte: REPONSES.coupure,
      });
    }
    if (chemin[D.banque] === 3 && de <= 7 && a >= 7) {
      lies.push({
        ...BANQUE,
        heure: "sem. 7",
        alerte: t.banqueReduit,
        texte: t.banqueReduit ? REPONSES.reduction : REPONSES.maintien,
      });
    }
    if (arrive.cimierDefaut) {
      lies.push({
        ...AURORE,
        heure: "sem. 10",
        alerte: true,
        texte:
          t.cimierPerte > 0
            ? `Cimier Construction est placé en redressement judiciaire. Il nous devait encore ${kE(t.cimierPerte / 0.7)} : nous n'en récupérerons qu'environ 30 %.`
            : "Cimier Construction est placé en redressement judiciaire. Nous n'avons plus rien chez eux.",
      });
    }
    if (arrive.facilite !== null) {
      lies.push({
        ...BANQUE,
        heure: "sem. 12",
        alerte: !arrive.facilite,
        texte: arrive.facilite ? REPONSES.faciliteOui : REPONSES.faciliteNon,
      });
    }
    if (arrive.injonction) {
      lies.push({
        de: "Thierry Gallet",
        role: "Chef comptable",
        heure: "sem. 12",
        texte: REPONSES.injonction,
      });
    }
    for (const w of arrive.rejets) {
      lies.push({
        ...BANQUE,
        heure: `sem. ${w}`,
        alerte: true,
        texte: `Votre compte étant au-delà de l'autorisation, nous avons rejeté un virement faute de provision. Frais, pénalités et majorations du créancier : ${euros(t.semaines[w]!.rejet)}.`,
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, frais financiers et pertes compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de frais financiers et de pertes de la filiale (agios, affacturage, impayés, stock déprécié, remises perdues, ventes manquées, escomptes déduits), sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Découvert au plus haut",
          valeur: kE(t.decouvertMax),
          aide: t.semainesEnDepassement
            ? `${pluriel(t.semainesEnDepassement, "semaine")} au-delà de l'autorisation`
            : "jamais au-delà de l'autorisation",
          tenu: t.semainesEnDepassement === 0,
        },
        {
          nom: "Délai clients",
          valeur: jours(t.dsoFinal),
          aide: `en semaine 13 ; objectif ${OBJECTIF_DSO} j`,
          tenu: t.dsoFinal <= OBJECTIF_DSO,
        },
        {
          nom: "Stock",
          valeur: jours(t.stockFinal),
          aide: `en semaine 13 ; objectif ${OBJECTIF_STOCK} j`,
          tenu: t.stockFinal <= OBJECTIF_STOCK,
        },
        {
          nom: "Fournisseurs",
          valeur: t.norviaCoupe
            ? "couverture coupée"
            : t.remisePerdue
              ? "remise perdue"
              : "payés à l'heure",
          aide: t.escomptes
            ? `${kE(t.escomptes)} d'escompte obtenu`
            : "remise de fin de trimestre de Norvia",
          tenu: !t.remisePerdue,
        },
      ];
    },
    hasard(t, graine) {
      const banque = [
        t.banqueAccorde ? "a accepté de relever l'autorisation sans dossier" : null,
        t.banqueReduit ? "a réduit l'autorisation en semaine 7" : null,
        t.faciliteAccordee ? "a accordé la facilité pour le pic" : null,
        t.rejets.length ? `a rejeté ${pluriel(t.rejets.length, "virement")}` : null,
      ].filter(Boolean);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Cimier Construction",
          texte: t.cimierDefaut
            ? t.cimierPerte > 0
              ? `a été placé en redressement judiciaire en semaine 10 : ${kE(t.cimierPerte)} perdus.`
              : "a été placé en redressement judiciaire en semaine 10, quand vous n'aviez plus rien chez lui."
            : "a tenu jusqu'au bout du trimestre.",
        },
        {
          titre: "La banque",
          texte: banque.length ? `${banque.join(", ")}.` : "n'a rejeté aucun virement.",
        },
        ...(t.norviaCoupe
          ? [
              {
                titre: "Norvia",
                texte:
                  "a perdu la couverture de son assureur-crédit sur votre compte, et retenu une semaine de livraisons.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
