import { ATLAS_CONSEIL, COMMERCIAUX, CONSULTANTS } from "./atlas-conseil";

/**
 * LE MONDE DU COURS : LE RÉSEAU D'ATLAS CONSEIL (enseignement spécifique de systèmes d'information de
 * gestion de terminale STMG, thème 4, question 4.2, lot F).
 *
 * CE QUI VIENT DES FICHES : les 10 consultants et les 3 commerciaux du cabinet (atlas-conseil.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA LIGNE DU BUREAU, dans un immeuble ancien, envoie 20 Mbit/s vers Internet ; le cabinet en garde 20 %
 *     pour le reste (la messagerie, les fichiers, les mises à jour) ;
 *   · UNE VISIOCONFÉRENCE de bonne qualité envoie 2,5 Mbit/s depuis le poste du bureau ;
 *   · UN RAPPORT de fin de mission, avec ses annexes, pèse 300 Mo ;
 *   · LA CONFIGURATION d'un poste du bureau : l'adresse 192.168.10.23, le masque 255.255.255.0 (un réseau
 *     de 256 adresses, dont celle du réseau et celle de diffusion ne vont à aucun poste), la box à
 *     192.168.10.1, qui sert de passerelle et de serveur de noms ;
 *   · L'ADRESSE DU SITE d'inscription aux formations est écrite sous un nom réservé aux exemples
 *     (atlas.example), pour ne désigner aucun site réel ;
 *   · LE CAS : une offre fibre envoie 300 Mbit/s, pour 90 € de plus par mois.
 */

export const ENTREPRISES_DU_RESEAU = [ATLAS_CONSEIL.code] as const;

export const PERSONNES_DU_BUREAU = CONSULTANTS.nombre + COMMERCIAUX.length;
export const LIGNE = { envoiMbits: 20, partReservee: 0.2 } as const;
export const VISIO = { envoiMbits: 2.5 } as const;
export const RAPPORT = { mo: 300 } as const;
export const FIBRE = { envoiMbits: 300, enPlusParMois: 90 } as const;
export const POSTE = { adresse: "192.168.10.23", masque: "255.255.255.0", passerelle: "192.168.10.1", bitsDHote: 8 } as const;
export const URL_D_INSCRIPTION = "https://formations.atlas.example/inscription";

/** Le débit d'envoi que les visioconférences peuvent prendre, sur une ligne donnée. */
export const debitPourLesVisios = (envoiMbits: number = LIGNE.envoiMbits) => Math.round(envoiMbits * (1 - LIGNE.partReservee) * 100) / 100;

/** Le débit qu'envoient n visioconférences en même temps. */
export const debitDesVisios = (n: number) => Math.round(n * VISIO.envoiMbits * 100) / 100;

/** Le plus grand nombre de visioconférences que la ligne tient en même temps. */
export const visiosQueLaLigneTient = (envoiMbits: number = LIGNE.envoiMbits) => Math.floor(debitPourLesVisios(envoiMbits) / VISIO.envoiMbits + 1e-9);

/** Le temps d'envoi du rapport, en secondes : les mégaoctets en mégabits (× 8), divisés par le débit. */
export const secondesPourLeRapport = (envoiMbits: number = LIGNE.envoiMbits) => Math.round(((RAPPORT.mo * 8) / envoiMbits) * 10) / 10;

/** Les adresses qu'un réseau donne aux postes : 2 puissance les bits d'hôte, moins l'adresse du réseau et celle de diffusion. */
export const adressesDePostes = () => 2 ** POSTE.bitsDHote - 2;

/** Le cas : la fibre. */
export function passerALaFibre() {
  return {
    ...FIBRE,
    personnes: PERSONNES_DU_BUREAU,
    visiosAujourdhui: visiosQueLaLigneTient(),
    visiosAvecLaFibre: visiosQueLaLigneTient(FIBRE.envoiMbits),
    rapportAujourdhui: secondesPourLeRapport(),
    rapportAvecLaFibre: secondesPourLeRapport(FIBRE.envoiMbits),
    parAn: FIBRE.enPlusParMois * 12,
  };
}
