import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { DOMParser } from "@xmldom/xmldom";
import { SAML } from "@node-saml/node-saml";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * LA CONNEXION PAR L'ÉTABLISSEMENT (SAML 2.0, RENATER), DE BOUT EN BOUT CÔTÉ SERVEUR.
 *
 * Une fédération simulée (tests/helpers/simulateur-saml.ts) : sa clé signe un agrégat
 * servi en HTTP local ; deux IdP, dont les clés signent (xml-crypto) et chiffrent
 * (xml-encryption) leurs réponses. Les VRAIES routes du fournisseur de services sont
 * appelées : départ (WAYF puis demande signée), ACS. Les cookies passent par un bocal
 * qui tient lieu de navigateur ; la base est celle des migrations (PGlite).
 *
 * Vérifié : enseignant (compte créé, rattaché, licence appliquée), étudiant (identité
 * persistante sur un deuxième « appareil », partie rejointe par code), établissement
 * inconnu, et chaque refus de sécurité (signature exigée, certificats de l'agrégat,
 * Audience, Destination, Recipient, NotBefore/NotOnOrAfter à ±60 s, InResponseTo connu
 * et à usage unique, rejeu d'assertion, IdP hors agrégat, XML malformé et XXE,
 * redirection limitée aux chemins internes, agrégat non signé ou falsifié ou expiré).
 */

const bocal = new Map<string, { valeur: string; options?: Record<string, unknown> }>();
vi.mock("next/headers", () => {
  const magasin = {
    get: (nom: string) => (bocal.has(nom) ? { name: nom, value: bocal.get(nom)!.valeur } : undefined),
    set: (nom: string, valeur: string, options?: Record<string, unknown>) => {
      if (options?.maxAge === 0) bocal.delete(nom);
      else bocal.set(nom, { valeur, options });
    },
    delete: (nom: string) => bocal.delete(nom),
  };
  return {
    cookies: async () => magasin,
    headers: async () => new Headers({ host: "www.business-arena.fr", "x-forwarded-proto": "https" }),
  };
});
vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  organizationMembers,
  organizations,
  players,
  samlComptes,
  samlIdps,
  samlRefus,
  teams,
  users,
} from "@/db/schema";
import { GET as metadataGet } from "@/app/api/saml/metadata/route";
import { GET as connexionGet } from "@/app/api/saml/connexion/route";
import { POST as acsPost } from "@/app/api/saml/acs/route";
import { joinGameAction } from "@/app/join/actions";
import { rejoindreParCodeAction } from "@/app/etablissement/parties/actions";
import { lireConfiguration, type ConfigurationSaml } from "@/saml/configuration";
import { COOKIE_REQUETE } from "@/saml/constantes";
import { lireAgregat, rafraichirFederation } from "@/saml/federation";
import { rattacher, rattachementDe } from "@/saml/etablissements";
import { hacherIdentifiant } from "@/saml/comptes";
import { partiesRejointes } from "@/saml/parties";
import { retourInterne } from "@/saml/retour";
import { attributsRetenus, roleSelonAffiliations } from "@/saml/attributs";
import { reglagesSaml } from "@/saml/requete";
import { decodeToken } from "@/lib/session";
import { unCompteSousLicence } from "@/services/acces.service";
import { createClassGame } from "@/services/game.service";
import { creerCohorteDeLEnseignant } from "@/services/cohortes.service";
import { setOrgLicence } from "@/services/licence.service";
import { parametrageDeLOffre, type OffreDeLArene } from "@/config/tarifs";
import { EPISODES } from "@/pedagogy/episodes/registre";
import {
  agregatSigne,
  federationSimulee,
  idSaml,
  lireDemande,
  paireDeTest,
  reponseSaml,
  signer,
  xmlDeLAgregat,
  type FederationSimulee,
  type IdpSimule,
  type OptionsDeReponse,
  type Paire,
  type Personne,
} from "../helpers/simulateur-saml";

const SITE = "https://www.business-arena.fr";
const ACS = `${SITE}/api/saml/acs`;
const ENTITY = `${SITE}/saml`;

let sim: FederationSimulee;
let sp: Paire;
let univ: IdpSimule;
let inconnue: IdpSimule;
/** Un IdP qui n'est PAS dans l'agrégat, avec sa propre clé. */
let horsAgregat: IdpSimule;
let serveur: Server;
let agregat = "";
let c: ConfigurationSaml;
let orgId: string;
let adminId: string;

const ENV_SAML = [
  "SAML_SP_PRIVATE_KEY",
  "SAML_SP_CERT",
  "SAML_FEDERATION_CERT_SHA256",
  "SAML_FEDERATION_METADATA_URL",
  "SAML_WAYF_URL",
  "SAML_FEDERATION",
] as const;
const sauvegarde: Record<string, string | undefined> = {};

async function poserAgregat(xml: string): Promise<void> {
  agregat = xml;
  const r = await rafraichirFederation(c);
  expect(r, JSON.stringify(r)).toMatchObject({ ok: true });
}

/* --- Le navigateur : départ, IdP, ACS -------------------------------------------- */

const enseignant = (n: string, extra: Personne = {}): Personne => ({
  pairwiseId: `${n}@univ-test.fr`,
  scopedAffiliations: ["faculty@univ-test.fr", "member@univ-test.fr"],
  schac: "univ-test.fr",
  displayName: `Prof ${n}`,
  mail: `${n}@univ-test.fr`,
  ...extra,
});
const etudiant = (n: string, extra: Personne = {}): Personne => ({
  pairwiseId: `${n}@univ-test.fr`,
  scopedAffiliations: ["student@univ-test.fr", "member@univ-test.fr"],
  schac: "univ-test.fr",
  displayName: `Étudiant ${n}`,
  mail: `${n}@etu.univ-test.fr`,
  ...extra,
});

/** Le départ par la vraie route : rend la demande reçue par l'IdP (le cookie est posé dans le bocal). */
async function depart(idp: IdpSimule, retour?: string): Promise<{ id: string; reponse: Response }> {
  const q = new URLSearchParams({ idp: idp.entityId });
  if (retour !== undefined) q.set("retour", retour);
  const reponse = await connexionGet(new Request(`${SITE}/api/saml/connexion?${q}`));
  expect(reponse.status).toBe(302);
  const loc = reponse.headers.get("location")!;
  expect(loc.startsWith(idp.sso)).toBe(true);
  const valeur = /ba_saml=([^;]+)/.exec(reponse.headers.get("set-cookie") ?? "")?.[1];
  if (valeur) bocal.set(COOKIE_REQUETE, { valeur });
  return { id: lireDemande(loc).id, reponse };
}

async function poster(base64: string): Promise<Response> {
  return acsPost(
    new Request(ACS, {
      method: "POST",
      body: new URLSearchParams({ SAMLResponse: base64 }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }),
  );
}

const destination = (r: Response) => {
  expect(r.status).toBe(303);
  const u = new URL(r.headers.get("location")!);
  return u.pathname + u.search;
};

type Variation = Partial<Omit<OptionsDeReponse, "personne">>;

/** Une connexion complète : départ, réponse de l'IdP, ACS. Rend la destination. */
async function connecter(personne: Personne, o: { idp?: IdpSimule; retour?: string; garderBocal?: boolean } & Variation = {}): Promise<string> {
  if (!o.garderBocal) bocal.clear();
  const idp = o.idp ?? univ;
  const { id } = await depart(idp, o.retour);
  const { base64 } = await reponseSaml({ idp, enReponseA: id, acs: ACS, audience: ENTITY, personne, ...o });
  return destination(await poster(base64));
}

/** Une réponse refusée : la page de refus, et le motif au journal. */
async function refusee(r: Response, motif: RegExp): Promise<void> {
  expect(r.status).toBe(303);
  expect(r.headers.get("location")).toMatch(/\/etablissement\/refus\?motif=verification$/);
  const [dernier] = await db.select().from(samlRefus).orderBy(samlRefus.createdAt).then((l) => l.slice(-1));
  expect(dernier?.motif).toMatch(motif);
  // Jamais la réponse elle-même au journal.
  expect(dernier?.motif).not.toMatch(/<|PHNhbWxw|SAMLResponse/);
  expect(bocal.has("ba_session")).toBe(false);
  expect(bocal.has("ba_guest")).toBe(false);
}

async function tenter(personne: Personne, o: { idp?: IdpSimule } & Variation = {}): Promise<Response> {
  bocal.clear();
  const idp = o.idp ?? univ;
  const { id } = await depart(univ);
  const { base64 } = await reponseSaml({ idp, enReponseA: id, acs: ACS, audience: ENTITY, personne, ...o });
  return poster(base64);
}

const sessionDuBocal = () => decodeToken(bocal.get("ba_session")?.valeur);
const inviteDuBocal = () => bocal.get("ba_guest")?.valeur.split(".")[0] ?? null;

async function attendreRedirection(f: () => Promise<unknown>): Promise<string> {
  try {
    await f();
  } catch (e) {
    const m = /__redirect__(.*)$/.exec((e as Error).message);
    if (m) return m[1]!;
    throw e;
  }
  throw new Error("aucune redirection");
}

/** Une organisation sous une offre de l'arène, paramétrée comme /admin le fait. */
async function organisationSousOffre(
  nom: string,
  offre: OffreDeLArene,
  choix: { entreprise?: string; niveau?: number } = {},
): Promise<string> {
  const [o] = await db.insert(organizations).values({ name: nom, slug: `offre-${Date.now()}-${Math.random()}` }).returning();
  const p = parametrageDeLOffre(offre, choix);
  await setOrgLicence({
    adminId,
    organizationId: o!.id,
    label: `Licence ${offre}`,
    startsAt: new Date(Date.now() - 86400_000),
    endsAt: new Date(Date.now() + 300 * 86400_000),
    maxTeachers: p.maxEnseignants,
    arene: offre,
    entreprises: p.entreprises,
    niveaux: p.niveaux,
    maxPartiesEnCours: p.maxPartiesEnCours,
  });
  return o!.id;
}

beforeAll(async () => {
  for (const k of ENV_SAML) sauvegarde[k] = process.env[k];
  serveur = createServer((req, res) => {
    if (req.url === "/federation.xml") {
      res.writeHead(200, { "content-type": "application/samlmetadata+xml" });
      res.end(agregat);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((ok) => serveur.listen(0, "127.0.0.1", ok));
  const port = (serveur.address() as AddressInfo).port;
  sim = federationSimulee(`http://127.0.0.1:${port}`);
  [univ, inconnue] = sim.idps as [IdpSimule, IdpSimule];
  horsAgregat = { ...univ, entityId: "https://idp.pirate.test/idp", paire: paireDeTest("pirate"), sso: `http://127.0.0.1:${port}/pirate` };
  sp = paireDeTest("www.business-arena.fr");
  process.env.SAML_SP_PRIVATE_KEY = sp.cle;
  process.env.SAML_SP_CERT = sp.certificat;
  process.env.SAML_FEDERATION_CERT_SHA256 = sim.empreinte;
  process.env.SAML_FEDERATION_METADATA_URL = `http://127.0.0.1:${port}/federation.xml`;
  process.env.SAML_WAYF_URL = "https://wayf.test/WAYF";
  delete process.env.SAML_FEDERATION;
  const e = lireConfiguration();
  if (!e.pret) throw new Error(e.manque.join(", "));
  c = e.configuration;
  await poserAgregat(agregatSigne(sim.federation, sim.idps));

  const [o] = await db.insert(organizations).values({ name: "Université de Test", slug: `univ-test-${Date.now()}` }).returning();
  orgId = o!.id;
  const [a] = await db.insert(users).values({ email: `admin-${Date.now()}@test`, displayName: "Admin" }).returning();
  adminId = a!.id;
  await db.insert(organizationMembers).values({ userId: adminId, organizationId: orgId, role: "org_admin" });
  await setOrgLicence({
    adminId,
    organizationId: orgId,
    label: "Licence Campus",
    startsAt: new Date(Date.now() - 86400_000),
    endsAt: new Date(Date.now() + 300 * 86400_000),
    maxTeachers: null,
    arene: "campus",
    episodes: true,
  });
  await rattacher({ idpEntityId: univ.entityId, schac: null, organizationId: orgId, nom: "Université de Test", adminId });
});

afterAll(async () => {
  for (const k of ENV_SAML) {
    if (sauvegarde[k] === undefined) delete process.env[k];
    else process.env[k] = sauvegarde[k];
  }
  await new Promise<void>((ok) => serveur.close(() => ok()));
});

beforeEach(() => bocal.clear());

/* ================================================================================= */

describe("configuration", () => {
  it("sans clé ni épingle : non configurée, routes en 503", async () => {
    expect(lireConfiguration({}).pret).toBe(false);
    const e = lireConfiguration({ SAML_SP_PRIVATE_KEY: sp.cle, SAML_SP_CERT: sp.certificat });
    expect(e.pret ? [] : e.manque).toContain("SAML_FEDERATION_CERT_SHA256");
    const autre = paireDeTest("autre");
    const melange = lireConfiguration({ SAML_SP_PRIVATE_KEY: sp.cle, SAML_SP_CERT: autre.certificat, SAML_FEDERATION_CERT_SHA256: sim.empreinte });
    expect(melange.pret).toBe(false);
    const avant = process.env.SAML_SP_PRIVATE_KEY;
    delete process.env.SAML_SP_PRIVATE_KEY;
    try {
      expect(metadataGet().status).toBe(503);
      expect((await connexionGet(new Request(`${SITE}/api/saml/connexion`))).status).toBe(503);
      expect((await poster("x")).status).toBe(503);
    } finally {
      process.env.SAML_SP_PRIVATE_KEY = avant;
    }
  });

  it("la fédération de test par défaut ; « production » choisit les adresses de production", () => {
    expect(c.federation).toBe("test");
    const p = lireConfiguration({ ...process.env, SAML_FEDERATION: "production", SAML_FEDERATION_METADATA_URL: "", SAML_WAYF_URL: "" });
    expect(p.pret && p.configuration.urlWayf).toBe("https://discovery.renater.fr/renater/WAYF");
    expect(p.pret && p.configuration.urlAgregat).toMatch(/^https:\/\/.*renater.*main-idps/);
  });
});

describe("les métadonnées du fournisseur de services", () => {
  it("entityID, ACS en HTTP-POST, certificat, attributs demandés, nom et logo FR/EN, contact technique", async () => {
    const r = metadataGet();
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/samlmetadata\+xml/);
    const xml = await r.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    expect(doc.documentElement.getAttribute("entityID")).toBe(ENTITY);
    expect(xml).toContain(`Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${ACS}"`);
    expect(xml.replace(/\s+/g, "")).toContain(sp.certificat.replace(/-----[A-Z ]+-----|\s+/g, ""));
    for (const a of ["pairwise-id", "eduPersonTargetedID", "eduPersonScopedAffiliation", "eduPersonAffiliation", "schacHomeOrganization", "displayName", "mail"]) {
      expect(xml).toContain(`FriendlyName="${a}"`);
    }
    expect(xml).toMatch(/<mdui:DisplayName xml:lang="fr">Business Arena/);
    expect(xml).toMatch(/<mdui:DisplayName xml:lang="en">Business Arena/);
    expect(xml).toMatch(/<mdui:Logo[^>]*xml:lang="fr">https:\/\/www\.business-arena\.fr\//);
    expect(xml).toMatch(/<mdui:Logo[^>]*xml:lang="en">/);
    expect(xml).toMatch(/contactType="technical">[\s\S]*mailto:contact@business-arena\.fr/);
    expect(xml).toContain(`idpdisc:DiscoveryResponse Binding="urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol" Location="${SITE}/api/saml/connexion"`);
    expect(xml).not.toContain("PRIVATE KEY");
  });
});

describe("le départ de la connexion", () => {
  it("sans établissement choisi : le service de découverte (WAYF) de la fédération, avec le retour", async () => {
    const r = await connexionGet(new Request(`${SITE}/api/saml/connexion?retour=${encodeURIComponent("/join?code=ABC123")}`));
    expect(r.status).toBe(302);
    const u = new URL(r.headers.get("location")!);
    expect(u.origin + u.pathname).toBe("https://wayf.test/WAYF");
    expect(u.searchParams.get("entityID")).toBe(ENTITY);
    expect(u.searchParams.get("returnIDParam")).toBe("idp");
    const retour = new URL(u.searchParams.get("return")!);
    expect(retour.origin + retour.pathname).toBe(`${SITE}/api/saml/connexion`);
    expect(retour.searchParams.get("retour")).toBe("/join?code=ABC123");
  });

  it("avec l'IdP : une demande SIGNÉE par la clé du SP, vers l'IdP de l'agrégat, cookie SameSite=None", async () => {
    const { reponse } = await depart(univ);
    const d = lireDemande(reponse.headers.get("location")!);
    expect(d.destination).toBe(univ.sso);
    expect(d.acs).toBe(ACS);
    expect(d.issuer).toBe(ENTITY);
    expect(d.signeePar(sp.certificat)).toBe(true);
    expect(d.signeePar(paireDeTest("autre").certificat)).toBe(false);
    const cookie = reponse.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/ba_saml=_/);
    expect(cookie).toMatch(/SameSite=none/i);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("IdP hors agrégat : refusé avant toute demande", async () => {
    const r = await connexionGet(new Request(`${SITE}/api/saml/connexion?idp=${encodeURIComponent(horsAgregat.entityId)}`));
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toMatch(/\/etablissement\/refus\?motif=inconnu$/);
    expect(r.headers.get("set-cookie") ?? "").not.toMatch(/ba_saml=_/);
  });
});

describe("l'enseignant d'un établissement rattaché", () => {
  it("compte créé à la première venue, rattaché à l'organisation, session, /teacher, licence appliquée", async () => {
    const vers = await connecter(enseignant("prof-a"));
    expect(vers).toBe("/teacher");
    const s = sessionDuBocal();
    expect(s?.role).toBe("teacher");
    const [membre] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.userId, s!.id), eq(organizationMembers.organizationId, orgId)));
    expect(membre?.role).toBe("teacher");
    expect(await unCompteSousLicence([s!.id])).toBe(true);
    const [u] = await db.select().from(users).where(eq(users.id, s!.id));
    expect(u?.displayName).toBe("Prof prof-a");
    expect(u?.email).toMatch(/@saml\.business-arena\.local$/);
    const [compte] = await db.select().from(samlComptes).where(eq(samlComptes.userId, s!.id));
    expect(compte?.courriel).toBe("prof-a@univ-test.fr");
    expect(compte?.role).toBe("enseignant");
    // L'identifiant n'est jamais gardé en clair.
    expect(compte?.identifiantHache).not.toContain("prof-a");
    const [idp] = await db.select().from(samlIdps).where(eq(samlIdps.entityId, univ.entityId));
    expect(compte?.identifiantHache).toBe(hacherIdentifiant(idp!.sel, "prof-a@univ-test.fr"));

    // Deuxième venue : le même compte.
    expect(await connecter(enseignant("prof-a"))).toBe("/teacher");
    expect(sessionDuBocal()?.id).toBe(s!.id);
  });

  it("un retour sous /teacher est suivi ; un retour ailleurs mène à /teacher", async () => {
    expect(await connecter(enseignant("prof-b"), { retour: "/teacher/cohortes" })).toBe("/teacher/cohortes");
    expect(await connecter(enseignant("prof-b"), { retour: "/join?code=ABC123" })).toBe("/teacher");
  });

  it("identifiant à défaut : eduPersonTargetedID, puis NameID persistant", async () => {
    expect(await connecter({ ...enseignant("x"), pairwiseId: undefined, targetedId: "cible-42" })).toBe("/teacher");
    const premier = sessionDuBocal()!.id;
    expect(await connecter({ ...enseignant("x"), pairwiseId: undefined, nameIdPersistant: "cible-42" })).toBe("/teacher");
    expect(sessionDuBocal()!.id).toBe(premier);
  });

  it("licence complète : refus de la première venue, aucun compte rattaché", async () => {
    const o = await organisationSousOffre("École pleine", "classe", { entreprise: "hotel", niveau: 3 });
    // L'offre Classe couvre un enseignant : la place est déjà prise.
    const [deja] = await db.insert(users).values({ email: `deja-${Date.now()}@test`, displayName: "Déjà là" }).returning();
    await db.insert(organizationMembers).values({ userId: deja!.id, organizationId: o, role: "teacher" });
    await rattacher({ idpEntityId: univ.entityId, schac: "pleine.univ-test.fr", organizationId: o, nom: "École pleine", adminId });
    // Le schac doit être dans les portées de l'IdP : on les élargit (nouvel agrégat signé).
    univ.portees = ["univ-test.fr", "pleine.univ-test.fr", "classe.univ-test.fr"];
    await poserAgregat(agregatSigne(sim.federation, sim.idps));
    const vers = await connecter(enseignant("prof-plein", { schac: "pleine.univ-test.fr" }));
    expect(vers).toBe("/etablissement/refus?motif=plafond");
    expect(bocal.has("ba_session")).toBe(false);
  });

  it("la licence de l'organisation s'applique telle quelle : Campus ouvre tout, Classe son entreprise et son niveau", async () => {
    // Campus (l'organisation de l'université) : n'importe quelle entreprise, n'importe quel niveau.
    expect(await connecter(enseignant("prof-campus"))).toBe("/teacher");
    const campus = sessionDuBocal()!.id;
    const partie = (teacherId: string, organizationId: string, scenarioCode: string, level: number) =>
      createClassGame({ teacherId, organizationId, periodicity: "quarter", humanTeamsCount: 2, botCount: 1, level, scenarioCode });
    await expect(partie(campus, orgId, "nova", 5)).resolves.toMatchObject({ gameId: expect.any(String) });
    await expect(partie(campus, orgId, "hotel", 2)).resolves.toMatchObject({ gameId: expect.any(String) });

    // Classe : un établissement (domaine) rattaché à une organisation sous offre Classe (L'ESCALE, niveau 3).
    const o = await organisationSousOffre("Classe de BTS", "classe", { entreprise: "hotel", niveau: 3 });
    await rattacher({ idpEntityId: univ.entityId, schac: "classe.univ-test.fr", organizationId: o, nom: "Classe de BTS", adminId });
    expect(await connecter(enseignant("prof-classe", { schac: "classe.univ-test.fr" }))).toBe("/teacher");
    const classe = sessionDuBocal()!.id;
    const [m] = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, classe));
    expect(m?.organizationId).toBe(o);
    await expect(partie(classe, o, "hotel", 3)).resolves.toMatchObject({ gameId: expect.any(String) });
    await expect(partie(classe, o, "nova", 3)).rejects.toThrow(/NOVA n'en fait pas partie/);
  });
});

describe("l'étudiant", () => {
  it("identité persistante, retrouvée sur un deuxième appareil ; ni nom ni courriel gardés", async () => {
    const vers = await connecter(etudiant("lea"));
    expect(vers).toBe("/etablissement/parties");
    const id = inviteDuBocal();
    expect(id).toBeTruthy();
    expect(bocal.has("ba_session")).toBe(false);
    const [u] = await db.select().from(users).where(eq(users.id, id!));
    expect(u?.displayName).toBe("Joueur invité");
    expect(JSON.stringify(u)).not.toMatch(/lea@|Étudiant lea/);
    const [compte] = await db.select().from(samlComptes).where(eq(samlComptes.userId, id!));
    expect(compte?.role).toBe("etudiant");
    expect(compte?.courriel).toBeNull();
    expect(JSON.stringify(compte)).not.toContain("lea@");

    // Deuxième appareil : bocal vide, même identité.
    expect(await connecter(etudiant("lea"))).toBe("/etablissement/parties");
    expect(inviteDuBocal()).toBe(id);
  });

  it("la session enseignant ouverte sur le poste est fermée", async () => {
    await connecter(enseignant("prof-poste"));
    expect(bocal.has("ba_session")).toBe(true);
    await connecter(etudiant("max-poste"), { garderBocal: true });
    expect(bocal.has("ba_session")).toBe(false);
  });

  it("arrive avec un code de partie, rejoint, et retrouve la partie sur un autre appareil", async () => {
    const [ens] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.role, "teacher")));
    const { gameId } = await createClassGame({ teacherId: ens!.userId, organizationId: orgId, periodicity: "quarter", humanTeamsCount: 2, botCount: 1, level: 2 });
    const { games } = await import("@/db/schema");
    const [g] = await db.select({ code: games.joinCode }).from(games).where(eq(games.id, gameId));
    const code = g!.code!;

    const vers = await connecter(etudiant("sami"), { retour: `/join?code=${code}` });
    expect(vers).toBe(`/join?code=${code}`);
    const id = inviteDuBocal()!;
    const fd = new FormData();
    fd.set("code", code);
    fd.set("pseudo", "Sami");
    expect(await attendreRedirection(() => joinGameAction({ error: null }, fd))).toBe(`/arena/${gameId}`);
    const [p] = await db.select().from(players).innerJoin(teams, eq(teams.id, players.teamId)).where(eq(players.userId, id));
    expect(p?.teams.gameId).toBe(gameId);

    // Autre appareil : la liste « Vos parties et cohortes » la montre.
    expect(await connecter(etudiant("sami"))).toBe("/etablissement/parties");
    expect(inviteDuBocal()).toBe(id);
    expect((await partiesRejointes(id)).map((x) => x.gameId)).toContain(gameId);

    // Le champ code de la page : partie → /join, cohorte → invitation, inconnu → message.
    const champ = (v: string) => {
      const f = new FormData();
      f.set("code", v);
      return f;
    };
    expect(await attendreRedirection(() => rejoindreParCodeAction(champ(code.toLowerCase())))).toBe(`/join?code=${code}`);
    const cohorte = await creerCohorteDeLEnseignant({
      enseignantId: ens!.userId,
      nom: "Master 1",
      episodes: [EPISODES[0]!.code],
    });
    const codeCohorte = cohorte.code;
    expect(await attendreRedirection(() => rejoindreParCodeAction(champ(codeCohorte)))).toBe(
      `/entreprises/episode/rejoindre?code=${encodeURIComponent(codeCohorte)}`,
    );
    expect(await attendreRedirection(() => rejoindreParCodeAction(champ("ZZZZZZ")))).toBe("/etablissement/parties?code=inconnu#code");
  });

  it("un retour hors du site est ignoré (chemins internes seulement)", async () => {
    for (const r of ["https://pirate.test/", "//pirate.test/x", "/\\pirate.test", "/api/saml/acs", "javascript:alert(1)", " /ok\n"]) {
      expect(retourInterne(r), r).toBeNull();
    }
    expect(retourInterne("/join?code=ABC123")).toBe("/join?code=ABC123");
    expect(await connecter(etudiant("nora"), { retour: "https://pirate.test/" })).toBe("/etablissement/parties");
  });
});

describe("l'établissement de la fédération qui n'est rattaché à rien", () => {
  it("l'enseignant lit qu'il n'y a pas d'offre, sans compte créé ; l'étudiant joue comme invité", async () => {
    const avant = (await db.select().from(users)).length;
    const p = { ...enseignant("prof-inconnu"), pairwiseId: "prof-inconnu@ecole-inconnue.fr", schac: "ecole-inconnue.fr", scopedAffiliations: ["faculty@ecole-inconnue.fr"] };
    expect(await connecter(p, { idp: inconnue })).toBe("/etablissement/sans-offre");
    expect((await db.select().from(users)).length).toBe(avant);
    expect(bocal.has("ba_session")).toBe(false);
    const e = { ...etudiant("etu-inconnu"), pairwiseId: "etu-inconnu@ecole-inconnue.fr", scopedAffiliations: ["student@ecole-inconnue.fr"] };
    expect(await connecter(e, { idp: inconnue })).toBe("/etablissement/parties?offre=aucune");
    expect(inviteDuBocal()).toBeTruthy();
  });
});

describe("les attributs", () => {
  it("rôle : faculty, teacher, researcher, staff ; employee sans student ; tout le reste étudiant", () => {
    expect(roleSelonAffiliations(["faculty"])).toBe("enseignant");
    expect(roleSelonAffiliations(["teacher", "member"])).toBe("enseignant");
    expect(roleSelonAffiliations(["staff"])).toBe("enseignant");
    expect(roleSelonAffiliations(["employee"])).toBe("enseignant");
    expect(roleSelonAffiliations(["employee", "student"])).toBe("etudiant");
    expect(roleSelonAffiliations(["member", "affiliate"])).toBe("etudiant");
    expect(roleSelonAffiliations([])).toBe("etudiant");
  });

  it("une portée étrangère est ignorée : affiliation, établissement et pairwise-id", () => {
    const r = attributsRetenus(
      {
        attributes: {
          "urn:oasis:names:tc:SAML:attribute:pairwise-id": "abc@autre-univ.fr",
          "urn:oid:1.3.6.1.4.1.5923.1.1.1.9": ["faculty@autre-univ.fr", "student@univ-test.fr"],
          "urn:oid:1.3.6.1.4.1.25178.1.2.9": "autre-univ.fr",
          "urn:oid:2.16.840.1.113730.3.1.241": "Nom",
          "urn:oid:0.9.2342.19200300.100.1.3": "nom@autre-univ.fr",
        },
      },
      ["univ-test.fr"],
    );
    expect(r).toMatchObject({ identifiant: null, role: "etudiant", etablissement: null, nom: null, courriel: null });
  });

  it("rattachement : IdP et domaine, puis IdP seul, puis domaine seul", async () => {
    const [o2] = await db.insert(organizations).values({ name: "Mutualisé", slug: `mut-${Date.now()}` }).returning();
    await rattacher({ idpEntityId: null, schac: "seul.test", organizationId: o2!.id, nom: "Domaine seul", adminId });
    expect((await rattachementDe(univ.entityId, null))?.organizationId).toBe(orgId);
    expect((await rattachementDe("https://autre.test/idp", "seul.test"))?.organizationId).toBe(o2!.id);
    expect(await rattachementDe("https://autre.test/idp", "rien.test")).toBeNull();
    await expect(rattacher({ idpEntityId: null, schac: null, organizationId: o2!.id, nom: "", adminId })).rejects.toThrow();
    await expect(rattacher({ idpEntityId: null, schac: "seul.test", organizationId: o2!.id, nom: "", adminId })).rejects.toThrow(/déjà/);
  });
});

describe("la sécurité de la réponse : chaque refus", () => {
  it("assertion chiffrée pour le SP, signée : acceptée", async () => {
    expect(await connecter(etudiant("chiffre"), { chiffrerPour: sp.certificat })).toBe("/etablissement/parties");
  });

  it("signature de la réponse seule : acceptée ; de l'assertion seule : acceptée ; des deux : acceptée", async () => {
    expect(await connecter(etudiant("s1"), { signature: "reponse" })).toBe("/etablissement/parties");
    expect(await connecter(etudiant("s2"), { signature: "assertion" })).toBe("/etablissement/parties");
    expect(await connecter(etudiant("s3"), { signature: "les-deux", chiffrerPour: sp.certificat })).toBe("/etablissement/parties");
  });

  it("aucune signature : refusée", async () => {
    await refusee(await tenter(etudiant("n"), { signature: "aucune" }), /vérification SAML : Invalid signature/);
  });

  it("signée par une clé qui n'est pas celle de l'IdP dans l'agrégat : refusée", async () => {
    await refusee(await tenter(etudiant("n"), { signataire: horsAgregat.paire }), /Invalid signature/);
    await refusee(await tenter(etudiant("n"), { signataire: inconnue.paire, signature: "reponse" }), /Invalid (document )?signature/);
  });

  it("assertion modifiée après signature : refusée", async () => {
    await refusee(
      await tenter(etudiant("n"), { alterer: (xml) => xml.replace("student@univ-test.fr", "faculty@univ-test.fr") }),
      /Invalid signature/,
    );
  });

  it("Audience d'un autre service : refusée", async () => {
    await refusee(await tenter(etudiant("n"), { audience: "https://autre-sp.test/shibboleth" }), /audience/i);
  });

  it("Destination ou Recipient différents de l'ACS : refusée", async () => {
    await refusee(await tenter(etudiant("n"), { destination: "https://autre-sp.test/acs", signature: "les-deux" }), /Destination/);
    await refusee(await tenter(etudiant("n"), { recipient: "https://autre-sp.test/acs" }), /Recipient/);
  });

  it("NotBefore/NotOnOrAfter : ±60 s tolérées, au-delà refusée", async () => {
    const dans = (s: number) => new Date(Date.now() + s * 1000);
    expect(await connecter(etudiant("h1"), { notBefore: dans(30) })).toBe("/etablissement/parties");
    await refusee(await tenter(etudiant("h2"), { notBefore: dans(120) }), /not yet valid/);
    expect(await connecter(etudiant("h3"), { notOnOrAfter: dans(-30) })).toBe("/etablissement/parties");
    await refusee(await tenter(etudiant("h4"), { notOnOrAfter: dans(-120) }), /expired|subject confirmation/i);
  });

  it("InResponseTo : absent, inconnu, d'une autre demande que celle du navigateur, ou déjà utilisé : refusée", async () => {
    // Non sollicitée.
    bocal.clear();
    await depart(univ);
    let r = await reponseSaml({ idp: univ, enReponseA: null, acs: ACS, audience: ENTITY, personne: etudiant("n") });
    await refusee(await poster(r.base64), /non sollicitée/);
    // Inconnu (le cookie le porte aussi : c'est la base qui ne le connaît pas).
    bocal.clear();
    bocal.set(COOKIE_REQUETE, { valeur: "_inconnu" });
    r = await reponseSaml({ idp: univ, enReponseA: "_inconnu", acs: ACS, audience: ENTITY, personne: etudiant("n") });
    await refusee(await poster(r.base64), /InResponseTo inconnu/);
    // La réponse d'une demande faite dans un AUTRE navigateur (le cookie ne correspond pas).
    bocal.clear();
    const { id: autre } = await depart(univ);
    bocal.clear();
    await depart(univ);
    r = await reponseSaml({ idp: univ, enReponseA: autre, acs: ACS, audience: ENTITY, personne: etudiant("n") });
    await refusee(await poster(r.base64), /navigateur/);
    // Usage unique : la même réponse postée deux fois.
    bocal.clear();
    const { id } = await depart(univ);
    r = await reponseSaml({ idp: univ, enReponseA: id, acs: ACS, audience: ENTITY, personne: etudiant("deux-fois") });
    expect(destination(await poster(r.base64))).toBe("/etablissement/parties");
    bocal.clear();
    bocal.set(COOKIE_REQUETE, { valeur: id });
    await refusee(await poster(r.base64), /déjà utilisé/);
  });

  it("assertion rejouée sous une nouvelle demande : refusée (ID d'assertion gardé)", async () => {
    const assertionId = idSaml();
    expect(await connecter(etudiant("rejeu"), { assertionId })).toBe("/etablissement/parties");
    await refusee(await tenter(etudiant("rejeu"), { assertionId }), /assertion rejouée/);
  });

  it("réponse d'un autre IdP que celui sollicité, même de l'agrégat : refusée", async () => {
    await refusee(await tenter(etudiant("n"), { idp: inconnue }), /émetteur de la réponse différent/);
    // Émetteur de la réponse retiré, assertion d'un autre IdP signée par lui : refusée aussi.
    bocal.clear();
    const { id } = await depart(univ);
    const { xml } = await reponseSaml({ idp: inconnue, enReponseA: id, acs: ACS, audience: ENTITY, personne: etudiant("n") });
    const sansEmetteur = xml.replace(/^(<samlp:Response[^>]*>)<saml:Issuer>[^<]*<\/saml:Issuer>/, "$1");
    await refusee(await poster(Buffer.from(sansEmetteur).toString("base64")), /Invalid signature|émetteur/);
  });

  it("aucun identifiant pseudonyme transmis : refusée", async () => {
    await refusee(await tenter({ ...etudiant("n"), pairwiseId: undefined }), /aucun identifiant pseudonyme/);
  });

  it("XML malformé, DTD et entité externe (XXE) : refusés avant toute analyse", async () => {
    bocal.clear();
    const { id } = await depart(univ);
    await refusee(await poster(Buffer.from("<samlp:Response><pas fermé").toString("base64")), /malformé|DTD/);
    bocal.set(COOKIE_REQUETE, { valeur: id });
    const xxe = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_x" InResponseTo="${id}"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">&xxe;</saml:Issuer></samlp:Response>`;
    await refusee(await poster(Buffer.from(xxe).toString("base64")), /DTD/);
    const rires = `<!DOCTYPE l [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">&b;</samlp:Response>`;
    await refusee(await poster(Buffer.from(rires).toString("base64")), /DTD/);
  });

  it("la bibliothèque elle-même n'étend aucune entité externe, même sans notre garde", async () => {
    // L'analyseur de @node-saml/node-saml et de xml-crypto (@xmldom/xmldom) : l'entité
    // externe n'est jamais résolue (aucun accès au fichier).
    const xxe = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><r>&xxe;</r>`;
    const erreurs: string[] = [];
    const doc = new DOMParser({ errorHandler: { error: (m: string) => erreurs.push(m), fatalError: (m: string) => erreurs.push(m) } }).parseFromString(xxe, "text/xml");
    const { readFileSync } = await import("node:fs");
    const hote = readFileSync("/etc/hostname", "utf8").trim();
    expect(doc.documentElement?.textContent ?? "").not.toContain(hote);
    // Et la vérification complète de node-saml refuse la réponse (non signée, entité non résolue).
    const saml = new SAML(reglagesSaml(c, { ssoRedirect: univ.sso, certificats: [univ.paire.certificat] }));
    const reponse = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_x" Version="2.0" InResponseTo="_y"><saml:Issuer>&xxe;</saml:Issuer></samlp:Response>`;
    const err = await saml.validatePostResponseAsync({ SAMLResponse: Buffer.from(reponse).toString("base64") }).then(
      () => null,
      (e: Error) => e,
    );
    expect(err).toBeInstanceOf(Error);
    expect(String(err?.message)).not.toContain(hote);
  });
});

describe("l'agrégat de la fédération", () => {
  const conf = () => ({ certificatFederation: null, empreinteFederation: sim.empreinte, httpLocal: true });

  it("signé par la fédération : lu, avec ses IdP, portées et certificats", () => {
    const lu = lireAgregat(agregatSigne(sim.federation, sim.idps), conf());
    expect(lu.idps.map((i) => i.entityId)).toEqual(sim.idps.map((i) => i.entityId));
    expect(lu.idps[0]!.portees).toContain("univ-test.fr");
    expect(lu.idps[0]!.nomFr).toBe("Université de Test");
    expect(lu.idps[0]!.certificats).toHaveLength(1);
    expect(lu.idps[0]!.ssoRedirect).toBe(univ.sso);
  });

  it("non signé, signé par une autre clé, falsifié après signature, ou expiré : refusé", () => {
    expect(() => lireAgregat(xmlDeLAgregat(sim.idps, new Date(Date.now() + 86400_000)), conf())).toThrow(/non signé/);
    expect(() => lireAgregat(agregatSigne(paireDeTest("faussaire"), sim.idps), conf())).toThrow(/épinglé/);
    // Le faussaire glisse le certificat attendu dans KeyInfo : la signature ne se vérifie pas.
    const faux = agregatSigne(paireDeTest("faussaire"), sim.idps).replace(
      /<((?:ds:)?X509Certificate)>[^<]+<\/(?:ds:)?X509Certificate>(?=[\s\S]*<md:EntityDescriptor)/,
      (_m, balise: string) =>
        `<${balise}>${sim.federation.certificat.replace(/-----[A-Z ]+-----|\s+/g, "")}</${balise}>`,
    );
    expect(() => lireAgregat(faux, conf())).toThrow(/signature invalide/);
    const signe = agregatSigne(sim.federation, sim.idps);
    const falsifie = signe.replace(univ.sso, "https://pirate.test/sso");
    expect(() => lireAgregat(falsifie, conf())).toThrow(/signature invalide/);
    expect(() => lireAgregat(agregatSigne(sim.federation, sim.idps, new Date(Date.now() - 1000)), conf())).toThrow(/expiré/);
    expect(() => lireAgregat("<?xml version='1.0'?><!DOCTYPE x><x/>", conf())).toThrow(/DTD/);
  });

  it("une entité ajoutée hors de la partie signée n'est jamais lue", () => {
    const signe = agregatSigne(sim.federation, [univ]);
    // Un attaquant enveloppe : l'IdP pirate dans un commentaire n'est rien, dans le document il casse la signature.
    const ajoute = signe.replace("</md:EntitiesDescriptor>", `${xmlDeLAgregat([horsAgregat], new Date(Date.now() + 86400_000)).replace(/^<\?xml[^>]*>\s*/, "").replace(/<md:EntitiesDescriptor[^>]*>|<\/md:EntitiesDescriptor>/g, "")}</md:EntitiesDescriptor>`);
    expect(() => lireAgregat(ajoute, conf())).toThrow(/signature invalide/);
  });

  it("un IdP retiré de l'agrégat n'est plus accepté ; sa ligne et son sel restent", async () => {
    const [avant] = await db.select().from(samlIdps).where(eq(samlIdps.entityId, inconnue.entityId));
    await poserAgregat(agregatSigne(sim.federation, [univ]));
    const r = await connexionGet(new Request(`${SITE}/api/saml/connexion?idp=${encodeURIComponent(inconnue.entityId)}`));
    expect(r.headers.get("location")).toMatch(/motif=inconnu/);
    await poserAgregat(agregatSigne(sim.federation, sim.idps));
    const [apres] = await db.select().from(samlIdps).where(eq(samlIdps.entityId, inconnue.entityId));
    expect(apres?.present).toBe(true);
    expect(apres?.sel).toBe(avant?.sel);
  });

  it("une relecture qui échoue garde l'agrégat précédent", async () => {
    agregat = "pas du xml";
    const r = await rafraichirFederation(c);
    expect(r.ok).toBe(false);
    expect(await connecter(etudiant("apres-echec"))).toBe("/etablissement/parties");
    await poserAgregat(agregatSigne(sim.federation, sim.idps));
  });

  it("le signataire peut aussi être donné en entier (SAML_FEDERATION_CERT)", () => {
    const lu = lireAgregat(agregatSigne(sim.federation, sim.idps), { certificatFederation: sim.federation.certificat, empreinteFederation: sim.empreinte, httpLocal: true });
    expect(lu.idps).toHaveLength(2);
    const s = signer("<a ID=\"_1\"><b/></a>", sim.federation, "/*", "/*", "prepend");
    expect(() => lireAgregat(s, conf())).toThrow(/EntitiesDescriptor/);
  });
});
