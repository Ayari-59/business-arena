import { NOM_DU_SITE, DESCRIPTION_ACCUEIL } from "@/config/seo";
import { SITE_URL } from "@/config/site";

/**
 * CE QUE LE SITE DIT DE LUI-MÊME À UNE MACHINE.
 *
 * Le site n'en disait RIEN : zéro donnée structurée sur les douze pages
 * publiques, relevé pendant l'audit. Un moteur devait donc deviner, à partir
 * du seul texte, que « Business Arena » est le nom d'un produit et non deux
 * mots de la phrase, et quel fichier est son logo. C'est le genre de manque
 * qui ne casse rien et qui coûte une vignette dans un résultat de recherche.
 *
 * DEUX NŒUDS, ET RIEN D'AUTRE. L'organisation qui édite, et le site
 * lui-même — reliés par leur identifiant, ce qui évite les deux entités
 * séparées que produit un balisage recopié d'un exemple. Tout le reste a été
 * écarté pour une raison précise :
 *
 * · Pas de `SearchAction` : le site n'a pas de recherche, et annoncer une
 *   fonction qui n'existe pas est un mensonge comme un autre.
 * · Pas d'`offers` ni de prix : il y a un palier gratuit ET des licences.
 *   Écrire « price: 0 » pour le produit entier serait faux.
 * · Pas d'`aggregateRating` : personne n'a noté quoi que ce soit.
 * · Pas de `sameAs` : aucun compte public à citer.
 * · Pas d'`EducationalOrganization` : Business Arena n'est pas un
 *   établissement d'enseignement, c'est un outil que des établissements
 *   emploient. Le type le dirait pourtant.
 *
 * AUCUNE VALEUR N'EST RECOPIÉE. Le nom, l'adresse et la description viennent
 * des mêmes constantes que les métadonnées de la page : deux endroits qui
 * écrivent le nom du site sont deux endroits qui finiront par le dire
 * différemment.
 *
 * LE LOGO EST LA VERSION POUR FOND CLAIR. Un résultat de recherche se pose
 * sur du blanc ; le fichier principal écrit « BUSINESS ARENA » en gris pâle,
 * pour le fond d'encre du site, et y serait invisible. Ses dimensions sont
 * déclarées ici et vérifiées sur le fichier par
 * tests/architecture/donnees-structurees.test.ts.
 */
const LOGO = { chemin: "/brand/logo-light.png", largeur: 2004, hauteur: 400 } as const;

const ORGANISATION = `${SITE_URL}/#organisation`;
const SITE = `${SITE_URL}/#site`;

const GRAPHE = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANISATION,
      name: NOM_DU_SITE,
      url: SITE_URL,
      description: DESCRIPTION_ACCUEIL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}${LOGO.chemin}`,
        width: LOGO.largeur,
        height: LOGO.hauteur,
      },
    },
    {
      "@type": "WebSite",
      "@id": SITE,
      name: NOM_DU_SITE,
      url: SITE_URL,
      inLanguage: "fr-FR",
      publisher: { "@id": ORGANISATION },
    },
  ],
};

/**
 * Le chevron ouvrant est échappé : c'est la seule façon qu'une valeur ne
 * puisse pas fermer la balise qui la porte. Rien ici n'en contient
 * aujourd'hui — c'est justement pourquoi on le fait maintenant, pendant que
 * personne n'y pense.
 */
const JSON_LD = JSON.stringify(GRAPHE).replace(/</g, "\\u003c");

export function DonneesStructurees() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
  );
}
