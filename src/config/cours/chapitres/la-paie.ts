import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import { TAUX_DE_LA_PAIE } from "../monde/exercice-de-nova";
import { brutPourUnCoutEmployeur, brutPourUnNetAPayer, bulletinDePaie, coefficientDuBrutAuNet, type TauxDeLaPaie } from "../monde/paie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA PAIE (comptabilité générale, palier 3 ; BTS CG, DCG UE9, BUT GEA et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'effectif et
 * le brut de janvier sont ceux du cas figé de chaque entreprise (monde/cas-des-entreprises.ts, lus
 * par `c.personnel`), les taux sont ceux du cours (TAUX_DE_LA_PAIE, monde/exercice-de-nova.ts), et
 * le bulletin se calcule par le modèle du cours (monde/paie.ts : `bulletinDePaie`, et les calculs à
 * rebours `brutPourUnNetAPayer`, `brutPourUnCoutEmployeur`). Il se joue dans les neuf entreprises.
 *
 * L'objet : le même mois de janvier que le chapitre pilote, lu comme un bulletin. Un salarié demande
 * un acompte ; les cotisations se partagent entre l'URSSAF et la caisse de retraite complémentaire ;
 * l'impôt sur le revenu est prélevé à la source. L'élève passe chaque écriture, range ce qui coûte
 * et ce qui se retient, règle les trois destinataires le 15 février ; puis il remonte le bulletin à
 * l'envers : du net promis au brut, du budget de l'employeur au brut et au net.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, acompte, bulletin, paie, cotisations-patronales, qui-supporte,
 *     versement-salaires (les taux et les montants à prendre sont dans la question ou la pièce) ;
 *   · autonome : cout-du-personnel, fevrier, reglement-organismes (ni montant ni compte donnés ;
 *     la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-brut
 *     puis la-prime-au-curseur (la prime brute qui tient un net promis) avant du-net-au-brut ;
 *     predire-le-budget puis le-budget-au-curseur (le brut le plus haut qu'un budget de coût
 *     employeur permet) avant du-cout-au-net ;
 *   · expert : du-net-au-brut (calcul à rebours, du net à payer au brut et au coût de l'équipe),
 *     du-cout-au-net (calcul à rebours, du coût employeur au brut, puis au net), le laboratoire
 *     le-laboratoire-de-la-prime (prime brute, taux patronal, taux du prélèvement : un défi
 *     impossible au taux patronal plein, qui fait découvrir le levier des cotisations), et
 *     le-levier-de-l-employeur (la critique : le prélèvement à la source n'est pas un levier de
 *     l'employeur) ; puis la synthèse.
 *
 * Ce qui a disparu : la lecture de src/config/cours/paie.ts (le chapitre et son cas lisent le modèle
 * du monde), et les montants rappelés au règlement du 15 février. Les chiffres du bulletin de
 * janvier ne changent pas.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** Le jour où un salarié demande son acompte : la quinzaine déjà travaillée. */
export const JOUR_ACOMPTE = 15;

/**
 * L'ACOMPTE, hypothèse du cours : la moitié du net avant impôt moyen d'un salarié (la quinzaine),
 * arrondie à la centaine, et au moins 100 €. Chez NOVA, 700 € (la fiche de l'exercice dit le même).
 */
export const ACOMPTE_MINIMAL = 100;
export const ARRONDI_DE_L_ACOMPTE = 100;

/**
 * LE PREMIER CURSEUR : le gérant promet à chaque salarié une prime de 500 € nets, prélèvement à la
 * source retenu. Le curseur cherche la plus petite prime brute qui les verse.
 */
export const NET_PROMIS = 500;
export const BORNES_DE_LA_PRIME = { min: 500, max: 800 } as const;

/**
 * LE SECOND CURSEUR : un budget de 3 550 € par mois pour une embauche, en coût employeur (le brut et
 * les cotisations patronales). Le curseur cherche le brut le plus haut qu'il permet.
 */
export const BUDGET_D_UNE_EMBAUCHE = 3_550;
export const BORNES_DU_BRUT = { min: 2_000, max: 3_000 } as const;

/**
 * LE LABORATOIRE : une prime de 500 € bruts par salarié au départ ; le défi demande au moins 380 €
 * nets par salarié pour au plus 700 € de coût employeur par salarié. Au taux patronal du cours
 * (42 %), c'est impossible ; un allègement de cotisations patronales (le cours le porte sur la part
 * URSSAF, comme la réduction générale sur les bas salaires) ouvre la solution. Le taux du
 * prélèvement à la source est un levier pour voir, pas pour décider : l'administration le transmet.
 */
export const PRIME_BRUTE_DE_DEPART = 500;
export const NET_DU_DEFI = 380;
export const COUT_DU_DEFI = 700;
export const LEVIERS_DE_LA_PRIME = {
  prime: { min: 300, max: 800, pas: 5 },
  patronal: { min: 30, max: 42, pas: 0.5 },
  prelevement: { min: 0, max: 10, pas: 0.5 },
} as const;
/** L'allègement de la solution montrée : 2 points de cotisations patronales. */
export const ALLEGEMENT_DE_LA_SOLUTION = 2;

/** Les taux du cours (monde/exercice-de-nova.ts), les mêmes dans toutes les entreprises. */
const T = TAUX_DE_LA_PAIE;

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
/** Un taux sans bruit de calcul flottant (0,36 et non 0,35999999). */
const tauxPropre = (t: number) => Math.round(t * 1e6) / 1e6;
/** « de NOVA », « d'ATLAS CONSEIL » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le taux patronal du cours, en pourcentage (URSSAF et retraite réunies). */
export const TAUX_PATRONAL_EN_POURCENT = tauxPropre((T.patronalUrssaf + T.patronalRetraite) * 100);
/** Le taux du prélèvement à la source du cours, en pourcentage. */
export const PRELEVEMENT_EN_POURCENT = tauxPropre(T.prelevementALaSource * 100);

/**
 * Les taux du cours avec un taux patronal et un taux de prélèvement donnés, en pourcentage (le
 * laboratoire) : l'allègement porte sur la part URSSAF, la part de retraite ne bouge pas.
 */
export function tauxAvec(patronalEnPourcent: number, prelevementEnPourcent: number): TauxDeLaPaie {
  return { ...T, patronalUrssaf: tauxPropre(patronalEnPourcent / 100 - T.patronalRetraite), prelevementALaSource: tauxPropre(prelevementEnPourcent / 100) };
}

/** La paie de janvier de l'entreprise : le bulletin récapitulatif, l'acompte et les dates. */
export function paieDeJanvier(c: Pick<Cas, "personnel">) {
  const p = c.personnel;
  const netAvantImpotMoyen = (p.brut * (1 - T.salarialUrssaf - T.salarialRetraite)) / p.effectif;
  const acompte = Math.max(ACOMPTE_MINIMAL, Math.round(netAvantImpotMoyen / 2 / ARRONDI_DE_L_ACOMPTE) * ARRONDI_DE_L_ACOMPTE);
  const b = bulletinDePaie(p.brut, T, acompte);
  return {
    effectif: p.effectif,
    brut: p.brut,
    date: p.date,
    dateUrssaf: p.dateUrssaf,
    jourAcompte: JOUR_ACOMPTE,
    acompte,
    b,
    /** Ce que la paie fait sortir de la banque, en trois fois : l'acompte, le net, les organismes et l'État. */
    sortiesDeBanque: auCentime(acompte + b.netAPayer + b.aVerser.total),
  };
}

/** La prime, l'embauche et le laboratoire : les calculs à rebours du chapitre, pour une équipe. */
export function paieARebours(c: Pick<Cas, "personnel">) {
  const effectif = c.personnel.effectif;
  const k = coefficientDuBrutAuNet(T);
  const tauxSalarial = tauxPropre(T.salarialUrssaf + T.salarialRetraite);
  const tauxPatronal = tauxPropre(T.patronalUrssaf + T.patronalRetraite);
  // Le net pour 100 € bruts, pas à pas : ce que la correction montre.
  const cotisationsPour100 = auCentime(100 * tauxSalarial);
  const netAvantImpotPour100 = auCentime(100 - cotisationsPour100);
  const csgPour100 = auCentime(100 * T.assietteDeLaCsg * T.csgCrdsNonDeductible);
  const imposablePour100 = auCentime(netAvantImpotPour100 + csgPour100);
  const prelevementPour100 = auCentime(imposablePour100 * T.prelevementALaSource);
  const netPour100 = auCentime(netAvantImpotPour100 - prelevementPour100);
  // Le premier curseur : la plus petite prime brute, à l'euro, dont la droite verse le net promis.
  const primeAuCurseur = Math.ceil(NET_PROMIS / k - 1e-9);
  const bulletinAuCurseur = bulletinDePaie(primeAuCurseur, T);
  const bulletinSousLeCurseur = bulletinDePaie(primeAuCurseur - 1, T);
  // Le même calcul, au centime : le plus petit brut dont le bulletin verse le net promis.
  const primeBrute = brutPourUnNetAPayer(NET_PROMIS, T);
  const bulletinDeLaPrime = bulletinDePaie(primeBrute, T);
  const coutDUnePrime = bulletinDeLaPrime.coutEmployeur;
  const coutDesPrimes = auCentime(coutDUnePrime * effectif);
  // Les paris : les erreurs que font les étudiants.
  const sansLePrelevement = auCentime(NET_PROMIS / (1 - tauxSalarial));
  const tauxSurLeNet = auCentime(NET_PROMIS * (1 + tauxSalarial));
  // Le second curseur et l'embauche : le brut que permet le budget, puis le net du salarié.
  const brutAuCurseur = Math.floor(BUDGET_D_UNE_EMBAUCHE / (1 + tauxPatronal) + 1e-9);
  const brutDeLEmbauche = brutPourUnCoutEmployeur(BUDGET_D_UNE_EMBAUCHE, T);
  const embauche = bulletinDePaie(brutDeLEmbauche, T);
  const budgetMoinsLeTaux = auCentime(BUDGET_D_UNE_EMBAUCHE * (1 - tauxPatronal));
  const budgetSurLesDeuxTaux = auCentime(BUDGET_D_UNE_EMBAUCHE / (1 + tauxPatronal + tauxSalarial));
  // Le laboratoire : au taux patronal plein, le brut le plus bas qui verse le net du défi, et le plus haut que permet son coût.
  const brutMinimalDuDefi = brutPourUnNetAPayer(NET_DU_DEFI, T);
  const brutMaximalDuDefi = brutPourUnCoutEmployeur(COUT_DU_DEFI, T);
  return {
    effectif,
    k,
    tauxSalarial,
    tauxPatronal,
    netPour100,
    cotisationsPour100,
    netAvantImpotPour100,
    csgPour100,
    imposablePour100,
    prelevementPour100,
    primeAuCurseur,
    bulletinAuCurseur,
    bulletinSousLeCurseur,
    primeBrute,
    bulletinDeLaPrime,
    coutDUnePrime,
    coutDesPrimes,
    sansLePrelevement,
    tauxSurLeNet,
    brutAuCurseur,
    brutDeLEmbauche,
    embauche,
    budgetMoinsLeTaux,
    budgetSurLesDeuxTaux,
    brutMinimalDuDefi,
    brutMaximalDuDefi,
    coutMinimalDuDefi: bulletinDePaie(brutMinimalDuDefi, T).coutEmployeur,
  };
}

/** Le bulletin d'une prime au laboratoire, pour une position des leviers (par salarié, puis pour l'équipe). */
export function laboratoireDeLaPrime(c: Pick<Cas, "personnel">, p: Readonly<Record<string, number>>) {
  const b = bulletinDePaie(p.prime!, tauxAvec(p.patronal!, p.prelevement!));
  return {
    cotisationsSalariales: b.cotisationsSalariales.total,
    prelevement: b.prelevementALaSource,
    net: b.netAPayer,
    cotisationsPatronales: b.cotisationsPatronales.total,
    cout: b.coutEmployeur,
    coutDeLEquipe: auCentime(b.coutEmployeur * c.personnel.effectif),
  };
}

/** La position du laboratoire au départ : la prime de 500 € bruts, aux taux du cours. */
export const DEPART_DU_LABORATOIRE = { prime: PRIME_BRUTE_DE_DEPART, patronal: TAUX_PATRONAL_EN_POURCENT, prelevement: PRELEVEMENT_EN_POURCENT } as const;

export const LA_PAIE: Chapitre = {
  code: "la-paie",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P4 · Gestion des relations sociales",
    "DCG UE9 · Comptabilité",
    "Bac pro AGORA Bloc 3 · Administrer le personnel",
    "BTS SAM Bloc 3 · Collaboration à la gestion des ressources humaines",
    "BUT GACO · Participer au pilotage RH de l'organisation",
    "BUT GEA · Gérer l'administration du personnel",
  ],
  titre: "La paie",
  accroche:
    "Le bulletin de paie ligne par ligne, puis à l'envers : l'acompte, les cotisations organisme par organisme, le prélèvement à la source, le brut qu'il faut pour un net promis, et ce qu'un budget d'embauche permet d'offrir.",
  objectifs: [
    "Lire un bulletin de paie : brut, cotisations, net avant impôt, prélèvement à la source, net à payer",
    "Enregistrer un acompte, puis le reprendre sur la paie",
    "Répartir les cotisations entre l'URSSAF et la caisse de retraite complémentaire, et les régler",
    "Distinguer ce qui coûte à l'entreprise de ce qui se retient sur le salaire",
    "Remonter du net au brut, et d'un coût employeur au brut et au net",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Derrière le salaire",
      notions: ["payroll", "fixed_costs"],
      texte: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. En janvier, les ${qte(p.effectif)} salariés ${dE(c.entreprise)} ont gagné ${eur(p.brut)} bruts. Le premier chapitre a passé la paie en trois écritures : les salaires, les cotisations patronales, le virement du net.`,
          "Un bulletin de paie en dit plus. Les cotisations ne vont pas toutes au même endroit : l'URSSAF recouvre la sécurité sociale, la CSG et l'assurance chômage ; la caisse de retraite complémentaire perçoit sa part. L'impôt sur le revenu du salarié est prélevé par l'employeur, qui le reverse à l'État. Et un salarié peut avoir reçu un acompte en cours de mois.",
          `Ce que la simulation suppose : des taux d'un salarié non cadre, les mêmes dans toutes les entreprises du cours (${pct(T.salarialUrssaf + T.salarialRetraite)} de cotisations salariales, ${pct(T.patronalUrssaf + T.patronalRetraite)} de cotisations patronales) ; un taux moyen de prélèvement à la source de ${pct(T.prelevementALaSource)} pour l'équipe ; un acompte égal à la quinzaine d'un salarié, arrondi à la centaine. Un vrai bulletin compte aussi la prévoyance, la mutuelle et des plafonds ; le cours s'en passe.`,
          "Ce chapitre ne suit que la paie : le journal ne porte que ses écritures, et la banque n'y montre que ce que la paie fait sortir. Ensuite, vous remonterez le bulletin à l'envers.",
        ];
      },
      repere: () =>
        "L'entreprise est un intermédiaire : elle retient sur le salaire ce que le salarié doit aux organismes et à l'État, et le leur reverse. Seuls le brut et les cotisations patronales sont ses charges.",
    },
    {
      id: "acompte",
      objectifs: [1],
      type: "ecriture",
      titre: "L'acompte du 15 janvier",
      notions: ["payment_terms", "payroll"],
      evenement: (c) => {
        const p = paieDeJanvier(c);
        return `Le ${date(p.jourAcompte)}, un salarié demande un acompte sur son salaire de janvier, pour la quinzaine déjà travaillée. ${c.entreprise} lui vire ${eur(p.acompte)}.`;
      },
      ecriture: (c) => {
        const p = paieDeJanvier(c);
        return {
          date: date(p.jourAcompte),
          libelle: "Acompte sur salaire de janvier",
          lignes: [
            { role: "l'avance faite au salarié", compte: "425", sens: "debit", montant: p.acompte, indice: "le montant de l'acompte" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.acompte, indice: "le montant de l'acompte" },
          ],
        };
      },
      indices: () => [
        "Ce n'est pas encore une charge : le salaire de janvier n'est pas arrêté. L'entreprise avance de l'argent au salarié, qui le lui doit en attendant : une créance sur le personnel, en classe 4.",
        "Le compte des avances et acomptes au personnel est voisin de celui des rémunérations dues : 42.",
      ],
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `L'acompte de ${eur(p.acompte)} est une créance sur le salarié, au débit du 425. Il ne coûte rien de plus : il sera retenu sur le salaire de fin de mois, qui en sera diminué d'autant.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "bulletin",
      objectifs: [0],
      type: "montants",
      titre: "Le bulletin de janvier",
      notions: ["payroll", "fixed_costs"],
      question: (c) => {
        const p = paieDeJanvier(c);
        return `Le récapitulatif des bulletins de janvier : ${eur(p.brut)} bruts. Cotisations salariales : URSSAF ${pct(T.salarialUrssaf)} du brut, retraite complémentaire ${pct(T.salarialRetraite)}. Le net imposable, calculé par le logiciel de paie, est de ${eur(p.b.netImposable)}, et le taux moyen de prélèvement à la source transmis par l'administration est de ${pct(T.prelevementALaSource)}. Calculez le bulletin jusqu'au net à payer, sans oublier l'acompte de ${eur(p.acompte)} déjà versé.`;
      },
      champs: (c) => {
        const p = paieDeJanvier(c);
        const b = p.b;
        return [
          { libelle: "Cotisations salariales URSSAF", attendu: b.cotisationsSalariales.urssaf, calcul: `${eur(p.brut)} × ${pct(T.salarialUrssaf)} = ${eur(b.cotisationsSalariales.urssaf)}` },
          { libelle: "Cotisations salariales de retraite complémentaire", attendu: b.cotisationsSalariales.retraite, calcul: `${eur(p.brut)} × ${pct(T.salarialRetraite)} = ${eur(b.cotisationsSalariales.retraite)}` },
          {
            libelle: "Net avant impôt",
            attendu: b.netAvantImpot,
            calcul: `${eur(p.brut)} − ${eur(b.cotisationsSalariales.urssaf)} − ${eur(b.cotisationsSalariales.retraite)} = ${eur(b.netAvantImpot)}`,
          },
          { libelle: "Prélèvement à la source", attendu: b.prelevementALaSource, calcul: `${eur(b.netImposable)} × ${pct(T.prelevementALaSource)} = ${eur(b.prelevementALaSource)}` },
          {
            libelle: "Net à payer en fin de mois",
            attendu: b.netAPayer,
            calcul: `${eur(b.netAvantImpot)} − ${eur(b.prelevementALaSource)} − ${eur(p.acompte)} = ${eur(b.netAPayer)}`,
          },
        ];
      },
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Le net imposable (${eur(p.b.netImposable)}) dépasse le net avant impôt (${eur(p.b.netAvantImpot)}) : une part de la CSG et la CRDS, ${eur(p.b.csgCrdsNonDeductible)}, sont retenues sur le salaire mais l'impôt ne les déduit pas. Le prélèvement se calcule donc sur un peu plus que ce que le salarié touche.`,
          "Le prélèvement à la source n'est pas une cotisation : c'est l'impôt du salarié, que l'entreprise collecte pour l'État. L'acompte, lui, a déjà été versé : il se retranche du net.",
        ];
      },
    },
    {
      id: "paie",
      objectifs: [0],
      type: "ecriture",
      titre: "La paie de janvier",
      notions: ["payroll", "fixed_costs"],
      evenement: (c) => {
        const p = paieDeJanvier(c);
        return `Le ${date(p.date)}, le journal de paie de janvier est arrêté. Passez l'écriture des salaires : le brut, et chacun de ceux à qui il revient.`;
      },
      piece: (c) => {
        const p = paieDeJanvier(c);
        const b = p.b;
        return {
          nature: "Journal de paie de janvier",
          de: c.entreprise,
          a: `Ses ${qte(p.effectif)} salariés`,
          date: date(p.date),
          lignes: [
            { libelle: "Salaires bruts", montant: p.brut },
            { libelle: `Cotisations salariales URSSAF (${pct(T.salarialUrssaf)})`, montant: b.cotisationsSalariales.urssaf },
            { libelle: `Cotisations salariales de retraite complémentaire (${pct(T.salarialRetraite)})`, montant: b.cotisationsSalariales.retraite },
            { libelle: `Prélèvement à la source (${pct(T.prelevementALaSource)} du net imposable)`, montant: b.prelevementALaSource },
            { libelle: `Acompte versé le ${date(p.jourAcompte)}`, montant: p.acompte },
          ],
          totaux: [
            { libelle: "Net avant impôt", montant: b.netAvantImpot },
            { libelle: "Net à payer", montant: b.netAPayer, fort: true },
          ],
        };
      },
      ecriture: (c) => {
        const p = paieDeJanvier(c);
        const b = p.b;
        return {
          date: date(p.date),
          libelle: "Salaires de janvier",
          lignes: [
            { role: "les salaires bruts", compte: "641", sens: "debit", montant: p.brut, indice: "le total des salaires bruts" },
            { role: "les cotisations salariales dues à l'URSSAF", compte: "431", sens: "credit", montant: b.cotisationsSalariales.urssaf, indice: "la part URSSAF retenue sur le brut" },
            { role: "les cotisations salariales dues à la caisse de retraite", compte: "437", sens: "credit", montant: b.cotisationsSalariales.retraite, indice: "la part de retraite complémentaire retenue sur le brut" },
            { role: "l'impôt prélevé à la source, dû à l'État", compte: "442", sens: "credit", montant: b.prelevementALaSource, indice: "le prélèvement à la source du bulletin" },
            { role: "l'acompte repris sur le salaire", compte: "425", sens: "credit", montant: p.acompte, indice: "l'acompte du 15 janvier" },
            { role: "le net à payer aux salariés", compte: "421", sens: "credit", montant: b.netAPayer, indice: "le net à payer en fin de mois" },
          ],
        };
      },
      indices: () => [
        "Une seule ligne au débit : la charge, le salaire brut. Tout le reste est au crédit : ce que l'entreprise doit, et à qui.",
        "Au crédit : l'URSSAF (431), la caisse de retraite (437, les autres organismes sociaux), l'État pour l'impôt prélevé (442), les salariés pour le net (421), et l'acompte, qui solde la créance du 425.",
      ],
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `La charge reste le brut, ${eur(p.brut)}, au débit du 641, comme dans le premier chapitre. Ce qui change, c'est le crédit : cinq destinataires au lieu de deux.`,
          `L'acompte est repris au crédit du 425 : la créance sur le salarié est soldée, et il ne reste à virer aux salariés que ${eur(p.b.netAPayer)} au total.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "cotisations-patronales",
      objectifs: [2],
      type: "ecriture",
      titre: "Les cotisations patronales",
      notions: ["payroll", "fixed_costs"],
      evenement: (c) => {
        const p = paieDeJanvier(c);
        return `Le même jour, l'entreprise enregistre ses propres cotisations sur les salaires de janvier : URSSAF ${pct(T.patronalUrssaf)} du brut, soit ${eur(p.b.cotisationsPatronales.urssaf)}, et retraite complémentaire ${pct(T.patronalRetraite)}, soit ${eur(p.b.cotisationsPatronales.retraite)}.`;
      },
      ecriture: (c) => {
        const p = paieDeJanvier(c);
        const b = p.b;
        return {
          date: date(p.date),
          libelle: "Cotisations patronales de janvier",
          lignes: [
            { role: "les cotisations patronales", compte: "645", sens: "debit", montant: b.cotisationsPatronales.total, indice: "les deux parts patronales réunies" },
            { role: "la part due à l'URSSAF", compte: "431", sens: "credit", montant: b.cotisationsPatronales.urssaf, indice: "la part patronale URSSAF" },
            { role: "la part due à la caisse de retraite", compte: "437", sens: "credit", montant: b.cotisationsPatronales.retraite, indice: "la part patronale de retraite complémentaire" },
          ],
        };
      },
      indices: () => [
        "Une charge de l'entreprise, à côté des salaires : les charges de sécurité sociale et de prévoyance, en un seul montant au débit.",
        "Au crédit, deux dettes : l'URSSAF et la caisse de retraite, chacune pour sa part.",
      ],
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `${eur(p.b.cotisationsPatronales.total)} de charges en plus du brut, au débit du 645. Les comptes 431 et 437 réunissent maintenant les parts salariales et patronales : l'URSSAF attend ${eur(p.b.aVerser.urssaf)}, la caisse de retraite ${eur(p.b.aVerser.retraite)}.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "qui-supporte",
      objectifs: [3],
      type: "tri",
      titre: "Qui supporte quoi",
      notions: ["payroll", "fixed_costs"],
      question: () => "Chaque montant de la paie, rangez-le : une charge que l'entreprise paie en plus du salaire, ou une somme retenue sur le salaire du salarié.",
      categories: [
        { code: "charge", libelle: "À la charge de l'entreprise" },
        { code: "retenue", libelle: "Retenu sur le salaire" },
      ],
      elements: (c) => {
        const p = paieDeJanvier(c);
        const b = p.b;
        return [
          { libelle: "Cotisations salariales URSSAF", montant: b.cotisationsSalariales.urssaf, categorie: "retenue", pourquoi: "Salariales : elles se prennent sur le brut, l'entreprise ne fait que les reverser." },
          { libelle: "Cotisations patronales URSSAF", montant: b.cotisationsPatronales.urssaf, categorie: "charge", pourquoi: "Patronales : l'entreprise les paie en plus du brut, compte 645." },
          { libelle: "Prélèvement à la source", montant: b.prelevementALaSource, categorie: "retenue", pourquoi: "C'est l'impôt du salarié : l'entreprise le collecte pour l'État, il ne lui coûte rien." },
          { libelle: "Retraite complémentaire, part patronale", montant: b.cotisationsPatronales.retraite, categorie: "charge", pourquoi: "Patronale : une charge de l'entreprise, en plus du brut." },
          { libelle: "Acompte du 15 janvier", montant: p.acompte, categorie: "retenue", pourquoi: "Le salarié l'a déjà reçu : il se retient sur ce qui lui reste dû." },
          { libelle: "Retraite complémentaire, part salariale", montant: b.cotisationsSalariales.retraite, categorie: "retenue", pourquoi: "Salariale : elle se prend sur le brut." },
        ];
      },
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Retenu sur le salaire : ${eur(auCentime(p.brut - p.b.netAPayer))}, soit l'écart entre le brut (${eur(p.brut)}) et le net à payer (${eur(p.b.netAPayer)}). Rien de tout cela n'est une charge de plus pour l'entreprise : c'est une part du brut qu'elle verse à d'autres que le salarié.`,
          `En plus du salaire : ${eur(p.b.cotisationsPatronales.total)} de cotisations patronales. C'est la seule charge que la paie ajoute au brut.`,
        ];
      },
    },
    {
      id: "versement-salaires",
      objectifs: [1],
      type: "ecriture",
      titre: "Le versement des salaires",
      notions: ["payment_terms", "payroll"],
      evenement: (c) => {
        const p = paieDeJanvier(c);
        return `Le ${date(p.date)}, ${c.entreprise} vire aux salariés leur net à payer : ${eur(p.b.netAPayer)}.`;
      },
      ecriture: (c) => {
        const p = paieDeJanvier(c);
        return {
          date: date(p.date),
          libelle: "Virement des salaires nets",
          lignes: [
            { role: "la dette envers les salariés qui s'éteint", compte: "421", sens: "debit", montant: p.b.netAPayer, indice: "le net à payer" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.b.netAPayer, indice: "le net à payer" },
          ],
        };
      },
      indices: () => ["La dette envers les salariés disparaît : le compte 421 passe au débit.", "La banque paie."],
      explication: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Les salariés sont payés : ${eur(p.acompte)} le ${date(p.jourAcompte)}, ${eur(p.b.netAPayer)} aujourd'hui. Restent dus l'URSSAF, la caisse de retraite et l'État, jusqu'au ${date(p.dateUrssaf)}.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "cout-du-personnel",
      objectifs: [3],
      type: "choix",
      titre: "Le coût du personnel",
      notions: ["fixed_costs", "income_statement", "payroll"],
      question: (c) => `Que coûte le personnel de janvier à ${c.entreprise}, dans son compte de résultat ?`,
      options: (c) => {
        const p = paieDeJanvier(c);
        return [
          {
            texte: `${eur(p.b.verseAuxSalaries)} : ce que les salariés ont reçu, acompte compris.`,
            juste: false,
            retour: "C'est ce que la banque leur a versé. L'entreprise paie aussi, pour eux, les cotisations salariales et l'impôt prélevé, puis ses propres cotisations.",
          },
          {
            texte: `${eur(auCentime(p.b.coutEmployeur + p.b.prelevementALaSource))} : le brut, les cotisations patronales et le prélèvement à la source.`,
            juste: false,
            retour: "Le prélèvement à la source fait déjà partie du brut : c'est l'impôt du salarié, retenu sur son salaire. Le compter en plus le compterait deux fois.",
          },
          {
            texte: `${eur(p.b.coutEmployeur)} : le brut et les cotisations patronales.`,
            juste: true,
            retour: "C'est cela : 641 et 645 réunis, le même coût que dans le premier chapitre. Le détail du bulletin change à qui l'argent va, pas ce que le personnel coûte.",
          },
        ];
      },
      vue: "resultat",
    },
    {
      id: "fevrier",
      type: "lecture",
      titre: "Le 15 février",
      notions: ["payment_terms", "payroll"],
      texte: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Chaque mois, l'entreprise déclare la paie du mois précédent dans une seule déclaration, la déclaration sociale nominative (DSN). Pour une entreprise de moins de cinquante salariés, elle se dépose au plus tard le ${date(p.dateUrssaf)}, et les cotisations se paient à cette échéance.`,
          "L'administration fiscale prélève l'impôt retenu quelques jours après la déclaration ; le cours le règle le même jour que les cotisations, pour n'en faire qu'une écriture. Ce que chacun attend, vous le lirez dans les comptes de la paie.",
        ];
      },
    },
    {
      id: "reglement-organismes",
      objectifs: [2],
      type: "ecriture",
      titre: "Les organismes et l'État sont payés",
      notions: ["payment_terms", "payroll"],
      evenement: (c) => {
        const p = paieDeJanvier(c);
        return `Le ${date(p.dateUrssaf)}, ${c.entreprise} règle tout ce que la paie de janvier laissait à payer, à l'URSSAF, à la caisse de retraite complémentaire et à l'État. Les montants ne sont pas rappelés : lisez-les dans les comptes de la paie.`;
      },
      ecriture: (c) => {
        const v = paieDeJanvier(c).b.aVerser;
        return {
          date: date(paieDeJanvier(c).dateUrssaf),
          libelle: "Cotisations et prélèvement à la source de janvier",
          lignes: [
            { role: "la dette envers l'URSSAF qui s'éteint", compte: "431", sens: "debit", montant: v.urssaf, indice: "les parts salariale et patronale URSSAF réunies" },
            { role: "la dette envers la caisse de retraite qui s'éteint", compte: "437", sens: "debit", montant: v.retraite, indice: "les deux parts de retraite complémentaire réunies" },
            { role: "la dette envers l'État qui s'éteint", compte: "442", sens: "debit", montant: v.etat, indice: "le prélèvement à la source de janvier" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: v.total, indice: "les trois dettes réunies" },
          ],
        };
      },
      indices: () => [
        "Trois dettes s'éteignent : chacune passe au débit, pour le solde qu'elle porte.",
        "Une seule sortie de banque, au crédit, pour le total.",
      ],
      explication: (c) => {
        const p = paieDeJanvier(c);
        const v = p.b.aVerser;
        return [
          `L'URSSAF reçoit ${eur(v.urssaf)}, la caisse de retraite ${eur(v.retraite)}, l'État ${eur(v.etat)} : ${eur(v.total)} en tout. Les comptes de la paie sont soldés.`,
          `La paie de janvier a fait sortir de la banque ${eur(p.sortiesDeBanque)} : le brut et les cotisations patronales, en trois fois et à quatre destinataires.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "predire-le-brut",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la prime brute",
      notions: ["payroll"],
      question: () =>
        `Le gérant veut que chaque salarié touche ${eur(NET_PROMIS)} nets de prime en février, prélèvement à la source retenu. Avant de calculer, pariez : la prime brute à prévoir pour un salarié est…`,
      options: (c) => {
        const x = paieARebours(c);
        const voir = "Déplacez le curseur à l'étape suivante : il montre le net que touche le salarié pour chaque prime brute.";
        return [
          {
            texte: `Un peu plus de ${eur(x.sansLePrelevement)} : il faut aussi couvrir le prélèvement à la source`,
            juste: x.primeBrute > x.sansLePrelevement,
            retour: `Bon pari. ${voir}`,
          },
          { texte: `${eur(x.tauxSurLeNet)} : le net plus ${pct(x.tauxSalarial)} de cotisations`, juste: x.primeBrute === x.tauxSurLeNet, retour: `Pari à vérifier. ${voir}` },
          {
            texte: `${eur(x.sansLePrelevement)} exactement : le net divisé par ${pct(1 - x.tauxSalarial)}`,
            juste: x.primeBrute === x.sansLePrelevement,
            retour: `Pari à vérifier. ${voir}`,
          },
        ];
      },
    },
    {
      id: "la-prime-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Du net promis au brut, au curseur",
      notions: ["payroll"],
      question: () =>
        `Déplacez le curseur sur la prime brute d'un salarié, de ${eur(BORNES_DE_LA_PRIME.min)} à ${eur(BORNES_DE_LA_PRIME.max)}. Une droite donne le net qu'il touche, cotisations salariales et prélèvement à la source retenus ; l'autre, le net promis, ${eur(NET_PROMIS)}. Placez le curseur sur la plus petite prime brute qui tient la promesse, puis validez.`,
      grandeur: () => ({ libelle: "Prime brute par salarié", unite: "€" }),
      cible: (c) => ({ attendu: paieARebours(c).primeAuCurseur, min: BORNES_DE_LA_PRIME.min, max: BORNES_DE_LA_PRIME.max }),
      zones: ["Promesse tenue", "Promesse manquée"],
      rates: () => ({
        dessous: `À cette position, le salarié touche moins que les ${eur(NET_PROMIS)} promis : la prime brute doit monter.`,
        dessus: "Plus bas, la promesse tient encore : cherchez la plus petite prime brute.",
      }),
      montrer: "Montrer la prime brute",
      lecture: (_c, b) => {
        const x = bulletinDePaie(b, T);
        return [
          { libelle: "Cotisations salariales", montant: x.cotisationsSalariales.total },
          { libelle: "Prélèvement à la source", montant: x.prelevementALaSource },
          { libelle: "Net touché par le salarié", montant: x.netAPayer, fort: true },
          { libelle: "Coût de la prime pour l'entreprise", montant: x.coutEmployeur },
        ];
      },
      droites: (c) => {
        const x = paieARebours(c);
        return {
          produit: (b) => x.k * b,
          cout: () => NET_PROMIS,
          libelles: ["Net touché par le salarié", "Net promis"],
        };
      },
      explication: (c) => {
        const x = paieARebours(c);
        return [
          `Le net touché suit la prime brute : ${eur(x.netPour100)} pour ${eur(100)} bruts. À ${eur(x.primeAuCurseur)} bruts, le salarié touche ${eur(x.bulletinAuCurseur.netAPayer)} ; à ${eur(x.primeAuCurseur - 1)}, ${eur(x.bulletinSousLeCurseur.netAPayer)}. Diviser le net par ${pct(1 - x.tauxSalarial)} ne suffisait pas : le prélèvement se prend aussi sur le brut.`,
          `Et la prime coûte à l'entreprise ${eur(x.bulletinAuCurseur.coutEmployeur)}, les cotisations patronales en plus, pour ${eur(NET_PROMIS)} nets promis. L'étape suivante refait ce calcul au centime.`,
        ];
      },
    },
    {
      id: "du-net-au-brut",
      objectifs: [4],
      type: "montants",
      titre: "Du net au brut, au centime",
      notions: ["payroll", "fixed_costs"],
      question: (c) =>
        `Sans formule cette fois. Trouvez ce qu'un salarié touche net pour ${eur(100)} bruts, la prime brute qui lui verse les ${eur(NET_PROMIS)} promis, puis ce que coûtent à ${c.entreprise} les primes de ses ${qte(c.personnel.effectif)} salariés.`,
      champs: (c) => {
        const x = paieARebours(c);
        return [
          {
            libelle: `Net touché pour ${eur(100)} bruts`,
            attendu: x.netPour100,
            calcul: `${eur(100)} − ${eur(x.cotisationsPour100)} de cotisations salariales = ${eur(x.netAvantImpotPour100)} de net avant impôt ; net imposable ${eur(x.netAvantImpotPour100)} + ${eur(100)} × ${pct(T.assietteDeLaCsg)} × ${pct(T.csgCrdsNonDeductible)} = ${eur(x.imposablePour100)} ; prélèvement ${eur(x.imposablePour100)} × ${pct(T.prelevementALaSource)} = ${eur(x.prelevementPour100)} ; ${eur(x.netAvantImpotPour100)} − ${eur(x.prelevementPour100)} = ${eur(x.netPour100)}`,
          },
          {
            libelle: "Prime brute par salarié",
            attendu: x.primeBrute,
            tolerance: 0.05,
            calcul: `${eur(NET_PROMIS)} ÷ ${qte(x.netPour100)} % = ${eur(auCentime(NET_PROMIS / (x.netPour100 / 100)))} ; au centime près, le bulletin de ${eur(x.primeBrute)} verse déjà ${eur(x.bulletinDeLaPrime.netAPayer)}`,
          },
          {
            libelle: "Coût employeur des primes de l'équipe",
            attendu: x.coutDesPrimes,
            tolerance: auCentime(Math.max(0.05, 0.05 * (1 + x.tauxPatronal) * x.effectif)),
            calcul: `${eur(x.primeBrute)} × (1 + ${pct(x.tauxPatronal)}) = ${eur(x.coutDUnePrime)} par salarié ; × ${qte(x.effectif)} salariés = ${eur(x.coutDesPrimes)}`,
          },
        ];
      },
      explication: (c) => {
        const x = paieARebours(c);
        return [
          `Remonter du net au brut, c'est diviser par ce qu'un euro brut laisse au salarié, ${qte(x.netPour100)} % ici, et non par ${pct(1 - x.tauxSalarial)} : le prélèvement à la source se prend aussi, et sur un net imposable un peu plus haut que le net. Le curseur, à l'euro, trouvait ${eur(x.primeAuCurseur)} ; au centime, ${eur(x.primeBrute)}.`,
          `Pour ${eur(auCentime(NET_PROMIS * x.effectif))} nets promis à l'équipe, ${c.entreprise} engage ${eur(x.coutDesPrimes)} : ${qte(auCentime(x.coutDUnePrime / NET_PROMIS))} fois le net. C'est ce rapport qu'un gérant doit avoir en tête avant d'annoncer une prime en net.`,
        ];
      },
    },
    {
      id: "predire-le-budget",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le brut d'une embauche",
      notions: ["payroll", "fixed_costs"],
      question: (c) =>
        `${c.entreprise} prévoit un budget de ${eur(BUDGET_D_UNE_EMBAUCHE)} par mois pour une embauche : le salaire brut et les cotisations patronales. Avant de calculer, pariez : le brut le plus haut qu'elle peut offrir est…`,
      options: (c) => {
        const x = paieARebours(c);
        const voir = "Faites varier le brut à l'étape suivante : le curseur montre le coût employeur de chaque salaire.";
        return [
          { texte: `${eur(x.budgetMoinsLeTaux)} : le budget moins ${pct(x.tauxPatronal)}`, juste: x.brutDeLEmbauche === x.budgetMoinsLeTaux, retour: `Pari à vérifier. ${voir}` },
          { texte: `${eur(x.brutDeLEmbauche)} : le budget divisé par ${qte(auCentime(1 + x.tauxPatronal))}`, juste: true, retour: `Bon pari. ${voir}` },
          {
            texte: `${eur(x.budgetSurLesDeuxTaux)} : le budget divisé par ${qte(auCentime(1 + x.tauxPatronal + x.tauxSalarial))}, les deux parts de cotisations`,
            juste: x.brutDeLEmbauche === x.budgetSurLesDeuxTaux,
            retour: `Pari à vérifier. ${voir}`,
          },
        ];
      },
    },
    {
      id: "le-budget-au-curseur",
      objectifs: [4],
      type: "curseur",
      titre: "Le brut qu'un budget permet",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Faites varier le salaire brut mensuel de l'embauche, de ${eur(BORNES_DU_BRUT.min)} à ${eur(BORNES_DU_BRUT.max)}. Une droite donne le budget, ${eur(BUDGET_D_UNE_EMBAUCHE)} ; l'autre, ce que le salaire coûte, cotisations patronales comprises. Placez le curseur sur le brut le plus haut qui tient dans le budget, puis validez.`,
      grandeur: () => ({ libelle: "Salaire brut mensuel", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: paieARebours(c).brutAuCurseur, min: BORNES_DU_BRUT.min, max: BORNES_DU_BRUT.max }),
      zones: ["Dans le budget", "Au-delà du budget"],
      rates: () => ({
        dessous: "Le budget permet encore un brut plus haut : cherchez le plus haut.",
        dessus: "À cette position, le salaire coûte déjà plus que le budget.",
      }),
      montrer: "Montrer le brut",
      lecture: (_c, b) => {
        const x = bulletinDePaie(b, T);
        return [
          { libelle: "Cotisations patronales", montant: x.cotisationsPatronales.total },
          { libelle: "Coût employeur", montant: x.coutEmployeur, fort: true },
          { libelle: "Net avant impôt du salarié", montant: x.netAvantImpot },
          { libelle: "Net à payer au salarié", montant: x.netAPayer },
        ];
      },
      droites: (c) => {
        const x = paieARebours(c);
        return {
          produit: () => BUDGET_D_UNE_EMBAUCHE,
          cout: (b) => b * (1 + x.tauxPatronal),
          libelles: ["Budget de l'embauche", "Coût employeur du salaire"],
        };
      },
      explication: (c) => {
        const x = paieARebours(c);
        return [
          `À ${eur(x.brutAuCurseur)} bruts, le salaire coûte ${eur(bulletinDePaie(x.brutAuCurseur, T).coutEmployeur)} : le budget est tout pris. Le coût employeur est le brut multiplié par ${qte(auCentime(1 + x.tauxPatronal))} ; pour remonter au brut, on divise le budget, on ne lui retire pas ${pct(x.tauxPatronal)}.`,
          `Et le salarié ne touchera pas ${eur(x.brutAuCurseur)} : ses cotisations et son prélèvement s'en retiennent. L'étape suivante va jusqu'à son net.`,
        ];
      },
    },
    {
      id: "du-cout-au-net",
      objectifs: [4],
      type: "montants",
      titre: "Du coût employeur au net",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Sans formule. Avec un budget de ${eur(BUDGET_D_UNE_EMBAUCHE)} par mois, retrouvez le brut que l'entreprise peut offrir, puis ce que le salarié touchera : son net avant impôt, son prélèvement à la source et son net à payer.`,
      champs: (c) => {
        const x = paieARebours(c);
        const e = x.embauche;
        return [
          { libelle: "Salaire brut", attendu: x.brutDeLEmbauche, calcul: `${eur(BUDGET_D_UNE_EMBAUCHE)} ÷ (1 + ${pct(x.tauxPatronal)}) = ${eur(x.brutDeLEmbauche)}` },
          {
            libelle: "Net avant impôt",
            attendu: e.netAvantImpot,
            calcul: `${eur(x.brutDeLEmbauche)} − ${eur(e.cotisationsSalariales.total)} de cotisations salariales (${pct(x.tauxSalarial)}) = ${eur(e.netAvantImpot)}`,
          },
          {
            libelle: "Prélèvement à la source",
            attendu: e.prelevementALaSource,
            calcul: `net imposable ${eur(e.netAvantImpot)} + ${eur(x.brutDeLEmbauche)} × ${pct(T.assietteDeLaCsg)} × ${pct(T.csgCrdsNonDeductible)} = ${eur(e.netImposable)} ; × ${pct(T.prelevementALaSource)} = ${eur(e.prelevementALaSource)}`,
          },
          { libelle: "Net à payer au salarié", attendu: e.netAPayer, calcul: `${eur(e.netAvantImpot)} − ${eur(e.prelevementALaSource)} = ${eur(e.netAPayer)}` },
        ];
      },
      explication: (c) => {
        const x = paieARebours(c);
        const e = x.embauche;
        return [
          `Sur ${eur(BUDGET_D_UNE_EMBAUCHE)} engagés, le salarié en touche ${eur(e.netAPayer)}, soit ${qte(auCentime((e.netAPayer / BUDGET_D_UNE_EMBAUCHE) * 100))} %. Le reste va à l'URSSAF (${eur(e.aVerser.urssaf)}), à la caisse de retraite (${eur(e.aVerser.retraite)}) et à l'État (${eur(e.aVerser.etat)}).`,
          "Une offre d'embauche se négocie en brut, un budget se tient en coût employeur, le salarié compte en net : savoir passer de l'un à l'autre, dans les deux sens, c'est ce qu'on attend d'un gestionnaire de paie.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-prime",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la prime",
      notions: ["payroll", "fixed_costs"],
      question: (c) =>
        `Le gérant ${dE(c.entreprise)} prépare une autre prime. Faites varier la prime brute d'un salarié, le taux des cotisations patronales (un allègement le fait baisser) et le taux du prélèvement à la source. Le tableau suit, pour un salarié, ce qu'il touche et ce que la prime coûte, puis la charge pour l'équipe.`,
      leviers: () => [
        { code: "prime", libelle: "Prime brute par salarié", unite: "€", ...LEVIERS_DE_LA_PRIME.prime, depart: DEPART_DU_LABORATOIRE.prime },
        { code: "patronal", libelle: "Taux des cotisations patronales", unite: "%", ...LEVIERS_DE_LA_PRIME.patronal, depart: DEPART_DU_LABORATOIRE.patronal },
        { code: "prelevement", libelle: "Taux du prélèvement à la source", unite: "%", ...LEVIERS_DE_LA_PRIME.prelevement, depart: DEPART_DU_LABORATOIRE.prelevement },
      ],
      lecture: (c, p) => {
        const l = laboratoireDeLaPrime(c, p);
        const d = laboratoireDeLaPrime(c, DEPART_DU_LABORATOIRE);
        return [
          { libelle: "Cotisations salariales", montant: l.cotisationsSalariales, reference: d.cotisationsSalariales },
          { libelle: "Prélèvement à la source", montant: l.prelevement, reference: d.prelevement },
          { libelle: "Net touché par le salarié", montant: l.net, reference: d.net, fort: true },
          { libelle: "Cotisations patronales", montant: l.cotisationsPatronales, reference: d.cotisationsPatronales },
          { libelle: "Coût employeur par salarié", montant: l.cout, reference: d.cout, fort: true },
          { libelle: "Charge des primes de l'équipe", montant: -l.coutDeLEquipe, reference: -d.coutDeLEquipe, effet: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      defi: (c) => {
        const x = paieARebours(c);
        return {
          consigne: `Chaque salarié doit toucher au moins ${eur(NET_DU_DEFI)} nets, et la prime ne doit pas coûter plus de ${eur(COUT_DU_DEFI)} par salarié. Le taux du prélèvement reste celui que l'administration transmet, ${pct(T.prelevementALaSource)}.`,
          atteint: (p) => {
            const l = laboratoireDeLaPrime(c, p);
            return p.prelevement === PRELEVEMENT_EN_POURCENT && l.net >= NET_DU_DEFI && l.cout <= COUT_DU_DEFI;
          },
          indice: (p) => {
            const l = laboratoireDeLaPrime(c, p);
            if (p.prelevement !== PRELEVEMENT_EN_POURCENT)
              return `Le taux du prélèvement ne se choisit pas : c'est l'impôt du salarié, que l'administration fixe. Remettez-le à ${pct(T.prelevementALaSource)}, et cherchez un levier de l'employeur.`;
            if (p.patronal === TAUX_PATRONAL_EN_POURCENT)
              return `À ${pct(x.tauxPatronal)} de cotisations patronales, ${eur(NET_DU_DEFI)} nets demandent au moins ${eur(x.brutMinimalDuDefi)} bruts, qui coûtent ${eur(x.coutMinimalDuDefi)} ; et ${eur(COUT_DU_DEFI)} ne permettent que ${eur(x.brutMaximalDuDefi)} bruts. Aucune prime ne tient les deux : il faut un autre levier.`;
            if (l.net < NET_DU_DEFI) return `Le salarié ne touche que ${eur(l.net)} nets : la prime brute doit monter.`;
            return `La prime coûte ${eur(l.cout)} par salarié : baissez la prime brute, ou allégez encore les cotisations patronales.`;
          },
          solution: { prime: PRIME_BRUTE_DE_DEPART, patronal: TAUX_PATRONAL_EN_POURCENT - ALLEGEMENT_DE_LA_SOLUTION, prelevement: PRELEVEMENT_EN_POURCENT },
        };
      },
      explication: (c, p) => {
        const x = paieARebours(c);
        const l = laboratoireDeLaPrime(c, p);
        return [
          `À ${qte(p.patronal!)} % de cotisations patronales, une prime de ${eur(p.prime!)} bruts verse ${eur(l.net)} nets et coûte ${eur(l.cout)}. Au taux plein de ${pct(x.tauxPatronal)}, aucune prime ne tenait les deux : il fallait au moins ${eur(x.brutMinimalDuDefi)} bruts pour le net, et au plus ${eur(x.brutMaximalDuDefi)} pour le coût.`,
          "La prime brute fait bouger le net et le coût ensemble : on ne gagne sur l'un qu'en perdant sur l'autre. Seules les cotisations patronales séparent les deux, et ce sont elles que les allègements de charges réduisent. Le prélèvement à la source, lui, change ce que touche le salarié, jamais ce que coûte la prime.",
        ];
      },
    },
    {
      id: "le-levier-de-l-employeur",
      objectifs: [3],
      type: "choix",
      titre: "Le levier de l'employeur",
      notions: ["payroll", "income_statement"],
      question: (c) => {
        const x = paieARebours(c);
        const sansImpot = bulletinDePaie(x.brutMaximalDuDefi, tauxAvec(TAUX_PATRONAL_EN_POURCENT, 0)).netAPayer;
        return `Au laboratoire, baisser le taux du prélèvement faisait toucher plus aux salariés : à ${pct(0)}, ${eur(sansImpot)} nets pour ${eur(x.brutMaximalDuDefi)} bruts, sans un euro de coût en plus. Le gérant propose d'appliquer un taux nul à toute l'équipe pour la prime. Que lui répondez-vous ?`;
      },
      options: () => [
        {
          texte: "Le taux ne se décide pas : c'est l'impôt du salarié, et il ne change rien au coût de la prime",
          juste: true,
          retour: "Oui. L'employeur collecte le prélèvement au taux que l'administration lui transmet, pour chaque salarié ; il n'en décide pas. Et l'impôt du salarié resterait dû : il se régularise sur l'année. Le coût de la prime, le brut et les cotisations patronales, n'en dépend pas.",
        },
        {
          texte: "Bonne idée : le prélèvement est une charge de l'entreprise, le supprimer allège la prime",
          juste: false,
          retour: "Non : le prélèvement se retient sur le brut, il ne s'y ajoute pas. Ce n'est pas une charge de l'entreprise mais une dette envers l'État, au compte 442 : le supprimer ne changerait pas le coût de la prime.",
        },
        {
          texte: "Bonne idée, à condition de verser la différence à l'URSSAF avec les cotisations",
          juste: false,
          retour: "Non : le prélèvement est un impôt, dû à l'État, et non une cotisation. L'URSSAF ne le recouvre pas, et l'employeur n'en choisit pas le taux.",
        },
        {
          texte: "Mieux vaut baisser les cotisations salariales, qui sont des charges de l'entreprise",
          juste: false,
          retour: "Non : les cotisations salariales se retiennent sur le brut, comme le prélèvement ; elles ne coûtent rien de plus à l'entreprise, et leur taux ne se négocie pas. Seules les cotisations patronales sont une charge, et ce sont elles que les allègements réduisent.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payroll", "fixed_costs", "payment_terms"],
      texte: (c) => {
        const p = paieDeJanvier(c);
        return [
          `Vous avez tenu la paie de janvier ${dE(c.entreprise)} comme un gestionnaire de paie : l'acompte, le journal de paie, les cotisations patronales, le virement des nets, et le règlement des organismes et de l'État.`,
          `Le personnel coûte ${eur(p.b.coutEmployeur)} à l'entreprise ; les salariés en reçoivent ${eur(p.b.verseAuxSalaries)}. L'écart n'est pas perdu : il finance la sécurité sociale, la retraite, l'assurance chômage, et règle l'impôt des salariés.`,
          "Au niveau de l'examen, vous savez établir un bulletin du brut au net à payer, passer et régler la paie organisme par organisme, remonter d'un net promis au brut et d'un budget de coût employeur au brut et au net, et dire quel levier l'employeur tient vraiment : le brut et ses cotisations patronales, pas l'impôt du salarié.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Une seule charge au débit, le brut, et autant de dettes au crédit qu'il y a de destinataires. Coût employeur = brut × (1 + taux patronal) ; net à payer = brut × ce qu'un euro brut laisse au salarié, moins l'acompte. On remonte au brut en divisant, jamais en retranchant un taux.",
    },
  ],
};
