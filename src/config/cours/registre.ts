import { situationParCode } from "./situations";
import { CREATION_PREMIER_BILAN, DU_RESULTAT_A_LA_TRESORERIE } from "./chapitres/creation-premier-bilan";
import { LA_PAIE } from "./chapitres/la-paie";
import { L_EMPRUNT } from "./chapitres/l-emprunt";
import { IMMOBILISATIONS } from "./chapitres/immobilisations";
import { LES_STOCKS } from "./chapitres/les-stocks";
import { DECIDER_APRES_LA_CLOTURE, LA_CLOTURE } from "./chapitres/la-cloture";
import { REMISES_ET_REGLEMENTS } from "./chapitres/remises-et-reglements";
import { LES_LEVIERS_DU_SEUIL, SEUIL_DE_RENTABILITE } from "./chapitres/seuil-de-rentabilite";
import { COUT_COMPLET } from "./chapitres/cout-complet";
import { COUT_PAR_PRODUIT } from "./chapitres/cout-par-produit";
import { BUDGET_DE_TRESORERIE } from "./chapitres/budget-de-tresorerie";
import { LE_BUDGET_FLEXIBLE, LE_COUT_PREETABLI_ET_LES_BUDGETS } from "./chapitres/le-cout-preetabli-et-les-budgets";
import { LES_ECARTS_SUR_CHARGES_DIRECTES } from "./chapitres/les-ecarts-sur-charges-directes";
import { LES_ECARTS_SUR_CHARGES_INDIRECTES } from "./chapitres/les-ecarts-sur-charges-indirectes";
import { LES_ECARTS_SUR_VENTES_ET_MARGE } from "./chapitres/les-ecarts-sur-ventes-et-marge";
import { ANALYSE_DES_ECARTS, LES_ECARTS_ET_LEURS_RESPONSABLES } from "./chapitres/analyse-des-ecarts";
import { TABLEAU_DE_BORD } from "./chapitres/tableau-de-bord";
import { DECIDER } from "./chapitres/decider";
import { DEPRECIATIONS_ET_PROVISIONS, LE_DENOUEMENT_DES_RISQUES } from "./chapitres/depreciations-et-provisions";
import { REGULARISATIONS } from "./chapitres/regularisations";
import { SOLDES_INTERMEDIAIRES } from "./chapitres/soldes-intermediaires";
import { BILAN_FONCTIONNEL } from "./chapitres/bilan-fonctionnel";
import { LES_FLUX } from "./chapitres/les-flux";
import { CHARGES_ET_ENCAISSEMENTS } from "./chapitres/charges-et-encaissements";
import { PRIX_COUT_MARGE } from "./chapitres/prix-cout-marge";
import { S_ALIGNER_SUR_LE_CONCURRENT, TAUX_DE_MARQUE } from "./chapitres/taux-de-marque";
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
import { VALEUR_AJOUTEE } from "./chapitres/valeur-ajoutee-et-partage";
import { RENTABILITE } from "./chapitres/rentabilite";
import { FONDS_DE_ROULEMENT } from "./chapitres/fonds-de-roulement-et-tresorerie";
import { FINANCER_L_ENTREPRISE } from "./chapitres/financer-l-entreprise";
import { EFFECTIF_ET_MASSE_SALARIALE } from "./chapitres/effectif-et-masse-salariale";
import { SALAIRE_BRUT_NET_COUT } from "./chapitres/salaire-brut-net-cout";
import { RECRUTER } from "./chapitres/recruter";
import { REMUNERATION_ET_MOTIVATION } from "./chapitres/remuneration-et-motivation";
import { FORMER } from "./chapitres/former";
import { INDICATEURS_SOCIAUX } from "./chapitres/indicateurs-sociaux";
import { CHOISIR_SON_FOURNISSEUR } from "./chapitres/choisir-son-fournisseur";
import { LE_CLIENT_QUI_PAIE_TARD } from "./chapitres/le-client-qui-paie-tard";
import { S_ASSURER_CONTRE_LES_ALEAS } from "./chapitres/s-assurer-contre-les-aleas";
import { LE_COUT_DE_LA_NON_QUALITE } from "./chapitres/le-cout-de-la-non-qualite";
import { LE_DEPART_D_UN_SALARIE } from "./chapitres/le-depart-d-un-salarie";
import { ENTRETENIR_L_OUTIL } from "./chapitres/entretenir-l-outil";
import { LE_DIAGNOSTIC_STRATEGIQUE } from "./chapitres/le-diagnostic-strategique";
import { SE_FIXER_DES_OBJECTIFS } from "./chapitres/se-fixer-des-objectifs";
import { COUTS_OU_DIFFERENCIATION } from "./chapitres/couts-ou-differenciation";
import { LIRE_LA_STRATEGIE_DES_CONCURRENTS } from "./chapitres/lire-la-strategie-des-concurrents";
import { CROITRE_EN_INVESTISSANT } from "./chapitres/croitre-en-investissant";
import { CE_QUE_RAPPORTE_L_ENGAGEMENT, LA_RESPONSABILITE_SOCIETALE } from "./chapitres/la-responsabilite-societale";
import { LE_PROJET_D_ENTREPRISE } from "./chapitres/le-projet-d-entreprise";
import { ORGANISER_L_ACTIVITE } from "./chapitres/organiser-l-activite";
import { DECIDER_AVEC_DES_CHIFFRES } from "./chapitres/decider-avec-des-chiffres";
import { EVALUER_SON_ACTIVITE } from "./chapitres/evaluer-son-activite";
import { DES_DONNEES_A_L_INFORMATION } from "./chapitres/des-donnees-a-l-information";
import { CONSTRUIRE_UN_INDICATEUR_JUSTE } from "./chapitres/construire-un-indicateur-juste";
import { UNE_DONNEE_FAUSSE } from "./chapitres/une-donnee-fausse";
import { CE_QUE_COUTE_UN_OUTIL_NUMERIQUE } from "./chapitres/ce-que-coute-un-outil-numerique";
import { LE_COUT_MATIERE } from "./chapitres/le-cout-matiere";
import { OCCUPATION_ET_REVENU_PAR_CHAMBRE } from "./chapitres/occupation-et-revenu-par-chambre";
import { LA_PRODUCTIVITE_DU_SERVICE } from "./chapitres/la-productivite-du-service";
import { LE_PRIX_SELON_LA_SAISON } from "./chapitres/le-prix-selon-la-saison";
import { ENCAISSEMENTS_OU_DEBITS, LA_DECLARATION_DE_TVA } from "./chapitres/la-declaration-de-tva";
import { LA_TVA_ET_LA_TRESORERIE } from "./chapitres/la-tva-et-la-tresorerie";
import { L_IMPOT_SUR_LES_SOCIETES } from "./chapitres/l-impot-sur-les-societes";
import { LE_DEFICIT_REPORTE } from "./chapitres/le-deficit-reporte";
import { LE_STOCK_DE_SECURITE } from "./chapitres/le-stock-de-securite";
import { CE_QUE_COUTE_UNE_LIVRAISON } from "./chapitres/ce-que-coute-une-livraison";
import { LE_TAUX_DE_REMPLISSAGE } from "./chapitres/le-taux-de-remplissage";
import { LIVRER_A_TEMPS } from "./chapitres/livrer-a-temps";
import { LA_VALEUR_ACTUELLE_NETTE } from "./chapitres/la-valeur-actuelle-nette";
import { LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS } from "./chapitres/le-tri-et-le-choix-entre-deux-projets";
import { L_EFFET_DE_LEVIER } from "./chapitres/l-effet-de-levier";
import { LA_CREATION_DE_VALEUR } from "./chapitres/la-creation-de-valeur";
import { RECEVOIR_UNE_LIVRAISON } from "./chapitres/recevoir-une-livraison";
import { REMPLIR_LE_RAYON } from "./chapitres/remplir-le-rayon";
import { LE_PRIX_AFFICHE } from "./chapitres/le-prix-affiche";
import { TENIR_LA_CAISSE } from "./chapitres/tenir-la-caisse";
import { UNE_INFORMATION_A_TEMPS } from "./chapitres/une-information-a-temps";
import { LA_CONCURRENCE } from "./chapitres/la-concurrence";
import { CREER_DES_RICHESSES } from "./chapitres/creer-des-richesses";
import { LES_ACTEURS_ET_LA_VALEUR } from "./chapitres/les-acteurs-et-la-valeur";
import { DECIDER_ENSEMBLE } from "./chapitres/decider-ensemble";
import { L_OFFRE_ET_LA_DEMANDE } from "./chapitres/l-offre-et-la-demande";
import { LE_PRIX_D_EQUILIBRE } from "./chapitres/le-prix-d-equilibre";
import { LE_PANIER_MOYEN } from "./chapitres/le-panier-moyen";
import { SUIVRE_SES_VENTES } from "./chapitres/suivre-ses-ventes";
import { LE_CLIENT_QUI_REVIENT } from "./chapitres/le-client-qui-revient";
import { UN_NOUVEAU_CLIENT } from "./chapitres/un-nouveau-client";
import { PRODUIRE } from "./chapitres/produire";
import { PRODUIRE_BIEN } from "./chapitres/produire-bien";
import { LES_COMPOSANTS_ET_L_AMORTISSEMENT_DEROGATOIRE } from "./chapitres/les-composants-et-l-amortissement-derogatoire";
import { LE_TEST_DE_DEPRECIATION } from "./chapitres/le-test-de-depreciation";
import { LES_OPERATIONS_EN_DEVISES } from "./chapitres/les-operations-en-devises";
import { LES_CONTRATS_A_LONG_TERME } from "./chapitres/les-contrats-a-long-terme";
import { L_AUGMENTATION_DE_CAPITAL } from "./chapitres/l-augmentation-de-capital";
import type { Chapitre } from "./types";

/**
 * LE COURS PAR LA SIMULATION : SEPT PARCOURS, QUATRE PALIERS.
 *
 * Un palier n'est pas un niveau du jeu (les niveaux 1 à 7 de l'arène) : c'est une
 * marche du programme, du lycée au DCG. Un chapitre appartient à un parcours et à
 * un palier ; il se joue dans n'importe laquelle des entreprises du cours, ou dans
 * celles qu'il nomme.
 *
 * LE PARCOURS D'UNE FORMATION. Les deux premiers suivent la discipline ; les suivants
 * suivent une formation (le BTS MCO, le BTS NDRC, la mercatique, la gestion et finance et les ressources
 * humaines du bac STMG), et ne couvrent
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
      "La gestion opérationnelle d'une unité commerciale, puis l'animation de l'offre et le management de l'équipe : les calculs du magasin, sur les chiffres de la simulation du cours.",
    publics: { 2: "BTS MCO, 1re année", 3: "BTS MCO", 4: "BTS MCO, 2e année" },
  },
  {
    code: "ndrc",
    formation: "bts-ndrc",
    titre: "BTS NDRC · Négocier et développer la relation client",
    resume:
      "La négociation, la valeur d'un client et le pilotage de l'activité commerciale : ce qu'une affaire, un client, une campagne ou un canal rapporte, sur les chiffres de la simulation du cours.",
    publics: { 2: "BTS NDRC, 1re année", 3: "BTS NDRC", 4: "BTS NDRC, 2e année" },
  },
  {
    code: "stmg",
    formation: "stmg",
    titre: "Bac STMG · Mercatique",
    resume:
      "Le marché, les clients, le prix, la communication et la distribution : les questions du mercaticien, sur le marché de la simulation du cours, au niveau du lycée.",
    publics: { 1: "Terminale STMG, mercatique" },
  },
  {
    code: "stmg-gf",
    formation: "stmg",
    titre: "Bac STMG · Gestion et finance",
    resume:
      "Le compte de résultat, le bilan, la valeur créée, la rentabilité, la trésorerie et le financement : lire les comptes d'une entreprise, sur son année dans la simulation du cours, au niveau du lycée.",
    publics: { 1: "Terminale STMG, gestion et finance" },
  },
  {
    code: "stmg-rh",
    formation: "stmg",
    titre: "Bac STMG · Ressources humaines",
    resume:
      "L'effectif et ce qu'il coûte, la paie, le recrutement, la rémunération et la motivation, la formation et les indicateurs sociaux : les questions du gestionnaire des ressources humaines, sur l'équipe de NOVA dans la simulation du cours, au niveau du lycée.",
    publics: { 1: "Terminale STMG, ressources humaines et communication" },
  },
  {
    code: "gpme",
    formation: "bts-gpme",
    titre: "BTS GPME · Gérer la PME",
    resume:
      "Les fournisseurs et les clients, les risques, le personnel et l'outil : les décisions de gestion d'une PME, chiffrées dans la simulation du cours.",
    publics: { 2: "BTS GPME, 1re année", 3: "BTS GPME, 2e année" },
  },
  {
    code: "strategie",
    titre: "Stratégie et management",
    resume:
      "Le diagnostic, les objectifs, les choix face aux concurrents, la croissance et la responsabilité sociétale : les décisions de direction, chiffrées dans la simulation du cours.",
  },
  {
    code: "seconde-mg",
    formation: "seconde-mg",
    titre: "Seconde · Management et gestion",
    resume:
      "Entreprendre, organiser et décider, évaluer : une première entreprise, de l'idée aux premiers chiffres, dans la simulation du cours, au niveau de la découverte.",
    publics: { 1: "Seconde, option management et gestion" },
  },
  {
    code: "stmg-sig",
    formation: "stmg",
    titre: "Bac STMG · Systèmes d'information de gestion",
    resume:
      "Des données à la décision : trier et calculer, construire un indicateur juste, se méfier d'une donnée fausse, chiffrer un outil numérique, sur les chiffres de NOVA.",
    publics: { 1: "Terminale STMG, systèmes d'information de gestion" },
  },
  {
    code: "mhr",
    formation: "bts-mhr",
    titre: "BTS MHR · Gérer un restaurant et un hôtel",
    resume:
      "Le coût matière et le prix d'un plat, le taux d'occupation et le revenu par chambre, la productivité du service, le prix selon la saison : les calculs du restaurant et de l'hôtel de la simulation du cours.",
    publics: { 2: "BTS MHR, 1re année", 3: "BTS MHR, 2e année" },
  },
  {
    code: "fiscalite",
    titre: "Fiscalité de l'entreprise",
    resume:
      "La TVA collectée, déductible et à payer, ce qu'elle fait à la trésorerie, l'impôt sur les sociétés et le déficit reporté : ce que l'entreprise calcule et déclare, trimestre après trimestre, dans la simulation du cours.",
  },
  {
    code: "logistique",
    formation: "seconde-pro-gatl",
    titre: "2de pro GATL · Le transport et la logistique",
    resume:
      "Le stock de sécurité et le point de commande, ce que coûte une livraison, le remplissage des véhicules, les délais tenus : les flux physiques de la simulation du cours, chiffrés.",
    publics: { 1: "Seconde professionnelle, gestion administrative, transport et logistique" },
  },
  {
    code: "dscg-finance",
    formation: "dscg",
    titre: "DSCG · Finance",
    resume:
      "Actualiser les flux d'un investissement, choisir entre deux projets, lire l'effet de levier de la dette, mesurer la valeur créée : la finance d'entreprise sur les investissements et les comptes de la simulation du cours.",
    publics: { 4: "DSCG, UE2 Finance" },
  },
  {
    code: "cap-epc",
    formation: "cap-epc",
    titre: "CAP EPC · Équipier polyvalent du commerce",
    resume:
      "Recevoir une livraison et la contrôler, remplir le rayon avant la rupture, afficher le bon prix, tenir la caisse : les gestes du magasin, comptés sur la boutique du cours.",
    publics: { 1: "CAP Équipier polyvalent du commerce" },
  },
  {
    code: "vente",
    formation: "bac-pro-mcv",
    titre: "Bac pro MCV · Vendre et suivre ses ventes",
    resume:
      "Le panier moyen et la marge d'une vente, l'objectif et le réalisé, le client qui revient ou qui part, ce que rapporte un nouveau client : la vente au comptoir de la boutique du cours, chiffrée.",
    publics: { 1: "Seconde professionnelle relation client, première bac pro MCV", 2: "Terminale bac pro MCV" },
  },
  {
    code: "seconde-ses",
    formation: "seconde-ses",
    titre: "Seconde SES · Le marché et les prix",
    resume:
      "L'offre et la demande, le prix qui vide le stock ou qui laisse partir les clients, la concurrence entre vendeurs, la richesse créée : le marché de la simulation du cours, lu au prix qu'on choisit.",
    publics: { 1: "Seconde générale et technologique, sciences économiques et sociales" },
  },
  {
    code: "stmg-management",
    formation: "stmg",
    titre: "Bac STMG · Management",
    resume:
      "Produire avec une capacité et une équipe, produire bien, partager la valeur créée, décider ensemble et sur une information à jour : l'organisation d'une entreprise, lue dans les comptes de la simulation du cours.",
    publics: { 1: "Première et terminale STMG, management" },
  },
  {
    code: "dcg-comptabilite-approfondie",
    formation: "dcg",
    titre: "DCG · Comptabilité approfondie",
    resume:
      "Les composants et l'amortissement dérogatoire, le test de dépréciation d'un actif, les opérations en devises, les contrats à long terme, l'augmentation de capital : la comptabilité approfondie sur l'année N + 1 de NOVA dans la simulation du cours.",
    publics: { 4: "DCG, UE10 Comptabilité approfondie" },
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
    2: ["La partie double, la TVA et le premier bilan", "Du résultat à la trésorerie : les échéances"],
    3: ["Remises et règlements", "La paie", "L'emprunt et ses intérêts", "Immobilisations et amortissements", "Les stocks", "La clôture"],
    4: ["Dépréciations et provisions", "Régularisations de fin d'exercice", "Soldes intermédiaires de gestion et CAF", "Bilan fonctionnel et BFR"],
  },
  "controle-de-gestion": {
    1: ["Prix, coût et marge"],
    2: ["Charges variables et charges fixes", "Marge sur coût variable", "Seuil de rentabilité"],
    3: ["Coût complet et centres d'analyse", "Coût par produit"],
    4: [
      "Budgets",
      "Le coût préétabli, le budget standard et le budget flexible",
      "Les écarts sur charges directes : matière et main-d'œuvre",
      "Les écarts sur charges indirectes : budget, activité, rendement",
      "Les écarts sur chiffre d'affaires et sur marge : prix, volume, composition",
      "Analyse des écarts : du résultat prévu au résultat réel",
      "Tableau de bord",
      "Décider : prix, fabriquer ou acheter",
    ],
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
  "stmg-rh": {
    1: [
      "L'effectif et la masse salariale",
      "Du salaire brut au coût pour l'entreprise",
      "Recruter : ce que coûte une embauche, ce qu'elle apporte",
      "Rémunération et motivation",
      "Former pour être plus efficace",
      "Les indicateurs sociaux",
    ],
  },
  gpme: {
    2: ["Choisir son fournisseur : prix, qualité et délai de paiement", "Le client qui paie tard : délai, escompte et affacturage"],
    3: [
      "S'assurer contre les aléas : la prime et les sinistres",
      "Le coût de la non-qualité",
      "Le départ d'un salarié et son remplacement",
      "Entretenir l'outil : maintenance et disponibilité",
    ],
  },
  strategie: {
    1: ["Le diagnostic stratégique : forces, faiblesses, opportunités, menaces", "Se fixer des objectifs et les suivre"],
    2: ["Domination par les coûts ou différenciation", "Lire la stratégie de ses concurrents"],
    3: ["Croître en investissant : capacité, financement, rentabilité"],
    4: ["La responsabilité sociétale : ce qu'elle coûte, ce qu'elle rapporte"],
  },
  "seconde-mg": {
    1: [
      "Le projet d'entreprise : de l'idée aux moyens de démarrer",
      "Organiser l'activité : capacité, équipe et délais",
      "Décider avec des chiffres : comparer deux choix",
      "Évaluer son activité : quelques indicateurs pour piloter",
    ],
  },
  "stmg-sig": {
    1: [
      "Des données à l'information : trier, regrouper, calculer",
      "Construire un indicateur juste",
      "Une donnée fausse, une décision fausse",
      "Ce que coûte et rapporte un outil numérique",
    ],
  },
  mhr: {
    2: ["Le coût matière et le prix d'un plat", "Le taux d'occupation, le prix moyen et le revenu par chambre"],
    3: ["La productivité du service : couverts et chambres par salarié", "Remplir l'hôtel : le prix selon la saison"],
  },
  fiscalite: {
    3: [
      "La déclaration de TVA : collectée, déductible, à payer",
      "La TVA et la trésorerie : qui fait crédit à qui",
      "L'impôt sur les sociétés : du résultat à l'impôt",
      "Le déficit reporté : quand l'impôt attend",
    ],
  },
  logistique: {
    1: [
      "Le stock de sécurité et le point de commande",
      "Ce que coûte une livraison",
      "Le taux de remplissage des véhicules",
      "Livrer à temps : les délais et le service",
    ],
  },
  "dscg-finance": {
    4: [
      "La valeur actuelle nette d'un investissement",
      "Le taux de rentabilité interne et le choix entre deux projets",
      "L'effet de levier : la dette et la rentabilité des capitaux propres",
      "La création de valeur : rentabilité économique et coût du capital",
    ],
  },
  "cap-epc": {
    1: [
      "Recevoir une livraison : le bon de livraison et la commande",
      "Remplir le rayon avant la rupture",
      "Le prix affiché : hors taxes, toutes taxes et la promotion",
      "Tenir la caisse : le ticket, la monnaie et le fond de caisse",
    ],
  },
  vente: {
    1: [
      "Le panier moyen et la marge d'une vente",
      "Suivre ses ventes : l'objectif, le réalisé, l'écart",
    ],
    2: [
      "Le client qui revient et le client qui part",
      "Ce que rapporte un nouveau client",
    ],
  },
  "seconde-ses": {
    1: [
      "L'offre et la demande sur un marché",
      "Le prix qui équilibre le marché",
      "La concurrence : plusieurs vendeurs pour les mêmes clients",
      "Créer des richesses et les mesurer",
    ],
  },
  "stmg-management": {
    1: [
      "Produire : capacité, équipe et productivité",
      "Produire bien : la qualité et ce qu'elle coûte",
      "Les acteurs de l'organisation et le partage de la valeur",
      "Décider ensemble : chacun son écran, une seule décision",
      "Une information qui circule à temps",
    ],
  },
  "dcg-comptabilite-approfondie": {
    4: [
      "L'approche par composants et l'amortissement dérogatoire",
      "Le test de dépréciation d'une immobilisation",
      "Les opérations en devises : écarts de conversion et perte de change",
      "Les contrats à long terme : le résultat à l'avancement",
      "L'augmentation de capital : prime d'émission et droit de souscription",
    ],
  },
};

/** Les paliers que la carte montre pour un parcours, dans l'ordre. */
export const paliersDuParcours = (code: CodeParcours) => PALIERS.filter((pa) => PROGRAMME[code][pa.palier] !== undefined);

export const CHAPITRES: readonly Chapitre[] = [CREATION_PREMIER_BILAN, DU_RESULTAT_A_LA_TRESORERIE, LES_FLUX, CHARGES_ET_ENCAISSEMENTS, LA_PAIE, L_EMPRUNT, IMMOBILISATIONS, LES_STOCKS, LA_CLOTURE, DECIDER_APRES_LA_CLOTURE, REMISES_ET_REGLEMENTS, DEPRECIATIONS_ET_PROVISIONS, LE_DENOUEMENT_DES_RISQUES, REGULARISATIONS, SOLDES_INTERMEDIAIRES, BILAN_FONCTIONNEL, PRIX_COUT_MARGE, SEUIL_DE_RENTABILITE, LES_LEVIERS_DU_SEUIL, COUT_COMPLET, COUT_PAR_PRODUIT, BUDGET_DE_TRESORERIE, LE_COUT_PREETABLI_ET_LES_BUDGETS, LE_BUDGET_FLEXIBLE, LES_ECARTS_SUR_CHARGES_DIRECTES, LES_ECARTS_SUR_CHARGES_INDIRECTES, LES_ECARTS_SUR_VENTES_ET_MARGE, ANALYSE_DES_ECARTS, LES_ECARTS_ET_LEURS_RESPONSABLES, TABLEAU_DE_BORD, DECIDER, TAUX_DE_MARQUE, S_ALIGNER_SUR_LE_CONCURRENT, INDICATEURS_DU_POINT_DE_VENTE, STOCK_DU_POINT_DE_VENTE, PREVOIR_LES_VENTES, BUDGET_DU_POINT_DE_VENTE, SEUIL_DU_POINT_DE_VENTE, PROMOTION_QUI_PAIE, ASSORTIMENT, EQUIPE_ET_PLANNING, TABLEAU_DE_BORD_DU_MANAGER, NEGOCIER_LE_PRIX, REMISES_ET_CONDITIONS, VALEUR_D_UN_CLIENT, COUT_D_ACQUISITION, COMMISSIONS_DES_PARTENAIRES, PORTEFEUILLE_ABC, TABLEAU_DE_BORD_COMMERCIAL, MARCHE_ET_PART_DE_MARCHE, SEGMENTER_ET_CIBLER, PRIX_PSYCHOLOGIQUE, DEMANDE_ET_PRIX, COMMUNICATION, CANAUX_DE_DISTRIBUTION, LIRE_LE_COMPTE_DE_RESULTAT, LIRE_LE_BILAN, VALEUR_AJOUTEE, RENTABILITE, FONDS_DE_ROULEMENT, FINANCER_L_ENTREPRISE, EFFECTIF_ET_MASSE_SALARIALE, SALAIRE_BRUT_NET_COUT, RECRUTER, REMUNERATION_ET_MOTIVATION, FORMER, INDICATEURS_SOCIAUX, CHOISIR_SON_FOURNISSEUR, LE_CLIENT_QUI_PAIE_TARD, S_ASSURER_CONTRE_LES_ALEAS, LE_COUT_DE_LA_NON_QUALITE, LE_DEPART_D_UN_SALARIE, ENTRETENIR_L_OUTIL, LE_DIAGNOSTIC_STRATEGIQUE, SE_FIXER_DES_OBJECTIFS, COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS, CROITRE_EN_INVESTISSANT, LA_RESPONSABILITE_SOCIETALE, CE_QUE_RAPPORTE_L_ENGAGEMENT, LE_PROJET_D_ENTREPRISE, ORGANISER_L_ACTIVITE, DECIDER_AVEC_DES_CHIFFRES, EVALUER_SON_ACTIVITE, DES_DONNEES_A_L_INFORMATION, CONSTRUIRE_UN_INDICATEUR_JUSTE, UNE_DONNEE_FAUSSE, CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, LE_COUT_MATIERE, OCCUPATION_ET_REVENU_PAR_CHAMBRE, LA_PRODUCTIVITE_DU_SERVICE, LE_PRIX_SELON_LA_SAISON, LA_DECLARATION_DE_TVA, ENCAISSEMENTS_OU_DEBITS, LA_TVA_ET_LA_TRESORERIE, L_IMPOT_SUR_LES_SOCIETES, LE_DEFICIT_REPORTE, LE_STOCK_DE_SECURITE, CE_QUE_COUTE_UNE_LIVRAISON, LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS, LA_VALEUR_ACTUELLE_NETTE, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, L_EFFET_DE_LEVIER, LA_CREATION_DE_VALEUR, RECEVOIR_UNE_LIVRAISON, REMPLIR_LE_RAYON, LE_PRIX_AFFICHE, TENIR_LA_CAISSE, LE_PANIER_MOYEN, SUIVRE_SES_VENTES, LE_CLIENT_QUI_REVIENT, UN_NOUVEAU_CLIENT, L_OFFRE_ET_LA_DEMANDE, LE_PRIX_D_EQUILIBRE, LA_CONCURRENCE, CREER_DES_RICHESSES, PRODUIRE, PRODUIRE_BIEN, LES_ACTEURS_ET_LA_VALEUR, DECIDER_ENSEMBLE, UNE_INFORMATION_A_TEMPS, LES_COMPOSANTS_ET_L_AMORTISSEMENT_DEROGATOIRE, LE_TEST_DE_DEPRECIATION, LES_OPERATIONS_EN_DEVISES, LES_CONTRATS_A_LONG_TERME, L_AUGMENTATION_DE_CAPITAL];

/**
 * Un chapitre, ou un cas pratique, par son code : la page d'un chapitre et la
 * progression d'une classe ouvrent l'un comme l'autre (config/cours/situations).
 */
export const chapitreParCode = (code: string): Chapitre | undefined =>
  CHAPITRES.find((c) => c.code === code) ?? situationParCode(code);
