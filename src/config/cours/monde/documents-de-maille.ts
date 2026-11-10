import { auCentime } from "./amortissement";
import { ENTREPRISES_DES_DONNEES_STRATEGIQUES, PERTE_DES_DONNEES } from "./donnees-strategiques-de-maille";
import { GAMME, type CodeDeReference } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LES DOCUMENTS DE MAILLE & CO (enseignement spécifique de systèmes d'information de
 * gestion de terminale STMG, thème 4, question 4.1, lot F).
 *
 * CE QUI VIENT DES FICHES : les références de la boutique, leurs noms et leurs prix hors taxes
 * (maille-et-co.ts) ; le comité d'entreprise des Laboratoires Morel, son client qui commande pour ses
 * salariés ; le coût d'une heure de travail, 30 € charges comprises (donnees-strategiques-de-maille.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA COMMANDE DU COMITÉ arrive dans un fichier balisé (XML) : 10 pulls col rond, 6 écharpes et 8
 *     bonnets, aux prix hors taxes de la boutique ;
 *   · LES FACTURES ET LES BONS DE LIVRAISON des façonniers sont rangés sur papier, dans des classeurs.
 *     Retrouver un document prend 8 minutes ; numérisé et indexé dans une gestion électronique des
 *     documents (GED), 1 minute. La GED coûte 49 € par mois ;
 *   · LE CAS : 4 ans d'archives, 2 400 documents, à numériser à 1 minute chacun ; la boutique cherche 20
 *     documents par mois.
 */

export const ENTREPRISES_DES_DOCUMENTS = ENTREPRISES_DES_DONNEES_STRATEGIQUES;

export const COMMANDE_DU_COMITE: readonly { reference: CodeDeReference; quantite: number }[] = [
  { reference: "col-rond", quantite: 10 },
  { reference: "echarpe", quantite: 6 },
  { reference: "bonnet", quantite: 8 },
];

export const RECHERCHE = { minutesSurPapier: 8, minutesAvecLaGed: 1, coutHoraire: PERTE_DES_DONNEES.coutHoraire } as const;
export const GED = { parMois: 49 } as const;
export const ARCHIVES = { documents: 2_400, minutesParDocument: 1, recherchesParMois: 20 } as const;

export const referenceDe = (code: CodeDeReference) => GAMME.find((r) => r.code === code)!;

/** La commande du comité, ligne par ligne, et son total hors taxes. */
export function commandeDuComite() {
  const lignes = COMMANDE_DU_COMITE.map((l) => {
    const r = referenceDe(l.reference);
    return { ...l, nom: r.nom, prixHt: r.prixHt, montant: auCentime(l.quantite * r.prixHt) };
  });
  return { lignes, articles: lignes.reduce((s, l) => s + l.quantite, 0), total: auCentime(lignes.reduce((s, l) => s + l.montant, 0)) };
}

/** Ce que fait gagner une recherche avec la GED. */
export const gainDUneRecherche = () => auCentime(((RECHERCHE.minutesSurPapier - RECHERCHE.minutesAvecLaGed) * RECHERCHE.coutHoraire) / 60);

/** Ce que font gagner n recherches dans le mois. */
export const gainDesRecherches = (recherches: number) => auCentime(recherches * gainDUneRecherche());

/** Le plus petit nombre de recherches par mois qui paie la GED. */
export const recherchesQuiPaientLaGed = () => Math.ceil(GED.parMois / gainDUneRecherche() - 1e-9);

/** Le cas : numériser les archives, et ce que la GED laisse chaque année. */
export function numeriserLesArchives() {
  const a = ARCHIVES;
  const numerisation = auCentime((a.documents * a.minutesParDocument * RECHERCHE.coutHoraire) / 60);
  const gainDeLAnnee = auCentime(gainDesRecherches(a.recherchesParMois) * 12);
  const ged = auCentime(GED.parMois * 12);
  return { ...a, numerisation, gainDeLAnnee, ged, netDeLAnnee: auCentime(gainDeLAnnee - ged) };
}
