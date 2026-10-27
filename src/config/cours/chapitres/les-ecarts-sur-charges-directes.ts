import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { controleBudgetaire } from "../monde/ecarts";
import type { Chapitre, EtapeChoix, EtapeCurseur, EtapeSimulation, TableauDeDonnees } from "../types";
import { ENTREPRISES_DES_ECARTS, ceQueSupposeLaSimulation, ecartDit, ficheDe, sens } from "./le-cout-preetabli-et-les-budgets";

/**
 * CHAPITRE : LES ÉCARTS SUR CHARGES DIRECTES, MATIÈRE ET MAIN-D'ŒUVRE (contrôle de gestion,
 * palier 4 ; BTS CG, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : l'usine de NOVA (monde/nova-usine.ts) et son
 * contrôle budgétaire (monde/ecarts.ts). Il décompose l'écart global de chaque charge directe
 * selon le plan comptable : matière en écart sur prix (sur les kilos réels) et écart sur quantité
 * (au prix standard), main-d'œuvre directe en écart sur taux (sur les heures réelles) et écart sur
 * temps (au taux standard). Le piège : un écart global faible (la main-d'œuvre directe) qui cache
 * deux écarts de sens contraire. Puis qui doit agir, et la somme des écarts avec leur signe.
 *
 * LES TROIS TEMPS (exigence du propriétaire, octobre 2026) :
 *   · guidé : « quantites-preetablies », « ecart-global-matiere », « prix-et-quantite » (la
 *     formule est au repère, la question nomme les chiffres) ;
 *   · autonome : « ecart-mod », « global-faible », « qui-agit », « la-somme » (ni formule ni
 *     chiffres désignés) ;
 *   · expert : « ecart-mixte » et « place-du-mixte » (l'écart mixte, et pourquoi le plan
 *     comptable le range dans l'écart sur prix), « a-rebours » (retrouver kilos et prix réels à
 *     partir des écarts), « interdependance » et « la-prime » (croiser l'écart sur quantité de
 *     matière et l'écart sur temps, et l'effet pervers d'une prime sur un seul écart).
 *
 * L'EXPÉRIENCE AVANT LA FORMULE (exigence du propriétaire, octobre 2026) : deux cycles parier,
 * manipuler, constater, formaliser. « predire-la-matiere » puis le curseur « experience-matiere »
 * (les kilos varient au prix réel du kilo : au plus combien pour tenir le coût préétabli), avant
 * « decomposer » et « prix-et-quantite » ; « predire-la-main-d-oeuvre » puis le curseur
 * « experience-main-d-oeuvre » (les heures varient au taux réel), avant « ecart-mod ». Un
 * laboratoire, « laboratoire-charges-directes » (prix, kilos, taux et heures ensemble ; défi : un
 * écart global nul avec un kilo plus cher que le standard), avant « interdependance ».
 *
 * Le modèle ne connaît pas les causes, seulement les écarts : quand une étape suppose une cause
 * (des cadences accélérées), elle la présente comme une hypothèse.
 */

/**
 * LA VARIANTE À REBOURS : un autre trimestre, la même production réelle, et le contrôleur ne
 * transmet que deux écarts sur matière. Hypothèse du cours, posée pour que les kilos et le prix
 * réels se retrouvent exactement (17 900 kg à 15,30 €).
 */
export const VARIANTE_A_REBOURS = { ecartSurQuantite: -1_500, ecartSurPrix: 5_370 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100;
/** Un montant retranché ou ajouté dans un calcul : entre parenthèses s'il est négatif. */
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

/** Les écarts sur charges directes du trimestre, et ce que le chapitre en tire. */
export function ecartsDirects(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = controleBudgetaire(f);
  const r = f.realise;
  const modeles = f.modeles.map((m) => ({ m, reelle: r.ventes[m.code].quantite }));
  const dPrix = auCentime(r.matiere.prixDuKilo - f.prixStandardDuKilo);
  const dKilos = auCentime(r.matiere.kilos - e.preetabliDuReel.kilos);
  const dTaux = auCentime(r.mainDOeuvre.tauxHoraire - f.tauxHoraireStandard);
  const dHeures = auCentime(r.mainDOeuvre.heures - e.preetabliDuReel.heures);

  // L'écart mixte : la part de l'écart sur prix qui ne porte que sur les kilos consommés en trop.
  const prixPur = auCentime(dPrix * e.preetabliDuReel.kilos);
  const mixte = auCentime(dPrix * dKilos);

  // La variante à rebours : kilos réels par l'écart sur quantité, prix réel par l'écart sur prix.
  const v = VARIANTE_A_REBOURS;
  const kilosRebours = auCentime(e.preetabliDuReel.kilos + v.ecartSurQuantite / f.prixStandardDuKilo);
  const prixRebours = auCentime(f.prixStandardDuKilo + v.ecartSurPrix / kilosRebours);
  const rebours = {
    kilos: kilosRebours,
    prix: prixRebours,
    global: auCentime(v.ecartSurQuantite + v.ecartSurPrix),
    coutReel: auCentime(kilosRebours * prixRebours),
  };

  const quatre = [e.matiere.prix, e.matiere.quantite, e.mainDOeuvre.taux, e.mainDOeuvre.temps];
  return {
    f,
    e,
    r,
    modeles,
    dPrix,
    dKilos,
    dTaux,
    dHeures,
    prixPur,
    mixte,
    rebours,
    /** La somme des quatre écarts, chacun avec son signe : l'écart global sur charges directes. */
    totalDirect: auCentime(quatre.reduce((t, x) => t + x, 0)),
    /** L'erreur de l'étudiant qui additionne les montants sans leur signe. */
    totalSansSigne: auCentime(quatre.reduce((t, x) => t + Math.abs(x), 0)),
    /** L'effet net, pour l'atelier, de ses deux écarts : quantité de matière et temps. */
    netAtelier: auCentime(e.matiere.quantite + e.mainDOeuvre.temps),
  };
}

export type EcartsDirects = ReturnType<typeof ecartsDirects>;

/** Les standards de la production réelle. */
export function tableauDeLaProduction(c: Pick<Cas, "code">): TableauDeDonnees {
  const d = ecartsDirects(c);
  return {
    titre: `La production réelle de ${d.f.entreprise} et ses standards`,
    colonnes: d.modeles.map((x) => x.m.nom),
    lignes: [
      { libelle: "Enceintes fabriquées", valeurs: d.modeles.map((x) => qte(x.reelle)) },
      { libelle: "Matière standard par enceinte (kg)", valeurs: d.modeles.map((x) => qte(x.m.matiereParUnite)) },
      { libelle: "Main-d'œuvre directe standard par enceinte (heures)", valeurs: d.modeles.map((x) => qte(x.m.heuresParUnite)) },
    ],
  };
}

/** Le réel des charges directes, face à ses standards unitaires. */
export function tableauDuReelDirect(c: Pick<Cas, "code">): TableauDeDonnees {
  const d = ecartsDirects(c);
  return {
    titre: "Les charges directes du trimestre",
    colonnes: ["Standard", "Réel"],
    lignes: [
      { libelle: "Prix du kilo de matière", valeurs: [eur(d.f.prixStandardDuKilo), eur(d.r.matiere.prixDuKilo)] },
      { libelle: "Kilos de matière", valeurs: [qte(d.e.preetabliDuReel.kilos), qte(d.r.matiere.kilos)] },
      { libelle: "Taux horaire de la main-d'œuvre directe", valeurs: [eur(d.f.tauxHoraireStandard), eur(d.r.mainDOeuvre.tauxHoraire)] },
      { libelle: "Heures de main-d'œuvre directe", valeurs: [qte(d.e.preetabliDuReel.heures), qte(d.r.mainDOeuvre.heures)] },
    ],
  };
}

/**
 * LES EXPÉRIENCES : au prix réel du kilo, combien de kilos l'atelier pouvait-il consommer au plus
 * sans dépasser le coût préétabli de la matière ? Au taux réel, combien d'heures sans dépasser
 * celui de la main-d'œuvre directe ? Le coût réel est une droite dans les kilos (dans les heures),
 * le coût préétabli une constante.
 */
export function experiencesDirectes(c: Pick<Cas, "code">) {
  const d = ecartsDirects(c);
  const e = d.e;
  const matiere = {
    auPlus: Math.floor(e.preetabliDuReel.matiere / d.r.matiere.prixDuKilo + 1e-9),
    reel: (k: number) => auCentime(k * d.r.matiere.prixDuKilo),
    prix: (k: number) => auCentime(d.dPrix * k),
    quantite: (k: number) => auCentime((k - e.preetabliDuReel.kilos) * d.f.prixStandardDuKilo),
    min: e.preetabliDuReel.kilos - 1_500,
    max: e.preetabliDuReel.kilos + 1_000,
  };
  const mainDOeuvre = {
    auPlus: Math.floor(e.preetabliDuReel.mainDOeuvre / d.r.mainDOeuvre.tauxHoraire + 1e-9),
    reel: (h: number) => auCentime(h * d.r.mainDOeuvre.tauxHoraire),
    taux: (h: number) => auCentime(d.dTaux * h),
    temps: (h: number) => auCentime((h - e.preetabliDuReel.heures) * d.f.tauxHoraireStandard),
    min: e.preetabliDuReel.heures - 1_000,
    max: e.preetabliDuReel.heures + 500,
  };
  return { d, matiere, mainDOeuvre };
}

/** Le pari avant l'expérience : le retour ne corrige pas, il renvoie au curseur. */
const pari = (texte: string, juste: boolean) => ({
  texte,
  juste,
  retour: "Pari noté. L'étape suivante le tranche : faites tourner l'atelier avec le curseur, et regardez.",
});

const PREDIRE_LA_MATIERE: EtapeChoix = {
  id: "predire-la-matiere",
  type: "choix",
  titre: "Pariez : tenir la matière malgré le fournisseur",
  notions: ["material_price_variance"],
  question: (c) => {
    const d = ecartsDirects(c);
    return `Le kilo a coûté ${eur(d.r.matiere.prixDuKilo)} au lieu de ${eur(d.f.prixStandardDuKilo)}. Pour que la matière ne coûte pas plus que son coût préétabli, ${eur(d.e.preetabliDuReel.matiere)}, combien de kilos l'atelier pouvait-il consommer ?`;
  },
  options: (c) => {
    const d = ecartsDirects(c);
    const k = experiencesDirectes(c).matiere.auPlus;
    const pre = d.e.preetabliDuReel.kilos;
    return [
      pari(`Moins que les ${qte(pre)} kilos préétablis`, k < pre),
      pari(`Exactement les ${qte(pre)} kilos préétablis`, k === pre),
      pari(`Jusqu'aux ${qte(d.r.matiere.kilos)} kilos consommés : la hausse est l'affaire du fournisseur`, k >= d.r.matiere.kilos),
    ];
  },
};

const ETAPE_DE_LA_MATIERE: EtapeCurseur = {
  id: "experience-matiere",
  type: "curseur",
  titre: "Faites varier les kilos consommés",
  notions: ["material_price_variance", "efficiency_variance"],
  question: (c) => {
    const d = ecartsDirects(c);
    return `Faites tourner l'atelier : le curseur fait varier les kilos consommés, tous payés ${eur(d.r.matiere.prixDuKilo)}, pour la même production réelle. La lecture donne en direct le coût réel, l'écart sur prix, l'écart sur quantité et l'écart global. Placez le curseur sur le plus grand nombre de kilos qui garde le coût réel sous le coût préétabli de ${eur(d.e.preetabliDuReel.matiere)}.`;
  },
  grandeur: () => ({ libelle: "Kilos de matière consommés", unite: "kg" }),
  sens: "plus-grande",
  cible: (c) => {
    const m = experiencesDirectes(c).matiere;
    return { attendu: m.auPlus, min: m.min, max: m.max };
  },
  lecture: (c, k) => {
    const { d, matiere: m } = experiencesDirectes(c);
    return [
      { libelle: "Coût réel de la matière", montant: m.reel(k) },
      { libelle: "Coût préétabli de la matière", montant: d.e.preetabliDuReel.matiere },
      { libelle: "Écart sur prix", montant: m.prix(k) },
      { libelle: "Écart sur quantité", montant: m.quantite(k) },
      { libelle: "Écart global sur matière", montant: auCentime(m.reel(k) - d.e.preetabliDuReel.matiere), fort: true },
    ];
  },
  droites: (c) => {
    const { d, matiere: m } = experiencesDirectes(c);
    return { produit: () => d.e.preetabliDuReel.matiere, cout: (k) => m.reel(k), libelles: ["Coût préétabli de la matière", "Coût réel de la matière"] };
  },
  zones: ["Le coût préétabli tient", "Le coût préétabli est dépassé"],
  rates: () => ({
    dessous: "Ici le coût préétabli tient encore : l'atelier pouvait consommer davantage. Cherchez le plus grand nombre de kilos.",
    dessus: "À ce nombre de kilos, le coût réel dépasse le coût préétabli.",
  }),
  montrer: "Montrer les kilos",
  explication: (c) => {
    const { d, matiere: m } = experiencesDirectes(c);
    const e = d.e;
    return [
      `Au prix de ${eur(d.r.matiere.prixDuKilo)}, l'atelier ne pouvait consommer que ${qte(m.auPlus)} kilos, ${qte(e.preetabliDuReel.kilos - m.auPlus)} de moins que les ${qte(e.preetabliDuReel.kilos)} préétablis : il aurait fallu un écart sur quantité favorable de ${eur(Math.abs(m.quantite(m.auPlus)))} pour absorber un écart sur prix de ${eur(m.prix(m.auPlus))}. Il en a consommé ${qte(d.r.matiere.kilos)} : les deux écarts se sont ajoutés au lieu de se compenser.`,
      "Ce que vous venez de voir : l'écart sur prix suit les kilos réellement consommés, l'écart sur quantité suit les kilos en trop au prix standard. L'étape suivante leur donne leur formule.",
    ];
  },
};

const PREDIRE_LA_MAIN_D_OEUVRE: EtapeChoix = {
  id: "predire-la-main-d-oeuvre",
  type: "choix",
  titre: "Pariez : moins d'heures, mais plus chères",
  notions: ["efficiency_variance"],
  question: (c) => {
    const d = ecartsDirects(c);
    return `L'atelier a passé ${qte(d.r.mainDOeuvre.heures)} heures, ${qte(Math.abs(d.dHeures))} de ${d.dHeures < 0 ? "moins" : "plus"} que les ${qte(d.e.preetabliDuReel.heures)} préétablies, mais payées ${eur(d.r.mainDOeuvre.tauxHoraire)} au lieu de ${eur(d.f.tauxHoraireStandard)}. La main-d'œuvre directe a-t-elle tenu son coût préétabli ?`;
  },
  options: (c) => {
    const d = ecartsDirects(c);
    const g = d.e.mainDOeuvre.global;
    return [
      pari("Non : la hausse du taux l'emporte sur les heures gagnées", g > 0),
      pari("Oui : les heures gagnées paient la hausse du taux", g < 0),
      pari("Tout juste : l'un efface exactement l'autre", g === 0),
    ];
  },
};

const ETAPE_DE_LA_MAIN_D_OEUVRE: EtapeCurseur = {
  id: "experience-main-d-oeuvre",
  type: "curseur",
  titre: "Faites varier les heures",
  notions: ["efficiency_variance"],
  question: (c) => {
    const d = ecartsDirects(c);
    return `Le curseur fait varier les heures de main-d'œuvre directe, toutes payées ${eur(d.r.mainDOeuvre.tauxHoraire)}, pour la même production. Placez-le sur le plus grand nombre d'heures qui garde le coût réel sous le coût préétabli de ${eur(d.e.preetabliDuReel.mainDOeuvre)}.`;
  },
  grandeur: () => ({ libelle: "Heures de main-d'œuvre directe", unite: "heures" }),
  sens: "plus-grande",
  cible: (c) => {
    const m = experiencesDirectes(c).mainDOeuvre;
    return { attendu: m.auPlus, min: m.min, max: m.max };
  },
  lecture: (c, h) => {
    const { d, mainDOeuvre: m } = experiencesDirectes(c);
    return [
      { libelle: "Coût réel de la main-d'œuvre directe", montant: m.reel(h) },
      { libelle: "Coût préétabli de la main-d'œuvre directe", montant: d.e.preetabliDuReel.mainDOeuvre },
      { libelle: "Écart sur taux", montant: m.taux(h) },
      { libelle: "Écart sur temps", montant: m.temps(h) },
      { libelle: "Écart global sur main-d'œuvre directe", montant: auCentime(m.reel(h) - d.e.preetabliDuReel.mainDOeuvre), fort: true },
    ];
  },
  droites: (c) => {
    const { d, mainDOeuvre: m } = experiencesDirectes(c);
    return {
      produit: () => d.e.preetabliDuReel.mainDOeuvre,
      cout: (h) => m.reel(h),
      libelles: ["Coût préétabli de la main-d'œuvre directe", "Coût réel de la main-d'œuvre directe"],
    };
  },
  zones: ["Le coût préétabli tient", "Le coût préétabli est dépassé"],
  rates: () => ({
    dessous: "Ici le coût préétabli tient encore : cherchez le plus grand nombre d'heures.",
    dessus: "À ce nombre d'heures, le coût réel dépasse le coût préétabli.",
  }),
  montrer: "Montrer les heures",
  explication: (c) => {
    const { d, mainDOeuvre: m } = experiencesDirectes(c);
    const e = d.e;
    return [
      `Au taux de ${eur(d.r.mainDOeuvre.tauxHoraire)}, il ne fallait pas dépasser ${qte(m.auPlus)} heures, ${qte(e.preetabliDuReel.heures - m.auPlus)} de moins que les ${qte(e.preetabliDuReel.heures)} heures préétablies. L'atelier en a passé ${qte(d.r.mainDOeuvre.heures)} : le temps gagné (${eur(Math.abs(e.mainDOeuvre.temps))}) n'a payé qu'une partie de la hausse du taux (${eur(e.mainDOeuvre.taux)}).`,
      "Ce que vous venez de voir : deux écarts de sens contraire, l'un sur le taux, l'autre sur le temps, dans un écart global qui paraît faible.",
    ];
  },
};

/**
 * LE LABORATOIRE DES CHARGES DIRECTES : prix du kilo, kilos consommés, taux horaire et heures
 * varient ensemble, pour la même production réelle. Défi : un écart global sur charges directes
 * nul alors que le kilo reste plus cher que le standard. Il faut que les kilos, le taux ou les heures
 * compensent : un écart global nul n'est pas une usine bien tenue. Une solution sur le pas : le kilo
 * à 15,40 €, 18 750 kilos (750 de trop), le taux ramené à 25 €, 8 250 heures (750 de moins).
 */
export const SOLUTION_DU_LABORATOIRE = { prix: 15.4, kilos: 18_750, taux: 25, heures: 8_250 } as const;

export function laboratoireDesChargesDirectes(c: Pick<Cas, "code">) {
  const d = ecartsDirects(c);
  const e = d.e;
  const f = d.f;
  const leviers = [
    { code: "prix", libelle: "Prix du kilo de matière", unite: "€", min: 14, max: 16.5, pas: 0.05, depart: d.r.matiere.prixDuKilo },
    { code: "kilos", libelle: "Kilos consommés", unite: "kg", min: 16_500, max: 19_500, pas: 50, depart: d.r.matiere.kilos },
    { code: "taux", libelle: "Taux horaire", unite: "€", min: 23, max: 28, pas: 0.5, depart: d.r.mainDOeuvre.tauxHoraire },
    { code: "heures", libelle: "Heures de main-d'œuvre directe", unite: "heures", min: 8_000, max: 9_600, pas: 50, depart: d.r.mainDOeuvre.heures },
  ];
  const v = (p: Readonly<Record<string, number>>, k: string) => p[k] ?? leviers.find((l) => l.code === k)!.depart;
  /** Les quatre écarts sur charge (positif défavorable), et leur total. */
  const ecarts = (p: Readonly<Record<string, number>>) => {
    const prix = auCentime((v(p, "prix") - f.prixStandardDuKilo) * v(p, "kilos"));
    const quantite = auCentime((v(p, "kilos") - e.preetabliDuReel.kilos) * f.prixStandardDuKilo);
    const taux = auCentime((v(p, "taux") - f.tauxHoraireStandard) * v(p, "heures"));
    const temps = auCentime((v(p, "heures") - e.preetabliDuReel.heures) * f.tauxHoraireStandard);
    const reel = auCentime(v(p, "prix") * v(p, "kilos") + v(p, "taux") * v(p, "heures"));
    return { prix, quantite, taux, temps, reel, total: auCentime(prix + quantite + taux + temps) };
  };
  return { d, leviers, v, ecarts, preetabli: auCentime(e.preetabliDuReel.matiere + e.preetabliDuReel.mainDOeuvre) };
}

const LABORATOIRE_DES_CHARGES_DIRECTES: EtapeSimulation = {
  id: "laboratoire-charges-directes",
  type: "simulation",
  titre: "Le laboratoire des charges directes",
  notions: ["material_price_variance", "efficiency_variance", "cost_variance"],
  question: (c) => {
    const x = laboratoireDesChargesDirectes(c);
    return `Faites tourner l'atelier en jouant sur les quatre causes à la fois, pour la même production réelle. Le tableau donne l'effet de chaque cause sur le résultat (positif favorable, à l'inverse du signe d'un écart sur charge), et le coût réel des charges directes face à leur coût préétabli de ${eur(x.preetabli)}.`;
  },
  leviers: (c) => laboratoireDesChargesDirectes(c).leviers,
  lecture: (c, p) => {
    const x = laboratoireDesChargesDirectes(c);
    const now = x.ecarts(p);
    const dep = x.ecarts({});
    return [
      { libelle: "Coût réel des charges directes", montant: now.reel, reference: dep.reel },
      { libelle: "Coût préétabli des charges directes", montant: x.preetabli, reference: x.preetabli },
      { libelle: "Effet du prix du kilo", montant: -now.prix + 0, reference: -dep.prix + 0, effet: true },
      { libelle: "Effet des kilos consommés", montant: -now.quantite + 0, reference: -dep.quantite + 0, effet: true },
      { libelle: "Effet du taux horaire", montant: -now.taux + 0, reference: -dep.taux + 0, effet: true },
      { libelle: "Effet des heures", montant: -now.temps + 0, reference: -dep.temps + 0, effet: true },
      { libelle: "Effet total sur le résultat", montant: -now.total + 0, reference: -dep.total + 0, effet: true, fort: true },
    ];
  },
  defi: (c) => {
    const x = laboratoireDesChargesDirectes(c);
    const s = x.d.f.prixStandardDuKilo;
    return {
      consigne: `Défi : un écart global sur charges directes nul, avec un kilo de matière qui reste plus cher que le standard de ${eur(s)}.`,
      atteint: (p) => Math.abs(x.ecarts(p).total) < 0.005 && x.v(p, "prix") > s + 1e-9,
      indice: (p) => {
        const t = x.ecarts(p).total;
        if (x.v(p, "prix") <= s + 1e-9) return `Le défi garde le kilo au-dessus de ${eur(s)} : remontez le prix, et cherchez la compensation ailleurs.`;
        return t > 0
          ? `Les charges directes coûtent encore ${eur(t)} de plus que leur coût préétabli : gagnez sur les kilos, le taux ou les heures.`
          : `Les charges directes coûtent ${eur(-t)} de moins que leur coût préétabli : vous avez trop compensé.`;
      },
      solution: { ...SOLUTION_DU_LABORATOIRE },
    };
  },
  montrer: "Montrer une solution",
  explication: (c, p) => {
    const x = laboratoireDesChargesDirectes(c);
    const e = x.ecarts(p);
    return [
      `Écart global nul : ${eur(e.prix)} sur le prix, ${eur(e.quantite)} sur la quantité, ${eur(e.taux)} sur le taux et ${eur(e.temps)} sur le temps se compensent exactement.`,
      "Le total est nul, et pourtant chaque responsable a son écart : un global à zéro peut cacher un fournisseur plus cher, un atelier qui gâche de la matière et des heures gagnées ailleurs. Le contrôle ne s'arrête jamais au total.",
    ];
  },
};

const kilosPreetablis = (d: EcartsDirects) => `${d.modeles.map((x) => `${qte(x.reelle)} × ${qte(x.m.matiereParUnite)}`).join(" + ")} = ${qte(d.e.preetabliDuReel.kilos)} kg`;
const heuresPreetablies = (d: EcartsDirects) => `${d.modeles.map((x) => `${qte(x.reelle)} × ${qte(x.m.heuresParUnite)}`).join(" + ")} = ${qte(d.e.preetabliDuReel.heures)} heures`;

export const LES_ECARTS_SUR_CHARGES_DIRECTES: Chapitre = {
  code: "les-ecarts-sur-charges-directes",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Les écarts sur charges directes : matière et main-d'œuvre",
  accroche:
    "La matière a coûté plus que prévu : est-ce le prix payé au fournisseur ou les kilos consommés par l'atelier ? La main-d'œuvre directe semble tenue : deux écarts de sens contraire s'y cachent. Décomposer, croiser, remonter aux causes, et dire qui doit agir.",
  objectifs: [
    "Décomposer l'écart sur matière en écart sur prix et écart sur quantité",
    "Décomposer l'écart sur main-d'œuvre directe en écart sur taux et écart sur temps",
    "Isoler l'écart mixte et justifier sa place dans l'écart sur prix",
    "Retrouver un prix ou une quantité réels à partir des écarts, et croiser deux écarts liés",
    "Attribuer chaque écart à son responsable, sans juger un responsable sur un seul écart",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ECARTS,
    pourquoi: "les coûts préétablis se calculent sur une production : ce chapitre se joue à l'usine de NOVA, qui fabrique des enceintes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La matière et la main-d'œuvre du trimestre",
      notions: ["standard_costing", "cost_variance"],
      tableau: tableauDeLaProduction,
      texte: (c) => {
        const d = ecartsDirects(c);
        return [
          ...ceQueSupposeLaSimulation(c),
          `Le standard : ${eur(d.f.prixStandardDuKilo)} le kilo de matière, ${eur(d.f.tauxHoraireStandard)} l'heure de main-d'œuvre directe, et les quantités par enceinte du tableau. Le réel du trimestre : ${qte(d.r.matiere.kilos)} kilos de matière achetés et consommés à ${eur(d.r.matiere.prixDuKilo)} le kilo, ${qte(d.r.mainDOeuvre.heures)} heures de main-d'œuvre directe payées à ${eur(d.r.mainDOeuvre.tauxHoraire)} de l'heure.`,
          "Un écart sur charge directe se mesure toujours sur la production réelle : les quantités préétablies sont celles que les enceintes réellement fabriquées auraient dû consommer.",
        ];
      },
      repere: () =>
        "Quantité préétablie de la production réelle = Σ enceintes fabriquées × quantité standard par enceinte. Écart global = coût réel − coût préétabli de la production réelle = quantité réelle × prix réel − quantité préétablie × prix standard.",
    },
    {
      id: "quantites-preetablies",
      type: "montants",
      titre: "Les quantités préétablies",
      notions: ["standard_costing"],
      tableau: tableauDeLaProduction,
      question: () =>
        "Calculez les kilos de matière préétablis de la production réelle (enceintes fabriquées × kilos standard, pour chaque modèle), puis les heures de main-d'œuvre directe préétablies (enceintes fabriquées × heures standard).",
      champs: (c) => {
        const d = ecartsDirects(c);
        return [
          { libelle: "Kilos préétablis de la production réelle", attendu: d.e.preetabliDuReel.kilos, calcul: kilosPreetablis(d) },
          { libelle: "Heures préétablies de la production réelle", attendu: d.e.preetabliDuReel.heures, calcul: heuresPreetablies(d) },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        return [
          `L'atelier aurait dû consommer ${qte(d.e.preetabliDuReel.kilos)} kilos ; il en a consommé ${qte(d.r.matiere.kilos)}. Il aurait dû passer ${qte(d.e.preetabliDuReel.heures)} heures ; il en a payé ${qte(d.r.mainDOeuvre.heures)}.`,
        ];
      },
    },
    {
      id: "ecart-global-matiere",
      type: "montants",
      titre: "L'écart global sur matière",
      notions: ["cost_variance"],
      tableau: tableauDuReelDirect,
      question: (c) => {
        const d = ecartsDirects(c);
        return `Calculez le coût préétabli de la matière de la production réelle (${qte(d.e.preetabliDuReel.kilos)} kg × ${eur(d.f.prixStandardDuKilo)}), son coût réel (${qte(d.r.matiere.kilos)} kg × ${eur(d.r.matiere.prixDuKilo)}), puis l'écart global sur matière, réel moins préétabli (négatif pour un écart favorable).`;
      },
      champs: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          { libelle: "Coût préétabli de la matière", attendu: e.preetabliDuReel.matiere, calcul: `${qte(e.preetabliDuReel.kilos)} × ${eur(d.f.prixStandardDuKilo)} = ${eur(e.preetabliDuReel.matiere)}` },
          { libelle: "Coût réel de la matière", attendu: e.reel.matiere, calcul: `${qte(d.r.matiere.kilos)} × ${eur(d.r.matiere.prixDuKilo)} = ${eur(e.reel.matiere)}` },
          { libelle: "Écart global sur matière", attendu: e.matiere.global, calcul: `${eur(e.reel.matiere)} − ${eur(e.preetabliDuReel.matiere)} = ${eur(e.matiere.global)}` },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        return [`La matière a coûté ${eur(d.e.matiere.global)} de plus que ce que la production réelle devait coûter. Deux choses ont bougé à la fois : le prix du kilo et les kilos consommés. Reste à séparer leurs effets.`];
      },
    },
    PREDIRE_LA_MATIERE,
    ETAPE_DE_LA_MATIERE,
    {
      id: "decomposer",
      type: "lecture",
      titre: "Séparer le prix et la quantité",
      notions: ["material_price_variance", "efficiency_variance"],
      texte: () => [
        "Le plan comptable décompose l'écart global de chaque charge directe en deux écarts. L'écart sur prix (sur taux, pour la main-d'œuvre) mesure ce que le prix payé a changé, sur toutes les quantités réellement consommées. L'écart sur quantité (sur temps, pour la main-d'œuvre) mesure ce que les quantités consommées en trop ou en moins ont changé, au prix standard.",
        "La somme des deux redonne l'écart global, centime compris. Chacun a son responsable : le prix du kilo regarde les achats, les kilos consommés regardent l'atelier, le taux horaire regarde les ressources humaines (salaires, heures supplémentaires), le temps regarde l'atelier.",
      ],
      repere: () =>
        "Écart sur prix = (prix réel − prix standard) × quantité réelle. Écart sur quantité = (quantité réelle − quantité préétablie) × prix standard. Écart sur taux = (taux réel − taux standard) × heures réelles. Écart sur temps = (heures réelles − heures préétablies) × taux standard.",
    },
    {
      id: "prix-et-quantite",
      type: "montants",
      titre: "Écart sur prix, écart sur quantité",
      notions: ["material_price_variance", "efficiency_variance"],
      tableau: tableauDuReelDirect,
      question: (c) => {
        const d = ecartsDirects(c);
        return `Calculez l'écart sur prix de la matière, (${eur(d.r.matiere.prixDuKilo)} − ${eur(d.f.prixStandardDuKilo)}) × ${qte(d.r.matiere.kilos)} kg, puis l'écart sur quantité, (${qte(d.r.matiere.kilos)} − ${qte(d.e.preetabliDuReel.kilos)}) × ${eur(d.f.prixStandardDuKilo)}. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const d = ecartsDirects(c);
        return [
          { libelle: "Écart sur prix de la matière", attendu: d.e.matiere.prix, calcul: `${eur(d.dPrix)} × ${qte(d.r.matiere.kilos)} = ${eur(d.e.matiere.prix)}` },
          { libelle: "Écart sur quantité de matière", attendu: d.e.matiere.quantite, calcul: `${qte(d.dKilos)} × ${eur(d.f.prixStandardDuKilo)} = ${eur(d.e.matiere.quantite)}` },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          `${eur(e.matiere.prix)} + ${eur(e.matiere.quantite)} = ${eur(e.matiere.global)} : la décomposition retombe sur l'écart global. Le prix du kilo pèse ${ecartDit(e.matiere.prix)}, les kilos consommés ${ecartDit(e.matiere.quantite)} : deux parts presque égales.`,
        ];
      },
    },
    PREDIRE_LA_MAIN_D_OEUVRE,
    ETAPE_DE_LA_MAIN_D_OEUVRE,
    {
      id: "ecart-mod",
      type: "montants",
      titre: "Les écarts sur main-d'œuvre directe",
      notions: ["cost_variance", "efficiency_variance"],
      tableau: tableauDuReelDirect,
      question: () =>
        "À vous, sans la formule : calculez l'écart global sur main-d'œuvre directe, puis l'écart sur taux et l'écart sur temps. Négatif pour un écart favorable.",
      champs: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          {
            libelle: "Écart global sur main-d'œuvre directe",
            attendu: e.mainDOeuvre.global,
            calcul: `${qte(d.r.mainDOeuvre.heures)} × ${eur(d.r.mainDOeuvre.tauxHoraire)} − ${qte(e.preetabliDuReel.heures)} × ${eur(d.f.tauxHoraireStandard)} = ${eur(e.reel.mainDOeuvre)} − ${eur(e.preetabliDuReel.mainDOeuvre)} = ${eur(e.mainDOeuvre.global)}`,
          },
          { libelle: "Écart sur taux", attendu: e.mainDOeuvre.taux, calcul: `(${eur(d.r.mainDOeuvre.tauxHoraire)} − ${eur(d.f.tauxHoraireStandard)}) × ${qte(d.r.mainDOeuvre.heures)} = ${eur(e.mainDOeuvre.taux)}` },
          { libelle: "Écart sur temps", attendu: e.mainDOeuvre.temps, calcul: `(${qte(d.r.mainDOeuvre.heures)} − ${qte(e.preetabliDuReel.heures)}) × ${eur(d.f.tauxHoraireStandard)} = ${eur(e.mainDOeuvre.temps)}` },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          `${eur(e.mainDOeuvre.taux)} + ${entre(e.mainDOeuvre.temps)} = ${eur(e.mainDOeuvre.global)}. L'heure a coûté ${eur(d.dTaux)} de plus que le standard, mais l'atelier a passé ${qte(Math.abs(d.dHeures))} heures de ${d.dHeures < 0 ? "moins" : "plus"} que prévu pour la production réelle.`,
        ];
      },
    },
    {
      id: "global-faible",
      type: "choix",
      titre: "Un écart global faible",
      notions: ["cost_variance"],
      question: (c) => {
        const d = ecartsDirects(c);
        return `L'écart global sur main-d'œuvre directe n'est que de ${eur(d.e.mainDOeuvre.global)}, pour ${eur(d.e.preetabliDuReel.mainDOeuvre)} de coût préétabli. Que peut en conclure le contrôleur ?`;
      },
      options: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        const fond = `Le global de ${eur(e.mainDOeuvre.global)} réunit un écart sur taux de ${ecartDit(e.mainDOeuvre.taux)} et un écart sur temps de ${ecartDit(e.mainDOeuvre.temps)}.`;
        const hypothese =
          "Ils peuvent avoir une cause commune : une équipe plus qualifiée, payée plus cher, qui travaille plus vite. C'est une hypothèse à vérifier : le calcul donne les écarts, pas leurs causes.";
        const compense = Math.sign(e.mainDOeuvre.taux) !== Math.sign(e.mainDOeuvre.temps);
        return [
          {
            texte: "Rien encore : deux écarts de sens contraire peuvent s'y compenser",
            juste: compense,
            retour: compense ? `Oui. ${fond} ${hypothese}` : `Non. ${fond}`,
          },
          {
            texte: "La main-d'œuvre est tenue : un écart global faible veut dire que taux et temps le sont",
            juste: !compense,
            retour: compense ? `Non. ${fond} Un global faible peut cacher deux dérives qui se compensent.` : `Oui. ${fond}`,
          },
          {
            texte: "Seul l'atelier est en cause : un écart sur main-d'œuvre est toujours un écart de temps",
            juste: false,
            retour: `Non : le taux horaire relève des ressources humaines, pas de l'atelier. ${fond}`,
          },
        ];
      },
    },
    {
      id: "qui-agit",
      type: "tri",
      titre: "Qui doit agir ?",
      notions: ["material_price_variance", "efficiency_variance"],
      question: () => "Rangez chaque écart chez le responsable qui peut agir dessus.",
      categories: [
        { code: "achats", libelle: "Les achats" },
        { code: "atelier", libelle: "L'atelier" },
        { code: "rh", libelle: "Les ressources humaines" },
      ],
      elements: (c) => {
        const e = ecartsDirects(c).e;
        return [
          { libelle: `Écart sur prix de la matière (${sens(e.matiere.prix)})`, montant: Math.abs(e.matiere.prix), categorie: "achats", pourquoi: "Le prix du kilo se négocie avec le fournisseur : c'est l'affaire des achats." },
          { libelle: `Écart sur quantité de matière (${sens(e.matiere.quantite)})`, montant: Math.abs(e.matiere.quantite), categorie: "atelier", pourquoi: "Les kilos consommés par enceinte se jouent à l'atelier : rebuts, réglages, chutes." },
          { libelle: `Écart sur taux (${sens(e.mainDOeuvre.taux)})`, montant: Math.abs(e.mainDOeuvre.taux), categorie: "rh", pourquoi: "Le taux horaire dépend des salaires, des qualifications et des heures supplémentaires majorées : les ressources humaines." },
          { libelle: `Écart sur temps (${sens(e.mainDOeuvre.temps)})`, montant: Math.abs(e.mainDOeuvre.temps), categorie: "atelier", pourquoi: "Les heures passées par enceinte dépendent de l'organisation de l'atelier." },
        ];
      },
      explication: () => [
        "Chaque responsable répond de ce qu'il maîtrise. L'atelier, lui, répond de deux écarts : les kilos et les heures. Le chapitre y revient plus loin, car ces deux-là peuvent venir d'une même décision.",
      ],
    },
    {
      id: "la-somme",
      type: "choix",
      titre: "La somme des quatre écarts",
      notions: ["cost_variance"],
      question: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return `Écart sur prix ${ecartDit(e.matiere.prix)}, sur quantité ${ecartDit(e.matiere.quantite)}, sur taux ${ecartDit(e.mainDOeuvre.taux)}, sur temps ${ecartDit(e.mainDOeuvre.temps)} : que vaut l'écart total sur charges directes ?`;
      },
      options: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        const calcul = `${eur(e.matiere.prix)} + ${eur(e.matiere.quantite)} + ${eur(e.mainDOeuvre.taux)} + ${entre(e.mainDOeuvre.temps)} = ${eur(d.totalDirect)}, soit l'écart global sur matière (${eur(e.matiere.global)}) plus celui sur main-d'œuvre directe (${eur(e.mainDOeuvre.global)}).`;
        return [
          { texte: `${ecartDit(d.totalDirect)}, chaque écart pris avec son signe`, juste: true, retour: `Oui : ${calcul}` },
          {
            texte: `${ecartDit(d.totalSansSigne)}, en additionnant les quatre montants`,
            juste: false,
            retour: `Non : c'est additionner les montants sans leur signe. Un écart favorable se retranche. ${calcul}`,
          },
          {
            texte: `${eur(Math.abs(d.totalDirect))} ${sens(-d.totalDirect)}, puisque le temps a été gagné`,
            juste: false,
            retour: `Non : c'est le signe inversé. Sur une charge, un écart positif est défavorable. ${calcul}`,
          },
        ];
      },
    },
    {
      id: "ecart-mixte",
      type: "montants",
      titre: "L'écart mixte",
      notions: ["material_price_variance"],
      tableau: tableauDuReelDirect,
      question: (c) => {
        const d = ecartsDirects(c);
        return `L'écart sur prix porte sur les ${qte(d.r.matiere.kilos)} kilos réels, y compris les ${qte(d.dKilos)} kilos consommés en trop. Séparez-le : l'écart sur prix pur, sur les seuls kilos préétablis ; l'écart mixte, la hausse du kilo sur les kilos en trop (écart de prix × écart de quantité). Vérifiez ensuite que prix pur, quantité et mixte redonnent l'écart global.`;
      },
      champs: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          { libelle: "Écart sur prix pur", attendu: d.prixPur, calcul: `${eur(d.dPrix)} × ${qte(e.preetabliDuReel.kilos)} = ${eur(d.prixPur)}` },
          { libelle: "Écart mixte", attendu: d.mixte, calcul: `${eur(d.dPrix)} × ${qte(d.dKilos)} = ${eur(d.mixte)}` },
          {
            libelle: "Prix pur, quantité et mixte réunis",
            attendu: auCentime(d.prixPur + e.matiere.quantite + d.mixte),
            calcul: `${eur(d.prixPur)} + ${eur(e.matiere.quantite)} + ${eur(d.mixte)} = ${eur(auCentime(d.prixPur + e.matiere.quantite + d.mixte))}`,
          },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        return [
          `L'écart sur prix du plan comptable, ${eur(d.e.matiere.prix)}, est l'écart sur prix pur (${eur(d.prixPur)}) plus l'écart mixte (${eur(d.mixte)}). L'écart mixte naît des deux causes à la fois : la hausse du kilo et les kilos en trop.`,
        ];
      },
    },
    {
      id: "place-du-mixte",
      type: "choix",
      titre: "Où ranger l'écart mixte ?",
      notions: ["material_price_variance", "efficiency_variance"],
      question: (c) => {
        const d = ecartsDirects(c);
        return `L'écart mixte de ${eur(d.mixte)} naît à la fois de la hausse du kilo et des kilos consommés en trop. Le plan comptable le range dans l'écart sur prix. Pourquoi ?`;
      },
      options: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        const fond = `L'écart sur quantité, ${eur(e.matiere.quantite)}, valorise les ${qte(d.dKilos)} kilos en trop au prix standard ; l'écart sur prix, ${eur(e.matiere.prix)}, porte la hausse sur tous les kilos achetés.`;
        return [
          {
            texte: "Pour juger l'atelier au prix standard : il ne maîtrise pas le prix d'achat",
            juste: true,
            retour: `Oui. ${fond} L'atelier répond des kilos, pas du prix : valoriser ses kilos en trop au prix réel lui ferait porter une hausse qu'il ne décide pas.`,
          },
          {
            texte: "Par erreur : sans les kilos en trop il n'existerait pas, il revient à l'atelier",
            juste: false,
            retour: `Non : c'est vrai qu'il naît aussi des kilos en trop, mais l'écart sur quantité se valorise au prix standard pour que l'atelier soit jugé sur ce qu'il maîtrise. ${fond}`,
          },
          {
            texte: "Il faudrait le compter dans les deux écarts, puisque chacun en est la cause",
            juste: false,
            retour: `Non : compté deux fois, il ferait ${eur(auCentime(e.matiere.prix + e.matiere.quantite + d.mixte))} au lieu de ${eur(e.matiere.global)}, et la décomposition ne retomberait plus sur l'écart global. ${fond}`,
          },
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "À rebours : retrouver le réel",
      notions: ["material_price_variance", "efficiency_variance"],
      question: (c) => {
        const d = ecartsDirects(c);
        const v = VARIANTE_A_REBOURS;
        return `Variante : un autre trimestre, la même production réelle (${d.modeles.map((x) => `${qte(x.reelle)} ${x.m.nom}`).join(" et ")}), le même prix standard du kilo. Le contrôleur ne vous transmet que deux écarts sur matière : écart sur quantité ${ecartDit(v.ecartSurQuantite)}, écart sur prix ${ecartDit(v.ecartSurPrix)}. Retrouvez les kilos réellement consommés, le prix réel du kilo, puis l'écart global sur matière (négatif pour un écart favorable).`;
      },
      champs: (c) => {
        const d = ecartsDirects(c);
        const v = VARIANTE_A_REBOURS;
        const s = d.f.prixStandardDuKilo;
        return [
          {
            libelle: "Kilos réellement consommés",
            attendu: d.rebours.kilos,
            calcul: `${qte(d.e.preetabliDuReel.kilos)} + ${entre(v.ecartSurQuantite)} ÷ ${eur(s)} = ${qte(d.e.preetabliDuReel.kilos)} ${v.ecartSurQuantite < 0 ? "−" : "+"} ${qte(Math.abs(auCentime(v.ecartSurQuantite / s)))} = ${qte(d.rebours.kilos)} kg`,
          },
          { libelle: "Prix réel du kilo", attendu: d.rebours.prix, calcul: `${eur(s)} + ${eur(v.ecartSurPrix)} ÷ ${qte(d.rebours.kilos)} = ${eur(d.rebours.prix)}` },
          {
            libelle: "Écart global sur matière de la variante",
            attendu: d.rebours.global,
            calcul: `${entre(v.ecartSurQuantite)} + ${eur(v.ecartSurPrix)} = ${eur(d.rebours.global)}, soit ${qte(d.rebours.kilos)} × ${eur(d.rebours.prix)} − ${eur(d.e.preetabliDuReel.matiere)} = ${eur(d.rebours.coutReel)} − ${eur(d.e.preetabliDuReel.matiere)}`,
          },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        return [
          "L'ordre compte : l'écart sur quantité est au prix standard, il donne les kilos réels ; l'écart sur prix porte sur les kilos réels, il ne donne le prix qu'une fois ces kilos connus. Diviser l'écart sur prix par les kilos préétablis donnerait un prix faux.",
          `Ici l'atelier a économisé de la matière quand le kilo coûtait plus cher : un écart global de ${ecartDit(d.rebours.global)} qui cache, là encore, deux mouvements opposés.`,
        ];
      },
    },
    LABORATOIRE_DES_CHARGES_DIRECTES,
    {
      id: "interdependance",
      type: "montants",
      titre: "Deux écarts, une même décision ?",
      notions: ["efficiency_variance", "cost_variance"],
      question: () =>
        "Hypothèse : pour tenir les délais, le chef d'atelier a accéléré les cadences ; les heures gagnées et les kilos gâchés viendraient de la même décision. Calculez l'écart sur temps en heures (heures réelles moins préétablies, négatif pour des heures gagnées), les kilos consommés en trop, puis l'effet net de l'atelier sur le coût, ses deux écarts réunis (négatif pour un effet favorable).",
      champs: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          { libelle: "Écart sur temps en heures", attendu: d.dHeures, calcul: `${qte(d.r.mainDOeuvre.heures)} − ${qte(e.preetabliDuReel.heures)} = ${qte(d.dHeures)} heures` },
          { libelle: "Kilos consommés en trop", attendu: d.dKilos, calcul: `${qte(d.r.matiere.kilos)} − ${qte(e.preetabliDuReel.kilos)} = ${qte(d.dKilos)} kg` },
          { libelle: "Effet net de l'atelier", attendu: d.netAtelier, calcul: `${eur(e.matiere.quantite)} + ${entre(e.mainDOeuvre.temps)} = ${eur(d.netAtelier)}` },
        ];
      },
      explication: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          `Pris seul, l'écart sur temps dit que l'atelier a fait gagner ${eur(Math.abs(e.mainDOeuvre.temps))}. Croisé avec l'écart sur quantité, ${eur(e.matiere.quantite)}, il dit autre chose : si l'hypothèse tient, l'accélération a coûté ${ecartDit(d.netAtelier)} au total. C'est l'interdépendance des écarts : une matière moins chère qui se gaspille, des cadences qui rattrapent le temps en gâchant de la matière.`,
        ];
      },
    },
    {
      id: "la-prime",
      type: "choix",
      titre: "Primer l'atelier ?",
      notions: ["efficiency_variance", "cost_variance"],
      question: (c) => {
        const d = ecartsDirects(c);
        return `Le chef d'atelier touche une prime sur l'écart sur temps, ici ${ecartDit(d.e.mainDOeuvre.temps)}. Sous l'hypothèse des cadences accélérées, que doit faire la direction ?`;
      },
      options: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        const net = `Ses deux écarts réunis font ${eur(e.matiere.quantite)} + ${entre(e.mainDOeuvre.temps)} = ${ecartDit(d.netAtelier)}.`;
        return [
          {
            texte: "Juger l'atelier sur ses deux écarts ensemble, temps et matière",
            juste: d.netAtelier > 0,
            retour: `Oui. ${net} Une prime sur un seul écart fait gagner cet écart aux dépens d'un autre : c'est l'effet pervers du contrôle écart par écart.`,
          },
          {
            texte: "Verser la prime : l'écart sur temps est favorable, l'atelier a tenu son objectif",
            juste: d.netAtelier <= 0,
            retour: `Non : ce serait payer l'atelier pour un gain qu'il a repris en matière. ${net}`,
          },
          {
            texte: "Reporter la faute sur les achats : le kilo a coûté plus cher que le standard",
            juste: false,
            retour: `Non : la hausse du kilo est dans l'écart sur prix, au compte des achats. Les kilos en trop, eux, sont au prix standard et regardent l'atelier. ${net}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["material_price_variance", "efficiency_variance", "cost_variance"],
      texte: (c) => {
        const d = ecartsDirects(c);
        const e = d.e;
        return [
          `À l'usine de ${d.f.entreprise}, la matière dépasse son coût préétabli de ${eur(e.matiere.global)} : ${eur(e.matiere.prix)} sur le prix (les achats), ${eur(e.matiere.quantite)} sur la quantité (l'atelier). La main-d'œuvre directe ne dépasse que de ${eur(e.mainDOeuvre.global)}, mais cache ${ecartDit(e.mainDOeuvre.taux)} sur le taux et ${ecartDit(e.mainDOeuvre.temps)} sur le temps. Ensemble, les charges directes font ${ecartDit(d.totalDirect)}.`,
          "Au niveau de l'examen, vous savez décomposer chaque écart sur charge directe, isoler l'écart mixte et dire pourquoi il reste dans l'écart sur prix, retrouver un prix ou une quantité réels à partir des écarts, croiser deux écarts qui ont une même cause, et attribuer chacun à son responsable sans juger personne sur un seul écart.",
          "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Écart global = écart sur prix + écart sur quantité (matière) = écart sur taux + écart sur temps (main-d'œuvre directe). Le prix s'applique aux quantités réelles, la quantité se valorise au prix standard. Écart mixte = Δprix × Δquantité, compris dans l'écart sur prix.",
    },
  ],
};
