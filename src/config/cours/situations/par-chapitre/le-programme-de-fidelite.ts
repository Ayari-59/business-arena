import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_VALEUR, valeurDesComptes } from "../../chapitres/valeur-d-un-client";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR D'UN CLIENT » : LE PROGRAMME DE FIDÉLITÉ (BTS NDRC, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les chiffres sont ceux du cabinet ATLAS CONSEIL (fiche
 * monde/atlas-conseil.ts), lus par `valeurDesComptes`, le modèle du chapitre.
 *
 * L'associée du cabinet envisage une remise de fidélité sur toutes les journées des comptes, chaque
 * année, en échange d'une attrition plus faible. Elle demande si un compte vaudra plus ou moins
 * qu'aujourd'hui, et jusqu'où elle peut remiser. L'élève refait seul le chemin du chapitre : la valeur
 * vie d'aujourd'hui, simple et actualisée ; les mêmes avec le programme ; au curseur, la remise la plus
 * forte que le programme supporte ; à rebours, l'attrition qu'il faudrait atteindre ; puis la phrase
 * qu'il rend.
 *
 * LE JUGEMENT : en valeur simple, le programme paie (87 720 € contre 84 000 €) ; actualisé, il ne paie
 * pas (58 480 € contre 60 000 €). La remise se paie dès cette année, la fidélité ne rapporte que dans
 * les années lointaines, qui valent moins : c'est la valeur actualisée qui décide, et elle désigne une
 * remise plus faible (6 % au plus). Avec les constantes d'avant ce passage (10 % de remise, une
 * attrition plus faible de 20 %), le programme ne perdait que 600 € de valeur simple par compte : la
 * réponse se jouait à l'arrondi, sans jugement.
 */

/**
 * LA REMISE DE FIDÉLITÉ, hypothèse du cours : 8 % du prix de toutes les journées des comptes du
 * programme, chaque année, dès cette année. C'est l'ordre de grandeur des remises qu'un cabinet
 * accorde à ses clients réguliers par un accord-cadre.
 */
export const REMISE_DE_FIDELITE = 0.08;

/**
 * Ce que promet le programme, hypothèse du cours : une attrition plus faible de 20 % de son taux (de
 * 25 % à 20 %). C'est l'attente de l'associée, à vérifier ensuite ; le cas calcule aussi l'attrition
 * qu'il faudrait atteindre pour que le programme paie.
 */
export const BAISSE_D_ATTRITION_PROMISE = 0.2;

/** Les bornes du curseur de la remise, en pourcentage du prix des journées. */
export const REMISE_DU_CURSEUR = { min: 0, max: 15 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Ce que vaut un compte aujourd'hui, et avec le programme, en valeur simple et actualisée. */
export function programmeDeFidelite(c: Pick<Cas, "code">) {
  const x = valeurDesComptes(c);
  const marge = x.m.marge;
  const ca = x.m.chiffreDAffaires;
  const taux = x.taux;
  const remise = auCentime(ca * REMISE_DE_FIDELITE);
  const margeAvec = auCentime(marge - remise);
  const attritionAvec = x.n.attrition * (1 - BAISSE_D_ATTRITION_PROMISE);
  const simpleAvec = auCentime(margeAvec / attritionAvec);
  const actualiseeAvec = auCentime(margeAvec / (attritionAvec + taux));
  // Le curseur : la valeur actualisée d'un compte avec le programme, pour une remise de r %.
  const actualiseeALaRemise = (r: number) => (marge - (ca * r) / 100) / (attritionAvec + taux);
  // La plus forte remise entière qui garde la valeur d'aujourd'hui, actualisée puis simple.
  const remiseMaxActualisee = Math.floor(((marge - x.actualisee * (attritionAvec + taux)) / ca) * 100 + 1e-9);
  const remiseMaxSimple = Math.floor(((marge - x.simple * attritionAvec) / ca) * 100 + 1e-9);
  // À rebours : l'attrition qui, avec la remise envisagée, redonne la valeur actualisée d'aujourd'hui.
  const attritionNecessaire = auCentime((margeAvec / x.actualisee - taux) * 100);
  const perteParCompte = auCentime(x.actualisee - actualiseeAvec);
  return {
    x,
    remise,
    margeAvec,
    attritionAvec,
    dureeAvec: 1 / attritionAvec,
    simpleAvec,
    actualiseeAvec,
    gainSimple: auCentime(simpleAvec - x.simple),
    perteParCompte,
    perteSurLePortefeuille: auCentime(perteParCompte * x.n.auPremierJanvier),
    actualiseeALaRemise,
    remiseMaxActualisee,
    remiseMaxSimple,
    attritionNecessaire,
    /** L'erreur classique : compter la baisse d'attrition sans retirer la remise de la marge. */
    actualiseeSansLaRemise: auCentime(marge / (attritionAvec + taux)),
    /** Le verdict : actualisé, le programme fait-il perdre de la valeur à la remise envisagée ? */
    verdict: actualiseeAvec < x.actualisee ? ("remiser-moins" as const) : ("lancer" as const),
  };
}

export const LE_PROGRAMME_DE_FIDELITE: Situation = {
  code: "le-programme-de-fidelite",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["valeur-d-un-client"],
  commanditaire: "L'associée du cabinet",
  titre: "Le programme de fidélité",
  accroche:
    "Une remise sur toutes les journées pour garder les comptes plus longtemps : l'associée veut savoir si un compte vaudra plus, ou moins, qu'aujourd'hui, et jusqu'où remiser.",
  objectifs: [
    "Calculer la valeur vie d'un compte, simple et actualisée, avant et après une remise de fidélité",
    "Trouver au curseur la remise la plus forte que le programme supporte",
    "Retrouver à rebours l'attrition qu'il faudrait atteindre",
    "Juger entre la valeur simple et la valeur actualisée, et rédiger une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "ce cas suit les comptes d'un cabinet qui vend ses journées à des entreprises : il se joue chez ATLAS CONSEIL, le cabinet du chapitre, sur son année N figée par la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de l'associée",
      texte: () => [
        `« Je pense offrir à nos comptes une remise de fidélité de ${pct(REMISE_DE_FIDELITE, 0)} sur toutes leurs journées, chaque année, dès cette année. En échange, j'attends ${pct(BAISSE_D_ATTRITION_PROMISE, 0)} de départs en moins. Nous perdons de la marge chaque année, nous gardons nos comptes plus longtemps : au bout du compte, un compte vaudra-t-il plus ou moins qu'aujourd'hui ? Et si la remise est trop forte, jusqu'où puis-je aller ? »`,
        "Pas de cours cette fois : vous avez les chiffres de l'année N, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const { x } = programmeDeFidelite(c);
        return {
          titre: `L'année N · ${x.f.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Comptes au 1er janvier", valeurs: [qte(x.n.auPremierJanvier)] },
            { libelle: "Comptes perdus dans l'année", valeurs: [qte(x.n.perdus)] },
            { libelle: "Chiffre d'affaires d'un compte moyen", valeurs: [eur(x.m.chiffreDAffaires)] },
            { libelle: "Marge sur coûts directs d'un compte moyen", valeurs: [eur(x.m.marge)] },
            { libelle: "Taux d'actualisation du cabinet", valeurs: [pct(x.taux)] },
            { libelle: "Remise de fidélité envisagée, sur toutes les journées", valeurs: [pct(REMISE_DE_FIDELITE, 0)] },
            { libelle: "Baisse attendue de l'attrition, en part de son taux", valeurs: [pct(BAISSE_D_ATTRITION_PROMISE, 0)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la valeur vie d'un compte aujourd'hui et avec le programme, simple et actualisée, la remise la plus forte que le programme supporte, l'attrition qu'il faudrait atteindre, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Ce que vaut un compte aujourd'hui",
      notions: ["churn_rate", "customer_lifetime_value", "discounting"],
      question: () => "Calculez le taux d'attrition de l'année N, puis la valeur vie d'un compte moyen, simple, puis actualisée au taux du cabinet.",
      champs: (c) => {
        const { x } = programmeDeFidelite(c);
        return [
          { libelle: "Taux d'attrition (%)", attendu: auCentime(x.n.attrition * 100), tolerance: 0.1, calcul: `${qte(x.n.perdus)} ÷ ${qte(x.n.auPremierJanvier)} × 100 = ${pct(x.n.attrition)}` },
          { libelle: "Valeur vie simple", attendu: x.simple, calcul: `${eur(x.m.marge)} ÷ ${pct(x.n.attrition)} = ${eur(x.simple)}` },
          { libelle: "Valeur vie actualisée", attendu: x.actualisee, calcul: `${eur(x.m.marge)} ÷ (${pct(x.n.attrition)} + ${pct(x.taux)}) = ${eur(x.actualisee)}` },
        ];
      },
      explication: (c) => {
        const { x } = programmeDeFidelite(c);
        return [
          `Aujourd'hui, un compte reste ${qte(x.dureeDeVie)} ans en moyenne et laisse ${eur(x.m.marge)} chaque année : il vaut ${eur(x.simple)} en valeur simple, ${eur(x.actualisee)} actualisé. Ce sont les valeurs que le programme doit dépasser.`,
        ];
      },
    },
    {
      id: "avec-le-programme",
      type: "montants",
      titre: "Avec le programme",
      notions: ["customer_lifetime_value", "churn_rate", "contribution_margin", "discounting"],
      question: () =>
        "Avec la remise, que devient la marge annuelle d'un compte moyen ? Si l'attrition baisse comme attendu, quel est son nouveau taux, et que vaut alors un compte, en valeur simple et actualisée ?",
      champs: (c) => {
        const r = programmeDeFidelite(c);
        const x = r.x;
        return [
          { libelle: "Remise par compte et par an", attendu: r.remise, calcul: `${eur(x.m.chiffreDAffaires)} × ${pct(REMISE_DE_FIDELITE, 0)} = ${eur(r.remise)}` },
          { libelle: "Marge annuelle avec la remise", attendu: r.margeAvec, calcul: `${eur(x.m.marge)} − ${eur(r.remise)} = ${eur(r.margeAvec)}` },
          {
            libelle: "Taux d'attrition avec le programme (%)",
            attendu: auCentime(r.attritionAvec * 100),
            tolerance: 0.1,
            calcul: `${pct(x.n.attrition)} × (1 − ${pct(BAISSE_D_ATTRITION_PROMISE, 0)}) = ${pct(r.attritionAvec)}`,
          },
          { libelle: "Valeur vie simple avec le programme", attendu: r.simpleAvec, tolerance: 1, calcul: `${eur(r.margeAvec)} ÷ ${pct(r.attritionAvec)} = ${eur(r.simpleAvec)}` },
          {
            libelle: "Valeur vie actualisée avec le programme",
            attendu: r.actualiseeAvec,
            tolerance: 1,
            calcul: `${eur(r.margeAvec)} ÷ (${pct(r.attritionAvec)} + ${pct(x.taux)}) = ${eur(r.actualiseeAvec)}`,
          },
        ];
      },
      explication: (c) => {
        const r = programmeDeFidelite(c);
        const x = r.x;
        return [
          `La remise se prend sur la marge, pas sur le chiffre d'affaires : ${eur(r.remise)} de moins chaque année, soit une marge de ${eur(r.margeAvec)} au lieu de ${eur(x.m.marge)}. En échange, le compte reste ${qte(r.dureeAvec)} ans au lieu de ${qte(x.dureeDeVie)}.`,
          r.verdict === "remiser-moins"
            ? `Les deux valeurs ne disent pas la même chose : en valeur simple, un compte gagne ${eur(r.gainSimple)} ; actualisé, il perd ${eur(r.perteParCompte)}. La remise se paie dès cette année ; les années de vie gagnées viennent tard, et valent moins.`
            : `En valeur simple, un compte gagne ${eur(r.gainSimple)} ; actualisé, il gagne encore ${eur(-r.perteParCompte)}.`,
        ];
      },
    },
    {
      id: "jusqu-ou-remiser",
      type: "curseur",
      titre: "La remise que le programme supporte",
      notions: ["customer_lifetime_value", "discounting"],
      question: (c) => {
        const r = programmeDeFidelite(c);
        return `L'attrition attendue restant à ${pct(r.attritionAvec)}, faites varier la remise de fidélité de ${qte(REMISE_DU_CURSEUR.min)} % à ${qte(REMISE_DU_CURSEUR.max)} %. Une droite donne la valeur vie actualisée d'un compte avec le programme, l'autre sa valeur actualisée d'aujourd'hui. Placez le curseur sur la plus forte remise où le programme ne fait rien perdre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise de fidélité", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: programmeDeFidelite(c).remiseMaxActualisee, min: REMISE_DU_CURSEUR.min, max: REMISE_DU_CURSEUR.max }),
      zones: ["Le programme paie", "Le programme fait perdre"],
      rates: () => ({
        dessous: "À cette remise, le programme paie encore : cherchez la plus forte.",
        dessus: "À cette remise, un compte vaut moins, actualisé, qu'aujourd'hui.",
      }),
      montrer: "Montrer la remise",
      lecture: (c, remise) => {
        const r = programmeDeFidelite(c);
        const avec = auCentime(r.actualiseeALaRemise(remise));
        return [
          { libelle: "Marge annuelle avec la remise", montant: auCentime(r.x.m.marge - (r.x.m.chiffreDAffaires * remise) / 100) },
          { libelle: "Valeur vie actualisée avec le programme", montant: avec },
          { libelle: "Valeur vie actualisée aujourd'hui", montant: r.x.actualisee },
          { libelle: "Valeur gagnée ou perdue par compte", montant: auCentime(avec - r.x.actualisee), fort: true },
        ];
      },
      droites: (c) => {
        const r = programmeDeFidelite(c);
        return {
          produit: (remise) => r.actualiseeALaRemise(remise),
          cout: () => r.x.actualisee,
          libelles: ["Valeur vie actualisée avec le programme", "Valeur vie actualisée aujourd'hui"],
        };
      },
      explication: (c) => {
        const r = programmeDeFidelite(c);
        return [
          `Actualisé, le programme ne paie que jusqu'à ${qte(r.remiseMaxActualisee)} % de remise : à ${qte(r.remiseMaxActualisee + 1)} %, un compte vaut déjà moins qu'aujourd'hui. Chaque point de remise retire ${eur(auCentime(r.x.m.chiffreDAffaires / 100))} de marge par an, tant que le compte reste.`,
          `En valeur simple, on aurait cru pouvoir aller jusqu'à ${qte(r.remiseMaxSimple)} %. La remise envisagée, ${pct(REMISE_DE_FIDELITE, 0)}, tombe entre les deux : c'est la méthode qui tranche.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Ce que la remise envisagée exigerait",
      notions: ["customer_lifetime_value", "churn_rate", "discounting"],
      question: (c) => {
        const r = programmeDeFidelite(c);
        return `À la remise envisagée, que perd-on par compte en valeur actualisée, et sur les ${qte(r.x.n.auPremierJanvier)} comptes du portefeuille ? À quelle attrition faudrait-il descendre pour qu'un compte vaille, actualisé, autant qu'aujourd'hui ? En pourcentage, au centième.`;
      },
      champs: (c) => {
        const r = programmeDeFidelite(c);
        const x = r.x;
        return [
          { libelle: "Valeur actualisée perdue par compte", attendu: r.perteParCompte, tolerance: 1, calcul: `${eur(x.actualisee)} − ${eur(r.actualiseeAvec)} = ${eur(r.perteParCompte)}` },
          {
            libelle: "Valeur actualisée perdue sur le portefeuille",
            attendu: r.perteSurLePortefeuille,
            tolerance: 32,
            calcul: `${eur(r.perteParCompte)} × ${qte(x.n.auPremierJanvier)} = ${eur(r.perteSurLePortefeuille)}`,
          },
          {
            libelle: "Attrition qu'il faudrait atteindre (%)",
            attendu: r.attritionNecessaire,
            tolerance: 0.05,
            calcul: `${eur(r.margeAvec)} ÷ (attrition + ${pct(x.taux)}) = ${eur(x.actualisee)}, d'où attrition = ${eur(r.margeAvec)} ÷ ${eur(x.actualisee)} − ${pct(x.taux)} = ${qte(r.attritionNecessaire)} %`,
          },
        ];
      },
      explication: (c) => {
        const r = programmeDeFidelite(c);
        return [
          `L'attente de l'associée (${pct(r.attritionAvec)}) ne suffit pas : à ${pct(REMISE_DE_FIDELITE, 0)} de remise, il faudrait descendre à ${qte(r.attritionNecessaire)} %. Le portefeuille perdrait ${eur(r.perteSurLePortefeuille)} de valeur actualisée, alors que la valeur simple lui faisait croire à un gain.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associée",
      question: () => "Quelle phrase envoyez-vous à l'associée ?",
      options: (c) => {
        const r = programmeDeFidelite(c);
        const x = r.x;
        return [
          {
            texte: `Pas à ${pct(REMISE_DE_FIDELITE, 0)} : le programme ne paie qu'à ${qte(r.remiseMaxActualisee)} % de remise au plus`,
            juste: r.verdict === "remiser-moins",
            retour: `${r.verdict === "remiser-moins" ? "Oui" : "Non"} : actualisé, un compte vaudrait ${eur(r.actualiseeAvec)} au lieu de ${eur(x.actualisee)}. La remise se paie dès cette année, la fidélité ne rapporte que plus tard. À ${qte(r.remiseMaxActualisee)} %, le programme paie, si l'attrition tombe bien à ${pct(r.attritionAvec)} : il faudra la suivre.`,
          },
          {
            texte: `Lancer à ${pct(REMISE_DE_FIDELITE, 0)} : un compte vaudrait ${eur(r.simpleAvec)} au lieu de ${eur(x.simple)}`,
            juste: r.verdict === "lancer",
            retour: `${r.verdict === "lancer" ? "Oui" : "Non"} : c'est la valeur simple, qui compte un euro lointain comme un euro d'aujourd'hui. Actualisé au taux du cabinet, un compte vaudrait ${eur(r.actualiseeAvec)}, contre ${eur(x.actualisee)} aujourd'hui.`,
          },
          {
            texte: `Renoncer : la remise retire ${eur(r.remise)} de marge par compte et par an`,
            juste: false,
            retour: `Non : une remise ne se juge pas seule, elle se paie en années de vie gagnées. À ${pct(REMISE_DE_FIDELITE, 0)}, le programme ne paie pas ; à ${qte(r.remiseMaxActualisee)} %, il paierait : renoncer à tout programme laisserait passer cette valeur.`,
          },
          {
            texte: `Lancer à ${pct(REMISE_DE_FIDELITE, 0)} : actualisé, un compte vaudrait ${eur(r.actualiseeSansLaRemise)}, pas ${eur(x.actualisee)}`,
            juste: false,
            retour: `Non : ce calcul garde la marge d'aujourd'hui, ${eur(x.m.marge)}. Or la remise se paie chaque année : la marge tombe à ${eur(r.margeAvec)}, et la valeur actualisée à ${eur(r.actualiseeAvec)}.`,
          },
        ];
      },
    },
  ],
};
