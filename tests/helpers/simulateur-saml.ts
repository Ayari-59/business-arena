import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, verify, X509Certificate, type KeyObject } from "node:crypto";
import { createServer, type Server } from "node:http";
import { inflateRawSync } from "node:zlib";
import { SignedXml } from "xml-crypto";
import { encrypt } from "xml-encryption";
import { certificatAutoSigne, corpsDuCertificat, empreinteSha256 } from "../../src/saml/certificat";
import { ATTRIBUT } from "../../src/saml/constantes";

/**
 * UNE FÉDÉRATION SAML SIMULÉE, POUR LES TESTS : la fédération (sa clé qui signe
 * l'agrégat), des fournisseurs d'identités (leur clé qui signe les réponses), et, en
 * option, un petit serveur HTTP qui sert l'agrégat, le service de découverte (WAYF) et
 * la page d'authentification de chaque IdP (qui poste la réponse à l'ACS, comme un vrai
 * IdP Shibboleth : formulaire auto-soumis).
 *
 * Toutes les clés sont tirées à l'exécution (ou lues d'un dossier hors du dépôt pour le
 * parcours navigateur) : aucune clé privée n'est jamais écrite dans le dépôt. Les
 * signatures sont faites par xml-crypto, le chiffrement par xml-encryption : les mêmes
 * bibliothèques que celles d'un IdP Node, pas une imitation écrite à la main.
 */

export interface Paire {
  cle: string;
  certificat: string;
}

export function paireDeTest(nom: string, bits = 2048): Paire {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: bits });
  return {
    cle: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    certificat: certificatAutoSigne({ clePrivee: privateKey, nomCommun: nom, dureeJours: 3650 }),
  };
}

const RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
const SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256";
const EXC_C14N = "http://www.w3.org/2001/10/xml-exc-c14n#";
const ENVELOPPE = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";

const x = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const instant = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
export const idSaml = () => `_${randomBytes(16).toString("hex")}`;

/** Signe l'élément `cible` (XPath) d'un document, signature placée après `apres` (XPath). */
export function signer(xml: string, paire: Paire, cible: string, apres: string, action: "after" | "prepend" = "after"): string {
  const sig = new SignedXml({
    privateKey: paire.cle,
    publicCert: paire.certificat,
    signatureAlgorithm: RSA_SHA256,
    canonicalizationAlgorithm: EXC_C14N,
  });
  sig.addReference({ xpath: cible, digestAlgorithm: SHA256, transforms: [ENVELOPPE, EXC_C14N] });
  sig.computeSignature(xml, { location: { reference: apres, action } });
  return sig.getSignedXml();
}

/* --- L'agrégat ---------------------------------------------------------------- */

export interface IdpSimule {
  entityId: string;
  nom: string;
  portees: string[];
  sso: string;
  paire: Paire;
}

export function xmlDeLAgregat(idps: IdpSimule[], validUntil: Date): string {
  const entites = idps
    .map(
      (i) => `  <md:EntityDescriptor entityID="${x(i.entityId)}">
    <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
      <md:Extensions>
${i.portees.map((p) => `        <shibmd:Scope regexp="false">${x(p)}</shibmd:Scope>`).join("\n")}
        <mdui:UIInfo>
          <mdui:DisplayName xml:lang="fr">${x(i.nom)}</mdui:DisplayName>
          <mdui:DisplayName xml:lang="en">${x(i.nom)} (en)</mdui:DisplayName>
        </mdui:UIInfo>
      </md:Extensions>
      <md:KeyDescriptor use="signing">
        <ds:KeyInfo><ds:X509Data><ds:X509Certificate>${corpsDuCertificat(i.paire.certificat)}</ds:X509Certificate></ds:X509Data></ds:KeyInfo>
      </md:KeyDescriptor>
      <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${x(i.sso)}/post"/>
      <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${x(i.sso)}"/>
    </md:IDPSSODescriptor>
    <md:Organization>
      <md:OrganizationName xml:lang="fr">${x(i.nom)}</md:OrganizationName>
      <md:OrganizationDisplayName xml:lang="fr">${x(i.nom)}</md:OrganizationDisplayName>
      <md:OrganizationURL xml:lang="fr">https://exemple.test/</md:OrganizationURL>
    </md:Organization>
  </md:EntityDescriptor>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntitiesDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:shibmd="urn:mace:shibboleth:metadata:1.0" xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui" ID="${idSaml()}" Name="https://federation.test" validUntil="${instant(validUntil)}">
${entites}
</md:EntitiesDescriptor>
`;
}

export function agregatSigne(federation: Paire, idps: IdpSimule[], validUntil = new Date(Date.now() + 7 * 86400_000)): string {
  return signer(xmlDeLAgregat(idps, validUntil), federation, "/*", "/*", "prepend");
}

/* --- La demande reçue par l'IdP --------------------------------------------------- */

export interface DemandeRecue {
  id: string;
  destination: string;
  acs: string;
  issuer: string;
  relayState: string | null;
  /** La signature de la demande (liaison Redirect) est-elle valide pour ce certificat ? */
  signeePar: (certificat: string) => boolean;
}

export function lireDemande(adresse: string): DemandeRecue {
  const u = new URL(adresse);
  const brut = u.searchParams.get("SAMLRequest") ?? "";
  const xml = inflateRawSync(Buffer.from(brut, "base64")).toString("utf8");
  const attr = (n: string) => xml.match(new RegExp(`\\b${n}="([^"]*)"`))?.[1] ?? "";
  const issuer = xml.match(/<saml:Issuer[^>]*>([^<]*)<\/saml:Issuer>/)?.[1] ?? "";
  const signeePar = (certificat: string) => {
    // La chaîne signée : les paramètres tels qu'ils figurent dans l'adresse (encodés), dans l'ordre.
    const morceaux = u.search.slice(1).split("&");
    const garder = (k: string) => morceaux.find((m) => m.startsWith(`${k}=`));
    const signe = ["SAMLRequest", "RelayState", "SigAlg"].map(garder).filter(Boolean).join("&");
    const signature = u.searchParams.get("Signature");
    if (!signature) return false;
    return verify("sha256", Buffer.from(signe), new X509Certificate(certificat).publicKey, Buffer.from(signature, "base64"));
  };
  return {
    id: attr("ID"),
    destination: attr("Destination"),
    acs: attr("AssertionConsumerServiceURL"),
    issuer,
    relayState: u.searchParams.get("RelayState"),
    signeePar,
  };
}

/* --- La réponse de l'IdP ----------------------------------------------------------- */

export interface Personne {
  pairwiseId?: string;
  targetedId?: string;
  nameIdPersistant?: string;
  affiliations?: string[];
  scopedAffiliations?: string[];
  schac?: string;
  displayName?: string;
  mail?: string;
}

export interface OptionsDeReponse {
  idp: IdpSimule;
  /** La paire qui signe (par défaut celle de l'IdP) : une autre clé pour les tests de refus. */
  signataire?: Paire;
  enReponseA: string | null;
  acs: string;
  audience: string;
  destination?: string;
  recipient?: string;
  issuer?: string;
  personne: Personne;
  signature?: "assertion" | "reponse" | "les-deux" | "aucune";
  chiffrerPour?: string | null;
  notBefore?: Date;
  notOnOrAfter?: Date;
  assertionId?: string;
  /** Altère l'assertion APRÈS signature (test d'intégrité). */
  alterer?: (xml: string) => string;
}

function attribut(nom: string, valeurs: string[], amical: string): string {
  if (valeurs.length === 0) return "";
  return `<saml:Attribute Name="${x(nom)}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="${amical}">${valeurs
    .map((v) => `<saml:AttributeValue xsi:type="xs:string">${x(v)}</saml:AttributeValue>`)
    .join("")}</saml:Attribute>`;
}

function xmlDeLAssertion(o: OptionsDeReponse, assertionId: string, maintenant: Date): string {
  const p = o.personne;
  const avant = o.notBefore ?? new Date(maintenant.getTime() - 30_000);
  const apres = o.notOnOrAfter ?? new Date(maintenant.getTime() + 5 * 60_000);
  const issuer = o.issuer ?? o.idp.entityId;
  const nameId = p.nameIdPersistant
    ? `<saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent" NameQualifier="${x(o.idp.entityId)}" SPNameQualifier="${x(o.audience)}">${x(p.nameIdPersistant)}</saml:NameID>`
    : `<saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">${idSaml()}</saml:NameID>`;
  const cible = p.targetedId
    ? `<saml:Attribute Name="${ATTRIBUT.eduPersonTargetedID}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" FriendlyName="eduPersonTargetedID"><saml:AttributeValue><saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent" NameQualifier="${x(o.idp.entityId)}" SPNameQualifier="${x(o.audience)}">${x(p.targetedId)}</saml:NameID></saml:AttributeValue></saml:Attribute>`
    : "";
  const confirmation = `<saml:SubjectConfirmationData NotOnOrAfter="${instant(apres)}" Recipient="${x(o.recipient ?? o.acs)}"${o.enReponseA ? ` InResponseTo="${x(o.enReponseA)}"` : ""}/>`;
  return `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ID="${assertionId}" Version="2.0" IssueInstant="${instant(maintenant)}"><saml:Issuer>${x(issuer)}</saml:Issuer><saml:Subject>${nameId}<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">${confirmation}</saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="${instant(avant)}" NotOnOrAfter="${instant(apres)}"><saml:AudienceRestriction><saml:Audience>${x(o.audience)}</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="${instant(maintenant)}" SessionIndex="${idSaml()}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement>${[
    attribut(ATTRIBUT.pairwiseId, p.pairwiseId ? [p.pairwiseId] : [], "pairwise-id"),
    cible,
    attribut(ATTRIBUT.eduPersonScopedAffiliation, p.scopedAffiliations ?? [], "eduPersonScopedAffiliation"),
    attribut(ATTRIBUT.eduPersonAffiliation, p.affiliations ?? [], "eduPersonAffiliation"),
    attribut(ATTRIBUT.schacHomeOrganization, p.schac ? [p.schac] : [], "schacHomeOrganization"),
    attribut(ATTRIBUT.displayName, p.displayName ? [p.displayName] : [], "displayName"),
    attribut(ATTRIBUT.mail, p.mail ? [p.mail] : [], "mail"),
  ].join("")}</saml:AttributeStatement></saml:Assertion>`;
}

async function chiffrer(assertion: string, certificat: string): Promise<string> {
  const publique = new X509Certificate(certificat).publicKey.export({ type: "spki", format: "pem" }).toString();
  const donnees = await new Promise<string>((ok, ko) =>
    encrypt(
      assertion,
      {
        rsa_pub: publique,
        pem: certificat,
        encryptionAlgorithm: "http://www.w3.org/2009/xmlenc11#aes256-gcm",
        keyEncryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p",
        disallowEncryptionWithInsecureAlgorithm: true,
      },
      (e, r) => (e ? ko(e) : ok(r)),
    ),
  );
  return `<saml:EncryptedAssertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${donnees}</saml:EncryptedAssertion>`;
}

/** La réponse SAML, encodée en base64 comme dans le formulaire posté à l'ACS. */
export async function reponseSaml(o: OptionsDeReponse): Promise<{ base64: string; xml: string; assertionId: string }> {
  const maintenant = new Date();
  const signataire = o.signataire ?? o.idp.paire;
  const mode = o.signature ?? "assertion";
  const assertionId = o.assertionId ?? idSaml();
  let assertion = xmlDeLAssertion(o, assertionId, maintenant);
  if (mode === "assertion" || mode === "les-deux") {
    assertion = signer(assertion, signataire, "/*", "/*/*[local-name(.)='Issuer']");
  }
  if (o.alterer) assertion = o.alterer(assertion);
  if (o.chiffrerPour) assertion = await chiffrer(assertion, o.chiffrerPour);
  const issuer = o.issuer ?? o.idp.entityId;
  let xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${idSaml()}" Version="2.0" IssueInstant="${instant(maintenant)}" Destination="${x(o.destination ?? o.acs)}"${o.enReponseA ? ` InResponseTo="${x(o.enReponseA)}"` : ""}><saml:Issuer>${x(issuer)}</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>${assertion}</samlp:Response>`;
  if (mode === "reponse" || mode === "les-deux") {
    xml = signer(xml, signataire, "/*", "/*/*[local-name(.)='Issuer']");
  }
  return { base64: Buffer.from(xml, "utf8").toString("base64"), xml, assertionId };
}

/* --- Le serveur (parcours navigateur) ------------------------------------------- */

export interface FederationSimulee {
  federation: Paire;
  idps: IdpSimule[];
  /** L'empreinte à épingler dans SAML_FEDERATION_CERT_SHA256. */
  empreinte: string;
}

export function federationSimulee(base: string, paires?: { federation: Paire; idps: Paire[] }): FederationSimulee {
  const federation = paires?.federation ?? paireDeTest("federation.test");
  const p = paires?.idps ?? [paireDeTest("idp.univ-test.fr"), paireDeTest("idp.ecole-inconnue.fr")];
  return {
    federation,
    empreinte: empreinteSha256(federation.certificat),
    idps: [
      {
        entityId: "https://idp.univ-test.fr/idp/shibboleth",
        nom: "Université de Test",
        portees: ["univ-test.fr"],
        sso: `${base}/idp/univ-test`,
        paire: p[0]!,
      },
      {
        entityId: "https://idp.ecole-inconnue.fr/idp/shibboleth",
        nom: "École sans offre",
        portees: ["ecole-inconnue.fr"],
        sso: `${base}/idp/ecole-inconnue`,
        paire: p[1]!,
      },
    ],
  };
}

/**
 * Le serveur de la fédération simulée : agrégat, WAYF et pages d'authentification.
 * `personne` : qui « se connecte » à la prochaine demande (le test la pose avant).
 */
export class ServeurDeFederation {
  private serveur: Server | null = null;
  personne: Personne = {};
  /** Le certificat du SP (pour chiffrer les assertions comme le ferait un IdP Shibboleth). */
  chiffrerPour: string | null = null;
  audience = "https://www.business-arena.fr/saml";
  demandes: DemandeRecue[] = [];

  constructor(
    readonly sim: FederationSimulee,
    readonly port: number,
  ) {}

  async demarrer(): Promise<this> {
    this.serveur = createServer((req, res) => {
      void this.traiter(req.url ?? "/", res);
    });
    await new Promise<void>((ok) => this.serveur!.listen(this.port, ok));
    return this;
  }

  async arreter(): Promise<void> {
    await new Promise<void>((ok) => (this.serveur ? this.serveur.close(() => ok()) : ok()));
  }

  private async traiter(chemin: string, res: import("node:http").ServerResponse): Promise<void> {
    const u = new URL(chemin, `http://localhost:${this.port}`);
    const html = (corps: string) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fédération de test</title></head><body>${corps}</body></html>`);
    };
    if (u.pathname === "/federation.xml") {
      res.writeHead(200, { "content-type": "application/samlmetadata+xml" });
      res.end(agregatSigne(this.sim.federation, this.sim.idps));
      return;
    }
    if (u.pathname === "/wayf") {
      const retour = u.searchParams.get("return") ?? "";
      const param = u.searchParams.get("returnIDParam") ?? "entityID";
      const liens = this.sim.idps
        .map((i) => {
          const r = new URL(retour);
          r.searchParams.set(param, i.entityId);
          return `<li><a href="${x(r.toString())}">${x(i.nom)}</a></li>`;
        })
        .join("");
      html(`<h1>Choisissez votre établissement</h1><p data-wayf-sp="${x(u.searchParams.get("entityID") ?? "")}"></p><ul>${liens}</ul>`);
      return;
    }
    const idp = this.sim.idps.find((i) => new URL(i.sso).pathname === u.pathname);
    if (idp) {
      const demande = lireDemande(u.toString());
      this.demandes.push(demande);
      const { base64 } = await reponseSaml({
        idp,
        enReponseA: demande.id,
        acs: demande.acs,
        audience: this.audience,
        personne: this.personne,
        signature: "les-deux",
        chiffrerPour: this.chiffrerPour,
      });
      html(`<h1>Connexion à ${x(idp.nom)}</h1><form method="post" action="${x(demande.acs)}"><input type="hidden" name="SAMLResponse" value="${base64}"><button type="submit">Continuer</button></form><script>document.forms[0].submit()</script>`);
      return;
    }
    res.writeHead(404);
    res.end();
  }
}

/** Les clés du parcours navigateur, partagées par le serveur Next et le test (un dossier hors du dépôt). */
export function pairesDuDossier(lire: (nom: string) => string): { federation: Paire; idps: Paire[]; sp: Paire } {
  const paire = (n: string) => ({ cle: lire(`${n}.key.pem`), certificat: lire(`${n}.cert.pem`) });
  return { federation: paire("federation"), idps: [paire("idp-univ-test"), paire("idp-ecole-inconnue")], sp: paire("sp") };
}

export function memeCle(cle: string, certificat: string): boolean {
  const k: KeyObject = createPublicKey(createPrivateKey(cle));
  return new X509Certificate(certificat).publicKey.equals(k);
}
