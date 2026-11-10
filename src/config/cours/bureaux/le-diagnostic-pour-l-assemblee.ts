import { arrondi2, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDe } from "../chapitres/la-cloture";
import { diagnosticDuChapitre } from "../chapitres/le-diagnostic-financier-et-extra-financier";
import { eur, nombre } from "../enquetes/lignes-du-dossier";
import type { DateDuCours } from "../monde/amortissement";
import { TAUX_DE_TVA } from "../monde/nova-gestion";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE DIAGNOSTIC POUR L'ASSEMBLÉE (comptabilité générale, palier 4 ; la suite du chapitre « Le
 * diagnostic financier et extra-financier »).
 *
 * En mars N+3, le président prépare l'assemblée qui approuvera les comptes de N+2 ; il veut un diagnostic
 * chiffré, face à N+1 et au secteur. L'élève reçoit la pile (le courriel, les comptes résumés de N+1 et de
 * N+2, le bilan de N+2, le rapport de durabilité, la batterie de N+1 et les médianes du secteur), calcule
 * les ratios de N+2, range chacun selon son niveau face au secteur et sa tendance, puis rend sa
 * conclusion. Le chapitre donne la batterie calculée ; le bureau la fait calculer sur les comptes, et
 * juger ratio par ratio, le sens de chacun compris (un délai ou un endettement qui baisse est un progrès).
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : monde/diagnostic-de-nova.ts, lu par
 * `diagnosticDuChapitre`.
 */

const d = diagnosticDuChapitre();
const { n1, n2, r1, r2, e1, e2, s } = d;
const b2 = r2.bilan;

/** Le jour où l'élève ouvre la pile (hypothèse du bureau). */
export const JOUR_DU_DIAGNOSTIC: DateDuCours = { jour: 15, mois: 3, exercice: 3 };
const JOUR = dateDe(JOUR_DU_DIAGNOSTIC);

const enPourcent = (t: number) => arrondi2(t * 100);
const pctDe = (t: number) => pct(enPourcent(t));

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Le diagnostic de N+2, pour l'assemblée",
  paragraphes: [
    "Bonjour,",
    "Les associés approuveront bientôt les comptes de N+2. Je veux leur présenter un diagnostic chiffré : nos ratios de l'année, face à N+1 et au secteur, et une conclusion.",
    "Calculez-les sur les comptes ; ne recopiez rien. Puis dites-moi ce qui va bien, ce qui recule et ce qui reste en retrait.",
    "Merci. Le président",
  ],
};

const comptes = (code: string, titre: string, e: typeof n1): PieceDuBureau => ({
  code,
  nature: "note",
  titre,
  de: "La comptabilité de NOVA",
  a: "Le président",
  date: JOUR,
  objet: "Le compte de résultat par soldes",
  montants: [
    { libelle: "Chiffre d'affaires (production vendue)", montant: e.production },
    { libelle: "Composants consommés, hors taxes", montant: e.composantsConsommes },
    { libelle: "Valeur ajoutée", montant: e.valeurAjoutee },
    { libelle: "Excédent brut d'exploitation", montant: e.excedentBrutDExploitation },
    { libelle: "Résultat d'exploitation", montant: e.resultatDExploitation },
    { libelle: "Résultat net", montant: e.resultatNet, fort: true },
    { libelle: "Capacité d'autofinancement", montant: e.caf },
  ],
});

const COMPTES_N1 = comptes("comptes-n1", "Les comptes résumés de N+1", n1);
const COMPTES_N2 = comptes("comptes-n2", "Les comptes résumés de N+2", n2);

const BILAN: PieceDuBureau = {
  code: "bilan",
  nature: "note",
  titre: "Le bilan de N+2, au 31 décembre",
  de: "La comptabilité de NOVA",
  a: "Le président",
  date: JOUR,
  objet: "Les postes du diagnostic",
  montants: [
    { libelle: "Immobilisations, en brut", montant: n2.immobilisationsBrutes },
    { libelle: "Amortissements cumulés", montant: n2.amortissements },
    { libelle: "Stocks", montant: n2.stocks },
    { libelle: "Clients, en brut", montant: n2.clientsBruts },
    { libelle: "Actif circulant, trésorerie comprise", montant: b2.actifCirculant },
    { libelle: "Capitaux propres", montant: n2.capitauxPropres },
    { libelle: "Dettes financières", montant: n2.dettesFinancieres },
    { libelle: "Dettes à moins d'un an", montant: b2.dettesAMoinsDUnAn, fort: true },
  ],
  mention: `Ventes soumises à la TVA à ${nombre(TAUX_DE_TVA * 100)} %.`,
};

const DURABILITE: PieceDuBureau = {
  code: "durabilite",
  nature: "note",
  titre: "Le rapport de durabilité de N+2",
  de: "Le responsable de la production",
  a: "Le président",
  date: JOUR,
  objet: "Énergie, déchets, équipe",
  paragraphes: [
    `Électricité consommée sur l'année, atelier et bâtiment : ${nombreAuCentieme(e2.kwh)} kWh, pour ${nombreAuCentieme(n2.enceintes)} enceintes montées.`,
    `Part des emballages valorisés : ${pctDe(e2.partValorisee)}. Absentéisme : ${pctDe(e2.absenteisme)} des heures payées. Formation : ${nombreAuCentieme(e2.formationParSalarie)} heures par salarié.`,
  ],
};

/** Les ratios que le bureau fait calculer, et ce qu'en dit la centrale pour N+1 et le secteur. */
interface RatioDuDiagnostic {
  code: string;
  libelle: string;
  /** La valeur de N+2, à saisir, dans l'unité de la grille. */
  valeur: number;
  unite: string;
  calcul: string;
  indice: string;
  nPlus1: number;
  secteur: number;
  /** Un ratio qui s'améliore en baissant (un délai, un endettement, une usure, une consommation). */
  baisseEstUnProgres: boolean;
  pourquoi: string;
}

const RATIOS: readonly RatioDuDiagnostic[] = [
  {
    code: "croissance",
    libelle: "Croissance du chiffre d'affaires",
    valeur: enPourcent(r2.croissanceDuChiffreDAffaires!),
    unite: "%",
    calcul: `${eur(n2.production)} ÷ ${eur(n1.production)} − 1 = ${pctDe(r2.croissanceDuChiffreDAffaires!)}`,
    indice: "le chiffre d'affaires de N+2 sur celui de N+1, moins un",
    nPlus1: enPourcent(r1.croissanceDuChiffreDAffaires!),
    secteur: enPourcent(s.croissanceDuChiffreDAffaires),
    baisseEstUnProgres: false,
    pourquoi: `Mieux que le secteur, mais en recul : ${pctDe(r2.croissanceDuChiffreDAffaires!)} après ${pctDe(r1.croissanceDuChiffreDAffaires!)}, l'année de lancement de la gamme. La croissance ralentit, et reste bien au-dessus des ${pctDe(s.croissanceDuChiffreDAffaires)} du secteur.`,
  },
  {
    code: "valeur-ajoutee",
    libelle: "Taux de valeur ajoutée",
    valeur: enPourcent(r2.tauxDeValeurAjoutee),
    unite: "%",
    calcul: `${eur(n2.valeurAjoutee)} ÷ ${eur(n2.production)} = ${pctDe(r2.tauxDeValeurAjoutee)}`,
    indice: "la valeur ajoutée sur la production",
    nPlus1: enPourcent(r1.tauxDeValeurAjoutee),
    secteur: enPourcent(s.tauxDeValeurAjoutee),
    baisseEstUnProgres: false,
    pourquoi: `En retrait du secteur, ${pctDe(r2.tauxDeValeurAjoutee)} contre ${pctDe(s.tauxDeValeurAjoutee)}, même s'il progresse : un métier d'assembleur, qui achète beaucoup de ce qu'il vend.`,
  },
  {
    code: "marge-brute",
    libelle: "Taux de marge brute",
    valeur: enPourcent(r2.tauxDeMargeBrute),
    unite: "%",
    calcul: `${eur(n2.excedentBrutDExploitation)} ÷ ${eur(n2.production)} = ${pctDe(r2.tauxDeMargeBrute)}`,
    indice: "l'excédent brut d'exploitation sur le chiffre d'affaires",
    nPlus1: enPourcent(r1.tauxDeMargeBrute),
    secteur: enPourcent(s.tauxDeMargeBrute),
    baisseEstUnProgres: false,
    pourquoi: `Mieux que le secteur, et en progrès : la gamme et la seconde ligne portent leurs fruits.`,
  },
  {
    code: "rentabilite-financiere",
    libelle: "Rentabilité financière",
    valeur: enPourcent(r2.rentabiliteFinanciere),
    unite: "%",
    calcul: `${eur(n2.resultatNet)} ÷ ${eur(n2.capitauxPropres)} = ${pctDe(r2.rentabiliteFinanciere)}`,
    indice: "le résultat net sur les capitaux propres",
    nPlus1: enPourcent(r1.rentabiliteFinanciere),
    secteur: enPourcent(s.rentabiliteFinanciere),
    baisseEstUnProgres: false,
    pourquoi: `Mieux que le secteur, et en progrès : ${pctDe(r2.rentabiliteFinanciere)} contre ${pctDe(s.rentabiliteFinanciere)} pour le secteur.`,
  },
  {
    code: "endettement",
    libelle: "Endettement",
    valeur: r2.endettement,
    unite: "fois",
    calcul: `${eur(n2.dettesFinancieres)} ÷ ${eur(n2.capitauxPropres)} = ${nombreAuCentieme(r2.endettement)}`,
    indice: "les dettes financières sur les capitaux propres",
    nPlus1: r1.endettement,
    secteur: s.endettement,
    baisseEstUnProgres: true,
    pourquoi: `Mieux que le secteur, et en progrès : un endettement qui baisse, ${nombreAuCentieme(r2.endettement)} après ${nombreAuCentieme(r1.endettement)}, l'emprunt se rembourse sans être remplacé.`,
  },
  {
    code: "liquidite",
    libelle: "Liquidité générale",
    valeur: r2.liquiditeGenerale,
    unite: "fois",
    calcul: `${eur(b2.actifCirculant)} ÷ ${eur(b2.dettesAMoinsDUnAn)} = ${nombreAuCentieme(r2.liquiditeGenerale)}`,
    indice: "l'actif circulant sur les dettes à moins d'un an",
    nPlus1: r1.liquiditeGenerale,
    secteur: s.liquiditeGenerale,
    baisseEstUnProgres: false,
    pourquoi: `Mieux que le secteur, et en progrès : ${nombreAuCentieme(r2.liquiditeGenerale)} euros d'actif circulant pour un euro de dettes à court terme.`,
  },
  {
    code: "delai-clients",
    libelle: "Délai des clients",
    valeur: r2.delaiClients,
    unite: "jours",
    calcul: `${eur(n2.clientsBruts)} × 360 ÷ (${eur(n2.production)} × ${nombre(1 + TAUX_DE_TVA)}) = ${nombreAuCentieme(r2.delaiClients)} jours`,
    indice: "les clients en brut sur le chiffre d'affaires toutes taxes comprises, en jours",
    nPlus1: r1.delaiClients,
    secteur: s.delaiClients,
    baisseEstUnProgres: true,
    pourquoi: `Mieux que le secteur, mais en recul : ${nombreAuCentieme(r2.delaiClients)} jours après ${nombreAuCentieme(r1.delaiClients)}. Le niveau rassure, la tendance non : les chaînes de hi-fi paient plus tard.`,
  },
  {
    code: "stock",
    libelle: "Durée du stock",
    valeur: r2.rotationDesStocks,
    unite: "jours",
    calcul: `${eur(n2.stocks)} × 360 ÷ ${eur(n2.composantsConsommes)} = ${nombreAuCentieme(r2.rotationDesStocks)} jours`,
    indice: "le stock sur les composants consommés, en jours",
    nPlus1: r1.rotationDesStocks,
    secteur: s.rotationDesStocks,
    baisseEstUnProgres: true,
    pourquoi: `Mieux que le secteur, mais en recul : le stock dure ${nombreAuCentieme(r2.rotationDesStocks)} jours, après ${nombreAuCentieme(r1.rotationDesStocks)}. Avec le délai des clients, il fait croître le besoin plus vite que les ventes.`,
  },
  {
    code: "usure",
    libelle: "Taux d'usure de l'outil",
    valeur: enPourcent(r2.tauxDUsure),
    unite: "%",
    calcul: `${eur(n2.amortissements)} ÷ ${eur(n2.immobilisationsBrutes)} = ${pctDe(r2.tauxDUsure)}`,
    indice: "les amortissements cumulés sur les immobilisations brutes",
    nPlus1: enPourcent(r1.tauxDUsure),
    secteur: enPourcent(s.tauxDUsure),
    baisseEstUnProgres: true,
    pourquoi: `Mieux que le secteur, mais en recul : l'outil s'use vite, ${pctDe(r2.tauxDUsure)} après ${pctDe(r1.tauxDUsure)}, presque au niveau du secteur. Il faudra le renouveler.`,
  },
  {
    code: "energie",
    libelle: "Électricité par enceinte",
    valeur: e2.kwhParEnceinte,
    unite: "kWh",
    calcul: `${nombreAuCentieme(e2.kwh)} kWh ÷ ${nombreAuCentieme(n2.enceintes)} enceintes = ${nombreAuCentieme(e2.kwhParEnceinte)} kWh`,
    indice: "l'électricité de l'année sur les enceintes montées",
    nPlus1: e1.kwhParEnceinte,
    secteur: s.kwhParEnceinte,
    baisseEstUnProgres: true,
    pourquoi: `Mieux que le secteur, et en progrès : une consommation qui baisse, ${nombreAuCentieme(e2.kwhParEnceinte)} kWh après ${nombreAuCentieme(e1.kwhParEnceinte)}.`,
  },
];

const BATTERIE: PieceDuBureau = {
  code: "batterie",
  nature: "note",
  titre: "La batterie de N+1 et les médianes du secteur",
  de: "La centrale de bilans",
  a: "NOVA",
  date: JOUR,
  objet: "Fabricants d'équipements audio de 10 à 49 salariés",
  paragraphes: RATIOS.map((x) => `${x.libelle} : ${nombreAuCentieme(x.nPlus1)} ${x.unite} en N+1 ; médiane du secteur, ${nombreAuCentieme(x.secteur)} ${x.unite}.`),
  mention: "Des médianes indicatives, pour des entreprises qui louent leurs locaux.",
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, COMPTES_N1, COMPTES_N2, BILAN, DURABILITE, BATTERIE];

// ─────────────────────────────────────────────────────────────────────────────
// LES RATIOS ET LE JUGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Les dix ratios de N+2, au centième. */
export function grilleDesRatiosDeNPlus2(): TableauACompleter {
  return {
    titre: "Les ratios de N+2, au centième",
    colonnes: ["N+2"],
    lignes: RATIOS.map((x) => ({ libelle: x.libelle, cellules: [{ valeur: x.valeur, saisir: true, unite: x.unite, calcul: x.calcul, indice: x.indice }] })),
  };
}

const JUGEMENTS = [
  { code: "fort", libelle: "Mieux que le secteur, et en progrès" },
  { code: "vigilance", libelle: "Mieux que le secteur, mais en recul" },
  { code: "retrait", libelle: "En retrait du secteur" },
] as const;

/** Le jugement d'un ratio : son niveau face au secteur, puis sa tendance, dans son sens. */
export function jugementDuRatio(x: Pick<RatioDuDiagnostic, "valeur" | "nPlus1" | "secteur" | "baisseEstUnProgres">): (typeof JUGEMENTS)[number]["code"] {
  const mieux = (a: number, b: number) => (x.baisseEstUnProgres ? a < b : a > b);
  if (!mieux(x.valeur, x.secteur)) return "retrait";
  return mieux(x.valeur, x.nPlus1) ? "fort" : "vigilance";
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const multiplieDuBesoin = Math.round((n2.besoinDExploitation / n1.besoinDExploitation) * 100) / 100;
const multiplieDesVentes = Math.round((n2.production / n1.production) * 100) / 100;

export const LE_DIAGNOSTIC_POUR_L_ASSEMBLEE: Bureau = {
  code: "le-diagnostic-pour-l-assemblee",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-diagnostic-financier-et-extra-financier"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Au bureau : le diagnostic pour l'assemblée",
  accroche: "Le président veut présenter aux associés un diagnostic chiffré de N+2. Calculez ses ratios sur les comptes, jugez chacun face au secteur et dans le temps, puis rendez votre conclusion.",
  objectifs: [
    "Calculer des ratios d'activité, de profitabilité, de rentabilité, de structure, de rotation et ESG sur des comptes",
    "Juger un ratio à la fois par son niveau face au secteur et par sa tendance, dans son sens",
    "Repérer les points de vigilance derrière de bons niveaux",
    "Rendre une conclusion générale motivée",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Les comptes de N+2 sont arrêtés ; l'assemblée des associés approche.`,
    "Sur votre poste, la pile : le courriel du président dessus, les comptes résumés de N+1 et de N+2, le bilan de N+2, le rapport de durabilité, et la batterie de N+1 avec les médianes du secteur.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "les-ratios",
      type: "etat",
      titre: "Calculer les ratios de N+2",
      consigne: "Calculez chaque ratio de N+2 au centième, dans l'unité de la ligne. Les taux s'écrivent en pour cent.",
      pieces: ["comptes-n1", "comptes-n2", "bilan", "durabilite"],
      grille: grilleDesRatiosDeNPlus2(),
      reussite: "Les ratios de N+2 sont justes.",
      explication: ["Chaque ratio rapporte deux grandeurs de même nature ou qui s'expliquent : un flux sur un flux, un stock sur un stock, un stock sur un flux en jours. Il reste à les lire."],
    },
    {
      id: "le-jugement",
      type: "classement",
      titre: "Juger chaque ratio",
      consigne: "Pour chaque ratio, comparez N+2 au secteur, puis à N+1, dans le sens du ratio : un délai ou un endettement qui baisse est un progrès.",
      pieces: ["batterie"],
      categories: JUGEMENTS,
      elements: RATIOS.map((x) => ({ code: x.code, libelle: x.libelle, categorie: jugementDuRatio(x), pourquoi: x.pourquoi })),
      explication: [
        "Un diagnostic lit le niveau et la tendance ensemble. Les reculs de NOVA se cachent derrière de bons niveaux : la croissance, le délai des clients, la durée du stock, l'usure de l'outil.",
      ],
    },
    {
      id: "la-conclusion",
      type: "reponse",
      titre: "Rendre la conclusion",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "la-vigilance",
          question: "Quel point de vigilance présenter aux associés ?",
          options: [
            { texte: "Le besoin qui croît plus vite que les ventes", juste: true, retour: `Oui : le besoin d'exploitation a été multiplié par ${nombreAuCentieme(multiplieDuBesoin)} en un an, les ventes par ${nombreAuCentieme(multiplieDesVentes)}. Le délai des clients et la durée du stock en sont la cause.` },
            { texte: "L'endettement, qui menace la structure", juste: false, retour: `Non : ${nombreAuCentieme(r2.endettement)}, contre ${nombreAuCentieme(s.endettement)} pour le secteur. La structure est très solide.` },
            { texte: "La rentabilité financière, trop faible pour les associés", juste: false, retour: `Non : ${pctDe(r2.rentabiliteFinanciere)}, contre ${pctDe(s.rentabiliteFinanciere)} pour le secteur.` },
            { texte: "La consommation d'électricité par enceinte, qui reste au-dessus de celle du secteur", juste: false, retour: `Non : ${nombreAuCentieme(e2.kwhParEnceinte)} kWh contre ${nombreAuCentieme(s.kwhParEnceinte)} : NOVA est plus sobre que son secteur.` },
          ],
        },
        {
          id: "la-valeur-ajoutee",
          question: "Le taux de valeur ajoutée est en retrait du secteur. Qu'en dire aux associés ?",
          options: [
            { texte: "Il dit un métier d'assembleur", juste: true, retour: `Oui : NOVA achète beaucoup de ce qu'elle vend. Sa marge brute, ${pctDe(r2.tauxDeMargeBrute)}, dépasse pourtant celle du secteur : elle tient ses autres coûts.` },
            { texte: "Il prouve que NOVA perd de l'argent sur chaque enceinte", juste: false, retour: `Non : le résultat net de N+2 est de ${eur(n2.resultatNet)}.` },
            { texte: "Il faut le cacher, puisque le secteur fait mieux", juste: false, retour: "Non : un diagnostic dit aussi ce qui reste en retrait, avec son explication." },
          ],
        },
        {
          id: "la-conclusion",
          question: "Quelle conclusion générale rendre ?",
          options: [
            { texte: "Rentable et solide ; le besoin et l'outil à surveiller", juste: true, retour: "Oui : une croissance profitable, une structure très solide, des indicateurs de durabilité qui progressent ; à surveiller, le besoin d'exploitation et l'usure de l'outil." },
            { texte: "Tout est meilleur que le secteur : rien à signaler", juste: false, retour: "Non : le taux de valeur ajoutée est en retrait, et plusieurs ratios reculent derrière de bons niveaux." },
            { texte: "Une entreprise qui ralentit : sa croissance recule nettement, il faut s'inquiéter", juste: false, retour: `Non : ${pctDe(r2.croissanceDuChiffreDAffaires!)} reste bien au-dessus des ${pctDe(s.croissanceDuChiffreDAffaires)} du secteur ; l'année de lancement ne pouvait pas se répéter.` },
          ],
        },
      ],
      explication: [`Votre conclusion aux associés : NOVA est rentable, ${pctDe(r2.rentabiliteFinanciere)} de rentabilité financière, et solide, ${nombreAuCentieme(r2.endettement)} d'endettement ; elle doit surveiller son besoin d'exploitation et préparer le renouvellement de son outil.`],
    },
  ],
};
