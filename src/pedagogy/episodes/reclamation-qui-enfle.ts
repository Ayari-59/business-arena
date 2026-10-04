/**
 * ÉPISODE 8 — LA RÉCLAMATION QUI ENFLE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Laure montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 *
 * Deux réponses dépendent d'un choix antérieur et du hasard à la fois — celle
 * de Vantrel, qui ne cède que devant un dossier tracé, et celle de Pélissier —
 * et `reactions()` ne reçoit pas le chemin : elles arrivent donc par
 * `evenements().lies`, à la semaine où elles tombent.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_RETOURS,
  OBJECTIF_SATISFACTION,
  PERTE_PAR_JOUR,
  evenements,
  fournisseurPaie,
  hasard,
  lotTrace,
  nouveauLotDefectueux,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/reclamation-qui-enfle";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/reclamation-qui-enfle";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const retours = (v: number) => nombre(v, 0);
/** Un écart au budget : positif, le service est resté en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;
/** La part des coûts que Vantrel doit prendre en charge pour que la tuile soit tenue. */
const PART_VISEE = 1 / 3;

/** Ce que les décisions révèlent, dans l'ordre où un responsable qualité les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient le lot en cause",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    lot: "Votre diagnostic de la semaine 1 était juste : un lot défectueux, que chaque remplacement pris en rayon remettait en circulation.",
    usage:
      "En semaine 1, vous avez vu l'usage intensif : il révélait le défaut, mais ne le causait pas. Un MX-160 d'un autre lot tenait 400 heures de chantier sans usure.",
    agences:
      "En semaine 1, vous avez soupçonné des abus de garantie ; les appareils revenus avaient tous le même pignon usé, et presque tous le même numéro de lot.",
    conception:
      "En semaine 1, vous avez mis en cause tout le modèle ; les MX-160 des autres lots ne cassaient pas. Le défaut tenait à un lot.",
  };
  const justes = ["lot", "usage"];
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
    score: d === "lot" ? 1 : d === "usage" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu aux plaintes par un geste ou un remplacement à l'aveugle, ni en retirant tout le produit : vous avez cherché ce qui cassait avant d'agir."
        : `Vous avez répondu ${n} fois sur ${ETAPES.length} décisions par un geste commercial, un remplacement ou un retrait général. Chaque geste soulageait un client sans tarir le flux des pannes${
            t.retoursFinaux > OBJECTIF_RETOURS
              ? ` : en semaine 13, ${retours(t.retoursFinaux)} appareils revenaient encore en panne`
              : ""
          }.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[4]!.retours,
    "de retours en panne en semaine 4",
    "retours",
    { juste: 1, proche: 2.5 },
    (e) => `${nombre(e)} retour${e >= 2 ? "s" : ""}`,
  );

  const franchise = p.chemin[D.information] === 0;
  const preuve = p.chemin[D.fournisseur] === 0 && lotTrace(p.chemin);
  const tenus = (franchise ? 1 : 0) + (preuve ? 1 : 0);
  const domaine: Constat = {
    score: tenus === 2 ? 1 : tenus === 1 ? 0.6 : 0,
    texte: `${
      franchise
        ? "Vous avez dit aux acheteurs du lot ce qui se passait et ce qu'ils pouvaient faire."
        : p.chemin[D.information] === 3
          ? "Vous avez repris la position de Vantrel face aux clients : elle s'est retournée contre vous."
          : "Les clients inquiets n'ont pas eu de réponse claire sur leur appareil."
    } ${
      preuve
        ? "Face à Vantrel, vous avez présenté un dossier par numéro de série plutôt qu'une protestation."
        : p.chemin[D.fournisseur] === 0
          ? "Vous avez exigé la prise en charge de Vantrel sans numéros de série pour le prouver."
          : "Vous n'avez pas mis Vantrel devant des preuves."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qui casse avant de remplacer",
      texte:
        "Rejouez l'épisode en relevant d'abord les numéros de série des appareils revenus : presque tous venaient d'un même lot, que les agences remettaient en rayon à chaque échange.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter la cause, pas chaque plainte",
      texte:
        "Un geste commercial apaise un client et ne change rien au flux. Trouvez ce qui fabrique les pannes — un lot, un usage — et agissez là, de façon ciblée, plutôt que partout ou nulle part.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "La vérité aux clients, les preuves au fournisseur",
      texte:
        "Un client informé vite et franchement reste ; le silence le fait partir. Et un fournisseur qui nie ne cède que devant des données : retours par lot, numéros de série, expertise.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Remonter à la cause",
      texte:
        "Quand les retours se multiplient, regardez ce que les appareils cassés ont en commun avant de mettre en cause les clients, les agences ou le modèle.",
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
  [2, 4],
  [3, 6],
  [5, 8],
  [7, 10],
  [9, 13],
  [11, 13],
];

const PELISSIER = { de: "Serge Pélissier", role: "Gérant, Pélissier Construction" } as const;
const VANTREL = { de: "Hervé Lacombe", role: "Responsable grands comptes, Vantrel" } as const;
const ATELIER = { de: "Thibault Rousset", role: "Chef d'atelier SAV" } as const;

export const EPISODE_QUALITE: Episode<Trimestre> = {
  code: "reclamation-qui-enfle",
  numero: 8,
  domaine: "Qualité et réclamations",
  titre: "La réclamation qui enfle",
  resume:
    "Un malaxeur de chantier qui revient en panne, un grand client qui menace de partir, un fournisseur qui nie. Trouver le lot avant de remplacer.",
  persona:
    "Vous êtes Laure Bertin, responsable qualité et service après-vente d'Arvel Distribution, à Vénissieux. Votre équipe : trois techniciens à l'atelier SAV, une assistante, et un relais SAV dans chacune des six agences.",
  mandat: [
    {
      fort: `${OBJECTIF_RETOURS} retours`,
      texte: "en panne par semaine, au plus, en fin de trimestre",
    },
    { fort: "80 %", texte: "de clients concernés satisfaits, au moins" },
    { fort: kE(BUDGET), texte: "de budget de non-qualité, net de ce que le fournisseur rembourse" },
    { fort: "Pélissier Construction", texte: "votre premier client chapiste, à garder" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de non-qualité : remplacements, avoirs, rappels, ventes et clients perdus, moins ce que le fournisseur rembourse.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre service qualité",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les clients en panne qui attendent finissent par coûter des avoirs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Patrice Gaillard",
        role: "Chef d'agence, Vénissieux",
        alerte: true,
        texte: `Pendant ce temps, des clients en panne excédés ont obtenu des avoirs au comptoir : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de MX-160 revenus en panne en semaine 4",
    unite: "retours",
    placeholder: "9",
    min: 0,
    max: 40,
    step: 1,
    reel: (t) => t.semaines[4]!.retours,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "retours",
      nom: "Retours en panne",
      format: retours,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine} ; objectif : ${OBJECTIF_RETOURS} au plus`
          : "la semaine dernière ; 3 au printemps",
    },
    {
      cle: "ouvertes",
      nom: "Réclamations sans réponse",
      format: retours,
      sensBon: -1,
      aide: (semaine) => (semaine ? `fin de semaine ${semaine}` : "ce matin"),
    },
    {
      cle: "satisfaction",
      nom: "Clients concernés satisfaits",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "objectif : 80 % au moins",
    },
    {
      cle: "coutNet",
      nom: "Coût net de la non-qualité",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} de budget sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.coutNet ?? 0) / BUDGET)),
              enRetard: (l.coutNet ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "partFournisseur",
      nom: "Part payée par le fournisseur",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "des coûts de non-qualité engagés",
    },
  ],
  contexte(l, decisions) {
    return {
      retours: retours(l.retours ?? 0),
      ouvertes: retours(l.ouvertes ?? 0),
      satisfaction: taux(l.satisfaction ?? 0, 0),
      net: kE(l.coutNet ?? 0),
      parc: nombre(Math.round((l.parc ?? 0) / 5) * 5, 0),
      lotTrace: decisions[D.retours] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const net = semaines.reduce((x, w) => x + w.net, 0);
    return [
      [`Retours, sem. ${a}`, retours(t.semaines[a]!.retours)],
      [`Satisfaction, sem. ${a}`, taux(t.semaines[a]!.satisfaction, 0)],
      ["Coût net de la période", kE(net)],
    ];
  },
  courbe: {
    titre: "Retours en panne, semaine par semaine",
    cle: "retours",
    cible: OBJECTIF_RETOURS,
    libelleCible: `objectif : ${OBJECTIF_RETOURS} retours par semaine au plus`,
    graduations: [3, 5, 10, 15, 20],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${retours(s.retours!)} retours · ${retours(s.ouvertes!)} réclamations sans réponse`,
      `satisfaction ${taux(s.satisfaction!, 0)} · coût cumulé ${kE(s.cout!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.nouveauLot && choix === 0) {
      // Le contrôle à réception révèle ce que le hasard du trimestre a mis dans le lot.
      return [
        {
          ...ATELIER,
          texte: nouveauLotDefectueux(graine)
            ? REPONSES.lotControleMauvais
            : REPONSES.lotControleBon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.fournisseurRepond) {
      const paie = fournisseurPaie(chemin, graine);
      const dossier = chemin[D.fournisseur] === 0;
      lies.push({
        ...VANTREL,
        heure: "sem. 5",
        alerte: !paie,
        texte: dossier
          ? paie
            ? REPONSES.dossierAccepte
            : REPONSES.dossierRefuse
          : paie
            ? REPONSES.suspensionLevee
            : REPONSES.suspensionMaintenue,
      });
    }
    if (arrive.pelissierPart) {
      lies.push({ ...PELISSIER, heure: "sem. 7", alerte: true, texte: REPONSES.pelissierPart });
    } else if (arrive.pelissierReste) {
      lies.push({ ...PELISSIER, heure: "sem. 7", texte: REPONSES.pelissierReste });
    }
    if (arrive.nouveauLotCasse) {
      lies.push({ ...ATELIER, heure: "sem. 12", alerte: true, texte: REPONSES.nouveauLotCasse });
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, remboursements du fournisseur compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de non-qualité — remplacements, avoirs, rappels, ventes et clients perdus, moins ce que le fournisseur rembourse — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Retours en panne",
          valeur: retours(t.retoursFinaux),
          aide: `en semaine 13 ; objectif ${OBJECTIF_RETOURS} au plus`,
          tenu: t.retoursFinaux <= OBJECTIF_RETOURS,
        },
        {
          nom: "Clients satisfaits",
          valeur: taux(t.satisfactionMoyenne, 0),
          aide: "en moyenne ; objectif 80 %",
          tenu: t.satisfactionMoyenne >= OBJECTIF_SATISFACTION,
        },
        {
          nom: "Pélissier Construction",
          valeur: t.pelissierPart ? "parti" : "resté",
          aide: t.pelissierPart ? "parti en semaine 7" : "toujours client",
          tenu: !t.pelissierPart,
        },
        {
          nom: "Part payée par Vantrel",
          valeur: taux(t.partFournisseur, 0),
          aide: "des coûts du trimestre ; visé : un tiers",
          tenu: t.partFournisseur >= PART_VISEE,
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
          titre: "Le lot corrigé",
          texte: t.nouveauLotDefectueux
            ? "Le L-2611 avait le même défaut que le L-2607."
            : "Le L-2611 était sain.",
        },
        {
          titre: "Les clients et le fournisseur",
          texte: [
            t.pelissierPart
              ? "Pélissier Construction est parti en semaine 7"
              : "Pélissier Construction est resté",
            t.fournisseurPaie
              ? `Vantrel a pris en charge ${taux(t.partFournisseur, 0)} des coûts du trimestre`
              : "Vantrel n'a rien remboursé",
          ]
            .join(", ")
            .concat("."),
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      let c = 0;
      for (let w = de; w <= a; w += 1) c -= t.semaines[w]!.net;
      return c;
    },
  },
  comportements,
  axe,
};
