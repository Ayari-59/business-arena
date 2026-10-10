/**
 * ÉPISODE 53 — LES CHAMBRES PAS PRÊTES À 15 H, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord des étages de Djeneba montre, ce
 * que la courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  D,
  GRAND_COMPTE,
  GROUPE,
  JOURS_SANS_PERTE,
  MARGE_NUITEE,
  NEUTRE,
  NOTE,
  PERTE_PAR_JOUR,
  SEMAINES,
  adhesion,
  complementaires,
  evenements,
  hasard,
  RENFORT_SALON,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/chambres-pas-pretes";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/chambres-pas-pretes";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 1)} h`;
const note = (v: number) => `${nombre(v, 2)} / 10`;
const chambres = (v: number) => nombre(v, 1);
/** Un écart au budget : positif, l'hébergement est resté en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

/** L'objectif des tuiles : une chambre pas prête au plus par jour chargé, un client qui attend par jour chargé. */
export const OBJECTIF_NON_PRETES = 1;
export const OBJECTIF_ATTENTES = 52;

const MARGARETHE = {
  de: "Margarethe Stucki",
  role: "Responsable des voyages, Helvardis",
} as const;
const KWAME = { de: "Kwame Asante", role: "Responsable des formations, Navelis Aéro" } as const;

/** Les choix qui ont fait venir des intérimaires, partout où le flux n'avait pas été traité. */
const nbReflexes = (chemin: readonly number[]) =>
  REFLEXES.filter(([dec, o]) => chemin[dec] === o).length;

/** Ce que les décisions révèlent, dans l'ordre où une gouvernante générale les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la lingerie et la feuille d'étage, qui montraient à quelle heure l'équipe n'avait rien à faire",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    flux: "Votre diagnostic de la semaine 1 était juste : l'équipe attendait le linge chaque matin, et les chambres attendues à 13 h n'étaient pas faites en premier.",
    ordre:
      "En semaine 1, vous avez vu l'ordre des chambres : une vraie cause des attentes, mais pas des heures perdues. Quatre heures d'équipe s'en allaient chaque jour chargé à attendre le linge.",
    effectif:
      "En semaine 1, vous avez retenu le manque de monde ; l'équipe passait quatre heures par jour chargé à attendre le linge. Ce n'étaient pas des bras qui manquaient, mais des draps.",
    productivite:
      "En semaine 1, vous avez retenu la lenteur de l'équipe, sur la foi d'une comparaison avec un hôtel qui fait plus de recouches ; les temps standards étaient tenus, c'est le linge qui manquait.",
  };
  const justes = ["flux", "ordre"];
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
    score: d === "flux" ? 1 : d === "ordre" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = nbReflexes(p.chemin);
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu aux chambres pas prêtes par des intérimaires : vous avez d'abord cherché ce qui bloquait le flux."
        : `Face aux chambres pas prêtes, vous avez fait venir des intérimaires ${n} fois sur ${ETAPES.length} décisions, pour ${nombre(t.heuresInterim, 0)} heures d'intérim. Ils attendaient le linge comme l'équipe, faisaient les deux tiers de son travail, et oubliaient plus souvent : ${nombre(t.defauts, 0)} chambres avec un oubli sur le trimestre.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.heuresPerduesLundi,
    "d'équipe perdues à attendre le linge le lundi décrit en semaine 1",
    "heures",
    { juste: 0.5, proche: 1.5 },
    (e) => `${nombre(e)} heure${e >= 2 ? "s" : ""}`,
  );

  // Le flux : le linge, l'ordre des chambres, les recouches proposées, l'arrivée du groupe préparée.
  const linge = p.chemin[D.premier] === 1;
  const ordre = p.chemin[D.ordre] === 0;
  const recouche = p.chemin[D.recouche] === 0;
  const groupe = p.chemin[D.groupe] === 0 || p.chemin[D.groupe] === 2;
  const bons = [linge, ordre, recouche, groupe].filter(Boolean).length;
  const flux: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      linge
        ? "Vous avez levé le goulot du linge : l'équipe n'attendait plus les draps de 11 h 30."
        : "Le linge du matin est resté à dix-huit départs : l'équipe a continué d'attendre les draps de 11 h 30."
    } ${
      ordre
        ? "Vous avez fait passer d'abord les chambres attendues avant 15 h."
        : "Les chambres attendues à 13 h n'ont pas été faites en premier."
    } ${
      recouche
        ? "Vous avez proposé la recouche à la demande, au lieu de l'imposer ou de la bâcler."
        : "Les recouches n'ont pas libéré de temps sans coût pour les clients."
    } ${
      groupe
        ? "L'arrivée du groupe a été réglée avant le mardi, et non au comptoir."
        : "L'arrivée du groupe s'est jouée au comptoir."
    }${t.grandCompteParti ? " Helvardis est parti chez Orméa Hotels." : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, flux];
}

export function axe([information, diagnostic, reflexe, calibrage, flux]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder à quelle heure l'équipe attend",
      texte:
        "Rejouez l'épisode en passant d'abord une matinée à la lingerie et en relisant la feuille d'étage : l'équipe perdait quatre heures par jour chargé à attendre les draps, exactement ce qui manquait à 15 h.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Lever la contrainte avant d'ajouter des bras",
      texte:
        "Des intérimaires de plus attendent le linge comme l'équipe, font les deux tiers de son travail et oublient plus souvent. Cherchez d'abord ce qui fait attendre ceux qui sont déjà là : le linge, puis l'ordre des chambres.",
    };
  }
  if (flux!.score === 0) {
    return {
      titre: "Faire les chambres dans l'ordre des arrivées",
      texte:
        "À 15 h, ce qui compte n'est pas le nombre de chambres prêtes, mais que celle de chaque client le soit quand il arrive. La liste d'arrivées de la réception dit lesquelles faire d'abord.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui bloque le flux",
      texte:
        "Quand le travail ne sort pas à l'heure, regardez d'abord quand et pourquoi l'équipe n'a rien à faire, puis dans quel ordre elle travaille, avant de juger sa vitesse ou son effectif.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte:
        "Six personnes de 8 h 15 à 11 h 30, c'est 19 h 30 de présence ; dix-huit départs et les quinze recouches libres, c'est 15 h 30 de travail. Les quatre heures d'écart sont perdues à attendre le linge.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_HEBERGEMENT: Episode<Trimestre> = {
  code: "chambres-pas-pretes",
  numero: 55,
  domaine: "Hébergement et étages",
  titre: "Les chambres pas prêtes à 15 h",
  resume:
    "Un hôtel d'affaires où les chambres ne sont pas prêtes quand les clients arrivent. Lever ce qui bloque le flux, le linge et l'ordre des chambres, avant d'ajouter des bras.",
  persona:
    "Vous êtes Djeneba Touré, gouvernante générale de L'Escale Annemasse, l'hôtel 3 étoiles de 78 chambres du Groupe Escale, à la frontière de Genève. Votre équipe : neuf femmes et valets de chambre, dont six aux étages les jours chargés, Rosine Kabongo, gouvernante d'étage, et Zahia Merabet, lingère. De janvier à mars, la clientèle d'affaires remplit l'hôtel du lundi au jeudi : départs tôt, arrivées dès 13 h.",
  mandat: [
    { fort: "15 h", texte: "les chambres des clients qui arrivent, prêtes" },
    { fort: kE(BUDGET), texte: "de budget de l'hébergement (heures, intérim, linge)" },
    { fort: "8,4 / 10", texte: "de note des avis, au moins" },
    { fort: "six personnes", texte: "aux étages les jours chargés" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de l'hébergement, en comptant ce que coûtent les attentes et les défauts : gestes commerciaux, clients perdus, nuitées que la note des avis fait perdre.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos étages",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des clients continuent d'attendre leur chambre au comptoir.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Aloïs Brunschwig",
        role: "Chef de réception",
        alerte: true,
        texte: `Pendant ce temps, des clients ont encore attendu leur chambre au comptoir : ${euros(perdu)} de gestes commerciaux et de clients qui ne reviendront pas.`,
      };
    },
  },
  prevision: {
    libelle: "les heures d'équipe perdues à attendre le linge le lundi décrit, en heures",
    unite: "h",
    placeholder: "0",
    min: 0,
    max: 40,
    step: 0.5,
    reel: (t) => t.heuresPerduesLundi,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "nonPretes",
      nom: "Chambres pas prêtes à 15 h",
      format: chambres,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `départs, par jour chargé de la semaine ${semaine} ; objectif : ${OBJECTIF_NON_PRETES} au plus`
          : `lundi dernier ; objectif : ${OBJECTIF_NON_PRETES} au plus`,
    },
    {
      cle: "clientsAttente",
      nom: "Clients qui ont attendu leur chambre",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `sur la semaine ${semaine}` : "la semaine dernière, environ"),
    },
    {
      cle: "heuresPerdues",
      nom: "Heures perdues à attendre",
      format: heures,
      sensBon: -1,
      aide: () => "le linge ou une chambre libre, par jour chargé",
    },
    {
      cle: "note",
      nom: "Note des avis",
      format: note,
      formatEcart: (v) => `${nombre(v, 2)} pt`,
      sensBon: 1,
      aide: () => `Bookalia et Voyagio ; le budget suppose ${nombre(NOTE.reference)}`,
    },
    {
      cle: "coutCumule",
      nom: "Coût de l'hébergement",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `heures, intérim, linge ; budget à date ${kE(l.budgetADate ?? 0)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.coutCumule ?? 0) / BUDGET),
              enRetard: (l.coutCumule ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      nonPretes: chambres(l.nonPretes ?? 0),
      clientsAttente: nombre(l.clientsAttente ?? 0, 0),
      heuresPerdues: heures(l.heuresPerdues ?? 0),
      note: note(l.note ?? NOTE.depart),
      defauts: nombre(l.defauts ?? 0, 0),
      stockJournee: decisions[D.premier] === 1,
      interim: decisions[D.premier] === 0 || decisions[D.ordre] === 3 || decisions[D.salon] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    const clients = semaines.reduce((x, w) => x + w.clientsAttente, 0);
    return [
      [`Pas prêtes à 15 h, sem. ${a}`, chambres(t.semaines[a]!.nonPretes)],
      ["Clients qui ont attendu", nombre(clients, 0)],
      ["Coût de la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Chambres pas prêtes à 15 h, par jour chargé",
    cle: "nonPretes",
    cible: OBJECTIF_NON_PRETES,
    libelleCible: `objectif : ${OBJECTIF_NON_PRETES} au plus`,
    graduations: [0, 10, 20, 30, 40],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${chambres(s.nonPretes!)} pas prêtes à 15 h · ${nombre(s.clientsAttente!, 0)} clients ont attendu`,
      `${heures(s.heuresPerdues!)} perdues à attendre · note ${note(s.note!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.recouche && choix === 0) {
      // La part des clients qui déclinent la recouche dépend du hasard du trimestre.
      return [REPONSES.adhesion(adhesion(graine))];
    }
    if (etape === D.salon && choix === 1) {
      // L'équipe répond selon le hasard du trimestre.
      return [
        complementaires(graine) > RENFORT_SALON.complementairesMin
          ? REPONSES.volontairesOui
          : REPONSES.volontairesNon,
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.grandCompte) {
      lies.push({
        ...MARGARETHE,
        heure: `sem. ${GRAND_COMPTE.semaineDecision}`,
        alerte: t.grandCompteParti,
        texte: t.grandCompteParti ? REPONSES.grandComptePart : REPONSES.grandCompteReste,
      });
    }
    if (arrive.groupe) {
      lies.push({
        de: "Aloïs Brunschwig",
        role: "Chef de réception",
        heure: `sem. ${GROUPE.semaine}`,
        texte: `${
          chemin[D.groupe] === 2
            ? "Le groupe a pris ses chambres à 15 h, comme convenu."
            : t.carEnAvance
              ? REPONSES.carEnAvance
              : REPONSES.carALHeure
        } ${
          t.groupeAttente >= 1
            ? `${nombre(t.groupeAttente, 0)} techniciens sur ${GROUPE.chambres} ont attendu leur clé ou leur chambre.`
            : "Personne n'a attendu."
        }`,
      });
      lies.push({
        ...KWAME,
        heure: `sem. ${GROUPE.semaine}`,
        alerte: t.organisateurParti,
        texte: t.organisateurParti ? REPONSES.organisateurPart : REPONSES.organisateurRevient,
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, attentes et défauts compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de l'hébergement, attentes, défauts et effet de la note des avis compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Chambres pas prêtes à 15 h",
          valeur: chambres(t.nonPretesMoyen),
          aide: `par jour chargé, en moyenne ; objectif ${OBJECTIF_NON_PRETES} au plus`,
          tenu: t.nonPretesMoyen <= OBJECTIF_NON_PRETES,
        },
        {
          nom: "Clients qui ont attendu",
          valeur: nombre(t.clientsAttente, 0),
          aide: `sur le trimestre ; repère ${OBJECTIF_ATTENTES}, un par jour chargé`,
          tenu: t.clientsAttente <= OBJECTIF_ATTENTES,
        },
        {
          nom: "Note des avis",
          valeur: note(t.noteFinale),
          aide: `fin mars ; le budget suppose ${nombre(NOTE.reference)}`,
          tenu: t.noteFinale >= NOTE.reference,
        },
        {
          nom: "Coût de l'hébergement",
          valeur: kE(t.cout),
          aide: `heures, intérim, linge ; budget ${kE(BUDGET)}`,
          tenu: t.cout <= BUDGET,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les clients",
          texte: [
            t.grandCompteParti
              ? `Helvardis est parti chez Orméa Hotels en semaine ${GRAND_COMPTE.semaineDecision} (${kE(GRAND_COMPTE.nuitees * MARGE_NUITEE * (SEMAINES - GRAND_COMPTE.semaineDecision + 1))} de marge sur le trimestre)`
              : "Helvardis a renouvelé son accord",
            t.carEnAvance
              ? "le car du groupe serait arrivé à 11 h 30"
              : "le car du groupe serait arrivé à l'heure",
            t.organisateurParti
              ? "Navelis Aéro ne reviendra pas"
              : "Navelis Aéro reviendra pour ses deux sessions",
          ]
            .join(", ")
            .concat("."),
        },
        {
          titre: "L'équipe et les clients en séjour",
          texte: `Proposée à l'arrivée, la recouche aurait été déclinée par ${Math.round(t.adhesion * 100)} % des clients en séjour ; pour le salon, ${
            t.complementaires > RENFORT_SALON.complementairesMin
              ? "les volontaires auraient donné presque deux personnes de plus par jour"
              : "les volontaires n'auraient donné qu'une demi-personne de plus par jour"
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
