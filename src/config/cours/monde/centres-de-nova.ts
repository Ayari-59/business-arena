import { auCentime } from "./amortissement";
import { repartitionDesCentres, tableauDeBord } from "./couts-et-budgets";
import { COUT_DU_SOUS_TRAITANT, GAMME_DE_NOVA, NOVA_GESTION, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : NOVA EN DEUX CENTRES DE RESPONSABILITÉ (le chapitre « Piloter un centre »).
 *
 * NOVA se découpe en deux centres : l'ATELIER, qui achète les composants et fabrique les enceintes
 * (les centres d'analyse approvisionnement et production), et le SERVICE COMMERCIAL, qui les vend aux
 * particuliers et à CampusTech (le centre distribution). L'atelier cède chaque enceinte au service
 * commercial à un PRIX DE CESSION INTERNE : un produit pour l'un, une charge pour l'autre, qui partage
 * le résultat de NOVA entre les deux sans le changer.
 *
 * AUCUN CHIFFRE NOUVEAU SUR CE QUI S'EST PASSÉ. Les ventes du semestre, le prix de 59 €, les 22 € de
 * composants et les 16 € d'autres coûts variables d'une enceinte, les charges fixes du mois, les clés
 * des centres d'analyse et l'activité normale de 2 120 enceintes viennent de nova-gestion.ts ; la
 * répartition des charges fixes entre les centres, prestations réciproques comprises, de
 * `repartitionDesCentres` (couts-et-budgets.ts), celle du chapitre « Coût complet ». Le résultat de
 * chaque mois, la somme des deux centres, est celui du tableau de bord, au centime (la garde
 * tests/cours/une-seule-nova.test.ts le vérifie). Le coût cible étudie la NOVA Go de la gamme : son
 * prix et son coût variable sont ceux de GAMME_DE_NOVA.
 *
 * LES HYPOTHÈSES DU CHAPITRE, nommées et commentées ci-dessous : le regroupement des centres d'analyse
 * en deux centres de responsabilité, le prix de marché d'une enceinte (le sous-traitant), la marge que
 * la direction demande à la Go et le découpage de son coût par fonction, et le modèle relationnel du
 * PGI de NOVA. La garde tests/cours/piloter-un-centre.test.ts refait chaque chiffre à la main.
 *
 * CONVENTIONS : hors taxes ; les montants au centime ; un résultat négatif est une perte. Les 16 €
 * d'autres coûts variables (emballage, transport et énergie de la chaîne) sont des charges de
 * l'atelier : le coût complet du cours les met dans le coût de production (`coutCompletDuMois`), et
 * l'enceinte quitte l'atelier emballée.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX CENTRES
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDuCentre = "atelier" | "commercial";

/**
 * LES CENTRES DE RESPONSABILITÉ (hypothèse du cours) : quels centres d'analyse du coût complet chacun
 * regroupe, et qui le dirige. Les centres auxiliaires (entretien, administration) sont déjà répartis
 * entre les centres principaux : il n'en reste rien à partager.
 */
export const CENTRES_DE_RESPONSABILITE = {
  atelier: { nom: "L'atelier", responsable: "le chef d'atelier", centresDAnalyse: ["approvisionnement", "production"] },
  commercial: { nom: "Le service commercial", responsable: "la responsable commerciale", centresDAnalyse: ["distribution"] },
} as const;

/**
 * LE PRIX DE MARCHÉ D'UNE ENCEINTE FINIE, NON DISTRIBUÉE : ce que le sous-traitant de la fiche facture
 * une enceinte livrée finie (COUT_DU_SOUS_TRAITANT, 52 €). C'est le prix auquel le service commercial
 * pourrait acheter dehors ce que l'atelier lui fournit.
 */
export const PRIX_DE_MARCHE_DE_L_ENCEINTE = COUT_DU_SOUS_TRAITANT;

/**
 * L'OFFRE NOUVELLE DU SOUS-TRAITANT (hypothèse du cas « Le sous-traitant baisse son prix ») : 48 € une
 * enceinte finie, 4 € sous son prix de la fiche, pour gagner le marché de NOVA.
 */
export const OFFRE_DU_SOUS_TRAITANT = 48;

export type MethodeDeCession = "marche" | "standard" | "reel";

export const METHODES_DE_CESSION: readonly MethodeDeCession[] = ["marche", "standard", "reel"];

/** Le mois où le chapitre se calcule : janvier, le mois de référence de la fiche. */
export const MOIS_DES_CENTRES = 0;

/** Les enceintes vendues (donc fabriquées et cédées) chaque mois du semestre, toutes clientèles. */
export const quantitesDuSemestre = (f: FicheDeGestion = NOVA_GESTION) =>
  f.semestre.mois.map((_, i) => f.semestre.clienteles.reduce((t, c) => t + c.quantites[i]!, 0));

/** Le coût variable d'une enceinte à l'atelier : les composants et les autres coûts variables (38 €). */
export const coutVariableDeLAtelier = (f: FicheDeGestion = NOVA_GESTION) => auCentime(f.moisDeReference.coutVariable.composants + f.moisDeReference.coutVariable.autres);

/**
 * Les charges fixes du mois de chaque centre : la part des centres d'analyse qu'il regroupe, après
 * les prestations réciproques (l'atelier 23 468,15 €, le service commercial 7 714,85 €).
 */
export function fixesDesCentres(f: FicheDeGestion = NOVA_GESTION): Record<CodeDuCentre, number> {
  const p = repartitionDesCentres(f).principaux;
  return { atelier: auCentime(p.approvisionnement + p.production), commercial: p.distribution };
}

/**
 * LE COÛT STANDARD D'UNE ENCEINTE : le coût variable et les charges fixes de l'atelier ramenées à
 * l'activité normale (2 120 enceintes), au centime. C'est le coût de production d'une enceinte en
 * imputation rationnelle : il ne dépend pas des ventes du mois.
 */
export function coutStandardDeLEnceinte(f: FicheDeGestion = NOVA_GESTION) {
  return auCentime(coutVariableDeLAtelier(f) + fixesDesCentres(f).atelier / f.centres.activiteNormale);
}

/** Les charges de l'atelier pour `quantite` enceintes : ses coûts variables et ses charges fixes. */
export function chargesDeLAtelier(f: FicheDeGestion, quantite: number) {
  const variables = auCentime(quantite * coutVariableDeLAtelier(f));
  const fixes = fixesDesCentres(f).atelier;
  return { variables, fixes, total: auCentime(variables + fixes) };
}

/** LE COÛT RÉEL D'UNE ENCEINTE : les charges réelles de l'atelier ÷ les enceintes du mois, au centime. */
export const coutReelDeLEnceinte = (f: FicheDeGestion, quantite: number) => auCentime(chargesDeLAtelier(f, quantite).total / quantite);

/** Le prix de cession unitaire de chaque méthode, pour les enceintes d'un mois. */
export function prixDeCession(f: FicheDeGestion, methode: MethodeDeCession, quantite: number) {
  if (methode === "marche") return PRIX_DE_MARCHE_DE_L_ENCEINTE;
  if (methode === "standard") return coutStandardDeLEnceinte(f);
  return coutReelDeLEnceinte(f, quantite);
}

export interface LeviersDesCentres {
  /** Les enceintes vendues dans le mois, que l'atelier fabrique (ou que le sous-traitant fournit). */
  quantite: number;
  /** Le prix de vente d'une enceinte aux clients. */
  prix: number;
  /**
   * Le prix de cession d'une enceinte, ou « reel » : la cession au coût réel facture au service
   * commercial les charges réelles de l'atelier, au centime, et laisse l'atelier à zéro.
   */
  cession: number | "reel";
  /** Qui fournit les enceintes au service commercial : l'atelier, ou le sous-traitant. */
  fournisseur: "atelier" | "sous-traitant";
  /** Ce que le sous-traitant facture une enceinte : le prix de marché, sauf offre nouvelle. */
  prixDuSousTraitant: number;
}

/** Les leviers du mois `mois` de la fiche, au prix de marché, l'atelier fournisseur. */
export function leviersDuMois(f: FicheDeGestion = NOVA_GESTION, mois = MOIS_DES_CENTRES): LeviersDesCentres {
  return { quantite: quantitesDuSemestre(f)[mois]!, prix: f.moisDeReference.prix, cession: PRIX_DE_MARCHE_DE_L_ENCEINTE, fournisseur: "atelier", prixDuSousTraitant: PRIX_DE_MARCHE_DE_L_ENCEINTE };
}

/**
 * LE RÉSULTAT DE CHAQUE CENTRE ET CELUI DE NOVA. Quand l'atelier fournit, ses cessions sont son seul
 * produit et la seule charge d'achat du service commercial : elles s'annulent dans le résultat de NOVA.
 * Quand le service commercial achète au sous-traitant, l'atelier ne cède rien et garde ses charges
 * fixes (elles ne disparaissent pas dans le mois), et NOVA paie le sous-traitant.
 */
export function resultatsDesCentres(f: FicheDeGestion = NOVA_GESTION, leviers: Partial<LeviersDesCentres> = {}) {
  const l = { ...leviersDuMois(f), ...leviers };
  const fixes = fixesDesCentres(f);
  const parLAtelier = l.fournisseur === "atelier";
  const charges = parLAtelier ? chargesDeLAtelier(f, l.quantite) : { variables: 0, fixes: fixes.atelier, total: fixes.atelier };
  const prixUnitaire = parLAtelier ? (l.cession === "reel" ? charges.total / l.quantite : l.cession) : l.prixDuSousTraitant;
  const cessions = parLAtelier ? (l.cession === "reel" ? charges.total : auCentime(l.quantite * l.cession)) : 0;
  const achats = parLAtelier ? cessions : auCentime(l.quantite * l.prixDuSousTraitant);
  const ventes = auCentime(l.quantite * l.prix);
  const atelier = { cessions, variables: charges.variables, fixes: charges.fixes, resultat: auCentime(cessions - charges.total) };
  const commercial = { ventes, achats, fixes: fixes.commercial, resultat: auCentime(ventes - achats - fixes.commercial) };
  return {
    leviers: l,
    prixUnitaire,
    atelier,
    commercial,
    /** Le résultat de NOVA : la somme des deux centres. */
    nova: auCentime(atelier.resultat + commercial.resultat),
    /** Les cessions internes, qui se retranchent au regroupement des deux centres. */
    eliminations: parLAtelier ? cessions : 0,
  };
}

export type ResultatsDesCentres = ReturnType<typeof resultatsDesCentres>;

/** Le résultat de chaque centre selon chacune des trois méthodes, pour un mois de la fiche. */
export function lesTroisMethodes(f: FicheDeGestion = NOVA_GESTION, mois = MOIS_DES_CENTRES) {
  const q = quantitesDuSemestre(f)[mois]!;
  const cession = (m: MethodeDeCession): LeviersDesCentres["cession"] => (m === "reel" ? "reel" : prixDeCession(f, m, q));
  return Object.fromEntries(METHODES_DE_CESSION.map((m) => [m, resultatsDesCentres(f, { ...leviersDuMois(f, mois), cession: cession(m) })])) as Record<MethodeDeCession, ResultatsDesCentres>;
}

/**
 * LE SEUIL DE L'ATELIER : les enceintes qu'il doit céder dans le mois, à un prix de cession donné,
 * pour couvrir ses charges fixes (à l'unité supérieure). Sans marge par enceinte, il n'y en a pas.
 */
export function seuilDeLAtelier(f: FicheDeGestion, cession: number) {
  const marge = auCentime(cession - coutVariableDeLAtelier(f));
  if (marge <= 0) return null;
  return Math.ceil(fixesDesCentres(f).atelier / marge - 1e-9);
}

// ─────────────────────────────────────────────────────────────────────────────
// LE REPORTING MENSUEL DES CENTRES
// ─────────────────────────────────────────────────────────────────────────────

/** LA PÉRIODICITÉ DU REPORTING (hypothèse du cours) : chaque centre remonte ses comptes chaque mois, au prix de marché. */
export const MOIS_DU_REPORTING = [0, 1, 2] as const;

/**
 * Le reporting du premier trimestre, mois par mois : ce que chaque centre remonte (au prix de marché,
 * l'atelier fournisseur), les cessions que la direction élimine en regroupant les deux, et le
 * résultat de NOVA, celui du tableau de bord.
 */
export function reportingDuTrimestre(f: FicheDeGestion = NOVA_GESTION) {
  const bord = tableauDeBord(f).mois;
  const mois = MOIS_DU_REPORTING.map((i) => ({ nom: f.semestre.mois[i]!.nom, indice: i, ...resultatsDesCentres(f, leviersDuMois(f, i)), tableauDeBord: bord[i]!.resultat }));
  const cumul = (g: (m: (typeof mois)[number]) => number) => auCentime(mois.reduce((t, m) => t + g(m), 0));
  return {
    mois,
    trimestre: { atelier: cumul((m) => m.atelier.resultat), commercial: cumul((m) => m.commercial.resultat), nova: cumul((m) => m.nova), eliminations: cumul((m) => m.eliminations) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE PGI DE NOVA : SON MODÈLE RELATIONNEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE MODÈLE RELATIONNEL DU PGI (hypothèse du cours, la structure d'un module de gestion des ventes) :
 * trois tables, chacune avec sa clé primaire (soulignée dans un schéma, ici en premier), et les clés
 * étrangères (#) qui relient une vente à son client et à son centre. Les particuliers sont un seul
 * client du PGI, la boutique en ligne, qui y verse ses commandes.
 */
export const TABLES_DU_PGI = [
  { nom: "CLIENTS", colonnes: ["code_client", "nom", "delai_jours"] },
  { nom: "CENTRES", colonnes: ["code_centre", "libelle", "responsable"] },
  { nom: "VENTES", colonnes: ["num_vente", "mois", "code_client#", "code_centre#", "quantite", "prix_ht"] },
] as const;

/** Les codes des clients dans le PGI. */
export const CODES_CLIENTS_DU_PGI: Readonly<Record<string, string>> = { particuliers: "WEB", campustech: "CAMP" };

/** Le mois de l'extraction : février, le mois sous le seuil. */
export const MOIS_DE_L_EXTRACTION = 1;

/**
 * Ce que rend la requête du chapitre (SUM par client des ventes du mois) : une ligne par client, ses
 * enceintes et son chiffre d'affaires hors taxes.
 */
export function extractionDuMois(f: FicheDeGestion = NOVA_GESTION, mois = MOIS_DE_L_EXTRACTION) {
  const lignes = f.semestre.clienteles.map((c) => ({
    code: CODES_CLIENTS_DU_PGI[c.code]!,
    nom: c.nom,
    quantite: c.quantites[mois]!,
    chiffreDAffaires: auCentime(c.quantites[mois]! * f.moisDeReference.prix),
  }));
  return { mois: f.semestre.mois[mois]!.nom, lignes, quantite: lignes.reduce((t, l) => t + l.quantite, 0), chiffreDAffaires: auCentime(lignes.reduce((t, l) => t + l.chiffreDAffaires, 0)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE COÛT CIBLE DE LA NOVA GO
// ─────────────────────────────────────────────────────────────────────────────

/** La NOVA Go de la gamme : son prix (34 €) et son coût variable (19 €), ceux de GAMME_DE_NOVA. */
export const LA_GO = GAMME_DE_NOVA.references.find((r) => r.code === "go")!;

/**
 * LA MARGE CIBLE DE LA GO (hypothèse du cours) : la marge sur coût variable que la direction demande à
 * chaque Go, 15 €, pour qu'elle paie sa publicité et sa part des charges communes. Le prix, 34 €, est
 * celui que le marché accepte pour une petite enceinte nomade : NOVA ne le choisit pas, elle le subit.
 */
export const MARGE_CIBLE_DE_LA_GO = 15;

export interface FonctionDuProduit {
  code: string;
  libelle: string;
  /** Le poids que les clients donnent à la fonction (une enquête), en part de la valeur du produit. */
  poids: number;
  /** Ce que la fonction coûte dans le premier projet du bureau d'études, par enceinte. */
  coutEstime: number;
  /** Ce qu'elle coûte une fois l'analyse de la valeur faite, dans la Go lancée. */
  coutRetenu: number;
}

/**
 * LES FONCTIONS DE LA GO (hypothèse du cours). Une enquête auprès des clients donne le poids de chaque
 * fonction dans la valeur qu'ils voient au produit ; le bureau d'études a chiffré son premier projet
 * fonction par fonction, coût variable complet (composants, montage, emballage), soit 23,50 €. Après
 * l'analyse de la valeur, la batterie passe à une journée d'écoute au lieu de deux, le module sans fil
 * devient un modèle standard, la coque se simplifie, et ce que le son coûtait en moins de sa cible lui
 * revient (les clients le mettent en premier) : la Go lancée coûte 19 €, son coût variable de la gamme.
 */
export const FONCTIONS_DE_LA_GO: readonly FonctionDuProduit[] = [
  { code: "son", libelle: "Restituer un son clair", poids: 0.4, coutEstime: 7.2, coutRetenu: 7.6 },
  { code: "autonomie", libelle: "Tenir une journée sur batterie", poids: 0.3, coutEstime: 8.3, coutRetenu: 5.7 },
  { code: "robustesse", libelle: "Résister aux chocs", poids: 0.2, coutEstime: 4.1, coutRetenu: 3.8 },
  { code: "connexion", libelle: "Se connecter au téléphone", poids: 0.1, coutEstime: 3.9, coutRetenu: 1.9 },
];

/**
 * LE COÛT CIBLE : le prix que le marché accepte moins la marge que l'entreprise veut, réparti entre les
 * fonctions selon leur poids. Une fonction dont le coût estimé dépasse sa cible est celle où chercher
 * l'économie ; une fonction sous sa cible peut recevoir plus.
 */
export function coutCibleDeLaGo(prix: number = LA_GO.prix, marge: number = MARGE_CIBLE_DE_LA_GO, fonctions: readonly FonctionDuProduit[] = FONCTIONS_DE_LA_GO) {
  const coutCible = auCentime(prix - marge);
  const parFonction = fonctions.map((x) => {
    const cible = auCentime(coutCible * x.poids);
    return { ...x, cible, ecart: auCentime(x.coutEstime - cible) };
  });
  const coutEstime = auCentime(fonctions.reduce((t, x) => t + x.coutEstime, 0));
  const coutRetenu = auCentime(fonctions.reduce((t, x) => t + x.coutRetenu, 0));
  return {
    prix,
    marge,
    coutCible,
    parFonction,
    coutEstime,
    /** L'écart à combler : le coût estimé moins le coût cible (positif : le projet coûte trop). */
    ecart: auCentime(coutEstime - coutCible),
    /** La marge que laisserait le premier projet, au prix du marché. */
    margeDuProjet: auCentime(prix - coutEstime),
    coutRetenu,
  };
}
