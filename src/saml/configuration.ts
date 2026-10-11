import { createPrivateKey, createPublicKey, X509Certificate } from "node:crypto";
import { SITE_URL } from "@/config/site";
import { empreinteSha256, memeEmpreinte, pemDeLEnvironnement } from "./certificat";
import { ADRESSES_RENATER, adressesDuSp, entityIdDuSp, type Federation } from "./constantes";

/**
 * LA CONFIGURATION DU FOURNISSEUR DE SERVICES, LUE DE L'ENVIRONNEMENT.
 *
 *   SAML_SP_PRIVATE_KEY            clé privée RSA du SP (PEM) : signe les demandes, déchiffre les assertions
 *   SAML_SP_CERT                   son certificat auto-signé (PEM), publié dans les métadonnées
 *   SAML_FEDERATION                « test » (par défaut) ou « production »
 *   SAML_FEDERATION_CERT_SHA256    empreinte SHA-256 du certificat qui signe l'agrégat de RENATER
 *   SAML_FEDERATION_CERT           ce certificat lui-même (PEM), facultatif si l'empreinte est donnée
 *   SAML_FEDERATION_METADATA_URL   facultatif : remplace l'adresse documentée de l'agrégat
 *   SAML_WAYF_URL                  facultatif : remplace l'adresse documentée du service de découverte
 *   SAML_SP_ORIGIN                 facultatif : l'origine des routes (par défaut celle du site) ; tests
 *   SAML_HTTP_LOCAL=1              tests seulement : agrégat en HTTP vers la machine locale
 *
 * Sans clé, sans certificat ou sans épingle de l'agrégat, la connexion n'est PAS
 * configurée : les routes répondent 503 et le bouton n'apparaît nulle part. Aucune clé
 * n'est improvisée.
 */

export interface ConfigurationSaml {
  federation: Federation;
  entityId: string;
  origine: string;
  acs: string;
  connexion: string;
  metadonnees: string;
  urlAgregat: string;
  urlWayf: string;
  clePrivee: string;
  certificat: string;
  /** Le certificat qui signe l'agrégat, s'il est donné en entier. */
  certificatFederation: string | null;
  /** Son empreinte SHA-256 (donnée, ou calculée du certificat). */
  empreinteFederation: string;
  httpLocal: boolean;
}

export type EtatDeConfiguration =
  | { pret: true; configuration: ConfigurationSaml }
  | { pret: false; manque: string[] };

export function lireConfiguration(env: Record<string, string | undefined> = process.env): EtatDeConfiguration {
  const manque: string[] = [];
  const clePrivee = pemDeLEnvironnement(env.SAML_SP_PRIVATE_KEY);
  const certificat = pemDeLEnvironnement(env.SAML_SP_CERT);
  const certificatFederation = pemDeLEnvironnement(env.SAML_FEDERATION_CERT);
  let empreinteFederation = env.SAML_FEDERATION_CERT_SHA256?.trim() ?? "";

  if (!clePrivee) manque.push("SAML_SP_PRIVATE_KEY");
  if (!certificat) manque.push("SAML_SP_CERT");
  if (clePrivee && certificat) {
    try {
      const publique = createPublicKey(createPrivateKey(clePrivee));
      const x = new X509Certificate(certificat);
      if (!x.publicKey.equals(publique)) manque.push("SAML_SP_CERT (ne correspond pas à SAML_SP_PRIVATE_KEY)");
    } catch {
      manque.push("SAML_SP_PRIVATE_KEY ou SAML_SP_CERT (illisible)");
    }
  }
  if (certificatFederation) {
    try {
      new X509Certificate(certificatFederation);
      const calculee = empreinteSha256(certificatFederation);
      if (empreinteFederation && !memeEmpreinte(empreinteFederation, calculee)) {
        manque.push("SAML_FEDERATION_CERT_SHA256 (ne correspond pas à SAML_FEDERATION_CERT)");
      }
      empreinteFederation = calculee;
    } catch {
      manque.push("SAML_FEDERATION_CERT (illisible)");
    }
  }
  if (!empreinteFederation) manque.push("SAML_FEDERATION_CERT_SHA256");
  else if (empreinteFederation.replace(/[^0-9a-f]/gi, "").length !== 64) {
    manque.push("SAML_FEDERATION_CERT_SHA256 (64 chiffres hexadécimaux attendus)");
  }

  const federation: Federation = env.SAML_FEDERATION?.trim() === "production" ? "production" : "test";
  if (manque.length > 0) return { pret: false, manque };

  const origine = (env.SAML_SP_ORIGIN?.trim() || SITE_URL).replace(/\/+$/, "");
  const a = adressesDuSp(origine);
  return {
    pret: true,
    configuration: {
      federation,
      entityId: entityIdDuSp(SITE_URL),
      origine,
      acs: a.acs,
      connexion: a.connexion,
      metadonnees: a.metadonnees,
      urlAgregat: env.SAML_FEDERATION_METADATA_URL?.trim() || ADRESSES_RENATER[federation].metadonnees,
      urlWayf: env.SAML_WAYF_URL?.trim() || ADRESSES_RENATER[federation].wayf,
      clePrivee: clePrivee!,
      certificat: certificat!,
      certificatFederation,
      empreinteFederation,
      httpLocal: env.SAML_HTTP_LOCAL === "1",
    },
  };
}

const VARIABLES = [
  "SAML_SP_PRIVATE_KEY",
  "SAML_SP_CERT",
  "SAML_FEDERATION",
  "SAML_FEDERATION_CERT_SHA256",
  "SAML_FEDERATION_CERT",
  "SAML_FEDERATION_METADATA_URL",
  "SAML_WAYF_URL",
  "SAML_SP_ORIGIN",
  "SAML_HTTP_LOCAL",
] as const;
let memo: { cle: string; etat: EtatDeConfiguration } | null = null;

/** L'état de la configuration, relu seulement quand l'environnement change (les clés ne sont analysées qu'une fois). */
export function etatDeConfiguration(): EtatDeConfiguration {
  const cle = VARIABLES.map((v) => process.env[v] ?? "").join("\u0000");
  if (memo?.cle !== cle) memo = { cle, etat: lireConfiguration() };
  return memo.etat;
}

/** La configuration, ou null : le bouton et les routes se taisent. */
export function configurationSaml(): ConfigurationSaml | null {
  const e = etatDeConfiguration();
  return e.pret ? e.configuration : null;
}

/** La connexion par l'établissement est-elle proposée ? (les boutons) */
export function connexionEtablissementProposee(): boolean {
  return configurationSaml() !== null;
}
