/**
 * ÉPISODE 13 — LA PANNE QUI PARALYSE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Céline montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle. La leçon tient en trois réflexes à ne pas suivre — aller
 * vite, payer, se taire — et en une méthode : une cellule de crise, un mode
 * dégradé priorisé, un redémarrage nettoyé par étapes, une parole régulière
 * aux clients, des équipes ménagées pour durer.
 */
import {
  AGENCES,
  CIBLE_ACTIVITE,
  CONFIANCE_DEPART,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAFOND,
  evenements,
  hasard,
  redemarrage,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/panne-qui-paralyse";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/panne-qui-paralyse";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** La confiance des clients en dessous de laquelle le trimestre suivant commence mal. */
const CONFIANCE_TENUE = 65;
/** La fatigue au-delà de laquelle les équipes ne tiennent plus que par habitude. */
const FATIGUE_TENUE = 0.6;
/** La semaine avant laquelle un redémarrage propre est un bon redémarrage. */
const RETABLI_TENU = 6;

const pourcent = (v: number) => taux(v, 0);
const points = (v: number) => `${nombre(v * 100)} pt`;
const indice = (v: number) => nombre(v, 0);
const fatigue = (v: number) => `${nombre(v * 100, 0)} / 100`;
/** L'impact du trimestre, rapporté au plafond accepté par la direction générale. */
const impact = (v: number) =>
  -v <= PLAFOND
    ? `${kE(-v)} d'impact, dans le plafond de ${kE(PLAFOND)}`
    : `${kE(-v)} d'impact, ${kE(-v - PLAFOND)} au-delà du plafond`;

/** Ce que les décisions révèlent, dans l'ordre où une directrice les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient que la panne durerait des semaines et que les agences savaient servir sans le système",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    duree:
      "Votre diagnostic de la semaine 1 était juste : la panne durerait des semaines, et tout se jouait sur ce que les agences sauraient servir sans le système.",
    redemarrage:
      "En semaine 1, vous avez vu le redémarrage : une vraie question, mais qui se tranchait en semaine 2. D'ici là, et bien après, c'est le mode dégradé qui portait l'activité.",
    informatique:
      "En semaine 1, vous avez fait de la panne une affaire d'informatique ; les agences qui attendaient son feu vert ont servi moins d'un tiers de leurs clients.",
    fideles:
      "En semaine 1, vous avez compté sur la fidélité des artisans ; ceux qu'on ne servait pas sont allés chez le concurrent dès le premier matin.",
  };
  const justes = ["duree", "redemarrage"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En fin de semaine 1, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En fin de semaine 1, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En fin de semaine 1, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "duree" ? 1 : d === "redemarrage" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé au réflexe de la crise : ni tout relancer au plus vite, ni payer, ni rassurer sans savoir, ni vous taire."
        : `Sous la pression, vous avez cédé ${n} fois au réflexe de la crise : aller vite, payer, promettre ou vous taire. Chacun soulageait l'instant et pariait sur la suite.${
            t.reinfection ? " Le système a été chiffré une seconde fois." : ""
          }${t.promesseRompue ? " La date promise aux clients n'a pas été tenue." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    t.activitePanne * 100,
    "d'activité maintenue en moyenne sur les quatre premières semaines",
    "%",
    { juste: 5, proche: 12 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const parle = p.chemin[D.communication] === 0;
  const menage = p.chemin[D.equipes] === 0;
  const tenue = (parle ? 1 : 0) + (menage ? 1 : 0);
  const duree: Constat = {
    score: tenue === 2 ? 1 : tenue === 1 ? 0.6 : 0,
    texte: `${
      parle
        ? "Vous avez parlé aux clients tôt, honnêtement, et chaque semaine : ils savaient comment commander en attendant."
        : p.chemin[D.communication] === 1
          ? "Vous avez promis aux clients un retour sous huit jours, sans savoir si vous le tiendriez ; vous ne l'avez pas tenu."
          : p.chemin[D.communication] === 2
            ? "Vous vous êtes tue tant que vous n'en saviez pas plus ; les clients l'ont appris par d'autres."
            : "Vous avez prévenu les grands comptes et laissé les artisans l'apprendre au comptoir."
    } ${
      menage
        ? "Vous avez fait porter la ressaisie par des renforts, pour que les équipes tiennent dans la durée."
        : `La ressaisie est restée sur les épaules des équipes déjà usées par des semaines de papier${
            t.arretChef ? ", et Patrick Delorme s'est arrêté un mois" : ""
          }.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, duree];
}

export function axe([information, diagnostic, reflexe, calibrage, duree]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer la panne avant de la combattre",
      texte:
        "Rejouez l'épisode en faisant d'abord le point avec l'informatique et les chefs d'agence : la panne durerait des semaines, et les vendeurs connaissaient de mémoire les références qui font l'essentiel des ventes.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Résister au réflexe d'aller vite",
      texte:
        "Relancer sans nettoyer, payer, promettre une date : chaque réflexe gagne quelques jours et parie le trimestre. Organisez-vous pour vivre sans le système, et redémarrez une seule fois.",
    };
  }
  if (duree!.score === 0) {
    return {
      titre: "Tenir dans la durée",
      texte:
        "Une crise se perd aussi en silence et en fatigue : dire chaque semaine aux clients ce qu'on sait, et retirer aux équipes ce que d'autres peuvent faire, coûte moins que les clients et les arrêts perdus.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Se préparer à une panne longue",
      texte:
        "Quand le système tombe, la première question n'est pas quand il reviendra, mais ce que l'on sait faire sans lui. C'est elle qui décide du trimestre.",
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

const AGRICOL = { de: "Agricol Ferreira", role: "Responsable informatique" } as const;
const NATHALIE = { de: "Nathalie Brun", role: "Acheteuse, Ferrand Habitat" } as const;

export const EPISODE_CRISE: Episode<Trimestre> = {
  code: "panne-qui-paralyse",
  numero: 16,
  domaine: "Gestion de crise",
  titre: "La panne qui paralyse",
  resume:
    "Une cyberattaque paralyse le système de gestion de six agences. Tenir l'activité sans lui, et ne redémarrer qu'une fois.",
  persona: `Vous êtes Céline Rochat, directrice des opérations d'Arvel Distribution pour la région lyonnaise. Vous avez ${AGENCES} agences, cent quarante personnes, et depuis ce matin plus aucun système pour prendre une commande, voir un stock ou sortir une facture.`,
  mandat: [
    { fort: pourcent(CIBLE_ACTIVITE), texte: "de l'activité maintenue pendant la panne, au moins" },
    { fort: kE(PLAFOND), texte: "d'impact sur le trimestre, au plus, coûts de la crise compris" },
    { fort: "Une seule fois", texte: "redémarrer : pas de seconde attaque" },
    { fort: `${CONFIANCE_TENUE} sur 100`, texte: "de confiance des clients en fin de trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge perdue par rapport à un trimestre normal, en comptant ce que coûte la crise : prestataires, heures, remises, ventes jamais facturées et clients partis.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre région",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours, les agences qui attendent des consignes servent moins de clients.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Amandine Roux",
        role: "Cheffe d'agence, Vénissieux",
        alerte: true,
        texte: `Sans consignes, on a renvoyé des artisans chez eux toute la journée. La marge perdue en attendant : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "l'activité maintenue en moyenne sur les quatre premières semaines, en %",
    unite: "%",
    placeholder: "50",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.activitePanne * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "activite",
      nom: "Activité maintenue",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `d'une semaine normale ; cible ${pourcent(CIBLE_ACTIVITE)}` : "avant l'attaque",
    },
    {
      cle: "systemes",
      nom: "Systèmes rétablis",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "part de l'activité que le système porte" : "tout est à l'arrêt",
    },
    {
      cle: "confiance",
      nom: "Confiance des clients",
      format: indice,
      sensBon: 1,
      aide: () => `indice sur 100 ; ${CONFIANCE_DEPART} avant la crise`,
    },
    {
      cle: "fatigue",
      nom: "Fatigue des équipes",
      format: fatigue,
      formatEcart: (v) => nombre(v * 100, 0),
      sensBon: -1,
      aide: () => `au-delà de ${nombre(FATIGUE_TENUE * 100, 0)}, les arrêts menacent`,
    },
    {
      cle: "cout",
      nom: "Coût cumulé de la crise",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `repère à date : ${kE(l.plafondADate ?? 0)} sur ${kE(PLAFOND)}`
          : `plafond : ${kE(PLAFOND)} pour le trimestre`,
      jauge: (l) =>
        l.plafondADate
          ? {
              part: Math.min(1, (l.cout ?? 0) / PLAFOND),
              enRetard: (l.cout ?? 0) > l.plafondADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      activite: pourcent(l.activite ?? 0),
      systemes: pourcent(l.systemes ?? 0),
      confiance: `${indice(l.confiance ?? 0)} sur 100`,
      fatigue: fatigue(l.fatigue ?? 0),
      cout: kE(l.cout ?? 0),
      arriere: kE(l.arriere ?? 0),
      modeDegrade: decisions[D.organisation] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.coutSemaine, 0);
    return [
      [`Activité, sem. ${a}`, pourcent(t.semaines[a]!.activite)],
      [`Confiance, sem. ${a}`, `${indice(t.semaines[a]!.confiance)} sur 100`],
      ["Coût de la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Activité maintenue, semaine par semaine",
    cle: "activite",
    cible: CIBLE_ACTIVITE,
    libelleCible: `cible pendant la panne : ${pourcent(CIBLE_ACTIVITE)} d'une semaine normale`,
    graduations: [0.25, 0.5, 0.75, 1],
    format: pourcent,
    details: (s) => [
      `activité ${pourcent(s.activite!)} · systèmes ${pourcent(s.systemes!)}`,
      `confiance ${indice(s.confiance!)} · fatigue ${fatigue(s.fatigue!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.redemarrage && choix === 1) {
      // Seul le choix de payer compte : la clé fonctionne ou non selon le hasard du trimestre.
      return [{ ...AGRICOL, texte: redemarrage(1, graine).cle ? REPONSES.cleOk : REPONSES.cleKo }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.promesseRompue) {
      lies.push({
        de: "Accueil téléphonique",
        role: "Standard régional",
        heure: "sem. 4",
        alerte: true,
        texte: REPONSES.promesseRompue,
      });
    }
    if (arrive.reinfection) {
      lies.push({
        ...AGRICOL,
        heure: `sem. ${arrive.semaineReinfection}`,
        alerte: true,
        texte: chemin[D.redemarrage] === 2 ? REPONSES.reinfectionEtape : REPONSES.reinfection,
      });
    }
    if (arrive.retabli) {
      lies.push({ ...AGRICOL, heure: `sem. ${t.retabli}`, texte: REPONSES.retabli });
    }
    // L'engagement écrit contre la remise est déjà dans la réaction : il tient à coup sûr.
    if (chemin[D.ferrand] !== 1 && (arrive.ferrandReste || arrive.ferrandPart)) {
      lies.push({
        ...NATHALIE,
        heure: "sem. 5",
        alerte: arrive.ferrandPart,
        texte: arrive.ferrandPart
          ? REPONSES.ferrandPart
          : chemin[D.ferrand] === 0
            ? REPONSES.ferrandPlan
            : REPONSES.ferrandReste,
      });
    }
    if (arrive.arretChef) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: "sem. 9",
        alerte: true,
        texte: REPONSES.arretChef,
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
    titre: (t) => `${impact(t.objectif)}, coûts de la crise compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart à la marge d'un trimestre normal, coûts de la crise compris (prestataires, heures, remises, ventes jamais facturées, clients partis), sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Activité pendant la panne",
          valeur: pourcent(t.activitePanne),
          aide: `semaines 1 à 4 ; cible ${pourcent(CIBLE_ACTIVITE)}`,
          tenu: t.activitePanne >= CIBLE_ACTIVITE,
        },
        {
          nom: "Systèmes rétablis",
          valeur: t.retabli <= 13 ? `semaine ${t.retabli}` : "pas encore",
          aide: t.reinfection
            ? "après une seconde attaque"
            : `en une seule fois ; repère : semaine ${RETABLI_TENU}`,
          tenu: !t.reinfection && t.retabli <= RETABLI_TENU,
        },
        {
          nom: "Confiance des clients",
          valeur: `${indice(t.confianceFinale)} sur 100`,
          aide: `en semaine 13 ; repère ${CONFIANCE_TENUE}`,
          tenu: t.confianceFinale >= CONFIANCE_TENUE,
        },
        {
          nom: "Équipes",
          valeur: fatigue(t.fatigueMax),
          aide: t.arretChef ? "un chef d'agence s'est arrêté" : "fatigue au plus fort de la crise",
          tenu: !t.arretChef && t.fatigueMax <= FATIGUE_TENUE,
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
          titre: "Le système",
          texte: `Un nettoyage complet demandait ${nombre(h.nettoyage)} semaines${
            t.cle === null
              ? ""
              : t.cle
                ? ", et la clé de la rançon a fonctionné"
                : ", et la clé de la rançon n'a rien déchiffré"
          }${t.reinfection ? ". Le système redémarré a été chiffré une seconde fois" : ""}.`,
        },
        {
          titre: "Les clients et les équipes",
          texte: [
            t.ferrandReste
              ? "Ferrand Habitat est resté"
              : "Ferrand Habitat est parti chez le concurrent",
            `${taux(t.clientsPerdus, 0)} des autres clients sont partis`,
            t.arretChef
              ? "Patrick Delorme s'est arrêté un mois"
              : "aucun chef d'agence ne s'est arrêté",
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
