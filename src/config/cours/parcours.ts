import type { Chapitre } from "./types";

/**
 * LES PARCOURS DU COURS, SANS LEURS CHAPITRES (le registre : ./registre.ts, qui les réexporte).
 *
 * La liste vit à part du registre pour qui ne lit que les noms : le devis (le diplôme ou le parcours,
 * audit produit du 10 novembre 2026, P1-4) et l'administration n'ont pas à charger tous les chapitres
 * pour écrire « Bac STMG · Gestion et finance ». La règle des parcours : ./registre.ts.
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
    // lot E STMG : le parcours couvre désormais les trois thèmes de l'enseignement spécifique, dans plusieurs entreprises du cours.
    resume:
      "Les questions du gestionnaire des ressources humaines, dans les entreprises de la simulation du cours, au niveau du lycée. L'effectif et son coût, le recrutement, l'évaluation, les compétences ; la qualité de vie, la santé au travail, la rémunération ; le climat social, le dialogue social et la communication interne.",
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
    // lot F STMG : le parcours couvre désormais les quatre thèmes de l'enseignement spécifique, dans plusieurs entreprises du cours.
    resume:
      "Le système d'information des entreprises de la simulation du cours, au niveau du lycée. Ses fonctions et sa sécurité ; sa gestion, son budget et ses projets ; les bases de données, SQL et les algorithmes ; les documents structurés, les réseaux et le nuage.",
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
      "Organiser l'action collective, manager, répondre aux changements, produire, partager la valeur, décider ensemble, puis les choix stratégiques d'une entreprise, d'une organisation publique et d'une association : le management des organisations, lu dans la simulation du cours.",
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
