import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { chargesFixesDuMois, coutVariable, indicateursDuMois, seuilDuPointDeVente as seuilDuMois } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, JOURS_DU_MOIS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE SEUIL DE RENTABILITÉ DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique du
 * cours, MAILLE & CO, a une fiche figée (monde/maille-et-co.ts : sa gamme, ses clientèles et ses
 * charges de janvier) et un modèle simple (monde/boutique.ts, `seuilDuPointDeVente`). Une évolution du
 * moteur ne change rien ici.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le mois du cas figé (cas.gestion : 85 610 € de chiffre
 * d'affaires, 1 530 articles à un coût variable moyen, 28 275 € de charges fixes), chez MAILLE & CO,
 * PIXEL & CO et LA TABLE D'AUGUSTIN, et le client du chapitre des indicateurs. Il lit maintenant le
 * mois de janvier de la boutique, le même dans tout le parcours MCO : 87 450 €, 948 passages en caisse,
 * des coûts variables référence par référence, et des charges fixes détaillées (30 695 €, l'équipe
 * comprise). Il se joue chez MAILLE & CO seule. Les chiffres changent : taux de marge sur coût variable
 * 50,6 % (au lieu de 49,1 %), seuil 60 661,64 €, indice de sécurité 30,6 %, point mort le 21, panier
 * plancher 64 € (au lieu de 76 €).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, la-marge, les-charges, le-seuil (la formule est au repère ou dans la question,
 *     qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-point-mort
 *     puis le-point-mort-au-curseur (le chiffre d'affaires cumulé face au seuil, jour après jour) avant
 *     le-point-mort ; predire-la-fermeture puis la-fermeture-au-curseur (la marge d'un mois amputé de
 *     jours fermés face aux charges fixes) avant ce-que-coute-un-jour-ferme ;
 *   · autonome : le-point-mort, ce-que-coute-un-jour-ferme, en-passages, le-panier-plancher (ni formule
 *     ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-panier-en-promotion (une variante chiffrée : un panier qui baisse par une remise, et
 *     non par la composition), le-plancher-en-question (une critique de la méthode : le taux de marge
 *     constant), le-laboratoire-du-seuil (passages, panier, jours de fermeture : avancer le point mort,
 *     le graphique trace le chiffre d'affaires cumulé jour par jour face au seuil), a-rebours (retrouver
 *     le chiffre d'affaires et le résultat d'un mois à partir de son indice de sécurité),
 *     une-campagne-de-plus (une variante : des charges fixes en plus) ; puis la synthèse.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : le mois commercial de 30 jours aux ventes régulières ; des
 * charges fixes qui ne bougent pas avec les ventes (l'équipe comprise) ; un taux de marge sur coût
 * variable constant, c'est-à-dire une composition des ventes qui ne change pas quand le chiffre
 * d'affaires, le panier ou les jours ouverts changent.
 */

/** Les entreprises où le chapitre se joue : la boutique du cours, seule. */
export const ENTREPRISES_DU_SEUIL: readonly string[] = ["boutique"];

/**
 * LE PANIER EN PROMOTION (hypothèse du cours, pour la variante) : le manager veut faire descendre le
 * panier moyen à 70 € par une remise sur toute la boutique, les mêmes articles se vendant aux mêmes
 * clients. Les coûts variables, eux, ne baissent pas.
 */
export const PANIER_EN_PROMOTION = 70;

/**
 * LA CAMPAGNE D'AFFICHAGE (hypothèse du cours, pour la variante) : 1 500 € de publicité de plus par
 * mois, le double du budget de publicité de la fiche.
 */
export const CAMPAGNE_D_AFFICHAGE = 1_500;

/** Le point mort à atteindre dans le laboratoire : le 18 du mois au plus tard. */
export const POINT_MORT_VISE = 18;

/** Les bornes des curseurs du chapitre. */
export const JOURS_DU_CURSEUR = { min: 0, max: JOURS_DU_MOIS } as const;
export const FERMETURE_DU_CURSEUR = { min: 0, max: 20 } as const;
export const PANIER_DU_CURSEUR = { min: 45, max: 110 } as const;

/** Les leviers du laboratoire : passages en caisse, variation du panier (en %), jours de fermeture. */
export const LEVIERS_DU_SEUIL = {
  passages: { min: 700, max: 1_200, pas: 1 },
  panier: { min: -20, max: 30, pas: 1 },
  fermeture: { min: 0, max: 10, pas: 1 },
} as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Le seuil du mois de janvier, en euros, en jours et en passages, et ses variantes. */
export function seuilDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = indicateursDuMois(f);
  const s = seuilDuMois(f);
  const charges = chargesFixesDuMois(f);
  const jours = f.joursDuMois;
  const references = f.gamme.map((r) => ({ code: r.code, nom: r.nom, ventes: r.ventesDuMois, prixHt: r.prixHt, coutVariable: coutVariable(r), coutsVariables: auCentime(r.ventesDuMois * coutVariable(r)) }));
  const taux = s.tauxDeMarge;
  const tauxEnPourcent = auDixieme(taux * 100);
  const caParJour = auCentime(s.chiffreDAffaires / jours);
  const margeParJour = auCentime(s.marge / jours);
  // Les jours de fermeture qu'un mois supporte : la marge des jours ouverts paie encore les charges fixes.
  const joursSupportables = Math.floor(jours * (1 - s.chargesFixes / s.marge) + 1e-9);
  const resultatAuxJoursSupportables = auCentime((s.marge * (jours - joursSupportables)) / jours - s.chargesFixes);
  const panierPlancher = Math.ceil(s.panierPlancher - 1e-9);
  // La variante du panier en promotion : les mêmes articles, une remise sur tout ; les coûts variables restent.
  const caEnPromotion = auCentime(s.tickets * PANIER_EN_PROMOTION);
  const margeEnPromotion = auCentime(caEnPromotion - s.coutsVariables);
  const plancherEnPromotion = Math.ceil((s.chargesFixes + s.coutsVariables) / s.tickets - 1e-9);
  // Le calcul à rebours : un mois dont l'indice de sécurité tombe au seuil d'alerte du manager.
  const indiceARebours = f.seuilsDAlerte.indiceDeSecurite.seuil;
  const caARebours = auCentime(s.seuil / (1 - indiceARebours));
  const margeARebours = auCentime(caARebours * taux);
  // La variante de la campagne : des charges fixes en plus, le même taux de marge.
  const seuilAvecLaCampagne = auCentime((s.chargesFixes + CAMPAGNE_D_AFFICHAGE) / taux);
  return {
    f,
    m,
    s,
    charges,
    jours,
    references,
    taux,
    tauxEnPourcent,
    indiceEnPourcent: auDixieme(s.indiceDeSecurite * 100),
    pointMortExact: (s.seuil / s.chiffreDAffaires) * jours,
    caParJour,
    margeParJour,
    joursSupportables,
    resultatAuxJoursSupportables,
    panier: auCentime(m.panierMoyen),
    panierPlancher,
    caEnPromotion,
    margeEnPromotion,
    resultatEnPromotion: auCentime(margeEnPromotion - s.chargesFixes),
    plancherEnPromotion,
    remiseEnPromotion: 1 - PANIER_EN_PROMOTION / m.panierMoyen,
    indiceARebours,
    caARebours,
    margeARebours,
    resultatARebours: auCentime(margeARebours - s.chargesFixes),
    seuilAvecLaCampagne,
    pointMortAvecLaCampagne: Math.ceil((seuilAvecLaCampagne / s.chiffreDAffaires) * jours - 1e-9),
    caPourLaCampagne: auCentime(CAMPAGNE_D_AFFICHAGE / taux),
  };
}

export type SeuilDeLaBoutique = ReturnType<typeof seuilDeLaBoutique>;

/** Le laboratoire du seuil : le mois pour des passages, une variation du panier (en %) et des jours de fermeture. */
export function laboratoireDuSeuil(x: SeuilDeLaBoutique, passages: number, panier: number, fermeture: number) {
  const s = seuilDuMois(x.f, { tickets: passages, panierMoyen: x.m.panierMoyen * (1 + panier / 100), joursDeFermeture: fermeture });
  const caParJourOuvert = (passages * x.m.panierMoyen * (1 + panier / 100)) / x.jours;
  return { ...s, caParJourOuvert, caCumule: (jour: number) => caParJourOuvert * Math.max(0, Math.min(jour, x.jours) - fermeture) };
}

/** La gamme de janvier, et ce que coûte un article de chaque référence : le document de départ. */
export function tableauDuMois(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = seuilDeLaBoutique(c);
  return {
    titre: `${x.f.entreprise} · janvier, ${qte(x.s.tickets)} passages en caisse`,
    colonnes: ["Vendus", "Prix hors taxes", "Coût variable d'un article"],
    lignes: [
      ...x.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.ventes), eur(r.prixHt), eur(r.coutVariable)] })),
      { libelle: "Total du mois", valeurs: [qte(x.m.articles), `${eur(x.s.chiffreDAffaires)} de chiffre d'affaires`, ""] },
    ],
  };
}

const HYPOTHESE_DU_TAUX =
  "La simulation garde la composition des ventes de janvier : quand le chiffre d'affaires change, chaque référence change dans la même proportion, et le taux de marge sur coût variable reste le même.";

export const SEUIL_DU_POINT_DE_VENTE: Chapitre = {
  code: "seuil-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle", "BUT TC · Piloter un espace de vente"],
  titre: "Le seuil de rentabilité du point de vente",
  accroche:
    "À partir de quel chiffre d'affaires, de quel jour du mois, de combien de passages en caisse la boutique gagne-t-elle de l'argent ? Combien de jours peut-elle fermer, jusqu'où peut descendre le panier, et qu'est-ce qui avance son point mort ?",
  objectifs: [
    "Calculer la marge sur coût variable, son taux, et séparer charges fixes et charges variables",
    "Calculer le seuil de rentabilité, la marge et l'indice de sécurité",
    "Dater le point mort dans le mois, et chiffrer ce que coûte un jour de fermeture",
    "Traduire le seuil en passages en caisse et en panier plancher, et critiquer ce plancher",
    "Retrouver à rebours le chiffre d'affaires d'un mois, et refaire le seuil avec des charges fixes en plus",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL,
    pourquoi:
      "ce chapitre se joue dans la boutique du cours, MAILLE & CO, dont la simulation suit les ventes et les passages en caisse jour par jour : le même point de vente d'un chapitre MCO à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le jour où l'on commence à gagner",
      notions: ["breakeven", "dead_point"],
      tableau: tableauDuMois,
      texte: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, sur le mois de ${x.f.moisDeReference} : ${eur(x.s.chiffreDAffaires)} de chiffre d'affaires hors taxes, ${qte(x.m.articles)} articles, ${qte(x.s.tickets)} passages en caisse. Chaque article vendu coûte son prix d'achat et ses autres coûts variables (${x.f.autresCoutsVariables}) ; le mois porte aussi ${eur(x.s.chargesFixes)} de charges fixes : le loyer, l'équipe, la publicité, l'entretien, l'usure du rayonnage.`,
          `La simulation suppose un mois commercial de ${qte(x.jours)} jours, aux ventes régulières, et des charges fixes qui ne bougent pas avec les ventes. ${HYPOTHESE_DU_TAUX}`,
          "Les premiers jours du mois, la marge rembourse les charges fixes ; le point de vente ne gagne de l'argent qu'une fois qu'elles sont couvertes. Le manager veut savoir quand.",
        ];
      },
      repere: () =>
        "Marge sur coût variable = chiffre d'affaires − coûts variables. Seuil de rentabilité = charges fixes ÷ taux de marge sur coût variable. Point mort = seuil ÷ chiffre d'affaires × 30 jours.",
    },
    {
      id: "la-marge",
      objectifs: [0],
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["contribution_margin", "variable_costs"],
      tableau: tableauDuMois,
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Calculez les coûts variables du mois (pour chaque référence, les articles vendus × le coût variable d'un article, puis la somme), la marge sur coût variable (${eur(x.s.chiffreDAffaires)} moins ces coûts), puis son taux en pourcentage du chiffre d'affaires, au dixième.`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          {
            libelle: "Coûts variables du mois",
            attendu: x.s.coutsVariables,
            calcul: `${x.references.map((r) => `${qte(r.ventes)} × ${eur(r.coutVariable)}`).join(" + ")} = ${eur(x.s.coutsVariables)}`,
          },
          { libelle: "Marge sur coût variable", attendu: x.s.marge, calcul: `${eur(x.s.chiffreDAffaires)} − ${eur(x.s.coutsVariables)} = ${eur(x.s.marge)}` },
          { libelle: "Taux de marge sur coût variable (%)", attendu: x.tauxEnPourcent, tolerance: 0.1, calcul: `${eur(x.s.marge)} ÷ ${eur(x.s.chiffreDAffaires)} × 100 = ${pct(x.tauxEnPourcent)}` },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [`Sur 100 € de ventes, ${pct(x.tauxEnPourcent)} restent pour payer les charges fixes, une fois réglé ce qu'il a fallu acheter et dépenser pour vendre.`];
      },
    },
    {
      id: "les-charges",
      objectifs: [0],
      type: "tri",
      titre: "Fixes ou variables",
      notions: ["fixed_costs", "variable_costs"],
      question: () =>
        "Rangez chaque charge du mois : variable, si elle suit les articles vendus ; fixe, si elle est due même quand la boutique vend moins. Dans la simulation, l'équipe est payée au mois, quelles que soient les ventes.",
      categories: [
        { code: "variable", libelle: "Charge variable" },
        { code: "fixe", libelle: "Charge fixe" },
      ],
      elements: (c) => {
        const x = seuilDeLaBoutique(c);
        const achats = auCentime(x.f.gamme.reduce((t, r) => t + r.ventesDuMois * r.coutDAchat, 0));
        const k = x.charges;
        return [
          { libelle: "Prix d'achat des articles vendus", montant: achats, categorie: "variable", pourquoi: "Chaque article vendu a d'abord été acheté au façonnier : un article de plus, un achat de plus." },
          { libelle: "Emballages, étiquettes et frais de carte", montant: auCentime(x.s.coutsVariables - achats), categorie: "variable", pourquoi: "Ils accompagnent chaque vente, article par article." },
          { libelle: "Loyer et frais du local", montant: k.loyer, categorie: "fixe", pourquoi: "Le bail court, que la boutique vende ou non." },
          { libelle: "Salaires et cotisations de l'équipe", montant: k.personnel, categorie: "fixe", pourquoi: "L'équipe est payée au mois, sur ses heures de contrat." },
          { libelle: "Publicité", montant: k.publicite, categorie: "fixe", pourquoi: "Un budget décidé à l'avance, qui ne suit pas les ventes du mois." },
          { libelle: "Entretien de la boutique et de la vitrine", montant: k.entretien, categorie: "fixe", pourquoi: "Un contrat au mois." },
          { libelle: "Usure du rayonnage", montant: k.amortissement, categorie: "fixe", pourquoi: "L'amortissement court au même rythme chaque mois." },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Les charges fixes du mois font ${eur(x.s.chargesFixes)}, dont ${eur(x.charges.personnel)} pour l'équipe. Les charges variables, ${eur(x.s.coutsVariables)}, sont les coûts variables de l'étape précédente : le seuil ne mélange jamais les deux.`,
        ];
      },
    },
    {
      id: "le-seuil",
      objectifs: [1],
      type: "montants",
      titre: "Le seuil en chiffre d'affaires",
      notions: ["breakeven", "safety_margin"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        const k = x.charges;
        return `Additionnez les charges fixes du mois (loyer ${eur(k.loyer)}, équipe ${eur(k.personnel)}, publicité ${eur(k.publicite)}, entretien ${eur(k.entretien)}, usure ${eur(k.amortissement)}). Avec un taux de marge sur coût variable de ${pct(x.tauxEnPourcent)}, calculez le seuil de rentabilité, la marge de sécurité (chiffre d'affaires moins seuil), puis l'indice de sécurité (marge de sécurité ÷ chiffre d'affaires, au dixième).`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        const k = x.charges;
        return [
          { libelle: "Charges fixes du mois", attendu: x.s.chargesFixes, calcul: `${[k.loyer, k.personnel, k.publicite, k.entretien, k.amortissement].map(eur).join(" + ")} = ${eur(x.s.chargesFixes)}` },
          { libelle: "Seuil de rentabilité", attendu: x.s.seuil, tolerance: 2, calcul: `${eur(x.s.chargesFixes)} ÷ ${pct(x.tauxEnPourcent)} = ${eur(x.s.seuil)}, au taux exact de ${eur(x.s.marge)} ÷ ${eur(x.s.chiffreDAffaires)}` },
          { libelle: "Marge de sécurité", attendu: x.s.margeDeSecurite, tolerance: 2, calcul: `${eur(x.s.chiffreDAffaires)} − ${eur(x.s.seuil)} = ${eur(x.s.margeDeSecurite)}` },
          { libelle: "Indice de sécurité (%)", attendu: x.indiceEnPourcent, tolerance: 0.1, calcul: `${eur(x.s.margeDeSecurite)} ÷ ${eur(x.s.chiffreDAffaires)} × 100 = ${pct(x.indiceEnPourcent)}` },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Au-delà de ${eur(x.s.seuil)} de ventes, ${x.f.entreprise} gagne de l'argent. Son chiffre d'affaires peut baisser de ${pct(x.indiceEnPourcent)} avant qu'elle n'en perde : c'est sa marge d'erreur.`,
        ];
      },
    },
    {
      id: "predire-le-point-mort",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le point mort",
      notions: ["dead_point"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Avant de calculer, pariez. Le seuil, ${eur(x.s.seuil)}, vaut ${pct(Math.round((x.s.seuil / x.s.chiffreDAffaires) * 100))} du chiffre d'affaires du mois, et les ventes tombent régulièrement, environ ${eur(x.caParJour)} par jour. Quand la boutique commence-t-elle à gagner de l'argent ?`;
      },
      options: () => {
        const voir = "Faites défiler le mois à l'étape suivante : le curseur montre le jour où le chiffre d'affaires cumulé rattrape le seuil.";
        return [
          { texte: "Vers le 21 : quand les ventes cumulées atteignent le seuil", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le 30 : le résultat ne se constate qu'en fin de mois", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Vers le 9 : passé l'indice de sécurité", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-point-mort-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Faites défiler le mois",
      notions: ["dead_point", "breakeven"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Faites défiler les jours du mois. Une droite donne le chiffre d'affaires cumulé depuis le 1er, ${eur(x.caParJour)} par jour ; l'autre, le seuil de rentabilité. Placez le curseur sur le premier jour où le chiffre d'affaires cumulé atteint le seuil, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jour du mois", unite: "jours" }),
      cible: (c) => {
        const x = seuilDeLaBoutique(c);
        return { attendu: x.s.pointMort!, min: JOURS_DU_CURSEUR.min, max: JOURS_DU_CURSEUR.max };
      },
      zones: ["La boutique gagne de l'argent", "Les charges fixes ne sont pas couvertes"],
      rates: () => ({
        dessous: "Ce jour-là, le chiffre d'affaires cumulé n'atteint pas encore le seuil : les charges fixes ne sont pas couvertes.",
        dessus: "Plus tôt, le seuil est déjà atteint : cherchez le premier jour.",
      }),
      montrer: "Montrer le point mort",
      lecture: (c, j) => {
        const x = seuilDeLaBoutique(c);
        const ca = auCentime(x.caParJour * j);
        const marge = auCentime(x.margeParJour * j);
        return [
          { libelle: "Chiffre d'affaires cumulé", montant: ca },
          { libelle: "Marge sur coût variable cumulée", montant: marge },
          { libelle: "Charges fixes du mois", montant: x.s.chargesFixes },
          { libelle: "Résultat cumulé", montant: auCentime(marge - x.s.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const x = seuilDeLaBoutique(c);
        return { produit: (j) => x.caParJour * j, cout: () => x.s.seuil, libelles: ["Chiffre d'affaires cumulé", "Seuil de rentabilité"] };
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Le chiffre d'affaires cumulé passe le seuil le ${qte(x.s.pointMort!)} du mois : ce jour-là, la marge cumulée rattrape les charges fixes, et le résultat cumulé devient positif. Avant, la boutique travaille pour payer son loyer et son équipe ; après, chaque vente lui laisse ${pct(x.tauxEnPourcent)} de son prix.`,
        ];
      },
    },
    {
      id: "le-point-mort",
      objectifs: [2],
      type: "montants",
      titre: "Le point mort",
      notions: ["dead_point"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Retrouvez le point mort par le calcul (seuil ÷ chiffre d'affaires × ${qte(x.jours)} jours, arrondi au jour supérieur), puis la marge que la boutique gagne chaque jour, et son résultat du mois.`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          { libelle: "Point mort (jour du mois)", attendu: x.s.pointMort!, calcul: `${eur(x.s.seuil)} ÷ ${eur(x.s.chiffreDAffaires)} × ${qte(x.jours)} = ${qte(auCentime(x.pointMortExact))}, le ${qte(x.s.pointMort!)}` },
          { libelle: "Marge sur coût variable d'un jour", attendu: x.margeParJour, calcul: `${eur(x.s.marge)} ÷ ${qte(x.jours)} = ${eur(x.margeParJour)}` },
          { libelle: "Résultat du mois", attendu: x.s.resultat, calcul: `${eur(x.s.marge)} − ${eur(x.s.chargesFixes)} = ${eur(x.s.resultat)}` },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `C'est le jour trouvé au curseur. Du 1er au ${qte(x.s.pointMort!)}, la boutique paie ses charges fixes ; les jours suivants font son bénéfice, ${eur(x.s.resultat)}. Chaque jour de vente rapporte ${eur(x.margeParJour)} de marge : un jour perdu, c'est autant de bénéfice en moins.`,
        ];
      },
    },
    {
      id: "predire-la-fermeture",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les jours de fermeture",
      notions: ["safety_margin", "fixed_costs"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `La boutique gagne ${eur(x.s.resultat)} sur un mois normal. Des travaux pourraient la fermer quelques jours en début de mois ; les charges fixes, elles, courent. Pariez : combien de jours peut-elle fermer sans perdre d'argent sur le mois ?`;
      },
      options: (c) => {
        const x = seuilDeLaBoutique(c);
        const voir = "Fermez la boutique au curseur de l'étape suivante, jour par jour, et regardez la marge face aux charges fixes.";
        return [
          { texte: `${qte(x.s.pointMort! - 1)} jours : avant le ${qte(x.s.pointMort!)}, elle ne gagne encore rien`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant de jours que l'indice de sécurité en laisse", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Aucun : un jour fermé fait toujours perdre de l'argent", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-fermeture-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Fermez la boutique",
      notions: ["safety_margin", "fixed_costs"],
      question: () =>
        "Faites varier les jours de fermeture en début de mois. Une droite donne la marge sur coût variable des jours ouverts, l'autre les charges fixes du mois, qui ne s'arrêtent pas. Placez le curseur sur le plus grand nombre de jours fermés qui ne fait pas perdre d'argent, puis validez.",
      grandeur: () => ({ libelle: "Jours de fermeture", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: seuilDeLaBoutique(c).joursSupportables, min: FERMETURE_DU_CURSEUR.min, max: FERMETURE_DU_CURSEUR.max }),
      zones: ["Bénéfice malgré la fermeture", "Perte du mois"],
      rates: () => ({
        dessous: "La boutique peut fermer plus longtemps sans perdre d'argent : cherchez le plus grand nombre de jours.",
        dessus: "À ce nombre de jours, la marge des jours ouverts ne paie plus les charges fixes.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const x = seuilDeLaBoutique(c);
        const ca = auCentime((x.s.chiffreDAffaires * (x.jours - j)) / x.jours);
        const marge = auCentime((x.s.marge * (x.jours - j)) / x.jours);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: "Marge sur coût variable", montant: marge },
          { libelle: "Charges fixes du mois", montant: x.s.chargesFixes },
          { libelle: "Résultat du mois", montant: auCentime(marge - x.s.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const x = seuilDeLaBoutique(c);
        return { produit: (j) => (x.s.marge * (x.jours - j)) / x.jours, cout: () => x.s.chargesFixes, libelles: ["Marge des jours ouverts", "Charges fixes du mois"] };
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `La boutique supporte ${qte(x.joursSupportables)} jours de fermeture : il lui reste alors ${eur(x.resultatAuxJoursSupportables)}. Au jour suivant, elle perd de l'argent. Chaque jour fermé retire ${eur(x.margeParJour)} de marge, et les charges fixes restent à ${eur(x.s.chargesFixes)}.`,
          `${qte(x.joursSupportables)} jours sur ${qte(x.jours)}, c'est l'indice de sécurité, ${pct(x.indiceEnPourcent)}, vu en jours : les jours qui suivent le point mort, ceux qui font le bénéfice. C'est la formule que l'étape suivante fait calculer.`,
        ];
      },
    },
    {
      id: "ce-que-coute-un-jour-ferme",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte un jour fermé",
      notions: ["safety_margin", "fixed_costs", "contribution_margin"],
      question: () =>
        "Sans formule cette fois. Calculez la marge qu'un jour de fermeture fait perdre, le nombre de jours de fermeture que le mois supporte (par l'indice de sécurité, arrondi au jour inférieur), et le résultat du mois à cette limite.",
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        const ouverts = x.jours - x.joursSupportables;
        return [
          { libelle: "Marge perdue par jour fermé", attendu: x.margeParJour, calcul: `${eur(x.s.marge)} ÷ ${qte(x.jours)} = ${eur(x.margeParJour)}` },
          { libelle: "Jours de fermeture supportables", attendu: x.joursSupportables, calcul: `${pct(x.indiceEnPourcent)} × ${qte(x.jours)} = ${qte(auDixieme((x.s.indiceDeSecurite * x.jours)))}, soit ${qte(x.joursSupportables)} jours` },
          {
            libelle: "Résultat avec ces jours fermés",
            attendu: x.resultatAuxJoursSupportables,
            tolerance: 1,
            calcul: `${eur(x.s.marge)} × ${qte(ouverts)} ÷ ${qte(x.jours)} − ${eur(x.s.chargesFixes)} = ${eur(x.resultatAuxJoursSupportables)}`,
          },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Une fermeture ne coûte pas son chiffre d'affaires, ${eur(x.caParJour)} par jour, mais sa marge, ${eur(x.margeParJour)} : les articles non vendus n'ont pas été achetés. Elle ne baisse pas non plus les charges fixes : c'est pourquoi le résultat fond bien plus vite que les ventes.`,
        ];
      },
    },
    {
      id: "en-passages",
      objectifs: [3],
      type: "montants",
      titre: "Le seuil en passages en caisse",
      notions: ["breakeven", "average_basket"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Le manager pense en clients. Avec ${qte(x.s.tickets)} passages en caisse ce mois-ci, quel est le panier moyen (au centime) ? Combien de passages faut-il au minimum, à ce panier, pour atteindre le seuil ?`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          { libelle: "Panier moyen", attendu: x.panier, tolerance: 0.01, calcul: `${eur(x.s.chiffreDAffaires)} ÷ ${qte(x.s.tickets)} = ${eur(x.panier)}` },
          { libelle: "Passages en caisse au seuil", attendu: x.s.ticketsAuSeuil, tolerance: 1, calcul: `${eur(x.s.seuil)} ÷ ${eur(x.panier)} = ${qte(x.s.ticketsAuSeuil)}, arrondi au-dessus` },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [`Il faut ${qte(x.s.ticketsAuSeuil)} passages en caisse pour couvrir le mois ; ${x.f.entreprise} en a eu ${qte(x.s.tickets)}. C'est un objectif que toute l'équipe comprend.`];
      },
    },
    {
      id: "le-panier-plancher",
      objectifs: [3],
      type: "curseur",
      titre: "Le panier plancher",
      notions: ["breakeven", "average_basket"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Les passages en caisse restent ${qte(x.s.tickets)} par mois, et la composition des ventes celle de janvier. Faites varier le panier moyen, et placez le curseur sur le plus petit, à l'euro, qui ne fait pas perdre d'argent à ${x.f.entreprise}.`;
      },
      grandeur: () => ({ libelle: "Panier moyen", unite: "€" }),
      cible: (c) => ({ attendu: seuilDeLaBoutique(c).panierPlancher, min: PANIER_DU_CURSEUR.min, max: PANIER_DU_CURSEUR.max }),
      lecture: (c, p) => {
        const x = seuilDeLaBoutique(c);
        const ca = auCentime(x.s.tickets * p);
        const marge = auCentime(ca * x.taux);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: "Marge sur coût variable", montant: marge },
          { libelle: "Charges fixes", montant: x.s.chargesFixes },
          { libelle: "Résultat du mois", montant: auCentime(marge - x.s.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const x = seuilDeLaBoutique(c);
        return { produit: (p) => x.s.tickets * p * x.taux, cout: () => x.s.chargesFixes, libelles: ["Marge sur coût variable", "Charges fixes"] };
      },
      rates: () => ({
        dessous: "À ce panier, la marge du mois ne paie pas les charges fixes.",
        dessus: "Plus bas, la marge paie encore les charges fixes : cherchez le plus petit panier.",
      }),
      montrer: "Montrer le panier plancher",
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Avec les mêmes passages en caisse, le panier moyen peut descendre jusqu'à ${eur(x.panierPlancher)} au lieu de ${eur(x.panier)} avant que ${x.f.entreprise} ne perde de l'argent : c'est le seuil divisé par les passages. Le curseur suppose que le panier baisse à composition constante, avec le même taux de marge ; l'étape suivante regarde ce que devient ce plancher quand le panier baisse par une remise.`,
        ];
      },
    },
    {
      id: "le-panier-en-promotion",
      objectifs: [3],
      type: "montants",
      titre: "Variante : un panier qui baisse par la remise",
      notions: ["breakeven", "average_basket", "contribution_margin"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Variante : le manager veut faire descendre le panier à ${eur(PANIER_EN_PROMOTION)} par une remise sur toute la boutique. Les mêmes ${qte(x.s.tickets)} clients achètent les mêmes articles : les coûts variables restent ${eur(x.s.coutsVariables)}. Calculez le chiffre d'affaires du mois, la marge sur coût variable, le résultat (négatif en cas de perte), puis le vrai panier plancher d'une remise, à l'euro supérieur.`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          { libelle: "Chiffre d'affaires avec la remise", attendu: x.caEnPromotion, calcul: `${qte(x.s.tickets)} × ${eur(PANIER_EN_PROMOTION)} = ${eur(x.caEnPromotion)}` },
          { libelle: "Marge sur coût variable avec la remise", attendu: x.margeEnPromotion, calcul: `${eur(x.caEnPromotion)} − ${eur(x.s.coutsVariables)} = ${eur(x.margeEnPromotion)}` },
          { libelle: "Résultat du mois avec la remise", attendu: x.resultatEnPromotion, calcul: `${eur(x.margeEnPromotion)} − ${eur(x.s.chargesFixes)} = ${eur(x.resultatEnPromotion)}` },
          {
            libelle: "Panier plancher d'une remise",
            attendu: x.plancherEnPromotion,
            calcul: `(${eur(x.s.chargesFixes)} + ${eur(x.s.coutsVariables)}) ÷ ${qte(x.s.tickets)} = ${eur(auCentime((x.s.chargesFixes + x.s.coutsVariables) / x.s.tickets))}, soit ${eur(x.plancherEnPromotion)}`,
          },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `À ${eur(PANIER_EN_PROMOTION)}, la remise de ${pct(auDixieme(x.remiseEnPromotion * 100))} ne retire rien aux coûts : le taux de marge tombe à ${pct(auDixieme((x.margeEnPromotion / x.caEnPromotion) * 100))}, et le mois perd ${eur(-x.resultatEnPromotion)}. Quand le panier baisse par le prix, son plancher est de ${eur(x.plancherEnPromotion)}, pas ${eur(x.panierPlancher)} : il doit payer les charges fixes et les articles eux-mêmes.`,
        ];
      },
    },
    {
      id: "le-plancher-en-question",
      objectifs: [3],
      type: "choix",
      titre: "Ce que suppose le panier plancher",
      notions: ["breakeven", "average_basket"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Le panier plancher de ${eur(x.panierPlancher)} se calcule au taux de marge de janvier, ${pct(x.tauxEnPourcent)}. Le manager veut l'afficher en caisse comme une limite à ne pas franchir. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          {
            texte: "Il ne vaut que si le panier baisse sans toucher au taux de marge : par la remise, le plancher monte",
            juste: true,
            retour: `Oui. ${eur(x.panierPlancher)} suppose les mêmes articles dans les mêmes proportions, aux mêmes prix. Un panier plus petit par la remise garde ses coûts : son plancher est de ${eur(x.plancherEnPromotion)}. Et une composition différente change aussi le taux : il faut refaire le calcul, pas lire le plancher.`,
          },
          {
            texte: "Il vaut pour toute baisse du panier : le seuil ne dépend que des charges fixes",
            juste: false,
            retour: `Non : le seuil dépend aussi du taux de marge. Une remise le fait chuter, et le plancher monte à ${eur(x.plancherEnPromotion)}.`,
          },
          {
            texte: "Il est trop prudent : la boutique ne perd qu'au-dessous du coût variable d'un panier",
            juste: false,
            retour: `Non : c'est oublier les charges fixes. Sous ${eur(x.panierPlancher)} de panier, avec les mêmes passages, la marge du mois ne paie plus les ${eur(x.s.chargesFixes)} de charges fixes.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-du-seuil",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du seuil",
      notions: ["breakeven", "dead_point", "safety_margin"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Faites jouer les passages en caisse, le panier moyen et des jours de fermeture en début de mois ; le tableau suit le seuil, le résultat et le point mort. Le graphique trace le chiffre d'affaires cumulé jour par jour face au seuil : faites glisser le jour lu. ${HYPOTHESE_DU_TAUX} Le point mort de janvier tombe le ${qte(x.s.pointMort!)}.`;
      },
      leviers: (c) => {
        const x = seuilDeLaBoutique(c);
        const L = LEVIERS_DU_SEUIL;
        return [
          { code: "passages", libelle: "Passages en caisse du mois", unite: "passages", ...L.passages, depart: x.s.tickets },
          { code: "panier", libelle: "Variation du panier moyen", unite: "%", ...L.panier, depart: 0 },
          { code: "fermeture", libelle: "Jours de fermeture en début de mois", unite: "jours", ...L.fermeture, depart: 0 },
          { code: "jour", libelle: "Jour du mois lu", unite: "jour", min: 0, max: x.jours, pas: 1, depart: x.jours },
        ];
      },
      lecture: (c, p) => {
        const x = seuilDeLaBoutique(c);
        const l = laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!);
        const d = laboratoireDuSeuil(x, x.s.tickets, 0, 0);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: l.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Seuil de rentabilité", montant: l.seuil, reference: d.seuil },
          { libelle: "Chiffre d'affaires cumulé au jour lu", montant: auCentime(l.caCumule(p.jour!)) },
          { libelle: l.pointMort === null ? "Point mort, pas atteint dans le mois" : "Point mort, jour du mois", montant: l.pointMort ?? 0, reference: d.pointMort!, unite: "jour" },
          { libelle: "Indice de sécurité", montant: auDixieme(l.indiceDeSecurite * 100), reference: auDixieme(d.indiceDeSecurite * 100), unite: "%" },
          { libelle: "Résultat du mois", montant: l.resultat, reference: d.resultat, effet: true, fort: true },
        ];
      },
      // Le chiffre d'affaires cumulé, jour après jour : plat pendant la fermeture, puis une droite dont
      // la pente est le chiffre d'affaires d'un jour ouvert ; elle croise le seuil au point mort.
      graphique: (c) => {
        const x = seuilDeLaBoutique(c);
        return {
          levier: "jour",
          courbes: [
            { libelle: "Chiffre d'affaires cumulé", valeur: (p) => laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!).caCumule(p.jour!) },
            { libelle: "Seuil de rentabilité", valeur: (p) => laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!).seuil },
          ],
        };
      },
      defi: (c) => {
        const x = seuilDeLaBoutique(c);
        const atteint = (p: Readonly<Record<string, number>>) => {
          const l = laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!);
          return l.pointMort !== null && l.pointMort <= POINT_MORT_VISE;
        };
        return {
          consigne: `Avancez le point mort au ${qte(POINT_MORT_VISE)} du mois au plus tard.`,
          atteint,
          indice: (p) => {
            const l = laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!);
            const ouverts = POINT_MORT_VISE - p.fermeture!;
            if (ouverts <= 0) return `Avec ${qte(p.fermeture!)} jours de fermeture, la boutique n'a aucun jour de vente avant le ${qte(POINT_MORT_VISE)} : rouvrez-la.`;
            const necessaire = auCentime((l.seuil / ouverts) * x.jours);
            return `Le seuil reste à ${eur(l.seuil)}. Pour l'atteindre en ${qte(ouverts)} jours de vente, il faut ${eur(necessaire)} de chiffre d'affaires sur un mois plein ; vous en êtes à ${eur(auCentime(l.caParJourOuvert * x.jours))}.`;
          },
          solution: { passages: 1_000, panier: 10, fermeture: 0, jour: POINT_MORT_VISE },
        };
      },
      montrer: "Montrer une solution",
      explication: (c, p) => {
        const x = seuilDeLaBoutique(c);
        const l = laboratoireDuSeuil(x, p.passages!, p.panier!, p.fermeture!);
        const hausse = (l.caParJourOuvert * x.jours) / x.s.chiffreDAffaires - 1;
        return [
          `Le point mort tombe le ${qte(l.pointMort!)} : il a fallu ${signe(auDixieme(hausse * 100))} de chiffre d'affaires sur un mois plein. Le seuil, lui, n'a pas bougé (${eur(l.seuil)}) : il ne dépend que des charges fixes et du taux de marge. Plus de ventes ne baissent pas le seuil, elles l'atteignent plus tôt.`,
          `Un jour de fermeture recule le point mort d'un jour entier ; une hausse des ventes ne l'avance que peu à peu, parce que le point mort est le seuil divisé par le chiffre d'affaires d'un jour. Avancer le point mort de ${qte(x.s.pointMort! - POINT_MORT_VISE)} jours demande plus de ${qte(x.s.pointMort! - POINT_MORT_VISE)} jours de ventes en plus : il faut tenir le nouveau rythme tout le mois.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver le mois à rebours",
      notions: ["safety_margin", "breakeven"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `En février, le tableau de bord n'affiche plus qu'un indice de sécurité de ${pct(x.indiceARebours * 100)}, le seuil d'alerte du manager. Les charges fixes et le taux de marge sur coût variable sont ceux de janvier. Retrouvez le chiffre d'affaires de février, sa marge sur coût variable, puis son résultat.`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          {
            libelle: "Chiffre d'affaires de février",
            attendu: x.caARebours,
            tolerance: 2,
            calcul: `L'indice vaut (chiffre d'affaires − seuil) ÷ chiffre d'affaires : ${eur(x.s.seuil)} ÷ (1 − ${pct(x.indiceARebours * 100)}) = ${eur(x.caARebours)}`,
          },
          { libelle: "Marge sur coût variable de février", attendu: x.margeARebours, tolerance: 2, calcul: `${eur(x.caARebours)} × ${pct(x.tauxEnPourcent)} = ${eur(x.margeARebours)}` },
          { libelle: "Résultat de février", attendu: x.resultatARebours, tolerance: 2, calcul: `${eur(x.margeARebours)} − ${eur(x.s.chargesFixes)} = ${eur(x.resultatARebours)}` },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `À ${pct(x.indiceARebours * 100)} d'indice, le chiffre d'affaires de février n'est que de ${eur(x.caARebours)}, et le résultat de ${eur(x.resultatARebours)}. Vérification : le résultat vaut la marge de sécurité multipliée par le taux de marge, ${eur(auCentime(x.caARebours - x.s.seuil))} × ${pct(x.tauxEnPourcent)}. Un indicateur de risque se retraduit en euros dès qu'on sait ce qu'il compare.`,
        ];
      },
    },
    {
      id: "une-campagne-de-plus",
      objectifs: [4],
      type: "montants",
      titre: "Variante : une campagne d'affichage",
      notions: ["breakeven", "dead_point", "fixed_costs"],
      question: (c) => {
        const x = seuilDeLaBoutique(c);
        return `Variante : une campagne d'affichage ajoute ${eur(CAMPAGNE_D_AFFICHAGE)} de charges fixes au mois. Le taux de marge ne change pas, et le chiffre d'affaires reste d'abord celui de janvier, ${eur(x.s.chiffreDAffaires)}. Calculez le nouveau seuil, le nouveau point mort, puis le chiffre d'affaires en plus que la campagne doit apporter pour se payer.`;
      },
      champs: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          {
            libelle: "Seuil avec la campagne",
            attendu: x.seuilAvecLaCampagne,
            tolerance: 3,
            calcul: `(${eur(x.s.chargesFixes)} + ${eur(CAMPAGNE_D_AFFICHAGE)}) ÷ ${pct(x.tauxEnPourcent)} = ${eur(x.seuilAvecLaCampagne)}`,
          },
          {
            libelle: "Point mort avec la campagne (jour du mois)",
            attendu: x.pointMortAvecLaCampagne,
            calcul: `${eur(x.seuilAvecLaCampagne)} ÷ ${eur(x.s.chiffreDAffaires)} × ${qte(x.jours)} = ${qte(auCentime((x.seuilAvecLaCampagne / x.s.chiffreDAffaires) * x.jours))}, le ${qte(x.pointMortAvecLaCampagne)}`,
          },
          {
            libelle: "Chiffre d'affaires en plus pour payer la campagne",
            attendu: x.caPourLaCampagne,
            tolerance: 2,
            calcul: `${eur(CAMPAGNE_D_AFFICHAGE)} ÷ ${pct(x.tauxEnPourcent)} = ${eur(x.caPourLaCampagne)}, l'écart entre les deux seuils`,
          },
        ];
      },
      explication: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `Une charge fixe de ${eur(CAMPAGNE_D_AFFICHAGE)} se paie avec ${eur(x.caPourLaCampagne)} de ventes : chaque euro de charge fixe demande 1 ÷ ${pct(x.tauxEnPourcent)} de chiffre d'affaires. Si la campagne n'amène pas ces ventes, le point mort recule au ${qte(x.pointMortAvecLaCampagne)} et le résultat baisse de ${eur(CAMPAGNE_D_AFFICHAGE)}, à ${eur(x.s.resultat - CAMPAGNE_D_AFFICHAGE)}.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["breakeven", "dead_point", "safety_margin"],
      texte: (c) => {
        const x = seuilDeLaBoutique(c);
        return [
          `En janvier, ${x.f.entreprise} couvre ses ${eur(x.s.chargesFixes)} de charges fixes à ${eur(x.s.seuil)} de chiffre d'affaires, au taux de marge sur coût variable de ${pct(x.tauxEnPourcent)}. Son indice de sécurité, ${pct(x.indiceEnPourcent)}, se lit en jours : point mort le ${qte(x.s.pointMort!)}, ${qte(x.joursSupportables)} jours de fermeture au plus. Il se lit en clients : ${qte(x.s.ticketsAuSeuil)} passages en caisse, un panier plancher de ${eur(x.panierPlancher)} à composition constante.`,
          `Trois pièges. Un jour fermé coûte sa marge, pas son chiffre d'affaires, et les charges fixes courent : le résultat fond plus vite que les ventes. Le seuil ne bouge pas quand les ventes montent ; seul le point mort avance. Et le panier plancher suppose un taux de marge constant : par la remise, il monte à ${eur(x.plancherEnPromotion)}.`,
          "Au niveau de l'examen, vous savez séparer charges fixes et variables, calculer un seuil, une marge et un indice de sécurité, dater un point mort, traduire le seuil en passages et en panier, retrouver un chiffre d'affaires à rebours, et dire ce que vaut une charge fixe de plus en ventes.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Seuil = charges fixes ÷ taux de marge sur coût variable. Indice de sécurité = (chiffre d'affaires − seuil) ÷ chiffre d'affaires. Point mort = seuil ÷ chiffre d'affaires × 30 jours, plus les jours fermés en début de mois.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT COMPATIBLE, POUR LES CHAPITRES QUI LE LISENT ENCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Le seuil du mois du cas figé (cas.gestion, monde/cas-des-entreprises.ts), tel que le
 * chapitre le calculait avant de passer sur la boutique du cours, sans le client du chapitre des
 * indicateurs. Le chapitre ne s'en sert plus ; « Équipe et planning » et « Le tableau de bord du
 * manager » le lisent encore (le taux de marge, l'indice de sécurité, le point mort). Il ne charge
 * rien de l'arène (le type `Cas` seul est importé). À retirer quand ils seront passés sur le monde.
 */
export function seuilDuPointDeVente(c: Cas) {
  const g = c.gestion;
  const ca = g.chiffreDAffaires;
  const coutsVariables = auCentime(g.coutVariableUnitaire * g.quantite);
  const mcv = auCentime(ca - coutsVariables);
  const tauxMcv = auDixieme((mcv / ca) * 100);
  const seuil = Math.round(g.chargesFixes / (tauxMcv / 100));
  return {
    ca,
    quantite: g.quantite,
    coutVariableUnitaire: g.coutVariableUnitaire,
    coutsVariables,
    mcv,
    tauxMcv,
    chargesFixes: g.chargesFixes,
    seuil,
    margeDeSecurite: Math.round(ca - seuil),
    indice: auDixieme(((ca - seuil) / ca) * 100),
    pointMort: Math.ceil((seuil / ca) * JOURS_DU_MOIS - 1e-9),
  };
}
