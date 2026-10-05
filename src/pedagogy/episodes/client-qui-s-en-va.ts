/**
 * ÉPISODE 20 — LE CLIENT QUI S'EN VA, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Arthur montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 *
 * Le tableau de bord montre ce qu'un responsable de la relation client voit
 * vraiment : des artisans actifs qui baissent lentement, des réclamations qui
 * ne bougent pas — les clients qui partent ne se plaignent pas —, et les
 * artisans dont les commandes baissent seulement quand quelqu'un a décidé de
 * les suivre.
 */
import {
  ACTIFS_BUDGET,
  BUDGET_MARGE,
  D,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAFOND_DEPARTS,
  SEMAINES,
  appelsTenus,
  evenements,
  hasard,
  kayaPart,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/client-qui-s-en-va";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/client-qui-s-en-va";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const artisans = (v: number) => nombre(v, 0);
/** Un écart au budget : positif, le trimestre a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient qui partait, et pourquoi",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    irritant:
      "Votre diagnostic de la semaine 1 était juste : un irritant précis, l'attente au comptoir à l'ouverture, faisait partir les artisans sans un mot. Ils commandaient moins, puis plus du tout.",
    facturation:
      "En semaine 1, vous avez vu les erreurs de facturation : un vrai irritant, celui dont les artisans se plaignent. Mais ceux qui partaient ne se plaignaient pas ; ils partaient pour l'attente du matin.",
    prix: "En semaine 1, vous avez retenu le prix ; l'écart avec les concurrents n'avait pas bougé en un an, et trois artisans partis sur vingt seulement en parlaient.",
    marche:
      "En semaine 1, vous avez retenu un marché qui se contracte ; les artisans partis travaillaient toujours, chez un autre négoce.",
  };
  const justes = ["irritant", "facturation"];
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
    score: d === "irritant" ? 1 : d === "facturation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu aux départs par des points ou des remises pour tous : vous avez cherché pourquoi les artisans partaient, et visé ceux qui allaient partir."
        : `Face aux départs, vous avez payé tout le monde — points, remises, alignement — ${n} fois sur ${ETAPES.length} décisions. Ces gestes allaient surtout aux neuf artisans sur dix qui ne partaient pas : ${kE(t.couts)} d'actions sur le trimestre.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.actifs,
    "d'artisans actifs en semaine 3",
    "artisans",
    { juste: 4, proche: 12 },
    (e) => `${nombre(e, 0)} artisan${e >= 1.5 ? "s" : ""}`,
  );

  const irritantTraite = p.chemin[D.irritant] === 0;
  const signaux = p.chemin[D.signaux] === 0 || p.chemin[D.signaux] === 1;
  const suivi = p.chemin[D.suivi] === 1;
  const points = (irritantTraite ? 1 : 0) + (signaux ? 1 : 0) + (suivi ? 1 : 0);
  const avantLeDepart: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : 0,
    texte: `${
      irritantTraite
        ? "Vous avez traité l'irritant à sa source : le comptoir du matin."
        : "L'attente au comptoir du matin n'a pas été traitée : elle a continué de faire passer des fidèles dans la zone de baisse."
    } ${
      signaux
        ? "Vous avez agi sur les artisans dont les commandes baissaient, avant qu'ils ne partent."
        : "Les artisans dont les commandes baissaient n'ont reçu ni appel ni geste ciblé."
    } ${
      suivi
        ? "Et une alerte les signalera désormais chaque lundi."
        : "Rien ne les signalera au trimestre prochain."
    }${t.kayaPart ? " Kaya Rénovation est partie en semaine 7, sans s'être jamais plainte." : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, avantLeDepart];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  avantLeDepart,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Demander à ceux qui partent pourquoi ils partent",
      texte:
        "Rejouez l'épisode en appelant d'abord des artisans partis et en regardant la fréquence de commande de chacun : treize sur vingt citaient l'attente du matin, et neuf sur dix avaient commandé moins pendant des semaines avant de disparaître.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter la cause plutôt que payer tout le monde",
      texte:
        "Un programme de points ou une remise générale rémunèrent d'abord les clients qui restaient. Cherchez l'irritant qui fait partir les autres, et réservez l'argent à ceux qui sont en train de partir.",
    };
  }
  if (avantLeDepart!.score === 0) {
    return {
      titre: "Agir avant que le client ne parte",
      texte:
        "Un client qui part commande d'abord moins pendant des semaines. Suivez la fréquence de commande, appelez ceux qui baissent, et réglez ce qui les agace : les retenir coûte bien moins que les faire revenir.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher l'irritant derrière le départ",
      texte:
        "Les réclamations disent ce qui agace ceux qui restent. Ceux qui partent ne réclament pas : il faut aller leur demander, et regarder ce qu'ils vivent au comptoir.",
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

const MALIK = { de: "Lamine Ndiaye", role: "Commercial terrain" } as const;
const GREGORY = { de: "Grégory Tavares", role: "Chef des ventes" } as const;

export const EPISODE_FIDELISATION: Episode<Trimestre> = {
  code: "client-qui-s-en-va",
  numero: 20,
  domaine: "Fidélisation client",
  titre: "Le client qui s'en va",
  resume:
    "Des artisans qui partent sans se plaindre, un programme de points prêt à partir, des commerciaux qui réclament des remises. Chercher qui part, et pourquoi, avant de payer tout le monde.",
  persona:
    "Vous êtes Arthur Barbier, responsable de la relation client des artisans d'Arvel Distribution pour l'Est lyonnais, à Vaulx-en-Velin. Votre périmètre : 920 artisans actifs, six agences et huit commerciaux terrain, avec une enveloppe d'actions de fidélisation pour le trimestre.",
  mandat: [
    { fort: "920", texte: "artisans actifs aujourd'hui, contre 985 il y a six mois" },
    { fort: `${ACTIFS_BUDGET}`, texte: "artisans actifs au moins en fin de trimestre, au budget" },
    { fort: kE(BUDGET_MARGE), texte: "de marge des artisans sur le trimestre, au budget" },
    { fort: kE(ENVELOPPE), texte: "d'enveloppe pour les actions de fidélisation" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge des artisans, plus la valeur des clients conservés en fin de trimestre, moins ce qu'ont coûté vos actions — points, remises, renforts, appels —, en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos artisans",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des artisans qui attendaient un signe passent leurs commandes ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Isaure Sarrazin",
        role: "Directrice commerciale régionale",
        alerte: true,
        texte: `Pendant ce temps, deux entreprises de plâtrerie ont passé leurs commandes de chantier ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre d'artisans actifs en fin de semaine 3",
    unite: "artisans",
    placeholder: "910",
    min: 700,
    max: 1100,
    step: 1,
    reel: (t) => t.semaines[3]!.actifs,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "actifs",
      nom: "Artisans actifs",
      format: artisans,
      sensBon: 1,
      aide: () => `au moins une commande sur huit semaines ; budget : ${ACTIFS_BUDGET}`,
    },
    {
      cle: "enBaisse",
      nom: "Artisans dont les commandes baissent",
      format: artisans,
      sensBon: -1,
      aide: (_, l) =>
        l.enBaisse == null
          ? "non suivi : personne ne le mesure"
          : "commandes en baisse de 40 % ou plus sur huit semaines",
    },
    {
      cle: "reclamations",
      nom: "Réclamations reçues",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `en semaine ${semaine}` : "la semaine dernière"),
    },
    {
      cle: "marge",
      nom: "Marge des artisans à date",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.margeADate ?? 0)} sur ${kE(BUDGET_MARGE)}`
          : `${kE(BUDGET_MARGE)} au budget du trimestre`,
      jauge: (l) =>
        l.margeADate
          ? {
              part: Math.max(0, Math.min(1, (l.marge ?? 0) / BUDGET_MARGE)),
              enRetard: (l.marge ?? 0) < l.margeADate,
            }
          : null,
    },
    {
      cle: "couts",
      nom: "Coût des actions à date",
      format: kE,
      sensBon: -1,
      aide: () => `enveloppe du trimestre : ${kE(ENVELOPPE)}`,
    },
  ],
  contexte(l, decisions) {
    return {
      actifs: artisans(l.actifs ?? 0),
      enBaisse: l.enBaisse == null ? "non suivi" : artisans(l.enBaisse),
      reclamations: nombre(l.reclamations ?? 0, 0),
      departs: nombre(l.departs ?? 0, 0),
      attente: `${nombre(l.attente ?? 0, 0)} minutes`,
      zone: Math.round((l.enBaisse ?? 0) * 0.4),
      liste: decisions[D.lancement] === 1,
      express: decisions[D.irritant] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const perdus = semaines.reduce((x, w) => x + w.departs, 0);
    const contribution = semaines.reduce((x, w) => x + w.margeSemaine - w.cout, 0);
    return [
      [`Artisans actifs, sem. ${a}`, artisans(t.semaines[a]!.actifs)],
      ["Artisans perdus sur la période", artisans(perdus)],
      ["Marge nette des actions", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Artisans perdus, semaine par semaine",
    cle: "departs",
    cible: PLAFOND_DEPARTS,
    libelleCible: `objectif : ${PLAFOND_DEPARTS} par semaine au plus`,
    graduations: [5, 10, 15, 20],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${artisans(s.departs!)} artisans perdus · ${artisans(s.actifs!)} actifs`,
      `${artisans(s.enBaisse!)} en baisse · attente le matin ${nombre(s.attente!, 0)} min`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.signaux && choix === 0) {
      // Seul le choix d'appeler compte : l'équipe tient les appels ou non, selon le hasard du trimestre.
      return [
        { ...GREGORY, texte: appelsTenus(graine) ? REPONSES.appelsTenus : REPONSES.appelsManques },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.kayaPart || arrive.kayaReste) {
      lies.push({
        ...MALIK,
        heure: "sem. 7",
        alerte: arrive.kayaPart,
        texte: kayaPart(chemin, graine) ? REPONSES.kayaPart : REPONSES.kayaReste,
      });
    }
    if (de <= 8 && a >= 8 && (chemin[D.reconquete] === 0 || chemin[D.reconquete] === 1)) {
      const t = simuler(chemin, graine);
      const n = Math.round(
        chemin[D.reconquete] === 0
          ? t.semaines[8]!.retours + t.semaines[9]!.retours
          : t.semaines[8]!.retours,
      );
      lies.push({
        ...(chemin[D.reconquete] === 0 ? GREGORY : MALIK),
        heure: "sem. 8",
        texte:
          chemin[D.reconquete] === 0
            ? REPONSES.reconquete(n)
            : chemin[D.irritant] === 0
              ? REPONSES.visitesReussies(n)
              : REPONSES.visitesVaines(n),
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, valeur des clients conservés comprise`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget — marge des artisans, plus la valeur des clients conservés en fin de trimestre, moins le coût des actions — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Artisans actifs",
          valeur: artisans(t.actifsFinal),
          aide: `en semaine ${SEMAINES} ; budget ${ACTIFS_BUDGET}`,
          tenu: t.actifsFinal >= ACTIFS_BUDGET,
        },
        {
          nom: "Artisans perdus",
          valeur: artisans(t.departsTotal),
          aide: `sur le trimestre ; objectif ${PLAFOND_DEPARTS * SEMAINES} au plus`,
          tenu: t.departsTotal <= PLAFOND_DEPARTS * SEMAINES,
        },
        {
          nom: "Marge des artisans",
          valeur: kE(t.marge),
          aide: `sur le trimestre ; budget ${kE(BUDGET_MARGE)}`,
          tenu: t.marge >= BUDGET_MARGE,
        },
        {
          nom: "Coût des actions",
          valeur: kE(t.couts),
          aide: `sur le trimestre ; enveloppe ${kE(ENVELOPPE)}`,
          tenu: t.couts <= ENVELOPPE,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.appelsLances
          ? [
              {
                titre: "Les commerciaux",
                texte: t.appelsTenus
                  ? "ont passé presque tous les appels aux artisans en baisse."
                  : "n'ont passé qu'une trentaine des appels prévus, pris par la reprise des chantiers.",
              },
            ]
          : []),
        {
          titre: "Vos clients",
          texte: `${
            t.kayaPart ? "Kaya Rénovation est partie en semaine 7" : "Kaya Rénovation est restée"
          } ; ${artisans(t.retoursTotal)} artisan${t.retoursTotal >= 1.5 ? "s" : ""} parti${
            t.retoursTotal >= 1.5 ? "s sont revenus" : " est revenu"
          } dans le trimestre.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
