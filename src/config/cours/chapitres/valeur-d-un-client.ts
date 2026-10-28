import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CABINETS_DU_COURS, type FicheDuCabinet } from "../monde/atlas-conseil";
import {
  anneeDuCabinet,
  capaciteDuTrimestre,
  compteMoyen,
  coutDAcquisition,
  coutJournalierDUnConsultant,
  coutVariableDUneJournee,
  margesAnneeParAnnee,
  portefeuilleDeLAnnee,
  valeurVieClient,
} from "../monde/relation-client";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA VALEUR D'UN CLIENT : ATTRITION, VALEUR VIE ET PORTEFEUILLE D'ÉQUILIBRE (BTS NDRC,
 * palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet
 * ATLAS CONSEIL a une fiche figée (monde/atlas-conseil.ts) et la valeur d'un client se calcule par le
 * modèle du cours (monde/relation-client.ts, partie 3). Une évolution du moteur ne change rien ici.
 *
 * L'objet : les comptes d'entreprise d'un cabinet qui vend des journées de conseil. Ce qui sort du
 * portefeuille chaque année (l'attrition, qui monte de N − 2 à N), ce qu'un compte laisse par an (la
 * marge sur coûts directs, le temps des consultants compris), ce qu'il vaut sur toute sa vie de client
 * (la valeur vie, simple puis actualisée au taux du cabinet), face à ce qu'il a coûté à gagner (le coût
 * d'acquisition de N, 15 000 €) ; puis le portefeuille vers lequel le cabinet tend quand départs et
 * recrues s'équilibrent, face à la capacité de ses consultants, et le choix entre recruter et
 * fidéliser.
 *
 * Le piège central : la valeur vie simple compte un euro lointain comme un euro d'aujourd'hui. Elle
 * double quand l'attrition est divisée par deux ; actualisée, elle monte bien moins. Un rapport valeur
 * vie ÷ coût d'acquisition de 5,6 n'est plus que de 4 une fois actualisé, et un portefeuille qui
 * remplit les consultants avec des comptes qui partent vite ne vaut pas ce qu'il paraît.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, l-attrition, la-marge-d-un-compte, la-valeur-vie, quelle-marge,
 *     le-cout-d-acquisition (la formule est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-l-equilibre puis le-portefeuille-au-curseur (le portefeuille au rythme de N − 2, la marge
 *     des recrues face à celle des départs) avant l-equilibre ; predire-recruter-ou-fideliser puis
 *     l-attrition-au-curseur (l'attrition qui remplit les consultants) avant recruter-ou-fideliser ;
 *     predire-l-actualisation puis le-laboratoire-de-la-valeur (recrues, attrition, et la méthode à
 *     choisir : valeur vie simple ou actualisée, avec le graphique des deux valeurs selon l'attrition)
 *     avant la-valeur-actualisee ;
 *   · autonome : l-equilibre (ni formule ni chiffres donnés ; le calcul de la correction montre le
 *     chemin) ;
 *   · expert : recruter-ou-fideliser (une variante chiffrée, face à la capacité), la-capacite (le
 *     jugement), la-valeur-actualisee (année par année, puis la somme), a-rebours (l'attrition la plus
 *     haute qui tient l'objectif de la direction, actualisée et simple) ; puis la synthèse.
 */

/**
 * L'EFFORT DE RECRUTER OU FIDÉLISER, hypothèse du cours : à effort égal, 25 % de recrues en plus
 * chaque année, ou une attrition plus faible de 25 % de son taux. Le cours ne chiffre pas ce que coûte
 * chacun des deux efforts : il compare ce qu'ils font au portefeuille.
 */
export const EFFORT_DE_FIDELISATION = 0.25;

/**
 * L'OBJECTIF DE LA DIRECTION, hypothèse du cours : qu'un compte vaille, sur sa vie, au moins 5 fois ce
 * qu'il a coûté à gagner. Les commerciaux retiennent souvent 3 comme plancher ; le cabinet, qui
 * actualise et veut une marge de sécurité, vise plus haut.
 */
export const RAPPORT_VISE = 5;

/** Les bornes du curseur du portefeuille, en comptes au 1er janvier. */
export const PORTEFEUILLE_DU_CURSEUR = { min: 20, max: 60 } as const;

/** Les bornes du curseur de l'attrition, en pourcentage du portefeuille. */
export const ATTRITION_DU_CURSEUR = { min: 10, max: 30 } as const;

/** Les leviers du laboratoire : les recrues de l'année (comptes) et l'attrition (en %). */
export const LEVIERS_DE_LA_VALEUR = {
  recrues: { min: 4, max: 12, pas: 1 },
  attrition: { min: 10, max: 30, pas: 0.5 },
} as const;

/** Le levier à choix du laboratoire : la méthode de la valeur vie. */
export const METHODE = { simple: 0, actualisee: 1 } as const;

/**
 * Une solution du défi du laboratoire, hypothèse du cours : 7 recrues par an et 17,5 % d'attrition.
 * Le portefeuille tend vers 40 comptes, et un compte vaut 76 363,64 € actualisé.
 */
export const SOLUTION_DU_LABORATOIRE = { recrues: 7, attrition: 17.5, methode: METHODE.actualisee } as const;

/** La valeur d'un client se lit sur des comptes d'entreprise : le cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DE_LA_VALEUR: readonly string[] = ["conseil"];

export const POURQUOI_LE_CABINET =
  "ce chapitre suit les comptes d'un cabinet qui vend ses journées à des entreprises : il se joue chez ATLAS CONSEIL, dont la simulation du cours fige le portefeuille, les canaux de conquête et les consultants, les mêmes d'un chapitre à l'autre du parcours.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Une part (0,25) écrite en pourcentage (25 %), au dixième par défaut. */
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const ANNEES = ["N-2", "N-1", "N"] as const;
const anneeDite = (a: (typeof ANNEES)[number]) => a.replace("-", " − ");

/** La fiche du cabinet du cours. */
export function ficheDe(c: Pick<Cas, "code">): FicheDuCabinet {
  const f = CABINETS_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de cabinet du cours pour ${c.code}`);
  return f;
}

/** La valeur des comptes du cabinet : tout ce que le chapitre et son cas demandent. */
export function valeurDesComptes(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const annees = ANNEES.map((a) => portefeuilleDeLAnnee(f, a));
  const n = annees[2]!;
  const n2 = annees[0]!;
  const a = anneeDuCabinet(f);
  const m = compteMoyen(f);
  const acq = coutDAcquisition(f);
  const taux = f.tauxDActualisation;
  const v = valeurVieClient({ marge: m.marge, attrition: n.attrition, taux });
  const coutJournalier = coutJournalierDUnConsultant(f);
  const coutDesConsultants = auCentime(a.journees * coutJournalier);
  const journeesParCompte = a.journees / a.comptes;
  const capacite = capaciteDuTrimestre(f) * 4;
  const comptesALaCapacite = capacite / journeesParCompte;
  // Le portefeuille d'équilibre : recrues ÷ attrition, au rythme de N et de N − 2.
  const equilibre = n.nouveaux / n.attrition;
  const equilibreN2 = auCentime((n.nouveaux * n2.auPremierJanvier) / n2.perdus);
  // Ce que les départs emportent par compte présent, au rythme de N − 2 : la marge × l'attrition.
  const departsParCompteN2 = (n2.perdus * m.marge) / n2.auPremierJanvier;
  const margeDesRecrues = n.nouveaux * m.marge;
  // L'attrition la plus haute qui garde un portefeuille de la capacité avec les recrues de N.
  const attritionALaCapacite = Math.floor((n.nouveaux / comptesALaCapacite) * 100 + 1e-9);
  // Recruter ou fidéliser, à effort égal.
  const recruesEnPlus = n.nouveaux * (1 + EFFORT_DE_FIDELISATION);
  const attritionReduite = n.attrition * (1 - EFFORT_DE_FIDELISATION);
  const equilibreEnRecrutant = recruesEnPlus / n.attrition;
  const equilibreEnFidelisant = n.nouveaux / attritionReduite;
  // La valeur actualisée, année par année.
  const annee = margesAnneeParAnnee({ marge: m.marge, attrition: n.attrition, taux }, 3);
  // À rebours : l'attrition la plus haute qui tient l'objectif de la direction.
  const valeurVisee = RAPPORT_VISE * acq.cac;
  const attritionMaxActualisee = auCentime((m.marge / valeurVisee - taux) * 100);
  const attritionMaxSimple = auCentime((m.marge / valeurVisee) * 100);
  return {
    f,
    annees,
    n,
    n2,
    a,
    m,
    acq,
    taux,
    coutVariable: coutVariableDUneJournee(f),
    coutJournalier,
    coutDesConsultants,
    margeSurCoutVariableParCompte: auCentime(a.margeSurCoutVariable / a.comptes),
    dureeDeVie: v.dureeDeVie,
    simple: v.simple,
    actualisee: v.actualisee,
    rapportSimple: auCentime(v.simple / acq.cac),
    rapportActualise: auCentime(v.actualisee / acq.cac),
    journeesParCompte,
    capacite,
    comptesALaCapacite,
    equilibre,
    equilibreN2,
    comptesPerdusALEquilibre: auCentime(equilibreN2 - equilibre),
    departsParCompteN2,
    margeDesRecrues,
    portefeuilleQuiTientN2: Math.floor((n.nouveaux * n2.auPremierJanvier) / n2.perdus + 1e-9),
    attritionALaCapacite,
    recruesEnPlus,
    attritionReduite,
    equilibreEnRecrutant: auCentime(equilibreEnRecrutant),
    equilibreEnFidelisant: auCentime(equilibreEnFidelisant),
    journeesEnFidelisant: auCentime(equilibreEnFidelisant * journeesParCompte),
    journeesEnRecrutant: auCentime(equilibreEnRecrutant * journeesParCompte),
    annee,
    valeurVisee,
    attritionMaxActualisee,
    attritionMaxSimple,
    /** Le plafond de la valeur vie actualisée, quand l'attrition tend vers zéro : marge ÷ taux. */
    plafondActualise: auCentime(m.marge / taux),
  };
}

export type ValeurDesComptes = ReturnType<typeof valeurDesComptes>;

/** Le portefeuille d'équilibre et la valeur d'un compte pour des recrues, une attrition (en %) et une méthode quelconques. */
export function laboratoireDeLaValeur(x: ValeurDesComptes, recrues: number, attritionEnPct: number, methode: number) {
  const equilibre = (recrues * 100) / attritionEnPct;
  const simple = auCentime((x.m.marge * 100) / attritionEnPct);
  const actualisee = auCentime((x.m.marge * 100) / (attritionEnPct + x.taux * 100));
  const valeur = methode === METHODE.actualisee ? actualisee : simple;
  return {
    equilibre: auCentime(equilibre),
    journees: auCentime(equilibre * x.journeesParCompte),
    simple,
    actualisee,
    valeur,
    rapport: auCentime(valeur / x.acq.cac),
    rapportActualise: actualisee / x.acq.cac,
    rapportSimple: simple / x.acq.cac,
    margeDuPortefeuille: auCentime(equilibre * x.m.marge),
  };
}

/** Le portefeuille du cabinet, année par année : le document de l'attrition. */
function tableauDesAnnees(x: ValeurDesComptes): TableauDeDonnees {
  return {
    titre: `Le portefeuille ${dE(x.f.entreprise)}, année par année`,
    colonnes: ANNEES.map(anneeDite),
    lignes: [
      { libelle: "Comptes au 1er janvier", valeurs: x.annees.map((p) => qte(p.auPremierJanvier)) },
      { libelle: "Comptes perdus dans l'année", valeurs: x.annees.map((p) => qte(p.perdus)) },
      { libelle: "Comptes gardés", valeurs: x.annees.map((p) => qte(p.gardes)) },
      { libelle: "Comptes gagnés dans l'année", valeurs: x.annees.map((p) => qte(p.nouveaux)) },
      { libelle: "Comptes en fin d'année", valeurs: x.annees.map((p) => qte(p.actifs)) },
    ],
  };
}

export const VALEUR_D_UN_CLIENT: Chapitre = {
  code: "valeur-d-un-client",
  parcours: "ndrc",
  palier: 3,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
    "Bac pro MCV Bloc 3 · Fidéliser la clientèle et développer la relation client",
    "2de pro RC · Assurer le suivi de la relation client",
    "BUT TC · Manager la relation client",
    "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
  ],
  titre: "La valeur d'un client : attrition et valeur vie",
  accroche:
    "Un compte d'entreprise ne s'achète pas une fois : il se garde ou il part. Ce qu'il laisse chaque année, ce qu'il vaut sur sa vie, simple puis actualisée, face à ce qu'il a coûté à gagner, et vers quel portefeuille le cabinet tend quand recrues et départs s'équilibrent.",
  objectifs: [
    "Calculer le taux d'attrition et le taux de fidélisation, et lire leur évolution",
    "Calculer la marge annuelle d'un compte, temps des consultants compris",
    "Calculer la durée de vie moyenne et la valeur vie client, simple puis actualisée",
    "Comparer la valeur vie client au coût d'acquisition, et retrouver à rebours l'attrition qui tient un objectif",
    "Calculer le portefeuille d'équilibre face à la capacité, et comparer recruter et fidéliser",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_VALEUR, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des comptes qui reviennent chaque année",
      notions: ["churn_rate", "customer_lifetime_value", "customer_portfolio"],
      tableau: (c) => {
        const x = valeurDesComptes(c);
        return {
          titre: `L'année N ${dE(x.f.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Comptes servis dans l'année", valeurs: [qte(x.a.comptes)] },
            { libelle: "Journées vendues", valeurs: [qte(x.a.journees)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(x.a.chiffreDAffaires)] },
            { libelle: "Frais de mission et supports", valeurs: [eur(x.a.frais)] },
            { libelle: "Coût journalier d'un consultant", valeurs: [eur(x.coutJournalier)] },
            { libelle: "Taux d'actualisation du cabinet", valeurs: [pct(x.taux)] },
          ],
        };
      },
      texte: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, un cabinet de conseil et de formation qui vend des journées d'intervention à des entreprises et à des collectivités. Un client n'y achète pas une fois : c'est un compte, qui revient d'année en année, ou qui part. Le commercial qui le perd ne perd pas une mission : il perd toutes celles qui auraient suivi.`,
          `La simulation suppose quatre choses, dites une fois pour tout le chapitre. Un compte est perdu quand il n'achète plus rien de l'année. Ce qu'il laisse chaque année est sa marge sur coûts directs : son chiffre d'affaires, moins ses frais de mission et ses supports, moins ses journées au coût journalier d'un consultant (${eur(x.coutJournalier)}, leur coût de l'année divisé par les jours qu'ils peuvent facturer). L'attrition de N vaut pour toute la vie du compte. Et un euro qui viendra dans un an vaut 1 ÷ 1,1 euro aujourd'hui : le cabinet actualise à ${pct(x.taux)}.`,
          `En N, ${x.f.entreprise} a servi ${qte(x.a.comptes)} comptes, pour ${qte(x.a.journees)} journées vendues et ${eur(x.a.chiffreDAffaires)} de chiffre d'affaires hors taxes.`,
        ];
      },
      repere: () => "Taux d'attrition = comptes perdus dans l'année ÷ comptes au 1er janvier. Taux de fidélisation = 100 % − taux d'attrition.",
    },
    {
      id: "l-attrition",
      type: "montants",
      titre: "Le taux d'attrition, année par année",
      notions: ["churn_rate"],
      tableau: (c) => tableauDesAnnees(valeurDesComptes(c)),
      question: (c) => {
        const x = valeurDesComptes(c);
        const [a2, a1, an] = x.annees;
        return `Calculez le taux d'attrition de chaque année, au dixième : ${qte(a2!.perdus)} comptes perdus sur ${qte(a2!.auPremierJanvier)} en N − 2, ${qte(a1!.perdus)} sur ${qte(a1!.auPremierJanvier)} en N − 1, ${qte(an!.perdus)} sur ${qte(an!.auPremierJanvier)} en N. Puis le taux de fidélisation de N.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          ...x.annees.map((p) => ({
            libelle: `Taux d'attrition de ${anneeDite(p.annee)} (%)`,
            attendu: Math.round(p.attrition * 1_000) / 10,
            calcul: `${qte(p.perdus)} ÷ ${qte(p.auPremierJanvier)} × 100 = ${pct(p.attrition)}`,
            tolerance: 0.1,
          })),
          { libelle: "Taux de fidélisation de N (%)", attendu: auCentime(x.n.fidelisation * 100), calcul: `100 % − ${pct(x.n.attrition)} = ${pct(x.n.fidelisation)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Le cabinet gagne ${qte(x.n.nouveaux)} comptes par an, mais il en perd de plus en plus : ${pct(x.n2.attrition)}, puis ${pct(x.annees[1]!.attrition)}, puis ${pct(x.n.attrition)}. En N, il en perd autant qu'il en gagne : le portefeuille ne grossit plus. Cette année-là, le départ du commercial de la conquête, en décembre N − 1, a laissé ses comptes moins suivis.`,
          "Le taux se calcule sur les comptes du 1er janvier : les comptes gagnés dans l'année n'ont pas encore eu l'occasion de partir.",
        ];
      },
    },
    {
      id: "la-marge-d-un-compte",
      type: "montants",
      titre: "Ce que laisse un compte chaque année",
      notions: ["contribution_margin", "customer_lifetime_value"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Calculez la marge sur coûts directs des ${qte(x.a.comptes)} comptes de N : ${eur(x.a.chiffreDAffaires)} de chiffre d'affaires, moins ${eur(x.a.frais)} de frais, moins ${qte(x.a.journees)} journées à ${eur(x.coutJournalier)}. Puis le chiffre d'affaires et la marge d'un compte moyen.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          {
            libelle: "Marge sur coûts directs des comptes",
            attendu: x.a.marge,
            calcul: `${eur(x.a.chiffreDAffaires)} − ${eur(x.a.frais)} − ${qte(x.a.journees)} × ${eur(x.coutJournalier)} = ${eur(x.a.chiffreDAffaires)} − ${eur(x.a.frais)} − ${eur(x.coutDesConsultants)} = ${eur(x.a.marge)}`,
          },
          { libelle: "Chiffre d'affaires d'un compte moyen", attendu: x.m.chiffreDAffaires, calcul: `${eur(x.a.chiffreDAffaires)} ÷ ${qte(x.a.comptes)} = ${eur(x.m.chiffreDAffaires)}` },
          { libelle: "Marge d'un compte moyen", attendu: x.m.marge, calcul: `${eur(x.a.marge)} ÷ ${qte(x.a.comptes)} = ${eur(x.m.marge)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Chaque année où il reste, un compte moyen laisse ${eur(x.m.marge)}, une fois payés ses frais et le temps des consultants qui le servent. C'est elle qui paie les commerciaux, les bureaux et la direction. Tout l'enjeu est le nombre d'années où il reste.`,
        ];
      },
    },
    {
      id: "la-valeur-vie",
      type: "montants",
      titre: "La valeur vie client",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Avec ${pct(x.n.attrition)} d'attrition par an, combien d'années un compte reste-t-il en moyenne (1 ÷ taux d'attrition) ? Avec ${eur(x.m.marge)} de marge par an, que vaut-il sur toute sa vie de client (marge ÷ taux d'attrition) ?`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          { libelle: "Durée de vie moyenne (années)", attendu: x.dureeDeVie, calcul: `1 ÷ ${pct(x.n.attrition)} = ${qte(x.dureeDeVie)} ans`, tolerance: 0.1 },
          { libelle: "Valeur vie client", attendu: x.simple, calcul: `${eur(x.m.marge)} ÷ ${pct(x.n.attrition)} = ${eur(x.m.marge)} × ${qte(x.dureeDeVie)} = ${eur(x.simple)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Un compte reste en moyenne ${qte(x.dureeDeVie)} ans, et laisse ${eur(x.m.marge)} chaque année : il vaut ${eur(x.simple)} sur toute sa vie de client. C'est ce que le cabinet perd, en réalité, quand un compte part au bout d'un an.`,
          `Cette valeur vie est dite simple : elle additionne les marges des années à venir comme si un euro dans ${qte(x.dureeDeVie)} ans valait un euro aujourd'hui. Le chapitre la corrige plus loin.`,
        ];
      },
    },
    {
      id: "quelle-marge",
      type: "choix",
      titre: "Quelle marge diviser par l'attrition",
      notions: ["customer_lifetime_value", "contribution_margin"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Un stagiaire calcule la valeur vie d'un compte sur sa marge sur coût variable, ${eur(x.margeSurCoutVariableParCompte)} par an (son chiffre d'affaires moins ses frais) : « les consultants sont payés de toute façon ». Quelle marge faut-il diviser par l'attrition ?`;
      },
      options: (c) => {
        const x = valeurDesComptes(c);
        const avecLaMcv = auCentime(x.margeSurCoutVariableParCompte / x.n.attrition);
        const avecLeCa = auCentime(x.m.chiffreDAffaires / x.n.attrition);
        return [
          {
            texte: `La marge sur coûts directs, ${eur(x.m.marge)} : le temps des consultants compris`,
            juste: true,
            retour: `Oui. Sur une affaire en plus placée sur des jours libres, seule la marge sur coût variable compte : les consultants sont payés de toute façon. Mais un compte gardé des années occupe des consultants des années durant, qu'il faut payer et qu'il faudrait embaucher pour servir d'autres comptes : sa valeur vie se lit sur ce qu'il laisse une fois leur temps payé, ${eur(x.simple)}.`,
          },
          {
            texte: `La marge sur coût variable, ${eur(x.margeSurCoutVariableParCompte)} : les consultants sont déjà payés`,
            juste: false,
            retour: `Non : c'est vrai d'une affaire en plus sur des jours libres, pas d'un compte qui revient chaque année. À ce compte, la valeur vie vaudrait ${eur(avecLaMcv)} : elle oublierait les ${qte(x.journeesParCompte)} journées de consultant que le compte prend chaque année.`,
          },
          {
            texte: `Le chiffre d'affaires, ${eur(x.m.chiffreDAffaires)} : c'est ce que le compte paie chaque année`,
            juste: false,
            retour: `Non : un compte qui paie ${eur(x.m.chiffreDAffaires)} coûte aussi ses frais et le temps de ceux qui le servent. Diviser le chiffre d'affaires par l'attrition donnerait ${eur(avecLeCa)}, une valeur que le cabinet ne gagnera jamais.`,
          },
        ];
      },
    },
    {
      id: "le-cout-d-acquisition",
      type: "montants",
      titre: "Ce qu'a coûté un compte gagné",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      tableau: (c) => {
        const x = valeurDesComptes(c);
        return {
          titre: `Les canaux de conquête ${dE(x.f.entreprise)}, année N`,
          colonnes: ["Coût de l'année", "Comptes gagnés"],
          lignes: x.f.canaux.map((k) => ({ libelle: k.nom, valeurs: [eur(k.cout), qte(k.contrats)] })),
        };
      },
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Pour gagner ses ${qte(x.n.nouveaux)} comptes neufs, le cabinet a payé ${qte(x.f.canaux.length)} canaux de conquête, temps des commerciaux compris. Calculez ce qu'ils ont coûté ensemble, le coût d'acquisition d'un compte (coût des canaux ÷ comptes gagnés), puis le rapport valeur vie client ÷ coût d'acquisition, au dixième.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          { libelle: "Coût des canaux de conquête", attendu: x.acq.cout, calcul: `${x.f.canaux.map((k) => eur(k.cout)).join(" + ")} = ${eur(x.acq.cout)}` },
          { libelle: "Coût d'acquisition d'un compte", attendu: x.acq.cac, calcul: `${eur(x.acq.cout)} ÷ ${qte(x.acq.comptes)} = ${eur(x.acq.cac)}` },
          { libelle: "Valeur vie ÷ coût d'acquisition", attendu: x.rapportSimple, calcul: `${eur(x.simple)} ÷ ${eur(x.acq.cac)} = ${qte(x.rapportSimple)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Un compte rapporte, sur sa vie de client, ${qte(x.rapportSimple)} fois ce qu'il a coûté à gagner. Les commerciaux retiennent souvent qu'en dessous de 3, la conquête coûte presque ce qu'elle rapporte ; la direction ${dE(x.f.entreprise)} vise ${qte(RAPPORT_VISE)}.`,
          `Ce rapport est bon, mais il repose sur la valeur vie simple. Il faudra le refaire une fois les marges à venir ramenées à aujourd'hui.`,
        ];
      },
    },
    {
      id: "predire-l-equilibre",
      type: "choix",
      titre: "Pariez sur le portefeuille",
      notions: ["churn_rate", "customer_portfolio"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Avant de calculer, pariez. En N − 2, le cabinet ne perdait que ${pct(x.n2.attrition)} de ses comptes, et en gagnait déjà ${qte(x.n.nouveaux)} par an. S'il avait gardé ce rythme, son portefeuille aurait…`;
      },
      options: (c) => {
        const x = valeurDesComptes(c);
        const voir = "Faites vivre le portefeuille à l'étape suivante : le curseur montre jusqu'où il grossit, et pourquoi.";
        return [
          { texte: "Grossi de moins en moins vite, jusqu'à un plafond", juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Grossi de ${qte(x.n.nouveaux - x.n2.perdus)} comptes par an, sans fin`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Cessé de grossir tout de suite", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-portefeuille-au-curseur",
      type: "curseur",
      titre: "Faites vivre le portefeuille",
      notions: ["churn_rate", "customer_portfolio"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Au rythme de N − 2 (${pct(x.n2.attrition)} d'attrition) et avec ${qte(x.n.nouveaux)} recrues par an, faites varier le portefeuille du 1er janvier, de ${qte(PORTEFEUILLE_DU_CURSEUR.min)} à ${qte(PORTEFEUILLE_DU_CURSEUR.max)} comptes. Une droite donne la marge que les recrues apportent dans l'année, l'autre celle que les départs emportent. Placez le curseur sur le plus grand portefeuille qui grossit encore, ou qui tient, puis validez.`;
      },
      grandeur: () => ({ libelle: "Comptes au 1er janvier", unite: "comptes" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: valeurDesComptes(c).portefeuilleQuiTientN2, min: PORTEFEUILLE_DU_CURSEUR.min, max: PORTEFEUILLE_DU_CURSEUR.max }),
      zones: ["Le portefeuille grossit", "Le portefeuille fond"],
      rates: () => ({
        dessous: "Le portefeuille grossit encore à cette position : cherchez le plus grand qui tient.",
        dessus: "À cette position, les départs emportent plus de marge que les recrues n'en apportent : le portefeuille fond.",
      }),
      montrer: "Montrer l'équilibre",
      lecture: (c, p) => {
        const x = valeurDesComptes(c);
        const departs = auCentime(x.departsParCompteN2 * p);
        return [
          { libelle: "Marge apportée par les recrues", montant: x.margeDesRecrues },
          { libelle: "Marge emportée par les départs", montant: departs },
          { libelle: "Marge gagnée ou perdue par le portefeuille", montant: auCentime(x.margeDesRecrues - departs), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDesComptes(c);
        return {
          produit: () => x.margeDesRecrues,
          cout: (p) => x.departsParCompteN2 * p,
          libelles: ["Marge apportée par les recrues", "Marge emportée par les départs"],
        };
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Les recrues apportent toujours ${eur(x.margeDesRecrues)} par an ; les départs emportent ${eur(x.departsParCompteN2)} par compte présent, et donc d'autant plus que le portefeuille est grand. À ${qte(x.portefeuilleQuiTientN2)} comptes, il grossit encore ; à ${qte(x.portefeuilleQuiTientN2 + 1)}, il fond. Il tend vers ${qte(x.equilibreN2)} comptes, un nombre attendu, une moyenne : c'est son portefeuille d'équilibre, recrues ÷ attrition.`,
          `Le portefeuille ne grossit donc pas sans fin : plus il est grand, plus il perd de comptes chaque année, jusqu'à ce que les départs égalent les recrues. L'étape suivante le calcule au rythme de N.`,
        ];
      },
    },
    {
      id: "l-equilibre",
      type: "montants",
      titre: "Le portefeuille d'équilibre",
      notions: ["churn_rate", "customer_portfolio"],
      question: () =>
        "Sans formule cette fois. Calculez le portefeuille d'équilibre au rythme de N, celui au rythme de N − 2, puis les comptes d'équilibre que la hausse de l'attrition a fait perdre au cabinet. Au centième : ce sont des comptes attendus.",
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          { libelle: "Portefeuille d'équilibre au rythme de N", attendu: x.equilibre, calcul: `${qte(x.n.nouveaux)} ÷ ${pct(x.n.attrition)} = ${qte(x.equilibre)} comptes`, tolerance: 0.1 },
          { libelle: "Portefeuille d'équilibre au rythme de N − 2", attendu: x.equilibreN2, calcul: `${qte(x.n.nouveaux)} ÷ (${qte(x.n2.perdus)} ÷ ${qte(x.n2.auPremierJanvier)}) = ${qte(x.equilibreN2)} comptes`, tolerance: 0.1 },
          { libelle: "Comptes d'équilibre perdus", attendu: x.comptesPerdusALEquilibre, calcul: `${qte(x.equilibreN2)} − ${qte(x.equilibre)} = ${qte(x.comptesPerdusALEquilibre)} comptes`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Au rythme de N, l'équilibre tombe sur le portefeuille d'aujourd'hui, ${qte(x.equilibre)} comptes : ce n'est pas un hasard, le cabinet en a perdu autant qu'il en a gagné. Il ne grossira plus sans changer l'un des deux.`,
          `Au rythme de N − 2, il aurait tendu vers ${qte(x.equilibreN2)} comptes. La hausse de l'attrition lui coûte ${qte(x.comptesPerdusALEquilibre)} comptes d'équilibre, soit ${eur(auCentime(x.comptesPerdusALEquilibre * x.m.marge))} de marge par an. Le commercial d'un portefeuille suit son attrition avant ses signatures.`,
        ];
      },
    },
    {
      id: "predire-recruter-ou-fideliser",
      type: "choix",
      titre: "Pariez : recruter ou fidéliser",
      notions: ["churn_rate", "customer_portfolio"],
      question: () =>
        `Avant de calculer, pariez. À effort égal, le cabinet peut recruter ${pct(EFFORT_DE_FIDELISATION, 0)} de comptes de plus chaque année, ou perdre ${pct(EFFORT_DE_FIDELISATION, 0)} de comptes de moins. Lequel grossit le plus le portefeuille d'équilibre ?`,
      options: () => {
        const voir = "Cherchez au curseur suivant l'attrition qui remplit les consultants : elle départage les deux.";
        return [
          { texte: "Perdre moins de comptes", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Recruter plus de comptes", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Les deux autant : l'effort est le même", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-attrition-au-curseur",
      type: "curseur",
      titre: "L'attrition qui remplit les consultants",
      notions: ["churn_rate", "capacity", "customer_portfolio"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Les ${qte(x.f.consultants.nombre)} consultants peuvent faire ${qte(x.capacite)} journées par an ; un compte en prend ${qte(x.journeesParCompte)} : ils peuvent servir ${qte(x.comptesALaCapacite)} comptes. Avec ${qte(x.n.nouveaux)} recrues par an, faites varier l'attrition de ${qte(ATTRITION_DU_CURSEUR.min)} % à ${qte(ATTRITION_DU_CURSEUR.max)} %. Placez le curseur sur l'attrition la plus haute où un portefeuille de ${qte(x.comptesALaCapacite)} comptes tient, puis validez.`;
      },
      grandeur: () => ({ libelle: "Attrition de l'année", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: valeurDesComptes(c).attritionALaCapacite, min: ATTRITION_DU_CURSEUR.min, max: ATTRITION_DU_CURSEUR.max }),
      zones: ["Les consultants restent pleins", "Le portefeuille se vide"],
      rates: () => ({
        dessous: "À cette attrition, le portefeuille tient encore : cherchez la plus haute.",
        dessus: "À cette attrition, les départs emportent plus que les recrues n'apportent : le portefeuille descend sous la capacité.",
      }),
      montrer: "Montrer l'attrition",
      lecture: (c, a) => {
        const x = valeurDesComptes(c);
        const departs = auCentime((x.comptesALaCapacite * a * x.m.marge) / 100);
        return [
          { libelle: "Marge apportée par les recrues", montant: x.margeDesRecrues },
          { libelle: "Marge emportée par les départs", montant: departs },
          { libelle: "Valeur vie d'un compte à cette attrition", montant: auCentime((x.m.marge * 100) / a) },
          { libelle: "Marge gagnée ou perdue par le portefeuille", montant: auCentime(x.margeDesRecrues - departs), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDesComptes(c);
        return {
          produit: () => x.margeDesRecrues,
          cout: (a) => (x.comptesALaCapacite * a * x.m.marge) / 100,
          libelles: ["Marge apportée par les recrues", `Marge emportée par les départs, sur ${qte(x.comptesALaCapacite)} comptes`],
        };
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Avec ${qte(x.n.nouveaux)} recrues, un portefeuille de ${qte(x.comptesALaCapacite)} comptes ne tient que sous ${qte(x.attritionALaCapacite)} % d'attrition : ${qte(x.n.nouveaux)} ÷ ${qte(x.comptesALaCapacite)}. Le cabinet en est à ${pct(x.n.attrition)}.`,
          `Perdre ${pct(EFFORT_DE_FIDELISATION, 0)} de comptes de moins mène l'attrition à ${pct(x.attritionReduite, 2)}, sous ces ${qte(x.attritionALaCapacite)} % : le portefeuille irait au-delà de ce que les consultants peuvent servir. Recruter ${pct(EFFORT_DE_FIDELISATION, 0)} de plus mène à ${qte(x.recruesEnPlus)} recrues pour ${pct(x.n.attrition)} d'attrition, soit ${qte(x.equilibreEnRecrutant)} comptes, la capacité pile. L'étape suivante le chiffre.`,
        ];
      },
    },
    {
      id: "recruter-ou-fideliser",
      type: "montants",
      titre: "Recruter ou fidéliser, face à la capacité",
      notions: ["churn_rate", "customer_portfolio", "capacity"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Le cabinet hésite : ${qte(x.recruesEnPlus)} recrues par an à ${pct(x.n.attrition)} d'attrition, ou ${qte(x.n.nouveaux)} recrues à ${pct(x.attritionReduite, 2)}. Calculez le portefeuille d'équilibre de chacun, puis les journées que demanderait le plus grand des deux.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          { libelle: "Portefeuille d'équilibre en recrutant", attendu: x.equilibreEnRecrutant, calcul: `${qte(x.recruesEnPlus)} ÷ ${pct(x.n.attrition)} = ${qte(x.equilibreEnRecrutant)} comptes`, tolerance: 0.1 },
          { libelle: "Portefeuille d'équilibre en fidélisant", attendu: x.equilibreEnFidelisant, calcul: `${qte(x.n.nouveaux)} ÷ ${pct(x.attritionReduite, 2)} = ${qte(x.equilibreEnFidelisant)} comptes`, tolerance: 0.1 },
          {
            libelle: "Journées demandées par le plus grand portefeuille",
            attendu: x.journeesEnFidelisant,
            calcul: `${qte(x.equilibreEnFidelisant)} × ${qte(x.journeesParCompte)} = ${qte(x.journeesEnFidelisant)} journées, pour ${qte(x.capacite)} de capacité`,
            tolerance: 6,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Recruter ${pct(EFFORT_DE_FIDELISATION, 0)} de plus multiplie le portefeuille d'équilibre par ${qte(1 + EFFORT_DE_FIDELISATION)} ; perdre ${pct(EFFORT_DE_FIDELISATION, 0)} de moins le multiplie par 1 ÷ ${qte(1 - EFFORT_DE_FIDELISATION)}, soit ${pct(1 / (1 - EFFORT_DE_FIDELISATION) - 1)} de plus. Le portefeuille d'équilibre est un quotient : une baisse du dénominateur pèse plus qu'une hausse égale du numérateur.`,
          `Mais ${qte(x.equilibreEnFidelisant)} comptes demandent ${qte(x.journeesEnFidelisant)} journées, ${qte(auCentime(x.journeesEnFidelisant - x.capacite))} de plus que les ${qte(x.capacite)} que les consultants peuvent faire.`,
        ];
      },
    },
    {
      id: "la-capacite",
      type: "choix",
      titre: "Ce que vous dites au directeur",
      notions: ["customer_portfolio", "capacity", "churn_rate"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Le directeur ${dE(x.f.entreprise)} veut grossir le portefeuille, et demande lequel des deux efforts choisir. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = valeurDesComptes(c);
        return [
          {
            texte: "Fidéliser, en prévoyant un consultant de plus",
            juste: true,
            retour: `Oui : ${qte(x.equilibreEnFidelisant)} comptes au lieu de ${qte(x.equilibreEnRecrutant)}, mais ${qte(x.journeesEnFidelisant)} journées pour ${qte(x.capacite)}. Sans consultant de plus, le cabinet refuserait des journées, et des comptes mal servis partiraient : l'attrition remonterait.`,
          },
          {
            texte: "Fidéliser : les consultants actuels suffiront",
            juste: false,
            retour: `Non : ${qte(x.equilibreEnFidelisant)} comptes à ${qte(x.journeesParCompte)} journées en demandent ${qte(x.journeesEnFidelisant)}, plus que les ${qte(x.capacite)} des ${qte(x.f.consultants.nombre)} consultants.`,
          },
          {
            texte: `Recruter : il grossit le portefeuille de ${pct(EFFORT_DE_FIDELISATION, 0)}, l'autre moins`,
            juste: false,
            retour: `Non : recruter mène à ${qte(x.equilibreEnRecrutant)} comptes, fidéliser à ${qte(x.equilibreEnFidelisant)}. Le portefeuille d'équilibre divise les recrues par l'attrition : la baisser pèse plus.`,
          },
          {
            texte: "Les deux se valent : l'effort est le même de chaque côté",
            juste: false,
            retour: `Non : à effort égal, ils ne donnent pas le même portefeuille, ${qte(x.equilibreEnRecrutant)} comptes contre ${qte(x.equilibreEnFidelisant)}.`,
          },
        ];
      },
    },
    {
      id: "predire-l-actualisation",
      type: "choix",
      titre: "Pariez sur la valeur actualisée",
      notions: ["customer_lifetime_value", "discounting"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Avant de calculer, pariez. Si le cabinet divisait son attrition par deux, la valeur vie simple d'un compte doublerait, comme sa durée de vie. Et sa valeur vie actualisée à ${pct(x.taux)} ?`;
      },
      options: () => {
        const voir = "Le laboratoire suivant trace les deux valeurs selon l'attrition : regardez-les s'écarter.";
        return [
          { texte: "Elle monterait, mais bien moins que du double", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Elle doublerait aussi, comme la durée de vie", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Elle ne bougerait presque pas", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-valeur",
      type: "simulation",
      titre: "Le laboratoire de la valeur",
      notions: ["customer_lifetime_value", "discounting", "customer_portfolio", "customer_acquisition_cost"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `Faites varier les recrues de l'année et l'attrition, et choisissez la méthode : la valeur vie simple, ou actualisée à ${pct(x.taux)}. Le tableau suit le portefeuille d'équilibre, les journées qu'il demande et ce que vaut un compte face à son coût d'acquisition, ${eur(x.acq.cac)}. Relevez le défi, puis regardez ce que la méthode change.`;
      },
      leviers: (c) => {
        const x = valeurDesComptes(c);
        const l = LEVIERS_DE_LA_VALEUR;
        return [
          { code: "recrues", libelle: "Comptes gagnés par an", unite: "comptes", min: l.recrues.min, max: l.recrues.max, pas: l.recrues.pas, depart: x.n.nouveaux },
          { code: "attrition", libelle: "Attrition de l'année", unite: "%", min: l.attrition.min, max: l.attrition.max, pas: l.attrition.pas, depart: auCentime(x.n.attrition * 100) },
          {
            code: "methode",
            libelle: "Méthode",
            unite: "",
            min: METHODE.simple,
            max: METHODE.actualisee,
            pas: 1,
            depart: METHODE.simple,
            choix: [
              { valeur: METHODE.simple, libelle: "Valeur vie simple" },
              { valeur: METHODE.actualisee, libelle: `Valeur vie actualisée à ${pct(x.taux)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = valeurDesComptes(c);
        const l = laboratoireDeLaValeur(x, p.recrues!, p.attrition!, p.methode!);
        const d = laboratoireDeLaValeur(x, x.n.nouveaux, x.n.attrition * 100, METHODE.simple);
        return [
          { libelle: "Portefeuille d'équilibre", montant: l.equilibre, reference: d.equilibre, unite: "comptes" },
          { libelle: "Journées demandées à l'équilibre", montant: l.journees, reference: d.journees, unite: "journées" },
          { libelle: "Journées que les consultants peuvent faire", montant: x.capacite, reference: x.capacite, unite: "journées" },
          { libelle: "Valeur vie d'un compte, à la méthode choisie", montant: l.valeur, reference: d.valeur },
          { libelle: "Valeur vie ÷ coût d'acquisition", montant: l.rapport, reference: d.rapport, unite: "fois" },
          { libelle: "Marge annuelle du portefeuille d'équilibre", montant: l.margeDuPortefeuille, reference: d.margeDuPortefeuille, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = valeurDesComptes(c);
        return {
          levier: "attrition",
          courbes: [
            { libelle: "Valeur vie simple", valeur: (p) => laboratoireDeLaValeur(x, p.recrues!, p.attrition!, METHODE.simple).simple },
            { libelle: "Valeur vie actualisée", valeur: (p) => laboratoireDeLaValeur(x, p.recrues!, p.attrition!, METHODE.actualisee).actualisee },
            { libelle: `${qte(RAPPORT_VISE)} fois le coût d'acquisition`, valeur: () => x.valeurVisee },
          ],
        };
      },
      defi: (c) => {
        const x = valeurDesComptes(c);
        const remplit = (l: ReturnType<typeof laboratoireDeLaValeur>) => l.equilibre >= x.comptesALaCapacite - 1e-9 && l.journees <= x.capacite + 1e-9;
        return {
          consigne: `Remplissez à l'équilibre les ${qte(x.capacite)} journées des consultants (${qte(x.comptesALaCapacite)} comptes), avec des comptes qui valent, actualisés, au moins ${qte(RAPPORT_VISE)} fois leur coût d'acquisition.`,
          atteint: (p) => {
            const l = laboratoireDeLaValeur(x, p.recrues!, p.attrition!, p.methode!);
            return remplit(l) && l.rapportActualise >= RAPPORT_VISE - 1e-9;
          },
          indice: (p) => {
            const l = laboratoireDeLaValeur(x, p.recrues!, p.attrition!, p.methode!);
            if (l.journees > x.capacite + 1e-9) return `À l'équilibre, ${qte(l.equilibre)} comptes demanderaient ${qte(l.journees)} journées, plus que les ${qte(x.capacite)} des consultants : moins de recrues, ou plus d'attrition.`;
            if (!remplit(l)) return `Le portefeuille tend vers ${qte(l.equilibre)} comptes : il en faut ${qte(x.comptesALaCapacite)}, soit des recrues égales à ${qte(x.comptesALaCapacite)} × l'attrition.`;
            if (p.methode === METHODE.simple && l.rapportSimple >= RAPPORT_VISE)
              return `En valeur vie simple, le rapport vaut ${qte(l.rapport)} : passez à la valeur actualisée, c'est elle que le défi compte. Actualisé, un compte ne vaut que ${eur(l.actualisee)}.`;
            return `Actualisé, un compte vaut ${eur(l.actualisee)}, moins que ${eur(x.valeurVisee)} : il faut perdre moins de comptes, et donc en recruter moins pour rester à ${qte(x.comptesALaCapacite)}.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      explication: (c, p) => {
        const x = valeurDesComptes(c);
        const l = laboratoireDeLaValeur(x, p.recrues!, p.attrition!, p.methode!);
        const piege = laboratoireDeLaValeur(x, x.n.nouveaux, x.attritionALaCapacite, METHODE.simple);
        return [
          `À ${qte(p.recrues!)} recrues par an et ${qte(p.attrition!)} % d'attrition, le portefeuille tend vers ${qte(l.equilibre)} comptes, qui remplissent les consultants, et un compte vaut ${eur(l.actualisee)} actualisé, ${qte(auCentime(l.rapportActualise))} fois son coût d'acquisition. Le cabinet remplit ses consultants avec moins de recrues, gardées plus longtemps.`,
          `Avec ${qte(x.n.nouveaux)} recrues à ${qte(x.attritionALaCapacite)} %, les consultants seraient pleins aussi, et la valeur vie simple dirait ${eur(piege.simple)}, ${qte(auCentime(piege.rapportSimple))} fois le coût d'acquisition. Actualisé, un compte n'y vaut que ${eur(piege.actualisee)}, ${qte(auCentime(piege.rapportActualise))} fois : l'objectif n'est pas tenu.`,
          `Le graphique le montre : la valeur vie simple grossit sans limite quand l'attrition baisse, car elle compte un euro lointain comme un euro d'aujourd'hui. L'actualisée monte moins vite, et ne dépasse jamais marge ÷ taux, ${eur(x.plafondActualise)}.`,
        ];
      },
    },
    {
      id: "la-valeur-actualisee",
      type: "montants",
      titre: "La valeur vie actualisée",
      notions: ["customer_lifetime_value", "discounting"],
      tableau: (c) => {
        const x = valeurDesComptes(c);
        return {
          titre: "Un compte de N, année par année",
          colonnes: x.annee.map((y) => `Année ${y.annee}`),
          lignes: [
            { libelle: "Chance d'être encore client", valeurs: x.annee.map((y) => pct(y.encoreClient, 2)) },
            { libelle: "Facteur d'actualisation", valeurs: x.annee.map((y) => (Math.round(10_000 / Math.pow(1 + x.taux, y.annee)) / 10_000).toLocaleString("fr-FR", { minimumFractionDigits: 4 })) },
          ],
        };
      },
      question: (c) => {
        const x = valeurDesComptes(c);
        return `La marge d'une année à venir n'est qu'attendue : elle ne vient que si le compte est encore client. Et elle vaut moins aujourd'hui, au taux de ${pct(x.taux)}. Calculez la marge attendue de la deuxième année, sa valeur actuelle, puis la valeur vie actualisée, la somme de toutes les années, qui vaut marge ÷ (attrition + taux). Enfin, le rapport de cette valeur au coût d'acquisition.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        const deux = x.annee[1]!;
        return [
          { libelle: "Marge attendue de la deuxième année", attendu: deux.attendue, calcul: `${eur(x.m.marge)} × ${pct(x.n.fidelisation)} = ${eur(deux.attendue)}` },
          { libelle: "Valeur actuelle de la deuxième année", attendu: deux.actualisee, calcul: `${eur(deux.attendue)} ÷ 1,1² = ${eur(deux.actualisee)}`, tolerance: 1 },
          { libelle: "Valeur vie actualisée", attendu: x.actualisee, calcul: `${eur(x.m.marge)} ÷ (${pct(x.n.attrition)} + ${pct(x.taux)}) = ${eur(x.actualisee)}` },
          { libelle: "Valeur vie actualisée ÷ coût d'acquisition", attendu: x.rapportActualise, calcul: `${eur(x.actualisee)} ÷ ${eur(x.acq.cac)} = ${qte(x.rapportActualise)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        const [un, deux, trois] = x.annee;
        return [
          `Année par année, un compte laisse ${eur(un!.actualisee)}, puis ${eur(deux!.actualisee)}, puis ${eur(trois!.actualisee)} en valeur d'aujourd'hui : chaque marge s'érode deux fois, par le risque de départ et par l'actualisation. La somme de toutes les années tend vers ${eur(x.actualisee)}, et non ${eur(x.simple)}.`,
          `Le rapport au coût d'acquisition tombe de ${qte(x.rapportSimple)} à ${qte(x.rapportActualise)}. C'est encore une conquête qui paie, mais sous l'objectif de ${qte(RAPPORT_VISE)} que la valeur simple faisait croire tenu. Le coût d'acquisition se paie aujourd'hui ; c'est à une valeur d'aujourd'hui qu'il se compare.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "L'attrition qui tient l'objectif, à rebours",
      notions: ["customer_lifetime_value", "discounting", "churn_rate"],
      question: (c) => {
        const x = valeurDesComptes(c);
        return `La direction veut qu'un compte vaille au moins ${qte(RAPPORT_VISE)} fois son coût d'acquisition. À marge inchangée, retrouvez la valeur vie qu'il faut, puis l'attrition la plus haute qui la donne, en valeur actualisée à ${pct(x.taux)}, puis en valeur simple. En pourcentage, au centième.`;
      },
      champs: (c) => {
        const x = valeurDesComptes(c);
        return [
          { libelle: "Valeur vie visée", attendu: x.valeurVisee, calcul: `${qte(RAPPORT_VISE)} × ${eur(x.acq.cac)} = ${eur(x.valeurVisee)}` },
          {
            libelle: "Attrition la plus haute, en valeur actualisée (%)",
            attendu: x.attritionMaxActualisee,
            calcul: `${eur(x.m.marge)} ÷ (attrition + ${pct(x.taux)}) = ${eur(x.valeurVisee)}, d'où attrition = ${eur(x.m.marge)} ÷ ${eur(x.valeurVisee)} − ${pct(x.taux)} = ${qte(x.attritionMaxActualisee)} %`,
            tolerance: 0.1,
          },
          {
            libelle: "Attrition la plus haute, en valeur simple (%)",
            attendu: x.attritionMaxSimple,
            calcul: `${eur(x.m.marge)} ÷ ${eur(x.valeurVisee)} = ${qte(x.attritionMaxSimple)} %`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDesComptes(c);
        return [
          `En valeur simple, l'objectif tient jusqu'à ${qte(x.attritionMaxSimple)} % d'attrition : le cabinet, à ${pct(x.n.attrition)}, croirait l'avoir. Actualisé, il faut descendre à ${qte(x.attritionMaxActualisee)} % : perdre ${qte(auCentime(x.n.attrition * 100 - x.attritionMaxActualisee))} points de moins, soit ${pct(1 - x.attritionMaxActualisee / (x.n.attrition * 100), 0)} des départs d'aujourd'hui.`,
          "La méthode change la décision, pas seulement le chiffre : un objectif fixé sur la valeur simple serait atteint sans effort, et la fidélisation paraîtrait inutile.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_lifetime_value", "churn_rate", "customer_acquisition_cost", "customer_portfolio", "discounting"],
      tableau: (c) => {
        const x = valeurDesComptes(c);
        return {
          titre: `Un compte ${dE(x.f.entreprise)}, année N`,
          colonnes: ["Valeur vie simple", "Valeur vie actualisée"],
          lignes: [
            { libelle: "Marge annuelle d'un compte", valeurs: [eur(x.m.marge), eur(x.m.marge)] },
            { libelle: "Diviseur", valeurs: [pct(x.n.attrition), `${pct(x.n.attrition)} + ${pct(x.taux)}`] },
            { libelle: "Valeur vie", valeurs: [eur(x.simple), eur(x.actualisee)] },
            { libelle: "Valeur vie ÷ coût d'acquisition", valeurs: [qte(x.rapportSimple), qte(x.rapportActualise)] },
          ],
        };
      },
      texte: (c) => {
        const x = valeurDesComptes(c);
        return [
          `Un compte ${dE(x.f.entreprise)} laisse ${eur(x.m.marge)} par an, temps des consultants compris, et reste ${qte(x.dureeDeVie)} ans en moyenne : il vaut ${eur(x.simple)} en valeur simple, ${eur(x.actualisee)} actualisé, pour ${eur(x.acq.cac)} de conquête. Le rapport se lit actualisé, ${qte(x.rapportActualise)}, parce que le coût d'acquisition se paie aujourd'hui.`,
          `L'attrition monte de ${pct(x.n2.attrition)} en N − 2 à ${pct(x.n.attrition)} en N, et le portefeuille d'équilibre tombe de ${qte(x.equilibreN2)} à ${qte(x.equilibre)} comptes : le cabinet ne grossit plus. Fidéliser pèse plus que recruter autant, parce que l'attrition divise ; mais un portefeuille se borne aussi à ce que les consultants peuvent servir.`,
          "Au niveau de l'examen, vous savez calculer une attrition et une valeur vie, simple et actualisée, la comparer au coût d'acquisition, retrouver à rebours l'attrition qui tient un objectif, calculer un portefeuille d'équilibre face à la capacité, et dire pourquoi la méthode change la décision.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur vie simple = marge annuelle ÷ attrition. Valeur vie actualisée = marge annuelle ÷ (attrition + taux d'actualisation). Portefeuille d'équilibre = recrues de l'année ÷ attrition.",
    },
  ],
};
