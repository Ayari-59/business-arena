import { arrondi, eur, pct as enPoints, quotient2 } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { EQUIPEMENT, PLACEMENT } from "../monde/exercice-de-nova";
import { LIGNE_A_FINANCER } from "../monde/financement-de-la-gamme";
import {
  ANNEES_DE_LA_RESERVE,
  INFLATION_PREVUE,
  PAIEMENT_ECHELONNE,
  PAS_DU_VERSEMENT,
  RENOUVELLEMENT,
  TAUX_DE_LA_BANQUE,
  coefficientDeValeurAcquise,
  interetsCourusDeLaReserve,
  interetsSimples,
  offreEchelonnee,
  prixFuturDeLaLigne,
  reserveDeRenouvellement,
  tauxReel,
  valeurAcquise,
  valeurAcquiseSimple,
  valeurActuelleDUneSomme,
  valeurActuelleDesAnnuites,
  versementQuiSuffit,
  type LeviersDuRenouvellement,
} from "../monde/valeur-et-temps";
import { TAUX_D_ACTUALISATION_DE_NOVA } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA VALEUR ET LE TEMPS (comptabilité générale, palier 4 ; DCG UE6 2.1).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA au début de N+1, avec trois sommes qui ne tombent
 * pas à la même date. Le compte à terme de l'exercice (133 000 € à 3 %) et ses intérêts ; la première
 * ligne, achetée 60 000 € en janvier N, à remplacer fin N+5 ; l'offre du fournisseur de la ligne
 * semi-automatique, payable en cinq annuités au lieu de 150 000 € comptant. Tous les chiffres se
 * calculent dans monde/valeur-et-temps.ts.
 *
 * L'objet : un euro d'aujourd'hui ne vaut pas un euro de demain. Capitaliser (intérêts simples, puis
 * composés), actualiser, réunir un capital par des annuités, tenir compte de l'inflation (taux
 * nominal et taux réel), puis évaluer une dette par l'actualisation de ses flux et en tirer le taux
 * de rendement actuariel. Le chapitre « L'emprunt et ses intérêts » a bâti des tableaux d'emprunt ;
 * celui-ci donne les outils qui les fondent. « La valeur actuelle nette » les appliquera aux projets.
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, les-interets-simples, actualiser (la formule est au repère ou dans la question) ;
 *   · l'expérience avant la formule : predire-le-compose puis les-interets-composes (un tableau à
 *     compléter, année par année) ; predire-l-inflation puis le-laboratoire-de-la-reserve (le
 *     versement, le taux, l'inflation ; un graphique de la valeur acquise et du prix de la ligne)
 *     avant le-taux-reel ; predire-le-taux puis le-taux-au-curseur avant le-taux-actuariel ;
 *   · autonome : le-versement-annuel, l-offre-du-fournisseur ;
 *   · expert : l-annuite-de-la-banque (l'annuité constante qui rembourse le même prix), evaluer-un-actif
 *     (la critique : ce qui fait la valeur d'un actif) ; puis la synthèse.
 *
 * MATIÈRE : le plan de cours du propriétaire pour la finance d'entreprise (« la valeur et le temps :
 * taux d'intérêt, taux nominal et taux réel, intérêts simples et composés, valeurs acquises, valeurs
 * actuelles, taux de rendement »), adapté aux sommes de NOVA.
 */

/** Le chapitre se joue chez NOVA : sa réserve, sa ligne, son fournisseur. */
export const ENTREPRISES_DE_LA_VALEUR: readonly string[] = ["nova"];

/** Les bornes du curseur du taux, en pour mille : de 4 % à 7 %. */
export const TAUX_DU_CURSEUR_DE_L_OFFRE = { min: 40, max: 70 } as const;

/** Les leviers du laboratoire : le versement en euros, le taux et l'inflation en pour cent. */
export const LEVIERS_DE_LA_RESERVE = {
  versement: { min: 8_000, max: 16_000, pas: PAS_DU_VERSEMENT },
  taux: { min: 1, max: 5, pas: 0.5 },
  inflation: { min: 0, max: 4, pas: 0.5 },
} as const;

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const nb = (x: number, chiffres = 6) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Une position du laboratoire, en leviers de la réserve. */
export const leviersDeLaReserve = (p: Readonly<Record<string, number>>): Partial<LeviersDuRenouvellement> => ({ versement: p.versement!, taux: p.taux! / 100, inflation: p.inflation! / 100 });

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function valeurDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const C = PLACEMENT.montant;
  const i = PLACEMENT.tauxAnnuel;
  const n = ANNEES_DE_LA_RESERVE;
  // La capitalisation année par année, au centime à chaque fin d'année, comme sur un relevé.
  let du = C;
  const annees = Array.from({ length: n }, (_, k) => {
    const interets = auCentime(du * i);
    const a = { annee: k + 1, debut: du, interets, fin: auCentime(du + interets) };
    du = a.fin;
    return a;
  });
  const r = RENOUVELLEMENT;
  // Le coefficient se donne au dix-millième, et le versement part de lui, comme sur la copie (deux-decimales.ts).
  const versement = quotient2(r.prixDAujourdHui, arrondi(coefficientDeValeurAcquise(r.taux, r.versements), 4));
  const offre = offreEchelonnee();
  const vaA = (taux: number) => valeurActuelleDesAnnuites(PAIEMENT_ECHELONNE.annuite, taux, PAIEMENT_ECHELONNE.annees);
  const bas = Math.floor(offre.tauxActuariel * 1000) / 1000;
  const haut = bas + 0.001;
  const interpole = bas + ((haut - bas) * (vaA(bas) - PAIEMENT_ECHELONNE.comptant)) / (vaA(bas) - vaA(haut));
  return {
    C,
    i,
    n,
    courus: interetsCourusDeLaReserve(),
    semestre: interetsSimples(C, i, 0.5),
    annees,
    simple: valeurAcquiseSimple(C, i, n),
    compose: valeurAcquise(C, i, n),
    va3: valeurActuelleDUneSomme(r.prixDAujourdHui, r.taux, r.versements),
    va9: valeurActuelleDUneSomme(r.prixDAujourdHui, TAUX_D_ACTUALISATION_DE_NOVA, r.versements),
    coefficient: arrondi(coefficientDeValeurAcquise(r.taux, r.versements), 4),
    versement,
    versementArrondi: Math.ceil(versement / PAS_DU_VERSEMENT) * PAS_DU_VERSEMENT,
    prixFutur: prixFuturDeLaLigne(),
    reel: tauxReel(r.taux, INFLATION_PREVUE),
    sansInflation: reserveDeRenouvellement({ versement, inflation: 0 }),
    avecInflation: reserveDeRenouvellement({ versement }),
    suffit: versementQuiSuffit(),
    offre,
    vaA,
    bas,
    haut,
    interpole,
  };
}

/** Les trois sommes de NOVA, à des dates différentes. */
export function tableauDesSommes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = valeurDuChapitre(c);
  return {
    titre: "Trois sommes, trois dates",
    colonnes: ["Montant et date"],
    lignes: [
      { libelle: "Compte à terme", valeurs: [`${eur(x.C)} placés à ${pct(x.i)} l'an le 6 janvier N, rendus le 6 janvier N+1`] },
      { libelle: "Première ligne", valeurs: [`achetée ${eur(EQUIPEMENT.ht)} HT en janvier N, usée en ${EQUIPEMENT.dureeAns} ans : à remplacer fin N+${RENOUVELLEMENT.versements}`] },
      { libelle: "Ligne semi-automatique", valeurs: [`${eur(PAIEMENT_ECHELONNE.comptant)} HT comptant le 1er janvier N+1, ou ${PAIEMENT_ECHELONNE.annees} annuités de ${eur(PAIEMENT_ECHELONNE.annuite)}`] },
      { libelle: "Taux de la banque", valeurs: [`${pct(TAUX_DE_LA_BANQUE)} l'an, ce que coûte à NOVA l'argent emprunté`] },
    ],
  };
}

/** La réserve reconduite 3 ans, intérêts capitalisés, année par année, à compléter. */
export function grilleDesInteretsComposes(c: Pick<Cas, "code">): TableauACompleter {
  const x = valeurDuChapitre(c);
  return {
    titre: `${eur(x.C)} reconduits à ${pct(x.i)}, intérêts laissés sur le compte`,
    colonnes: ["Capital au début", "Intérêts de l'année", "Capital à la fin"],
    colonneDeTotal: 2,
    lignes: x.annees.map((a) => ({
      libelle: `Année ${a.annee}`,
      cellules: [
        a.annee === 1 ? donnee(a.debut) : aSaisir(a.debut, `le capital de la fin de l'année ${a.annee - 1} : ${eur(a.debut)}`, { indice: "le capital de la fin de l'année d'avant, intérêts compris" }),
        a.annee === 1 ? donnee(a.interets) : aSaisir(a.interets, `${eur(a.debut)} × ${pct(x.i)} = ${eur(a.interets)}`, { indice: "le taux sur le capital du début de l'année" }),
        aSaisir(a.fin, `${eur(a.debut)} + ${eur(a.interets)} = ${eur(a.fin)}`, { indice: "le capital du début, plus ses intérêts" }),
      ],
    })),
  };
}

export const LA_VALEUR_ET_LE_TEMPS: Chapitre = {
  code: "la-valeur-et-le-temps",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "La valeur et le temps : capitaliser, actualiser, évaluer",
  accroche:
    "Un euro reçu dans cinq ans ne vaut pas un euro d'aujourd'hui. Les intérêts de la réserve de NOVA, le prix de sa ligne à remplacer, l'offre d'un fournisseur payable en annuités : capitaliser, actualiser, puis juger une dette par son taux actuariel.",
  objectifs: [
    "Calculer des intérêts simples et des intérêts composés, et la valeur acquise d'un capital",
    "Actualiser une somme future et calculer la valeur acquise ou actuelle d'une suite d'annuités constantes",
    "Passer d'un taux nominal à un taux réel en contexte d'inflation, et en mesurer l'effet sur un capital à réunir",
    "Évaluer une dette ou un actif par l'actualisation de ses flux, et calculer son taux de rendement actuariel",
  ],
  libre: false,
  prerequis: ["l-emprunt"],
  ensuite: ["le-marche-financier", "la-valeur-actuelle-nette"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "la valeur du temps se calcule ici sur la réserve, la ligne et le fournisseur de NOVA dans la simulation du cours ; les formules valent pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le prix du temps",
      notions: ["discounting"],
      tableau: tableauDesSommes,
      texte: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Début N+1, NOVA a trois sommes devant elle. Son compte à terme de ${eur(x.C)} lui rend ses intérêts. Sa première ligne sera à remplacer fin N+${RENOUVELLEMENT.versements}. Et le fournisseur de la ligne semi-automatique accepte d'être payé en ${PAIEMENT_ECHELONNE.annees} annuités.`,
          "Ces sommes ne tombent pas à la même date : on ne peut pas les additionner telles quelles. Un euro placé aujourd'hui rapporte des intérêts ; un euro promis pour plus tard vaut donc moins qu'un euro tenu.",
          "Capitaliser, c'est porter une somme dans le futur, intérêts compris. Actualiser, c'est le chemin inverse : ramener une somme future à sa valeur d'aujourd'hui.",
        ];
      },
      repere: () => "Intérêts simples : C × i × n. Valeur acquise à intérêts composés : C × (1 + i)^n. Valeur actuelle : C × (1 + i)^−n.",
    },
    {
      id: "les-interets-simples",
      objectifs: [0],
      type: "montants",
      titre: "Les intérêts simples",
      notions: ["discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Le compte à terme rapporte ${pct(x.i)} l'an en intérêts simples, sur une année de 360 jours. Du 6 janvier au 31 décembre N, il a couru 355 jours. Calculez ses intérêts courus au 31 décembre, puis les intérêts d'un placement de ${eur(x.C)} pendant 6 mois.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: "Intérêts courus au 31 décembre N", attendu: x.courus, calcul: `${eur(x.C)} × ${pct(x.i)} × 355 ÷ 360 = ${eur(x.courus)}` },
          { libelle: "Intérêts de 6 mois", attendu: x.semestre, calcul: `${eur(x.C)} × ${pct(x.i)} × 6 ÷ 12 = ${eur(x.semestre)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Ce sont les ${eur(x.courus)} que la clôture a passés en produit à recevoir. En intérêts simples, les intérêts se calculent toujours sur le capital de départ : ils ne portent pas eux-mêmes intérêt.`,
          "On les emploie pour les placements et les crédits de moins d'un an.",
        ];
      },
    },
    {
      id: "predire-le-compose",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur les intérêts composés",
      notions: ["discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Si NOVA avait reconduit sa réserve ${x.n} ans à ${pct(x.i)}, la banque lui aurait proposé deux façons de faire : verser les intérêts chaque année, ou les laisser sur le compte. Avant tout calcul, quelle façon lui laisse le plus au bout de ${x.n} ans ?`;
      },
      options: () => {
        const voir = "Le tableau de l'étape suivante le chiffre, année par année.";
        return [
          { texte: "Laisser les intérêts sur le compte", juste: true, retour: `Bon pari, à vérifier. ${voir}` },
          { texte: "Les verser chaque année, puisque le taux est le même", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Aucune : au même taux, les deux rapportent autant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-interets-composes",
      objectifs: [0],
      type: "a-completer",
      titre: "Les intérêts composés",
      notions: ["discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `La réserve reste ${x.n} ans sur le compte, intérêts compris. Chaque année, le taux s'applique au capital du début de l'année, intérêts des années passées compris. Complétez le tableau ; la première année est faite.`;
      },
      grille: grilleDesInteretsComposes,
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Au bout de ${x.n} ans, la réserve vaut ${eur(x.compose)}, soit ${eur(x.C)} × ${nb(1 + x.i)}^${x.n}. En intérêts simples, elle n'aurait valu que ${eur(x.simple)} : ${eur(x.C)} × (1 + ${x.n} × ${pct(x.i)}).`,
          `L'écart, ${eur(auCentime(x.compose - x.simple))}, ce sont les intérêts des intérêts. Il grandit avec la durée : au-delà d'un an, on calcule en intérêts composés.`,
        ];
      },
    },
    {
      id: "actualiser",
      objectifs: [1],
      type: "montants",
      titre: "Actualiser une somme future",
      notions: ["discounting"],
      question: () => {
        return `La première ligne coûte ${eur(RENOUVELLEMENT.prixDAujourdHui)} ; NOVA devra la remplacer dans ${RENOUVELLEMENT.versements} ans. Quelle somme faudrait-il placer aujourd'hui à ${pct(RENOUVELLEMENT.taux)} pour avoir ${eur(RENOUVELLEMENT.prixDAujourdHui)} dans ${RENOUVELLEMENT.versements} ans ? Et au coût du capital de NOVA, ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} ? Utilisez C × (1 + i)^−n.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        const n = RENOUVELLEMENT.versements;
        return [
          { libelle: `Valeur actuelle à ${pct(RENOUVELLEMENT.taux)}`, attendu: x.va3, calcul: `${eur(RENOUVELLEMENT.prixDAujourdHui)} × ${nb(1 + RENOUVELLEMENT.taux)}^−${n} = ${eur(x.va3)}` },
          { libelle: `Valeur actuelle à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}`, attendu: x.va9, calcul: `${eur(RENOUVELLEMENT.prixDAujourdHui)} × ${nb(1 + TAUX_D_ACTUALISATION_DE_NOVA)}^−${n} = ${eur(x.va9)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `La même somme future vaut ${eur(x.va3)} aujourd'hui à ${pct(RENOUVELLEMENT.taux)}, mais ${eur(x.va9)} à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}. Plus le taux est haut, moins vaut une somme lointaine.`,
          "Le taux d'actualisation n'est donc pas un détail : il dit ce que l'argent pourrait rapporter ailleurs, à risque égal.",
        ];
      },
    },
    {
      id: "le-versement-annuel",
      objectifs: [1],
      type: "montants",
      titre: "Réunir le prix par des annuités",
      notions: ["discounting"],
      question: () => {
        return `NOVA préfère placer une somme égale à la fin de chaque année, de N+1 à N+${RENOUVELLEMENT.versements}, à ${pct(RENOUVELLEMENT.taux)}. Calculez le coefficient de valeur acquise de ${RENOUVELLEMENT.versements} annuités, ((1 + i)^n − 1) ÷ i, puis le versement qui réunit ${eur(RENOUVELLEMENT.prixDAujourdHui)} fin N+${RENOUVELLEMENT.versements}. Le dernier versement ne rapporte rien : il tombe le jour de l'achat.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        const n = RENOUVELLEMENT.versements;
        return [
          { libelle: "Coefficient de valeur acquise", nature: "coefficient", attendu: x.coefficient, calcul: `(${nb(1 + RENOUVELLEMENT.taux)}^${n} − 1) ÷ ${nb(RENOUVELLEMENT.taux)} = ${nb(x.coefficient, 4)}`, tolerance: 0.0001 },
          { libelle: "Versement annuel", attendu: x.versement, calcul: `${eur(RENOUVELLEMENT.prixDAujourdHui)} ÷ ${nb(x.coefficient, 4)} = ${eur(x.versement)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `${RENOUVELLEMENT.versements} versements de ${eur(x.versement)} font ${eur(auCentime(x.versement * RENOUVELLEMENT.versements))} ; les intérêts apportent le reste. Leur valeur acquise fin N+${RENOUVELLEMENT.versements} est le prix de la ligne, au centime près de l'arrondi.`,
          `Mais une ligne neuve coûtera-t-elle encore ce prix-là dans ${RENOUVELLEMENT.versements} ans ?`,
        ];
      },
    },
    {
      id: "predire-l-inflation",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'inflation",
      notions: ["discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Les prix montent de ${pct(INFLATION_PREVUE)} par an. Le versement de ${eur(x.versement)} suffira-t-il encore à payer une ligne neuve fin N+${RENOUVELLEMENT.versements} ?`;
      },
      options: () => {
        const voir = "Le laboratoire qui suit fait jouer le versement, le taux et l'inflation : vous le verrez.";
        return [
          { texte: "Non, il manquera de l'argent", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui, le placement à 3 % couvre déjà la hausse des prix", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Oui, l'inflation ne touche pas les machines", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-reserve",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la réserve",
      notions: ["discounting"],
      question: () =>
        `Faites varier le versement annuel, le taux du placement et l'inflation. Le tableau suit ce que valent les versements fin N+${RENOUVELLEMENT.versements}, le prix d'une ligne neuve à cette date, l'écart et le taux réel. Le graphique trace la valeur acquise et le prix selon le versement. Relevez le défi.`,
      leviers: (c) => {
        const x = valeurDuChapitre(c);
        const L = LEVIERS_DE_LA_RESERVE;
        return [
          { code: "versement", libelle: "Versement annuel", unite: "€", ...L.versement, depart: x.versementArrondi },
          { code: "taux", libelle: "Taux du placement", unite: "%", ...L.taux, depart: RENOUVELLEMENT.taux * 100 },
          { code: "inflation", libelle: "Inflation", unite: "%", ...L.inflation, depart: INFLATION_PREVUE * 100 },
        ];
      },
      lecture: (c, p) => {
        const x = valeurDuChapitre(c);
        const r = reserveDeRenouvellement(leviersDeLaReserve(p));
        const depart = reserveDeRenouvellement({ versement: x.versementArrondi });
        return [
          { libelle: `Valeur acquise des versements, fin N+${RENOUVELLEMENT.versements}`, montant: r.acquis, reference: depart.acquis },
          { libelle: `Prix d'une ligne neuve, fin N+${RENOUVELLEMENT.versements}`, montant: r.prix, reference: depart.prix },
          { libelle: "Ce qui reste ou ce qui manque", montant: r.ecart, reference: depart.ecart, effet: true, fort: true },
          { libelle: "Taux réel du placement", montant: auCentime(r.reel * 100), unite: "%", reference: auCentime(depart.reel * 100) },
        ];
      },
      graphique: () => ({
        levier: "versement",
        courbes: [
          { libelle: "Valeur acquise des versements", valeur: (p) => reserveDeRenouvellement(leviersDeLaReserve(p)).acquis },
          { libelle: "Prix de la ligne neuve", valeur: (p) => reserveDeRenouvellement(leviersDeLaReserve(p)).prix },
        ],
      }),
      defi: (c) => {
        const x = valeurDuChapitre(c);
        const pas = LEVIERS_DE_LA_RESERVE.versement.pas;
        const ecartDe = (p: Readonly<Record<string, number>>) => reserveDeRenouvellement(leviersDeLaReserve(p)).ecart;
        const auDepart = (p: Readonly<Record<string, number>>) => p.taux === RENOUVELLEMENT.taux * 100 && p.inflation === INFLATION_PREVUE * 100;
        return {
          consigne: `Le placement restant à ${pct(RENOUVELLEMENT.taux)} et l'inflation à ${pct(INFLATION_PREVUE)}, trouvez le plus petit versement, au pas de ${eur(pas)}, qui paie la ligne neuve fin N+${RENOUVELLEMENT.versements}.`,
          atteint: (p) => auDepart(p) && ecartDe(p) >= 0 && ecartDe({ ...p, versement: p.versement! - pas }) < 0,
          indice: (p) => {
            if (!auDepart(p)) return `Le défi garde le placement à ${pct(RENOUVELLEMENT.taux)} et l'inflation à ${pct(INFLATION_PREVUE)} : ne bougez que le versement.`;
            if (ecartDe(p) < 0) return `À ce versement, il manque encore ${eur(-ecartDe(p))} : montez-le.`;
            return "La ligne est payée, mais un versement plus petit y suffirait peut-être : baissez-le.";
          },
          solution: { versement: x.suffit, taux: RENOUVELLEMENT.taux * 100, inflation: INFLATION_PREVUE * 100 },
        };
      },
      explication: (c, p) => {
        const x = valeurDuChapitre(c);
        const r = reserveDeRenouvellement(leviersDeLaReserve(p));
        return [
          `Défi relevé : ${eur(p.versement!)} par an réunissent ${eur(r.acquis)}, pour une ligne qui coûtera ${eur(r.prix)}. Sans inflation, ${eur(x.versement)} suffisaient.`,
          "Les autres leviers le montrent aussi : quand l'inflation rattrape le taux du placement, le taux réel tombe à zéro, et l'argent placé ne fait plus que garder sa valeur.",
        ];
      },
    },
    {
      id: "le-taux-reel",
      objectifs: [2],
      type: "montants",
      titre: "Taux nominal et taux réel",
      notions: ["discounting"],
      question: () => {
        return `Le placement rapporte ${pct(RENOUVELLEMENT.taux)} : c'est son taux nominal. Les prix montent de ${pct(INFLATION_PREVUE)}. Calculez le prix d'une ligne neuve fin N+${RENOUVELLEMENT.versements}, puis le taux réel du placement, par (1 + taux nominal) ÷ (1 + inflation) − 1, en pour cent au centième.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: `Prix de la ligne fin N+${RENOUVELLEMENT.versements}`, attendu: x.prixFutur, calcul: `${eur(RENOUVELLEMENT.prixDAujourdHui)} × ${nb(1 + INFLATION_PREVUE)}^${RENOUVELLEMENT.versements} = ${eur(x.prixFutur)}` },
          { libelle: "Taux réel du placement, en %", attendu: auCentime(x.reel * 100), calcul: `${nb(1 + RENOUVELLEMENT.taux)} ÷ ${nb(1 + INFLATION_PREVUE)} − 1 = ${pct(x.reel)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `En pouvoir d'achat, le placement ne rapporte que ${pct(x.reel)} par an, et non ${pct(RENOUVELLEMENT.taux)}. Retrancher l'inflation du taux nominal, ${pct(RENOUVELLEMENT.taux - INFLATION_PREVUE)}, en donne une bonne idée ; la formule exacte divise.`,
          `Pour payer une ligne à ${eur(x.prixFutur)}, il faut verser ${eur(x.avecInflation.versementNecessaire)} par an : le versement se calcule sur le prix futur, en euros de l'époque.`,
        ];
      },
    },
    {
      id: "l-offre-du-fournisseur",
      objectifs: [3],
      type: "montants",
      titre: "L'offre du fournisseur",
      notions: ["discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `À vous, sans formule cette fois. Le fournisseur propose ${x.offre.annees} annuités de ${eur(x.offre.annuite)}, à la fin de chaque année, au lieu de ${eur(x.offre.comptant)} comptant. Pour payer comptant, NOVA emprunterait à ${pct(TAUX_DE_LA_BANQUE)}. Calculez ce que valent les annuités aujourd'hui à ce taux, puis l'écart avec le comptant.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: "Valeur actuelle des annuités", attendu: x.offre.valeurActuelle, calcul: `${eur(x.offre.annuite)} × (1 − ${nb(1 + TAUX_DE_LA_BANQUE)}^−${x.offre.annees}) ÷ ${nb(TAUX_DE_LA_BANQUE)} = ${eur(x.offre.valeurActuelle)}` },
          { libelle: "Ce que l'échelonnement coûte de plus", attendu: x.offre.surcout, calcul: `${eur(x.offre.valeurActuelle)} − ${eur(x.offre.comptant)} = ${eur(x.offre.surcout)}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Payer ${eur(x.offre.total)} en ${x.offre.annees} fois ne veut pas dire payer ${eur(auCentime(x.offre.total - x.offre.comptant))} de plus : les annuités tombent plus tard, et valent moins aujourd'hui. En valeur actuelle, l'écart n'est que de ${eur(x.offre.surcout)}.`,
          "Il reste un écart : le fournisseur prête à NOVA plus cher que la banque. Mais à quel taux ?",
        ];
      },
    },
    {
      id: "predire-le-taux",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le taux du fournisseur",
      notions: ["irr_payback"],
      question: () =>
        `Le taux actuariel de l'offre est le taux qui égale les ${eur(PAIEMENT_ECHELONNE.comptant)} du comptant et la valeur actuelle des annuités. À ${pct(TAUX_DE_LA_BANQUE)}, les annuités valent plus que le comptant. Ce taux est-il plus haut ou plus bas que ${pct(TAUX_DE_LA_BANQUE)} ?`,
      options: () => {
        const voir = "Le curseur de l'étape suivante fait varier le taux : vous le verrez.";
        return [
          { texte: `Plus haut que ${pct(TAUX_DE_LA_BANQUE)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Plus bas, puisque le fournisseur ne prend pas de frais`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Égal à ${pct(TAUX_DE_LA_BANQUE)}, le taux du marché`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Le taux, au curseur",
      notions: ["irr_payback", "discounting"],
      question: () =>
        `Faites varier le taux d'actualisation, de ${TAUX_DU_CURSEUR_DE_L_OFFRE.min} ‰ à ${TAUX_DU_CURSEUR_DE_L_OFFRE.max} ‰ (${TAUX_DU_CURSEUR_DE_L_OFFRE.min} ‰ font ${pct(TAUX_DU_CURSEUR_DE_L_OFFRE.min / 1000)}). Une droite donne le prix comptant ; l'autre, la valeur actuelle des annuités. Placez le curseur sur le plus petit taux où le comptant couvre les annuités.`,
      grandeur: () => ({ libelle: "Taux d'actualisation", unite: "‰" }),
      cible: (c) => {
        const x = valeurDuChapitre(c);
        return { attendu: Math.ceil(x.offre.tauxActuariel * 1000), min: TAUX_DU_CURSEUR_DE_L_OFFRE.min, max: TAUX_DU_CURSEUR_DE_L_OFFRE.max };
      },
      zones: ["Les annuités valent moins que le comptant", "Les annuités valent plus que le comptant"],
      rates: () => ({
        dessous: "À ce taux, les annuités valent encore plus que le prix comptant.",
        dessus: "À un taux plus bas, le comptant couvre déjà les annuités : cherchez le plus petit taux.",
      }),
      montrer: "Montrer le taux",
      lecture: (c, q) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: "Prix comptant", montant: x.offre.comptant },
          { libelle: `Valeur actuelle des annuités, à ${pct(q / 1000)}`, montant: x.vaA(q / 1000), fort: true },
        ];
      },
      droites: (c) => {
        const x = valeurDuChapitre(c);
        return { produit: () => x.offre.comptant, cout: (q) => x.vaA(q / 1000), libelles: ["Prix comptant", "Valeur actuelle des annuités"] };
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `À ${pct(x.bas)}, les annuités valent encore ${eur(x.vaA(x.bas))} ; à ${pct(x.haut)}, ${eur(x.vaA(x.haut))}. Le taux actuariel est entre les deux, au-dessus des ${pct(TAUX_DE_LA_BANQUE)} de la banque.`,
          "Plus le taux monte, moins valent des annuités lointaines : la courbe descend, et croise le comptant au taux que le fournisseur fait payer.",
        ];
      },
    },
    {
      id: "le-taux-actuariel",
      objectifs: [3],
      type: "montants",
      titre: "Le taux actuariel, par interpolation",
      notions: ["irr_payback"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `Le taux est entre ${pct(x.bas)} et ${pct(x.haut)}. Calculez la valeur actuelle des annuités à chacun, puis le taux qui la rend égale au comptant, par interpolation linéaire, en pour cent au centième.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        const a = x.vaA(x.bas);
        const b = x.vaA(x.haut);
        return [
          { libelle: `Valeur actuelle à ${pct(x.bas)}`, attendu: a, calcul: `${eur(x.offre.annuite)} × (1 − ${nb(1 + x.bas)}^−${x.offre.annees}) ÷ ${nb(x.bas)} = ${eur(a)}` },
          { libelle: `Valeur actuelle à ${pct(x.haut)}`, attendu: b, calcul: `${eur(x.offre.annuite)} × (1 − ${nb(1 + x.haut)}^−${x.offre.annees}) ÷ ${nb(x.haut)} = ${eur(b)}` },
          {
            libelle: "Taux actuariel de l'offre, en %",
            attendu: auCentime(x.interpole * 100),
            calcul: `${pct(x.bas)} + 0,1 point × (${eur(a)} − ${eur(x.offre.comptant)}) ÷ (${eur(a)} − ${eur(b)}) = ${pct(x.interpole)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Le fournisseur prête à NOVA à ${pct(x.offre.tauxActuariel)}, la banque à ${pct(TAUX_DE_LA_BANQUE)}. NOVA paiera comptant, avec l'argent de la banque : c'est le choix du chapitre « Emprunt ou crédit-bail ».`,
          "Le taux actuariel résume une dette en un seul taux, quelle que soit la forme de ses flux : on compare ainsi des offres qui ne se ressemblent pas.",
        ];
      },
    },
    {
      id: "l-annuite-de-la-banque",
      objectifs: [1, 3],
      type: "montants",
      titre: "L'annuité de la banque",
      notions: ["loan_schedule", "discounting"],
      question: (c) => {
        const x = valeurDuChapitre(c);
        return `La banque prêterait les ${eur(x.offre.comptant)} à ${pct(TAUX_DE_LA_BANQUE)} sur ${x.offre.annees} ans, remboursés par annuités constantes. Calculez cette annuité, C × i ÷ (1 − (1 + i)^−n), puis ce que NOVA économiserait chaque année par rapport au fournisseur.`;
      },
      champs: (c) => {
        const x = valeurDuChapitre(c);
        return [
          { libelle: "Annuité constante de la banque", attendu: x.offre.annuiteDeLaBanque, calcul: `${eur(x.offre.comptant)} × ${nb(TAUX_DE_LA_BANQUE)} ÷ (1 − ${nb(1 + TAUX_DE_LA_BANQUE)}^−${x.offre.annees}) = ${eur(x.offre.annuiteDeLaBanque)}` },
          { libelle: "Économie par an", attendu: auCentime(x.offre.annuite - x.offre.annuiteDeLaBanque), calcul: `${eur(x.offre.annuite)} − ${eur(x.offre.annuiteDeLaBanque)} = ${eur(auCentime(x.offre.annuite - x.offre.annuiteDeLaBanque))}` },
        ];
      },
      explication: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `L'annuité constante est la valeur actuelle des annuités lue à l'envers : ${x.offre.annees} annuités de ${eur(x.offre.annuiteDeLaBanque)} valent ${eur(x.offre.comptant)} à ${pct(TAUX_DE_LA_BANQUE)}. C'est ainsi que se bâtit le tableau d'un emprunt à annuités constantes.`,
          "Le chapitre « Arbitrer les coûts de financement » la reprend, avec l'emprunt in fine et l'amortissement constant.",
        ];
      },
    },
    {
      id: "evaluer-un-actif",
      objectifs: [3],
      type: "choix",
      titre: "Ce qui fait la valeur d'un actif",
      notions: ["discounting", "enterprise_value"],
      question: () =>
        `Le fournisseur veut revendre sa créance sur NOVA à une banque, le jour de la vente. Une banque qui exige ${pct(0.06)} en donnerait ${eur(valeurActuelleDesAnnuites(PAIEMENT_ECHELONNE.annuite, 0.06, PAIEMENT_ECHELONNE.annees))}. Qu'est-ce qui fait la valeur de cette créance ?`,
      options: () => [
        {
          texte: "Ses flux futurs, actualisés au taux exigé",
          juste: true,
          retour: "Oui. Un actif vaut ce qu'il rapportera, ramené à aujourd'hui au taux que son acheteur exige pour ce risque. Une obligation, une action, une machine s'évaluent ainsi : le chapitre « Le marché financier » le fait pour les titres.",
        },
        {
          texte: `La somme de ses annuités, ${eur(PAIEMENT_ECHELONNE.annuite * PAIEMENT_ECHELONNE.annees)}`,
          juste: false,
          retour: "Additionner des euros de dates différentes oublie le prix du temps : l'acheteur attend des années pour être payé, et veut en être rémunéré.",
        },
        {
          texte: `Le prix de la ligne vendue, ${eur(LIGNE_A_FINANCER.montant)}, ce qu'elle a coûté au fournisseur`,
          juste: false,
          retour: "Ce qu'un actif a coûté ne dit pas ce qu'il vaut : l'acheteur de la créance paie pour les flux qu'il recevra, et pour rien d'autre.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["discounting", "irr_payback"],
      texte: (c) => {
        const x = valeurDuChapitre(c);
        return [
          `Vous avez calculé des intérêts simples, ${eur(x.courus)} courus sur le compte à terme, et des intérêts composés : ${eur(x.compose)} au bout de ${x.n} ans, contre ${eur(x.simple)}.`,
          `Vous avez actualisé une somme future, réuni un capital par ${RENOUVELLEMENT.versements} annuités, et vu l'inflation l'emporter : ${eur(x.suffit)} par an au lieu de ${eur(x.versementArrondi)}, pour un taux réel de ${pct(x.reel)}.`,
          `Vous avez évalué l'offre du fournisseur par l'actualisation de ses flux, et trouvé son taux actuariel, ${pct(x.offre.tauxActuariel)}. Au niveau de l'examen, vous savez donner un prix au temps.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur acquise : C × (1 + i)^n. Valeur actuelle : C × (1 + i)^−n. Annuités : a × ((1 + i)^n − 1) ÷ i acquis, a × (1 − (1 + i)^−n) ÷ i actuel. Taux réel = (1 + nominal) ÷ (1 + inflation) − 1. Le taux actuariel égale le prix et la valeur actuelle des flux.",
    },
  ],
};
