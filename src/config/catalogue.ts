/**
 * LE CATALOGUE COMMERCIAL : LES MODULES, LES OFFRES, LES REMISES (migration 0041).
 *
 * Demande du propriétaire : « Donne-moi la possibilité de gérer l'offre depuis le panneau
 * admin, les gratuités, la composition de plusieurs modules, la gestion des remises, des
 * promos. » Le catalogue vit en base (tables `catalogue_*`, `codes_promo`), s'édite dans
 * /admin/offres, et se lit en cache (services/catalogue.service.ts). Sa valeur par défaut,
 * celle d'une base vide et des tests, est la grille de config/tarifs.ts
 * (`CATALOGUE_PAR_DEFAUT`), qui garde aussi les textes juridiques.
 *
 * Ce module est PUR et LÉGER (aucun import du registre) : l'aperçu de /admin/offres, un
 * composant client, s'en sert pour rendre la carte d'une offre avant l'enregistrement.
 *
 *  · UN MODULE est une brique vendable. Trois ont un EFFET dans le produit, et lui seul :
 *    `arene` (paramétrable : entreprises, niveaux, enseignants, parties en cours),
 *    `episodes` et `examen` (l'examen individuel, /teacher/examens).
 *    services/acces.service.ts les lit au travers des licences qui les portent. Les autres (intégration LMS, connexion établissement, accompagnement,
 *    compétition inter-établissements…) sont DESCRIPTIFS : affichés, vendus, sans verrou.
 *  · UNE OFFRE est une composition de modules, des limites, un prix (ou « sur devis »), et
 *    ce que sa carte dit. Les textes peuvent porter des VARIABLES, `{entreprises}`,
 *    `{demos}`… : un nombre tiré du produit ou d'un réglage ne s'écrit pas en base, il se
 *    lit au rendu (CLAUDE.md : aucun chiffre de configuration dans une prose statique).
 *  · UNE REMISE est un pourcentage ou un montant ; un CODE PROMO en porte une, avec ses
 *    dates, ses offres et son plafond. Les prix sont nets (franchise de TVA, art. 293 B) :
 *    une remise ne fait jamais apparaître de taxe.
 */

import { formatEuro, formatEuroCents } from "@/lib/format";

/* ---------------------------------------------------------------------------
 * LES MODULES.
 * ------------------------------------------------------------------------- */

/** Ce qu'un module fait dans le produit ; null : il est descriptif. */
export type EffetDuModule = "arene" | "episodes" | "examen";

export interface ModuleDuCatalogue {
  code: string;
  nom: string;
  description: string;
  effet: EffetDuModule | null;
  actif: boolean;
  ordre: number;
}

/** Le paramétrage du module `arene` dans une offre (le même que la grille d'octobre 2026). */
export interface ParametresArene {
  /** « une » : une entreprise choisie à l'achat ; « toutes ». */
  entreprises: "une" | "toutes";
  /** « un » : un niveau choisi à l'achat ; « tous ». */
  niveaux: "un" | "tous";
  /** Un plafond, « devis » (fixé au devis, saisi à l'attribution) ou null (sans limite). */
  enseignants: number | "devis" | null;
  /** Les parties de classe et concours en cours en même temps ; null : sans plafond. */
  partiesEnCours: number | null;
}

/** Un module dans une offre ; l'arène porte ses paramètres. */
export interface CompositionDeModule {
  module: string;
  parametres?: ParametresArene;
}

/* ---------------------------------------------------------------------------
 * LES OFFRES.
 * ------------------------------------------------------------------------- */

/**
 * Où l'offre se range sur /tarifs : une carte de l'arène, la ligne des réseaux, la bande
 * des épisodes manager, une ligne d'option.
 */
export type Rubrique = "arene" | "reseau" | "episodes" | "option";
export type PublicDeLOffre = "enseignement" | "entreprises";
/**
 * Le tarif : gratuit, un prix de référence par an, sur devis, inclus (une option), à
 * l'étude (une option qui n'existe pas encore).
 */
export type Tarif = "gratuit" | "prix" | "devis" | "inclus" | "etude";
/** Ce que le formulaire de /devis demande : une école, un réseau, une entreprise. */
export type Formulaire = "etablissement" | "reseau" | "entreprise";

/**
 * La mention comparative d'une carte : CALCULÉE sur les prix (« Dès 4 groupes, moins
 * cher que 4 offres Classe ») ou SAISIE.
 */
export type Mention =
  | { mode: "calculee"; reference: string; unite: string }
  | { mode: "saisie"; texte: string };

export interface FormuleDOffre {
  nom: string;
  inclus: string[];
}

export interface OffreDuCatalogue {
  /** Le code des adresses (`/devis?offre=…`) ; figé pour les offres de la grille. */
  code: string;
  rubrique: Rubrique;
  public: PublicDeLOffre;
  nom: string;
  /** Pour qui, en une ligne (la ligne des réseaux : son texte). */
  sousTitre: string;
  tarif: Tarif;
  /** Le prix de référence par an, en centimes ; null hors tarif « prix ». */
  prixCents: number | null;
  /** Ce que la ligne d'option affiche à la place du tarif ; null : le libellé du tarif. */
  libelleTarif: string | null;
  inclus: string[];
  precisions: string[];
  /** Les formules d'une offre qui en regroupe (les entreprises et organismes de formation). */
  formules: FormuleDOffre[];
  modules: CompositionDeModule[];
  mention: Mention | null;
  ordre: number;
  visible: boolean;
  /** L'offre qu'on veut vendre : le seul bouton plein de /tarifs. Exactement une. */
  miseEnAvant: boolean;
  bouton: { libelle: string; cible: string };
  /** Le nom de l'offre dans la liste de /devis ; null : « Offre <nom> » pour une carte, le nom sinon. */
  devisLibelle: string | null;
  formulaire: Formulaire;
}

export interface Catalogue {
  modules: ModuleDuCatalogue[];
  offres: OffreDuCatalogue[];
}

/** Les offres de la grille : leur code est figé (adresses, licences, devis) et elles ne se suppriment pas. */
export const OFFRES_DE_LA_GRILLE = [
  "decouverte",
  "classe",
  "programme",
  "campus",
  "reseau",
  "episodes",
  "entreprise",
] as const;
export const estUneOffreDeLaGrille = (code: string): boolean =>
  (OFFRES_DE_LA_GRILLE as readonly string[]).includes(code);

/** Les modules qui ont un effet : leur code et leur effet sont figés. */
export const MODULES_A_EFFET: readonly EffetDuModule[] = ["arene", "episodes", "examen"];

export const LIBELLES_DES_TARIFS: Record<Tarif, string> = {
  gratuit: "Gratuit",
  prix: "Prix de référence",
  devis: "Sur devis",
  inclus: "Inclus",
  etude: "À l'étude",
};

export const LIBELLES_DES_RUBRIQUES: Record<Rubrique, string> = {
  arene: "Carte de l'arène",
  reseau: "Ligne des réseaux",
  episodes: "Bande des épisodes manager",
  option: "Option",
};

export const LIBELLES_DES_PUBLICS: Record<PublicDeLOffre, string> = {
  enseignement: "Enseignement",
  entreprises: "Entreprises",
};

export const LIBELLES_DES_FORMULAIRES: Record<Formulaire, string> = {
  etablissement: "Une école ou un établissement",
  reseau: "Un réseau d'établissements",
  entreprise: "Une entreprise ou un organisme de formation",
};

/** Le paramétrage de l'arène d'une offre ; null : elle n'ouvre pas l'arène. */
export function parametresAreneDe(o: Pick<OffreDuCatalogue, "modules">): ParametresArene | null {
  return o.modules.find((m) => m.module === "arene")?.parametres ?? null;
}

/** L'offre ouvre-t-elle les épisodes manager ? */
export const ouvreLesEpisodes = (o: Pick<OffreDuCatalogue, "modules">): boolean =>
  o.modules.some((m) => m.module === "episodes");

/** L'offre ouvre-t-elle l'examen individuel (/teacher/examens) ? */
export const ouvreLExamen = (o: Pick<OffreDuCatalogue, "modules">): boolean =>
  o.modules.some((m) => m.module === "examen");

/**
 * Le palier de l'arène d'un paramétrage, celui qu'une licence enregistre (`arene`) et que
 * les refus nomment : un niveau choisi, c'est une Classe ; une entreprise, un Programme ;
 * toutes, un Campus.
 */
export function palierDeLArene(p: ParametresArene): "classe" | "programme" | "campus" {
  if (p.niveaux === "un") return "classe";
  if (p.entreprises === "une") return "programme";
  return "campus";
}

/* ---------------------------------------------------------------------------
 * LES VARIABLES DES TEXTES.
 * ------------------------------------------------------------------------- */

const VARIABLE = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/** Remplit `{nom}` par sa valeur ; une variable inconnue reste telle quelle (l'admin la voit). */
export function remplir(texte: string, variables: Readonly<Record<string, string>>): string {
  return texte.replace(VARIABLE, (tout, nom: string) =>
    Object.hasOwn(variables, nom) ? variables[nom]! : tout,
  );
}

/** Les variables d'un texte qui n'existent pas. */
export function variablesInconnues(texte: string, connues: readonly string[]): string[] {
  return [...texte.matchAll(VARIABLE)].map((m) => m[1]!).filter((n) => !connues.includes(n));
}

/* ---------------------------------------------------------------------------
 * LES PRIX, LES MENTIONS, LES REMISES.
 * ------------------------------------------------------------------------- */

/** « 290 € », « 12,50 € » : le formateur du site, sans décimale quand il n'y en a pas. */
export const euros = (cents: number): string =>
  Number.isInteger(cents / 100) ? formatEuro(cents / 100) : formatEuroCents(cents / 100);

/**
 * Dès combien d'unités une offre coûte STRICTEMENT moins que autant d'offres de
 * référence : à prix égal, la mention ne s'affiche pas plus tôt.
 */
export const seuilAvantageux = (prix: number, prixDeReference: number): number =>
  Math.floor(prix / prixDeReference) + 1;

/** La mention d'une offre, calculée sur les prix du catalogue ou saisie ; null : aucune. */
export function texteDeLaMention(
  o: Pick<OffreDuCatalogue, "mention" | "prixCents">,
  offres: readonly Pick<OffreDuCatalogue, "code" | "nom" | "prixCents">[],
): string | null {
  const m = o.mention;
  if (!m) return null;
  if (m.mode === "saisie") return m.texte.trim() || null;
  const ref = offres.find((x) => x.code === m.reference);
  if (!ref || !ref.prixCents || !o.prixCents) return null;
  const n = seuilAvantageux(o.prixCents, ref.prixCents);
  return `Dès ${n} ${m.unite}, moins cher que ${n} offres ${ref.nom}`;
}

export type TypeDeRemise = "pourcentage" | "montant";

export interface Remise {
  type: TypeDeRemise;
  /** Un pourcentage (1 à 100), ou un montant en centimes. */
  valeur: number;
}

/** Ce que la remise retire d'un prix, en centimes, jamais plus que le prix. */
export function montantDeLaRemise(baseCents: number, r: Remise): number {
  const brut = r.type === "pourcentage" ? Math.round((baseCents * r.valeur) / 100) : r.valeur;
  return Math.max(0, Math.min(baseCents, brut));
}

/** « −20 % », « −150 € ». */
export function libelleDeLaRemise(r: Remise): string {
  return r.type === "pourcentage" ? `−${r.valeur} %` : `−${euros(r.valeur)}`;
}

/** Une remise saisie est-elle recevable ? Une phrase sinon. */
export function erreurDeRemise(r: Remise): string | null {
  if (!Number.isInteger(r.valeur) || r.valeur <= 0) return "La remise doit être positive.";
  if (r.type === "pourcentage" && r.valeur > 100) return "Une remise ne dépasse pas 100 %.";
  return null;
}

/** Les motifs d'une remise commerciale à l'attribution d'une licence. */
export const MOTIFS_DE_REMISE = {
  volume: "Volume",
  "multi-annees": "Multi-années",
  reseau: "Réseau",
  fidelite: "Fidélité",
} as const;
export type MotifDeRemise = keyof typeof MOTIFS_DE_REMISE;
export const estUnMotifDeRemise = (v: unknown): v is MotifDeRemise =>
  typeof v === "string" && Object.hasOwn(MOTIFS_DE_REMISE, v);

/** Les motifs d'une licence offerte. */
export const MOTIFS_DE_GRATUITE = {
  pilote: "Pilote",
  partenaire: "Partenaire",
  presse: "Presse",
  geste: "Geste commercial",
} as const;
export type MotifDeGratuite = keyof typeof MOTIFS_DE_GRATUITE;
export const estUnMotifDeGratuite = (v: unknown): v is MotifDeGratuite =>
  typeof v === "string" && Object.hasOwn(MOTIFS_DE_GRATUITE, v);

/** Ce qu'est une licence : vendue, offerte, ou à l'essai. */
export type NatureDeLicence = "vendue" | "offerte" | "essai";

/* ---------------------------------------------------------------------------
 * LES CODES PROMO.
 * ------------------------------------------------------------------------- */

export interface CodePromo {
  id: string;
  code: string;
  typeRemise: TypeDeRemise;
  valeur: number;
  /** Les offres concernées ; null : toutes. */
  offres: string[] | null;
  debut: Date | null;
  fin: Date | null;
  utilisationsMax: number | null;
  utilisations: number;
  unParEtablissement: boolean;
  actif: boolean;
  affiche: boolean;
}

/** « RENTREE » : en capitales, sans espace. */
export const normaliserLeCode = (s: string): string => s.replace(/\s+/g, "").toUpperCase();
export const CODE_PROMO_VALIDE = /^[A-Z0-9_-]{3,30}$/;

/**
 * L'établissement d'une demande de devis, pour « une utilisation par établissement » :
 * l'UAI ou le SIRET s'il est donné, sinon le nom, sans casse, accents ni ponctuation.
 */
export function cleDEtablissement(organisation: string, identifiant: string): string {
  const id = identifiant.replace(/\s+/g, "").toUpperCase();
  if (id) return `id:${id}`;
  return `nom:${organisation
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()}`;
}

/** « 30 novembre 2026 », au fuseau de Paris. */
export const dateLongue = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
/** « 30 novembre », pour le bandeau. */
const jourEtMois = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export type RefusDuCode =
  | "inconnu"
  | "inactif"
  | "a_venir"
  | "expire"
  | "epuise"
  | "hors_offre"
  | "deja_utilise";

/**
 * LA RÈGLE D'UN CODE PROMO, pure : services/catalogue.service.ts l'applique côté serveur,
 * avec la promotion lue en base. Un refus dit pourquoi, en une phrase.
 */
export function verifierLeCode(
  c: CodePromo | null,
  demande: { offre: string; nomDeLOffre: string; maintenant: Date; dejaUtiliseParLEtablissement: boolean },
): { ok: true } | { ok: false; raison: RefusDuCode; message: string } {
  const refus = (raison: RefusDuCode, message: string) => ({ ok: false as const, raison, message });
  if (!c) return refus("inconnu", "Ce code promo n'existe pas. Vérifiez sa saisie, ou laissez le champ vide.");
  if (!c.actif) return refus("inactif", `Le code ${c.code} n'est plus actif.`);
  if (c.debut && demande.maintenant < c.debut) {
    return refus("a_venir", `Le code ${c.code} n'est valable qu'à partir du ${dateLongue(c.debut)}.`);
  }
  if (c.fin && demande.maintenant >= c.fin) {
    return refus("expire", `Le code ${c.code} a expiré le ${dateLongue(c.fin)}.`);
  }
  if (c.utilisationsMax !== null && c.utilisations >= c.utilisationsMax) {
    return refus("epuise", `Le code ${c.code} a déjà servi le nombre de fois prévu.`);
  }
  if (c.offres !== null && !c.offres.includes(demande.offre)) {
    return refus("hors_offre", `Le code ${c.code} ne s'applique pas à : ${demande.nomDeLOffre}.`);
  }
  if (c.unParEtablissement && demande.dejaUtiliseParLEtablissement) {
    return refus("deja_utilise", `Le code ${c.code} a déjà été utilisé pour cet établissement.`);
  }
  return { ok: true };
}

/** La promotion s'affiche-t-elle aujourd'hui ? Datée, active, commencée, pas finie ni épuisée. */
export function promotionEnCours(c: CodePromo, maintenant: Date): boolean {
  return (
    c.affiche &&
    c.actif &&
    c.fin !== null &&
    maintenant < c.fin &&
    (c.debut === null || c.debut <= maintenant) &&
    (c.utilisationsMax === null || c.utilisations < c.utilisationsMax)
  );
}

/** « A », « A et B », « A, B et C ». */
export function enumerer(mots: readonly string[]): string {
  if (mots.length < 2) return mots.join("");
  return `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}

/**
 * Le bandeau de /tarifs : « −20 % sur Programme jusqu'au 30 novembre avec le code RENTREE ».
 * La fin est exclusive (le code expire à cet instant) : le bandeau dit le dernier jour.
 * Prix cachés (`prix` faux) : un POURCENTAGE reste dit (ce n'est pas un montant) ; une
 * remise en euros devient « Une remise sur Programme… ».
 */
export function texteDuBandeau(c: CodePromo, nomDe: (code: string) => string, prix = true): string {
  const sur = c.offres === null ? "toutes les offres" : enumerer(c.offres.map(nomDe));
  const dernierJour = new Date(c.fin!.getTime() - 1);
  const remise =
    prix || c.typeRemise === "pourcentage"
      ? libelleDeLaRemise({ type: c.typeRemise, valeur: c.valeur })
      : "Une remise";
  return `${remise} sur ${sur} jusqu'au ${jourEtMois(dernierJour)} avec le code ${c.code}`;
}

/* ---------------------------------------------------------------------------
 * LA VALIDATION D'UNE OFFRE (ce que /admin/offres refuse).
 * ------------------------------------------------------------------------- */

export const CODE_D_OFFRE_VALIDE = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Les cibles de bouton permises : une page du site, jamais une adresse extérieure. */
export const CIBLE_VALIDE = /^\/[a-z0-9/_?=&.-]*$/i;

/**
 * Ce qui ne va pas dans une offre, en phrases ; vide : elle s'enregistre. `catalogue` est
 * l'état actuel (l'offre y figure peut-être déjà, sous son code) ; `variables`, les
 * variables que les textes peuvent porter.
 */
export function erreursDeLOffre(
  o: OffreDuCatalogue,
  catalogue: Catalogue,
  variables: readonly string[],
): string[] {
  const e: string[] = [];
  if (!CODE_D_OFFRE_VALIDE.test(o.code)) {
    e.push("Le code : 2 à 40 caractères, minuscules, chiffres et tirets.");
  }
  if (!o.nom.trim()) e.push("Le nom est requis.");
  if (o.tarif === "prix") {
    if (o.prixCents === null || !Number.isInteger(o.prixCents) || o.prixCents <= 0) {
      e.push("Un prix de référence positif est requis (ou choisissez « sur devis »).");
    }
  } else if (o.prixCents !== null) {
    e.push("Seul le tarif « prix de référence » porte un prix.");
  }
  if ((o.tarif === "inclus" || o.tarif === "etude") && o.rubrique !== "option") {
    e.push("« Inclus » et « à l'étude » ne valent que pour une option.");
  }
  if (o.tarif === "gratuit" && o.modules.length > 0 && o.rubrique !== "option") {
    e.push("Une offre gratuite n'ouvre aucun module : la Découverte se règle dans les gratuités.");
  }
  for (const m of o.modules) {
    const mod = catalogue.modules.find((x) => x.code === m.module);
    if (!mod) e.push(`Le module « ${m.module} » n'existe pas.`);
    else if (!mod.actif) e.push(`Le module « ${mod.nom} » est inactif : réactivez-le ou retirez-le.`);
    if (m.module === "arene") {
      const p = m.parametres;
      if (!p) e.push("Le module de l'arène porte ses paramètres.");
      else {
        if (p.niveaux === "un" && p.entreprises !== "une") {
          e.push("Un niveau au choix va avec une entreprise au choix (c'est l'offre d'un groupe).");
        }
        if (typeof p.enseignants === "number" && (!Number.isInteger(p.enseignants) || p.enseignants < 1)) {
          e.push("Le nombre d'enseignants est un entier positif.");
        }
        if (p.partiesEnCours !== null && (!Number.isInteger(p.partiesEnCours) || p.partiesEnCours < 1)) {
          e.push("Le nombre de parties en cours est un entier positif.");
        }
      }
    }
  }
  // L'examen individuel se joue dans le périmètre de l'arène (entreprise et niveau de la licence).
  if (ouvreLExamen(o) && !parametresAreneDe(o)) {
    e.push("Le module de l'examen individuel va avec celui de l'arène : l'examen se joue dans son périmètre.");
  }
  if (new Set(o.modules.map((m) => m.module)).size !== o.modules.length) {
    e.push("Un module ne figure qu'une fois dans une offre.");
  }
  if (o.miseEnAvant && (o.rubrique !== "arene" || !o.visible)) {
    e.push("Seule une carte de l'arène visible sur /tarifs peut être mise en avant.");
  }
  const mention = o.mention;
  if (mention?.mode === "calculee") {
    const ref = catalogue.offres.find((x) => x.code === mention.reference);
    if (!ref || ref.code === o.code) e.push("La mention calculée compare à une autre offre du catalogue.");
    else if (ref.tarif !== "prix" || o.tarif !== "prix") {
      e.push("Une mention calculée compare deux offres qui ont un prix.");
    }
    if (!mention.unite.trim()) e.push("La mention calculée dit son unité (groupes, entreprises…).");
  }
  if (mention?.mode === "saisie" && !mention.texte.trim()) e.push("La mention saisie est vide.");
  if (o.rubrique !== "option" && (!o.bouton.libelle.trim() || !CIBLE_VALIDE.test(o.bouton.cible))) {
    e.push("Le bouton : un libellé, et une cible qui commence par « / » (une page du site).");
  }
  const textes = [o.nom, o.sousTitre, ...o.inclus, ...o.precisions, ...o.formules.flatMap((f) => [f.nom, ...f.inclus])];
  const inconnues = [...new Set(textes.flatMap((t) => variablesInconnues(t, variables)))];
  if (inconnues.length > 0) e.push(`Variables inconnues : ${inconnues.map((v) => `{${v}}`).join(", ")}.`);
  if (/\b(?:HT|TTC)\b|TVA\s?\d/.test(textes.join(" "))) {
    e.push("Les prix sont nets (franchise de TVA, art. 293 B du CGI) : ni HT, ni TTC, ni taux de TVA.");
  }
  return e;
}

/* ---------------------------------------------------------------------------
 * CE QUE /tarifs AFFICHE : LE CATALOGUE RENDU, VARIABLES REMPLIES.
 * Pur et léger : la page serveur et l'aperçu de /admin/offres (client) le partagent.
 * ------------------------------------------------------------------------- */

/** Le libellé du tarif d'une offre : « Incluse » pour une option qui le précise, sinon celui du tarif. */
export const libelleDuTarif = (
  o: Pick<OffreDuCatalogue, "tarif" | "libelleTarif" | "prixCents">,
  prix = true,
): string =>
  o.libelleTarif?.trim() ||
  (o.tarif === "prix"
    ? prix && o.prixCents !== null
      ? euros(o.prixCents)
      : LIBELLES_DES_TARIFS.devis
    : LIBELLES_DES_TARIFS[o.tarif]);

/* ---------------------------------------------------------------------------
 * L'AFFICHAGE DES PRIX SUR LE SITE.
 *
 * Décision du propriétaire (octobre 2026) : « J'aimerais retirer les prix. Les offres se
 * font sur mesure et aboutissent à une demande de devis. » Le catalogue garde un prix de
 * référence INTERNE par offre (il prépare le devis, pose le montant d'une licence et sa
 * remise) ; les pages publiques ne le lisent que si l'administrateur rallume l'affichage
 * dans /admin/offres (désactivé par défaut). Éteint, `vueDesTarifs` ne transmet AUCUN
 * montant : ni prix, ni mention comparative calculée, ni remise en euros.
 * ------------------------------------------------------------------------- */

export interface ReglageDAffichage {
  /** Les prix de référence se lisent-ils sur les pages publiques ? */
  prixPublics: boolean;
}
export const AFFICHAGE_PAR_DEFAUT: ReglageDAffichage = { prixPublics: false };
export const normaliserAffichage = (brut: unknown): ReglageDAffichage => ({
  prixPublics: (brut as Partial<ReglageDAffichage> | null)?.prixPublics === true,
});

/** Un texte saisi qui porte un montant en euros ne se montre pas quand les prix sont cachés. */
const PORTE_UN_MONTANT = /\d[\d\s\u00a0\u202f.,]*\s?(?:€|euros?\b|k€)/i;

export interface BoutonDeCarte {
  libelle: string;
  href: string;
  /** Le seul bouton plein de la page : l'offre mise en avant. */
  principal: boolean;
}

/** Une carte de l'arène sur /tarifs. */
export interface CarteDeTarif {
  code: string;
  nom: string;
  pourQui: string;
  tarif: Tarif;
  /** Le prix de référence annuel, en centimes ; null hors tarif « prix ». */
  prixCents: number | null;
  mention: string | null;
  inclus: string[];
  precisions: string[];
  bouton: BoutonDeCarte;
}

/** Une colonne de la bande des épisodes : une offre, ses lignes ou ses formules. */
export interface ColonneDEpisodes {
  code: string;
  public: PublicDeLOffre;
  titre: string;
  inclus: string[];
  formules: FormuleDOffre[];
  bouton: BoutonDeCarte;
}

export interface VueDesTarifs {
  cartes: CarteDeTarif[];
  reseaux: { code: string; nom: string; texte: string; bouton: BoutonDeCarte }[];
  /** La bande des épisodes manager : son titre (le nom de sa première offre), son tarif, ses colonnes. */
  episodes: { nom: string; tarif: string; colonnes: ColonneDEpisodes[] } | null;
  options: { code: string; nom: string; prix: string }[];
}

type Variables = Readonly<Record<string, string>>;

const bouton = (o: OffreDuCatalogue): BoutonDeCarte => ({
  libelle: o.bouton.libelle,
  href: o.bouton.cible,
  principal: o.miseEnAvant,
});

/** La carte d'une offre, telle que /tarifs la montre (l'aperçu de /admin/offres s'en sert). */
export function carteDeTarif(
  o: OffreDuCatalogue,
  catalogue: Catalogue,
  variables: Variables,
  { prix = true }: { prix?: boolean } = {},
): CarteDeTarif {
  const mention = texteDeLaMention(o, catalogue.offres);
  const r = (t: string) => remplir(t, variables);
  return {
    code: o.code,
    nom: r(o.nom),
    pourQui: r(o.sousTitre),
    tarif: o.tarif,
    // Prix cachés : la carte ne reçoit aucun montant, ni la mention calculée sur les prix.
    prixCents: prix && o.tarif === "prix" ? o.prixCents : null,
    mention: prix ? mention : o.mention?.mode === "saisie" && mention && !PORTE_UN_MONTANT.test(mention) ? mention : null,
    inclus: o.inclus.map(r),
    precisions: o.precisions.map(r),
    bouton: bouton(o),
  };
}

/** Les offres visibles sur /tarifs, dans l'ordre d'affichage. */
export const offresVisibles = (c: Catalogue): OffreDuCatalogue[] =>
  c.offres.filter((o) => o.visible).sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));

export function vueDesTarifs(c: Catalogue, variables: Variables, { prix = true }: { prix?: boolean } = {}): VueDesTarifs {
  const r = (t: string) => remplir(t, variables);
  const visibles = offresVisibles(c);
  const deLaRubrique = (rub: Rubrique) => visibles.filter((o) => o.rubrique === rub);
  const episodes = deLaRubrique("episodes");
  return {
    cartes: deLaRubrique("arene").map((o) => carteDeTarif(o, c, variables, { prix })),
    reseaux: deLaRubrique("reseau").map((o) => ({ code: o.code, nom: r(o.nom), texte: r(o.sousTitre), bouton: bouton(o) })),
    episodes:
      episodes.length === 0
        ? null
        : {
            nom: r(episodes[0]!.nom),
            tarif: libelleDuTarif(episodes[0]!, prix),
            colonnes: episodes.map((o) => ({
              code: o.code,
              public: o.public,
              titre: r(o.sousTitre || o.nom),
              inclus: o.inclus.map(r),
              formules: o.formules.map((f) => ({ nom: r(f.nom), inclus: f.inclus.map(r) })),
              bouton: bouton(o),
            })),
          },
    options: deLaRubrique("option").map((o) => ({ code: o.code, nom: r(o.nom), prix: libelleDuTarif(o, prix) })),
  };
}

/** Le nom d'une offre dans la liste de /devis : celui qu'elle donne, ou « Offre <nom> » pour une carte de l'arène. */
export const nomDansLeDevis = (o: Pick<OffreDuCatalogue, "devisLibelle" | "rubrique" | "nom">): string =>
  o.devisLibelle?.trim() || (o.rubrique === "arene" ? `Offre ${o.nom}` : o.nom);

/** Les offres qu'on peut demander par devis : visibles, ni options ni gratuites, dans l'ordre. */
export const offresDuDevis = (c: Catalogue): OffreDuCatalogue[] =>
  offresVisibles(c).filter((o) => o.rubrique !== "option" && o.tarif !== "gratuit");

/** Les offres qu'on peut attribuer comme licence : celles qui ouvrent l'arène ou les épisodes. */
export const offresAttribuables = (c: Catalogue): OffreDuCatalogue[] =>
  [...c.offres]
    .filter((o) => parametresAreneDe(o) !== null || ouvreLesEpisodes(o))
    .sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));

/** L'offre mise en avant : il y en a exactement une. */
export function erreurDeMiseEnAvant(c: Catalogue): string | null {
  const n = c.offres.filter((o) => o.miseEnAvant).length;
  if (n === 1) return null;
  return n === 0
    ? "Aucune offre n'est mise en avant : /tarifs a besoin d'un bouton plein, un seul."
    : "Une seule offre peut être mise en avant : /tarifs n'a qu'un bouton plein.";
}

/** Le devis d'une demande : prix catalogue, remise, prix remisé (centimes). */
export interface DevisChiffre {
  prixCatalogueCents: number | null;
  remiseCents: number | null;
  remiseLibelle: string;
  prixRemiseCents: number | null;
}

/** Ce que donne une remise sur une offre : sur devis, seule la remise est connue. */
export function chiffrerLeDevis(prixCatalogueCents: number | null, r: Remise): DevisChiffre {
  if (prixCatalogueCents === null) {
    return { prixCatalogueCents: null, remiseCents: r.type === "montant" ? r.valeur : null, remiseLibelle: libelleDeLaRemise(r), prixRemiseCents: null };
  }
  const remiseCents = montantDeLaRemise(prixCatalogueCents, r);
  return {
    prixCatalogueCents,
    remiseCents,
    remiseLibelle: libelleDeLaRemise(r),
    prixRemiseCents: prixCatalogueCents - remiseCents,
  };
}
