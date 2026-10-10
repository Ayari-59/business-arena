/**
 * ÉPISODE 60 — LA RÉNOVATION SANS FERMER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de L'Escale Chambéry-Gare montre,
 * ce que la courbe trace, ce sur quoi le bilan juge Ana, et ce que ses
 * décisions révèlent d'elle.
 *
 * Le tableau de bord montre ce qu'une directrice d'hôtel regarde chaque
 * lundi — RevPAR, taux d'occupation, note des plateformes, chambres livrées,
 * gestes et surcoûts — et le bilan, ce que la direction juge : le chiffre
 * d'affaires hébergement de l'été, moins ce que le chantier a coûté à côté,
 * plus ce qu'il laisse pour la rentrée.
 */
import {
  A_RENOVER,
  BUDGET,
  CHAMBRES,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  NOTE_DEPART,
  O,
  PERTE_CIMALP,
  PERTE_DEUX_ETAGES_AOUT,
  PERTE_PAR_JOUR,
  SCENARIOS,
  SEMAINES,
  evenements,
  hasard,
  renfortDisponible,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/renovation-sans-fermer";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  ROLES,
} from "@/config/episodes/renovation-sans-fermer";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** La perte que la prévision de la semaine 1 demande, en k€. */
export const PERTE_EN_KE = PERTE_DEUX_ETAGES_AOUT / 1000;
/** Les gestes et pénalités que la direction tolère sur l'été. */
export const PLAFOND_GESTES = 10000;
/** La note des plateformes en dessous de laquelle les comptes d'affaires regardent ailleurs. */
export const NOTE_PLANCHER = 8.1;

const sur10 = (v: number) => `${nombre(v, 1)} / 10`;
const jours = (semaines: number) => `${nombre(Math.max(1, Math.round(semaines * 7)), 0)} jours`;
/** La semaine de fin d'un chantier qui s'achève au début de la semaine `fin`. */
const semaineDeFin = (fin: number) => Math.max(1, Math.ceil(fin - 1 - 1e-9));

/** Ce que les décisions révèlent, dans l'ordre où une directrice d'hôtel les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les prévisions nuit par nuit et les cadences de l'entreprise",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    nuisances:
      "Votre diagnostic de la semaine 1 était juste : le chantier coûtait surtout par les clients logés à côté, d'abord les clients d'affaires, bien plus que par les chambres fermées.",
    delai:
      "En semaine 1, vous avez vu le risque de délai : il est réel, mais c'est à côté du chantier que l'été se perdait, en remises, en plaintes, en note et en comptes d'affaires usés.",
    chambres:
      "En semaine 1, vous avez compté les chambres fermées : en août, l'hôtel n'aurait pas rempli les étages fermés, sauf le samedi. Ce sont les clients logés à côté du chantier qui coûtaient.",
    prix: "En semaine 1, vous avez cru qu'il fallait baisser les prix : les clients ne fuyaient pas l'hôtel, ils fuyaient le bruit, et une remise générale paie aussi ceux que le chantier ne gêne pas.",
  };
  const justes = ["nuisances", "delai"];
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
    score: d === "nuisances" ? 1 : d === "delai" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé au réflexe de « ne perdre aucune nuit » : vous avez compté les clients exposés au chantier, pas seulement les chambres fermées, et vous avez cru le pointage plutôt que les promesses."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions le réflexe du métier : garder tout ouvert, taire le chantier ou le payer en remises, remplir comme d'habitude, croire l'entreprise sur parole. Sur l'été, ${taux(t.partExposee, 0)} des nuitées vendues l'ont été à côté du chantier.`,
  };

  const calibrage = constatCalibrage(
    p,
    PERTE_EN_KE,
    "de chiffre d'affaires perdu en fermant deux étages pendant les quatre semaines d'août",
    "k€",
    { juste: 0.5, proche: 2 },
    (e) => `${nombre(e)} k€`,
  );

  const leviers = [
    p.chemin[D.phasage] === O.phasage.creux,
    p.chemin[D.clients] === O.clients.prevenir,
    p.chemin[D.occupation] === O.occupation.plan,
    p.chemin[D.suivi] === O.suivi.pointage &&
      (p.chemin[D.retard] === O.retard.rattraper || p.chemin[D.retard] === O.retard.cadence),
  ].filter(Boolean).length;
  const fin = t.debord > 0 ? `en débordant de ${jours(t.debord)} sur septembre` : "à temps";
  const chantier: Constat = {
    score: leviers === 4 ? 1 : leviers >= 2 ? 0.6 : 0,
    texte:
      leviers === 4
        ? `Vous avez regroupé le chantier dans le creux, isolé les clients, prévenu avant les plaintes et suivi l'avancement assez finement pour rattraper à temps. Le chantier a fini ${fin}, la note est restée à ${sur10(t.noteFinale)}.`
        : `Sur les quatre leviers d'un chantier en exploitation (regrouper dans le creux, prévenir avant les plaintes, isoler les clients, suivre l'avancement pour décider vite), vous en avez tenu ${leviers}. Le chantier a fini ${fin}, la note est à ${sur10(t.noteFinale)}.`,
  };

  return [information, diagnostic, reflexe, calibrage, chantier];
}

export function axe([information, diagnostic, reflexe, calibrage, chantier]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder les nuits, pas le mois",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les prévisions nuit par nuit et les cadences de l'entreprise : une chambre fermée ne coûte que les soirs où l'hôtel aurait été plein, et un chantier morcelé finit en retard.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Compter les clients exposés, pas seulement les chambres fermées",
      texte:
        "Garder tout ouvert pour ne perdre aucune nuit expose presque tous les clients pendant tout l'été. Chiffrez ce que coûte un client logé à côté du chantier, en remise, en geste, en note et en compte d'affaires, avant de chiffrer une chambre fermée.",
    };
  }
  if (chantier!.score === 0) {
    return {
      titre: "Regrouper, isoler, prévenir, suivre",
      texte:
        "Un chantier en exploitation se gagne sur quatre gestes : le placer quand l'hôtel est à moitié vide, loger les clients loin du bruit, prévenir avant qu'ils ne découvrent le chantier, et mesurer l'avancement pour rattraper tant qu'il est temps.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que le chantier coûte vraiment",
      texte:
        "Avant de planifier des travaux dans un hôtel ouvert, demandez-vous qui les subira : les chambres fermées se chiffrent tout de suite, les clients gênés se paient pendant des mois.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Faites le calcul nuit par nuit : seules les nuits où la demande dépasse les chambres restantes sont perdues. Notez vos prévisions et comparez-les au réalisé.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_RENOVATION: Episode<Trimestre> = {
  code: "renovation-sans-fermer",
  numero: 57,
  domaine: "Travaux en exploitation",
  titre: "La rénovation sans fermer",
  resume:
    "Trois étages à rénover avant la rentrée dans un hôtel d'affaires ouvert tout l'été. Les nuisances coûtent plus que les chambres qu'on ferme.",
  persona:
    "Vous êtes Ana Sousa, directrice de L'Escale Chambéry-Gare, l'hôtel 3 étoiles du Groupe Escale face à la gare : 72 chambres sur quatre étages, pleines de clients d'affaires du lundi au jeudi. Le conseil a voté la rénovation des étages 1 à 3, 54 chambres, à finir avant la rentrée. Votre trimestre : juin, encore plein d'affaires, puis juillet et août, le creux, où viennent des touristes de passage et des groupes.",
  mandat: [
    { fort: `${A_RENOVER} chambres`, texte: "à rénover avant le 31 août" },
    { fort: kE(BUDGET), texte: "de chiffre d'affaires hébergement sans travaux, de juin à août" },
    { fort: sur10(NOTE_DEPART), texte: "de note sur Bookalia et Voyagio avant le chantier" },
    { fort: kE(PERTE_CIMALP), texte: "en jeu à la rentrée avec Cimalp, votre premier compte" },
  ],
  jugement:
    "Le siège juge le trimestre sur le chiffre d'affaires hébergement de juin à août, moins les gestes commerciaux, les clients délogés et le surcoût de chantier, plus l'effet attendu sur la clientèle d'affaires de la rentrée : septembre perdu si le chantier déborde, note des plateformes, comptes d'affaires usés, contrat de Cimalp.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre hôtel",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'entreprise de travaux, qui a réservé ses équipes, facture leur immobilisation.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ROLES.brice,
        alerte: true,
        texte: `Madame Sousa, mes équipes attendent votre feu vert depuis lundi. Je vais devoir vous facturer leur immobilisation : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le chiffre d'affaires hébergement perdu si l'on ferme deux étages (36 chambres) pendant les quatre semaines d'août, en milliers d'euros",
    unite: "k€",
    placeholder: "50",
    min: 0,
    max: 300,
    step: 0.1,
    reel: () => PERTE_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "revpar",
      nom: "RevPAR de la semaine",
      format: euros,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "chiffre d'affaires hébergement par chambre disponible"
          : "dernière semaine de mai",
    },
    {
      cle: "to",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `sur les ${CHAMBRES} chambres, chantier compris`,
    },
    {
      cle: "note",
      nom: "Note Bookalia",
      format: sur10,
      formatEcart: (v) => nombre(v, 2),
      sensBon: 1,
      aide: () => `avant le chantier : ${sur10(NOTE_DEPART)}`,
    },
    {
      cle: "livrees",
      nom: "Chambres rénovées livrées",
      format: (v) => `${nombre(v, 0)} sur ${A_RENOVER}`,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `prévu à date : ${nombre(l.livreesPrevues ?? 0, 0)}`
          : "le chantier n'a pas commencé",
      jauge: (l) =>
        (l.livreesPrevues ?? 0) > 0 || (l.livrees ?? 0) > 0
          ? {
              part: Math.min(1, (l.livrees ?? 0) / A_RENOVER),
              enRetard: (l.livrees ?? 0) < (l.livreesPrevues ?? 0),
            }
          : null,
    },
    {
      cle: "couts",
      nom: "Gestes, pénalités et surcoûts",
      format: kE,
      sensBon: -1,
      aide: (semaine) => (semaine ? "cumulés depuis juin" : "rien d'engagé"),
    },
  ],
  contexte(l, decisions): Contexte {
    const phasage = decisions[D.phasage] ?? NEUTRE[D.phasage];
    const debord = l.debord ?? 0;
    return {
      travauxEnJuin: phasage === O.phasage.lots || phasage === O.phasage.etageParEtage,
      creux: phasage === O.phasage.creux,
      fermeture: phasage === O.phasage.fermer,
      exposees: taux(l.exposees ?? 0, 0),
      plaintes: nombre(Math.max(1, Math.round(l.plaintes ?? 0)), 0),
      livrees: nombre(l.livrees ?? 0, 0),
      retardVu: jours(l.retardVu ?? 0),
      pointage: decisions[D.suivi] === O.suivi.pointage,
      tournee: decisions[D.suivi] === O.suivi.tournee,
      cimalpExposes: taux(l.cimalpExposes ?? 0, 0),
      cimalpGene: (l.cimalpExposes ?? 0) > 0.1,
      debord: debord > 0.15,
      debordJours: nombre(Math.round(debord * 7), 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ca = semaines.reduce((x, w) => x + w.ca, 0);
    const nuits = semaines.reduce((x, w) => x + w.nuitees, 0);
    const exposees = semaines.reduce((x, w) => x + w.exposees, 0);
    return [
      ["Chiffre d'affaires de la période", kE(ca)],
      ["Nuitées voisines du chantier", taux(nuits > 0 ? exposees / nuits : 0, 0)],
      [`Chambres livrées, sem. ${a}`, `${t.semaines[a]!.livrees} sur ${A_RENOVER}`],
    ];
  },
  courbe: {
    titre: "Chiffre d'affaires hébergement, semaine par semaine",
    cle: "ca",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget sans travaux : ${kE(BUDGET / SEMAINES)} par semaine en moyenne`,
    graduations: [0, 10000, 20000, 30000, 40000, 50000],
    format: kE,
    details: (s) => [
      `${kE(s.ca!)} · occupation ${taux(s.to!, 0)} · RevPAR ${euros(s.revpar!)}`,
      `${taux(s.nuitees! > 0 ? s.exposees! / s.nuitees! : 0, 0)} des nuitées voisines du chantier · note ${sur10(s.note!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.retard && choix === O.retard.rattraper) {
      // Seul le choix de rattraper compte : une équipe est libre en août selon le hasard du trimestre.
      return [
        {
          ...ROLES.brice,
          texte: renfortDisponible(graine) ? REPONSES.renfort : REPONSES.samedis,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.trimestre;
    const lies: Message[] = [];
    if (arrive.avisViral) {
      lies.push({ ...ROLES.lucile, heure: "sem. 5", alerte: true, texte: REPONSES.avis });
    }
    if (arrive.finDuTrimestre) {
      lies.push({
        ...ROLES.brice,
        heure: "sem. 13",
        alerte: t.debord > 0,
        texte:
          t.debord > 0
            ? `Il nous reste environ ${jours(t.debord)} de travaux : on finira en septembre. ${
                chemin[D.retard] === O.retard.decaler
                  ? "Les chambres concernées sont déjà fermées à la vente."
                  : "Votre réception va devoir reloger les clients déjà réservés sur ces chambres."
              }`
            : `Les ${A_RENOVER} chambres sont livrées, réserves levées, en semaine ${semaineDeFin(t.finChantier)}. Bonne rentrée !`,
      });
      lies.push({
        ...ROLES.yse,
        heure: "sem. 13",
        alerte: t.cimalpPart,
        texte: t.cimalpPart ? REPONSES.cimalpPart : REPONSES.cimalpReste,
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
    titre: (t) => `${kE(t.objectif)} de chiffre d'affaires net, rentrée comprise`,
    formatObjectif: kE,
    noteDesBarres:
      "Chiffre d'affaires hébergement de juin à août, moins gestes, clients délogés et surcoûts de chantier, plus l'effet attendu sur la rentrée, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Chantier fini",
          valeur:
            t.debord > 0
              ? `${jours(t.debord)} en septembre`
              : `semaine ${semaineDeFin(t.finChantier)}`,
          aide: "avant la rentrée du 31 août",
          tenu: t.debord <= 0,
        },
        {
          nom: "Note Bookalia",
          valeur: sur10(t.noteFinale),
          aide: `fin août ; ${sur10(NOTE_DEPART)} avant le chantier, plancher ${sur10(NOTE_PLANCHER)}`,
          tenu: t.noteFinale >= NOTE_PLANCHER,
        },
        {
          nom: "Cimalp",
          valeur: t.cimalpPart ? "part à l'Orméa" : "renouvelle",
          aide: `contrat d'automne, ${kE(PERTE_CIMALP)} en jeu`,
          tenu: !t.cimalpPart,
        },
        {
          nom: "Gestes et clients délogés",
          valeur: kE(t.gestes + t.penalites),
          aide: `sur l'été et la rentrée ; plafond ${kE(PLAFOND_GESTES)}`,
          tenu: t.gestes + t.penalites <= PLAFOND_GESTES,
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
          titre: "L'été",
          texte: `${SCENARIOS[t.scenario]!.nom} pour les touristes et les groupes.`,
        },
        {
          titre: "L'entreprise",
          texte: [
            t.retardBrut > 0.05
              ? `a pris ${jours(t.retardBrut)} de retard sur votre phasage, dont ${jours(t.retardVu)} visibles en semaine 8`
              : "n'a presque pas pris de retard",
            t.renfort === null
              ? null
              : t.renfort
                ? "une équipe de renfort était libre en août"
                : "aucune équipe de renfort n'était libre en août",
          ]
            .filter(Boolean)
            .join(" ; ")
            .concat("."),
        },
        {
          titre: "Les clients",
          texte: `${t.avisViral ? "Un avis sur le marteau-piqueur a fait le tour des plateformes. " : ""}Cimalp avait ${taux(t.risqueCimalp, 0)} de chances de partir à l'Orméa ; ${
            t.cimalpPart ? "il est parti." : "il est resté."
          }`,
        },
      ];
    },
  },
  comportements,
  axe,
};
