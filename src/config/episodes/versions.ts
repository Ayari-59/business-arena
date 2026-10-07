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
  "discounter-qui-arrive": { version: 1, empreinte: [-494458, -1896341, -838969] },
  "concurrent-a-racheter": { version: 1, empreinte: [187277, -1079182, -228333] },
  "marche-qui-s-ouvre": { version: 1, empreinte: [258676, 3267, -38267] },
  "fabricant-en-direct": { version: 1, empreinte: [-93145, -1671394, -1028736] },
  "projet-a-arreter": { version: 1, empreinte: [19659, -462014, -265421] },
  "reseau-a-redessiner": { version: 1, empreinte: [360039, -190698, -51721] },
  "pari-du-reemploi": { version: 1, empreinte: [187237, -568746, -25919] },
  "grand-compte-exclusif": { version: 1, empreinte: [277116, -17165, -84313] },
  "chambres-bradees": { version: 1, empreinte: [2151384, 1911616, 2063691] },
  "seminaire-qui-evince": { version: 1, empreinte: [1154473, 1111879, 1121998] },
  surreservation: { version: 1, empreinte: [912726, 833834, 841410] },
  "note-qui-chute": { version: 1, empreinte: [465686, 379244, 374805] },
  "ratio-matiere": { version: 1, empreinte: [302017, 250065, 285008] },
  intersaison: { version: 1, empreinte: [-362928, -494449, -412696] },
  "chambres-pas-pretes": { version: 1, empreinte: [7639, -67987, -38509] },
  "brigade-a-bout": { version: 1, empreinte: [121636, 65839, 80414] },
  "renovation-sans-fermer": { version: 1, empreinte: [369233, 244843, 262415] },
  "saisonniers-de-juillet": { version: 1, empreinte: [28326, -36932, -22861] },
  "postes-introuvables": { version: 1, empreinte: [966142, 343233, 530156] },
  "apprentis-qui-decrochent": { version: 1, empreinte: [115321, 86602, 105497] },
  "cuisine-centrale": { version: 1, empreinte: [4673, -83006, -28225] },
  "spa-a-financer": { version: 1, empreinte: [229187, -26075, 0] },
  "enseigne-a-la-porte": { version: 1, empreinte: [990102, -5118737, -298181] },
  "appels-d-offres-en-rafale": { version: 1, empreinte: [262641, 23717, 22180] },
  "client-qui-en-demande-plus": { version: 1, empreinte: [217461, 79916, 99476] },
  "livrable-refuse": { version: 1, empreinte: [35290, -17220, 9381] },
  "jours-non-factures": { version: 1, empreinte: [576905, 357254, 422178] },
  "forfait-trop-bas": { version: 1, empreinte: [58620, -99886, -40459] },
  "factures-qui-dorment": { version: 1, empreinte: [1389037, 53713, -205276] },
  "staffing-du-lundi": { version: 1, empreinte: [1000294, 831743, 777233] },
  "consultant-star": { version: 1, empreinte: [88301, -3923, 19175] },
  "promotion-refusee": { version: 1, empreinte: [263978, 151361, 191012] },
  "departs-a-deux-ans": { version: 1, empreinte: [364243, -548821, -358253] },
  "freelances-ou-embauches": { version: 1, empreinte: [3034701, 2526209, 2697139] },
  "practice-a-reorienter": { version: 1, empreinte: [106123, -190588, -39083] },
  "assistant-ia": { version: 1, empreinte: [795054, 523670, 528941] },
  "associe-qui-part": { version: 1, empreinte: [280762, -1306950, -188866] },
  "generaliste-ou-specialiste": { version: 1, empreinte: [330737, -2373876, -957875] },
  "lits-vides": { version: 1, empreinte: [733855, 597920, 642141] },
  "sorties-qui-bloquent": { version: 1, empreinte: [-35218, -216286, -129115] },
  "famille-qui-ecrit": { version: 1, empreinte: [-18758, -48289, -38243] },
  "interim-qui-flambe": { version: 1, empreinte: [22357, -602701, -631562] },
  "section-en-deficit": { version: 1, empreinte: [-168950, -389265, -386739] },
  "heure-a-domicile": { version: 1, empreinte: [-123102, -275531, -244396] },
  "chutes-la-nuit": { version: 1, empreinte: [-56779, -155209, -83488] },
  "dossier-de-soins": { version: 1, empreinte: [18215, -30250, -27608] },
  "postes-de-douze-heures": { version: 1, empreinte: [9135, -138353, -18122] },
  "absenteisme-qui-s-installe": { version: 1, empreinte: [29350, -132525, -87764] },
  "former-ses-soignants": { version: 1, empreinte: [245756, -33314, -98142] },
  "equipes-jour-et-nuit": { version: 1, empreinte: [8886, -31425, -13430] },
  "reconstruire-ou-regrouper": { version: 1, empreinte: [797479, -1629800, -1794974] },
  "association-a-reprendre": { version: 1, empreinte: [152667, -745233, -354980] },
  "virage-domiciliaire": { version: 1, empreinte: [898716, -925944, -473012] },
};

export const versionDuModele = (code: string): number => VERSIONS_DES_MODELES[code]?.version ?? 1;
