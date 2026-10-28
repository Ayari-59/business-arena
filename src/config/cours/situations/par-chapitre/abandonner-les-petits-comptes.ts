import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_PORTEFEUILLE, portefeuilleABC } from "../../chapitres/portefeuille-abc";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PORTEFEUILLE CLIENTS : LA MÉTHODE ABC » : ABANDONNER LES PETITS
 * COMPTES ? (BTS NDRC, palier 4).
 *
 * Le directeur commercial d'ATLAS CONSEIL veut cesser de servir les 16 comptes de la classe C, et
 * reporter le temps gagné sur les comptes A, dont il espère 5 % de ventes en plus. L'élève refait seul
 * le chemin du chapitre : le classement en trois classes, ce que pèsent les comptes C en chiffre
 * d'affaires et en marge, la hausse sur les A qui compenserait leur perte (au curseur, puis au
 * calcul), et ce que rapporterait la hausse espérée. Puis il croise les deux marges du cabinet : la
 * marge d'un compte compte le temps des consultants à 220 € la journée, comme s'il disparaissait avec le
 * compte ; or les consultants sont payés de toute façon. Les journées libérées par les C ne valent que
 * si la hausse des A les reprend : celles qui restent sans emploi alourdissent la perte. La réponse
 * demande un jugement : garder les C, mais les servir autrement.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : son
 * portefeuille et ses classes sont ceux de `portefeuilleABC`, sur la fiche du cabinet. Il ne lit du cas
 * que son code.
 */

/**
 * Ce que le directeur espère du temps rendu aux comptes A : 5 % de ventes en plus, au même prix et au même
 * taux de marge, donc 5 % de journées en plus. C'est l'effet qu'on prête d'ordinaire à une visite de plus
 * par trimestre chez un gros client ; le cas calcule aussi la hausse qu'il faudrait pour compenser.
 */
export const HAUSSE_ESPEREE_SUR_LES_A = 0.05;

/** Les bornes du curseur de la hausse sur les comptes A, en pourcentage de leurs ventes. */
export const HAUSSE_DU_CURSEUR = { min: 0, max: 15 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (part: number, chiffres = 1) => `${(Math.round(part * 100 * 10 ** chiffres) / 10 ** chiffres + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (part: number) => Math.round(part * 1000) / 10 + 0;
const somme = (v: readonly number[]) => v.reduce((t, x) => t + x, 0);

export type Verdict = "garder-les-c" | "abandonner-les-c";

/** Le portefeuille classé, et le bilan de l'abandon des comptes C. */
export function abandonDesComptesC(c: Pick<Cas, "code">) {
  const p = portefeuilleABC(c);
  const A = p.parCa.classes.A;
  const C = p.parCa.classes.C;
  const caA = somme(A.map((k) => k.chiffreDAffaires));
  const margeA = somme(A.map((k) => k.marge));
  const journeesA = somme(A.map((k) => k.journees));
  const caC = somme(C.map((k) => k.chiffreDAffaires));
  const margeC = somme(C.map((k) => k.marge));
  const fraisC = somme(C.map((k) => k.frais));
  const journeesC = somme(C.map((k) => k.journees));
  // Des ventes en plus sur les comptes A, au même taux de marge : la marge monte d'autant.
  const gainSurLesA = auCentime(margeA * HAUSSE_ESPEREE_SUR_LES_A);
  const bilan = auCentime(gainSurLesA - margeC);
  const hausseNecessaire = margeC / margeA;
  // Le croisement des deux marges : les journées de consultant libérées par les C, celles que la hausse
  // des A reprend (au même prix, autant de journées en plus que de ventes), et celles qui restent payées
  // sans emploi. La marge d'un compte les comptait comme une économie ; elles n'en sont pas une.
  const journeesDemandeesParLesA = Math.round(journeesA * HAUSSE_ESPEREE_SUR_LES_A * 100) / 100;
  const journeesSansEmploi = Math.round((journeesC - journeesDemandeesParLesA) * 100) / 100;
  const coutDesJourneesSansEmploi = auCentime(Math.max(0, journeesSansEmploi) * p.coutJournalier);
  const bilanReel = auCentime(bilan - coutDesJourneesSansEmploi);
  const verdict: Verdict = bilan < 0 ? "garder-les-c" : "abandonner-les-c";
  return {
    p,
    hausse: HAUSSE_ESPEREE_SUR_LES_A,
    comptesA: A.length,
    comptesB: p.parCa.classes.B.length,
    comptesC: C.length,
    caA,
    margeA,
    journeesA,
    caC,
    margeC,
    fraisC,
    journeesC,
    partDuCaC: caC / p.total,
    partDeLaMargeC: margeC / p.margeTotale,
    gainSurLesA,
    bilan,
    hausseNecessaire,
    hausseEntiere: Math.ceil(hausseNecessaire * 100 - 1e-9),
    journeesDemandeesParLesA,
    journeesSansEmploi,
    coutDesJourneesSansEmploi,
    bilanReel,
    // La même perte, en marge sur coût variable : ce que les C laissent une fois payés leurs frais, face à ce
    // que la hausse des A rapporte une fois payés les siens. Les consultants n'y entrent pas.
    margeSurCoutVariableDesC: auCentime(caC - fraisC),
    margeSurCoutVariableEnPlusSurLesA: auCentime((caA - somme(A.map((k) => k.frais))) * HAUSSE_ESPEREE_SUR_LES_A),
    // Les erreurs classiques : compter la hausse en chiffre d'affaires, et croire économiser les consultants.
    ventesEnPlusSurLesA: auCentime(caA * HAUSSE_ESPEREE_SUR_LES_A),
    consultantsCruEconomises: auCentime(journeesC * p.coutJournalier),
    verdict,
  };
}

/** Le portefeuille par chiffre d'affaires décroissant, avec la marge de chaque compte : le document du cas. */
function tableauDesComptes(c: Pick<Cas, "code">): TableauDeDonnees {
  const { p } = abandonDesComptesC(c);
  return {
    titre: `Les comptes de l'année N, par chiffre d'affaires décroissant · ${p.entreprise}`,
    colonnes: ["Journées", "Chiffre d'affaires", "Marge du compte"],
    lignes: p.parCa.comptes.map((k) => ({ libelle: `${qte(k.rang)}. ${k.nom}`, valeurs: [qte(k.journees), eur(k.chiffreDAffaires), eur(k.marge)] })),
  };
}

export const ABANDONNER_LES_PETITS_COMPTES: Situation = {
  code: "abandonner-les-petits-comptes",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["portefeuille-abc"],
  commanditaire: "Le directeur commercial",
  titre: "Abandonner les petits comptes ?",
  accroche:
    "Le directeur commercial veut cesser de servir les comptes C pour se consacrer aux comptes A. Classer le portefeuille, chiffrer ce qu'on perdrait et ce qu'on espère, vérifier ce que deviennent les journées des consultants, puis lui répondre.",
  objectifs: [
    "Classer un portefeuille en classes A, B et C",
    "Mesurer ce que pèse une classe en chiffre d'affaires et en marge",
    "Trouver la hausse qui compenserait une perte, et la comparer à la hausse espérée",
    "Croiser la marge d'un compte et la marge sur coût variable : ce que coûtent des consultants sans emploi",
    "Rédiger une réponse chiffrée au directeur commercial",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PORTEFEUILLE,
    pourquoi:
      "ce cas reprend le chapitre « Le portefeuille clients : la méthode ABC », qui classe le vrai portefeuille d'ATLAS CONSEIL, le cabinet de la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur commercial",
      tableau: tableauDesComptes,
      texte: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `« Nos plus petits comptes nous prennent du temps pour pas grand-chose. Je propose de ne plus servir ceux de la classe C, et de reporter ce temps sur les comptes A : j'en espère ${pct(r.hausse, 0)} de ventes en plus, au même prix. Faites le classement, et dites-moi si ${r.p.entreprise} y gagne. »`,
          `Pas de cours cette fois : vous avez les comptes de l'année N et leur marge (chiffre d'affaires − frais − journées × ${eur(r.p.coutJournalier)}, le coût d'une journée de consultant). Les consultants sont payés de toute façon. La méthode est celle du chapitre, à vous de l'enchaîner. Tout est hors taxes.`,
        ];
      },
      repere: (c) => {
        const { p } = abandonDesComptesC(c);
        return `À rendre : le classement (A jusqu'à ${pct(p.seuils.a, 0)} du chiffre d'affaires cumulé, B jusqu'à ${pct(p.seuils.b, 0)}, C le reste), ce que pèsent les comptes C, la hausse sur les A qui les compenserait, ce que deviennent les journées des consultants, et votre réponse.`;
      },
    },
    {
      id: "les-classes",
      type: "montants",
      titre: "Les trois classes",
      notions: ["customer_portfolio"],
      question: (c) => {
        const { p } = abandonDesComptesC(c);
        return `Cumulez les parts du chiffre d'affaires dans l'ordre du tableau, et comptez les comptes de chaque classe : A jusqu'à ${pct(p.seuils.a, 0)}, B jusqu'à ${pct(p.seuils.b, 0)}, C au-delà.`;
      },
      champs: (c) => {
        const r = abandonDesComptesC(c);
        const p = r.p;
        const dernier = (x: "A" | "B") => p.parCa.classes[x].at(-1)!;
        return [
          { libelle: "Comptes en classe A", attendu: r.comptesA, calcul: `Jusqu'au ${qte(dernier("A").rang)}e compte, ${dernier("A").nom} : ${pct(dernier("A").cumul)} ; le suivant passe à ${pct(p.parCa.classes.B[0]!.cumul)}` },
          { libelle: "Comptes en classe B", attendu: r.comptesB, calcul: `Du ${qte(p.parCa.classes.B[0]!.rang)}e au ${qte(dernier("B").rang)}e compte, ${dernier("B").nom} : ${pct(dernier("B").cumul)}` },
          { libelle: "Comptes en classe C", attendu: r.comptesC, calcul: `Du ${qte(p.parCa.classes.C[0]!.rang)}e au ${qte(p.comptes)}e compte : ${qte(p.comptes)} − ${qte(r.comptesA)} − ${qte(r.comptesB)} = ${qte(r.comptesC)}` },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [`${qte(r.comptesA)} comptes en A, ${qte(r.comptesB)} en B, ${qte(r.comptesC)} en C : la moitié du portefeuille. Ce sont ces ${qte(r.comptesC)} comptes que le directeur propose de ne plus servir.`];
      },
    },
    {
      id: "poids-des-c",
      type: "montants",
      titre: "Ce que pèsent les comptes C",
      notions: ["customer_portfolio", "contribution_margin"],
      question: () => "Calculez le chiffre d'affaires des comptes C et sa part dans le total, puis leur marge et sa part dans la marge de tous les comptes, en pourcentage au dixième.",
      champs: (c) => {
        const r = abandonDesComptesC(c);
        return [
          { libelle: "Chiffre d'affaires des comptes C", attendu: r.caC, calcul: `La somme des ${qte(r.comptesC)} comptes C = ${eur(r.caC)}` },
          { libelle: "Part du chiffre d'affaires (%)", attendu: auDixieme(r.partDuCaC), tolerance: 0.1, calcul: `${eur(r.caC)} ÷ ${eur(r.p.total)} × 100 = ${pct(r.partDuCaC)}` },
          { libelle: "Marge des comptes C", attendu: r.margeC, calcul: `La somme des marges des ${qte(r.comptesC)} comptes C = ${eur(r.margeC)}` },
          { libelle: "Part de la marge (%)", attendu: auDixieme(r.partDeLaMargeC), tolerance: 0.1, calcul: `${eur(r.margeC)} ÷ ${eur(r.p.margeTotale)} × 100 = ${pct(r.partDeLaMargeC)}` },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `Les comptes C font peu de chiffre d'affaires (${pct(r.partDuCaC)}), mais ils laissent ${eur(r.margeC)} de marge : leur taux de marge (${pct(r.margeC / r.caC)}) est plus haut que celui du portefeuille (${pct(r.p.tauxDeMargeDuPortefeuille)}). Les abandonner, c'est renoncer à cette somme : il faut la retrouver ailleurs.`,
        ];
      },
    },
    {
      id: "la-hausse-qui-compense",
      type: "curseur",
      titre: "La hausse qui compenserait",
      notions: ["customer_portfolio", "contribution_margin"],
      question: (c) => {
        const r = abandonDesComptesC(c);
        return `Faites varier la hausse des ventes des comptes A, au même taux de marge. Une droite donne la marge qu'elle leur ajoute (une part des ${eur(r.margeA)} des comptes A), l'autre la marge perdue avec les comptes C (${eur(r.margeC)}). Placez le curseur sur la plus petite hausse, au pourcentage entier, qui compense la perte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Hausse des ventes des comptes A", unite: "%" }),
      cible: (c) => ({ attendu: abandonDesComptesC(c).hausseEntiere, min: HAUSSE_DU_CURSEUR.min, max: HAUSSE_DU_CURSEUR.max }),
      lecture: (c, h) => {
        const r = abandonDesComptesC(c);
        const enPlus = auCentime((r.margeA * h) / 100);
        return [
          { libelle: "Ventes en plus sur les comptes A", montant: auCentime((r.caA * h) / 100) },
          { libelle: "Marge en plus sur les comptes A", montant: enPlus },
          { libelle: "Marge perdue avec les comptes C", montant: r.margeC },
          { libelle: "Bilan de la proposition", montant: auCentime(enPlus - r.margeC), fort: true },
        ];
      },
      droites: (c) => {
        const r = abandonDesComptesC(c);
        return {
          produit: (h) => (r.margeA * h) / 100,
          cout: () => r.margeC,
          libelles: ["Marge en plus sur les comptes A", "Marge perdue avec les comptes C"],
        };
      },
      zones: ["L'abandon se paie", "L'abandon fait perdre"],
      rates: () => ({
        dessous: "À cette hausse, la marge gagnée sur les A ne rend pas encore celle des C.",
        dessus: "Une hausse plus petite compense déjà la perte : cherchez la plus petite.",
      }),
      montrer: "Montrer la hausse nécessaire",
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `Il faudrait ${qte(r.hausseEntiere)} % de ventes en plus sur les comptes A, au pourcentage entier, pour rendre les ${eur(r.margeC)} des comptes C ; le directeur en espère ${pct(r.hausse, 0)}.`,
        ];
      },
    },
    {
      id: "hausse-sur-les-a",
      type: "montants",
      titre: "Ce que rapporterait la hausse espérée",
      notions: ["customer_portfolio", "contribution_margin"],
      question: (c) => {
        const r = abandonDesComptesC(c);
        return `Calculez la marge des comptes A, la marge en plus si leurs ventes montent de ${pct(r.hausse, 0)} (au même taux de marge), le bilan de la proposition (marge en plus sur les A − marge perdue sur les C ; négatif pour une perte), puis la hausse exacte des ventes des A qui compenserait la perte, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const r = abandonDesComptesC(c);
        return [
          { libelle: "Marge des comptes A", attendu: r.margeA, calcul: `${r.p.parCa.classes.A.map((k) => eur(k.marge)).join(" + ")} = ${eur(r.margeA)}` },
          { libelle: "Marge en plus sur les comptes A", attendu: r.gainSurLesA, calcul: `${eur(r.margeA)} × ${pct(r.hausse, 0)} = ${eur(r.gainSurLesA)}` },
          { libelle: "Bilan de la proposition", attendu: r.bilan, calcul: `${eur(r.gainSurLesA)} − ${eur(r.margeC)} = ${eur(r.bilan)}` },
          { libelle: "Hausse nécessaire sur les comptes A (%)", attendu: auDixieme(r.hausseNecessaire), tolerance: 0.1, calcul: `${eur(r.margeC)} ÷ ${eur(r.margeA)} × 100 = ${pct(r.hausseNecessaire)}` },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          r.bilan < 0
            ? `La hausse espérée sur les A rapporterait ${eur(r.gainSurLesA)} de marge, quand les comptes C en laissent ${eur(r.margeC)} : ${r.p.entreprise} perdrait ${eur(-r.bilan)} sur l'année. Pour compenser, il faudrait ${pct(r.hausseNecessaire)} de ventes en plus sur les A, pas ${pct(r.hausse, 0)}.`
            : `La hausse espérée sur les A rapporterait ${eur(r.gainSurLesA)} de marge, plus que les ${eur(r.margeC)} des comptes C : ${r.p.entreprise} y gagnerait ${eur(r.bilan)}.`,
        ];
      },
    },
    {
      id: "le-temps-des-consultants",
      type: "montants",
      titre: "Les journées des consultants",
      notions: ["contribution_margin", "fixed_costs", "capacity"],
      question: (c) => {
        const r = abandonDesComptesC(c);
        return `La marge d'un compte retire ses journées au coût d'un consultant, ${eur(r.p.coutJournalier)}, comme si ce coût partait avec le compte. Or les consultants sont payés de toute façon : leurs journées libérées ne valent que si la hausse des A les reprend. Calculez les journées des comptes C, celles que demanderaient ${pct(r.hausse, 0)} de ventes en plus sur les A (au même prix), celles qui resteraient sans emploi, puis le bilan de la proposition une fois payées ces journées (négatif pour une perte).`;
      },
      champs: (c) => {
        const r = abandonDesComptesC(c);
        return [
          { libelle: "Journées des comptes C", attendu: r.journeesC, calcul: `La somme des journées des ${qte(r.comptesC)} comptes C = ${qte(r.journeesC)}` },
          { libelle: "Journées que demanderait la hausse sur les A", attendu: r.journeesDemandeesParLesA, calcul: `${qte(r.journeesA)} × ${pct(r.hausse, 0)} = ${qte(r.journeesDemandeesParLesA)}` },
          { libelle: "Journées de consultant sans emploi", attendu: r.journeesSansEmploi, calcul: `${qte(r.journeesC)} − ${qte(r.journeesDemandeesParLesA)} = ${qte(r.journeesSansEmploi)}` },
          {
            libelle: "Bilan, une fois payées ces journées",
            attendu: r.bilanReel,
            calcul: `${eur(r.bilan)} − ${qte(r.journeesSansEmploi)} × ${eur(r.p.coutJournalier)} = ${eur(r.bilan)} − ${eur(r.coutDesJourneesSansEmploi)} = ${eur(r.bilanReel)}`,
          },
        ];
      },
      explication: (c) => {
        const r = abandonDesComptesC(c);
        return [
          `Comparer des marges de comptes suppose que les journées libérées par les C servent ailleurs. ${qte(r.journeesDemandeesParLesA)} des ${qte(r.journeesC)} journées servent la hausse des A ; les ${qte(r.journeesSansEmploi)} qui restent sont payées sans rien rapporter. La perte monte à ${eur(-r.bilanReel)}.`,
          `C'est la même perte en marge sur coût variable, où les consultants n'entrent pas : ${eur(r.margeSurCoutVariableEnPlusSurLesA)} gagnés sur les A, contre ${eur(r.margeSurCoutVariableDesC)} perdus sur les C. La marge d'un compte sert à classer ; pour décider d'un abandon, on regarde ce qui disparaît vraiment avec lui.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      question: () => "Quelle phrase envoyez-vous au directeur commercial ?",
      options: (c) => {
        const r = abandonDesComptesC(c);
        const garder = r.verdict === "garder-les-c";
        return [
          {
            texte: garder ? `Garder les C : ils laissent ${eur(r.margeC)}, la hausse sur les A ${eur(r.gainSurLesA)}` : `Abandonner les C : ${eur(r.gainSurLesA)} espérés sur les A, contre ${eur(r.margeC)}`,
            juste: true,
            retour: garder
              ? `Oui : il faudrait ${pct(r.hausseNecessaire)} de ventes en plus sur les comptes A pour retrouver la marge des comptes C ; vous en espérez ${pct(r.hausse, 0)}. Et les ${qte(r.journeesSansEmploi)} journées de consultant que la hausse ne reprendrait pas porteraient la perte à ${eur(-r.bilanReel)}. Mieux vaut servir les comptes C à distance, à moindre coût, que les perdre.`
              : `Oui : il suffirait de ${pct(r.hausseNecessaire)} de ventes en plus sur les comptes A pour retrouver la marge des comptes C ; vous en espérez ${pct(r.hausse, 0)}.`,
          },
          {
            texte: `Les abandonner : les comptes C ne font que ${pct(r.partDuCaC)} de nos ventes`,
            juste: false,
            retour: `Non : une petite part du chiffre d'affaires n'est pas rien. Ces ${pct(r.partDuCaC)} laissent ${eur(r.margeC)} de marge, qu'il faut comparer à ce qu'on espère gagner ailleurs : ${eur(r.gainSurLesA)}.`,
          },
          {
            texte: `Les abandonner : ${eur(r.ventesEnPlusSurLesA)} de ventes en plus sur les comptes A`,
            juste: false,
            retour: `Non : ${eur(r.ventesEnPlusSurLesA)}, c'est du chiffre d'affaires ; il se compare à ce que les comptes C laissent en marge, pas à leurs ventes. En marge, la hausse sur les A rapporte ${eur(r.gainSurLesA)}, contre ${eur(r.margeC)} perdus sur les C.`,
          },
          {
            texte: `Les abandonner : leurs ${qte(r.journeesC)} journées libèrent ${eur(r.consultantsCruEconomises)} de consultants`,
            juste: false,
            retour: `Non : les consultants sont payés de toute façon. Leurs journées libérées ne rapportent que si d'autres clients les achètent : la hausse sur les A n'en reprendrait que ${qte(r.journeesDemandeesParLesA)}, et la perte serait de ${eur(-r.bilanReel)}.`,
          },
        ];
      },
    },
  ],
};

