import { arrondi2, taux2 } from "../../../pedagogy/cours/deux-decimales";
import { enseigneDe, qualitePercue } from "./attractivite";
import { MARCHE_A_TROIS } from "./marche-a-trois";
import { CANAL_INDIRECT, CLIENTELES, type CodeDeClientele } from "./mercatique-de-nova";
import { GAMME_DE_NOVA, VENTES_A_CAMPUSTECH, type CodeDeReference } from "./nova-gestion";

/**
 * LE MONDE DU COURS : L'OFFRE DE NOVA (le chapitre « Positionner l'offre : marque, gamme, types de
 * marketing », mercatique de terminale, question 1.1 : « La personnalisation de l'offre est-elle
 * incontournable ? »).
 *
 * CE QUI VIENT DES FICHES QUI EXISTENT, relu et jamais recopié :
 *   · nova-gestion.ts : la gamme Go, One et Studio (GAMME_DE_NOVA : prix, coût variable, ventes d'un
 *     mois en gamme), et les 320 enceintes que CampusTech achète chaque mois ;
 *   · marche-a-trois.ts et attractivite.ts : le prix et la qualité perçue des trois enseignes du
 *     marché (SoundBox casse les prix, Auris tient le haut de gamme) ;
 *   · mercatique-de-nova.ts : les trois clientèles (étudiants, familles, mélomanes) et le canal
 *     indirect, CampusTech.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · la référence que chaque clientèle achète d'abord (la Go aux étudiants, la One aux familles, la
 *     Studio aux mélomanes) : le couple produit-marché ;
 *   · les éléments de l'offre globale de la NOVA One, rangés en produit, services et signes ;
 *   · LA PERSONNALISATION PROPOSÉE À CAMPUSTECH : graver le logo de chaque campus sur les enceintes.
 *     Chaque commande gravée demande un réglage de la machine (480 €), chaque gravure coûte 1,50 € ;
 *     NOVA facture 4 € de plus par enceinte gravée. Le cas « CampusTech veut son logo » essaie une
 *     commande de 150 enceintes.
 */

const auCentime = arrondi2;

/** La référence que chaque clientèle achète d'abord (hypothèse du chapitre). */
export const COUPLES_PRODUIT_MARCHE: Readonly<Record<CodeDeReference, CodeDeClientele>> = { go: "etudiants", one: "familles", studio: "melomanes" };

export type CodeDeComposante = "produit" | "services" | "signes";

/** L'offre globale de la NOVA One (hypothèse du chapitre) : le cœur du produit, les services qui l'entourent, les signes qui la font reconnaître. */
export const OFFRE_GLOBALE_DE_LA_ONE: readonly { libelle: string; composante: CodeDeComposante; pourquoi: string }[] = [
  { libelle: "Le son et l'autonomie de la batterie", composante: "produit", pourquoi: "C'est ce que le client achète d'abord : le produit de base, ses performances." },
  { libelle: "La résistance aux éclaboussures", composante: "produit", pourquoi: "Une caractéristique technique du produit lui-même, qui fait partie de sa qualité." },
  { libelle: "La livraison à domicile et l'aide en ligne", composante: "services", pourquoi: "Un service autour du produit : il ne change pas l'enceinte, il facilite l'achat et l'usage." },
  { libelle: "La garantie légale et le service après-vente", composante: "services", pourquoi: "Un service associé, qui rassure l'acheteur sur la durée." },
  { libelle: "Le nom NOVA et son logo", composante: "signes", pourquoi: "La marque : un signe qui distingue l'offre et porte son image." },
  { libelle: "Le design arrondi et ses coloris", composante: "signes", pourquoi: "Le design fait reconnaître l'enceinte au premier regard : un signe, autant qu'une forme." },
  { libelle: "La boîte en carton recyclé", composante: "signes", pourquoi: "Le conditionnement protège, mais il informe et communique aussi : c'est un signe de l'offre." },
];

export type CodeDeMarketing = "masse" | "differencie" | "concentre" | "individualise";

/** Quatre façons de s'adresser au marché, vues sur le marché de NOVA (hypothèse du chapitre). */
export const FACONS_DE_S_ADRESSER_AU_MARCHE: readonly { libelle: string; type: CodeDeMarketing; pourquoi: string }[] = [
  { libelle: "SoundBox vend la même enceinte à tous, avec beaucoup de publicité", type: "masse", pourquoi: "Une seule offre pour tout le marché : c'est le marketing de masse, qui mise sur les volumes." },
  { libelle: "NOVA propose la Go, la One et la Studio, chacune à sa clientèle", type: "differencie", pourquoi: "Une offre adaptée à chaque segment visé : c'est le marketing différencié." },
  { libelle: "Auris ne s'adresse qu'aux mélomanes exigeants", type: "concentre", pourquoi: "Un seul segment, servi à fond : c'est le marketing concentré." },
  { libelle: "Le logo de chaque campus gravé sur les enceintes de CampusTech", type: "individualise", pourquoi: "L'offre est faite pour un client précis : c'est le marketing individualisé, ou personnalisé." },
];

/** La personnalisation proposée à CampusTech (hypothèses du chapitre). */
export const PERSONNALISATION = {
  reglageParCommande: 480,
  gravureParEnceinte: 1.5,
  supplementFacture: 4,
  /** La commande du cas « CampusTech veut son logo ». */
  commandeDuCas: 150,
} as const;

/** La gamme d'un mois, référence par référence : le chiffre d'affaires, la marge d'une enceinte, et la part dans le chiffre d'affaires. */
export function gammeDuMois() {
  const references = GAMME_DE_NOVA.references.map((r) => ({
    code: r.code,
    nom: r.nom,
    prix: r.prix,
    coutVariable: r.coutVariableUnitaire,
    marge: auCentime(r.prix - r.coutVariableUnitaire),
    quantite: r.quantite,
    chiffreDAffaires: auCentime(r.quantite * r.prix),
    clientele: CLIENTELES.find((k) => k.code === COUPLES_PRODUIT_MARCHE[r.code])!,
  }));
  const total = auCentime(references.reduce((t, r) => t + r.chiffreDAffaires, 0));
  return {
    references: references.map((r) => ({ ...r, part: taux2(r.chiffreDAffaires, total) })),
    chiffreDAffaires: total,
  };
}

/** Les trois enseignes du marché : leur prix et leur qualité perçue (1 est celle de la NOVA One). */
export function positionsDuMarche() {
  return MARCHE_A_TROIS.enseignes.map((e) => ({ code: e.code, nom: e.nom, prix: e.offre.prix, qualite: auCentime(qualitePercue(MARCHE_A_TROIS, e.offre)), metier: e.metier }));
}

/** Le nom d'une enseigne du marché, par son code. */
export const nomDeLEnseigne = (code: "soundbox" | "auris") => enseigneDe(MARCHE_A_TROIS, code).nom;

/** Une commande gravée de q enceintes : ce que facture le supplément, ce que coûte la gravure, et ce qu'il reste. */
export function commandeGravee(q: number) {
  const p = PERSONNALISATION;
  const supplement = auCentime(q * p.supplementFacture);
  const cout = auCentime(p.reglageParCommande + q * p.gravureParEnceinte);
  return { quantite: q, supplement, cout, gain: auCentime(supplement - cout) };
}

/** Ce que la gravure laisse sur une enceinte, avant le réglage. */
export const margeDeLaGravure = () => auCentime(PERSONNALISATION.supplementFacture - PERSONNALISATION.gravureParEnceinte);

/** La plus petite commande gravée dont le supplément paie la gravure et le réglage. */
export const plusPetiteCommandeGravee = () => Math.ceil(PERSONNALISATION.reglageParCommande / margeDeLaGravure() - 1e-9);

/** Le plus petit supplément par enceinte, au centime supérieur, qui paie une commande gravée de q enceintes. */
export const supplementQuiPaie = (q: number) => Math.ceil((PERSONNALISATION.gravureParEnceinte + PERSONNALISATION.reglageParCommande / q) * 100 - 1e-6) / 100;

/** La commande mensuelle de CampusTech, et son nom. */
export const commandeDeCampusTech = () => ({ nom: CANAL_INDIRECT.nom, quantite: VENTES_A_CAMPUSTECH[0] });
