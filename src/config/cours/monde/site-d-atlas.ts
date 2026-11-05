import type { FicheDuCabinet } from "./atlas-conseil";
import { canalDe, compteMoyen, valeurDUnClient } from "./relation-client";

/**
 * LE MONDE DU COURS : LE SITE QUI VEND, LES CONTENUS ET LA COMMUNAUTÉ D'ATLAS CONSEIL (le BTS NDRC,
 * bloc 2 : relation client à distance et digitalisation).
 *
 * La fiche du cabinet (monde/atlas-conseil.ts) fige l'année N : 32 comptes, 1 920 journées vendues en
 * intra (dans l'entreprise cliente, pour ses salariés), 1 382 400 € hors taxes, et une campagne
 * digitale de prospection (24 000 €, 600 demandes, 2 comptes gagnés). Ce module n'en change aucun
 * chiffre. Il ajoute ce que le cabinet lance APRÈS l'année N : une boutique en ligne qui vend des places
 * dans des sessions INTER-ENTREPRISES (une journée de formation ouverte à tous, en salle chez ATLAS,
 * où se retrouvent des salariés de plusieurs entreprises et des particuliers qui se forment à leurs
 * frais). Elle ouvre le 1er janvier de N + 1 ; le cours lit son PREMIER TRIMESTRE (janvier à mars),
 * hors du chiffre d'affaires de N, et rien ici ne dit ce que font en N + 1 les comptes, les commerciaux
 * ou les canaux de la fiche.
 *
 *   1. LE SITE QUI VEND (chapitre « Le site qui vend ») : les visites par source, leur coût, les
 *      commandes ; le taux de conversion, le panier moyen, CA = visites × conversion × panier ; la
 *      marge d'une commande, frais de paiement en ligne compris ; le retour sur dépenses publicitaires
 *      (ROAS) et son seuil ; la courbe des liens sponsorisés et le clic en plus ; la rétractation des
 *      particuliers ; l'hébergement et ses heures d'indisponibilité.
 *   2. CONTENUS, COMMUNAUTÉ ET E-RÉPUTATION (chapitre « Contenus, communauté et e-réputation ») : les
 *      publications du réseau professionnel, leur engagement et leurs clics ; le livre blanc et le
 *      webinaire (le marketing entrant), les contacts qu'ils amènent et ce qu'ils valent dans
 *      l'entonnoir de la campagne digitale de N ; le rythme de publication et le coût du community
 *      manager ; la note des avis et son effet sur la conversion du site.
 *
 * Chaque donnée nouvelle est une constante nommée et commentée ; la garde
 * tests/cours/site-d-atlas.test.ts refait chaque chiffre à la main, et tests/cours/atlas-conseil.test.ts
 * garde ceux que d'autres chapitres pourraient reprendre.
 *
 * CONVENTIONS. Les montants sont hors taxes, au centime ; seuls les frais de paiement se calculent sur
 * ce que le client paie, toutes taxes comprises. Les taux, les parts et les comptes attendus ne sont
 * pas arrondis (c'est l'affichage qui arrondit). Le trimestre a 90 jours et 13 semaines.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** La période que lisent les deux chapitres : le premier trimestre de la boutique en ligne. */
export const PERIODE_DU_SITE = "le premier trimestre de N + 1";

/** Le trimestre de la boutique : janvier, février et mars d'une année qui n'est pas bissextile. */
export const TRIMESTRE_DU_SITE = { jours: 90, semaines: 13 } as const;

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE SITE QUI VEND
// ═════════════════════════════════════════════════════════════════════════════

/**
 * UNE PLACE EN SESSION INTER-ENTREPRISES (hypothèses du cours) : une journée de formation, 350 € hors
 * taxes par participant. Ce qu'elle coûte en plus : les supports remis au participant (30 €) et son
 * déjeuner et ses pauses (25 €). Les consultants sont payés de toute façon et les sessions se tiennent
 * dans les bureaux du cabinet, sur des journées que les missions laissent libres (au trimestre 1 de N,
 * il en restait 120) : ni leur temps ni la salle ne sont un coût de la place.
 *
 * LA TVA : 20 %, soit 420 € toutes taxes comprises. Un organisme de formation peut demander à être
 * exonéré de TVA sur la formation professionnelle continue ; le cours suppose qu'ATLAS ne l'a pas
 * demandé (son activité de conseil est taxable), et facture donc la TVA. // À VÉRIFIER (CGI, art. 261-4-4° a)
 */
export const PLACE_EN_SESSION = { prixHt: 350, tauxDeTva: 0.2, supports: 30, repas: 25 } as const;

export type CodeDAcheteur = "particuliers" | "entreprises";

/**
 * QUI ACHÈTE (hypothèse du cours) : 120 commandes au trimestre, pour moitié des particuliers qui se
 * forment à leurs frais (une place chacun) et pour moitié des entreprises (deux places en moyenne,
 * pour deux salariés) : 180 places, 1,5 place par commande.
 */
export const ACHETEURS_DU_SITE: readonly { code: CodeDAcheteur; nom: string; commandes: number; placesParCommande: number }[] = [
  { code: "particuliers", nom: "Particuliers", commandes: 60, placesParCommande: 1 },
  { code: "entreprises", nom: "Entreprises", commandes: 60, placesParCommande: 2 },
];

/**
 * LES FRAIS DU PAIEMENT EN LIGNE (hypothèse du cours, l'ordre de grandeur des prestataires de paiement
 * par carte en 2026) : 1,5 % du montant payé, toutes taxes comprises, et 0,25 € par commande. Tout le
 * monde paie par carte. Une commande remboursée ne rend pas ses frais.
 */
export const FRAIS_DE_PAIEMENT = { taux: 0.015, parCommande: 0.25 } as const;

export type CodeDeSource = "naturel" | "payant" | "reseaux" | "lettre" | "direct";

export interface SourceDeTrafic {
  code: CodeDeSource;
  nom: string;
  /** Les visites du trimestre (les sessions de navigation que l'outil de mesure d'audience compte). */
  visites: number;
  /** Ce que la source a coûté dans le trimestre, en dépenses directes (le temps de l'équipe est à part). */
  cout: number;
  /** Les commandes passées au cours de ces visites. */
  commandes: number;
}

/**
 * LES CINQ SOURCES DE TRAFIC DU PREMIER TRIMESTRE (hypothèses du cours) : 12 000 visites, 120
 * commandes, 8 100 € de dépenses.
 *   - Le référencement naturel (SEO), les visiteurs venus d'un moteur de recherche sans annonce : 5 000
 *     visites ; il coûte la rédactrice web qui écrit les pages des sessions et les articles, et l'outil
 *     de suivi des positions, 2 400 €.
 *   - Les liens sponsorisés (SEA), les annonces payées au clic sur le moteur de recherche : 3 000 clics,
 *     3 600 € (1,20 € le clic en moyenne).
 *   - Les réseaux sociaux : 2 000 visites, dont 1 000 venues des publications de la page d'ATLAS
 *     (voir PUBLICATIONS) et 1 000 de publications sponsorisées, payées 1 800 €.
 *   - La lettre d'information, envoyée aux clients et aux contacts qui y ont consenti :
 *     1 000 visites, 300 € (le routeur et la création).
 *   - L'accès direct, ceux qui tapent l'adresse du site : 1 000 visites, sans dépense.
 * Les visiteurs ne convertissent pas pareil : 0,7 % pour le naturel, 1,5 % pour les liens, 0,2 % pour
 * les réseaux sociaux (on y flâne), 2 % pour la lettre (ce sont des clients), 1,6 % pour l'accès
 * direct. En tout, 1 %.
 */
export const SOURCES_DE_TRAFIC: readonly SourceDeTrafic[] = [
  { code: "naturel", nom: "Référencement naturel", visites: 5_000, cout: 2_400, commandes: 35 },
  { code: "payant", nom: "Liens sponsorisés", visites: 3_000, cout: 3_600, commandes: 45 },
  { code: "reseaux", nom: "Réseaux sociaux", visites: 2_000, cout: 1_800, commandes: 4 },
  { code: "lettre", nom: "Lettre d'information", visites: 1_000, cout: 300, commandes: 20 },
  { code: "direct", nom: "Accès direct", visites: 1_000, cout: 0, commandes: 16 },
];

/**
 * LES CONTACTS DU SITE (hypothèse du cours) : 240 visiteurs ont rempli le formulaire « Une formation
 * sur mesure pour votre équipe ? » au lieu d'acheter une place. Ce sont des demandes de formation intra,
 * que les commerciaux rappellent ; elles ne font pas de chiffre d'affaires sur le site.
 */
export const CONTACTS_DU_SITE = 240;

/** L'OBJECTIF DU DIRECTEUR pour le trimestre suivant (hypothèse du cours) : 20 % de chiffre d'affaires en plus. */
export const HAUSSE_VISEE = 0.2;

/** Un point de la courbe des liens sponsorisés : un budget du trimestre et les clics qu'il achète. */
export interface PalierDesLiens {
  budget: number;
  clics: number;
}

/**
 * LA COURBE DES LIENS SPONSORISÉS (hypothèse du cours) : les clics qu'achète un budget du trimestre, à
 * cinq paliers, de zéro au double du budget du trimestre 1 (3 600 €). Entre deux paliers, la courbe est
 * une droite ; au-delà du dernier, elle ne monte plus. Elle est CONCAVE : les annonces se vendent aux
 * enchères, et pour plus de clics il faut enchérir sur des mots plus disputés ou plus haut sur les
 * mêmes ; chaque tranche de 1 800 € achète moins de clics (2 000, 1 000, 600, puis 240). Les visiteurs
 * en plus convertissent comme ceux du trimestre 1 : 1,5 %.
 */
export const COURBE_DES_LIENS: readonly PalierDesLiens[] = [
  { budget: 0, clics: 0 },
  { budget: 1_800, clics: 2_000 },
  { budget: 3_600, clics: 3_000 },
  { budget: 5_400, clics: 3_600 },
  { budget: 7_200, clics: 3_840 },
];

/**
 * LA RÉTRACTATION (le droit de 2026, et une hypothèse du cours). Un particulier qui achète en ligne
 * peut se rétracter dans les 14 jours, sans motif (Code de la consommation, art. L221-18) ; une
 * entreprise qui achète pour ses salariés ne le peut pas. Le Code du travail ajoute, pour la formation
 * qu'une personne paie elle-même, qu'aucune somme ne peut être exigée avant la fin de ce délai.
 * // À VÉRIFIER (Code du travail, art. L6353-5 et L6353-6 : délai de 14 jours, et 30 % au plus du prix
 * à la fin du délai, le solde au fil de la formation)
 * Au premier trimestre, 1 particulier sur 10 s'est rétracté : sa place est rendue, ses frais de
 * paiement sont perdus.
 */
export const RETRACTATION = { delaiEnJours: 14, partDesParticuliers: 0.1 } as const;

export type CodeDHebergement = "mutualise" | "dedie";

/**
 * L'HÉBERGEMENT DU SITE (hypothèses du cours, des offres courantes en 2026). Le site est aujourd'hui
 * sur un serveur MUTUALISÉ (partagé avec d'autres sites) : 30 € par mois, une disponibilité garantie de
 * 99,5 %. Le prestataire propose un serveur DÉDIÉ et infogéré (réservé au site, surveillé, sauvegardé)
 * : 100 € par mois, 99,95 %. Quand le site ne répond pas, les commandes de ces heures sont perdues
 * (les visiteurs vont chez un concurrent).
 */
export const HEBERGEMENTS: readonly { code: CodeDHebergement; nom: string; prixParMois: number; disponibilite: number }[] = [
  { code: "mutualise", nom: "Serveur mutualisé", prixParMois: 30, disponibilite: 0.995 },
  { code: "dedie", nom: "Serveur dédié infogéré", prixParMois: 100, disponibilite: 0.9995 },
];

/** Le prix TTC d'un montant hors taxes, au taux de la place. */
const ttc = (ht: number) => auCentime(ht * (1 + PLACE_EN_SESSION.tauxDeTva));

/** Les frais de paiement d'une commande payée `montantTtc`. */
export const fraisDUneCommande = (montantTtc: number) => auCentime(montantTtc * FRAIS_DE_PAIEMENT.taux + FRAIS_DE_PAIEMENT.parCommande);

/** La place, la commande moyenne et sa marge : tout ce que les autres calculs du site lisent. */
export function commandeMoyenne() {
  const p = PLACE_EN_SESSION;
  const coutVariable = p.supports + p.repas;
  const margeDUnePlace = p.prixHt - coutVariable;
  const commandes = somme(ACHETEURS_DU_SITE.map((a) => a.commandes));
  const places = somme(ACHETEURS_DU_SITE.map((a) => a.commandes * a.placesParCommande));
  const placesParCommande = places / commandes;
  const panier = auCentime(placesParCommande * p.prixHt);
  const acheteurs = ACHETEURS_DU_SITE.map((a) => {
    const ht = a.placesParCommande * p.prixHt;
    return { ...a, ht, ttc: ttc(ht), frais: fraisDUneCommande(ttc(ht)) };
  });
  const frais = auCentime(somme(acheteurs.map((a) => a.commandes * a.frais)) / commandes);
  const margeAvantFrais = auCentime(placesParCommande * margeDUnePlace);
  const marge = auCentime(margeAvantFrais - frais);
  return {
    prixHt: p.prixHt,
    prixTtc: ttc(p.prixHt),
    coutVariable,
    margeDUnePlace,
    commandes,
    places,
    placesParCommande,
    panier,
    panierTtc: ttc(panier),
    acheteurs,
    /** Les frais de paiement d'une commande moyenne. */
    frais,
    fraisDuTrimestre: auCentime(somme(acheteurs.map((a) => a.commandes * a.frais))),
    margeAvantFrais,
    /** La marge d'une commande moyenne, frais de paiement déduits. */
    marge,
    tauxDeMarge: marge / panier,
    /** Le ROAS sous lequel une dépense publicitaire perd de l'argent : chaque euro doit ramener panier ÷ marge euros de ventes. */
    roasSeuil: panier / marge,
  };
}

/** Les sources du trimestre : leurs taux, leurs coûts, leur chiffre d'affaires, leur ROAS et ce qu'elles laissent ; puis le site entier. */
export function traficDuSite() {
  const m = commandeMoyenne();
  const sources = SOURCES_DE_TRAFIC.map((s) => {
    const chiffreDAffaires = auCentime(s.commandes * m.panier);
    return {
      ...s,
      conversion: s.commandes / s.visites,
      coutParVisite: auCentime(s.cout / s.visites),
      coutParCommande: s.commandes > 0 ? auCentime(s.cout / s.commandes) : 0,
      chiffreDAffaires,
      roas: s.cout > 0 ? chiffreDAffaires / s.cout : null,
      margeNette: auCentime(s.commandes * m.marge - s.cout),
    };
  });
  const visites = somme(SOURCES_DE_TRAFIC.map((s) => s.visites));
  const commandes = somme(SOURCES_DE_TRAFIC.map((s) => s.commandes));
  const cout = somme(SOURCES_DE_TRAFIC.map((s) => s.cout));
  const chiffreDAffaires = auCentime(visites * (commandes / visites) * m.panier);
  return {
    m,
    sources,
    visites,
    commandes,
    cout,
    conversion: commandes / visites,
    conversionEnContact: CONTACTS_DU_SITE / visites,
    contacts: CONTACTS_DU_SITE,
    chiffreDAffaires,
    coutParCommande: auCentime(cout / commandes),
    margeNette: auCentime(commandes * m.marge - cout),
  };
}

/** Une source du trimestre, par son code. */
export function sourceDuSite(code: CodeDeSource) {
  const s = traficDuSite().sources.find((x) => x.code === code);
  if (!s) throw new Error(`Pas de source ${code}`);
  return s;
}

/** Ce qu'il faut, à rebours, pour un chiffre d'affaires visé : les visites, la conversion ou le panier, les deux autres restant ceux du trimestre. */
export function ceQuIlFautPour(chiffreVise: number) {
  const t = traficDuSite();
  return {
    chiffreVise,
    visites: chiffreVise / (t.conversion * t.m.panier),
    conversion: chiffreVise / (t.visites * t.m.panier),
    panier: auCentime(chiffreVise / (t.visites * t.conversion)),
  };
}

/** Les clics qu'achète un budget de liens sponsorisés : interpolés entre deux paliers, plats au-delà du dernier. */
export function clicsDesLiens(budget: number) {
  const c = COURBE_DES_LIENS;
  if (budget <= c[0]!.budget) return c[0]!.clics;
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1]!;
    const b = c[i]!;
    if (budget <= b.budget) return a.clics + ((budget - a.budget) / (b.budget - a.budget)) * (b.clics - a.clics);
  }
  return c.at(-1)!.clics;
}

/**
 * Les liens sponsorisés à un budget et à un taux de conversion de leurs visiteurs (celui du trimestre,
 * 1,5 %, par défaut) : les clics, les commandes attendues (non arrondies), le chiffre d'affaires, le ROAS,
 * la marge créée et le gain (marge créée − budget).
 */
export function liensSponsorises(budget: number, conversion = sourceDuSite("payant").conversion) {
  const m = commandeMoyenne();
  const clics = clicsDesLiens(budget);
  const commandes = clics * conversion;
  const chiffreDAffaires = auCentime(commandes * m.panier);
  return {
    budget,
    conversion,
    clics,
    commandes,
    chiffreDAffaires,
    coutParClic: clics > 0 ? auCentime(budget / clics) : 0,
    roas: budget > 0 ? chiffreDAffaires / budget : 0,
    margeCreee: auCentime(commandes * m.marge),
    gain: auCentime(commandes * m.marge - budget),
  };
}

/** Les paliers de la courbe, chacun avec ce qu'apporte le palier précédent à celui-ci : le clic en plus. */
export function paliersDesLiens(conversion = sourceDuSite("payant").conversion) {
  return COURBE_DES_LIENS.map((p, i) => {
    const l = liensSponsorises(p.budget, conversion);
    const precedent = COURBE_DES_LIENS[i - 1];
    if (!precedent) return { ...l, supplement: null };
    const avant = liensSponsorises(precedent.budget, conversion);
    const clics = l.clics - avant.clics;
    const budget = p.budget - precedent.budget;
    return {
      ...l,
      supplement: { de: precedent.budget, a: p.budget, budget, clics, coutDuClicEnPlus: auCentime(budget / clics), commandes: clics * conversion, gain: auCentime(l.gain - avant.gain) },
    };
  });
}

/** Le meilleur budget des liens : celui qui donne le plus grand gain, cherché par pas réguliers jusqu'au dernier palier. */
export function meilleurBudgetDesLiens(conversion = sourceDuSite("payant").conversion, pas = 600) {
  const max = COURBE_DES_LIENS.at(-1)!.budget;
  let meilleur = liensSponsorises(0, conversion);
  for (let b = pas; b <= max + 1e-9; b += pas) {
    const l = liensSponsorises(b, conversion);
    if (l.gain > meilleur.gain + 1e-9) meilleur = l;
  }
  return meilleur;
}

/** La rétractation du trimestre : les commandes des particuliers rendues, le chiffre d'affaires et la marge perdus, la conversion nette. */
export function retractationsDuTrimestre() {
  const t = traficDuSite();
  const particuliers = t.m.acheteurs.find((a) => a.code === "particuliers")!;
  const commandes = particuliers.commandes * RETRACTATION.partDesParticuliers;
  const chiffreDAffairesPerdu = auCentime(commandes * particuliers.ht);
  // La place rendue ne coûte ni supports ni repas ; ses frais de paiement, eux, restent payés.
  const margePerdue = auCentime(commandes * (particuliers.placesParCommande * t.m.margeDUnePlace));
  return {
    delaiEnJours: RETRACTATION.delaiEnJours,
    part: RETRACTATION.partDesParticuliers,
    commandes,
    chiffreDAffairesPerdu,
    margePerdue,
    commandesNettes: t.commandes - commandes,
    conversionNette: (t.commandes - commandes) / t.visites,
    chiffreDAffairesNet: auCentime(t.chiffreDAffaires - chiffreDAffairesPerdu),
  };
}

/** Les deux hébergements sur le trimestre : les heures où le site ne répond pas, la marge qu'elles font perdre, le coût total. */
export function hebergementsDuTrimestre() {
  const t = traficDuSite();
  const heures = TRIMESTRE_DU_SITE.jours * 24;
  const margeParHeure = auCentime((t.commandes * t.m.marge) / heures);
  const offres = HEBERGEMENTS.map((h) => {
    const indisponibilite = auCentime(heures * (1 - h.disponibilite));
    const margePerdue = auCentime(indisponibilite * margeParHeure);
    const prix = h.prixParMois * 3;
    return { ...h, indisponibilite, margePerdue, prix, total: auCentime(prix + margePerdue) };
  });
  const moinsCher = offres.reduce((a, b) => (b.total < a.total ? b : a));
  return { heures, margeParHeure, offres, moinsCher, ecart: auCentime(Math.abs(offres[0]!.total - offres[1]!.total)) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. CONTENUS, COMMUNAUTÉ ET E-RÉPUTATION
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDePublication = "conseils" | "annonces" | "temoignages" | "videos";

export interface TypeDePublication {
  code: CodeDePublication;
  nom: string;
  /** Les publications du trimestre sur la page d'ATLAS du réseau professionnel. */
  publications: number;
  /** Les fois où elles ont été affichées dans un fil d'actualité. */
  impressions: number;
  /** Les réactions, commentaires et partages. */
  interactions: number;
  /** Les clics vers le site. */
  clics: number;
}

/**
 * LES PUBLICATIONS DU PREMIER TRIMESTRE (hypothèses du cours) : 39 publications, 3 par semaine, sur la
 * page d'ATLAS du réseau professionnel. 114 000 impressions, 3 900 interactions, 1 000 clics vers le
 * site : les 1 000 visites non payées de la source « réseaux sociaux ».
 *   - Les conseils pratiques (des carrousels : « 5 erreurs du premier entretien annuel ») font réagir
 *     (4 %) mais mènent peu au site.
 *   - Les annonces de sessions (date, prix, lien d'inscription) font peu réagir (1 %), mais leurs
 *     lecteurs cliquent.
 *   - Les témoignages de participants, filmés ou écrits, font les deux.
 *   - Les vidéos courtes coûtent à produire et restent rares.
 */
export const PUBLICATIONS: readonly TypeDePublication[] = [
  { code: "conseils", nom: "Conseils pratiques", publications: 18, impressions: 54_000, interactions: 2_160, clics: 300 },
  { code: "annonces", nom: "Annonces de sessions", publications: 12, impressions: 24_000, interactions: 240, clics: 400 },
  { code: "temoignages", nom: "Témoignages de participants", publications: 6, impressions: 21_000, interactions: 1_050, clics: 250 },
  { code: "videos", nom: "Vidéos courtes", publications: 3, impressions: 15_000, interactions: 450, clics: 50 },
];

/** LA COMMUNAUTÉ (hypothèse du cours) : les abonnés de la page, au début et à la fin du trimestre. */
export const ABONNES = { debut: 4_800, fin: 5_400 } as const;

/**
 * LE COMMUNITY MANAGER (hypothèse du cours) : une indépendante, payée 100 € par publication (la
 * rédaction, le visuel, la publication, puis la modération des commentaires). À 3 publications par
 * semaine, 3 900 € le trimestre.
 */
export const COMMUNITY_MANAGER = { parPublication: 100 } as const;

/**
 * LE MARKETING ENTRANT DU TRIMESTRE (hypothèses du cours) : au lieu d'aller chercher les entreprises,
 * le cabinet publie ce qui les fait venir à lui, contre leurs coordonnées.
 *   - Un livre blanc, « Manager une équipe hybride », à télécharger contre un formulaire : sa page a eu
 *     1 600 visites et 240 téléchargements. Il a coûté 1 800 € (sa rédaction par un consultant et sa mise
 *     en page).
 *   - Un webinaire d'une heure, « Réussir ses entretiens annuels » : 300 inscrits, 120 présents. Il a
 *     coûté 600 € (l'outil et la préparation).
 * Un téléchargement et un présent sont des CONTACTS : des entreprises qui ont laissé leurs
 * coordonnées et consenti à être rappelées, comme les 600 demandes de la campagne digitale de N. Le
 * cours suppose qu'ils suivent le même entonnoir : 1 contact sur 300 devient un compte.
 */
export const LIVRE_BLANC = { visitesDeLaPage: 1_600, telechargements: 240, cout: 1_800 } as const;
export const WEBINAIRE = { inscrits: 300, presents: 120, cout: 600 } as const;

/**
 * LES CONTACTS QU'AMÈNENT LES PUBLICATIONS, SELON LEUR RYTHME (hypothèse du cours) : les contacts du
 * trimestre venus du lien d'une publication vers le livre blanc ou le webinaire, de 0 à 6 publications
 * par semaine (l'indice est le rythme). À 3 par semaine, 65 des 360 contacts du trimestre. La courbe
 * est CONCAVE : au-delà de 3 ou 4 publications par semaine, les abonnés se lassent et le réseau montre
 * moins chaque publication (30, 20, 15, 10, puis 4 et 2 contacts de plus).
 */
export const CONTACTS_SELON_LE_RYTHME: readonly number[] = [0, 30, 50, 65, 75, 79, 81];

/** Le rythme du trimestre 1 : 3 publications par semaine. */
export const RYTHME_DU_TRIMESTRE = 3;

/**
 * LES AVIS DES PARTICIPANTS À LA FIN DU TRIMESTRE (hypothèse du cours) : 40 avis sur la fiche du cabinet
 * du moteur de recherche, de 1 à 5 étoiles (l'indice + 1 est la note). Note moyenne 4,5.
 */
export const AVIS_PAR_NOTE: readonly number[] = [1, 1, 2, 9, 27];

/**
 * LA NOTE ET LA CONVERSION (hypothèse du cours, dans le sens des études sur les avis en ligne) : le site
 * affiche la note arrondie au dixième ; à 4,5, il convertit comme au trimestre 1 (1 %), et chaque dixième
 * de point perdu ou gagné ôte ou ajoute 0,04 point de conversion, quelle que soit la source.
 */
export const CONVERSION_ET_NOTE = { noteDeReference: 4.5, parDixieme: 0.0004 } as const;

/** Les publications du trimestre : l'engagement et le taux de clic de chaque type, puis le total. */
export function publicationsDuTrimestre() {
  const types = PUBLICATIONS.map((p) => ({
    ...p,
    engagement: p.interactions / p.impressions,
    tauxDeClic: p.clics / p.impressions,
    clicsParPublication: p.clics / p.publications,
  }));
  const total = {
    publications: somme(PUBLICATIONS.map((p) => p.publications)),
    impressions: somme(PUBLICATIONS.map((p) => p.impressions)),
    interactions: somme(PUBLICATIONS.map((p) => p.interactions)),
    clics: somme(PUBLICATIONS.map((p) => p.clics)),
  };
  return {
    types,
    total: { ...total, engagement: total.interactions / total.impressions, tauxDeClic: total.clics / total.impressions },
    parSemaine: total.publications / TRIMESTRE_DU_SITE.semaines,
    croissanceDesAbonnes: (ABONNES.fin - ABONNES.debut) / ABONNES.debut,
    coutDuCommunityManager: total.publications * COMMUNITY_MANAGER.parPublication,
  };
}

/** Ce que vaut un contact dans l'entonnoir de la campagne de N : 1 ÷ (contacts par compte) d'un compte, à trois mesures. */
export function valeurDUnContact(f: FicheDuCabinet) {
  const d = canalDe(f, "digital");
  const contactsParCompte = d.contacts / d.contrats;
  const v = valeurDUnClient(f);
  const marge = compteMoyen(f).marge;
  return {
    contactsParCompte,
    premiereAnnee: auCentime(marge / contactsParCompte),
    actualisee: auCentime(v.actualisee / contactsParCompte),
    simple: auCentime(v.simple / contactsParCompte),
    coutParContactDeLaCampagne: auCentime(d.cout / d.contacts),
  };
}

/** Le marketing entrant du trimestre : les taux, les contacts, leur coût et les comptes attendus. */
export function marketingEntrant(f: FicheDuCabinet) {
  const v = valeurDUnContact(f);
  const contacts = LIVRE_BLANC.telechargements + WEBINAIRE.presents;
  const cout = LIVRE_BLANC.cout + WEBINAIRE.cout;
  const comptes = contacts / v.contactsParCompte;
  return {
    tauxDeTelechargement: LIVRE_BLANC.telechargements / LIVRE_BLANC.visitesDeLaPage,
    tauxDePresence: WEBINAIRE.presents / WEBINAIRE.inscrits,
    contacts,
    cout,
    coutParContact: auCentime(cout / contacts),
    comptes,
    coutParCompte: auCentime(cout / comptes),
    valeurSimple: auCentime(comptes * valeurDUnClient(f).simple),
    contactsDesPublications: CONTACTS_SELON_LE_RYTHME[RYTHME_DU_TRIMESTRE]!,
  };
}

/** Les contacts qu'amène un rythme : ceux de la courbe, interpolés entre deux rythmes entiers (un graphique trace aussi l'entre-deux). */
export function contactsAuRythme(rythme: number) {
  const c = CONTACTS_SELON_LE_RYTHME;
  if (rythme < 0 || rythme > c.length - 1) throw new Error(`Pas de rythme ${rythme}`);
  const i = Math.min(Math.floor(rythme + 1e-9), c.length - 2);
  return c[i]! + (rythme - i) * (c[i + 1]! - c[i]!);
}

/** Le rythme de publication : les contacts amenés, le coût du community manager, la valeur créée et le gain, pour une valeur d'un contact. */
export function rythmeDePublication(rythme: number, valeurDUnContactChoisie: number) {
  const contacts = contactsAuRythme(rythme);
  const publications = rythme * TRIMESTRE_DU_SITE.semaines;
  const cout = publications * COMMUNITY_MANAGER.parPublication;
  const valeurCreee = auCentime(contacts * valeurDUnContactChoisie);
  return { rythme, publications, contacts, cout, coutParContact: contacts > 0 ? auCentime(cout / contacts) : 0, valeurCreee, gain: auCentime(valeurCreee - cout) };
}

/** Le meilleur rythme pour une valeur d'un contact : le plus grand gain, de 0 à 6 publications par semaine. */
export function meilleurRythme(valeurDUnContactChoisie: number) {
  let meilleur = rythmeDePublication(0, valeurDUnContactChoisie);
  for (let r = 1; r < CONTACTS_SELON_LE_RYTHME.length; r++) {
    const x = rythmeDePublication(r, valeurDUnContactChoisie);
    if (x.gain > meilleur.gain + 1e-9) meilleur = x;
  }
  return meilleur;
}

/** La note des avis : le nombre, les points, la moyenne, la part d'avis à 4 ou 5 étoiles ; avec des avis en plus, à une note donnée. */
export function noteDesAvis(enPlus: { note: number; avis: number }[] = []) {
  const avis = somme(AVIS_PAR_NOTE) + somme(enPlus.map((x) => x.avis));
  const points = somme(AVIS_PAR_NOTE.map((n, i) => n * (i + 1))) + somme(enPlus.map((x) => x.avis * x.note));
  const moyenne = points / avis;
  return {
    avis,
    points,
    moyenne,
    affichee: Math.round(moyenne * 10 + 1e-9) / 10,
    partDeBonsAvis: (AVIS_PAR_NOTE[3]! + AVIS_PAR_NOTE[4]! + somme(enPlus.filter((x) => x.note >= 4).map((x) => x.avis))) / avis,
  };
}

/** La conversion du site à une note affichée, et ce qu'elle change aux commandes et à la marge d'un trimestre de 12 000 visites. */
export function conversionALaNote(noteAffichee: number) {
  const t = traficDuSite();
  const dixiemes = Math.round((noteAffichee - CONVERSION_ET_NOTE.noteDeReference) * 10);
  const conversion = t.conversion + dixiemes * CONVERSION_ET_NOTE.parDixieme;
  const commandes = t.visites * conversion;
  return {
    noteAffichee,
    dixiemes,
    conversion,
    commandes,
    commandesEnPlus: commandes - t.commandes,
    margeEnPlus: auCentime((commandes - t.commandes) * t.m.marge),
  };
}

/** Les avis à cinq étoiles qu'il faut, après des avis donnés, pour que la moyenne revienne à une note visée. */
export function avisACinqEtoilesPour(noteVisee: number, apres: { note: number; avis: number }[]) {
  const n = noteDesAvis(apres);
  // (points + 5k) ÷ (avis + k) ≥ note visée  ⇔  k ≥ (note × avis − points) ÷ (5 − note)
  return Math.max(0, Math.ceil((noteVisee * n.avis - n.points) / (5 - noteVisee) - 1e-9));
}
