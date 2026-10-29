import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeDeLHotel, nuiteesOffertes, trimestreDeLHotel, type AnneeDeLHotel } from "../monde/hotel";
import { HOTELS_DU_COURS, type FicheDeLHotel } from "../monde/l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : REMPLIR L'HÔTEL, LE PRIX SELON LA SAISON (BTS MHR, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'hôtel du
 * cours, L'ESCALE, a une fiche figée (ses chambres, son prix, ses coûts, la demande de chaque
 * clientèle à chaque trimestre) et un modèle simple (monde/hotel.ts) : toutes les chambres sont en
 * vente, la demande répond au prix avec une élasticité, l'hôtel vend la plus petite de la demande
 * et des nuitées offertes. Une évolution du moteur de l'arène ne change rien ici. Décision du
 * propriétaire (octobre 2026) : le contenu du cours fait l'objet de la simulation, inspirée des
 * entreprises de l'arène sans en être le reflet exact.
 *
 * La demande de l'hôtel a sa saison : chaque clientèle a la sienne. Le chapitre en tire les
 * coefficients saisonniers, la haute et la basse saison, puis compare trois façons de fixer le prix
 * de la nuitée sur l'année :
 *
 *   · le prix unique, celui de la fiche, tenu les quatre trimestres ;
 *   · le prix de la saison : plus haut en haute saison, plus bas en basse saison ;
 *   · le prix du remplissage : plus haut aux trimestres où, au prix unique, des clients sont
 *     refusés ; plus bas là où des chambres restent vides, assez nombreuses pour payer la baisse.
 *     Une baisse garde la marge si elle fait vendre au moins
 *     nuitées vendues × baisse × prix ÷ (prix baissé − coût variable) de nuitées en plus : chaque
 *     nuitée vendue perd la baisse, chaque nuitée gagnée rapporte le prix baissé moins son coût.
 *
 * Pour chacune : le taux d'occupation, le prix moyen par nuitée vendue, le revenu par chambre
 * disponible et le résultat de l'année. C'est l'idée du yield management : le prix suit ce qui
 * reste à vendre, et le calendrier ne le dit qu'en partie.
 *
 * Ce que le chapitre ne double pas : « La demande répond au prix » (bac STMG) mesure l'élasticité
 * sur un trimestre ; « Le taux d'occupation, le prix moyen et le revenu par chambre » (BTS MHR,
 * palier 2) apprend les trois indicateurs. Ici, l'objet est le prix qui change d'un trimestre à
 * l'autre.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, coefficients, prix-unique (la formule est au repère, la question nomme les
 *     chiffres), ce-qu-une-baisse-doit-vendre (la question donne le calcul) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-baisse
 *     puis la-baisse-au-curseur (les nuitées qu'une baisse de 15 % doit faire vendre au trimestre où
 *     il reste peu de chambres vides) avant ce-qu-une-baisse-doit-vendre ; predire-la-hausse puis
 *     la-hausse-au-curseur (les nuitées qu'une hausse de 15 % peut perdre au trimestre où des clients
 *     sont refusés) avant ce-qu-une-hausse-peut-perdre ;
 *   · autonome : lire-l-annee, prix-de-la-saison, verdict-de-la-saison, ce-qu-une-hausse-peut-perdre,
 *     prix-du-remplissage, la-regle (ni formule ni chiffres à prendre ; le calcul de la correction
 *     montre le chemin) ;
 *   · expert : le-laboratoire-des-quatre-prix (les quatre prix de l'année, à partir de ceux du
 *     remplissage : faire mieux qu'eux, et découvrir que la hausse de 15 % dépasse le prix qui remplit
 *     juste l'hôtel), le-prix-qui-remplit-juste (un calcul à rebours : le prix où la demande égale les
 *     nuitées offertes, et ce qu'il rapporte de plus), une-petite-baisse (une variante chiffrée : une
 *     baisse plus petite là où celle de 15 % ne payait pas), la-regle-des-15-pour-cent (une critique de
 *     la règle) ; puis la synthèse.
 */

/**
 * LES ÉCARTS DE PRIX DU COURS : 15 % de plus en haute saison, 15 % de moins en basse saison.
 * Hypothèse du cours, du même ordre que l'écart entre les tarifs d'été et d'hiver d'un hôtel de ville.
 */
export const HAUSSE_EN_HAUTE_SAISON = 0.15;
export const BAISSE_EN_BASSE_SAISON = 0.15;

/** L'hôtel, seul : le taux d'occupation et le revenu par chambre sont des mesures de l'hébergement. */
export const ENTREPRISES_DE_LA_SAISON: readonly string[] = ["hotel"];

/**
 * LA PETITE BAISSE, hypothèse du cours pour la variante chiffrée : une baisse de 5 % au trimestre où
 * celle de 15 % ne pouvait pas payer, faute de chambres vides.
 */
export const PETITE_BAISSE = 0.05;

/**
 * LE LABORATOIRE DES QUATRE PRIX : le prix de la nuitée de chaque trimestre, de 60 à 110 €, par
 * 10 centimes. Le départ est l'année au prix du remplissage.
 */
export const PRIX_DU_LABORATOIRE = { min: 60, max: 110, pas: 0.1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** « a », « a et b », « a, b et c ». */
const enListe = (t: readonly string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);
/** « le 1er et le 2e trimestre ». */
const lesTrimestres = (ns: readonly number[]) => `${enListe(ns.map((n) => `le ${rang(n)}`))} trimestre`;
/** « au 1er et au 2e trimestre ». */
const auxTrimestres = (ns: readonly number[]) => `${enListe(ns.map((n) => `au ${rang(n)}`))} trimestre`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const EN_POURCENT = (x: number) => pct(Math.round(x * 100));

/** La fiche de l'hôtel du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLHotel => HOTELS_DU_COURS[c.code]!;

/** LA SAISON DE L'HÔTEL, telle que la fiche la pose : la demande de chaque clientèle, au prix de l'année. */
export function saisonDuMarche(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const numeros = [1, 2, 3, 4];
  const n = numeros.length;
  const clienteles = f.clienteles.map((g) => ({ code: g.code, nom: g.nom, parTrimestre: [...g.demande] }));
  const totaux = numeros.map((_, i) => clienteles.reduce((t, g) => t + g.parTrimestre[i]!, 0));
  const somme = totaux.reduce((t, x) => t + x, 0);
  const moyenne = auCentime(somme / n);
  const coefficients = totaux.map((t) => auCentime(t / moyenne));
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
    plusHaut: totaux.indexOf(Math.max(...totaux)) + 1,
    plusBas: totaux.indexOf(Math.min(...totaux)) + 1,
  };
}

export type CodeDuPrix = "unique" | "saison" | "remplissage";

/** L'année de l'hôtel au prix de la fiche multiplié, trimestre par trimestre, par son facteur. */
export function anneeAuPrix(c: Pick<Cas, "code">, facteur: (numero: number) => number): AnneeDeLHotel {
  const f = ficheDe(c);
  return anneeDeLHotel(f, [1, 2, 3, 4].map((k) => f.prixDeLAnnee * facteur(k)));
}

/** Les nuitées qu'une baisse doit faire vendre en plus pour garder la marge : vendues × b × p ÷ (p × (1 − b) − coût variable). */
export function nuiteesAGagner(f: FicheDeLHotel, vendues: number): number {
  const p = f.prixDeLAnnee;
  return Math.ceil((vendues * BAISSE_EN_BASSE_SAISON * p) / (p * (1 - BAISSE_EN_BASSE_SAISON) - f.coutVariableParNuitee) - 1e-9);
}

/** Les trois prix de l'année, et ce que chacun donne. */
export function prixSelonLaSaison(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = saisonDuMarche(c);
  const unique = anneeAuPrix(c, () => 1);
  const facteurDeSaison = (k: number) => (m.haute.includes(k) ? 1 + HAUSSE_EN_HAUTE_SAISON : 1 - BAISSE_EN_BASSE_SAISON);
  const saison = anneeAuPrix(c, facteurDeSaison);
  // Ce que l'année au prix unique a laissé : des clients refusés, ou des chambres vides.
  const refus = unique.trimestres.filter((t) => t.refusees > 0).map((t) => t.numero);
  const vides = unique.trimestres.filter((t) => t.vides > 0).map((t) => t.numero);
  const aGagner = (k: number) => nuiteesAGagner(f, unique.trimestres[k - 1]!.vendues);
  const videsDu = (k: number) => unique.trimestres[k - 1]!.vides;
  const baisses = vides.filter((k) => videsDu(k) >= aGagner(k));
  const facteurDeRemplissage = (k: number) => (refus.includes(k) ? 1 + HAUSSE_EN_HAUTE_SAISON : baisses.includes(k) ? 1 - BAISSE_EN_BASSE_SAISON : 1);
  const remplissage = anneeAuPrix(c, facteurDeRemplissage);
  const annees: Record<CodeDuPrix, AnneeDeLHotel> = { unique, saison, remplissage };
  const meilleur = (Object.keys(annees) as CodeDuPrix[]).reduce((a, b) => (annees[b].resultat > annees[a].resultat ? b : a));
  return {
    f,
    m,
    jours: f.joursParTrimestre,
    chambres: f.chambres,
    offertes: nuiteesOffertes(f),
    prixUnique: f.prixDeLAnnee,
    prixHaut: auCentime(f.prixDeLAnnee * (1 + HAUSSE_EN_HAUTE_SAISON)),
    prixBas: auCentime(f.prixDeLAnnee * (1 - BAISSE_EN_BASSE_SAISON)),
    unique,
    saison,
    remplissage,
    facteurDeSaison,
    facteurDeRemplissage,
    refus,
    vides,
    /** Les trimestres où il restait assez de chambres vides pour qu'une baisse paie, et ceux où il n'en restait pas assez. */
    baisses,
    tropPeuDeVides: vides.filter((k) => !baisses.includes(k)),
    aGagner,
    videsDu,
    ecartSaison: auCentime(saison.resultat - unique.resultat),
    ecartRemplissage: auCentime(remplissage.resultat - unique.resultat),
    meilleur,
    /** Les trimestres où le calendrier et le remplissage se contredisent. */
    hausseMalPlacee: m.haute.filter((k) => !refus.includes(k)),
    baisseMalPlacee: m.basse.filter((k) => !baisses.includes(k)),
    ...lesSeuilsDuPrix(f, unique, refus, vides, vides.filter((k) => !baisses.includes(k))),
  };
}

/**
 * Les deux seuils des curseurs, et la variante. Au trimestre où il reste trop peu de chambres vides
 * (ou, à défaut, le premier où il en reste) : les nuitées qu'une baisse de 15 % devrait faire vendre
 * pour garder la marge du prix unique. Au premier trimestre où des clients sont refusés : les nuitées
 * qu'une hausse de 15 % peut perdre en gardant la marge. Puis la petite baisse de la variante.
 */
function lesSeuilsDuPrix(f: FicheDeLHotel, unique: AnneeDeLHotel, refus: readonly number[], vides: readonly number[], tropPeu: readonly number[]) {
  const p = f.prixDeLAnnee;
  const cv = f.coutVariableParNuitee;
  const prixBas = auCentime(p * (1 - BAISSE_EN_BASSE_SAISON));
  const prixHaut = auCentime(p * (1 + HAUSSE_EN_HAUTE_SAISON));
  const kb = tropPeu[0] ?? vides[0] ?? 1;
  const tb = unique.trimestres[kb - 1]!;
  const margeDeLaBaisse = auCentime((p - cv) * tb.vendues);
  const pourLaBaisse = Math.ceil(margeDeLaBaisse / (prixBas - cv) - 1e-9);
  const kh = refus[0] ?? 1;
  const th = unique.trimestres[kh - 1]!;
  const margeDeLaHausse = auCentime((p - cv) * th.vendues);
  const pourLaHausse = Math.ceil(margeDeLaHausse / (prixHaut - cv) - 1e-9);
  const gainSiRienNeSePerd = auCentime(th.vendues * (prixHaut - p));
  const peutPerdre = Math.floor(gainSiRienNeSePerd / auCentime(prixHaut - cv) + 1e-9);
  const relevee = trimestreDeLHotel(f, kh, prixHaut);
  // La variante : la petite baisse au trimestre où celle de 15 % ne payait pas.
  const prixPetit = auCentime(p * (1 - PETITE_BAISSE));
  const petite = trimestreDeLHotel(f, kb, prixPetit);
  return {
    curseurDeLaBaisse: {
      trimestre: kb,
      vendues: tb.vendues,
      vides: tb.vides,
      marge: margeDeLaBaisse,
      margeParNuitee: auCentime(prixBas - cv),
      attendu: pourLaBaisse,
      min: Math.floor(tb.vendues / 1000) * 1000,
      max: Math.ceil((pourLaBaisse + 1) / 1000) * 1000,
    },
    curseurDeLaHausse: {
      trimestre: kh,
      vendues: th.vendues,
      refusees: th.refusees,
      marge: margeDeLaHausse,
      margeParNuitee: auCentime(prixHaut - cv),
      attendu: pourLaHausse,
      min: Math.floor(pourLaHausse / 1000) * 1000,
      max: th.offertes,
      gainSiRienNeSePerd,
      peutPerdre,
      relevee,
      perdues: th.vendues - relevee.vendues,
    },
    petiteBaisse: {
      trimestre: kb,
      prix: prixPetit,
      parNuiteeVendue: auCentime(p - prixPetit),
      margeParNuitee: auCentime(prixPetit - cv),
      aGagner: Math.ceil((tb.vendues * auCentime(p - prixPetit)) / auCentime(prixPetit - cv) - 1e-9),
      simulee: petite,
      gagnees: petite.vendues - tb.vendues,
      ecart: auCentime(petite.resultat - tb.resultat),
    },
  };
}

/** Les prix que le laboratoire propose, de son minimum à son maximum, par son pas. */
export const prixDuLaboratoire = (): number[] => {
  const x = PRIX_DU_LABORATOIRE;
  return Array.from({ length: Math.round((x.max - x.min) / x.pas) + 1 }, (_, i) => auCentime(x.min + i * x.pas));
};

/**
 * LE LABORATOIRE DES QUATRE PRIX : l'année de l'hôtel aux quatre prix que l'élève choisit, par le
 * modèle de l'hôtel. Le départ : les prix du remplissage. Le défi : un résultat de l'année au-dessus
 * de celui du remplissage. Sa solution : les prix du remplissage, sauf aux trimestres où des clients
 * étaient refusés, où le prix devient le plus haut prix du laboratoire qui remplit encore l'hôtel.
 * Le prix qui remplit juste l'hôtel, au centime, se calcule aussi à rebours : prix de l'année ×
 * (demande ÷ nuitées offertes) ^ (1 ÷ −élasticité).
 */
export function laboratoireDesQuatrePrix(c: Pick<Cas, "code">) {
  const p = prixSelonLaSaison(c);
  const f = p.f;
  const codes = ["t1", "t2", "t3", "t4"] as const;
  const auxPrix = (x: Readonly<Record<string, number>>) => anneeDeLHotel(f, codes.map((k) => x[k]!));
  const depart = Object.fromEntries(p.remplissage.trimestres.map((t, i) => [codes[i]!, t.prix])) as Record<(typeof codes)[number], number>;
  const grille = prixDuLaboratoire();
  // Le plus haut prix du laboratoire où la demande remplit encore toutes les nuitées offertes.
  const prixQuiRemplit = (n: number) => [...grille].reverse().find((x) => trimestreDeLHotel(f, n, x).demande >= nuiteesOffertes(f)) ?? grille[0]!;
  const remplis = [1, 2, 3, 4].map(prixQuiRemplit);
  const solution = { ...depart, ...Object.fromEntries(p.refus.map((n) => [codes[n - 1]!, remplis[n - 1]!])) };
  const kh = p.refus[0] ?? 1;
  const demandeDuTrimestre = p.unique.trimestres[kh - 1]!.demande;
  const prixJuste = auCentime(f.prixDeLAnnee * (demandeDuTrimestre / nuiteesOffertes(f)) ** (1 / -f.elasticite));
  const auPrixJuste = trimestreDeLHotel(f, kh, prixJuste);
  return {
    p,
    f,
    codes,
    auxPrix,
    depart,
    solution,
    cible: p.remplissage.resultat,
    remplis,
    anneeAuxPrixQuiRemplissent: auxPrix(Object.fromEntries(codes.map((k, i) => [k, remplis[i]!]))),
    aRebours: {
      trimestre: kh,
      demande: demandeDuTrimestre,
      prix: prixJuste,
      trimestreAuPrix: auPrixJuste,
      resultat: auCentime((prixJuste - f.coutVariableParNuitee) * nuiteesOffertes(f) - f.chargesFixesParTrimestre),
      ecartAvecLaHausse: auCentime((prixJuste - f.coutVariableParNuitee) * nuiteesOffertes(f) - f.chargesFixesParTrimestre - p.remplissage.trimestres[kh - 1]!.resultat),
    },
  };
}

function tableauDuMarche(c: Cas): TableauDeDonnees {
  const m = saisonDuMarche(c);
  const f = ficheDe(c);
  return {
    titre: `La demande adressée à ${f.entreprise} au prix de ${eur(f.prixDeLAnnee)}, en nuitées`,
    colonnes: m.numeros.map((k) => `${rang(k)} trimestre`),
    lignes: [
      ...m.clienteles.map((g) => ({ libelle: g.nom, valeurs: g.parTrimestre.map(qte) })),
      { libelle: "Toute la demande", valeurs: m.totaux.map(qte) },
    ],
  };
}

function tableauDeLAnnee(c: Cas, a: AnneeDeLHotel, titre: string, premiere?: { libelle: string; valeurs: string[] }): TableauDeDonnees {
  const f = ficheDe(c);
  return {
    titre,
    colonnes: a.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      ...(premiere ? [premiere] : []),
      { libelle: "Prix de la nuitée", valeurs: a.trimestres.map((t) => eur(t.prix)) },
      { libelle: `Demande adressée à ${f.entreprise}`, valeurs: a.trimestres.map((t) => qte(t.demande)) },
      { libelle: "Nuitées offertes", valeurs: a.trimestres.map((t) => qte(t.offertes)) },
      { libelle: "Nuitées vendues", valeurs: a.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Chiffre d'affaires", valeurs: a.trimestres.map((t) => eur(t.chiffreDAffaires)) },
      { libelle: "Résultat", valeurs: a.trimestres.map((t) => eur(t.resultat)) },
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

/** Ce qu'une année a changé au résultat, trimestre par trimestre. */
function trimestreParTrimestre(p: ReturnType<typeof prixSelonLaSaison>, a: AnneeDeLHotel, nom: (k: number) => string) {
  return a.trimestres
    .map((t, i) => `${signe(auCentime(t.resultat - p.unique.trimestres[i]!.resultat))} au ${rang(t.numero)} (${nom(t.numero)})`)
    .join(", ");
}

const saisonDe = (p: ReturnType<typeof prixSelonLaSaison>, k: number) => (p.m.haute.includes(k) ? "haute saison" : "basse saison");
const remplissageDe = (p: ReturnType<typeof prixSelonLaSaison>, k: number) =>
  p.refus.includes(k) ? "clients refusés" : p.baisses.includes(k) ? "chambres vides" : p.vides.includes(k) ? "peu de chambres vides" : "tout vendu";

export const LE_PRIX_SELON_LA_SAISON: Chapitre = {
  code: "le-prix-selon-la-saison",
  parcours: "mhr",
  palier: 3,
  blocs: ["BTS MHR Bloc 2 · Mercatique des services en hôtellerie restauration"],
  titre: "Remplir l'hôtel : le prix selon la saison",
  accroche:
    "Chaque clientèle de l'hôtel a sa saison. La simulation du cours rejoue l'année avec un prix plus haut en haute saison et plus bas en basse saison, puis avec un prix qui suit le remplissage : taux d'occupation, prix moyen, revenu par chambre et résultat, face au prix unique.",
  objectifs: [
    "Lire la saisonnalité de la demande et calculer des coefficients saisonniers",
    "Calculer le taux d'occupation, le prix moyen et le revenu par chambre disponible d'une année",
    "Comparer une année à prix unique et une année au prix de la saison",
    "Expliquer pourquoi le prix doit suivre ce qui reste à vendre, et pas seulement le calendrier",
    "Chiffrer ce qu'une baisse doit faire vendre et ce qu'une hausse peut perdre, et retrouver le prix qui remplit l'hôtel",
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
          `Ce chapitre se joue dans la simulation du cours. ${p.f.entreprise} a ${qte(p.chambres)} chambres, toutes en vente chaque nuit : ${qte(p.offertes)} nuitées offertes par trimestre de ${qte(p.jours)} jours. Une nuitée occupée lui coûte ${eur(p.f.coutVariableParNuitee)} (ménage, linge, petit-déjeuner) ; ses autres charges, ${eur(p.f.chargesFixesParTrimestre)} par trimestre, ne dépendent pas du remplissage.`,
          `L'hôtel reçoit ${qte(m.clienteles.length)} clientèles, et chacune a sa saison. Le tableau donne les nuitées qu'elles lui demandent au prix de ${eur(p.prixUnique)}.`,
          ...extremes,
          `Quand le prix change, la demande change aussi : dans la simulation, un prix plus haut de 1 % fait perdre environ ${qte(-p.f.elasticite)} % de la demande (une élasticité de ${qte(p.f.elasticite)}). L'hôtel vend ce qu'on lui demande, dans la limite de ses chambres.`,
        ];
      },
      repere: () =>
        "Coefficient saisonnier d'un trimestre = demande du trimestre ÷ demande moyenne d'un trimestre. Au-dessus de 1, c'est la haute saison ; en dessous, la basse saison.",
    },
    {
      id: "coefficients",
      objectifs: [0],
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
          `Au ${rang(m.plusHaut)} trimestre, l'hôtel reçoit ${pct(Math.round((m.totaux[m.plusHaut - 1]! / m.totaux[m.plusBas - 1]! - 1) * 100))} de demande de plus qu'au ${rang(m.plusBas)}.`,
        ];
      },
    },
    {
      id: "prix-unique",
      objectifs: [1],
      type: "montants",
      titre: "Une année à prix unique",
      notions: ["occupancy_revpar", "seasonality"],
      tableau: (c) => tableauDeLAnnee(c, prixSelonLaSaison(c).unique, `L'année ${dE(ficheDe(c).entreprise)} au prix unique`),
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique de ${eur(p.prixUnique)}, la demande ne suit pas les ${qte(p.offertes)} nuitées offertes chaque trimestre. Calculez, trimestre par trimestre, les nuitées refusées (demande − nuitées offertes, là où la demande dépasse) et les nuitées vides (nuitées offertes − nuitées vendues, là où il en reste).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return [
          ...p.refus.map((k) => ({
            libelle: `Nuitées refusées au ${rang(k)} trimestre`,
            attendu: t[k - 1]!.refusees,
            calcul: `${qte(t[k - 1]!.demande)} − ${qte(t[k - 1]!.offertes)} = ${qte(t[k - 1]!.refusees)}`,
            tolerance: 0,
          })),
          ...p.vides.map((k) => ({
            libelle: `Nuitées vides au ${rang(k)} trimestre`,
            attendu: p.videsDu(k),
            calcul: `${qte(t[k - 1]!.offertes)} − ${qte(t[k - 1]!.vendues)} = ${qte(p.videsDu(k))}`,
            tolerance: 0,
          })),
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const a = p.unique;
        return [
          `Sur l'année au prix unique, ${p.f.entreprise} vend ${qte(a.vendues)} des ${qte(a.offertes)} nuitées offertes : un taux d'occupation de ${pct(a.occupation)}, un prix moyen de ${eur(a.prixMoyen)} et un revenu par chambre disponible de ${eur(a.revpar)}, pour ${eur(a.resultat)} de résultat. Ce sont les chiffres à battre.`,
        ];
      },
    },
    {
      id: "lire-l-annee",
      objectifs: [3],
      type: "choix",
      titre: "Ce que le prix unique laisse",
      notions: ["occupancy_revpar", "seasonality"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const refus = p.refus.length ? `Des clients refusés ${auxTrimestres(p.refus)}` : "Aucun client refusé";
        const vides = p.vides.length ? `des chambres vides ${auxTrimestres(p.vides)}` : "aucune chambre vide";
        return `${refus}, ${vides} : que dit le tableau du prix unique de ${eur(p.prixUnique)} ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const lesDeux = p.refus.length > 0 && p.vides.length > 0;
        const tropHaut = p.refus.length === 0 && p.vides.length > 0;
        const yield_ =
          "C'est l'idée du yield management : faire varier le prix selon ce qui reste à vendre, le monter quand les clients se pressent, le baisser quand des chambres restent vides. Reste à savoir ce que chaque prix rapporte : la simulation va rejouer l'année.";
        return [
          {
            texte: "Trop bas quand des clients repartaient, trop haut quand des chambres restaient vides",
            juste: lesDeux,
            retour: lesDeux ? `Oui. ${yield_}` : `Non : ${p.refus.length === 0 ? "aucun client n'est reparti" : "aucune chambre n'est restée vide"}.`,
          },
          {
            texte: "Trop haut toute l'année : il fallait le baisser à chaque trimestre pour remplir",
            juste: tropHaut,
            retour: tropHaut
              ? `Oui : aucun client n'est reparti, et des chambres sont restées vides. ${yield_}`
              : p.refus.length
                ? `Non : ${auxTrimestres(p.refus)}, des clients sont repartis sans chambre. Baisser le prix n'y aurait pas vendu une nuitée de plus : l'hôtel était complet.`
                : "Non : aucune chambre n'est restée vide.",
          },
          {
            texte: "Trop bas toute l'année : il fallait le monter à chaque trimestre, partout",
            juste: !lesDeux && !tropHaut,
            retour:
              !lesDeux && !tropHaut
                ? `Oui : aucune chambre n'est restée vide, et des clients sont repartis. ${yield_}`
                : p.vides.length
                  ? `Non : ${auxTrimestres(p.vides)}, des chambres sont restées vides. Monter le prix y aurait fait partir des clients.`
                  : "Non : aucun client n'est reparti sans chambre.",
          },
        ];
      },
    },
    {
      id: "prix-de-la-saison",
      objectifs: [2],
      type: "montants",
      titre: "Le prix de la saison",
      notions: ["seasonality", "occupancy_revpar"],
      tableau: (c) => {
        const p = prixSelonLaSaison(c);
        return tableauDeLAnnee(c, p.saison, `L'année ${dE(p.f.entreprise)} au prix de la saison`, {
          libelle: "Saison",
          valeurs: p.saison.trimestres.map((t) => saisonDe(p, t.numero)),
        });
      },
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `La simulation rejoue l'année avec un prix ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} plus haut en haute saison (${eur(p.prixHaut)}) et ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} plus bas en basse saison (${eur(p.prixBas)}). Au prix unique, le résultat de l'année était de ${eur(p.unique.resultat)}. Calculez, au prix de la saison, le taux d'occupation de l'année, le prix moyen et le revenu par chambre disponible, puis l'écart de résultat (prix de la saison moins prix unique).`;
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
            libelle: "Écart de résultat, saison moins prix unique",
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
          `Le résultat de l'année ${p.ecartSaison >= 0 ? `monte de ${eur(p.ecartSaison)}` : `baisse de ${eur(-p.ecartSaison)}`}.`,
        ];
      },
    },
    {
      id: "verdict-de-la-saison",
      objectifs: [2],
      type: "choix",
      titre: "Le prix de la saison a-t-il payé ?",
      notions: ["seasonality", "occupancy_revpar"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique, ${p.f.entreprise} finit l'année avec ${eur(p.unique.resultat)} de résultat ; au prix de la saison, avec ${eur(p.saison.resultat)}. Le prix de la saison a-t-il payé ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const detail = `Le résultat a changé de ${trimestreParTrimestre(p, p.saison, (k) => saisonDe(p, k))}.`;
        const t = (a: AnneeDeLHotel, k: number) => a.trimestres[k - 1]!;
        // Là où le calendrier se trompe : une hausse sans clients refusés, une baisse sans assez de chambres vides.
        const contre = [
          ...p.hausseMalPlacee.map(
            (k) => `au ${rang(k)} trimestre, la haute saison ne remplissait pas l'hôtel, et la hausse a fait partir des clients (${qte(t(p.saison, k).vendues)} nuitées vendues contre ${qte(t(p.unique, k).vendues)})`,
          ),
          ...p.baisseMalPlacee.map(
            (k) => `au ${rang(k)}, la basse saison laissait trop peu de chambres vides pour payer la baisse (${qte(p.videsDu(k))} nuitées vides pour ${qte(p.aGagner(k))} à gagner)`,
          ),
        ];
        const pourquoi = contre.length ? ` Le calendrier dit quand les clients viennent, pas s'il reste des chambres à leur vendre : ${contre.join(" ; ")}.` : "";
        return [
          {
            texte: "Oui : le résultat de l'année monte",
            juste: p.ecartSaison > 0,
            retour: p.ecartSaison > 0 ? `Oui, de ${eur(p.ecartSaison)}. ${detail}${pourquoi}` : `Non. ${detail}${pourquoi}`,
          },
          {
            texte: "Non : le résultat de l'année baisse",
            juste: p.ecartSaison < 0,
            retour: p.ecartSaison < 0 ? `Oui, de ${eur(-p.ecartSaison)}. ${detail}${pourquoi}` : `Non. ${detail}`,
          },
          {
            texte: "Il ne change pas : ce que l'été gagne, l'hiver le perd",
            juste: p.ecartSaison === 0,
            retour: p.ecartSaison === 0 ? `Oui. ${detail}` : `Non : il change de ${signe(p.ecartSaison)}. ${detail}`,
          },
        ];
      },
    },
    {
      id: "predire-la-baisse",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la baisse",
      notions: ["price_elasticity", "occupancy_revpar"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        return `Avant de calculer, pariez. Au ${rang(b.trimestre)} trimestre, au prix unique, ${p.f.entreprise} a vendu ${qte(b.vendues)} nuitées et il en est resté ${qte(b.vides)} vides. Une baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)}, à ${eur(p.prixBas)}, peut-elle y garder la marge du trimestre ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        const impossible = b.attendu > p.offertes;
        const voir = "Faites vendre l'hôtel au prix baissé, au curseur de l'étape suivante.";
        return [
          { texte: `Oui : la baisse remplira les ${qte(b.vides)} chambres vides`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Oui, si la demande monte d'au moins ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)}`, juste: !impossible, retour: `${impossible ? "Pari à vérifier" : "Bon pari"}. ${voir}` },
          { texte: "Non : il faudrait plus de nuitées que l'hôtel n'en offre", juste: impossible, retour: `${impossible ? "Bon pari" : "Pari à vérifier"}. ${voir}` },
        ];
      },
    },
    {
      id: "la-baisse-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "La baisse au curseur",
      notions: ["price_elasticity", "occupancy_revpar"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        return `Faites varier les nuitées vendues au ${rang(b.trimestre)} trimestre, à ${eur(p.prixBas)}. Une droite donne la marge sur coûts variables du trimestre à ce prix (${eur(b.margeParNuitee)} par nuitée vendue, une fois payé son coût de ${eur(p.f.coutVariableParNuitee)}), l'autre la marge au prix unique, ${eur(b.marge)}. Placez le curseur sur le moins de nuitées qui garde la marge, puis validez.`;
      },
      grandeur: (c) => {
        const p = prixSelonLaSaison(c);
        return { libelle: `Nuitées vendues au ${rang(p.curseurDeLaBaisse.trimestre)} trimestre, à ${eur(p.prixBas)}`, unite: "nuitées" };
      },
      cible: (c) => {
        const b = prixSelonLaSaison(c).curseurDeLaBaisse;
        return { attendu: b.attendu, min: b.min, max: b.max };
      },
      zones: ["La baisse paie", "La baisse coûte"],
      rates: () => ({
        dessous: "Avec si peu de nuitées vendues, la baisse fait perdre de la marge.",
        dessus: "Moins de nuitées suffiraient encore : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de nuitées",
      lecture: (c, n) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        const marge = auCentime(b.margeParNuitee * n);
        return [
          { libelle: `Marge sur coûts variables à ${eur(p.prixBas)}`, montant: marge },
          { libelle: `Marge sur coûts variables à ${eur(p.prixUnique)}`, montant: b.marge },
          { libelle: "Écart de marge", montant: auCentime(marge - b.marge), fort: true },
        ];
      },
      droites: (c) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        return { produit: (n) => b.margeParNuitee * n, cout: () => b.marge, libelles: [`Marge à ${eur(p.prixBas)}`, "Marge au prix unique"] };
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const b = p.curseurDeLaBaisse;
        return [
          `Il faudrait vendre ${qte(b.attendu)} nuitées, ${qte(b.attendu - b.vendues)} de plus qu'au prix unique${b.attendu > p.offertes ? `, quand l'hôtel n'en offre que ${qte(p.offertes)} : aucune baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ne peut payer ce trimestre-là` : ""}. Chaque nuitée déjà vendue perd ${eur(auCentime(p.prixUnique - p.prixBas))}, et chaque nuitée gagnée ne rapporte que ${eur(b.margeParNuitee)}.`,
          "Une baisse ne se juge pas aux chambres vides qu'elle remplit, mais à la marge qu'elle garde. L'étape suivante en tire le calcul, trimestre par trimestre.",
        ];
      },
    },
    {
      id: "ce-qu-une-baisse-doit-vendre",
      objectifs: [4],
      type: "montants",
      titre: "Ce qu'une baisse doit faire vendre",
      notions: ["occupancy_revpar", "price_elasticity"],
      si: (c) => prixSelonLaSaison(c).vides.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return `Une baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ne garde la marge que si elle fait vendre assez de nuitées en plus. Chaque nuitée déjà vendue perd ${eur(auCentime(p.prixUnique * BAISSE_EN_BASSE_SAISON))} ; chaque nuitée gagnée rapporte le prix baissé moins son coût, ${eur(p.prixBas)} − ${eur(p.f.coutVariableParNuitee)}. Il faut donc gagner : nuitées vendues × ${eur(auCentime(p.prixUnique * BAISSE_EN_BASSE_SAISON))} ÷ ${eur(auCentime(p.prixBas - p.f.coutVariableParNuitee))}. ${majuscule(auxTrimestres(p.vides))}, au prix unique, ${p.f.entreprise} a vendu ${enListe(p.vides.map((k) => qte(t[k - 1]!.vendues)))} nuitées, et il restait ${enListe(p.vides.map((k) => qte(p.videsDu(k))))} nuitées vides. Calculez, pour chacun, les nuitées qu'une baisse devrait faire vendre en plus (arrondi à l'unité supérieure).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const t = p.unique.trimestres;
        return p.vides.map((k) => ({
          libelle: `Nuitées à gagner au ${rang(k)} trimestre`,
          attendu: p.aGagner(k),
          calcul: `${qte(t[k - 1]!.vendues)} × ${eur(auCentime(p.prixUnique * BAISSE_EN_BASSE_SAISON))} ÷ ${eur(auCentime(p.prixBas - p.f.coutVariableParNuitee))} = ${qte(p.aGagner(k))}`,
          tolerance: 1,
        }));
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const paie = p.baisses.map((k) => `${auxTrimestres([k])}, il restait ${qte(p.videsDu(k))} nuitées vides pour ${qte(p.aGagner(k))} à gagner : une baisse pouvait payer`);
        const paiePas = p.tropPeuDeVides.map((k) => `${auxTrimestres([k])}, il n'en restait que ${qte(p.videsDu(k))} pour ${qte(p.aGagner(k))} à gagner : même en les remplissant toutes, la baisse aurait coûté plus qu'elle ne rapporte`);
        return [
          `${majuscule([...paie, ...paiePas].join(" ; "))}.`,
          "Ce calcul se fait en marge, pas en chiffre d'affaires : une nuitée de plus remplit une chambre, et chaque chambre occupée a son coût.",
        ];
      },
    },
    {
      id: "predire-la-hausse",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la hausse",
      notions: ["price_elasticity", "occupancy_revpar"],
      si: (c) => prixSelonLaSaison(c).refus.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return `Pariez encore. Au ${rang(h.trimestre)} trimestre, au prix unique, l'hôtel refuse ${qte(h.refusees)} nuitées. Une hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)}, à ${eur(p.prixHaut)}, fera partir des clients : combien de nuitées vendues peut-il perdre avant que la hausse coûte plus qu'elle ne rapporte ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        const seuil = Math.floor(h.peutPerdre / 100) * 100;
        const voir = "Faites vendre l'hôtel au prix relevé, au curseur de l'étape suivante.";
        return [
          { texte: "Aucune : il doit rester plein", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Exactement les ${qte(h.refusees)} qu'il refusait`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Plus de ${qte(seuil)} : chaque nuitée gardée rapporte plus`, juste: true, retour: `Bon pari. ${voir}` },
        ];
      },
    },
    {
      id: "la-hausse-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "La hausse au curseur",
      notions: ["price_elasticity", "occupancy_revpar"],
      si: (c) => prixSelonLaSaison(c).refus.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return `Faites varier les nuitées vendues au ${rang(h.trimestre)} trimestre, à ${eur(p.prixHaut)}. Une droite donne la marge sur coûts variables du trimestre à ce prix (${eur(h.margeParNuitee)} par nuitée vendue), l'autre la marge au prix unique, ${eur(h.marge)}. Placez le curseur sur le moins de nuitées qui garde la marge, puis validez.`;
      },
      grandeur: (c) => {
        const p = prixSelonLaSaison(c);
        return { libelle: `Nuitées vendues au ${rang(p.curseurDeLaHausse.trimestre)} trimestre, à ${eur(p.prixHaut)}`, unite: "nuitées" };
      },
      cible: (c) => {
        const h = prixSelonLaSaison(c).curseurDeLaHausse;
        return { attendu: h.attendu, min: h.min, max: h.max };
      },
      zones: ["La hausse paie", "La hausse coûte"],
      rates: () => ({
        dessous: "Avec si peu de nuitées vendues, la hausse fait perdre de la marge.",
        dessus: "Moins de nuitées garderaient encore la marge : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de nuitées",
      lecture: (c, n) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        const marge = auCentime(h.margeParNuitee * n);
        return [
          { libelle: `Marge sur coûts variables à ${eur(p.prixHaut)}`, montant: marge },
          { libelle: `Marge sur coûts variables à ${eur(p.prixUnique)}`, montant: h.marge },
          { libelle: "Écart de marge", montant: auCentime(marge - h.marge), fort: true },
        ];
      },
      droites: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return { produit: (n) => h.margeParNuitee * n, cout: () => h.marge, libelles: [`Marge à ${eur(p.prixHaut)}`, "Marge au prix unique"] };
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return [
          `La hausse garde la marge tant que l'hôtel vend au moins ${qte(h.attendu)} nuitées : il peut en perdre ${qte(h.peutPerdre)} sur ${qte(h.vendues)}. La simulation lui en fait perdre ${qte(h.perdues)} (${qte(h.relevee.vendues)} vendues) : la hausse paie largement.`,
          "C'est le calcul de la baisse, à l'envers : chaque nuitée gardée rapporte la hausse, chaque nuitée perdue emporte sa marge au prix relevé. L'étape suivante le chiffre.",
        ];
      },
    },
    {
      id: "ce-qu-une-hausse-peut-perdre",
      objectifs: [4],
      type: "montants",
      titre: "Ce qu'une hausse peut perdre",
      notions: ["price_elasticity", "occupancy_revpar"],
      si: (c) => prixSelonLaSaison(c).refus.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return `Par le raisonnement de la baisse, mis à l'envers, chiffrez ce qu'une hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} peut perdre au ${rang(h.trimestre)} trimestre : ce qu'elle rapporterait si aucune des ${qte(h.vendues)} nuitées ne se perdait, la marge qu'emporte chaque nuitée perdue, puis les nuitées que la hausse peut perdre (à l'unité inférieure).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return [
          {
            libelle: "Gain de la hausse, sans nuitée perdue",
            attendu: h.gainSiRienNeSePerd,
            calcul: `${qte(h.vendues)} × (${eur(p.prixHaut)} − ${eur(p.prixUnique)}) = ${eur(h.gainSiRienNeSePerd)}`,
          },
          { libelle: "Marge d'une nuitée perdue", attendu: h.margeParNuitee, calcul: `${eur(p.prixHaut)} − ${eur(p.f.coutVariableParNuitee)} = ${eur(h.margeParNuitee)}` },
          {
            libelle: "Nuitées que la hausse peut perdre",
            attendu: h.peutPerdre,
            calcul: `${eur(h.gainSiRienNeSePerd)} ÷ ${eur(h.margeParNuitee)} = ${qte(h.peutPerdre)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const h = p.curseurDeLaHausse;
        return [
          `La hausse peut perdre ${qte(h.peutPerdre)} nuitées ; elle en perd ${qte(h.perdues)}. Une hausse se juge comme une baisse : à la marge, en comptant ce que chaque nuitée gagne et ce que chaque nuitée perdue emporte.`,
        ];
      },
    },
    {
      id: "prix-du-remplissage",
      objectifs: [3],
      type: "montants",
      titre: "Le prix qui suit le remplissage",
      notions: ["occupancy_revpar"],
      tableau: (c) => {
        const p = prixSelonLaSaison(c);
        return tableauDeLAnnee(c, p.remplissage, `L'année ${dE(p.f.entreprise)} au prix du remplissage`, {
          libelle: "Au prix unique",
          valeurs: p.remplissage.trimestres.map((t) => remplissageDe(p, t.numero)),
        });
      },
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const regles = [
          p.refus.length ? `monte de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} ${auxTrimestres(p.refus)}, où des clients repartaient au prix unique` : "",
          p.baisses.length ? `baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ${auxTrimestres(p.baisses)}, où les chambres vides pouvaient payer la baisse` : "",
          p.tropPeuDeVides.length
            ? `ne bouge pas ${auxTrimestres(p.tropPeuDeVides)}, où ${p.baisses.length ? "elles ne le pouvaient pas" : "les chambres vides étaient trop peu nombreuses pour payer une baisse"}`
            : "",
        ].filter(Boolean);
        return `La simulation rejoue l'année une dernière fois. Le prix ${regles.join(" ; il ")}. Calculez le taux d'occupation de l'année, le revenu par chambre disponible, puis l'écart de résultat avec le prix unique (prix du remplissage moins prix unique).`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const a = p.remplissage;
        const k = calculsDeLAnnee(a);
        return [
          { libelle: "Taux d'occupation au prix du remplissage (%)", attendu: a.occupation, calcul: k.occupation, tolerance: 0.1 },
          { libelle: "Revenu par chambre disponible au prix du remplissage", attendu: a.revpar, calcul: k.revpar },
          {
            libelle: "Écart de résultat, remplissage moins prix unique",
            attendu: p.ecartRemplissage,
            calcul: `${eur(a.resultat)} − ${retranche(p.unique.resultat)} = ${eur(p.ecartRemplissage)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        return [
          `Le résultat a changé de ${trimestreParTrimestre(p, p.remplissage, (k) => remplissageDe(p, k))}.`,
          `Le revenu par chambre disponible passe de ${eur(p.unique.revpar)} à ${eur(p.remplissage.revpar)}, et le résultat de l'année ${p.ecartRemplissage >= 0 ? `monte de ${eur(p.ecartRemplissage)}` : `baisse de ${eur(-p.ecartRemplissage)}`}.`,
        ];
      },
    },
    {
      id: "la-regle",
      objectifs: [3],
      type: "choix",
      titre: "Fixer le prix d'un trimestre",
      notions: ["occupancy_revpar", "seasonality"],
      question: (c) => {
        const p = prixSelonLaSaison(c);
        return `Au prix unique, l'année rapporte ${eur(p.unique.resultat)} de résultat ; au prix de la saison, ${eur(p.saison.resultat)} ; au prix du remplissage, ${eur(p.remplissage.resultat)}. Que retenir pour fixer le prix d'un trimestre ?`;
      },
      options: (c) => {
        const p = prixSelonLaSaison(c);
        const resultats = `Résultat de l'année : ${eur(p.unique.resultat)} au prix unique, ${eur(p.saison.resultat)} au prix de la saison, ${eur(p.remplissage.resultat)} au prix du remplissage.`;
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
            retour: p.meilleur === "unique" ? `Oui. ${resultats}` : `Non. ${resultats}`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-des-quatre-prix",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des quatre prix",
      notions: ["occupancy_revpar", "price_elasticity", "seasonality"],
      question: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        return `Partez des prix du remplissage, ceux de l'étape précédente, et faites mieux. Les quatre leviers sont les prix de la nuitée de chaque trimestre ; la demande de chaque trimestre y répond (élasticité de ${qte(l.f.elasticite)}), et l'hôtel ne vend pas plus de ${qte(l.p.offertes)} nuitées par trimestre. Le graphique suit la demande du ${rang(l.aRebours.trimestre)} trimestre selon son prix, face aux nuitées offertes.`;
      },
      leviers: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        return l.codes.map((code, i) => ({ code, libelle: `Prix du ${rang(i + 1)} trimestre`, unite: "€", ...PRIX_DU_LABORATOIRE, depart: l.depart[code] }));
      },
      lecture: (c, x) => {
        const l = laboratoireDesQuatrePrix(c);
        const a = l.auxPrix(x);
        const d = l.auxPrix(l.depart);
        return [
          ...a.trimestres.map((t, i) => ({ libelle: `Nuitées vendues au ${rang(t.numero)} trimestre`, montant: t.vendues, reference: d.trimestres[i]!.vendues, unite: "nuitées" })),
          { libelle: "Taux d'occupation de l'année", montant: a.occupation, reference: d.occupation, unite: "%" },
          { libelle: "Revenu par chambre disponible de l'année", montant: a.revpar, reference: d.revpar },
          { libelle: "Résultat de l'année", montant: a.resultat, reference: d.resultat },
          { libelle: "Écart avec le prix du remplissage", montant: auCentime(a.resultat - l.cible) + 0, reference: 0, effet: true, fort: true },
        ];
      },
      // La demande d'un trimestre selon son prix : une courbe, pas une droite (élasticité constante).
      graphique: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        const n = l.aRebours.trimestre;
        const code = l.codes[n - 1]!;
        return {
          levier: code,
          unite: "nuitées",
          courbes: [
            { libelle: `Nuitées demandées au ${rang(n)} trimestre`, valeur: (x) => trimestreDeLHotel(l.f, n, x[code]!).demande },
            { libelle: "Nuitées offertes", valeur: () => l.p.offertes },
          ],
        };
      },
      defi: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        return {
          consigne: `Faites mieux que le prix du remplissage : un résultat de l'année au-dessus de ${eur(l.cible)}.`,
          atteint: (x) => l.auxPrix(x).resultat > l.cible,
          indice: (x) => {
            const a = l.auxPrix(x);
            const refuse = a.trimestres.find((t) => t.refusees > 0);
            if (refuse) return `Au ${rang(refuse.numero)} trimestre, l'hôtel refuse encore ${qte(refuse.refusees)} nuitées : son prix peut monter.`;
            const haut = a.trimestres.find((t) => l.p.refus.includes(t.numero) && t.vides > 0);
            if (haut)
              return `Au ${rang(haut.numero)} trimestre, à ${eur(haut.prix)}, il reste ${qte(haut.vides)} chambres vides : le prix a fait partir plus de clients qu'il n'en fallait. Cherchez sur le graphique le prix où la demande égale juste les nuitées offertes.`;
            return "Le meilleur prix d'un trimestre est celui où la demande égale juste les nuitées offertes : cherchez-le, trimestre par trimestre.";
          },
          solution: l.solution,
        };
      },
      montrer: "Montrer des prix qui font mieux",
      explication: (c, x) => {
        const l = laboratoireDesQuatrePrix(c);
        const a = l.auxPrix(x);
        const n = l.aRebours.trimestre;
        const t = a.trimestres[n - 1]!;
        const avant = l.p.remplissage.trimestres[n - 1]!;
        const r = l.anneeAuxPrixQuiRemplissent;
        return [
          `À ${eur(t.prix)} au ${rang(n)} trimestre, la demande (${qte(t.demande)} nuitées) ${t.demande >= t.offertes ? "remplit encore l'hôtel" : `laisse ${qte(t.vides)} chambres vides`} : il y vend ${qte(t.vendues)} nuitées, et le résultat de l'année passe à ${eur(a.resultat)}, ${eur(auCentime(a.resultat - l.cible))} de plus qu'au prix du remplissage. À ${eur(avant.prix)}, la hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} faisait partir ${qte(avant.vides)} clients de trop.`,
          `Ici, le meilleur prix d'un trimestre est celui où la demande égale juste les nuitées offertes : au-dessus, des chambres restent vides ; en dessous, l'hôtel refuse des clients qu'il aurait pu faire payer plus. Aux quatre prix qui remplissent juste l'hôtel (${enListe(l.remplis.map(eur))}), l'année rapporterait ${eur(r.resultat)}.`,
        ];
      },
    },
    {
      id: "le-prix-qui-remplit-juste",
      objectifs: [4],
      type: "montants",
      titre: "Le prix qui remplit juste l'hôtel",
      notions: ["price_elasticity", "occupancy_revpar"],
      si: (c) => prixSelonLaSaison(c).refus.length > 0,
      question: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        const r = l.aRebours;
        return `À rebours, maintenant. Au ${rang(r.trimestre)} trimestre, la demande vaut ${qte(r.demande)} nuitées au prix de ${eur(l.f.prixDeLAnnee)}, et ${qte(r.demande)} × (p ÷ ${qte(l.f.prixDeLAnnee)}) ^ ${qte(l.f.elasticite)} au prix p ; l'hôtel offre ${qte(l.p.offertes)} nuitées. Retrouvez le prix qui remplit juste l'hôtel, au centime, puis le résultat du trimestre à ce prix, et ce qu'il rapporte de plus que la hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)}.`;
      },
      champs: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        const r = l.aRebours;
        const f = l.f;
        const avant = l.p.remplissage.trimestres[r.trimestre - 1]!;
        return [
          {
            libelle: "Prix qui remplit juste l'hôtel",
            attendu: r.prix,
            calcul: `${eur(f.prixDeLAnnee)} × (${qte(r.demande)} ÷ ${qte(l.p.offertes)}) ^ (1 ÷ ${qte(-f.elasticite)}) = ${eur(r.prix)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Résultat du trimestre à ce prix",
            attendu: r.resultat,
            calcul: `(${eur(r.prix)} − ${eur(f.coutVariableParNuitee)}) × ${qte(l.p.offertes)} − ${eur(f.chargesFixesParTrimestre)} = ${eur(r.resultat)}`,
            tolerance: 300,
          },
          {
            libelle: "Ce qu'il rapporte de plus que la hausse",
            attendu: r.ecartAvecLaHausse,
            calcul: `${eur(r.resultat)} − ${eur(avant.resultat)} = ${eur(r.ecartAvecLaHausse)}`,
            tolerance: 300,
          },
        ];
      },
      explication: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        const r = l.aRebours;
        return [
          `À ${eur(r.prix)}, la demande égale les nuitées offertes : l'hôtel vend tout, au plus haut prix qui le permet. La hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} le dépassait de ${eur(auCentime(l.p.prixHaut - r.prix))} ; elle laissait des chambres vides pour ${eur(r.ecartAvecLaHausse)} de résultat en moins.`,
          "Ce calcul suppose de connaître la demande : l'hôtelier ne la connaît pas d'avance, il la lit dans le rythme des réservations. Mais il sait où viser : le prix qui remplit juste l'hôtel.",
        ];
      },
    },
    {
      id: "une-petite-baisse",
      objectifs: [4],
      type: "montants",
      titre: "Variante : une baisse plus petite",
      notions: ["price_elasticity", "occupancy_revpar"],
      si: (c) => prixSelonLaSaison(c).tropPeuDeVides.length > 0,
      question: (c) => {
        const p = prixSelonLaSaison(c);
        const v = p.petiteBaisse;
        return `Au ${rang(v.trimestre)} trimestre, une baisse de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ne pouvait pas payer. Et une baisse de ${EN_POURCENT(PETITE_BAISSE)}, à ${eur(v.prix)} ? La simulation donne ${qte(v.simulee.demande)} nuitées demandées à ce prix. Refaites le raisonnement : les nuitées qu'elle doit faire vendre en plus (à l'unité supérieure), celles qu'elle fait vendre, puis l'écart de résultat du trimestre avec le prix unique.`;
      },
      champs: (c) => {
        const p = prixSelonLaSaison(c);
        const v = p.petiteBaisse;
        const b = p.curseurDeLaBaisse;
        return [
          {
            libelle: "Nuitées à gagner, petite baisse",
            attendu: v.aGagner,
            calcul: `${qte(b.vendues)} × ${eur(v.parNuiteeVendue)} ÷ (${eur(v.prix)} − ${eur(p.f.coutVariableParNuitee)}) = ${qte(v.aGagner)}`,
            tolerance: 1,
          },
          {
            libelle: "Nuitées gagnées, petite baisse",
            attendu: v.gagnees,
            calcul: `${qte(v.simulee.vendues)} − ${qte(b.vendues)} = ${qte(v.gagnees)}, l'hôtel ne vendant pas plus de ${qte(p.offertes)} nuitées`,
          },
          {
            libelle: "Écart de résultat du trimestre, petite baisse",
            attendu: v.ecart,
            calcul: `(${eur(v.prix)} − ${eur(p.f.coutVariableParNuitee)}) × ${qte(v.simulee.vendues)} − (${eur(p.prixUnique)} − ${eur(p.f.coutVariableParNuitee)}) × ${qte(b.vendues)} = ${eur(v.ecart)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = prixSelonLaSaison(c);
        const v = p.petiteBaisse;
        return [
          v.ecart > 0
            ? `La petite baisse doit gagner ${qte(v.aGagner)} nuitées ; elle en gagne ${qte(v.gagnees)}, et le résultat du trimestre monte de ${eur(v.ecart)}. Là où ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} coûtait, ${EN_POURCENT(PETITE_BAISSE)} paie : le seuil dépend de la baisse, et la recette des ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} ne se recopie pas.`
            : `La petite baisse doit gagner ${qte(v.aGagner)} nuitées ; elle n'en gagne que ${qte(v.gagnees)} : même petite, elle coûte ${eur(-v.ecart)}.`,
        ];
      },
    },
    {
      id: "la-regle-des-15-pour-cent",
      objectifs: [3],
      type: "choix",
      titre: "Une règle à écrire ?",
      notions: ["occupancy_revpar", "price_elasticity"],
      question: () =>
        `Le directeur veut écrire la règle de l'hôtel : +${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} aux trimestres où des clients sont refusés, −${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} là où les chambres vides paient la baisse, rien ailleurs. Qu'en dites-vous ?`,
      options: (c) => {
        const l = laboratoireDesQuatrePrix(c);
        const p = l.p;
        const v = p.petiteBaisse;
        const r = l.anneeAuxPrixQuiRemplissent;
        return [
          {
            texte: "Un écart fixe rate le prix qui remplit juste l'hôtel",
            juste: r.resultat > p.remplissage.resultat,
            retour: `Oui. Au ${rang(l.aRebours.trimestre)} trimestre, ${eur(l.aRebours.prix)} rapportent plus que ${eur(p.prixHaut)} ; au ${rang(v.trimestre)}, une baisse de ${EN_POURCENT(PETITE_BAISSE)} paie quand celle de ${EN_POURCENT(BAISSE_EN_BASSE_SAISON)} coûtait. Aux prix qui remplissent juste l'hôtel, l'année rapporterait ${eur(r.resultat)}, contre ${eur(p.remplissage.resultat)} avec la règle. Dans la réalité, l'hôtelier ne connaît pas la demande d'avance : il suit les réservations, et ajuste au fil des semaines.`,
          },
          {
            texte: "Elle est la meilleure : elle suit ce qui reste à vendre",
            juste: false,
            retour: `Non : elle suit le sens, pas la mesure. Au laboratoire, des prix qui remplissent juste l'hôtel rapportent ${eur(r.resultat)} sur l'année, plus que les ${eur(p.remplissage.resultat)} de la règle.`,
          },
          {
            texte: "Il faut monter plus fort l'été : plus cher, c'est mieux",
            juste: false,
            retour: `Non : au-dessus du prix qui remplit juste l'hôtel, ${eur(l.aRebours.prix)}, chaque euro de plus fait partir des clients qui emportent leur marge. La hausse de ${EN_POURCENT(HAUSSE_EN_HAUTE_SAISON)} montait déjà trop haut.`,
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
        const ecart = (x: number) => (x >= 0 ? `${eur(x)} de résultat en plus` : `${eur(-x)} de résultat en moins`);
        return [
          `La demande ${dE(p.f.entreprise)} a sa saison : ${lesTrimestres(p.m.haute)} au-dessus de la moyenne, ${lesTrimestres(p.m.basse)} en dessous. Face au prix unique, le prix qui suit le seul calendrier a donné ${ecart(p.ecartSaison)} sur l'année ; le prix qui suit le remplissage, ${ecart(p.ecartRemplissage)}.`,
          "Remplir l'hôtel, ce n'est pas vendre au plus bas : c'est vendre chaque nuitée au meilleur prix que la demande accepte, monter quand l'hôtel refuse des clients, et ne baisser que là où assez de chambres resteraient vides pour payer la baisse. Le revenu par chambre disponible le mesure : il juge à la fois le remplissage et le prix.",
          `Et le bon écart n'est pas fixé d'avance : le meilleur prix d'un trimestre est ici celui qui remplit juste l'hôtel, ${eur(laboratoireDesQuatrePrix(c).aRebours.prix)} au ${rang(laboratoireDesQuatrePrix(c).aRebours.trimestre)} trimestre plutôt que ${eur(p.prixHaut)}.`,
          "Au niveau de l'examen, vous savez calculer des coefficients saisonniers et les trois indicateurs d'une année, chiffrer les nuitées qu'une baisse doit faire vendre et celles qu'une hausse peut perdre, retrouver à rebours le prix qui remplit juste l'hôtel, et dire pourquoi une règle d'écart fixe n'est pas l'optimum.",
          "Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Revenu par chambre disponible = chiffre d'affaires ÷ nuitées offertes = prix moyen × taux d'occupation. Le yield management fait varier le prix selon ce qui reste à vendre.",
    },
  ],
};
