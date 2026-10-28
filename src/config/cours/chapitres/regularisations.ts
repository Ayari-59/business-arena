import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { JOURS_DU_MOIS, joursCompris, type DateDuCours } from "../monde/amortissement";
import { avecLaTva, chargeConstateeDAvance, cloture, interetsDuPlacement, type CodeDeTravail } from "../monde/cloture";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : RÉGULARISATIONS DE FIN D'EXERCICE (comptabilité générale, palier 4 ; BTS CG, DCG UE9,
 * BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le premier
 * exercice de NOVA a une fiche figée (monde/exercice-de-nova.ts) et sa clôture se calcule par le
 * modèle du cours (monde/cloture.ts, `cloture`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : au 31 décembre, rattacher à l'exercice ce qui lui appartient, et à lui seulement. Quatre
 * régularisations sur pièces, celles de la fiche : la part de la prime d'assurance qui couvre N+1
 * (charge constatée d'avance), les jeux de composants livrés par Composants Express dont la facture
 * arrive le 8 janvier (facture non parvenue, TVA au 44586), la commande urgente de CampusTech livrée
 * le 30 décembre et facturée le 4 janvier (facture à établir, TVA au 44587), les 120 enceintes de la
 * facture du 20 décembre livrées le 8 janvier (produit constaté d'avance). Puis un produit à recevoir
 * sans pièce du tout : les intérêts courus du compte à terme. Enfin l'extourne, et ce que N+1 garde.
 *
 * CE QUE L'AUDIT A CORRIGÉ : le résultat « sur pièces » de 118 761,67 € était fabriqué pour retomber
 * sur le résultat de l'arène. Il est maintenant le résultat de la clôture du modèle avant ces cinq
 * travaux (la balance, puis la dotation, le stock, la dépréciation, la provision et les intérêts
 * courus de l'emprunt), 121 313,38 € ; régularisé, il redonne le résultat avant impôt de la fiche,
 * 99 967,96 €. Le paiement de la prime n'est plus à passer : il est dans la balance de la fiche.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, part-d-avance, charge-d-avance, facture-non-parvenue (la formule au repère ou
 *     dans la question, qui nomme les montants) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-prime
 *     puis le-mois-de-souscription (un curseur sur le mois où la prime est souscrite : la charge
 *     constatée d'avance face à la charge de l'exercice) avant part-d-avance ; predire-l-effet-net
 *     puis le-laboratoire-des-pieces (le mois de souscription, les livraisons de CampusTech et la date
 *     de la facture du fournisseur : un effet net nul n'est pas une écriture en moins) avant resultat ;
 *   · autonome : facture-a-etablir, facture-d-avance, produit-d-avance, interets-du-placement,
 *     resultat, extourne, extourne-assurance (ni montant ni compte donnés ; les indices et la
 *     correction montrent le chemin) ;
 *   · expert : ce-que-garde-n-plus-1 (toutes les extournes, puis les pièces de janvier : deux calculs
 *     enchaînés), a-rebours (retrouver la nouvelle prime à partir de la charge d'assurance de N+1,
 *     extourne comprise), la-facture-oubliee (une critique : le dirigeant qui veut laisser la facture
 *     à N+1).
 *
 * Pas de `vue` du compte de résultat ni de balance d'ouverture : le plan de comptes du cours
 * (pedagogy/cours/plan-comptable.ts) n'a ni le compte à terme (508, 5088) ni ses revenus (764), et le
 * compte de résultat qu'il dresse les laisserait de côté. Les chiffres viennent du modèle.
 */

/** Les régularisations de ce chapitre, telles que le modèle de la clôture les nomme. */
export const CODES_DES_REGULARISATIONS: readonly CodeDeTravail[] = ["chargeConstateeDAvance", "factureNonParvenue", "factureAEtablir", "produitConstateDAvance", "interetsDuPlacement"];

/** Les entreprises du chapitre : celles qui ont un exercice dans le monde du cours, NOVA seule. */
export const ENTREPRISES_DES_REGULARISATIONS: readonly string[] = Object.keys(EXERCICES_DU_COURS);

/** Les bornes du curseur du mois de souscription : de janvier à décembre, le 1er du mois. */
export const MOIS_DU_CURSEUR = { min: 1, max: 12 } as const;

/** Le pas des enceintes dans le laboratoire des pièces. */
export const PAS_DES_ENCEINTES = 10;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : au 31 décembre N+1, après l'extourne et le renouvellement
 * du contrat le 1er octobre N+1 à une prime plus chère, la charge d'assurance de N+1 vaut 6 150 €.
 */
export const CHARGE_D_ASSURANCE_DE_N_PLUS_1 = 6_150;

/**
 * Les jeux de composants livrés par le grossiste le 18 décembre, et leur prix : ceux de la fiche
 * (monde/exercice-de-nova.ts, `COMPOSANTS_DE_DECEMBRE`, l'entrée du 18 décembre).
 */
const livraisonDuGrossiste = (f: FicheDeLExercice) => f.composantsDeDecembre.mouvements.find((m) => m.sens === "entree" && m.date.jour === f.factureNonParvenue.livraison.jour)!;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
/** Un terme d'une somme : « + 4 500 € » ou « − 34 500 € ». */
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;
/** « 1er octobre », « 1er juillet » : la date de souscription d'un mois. */
const premierDu = (m: number) => `1er ${MOIS[m - 1]}`;

/** La fiche de l'exercice du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** La prime de la fiche, souscrite le 1er d'un mois donné : sa part dans l'exercice et sa part d'avance. */
export function primeSouscriteLe(f: FicheDeLExercice, mois: number) {
  const a = f.assurance;
  const debut: DateDuCours = { jour: 1, mois };
  const cca = chargeConstateeDAvance(a.prime, debut, a.moisCouverts, f.cloture);
  return { mois, moisDansLExercice: cca.joursDansLExercice / JOURS_DU_MOIS, moisApres: cca.moisApres, chargeDeLExercice: cca.chargeDeLExercice, chargeConstateeDAvance: cca.montant };
}

/** Les régularisations de l'exercice : tout ce que le chapitre et son cas demandent. */
export function regularisationsDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = cloture(f);
  const sans = cloture(f, { travauxOublies: CODES_DES_REGULARISATIONS });
  const a = f.assurance;
  const prime = primeSouscriteLe(f, a.date.mois);
  const grossiste = livraisonDuGrossiste(f);
  const fnp = avecLaTva(f.factureNonParvenue.ht, f.tauxDeTva);
  const urgente = f.commandeUrgenteDeDecembre.enceintes;
  const fae = avecLaTva(urgente * f.prixDeLEnceinte, f.tauxDeTva);
  const facturees = f.campustech.enceintesParFacture;
  const enJanvier = f.livraisonDiffereeDeDecembre.enceintes;
  const factureDeDecembre = avecLaTva(facturees * f.prixDeLEnceinte, f.tauxDeTva);
  const pca = auCentime(enJanvier * f.prixDeLEnceinte);
  const p = f.placement;
  const joursDuPlacement = joursCompris(p.date, f.cloture);
  const placement = interetsDuPlacement(p.montant, p.tauxAnnuel, p.date, f.cloture);
  const aLEcheance = auCentime((p.montant * p.tauxAnnuel * p.dureeMois) / 12);
  const effetSurPieces = auCentime(prime.chargeConstateeDAvance + fae.ht - fnp.ht - pca);
  const effetTotal = auCentime(effetSurPieces + placement);
  // Ce que N+1 garde : les extournes renversent l'effet de N, puis les pièces de janvier arrivent.
  const extournes = auCentime(-effetTotal);
  const piecesDeJanvier = auCentime(aLEcheance - fnp.ht + fae.ht);
  const resteDansNPlus1 = auCentime(extournes + piecesDeJanvier);
  // Le calcul à rebours : charge de N+1 = extourne de la charge constatée d'avance + part de la nouvelle prime.
  const partDeLaNouvellePrime = auCentime(CHARGE_D_ASSURANCE_DE_N_PLUS_1 - prime.chargeConstateeDAvance);
  const nouvellePrime = auCentime((partDeLaNouvellePrime * a.moisCouverts) / prime.moisDansLExercice);
  const ccaDeNPlus1 = chargeConstateeDAvance(nouvellePrime, a.date, a.moisCouverts, f.cloture).montant;
  // Le curseur : le premier mois de souscription où la part de N+1 égale ou dépasse celle de N.
  const moisDEquilibre = Array.from({ length: 12 }, (_, i) => primeSouscriteLe(f, i + 1)).find((x) => x.chargeConstateeDAvance >= x.chargeDeLExercice)!.mois;
  return {
    f,
    entreprise: f.entreprise,
    resultatDeLaBalance: k.resultatAvantInventaire,
    autresTravaux: k.travaux.filter((t) => !CODES_DES_REGULARISATIONS.includes(t.code)),
    avant: sans.resultatAvantImpot,
    apres: k.resultatAvantImpot,
    prime,
    parMois: auCentime(a.prime / a.moisCouverts),
    jeux: grossiste.quantite,
    prixDuJeu: grossiste.prixUnitaire!,
    fnp,
    urgente,
    fae,
    facturees,
    enJanvier,
    livreesEnDecembre: facturees - enJanvier,
    factureDeDecembre,
    pca,
    joursDuPlacement,
    placement,
    aLEcheance,
    interetsDeNPlus1: auCentime(aLEcheance - placement),
    effetSurPieces,
    effetTotal,
    extournes,
    piecesDeJanvier,
    resteDansNPlus1,
    partDeLaNouvellePrime,
    nouvellePrime,
    ccaDeNPlus1,
    hausseDeLaPrime: auCentime(((nouvellePrime - a.prime) / a.prime) * 100),
    moisDEquilibre,
  };
}

export type RegularisationsDeNova = ReturnType<typeof regularisationsDeNova>;

/** Une position du laboratoire des pièces. */
export interface PositionDesPieces {
  /** Le mois de souscription de la prime (1 pour janvier). */
  mois: number;
  /** Les enceintes de la facture du 20 décembre livrées en janvier. */
  pca: number;
  /** Les enceintes de la commande urgente livrées le 30 décembre, facturées en janvier. */
  fae: number;
  /** 1 : la facture du grossiste arrive le 8 janvier ; 0 : le 28 décembre. */
  fnp: number;
}

/**
 * LE LABORATOIRE DES PIÈCES : les quatre régularisations sur pièces pour un mois de souscription, des
 * livraisons de décembre et une date de facture du fournisseur quelconques. Le résultat régularisé
 * suit les faits (la couverture, les livraisons) ; la date de la facture ne change que les pièces.
 */
export function laboratoireDesPieces(x: RegularisationsDeNova, p: PositionDesPieces) {
  const prix = x.f.prixDeLEnceinte;
  const cca = primeSouscriteLe(x.f, p.mois).chargeConstateeDAvance;
  const fnp = p.fnp === 1 ? x.fnp.ht : 0;
  const fae = auCentime(p.fae * prix);
  const pca = auCentime(p.pca * prix);
  const effet = auCentime(cca + fae - fnp - pca);
  const regularise = auCentime(x.apres + (cca - x.prime.chargeConstateeDAvance) + (fae - x.fae.ht) - (pca - x.pca));
  return { cca, fnp, fae, pca, effet, regularise, aPasser: [cca, fnp, fae, pca].filter((m) => m !== 0).length };
}

const positionDe = (p: Readonly<Record<string, number>>): PositionDesPieces => ({ mois: p.mois!, pca: p.pca!, fae: p.fae!, fnp: p.fnp! });
const departDe = (x: RegularisationsDeNova): PositionDesPieces => ({ mois: x.f.assurance.date.mois, pca: x.enJanvier, fae: x.urgente, fnp: 1 });

/** Où en est la clôture quand le chapitre s'ouvre : la balance, puis les travaux déjà passés. */
function tableauDeLaCloture(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = regularisationsDeNova(c);
  return {
    titre: `La clôture ${dE(x.entreprise)} au 31 décembre, avant les régularisations`,
    colonnes: ["Effet sur le résultat"],
    lignes: [
      { libelle: "Résultat de la balance avant inventaire", valeurs: [eur(x.resultatDeLaBalance)] },
      ...x.autresTravaux.map((t) => ({ libelle: majuscule(t.libelle), valeurs: [eur(t.effetSurLeResultat)] })),
      { libelle: "Résultat avant impôt, avant les régularisations", valeurs: [eur(x.avant)] },
    ],
  };
}

export const REGULARISATIONS: Chapitre = {
  code: "regularisations-de-fin-d-exercice",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Régularisations de fin d'exercice",
  accroche:
    "Une assurance payée pour un an, des composants livrés sans facture, une vente faite et pas encore facturée, des enceintes facturées et pas encore livrées, des intérêts qui courent sans pièce : au 31 décembre, chaque exercice ne garde que ce qui lui appartient.",
  objectifs: [
    "Appliquer le principe d'indépendance des exercices",
    "Constater une charge payée d'avance et un produit facturé d'avance",
    "Rattacher à l'exercice un achat dont la facture n'est pas arrivée, une vente pas encore facturée, avec leur TVA",
    "Rattacher un produit à recevoir sans pièce : les intérêts courus d'un placement",
    "Mesurer l'effet des régularisations sur le résultat, puis les extourner et lire ce que garde N+1",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_REGULARISATIONS,
    pourquoi:
      "les régularisations se passent sur les pièces de décembre d'un exercice tenu de la création à la clôture, celui de NOVA dans la simulation du cours : une seule NOVA, la même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chaque exercice ce qui lui appartient",
      notions: ["income_statement"],
      tableau: tableauDeLaCloture,
      texte: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, au premier exercice ${dE(x.entreprise)}, du 1er janvier au 31 décembre N. Vous retrouvez la clôture là où « La clôture » et « Dépréciations et provisions » l'ont laissée : la balance avant inventaire, puis la dotation, le stock, la créance de Sonora, la provision et les intérêts courus de l'emprunt. Le résultat avant impôt est alors de ${eur(x.avant)}.`,
          `Or une pièce ne tombe pas toujours dans l'exercice de ce qu'elle concerne. Une facture arrive en janvier pour des composants livrés en décembre ; une prime se paie en octobre pour ${qte(x.f.assurance.moisCouverts)} mois. La règle est l'indépendance des exercices : chaque exercice porte les charges et les produits qui le concernent, ni plus ni moins, quelle que soit la date de la pièce.`,
          `Ce que la simulation suppose : des mois de 30 jours, le jour de départ et le jour d'arrivée comptés tous les deux ; une enceinte vendue ${eur(x.f.prixDeLEnceinte)} hors taxes, avec ${qte(x.f.tauxDeTva * 100)} % de TVA collectée à la facture ; une assurance sans TVA ; des intérêts du compte à terme versés à son échéance, dans un an.`,
        ];
      },
      repere: () =>
        "Payé ou facturé d'avance, pas encore consommé ni livré : on le retire de l'exercice (constaté d'avance). Consommé ou livré, sans pièce encore : on l'ajoute (à payer, à recevoir).",
    },
    {
      id: "predire-la-prime",
      type: "choix",
      titre: "Pariez sur la part d'avance",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Avant de calculer, pariez. ${x.entreprise} a payé ${eur(x.f.assurance.prime)} le 1er octobre pour ${qte(x.f.assurance.moisCouverts)} mois d'assurance. Si elle avait souscrit le 1er juillet, la part de la prime qui couvre N+1 serait…`;
      },
      options: (c) => {
        const x = regularisationsDeNova(c);
        const juillet = primeSouscriteLe(x.f, 7).chargeConstateeDAvance;
        const voir = "Déplacez le mois de souscription à l'étape suivante : le curseur montre comment la prime se partage entre les deux exercices.";
        return [
          { texte: "Plus petite : plus de mois de couverture tombent dans N", juste: juillet < x.prime.chargeConstateeDAvance, retour: `Bon pari. ${voir}` },
          { texte: "La même : la prime ne change pas", juste: juillet === x.prime.chargeConstateeDAvance, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus grande : le contrat commence plus tôt", juste: juillet > x.prime.chargeConstateeDAvance, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-mois-de-souscription",
      type: "curseur",
      titre: "Déplacez la souscription",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Faites souscrire la prime de ${eur(x.f.assurance.prime)} le 1er de chaque mois, de janvier à décembre. Une droite donne la part de la prime qui couvre N+1, l'autre la charge que garde l'exercice N. Placez le curseur sur le premier mois où la part de N+1 égale ou dépasse celle de N, puis validez.`;
      },
      grandeur: () => ({ libelle: "Mois de la souscription (1 pour janvier)", unite: "mois" }),
      cible: (c) => ({ attendu: regularisationsDeNova(c).moisDEquilibre, min: MOIS_DU_CURSEUR.min, max: MOIS_DU_CURSEUR.max }),
      zones: ["N+1 porte au moins autant que N", "N porte plus que N+1"],
      rates: () => ({
        dessous: "À ce mois, l'exercice N garde encore la plus grande part de la prime : souscrivez plus tard.",
        dessus: "Plus tôt, la part de N+1 égale déjà celle de N : cherchez le premier mois.",
      }),
      montrer: "Montrer le mois",
      lecture: (c, m) => {
        const y = primeSouscriteLe(ficheDe(c), m);
        return [
          { libelle: "Mois de couverture dans N", montant: y.moisDansLExercice },
          { libelle: "Mois de couverture dans N+1", montant: y.moisApres },
          { libelle: "Charge d'assurance de N", montant: y.chargeDeLExercice },
          { libelle: "Charge constatée d'avance", montant: y.chargeConstateeDAvance, fort: true },
        ];
      },
      droites: (c) => {
        const a = ficheDe(c).assurance;
        return {
          produit: (m) => (a.prime * (m - 1)) / a.moisCouverts,
          cout: (m) => (a.prime * (a.moisCouverts + 1 - m)) / a.moisCouverts,
          libelles: ["Part de la prime qui couvre N+1", "Part de la prime que garde N"],
        };
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        const e = primeSouscriteLe(x.f, x.moisDEquilibre);
        return [
          `Souscrite le ${premierDu(x.moisDEquilibre)}, la prime se partage à égalité : ${eur(e.chargeDeLExercice)} pour N, ${eur(e.chargeConstateeDAvance)} pour N+1. Chaque mois de retard fait passer ${eur(x.parMois)} de N à N+1 : la part d'avance ne dépend que des mois de couverture qui tombent après le 31 décembre.`,
          `Souscrite le 1er octobre, comme dans la fiche, la prime ne couvre que ${qte(x.prime.moisDansLExercice)} mois de N : la charge constatée d'avance vaut ${eur(x.prime.chargeConstateeDAvance)}. C'est le calcul de l'étape suivante.`,
        ];
      },
    },
    {
      id: "part-d-avance",
      type: "montants",
      titre: "La part de N+1",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `La prime de ${eur(x.f.assurance.prime)} couvre ${qte(x.f.assurance.moisCouverts)} mois à partir du 1er octobre. Comptez les mois de couverture qui tombent dans N+1, puis calculez la charge constatée d'avance (prime × mois de N+1 ÷ ${qte(x.f.assurance.moisCouverts)}) et la charge que garde l'exercice.`;
      },
      champs: (c) => {
        const x = regularisationsDeNova(c);
        const a = x.f.assurance;
        return [
          { libelle: "Mois de couverture dans N+1", attendu: x.prime.moisApres, calcul: `de janvier à septembre N+1 : ${qte(x.prime.moisApres)} mois`, tolerance: 0 },
          { libelle: "Charge constatée d'avance", attendu: x.prime.chargeConstateeDAvance, calcul: `${eur(a.prime)} × ${qte(x.prime.moisApres)} ÷ ${qte(a.moisCouverts)} = ${eur(x.prime.chargeConstateeDAvance)}` },
          { libelle: "Charge d'assurance de l'exercice", attendu: x.prime.chargeDeLExercice, calcul: `${eur(a.prime)} − ${eur(x.prime.chargeConstateeDAvance)} = ${eur(x.prime.chargeDeLExercice)}` },
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `L'exercice ne consomme que ${qte(x.prime.moisDansLExercice)} mois de couverture : ${eur(x.prime.chargeDeLExercice)}. Les ${eur(x.prime.chargeConstateeDAvance)} restants sont payés et pas encore consommés : une avance que l'assureur rendra en couverture l'an prochain.`,
        ];
      },
    },
    {
      id: "charge-d-avance",
      type: "ecriture",
      titre: "La charge constatée d'avance",
      notions: ["income_statement", "balance_sheet"],
      evenement: (c) => {
        const x = regularisationsDeNova(c);
        return `La prime, ${eur(x.f.assurance.prime)}, est déjà au compte 616 de la balance : elle a été prélevée le 1er octobre. Au 31 décembre, retirez de l'exercice la part qui couvre N+1 : ${eur(x.prime.chargeConstateeDAvance)}.`;
      },
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Charge constatée d'avance : assurance",
          lignes: [
            { role: "la charge constatée d'avance", compte: "486", sens: "debit", montant: x.prime.chargeConstateeDAvance, indice: "la part de la prime qui couvre N+1" },
            { role: "la prime d'assurance, diminuée", compte: "616", sens: "credit", montant: x.prime.chargeConstateeDAvance, indice: "la part de la prime qui couvre N+1" },
          ],
        };
      },
      indices: () => [
        "La charge diminue : le compte 616 passe au crédit.",
        "En face, un actif : ce qui est payé et pas encore consommé, les charges constatées d'avance, 486.",
      ],
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [`L'exercice ne garde que ${eur(x.prime.chargeDeLExercice)} d'assurance ; le résultat monte de ${eur(x.prime.chargeConstateeDAvance)}. Le compte 486 reste à l'actif jusqu'au 1er janvier.`];
      },
    },
    {
      id: "facture-non-parvenue",
      type: "ecriture",
      titre: "Des composants sans facture",
      notions: ["income_statement", "vat_payable", "stock"],
      evenement: (c) => {
        const x = regularisationsDeNova(c);
        const n = x.f.factureNonParvenue;
        return `Le 18 décembre, ${n.fournisseur} a livré ${qte(x.jeux)} jeux de composants à ${eur(x.prixDuJeu)} : ${eur(n.ht)} hors taxes, TVA à ${qte(x.f.tauxDeTva * 100)} %, soit ${eur(x.fnp.tva)} de TVA et ${eur(x.fnp.ttc)} à payer. La facture n'arrivera que le 8 janvier. Rattachez l'achat à l'exercice.`;
      },
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        return {
          date: "31 décembre",
          libelle: `Facture non parvenue, ${x.f.factureNonParvenue.fournisseur}`,
          lignes: [
            { role: "l'achat de l'exercice", compte: "601", acceptes: ["602"], sens: "debit", montant: x.fnp.ht, indice: "le montant hors taxes de la livraison" },
            { role: "la TVA à récupérer quand la facture arrivera", compte: "44586", sens: "debit", montant: x.fnp.tva, indice: "la TVA de la livraison" },
            { role: "la dette envers le fournisseur, sans facture", compte: "408", sens: "credit", montant: x.fnp.ttc, indice: "le montant TVA comprise de la livraison" },
          ],
        };
      },
      indices: () => [
        "L'achat au débit, comme s'il était facturé ; la TVA aussi, mais sur le compte des factures non parvenues, 44586 : elle ne se déduira qu'avec la facture.",
        "Au crédit, pas le compte 401 : une dette sans facture va au 408, fournisseurs, factures non parvenues.",
      ],
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `Les ${eur(x.fnp.ht)} sont une charge de l'exercice : les jeux ont servi aux enceintes de décembre, et ceux qui restent sont comptés dans le stock final de « La clôture ». Sans cette écriture, le stock compterait des composants dont l'achat manque.`,
        ];
      },
    },
    {
      id: "facture-a-etablir",
      type: "ecriture",
      titre: "Une vente pas encore facturée",
      notions: ["income_statement", "vat_payable"],
      evenement: (c) => {
        const x = regularisationsDeNova(c);
        return `Le 29 décembre, CampusTech a commandé en urgence ${qte(x.urgente)} enceintes pour équiper un amphithéâtre, au prix habituel. ${x.entreprise} les a livrées le 30 décembre ; la facture partira le 4 janvier. Rattachez la vente à l'exercice.`;
      },
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Facture à établir, CampusTech",
          lignes: [
            { role: "la créance sur le client, pas encore facturée", compte: "418", sens: "debit", montant: x.fae.ttc, indice: "le montant TVA comprise de la commande" },
            { role: "la vente de l'exercice", compte: "701", acceptes: [], sens: "credit", montant: x.fae.ht, indice: "le montant hors taxes de la commande" },
            { role: "la TVA à collecter quand la facture partira", compte: "44587", sens: "credit", montant: x.fae.tva, indice: "la TVA de la commande" },
          ],
        };
      },
      indices: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `Le miroir de la facture non parvenue : ${qte(x.urgente)} enceintes à ${eur(x.f.prixDeLEnceinte)} hors taxes en ventes, au crédit, et leur TVA sur le compte des factures à établir, 44587.`,
          "Au débit, pas le compte 411 : une créance sans facture va au 418, clients, factures à établir, pour le montant TVA comprise.",
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `${qte(x.urgente)} × ${eur(x.f.prixDeLEnceinte)} = ${eur(x.fae.ht)} de ventes, ${eur(x.fae.tva)} de TVA, ${eur(x.fae.ttc)} à recevoir. La vente appartient à l'exercice où ${x.entreprise} a livré, décembre : la date de la facture n'y change rien.`,
        ];
      },
    },
    {
      id: "facture-d-avance",
      type: "choix",
      titre: "Une facture trop tôt",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Le 20 décembre, comme chaque mois, CampusTech a reçu sa facture : ${qte(x.facturees)} enceintes, ${eur(x.factureDeDecembre.ht)} hors taxes, passés en ventes. À sa demande, ${qte(x.livreesEnDecembre)} ont été livrées avant les fêtes ; les ${qte(x.enJanvier)} autres le seront le 8 janvier, fabriquées en janvier. Que fait le comptable au 31 décembre ?`;
      },
      options: (c) => {
        const x = regularisationsDeNova(c);
        return [
          {
            texte: `Il retire de l'exercice la part livrée en janvier, ${eur(x.pca)} hors taxes`,
            juste: true,
            retour: `C'est cela : ${qte(x.enJanvier)} × ${eur(x.f.prixDeLEnceinte)} = ${eur(x.pca)}, un produit constaté d'avance. Une vente appartient à l'exercice où l'on livre. La TVA, elle, a été collectée à la facture et reste due.`,
          },
          {
            texte: "Rien : la facture est envoyée, la vente est faite",
            juste: false,
            retour: `Facturer n'est pas vendre. Les ${qte(x.enJanvier)} enceintes livrées en janvier sont une vente de N+1 : les garder ici gonfle le résultat de N de ${eur(x.pca)}.`,
          },
          {
            texte: `Il retire ${eur(auCentime(x.pca * (1 + x.f.tauxDeTva)))}, la part livrée en janvier TVA comprise`,
            juste: false,
            retour: `Non : la régularisation corrige les ventes, qui sont hors taxes. La TVA de la facture a été collectée le 20 décembre et reste due à l'État : on ne retire que ${eur(x.pca)}.`,
          },
          {
            texte: "Il annule toute la facture, et la repassera en janvier",
            juste: false,
            retour: `Les ${qte(x.livreesEnDecembre)} enceintes livrées en décembre sont bien une vente de l'exercice. On ne retire que ce qui sera livré en janvier.`,
          },
        ];
      },
    },
    {
      id: "produit-d-avance",
      type: "ecriture",
      titre: "Le produit constaté d'avance",
      notions: ["income_statement", "balance_sheet"],
      evenement: () => "Retirez de l'exercice la part de la facture du 20 décembre livrée en janvier.",
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Produit constaté d'avance, CampusTech",
          lignes: [
            { role: "la vente, diminuée", compte: "701", acceptes: [], sens: "debit", montant: x.pca, indice: "la part livrée en janvier, hors taxes" },
            { role: "le produit constaté d'avance", compte: "487", sens: "credit", montant: x.pca, indice: "la part livrée en janvier, hors taxes" },
          ],
        };
      },
      indices: () => [
        "Le miroir de la charge constatée d'avance : la vente diminue, au débit.",
        "En face, au passif, les produits constatés d'avance, 487. Hors taxes : la TVA de la facture reste due.",
      ],
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `L'exercice ne garde que les ${qte(x.livreesEnDecembre)} enceintes livrées en décembre. ${x.entreprise} doit encore ${qte(x.enJanvier)} enceintes au client, qui a sa facture : c'est une dette, au passif, que la livraison du 8 janvier éteindra.`,
        ];
      },
    },
    {
      id: "interets-du-placement",
      type: "ecriture",
      titre: "Des intérêts sans pièce",
      notions: ["income_statement", "net_treasury"],
      evenement: (c) => {
        const x = regularisationsDeNova(c);
        const p = x.f.placement;
        return `Le 6 janvier, ${x.entreprise} a placé ${eur(p.montant)} sur un compte à terme de ${qte(p.dureeMois)} mois à ${qte(p.tauxAnnuel * 100)} % l'an ; la banque versera les intérêts à l'échéance, le 6 janvier N+1. Aucune pièce n'arrivera avant. Rattachez à l'exercice les intérêts qui ont couru.`;
      },
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        const p = x.f.placement;
        return {
          date: "31 décembre",
          libelle: "Intérêts courus du compte à terme, à recevoir",
          lignes: [
            { role: "les intérêts courus, à recevoir", compte: p.compteDesInteretsCourus, sens: "debit", montant: x.placement, indice: "les intérêts du 6 janvier au 31 décembre" },
            { role: "le produit financier de l'exercice", compte: p.compteDeProduit, sens: "credit", montant: x.placement, indice: "les intérêts du 6 janvier au 31 décembre" },
          ],
        };
      },
      indices: (c) => {
        const x = regularisationsDeNova(c);
        const p = x.f.placement;
        return [
          `Un produit à recevoir : ${eur(p.montant)} × ${qte(p.tauxAnnuel * 100)} % × ${qte(x.joursDuPlacement)} ÷ 360, du 6 janvier au 31 décembre, jours compris, en mois de 30 jours.`,
          `Au débit, les intérêts courus sur le placement, ${p.compteDesInteretsCourus} ; au crédit, les revenus des valeurs mobilières de placement, ${p.compteDeProduit}. Pas de TVA sur des intérêts.`,
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `${qte(x.joursDuPlacement)} jours d'intérêts ont couru dans l'exercice : ${eur(x.placement)}. Ils sont acquis, même s'ils ne seront versés qu'en janvier : un produit à recevoir, rangé à l'actif avec le placement. Les intérêts courus de l'emprunt, passés à la clôture, sont leur miroir : une charge à payer.`,
        ];
      },
    },
    {
      id: "predire-l-effet-net",
      type: "choix",
      titre: "Pariez sur l'effet net",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Avant de compter, pariez. Deux des quatre régularisations sur pièces font monter le résultat (la charge constatée d'avance, ${eur(x.prime.chargeConstateeDAvance)}, et la facture à établir, ${eur(x.fae.ht)}), deux le font baisser. Ensemble, elles feront…`;
      },
      options: (c) => {
        const x = regularisationsDeNova(c);
        const voir = "Le laboratoire suivant chiffre chaque régularisation, et ce qui fait pencher leur somme.";
        return [
          { texte: "Baisser le résultat", juste: x.effetSurPieces < 0, retour: `Bon pari. ${voir}` },
          { texte: "Un effet nul : elles se compensent", juste: x.effetSurPieces === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monter le résultat", juste: x.effetSurPieces > 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-pieces",
      type: "simulation",
      titre: "Le laboratoire des pièces",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Changez les faits de décembre : le mois où la prime est souscrite, les enceintes de la facture du 20 décembre livrées en janvier, celles de la commande urgente livrées avant la clôture, et le jour où arrive la facture de ${x.f.factureNonParvenue.fournisseur}. Le tableau suit chaque régularisation, en effet sur le résultat. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = regularisationsDeNova(c);
        const d = departDe(x);
        return [
          { code: "mois", libelle: "Mois de souscription de la prime", unite: "mois", min: MOIS_DU_CURSEUR.min, max: MOIS_DU_CURSEUR.max, pas: 1, depart: d.mois },
          { code: "pca", libelle: "Enceintes facturées le 20 décembre, livrées en janvier", unite: "enceintes", min: 0, max: x.facturees, pas: PAS_DES_ENCEINTES, depart: d.pca },
          { code: "fae", libelle: "Enceintes de la commande urgente livrées le 30 décembre", unite: "enceintes", min: 0, max: x.urgente, pas: PAS_DES_ENCEINTES, depart: d.fae },
          {
            code: "fnp",
            libelle: `Facture de ${x.f.factureNonParvenue.fournisseur}`,
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.fnp,
            choix: [
              { valeur: 1, libelle: "reçue le 8 janvier" },
              { valeur: 0, libelle: "reçue le 28 décembre" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = regularisationsDeNova(c);
        const l = laboratoireDesPieces(x, positionDe(p));
        const d = laboratoireDesPieces(x, departDe(x));
        return [
          { libelle: "Charge constatée d'avance (assurance)", montant: l.cca, reference: d.cca, effet: true },
          { libelle: "Facture non parvenue (composants)", montant: -l.fnp, reference: -d.fnp, effet: true },
          { libelle: "Facture à établir (CampusTech)", montant: l.fae, reference: d.fae, effet: true },
          { libelle: "Produit constaté d'avance (CampusTech)", montant: -l.pca, reference: -d.pca, effet: true },
          { libelle: "Effet net des quatre régularisations", montant: l.effet, reference: d.effet, effet: true, fort: true },
          { libelle: "Régularisations à passer", montant: l.aPasser, reference: d.aPasser, unite: "écritures" },
          { libelle: "Résultat avant impôt, régularisé", montant: l.regularise, reference: d.regularise },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      defi: (c) => {
        const x = regularisationsDeNova(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDesPieces(x, positionDe(p));
        return {
          consigne: "Obtenez un effet net nul des quatre régularisations, alors qu'il en reste au moins deux à passer.",
          atteint: (p) => {
            const l = lire(p);
            return l.effet === 0 && l.aPasser >= 2;
          },
          indice: (p) => {
            const l = lire(p);
            if (l.fnp !== 0) return `La facture non parvenue retire ${eur(l.fnp)} à elle seule : aucune autre régularisation ne peut la compenser. Que se passe-t-il si la facture arrive avant la clôture ?`;
            if (l.effet === 0) return "L'effet net est nul, mais il ne reste pas deux régularisations à passer : gardez des livraisons à cheval sur les deux exercices.";
            if (l.cca !== 0) return `La charge constatée d'avance, ${eur(l.cca)}, ne se compense pas en enceintes à ${eur(x.f.prixDeLEnceinte)} : souscrivez la prime au 1er janvier.`;
            return `L'effet net vaut ${eur(l.effet)} : il faut autant d'enceintes livrées sans facture que d'enceintes facturées sans livraison.`;
          },
          solution: { mois: MOIS_DU_CURSEUR.min, pca: x.enJanvier, fae: x.enJanvier, fnp: 0 },
        };
      },
      explication: (c, p) => {
        const x = regularisationsDeNova(c);
        const l = laboratoireDesPieces(x, positionDe(p));
        const d = laboratoireDesPieces(x, departDe(x));
        return [
          `L'effet net est nul, et pourtant ${qte(l.aPasser)} régularisations restent à passer : ${eur(l.fae)} de ventes à ajouter, ${eur(l.pca)} à retirer. Le résultat tombe juste, mais les ventes, les clients et les produits constatés d'avance seraient faux sans elles : l'indépendance des exercices porte sur chaque charge et chaque produit, pas sur leur somme.`,
          `Aux faits de la fiche, l'effet net vaut ${eur(d.effet)} : la facture non parvenue l'emporte, ${eur(d.fnp)} d'achats que les pièces ignoraient. Et le jour où arrive la facture ne change rien au résultat régularisé : seul le résultat sur pièces en dépend.`,
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Ce que les régularisations changent",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Avant les régularisations, le résultat avant impôt ${dE(x.entreprise)} était de ${eur(x.avant)}. Que valent ensemble les quatre régularisations sur pièces, puis toutes les régularisations, intérêts du placement compris, et quel est le résultat avant impôt ? Négatif pour un effet qui fait baisser le résultat.`;
      },
      champs: (c) => {
        const x = regularisationsDeNova(c);
        return [
          {
            libelle: "Effet des quatre régularisations sur pièces",
            attendu: x.effetSurPieces,
            calcul: `${eur(x.prime.chargeConstateeDAvance)} d'assurance d'avance ${terme(-x.fnp.ht)} d'achats ${terme(x.fae.ht)} de ventes ${terme(-x.pca)} de ventes d'avance = ${eur(x.effetSurPieces)}`,
          },
          { libelle: "Effet de toutes les régularisations", attendu: x.effetTotal, calcul: `${eur(x.effetSurPieces)} ${terme(x.placement)} d'intérêts courus = ${eur(x.effetTotal)}` },
          { libelle: "Résultat avant impôt", attendu: x.apres, calcul: `${eur(x.avant)} ${terme(x.effetTotal)} = ${eur(x.apres)}` },
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `C'est le résultat avant impôt de la clôture ${dE(x.entreprise)}, ${eur(x.apres)}. Les pièces faisaient dire à l'exercice ${eur(auCentime(x.avant - x.apres))} de plus que ce qu'il a gagné : surtout des composants consommés sans facture.`,
          "L'effet d'une régularisation se lit sur son compte de gestion : une charge retirée ou un produit ajouté le fait monter, une charge ajoutée ou un produit retiré le fait baisser. La TVA, au bilan, n'y touche pas.",
        ];
      },
    },
    {
      id: "extourne",
      type: "choix",
      titre: "Le 1er janvier",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Le 8 janvier, la facture de ${x.f.factureNonParvenue.fournisseur} arrive ; le comptable la passe comme toute facture, au 401. Que doit-il avoir fait le 1er janvier pour ne pas compter l'achat deux fois ?`;
      },
      options: () => [
        {
          texte: "Extourner les régularisations : passer, le 1er janvier, l'écriture inverse de chacune",
          juste: true,
          retour:
            "C'est cela. L'extourne annule dans le nouvel exercice ce que le 31 décembre a rattaché à l'ancien : l'achat sort, la facture du 8 janvier le remet, et N+1 n'en porte rien. La charge et le produit constatés d'avance, eux, reviennent dans l'exercice qu'ils concernent.",
        },
        {
          texte: "Rien : l'achat et la facture se compensent d'eux-mêmes",
          juste: false,
          retour: "Sans extourne, N+1 porterait l'achat une seconde fois, avec la facture, et le compte 408 ne se solderait jamais.",
        },
        {
          texte: "Ne pas passer la facture du 8 janvier",
          juste: false,
          retour: "La facture est la pièce : elle se passe toujours. C'est la régularisation qui s'efface, par l'extourne.",
        },
      ],
    },
    {
      id: "extourne-assurance",
      type: "ecriture",
      titre: "L'assurance revient",
      notions: ["income_statement"],
      evenement: () => "Le 1er janvier N+1, extournez la charge constatée d'avance de l'assurance.",
      ecriture: (c) => {
        const x = regularisationsDeNova(c);
        return {
          date: "1er janvier N+1",
          libelle: "Extourne : charge constatée d'avance, assurance",
          lignes: [
            { role: "la prime de N+1", compte: "616", sens: "debit", montant: x.prime.chargeConstateeDAvance, indice: "la charge constatée d'avance" },
            { role: "la charge constatée d'avance, soldée", compte: "486", sens: "credit", montant: x.prime.chargeConstateeDAvance, indice: "la charge constatée d'avance" },
          ],
        };
      },
      indices: () => ["L'écriture du 31 décembre, retournée : 616 au débit, 486 au crédit."],
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [`N+1 porte ses ${qte(x.prime.moisApres)} mois d'assurance, ${eur(x.prime.chargeConstateeDAvance)}, sans rien payer : la prime l'a été en octobre.`];
      },
    },
    {
      id: "ce-que-garde-n-plus-1",
      type: "montants",
      titre: "Ce que garde N+1",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        const p = x.f.placement;
        return `Le 1er janvier N+1, le comptable extourne les cinq régularisations. Puis les pièces arrivent : la facture de CampusTech part le 4 janvier, la banque verse le 6 janvier les intérêts du compte à terme (${qte(p.dureeMois)} mois à ${qte(p.tauxAnnuel * 100)} % sur ${eur(p.montant)}), la facture de ${x.f.factureNonParvenue.fournisseur} arrive le 8. Que font au résultat de N+1 les extournes, puis ces pièces, et que reste-t-il à N+1 ? Négatif pour un effet qui fait baisser le résultat.`;
      },
      champs: (c) => {
        const x = regularisationsDeNova(c);
        return [
          {
            libelle: "Effet des extournes sur le résultat de N+1",
            attendu: x.extournes,
            calcul: `l'inverse de chaque régularisation : ${eur(-x.prime.chargeConstateeDAvance)} ${terme(x.fnp.ht)} ${terme(-x.fae.ht)} ${terme(x.pca)} ${terme(-x.placement)} = ${eur(x.extournes)}`,
          },
          {
            libelle: "Effet des pièces de janvier",
            attendu: x.piecesDeJanvier,
            calcul: `${eur(x.aLEcheance)} d'intérêts versés ${terme(-x.fnp.ht)} d'achats ${terme(x.fae.ht)} de ventes = ${eur(x.piecesDeJanvier)}`,
          },
          {
            libelle: "Ce que N+1 garde de ces opérations",
            attendu: x.resteDansNPlus1,
            calcul: `${eur(x.extournes)} ${terme(x.piecesDeJanvier)} = ${eur(x.resteDansNPlus1)}`,
          },
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `Il reste à N+1 exactement ce qui lui appartient : ${eur(-x.prime.chargeConstateeDAvance)} d'assurance pour ses ${qte(x.prime.moisApres)} mois, ${eur(x.pca)} de ventes pour les ${qte(x.enJanvier)} enceintes livrées le 8 janvier, et ${eur(x.interetsDeNPlus1)} d'intérêts pour les jours de janvier avant l'échéance.`,
          "Les composants et la commande urgente, eux, ne laissent rien à N+1 : l'extourne et la pièce s'annulent. C'est pour cela qu'on extourne : la pièce se passe comme d'habitude, et chaque exercice garde sa part.",
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver la nouvelle prime",
      notions: ["income_statement"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Le 1er octobre N+1, ${x.entreprise} renouvelle son contrat pour ${qte(x.f.assurance.moisCouverts)} mois, à une prime plus chère payée le jour même. Au 31 décembre N+1, après l'extourne et la nouvelle charge constatée d'avance, la charge d'assurance de N+1 vaut ${eur(CHARGE_D_ASSURANCE_DE_N_PLUS_1)}. Retrouvez la part de la nouvelle prime que porte N+1, la nouvelle prime, puis la charge constatée d'avance au 31 décembre N+1.`;
      },
      champs: (c) => {
        const x = regularisationsDeNova(c);
        const n = x.f.assurance.moisCouverts;
        return [
          {
            libelle: "Part de la nouvelle prime dans N+1",
            attendu: x.partDeLaNouvellePrime,
            calcul: `${eur(CHARGE_D_ASSURANCE_DE_N_PLUS_1)} − ${eur(x.prime.chargeConstateeDAvance)} d'extourne = ${eur(x.partDeLaNouvellePrime)}`,
          },
          {
            libelle: "Nouvelle prime annuelle",
            attendu: x.nouvellePrime,
            calcul: `${eur(x.partDeLaNouvellePrime)} pour ${qte(x.prime.moisDansLExercice)} mois : ${eur(x.partDeLaNouvellePrime)} × ${qte(n)} ÷ ${qte(x.prime.moisDansLExercice)} = ${eur(x.nouvellePrime)}`,
          },
          {
            libelle: "Charge constatée d'avance au 31 décembre N+1",
            attendu: x.ccaDeNPlus1,
            calcul: `${eur(x.nouvellePrime)} × ${qte(x.prime.moisApres)} ÷ ${qte(n)} = ${eur(x.ccaDeNPlus1)}`,
          },
        ];
      },
      explication: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `La charge de N+1 mêle deux primes : ${qte(x.prime.moisApres)} mois de l'ancienne, revenus par l'extourne, et ${qte(x.prime.moisDansLExercice)} mois de la nouvelle. Oublier l'extourne, c'est lire ${eur(CHARGE_D_ASSURANCE_DE_N_PLUS_1)} comme ${qte(x.prime.moisDansLExercice)} mois de la nouvelle prime, et la croire bien plus chère qu'elle n'est.`,
          `La nouvelle prime, ${eur(x.nouvellePrime)}, est en hausse de ${qte(x.hausseDeLaPrime)} %. Au bilan de N+1, la charge constatée d'avance passe de ${eur(x.prime.chargeConstateeDAvance)} à ${eur(x.ccaDeNPlus1)}.`,
        ];
      },
    },
    {
      id: "la-facture-oubliee",
      type: "choix",
      titre: "La facture qu'on voudrait laisser à N+1",
      notions: ["income_statement", "stock"],
      question: (c) => {
        const x = regularisationsDeNova(c);
        return `Le dirigeant relit la clôture : « La facture de ${x.f.factureNonParvenue.fournisseur} arrive le 8 janvier, elle sera dans les comptes de N+1. Pourquoi passer ${eur(x.fnp.ht)} d'achats dans N ? Le résultat de N serait plus beau sans eux. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = regularisationsDeNova(c);
        return [
          {
            texte: `Sans elle, N serait gonflé de ${eur(x.fnp.ht)} et N+1 diminué d'autant, alors que les jeux sont consommés ou en stock en N`,
            juste: true,
            retour: `Oui. Les jeux ont été livrés le 18 décembre : ceux qui ont servi sont une charge de N, ceux qui restent sont au stock final de N. Compter le stock sans l'achat, c'est inventer ${eur(x.fnp.ht)} de résultat, et l'impôt avec.`,
          },
          {
            texte: "Il a raison si la facture arrive avant l'arrêté des comptes : elle ira en N+1",
            juste: false,
            retour: "Non : ce qui décide, c'est la livraison, en décembre. Une facture reçue avant l'arrêté des comptes se rattache à N, au 408 ou directement : elle ne glisse jamais dans N+1.",
          },
          {
            texte: "Il a raison : sans facture, la TVA ne se déduit pas, donc rien ne se passe",
            juste: false,
            retour: `Non : la TVA ne se déduira qu'avec la facture, d'où le compte 44586. Mais la charge, elle, naît de la livraison : ${eur(x.fnp.ht)} d'achats de N.`,
          },
          {
            texte: `Il faut la passer, mais pour ${eur(x.fnp.ttc)} : c'est ce que ${x.entreprise} devra payer`,
            juste: false,
            retour: `Non : la charge est hors taxes, ${eur(x.fnp.ht)}. La TVA, ${eur(x.fnp.tva)}, se récupère : elle va au 44586, et la dette TVA comprise au 408.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "balance_sheet"],
      texte: (c) => {
        const x = regularisationsDeNova(c);
        return [
          `Vous avez rendu à l'exercice ${dE(x.entreprise)} ce qui lui appartient : ${eur(x.avant)} sur les pièces, ${eur(x.apres)} une fois régularisé. Les quatre régularisations sur pièces font ${eur(x.effetSurPieces)}, et les intérêts courus du placement ajoutent ${eur(x.placement)}.`,
          "Le laboratoire l'a montré : un effet net nul n'est pas une écriture en moins. Chaque charge et chaque produit se rattache à l'exercice qui le concerne, et la TVA suit sa pièce, sur les comptes 44586 et 44587 en attendant.",
          "Au niveau de l'examen, vous savez repérer dans des pièces ce qui est à cheval sur deux exercices, passer la charge et le produit constatés d'avance, la facture non parvenue et la facture à établir avec leur TVA, le produit à recevoir sans pièce, chiffrer leur effet sur le résultat, les extourner et dire ce que garde N+1, et remonter d'une charge à la prime qui l'explique.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Constaté d'avance : payé ou facturé, pas encore consommé ni livré, on le retire (486, 487, hors taxes). À payer, à recevoir : consommé ou livré, pas encore facturé, on l'ajoute (408 avec 44586, 418 avec 44587, 5088 pour des intérêts). Le 1er janvier, tout s'extourne.",
    },
  ],
};
