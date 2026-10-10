/**
 * ÉPISODE 51 — LE RATIO MATIÈRE QUI DÉRAPE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Nina montre — le ratio de la
 * semaine à côté de celui que la clôture affiche, pour que le faux signal se
 * voie —, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  BUDGET,
  D,
  FACTEUR_STOCK,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  POINTS,
  RATIO_REEL_AOUT,
  SEMAINE_CRITIQUE,
  SEMAINE_CRITIQUE_NOVEMBRE,
  STOCK_FRAIS,
  THEORIQUE,
  carteRejetee,
  evenements,
  hasard,
  rodage,
  simuler,
  succesFormule,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/ratio-matiere";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/ratio-matiere";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const points = (v: number) => `${nombre(v * 100)} pt`;
const NOMS_DES_MOIS: Record<number, string> = {
  8: "août",
  9: "septembre",
  10: "octobre",
  11: "novembre",
};
/** Le vrai ratio d'août, en %, au dixième : la réponse à la prévision. */
const REEL_AOUT = Math.round(RATIO_REEL_AOUT * 1000) / 10;

const ANOUAR = { de: "Anouar Benkirane", role: "Maître d'hôtel" } as const;
const PHILEMON = { de: "Philémon Gruffaz", role: "Second de cuisine" } as const;
const ORLANE = { de: "Orlane Bévillard", role: "Blog culinaire « Lac et Fourchette »" } as const;

/** Les gestes qui traitent une cause à la source : mesurer, la carte, les assiettes, les deux produits, les commandes. */
const causesTraitees = (chemin: readonly number[]) => [
  chemin[D.ratio] === 2,
  chemin[D.carte] === 1 || chemin[D.carte] === 2,
  chemin[D.signatures] === 0,
  chemin[D.fournisseur] === 1,
  chemin[D.novembre] === 0,
];

/** Ce que les décisions révèlent, dans l'ordre où une gérante les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui séparaient la mesure, la poubelle et les assiettes",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    carte: `Votre diagnostic de la semaine 1 était juste : la carte trop longue faisait jeter ${nombre(POINTS.carte * 100)} points de chiffre d'affaires au-delà des pertes normales, la plus grosse part de l'écart aux fiches techniques.`,
    grammages: `En semaine 1, vous avez vu les portions des plats signatures : une vraie cause, mais ${nombre(POINTS.grammages * 100)} point de ratio, quand la carte trop longue en coûtait ${nombre(POINTS.carte * 100)}.`,
    fournisseur: `En semaine 1, vous avez retenu la hausse des Halles : réelle, mais limitée au beurre et au veau, ${nombre(POINTS.hausse * 100)} point sur les ${nombre((RATIO_REEL_AOUT - THEORIQUE) * 100)} d'écart aux fiches techniques.`,
    inventaire: `En semaine 1, vous avez retenu l'erreur d'inventaire : elle gonflait août de 3 points, mais le vrai ratio, ${nombre(REEL_AOUT)} %, restait à ${nombre((RATIO_REEL_AOUT - THEORIQUE) * 100)} points des fiches techniques.`,
  };
  const justes = ["carte", "grammages"];
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
    score: d === "carte" ? 1 : d === "grammages" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n === 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais corrigé le ratio par le prix de la carte ou par le fournisseur : vous avez cherché d'où venait l'écart avant d'agir."
        : `Vous avez corrigé le ratio par le prix de la carte ou par le fournisseur ${n} fois sur ${REFLEXES.length} occasions. Le ratio baisse quand le prix monte ; la marge, non, quand les clients d'ici partent.${
            t.locaux < t.locauxAttendus * 0.95
              ? ` Sur le trimestre, ${nombre(t.locauxAttendus - t.locaux, 0)} couverts de clients d'ici ne sont pas venus.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    REEL_AOUT,
    "de ratio matière réel en août",
    "%",
    { juste: 0.3, proche: 1 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const traitees = causesTraitees(p.chemin).filter(Boolean).length;
  const domaine: Constat = {
    score: traitees / 5,
    texte: `Vous avez traité à la source ${traitees} des cinq causes du trimestre : la mesure, la longueur de la carte, les grammages, les deux produits en hausse, les commandes de novembre. Sur le trimestre, ratio matière réel : ${taux(t.ratio)} ; produits jetés et stock perdu : ${kE(t.pertes)}, soit ${taux(t.pertes / t.caNourriture)} du chiffre d'affaires nourriture.${
      t.negativeRecomptee
        ? ""
        : " La négative du sous-sol n'a jamais été recomptée : la clôture de septembre a affiché un ratio trop beau."
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
      titre: "Recalculer avant de corriger",
      texte: `Rejouez l'épisode en reprenant d'abord l'inventaire et la poubelle : la négative oubliée gonflait août de 3 points, et le vrai ratio, ${nombre(REEL_AOUT)} %, venait d'abord des produits jetés.`,
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Agir sur la cause, pas sur le prix",
      texte:
        "Un ratio qui dérape se corrige là où il dérape : la poubelle, les assiettes, deux produits. Monter la carte fait baisser le ratio et la marge à la fois quand les clients d'ici comptent ; changer de grossiste n'efface pas une hausse qui vient du marché.",
    };
  }
  if (domaine!.score < 0.5) {
    return {
      titre: "Traiter les pertes à la source",
      texte:
        "La plus grosse part de l'écart partait au bac : une carte trop longue, des mises en place faites pour des couverts qui ne viennent pas. Raccourcissez la carte, pesez ce qui est jeté, commandez sur les réservations.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Décomposer l'écart au ratio théorique",
      texte:
        "Entre le ratio des fiches techniques et le ratio réel, chiffrez la part de chaque cause — pertes, grammages, prix d'achat — avant de choisir où mettre l'effort. La plus visible n'est pas la plus lourde.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du ratio",
      texte:
        "Le coût matière consommé, c'est le stock initial plus les achats moins le stock final, tout le stock : (16 800 + 47 320 − 13 160 − 4 200) / 140 000.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_RATIO_MATIERE: Episode<Trimestre> = {
  code: "ratio-matiere",
  numero: 53,
  domaine: "Gestion d'un restaurant",
  titre: "Le ratio matière qui dérape",
  resume:
    "Une table de bistronomie à 36,4 % de ratio matière en fin de saison. Séparer la mesure, les achats, les pertes et les assiettes avant de toucher aux prix.",
  persona:
    "Vous êtes Nina Sabatier, gérante de La Table d'Augustin d'Annecy, le restaurant de bistronomie du Groupe Escale dans la vieille ville : 90 couverts, fermé le dimanche soir et le lundi, un ticket moyen nourriture de 29 € HT. Votre équipe : Séraphin Mermillod, chef de cuisine, une brigade de sept, et une équipe de salle menée par Anouar Benkirane, maître d'hôtel.",
  mandat: [
    { fort: "30 %", texte: "de ratio matière, l'objectif du groupe" },
    { fort: kE(BUDGET), texte: "de marge brute budgétée sur le trimestre" },
    { fort: "Sept. à nov.", texte: "la fin de la saison touristique, puis les clients d'ici" },
    { fort: "1er décembre", texte: "la cuisine ferme dix jours pour changer le piano" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge brute du restaurant : chiffre d'affaires nourriture et boissons moins le coût matière consommé, pertes comprises (produits jetés, stock perdu, remise fournisseur perdue).",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre restaurant",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les commandes de la semaine et la mise en place partent telles quelles : la cuisine continue de jeter.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...PHILEMON,
        alerte: true,
        texte: `Pendant que vous enquêtiez, les commandes de la semaine sont parties comme d'habitude : ${euros(perdu)} de produits jetés en plus.`,
      };
    },
  },
  prevision: {
    libelle: "le ratio matière réel d'août, recalculé, en %",
    unite: "%",
    placeholder: "30,0",
    min: 0,
    max: 60,
    step: 0.1,
    reel: () => REEL_AOUT,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "ratio",
      nom: "Ratio matière de la semaine",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: () => "fiches techniques : 28,5 % ; objectif : 30 %",
    },
    {
      cle: "ratioMois",
      nom: "Ratio du dernier mois clôturé",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: (_, l) => `clôture de ${NOMS_DES_MOIS[l.mois ?? 8]}, par la comptabilité`,
    },
    {
      cle: "couverts",
      nom: "Couverts de la semaine",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `dont ${taux(l.partLocaux ?? 0, 0)} de clients d'ici`
          : "moyenne d'une semaine d'août",
    },
    {
      cle: "ticket",
      nom: "Ticket moyen nourriture",
      format: (v) => `${nombre(v, 2)} € HT`,
      sensBon: 1,
      aide: () => "formules comprises",
    },
    {
      cle: "marge",
      nom: "Marge brute cumulée",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} budgétés pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    const carte = decisions[D.carte] ?? NEUTRE[D.carte];
    return {
      ratio: taux(l.ratio ?? 0),
      ratioMois: taux(l.ratioMois ?? 0),
      ratioMoisReel: taux(l.ratioMoisReel ?? 0),
      ratioMoisBeau: (l.ratioMois ?? 1) < 0.32,
      ecartMois: Math.abs((l.ratioMois ?? 0) - (l.ratioMoisReel ?? 0)) > 0.002,
      couverts: nombre(l.couverts ?? 0, 0),
      pertes: euros(l.pertes ?? 0),
      pese: decisions[D.ratio] === 2,
      stockFrais: euros(STOCK_FRAIS * FACTEUR_STOCK[carte]!),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Ratio matière, sem. ${a}`, taux(t.semaines[a]!.ratio)],
      [
        "Couverts de la période",
        nombre(
          semaines.reduce((x, w) => x + w.couverts, 0),
          0,
        ),
      ],
      ["Marge brute de la période", kE(semaines.reduce((x, w) => x + w.marge, 0))],
    ];
  },
  courbe: {
    titre: "Ratio matière, semaine par semaine",
    cle: "ratio",
    cible: 0.3,
    libelleCible: "objectif du groupe : 30 %",
    graduations: [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6],
    format: (v) => taux(v, 0),
    details: (s) => [
      `ratio ${taux(s.ratio!)} · ${nombre(s.couverts!, 0)} couverts`,
      `jeté ${euros(s.pertes!)} · ticket ${nombre(s.ticket!, 2)} € HT`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.carte && choix === 1) {
      const rejet = carteRejetee(graine);
      return [
        {
          ...ANOUAR,
          alerte: rejet,
          texte: rejet ? REPONSES.carteRejetee : REPONSES.carteAcceptee,
        },
      ];
    }
    if (etape === D.fournisseur && choix === 0) {
      const lourd = rodage(graine) > 1;
      return [
        {
          ...PHILEMON,
          alerte: lourd,
          texte: lourd ? REPONSES.rodageLourd : REPONSES.rodageLeger,
        },
      ];
    }
    if (etape === D.novembre && choix === 1) {
      return [
        {
          ...ANOUAR,
          texte: succesFormule(graine) >= 0.9 ? REPONSES.formuleSucces : REPONSES.formuleTiede,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.critique) {
      lies.push({
        ...ORLANE,
        heure: `sem. ${SEMAINE_CRITIQUE}`,
        alerte: true,
        texte: REPONSES.critique,
      });
    }
    if (arrive.negativePerdue) {
      lies.push({ ...PHILEMON, heure: "sem. 7", alerte: true, texte: REPONSES.negativePerdue });
    }
    if (arrive.critiqueNovembre) {
      lies.push({
        ...ORLANE,
        heure: `sem. ${SEMAINE_CRITIQUE_NOVEMBRE}`,
        alerte: true,
        texte: REPONSES.critiqueNovembre,
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
    titre: (t) => `${kE(t.objectif)} de marge brute, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge brute du restaurant sur le trimestre, produits jetés, stock perdu et remise fournisseur perdue compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const novembre = t.reels[2]!;
      const gardes = t.locaux / t.locauxAttendus;
      const jete = t.pertes / t.caNourriture;
      return [
        {
          nom: "Ratio de novembre",
          valeur: taux(novembre),
          aide: `réel ; objectif 30 % ; sur le trimestre : ${taux(t.ratio)}`,
          tenu: novembre <= 0.31,
        },
        {
          nom: "Marge brute",
          valeur: kE(t.objectif),
          aide: `budget à 30 % de ratio : ${kE(BUDGET)}`,
          tenu: t.objectif >= 0.97 * BUDGET,
        },
        {
          nom: "Clients d'ici",
          valeur: taux(gardes, 0),
          aide: "des couverts locaux d'une saison sans changement de prix ni de carte",
          tenu: gardes >= 0.97,
        },
        {
          nom: "Produits jetés",
          valeur: kE(t.pertes),
          aide: `${taux(jete)} du chiffre d'affaires nourriture ; une cuisine bien tenue : moins de 2,5 %`,
          tenu: jete <= 0.025,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.critique || t.critiqueNovembre
          ? [
              {
                titre: "Le blog « Lac et Fourchette »",
                texte: [
                  t.critique ? "a relevé la hausse de septembre en semaine 6" : null,
                  t.critiqueNovembre ? "a relevé la hausse de novembre en semaine 11" : null,
                ]
                  .filter(Boolean)
                  .join(", puis ")
                  .concat(" : des habitués sont allés voir ailleurs."),
              },
            ]
          : []),
        ...(t.rodage !== null
          ? [
              {
                titre: "Maison Vallorin",
                texte:
                  t.rodage > 1
                    ? "a eu un rodage difficile : livraisons tardives, ruptures et dépannages au prix fort pendant trois semaines."
                    : "s'est calée assez vite, mais la remise de fin d'année des Halles est perdue.",
              },
            ]
          : []),
        ...(t.formule !== null
          ? [
              {
                titre: "La formule du midi",
                texte:
                  t.formule >= 0.9
                    ? "a trouvé ses clients : des bureaux du quartier qu'on ne voyait pas."
                    : "a surtout servi des habitués qui prenaient la carte, à moindre prix.",
              },
            ]
          : []),
        {
          titre: "La cuisine",
          texte: [
            t.negativeRecomptee
              ? "la négative du sous-sol a été recomptée en semaine 1"
              : "la négative du sous-sol, oubliée, a perdu 1 500 € de produits",
            t.carteRejetee ? "des habitués ont réclamé un plat retiré de la carte" : null,
            `la fermeture pour travaux a coûté ${euros(t.stockPerdu)} de stock frais`,
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
