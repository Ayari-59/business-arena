/**
 * ÉPISODE 79 — LES LITS QUI RESTENT VIDES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de l'EHPAD de Beaune montre, ce que
 * la courbe trace, ce sur quoi le bilan juge Corentine, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET_SEMAINE,
  COUT_INADAPTEE,
  D,
  DELAI_DEPART,
  JOURS_SANS_PERTE,
  MANQUE_A_GAGNER,
  NEUTRE,
  O,
  PERTE_PAR_JOUR,
  PLACES,
  RECETTE_JOUR,
  SEMAINES,
  TAUX_CIBLE,
  TAUX_EPRD,
  VIDES_DEPART,
  conventionAcceptee,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/lits-vides";
import {
  DOROTA,
  DIAGNOSTICS,
  ETAPES,
  MARIETOU,
  GUILLEMETTE,
  HOURIA,
  ROCIO,
  REFERENCES,
  REFLEXES,
  REPONSES,
  YAMINA,
} from "@/config/episodes/lits-vides";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 0)} jours`;
const points = (v: number) => `${nombre(v * 100)} pt`;
const kESigne = (v: number) => (v >= 0 ? `+${kE(v)}` : kE(v));

/** La prévision de la semaine 1, en k€ : le manque à gagner annuel de huit lits vides. */
export const MANQUE_A_GAGNER_KE = MANQUE_A_GAGNER / 1000;
/** Les recettes que l'EPRD prévoyait pour le trimestre, à 95 % d'occupation. */
export const BUDGET_TRIMESTRE = BUDGET_SEMAINE * SEMAINES;
/** Le délai de vacance qu'un circuit resserré tient : trois semaines. */
export const DELAI_VISE = 21;

/** Ce que les décisions révèlent, dans l'ordre où une directrice d'EHPAD les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le parcours des dernières entrées et ce que rapporte une journée",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    circuit: `Votre diagnostic de la semaine 1 était juste : un lit vide venait d'abord du circuit d'admission. ${DELAI_DEPART} jours entre une chambre libérée et l'entrée suivante, dont quinze d'attente de la commission et douze d'appels d'une liste que personne ne mettait à jour.`,
    prescripteurs:
      "En semaine 1, vous avez vu les prescripteurs : une vraie cause, qui a pesé dès l'arrivée d'Orchidia. Mais en décembre, le délai venait d'abord du circuit : une commission mensuelle, des dossiers incomplets, une liste jamais mise à jour.",
    prix: "En semaine 1, vous avez jugé le prix trop élevé ; deux familles sur dix-neuf l'avaient cité l'an dernier, et Orchidia s'installait 26 € plus cher. Onze avaient trouvé ailleurs pendant qu'on les faisait attendre.",
    notoriete:
      "En semaine 1, vous avez retenu un manque de notoriété ; soixante personnes étaient inscrites sur la liste. Ce qui manquait, c'était une réponse rapide aux demandes.",
  };
  const justes = ["circuit", "prescripteurs"];
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
    score: d === "circuit" ? 1 : d === "prescripteurs" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? `Vous n'avez jamais cherché à remplir par le prix ou la publicité, ni à admettre sans évaluer. Occupation moyenne du trimestre : ${taux(t.occupationMoyenne)}.`
        : `Vous avez cherché à remplir par le prix, la publicité ou une admission sans évaluation ${n} fois sur ${ETAPES.length} décisions. Occupation moyenne du trimestre : ${taux(t.occupationMoyenne)}. Une baisse se paie sur toutes les journées des places libres, une campagne allonge une liste qui ne manquait pas de noms, et une admission sur dossier seul dépasse trois fois sur dix ce que l'unité peut accompagner.`,
  };

  const calibrage = constatCalibrage(
    p,
    MANQUE_A_GAGNER_KE,
    "de manque à gagner annuel pour huit lits vides, en hébergement et en dépendance",
    "k€",
    { juste: 3, proche: 15 },
    (e) => `${nombre(e)} k€`,
  );

  const leviers = [
    p.chemin[D.lits] === O.lits.circuit,
    p.chemin[D.liste] === O.liste.appeler,
    p.chemin[D.prescripteurs] === O.prescripteurs.convention ||
      p.chemin[D.prescripteurs] === O.prescripteurs.reseau,
    p.chemin[D.evaluation] === O.evaluation.sous72h,
    p.chemin[D.printemps] === O.printemps.procedure,
  ];
  const tenus = leviers.filter(Boolean).length;
  const circuit: Constat = {
    score: tenus >= 4 ? 1 : tenus >= 2 ? 0.6 : 0,
    texte: `${
      leviers[0]
        ? "Vous avez resserré le circuit : commission chaque semaine, chambre prête en 48 heures."
        : "La commission d'admission est restée mensuelle."
    } ${
      leviers[1]
        ? "Vous avez fait appeler toute la liste : dix personnes sur soixante voulaient entrer."
        : "La liste d'attente n'a pas été reprise en entier."
    } ${
      leviers[2]
        ? "Vous êtes allée chercher les prescripteurs avant qu'Orchidia les prenne."
        : "Vous n'êtes pas allée au-devant des prescripteurs."
    } ${
      leviers[3]
        ? "Vous avez gardé l'évaluation, en trois jours au lieu de sept."
        : p.chemin[D.evaluation] === O.evaluation.surDossier
          ? `Vous avez admis sur dossier seul${t.inadaptees.length ? ` : ${t.inadaptees.length} admission${t.inadaptees.length > 1 ? "s ont" : " a"} dépassé ce que l'unité pouvait accompagner` : ""}.`
          : "La préadmission n'a pas été accélérée."
    } ${
      leviers[4]
        ? "Le circuit est écrit et suivi pour le printemps."
        : "Rien n'est écrit pour que le délai tienne au printemps."
    } Délai de vacance fin mars : ${jours(t.delaiFin)}, contre ${DELAI_DEPART} en décembre.`,
  };

  return [information, diagnostic, reflexe, calibrage, circuit];
}

export function axe([information, diagnostic, reflexe, calibrage, circuit]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chronométrer une chambre vide avant de toucher au prix",
      texte:
        "Rejouez l'épisode en reconstituant d'abord le parcours des dernières entrées : 52 jours entre une chambre libérée et l'entrée suivante, dont quinze d'attente de la commission et douze d'appels d'une liste périmée. C'est là que se perdaient les journées.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Raccourcir le délai, pas baisser le prix",
      texte:
        "Le nombre de lits vides, c'est le nombre de chambres libérées par semaine multiplié par le délai avant l'entrée suivante. Une baisse de prix ou une campagne n'y touchent pas ; une commission hebdomadaire, une liste à jour, des prescripteurs qui ont une réponse en 72 heures, si. Et admettre vite ne dispense jamais d'évaluer.",
    };
  }
  if (circuit!.score === 0) {
    return {
      titre: "Travailler le circuit d'admission étape par étape",
      texte:
        "Remise en état, commission, appels, dossier, visite, entrée : chaque étape a sa durée et son levier. Les gains ne tiennent que s'ils sont écrits et suivis chaque semaine.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où se perd le temps",
      texte:
        "Quand des lits restent vides alors que la liste d'attente est longue, la demande n'est pas en cause : décomposez le délai entre une chambre libérée et l'entrée suivante.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte: `Refaites le calcul de la semaine 1 : huit lits, 365 jours, ${RECETTE_JOUR} € par journée d'hébergement et de dépendance. Le forfait soins n'y entre pas : il ne dépend pas des journées à court terme.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions : d'autres sorties, une autre réponse de l'hôpital, une grippe qui s'étend ou non. Si le résultat tient, votre méthode tient.",
  };
}

const lectureVides = (v: number) => nombre(v, 1);

export const EPISODE_ADMISSIONS: Episode<Trimestre> = {
  code: "lits-vides",
  numero: 79,
  domaine: "Piloter les admissions",
  titre: "Les lits qui restent vides",
  resume:
    "Un EHPAD à 91 % d'occupation avec soixante noms sur la liste d'attente, et un siège qui veut baisser le prix. Un lit vide est un délai d'admission : le raccourcir, sans renoncer à évaluer.",
  persona:
    "Vous êtes Corentine Baradat, directrice de l'EHPAD de Beaune de l'Association Solvanne : 88 places, dont une unité protégée, et un pôle d'activités et de soins adaptés. Guillemette Bouchardat est votre infirmière coordinatrice, Dr Dorota Jeannenot votre médecin coordonnateur, Houria Chaudat tient l'accueil et les admissions. Au siège, à Dijon, Eudoxie Rambourg dirige les finances. Votre trimestre : janvier à mars, quand les épidémies d'hiver libèrent des chambres et que les admissions ralentissent.",
  mandat: [
    { fort: "97 %", texte: "de taux d'occupation, la cible des EHPAD de l'association" },
    { fort: `${RECETTE_JOUR} €`, texte: "d'hébergement et de dépendance par journée facturée" },
    {
      fort: kE(BUDGET_TRIMESTRE),
      texte: "de recettes au trimestre dans l'EPRD (95 % d'occupation)",
    },
    { fort: "Aucune", texte: "admission qui dépasse ce que l'établissement peut accompagner" },
  ],
  jugement:
    "Le siège juge le trimestre sur les recettes d'hébergement et de dépendance, moins ce qu'ont coûté les mesures et les admissions inadaptées, plus ce que le taux d'occupation de fin mars promet pour le printemps.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre établissement",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les demandes de l'hôpital restent sans réponse et partent ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...YAMINA,
        alerte: true,
        texte: `Pendant ce temps, faute de réponse, deux patients que nous vous avions adressés sont entrés ailleurs : ${euros(perdu)} de journées perdues pour vous.`,
      };
    },
  },
  prevision: {
    libelle:
      "le manque à gagner annuel de huit lits vides, en hébergement et en dépendance, en milliers d'euros",
    unite: "k€",
    placeholder: "250",
    min: 0,
    max: 2000,
    step: 0.1,
    reel: () => MANQUE_A_GAGNER_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "décembre"} ; cible ${taux(TAUX_CIBLE, 0)}`,
      jauge: (l) => {
        const o = l.occupation;
        if (o === null || o === undefined) return null;
        return { part: Math.min(1, o / TAUX_CIBLE), enRetard: o < TAUX_EPRD };
      },
    },
    {
      cle: "vides",
      nom: "Lits vides",
      format: lectureVides,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `fin de semaine ${semaine}, sur ${PLACES}` : `sur ${PLACES} places`,
    },
    {
      cle: "delai",
      nom: "Délai de vacance",
      format: jours,
      sensBon: -1,
      aide: () => "de la chambre libérée à l'entrée suivante",
    },
    {
      cle: "inscrits",
      nom: "Liste d'attente",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "inscrits, qu'ils veuillent entrer maintenant ou non",
    },
    {
      cle: "recettes",
      nom: "Recettes hébergement et dépendance",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `cumulées ; EPRD à date ${kE(l.budgetADate ?? 0)}`
          : `${kE(BUDGET_TRIMESTRE)} prévus au trimestre`,
    },
  ],
  contexte(l, decisions) {
    return {
      occupation: taux(l.occupation ?? 0),
      vides: nombre(l.vides ?? 0, 0),
      delai: jours(l.delai ?? 0),
      inscrits: nombre(l.inscrits ?? 0, 0),
      actifs: nombre(l.actifs ?? 0, 0),
      circuit: decisions[D.lits] === O.lits.circuit || decisions[D.liste] === O.liste.appeler,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const n = semaines.length;
    return [
      [`Occupation, sem. ${de} à ${a}`, taux(semaines.reduce((x, w) => x + w.occupation, 0) / n)],
      [`Délai de vacance, sem. ${a}`, jours(t.semaines[a]!.delai)],
      ["Recettes de la période", kE(semaines.reduce((x, w) => x + w.recettes, 0))],
    ];
  },
  courbe: {
    titre: "Taux d'occupation, semaine par semaine",
    cle: "occupation",
    cible: TAUX_CIBLE,
    libelleCible: `cible : ${taux(TAUX_CIBLE, 0)}`,
    graduations: [0.8, 0.85, 0.9, 0.95, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${lectureVides(s.vides!)} lits vides · délai de vacance ${jours(s.delai!)}`,
      `${nombre(s.admissions!, 1)} entrées, ${nombre(s.sorties!, 1)} sorties · ${nombre(s.actifs!, 0)} candidats prêts`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.prescripteurs && choix === O.prescripteurs.convention) {
      // L'hôpital répond à la convention selon le hasard du trimestre.
      const chemin = NEUTRE.map((n, i) => (i === D.prescripteurs ? choix : n));
      return [
        {
          ...YAMINA,
          texte: conventionAcceptee(chemin, graine)
            ? REPONSES.conventionOui
            : REPONSES.conventionNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.orchidia) {
      lies.push({
        ...ROCIO,
        heure: "sem. 7",
        texte: t.orchidiaSigne
          ? "Orchidia Résidences Beaune est heureuse d'annoncer sa convention avec le service social de l'hôpital : une réponse à chaque demande d'admission en 48 heures."
          : "Orchidia Résidences Beaune a accueilli ses premiers résidents. Nous restons à la disposition des services de l'hôpital pour toute demande.",
      });
      if (t.orchidiaSigne && t.convention) {
        lies.push({
          ...YAMINA,
          heure: "sem. 7",
          texte:
            "Nous avons aussi signé avec Orchidia : les demandes seront partagées entre vous deux, à qui répondra le premier.",
        });
      }
    }
    for (const x of arrive.inadaptees) {
      lies.push({
        ...MARIETOU,
        heure: `sem. ${x.semaine}`,
        alerte: true,
        texte:
          "La résidente arrivée cette semaine ne dort pas, se lève toutes les heures et cherche la sortie. Elle est tombée cette nuit, sans fracture. À deux pour 88, on ne peut pas la suivre et faire le reste : il faut un renfort de nuit.",
      });
    }
    for (const x of arrive.reorientations) {
      lies.push({
        ...DOROTA,
        heure: `sem. ${x.reorientation}`,
        texte:
          "La résidente entrée il y a un mois est réorientée vers l'unité d'hébergement renforcé de Dijon, qui peut l'accompagner. Sa chambre se libère.",
      });
    }
    if (arrive.grippeEtendue) {
      lies.push({
        ...DOROTA,
        heure: `sem. 11`,
        alerte: true,
        texte:
          "La grippe a gagné l'aile du Parc : quatre nouveaux cas. Sur l'avis de l'équipe d'hygiène, les entrées sont suspendues là aussi jusqu'à huit jours après le dernier cas.",
      });
      if (chemin[D.grippe] === O.grippe.cibler) {
        lies.push({
          ...HOURIA,
          heure: "sem. 11",
          texte:
            "J'ai dû annuler deux entrées prévues jeudi. Une famille m'a dit qu'elle allait voir Orchidia.",
        });
      }
    }
    if (chemin[D.liste] === O.liste.courrier && de <= 6 && a >= 6) {
      lies.push({
        ...HOURIA,
        heure: "sem. 6",
        texte:
          "Vingt-sept coupons sont revenus : vingt-sept familles qui n'ont plus besoin d'une place chez nous. Les autres n'ont pas répondu ; je ne sais pas ce qu'elles veulent.",
      });
    }
    if (chemin[D.lits] === O.lits.campagne && de <= 8 && a >= 8) {
      lies.push({
        ...GUILLEMETTE,
        heure: "sem. 8",
        texte:
          "La campagne a amené une dizaine d'inscriptions. Pour la plupart, des enfants qui inscrivent un parent « au cas où, pour plus tard ».",
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
    titre: (t) =>
      `${kE(t.objectif)} de recettes, coûts déduits, printemps compris : ${kESigne(t.printemps)} sur un printemps à 91 %`,
    formatObjectif: kE,
    noteDesBarres:
      "Recettes d'hébergement et de dépendance du trimestre, moins les mesures et les admissions inadaptées, plus l'effet estimé sur avril à juin, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Occupation fin mars",
          valeur: taux(t.occupationFin),
          aide: `${nombre(t.videsFin, 1)} lits vides ; cible ${taux(TAUX_CIBLE, 0)}, ${VIDES_DEPART} lits vides en décembre`,
          tenu: t.occupationFin >= TAUX_EPRD,
        },
        {
          nom: "Délai de vacance",
          valeur: jours(t.delaiFin),
          aide: `en semaine 13 ; ${DELAI_DEPART} jours en décembre, visé ${DELAI_VISE}`,
          tenu: t.delaiFin <= DELAI_VISE,
        },
        {
          nom: "Recettes du trimestre",
          valeur: kE(t.recettes),
          aide: `hébergement et dépendance ; EPRD ${kE(BUDGET_TRIMESTRE)}`,
          tenu: t.recettes >= BUDGET_TRIMESTRE,
        },
        {
          nom: "Admissions inadaptées",
          valeur: nombre(t.inadaptees.length, 0),
          aide: t.inadaptees.length
            ? `${euros(t.inadaptees.length * COUT_INADAPTEE)} de renfort de nuit, et une réorientation chacune`
            : "aucune admission au-delà de ce que l'unité peut accompagner",
          tenu: t.inadaptees.length === 0,
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
          titre: "L'hôpital et Orchidia",
          texte: [
            t.convention ? "l'hôpital a signé votre convention" : null,
            t.orchidiaSigne
              ? "Orchidia a signé la sienne avec l'hôpital"
              : "Orchidia n'a pas obtenu de convention avec l'hôpital",
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
        {
          titre: "L'hiver",
          texte: `${nombre(t.sorties, 0)} chambres libérées dans le trimestre ; ${
            t.grippeEtendue
              ? "la grippe a gagné une deuxième aile en semaine 11"
              : "la grippe est restée dans l'aile des Tilleuls"
          }${
            t.inadaptees.length
              ? ` ; ${t.inadaptees.length} admission${t.inadaptees.length > 1 ? "s ont" : " a"} dépassé ce que l'unité pouvait accompagner`
              : ""
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
