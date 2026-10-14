import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, max, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { horsArchivesDEssai } from "@/services/archives-d-essai";
import {
  episodeCohortes,
  games,
  inscritsJournal,
  ltiComptes,
  orgInvites,
  orgLicences,
  samlComptes,
  organizationMembers,
  organizations,
  users,
} from "@/db/schema";
import { OFFRES, OFFRES_DE_L_ARENE, type OffreDeLArene } from "@/config/tarifs";
import { createInvite, getPlatformConfig, requirePlatformAdmin, updatePlatformConfig } from "@/services/admin.service";
import { assertCanAddTeacher } from "@/services/licence.service";
import { lireDomaines } from "@/config/inscriptions";
import {
  adresseDeContact,
  etatDuConsentement,
  lienDeDesinscription,
  type EtatDuConsentement,
} from "@/services/nouveautes.service";

/**
 * LES INSCRITS : QUI A UN COMPTE ENSEIGNANT, ET COMMENT LUI ÉCRIRE.
 *
 * Demande du propriétaire (octobre 2026) : « Comment voir qui est inscrit sur le site ? Les
 * professeurs, comment les contacter ? ». La page /admin/inscrits et son export lisent ce
 * service, et lui seul ; il vérifie lui-même que le demandeur est administrateur de la
 * plateforme (`requirePlatformAdmin`), en plus de la page et de la route.
 *
 * UN INSCRIT est un compte du PERSONNEL : enseignant ou administrateur d'au moins un
 * établissement, ou administrateur de la plateforme. JAMAIS UN ÉLÈVE : ni les identités
 * invitées (entrée par code, élève LTI, manager en cohorte), ni un compte qui n'est membre
 * qu'en tant qu'élève. Aucune donnée d'élève n'est lue ici (ni pseudo, ni équipe, ni
 * résultat) : on compte les parties de classe et les cohortes CRÉÉES par l'enseignant.
 *
 * Le volume est celui des enseignants d'une plateforme scolaire (des centaines, quelques
 * milliers) : six requêtes agrégées, puis le filtre, le tri et la page en mémoire. La
 * recherche porte aussi sur l'offre, qui se calcule et ne se stocke pas.
 */

export const TAILLE_DE_PAGE = 50;
const JOUR_MS = 24 * 60 * 60 * 1000;
/** « Nouveaux » : inscrits depuis ce nombre de jours. */
export const JOURS_DES_NOUVEAUX = 30;

export type Provenance = "inscription" | "lti" | "renater";
export const LIBELLES_DE_PROVENANCE: Record<Provenance, string> = {
  inscription: "Inscription directe",
  lti: "Plateforme LTI",
  renater: "RENATER",
};

export type RoleDuPersonnel = "teacher" | "org_admin";
export const LIBELLES_DE_ROLE: Record<RoleDuPersonnel, string> = {
  org_admin: "administrateur",
  teacher: "enseignant",
};

/** Ce qu'un filtre d'offre peut demander : une offre de l'arène, la Découverte, les épisodes. */
export type FiltreDOffre = OffreDeLArene | "decouverte" | "episodes";
export const FILTRES_D_OFFRE: readonly FiltreDOffre[] = [...OFFRES_DE_L_ARENE, "decouverte", "episodes"];

export interface FiltresDesInscrits {
  /** Recherche libre : nom, e-mail, établissement. */
  q: string;
  offre: FiltreDOffre | null;
  consentement: "oui" | "non" | null;
  /**
   * « actif » : tous les comptes non désactivés (invités compris) ; « invite » : les comptes
   * non désactivés inscrits par un code d'invitation ; « desactive » : désactivés.
   */
  etat: EtatDuCompte | null;
  /** Inscrits depuis 30 jours seulement. */
  nouveaux: boolean;
  tri: "recents" | "anciens";
  page: number;
}

export const FILTRES_PAR_DEFAUT: FiltresDesInscrits = {
  q: "",
  offre: null,
  consentement: null,
  etat: null,
  nouveaux: false,
  tri: "recents",
  page: 1,
};

/** L'état d'un compte, tel que la colonne « État » le montre. */
export type EtatDuCompte = "actif" | "invite" | "desactive";
export const ETATS_DU_COMPTE: readonly EtatDuCompte[] = ["actif", "invite", "desactive"];

type Parametres = Record<string, string | string[] | undefined> | URLSearchParams;

/** Les filtres lus dans l'adresse, chacun validé ; ce qui ne se lit pas retombe au défaut. Pur. */
export function lireLesFiltres(p: Parametres): FiltresDesInscrits {
  const lire = (cle: string): string => {
    const v = p instanceof URLSearchParams ? p.get(cle) : p[cle];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  const offre = lire("offre");
  const consentement = lire("consentement");
  const etat = lire("etat");
  const page = Number.parseInt(lire("page"), 10);
  return {
    q: lire("q").slice(0, 120),
    offre: (FILTRES_D_OFFRE as readonly string[]).includes(offre) ? (offre as FiltreDOffre) : null,
    consentement: consentement === "oui" || consentement === "non" ? consentement : null,
    etat: (ETATS_DU_COMPTE as readonly string[]).includes(etat) ? (etat as EtatDuCompte) : null,
    nouveaux: lire("nouveaux") === "1",
    tri: lire("tri") === "anciens" ? "anciens" : "recents",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

/** Les filtres remis en adresse, sans les valeurs par défaut (pour les liens de page et d'export). */
export function filtresEnAdresse(f: FiltresDesInscrits, change: Partial<FiltresDesInscrits> = {}): string {
  const g = { ...f, ...change };
  const p = new URLSearchParams();
  if (g.q) p.set("q", g.q);
  if (g.offre) p.set("offre", g.offre);
  if (g.consentement) p.set("consentement", g.consentement);
  if (g.etat) p.set("etat", g.etat);
  if (g.nouveaux) p.set("nouveaux", "1");
  if (g.tri !== "recents") p.set("tri", g.tri);
  if (g.page > 1) p.set("page", String(g.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Le lien de l'export : les filtres de la page (sans la page) ; « consentants » en plus. */
export function adresseDExport(f: FiltresDesInscrits, consentants = false): string {
  const filtres = filtresEnAdresse(f, { page: 1, ...(consentants ? { consentement: null } : {}) });
  if (!consentants) return `/admin/inscrits/export${filtres}`;
  return `/admin/inscrits/export${filtres}${filtres ? "&" : "?"}consentants=1`;
}

export interface EtablissementDeLInscrit {
  id: string;
  nom: string;
  role: RoleDuPersonnel;
}

export interface OffreEnCours {
  /** La plus grande offre de l'arène en cours parmi ses établissements ; null : Découverte. */
  arene: OffreDeLArene | null;
  /** Une licence en cours qui inclut les épisodes manager. */
  episodes: boolean;
}

export interface Inscrit {
  id: string;
  nom: string;
  /** L'adresse à laquelle lui écrire ; null pour un compte LTI ou RENATER sans courriel transmis. */
  email: string | null;
  etablissements: EtablissementDeLInscrit[];
  adminPlateforme: boolean;
  offre: OffreEnCours;
  inscritLe: Date;
  derniereConnexionLe: Date | null;
  partiesDeClasse: number;
  cohortes: number;
  provenance: Provenance;
  consentement: EtatDuConsentement;
  /** Désactivé par l'administration le … ; null : actif. */
  desactiveLe: Date | null;
  /** Le code d'invitation saisi à l'inscription (migration 0040) ; null : sans code. */
  invitation: { code: string; etablissement: string } | null;
  /** Désactivé l'emporte ; sinon invité s'il est venu par un code ; sinon actif. */
  etat: EtatDuCompte;
}

export interface CompteursDesInscrits {
  enseignants: number;
  /** Établissements où au moins un inscrit enseigne ou administre. */
  etablissements: number;
  /** Parmi eux, ceux qui ont une licence en cours (arène ou épisodes). */
  etablissementsSousLicence: number;
  consentants: number;
  nouveaux: number;
  desactives: number;
  /** Comptes non désactivés inscrits par un code d'invitation. */
  invites: number;
}

/** « Campus + Épisodes manager », « Découverte ». */
export function libelleDOffre(o: OffreEnCours): string {
  const arene: string = o.arene ? OFFRES[o.arene].nom : OFFRES.decouverte.nom;
  return o.episodes ? `${arene} + ${OFFRES.episodes.nom}` : arene;
}

/** « Lycée Monge (administrateur) · IUT de Lille (enseignant) » ; l'admin de la plateforme en plus. */
export function libelleDesEtablissements(i: Pick<Inscrit, "etablissements" | "adminPlateforme">): string {
  const parties = i.etablissements.map((e) => `${e.nom} (${LIBELLES_DE_ROLE[e.role]})`);
  if (i.adminPlateforme) parties.push("Administration de la plateforme");
  return parties.join(" · ");
}

const RANG_DE_L_ARENE: Record<OffreDeLArene, number> = { classe: 1, programme: 2, campus: 3 };
const meilleure = (a: OffreDeLArene | null, b: OffreDeLArene | null): OffreDeLArene | null =>
  a === null ? b : b === null ? a : RANG_DE_L_ARENE[b] > RANG_DE_L_ARENE[a] ? b : a;

/** Minuscules, sans accents : « Lycée » se trouve en tapant « lycee ». */
const plat = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * TOUS LES INSCRITS, sans filtre, avec ce qui se calcule. Le personnel seulement : la
 * requête de base ne retient un compte que s'il est administrateur de la plateforme ou
 * enseignant / administrateur d'un établissement.
 */
async function tousLesInscrits(
  maintenant: Date,
): Promise<{ inscrits: Inscrit[]; orgsSousLicence: Set<string> }> {
  const estDuPersonnel = or(
    eq(users.isPlatformAdmin, true),
    sql`exists (select 1 from ${organizationMembers} m where m.user_id = ${users.id} and m.role in ('teacher', 'org_admin'))`,
  );
  const [comptes, appartenances, licences, parties, cohortes, lti, saml] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        nom: users.displayName,
        adminPlateforme: users.isPlatformAdmin,
        inscritLe: users.createdAt,
        derniereConnexionLe: users.derniereConnexionLe,
        desactiveLe: users.desactiveLe,
        provenance: users.provenance,
        nouveautesConsentiesLe: users.nouveautesConsentiesLe,
        nouveautesRetireesLe: users.nouveautesRetireesLe,
        nouveautesVersionDuTexte: users.nouveautesVersionDuTexte,
        codeDInvitation: orgInvites.code,
        etablissementDuCode: organizations.name,
      })
      .from(users)
      .leftJoin(orgInvites, eq(orgInvites.id, users.invitationId))
      .leftJoin(organizations, eq(organizations.id, orgInvites.organizationId))
      .where(estDuPersonnel),
    db
      .select({
        userId: organizationMembers.userId,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        nom: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(sql`${organizationMembers.role} in ('teacher', 'org_admin')`),
    // Les licences EN COURS : commencées et pas encore finies.
    db
      .select({
        organizationId: orgLicences.organizationId,
        arene: orgLicences.arene,
        episodes: orgLicences.episodes,
      })
      .from(orgLicences)
      .where(and(lte(orgLicences.startsAt, maintenant), gte(orgLicences.endsAt, maintenant))),
    // Les parties de CLASSE créées (ni solo, ni partie de concours).
    db
      .select({ userId: games.createdBy, n: count() })
      .from(games)
      .where(
        and(
          isNull(games.competitionStageId),
          sql`${games.difficultyProfile}->>'kind' = 'class'`,
          horsArchivesDEssai,
        ),
      )
      .groupBy(games.createdBy),
    db
      .select({ userId: episodeCohortes.creePar, n: count() })
      .from(episodeCohortes)
      .where(isNotNull(episodeCohortes.creePar))
      .groupBy(episodeCohortes.creePar),
    db
      .select({ userId: ltiComptes.userId, courriel: ltiComptes.courriel, le: ltiComptes.dernierLancement })
      .from(ltiComptes)
      .where(eq(ltiComptes.role, "enseignant")),
    db
      .select({ userId: samlComptes.userId, courriel: samlComptes.courriel, le: samlComptes.derniereVenue })
      .from(samlComptes)
      .where(eq(samlComptes.role, "enseignant")),
  ]);

  const offreDeLOrg = new Map<string, OffreEnCours>();
  for (const l of licences) {
    const o = offreDeLOrg.get(l.organizationId) ?? { arene: null, episodes: false };
    offreDeLOrg.set(l.organizationId, { arene: meilleure(o.arene, l.arene ?? null), episodes: o.episodes || l.episodes });
  }
  const etablissementsDe = new Map<string, EtablissementDeLInscrit[]>();
  for (const a of appartenances) {
    const liste = etablissementsDe.get(a.userId) ?? [];
    liste.push({ id: a.organizationId, nom: a.nom, role: a.role as RoleDuPersonnel });
    etablissementsDe.set(a.userId, liste);
  }
  const partiesDe = new Map(parties.map((p) => [p.userId, Number(p.n)]));
  const cohortesDe = new Map(cohortes.map((c) => [c.userId!, Number(c.n)]));
  // Le courriel transmis par la plateforme LTI ou la fédération RENATER (le plus récent),
  // pour les comptes dont l'adresse de connexion est technique.
  const transmisDe = new Map<string, { courriel: string | null; le: Date; par: "lti" | "renater" }>();
  for (const l of [...lti.map((x) => ({ ...x, par: "lti" as const })), ...saml.map((x) => ({ ...x, par: "renater" as const }))]) {
    const avant = transmisDe.get(l.userId);
    if (!avant || l.le > avant.le) {
      transmisDe.set(l.userId, { courriel: l.courriel ?? avant?.courriel ?? null, le: l.le, par: l.par });
    } else if (!avant.courriel && l.courriel) {
      transmisDe.set(l.userId, { ...avant, courriel: l.courriel });
    }
  }

  const inscrits = comptes.map((c): Inscrit => {
    const etablissements = (etablissementsDe.get(c.id) ?? []).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    const offre = etablissements.reduce<OffreEnCours>(
      (acc, e) => {
        const o = offreDeLOrg.get(e.id);
        return o ? { arene: meilleure(acc.arene, o.arene), episodes: acc.episodes || o.episodes } : acc;
      },
      { arene: null, episodes: false },
    );
    const transmis = transmisDe.get(c.id);
    const invitation = c.codeDInvitation ? { code: c.codeDInvitation, etablissement: c.etablissementDuCode ?? "" } : null;
    return {
      id: c.id,
      nom: c.nom,
      email: adresseDeContact(c.email, transmis?.courriel ?? null),
      etablissements,
      adminPlateforme: c.adminPlateforme,
      offre,
      inscritLe: c.inscritLe,
      derniereConnexionLe: c.derniereConnexionLe,
      partiesDeClasse: partiesDe.get(c.id) ?? 0,
      cohortes: cohortesDe.get(c.id) ?? 0,
      provenance: c.provenance ?? transmis?.par ?? "inscription",
      consentement: etatDuConsentement(c),
      desactiveLe: c.desactiveLe,
      invitation,
      etat: c.desactiveLe ? "desactive" : invitation ? "invite" : "actif",
    };
  });
  return { inscrits, orgsSousLicence: new Set(offreDeLOrg.keys()) };
}

function compter(tous: Inscrit[], orgsSousLicence: ReadonlySet<string>, maintenant: Date): CompteursDesInscrits {
  const etablissements = new Set(tous.flatMap((i) => i.etablissements.map((e) => e.id)));
  return {
    enseignants: tous.length,
    etablissements: etablissements.size,
    etablissementsSousLicence: [...etablissements].filter((id) => orgsSousLicence.has(id)).length,
    consentants: tous.filter((i) => i.consentement.consent).length,
    nouveaux: tous.filter((i) => maintenant.getTime() - i.inscritLe.getTime() <= JOURS_DES_NOUVEAUX * JOUR_MS).length,
    desactives: tous.filter((i) => i.etat === "desactive").length,
    invites: tous.filter((i) => i.etat === "invite").length,
  };
}

function correspond(i: Inscrit, f: FiltresDesInscrits, maintenant: Date): boolean {
  if (f.q) {
    const cherche = plat(f.q);
    // Le code d'invitation aussi : « ses inscrits » depuis la liste des codes.
    const dans = [i.nom, i.email ?? "", ...i.etablissements.map((e) => e.nom), i.invitation?.code ?? ""].map(plat);
    if (!dans.some((d) => d.includes(cherche))) return false;
  }
  if (f.offre) {
    if (f.offre === "episodes" && !i.offre.episodes) return false;
    if (f.offre === "decouverte" && i.offre.arene !== null) return false;
    if (f.offre !== "episodes" && f.offre !== "decouverte" && i.offre.arene !== f.offre) return false;
  }
  if (f.consentement === "oui" && !i.consentement.consent) return false;
  if (f.consentement === "non" && i.consentement.consent) return false;
  if (f.etat === "actif" && i.etat === "desactive") return false;
  if (f.etat === "invite" && i.etat !== "invite") return false;
  if (f.etat === "desactive" && i.etat !== "desactive") return false;
  if (f.nouveaux && maintenant.getTime() - i.inscritLe.getTime() > JOURS_DES_NOUVEAUX * JOUR_MS) return false;
  return true;
}

function trier(lignes: Inscrit[], tri: FiltresDesInscrits["tri"]): Inscrit[] {
  const sens = tri === "anciens" ? 1 : -1;
  return [...lignes].sort((a, b) => sens * (a.inscritLe.getTime() - b.inscritLe.getTime()) || a.nom.localeCompare(b.nom, "fr"));
}

export interface ListeDesInscrits {
  lignes: Inscrit[];
  /** Le nombre d'inscrits qui répondent aux filtres, toutes pages confondues. */
  total: number;
  page: number;
  pages: number;
  /** Les compteurs de l'en-tête, sur TOUS les inscrits, quels que soient les filtres. */
  compteurs: CompteursDesInscrits;
}

/** LA PAGE : les inscrits filtrés, triés, découpés ; les compteurs sur l'ensemble. */
export async function listerInscrits(
  adminId: string,
  filtres: FiltresDesInscrits = FILTRES_PAR_DEFAUT,
  maintenant: Date = new Date(),
): Promise<ListeDesInscrits> {
  await requirePlatformAdmin(adminId);
  const { inscrits: tous, orgsSousLicence } = await tousLesInscrits(maintenant);
  const compteurs = compter(tous, orgsSousLicence, maintenant);
  const retenus = trier(
    tous.filter((i) => correspond(i, filtres, maintenant)),
    filtres.tri,
  );
  const pages = Math.max(1, Math.ceil(retenus.length / TAILLE_DE_PAGE));
  const page = Math.min(filtres.page, pages);
  return {
    lignes: retenus.slice((page - 1) * TAILLE_DE_PAGE, page * TAILLE_DE_PAGE),
    total: retenus.length,
    page,
    pages,
    compteurs,
  };
}

/* ---------------------------------------------------------------------------
 * L'EXPORT CSV.
 *
 * Pour un tableur réglé en français : point-virgule, BOM UTF-8 (sans lui, Excel lit les
 * accents de travers), dates « jj/mm/aaaa hh:mm » à l'heure de Paris, fin de ligne CRLF.
 * Une cellule de texte qui commence par = + - @ est neutralisée d'une apostrophe : un nom
 * ou un établissement est libre, et Excel exécuterait la formule.
 *
 * L'export « consentants » est le fichier d'un envoi de nouveautés : les seuls comptes
 * ACTIFS qui consentent ET ont une adresse, chacun avec SON lien de désinscription.
 * ------------------------------------------------------------------------- */

export const COLONNES_DE_L_EXPORT = [
  "Nom",
  "E-mail",
  "Établissements et rôles",
  "Offre en cours",
  "Inscrit le",
  "Dernière connexion",
  "Parties de classe créées",
  "Cohortes créées",
  "Provenance",
  "État",
  "Nouveautés",
  "Accord le",
  "Version du texte accepté",
  "Retrait le",
] as const;
export const COLONNE_DU_LIEN = "Lien de désinscription";

const dateParis = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const enDate = (d: Date | null) => (d ? dateParis.format(d).replace(",", "") : "");

/** Une cellule : guillemets échappés, formules neutralisées. Pur. */
export function celluleCsv(valeur: string | number | null): string {
  if (valeur === null) return "";
  let texte = typeof valeur === "number" ? String(valeur) : valeur;
  if (typeof valeur === "string" && /^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return /[";\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

/** « actif », « invité (code ABCD2345) », « désactivé le 11/10/2026 ». */
export function libelleDEtat(i: Pick<Inscrit, "desactiveLe" | "invitation">): string {
  if (i.desactiveLe) return `désactivé le ${enDate(i.desactiveLe).slice(0, 10)}`;
  return i.invitation ? `invité (code ${i.invitation.code})` : "actif";
}

export function libelleDuConsentement(c: EtatDuConsentement): string {
  return c.consent ? "oui" : c.retraitLe ? "retiré" : "non";
}

/** Le nom du fichier, en ASCII (voir la route du relevé de notes) et daté du jour, à Paris. */
export function nomDuFichier(consentants: boolean, maintenant: Date = new Date()): string {
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant);
  return `${consentants ? "inscrits-consentants" : "inscrits"}-${jour}.csv`;
}

export async function exporterLesInscrits(
  adminId: string,
  filtres: FiltresDesInscrits,
  options: { consentants: boolean; origine?: string },
  maintenant: Date = new Date(),
): Promise<{ nom: string; contenu: string; lignes: number }> {
  await requirePlatformAdmin(adminId);
  const { inscrits: tous } = await tousLesInscrits(maintenant);
  const retenus = trier(
    tous.filter(
      (i) =>
        correspond(i, { ...filtres, ...(options.consentants ? { consentement: "oui" as const } : {}) }, maintenant) &&
        // Le fichier d'un envoi : un compte désactivé n'en reçoit pas.
        (!options.consentants || (i.email !== null && i.desactiveLe === null)),
    ),
    filtres.tri,
  );
  const entete = options.consentants ? [...COLONNES_DE_L_EXPORT, COLONNE_DU_LIEN] : [...COLONNES_DE_L_EXPORT];
  const lignes = [entete.map(celluleCsv).join(";")];
  for (const i of retenus) {
    const cellules: (string | number | null)[] = [
      i.nom,
      i.email,
      libelleDesEtablissements(i),
      libelleDOffre(i.offre),
      enDate(i.inscritLe),
      enDate(i.derniereConnexionLe),
      i.partiesDeClasse,
      i.cohortes,
      LIBELLES_DE_PROVENANCE[i.provenance],
      libelleDEtat(i),
      libelleDuConsentement(i.consentement),
      enDate(i.consentement.accordLe),
      i.consentement.version,
      enDate(i.consentement.retraitLe),
    ];
    if (options.consentants) cellules.push(lienDeDesinscription(i, options.origine));
    lignes.push(cellules.map(celluleCsv).join(";"));
  }
  return {
    nom: nomDuFichier(options.consentants, maintenant),
    contenu: `﻿${lignes.join("\r\n")}\r\n`,
    lignes: retenus.length,
  };
}

/* ---------------------------------------------------------------------------
 * LA GESTION DES INSCRIPTIONS (« la gestion des inscriptions », demande du propriétaire).
 *
 * Par compte : désactiver ou réactiver, rattacher à un établissement ou l'en retirer. Pour
 * la plateforme : l'inscription libre, les domaines d'e-mail autorisés ou bloqués, les codes
 * d'invitation des établissements. Chaque geste relit le rôle d'administrateur de la
 * plateforme (`requirePlatformAdmin`), quel que soit l'écran qui l'appelle.
 * ------------------------------------------------------------------------- */

export type RefusDeGestion = "inconnu" | "soi-meme" | "admin" | "organisation" | "dernier" | "plafond" | "code";

export const REFUS_DE_GESTION: Record<RefusDeGestion, string> = {
  inconnu: "Ce compte n'est pas un compte enseignant inscrit.",
  "soi-meme": "Vous ne pouvez pas désactiver votre propre compte.",
  admin: "Un compte d'administration de la plateforme ne se désactive pas d'ici.",
  organisation: "Établissement introuvable.",
  dernier:
    "C'est son seul établissement : rattachez-le d'abord ailleurs, ou désactivez le compte, plutôt que de le laisser sans établissement.",
  plafond: "La licence de cet établissement est complète.",
  code: "Code d'invitation introuvable.",
};

export class GestionRefusee extends Error {
  constructor(
    public readonly raison: RefusDeGestion,
    message: string = REFUS_DE_GESTION[raison],
  ) {
    super(message);
    this.name = "GestionRefusee";
  }
}

/* LE JOURNAL : chaque geste réussi laisse une ligne (table inscrits_journal, migration 0040),
 * et une ligne dans les journaux du serveur. Un échec d'écriture n'annule pas le geste déjà
 * fait, mais se voit dans les journaux du serveur. */

export type GesteJournalise =
  | "desactivation"
  | "reactivation"
  | "rattachement"
  | "retrait"
  | "reglages"
  | "code-cree"
  | "code-revoque";

export const LIBELLES_DES_GESTES: Record<GesteJournalise, string> = {
  desactivation: "Compte désactivé",
  reactivation: "Compte réactivé",
  rattachement: "Rattaché à un établissement",
  retrait: "Retiré d'un établissement",
  reglages: "Réglages des inscriptions",
  "code-cree": "Code d'invitation créé",
  "code-revoque": "Code d'invitation révoqué",
};

async function journaliser(
  adminId: string,
  geste: GesteJournalise,
  args: { cible?: string | null; detail?: string | null } = {},
): Promise<void> {
  const detail = args.detail ? args.detail.slice(0, 500) : null;
  console.info(`[inscrits] ${geste} par ${adminId}${args.cible ? ` sur ${args.cible}` : ""}${detail ? ` : ${detail}` : ""}`);
  try {
    await db.insert(inscritsJournal).values({ adminId, geste, cibleUserId: args.cible ?? null, detail });
  } catch (e) {
    console.error("[inscrits] journal indisponible :", e);
  }
}

export interface EntreeDuJournal {
  id: string;
  le: Date;
  geste: GesteJournalise;
  detail: string | null;
  admin: string | null;
  cible: { id: string; nom: string } | null;
}

/** Les derniers gestes, tous comptes confondus ou sur un compte. */
export async function lireLeJournal(
  adminId: string,
  options: { cible?: string; n?: number } = {},
): Promise<EntreeDuJournal[]> {
  await requirePlatformAdmin(adminId);
  const lignes = await db
    .select()
    .from(inscritsJournal)
    .where(options.cible ? eq(inscritsJournal.cibleUserId, options.cible) : undefined)
    .orderBy(desc(inscritsJournal.createdAt))
    .limit(Math.min(options.n ?? 20, 200));
  const ids = [...new Set(lignes.flatMap((l) => [l.adminId, l.cibleUserId]).filter((x): x is string => x !== null))];
  const noms = new Map(
    ids.length
      ? (await db.select({ id: users.id, nom: users.displayName }).from(users).where(inArray(users.id, ids))).map((u) => [u.id, u.nom])
      : [],
  );
  return lignes.map((l) => ({
    id: l.id,
    le: l.createdAt,
    geste: l.geste as GesteJournalise,
    detail: l.detail,
    admin: l.adminId ? (noms.get(l.adminId) ?? null) : null,
    cible: l.cibleUserId ? { id: l.cibleUserId, nom: noms.get(l.cibleUserId) ?? "compte supprimé" } : null,
  }));
}

/** La fiche d'un inscrit (les colonnes du tableau), ou null si ce n'est pas un inscrit. */
export async function ficheDeLInscrit(adminId: string, userId: string, maintenant: Date = new Date()): Promise<Inscrit | null> {
  await requirePlatformAdmin(adminId);
  const { inscrits } = await tousLesInscrits(maintenant);
  return inscrits.find((i) => i.id === userId) ?? null;
}

async function inscritOuRefus(userId: string): Promise<Inscrit> {
  const { inscrits } = await tousLesInscrits(new Date());
  const i = inscrits.find((x) => x.id === userId);
  if (!i) throw new GestionRefusee("inconnu");
  return i;
}

/**
 * DÉSACTIVER : le compte ne se connecte plus (services/auth.service.ts), et sa session en
 * cours est coupée — la version de session avance d'un cran, et la lecture de session
 * refuse un compte désactivé (lib/session.ts). Ses parties, cohortes et rattachements
 * restent intacts ; la réactivation les lui rend.
 */
export async function desactiverCompte(adminId: string, userId: string, maintenant: Date = new Date()): Promise<void> {
  await requirePlatformAdmin(adminId);
  if (adminId === userId) throw new GestionRefusee("soi-meme");
  const i = await inscritOuRefus(userId);
  if (i.adminPlateforme) throw new GestionRefusee("admin");
  if (i.desactiveLe) return;
  await db
    .update(users)
    .set({ desactiveLe: maintenant, sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId));
  await journaliser(adminId, "desactivation", { cible: userId, detail: i.email });
}

export async function reactiverCompte(adminId: string, userId: string): Promise<void> {
  await requirePlatformAdmin(adminId);
  const i = await inscritOuRefus(userId);
  if (!i.desactiveLe) return;
  await db.update(users).set({ desactiveLe: null }).where(eq(users.id, userId));
  await journaliser(adminId, "reactivation", { cible: userId, detail: i.email });
}

/**
 * RATTACHER à un établissement, avec un rôle (enseignant ou administrateur) ; déjà membre,
 * il y change de rôle. Le plafond d'enseignants de la licence s'applique à un nouvel arrivant,
 * comme pour un code d'invitation.
 */
export async function rattacherAUnEtablissement(
  adminId: string,
  userId: string,
  organizationId: string,
  role: RoleDuPersonnel,
): Promise<void> {
  await requirePlatformAdmin(adminId);
  await inscritOuRefus(userId);
  const [org] = await db
    .select({ id: organizations.id, nom: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  if (!org) throw new GestionRefusee("organisation");
  const detail = `${org.nom} (${LIBELLES_DE_ROLE[role]})`;
  const [deja] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));
  if (deja) {
    await db
      .update(organizationMembers)
      .set({ role, updatedAt: new Date() })
      .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));
    await journaliser(adminId, "rattachement", { cible: userId, detail: `${detail}, rôle changé` });
    return;
  }
  try {
    await assertCanAddTeacher(organizationId);
  } catch (e) {
    throw new GestionRefusee("plafond", e instanceof Error ? e.message : REFUS_DE_GESTION.plafond);
  }
  await db.insert(organizationMembers).values({ userId, organizationId, role }).onConflictDoNothing();
  await journaliser(adminId, "rattachement", { cible: userId, detail });
}

/** RETIRER d'un établissement ; jamais du dernier (le compte ne serait plus un inscrit). */
export async function retirerDUnEtablissement(adminId: string, userId: string, organizationId: string): Promise<void> {
  await requirePlatformAdmin(adminId);
  const i = await inscritOuRefus(userId);
  const e = i.etablissements.find((x) => x.id === organizationId);
  if (!e) throw new GestionRefusee("organisation");
  if (i.etablissements.length === 1 && !i.adminPlateforme) throw new GestionRefusee("dernier");
  await db
    .delete(organizationMembers)
    .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));
  await journaliser(adminId, "retrait", { cible: userId, detail: `${e.nom} (${LIBELLES_DE_ROLE[e.role]})` });
}

/** Les établissements (hors « grand public »), pour le choix d'un rattachement. */
export async function etablissementsAuChoix(adminId: string): Promise<{ id: string; nom: string }[]> {
  await requirePlatformAdmin(adminId);
  const lignes = await db
    .select({ id: organizations.id, nom: organizations.name })
    .from(organizations)
    .where(sql`${organizations.kind} <> 'public'`);
  return lignes.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export interface ReglagesDesInscriptions {
  inscriptionLibre: boolean;
  domainesAutorises: string[];
  domainesBloques: string[];
}

export async function reglagesDesInscriptions(adminId: string): Promise<ReglagesDesInscriptions> {
  await requirePlatformAdmin(adminId);
  const c = await getPlatformConfig();
  return { inscriptionLibre: c.allowSelfServiceTeachers, domainesAutorises: c.domainesAutorises, domainesBloques: c.domainesBloques };
}

/** Enregistre les règles ; rend les saisies qui ne sont pas des domaines (ignorées). */
export async function reglerLesInscriptions(
  adminId: string,
  saisie: { inscriptionLibre: boolean; domainesAutorises: string; domainesBloques: string },
): Promise<{ ignores: string[] }> {
  const autorises = lireDomaines(saisie.domainesAutorises);
  const bloques = lireDomaines(saisie.domainesBloques);
  await updatePlatformConfig(adminId, {
    allowSelfServiceTeachers: saisie.inscriptionLibre,
    domainesAutorises: autorises.domaines,
    domainesBloques: bloques.domaines,
  });
  await journaliser(adminId, "reglages", {
    detail: `inscription libre : ${saisie.inscriptionLibre ? "ouverte" : "fermée"} ; autorisés : ${
      autorises.domaines.join(", ") || "tous"
    } ; bloqués : ${bloques.domaines.join(", ") || "aucun"}`,
  });
  return { ignores: [...autorises.ignores, ...bloques.ignores] };
}

export interface CodeDInvitation {
  id: string;
  code: string;
  role: "org_admin" | "teacher";
  actif: boolean;
  etablissementId: string;
  etablissement: string;
  creeLe: Date;
  /** L'usage : les comptes inscrits par ce code (depuis la migration 0040), le dernier quand. */
  utilisations: number;
  derniereUtilisationLe: Date | null;
}

/** Les codes d'invitation des établissements (le canal d'inscription par code), actifs d'abord. */
export async function listerCodesDInvitation(adminId: string): Promise<CodeDInvitation[]> {
  await requirePlatformAdmin(adminId);
  const lignes = await db
    .select({
      id: orgInvites.id,
      code: orgInvites.code,
      role: orgInvites.role,
      actif: orgInvites.active,
      etablissementId: organizations.id,
      etablissement: organizations.name,
      creeLe: orgInvites.createdAt,
    })
    .from(orgInvites)
    .innerJoin(organizations, eq(organizations.id, orgInvites.organizationId));
  const usages = await db
    .select({ id: users.invitationId, n: count(), dernier: max(users.createdAt) })
    .from(users)
    .where(isNotNull(users.invitationId))
    .groupBy(users.invitationId);
  const usageDe = new Map(usages.map((u) => [u.id!, u]));
  return lignes
    .filter((l): l is typeof l & { role: "org_admin" | "teacher" } => l.role !== "student")
    .map((l) => {
      const u = usageDe.get(l.id);
      return { ...l, utilisations: u ? Number(u.n) : 0, derniereUtilisationLe: u?.dernier ? new Date(u.dernier) : null };
    })
    .sort((a, b) => Number(b.actif) - Number(a.actif) || b.creeLe.getTime() - a.creeLe.getTime());
}

/**
 * CRÉER un code d'invitation pour un établissement (hors « grand public »), avec le rôle
 * qu'il donnera. Il inscrit même quand l'inscription libre est fermée, et passe outre la liste
 * des domaines autorisés (pas des bloqués) : config/inscriptions.ts.
 */
export async function creerCodeDInvitation(
  adminId: string,
  organizationId: string,
  role: RoleDuPersonnel,
): Promise<string> {
  await requirePlatformAdmin(adminId);
  const [org] = await db
    .select({ id: organizations.id, nom: organizations.name, kind: organizations.kind })
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  if (!org || org.kind === "public") throw new GestionRefusee("organisation");
  const code = await createInvite({ organizationId, role, createdBy: adminId });
  await journaliser(adminId, "code-cree", { detail: `${code} · ${org.nom} (${LIBELLES_DE_ROLE[role]})` });
  return code;
}

/** RÉVOQUER un code : il n'inscrit plus personne ; les comptes déjà inscrits restent. */
export async function desactiverCodeDInvitation(adminId: string, inviteId: string): Promise<void> {
  await requirePlatformAdmin(adminId);
  const [code] = await db
    .update(orgInvites)
    .set({ active: false })
    .where(and(eq(orgInvites.id, inviteId), eq(orgInvites.active, true)))
    .returning({ code: orgInvites.code });
  if (code) await journaliser(adminId, "code-revoque", { detail: code.code });
}
