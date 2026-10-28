import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_IMPOT, L_IMPOT_SUR_LES_SOCIETES, impotAuDelaDuPlafond, impotDeNova } from "../../chapitres/l-impot-sur-les-societes";
import { impotDuBenefice } from "../../monde/finance";
import { ACOMPTES, DEPENSE_DE_FIN_D_ANNEE, PLAFOND_DU_TAUX_REDUIT, TAUX_NORMAL, TAUX_REDUIT } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'IMPÔT SUR LES SOCIÉTÉS » : LA DÉPENSE DE FIN D'ANNÉE (fiscalité de
 * l'entreprise, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, sur l'exercice N+1 de NOVA (monde/projets-et-financement.ts) :
 * le gérant veut doubler un entretien en décembre (DEPENSE_DE_FIN_D_ANNEE, 4 800 €) « pour payer
 * moins d'impôt », et compte sur le taux réduit. L'élève refait le calcul : la dépense ne fait
 * économiser que le taux marginal, 25 %. Puis il remonte le calcul (au curseur, puis à rebours) : pour
 * ne plus avoir de solde à payer en mai, il faudrait dépenser 22 512 €, qui coûteraient 16 884 € de
 * résultat net pour 5 628 € d'impôt évité. La réponse demande un jugement : une dépense se décide sur
 * son utilité, pas sur l'impôt.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le rejeu de l'année avec la maintenance du trimestre 4 doublée, et la
 * branche « la dépense dépasse le bénéfice », qui ne se lisait dans aucune entreprise.
 */

/** Les bornes du curseur de la dépense, en euros. */
export const DEPENSE_DU_CURSEUR = { min: 0, max: 40_000 } as const;

export type Verdict = "le-taux-marginal" | "le-taux-reduit";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La dépense, l'impôt qu'elle fait économiser, et la dépense qui annulerait le solde. */
export function depenseDeFinDAnnee(c: Pick<Cas, "code">) {
  const x = impotDeNova(c);
  const depense = DEPENSE_DE_FIN_D_ANNEE;
  const beneficeAvec = auCentime(x.benefice - depense);
  const impotAvec = impotDuBenefice(beneficeAvec, x.eligible).impot;
  const economie = auCentime(x.impot - impotAvec);
  // Le calcul à rebours : la dépense qui ramène l'impôt aux acomptes, au taux marginal.
  const pourAnnulerLeSolde = Math.ceil(x.solde / TAUX_NORMAL - 1e-6);
  const impotPourAnnuler = impotDuBenefice(auCentime(x.benefice - pourAnnulerLeSolde), x.eligible).impot;
  const impotEvitePourAnnuler = auCentime(x.impot - impotPourAnnuler);
  const verdict: Verdict = economie === auCentime(depense * TAUX_NORMAL) ? "le-taux-marginal" : "le-taux-reduit";
  return {
    x,
    depense,
    beneficeAvec,
    impotAvec,
    economie,
    cout: auCentime(depense - economie),
    soldeAvec: auCentime(impotAvec - x.totalVerse),
    pourAnnulerLeSolde,
    impotEvitePourAnnuler,
    netPerduPourAnnuler: auCentime(pourAnnulerLeSolde - impotEvitePourAnnuler),
    verdict,
  };
}

export const LA_DEPENSE_DE_FIN_D_ANNEE: Situation = {
  code: "la-depense-de-fin-d-annee",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: [L_IMPOT_SUR_LES_SOCIETES.code],
  commanditaire: "Le gérant",
  titre: "La dépense de fin d'année",
  accroche:
    "Le gérant veut doubler un entretien en décembre, pour payer moins d'impôt, et compte sur le taux réduit. Ce que la dépense fait vraiment économiser, ce qu'il faudrait dépenser pour ne plus avoir de solde en mai, et ce que cela coûterait.",
  objectifs: [
    "Calculer l'impôt d'un exercice après une charge de plus, au taux marginal",
    "Calculer ce qu'une charge déductible coûte après impôt",
    "Remonter du solde à la dépense qui l'annulerait, et en chiffrer le coût",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_IMPOT, pourquoi: L_IMPOT_SUR_LES_SOCIETES.entreprises!.pourquoi },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `« Doublons l'entretien de décembre : ${eur(r.depense)} de charges en plus, autant de bénéfice en moins, et presque autant d'impôt en moins. Avec notre taux réduit de ${pct(TAUX_REDUIT * 100)}, elle ne nous coûtera presque rien. Et si nous dépensons assez, nous n'aurons plus de solde à payer en mai. »`,
          `Pas de cours cette fois : vous avez l'exercice ${dE(r.x.entreprise)} sans la dépense, et les calculs sont ceux du chapitre. L'entretien doublé ne changerait ni les ventes ni rien d'autre.`,
        ];
      },
      tableau: (c) => {
        const r = depenseDeFinDAnnee(c);
        return {
          titre: `L'exercice ${r.x.e.exercice} ${dE(r.x.entreprise)}, sans la dépense`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Résultat comptable avant impôt", valeurs: [eur(r.x.e.resultatComptable)] },
            { libelle: "Résultat fiscal", valeurs: [eur(r.x.benefice)] },
            { libelle: "Impôt sur les sociétés", valeurs: [eur(r.x.impot)] },
            { libelle: "Acomptes versés, sur l'impôt de N", valeurs: [eur(r.x.totalVerse)] },
            { libelle: `Taux réduit, jusqu'à ${eur(PLAFOND_DU_TAUX_REDUIT)}`, valeurs: [pct(TAUX_REDUIT * 100)] },
            { libelle: "Taux normal", valeurs: [pct(TAUX_NORMAL * 100)] },
            { libelle: "L'entretien de décembre en plus", valeurs: [eur(r.depense)] },
          ],
        };
      },
      repere: () => "À rendre : ce que la dépense fait économiser et ce qu'elle coûte, ce qu'il faudrait dépenser pour ne plus avoir de solde, et votre réponse.",
    },
    {
      id: "economie",
      type: "montants",
      titre: "L'impôt économisé",
      notions: ["income_statement"],
      question: () => "Calculez le résultat fiscal avec la dépense, l'impôt avec la dépense, l'impôt économisé, puis ce que la dépense coûte après impôt.",
      champs: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          { libelle: "Résultat fiscal avec la dépense", attendu: r.beneficeAvec, calcul: `${eur(r.x.benefice)} − ${eur(r.depense)} = ${eur(r.beneficeAvec)}` },
          {
            libelle: "Impôt avec la dépense",
            attendu: r.impotAvec,
            calcul: `${eur(PLAFOND_DU_TAUX_REDUIT)} × ${pct(TAUX_REDUIT * 100)} + (${eur(r.beneficeAvec)} − ${eur(PLAFOND_DU_TAUX_REDUIT)}) × ${pct(TAUX_NORMAL * 100)} = ${eur(r.impotAvec)}`,
          },
          { libelle: "Impôt économisé", attendu: r.economie, calcul: `${eur(r.x.impot)} − ${eur(r.impotAvec)} = ${eur(r.economie)}` },
          { libelle: "Coût de la dépense après impôt", attendu: r.cout, calcul: `${eur(r.depense)} − ${eur(r.economie)} = ${eur(r.cout)}` },
        ];
      },
      explication: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `L'impôt ne paie que ${pct(TAUX_NORMAL * 100)} de la dépense, ${eur(r.economie)}, et pas ${pct(TAUX_REDUIT * 100)} : la dépense retire les derniers euros du bénéfice, ceux qui paient le taux normal. ${r.x.entreprise} paie le reste, ${eur(r.cout)}, sur son résultat net. Le solde de mai passe de ${eur(r.x.solde)} à ${eur(r.soldeAvec)}.`,
        ];
      },
    },
    {
      id: "le-solde-au-curseur",
      type: "curseur",
      titre: "Dépenser pour ne plus avoir de solde",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const r = depenseDeFinDAnnee(c);
        return `Le gérant veut ne plus rien devoir le ${ACOMPTES.dateDuSolde}. Faites varier la dépense de décembre, de ${eur(DEPENSE_DU_CURSEUR.min)} à ${eur(DEPENSE_DU_CURSEUR.max)}. Une droite donne les acomptes déjà versés (${eur(r.x.totalVerse)}), l'autre l'impôt avec la dépense. Placez le curseur sur la plus petite dépense où les acomptes couvrent l'impôt, puis validez.`;
      },
      grandeur: () => ({ libelle: "Dépense de décembre", unite: "€" }),
      cible: (c) => ({ attendu: depenseDeFinDAnnee(c).pourAnnulerLeSolde, min: DEPENSE_DU_CURSEUR.min, max: DEPENSE_DU_CURSEUR.max }),
      zones: ["Plus de solde à payer", "Un solde à payer en mai"],
      rates: () => ({
        dessous: "À cette position, il reste un solde à payer en mai.",
        dessus: "Une dépense plus petite suffit déjà : cherchez la plus petite.",
      }),
      montrer: "Montrer la dépense",
      lecture: (c, d) => {
        const r = depenseDeFinDAnnee(c);
        const impot = impotDuBenefice(auCentime(r.x.benefice - d), r.x.eligible).impot;
        return [
          { libelle: "Impôt avec la dépense", montant: impot },
          { libelle: `Solde du ${ACOMPTES.dateDuSolde}`, montant: auCentime(impot - r.x.totalVerse) },
          { libelle: "Impôt économisé", montant: auCentime(r.x.impot - impot) },
          { libelle: "Résultat net en moins", montant: auCentime(d - (r.x.impot - impot)), fort: true },
        ];
      },
      droites: (c) => {
        const r = depenseDeFinDAnnee(c);
        return { produit: () => r.x.totalVerse, cout: (d) => impotAuDelaDuPlafond(r.x.benefice - d), libelles: ["Acomptes déjà versés", "Impôt avec la dépense"] };
      },
      explication: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `Il faudrait dépenser ${eur(r.pourAnnulerLeSolde)} en décembre pour ne plus rien devoir en mai : chaque euro de dépense n'efface que ${pct(TAUX_NORMAL * 100)} d'un euro de solde. Le résultat net baisserait de ${eur(r.netPerduPourAnnuler)} pour éviter ${eur(r.impotEvitePourAnnuler)} d'impôt.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le prix d'un solde nul",
      notions: ["income_statement", "cash_budget"],
      question: () => "Retrouvez par le calcul la dépense de décembre qui annulerait le solde de mai, l'impôt qu'elle ferait économiser, puis la baisse du résultat net qu'elle coûterait.",
      champs: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          {
            libelle: "Dépense qui annule le solde",
            attendu: r.pourAnnulerLeSolde,
            calcul: `le solde divisé par le taux marginal : ${eur(r.x.solde)} ÷ ${pct(TAUX_NORMAL * 100)} = ${eur(r.pourAnnulerLeSolde)}`,
          },
          { libelle: "Impôt économisé par cette dépense", attendu: r.impotEvitePourAnnuler, calcul: `${eur(r.pourAnnulerLeSolde)} × ${pct(TAUX_NORMAL * 100)} = ${eur(r.impotEvitePourAnnuler)}, le solde entier` },
          { libelle: "Baisse du résultat net", attendu: r.netPerduPourAnnuler, calcul: `${eur(r.pourAnnulerLeSolde)} − ${eur(r.impotEvitePourAnnuler)} = ${eur(r.netPerduPourAnnuler)}` },
        ];
      },
      explication: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          `Le solde n'est pas un impôt de plus : c'est la part de l'impôt de ${r.x.e.exercice} que les acomptes, calculés sur N, n'ont pas payée. Le faire disparaître par une dépense revient à payer ${eur(r.pourAnnulerLeSolde)} pour ne pas payer ${eur(r.impotEvitePourAnnuler)}. Le résultat fiscal restant au-dessus de ${eur(PLAFOND_DU_TAUX_REDUIT)}, tout le calcul se fait au taux marginal.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = depenseDeFinDAnnee(c);
        return [
          {
            texte: `Seulement si l'entretien sert : il coûte ${eur(r.cout)} après impôt`,
            juste: r.verdict === "le-taux-marginal",
            retour:
              r.verdict === "le-taux-marginal"
                ? `Oui : ${eur(r.depense)} d'entretien font ${eur(r.economie)} d'impôt en moins, ${pct(TAUX_NORMAL * 100)} au taux marginal, et ${eur(r.cout)} de résultat net en moins. Une dépense se décide sur ce qu'elle apporte ; l'impôt n'en paie qu'un quart.`
                : `Non : au taux réduit, la dépense coûterait ${eur(r.cout)} après impôt.`,
          },
          {
            texte: `Faites-la : ${eur(r.depense)} de charges, ce sont ${eur(r.depense)} d'impôt en moins`,
            juste: false,
            retour: `Non : un euro de charge retire un euro au bénéfice, et seulement ${pct(TAUX_NORMAL * 100)} à l'impôt : ${eur(r.economie)} ici.`,
          },
          {
            texte: `Elle est utile, mais au taux réduit elle ne fait économiser que ${eur(auCentime(r.depense * TAUX_REDUIT))}`,
            juste: r.verdict === "le-taux-reduit",
            retour: `Non : le bénéfice ${dE(r.x.entreprise)}, ${eur(r.x.benefice)}, dépasse de loin ${eur(PLAFOND_DU_TAUX_REDUIT)}. La dépense retire des euros taxés à ${pct(TAUX_NORMAL * 100)}, et fait économiser ${eur(r.economie)}.`,
          },
          {
            texte: `Dépensez plutôt ${eur(r.pourAnnulerLeSolde)} : nous n'aurons plus de solde à payer en mai`,
            juste: false,
            retour: `Non : ${eur(r.pourAnnulerLeSolde)} de dépense pour ${eur(r.impotEvitePourAnnuler)} d'impôt évité, c'est ${eur(r.netPerduPourAnnuler)} de résultat net en moins. Le solde n'est que l'impôt de l'année que les acomptes n'ont pas encore payé.`,
          },
        ];
      },
    },
  ],
};
