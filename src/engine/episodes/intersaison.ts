/**
 * L'INTERSAISON QUI ASSÈCHE LA CAISSE — le modèle de L'Escale Megève.
 *
 * Un hôtel 4 étoiles de 38 chambres et sa Table d'Augustin, ouverts de
 * mi-décembre à mi-avril et en juillet-août. Le trimestre va du lundi 13 avril,
 * dernière semaine de la saison d'hiver, au dimanche 12 juillet : la
 * fermeture, les travaux d'intersaison, la réouverture du jeudi 2 juillet.
 * Treize semaines, six décisions. Quatre mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LE BFR S'INVERSE AVEC LA SAISON. L'hiver encaisse avant de payer : les
 *     clients versent des acomptes et paient à leur départ, les saisonniers,
 *     l'URSSAF, l'État et les fournisseurs sont payés un mois ou deux plus
 *     tard. Au 13 avril, la trésorerie nette de 420 k€ est faite d'un BFR de
 *     −406 k€ : ce sont, pour l'essentiel, les dettes de l'hiver. La fermeture
 *     les fait tomber (soldes de tout compte, cotisations, TVA, commissions,
 *     fournisseurs) quand plus rien n'entre, et les travaux d'intersaison
 *     s'y ajoutent. Le plan de trésorerie touche son point bas fin juin, juste
 *     avant la réouverture : un besoin prévisible, qui revient chaque année et
 *     disparaît chaque été. Un besoin SAISONNIER, qui se finance par un crédit
 *     de campagne (une ligne saisonnière), pas par un prêt à cinq ans dont
 *     l'argent dormirait dix mois sur douze.
 *   · LES ACOMPTES SONT UNE RESSOURCE, PAS UN DÛ. Ceux que versent les clients
 *     de l'été et de l'hiver prochain entrent tout de suite, et réduisent
 *     d'autant ce qu'il faut emprunter. Mais un acompte trop élevé fait perdre
 *     des réservations directes là où la demande hésite (l'été, les semaines
 *     creuses de l'hiver) ; il ne coûte presque rien là où elle déborde (les
 *     fêtes, les vacances de février), et y protège des annulations tardives.
 *   · LES TRAVAUX REPORTÉS SE PAIENT PLUS TARD, ET PLUS CHER. Reporter
 *     l'entretien à l'automne soulage la trésorerie de juin ; il faudra le
 *     faire quand toutes les entreprises de la station sont prises (10 % plus
 *     cher), avec une chambre froide qui peut lâcher cet été, des chaudières
 *     qui tomberont en panne l'hiver, des chambres fatiguées qui coûtent des
 *     notes et du prix.
 *   · LE CRÉDIT LE PLUS CHER EST CELUI QU'ON NÉGOCIE DANS L'URGENCE. Au-delà de
 *     la facilité de caisse, la Banque des Aravis laisse passer 30 k€ à 16 %
 *     l'an, puis rejette les prélèvements et les virements. Après un premier
 *     rejet, elle consent un découvert exceptionnel à ses conditions : 11 %,
 *     5 000 € de frais et de caution du groupe, et un incident qui dégrade la
 *     cotation de l'hôtel. La ligne négociée en avril, plan à l'appui, coûte
 *     4,8 % sur ce qu'on utilise. Étaler les fournisseurs « au feeling »
 *     emprunte à 12,15 % (le taux des pénalités légales), sans compter ce
 *     qu'ils retirent ensuite.
 *
 * L'OBJECTIF, en euros : LA TRÉSORERIE CORRIGÉE DE MI-JUILLET. On part de la
 * trésorerie nette en fin de semaine 13 (solde du compte, moins la ligne
 * saisonnière, le découvert et l'avance du siège : tout ce qui est à rendre à
 * court terme). On en retire ce qui n'est qu'un décalage, qui ferait paraître
 * la caisse meilleure sans rien gagner :
 *   − les acomptes encaissés pendant le trimestre pour des séjours à venir
 *     (c'est l'argent des clients tant que le séjour n'a pas eu lieu) ;
 *   − les paiements du plan d'avril qui restent à faire au 12 juillet
 *     (travaux reportés, factures étalées ou rééchelonnées, prélèvements
 *     rejetés : étaler n'est pas encaisser) ;
 *   − le capital d'un prêt à moyen terme obtenu pendant le trimestre ;
 *   + ce qui a été payé d'avance pour l'après-trimestre (les vins de l'été).
 * Et on y ajoute ce que les choix coûtent ou rapportent après le trimestre :
 * le surcoût d'automne des travaux reportés, les pannes, notes et prix perdus
 * des saisons suivantes, la valeur des réservations perdues ou protégées, la
 * ristourne perdue, la cotation dégradée par un incident, le portage d'un prêt
 * inutile, la valeur du contrat d'Alpine Horizons pour l'hiver prochain. Les
 * agios, commissions, frais, pénalités, pannes et recettes perdues du
 * trimestre sont déjà dans la trésorerie. Ainsi, ce que vaut un acompte, c'est
 * l'emprunt qu'il évite ; ce que vaut un report, c'est ce qu'il coûte.
 *
 * Le BFR est tenu poste par poste (créances, stocks, dettes, acomptes reçus) ;
 * le fonds de roulement s'en déduit : FRNG = trésorerie nette + BFR.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres fictifs ; montants
 * hors taxes, la TVA mise à part (sauf celle que l'hôtel reverse).
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAMBRES = 38;

/* ---------------------------------------------------------------------------
 * LA SITUATION DU LUNDI 13 AVRIL : la fin de l'hiver.
 * ------------------------------------------------------------------------- */

/** La trésorerie nette : le compte est créditeur, aucun concours bancaire. */
export const TRESORERIE_DEPART = 420000;
/** La facture de mars-avril d'Alpine Horizons, payée à 30 jours en semaine 4. */
export const CREANCE_TO = 58000;
export const SEMAINE_TO = 4;
/** Vins et épicerie restés en cave à la fermeture. */
export const STOCKS_DEPART = 30000;
/** Les acomptes déjà reçus pour l'été et l'hiver prochain, avant le 13 avril. */
export const ACOMPTES_DEPART = 40000;
/** Les recettes de la dernière semaine de saison, encaissées au départ des clients. */
export const VENTES_FIN_SAISON = 64000;
/** Ce que coûte cette dernière semaine, payé ensuite avec les échéances. */
export const CHARGES_FIN_SAISON = 50000;

/** Les échéances de l'intersaison, semaine par semaine. */
export const ECHEANCES: Readonly<Record<number, { montant: number; quoi: string }>> = {
  1: { montant: 92000, quoi: "cotisations sociales de mars" },
  2: { montant: 118000, quoi: "soldes de tout compte et paie d'avril des 42 saisonniers" },
  3: { montant: 52000, quoi: "TVA de mars et taxe de séjour de l'hiver" },
  4: { montant: 34000, quoi: "commissions de Bookalia et Voyagio sur mars et avril" },
  5: { montant: 58000, quoi: "cotisations sociales d'avril" },
};
/** Les factures des fournisseurs de l'hiver, par semaine d'échéance. */
export const FOURNISSEURS_HIVER: Readonly<Record<number, number>> = {
  7: 55000,
  8: 50000,
  9: 45000,
};
export const TOTAL_FOURNISSEURS = 150000;
const TOTAL_ECHEANCES = Object.values(ECHEANCES).reduce((s, e) => s + e.montant, 0);
/** Les dettes de l'hiver au 13 avril : tout ce qui sera payé, moins la dernière semaine. */
export const DETTES_DEPART = TOTAL_ECHEANCES + TOTAL_FOURNISSEURS - CHARGES_FIN_SAISON;
/** BFR = créances + stocks − dettes − acomptes reçus : −406 k€, une ressource. */
export const BFR_DEPART = CREANCE_TO + STOCKS_DEPART - DETTES_DEPART - ACOMPTES_DEPART;
/** FRNG = trésorerie nette + BFR : l'hôtel vit, à la fin de l'hiver, de son BFR négatif. */
export const FRNG_DEPART = TRESORERIE_DEPART + BFR_DEPART;

/** Salaires des neuf permanents, crédit-bail des murs, assurances, énergie, abonnements. */
export const FIXES = 16000;

/* ---------------------------------------------------------------------------
 * LES TRAVAUX D'INTERSAISON.
 * ------------------------------------------------------------------------- */
export const TRAVAUX = {
  /** Sécurité incendie, ascenseur, contrôles : obligatoire. */
  reglementaire: 40000,
  /** Chaudières, centrale de traitement d'air : préventif. */
  preventif: 45000,
  /** Chambre froide et hotte de la Table d'Augustin. */
  cuisine: 40000,
  /** Peinture, moquettes et literie de douze chambres. */
  chambres: 95000,
} as const;
export const TOTAL_TRAVAUX =
  TRAVAUX.reglementaire + TRAVAUX.preventif + TRAVAUX.cuisine + TRAVAUX.chambres;
/** Acompte de 30 % à la commande, 35 % sur situation, solde à la réception. */
export const CALENDRIER_TRAVAUX: Readonly<Record<number, number>> = { 5: 0.3, 7: 0.35, 10: 0.35 };
export const SEMAINES_CHANTIER = [5, 6, 7, 8, 9, 10] as const;
/** À l'automne, toutes les entreprises de la station sont prises : 10 % plus cher. */
export const MAJORATION_AUTOMNE = 0.1;
/** Le solde à 60 jours après la réception, contre 2,5 % de plus. */
export const SURCOUT_ECHEANCIER_TRAVAUX = 0.025;
/** Les chambres non rafraîchies : notes et prix de l'été et de l'hiver suivants. */
export const VALEUR_CHAMBRES = 16000;
/** Et, dès la réouverture, 3 % de recettes en moins. */
export const RECETTES_CHAMBRES = 0.03;
/** Le préventif reporté : pannes et gestes commerciaux de l'hiver prochain, en moyenne. */
export const VALEUR_PREVENTIF = 11000;
/** La chambre froide de quatorze ans, sans révision : une chance sur trois de lâcher cet été. */
export const CHANCE_PANNE_FROID = 0.35;
export const PANNE_FROID = 9000;

/* ---------------------------------------------------------------------------
 * LA RÉOUVERTURE DU JEUDI 2 JUILLET.
 * ------------------------------------------------------------------------- */
/** Le chiffre d'affaires des premières semaines, et ce que les acomptes déjà reçus en ont payé. */
export const CA_ETE: Readonly<Record<number, number>> = { 12: 38000, 13: 52000 };
export const ACOMPTES_CONSOMMES: Readonly<Record<number, number>> = { 12: 4000, 13: 6000 };
/** Les salaires des saisonniers d'été : ce qui court, et la paie de juin. */
export const SALAIRES_ETE: Readonly<Record<number, number>> = { 11: 14000, 12: 22000, 13: 26000 };
export const PAIE_JUIN = 22000;
export const SEMAINE_PAIE_JUIN = 12;
/** Le stock de réouverture livré en semaine 11, payé à 30 jours. */
export const STOCK_REOUVERTURE = 40000;
export const SEMAINE_REOUVERTURE = 12;

/* ---------------------------------------------------------------------------
 * LES ACOMPTES DE RÉSERVATION.
 * ------------------------------------------------------------------------- */
export type Periode = "ete" | "fetes" | "fevrier" | "autres";
export const PERIODES: readonly Periode[] = ["ete", "fetes", "fevrier", "autres"];
/** Les réservations directes prises chaque semaine, pour des séjours d'après le 12 juillet. */
export const RESERVATIONS: Readonly<Record<Periode, number>> = {
  ete: 15000,
  fetes: 8000,
  fevrier: 6000,
  autres: 4000,
};
export const RESERVATIONS_PAR_SEMAINE = PERIODES.reduce((s, p) => s + RESERVATIONS[p], 0);
export const ACOMPTE_ACTUEL = 0.2;
/** La nouvelle politique d'acomptes s'applique aux réservations à partir de la semaine 3. */
export const SEMAINE_POLITIQUE = 3;
export const POLITIQUES: readonly Readonly<Record<Periode, number>>[] = [
  { ete: 0.2, fetes: 0.2, fevrier: 0.2, autres: 0.2 },
  { ete: 0.5, fetes: 0.5, fevrier: 0.5, autres: 0.5 },
  { ete: 0.3, fetes: 0.3, fevrier: 0.3, autres: 0.3 },
  { ete: 0.2, fetes: 0.5, fevrier: 0.5, autres: 0.2 },
];
/** La part des réservations directes perdue par point d'acompte au-delà de 20 %. */
export const SENSIBILITE: Readonly<Record<Periode, number>> = {
  ete: 0.5,
  fetes: 0.05,
  fevrier: 0.1,
  autres: 0.6,
};
/**
 * Ce que coûte un euro de réservation directe perdue : la marge d'une chambre
 * restée vide, ou la commission d'une plateforme quand le client y réserve.
 * Presque rien aux fêtes : la liste d'attente reprend la chambre.
 */
export const VALEUR_PERDUE: Readonly<Record<Periode, number>> = {
  ete: 0.5,
  fetes: 0.05,
  fevrier: 0.2,
  autres: 0.6,
};
/** La part des réservations annulées tardivement : l'acompte versé est conservé. */
export const ANNULATIONS_TARDIVES = 0.06;
export const perteDeReservations = (taux: number, p: Periode) =>
  Math.max(0, taux - ACOMPTE_ACTUEL) * SENSIBILITE[p];

/* ---------------------------------------------------------------------------
 * LE PLAN DE TRÉSORERIE D'AVRIL : la politique actuelle, aucun financement nouveau.
 * ------------------------------------------------------------------------- */
const TRAVAUX_DE = (w: number, montant: number) => (CALENDRIER_TRAVAUX[w] ?? 0) * montant;
/** Les flux du plan, semaine par semaine : ce que les sources de la semaine 1 détaillent. */
export function fluxDuPlan(w: number): number {
  const acomptes = RESERVATIONS_PAR_SEMAINE * ACOMPTE_ACTUEL;
  return (
    acomptes -
    FIXES +
    (w === 1 ? VENTES_FIN_SAISON : 0) +
    (w === SEMAINE_TO ? CREANCE_TO : 0) +
    (CA_ETE[w] ?? 0) -
    (ACOMPTES_CONSOMMES[w] ?? 0) -
    (ECHEANCES[w]?.montant ?? 0) -
    (FOURNISSEURS_HIVER[w] ?? 0) -
    TRAVAUX_DE(w, TOTAL_TRAVAUX) -
    (w === SEMAINE_PAIE_JUIN ? PAIE_JUIN : 0)
  );
}
export const TRESORERIE_DU_PLAN: readonly number[] = Array.from({ length: SEMAINES + 1 }, (_, w) =>
  Array.from({ length: w }, (__, k) => fluxDuPlan(k + 1)).reduce(
    (s, x) => s + x,
    TRESORERIE_DEPART,
  ),
);
/** Le point bas du plan d'avril : fin juin, juste avant la réouverture. */
export const POINT_BAS_PLAN = Math.min(...TRESORERIE_DU_PLAN);
export const SEMAINE_POINT_BAS_PLAN = TRESORERIE_DU_PLAN.indexOf(POINT_BAS_PLAN);
/** La trésorerie corrigée du plan : celle de mi-juillet, acomptes du trimestre retirés. */
export const PLAN_CORRIGE =
  TRESORERIE_DU_PLAN[SEMAINES]! - SEMAINES * RESERVATIONS_PAR_SEMAINE * ACOMPTE_ACTUEL;

/* ---------------------------------------------------------------------------
 * LA BANQUE DES ARAVIS, ET LES AUTRES FINANCEMENTS.
 * ------------------------------------------------------------------------- */
/** La facilité de caisse déjà en place. */
export const AUTORISATION = 50000;
export const TAUX_DECOUVERT = 0.085;
/** Ce que la banque laisse passer au-delà, à un taux majoré ; plus loin, elle rejette. */
export const TOLERANCE = 30000;
export const TAUX_DEPASSEMENT = 0.16;
export const COMMISSION_INTERVENTION = 250;
/** Une semaine dans la tolérance : la banque rejette d'autant plus souvent qu'on la dépasse. */
export const risqueDeRejet = (depassement: number) =>
  depassement > 0 ? Math.min(0.9, 0.3 + depassement / 50000) : 0;
/** Un rejet : frais de rejet, majorations de l'URSSAF, pénalités des fournisseurs. */
export const FRAIS_INCIDENT = 5000;
/** L'incident dégrade la cotation : la ligne de l'an prochain coûtera plus cher. */
export const VALEUR_INCIDENT = 5000;
/** Le découvert exceptionnel consenti après un rejet : frais de dossier et caution du groupe. */
export const TAUX_URGENCE = 0.11;
export const FRAIS_URGENCE = 5000;

/** La ligne saisonnière : le point bas du plan, moins la facilité de caisse, arrondi. */
export const LIGNE = 250000;
export const TAUX_LIGNE = 0.048;
/** La commission d'engagement, sur le montant autorisé. */
export const ENGAGEMENT = 0.005;
export const FRAIS_LIGNE = 1500;
export const SEMAINE_LIGNE = 3;
/** Plan à l'appui, le comité accorde la ligne neuf fois sur dix. */
export const CHANCE_LIGNE = 0.9;

export const PRET = 300000;
export const TAUX_PRET = 0.044;
export const FRAIS_PRET = 2000;
export const SEMAINE_PRET = 6;
export const CHANCE_PRET = 0.85;
/** Les intérêts d'un argent qui dort l'hiver, ou l'indemnité pour le rembourser : en moyenne. */
export const PORTAGE_PRET = 6000;

/** La facilité de caisse portée à 300 k€ sur une simple demande : rarement accordée. */
export const DECOUVERT_RELEVE = 300000;
export const COMMISSION_RELEVEMENT = 1000;
/** La commission de plus fort découvert, par mois, sur le découvert utilisé. */
export const CPFD = 0.0005;
export const CHANCE_RELEVEMENT = 0.4;

/** Semaine 8 : la ligne portée à 400 k€, plan à jour à l'appui. */
export const RELEVEMENT_LIGNE = 150000;
export const FRAIS_RELEVEMENT_LIGNE = 600;
export const SEMAINE_RELEVEMENT = 9;
/** Sans ligne jusque-là, une ligne négociée en juin : plus tard, et plus cher. */
export const LIGNE_TARDIVE = 400000;
export const TAUX_LIGNE_TARDIVE = 0.058;
export const FRAIS_LIGNE_TARDIVE = 1500;
export const SEMAINE_LIGNE_TARDIVE = 10;
/** L'avance du siège, selon la convention de trésorerie du groupe. */
export const AVANCE_SIEGE = 100000;
export const TAUX_SIEGE = 0.05;
export const FRAIS_SIEGE = 1500;
export const SEMAINE_SIEGE = 10;

/* ---------------------------------------------------------------------------
 * LES FOURNISSEURS (décision 4).
 * ------------------------------------------------------------------------- */
/** Les pénalités légales de retard : le taux de la BCE plus dix points. */
export const TAUX_PENALITES = 0.1215;
export const INDEMNITE_FORFAITAIRE = 40;
export const FACTURES_HIVER = 34;
/** « Au feeling » : chaque échéance glisse de six semaines. */
export const GLISSEMENT = 6;
/** La Blanchisserie du Fier suspend le service une fois sur deux : la réouverture sans linge. */
export const CHANCE_BLANCHISSERIE = 0.5;
export const PERTE_LINGE = 10000;
/** Le négociant ne verse sa ristourne de fin d'année qu'aux clients à jour. */
export const CHANCE_RISTOURNE_PERDUE = 0.6;
export const RISTOURNE = 5400;
/** L'échéancier écrit : la moitié six semaines plus tard, 1 % de frais sur la part reportée. */
export const PART_ECHEANCIER = 0.5;
export const FRAIS_ECHEANCIER = 0.01;
/** La remise de pré-saison de Maison Vuarand : 4 % sur les vins de l'été, payés fin juin. */
export const VINS_ETE = 62000;
export const REMISE_VINS = 0.04;
export const SEMAINE_VINS = 11;

/* ---------------------------------------------------------------------------
 * LA LÉGIONELLE (décision 5).
 * ------------------------------------------------------------------------- */
/** Remplacer le réseau d'eau chaude du deuxième étage, payé en semaine 11. */
export const AVENANT = 46000;
export const SEMAINE_AVENANT = 11;
/** Choc thermique et chloration seulement, en semaine 9 ; le réseau refait à l'automne. */
export const TRAITEMENT = 6000;
/** Après un simple traitement, les analyses de réouverture restent positives presque une fois sur deux. */
export const CHANCE_LEGIONELLE = 0.45;
/** Un étage fermé une semaine, des clients délogés, un second traitement. */
export const PERTE_LEGIONELLE = 17000;

/* ---------------------------------------------------------------------------
 * LE CONTRAT D'ALPINE HORIZONS (décision 6), pour l'hiver prochain.
 * ------------------------------------------------------------------------- */
export const CHAMBRES_TO = 6;
/** Fêtes et vacances de février : six semaines pleines ; les onze autres, à moitié vides. */
export const SEMAINES_HAUTES = 6;
export const SEMAINES_BASSES = 11;
export const TO_HAUTES = 0.98;
export const PM_HAUTES = 560;
export const TO_BASSES = 0.6;
export const PM_BASSES = 300;
/** Le coût variable d'une nuitée : linge, produits d'accueil, énergie, ménage. */
export const COUT_VARIABLE = 21;
export const PRIX_TO = 280;
export const PRIX_PLANCHER = 250;
export const ACOMPTE_TO = 0.3;
/** Alpine Horizons accepte trois contre-propositions sur quatre au prix qu'il demande. */
export const CHANCE_ALPINE = 0.75;
export const NUITEES_HAUTES = CHAMBRES_TO * SEMAINES_HAUTES * 7;
export const NUITEES_BASSES = CHAMBRES_TO * SEMAINES_BASSES * 7;
/**
 * Ce qu'un engagement ferme rapporte sur les semaines basses, par rapport à la
 * vente directe : tout est payé, quand 60 % seulement se serait vendu à 300 €,
 * moins le coût variable des nuitées en plus.
 */
export const gainBasses = (prix: number) =>
  NUITEES_BASSES * prix -
  NUITEES_BASSES * TO_BASSES * PM_BASSES -
  NUITEES_BASSES * (1 - TO_BASSES) * COUT_VARIABLE;
/** Ce qu'il coûte sur les semaines hautes : des chambres qui se seraient vendues 560 €. */
export const perteHautes = (prix: number) =>
  NUITEES_HAUTES * TO_HAUTES * PM_HAUTES -
  NUITEES_HAUTES * prix +
  NUITEES_HAUTES * (1 - TO_HAUTES) * COUT_VARIABLE;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les entreprises de travaux facturent l'attente. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  financement: 0,
  acomptes: 1,
  travaux: 2,
  fournisseurs: 3,
  legionelle: 4,
  alpine: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [1, 0, 0, 0, 1, 2] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: {
    /** Une charge payée la semaine même. */
    perte?: number;
    /** Des recettes d'été perdues en semaine 13. */
    seminaire?: number;
    /** Un facteur sur les recettes des deux semaines d'été. */
    ete?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "degat",
    titre: "Un dégât des eaux pendant le chantier",
    de: "Zéphyrin Chevallay",
    role: "Responsable technique",
    texte:
      "Une canalisation a cédé au troisième étage pendant le décapage : deux plafonds à refaire. L'assurance prend le reste, mais la franchise et les jours d'équipe perdus font 9 k€.",
    effet: { perte: 9000 },
  },
  {
    id: "prudhommes",
    titre: "Un saisonnier conteste son solde de tout compte",
    de: "Fleurine Rosset",
    role: "Comptable",
    texte:
      "Un commis de cuisine conteste son solde de tout compte devant les prud'hommes : des heures supplémentaires de février mal décomptées. Nous transigeons en conciliation à 7 k€.",
    effet: { perte: 7000 },
  },
  {
    id: "securite",
    titre: "La commission de sécurité exige des travaux",
    de: "Zéphyrin Chevallay",
    role: "Responsable technique",
    texte:
      "La commission de sécurité passe avant la réouverture et exige de remplacer les volets de désenfumage de l'escalier ouest : 14 k€, à faire tout de suite.",
    effet: { perte: 14000 },
  },
  {
    id: "seminaire",
    titre: "Un séminaire de juillet annule",
    de: "Yousra Benattia",
    role: "Responsable des réservations",
    texte:
      "Le laboratoire qui avait réservé douze chambres et la salle pour la semaine du 6 juillet annule son séminaire. L'acompte est conservé, mais 10 k€ de recettes s'envolent.",
    effet: { seminaire: 10000 },
  },
  {
    id: "meteo",
    titre: "Un début d'été sous la pluie",
    de: "Yousra Benattia",
    role: "Responsable des réservations",
    texte:
      "Météo-France annonce un début juillet pluvieux sur les Alpes du Nord : les réservations de dernière minute pour la réouverture se font attendre.",
    effet: { ete: 0.88 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le rythme des réservations directes, semaine par semaine. */
  reservations: readonly number[];
  /** La dernière semaine de saison. */
  ventes: number;
  /** Le début de l'été : la météo, les clients de passage. */
  ete: number;
  /** Le comité de crédit de la semaine 2 : la ligne, le prêt ou le découvert. */
  uBanque: number;
  /** Chaque semaine dans la tolérance, la banque rejette-t-elle ? */
  uRejet: readonly number[];
  /** La chambre froide lâche-t-elle, si on ne l'a pas révisée ? */
  uFroid: number;
  /** Les analyses de légionelle restent-elles positives après un simple traitement ? */
  uLegionelle: number;
  /** La Blanchisserie du Fier suspend-elle le service, et le négociant sa ristourne ? */
  uBlanchisserie: number;
  uNegociant: number;
  /** Alpine Horizons accepte-t-il la contre-proposition ? */
  uAlpine: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000453 + 7);
  const reservations = [
    1,
    ...Array.from({ length: SEMAINES }, () => borne(1 + 0.15 * gauss(r), 0.6, 1.4)),
  ];
  const ventes = borne(1 + 0.08 * gauss(r), 0.8, 1.2);
  const ete = borne(1 + 0.1 * gauss(r), 0.75, 1.25);
  const uBanque = r();
  const uRejet = [1, ...Array.from({ length: SEMAINES }, () => r())];
  const uFroid = r();
  const uLegionelle = r();
  const uBlanchisserie = r();
  const uNegociant = r();
  const uAlpine = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    reservations,
    ventes,
    ete,
    uBanque,
    uRejet,
    uFroid,
    uLegionelle,
    uBlanchisserie,
    uNegociant,
    uAlpine,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Le hasard « moyen » d'une prévision : pas de bruit, pas d'imprévu, une banque qui suit. */
const HASARD_MOYEN: Hasard = {
  reservations: Array.from({ length: SEMAINES + 1 }, () => 1),
  ventes: 1,
  ete: 1,
  uBanque: 0,
  uRejet: Array.from({ length: SEMAINES + 1 }, () => 1),
  uFroid: 1,
  uLegionelle: 1,
  uBlanchisserie: 1,
  uNegociant: 1,
  uAlpine: 0,
  imprevus: [],
};

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */
export const ligneAccordeeSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.financement] === 0 && h.uBanque < CHANCE_LIGNE;
export const pretAccordeSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.financement] === 2 && h.uBanque < CHANCE_PRET;
export const relevementAccordeSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.financement] === 3 && h.uBanque < CHANCE_RELEVEMENT;
/** La réponse du comité de la semaine 2 à ce qu'on lui a demandé. */
export const banqueAccepte = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return (
    ligneAccordeeSous(chemin, h) || pretAccordeSous(chemin, h) || relevementAccordeSous(chemin, h)
  );
};
export const alpineAccepteSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.alpine] === 0 ||
  chemin[D.alpine] === 3 ||
  (chemin[D.alpine] === 1 && h.uAlpine < CHANCE_ALPINE);
export const alpineAccepte = (chemin: readonly number[], graine: number) =>
  alpineAccepteSous(chemin, hasard(graine));

/** Les travaux faits au printemps, selon la décision 3. */
export function travauxFaits(d3: number | undefined) {
  if (d3 === 1) return { reglementaire: true, preventif: false, cuisine: false, chambres: false };
  if (d3 === 2) return { reglementaire: true, preventif: true, cuisine: true, chambres: false };
  return { reglementaire: true, preventif: true, cuisine: true, chambres: true };
}
export function montantFait(d3: number | undefined) {
  const f = travauxFaits(d3);
  return (Object.keys(TRAVAUX) as (keyof typeof TRAVAUX)[]).reduce(
    (s, k) => s + (f[k] ? TRAVAUX[k] : 0),
    0,
  );
}

export type Semaine = {
  /** Trésorerie nette : solde du compte − ligne, découvert et avance du siège. */
  tresorerie: number;
  /** Ce qu'il faut financer : la trésorerie nette sous zéro, paiements rejetés compris. */
  besoin: number;
  /** Ce qui est tiré sur la ligne, le découvert et l'avance du siège. */
  concours: number;
  /** Ce qui peut l'être sans dépassement : ligne, facilité de caisse, avance. */
  disponible: number;
  /** Créances + stocks − dettes − acomptes reçus. */
  bfr: number;
  /** Trésorerie nette + BFR. */
  frng: number;
  /** Les acomptes encaissés depuis le 13 avril. */
  acomptes: number;
  /** Agios, commissions, frais, pénalités et incidents, cumulés. */
  frais: number;
  /** Ceux de la semaine. */
  fraisSemaine: number;
  /** Les paiements rejetés, à représenter. */
  rejetes: number;
  /** Les factures des fournisseurs de l'hiver échues et non payées. */
  impayes: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La trésorerie corrigée de mi-juillet (voir l'en-tête) : plus haut, mieux c'est. */
  objectif: number;
  tresorerieFinale: number;
  pointBas: number;
  semainePointBas: number;
  acomptesTrimestre: number;
  /** Les paiements du plan d'avril encore à faire au 12 juillet. */
  reportes: number;
  /** Payé d'avance pour l'après-trimestre. */
  avances: number;
  /** Ce que les choix coûtent (−) ou rapportent (+) après le trimestre. */
  valeur: number;
  fraisFinanciers: number;
  /** Ce que les réservations perdues coûtent, et ce que les acomptes conservés protègent. */
  reservationsPerdues: number;
  annulationsProtegees: number;
  travauxReportes: number;
  /** Le réseau d'eau chaude, seulement traité, à remplacer à l'automne. */
  reseauReporte: boolean;
  ligneAccordee: boolean;
  pretAccorde: boolean;
  relevementAccorde: boolean;
  refusBanque: boolean;
  /** Les semaines où la banque a rejeté des paiements. */
  incidents: readonly number[];
  /** La semaine d'où court le découvert exceptionnel ; `null` : jamais. */
  urgence: number | null;
  semainesEnDepassement: number;
  panneFroid: boolean;
  legionelle: boolean;
  lingeSuspendu: boolean;
  ristournePerdue: boolean;
  alpineSigne: boolean;
  /** La valeur du contrat d'Alpine Horizons pour l'hiver prochain. */
  valeurAlpine: number;
  recettesEte: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  return simulerSous(chemin, hasard(graine), jours, true);
}

/**
 * La prévision : les décisions prises, la suite inchangée, sans bruit ni
 * imprévu. `avenant` : le remplacement du réseau d'eau chaude est-il déjà
 * connu ? `uBanque` : la réponse du comité, une fois qu'on la connaît.
 */
export function prevoir(decisions: readonly number[], avenant = true, uBanque = 0): Trimestre {
  return simulerSous(
    NEUTRE.map((n, i) => decisions[i] ?? n),
    { ...HASARD_MOYEN, uBanque },
    0,
    avenant,
  );
}

function simulerSous(
  chemin: readonly number[],
  h: Hasard,
  jours: number,
  avenantConnu: boolean,
): Trimestre {
  const [, d2, d3, d4, d5, d6] = chemin;
  const ligne = ligneAccordeeSous(chemin, h);
  const pret = pretAccordeSous(chemin, h);
  const releve = relevementAccordeSous(chemin, h);
  const fait = travauxFaits(d3);
  const programme = montantFait(d3);
  const reporte = TOTAL_TRAVAUX - programme;
  const politique = POLITIQUES[d2 ?? 0] ?? POLITIQUES[0]!;
  const remplace = avenantConnu && d5 !== 2;
  const traite = avenantConnu && d5 === 2;

  let tn = TRESORERIE_DEPART;
  let creances = CREANCE_TO;
  let stocks = STOCKS_DEPART;
  let dettes = DETTES_DEPART;
  let acomptesRecus = ACOMPTES_DEPART;
  let acomptes = 0;
  let frais = 0;
  let valeur = 0;
  let reservationsPerdues = 0;
  let annulationsProtegees = 0;
  let rejetes = 0;
  let urgence: number | null = null;
  const incidents: number[] = [];
  let semainesEnDepassement = 0;
  let recettesEte = 0;
  let travauxPayes = 0;
  let fournisseursPayes = 0;
  /** Ce qui reste dû aux fournisseurs de l'hiver, par semaine d'échéance d'origine. */
  const duFournisseurs: { montant: number; echeance: number; paiement: number }[] = [];
  for (const [w, m] of Object.entries(FOURNISSEURS_HIVER)) {
    const e = Number(w);
    if (d4 === 1) duFournisseurs.push({ montant: m, echeance: e, paiement: e + GLISSEMENT });
    else if (d4 === 2) {
      duFournisseurs.push({ montant: m * (1 - PART_ECHEANCIER), echeance: e, paiement: e });
      duFournisseurs.push({ montant: m * PART_ECHEANCIER, echeance: e, paiement: e + GLISSEMENT });
    } else duFournisseurs.push({ montant: m, echeance: e, paiement: e });
  }

  // Ce qui tombe selon le hasard.
  const panneFroid = !fait.cuisine && h.uFroid < CHANCE_PANNE_FROID;
  const legionelle = traite && h.uLegionelle < CHANCE_LEGIONELLE;
  const lingeSuspendu = d4 === 1 && h.uBlanchisserie < CHANCE_BLANCHISSERIE;
  const ristournePerdue = d4 === 1 && h.uNegociant < CHANCE_RISTOURNE_PERDUE;
  const alpineSigne = alpineAccepteSous(chemin, h);

  const semaines: (Semaine | null)[] = [null];
  let pointBas = Infinity;
  let semainePointBas = 1;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => i.semaine === w);
    let entrees = 0;
    let sorties = FIXES;
    let fraisSemaine = 0;
    if (w === 1) {
      const ventes = VENTES_FIN_SAISON * h.ventes;
      entrees += ventes;
      dettes += CHARGES_FIN_SAISON;
      sorties += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    }

    // Les échéances de l'hiver.
    const e = ECHEANCES[w]?.montant ?? 0;
    sorties += e;
    dettes -= e;
    if (w === SEMAINE_TO) {
      entrees += creances;
      creances = 0;
    }

    // Les fournisseurs de l'hiver : à l'échéance, étalés, ou rééchelonnés.
    for (const f of duFournisseurs) {
      if (f.paiement === w && w <= SEMAINES) {
        sorties += f.montant;
        dettes -= f.montant;
        fournisseursPayes += f.montant;
      }
    }
    if (d4 === 1) {
      // Les pénalités légales sur ce qui est échu et pas payé.
      const echu = duFournisseurs
        .filter((f) => f.echeance <= w && f.paiement > w)
        .reduce((s, f) => s + f.montant, 0);
      fraisSemaine += (echu * TAUX_PENALITES) / 52;
      if (w === 7) fraisSemaine += INDEMNITE_FORFAITAIRE * FACTURES_HIVER;
    }
    if (d4 === 2 && w === 7)
      fraisSemaine += TOTAL_FOURNISSEURS * PART_ECHEANCIER * FRAIS_ECHEANCIER;
    if (d4 === 3 && w === SEMAINE_VINS) {
      const paye = VINS_ETE * (1 - REMISE_VINS);
      sorties += paye;
      stocks += paye;
    }

    // Les travaux : exécutés de la semaine 5 à la 10, payés selon le calendrier.
    if ((SEMAINES_CHANTIER as readonly number[]).includes(w)) {
      dettes += programme / SEMAINES_CHANTIER.length;
    }
    const part = CALENDRIER_TRAVAUX[w] ?? 0;
    if (part > 0) {
      // Avec l'échéancier négocié, seul l'acompte de la commande est payé ce trimestre.
      const paye = d3 === 3 ? (w === 5 ? part * programme : 0) : part * programme;
      sorties += paye;
      dettes -= paye;
      travauxPayes += paye;
    }

    // La légionelle : remplacer le réseau, ou traiter et attendre l'automne.
    if (remplace && w === SEMAINE_AVENANT) sorties += AVENANT;
    if (traite && w === 9) sorties += TRAITEMENT;

    // La réouverture.
    dettes += SALAIRES_ETE[w] ?? 0;
    if (w === SEMAINE_PAIE_JUIN) {
      sorties += PAIE_JUIN;
      dettes -= PAIE_JUIN;
    }
    if (w === SEMAINE_REOUVERTURE - 1) {
      stocks += STOCK_REOUVERTURE;
      dettes += STOCK_REOUVERTURE;
    }
    const caPrevu = CA_ETE[w] ?? 0;
    if (caPrevu > 0) {
      let facteur = h.ete;
      for (const i of h.imprevus) facteur *= i.imprevu.effet.ete ?? 1;
      if (!fait.chambres) facteur *= 1 - RECETTES_CHAMBRES;
      let ca = caPrevu * facteur;
      if (w === 13) for (const i of h.imprevus) ca -= i.imprevu.effet.seminaire ?? 0;
      if (w === SEMAINE_REOUVERTURE && lingeSuspendu) ca -= PERTE_LINGE;
      if (w === SEMAINE_REOUVERTURE && legionelle) ca -= PERTE_LEGIONELLE;
      if (w === 13 && panneFroid) ca -= PANNE_FROID;
      recettesEte += ca;
      const consommes = ACOMPTES_CONSOMMES[w] ?? 0;
      entrees += ca - consommes;
      acomptesRecus -= consommes;
      // Les consommations et commissions de l'été, payées le mois suivant.
      stocks -= 0.1 * caPrevu;
      dettes += 0.15 * caPrevu;
    }

    // Les acomptes des réservations directes, pour l'été et l'hiver prochain.
    for (const p of PERIODES) {
      const taux = w < SEMAINE_POLITIQUE ? ACOMPTE_ACTUEL : politique[p];
      const demande = RESERVATIONS[p] * h.reservations[w]!;
      const perdues = demande * perteDeReservations(taux, p);
      const prises = demande - perdues;
      const acompte = prises * taux;
      entrees += acompte;
      acomptesRecus += acompte;
      acomptes += acompte;
      reservationsPerdues += perdues * VALEUR_PERDUE[p];
      annulationsProtegees += Math.max(0, taux - ACOMPTE_ACTUEL) * ANNULATIONS_TARDIVES * prises;
    }
    // L'acompte d'Alpine Horizons, à la signature.
    if (w === 13 && alpineSigne && d6 !== undefined && d6 !== 2) {
      const nuitees = d6 === 0 ? NUITEES_BASSES + NUITEES_HAUTES : NUITEES_BASSES;
      const prix = d6 === 3 ? PRIX_PLANCHER : PRIX_TO;
      const acompte = ACOMPTE_TO * nuitees * prix;
      entrees += acompte;
      acomptesRecus += acompte;
      acomptes += acompte;
    }

    // Les imprévus.
    for (const a of actifs) sorties += a.imprevu.effet.perte ?? 0;

    // Les paiements rejetés la semaine dernière sont représentés.
    sorties += rejetes;
    dettes -= rejetes;
    rejetes = 0;

    // Les financements de la semaine.
    if (w === 2 && ligne) fraisSemaine += FRAIS_LIGNE;
    if (w === 2 && releve) fraisSemaine += COMMISSION_RELEVEMENT;
    if (w === SEMAINE_PRET && pret) {
      entrees += PRET;
      fraisSemaine += FRAIS_PRET;
    }
    let plafondLigne = ligne && w >= SEMAINE_LIGNE ? LIGNE : 0;
    let tauxLigne = TAUX_LIGNE;
    if (d5 === 0 && avenantConnu) {
      if (ligne) {
        if (w === SEMAINE_RELEVEMENT) fraisSemaine += FRAIS_RELEVEMENT_LIGNE;
        if (w >= SEMAINE_RELEVEMENT) plafondLigne = LIGNE + RELEVEMENT_LIGNE;
      } else {
        if (w === SEMAINE_LIGNE_TARDIVE) fraisSemaine += FRAIS_LIGNE_TARDIVE;
        if (w >= SEMAINE_LIGNE_TARDIVE) {
          plafondLigne = LIGNE_TARDIVE;
          tauxLigne = TAUX_LIGNE_TARDIVE;
        }
      }
    }
    const plafondSiege = d5 === 3 && avenantConnu && w >= SEMAINE_SIEGE ? AVANCE_SIEGE : 0;
    if (d5 === 3 && avenantConnu && w === SEMAINE_SIEGE) fraisSemaine += FRAIS_SIEGE;
    const autorisation = releve && w >= SEMAINE_LIGNE ? DECOUVERT_RELEVE : AUTORISATION;
    if (urgence !== null && w === urgence) fraisSemaine += FRAIS_URGENCE;

    const avant = tn + entrees - sorties - fraisSemaine;
    let besoin = Math.max(0, -avant);
    const surLigne = Math.min(besoin, plafondLigne);
    besoin -= surLigne;
    const surSiege = Math.min(besoin, plafondSiege);
    besoin -= surSiege;
    const surDecouvert = Math.min(besoin, autorisation);
    besoin -= surDecouvert;
    const enUrgence = urgence !== null && w >= urgence ? besoin : 0;
    besoin -= enUrgence;
    const toleree = Math.min(besoin, TOLERANCE);
    const auDela = besoin - toleree;
    const rejet = auDela > 1e-6 || (toleree > 1e-6 && h.uRejet[w]! < risqueDeRejet(toleree));

    let agios =
      (surLigne * tauxLigne +
        surSiege * TAUX_SIEGE +
        surDecouvert * TAUX_DECOUVERT +
        enUrgence * TAUX_URGENCE) /
      52;
    agios += (plafondLigne * ENGAGEMENT) / 52;
    if (releve && w >= SEMAINE_LIGNE) agios += (surDecouvert * CPFD * 12) / 52;
    if (toleree > 1e-6) {
      semainesEnDepassement += 1;
      if (!rejet) agios += (toleree * TAUX_DEPASSEMENT) / 52 + COMMISSION_INTERVENTION;
    }
    fraisSemaine += agios;
    if (rejet) {
      // La banque rejette ce qui dépasse : les factures restent dues, l'incident est déclaré.
      rejetes = toleree + auDela;
      dettes += rejetes;
      fraisSemaine += FRAIS_INCIDENT;
      if (incidents.length === 0) valeur -= VALEUR_INCIDENT;
      incidents.push(w);
      if (urgence === null) urgence = w + 1;
    }
    tn = avant + rejetes - agios - (rejet ? FRAIS_INCIDENT : 0);
    frais += fraisSemaine;

    if (tn < pointBas) {
      pointBas = tn;
      semainePointBas = w;
    }
    const concours = surLigne + surSiege + surDecouvert + enUrgence + (rejet ? 0 : toleree);
    const impayes = duFournisseurs
      .filter((f) => f.echeance <= w && f.paiement > w)
      .reduce((s, f) => s + f.montant, 0);
    const bfr = creances + stocks - dettes - acomptesRecus;
    semaines.push({
      tresorerie: tn,
      besoin: Math.max(0, rejetes - tn),
      concours,
      disponible: plafondLigne + plafondSiege + autorisation,
      bfr,
      frng: tn + bfr,
      acomptes,
      frais,
      fraisSemaine,
      rejetes,
      impayes,
    });
  }

  // Ce qui n'est qu'un décalage.
  const travauxDuPlan = Object.values(CALENDRIER_TRAVAUX).reduce(
    (s, x) => s + x * TOTAL_TRAVAUX,
    0,
  );
  const reportes =
    travauxDuPlan - travauxPayes + (TOTAL_FOURNISSEURS - fournisseursPayes) + rejetes;
  const avances = d4 === 3 ? VINS_ETE * (1 - REMISE_VINS) : 0;

  // Ce que les choix coûtent ou rapportent après le trimestre.
  valeur += annulationsProtegees - reservationsPerdues;
  const travauxReportes = reporte;
  valeur -= reporte * MAJORATION_AUTOMNE;
  if (!fait.chambres) valeur -= VALEUR_CHAMBRES;
  if (!fait.preventif) valeur -= VALEUR_PREVENTIF;
  if (d3 === 3) valeur -= programme * SURCOUT_ECHEANCIER_TRAVAUX;
  if (traite) valeur -= AVENANT * (1 + MAJORATION_AUTOMNE);
  if (ristournePerdue) valeur -= RISTOURNE;
  if (d4 === 3) valeur += VINS_ETE * REMISE_VINS;
  if (pret) valeur -= PORTAGE_PRET;
  let valeurAlpine = 0;
  if (alpineSigne && d6 === 0) valeurAlpine = gainBasses(PRIX_TO) - perteHautes(PRIX_TO);
  else if (alpineSigne && d6 === 1) valeurAlpine = gainBasses(PRIX_TO);
  else if (alpineSigne && d6 === 3) valeurAlpine = gainBasses(PRIX_PLANCHER);
  valeur += valeurAlpine;

  const objectif = tn - acomptes - reportes + avances - (pret ? PRET : 0) + valeur;

  return {
    semaines,
    objectif,
    tresorerieFinale: tn,
    pointBas,
    semainePointBas,
    acomptesTrimestre: acomptes,
    reportes,
    avances,
    valeur,
    fraisFinanciers: frais,
    reservationsPerdues,
    annulationsProtegees,
    travauxReportes,
    reseauReporte: traite,
    ligneAccordee: ligne,
    pretAccorde: pret,
    relevementAccorde: releve,
    refusBanque:
      (chemin[D.financement] === 0 && !ligne) ||
      (chemin[D.financement] === 2 && !pret) ||
      (chemin[D.financement] === 3 && !releve),
    incidents,
    urgence: urgence !== null && urgence <= SEMAINES ? urgence : null,
    semainesEnDepassement,
    panneFroid,
    legionelle,
    lingeSuspendu,
    ristournePerdue,
    alpineSigne: alpineSigne && d6 !== 2,
    valeurAlpine,
    recettesEte,
  };
}

/** La situation du lundi 13 avril. */
export const DEPART = {
  tresorerie: TRESORERIE_DEPART,
  bfr: BFR_DEPART,
  frng: FRNG_DEPART,
} as const;

/** Ce qui s'est passé pendant des semaines : la banque, les rejets, les fournisseurs, les pannes. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const d1 = chemin[D.financement];
  return {
    comite: d1 !== 1 && d1 !== undefined && dans(2) ? !t.refusBanque : null,
    pretVerse: t.pretAccorde && dans(SEMAINE_PRET),
    incidents: t.incidents.filter(dans),
    urgence: t.urgence !== null && dans(t.urgence) ? t.urgence : null,
    ligneRelevee:
      chemin[D.legionelle] === 0 &&
      dans(t.ligneAccordee ? SEMAINE_RELEVEMENT : SEMAINE_LIGNE_TARDIVE),
    avanceSiege: chemin[D.legionelle] === 3 && dans(SEMAINE_SIEGE),
    relances: chemin[D.fournisseurs] === 1 && dans(8),
    linge: t.lingeSuspendu && dans(SEMAINE_REOUVERTURE),
    ristourne: t.ristournePerdue && dans(9),
    froid: t.panneFroid && dans(13),
    legionelle: chemin[D.legionelle] === 2 && dans(SEMAINE_REOUVERTURE) ? t.legionelle : null,
    reouverture: dans(SEMAINE_REOUVERTURE),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureIntersaison {
  tresorerie: number | null;
  concours: number | null;
  bfr: number | null;
  acomptes: number | null;
  frais: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  frng: number | null;
  disponible: number | null;
  /** Le point bas à venir selon la prévision, recalée sur la situation réelle ; et sa semaine. */
  pointBasPrevu: number | null;
  semainePointBas: number | null;
  /** Le même, avec la remise de pré-saison du négociant (tant que la décision reste à prendre). */
  pointBasAvecVins: number | null;
  /** Le financement disponible au point bas prévu. */
  disponiblePrevu: number | null;
  /** Ce que le point bas prévu dépasse du financement disponible ; 0 : rien. */
  manque: number | null;
  ligne: number | null;
  incidents: number | null;
  impayes: number | null;
}

/**
 * Ce que Bérenger lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». La prévision part de la situation réelle de la
 * semaine et y ajoute les flux d'un trimestre moyen ; avant la semaine 8,
 * personne ne sait encore que le réseau d'eau chaude est à refaire.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureIntersaison {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const avenant = semaine >= 8;
  const uBanque = semaine >= 2 ? hasard(graine).uBanque : 0;
  const reel = semaine > 0 ? simuler(chemin, graine, jours) : null;
  const s = reel ? reel.semaines[semaine]! : null;
  const prevision = (q: Trimestre) => {
    const decalage = s ? s.tresorerie - q.semaines[semaine]!.tresorerie : 0;
    let bas = Infinity;
    let quand = SEMAINES;
    for (let w = Math.max(1, semaine + 1); w <= SEMAINES; w += 1) {
      const x = q.semaines[w]!.tresorerie + decalage;
      if (x < bas) {
        bas = x;
        quand = w;
      }
    }
    return { bas, quand, disponible: q.semaines[quand]!.disponible };
  };
  const p = semaine < SEMAINES ? prevision(prevoir(decisions, avenant, uBanque)) : null;
  const ouvert = decisions.length <= D.fournisseurs && semaine < SEMAINES;
  const avecVins = ouvert
    ? prevision(
        prevoir(
          [...NEUTRE.slice(0, D.fournisseurs).map((n, i) => decisions[i] ?? n), 3],
          avenant,
          uBanque,
        ),
      ).bas
    : null;
  const lecture = {
    pointBasPrevu: p ? p.bas : null,
    semainePointBas: p ? p.quand : null,
    pointBasAvecVins: avecVins,
    disponiblePrevu: p ? p.disponible : null,
    manque: p ? Math.max(0, -p.bas - p.disponible) : null,
    ligne: semaine >= 2 && reel ? (reel.ligneAccordee ? 1 : 0) : null,
    incidents: reel ? reel.incidents.filter((w) => w <= semaine).length : 0,
  };
  if (!s) {
    return {
      tresorerie: DEPART.tresorerie,
      concours: 0,
      bfr: DEPART.bfr,
      acomptes: 0,
      frais: 0,
      frng: DEPART.frng,
      disponible: AUTORISATION,
      impayes: 0,
      ...lecture,
    };
  }
  return {
    tresorerie: s.tresorerie,
    concours: s.concours,
    bfr: s.bfr,
    acomptes: s.acomptes,
    frais: s.frais,
    frng: s.frng,
    disponible: s.disponible,
    impayes: s.impayes,
    ...lecture,
  };
}
