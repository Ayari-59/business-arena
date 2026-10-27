import { computePotentialDemand } from "../../../engine/market/demand";
import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : REMPLIR L'HÔTEL, LE PRIX SELON LA SAISON (BTS MHR, palier 3).
 *
 * La demande d'un hôtel n'est pas la même toute l'année : chaque clientèle a sa saison. Le
 * chapitre la lit dans le scénario de l'arène (la taille, la croissance et la saisonnalité de
 * chaque clientèle, `computePotentialDemand`), en tire les coefficients saisonniers, la haute et
 * la basse saison. Puis il compare trois façons de fixer le prix de la nuitée sur l'année du
 * cours, rejouée par l'arène (gestion-de-la-pme.ts : même graine, mêmes concurrents, seule la
 * décision de prix change ; les autres décisions, chaque gestion les prend comme dans l'année du
 * cours, sur ce que le trimestre d'avant lui a appris) :
 *
 *   · le prix unique de l'année du cours, celui que le bon gestionnaire y a tenu les quatre
 *     trimestres (`prixUnique`) ;
 *   · le prix de la saison : plus haut en haute saison, plus bas en basse saison ;
 *   · le prix du remplissage : plus haut aux trimestres où, au prix unique, des clients sont
 *     repartis faute de nuitées en vente ; plus bas là où des nuitées en vente sont restées vides,
 *     assez nombreuses pour payer la baisse. Une baisse de prix paie en chiffre d'affaires si elle
 *     fait vendre au moins baisse ÷ (1 − baisse) de nuitées en plus (15 % ÷ 85 %, 17,6 %) ; là où il
 *     restait moins de nuitées vides, elle ne pouvait que vendre les mêmes nuitées moins cher.
 *     Les nuitées mises en vente restent la décision du bon gestionnaire, qui les règle sur la
 *     demande reçue le trimestre d'avant : un prix changé change donc aussi les nuitées mises en
 *     vente des trimestres suivants. Dans l'arène, leur coût variable se paie qu'elles soient
 *     vendues ou non.
 *
 * Pour chacune : le taux d'occupation, le prix moyen par nuitée vendue, le revenu par chambre
 * disponible (le RevPAR des indicateurs du métier, config/scenarios/sector-kpis.ts) et le résultat
 * net de l'année. C'est l'idée du yield management : le prix suit ce qui reste à vendre, et le
 * calendrier ne le dit qu'en partie.
 *
 * LE PRIX EST UNE DÉCISION UNIQUE. L'hôtel du cours vend une seule nuitée, à un prix moyen
 * (`price` de la feuille de décision, sans références) ; le moteur l'applique tel quel à toutes
 * les clientèles, et le test vérifie que le prix moyen de chaque trimestre rejoué est bien celui
 * que la variante a décidé.
 *
 * LE PRIX DE CHAQUE TRIMESTRE REJOUÉ EST POSÉ, PAS MULTIPLIÉ. Le bon gestionnaire part chaque
 * trimestre du prix qu'il a joué au trimestre d'avant : multiplier sa décision ferait s'empiler
 * les écarts (une baisse au 1er trimestre, puis une hausse appliquée au prix déjà baissé). Chaque
 * variante pose donc son prix à partir du prix unique (`prixDuTrimestre`), y compris aux
 * trimestres où il ne bouge pas.
 *
 * LA DÉFAILLANCE SE TRANCHE AVANT LA SOMME. Une entreprise défaillante ne vend plus rien les
 * trimestres suivants : une année qui finit en défaillance ne se compare pas par son résultat
 * additionné, elle perd. Les verdicts le disent avant de comparer les résultats.
 *
 * Ce que le chapitre ne double pas : « La demande répond au prix » (bac STMG) mesure l'élasticité
 * sur un trimestre ; « Le taux d'occupation, le prix moyen et le revenu par chambre » (BTS MHR,
 * palier 2) apprend les trois indicateurs sur l'année du cours, que ce chapitre-ci donne comme
 * chiffres à battre au lieu de les refaire calculer. Ici, l'objet est le prix qui change d'un
 * trimestre à l'autre.
 */

/**
 * LES ÉCARTS DE PRIX DU COURS : 15 % de plus en haute saison, 15 % de moins en basse saison.
 * L'arène ne fixe aucun écart de saison ; le cours en pose un, du même ordre que celui qui sépare
 * dans le scénario le prix que la clientèle loisirs juge normal de celui de la clientèle
 * d'affaires, et qui garde le prix bas au-dessus du prix plancher de chaque clientèle.
 */
export const HAUSSE_EN_HAUTE_SAISON = 0.15;
export const BAISSE_EN_BASSE_SAISON = 0.15;

/** L'hôtel, seul : le taux d'occupation et le revenu par chambre sont des mesures de l'hébergement. */
export const ENTREPRISES_DE_LA_SAISON: readonly string[] = ["hotel"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** « a », « a et b », « a, b et c ». */
const enListe = (t: readonly string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);
/** « le 1er et le 2e trimestre ». */
const lesTrimestres = (ns: readonly number[]) => `${enListe(ns.map((n) => `le ${rang(n)}`))} trimestre`;
/** « au 1er et au 2e trimestre ». */
const auxTrimestres = (ns: readonly number[]) => `${enListe(ns.map((n) => `au ${rang(n)}`))} trimestre`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** LA SAISON DU MARCHÉ, telle que le scénario la pose : la demande de chaque clientèle, trimestre par trimestre. */
export function saisonDuMarche(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const n = anneeDeReference(c.code).length;
  const numeros = Array.from({ length: n }, (_, k) => k + 1);
  const clienteles = s.market.segments.map((g) => ({
    code: g.code,
    nom: g.name,
    parTrimestre: numeros.map((k) => Math.round(computePotentialDemand(g, k, s.market.seasonality, 1))),
  }));
  const totaux = numeros.map((_, i) => clienteles.reduce((t, g) => t + g.parTrimestre[i]!, 0));
  const somme = totaux.reduce((t, x) => t + x, 0);
  const moyenne = auCentieme(somme / n);
  const coefficients = totaux.map((t) => auCentieme(t / moyenne));
  const plusHaut = totaux.indexOf(Math.max(...totaux)) + 1;
  const plusBas = totaux.indexOf(Math.min(...totaux)) + 1;
  return {
    n,
    numeros,
    clienteles,
    totaux,
    somme,
    moyenne,
    coefficients,
    haute: numeros.filter((k) => coefficients[k - 1]! > 1),
    basse: numeros.filter((k) => coefficients[k - 1]! <= 1),
    plusHaut,
    plusBas,
  };
}

/** Un trimestre rejoué, tel que l'hôtelier le lit. */
export interface TrimestreDeLHotel {
  numero: number;
  prix: number;
  demande: number;
  enVente: number;
  vendues: number;
  offertes: number;
  chiffreDAffaires: number;
  resultat: number;
  defaillant: boolean;
}

/** Une année rejouée, en indicateurs du métier. */
export function lireLAnnee(annee: readonly CompanyRoundResult[]) {
  const trimestres: TrimestreDeLHotel[] = annee.map((r, k) => {
    const vendues = Math.round(soldUnits(r));
    return {
      numero: k + 1,
      prix: vendues > 0 ? auCentime(r.incomeStatement.revenue / soldUnits(r)) : 0,
      demande: Math.round(Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0)),
      enVente: Math.round(r.production.produced),
      vendues,
      offertes: Math.round(r.production.machineCapacity),
      chiffreDAffaires: Math.round(r.incomeStatement.revenue),
      resultat: Math.round(r.incomeStatement.netIncome),
      defaillant: r.defaillant === true,
    };
  });
  const somme = (f: (t: TrimestreDeLHotel) => number) => trimestres.reduce((x, t) => x + f(t), 0);
  const vendues = somme((t) => t.vendues);
  const offertes = somme((t) => t.offertes);
  const chiffreDAffaires = somme((t) => t.chiffreDAffaires);
  const defaillance = trimestres.find((t) => t.defaillant);
  return {
    trimestres,
    vendues,
    offertes,
    chiffreDAffaires,
    occupation: auDixieme((vendues / offertes) * 100),
    prixMoyen: auCentime(chiffreDAffaires / vendues),
    revpar: auCentime(chiffreDAffaires / offertes),
    resultat: somme((t) => t.resultat),
    /** Le trimestre où l'hôtel tombe en défaillance, s'il y tombe : l'année s'arrête là. */
    defaillance: defaillance?.numero ?? null,
  };
}

export type AnneeDeLHotel = ReturnType<typeof lireLAnnee>;
export type CodeDuPrix = "unique" | "saison" | "remplissage";

/**
 * LE PRIX UNIQUE : celui que l'hôtel a fait payer la nuitée au 1er trimestre de l'année du cours,
 * au prix exact du moteur (chiffre d'affaires ÷ nuitées vendues). Le bon gestionnaire l'a tenu
 * toute l'année ; le test le vérifie, trimestre par trimestre.
 */
export function prixUnique(code: string): number {
  const r = anneeDeReference(code)[0]!;
  return r.incomeStatement.revenue / soldUnits(r);
}

/** L'année du cours rejouée avec, à chaque trimestre, le prix unique multiplié par son facteur. */
export function anneeAuPrix(c: Cas, cle: string, facteur: (numero: number) => number) {
  const prix = prixUnique(c.code);
  // L'hôtel du cours vend une nuitée à un prix moyen : une décision unique, sans références.
  // Le prix est posé à chaque trimestre, même au facteur 1 : sinon le bon gestionnaire repartirait
  // du prix rejoué au trimestre d'avant.
  return rejouerAvec(c.code, `le-prix-selon-la-saison:${cle}`, (tour, d) => ({ ...d, price: prix * facteur(tour) }));
}

/** Les trois prix de l'année, et ce que chacun donne. */
export function prixSelonLaSaison(c: Cas) {
  const m = saisonDuMarche(c);
  const s = scenarioByCode(c.code).scenario;
  const unique = lireLAnnee(anneeDeReference(c.code));
  const facteurDeSaison = (k: number) => (m.haute.includes(k) ? 1 + HAUSSE_EN_HAUTE_SAISON : 1 - BAISSE_EN_BASSE_SAISON);
  const saison = lireLAnnee(anneeAuPrix(c, "prix-de-la-saison", facteurDeSaison));
  // Ce que l'année au prix unique a laissé : des clients repartis, ou des nuitées en vente restées vides.
  const refus = unique.trimestres.filter((t) => t.demande > t.enVente).map((t) => t.numero);
  const vides = unique.trimestres.filter((t) => t.enVente > t.vendues).map((t) => t.numero);
  // Ce qu'une baisse doit faire vendre en plus pour garder le chiffre d'affaires : vendues × b ÷ (1 − b).
  const aGagner = (k: number) => Math.ceil((unique.trimestres[k - 1]!.vendues * BAISSE_EN_BASSE_SAISON) / (1 - BAISSE_EN_BASSE_SAISON) - 1e-9);
  const videsDu = (k: number) => unique.trimestres[k - 1]!.enVente - unique.trimestres[k - 1]!.vendues;
  const baisses = vides.filter((k) => videsDu(k) >= aGagner(k));
  const facteurDeRemplissage = (k: number) => (refus.includes(k) ? 1 + HAUSSE_EN_HAUTE_SAISON : baisses.includes(k) ? 1 - BAISSE_EN_BASSE_SAISON : 1);
  const remplissage = lireLAnnee(anneeAuPrix(c, "prix-du-remplissage", facteurDeRemplissage));
  const annees: Record<CodeDuPrix, AnneeDeLHotel> = { unique, saison, remplissage };
  // La défaillance d'abord : une année qui ne finit pas ne gagne pas, quel que soit son résultat additionné.
  const enLice = (Object.keys(annees) as CodeDuPrix[]).filter((k) => annees[k].defaillance === null);
  const meilleur = enLice.reduce((a, b) => (annees[b].resultat > annees[a].resultat ? b : a));
  const chambres = Math.round(unique.trimestres[0]!.offertes / s.roundDays);
  // Le premier trimestre où le prix du remplissage monte : la demande qu'il a perdue, face aux
  // clients que le prix unique y refusait.
  const k = refus[0];
  const hausseMesuree =
    k === undefined
      ? null
      : {
          k,
          avant: unique.trimestres[k - 1]!.demande,
          apres: remplissage.trimestres[k - 1]!.demande,
          refuses: unique.trimestres[k - 1]!.demande - unique.trimestres[k - 1]!.enVente,
        };
  return {
    m,
    jours: s.roundDays,
    chambres,
    prixUnique: unique.trimestres[0]!.prix,
    prixHaut: auCentime(unique.trimestres[0]!.prix * (1 + HAUSSE_EN_HAUTE_SAISON)),
    prixBas: auCentime(unique.trimestres[0]!.prix * (1 - BAISSE_EN_BASSE_SAISON)),
    unique,
    saison,
    remplissage,
    facteurDeSaison,
    facteurDeRemplissage,
    refus,
    vides,
    /** Les trimestres où il restait assez de nuitées vides pour qu'une baisse paie, et ceux où il n'en restait pas assez. */
    baisses,
    tropPeuDeVides: vides.filter((k) => !baisses.includes(k)),
    aGagner,
    videsDu,
    ecartSaison: saison.resultat - unique.resultat,
    ecartRemplissage: remplissage.resultat - unique.resultat,
    saisonPaie: saison.defaillance === null && saison.resultat > unique.resultat,
    meilleur,
    /** Les trimestres où le calendrier et le remplissage se contredisent. */
    hausseMalPlacee: m.haute.filter((k) => vides.includes(k)),
    baisseMalPlacee: m.basse.filter((k) => refus.includes(k)),
    /** Ce que la première hausse du prix du remplissage a fait à la demande, ou rien s'il ne monte jamais. */
    hausseMesuree,
  };
}

/**
 * Ce que la première hausse du remplissage a coûté en demande, quand elle en a fait partir plus que
 * le prix unique n'y refusait de clients ; rien sinon.
 */
function laHausseMesuree(c: Cas, h: { k: number; avant: number; apres: number; refuses: number } | null) {
  if (!h || h.avant - h.apres <= h.refuses) return "";
  return ` Au ${rang(h.k)} trimestre, ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} de plus sur le prix ont fait passer la demande adressée à ${c.entreprise} de ${qte(h.avant)} à ${qte(h.apres)} nuitées, quand le prix unique n'y refusait que ${qte(h.refuses)} clients. Une hausse ne paie que si les clients refusés sont assez nombreux pour remplacer ceux que le prix fait partir.`;
}

const EN_POURCENT = (x: number) => pct(Math.round(x * 100));

function tableauDuMarche(c: Cas): TableauDeDonnees {
  const m = saisonDuMarche(c);
  return {
    titre: "La demande du marché, tous hôtels réunis, en nuitées",
    colonnes: m.numeros.map((k) => `${rang(k)} trimestre`),
    lignes: [
      ...m.clienteles.map((g) => ({ libelle: g.nom, valeurs: g.parTrimestre.map(qte) })),
      { libelle: "Toute la demande du marché", valeurs: m.totaux.map(qte) },
    ],
  };
}

function tableauDeLAnnee(c: Cas, a: AnneeDeLHotel, titre: string, premiere?: { libelle: string; valeurs: string[] }): TableauDeDonnees {
  const v = scenarioByCode(c.code).vocabulary;
  return {
    titre,
    colonnes: a.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      ...(premiere ? [premiere] : []),
      { libelle: v.priceLabel, valeurs: a.trimestres.map((t) => eur(t.prix)) },
      { libelle: `Demande adressée à ${c.entreprise}`, valeurs: a.trimestres.map((t) => qte(t.demande)) },
      { libelle: v.productionPlanLabel, valeurs: a.trimestres.map((t) => qte(t.enVente)) },
      { libelle: `${majuscule(c.unites)} vendues`, valeurs: a.trimestres.map((t) => qte(t.vendues)) },
      { libelle: `${majuscule(c.unites)} offertes`, valeurs: a.trimestres.map((t) => qte(t.offertes)) },
      { libelle: "Chiffre d'affaires", valeurs: a.trimestres.map((t) => eur(t.chiffreDAffaires)) },
      { libelle: "Résultat net", valeurs: a.trimestres.map((t) => eur(t.resultat)) },
    ],
  };
}

/** Les trois indicateurs d'une année : taux d'occupation, prix moyen, revenu par chambre disponible. */
function calculsDeLAnnee(a: AnneeDeLHotel) {
  return {
    occupation: `${qte(a.vendues)} ÷ ${qte(a.offertes)} × 100 = ${pct(a.occupation)}`,
    prixMoyen: `${eur(a.chiffreDAffaires)} ÷ ${qte(a.vendues)} = ${eur(a.prixMoyen)}`,
    revpar: `${eur(a.chiffreDAffaires)} ÷ ${qte(a.offertes)} = ${eur(a.revpar)}`,
  };
}

/** Ce que l'année rejouée a changé au chiffre d'affaires, trimestre par trimestre. */
function trimestreParTrimestre(p: ReturnType<typeof prixSelonLaSaison>, a: AnneeDeLHotel, nom: (k: number) => string) {
  return a.trimestres
    .map((t, i) => `${signe(t.chiffreDAffaires - p.unique.trimestres[i]!.chiffreDAffaires)} au ${rang(t.numero)} (${nom(t.numero)})`)
    .join(", ");
}

const saisonDe = (p: ReturnType<typeof prixSelonLaSaison>, k: number) => (p.m.haute.includes(k) ? "haute saison" : "basse saison");
const remplissageDe = (p: ReturnType<typeof prixSelonLaSaison>, k: number) =>
  p.refus.includes(k) ? "clients refusés" : p.baisses.includes(k) ? "nuitées vides" : p.vides.includes(k) ? "peu de nuitées vides" : "tout vendu";

export const LE_PRIX_SELON_LA_SAISON: Chapitre = {
  code: "le-prix-selon-la-saison",
  parcours: "mhr",
  palier: 3,
  blocs: ["BTS MHR Bloc 2 · Mercatique des services en hôtellerie restauration"],
  titre: "Remplir l'hôtel : le prix selon la saison",
  accroche:
    "Chaque clientèle de l'hôtel a sa saison. L'arène rejoue l'année avec un prix plus haut en haute saison et plus bas en basse saison, puis avec un prix qui suit le remplissage : taux d'occupation, prix moyen, revenu par chambre et résultat, face au prix unique.",
  objectifs: [
    "Lire la saisonnalité de la demande et calculer des coefficients saisonniers",
    "Calculer le taux d'occupation, le prix moyen et le revenu par chambre disponible d'une année",
    "Comparer une année à prix unique et une année au prix de la saison",
    "Expliquer pourquoi le prix doit suivre ce qui reste à vendre, et pas seulement le calendrier",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SAISON,
    pourquoi: "ce chapitre suit le remplissage des chambres d'un hôtel et son revenu par chambre disponible, des mesures de l'hébergement.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chaque clientèle a sa saison",
      notions: ["seasonality"],
      tableau: tableauDuMarche,
      texte: (c) => {
        const m = saisonDuMarche(c);
        const p = prixSelonLaSaison(c);
        const extremes = m.clienteles.map((g) => {
          const haut = g.parTrimestre.indexOf(Math.max(...g.parTrimestre)) + 1;
          const bas = g.parTrimestre.indexOf(Math.min(...g.parTrimestre)) + 1;
          return `${g.nom} : au plus haut au ${rang(haut)} trimestre (${qte(g.parTrimestre[haut - 1]!)} nuitées), au plus bas au ${rang(bas)} (${qte(g.parTrimestre[bas - 1]!)}).`;
        });
        return [
          `${c.entreprise} reçoit ${qte(m.clienteles.length)} clientèles, et chacune a sa saison. Le tableau donne la demande que le marché de la ville adresse chaque trimestre à tous ses hôtels réunis : c'est la saisonnalité que pose le scénario de l'arène.`,
          ...extremes,
          `Dans l'année du cours, ${c.entreprise} affiche pourtant le même prix toute l'année : ${eur(p.prixUnique)} la nuitée.`,
        ];
      },
      repere: () =>
        "Coefficient saisonnier d'un trimestre = demande du trimestre ÷ demande moyenne d'un trimestre. Au-dessus de 1, c'est la haute saison ; en dessous, la basse saison.",
    },
    {
      id: "coefficients",
      type: "montants",
      titre: "Les coefficients saisonniers",
      notions: ["seasonality"],
      question: (c) => {
        const m = saisonDuMarche(c);
        return `À partir de la dernière ligne du tableau, calculez la demande moyenne d'un trimestre (la somme des ${qte(m.n)} trimestres ÷ ${qte(m.n)}), puis le coefficient saisonnier du trimestre le plus haut et celui du trimestre le plus bas, au centième.`;
      },
      champs: (c) => {
        const m = saisonDuMarche(c);
        const coef = (k: number) => ({
          libelle: `Coefficient du ${rang(k)} trimestre`,
          attendu: m.coefficients[k - 1]!,
          calcul: `${qte(m.totaux[k - 1]!)} ÷ ${qte(m.moyenne)} = ${qte(m.coefficients[k - 1]!)}`,
          tolerance: 0.01,
        });
        return [
          {
            libelle: "Demande moyenne d'un trimestre",
            attendu: m.moyenne,
            calcul: `(${m.totaux.map(qte).join(" + ")}) ÷ ${qte(m.n)} = ${qte(m.moyenne)}`,
            tolerance: 1,
          },
          coef(m.plusHaut),
          coef(m.plusBas),
        ];
      },
      explication: (c) => {
        const m = saisonDuMarche(c);
        return [
          `Les coefficients des ${qte(m.n)} trimestres valent ${enListe(m.coefficients.map(qte))}. La haute saison, ce sont les trimestres au-dessus de 1 : ${lesTrimestres(m.haute)}. La basse saison, ${lesTrimestres(m.basse)}.`,
          `Au ${rang(m.plusHaut)} trimestre, le marché demande ${pct(Math.round((m.totaux[m.plusHaut - 1]! / m.totaux[m.plusBas - 1]! - 1) * 100))} de nuitées de plus qu'au ${rang(m.plusBas)}.`,
        ];
      },
    },
    {
      id: "prix-unique",
      type: "montants",
      titre: "Une année à prix unique",
      notions: ["occupancy_revpar", "seasonality"],
      tableau: (c) => tableauDeLAnnee(c, prixSelonLaSaison(c).unique, `L'année ${dE(c.entreprise)} au prix unique`),
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique de ${eur(p.prixUnique)}, la demande adressée à ${c.entreprise} n'a pas suivi les nuitées qu'elle avait mises en vente. Calculez, trimestre par trimestre, les nuitées refusées (demande adressée − nuitées mises en vente, là où la demande dépassait) et les nuitées vides (nuitées mises en vente − nuitées vendues, là où il en restait).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return [
          ...p.refus.map((k) => ({
            libelle: `Nuitées refusées au ${rang(k)} trimestre`,
            attendu: t[k - 1]!.demande - t[k - 1]!.enVente,
            calcul: `${qte(t[k - 1]!.demande)} − ${qte(t[k - 1]!.enVente)} = ${qte(t[k - 1]!.demande - t[k - 1]!.enVente)}`,
            tolerance: 0,
          })),
          ...p.vides.map((k) => ({
            libelle: `Nuitées vides au ${rang(k)} trimestre`,
            attendu: p.videsDu(k),
            calcul: `${qte(t[k - 1]!.enVente)} − ${qte(t[k - 1]!.vendues)} = ${qte(p.videsDu(k))}`,
            tolerance: 0,
          })),
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const a = p.unique;
        return [
          `Sur l'année au prix unique, ${c.entreprise} a vendu ${qte(a.vendues)} des ${qte(a.offertes)} nuitées offertes (ses ${qte(p.chambres)} chambres, chaque nuit des ${qte(p.jours)} jours de chaque trimestre) : un taux d'occupation de ${pct(a.occupation)}, un prix moyen de ${eur(a.prixMoyen)} et un revenu par chambre disponible de ${eur(a.revpar)}. Ce sont les chiffres à battre.`,
        ];
      },
    },
    {
      id: "lire-l-annee",
      type: "choix",
      titre: "Ce que le prix unique laisse",
      notions: ["occupancy_revpar", "seasonality"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const refus = p.refus.length ? `Des clients refusés ${auxTrimestres(p.refus)}` : "Aucun client refusé";
        const vides = p.vides.length ? `des nuitées vides ${auxTrimestres(p.vides)}` : "aucune nuitée vide";
        return `${refus}, ${vides} : que dit le tableau du prix unique de ${eur(p.prixUnique)} ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const lesDeux = p.refus.length > 0 && p.vides.length > 0;
        const tropHaut = p.refus.length === 0 && p.vides.length > 0;
        const yield_ =
          "C'est l'idée du yield management : faire varier le prix selon ce qui reste à vendre, le monter quand les clients se pressent, le baisser quand des chambres restent vides. Reste à savoir ce que chaque prix rapporte : l'arène va rejouer l'année.";
        return [
          {
            texte: "Trop bas quand des clients repartaient, trop haut quand des nuitées restaient vides",
            juste: lesDeux,
            retour: lesDeux ? `Oui. ${yield_}` : `Non : ${p.refus.length === 0 ? "aucun client n'est reparti" : "aucune nuitée en vente n'est restée vide"}.`,
          },
          {
            texte: "Trop haut toute l'année : il fallait le baisser à chaque trimestre pour remplir",
            juste: tropHaut,
            retour: tropHaut
              ? `Oui : aucun client n'est reparti, et des nuitées sont restées vides. ${yield_}`
              : p.refus.length
                ? `Non : ${auxTrimestres(p.refus)}, des clients sont repartis sans chambre. Baisser le prix n'y aurait pas vendu une nuitée de plus : toutes celles en vente étaient parties.`
                : "Non : aucune nuitée en vente n'est restée vide.",
          },
          {
            texte: "Trop bas toute l'année : il fallait le monter à chaque trimestre, partout",
            juste: !lesDeux && !tropHaut,
            retour:
              !lesDeux && !tropHaut
                ? `Oui : aucune nuitée en vente n'est restée vide, et des clients sont repartis. ${yield_}`
                : p.vides.length
                  ? `Non : ${auxTrimestres(p.vides)}, des nuitées en vente sont restées vides. Monter le prix y aurait fait partir des clients.`
                  : "Non : aucun client n'est reparti sans chambre.",
          },
        ];
      },
    },
    {
      id: "prix-de-la-saison",
      type: "montants",
      titre: "Le prix de la saison",
      notions: ["seasonality", "occupancy_revpar"],
      tableau: (c) => {
        const p = prixSelonLaSaison(c);
        return tableauDeLAnnee(c, p.saison, `L'année ${dE(c.entreprise)} au prix de la saison`, {
          libelle: "Saison",
          valeurs: p.saison.trimestres.map((t) => saisonDe(p, t.numero)),
        });
      },
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `L'arène a rejoué l'année avec un prix ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} plus haut en haute saison (${eur(p.prixHaut)}) et ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} plus bas en basse saison (${eur(p.prixBas)}). Le reste, chaque gestion le décide comme dans l'année du cours, concurrents compris : les nuitées que l'hôtel met en vente suivent la demande qu'il a reçue le trimestre d'avant. Au prix unique, le résultat net de l'année était de ${eur(p.unique.resultat)}. Calculez, au prix de la saison, le taux d'occupation de l'année, le prix moyen et le revenu par chambre disponible, puis l'écart de résultat net (prix de la saison moins prix unique).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const a = p.saison;
        const k = calculsDeLAnnee(a);
        return [
          { libelle: "Taux d'occupation au prix de la saison (%)", attendu: a.occupation, calcul: k.occupation, tolerance: 0.1 },
          { libelle: "Prix moyen au prix de la saison", attendu: a.prixMoyen, calcul: k.prixMoyen },
          { libelle: "Revenu par chambre disponible au prix de la saison", attendu: a.revpar, calcul: k.revpar },
          {
            libelle: "Écart de résultat net, saison moins prix unique",
            attendu: p.ecartSaison,
            calcul: `${eur(a.resultat)} − ${retranche(p.unique.resultat)} = ${eur(p.ecartSaison)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        return [
          `Le taux d'occupation passe de ${pct(p.unique.occupation)} à ${pct(p.saison.occupation)}, le prix moyen de ${eur(p.unique.prixMoyen)} à ${eur(p.saison.prixMoyen)}, le revenu par chambre disponible de ${eur(p.unique.revpar)} à ${eur(p.saison.revpar)}.`,
          p.saison.defaillance !== null
            ? `Au prix de la saison, ${c.entreprise} tombe en défaillance au ${rang(p.saison.defaillance)} trimestre : elle ne vend plus rien ensuite.`
            : `Le résultat net de l'année ${p.ecartSaison >= 0 ? `monte de ${eur(p.ecartSaison)}` : `baisse de ${eur(-p.ecartSaison)}`}.`,
        ];
      },
    },
    {
      id: "verdict-de-la-saison",
      type: "choix",
      titre: "Le prix de la saison a-t-il payé ?",
      notions: ["seasonality", "occupancy_revpar"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique, ${c.entreprise} finit l'année avec ${eur(p.unique.resultat)} de résultat net ; au prix de la saison, avec ${eur(p.saison.resultat)}. Le prix de la saison a-t-il payé ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const defaillante = p.saison.defaillance !== null;
        const detail = `Le chiffre d'affaires a changé de ${trimestreParTrimestre(p, p.saison, (k) => saisonDe(p, k))}.`;
        // Ce que le trimestre rejoué a vendu, face au prix unique : la phrase dit ce que le moteur a donné.
        const vendues = (k: number) => ({ saison: p.saison.trimestres[k - 1]!.vendues, unique: p.unique.trimestres[k - 1]!.vendues });
        const contre = [
          ...p.hausseMalPlacee.map((k) => {
            const v = vendues(k);
            return v.saison < v.unique
              ? `au ${rang(k)} trimestre, la haute saison laissait des nuitées vides, et la hausse a fait partir des clients (${qte(v.saison)} nuitées vendues contre ${qte(v.unique)})`
              : `au ${rang(k)} trimestre, la haute saison laissait des nuitées vides, et la hausse ne les a pas remplies`;
          }),
          ...p.baisseMalPlacee.map((k) => {
            const v = vendues(k);
            return v.saison < v.unique
              ? `au ${rang(k)}, la basse saison refusait des clients, et la baisse a vendu moins de nuitées (${qte(v.saison)} contre ${qte(v.unique)}), toutes moins cher`
              : v.saison === v.unique
                ? `au ${rang(k)}, la basse saison refusait des clients, et la baisse n'a vendu aucune nuitée de plus (${qte(v.saison)} contre ${qte(v.unique)}), seulement moins cher`
                : `au ${rang(k)}, la basse saison refusait des clients, et la baisse n'a vendu que ${qte(v.saison - v.unique)} nuitées de plus, toutes moins cher`;
          }),
        ];
        const pourquoi = contre.length
          ? ` Le calendrier dit quand les clients viennent, pas s'il reste des chambres à leur vendre : ${contre.join(" ; ")}.`
          : "";
        return [
          {
            texte: "Oui : le résultat net de l'année monte",
            juste: p.saisonPaie,
            retour: p.saisonPaie ? `Oui, de ${eur(p.ecartSaison)}. ${detail}${pourquoi}` : `Non. ${detail}${pourquoi}`,
          },
          {
            texte: "Non : le résultat net de l'année baisse",
            juste: !p.saisonPaie && !defaillante,
            retour: !p.saisonPaie && !defaillante ? `Oui, de ${eur(-p.ecartSaison)}. ${detail}${pourquoi}` : `Non. ${detail}`,
          },
          {
            texte: "Non : l'hôtel ne finit pas l'année au prix de la saison",
            juste: defaillante,
            retour: defaillante
              ? `Oui : ${c.entreprise} tombe en défaillance au ${rang(p.saison.defaillance!)} trimestre. Une année qui s'arrête ne se compare pas par son résultat additionné.`
              : `Non : ${c.entreprise} finit l'année, sans défaillance. ${detail}`,
          },
        ];
      },
    },
    {
      id: "ce-qu-une-baisse-doit-vendre",
      type: "montants",
      titre: "Ce qu'une baisse doit faire vendre",
      notions: ["occupancy_revpar", "price_elasticity"],
      si: (c) => prixSelonLaSaison(c).vides.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return `Une baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ne garde le chiffre d'affaires que si elle fait vendre assez de nuitées en plus : les nuitées déjà vendues × ${qte(BAISSE_EN_BASSE_SAISON)} ÷ ${qte(1 - BAISSE_EN_BASSE_SAISON)}. ${majuscule(auxTrimestres(p.vides))}, au prix unique, ${c.entreprise} a vendu ${enListe(p.vides.map((k) => qte(t[k - 1]!.vendues)))} nuitées, et il en restait ${enListe(p.vides.map((k) => qte(p.videsDu(k))))} de vides. Calculez, pour chacun, les nuitées qu'une baisse devrait faire vendre en plus (arrondi à l'unité supérieure).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return p.vides.map((k) => ({
          libelle: `Nuitées à gagner au ${rang(k)} trimestre`,
          attendu: p.aGagner(k),
          calcul: `${qte(t[k - 1]!.vendues)} × ${qte(BAISSE_EN_BASSE_SAISON)} ÷ ${qte(1 - BAISSE_EN_BASSE_SAISON)} = ${qte(p.aGagner(k))}`,
          tolerance: 1,
        }));
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const paie = p.baisses.map((k) => `${auxTrimestres([k])}, il restait ${qte(p.videsDu(k))} nuitées vides pour ${qte(p.aGagner(k))} à gagner : une baisse pouvait payer`);
        const paiePas = p.tropPeuDeVides.map((k) => `${auxTrimestres([k])}, il n'en restait que ${qte(p.videsDu(k))} pour ${qte(p.aGagner(k))} à gagner : la baisse ne pouvait que vendre les mêmes nuitées moins cher`);
        return [
          `${majuscule([...paie, ...paiePas].join(" ; "))}.`,
          "Ce calcul se fait en chiffre d'affaires : dans l'arène, le coût variable des nuitées mises en vente se paie qu'elles soient vendues ou non.",
        ];
      },
    },
    {
      id: "prix-du-remplissage",
      type: "montants",
      titre: "Le prix qui suit le remplissage",
      notions: ["occupancy_revpar"],
      tableau: (c) => {
        const p = prixSelonLaSaison(c);
        return tableauDeLAnnee(c, p.remplissage, `L'année ${dE(c.entreprise)} au prix du remplissage`, {
          libelle: "Au prix unique",
          valeurs: p.remplissage.trimestres.map((t) => remplissageDe(p, t.numero)),
        });
      },
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const regles = [
          p.refus.length ? `monte de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} ${auxTrimestres(p.refus)}, où des clients repartaient au prix unique` : "",
          p.baisses.length ? `baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ${auxTrimestres(p.baisses)}, où les nuitées vides pouvaient payer la baisse` : "",
          p.tropPeuDeVides.length
            ? `ne bouge pas ${auxTrimestres(p.tropPeuDeVides)}, où ${p.baisses.length ? "elles ne le pouvaient pas" : "les nuitées vides étaient trop peu nombreuses pour payer une baisse"}`
            : "",
        ].filter(Boolean);
        return `L'arène rejoue l'année une dernière fois. Le prix ${regles.join(" ; il ")}. Calculez le taux d'occupation de l'année, le revenu par chambre disponible, puis l'écart de résultat net avec le prix unique (prix du remplissage moins prix unique).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const a = p.remplissage;
        const k = calculsDeLAnnee(a);
        return [
          { libelle: "Taux d'occupation au prix du remplissage (%)", attendu: a.occupation, calcul: k.occupation, tolerance: 0.1 },
          { libelle: "Revenu par chambre disponible au prix du remplissage", attendu: a.revpar, calcul: k.revpar },
          {
            libelle: "Écart de résultat net, remplissage moins prix unique",
            attendu: p.ecartRemplissage,
            calcul: `${eur(a.resultat)} − ${retranche(p.unique.resultat)} = ${eur(p.ecartRemplissage)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const sansChangerDePrix = p.remplissage.trimestres
          .filter((t, i) => p.facteurDeRemplissage(t.numero) === 1 && t.chiffreDAffaires !== p.unique.trimestres[i]!.chiffreDAffaires)
          .map((t) => t.numero);
        return [
          `Le chiffre d'affaires a changé de ${trimestreParTrimestre(p, p.remplissage, (k) => remplissageDe(p, k))}.${
            sansChangerDePrix.length
              ? ` ${majuscule(auxTrimestres(sansChangerDePrix))}, il a changé sans que le prix bouge : chaque trimestre part des parts de marché du précédent, et les nuitées mises en vente suivent la demande du trimestre d'avant.`
              : ""
          }`,
          p.remplissage.defaillance !== null
            ? `Au prix du remplissage, ${c.entreprise} tombe en défaillance au ${rang(p.remplissage.defaillance)} trimestre.`
            : `Le revenu par chambre disponible passe de ${eur(p.unique.revpar)} à ${eur(p.remplissage.revpar)}, et le résultat net de l'année ${p.ecartRemplissage >= 0 ? `monte de ${eur(p.ecartRemplissage)}` : `baisse de ${eur(-p.ecartRemplissage)}`}.`,
        ];
      },
    },
    {
      id: "la-regle",
      type: "choix",
      titre: "Fixer le prix d'un trimestre",
      notions: ["occupancy_revpar", "seasonality"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique, l'année rapporte ${eur(p.unique.resultat)} de résultat net ; au prix de la saison, ${eur(p.saison.resultat)} ; au prix du remplissage, ${eur(p.remplissage.resultat)}. Que retenir pour fixer le prix d'un trimestre ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const resultats = `Résultat net de l'année : ${eur(p.unique.resultat)} au prix unique, ${eur(p.saison.resultat)} au prix de la saison, ${eur(p.remplissage.resultat)} au prix du remplissage.`;
        return [
          {
            texte: "Regarder s'il reste des chambres à vendre ou des clients refusés, pas seulement le calendrier",
            juste: p.meilleur === "remplissage",
            retour:
              p.meilleur === "remplissage"
                ? `Oui. ${resultats} Dans la réalité, l'hôtelier ne connaît pas l'année d'avance : il suit le rythme des réservations, et monte ou baisse ses prix au fil des semaines.`
                : `Non. ${resultats}`,
          },
          {
            texte: "Suivre le calendrier : plus cher en haute saison, moins cher en basse saison",
            juste: p.meilleur === "saison",
            retour: p.meilleur === "saison" ? `Oui. ${resultats}` : `Non. ${resultats} La saison dit quand les clients viennent ; elle ne dit pas s'il reste des chambres à leur vendre.`,
          },
          {
            texte: "Garder un prix unique toute l'année : c'est lui qui protège le mieux le résultat",
            juste: p.meilleur === "unique",
            retour: p.meilleur === "unique" ? `Oui. ${resultats}${laHausseMesuree(c, p.hausseMesuree)}` : `Non. ${resultats}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["seasonality", "occupancy_revpar"],
      texte: (c) => {
        const p = prixSelonLaSaison(c);
        const ecart = (x: number, defaillance: number | null) =>
          defaillance !== null ? `une défaillance au ${rang(defaillance)} trimestre` : x >= 0 ? `${eur(x)} de résultat net en plus` : `${eur(-x)} de résultat net en moins`;
        return [
          `La demande ${dE(c.entreprise)} a sa saison : ${lesTrimestres(p.m.haute)} au-dessus de la moyenne, ${lesTrimestres(p.m.basse)} en dessous. Face au prix unique, le prix qui suit le seul calendrier a donné ${ecart(p.ecartSaison, p.saison.defaillance)} sur l'année ; le prix qui suit le remplissage, ${ecart(p.ecartRemplissage, p.remplissage.defaillance)}.`,
          "Remplir l'hôtel, ce n'est pas vendre au plus bas : c'est vendre chaque nuitée au meilleur prix que la demande accepte, et ne baisser que là où assez de chambres resteraient vides pour payer la baisse. Le revenu par chambre disponible le mesure : il juge à la fois le remplissage et le prix.",
        ];
      },
      repere: () =>
        "Revenu par chambre disponible = chiffre d'affaires ÷ nuitées offertes = prix moyen × taux d'occupation. Le yield management fait varier le prix selon ce qui reste à vendre.",
    },
  ],
};
