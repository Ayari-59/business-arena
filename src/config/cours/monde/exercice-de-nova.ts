import type { DateDuCours, Immobilisation, ModeDAmortissement } from "./amortissement";
import type { ContratDePret } from "./emprunt";
import type { ConditionsDeFacture } from "./facture";
import {
  AUTRES_COUTS_PAR_ENCEINTE,
  CHARGES_FIXES_DU_MOIS,
  COMPOSANTS_PAR_ENCEINTE,
  DELAI_DE_CAMPUSTECH,
  NOVA_GESTION,
  PRIX_DE_L_ENCEINTE,
  TAUX_DE_TVA,
  VENTES_A_CAMPUSTECH,
  VENTES_DES_PARTICULIERS,
} from "./nova-gestion";
import type { TauxDeLaPaie } from "./paie";
import type { FicheDeStock, MethodeDeStock } from "./stock";

/**
 * LE MONDE DU COURS : LE PREMIER EXERCICE DE NOVA, POUR LA COMPTABILITÉ GÉNÉRALE.
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une
 * simulation figée, inspirée de l'arène, calculée par le cours). Cette fiche est la seule source
 * des chiffres des onze chapitres de comptabilité générale : la création et le premier bilan, la
 * paie, l'emprunt, les immobilisations, les remises et règlements, la clôture, les dépréciations et
 * provisions, les régularisations, les soldes intermédiaires de gestion et le bilan fonctionnel (les
 * stocks lisent MAILLE & CO, et les composants de NOVA en décembre). Les modèles qui la calculent
 * sont dans monde/ : amortissement.ts, emprunt.ts, stock.ts, paie.ts, facture.ts, et cloture.ts qui
 * les assemble. La garde tests/cours/exercice-de-nova.test.ts refait chaque chiffre à la main.
 *
 * LA CHRONOLOGIE : UNE SEULE NOVA.
 *   1. LA CRÉATION, la première semaine de janvier de l'année N : les associés apportent
 *      150 000 € le 2 janvier, la banque prête 80 000 € le 3, la ligne de montage est achetée et
 *      mise en service le 6 (60 000 € hors taxes). C'est le chapitre « De la création au premier
 *      bilan ».
 *   2. LE PREMIER EXERCICE, du 1er janvier au 31 décembre N (la société est immatriculée au
 *      1er janvier : l'exercice et l'année civile coïncident). Son premier semestre EST le semestre du
 *      contrôle de gestion (nova-gestion.ts, importé ici) : les mêmes ventes mois par mois, le même
 *      prix, les mêmes composants, le même loyer, la même paie, CampusTech qui paie en retard. Le second
 *      semestre prolonge le premier ; un nouveau client professionnel, Sonora, arrive en septembre.
 *   3. LA CLÔTURE AU 31 DÉCEMBRE N : la balance avant inventaire, les travaux d'inventaire,
 *      l'impôt, le compte de résultat et le bilan, puis leur analyse. Les suites de la clôture (le
 *      sort de la créance de Sonora, le jugement du litige, les extournes) tombent en N+1.
 *   4. ENSUITE seulement, en N+1, la gamme Go, One, Studio et sa seconde ligne (nova-gestion.ts) :
 *      l'exercice N n'a qu'un équipement. Le banc de mesure que le contrôle de gestion envisage
 *      en avril n'est pas acheté.
 *
 * LA TRÉSORERIE DE DÉPART DU BUDGET DE GESTION, RÉCONCILIÉE PAR LE PLACEMENT. Le 6 janvier, la ligne
 * payée, la banque porte 158 000 € (230 000 − 72 000). NOVA en place 133 000 € sur un compte à terme
 * d'un an (PLACEMENT) : son compte courant part de 25 000 €, la trésorerie de départ de
 * nova-gestion.ts, que le budget de trésorerie suit mois par mois. Fin janvier, le compte courant
 * porte 58 959,27 €, le budget 58 838 € : l'écart, 121,27 €, est le prélèvement à la source, versé
 * le 15 février avec les cotisations et non le 28 janvier avec le net. Ensuite s'ajoute la TVA de la
 * ligne, que le budget ignore (6 678 € en février, puis 12 000 € dès mars, une fois le crédit de
 * janvier imputé), et l'échéance de l'emprunt les mois où le budget la range à la fin du trimestre.
 *
 * CE QUI NE SE RÉCONCILIE PAS AVEC nova-gestion.ts (qui n'est pas modifié ici, voir le rapport) :
 *   · les échéances de l'emprunt : le budget les place le dernier jour de mars et de juin ; la fiche
 *     garde le contrat du chapitre « L'emprunt », à la date anniversaire, le 3 avril et le
 *     3 juillet (décision du cours : c'est ce qui laisse des intérêts courus au 31 décembre). Les
 *     montants sont les mêmes (1 000 € puis 950 € d'intérêts), trois jours plus tard ;
 *   · l'usure de la ligne : 833 € par mois en gestion (60 000 € ÷ 72, arrondis, douze mois pleins),
 *     9 861,11 € en comptabilité (355 jours de service la première année). Une charge calculée
 *     n'a pas à être la même dans les deux comptabilités.
 *
 * CONVENTIONS : tout est hors taxes sauf ce qui est dit TTC ; une créance ou une dette se lit
 * toutes taxes comprises (ce que le client ou le fournisseur paiera), et son hors taxes est nommé à
 * part. Les jours se comptent en mois de 30 jours, jour de départ et jour d'arrivée compris
 * (monde/amortissement.ts). Les montants sont au centime.
 */

// ─────────────────────────────────────────────────────────────────────────────
// L'EXERCICE
// ─────────────────────────────────────────────────────────────────────────────

/** Les mois de l'exercice, de janvier à décembre N. */
export const MOIS_DE_L_EXERCICE = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

/** La date de clôture du premier exercice. */
export const CLOTURE: DateDuCours = { jour: 31, mois: 12 };

// ─────────────────────────────────────────────────────────────────────────────
// LA CRÉATION : L'APPORT, LE PRÊT, LA LIGNE DE MONTAGE
// ─────────────────────────────────────────────────────────────────────────────

/** L'apport des associés, versé en numéraire sur le compte bancaire de NOVA (compte 101). */
export const APPORT_EN_CAPITAL = { montant: 150_000, date: { jour: 2, mois: 1 } as DateDuCours };

/**
 * LE CONTRAT DE PRÊT (celui de nova-gestion.ts et du chapitre « L'emprunt ») : 80 000 € à 5 % l'an
 * sur 5 ans, versés le 3 janvier ; 20 échéances trimestrielles à la date anniversaire (le 3 avril,
 * le 3 juillet, le 3 octobre, le 3 janvier N+1…), en amortissement constant : 4 000 € de capital
 * à chaque échéance, et les intérêts du trimestre sur le capital restant dû. Trois échéances
 * tombent dans l'exercice ; celle du 3 janvier N+1 laisse des intérêts courus au 31 décembre.
 */
export const CONTRAT_DE_PRET: ContratDePret = {
  capital: NOVA_GESTION.semestre.emprunt.capitalRestantDu,
  tauxAnnuel: NOVA_GESTION.semestre.emprunt.tauxAnnuel,
  dureeAns: 5,
  echeancesParAn: 4,
  versement: { jour: 3, mois: 1 },
  premiereEcheance: { jour: 3, mois: 4 },
  mode: "amortissement-constant",
};

/**
 * L'ÉQUIPEMENT UNIQUE DE L'EXERCICE : la ligne de montage, 4 postes « Ligne manuelle » à 15 000 €
 * hors taxes (compte 2154, matériel industriel), achetée, payée par virement et mise en service le
 * 6 janvier. HYPOTHÈSE DU COURS : aucun frais d'installation (le fournisseur les inclut dans son
 * prix), une durée d'utilisation de 6 ans, l'amortissement linéaire en comptabilité (le
 * dégressif, 1,75 pour 6 ans, est le levier du laboratoire), aucune valeur résiduelle.
 */
export const EQUIPEMENT = {
  designation: "Ligne manuelle",
  quantite: 4,
  prixUnitaireHt: 15_000,
  ht: 60_000,
  tva: 12_000,
  ttc: 72_000,
  compte: "2154",
  compteDAmortissement: "28154",
  dateDAchat: { jour: 6, mois: 1 } as DateDuCours,
  miseEnService: { jour: 6, mois: 1 } as DateDuCours,
  dureeAns: 6,
  mode: "lineaire" as ModeDAmortissement,
};

/** L'équipement, tel que le modèle d'amortissement le lit. */
export const IMMOBILISATION: Immobilisation = { valeurBrute: EQUIPEMENT.ht, miseEnService: EQUIPEMENT.miseEnService, dureeAns: EQUIPEMENT.dureeAns };

// ─────────────────────────────────────────────────────────────────────────────
// L'ANNÉE, MOIS PAR MOIS : LES VENTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES ENCEINTES VENDUES EN LIGNE AUX PARTICULIERS, de janvier à décembre, payées par carte à la
 * commande (au comptant) au prix de 59 € hors taxes. Le premier semestre est celui de
 * nova-gestion.ts ; le second (HYPOTHÈSE DU COURS) creuse en août et monte vers Noël.
 */
export const VENTES_AUX_PARTICULIERS: readonly number[] = [...VENTES_DES_PARTICULIERS, 1_600, 1_150, 1_700, 1_650, 1_750, 2_000];

/**
 * CAMPUSTECH, le client professionnel de nova-gestion.ts : 320 enceintes par mois, facturées le 20
 * au prix de 59 € hors taxes, dues à 60 jours et payées en retard, à 80 jours (le 10 du troisième
 * mois suivant, en mois de 30 jours ; RETARD_DE_CAMPUSTECH, nova-gestion.ts). La facture d'octobre,
 * échue le 20 décembre, n'est pas encore payée : les factures d'octobre, de novembre et de décembre
 * sont encore dues au 31 décembre. Un retard n'est pas un risque de perte : CampusTech est solvable,
 * sa créance reste au compte 411, sans dépréciation.
 */
export const CAMPUSTECH = { nom: "CampusTech", enceintesParFacture: VENTES_A_CAMPUSTECH[0]!, jourDeFacturation: 20, delai: DELAI_DE_CAMPUSTECH };

/**
 * DÉCEMBRE CHEZ CAMPUSTECH (HYPOTHÈSE DU COURS, pour les régularisations) :
 *   · la commande de décembre, facturée le 20 décembre comme chaque mois (320 enceintes), est
 *     livrée en deux fois à la demande du client : 200 avant les vacances, les 120 autres le
 *     8 janvier N+1. Les 120 ne sont fabriquées qu'en janvier : la part facturée d'avance est un
 *     produit constaté d'avance ;
 *   · le 29 décembre, CampusTech passe une commande urgente de 200 enceintes pour équiper un
 *     amphithéâtre, livrée le 30 décembre ; la facture partira le 4 janvier N+1 : une facture à
 *     établir, un produit à recevoir.
 */
export const LIVRAISON_DIFFEREE_DE_DECEMBRE = { enceintes: 120, livraison: { jour: 8, mois: 1, exercice: 1 } as DateDuCours };
export const COMMANDE_URGENTE_DE_DECEMBRE = { enceintes: 200, livraison: { jour: 30, mois: 12 } as DateDuCours, facture: { jour: 4, mois: 1, exercice: 1 } as DateDuCours };

/**
 * SONORA, une chaîne de magasins de hi-fi (HYPOTHÈSE DU COURS), nouveau client de septembre :
 *   · le 15 septembre, 400 enceintes, avec une remise de 5 % (commande de plus de 300 enceintes)
 *     et un escompte de 2 % pour un règlement à 10 jours au lieu de 60 ; Sonora règle le
 *     25 septembre et prend l'escompte. C'est la facture avec remise et escompte du cours ;
 *   · le 15 octobre, 500 enceintes, la même remise, payables à 60 jours, le 15 décembre, sans
 *     escompte. Sonora ne paie pas : le 18 décembre, le tribunal ouvre une procédure de
 *     redressement judiciaire, et le mandataire laisse craindre une perte de 40 % de la créance.
 *     C'est la créance litigieuse de la clôture.
 */
export const SONORA = {
  nom: "Sonora",
  delai: 60,
  delaiDEscompte: 10,
  remise: 0.05,
  escompte: 0.02,
  premiereCommande: { date: { jour: 15, mois: 9 } as DateDuCours, reglement: { jour: 25, mois: 9 } as DateDuCours, enceintes: 400 },
  secondeCommande: { date: { jour: 15, mois: 10 } as DateDuCours, echeance: { jour: 15, mois: 12 } as DateDuCours, enceintes: 500 },
  redressement: { date: { jour: 18, mois: 12 } as DateDuCours, tauxDePerteProbable: 0.4 },
};

/** Les conditions des deux factures de Sonora, telles que le modèle de facture les lit. */
export const FACTURE_SONORA_DE_SEPTEMBRE: ConditionsDeFacture = {
  quantite: SONORA.premiereCommande.enceintes,
  prixUnitaire: PRIX_DE_L_ENCEINTE,
  reductions: [{ nature: "remise", taux: SONORA.remise }],
  escompte: SONORA.escompte,
  tauxDeTva: TAUX_DE_TVA,
};
export const FACTURE_SONORA_D_OCTOBRE: ConditionsDeFacture = {
  quantite: SONORA.secondeCommande.enceintes,
  prixUnitaire: PRIX_DE_L_ENCEINTE,
  reductions: [{ nature: "remise", taux: SONORA.remise }],
  escompte: 0,
  tauxDeTva: TAUX_DE_TVA,
};

/** Les deux factures de Sonora, montant par montant (la garde les refait avec monde/facture.ts). */
export const MONTANTS_DES_FACTURES_SONORA = {
  septembre: { brut: 23_600, remise: 1_180, netCommercial: 22_420, escompte: 448.4, netFinancier: 21_971.6, tva: 4_394.32, netAPayer: 26_365.92 },
  octobre: { brut: 29_500, remise: 1_475, netCommercial: 28_025, escompte: 0, netFinancier: 28_025, tva: 5_605, netAPayer: 33_630 },
};

/**
 * LES ENCEINTES LIVRÉES CHAQUE MOIS, toutes clientèles : ce que la ligne a fabriqué (NOVA fabrique
 * ce qu'elle livre, et ne garde aucune enceinte finie en stock). En décembre, CampusTech reçoit
 * 200 enceintes de sa commande et les 200 de la commande urgente. Chaque trimestre reste sous la
 * capacité de la ligne, 7 000 enceintes.
 */
export const LIVRAISONS_DU_MOIS: readonly number[] = VENTES_AUX_PARTICULIERS.map((q, m) => {
  const campustech = m === 11 ? CAMPUSTECH.enceintesParFacture - LIVRAISON_DIFFEREE_DE_DECEMBRE.enceintes + COMMANDE_URGENTE_DE_DECEMBRE.enceintes : CAMPUSTECH.enceintesParFacture;
  const sonora = m === 8 ? SONORA.premiereCommande.enceintes : m === 9 ? SONORA.secondeCommande.enceintes : 0;
  return q + campustech + sonora;
});

// ─────────────────────────────────────────────────────────────────────────────
// L'ANNÉE, MOIS PAR MOIS : LES ACHATS ET LES CHARGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE FOURNISSEUR DE COMPOSANTS (celui de nova-gestion.ts) : Électro-Composants Lyon livre et
 * facture le 10 de chaque mois les composants du mois, à 22 € le jeu (un jeu par enceinte), payés à
 * 22 jours, le 1er du mois suivant. De janvier à novembre, NOVA achète ce qu'elle consomme. La
 * facture du 10 décembre (1 500 jeux) est encore due au 31 décembre.
 */
export const ELECTRO_COMPOSANTS = { nom: NOVA_GESTION.semestre.fournisseur.nom, prixDuJeu: COMPOSANTS_PAR_ENCEINTE, jourDeFacturation: NOVA_GESTION.semestre.fournisseur.jourDeFacturation, delai: NOVA_GESTION.semestre.fournisseur.delai };

/**
 * LES COMPOSANTS DE DÉCEMBRE (HYPOTHÈSE DU COURS, pour l'inventaire). Électro-Composants ferme du
 * 20 décembre au 5 janvier : NOVA reçoit de lui 1 500 jeux le 10 décembre, à 22 €, puis achète le
 * 18 décembre 1 500 jeux à un grossiste, Composants Express, à 23 € (un dépannage plus cher), pour
 * finir décembre et démarrer janvier. La facture de Composants Express n'arrivera que le 8 janvier
 * N+1 : une facture non parvenue. La ligne consomme 1 000 jeux jusqu'au 15 décembre et 1 400 ensuite
 * (les 2 400 enceintes livrées en décembre) ; 600 jeux restent en stock au 31 décembre.
 */
export const COMPOSANTS_DE_DECEMBRE: FicheDeStock = {
  libelle: "les jeux de composants, en décembre",
  initial: { quantite: 0, valeur: 0 },
  mouvements: [
    { date: { jour: 10, mois: 12 }, libelle: "livraison d'Électro-Composants Lyon", sens: "entree", quantite: 1_500, prixUnitaire: 22 },
    { date: { jour: 15, mois: 12 }, libelle: "consommation de la première quinzaine", sens: "sortie", quantite: 1_000 },
    { date: { jour: 18, mois: 12 }, libelle: "livraison de Composants Express", sens: "entree", quantite: 1_500, prixUnitaire: 23 },
    { date: { jour: 24, mois: 12 }, libelle: "consommation de la fin du mois", sens: "sortie", quantite: 1_400 },
  ],
};

/** LA MÉTHODE DE VALORISATION DU STOCK de la fiche : le coût moyen pondéré du mois (la période). */
export const METHODE_DE_STOCK: MethodeDeStock = "cmup-periode";

/** La facture non parvenue au 31 décembre : les 1 500 jeux de Composants Express, à 23 €. */
export const FACTURE_NON_PARVENUE = { fournisseur: "Composants Express", livraison: { jour: 18, mois: 12 } as DateDuCours, arrivee: { jour: 8, mois: 1, exercice: 1 } as DateDuCours, ht: 34_500, tva: 6_900, ttc: 41_400 };

/** Les factures d'Électro-Composants, mois par mois, hors taxes : 22 € × les enceintes du mois, puis 1 500 jeux en décembre. */
export const FACTURES_DE_COMPOSANTS_HT: readonly number[] = LIVRAISONS_DU_MOIS.map((q, m) => (m === 11 ? 1_500 * ELECTRO_COMPOSANTS.prixDuJeu : q * ELECTRO_COMPOSANTS.prixDuJeu));

/**
 * LES AUTRES COÛTS VARIABLES (ceux de nova-gestion.ts) : emballage, transport et énergie de la
 * chaîne, 16 € hors taxes par enceinte livrée, avec 20 % de TVA, payés dans le mois. Le cours les
 * range en achats non stockés (compte 606).
 */
export const AUTRES_COUTS_DE_L_ENCEINTE = AUTRES_COUTS_PAR_ENCEINTE;

/**
 * LE PLACEMENT (HYPOTHÈSE DU COURS) : le 6 janvier, la ligne payée, NOVA place 133 000 € sur un
 * compte à terme de 12 mois à 3 % l'an (le taux d'un compte à terme de PME, nettement sous les 5 % de
 * l'emprunt), intérêts versés à l'échéance, le 6 janvier N+1. Le dirigeant y garde la réserve de la
 * gamme à venir (la seconde ligne, le lancement de Go et de Studio).
 *   · LE COMPTE : 508 (autres valeurs mobilières de placement et créances assimilées), et non 2721
 *     (titres immobilisés) : le placement dure un an au plus et sert de réserve de trésorerie, il
 *     n'est pas destiné à rester durablement dans l'entreprise.
 *   · À LA CLÔTURE : 355 jours d'intérêts ont couru (du 6 janvier au 31 décembre, jours compris),
 *     non encaissés : un produit à recevoir, au débit du 5088 (intérêts courus sur placements), au
 *     crédit du 764 (revenus des valeurs mobilières de placement), un produit financier.
 *   · AU BILAN FONCTIONNEL : le placement et ses intérêts courus sont de la trésorerie active
 *     (placements à moins d'un an, disponibles à l'échéance), pas un emploi stable.
 */
export const PLACEMENT = {
  libelle: "un compte à terme",
  montant: 133_000,
  date: { jour: 6, mois: 1 } as DateDuCours,
  tauxAnnuel: 0.03,
  dureeMois: 12,
  echeance: { jour: 6, mois: 1, exercice: 1 } as DateDuCours,
  compte: "508",
  compteDesInteretsCourus: "5088",
  compteDeProduit: "764",
};

/** Le loyer du local, prélevé le 5 de chaque mois, sans TVA (le bailleur n'a pas opté). */
export const LOYER_DU_MOIS = { montant: CHARGES_FIXES_DU_MOIS.loyer, jour: 5 };

/**
 * LA PAIE D'UN MOIS (celle de nova-gestion.ts et du chapitre « La paie ») : 4 salariés, 7 500 €
 * bruts par mois toute l'année. Cotisations salariales : URSSAF 18 %, retraite complémentaire 4 %
 * (22 % en tout) ; patronales : URSSAF 36 %, retraite 6 % (42 %, contributions sur les salaires
 * comprises). La CSG et la CRDS non déductibles, 2,9 % sur 98,25 % du brut, font le net imposable ;
 * le prélèvement à la source est de 2 %. Le net à payer se vire le 28 ; les cotisations et le
 * prélèvement se versent le 15 du mois suivant (déclaration sociale nominative).
 *
 * TAUX SIMPLIFIÉS DU COURS (vérifiés le 29 octobre 2026) : de vraies cotisations se comptent ligne par
 * ligne, par tranche du plafond de la sécurité sociale, et les patronales baissent près du SMIC par la
 * réduction générale dégressive unique (RGDU) depuis le 1er janvier 2026 (economie.gouv.fr,
 * « Comment fonctionne la RGDU »). 22 % et 42 % sont des ordres de grandeur usuels, pas un barème.
 * La CSG et la CRDS non déductibles, 2,4 % + 0,5 % sur 98,25 % du brut, sont celles de l'URSSAF.
 */
export const TAUX_DE_LA_PAIE: TauxDeLaPaie = {
  salarialUrssaf: 0.18,
  salarialRetraite: 0.04,
  patronalUrssaf: 0.36,
  patronalRetraite: 0.06,
  csgCrdsNonDeductible: 0.029,
  assietteDeLaCsg: 0.9825,
  prelevementALaSource: 0.02,
};
export const PAIE_DU_MOIS = { effectif: 4, brut: 7_500, jourDuVirement: 28, jourDesCotisations: 15 };

/** L'acompte de janvier (chapitre « La paie ») : 700 € versés le 15 janvier à un salarié, repris sur sa paie du mois. */
export const ACOMPTE_DE_JANVIER = { montant: 700, date: { jour: 15, mois: 1 } as DateDuCours };

/**
 * L'ASSURANCE (HYPOTHÈSE DU COURS) : le 1er octobre, NOVA souscrit la formule « Basique » de
 * l'arène, 1 500 € par trimestre, et paie l'année d'avance : 6 000 €, prélevés le jour même, sans
 * TVA. Au 31 décembre, 9 mois sur 12 appartiennent à N+1 : une charge constatée d'avance.
 */
export const ASSURANCE = { prime: 6_000, date: { jour: 1, mois: 10 } as DateDuCours, moisCouverts: 12 };

/**
 * LE LITIGE (HYPOTHÈSE DU COURS) : en novembre, la batterie d'une enceinte a pris feu chez un
 * client et abîmé son salon. Il assigne NOVA et réclame 12 000 € ; l'avocat de NOVA juge probable
 * une condamnation à 5 000 €. Au 31 décembre, une provision pour litige au montant probable.
 */
export const LITIGE = { demande: 12_000, montantProbable: 5_000 };

/**
 * LA TVA : NOVA déclare chaque mois (régime réel normal) la TVA collectée du mois moins la TVA
 * déductible, et la paie le mois suivant ; un crédit (celui de janvier, l'achat de la ligne) se
 * reporte sur la déclaration suivante. HYPOTHÈSE DU COURS : la TVA d'une vente se collecte à la
 * facture. La déclaration de décembre, 13 096 €, est liquidée au 31 décembre et payée en janvier.
 */
export const TVA_DE_DECEMBRE_A_PAYER = 13_096;

/**
 * L'IMPÔT SUR LES SOCIÉTÉS : 15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà. NOVA a droit au
 * taux réduit (HYPOTHÈSE DU COURS : chiffre d'affaires sous 10 M€, capital entièrement libéré,
 * détenu par des personnes physiques). Le résultat fiscal est le résultat comptable avant impôt
 * (aucune réintégration ni déduction) ; l'impôt s'arrondit à l'euro. Une société nouvelle ne verse
 * pas d'acompte sur son premier exercice : tout l'impôt de N reste dû au 31 décembre (compte 444).
 * Pas de cotisation foncière des entreprises non plus : elle n'est pas due l'année de la création.
 */
export const IMPOT_SUR_LES_SOCIETES = { tauxReduit: 0.15, plafondDuTauxReduit: 42_500, tauxNormal: 0.25, eligibleAuTauxReduit: true, acomptesVerses: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// AU 31 DÉCEMBRE : LES CRÉANCES ET LA BALANCE AVANT INVENTAIRE
// ─────────────────────────────────────────────────────────────────────────────

/** Une facture de vente encore due au 31 décembre : son hors taxes, sa TVA, ce que le client doit (TTC). */
export interface CreanceClient {
  client: string;
  date: DateDuCours;
  echeance: DateDuCours;
  enceintes: number;
  ht: number;
  tva: number;
  ttc: number;
  litigieuse: boolean;
}

/**
 * LES CRÉANCES CLIENTS AU 31 DÉCEMBRE, avant inventaire (compte 411) : les trois dernières factures
 * de CampusTech (67 968 € TTC, 56 640 € HT) et la facture d'octobre de Sonora (33 630 € TTC,
 * 28 025 € HT), échue le 15 décembre et impayée. Les particuliers ont payé à la commande.
 */
export const CREANCES_AU_31_DECEMBRE: readonly CreanceClient[] = [
  { client: "CampusTech", date: { jour: 20, mois: 10 }, echeance: { jour: 10, mois: 1, exercice: 1 }, enceintes: 320, ht: 18_880, tva: 3_776, ttc: 22_656, litigieuse: false },
  { client: "CampusTech", date: { jour: 20, mois: 11 }, echeance: { jour: 10, mois: 2, exercice: 1 }, enceintes: 320, ht: 18_880, tva: 3_776, ttc: 22_656, litigieuse: false },
  { client: "CampusTech", date: { jour: 20, mois: 12 }, echeance: { jour: 10, mois: 3, exercice: 1 }, enceintes: 320, ht: 18_880, tva: 3_776, ttc: 22_656, litigieuse: false },
  { client: "Sonora", date: SONORA.secondeCommande.date, echeance: SONORA.secondeCommande.echeance, enceintes: 500, ht: 28_025, tva: 5_605, ttc: 33_630, litigieuse: true },
];

/** Une ligne de la balance : le compte, son intitulé, son solde débiteur ou créditeur. */
export interface LigneDeBalance {
  compte: string;
  intitule: string;
  debit: number;
  credit: number;
}

/**
 * LA BALANCE AVANT INVENTAIRE AU 31 DÉCEMBRE N : tout le journal de l'année, sans les travaux
 * d'inventaire. La garde refait chaque solde à partir des opérations de cette fiche, et la banque
 * à partir de chaque encaissement et de chaque décaissement de l'année. Les salaires nets et les
 * comptes de TVA du mois sont soldés (la déclaration de décembre est liquidée au compte 4455).
 */
export const BALANCE_AVANT_INVENTAIRE: readonly LigneDeBalance[] = [
  { compte: "101", intitule: "Capital", debit: 0, credit: 150_000 },
  { compte: "164", intitule: "Emprunts auprès des établissements de crédit", debit: 0, credit: 68_000 },
  { compte: "2154", intitule: "Matériel industriel (la ligne de montage)", debit: 60_000, credit: 0 },
  { compte: "401", intitule: "Fournisseurs (Électro-Composants, facture du 10 décembre)", debit: 0, credit: 39_600 },
  { compte: "411", intitule: "Clients (CampusTech et Sonora)", debit: 101_598, credit: 0 },
  { compte: "431", intitule: "Sécurité sociale (URSSAF, paie de décembre)", debit: 0, credit: 4_050 },
  { compte: "437", intitule: "Autres organismes sociaux (retraite complémentaire)", debit: 0, credit: 750 },
  { compte: "442", intitule: "État, impôts retenus à la source", debit: 0, credit: 121.27 },
  { compte: "4455", intitule: "État, TVA à décaisser (décembre)", debit: 0, credit: TVA_DE_DECEMBRE_A_PAYER },
  { compte: "508", intitule: "Compte à terme (le placement du 6 janvier)", debit: PLACEMENT.montant, credit: 0 },
  { compte: "512", intitule: "Banque (le compte courant)", debit: 115_734.87, credit: 0 },
  { compte: "601", intitule: "Achats de matières premières (composants)", debit: 499_598, credit: 0 },
  { compte: "606", intitule: "Achats non stockés (emballage, transport et énergie)", debit: 377_744, credit: 0 },
  { compte: "6132", intitule: "Locations immobilières (le loyer du local)", debit: 236_400, credit: 0 },
  { compte: "616", intitule: "Primes d'assurance", debit: 6_000, credit: 0 },
  { compte: "641", intitule: "Rémunérations du personnel", debit: 90_000, credit: 0 },
  { compte: "645", intitule: "Charges de sécurité sociale et de prévoyance", debit: 37_800, credit: 0 },
  { compte: "6611", intitule: "Intérêts des emprunts", debit: 2_850, credit: 0 },
  { compte: "665", intitule: "Escomptes accordés", debit: 448.4, credit: 0 },
  { compte: "701", intitule: "Ventes de produits finis", debit: 0, credit: 1_385_556 },
];

// ─────────────────────────────────────────────────────────────────────────────
// APRÈS LA CLÔTURE : CE QUE N+1 DÉNOUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES SUITES EN N+1 (HYPOTHÈSE DU COURS) : le 30 juin N+1, le redressement de Sonora finit en
 * liquidation ; le liquidateur verse 50 % de la créance, le reste est irrécouvrable. Le 15 mai
 * N+1, le tribunal condamne NOVA à verser 4 000 € au client du litige.
 */
export const SUITES_EN_N_PLUS_1 = {
  sonora: { date: { jour: 30, mois: 6, exercice: 1 } as DateDuCours, partEncaissee: 0.5 },
  litige: { date: { jour: 15, mois: 5, exercice: 1 } as DateDuCours, condamnation: 4_000 },
};

// ─────────────────────────────────────────────────────────────────────────────
// LA CLÔTURE, FIGÉE : CE QUE LES TRAVAUX D'INVENTAIRE DONNENT AVEC LES CHOIX DE LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les chiffres de la clôture avec les choix de la fiche (linéaire, CMUP de période, 40 % de perte
 * sur Sonora, 5 000 € de provision, placement à 3 %, taux réduit d'impôt). monde/cloture.ts les calcule ; la garde
 * vérifie que le modèle et la main retombent sur ces valeurs.
 */
export const CLOTURE_DE_LA_FICHE = {
  resultatAvantInventaire: 134_715.6,
  travaux: {
    dotationAuxAmortissements: 9_861.11,
    stockFinal: 13_500,
    factureNonParvenue: 34_500,
    depreciationDeLaCreance: 11_210,
    provisionPourLitige: 5_000,
    chargeConstateeDAvance: 4_500,
    factureAEtablir: 11_800,
    produitConstateDAvance: 7_080,
    interetsCourus: 831.11,
    interetsDuPlacement: 3_934.58,
  },
  resultatAvantImpot: 99_967.96,
  impot: 20_742,
  resultatNet: 79_225.96,
  soldes: {
    production: 1_390_276,
    consommations: 1_136_242,
    valeurAjoutee: 254_034,
    excedentBrutDExploitation: 126_234,
    resultatDExploitation: 100_162.89,
    resultatFinancier: -194.93,
    resultatCourantAvantImpot: 99_967.96,
  },
  capaciteDAutofinancement: 105_297.07,
  totalDuBilan: 432_256.34,
  fonctionnel: {
    emploisStables: 60_000,
    ressourcesStables: 323_297.07,
    fondsDeRoulement: 263_297.07,
    besoinDExploitation: 32_200.73,
    besoinHorsExploitation: -21_573.11,
    besoinEnFondsDeRoulement: 10_627.62,
    tresorerieNette: 252_669.45,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDeLExercice {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  prixDeLEnceinte: number;
  tauxDeTva: number;
  cloture: DateDuCours;
  apport: typeof APPORT_EN_CAPITAL;
  pret: ContratDePret;
  equipement: typeof EQUIPEMENT;
  immobilisation: Immobilisation;
  ventesAuxParticuliers: readonly number[];
  livraisons: readonly number[];
  campustech: typeof CAMPUSTECH;
  livraisonDiffereeDeDecembre: typeof LIVRAISON_DIFFEREE_DE_DECEMBRE;
  commandeUrgenteDeDecembre: typeof COMMANDE_URGENTE_DE_DECEMBRE;
  sonora: typeof SONORA;
  placement: typeof PLACEMENT;
  facturesSonora: { septembre: ConditionsDeFacture; octobre: ConditionsDeFacture };
  fournisseur: typeof ELECTRO_COMPOSANTS;
  facturesDeComposantsHt: readonly number[];
  composantsDeDecembre: FicheDeStock;
  methodeDeStock: MethodeDeStock;
  factureNonParvenue: typeof FACTURE_NON_PARVENUE;
  autresCoutsDeLEnceinte: number;
  loyer: typeof LOYER_DU_MOIS;
  paie: typeof PAIE_DU_MOIS;
  tauxDeLaPaie: TauxDeLaPaie;
  acompteDeJanvier: typeof ACOMPTE_DE_JANVIER;
  assurance: typeof ASSURANCE;
  litige: typeof LITIGE;
  impot: typeof IMPOT_SUR_LES_SOCIETES;
  creances: readonly CreanceClient[];
  balanceAvantInventaire: readonly LigneDeBalance[];
  suites: typeof SUITES_EN_N_PLUS_1;
}

export const EXERCICE_DE_NOVA: FicheDeLExercice = {
  code: "nova",
  entreprise: "NOVA",
  unite: "enceinte",
  unites: "enceintes",
  prixDeLEnceinte: PRIX_DE_L_ENCEINTE,
  tauxDeTva: TAUX_DE_TVA,
  cloture: CLOTURE,
  apport: APPORT_EN_CAPITAL,
  pret: CONTRAT_DE_PRET,
  equipement: EQUIPEMENT,
  immobilisation: IMMOBILISATION,
  ventesAuxParticuliers: VENTES_AUX_PARTICULIERS,
  livraisons: LIVRAISONS_DU_MOIS,
  campustech: CAMPUSTECH,
  livraisonDiffereeDeDecembre: LIVRAISON_DIFFEREE_DE_DECEMBRE,
  commandeUrgenteDeDecembre: COMMANDE_URGENTE_DE_DECEMBRE,
  sonora: SONORA,
  placement: PLACEMENT,
  facturesSonora: { septembre: FACTURE_SONORA_DE_SEPTEMBRE, octobre: FACTURE_SONORA_D_OCTOBRE },
  fournisseur: ELECTRO_COMPOSANTS,
  facturesDeComposantsHt: FACTURES_DE_COMPOSANTS_HT,
  composantsDeDecembre: COMPOSANTS_DE_DECEMBRE,
  methodeDeStock: METHODE_DE_STOCK,
  factureNonParvenue: FACTURE_NON_PARVENUE,
  autresCoutsDeLEnceinte: AUTRES_COUTS_DE_L_ENCEINTE,
  loyer: LOYER_DU_MOIS,
  paie: PAIE_DU_MOIS,
  tauxDeLaPaie: TAUX_DE_LA_PAIE,
  acompteDeJanvier: ACOMPTE_DE_JANVIER,
  assurance: ASSURANCE,
  litige: LITIGE,
  impot: IMPOT_SUR_LES_SOCIETES,
  creances: CREANCES_AU_31_DECEMBRE,
  balanceAvantInventaire: BALANCE_AVANT_INVENTAIRE,
  suites: SUITES_EN_N_PLUS_1,
};

/** Les exercices du monde du cours, par code d'entreprise. */
export const EXERCICES_DU_COURS: Readonly<Record<string, FicheDeLExercice>> = { [EXERCICE_DE_NOVA.code]: EXERCICE_DE_NOVA };
