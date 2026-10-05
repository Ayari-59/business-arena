/**
 * ÉPISODE 14 — LE COLLABORATEUR QUI DÉCROCHE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Sandrine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans les épisodes 3 à 7 :
 * les suites qui dépendent d'un choix antérieur (le point d'étape, la session
 * de Didier sur la gamme) passent par `evenements().lies`, et `lire` renvoie
 * des clés non affichées (maîtrise, engagement, absence) qui nourrissent les
 * messages et les sources.
 */
import {
  BUDGET,
  CLIMAT_DEPART,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_SATISFACTION,
  PERTE_PAR_JOUR,
  SEUIL_TENU,
  VENDEURS,
  evenements,
  hasard,
  semaineFormation,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/collaborateur-qui-decroche";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/collaborateur-qui-decroche";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const erreurs = (v: number) => `${nombre(v)} / sem.`;
const sur100 = (v: number) => `${nombre(v * 100, 0)} / 100`;
/** Un écart au budget de marge : positif, le comptoir a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qui avait changé il y a deux mois",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    outil:
      "Votre diagnostic de la semaine 1 était juste : Didier n'avait jamais été formé au nouveau logiciel, et presque toutes ses erreurs venaient des commandes spéciales.",
    confiance:
      "En semaine 1, vous avez vu qu'il avait perdu confiance : c'était vrai, mais c'était la conséquence. Ce qui l'avait fait perdre pied, c'était un logiciel qu'on ne lui avait jamais appris.",
    attitude:
      "En semaine 1, vous avez retenu un problème d'attitude ; ses erreurs, elles, se concentraient sur un seul geste, la saisie des commandes spéciales, et il se trompait toujours aussi peu sur le reste.",
    personnel:
      "En semaine 1, vous avez retenu une difficulté personnelle, sur la foi de ce que disait l'équipe ; aucun fait ne l'étayait, et les erreurs avaient commencé avec le nouveau logiciel.",
  };
  const justes = ["outil", "confiance"];
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
    score: d === "outil" ? 1 : d === "confiance" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé ni à la sanction d'emblée, ni à l'évitement : vous avez cherché la cause, puis accompagné avec des objectifs et un suivi."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions de sanctionner sans avoir compris, ou de laisser l'équipe absorber le problème. Une sanction n'apprend pas un logiciel, et un problème évité continue de coûter.${
            t.arret.length ? ` Didier s'est arrêté ${t.arret.length} semaines.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[2]!.erreurs,
    "d'erreurs de commande de Didier en semaine 2",
    "erreurs",
    { juste: 0.5, proche: 1.2 },
    (e) => `${nombre(e)} erreur${e >= 2 ? "s" : ""}`,
  );

  const choixEquipe = p.chemin[D.equipe];
  const equipe: Constat = {
    score: choixEquipe === 0 ? 1 : choixEquipe === 3 ? 0.6 : 0,
    texte: `${
      choixEquipe === 0
        ? "Vous avez répondu à l'équipe qui compensait : reconnaissance, répartition équitable des reprises, et une échéance, sans trahir ce que Didier vous avait confié."
        : choixEquipe === 1
          ? "Vous avez répété à l'équipe ce que Didier vous avait confié : l'équipe a compris, mais Didier a cessé de vous parler."
          : choixEquipe === 3
            ? "Vous avez remercié l'équipe avec une prime ; la charge, elle, restait sur les mêmes épaules."
            : "Vous avez demandé à l'équipe d'être patiente sans rien changer à ce qu'elle portait."
    }${
      t.karimaPart
        ? " Karima, qui reprenait l'essentiel des erreurs, est partie chez un concurrent."
        : " Personne n'a quitté le comptoir."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, equipe];
}

export function axe([information, diagnostic, reflexe, calibrage, equipe]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qui a changé",
      texte:
        "Rejouez l'épisode en analysant d'abord ses erreurs : presque toutes portaient sur les commandes spéciales du nouveau logiciel, auquel il n'avait été formé qu'une demi-journée.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Comprendre avant de sanctionner",
      texte:
        "Quand un bon élément décroche, un entretien factuel et bienveillant apprend la cause ; un avertissement ferme le dialogue. Le recadrage garde sa place, après un plan qui a échoué.",
    };
  }
  if (equipe!.score === 0) {
    return {
      titre: "Protéger l'équipe qui compense",
      texte:
        "Pendant qu'un collaborateur remonte la pente, les autres portent sa charge. Reconnaître leur effort et la répartir équitablement, jusqu'à une date, évite d'en perdre un second.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Partir des faits, pas des impressions",
      texte:
        "Les rumeurs et les jugements d'attitude ne disent pas d'où viennent les erreurs. Datez-les, classez-les, et cherchez ce qui a changé quand elles ont commencé.",
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

const DIDIER = { de: "Didier Fontaine", role: "Vendeur comptoir" } as const;
const RH = { de: "Corinne Lemaire", role: "Ressources humaines" } as const;

export const EPISODE_PERFORMANCE: Episode<Trimestre> = {
  code: "collaborateur-qui-decroche",
  numero: 14,
  domaine: "Management de la performance individuelle",
  titre: "Le collaborateur qui décroche",
  resume:
    "Un vendeur expérimenté multiplie les erreurs, l'équipe compense, la direction veut sanctionner. Comprendre la cause avant de juger.",
  persona:
    "Vous êtes Sandrine Aubert, cheffe des ventes comptoir de l'agence Arvel Distribution de Bron. Votre équipe : six vendeurs, qui servent les artisans du bâtiment de l'ouverture à la fermeture.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge nette du comptoir sur le trimestre" },
    { fort: "86 %", texte: "de clients du comptoir satisfaits au moins" },
    {
      fort: `${nombre(SEUIL_TENU)} erreurs`,
      texte: "par semaine au plus pour Didier, à mi-trimestre",
    },
    { fort: `${VENDEURS} vendeurs`, texte: "à garder au comptoir" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge nette du comptoir en écart au budget, en comptant les erreurs reprises, la formation, l'intérim et les départs.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre comptoir",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les commandes fausses continuent de partir et des artisans vont voir ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Franck Delorme",
        role: "Directeur de l'agence",
        alerte: true,
        texte: `Pendant ce temps, d'autres commandes sont parties fausses, et un plaquiste est allé se servir chez un concurrent : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre d'erreurs de commande de Didier en semaine 2",
    unite: "erreurs",
    placeholder: "4,2",
    min: 0,
    max: 15,
    step: 0.1,
    reel: (t) => t.semaines[2]!.erreurs,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "erreurs",
      nom: "Erreurs de Didier",
      format: erreurs,
      formatEcart: (v) => nombre(v),
      sensBon: -1,
      aide: (_semaine, l) =>
        l.absent ? "en arrêt cette semaine" : "il y a six mois : moins d'une par semaine",
    },
    {
      cle: "satisfaction",
      nom: "Clients satisfaits",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "objectif : 86 % au moins",
    },
    {
      cle: "climat",
      nom: "Climat de l'équipe",
      format: sur100,
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "baromètre du vendredi",
    },
    {
      cle: "risque",
      nom: "Risque de départ",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: () => "qu'un vendeur parte dans le trimestre",
    },
    {
      cle: "cumul",
      nom: "Marge nette du comptoir",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      erreurs: l.absent ? "aucune, il est en arrêt" : nombre(l.erreurs ?? 0),
      satisfaction: taux(l.satisfaction ?? 0, 0),
      climat: nombre((l.climat ?? 0) * 100, 0),
      risque: taux(l.risque ?? 0, 0),
      averti: decisions[D.entretien] === 0,
      ouvert: decisions[D.entretien] === 1,
      retire: decisions[D.plan] === 3,
      tenu: !l.absent && (l.erreurs ?? 99) <= SEUIL_TENU,
      serein: (l.engagement ?? 0) >= 0.6,
      outil: (l.maitrise ?? 0) >= 0.5,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Erreurs de Didier, sem. ${a}`, fin.present ? nombre(fin.erreurs) : "en arrêt"],
      [`Climat, sem. ${a}`, sur100(fin.climat)],
      ["Marge nette de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Erreurs de commande de Didier, semaine par semaine",
    cle: "erreurs",
    cible: SEUIL_TENU,
    libelleCible: `objectif de mi-trimestre : ${nombre(SEUIL_TENU)} au plus`,
    graduations: [1, 2.5, 5, 7.5],
    format: (v) => nombre(v),
    details: (s) => [
      s.present
        ? `${nombre(s.erreurs!)} erreurs · performance ${nombre(s.performance!, 0)} / 100`
        : "Didier en arrêt",
      `satisfaction ${taux(s.satisfaction!, 0)} · climat ${sur100(s.climat!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.plan && choix === 0) {
      // Seule l'inscription compte : l'éditeur a de la place ou non, selon le hasard du trimestre.
      return [
        {
          de: "Éditeur du logiciel",
          role: "Service formation",
          texte:
            semaineFormation(graine) === 4 ? REPONSES.sessionProche : REPONSES.sessionLointaine,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.arret !== null) {
      lies.push({
        ...RH,
        heure: `sem. ${arrive.arret}`,
        alerte: true,
        texte:
          "Didier Fontaine nous a fait parvenir un arrêt de travail de trois semaines. Un intérimaire tiendra sa place au comptoir.",
      });
    }
    if (arrive.formation === "suivie") {
      lies.push({
        ...DIDIER,
        heure: `sem. ${semaineFormation(graine)}`,
        texte:
          "Deux jours de formation. J'ai enfin compris la logique des écrans. Il me faudra un peu de pratique, mais je ne suis plus perdu.",
      });
    }
    if (arrive.formation === "manquee") {
      lies.push({
        ...RH,
        heure: `sem. ${semaineFormation(graine)}`,
        texte:
          "Didier étant en arrêt, il n'a pas pu suivre la session de l'éditeur. Elle est perdue.",
      });
    }
    if (arrive.etape === true) {
      lies.push({
        ...DIDIER,
        heure: "sem. 7",
        texte:
          "Merci d'avoir regardé les chiffres avec moi. Un point toutes les deux semaines, ça me va : je sais où j'en suis.",
      });
    }
    if (arrive.etape === false) {
      lies.push({
        ...DIDIER,
        heure: "sem. 7",
        texte:
          "J'ai reçu le recadrage, avec l'échéance de la semaine 10. C'est dur à lire, mais c'est clair. Je reprends les commandes avec Yacine.",
      });
    }
    if (arrive.karimaPart) {
      lies.push({
        de: "Karima Saïdi",
        role: "Vendeuse comptoir",
        heure: "sem. 10",
        alerte: true,
        texte:
          "Sandrine, j'ai accepté l'offre du négoce de Villeurbanne. Je pars à la fin du mois, en solde de congés. Je suis fatiguée de rattraper.",
      });
    }
    if (arrive.gamme === true) {
      lies.push({
        de: "Hugo Ferrand",
        role: "Vendeur comptoir",
        heure: "sem. 10",
        texte:
          "La session de Didier sur les fixations, c'était du concret : les cas qu'on voit vraiment sur les chantiers. Les artisans le redemandent au comptoir.",
      });
    }
    if (arrive.gamme === false) {
      lies.push({
        de: "Hugo Ferrand",
        role: "Vendeur comptoir",
        heure: "sem. 10",
        alerte: true,
        texte: arrive.gammeSansDidier
          ? "Didier étant en arrêt, personne n'a présenté les fixations. Deux artisans sont déjà revenus avec des chevilles inadaptées, à reprendre."
          : "La session sur les fixations a tourné court : Didier n'était pas à l'aise. Deux artisans sont déjà revenus avec des chevilles inadaptées, à reprendre.",
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
    titre: (t) => `Marge nette ${ecartAuBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette du comptoir en écart au budget, erreurs reprises, formation, intérim et départs compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const enArret = t.arret.includes(13);
      return [
        {
          nom: "Performance de Didier",
          valeur: enArret ? "en arrêt" : `${nombre(t.performanceFinale, 0)} / 100`,
          aide: "en semaine 13 ; 100, son niveau d'avant",
          tenu: !enArret && t.performanceFinale >= 85,
        },
        {
          nom: "Clients satisfaits",
          valeur: taux(t.satisfactionMoyenne, 0),
          aide: "en moyenne ; objectif 86 %",
          tenu: t.satisfactionMoyenne >= OBJECTIF_SATISFACTION,
        },
        {
          nom: "Climat de l'équipe",
          valeur: sur100(t.climatFinal),
          aide: `en semaine 13 ; au départ ${sur100(CLIMAT_DEPART)}`,
          tenu: t.climatFinal >= CLIMAT_DEPART,
        },
        {
          nom: "Équipe",
          valeur: `${t.effectifFinal} sur ${VENDEURS}`,
          aide: t.karimaPart ? "Karima est partie" : "vendeurs en fin de trimestre",
          tenu: !t.karimaPart,
        },
      ];
    },
    hasard(t, graine) {
      const semainesDArret = t.arret.length;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.formationSemaine !== null
          ? [
              {
                titre: "L'éditeur",
                texte:
                  t.formationSemaine === 4
                    ? "avait une place en semaine 4."
                    : "n'avait plus de place avant la semaine 8.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: [
            semainesDArret
              ? `Didier s'est arrêté ${semainesDArret} semaines`
              : "Didier ne s'est pas arrêté",
            t.gammeReussie === true ? "sa session sur les fixations a porté" : null,
            t.gammeReussie === false ? "sa session sur les fixations a tourné court" : null,
            t.karimaPart ? "Karima est partie en semaine 10" : "personne n'est parti",
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
