import { createHash, randomBytes } from "node:crypto";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { SignedXml } from "xml-crypto";
import { db } from "@/db";
import { samlFederations, samlIdps } from "@/db/schema";
import { empreinteSha256, enPem, memeEmpreinte } from "./certificat";
import type { ConfigurationSaml } from "./configuration";
import { AGE_MAX_AGREGAT_MS, BINDING, NS, PAUSE_APRES_ECHEC_MS, type Federation } from "./constantes";
import { analyser, elements, premier, racine, texte, XmlRefuse } from "./xml";

/**
 * LES FOURNISSEURS D'IDENTITÉS DE LA FÉDÉRATION, LUS DANS L'AGRÉGAT SIGNÉ DE RENATER.
 *
 * C'est le socle de la confiance : seul un IdP décrit dans l'agrégat est accepté, et ses
 * réponses ne sont vérifiées qu'avec les certificats que l'agrégat publie pour lui.
 * L'agrégat lui-même n'est cru que si sa signature est vérifiée (xml-crypto) avec le
 * certificat de RENATER ÉPINGLÉ dans la configuration (son empreinte SHA-256, ou le
 * certificat entier). Puis seuls les octets SIGNÉS sont relus : rien de ce qui entoure
 * la signature n'est pris en compte. Un agrégat dont le `validUntil` est passé est
 * refusé (un vieil agrégat rejoué ne doit pas ressusciter un IdP retiré).
 *
 * Le résultat est gardé en base (`saml_idps`, `saml_federations`) et relu toutes les
 * six heures au plus tôt, à la première connexion qui en a besoin ou depuis
 * /admin/renater. Une relecture qui échoue n'efface rien : l'agrégat précédent reste en
 * usage jusqu'à son `validUntil`.
 */

export class AgregatRefuse extends Error {
  constructor(motif: string) {
    super(motif);
    this.name = "AgregatRefuse";
  }
}

/** Un IdP tel que l'agrégat le décrit. */
export interface IdpDecrit {
  entityId: string;
  nomFr: string | null;
  nomEn: string | null;
  ssoRedirect: string;
  certificats: string[];
  portees: string[];
}

/** Un IdP de la fédération en service, avec le sel de ses identifiants. */
export interface IdpDeLaFederation extends IdpDecrit {
  federation: Federation;
  sel: string;
}

const TAILLE_MAX_AGREGAT = 80 * 1024 * 1024;
const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** Les algorithmes de signature admis pour l'agrégat (RENATER signe en RSA-SHA256). */
const SIGNATURES_ADMISES = new Set([
  "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
  "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512",
]);

/** HTTPS seulement ; le HTTP vers la machine locale pour le simulateur des tests. */
export function adresseAdmise(brute: string, httpLocal: boolean, env: NodeJS.ProcessEnv = process.env): URL | null {
  let url: URL;
  try {
    url = new URL(brute);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === "https:") return url;
  const localPermis = env.NODE_ENV !== "production" || httpLocal;
  if (url.protocol === "http:" && localPermis && HOTES_LOCAUX.has(url.hostname)) return url;
  return null;
}

/* --- 1. Vérifier la signature et ne garder que les octets signés ------------------ */

function certificatDeLaSignature(signature: Element, configuration: Pick<ConfigurationSaml, "certificatFederation" | "empreinteFederation">): string {
  if (configuration.certificatFederation) return configuration.certificatFederation;
  // Sans le certificat entier : celui de la signature, s'il est bien celui qu'on a épinglé.
  const brut = texte(premier(signature, "./ds:KeyInfo/ds:X509Data/ds:X509Certificate"));
  const pem = brut ? enPem(brut) : null;
  if (!pem) throw new AgregatRefuse("signature sans certificat, et aucun certificat de la fédération configuré");
  if (!memeEmpreinte(empreinteSha256(pem), configuration.empreinteFederation)) {
    throw new AgregatRefuse("certificat de signature de l'agrégat différent de celui épinglé");
  }
  return pem;
}

/** Vérifie la signature de l'agrégat ; rend le XML SIGNÉ (canonique), le seul qu'on relira. */
export function xmlSigneDeLAgregat(
  xml: string,
  configuration: Pick<ConfigurationSaml, "certificatFederation" | "empreinteFederation">,
): string {
  const doc = analyser(xml, TAILLE_MAX_AGREGAT);
  const r = racine(doc, NS.md, "EntitiesDescriptor");
  const signatures = elements(r, "./ds:Signature");
  if (signatures.length !== 1) throw new AgregatRefuse(signatures.length ? "plusieurs signatures" : "agrégat non signé");
  const signature = signatures[0]!;
  const algorithme = premier(signature, "./ds:SignedInfo/ds:SignatureMethod")?.getAttribute("Algorithm") ?? "";
  if (!SIGNATURES_ADMISES.has(algorithme)) throw new AgregatRefuse(`algorithme de signature refusé : ${algorithme}`);

  const sig = new SignedXml({ publicCert: certificatDeLaSignature(signature, configuration), getCertFromKeyInfo: () => null });
  sig.loadSignature(signature);
  const references = sig.getReferences();
  if (references.length !== 1) throw new AgregatRefuse("la signature doit porter une seule référence");
  const uri = references[0]!.uri ?? "";
  const id = r.getAttribute("ID") ?? "";
  if (!(uri === "" || (id && uri === `#${id}`))) throw new AgregatRefuse("la signature ne porte pas sur l'agrégat entier");
  if (id && elements(doc, `//*[@ID="${id.replace(/"/g, "")}"]`).length !== 1) {
    throw new AgregatRefuse("identifiant de l'agrégat ambigu");
  }
  let valide = false;
  try {
    valide = sig.checkSignature(xml);
  } catch (e) {
    throw new AgregatRefuse(`signature invalide (${e instanceof Error ? e.message.slice(0, 80) : "?"})`);
  }
  if (!valide) throw new AgregatRefuse("signature invalide");
  const signes = sig.getSignedReferences();
  if (signes.length !== 1) throw new AgregatRefuse("contenu signé introuvable");
  return signes[0]!;
}

/* --- 2. Lire les IdP dans le XML signé -------------------------------------------- */

const LANGUE_XML = "http://www.w3.org/XML/1998/namespace";
const langue = (e: Element) => e.getAttributeNS(LANGUE_XML, "lang") || e.getAttribute("xml:lang") || "";

function nomDans(entite: Element, idp: Element, lang: "fr" | "en"): string | null {
  const ui = elements(idp, "./md:Extensions/mdui:UIInfo/mdui:DisplayName");
  const org = elements(entite, "./md:Organization/md:OrganizationDisplayName");
  const choisir = (liste: Element[]) => texte(liste.find((e) => langue(e).toLowerCase().startsWith(lang))) || null;
  return choisir(ui) ?? choisir(org) ?? (texte(ui[0]) || texte(org[0]) || null);
}

export interface AgregatLu {
  idps: IdpDecrit[];
  valideJusquA: Date | null;
}

export function idpsDuXmlSigne(xmlSigne: string, httpLocal: boolean, now: Date = new Date()): AgregatLu {
  const doc = analyser(xmlSigne, TAILLE_MAX_AGREGAT);
  const r = racine(doc, NS.md, "EntitiesDescriptor");
  const validUntil = r.getAttribute("validUntil");
  const valideJusquA = validUntil ? new Date(validUntil) : null;
  if (valideJusquA && (Number.isNaN(valideJusquA.getTime()) || valideJusquA <= now)) {
    throw new AgregatRefuse("agrégat expiré (validUntil passé)");
  }
  const idps: IdpDecrit[] = [];
  for (const entite of elements(r, ".//md:EntityDescriptor")) {
    const entityId = entite.getAttribute("entityID")?.trim();
    if (!entityId) continue;
    const idp = elements(entite, "./md:IDPSSODescriptor").find((d) =>
      (d.getAttribute("protocolSupportEnumeration") ?? "").split(/\s+/).includes(NS.samlp),
    );
    if (!idp) continue;
    const sso = elements(idp, "./md:SingleSignOnService").find((s) => s.getAttribute("Binding") === BINDING.redirect);
    const adresse = sso?.getAttribute("Location") ?? "";
    if (!adresse || !adresseAdmise(adresse, httpLocal)) continue;
    const certificats = [
      ...new Set(
        elements(idp, "./md:KeyDescriptor")
          .filter((k) => !k.getAttribute("use") || k.getAttribute("use") === "signing")
          .flatMap((k) => elements(k, "./ds:KeyInfo/ds:X509Data/ds:X509Certificate"))
          .map((c) => enPem(texte(c)))
          .filter((p): p is string => !!p),
      ),
    ];
    if (certificats.length === 0) continue;
    const portees = [
      ...new Set(
        elements(idp, "./md:Extensions/shibmd:Scope")
          .filter((s) => s.getAttribute("regexp") !== "true")
          .map((s) => texte(s).toLowerCase())
          .filter(Boolean),
      ),
    ];
    idps.push({
      entityId,
      nomFr: nomDans(entite, idp, "fr"),
      nomEn: nomDans(entite, idp, "en"),
      ssoRedirect: adresse,
      certificats,
      portees,
    });
  }
  return { idps, valideJusquA };
}

/** Vérifier puis lire un agrégat (le texte téléchargé). */
export function lireAgregat(
  xml: string,
  configuration: Pick<ConfigurationSaml, "certificatFederation" | "empreinteFederation" | "httpLocal">,
  now: Date = new Date(),
): AgregatLu {
  try {
    return idpsDuXmlSigne(xmlSigneDeLAgregat(xml, configuration), configuration.httpLocal, now);
  } catch (e) {
    if (e instanceof XmlRefuse) throw new AgregatRefuse(e.message);
    throw e;
  }
}

/* --- 3. Télécharger, garder en base ------------------------------------------------ */

async function telecharger(url: string, httpLocal: boolean): Promise<string> {
  const admise = adresseAdmise(url, httpLocal);
  if (!admise) throw new AgregatRefuse("adresse de l'agrégat refusée (HTTPS exigé)");
  const reponse = await fetch(admise, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
  if (!reponse.ok) throw new AgregatRefuse(`agrégat indisponible (HTTP ${reponse.status})`);
  const annonce = Number(reponse.headers.get("content-length") ?? "0");
  if (annonce > TAILLE_MAX_AGREGAT) throw new AgregatRefuse("agrégat trop long");
  const corps = await reponse.text();
  if (corps.length > TAILLE_MAX_AGREGAT) throw new AgregatRefuse("agrégat trop long");
  return corps;
}

export async function enregistrerAgregat(
  federation: Federation,
  url: string,
  lu: AgregatLu,
  empreinte: string,
  now: Date = new Date(),
): Promise<void> {
  for (let i = 0; i < lu.idps.length; i += 200) {
    const lot = lu.idps.slice(i, i + 200);
    await db
      .insert(samlIdps)
      .values(
        lot.map((p) => ({
          ...p,
          federation,
          present: true,
          sel: randomBytes(32).toString("base64url"),
          vuLe: now,
        })),
      )
      .onConflictDoUpdate({
        target: samlIdps.entityId,
        // Le sel n'est jamais remplacé : il garde les comptes de l'IdP.
        set: {
          federation: sql`excluded.federation`,
          nomFr: sql`excluded.nom_fr`,
          nomEn: sql`excluded.nom_en`,
          ssoRedirect: sql`excluded.sso_redirect`,
          certificats: sql`excluded.certificats`,
          portees: sql`excluded.portees`,
          present: true,
          vuLe: now,
        },
      });
  }
  const vus = lu.idps.map((p) => p.entityId);
  await db
    .update(samlIdps)
    .set({ present: false })
    .where(
      vus.length
        ? and(eq(samlIdps.federation, federation), notInArray(samlIdps.entityId, vus))
        : eq(samlIdps.federation, federation),
    );
  const ligne = {
    url,
    luLe: now,
    valideJusquA: lu.valideJusquA,
    nombre: lu.idps.length,
    empreinte,
    derniereTentative: now,
    derniereErreur: null,
  };
  await db
    .insert(samlFederations)
    .values({ federation, ...ligne })
    .onConflictDoUpdate({ target: samlFederations.federation, set: ligne });
}

async function noterEchec(federation: Federation, url: string, motif: string, now: Date): Promise<void> {
  const ligne = { url, derniereTentative: now, derniereErreur: motif.slice(0, 300) };
  await db
    .insert(samlFederations)
    .values({ federation, ...ligne })
    .onConflictDoUpdate({ target: samlFederations.federation, set: ligne });
}

export type ResultatDeLecture = { ok: true; nombre: number } | { ok: false; motif: string };

/** Télécharge, vérifie et enregistre l'agrégat de la fédération configurée. */
export async function rafraichirFederation(
  configuration: ConfigurationSaml,
  now: Date = new Date(),
): Promise<ResultatDeLecture> {
  const { federation, urlAgregat } = configuration;
  try {
    const xml = await telecharger(urlAgregat, configuration.httpLocal);
    const lu = lireAgregat(xml, configuration, now);
    const empreinte = createHash("sha256").update(xml).digest("hex");
    await enregistrerAgregat(federation, urlAgregat, lu, empreinte, now);
    return { ok: true, nombre: lu.idps.length };
  } catch (e) {
    const motif =
      e instanceof AgregatRefuse ? e.message : `lecture impossible (${e instanceof Error ? e.message.slice(0, 120) : "?"})`;
    console.warn(`[saml] agrégat ${federation} : ${motif}`);
    await noterEchec(federation, urlAgregat, motif, now);
    return { ok: false, motif };
  }
}

export async function etatDeLaFederation(federation: Federation) {
  return (await db.select().from(samlFederations).where(eq(samlFederations.federation, federation)))[0] ?? null;
}

/** Relit l'agrégat s'il est trop vieux (et qu'aucune tentative n'a échoué à l'instant). */
export async function agregatAJour(configuration: ConfigurationSaml, now: Date = new Date()): Promise<void> {
  const etat = await etatDeLaFederation(configuration.federation);
  const ageLu = etat?.luLe ? now.getTime() - etat.luLe.getTime() : Infinity;
  const ageTentative = etat?.derniereTentative ? now.getTime() - etat.derniereTentative.getTime() : Infinity;
  const urlChangee = etat !== null && etat.url !== configuration.urlAgregat;
  if ((ageLu > AGE_MAX_AGREGAT_MS || urlChangee) && ageTentative > PAUSE_APRES_ECHEC_MS) {
    await rafraichirFederation(configuration, now);
  }
}

/** L'agrégat en base est-il encore utilisable (lu, de la bonne adresse, pas expiré) ? */
async function agregatUtilisable(configuration: ConfigurationSaml, now: Date): Promise<boolean> {
  const etat = await etatDeLaFederation(configuration.federation);
  if (!etat?.luLe) return false;
  if (etat.url !== configuration.urlAgregat) return false;
  return !etat.valideJusquA || etat.valideJusquA > now;
}

/** L'IdP de la fédération qui porte cet entityID, ou null (hors agrégat, retiré, agrégat expiré). */
export async function idpDeLaFederation(
  configuration: ConfigurationSaml,
  entityId: string,
  now: Date = new Date(),
): Promise<IdpDeLaFederation | null> {
  await agregatAJour(configuration, now);
  if (!(await agregatUtilisable(configuration, now))) return null;
  const [l] = await db
    .select()
    .from(samlIdps)
    .where(
      and(
        eq(samlIdps.entityId, entityId),
        eq(samlIdps.federation, configuration.federation),
        eq(samlIdps.present, true),
      ),
    );
  if (!l) return null;
  return {
    entityId: l.entityId,
    federation: l.federation as Federation,
    nomFr: l.nomFr,
    nomEn: l.nomEn,
    ssoRedirect: l.ssoRedirect,
    certificats: l.certificats,
    portees: l.portees,
    sel: l.sel,
  };
}

/** Les IdP connus de la fédération configurée (pour /admin/renater), filtrés par une recherche. */
export async function listerIdps(
  federation: Federation,
  recherche = "",
): Promise<{ entityId: string; nom: string; portees: string[]; present: boolean }[]> {
  const lignes = await db
    .select({
      entityId: samlIdps.entityId,
      nomFr: samlIdps.nomFr,
      nomEn: samlIdps.nomEn,
      portees: samlIdps.portees,
      present: samlIdps.present,
    })
    .from(samlIdps)
    .where(eq(samlIdps.federation, federation));
  const r = recherche.trim().toLowerCase();
  return lignes
    .map((l) => ({ entityId: l.entityId, nom: l.nomFr ?? l.nomEn ?? l.entityId, portees: l.portees, present: l.present }))
    .filter((l) => !r || `${l.nom} ${l.entityId} ${l.portees.join(" ")}`.toLowerCase().includes(r))
    .sort((a, b) => Number(b.present) - Number(a.present) || a.nom.localeCompare(b.nom, "fr"));
}
