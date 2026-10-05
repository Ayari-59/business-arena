/**
 * ÉPISODE 45 — LE PROJET QU'ON N'OSE PAS ARRÊTER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Arvel Maison montre, ce que la
 * courbe trace, ce sur quoi le bilan juge Malika, et ce que ses décisions
 * révèlent d'elle.
 *
 * Un projet stratégique se juge sur des années, l'épisode sur un trimestre :
 * le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, le résultat du
 * trimestre plus la valeur des flux futurs de ce que chaque site devient,
 * recalculée chaque semaine avec ce que le trimestre apprend. Les 2,4 M€
 * déjà dépensés n'y entrent jamais. Elle bouge quand on décide, et quand le
 * trimestre révèle : l'analyse des ventes, le salon, l'offre de Brémond, le
 * comité, les chiffres de l'automne.
 */
import {
  ARTISANS,
  D,
  ECULLY,
  INFORMATION,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  OBJECTIF_VALEUR,
  OFFRES,
  PERTE_ANNUELLE,
  PERTE_PAR_JOUR,
  RILLIEUX,
  SAINT_PRIEST,
  SALON,
  SCENARIOS,
  SITES,
  TAUX,
  TRANSFORMATION_DEPART,
  COMITE,
  ECHEANCE,
  DEJA_DEPENSE,
  aValider,
  critereLisible,
  evenements,
  hasard,
  loyerJusquALEcheance,
  offreDeBremond,
  simuler,
  tableauDeBord,
  valeurFuture,
  type Etat,
  type Scenario,
  type Site,
  type Trimestre,
} from "@/engine/episodes/projet-a-arreter";
import {
  DIAGNOSTICS,
  ETAPES,
  LECTURES_ECULLY,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/projet-a-arreter";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
/** Une variation dite en mots : « en hausse de 12 % », « stables ». */
const evolution = (v: number) =>
  Math.abs(v) < 0.005 ? "stables" : `en ${v > 0 ? "hausse" : "baisse"} de ${taux(Math.abs(v), 0)}`;

const ACHILLE = { de: "Achille Montreuil", role: "Directeur d'Arvel Maison" } as const;
const PHILOMENE = {
  de: "Philomène Kassab",
  role: "Directrice administrative et financière",
} as const;
const SOUKAINA = { de: "Soukaïna Mernissi", role: "Contrôleuse de gestion" } as const;
const JUN = { de: "Jun Takeda", role: "Consultant, cabinet Silvacane" } as const;
const OTTAVIA = { de: "Ottavia Brémond", role: "Gérante des Faïenceries Brémond" } as const;
const YAELLE = { de: "Yaëlle Brochard", role: "Responsable du showroom de Rillieux" } as const;
const NATHAN = { de: "Nathan Bouvreuil", role: "Responsable du showroom de Saint-Priest" } as const;

/** La perte que la prévision de la semaine 1 demande, en k€. */
export const PERTE_EN_KE = PERTE_ANNUELLE / 1000;

/** La valeur d'un état sous chacun des trois scénarios, et son espérance. */
export function parScenario(s: Site, etat: Etat, ajout = 0) {
  const v = SCENARIOS.map((_, i) => valeurFuture(s, etat, i as Scenario) + ajout);
  const esperance = v.reduce((t, x, i) => t + x * SCENARIOS[i]!.chance, 0);
  return { v, esperance };
}

const dire = ({ v, esperance }: { v: number[]; esperance: number }) =>
  `${v.map(kES).join(" / ")}, soit ${kES(esperance)} en espérance`;

/**
 * LES CHIFFRES QUE LA CONTRÔLEUSE DE GESTION MONTRE, option par option, flux
 * à venir seulement, au taux du groupe, avec les décisions déjà prises (la
 * relance, l'analyse).
 */
export function chiffresDesOptions(decisions: readonly number[]) {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const relance = chemin[D.relance] === O.relance.relancer;
  const liste = chemin[D.information] === O.information.analyse;
  const base: Etat = { type: "particuliers", relance };
  const fermer = (s: Site) => -(loyerJusquALEcheance(s) + s.fermeture);
  return {
    rillieux: {
      garder: parScenario(RILLIEUX, base),
      reduire: parScenario(RILLIEUX, { type: "particuliers", relance, reduit: true }),
      loyer: loyerJusquALEcheance(RILLIEUX),
      fermer: fermer(RILLIEUX),
    },
    saintPriest: {
      tenir: parScenario(SAINT_PRIEST, base),
      artisans: parScenario(SAINT_PRIEST, { type: "artisans", debut: 0, liste }, -ARTISANS.travaux),
      fermer: fermer(SAINT_PRIEST),
    },
    ecully: {
      telQuel: parScenario(ECULLY, base),
      artisans: parScenario(ECULLY, { type: "artisans", debut: 0, liste }, -ARTISANS.travaux),
      essai: parScenario(ECULLY, {
        type: "essai",
        lisible: critereLisible(chemin),
        liste,
        relance,
      }),
      agrandir: parScenario(ECULLY, { type: "particuliers", relance, agrandi: true }),
    },
  };
}

/** Ce que le comité tranche : l'écart, en espérance, entre exécuter les fermetures et cessions et les geler. */
export function enJeuAuComite(decisions: readonly number[], offre: number | null) {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const relance = chemin[D.relance] === O.relance.relancer;
  const gele: Etat = { type: "fermeDiffere", relance };
  const items: { quoi: string; ecart: number }[] = [];
  const ecart = (s: Site, valide: Etat, ajout: number) =>
    parScenario(s, valide, ajout).esperance - parScenario(s, gele).esperance;
  const dR = chemin[D.rillieux];
  if (dR === O.rillieux.negocier && offre !== null && offre > 0) {
    items.push({
      quoi: `la cession de Rillieux à Brémond pour ${kE(offre)}`,
      ecart: ecart(RILLIEUX, { type: "cede" }, offre),
    });
  }
  if (dR === O.rillieux.fermer) {
    items.push({
      quoi: "la fermeture de Rillieux",
      ecart: ecart(RILLIEUX, { type: "ferme" }, -RILLIEUX.fermeture),
    });
  }
  if (chemin[D.saintPriest] === O.saintPriest.fermer) {
    items.push({
      quoi: "la fermeture de Saint-Priest",
      ecart: ecart(SAINT_PRIEST, { type: "ferme" }, -SAINT_PRIEST.fermeture),
    });
  }
  return items;
}

/** Ce que les décisions révèlent, dans l'ordre où une directrice générale adjointe les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le compte des showrooms et le calendrier des baux",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    avenir:
      "Votre diagnostic de la semaine 1 était juste : chaque site se juge sur ses flux à venir, option par option, avec des critères fixés avant de lire les chiffres ; les 2,4 M€ déjà dépensés n'entrent dans aucun calcul.",
    sites:
      "En semaine 1, vous avez vu que deux sites n'atteindraient pas l'équilibre : c'est vrai de Rillieux, mais Saint-Priest valait plus transformé que fermé, et Écully était un vrai pari. Il fallait une méthode pour chaque site, pas un verdict.",
    notoriete:
      "En semaine 1, vous avez cru à un manque de notoriété : les visites montaient déjà, dans tous les scénarios ; ce sont les ventes qui ne suivaient pas.",
    echec:
      "En semaine 1, vous avez vu un échec à arrêter au plus vite : le compte analytique grossit la perte de l'amortissement des sommes déjà dépensées et des frais du siège, et tout fermer détruit ce que Saint-Priest et Écully peuvent encore valoir.",
  };
  const justes = ["avenir", "sites"];
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
    score: d === "avenir" ? 1 : d === "sites" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais remis d'argent pour sauver ce qui était déjà dépensé : ni relance, ni site gardé par fidélité au projet, ni salon pour se rassurer, ni année de plus, ni vitrine agrandie."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe de l'escalade : remettre de l'argent pour ne pas avoir dépensé pour rien, parce que le président l'avait annoncé, et lire les visites qui montent plutôt que les ventes qui ne suivent pas.`,
  };

  const calibrage = constatCalibrage(
    p,
    PERTE_EN_KE,
    "de perte d'exploitation annuelle propre aux trois showrooms",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const revisions = [
    p.chemin[D.rillieux] === O.rillieux.negocier || p.chemin[D.rillieux] === O.rillieux.fermer,
    p.chemin[D.saintPriest] === O.saintPriest.artisans,
    p.chemin[D.ecully] === O.ecully.essai || p.chemin[D.ecully] === O.ecully.artisans,
  ].filter(Boolean).length;
  const issue = SCENARIOS[t.scenario].nom;
  const revision: Constat = {
    score: revisions === 3 ? 1 : revisions === 2 ? 0.6 : 0,
    texte:
      revisions === 3
        ? `Vous avez révisé le pari site par site, au vu de ce que chacun montrait : Rillieux arrêté, Saint-Priest tourné vers les artisans, Écully gardé sous condition. Au bout du trimestre, ${issue}.`
        : revisions === 2
          ? `Vous avez révisé le pari sur deux sites sur trois. Au bout du trimestre, ${issue} : le troisième reste engagé sur l'hypothèse de départ.`
          : `Vous avez laissé le pari de départ courir sur la plupart des sites, alors que les ventes ne suivaient pas les visites. Au bout du trimestre, ${issue}, et les baux repartent pour trois ans.`,
  };

  return [information, diagnostic, reflexe, calibrage, revision];
}

export function axe([information, diagnostic, reflexe, calibrage, revision]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher l'information qui tranche",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le compte des showrooms et le calendrier des baux, puis en faisant analyser les ventes client par client : les visites montent dans tous les scénarios, seules les ventes disent si les particuliers achètent.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Juger sur ce qui vient, pas sur ce qui est dépensé",
      texte:
        "Les 2,4 M€ sont perdus quoi que vous décidiez, et l'annonce du président n'y change rien. Pour chaque site, comparez ce que rapporte chaque option à partir d'aujourd'hui : continuer, transformer, céder, fermer.",
    };
  }
  if (revision!.score === 0) {
    return {
      titre: "Réviser le pari quand les signaux changent",
      texte:
        "Écrivez avant le trimestre ce que chaque site doit montrer, et à quelle date ; puis tenez-vous-y quand les chiffres tombent. Un recentrage n'est pas un aveu d'échec : c'est le critère qui décide, pas l'historique.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Juger chaque site sur ses flux à venir",
      texte:
        "Ni « on y a mis 2,4 M€ », ni « le compte perd 400 k€ » ne disent quoi faire. Chaque site a ses options et sa valeur : Rillieux ne couvrira jamais ses charges, Saint-Priest vaut plus pour les artisans, Écully est un pari à garder sous condition.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le compte des showrooms",
      texte:
        "Partez des ventes, de la marge sur coût variable et des charges fixes de chaque site. Retirez ce qui ne changera pas : l'amortissement des travaux déjà payés, et la quote-part du siège.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a changé à la valeur estimée. */
const FENETRES: readonly [number, number][] = [
  [2, 4],
  [3, 6],
  [5, 11],
  [7, 10],
  [10, 13],
  [12, 13],
];

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? t.depart : t.semaines[w]!.valeur);

/** Ce que chaque site est devenu, en quelques mots. */
function devenir(t: Trimestre): string {
  const nom: Record<string, string> = {
    particuliers: "inchangé",
    artisans: "pour les artisans",
    essai: "à l'essai",
    ferme: "fermé",
    fermeDiffere: "fermeture gelée",
    cede: "cédé",
  };
  const etats = SITES.map((s) => t.etats[s.id]);
  if (etats.every((e) => e.type === "particuliers" && !e.agrandi)) return "rien de décidé";
  return SITES.map((s, i) => {
    const e = etats[i]!;
    return `${s.nom} ${e.type === "particuliers" && e.agrandi ? "agrandi" : nom[e.type]}`;
  }).join(" · ");
}

/** Le budget du trimestre : un quart de la perte de l'année, et la campagne d'automne. */
export const BUDGET_TRIMESTRE = -40000;

/** Ce que le marché des particuliers a fait, dit au passé. */
const PASSE = ["Il a décollé", "Il a plafonné", "Il a reculé"] as const;

export const EPISODE_ESCALADE: Episode<Trimestre> = {
  code: "projet-a-arreter",
  numero: 45,
  domaine: "Stratégie : arrêter ou poursuivre",
  titre: "Le projet qu'on n'ose pas arrêter",
  resume:
    "Trois showrooms pour particuliers, 2,4 M€ déjà dépensés, un président qui a annoncé le projet, des visites qui montent et des ventes qui ne suivent pas. Juger chaque site sur ce qui vient, et réviser le pari au bon critère.",
  persona:
    "Vous êtes Malika Duplantier, directrice générale adjointe d'Arvel Distribution : une trentaine d'agences en Auvergne-Rhône-Alpes, siège à Lyon. Vous héritez d'Arvel Maison, trois showrooms pour particuliers ouverts il y a dix-huit mois par votre prédécesseur à Écully, Saint-Priest et Rillieux, que le président a présentés à la presse comme la deuxième jambe du groupe.",
  mandat: [
    {
      fort: `${nombre(DEJA_DEPENSE / 1e6, 1)} M€`,
      texte: "déjà dépensés en travaux, agencement et lancement",
    },
    {
      fort: "3 showrooms",
      texte: "Écully, Saint-Priest et Rillieux, ouverts il y a dix-huit mois",
    },
    {
      fort: `semaine ${ECHEANCE}`,
      texte: "l'échéance des baux : un congé se donne avant la fin du trimestre",
    },
    { fort: taux(TAUX, 0), texte: "le taux d'actualisation du groupe" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la valeur créée : le résultat des showrooms pendant le trimestre, plus la valeur, sur trois ans au taux du groupe, de ce que chaque site est devenu, recalculée avec ce que le trimestre a révélé. Les sommes déjà dépensées n'y entrent pas.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Arvel Maison",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'équipe d'Arvel Maison, sans consigne, signe la suite de sa campagne d'automne.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ACHILLE,
        alerte: true,
        texte: `Faute de consigne, nous avons signé la suite de la campagne d'automne : ${euros(perdu)} de plus.`,
      };
    },
  },
  prevision: {
    libelle:
      "la perte d'exploitation annuelle propre aux trois showrooms, hors sommes déjà engagées, en milliers d'euros",
    unite: "k€",
    placeholder: "200",
    min: 0,
    max: 600,
    step: 1,
    reel: () => PERTE_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `résultat du trimestre et flux futurs à ${taux(TAUX, 0)}, sommes dépensées exclues`
          : "si rien ne change : trois ans de pertes, baux compris",
    },
    {
      cle: "resultat",
      nom: "Résultat du trimestre",
      format: kE,
      sensBon: 1,
      aide: () => `les trois showrooms, décisions comprises ; budget : ${kE(BUDGET_TRIMESTRE)}`,
      jauge: (l) => ({
        part: Math.min(1, Math.max(0, -(l.resultat ?? 0)) / -BUDGET_TRIMESTRE),
        enRetard: (l.resultat ?? 0) < BUDGET_TRIMESTRE,
      }),
    },
    {
      cle: "visites",
      nom: "Visites de la semaine",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () =>
        `les trois showrooms ; à la rentrée : ${nombre(
          SITES.reduce((t, s) => t + s.visites, 0),
          0,
        )}`,
    },
    {
      cle: "transformation",
      nom: "Taux de transformation des devis",
      format: (v) => taux(v, 1),
      formatEcart: (v) => `${nombre(v * 100, 1)} pt`,
      sensBon: 1,
      aide: () =>
        `showrooms au format particuliers ; ${taux(TRANSFORMATION_DEPART, 0)} à la rentrée, 32 % à l'ouverture`,
    },
    {
      cle: "ventes",
      nom: "Ventes de la semaine",
      format: kE,
      sensBon: 1,
      aide: () =>
        `particuliers et artisans ; à la rentrée : ${kE(SITES.reduce((t, s) => t + s.ventes / 52, 0))}`,
    },
  ],
  contexte(l, decisions): Contexte {
    const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
    const c = chiffresDesOptions(decisions);
    const analyse = chemin[D.information] === O.information.analyse;
    const enJeu = enJeuAuComite(decisions, l.offre ?? null);
    const lu = l.scenarioLu;
    return {
      visitesHausse: evolution(l.visitesHausse ?? 0),
      ventesHausse: evolution(l.ventesHausse ?? 0),
      transformation: taux(l.transformation ?? TRANSFORMATION_DEPART, 0),
      visites: nombre(l.visites ?? 0, 0),
      visitesRillieux: nombre(l.visitesRillieux ?? RILLIEUX.visites, 0),
      analyse,
      criteres: chemin[D.relance] === O.relance.criteres,
      lisible: critereLisible(chemin),
      rGarder: dire(c.rillieux.garder),
      rReduire: dire(c.rillieux.reduire),
      rLoyer: kE(c.rillieux.loyer),
      rFermer: kES(c.rillieux.fermer),
      sTenir: dire(c.saintPriest.tenir),
      sArtisans: dire(c.saintPriest.artisans),
      sFermer: kES(c.saintPriest.fermer),
      eTelQuel: dire(c.ecully.telQuel),
      eArtisans: dire(c.ecully.artisans),
      eEssai: dire(c.ecully.essai),
      eAgrandir: dire(c.ecully.agrandir),
      enJeu: enJeu.length
        ? enJeu
            .map(
              (x) =>
                `${x.quoi}, qui vaut ${kE(x.ecart)} de plus en espérance qu'un gel jusqu'au bilan annuel`,
            )
            .join(" ; ")
        : "rien, aucune fermeture ni cession n'est proposée",
      tendance: lu !== null && lu !== undefined ? LECTURES_ECULLY[lu]! : "",
      lecture: lu !== null && lu !== undefined,
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Résultat du trimestre, sem. ${a}`, kE(s.resultat)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: "objectif : ne plus détruire de valeur",
    graduations: [-800000, -400000, 0, 400000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `résultat du trimestre ${kE(s.resultat!)} · ${nombre(s.visites!, 0)} visites · transformation ${taux(s.transformation!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.rillieux && choix === O.rillieux.negocier) {
      // Brémond répond selon le marché qu'il lit : une offre haute, basse, ou une attente qui finira mal.
      const offre = offreDeBremond(graine);
      return [
        {
          ...OTTAVIA,
          texte:
            offre === OFFRES.haute
              ? REPONSES.offreHaute
              : offre === OFFRES.basse
                ? REPONSES.offreBasse
                : REPONSES.enAttente,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.analyse) {
      lies.push({
        ...JUN,
        heure: `sem. ${INFORMATION.resultats}`,
        texte: `Nos résultats, site par site. Rillieux : sept visiteurs sur dix ne reviennent jamais, et les ventes ne couvrent ni le loyer ni le personnel. Écully : ${LECTURES_ECULLY[h.scenario]!}`,
      });
    }
    if (arrive.salon) {
      lies.push({
        ...ACHILLE,
        heure: `sem. ${SALON.semaine}`,
        texte: `Salon de l'habitat : ${nombre(t.semaines[SALON.semaine]!.visites, 0)} visites cette semaine dans les showrooms. Record battu.`,
      });
    }
    if (arrive.renonce) {
      lies.push({
        ...OTTAVIA,
        heure: `sem. ${SALON.semaine}`,
        alerte: true,
        texte: REPONSES.renonce,
      });
    }
    if (arrive.comite) {
      const c = chemin[D.comite];
      let texte: string | null = null;
      if (c === O.comite.rallonge) texte = REPONSES.rallonge;
      else if (c === O.comite.rien) texte = aValider(chemin) ? REPONSES.rienPresente : null;
      else if (!aValider(chemin)) texte = REPONSES.priseDActe;
      else if (!t.accord) texte = REPONSES.gel;
      else texte = c === O.comite.criteres ? REPONSES.accord : REPONSES.accordCorrection;
      if (texte) {
        lies.push({
          ...PHILOMENE,
          heure: `sem. ${COMITE}`,
          alerte: aValider(chemin) && !t.accord,
          texte,
        });
      }
      if (chemin[D.saintPriest] === O.saintPriest.attendre) {
        lies.push({ ...PHILOMENE, heure: `sem. ${COMITE}`, texte: REPONSES.salonGarde });
      }
    }
    if (arrive.execution) {
      if (t.etats.rillieux.type === "cede") {
        lies.push({
          ...OTTAVIA,
          heure: "sem. 11",
          texte: `Acte de cession signé : le bail et l'agencement de Rillieux sont à nous pour ${kE(t.offre ?? 0)}, le stock repris au prix d'achat. Bienvenue à vos vendeurs qui voudront nous rejoindre.`,
        });
      }
      if (t.etats.rillieux.type === "ferme") {
        lies.push({
          ...YAELLE,
          heure: "sem. 11",
          texte: `Congé délivré pour l'échéance. Le showroom ferme samedi ; le déstockage coûte ${kE(RILLIEUX.fermeture)}, le loyer court jusqu'en semaine ${ECHEANCE}.`,
        });
      }
      if (t.etats.saintPriest.type === "ferme") {
        lies.push({
          ...NATHAN,
          heure: "sem. 11",
          texte:
            "Congé délivré. Le showroom de Saint-Priest ferme samedi ; l'équipe est reclassée à l'agence.",
        });
      }
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.automne) {
      imprevus.push({
        ...SOUKAINA,
        heure: "sem. 12",
        texte: `Les chiffres de l'automne sont tombés, salon compris : ${SCENARIOS[h.scenario].nom}. ${
          h.scenario === 0
            ? "Les ventes d'Écully suivent enfin les visites."
            : h.scenario === 1
              ? "Les visites montent, les ventes restent où elles étaient."
              : "Les visites montent, et les ventes baissent."
        }`,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : le résultat des showrooms, plus la valeur sur trois ans de ce que chaque site est devenu, au taux du groupe, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const decide = SITES.every((s) => {
        const e = t.etats[s.id];
        return e.type !== "particuliers" && e.type !== "fermeDiffere";
      });
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: "estimée en semaine 13 ; objectif : ne plus en détruire",
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Résultat du trimestre",
          valeur: kE(t.resultat),
          aide: `les trois showrooms, décisions comprises ; budget ${kE(BUDGET_TRIMESTRE)}`,
          tenu: t.resultat >= BUDGET_TRIMESTRE,
        },
        {
          nom: "Les trois sites",
          valeur: devenir(t),
          aide: "chaque site a-t-il un avenir décidé, et non reconduit par défaut ?",
          tenu: decide,
        },
        {
          nom: "Le président",
          valeur:
            t.accord === true
              ? "a validé le recentrage"
              : t.accord === false
                ? "a gelé le recentrage"
                : t.aValider
                  ? "n'a pas été saisi"
                  : "rien à valider",
          aide: "les fermetures et la cession passent au comité de la semaine 10",
          tenu: t.accord === true,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const offre = offreDeBremond(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre[0]!.toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché des particuliers",
          texte: `${PASSE[t.scenario]} ; au départ, le panel lui donnait une chance sur quatre de décoller, près d'une sur deux de plafonner, trois sur dix de reculer.`,
        },
        {
          titre: "Brémond",
          texte:
            t.offre !== null
              ? offre > 0
                ? `a offert ${kE(offre)} pour le droit au bail et l'agencement de Rillieux.`
                : "a renoncé à Rillieux en semaine 9, après des semaines de discussion."
              : offre > 0
                ? `aurait offert ${kE(offre)} pour Rillieux, si vous aviez négocié.`
                : "aurait renoncé à Rillieux, même si vous aviez négocié.",
        },
        {
          titre: "Le président",
          texte:
            t.accord === null
              ? t.aValider
                ? "n'a pas été saisi du recentrage : les fermetures attendront le bilan annuel."
                : "n'a eu ni fermeture ni cession à valider."
              : t.accord
                ? `a validé le recentrage ; présenté ainsi, il l'acceptait ${taux(t.chanceAccord, 0)} du temps.`
                : `a gelé le recentrage ; présenté ainsi, il ne l'acceptait que ${taux(t.chanceAccord, 0)} du temps.`,
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      return valeurA(t, a) - valeurA(t, de - 1);
    },
  },
  comportements,
  axe,
};
