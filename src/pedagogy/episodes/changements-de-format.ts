/**
 * ÉPISODE 94 — LES CHANGEMENTS QUI MANGENT LA LIGNE, tel que l'interface et
 * le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi de la ligne 3 montre à Gurvan, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET,
  CAPACITE_DEPART,
  D,
  DEMANDE_JUILLET,
  HEURES_CHANGEMENTS,
  JOURS_SANS_PERTE,
  OBJECTIF_TRS,
  PERTE_PAR_JOUR,
  TAUX_SERVICE,
  evenements,
  filmReussi,
  hasard,
  semaineAdhesion,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/changements-de-format";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/changements-de-format";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v)} h`;
const pots = (v: number) => nombre(Math.round(v / 1000) * 1000, 0);

const AZILIS = { de: "Azilis Cozic", role: "Responsable emballages et développement" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable de production les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le relevé des arrêts et le planning des recettes",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    changements:
      "Votre diagnostic de la semaine 1 était juste : la moitié des heures perdues partait aux changements de format et aux nettoyages entre recettes.",
    doseur:
      "En semaine 1, vous avez vu les micro-arrêts du doseur : une vraie perte, un peu plus du quart, mais pas la plus grosse. Les changements et les NEP en prenaient près de la moitié.",
    capacite:
      "En semaine 1, vous avez conclu que la ligne était trop petite ; elle perdait 34 heures sur 80, dont 17 aux changements et aux nettoyages. Une ligne livrée en janvier ne pouvait rien pour l'été.",
    cadence:
      "En semaine 1, vous avez retenu la cadence des équipes ; entre deux arrêts, la ligne tournait bien. Ce sont les arrêts eux-mêmes, changements et nettoyages d'abord, qui mangeaient la ligne.",
  };
  const justes = ["changements", "doseur"];
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
    score: d === "changements" ? 1 : d === "doseur" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez acheté ni ligne ni samedis : vous avez cherché la capacité dans les heures que la ligne perdait."
        : `Face à une ligne qui ne suivait pas, vous avez acheté de la capacité ou des heures ${n} fois sur ${ETAPES.length} décisions : une deuxième ligne, qui n'arrivera qu'en janvier, ou des samedis, à 6 500 € chacun.${
            t.samedis > 0
              ? ` ${t.samedis} samedis travaillés, ${kE(t.coutSamedis)} d'heures majorées.`
              : ""
          }${t.accident ? " Un opérateur s'est blessé un samedi." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    HEURES_CHANGEMENTS,
    "perdues chaque semaine aux changements de format et aux NEP",
    "h",
    { juste: 1, proche: 3 },
    (e) => heures(e),
  );

  // Les changements regagnés, sans jamais toucher au cycle de nettoyage validé.
  const ecourte = p.chemin[D.juin] === 0;
  const fin = t.heuresChangementsFinal;
  const campagnes = p.chemin[D.ordonnancement] === 0;
  const changements: Constat = {
    score: ecourte ? 0 : fin <= 8 && !campagnes ? 1 : fin <= 12 ? 0.6 : 0,
    texte: ecourte
      ? `Vous avez gagné du temps en écourtant les NEP : une faute sanitaire, quel que soit le résultat.${
          t.positive
            ? ` Un prélèvement est revenu positif en semaine ${t.positive} : lots bloqués, une journée de décontamination.`
            : " Cette fois, aucun prélèvement n'est revenu positif : de la chance, quand il l'est près d'une fois sur deux."
        }`
      : `Les changements et les NEP sont passés de ${heures(HEURES_CHANGEMENTS)} par semaine à ${heures(fin)} en semaine 13${
          fin <= 8
            ? campagnes
              ? ", mais au prix de longues séries : du stock en chambre froide, et des pots cassés à DLC courte."
              : ", en préparant ligne en marche ce qui pouvait l'être et en ordonnant les recettes."
            : fin <= 12
              ? " : un progrès, mais une partie des heures est restée dans les arrêts."
              : " : la ligne a gardé l'essentiel de ce qui la mangeait."
        }`,
  };

  return [information, diagnostic, reflexe, calibrage, changements];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  changements,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Décomposer le TRS avant de choisir le remède",
      texte:
        "Rejouez l'épisode en dépouillant d'abord le relevé des arrêts et le planning des recettes : la moitié des heures perdues partait aux changements de format et aux NEP, et l'ordre des recettes en fabriquait une partie.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Chercher la capacité dans la ligne avant d'en acheter",
      texte:
        "Une deuxième ligne arrivait en janvier, et un samedi coûtait 6 500 € de plus pour seize heures. La ligne 3 en perdait dix-sept chaque semaine à changer de format et à nettoyer : c'était là, et pour presque rien, que se trouvait l'été.",
    };
  }
  if (changements!.score === 0) {
    return {
      titre: "Préparer les changements ligne en marche, et ordonner les recettes",
      texte:
        "Un changement se raccourcit en sortant de l'arrêt tout ce qui peut se faire avant : outil, bobines, recette suivante. Un NEP se retire en ordonnant les recettes, jamais en écourtant son cycle validé.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où partent les heures",
      texte:
        "Avant de juger une ligne, coupez son TRS en disponibilité, performance et qualité, et rangez les pertes par taille : la plus grosse fixe le premier chantier.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte:
        "Six changements de format de 65 minutes et neuf NEP de 70 minutes : 1 020 minutes, soit 17 heures par semaine. Les micro-arrêts et les rebuts n'y entrent pas : ils se soignent autrement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_CHANGEMENTS_FORMAT: Episode<Trimestre> = {
  code: "changements-de-format",
  numero: 94,
  domaine: "Décomposer le TRS d'une ligne",
  titre: "Les changements qui mangent la ligne",
  resume:
    "Une ligne de yaourts à 57 % de TRS avant l'été, et un directeur qui veut une deuxième ligne. Décomposer les pertes, puis regagner les heures des changements et des nettoyages.",
  persona:
    "Vous êtes Gurvan Kerebel, responsable de production de l'usine de Loudéac de la Laiterie de Kerbrélan. La ligne 3 conditionne des yaourts aromatisés en pots de 125 g, en packs de 4, 8 et 12 : une thermoformeuse-remplisseuse-scelleuse de 20 000 pots à l'heure, ouverte 80 heures par semaine en deux équipes. Erwann Tromeur, chef de l'atelier de conditionnement, et seize conducteurs et opérateurs la font tourner.",
  mandat: [
    { fort: taux(OBJECTIF_TRS, 0), texte: "de TRS, l'objectif de l'usine" },
    { fort: taux(TAUX_SERVICE), texte: "de taux de service exigé par les enseignes" },
    { fort: "pas de ligne neuve", texte: "avant l'hiver : livrée en janvier au plus tôt" },
    { fort: "le plan de nettoyage", texte: "appliqué tel qu'il est validé" },
  ],
  jugement:
    "Votre direction juge le trimestre, d'avril à juin, sur la marge sur coût variable des pots livrés, moins les pénalités logistiques des ruptures, les rebuts et la casse, les heures majorées et le coût des mesures, plus la capacité gagnée pour juillet.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre ligne",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: [3, 3, 3, 3, 3, 3],
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la ligne continue de tourner comme avant : purges, pots manquants.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Erwann Tromeur",
        role: "Chef de l'atelier de conditionnement",
        alerte: true,
        texte: `Pendant ce temps, la ligne a tourné comme avant : ${euros(perdu)} de purges et de pots manquants qu'on aurait pu éviter.`,
      };
    },
  },
  prevision: {
    libelle:
      "les heures de production perdues chaque semaine aux changements de format et aux NEP sur la ligne 3",
    unite: "h",
    placeholder: "0",
    min: 0,
    max: 80,
    step: 0.5,
    reel: () => HEURES_CHANGEMENTS,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "trs",
      nom: "TRS de la ligne 3",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `semaine ${semaine} ; objectif ${taux(OBJECTIF_TRS, 0)}`
          : "quatre dernières semaines",
    },
    {
      cle: "heuresChangements",
      nom: "Changements et NEP",
      format: heures,
      sensBon: -1,
      aide: () => "heures perdues par semaine de 80 heures",
    },
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `depuis avril ; enseignes : ${taux(TAUX_SERVICE)}`
          : `enseignes : ${taux(TAUX_SERVICE)}`,
    },
    {
      cle: "pertesCumul",
      nom: "Rebuts et casse",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "au coût variable des pots perdus, depuis avril"
          : "au coût variable des pots perdus",
    },
    {
      cle: "cumul",
      nom: "Contribution de la ligne",
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
      trs: taux(l.trs ?? 0, 0),
      heures: heures(l.heuresChangements ?? 0),
      service: taux(l.service ?? 0),
      demande: pots(l.demande ?? 0),
      capacite: pots(l.capacite ?? 0),
      reponse: decisions[D.reponse] ?? 3,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`TRS, sem. ${a}`, taux(t.semaines[a]!.trs, 0)],
      [`Changements et NEP, sem. ${a}`, heures(t.semaines[a]!.heuresChangements)],
      ["Contribution de la période", kE(contribution)],
    ];
  },
  courbe: {
    titre: "TRS de la ligne 3, semaine par semaine",
    cle: "trs",
    cible: OBJECTIF_TRS,
    libelleCible: `objectif de l'usine : ${taux(OBJECTIF_TRS, 0)}`,
    graduations: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    format: (v) => taux(v, 0),
    details: (s) => [
      `TRS ${taux(s.trs!, 0)} · changements et NEP ${heures(s.heuresChangements!)}`,
      `${pots(s.livres!)} pots livrés sur ${pots(s.demande!)} commandés`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.scellage && choix === 0) {
      // L'essai du nouveau film réussit ou non selon le hasard du trimestre.
      return [{ ...AZILIS, texte: filmReussi(graine) ? REPONSES.filmReussi : REPONSES.filmRate }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (chemin[D.reponse] === 0 && de <= 2 && a >= 2) {
      lies.push({
        de: "Efflam Jézéquel",
        role: "Directeur industriel",
        heure: "sem. 2",
        texte: REPONSES.etude,
      });
    }
    if (arrive.adhesion) {
      const debut = semaineAdhesion(chemin);
      lies.push(
        t.adhesion
          ? {
              de: "Djamila Hadjadj",
              role: "Conductrice de la ligne 3, équipe d'après-midi",
              heure: `sem. ${debut}`,
              texte: REPONSES.adhesion,
            }
          : {
              de: "Kouadio Assamoi",
              role: "Chef d'équipe d'après-midi",
              heure: `sem. ${debut}`,
              alerte: true,
              texte: REPONSES.refus,
            },
      );
    }
    if (arrive.casse) {
      lies.push({
        de: "Nedjma Benhalima",
        role: "Responsable des approvisionnements frais, Celtis",
        heure: "sem. 8",
        alerte: true,
        texte: REPONSES.casse,
      });
    }
    if (arrive.doseur) {
      lies.push({
        de: "Klervi Nédélec",
        role: "Responsable maintenance",
        heure: "sem. 8",
        texte: REPONSES.doseur,
      });
    }
    if (arrive.positive) {
      lies.push({
        de: "Annaïg Le Dantec",
        role: "Responsable qualité",
        heure: `sem. ${t.positive}`,
        alerte: true,
        texte: REPONSES.positive,
      });
    }
    if (arrive.accident) {
      lies.push({
        de: "Maëwenn Postec",
        role: "Directrice des ressources humaines",
        heure: `sem. ${t.accident}`,
        alerte: true,
        texte: REPONSES.accident,
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
    titre: (t) => `${kE(t.objectif)} de contribution, capacité de juillet comprise`,
    formatObjectif: kE,
    noteDesBarres:
      "Contribution de la ligne 3 : marge sur coût variable des pots livrés, moins pénalités, rebuts, casse, heures majorées et coût des mesures, plus la capacité gagnée pour juillet, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "TRS",
          valeur: taux(t.trsFinal, 0),
          aide: `en semaine 13 ; objectif ${taux(OBJECTIF_TRS, 0)}, 57 % au départ`,
          tenu: t.trsFinal >= OBJECTIF_TRS,
        },
        {
          nom: "Taux de service",
          valeur: taux(t.service),
          aide: `sur le trimestre ; ${nombre(t.manque / 1000, 0)} milliers de pots non livrés`,
          tenu: t.service >= TAUX_SERVICE,
        },
        {
          nom: "Changements et NEP",
          valeur: heures(t.heuresChangementsFinal),
          aide: `par semaine en semaine 13 ; ${heures(HEURES_CHANGEMENTS)} au départ`,
          tenu: t.heuresChangementsFinal <= HEURES_CHANGEMENTS / 2,
        },
        {
          nom: "Sécurité des aliments et des équipes",
          valeur: t.positive || t.accident ? "une alerte" : "aucune alerte",
          aide: t.positive
            ? `prélèvement positif en semaine ${t.positive}`
            : t.accident
              ? `accident du travail en semaine ${t.accident}`
              : "nettoyages validés, aucun accident",
          tenu: !t.positive && !t.accident,
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
          titre: "L'équipe d'après-midi",
          texte: (t.chantierConducteurs
            ? t.adhesion
              ? "s'est emparée du chantier des changements"
              : "n'a pas suivi d'emblée le chantier des changements"
            : t.suivrait
              ? "aurait suivi un chantier mené avec elle"
              : "n'aurait pas suivi d'emblée un chantier mené avec elle"
          ).concat(
            t.accident
              ? `. Un opérateur s'est blessé un samedi, en semaine ${t.accident}.`
              : t.samedis
                ? `, après ${t.samedis} samedis travaillés, sans accident.`
                : ".",
          ),
        },
        {
          titre: "La ligne",
          texte: [
            t.positive
              ? `un prélèvement de surface est revenu positif en semaine ${t.positive}`
              : "aucun prélèvement de surface positif",
            filmReussi(graine)
              ? "l'essai du nouveau film aurait réussi"
              : "l'essai du nouveau film aurait échoué",
            `juillet : ${pots(Math.min(t.gainPots * t.durabilite, DEMANDE_JUILLET - CAPACITE_DEPART))} pots par semaine de plus que la ligne de départ, ${kE(t.juillet)} de capacité gagnée`,
          ]
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
