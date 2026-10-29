import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { remuneration } from "../../chapitres/remuneration-et-motivation";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES, TAUX_PATRONAL, remunerationDeNPlus1 } from "../../monde/ressources-humaines-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉMUNÉRATION ET MOTIVATION » : L'ÉQUIPE DEMANDE UNE AUGMENTATION
 * (Bac STMG, ressources humaines, palier 1).
 *
 * En janvier de N + 1, les opérateurs de NOVA demandent ensemble des salaires 10 % plus hauts : le
 * marché a monté, disent-ils, et ils le savent. La gérante veut savoir ce que la hausse coûterait sur
 * l'année, où elle placerait l'équipe face au marché, et si elle coûte moins que le départ qu'un
 * refus risque de provoquer. L'élève refait les calculs du chapitre pour la hausse demandée, puis
 * répond.
 *
 * Le cas est neuf par sa question : le chapitre cherche l'augmentation qui garde l'équipe, le cas
 * chiffre celle que l'équipe demande. Le salaire, le marché, le seuil de démission et le coût du
 * départ sont ceux du chapitre (`remuneration`), dans le monde du cours ; seule la hausse demandée est
 * posée ci-dessous.
 *
 * CE QUI A CHANGÉ. Le cas rejouait l'année de l'arène avec des salaires 10 % plus hauts, dont le
 * moteur tirait la motivation ; il se joue chez NOVA : 12 780 € par an, contre 24 975 € pour un
 * départ.
 */

/** La hausse que demandent les opérateurs : 10 % du salaire brut, l'ordre de grandeur d'un rattrapage du marché. */
export const HAUSSE_DEMANDEE = 0.1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les mois d'une année. */
const MOIS = 12;

/** La hausse demandée : son coût sur l'année, la place de l'équipe face au marché, et le départ qu'elle évite. */
export function hausseDemandee(_c?: Cas) {
  const r0 = remuneration();
  const augmentation = Math.round(r0.salaire * HAUSSE_DEMANDEE * 100) / 100;
  const r = remunerationDeNPlus1(augmentation);
  const auSeuil = remunerationDeNPlus1(r0.augmentationAuSeuil);
  return {
    r0,
    r,
    augmentation,
    partApres: auDixieme(r.part * 100),
    coutAuSeuil: auSeuil.coutDeLAugmentation,
    // Les erreurs classiques : oublier les cotisations patronales, ou ne compter qu'un mois.
    sansLesPatronales: Math.round(augmentation * MOIS * r.operateurs * 100) / 100,
  };
}

export const L_EQUIPE_DEMANDE_UNE_AUGMENTATION: Situation = {
  code: "l-equipe-demande-une-augmentation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["remuneration-et-motivation"],
  commanditaire: "La gérante",
  titre: "L'équipe demande une augmentation",
  accroche: `Les opérateurs demandent des salaires ${pct(HAUSSE_DEMANDEE * 100)} plus hauts : le marché a monté. Ce que la hausse coûte sur l'année, où elle place l'équipe face au marché, et le départ qu'elle évite.`,
  objectifs: [
    "Calculer le coût d'une hausse de salaire sur l'année, cotisations comprises",
    "Situer le salaire augmenté face au marché",
    "Comparer le coût d'une hausse à celui d'un départ",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend les opérateurs de NOVA et le marché de N + 1, ceux du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: () => {
        const k = hausseDemandee();
        return [
          `« Les ${k.r.operateurs} opérateurs me demandent ensemble ${pct(HAUSSE_DEMANDEE * 100)} de plus sur leur salaire brut, dès janvier. Avant de leur répondre, je veux savoir ce que cela coûterait sur l'année, où cela nous placerait face au marché, et si c'est moins cher que de voir l'un d'eux partir. » La gérante`,
          "Pas de cours cette fois : vous avez les chiffres du chapitre, et sa méthode.",
        ];
      },
      tableau: () => {
        const k = hausseDemandee();
        return {
          titre: "Les opérateurs de NOVA en N + 1",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Salaire brut d'un opérateur, par mois", valeurs: [eur(k.r0.salaire)] },
            { libelle: "Salaire du marché, par mois", valeurs: [eur(k.r0.marcheNPlus1)] },
            { libelle: "Seuil de démission (part du marché)", valeurs: [pct(k.r0.seuilPct)] },
            { libelle: "Taux des cotisations patronales", valeurs: [pct(TAUX_PATRONAL * 100)] },
            { libelle: "Coût d'un départ, calculé au chapitre", valeurs: [eur(k.r0.coutDuDepart)] },
          ],
        };
      },
      repere: () => "À rendre : la hausse par mois, son coût sur l'année, la part du marché qu'elle donne, et votre réponse.",
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que coûte la hausse",
      notions: ["pay_and_motivation", "payroll"],
      question: () =>
        "Calculez la hausse du brut d'un opérateur par mois, son coût sur l'année pour toute l'équipe, cotisations patronales comprises, puis la part du marché que paierait le salaire augmenté (au dixième).",
      champs: () => {
        const k = hausseDemandee();
        return [
          { libelle: "Hausse du brut par mois", attendu: k.augmentation, calcul: `${eur(k.r0.salaire)} × ${pct(HAUSSE_DEMANDEE * 100)} = ${eur(k.augmentation)}`, tolerance: 0.01 },
          { libelle: "Coût de la hausse sur l'année", attendu: k.r.coutDeLAugmentation, calcul: `${eur(k.augmentation)} × ${MOIS} × ${k.r.operateurs} × ${(1 + TAUX_PATRONAL).toLocaleString("fr-FR")} = ${eur(k.r.coutDeLAugmentation)}`, tolerance: 1 },
          { libelle: "Part du marché après la hausse (%)", attendu: k.partApres, calcul: `${eur(k.r.salaire)} ÷ ${eur(k.r0.marcheNPlus1)} × 100 = ${pct(k.partApres)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = hausseDemandee();
        return [
          `Avec la hausse, NOVA paierait ${pct(k.partApres)} du marché : bien au-dessus du seuil de ${pct(k.r0.seuilPct)}, et même au-dessus du marché. L'augmentation au seuil, ${eur(k.r0.augmentationAuSeuil)} par mois, aurait coûté ${eur(k.coutAuSeuil)} sur l'année.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "La hausse demandée coûte-t-elle moins qu'un départ ? Que répondez-vous à la gérante ?",
      options: () => {
        const k = hausseDemandee();
        const moins = k.r.coutDeLAugmentation < k.r0.coutDuDepart;
        return [
          {
            texte: `${moins ? "Oui" : "Non"} : ${eur(k.r.coutDeLAugmentation)} par an, contre ${eur(k.r0.coutDuDepart)} pour un départ`,
            juste: true,
            retour: `${moins ? "Oui" : "Non"} : ${eur(k.augmentation)} par mois, ${MOIS} mois, ${k.r.operateurs} opérateurs, cotisations patronales comprises. ${moins ? `La hausse coûte moins qu'un départ et place l'équipe au-dessus du marché ; ${eur(k.r0.augmentationAuSeuil)} par mois suffiraient à la garder, pour ${eur(k.coutAuSeuil)}, mais au plus près du seuil : au moindre mouvement du marché, un opérateur repartirait.` : "La hausse coûte plus qu'un départ."}`,
          },
          {
            texte: `Oui : ${eur(k.sansLesPatronales)} par an, contre ${eur(k.r0.coutDuDepart)} pour un départ`,
            juste: false,
            retour: `Non : ce montant oublie les cotisations patronales. Une hausse du brut fait monter aussi ce que l'entreprise paie en plus du salaire : ${eur(k.r.coutDeLAugmentation)} en tout.`,
          },
          {
            texte: `Non : une hausse de ${pct(HAUSSE_DEMANDEE * 100)} pour toute l'équipe coûte forcément plus que le départ d'un seul opérateur`,
            juste: false,
            retour: `Non : un départ ne coûte pas qu'un salaire. Il fait perdre des ventes le temps que le poste reste vide, et il faut payer le recrutement : ${eur(k.r0.coutDuDepart)}, contre ${eur(k.r.coutDeLAugmentation)} pour la hausse.`,
          },
        ];
      },
    },
  ],
};
