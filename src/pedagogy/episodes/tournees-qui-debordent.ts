/**
 * ÉPISODE 21 — LES TOURNÉES QUI DÉBORDENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Farid montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 *
 * Deux contournements du contrat `Episode`, comme dans le budget, le projet et le quai :
 * `lire` renvoie des clés que le tableau de bord n'affiche pas (les livraisons
 * sous-traitées, les livraisons ratées, le départ du grand compte) pour
 * nourrir les messages et les sources ; et ce qui arrive selon les choix
 * antérieurs (le départ de Dumontel, l'accident) passe par `evenements().lies`.
 */
import {
  BUDGET,
  BUDGET_PAR_LIVRAISON,
  CHAUFFEURS,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_RETARD,
  PERTE_PAR_JOUR,
  PLAFOND_HEURES_SUP,
  TOURNEES_PAR_CAMION,
  ARRETS_POSSIBLES,
  evenements,
  hasard,
  prelivraisonAcceptee,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/tournees-qui-debordent";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/tournees-qui-debordent";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
const arrets = (v: number) => nombre(v, 1);
/** Un écart au budget : positif, la région est restée en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget logistique` : `${kE(-v)} au-delà du budget logistique`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'analyse des tournées et celle des retards",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    creneaux:
      "Votre diagnostic de la semaine 1 était juste : les heures promises à presque tous les clients faisaient zigzaguer les tournées, cinq arrêts au lieu de sept, et une partie des promesses était intenable dès la commande.",
    soustraitance:
      "En semaine 1, vous avez vu la sous-traitance : un vrai coût, mais une conséquence. Brunelière portait le volume que des tournées à moitié pleines ne livraient plus.",
    flotte:
      "En semaine 1, vous avez retenu une flotte trop petite ; avec des créneaux à la demi-journée, les huit camions livraient le volume courant.",
    chauffeurs:
      "En semaine 1, vous avez retenu la productivité des chauffeurs ; ils roulaient 148 km par jour pour tenir des heures que personne n'avait coordonnées.",
  };
  const justes = ["creneaux", "soustraitance"];
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
    score: d === "creneaux" ? 1 : d === "soustraitance" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu au débordement en achetant de la capacité ou en laissant tout promettre : vous avez rempli les tournées avant d'en ajouter."
        : `Face au débordement, vous avez choisi ${n} fois un camion, des heures, des intérimaires ou des promesses sans limite. La capacité achetée coûtait plus que celle qu'on pouvait organiser.${
            t.semaineAccident
              ? ` Un chauffeur épuisé a eu un accident en semaine ${t.semaineAccident}.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.retard * 100,
    "de livraisons en retard en semaine 3",
    "%",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const creneaux = p.chemin[D.tournees] === 1 || p.chemin[D.fin] === 1;
  const regroupe = p.chemin[D.regroupement] === 1 || p.chemin[D.regroupement] === 2;
  const pics = p.chemin[D.soustraitant] === 1;
  const points = (creneaux ? 1 : 0) + (regroupe ? 1 : 0) + (pics ? 1 : 0);
  const tournees: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : points === 1 ? 0.3 : 0,
    texte: [
      creneaux
        ? "Vous avez décidé des créneaux avec les commerciaux au lieu de les subir."
        : "Les heures de livraison sont restées celles que les commerciaux promettaient.",
      regroupe
        ? "Vous avez regroupé les petites livraisons."
        : "Les petites livraisons ont continué de remplir les tournées.",
      pics
        ? "Et vous avez réservé le sous-traitant aux pics."
        : "Et le sous-traitant a gardé un volume permanent.",
    ].join(" "),
  };

  return [information, diagnostic, reflexe, calibrage, tournees];
}

export function axe([information, diagnostic, reflexe, calibrage, tournees]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Analyser les tournées avant d'acheter des camions",
      texte:
        "Rejouez l'épisode en regardant d'abord les tournées et les retards : 5,4 arrêts par tournée au lieu de 7,2, et six retards sur dix promis intenables dès la commande.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Organiser la capacité avant de l'acheter",
      texte:
        "Un arrêt de plus dans une tournée coûte une dizaine d'euros ; une livraison sous-traitée en coûte cent, un camion loué trois mille par semaine. Remplissez les tournées d'abord, et gardez le sous-traitant pour les pics.",
    };
  }
  if (tournees!.score === 0) {
    return {
      titre: "Décider des créneaux avec les commerciaux",
      texte:
        "La tournée se fait au bureau, pas sur la route : des heures promises sans coordination cassent l'optimisation. Des créneaux réalistes et des livraisons regroupées valent plus qu'un camion.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait le coût d'une livraison",
      texte:
        "Le coût d'une livraison, c'est le coût d'une tournée divisé par ses arrêts. Avant de regarder la flotte ou les chauffeurs, regardez qui décide des heures et combien d'arrêts elles laissent.",
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
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Un pic modéré ou des chantiers qui acceptent d'être livrés en avance peuvent flatter un trimestre : si le résultat tient, votre méthode tient.",
  };
}

const AWA = { de: "Awa Kouyaté", role: "Planificatrice transport" } as const;
const DUMONTEL = {
  de: "Yohann Mercadier",
  role: "Conducteur de travaux, Dumontel Bâtiment",
} as const;

export const EPISODE_TRANSPORT: Episode<Trimestre> = {
  code: "tournees-qui-debordent",
  numero: 17,
  domaine: "Transport et livraisons",
  titre: "Les tournées qui débordent",
  resume:
    "Des livraisons sur chantier en retard, un coût par livraison qui monte, des chauffeurs en heures supplémentaires et un sous-traitant qui augmente. Remplir les tournées avant d'acheter des camions.",
  persona:
    "Vous êtes Farid Bensaïd, responsable transport d'Arvel Distribution pour la région lyonnaise, au dépôt de Corbas. Votre équipe : huit chauffeurs salariés et leurs porteurs équipés d'une grue, une planificatrice, et un transporteur sous-traitant, Transports Brunelière, pour ce que la flotte ne livre pas.",
  mandat: [
    { fort: taux(OBJECTIF_RETARD, 0), texte: "de livraisons en retard, au plus" },
    { fort: euros(BUDGET_PAR_LIVRAISON), texte: "de coût logistique par livraison" },
    { fort: kE(BUDGET), texte: "de budget logistique, retards et clients perdus compris" },
    {
      fort: heures(PLAFOND_HEURES_SUP),
      texte: "d'heures supplémentaires sur le trimestre, au plus",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget logistique de la région, en comptant ce que coûtent les retards, les livraisons ratées, les chantiers arrêtés et les clients perdus.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre transport",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les tournées de la semaine partent sans avoir été revues.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...AWA,
        alerte: true,
        texte: `Pendant ce temps, les tournées sont parties telles quelles : des livraisons ratées de plus, et deux chantiers qui ont attendu leur grue. ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "la part des livraisons en retard en semaine 3, en %",
    unite: "%",
    placeholder: "12",
    min: 0,
    max: 60,
    step: 0.5,
    reel: (t) => t.semaines[3]!.retard * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "retard",
      nom: "Livraisons en retard",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `objectif : ${taux(OBJECTIF_RETARD, 0)} au plus`,
    },
    {
      cle: "coutLivraison",
      nom: "Coût par livraison",
      format: euros,
      sensBon: -1,
      aide: () => `budget : ${euros(BUDGET_PAR_LIVRAISON)}`,
    },
    {
      cle: "arrets",
      nom: "Arrêts par tournée",
      format: arrets,
      sensBon: 1,
      aide: () => `il y a deux ans : ${arrets(ARRETS_POSSIBLES)}`,
    },
    {
      cle: "heuresSup",
      nom: "Heures supplémentaires",
      format: heures,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? "des chauffeurs, dans la semaine" : "des chauffeurs, la semaine dernière",
    },
    {
      cle: "cout",
      nom: "Coût logistique et pertes",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} de budget`
          : `${kE(BUDGET)} de budget pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.cout ?? 0) / BUDGET),
              enRetard: (l.cout ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    const a = l.arrets ?? 0;
    return {
      retard: taux(l.retard ?? 0, 0),
      arrets: arrets(a),
      capacite: nombre(Math.round((CHAUFFEURS * TOURNEES_PAR_CAMION * a) / 5) * 5, 0),
      sousTraitees: nombre(l.sousTraitees ?? 0, 0),
      heuresSup: nombre(l.heuresSup ?? 0, 0),
      ratees: nombre(l.ratees ?? 0, 0),
      coutLivraison: euros(l.coutLivraison ?? 0),
      tourneesRevues: decisions[D.tournees] === 1,
      grandCompte: (l.grandCompte ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`Retards, sem. ${a}`, taux(t.semaines[a]!.retard, 0)],
      [`Coût par livraison, sem. ${a}`, euros(t.semaines[a]!.coutLivraison)],
      ["Coût de la période, pertes comprises", kE(cout)],
    ];
  },
  courbe: {
    titre: "Livraisons en retard, semaine par semaine",
    cle: "retard",
    cible: OBJECTIF_RETARD,
    libelleCible: `objectif : ${taux(OBJECTIF_RETARD, 0)} au plus`,
    graduations: [0.1, 0.2, 0.3, 0.4],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.retard!, 0)} en retard · ${nombre(s.ratees!, 0)} livraisons à refaire`,
      `${arrets(s.arrets!)} arrêts par tournée · ${heures(s.heuresSup!)} sup.`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.pic && choix === 2) {
      // Seul le choix de demander compte : les chantiers répondent selon le hasard du trimestre.
      const accepte = prelivraisonAcceptee([...NEUTRE.slice(0, D.pic), 2], graine);
      return [
        {
          de: "Hubert Lhermet",
          role: "Directeur commercial",
          texte: accepte ? REPONSES.prelivraisonAcceptee : REPONSES.prelivraisonRefusee,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    const dans = (w: number) => w >= de && w <= a;
    if (chemin[D.tournees] === 1 && dans(3)) {
      lies.push({
        ...AWA,
        heure: "sem. 3",
        texte: `Première semaine complète avec les créneaux à la demi-journée : ${arrets(t.semaines[3]!.arrets)} arrêts par tournée, et une quarantaine de kilomètres de moins par camion et par jour.`,
      });
    }
    if (chemin[D.soustraitant] === 2 && dans(5)) {
      lies.push({
        ...AWA,
        heure: "sem. 5",
        texte:
          "Ibrahima a pris le camion loué lundi. Bon chauffeur, mais il découvre les chantiers : je lui donne l'est lyonnais, le plus simple.",
      });
    }
    if (arrive.grandComptePart) {
      lies.push({
        ...DUMONTEL,
        heure: "sem. 7",
        alerte: true,
        texte:
          "Monsieur Bensaïd, notre direction a tranché : à partir de lundi, nos chantiers sont livrés par un concurrent. Trop de retards, trop de chantiers arrêtés, encore ce trimestre.",
      });
    } else if (arrive.grandCompteReste) {
      lies.push({
        ...DUMONTEL,
        heure: "sem. 7",
        texte:
          "Notre direction a hésité à changer de négoce. On reste chez vous pour l'instant, mais elle regarde chaque livraison en retard.",
      });
    }
    if (arrive.accident) {
      lies.push({
        de: "Solène Marquant",
        role: "Directrice logistique régionale",
        heure: `sem. ${arrive.accident}`,
        alerte: true,
        texte:
          "Mathéo Javaux a heurté une voiture à un rond-point de Bron, en fin de tournée, après onze heures de route. Personne n'est gravement blessé. Le camion est au garage, Mathéo en arrêt trois semaines ; franchise et réparations : 6 000 €.",
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget logistique de la région, retards, livraisons ratées, chantiers arrêtés et clients perdus compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const fin = t.semaines[13]!;
      return [
        {
          nom: "Livraisons en retard",
          valeur: taux(fin.retard),
          aide: `en semaine 13 ; objectif ${taux(OBJECTIF_RETARD, 0)}`,
          tenu: fin.retard <= OBJECTIF_RETARD,
        },
        {
          nom: "Coût par livraison",
          valeur: euros(t.coutParLivraison),
          aide: `sur le trimestre ; budget ${euros(BUDGET_PAR_LIVRAISON)}`,
          tenu: t.coutParLivraison <= BUDGET_PAR_LIVRAISON,
        },
        {
          nom: "Heures supplémentaires",
          valeur: heures(t.heuresSupTotal),
          aide: `sur le trimestre ; plafond ${heures(PLAFOND_HEURES_SUP)}`,
          tenu: t.heuresSupTotal <= PLAFOND_HEURES_SUP,
        },
        {
          nom: "Accident",
          valeur: t.semaineAccident ? `semaine ${t.semaineAccident}` : "aucun",
          aide: t.semaineAccident ? "un chauffeur après onze heures de route" : "sur le trimestre",
          tenu: !t.semaineAccident,
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
          titre: "Le pic de printemps",
          texte: `a fait ${taux(t.pic, 0)} de livraisons en plus, semaines 8 à 10${
            t.prelivraisonAcceptee
              ? ", et les grands chantiers ont accepté d'être livrés en avance"
              : ""
          }.`,
        },
        {
          titre: "Les chauffeurs et les clients",
          texte: [
            t.semaineAccident
              ? `Mathéo a eu un accident en semaine ${t.semaineAccident}`
              : "Aucun accident",
            t.grandComptePart
              ? "Dumontel Bâtiment est parti chez un concurrent en semaine 7"
              : "Dumontel Bâtiment est resté",
          ]
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
