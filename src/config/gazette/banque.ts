import type { Sector } from "@/config/scenarios/registry";
import type { SensDuSujet, SujetDeLaGazette } from "./types";

/**
 * LA BANQUE DE GABARITS DE LA GAZETTE.
 *
 * Trois étages, du plus général au plus précis :
 *
 *   1. LE LEXIQUE DU SECTEUR. Les neuf entreprises n'ont pas le même marché :
 *      un hôtelier ne lit pas « les composants », un transporteur ne parle pas
 *      de « couverts ». Chaque secteur dit comment le journal nomme la
 *      profession, son marché, ses achats, son outil de travail et ses sources.
 *
 *   2. LES MOTIFS PAR ÉVÉNEMENT. Chaque événement de marché du moteur reçoit un
 *      groupe nominal de presse (« la hausse de l'indice gazole ») et, au
 *      besoin, sa rubrique. C'est ce qui fait d'un article un fait divers
 *      économique et non un gabarit.
 *
 *   3. LES GABARITS PAR SUJET ET PAR SENS. Des titres et des tournures, assez
 *      nombreux pour qu'une partie de six tours ne lise jamais deux fois le
 *      même titre (garde : `gazette.test.ts`).
 *
 * RÈGLES D'ÉCRITURE, gardées sur toute la banque : pas de tiret en milieu de
 * phrase, casse de phrase dans les titres, aucun chiffre (les ordres de
 * grandeur se calculent, ils ne s'écrivent pas à la main), aucune marque réelle,
 * aucun mot du jeu (tour, joueur, carte, moteur).
 */

export interface LexiqueDuSecteur {
  /** La profession, avec son article : « les fabricants d'enceintes ». Pluriel. */
  profession: string;
  /** Le domaine d'activité, avec son article : « l'hôtellerie ». */
  domaine: string;
  /** Le marché, avec son article : « le marché des nuitées ». */
  marche: string;
  /** Les clients, avec leur article : « les voyageurs ». Pluriel. */
  clients: string;
  /** Ce que la profession achète, avec article, au pluriel d'accord : « les denrées ». */
  intrants: string;
  /** Le même, sans article, pour un titre : « Denrées ». */
  intrantsTitre: string;
  /** Le prix de ce qu'elle achète, au génitif : « des prix des denrées ». */
  prixDesIntrants: string;
  /** L'outil de travail, avec article, au pluriel : « les brigades ». */
  outil: string;
  /** Qui parle au journal : une fédération, un observatoire… Au SINGULIER (le verbe s'accorde), avec article. */
  sources: readonly string[];
  /** La rubrique des coûts d'achat dans ce métier. */
  rubriqueDesCouts: string;
}

export const LEXIQUES: Record<Sector, LexiqueDuSecteur> = {
  industrie: {
    profession: "les fabricants d'enceintes",
    domaine: "l'électronique grand public",
    marche: "le marché des enceintes nomades",
    clients: "les acheteurs",
    intrants: "les composants",
    intrantsTitre: "Composants",
    prixDesIntrants: "des prix des composants",
    outil: "les ateliers d'assemblage",
    sources: [
      "la fédération de l'électronique grand public",
      "le syndicat des distributeurs spécialisés",
      "la centrale d'achat d'une grande enseigne",
    ],
    rubriqueDesCouts: "Matières premières",
  },
  commerce: {
    profession: "les boutiques de prêt-à-porter",
    domaine: "le commerce de centre-ville",
    marche: "le marché de la maille",
    clients: "les clientes",
    intrants: "les tarifs des façonniers",
    intrantsTitre: "Façonniers",
    prixDesIntrants: "des tarifs des façonniers",
    outil: "les ateliers et les livraisons",
    sources: [
      "la fédération de l'habillement",
      "l'union des commerçants du centre-ville",
      "le syndicat des grossistes du textile",
    ],
    rubriqueDesCouts: "Approvisionnement",
  },
  hotellerie: {
    profession: "les hôteliers",
    domaine: "l'hôtellerie",
    marche: "le marché des nuitées",
    clients: "les voyageurs",
    intrants: "l'énergie et le linge",
    intrantsTitre: "Énergie et linge",
    prixDesIntrants: "de la facture d'énergie et de linge",
    outil: "les équipes d'étage",
    sources: [
      "l'union des métiers de l'hôtellerie",
      "l'office de tourisme",
      "l'observatoire régional du tourisme",
    ],
    rubriqueDesCouts: "Énergie",
  },
  restauration: {
    profession: "les restaurateurs",
    domaine: "la restauration",
    marche: "le marché de la table",
    clients: "les convives",
    intrants: "les denrées",
    intrantsTitre: "Denrées",
    prixDesIntrants: "des prix des denrées",
    outil: "les brigades",
    sources: [
      "la fédération des restaurateurs",
      "le marché de gros régional",
      "l'observatoire de la restauration",
    ],
    rubriqueDesCouts: "Matières premières",
  },
  services: {
    profession: "les cabinets de conseil",
    domaine: "le conseil aux entreprises",
    marche: "le marché des missions de conseil",
    clients: "les donneurs d'ordres",
    intrants: "les frais de mission",
    intrantsTitre: "Frais de mission",
    prixDesIntrants: "des frais de mission",
    outil: "les équipes de consultants",
    sources: [
      "la chambre syndicale du conseil",
      "l'observatoire des achats de prestations",
      "le club régional des directeurs achats",
    ],
    rubriqueDesCouts: "Coûts",
  },
  ecommerce: {
    profession: "les boutiques en ligne",
    domaine: "le commerce en ligne",
    marche: "le marché de la vente en ligne",
    clients: "les internautes",
    intrants: "les frais d'expédition et d'achat",
    intrantsTitre: "Expédition et achats",
    prixDesIntrants: "des frais d'expédition et d'achat",
    outil: "les entrepôts et les transporteurs",
    sources: [
      "la fédération du commerce en ligne",
      "l'observatoire de la logistique",
      "le baromètre des régies publicitaires",
    ],
    rubriqueDesCouts: "Logistique",
  },
  abonnement: {
    profession: "les salles de sport",
    domaine: "le fitness",
    marche: "le marché de la remise en forme",
    clients: "les pratiquants",
    intrants: "l'énergie et les consommables",
    intrantsTitre: "Énergie et consommables",
    prixDesIntrants: "de la facture d'énergie et de consommables",
    outil: "les salles",
    sources: [
      "la fédération des clubs de remise en forme",
      "l'observatoire du sport en salle",
      "la mutuelle régionale",
    ],
    rubriqueDesCouts: "Énergie",
  },
  batiment: {
    profession: "les entreprises du bâtiment",
    domaine: "le bâtiment",
    marche: "le marché de la rénovation",
    clients: "les maîtres d'ouvrage",
    intrants: "les matériaux",
    intrantsTitre: "Matériaux",
    prixDesIntrants: "des prix des matériaux",
    outil: "les chantiers",
    sources: [
      "la fédération du bâtiment",
      "la chambre des négociants en matériaux",
      "l'observatoire de la rénovation",
    ],
    rubriqueDesCouts: "Matériaux",
  },
  transport: {
    profession: "les transporteurs routiers",
    domaine: "le transport de marchandises",
    marche: "le marché du fret régional",
    clients: "les chargeurs",
    intrants: "le gazole et les péages",
    intrantsTitre: "Gazole et péages",
    prixDesIntrants: "du coût du gazole et des péages",
    outil: "les flottes de camions",
    sources: [
      "la fédération des transporteurs",
      "l'observatoire régional du fret",
      "la bourse de fret régionale",
    ],
    rubriqueDesCouts: "Carburant",
  },
};

/**
 * LES CLIENTÈLES, au génitif (« la demande des étudiants »). La clé porte le
 * secteur, parce que deux métiers emploient le même code pour des clientèles
 * différentes (« entreprises » : des comités d'entreprise en boutique, des
 * contrats d'entreprise en salle de sport).
 */
export const CLIENTELES: Record<string, string> = {
  "industrie:etudiants": "des étudiants",
  "industrie:passionnes": "des passionnés de son",
  "industrie:campustech": "des chaînes de magasins spécialisées",
  "industrie:lyceens": "des lycéens et des acheteurs de cadeaux",
  "industrie:gms": "de la grande distribution",
  "industrie:audiophiles": "des audiophiles",
  "industrie:studios": "des studios et des podcasteurs",
  "commerce:pull_fideles": "de la clientèle fidèle",
  "commerce:cardigan_fideles": "de la clientèle fidèle",
  "commerce:merinos_fideles": "de la clientèle fidèle",
  "commerce:fideles": "de la clientèle fidèle",
  "commerce:pull_passage": "des passants",
  "commerce:cardigan_passage": "des passants",
  "commerce:echarpe_passage": "des passants",
  "commerce:bonnet_passage": "des passants",
  "commerce:chalands": "des passants",
  "commerce:pull_ce": "des comités d'entreprise",
  "commerce:echarpe_ce": "des comités d'entreprise",
  "commerce:bonnet_ce": "des comités d'entreprise",
  "commerce:entreprises": "des comités d'entreprise",
  "commerce:merinos_affaires": "des acheteurs de cadeaux d'affaires",
  "hotellerie:affaires": "de la clientèle d'affaires",
  "hotellerie:loisirs": "des touristes",
  "hotellerie:groupes": "des groupes et des séminaires",
  "hotellerie:escapades": "des couples en escapade",
  "hotellerie:direction": "des invités d'entreprise",
  "hotellerie:occasions": "des clients des grandes occasions",
  "restauration:midi_affaires": "des déjeuners d'affaires",
  "restauration:soir_locaux": "de la clientèle du soir",
  "restauration:groupes": "des banquets et des repas d'entreprise",
  "restauration:midi_habitues": "des habitués du quartier",
  "restauration:soir_gourmets": "des gourmets",
  "restauration:associations": "des associations et des fêtes de famille",
  "restauration:entreprises_traiteur": "des entreprises du quartier",
  "restauration:collectivites_traiteur": "des collectivités",
  "services:grands_comptes": "des grands comptes",
  "services:pme": "des PME régionales",
  "services:public": "du secteur public",
  "services:eti": "des entreprises de taille intermédiaire",
  "services:dsi": "des directions informatiques",
  "services:collectivites_num": "des collectivités",
  "ecommerce:acquisition": "des nouveaux clients",
  "ecommerce:deco_trafic": "des nouveaux clients",
  "ecommerce:mobilier_trafic": "des nouveaux clients",
  "ecommerce:luminaires_trafic": "des nouveaux clients",
  "ecommerce:capsule_trafic": "des nouveaux clients venus des réseaux",
  "ecommerce:fideles": "des clients réguliers",
  "ecommerce:deco_fideles": "des clients réguliers",
  "ecommerce:mobilier_fideles": "des clients réguliers",
  "ecommerce:luminaires_fideles": "des clients réguliers",
  "ecommerce:capsule_fideles": "des clients en quête d'exclusivité",
  "ecommerce:marketplace": "des places de marché",
  "ecommerce:deco_marketplace": "des places de marché",
  "ecommerce:mobilier_marketplace": "des places de marché",
  "ecommerce:luminaires_marketplace": "des places de marché",
  "abonnement:resolutions": "des adeptes des bonnes résolutions",
  "abonnement:reguliers": "des pratiquants réguliers",
  "abonnement:entreprises": "des entreprises clientes",
  "batiment:particuliers": "des particuliers",
  "batiment:syndics": "des syndics de copropriété",
  "batiment:marches_publics": "des marchés publics",
  "transport:industriels": "des industriels",
  "transport:distribution": "de la grande distribution",
  "transport:affretement": "de la bourse de fret",
};

/**
 * LES MOTIFS PAR ÉVÉNEMENT : ce que le journal raconte, en un groupe nominal
 * avec son article. La rubrique n'est écrite que là où celle du sujet ne
 * convient pas (une réglementation, une aide publique, la météo).
 */
export interface MotifDeLEvenement {
  motif: string;
  rubrique?: string;
}

export const MOTIFS: Record<string, MotifDeLEvenement> = {
  // ── NOVA, enceintes nomades ──
  raw_material_spike: { motif: "la flambée des cours du cuivre et des terres rares" },
  viral_campaign: { motif: "l'engouement des réseaux sociaux pour les enceintes nomades" },
  competitor_bankruptcy: { motif: "la liquidation d'un fabricant historique du secteur" },
  economic_downturn: { motif: "le recul de la consommation des ménages" },
  student_fair: { motif: "le grand salon consacré aux étudiants" },
  premium_trend: { motif: "le retour en grâce du son haute fidélité" },
  rate_hike: { motif: "le relèvement des taux directeurs" },
  rate_cut: { motif: "la baisse des taux directeurs" },
  supplier_discount: { motif: "le déstockage de fins de série chez les fournisseurs" },
  cold_wave: { motif: "un épisode de grand froid qui perturbe les livraisons", rubrique: "Météo" },
  export_market: { motif: "l'ouverture de réseaux de distribution européens", rubrique: "Export" },
  natural_disaster: { motif: "les dégâts d'une catastrophe naturelle dans la région", rubrique: "Météo" },
  nova_price_war: { motif: "une guerre des prix lancée par un concurrent" },
  nova_counterfeit: { motif: "l'afflux de contrefaçons sur les places de marché" },
  nova_campus_tender: { motif: "un appel d'offres des chaînes de magasins pour leur rayon audio" },
  // ── MAILLE & CO, boutique de maille ──
  boutique_travaux_voirie: { motif: "les travaux de voirie qui bloquent le centre-ville" },
  boutique_influenceur: { motif: "le passage d'une créatrice suivie sur les réseaux" },
  boutique_ecommerce: { motif: "l'arrivée d'une plateforme de livraison rapide" },
  boutique_coton: { motif: "la hausse des cours de la laine et du coton" },
  boutique_credit_resserre: { motif: "le durcissement du crédit au petit commerce" },
  boutique_pretexte_fete: { motif: "des achats de cadeaux plus précoces que d'habitude" },
  boutique_rue_pietonne: { motif: "la mise en service d'une zone piétonne", rubrique: "Commerce" },
  boutique_fast_fashion: { motif: "l'ouverture d'une enseigne de mode à petit prix" },
  boutique_soldes_concurrent: { motif: "des ventes privées anticipées chez les concurrents" },
  boutique_marche_noel: { motif: "l'installation d'un marché artisanal en centre-ville" },
  // ── L'ESCALE, hôtellerie ──
  hotel_evenement_local: { motif: "un salon professionnel au parc des expositions" },
  hotel_commission_ota: { motif: "la hausse des commissions des plateformes de réservation" },
  hotel_greve_transports: { motif: "un mouvement social dans les transports", rubrique: "Social" },
  hotel_meteo_radieuse: { motif: "un beau temps durable qui prolonge les séjours" },
  hotel_energie: { motif: "le renouvellement des contrats d'énergie à prix fort" },
  hotel_credit_resserre: { motif: "le durcissement du crédit au secteur hôtelier" },
  hotel_festival: { motif: "la première édition d'un festival de musique", rubrique: "Tourisme" },
  hotel_nouvel_hotel: { motif: "l'ouverture d'un hôtel de chaîne en centre-ville" },
  hotel_locations_particuliers: { motif: "la progression des meublés de tourisme" },
  hotel_congres: { motif: "un congrès qui réserve des chambres en nombre", rubrique: "Tourisme" },
  // ── LA TABLE D'AUGUSTIN, restauration ──
  bistrot_avis_viral: { motif: "l'engouement des réseaux pour les tables du quartier" },
  bistrot_bureaux_vides: { motif: "le passage au télétravail de plusieurs entreprises du quartier" },
  bistrot_commission_livraison: { motif: "la hausse des commissions des plateformes de livraison" },
  bistrot_matieres_premieres: { motif: "la hausse des prix du beurre, de la crème et de la viande" },
  bistrot_terrasse: { motif: "l'autorisation exceptionnelle d'agrandir les terrasses" },
  bistrot_credit_resserre: { motif: "le durcissement des découverts accordés aux restaurateurs" },
  bistrot_festival_ville: { motif: "la fête de la ville et son parcours dans les rues commerçantes" },
  bistrot_food_truck: { motif: "l'arrivée de commerces ambulants sur la place" },
  bistrot_concurrent_etoile: { motif: "la distinction attribuée à une table voisine" },
  bistrot_marche_hebdo: { motif: "le transfert du marché hebdomadaire dans les rues commerçantes" },
  // ── ATLAS CONSEIL, conseil aux entreprises ──
  conseil_appel_offres_gagne: { motif: "une vague d'appels d'offres publics", rubrique: "Marchés publics" },
  conseil_gel_budgets: { motif: "le gel des budgets de conseil chez les donneurs d'ordres" },
  conseil_recommandation: { motif: "un bouche-à-oreille favorable auprès des grands comptes" },
  conseil_frais_mission: { motif: "la revalorisation des tarifs de transport et d'hébergement" },
  conseil_reglementation: {
    motif: "un nouveau décret qui impose un audit aux grandes entreprises",
    rubrique: "Réglementation",
  },
  conseil_credit_resserre: { motif: "le resserrement des lignes de trésorerie" },
  conseil_cabinet_parisien: { motif: "l'implantation d'un cabinet national sur le territoire" },
  conseil_salon_professionnel: { motif: "le salon professionnel de l'accompagnement des entreprises" },
  conseil_plateforme_freelance: { motif: "l'essor des plateformes de consultants indépendants" },
  conseil_grand_cabinet_public: { motif: "la percée d'un grand cabinet sur les marchés publics" },
  conseil_plan_relance: {
    motif: "un dispositif public de cofinancement des missions de conseil",
    rubrique: "Aides publiques",
  },
  // ── PIXEL & CO, commerce en ligne ──
  ecom_algo_publicitaire: { motif: "la refonte des enchères publicitaires des grandes régies" },
  ecom_transporteur: {
    motif: "un mouvement social qui bloque les dépôts des transporteurs",
    rubrique: "Logistique",
  },
  ecom_influenceur: { motif: "une vidéo de déballage devenue virale" },
  ecom_marketplace_commission: { motif: "la hausse des commissions des places de marché" },
  ecom_frais_port: { motif: "les surcharges de saison des transporteurs" },
  ecom_credit_resserre: { motif: "la frilosité des banques envers les entreprises sans actifs" },
  ecom_black_friday: { motif: "la grande opération commerciale du secteur" },
  ecom_geant_promo: { motif: "les journées promotionnelles des géants de la vente en ligne" },
  ecom_livraison_gratuite: { motif: "le passage d'un concurrent à la livraison gratuite" },
  ecom_taxe_colis: { motif: "l'entrée en vigueur de droits sur les colis importés", rubrique: "Réglementation" },
  // ── VOLT FITNESS, remise en forme ──
  fitness_rentree_sportive: { motif: "l'afflux des bonnes résolutions" },
  fitness_low_cost: { motif: "l'ouverture d'un club à bas prix sans personnel" },
  fitness_coach_star: { motif: "la notoriété grandissante de coachs locaux sur les réseaux" },
  fitness_energie: { motif: "la régularisation des contrats d'énergie" },
  fitness_teletravail: { motif: "la généralisation du télétravail dans les entreprises clientes" },
  fitness_credit_resserre: { motif: "le durcissement du crédit d'équipement" },
  fitness_canicule: { motif: "un épisode caniculaire", rubrique: "Météo" },
  fitness_marathon: { motif: "le marathon de la ville et ses milliers d'inscrits" },
  fitness_chaine_nationale: { motif: "l'implantation d'un club haut de gamme d'enseigne nationale" },
  fitness_appli_gratuite: { motif: "l'essor des séances de sport à domicile" },
  fitness_mutuelle: { motif: "la prise en charge de l'abonnement sportif par les mutuelles" },
  // ── MARTEL & FILS, bâtiment ──
  batiment_aide_renovation: {
    motif: "la reconduction de l'aide publique à la rénovation énergétique",
    rubrique: "Aides publiques",
  },
  batiment_penurie_materiaux: { motif: "la pénurie d'isolants chez les négociants" },
  batiment_intemperies: { motif: "une série d'intempéries qui arrête les chantiers", rubrique: "Météo" },
  batiment_appel_offres: {
    motif: "la publication de nouveaux programmes publics de rénovation",
    rubrique: "Marchés publics",
  },
  batiment_credit_immobilier: { motif: "l'effondrement des mises en chantier chez les particuliers" },
  batiment_concurrent_liquide: { motif: "la liquidation d'une entreprise du secteur" },
  batiment_credit_resserre: { motif: "le durcissement des conditions de crédit au bâtiment" },
  batiment_artisan_low_cost: { motif: "des devis anormalement bas chez les particuliers" },
  batiment_major_petits_marches: { motif: "l'arrivée d'un grand groupe sur les petits marchés publics" },
  batiment_norme_thermique: {
    motif: "l'entrée en vigueur de la nouvelle réglementation thermique",
    rubrique: "Réglementation",
  },
  // ── ROUTE & CIE, transport ──
  transport_gazole: { motif: "la hausse de l'indice gazole" },
  transport_penurie_chauffeurs: { motif: "la pénurie de conducteurs routiers", rubrique: "Emploi" },
  transport_pic_ecommerce: { motif: "un pic des commandes en ligne" },
  transport_blocage_routier: { motif: "le filtrage des accès à la métropole", rubrique: "Logistique" },
  transport_relocalisation: { motif: "l'implantation d'une nouvelle usine sur le territoire" },
  transport_guerre_des_prix: { motif: "l'effondrement des cotations sur la bourse de fret" },
  transport_credit_resserre: { motif: "le durcissement du financement des flottes" },
  transport_concurrent_est: { motif: "l'arrivée d'un opérateur étranger sur les lots régionaux" },
  transport_distribution_internalise: { motif: "l'internalisation des flux par un grand distributeur" },
  transport_peages: { motif: "la revalorisation annuelle des péages" },
};

/**
 * LES ÉTAPES D'INVESTISSEMENT (config/investissement-par-niveau) : une même
 * histoire dans les neuf métiers, racontée par la presse. Le code se termine
 * par `_inv_<étape>`.
 */
export const MOTIFS_D_INVESTISSEMENT: Record<string, MotifDeLEvenement> = {
  signal: { motif: "les premiers signes d'un regain de commandes chez les grands comptes" },
  grand_compte: { motif: "l'arrivée de commandes importantes et durables des grands comptes" },
  taux: { motif: "une campagne des banques en faveur du crédit d'équipement" },
  concurrent: { motif: "l'agrandissement annoncé d'un concurrent régional" },
  retournement: { motif: "la révision à la baisse des volumes promis par les grands comptes" },
};

/** Un motif de repli, pour un événement que la banque ne connaît pas (scénario d'enseignant). */
export const MOTIFS_PAR_DEFAUT: Record<Exclude<SujetDeLaGazette, "calme">, string> = {
  demande: "un changement d'humeur de la clientèle",
  concurrence: "un mouvement chez les concurrents",
  couts: "une révision des tarifs des fournisseurs",
  taux: "une révision des conditions bancaires",
  activite: "des perturbations sur l'outil de travail",
};

export type CleDeGabarit = `${SujetDeLaGazette}:${SensDuSujet}`;

/**
 * LES TITRES, par sujet et par sens. Gabarits à trous : {profession},
 * {domaine}, {marche}, {clients}, {intrants}, {Intrants}, {outil}. La
 * première lettre est remise en capitale après substitution. Au moins huit
 * par clé pour le calme (il peut revenir à chaque tour), six pour le reste.
 */
export const TITRES: Partial<Record<CleDeGabarit, readonly string[]>> = {
  // Les titres d'un événement regardent DEVANT : la nouvelle porte sur le
  // trimestre qui s'ouvre, qu'elle soit acquise (niveaux 1 et 2) ou prévue par
  // les analystes. Un titre au présent de l'indicatif affirmerait comme un fait
  // une prévision qui peut être démentie.
  "demande:hausse": [
    "La demande devrait repartir pour {profession}",
    "Embellie en vue sur {marche}",
    "{profession} : vers des carnets de commandes mieux remplis",
    "Le vent pourrait tourner pour {profession}",
    "{domaine} : des ventes attendues en hausse",
    "Regain d'appétit attendu chez {clients}",
    "{domaine} : une demande plus soutenue en perspective",
    "Coup d'accélérateur en vue sur {marche}",
  ],
  "demande:baisse": [
    "La demande devrait marquer le pas pour {profession}",
    "Coup de frein en vue sur {marche}",
    "{profession} : des clients plus rares en perspective",
    "Trou d'air attendu dans {domaine}",
    "{clients} pourraient lever le pied",
    "{domaine} : des ventes attendues en retrait",
    "{domaine} : la demande menace de se replier",
    "Ciel gris annoncé sur {marche}",
  ],
  "concurrence:baisse": [
    "Un nouvel acteur pourrait bousculer {marche}",
    "{profession} : la concurrence devrait se durcir",
    "Bataille de clientèle en vue dans {domaine}",
    "La pression concurrentielle menace de monter d'un cran",
    "{clients} bientôt courtisés par de nouveaux venus",
    "Le partage du gâteau s'annonce plus serré pour {profession}",
    "Offensive commerciale attendue sur {marche}",
  ],
  "concurrence:hausse": [
    "Un concurrent sur le départ, le marché pourrait se redistribuer",
    "{profession} : des clients à reprendre en perspective",
    "Une place pourrait se libérer sur {marche}",
    "Défaillance redoutée dans {domaine}",
    "{clients} bientôt en quête d'un nouveau fournisseur",
    "Le marché pourrait se resserrer autour des acteurs restants",
  ],
  "couts:hausse": [
    "{Intrants} : la facture devrait s'alourdir",
    "Hausse en vue sur {intrants}",
    "{profession} face à une flambée des coûts annoncée",
    "Les prix d'achat devraient repartir à la hausse",
    "{Intrants} : les fournisseurs s'apprêtent à relever leurs tarifs",
    "Tensions attendues sur les coûts dans {domaine}",
    "Les marges bientôt sous pression dans {domaine}",
  ],
  "couts:baisse": [
    "{Intrants} : une détente en vue",
    "Les prix d'achat devraient reculer",
    "Bouffée d'air attendue sur {intrants}",
    "{profession} : des coûts d'achat qui devraient se tasser",
    "{Intrants} : les fournisseurs pourraient desserrer l'étau",
    "Accalmie en vue sur les coûts dans {domaine}",
  ],
  "taux:hausse": [
    "Le crédit devrait se renchérir pour {profession}",
    "Les banques s'apprêtent à resserrer le crédit",
    "Emprunter devrait coûter plus cher",
    "Le financement des entreprises menace de se resserrer",
    "{profession} : l'argent bientôt plus cher",
    "Les taux d'intérêt devraient reprendre de la hauteur",
  ],
  "taux:baisse": [
    "Le crédit devrait se détendre pour {profession}",
    "Les banques s'apprêtent à assouplir leurs conditions",
    "Emprunter devrait coûter moins cher",
    "Une fenêtre de tir en vue pour financer l'équipement",
    "{profession} : l'argent bientôt plus abordable",
    "Les taux d'intérêt devraient reculer",
  ],
  "activite:baisse": [
    "{outil} : vers un fonctionnement au ralenti",
    "Capacités sous tension en vue dans {domaine}",
    "{profession} : une activité qui s'annonce contrariée",
    "Des capacités amputées en perspective pour {profession}",
    "Coup dur attendu pour l'activité dans {domaine}",
    "L'outil de travail bientôt mis à l'épreuve",
  ],
  "activite:hausse": [
    "{outil} : vers un regain de cadence",
    "Des capacités en plus en perspective pour {profession}",
    "L'activité devrait se fluidifier dans {domaine}",
    "{profession} : un outil qui devrait tourner à plein",
    "Coup de pouce attendu pour les capacités dans {domaine}",
    "Les cadences devraient repartir",
  ],
  "calme:hausse": [
    "{profession} : la saison porte la demande",
    "Une saison favorable s'annonce dans {domaine}",
    "Sans surprise, la demande suit la saison",
    "{marche} : la belle saison en vue",
    "Pas de secousse, mais une demande qui monte",
    "{clients} au rendez-vous de la saison",
    "Un marché calme et porteur",
    "Saison haute en approche pour {profession}",
  ],
  "calme:baisse": [
    "{profession} : la saison creuse s'installe",
    "Une saison plus calme s'annonce dans {domaine}",
    "Le creux saisonnier se profile",
    "{marche} : la demande ralentit avec la saison",
    "Pas de secousse, mais une demande en retrait",
    "{clients} se font plus rares à cette saison",
    "Un marché calme et en retrait",
    "Basse saison en vue pour {profession}",
  ],
  "calme:stable": [
    "{profession} : un marché sans relief",
    "Calme plat dans {domaine}",
    "La demande garde son rythme de croisière",
    "{marche} : rien de neuf sous le soleil",
    "Pas de secousse attendue pour {profession}",
    "Un marché stable, sans surprise",
    "{domaine} : la routine s'installe",
    "Le marché tient son cap",
  ],
};

/**
 * CE QUE L'ARTICLE DIT, par sujet : le complément du nom de l'ampleur
 * (« une forte hausse DE LA DEMANDE »). {clientele} : la clientèle visée, au
 * génitif, quand l'événement ne touche qu'elle.
 */
export const OBJETS: Record<Exclude<SujetDeLaGazette, "calme">, string> = {
  demande: "de la demande{clientele}",
  concurrence: "de la demande adressée aux acteurs en place",
  couts: "{prixDesIntrants}",
  taux: "des taux d'intérêt",
  activite: "des capacités disponibles",
};

/** L'ampleur, en groupe nominal, de la plus faible à la plus forte. */
export const AMPLEURS: Record<"hausse" | "baisse", readonly [string, string, string, string]> = {
  hausse: ["une légère hausse", "une hausse sensible", "une forte hausse", "une très forte hausse"],
  baisse: ["un léger repli", "un repli sensible", "un net recul", "un très net recul"],
};

/** Qui parle du crédit : les banques, d'une seule voix. */
export const SOURCE_DU_CREDIT = "l'association régionale des banques";

/** Qui annonce un FAIT (niveaux 1 et 2, ou un événement qui se poursuit). */
export const ANNONCES_DE_FAIT: readonly string[] = [
  "{Source} annonce {ampleur} {objet}{fourchette}{duree}.",
  "{Source} confirme {ampleur} {objet}{fourchette}{duree}.",
  "D'après {source}, il faut compter sur {ampleur} {objet}{fourchette}{duree}.",
];

/** Comment s'écrit une PRÉVISION (niveaux 3 et au-delà). */
export const ANNONCES_DE_PREVISION: readonly string[] = [
  "Les analystes s'attendent à {ampleur} {objet}{duree}.",
  "{Source} table sur {ampleur} {objet}{duree}.",
  "Selon les prévisionnistes, {ampleur} {objet} se profile{duree}.",
];

/** Ce qui l'explique, dit comme un fait. */
export const CAUSES_DE_FAIT: readonly string[] = [
  "En cause : {motif}.",
  "Le déclencheur : {motif}.",
  "À l'origine de ce mouvement : {motif}.",
];

/** Ce qui l'expliquerait, dit comme une hypothèse. */
export const CAUSES_DE_PREVISION: readonly string[] = [
  "Ils évoquent la perspective {deMotif}.",
  "En toile de fond, la perspective {deMotif}.",
  "L'hypothèse retenue repose sur la perspective {deMotif}.",
];

/** Un événement qui continue, dit comme un fait. {duree} commence par une espace. */
export const SUITES: Record<`${Exclude<SujetDeLaGazette, "calme">}:${"hausse" | "baisse"}`, string> = {
  "demande:hausse": "la hausse de la demande{clientele} se poursuit{duree}",
  "demande:baisse": "le repli de la demande{clientele} se prolonge{duree}",
  "concurrence:baisse": "la pression des nouveaux venus se fait toujours sentir{duree}",
  "concurrence:hausse": "la clientèle libérée par le concurrent disparu se redistribue toujours{duree}",
  "couts:hausse": "la hausse {prixDesIntrants} se prolonge{duree}",
  "couts:baisse": "la détente {prixDesIntrants} se prolonge{duree}",
  "taux:hausse": "le crédit reste cher{duree}",
  "taux:baisse": "le crédit reste bon marché{duree}",
  "activite:baisse": "les capacités restent amputées{duree}",
  "activite:hausse": "les capacités restent renforcées{duree}",
};

/** L'entrée en matière d'une seconde nouvelle, par sujet. */
export const COTES: Record<Exclude<SujetDeLaGazette, "calme">, string> = {
  demande: "Côté clientèle",
  concurrence: "Côté concurrence",
  couts: "Côté achats",
  taux: "Côté financement",
  activite: "Côté production",
};

/** Le premier paragraphe d'un tour calme, selon la saison. */
export const CALMES: Record<SensDuSujet, readonly string[]> = {
  hausse: [
    "Aucun bouleversement n'est attendu {periode} dans {domaine}. La saison, elle, devrait porter la demande, comme chaque année à cette période.",
    "Pas de nouvelle majeure pour {profession}. La demande devrait profiter de la saison, sans autre surprise annoncée.",
    "Le marché reste calme, et la saison joue pour {profession} : la demande devrait monter, comme à l'accoutumée.",
  ],
  baisse: [
    "Aucun bouleversement n'est attendu {periode} dans {domaine}. La saison, elle, devrait freiner la demande, comme chaque année à cette période.",
    "Pas de nouvelle majeure pour {profession}, mais la saison creuse arrive : la demande devrait se tasser.",
    "Le marché reste calme, et la saison ne joue pas pour {profession} : la demande devrait ralentir, comme à l'accoutumée.",
  ],
  stable: [
    "Aucun bouleversement n'est attendu {periode} dans {domaine}. La demande devrait garder son rythme, sans effet de saison marqué.",
    "Pas de nouvelle majeure pour {profession} : ni saison marquée, ni secousse annoncée.",
    "Le marché reste calme. {Clients} devraient garder leurs habitudes, sans secousse annoncée.",
  ],
};

/** La saison, en une phrase, quand une autre nouvelle tient la tête de l'article. */
export const SAISONS_EN_FOND: Record<SensDuSujet, string> = {
  hausse: "La saison, elle, devrait porter la demande.",
  baisse: "La saison, elle, devrait freiner la demande.",
  stable: "La demande de fond, elle, garde son rythme.",
};

/** Les mots qui disent une direction : la garde de cohérence s'en sert. */
export const MOTS_DE_HAUSSE = /\b(hausse|progress|monte|repart|embellie|regain|renchéri|flambée|alourdi|plus cher|soutenue|accélérateur|remplissent|ascendante)/i;
export const MOTS_DE_BAISSE = /\b(baisse|recul|repli|marque le pas|frein|trou d'air|essouffl|ralenti|détente|desserr|moins cher|tassent|se tasser|plus rares)/i;
