import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { controleBudgetaire, coutPreetabli } from "../monde/ecarts";
import { USINES_DU_COURS, type FicheDeLUsine, type ModeleDeNova } from "../monde/nova-usine";
import type { Chapitre, EtapeChoix, EtapeCurseur, EtapeSimulation, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COÛT PRÉÉTABLI, LE BUDGET STANDARD ET LE BUDGET FLEXIBLE (contrôle de gestion,
 * palier 4 ; BTS CG, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'usine de
 * NOVA a une fiche figée (monde/nova-usine.ts) et tout chiffre vient du modèle du contrôle
 * budgétaire (monde/ecarts.ts). Un trimestre, deux enceintes (Nomade et Salon), toute la
 * production vendue, un seul centre d'analyse (le montage, dont l'unité d'œuvre est
 * l'heure-machine), la distribution hors production.
 *
 * Ce que l'élève construit : la fiche de coût préétabli de chaque enceinte, le coût standard de
 * l'heure-machine, le budget standard, le coût préétabli de la production réelle, le réel, et
 * l'écart global sur coûts. Le piège central : comparer le réel au budget standard (l'écart y
 * mêle l'effet des quantités produites) au lieu du coût préétabli de la production réelle. Puis
 * la distinction nette entre budget flexible du centre (charges fixes constantes) et coût
 * préétabli de l'activité réelle (charges fixes imputées au coût standard).
 *
 * LES TROIS TEMPS (exigence du propriétaire, octobre 2026) :
 *   · guidé : « heure-machine », « fiche », « budget-standard » (la formule est au repère, la
 *     question nomme les chiffres) ;
 *   · autonome : « cout-reel », « a-quoi-comparer », « ecart-global », « budget-flexible » (ni
 *     formule ni chiffres désignés : l'élève les prend dans les documents) ;
 *   · expert : « flexible-ou-preetabli » (erreurs d'étudiants : fixes traités comme variables,
 *     mauvaise base d'heures, écart sur activité pris pour une économie), « variante-activite »
 *     (une activité sous la normale, refaite de bout en bout), « standard-courant » (un standard
 *     révisé et son effet sur les écarts), « quel-standard » (critique de la méthode), « seuil »
 *     et « gestion-par-exception » (le seuil de significativité et ce qu'il cache).
 *
 * L'EXPÉRIENCE AVANT LA FORMULE (exigence du propriétaire, octobre 2026) : deux cycles parier,
 * manipuler, constater, formaliser. « predire-la-production » puis le curseur
 * « experience-production » (la Salon varie : dès quel nombre la production vaut le budget
 * standard), avant « trois-references » et « budget-standard » ; « predire-l-activite » puis le
 * curseur « experience-activite » (les heures-machine varient : coût préétabli et budget flexible
 * se croisent à l'activité normale), avant « budget-flexible ». Un laboratoire,
 * « laboratoire-production » (les quantités de chaque enceinte varient ; défi : une autre
 * production qui vaut le budget standard), après « ecart-global ».
 *
 * Les petits calculs propres au chapitre (la variante d'activité, le standard courant, la part de
 * chaque écart dans son coût préétabli) se font ici, documentés, à partir de la fiche, sans la
 * modifier.
 */

/**
 * LE SEUIL DE SIGNIFICATIVITÉ DU COURS : un écart ne s'analyse que s'il dépasse 3 % du coût
 * préétabli de son poste (la gestion par exception). Hypothèse du cours, dans l'ordre de grandeur
 * des seuils de 2 à 5 % qu'on rencontre dans l'industrie et dans les sujets d'examen.
 */
export const SEUIL_DE_SIGNIFICATIVITE = 0.03;

/**
 * LA VARIANTE D'ACTIVITÉ : le centre de montage aurait tourné 4 600 heures-machine, sous son
 * activité normale de 5 000. Hypothèse du cours, pour voir le budget flexible et le coût
 * préétabli de l'activité réelle se croiser dans l'autre sens.
 */
export const ACTIVITE_DE_LA_VARIANTE = 4_600;

/**
 * LE STANDARD COURANT DE LA VARIANTE : la matière par enceinte que l'usine consomme d'ordinaire,
 * gaspillage habituel compris, soit 2,5 % de plus que le standard normal de la fiche (0,82 kg par
 * Nomade au lieu de 0,8 ; 2,05 kg par Salon au lieu de 2). Hypothèse du cours.
 */
export const SURCONSOMMATION_DU_STANDARD_COURANT = 0.025;

/** L'usine seule : les coûts préétablis se calculent sur une production. */
export const ENTREPRISES_DES_ECARTS: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 3 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** Le sens d'un écart sur charge : positif défavorable, négatif favorable. */
export const sens = (x: number) => (x > 0 ? "défavorable" : x < 0 ? "favorable" : "sans écart");
/** Un écart sur charge écrit avec son sens : « 29 700 € défavorable ». */
export const ecartDit = (x: number) => `${eur(Math.abs(x))} ${sens(x)}`;

/** La fiche de l'usine du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLUsine => USINES_DU_COURS[c.code]!;

/** Les budgets du trimestre, et ce que le chapitre en tire. */
export function budgetsDeLUsine(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = controleBudgetaire(f);
  const r = f.realise;
  const reelle = (m: ModeleDeNova) => r.ventes[m.code].quantite;
  const modeles = f.modeles.map((m) => ({ m, cout: coutPreetabli(f, m), prevue: m.quantitePrevue, reelle: reelle(m) }));
  const cHm = e.coutStandardDeLHeureMachine;
  const fixesParHeure = auCentime(f.centre.chargesFixes / f.centre.activiteNormale);
  const heuresMachine = r.centre.heuresMachine;
  /** Le coût préétabli de l'activité réelle : les heures-machine réelles au coût standard, fixes imputés. */
  const preetabliDeLActiviteReelle = auCentime(cHm * heuresMachine);

  // La variante d'activité : mêmes fixes, même coût variable, une autre activité réelle.
  const hV = ACTIVITE_DE_LA_VARIANTE;
  const variante = {
    heures: hV,
    budgetFlexible: auCentime(f.centre.chargesFixes + f.centre.coutVariableParHeure * hV),
    preetabli: auCentime(cHm * hV),
    coefficient: auCentime(hV / f.centre.activiteNormale),
  };

  // Le standard courant : plus de matière par enceinte, au même prix standard du kilo.
  const kilosCourants = auCentime(e.preetabliDuReel.kilos * (1 + SURCONSOMMATION_DU_STANDARD_COURANT));
  const courant = {
    parModele: modeles.map((x) => ({ nom: x.m.nom, kilos: auCentime(x.m.matiereParUnite * (1 + SURCONSOMMATION_DU_STANDARD_COURANT)) })),
    kilos: kilosCourants,
    quantite: auCentime((r.matiere.kilos - kilosCourants) * f.prixStandardDuKilo),
    preetabliDuReel: auCentime(e.preetabliDuReel.total + (kilosCourants - e.preetabliDuReel.kilos) * f.prixStandardDuKilo),
  };

  // Le seuil de significativité : chaque écart global rapporté au coût préétabli de son poste.
  const postes = [
    { code: "matiere", nom: "Matière", ecart: e.matiere.global, preetabli: e.preetabliDuReel.matiere },
    { code: "mainDOeuvre", nom: "Main-d'œuvre directe", ecart: e.mainDOeuvre.global, preetabli: e.preetabliDuReel.mainDOeuvre },
    { code: "centre", nom: `Centre de ${f.centre.nom.toLowerCase()}`, ecart: e.centre.global, preetabli: e.preetabliDuReel.centre },
  ].map((p) => ({ ...p, part: auDixieme((p.ecart / p.preetabli) * 100), aAnalyser: Math.abs(p.ecart) > SEUIL_DE_SIGNIFICATIVITE * p.preetabli }));

  return {
    f,
    e,
    modeles,
    cHm,
    fixesParHeure,
    heuresMachine,
    preetabliDeLActiviteReelle,
    /** Budget flexible du centre moins coût préétabli de l'activité réelle : l'écart sur activité. */
    ecartFlexibleMoinsPreetabli: auCentime(e.centre.budgetFlexible - preetabliDeLActiviteReelle),
    effetDeLaProduction: auCentime(e.preetabliDuReel.total - e.budgetStandard.total),
    reelMoinsBudget: auCentime(e.reelTotal - e.budgetStandard.total),
    qTotalePrevue: modeles.reduce((t, x) => t + x.prevue, 0),
    qTotaleReelle: modeles.reduce((t, x) => t + x.reelle, 0),
    variante,
    ecartDeLaVariante: auCentime(variante.budgetFlexible - variante.preetabli),
    courant,
    ecartGlobalCourant: auCentime(e.reelTotal - courant.preetabliDuReel),
    postes,
    seuilPct: auDixieme(SEUIL_DE_SIGNIFICATIVITE * 100),
  };
}

export type BudgetsDeLUsine = ReturnType<typeof budgetsDeLUsine>;

/** Ce que suppose la simulation, et la convention des écarts : le début de chaque chapitre du lot. */
export function ceQueSupposeLaSimulation(c: Pick<Cas, "code">): string[] {
  const f = ficheDe(c);
  return [
    `Ce chapitre se joue dans la simulation du cours, à l'usine de ${f.entreprise}, sur un trimestre. L'usine fabrique ${f.modeles.map((m) => `la ${m.nom}`).join(" et ")}. Toute la production est vendue : il n'y a pas de stock. Les charges de production passent par trois postes : la matière, la main-d'œuvre directe, et un seul centre d'analyse, le centre de ${f.centre.nom.toLowerCase()}, dont l'unité d'œuvre est l'heure-machine. La distribution reste hors production.`,
    "Convention, valable pour tout le cours : un écart est le réel moins le prévu. Sur une charge, un écart positif est défavorable (on a dépensé plus) et un écart négatif favorable ; sur un produit ou une marge, c'est l'inverse.",
  ];
}

/** Les standards d'une enceinte et les quantités du trimestre. */
export function tableauDesStandards(c: Pick<Cas, "code">): TableauDeDonnees {
  const b = budgetsDeLUsine(c);
  const col = (g: (x: (typeof b.modeles)[number]) => string) => b.modeles.map(g);
  return {
    titre: `Les standards d'une enceinte ${b.f.entreprise} et les quantités du trimestre`,
    colonnes: b.modeles.map((x) => x.m.nom),
    lignes: [
      { libelle: "Matière par enceinte (kg)", valeurs: col((x) => qte(x.m.matiereParUnite)) },
      { libelle: "Main-d'œuvre directe par enceinte (heures)", valeurs: col((x) => qte(x.m.heuresParUnite)) },
      { libelle: "Heures-machine par enceinte", valeurs: col((x) => qte(x.m.heuresMachineParUnite)) },
      { libelle: "Prix de vente prévu", valeurs: col((x) => eur(x.m.prixPrevu)) },
      { libelle: "Enceintes prévues au budget", valeurs: col((x) => qte(x.prevue)) },
      { libelle: "Enceintes fabriquées et vendues", valeurs: col((x) => qte(x.reelle)) },
    ],
  };
}

function tableauDuReel(c: Cas): TableauDeDonnees {
  const r = ficheDe(c).realise;
  return {
    titre: "Ce que le trimestre a réellement consommé",
    colonnes: ["Réel du trimestre"],
    lignes: [
      { libelle: "Matière consommée (kg)", valeurs: [qte(r.matiere.kilos)] },
      { libelle: "Prix réel du kilo", valeurs: [eur(r.matiere.prixDuKilo)] },
      { libelle: "Heures de main-d'œuvre directe payées", valeurs: [qte(r.mainDOeuvre.heures)] },
      { libelle: "Taux horaire réel", valeurs: [eur(r.mainDOeuvre.tauxHoraire)] },
      { libelle: "Heures-machine du centre", valeurs: [qte(r.centre.heuresMachine)] },
      { libelle: "Coût réel du centre", valeurs: [eur(r.centre.cout)] },
    ],
  };
}

function tableauDesPostes(c: Cas): TableauDeDonnees {
  const b = budgetsDeLUsine(c);
  return {
    titre: "Les postes de la production réelle",
    colonnes: ["Coût préétabli", "Réel", "Écart global"],
    lignes: b.postes.map((p) => ({ libelle: p.nom, valeurs: [eur(p.preetabli), eur(auCentime(p.preetabli + p.ecart)), eur(p.ecart)] })),
  };
}

/**
 * L'EXPÉRIENCE DE LA PRODUCTION : la Nomade tenue à sa quantité réelle, la Salon (le modèle le plus
 * coûteux) varie. À partir de combien de Salon la production réelle vaut-elle, au coût préétabli,
 * plus que le budget standard ? Les deux droites sont affines dans le nombre de Salon.
 */
export function experienceDeLaProduction(c: Pick<Cas, "code">) {
  const b = budgetsDeLUsine(c);
  const variable = [...b.modeles].sort((x, y) => y.cout.total - x.cout.total)[0]!;
  const autres = b.modeles.filter((x) => x !== variable);
  const fixe = auCentime(autres.reduce((t, x) => t + x.reelle * x.cout.total, 0));
  const preetabli = (q: number) => auCentime(fixe + q * variable.cout.total);
  // La plus petite quantité de Salon où le préétabli de la production atteint le budget standard.
  const seuil = Math.ceil((b.e.budgetStandard.total - fixe) / variable.cout.total - 1e-9);
  return { b, variable, autres, fixe, preetabli, seuil, min: variable.prevue - 1_000, max: variable.prevue + 1_000 };
}

/**
 * L'EXPÉRIENCE DE L'ACTIVITÉ : les heures-machine du centre varient. Le coût préétabli de ces heures
 * (au coût standard, charges fixes imputées) et le budget flexible (charges fixes constantes) sont
 * deux droites qui se croisent à l'activité normale.
 */
export function experienceDeLActivite(c: Pick<Cas, "code">) {
  const b = budgetsDeLUsine(c);
  const f = b.f;
  const flexible = (h: number) => auCentime(f.centre.chargesFixes + f.centre.coutVariableParHeure * h);
  const preetabli = (h: number) => auCentime(b.cHm * h);
  const seuil = Math.ceil(f.centre.chargesFixes / (b.cHm - f.centre.coutVariableParHeure) - 1e-9);
  return { b, flexible, preetabli, seuil, min: f.centre.activiteNormale - 1_000, max: f.centre.activiteNormale + 1_000 };
}

const enListeSimple = (t: readonly string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);

/** Le pari avant l'expérience : le retour ne corrige pas, il renvoie au curseur. */
const pari = (texte: string, juste: boolean): { texte: string; juste: boolean; retour: string } => ({
  texte,
  juste,
  retour: "Pari noté. L'étape suivante le tranche : faites tourner l'usine avec le curseur, et regardez.",
});

/** L'étape de curseur sur la production réelle, reprise par le cas « Le budget dépassé ». */
export const ETAPE_DE_LA_PRODUCTION: EtapeCurseur = {
  id: "experience-production",
  type: "curseur",
  titre: "Faites varier la production",
  notions: ["standard_costing"],
  question: (c) => {
    const x = experienceDeLaProduction(c);
    return `La simulation tient ${enListeSimple(x.autres.map((a) => `les ${qte(a.reelle)} ${a.m.nom} fabriquées`))} et fait varier les ${x.variable.m.nom}. Déplacez le curseur : la lecture chiffre la production au coût préétabli (${x.b.modeles.map((m) => `${eur(m.cout.total)} la ${m.m.nom}`).join(", ")}) face au budget standard de ${eur(x.b.e.budgetStandard.total)}. Placez-le sur le plus petit nombre de ${x.variable.m.nom} où la production réelle vaut au moins le budget standard.`;
  },
  grandeur: (c) => ({ libelle: `${experienceDeLaProduction(c).variable.m.nom} fabriquées`, unite: "enceintes" }),
  cible: (c) => {
    const x = experienceDeLaProduction(c);
    return { attendu: x.seuil, min: x.min, max: x.max };
  },
  lecture: (c, q) => {
    const x = experienceDeLaProduction(c);
    const p = x.preetabli(q);
    return [
      { libelle: "Coût préétabli de la production", montant: p },
      { libelle: "Budget standard", montant: x.b.e.budgetStandard.total },
      { libelle: "Effet des quantités produites", montant: auCentime(p - x.b.e.budgetStandard.total), fort: true },
    ];
  },
  droites: (c) => {
    const x = experienceDeLaProduction(c);
    return { produit: (q) => x.preetabli(q), cout: () => x.b.e.budgetStandard.total, libelles: ["Coût préétabli de la production", "Budget standard"] };
  },
  zones: ["La production vaut plus que le budget", "La production vaut moins que le budget"],
  rates: () => ({
    dessous: "À cette position, la production vaut encore moins que le budget standard : montez.",
    dessus: "Avec une enceinte de moins, la production vaut déjà au moins le budget standard : cherchez la plus petite position.",
  }),
  montrer: "Montrer la position",
  explication: (c) => {
    const x = experienceDeLaProduction(c);
    const v = x.variable;
    return [
      `Chaque ${v.m.nom} de plus ajoute ${eur(v.cout.total)} au coût préétabli. ${x.autres.map((a) => `Avec ${qte(a.prevue - a.reelle)} ${a.m.nom} de moins que prévu (${eur(auCentime((a.prevue - a.reelle) * a.cout.total))})`).join(", ")}, la production réelle rejoint le budget standard dès ${qte(x.seuil)} ${v.m.nom}. L'usine en a fabriqué ${qte(v.reelle)} : sa production vaut ${eur(x.b.effetDeLaProduction)} de plus que le budget, avec moins d'enceintes au total.`,
      "Ce que vous venez de voir porte un nom : le coût préétabli de la production réelle. C'est lui, et non le budget standard, que le réel doit affronter.",
    ];
  },
};

const PREDIRE_LA_PRODUCTION: EtapeChoix = {
  id: "predire-la-production",
  type: "choix",
  titre: "Pariez : moins d'enceintes, moins de coût ?",
  notions: ["standard_costing"],
  question: (c) => {
    const b = budgetsDeLUsine(c);
    return `L'usine a fabriqué ${qte(b.qTotaleReelle)} enceintes au lieu des ${qte(b.qTotalePrevue)} du budget. Au coût préétabli, que vaut sa production réelle face au budget standard de ${eur(b.e.budgetStandard.total)} ?`;
  },
  options: (c) => {
    const b = budgetsDeLUsine(c);
    return [
      pari("Plus que le budget standard", b.effetDeLaProduction > 0),
      pari("Moins que le budget standard, puisqu'il y a moins d'enceintes", b.effetDeLaProduction < 0),
      pari("Autant que le budget standard : les coûts préétablis ne bougent pas", b.effetDeLaProduction === 0),
    ];
  },
};

const PREDIRE_L_ACTIVITE: EtapeChoix = {
  id: "predire-l-activite",
  type: "choix",
  titre: "Pariez : le centre tourne plus",
  notions: ["fixed_costs"],
  question: (c) => {
    const b = budgetsDeLUsine(c);
    return `Le centre a tourné ${qte(b.heuresMachine)} heures-machine, au-dessus de son activité normale de ${qte(b.f.centre.activiteNormale)}. Au coût standard de ${eur(b.cHm)}, ces heures valent-elles plus ou moins que le budget flexible (les charges fixes, plus ${eur(b.f.centre.coutVariableParHeure)} par heure) ?`;
  },
  options: (c) => {
    const b = budgetsDeLUsine(c);
    return [
      pari("Plus que le budget flexible", b.ecartFlexibleMoinsPreetabli < 0),
      pari("Moins que le budget flexible", b.ecartFlexibleMoinsPreetabli > 0),
      pari("Autant : le coût standard est fait pour cela", b.ecartFlexibleMoinsPreetabli === 0),
    ];
  },
};

const ETAPE_DE_L_ACTIVITE: EtapeCurseur = {
  id: "experience-activite",
  type: "curseur",
  titre: "Faites tourner le centre",
  notions: ["fixed_costs", "variable_costs"],
  question: (c) => {
    const x = experienceDeLActivite(c);
    const f = x.b.f;
    return `Faites tourner le centre de ${f.centre.nom.toLowerCase()} de ${qte(x.min)} à ${qte(x.max)} heures-machine. La lecture donne le coût préétabli de ces heures (${eur(x.b.cHm)} chacune) et le budget flexible (${eur(f.centre.chargesFixes)} de charges fixes, plus ${eur(f.centre.coutVariableParHeure)} par heure). Placez le curseur sur la plus petite activité où le coût préétabli atteint le budget flexible.`;
  },
  grandeur: () => ({ libelle: "Heures-machine du centre", unite: "heures-machine" }),
  cible: (c) => {
    const x = experienceDeLActivite(c);
    return { attendu: x.seuil, min: x.min, max: x.max };
  },
  lecture: (c, h) => {
    const x = experienceDeLActivite(c);
    return [
      { libelle: "Coût préétabli des heures", montant: x.preetabli(h) },
      { libelle: "Budget flexible", montant: x.flexible(h) },
      { libelle: "Charges fixes imputées", montant: auCentime(x.b.fixesParHeure * h) },
      { libelle: "Budget flexible moins coût préétabli", montant: auCentime(x.flexible(h) - x.preetabli(h)), fort: true },
    ];
  },
  droites: (c) => {
    const x = experienceDeLActivite(c);
    return { produit: (h) => x.preetabli(h), cout: (h) => x.flexible(h), libelles: ["Coût préétabli des heures", "Budget flexible"] };
  },
  zones: ["Boni de suractivité", "Coût de la sous-activité"],
  rates: () => ({
    dessous: "À cette activité, le coût préétabli reste sous le budget flexible : faites tourner le centre davantage.",
    dessus: "Une heure de moins, le coût préétabli atteint encore le budget flexible : cherchez la plus petite activité.",
  }),
  montrer: "Montrer l'activité",
  explication: (c) => {
    const x = experienceDeLActivite(c);
    const b = x.b;
    const f = b.f;
    return [
      `Les deux se rejoignent à ${qte(x.seuil)} heures-machine, l'activité normale : là, le coût standard impute exactement les ${eur(f.centre.chargesFixes)} de charges fixes. Chaque heure de plus en impute ${eur(b.fixesParHeure)} que le budget flexible ne compte pas : à ${qte(b.heuresMachine)} heures, ${eur(Math.abs(b.ecartFlexibleMoinsPreetabli))}. Chaque heure de moins en laisse ${eur(b.fixesParHeure)} sans les imputer : à ${qte(b.variante.heures)} heures, ${eur(b.ecartDeLaVariante)}.`,
      "Ce que vous venez de voir est l'écart sur activité : le budget flexible garde les charges fixes constantes, le coût préétabli les fait suivre les heures.",
    ];
  },
};

/**
 * LE LABORATOIRE DE LA PRODUCTION : les quantités de chaque modèle varient. Défi : une production
 * réelle qui vaut, au coût préétabli, le budget standard à `TOLERANCE_DU_LABORATOIRE` près, dans une
 * autre composition que celle du budget. Le budget standard ne suit pas la production ; le coût
 * préétabli de la production réelle, si.
 */
export const TOLERANCE_DU_LABORATOIRE = 500;

export function laboratoireDeLaProduction(c: Pick<Cas, "code">) {
  const b = budgetsDeLUsine(c);
  const leviers = b.modeles.map((x) => ({
    code: x.m.code,
    libelle: `${x.m.nom} fabriquées`,
    unite: "enceintes",
    min: Math.max(0, x.prevue - 4_000),
    max: x.prevue + 3_000,
    pas: 100,
    depart: x.reelle,
  }));
  const quantite = (p: Readonly<Record<string, number>>, x: (typeof b.modeles)[number]) => p[x.m.code] ?? x.reelle;
  const somme = (p: Readonly<Record<string, number>>, g: (x: (typeof b.modeles)[number]) => number) => auCentime(b.modeles.reduce((t, x) => t + quantite(p, x) * g(x), 0));
  const preetabli = (p: Readonly<Record<string, number>>) => somme(p, (x) => x.cout.total);
  const ecart = (p: Readonly<Record<string, number>>) => auCentime(preetabli(p) - b.e.budgetStandard.total);
  const auBudget = (p: Readonly<Record<string, number>>) => b.modeles.every((x) => quantite(p, x) === x.prevue);
  // Une solution sur le pas : 10 600 Nomade et 4 600 Salon valent 684 200 €, à 200 € du budget.
  const solution: Record<string, number> = Object.fromEntries(b.modeles.map((x) => [x.m.code, x.reelle]));
  const plusCher = [...b.modeles].sort((x, y) => y.cout.total - x.cout.total)[0]!;
  const autre = b.modeles.find((x) => x !== plusCher)!;
  const reste = b.e.budgetStandard.total - plusCher.reelle * plusCher.cout.total;
  solution[autre.m.code] = Math.round(reste / autre.cout.total / 100) * 100;
  return { b, leviers, preetabli, ecart, auBudget, solution, somme, plusCher };
}

const LABORATOIRE_DE_LA_PRODUCTION: EtapeSimulation = {
  id: "laboratoire-production",
  type: "simulation",
  titre: "Le laboratoire de la production",
  notions: ["standard_costing", "cost_variance"],
  question: (c) => {
    const x = laboratoireDeLaProduction(c);
    return `Faites tourner l'usine avec d'autres quantités de chaque enceinte. Le tableau chiffre en direct la production au coût préétabli, poste par poste, face au budget standard de ${eur(x.b.e.budgetStandard.total)}, et sa marge préétablie face à la marge prévue.`;
  },
  leviers: (c) => laboratoireDeLaProduction(c).leviers,
  lecture: (c, p) => {
    const x = laboratoireDeLaProduction(c);
    const b = x.b;
    const depart = Object.fromEntries(x.leviers.map((l) => [l.code, l.depart]));
    const ligne = (libelle: string, g: (q: Readonly<Record<string, number>>) => number, fort?: boolean) => ({ libelle, montant: g(p), reference: g(depart), ...(fort ? { fort } : {}) });
    return [
      ligne("Matière au coût préétabli", (q) => x.somme(q, (m) => m.cout.matiere)),
      ligne("Main-d'œuvre directe au coût préétabli", (q) => x.somme(q, (m) => m.cout.mainDOeuvre)),
      ligne("Centre au coût préétabli", (q) => x.somme(q, (m) => m.cout.centre)),
      ligne("Coût préétabli de la production", x.preetabli),
      { libelle: "Budget standard", montant: b.e.budgetStandard.total, reference: b.e.budgetStandard.total },
      ligne("Production moins budget standard", x.ecart, true),
      ligne("Marge préétablie de la production", (q) => x.somme(q, (m) => m.cout.marge)),
      { libelle: "Marge préétablie prévue", montant: b.e.ventes.margePrevue, reference: b.e.ventes.margePrevue },
    ];
  },
  defi: (c) => {
    const x = laboratoireDeLaProduction(c);
    return {
      consigne: `Défi : trouvez une production qui vaut, au coût préétabli, le budget standard à ${eur(TOLERANCE_DU_LABORATOIRE)} près, sans être celle du budget.`,
      atteint: (p) => Math.abs(x.ecart(p)) <= TOLERANCE_DU_LABORATOIRE && !x.auBudget(p),
      indice: (p) => {
        const d = x.ecart(p);
        if (Math.abs(d) <= TOLERANCE_DU_LABORATOIRE) return "C'est la production du budget : changez sa composition.";
        return d > 0
          ? `La production vaut ${eur(d)} de plus que le budget standard : fabriquez moins, sachant qu'une ${x.plusCher.m.nom} pèse ${eur(x.plusCher.cout.total)}.`
          : `La production vaut ${eur(-d)} de moins que le budget standard : fabriquez davantage.`;
      },
      solution: x.solution,
    };
  },
  montrer: "Montrer une production",
  explication: (c, p) => {
    const x = laboratoireDeLaProduction(c);
    const b = x.b;
    const marge = x.somme(p, (m) => m.cout.marge);
    return [
      `${b.modeles.map((m) => `${qte(p[m.m.code] ?? m.reelle)} ${m.m.nom}`).join(" et ")} valent ${eur(x.preetabli(p))} au coût préétabli, autant que le budget standard à ${eur(Math.abs(x.ecart(p)))} près. Pourtant, ce n'est pas la production du budget : sa marge préétablie est de ${eur(marge)} contre ${eur(b.e.ventes.margePrevue)} prévus.`,
      "Un même total peut cacher deux productions différentes. Le réel se compare donc toujours au coût préétabli de sa propre production, recalculé quantité par quantité, jamais au total du budget.",
    ];
  },
};

/** Le calcul d'un total sur les modèles : « 12 000 × 32 € + 4 000 × 75 € = 684 000 € ». */
const surLesModeles = (b: BudgetsDeLUsine, q: (x: BudgetsDeLUsine["modeles"][number]) => number, total: number) =>
  `${b.modeles.map((x) => `${qte(q(x))} × ${eur(x.cout.total)}`).join(" + ")} = ${eur(total)}`;

export const LE_COUT_PREETABLI_ET_LES_BUDGETS: Chapitre = {
  code: "le-cout-preetabli-et-les-budgets",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Le coût préétabli, le budget standard et le budget flexible",
  accroche:
    "Le réel dépasse le budget : avant de parler de dérapage, il faut savoir ce que la production réellement faite devait coûter. La fiche de coût préétabli, le budget standard, le budget flexible, le choix du standard et le seuil qui dit quels écarts méritent une analyse.",
  objectifs: [
    "Établir la fiche de coût préétabli d'un produit et le coût standard d'une unité d'œuvre",
    "Distinguer budget standard, coût préétabli de la production réelle et budget flexible",
    "Calculer l'écart global sur coûts face à la bonne référence",
    "Mesurer l'effet du choix du standard et trier les écarts par un seuil de significativité",
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
      titre: "L'usine et son trimestre",
      notions: ["standard_costing"],
      tableau: tableauDesStandards,
      texte: (c) => {
        const f = ficheDe(c);
        return [
          ...ceQueSupposeLaSimulation(c),
          `Avant le trimestre, le contrôle de gestion a fixé des standards : ce qu'une enceinte doit consommer (le tableau), le prix standard du kilo de matière, ${eur(f.prixStandardDuKilo)}, et le taux horaire standard de la main-d'œuvre directe, ${eur(f.tauxHoraireStandard)}, charges sociales comprises.`,
          `Le centre de ${f.centre.nom.toLowerCase()} a une activité normale de ${qte(f.centre.activiteNormale)} heures-machine par trimestre. Il coûte ${eur(f.centre.coutVariableParHeure)} par heure-machine (énergie, consommables) et ${eur(f.centre.chargesFixes)} de charges fixes par trimestre (amortissements, encadrement), quelle que soit son activité.`,
        ];
      },
      repere: () =>
        "Fiche de coût préétabli d'un produit : pour chaque élément, quantité standard × coût unitaire standard. Matière : kilos × prix standard du kilo ; main-d'œuvre directe : heures × taux standard ; centre : unités d'œuvre × coût standard de l'unité d'œuvre (coût variable + charges fixes ÷ activité normale).",
    },
    {
      id: "heure-machine",
      type: "montants",
      titre: "Le coût standard de l'heure-machine",
      notions: ["standard_costing", "fixed_costs", "variable_costs"],
      question: (c) => {
        const f = ficheDe(c);
        return `Le coût standard de l'heure-machine est son coût variable plus sa part de charges fixes, calculée sur l'activité normale. Calculez la part de charges fixes d'une heure-machine (${eur(f.centre.chargesFixes)} ÷ ${qte(f.centre.activiteNormale)}), puis le coût standard de l'heure-machine (${eur(f.centre.coutVariableParHeure)} plus cette part).`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        return [
          { libelle: "Charges fixes par heure-machine", attendu: b.fixesParHeure, calcul: `${eur(f.centre.chargesFixes)} ÷ ${qte(f.centre.activiteNormale)} = ${eur(b.fixesParHeure)}` },
          { libelle: "Coût standard de l'heure-machine", attendu: b.cHm, calcul: `${eur(f.centre.coutVariableParHeure)} + ${eur(b.fixesParHeure)} = ${eur(b.cHm)}` },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        return [
          `L'heure-machine coûte ${eur(b.cHm)} au standard. La part fixe, ${eur(b.fixesParHeure)}, n'est juste qu'à l'activité normale : si le centre tourne plus, ses charges fixes ne bougent pas, mais le standard en impute ${eur(b.fixesParHeure)} à chaque heure de plus. C'est l'origine du budget flexible, plus loin dans le chapitre.`,
        ];
      },
    },
    {
      id: "fiche",
      type: "montants",
      titre: "La fiche de coût préétabli",
      notions: ["standard_costing"],
      tableau: tableauDesStandards,
      question: (c) => {
        const b = budgetsDeLUsine(c);
        const [n, s] = b.modeles;
        return `Établissez la fiche de coût préétabli de la ${n!.m.nom} : matière (kilos × ${eur(b.f.prixStandardDuKilo)}), main-d'œuvre directe (heures × ${eur(b.f.tauxHoraireStandard)}), centre (heures-machine × ${eur(b.cHm)}), puis son coût préétabli total. Donnez ensuite le coût préétabli total de la ${s!.m.nom}, et la marge préétablie de chacune (prix de vente prévu moins coût préétabli).`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const [n, s] = b.modeles;
        const total = (x: (typeof b.modeles)[number]) =>
          `${qte(x.m.matiereParUnite)} × ${eur(f.prixStandardDuKilo)} + ${qte(x.m.heuresParUnite)} × ${eur(f.tauxHoraireStandard)} + ${qte(x.m.heuresMachineParUnite)} × ${eur(b.cHm)} = ${eur(x.cout.matiere)} + ${eur(x.cout.mainDOeuvre)} + ${eur(x.cout.centre)} = ${eur(x.cout.total)}`;
        return [
          { libelle: `Matière d'une ${n!.m.nom}`, attendu: n!.cout.matiere, calcul: `${qte(n!.m.matiereParUnite)} × ${eur(f.prixStandardDuKilo)} = ${eur(n!.cout.matiere)}` },
          { libelle: `Main-d'œuvre directe d'une ${n!.m.nom}`, attendu: n!.cout.mainDOeuvre, calcul: `${qte(n!.m.heuresParUnite)} × ${eur(f.tauxHoraireStandard)} = ${eur(n!.cout.mainDOeuvre)}` },
          { libelle: `Centre de montage d'une ${n!.m.nom}`, attendu: n!.cout.centre, calcul: `${qte(n!.m.heuresMachineParUnite)} × ${eur(b.cHm)} = ${eur(n!.cout.centre)}` },
          { libelle: `Coût préétabli d'une ${n!.m.nom}`, attendu: n!.cout.total, calcul: total(n!) },
          { libelle: `Coût préétabli d'une ${s!.m.nom}`, attendu: s!.cout.total, calcul: total(s!) },
          ...b.modeles.map((x) => ({ libelle: `Marge préétablie d'une ${x.m.nom}`, attendu: x.cout.marge, calcul: `${eur(x.m.prixPrevu)} − ${eur(x.cout.total)} = ${eur(x.cout.marge)}` })),
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        return [
          `${b.modeles.map((x, i) => `${i === 0 ? "Une" : "une"} ${x.m.nom} doit coûter ${eur(x.cout.total)} et rapporter ${eur(x.cout.marge)} de marge préétablie`).join(" ; ")}. Ces fiches sont la référence de tout le trimestre : chaque enceinte fabriquée « vaut » son coût préétabli, quelle que soit la dépense réelle.`,
        ];
      },
    },
    PREDIRE_LA_PRODUCTION,
    ETAPE_DE_LA_PRODUCTION,
    {
      id: "trois-references",
      type: "lecture",
      titre: "Trois références pour un même trimestre",
      notions: ["standard_costing", "cost_variance"],
      texte: (c) => {
        const b = budgetsDeLUsine(c);
        return [
          `Le budget standard chiffre, au coût préétabli, la production prévue : ${b.modeles.map((x) => `${qte(x.prevue)} ${x.m.nom}`).join(" et ")}. C'est l'objectif voté avant le trimestre.`,
          `Le coût préétabli de la production réelle chiffre, au même coût préétabli, ce que l'usine a vraiment fabriqué : ${b.modeles.map((x) => `${qte(x.reelle)} ${x.m.nom}`).join(" et ")}. C'est ce que cette production aurait dû coûter si chaque standard avait été tenu. Pour la matière et la main-d'œuvre directe, entièrement variables, il se confond avec le budget flexible.`,
          "Le budget flexible adapte le budget à l'activité réelle : ses charges variables suivent l'activité, ses charges fixes restent celles du budget. Au centre, il diffère du coût préétabli, qui impute les charges fixes au coût standard de chaque heure.",
        ];
      },
      repere: () =>
        "Budget standard = Σ quantité prévue × coût préétabli unitaire. Coût préétabli de la production réelle = Σ quantité réelle × coût préétabli unitaire. Budget flexible du centre = charges fixes du budget + coût variable par unité d'œuvre × activité réelle. Écart global sur coûts = coût réel − coût préétabli de la production réelle.",
    },
    {
      id: "budget-standard",
      type: "montants",
      titre: "Le budget standard et le préétabli du réel",
      notions: ["standard_costing"],
      tableau: tableauDesStandards,
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `Avec les coûts préétablis de ${b.modeles.map((x) => `${eur(x.cout.total)} pour la ${x.m.nom}`).join(" et ")}, calculez le budget standard du trimestre (les enceintes prévues au budget), puis le coût préétabli de la production réelle (les enceintes fabriquées).`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        return [
          { libelle: "Budget standard", attendu: b.e.budgetStandard.total, calcul: surLesModeles(b, (x) => x.prevue, b.e.budgetStandard.total) },
          { libelle: "Coût préétabli de la production réelle", attendu: b.e.preetabliDuReel.total, calcul: surLesModeles(b, (x) => x.reelle, b.e.preetabliDuReel.total) },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        return [
          `L'usine a fabriqué ${qte(b.qTotaleReelle)} enceintes au lieu de ${qte(b.qTotalePrevue)}, et pourtant sa production réelle vaut ${eur(b.effetDeLaProduction)} de plus au coût préétabli : ${b.modeles.map((x) => `${x.reelle >= x.prevue ? "+" : "−"}${qte(Math.abs(x.reelle - x.prevue))} ${x.m.nom} à ${eur(x.cout.total)}`).join(", ")}. La production a glissé vers l'enceinte la plus coûteuse.`,
        ];
      },
    },
    {
      id: "cout-reel",
      type: "montants",
      titre: "Le coût réel de la production",
      notions: ["cost_variance"],
      tableau: tableauDuReel,
      question: () => "À partir du tableau, calculez le coût réel de la matière, celui de la main-d'œuvre directe, puis le coût réel total de la production du trimestre.",
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const r = b.f.realise;
        return [
          { libelle: "Coût réel de la matière", attendu: b.e.reel.matiere, calcul: `${qte(r.matiere.kilos)} × ${eur(r.matiere.prixDuKilo)} = ${eur(b.e.reel.matiere)}` },
          { libelle: "Coût réel de la main-d'œuvre directe", attendu: b.e.reel.mainDOeuvre, calcul: `${qte(r.mainDOeuvre.heures)} × ${eur(r.mainDOeuvre.tauxHoraire)} = ${eur(b.e.reel.mainDOeuvre)}` },
          { libelle: "Coût réel total de la production", attendu: b.e.reelTotal, calcul: `${eur(b.e.reel.matiere)} + ${eur(b.e.reel.mainDOeuvre)} + ${eur(b.e.reel.centre)} = ${eur(b.e.reelTotal)}` },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        return [`La production du trimestre a coûté ${eur(b.e.reelTotal)}. Reste à savoir à quoi comparer ce chiffre.`];
      },
    },
    {
      id: "a-quoi-comparer",
      type: "choix",
      titre: "À quoi comparer le réel ?",
      notions: ["cost_variance", "standard_costing"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `Le réel est de ${eur(b.e.reelTotal)}. Le budget standard était de ${eur(b.e.budgetStandard.total)} ; le coût préétabli de la production réelle vaut ${eur(b.e.preetabliDuReel.total)}. Pour juger comment l'usine a produit, à quoi faut-il comparer le réel ?`;
      },
      options: (c) => {
        const b = budgetsDeLUsine(c);
        const pourquoi = `Le budget standard chiffre ${qte(b.qTotalePrevue)} enceintes dans la composition prévue ; l'usine en a fabriqué ${qte(b.qTotaleReelle)}, dans une autre composition. Comparer le réel au budget standard mêle deux choses : ce que les quantités produites ont changé (${eur(b.effetDeLaProduction)}) et la façon de produire (${eur(b.e.ecartGlobalSurCouts)}).`;
        return [
          {
            texte: "Au coût préétabli de la production réelle : la même production, au standard",
            juste: true,
            retour: `Oui. ${pourquoi} Seul le second mesure l'efficacité de l'usine : c'est l'écart global sur coûts.`,
          },
          {
            texte: "Au budget standard : c'est l'objectif voté avant le trimestre",
            juste: false,
            retour: `Non. ${pourquoi} Le budget standard reste utile pour l'écart de résultat, pas pour juger la production.`,
          },
          {
            texte: "Au coût réel du trimestre précédent : c'est un coût constaté, donc indiscutable",
            juste: false,
            retour: `Non : un coût passé porte ses propres gaspillages et une autre production. Le contrôle budgétaire juge le réel face au standard, sur la production réellement faite. ${pourquoi}`,
          },
        ];
      },
    },
    {
      id: "ecart-global",
      type: "montants",
      titre: "L'écart global sur coûts",
      notions: ["cost_variance"],
      question: () =>
        "Calculez l'écart entre le réel et le budget standard, la part de cet écart qui ne vient que des quantités produites, puis l'écart global sur coûts. Chaque écart est le réel moins le prévu : négatif pour un écart favorable.",
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const e = b.e;
        return [
          { libelle: "Réel moins budget standard", attendu: b.reelMoinsBudget, calcul: `${eur(e.reelTotal)} − ${eur(e.budgetStandard.total)} = ${eur(b.reelMoinsBudget)}` },
          { libelle: "Effet des quantités produites", attendu: b.effetDeLaProduction, calcul: `${eur(e.preetabliDuReel.total)} − ${eur(e.budgetStandard.total)} = ${eur(b.effetDeLaProduction)}` },
          { libelle: "Écart global sur coûts", attendu: e.ecartGlobalSurCouts, calcul: `${eur(e.reelTotal)} − ${eur(e.preetabliDuReel.total)} = ${eur(e.ecartGlobalSurCouts)}` },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        const e = b.e;
        return [
          `${eur(b.reelMoinsBudget)} = ${eur(b.effetDeLaProduction)} + ${eur(e.ecartGlobalSurCouts)}. Les ${eur(b.effetDeLaProduction)} ne sont pas un dérapage : c'est ce que coûte, au standard, la production que l'usine a réellement faite. L'écart à expliquer est l'écart global sur coûts, ${ecartDit(e.ecartGlobalSurCouts)}.`,
          `Il se partage par poste : matière ${eur(e.matiere.global)}, main-d'œuvre directe ${eur(e.mainDOeuvre.global)}, centre de ${b.f.centre.nom.toLowerCase()} ${eur(e.centre.global)}. Les chapitres suivants les décomposent.`,
        ];
      },
    },
    LABORATOIRE_DE_LA_PRODUCTION,
    PREDIRE_L_ACTIVITE,
    ETAPE_DE_L_ACTIVITE,
    {
      id: "budget-flexible",
      type: "montants",
      titre: "Le budget flexible du centre",
      notions: ["fixed_costs", "variable_costs", "standard_costing"],
      tableau: tableauDuReel,
      question: () =>
        "Pour le centre de montage, calculez le budget flexible de l'activité réelle, puis le coût préétabli de l'activité réelle (les heures-machine réelles au coût standard), et enfin l'écart entre les deux, budget flexible moins coût préétabli de l'activité réelle (négatif pour un écart favorable).",
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        return [
          {
            libelle: "Budget flexible de l'activité réelle",
            attendu: b.e.centre.budgetFlexible,
            calcul: `${eur(f.centre.chargesFixes)} + ${eur(f.centre.coutVariableParHeure)} × ${qte(b.heuresMachine)} = ${eur(b.e.centre.budgetFlexible)}`,
          },
          { libelle: "Coût préétabli de l'activité réelle", attendu: b.preetabliDeLActiviteReelle, calcul: `${eur(b.cHm)} × ${qte(b.heuresMachine)} = ${eur(b.preetabliDeLActiviteReelle)}` },
          {
            libelle: "Budget flexible moins coût préétabli de l'activité réelle",
            attendu: b.ecartFlexibleMoinsPreetabli,
            calcul: `${eur(b.e.centre.budgetFlexible)} − ${eur(b.preetabliDeLActiviteReelle)} = ${eur(b.ecartFlexibleMoinsPreetabli)}`,
          },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const ecartDHeures = auCentime(b.heuresMachine - f.centre.activiteNormale);
        return [
          `À ${qte(b.heuresMachine)} heures-machine, le budget flexible compte les charges fixes pour ce qu'elles sont, ${eur(f.centre.chargesFixes)} ; le coût préétabli en impute ${eur(b.fixesParHeure)} par heure, soit ${eur(auCentime(b.fixesParHeure * b.heuresMachine))}. La différence, ${eur(b.ecartFlexibleMoinsPreetabli)}, vaut ${qte(Math.abs(ecartDHeures))} heures de ${ecartDHeures > 0 ? "plus" : "moins"} que l'activité normale × ${eur(b.fixesParHeure)} : c'est l'écart sur activité, que le chapitre sur les charges indirectes étudie.`,
        ];
      },
    },
    {
      id: "flexible-ou-preetabli",
      type: "choix",
      titre: "Budget flexible ou coût préétabli",
      notions: ["fixed_costs", "standard_costing"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `À ${qte(b.heuresMachine)} heures-machine, le budget flexible du centre vaut ${eur(b.e.centre.budgetFlexible)} et le coût préétabli de la même activité ${eur(b.preetabliDeLActiviteReelle)}. Quelle lecture est juste ?`;
      },
      options: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const fixesImputes = auCentime(b.fixesParHeure * b.heuresMachine);
        const fond = `Le budget flexible garde ${eur(f.centre.chargesFixes)} de charges fixes ; le coût préétabli en impute ${eur(fixesImputes)}, soit ${eur(Math.abs(auCentime(fixesImputes - f.centre.chargesFixes)))} de ${fixesImputes > f.centre.chargesFixes ? "plus, parce que le centre a tourné au-dessus" : "moins, parce que le centre a tourné en dessous"} de son activité normale.`;
        const hPre = b.e.preetabliDuReel.heuresMachine;
        return [
          {
            texte: "Les fixes ne bougent pas au budget flexible, mais le coût préétabli en impute à chaque heure",
            juste: true,
            retour: `Oui. ${fond} Cet écart sur activité mesure une absorption des charges fixes, pas une dépense évitée ou engagée.`,
          },
          {
            texte: `Le budget flexible devrait valoir ${eur(b.preetabliDeLActiviteReelle)} : à plus d'heures, plus de charges fixes`,
            juste: false,
            retour: `Non : c'est traiter les charges fixes comme variables. ${fond}`,
          },
          {
            texte: `L'écart de ${eur(Math.abs(b.ecartFlexibleMoinsPreetabli))} est une économie à porter au crédit du responsable du centre`,
            juste: false,
            retour: `Non : personne n'a dépensé moins. ${fond} Le responsable du centre se juge sur l'écart sur budget, réel moins budget flexible.`,
          },
          {
            texte: `Le budget flexible se calcule sur les ${qte(hPre)} heures préétablies de la production : ${eur(auCentime(f.centre.chargesFixes + f.centre.coutVariableParHeure * hPre))}`,
            juste: false,
            retour: `Non : le budget flexible se calcule sur l'activité réelle, les heures-machine réellement passées. Les heures préétablies de la production réelle servent à l'écart sur rendement. ${fond}`,
          },
        ];
      },
    },
    {
      id: "variante-activite",
      type: "montants",
      titre: "Variante : un centre sous son activité normale",
      notions: ["fixed_costs", "variable_costs"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `Variante : supposez que le centre n'ait tourné que ${qte(b.variante.heures)} heures-machine, avec les mêmes charges fixes et le même coût variable par heure. Calculez le budget flexible de cette activité, son coût préétabli, puis l'écart sur activité (budget flexible moins coût préétabli de l'activité réelle ; négatif pour un écart favorable).`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const v = b.variante;
        return [
          {
            libelle: `Budget flexible à ${qte(v.heures)} heures-machine`,
            attendu: v.budgetFlexible,
            calcul: `${eur(f.centre.chargesFixes)} + ${eur(f.centre.coutVariableParHeure)} × ${qte(v.heures)} = ${eur(v.budgetFlexible)}`,
          },
          { libelle: `Coût préétabli de ${qte(v.heures)} heures-machine`, attendu: v.preetabli, calcul: `${eur(b.cHm)} × ${qte(v.heures)} = ${eur(v.preetabli)}` },
          {
            libelle: "Écart sur activité de la variante",
            attendu: b.ecartDeLaVariante,
            calcul: `${eur(v.budgetFlexible)} − ${eur(v.preetabli)} = ${eur(b.ecartDeLaVariante)}, soit (${qte(f.centre.activiteNormale)} − ${qte(v.heures)}) × ${eur(b.fixesParHeure)}`,
          },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const v = b.variante;
        return [
          `Sous l'activité normale, le sens s'inverse : le budget flexible garde ${eur(f.centre.chargesFixes)} de charges fixes, mais le coût préétabli n'en impute que ${eur(auCentime(b.fixesParHeure * v.heures))} (coefficient d'imputation rationnelle ${qte(v.coefficient)}). Les ${eur(b.ecartDeLaVariante)} sont le coût de la sous-activité, un écart ${sens(b.ecartDeLaVariante)} : des charges fixes payées pour une capacité restée inemployée.`,
          `Dans le trimestre réel, à ${qte(b.heuresMachine)} heures-machine, le même calcul donne ${eur(b.ecartFlexibleMoinsPreetabli)} : un boni de suractivité. La recette est la même, le raisonnement doit suivre le sens.`,
        ];
      },
    },
    {
      id: "standard-courant",
      type: "montants",
      titre: "Variante : un standard courant",
      notions: ["standard_costing", "cost_variance"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `Variante : au lieu du standard normal de la fiche, le contrôle de gestion aurait retenu un standard courant, la matière que l'usine consomme d'ordinaire, gaspillage habituel compris : ${b.courant.parModele.map((x) => `${qte(x.kilos)} kg par ${x.nom}`).join(" et ")}, au même prix standard du kilo. Calculez les kilos préétablis de la production réelle, l'écart sur quantité de matière, puis l'écart global sur coûts de la production. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        const f = b.f;
        const r = f.realise;
        const co = b.courant;
        return [
          {
            libelle: "Kilos préétablis au standard courant",
            attendu: co.kilos,
            calcul: `${b.modeles.map((x, i) => `${qte(x.reelle)} × ${qte(co.parModele[i]!.kilos)}`).join(" + ")} = ${qte(co.kilos)} kg`,
          },
          { libelle: "Écart sur quantité au standard courant", attendu: co.quantite, calcul: `(${qte(r.matiere.kilos)} − ${qte(co.kilos)}) × ${eur(f.prixStandardDuKilo)} = ${eur(co.quantite)}` },
          {
            libelle: "Écart global sur coûts au standard courant",
            attendu: b.ecartGlobalCourant,
            calcul: `${eur(b.e.reelTotal)} − (${eur(b.e.preetabliDuReel.total)} + ${qte(auCentime(co.kilos - b.e.preetabliDuReel.kilos))} × ${eur(f.prixStandardDuKilo)}) = ${eur(b.e.reelTotal)} − ${eur(co.preetabliDuReel)} = ${eur(b.ecartGlobalCourant)}`,
          },
        ];
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        const r = b.f.realise;
        return [
          `Avec le standard normal, l'écart sur quantité valait ${eur(b.e.matiere.quantite)} ; avec le standard courant, ${eur(b.courant.quantite)}. L'usine a consommé les mêmes ${qte(r.matiere.kilos)} kilos : seul le standard a changé. Le gaspillage habituel, entré dans le standard, ne se voit plus.`,
          `L'écart global sur coûts passe de ${eur(b.e.ecartGlobalSurCouts)} à ${eur(b.ecartGlobalCourant)}. Un écart se lit toujours avec le standard qui l'a produit.`,
        ];
      },
    },
    {
      id: "quel-standard",
      type: "choix",
      titre: "Quel standard retenir ?",
      notions: ["standard_costing"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `Standard idéal (aucun gaspillage, aucune panne), standard normal (celui de la fiche, atteignable par une usine bien tenue), standard courant (l'habitude, gaspillage compris) : l'écart sur quantité de matière vaut ${eur(b.e.matiere.quantite)} au standard normal et ${eur(b.courant.quantite)} au standard courant. Lequel retenir pour piloter l'usine ?`;
      },
      options: (c) => {
        const b = budgetsDeLUsine(c);
        const rappel = `Au standard courant, l'écart sur quantité tombe à ${eur(b.courant.quantite)} sans qu'un seul kilo ait été économisé.`;
        return [
          {
            texte: "Le standard normal : atteignable, il laisse voir les gaspillages",
            juste: true,
            retour: `Oui. Il fixe ce qu'une usine bien tenue consomme : l'atelier peut l'atteindre, et chaque écart y signale un vrai problème. ${rappel} Le standard idéal, lui, produit des écarts défavorables permanents qui découragent et ne disent plus rien.`,
          },
          {
            texte: "Le standard courant : ses écarts sont plus faibles, l'usine paraît mieux tenue",
            juste: false,
            retour: `Non. ${rappel} Le standard courant installe les inefficacités dans la référence : l'écart mesure alors l'écart à l'habitude, pas à ce qu'il faudrait faire.`,
          },
          {
            texte: "Le standard idéal : le plus exigeant, c'est lui qui motive le plus les équipes",
            juste: false,
            retour: `Non : un standard que personne ne peut atteindre donne des écarts défavorables à chaque trimestre. Ils cessent d'alerter, et les équipes ne les regardent plus. ${rappel}`,
          },
        ];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le seuil de significativité",
      notions: ["cost_variance"],
      tableau: tableauDesPostes,
      question: (c) => {
        const b = budgetsDeLUsine(c);
        return `L'usine n'analyse un écart que s'il dépasse ${pct(b.seuilPct)} du coût préétabli de son poste : c'est la gestion par exception. Calculez, au dixième, la part de chaque écart global dans le coût préétabli de son poste.`;
      },
      champs: (c) => {
        const b = budgetsDeLUsine(c);
        return b.postes.map((p) => ({
          libelle: `Part de l'écart, ${p.nom.charAt(0).toLowerCase()}${p.nom.slice(1)} (%)`,
          attendu: p.part,
          calcul: `${eur(p.ecart)} ÷ ${eur(p.preetabli)} × 100 = ${pct(p.part)}`,
          tolerance: 0.1,
        }));
      },
      explication: (c) => {
        const b = budgetsDeLUsine(c);
        const dit = (p: (typeof b.postes)[number]) => `${p.nom.charAt(0).toLowerCase()}${p.nom.slice(1)} (${pct(p.part)})`;
        const au = b.postes.filter((p) => p.aAnalyser).map(dit);
        const sous = b.postes.filter((p) => !p.aAnalyser).map(dit);
        return [`Au-dessus du seuil de ${pct(b.seuilPct)} : ${au.join(" et ") || "aucun poste"}. En dessous : ${sous.join(" et ") || "aucun poste"}.`];
      },
    },
    {
      id: "gestion-par-exception",
      type: "choix",
      titre: "Ce que le seuil peut cacher",
      notions: ["cost_variance"],
      question: (c) => {
        const b = budgetsDeLUsine(c);
        const mod = b.postes.find((p) => p.code === "mainDOeuvre")!;
        return `Le seuil de ${pct(b.seuilPct)} écarte la main-d'œuvre directe : ${eur(mod.ecart)}, soit ${pct(mod.part)} de son coût préétabli. Faut-il la laisser de côté ?`;
      },
      options: (c) => {
        const b = budgetsDeLUsine(c);
        const e = b.e;
        const base = e.preetabliDuReel.mainDOeuvre;
        const partDuTaux = auDixieme((Math.abs(e.mainDOeuvre.taux) / base) * 100);
        // Le global passe sous le seuil, mais l'un de ses deux écarts le dépasse à lui seul.
        const cache = Math.abs(e.mainDOeuvre.taux) > SEUIL_DE_SIGNIFICATIVITE * base;
        const detail = `Décomposé (chapitre suivant), l'écart de ${eur(e.mainDOeuvre.global)} réunit un écart sur taux de ${ecartDit(e.mainDOeuvre.taux)}, ${pct(partDuTaux)} de ${eur(base)} à lui seul, et un écart sur temps de ${ecartDit(e.mainDOeuvre.temps)}.`;
        return [
          {
            texte: "Pas sur son seul écart global : deux écarts de sens contraire peuvent s'y compenser",
            juste: cache,
            retour: cache ? `Oui. ${detail} Le seuil s'applique aux écarts décomposés, pas seulement au global.` : `Non. ${detail}`,
          },
          {
            texte: "Oui : sous le seuil, un écart ne coûte rien à l'usine, inutile d'y revenir",
            juste: !cache,
            retour: cache ? `Non : ${eur(e.mainDOeuvre.global)} restent dépensés, et le global peut masquer bien plus. ${detail}` : `Oui. ${detail}`,
          },
          {
            texte: "Non : tout écart défavorable s'analyse, quel que soit son montant",
            juste: false,
            retour: `Non : analyser chaque écart, même minime, noie le contrôle de gestion et les responsables sous les explications. La gestion par exception concentre l'effort là où il pèse. ${detail}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["standard_costing", "cost_variance", "fixed_costs"],
      texte: (c) => {
        const b = budgetsDeLUsine(c);
        const e = b.e;
        return [
          `À l'usine de ${b.f.entreprise}, le réel, ${eur(e.reelTotal)}, dépasse le budget standard de ${eur(b.reelMoinsBudget)}. Mais ${eur(b.effetDeLaProduction)} ne sont que le coût préétabli de la production réellement faite : l'écart à expliquer est l'écart global sur coûts, ${ecartDit(e.ecartGlobalSurCouts)}, face au coût préétabli de la production réelle (${eur(e.preetabliDuReel.total)}).`,
          `Au centre, le budget flexible garde les charges fixes constantes (${eur(e.centre.budgetFlexible)} à ${qte(b.heuresMachine)} heures-machine) quand le coût préétabli les impute à chaque heure (${eur(b.preetabliDeLActiviteReelle)}) : leur différence est l'écart sur activité, favorable au-dessus de l'activité normale, défavorable en dessous.`,
          "Au niveau de l'examen, vous savez établir une fiche de coût préétabli et le coût standard d'une unité d'œuvre, choisir la bonne référence, construire un budget flexible à n'importe quelle activité, dire ce que le choix du standard fait aux écarts, et trier les écarts par un seuil de significativité sans vous laisser tromper par un global qui compense.",
          "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Écart global sur coûts = coût réel − coût préétabli de la production réelle. Réel − budget standard = effet des quantités produites + écart global. Budget flexible − coût préétabli de l'activité réelle = écart sur activité = charges fixes × (1 − activité réelle ÷ activité normale).",
    },
  ],
};
