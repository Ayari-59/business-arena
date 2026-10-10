/**
 * ÉPISODE 57 — LES POSTES QU'ON NE POURVOIT PLUS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Mounir montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Le trimestre prépare l'été : le tableau de bord suit les contrats signés
 * semaine après semaine, et le bilan juge la marge de l'été préservée,
 * projetée à l'ouverture de la saison sous le scénario que le pick-up a
 * révélé, moins tout ce que la campagne a engagé.
 */
import {
  BESOIN,
  BUDGET_CAMPAGNE,
  COUT_CUISINIER_VACANT,
  D,
  FIDELES,
  JOURS_SANS_PERTE,
  LOGEMENT,
  MARGE_EN_JEU,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLACES,
  SAISON,
  SCENARIOS,
  bailCourt,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/postes-introuvables";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/postes-introuvables";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des personnes comptées en espérance, dites en entier. */
const personnes = (v: number) => nombre(Math.max(0, v), 0);

/** « un fidèle n'est pas revenu », « 3 fidèles ne sont pas revenus », ou « aucun ». */
const compte = (v: number, un: string, plusieurs: string, aucun: string) =>
  v < 0.5 ? aucun : v < 1.5 ? `un ${un}` : `${personnes(v)} ${plusieurs}`;

/** Le coût d'un cuisinier vacant sur l'été, en k€ : ce que la prévision de la semaine 1 demande. */
export const CUISINIER_VACANT_EN_KE = COUT_CUISINIER_VACANT / 1000;

const LEOPOLD = { de: "Léopold Vittoz", role: "Second de cuisine de L'Escale Lac" } as const;
const PROSPER = { de: "Prosper Okafor", role: "Chef de cuisine de L'Escale Lac" } as const;
const SCI = { de: "SCI du Laudon", role: "Propriétaire de l'immeuble de Sévrier" } as const;

/** Les mesures qui paient davantage les seuls nouveaux. */
const mesuresInequitables = (chemin: readonly number[]) =>
  (chemin[D.axe] === 0 ? 1 : 0) + (chemin[D.primes] === 0 ? 1 : 0) + (chemin[D.ete] === 0 ? 1 : 0);

/** Ce que les décisions révèlent, dans l'ordre où un DRH les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qui faisait renoncer les candidats et ce que coûte un poste vide",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    logement:
      "Votre diagnostic de la semaine 1 était juste : le premier frein était le logement. Six candidats sur dix venaient d'ailleurs, et sans toit ils refusaient, se désistaient ou partaient en juillet.",
    coupures:
      "En semaine 1, vous avez vu les conditions de travail : une vraie cause, la deuxième. La première était le logement, cité par près de six candidats perdus sur dix.",
    salaire:
      "En semaine 1, vous avez retenu le salaire d'embauche ; il n'était cité que par un candidat perdu sur huit, et aucune prime française ne rattrape la Suisse.",
    visibilite:
      "En semaine 1, vous avez retenu la visibilité des offres ; les candidats voyaient les annonces, ils renonçaient faute de logement et à cause de la coupure.",
  };
  const justes = ["logement", "coupures"];
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
    score: d === "logement" ? 1 : d === "coupures" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du recrutement en tension : ni payer davantage les seuls nouveaux, ni multiplier les annonces, ni tenir la répartition de février contre le pick-up."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : payer davantage les seuls nouveaux, multiplier les annonces, tenir le plan de février contre le pick-up.${
            t.fidelesPerdus + t.permanentsPartis >= 6
              ? ` Dans les équipes en place, ${personnes(t.fidelesPerdus + t.permanentsPartis)} personnes sont parties ou ne sont pas revenues.`
              : ""
          }${t.second !== null ? " Léopold Vittoz, le second du Lac, est parti en Suisse." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    CUISINIER_VACANT_EN_KE,
    "de coût d'un poste de cuisinier vacant sur l'été",
    "k€",
    { juste: 2, proche: 6 },
    (e) => `${nombre(e)} k€`,
  );

  const loge = p.chemin[D.axe] === 1;
  const equitable = mesuresInequitables(p.chemin) === 0;
  const sansCoupure = p.chemin[D.horaires] === 0 || p.chemin[D.horaires] === 1;
  const tenus = (loge ? 1 : 0) + (equitable ? 1 : 0) + (sansCoupure ? 1 : 0);
  const rester: Constat = {
    score: tenus === 3 ? 1 : tenus === 2 ? 0.6 : 0,
    texte: `${
      loge
        ? `Vous avez logé les saisonniers venus d'ailleurs : ${personnes(t.loges)} lits occupés sur ${PLACES}.`
        : "Vous n'avez pas résolu le logement : les candidats venus d'ailleurs ont signé moins, et se sont désistés davantage."
    } ${
      equitable
        ? "Vous n'avez jamais payé un nouveau plus qu'un ancien."
        : "Vous avez payé des nouveaux plus que les anciens : les fidèles et les permanents l'ont su."
    } ${
      sansCoupure
        ? "Et vous vous êtes attaqué à la coupure."
        : "La coupure est restée, et avec elle une partie des refus et des départs de juillet."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, rester];
}

export function axe([information, diagnostic, reflexe, calibrage, rester]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qui fait renoncer les candidats",
      texte:
        "Rejouez l'épisode en relisant d'abord les refus et les désistements de l'an dernier, puis en chiffrant ce que coûte un poste vide : près de six candidats perdus sur dix citaient le logement, et un cuisinier qui manque ferme des déjeuners tout l'été.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Recruter avec ce qui fait venir et rester",
      texte:
        "Un salaire d'embauche relevé pour les seuls nouveaux attire un peu, et fait partir des anciens ; des annonces en plus remplissent la boîte de candidatures, pas les postes. Cherchez ce qui fait signer et rester : un toit, des horaires sans coupure, un planning connu, des collègues qui cooptent.",
    };
  }
  if (rester!.score === 0) {
    return {
      titre: "Loger, organiser, traiter tout le monde pareil",
      texte:
        "Dans un métier en pénurie, le salaire d'entrée n'est pas le levier principal : le logement élargit le vivier, la suppression de la coupure attire et retient, et l'équité avec les équipes en place évite de perdre d'un côté ce qu'on gagne de l'autre.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Lire ce que disent les candidats perdus",
      texte:
        "Avant de choisir un levier, comptez les raisons des refus et des désistements : la plus citée n'est pas forcément celle que les directeurs répètent.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer le coût d'un poste vide",
      texte:
        "Posez-le ligne par ligne : les couverts perdus, au ticket moyen hors taxes, moins le coût matière qu'on n'a pas dépensé, sur les services fermés et les semaines de la saison, moins le salaire qu'on ne verse pas.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_PENURIE: Episode<Trimestre> = {
  code: "postes-introuvables",
  numero: 59,
  domaine: "Recrutement en tension",
  titre: "Les postes qu'on ne pourvoit plus",
  resume:
    "Soixante-quatre saisonniers à trouver pour l'été, face aux hôtels suisses et aux loyers du lac. Recruter avec ce qui fait venir et rester, sans payer les nouveaux plus que les anciens.",
  persona:
    "Vous êtes Mounir Belghazi, directeur des ressources humaines du Groupe Escale, au siège d'Annecy : huit hôtels et cinq restaurants en Savoie et Haute-Savoie, 640 permanents et quelque 200 saisonniers. De février à avril se signent les contrats de l'été ; avec vous, Marwa Selmi, chargée de recrutement, et les directeurs d'hôtel.",
  mandat: [
    {
      fort: `${BESOIN}`,
      texte: `saisonniers à trouver pour l'été, en plus des ${FIDELES} fidèles`,
    },
    { fort: kE(BUDGET_CAMPAGNE), texte: "d'enveloppe pour la campagne" },
    {
      fort: kE(MARGE_EN_JEU),
      texte: "de marge d'été que ces postes protègent dans une saison normale",
    },
    { fort: `${SAISON} semaines`, texte: "de saison, de mi-juin à début septembre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'été qu'il prépare : la marge de l'été préservée par les postes pourvus, moins tout ce que la campagne a engagé — logement, primes, organisation, annonces, intérim — et ce que coûtent les départs dans les équipes en place.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre campagne d'été",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des candidats qui attendaient une réponse signent ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Marwa Selmi",
        role: "Chargée de recrutement, siège",
        alerte: true,
        texte: `Pendant ce temps, deux candidats cuisiniers qui attendaient notre réponse ont signé à Lausanne : ${euros(perdu)} de marge d'été en moins.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût d'un poste de cuisinier vacant sur tout l'été, salaire non versé déduit, en milliers d'euros",
    unite: "k€",
    placeholder: "20",
    min: 0,
    max: 150,
    step: 0.5,
    reel: () => CUISINIER_VACANT_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "pourvus",
      nom: "Contrats d'été signés",
      format: personnes,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `valables en fin de semaine ; ${personnes(l.cible ?? BESOIN)} postes à pourvoir, remplacements compris`
          : `signés en janvier ; ${BESOIN} postes au plan`,
      jauge: (l) =>
        l.cible
          ? {
              part: Math.min(1, (l.pourvus ?? 0) / l.cible),
              enRetard: (l.pourvus ?? 0) < (l.rythme ?? 0),
            }
          : null,
    },
    {
      cle: "candidatures",
      nom: "Candidatures sérieuses",
      format: personnes,
      sensBon: 1,
      aide: (semaine) => (semaine ? "reçues dans la semaine" : "la semaine dernière"),
    },
    {
      cle: "desistements",
      nom: "Désistements",
      format: personnes,
      sensBon: -1,
      aide: () => "candidats signés qui ont renoncé, depuis février",
    },
    {
      cle: "departs",
      nom: "Départs dans les équipes en place",
      format: personnes,
      sensBon: -1,
      aide: () => "fidèles qui ne reviennent pas, permanents partis",
    },
    {
      cle: "couts",
      nom: "Coûts engagés",
      format: kE,
      sensBon: -1,
      aide: () => `logement, primes, organisation, annonces ; enveloppe ${kE(BUDGET_CAMPAGNE)}`,
    },
  ],
  contexte(l, decisions): Contexte {
    const pourvus = l.pourvus ?? 0;
    const cible = l.cible ?? BESOIN;
    return {
      pourvus: personnes(pourvus),
      cible: personnes(cible),
      manque: personnes(cible - pourvus),
      candidatures: personnes(l.candidatures ?? 0),
      desistements: personnes(l.desistements ?? 0),
      desistementsTexte: compte(
        l.desistements ?? 0,
        "désistement",
        "désistements",
        "aucun désistement",
      ),
      departs: personnes(l.departs ?? 0),
      couts: kE(l.couts ?? 0),
      scenario: l.scenario ?? -1,
      loge: decisions[D.axe] === 1,
      salaireNouveaux: decisions[D.axe] === 0,
      iniquite: decisions[D.axe] === 0 || decisions[D.primes] === 0,
      second: (l.second ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const signes = semaines.reduce((x, w) => x + w.signatures, 0);
    const avant = de > 1 ? t.semaines[de - 1]!.couts : 0;
    return [
      [`Contrats valables, sem. ${a}`, personnes(t.semaines[a]!.pourvus)],
      ["Signés sur la période", personnes(signes)],
      ["Coûts engagés sur la période", kE(t.semaines[a]!.couts - avant)],
    ];
  },
  courbe: {
    titre: "Contrats d'été signés, semaine par semaine",
    cle: "pourvus",
    cible: BESOIN,
    libelleCible: `objectif : ${BESOIN} contrats avant l'été`,
    graduations: [0, 20, 40, 60, 80],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${personnes(s.pourvus!)} contrats valables · ${personnes(s.signatures!)} signés dans la semaine`,
      `${personnes(s.candidatures!)} candidatures · ${personnes(s.desistements!)} désistements depuis février`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.axe && choix === 1) {
      // Le propriétaire de Sévrier répond selon le hasard du trimestre.
      return [{ ...SCI, texte: bailCourt(graine) ? REPONSES.bailCourt : REPONSES.bailLong }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.continuTient || arrive.continuMalTenu) {
      lies.push({
        ...PROSPER,
        heure: "sem. 6",
        alerte: arrive.continuMalTenu,
        texte: arrive.continuTient ? REPONSES.continuTient : REPONSES.continuMalTenu,
      });
    }
    if (arrive.test) {
      lies.push({
        ...PROSPER,
        heure: "sem. 8",
        alerte: t.continuTient === false,
        texte: t.continuTient ? REPONSES.testTient : REPONSES.testMalTenu,
      });
    }
    if (arrive.second) {
      lies.push({
        ...LEOPOLD,
        heure: `sem. ${t.second}`,
        alerte: true,
        texte: REPONSES.secondPart,
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
    titre: (t) => `${kE(t.objectif)} de marge de l'été préservée, coûts déduits`,
    formatObjectif: kE,
    noteDesBarres: `Marge de l'été préservée : sur les ${kE(MARGE_EN_JEU)} que les ${BESOIN} postes du plan protègent dans une saison normale, ce que les postes vides ne font pas perdre, moins les coûts engagés et les départs, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.`,
    tuiles(t) {
      const departs = t.fidelesPerdus + t.permanentsPartis;
      return [
        {
          nom: "Postes pourvus à l'ouverture",
          valeur: `${personnes(Math.min(t.effectif, t.besoin))} sur ${personnes(t.besoin)}`,
          aide: "projection à mi-juin, saison et remplacements compris",
          tenu: t.vacants <= 0.1 * t.besoin,
        },
        {
          nom: "Équipes en place",
          valeur: `${personnes(departs)} départ${departs >= 1.5 ? "s" : ""}`,
          aide:
            t.second !== null
              ? "dont Léopold Vittoz, second de cuisine du Lac"
              : "fidèles qui ne reviennent pas, permanents partis",
          tenu: t.second === null && departs <= 5,
        },
        {
          nom: "Départs en pleine saison",
          valeur: personnes(t.abandons),
          aide: "attendus en juillet-août, sur les recrues",
          tenu: t.abandons <= 0.08 * Math.max(1, t.effectif),
        },
        {
          nom: "Coûts engagés",
          valeur: kE(t.couts),
          aide: `saison comprise ; enveloppe ${kE(BUDGET_CAMPAGNE)}`,
          tenu: t.couts <= BUDGET_CAMPAGNE,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const sc = SCENARIOS[t.scenario]!;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La saison",
          texte: `${sc.nom} : ${
            sc.besoin > 0
              ? `${sc.besoin} postes de plus que le plan, et chaque poste vide plus cher.`
              : sc.besoin < 0
                ? `${-sc.besoin} postes de moins que le plan, et des postes vides moins chers.`
                : "le besoin du plan, au coût prévu."
          }`,
        },
        ...(t.bailCourt !== null
          ? [
              {
                titre: "Le propriétaire de Sévrier",
                texte: t.bailCourt
                  ? "a accepté un bail de cinq mois."
                  : `a exigé un bail de ${LOGEMENT.moisLong} mois.`,
              },
            ]
          : []),
        ...(t.continuTient !== null
          ? [
              {
                titre: "Le service sans coupure",
                texte: t.continuTient
                  ? "a tenu partout où il a été mis en place."
                  : "a mal tenu là où les chefs n'y croyaient pas.",
              },
            ]
          : []),
        {
          titre: "Les équipes en place",
          texte: [
            t.second !== null
              ? `Léopold Vittoz est parti en Suisse (semaine ${t.second})`
              : "Léopold Vittoz est resté",
            compte(
              t.fidelesPerdus,
              "fidèle n'est pas revenu",
              "fidèles ne sont pas revenus",
              "aucun fidèle n'a renoncé",
            ),
            compte(
              t.permanentsPartis,
              "permanent est parti",
              "permanents sont partis",
              "aucun permanent n'est parti",
            ),
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
