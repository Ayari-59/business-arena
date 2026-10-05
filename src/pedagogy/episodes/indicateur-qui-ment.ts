/**
 * ÉPISODE 15 — L'INDICATEUR QUI MENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Sonia montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 *
 * Le tableau de bord montre ce qu'une responsable de plateaux voit vraiment :
 * le décroché et la durée d'appel que le siège suit, et les commandes prises
 * au premier appel seulement quand quelqu'un a décidé de les mesurer.
 */
import {
  BUDGET,
  CA_BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_DECROCHE,
  OBJECTIF_PREMIER_APPEL,
  PERTE_PAR_JOUR,
  SEMAINES,
  SEUIL_RAPPEL,
  evenements,
  hasard,
  siegeAccepte,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/indicateur-qui-ment";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/indicateur-qui-ment";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pourcent = (v: number) => taux(v, 0);
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Une durée d'appel en minutes et secondes : « 5 min 08 ». */
const minutes = (v: number) => {
  const total = Math.round(v * 60);
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, "0")}`;
};
/** Un écart au budget de contribution : positif, les plateaux ont fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce que le décroché cachait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    goodhart:
      "Votre diagnostic de la semaine 1 était juste : devenu l'objectif de l'équipe, le décroché ne mesurait plus le service. On décrochait vite, on écourtait, et la commande ne se prenait plus au premier appel.",
    formation:
      "En semaine 1, vous avez vu que les conseillers promettaient de rappeler : un vrai symptôme, mais ce n'était pas faute de savoir répondre. C'était pour tenir le chrono.",
    prix: "En semaine 1, vous avez retenu les prix des concurrents ; ils n'avaient pas bougé.",
    web: "En semaine 1, vous avez retenu le passage au site web ; les commandes en ligne étaient stables.",
  };
  const justes = ["goodhart", "formation"];
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
    score: d === "goodhart" ? 1 : d === "formation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais poussé le chiffre vert plus fort, ni ne l'avez noyé sous d'autres chiffres : vous avez regardé ce qu'il comptait, et ajouté le résultat à côté."
        : `Sous la pression du chiffre, vous l'avez poussé plus fort, lui avez fait confiance ou l'avez noyé sous d'autres indicateurs ${n} fois. Le décroché restait vert ; les commandes, elles, ne se prenaient plus au premier appel.${
            t.yasminePart ? " Yasmine, qui en prenait le plus, a fini par démissionner." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.rappel * 100,
    "d'appelants qui rappellent en semaine 3",
    "%",
    { juste: 2, proche: 5 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const primeRefondue = p.chemin[D.prime] === 1;
  const tableauEquilibre = p.chemin[D.tableau] === 1;
  const regles = (primeRefondue ? 1 : 0) + (tableauEquilibre ? 1 : 0);
  const reglesDuJeu: Constat = {
    score: regles === 2 ? 1 : regles === 1 ? 0.6 : 0,
    texte: `${
      primeRefondue
        ? "Vous avez refondu la prime avec l'équipe, sur un indicateur de résultat."
        : p.chemin[D.prime] === 0
          ? "Vous avez supprimé la prime d'un coup : la pression est tombée, l'engagement aussi."
          : `Vous avez laissé la prime attachée au seul décroché${
              t.primesSautees.length ? ", et elle a sauté quand il a baissé" : ""
            }.`
    } ${
      tableauEquilibre
        ? "Vous pilotez désormais avec quatre indicateurs équilibrés, revus avec l'équipe."
        : p.chemin[D.tableau] === 2
          ? "Quinze indicateurs par conseiller et par heure : plus personne ne sait lequel compte."
          : "Le seul décroché reste au tableau de bord : il ment toujours."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, reglesDuJeu];
}

export function axe([information, diagnostic, reflexe, calibrage, regles]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Vérifier ce que l'indicateur mesure",
      texte:
        "Rejouez l'épisode en écoutant d'abord des appels et en croisant les numéros appelants : un tiers des appels de commande se terminaient sans commande, derrière un décroché de 94 %.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Regarder le résultat, pas seulement le chiffre vert",
      texte:
        "Quand un indicateur devient un objectif, l'équipe finit par le servir plutôt que le client. Avant de pousser un chiffre, mettez à côté un indicateur de résultat — ici, la commande prise au premier appel.",
    };
  }
  if (regles!.score === 0) {
    return {
      titre: "Changer les règles avec ceux qu'elles mesurent",
      texte:
        "Une prime et un tableau de bord sont les règles du jeu de l'équipe. Les refondre avec elle, sur peu d'indicateurs équilibrés, retire la pression sans casser l'engagement.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que l'indicateur ne voit pas",
      texte:
        "Quand un chiffre est excellent et que le résultat baisse, la cause est souvent le chiffre lui-même : regardez ce que les gens font pour le tenir.",
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

const SIEGE = {
  de: "Marc-Antoine Leroy",
  role: "Directeur de la relation client, siège",
} as const;

export const EPISODE_INDICATEURS: Episode<Trimestre> = {
  code: "indicateur-qui-ment",
  numero: 15,
  domaine: "Pilotage par les indicateurs",
  titre: "L'indicateur qui ment",
  resume:
    "Des plateaux téléphoniques premiers du groupe au décroché, et des commandes qui baissent. Regarder ce que l'indicateur mesure vraiment.",
  persona:
    "Vous êtes Sonia Vidal, responsable des centres d'appels et de la prise de commande à distance d'Arvel Distribution, à Vénissieux. Votre équipe : quatorze conseillers sur deux plateaux, à Vénissieux et à Villefranche-sur-Saône, qui prennent au téléphone les commandes des artisans.",
  mandat: [
    { fort: "90 %", texte: "d'appels décrochés en moins de 30 secondes : l'objectif du siège" },
    { fort: "250 €", texte: "de prime par conseiller et par mois quand il est tenu" },
    { fort: kE(CA_BUDGET), texte: "de chiffre d'affaires à distance par semaine, au budget" },
    { fort: kE(BUDGET), texte: "de contribution sur le trimestre, au budget" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la contribution des commandes à distance — leur marge, moins les primes, les renforts, le temps passé aux rappels et les clients perdus — en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos plateaux",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les commandes que les clients n'arrivent pas à passer partent ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Philippe Garcin",
        role: "Directeur commercial régional",
        alerte: true,
        texte: `Pendant ce temps, deux entreprises de maçonnerie ont passé leur commande de chantier chez un concurrent : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la part des appelants qui rappellent sous 48 heures en semaine 3, en %",
    unite: "%",
    placeholder: "22",
    min: 0,
    max: 60,
    step: 1,
    reel: (t) => t.semaines[3]!.rappel * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "decroche",
      nom: "Décrochés en moins de 30 s",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: () => "objectif du siège : 90 % ; la prime en dépend",
    },
    {
      cle: "dmc",
      nom: "Durée moyenne d'appel",
      format: minutes,
      formatEcart: (v) => `${nombre(v * 60, 0)} s`,
      sensBon: -1,
      aide: () => "suivie par le siège, qui la veut courte",
    },
    {
      cle: "premierAppel",
      nom: "Commandes prises au premier appel",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: (_, l) =>
        l.premierAppel == null ? "non mesuré : personne ne le suit" : "objectif proposé : 70 %",
    },
    {
      cle: "rappel",
      nom: "Appelants qui rappellent sous 48 h",
      format: pourcent,
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) => (semaine ? `en semaine ${semaine}` : "la semaine dernière"),
    },
    {
      cle: "cumul",
      nom: "Contribution à date",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} au budget du trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.max(0, Math.min(1, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      decroche: pourcent(l.decroche ?? 0),
      ca: kE(l.ca ?? 0),
      rappel: pourcent(l.rappel ?? 0),
      premierAppel: l.premierAppel == null ? "non mesuré" : pourcent(l.premierAppel),
      voit: decisions[D.mesure] === 1,
      dixIndicateurs: decisions[D.mesure] === 2,
      primeAuDecroche: decisions[D.prime] === 2 || decisions[D.prime] === 3,
      seuil: decisions[D.prime] === 3 ? "95 %" : "90 %",
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`Décroché, sem. ${a}`, pourcent(t.semaines[a]!.decroche)],
      [`Commandes au premier appel, sem. ${a}`, pourcent(t.semaines[a]!.premierAppel)],
      ["Contribution de la période", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Chiffre d'affaires à distance, semaine par semaine",
    cle: "ca",
    cible: CA_BUDGET,
    libelleCible: `budget : ${kE(CA_BUDGET)} par semaine`,
    graduations: [100000, 200000, 300000],
    format: kE,
    details: (s) => [
      `chiffre d'affaires ${kE(s.ca!)} · décroché ${pourcent(s.decroche!)}`,
      `commandes au premier appel ${pourcent(s.premierAppel!)} · rappels ${pourcent(s.rappel!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.postes && choix === 1) {
      // Seule la proposition compte : le siège répond selon le hasard du trimestre.
      const accepte = siegeAccepte([...NEUTRE.slice(0, D.postes), 1], graine);
      return [{ ...SIEGE, texte: accepte ? REPONSES.siegeAccepte : REPONSES.siegeRefuse }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.yasminePart) {
      lies.push({
        de: "Yasmine Belkacem",
        role: "Conseillère, Villefranche",
        heure: "sem. 9",
        alerte: true,
        texte:
          "Sonia, je démissionne. On me demande de raccrocher vite, alors que mon métier, c'est de prendre des commandes. Je pars à la fin de la semaine prochaine, en solde de congés.",
      });
    }
    if (arrive.primeSautee !== null) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: `sem. ${arrive.primeSautee}`,
        alerte: true,
        texte:
          "Décroché moyen du mois sous le seuil : la prime d'équipe ne sera pas versée ce mois-ci.",
      });
    }
    if (chemin[D.postes] === 1 && de <= 11 && a >= 11 && !siegeAccepte(chemin, graine)) {
      lies.push({
        de: "Agnès Royer",
        role: "Contrôle de gestion",
        heure: "sem. 11",
        texte:
          "Comme annoncé par le siège, un poste de conseiller part au service après-vente lundi.",
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
      "Écart au budget de contribution des commandes à distance — marge, moins primes, renforts, rappels et clients perdus — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Décroché en 30 s",
          valeur: pourcent(t.decrocheMoyen),
          aide: "en moyenne ; objectif du siège 90 %",
          tenu: t.decrocheMoyen >= OBJECTIF_DECROCHE,
        },
        {
          nom: "Commandes au premier appel",
          valeur: pourcent(t.premierAppelMoyen),
          aide: "en moyenne ; objectif proposé 70 %",
          tenu: t.premierAppelMoyen >= OBJECTIF_PREMIER_APPEL,
        },
        {
          nom: "Clients qui rappellent",
          valeur: pourcent(t.rappelMoyen),
          aide: "en moyenne ; plafond 15 %",
          tenu: t.rappelMoyen <= SEUIL_RAPPEL,
        },
        {
          nom: "Chiffre d'affaires à distance",
          valeur: kE(t.ca),
          aide: `sur le trimestre ; budget ${kE(CA_BUDGET * SEMAINES)}`,
          tenu: t.ca >= CA_BUDGET * SEMAINES,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.siegeConsulte
          ? [
              {
                titre: "Le siège",
                texte: t.siegeAccepte
                  ? "a accepté de suivre les commandes prises au premier appel, et vous a laissé vos deux postes."
                  : "a gardé son indicateur, et repris un poste en semaine 11.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: [
            t.yasminePart ? "Yasmine a démissionné en semaine 9" : "Yasmine est restée",
            t.primesSautees.length
              ? `la prime a sauté ${t.primesSautees.length === 1 ? "un mois" : `${t.primesSautees.length} mois`}`
              : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
