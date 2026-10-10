/**
 * ÉPISODE 40 — LE CLIENT À RISQUE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du crédit montre, ce que la
 * courbe trace, ce sur quoi le bilan juge Gauthier, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET,
  BUDGET_PERTES,
  CHANTIER_HEBDO,
  D,
  HAUSSE_DEMANDEE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_ATTENDUE_DEMANDEE,
  PERTE_PAR_JOUR,
  SEMAINES_CHANTIER,
  SEMAINE_ALERTE_ASSUREUR,
  SEMAINE_BRONDEL,
  SEMAINE_DEFAUT_HALVANE,
  SEMAINE_PRIVILEGE,
  SEMAINE_RETARD,
  agrementAccorde,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/client-a-risque";
import {
  ASSUREUR,
  AVOCATE,
  DIAGNOSTICS,
  ETAPES,
  MANDATAIRE,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/client-a-risque";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart au budget : positif, la marge nette dépasse le budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

const SOLINE = { de: "Soline Abadie", role: "Analyste crédit" } as const;
const NOLAN = { de: "Nolan Ferhat", role: "Attaché commercial, agence de Vénissieux" } as const;
const XAVIER = { de: "Xavier Lenglet", role: "Chef comptable" } as const;
const VEILLE = { de: "Veille juridique", role: "Alerte BODACC" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable du crédit les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les trois qui donnaient la probabilité de défaut, le taux de récupération et la marge du chantier",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    perteAttendue:
      "Votre diagnostic de la semaine 1 était juste : le chantier de Corvelle ne valait que sa marge, 54 k€, moins une perte attendue de 42,5 k€ sur l'encours demandé. Tout tenait à ce que coûtait le risque, et à ce qui pouvait le couvrir.",
    fragilite:
      "En semaine 1, vous avez vu la fragilité de Corvelle : un vrai risque, mais pas une décision. Une entreprise fragile peut rester un bon client si la marge couvre la perte attendue, ou si une garantie la couvre pour moins cher.",
    procedure:
      "En semaine 1, vous avez retenu un problème de procédure ; la vraie question était ce que valait la vente une fois le risque payé.",
    delais:
      "En semaine 1, vous avez retenu les délais de paiement ; le risque n'était pas que Corvelle paie tard, mais qu'elle ne paie pas.",
  };
  const justes = ["perteAttendue", "fragilite"];
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
    score: d === "perteAttendue" ? 1 : d === "fragilite" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux deux réflexes du crédit : accorder parce que la commande est grosse, ou tout couper au premier signal."
        : `Vous avez choisi ${n} fois le réflexe : accorder l'encours parce que la commande est grosse, ou couper au premier signal.${
            t.guenardParti
              ? " Guénard, client depuis 1998 et qui payait toujours, est parti à la concurrence."
              : ""
          }${
            t.corvelleDefaut && !t.agrement
              ? ` Le défaut de Corvelle vous a coûté ${kE(t.perteCorvelle)}, sans assurance pour en prendre une part.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PERTE_ATTENDUE_DEMANDEE / 1000,
    "de perte attendue sur l'encours demandé par Corvelle",
    "k€",
    { juste: 2, proche: 8 },
    (e) => `${nombre(e)} k€`,
  );

  const c = p.chemin;
  const garantieUtile = c[D.corvelle] === 1 || c[D.halvane] === 3;
  const garantieChere = c[D.corvelle] === 2 || c[D.guenard] === 3 || c[D.cloture] === 2;
  const garanties = garantieUtile && !garantieChere;
  const signaux = c[D.signaux] === 1 && c[D.cloture] === 1;
  const couvrir: Constat = {
    score: garanties && signaux ? 1 : garanties || signaux ? 0.6 : 0,
    texte: `${
      garanties
        ? "Vous avez payé des garanties qui coûtaient moins que le risque qu'elles couvraient."
        : garantieChere
          ? "Vous avez payé au moins une garantie plus chère que le risque qu'elle couvrait : un acompte qui faisait fuir le chantier, une caution imposée à un artisan sûr, ou une police sur tout le portefeuille."
          : "Vous n'avez couvert ni Corvelle ni Halvane, alors qu'une assurance-crédit ou une caution solvable coûtait moins que la perte attendue."
    } ${
      signaux
        ? "Et vous avez ajusté les limites au fil des signaux, sans couper ceux qui paient tard mais paient."
        : "Les limites n'ont pas suivi les signaux : ni la surveillance de Corvelle, ni le tri des comptes en retard selon ce qu'ils cumulaient."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, couvrir];
}

export function axe([information, diagnostic, reflexe, calibrage, couvrir]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer avant d'accorder",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le dossier de Corvelle, l'historique des procédures et le chiffrage du chantier : la probabilité de défaut, le taux de récupération et la marge suffisent à savoir ce que vaut la vente.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Raisonner en perte attendue, pas en chiffre d'affaires",
      texte:
        "Une vente à crédit vaut sa marge moins la perte attendue : probabilité de défaut, fois encours, fois ce qu'on ne récupère pas. Accorder parce que la commande est grosse, ou couper au premier retard, oublie l'un des deux termes.",
    };
  }
  if (couvrir!.score === 0) {
    return {
      titre: "Payer une garantie moins cher que le risque",
      texte:
        "Avant de prendre une garantie, comparez son coût, primes, frais ou ventes perdues, à la perte attendue qu'elle couvre. Puis faites suivre la limite aux signaux qui s'accumulent, pas au premier.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Mettre la marge en face du risque",
      texte:
        "La fragilité d'un client ne dit pas s'il faut le livrer : c'est la marge, comparée à la perte attendue et au coût des garanties, qui le dit.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calculer la perte attendue",
      texte:
        "Probabilité de défaut × exposition × (1 − taux de récupération) : refaites le calcul de la semaine 1 avec les chiffres des sources, et notez votre écart.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const ASSUREUR_REPONSE = (graine: number) => {
  const a = agrementAccorde(graine);
  return a >= 500000
    ? REPONSES.agrementTotal
    : a > 0
      ? REPONSES.agrementMoitie
      : REPONSES.agrementRefuse;
};

export const EPISODE_CLIENT_A_RISQUE: Episode<Trimestre> = {
  code: "client-a-risque",
  numero: 40,
  domaine: "Crédit clients et risque de défaut",
  titre: "Le client à risque",
  resume:
    "Une entreprise générale qui gagne un gros chantier, un artisan qui paie mal, un promoteur sans historique. Une vente à crédit ne vaut que sa marge moins la perte attendue.",
  persona:
    "Vous êtes Gauthier Jacquin, responsable du crédit clients d'Arvel Distribution pour la région lyonnaise. Avec Soline Abadie, analyste crédit, vous fixez les limites d'encours de 2 300 comptes, choisissez les garanties et suivez les impayés.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge nette sur les ventes à crédit du trimestre" },
    { fort: kE(BUDGET_PERTES), texte: "de pertes sur créances et dépréciations, au plus" },
    { fort: "aucune limite", texte: "au-delà de 150 k€ sans votre accord" },
    {
      fort: "les garanties",
      texte: "assurance-crédit, cautions, acomptes : à vous de les choisir",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge sur coût variable des ventes du portefeuille, pertes sur créances, dépréciations et coût des garanties déduits, en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre crédit clients",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, Corvelle commence à passer les premières commandes du chantier ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Quentin Marsal",
        role: "Responsable grands comptes",
        alerte: true,
        texte: `Pendant ce temps, Corvelle a commandé ailleurs ses premières palettes : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la perte attendue sur l'encours de 500 k€ demandé par Corvelle, en milliers d'euros",
    unite: "k€",
    placeholder: "40",
    min: 0,
    max: 500,
    step: 0.5,
    reel: () => PERTE_ATTENDUE_DEMANDEE / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge nette du trimestre",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.max(0, Math.min(1, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "ventes",
      nom: "Chiffre d'affaires",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "chiffre d'affaires HT depuis le début du trimestre" : "à venir",
    },
    {
      cle: "encoursCorvelle",
      nom: "Encours de Corvelle",
      format: kE,
      sensBon: -1,
      aide: (_, l) =>
        l.corvelleDefaut
          ? "gelé : redressement judiciaire"
          : `limite ${kE(l.limiteCorvelle ?? 0)}${l.couvert ? `, dont ${kE(l.couvert)} sous agrément` : ""}`,
    },
    {
      cle: "perteAttendue",
      nom: "Perte attendue des comptes sensibles",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `probabilité de défaut de Corvelle : ${taux(l.pdCorvelle ?? 0, 0)}`,
    },
    {
      cle: "pertes",
      nom: "Pertes et dépréciations",
      format: kE,
      sensBon: -1,
      aide: () => `budget du trimestre : ${kE(BUDGET_PERTES)}`,
    },
  ],
  contexte(l, decisions) {
    const limite = l.limiteCorvelle ?? 0;
    return {
      encoursCorvelle: kE(l.encoursCorvelle ?? 0),
      limiteCorvelle: kE(limite),
      limiteDemandee: kE(limite + HAUSSE_DEMANDEE),
      encoursGuenard: kE(l.encoursGuenard ?? 0),
      corvelleDefaut: Boolean(l.corvelleDefaut),
      signauxCorvelle: Boolean(l.signauxCorvelle),
      assure: decisions[D.corvelle] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    const avant = de > 1 ? t.semaines[de - 1]!.pertes : 0;
    return [
      ["Marge nette de la période", kE(contribution)],
      [`Encours de Corvelle, sem. ${a}`, kE(t.semaines[a]!.encoursCorvelle)],
      ["Pertes et dépréciations de la période", kE(t.semaines[a]!.pertes - avant)],
    ];
  },
  courbe: {
    titre: "Perte attendue des comptes sensibles, semaine par semaine",
    cle: "perteAttendue",
    cible: 40000,
    libelleCible: "appétit pour le risque : 40 k€ au plus",
    graduations: [0, 50000, 100000, 150000, 200000, 250000],
    format: kE,
    details: (s) => [
      `perte attendue ${kE(s.perteAttendue!)} · encours de Corvelle ${kE(s.encoursCorvelle!)} pour une limite de ${kE(s.limiteCorvelle!)}`,
      `probabilité de défaut de Corvelle ${taux(s.pdCorvelle!, 0)} · marge nette à date ${kE(s.marge!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.corvelle && choix === 1) {
      // L'assureur répond selon le hasard du trimestre.
      return [{ ...ASSUREUR, texte: ASSUREUR_REPONSE(graine) }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.guenardParti || arrive.guenardReste) {
      lies.push({
        ...NOLAN,
        heure: `sem. ${chemin[D.guenard] === 0 ? 4 : 11}`,
        alerte: arrive.guenardParti,
        texte: arrive.guenardParti ? REPONSES.guenardParti : REPONSES.guenardReste,
      });
    }
    if (arrive.alerteAssureur) {
      lies.push({
        ...ASSUREUR,
        heure: `sem. ${SEMAINE_ALERTE_ASSUREUR}`,
        alerte: true,
        texte: REPONSES.alerteAssureur,
      });
    }
    if (arrive.reduction) {
      lies.push({
        ...SOLINE,
        heure: `sem. ${t.semaineReduction}`,
        texte: REPONSES.reduction,
      });
    }
    if (arrive.retardCorvelle) {
      lies.push({
        ...SOLINE,
        heure: `sem. ${SEMAINE_RETARD}`,
        alerte: true,
        texte: REPONSES.retardCorvelle,
      });
    }
    if (arrive.guenardDefaut) {
      lies.push({ ...SOLINE, heure: "sem. 9", alerte: true, texte: REPONSES.guenardDefaut });
    }
    if (arrive.privilege) {
      lies.push({
        ...VEILLE,
        heure: `sem. ${SEMAINE_PRIVILEGE}`,
        alerte: true,
        texte: REPONSES.privilege,
      });
    }
    if (arrive.defautCorvelle) {
      const s = t.semaines[t.corvelleDefaut]!;
      lies.push({
        ...VEILLE,
        heure: `sem. ${t.corvelleDefaut}`,
        alerte: true,
        texte: `Corvelle Bâtiment est placée en redressement judiciaire. Son encours chez Arvel est gelé : ${kE(s.encoursCorvelle)}${
          s.couvert
            ? `, dont ${kE(s.couvert)} sous agrément de l'assureur-crédit`
            : ", sans assurance-crédit"
        }. Le mandataire estime le dividende à ${taux(t.recuperationCorvelle, 0)} ; la part non couverte est dépréciée : ${kE(t.perteCorvelle)}.`,
      });
    }
    if (arrive.revendication !== null) {
      lies.push({
        ...AVOCATE,
        heure: `sem. ${SEMAINE_BRONDEL + 3}`,
        alerte: !arrive.revendication,
        texte: arrive.revendication ? REPONSES.revendicationOk : REPONSES.revendicationKo,
      });
    }
    if (arrive.estimationBrondel) {
      lies.push({
        ...MANDATAIRE,
        heure: `sem. ${SEMAINE_BRONDEL + 4}`,
        texte: `Brondel Couverture : le dividende prévisible pour les créanciers chirographaires est estimé à ${taux(t.recuperationBrondel, 0)}.`,
      });
      lies.push({
        ...XAVIER,
        heure: `sem. ${SEMAINE_BRONDEL + 4}`,
        texte: `La créance Brondel est dépréciée de ce que nous ne récupérerons pas : ${kE(t.perteBrondel)}.`,
      });
    }
    if (arrive.halvaneDefaut) {
      lies.push({
        ...SOLINE,
        heure: `sem. ${SEMAINE_DEFAUT_HALVANE}`,
        alerte: true,
        texte:
          REPONSES.halvaneDefaut +
          (chemin[D.halvane] === 3
            ? ` ${t.cautionRecouvree ? REPONSES.cautionPayee : REPONSES.cautionContestee}`
            : ` ${kE(t.perteHalvane)} de créance dépréciés.`),
      });
    }
    // Dans l'ordre des semaines où ils tombent.
    lies.sort((x, y) => Number(x.heure?.slice(5)) - Number(y.heure?.slice(5)));
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
    titre: (t) => `Marge nette ${ecartAuBudget(t.objectif)}, risque payé`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette des ventes à crédit, pertes sur créances, dépréciations et coût des garanties déduits, en écart au budget, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const chantier = CHANTIER_HEBDO * SEMAINES_CHANTIER;
      return [
        {
          nom: "Marge nette",
          valeur: kE(t.margeNette),
          aide: `budget ${kE(BUDGET)} ; ${kE(t.garanties)} de garanties`,
          tenu: t.objectif >= 0,
        },
        {
          nom: "Pertes et dépréciations",
          valeur: kE(t.pertes),
          aide: `budget ${kE(BUDGET_PERTES)}`,
          tenu: t.pertes <= BUDGET_PERTES,
        },
        {
          nom: "Corvelle",
          valeur: t.corvelleDefaut
            ? `défaut, ${kE(t.perteCorvelle)} perdus`
            : t.chantierLivre >= 0.9 * chantier
              ? "chantier livré"
              : t.chantierLivre > 0
                ? `${kE(t.chantierLivre)} livrés sur ${kE(chantier)}`
                : "chantier perdu",
          aide:
            t.agrement === null
              ? "sans assurance-crédit"
              : t.agrement > 0
                ? `agrément de l'assureur : ${kE(t.agrement)}`
                : "agrément refusé",
          tenu: t.chantierLivre >= chantier / 2 && t.perteCorvelle <= 100000,
        },
        {
          nom: "Guénard",
          valeur: t.guenardParti ? "parti à la concurrence" : "toujours client",
          aide: "client depuis 1998, il paie tard mais paie",
          tenu: !t.guenardParti,
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
          titre: "Corvelle",
          texte: t.corvelleDefaut
            ? `s'est dégradée, puis a été placée en redressement judiciaire en semaine ${t.corvelleDefaut} ; dividende estimé à ${taux(t.recuperationCorvelle, 0)}.`
            : t.corvelleDegrade
              ? "s'est dégradée, retards et privilège de l'URSSAF, sans faire défaut ce trimestre."
              : "est restée solide : le retard de mars était un incident isolé.",
        },
        ...(t.agrement !== null
          ? [
              {
                titre: "L'assureur-crédit",
                texte:
                  t.agrement >= 500000
                    ? "a agréé la totalité des 500 k€ demandés."
                    : t.agrement > 0
                      ? `n'a agréé que ${kE(t.agrement)}.`
                      : "a refusé tout agrément sur Corvelle.",
              },
            ]
          : []),
        {
          titre: "Les autres dossiers",
          texte: [
            `le mandataire de Brondel a estimé le dividende à ${taux(t.recuperationBrondel, 0)}`,
            t.revendication === null
              ? null
              : t.revendication
                ? "la revendication des marchandises a abouti"
                : "la revendication des marchandises a échoué",
            t.halvaneDefaut
              ? `Halvane a fait défaut en semaine ${SEMAINE_DEFAUT_HALVANE}`
              : t.halvaneOuvert
                ? "Halvane a payé"
                : null,
            t.guenardBloque
              ? t.guenardParti
                ? "Guénard, bloqué, est parti"
                : "Guénard, bloqué, est resté"
              : null,
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (x) => x.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
