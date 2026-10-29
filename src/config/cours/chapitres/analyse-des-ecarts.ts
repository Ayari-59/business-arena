import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { controleBudgetaire, coutPreetabli, coutStandardDeLHeureMachine } from "../monde/ecarts";
import { USINES_DU_COURS, type FicheDeLUsine } from "../monde/nova-usine";
import type { Chapitre, TableauDeDonnees } from "../types";
import { etapesAvant, etapesDepuis, partieDuChapitre } from "./decoupage";

/**
 * CHAPITRE : L'ANALYSE DES ÉCARTS, DU RÉSULTAT PRÉVU AU RÉSULTAT RÉEL (contrôle de gestion,
 * palier 4). LA SYNTHÈSE DE LA SÉQUENCE DES ÉCARTS.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'usine de
 * NOVA a une fiche figée (monde/nova-usine.ts : la Nomade et la Salon, leurs standards, le centre
 * de montage, le budget et le réel d'un trimestre), et tout chiffre vient du modèle du contrôle
 * budgétaire (monde/ecarts.ts, `controleBudgetaire`). Une évolution du moteur ne change rien ici.
 *
 * Il vient après les quatre chapitres qui calculent chaque écart (le coût préétabli et les
 * budgets ; les écarts sur charges directes ; sur charges indirectes ; sur chiffre d'affaires et
 * marge). Il ne les refait pas : il les rassemble. Le résultat prévu (chiffre d'affaires prévu −
 * budget standard − distribution prévue) et le résultat réel ; l'écart de résultat ; le tableau
 * de passage (`passage` du modèle), dont la somme retombe exactement sur l'écart ; le partage
 * entre ventes, production et distribution ; les écarts qui se compensent ; ce qu'un écart
 * favorable peut cacher ; la part de chaque responsable, et les limites de la méthode.
 *
 * Les seuls calculs propres au chapitre (dans `syntheseDesEcarts`, chacun documenté) : le
 * regroupement des écarts par responsable (`RESPONSABLE_DE_L_ECART`, hypothèse du cours), la part
 * du dépassement du budget standard qui vient de ce qui a été vendu, et la double lecture d'une
 * heure-machine perdue (au coût complet dans l'écart sur rendement, pour sa part fixe en boni dans
 * l'écart sur activité).
 *
 * CONVENTION, dite à l'élève : un écart est le réel moins le prévu. Sur une charge, positif est
 * défavorable ; sur un produit ou une marge, positif est favorable. Au tableau de passage, chaque
 * écart est pris avec son effet sur le résultat : positif favorable.
 *
 * LES TROIS TEMPS (demande du propriétaire : le niveau d'arrivée est celui de l'épreuve du DCG) :
 *   · guidé : `intro`, `les-deux-resultats`, `le-bon-repere`, `le-budget-de-depart` (la formule est
 *     dans le repère de l'intro ou dans la question, qui nomme les chiffres à prendre) ;
 *   · l'expérience, avant les calculs qu'elle éclaire (prédire, manipuler, constater, puis
 *     formaliser) : `le-pari` (un pari sur le prix de la Nomade), puis trois curseurs, un levier
 *     chacun, tout le reste du trimestre réel tel quel (`leviersDuResultat`) : `le-levier-du-prix`
 *     et `le-levier-des-kilos` avant le passage, `le-levier-des-heures` avant le centre. Aucun levier
 *     ne rattrape seul le résultat prévu sans sortir de ce qu'une usine peut faire ; puis, en expert,
 *     `le-laboratoire` (quatre leviers à la fois, les lignes du passage en barres, un défi) ;
 *   · autonome : `la-part-des-ventes`, `volume-au-prix`, `le-signe`, `se-compensent` (l'élève
 *     choisit lui-même les chiffres dans les documents ; la correction montre le chemin) ;
 *   · expert : `le-tableau-de-passage` (le tableau complet à dresser), `a-rebours` (le coût réel
 *     du centre retrouvé à partir du passage), `l-heure-de-trop` (l'interdépendance du rendement
 *     et de l'activité), `qui-doit-agir` et `la-part-de-chacun` (l'imputation aux responsables),
 *     `la-prime` (maîtrisable ou non, l'effet pervers d'une prime sur un seul écart),
 *     `le-tableau-de-bord` (les limites du contrôle budgétaire) ; puis la synthèse, `fin`.
 */

/** Qui doit expliquer un écart, et agir. */
export type Responsable = "commercial" | "achats" | "atelier" | "rh" | "centre" | "direction" | "distribution";

/** Le nom de chaque responsable, dit à l'élève. */
export const NOM_DU_RESPONSABLE: Readonly<Record<Responsable, string>> = {
  commercial: "Le commercial",
  achats: "Les achats",
  atelier: "L'atelier",
  rh: "Les ressources humaines",
  centre: "Le responsable du centre",
  direction: "La direction",
  distribution: "La distribution",
};

/** « du commercial », « de l'atelier » : le complément de « la part ». */
const PART_DU_RESPONSABLE: Readonly<Record<Responsable, string>> = {
  commercial: "du commercial",
  achats: "des achats",
  atelier: "de l'atelier",
  rh: "des ressources humaines",
  centre: "du responsable du centre",
  direction: "de la direction",
  distribution: "de la distribution",
};

/**
 * À QUI L'ON IMPUTE CHAQUE LIGNE DU TABLEAU DE PASSAGE (hypothèse du cours, celle des manuels) :
 * le prix de vente et le volume au commercial ; le prix de la matière aux achats ; la quantité de
 * matière, le temps et le rendement à l'atelier ; le taux horaire aux ressources humaines (heures
 * supplémentaires, salaires) ; le budget du centre à son responsable ; l'activité à la direction,
 * qui décide du volume ; la distribution à son service. Le modèle ne connaît pas les causes,
 * seulement les écarts : l'imputation dit qui doit expliquer, pas qui est fautif.
 */
export const RESPONSABLE_DE_L_ECART: Readonly<Record<string, Responsable>> = {
  "Ventes : écart sur prix": "commercial",
  "Ventes : écart sur quantité globale": "commercial",
  "Ventes : écart sur composition": "commercial",
  "Matière : écart sur prix": "achats",
  "Matière : écart sur quantité": "atelier",
  "Main-d'œuvre directe : écart sur taux": "rh",
  "Main-d'œuvre directe : écart sur temps": "atelier",
  "Centre de montage : écart sur budget": "centre",
  "Centre de montage : écart sur activité": "direction",
  "Centre de montage : écart sur rendement": "atelier",
  Distribution: "distribution",
};

/** Les responsables de l'usine et des ventes, dans l'ordre où le chapitre les range. */
const RESPONSABLES_DU_TRI = ["commercial", "achats", "atelier", "rh", "centre", "direction"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un effet sur le résultat, avec son signe : « +4 800 € », « −7 400 € ». */
const signe = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
/** Un montant ajouté ou retranché, entre parenthèses s'il est négatif. */
const entreParentheses = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const estUneVente = (poste: string) => poste.startsWith("Ventes");

/** Le calcul d'un regroupement d'effets : « −12 800 € + (−12 500 €) + 11 900 € = −13 400 € ». */
const additionne = (effets: readonly number[], total: number) =>
  `${effets.map((x, i) => (i === 0 ? eur(x) : entreParentheses(x))).join(" + ")} = ${eur(total)}`;

/** La fiche de l'usine du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLUsine => USINES_DU_COURS[c.code]!;

/** Tout ce que la synthèse rassemble, calculé une fois sur la fiche. */
export function syntheseDesEcarts(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = controleBudgetaire(f);
  const [nomade, salon] = f.modeles;
  const lignes = e.passage.map((l) => ({ ...l, responsable: RESPONSABLE_DE_L_ECART[l.poste]! }));
  /** L'écart tel que les chapitres précédents l'ont calculé, réel − prévu : l'effet, au signe près pour une charge. */
  const brut = (l: { poste: string; effet: number }) => (estUneVente(l.poste) ? l.effet : auCentime(-l.effet));
  const somme = (ls: readonly { effet: number }[]) => auCentime(ls.reduce((t, l) => t + l.effet, 0));
  const ventes = somme(lignes.filter((l) => estUneVente(l.poste)));
  const distribution = somme(lignes.filter((l) => l.responsable === "distribution"));
  const production = somme(lignes.filter((l) => !estUneVente(l.poste) && l.responsable !== "distribution"));
  const parResponsable = Object.fromEntries(
    (Object.keys(NOM_DU_RESPONSABLE) as Responsable[]).map((r) => [r, somme(lignes.filter((l) => l.responsable === r))]),
  ) as Record<Responsable, number>;
  /** Les responsables, du plus lourd effet défavorable au plus favorable. */
  const ordre = (Object.keys(parResponsable) as Responsable[]).sort((a, b) => parResponsable[a] - parResponsable[b]);
  const partFixe = auCentime(f.centre.chargesFixes / f.centre.activiteNormale);
  const heuresReelles = f.realise.centre.heuresMachine;
  const heuresPerdues = auCentime(heuresReelles - e.preetabliDuReel.heuresMachine);
  const boniDesHeuresPerdues = auCentime(heuresPerdues * partFixe);
  return {
    f,
    e,
    nomade: nomade!,
    salon: salon!,
    cNomade: coutPreetabli(f, nomade!),
    cSalon: coutPreetabli(f, salon!),
    cHm: coutStandardDeLHeureMachine(f),
    lignes,
    brut,
    ventes,
    production,
    distribution,
    /** Les onze écarts additionnés tels qu'ils ont été calculés, sans changer le signe des charges : l'erreur classique. */
    sommeSansSigne: auCentime(lignes.reduce((t, l) => t + brut(l), 0)),
    /** L'erreur inverse : le signe de tous les écarts changé, ventes comprises. */
    sommeTousInverses: auCentime(-lignes.reduce((t, l) => t + brut(l), 0)),
    /** Le coût réel face au budget standard de départ : la mauvaise base. */
    depassementDuBudget: auCentime(e.reelTotal - e.budgetStandard.total),
    /** La part de ce dépassement qui vient de ce qui a été vendu : préétabli de la production réelle − budget standard. */
    partDuVolume: auCentime(e.preetabliDuReel.total - e.budgetStandard.total),
    parResponsable,
    ordre,
    /** La part fixe d'une heure-machine : charges fixes ÷ activité normale. */
    partFixe,
    heuresReelles,
    /** Les heures-machine travaillées au-delà de l'activité normale : celles de l'écart sur activité. */
    auDessusDeLaNormale: auCentime(heuresReelles - f.centre.activiteNormale),
    /** Les heures-machine au-delà du préétabli de la production réelle : celles de l'écart sur rendement. */
    heuresPerdues,
    /** La part du boni de suractivité que ces heures perdues ont faite : heures perdues × part fixe. */
    boniDesHeuresPerdues,
    /** Ce que ces heures coûtent vraiment au résultat : l'effet du rendement plus leur boni, soit leur seul coût variable. */
    coutNetDesHeuresPerdues: auCentime(-e.centre.rendement + boniDesHeuresPerdues),
    leviers: leviersDuResultat(f, e),
  };
}

/**
 * LES TROIS LEVIERS DE L'EXPÉRIENCE (les curseurs du chapitre). Hypothèse du cours : un seul
 * chiffre réel bouge, tout le reste du trimestre réel reste tel quel.
 *   · le prix de la Nomade : le chiffre d'affaires change de (prix − prix réel) × quantité réelle ;
 *     les quantités vendues ne réagissent pas au prix dans cette expérience ;
 *   · les kilos de matière consommés : ils se paient au prix réel du kilo ;
 *   · les heures-machine du centre : le coût réel du centre suit son budget flexible (son seul coût
 *     variable par heure-machine), l'écart sur budget restant le même.
 * Pour chaque levier : le résultat qu'il donne, la position qui rattrape tout juste le résultat
 * prévu, et ce qu'il rend ramené à son standard (le prix prévu, les kilos et les heures-machine
 * préétablis de la production réelle).
 */
function leviersDuResultat(f: FicheDeLUsine, e: ReturnType<typeof controleBudgetaire>) {
  const r = f.realise;
  const [nomade] = f.modeles;
  const manque = auCentime(e.resultatPrevu - e.resultatReel);
  const qN = r.ventes.nomade.quantite;
  const pN = r.ventes.nomade.prix;
  const auPrix = (p: number) => auCentime(e.resultatReel + (p - pN) * qN);
  const auxKilos = (k: number) => auCentime(e.resultatReel + (r.matiere.kilos - k) * r.matiere.prixDuKilo);
  const auxHeures = (h: number) => auCentime(e.resultatReel + (r.centre.heuresMachine - h) * f.centre.coutVariableParHeure);
  // Les positions entières qui rattrapent tout juste le résultat prévu : le plus petit prix, les plus grands kilos et heures.
  const prixQuiSuffit = Math.ceil(pN + manque / qN - 1e-9);
  const kilosQuiSuffisent = Math.floor(r.matiere.kilos - manque / r.matiere.prixDuKilo + 1e-9);
  const heuresQuiSuffisent = Math.floor(r.centre.heuresMachine - manque / f.centre.coutVariableParHeure + 1e-9);
  const auStandard = {
    prix: auCentime(auPrix(nomade!.prixPrevu) - e.resultatReel),
    kilos: auCentime(auxKilos(e.preetabliDuReel.kilos) - e.resultatReel),
    heures: auCentime(auxHeures(e.preetabliDuReel.heuresMachine) - e.resultatReel),
  };
  const ensemble = auCentime(auStandard.prix + auStandard.kilos + auStandard.heures);
  return {
    manque,
    auPrix,
    auxKilos,
    auxHeures,
    prixQuiSuffit,
    kilosQuiSuffisent,
    heuresQuiSuffisent,
    auStandard,
    /** Les trois leviers ramenés ensemble à leur standard, et ce qui manquerait encore. */
    ensemble,
    resteAuStandard: auCentime(manque - ensemble),
    bornes: {
      prix: { min: Math.floor(pN) - 3, max: prixQuiSuffit + 4 },
      kilos: { min: Math.floor(kilosQuiSuffisent / 1_000) * 1_000, max: Math.ceil(r.matiere.kilos / 1_000) * 1_000 },
      heures: { min: Math.floor(heuresQuiSuffisent / 1_000) * 1_000, max: Math.ceil(r.centre.heuresMachine / 500) * 500 },
    },
  };
}

export type SyntheseDesEcarts = ReturnType<typeof syntheseDesEcarts>;

/**
 * LE LABORATOIRE DU CHAPITRE : quatre grandes causes en leviers, le prix de la Nomade, les kilos
 * consommés, le taux horaire de la main-d'œuvre directe et les heures-machine du centre. Mêmes
 * hypothèses que les curseurs (`leviersDuResultat`) : seul ce que les leviers touchent bouge, les
 * quantités vendues ne réagissent pas au prix, et le coût réel du centre suit son budget flexible,
 * son écart sur budget restant le même. Le défi : retrouver le résultat prévu sans vendre la
 * Nomade au-dessus de son prix prévu.
 */
export const LEVIERS_DU_LABORATOIRE = ["prixNomade", "kilos", "taux", "heures"] as const;
export type PositionDuLaboratoire = Readonly<Record<string, number>>;

/** Le départ du laboratoire : le trimestre réel. */
export function departDuLaboratoire(f: FicheDeLUsine): Record<(typeof LEVIERS_DU_LABORATOIRE)[number], number> {
  const r = f.realise;
  return { prixNomade: r.ventes.nomade.prix, kilos: r.matiere.kilos, taux: r.mainDOeuvre.tauxHoraire, heures: r.centre.heuresMachine };
}

/** Le tableau de passage à une position des leviers : chaque ligne avec son effet sur le résultat. */
export function passageALaPosition(c: Pick<Cas, "code">, position: PositionDuLaboratoire) {
  const s = syntheseDesEcarts(c);
  const f = s.f;
  const r = f.realise;
  const e = s.e;
  const x = { ...departDuLaboratoire(f), ...position };
  const coutDuCentre = auCentime(r.centre.cout + (x.heures - r.centre.heuresMachine) * f.centre.coutVariableParHeure);
  const flexible = auCentime(f.centre.chargesFixes + f.centre.coutVariableParHeure * x.heures);
  const effet: Record<string, number> = {
    "Ventes : écart sur prix": auCentime((x.prixNomade - s.nomade.prixPrevu) * r.ventes.nomade.quantite + (r.ventes.salon.prix - s.salon.prixPrevu) * r.ventes.salon.quantite),
    "Ventes : écart sur quantité globale": e.ventes.quantiteGlobale,
    "Ventes : écart sur composition": e.ventes.composition,
    "Matière : écart sur prix": auCentime(-(r.matiere.prixDuKilo - f.prixStandardDuKilo) * x.kilos),
    "Matière : écart sur quantité": auCentime(-(x.kilos - e.preetabliDuReel.kilos) * f.prixStandardDuKilo),
    "Main-d'œuvre directe : écart sur taux": auCentime(-(x.taux - f.tauxHoraireStandard) * r.mainDOeuvre.heures),
    "Main-d'œuvre directe : écart sur temps": auCentime(-e.mainDOeuvre.temps),
    "Centre de montage : écart sur budget": auCentime(-(coutDuCentre - flexible)),
    "Centre de montage : écart sur activité": auCentime(-(flexible - s.cHm * x.heures)),
    "Centre de montage : écart sur rendement": auCentime(-(x.heures - e.preetabliDuReel.heuresMachine) * s.cHm),
    Distribution: auCentime(-e.distribution),
  };
  const lignes = s.lignes.map((l) => ({ poste: l.poste, effet: effet[l.poste]! + 0 }));
  const ecart = auCentime(lignes.reduce((t, l) => t + l.effet, 0));
  return { lignes, ecart, resultat: auCentime(e.resultatPrevu + ecart), position: x };
}

/** Le défi : le résultat prévu, sans vendre la Nomade au-dessus de son prix prévu. */
export function defiAtteint(c: Pick<Cas, "code">, position: PositionDuLaboratoire) {
  const s = syntheseDesEcarts(c);
  const p = passageALaPosition(c, position);
  return p.position.prixNomade <= s.nomade.prixPrevu && p.resultat >= s.e.resultatPrevu;
}

/**
 * Une solution du défi : tous les leviers ramenés à leur standard (la Nomade à son prix prévu, le
 * taux standard, les heures-machine préétablies), et les kilos baissés par pas de 100 kg sous le
 * préétabli jusqu'à rattraper ce qui manque encore. Ramenés à leur standard, les leviers ne
 * suffisent pas : il faut battre un standard, parce que d'autres écarts restent hors des leviers.
 */
export function solutionDuLaboratoire(c: Pick<Cas, "code">) {
  const s = syntheseDesEcarts(c);
  const auStandard = { prixNomade: s.nomade.prixPrevu, kilos: s.e.preetabliDuReel.kilos, taux: s.f.tauxHoraireStandard, heures: s.e.preetabliDuReel.heuresMachine };
  let kilos = auStandard.kilos;
  while (!defiAtteint(c, { ...auStandard, kilos }) && kilos > 0) kilos -= 100;
  return { auStandard, resultatAuStandard: passageALaPosition(c, auStandard).resultat, solution: { ...auStandard, kilos } };
}

/** Le budget et le réel du trimestre, tels que le contrôleur les reçoit. */
export function tableauDuTrimestre(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = syntheseDesEcarts(c);
  const r = s.f.realise;
  return {
    titre: `Le trimestre de l'usine ${s.f.entreprise}, budget et réel`,
    colonnes: ["Budget", "Réel"],
    lignes: [
      { libelle: `Enceintes ${s.nomade.nom} vendues`, valeurs: [qte(s.nomade.quantitePrevue), qte(r.ventes.nomade.quantite)] },
      { libelle: `Prix de vente de la ${s.nomade.nom}`, valeurs: [eur(s.nomade.prixPrevu), eur(r.ventes.nomade.prix)] },
      { libelle: `Enceintes ${s.salon.nom} vendues`, valeurs: [qte(s.salon.quantitePrevue), qte(r.ventes.salon.quantite)] },
      { libelle: `Prix de vente de la ${s.salon.nom}`, valeurs: [eur(s.salon.prixPrevu), eur(r.ventes.salon.prix)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(s.e.ventes.chiffreDAffairesPrevu), eur(s.e.ventes.chiffreDAffairesReel)] },
      { libelle: "Coût de production (budget standard, puis réel)", valeurs: [eur(s.e.budgetStandard.total), eur(s.e.reelTotal)] },
      { libelle: "Charges de distribution", valeurs: [eur(s.f.distributionPrevue), eur(r.distribution)] },
    ],
  };
}

/** La fiche de coût préétabli des deux enceintes. */
export function tableauDuCoutPreetabli(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = syntheseDesEcarts(c);
  const col = (g: (x: SyntheseDesEcarts["cNomade"]) => number) => [eur(g(s.cNomade)), eur(g(s.cSalon))];
  return {
    titre: "La fiche de coût préétabli d'une enceinte",
    colonnes: [s.nomade.nom, s.salon.nom],
    lignes: [
      { libelle: "Matière", valeurs: col((x) => x.matiere) },
      { libelle: "Main-d'œuvre directe", valeurs: col((x) => x.mainDOeuvre) },
      { libelle: "Centre de montage", valeurs: col((x) => x.centre) },
      { libelle: "Coût préétabli", valeurs: col((x) => x.total) },
      { libelle: "Prix de vente prévu", valeurs: [eur(s.nomade.prixPrevu), eur(s.salon.prixPrevu)] },
      { libelle: "Marge préétablie", valeurs: col((x) => x.marge) },
    ],
  };
}

/** Les ventes de chaque modèle : quantités, prix, marge préétablie. */
export function tableauDesVentes(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = syntheseDesEcarts(c);
  const r = s.f.realise;
  const ligne = (m: SyntheseDesEcarts["nomade"], cp: SyntheseDesEcarts["cNomade"]) => ({
    libelle: m.nom,
    valeurs: [qte(m.quantitePrevue), qte(r.ventes[m.code].quantite), eur(m.prixPrevu), eur(r.ventes[m.code].prix), eur(cp.marge)],
  });
  return {
    titre: "Les ventes du trimestre, modèle par modèle",
    colonnes: ["Quantité prévue", "Quantité réelle", "Prix prévu", "Prix réel", "Marge préétablie"],
    lignes: [ligne(s.nomade, s.cNomade), ligne(s.salon, s.cSalon)],
  };
}

/** Les onze écarts du trimestre, tels que les chapitres précédents les ont calculés (réel − prévu). */
export function tableauDesEcarts(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = syntheseDesEcarts(c);
  return {
    titre: "Les écarts du trimestre, tels que les chapitres précédents les ont calculés",
    colonnes: ["Nature", "Écart (réel − prévu)"],
    lignes: s.lignes.map((l) => ({ libelle: l.poste, valeurs: [estUneVente(l.poste) ? "Marge" : "Charge", eur(s.brut(l))] })),
  };
}

/** Ce que le contrôleur sait du centre de montage. */
function tableauDuCentre(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = syntheseDesEcarts(c);
  return {
    titre: "Le centre de montage, sa fiche",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Activité normale du trimestre (heures-machine)", valeurs: [qte(s.f.centre.activiteNormale)] },
      { libelle: "Coût variable d'une heure-machine", valeurs: [eur(s.f.centre.coutVariableParHeure)] },
      { libelle: "Charges fixes du trimestre", valeurs: [eur(s.f.centre.chargesFixes)] },
      { libelle: "Coût standard d'une heure-machine", valeurs: [eur(s.cHm)] },
      { libelle: `Heures-machine d'une ${s.nomade.nom}`, valeurs: [qte(s.nomade.heuresMachineParUnite)] },
      { libelle: `Heures-machine d'une ${s.salon.nom}`, valeurs: [qte(s.salon.heuresMachineParUnite)] },
    ],
  };
}

/** Le chapitre tel qu'il était écrit, en un seul tenant : ses deux parties en sont tirées (plus bas). */
const ANALYSE_DES_ECARTS_ENTIERE: Chapitre = {
  code: "analyse-des-ecarts",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "L'analyse des écarts : du résultat prévu au résultat réel",
  accroche:
    "Le résultat de l'usine manque son budget. Rassembler tous les écarts du trimestre dans le tableau de passage, retomber au centime sur l'écart de résultat, et dire à chaque responsable ce qui lui revient.",
  objectifs: [
    "Calculer le résultat prévu, le résultat réel et l'écart de résultat",
    "Dresser le tableau de passage du résultat prévu au résultat réel, chaque écart avec son signe",
    "Partager l'écart entre ventes, production et distribution, sans compter le volume deux fois",
    "Repérer les écarts qui se compensent et ce qu'un écart favorable peut cacher",
    "Imputer chaque écart à son responsable, distinguer ce qu'il maîtrise, et dire les limites de la méthode",
  ],
  libre: false,
  prerequis: ["les-ecarts-sur-charges-directes", "les-ecarts-sur-charges-indirectes", "les-ecarts-sur-ventes-et-marge"],
  entreprises: {
    codes: ["nova"],
    pourquoi:
      "ce chapitre rassemble le contrôle budgétaire d'une usine, ses coûts préétablis et son centre de montage : il se joue à l'usine de NOVA, qui fabrique la Nomade et la Salon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Du résultat prévu au résultat réel",
      notions: ["standard_costing", "cost_variance"],
      tableau: tableauDuTrimestre,
      texte: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `Ce chapitre se joue dans la simulation du cours : l'usine de ${s.f.entreprise}, un trimestre, la ${s.nomade.nom} et la ${s.salon.nom}. Toute la production du trimestre est vendue : pas de stock, le coût des ventes est celui de la production. Un seul centre d'analyse, le montage, dont l'unité d'œuvre est l'heure-machine. La distribution est hors production.`,
          "Les chapitres précédents ont calculé chaque écart : sur la matière, la main-d'œuvre directe, le centre de montage, le chiffre d'affaires et la marge. Celui-ci ne les refait pas. Il les rassemble pour répondre à la question que pose la direction : pourquoi le résultat n'est-il pas celui du budget, et qui doit agir ?",
          "Un écart est toujours le réel moins le prévu. Sur une charge, positif, il est défavorable ; sur un produit, une marge ou un résultat, positif, il est favorable.",
        ];
      },
      repere: () =>
        "Résultat prévu = chiffre d'affaires prévu − budget standard (la production prévue au coût préétabli) − distribution prévue. Résultat réel = chiffre d'affaires réel − coût réel de production − distribution réelle. Écart de résultat = résultat réel − résultat prévu.",
    },
    {
      id: "les-deux-resultats",
      objectifs: [0],
      type: "montants",
      titre: "Les deux résultats",
      notions: ["income_statement", "cost_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `À partir du tableau, calculez le résultat prévu (${eur(s.e.ventes.chiffreDAffairesPrevu)} − ${eur(s.e.budgetStandard.total)} − ${eur(s.f.distributionPrevue)}), le résultat réel, puis l'écart de résultat, réel moins prévu. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          {
            libelle: "Résultat prévu",
            attendu: s.e.resultatPrevu,
            calcul: `${eur(s.e.ventes.chiffreDAffairesPrevu)} − ${eur(s.e.budgetStandard.total)} − ${eur(s.f.distributionPrevue)} = ${eur(s.e.resultatPrevu)}`,
          },
          {
            libelle: "Résultat réel",
            attendu: s.e.resultatReel,
            calcul: `${eur(s.e.ventes.chiffreDAffairesReel)} − ${eur(s.e.reelTotal)} − ${eur(s.f.realise.distribution)} = ${eur(s.e.resultatReel)}`,
          },
          {
            libelle: "Écart de résultat",
            attendu: s.e.ecartDeResultat,
            calcul: `${eur(s.e.resultatReel)} − ${eur(s.e.resultatPrevu)} = ${eur(s.e.ecartDeResultat)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        return [`Il manque ${eur(-s.e.ecartDeResultat)} au résultat. Tout le chapitre consiste à expliquer ce chiffre, au centime, et à dire d'où il vient.`];
      },
    },
    {
      id: "le-pari",
      objectifs: [3],
      type: "choix",
      titre: "Un pari sur le prix de la Nomade",
      notions: ["volume_price_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Avant tout calcul, un pari. Si ${s.f.entreprise} avait vendu la ${s.nomade.nom} à son prix prévu, ${eur(s.nomade.prixPrevu)}, au lieu de ${eur(s.f.realise.ventes.nomade.prix)}, le résultat aurait-il rattrapé le budget ?`;
      },
      options: (c) => {
        const s = syntheseDesEcarts(c);
        const essai = `Vérifiez votre pari à l'étape suivante : déplacez le prix de la ${s.nomade.nom}, et regardez le résultat de l'usine.`;
        return [
          { texte: `Oui : le prix cédé sur la ${s.nomade.nom} explique tout l'écart`, juste: false, retour: essai },
          { texte: "Non : il manquerait encore une bonne part de l'écart", juste: true, retour: essai },
          { texte: "Oui, et il dépasserait même le budget", juste: false, retour: essai },
        ];
      },
    },
    {
      id: "le-levier-du-prix",
      objectifs: [2],
      type: "curseur",
      titre: "Le levier du prix",
      notions: ["volume_price_variance", "income_statement"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Faites tourner l'usine : déplacez le prix de vente de la ${s.nomade.nom}, tout le reste du trimestre réel restant tel quel (les ${qte(s.f.realise.ventes.nomade.quantite)} ${s.nomade.nom} vendues comprises). Placez le curseur sur le plus petit prix, à l'euro, qui rattrape le résultat prévu.`;
      },
      grandeur: (c) => ({ libelle: `Prix de vente de la ${ficheDe(c).modeles[0]!.nom}`, unite: "€" }),
      cible: (c) => {
        const l = syntheseDesEcarts(c).leviers;
        return { attendu: l.prixQuiSuffit, ...l.bornes.prix };
      },
      lecture: (c, p) => {
        const s = syntheseDesEcarts(c);
        const r = s.f.realise;
        const resultat = s.leviers.auPrix(p);
        return [
          { libelle: "Écart sur prix de vente", montant: auCentime((p - s.nomade.prixPrevu) * r.ventes.nomade.quantite + (r.ventes.salon.prix - s.salon.prixPrevu) * r.ventes.salon.quantite) },
          { libelle: "Résultat de l'usine", montant: resultat },
          { libelle: "Résultat prévu", montant: s.e.resultatPrevu },
          { libelle: "Écart de résultat", montant: auCentime(resultat - s.e.resultatPrevu), fort: true },
        ];
      },
      droites: (c) => {
        const s = syntheseDesEcarts(c);
        return { produit: (p) => s.leviers.auPrix(p), cout: () => s.e.resultatPrevu, libelles: ["Résultat de l'usine", "Résultat prévu"] };
      },
      zones: ["Le budget est rattrapé", "Le résultat reste sous le budget"],
      rates: () => ({
        dessous: "À ce prix, le résultat de l'usine reste sous le budget : montez encore.",
        dessus: "Un euro plus bas, le budget est déjà rattrapé : cherchez le plus petit prix qui suffit.",
      }),
      montrer: "Montrer le prix qui suffit",
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const l = s.leviers;
        return [
          `Au prix prévu, ${eur(s.nomade.prixPrevu)}, le résultat de l'usine serait de ${eur(l.auPrix(s.nomade.prixPrevu))} : il manquerait encore ${eur(auCentime(l.manque - l.auStandard.prix))}. Pour rattraper le budget par ce seul levier, il faudrait vendre la ${s.nomade.nom} ${eur(l.prixQuiSuffit)}, ${eur(auCentime(l.prixQuiSuffit - s.nomade.prixPrevu))} au-dessus de son prix prévu.`,
          `Le prix cédé coûte cher, mais il n'explique pas tout l'écart : chaque euro sur la ${s.nomade.nom} vaut ${eur(s.f.realise.ventes.nomade.quantite)} de résultat, et l'écart en fait ${eur(l.manque)}. Le reste est ailleurs.`,
        ];
      },
    },
    {
      id: "le-levier-des-kilos",
      objectifs: [2],
      type: "curseur",
      titre: "Le levier de la matière",
      notions: ["material_price_variance", "efficiency_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Remettez la ${s.nomade.nom} à son prix réel, et faites varier cette fois les kilos de matière consommés, payés ${eur(s.f.realise.matiere.prixDuKilo)} le kilo. Placez le curseur sur le plus grand nombre de kilos qui rattrape encore le résultat prévu.`;
      },
      grandeur: () => ({ libelle: "Kilos de matière consommés", unite: "kg" }),
      sens: "plus-grande",
      cible: (c) => {
        const l = syntheseDesEcarts(c).leviers;
        return { attendu: l.kilosQuiSuffisent, ...l.bornes.kilos };
      },
      lecture: (c, k) => {
        const s = syntheseDesEcarts(c);
        const resultat = s.leviers.auxKilos(k);
        return [
          { libelle: "Écart sur prix de la matière", montant: auCentime((s.f.realise.matiere.prixDuKilo - s.f.prixStandardDuKilo) * k) },
          { libelle: "Écart sur quantité de matière", montant: auCentime((k - s.e.preetabliDuReel.kilos) * s.f.prixStandardDuKilo) },
          { libelle: "Résultat de l'usine", montant: resultat },
          { libelle: "Écart de résultat", montant: auCentime(resultat - s.e.resultatPrevu), fort: true },
        ];
      },
      droites: (c) => {
        const s = syntheseDesEcarts(c);
        return { produit: (k) => s.leviers.auxKilos(k), cout: () => s.e.resultatPrevu, libelles: ["Résultat de l'usine", "Résultat prévu"] };
      },
      zones: ["Le budget est rattrapé", "Le résultat reste sous le budget"],
      rates: () => ({
        dessous: "Avec moins de matière encore, le budget serait toujours rattrapé : cherchez le plus grand nombre de kilos qui suffit.",
        dessus: "Avec autant de matière, le résultat de l'usine reste sous le budget : consommez moins.",
      }),
      montrer: "Montrer les kilos qui suffisent",
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const l = s.leviers;
        const k = s.e.preetabliDuReel.kilos;
        return [
          `Même sans aucun gaspillage, aux ${qte(k)} kg du préétabli de la production réelle, le résultat serait de ${eur(l.auxKilos(k))} : il manquerait ${eur(auCentime(l.manque - l.auStandard.kilos))}. Pour rattraper seul le budget, l'atelier ne devrait consommer que ${qte(l.kilosQuiSuffisent)} kg, ${qte(auCentime(k - l.kilosQuiSuffisent))} kg sous le standard : aucun atelier ne fabrique les mêmes enceintes avec si peu de matière.`,
          "Ni le prix de la Nomade ni la matière ne suffisent seuls : l'écart de résultat est fait de beaucoup d'écarts, chacun avec son responsable. Les étapes suivantes les rassemblent.",
        ];
      },
    },
    {
      id: "le-bon-repere",
      objectifs: [2],
      type: "montants",
      titre: "Le coût préétabli de la production réelle",
      notions: ["standard_costing", "cost_variance"],
      tableau: tableauDuCoutPreetabli,
      question: (c) => {
        const s = syntheseDesEcarts(c);
        const r = s.f.realise;
        return `Pour juger l'usine, on compare son coût réel à ce qu'aurait dû coûter ce qu'elle a vraiment fabriqué. Calculez le coût préétabli de la production réelle (${qte(r.ventes.nomade.quantite)} × ${eur(s.cNomade.total)} + ${qte(r.ventes.salon.quantite)} × ${eur(s.cSalon.total)}), puis l'écart global sur coûts : coût réel de production moins ce coût préétabli. Négatif pour un écart favorable.`;
      },
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        const r = s.f.realise;
        return [
          {
            libelle: "Coût préétabli de la production réelle",
            attendu: s.e.preetabliDuReel.total,
            calcul: `${qte(r.ventes.nomade.quantite)} × ${eur(s.cNomade.total)} + ${qte(r.ventes.salon.quantite)} × ${eur(s.cSalon.total)} = ${eur(s.e.preetabliDuReel.total)}`,
          },
          {
            libelle: "Écart global sur coûts",
            attendu: s.e.ecartGlobalSurCouts,
            calcul: `${eur(s.e.reelTotal)} − ${eur(s.e.preetabliDuReel.total)} = ${eur(s.e.ecartGlobalSurCouts)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `L'écart global sur coûts, ${eur(s.e.ecartGlobalSurCouts)} défavorable, est la somme des écarts globaux de la matière (${eur(s.e.matiere.global)}), de la main-d'œuvre directe (${eur(s.e.mainDOeuvre.global)}) et du centre de montage (${eur(s.e.centre.global)}). C'est ce que la production coûte au résultat.`,
        ];
      },
    },
    {
      id: "le-budget-de-depart",
      objectifs: [2],
      type: "choix",
      titre: "Le budget de départ n'est pas le bon repère",
      notions: ["standard_costing", "cost_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Le coût réel de production, ${eur(s.e.reelTotal)}, dépasse le budget standard de ${eur(s.depassementDuBudget)}. Est-ce l'écart dont l'usine doit répondre ?`;
      },
      options: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          {
            texte: `Non : ${eur(s.partDuVolume)} de ce dépassement viennent de ce qui a été vendu ; l'usine répond de ${eur(s.e.ecartGlobalSurCouts)}`,
            juste: true,
            retour: `C'est cela. Le budget standard chiffre la production prévue ; l'usine a fabriqué autre chose, plus de ${s.salon.nom} et moins de ${s.nomade.nom}. Ce changement coûte ${eur(s.e.preetabliDuReel.total)} − ${eur(s.e.budgetStandard.total)} = ${eur(s.partDuVolume)} au coût préétabli, sans aucun gaspillage : il appartient aux ventes, qui le portent dans leur écart sur volume. L'usine répond du reste, ${eur(s.e.ecartGlobalSurCouts)}.`,
          },
          {
            texte: `Oui : ${eur(s.depassementDuBudget)}, le coût réel moins le budget standard, c'est ce que l'usine a dépensé de trop`,
            juste: false,
            retour: `C'est l'erreur classique : comparer le réel au budget de départ, bâti sur d'autres quantités. ${eur(s.partDuVolume)} de ce dépassement viennent seulement de ce que l'usine a fabriqué plus de ${s.salon.nom}, une enceinte qui coûte ${eur(s.cSalon.total)} au préétabli. On compare au coût préétabli de la production réelle : ${eur(s.e.ecartGlobalSurCouts)}.`,
          },
          {
            texte: "Non : l'usine a fabriqué ce que les ventes lui ont demandé, elle ne répond d'aucun écart",
            juste: false,
            retour: `L'usine ne répond pas des quantités, c'est vrai ; mais à quantités réelles, elle a coûté ${eur(s.e.ecartGlobalSurCouts)} de plus que le préétabli : ce dépassement-là est le sien.`,
          },
        ];
      },
    },
    {
      id: "la-part-des-ventes",
      objectifs: [2],
      type: "montants",
      titre: "Ce que les ventes font au résultat",
      notions: ["volume_price_variance", "contribution_margin"],
      tableau: tableauDesVentes,
      question: () =>
        "Mesurez ce que les ventes ont fait au résultat : l'écart sur prix de vente, l'écart sur volume, puis leur somme, l'effet des ventes sur le résultat. Choisissez vous-même, dans le tableau, la base de chaque écart. Négatif pour un écart défavorable.",
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        const r = s.f.realise;
        const v = s.e.ventes;
        return [
          {
            libelle: "Écart sur prix de vente",
            attendu: v.prix,
            calcul: `(${eur(r.ventes.nomade.prix)} − ${eur(s.nomade.prixPrevu)}) × ${qte(r.ventes.nomade.quantite)} + (${eur(r.ventes.salon.prix)} − ${eur(s.salon.prixPrevu)}) × ${qte(r.ventes.salon.quantite)} = ${eur(v.prix)}, sur les quantités réelles`,
          },
          {
            libelle: "Écart sur volume, à la marge préétablie",
            attendu: v.volume,
            calcul: `(${qte(r.ventes.nomade.quantite)} − ${qte(s.nomade.quantitePrevue)}) × ${eur(s.cNomade.marge)} + (${qte(r.ventes.salon.quantite)} − ${qte(s.salon.quantitePrevue)}) × ${eur(s.cSalon.marge)} = ${eur(v.volume)}, à la marge préétablie et non au prix`,
          },
          {
            libelle: "Effet des ventes sur le résultat",
            attendu: s.ventes,
            calcul: `${eur(v.prix)} + ${entreParentheses(v.volume)} = ${eur(s.ventes)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const v = s.e.ventes;
        return [
          `L'écart sur volume se partage, comme au chapitre précédent, en un écart sur quantité globale, ${eur(v.quantiteGlobale)} (${qte(v.qTotaleReelle)} enceintes vendues au lieu de ${qte(v.qTotalePrevue)}, à la marge préétablie moyenne de ${eur(v.margeMoyennePrevue)}), et un écart sur composition, ${signe(v.composition)} : plus de ${s.salon.nom}, mieux margée. Les ventes coûtent ${eur(-s.ventes)} au résultat.`,
        ];
      },
    },
    {
      id: "volume-au-prix",
      objectifs: [2],
      type: "choix",
      titre: "Le volume se juge à la marge",
      notions: ["volume_price_variance", "contribution_margin"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Le chiffre d'affaires ne manque son budget que de ${eur(-s.e.ventes.ecartDeChiffreDAffaires)}. Pourquoi les ventes coûtent-elles ${eur(-s.ventes)} au résultat ?`;
      },
      options: (c) => {
        const s = syntheseDesEcarts(c);
        const v = s.e.ventes;
        const coutDuVolume = auCentime(v.quantiteSurChiffreDAffaires - v.volume);
        return [
          {
            texte: "Parce qu'au résultat, une enceinte vendue de plus n'apporte que sa marge préétablie",
            juste: true,
            retour: `Oui. Au prix, l'écart sur quantités ferait ${signe(v.quantiteSurChiffreDAffaires)} ; à la marge, il fait ${eur(v.volume)}. La différence, ${eur(coutDuVolume)}, est le coût préétabli des enceintes vendues en plus ou en moins : les mêmes ${eur(s.partDuVolume)} qui séparent le budget standard du préétabli de la production réelle. Le volume les porte ; l'usine, non.`,
          },
          {
            texte: `Ce n'est pas le cas : au résultat, les ventes ne pèsent que l'écart sur chiffre d'affaires, ${eur(v.ecartDeChiffreDAffaires)}`,
            juste: false,
            retour: `C'est valoriser le volume au prix de vente. Une enceinte de plus apporte son prix, mais elle coûte aussi son coût préétabli : ${eur(coutDuVolume)} que l'on oublierait, ou que l'on ferait porter à l'usine.`,
          },
          {
            texte: `Parce que l'usine a dépensé ${eur(s.partDuVolume)} de trop, qu'on retire aux ventes`,
            juste: false,
            retour: `Ces ${eur(s.partDuVolume)} ne sont pas une dépense de trop : c'est le coût préétabli de ce qui a été vendu en plus. Les retirer aux ventes et les laisser aussi à l'usine, ce serait les compter deux fois.`,
          },
        ];
      },
    },
    {
      id: "le-signe",
      objectifs: [1],
      type: "choix",
      titre: "Chaque écart avec son signe",
      notions: ["cost_variance", "income_statement"],
      tableau: tableauDesEcarts,
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Au tableau de passage, chaque écart entre par son effet sur le résultat. L'écart sur prix de la matière vaut ${eur(s.e.matiere.prix)}, calculé réel moins prévu sur une charge. Comment s'y inscrit-il ?`;
      },
      options: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          {
            texte: "Avec le signe contraire : une charge plus forte que prévu retire autant au résultat",
            juste: true,
            retour: `Oui : ${eur(-s.e.matiere.prix)}. Un écart sur charge change de signe au passage ; un écart sur marge garde le sien.`,
          },
          {
            texte: "Tel quel : un écart se reporte comme on l'a calculé, réel moins prévu",
            juste: false,
            retour: `Les ${qte(s.lignes.length)} écarts du tableau, additionnés tels quels, donnent ${signe(s.sommeSansSigne)} : un résultat qui aurait monté, alors qu'il baisse de ${eur(-s.e.ecartDeResultat)}. Une charge plus forte retire au résultat.`,
          },
          {
            texte: "Avec le signe contraire, comme tous les écarts du tableau, ventes comprises",
            juste: false,
            retour: `Les écarts sur ventes sont déjà dans le sens du résultat : une marge plus forte l'augmente. Tout inverser donne ${signe(s.sommeTousInverses)}, et non ${eur(s.e.ecartDeResultat)}.`,
          },
        ];
      },
    },
    {
      id: "le-tableau-de-passage",
      objectifs: [1],
      type: "montants",
      titre: "Le tableau de passage",
      notions: ["cost_variance", "volume_price_variance", "income_statement"],
      tableau: tableauDesEcarts,
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Dressez le tableau de passage du résultat prévu, ${eur(s.e.resultatPrevu)}, au résultat réel : l'effet de chaque écart sur le résultat, positif s'il est favorable, négatif s'il est défavorable, puis le résultat réel que vous retrouvez.`;
      },
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          ...s.lignes.map((l) => ({
            libelle: `Effet sur le résultat · ${l.poste}`,
            attendu: l.effet,
            calcul: estUneVente(l.poste)
              ? `un écart sur marge garde son signe : ${signe(l.effet)}`
              : `une charge change de signe : ${eur(s.brut(l))} devient ${signe(l.effet)}`,
          })),
          {
            libelle: "Résultat réel retrouvé",
            attendu: s.e.resultatReel,
            calcul: `la somme des ${qte(s.lignes.length)} effets fait ${eur(s.e.ecartDeResultat)} ; ${eur(s.e.resultatPrevu)} + ${entreParentheses(s.e.ecartDeResultat)} = ${eur(s.e.resultatReel)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const v = s.lignes.filter((l) => estUneVente(l.poste)).map((l) => l.effet);
        const p = s.lignes.filter((l) => !estUneVente(l.poste) && l.responsable !== "distribution").map((l) => l.effet);
        return [
          `La somme retombe exactement sur l'écart de résultat. Elle se partage en trois : les ventes, ${additionne(v, s.ventes)} ; la production, ${additionne(p, s.production)} ; la distribution, ${eur(s.distribution)}. Au total, ${additionne([s.ventes, s.production, s.distribution], s.e.ecartDeResultat)}.`,
          "Le tableau ne retombe sur l'écart que si chaque écart y entre une fois, avec son signe : c'est sa vérification.",
        ];
      },
    },
    {
      id: "se-compensent",
      objectifs: [3],
      type: "choix",
      titre: "Les écarts qui se compensent",
      notions: ["volume_price_variance", "cost_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Le chiffre d'affaires ne manque son budget que de ${eur(-s.e.ventes.ecartDeChiffreDAffaires)}, l'écart sur volume n'est que de ${eur(s.e.ventes.volume)}, et la main-d'œuvre directe ne dépasse son préétabli que de ${eur(s.e.mainDOeuvre.global)}. Qu'en concluez-vous ?`;
      },
      options: (c) => {
        const e = syntheseDesEcarts(c).e;
        const paires = `Le chiffre d'affaires : ${eur(e.ventes.prix)} sur les prix, ${signe(e.ventes.quantiteSurChiffreDAffaires)} sur les quantités. Le volume : ${eur(e.ventes.quantiteGlobale)} sur la quantité globale, ${signe(e.ventes.composition)} sur la composition. La main-d'œuvre : ${eur(e.mainDOeuvre.taux)} défavorable sur le taux, ${eur(-e.mainDOeuvre.temps)} favorable sur le temps.`;
        return [
          {
            texte: "Que chacun de ces petits écarts cache deux gros écarts de sens contraire",
            juste: true,
            retour: `Oui. ${paires} Un écart global faible ne dit pas que tout va bien : il dit que deux dérives se sont croisées.`,
          },
          {
            texte: "Que ces postes ont tenu leur budget : l'analyse peut se porter ailleurs",
            juste: false,
            retour: `C'est s'arrêter à l'écart global. ${paires}`,
          },
          {
            texte: "Que la gestion par exception les écarte : ils restent sous le seuil de signification",
            juste: false,
            retour: `Le seuil se juge sur les écarts élémentaires, pas sur leur somme. ${paires} Aucun de ceux-là n'est négligeable.`,
          },
        ];
      },
    },
    {
      id: "le-levier-des-heures",
      objectifs: [2],
      type: "curseur",
      titre: "Le levier des heures-machine",
      notions: ["efficiency_variance", "fixed_costs"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Dernier levier : faites tourner le centre de montage plus ou moins longtemps, pour la même production, tout le reste du trimestre réel restant tel quel. Le centre a tourné ${qte(s.heuresReelles)} heures-machine. Placez le curseur sur le plus grand nombre d'heures-machine qui rattrape encore le résultat prévu.`;
      },
      grandeur: () => ({ libelle: "Heures-machine du centre de montage", unite: "heures-machine" }),
      sens: "plus-grande",
      cible: (c) => {
        const l = syntheseDesEcarts(c).leviers;
        return { attendu: l.heuresQuiSuffisent, ...l.bornes.heures };
      },
      lecture: (c, h) => {
        const s = syntheseDesEcarts(c);
        const resultat = s.leviers.auxHeures(h);
        const flexible = s.f.centre.chargesFixes + s.f.centre.coutVariableParHeure * h;
        return [
          { libelle: "Écart sur rendement", montant: auCentime((h - s.e.preetabliDuReel.heuresMachine) * s.cHm) },
          { libelle: "Écart sur activité", montant: auCentime(flexible - s.cHm * h) },
          { libelle: "Résultat de l'usine", montant: resultat },
          { libelle: "Écart de résultat", montant: auCentime(resultat - s.e.resultatPrevu), fort: true },
        ];
      },
      droites: (c) => {
        const s = syntheseDesEcarts(c);
        return { produit: (h) => s.leviers.auxHeures(h), cout: () => s.e.resultatPrevu, libelles: ["Résultat de l'usine", "Résultat prévu"] };
      },
      zones: ["Le budget est rattrapé", "Le résultat reste sous le budget"],
      rates: () => ({
        dessous: "Avec moins d'heures encore, le budget serait toujours rattrapé : cherchez le plus grand nombre d'heures-machine qui suffit.",
        dessus: "Avec autant d'heures, le résultat de l'usine reste sous le budget : faites tourner le centre moins longtemps.",
      }),
      montrer: "Montrer les heures qui suffisent",
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const l = s.leviers;
        const h = s.e.preetabliDuReel.heuresMachine;
        return [
          `Regardez la lecture : l'écart sur rendement bouge de ${eur(s.cHm)} par heure-machine, l'écart sur activité de ${eur(s.partFixe)} dans l'autre sens, et le résultat de ${eur(s.f.centre.coutVariableParHeure)} seulement, le coût variable d'une heure. Ramené aux ${qte(h)} heures-machine du préétabli de la production réelle, le centre ne rendrait que ${eur(l.auStandard.heures)}. Pour rattraper seul le budget, il faudrait ne tourner que ${qte(l.heuresQuiSuffisent)} heures-machine : impossible pour cette production.`,
          `Ramenés tous trois à leur standard (la ${s.nomade.nom} à ${eur(s.nomade.prixPrevu)}, ${qte(s.e.preetabliDuReel.kilos)} kg, ${qte(h)} heures-machine), les trois leviers rendraient ${eur(l.ensemble)} : il manquerait encore ${eur(l.resteAuStandard)}. Aucun ne suffit seul, ni même avec les deux autres. Pourquoi une heure de trop ne coûte que son coût variable : les deux étapes suivantes le calculent.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [1],
      type: "montants",
      titre: "Le coût réel du centre, à rebours",
      notions: ["cost_variance", "fixed_costs"],
      tableau: tableauDuCentre,
      question: () =>
        "Le compte rendu du centre de montage s'est perdu : il reste le tableau de passage, les ventes réelles et la fiche du centre. Retrouvez les heures-machine réellement passées au centre, le budget flexible de cette activité réelle, puis le coût réel du centre.",
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        const r = s.f.realise;
        const e = s.e;
        return [
          {
            libelle: "Heures-machine réelles",
            attendu: s.heuresReelles,
            calcul: `le préétabli de la production réelle, ${qte(r.ventes.nomade.quantite)} × ${qte(s.nomade.heuresMachineParUnite)} + ${qte(r.ventes.salon.quantite)} × ${qte(s.salon.heuresMachineParUnite)} = ${qte(e.preetabliDuReel.heuresMachine)}, plus les heures de l'écart sur rendement, ${eur(e.centre.rendement)} ÷ ${eur(s.cHm)} = ${qte(s.heuresPerdues)} : ${qte(s.heuresReelles)}`,
          },
          {
            libelle: "Budget flexible de l'activité réelle",
            attendu: e.centre.budgetFlexible,
            calcul: `${eur(s.f.centre.chargesFixes)} + ${eur(s.f.centre.coutVariableParHeure)} × ${qte(s.heuresReelles)} = ${eur(e.centre.budgetFlexible)}`,
          },
          {
            libelle: "Coût réel du centre",
            attendu: r.centre.cout,
            calcul: `${eur(e.centre.budgetFlexible)} + l'écart sur budget, ${eur(e.centre.budget)} = ${eur(r.centre.cout)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const e = s.e;
        return [
          `On remonte la chaîne du centre : le rendement donne les heures, les heures donnent le budget flexible, l'écart sur budget donne le coût réel. Vérification : ${additionne([e.centre.budget, e.centre.activite, e.centre.rendement], e.centre.global)}, l'écart global du centre, ${eur(s.f.realise.centre.cout)} − ${eur(e.preetabliDuReel.centre)}.`,
        ];
      },
    },
    {
      id: "l-heure-de-trop",
      objectifs: [3],
      type: "montants",
      titre: "Ce qu'un écart favorable peut cacher",
      notions: ["efficiency_variance", "fixed_costs"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `L'écart sur activité est favorable : ${eur(-s.e.centre.activite)} de boni de suractivité. Mesurez ce qu'il doit aux heures perdues : les heures-machine travaillées au-delà de l'activité normale, celles qui l'ont été au-delà du préétabli de la production réelle, la part du boni que ces dernières ont faite, puis ce qu'elles coûtent vraiment au résultat, rendement et activité ensemble (négatif s'il est défavorable).`;
      },
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        const e = s.e;
        return [
          {
            libelle: "Heures-machine au-delà de l'activité normale",
            attendu: s.auDessusDeLaNormale,
            calcul: `${qte(s.heuresReelles)} − ${qte(s.f.centre.activiteNormale)} = ${qte(s.auDessusDeLaNormale)}`,
          },
          {
            libelle: "Heures-machine au-delà du préétabli de la production réelle",
            attendu: s.heuresPerdues,
            calcul: `${qte(s.heuresReelles)} − ${qte(e.preetabliDuReel.heuresMachine)} = ${qte(s.heuresPerdues)}`,
          },
          {
            libelle: "Part du boni due aux heures perdues",
            attendu: s.boniDesHeuresPerdues,
            calcul: `${qte(s.heuresPerdues)} × (${eur(s.f.centre.chargesFixes)} ÷ ${qte(s.f.centre.activiteNormale)}) = ${qte(s.heuresPerdues)} × ${eur(s.partFixe)} = ${eur(s.boniDesHeuresPerdues)}`,
          },
          {
            libelle: "Effet net des heures perdues sur le résultat",
            attendu: s.coutNetDesHeuresPerdues,
            calcul: `l'effet du rendement, ${eur(-e.centre.rendement)}, plus le boni, ${eur(s.boniDesHeuresPerdues)} : ${eur(s.coutNetDesHeuresPerdues)}`,
          },
        ];
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `Une même heure de trop pèse deux fois : au coût standard complet, ${eur(s.cHm)}, dans l'écart sur rendement, et pour sa part fixe, ${eur(s.partFixe)}, en boni dans l'écart sur activité. Net, chacune des ${qte(s.heuresPerdues)} heures perdues coûte son seul coût variable : ${qte(s.heuresPerdues)} × ${eur(s.f.centre.coutVariableParHeure)} = ${eur(-s.coutNetDesHeuresPerdues)}. Les charges fixes, elles, auraient été payées de toute façon.`,
          `Le boni de suractivité n'est donc pas une économie de dépenses : sur ses ${eur(-s.e.centre.activite)}, ${eur(s.boniDesHeuresPerdues)} viennent d'heures qui n'auraient pas dû être travaillées. Il en va de même de l'écart sur temps favorable, payé d'un taux horaire plus élevé, et de l'écart sur composition, qui masque des ventes perdues.`,
        ];
      },
    },
    {
      id: "le-laboratoire",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire : rattraper le budget",
      notions: ["cost_variance", "volume_price_variance", "efficiency_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Faites tourner l'usine avec quatre grandes causes à la fois : le prix de la ${s.nomade.nom}, les kilos consommés, le taux horaire et les heures-machine. Chaque ligne du tableau de passage réagit en direct, avec son effet sur le résultat.`;
      },
      leviers: (c) => {
        const s = syntheseDesEcarts(c);
        const d = departDuLaboratoire(s.f);
        return [
          { code: "prixNomade", libelle: `Prix de vente de la ${s.nomade.nom}`, unite: "€", min: d.prixNomade - 3, max: s.nomade.prixPrevu + 5, pas: 1, depart: d.prixNomade },
          { code: "kilos", libelle: "Kilos de matière consommés", unite: "kg", min: 16_000, max: 19_000, pas: 100, depart: d.kilos },
          { code: "taux", libelle: "Taux horaire de la main-d'œuvre directe", unite: "€", min: s.f.tauxHoraireStandard - 2, max: s.f.tauxHoraireStandard + 2, pas: 0.5, depart: d.taux },
          { code: "heures", libelle: "Heures-machine du centre de montage", unite: "heures-machine", min: 4_500, max: 5_500, pas: 50, depart: d.heures },
        ];
      },
      lecture: (c, position) => {
        const s = syntheseDesEcarts(c);
        const ici = passageALaPosition(c, position);
        const depart = passageALaPosition(c, {});
        return [
          ...ici.lignes.map((l, i) => ({ libelle: l.poste, montant: l.effet, reference: depart.lignes[i]!.effet, effet: true })),
          { libelle: "Écart de résultat", montant: ici.ecart, reference: depart.ecart, fort: true },
          { libelle: "Résultat de l'usine", montant: ici.resultat, reference: depart.resultat, fort: true },
          { libelle: "Résultat prévu", montant: s.e.resultatPrevu },
        ];
      },
      defi: (c) => {
        const s = syntheseDesEcarts(c);
        return {
          consigne: `Retrouvez le résultat prévu, ${eur(s.e.resultatPrevu)}, sans vendre la ${s.nomade.nom} au-dessus de son prix prévu, ${eur(s.nomade.prixPrevu)}.`,
          atteint: (position) => defiAtteint(c, position),
          indice: (position) => {
            const p = passageALaPosition(c, position);
            return p.position.prixNomade > s.nomade.prixPrevu
              ? `Dans ce défi, la ${s.nomade.nom} ne se vend pas au-dessus de ${eur(s.nomade.prixPrevu)} : cherchez ailleurs.`
              : `Il manque encore ${eur(auCentime(s.e.resultatPrevu - p.resultat))}. Avez-vous ramené chaque levier à son standard ? Et si cela ne suffit pas ?`;
          },
          solution: solutionDuLaboratoire(c).solution,
        };
      },
      montrer: "Montrer une solution",
      explication: (c, position) => {
        const s = syntheseDesEcarts(c);
        const x = solutionDuLaboratoire(c);
        const ici = passageALaPosition(c, position);
        return [
          `À votre position, le résultat de l'usine est de ${eur(ici.resultat)}. Ramenés tous les quatre à leur standard (la ${s.nomade.nom} à ${eur(x.auStandard.prixNomade)}, ${qte(x.auStandard.kilos)} kg, ${eur(x.auStandard.taux)} de l'heure, ${qte(x.auStandard.heures)} heures-machine), les leviers ne donnent que ${eur(x.resultatAuStandard)} : il manque encore ${eur(auCentime(s.e.resultatPrevu - x.resultatAuStandard))}.`,
          "Pour rattraper le budget, il faut donc battre un standard quelque part : d'autres écarts restent hors de ces leviers, le prix de la matière, le budget du centre, la distribution, la quantité globale vendue. Le résultat est fait de tous les écarts à la fois, et chaque levier en fait bouger plusieurs : les kilos touchent le prix et la quantité de la matière, les heures le rendement et l'activité.",
        ];
      },
    },
    {
      id: "qui-doit-agir",
      objectifs: [4],
      type: "tri",
      titre: "Qui doit agir",
      notions: ["cost_variance", "material_price_variance", "efficiency_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Voici les écarts des ventes et de la production, chacun avec son effet sur le résultat. Rangez-les selon qui doit les expliquer, et agir, chez ${s.f.entreprise}.`;
      },
      categories: RESPONSABLES_DU_TRI.map((r) => ({ code: r, libelle: NOM_DU_RESPONSABLE[r] })),
      elements: (c) => {
        const s = syntheseDesEcarts(c);
        const pourquoi: Readonly<Record<(typeof RESPONSABLES_DU_TRI)[number], string>> = {
          commercial: "Le prix obtenu, le nombre d'enceintes vendues et leur composition se jouent chez le client.",
          achats: "Le prix payé au kilo se négocie avec le fournisseur.",
          atelier: "Les kilos consommés, les heures travaillées et les heures-machine passées par enceinte se jouent à l'atelier.",
          rh: "Le taux horaire, heures supplémentaires et salaires, dépend des ressources humaines et de l'organisation du temps de travail.",
          centre: "Les dépenses du centre face à son budget flexible relèvent de son responsable.",
          direction: "L'activité du centre suit le volume que décide la direction : ce n'est ni une dépense ni une économie.",
        };
        return s.lignes
          .filter((l) => l.responsable !== "distribution")
          .map((l) => ({ libelle: l.poste, montant: l.effet, categorie: l.responsable, pourquoi: pourquoi[l.responsable as (typeof RESPONSABLES_DU_TRI)[number]] }));
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `La distribution, ${eur(s.distribution)}, revient à son propre service. Le modèle ne connaît que les écarts, pas leurs causes : l'imputation dit qui doit expliquer, pas qui est fautif.`,
        ];
      },
    },
    {
      id: "la-part-de-chacun",
      objectifs: [4],
      type: "montants",
      titre: "La part de chaque responsable",
      notions: ["cost_variance", "volume_price_variance"],
      tableau: tableauDesEcarts,
      question: () => "Additionnez, pour chaque responsable, l'effet sur le résultat des écarts qui lui reviennent. Négatif pour un effet défavorable.",
      champs: (c) => {
        const s = syntheseDesEcarts(c);
        return RESPONSABLES_DU_TRI.map((r) => ({
          libelle: `Part ${PART_DU_RESPONSABLE[r]}`,
          attendu: s.parResponsable[r],
          calcul: additionne(
            s.lignes.filter((l) => l.responsable === r).map((l) => l.effet),
            s.parResponsable[r],
          ),
        }));
      },
      explication: (c) => {
        const s = syntheseDesEcarts(c);
        const liste = s.ordre.map((r) => `${minuscule(NOM_DU_RESPONSABLE[r])}, ${signe(s.parResponsable[r])}`).join(" ; ");
        return [
          `Par ordre d'importance : ${liste}.`,
          `La production pèse ${eur(s.production)} au total, plus que les ventes (${eur(s.ventes)}) ; mais elle se partage entre plusieurs responsables. Pris un par un, c'est ${minuscule(NOM_DU_RESPONSABLE[s.ordre[0]!])} qui porte le plus gros écart, et c'est par lui que l'analyse commence.`,
        ];
      },
    },
    {
      id: "la-prime",
      objectifs: [4],
      type: "choix",
      titre: "Maîtrisable ou non : la prime sur un seul écart",
      notions: ["material_price_variance", "efficiency_variance"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Pour le trimestre prochain, la direction propose de primer le responsable des achats sur le seul écart sur prix de la matière (${eur(s.e.matiere.prix)} défavorable ce trimestre). Qu'en dites-vous ?`;
      },
      options: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          {
            texte: "C'est risqué : une matière achetée moins cher peut se gaspiller à l'atelier",
            juste: true,
            retour: `Oui. Les écarts sont liés : une matière moins chère mais de moindre qualité ferait baisser l'écart sur prix et monter l'écart sur quantité, déjà de ${eur(s.e.matiere.quantite)}. Une prime sur un seul écart déplace le problème ; on prime sur ce que le responsable maîtrise, et l'on suit les écarts qui en dépendent.`,
          },
          {
            texte: "C'est une bonne idée : le prix d'achat est maîtrisable par les achats, la prime le fera baisser",
            juste: false,
            retour: `Le prix d'achat dépend en partie des achats, c'est vrai. Mais la prime pousserait à acheter moins cher sans regarder ce que la matière devient à l'atelier, où l'écart sur quantité est déjà de ${eur(s.e.matiere.quantite)}.`,
          },
          {
            texte: `Mieux vaut primer l'atelier sur tout l'écart de l'usine, ${eur(s.e.ecartGlobalSurCouts)}, dont il est responsable`,
            juste: false,
            retour: `L'atelier ne maîtrise qu'une partie de cet écart : la quantité de matière, le temps et le rendement, soit ${eur(s.parResponsable.atelier)} sur le résultat. Le prix de la matière, le taux horaire, le budget du centre et l'activité se décident ailleurs.`,
          },
        ];
      },
    },
    {
      id: "le-tableau-de-bord",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le contrôle budgétaire ne dit pas",
      notions: ["dashboard", "standard_costing"],
      question: (c) => {
        const s = syntheseDesEcarts(c);
        return `Le tableau de passage explique les ${eur(-s.e.ecartDeResultat)} au centime. Que manque-t-il encore au pilotage de l'usine ?`;
      },
      options: () => [
        {
          texte: "La vitesse et les causes : il arrive après le trimestre, en euros",
          juste: true,
          retour:
            "Oui. Le contrôle budgétaire mesure, après coup et en euros, des écarts à des standards qui vieillissent. Le tableau de bord ajoute des indicateurs suivis chaque semaine par chaque responsable, souvent physiques (taux de rebut, heures-machine par enceinte, prix obtenus, délais), qui disent la cause avant que l'écart ne se forme.",
        },
        {
          texte: "Rien : un tableau de passage qui retombe au centime explique tout le trimestre",
          juste: false,
          retour:
            "Il retombe au centime parce que c'est une identité de calcul : il dit combien et où, pas pourquoi. Le taux horaire a-t-il monté par des heures supplémentaires ou par une hausse de salaire ? Le tableau ne le dit pas.",
        },
        {
          texte: "Des standards plus serrés : un standard idéal ferait apparaître tous les gaspillages",
          juste: false,
          retour:
            "Un standard idéal, sans aucune perte, rend tous les écarts défavorables, chaque trimestre : plus personne ne les lit. Le standard doit être atteignable, et révisé quand les conditions changent.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cost_variance", "volume_price_variance", "dashboard"],
      texte: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `Vous avez expliqué, au centime, les ${eur(-s.e.ecartDeResultat)} qui manquent au résultat de ${s.f.entreprise} : ${eur(s.ventes)} pour les ventes, ${eur(s.production)} pour la production, ${eur(s.distribution)} pour la distribution.`,
          "Vous savez faire ce qu'on attend à l'épreuve : dresser le tableau de passage du résultat prévu au résultat réel, chaque écart avec son signe ; comparer le réel au coût préétabli de la production réelle et non au budget de départ ; juger le volume à la marge préétablie ; retrouver un chiffre réel à rebours ; voir qu'une même heure perdue pèse sur le rendement et sur l'activité ; imputer chaque écart à son responsable, distinguer ce qu'il maîtrise, et dire les limites d'une méthode qui mesure tard et en euros.",
          "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Écart de résultat = écart sur prix de vente + écart sur volume (à la marge préétablie) − écart global sur coûts (réel − préétabli de la production réelle) − écart sur distribution. Au tableau de passage, un écart sur charge change de signe.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX PARTIES (audit pédagogique : aucun chapitre de plus de 20 étapes)
// ─────────────────────────────────────────────────────────────────────────────

export const CODE_DE_LA_SUITE = "les-ecarts-et-leurs-responsables";
export const TITRE_DE_LA_SUITE = "Les écarts et leurs responsables";

/** PREMIÈRE PARTIE : les étapes du chapitre d'origine jusqu'à `le-levier-des-heures` exclue, puis sa propre synthèse. */
export const ANALYSE_DES_ECARTS: Chapitre = partieDuChapitre(ANALYSE_DES_ECARTS_ENTIERE, [
  ...etapesAvant(ANALYSE_DES_ECARTS_ENTIERE, "le-levier-des-heures"),
  {
    id: "fin",
    type: "lecture",
    titre: "Ce que vous savez faire",
    notions: ["cost_variance", "volume_price_variance"],
    tableau: tableauDesEcarts,
    texte: (c) => {
      const s = syntheseDesEcarts(c);
      return [
        `Vous avez partagé les ${eur(-s.e.ecartDeResultat)} qui manquent au résultat de ${s.f.entreprise} : ${eur(s.ventes)} pour les ventes, ${eur(s.production)} pour la production, ${eur(s.distribution)} pour la distribution, chaque écart avec son signe au tableau de passage.`,
        `La suite, « ${TITRE_DE_LA_SUITE} », cherche ce que les écarts cachent : une heure perdue qui pèse deux fois, un chiffre réel retrouvé à rebours, puis le responsable de chaque écart et les limites de la méthode.`,
        "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
      ];
    },
    repere: () => "Écart de résultat = écart sur prix de vente + écart sur volume (à la marge préétablie) − écart global sur coûts − écart sur distribution. Au tableau de passage, un écart sur charge change de signe.",
  },
]);

/** SUITE : sa propre introduction, puis les étapes du chapitre d'origine depuis `le-levier-des-heures`, synthèse comprise. */
export const LES_ECARTS_ET_LEURS_RESPONSABLES: Chapitre = partieDuChapitre(
  ANALYSE_DES_ECARTS_ENTIERE,
  [
    {
      id: "intro",
      type: "lecture",
      titre: "Un tableau de passage à faire parler",
      notions: ["cost_variance", "dashboard"],
      tableau: tableauDesEcarts,
      texte: (c) => {
        const s = syntheseDesEcarts(c);
        return [
          `Ce chapitre suit « ${ANALYSE_DES_ECARTS.titre} » : le résultat de ${s.f.entreprise} manque de ${eur(-s.e.ecartDeResultat)}, partagés au tableau de passage entre les ventes, la production et la distribution.`,
          "Il reste à faire parler ce tableau : ce qu'une heure perdue fait à deux écarts, un chiffre réel retrouvé à rebours, le budget rattrapé dans un laboratoire, puis le responsable de chaque écart.",
        ];
      },
      repere: () => "Un écart se juge par celui qui peut agir dessus : un écart que son responsable ne maîtrise pas ne dit rien de son travail.",
    },
    ...etapesDepuis(ANALYSE_DES_ECARTS_ENTIERE, "le-levier-des-heures"),
  ],
  {
    code: CODE_DE_LA_SUITE,
    titre: TITRE_DE_LA_SUITE,
    accroche: "Le tableau de passage de NOVA est dressé : ce qu'un écart favorable peut cacher, un coût réel retrouvé à rebours, puis qui doit agir sur chaque écart, et ce que la méthode ne dit pas.",
    prerequis: ["analyse-des-ecarts"],
    ouverture: undefined,
  },
);
