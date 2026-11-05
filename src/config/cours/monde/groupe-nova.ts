import { auCentime } from "./amortissement";
import { exerciceDe } from "./diagnostic-de-nova";
import { IMPOT_SUR_LES_SOCIETES } from "./exercice-de-nova";
import { PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE GROUPE NOVA, POUR L'INITIATION À LA CONSOLIDATION (BTS CG P2 2.7.1 et 2.7.2).
 *
 * Le chapitre « Initiation à la consolidation » et son cas le lisent. Décision du propriétaire
 * (novembre 2026, D4) : la filiale est une filiale de distribution de NOVA, créée pour le cours.
 *
 *   · NOVA DIFFUSION, une SAS créée le 2 janvier N + 1 au capital de 10 000 € (1 000 actions de 10 €),
 *     dont NOVA souscrit 80 % ; les 20 % qui restent sont à son directeur, qui y apporte son réseau de
 *     revendeurs. Elle achète des One à NOVA, au prix de NOVA, et les revend aux magasins de hi-fi.
 *     NOVA lui prête 12 000 € le 1er juillet N + 1, à 4 %, intérêts payés chaque 31 décembre.
 *   · LE CAS INDIRECT : en N + 2, NOVA DIFFUSION envisage de prendre 60 % d'AUDIO COMPTOIR, une
 *     boutique ; NOVA la contrôlerait alors par sa filiale, avec un pourcentage d'intérêts plus faible.
 *   · LES AUTRES LIENS DU TRI (hypothèses du cours, des situations à classer) : une coentreprise
 *     dirigée à deux, une participation de 30 % dans un bureau d'études, 5 % d'une coopérative
 *     d'achat.
 *
 * LE GROUPE DE DEUX SOCIÉTÉS (la limite du BTS) : NOVA consolide NOVA DIFFUSION au 31 décembre N + 1
 * par intégration globale. Les comptes de la filiale sont posés ci-dessous ; de NOVA, le chapitre ne
 * lit que son chiffre d'affaires de N + 1, celui du diagnostic de trois exercices (diagnostic-de-nova.ts),
 * dont les ventes à la filiale font partie. Les retraitements sont ceux du BTS : ventes et achats
 * réciproques, créances et dettes, prêt et emprunt, intérêts ; puis le partage des capitaux propres
 * de la filiale entre le groupe et les minoritaires, et l'élimination des titres. La filiale n'a pas
 * de stock en fin d'exercice : il n'y a pas de marge interne à éliminer (un retraitement au-delà du BTS).
 *
 * Le diagnostic de trois exercices ne reprend ni les titres de la filiale, ni le prêt, ni ses intérêts
 * (voir le rapport du chantier).
 */

/** LA FILIALE DE DISTRIBUTION (hypothèse du cours). */
export const NOVA_DIFFUSION = { nom: "NOVA DIFFUSION", forme: "SAS", creation: "2 janvier N + 1", actions: 1_000, nominal: 10 } as const;

/** La part de NOVA dans sa filiale : 800 actions sur 1 000, autant de droits de vote. */
export const PART_DE_NOVA = 0.8;

/** LE CAS INDIRECT (hypothèse du cours) : NOVA DIFFUSION prendrait 60 % d'AUDIO COMPTOIR en N + 2. */
export const AUDIO_COMPTOIR = { nom: "AUDIO COMPTOIR", partDeLaFiliale: 0.6 } as const;

/** LES ENCEINTES VENDUES À LA FILIALE EN N + 1 (hypothèse du cours) : 1 200 One au prix de NOVA, revendues 79 € hors taxes. */
export const VENTES_A_LA_FILIALE = { enceintes: 1_200, prixDeRevente: 79, enceintesDeLaDerniereLivraison: 100 } as const;

/** LES CHARGES DE LA FILIALE EN N + 1 (hypothèse du cours) : ses charges externes et son personnel. */
export const CHARGES_DE_LA_FILIALE = { externes: 8_500, personnel: 9_300 } as const;

/** LE PRÊT DE NOVA À SA FILIALE (hypothèse du cours) : 12 000 € le 1er juillet N + 1, à 4 %, intérêts payés le 31 décembre. */
export const PRET_A_LA_FILIALE = { montant: 12_000, taux: 0.04, mois: 6 } as const;

/** LES CRÉANCES DE LA FILIALE SUR SES CLIENTS au 31 décembre N + 1 (hypothèse du cours), toutes taxes comprises. */
export const CLIENTS_DE_LA_FILIALE = 15_000;

/** Les comptes de NOVA DIFFUSION en N + 1, et ce que la consolidation élimine. */
export function groupeNova() {
  const f = NOVA_DIFFUSION;
  const capital = f.actions * f.nominal;
  const v = VENTES_A_LA_FILIALE;
  const ventesReciproques = v.enceintes * PRIX_DE_L_ENCEINTE;
  const chiffreDAffairesDeLaFiliale = v.enceintes * v.prixDeRevente;
  const interets = auCentime((PRET_A_LA_FILIALE.montant * PRET_A_LA_FILIALE.taux * PRET_A_LA_FILIALE.mois) / 12);
  const avantImpot = auCentime(chiffreDAffairesDeLaFiliale - ventesReciproques - CHARGES_DE_LA_FILIALE.externes - CHARGES_DE_LA_FILIALE.personnel - interets);
  // Un bénéfice sous le plafond du taux réduit : la filiale, une PME, est imposée au taux réduit (les mêmes règles que NOVA).
  const impot = auCentime(Math.min(avantImpot, IMPOT_SUR_LES_SOCIETES.plafondDuTauxReduit) * IMPOT_SUR_LES_SOCIETES.tauxReduit);
  const resultat = auCentime(avantImpot - impot);
  // La dernière livraison de décembre n'est pas encore payée : la dette de la filiale, la créance de NOVA, toutes taxes comprises.
  const dettesReciproques = auCentime(v.enceintesDeLaDerniereLivraison * PRIX_DE_L_ENCEINTE * (1 + TAUX_DE_TVA));
  const passif = { capital, resultat, emprunt: PRET_A_LA_FILIALE.montant, fournisseurNova: dettesReciproques, impot };
  const totalDuBilan = auCentime(capital + resultat + PRET_A_LA_FILIALE.montant + dettesReciproques + impot);
  const titres = auCentime(capital * PART_DE_NOVA);
  const capitauxPropres = auCentime(capital + resultat);
  const chiffreDAffairesDeNova = exerciceDe("N+1").production;
  return {
    capital,
    titres,
    ventesReciproques,
    chiffreDAffairesDeLaFiliale,
    interets,
    avantImpot,
    impot,
    resultat,
    dettesReciproques,
    passif,
    clients: CLIENTS_DE_LA_FILIALE,
    banque: auCentime(totalDuBilan - CLIENTS_DE_LA_FILIALE),
    totalDuBilan,
    capitauxPropres,
    partDuGroupe: { capital: titres, resultat: auCentime(resultat * PART_DE_NOVA), total: auCentime(capitauxPropres * PART_DE_NOVA) },
    minoritaires: { capital: auCentime(capital - titres), resultat: auCentime(resultat - auCentime(resultat * PART_DE_NOVA)), total: auCentime(capitauxPropres - auCentime(capitauxPropres * PART_DE_NOVA)) },
    // Les titres face à la part du groupe dans les capitaux propres à l'entrée : la filiale est créée, l'écart est nul.
    ecartDAcquisition: auCentime(titres - capital * PART_DE_NOVA),
    chiffreDAffairesDeNova,
    chiffreDAffairesDuGroupe: auCentime(chiffreDAffairesDeNova + chiffreDAffairesDeLaFiliale - ventesReciproques),
  };
}

/**
 * LES POURCENTAGES, en direct puis en indirect. Le contrôle passe par une société que l'on contrôle :
 * NOVA contrôle AUDIO COMPTOIR à hauteur de ce que sa filiale en détient, si elle contrôle sa filiale
 * (plus de la moitié des droits de vote), et rien sinon. Les intérêts se multiplient le long de la
 * chaîne. Les parts s'expriment en fractions.
 */
export function pourcentages(partDeNova: number = PART_DE_NOVA, partDeLaFiliale: number = AUDIO_COMPTOIR.partDeLaFiliale) {
  const controleDeLaFiliale = partDeNova;
  const controleIndirect = partDeNova > 0.5 ? partDeLaFiliale : 0;
  const interetsIndirects = Math.round(partDeNova * partDeLaFiliale * 10_000) / 10_000;
  return { controleDeLaFiliale, controleIndirect, interetsIndirects, controleExclusif: controleIndirect > 0.5 };
}

/** Le laboratoire des pourcentages : les deux parts, en pour cent, de 40 % à 100 % par 5 points. */
export const PARTS_DU_LABORATOIRE = { min: 40, max: 100, pas: 5 } as const;

/**
 * LES MÉTHODES DE CONSOLIDATION, selon le contrôle. Le contrôle exclusif : l'intégration globale ; le
 * contrôle conjoint : l'intégration proportionnelle au règlement CRC 99-02, que vise le référentiel,
 * la mise en équivalence depuis le règlement ANC 2020-01 ; l'influence notable (20 % des droits de
 * vote au moins, présumée) : la mise en équivalence. // À VÉRIFIER : la méthode du contrôle conjoint au règlement ANC 2020-01, et sa date d'application (exercices ouverts depuis le 1er janvier 2021).
 */
export const SEUIL_DE_L_INFLUENCE_NOTABLE = 0.2;
