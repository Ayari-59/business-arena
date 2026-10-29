import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  HAUSSES_GENERALES_ESSAYEES,
  PLAFOND_DES_FRAIS_DE_PERSONNEL,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  enceintesPourLePlafond,
  hausseGeneraleAuPlafond,
  masseSalarialeDeN,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'EFFECTIF ET LA MASSE SALARIALE (Bac STMG, ressources humaines, palier 1).
 *
 * Ce que coûte le personnel sur l'année, et ce qu'il pèse : dans les charges, dans le chiffre
 * d'affaires, et ce que chaque salarié fait vendre. Puis ce qu'une embauche retire au résultat quand
 * les ventes ne suivent pas (le personnel est une charge fixe), les ventes qu'il faudrait pour un
 * salarié de plus sous le plafond de la gérante (le curseur), et la plus forte hausse générale que ce
 * plafond permet (le laboratoire).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : l'effectif et le coût d'un opérateur
 * sont ceux de la paie de l'exercice ; les ventes, les charges et le personnel (127 800 €, les
 * comptes 641 et 645) sont ceux du compte de résultat du premier exercice (comptes-du-lycee.ts),
 * lus par monde/ressources-humaines-de-nova.ts. Le plafond de 10 % des ventes est une hypothèse du
 * cours, nommée là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le coût d'un salarié dans le scénario de l'arène et l'année
 * figée de l'arène ; il lit le premier exercice de NOVA : 4 salariés, 127 800 € de masse salariale,
 * 1 390 276 € de ventes.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les mois d'une année. */
const MOIS = 12;

/** L'effectif, le coût d'un salarié et ce que le personnel pèse sur l'année (les cas la reprennent). */
export function masseSalariale(_c?: Cas, hausseGenerale = 0) {
  const m = masseSalarialeDeN(hausseGenerale);
  return {
    ...m,
    partDansLesCharges: auDixieme(m.partDansLesCharges * 100),
    tauxDeFraisDePersonnel: auDixieme(m.tauxDeFraisDePersonnel * 100),
    caParSalarie: Math.round(m.caParSalarie),
  };
}

/** L'effectif que le curseur essaie : un salarié de plus. */
const EFFECTIF_ESSAYE = masseSalarialeDeN().effectif + 1;

export const EFFECTIF_ET_MASSE_SALARIALE: Chapitre = {
  code: "effectif-et-masse-salariale",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "BTS SAM Bloc 3 · Collaboration à la gestion des ressources humaines",
    "BUT GACO · Participer au pilotage RH de l'organisation",
  ],
  titre: "L'effectif et la masse salariale",
  accroche:
    "Ce que coûte le personnel sur une année, ce qu'il pèse dans les charges et dans les ventes, et ce qu'une embauche retire au résultat quand les ventes ne suivent pas.",
  objectifs: [
    "Calculer le coût annuel d'un salarié et la masse salariale",
    "Calculer la part du personnel dans les charges et le taux de frais de personnel",
    "Calculer le chiffre d'affaires par salarié",
    "Expliquer pourquoi le personnel est une charge fixe",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le personnel, une charge de chaque mois",
      notions: ["payroll"],
      texte: (c) => {
        const m = masseSalariale(c);
        return [
          `${c.entreprise} emploie ${m.effectif} opérateurs. Chacun lui coûte ${eur(m.coutMensuel)} par mois : son salaire brut, et les cotisations que l'entreprise paie en plus pour lui. Ce coût tombe chaque mois, que l'entreprise vende beaucoup ou peu.`,
          `Chez ${c.entreprise}, les opérateurs ont le même salaire. Dans la plupart des entreprises, les salaires diffèrent selon le poste, la qualification et l'ancienneté : on raisonne alors sur un coût moyen.`,
        ];
      },
      tableau: (c) => {
        const m = masseSalariale(c);
        return {
          titre: `Le personnel et le premier exercice ${dE(c.entreprise)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Effectif", valeurs: [`${m.effectif} salariés`] },
            { libelle: "Coût d'un salarié par mois (brut et cotisations patronales)", valeurs: [eur(m.coutMensuel)] },
            { libelle: "Ventes de l'année", valeurs: [eur(m.ventes)] },
            { libelle: "Total des charges de l'année", valeurs: [eur(m.charges)] },
          ],
        };
      },
      repere: () => "Masse salariale = effectif × coût d'un salarié sur la période.",
    },
    {
      id: "masse",
      objectifs: [0],
      type: "montants",
      titre: "La masse salariale",
      notions: ["payroll"],
      question: (c) => `Calculez le coût annuel d'un salarié ${dE(c.entreprise)}, puis la masse salariale de l'année.`,
      champs: (c) => {
        const m = masseSalariale(c);
        return [
          { libelle: "Coût annuel d'un salarié", attendu: m.coutAnnuel, calcul: `${eur(m.coutMensuel)} × ${MOIS} mois = ${eur(m.coutAnnuel)}`, tolerance: 1 },
          { libelle: "Masse salariale de l'année", attendu: m.masse, calcul: `${eur(m.coutAnnuel)} × ${m.effectif} salariés = ${eur(m.masse)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = masseSalariale(c);
        return [
          `Sur l'année, le personnel coûte ${eur(m.masse)} à ${c.entreprise} : c'est la ligne du personnel de son compte de résultat, les salaires et les cotisations. Un salarié lui coûte ${eur(m.coutAnnuel)}, alors qu'il reçoit ${eur(m.netAnnuel)} nets : la différence, ce sont les cotisations, celles retenues sur son brut et celles que l'entreprise paie en plus.`,
        ];
      },
    },
    {
      id: "poids",
      objectifs: [1],
      type: "montants",
      titre: "Ce que pèse le personnel",
      notions: ["payroll", "productivity"],
      question: () =>
        "Calculez la part de la masse salariale dans le total des charges, puis le taux de frais de personnel (masse salariale ÷ ventes × 100), en pourcentage au dixième. Calculez enfin le chiffre d'affaires par salarié, à l'euro.",
      champs: (c) => {
        const m = masseSalariale(c);
        return [
          { libelle: "Part dans les charges (%)", attendu: m.partDansLesCharges, calcul: `${eur(m.masse)} ÷ ${eur(m.charges)} × 100 = ${pct(m.partDansLesCharges)}`, tolerance: 0.1 },
          { libelle: "Taux de frais de personnel (%)", attendu: m.tauxDeFraisDePersonnel, calcul: `${eur(m.masse)} ÷ ${eur(m.ventes)} × 100 = ${pct(m.tauxDeFraisDePersonnel)}`, tolerance: 0.1 },
          { libelle: "Chiffre d'affaires par salarié", attendu: m.caParSalarie, calcul: `${eur(m.ventes)} ÷ ${m.effectif} = ${eur(m.caParSalarie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = masseSalariale(c);
        return [
          `Sur 100 € de ventes, ${c.entreprise} en consacre ${pct(m.tauxDeFraisDePersonnel).replace(" %", " €")} à son personnel, et chaque salarié fait vendre ${eur(m.caParSalarie)} dans l'année. Une entreprise qui fabrique en série, comme ${c.entreprise}, a peu de salariés pour beaucoup de ventes : ses composants pèsent bien plus lourd que son personnel.`,
          "Ces deux chiffres se lisent ensemble : un taux de frais de personnel qui monte dit que les ventes ne suivent pas l'effectif ; un chiffre d'affaires par salarié qui monte dit que l'équipe fait vendre davantage.",
        ];
      },
    },
    {
      id: "embauche",
      objectifs: [3],
      type: "choix",
      titre: "Un salarié de plus",
      notions: ["payroll", "fixed_costs"],
      question: (c) => `Si ${c.entreprise} embauchait un salarié de plus pour toute l'année, sans vendre davantage, de combien baisserait son résultat avant impôt ?`,
      options: (c) => {
        const m = masseSalariale(c);
        return [
          {
            texte: `De ${eur(m.coutAnnuel)}, son coût annuel`,
            juste: true,
            retour: `Oui : le salaire brut et les cotisations patronales sont des charges, que les ventes suivent ou non. Pour que l'embauche se paie, il faut qu'elle fasse vendre de quoi couvrir ${eur(m.coutAnnuel)}.`,
          },
          {
            texte: `De ${eur(m.netAnnuel)}, le salaire net qu'il recevrait`,
            juste: false,
            retour: `Non : le net est ce que le salarié reçoit, pas ce qu'il coûte. L'entreprise verse aussi les cotisations retenues sur son salaire, et paie les siennes : ${eur(m.coutAnnuel)} en tout.`,
          },
          {
            texte: "De rien : un salarié de plus fait toujours vendre davantage",
            juste: false,
            retour: "Non : un salarié de plus n'apporte des ventes que si le travail manquait, ou s'il trouve de nouveaux clients. Sinon, il ajoute une charge fixe sans rien ajouter aux ventes.",
          },
        ];
      },
    },
    {
      id: "les-ventes-d-un-salarie-de-plus",
      objectifs: [2],
      type: "curseur",
      titre: "Les ventes d'un salarié de plus",
      notions: ["payroll", "productivity"],
      sens: "plus-petite",
      question: (c) => {
        const m = masseSalariale(c);
        return `La gérante veut que le personnel ne coûte pas plus de ${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)} des ventes. Avec ${EFFECTIF_ESSAYE} salariés, combien d'enceintes faudrait-il vendre dans l'année, à ${eur(m.prix)} ? Une droite donne ${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)} des ventes, l'autre la masse salariale de ${EFFECTIF_ESSAYE} salariés. Placez le curseur sur le plus petit nombre d'enceintes qui tient le plafond.`;
      },
      grandeur: (c) => ({ libelle: "Enceintes vendues dans l'année", unite: c.unites }),
      cible: () => ({ attendu: enceintesPourLePlafond(EFFECTIF_ESSAYE), min: 20_000, max: 32_000 }),
      zones: ["Le plafond est tenu", "Le personnel dépasse le plafond"],
      rates: () => ({ dessous: "À ces ventes, le personnel coûte plus que le plafond.", dessus: "Le plafond est tenu, mais avec moins d'enceintes aussi : cherchez la plus petite quantité." }),
      montrer: "Montrer les ventes",
      lecture: (_c, q) => {
        const m = masseSalariale();
        return [
          { libelle: "Ventes de l'année", montant: q * m.prix },
          { libelle: `Plafond des frais de personnel (${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)} des ventes)`, montant: Math.round(q * m.prix * PLAFOND_DES_FRAIS_DE_PERSONNEL * 100) / 100, fort: true },
          { libelle: `Masse salariale de ${EFFECTIF_ESSAYE} salariés`, montant: EFFECTIF_ESSAYE * m.coutAnnuel },
        ];
      },
      droites: () => {
        const m = masseSalariale();
        return { produit: (q) => q * m.prix * PLAFOND_DES_FRAIS_DE_PERSONNEL, cout: () => EFFECTIF_ESSAYE * m.coutAnnuel, libelles: ["Plafond des frais de personnel", "Masse salariale"] };
      },
      explication: (c) => {
        const m = masseSalariale(c);
        const q = enceintesPourLePlafond(EFFECTIF_ESSAYE);
        return [
          `Avec ${EFFECTIF_ESSAYE} salariés, la masse salariale serait de ${eur(EFFECTIF_ESSAYE * m.coutAnnuel)} : il faudrait vendre ${qte(q)} ${c.unites} dans l'année pour qu'elle reste sous ${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)} des ventes. Le premier exercice en a vendu ${qte(Math.round(m.ventes / m.prix))}.`,
          "Un salarié de plus se décide sur les ventes qu'il permettra : sans elles, le personnel pèse plus lourd sur chaque euro vendu.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-hausse-generale",
      objectifs: [1],
      type: "simulation",
      titre: "Une hausse générale sous le plafond",
      notions: ["payroll"],
      question: (c) =>
        `Les salariés ${dE(c.entreprise)} demandent une hausse générale des salaires. Elle monte le brut, donc les cotisations patronales : toute la masse salariale monte d'autant. Faites varier la hausse, les ventes restant celles du premier exercice, et regardez le taux de frais de personnel face au plafond de ${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)}.`,
      leviers: () => [{ code: "hausse", libelle: "Hausse générale des salaires", unite: "%", ...HAUSSES_GENERALES_ESSAYEES, depart: HAUSSES_GENERALES_ESSAYEES.min }],
      lecture: (_c, p) => {
        const m = masseSalariale(undefined, p.hausse! / 100);
        const d = masseSalariale();
        return [
          { libelle: "Masse salariale de l'année", montant: m.masse, reference: d.masse },
          { libelle: "Taux de frais de personnel", montant: auDixieme(m.tauxDeFraisDePersonnel), unite: "%", reference: d.tauxDeFraisDePersonnel, fort: true },
          { libelle: "Plafond de la gérante", montant: PLAFOND_DES_FRAIS_DE_PERSONNEL * 100, unite: "%" },
        ];
      },
      defi: () => {
        const juste = hausseGeneraleAuPlafond();
        return {
          consigne: `Trouvez la plus forte hausse générale, de ${HAUSSES_GENERALES_ESSAYEES.pas} point en ${HAUSSES_GENERALES_ESSAYEES.pas} point, qui garde le personnel sous ${pct(PLAFOND_DES_FRAIS_DE_PERSONNEL * 100)} des ventes.`,
          atteint: (p) => p.hausse === juste,
          indice: (p) => {
            const t = masseSalarialeDeN(p.hausse! / 100).tauxDeFraisDePersonnel;
            return t > PLAFOND_DES_FRAIS_DE_PERSONNEL
              ? `À ${pct(p.hausse!)}, le personnel coûte ${pct(auDixieme(t * 100))} des ventes : le plafond est dépassé.`
              : `À ${pct(p.hausse!)}, le plafond est tenu : la hausse peut-elle aller plus loin ?`;
          },
          solution: { hausse: juste },
        };
      },
      explication: (c, p) => {
        const m = masseSalariale(c, p.hausse! / 100);
        const plus = masseSalarialeDeN((p.hausse! + 1) / 100);
        return [
          `Défi relevé : à ${pct(p.hausse!)} de hausse, la masse salariale passe à ${eur(m.masse)}, ${pct(m.tauxDeFraisDePersonnel)} des ventes. À ${pct(p.hausse! + 1)}, elle en ferait ${pct(auDixieme(plus.tauxDeFraisDePersonnel * 100))}.`,
          "Une hausse générale se chiffre sur la masse salariale entière, cotisations comprises, et se juge sur les ventes qui la paient.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const m = masseSalariale(c);
        return [
          `Avec ${m.effectif} salariés, ${c.entreprise} consacre ${eur(m.masse)} à son personnel sur l'année : ${pct(m.partDansLesCharges)} de ses charges et ${pct(m.tauxDeFraisDePersonnel)} de ses ventes.`,
          "La masse salariale est une charge fixe : elle ne baisse pas quand les ventes baissent. C'est pourquoi une embauche se décide sur ce qu'elle fera vendre, et pas seulement sur le travail qu'il y a à faire.",
        ];
      },
      repere: () => "Taux de frais de personnel = masse salariale ÷ chiffre d'affaires. Chiffre d'affaires par salarié = chiffre d'affaires ÷ effectif.",
    },
  ],
};
