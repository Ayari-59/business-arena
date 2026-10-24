import { CREATION_PREMIER_BILAN } from "./chapitres/creation-premier-bilan";
import { LA_PAIE } from "./chapitres/la-paie";
import { L_EMPRUNT } from "./chapitres/l-emprunt";
import { IMMOBILISATIONS } from "./chapitres/immobilisations";
import { LES_STOCKS } from "./chapitres/les-stocks";
import { LA_CLOTURE } from "./chapitres/la-cloture";
import { REMISES_ET_REGLEMENTS } from "./chapitres/remises-et-reglements";
import { SEUIL_DE_RENTABILITE } from "./chapitres/seuil-de-rentabilite";
import { COUT_COMPLET } from "./chapitres/cout-complet";
import { COUT_PAR_PRODUIT } from "./chapitres/cout-par-produit";
import { BUDGET_DE_TRESORERIE } from "./chapitres/budget-de-tresorerie";
import { ANALYSE_DES_ECARTS } from "./chapitres/analyse-des-ecarts";
import { TABLEAU_DE_BORD } from "./chapitres/tableau-de-bord";
import { DECIDER } from "./chapitres/decider";
import { DEPRECIATIONS_ET_PROVISIONS } from "./chapitres/depreciations-et-provisions";
import { REGULARISATIONS } from "./chapitres/regularisations";
import { SOLDES_INTERMEDIAIRES } from "./chapitres/soldes-intermediaires";
import { BILAN_FONCTIONNEL } from "./chapitres/bilan-fonctionnel";
import { LES_FLUX } from "./chapitres/les-flux";
import { CHARGES_ET_ENCAISSEMENTS } from "./chapitres/charges-et-encaissements";
import { PRIX_COUT_MARGE } from "./chapitres/prix-cout-marge";
import { TAUX_DE_MARQUE } from "./chapitres/taux-de-marque";
import { INDICATEURS_DU_POINT_DE_VENTE } from "./chapitres/indicateurs-du-point-de-vente";
import { STOCK_DU_POINT_DE_VENTE } from "./chapitres/stock-du-point-de-vente";
import { PREVOIR_LES_VENTES } from "./chapitres/prevoir-les-ventes";
import { BUDGET_DU_POINT_DE_VENTE } from "./chapitres/budget-du-point-de-vente";
import { SEUIL_DU_POINT_DE_VENTE } from "./chapitres/seuil-du-point-de-vente";
import { PROMOTION_QUI_PAIE } from "./chapitres/promotion-qui-paie";
import { ASSORTIMENT } from "./chapitres/assortiment";
import { EQUIPE_ET_PLANNING } from "./chapitres/equipe-et-planning";
import { TABLEAU_DE_BORD_DU_MANAGER } from "./chapitres/tableau-de-bord-du-manager";
import { VALEUR_D_UN_CLIENT } from "./chapitres/valeur-d-un-client";
import { NEGOCIER_LE_PRIX } from "./chapitres/negocier-le-prix";
import { REMISES_ET_CONDITIONS } from "./chapitres/remises-et-conditions";
import { COUT_D_ACQUISITION } from "./chapitres/cout-d-acquisition";
import { COMMISSIONS_DES_PARTENAIRES } from "./chapitres/commissions-des-partenaires";
import { PORTEFEUILLE_ABC } from "./chapitres/portefeuille-abc";
import { TABLEAU_DE_BORD_COMMERCIAL } from "./chapitres/tableau-de-bord-commercial";
import { MARCHE_ET_PART_DE_MARCHE } from "./chapitres/marche-et-part-de-marche";
import { SEGMENTER_ET_CIBLER } from "./chapitres/segmenter-et-cibler";
import { PRIX_PSYCHOLOGIQUE } from "./chapitres/prix-psychologique";
import { DEMANDE_ET_PRIX } from "./chapitres/demande-et-prix";
import { COMMUNICATION } from "./chapitres/communication";
import { CANAUX_DE_DISTRIBUTION } from "./chapitres/canaux-de-distribution";
import { LIRE_LE_COMPTE_DE_RESULTAT } from "./chapitres/lire-le-compte-de-resultat";
import { LIRE_LE_BILAN } from "./chapitres/lire-le-bilan";
import type { Chapitre } from "./types";

/**
 * LE COURS PAR LA SIMULATION : SIX PARCOURS, QUATRE PALIERS.
 *
 * Un palier n'est pas un niveau du jeu (les niveaux 1 à 7 de l'arène) : c'est une
 * marche du programme, du lycée au DCG. Un chapitre appartient à un parcours et à
 * un palier ; il se joue dans n'importe laquelle des entreprises du cours, ou dans
 * celles qu'il nomme.
 *
 * LE PARCOURS D'UNE FORMATION. Les deux premiers suivent la discipline ; les suivants
 * suivent une formation (le BTS MCO, le BTS NDRC, la mercatique et la gestion et finance du
 * bac STMG), et ne couvrent
 * que les paliers où elle a quelque chose à apprendre, sous ses mots. Tant qu'il se construit, la carte dit ce qui vient.
 *
 * ACCÈS (décision du propriétaire) : le premier chapitre est libre, il sert de
 * démonstration ; la suite du cours est réservée aux établissements sous licence.
 */

export type CodeParcours = Chapitre["parcours"];

export interface Parcours {
  code: CodeParcours;
  titre: string;
  resume: string;
  /** Le public de chaque palier, quand le parcours suit une formation ; absent : celui des paliers. */
  publics?: Partial<Record<Chapitre["palier"], string>>;
  /** Le parcours se construit : certains paliers de sa carte n'ont pas encore de chapitre. */
  enPreparation?: true;
  /**
   * La formation que le parcours suit (config/formations.ts), quand il en suit une : sa page de
   * couverture (/parcours/<formation>) le présente en entier, même les chapitres dont le
   * programme n'a pas encore été confronté au texte et qui ne citent donc aucun bloc. Absent :
   * un parcours de discipline, qui paraît chez chaque formation par les blocs qu'il cite.
   */
  formation?: string;
}

export const PARCOURS: readonly Parcours[] = [
  {
    code: "comptabilite-generale",
    titre: "Comptabilité générale",
    resume: "Du journal au bilan : chaque opération de l'entreprise, passée par l'élève, et les états qu'elle construit.",
  },
  {
    code: "controle-de-gestion",
    titre: "Comptabilité de gestion et contrôle de gestion",
    resume: "Des coûts aux décisions : marges, seuil de rentabilité, coûts complets, budgets et écarts, sur le même cas simulé.",
  },
  {
    code: "mco",
    formation: "bts-mco",
    titre: "BTS MCO · Gérer un point de vente",
    resume:
      "La gestion opérationnelle d'une unité commerciale, puis l'animation de l'offre et le management de l'équipe : les calculs du magasin, sur les chiffres de l'arène.",
    publics: { 2: "BTS MCO, 1re année", 3: "BTS MCO", 4: "BTS MCO, 2e année" },
  },
  {
    code: "ndrc",
    formation: "bts-ndrc",
    titre: "BTS NDRC · Négocier et développer la relation client",
    resume:
      "La négociation, la valeur d'un client et le pilotage de l'activité commerciale : ce qu'une affaire, un client, une campagne ou un canal rapporte, sur les chiffres de l'arène.",
    publics: { 2: "BTS NDRC, 1re année", 3: "BTS NDRC", 4: "BTS NDRC, 2e année" },
  },
  {
    code: "stmg",
    formation: "stmg",
    titre: "Bac STMG · Mercatique",
    resume:
      "Le marché, les clients, le prix, la communication et la distribution : les questions du mercaticien, sur les chiffres de l'arène, au niveau du lycée.",
    publics: { 1: "Terminale STMG, mercatique" },
  },
  {
    code: "stmg-gf",
    formation: "stmg",
    titre: "Bac STMG · Gestion et finance",
    resume:
      "Le compte de résultat, le bilan, la valeur créée, la rentabilité, la trésorerie et le financement : lire les comptes d'une entreprise, sur son année dans l'arène, au niveau du lycée.",
    publics: { 1: "Terminale STMG, gestion et finance" },
    enPreparation: true,
  },
];

export const PALIERS: readonly { palier: Chapitre["palier"]; titre: string; public: string }[] = [
  { palier: 1, titre: "Découvrir", public: "Lycée, bac STMG" },
  { palier: 2, titre: "Les bases", public: "BTS, BUT 1re année" },
  { palier: 3, titre: "Les opérations courantes", public: "BTS, BUT" },
  { palier: 4, titre: "Analyser et décider", public: "BTS 2e année, BUT, DCG" },
];

/** Ce que chaque palier couvre, parcours par parcours : la carte du cours. Un palier absent n'est pas au programme. */
export const PROGRAMME: Record<CodeParcours, Partial<Record<Chapitre["palier"], readonly string[]>>> = {
  "comptabilite-generale": {
    1: ["Les flux de l'entreprise", "Charges et produits, encaissements et décaissements"],
    2: ["La partie double et le journal", "La TVA", "Le premier bilan"],
    3: ["Remises et règlements", "La paie", "L'emprunt et ses intérêts", "Immobilisations et amortissements", "Les stocks", "La clôture"],
    4: ["Dépréciations et provisions", "Régularisations de fin d'exercice", "Soldes intermédiaires de gestion et CAF", "Bilan fonctionnel et BFR"],
  },
  "controle-de-gestion": {
    1: ["Prix, coût et marge"],
    2: ["Charges variables et charges fixes", "Marge sur coût variable", "Seuil de rentabilité"],
    3: ["Coût complet et centres d'analyse", "Coût par produit"],
    4: ["Budgets", "Analyse des écarts", "Tableau de bord", "Décider : prix, fabriquer ou acheter"],
  },
  mco: {
    2: ["Taux de marque, taux de marge, coefficient", "Les indicateurs du point de vente"],
    3: ["Le stock du point de vente", "Prévoir les ventes", "Le budget du point de vente", "Le seuil de rentabilité du point de vente"],
    4: ["La promotion qui paie", "L'assortiment : marge et volume", "L'équipe et son planning", "Le tableau de bord du manager"],
  },
  ndrc: {
    2: ["Négocier le prix : marge de manœuvre et prix plancher", "Remises et conditions : la rentabilité d'une affaire"],
    3: ["La valeur d'un client : attrition et valeur vie", "Le coût d'acquisition et la rentabilité d'une campagne", "Les commissions des canaux partenaires"],
    4: ["Le portefeuille clients : la méthode ABC", "Le tableau de bord commercial"],
  },
  stmg: {
    1: [
      "Le marché et la part de marché",
      "Segmenter et cibler",
      "Le prix psychologique",
      "La demande répond au prix",
      "Ce que rapporte la communication",
      "Les canaux de distribution",
    ],
  },
  "stmg-gf": {
    1: [
      "Le compte de résultat : ce que l'année a rapporté",
      "Le bilan : ce que l'entreprise possède et ce qu'elle doit",
      "La valeur ajoutée et son partage",
      "La rentabilité",
      "Fonds de roulement, besoin en fonds de roulement et trésorerie",
      "Financer l'entreprise : autofinancement ou emprunt",
    ],
  },
};

/** Les paliers que la carte montre pour un parcours, dans l'ordre. */
export const paliersDuParcours = (code: CodeParcours) => PALIERS.filter((pa) => PROGRAMME[code][pa.palier] !== undefined);

export const CHAPITRES: readonly Chapitre[] = [CREATION_PREMIER_BILAN, LES_FLUX, CHARGES_ET_ENCAISSEMENTS, LA_PAIE, L_EMPRUNT, IMMOBILISATIONS, LES_STOCKS, LA_CLOTURE, REMISES_ET_REGLEMENTS, DEPRECIATIONS_ET_PROVISIONS, REGULARISATIONS, SOLDES_INTERMEDIAIRES, BILAN_FONCTIONNEL, PRIX_COUT_MARGE, SEUIL_DE_RENTABILITE, COUT_COMPLET, COUT_PAR_PRODUIT, BUDGET_DE_TRESORERIE, ANALYSE_DES_ECARTS, TABLEAU_DE_BORD, DECIDER, TAUX_DE_MARQUE, INDICATEURS_DU_POINT_DE_VENTE, STOCK_DU_POINT_DE_VENTE, PREVOIR_LES_VENTES, BUDGET_DU_POINT_DE_VENTE, SEUIL_DU_POINT_DE_VENTE, PROMOTION_QUI_PAIE, ASSORTIMENT, EQUIPE_ET_PLANNING, TABLEAU_DE_BORD_DU_MANAGER, NEGOCIER_LE_PRIX, REMISES_ET_CONDITIONS, VALEUR_D_UN_CLIENT, COUT_D_ACQUISITION, COMMISSIONS_DES_PARTENAIRES, PORTEFEUILLE_ABC, TABLEAU_DE_BORD_COMMERCIAL, MARCHE_ET_PART_DE_MARCHE, SEGMENTER_ET_CIBLER, PRIX_PSYCHOLOGIQUE, DEMANDE_ET_PRIX, COMMUNICATION, CANAUX_DE_DISTRIBUTION, LIRE_LE_COMPTE_DE_RESULTAT, LIRE_LE_BILAN];

export const chapitreParCode = (code: string) => CHAPITRES.find((c) => c.code === code);
