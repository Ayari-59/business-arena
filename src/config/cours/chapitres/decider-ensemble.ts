import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult, RoundDecisions } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accordPluriel } from "../accords";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, type Changement } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DÉCIDER ENSEMBLE, CHACUN SON ÉCRAN, UNE SEULE DÉCISION (Bac STMG, management,
 * palier 1).
 *
 * L'intelligence collective dans une équipe de l'arène. Une équipe qui joue a plusieurs écrans :
 * le marché (les ventes, les clients qui repartent sans être servis), la trésorerie (ce qui entre
 * et sort de la caisse). Le chapitre rejoue l'année trois fois : décidée par le « commercial »
 * seul, qui ne regarde que le marché et pousse les ventes ; par le « financier » seul, qui ne
 * regarde que la trésorerie et coupe les dépenses ; et par l'équipe qui croise les écrans, l'année
 * du cours elle-même (le bon gestionnaire, arene-du-cours.ts). Il compare les ventes, le résultat
 * net, la trésorerie de fin d'année et les clients perdus, et calcule le verdict : quelle façon de
 * décider fait le meilleur résultat, et sur quels critères chacune l'emporte ou finit dernière.
 *
 * CE QUI EST UNE HYPOTHÈSE DU COURS, ET LE CHAPITRE LE DIT : les deux rôles et ce que chacun
 * déciderait seul (les constantes ci-dessous). L'arène, elle, joue les décisions : mêmes
 * concurrents, même graine, et la même façon de gérer le reste (la production, l'équipe, les
 * créances, que le gestionnaire règle dans l'année rejouée sur ce qu'il y voit).
 *
 * LES VALEURS SONT ABSOLUES, POSÉES SUR L'ANNÉE DU COURS. Le formulaire reconduit la décision
 * jouée au trimestre d'avant : un prix ou un budget multiplié à chaque trimestre sur la décision
 * reçue se composerait (0,9, puis 0,81…). Chaque façon de décider pose donc, à chaque trimestre,
 * la valeur de l'année du cours au même trimestre (`decisionsDeLAnneeDuCours`), multipliée par
 * sa constante ; le test vérifie la valeur jouée à chaque trimestre. À la boutique, qui vend une
 * gamme, le prix et les budgets se posent aussi référence par référence, et le budget de marque.
 *
 * Il ne double pas « Domination par les coûts ou différenciation » (stratégie), qui compare deux
 * stratégies tenues par toute l'entreprise : ici, la question est QUI décide, et sur quels écrans.
 */

/** Le commercial seul baisse ses prix de 10 % sous ceux de l'année du cours (hypothèse du cours). */
export const BAISSE_DE_PRIX_DU_COMMERCIAL = 0.1;
/** Et monte sa publicité de moitié (hypothèse du cours). */
export const HAUSSE_DE_PUBLICITE_DU_COMMERCIAL = 0.5;
/** Le financier seul coupe de moitié les budgets de publicité, de qualité et d'entretien (hypothèse du cours). */
export const COUPE_DU_FINANCIER = 0.5;

/**
 * Les entreprises du chapitre : toutes. Dans chacune, les trois années se jouent sans défaillance
 * (le test le recompte) ; il y a partout trois années complètes à comparer.
 */
export const ENTREPRISES_DE_LA_DECISION = ENTREPRISES_DU_COURS;

export type Facon = "commercial" | "financier" | "equipe";
export const FACONS: readonly Facon[] = ["commercial", "financier", "equipe"];

const NOM: Record<Facon, string> = {
  commercial: "le commercial seul",
  financier: "le financier seul",
  equipe: "l'équipe",
};
const Nom = (f: Facon) => NOM[f].charAt(0).toUpperCase() + NOM[f].slice(1);

/**
 * LES DÉCISIONS DE L'ANNÉE DU COURS, trimestre par trimestre, relevées pendant que l'arène la
 * rejoue sans rien changer : chaque façon de décider pose ses valeurs sur elles.
 */
const decisionsRelevees = new Map<string, readonly RoundDecisions[]>();
export function decisionsDeLAnneeDuCours(code: string): readonly RoundDecisions[] {
  const deja = decisionsRelevees.get(code);
  if (deja) return deja;
  const vues: RoundDecisions[] = [];
  rejouerAvec(code, "decider-ensemble:decisions-de-l-annee", (tour, d) => {
    vues[tour - 1] = structuredClone(d);
    return undefined;
  });
  decisionsRelevees.set(code, vues);
  return vues;
}

/** Ce qu'un rôle pose sur la décision de l'année du cours : des multiplicateurs, appliqués à chaque trimestre. */
interface Pose {
  prix?: number;
  publicite?: number;
  qualite?: number;
  entretien?: number;
}

const POSES: Record<Exclude<Facon, "equipe">, Pose> = {
  commercial: { prix: 1 - BAISSE_DE_PRIX_DU_COMMERCIAL, publicite: 1 + HAUSSE_DE_PUBLICITE_DU_COMMERCIAL },
  financier: { publicite: COUPE_DU_FINANCIER, qualite: COUPE_DU_FINANCIER, entretien: COUPE_DU_FINANCIER },
};

/**
 * La décision d'un rôle, chaque trimestre : les valeurs de l'année du cours au même trimestre,
 * multipliées ; ce que le rôle ne décide pas reste ce que le gestionnaire règle dans l'année rejouée.
 */
export function decisionDuRole(code: string, role: Exclude<Facon, "equipe">): Changement {
  const annee = decisionsDeLAnneeDuCours(code);
  const p = POSES[role];
  return (tour, d) => {
    const r = annee[tour - 1]!;
    const out: RoundDecisions = { ...d };
    if (p.prix !== undefined) out.price = r.price * p.prix;
    if (p.publicite !== undefined) {
      out.marketingBudget = r.marketingBudget * p.publicite;
      if (r.brandMarketingBudget !== undefined) out.brandMarketingBudget = r.brandMarketingBudget * p.publicite;
    }
    if (p.qualite !== undefined) out.qualityBudget = r.qualityBudget * p.qualite;
    if (p.entretien !== undefined) out.maintenanceBudget = r.maintenanceBudget * p.entretien;
    if (d.products) {
      out.products = Object.fromEntries(
        Object.entries(d.products).map(([cle, prod]) => {
          const rp = r.products?.[cle] ?? prod;
          return [
            cle,
            {
              ...prod,
              ...(p.prix !== undefined ? { price: rp.price * p.prix } : {}),
              ...(p.publicite !== undefined && rp.marketingBudget !== undefined ? { marketingBudget: rp.marketingBudget * p.publicite } : {}),
              ...(p.qualite !== undefined && rp.qualityBudget !== undefined ? { qualityBudget: rp.qualityBudget * p.qualite } : {}),
            },
          ];
        }),
      );
    }
    return out;
  };
}

/** L'année décidée d'une façon : l'équipe, c'est l'année du cours. */
export function anneeDecidee(code: string, f: Facon): readonly CompanyRoundResult[] {
  return f === "equipe" ? anneeDeReference(code) : rejouerAvec(code, `decider-ensemble:${f}`, decisionDuRole(code, f));
}

/** Une année, en grandes masses arrondies à l'euro (à l'unité pour les ventes et les clients perdus). */
export interface BilanDeLAnnee {
  ventes: number;
  chiffreDAffaires: number;
  prixMoyen: number;
  publicite: number;
  qualite: number;
  entretien: number;
  resultat: number;
  tresorerie: number;
  clientsPerdus: number;
  /** Aucun trimestre en défaillance. */
  active: boolean;
}

/** Les clients venus et repartis sans être servis dans un trimestre : les ventes manquées. */
export const clientsPerdusDuTrimestre = (r: CompanyRoundResult) =>
  Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0) + (r.subscription?.unserved ?? 0);

export function bilanDeLAnnee(annee: readonly CompanyRoundResult[]): BilanDeLAnnee {
  const somme = (f: (r: CompanyRoundResult) => number) => Math.round(annee.reduce((t, r) => t + f(r), 0));
  const ventes = somme(soldUnits);
  const chiffreDAffaires = somme((r) => r.incomeStatement.revenue);
  return {
    ventes,
    chiffreDAffaires,
    prixMoyen: auCentime(chiffreDAffaires / ventes),
    publicite: somme((r) => r.incomeStatement.marketingCost),
    qualite: somme((r) => r.incomeStatement.qualityCost),
    entretien: somme((r) => r.incomeStatement.maintenanceCost),
    resultat: somme((r) => r.incomeStatement.netIncome),
    tresorerie: Math.round(annee.at(-1)!.cashFlow.closing),
    clientsPerdus: somme(clientsPerdusDuTrimestre),
    active: !annee.some((r) => r.defaillant),
  };
}

export type Critere = "ventes" | "resultat" | "tresorerie" | "clientsPerdus";
export const CRITERES: readonly Critere[] = ["ventes", "resultat", "tresorerie", "clientsPerdus"];
/** Le sens de chaque critère : plus de ventes, de résultat et de trésorerie, moins de clients perdus. */
const SENS: Record<Critere, 1 | -1> = { ventes: 1, resultat: 1, tresorerie: 1, clientsPerdus: -1 };
const NOM_DU_CRITERE: Record<Critere, string> = {
  ventes: "les ventes",
  resultat: "le résultat net",
  tresorerie: "la trésorerie",
  clientsPerdus: "les clients perdus",
};

export type VerdictDesCriteres = "equipe-partout" | "equipe-jamais-derniere" | "equipe-derniere";

/** Les trois années, et ce que la comparaison en dit. */
export function troisFacons(c: Cas) {
  const b = Object.fromEntries(FACONS.map((f) => [f, bilanDeLAnnee(anneeDecidee(c.code, f))])) as Record<Facon, BilanDeLAnnee>;
  const note = (f: Facon, k: Critere) => SENS[k] * b[f][k];
  const premiers = (k: Critere) => FACONS.filter((f) => note(f, k) === Math.max(...FACONS.map((g) => note(g, k))));
  // Dernière : la plus mauvaise valeur, quand les trois ne sont pas égales.
  const derniers = (k: Critere) => (premiers(k).length === FACONS.length ? [] : FACONS.filter((f) => note(f, k) === Math.min(...FACONS.map((g) => note(g, k)))));
  const meilleurResultat = FACONS.reduce((a, f) => (b[f].resultat > b[a].resultat ? f : a));
  const depenses = (x: BilanDeLAnnee) => x.publicite + x.qualite + x.entretien;
  const equipeDerniereSur = CRITERES.filter((k) => derniers(k).includes("equipe"));
  const verdict: VerdictDesCriteres = CRITERES.every((k) => premiers(k).includes("equipe"))
    ? "equipe-partout"
    : equipeDerniereSur.length === 0
      ? "equipe-jamais-derniere"
      : "equipe-derniere";
  return {
    b,
    premiers,
    derniers,
    meilleurResultat,
    /** Deux façons de décider font le même meilleur résultat : la question n'aurait pas de réponse unique. */
    egaliteAuResultat: FACONS.filter((f) => b[f].resultat === b[meilleurResultat].resultat).length > 1,
    commercial: {
      ecartDeVentes: b.commercial.ventes - b.equipe.ventes,
      ecartDeClientsPerdus: b.commercial.clientsPerdus - b.equipe.clientsPerdus,
      ecartDeResultat: b.commercial.resultat - b.equipe.resultat,
    },
    financier: {
      depensesCoupees: depenses(b.equipe) - depenses(b.financier),
      ecartDeVentes: b.financier.ventes - b.equipe.ventes,
      ecartDeResultat: b.financier.resultat - b.equipe.resultat,
      ecartDeTresorerie: b.financier.tresorerie - b.equipe.tresorerie,
    },
    equipeDerniereSur,
    verdict,
  };
}

/** Une ou plusieurs façons de décider, nommées : « l'équipe et le financier seul ». */
const noms = (fs: readonly Facon[]) => (fs.length === 1 ? NOM[fs[0]!] : `${fs.slice(0, -1).map((f) => NOM[f]).join(", ")} et ${NOM[fs.at(-1)!]}`);
const listeDesCriteres = (ks: readonly Critere[]) =>
  ks.length === 0 ? "" : ks.length === 1 ? NOM_DU_CRITERE[ks[0]!] : `${ks.slice(0, -1).map((k) => NOM_DU_CRITERE[k]).join(", ")} et ${NOM_DU_CRITERE[ks.at(-1)!]}`;

/** Critère par critère : qui l'emporte. */
function lesPremiers(k: ReturnType<typeof troisFacons>) {
  return `Le meilleur, ligne par ligne : ${CRITERES.map((x) => `${NOM_DU_CRITERE[x].replace(/^(les|le|la) /, "")}, ${noms(k.premiers(x))}`).join(" ; ")}`;
}

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pourcent = (x: number) => `${Math.round(x * 100)} %`;

function tableauDesDecisions(c: Cas): TableauDeDonnees {
  const k = troisFacons(c);
  const ligne = (libelle: string, f: (x: BilanDeLAnnee) => string) => ({ libelle, valeurs: FACONS.map((g) => f(k.b[g])) });
  return {
    titre: `Ce que chaque façon de décider engage sur l'année, chez ${c.entreprise}`,
    colonnes: FACONS.map(Nom),
    lignes: [
      ligne("Prix de vente moyen", (x) => eur(x.prixMoyen)),
      ligne("Publicité", (x) => eur(x.publicite)),
      ...(k.b.equipe.qualite > 0 ? [ligne("Qualité", (x) => eur(x.qualite))] : []),
      ligne("Entretien", (x) => eur(x.entretien)),
    ],
  };
}

function tableauFace(c: Cas, f: Exclude<Facon, "equipe">): TableauDeDonnees {
  const k = troisFacons(c);
  const ligne = (libelle: string, v: (x: BilanDeLAnnee) => string) => ({ libelle, valeurs: [v(k.b[f]), v(k.b.equipe)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, décidée par ${NOM[f]} et par l'équipe`,
    colonnes: [Nom(f), Nom("equipe")],
    lignes: [
      ...(f === "financier" ? [ligne("Publicité, qualité et entretien", (x) => eur(x.publicite + x.qualite + x.entretien))] : []),
      ligne(`Ventes (${c.unites})`, (x) => qte(x.ventes)),
      ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
      ligne("Résultat net", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin d'année", (x) => eur(x.tresorerie)),
      ligne(`Clients perdus (${c.unites})`, (x) => qte(x.clientsPerdus)),
    ],
  };
}

function tableauDesTrois(c: Cas): TableauDeDonnees {
  const k = troisFacons(c);
  const ligne = (libelle: string, v: (x: BilanDeLAnnee) => string) => ({ libelle, valeurs: FACONS.map((f) => v(k.b[f])) });
  return {
    titre: `L'année ${dE(c.entreprise)}, décidée de trois façons`,
    colonnes: FACONS.map(Nom),
    lignes: [
      ligne(`Ventes (${c.unites})`, (x) => qte(x.ventes)),
      ligne("Résultat net", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin d'année", (x) => eur(x.tresorerie)),
      ligne(`Clients perdus (${c.unites})`, (x) => qte(x.clientsPerdus)),
    ],
  };
}

export const DECIDER_ENSEMBLE: Chapitre = {
  code: "decider-ensemble",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Décider ensemble : chacun son écran, une seule décision",
  accroche:
    "Le commercial regarde le marché, le financier la trésorerie. Chacun seul déciderait autrement. L'arène rejoue l'année trois fois, et compare ce que donne chaque façon de décider.",
  objectifs: [
    "Relier chaque rôle d'une équipe à l'information qu'il regarde",
    "Chiffrer ce que donne une décision prise d'un seul point de vue",
    "Comparer plusieurs façons de décider sur plusieurs critères",
    "Expliquer ce que l'équipe gagne à croiser ses informations",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chacun son écran",
      notions: ["dashboard", "net_treasury"],
      tableau: tableauDesDecisions,
      texte: (c) => [
        `Dans une équipe qui dirige ${c.entreprise} dans l'arène, chacun a ses écrans. Le commercial regarde le marché : ce qui s'est vendu, les clients repartis sans être servis, les prix des concurrents. Le financier regarde la trésorerie : ce qui entre dans la caisse, ce qui en sort, ce qui reste à la fin.`,
        `Seul, chacun déciderait avec ce qu'il voit. Le commercial pousserait les ventes : des prix ${pourcent(BAISSE_DE_PRIX_DU_COMMERCIAL)} plus bas, une publicité plus forte de moitié. Le financier couperait les dépenses : les budgets de publicité, de qualité et d'entretien divisés par deux. L'équipe, elle, croise les écrans avant de prendre une seule décision : c'est l'année du cours, celle du bon gestionnaire.`,
        "Ces deux rôles, et ce que chacun déciderait seul, sont une hypothèse du cours. L'arène, elle, joue les décisions : elle rejoue l'année avec chacune, les mêmes concurrents et la même façon de gérer le reste (la production, l'équipe).",
      ],
      repere: () => "Une décision prise d'un seul point de vue voit ce que montre un écran, et ignore ce que montrent les autres.",
    },
    {
      id: "commercial",
      type: "montants",
      titre: "Le commercial seul",
      notions: ["price_elasticity", "customer_acquisition_cost"],
      tableau: (c) => tableauFace(c, "commercial"),
      question: (c) =>
        `L'arène a rejoué l'année ${dE(c.entreprise)} décidée par le commercial seul. Calculez l'écart de ventes, l'écart de clients perdus et l'écart de résultat net (commercial seul moins équipe).`,
      champs: (c) => {
        const k = troisFacons(c);
        return [
          { libelle: `Écart de ventes (${c.unites})`, attendu: k.commercial.ecartDeVentes, calcul: `${qte(k.b.commercial.ventes)} − ${qte(k.b.equipe.ventes)} = ${qte(k.commercial.ecartDeVentes)}`, tolerance: 0 },
          {
            libelle: `Écart de clients perdus (${c.unites})`,
            attendu: k.commercial.ecartDeClientsPerdus,
            calcul: `${qte(k.b.commercial.clientsPerdus)} − ${qte(k.b.equipe.clientsPerdus)} = ${qte(k.commercial.ecartDeClientsPerdus)}`,
            tolerance: 0,
          },
          { libelle: "Écart de résultat net", attendu: k.commercial.ecartDeResultat, calcul: `${eur(k.b.commercial.resultat)} − ${retranche(k.b.equipe.resultat)} = ${eur(k.commercial.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = troisFacons(c);
        const x = k.commercial;
        return [
          `${x.ecartDeVentes > 0 ? `Le commercial a gagné son pari sur son écran : ${qte(x.ecartDeVentes)} ${c.unites} ${accordPluriel(c, "vendu")} de plus.` : `Même ses ventes n'y gagnent pas : ${qte(-x.ecartDeVentes)} ${c.unites} de moins.`} ${
            x.ecartDeClientsPerdus > 0
              ? `Mais les clients perdus augmentent de ${qte(x.ecartDeClientsPerdus)} ${c.unites} : l'entreprise n'a pas pu servir toute la demande qu'il a fait venir. Ce qu'elle peut produire, il ne le regardait pas.`
              : "Et la production a suivi : pas plus de clients perdus."
          }`,
          x.ecartDeResultat < 0
            ? `Le résultat net baisse de ${eur(-x.ecartDeResultat)} : chaque vente rapporte moins à prix plus bas, et la publicité en plus se paie. Le commercial ne regardait pas cet écran-là.`
            : `Le résultat net monte de ${eur(x.ecartDeResultat)} : cette année, les ventes en plus ont payé le prix plus bas et la publicité.`,
        ];
      },
    },
    {
      id: "financier",
      type: "montants",
      titre: "Le financier seul",
      notions: ["net_treasury", "fixed_costs"],
      tableau: (c) => tableauFace(c, "financier"),
      question: (c) =>
        `L'arène a rejoué l'année ${dE(c.entreprise)} décidée par le financier seul. Calculez les dépenses coupées (publicité, qualité et entretien de l'équipe moins ceux du financier), puis l'écart de ventes, l'écart de résultat net et l'écart de trésorerie (financier seul moins équipe).`,
      champs: (c) => {
        const k = troisFacons(c);
        const d = (x: BilanDeLAnnee) => x.publicite + x.qualite + x.entretien;
        return [
          { libelle: "Dépenses coupées", attendu: k.financier.depensesCoupees, calcul: `${eur(d(k.b.equipe))} − ${eur(d(k.b.financier))} = ${eur(k.financier.depensesCoupees)}`, tolerance: 1 },
          { libelle: `Écart de ventes (${c.unites})`, attendu: k.financier.ecartDeVentes, calcul: `${qte(k.b.financier.ventes)} − ${qte(k.b.equipe.ventes)} = ${qte(k.financier.ecartDeVentes)}`, tolerance: 0 },
          { libelle: "Écart de résultat net", attendu: k.financier.ecartDeResultat, calcul: `${eur(k.b.financier.resultat)} − ${retranche(k.b.equipe.resultat)} = ${eur(k.financier.ecartDeResultat)}`, tolerance: 1 },
          { libelle: "Écart de trésorerie", attendu: k.financier.ecartDeTresorerie, calcul: `${eur(k.b.financier.tresorerie)} − ${retranche(k.b.equipe.tresorerie)} = ${eur(k.financier.ecartDeTresorerie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = troisFacons(c);
        const x = k.financier;
        return [
          `Le financier économise ${eur(x.depensesCoupees)} de dépenses. ${
            x.ecartDeVentes < 0
              ? `Mais avec moins de publicité, moins de clients viennent : ${qte(-x.ecartDeVentes)} ${c.unites} ${accordPluriel(c, "vendu")} de moins.${
                  k.b.financier.clientsPerdus < k.b.equipe.clientsPerdus ? " S'il perd aussi moins de clients, c'est d'abord parce qu'il en attire moins." : ""
                }`
              : "Ses ventes n'en souffrent pas cette année."
          }`,
          `${x.ecartDeResultat > 0 ? `Son résultat net est plus haut de ${eur(x.ecartDeResultat)} : la marge perdue sur les ventes en moins coûte moins que ce qu'il économise.` : `Son résultat net est plus bas de ${eur(-x.ecartDeResultat)} : la marge perdue sur les ventes en moins coûte plus que ce qu'il économise.`} ${
            x.ecartDeTresorerie > 0 ? `Sa trésorerie finit plus haut de ${eur(x.ecartDeTresorerie)}.` : `Sa trésorerie finit même plus bas, de ${eur(-x.ecartDeTresorerie)}.`
          }`,
        ];
      },
    },
    {
      id: "meilleur-resultat",
      type: "choix",
      titre: "Le meilleur résultat",
      notions: ["income_statement"],
      tableau: tableauDesTrois,
      question: (c) => `Laquelle des trois façons de décider fait le meilleur résultat net ${dE(c.entreprise)} sur l'année ?`,
      options: (c) => {
        const k = troisFacons(c);
        const textes: Record<Facon, string> = {
          commercial: "Le commercial seul, qui pousse les ventes",
          financier: "Le financier seul, qui coupe les dépenses",
          equipe: "L'équipe, qui croise les écrans",
        };
        return FACONS.map((f) => ({
          texte: textes[f],
          juste: f === k.meilleurResultat,
          retour:
            f === k.meilleurResultat
              ? `Oui : ${eur(k.b[f].resultat)}, contre ${FACONS.filter((g) => g !== f)
                  .map((g) => `${eur(k.b[g].resultat)} pour ${NOM[g]}`)
                  .join(" et ")}.${f === "financier" ? " Cette année, couper les dépenses rapporte plus que les ventes qu'elles faisaient gagner ; regardez pourtant ce qu'il perd sur les autres écrans." : ""}`
              : `Non : ${eur(k.b[f].resultat)}, contre ${eur(k.b[k.meilleurResultat].resultat)} pour ${NOM[k.meilleurResultat]}.`,
        }));
      },
    },
    {
      id: "criteres",
      type: "choix",
      titre: "Critère par critère",
      notions: ["dashboard"],
      tableau: tableauDesTrois,
      question: () =>
        "Comparez maintenant les trois façons de décider, ligne par ligne : plus de ventes, de résultat et de trésorerie, moins de clients perdus. Que dit la comparaison ?",
      options: (c) => {
        const k = troisFacons(c);
        const detail = `${lesPremiers(k)}.`;
        return [
          {
            texte: "L'équipe est la meilleure sur tous les critères",
            juste: k.verdict === "equipe-partout",
            retour: k.verdict === "equipe-partout" ? `Oui. ${detail}` : `Non. ${detail}`,
          },
          {
            texte: "L'équipe n'est dernière sur aucun critère, sans être la meilleure partout",
            juste: k.verdict === "equipe-jamais-derniere",
            retour:
              k.verdict === "equipe-jamais-derniere"
                ? `Oui. ${detail} ${Nom("commercial")} finit dernier sur ${listeDesCriteres(CRITERES.filter((x) => k.derniers(x).includes("commercial"))) || "aucun critère"}, ${NOM.financier} sur ${listeDesCriteres(CRITERES.filter((x) => k.derniers(x).includes("financier"))) || "aucun critère"}.`
                : `Non. ${detail}`,
          },
          {
            texte: "L'équipe est dernière sur au moins un critère",
            juste: k.verdict === "equipe-derniere",
            retour:
              k.verdict === "equipe-derniere"
                ? `Oui : l'équipe finit dernière sur ${listeDesCriteres(k.equipeDerniereSur)}. ${detail}`
                : `Non : sur chaque critère, l'une des deux autres façons fait moins bien qu'elle. ${detail}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "L'intelligence collective",
      notions: ["dashboard"],
      texte: (c) => {
        const k = troisFacons(c);
        const derniersSur = (f: Facon) => CRITERES.filter((x) => k.derniers(x).includes(f));
        const commercial = derniersSur("commercial");
        const financier = derniersSur("financier");
        return [
          `Chez ${c.entreprise}, cette année, le meilleur résultat net est celui ${k.meilleurResultat === "equipe" ? "de l'équipe" : `du ${NOM[k.meilleurResultat].replace(/^le /, "")}`}. ${
            commercial.length > 0 ? `Le commercial seul finit dernier sur ${listeDesCriteres(commercial)}` : "Le commercial seul ne finit dernier sur aucun critère"
          } ; ${financier.length > 0 ? `le financier seul sur ${listeDesCriteres(financier)}` : "le financier seul sur aucun"}${
            k.equipeDerniereSur.length === 0 ? ", l'équipe sur aucun." : `, l'équipe sur ${listeDesCriteres(k.equipeDerniereSur)}.`
          }`,
                    `Chaque rôle voit juste sur son écran et sacrifie ce qu'il ne regarde pas. Décider ensemble, c'est mettre les écrans côte à côte avant de trancher : ce que le commercial gagne en ventes, le financier le voit sortir de la caisse. ${
            k.verdict === "equipe-derniere"
              ? "Cette année, l'équipe elle-même finit dernière sur un critère : croiser les écrans ne garantit rien, il faut encore bien les lire."
              : `C'est cela, l'intelligence collective : une décision qui tient sur tous les critères à la fois, quand ${commercial.length > 0 && financier.length > 0 ? "chacun seul en sacrifie un" : "une décision prise seul en sacrifie un"}.`
          }`,
          "Les rôles et leurs décisions sont une hypothèse du cours ; les chiffres, eux, sont ceux que l'arène a joués.",
        ];
      },
      repere: () => "Une équipe décide mieux quand elle croise ses informations avant de trancher, et qu'elle juge une décision sur plusieurs critères.",
    },
  ],
};
