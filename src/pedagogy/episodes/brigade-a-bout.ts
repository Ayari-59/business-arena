/**
 * ÉPISODE 55 — LA BRIGADE À BOUT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la cuisine d'Elio montre, ce
 * que la courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET,
  CHEF_EXTRA,
  D,
  HEURES_SUP_DEPART,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEMAINES,
  SEUIL_PIC,
  evenements,
  groupesDeplaces,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/brigade-a-bout";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/brigade-a-bout";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
const couverts = (v: number) => `${nombre(v)} couverts`;
/** Un écart au budget de marge : positif, le restaurant a fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= BUDGET
    ? `${kE(v)} de marge, ${kE(v - BUDGET)} au-dessus du budget`
    : `${kE(v)} de marge, ${kE(BUDGET - v)} sous le budget`;
/** Le repère des heures supplémentaires : 40 par semaine au plus, sur le trimestre. */
export const PLAFOND_HEURES_SUP = 40 * SEMAINES;
export const PLAFOND_RETOURS = 0.02;

const LUBIN = { de: "Lubin Haenni", role: "Second de cuisine" } as const;
const ELOI = { de: "Eloi Duraffourg", role: "Commercial groupes, siège" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un chef de cuisine les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le planning de septembre et le chronométrage du coup de feu",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    pics: "Votre diagnostic de la semaine 1 était juste : la brigade était organisée à plat, coupures et planning de la veille compris, alors que le travail arrivait d'un bloc le samedi soir.",
    effectif:
      "En semaine 1, vous avez vu une brigade qui fait trop d'heures : c'était vrai, mais le volume n'avait pas bougé depuis le printemps. Ce qui l'usait, c'étaient les coupures et le planning de la veille, et ce qui la débordait, un coup de feu à 22,5 couverts par cuisinier quand les midis creux en avaient cinq pour 64 couverts.",
    motivation:
      "En semaine 1, vous avez retenu le manque d'engagement de la brigade ; les absences tombaient le samedi et le lendemain des fermetures tardives, et Lou-Anne cherchait ailleurs faute de connaître ses horaires.",
    technique:
      "En semaine 1, vous avez retenu le niveau des commis ; les assiettes retournées venaient presque toutes du samedi soir, 7 % contre 1,2 % le reste de la semaine, avec les mêmes cuisiniers.",
  };
  const justes = ["pics", "effectif"];
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
    score: d === "pics" ? 1 : d === "effectif" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la pression par des heures en plus ou en prenant tout ce que la saison offrait : vous avez organisé le travail autour du coup de feu."
        : `Sous la pression, vous avez choisi ${n} fois sur ${ETAPES.length} décisions des heures en plus ou tout ce que la saison offrait : heures supplémentaires pour toute la brigade, groupes du samedi, carte de fêtes à la minute, tables poussées. Les heures ne réglaient pas le pic, et ce que vous preniez en plus tombait sur lui.${
            t.secondPart ? " Lubin est parti avant les fêtes." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.coupDeFeuDepart,
    "par cuisinier au coup de feu du samedi soir",
    "couverts",
    { juste: 1, proche: 3 },
    (e) => `${nombre(e)} couvert${e >= 2 ? "s" : ""}`,
  );

  // Le pic organisé : un planning bâti sur lui, et la charge qu'on en sort.
  const planning = p.chemin[D.planning] === 1;
  const groupes = p.chemin[D.groupes] === 1;
  const carte = p.chemin[D.carte] === 1;
  const services = p.chemin[D.fetes] === 1;
  const bons = [planning, groupes, carte, services].filter(Boolean).length;
  const pic: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      planning
        ? "Vous avez bâti le planning sur le samedi soir : un cuisinier de plus au coup de feu, pris sur les midis creux."
        : "Le planning est resté bâti à plat : le coup de feu du samedi n'a pas eu ses cuisiniers."
    } ${
      groupes
        ? "Vous avez gardé les repas de groupe hors du samedi soir, où la salle était déjà pleine."
        : "Des repas de groupe sont tombés sur le samedi soir, où ils remplaçaient des clients à la carte et chargeaient le pic d'un bloc."
    } ${
      carte && services
        ? "La carte de décembre et les deux services des soirs de fêtes ont étalé le coup de feu."
        : carte
          ? "La carte de décembre était pensée pour le coup de feu ; les soirs de fêtes, le pic est resté entier."
          : services
            ? "Les deux services ont étalé les soirs de fêtes ; la carte de décembre, elle, n'était pas pensée pour le coup de feu."
            : "Ni la carte de décembre ni les soirs de fêtes n'ont été pensés pour le coup de feu."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, pic];
}

export function axe([information, diagnostic, reflexe, calibrage, pic]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder à quelle heure le travail arrive",
      texte:
        "Rejouez l'épisode en relisant d'abord le planning de septembre et en chronométrant le coup de feu du samedi : les heures n'avaient pas bougé depuis le printemps, les coupures avaient doublé, et quatre cuisiniers envoyaient 90 couverts en une heure et demie.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Organiser le pic plutôt qu'ajouter des heures",
      texte:
        "En cuisine, la charge ne se mesure pas à la semaine mais au coup de feu. Des heures en plus usent la brigade sans mettre un cuisinier de plus au passe à 20 h 30 ; un planning stable, des commis polyvalents et une carte pensée pour le pic, si.",
    };
  }
  if (pic!.score === 0) {
    return {
      titre: "Sortir la charge du coup de feu",
      texte:
        "Un groupe le samedi soir prend la place de clients à la carte et charge le pic d'un bloc ; le même groupe un mardi est tout en plus. Déplacez ce qui peut l'être hors du pic : groupes en semaine, services à heures fixes, carte qui se dresse vite.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où la charge se concentre",
      texte:
        "Une brigade peut faire des heures normales sur la semaine et déborder deux heures par semaine. Avant de juger le volume ou les personnes, regardez quand le travail arrive et comment le planning y répond.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du coup de feu",
      texte:
        "Cent vingt couverts, dont les trois quarts entre 20 h et 21 h 30, pour quatre cuisiniers au passe : 22,5 couverts par cuisinier, quand le repère est de 18. C'est ce chiffre qui disait où mettre le cinquième.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_BRIGADE: Episode<Trimestre> = {
  code: "brigade-a-bout",
  numero: 56,
  domaine: "Management en cuisine",
  titre: "La brigade à bout",
  resume:
    "Une brigade de neuf à bout avant les fêtes : heures supplémentaires, absences, assiettes retournées le samedi soir. Organiser le travail autour du coup de feu plutôt qu'ajouter des heures.",
  persona:
    "Vous êtes Elio Santoni, chef de cuisine de La Table d'Augustin de Chambéry, le restaurant bistronomique du Groupe Escale au centre de la ville : 85 places, ticket moyen de 41 € le soir. Votre brigade : neuf personnes, dont vous, un second, deux chefs de partie, deux commis, un apprenti et deux plongeurs. Le trimestre va d'octobre à décembre : novembre creux, puis les repas d'entreprise et les fêtes.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge du restaurant sur le trimestre, au moins" },
    { fort: `${SEUIL_PIC} couverts`, texte: "par cuisinier au coup de feu du samedi, au plus" },
    { fort: "2 %", texte: "d'assiettes retournées, au plus" },
    { fort: "la brigade", texte: "au complet pour les fêtes" },
  ],
  jugement:
    "Le groupe juge le trimestre sur la marge du restaurant : chiffre d'affaires moins le coût matière et le coût de la brigade, heures supplémentaires, extras, recrutements et assiettes retournées compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre cuisine",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la brigade passe un samedi de plus organisée comme avant.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Théo Garrigues",
        role: "Directeur de la restauration, Groupe Escale",
        alerte: true,
        texte: `Pendant ce temps, un samedi de plus à quatre au passe : assiettes retournées, gestes commerciaux et heures en plus, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de couverts par cuisinier au coup de feu du samedi soir, aujourd'hui",
    unite: "couverts",
    placeholder: "15",
    min: 0,
    max: 120,
    step: 0.5,
    reel: (t) => t.coupDeFeuDepart,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "margeCumulee",
      nom: "Marge du restaurant",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.margeCumulee ?? 0) / BUDGET)),
              enRetard: (l.margeCumulee ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "chargePic",
      nom: "Couverts par cuisinier au coup de feu",
      format: (v) => nombre(v),
      sensBon: -1,
      aide: () => `samedi soir, de 20 h à 21 h 30 ; repère : ${SEUIL_PIC} au plus`,
    },
    {
      cle: "heuresSup",
      nom: "Heures supplémentaires",
      format: heures,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `de la brigade, en semaine ${semaine} ; septembre : ${HEURES_SUP_DEPART} par semaine`
          : "de la brigade, par semaine en septembre",
    },
    {
      cle: "absences",
      nom: "Jours d'absence",
      format: (v) => `${nombre(v)} j`,
      sensBon: -1,
      aide: (semaine) => (semaine ? `en semaine ${semaine}` : "par semaine en septembre"),
    },
    {
      cle: "retours",
      nom: "Assiettes retournées",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "part des assiettes servies ; objectif : 2 % au plus",
    },
  ],
  contexte(l, decisions) {
    return {
      marge: kE(l.margeCumulee ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      chargePic: nombre(l.chargePic ?? 0),
      heuresSup: nombre(l.heuresSup ?? 0, 0),
      absences: nombre(l.absences ?? 0),
      retours: taux(l.retours ?? 0),
      planningStable: decisions[D.planning] === 1,
      secondPart: (l.secondPart ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.marge, 0);
    const hs = semaines.reduce((x, w) => x + w.heuresSup, 0);
    return [
      ["Marge de la période", kE(marge)],
      [`Coup de feu, sem. ${a}`, `${nombre(t.semaines[a]!.chargePic)} couverts par cuisinier`],
      ["Heures supplémentaires", heures(hs)],
    ];
  },
  courbe: {
    titre: "Couverts par cuisinier au coup de feu du samedi, semaine par semaine",
    cle: "chargePic",
    cible: SEUIL_PIC,
    libelleCible: `repère : ${SEUIL_PIC} couverts au plus`,
    graduations: [10, 20, 30, 40],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.chargePic!)} couverts par cuisinier · ${taux(s.retours!)} d'assiettes retournées`,
      `${heures(s.heuresSup!)} supplémentaires · ${nombre(s.absences!)} jours d'absence`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.groupes && choix === 1) {
      // Les entreprises du samedi acceptent ou non un autre soir, selon le hasard du trimestre.
      return [
        { ...ELOI, texte: groupesDeplaces(graine) === 3 ? REPONSES.deplaces3 : REPONSES.deplaces1 },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.secondAnnonce) {
      lies.push({ ...LUBIN, heure: "sem. 8", alerte: true, texte: REPONSES.secondAnnonce });
    }
    if (arrive.secondPart) {
      lies.push({
        de: "Marwa Selmi",
        role: "Ressources humaines, siège",
        heure: "sem. 10",
        texte:
          chemin[D.polyvalence] === 2
            ? "Lubin est parti samedi. Le cabinet cherche un second ; d'ici là, Malcolm Vuillet tient son poste et vous prenez le passe."
            : `Lubin est parti samedi. Le cabinet cherche un second ; d'ici là, un chef de partie en extra le remplace, à ${euros(CHEF_EXTRA)} la journée.`,
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
    titre: (t) => ecartAuBudget(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Marge du restaurant, coût matière, brigade, heures supplémentaires, extras, recrutements et assiettes retournées compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge du restaurant",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.marge >= BUDGET,
        },
        {
          nom: "Coup de feu du samedi",
          valeur: couverts(t.chargeSamediMoyenne),
          aide: `par cuisinier, en moyenne ; repère ${SEUIL_PIC}`,
          tenu: t.chargeSamediMoyenne <= SEUIL_PIC,
        },
        {
          nom: "Heures supplémentaires",
          valeur: heures(t.heuresSup),
          aide: `sur le trimestre ; repère ${heures(PLAFOND_HEURES_SUP)}, septembre en rythme ${heures(HEURES_SUP_DEPART * SEMAINES)}`,
          tenu: t.heuresSup <= PLAFOND_HEURES_SUP,
        },
        {
          nom: "La brigade",
          valeur: t.secondPart ? "8 sur 9" : "9 sur 9",
          aide: t.secondPart ? "Lubin est parti avant les fêtes" : "au complet pour les fêtes",
          tenu: !t.secondPart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.deplaces
          ? [
              {
                titre: "Les entreprises du samedi",
                texte:
                  t.deplaces === 3
                    ? "trois sur cinq ont accepté un autre soir."
                    : "une seule sur cinq a accepté un autre soir.",
              },
            ]
          : []),
        {
          titre: "La brigade",
          texte: `${
            t.secondPart
              ? "Lubin a démissionné en semaine 8 et manqué aux fêtes"
              : "Lubin est resté jusqu'aux fêtes"
          } ; le risque qu'il parte, au vu de l'usure de la brigade et du planning de décembre, était de ${taux(t.risqueSecond, 0)}.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
