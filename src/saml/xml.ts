import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import { NS } from "./constantes";

/**
 * LIRE DU XML VENU DE L'EXTÉRIEUR (agrégat de la fédération, réponse d'un IdP).
 *
 * Deux règles avant tout analyseur :
 *   · aucune déclaration de type de document (`<!DOCTYPE`, `<!ENTITY`) : un message SAML
 *     ou un agrégat n'en porte jamais, et c'est la porte des entités externes (XXE) et
 *     de l'expansion exponentielle (« billion laughs »). Refusé d'office, quelle que
 *     soit la tolérance de l'analyseur (qu'un test vérifie aussi) ;
 *   · une taille bornée.
 *
 * L'analyseur (@xmldom/xmldom, celui de @node-saml/node-saml et de xml-crypto) lève à
 * la moindre erreur de syntaxe.
 */

export class XmlRefuse extends Error {
  constructor(motif: string) {
    super(motif);
    this.name = "XmlRefuse";
  }
}

export function sansDeclarationDeType(xml: string): void {
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) throw new XmlRefuse("déclaration de type de document (DTD) refusée");
}

export function analyser(xml: string, tailleMax: number): Document {
  if (xml.length > tailleMax) throw new XmlRefuse("document trop long");
  sansDeclarationDeType(xml);
  const erreurs: string[] = [];
  const doc = new DOMParser({
    locator: {},
    errorHandler: {
      warning: () => undefined,
      error: (m: string) => erreurs.push(m),
      fatalError: (m: string) => erreurs.push(m),
    },
  }).parseFromString(xml, "text/xml") as unknown as Document;
  if (erreurs.length > 0 || !doc || !doc.documentElement) throw new XmlRefuse("XML malformé");
  return doc;
}

const espaces = xpath.useNamespaces({ ...NS });

export function elements(contexte: Node, chemin: string): Element[] {
  return (espaces(chemin, contexte) as Node[]).filter((n): n is Element => n.nodeType === 1);
}

export function premier(contexte: Node, chemin: string): Element | null {
  return elements(contexte, chemin)[0] ?? null;
}

export function texte(e: Element | null | undefined): string {
  return (e?.textContent ?? "").trim();
}

/** Le seul élément racine attendu (espace de noms et nom local), ou un refus. */
export function racine(doc: Document, ns: string, nomLocal: string): Element {
  const r = doc.documentElement;
  if (!r || r.namespaceURI !== ns || r.localName !== nomLocal) throw new XmlRefuse(`racine ${nomLocal} attendue`);
  return r;
}

/** Échappement pour les métadonnées qu'on écrit (texte et attributs). */
export function echapperXml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
