import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  ENTREPRISES_DE_LA_RSE,
  LA_RESPONSABILITE_SOCIETALE,
  PLAN_QUI_MONTE,
  TRIMESTRES_AVANT_LE_LABEL,
  TRIMESTRE_DU_LABEL_VISE,
  ficheDe,
} from "../../chapitres/la-responsabilite-societale";
import { capitalImage, effortRse, engagementRse, trimestresPourLeSeuil, viserLeLabel as viserLeLabelDuModele } from "../../monde/attractivite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA RESPONSABILITÉ SOCIÉTALE » : VISER LE LABEL (stratégie et
 * management, palier 4).
 *
 * Le chapitre a montré qu'au budget du cours (12 000 € par trimestre) le label ne vient jamais. La
 * direction le veut avant la fin de l'année, et propose 24 000 € chaque trimestre : deux fois
 * l'échelle de l'effort. L'élève vérifie que le capital passe le seuil (0,80 à la fin du trimestre
 * 3, une marge nette sur 0,70), chiffre l'année face à l'année sans engagement et au budget du cours,
 * cherche au curseur les ventes qu'il faudrait gagner pour payer le budget en plus, puis croise la
 * proposition avec le plan qui monte du chapitre, au même budget du trimestre 4 : le même label aux
 * mêmes trimestres, pour moins. La réponse demande un jugement : le label, s'il est voulu, ne
 * s'achète pas à 24 000 € constants : le plan qui monte l'obtient pour 16 000 € de moins, et un
 * budget constant plus juste (19 500 €) l'obtiendrait aussi, de justesse.
 *
 * RECALIBRÉ (audit du niveau, § 3.6 et § 4) : l'ancien cas proposait 19 500 €, le budget constant à la
 * centaine supérieure, et le capital tombait à 0,70005 pour un seuil de 0,70, à un arrondi près. Les
 * 24 000 € donnent un effort de ln 3 = 1,10 et un capital de 0,80 : l'élève qui arrondit au centième
 * trouve encore 0,80.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de monde/attractivite.ts (`viserLeLabel`, `engagementRse`). Les courriers de
 * l'arène (bad buzz, sanction) n'y existent pas, et l'arène ne rejoue plus rien.
 */

/** LA PROPOSITION DE LA DIRECTION, hypothèse du cours : 24 000 € de budget RSE chaque trimestre, deux fois l'échelle de l'effort. */
export const PROPOSITION_DE_LA_DIRECTION = 24_000;

/** Les bornes du curseur des enceintes vendues en plus que le budget du cours. */
export const VENTES_DU_CURSEUR_DU_CAS = { min: 0, max: 4_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n }).replace(/^-/, "−");
const pct = (t: number, n = 1) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: n }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

export type Verdict = "viser-le-label" | "pas-cette-annee";

/** La proposition de la direction, l'année qu'elle donne, et le plan qui monte au même budget du trimestre 4. */
export function viserLeLabel(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const r = f.rse;
  const k = r.inertie;
  const n = TRIMESTRES_AVANT_LE_LABEL;
  const budget = PROPOSITION_DE_LA_DIRECTION;
  const v = viserLeLabelDuModele(f, budget);
  // Comme l'élève le calcule : l'effort au centième, puis le capital au centième.
  const effort = Math.round(v.effort * 100) / 100;
  const capitalT3 = Math.round(v.capitalT3 * 100) / 100;
  const sans = v.vers.sans;
  const proposition = v.vers.avec;
  const cours = v.depart.avec;
  const ventesEnPlus = proposition.ventes - cours.ventes;
  const m = proposition.margeUnitaire;
  const ventesPourPayer = Math.ceil(v.coutEnPlus / m - 1e-9);
  // Le croisement : le plan qui monte du chapitre, suivi du budget du trimestre 4 de la direction.
  const plan = [...PLAN_QUI_MONTE, budget];
  const monte = engagementRse(f, plan);
  const capitalMonteT3 = capitalImage(f, plan).fins[2]!;
  const economie = auCentime(n * budget - somme(PLAN_QUI_MONTE));
  const ecartMonte = auCentime(monte.avec.resultat - proposition.resultat);
  const ecartMonteAuCours = auCentime(monte.avec.resultat - cours.resultat);
  return {
    f,
    r,
    k,
    n,
    budget,
    budgetDuCours: r.budgetDuCours,
    v,
    effort,
    capitalT3,
    margeSurLeSeuil: auCentime(v.capitalT3 - r.seuilDuLabel),
    trimestresPourLeSeuil: trimestresPourLeSeuil(f, budget),
    sans,
    proposition,
    cours,
    ventesEnPlus,
    margeEnPlus: auCentime(ventesEnPlus * m),
    m,
    ventesPourPayer,
    plan,
    monte,
    capitalMonteT3,
    economie,
    ecartMonte,
    ecartMonteAuCours,
    verdict: v.verdict as Verdict,
  };
}

export const VISER_LE_LABEL: Situation = {
  code: "viser-le-label",
  parcours: "strategie",
  palier: 4,
  blocs: [],
  reprend: [LA_RESPONSABILITE_SOCIETALE.code],
  commanditaire: "La direction",
  titre: "Viser le label",
  accroche:
    "La direction veut le label RSE avant la fin de l'année, et propose de doubler le budget du cours chaque trimestre. Le capital qu'il bâtit, ce que l'année coûte face au budget du cours, et un plan qui obtient le même label pour moins.",
  objectifs: [
    "Calculer le capital-image qu'un budget RSE bâtit avant le trimestre du label",
    "Chiffrer une année engagée face à l'année sans engagement et au budget du cours",
    "Retrouver les ventes qu'il faudrait gagner pour payer un budget en plus",
    "Croiser deux plans au même budget du dernier trimestre, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_RSE,
    pourquoi: "ce cas reprend le chapitre « La responsabilité sociétale », qui se calcule sur le marché des enceintes que NOVA partage avec SoundBox et Auris dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      notions: ["csr_index", "brand_capital"],
      texte: (c) => {
        const x = viserLeLabel(c);
        return [
          `« Le label RSE, je le veux avant la fin de l'année : c'est ce qui distinguera ${x.f.entreprise} de ses concurrents. Je propose ${eur(x.budget)} de budget RSE chaque trimestre, ${qte(x.budget / x.budgetDuCours)} fois le budget du cours, pour passer le seuil avec de la marge. Vérifiez que le label viendra, dites-moi ce que l'année coûtera, et si cela vaut mieux que ${eur(x.budgetDuCours)} par trimestre. »`,
          "Pas de cours cette fois : vous avez les réglages du capital-image et de la simulation du cours, et le calcul du capital est celui du chapitre. La simulation a joué l'année avec chaque budget ; à vous d'enchaîner les calculs.",
        ];
      },
      tableau: (c) => {
        const x = viserLeLabel(c);
        return {
          titre: `Le capital-image et le label, chez ${x.f.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget RSE proposé, par trimestre", valeurs: [eur(x.budget)] },
            { libelle: "Budget RSE du cours, par trimestre", valeurs: [eur(x.budgetDuCours)] },
            { libelle: "Échelle de l'effort", valeurs: [eur(x.r.echelle)] },
            { libelle: "Inertie du capital-image", valeurs: [dec(x.k)] },
            { libelle: "Seuil du label (capital d'ouverture)", valeurs: [dec(x.r.seuilDuLabel)] },
            { libelle: "Premier trimestre où le label peut venir", valeurs: [`trimestre ${x.r.premierTrimestreDuLabel}`] },
            { libelle: "Hausse d'attractivité du label", valeurs: [pct(x.r.bonusDuLabel, 0)] },
            { libelle: "Durée du label", valeurs: [`${qte(x.r.dureeDuLabel)} trimestres`] },
            { libelle: `Marge sur coût variable d'une ${x.f.unite}`, valeurs: [eur(x.m)] },
          ],
        };
      },
      repere: () => "À rendre : le capital à la fin du trimestre 3, le coût de l'année, ce que l'année en fait face au budget du cours, et votre réponse.",
    },
    {
      id: "capital",
      type: "montants",
      titre: "Le capital passera-t-il le seuil ?",
      notions: ["brand_capital", "csr_index"],
      question: (c) => {
        const x = viserLeLabel(c);
        return `Le capital-image part de zéro. Calculez l'effort d'un trimestre au budget proposé (au centième), le capital-image à la fin du trimestre ${x.n} (au centième), et le coût de l'engagement sur l'année.`;
      },
      champs: (c) => {
        const x = viserLeLabel(c);
        return [
          { libelle: "Effort d'un trimestre", attendu: x.effort, calcul: `ln(1 + ${eur(x.budget)} ÷ ${eur(x.r.echelle)}) = ${dec(x.effort)}`, tolerance: 0.01 },
          { libelle: `Capital-image à la fin du trimestre ${x.n}`, attendu: x.capitalT3, calcul: `${dec(x.effort)} × (1 − ${dec(x.k)} puissance ${x.n}) = ${dec(x.capitalT3)}`, tolerance: 0.01 },
          { libelle: "Coût de l'engagement sur l'année", attendu: x.v.cout, calcul: `${eur(x.budget)} × ${qte(x.f.marche.trimestres)} = ${eur(x.v.cout)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = viserLeLabel(c);
        return [
          `${dec(x.capitalT3)} à la fin du trimestre ${x.n}, pour un seuil de ${dec(x.r.seuilDuLabel)} : ${dec(x.margeSurLeSeuil)} de marge, que l'arrondi ne menace pas. La simulation accorde le label au trimestre ${x.v.labelAuTrimestre}, sur le capital d'ouverture, avec ${pct(x.r.bonusDuLabel, 0)} d'attractivité en plus. L'année coûte ${eur(x.v.coutEnPlus)} de plus qu'au budget du cours.`,
        ];
      },
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "L'année avec chaque budget",
      notions: ["csr_index", "contribution_margin"],
      tableau: (c) => {
        const x = viserLeLabel(c);
        const col = [x.sans, x.cours, x.proposition];
        return {
          titre: "L'année jouée, sans engagement, au budget du cours, au budget proposé",
          colonnes: ["Sans engagement", "Budget du cours", "Budget proposé"],
          lignes: [
            ...[0, 1, 2, 3].map((i) => ({ libelle: `Ventes du trimestre ${i + 1} (${x.f.unites})`, valeurs: col.map((e) => qte(e.trimestres[i]!.ventes)) })),
            { libelle: "Label dans l'année", valeurs: col.map((e) => (e.labels.premier === null ? "aucun" : `au trimestre ${e.labels.premier}`)) },
            { libelle: "Marge sur coût variable", valeurs: col.map((e) => eur(e.marge)) },
            { libelle: "Budget RSE de l'année", valeurs: col.map((e) => eur(e.budgetRse)) },
            { libelle: "Résultat de l'année", valeurs: col.map((e) => eur(e.resultat)) },
          ],
        };
      },
      question: () =>
        "D'après le tableau, calculez la marge gagnée par le budget proposé face à l'année sans engagement, puis l'écart de résultat du budget proposé avec l'année sans engagement, et avec le budget du cours. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = viserLeLabel(c);
        return [
          { libelle: "Marge gagnée face à l'année sans engagement", attendu: x.v.vers.margeGagnee, calcul: `${eur(x.proposition.marge)} − ${eur(x.sans.marge)} = ${eur(x.v.vers.margeGagnee)}`, tolerance: 1 },
          { libelle: "Écart de résultat avec l'année sans engagement", attendu: x.v.ecartAuSans, calcul: `${eur(x.proposition.resultat)} − ${entre(x.sans.resultat)} = ${eur(x.v.ecartAuSans)}`, tolerance: 1 },
          { libelle: "Écart de résultat avec le budget du cours", attendu: x.v.ecartAuDepart, calcul: `${eur(x.proposition.resultat)} − ${entre(x.cours.resultat)} = ${eur(x.v.ecartAuDepart)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = viserLeLabel(c);
        const t4 = x.proposition.trimestres[3]!.ventes - x.cours.trimestres[3]!.ventes;
        return [
          `Au trimestre ${x.v.labelAuTrimestre}, avec le label, ${x.f.entreprise} vend ${qte(t4)} ${x.f.unites} de plus qu'au budget du cours. Sur l'année, le budget proposé en vend ${qte(x.ventesEnPlus)} de plus, ${eur(x.margeEnPlus)} de marge, pour ${eur(x.v.coutEnPlus)} de budget en plus : l'année finit ${eur(-x.v.ecartAuDepart)} sous le budget du cours. Le label n'arrive qu'au dernier trimestre, trop tard pour payer, cette année, le budget en plus des trimestres d'avant.`,
        ];
      },
    },
    {
      id: "ce-qu-il-faudrait-vendre",
      type: "curseur",
      titre: "Ce qu'il faudrait vendre de plus",
      notions: ["contribution_margin", "csr_index"],
      question: (c) => {
        const x = viserLeLabel(c);
        return `Le budget proposé coûte ${eur(x.v.coutEnPlus)} de plus que le budget du cours sur l'année. Faites varier les ${x.f.unites} qu'il vendrait de plus que le budget du cours, et placez le curseur sur le plus petit nombre qui paie ce budget en plus, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Enceintes vendues de plus qu'au budget du cours", unite: ficheDe(c).unites }),
      cible: (c) => ({ attendu: viserLeLabel(c).ventesPourPayer, min: VENTES_DU_CURSEUR_DU_CAS.min, max: VENTES_DU_CURSEUR_DU_CAS.max }),
      zones: ["Le budget en plus se paie", "Le budget en plus ne se paie pas"],
      rates: () => ({
        dessous: "À cette position, la marge de ces ventes ne couvre pas encore le budget en plus.",
        dessus: "Plus bas, la marge couvre encore le budget en plus : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le point mort",
      lecture: (c, q) => {
        const x = viserLeLabel(c);
        return [
          { libelle: "Marge de ces ventes", montant: auCentime(x.m * q) },
          { libelle: "Budget en plus", montant: x.v.coutEnPlus },
          { libelle: "Écart avec le budget du cours", montant: auCentime(x.m * q - x.v.coutEnPlus), fort: true },
        ];
      },
      droites: (c) => {
        const x = viserLeLabel(c);
        return { produit: (q) => x.m * q, cout: () => x.v.coutEnPlus, libelles: ["Marge des ventes en plus", "Budget en plus de l'année"] };
      },
      explication: (c) => {
        const x = viserLeLabel(c);
        return [
          `Il faudrait ${qte(x.ventesPourPayer)} ${x.f.unites} de plus qu'au budget du cours, à ${eur(x.m)} l'${x.f.unite}. Le budget proposé en vend ${qte(x.ventesEnPlus)} de plus, ${pct(x.ventesEnPlus / x.ventesPourPayer, 0)} de ce qu'il faudrait : la marge sur le seuil se paie cher.`,
        ];
      },
    },
    {
      id: "le-plan-qui-monte",
      type: "montants",
      titre: "Le même label, autrement",
      notions: ["brand_capital", "csr_index"],
      tableau: (c) => {
        const x = viserLeLabel(c);
        const col = [x.v.vers, x.monte];
        return {
          titre: `Deux plans, le même budget au trimestre ${TRIMESTRE_DU_LABEL_VISE}`,
          colonnes: ["Budget proposé", "Plan qui monte"],
          lignes: [
            ...[0, 1, 2, 3].map((i) => ({ libelle: `Budget RSE du trimestre ${i + 1}`, valeurs: col.map((e) => eur(e.budgets[i]!)) })),
            { libelle: "Label dans l'année", valeurs: col.map((e) => (e.labels.premier === null ? "aucun" : `au trimestre ${e.labels.premier}`)) },
            { libelle: "Capital à la fin de l'année", valeurs: col.map((e) => dec(e.capital.fins[3]!)) },
            { libelle: "Résultat de l'année", valeurs: col.map((e) => eur(e.avec.resultat)) },
          ],
        };
      },
      question: (c) => {
        const x = viserLeLabel(c);
        return `Le chapitre a montré qu'il vaut mieux dépenser tard. Croisez la proposition avec le plan qui monte, suivi du même budget au trimestre ${TRIMESTRE_DU_LABEL_VISE}. Calculez le capital de ce plan à la fin du trimestre ${x.n} (au centième), ce qu'il économise sur les trimestres 1 à ${x.n}, et l'écart de résultat de l'année avec le budget proposé. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = viserLeLabel(c);
        const reste = dec(1 - x.k);
        const kk = dec(x.k);
        const ef = (b: number) => dec(effortRse(x.f, b));
        const [a, b, d] = PLAN_QUI_MONTE;
        return [
          {
            libelle: `Capital du plan qui monte à la fin du trimestre ${x.n}`,
            attendu: Math.round(x.capitalMonteT3 * 100) / 100,
            calcul: `${reste} × (${kk} × ${kk} × ${ef(a!)} + ${kk} × ${ef(b!)} + ${ef(d!)}) = ${dec(x.capitalMonteT3)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Économie sur les trimestres 1 à ${x.n}`,
            attendu: x.economie,
            calcul: `${qte(x.n)} × ${eur(x.budget)} − (${PLAN_QUI_MONTE.map(eur).join(" + ")}) = ${eur(x.economie)}`,
            tolerance: 1,
          },
          { libelle: "Écart de résultat avec le budget proposé", attendu: x.ecartMonte, calcul: `${eur(x.monte.avec.resultat)} − ${entre(x.proposition.resultat)} = ${eur(x.ecartMonte)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = viserLeLabel(c);
        return [
          `Le plan qui monte passe aussi le seuil (${dec(x.capitalMonteT3)}), obtient le label au même trimestre, et le garde au début de l'année suivante : son capital finit l'année à ${dec(x.monte.capital.fins[3]!)}, au-dessus du seuil, comme celui du budget proposé. Il dépense ${eur(x.economie)} de moins, et l'année finit ${eur(x.ecartMonte)} plus haut : la marge de la direction sur le seuil achetait surtout du capital aux premiers trimestres, que l'inertie oublie en partie.`,
          `Même ainsi, l'année reste ${eur(-x.ecartMonteAuCours)} sous le budget du cours : le label ne se paie pas cette année. C'est un choix de stratégie, qui se juge sur plusieurs années.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["csr_index", "brand_capital"],
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const x = viserLeLabel(c);
        const moinsCher = x.monte.labels.premier === x.v.labelAuTrimestre && x.ecartMonte > 0 && x.economie > 0;
        return [
          {
            texte: `Validons ${eur(x.budget)} : l'année finit mieux qu'au budget du cours`,
            juste: x.verdict === "viser-le-label" && !moinsCher,
            retour:
              x.verdict === "viser-le-label"
                ? `L'année finit ${eur(x.v.ecartAuDepart)} au-dessus du budget du cours, mais le plan qui monte fait mieux encore.`
                : `Non : l'année finit ${eur(-x.v.ecartAuDepart)} sous le budget du cours. Les ${qte(x.ventesEnPlus)} ${x.f.unites} vendues de plus ne paient pas les ${eur(x.v.coutEnPlus)} de budget en plus ; il en faudrait ${qte(x.ventesPourPayer)}.`,
          },
          {
            texte: `Gardons ${eur(x.budgetDuCours)} : le label viendra l'an prochain`,
            juste: false,
            retour: `Non : à ${eur(x.budgetDuCours)} par trimestre, le capital tend vers ${dec(effortRse(x.f, x.budgetDuCours))} et ne passe jamais ${dec(x.r.seuilDuLabel)}. Le label ne viendra ni cette année ni plus tard.`,
          },
          {
            texte: `Le label, oui, mais pas à ${eur(x.budget)} : il s'obtient pour moins`,
            juste: moinsCher,
            retour: moinsCher
              ? `Oui : le plan qui monte du chapitre, ${PLAN_QUI_MONTE.map(eur).join(", ")} aux trimestres 1 à ${x.n}, puis les ${eur(x.budget)} du trimestre ${TRIMESTRE_DU_LABEL_VISE}, donne le même label au même trimestre, gardé au début de l'année suivante, pour ${eur(x.economie)} de moins, et l'année finit ${eur(x.ecartMonte)} plus haut. La marge de ${dec(x.margeSurLeSeuil)} sur le seuil coûtait cher. Le label ne se paie pas encore cette année (${eur(-x.ecartMonteAuCours)} sous le budget du cours) : c'est un choix de stratégie, à juger sur plusieurs années.`
              : "Non : le plan qui monte ne fait pas mieux que la proposition.",
          },
          {
            texte: `Ajoutons au trimestre ${TRIMESTRE_DU_LABEL_VISE} pour assurer le label`,
            juste: false,
            retour: `Non : le label du trimestre ${TRIMESTRE_DU_LABEL_VISE} se lit sur le capital de la fin du trimestre ${x.n}. Un euro de plus au trimestre ${TRIMESTRE_DU_LABEL_VISE} ne sert que l'année suivante.`,
          },
        ];
      },
    },
  ],
};
