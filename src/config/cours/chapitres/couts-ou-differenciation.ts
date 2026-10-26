import type { CompanyRoundResult, RoundDecisions } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee, type Changement } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import { MARCHES } from "./marche-et-part-de-marche";

/**
 * CHAPITRE : DOMINATION PAR LES COÛTS OU DIFFÉRENCIATION (Stratégie et management, palier 2).
 *
 * Les deux stratégies génériques : vendre moins cher que tous parce qu'on produit au coût le
 * plus bas, ou vendre plus cher parce que les clients reconnaissent à l'offre quelque chose de
 * plus. L'arène rejoue l'année du cours (gestion-de-la-pme.ts : même graine, mêmes concurrents)
 * avec chacune, décidée dès le premier trimestre et tenue jusqu'à la clôture, et la compare à
 * l'année du cours elle-même, celle de la gestion équilibrée, qui reste au milieu : le prix
 * usuel du marché et des budgets moyens.
 *
 * Chaque stratégie se pose sur la décision de la gestion équilibrée de chaque trimestre : son
 * prix, ses budgets de qualité et de marketing, sa production planifiée, multipliés par les
 * constantes ci-dessous. Le reste (maintenance, personnel, financement) ne change pas. Les
 * concurrents jouent comme dans l'année du cours : dans le réglage du cours, ils ne lisent pas
 * le prix de l'entreprise (`reactToHumanPrice` ne joue que face à des équipes humaines).
 *
 * Ce que le moteur fait des leviers, et que le chapitre lit : le prix fait l'attraction de
 * l'offre (élasticité de chaque clientèle), le budget qualité fait la qualité produite, que la
 * qualité perçue suit avec inertie (elle agit donc sur les trimestres suivants), le budget
 * marketing fait l'attraction du trimestre, et la production planifiée borne les ventes.
 *
 * LA BOUTIQUE EN EST : ses décisions passent par ses références (`products`), qui ignorent le
 * prix unique et le budget qualité scalaires. Les multiplicateurs s'appliquent donc aussi à
 * chaque référence, et au budget de marque. Le test le vérifie : chaque levier change bien
 * l'année dans chaque entreprise du chapitre.
 *
 * VOLT FITNESS N'EN EST PAS, pour la raison du chapitre « Le marché et la part de marché » : son
 * marché se compte en abonnés gardés, et ses ventes de l'année (les nouveaux adhérents) ne font
 * ni sa part de marché ni une marge par unité vendue.
 */

/** Ce qu'une stratégie change à la décision de la gestion équilibrée, chaque trimestre : des multiplicateurs. */
export interface Leviers {
  prix: number;
  qualite: number;
  marketing: number;
  production: number;
}

/**
 * LA DOMINATION PAR LES COÛTS, telle que le cours la pose : le prix baisse de 10 %, assez pour
 * se rapprocher du concurrent qui casse les prix (12 % sous le prix usuel dans l'arène) sans
 * s'aligner sur lui ; les budgets de qualité et de marketing sont coupés de moitié, ce sont les
 * coûts que l'entreprise choisit ; la production planifiée monte de 40 %, parce qu'une stratégie
 * de coûts vise le volume, et qu'au plan de la gestion équilibrée (le cours ne lui donne pas
 * ses ventes passées) la demande gagnée par le prix bas serait perdue faute de produits.
 */
export const STRATEGIE_DE_COUTS: Leviers = { prix: 0.9, qualite: 0.5, marketing: 0.5, production: 1.4 };

/**
 * LA DIFFÉRENCIATION, telle que le cours la pose : le prix monte de 15 %, moins que le
 * concurrent haut de gamme (30 % au-dessus du prix usuel, moins là où le scénario le dit) ; le
 * budget qualité double et le budget marketing monte de moitié, pour que les clients voient la
 * différence qu'ils paient ; la production planifiée reste celle de la gestion équilibrée,
 * puisqu'un prix plus haut ne cherche pas plus de clients.
 */
export const STRATEGIE_DE_DIFFERENCIATION: Leviers = { prix: 1.15, qualite: 2, marketing: 1.5, production: 1 };

/** Les leviers d'une stratégie, appliqués à la décision de la gestion équilibrée de chaque trimestre. */
export function strategie(l: Leviers): Changement {
  return (_tour: number, d: RoundDecisions): RoundDecisions => ({
    ...d,
    price: d.price * l.prix,
    qualityBudget: d.qualityBudget * l.qualite,
    marketingBudget: d.marketingBudget * l.marketing,
    productionPlan: d.productionPlan * l.production,
    // En gamme, chaque référence porte son prix, ses budgets et son plan ; la marque, son budget.
    ...(d.products
      ? {
          products: Object.fromEntries(
            Object.entries(d.products).map(([code, p]) => [
              code,
              {
                ...p,
                price: p.price * l.prix,
                productionPlan: p.productionPlan * l.production,
                ...(p.marketingBudget !== undefined ? { marketingBudget: p.marketingBudget * l.marketing } : {}),
                ...(p.qualityBudget !== undefined ? { qualityBudget: p.qualityBudget * l.qualite } : {}),
              },
            ]),
          ),
        }
      : {}),
    ...(d.brandMarketingBudget !== undefined ? { brandMarketingBudget: d.brandMarketingBudget * l.marketing } : {}),
  });
}

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;
/** « à » devant un nom, contracté devant l'article (« au Comptoir »). */
const aU = (nom: string) => (/^Le /.test(nom) ? `au ${nom.slice(3)}` : /^Les /.test(nom) ? `aux ${nom.slice(4)}` : `à ${nom}`);
/** « que » devant un nom, élidé devant une voyelle (« qu'Auris »). */
const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
/** Une variation d'un levier, dans le tableau : « −10 % », « +100 % », ou « inchangé ». */
const variation = (k: number, feminin = false) => {
  const v = Math.round((k - 1) * 100);
  return v === 0 ? (feminin ? "inchangée" : "inchangé") : v > 0 ? `+${v} %` : `−${-v} %`;
};
/** Un écart de montant, signé. */
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
/** Des points de part de marché, signés. */
const points = (x: number) => (x > 0 ? `+${qte(x)}` : qte(x));

const ventesDuTrimestre = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
const marcheDuTrimestre = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.potential, 0);

export type CodeDeStrategie = "couts" | "milieu" | "differenciation";

/** Une année rejouée, en grandes masses : ce que le chapitre compare. */
export function bilanDeLAnnee<C extends string>(code: C, annee: readonly CompanyRoundResult[]) {
  const ventes = Math.round(surLAnnee(annee, ventesDuTrimestre));
  const marche = Math.round(surLAnnee(annee, marcheDuTrimestre));
  const chiffreDAffaires = Math.round(surLAnnee(annee, (r) => r.incomeStatement.revenue));
  const marge = Math.round(surLAnnee(annee, (r) => r.incomeStatement.grossMargin));
  const exploitation = Math.round(surLAnnee(annee, (r) => r.incomeStatement.operatingIncome));
  return {
    code,
    ventes,
    marche,
    chiffreDAffaires,
    marge,
    exploitation,
    qualite: Math.round(surLAnnee(annee, (r) => r.incomeStatement.qualityCost)),
    marketing: Math.round(surLAnnee(annee, (r) => r.incomeStatement.marketingCost)),
    resultat: Math.round(surLAnnee(annee, (r) => r.incomeStatement.netIncome)),
    part: auDixieme((ventes / marche) * 100),
    prixMoyen: auCentime(chiffreDAffaires / ventes),
    margeUnitaire: auCentime(marge / ventes),
    tauxDeMarge: auDixieme((marge / chiffreDAffaires) * 100),
    /** Ce que coûte une unité vendue, tout compris : les charges d'exploitation des unités vendues. */
    coutComplet: auCentime((chiffreDAffaires - exploitation) / ventes),
  };
}

export type BilanDeLAnnee = ReturnType<typeof bilanDeLAnnee<CodeDeStrategie>>;

/** Les deux concurrents de l'année du cours : leur prix moyen de l'année, le moins cher et le plus cher. */
export function concurrentsDeLAnnee(c: Cas) {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const liste = def.bots.slice(0, 2).map((b) => {
    const annee = partie.rounds.map((t) => t.results[b.id]!);
    const ventes = Math.round(surLAnnee(annee, ventesDuTrimestre));
    return { nom: b.name, prix: auCentime(Math.round(surLAnnee(annee, (r) => r.incomeStatement.revenue)) / ventes) };
  });
  const parPrix = [...liste].sort((a, b) => a.prix - b.prix);
  return { bas: parPrix[0]!, haut: parPrix.at(-1)! };
}

export const NOMS_DES_STRATEGIES: Record<CodeDeStrategie, string> = {
  couts: "la domination par les coûts",
  milieu: "le milieu",
  differenciation: "la différenciation",
};

/** Les trois années, et ce qu'elles disent. */
export function coutsOuDifferenciation(c: Cas) {
  const couts = bilanDeLAnnee("couts", rejouerAvec(c.code, "couts-ou-differenciation-couts", strategie(STRATEGIE_DE_COUTS)));
  const milieu = bilanDeLAnnee("milieu", anneeDeReference(c.code));
  const differenciation = bilanDeLAnnee(
    "differenciation",
    rejouerAvec(c.code, "couts-ou-differenciation-differenciation", strategie(STRATEGIE_DE_DIFFERENCIATION)),
  );
  const trois = [couts, milieu, differenciation];
  const parResultat = [...trois].sort((a, b) => b.resultat - a.resultat);
  const meilleure = parResultat[0]!;
  const pire = parResultat.at(-1)!;
  const rangDuMilieu: "premier" | "entre" | "dernier" = meilleure === milieu ? "premier" : pire === milieu ? "dernier" : "entre";
  return {
    couts,
    milieu,
    differenciation,
    trois,
    meilleure,
    pire,
    rangDuMilieu,
    concurrents: concurrentsDeLAnnee(c),
    /** Le milieu n'a ni le volume de la stratégie de coûts, ni la marge par unité de la différenciation. */
    coince: milieu.part < couts.part && milieu.margeUnitaire < differenciation.margeUnitaire,
    ecartCouts: couts.resultat - milieu.resultat,
    ecartDifferenciation: differenciation.resultat - milieu.resultat,
  };
}

const COLONNES = ["Domination par les coûts", "Au milieu", "Différenciation"];

export const COUTS_OU_DIFFERENCIATION: Chapitre = {
  code: "couts-ou-differenciation",
  parcours: "strategie",
  palier: 2,
  blocs: [
    "STMG Thème 3 · Les choix stratégiques des organisations",
    "DCG UE7 · Management des organisations",
    "BUT GEA · Concevoir la stratégie de création de valeur",
  ],
  titre: "Domination par les coûts ou différenciation",
  accroche:
    "Vendre moins cher que tous, ou plus cher parce qu'on est meilleur : les deux stratégies génériques, jouées toute une année dans l'arène, face aux mêmes concurrents. Et pourquoi rester au milieu peut coûter le plus.",
  objectifs: [
    "Distinguer la domination par les coûts et la différenciation",
    "Comparer deux stratégies par la part de marché, la marge par unité et le résultat",
    "Choisir la stratégie qui convient à l'entreprise face à ses concurrents",
    "Expliquer pourquoi rester au milieu peut être le pire",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi: "ce chapitre compare des parts de marché et des marges par unité vendue, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux stratégies pour un même marché",
      notions: ["demand_market_share", "full_unit_cost"],
      texte: (c) => {
        const k = coutsOuDifferenciation(c);
        const { bas, haut } = k.concurrents;
        return [
          "Face à ses concurrents, une entreprise peut chercher à vendre moins cher que les autres, parce que ses coûts sont les plus bas : c'est la domination par les coûts. Elle peut aussi vendre plus cher, parce que ses clients lui reconnaissent quelque chose de plus, ici la qualité et l'image : c'est la différenciation.",
          `Sur le marché ${dE(c.entreprise)}, ${bas.nom} vend en moyenne à ${eur(bas.prix)}, ${haut.nom} à ${eur(haut.prix)}. ${c.entreprise} reste au milieu : son année du cours, jouée par une gestion équilibrée, vend à ${eur(k.milieu.prixMoyen)} en moyenne, avec des budgets de qualité et de marketing moyens.`,
          "L'arène a rejoué cette année deux fois, avec chaque stratégie décidée dès le premier trimestre et tenue jusqu'à la clôture. Le tableau dit ce que chacune change, chaque trimestre, à la décision de la gestion équilibrée. Les concurrents jouent comme dans l'année du cours.",
        ];
      },
      tableau: () => ({
        titre: "Ce que chaque stratégie change, chaque trimestre",
        colonnes: COLONNES,
        lignes: [
          { libelle: "Prix de vente", valeurs: [variation(STRATEGIE_DE_COUTS.prix), variation(1), variation(STRATEGIE_DE_DIFFERENCIATION.prix)] },
          { libelle: "Budget qualité", valeurs: [variation(STRATEGIE_DE_COUTS.qualite), variation(1), variation(STRATEGIE_DE_DIFFERENCIATION.qualite)] },
          { libelle: "Budget marketing", valeurs: [variation(STRATEGIE_DE_COUTS.marketing), variation(1), variation(STRATEGIE_DE_DIFFERENCIATION.marketing)] },
          {
            libelle: "Production planifiée",
            valeurs: [variation(STRATEGIE_DE_COUTS.production, true), variation(1, true), variation(STRATEGIE_DE_DIFFERENCIATION.production, true)],
          },
        ],
      }),
      repere: () =>
        "Domination par les coûts : les coûts les plus bas du marché, pour vendre moins cher et en grand volume. Différenciation : une offre que les clients jugent meilleure, pour la vendre plus cher.",
    },
    {
      id: "volume",
      type: "montants",
      titre: "Ce que chaque stratégie vend",
      notions: ["demand_market_share", "price_elasticity"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année rejouée avec chaque stratégie : les ventes",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Prix moyen de vente", valeurs: k.trois.map((x) => eur(x.prixMoyen)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.trois.map((x) => qte(x.ventes)) },
            { libelle: `Marché de l'année (${c.unites})`, valeurs: k.trois.map((x) => qte(x.marche)) },
            { libelle: "Part de marché", valeurs: ["à calculer", pct(k.milieu.part), "à calculer"] },
          ],
        };
      },
      question: (c) =>
        `Le marché est le même dans les trois années : ce que les clients auraient pu acheter. Calculez la part de marché ${dE(c.entreprise)} avec la domination par les coûts, puis avec la différenciation, en pourcentage au dixième.`,
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          {
            libelle: "Part de marché, domination par les coûts (%)",
            attendu: k.couts.part,
            calcul: `${qte(k.couts.ventes)} ÷ ${qte(k.couts.marche)} × 100 = ${pct(k.couts.part)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Part de marché, différenciation (%)",
            attendu: k.differenciation.part,
            calcul: `${qte(k.differenciation.ventes)} ÷ ${qte(k.differenciation.marche)} × 100 = ${pct(k.differenciation.part)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const dc = auDixieme(k.couts.part - k.milieu.part);
        const dd = auDixieme(k.differenciation.part - k.milieu.part);
        return [
          `Par rapport au milieu (${pct(k.milieu.part)}), la domination par les coûts fait ${points(dc)} points de part de marché, la différenciation ${points(dd)} points. ${dc > 0 && dd < 0 ? "Le prix bas et la production en plus attirent des clients ; le prix haut en fait partir, que la qualité ne retient pas tous." : "Le prix, la qualité et le marketing jouent ensemble sur les ventes."}`,
          "La part de marché dit combien l'entreprise vend, pas ce que chaque vente lui rapporte : c'est la marge qui le dit.",
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que chaque vente rapporte",
      notions: ["contribution_margin", "margin_rates"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année rejouée avec chaque stratégie : la marge",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: k.trois.map((x) => eur(x.chiffreDAffaires)) },
            { libelle: "Marge sur coût variable", valeurs: k.trois.map((x) => eur(x.marge)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.trois.map((x) => qte(x.ventes)) },
            { libelle: "Marge par unité vendue", valeurs: ["à calculer", eur(k.milieu.margeUnitaire), "à calculer"] },
          ],
        };
      },
      question: (c) =>
        `La marge sur coût variable est ce qui reste des ventes une fois payé ce que coûte chaque unité. Calculez la marge par unité vendue ${dE(c.entreprise)} avec chaque stratégie, au centime.`,
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          {
            libelle: "Marge par unité, domination par les coûts",
            attendu: k.couts.margeUnitaire,
            calcul: `${eur(k.couts.marge)} ÷ ${qte(k.couts.ventes)} = ${eur(k.couts.margeUnitaire)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Marge par unité, différenciation",
            attendu: k.differenciation.margeUnitaire,
            calcul: `${eur(k.differenciation.marge)} ÷ ${qte(k.differenciation.ventes)} = ${eur(k.differenciation.margeUnitaire)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          `Une unité vendue laisse ${eur(k.couts.margeUnitaire)} avec la domination par les coûts, ${eur(k.milieu.margeUnitaire)} au milieu et ${eur(k.differenciation.margeUnitaire)} avec la différenciation : ${k.couts.margeUnitaire < k.milieu.margeUnitaire && k.milieu.margeUnitaire < k.differenciation.margeUnitaire ? "plus le prix est bas, moins chaque vente rapporte" : "le prix ne fait pas seul la marge"}. Le taux de marge passe de ${pct(k.couts.tauxDeMarge)} à ${pct(k.differenciation.tauxDeMarge)} du chiffre d'affaires.`,
          "La stratégie de coûts gagne par le nombre de ventes, la différenciation par ce que rapporte chacune. Reste à savoir laquelle paie le mieux les charges de l'année.",
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat de l'année",
      notions: ["full_unit_cost", "income_statement"],
      tableau: (c) => {
        const k = coutsOuDifferenciation(c);
        return {
          titre: "L'année rejouée avec chaque stratégie : les coûts et le résultat",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Budgets qualité et marketing de l'année", valeurs: k.trois.map((x) => eur(x.qualite + x.marketing)) },
            { libelle: "Coût complet d'une unité vendue", valeurs: k.trois.map((x) => eur(x.coutComplet)) },
            { libelle: "Résultat de l'exercice", valeurs: k.trois.map((x) => eur(x.resultat)) },
          ],
        };
      },
      question: () =>
        "Le coût complet d'une unité vendue compte toutes les charges d'exploitation, réparties sur les ventes. Calculez l'écart de résultat de l'exercice entre chaque stratégie et le milieu.",
      champs: (c) => {
        const k = coutsOuDifferenciation(c);
        return [
          {
            libelle: "Écart de résultat, domination par les coûts moins milieu",
            attendu: k.ecartCouts,
            calcul: `${eur(k.couts.resultat)} − ${retranche(k.milieu.resultat)} = ${eur(k.ecartCouts)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat, différenciation moins milieu",
            attendu: k.ecartDifferenciation,
            calcul: `${eur(k.differenciation.resultat)} − ${retranche(k.milieu.resultat)} = ${eur(k.ecartDifferenciation)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = coutsOuDifferenciation(c);
        const plusBas = k.couts.coutComplet < k.milieu.coutComplet && k.couts.coutComplet < k.differenciation.coutComplet;
        return [
          plusBas
            ? `La domination par les coûts porte bien son nom : une unité vendue y coûte ${eur(k.couts.coutComplet)} tout compris, contre ${eur(k.milieu.coutComplet)} au milieu et ${eur(k.differenciation.coutComplet)} avec la différenciation. Les budgets coupés pèsent moins, et les charges fixes se répartissent sur plus de ventes.`
            : `Une unité vendue coûte ${eur(k.couts.coutComplet)} tout compris avec la domination par les coûts, ${eur(k.milieu.coutComplet)} au milieu et ${eur(k.differenciation.coutComplet)} avec la différenciation.`,
          `Sur l'année, la domination par les coûts fait ${ecart(k.ecartCouts)} de résultat par rapport au milieu, la différenciation ${ecart(k.ecartDifferenciation)}.`,
        ];
      },
    },
    {
      id: "laquelle",
      type: "choix",
      titre: "Quelle stratégie retenir ?",
      notions: ["demand_market_share", "contribution_margin"],
      question: (c) => {
        const { bas, haut } = coutsOuDifferenciation(c).concurrents;
        return `Face ${aU(bas.nom)} et ${aU(haut.nom)}, quelle stratégie donne à ${c.entreprise} le meilleur résultat de l'année ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const { bas, haut } = k.concurrents;
        const m = k.meilleure;
        const non = (x: BilanDeLAnnee) =>
          `Non : ${NOMS_DES_STRATEGIES[x.code]} donne ${eur(x.resultat)} sur l'année, contre ${eur(m.resultat)} avec ${NOMS_DES_STRATEGIES[m.code]}.`;
        const oui: Record<CodeDeStrategie, string> = {
          couts: `Oui : ${eur(k.couts.resultat)} sur l'année, contre ${eur(k.milieu.resultat)} au milieu et ${eur(k.differenciation.resultat)} avec la différenciation. Les ventes en plus (${pct(k.couts.part)} du marché, contre ${pct(k.milieu.part)}) paient la marge perdue sur chaque unité. ${
            k.couts.prixMoyen > bas.prix
              ? `${bas.nom} reste moins cher (${eur(bas.prix)}) : ${c.entreprise} n'a pas besoin d'être la moins chère du marché pour gagner du volume, elle doit avoir des coûts assez bas pour vivre de petites marges.`
              : `${c.entreprise} devient la moins chère du marché, sous ${bas.nom} (${eur(bas.prix)}) : il lui faut tenir des coûts plus bas que les siens.`
          }`,
          differenciation: `Oui : ${eur(k.differenciation.resultat)} sur l'année, contre ${eur(k.milieu.resultat)} au milieu et ${eur(k.couts.resultat)} avec la domination par les coûts. Chaque unité laisse ${eur(k.differenciation.margeUnitaire)} de marge, contre ${eur(k.milieu.margeUnitaire)} au milieu : ${c.entreprise} vend moins, mais gagne plus sur chaque vente. ${
            k.differenciation.prixMoyen < haut.prix
              ? `${haut.nom} reste plus cher (${eur(haut.prix)}) : ${c.entreprise} se différencie sans aller jusqu'au prix du haut de gamme.`
              : `${c.entreprise} vend même plus cher ${quE(haut.nom)} (${eur(haut.prix)}) : sa qualité doit le justifier aux yeux des clients.`
          }`,
          milieu: `Oui : ${eur(k.milieu.resultat)} sur l'année, plus qu'avec la domination par les coûts (${eur(k.couts.resultat)}) ou la différenciation (${eur(k.differenciation.resultat)}). Ici, aucune des deux stratégies, telle que l'arène la joue, ne paie ce qu'elle change.`,
        };
        const options: { code: CodeDeStrategie; texte: string }[] = [
          { code: "couts", texte: "La domination par les coûts" },
          { code: "differenciation", texte: "La différenciation" },
          { code: "milieu", texte: "Rester au milieu, comme l'année du cours" },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.code === m.code,
          retour: o.code === m.code ? oui[o.code] : non(k.trois.find((x) => x.code === o.code)!),
        }));
      },
    },
    {
      id: "milieu",
      type: "choix",
      titre: "Rester au milieu",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const k = coutsOuDifferenciation(c);
        return k.coince
          ? `Au milieu, ${c.entreprise} n'a ni la part de marché de la domination par les coûts (${pct(k.couts.part)}, contre ${pct(k.milieu.part)}), ni la marge par unité de la différenciation (${eur(k.differenciation.margeUnitaire)}, contre ${eur(k.milieu.margeUnitaire)}). Par le résultat de l'année, où le milieu se classe-t-il ?`
          : `Par le résultat de l'année, où le milieu se classe-t-il face aux deux stratégies ?`;
      },
      options: (c) => {
        const k = coutsOuDifferenciation(c);
        const { bas, haut } = k.concurrents;
        const m = k.milieu;
        const classement = `le milieu donne ${eur(m.resultat)}, la domination par les coûts ${eur(k.couts.resultat)}, la différenciation ${eur(k.differenciation.resultat)}`;
        const autre = k.trois.find((x) => x !== m && x !== k.meilleure)!;
        return [
          {
            texte: "Dernier des trois",
            juste: k.rangDuMilieu === "dernier",
            retour:
              k.rangDuMilieu === "dernier"
                ? `Oui : ${classement}. C'est l'enlisement au milieu : ${c.entreprise} n'a ni le volume qui baisse le coût complet d'une unité (${eur(m.coutComplet)}, contre ${eur(k.couts.coutComplet)} avec les coûts), ni la marge par unité qui paie la qualité (${eur(m.margeUnitaire)}, contre ${eur(k.differenciation.margeUnitaire)}). ${bas.nom} tient déjà le prix bas, ${haut.nom} le haut de gamme.`
                : `Non : ${classement}.`,
          },
          {
            texte: "Premier des trois",
            juste: k.rangDuMilieu === "premier",
            retour: k.rangDuMilieu === "premier" ? `Oui : ${classement}. Ici, rester au milieu paie mieux que les deux stratégies.` : `Non : ${classement}.`,
          },
          {
            texte: "Entre les deux stratégies",
            juste: k.rangDuMilieu === "entre",
            retour:
              k.rangDuMilieu === "entre"
                ? `Oui : ${classement}. Ici, le milieu fait mieux que ${NOMS_DES_STRATEGIES[autre.code]}, mais il gagne ${eur(k.meilleure.resultat - m.resultat)} de moins que ${NOMS_DES_STRATEGIES[k.meilleure.code]}. Rester au milieu n'est pas toujours le pire ; c'est rarement le mieux, parce que chaque concurrent tient déjà un côté du marché.`
                : `Non : ${classement}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "full_unit_cost"],
      texte: (c) => {
        const k = coutsOuDifferenciation(c);
        const m = k.meilleure;
        return [
          `Chez ${c.entreprise}, ${NOMS_DES_STRATEGIES[m.code]} donne le meilleur résultat de l'année rejouée (${eur(m.resultat)}), et le milieu se classe ${k.rangDuMilieu === "dernier" ? "dernier des trois" : k.rangDuMilieu === "premier" ? "premier des trois" : "entre les deux stratégies"}.`,
          "Une stratégie générique est un choix cohérent : la domination par les coûts baisse le prix, les budgets et le coût d'une unité, et vit du volume ; la différenciation monte le prix, la qualité et la communication, et vit de la marge. Celle qui convient dépend du marché et de ce que les concurrents occupent déjà. Rester au milieu, c'est risquer de n'avoir ni le volume de l'une ni la marge de l'autre.",
        ];
      },
      repere: () =>
        "Part de marché = ventes ÷ marché × 100. Marge par unité = marge sur coût variable ÷ ventes. Une stratégie se juge au résultat de l'année, pas à la part de marché seule.",
    },
  ],
};
