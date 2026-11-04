import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, ENDETTEMENT_MAXIMAL } from "../financement";
import {
  APPORT_DE_LA_BUSINESS_ANGEL,
  BESOIN_EXTERNE,
  EMISSION_OBLIGATAIRE_MINIMALE,
  INTERETS_PLAFOND,
  PART_MINIMALE_DES_FONDATEURS,
  PREMIERE_ANNEE_PLAFOND,
  PRET_DE_BPIFRANCE,
  PRET_EN_COURS,
  PRET_VERT,
  SUBVENTION_DE_LA_LIGNE,
  TICKET_MINIMAL_DU_FONDS,
  apportDeLaBusinessAngel,
  engagementBancaire,
  engagementBpifrance,
  engagementParticipatif,
  engagementsEnCours,
  montage,
  montageTenable,
  pretVert,
  seuilDuPretVert,
} from "../monde/acteurs-du-financement";
import { EMPRUNT_DE_LA_LIGNE, RESERVE_DE_LA_GAMME } from "../monde/financement-de-la-gamme";
import { COMPTE_COURANT, PRET_PARTICIPATIF, TAUX_DE_LA_SUBVENTION } from "../monde/financement-du-lycee";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES ACTEURS ET LES MODES DE FINANCEMENT (comptabilité générale, palier 4 ; DCG UE6 3.1
 * et 3.2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le plan de financement de la gamme (financement-de-la-
 * gamme.ts) a conclu qu'il manque 80 000 € en N+1 ; les offres sont celles des chapitres de NOVA (la
 * banque à 5 %, le compte courant et le prêt participatif de « Financer autrement », la business angel
 * de l'augmentation de capital de N+1) et quelques hypothèses nommées (Bpifrance, le prêt vert, la
 * certification et l'ADEME). Tout se calcule dans monde/acteurs-du-financement.ts.
 *
 * L'objet : qui finance une entreprise, et comment. Les intermédiaires financiers (la banque, une
 * plateforme de prêt, les souscripteurs d'obligations) ; ceux qui entrent au capital (la business angel,
 * les fonds, l'equity crowdfunding) ; les associés en compte courant ; les acteurs publics et du
 * financement vert. Puis ce que chaque mode engage l'entreprise à rendre, en capital et en intérêts,
 * ce qu'elle doit déjà, et le montage qui tient ses contraintes. Le coût actuariel de chaque mode
 * n'est pas l'objet : c'est celui du chapitre « Arbitrer les coûts de financement ». « Financer
 * autrement » a posé au lycée la subvention, le compte courant et le prêt participatif ; ce chapitre
 * monte au niveau du DCG : la place de chaque acteur, le risque qu'il porte, la valeur de ce que
 * l'entreprise lui promet ou lui cède.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, les-acteurs (un tri), le-risque, le-compte-courant ;
 *   · l'expérience avant la formule : predire-les-engagements puis les-engagements ;
 *   · autonome : les-engagements-en-cours, le-pret-de-bpifrance ;
 *   · l'expérience avant la formule : predire-le-pret-vert puis le-pret-vert-au-curseur (le montant à
 *     partir duquel le prêt vert paie sa certification) ;
 *   · expert : la-business-angel (ce que l'apport cède), hors-de-portee ; le laboratoire du montage,
 *     avec un graphique ; la-solution ; puis la synthèse.
 *
 * MATIÈRE : le cours du propriétaire « Gestion des investissements, rentabilité financière » (les
 * conséquences de chaque moyen de financement : fonds propres, emprunt, subvention, crédit-bail),
 * adapté à NOVA.
 */

/** Le financement se décide ici sur la gamme de NOVA, dans la simulation du cours. */
export const ENTREPRISES_DES_ACTEURS: readonly string[] = ["nova"];

/** Les bornes du curseur du prêt vert, en milliers d'euros. */
export const PRET_VERT_DU_CURSEUR = { min: 0, max: 150 } as const;

/** Les leviers du laboratoire, en euros : le compte courant et Bpifrance ; la business angel est un choix. */
export const LEVIERS_DU_MONTAGE = {
  compteCourant: { min: 0, max: COMPTE_COURANT.plafond!, pas: 10_000 },
  bpifrance: { min: 0, max: 40_000, pas: 10_000 },
} as const;

/** La solution que montre la correction : 40 000 € en compte courant, 40 000 € à la banque, sans ouvrir le capital. */
export const SOLUTION_DU_MONTAGE = { capital: 0, compteCourant: 40_000, bpifrance: 0 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 1) => `${qte(t * 100, d)} %`;
const ans = (n: number) => `${qte(n)} an${n >= 2 ? "s" : ""}`;

/** Les chiffres du chapitre. */
export function acteursDuChapitre(_c: Pick<Cas, "code">) {
  const banque = engagementBancaire(BESOIN_EXTERNE);
  const participatif = engagementParticipatif(BESOIN_EXTERNE);
  const bpifrance = engagementBpifrance(LEVIERS_DU_MONTAGE.bpifrance.max);
  return {
    banque,
    participatif,
    bpifrance,
    enCours: engagementsEnCours(),
    vert: pretVert(BESOIN_EXTERNE),
    seuilVert: seuilDuPretVert()!,
    angel: apportDeLaBusinessAngel(),
    toutALaBanque: montage(),
    solution: montage(SOLUTION_DU_MONTAGE),
    avecLAngel: montage({ capital: APPORT_DE_LA_BUSINESS_ANGEL.montant }),
  };
}

/** Le montage à une position du laboratoire. */
export const montageDuLaboratoire = (p: Readonly<Record<string, number>>) => montage({ capital: p.capital ?? 0, compteCourant: p.compteCourant ?? 0, bpifrance: p.bpifrance ?? 0 });

/** Les offres faites à NOVA : ce que chaque acteur apporte et à quelles conditions. */
export function lesOffres(_c: Pick<Cas, "code">): TableauDeDonnees {
  const b = PRET_DE_BPIFRANCE;
  return {
    titre: `Qui peut apporter les ${eur(BESOIN_EXTERNE)} ?`,
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "La banque de NOVA", valeurs: [`${pct(EMPRUNT_DE_LA_LIGNE.taux)} sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)}, le capital en parts égales chaque année`] },
      { libelle: "Bpifrance, prêt de développement", valeurs: [`${pct(b.taux)} sur ${ans(b.dureeAns)}, les intérêts seuls la première année, puis le capital en parts égales ; au plus autant que la banque`] },
      { libelle: "Une plateforme de prêt participatif", valeurs: [`${pct(PRET_PARTICIPATIF.taux)} sur ${ans(PRET_PARTICIPATIF.dureeAns)}, le capital en une fois à la fin`] },
      { libelle: "Les fondateurs, en compte courant", valeurs: [`${pct(COMPTE_COURANT.taux)} sur ${ans(COMPTE_COURANT.dureeAns)}, bloqué, remboursé en une fois ; ${eur(COMPTE_COURANT.plafond!)} au plus`] },
      { libelle: "Une business angel", valeurs: [`${qte(APPORT_DE_LA_BUSINESS_ANGEL.actions)} actions nouvelles à ${eur(APPORT_DE_LA_BUSINESS_ANGEL.prix)}, ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)}`] },
      { libelle: "La région", valeurs: [`une subvention de ${pct(TAUX_DE_LA_SUBVENTION, 0)} de la ligne, ${eur(SUBVENTION_DE_LA_LIGNE)}, si NOVA la garde et crée l'emploi annoncé`] },
      { libelle: "Le prêt vert de la banque", valeurs: [`${qte(PRET_VERT.reductionDuTaux * 100)} point de moins si la ligne est certifiée ; la certification coûte ${eur(PRET_VERT.certification)}, dont ${pct(PRET_VERT.partDeLAdeme, 0)} pris en charge par l'ADEME`] },
    ],
  };
}

export const LES_ACTEURS_ET_LES_MODES_DE_FINANCEMENT: Chapitre = {
  code: "les-acteurs-et-les-modes-de-financement",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "Les acteurs et les modes de financement",
  accroche:
    "Il manque 80 000 € à NOVA pour lancer sa gamme. La banque, Bpifrance, des internautes, les fondateurs, une business angel, la région, l'ADEME : qui apporte quoi, qui porte quel risque, et ce que NOVA s'engage à rendre ou à céder.",
  objectifs: [
    "Identifier les acteurs du financement : intermédiaires financiers, apporteurs de capitaux, associés, acteurs publics et du financement vert",
    "Distinguer les modes de financement selon leur origine et le risque que portent ceux qui les apportent",
    "Déterminer et valoriser les engagements financiers de l'entreprise, en cours et nouveaux",
    "Proposer une ou plusieurs solutions de financement qui tiennent les contraintes de l'entreprise",
  ],
  libre: false,
  prerequis: ["le-plan-de-financement", "financer-autrement"],
  entreprises: {
    codes: ENTREPRISES_DES_ACTEURS,
    pourquoi: "le financement se décide ici sur la gamme de NOVA, dans la simulation du cours ; la démarche vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Il manque 80 000 €",
      notions: ["loan_schedule", "dilution_issuance"],
      tableau: lesOffres,
      texte: () => [
        `Le plan de financement de la gamme l'a montré : en N+1, la réserve de ${eur(RESERVE_DE_LA_GAMME)} et la capacité d'autofinancement ne suffisent pas. Il manque ${eur(BESOIN_EXTERNE)}. Le plan les a demandés à la banque ; ce chapitre se demande qui d'autre pourrait les apporter.`,
        "L'autofinancement vient en premier : ce que l'activité dégage reste dans l'entreprise, sans rien devoir à personne. Au-delà, deux familles. Le financement intermédié passe par un intermédiaire qui collecte l'épargne et la prête : une banque, une plateforme de prêt. Les apporteurs de capitaux, eux, deviennent associés : une business angel, un fonds, des internautes par une plateforme d'equity crowdfunding. Entre les deux, les associés peuvent prêter en compte courant ; et des acteurs publics ou du financement vert aident à certaines conditions.",
        "Un prêteur est payé avant les associés, à des dates fixées, quoi qu'il arrive : il porte peu de risque, et demande peu. Un associé n'est payé que si l'entreprise réussit : il porte le risque, et prend en échange une part du capital et des bénéfices.",
      ],
      repere: () => "Engagement d'un financement = capital à rendre + intérêts de toute la durée. Un apport au capital n'engage aucun remboursement : il cède une part de l'entreprise.",
    },
    {
      id: "les-acteurs",
      objectifs: [0],
      type: "tri",
      titre: "Qui est qui",
      notions: ["loan_schedule", "dilution_issuance"],
      question: () => "Rangez chaque acteur dans sa famille. Le montant est ce qu'il peut apporter, ou demande au moins, ou coûte.",
      categories: [
        { code: "intermediaire", libelle: "Intermédiaire financier" },
        { code: "capital", libelle: "Entre au capital" },
        { code: "associes", libelle: "Associés qui prêtent" },
        { code: "public", libelle: "Public ou financement vert" },
      ],
      elements: () => [
        { libelle: "La banque de NOVA, pour un prêt de 5 ans", montant: BESOIN_EXTERNE, categorie: "intermediaire", pourquoi: "Elle collecte des dépôts et les prête : c'est l'intermédiaire financier type." },
        { libelle: "Une plateforme de prêt participatif", montant: BESOIN_EXTERNE, categorie: "intermediaire", pourquoi: "Le lending crowdfunding : la plateforme réunit des internautes qui prêtent, sans devenir associés." },
        { libelle: "Les souscripteurs d'un emprunt obligataire", montant: EMISSION_OBLIGATAIRE_MINIMALE, categorie: "intermediaire", pourquoi: "Ils prêtent à l'entreprise, par des obligations placées par des banques : une dette, pas une part du capital." },
        { libelle: "Une business angel", montant: APPORT_DE_LA_BUSINESS_ANGEL.montant, categorie: "capital", pourquoi: "Une personne qui investit son argent au capital d'une jeune entreprise, souvent avec ses conseils." },
        { libelle: "Un fonds de capital développement", montant: TICKET_MINIMAL_DU_FONDS, categorie: "capital", pourquoi: "Le private equity : un fonds entre au capital pour quelques années, puis revend sa part." },
        { libelle: "Une plateforme d'equity crowdfunding", montant: APPORT_DE_LA_BUSINESS_ANGEL.montant, categorie: "capital", pourquoi: "Des internautes souscrivent des actions nouvelles : ils deviennent associés." },
        { libelle: "Les fondateurs, en compte courant", montant: COMPTE_COURANT.plafond!, categorie: "associes", pourquoi: "Ils prêtent leur épargne à NOVA, sans recevoir de part de capital de plus." },
        { libelle: "Bpifrance", montant: LEVIERS_DU_MONTAGE.bpifrance.max, categorie: "public", pourquoi: "La banque publique d'investissement : elle prête, garantit et aide, aux côtés des banques." },
        { libelle: "La région", montant: SUBVENTION_DE_LA_LIGNE, categorie: "public", pourquoi: "Une subvention publique, qui ne se rembourse pas si l'entreprise tient ses engagements." },
        { libelle: "L'ADEME", montant: PRET_VERT.certification * PRET_VERT.partDeLAdeme, categorie: "public", pourquoi: "L'agence de la transition écologique aide les études et les investissements qui réduisent l'empreinte." },
        { libelle: "L'organisme certificateur", montant: PRET_VERT.certification, categorie: "public", pourquoi: "Il ne finance pas : il atteste la performance de la ligne, et ouvre ainsi le prêt vert." },
      ],
      explication: () => [
        "Quatre familles, quatre relations avec NOVA. L'intermédiaire financier prête et sera remboursé ; celui qui entre au capital devient associé ; l'associé en compte courant reste associé et devient aussi prêteur ; l'acteur public ou du financement vert aide à une condition, ou atteste qu'elle est remplie.",
        "Les tickets disent déjà qui est à la portée de NOVA : un fonds ou une émission d'obligations visent des montants sans commune mesure avec ses besoins.",
      ],
      relance: "Demandez-vous si l'acteur prête, devient associé, l'est déjà, ou aide au nom d'une politique publique.",
    },
    {
      id: "le-risque",
      objectifs: [1],
      type: "choix",
      titre: "Qui porte le risque",
      notions: ["dilution_issuance", "loan_schedule"],
      question: () => "Supposez que la gamme échoue et que NOVA ne puisse plus payer ses dettes. Qui est le plus exposé à perdre son argent ?",
      options: () => [
        { texte: "La business angel, devenue associée", juste: true, retour: "Oui. Un associé n'est payé qu'après tous les créanciers : il porte le risque de l'entreprise. C'est pourquoi il attend en échange une part des bénéfices et de la valeur, et non un intérêt fixe." },
        { texte: "La banque, qui a prêté le plus gros montant", juste: false, retour: "La banque est remboursée avant les associés, et demande souvent une garantie. Elle porte un risque, mais le plus faible : c'est ce qui lui permet de prêter à 5 %." },
        { texte: "Les internautes du prêt participatif, sans garantie", juste: false, retour: "Ils prêtent sans garantie, d'où leur taux plus élevé ; mais ce sont des créanciers, payés avant les associés." },
      ],
    },
    {
      id: "le-compte-courant",
      objectifs: [1],
      type: "choix",
      titre: "Le compte courant, dette ou fonds propres ?",
      notions: ["loan_schedule", "balance_sheet"],
      question: () => `Les fondateurs prêteraient ${eur(COMPTE_COURANT.plafond!)} en compte courant, bloqués ${ans(COMPTE_COURANT.dureeAns)}. Comment la banque lira-t-elle ce compte courant ?`,
      options: () => [
        { texte: "Une dette, presque des fonds propres s'il est bloqué", juste: true, retour: "Oui. Au bilan, c'est une dette envers les associés. Mais bloqué, et souvent remboursé après la banque, il protège le prêteur presque comme du capital : la banque le compte en quasi-fonds propres." },
        { texte: "Des capitaux propres : l'argent vient des associés", juste: false, retour: "L'argent vient des associés, mais il est prêté, pas apporté : il se rembourse et porte intérêt. Le capital ne bouge pas." },
        { texte: "Rien : un prêt entre associés et société ne regarde pas la banque", juste: false, retour: "Au contraire : c'est une dette de NOVA, qui pèse sur sa capacité de remboursement, et la banque le lit de près." },
      ],
    },
    {
      id: "predire-les-engagements",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les engagements",
      notions: ["loan_schedule"],
      question: () =>
        `NOVA emprunte ${eur(BESOIN_EXTERNE)} : à la banque, à ${pct(EMPRUNT_DE_LA_LIGNE.taux)} sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)} en parts égales, ou à des internautes, à ${pct(PRET_PARTICIPATIF.taux)} sur ${ans(PRET_PARTICIPATIF.dureeAns)}, remboursés en une fois. Pariez : sur toute la durée, le prêt participatif engage NOVA à payer en intérêts…`,
      options: (c) => {
        const k = acteursDuChapitre(c);
        const voir = `Comptez-le à l'étape suivante : ${eur(k.participatif.interets)} contre ${eur(k.banque.interets)}.`;
        return [
          { texte: "Bien plus que la banque", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Un peu moins : il dure une année de moins", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant : un point d'écart ne change presque rien", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-engagements",
      objectifs: [2],
      type: "montants",
      titre: "Ce que NOVA s'engage à rendre",
      notions: ["loan_schedule"],
      question: () =>
        `Valorisez les deux engagements. La banque : chaque année, ${eur(BESOIN_EXTERNE / EMPRUNT_DE_LA_LIGNE.dureeAns)} de capital et les intérêts sur le capital encore dû. Le prêt participatif : les intérêts sur tout le capital chaque année, et le capital la dernière.`,
      champs: (c) => {
        const k = acteursDuChapitre(c);
        const b = k.banque;
        const p = k.participatif;
        return [
          { libelle: "Banque : intérêts de toute la durée", attendu: b.interets, calcul: `${b.tableau.map((a) => eur(a.interets)).join(" + ")} = ${eur(b.interets)}` },
          { libelle: "Banque : ce que NOVA s'engage à rendre", attendu: b.total, calcul: `${eur(b.capital)} + ${eur(b.interets)} = ${eur(b.total)}` },
          { libelle: "Banque : sorties de la première année", attendu: b.premiereAnnee, calcul: `${eur(b.tableau[0]!.capital)} + ${eur(b.tableau[0]!.interets)} = ${eur(b.premiereAnnee)}` },
          { libelle: "Prêt participatif : intérêts de toute la durée", attendu: p.interets, calcul: `${eur(BESOIN_EXTERNE)} × ${pct(PRET_PARTICIPATIF.taux)} × ${PRET_PARTICIPATIF.dureeAns} = ${eur(p.interets)}` },
          { libelle: "Prêt participatif : sorties de la première année", attendu: p.premiereAnnee, calcul: `${eur(BESOIN_EXTERNE)} × ${pct(PRET_PARTICIPATIF.taux)} = ${eur(p.premiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const k = acteursDuChapitre(c);
        return [
          `Le prêt participatif engage ${eur(k.participatif.interets - k.banque.interets)} d'intérêts de plus : un taux plus haut, et un capital qui reste dû en entier jusqu'au bout. Mais la première année, il ne prend que ${eur(k.participatif.premiereAnnee)} à la trésorerie, contre ${eur(k.banque.premiereAnnee)} pour la banque.`,
          "Valoriser un engagement, c'est additionner ce que l'entreprise a promis de payer : le capital et les intérêts, et dire quand. Comparer leur coût réel, actualisé, sera l'objet du chapitre sur le coût des financements.",
        ];
      },
    },
    {
      id: "les-engagements-en-cours",
      objectifs: [2],
      type: "montants",
      titre: "Ce que NOVA doit déjà",
      notions: ["loan_schedule", "balance_sheet"],
      question: (c) => {
        const k = acteursDuChapitre(c);
        return `Sans formule cette fois. Avant de s'engager encore, NOVA doit déjà. Son emprunt de création : ${eur(k.enCours.capitalRestantDu)} restant dus au 31 décembre, ${qte(k.enCours.echeancesAVenir)} échéances trimestrielles de ${eur(PRET_EN_COURS.capital / (PRET_EN_COURS.dureeAns * PRET_EN_COURS.echeancesParAn))} de capital, avec les intérêts du trimestre à ${pct(PRET_EN_COURS.tauxAnnuel / PRET_EN_COURS.echeancesParAn, 2)} du capital restant dû. Et son bail : ${eur(k.enCours.loyers)} de loyers pour l'année à venir, que le bilan ne montre pas. Valorisez ces engagements.`;
      },
      champs: (c) => {
        const e = acteursDuChapitre(c).enCours;
        const capitalParEcheance = PRET_EN_COURS.capital / (PRET_EN_COURS.dureeAns * PRET_EN_COURS.echeancesParAn);
        return [
          {
            libelle: "Intérêts à venir de l'emprunt",
            attendu: e.interetsAVenir,
            calcul: `les capitaux restant dus avant chaque échéance font ${eur(capitalParEcheance)} × (${e.echeancesAVenir} + … + 1) = ${eur((capitalParEcheance * e.echeancesAVenir * (e.echeancesAVenir + 1)) / 2)} ; × ${pct(PRET_EN_COURS.tauxAnnuel / PRET_EN_COURS.echeancesParAn, 2)} = ${eur(e.interetsAVenir)}`,
          },
          { libelle: "Engagement de l'emprunt", attendu: e.emprunt, calcul: `${eur(e.capitalRestantDu)} + ${eur(e.interetsAVenir)} = ${eur(e.emprunt)}` },
          { libelle: "Engagements en cours, bail compris", attendu: e.total, calcul: `${eur(e.emprunt)} + ${eur(e.loyers)} = ${eur(e.total)}` },
        ];
      },
      explication: (c) => {
        const e = acteursDuChapitre(c).enCours;
        return [
          `Le bilan ne montre que ${eur(e.capitalRestantDu)} de dettes financières. NOVA s'est pourtant engagée à payer ${eur(e.total)} : les intérêts à venir et le loyer sont des engagements aussi fermes qu'une échéance, simplement pas encore au bilan.`,
          "Un banquier les lit tous : le loyer sort chaque mois de la trésorerie, et il pèse sur ce que NOVA peut encore rembourser.",
        ];
      },
    },
    {
      id: "le-pret-de-bpifrance",
      objectifs: [2],
      type: "montants",
      titre: "Le prêt de Bpifrance, avec différé",
      notions: ["loan_schedule"],
      question: (c) => {
        const k = acteursDuChapitre(c);
        const b = PRET_DE_BPIFRANCE;
        return `Bpifrance prêterait ${eur(k.bpifrance.capital)} à ${pct(b.taux)} sur ${ans(b.dureeAns)}, aux côtés de la banque : la première année, les intérêts seuls ; puis le capital en ${b.dureeAns - b.differeAns} parts égales, avec les intérêts sur ce qui reste dû. Valorisez l'engagement.`;
      },
      champs: (c) => {
        const k = acteursDuChapitre(c);
        const b = k.bpifrance;
        return [
          { libelle: "Sorties de la première année", attendu: b.premiereAnnee, calcul: `${eur(b.capital)} × ${pct(PRET_DE_BPIFRANCE.taux)} = ${eur(b.premiereAnnee)}, sans capital` },
          { libelle: "Intérêts de toute la durée", attendu: b.interets, calcul: `${b.tableau.map((a) => eur(a.interets)).join(" + ")} = ${eur(b.interets)}` },
          { libelle: "Ce que NOVA s'engage à rendre", attendu: b.total, calcul: `${eur(b.capital)} + ${eur(b.interets)} = ${eur(b.total)}` },
        ];
      },
      explication: (c) => {
        const k = acteursDuChapitre(c);
        return [
          `Le différé soulage l'année du lancement, ${eur(k.bpifrance.premiereAnnee)} au lieu d'une annuité pleine, mais il se paie : un capital qui reste dû plus longtemps porte plus d'intérêts. Bpifrance ne remplace pas la banque, elle l'accompagne : son prêt sans caution du dirigeant rend le dossier plus facile à prêter pour la banque.`,
        ];
      },
    },
    {
      id: "predire-le-pret-vert",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le prêt vert",
      notions: ["loan_schedule", "csr_index"],
      question: () =>
        `La banque baisse son taux de ${qte(PRET_VERT.reductionDuTaux * 100)} point si la ligne est certifiée ; la certification coûte ${eur(PRET_VERT.certification)}, dont l'ADEME prend la moitié. Pariez : le prêt vert paie-t-il sa certification sur ${eur(BESOIN_EXTERNE)} empruntés sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)} ?`,
      options: (c) => {
        const k = acteursDuChapitre(c);
        const voir = "Faites varier le montant emprunté à l'étape suivante.";
        return [
          { texte: "Oui, de peu", juste: true, retour: `Bon pari : ${eur(k.vert.epargne)} d'intérêts épargnés contre ${eur(k.vert.certificationNette)} de certification. ${voir}` },
          {
            texte: `Oui, largement : ${eur(BESOIN_EXTERNE * PRET_VERT.reductionDuTaux)} par an pendant ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)}`,
            juste: false,
            retour: `Pari à vérifier : le capital baisse chaque année, les intérêts épargnés aussi. ${voir}`,
          },
          { texte: "Non : la certification coûte plus que ce qu'elle fait gagner", juste: false, retour: `Pari à vérifier : l'aide de l'ADEME change le calcul. ${voir}` },
        ];
      },
    },
    {
      id: "le-pret-vert-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le prêt vert, au curseur",
      notions: ["loan_schedule", "csr_index"],
      question: () =>
        `Faites varier le montant emprunté en prêt vert, de ${PRET_VERT_DU_CURSEUR.min} à ${PRET_VERT_DU_CURSEUR.max} milliers d'euros. Une droite donne les intérêts épargnés sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)}, l'autre la certification, aide de l'ADEME déduite. À partir de quel montant le prêt vert paie-t-il sa certification ? Placez le curseur au millier d'euros près.`,
      grandeur: () => ({ libelle: "Montant emprunté en prêt vert", unite: "milliers d'euros" }),
      cible: (c) => ({ attendu: acteursDuChapitre(c).seuilVert, min: PRET_VERT_DU_CURSEUR.min, max: PRET_VERT_DU_CURSEUR.max }),
      zones: ["Le prêt vert gagne", "La certification coûte plus"],
      rates: () => ({
        dessous: "À ce montant, les intérêts épargnés ne paient pas encore la certification : empruntez plus.",
        dessus: "La certification est déjà payée avec un millier d'euros de moins : cherchez le plus petit montant.",
      }),
      montrer: "Montrer le montant",
      lecture: (_c, k) => {
        const v = pretVert(k * 1_000);
        return [
          { libelle: "Intérêts au taux normal", montant: v.normal.interets },
          { libelle: "Intérêts au taux vert", montant: v.vert.interets },
          { libelle: "Intérêts épargnés", montant: v.epargne },
          { libelle: "Certification, aide de l'ADEME déduite", montant: v.certificationNette },
          { libelle: "Gain du prêt vert", montant: v.gain, fort: true },
        ];
      },
      droites: () => ({
        produit: (k) => pretVert(k * 1_000).epargne,
        cout: () => pretVert(0).certificationNette,
        libelles: ["Intérêts épargnés", "Certification nette"],
      }),
      explication: (c) => {
        const k = acteursDuChapitre(c);
        return [
          `En parts égales sur ${ans(EMPRUNT_DE_LA_LIGNE.dureeAns)}, le capital dû, additionné année par année, vaut ${qte((EMPRUNT_DE_LA_LIGNE.dureeAns + 1) / 2)} fois le montant emprunté : chaque millier emprunté épargne ${eur(pretVert(1_000).epargne)} d'intérêts. À partir de ${qte(k.seuilVert)} milliers d'euros, le prêt vert paie la certification ; sur ${eur(BESOIN_EXTERNE)}, il rapporte ${eur(k.vert.gain)}.`,
          "Le gain est mince ; l'essentiel est ailleurs. L'organisme certificateur atteste une performance que la banque n'a pas à vérifier elle-même, et que NOVA pourra montrer à ses clients : le financement vert récompense un engagement qui se prouve.",
        ];
      },
    },
    {
      id: "la-business-angel",
      objectifs: [1, 2],
      type: "montants",
      titre: "Ce que cède l'apport au capital",
      notions: ["dilution_issuance", "enterprise_value"],
      question: (c) => {
        const a = acteursDuChapitre(c).angel;
        return `La business angel apporterait ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)} contre des actions nouvelles à ${eur(APPORT_DE_LA_BUSINESS_ANGEL.prix)}. NOVA compte ${qte(a.total - a.actions)} actions et ${eur(a.capitauxPropres)} de capitaux propres au 31 décembre. Rien ne sera à rembourser ; mais que cède NOVA ? Calculez les actions nouvelles, la part du capital qu'elle prendrait, en %, et ce que vaudrait sa part des capitaux propres après l'apport.`;
      },
      champs: (c) => {
        const a = acteursDuChapitre(c).angel;
        return [
          { libelle: "Actions nouvelles", attendu: a.actions, calcul: `${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)} ÷ ${eur(APPORT_DE_LA_BUSINESS_ANGEL.prix)} = ${qte(a.actions)}` },
          { libelle: "Part du capital de la business angel, en %", attendu: Math.round(a.part * 10_000) / 100, calcul: `${qte(a.actions)} ÷ ${qte(a.total)} = ${pct(a.part, 2)}`, tolerance: 0.01 },
          { libelle: "Sa part des capitaux propres après l'apport", attendu: a.saPart, calcul: `(${eur(a.capitauxPropres)} + ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)}) × ${pct(a.part, 2)} = ${eur(a.saPart)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = acteursDuChapitre(c).angel;
        return [
          `Pour ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)}, la business angel détiendrait une part des capitaux propres de ${eur(a.saPart)} : chaque action valait ${eur(a.valeurDeLActionAvant)} avant l'apport, et elle l'achète ${eur(APPORT_DE_LA_BUSINESS_ANGEL.prix)}. Les fondateurs lui cèdent ${eur(a.saPart - APPORT_DE_LA_BUSINESS_ANGEL.montant)} de valeur, et ${pct(a.part, 0)} des bénéfices et des voix à venir.`,
          "Le capital n'engage aucun remboursement, mais il n'est pas gratuit : il se paie en part du capital, de la valeur et du pouvoir. Ce qu'il coûte vraiment, la rentabilité qu'exige l'associé, est l'objet du chapitre sur le coût des financements.",
        ];
      },
    },
    {
      id: "hors-de-portee",
      objectifs: [0],
      type: "choix",
      titre: "Ceux qui ne viendront pas",
      notions: ["dilution_issuance"],
      question: () => `Pourquoi NOVA ne demande-t-elle ses ${eur(BESOIN_EXTERNE)} ni à un fonds de capital développement, ni au marché par un emprunt obligataire ?`,
      options: () => [
        { texte: "Leurs tickets dépassent de loin son besoin", juste: true, retour: `Oui. Un fonds n'étudie pas de dossier sous ${eur(TICKET_MINIMAL_DU_FONDS)} : l'analyse et le suivi coûtent autant pour un petit dossier que pour un grand. Une émission obligataire se compte en dizaines de millions, et demande une notoriété que NOVA n'a pas encore.` },
        { texte: "La loi réserve ces financements aux sociétés cotées en bourse", juste: false, retour: "Non : des fonds investissent dans des sociétés non cotées, c'est même leur métier. C'est la taille du besoin qui les écarte." },
        { texte: "Ils coûtent toujours plus cher que la banque, quel que soit le montant", juste: false, retour: "Pas forcément : une grande entreprise emprunte parfois moins cher sur le marché qu'à sa banque. Ici, c'est la taille du besoin qui compte." },
      ],
    },
    {
      id: "le-laboratoire-du-montage",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du montage",
      notions: ["loan_schedule", "dilution_issuance"],
      question: () =>
        `Composez les ${eur(BESOIN_EXTERNE)} : avec ou sans la business angel, un compte courant des fondateurs, un prêt de Bpifrance ; la banque prend le reste. Le tableau suit les engagements, la part des fondateurs et ce que la banque lira ; le graphique, la première année et les intérêts selon le compte courant. Relevez le défi.`,
      leviers: () => [
        { code: "capital", libelle: "La business angel", unite: "€", min: 0, max: APPORT_DE_LA_BUSINESS_ANGEL.montant, pas: APPORT_DE_LA_BUSINESS_ANGEL.montant, depart: 0, choix: [{ valeur: 0, libelle: "Sans" }, { valeur: APPORT_DE_LA_BUSINESS_ANGEL.montant, libelle: `Avec, ${eur(APPORT_DE_LA_BUSINESS_ANGEL.montant)}` }] },
        { code: "compteCourant", libelle: "Compte courant des fondateurs", unite: "€", ...LEVIERS_DU_MONTAGE.compteCourant, depart: 0 },
        { code: "bpifrance", libelle: "Prêt de Bpifrance", unite: "€", ...LEVIERS_DU_MONTAGE.bpifrance, depart: 0 },
      ],
      lecture: (_c, p) => {
        const m = montageDuLaboratoire(p);
        const d = montage();
        return [
          { libelle: "Prêt de la banque", montant: m.banque, reference: d.banque },
          { libelle: "Sorties de la première année", montant: m.premiereAnnee, reference: d.premiereAnnee, fort: true },
          { libelle: "Intérêts de toute la durée", montant: m.interets, reference: d.interets },
          { libelle: "Capital et intérêts à rendre", montant: m.aRendre, reference: d.aRendre },
          { libelle: "Part du capital des fondateurs", montant: Math.round(m.partDesFondateurs * 1000) / 10, unite: "%", reference: 100 },
          { libelle: "Endettement (dettes financières ÷ capitaux propres)", montant: Math.round(m.endettement * 1000) / 10, unite: "%", reference: Math.round(d.endettement * 1000) / 10 },
        ];
      },
      graphique: () => ({
        levier: "compteCourant",
        courbes: [
          { libelle: "Sorties de la première année", valeur: (p) => montageDuLaboratoire(p).premiereAnnee },
          { libelle: "Intérêts de toute la durée", valeur: (p) => montageDuLaboratoire(p).interets },
        ],
      }),
      defi: () => ({
        consigne: `Trouvez un montage possible (Bpifrance au plus autant que la banque) qui ne prend pas plus de ${eur(PREMIERE_ANNEE_PLAFOND)} la première année, n'engage pas plus de ${eur(INTERETS_PLAFOND)} d'intérêts, et laisse aux fondateurs au moins ${pct(PART_MINIMALE_DES_FONDATEURS, 0)} du capital.`,
        atteint: (p) => montageTenable(montageDuLaboratoire(p)),
        indice: (p) => {
          const m = montageDuLaboratoire(p);
          if (!m.possible) return "Bpifrance ne prête pas plus que la banque : baissez son prêt ou laissez plus à la banque.";
          if (m.premiereAnnee > PREMIERE_ANNEE_PLAFOND) return `La première année prend ${eur(m.premiereAnnee)} : une source qui ne rembourse rien la première année soulagerait le lancement.`;
          if (m.interets > INTERETS_PLAFOND) return `${eur(m.interets)} d'intérêts : le différé de Bpifrance soulage la première année, mais il coûte des intérêts.`;
          return "Cherchez encore.";
        },
        solution: SOLUTION_DU_MONTAGE,
      }),
      explication: (c) => {
        const k = acteursDuChapitre(c);
        const s = k.solution;
        return [
          `Avec ${eur(s.compteCourant)} en compte courant et ${eur(s.banque)} à la banque, la première année prend ${eur(s.premiereAnnee)} et les intérêts font ${eur(s.interets)} : les fondateurs gardent tout le capital. Avec la business angel, la première année tomberait à ${eur(k.avecLAngel.premiereAnnee)} et les intérêts à ${eur(k.avecLAngel.interets)}, mais NOVA céderait ${pct(1 - k.avecLAngel.partDesFondateurs, 0)} de son capital.`,
          `Toutes les solutions tiennent les règles des banques : l'endettement reste sous ${pct(ENDETTEMENT_MAXIMAL, 0)} des capitaux propres et les dettes sous ${CAPACITE_DE_REMBOURSEMENT_MAXIMALE} années de CAF. Le choix n'est donc pas une affaire de règle, mais de priorité : la trésorerie de la première année, les intérêts, ou le contrôle du capital.`,
        ];
      },
    },
    {
      id: "la-solution",
      objectifs: [3],
      type: "choix",
      titre: "La solution à proposer",
      notions: ["loan_schedule", "dilution_issuance", "csr_index"],
      question: () => "Le dirigeant veut une proposition à présenter aux associés. Laquelle lui rendez-vous ?",
      options: (c) => {
        const k = acteursDuChapitre(c);
        return [
          {
            texte: `${eur(k.solution.compteCourant)} en compte courant, ${eur(k.solution.banque)} à la banque`,
            juste: true,
            retour: `Oui : le montage tient la première année (${eur(k.solution.premiereAnnee)}) et les intérêts, et les fondateurs gardent tout le capital. Le prêt vert ne paierait pas sa certification sur ${eur(k.solution.banque)} (il en faut ${qte(k.seuilVert)} milliers) : à garder pour un emprunt plus gros. La business angel reste une solution de rechange, si les associés ne peuvent pas bloquer leur épargne.`,
          },
          {
            texte: `Tout à la banque : ${eur(k.toutALaBanque.interets)} d'intérêts, le moins de démarches`,
            juste: false,
            retour: `Simple, mais la première année prendrait ${eur(k.toutALaBanque.premiereAnnee)}, l'année même du lancement de la gamme.`,
          },
          {
            texte: "Tout au prêt participatif : rien à rembourser avant la quatrième année",
            juste: false,
            retour: `La trésorerie respire, mais NOVA s'engagerait à ${eur(k.participatif.interets)} d'intérêts et à ${eur(BESOIN_EXTERNE)} d'un coup la quatrième année.`,
          },
          {
            texte: "La business angel et la région : le capital et la subvention ne se remboursent pas",
            juste: false,
            retour: `Ils ne se remboursent pas, mais ne sont pas gratuits : ${pct(1 - k.avecLAngel.partDesFondateurs, 0)} du capital cédés, et une subvention qui oblige à garder la ligne et à créer l'emploi. Une bonne solution de complément, pas la seule.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["loan_schedule", "dilution_issuance"],
      texte: (c) => {
        const k = acteursDuChapitre(c);
        return [
          `Vous avez passé en revue les acteurs du financement de NOVA : les intermédiaires financiers qui prêtent, les apporteurs de capitaux qui deviennent associés, les associés qui prêtent en compte courant, les acteurs publics et du financement vert. Vous avez valorisé ce que chacun engage : ${eur(k.banque.total)} à rendre pour ${eur(BESOIN_EXTERNE)} empruntés à la banque, ${eur(k.enCours.total)} d'engagements déjà pris, bail compris, et une part de capital cédée qui vaut plus que l'apport.`,
          "Deux pièges. Un financement sans remboursement n'est pas gratuit : le capital se paie en part de la valeur et du pouvoir, la subvention en engagements. Et le bilan ne montre pas tous les engagements : les intérêts à venir et les loyers en sont.",
          "Au niveau de l'examen, vous savez identifier les acteurs du financement, distinguer les modes selon leur origine et le risque porté, valoriser les engagements de l'entreprise, et proposer un ou plusieurs montages qui tiennent ses contraintes.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même. Reste à comparer ce que chaque mode coûte vraiment, actualisé : c'est le chapitre sur le coût des financements.",
        ];
      },
      repere: () => "Engagement = capital + intérêts à venir, et quand. Prêteur : payé d'abord, peu de risque. Associé : payé en dernier, le risque et une part de la valeur.",
    },
  ],
};
