import { auCentime } from "./amortissement";
import { NOVA_GESTION } from "./nova-gestion";
import { PLACEMENT } from "./exercice-de-nova";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "./projets-et-financement";
import { coefficientDeValeurActuelle, tauxDeRendementActuariel } from "./valeur-et-temps";

/**
 * LE MONDE DU COURS : LE MARCHÉ FINANCIER, SES COURS, SES TAUX ET SON RISQUE (DCG UE6 3.4 et 4.3).
 *
 * Fiche figée et modèle du chapitre « Le marché financier : cours, taux et risque » et de son cas.
 * Elle ne lit jamais l'arène. NOVA n'est pas cotée ; le marché qu'elle lit est celui de son
 * fournisseur de composants, Électro-Composants Lyon (monde/nova-gestion.ts), une entreprise du
 * monde du cours, plus grande qu'elle, dont les actions et les obligations s'échangent en bourse
 * (hypothèse du cours). Le taux sans risque et la prime de risque du marché sont ceux de la fiche
 * des projets (3 % et 6 %) ; le compte à terme de NOVA (3 %) sert de placement sans risque de
 * comparaison.
 *
 * CONVENTIONS : les taux sont des fractions ; une obligation verse son coupon à la fin de chaque
 * année et se rembourse au pair avec le dernier coupon (in fine) ; son cours se lit juste après le
 * paiement d'un coupon, sans coupon couru.
 */

/** L'émetteur : le fournisseur de composants de NOVA, coté en bourse dans le monde du cours. */
export const EMETTEUR = NOVA_GESTION.semestre.fournisseur.nom;

/** Une obligation classique, remboursée au pair in fine. */
export interface Obligation {
  nominal: number;
  /** Le taux nominal, ou facial : le coupon annuel rapporté au nominal. */
  tauxNominal: number;
  /** Les années qui restent jusqu'au remboursement. */
  dureeRestante: number;
}

/**
 * L'OBLIGATION VERTE D'ÉLECTRO-COMPOSANTS LYON (hypothèse du cours) : émise au pair le 1er janvier
 * N+1, 1 000 € de nominal, un coupon de 4 %, remboursée in fine dans 5 ans. Les fonds financent une
 * usine moins émettrice, et l'émetteur rend compte chaque année de leur usage : c'est ce qui en fait
 * un titre vert.
 */
export const OBLIGATION_VERTE: Obligation = { nominal: 1_000, tauxNominal: 0.04, dureeRestante: 5 };

/** La notation de l'émetteur (hypothèse du cours) : BBB, le bas de la catégorie « investissement ». */
export const NOTATION_DE_L_EMETTEUR = "BBB";

/**
 * UN AN PLUS TARD (hypothèse du cours) : au 1er janvier N+2, il reste 4 ans ; les taux de marché des
 * emprunteurs notés BBB sont montés à 5 %. Une variante les fait baisser à 3 %.
 */
export const UN_AN_PLUS_TARD = { dureeRestante: OBLIGATION_VERTE.dureeRestante - 1, tauxEnHausse: 0.05, tauxEnBaisse: 0.03 } as const;

/** LE COURS AFFICHÉ (hypothèse du cours) : au 1er janvier N+2, l'obligation se négocie à 950 €. */
export const COURS_AFFICHE = 950;

/** Le coupon annuel : nominal × taux nominal. */
export const coupon = (o: Obligation) => auCentime(o.nominal * o.tauxNominal);

/** Les flux qui restent à l'obligation : un coupon par an, et le nominal avec le dernier. */
export const fluxDeLObligation = (o: Obligation) => Array.from({ length: o.dureeRestante }, (_, k) => auCentime(coupon(o) + (k === o.dureeRestante - 1 ? o.nominal : 0)));

/**
 * LE COURS D'UNE OBLIGATION : la valeur actuelle de ses flux au taux actuariel du marché,
 * coupon × (1 − (1 + r)^−n) ÷ r + nominal × (1 + r)^−n. Au taux nominal, elle vaut le pair.
 */
export const coursDeLObligation = (o: Obligation, tauxDeMarche: number) =>
  auCentime(coupon(o) * coefficientDeValeurActuelle(tauxDeMarche, o.dureeRestante) + o.nominal * (1 + tauxDeMarche) ** -o.dureeRestante);

/** Le taux de rendement actuariel d'une obligation achetée à un cours donné. */
export const rendementDeLObligation = (o: Obligation, cours: number) => tauxDeRendementActuariel(cours, fluxDeLObligation(o));

/** L'obligation un an plus tard : il lui reste 4 ans. */
export const OBLIGATION_UN_AN_PLUS_TARD: Obligation = { ...OBLIGATION_VERTE, dureeRestante: UN_AN_PLUS_TARD.dureeRestante };

/** Le seuil du défi du laboratoire : un cours sous 950 €. */
export const COURS_DU_DEFI = COURS_AFFICHE;

/** Les leviers du laboratoire de l'obligation : le taux de marché (en %) et la durée restante. */
export const LEVIERS_DE_L_OBLIGATION = {
  taux: { min: 1, max: 8, pas: 0.5 },
  duree: { min: 1, max: 10, pas: 1 },
} as const;

/** Le plus bas taux de marché du laboratoire, en %, où l'obligation à `duree` ans cote sous le seuil. */
export function tauxQuiFaitPasserSous(seuil = COURS_DU_DEFI, duree: number = UN_AN_PLUS_TARD.dureeRestante) {
  const L = LEVIERS_DE_L_OBLIGATION.taux;
  for (let p = L.min; p <= L.max + 1e-9; p += L.pas) if (coursDeLObligation({ ...OBLIGATION_VERTE, dureeRestante: duree }, p / 100) < seuil) return p;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ACTION D'ÉLECTRO-COMPOSANTS LYON (hypothèse du cours) : un dividende de 1,20 € attendu dans un an,
 * qui croît ensuite de 3 % par an ; les actionnaires en exigent 9 %, le taux sans risque plus une
 * prime de risque du marché (un bêta de 1, celui du marché).
 */
export const ACTION = { dividende: 1.2, croissance: 0.03, beta: 1 } as const;

/** La rentabilité que les actionnaires exigent, par le MEDAF : 3 % + 1 × 6 %. */
export const RENTABILITE_EXIGEE = TAUX_SANS_RISQUE + ACTION.beta * PRIME_DE_RISQUE_DU_MARCHE;

/** LES TAUX MONTENT D'UN POINT (hypothèse du cours) : le taux sans risque passe à 4 %, l'exigence à 10 %. */
export const HAUSSE_DES_TAUX = 0.01;

/** UNE INFORMATION (hypothèse du cours) : l'émetteur perd un grand client ; la croissance attendue du dividende tombe à 1 %. */
export const CROISSANCE_APRES_L_ANNONCE = 0.01;

/**
 * LE COURS D'UNE ACTION par l'actualisation de ses dividendes, qui croissent à un taux constant g
 * (Gordon et Shapiro) : P = D1 ÷ (k − g), k la rentabilité exigée, au-dessus de g.
 */
export const coursDeLAction = (dividende: number, exigee: number, croissance: number) => auCentime(dividende / (exigee - croissance));

/** Le cours de l'action : à l'exigence de la fiche, après la hausse des taux, après l'annonce. */
export function coursDeLActionDuCas() {
  const a = ACTION;
  return {
    ...a,
    exigee: RENTABILITE_EXIGEE,
    cours: coursDeLAction(a.dividende, RENTABILITE_EXIGEE, a.croissance),
    apresLaHausse: coursDeLAction(a.dividende, RENTABILITE_EXIGEE + HAUSSE_DES_TAUX, a.croissance),
    apresLAnnonce: coursDeLAction(a.dividende, RENTABILITE_EXIGEE, CROISSANCE_APRES_L_ANNONCE),
    /** Le rendement du dividende au cours : D1 ÷ P. */
    rendementDuDividende: a.dividende / coursDeLAction(a.dividende, RENTABILITE_EXIGEE, a.croissance),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE RISQUE DE L'ACTION
// ─────────────────────────────────────────────────────────────────────────────

/** Un état de l'économie dans un an, sa probabilité, et la rentabilité de l'action dans cet état. */
export interface Scenario {
  libelle: string;
  probabilite: number;
  rentabilite: number;
}

/**
 * LES TROIS ÉTATS DE L'ÉCONOMIE (hypothèse du cours) : une récession une fois sur quatre, où l'action
 * perd 6 % (dividende compris) ; une année ordinaire une fois sur deux, à 10 % ; une expansion une
 * fois sur quatre, à 22 %.
 */
export const SCENARIOS: readonly Scenario[] = [
  { libelle: "Récession", probabilite: 0.25, rentabilite: -0.06 },
  { libelle: "Année ordinaire", probabilite: 0.5, rentabilite: 0.1 },
  { libelle: "Expansion", probabilite: 0.25, rentabilite: 0.22 },
];

/** L'espérance et l'écart-type de la rentabilité, et le détail de chaque état (en points de pourcentage). */
export function risqueDeLAction(s: readonly Scenario[] = SCENARIOS) {
  const enPoints = (x: number) => Math.round(x * 1e6) / 1e4;
  const esperance = s.reduce((t, x) => t + x.probabilite * x.rentabilite, 0);
  const lignes = s.map((x) => {
    const r = enPoints(x.rentabilite);
    const ecart = Math.round((r - enPoints(esperance)) * 1e6) / 1e6;
    return { ...x, r, pondere: Math.round(x.probabilite * r * 1e6) / 1e6, ecart, carrePondere: Math.round(x.probabilite * ecart * ecart * 1e6) / 1e6 };
  });
  const variance = Math.round(lignes.reduce((t, x) => t + x.carrePondere, 0) * 1e6) / 1e6;
  return {
    lignes,
    /** En points de pourcentage (9 pour 9 %). */
    esperance: enPoints(esperance),
    /** En points de pourcentage au carré. */
    variance,
    /** En points de pourcentage. */
    ecartType: Math.sqrt(variance),
    /** La plus mauvaise rentabilité des états, en points. */
    pire: Math.min(...lignes.map((x) => x.r)),
  };
}

/** Le placement sans risque de comparaison : le compte à terme de NOVA, 3 %, certain. */
export const PLACEMENT_SANS_RISQUE = PLACEMENT.tauxAnnuel;

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS : L'OBLIGATION VERTE À 980 €
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'OBLIGATION À 980 € (le cas « L'obligation verte à 980 € », hypothèse du cours) : au 1er janvier
 * N+3, il reste 3 ans ; une associée de NOVA hésite à en acheter dix à 980 €, ou à laisser son argent
 * sur un compte à terme à 3 %. Elle veut un revenu sûr et peut attendre l'échéance.
 */
export const OBLIGATION_DU_CAS = { obligation: { ...OBLIGATION_VERTE, dureeRestante: 3 } as Obligation, cours: 980, quantite: 10 } as const;

/** Le cas : le coupon, le taux de rendement actuariel à 980 €, et ce que rapportent les deux placements. */
export function obligationDuCas() {
  const c = OBLIGATION_DU_CAS;
  const o = c.obligation;
  const rendement = rendementDeLObligation(o, c.cours);
  return {
    ...c,
    coupon: coupon(o),
    rendement,
    mise: auCentime(c.cours * c.quantite),
    /** Ce que les dix obligations rapportent jusqu'à l'échéance : coupons et plus-value de remboursement. */
    gain: auCentime(c.quantite * (coupon(o) * o.dureeRestante + o.nominal - c.cours)),
    plusValueParTitre: auCentime(o.nominal - c.cours),
    courant: coupon(o) / c.cours,
  };
}
