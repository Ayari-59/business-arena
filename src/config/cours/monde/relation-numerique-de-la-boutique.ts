import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { ANS_DE_CONSERVATION, COUT_D_UN_SMS, FICHIER_DE_LA_CARTE, fichierDeLaCarte, valeurDUneCliente } from "./clientele-de-la-boutique";
import { MAILLE_ET_CO } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LA RELATION NUMÉRIQUE DE MAILLE & CO (le chapitre « Fidéliser grâce au numérique :
 * programme, valeur vie, gestion de la relation client », mercatique de terminale, question 3.2 :
 * « Comment enrichir la relation client grâce au numérique ? »).
 *
 * CE QUI VIENT DES FICHES QUI EXISTENT, relu et jamais recopié (clientele-de-la-boutique.ts, et la carte
 * de fidélité de vente-et-caisse.ts) : les clientes de la carte, la marge d'un de leurs passages, le
 * taux de départ d'un mois, la valeur d'une cliente ; le fichier de la carte rangé par la date du
 * dernier achat, les consentements, la durée de conservation et le coût d'un SMS.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · LA RELANCE DES ANCIENNES CLIENTES (dernier achat il y a 1 à 3 ans) qui ont accepté les offres :
 *     un SMS et un bon de 10 € sur le prochain achat ; la boutique loue pour cela un logiciel de gestion
 *     de la relation client (en anglais, Customer Relationship Management, ou CRM), 120 € par mois ;
 *   · LE CAS « RELANCER LES DORMANTES ? » : la gérante voudrait aussi écrire aux cartes dormantes (plus
 *     de 3 ans), et elle attend que 8 anciennes clientes reviennent avec leur bon.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la durée de vie moyenne se donnait au dixième de mois, elle
 * est au centième ; la valeur vie se calcule sur la marge d'un mois et la durée de vie arrondies,
 * lues sur clientele-de-la-boutique.ts.
 */

const auCentime = arrondi2;

export const RELANCE_DES_ANCIENNES = { bon: 10, logicielParMois: 120, retoursAttendus: 8 } as const;

export type CodeDeFacteur = "satisfaction" | "avantages" | "habitude";

/** Ce qui retient une cliente de la boutique (hypothèse du chapitre). */
export const FACTEURS_DE_FIDELITE: readonly { libelle: string; facteur: CodeDeFacteur; pourquoi: string }[] = [
  { libelle: "Une maille qui tient au lavage", facteur: "satisfaction", pourquoi: "La qualité perçue satisfait la cliente : elle revient parce qu'elle est contente." },
  { libelle: "Le conseil d'une vendeuse qui connaît sa taille", facteur: "satisfaction", pourquoi: "La relation et le service font la satisfaction autant que le produit." },
  { libelle: "Un bon d'achat après quelques passages avec la carte", facteur: "avantages", pourquoi: "Le programme récompense la fidélité : un avantage à revenir." },
  { libelle: "Les ventes privées réservées aux clientes de la carte", facteur: "avantages", pourquoi: "Un privilège réservé : la cliente se sent reconnue, et elle a une raison de rester." },
  { libelle: "La boutique sur le trajet de son travail", facteur: "habitude", pourquoi: "La proximité rend le retour facile : une fidélité d'habitude, fragile si un concurrent s'installe plus près." },
  { libelle: "Connaître déjà les tailles de la marque", facteur: "habitude", pourquoi: "Changer d'enseigne demanderait de tout réessayer : un coût de changement, qui retient sans attacher." },
];

/** Les messages numériques que la boutique veut envoyer, et le canal qui convient à chacun (hypothèse du chapitre). */
export const MESSAGES_NUMERIQUES = {
  ventePrivee: "la vente privée de demain matin",
} as const;

/** La carte : les clientes, la marge d'un passage par mois, le taux de départ, la durée de vie moyenne et la valeur d'une cliente. */
export function valeurVieDUneCliente() {
  const v = valeurDUneCliente(MAILLE_ET_CO);
  // La marge et la durée de vie, lues sur clientele-de-la-boutique.ts, au centième ; la valeur vie en repart, comme l'élève.
  const margeDUnMois = auCentime(v.margeDUnPassage);
  const dureeDeVie = auCentime(v.dureeDeVie);
  return { clientes: v.clientes, margeDUnMois, departs: v.departs, dureeDeVie, valeur: auCentime(margeDUnMois * dureeDeVie) };
}

/** Le fichier de la carte : les rangs, ce qui se garde, ce qui s'efface, et à qui un message peut s'envoyer. */
export function fichierCrm() {
  const f = fichierDeLaCarte();
  const anciennes = FICHIER_DE_LA_CARTE.find((r) => r.code === "anciennes")!;
  const dormantes = FICHIER_DE_LA_CARTE.find((r) => r.code === "dormantes")!;
  return { ...f, rangs: FICHIER_DE_LA_CARTE, anciennes, dormantes, ansDeConservation: ANS_DE_CONSERVATION, coutDUnSms: COUT_D_UN_SMS };
}

/** La relance des anciennes clientes consentantes : ce que laisse une cliente qui revient, et ce que coûte la relance. */
export function relanceDesAnciennes(revenues: number) {
  const k = RELANCE_DES_ANCIENNES;
  const f = fichierCrm();
  const margeDUnRetour = auCentime(valeurVieDUneCliente().margeDUnMois - k.bon);
  const coutFixe = auCentime(f.anciennes.consentement * f.coutDUnSms + k.logicielParMois);
  const marge = auCentime(revenues * margeDUnRetour);
  return { destinataires: f.anciennes.consentement, revenues, margeDUnRetour, coutFixe, marge, gain: auCentime(marge - coutFixe) };
}

/** Le plus petit nombre de clientes revenues qui paie la relance. */
export const retoursQuiPaient = () => Math.ceil(relanceDesAnciennes(0).coutFixe / relanceDesAnciennes(0).margeDUnRetour - 1e-9);
