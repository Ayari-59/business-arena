import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { coutMoyenDUnDefaut, margeUnitaire } from "../monde/capacite";
import { ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA, POURQUOI_LA_PRODUCTION_DE_NOVA, defautsPourPayer, ficheDeNova, qualiteAuBudget } from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRODUIRE BIEN, LA QUALITÉ ET CE QU'ELLE COÛTE (bac STMG, management, palier 1).
 *
 * Une enceinte sur trente environ sort de la ligne de NOVA avec un défaut. Le contrôle final en
 * trouve la plupart, qui se retouchent ; les autres partent chez le client et reviennent sous
 * garantie, plus cher, et font perdre des ventes. Le chapitre lit l'année N + 1 de NOVA au budget
 * de prévention actuel (16 000 €) sur les fiches du monde du cours (nova-capacite.ts, capacite.ts,
 * relus par monde/production-et-logistique.ts) : les défauts, leurs deux coûts, ce que coûte un
 * défaut en moyenne, puis ce qu'il faut éviter de défauts pour payer un budget de prévention en plus.
 *
 * L'EXPÉRIENCE. Un curseur : les défauts qu'il faut éviter pour payer 8 000 € de prévention de plus
 * (223). Un laboratoire : le budget de prévention qui laisse le meilleur résultat (32 000 €).
 *
 * Ce que le chapitre ne double pas : « Le coût de la non-qualité » (BTS GPME) lit la courbe en U, la
 * qualité perçue et deux démarches qualité. Ici, au niveau du bac STMG : le défaut, son coût, et ce
 * qu'un budget de prévention change au résultat.
 *
 * CE QUI A CHANGÉ. L'arène rejouait l'année de sept entreprises avec et sans budget qualité ; le
 * chapitre se joue chez NOVA seule.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_QUALITE: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** La prévention en plus du curseur (hypothèse du chapitre) : 8 000 €, la moitié du budget actuel. */
export const PREVENTION_EN_PLUS = 8_000;

/** Les bornes du curseur (les défauts évités) et du laboratoire (la prévention de l'année, par 4 000 €). */
const DEFAUTS_DU_CURSEUR = { min: 0, max: 600 } as const;
const PREVENTION_DU_LABORATOIRE = { min: 0, max: 40_000, pas: 4_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 1000) / 10).toLocaleString("fr-FR")} %`;

const f = (c: Pick<Cas, "code">) => ficheDeNova(c);

/** La qualité de l'année N + 1 au budget actuel. */
export const qualite = (c: Pick<Cas, "code">) => qualiteAuBudget(f(c));

/** Le budget du laboratoire : celui de la grille qui laisse le meilleur résultat. */
export function preventionDuLaboratoire(c: Pick<Cas, "code">) {
  const { min, max, pas } = PREVENTION_DU_LABORATOIRE;
  const points = Array.from({ length: (max - min) / pas + 1 }, (_, i) => qualiteAuBudget(f(c), min + i * pas));
  return points.reduce((m, x) => (x.resultat > m.resultat ? x : m));
}

function tableauDeLaQualite(c: Cas): TableauDeDonnees {
  const x = f(c);
  const q = qualite(c);
  return {
    titre: `La qualité de ${c.entreprise}, l'année N + 1`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} montées`, valeurs: [qte(q.volume)] },
      { libelle: "Budget de prévention de l'année", valeurs: [eur(q.prevention)] },
      { libelle: "Taux de défaut à ce budget", valeurs: [pct(q.tauxDeDefaut)] },
      { libelle: "Coût du contrôle final de l'année", valeurs: [eur(q.detection)] },
      { libelle: "Part des défauts que le contrôle trouve", valeurs: [pct(q.tauxDeDetection)] },
      { libelle: "Retouche d'un défaut trouvé", valeurs: [eur(x.qualite.coutDUnDefautDetecte)] },
      { libelle: "Retour sous garantie d'un défaut parti chez le client", valeurs: [eur(x.qualite.coutDUnDefautLivre)] },
    ],
  };
}

export const PRODUIRE_BIEN: Chapitre = {
  code: "produire-bien",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Produire bien : la qualité et ce qu'elle coûte",
  accroche:
    "Un défaut trouvé à l'atelier se retouche ; parti chez le client, il revient plus cher et fait fuir d'autres clients. Ce que coûtent les défauts, et ce que rapporte de les prévenir.",
  objectifs: [
    "Calculer les défauts d'une production, trouvés et partis chez le client",
    "Calculer ce que coûte la non-qualité",
    "Dire pourquoi un défaut coûte plus cher chez le client",
    "Juger un budget de prévention sur le résultat",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_QUALITE, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Prévenir, contrôler, réparer",
      notions: ["variable_costs"],
      tableau: tableauDeLaQualite,
      texte: (c) => [
        `Chaque année, ${c.entreprise} paie une prévention (former les opérateurs, essayer les composants, régler les postes) : plus elle y met, moins la ligne monte d'${c.unites} défectueuses. Un contrôle final écoute chaque ${c.unite} avant l'expédition.`,
        "Un défaut trouvé au contrôle se retouche à l'atelier. Un défaut qui échappe au contrôle part chez le client : il revient sous garantie, et le client déçu ne rachète pas, ses avis en détournent d'autres.",
        "Le tableau donne l'année N + 1 au budget de prévention actuel.",
      ],
      repere: () => "Coût de la qualité = prévention + contrôle + retouches + retours sous garantie.",
    },
    {
      id: "les-defauts",
      objectifs: [0],
      type: "montants",
      titre: "Les défauts de l'année",
      notions: ["variable_costs"],
      tableau: tableauDeLaQualite,
      question: (c) => `Calculez les ${c.unites} défectueuses de l'année (montées × taux de défaut), celles que le contrôle trouve, puis celles qui partent chez le client.`,
      champs: (c) => {
        const q = qualite(c);
        return [
          { libelle: "Défauts de l'année", attendu: q.defauts, calcul: `${qte(q.volume)} × ${pct(q.tauxDeDefaut)} = ${qte(q.defauts)}`, tolerance: 0 },
          { libelle: "Défauts trouvés au contrôle", attendu: q.detectes, calcul: `${qte(q.defauts)} × ${pct(q.tauxDeDetection)} = ${qte(q.detectes)}`, tolerance: 0 },
          { libelle: "Défauts partis chez le client", attendu: q.livres, calcul: `${qte(q.defauts)} − ${qte(q.detectes)} = ${qte(q.livres)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const q = qualite(c);
        return [`Sur ${qte(q.volume)} ${c.unites}, ${qte(q.livres)} arriveront défectueuses chez un client, malgré le contrôle.`];
      },
    },
    {
      id: "la-non-qualite",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûtent les défauts",
      notions: ["variable_costs", "contribution_margin"],
      tableau: tableauDeLaQualite,
      question: () => "Calculez le coût des retouches, celui des retours sous garantie, puis le coût de la qualité de l'année (prévention, contrôle, retouches et retours).",
      champs: (c) => {
        const x = f(c);
        const q = qualite(c);
        return [
          { libelle: "Coût des retouches", attendu: q.interne, calcul: `${qte(q.detectes)} × ${eur(x.qualite.coutDUnDefautDetecte)} = ${eur(q.interne)}` },
          { libelle: "Coût des retours sous garantie", attendu: q.externe, calcul: `${qte(q.livres)} × ${eur(x.qualite.coutDUnDefautLivre)} = ${eur(q.externe)}` },
          { libelle: "Coût de la qualité de l'année", attendu: q.total, calcul: `${eur(q.prevention)} + ${eur(q.detection)} + ${eur(q.interne)} + ${eur(q.externe)} = ${eur(q.total)}` },
        ];
      },
      explication: (c) => {
        const q = qualite(c);
        return [
          `Les défauts coûtent ${eur(q.nonQualite)} de retouches et de retours : c'est le coût de la non-qualité. Et les ${qte(q.livres)} clients déçus feront perdre ${qte(q.ventesPerdues)} ventes, ${eur(q.margePerdue)} de marge qu'aucun compte de la qualité ne montre.`,
        ];
      },
    },
    {
      id: "ou-coute-un-defaut",
      objectifs: [2],
      type: "choix",
      titre: "Où un défaut coûte le plus",
      notions: ["variable_costs"],
      question: (c) => `Pour ${c.entreprise}, où un défaut coûte-t-il le plus cher ?`,
      options: (c) => {
        const x = f(c);
        return [
          {
            texte: "Chez le client",
            juste: true,
            retour: `Oui : il revient sous garantie pour ${eur(x.qualite.coutDUnDefautLivre)}, contre ${eur(x.qualite.coutDUnDefautDetecte)} de retouche à l'atelier, et le client déçu en fait perdre ${qte(x.qualite.ventesPerduesParDefautLivre)} autres ventes.`,
          },
          { texte: "Au contrôle final, qui le trouve", juste: false, retour: `Non : une retouche coûte ${eur(x.qualite.coutDUnDefautDetecte)}, un retour sous garantie ${eur(x.qualite.coutDUnDefautLivre)}.` },
          { texte: "Partout pareil, un défaut reste un défaut", juste: false, retour: "Non : plus un défaut est trouvé tard, plus il coûte : la retouche, puis le retour, puis le client perdu." },
        ];
      },
    },
    {
      id: "les-defauts-a-eviter",
      objectifs: [3],
      type: "curseur",
      titre: "Les défauts qu'il faut éviter",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) =>
        `Le contrôle trouve ${pct(f(c).qualite.controleFinal.tauxDeDetection)} des défauts : en moyenne, un défaut coûte ${eur(coutMoyenDUnDefaut(f(c)))} (retouche ou retour). La responsable qualité propose ${eur(PREVENTION_EN_PLUS)} de prévention de plus. Faites varier les défauts que cette prévention éviterait, et placez le curseur sur le plus petit nombre qui la paie, puis validez.`,
      grandeur: () => ({ libelle: "Défauts évités dans l'année", unite: "défauts" }),
      cible: (c) => ({ attendu: defautsPourPayer(f(c), PREVENTION_EN_PLUS), ...DEFAUTS_DU_CURSEUR }),
      zones: ["La prévention se paie", "La prévention coûte plus qu'elle n'évite"],
      rates: () => ({
        dessous: "Avec si peu de défauts évités, la prévention coûte plus qu'elle n'évite.",
        dessus: "Ces défauts évités paient la prévention, mais moins suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les défauts",
      lecture: (c, q) => {
        const m = coutMoyenDUnDefaut(f(c));
        return [
          { libelle: "Coût des défauts évités", montant: q * m, fort: true },
          { libelle: "Prévention en plus", montant: PREVENTION_EN_PLUS },
          { libelle: "Ce que la prévention laisse", montant: q * m - PREVENTION_EN_PLUS },
        ];
      },
      droites: (c) => {
        const m = coutMoyenDUnDefaut(f(c));
        return { produit: (q) => q * m, cout: () => PREVENTION_EN_PLUS, libelles: ["Coût des défauts évités", "Prévention en plus"] };
      },
      explication: (c) => {
        const m = coutMoyenDUnDefaut(f(c));
        const n = defautsPourPayer(f(c), PREVENTION_EN_PLUS);
        const avec = qualiteAuBudget(f(c), qualite(c).prevention + PREVENTION_EN_PLUS);
        return [
          `Il faut éviter ${qte(n)} défauts : ${qte(n)} × ${eur(m)} = ${eur(n * m)}, assez pour payer ${eur(PREVENTION_EN_PLUS)}. À ${eur(avec.prevention)} de prévention, la ligne monterait ${qte(qualite(c).defauts - avec.defauts)} défauts de moins.`,
          "Ce calcul ne compte pas encore les clients qu'un défaut fait fuir : avec eux, la prévention se paie plus vite.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-prevention",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la prévention",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) =>
        `Faites varier le budget de prévention de l'année, par ${eur(PREVENTION_DU_LABORATOIRE.pas)}, en partant du budget actuel, ${eur(qualite(c).prevention)}. Le tableau donne les défauts, le coût de la qualité, les ventes perdues par les clients déçus, et le résultat (la marge des ventes, moins le coût de la qualité). Relevez le défi.`,
      leviers: (c) => [{ code: "prevention", libelle: "Budget de prévention de l'année", unite: "€", ...PREVENTION_DU_LABORATOIRE, depart: qualite(c).prevention }],
      lecture: (c, p) => {
        const q = qualiteAuBudget(f(c), p.prevention!);
        const d = qualite(c);
        return [
          { libelle: "Défauts de l'année", montant: q.defauts, unite: "défauts", reference: d.defauts },
          { libelle: "Coût de la qualité", montant: q.total, reference: d.total },
          { libelle: "Ventes perdues par les clients déçus", montant: q.ventesPerdues, unite: c.unites, reference: d.ventesPerdues },
          { libelle: "Résultat de la qualité", montant: q.resultat, reference: d.resultat, fort: true },
        ];
      },
      defi: (c) => {
        const juste = preventionDuLaboratoire(c);
        return {
          consigne: "Trouvez le budget de prévention qui laisse le meilleur résultat.",
          atteint: (p) => p.prevention === juste.prevention,
          indice: (p) => {
            const q = qualiteAuBudget(f(c), p.prevention!);
            return `À ${eur(q.prevention)}, le taux de défaut est de ${pct(q.tauxDeDefaut)} et le résultat de ${eur(q.resultat)}. Le palier suivant évite-t-il assez de défauts pour se payer ?`;
          },
          solution: { prevention: juste.prevention },
        };
      },
      explication: (c, p) => {
        const q = qualiteAuBudget(f(c), p.prevention!);
        return [
          `Défi relevé : à ${eur(q.prevention)}, le taux de défaut tombe à ${pct(q.tauxDeDefaut)} et le résultat atteint ${eur(q.resultat)}. Au-delà, le taux ne baisse plus : chaque euro de prévention en plus ne rapporte rien.`,
          `Chaque client déçu coûte aussi la marge des ventes qu'il fait perdre, ${eur(margeUnitaire(f(c)))} chacune : c'est elle qui fait pencher la balance vers plus de prévention.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["variable_costs"],
      texte: (c) => {
        const q = qualite(c);
        return [
          `Au budget actuel, ${c.entreprise} montera ${qte(q.defauts)} ${c.unites} défectueuses en N + 1, dont ${qte(q.livres)} partiront chez un client. Ses défauts coûteront ${eur(q.nonQualite)}, plus les ventes que les clients déçus feront perdre.`,
          "Produire bien coûte : la prévention et le contrôle se paient d'avance. Produire mal coûte plus : un défaut coûte d'autant plus qu'il est trouvé tard, et le client qui le reçoit en détourne d'autres.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : suivez la qualité de vos produits et ce qu'elle fait à vos ventes, tour après tour.",
        ];
      },
      repere: () => "Coût de la non-qualité = retouches + retours sous garantie, sans compter les clients perdus.",
    },
  ],
};
