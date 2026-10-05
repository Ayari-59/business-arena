/**
 * LA VERSION DU MODÈLE DE CHAQUE ÉPISODE.
 *
 * Une partie enregistrée garde la version du modèle sous lequel elle a été
 * jouée. Corriger un moteur change ce que valait chaque option : une décision
 * jugée bonne peut ne plus l'être. Le profil se recalcule toujours sous le
 * modèle actuel, mais il doit pouvoir dire qu'une partie date d'avant une
 * correction.
 *
 * L'empreinte est le résultat moyen des références de l'épisode sur les
 * trente tirages du bilan. Un test la recalcule : si un moteur change, le test
 * échoue tant qu'on n'a pas relevé la version et la nouvelle empreinte. On ne
 * peut donc pas corriger un modèle sans le dire.
 */
export interface VersionDuModele {
  version: number;
  /** Le résultat moyen de chaque référence de l'épisode, arrondi à l'euro. */
  empreinte: readonly number[];
}

export const VERSIONS_DES_MODELES: Readonly<Record<string, VersionDuModele>> = {
  "trimestre-qui-derape": { version: 1, empreinte: [363898, 314647, 303348] },
  "equipe-qui-s-epuise": { version: 1, empreinte: [18694, -83988, -87487] },
  "depot-qui-deborde": { version: 1, empreinte: [20948, -102925, -89178] },
  "budget-qui-ne-tient-pas": { version: 1, empreinte: [2550, -78077, -50690] },
  "projet-qui-glisse": { version: 1, empreinte: [147457, -106965, -2309] },
  "fournisseur-qui-augmente": { version: 1, empreinte: [227006, 150738, 171680] },
  "poste-qui-reste-vide": { version: 1, empreinte: [2599, -53400, -37548] },
  "reclamation-qui-enfle": { version: 1, empreinte: [23775, -38375, -76290] },
  "quai-dangereux": { version: 2, empreinte: [13284, -103953, -121721] },
  "reorganisation-qui-coince": { version: 1, empreinte: [27733, -73019, -14220] },
  "tresorerie-qui-fond": { version: 1, empreinte: [17882, -100612, -108642] },
  "agence-qui-demarre": { version: 1, empreinte: [3849, -39453, -28896] },
  "panne-qui-paralyse": { version: 1, empreinte: [-270744, -500080, -515282] },
  "collaborateur-qui-decroche": { version: 1, empreinte: [9372, -16154, -16427] },
  "indicateur-qui-ment": { version: 1, empreinte: [22950, -131528, -52909] },
  "appel-d-offres": { version: 1, empreinte: [21221, -145859, -88422] },
  "prix-qui-ne-passe-plus": { version: 1, empreinte: [30074, -88457, -119302] },
  "agenda-qui-deborde": { version: 1, empreinte: [22152, -78382, -125690] },
  "preavis-de-greve": { version: 1, empreinte: [3569, -151658, -119891] },
  "client-qui-s-en-va": { version: 1, empreinte: [32003, -124737, -65683] },
  "tournees-qui-debordent": { version: 1, empreinte: [8459, -118600, -88343] },
  "site-qui-ne-vend-pas": { version: 1, empreinte: [29643, -118024, -61578] },
  "talent-qui-veut-partir": { version: 1, empreinte: [25344, -80415, -105612] },
  "competences-qui-manquent": { version: 1, empreinte: [10125, -54973, -34895] },
  "facture-qui-flambe": { version: 1, empreinte: [10652, -60816, -58733] },
  "controle-qui-s-annonce": { version: 1, empreinte: [10974, -129939, -63038] },
  "fusion-des-agences": { version: 1, empreinte: [13162, -99234, -105430] },
  "nouveau-service": { version: 1, empreinte: [7809, -105529, -16000] },
  "equipe-dispersee": { version: 1, empreinte: [29572, -116493, -56961] },
  "cent-premiers-jours": { version: 1, empreinte: [45710, -92675, -37530] },
  "commande-a-prix-casse": { version: 1, empreinte: [19288, -33365, -7910] },
  "produit-deficitaire": { version: 1, empreinte: [4371, -66828, -28364] },
  "faire-ou-faire-faire": { version: 1, empreinte: [13695, -84967, -12395] },
  "seuil-qui-bouge": { version: 1, empreinte: [-6596, -44717, -25458] },
  "ecarts-du-budget": { version: 1, empreinte: [-36089, -122040, -91607] },
  "atelier-sature": { version: 1, empreinte: [20885, -107145, -36733] },
  "investissement-a-choisir": { version: 1, empreinte: [202225, 55, 0] },
  "croissance-a-financer": { version: 1, empreinte: [35366, -81635, -90590] },
  "louer-ou-acheter": { version: 1, empreinte: [6715, -45906, -21155] },
  "client-a-risque": { version: 1, empreinte: [8905, -79142, -91304] },
};

export const versionDuModele = (code: string): number => VERSIONS_DES_MODELES[code]?.version ?? 1;
