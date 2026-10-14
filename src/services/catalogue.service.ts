import { and, asc, desc, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import * as cacheDeNext from "next/cache";
import { db } from "@/db";
import {
  catalogueJournal,
  catalogueModules,
  catalogueOffres,
  catalogueReglages,
  codesPromo,
  demandesDeDevis,
  users,
} from "@/db/schema";
import { requirePlatformAdmin } from "@/services/admin.service";
import {
  CODE_PROMO_VALIDE,
  erreurDeRemise,
  erreursDeLOffre,
  estUneOffreDeLaGrille,
  normaliserLeCode,
  promotionEnCours,
  texteDuBandeau,
  verifierLeCode,
  type Catalogue,
  type CodePromo,
  type CompositionDeModule,
  type Mention,
  type ModuleDuCatalogue,
  type OffreDuCatalogue,
  type RefusDuCode,
  AFFICHAGE_PAR_DEFAUT,
  normaliserAffichage,
  type ReglageDAffichage,
} from "@/config/catalogue";
import {
  DECOUVERTE_PAR_DEFAUT,
  ESSAI_PAR_DEFAUT,
  normaliserDecouverte,
  normaliserEssai,
  type ReglageDeLaDecouverte,
  type ReglageDeLEssai,
} from "@/config/decouverte";
import { CATALOGUE_PAR_DEFAUT, OFFRES, VARIABLES_DU_CATALOGUE } from "@/config/tarifs";
import { EPISODES } from "@/pedagogy/episodes/registre";

/**
 * LE CATALOGUE COMMERCIAL, LU ET ÉCRIT (migration 0041, /admin/offres).
 *
 * LA LECTURE est mise en cache (`unstable_cache`, étiquette « catalogue ») : /tarifs,
 * /devis, les bandes de prix, la Découverte et les murs de licence la partagent, sans
 * aller en base à chaque page. L'ENREGISTREMENT dans /admin/offres l'invalide
 * (`updateTag`, dans les actions). Une base vide (ou une table pas encore migrée) rend
 * le catalogue par défaut de config/tarifs.ts ; une panne de lecture aussi, sans que
 * la panne soit mise en cache.
 *
 * L'ÉCRITURE est réservée à l'administrateur de la plateforme : chaque fonction le
 * vérifie elle-même (`requirePlatformAdmin`), en plus de la session de l'action. Chaque
 * changement d'une offre, d'un module, d'une gratuité ou d'un code promo est JOURNALISÉ
 * (qui, quand, avant, après), et se lit dans /admin/offres.
 *
 * Le pilote HTTP de Neon n'offre pas de transactions : chaque garde tient en une
 * instruction (un plafond d'utilisations s'incrémente sous condition, la mise en avant
 * passe d'une offre à l'autre en deux temps sous un index unique partiel).
 */

export const ETIQUETTE_DU_CATALOGUE = "catalogue";

/** Ce que les pages lisent : le catalogue, les gratuités et la promotion affichée. */
export interface EtatDuCatalogue {
  catalogue: Catalogue;
  decouverte: ReglageDeLaDecouverte;
  essai: ReglageDeLEssai;
  /** Les prix de référence se lisent-ils sur les pages publiques ? (désactivé par défaut) */
  affichage: ReglageDAffichage;
  /** La promotion marquée « affichée » (en cours ou non : `promotionEnCours` le dit au rendu). */
  promotion: CodePromo | null;
}

type LigneDOffre = typeof catalogueOffres.$inferSelect;
type LigneDeModule = typeof catalogueModules.$inferSelect;
type LigneDeCode = typeof codesPromo.$inferSelect;

export const versOffre = (r: LigneDOffre): OffreDuCatalogue => ({
  code: r.code,
  rubrique: r.rubrique,
  public: r.public,
  nom: r.nom,
  sousTitre: r.sousTitre,
  tarif: r.tarif,
  prixCents: r.prixCents,
  libelleTarif: r.libelleTarif,
  inclus: [...(r.inclus ?? [])],
  precisions: [...(r.precisions ?? [])],
  formules: (r.formules ?? []).map((f) => ({ nom: f.nom, inclus: [...f.inclus] })),
  modules: (r.modules ?? []) as CompositionDeModule[],
  mention: (r.mention as Mention | null) ?? null,
  ordre: r.ordre,
  visible: r.visible,
  miseEnAvant: r.miseEnAvant,
  bouton: { libelle: r.boutonLibelle, cible: r.boutonCible },
  devisLibelle: r.devisLibelle,
  formulaire: r.formulaire,
});

const versModule = (r: LigneDeModule): ModuleDuCatalogue => ({
  code: r.code,
  nom: r.nom,
  description: r.description,
  effet: r.effet ?? null,
  actif: r.actif,
  ordre: r.ordre,
});

export const versCodePromo = (r: LigneDeCode): CodePromo => ({
  id: r.id,
  code: r.code,
  typeRemise: r.typeRemise,
  valeur: r.valeur,
  offres: r.offres ?? null,
  debut: r.debut,
  fin: r.fin,
  utilisationsMax: r.utilisationsMax,
  utilisations: r.utilisations,
  unParEtablissement: r.unParEtablissement,
  actif: r.actif,
  affiche: r.affiche,
});

const versLigneDOffre = (o: OffreDuCatalogue) => ({
  code: o.code,
  rubrique: o.rubrique,
  public: o.public,
  nom: o.nom.trim(),
  sousTitre: o.sousTitre.trim(),
  tarif: o.tarif,
  prixCents: o.prixCents,
  libelleTarif: o.libelleTarif?.trim() || null,
  inclus: o.inclus.map((x) => x.trim()).filter(Boolean),
  precisions: o.precisions.map((x) => x.trim()).filter(Boolean),
  formules: o.formules.map((f) => ({ nom: f.nom.trim(), inclus: f.inclus.map((x) => x.trim()).filter(Boolean) })),
  modules: o.modules,
  mention: o.mention,
  ordre: o.ordre,
  visible: o.visible,
  miseEnAvant: o.miseEnAvant,
  boutonLibelle: o.bouton.libelle.trim(),
  boutonCible: o.bouton.cible.trim(),
  devisLibelle: o.devisLibelle?.trim() || null,
  formulaire: o.formulaire,
});

/* ---------------------------------------------------------------------------
 * LA LECTURE.
 * ------------------------------------------------------------------------- */

/** Le cache garde du JSON : les dates de la promotion voyagent en texte. */
type EtatSerialise = Omit<EtatDuCatalogue, "promotion"> & {
  promotion: (Omit<CodePromo, "debut" | "fin"> & { debut: string | null; fin: string | null }) | null;
};

const estUnEpisode = (code: string) => EPISODES.some((e) => e.code === code);

/** La lecture brute, sans cache. Une table vide rend le défaut. */
export async function lireLEtatSansCache(): Promise<EtatDuCatalogue> {
  const [modules, offres, reglages, [promo]] = await Promise.all([
    db.select().from(catalogueModules).orderBy(asc(catalogueModules.ordre), asc(catalogueModules.code)),
    db.select().from(catalogueOffres).orderBy(asc(catalogueOffres.ordre), asc(catalogueOffres.code)),
    db.select().from(catalogueReglages),
    db.select().from(codesPromo).where(eq(codesPromo.affiche, true)).limit(1),
  ]);
  const reglage = (cle: string) => reglages.find((r) => r.cle === cle)?.valeur;
  return {
    catalogue: {
      modules: modules.length > 0 ? modules.map(versModule) : CATALOGUE_PAR_DEFAUT.modules,
      offres: offres.length > 0 ? offres.map(versOffre) : CATALOGUE_PAR_DEFAUT.offres,
    },
    decouverte: reglage("decouverte") === undefined ? DECOUVERTE_PAR_DEFAUT : normaliserDecouverte(reglage("decouverte"), estUnEpisode),
    essai: normaliserEssai(reglage("essai") ?? ESSAI_PAR_DEFAUT),
    affichage: normaliserAffichage(reglage("affichage") ?? AFFICHAGE_PAR_DEFAUT),
    promotion: promo ? versCodePromo(promo) : null,
  };
}

const serialiser = (e: EtatDuCatalogue): EtatSerialise => ({
  ...e,
  promotion: e.promotion
    ? { ...e.promotion, debut: e.promotion.debut?.toISOString() ?? null, fin: e.promotion.fin?.toISOString() ?? null }
    : null,
});

/**
 * La lecture en cache, créée au premier usage (un test peut remplacer `next/cache`). La clé
 * porte la VERSION de la forme lue : le cache de données de Next survit aux redémarrages
 * et aux déploiements, une forme nouvelle prend donc une clé nouvelle.
 */
let lectureEnCache: (() => Promise<EtatSerialise>) | null = null;
function lireEnCache(): Promise<EtatSerialise> {
  lectureEnCache ??= cacheDeNext.unstable_cache(async () => serialiser(await lireLEtatSansCache()), ["catalogue-v2"], {
    tags: [ETIQUETTE_DU_CATALOGUE],
  });
  return lectureEnCache();
}

/** Hors d'une requête Next (tests, scripts), le cache n'existe pas : on lit directement. */
const horsDeNext = (e: unknown) => /incrementalCache missing|"unstable_cache" export/.test(String(e));

/**
 * L'état du catalogue, en cache dans une requête Next, lu directement ailleurs (tests,
 * scripts). Une panne de lecture rend le défaut, journalisée, et n'est pas mise en cache.
 */
export async function lireLEtatDuCatalogue(): Promise<EtatDuCatalogue> {
  let e: EtatSerialise;
  try {
    e = await lireEnCache();
  } catch (erreur) {
    if (horsDeNext(erreur)) {
      return lireLEtatSansCache().catch((panne: unknown) => {
        console.error("[catalogue] lecture du catalogue échouée :", panne);
        return defaut();
      });
    }
    console.error("[catalogue] lecture du catalogue échouée :", erreur);
    return defaut();
  }
  return {
    ...e,
    // Une entrée de cache d'une version antérieure n'a pas tous les réglages : on normalise.
    affichage: normaliserAffichage(e.affichage),
    promotion: e.promotion
      ? {
          ...e.promotion,
          debut: e.promotion.debut ? new Date(e.promotion.debut) : null,
          fin: e.promotion.fin ? new Date(e.promotion.fin) : null,
        }
      : null,
  };
}

function defaut(): EtatDuCatalogue {
  return {
    catalogue: CATALOGUE_PAR_DEFAUT,
    decouverte: DECOUVERTE_PAR_DEFAUT,
    essai: ESSAI_PAR_DEFAUT,
    affichage: AFFICHAGE_PAR_DEFAUT,
    promotion: null,
  };
}

export const lireLeCatalogue = async (): Promise<Catalogue> => (await lireLEtatDuCatalogue()).catalogue;
export const lireLaDecouverte = async (): Promise<ReglageDeLaDecouverte> => (await lireLEtatDuCatalogue()).decouverte;
export const lireLEssai = async (): Promise<ReglageDeLEssai> => (await lireLEtatDuCatalogue()).essai;

/** Le bandeau de /tarifs, s'il y a une promotion en cours ; null sinon. */
export async function bandeauDeLaPromotion(maintenant: Date = new Date()): Promise<string | null> {
  const { catalogue, promotion, affichage } = await lireLEtatDuCatalogue();
  if (!promotion || !promotionEnCours(promotion, maintenant)) return null;
  const nomDe = (code: string) => catalogue.offres.find((o) => o.code === code)?.nom ?? code;
  return texteDuBandeau(promotion, nomDe, affichage.prixPublics);
}

/* ---------------------------------------------------------------------------
 * LE JOURNAL.
 * ------------------------------------------------------------------------- */

export type ObjetDuJournal = "offre" | "module" | "decouverte" | "essai" | "affichage" | "code_promo";

async function journaliser(
  auteurId: string,
  objet: ObjetDuJournal,
  cle: string,
  action: string,
  avant: unknown,
  apres: unknown,
): Promise<void> {
  const [u] = await db.select({ nom: users.displayName, email: users.email }).from(users).where(eq(users.id, auteurId));
  await db.insert(catalogueJournal).values({
    auteurId,
    auteur: u ? `${u.nom} (${u.email})` : "",
    objet,
    cle,
    action,
    avant: avant === undefined ? null : (avant as object | null),
    apres: apres === undefined ? null : (apres as object | null),
  });
}

export type EntreeDuJournal = typeof catalogueJournal.$inferSelect;

export async function lireLeJournal(limite = 60): Promise<EntreeDuJournal[]> {
  return db.select().from(catalogueJournal).orderBy(desc(catalogueJournal.quand)).limit(limite);
}

/* ---------------------------------------------------------------------------
 * LES OFFRES.
 * ------------------------------------------------------------------------- */

/** Un refus de /admin/offres : une ou plusieurs phrases à montrer. */
export class CatalogueRefuse extends Error {
  readonly erreurs: string[];
  constructor(erreurs: string[]) {
    super(erreurs.join(" "));
    this.name = "CatalogueRefuse";
    this.erreurs = erreurs;
  }
}

/** Le catalogue tel qu'il est en base, sans cache (la validation lit l'état réel). */
async function catalogueReel(): Promise<Catalogue> {
  return (await lireLEtatSansCache()).catalogue;
}

/** Les offres dont le nom est cité par les murs de licence et les phrases du site : il est figé. */
const NOMS_FIGES = new Set<string>(Object.keys(OFFRES));

/**
 * ENREGISTRE UNE OFFRE (création ou modification). Refuse, avec ses phrases, ce que
 * `erreursDeLOffre` refuse ; refuse aussi de changer le nom d'une offre de la grille,
 * de mettre en avant une deuxième offre (il faut déplacer la mise en avant) et de
 * retirer la seule mise en avant. Journalise avant et après.
 */
export async function enregistrerOffre(
  adminId: string,
  offre: OffreDuCatalogue,
  mode: "creation" | "modification",
): Promise<void> {
  await requirePlatformAdmin(adminId);
  const actuel = await catalogueReel();
  const avant = actuel.offres.find((o) => o.code === offre.code) ?? null;
  const erreurs = erreursDeLOffre(offre, actuel, VARIABLES_DU_CATALOGUE);
  if (mode === "creation" && avant) erreurs.push(`Le code « ${offre.code} » est déjà pris.`);
  if (mode === "modification" && !avant) erreurs.push(`L'offre « ${offre.code} » n'existe pas.`);
  if (avant && NOMS_FIGES.has(avant.code) && offre.nom.trim() !== avant.nom) {
    erreurs.push(
      `Le nom « ${avant.nom} » est figé : les murs de licence, les messages et les pages du site le citent. Créez une autre offre pour un autre nom.`,
    );
  }
  const enAvant = actuel.offres.find((o) => o.miseEnAvant && o.code !== offre.code);
  if (offre.miseEnAvant && enAvant) {
    erreurs.push(
      `L'offre ${enAvant.nom} est déjà mise en avant, et /tarifs n'a qu'un bouton plein : utilisez « Mettre en avant » dans la liste pour la déplacer.`,
    );
  }
  if (!offre.miseEnAvant && avant?.miseEnAvant) {
    erreurs.push("Cette offre porte le seul bouton plein de /tarifs : mettez-en une autre en avant d'abord.");
  }
  if (erreurs.length > 0) throw new CatalogueRefuse(erreurs);
  const ligne = versLigneDOffre(offre);
  if (avant) {
    await db
      .update(catalogueOffres)
      .set({ ...ligne, updatedAt: new Date() })
      .where(eq(catalogueOffres.code, offre.code));
  } else {
    await db.insert(catalogueOffres).values(ligne);
  }
  await journaliser(adminId, "offre", offre.code, avant ? "modification" : "creation", avant, offre);
}

/**
 * DÉPLACE LA MISE EN AVANT sur une offre : la seule carte au bouton plein de /tarifs. Elle
 * doit être une carte de l'arène, visible. En deux instructions (sans transaction) : on
 * retire d'abord l'ancienne, puis on pose la nouvelle ; l'index unique partiel garantit
 * qu'il n'y en a jamais deux.
 */
export async function mettreEnAvant(adminId: string, code: string): Promise<void> {
  await requirePlatformAdmin(adminId);
  const actuel = await catalogueReel();
  const cible = actuel.offres.find((o) => o.code === code);
  if (!cible) throw new CatalogueRefuse([`L'offre « ${code} » n'existe pas.`]);
  if (cible.rubrique !== "arene" || !cible.visible) {
    throw new CatalogueRefuse(["Seule une carte de l'arène visible sur /tarifs peut être mise en avant."]);
  }
  const avant = actuel.offres.find((o) => o.miseEnAvant)?.code ?? null;
  if (avant === code) return;
  await db.update(catalogueOffres).set({ miseEnAvant: false, updatedAt: new Date() }).where(ne(catalogueOffres.code, code));
  await db.update(catalogueOffres).set({ miseEnAvant: true, updatedAt: new Date() }).where(eq(catalogueOffres.code, code));
  await journaliser(adminId, "offre", code, "mise_en_avant", { miseEnAvant: avant }, { miseEnAvant: code });
}

/** Retire une offre créée dans /admin. Celles de la grille ne se suppriment pas : on les masque. */
export async function supprimerOffre(adminId: string, code: string): Promise<void> {
  await requirePlatformAdmin(adminId);
  const actuel = await catalogueReel();
  const avant = actuel.offres.find((o) => o.code === code);
  if (!avant) return;
  if (estUneOffreDeLaGrille(code)) {
    throw new CatalogueRefuse(["Une offre de la grille ne se supprime pas : décochez « visible sur /tarifs »."]);
  }
  if (avant.miseEnAvant) throw new CatalogueRefuse(["Mettez une autre offre en avant avant de supprimer celle-ci."]);
  const reference = actuel.offres.find((o) => o.mention?.mode === "calculee" && o.mention.reference === code);
  if (reference) throw new CatalogueRefuse([`La mention de l'offre ${reference.nom} se calcule sur celle-ci.`]);
  await db.delete(catalogueOffres).where(eq(catalogueOffres.code, code));
  await journaliser(adminId, "offre", code, "suppression", avant, null);
}

/* ---------------------------------------------------------------------------
 * LES MODULES.
 * ------------------------------------------------------------------------- */

export const CODE_DE_MODULE_VALIDE = /^[a-z][a-z0-9-]{1,29}$/;

/**
 * ENREGISTRE UN MODULE. Les modules à effet (l'arène, les épisodes) gardent leur code et
 * leur effet, et restent actifs ; un nouveau module est descriptif. Un module qu'une
 * offre compose ne se désactive pas.
 */
export async function enregistrerModule(
  adminId: string,
  m: { code: string; nom: string; description: string; actif: boolean; ordre: number },
  mode: "creation" | "modification",
): Promise<void> {
  await requirePlatformAdmin(adminId);
  const actuel = await catalogueReel();
  const avant = actuel.modules.find((x) => x.code === m.code) ?? null;
  const erreurs: string[] = [];
  if (!CODE_DE_MODULE_VALIDE.test(m.code)) erreurs.push("Le code : 2 à 30 caractères, minuscules, chiffres et tirets.");
  if (!m.nom.trim()) erreurs.push("Le nom est requis.");
  if (mode === "creation" && avant) erreurs.push(`Le code « ${m.code} » est déjà pris.`);
  if (mode === "modification" && !avant) erreurs.push(`Le module « ${m.code} » n'existe pas.`);
  if (avant?.effet && !m.actif) erreurs.push(`Le module ${avant.nom} a un effet dans le produit : il reste actif.`);
  const utilisateurs = actuel.offres.filter((o) => o.modules.some((x) => x.module === m.code));
  if (avant?.actif && !m.actif && utilisateurs.length > 0) {
    erreurs.push(`Des offres le composent (${utilisateurs.map((o) => o.nom).join(", ")}) : retirez-le d'abord.`);
  }
  if (!Number.isInteger(m.ordre)) erreurs.push("L'ordre est un nombre entier.");
  if (erreurs.length > 0) throw new CatalogueRefuse(erreurs);
  const ligne = {
    code: m.code,
    nom: m.nom.trim(),
    description: m.description.trim(),
    effet: avant?.effet ?? null,
    actif: m.actif,
    ordre: m.ordre,
  };
  if (avant) {
    await db.update(catalogueModules).set({ ...ligne, updatedAt: new Date() }).where(eq(catalogueModules.code, m.code));
  } else {
    if ((await db.select().from(catalogueModules).limit(1)).length === 0) {
      // Une base sans modules lit le défaut : on le verse avant d'en ajouter un.
      await db.insert(catalogueModules).values(CATALOGUE_PAR_DEFAUT.modules.map((x) => ({ ...x }))).onConflictDoNothing();
    }
    await db.insert(catalogueModules).values(ligne);
  }
  await journaliser(adminId, "module", m.code, avant ? "modification" : "creation", avant, { ...ligne });
}


/* ---------------------------------------------------------------------------
 * LES GRATUITÉS.
 * ------------------------------------------------------------------------- */

async function ecrireReglage(adminId: string, cle: "decouverte" | "essai" | "affichage", valeur: object): Promise<void> {
  await db
    .insert(catalogueReglages)
    .values({ cle, valeur, modifiePar: adminId })
    .onConflictDoUpdate({ target: catalogueReglages.cle, set: { valeur, modifiePar: adminId, updatedAt: new Date() } });
}

/**
 * LA DÉCOUVERTE : les niveaux ouverts en solo, les démonstrations et leur niveau. La
 * règle serveur la lit (services/acces.service.ts, `getPlatformConfig().vitrineSolo`).
 */
export async function enregistrerLaDecouverte(adminId: string, d: ReglageDeLaDecouverte): Promise<void> {
  await requirePlatformAdmin(adminId);
  const inconnus = d.demos.filter((c) => !estUnEpisode(c));
  if (inconnus.length > 0) throw new CatalogueRefuse([`Épisodes inconnus : ${inconnus.join(", ")}.`]);
  const apres = normaliserDecouverte(d, estUnEpisode);
  const avant = (await lireLEtatSansCache()).decouverte;
  await ecrireReglage(adminId, "decouverte", apres);
  await journaliser(adminId, "decouverte", "decouverte", "modification", avant, apres);
}

/** L'ESSAI D'ÉTABLISSEMENT : désactivé par défaut, une durée maximale s'il est permis. */
export async function enregistrerLEssai(adminId: string, e: ReglageDeLEssai): Promise<void> {
  await requirePlatformAdmin(adminId);
  const apres = normaliserEssai(e);
  const avant = (await lireLEtatSansCache()).essai;
  await ecrireReglage(adminId, "essai", apres);
  await journaliser(adminId, "essai", "essai", "modification", avant, apres);
}

/**
 * L'AFFICHAGE DES PRIX SUR LE SITE (désactivé par défaut, décision d'octobre 2026 : « les
 * offres se font sur mesure et aboutissent à une demande de devis »). Le rallumer remet
 * les prix de référence sur /tarifs, les bandes de prix et la confirmation du devis.
 */
export async function enregistrerLAffichage(adminId: string, a: ReglageDAffichage): Promise<void> {
  await requirePlatformAdmin(adminId);
  const apres = normaliserAffichage(a);
  const avant = (await lireLEtatSansCache()).affichage;
  await ecrireReglage(adminId, "affichage", apres);
  await journaliser(adminId, "affichage", "affichage", "modification", avant, apres);
}

/* ---------------------------------------------------------------------------
 * LES CODES PROMO.
 * ------------------------------------------------------------------------- */

export interface SaisieDeCodePromo {
  code: string;
  typeRemise: "pourcentage" | "montant";
  valeur: number;
  offres: string[] | null;
  debut: Date | null;
  fin: Date | null;
  utilisationsMax: number | null;
  unParEtablissement: boolean;
  actif: boolean;
  affiche: boolean;
}

/** Ce qui ne va pas dans un code promo ; vide : il s'enregistre. */
export function erreursDuCode(s: SaisieDeCodePromo, catalogue: Catalogue): string[] {
  const e: string[] = [];
  if (!CODE_PROMO_VALIDE.test(s.code)) e.push("Le code : 3 à 30 caractères, lettres capitales, chiffres, tirets.");
  const r = erreurDeRemise({ type: s.typeRemise, valeur: s.valeur });
  if (r) e.push(r);
  if (s.offres !== null) {
    if (s.offres.length === 0) e.push("Choisissez au moins une offre, ou « toutes les offres ».");
    const inconnues = s.offres.filter((c) => !catalogue.offres.some((o) => o.code === c));
    if (inconnues.length > 0) e.push(`Offres inconnues : ${inconnues.join(", ")}.`);
  }
  if (s.debut && s.fin && s.fin <= s.debut) e.push("La fin suit le début.");
  if (s.utilisationsMax !== null && (!Number.isInteger(s.utilisationsMax) || s.utilisationsMax < 1)) {
    e.push("Le nombre d'utilisations maximum est un entier positif (ou vide : sans limite).");
  }
  if (s.affiche && !s.fin) e.push("Une promotion affichée sur /tarifs est datée : donnez sa fin.");
  return e;
}

/**
 * CRÉE OU MODIFIE UN CODE PROMO. Une seule promotion affichée à la fois : en afficher une
 * retire l'autre du bandeau (deux instructions, l'index unique partiel en garde).
 */
export async function enregistrerCodePromo(
  adminId: string,
  s: SaisieDeCodePromo,
  id: string | null,
): Promise<{ id: string }> {
  await requirePlatformAdmin(adminId);
  const saisie = { ...s, code: normaliserLeCode(s.code) };
  const erreurs = erreursDuCode(saisie, await catalogueReel());
  const [avant] = id ? await db.select().from(codesPromo).where(eq(codesPromo.id, id)) : [];
  if (id && !avant) erreurs.push("Ce code promo n'existe plus.");
  const [homonyme] = await db.select({ id: codesPromo.id }).from(codesPromo).where(eq(codesPromo.code, saisie.code));
  if (homonyme && homonyme.id !== id) erreurs.push(`Le code ${saisie.code} existe déjà.`);
  if (erreurs.length > 0) throw new CatalogueRefuse(erreurs);
  if (saisie.affiche) {
    await db
      .update(codesPromo)
      .set({ affiche: false, updatedAt: new Date() })
      .where(id ? and(eq(codesPromo.affiche, true), ne(codesPromo.id, id)) : eq(codesPromo.affiche, true));
  }
  const valeurs = {
    code: saisie.code,
    typeRemise: saisie.typeRemise,
    valeur: saisie.valeur,
    offres: saisie.offres,
    debut: saisie.debut,
    fin: saisie.fin,
    utilisationsMax: saisie.utilisationsMax,
    unParEtablissement: saisie.unParEtablissement,
    actif: saisie.actif,
    affiche: saisie.affiche,
  };
  let nouvelId: string;
  if (avant) {
    await db.update(codesPromo).set({ ...valeurs, updatedAt: new Date() }).where(eq(codesPromo.id, avant.id));
    nouvelId = avant.id;
  } else {
    const [l] = await db.insert(codesPromo).values({ ...valeurs, creePar: adminId }).returning({ id: codesPromo.id });
    nouvelId = l!.id;
  }
  await journaliser(
    adminId,
    "code_promo",
    saisie.code,
    avant ? "modification" : "creation",
    avant ? versCodePromo(avant) : null,
    { ...valeurs },
  );
  return { id: nouvelId };
}

export async function listerLesCodesPromo(): Promise<CodePromo[]> {
  return (await db.select().from(codesPromo).orderBy(desc(codesPromo.createdAt))).map(versCodePromo);
}

/** Le code promo d'une demande de devis, vérifié : la promotion à appliquer, ou le refus. */
export type VerificationDuCode =
  | { ok: true; code: CodePromo }
  | { ok: false; raison: RefusDuCode; message: string };

/**
 * VÉRIFIE UN CODE SAISI DANS /devis, côté serveur, sans rien consommer : existe-t-il, est-il
 * actif, commencé, pas expiré, pas épuisé, vaut-il pour cette offre, et l'établissement
 * l'a-t-il déjà utilisé (s'il ne vaut qu'une fois par établissement) ?
 */
export async function verifierUnCodePromo(args: {
  saisie: string;
  offre: string;
  nomDeLOffre: string;
  cleEtablissement: string;
  maintenant?: Date;
}): Promise<VerificationDuCode> {
  const [ligne] = await db.select().from(codesPromo).where(eq(codesPromo.code, normaliserLeCode(args.saisie)));
  const c = ligne ? versCodePromo(ligne) : null;
  let dejaUtilise = false;
  if (c?.unParEtablissement) {
    const [d] = await db
      .select({ id: demandesDeDevis.id })
      .from(demandesDeDevis)
      .where(and(eq(demandesDeDevis.codePromoId, c.id), eq(demandesDeDevis.promoCle, args.cleEtablissement)))
      .limit(1);
    dejaUtilise = !!d;
  }
  const v = verifierLeCode(c, {
    offre: args.offre,
    nomDeLOffre: args.nomDeLOffre,
    maintenant: args.maintenant ?? new Date(),
    dejaUtiliseParLEtablissement: dejaUtilise,
  });
  return v.ok ? { ok: true, code: c! } : v;
}

/**
 * CONSOMME UNE UTILISATION, en une instruction : le compteur ne monte que sous le plafond.
 * Faux : le code vient d'être épuisé par une autre demande.
 */
export async function consommerUneUtilisation(id: string): Promise<boolean> {
  const r = await db
    .update(codesPromo)
    .set({ utilisations: sql`${codesPromo.utilisations} + 1` })
    .where(and(eq(codesPromo.id, id), or(isNull(codesPromo.utilisationsMax), lt(codesPromo.utilisations, codesPromo.utilisationsMax))))
    .returning({ id: codesPromo.id });
  return r.length > 0;
}

/** Rend une utilisation consommée pour une demande qui n'a pas pu s'enregistrer. */
export async function rendreUneUtilisation(id: string): Promise<void> {
  await db
    .update(codesPromo)
    .set({ utilisations: sql`greatest(${codesPromo.utilisations} - 1, 0)` })
    .where(eq(codesPromo.id, id));
}
