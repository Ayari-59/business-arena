import { SITE_URL } from "@/config/site";
import { VENDEUR } from "@/config/editeur";
import { corpsDuCertificat } from "./certificat";
import type { ConfigurationSaml } from "./configuration";
import { ATTRIBUTS_DEMANDES, BINDING, NAMEID_PERSISTANT, NS } from "./constantes";
import { echapperXml as x } from "./xml";

/**
 * LES MÉTADONNÉES DU FOURNISSEUR DE SERVICES (SP), À DÉCLARER DANS LE REGISTRE DE LA
 * FÉDÉRATION (RENATER les recopie dans son agrégat, que les IdP lisent).
 *
 * Ce qu'elles disent :
 *   · l'entityID (`https://www.business-arena.fr/saml`) ;
 *   · l'adresse de réponse (ACS) en HTTP-POST, la seule ;
 *   · le certificat du SP, pour la signature des demandes et le chiffrement des
 *     assertions (les IdP Shibboleth chiffrent par défaut) ;
 *   · la réponse au service de découverte (le WAYF renvoie l'établissement choisi à
 *     /api/saml/connexion) ;
 *   · les attributs demandés, et pourquoi ;
 *   · le nom, la description, le logo (français et anglais), la page d'information et
 *     la politique de confidentialité, affichés par l'IdP et le WAYF ;
 *   · l'organisation et les contacts technique et support.
 *
 * Écrites ici plutôt que par la bibliothèque : celle-ci ne sait pas déclarer l'interface
 * (mdui), les attributs demandés ni la réponse au WAYF, que RENATER demande.
 */

const DESCRIPTION = {
  fr: "Simulation de gestion d'entreprise pour l'enseignement : parties de classe, épisodes manager et concours.",
  en: "Business management simulation for education: class games, manager episodes and competitions.",
};

export function metadonneesDuSp(c: ConfigurationSaml): string {
  const cert = corpsDuCertificat(c.certificat).replace(/(.{64})/g, "$1\n          ").trim();
  const keyInfo = `<ds:KeyInfo><ds:X509Data><ds:X509Certificate>
          ${cert}
        </ds:X509Certificate></ds:X509Data></ds:KeyInfo>`;
  const logo = `${SITE_URL}/icon-192.png`;
  const attributs = ATTRIBUTS_DEMANDES.map(
    (a) =>
      `      <md:RequestedAttribute FriendlyName="${x(a.nom)}" Name="${x(a.uri)}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" isRequired="${a.requis}"/>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="${NS.md}" xmlns:ds="${NS.ds}" xmlns:mdui="${NS.mdui}" xmlns:idpdisc="${NS.idpdisc}" xmlns:init="${NS.init}" entityID="${x(c.entityId)}">
  <md:SPSSODescriptor protocolSupportEnumeration="${NS.samlp}" AuthnRequestsSigned="true" WantAssertionsSigned="false">
    <md:Extensions>
      <idpdisc:DiscoveryResponse Binding="${NS.idpdisc}" Location="${x(c.connexion)}" index="1"/>
      <init:RequestInitiator Binding="${NS.init}" Location="${x(c.connexion)}"/>
      <mdui:UIInfo>
        <mdui:DisplayName xml:lang="fr">Business Arena</mdui:DisplayName>
        <mdui:DisplayName xml:lang="en">Business Arena</mdui:DisplayName>
        <mdui:Description xml:lang="fr">${x(DESCRIPTION.fr)}</mdui:Description>
        <mdui:Description xml:lang="en">${x(DESCRIPTION.en)}</mdui:Description>
        <mdui:InformationURL xml:lang="fr">${x(`${SITE_URL}/integration#renater`)}</mdui:InformationURL>
        <mdui:InformationURL xml:lang="en">${x(`${SITE_URL}/integration#renater`)}</mdui:InformationURL>
        <mdui:PrivacyStatementURL xml:lang="fr">${x(`${SITE_URL}/mentions-legales`)}</mdui:PrivacyStatementURL>
        <mdui:PrivacyStatementURL xml:lang="en">${x(`${SITE_URL}/mentions-legales`)}</mdui:PrivacyStatementURL>
        <mdui:Logo height="192" width="192" xml:lang="fr">${x(logo)}</mdui:Logo>
        <mdui:Logo height="192" width="192" xml:lang="en">${x(logo)}</mdui:Logo>
      </mdui:UIInfo>
    </md:Extensions>
    <md:KeyDescriptor use="signing">
      ${keyInfo}
    </md:KeyDescriptor>
    <md:KeyDescriptor use="encryption">
      ${keyInfo}
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#aes256-gcm"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2009/xmlenc11#aes128-gcm"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
      <md:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p"/>
    </md:KeyDescriptor>
    <md:NameIDFormat>${NAMEID_PERSISTANT}</md:NameIDFormat>
    <md:AssertionConsumerService Binding="${BINDING.post}" Location="${x(c.acs)}" index="1" isDefault="true"/>
    <md:AttributeConsumingService index="1" isDefault="true">
      <md:ServiceName xml:lang="fr">Business Arena</md:ServiceName>
      <md:ServiceName xml:lang="en">Business Arena</md:ServiceName>
      <md:ServiceDescription xml:lang="fr">${x(DESCRIPTION.fr)}</md:ServiceDescription>
      <md:ServiceDescription xml:lang="en">${x(DESCRIPTION.en)}</md:ServiceDescription>
${attributs}
    </md:AttributeConsumingService>
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="fr">${x(VENDEUR.nom)}</md:OrganizationName>
    <md:OrganizationName xml:lang="en">${x(VENDEUR.nom)}</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="fr">Business Arena</md:OrganizationDisplayName>
    <md:OrganizationDisplayName xml:lang="en">Business Arena</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="fr">${x(SITE_URL)}</md:OrganizationURL>
    <md:OrganizationURL xml:lang="en">${x(SITE_URL)}</md:OrganizationURL>
  </md:Organization>
  <md:ContactPerson contactType="technical">
    <md:Company>Business Arena</md:Company>
    <md:EmailAddress>mailto:${x(VENDEUR.contact)}</md:EmailAddress>
  </md:ContactPerson>
  <md:ContactPerson contactType="support">
    <md:Company>Business Arena</md:Company>
    <md:EmailAddress>mailto:${x(VENDEUR.contact)}</md:EmailAddress>
  </md:ContactPerson>
</md:EntityDescriptor>
`;
}
