import { computePotentialDemand } from "../../../engine/market/demand";
import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { scenarioDuCours } from "../arene-du-cours";
import { anneeJouee, type Cas } from "../cas";
import { anneeDeReference, rejouerAvec } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'OFFRE ET LA DEMANDE SUR UN MARCHÉ (seconde, sciences économiques et sociales,
 * palier 1).
 *
 * Le raisonnement de l'économiste, sur le marché de l'arène : d'un côté les acheteurs (la
 * demande), de l'autre les vendeurs (l'offre), et un prix. L'élève lit la demande que le marché
 * adresse à l'entreprise et ce qui la fait varier, l'offre de l'entreprise (ce qu'elle met en
 * vente), la quantité échangée (la plus petite des deux), puis la demande reçue sur l'année à
 * trois prix : la loi de la demande.
 *
 * D'OÙ VIENNENT LES CHIFFRES. Tout vient de l'année du cours (`anneeDeReference`, l'année que
 * joue `anneeJouee`) et de ses rejeux (`rejouerAvec`, clés « l-offre-et-la-demande:… ») :
 *
 *   · la demande du marché de chaque clientèle est celle que le moteur a jouée (`potential`) :
 *     la taille de la clientèle, sa croissance et sa saison (`computePotentialDemand`), et un
 *     événement du marché quand il en survient un ; la demande reçue est la part qu'en capte
 *     l'entreprise (`demandForCompany`), selon son prix, sa qualité, sa publicité et ses
 *     clients du trimestre d'avant ;
 *   · la sensibilité au prix de chaque clientèle est l'élasticité-prix du scénario
 *     (`priceElasticity`) ;
 *   · l'offre de l'entreprise au trimestre est ce qu'elle avait à vendre : le stock du début
 *     (aucun pour un service, qui ne se stocke pas), plus ce qu'elle a produit, moins les rebuts.
 *     Le moteur sert la demande avec exactement cela (le test le vérifie) ;
 *   · l'année rejouée à trois prix pose, à chaque trimestre, le prix de l'année de référence
 *     multiplié par le facteur (`PRIX_BAS`, `PRIX_HAUT`) : un prix absolu, jamais la décision
 *     reçue multipliée, que le formulaire reconduirait d'un trimestre à l'autre (×0,9, puis
 *     ×0,81…). Le test vérifie, trimestre par trimestre, que le prix joué est celui qui est posé.
 *     Au facteur 1, c'est l'année de référence elle-même. Les
 *     concurrents et la façon de gérer sont les mêmes ; le bon gestionnaire, lui, règle ce qu'il
 *     met en vente sur la demande du trimestre d'avant, et l'offre suit donc le prix avec un
 *     trimestre de retard.
 *
 * LES ENTREPRISES DU CHAPITRE : celles qui vendent une seule offre, à l'unité. Une gamme (la
 * boutique) a un marché par article, et le club de sport sert d'abord ses abonnés gardés, avant
 * que le marché n'ait les places qui restent : ni l'un ni l'autre n'a une offre et une demande
 * qu'on lit sur une seule ligne.
 *
 * Ce que le chapitre ne double pas : « La demande répond au prix » (bac STMG) calcule
 * l'élasticité sur un trimestre et ce qu'une hausse fait au chiffre d'affaires ; « Le prix
 * psychologique » lit les repères de prix du client ; « Remplir l'hôtel » cherche le prix d'une
 * saison. Ici, ni chiffre d'affaires ni décision de prix : la rencontre de l'offre et de la
 * demande, et la loi de la demande, lues comme un économiste.
 */

/** Les entreprises du chapitre : une seule offre, vendue à l'unité, sans abonnés. */
export const ENTREPRISES_DU_MARCHE: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => {
  const s = scenarioByCode(code).scenario;
  return !s.products && !s.subscription;
});

/** Le trimestre que le chapitre lit en détail : le premier de l'année. */
export const TRIMESTRE_LU = 1;

/**
 * LES TROIS PRIX DE L'ANNÉE REJOUÉE : 10 % moins cher, le prix de l'année, 10 % plus cher, à
 * chaque trimestre. Un écart assez grand pour que la demande bouge nettement, assez petit pour
 * qu'aucune entreprise ne fasse défaillance dans l'année rejouée (le test le vérifie).
 */
export const PRIX_BAS = 0.9;
export const PRIX_HAUT = 1.1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** « de » devant un nom : élidé devant une voyelle. */
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « que » devant un nom : élidé devant une voyelle. */
export const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
export const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** Le nom d'une clientèle sans sa précision entre parenthèses : « Étudiants ». */
export const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, "");

const somme = (r: CompanyRoundResult, f: (v: CompanyRoundResult["market"]["bySegment"][string]) => number) =>
  Object.values(r.market.bySegment).reduce((t, v) => t + f(v), 0);
/** La demande que le marché adresse à l'entreprise dans le trimestre : ses ventes et celles qu'elle n'a pas pu servir. */
export const demandeRecue = (r: CompanyRoundResult) => somme(r, (v) => v.demandForCompany);
/** Ce que le marché a acheté à l'entreprise dans le trimestre. */
export const venduAuMarche = (r: CompanyRoundResult) => somme(r, (v) => v.sold);

/** Le prix du trimestre `t` (à partir de 1) dans l'année de référence : chiffre d'affaires du marché ÷ ventes, au prix exact du moteur. */
export function prixDeReference(code: string, t: number): number {
  const r = anneeDeReference(code)[t - 1]!;
  return somme(r, (v) => v.revenue) / venduAuMarche(r);
}

/** Le stock au début du trimestre `t` dans l'année de référence ; aucun pour un service, qui ne se stocke pas. */
export function stockDuDebut(code: string, t: number): number {
  if (scenarioByCode(code).scenario.perishable) return 0;
  const { partie, depart } = anneeJouee(code);
  return t === 1 ? depart.finishedGoods.quantity : partie.rounds[t - 2]!.companies.find((x) => x.id === "joueur")!.finishedGoods.quantity;
}

/** Le marché d'un trimestre, vu de l'entreprise : la demande, l'offre, ce qui s'échange et ce qui reste. */
export interface MarcheDuTrimestre {
  prix: number;
  demande: number;
  offre: number;
  echangee: number;
  /** La demande que l'offre n'a pas servie : des acheteurs repartis sans rien. */
  nonServie: number;
  /** L'offre qui n'a pas trouvé d'acheteur. */
  nonVendue: number;
}

/**
 * Le marché d'un trimestre joué : la demande reçue, l'offre (le stock du début, plus ce qui a été
 * produit, moins les rebuts), et la quantité échangée, la plus petite des deux.
 */
export function lireLeMarche(r: CompanyRoundResult, stock: number, prix: number): MarcheDuTrimestre {
  const demande = Math.round(demandeRecue(r));
  const offre = Math.round(stock + r.production.produced - (r.qualityCosts?.defectUnits ?? 0));
  const echangee = Math.min(demande, offre);
  return { prix, demande, offre, echangee, nonServie: demande - echangee, nonVendue: offre - echangee };
}

/** Le marché du trimestre `t` dans l'année de référence, au prix de l'année. */
export function marcheDeReference(code: string, t: number): MarcheDuTrimestre {
  return lireLeMarche(anneeDeReference(code)[t - 1]!, stockDuDebut(code, t), auCentime(prixDeReference(code, t)));
}

/** L'année du cours rejouée avec, à chaque trimestre, le prix de l'année de référence multiplié par `facteur`. */
export function anneeAuPrix(code: string, facteur: number) {
  // Au facteur 1, l'année de référence elle-même : le prix lu (chiffre d'affaires ÷ ventes) ne
  // redonne la décision qu'au dernier chiffre près, et le rejouer s'en écarterait d'autant.
  if (facteur === 1) return anneeDeReference(code);
  const prix = anneeDeReference(code).map((_, k) => prixDeReference(code, k + 1));
  // Le prix est posé à chaque trimestre, en valeur absolue : multiplier la décision reçue, que le
  // formulaire reconduit du trimestre d'avant, composerait le facteur.
  return rejouerAvec(code, `l-offre-et-la-demande:prix-x${facteur}`, (tour, d) => ({ ...d, price: prix[tour - 1]! * facteur }));
}

/**
 * Une année rejouée, additionnée : la demande reçue et la quantité échangée. Une entreprise
 * défaillante ne vend plus les trimestres suivants : on tranche d'abord, puis on additionne.
 */
export function surLAnnee(annee: readonly CompanyRoundResult[]) {
  const actifs = annee.filter((_, k) => !annee.slice(0, k).some((r) => r.defaillant));
  return {
    demande: Math.round(actifs.reduce((t, r) => t + demandeRecue(r), 0)),
    echangee: Math.round(actifs.reduce((t, r) => t + venduAuMarche(r), 0)),
    defaillance: annee.some((r) => r.defaillant),
  };
}

/** Le marché de l'entreprise au trimestre lu : ses clientèles, la demande de tout le marché, celle qu'elle a reçue. */
export function clientelesDuMarche(c: Cas) {
  const def = scenarioByCode(c.code);
  const r = anneeDeReference(c.code)[TRIMESTRE_LU - 1]!;
  const toutes = def.scenario.market.segments.map((g) => ({
    code: g.code,
    nom: nomCourt(g.name),
    marche: Math.round(r.market.bySegment[g.code]?.potential ?? 0),
    recue: Math.round(r.market.bySegment[g.code]?.demandForCompany ?? 0),
    sensibilite: Math.abs(g.priceElasticity),
  }));
  const presentes = toutes.filter((g) => g.marche > 0);
  const plusSensible = toutes.reduce((a, b) => (b.sensibilite > a.sensibilite ? b : a));
  return {
    toutes,
    presentes,
    absentes: toutes.filter((g) => g.marche <= 0),
    plusSensible,
    concurrents: def.bots.slice(0, 2).map((b) => b.name),
  };
}

/** La demande de tout le marché, trimestre par trimestre, telle que le moteur l'a jouée. */
export function saisonDuMarche(c: Cas) {
  const s = scenarioDuCours(scenarioByCode(c.code).scenario, anneeDeReference(c.code).length);
  const annee = anneeDeReference(c.code);
  const parTrimestre = annee.map((r) => Math.round(somme(r, (v) => v.potential)));
  // La taille, la croissance et la saison de chaque clientèle ; ce qui s'en écarte vient d'un
  // événement du marché, que le moteur a joué ce trimestre-là.
  const evenements = annee
    .map((r, k) => {
      const attendu = s.market.segments.reduce((t, g) => t + computePotentialDemand(g, k + 1, s.market.seasonality, 1), 0);
      return Math.abs(somme(r, (v) => v.potential) / attendu - 1) > 1e-6 ? k + 1 : 0;
    })
    .filter((k) => k > 0);
  const plusFort = parTrimestre.indexOf(Math.max(...parTrimestre)) + 1;
  const plusFaible = parTrimestre.indexOf(Math.min(...parTrimestre)) + 1;
  return {
    parTrimestre,
    total: parTrimestre.reduce((t, x) => t + x, 0),
    plusFort,
    plusFaible,
    ecart: parTrimestre[plusFort - 1]! - parTrimestre[plusFaible - 1]!,
    evenements,
  };
}

export type SensDeLaDemande = "baisse" | "hausse" | "aucun";

/** L'année rejouée à trois prix : la demande reçue et la quantité échangée de chacune. */
export function demandeSelonLePrix(c: Cas) {
  const p1 = prixDeReference(c.code, TRIMESTRE_LU);
  const lire = (facteur: number) => ({ facteur, prix: auCentime(p1 * facteur), ...surLAnnee(anneeAuPrix(c.code, facteur)) });
  const bas = lire(PRIX_BAS);
  const base = lire(1);
  const haut = lire(PRIX_HAUT);
  const sens: SensDeLaDemande =
    bas.demande > base.demande && base.demande > haut.demande ? "baisse" : bas.demande < base.demande && base.demande < haut.demande ? "hausse" : "aucun";
  return {
    bas,
    base,
    haut,
    sens,
    ecartBas: Math.round((1 - PRIX_BAS) * 100),
    ecartHaut: Math.round((PRIX_HAUT - 1) * 100),
    demandeEnPlus: bas.demande - base.demande,
    demandeEnMoins: base.demande - haut.demande,
    echangeeEnPlus: bas.echangee - base.echangee,
  };
}

/** L'offre de l'entreprise, en une phrase : ce qu'elle met en vente, et ce que devient ce qui ne se vend pas. */
function ceQuEstLOffre(c: Cas) {
  return scenarioByCode(c.code).scenario.perishable
    ? `ce qu'elle peut servir dans le trimestre. Un service ne se stocke pas : ce qui n'est pas vendu dans le trimestre est perdu`
    : `son stock du début du trimestre et ce qu'elle a produit. Ce qui n'est pas vendu reste en stock pour le trimestre suivant`;
}

function tableauDesClienteles(c: Cas): TableauDeDonnees {
  const m = clientelesDuMarche(c);
  return {
    titre: `Le marché ${dE(c.entreprise)} au ${rang(TRIMESTRE_LU)} trimestre, en ${c.unites}`,
    colonnes: ["Demande de tout le marché", `Demande reçue par ${c.entreprise}`],
    lignes: m.presentes.map((g) => ({ libelle: g.nom, valeurs: [qte(g.marche), qte(g.recue)] })),
  };
}

function tableauDesSensibilites(c: Cas): TableauDeDonnees {
  const m = clientelesDuMarche(c);
  return {
    titre: `La sensibilité au prix des clientèles ${dE(c.entreprise)}`,
    colonnes: ["Demande perdue quand le prix monte de 1 %"],
    lignes: m.toutes.map((g) => ({ libelle: g.nom, valeurs: [`environ ${pct(g.sensibilite)}`] })),
  };
}

function tableauDeLaSaison(c: Cas): TableauDeDonnees {
  const s = saisonDuMarche(c);
  return {
    titre: `La demande de tout le marché ${dE(c.entreprise)}, trimestre par trimestre, en ${c.unites}`,
    colonnes: s.parTrimestre.map((_, k) => `${rang(k + 1)} trimestre`),
    lignes: [{ libelle: "Demande du marché", valeurs: s.parTrimestre.map(qte) }],
  };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const m = marcheDeReference(c.code, TRIMESTRE_LU);
  return {
    titre: `${c.entreprise} au ${rang(TRIMESTRE_LU)} trimestre, en ${c.unites}`,
    colonnes: [`Au prix de ${eur(m.prix)}`],
    lignes: [
      { libelle: "Demande reçue", valeurs: [qte(m.demande)] },
      { libelle: "Quantité mise en vente", valeurs: [qte(m.offre)] },
    ],
  };
}

function tableauDesTroisPrix(c: Cas): TableauDeDonnees {
  const d = demandeSelonLePrix(c);
  const ligne = (libelle: string, f: (x: typeof d.base) => string) => ({ libelle, valeurs: [f(d.bas), f(d.base), f(d.haut)] });
  return {
    titre: `L'année ${dE(c.entreprise)} rejouée à trois prix, en ${c.unites}`,
    colonnes: [`${d.ecartBas} % moins cher`, "Prix de l'année", `${d.ecartHaut} % plus cher`],
    lignes: [
      ligne(`Prix au ${rang(TRIMESTRE_LU)} trimestre`, (x) => eur(x.prix)),
      ligne("Demande reçue sur l'année", (x) => qte(x.demande)),
      ligne("Quantité échangée sur l'année", (x) => qte(x.echangee)),
    ],
  };
}

export const L_OFFRE_ET_LA_DEMANDE: Chapitre = {
  code: "l-offre-et-la-demande",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "L'offre et la demande sur un marché",
  accroche:
    "Des acheteurs d'un côté, des vendeurs de l'autre, et un prix : un marché. Lire la demande que l'entreprise reçoit et ce qui la fait varier, ce qu'elle met en vente, et ce qui s'échange vraiment.",
  objectifs: [
    "Distinguer la demande et l'offre sur un marché",
    "Dire ce qui fait varier la demande : le prix, la qualité, la publicité, la saison",
    "Calculer la quantité échangée, la plus petite de la demande et de l'offre",
    "Lire la loi de la demande dans un tableau : plus le prix monte, moins on demande",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MARCHE,
    pourquoi:
      "ce chapitre lit un seul marché, celui d'une offre unique vendue à l'unité : une gamme a un marché par article, et un club de sport sert d'abord ses abonnés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un marché : des acheteurs, des vendeurs, un prix",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDesClienteles,
      texte: (c) => {
        const m = clientelesDuMarche(c);
        return [
          "Un marché, c'est la rencontre de ceux qui veulent acheter et de ceux qui vendent. Les acheteurs forment la demande, les vendeurs forment l'offre, et ils se rencontrent à un prix.",
          `Sur le marché ${dE(c.entreprise)}, les acheteurs se rangent en clientèles, et trois vendeurs se les disputent : ${c.entreprise} et ses deux concurrents, ${m.concurrents.join(" et ")}. Une partie des acheteurs ne va chez aucun des trois.`,
          `Le tableau donne, pour chaque clientèle, la demande de tout le marché au ${rang(TRIMESTRE_LU)} trimestre, et la part ${quE(c.entreprise)} en a reçue : les acheteurs qui ont choisi son offre.${
            m.absentes.length > 0
              ? ` ${m.absentes.length === 1 ? "La clientèle" : "Les clientèles"} ${m.absentes.map((g) => `« ${g.nom} »`).join(" et ")} n'${m.absentes.length === 1 ? "achète" : "achètent"} pas encore à ce trimestre : ${m.absentes.length === 1 ? "sa" : "leur"} saison commence plus tard.`
              : ""
          }`,
        ];
      },
      repere: () =>
        "La demande : ce que les acheteurs veulent acheter, à un prix donné. L'offre : ce que les vendeurs mettent en vente. Le marché les fait se rencontrer à un prix.",
    },
    {
      id: "ce-qui-fait-varier",
      type: "choix",
      titre: "Ce qui fait varier la demande reçue",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) => `Voici quatre décisions ${quE(c.entreprise)} peut prendre. Laquelle ne change pas la demande qu'elle reçoit ?`,
      options: (c) => [
        {
          texte: "Monter son prix",
          juste: false,
          retour: "Non, elle la change : un prix plus haut fait renoncer des acheteurs, qui vont chez un concurrent ou n'achètent pas du tout.",
        },
        {
          texte: "Améliorer la qualité de son offre",
          juste: false,
          retour: "Non, elle la change : chaque clientèle tient plus ou moins à la qualité, et une offre meilleure attire davantage d'acheteurs.",
        },
        {
          texte: "Faire de la publicité",
          juste: false,
          retour: "Non, elle la change : la publicité fait connaître l'offre et attire des acheteurs, de moins en moins à chaque euro ajouté.",
        },
        {
          texte: `Mettre plus ${dE(c.unites)} en vente`,
          juste: true,
          retour: `Oui : mettre plus en vente change ce ${quE(c.entreprise)} peut vendre, pas ce que les acheteurs veulent. Dans l'arène, la demande reçue dépend du prix, de la qualité, de la publicité et de la saison ; la quantité mise en vente n'y entre pas. Elle est l'autre côté du marché : l'offre.`,
        },
      ],
    },
    {
      id: "qui-reagit-au-prix",
      type: "choix",
      titre: "La clientèle qui réagit le plus au prix",
      notions: ["price_elasticity", "segmentation"],
      tableau: tableauDesSensibilites,
      question: (c) =>
        `Toutes les clientèles ne réagissent pas de la même façon au prix. D'après le tableau, quelle clientèle ${dE(c.entreprise)} réagit le plus quand le prix monte ?`,
      options: (c) => {
        const m = clientelesDuMarche(c);
        return m.toutes.map((g) => ({
          texte: g.nom,
          juste: g.code === m.plusSensible.code,
          retour:
            g.code === m.plusSensible.code
              ? `Oui : quand le prix monte de 1 %, sa demande baisse d'environ ${pct(g.sensibilite)}, plus que celle de toute autre clientèle. Une clientèle qui compare beaucoup les prix part vite quand le prix monte.`
              : `Non : quand le prix monte de 1 %, sa demande baisse d'environ ${pct(g.sensibilite)}, moins que celle de la clientèle « ${m.plusSensible.nom} » (environ ${pct(m.plusSensible.sensibilite)}).`,
        }));
      },
    },
    {
      id: "la-saison",
      type: "montants",
      titre: "La demande change avec la saison",
      notions: ["seasonality", "demand_market_share"],
      tableau: tableauDeLaSaison,
      question: () =>
        "La demande ne dépend pas que des décisions des vendeurs : d'un trimestre à l'autre, elle change d'elle-même. D'après le tableau, calculez la demande de tout le marché sur l'année, puis l'écart entre le trimestre le plus fort et le trimestre le plus faible.",
      champs: (c) => {
        const s = saisonDuMarche(c);
        return [
          {
            libelle: "Demande du marché sur l'année",
            attendu: s.total,
            calcul: `${s.parTrimestre.map(qte).join(" + ")} = ${qte(s.total)}`,
            tolerance: 0,
          },
          {
            libelle: "Écart entre le trimestre le plus fort et le plus faible",
            attendu: s.ecart,
            calcul: `${qte(s.parTrimestre[s.plusFort - 1]!)} − ${qte(s.parTrimestre[s.plusFaible - 1]!)} = ${qte(s.ecart)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const s = saisonDuMarche(c);
        return [
          `Le ${rang(s.plusFort)} trimestre est le plus fort, le ${rang(s.plusFaible)} le plus faible : ${qte(s.ecart)} ${c.unites} d'écart. Chaque clientèle grandit un peu chaque trimestre et suit sa saison${
            s.evenements.length > 0 ? `, et ${s.evenements.map((k) => `au ${rang(k)} trimestre`).join(" et ")} un événement du marché l'a fait varier en plus` : ""
          }.`,
          "Ces variations ne viennent d'aucune décision des vendeurs : elles déplacent la demande à tous les prix à la fois.",
        ];
      },
    },
    {
      id: "l-offre-et-l-echange",
      type: "montants",
      titre: "L'offre et la quantité échangée",
      notions: ["stock", "capacity"],
      tableau: tableauDuTrimestre,
      question: (c) =>
        `L'offre ${dE(c.entreprise)}, c'est ce qu'elle met en vente : ${ceQuEstLOffre(c)}. Sur un marché, on n'échange ni plus que ce que les acheteurs demandent, ni plus que ce que les vendeurs offrent : la quantité échangée est la plus petite des deux. Calculez la quantité échangée au ${rang(TRIMESTRE_LU)} trimestre, puis la demande non servie et l'offre non vendue (zéro s'il n'y en a pas).`,
      champs: (c) => {
        const m = marcheDeReference(c.code, TRIMESTRE_LU);
        return [
          { libelle: "Quantité échangée", attendu: m.echangee, calcul: `la plus petite de ${qte(m.demande)} et ${qte(m.offre)} : ${qte(m.echangee)}`, tolerance: 0 },
          { libelle: "Demande non servie", attendu: m.nonServie, calcul: `${qte(m.demande)} − ${qte(m.echangee)} = ${qte(m.nonServie)}`, tolerance: 0 },
          { libelle: "Offre non vendue", attendu: m.nonVendue, calcul: `${qte(m.offre)} − ${qte(m.echangee)} = ${qte(m.nonVendue)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const m = marcheDeReference(c.code, TRIMESTRE_LU);
        return [
          m.nonServie > 0
            ? `La demande dépasse l'offre : ${c.entreprise} vend tout ce qu'elle a mis en vente, et des acheteurs repartent sans rien, pour une demande de ${qte(m.nonServie)} ${c.unites}.`
            : m.nonVendue > 0
              ? `L'offre dépasse la demande : tous les acheteurs sont servis, et il reste ${qte(m.nonVendue)} ${c.unites} sans acheteur.`
              : "L'offre et la demande se valent : tous les acheteurs sont servis, et rien ne reste.",
          "Ni l'acheteur ni le vendeur ne décide seul de ce qui s'échange : il faut les deux.",
        ];
      },
    },
    {
      id: "trois-prix",
      type: "lecture",
      titre: "L'année rejouée à trois prix",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: tableauDesTroisPrix,
      texte: (c) => {
        const d = demandeSelonLePrix(c);
        return [
          `L'arène a rejoué l'année ${dE(c.entreprise)} trois fois : au prix de l'année, puis ${d.ecartBas} % moins cher et ${d.ecartHaut} % plus cher, à chaque trimestre. Les concurrents sont les mêmes, et la façon de gérer aussi : chaque trimestre, ${c.entreprise} met en vente ce que la demande du trimestre d'avant lui a appris.`,
          "Le tableau donne, pour chaque prix, la demande reçue sur l'année et la quantité échangée. L'économiste en tire une courbe de demande : le prix sur un axe, la quantité demandée sur l'autre, un point par prix.",
        ];
      },
      repere: () => "La courbe de demande relie chaque prix à la quantité demandée à ce prix.",
    },
    {
      id: "la-loi-de-la-demande",
      type: "choix",
      titre: "La loi de la demande",
      notions: ["price_elasticity"],
      tableau: tableauDesTroisPrix,
      question: () => "Que montre le tableau de l'année rejouée à trois prix ?",
      options: (c) => {
        const d = demandeSelonLePrix(c);
        const faits = `${qte(d.bas.demande)} au prix bas, ${qte(d.base.demande)} au prix de l'année, ${qte(d.haut.demande)} au prix haut`;
        return [
          {
            texte: "Plus le prix est bas, plus la demande reçue est grande",
            juste: d.sens === "baisse",
            retour:
              d.sens === "baisse"
                ? `Oui : ${faits}. Quand le prix monte, des acheteurs renoncent ou vont ailleurs : la courbe de demande descend. C'est la loi de la demande.`
                : `Non : ${faits}.`,
          },
          {
            texte: "La demande reçue ne suit pas le prix",
            juste: d.sens === "aucun",
            retour: d.sens === "aucun" ? `Oui : ${faits}. Ici, la demande ne varie pas dans un seul sens avec le prix.` : `Non : ${faits}. La demande change avec le prix, et toujours dans le même sens.`,
          },
          {
            texte: "Plus le prix est haut, plus la demande reçue est grande",
            juste: d.sens === "hausse",
            retour: d.sens === "hausse" ? `Oui : ${faits}.` : `Non : ${faits}. Un prix plus haut fait renoncer des acheteurs, il n'en attire pas.`,
          },
        ];
      },
    },
    {
      id: "au-prix-bas",
      type: "montants",
      titre: "Ce que change le prix bas",
      notions: ["price_elasticity", "capacity"],
      tableau: tableauDesTroisPrix,
      question: (c) => {
        const d = demandeSelonLePrix(c);
        return `À ${d.ecartBas} % moins cher, de combien la demande reçue par ${c.entreprise} sur l'année augmente-t-elle, par rapport au prix de l'année ? Et la quantité échangée ?`;
      },
      champs: (c) => {
        const d = demandeSelonLePrix(c);
        return [
          {
            libelle: "Demande reçue en plus, au prix bas",
            attendu: d.demandeEnPlus,
            calcul: `${qte(d.bas.demande)} − ${qte(d.base.demande)} = ${qte(d.demandeEnPlus)}`,
            tolerance: 0,
          },
          {
            libelle: "Quantité échangée en plus, au prix bas",
            attendu: d.echangeeEnPlus,
            calcul: `${qte(d.bas.echangee)} − ${qte(d.base.echangee)} = ${qte(d.echangeeEnPlus)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const d = demandeSelonLePrix(c);
        return [
          d.echangeeEnPlus < d.demandeEnPlus
            ? `La demande reçue gagne ${qte(d.demandeEnPlus)} ${c.unites}, la quantité échangée ${d.echangeeEnPlus > 0 ? `seulement ${qte(d.echangeeEnPlus)}` : "rien"} : l'offre ne suit pas. ${c.entreprise} règle ce qu'elle met en vente sur la demande du trimestre d'avant, et sa capacité a une limite ; une partie des acheteurs que le prix bas attire repart sans rien.`
            : `La demande reçue gagne ${qte(d.demandeEnPlus)} ${c.unites}, et la quantité échangée autant ou plus : l'offre a suivi toute la demande ajoutée.`,
          "Un prix plus bas fait venir des acheteurs ; il ne fait pas apparaître l'offre qui les servirait. Ce qui s'échange dépend des deux côtés du marché.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const d = demandeSelonLePrix(c);
        const m = marcheDeReference(c.code, TRIMESTRE_LU);
        return [
          `Sur le marché ${dE(c.entreprise)}, la demande reçue dépend du prix, de la qualité, de la publicité et de la saison. Sur l'année, elle passe de ${qte(d.bas.demande)} à ${qte(d.haut.demande)} ${c.unites} quand le prix passe de ${d.ecartBas} % moins cher à ${d.ecartHaut} % plus cher : c'est la loi de la demande.`,
          `L'offre, c'est ce que les vendeurs mettent en vente. Au ${rang(TRIMESTRE_LU)} trimestre, ${c.entreprise} a reçu une demande de ${qte(m.demande)} ${c.unites} et en a mis ${qte(m.offre)} en vente : il s'en est échangé ${qte(m.echangee)}, la plus petite des deux.`,
          "Quand la demande et l'offre ne se valent pas, des acheteurs repartent sans rien, ou une partie de l'offre reste sans acheteur. Le chapitre suivant cherche le prix qui les accorde.",
        ];
      },
      repere: () => "Quantité échangée = la plus petite de la demande et de l'offre. Loi de la demande : quand le prix monte, la quantité demandée baisse.",
    },
  ],
};
