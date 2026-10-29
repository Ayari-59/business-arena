import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  anneeDeProduction,
  capaciteDeLEquipe,
  coutEmployeurMensuel,
  departDeLaFiche,
  departDUnSalarie as departDuModele,
  enceintesParOperateurEtParMois,
  margeUnitaire,
  partDuMarche,
} from "../monde/capacite";
import { CAPACITES_DU_COURS, type FicheDeLaCapacite } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE DÉPART D'UN SALARIÉ ET SON REMPLACEMENT (BTS GPME, palier 3, bloc 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'atelier de
 * NOVA a une fiche figée (monde/nova-capacite.ts) et son année N + 1 se calcule, mois par mois, par
 * le modèle du cours (monde/capacite.ts, partie 3 : `partDuMarche`, `departDUnSalarie`,
 * `equipeMoisParMois`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : un opérateur payé 1 875 € quand le marché passe à 2 000 € tombe sous le seuil de
 * démission (95 % du marché). Il annonce son départ le 1er mars et part le 31 ; un recrutement prend
 * 2 mois, et le remplaçant monte à 50 % son premier mois. Au trimestre 2, l'équipe tombe sous les
 * 7 000 enceintes de la ligne : L'ÉQUIPE DEVIENT LE GOULOT, et le poste vide se paie en ventes. Le
 * coût du départ (marge perdue + recrutement − salaires non versés) se compare à l'augmentation qui
 * l'aurait évité ; la date du recrutement et la demande de l'année le font varier.
 *
 * Ce qui a changé depuis l'arène : le chapitre se jouait chez NOVA, au conseil et au bâtiment, sur
 * l'année rejouée par le moteur, trimestre par trimestre (un salaire baissé de 10 %, un remplaçant
 * recruté au trimestre suivant). Il se joue chez NOVA seule, sur la simulation du cours, mois par
 * mois ; l'écart de marge « des trimestres suivants » (la gestion de l'arène qui prévoit d'après le
 * trimestre d'avant) disparaît : le modèle du cours n'en a pas.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-seuil-de-demission, le-poste-vide (la formule est au repère ou dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-depart
 *     puis le-salaire-qui-garde (un curseur sur le salaire, face au seuil de démission) avant
 *     le-seuil-de-demission ; predire-l-augmentation puis jusqu-ou-augmenter (le plus d'augmentation
 *     qui coûte encore moins que le départ, sur un an) ; predire-l-integration puis le laboratoire
 *     (salaire, date du recrutement, demande de N ou de N + 1) avant recruter-en-fevrier ;
 *   · autonome : les-ventes-perdues, le-cout-du-depart, verdict (ni formule ni chiffres donnés ; le
 *     calcul de la correction montre le chemin) ;
 *   · expert : recruter-en-fevrier (une variante chiffrée : l'intégration à 50 % fait encore perdre
 *     des ventes), la-demande-de-n (la même variante sur la demande de N : un poste vide ne coûte
 *     que si l'équipe devient le goulot), a-rebours (retrouver les ventes perdues à partir du coût
 *     d'un départ), ce-que-le-calcul-ne-compte-pas (une critique de la méthode) ; puis la synthèse.
 */

/** Le départ se chiffre sur l'atelier de NOVA, la PME industrielle de la comptabilité et du contrôle de gestion. */
export const ENTREPRISES_DU_DEPART: readonly string[] = ["nova"];

/** Les bornes du curseur du salaire, en euros bruts par mois : de part et d'autre du seuil de démission. */
export const SALAIRES_DU_CURSEUR = { min: 1_800, max: 2_000 } as const;

/** Les bornes du curseur de l'augmentation, en euros par mois et par opérateur : du seuil (25 €) à 500 €. */
export const AUGMENTATIONS_DU_CURSEUR = { min: 25, max: 500 } as const;

/**
 * LA VARIANTE, hypothèse du cours : le gérant aurait lancé le recrutement le 1er février, avant même
 * l'annonce, pour que le remplaçant arrive le 1er avril, le jour où l'autre part.
 */
export const MOIS_DE_LA_VARIANTE = 2;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : un départ dont le recrutement n'a été lancé que le 1er mai.
 * Le chapitre en donne le coût (calculé par le modèle) ; l'élève en retrouve les ventes perdues.
 */
export const MOIS_DU_RECRUTEMENT_A_REBOURS = 5;

/** Le laboratoire : la part du marché payée, de 93,75 % (le salaire de la fiche) à 100 %, par quart de point. */
export const PARTS_DU_LABORATOIRE = { min: 93.75, max: 100, pas: 0.25 } as const;

/** Le laboratoire : le mois où le recrutement est lancé (0 : NOVA ne remplace pas). */
export const LANCEMENTS_DU_LABORATOIRE: readonly { valeur: number; libelle: string }[] = [
  { valeur: 0, libelle: "Sans remplaçant" },
  { valeur: 1, libelle: "En janvier, avant l'annonce" },
  { valeur: 2, libelle: "En février, avant l'annonce" },
  { valeur: 3, libelle: "Dès l'annonce, le 1er mars" },
  { valeur: 4, libelle: "Au départ, le 1er avril" },
];

/** Le laboratoire : la demande de l'année, celle de N (le témoin) ou celle de N + 1 (l'année des décisions). */
export const DEMANDES_DU_LABORATOIRE = { n: 0, nPlus1: 1 } as const;

/**
 * @deprecated L'ancien chapitre baissait les salaires de 10 % dans l'arène. Gardé pour la mission
 * « jouez » (src/config/cours/jouez.ts), qui fait jouer ce départ dans l'arène ; le chapitre n'en sert plus.
 */
export const ECART_SOUS_LE_MARCHE = 0.1;
/** @deprecated Le tour de l'arène où la mission « jouez » baisse les salaires ; le chapitre n'en sert plus. */
export const TRIMESTRE_DE_LA_BAISSE = 1;
/** @deprecated Le tour de l'arène où la mission « jouez » recrute le remplaçant ; le chapitre n'en sert plus. */
export const TRIMESTRE_DU_RECRUTEMENT = 2;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Une part, en pourcentage au centième. */
const pct = (t: number) => `${qte(auCentime(t * 100))} %`;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;
const nomDuMois = (m: number) => MOIS[m - 1]!;
/** Les mois de `de` à `a`, nommés : « avril, mai et juin ». */
const listeDesMois = (de: number, a: number) => {
  const noms = Array.from({ length: a - de + 1 }, (_, i) => nomDuMois(de + i));
  return noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : noms[0]!;
};

/** La fiche de la capacité du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaCapacite => CAPACITES_DU_COURS[c.code]!;

/** Le départ de NOVA en N + 1, à chaque date de recrutement et sur chaque demande : tout ce que le chapitre et son cas demandent. */
export function departDUnOperateur(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = partDuMarche(f);
  const pN = partDuMarche(f, { marche: f.personnel.salaireDuMarche.n });
  const marge = margeUnitaire(f);
  const coutMensuel = coutEmployeurMensuel(f);
  const parMois = enceintesParOperateurEtParMois(f);
  const operateurs = f.plan.operateurs;
  const taux = f.operateurs.tauxDesCotisationsPatronales;
  const fiche = departDeLaFiche(f);
  const annonce = f.personnel.moisDeLAnnonce;
  // Le trimestre où le poste est vide : celui qui suit le dernier mois de celui qui part.
  const trimestre = Math.ceil((fiche.dernierMois + 1) / 3);
  const k = trimestre - 1;
  const plan = anneeDeProduction(f);
  const auDepart = departDuModele(f);
  const desLAnnonce = departDuModele(f, { debutDuRecrutement: annonce });
  const enFevrier = departDuModele(f, { debutDuRecrutement: MOIS_DE_LA_VARIANTE });
  const aRebours = departDuModele(f, { debutDuRecrutement: MOIS_DU_RECRUTEMENT_A_REBOURS });
  const sansRemplacant = departDuModele(f, { debutDuRecrutement: null });
  const surN = departDuModele(f, {}, { demande: f.anneeN.demande });
  const surNDesLAnnonce = departDuModele(f, { debutDuRecrutement: annonce }, { demande: f.anneeN.demande });
  const enJanvier = departDuModele(f, { debutDuRecrutement: 1 });
  // L'augmentation de chaque opérateur au-delà de laquelle garder l'équipe coûterait plus, sur un an, que le départ.
  const parEuroDAugmentation = auCentime((1 + taux) * 12 * operateurs);
  const augmentationMaximale = Math.floor(auDepart.coutDuDepart / parEuroDAugmentation + 1e-9);
  const moisDuTrimestre = auDepart.equipe.mois.slice(k * 3, k * 3 + 3);
  return {
    f,
    p,
    pN,
    marge,
    coutMensuel,
    parMois,
    operateurs,
    taux,
    fiche,
    annonce,
    trimestre,
    demandeDuTrimestre: plan.trimestres[k]!.demande,
    outilDuTrimestre: plan.trimestres[k]!.capaciteOutil,
    ventesDuPlan: plan.trimestres[k]!.production,
    refuseesDuPlan: plan.trimestres[k]!.refusees,
    equipeDuPlan: capaciteDeLEquipe(f),
    moisDuTrimestre,
    auDepart,
    desLAnnonce,
    enFevrier,
    aRebours,
    sansRemplacant,
    enJanvier,
    surN,
    surNDesLAnnonce,
    demandeDuTrimestreEnN: f.anneeN.demande[k]!,
    /** Combien de fois le départ coûte l'augmentation qui l'aurait évité. */
    rapport: auCentime(auDepart.coutDuDepart / p.coutDeLAugmentationParAn),
    parEuroDAugmentation,
    augmentationMaximale,
  };
}

export type DepartDUnOperateur = ReturnType<typeof departDUnOperateur>;

/**
 * Le laboratoire du départ : à une part du marché payée (en %), un mois de lancement du recrutement
 * (0 : sans remplaçant) et une demande (celle de N ou de N + 1), l'effet sur le résultat de l'année
 * face au plan (les 4 opérateurs à 1 875 € toute l'année). Au seuil ou au-dessus, personne ne part :
 * seule la hausse des salaires pèse. En dessous, un opérateur part (un seul : hypothèse du cours) :
 * la marge perdue, le recrutement et les salaires non versés, au salaire payé.
 */
export function laboratoireDuDepart(x: DepartDUnOperateur, part: number, lancement: number, demande: number) {
  const f = x.f;
  const salaire = auCentime((part / 100) * f.personnel.salaireDuMarche.nPlus1);
  const p = partDuMarche(f, { salaire });
  const coutMensuel = coutEmployeurMensuel(f, salaire);
  const moisDuPlan = 12 * x.operateurs;
  const hausse = auCentime(-(coutMensuel - x.coutMensuel) * moisDuPlan);
  const demandeDeLAnnee = demande === DEMANDES_DU_LABORATOIRE.n ? f.anneeN.demande : f.anneeNPlus1.demande;
  if (!p.sousLeSeuil) {
    return { salaire, part, demissions: 0, moisVacants: 0, equipe: x.equipeDuPlan, ventesPerdues: 0, margePerdue: 0, recrutement: 0, nonVerses: 0, hausse, effetDuDepart: 0, effet: hausse };
  }
  const d = departDuModele(f, { debutDuRecrutement: lancement === 0 ? null : lancement }, { demande: demandeDeLAnnee });
  const nonVerses = auCentime((moisDuPlan - d.equipe.moisPayes) * coutMensuel);
  const effetDuDepart = auCentime(-d.margePerdue - d.recrutement + nonVerses);
  return {
    salaire,
    part,
    demissions: 1,
    moisVacants: d.moisVacants,
    equipe: d.trimestres[x.trimestre - 1]!.equipe,
    ventesPerdues: d.ventesPerdues,
    margePerdue: d.margePerdue,
    recrutement: d.recrutement,
    nonVerses,
    hausse,
    effetDuDepart,
    effet: auCentime(hausse + effetDuDepart),
  };
}

/** Le personnel et l'atelier de NOVA : le document de départ. */
export function tableauDuPersonnel(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = departDUnOperateur(c);
  const f = x.f;
  return {
    titre: `Le personnel et l'atelier de ${f.entreprise}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Opérateurs de montage", valeurs: [qte(x.operateurs)] },
      { libelle: "Salaire brut mensuel d'un opérateur", valeurs: [eur(f.operateurs.salaireBrutMensuel)] },
      { libelle: "Coût mensuel d'un opérateur pour l'entreprise, cotisations comprises", valeurs: [eur(x.coutMensuel)] },
      { libelle: "Salaire du marché en N", valeurs: [eur(f.personnel.salaireDuMarche.n)] },
      { libelle: "Salaire du marché en N + 1", valeurs: [eur(f.personnel.salaireDuMarche.nPlus1)] },
      { libelle: "Seuil de démission, en part du marché", valeurs: [pct(f.personnel.seuilDeDemission)] },
      { libelle: `Enceintes montées par un opérateur, par mois`, valeurs: [qte(x.parMois)] },
      { libelle: "Capacité de la ligne, par trimestre", valeurs: [`${qte(f.ligne.capaciteParTrimestre)} ${f.unites}`] },
      { libelle: `Demande du trimestre ${x.trimestre} de N + 1`, valeurs: [`${qte(x.demandeDuTrimestre)} ${f.unites}`] },
      { libelle: "Délai d'un recrutement, du lancement à l'arrivée", valeurs: [`${qte(f.personnel.delaiDeRecrutementEnMois)} mois`] },
      { libelle: "Coût d'un recrutement", valeurs: [eur(f.personnel.coutDUnRecrutement)] },
      { libelle: "Marge sur coût variable d'une enceinte", valeurs: [eur(x.marge)] },
    ],
  };
}

export const LE_DEPART_D_UN_SALARIE: Chapitre = {
  code: "le-depart-d-un-salarie",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME"],
  titre: "Le départ d'un salarié et son remplacement",
  accroche:
    "Un salaire resté en arrière du marché fait partir un opérateur. Le temps de le remplacer, l'équipe devient le goulot de l'atelier : les ventes perdues, le recrutement, les salaires non versés. Le coût complet d'un départ, face à l'augmentation qui l'aurait évité, et le bon moment pour recruter.",
  objectifs: [
    "Situer un salaire par rapport au marché et au seuil de démission",
    "Mesurer, mois par mois, ce qu'un poste vide fait perdre quand l'équipe devient le goulot",
    "Calculer le coût complet d'un départ et le comparer à l'augmentation qui l'aurait évité",
    "Tenir compte du préavis, du délai de recrutement et de l'intégration pour décider quand recruter",
    "Retrouver les ventes perdues à partir du coût d'un départ, et dire ce que ce coût ne compte pas",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DEPART,
    pourquoi:
      "le départ se chiffre sur l'atelier de NOVA, où une équipe d'un opérateur de moins devient le goulot ; c'est la même PME industrielle que dans la comptabilité et le contrôle de gestion.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un opérateur s'en va",
      notions: ["staff_turnover", "pay_and_motivation", "capacity"],
      tableau: tableauDuPersonnel,
      texte: (c) => {
        const x = departDUnOperateur(c);
        const f = x.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, à l'atelier de ${f.entreprise}, sur l'année N + 1 prévue, mois par mois. ${f.entreprise} monte une enceinte, la ${f.enceinte.nom}, qui laisse ${eur(x.marge)} de marge sur coût variable ; une demande qui n'est pas servie dans son trimestre est perdue. La ligne de montage monte ${qte(f.ligne.capaciteParTrimestre)} ${f.unites} par trimestre ; au trimestre ${x.trimestre}, la demande prévue (${qte(x.demandeDuTrimestre)}) la dépasse déjà, et le plan n'en sert que ${qte(x.ventesDuPlan)}.`,
          `L'équipe : ${qte(x.operateurs)} opérateurs, chacun ${qte(f.operateurs.heuresParMois)} heures par mois à ${qte(f.operateurs.heuresParEnceinte)} heure l'enceinte, soit ${qte(x.parMois)} ${f.unites} par mois, ${qte(x.equipeDuPlan)} par trimestre pour l'équipe. Dans un trimestre, la production se répartit librement entre les mois. Chaque opérateur gagne ${eur(f.operateurs.salaireBrutMensuel)} bruts par mois, ${eur(x.coutMensuel)} pour ${f.entreprise} avec ${pct(x.taux)} de cotisations patronales.`,
          `Ce que la simulation suppose du personnel. Payé sous ${pct(f.personnel.seuilDeDemission)} du salaire du marché, un opérateur trouve mieux ailleurs et démissionne (un seul : le cours ne fait partir qu'un opérateur). Il l'annonce le 1er ${nomDuMois(x.annonce)}, et son préavis d'un mois le fait partir le 31 ${nomDuMois(x.fiche.dernierMois)}. Un recrutement prend ${qte(f.personnel.delaiDeRecrutementEnMois)} mois entre son lancement et l'arrivée du remplaçant, au premier jour d'un mois, et coûte ${eur(f.personnel.coutDUnRecrutement)}. Le premier mois, le remplaçant monte ${pct(f.personnel.integration.productivite)} de ce que monte un opérateur formé, pour un salaire entier.`,
          `Le salaire du marché passe de ${eur(f.personnel.salaireDuMarche.n)} en N à ${eur(f.personnel.salaireDuMarche.nPlus1)} en N + 1 ; ${f.entreprise} n'a rien changé à ses salaires.`,
        ];
      },
      repere: () =>
        "Production d'un trimestre = la plus petite de la demande, de la capacité de l'outil et de la capacité de l'équipe. Capacité de l'équipe d'un mois = opérateurs présents × enceintes d'un opérateur par mois, le remplaçant à 50 % son premier mois.",
    },
    {
      id: "predire-le-depart",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le départ",
      notions: ["pay_and_motivation", "staff_turnover"],
      question: (c) => {
        const x = departDUnOperateur(c);
        const f = x.f;
        return `Avant tout calcul, pariez. En N + 1, ${f.entreprise} garde le salaire de N, ${eur(f.operateurs.salaireBrutMensuel)}, quand le marché passe de ${eur(f.personnel.salaireDuMarche.n)} à ${eur(f.personnel.salaireDuMarche.nPlus1)}. Un opérateur va-t-il démissionner ?`;
      },
      options: (c) => {
        const x = departDUnOperateur(c);
        const voir = "Déplacez le salaire à l'étape suivante : le curseur montre où passe le seuil.";
        return [
          { texte: `Oui : ${eur(x.f.operateurs.salaireBrutMensuel)} tombent sous ${pct(x.p.seuil)} du nouveau marché`, juste: x.p.sousLeSeuil, retour: `Bon pari. ${voir}` },
          { texte: "Non : son salaire n'a pas baissé d'un euro", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Non : il reste au-dessus de ${pct(x.p.seuil)} du salaire de N`, juste: !x.p.sousLeSeuil, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-salaire-qui-garde",
      objectifs: [0],
      type: "curseur",
      titre: "Le salaire qui garde l'opérateur",
      notions: ["pay_and_motivation", "staff_turnover"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Faites varier le salaire brut mensuel d'un opérateur, de ${eur(SALAIRES_DU_CURSEUR.min)} à ${eur(SALAIRES_DU_CURSEUR.max)}. Une droite donne le salaire, l'autre le salaire sous lequel un opérateur démissionne en N + 1 (${pct(x.p.seuil)} du marché). Placez le curseur sur le plus petit salaire qui garde l'opérateur, puis validez.`;
      },
      grandeur: () => ({ libelle: "Salaire brut mensuel d'un opérateur", unite: "€" }),
      cible: (c) => ({ attendu: departDUnOperateur(c).p.salaireAuSeuil, min: SALAIRES_DU_CURSEUR.min, max: SALAIRES_DU_CURSEUR.max }),
      zones: ["L'opérateur reste", "L'opérateur démissionne"],
      rates: () => ({
        dessous: "À ce salaire, l'opérateur gagne moins que le seuil : il démissionne.",
        dessus: "Plus bas, l'opérateur reste encore : cherchez le plus petit salaire.",
      }),
      montrer: "Montrer le seuil de démission",
      lecture: (c, s) => {
        const x = departDUnOperateur(c);
        const augmentation = auCentime(s - x.f.operateurs.salaireBrutMensuel);
        return [
          { libelle: "Salaire au seuil de démission", montant: auCentime(x.p.marche * x.p.seuil) },
          { libelle: "Augmentation mensuelle d'un opérateur", montant: augmentation },
          { libelle: "Hausse de la masse salariale sur un an, cotisations comprises", montant: auCentime(augmentation * x.parEuroDAugmentation), fort: true },
        ];
      },
      droites: (c) => {
        const x = departDUnOperateur(c);
        return { produit: (s) => s, cout: () => x.p.marche * x.p.seuil, libelles: ["Salaire de l'opérateur", "Salaire au seuil de démission"] };
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const f = x.f;
        return [
          `Le seuil tombe à ${eur(x.p.marche)} × ${pct(x.p.seuil)} = ${eur(x.p.salaireAuSeuil)} : ${eur(x.p.augmentationParMois)} de plus par mois et par opérateur suffisent à garder toute l'équipe. À ${eur(f.operateurs.salaireBrutMensuel)}, ${f.entreprise} paie ${pct(x.p.part)} du marché de N + 1, quand elle en payait ${pct(x.pN.part)} en N.`,
          "Sans rien baisser, le salaire a glissé sous le seuil : c'est le marché qui a monté. Un salaire se juge face au marché de l'année, pas face à celui d'hier.",
        ];
      },
    },
    {
      id: "le-seuil-de-demission",
      objectifs: [0],
      type: "montants",
      titre: "Le seuil de démission",
      notions: ["pay_and_motivation", "payroll"],
      question: (c) => {
        const x = departDUnOperateur(c);
        const f = x.f;
        return `Calculez la part du marché que ${f.entreprise} paie en N (${eur(f.operateurs.salaireBrutMensuel)} ÷ ${eur(f.personnel.salaireDuMarche.n)}) et en N + 1 (÷ ${eur(f.personnel.salaireDuMarche.nPlus1)}), en %, puis le salaire au seuil de démission (${eur(f.personnel.salaireDuMarche.nPlus1)} × ${pct(x.p.seuil)}), et ce que coûte sur un an de porter les ${qte(x.operateurs)} opérateurs à ce salaire (l'augmentation × ${qte(1 + x.taux)} de cotisations × 12 mois × ${qte(x.operateurs)}).`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const f = x.f;
        return [
          {
            libelle: "Part du marché payée en N (%)",
            attendu: auCentime(x.pN.part * 100),
            calcul: `${eur(f.operateurs.salaireBrutMensuel)} ÷ ${eur(f.personnel.salaireDuMarche.n)} = ${pct(x.pN.part)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Part du marché payée en N + 1 (%)",
            attendu: auCentime(x.p.part * 100),
            calcul: `${eur(f.operateurs.salaireBrutMensuel)} ÷ ${eur(x.p.marche)} = ${pct(x.p.part)}`,
            tolerance: 0.05,
          },
          { libelle: "Salaire au seuil de démission", attendu: x.p.salaireAuSeuil, calcul: `${eur(x.p.marche)} × ${pct(x.p.seuil)} = ${eur(x.p.salaireAuSeuil)}` },
          {
            libelle: "Coût de l'augmentation sur un an",
            attendu: x.p.coutDeLAugmentationParAn,
            calcul: `${eur(x.p.augmentationParMois)} × ${qte(1 + x.taux)} × 12 × ${qte(x.operateurs)} = ${eur(x.p.coutDeLAugmentationParAn)}`,
          },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        return [
          `En N, ${pct(x.pN.part)} : au-dessus du seuil, personne ne partait. En N + 1, ${pct(x.p.part)} : sous le seuil. Garder les ${qte(x.operateurs)} opérateurs coûte ${eur(x.p.coutDeLAugmentationParAn)} sur l'année. Reste à savoir ce que coûte un départ.`,
        ];
      },
    },
    {
      id: "le-poste-vide",
      objectifs: [1],
      type: "montants",
      titre: "Le poste vide, mois par mois",
      notions: ["capacity", "staff_turnover"],
      question: (c) => {
        const x = departDUnOperateur(c);
        const [a, b, j] = x.moisDuTrimestre;
        return `Le gérant lance le recrutement le jour du départ, le 1er ${nomDuMois(a!.mois)} : le remplaçant arrive ${qte(x.f.personnel.delaiDeRecrutementEnMois)} mois plus tard, le 1er ${nomDuMois(x.auDepart.arrivee!)}, et monte à ${pct(x.f.personnel.integration.productivite)} ce premier mois. Calculez la capacité de l'équipe en ${nomDuMois(a!.mois)}, en ${nomDuMois(b!.mois)} et en ${nomDuMois(j!.mois)} (les ${qte(x.operateurs - 1)} opérateurs restés × ${qte(x.parMois)}, plus le remplaçant), puis celle du trimestre ${x.trimestre}.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const calcul = (m: (typeof x.moisDuTrimestre)[number]) =>
          m.productiviteDuNouveau > 0
            ? `(${qte(m.anciens)} + ${qte(m.productiviteDuNouveau)}) × ${qte(x.parMois)} = ${qte(m.capacite)}`
            : `${qte(m.anciens)} × ${qte(x.parMois)} = ${qte(m.capacite)}`;
        return [
          ...x.moisDuTrimestre.map((m) => ({ libelle: `Capacité de l'équipe en ${nomDuMois(m.mois)} (${x.f.unites})`, attendu: m.capacite, calcul: calcul(m) })),
          {
            libelle: `Capacité de l'équipe au trimestre ${x.trimestre} (${x.f.unites})`,
            attendu: x.auDepart.equipe.trimestres[x.trimestre - 1]!,
            calcul: `${x.moisDuTrimestre.map((m) => qte(m.capacite)).join(" + ")} = ${qte(x.auDepart.equipe.trimestres[x.trimestre - 1]!)}`,
          },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const equipe = x.auDepart.equipe.trimestres[x.trimestre - 1]!;
        return [
          `Au trimestre ${x.trimestre}, l'équipe ne peut monter que ${qte(equipe)} ${x.f.unites}, au lieu de ${qte(x.equipeDuPlan)}. Elle passe sous les ${qte(x.outilDuTrimestre)} que la ligne peut monter : ce trimestre, ce n'est plus l'outil qui borne la production, c'est l'équipe. L'équipe devient le goulot.`,
        ];
      },
    },
    {
      id: "les-ventes-perdues",
      objectifs: [1],
      type: "montants",
      titre: "Ce que le goulot fait perdre",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Sans formule cette fois. Au trimestre ${x.trimestre}, combien ${x.f.entreprise} vend-elle avec l'équipe du départ, combien le départ lui fait-il perdre de ventes face au plan, et quelle marge sur coût variable ? Les trimestres suivants ont retrouvé ${qte(x.operateurs)} opérateurs.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const t = x.auDepart.trimestres[x.trimestre - 1]!;
        return [
          {
            libelle: `Ventes du trimestre ${x.trimestre} (${x.f.unites})`,
            attendu: t.ventes,
            calcul: `la plus petite de ${qte(t.demande)} demandées, ${qte(t.capaciteOutil)} pour l'outil et ${qte(t.equipe)} pour l'équipe : ${qte(t.ventes)}`,
          },
          {
            libelle: `Ventes perdues par le départ (${x.f.unites})`,
            attendu: x.auDepart.ventesPerdues,
            calcul: `${qte(t.ventesDuPlan)} au plan − ${qte(t.ventes)} = ${qte(x.auDepart.ventesPerdues)}`,
          },
          { libelle: "Marge perdue", attendu: x.auDepart.margePerdue, calcul: `${qte(x.auDepart.ventesPerdues)} × ${eur(x.marge)} = ${eur(x.auDepart.margePerdue)}` },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const t = x.auDepart.trimestres[x.trimestre - 1]!;
        return [
          `Les ventes perdues se comptent face au plan, ${qte(t.ventesDuPlan)}, et non face à la demande, ${qte(t.demande)} : ${qte(x.refuseesDuPlan)} ${x.f.unites} étaient déjà refusées par l'outil, avec ou sans départ. Les imputer au départ, ce serait lui faire payer ce que la ligne ne peut pas monter.`,
          `Chaque enceinte perdue emporte sa marge, ${eur(x.marge)} : ${eur(x.auDepart.margePerdue)} en un trimestre.`,
        ];
      },
    },
    {
      id: "le-cout-du-depart",
      objectifs: [2],
      type: "montants",
      titre: "Le coût complet du départ",
      notions: ["staff_turnover", "payroll", "contribution_margin"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Le poste vide n'a pas coûté de salaire tant qu'il était vide. Calculez les salaires non versés, puis le coût complet du départ (la marge perdue, le recrutement, moins les salaires non versés), et combien de fois il dépasse les ${eur(x.p.coutDeLAugmentationParAn)} de l'augmentation qui l'aurait évité.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const d = x.auDepart;
        return [
          { libelle: "Salaires non versés", attendu: d.salairesNonVerses, calcul: `${qte(d.moisVacants)} mois × ${eur(x.coutMensuel)} = ${eur(d.salairesNonVerses)}` },
          {
            libelle: "Coût du départ",
            attendu: d.coutDuDepart,
            calcul: `${eur(d.margePerdue)} + ${eur(d.recrutement)} − ${eur(d.salairesNonVerses)} = ${eur(d.coutDuDepart)}`,
          },
          {
            libelle: "Coût du départ ÷ coût de l'augmentation",
            attendu: x.rapport,
            calcul: `${eur(d.coutDuDepart)} ÷ ${eur(x.p.coutDeLAugmentationParAn)} = ${qte(x.rapport)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const d = x.auDepart;
        return [
          `Le départ coûte ${eur(d.coutDuDepart)}, près de ${qte(Math.round(x.rapport))} fois l'augmentation qui l'aurait évité. Les salaires non versés (${eur(d.salairesNonVerses)}) ne compensent qu'une petite part de la marge perdue (${eur(d.margePerdue)}) : un poste vide économise un salaire, mais il coûte toutes les ventes que l'équipe ne peut plus servir.`,
        ];
      },
    },
    {
      id: "verdict",
      objectifs: [2],
      type: "choix",
      titre: "Fallait-il suivre le marché ?",
      notions: ["pay_and_motivation", "staff_turnover"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Le départ coûte ${eur(x.auDepart.coutDuDepart)} ; porter les ${qte(x.operateurs)} opérateurs au seuil aurait coûté ${eur(x.p.coutDeLAugmentationParAn)} sur l'année. Que retenir ?`;
      },
      options: (c) => {
        const x = departDUnOperateur(c);
        const d = x.auDepart;
        const coutePlus = d.leDepartCoutePlus;
        return [
          {
            texte: `Il fallait suivre le marché : le départ coûte près de ${qte(Math.round(x.rapport))} fois l'augmentation`,
            juste: coutePlus,
            retour: coutePlus
              ? `Oui : ${eur(d.coutDuDepart)} pour le départ, ${eur(x.p.coutDeLAugmentationParAn)} pour l'augmentation. L'économie de salaire était petite et certaine ; le départ se paie en ventes, parce que l'équipe devient le goulot.`
              : `Non : ici, le départ (${eur(d.coutDuDepart)}) coûte moins que l'augmentation (${eur(x.p.coutDeLAugmentationParAn)}).`,
          },
          {
            texte: `Rien à regretter : le poste vide a économisé ${eur(d.salairesNonVerses)} de salaires`,
            juste: false,
            retour: `Non : ces ${eur(d.salairesNonVerses)} sont déjà déduits du coût du départ. Ils ne pèsent pas lourd face aux ${eur(d.margePerdue)} de marge perdue.`,
          },
          {
            texte: "Rien à regretter : l'augmentation se paie chaque année, le départ une seule fois",
            juste: !coutePlus,
            retour: !coutePlus
              ? "Oui, cette année : le départ coûte moins que l'augmentation."
              : `Non : sous le seuil, un autre opérateur partirait l'année suivante, et le départ recommencerait. Et même sur une seule année, l'augmentation coûte ${qte(Math.round(x.rapport))} fois moins. L'étape suivante cherche jusqu'où elle resterait la moins chère.`,
          },
        ];
      },
    },
    {
      id: "predire-l-augmentation",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'augmentation",
      notions: ["pay_and_motivation", "payroll"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Pariez encore. ${x.f.entreprise} n'a besoin que de ${eur(x.p.augmentationParMois)} par mois et par opérateur pour garder son équipe. Jusqu'à quelle augmentation garder l'équipe coûterait-il moins, sur un an, que le départ (${eur(x.auDepart.coutDuDepart)}) ?`;
      },
      options: (c) => {
        const x = departDUnOperateur(c);
        const voir = "Faites varier l'augmentation à l'étape suivante : le curseur la compare au coût du départ.";
        return [
          { texte: "Plus de 300 € par mois et par opérateur", juste: x.augmentationMaximale > 300, retour: `Bon pari. ${voir}` },
          { texte: "Une centaine d'euros par mois et par opérateur", juste: x.augmentationMaximale <= 300, retour: `Pari à vérifier. ${voir}` },
          { texte: `Pas plus de ${eur(x.p.augmentationParMois)} : au-delà, l'augmentation ne sert à rien`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "jusqu-ou-augmenter",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où augmenter",
      notions: ["pay_and_motivation", "payroll", "staff_turnover"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Faites varier l'augmentation mensuelle de chaque opérateur, de ${eur(AUGMENTATIONS_DU_CURSEUR.min)} (le seuil) à ${eur(AUGMENTATIONS_DU_CURSEUR.max)}. Une droite donne le coût du départ, ${eur(x.auDepart.coutDuDepart)} ; l'autre, la hausse de la masse salariale sur un an (${qte(x.operateurs)} opérateurs, cotisations comprises). Placez le curseur sur la plus grande augmentation qui coûte encore moins que le départ, puis validez.`;
      },
      grandeur: () => ({ libelle: "Augmentation mensuelle de chaque opérateur", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: departDUnOperateur(c).augmentationMaximale, min: AUGMENTATIONS_DU_CURSEUR.min, max: AUGMENTATIONS_DU_CURSEUR.max }),
      zones: ["Garder l'équipe coûte moins", "Le départ coûte moins"],
      rates: () => ({
        dessous: "Garder l'équipe coûte encore moins que le départ : cherchez la plus grande augmentation.",
        dessus: "À cette augmentation, garder l'équipe coûte déjà plus que le départ sur un an.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, a) => {
        const x = departDUnOperateur(c);
        const hausse = auCentime(a * x.parEuroDAugmentation);
        return [
          { libelle: "Hausse de la masse salariale sur un an", montant: hausse },
          { libelle: "Coût du départ, recruté au départ", montant: x.auDepart.coutDuDepart },
          { libelle: "Ce que garder l'équipe fait gagner", montant: auCentime(x.auDepart.coutDuDepart - hausse), fort: true },
        ];
      },
      droites: (c) => {
        const x = departDUnOperateur(c);
        return { produit: () => x.auDepart.coutDuDepart, cout: (a) => a * x.parEuroDAugmentation, libelles: ["Coût du départ", "Hausse de la masse salariale sur un an"] };
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        return [
          `Jusqu'à ${eur(x.augmentationMaximale)} par mois et par opérateur, garder l'équipe coûte moins que le départ sur un an : ${eur(x.augmentationMaximale)} × ${qte(1 + x.taux)} × 12 × ${qte(x.operateurs)} = ${eur(auCentime(x.augmentationMaximale * x.parEuroDAugmentation))}. ${x.f.entreprise} n'a besoin que de ${eur(x.p.augmentationParMois)}.`,
          "L'écart est si grand parce que le départ ne se paie pas en salaires : il se paie en ventes, celles d'une équipe devenue le goulot. Il resterait à savoir ce qu'il coûte si l'on recrute plus tôt, ou si la demande est moins forte.",
        ];
      },
    },
    {
      id: "predire-l-integration",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur un recrutement anticipé",
      notions: ["staff_turnover", "capacity"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Pariez une dernière fois. Pour que le remplaçant arrive le 1er ${nomDuMois(x.fiche.dernierMois + 1)}, au lendemain du départ, il aurait fallu lancer le recrutement le 1er ${nomDuMois(MOIS_DE_LA_VARIANTE)}, avant même l'annonce. Cela aurait-il suffi à ne perdre aucune vente au trimestre ${x.trimestre} ?`;
      },
      options: (c) => {
        const x = departDUnOperateur(c);
        const voir = "Le laboratoire suivant fait varier la date du recrutement : regardez l'équipe du trimestre.";
        return [
          { texte: "Non : le premier mois, le remplaçant ne monte que la moitié", juste: x.enFevrier.ventesPerdues > 0, retour: `Bon pari. ${voir}` },
          { texte: "Oui : l'équipe garde ses opérateurs tout le trimestre", juste: x.enFevrier.ventesPerdues === 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : le poste reste vide le temps du préavis", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-depart",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du départ",
      notions: ["staff_turnover", "pay_and_motivation", "capacity"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Réglez la part du marché que ${x.f.entreprise} paie, le mois où elle lance le recrutement, et la demande de l'année. Le tableau suit l'équipe du trimestre ${x.trimestre}, les ventes perdues et l'effet sur le résultat de l'année face au plan ; le graphique suit cet effet selon le salaire. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = departDUnOperateur(c);
        return [
          { code: "part", libelle: "Salaire, en part du marché de N + 1", unite: "%", min: PARTS_DU_LABORATOIRE.min, max: PARTS_DU_LABORATOIRE.max, pas: PARTS_DU_LABORATOIRE.pas, depart: auCentime(x.p.part * 100) },
          {
            code: "lancement",
            libelle: "Lancement du recrutement",
            unite: "",
            min: Math.min(...LANCEMENTS_DU_LABORATOIRE.map((l) => l.valeur)),
            max: Math.max(...LANCEMENTS_DU_LABORATOIRE.map((l) => l.valeur)),
            pas: 1,
            depart: x.fiche.debutDuRecrutement!,
            choix: LANCEMENTS_DU_LABORATOIRE,
          },
          {
            code: "demande",
            libelle: "Demande de l'année",
            unite: "",
            min: DEMANDES_DU_LABORATOIRE.n,
            max: DEMANDES_DU_LABORATOIRE.nPlus1,
            pas: 1,
            depart: DEMANDES_DU_LABORATOIRE.nPlus1,
            choix: [
              { valeur: DEMANDES_DU_LABORATOIRE.n, libelle: "La demande de N" },
              { valeur: DEMANDES_DU_LABORATOIRE.nPlus1, libelle: "La demande de N + 1" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = departDUnOperateur(c);
        const l = laboratoireDuDepart(x, p.part!, p.lancement!, p.demande!);
        const d = laboratoireDuDepart(x, auCentime(x.p.part * 100), x.fiche.debutDuRecrutement!, DEMANDES_DU_LABORATOIRE.nPlus1);
        return [
          { libelle: "Salaire brut mensuel d'un opérateur", montant: l.salaire, reference: d.salaire },
          { libelle: "Démissions", montant: l.demissions, unite: "démission", reference: d.demissions },
          { libelle: "Mois de poste vide", montant: l.moisVacants, unite: "mois", reference: d.moisVacants },
          { libelle: `Capacité de l'équipe au trimestre ${x.trimestre}`, montant: l.equipe, unite: x.f.unites, reference: d.equipe },
          { libelle: "Ventes perdues sur l'année", montant: l.ventesPerdues, unite: x.f.unites, reference: d.ventesPerdues },
          { libelle: "Marge perdue", montant: -l.margePerdue, reference: -d.margePerdue, effet: true },
          { libelle: "Recrutement", montant: -l.recrutement, reference: -d.recrutement, effet: true },
          { libelle: "Salaires non versés", montant: l.nonVerses, reference: d.nonVerses, effet: true },
          { libelle: "Hausse des salaires", montant: l.hausse, reference: d.hausse, effet: true },
          { libelle: "Effet sur le résultat de l'année", montant: l.effet, reference: d.effet, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // L'effet sur le résultat selon le salaire n'est pas une droite : il saute au seuil de démission.
      graphique: (c) => {
        const x = departDUnOperateur(c);
        const l = (p: Readonly<Record<string, number>>) => laboratoireDuDepart(x, p.part!, p.lancement!, p.demande!);
        return {
          levier: "part",
          courbes: [
            { libelle: "Effet du départ", valeur: (p) => l(p).effetDuDepart + 0 },
            { libelle: "Hausse des salaires", valeur: (p) => l(p).hausse + 0 },
            { libelle: "Effet sur le résultat de l'année", valeur: (p) => l(p).effet + 0 },
          ],
        };
      },
      defi: (c) => {
        const x = departDUnOperateur(c);
        const auSeuil = -x.p.coutDeLAugmentationParAn;
        return {
          consigne: "Sur la demande de N + 1, ne perdez aucune vente, au moindre coût pour le résultat de l'année.",
          atteint: (p) => {
            const l = laboratoireDuDepart(x, p.part!, p.lancement!, p.demande!);
            return p.demande === DEMANDES_DU_LABORATOIRE.nPlus1 && l.ventesPerdues === 0 && l.effet >= auSeuil - 0.005;
          },
          indice: (p) => {
            const l = laboratoireDuDepart(x, p.part!, p.lancement!, p.demande!);
            if (p.demande !== DEMANDES_DU_LABORATOIRE.nPlus1) return "Le défi se joue sur la demande de N + 1, celle de l'année des décisions.";
            if (l.ventesPerdues > 0)
              return `${qte(l.ventesPerdues)} ${x.f.unites} perdues : au trimestre ${x.trimestre}, l'équipe ne monte que ${qte(l.equipe)} ${x.f.unites} pour ${qte(x.outilDuTrimestre)} que la ligne peut monter.`;
            return `Aucune vente perdue, mais l'année coûte ${eur(-l.effet)} : cherchez moins cher.`;
          },
          solution: { part: auCentime(x.p.seuil * 100), lancement: x.fiche.debutDuRecrutement!, demande: DEMANDES_DU_LABORATOIRE.nPlus1 },
        };
      },
      explication: (c, p) => {
        const x = departDUnOperateur(c);
        const l = laboratoireDuDepart(x, p.part!, p.lancement!, p.demande!);
        const janvier = laboratoireDuDepart(x, auCentime(x.p.part * 100), 1, DEMANDES_DU_LABORATOIRE.nPlus1);
        const fevrier = laboratoireDuDepart(x, auCentime(x.p.part * 100), MOIS_DE_LA_VARIANTE, DEMANDES_DU_LABORATOIRE.nPlus1);
        const surN = laboratoireDuDepart(x, auCentime(x.p.part * 100), x.annonce, DEMANDES_DU_LABORATOIRE.n);
        return [
          `Au seuil, ${eur(l.salaire)}, l'opérateur reste : l'année coûte ${eur(-l.effet)}, aucune vente ne se perd, et la date du recrutement ne compte plus. Recruter en janvier, avant l'annonce, ne perd aucune vente non plus, mais coûte ${eur(-janvier.effet)} : le recrutement et un mois de salaire en double, quand le remplaçant et le partant se croisent. En février, l'intégration à ${pct(x.f.personnel.integration.productivite)} fait encore perdre ${qte(fevrier.ventesPerdues)} ${x.f.unites}.`,
          `Sur la demande de N, plus faible, recruter dès l'annonce suffisait : aucune vente perdue, ${eur(-surN.effet)} pour l'année. Le graphique le montre : sous le seuil, l'effet tombe d'un coup ; au-dessus, chaque quart de point de plus coûte un peu. Un poste vide ne coûte cher que si l'équipe devient le goulot.`,
        ];
      },
    },
    {
      id: "recruter-en-fevrier",
      objectifs: [3],
      type: "montants",
      titre: "Variante : recruter avant l'annonce",
      notions: ["staff_turnover", "capacity", "payroll"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Variante : le gérant aurait lancé le recrutement le 1er ${nomDuMois(MOIS_DE_LA_VARIANTE)}. Refaites le raisonnement : la capacité de l'équipe au trimestre ${x.trimestre}, les ventes perdues, les salaires non versés, puis le coût du départ.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const d = x.enFevrier;
        const mois = d.equipe.mois.slice((x.trimestre - 1) * 3, x.trimestre * 3);
        return [
          {
            libelle: `Capacité de l'équipe au trimestre ${x.trimestre} (${x.f.unites})`,
            attendu: d.equipe.trimestres[x.trimestre - 1]!,
            calcul: `${mois.map((m) => qte(m.capacite)).join(" + ")} = ${qte(d.equipe.trimestres[x.trimestre - 1]!)} (le remplaçant arrive le 1er ${nomDuMois(d.arrivee!)}, à ${pct(x.f.personnel.integration.productivite)} ce mois-là)`,
          },
          { libelle: `Ventes perdues (${x.f.unites})`, attendu: d.ventesPerdues, calcul: `${qte(x.ventesDuPlan)} − ${qte(d.equipe.trimestres[x.trimestre - 1]!)} = ${qte(d.ventesPerdues)}` },
          { libelle: "Salaires non versés", attendu: d.salairesNonVerses, calcul: `${qte(d.moisVacants)} mois de poste vide × ${eur(x.coutMensuel)} = ${eur(d.salairesNonVerses)}` },
          {
            libelle: "Coût du départ",
            attendu: d.coutDuDepart,
            calcul: `${qte(d.ventesPerdues)} × ${eur(x.marge)} + ${eur(d.recrutement)} − ${eur(d.salairesNonVerses)} = ${eur(d.coutDuDepart)}`,
          },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const d = x.enFevrier;
        return [
          `Le remplaçant est là au lendemain du départ, et le poste n'est jamais vide. Pourtant ${x.f.entreprise} perd encore ${qte(d.ventesPerdues)} ${x.f.unites} : son premier mois, il ne monte que ${qte(x.parMois * x.f.personnel.integration.productivite)} ${x.f.unites}. Le départ coûte ${eur(d.coutDuDepart)}, encore plus que l'augmentation (${eur(x.p.coutDeLAugmentationParAn)}).`,
          `Un recrutement se prépare donc avec trois délais : le préavis, le recrutement lui-même, et l'intégration. L'annonce du 1er ${nomDuMois(x.annonce)} vient trop tard pour les couvrir tous.`,
        ];
      },
    },
    {
      id: "la-demande-de-n",
      objectifs: [1],
      type: "montants",
      titre: "Variante : la demande de N",
      notions: ["capacity", "staff_turnover", "contribution_margin"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Variante : rejouez le même départ sur la demande de N, l'année témoin (${qte(x.demandeDuTrimestreEnN)} ${x.f.unites} au trimestre ${x.trimestre}). Calculez les ventes que le départ fait perdre, recrutement lancé au départ, le coût du départ dans ce cas, puis le coût du départ recrutement lancé dès l'annonce.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const a = x.surN;
        const b = x.surNDesLAnnonce;
        const t = a.trimestres[x.trimestre - 1]!;
        return [
          {
            libelle: `Ventes perdues, recrutement lancé au départ (${x.f.unites})`,
            attendu: a.ventesPerdues,
            calcul: `${qte(t.ventesDuPlan)} demandées et servies au plan − ${qte(t.equipe)} pour l'équipe = ${qte(a.ventesPerdues)}`,
          },
          {
            libelle: "Coût du départ, recrutement lancé au départ",
            attendu: a.coutDuDepart,
            calcul: `${qte(a.ventesPerdues)} × ${eur(x.marge)} + ${eur(a.recrutement)} − ${eur(a.salairesNonVerses)} = ${eur(a.coutDuDepart)}`,
          },
          {
            libelle: "Coût du départ, recrutement lancé dès l'annonce",
            attendu: b.coutDuDepart,
            calcul: `${qte(b.ventesPerdues)} × ${eur(x.marge)} + ${eur(b.recrutement)} − ${eur(b.salairesNonVerses)} = ${eur(b.coutDuDepart)}`,
          },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const a = x.surN;
        const b = x.surNDesLAnnonce;
        return [
          `Sur la demande de N, l'équipe du départ ne manque que de ${qte(a.ventesPerdues)} ${x.f.unites}, et le départ coûte ${eur(a.coutDuDepart)}, au lieu de ${eur(x.auDepart.coutDuDepart)}. Recruté dès l'annonce, le remplaçant suffit : ${b.ventesPerdues === 0 ? "aucune vente perdue" : `${qte(b.ventesPerdues)} ${x.f.unites} perdues seulement`}, et le départ ne coûte plus que ${eur(b.coutDuDepart)}, le recrutement moins un mois de salaire non versé.`,
          "Le coût d'un départ n'est pas une constante : il dépend de la demande. Un poste vide ne coûte des ventes que si l'équipe devient le goulot ; c'est en N + 1, l'année où la demande dépasse déjà l'outil, qu'il se paie cher.",
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver les ventes perdues à rebours",
      notions: ["staff_turnover", "contribution_margin", "payroll"],
      question: (c) => {
        const x = departDUnOperateur(c);
        const d = x.aRebours;
        return `À rebours. Un autre départ, remplacé, a coûté ${eur(d.coutDuDepart)} à ${x.f.entreprise} : le même opérateur, parti le 31 ${nomDuMois(x.fiche.dernierMois)}, mais un recrutement lancé le 1er ${nomDuMois(MOIS_DU_RECRUTEMENT_A_REBOURS)} seulement. Retrouvez les mois de poste vide, les salaires non versés, la marge perdue, puis les ${x.f.unites} perdues.`;
      },
      champs: (c) => {
        const x = departDUnOperateur(c);
        const d = x.aRebours;
        return [
          {
            libelle: "Mois de poste vide",
            attendu: d.moisVacants,
            calcul: `le remplaçant arrive le 1er ${nomDuMois(d.arrivee!)}, ${qte(x.f.personnel.delaiDeRecrutementEnMois)} mois après le lancement : le poste est vide en ${listeDesMois(x.fiche.dernierMois + 1, d.arrivee! - 1)}, ${qte(d.moisVacants)} mois`,
          },
          { libelle: "Salaires non versés", attendu: d.salairesNonVerses, calcul: `${qte(d.moisVacants)} × ${eur(x.coutMensuel)} = ${eur(d.salairesNonVerses)}` },
          {
            libelle: "Marge perdue",
            attendu: d.margePerdue,
            calcul: `${eur(d.coutDuDepart)} − ${eur(d.recrutement)} + ${eur(d.salairesNonVerses)} = ${eur(d.margePerdue)}`,
          },
          { libelle: `${x.f.unites.charAt(0).toUpperCase()}${x.f.unites.slice(1)} perdues`, attendu: d.ventesPerdues, calcul: `${eur(d.margePerdue)} ÷ ${eur(x.marge)} = ${qte(d.ventesPerdues)}` },
        ];
      },
      explication: (c) => {
        const x = departDUnOperateur(c);
        const d = x.aRebours;
        const t2 = d.trimestres[x.trimestre - 1]!;
        const t3 = d.trimestres[x.trimestre]!;
        return [
          `Coût du départ = marge perdue + recrutement − salaires non versés : la marge perdue se retrouve en ajoutant les salaires non versés et en retranchant le recrutement, et les ventes en divisant par la marge d'une enceinte. Vérification sur l'atelier : au trimestre ${x.trimestre}, l'équipe des ${qte(x.operateurs - 1)} restés ne monte que ${qte(t2.equipe)} ${x.f.unites}, ${qte(t2.ventesPerdues)} de moins que le plan ; au trimestre ${x.trimestre + 1}, le remplaçant porte l'équipe à ${qte(t3.equipe)} pour ${qte(t3.demande)} demandées : rien ne s'y perd.`,
        ];
      },
    },
    {
      id: "ce-que-le-calcul-ne-compte-pas",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le coût du départ ne compte pas",
      notions: ["staff_turnover", "pay_and_motivation"],
      question: (c) => {
        const x = departDUnOperateur(c);
        return `Le chiffre de ${eur(x.auDepart.coutDuDepart)} sert à décider. Que la simulation du cours laisse-t-elle de côté, qui rendrait un vrai départ plus coûteux encore ?`;
      },
      options: (c) => {
        const x = departDUnOperateur(c);
        return [
          {
            texte: "Le savoir-faire qui part, et les autres opérateurs qui pourraient suivre",
            juste: true,
            retour: `Oui : la simulation ne fait partir qu'un opérateur, et ne fait payer que l'intégration du premier mois. Payés sous le seuil, les ${qte(x.operateurs - 1)} autres le sont aussi ; et un opérateur expérimenté emporte des tours de main que le remplaçant mettra plus d'un mois à retrouver. Le coût calculé est un minimum.`,
          },
          {
            texte: `La marge des ${qte(x.refuseesDuPlan)} ${x.f.unites} que l'outil refuse déjà au trimestre ${x.trimestre}`,
            juste: false,
            retour: "Non : elles sont refusées avec ou sans départ, parce que la ligne ne peut pas les monter. Les compter, ce serait imputer au départ ce qui vient de l'outil.",
          },
          {
            texte: "Les cotisations patronales des salaires non versés",
            juste: false,
            retour: `Non : elles y sont déjà. Les salaires non versés se comptent au coût de l'opérateur pour ${x.f.entreprise}, ${eur(x.coutMensuel)} par mois, cotisations comprises.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["staff_turnover", "pay_and_motivation", "capacity"],
      texte: (c) => {
        const x = departDUnOperateur(c);
        const d = x.auDepart;
        return [
          `Chez ${x.f.entreprise}, un salaire resté à ${eur(x.f.operateurs.salaireBrutMensuel)} tombe sous le seuil de démission quand le marché passe à ${eur(x.p.marche)}. Le départ, remplacé au départ, coûte ${eur(d.coutDuDepart)} : ${eur(d.margePerdue)} de marge perdue, parce que l'équipe devient le goulot au trimestre ${x.trimestre}, plus ${eur(d.recrutement)} de recrutement, moins ${eur(d.salairesNonVerses)} de salaires non versés. L'augmentation qui l'évitait coûtait ${eur(x.p.coutDeLAugmentationParAn)} sur l'année.`,
          `Le coût d'un départ se compte en entier, et il dépend de trois choses : des délais (préavis, recrutement, intégration), qui font la durée du poste vide ; de la date du recrutement, qui la raccourcit ; et de la demande, qui dit si l'équipe devient le goulot. Sur la demande de N, le même départ recruté dès l'annonce ne coûtait que ${eur(x.surNDesLAnnonce.coutDuDepart)}.`,
          "Au niveau de l'examen, vous savez situer un salaire face au marché et au seuil de démission, dérouler une équipe mois par mois, trouver le goulot d'un trimestre, chiffrer le coût complet d'un départ et le comparer à une augmentation, le retrouver à rebours, et dire ce que ce coût ne compte pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Coût d'un départ = marge perdue pendant que l'équipe est le goulot + coût du recrutement − salaires non versés. Il se compare au coût de l'augmentation qui l'aurait évité.",
    },
  ],
};
