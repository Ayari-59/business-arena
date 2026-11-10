import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  DROIT_DE_LA_PARTICIPATION,
  ENTREPRISES_DE_L_EPARGNE_SALARIALE,
  TAUX_D_INTERESSEMENT_ESSAYES,
  interessement,
  participationLegale,
  plafondDeLInteressement,
  tauxDeLAccord,
} from "../monde/epargne-salariale-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : AU-DELÀ DU SALAIRE, PRIMES, INTÉRESSEMENT ET PARTICIPATION (Bac STMG, enseignement spécifique
 * de ressources humaines et communication de terminale, thème 2, question 2.3 : « La rémunération
 * individuelle suffit-elle à motiver et fidéliser les salariés ? »).
 *
 * Les composantes de la rémunération (le fixe, les primes individuelles et collectives, les avantages),
 * la prime individuelle sur une ligne où chacun dépend des autres, l'intéressement, la participation et
 * l'épargne salariale (plan d'épargne d'entreprise, plan d'épargne retraite collectif, abondement), la
 * réserve spéciale de participation par la formule légale (montants), les règles de répartition, et un
 * accord d'intéressement bâti au laboratoire, entre la participation et le plafond légal. « Rémunération
 * et motivation » et « Du salaire brut au coût pour l'entreprise » chiffrent le salaire lui-même.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/epargne-salariale-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const AU_DELA_DU_SALAIRE: Chapitre = {
  code: "au-dela-du-salaire",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération"],
  titre: "Au-delà du salaire : primes, intéressement et participation",
  accroche:
    "NOVA a fait un bénéfice et veut le partager avec son équipe. Prime individuelle ou collective, intéressement ou participation, versement ou épargne : ce que chaque forme récompense, et ce qu'elle coûte.",
  objectifs: [
    "Distinguer les composantes de la rémunération",
    "Choisir entre prime individuelle et prime collective",
    "Distinguer intéressement, participation et épargne salariale",
    "Calculer une participation et un intéressement",
    "Situer l'épargne salariale",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_EPARGNE_SALARIALE,
    pourquoi: "ce chapitre partage le bénéfice du premier exercice de NOVA avec ses opérateurs.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Partager un bénéfice",
      texte: (c) => {
        const p = participationLegale();
        return [
          `${c.entreprise} termine son premier exercice avec ${eur(p.benefice)} de résultat net. Ses ${qte(p.effectif)} opérateurs y ont contribué. Le président veut le reconnaître, sans alourdir pour toujours les salaires.`,
          "La rémunération ne se limite pas au salaire de base. Elle ajoute des primes, des avantages, et des formes collectives liées aux résultats de l'entreprise : l'intéressement et la participation, que l'épargne salariale peut faire fructifier.",
        ];
      },
      repere: () => "Rémunération : un fixe, des primes, des avantages, et une part des résultats.",
    },
    {
      id: "les-composantes",
      objectifs: [0],
      type: "tri",
      titre: "Les composantes de la rémunération",
      question: () => "Rangez chaque élément de ce que reçoit un opérateur.",
      categories: [
        { code: "fixe", libelle: "Salaire fixe" },
        { code: "individuel", libelle: "Variable individuel" },
        { code: "collectif", libelle: "Variable collectif" },
        { code: "avantage", libelle: "Avantage" },
      ],
      elements: () => [
        { libelle: "Le salaire de base du contrat, chaque mois", montant: 0, categorie: "fixe", pourquoi: "Il ne dépend pas des résultats : le fixe." },
        { libelle: "Une prime pour l'opérateur qui monte le plus d'enceintes", montant: 0, categorie: "individuel", pourquoi: "Elle récompense la performance d'une personne : le variable individuel." },
        { libelle: "Une prime d'équipe si la ligne tient son objectif de qualité", montant: 0, categorie: "collectif", pourquoi: "Elle récompense le résultat de l'équipe : le variable collectif." },
        { libelle: "Des titres-restaurant, en partie payés par NOVA", montant: 0, categorie: "avantage", pourquoi: "Un avantage social, en plus du salaire." },
      ],
      relance: "Le montant dépend-il de rien, de la personne, de l'équipe ? Ou est-ce un avantage à côté du salaire ?",
      explication: () => ["Le fixe sécurise, le variable individuel stimule, le variable collectif rassemble, les avantages fidélisent : une politique de rémunération les dose."],
    },
    {
      id: "individuelle-ou-collective",
      objectifs: [1],
      type: "choix",
      titre: "Une prime pour le meilleur opérateur ?",
      question: () => "Le président hésite à verser une prime à l'opérateur qui monte le plus d'enceintes. Qu'en pensez-vous ?",
      options: () => [
        {
          texte: "Sur une ligne, chacun dépend des autres : une prime d'équipe convient mieux",
          juste: true,
          retour: "Oui : sur une ligne de montage, le poste le plus lent fixe le rythme de tous. Une prime individuelle pousserait chacun à aller vite au détriment de la qualité et de l'entraide ; une prime collective récompense ce que l'équipe fait ensemble.",
        },
        {
          texte: "C'est la meilleure façon de motiver : chacun voudra battre les autres, et la ligne ira plus vite pour tous",
          juste: false,
          retour: "Non : la compétition peut casser l'entraide, et un opérateur ne monte pas plus que la ligne ne lui envoie.",
        },
        {
          texte: "C'est interdit : toute prime doit être la même pour tous",
          juste: false,
          retour: "Non : une prime individuelle est permise, si ses critères sont objectifs et connus d'avance.",
        },
      ],
    },
    {
      id: "interessement-et-participation",
      type: "lecture",
      titre: "Intéressement, participation, épargne salariale",
      texte: () => {
        const d = DROIT_DE_LA_PARTICIPATION;
        return [
          `La participation redistribue aux salariés une part du bénéfice. Elle est obligatoire à partir de ${qte(d.seuilDObligation)} salariés, et suit une formule légale ; une entreprise plus petite, comme NOVA, peut l'adopter par accord. L'intéressement est facultatif : un accord le lie aux résultats ou aux performances (un objectif de qualité, de production), et il ne dépasse pas ${pct(d.plafondDeLInteressement * 100)} des salaires bruts de l'année.`,
          "Ni l'un ni l'autre n'est un salaire : ils ne supportent pas les cotisations sociales (la CSG et la CRDS restent dues). Placés sur un plan d'épargne salariale, ils échappent à l'impôt sur le revenu, et l'employeur peut y ajouter un abondement.",
        ];
      },
      repere: () => "Participation : une part du bénéfice, obligatoire dès 50 salariés. Intéressement : facultatif, lié aux performances. Épargne salariale : les placer.",
    },
    {
      id: "trois-dispositifs",
      objectifs: [2],
      type: "tri",
      titre: "Lequel est-ce ?",
      question: () => "Rangez chaque trait.",
      categories: [
        { code: "participation", libelle: "Participation" },
        { code: "interessement", libelle: "Intéressement" },
        { code: "epargne", libelle: "Épargne salariale" },
      ],
      elements: () => [
        { libelle: "Obligatoire dans une entreprise de 50 salariés ou plus", montant: 0, categorie: "participation", pourquoi: "C'est la participation : facultative en dessous." },
        { libelle: "Calculée par une formule légale, sur le bénéfice", montant: 0, categorie: "participation", pourquoi: "La réserve spéciale de participation suit la formule du Code du travail." },
        { libelle: "Versé si la ligne atteint son objectif de qualité, selon l'accord signé", montant: 0, categorie: "interessement", pourquoi: "Lié à une performance que l'accord choisit : l'intéressement." },
        { libelle: "Des sommes bloquées 5 ans, que l'employeur peut abonder", montant: 0, categorie: "epargne", pourquoi: "C'est le plan d'épargne d'entreprise : l'épargne salariale." },
      ],
      relance: "S'agit-il d'une obligation légale sur le bénéfice, d'un accord sur une performance, ou de la façon de placer les sommes ?",
      explication: () => ["Intéressement et participation associent les salariés aux résultats ; l'épargne salariale les aide à transformer ces primes en épargne."],
    },
    {
      id: "la-participation",
      objectifs: [3],
      type: "montants",
      titre: "La réserve de participation",
      question: () => {
        const p = participationLegale();
        return `Si NOVA adoptait la participation, la formule légale donnerait ½ × (B − 5 % × C) × S ÷ VA. B, le bénéfice net : ${eur(p.benefice)}. C, les capitaux propres sans le résultat de l'année : ${eur(p.capitaux)}. S, les salaires bruts : ${eur(p.salaires)}. VA, la valeur ajoutée : ${eur(p.valeurAjoutee)}. Calculez pas à pas.`;
      },
      champs: () => {
        const p = participationLegale();
        return [
          { libelle: "5 % des capitaux propres", attendu: p.cinqPourCent, calcul: `${eur(p.capitaux)} × 5 % = ${eur(p.cinqPourCent)}` },
          { libelle: "Bénéfice diminué", attendu: p.diminue, calcul: `${eur(p.benefice)} − ${eur(p.cinqPourCent)} = ${eur(p.diminue)}` },
          { libelle: "Réserve de participation", attendu: p.reserve, calcul: `½ × ${eur(p.diminue)} × ${eur(p.salaires)} ÷ ${eur(p.valeurAjoutee)} = ${eur(p.reserve)}` },
        ];
      },
      explication: () => {
        const p = participationLegale();
        return [`La réserve atteindrait ${eur(p.reserve)}, soit ${eur(p.parSalarie)} par opérateur répartis également. La formule rémunère d'abord les capitaux (les 5 %), puis partage le reste selon le poids des salaires dans la valeur ajoutée.`];
      },
    },
    {
      id: "la-repartition",
      objectifs: [2],
      type: "choix",
      titre: "Répartir entre les salariés",
      question: () => "Comment l'accord peut-il répartir l'intéressement entre les opérateurs ?",
      options: () => [
        {
          texte: "Également, selon le salaire ou le temps de présence",
          juste: true,
          retour: "Oui : la loi permet une répartition uniforme, proportionnelle aux salaires, à la durée de présence, ou une combinaison des trois. Le critère est collectif : l'intéressement n'est pas une prime au mérite.",
        },
        {
          texte: "Selon la note d'évaluation de chacun, pour récompenser les meilleurs de l'équipe",
          juste: false,
          retour: "Non : l'intéressement est collectif. Une prime au mérite individuel relève d'une autre forme de rémunération.",
        },
        {
          texte: "Au choix du président, chaque année",
          juste: false,
          retour: "Non : les règles sont fixées par l'accord, à l'avance, et s'appliquent à tous.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-l-interessement",
      objectifs: [3],
      type: "simulation",
      titre: "Bâtir l'accord d'intéressement",
      question: () => {
        const p = participationLegale();
        return `Le président propose de verser en intéressement une part du résultat net de ${eur(p.benefice)}. Il veut donner au moins ce que donnerait la participation (${eur(p.reserve)}), et la loi plafonne l'intéressement à ${pct(DROIT_DE_LA_PARTICIPATION.plafondDeLInteressement * 100)} des salaires bruts (${eur(plafondDeLInteressement())}). Faites varier la part du résultat versée.`;
      },
      leviers: () => {
        const t = TAUX_D_INTERESSEMENT_ESSAYES;
        return [{ code: "taux", libelle: "Part du résultat net versée", unite: "%", min: t.min, max: t.max, pas: t.pas, depart: t.min }];
      },
      lecture: (_c, p) => {
        const k = interessement(p.taux!);
        return [
          { libelle: "Intéressement versé", montant: k.total, fort: true },
          { libelle: "Participation légale, pour comparer", montant: k.participation },
          { libelle: "Par opérateur", montant: k.parSalarie },
          { libelle: "Marge sous le plafond légal", montant: Math.round((k.plafond - k.total) * 100) / 100, effet: true },
        ];
      },
      defi: () => ({
        consigne: "Trouvez la part qui verse au moins la participation, sans dépasser le plafond légal.",
        atteint: (p) => interessement(p.taux!).tenu,
        indice: (p) => {
          const k = interessement(p.taux!);
          return k.total < k.participation ? `À ${pct(k.taux)}, l'équipe recevrait ${eur(k.total)}, moins que la participation.` : `À ${pct(k.taux)}, ${eur(k.total)} dépasseraient le plafond de ${eur(k.plafond)}.`;
        },
        solution: { taux: tauxDeLAccord() },
      }),
      explication: (_c, p) => {
        const k = interessement(p.taux!);
        return [
          `Défi relevé : ${pct(k.taux)} du résultat, soit ${eur(k.total)}, ${eur(k.parSalarie)} par opérateur. L'intéressement suit le résultat : une mauvaise année, il baisse, sans toucher aux salaires. C'est sa force pour l'entreprise, et sa limite pour le salarié, qui ne peut pas compter dessus.`,
        ];
      },
    },
    {
      id: "placer",
      objectifs: [4],
      type: "tri",
      titre: "Que faire de sa prime ?",
      question: () => "Rangez chaque usage de l'intéressement d'un opérateur.",
      categories: [
        { code: "pee", libelle: "Plan d'épargne d'entreprise" },
        { code: "per", libelle: "Plan d'épargne retraite collectif" },
        { code: "verse", libelle: "Versé tout de suite" },
      ],
      elements: () => [
        { libelle: "Bloqué 5 ans, sauf achat de la résidence principale, mariage et quelques autres cas", montant: 0, categorie: "pee", pourquoi: "Le plan d'épargne d'entreprise : 5 ans, avec des cas de déblocage anticipé que la loi énumère." },
        { libelle: "Disponible à la retraite, en capital ou en rente", montant: 0, categorie: "per", pourquoi: "Le plan d'épargne retraite collectif : une épargne de long terme." },
        { libelle: "Sur le compte bancaire dès le mois suivant, soumis à l'impôt sur le revenu", montant: 0, categorie: "verse", pourquoi: "Non placé, il est imposable : on le reçoit tout de suite." },
      ],
      relance: "La somme est-elle bloquée quelques années, jusqu'à la retraite, ou disponible tout de suite ?",
      explication: () => ["Placées, les sommes échappent à l'impôt sur le revenu et peuvent recevoir un abondement de l'employeur : l'épargne salariale fidélise, puisqu'elle se construit dans l'entreprise."],
    },
    {
      id: "suffit-elle",
      objectifs: [1],
      type: "choix",
      titre: "La rémunération individuelle suffit-elle ?",
      question: () => "Un salaire individuel suffit-il à motiver et fidéliser l'équipe de NOVA ?",
      options: () => [
        {
          texte: "Non : le collectif et la reconnaissance comptent aussi",
          juste: true,
          retour: "Oui : un salaire juste évite le départ, mais associer l'équipe aux résultats, par l'intéressement ou la participation, et reconnaître le travail font qu'elle s'investit et reste.",
        },
        {
          texte: "Oui : un salaire élevé règle tout, le reste ne compte pas pour un opérateur",
          juste: false,
          retour: "Non : au-delà d'un salaire jugé juste, l'argent motive moins que la reconnaissance, le sens du travail et le partage des résultats.",
        },
        {
          texte: "Non, il faut remplacer le salaire par l'intéressement",
          juste: false,
          retour: "Non : la loi interdit que l'intéressement remplace un élément du salaire. Il s'ajoute, il ne se substitue pas.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = interessement(tauxDeLAccord());
        return [
          `${c.entreprise} peut partager son bénéfice au-delà du salaire. La participation légale donnerait ${eur(participationLegale().reserve)} ; un accord d'intéressement à ${pct(k.taux)} du résultat verse ${eur(k.total)}, sous le plafond légal. Une prime d'équipe convient mieux qu'une prime individuelle sur une ligne où chacun dépend des autres, et l'épargne salariale transforme les primes en épargne.`,
          "Dans l'arène, les salaires se décident à chaque tour, face à ceux du marché : la rémunération individuelle retient, la reconnaissance et le partage font le reste.",
        ];
      },
      repere: () => "Fixe, variable individuel et collectif, avantages · intéressement · participation et sa formule · plafond · répartition · PEE, PER collectif, abondement.",
    },
  ],
};
