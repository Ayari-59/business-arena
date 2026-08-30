import type { BotProfile } from "../../engine/bots";
import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import type { SituationDef } from "./situation-kit";
import {
  ABONNEMENT_KPIS,
  COMMERCE_KPIS,
  ECOMMERCE_KPIS,
  HOTELLERIE_KPIS,
  INDUSTRIE_KPIS,
  RESTAURATION_KPIS,
  SERVICES_KPIS,
  BATIMENT_KPIS,
  TRANSPORT_KPIS,
  type SectorKpiDef,
} from "./sector-kpis";
import { novaBots, novaCompany, novaScenario } from "./nova";
import { NOVA_SITUATIONS } from "./nova/situations";
import { boutiqueBots, boutiqueCompany, boutiqueScenario } from "./boutique";
import { BOUTIQUE_SITUATIONS } from "./boutique/situations";
import { hotelBots, hotelCompany, hotelScenario } from "./hotel";
import { HOTEL_SITUATIONS } from "./hotel/situations";
import { bistrotBots, bistrotCompany, bistrotScenario } from "./bistrot";
import { BISTROT_SITUATIONS } from "./bistrot/situations";
import { conseilBots, conseilCompany, conseilScenario } from "./conseil";
import { CONSEIL_SITUATIONS } from "./conseil/situations";
import { ecommerceBots, ecommerceCompany, ecommerceScenario } from "./ecommerce";
import { ECOMMERCE_SITUATIONS } from "./ecommerce/situations";
import { fitnessBots, fitnessCompany, fitnessScenario } from "./fitness";
import { FITNESS_SITUATIONS } from "./fitness/situations";
import { batimentBots, batimentCompany, batimentScenario } from "./batiment";
import { BATIMENT_SITUATIONS } from "./batiment/situations";
import { transportBots, transportCompany, transportScenario } from "./transport";
import { TRANSPORT_SITUATIONS } from "./transport/situations";

/**
 * Registre des scénarios (doc 01 §4) : un scénario n'est pas du code, c'est
 * une DONNÉE — configuration économique, entreprise de départ, concurrents et
 * situations pédagogiques réunis en une entrée. Ajouter un secteur, c'est
 * ajouter une entrée ici : ni le moteur ni les services ne bougent.
 *
 * Le vocabulaire fait partie du scénario : on ne vend pas des « unités » dans
 * un hôtel, on vend des nuitées. `vocabulary` porte ces mots jusqu'à l'arène.
 */

export type Sector =
  | "industrie"
  | "commerce"
  | "ecommerce"
  | "hotellerie"
  | "restauration"
  | "services"
  | "abonnement"
  | "batiment"
  | "transport";

export const SECTOR_LABELS: Record<Sector, string> = {
  industrie: "Industrie",
  commerce: "Commerce",
  ecommerce: "E-commerce",
  hotellerie: "Hôtellerie",
  restauration: "Restauration",
  services: "Services",
  abonnement: "Abonnement",
  batiment: "Bâtiment",
  transport: "Transport",
};

export interface ScenarioVocabulary {
  /** Ce que l'entreprise vend, au singulier et au pluriel (« nuitée »/« nuitées »). */
  unit: string;
  units: string;
  /**
   * Le genre de ce nom. Sans lui, toute phrase qui accorde un participe avec
   * l'unité est juste dans les secteurs d'un genre et fausse dans ceux de l'autre :
   * « 205 enceintes sont restés ». Le genre est une donnée du secteur, pas une
   * chose que la phrase peut deviner.
   */
  unitsGender: "m" | "f";
  /** Le verbe de l'activité : « Production », « Approvisionnement », « Service »… */
  productionLabel: string;
  /** Ce que le joueur décide en volume (« Plan de production », « Couverts à servir »). */
  productionPlanLabel: string;
  /** Le prix (« Prix de vente », « Prix moyen par nuitée », « Ticket moyen »). */
  priceLabel: string;
  /** Ce que devient l'invendu (« Stock », « Capacité perdue »). */
  leftoverLabel: string;

  // --- Panneau de capacité : un hôtel n'a pas de « machines » ---------------
  /** Titre du panneau (« Capacité de production », « Capacité d'accueil »). */
  capacityPanelTitle: string;
  /** Le plafond PHYSIQUE (« Capacité machine », « Chambres ouvertes »). */
  capacityLabel: string;
  /** Le même en un mot, pour la ligne « Goulot » (« Machine », « Chambres »). */
  capacityBottleneckLabel: string;
  /** Le conseil donné quand le plafond physique est la contrainte active. */
  capacityBottleneckHint: string;
  /** Le plafond HUMAIN (« Capacité main-d'œuvre », « Capacité brigade »). */
  laborLabel: string;
  /** Le conseil donné quand la main-d'œuvre est la contrainte active. */
  laborBottleneckHint: string;
  /** Ce que la capacité compte par tour (« enceintes/tour », « nuitées/tour »). */
  perRoundLabel: string;

  // --- Analyse des coûts : une salle de sport n'achète pas de matières ------
  /**
   * Ce que recouvre le coût d'achat unitaire (« Denrées », « Matériaux »,
   * « Consommables adhérent »). Le moteur ne connaît qu'un coût d'achat par
   * unité vendue ; ce que l'on achète change à chaque métier, et l'appeler
   * partout « matières premières » demandait à un gérant de salle de sport de
   * deviner qu'il s'agissait de ses badges et de ses serviettes.
   */
  materialLabel: string;
  /** L'autre moitié du coût variable (« Énergie de cuisson, commissions »). */
  otherVariableLabel: string;
  /** Le titre du panneau de choix du fournisseur (« Fournisseur de denrées »). */
  supplierPanelLabel: string;
}

export interface ScenarioDefinition {
  code: string;
  title: string;
  sector: Sector;
  /** Une phrase : ce que l'élève dirige. */
  tagline: string;
  /**
   * Texte d'accueil du TOUR 1, lu par l'élève dans l'arène. Deux ou trois
   * phrases complètes : ce que l'entreprise fait, la contrainte qui décide de
   * tout dans ce métier, et ce qui se joue au premier tour. Ni slogan ni liste
   * de notions : à ce moment-là l'élève ne connaît pas encore les mots.
   */
  briefing: string;
  /**
   * Ce que l'élève trouve en arrivant : d'où vient l'entreprise, dans quel
   * état, face à quoi. Sans chiffre : les montants viennent du SNAPSHOT joué,
   * que la périodicité et les réglages de l'enseignant peuvent changer.
   */
  context: string;
  /**
   * Le premier arbitrage, pose en toutes lettres avec ses deux issues. Une
   * decision se prend contre quelque chose : chaque route dit ce qu'elle
   * rapporte ET ce qu'elle coûte. Sans chiffre, pour la même raison.
   */
  dilemma: {
    question: string;
    routes: { label: string; gain: string; risque: string }[];
  };
  /** Nom de l'entreprise que dirige le joueur (partie solo). */
  playerTeamName: string;
  vocabulary: ScenarioVocabulary;
  scenario: EngineScenarioConfig;
  company: (
    id: string,
    name: string,
    controller: "human" | "bot",
    botProfile?: BotProfile,
  ) => CompanyState;
  bots: { id: string; name: string; profile: BotProfile }[];
  situations: SituationDef[];
  /**
   * Les indicateurs du métier. Le compte de résultat est le même partout,
   * mais on ne pilote pas un hôtel avec les chiffres d'un atelier.
   */
  kpis: SectorKpiDef[];
}

export const NOVA_DEFINITION: ScenarioDefinition = {
  code: novaScenario.code,
  title: "NOVA · Prenez les commandes",
  sector: "industrie",
  tagline: "Fabricant d'enceintes portables.",
  briefing:
    "Tout ce que vous vendez sort de votre atelier, dont la capacité est limitée. Produire plus que vous ne vendez immobilise votre argent en stock ; produire moins laisse repartir des clients. Tout se joue sur le prix et sur le volume que vous lancez.",
  context:
    "L'ancien dirigeant est parti à la retraite le mois dernier. Il vous laisse un atelier en état, une équipe qui connaît le produit, et un carnet de commandes vide : rien n'est signé pour le trimestre qui s'ouvre. La concurrence, elle, est installée depuis des années, l'une sur les prix bas, l'autre sur le haut de gamme.",
  dilemma: {
    question: "Deux clientèles, deux niveaux de prix, un seul atelier. Laquelle visez-vous ce trimestre ?",
    routes: [
      {
        label: "Viser le volume, au prix des étudiants",
        gain: "C'est la clientèle la plus nombreuse. L'atelier tourne à plein régime, et chaque enceinte de plus ne coûte que ses matières.",
        risque: "La marge par enceinte est mince, et ce sont les clients les plus prompts à partir chez le moins cher.",
      },
      {
        label: "Viser la valeur, au prix des passionnés",
        gain: "Une marge nettement plus large sur chaque enceinte, auprès de clients qui reviennent d'un trimestre à l'autre.",
        risque: "Cette clientèle est bien plus petite. L'atelier tournera au ralenti, et les charges de structure tomberont quand même.",
      },
    ],
  },
  playerTeamName: "NOVA",
  vocabulary: {
    unit: "enceinte",
    units: "enceintes",
    unitsGender: "f",
    productionLabel: "Production",
    productionPlanLabel: "Plan de production",
    priceLabel: "Prix de vente",
    leftoverLabel: "Stock",
    capacityPanelTitle: "Capacité de production",
    capacityLabel: "Capacité machine",
    capacityBottleneckLabel: "Machine",
    capacityBottleneckHint:
      "Vos machines limitent la production : l'investissement capacitaire prend effet au tour suivant.",
    laborLabel: "Capacité main-d'œuvre",
    laborBottleneckHint:
      "Votre main-d'œuvre limite la production : envisagez d'embaucher ou de former vos salariés pour augmenter la productivité.",
    perRoundLabel: "enceintes/tour",
    materialLabel: "Matières et composants",
    otherVariableLabel: "Main-d'œuvre directe, énergie",
    supplierPanelLabel: "Fournisseur de composants",
  },
  scenario: novaScenario,
  company: novaCompany,
  bots: novaBots,
  situations: NOVA_SITUATIONS,
  kpis: INDUSTRIE_KPIS,
};

export const BOUTIQUE_DEFINITION: ScenarioDefinition = {
  code: boutiqueScenario.code,
  title: "MAILLE & CO · Tenez la boutique",
  sector: "commerce",
  tagline: "Concept store de prêt-à-porter en centre-ville.",
  briefing:
    "Vous ne fabriquez rien, vous achetez pour revendre. Votre marge se joue entièrement entre le prix auquel vous achetez et celui auquel vous vendez. Ce que vous commandez dort en réserve, et vous l'avez payé bien avant qu'une cliente l'emporte.",
  context:
    "La boutique tourne depuis des années et la clientèle du quartier la connaît. Votre prédécesseur commandait toujours la même chose aux mêmes fournisseurs, et la réserve déborde encore de pièces de la saison passée. Vous, vous devez commander la saison qui vient sans savoir ce qui se vendra.",
  dilemma: {
    question: "Vous achetez aujourd'hui ce que vous vendrez dans plusieurs semaines. Combien commandez-vous ?",
    routes: [
      {
        label: "Commander large",
        gain: "La réserve suit la demande, aucune cliente ne repart les mains vides, et le pic de fin d'année se passe sans rupture.",
        risque: "Chaque pièce invendue reste payée et dort en réserve. Votre argent est immobilisé dans des cartons.",
      },
      {
        label: "Commander serré",
        gain: "Peu d'argent immobilisé, une réserve saine, et de la trésorerie disponible pour le reste.",
        risque: "Une pièce qui manque est une vente perdue, et une cliente qui a trouvé ailleurs revient rarement.",
      },
    ],
  },
  playerTeamName: "MAILLE & CO",
  vocabulary: {
    unit: "article",
    units: "articles",
    unitsGender: "m",
    productionLabel: "Approvisionnement",
    productionPlanLabel: "Articles à mettre en rayon",
    priceLabel: "Prix de vente moyen",
    leftoverLabel: "Stock en réserve",
    capacityPanelTitle: "Capacité de traitement",
    capacityLabel: "Réserve et linéaire",
    capacityBottleneckLabel: "Réserve",
    capacityBottleneckHint:
      "Votre réserve et votre linéaire limitent ce que la boutique peut écouler : agrandir prend effet au tour suivant.",
    laborLabel: "Capacité de l'équipe",
    laborBottleneckHint:
      "Votre équipe de vente limite le flux en boutique : envisagez d'embaucher ou de former vos vendeuses.",
    perRoundLabel: "articles/tour",
    materialLabel: "Achats de marchandises",
    otherVariableLabel: "Sacs, commissions, logistique",
    supplierPanelLabel: "Fournisseur de la collection",
  },
  scenario: boutiqueScenario,
  company: boutiqueCompany,
  bots: boutiqueBots,
  situations: BOUTIQUE_SITUATIONS,
  kpis: COMMERCE_KPIS,
};

export const HOTEL_DEFINITION: ScenarioDefinition = {
  code: hotelScenario.code,
  title: "L'ESCALE · Remplissez l'hôtel",
  sector: "hotellerie",
  tagline: "Hôtel 3 étoiles de 60 chambres en ville moyenne.",
  briefing:
    "Une chambre vide ce soir est perdue : elle ne se vendra pas deux fois demain. Vos charges tombent que l'hôtel soit plein ou non. Vous jouez donc sur deux tableaux à la fois, le nombre de chambres occupées et le prix que vous arrivez à tenir.",
  context:
    "L'hôtel vient d'un exploitant qui affichait le même tarif toute l'année, sans jamais regarder si les chambres se remplissaient. Les plateformes de réservation apportent des clients, mais prennent leur commission au passage. La saison qui s'ouvre ne remplira pas l'hôtel toute seule.",
  dilemma: {
    question: "Une chambre vide ce soir ne rapportera jamais rien. Jusqu'où baissez-vous pour la remplir ?",
    routes: [
      {
        label: "Baisser le tarif pour remplir",
        gain: "Des chambres occupées plutôt que vides. Une nuit vendue à petit prix rapporte toujours plus qu'une nuit invendue.",
        risque: "Vos habitués voient le tarif baisser et attendront la prochaine promotion. Un prix moyen, cela descend vite et cela remonte lentement.",
      },
      {
        label: "Tenir le tarif affiché",
        gain: "Chaque nuit vendue rapporte pleinement, et l'hôtel garde le positionnement qui fait venir sa clientèle.",
        risque: "Des chambres restent vides alors que les charges tombent, que l'hôtel soit plein ou non.",
      },
    ],
  },
  playerTeamName: "L'ESCALE",
  vocabulary: {
    unit: "nuitée",
    units: "nuitées",
    unitsGender: "f",
    productionLabel: "Ouverture",
    productionPlanLabel: "Nuitées mises en vente",
    priceLabel: "Prix moyen par nuitée",
    leftoverLabel: "Nuitées perdues",
    capacityPanelTitle: "Capacité d'accueil",
    capacityLabel: "Chambres ouvertes",
    capacityBottleneckLabel: "Chambres",
    capacityBottleneckHint:
      "Vos chambres limitent le remplissage : rénover et rouvrir des chambres prend effet au tour suivant.",
    laborLabel: "Capacité des équipes",
    laborBottleneckHint:
      "Vos équipes d'étage et de réception limitent le nombre de chambres exploitables : envisagez d'embaucher ou de former.",
    perRoundLabel: "nuitées/tour",
    materialLabel: "Petit-déjeuner et linge",
    otherVariableLabel: "Commissions, énergie, ménage",
    supplierPanelLabel: "Prestataires du séjour",
  },
  scenario: hotelScenario,
  company: hotelCompany,
  bots: hotelBots,
  situations: HOTEL_SITUATIONS,
  kpis: HOTELLERIE_KPIS,
};

export const BISTROT_DEFINITION: ScenarioDefinition = {
  code: bistrotScenario.code,
  title: "LA TABLE D'AUGUSTIN · Tenez le service",
  sector: "restauration",
  tagline: "Bistrot de 70 couverts, midi et soir.",
  briefing:
    "Un couvert non servi est perdu, et ce que la cuisine a préparé sans le vendre part à la poubelle. Deux limites vous arrêtent en même temps : le nombre de places en salle et les heures de votre brigade. Prévoir trop coûte, prévoir trop peu aussi.",
  context:
    "Le bistrot est connu du quartier : la salle se remplit le midi en semaine, et le soir le week-end. Chaque semaine, la cuisine commande des denrées qui ne se gardent pas. Ce qui est préparé et non servi est perdu le soir même.",
  dilemma: {
    question: "La cuisine prépare avant de savoir combien de clients viendront. Vous tablez sur quelle affluence ?",
    routes: [
      {
        label: "Préparer large",
        gain: "Aucun client renvoyé, aucun plat retiré de la carte en plein service, une salle qui tourne jusqu'au bout.",
        risque: "Ce qui n'est pas servi part à la poubelle, et vous l'avez déjà payé.",
      },
      {
        label: "Préparer juste",
        gain: "Presque aucune perte, et un coût des denrées qui reste sous contrôle.",
        risque: "Un soir d'affluence, vous refusez du monde, et la salle aurait pu être pleine.",
      },
    ],
  },
  playerTeamName: "LA TABLE D'AUGUSTIN",
  vocabulary: {
    unit: "couvert",
    units: "couverts",
    unitsGender: "m",
    productionLabel: "Service",
    productionPlanLabel: "Couverts à préparer",
    priceLabel: "Ticket moyen",
    leftoverLabel: "Denrées perdues",
    capacityPanelTitle: "Capacité de service",
    capacityLabel: "Places en salle",
    capacityBottleneckLabel: "Salle",
    capacityBottleneckHint:
      "Votre salle limite le nombre de couverts : couvrir la terrasse prend effet au tour suivant.",
    laborLabel: "Capacité brigade",
    laborBottleneckHint:
      "Votre brigade limite le service : des places libres ne servent à rien sans personnel pour les tenir. Embauchez ou formez.",
    perRoundLabel: "couverts/tour",
    materialLabel: "Denrées",
    otherVariableLabel: "Énergie de cuisson, commissions",
    supplierPanelLabel: "Fournisseur de denrées",
  },
  scenario: bistrotScenario,
  company: bistrotCompany,
  bots: bistrotBots,
  situations: BISTROT_SITUATIONS,
  kpis: RESTAURATION_KPIS,
};

export const CONSEIL_DEFINITION: ScenarioDefinition = {
  code: conseilScenario.code,
  title: "ATLAS CONSEIL · Vendez le temps de vos équipes",
  sector: "services",
  tagline: "Cabinet de conseil et bureau d'études, 12 consultants.",
  briefing:
    "Ce que vous facturez, c'est du temps de travail. Une journée non vendue ne se rattrape jamais, et les salaires tombent que le carnet soit plein ou vide. Vos clients règlent à 45 jours : l'argent gagné met des semaines à arriver en caisse.",
  context:
    "Le cabinet a bonne réputation, mais son fondateur est parti en emportant la moitié des missions. Vos consultants sont salariés : ils sont payés que le carnet soit plein ou vide. Les clients, eux, règlent leurs factures des semaines après la fin de la mission.",
  dilemma: {
    question: "Vos consultants sont payés qu'ils facturent ou non. À quel tarif vendez-vous leurs journées ?",
    routes: [
      {
        label: "Baisser le tarif pour remplir le planning",
        gain: "Des consultants en mission plutôt qu'au bureau, un carnet rempli, et de la trésorerie qui rentre.",
        risque: "Un tarif bradé se renégocie difficilement l'année suivante, et la marge par journée finit par ne plus couvrir les salaires.",
      },
      {
        label: "Tenir le tarif",
        gain: "Chaque journée vendue couvre largement le salaire de celui qui la réalise.",
        risque: "Des journées restent invendues, et les salaires tombent quand même.",
      },
    ],
  },
  playerTeamName: "ATLAS CONSEIL",
  vocabulary: {
    unit: "jour-conseil",
    units: "jours-conseil",
    unitsGender: "m",
    productionLabel: "Staffing",
    productionPlanLabel: "Jours à staffer",
    priceLabel: "Taux journalier moyen",
    leftoverLabel: "Jours non facturés",
    capacityPanelTitle: "Capacité de staffing",
    capacityLabel: "Capacité des locaux",
    capacityBottleneckLabel: "Locaux",
    capacityBottleneckHint:
      "Vos locaux limitent la taille du cabinet, cas rare : la contrainte habituelle est l'effectif.",
    laborLabel: "Jours-consultants disponibles",
    laborBottleneckHint:
      "Vos consultants SONT la capacité du cabinet : elle ne s'achète pas, elle se recrute. Embaucher produit son effet au tour suivant.",
    perRoundLabel: "jours/tour",
    materialLabel: "Frais de mission",
    otherVariableLabel: "Sous-traitance d'appoint",
    supplierPanelLabel: "Renfort sur les missions",
  },
  scenario: conseilScenario,
  company: conseilCompany,
  bots: conseilBots,
  situations: CONSEIL_SITUATIONS,
  kpis: SERVICES_KPIS,
};


export const ECOMMERCE_DEFINITION: ScenarioDefinition = {
  code: ecommerceScenario.code,
  title: "PIXEL & CO · Achetez votre trafic",
  sector: "ecommerce",
  tagline: "Pure player de décoration et petit mobilier.",
  briefing:
    "Ouvrir votre boutique ne coûte presque rien, c'est un site. Mais personne n'y arrive tout seul : chaque visiteur se paie en publicité. La question n'est donc pas de savoir si vous gagnez de l'argent sur une commande, mais si vous en gagnez assez pour rembourser ce que ce client vous a coûté.",
  context:
    "Le site fonctionne, les fournisseurs sont en place, l'entrepôt prépare les commandes. Mais l'ancien propriétaire avait coupé la publicité pour économiser, et le trafic s'est effondré avec elle. Sur internet, personne ne passe devant votre vitrine par hasard.",
  dilemma: {
    question: "Sur internet, chaque visiteur se paie. Combien investissez-vous pour aller chercher des clients ?",
    routes: [
      {
        label: "Ouvrir grand le budget d'acquisition",
        gain: "Le trafic monte, les commandes suivent, et la boutique existe enfin face aux gros vendeurs.",
        risque: "La publicité se paie tout de suite. Si ce que rapporte une commande ne couvre pas ce que ce client a coûté, vous vendez à perte sans le voir.",
      },
      {
        label: "Rester prudent sur la publicité",
        gain: "Aucune dépense hasardeuse, et chaque commande encaissée rapporte pleinement.",
        risque: "Sans trafic, il n'y a pas de commandes du tout : l'entrepôt et les charges tournent à vide.",
      },
    ],
  },
  playerTeamName: "PIXEL & CO",
  vocabulary: {
    unit: "commande",
    units: "commandes",
    unitsGender: "f",
    productionLabel: "Préparation",
    productionPlanLabel: "Commandes à préparer",
    priceLabel: "Panier moyen visé",
    leftoverLabel: "Stock en entrepôt",
    capacityPanelTitle: "Capacité logistique",
    capacityLabel: "Préparation de commandes",
    capacityBottleneckLabel: "Entrepôt",
    capacityBottleneckHint:
      "Votre entrepôt limite les expéditions : mécaniser la préparation prend effet au tour suivant.",
    laborLabel: "Capacité de l'équipe",
    laborBottleneckHint:
      "Votre équipe logistique limite les expéditions : une commande non préparée est une commande annulée. Embauchez ou formez.",
    perRoundLabel: "commandes/tour",
    materialLabel: "Achats de marchandises",
    otherVariableLabel: "Préparation, transport, retours",
    supplierPanelLabel: "Fournisseur du catalogue",
  },
  scenario: ecommerceScenario,
  company: ecommerceCompany,
  bots: ecommerceBots,
  situations: ECOMMERCE_SITUATIONS,
  kpis: ECOMMERCE_KPIS,
};

export const FITNESS_DEFINITION: ScenarioDefinition = {
  code: fitnessScenario.code,
  title: "VOLT FITNESS · Gardez vos adhérents",
  sector: "abonnement",
  tagline: "Salle de sport de 1 200 m² en périphérie.",
  briefing:
    "Vos adhérents paient un abonnement chaque trimestre. Vous ne les gagnez donc pas une fois, vous les gardez ou vous les perdez. Chaque départ n'enlève pas seulement un abonnement à ce trimestre, il l'enlève à tous les suivants.",
  context:
    "La salle est bien équipée et le quartier est en croissance. Mais votre prédécesseur la remplissait en janvier sans se soucier de la suite, et beaucoup d'adhérents ne renouvelaient pas. Les charges, elles, tombent tous les mois de l'année.",
  dilemma: {
    question: "Aller chercher de nouveaux adhérents, ou garder ceux que vous avez ?",
    routes: [
      {
        label: "Recruter",
        gain: "Des inscriptions immédiates, de la trésorerie qui rentre tout de suite, une salle qui se remplit vite.",
        risque: "Un adhérent qui s'en va au bout d'un trimestre a coûté plus cher à recruter qu'il n'a rapporté. Et il faudra recommencer au trimestre suivant.",
      },
      {
        label: "Fidéliser",
        gain: "Un adhérent gardé rapporte à chaque trimestre sans rien coûter de plus. C'est l'effort le plus rentable de ce métier.",
        risque: "L'encadrement et l'entretien se paient maintenant, alors que le bénéfice ne se verra que dans plusieurs trimestres.",
      },
    ],
  },
  playerTeamName: "VOLT FITNESS",
  vocabulary: {
    unit: "adhérent",
    units: "adhérents",
    unitsGender: "m",
    productionLabel: "Adhésions",
    productionPlanLabel: "Adhérents à accueillir",
    priceLabel: "Abonnement trimestriel",
    leftoverLabel: "Places non vendues",
    capacityPanelTitle: "Capacité d'accueil",
    capacityLabel: "Places sur le plateau",
    capacityBottleneckLabel: "Plateau",
    capacityBottleneckHint:
      "Votre surface limite le nombre d'adhérents : ouvrir un plateau supplémentaire prend effet au tour suivant.",
    laborLabel: "Capacité d'encadrement",
    laborBottleneckHint:
      "Vos coachs limitent l'accueil : sur-vendre des abonnements sans encadrement dégrade l'expérience, donc la rétention. Embauchez avant de vendre.",
    perRoundLabel: "adhérents/tour",
    materialLabel: "Consommables adhérent",
    otherVariableLabel: "Énergie, maintenance, frais bancaires",
    supplierPanelLabel: "Parc de machines et consommables",
  },
  scenario: fitnessScenario,
  company: fitnessCompany,
  bots: fitnessBots,
  situations: FITNESS_SITUATIONS,
  kpis: ABONNEMENT_KPIS,
};

/** Tous les scénarios jouables, dans l'ordre d'affichage du sélecteur. */
export const BATIMENT_DEFINITION: ScenarioDefinition = {
  code: batimentScenario.code,
  title: "MARTEL & FILS · Tenez les chantiers",
  sector: "batiment",
  tagline: "Entreprise de rénovation, quatorze compagnons.",
  briefing:
    "Vous achetez les matériaux, vous payez vos compagnons chaque mois, et vous facturez à la fin du chantier. Vos clients règlent ensuite quand leurs procédures le permettent. Entre la dépense et la recette, il se passe des mois, et c'est vous qui financez l'attente.",
  context:
    "Votre père vous laisse l'entreprise et une réputation qui ouvre les portes. Il vous laisse aussi un carnet de commandes qui se remplit au coup par coup, des chantiers commencés dont personne n'a encore vu la facture, et un compte en banque qui ne ressemble en rien au résultat du dernier exercice.",
  dilemma: {
    question:
      "Les particuliers paient vite mais comparent tout ; les marchés publics offrent du volume et paient très tard. Où allez-vous chercher vos chantiers ce trimestre ?",
    routes: [
      {
        label: "Les particuliers, qui règlent à la réception",
        gain: "L'argent rentre vite, l'acompte finance les matériaux, et le bouche-à-oreille d'un quartier vaut toutes les publicités.",
        risque: "Ils demandent trois devis, négocient chaque ligne, et un chantier gagné aujourd'hui ne dit rien de celui du trimestre prochain.",
      },
      {
        label: "Les marchés publics, qui remplissent le planning",
        gain: "Des surfaces importantes, des équipes occupées plusieurs mois d'affilée, et un donneur d'ordre qui ne fait jamais faillite.",
        risque: "Le prix est tiré au plus bas, le mandatement arrive des mois après la réception, et une retenue de garantie dort encore un an de plus.",
      },
    ],
  },
  playerTeamName: "MARTEL & FILS",
  vocabulary: {
    unit: "mètre carré",
    units: "mètres carrés",
    unitsGender: "m",
    productionLabel: "Chantiers",
    productionPlanLabel: "Surface à traiter",
    priceLabel: "Prix au mètre carré",
    leftoverLabel: "Chantiers en cours",
    capacityPanelTitle: "Capacité de chantier",
    capacityLabel: "Capacité du matériel",
    capacityBottleneckLabel: "Matériel",
    capacityBottleneckHint:
      "Vos échafaudages et vos fourgons limitent les chantiers menés de front : le matériel acheté ce trimestre n'entre en service qu'au suivant.",
    laborLabel: "Capacité des compagnons",
    laborBottleneckHint:
      "Vos compagnons limitent la surface traitée : embaucher prend un trimestre, et la sous-traitance coûte une part de la marge.",
    perRoundLabel: "m²/tour",
    materialLabel: "Matériaux",
    otherVariableLabel: "Location de matériel, évacuation",
    supplierPanelLabel: "Fournisseur de matériaux",
  },
  scenario: batimentScenario,
  company: batimentCompany,
  bots: batimentBots,
  situations: BATIMENT_SITUATIONS,
  kpis: BATIMENT_KPIS,
};

export const TRANSPORT_DEFINITION: ScenarioDefinition = {
  code: transportScenario.code,
  title: "ROUTE & CIE · Remplissez les camions",
  sector: "transport",
  tagline: "Transporteur routier régional, douze porteurs.",
  briefing:
    "Vos camions partent chaque matin, chargés ou non. Le gazole, les péages et le chauffeur se paient de la même façon dans les deux cas. Une place vide au départ est perdue pour toujours : tout le métier consiste à décider ce qu'on met dedans, et à quel prix, avant que la porte ne se ferme.",
  context:
    "L'entreprise familiale tourne depuis trente ans et ses clients industriels la connaissent. Mais la flotte vieillit, les chauffeurs se font rares, et le prix du carburant décide désormais du résultat sans que personne ici n'ait son mot à dire. Le fondateur partait du principe qu'un camion plein était un camion rentable.",
  dilemma: {
    question:
      "Les industriels sous contrat paient bien mais exigent une ponctualité sans faille ; la bourse de fret remplit les retours au prix du jour. Sur quoi bâtissez-vous votre trimestre ?",
    routes: [
      {
        label: "Les contrats industriels, réguliers et exigeants",
        gain: "Un trafic prévisible, des tarifs qui tiennent, et des clients qui restent des années tant que les livraisons arrivent à l'heure.",
        risque: "La moindre défaillance se paie en pénalités, et ils règlent avec les délais des grandes maisons, pendant que le gazole se paie presque comptant.",
      },
      {
        label: "La bourse de fret, qui remplit les retours",
        gain: "De quoi charger des camions qui rentreraient vides, encaissé sous quarante-huit heures, sans engagement d'aucune sorte.",
        risque: "Le prix se refait chaque matin, la fidélité n'existe pas, et une entreprise qui vit de la bourse ne couvre plus ses charges de structure.",
      },
    ],
  },
  playerTeamName: "ROUTE & CIE",
  vocabulary: {
    unit: "palette",
    units: "palettes",
    unitsGender: "f",
    productionLabel: "Transport",
    productionPlanLabel: "Palettes à charger",
    priceLabel: "Prix à la palette",
    leftoverLabel: "Kilomètres à vide",
    capacityPanelTitle: "Capacité de transport",
    capacityLabel: "Capacité de la flotte",
    capacityBottleneckLabel: "Flotte",
    capacityBottleneckHint:
      "Vos camions limitent le trafic : un porteur supplémentaire se commande un trimestre avant de rouler, et il coûte dès qu'il est immatriculé.",
    laborLabel: "Capacité de conduite",
    laborBottleneckHint:
      "Vos chauffeurs limitent le trafic : ils manquent partout, et ils partent au premier employeur qui paie mieux.",
    perRoundLabel: "palettes/tour",
    materialLabel: "Gazole et péages",
    otherVariableLabel: "Entretien, pneumatiques, primes",
    supplierPanelLabel: "Fourniture de carburant",
  },
  scenario: transportScenario,
  company: transportCompany,
  bots: transportBots,
  situations: TRANSPORT_SITUATIONS,
  kpis: TRANSPORT_KPIS,
};

export const SCENARIOS: ScenarioDefinition[] = [
  NOVA_DEFINITION,
  BOUTIQUE_DEFINITION,
  HOTEL_DEFINITION,
  BISTROT_DEFINITION,
  CONSEIL_DEFINITION,
  ECOMMERCE_DEFINITION,
  FITNESS_DEFINITION,
  BATIMENT_DEFINITION,
  TRANSPORT_DEFINITION,
];

export const DEFAULT_SCENARIO_CODE = NOVA_DEFINITION.code;

const byCode = new Map(SCENARIOS.map((s) => [s.code, s]));

/**
 * Définition d'un code de scénario. Un code inconnu (partie créée avec une
 * version antérieure, snapshot exotique) retombe sur NOVA plutôt que de faire
 * planter une partie en cours.
 */
export function scenarioByCode(code: string | undefined | null): ScenarioDefinition {
  return (code ? byCode.get(code) : undefined) ?? NOVA_DEFINITION;
}

/** Toutes les situations, tous scénarios confondus (référentiel à semer). */
export const ALL_SITUATIONS: SituationDef[] = SCENARIOS.flatMap((s) => s.situations);

export const situationByCode = new Map(ALL_SITUATIONS.map((s) => [s.code, s]));

/**
 * Valeurs économiques d'un scénario, mises en forme pour l'affichage en
 * filigrane du panneau enseignant. `null` = levier que ce scénario n'ouvre
 * pas (pas de bloc trésorerie, pas d'échéancier d'emprunt).
 */
export function economicDefaults(d: ScenarioDefinition): Record<string, string | null> {
  const s = d.scenario;
  const pct = (v: number | undefined) =>
    v === undefined ? null : (v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const num = (v: number | undefined) =>
    v === undefined ? null : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  // Délai client représentatif : le plus long des segments qui font crédit.
  // Ceux payés comptant ne sont pas concernés par le réglage.
  const creditDelays = s.market.segments
    .map((seg) => seg.paymentDelayDays)
    .filter((v) => v > 0);
  return {
    taxRate: pct(s.finance.taxRate),
    vatRate: pct(s.finance.vatRate ?? 0),
    customerPaymentDelayDays: num(creditDelays.length ? Math.max(...creditDelays) : 0),
    supplierPaymentDelayDays: num(s.finance.supplierPaymentDelayDays),
    loanAnnualRate: pct(s.finance.loanAnnualRate),
    loanDurationRounds: num(s.finance.loanDurationRounds),
    overdraftAnnualRate: pct(s.finance.overdraftAnnualRate),
    overdraftLimit: num(s.finance.overdraftLimit),
    discountMaxShare: pct(s.treasury?.discountMaxShare),
    factoringFeeRate: pct(s.treasury?.factoringFeeRate),
    fixedCostsPerRound: num(s.fixedCostsPerRound),
    materialCostPerUnit: num(s.product.materialCostPerUnit),
    otherVariableCostPerUnit: num(s.product.otherVariableCostPerUnit),
    depreciationPerRound: num(s.finance.depreciationPerRound),
    baseDefectRate: pct(s.qualityCosts?.baseDefectRate ?? 0),
  };
}

/** Le scénario auquel appartient une situation — pour retrouver son vocabulaire. */
export const scenarioCodeBySituationCode = new Map(
  SCENARIOS.flatMap((d) => d.situations.map((s) => [s.code, d.code] as const)),
);
