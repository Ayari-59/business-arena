/**
 * ÉPISODE 89 — FORMER SES PROPRES SOIGNANTS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Prisca montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 *
 * Le trimestre se juge sur la valeur estimée à la semaine 13 : les diplômés
 * attendus et les soignants retenus, moins ce que les postes vacants, les
 * parcours et les incidents ont coûté. C'est la seule façon honnête de mettre
 * en regard un parcours qui coûte dès septembre et un diplôme qui arrive
 * l'été suivant.
 */
import {
  BUDGET_SEMAINE,
  D,
  DIPLOMES_VINGT_VAE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  POSTES_VACANTS,
  evenements,
  hasard,
  restentChezNous,
  simuler,
  tableauDeBord,
  ORCHIDIA,
  type Issue,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/former-ses-soignants";
import {
  DIAGNOSTICS,
  ETAPES,
  PARTANTES,
  REFERENCES,
  REFLEXES,
} from "@/config/episodes/former-ses-soignants";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const WENDELINE = { de: "Wendeline Lagoutte", role: "Chargée de recrutement" } as const;
const MADELEINE = {
  de: "Madeleine Sirugue",
  role: "Directrice qualité et gestion des risques, siège",
} as const;
const MAURICETTE = {
  de: "Mauricette Péclard",
  role: "Aide-soignante tutrice, EHPAD de Beaune",
} as const;

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);
const liste = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} et ${xs.at(-1)}`;

/** Ce que l'inspection a exigé, en une phrase. */
const ISSUES: Record<Issue, string> = {
  observation:
    "L'inspection de l'ARS s'est conclue par des recommandations : le faisant fonction est encadré, et un plan engage les agents vers le diplôme.",
  nuit: "L'inspection de l'ARS a enjoint à l'association de placer une aide-soignante diplômée chaque nuit dans les EHPAD concernés : quatre postes d'intérim de nuit pendant dix semaines.",
  jour: "L'inspection de l'ARS a enjoint à l'association de mettre fin au faisant fonction de jour, faute de plan pour qualifier les agents : dix semaines d'intérim.",
  totale:
    "L'inspection de l'ARS a enjoint à l'association de mettre fin au faisant fonction, de jour comme de nuit : dix semaines d'intérim à payer le temps de se réorganiser.",
};

/** Qui reste parmi les trois aides-soignantes sollicitées par Orchidia. */
function quiReste(option: number, graine: number) {
  const p = ORCHIDIA.reste[option] ?? 0;
  return PARTANTES.filter((_, i) => hasard(graine).orchidia[i]! < p);
}

/** Ce que les décisions révèlent, dans l'ordre où une responsable formation les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce que coûte et rapporte chaque voie",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    penurie:
      "Votre diagnostic de la semaine 1 était juste : dans un métier en pénurie, les aides-soignants diplômés ne se trouvent pas dehors ; il fallait qualifier les agents qui font déjà le travail.",
    glissement:
      "En semaine 1, vous avez vu le glissement de tâches : un vrai risque, mais pas la cause. Le faisant fonction existe parce que les diplômés manquent ; il ne se résorbe qu'en qualifiant ceux qui le font.",
    attractivite:
      "En semaine 1, vous avez retenu les salaires et les primes ; à ancienneté égale, l'association paie comme Orchidia, et une prime attire des soignants qui repartent pour la suivante.",
    recrutement:
      "En semaine 1, vous avez retenu l'organisation du recrutement ; la campagne de l'an dernier était bien menée, mais 92 % des élèves aides-soignants ont un employeur avant leur diplôme.",
  };
  const justes = ["penurie", "glissement"];
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
    score: d === "penurie" ? 1 : d === "glissement" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const parties = t.recrues.filter((x) => x.depart !== null).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la pénurie par une prime ni par des agents non diplômés sur des postes de soignants : vous avez qualifié plutôt qu'acheté ou laissé glisser."
        : `Vous avez répondu ${n} fois à la pénurie par le réflexe du métier : une prime pour attirer ou retenir, ou des agents non diplômés laissés sur des postes de soignants. La prime attire des soignants qui repartent pour la suivante ; le faisant fonction expose les résidents et l'association${
            parties
              ? `. ${parties} ${pluriel(parties, "recrue est repartie", "recrues sont reparties")} avant la fin du trimestre`
              : ""
          }.`,
  };

  const calibrage = constatCalibrage(
    p,
    DIPLOMES_VINGT_VAE,
    "d'aides-soignants diplômés en dix-huit mois avec vingt VAE accompagnées",
    "diplômés",
    { juste: 0.5, proche: 1.5 },
    (e) => `${nombre(e)} diplômé${e >= 2 ? "s" : ""}`,
  );

  const qualifie = p.chemin[D.plan] === 1 || p.chemin[D.plan] === 2;
  const suivis = t.qMoyen >= 0.99;
  let score: number;
  let texte: string;
  if (!qualifie) {
    score = 0;
    texte = `Vous n'avez engagé aucun agent dans un diplôme à la rentrée : ${nombre(t.diplomes)} diplômés attendus d'ici dix-huit mois, presque tous de la cohorte pilote de l'an dernier.`;
  } else if (!suivis) {
    score = 0.6;
    texte = `Vous avez engagé vos agents vers le diplôme, mais vous avez mené de front plus de parcours que les tutrices n'en pouvaient suivre : une part des diplômes attendus s'est perdue. ${nombre(t.diplomes)} diplômés attendus d'ici dix-huit mois.`;
  } else {
    score = 1;
    texte = `Vous avez engagé vos agents vers le diplôme, et vous n'avez lancé que les parcours que les tutrices pouvaient suivre : ${nombre(t.diplomes)} diplômés attendus d'ici dix-huit mois.`;
  }
  const former: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, former];
}

export function axe([information, diagnostic, reflexe, calibrage, former]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer ce que rapporte chaque voie",
      texte:
        "Rejouez l'épisode en relisant d'abord la dernière campagne de recrutement et en interrogeant l'OPCO : cinq recrues dont trois reparties d'un côté, deux candidats VAE sur trois diplômés de l'autre.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Former plutôt que recruter à coups de primes",
      texte:
        "Dans un métier en pénurie, une prime déplace des soignants d'un employeur à l'autre, et le faisant fonction déplace le risque sur les résidents. Les agents qui font déjà le travail sont vos futurs diplômés : qualifiez-les.",
    };
  }
  if (former!.score === 0) {
    return {
      titre: "Qualifier ceux qui font déjà le travail",
      texte:
        "Une VAE accompagnée coûte peu après l'OPCO et diplôme deux candidats sur trois en dix-huit mois. C'est le seul plan qui résorbe le faisant fonction au lieu de le payer chaque semaine.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher pourquoi le faisant fonction existe",
      texte:
        "Le glissement de tâches est le symptôme ; la cause est un métier en pénurie. Traitez la cause : des parcours qualifiants pour ceux qui font déjà fonction.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Compter les validations partielles",
      texte:
        "Vingt candidats, 45 % de validations totales, 35 % de partielles dont six sur dix complètent : faites le calcul jusqu'au bout avant de promettre des diplômés à la direction.",
    };
  }
  if (former!.score < 1) {
    return {
      titre: "Mesurer les parcours aux tutrices",
      texte:
        "Une tutrice suit deux parcours. Former des tutrices coûte peu ; lancer plus de parcours qu'on n'en peut suivre fait perdre des diplômes à tous les candidats.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_VAE: Episode<Trimestre> = {
  code: "former-ses-soignants",
  numero: 89,
  domaine: "Construire des parcours qualifiants",
  titre: "Former ses propres soignants",
  resume:
    "Trente-quatre postes d'aides-soignants vacants et quarante agents qui font fonction. Qualifier ses agents plutôt que recruter à coups de primes.",
  persona:
    "Vous êtes Prisca Echeverria, responsable formation et compétences de l'Association Solvanne, au siège de Dijon. L'association gère une clinique de soins médicaux et de réadaptation, six EHPAD, un pôle domicile et un pôle handicap : 1 150 salariés. Vous travaillez avec les directeurs d'établissement, les cadres de santé, quatorze aides-soignantes tutrices, l'OPCO et l'IFAS de Dijon.",
  mandat: [
    { fort: `${POSTES_VACANTS} postes`, texte: "d'aides-soignants vacants à la rentrée" },
    {
      fort: "40 agents",
      texte: "de service font fonction sans diplôme : le CPOM demande de résorber",
    },
    {
      fort: `${euros(BUDGET_SEMAINE)} par semaine`,
      texte: "d'intérim et d'heures supplémentaires prévus à l'EPRD",
    },
    { fort: "Septembre à novembre", texte: "la rentrée des instituts de formation" },
  ],
  jugement:
    "La direction générale juge le trimestre sur la valeur estimée à la semaine 13 : les diplômés attendus et les soignants retenus, moins le coût des postes vacants, des parcours et des incidents.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos parcours",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les plannings de la semaine se bouclent sans vous : Soralis reconduit ses intérimaires au tarif d'urgence.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Ghjulia Chaudenay",
        role: "Cadre de santé, EHPAD de Montbard",
        alerte: true,
        texte: `Faute de réponse, j'ai reconduit les intérimaires de la semaine au tarif d'urgence : ${euros(perdu)} de plus.`,
      };
    },
  },
  prevision: {
    libelle:
      "le nombre d'aides-soignants diplômés attendus en dix-huit mois avec vingt candidats en VAE accompagnée",
    unite: "diplômés",
    placeholder: "10",
    min: 0,
    max: 20,
    step: 0.1,
    reel: () => DIPLOMES_VINGT_VAE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "vacants",
      nom: "Postes d'aides-soignants vacants",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `fin de semaine ${semaine}` : "à la rentrée"),
    },
    {
      cle: "ffExpose",
      nom: "Faisant fonction non encadré",
      format: (v) => `${nombre(v)} ETP`,
      sensBon: -1,
      aide: () => "en équivalents temps plein, la nuit comprise",
    },
    {
      cle: "parcours",
      nom: "Agents en parcours qualifiant",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (_, l) =>
        `places de tutorat : ${nombre(l.charge ?? 0)} prises sur ${nombre(l.capacite ?? 0, 0)}`,
      jauge: (l) =>
        l.capacite
          ? {
              part: Math.min(1, (l.charge ?? 0) / l.capacite),
              enRetard: (l.charge ?? 0) > l.capacite,
            }
          : null,
    },
    {
      cle: "cumul",
      nom: "Coût des postes vacants",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `intérim et heures sup. ; EPRD à date : ${kE(l.budgetADate ?? 0)}`
          : `EPRD : ${euros(BUDGET_SEMAINE)} par semaine`,
    },
    {
      cle: "diplomes",
      nom: "Diplômés attendus",
      format: (v) => nombre(v),
      sensBon: 1,
      aide: () => "d'ici dix-huit mois, selon les parcours engagés",
    },
  ],
  contexte(l, decisions) {
    return {
      vacants: nombre(l.vacants ?? 0, 0),
      parcours: nombre(l.parcours ?? 0, 0),
      chargeTexte: nombre(l.charge ?? 0),
      capacite: nombre(l.capacite ?? 0, 0),
      diplomes: nombre(l.diplomes ?? 0),
      plan: decisions[D.plan] === 1 || decisions[D.plan] === 2,
      placesDuPlan: ["deux ou trois, pour les recrues en intégration", "vingt", "cinq", "aucune"][
        decisions[D.plan] ?? 3
      ]!,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Postes vacants, sem. ${a}`, nombre(t.semaines[a]!.vacants, 0)],
      ["Coût des postes vacants", kE(semaines.reduce((x, w) => x + w.coutSemaine, 0))],
      [`Diplômés attendus, sem. ${a}`, nombre(t.semaines[a]!.diplomes)],
    ];
  },
  courbe: {
    titre: "Coût des postes vacants, semaine par semaine",
    cle: "coutSemaine",
    cible: BUDGET_SEMAINE,
    libelleCible: `EPRD : ${euros(BUDGET_SEMAINE)} par semaine au plus`,
    graduations: [0, 10000, 20000, 30000],
    format: kE,
    details: (s) => [
      `${nombre(s.interim!)} postes d'intérim · ${nombre(s.vacants!, 0)} postes vacants`,
      `${nombre(s.parcours!, 0)} agents en parcours · ${nombre(s.diplomes!)} diplômés attendus`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.orchidia && choix !== 2) {
      // Seule l'offre compte : chacune répond selon le hasard du trimestre.
      const restent = quiReste(choix, graine);
      const n = restentChezNous(choix, graine);
      const offre =
        choix === 0 ? "la prime de rétention" : choix === 1 ? "le rôle de tutrice" : "la mutation";
      return [
        {
          ...WENDELINE,
          alerte: n < 2,
          texte:
            n === 3
              ? `Les trois acceptent ${offre} et retirent leur démission.`
              : n === 0
                ? `Aucune n'accepte ${offre} : les trois partent chez Orchidia à la fin de la semaine 9.`
                : `${liste(restent)} ${pluriel(n, "accepte", "acceptent")} ${offre} et ${pluriel(n, "reste", "restent")}. ${pluriel(3 - n, "L'autre part", "Les autres partent")} chez Orchidia à la fin de la semaine 9.`,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const parSemaine = (xs: readonly number[]) =>
      [...new Set(xs)].map((w) => ({ w, n: xs.filter((x) => x === w).length }));
    for (const { w, n } of parSemaine(arrive.arrivees)) {
      lies.push({
        ...WENDELINE,
        heure: `sem. ${w}`,
        texte: `${n === 1 ? "Une aide-soignante recrutée" : `${n} aides-soignantes recrutées`} par la campagne ${pluriel(n, "prend", "prennent")} ${pluriel(n, "son", "leur")} poste cette semaine, prime d'embauche versée.`,
      });
    }
    for (const { w, n } of parSemaine(arrive.departs)) {
      lies.push({
        ...WENDELINE,
        heure: `sem. ${w}`,
        alerte: true,
        texte: `${n === 1 ? "Une recrue de la campagne s'en va" : `${n} recrues de la campagne s'en vont`} pendant la période d'essai : une offre ailleurs, mieux placée ou mieux payée.`,
      });
    }
    for (const { w, n } of parSemaine(arrive.abandons.map((x) => x.semaine))) {
      const quoi = arrive.abandons.filter((x) => x.semaine === w).map((x) => x.qui);
      const nom = quoi.includes("apprenti")
        ? "apprenti"
        : quoi.includes("institut")
          ? "agent en formation à l'institut"
          : "candidat en VAE";
      lies.push({
        ...MAURICETTE,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          n === 1
            ? `Un ${nom} abandonne son parcours cette semaine : le suivi lui a manqué.`
            : `${n} personnes abandonnent leur parcours cette semaine. Personne n'avait le temps de les suivre.`,
      });
    }
    for (const w of arrive.evenements) {
      lies.push({
        ...MADELEINE,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Nouvel événement indésirable grave : un résident a chuté pendant un soin fait par une agente faisant fonction, seule. Il a été pris en charge et sa famille informée ; l'analyse des causes est lancée.",
      });
    }
    if (arrive.inspection) {
      lies.push({
        de: "ARS",
        role: "Inspection",
        heure: `sem. ${arrive.inspection.semaine}`,
        alerte: arrive.inspection.issue !== "observation",
        texte: `${ISSUES[arrive.inspection.issue]} Coût engagé : ${kE(arrive.inspection.cout)}.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    const semaine = (m: Message) => Number((m.heure ?? "").replace(/\D/g, ""));
    lies.sort((x, y) => semaine(x) - semaine(y));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      `${kE(t.objectif)} de valeur nette : ${nombre(t.diplomes, 0)} diplômés attendus, ${kE(t.coutVacance)} d'intérim et d'heures supplémentaires`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur estimée à la semaine 13 : diplômés attendus et soignants retenus, moins le coût des postes vacants, des parcours et des incidents, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const graves = t.evenements.filter((w) => w >= 5).length;
      return [
        {
          nom: "Diplômés attendus",
          valeur: nombre(t.diplomes),
          aide: "d'ici dix-huit mois ; objectif 20",
          tenu: t.diplomes >= 20,
        },
        {
          nom: "Événements indésirables graves",
          valeur: nombre(graves, 0),
          aide: "après la chute de Montbard ; objectif : aucun",
          tenu: graves === 0,
        },
        {
          nom: "Inspection de l'ARS",
          valeur: t.inspection
            ? t.inspection.issue === "observation"
              ? "recommandations"
              : "injonction"
            : "pas venue",
          aide: t.inspection ? `semaine ${t.inspection.semaine}` : "ce trimestre",
          tenu: !t.inspection || t.inspection.issue === "observation",
        },
        {
          nom: "Parcours suivis",
          valeur: t.qMoyen >= 0.99 ? "tous" : `${nombre(t.qMoyen * 100, 0)} %`,
          aide: "des parcours suivis par une tutrice, en moyenne",
          tenu: t.qMoyen >= 0.99,
        },
      ];
    },
    hasard(t, graine) {
      const recrues = t.recrues.length;
      const reparties = t.recrues.filter((x) => x.depart !== null).length;
      const abandons = t.abandons.filter((x) => x.qui !== "recrue").length;
      const graves = t.evenements.filter((w) => w >= 5).length;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'ARS",
          texte: t.inspection
            ? `est venue en semaine ${t.inspection.semaine}. ${ISSUES[t.inspection.issue]}`
            : "n'est pas venue ce trimestre.",
        },
        ...(t.restent === null
          ? []
          : [
              {
                titre: "Orchidia",
                texte:
                  t.restent === 3
                    ? "n'a fait partir aucune des trois aides-soignantes de Dijon-Grésilles."
                    : `a recruté ${3 - t.restent} des trois aides-soignantes de Dijon-Grésilles ; ${t.restent === 0 ? "aucune n'est restée" : `${t.restent} ${pluriel(t.restent, "est restée", "sont restées")}`}.`,
              },
            ]),
        {
          titre: "Les soignants",
          texte: [
            recrues
              ? `${recrues} ${pluriel(recrues, "recrue", "recrues")} de la campagne, dont ${reparties === 0 ? "aucune repartie" : `${reparties} ${pluriel(reparties, "repartie", "reparties")}`}`
              : null,
            abandons
              ? `${abandons} ${pluriel(abandons, "abandon", "abandons")} en cours de parcours`
              : "aucun abandon en cours de parcours",
            graves
              ? `${graves} ${pluriel(graves, "événement indésirable grave", "événements indésirables graves")} après Montbard`
              : "aucun événement indésirable grave après Montbard",
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
