import { AMENDE_DE_LA_REVENTE_A_PERTE, DATE_LIMITE_DE_LA_CONVENTION } from "./fournisseurs-de-la-boutique";
import { DELAI_CONVENU_DE_CAMPUSTECH, GESTION_DU_COURS, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : NOVA SE FAIT RÉFÉRENCER CHEZ CAMPUSTECH (BTS NDRC, bloc 3, chapitre « Se faire
 * référencer chez un distributeur : prix, marges et linéaire »).
 *
 * CampusTech est le client professionnel de NOVA dans toutes les fiches : une chaîne de magasins sur
 * les campus qui achète 320 enceintes NOVA One par mois, au prix des particuliers (59 € hors taxes,
 * sans remise), payées à 60 jours convenus (nova-gestion.ts, mercatique-de-nova.ts). Ce module ne
 * change rien à ces chiffres : il les lit, et il pose ce que le chapitre ajoute, du côté du
 * distributeur et de la négociation annuelle. Chaque hypothèse est une constante nommée.
 *
 * Le calcul se fait au mois et par magasin (le linéaire se juge ainsi), puis à l'année pour NOVA.
 * Tout est hors taxes, sauf le prix public et le seuil de revente à perte, qui s'affichent taxes
 * comprises. La garde tests/cours/se-faire-referencer.test.ts refait chaque chiffre à la main, et
 * tests/cours/une-seule-nova.test.ts vérifie que le module lit le prix, le coût et les ventes de NOVA.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LE RÉSEAU DE CAMPUSTECH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES MAGASINS DE CAMPUSTECH (hypothèse du cours) : 16 magasins, tous à la chaîne (du commerce
 * intégré, succursaliste). Sa centrale de référencement achète pour les 16 : c'est son acheteur qui
 * référence ou non une marque, fixe le linéaire et signe la convention annuelle. Les 320 enceintes du
 * mois se répartissent à parts égales : 20 par magasin.
 */
export const MAGASINS_DE_CAMPUSTECH = 16;

/**
 * LE PRIX PUBLIC DE LA NOVA ONE CHEZ CAMPUSTECH (hypothèse du cours) : 84 € toutes taxes comprises,
 * 70 € hors taxes. CampusTech le fixe librement : un fournisseur ne peut pas imposer un prix de revente
 * minimal (code de commerce). Il est plus haut que le prix en ligne de NOVA (59 € hors taxes) :
 * l'acheteur le sait, et il s'en sert dans la négociation.
 */
export const PRIX_PUBLIC_TTC = 84;

/**
 * LE RAYON AUDIO D'UN MAGASIN (hypothèse du cours) : 4 mètres de linéaire, dont 0,5 mètre pour la
 * NOVA One. Le rayon entier laisse 2 400 € de marge par mois et par magasin : 600 € par mètre, la
 * marge au mètre que l'acheteur exige de chaque marque pour lui garder sa place.
 */
export const LINEAIRE_DU_RAYON = 4;
export const LINEAIRE_DE_NOVA = 0.5;
export const MARGE_DU_RAYON_PAR_MOIS = 2_400;

/** Les mois d'une année de référencement : la convention vaut pour l'année. */
export const MOIS_DE_L_ANNEE = 12;

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA NÉGOCIATION ANNUELLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA MISE EN AVANT PROPOSÉE PAR LA CENTRALE (hypothèse du cours) : une tête de gondole deux semaines
 * par trimestre dans les 16 magasins et une page du catalogue de la rentrée, payées 6 000 € par an par
 * NOVA. C'est un service de coopération commerciale (une marge arrière) : il se facture par le
 * distributeur, s'écrit dans la convention et doit être rendu. Il ferait vendre 15 % de plus.
 */
export const MISE_EN_AVANT = { prixParAn: 6_000, ventesEnPlus: 0.15 } as const;

/** Les bornes de la remise sur facture que NOVA peut accorder, en euros par enceinte. */
export const REMISE_SUR_FACTURE = { min: 0, max: 8, pas: 0.5 } as const;

/**
 * LE TRANSPORT : NOVA livre la centrale franco (le transport est dans ses autres coûts variables,
 * nova-gestion.ts). CampusTech n'en paie aucun : il ne s'ajoute pas au prix d'achat effectif.
 */
export const TRANSPORT_PAYE_PAR_CAMPUSTECH = 0;

/**
 * LA PROMOTION QUE VEUT L'ACHETEUR (hypothèse du cours) : la NOVA One à 64,90 € toutes taxes
 * comprises pendant la rentrée, hors période de soldes.
 */
export const PRIX_DE_LA_RENTREE = 64.9;

/**
 * L'ANIMATION SUR LE LIEU DE VENTE (hypothèse du cours) : une animatrice d'une agence fait écouter la
 * NOVA One un samedi de la rentrée dans chacun des 16 magasins, 180 € la journée, frais compris ; une
 * journée fait vendre 12 enceintes de plus.
 */
export const ANIMATION = { coutParJournee: 180, journees: MAGASINS_DE_CAMPUSTECH, ventesEnPlusParJournee: 12 } as const;

/** Le cadre légal que le chapitre fait jouer : la convention, la revente à perte, le délai convenu. */
export const CADRE_DE_LA_NEGOCIATION = {
  dateLimiteDeLaConvention: DATE_LIMITE_DE_LA_CONVENTION,
  amendeDeLaReventeAPerte: AMENDE_DE_LA_REVENTE_A_PERTE,
  delaiDePaiement: DELAI_CONVENU_DE_CAMPUSTECH,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** La fiche de NOVA d'un cas : celle de la gestion, que toutes les fiches lisent. */
export const ficheDuReferencement = (c: { code: string }): FicheDeGestion => {
  const f = GESTION_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de NOVA pour ${c.code}`);
  return f;
};

/** Une offre de NOVA à la centrale : une remise sur facture (en euros par enceinte), avec ou sans la mise en avant. */
export function offreACampusTech(f: FicheDeGestion, remise: number, avecMiseEnAvant: boolean) {
  const prixDAchat = f.moisDeReference.prix;
  const coutVariable = f.moisDeReference.coutVariable.composants + f.moisDeReference.coutVariable.autres;
  const tva = f.semestre.tauxDeTva;
  const prixPublicHt = auCentime(PRIX_PUBLIC_TTC / (1 + tva));
  const ventesDuMois = f.semestre.clienteles.find((k) => k.code === "campustech")!.quantites[0]!;
  const parMagasin = auCentime((ventesDuMois / MAGASINS_DE_CAMPUSTECH) * (avecMiseEnAvant ? 1 + MISE_EN_AVANT.ventesEnPlus : 1));
  const ventesDeLAnnee = Math.round(parMagasin * MAGASINS_DE_CAMPUSTECH * MOIS_DE_L_ANNEE);
  const cooperation = avecMiseEnAvant ? MISE_EN_AVANT.prixParAn : 0;
  const prixNet = auCentime(prixDAchat - remise);
  const margeAvant = auCentime(prixPublicHt - prixNet);
  // La coopération, payée à l'année par NOVA, ramenée à un magasin et à un mois : la marge arrière.
  const margeArriereParMagasin = auCentime(cooperation / (MAGASINS_DE_CAMPUSTECH * MOIS_DE_L_ANNEE));
  const margeParMagasin = auCentime(parMagasin * margeAvant + margeArriereParMagasin);
  const margeParMetre = auCentime(margeParMagasin / LINEAIRE_DE_NOVA);
  const margeDeNova = auCentime(ventesDeLAnnee * (prixNet - coutVariable) - cooperation);
  // Le prix d'achat effectif (le « triple net ») : le prix net de la facture, plus le transport payé
  // par le distributeur, moins les autres avantages financiers du fournisseur ramenés à l'enceinte.
  const cooperationParEnceinte = auCentime(cooperation / ventesDeLAnnee);
  const seuilHt = auCentime(prixNet + TRANSPORT_PAYE_PAR_CAMPUSTECH - cooperationParEnceinte);
  const seuilTtc = auCentime(seuilHt * (1 + tva));
  return {
    remise,
    avecMiseEnAvant,
    prixDAchat,
    coutVariable,
    prixPublicHt,
    prixNet,
    margeAvant,
    parMagasin,
    ventesDeLAnnee,
    cooperation,
    margeArriereParMagasin,
    margeParMagasin,
    margeParMetre,
    tient: margeParMetre >= MARGE_DU_RAYON_PAR_MOIS / LINEAIRE_DU_RAYON - 1e-9,
    margeUnitaireDeNova: auCentime(prixNet - coutVariable),
    margeDeNova,
    cooperationParEnceinte,
    seuilHt,
    seuilTtc,
  };
}

export type OffreACampusTech = ReturnType<typeof offreACampusTech>;

/** Toutes les remises sur facture que NOVA peut proposer, du plus petit cran au plus grand. */
export const remisesPossibles = (): number[] =>
  Array.from({ length: Math.round((REMISE_SUR_FACTURE.max - REMISE_SUR_FACTURE.min) / REMISE_SUR_FACTURE.pas) + 1 }, (_, i) => REMISE_SUR_FACTURE.min + i * REMISE_SUR_FACTURE.pas);

/** L'offre qui garde le référencement en laissant le plus de marge à NOVA, parmi toutes les remises, avec et sans mise en avant. */
export function meilleureOffre(f: FicheDeGestion): OffreACampusTech {
  const offres = [false, true].flatMap((m) => remisesPossibles().map((r) => offreACampusTech(f, r, m))).filter((o) => o.tient);
  return offres.reduce((a, o) => (o.margeDeNova > a.margeDeNova ? o : a));
}

/** Tout ce que le chapitre et son cas lisent, pour NOVA chez CampusTech. */
export function referencementDeNova(f: FicheDeGestion) {
  const aujourdHui = offreACampusTech(f, 0, false);
  const margeExigee = MARGE_DU_RAYON_PAR_MOIS / LINEAIRE_DU_RAYON;
  const partDuLineaire = LINEAIRE_DE_NOVA / LINEAIRE_DU_RAYON;
  const partDeLaMarge = aujourdHui.margeParMagasin / MARGE_DU_RAYON_PAR_MOIS;
  // La plus petite remise entière, sans mise en avant, qui porte la marge au mètre à celle du rayon.
  const remiseNecessaire = Math.ceil((margeExigee * LINEAIRE_DE_NOVA) / aujourdHui.parMagasin - aujourdHui.margeAvant - 1e-9);
  const sansMiseEnAvant = offreACampusTech(f, remiseNecessaire, false);
  const manqueParMagasin = auCentime(margeExigee * LINEAIRE_DE_NOVA - aujourdHui.margeParMagasin);
  const meilleure = meilleureOffre(f);
  const animationCout = ANIMATION.coutParJournee * ANIMATION.journees;
  const animationVentes = ANIMATION.ventesEnPlusParJournee * ANIMATION.journees;
  const animationMarge = auCentime(animationVentes * meilleure.margeUnitaireDeNova);
  return {
    aujourdHui,
    tauxDeMarque: aujourdHui.margeAvant / aujourdHui.prixPublicHt,
    coefficient: PRIX_PUBLIC_TTC / aujourdHui.prixDAchat,
    margeExigee,
    partDuLineaire,
    partDeLaMarge,
    indiceDuLineaire: partDeLaMarge / partDuLineaire,
    remiseNecessaire,
    sansMiseEnAvant,
    manqueParMagasin,
    cooperationEquivalente: auCentime(manqueParMagasin * MAGASINS_DE_CAMPUSTECH * MOIS_DE_L_ANNEE),
    meilleure,
    promotionMaximale: (PRIX_PUBLIC_TTC - meilleure.seuilTtc) / PRIX_PUBLIC_TTC,
    rentreeAPerte: PRIX_DE_LA_RENTREE < meilleure.seuilTtc,
    animation: {
      cout: animationCout,
      ventes: animationVentes,
      marge: animationMarge,
      gain: auCentime(animationMarge - animationCout),
      seuilParJournee: Math.ceil(ANIMATION.coutParJournee / meilleure.margeUnitaireDeNova - 1e-9),
    },
  };
}

export type ReferencementDeNova = ReturnType<typeof referencementDeNova>;
