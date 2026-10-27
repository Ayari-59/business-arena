import type { FicheDeLUsine, ModeleDeNova } from "./nova-usine";

/**
 * LE MODÈLE DU CONTRÔLE BUDGÉTAIRE DE L'USINE DU COURS.
 *
 * Tout se calcule sur la fiche de l'usine (monde/nova-usine.ts), selon la méthode des coûts
 * préétablis du plan comptable :
 *
 *   · le coût préétabli d'une enceinte : matière (kilos × prix standard), main-d'œuvre directe
 *     (heures × taux standard), centre de montage (heures-machine × coût standard de
 *     l'heure-machine, son coût variable plus ses charges fixes ÷ l'activité normale) ;
 *   · le budget standard : la production prévue au coût préétabli ; le coût préétabli de la
 *     production réelle (le budget flexible des charges directes) ; l'écart global = réel − préétabli
 *     de la production réelle ;
 *   · matière : écart sur prix = (prix réel − prix standard) × kilos réels ; écart sur quantité =
 *     (kilos réels − kilos préétablis de la production réelle) × prix standard ;
 *   · main-d'œuvre directe : écart sur taux = (taux réel − taux standard) × heures réelles ; écart
 *     sur temps = (heures réelles − heures préétablies) × taux standard ;
 *   · centre de montage : écart sur budget = coût réel − budget flexible de l'activité réelle (les
 *     charges fixes, plus le coût variable des heures-machine réelles) ; écart sur activité =
 *     budget flexible de l'activité réelle − coût standard de ces heures (le coût du sous-emploi,
 *     négatif quand le centre a tourné au-dessus de son activité normale) ; écart sur rendement =
 *     (heures-machine réelles − heures-machine préétablies de la production réelle) × coût
 *     standard de l'heure-machine ;
 *   · ventes : écart sur prix = Σ (prix réel − prix prévu) × quantité réelle ; écart sur volume à
 *     la marge préétablie = Σ (quantité réelle − quantité prévue) × marge préétablie, qui se
 *     décompose en écart sur quantité globale = (quantité totale réelle − quantité totale prévue)
 *     × marge préétablie moyenne prévue, et écart sur composition = Σ (quantité réelle − quantité
 *     totale réelle × part prévue du modèle) × marge préétablie du modèle.
 *
 * CONVENTION : un écart est le réel moins le prévu. Sur une charge, positif est défavorable ; sur
 * un produit ou une marge, positif est favorable. Tous les montants sont au centime.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100;

/** Le coût standard d'une heure-machine du centre : variable + fixe ÷ activité normale. */
export const coutStandardDeLHeureMachine = (f: FicheDeLUsine) => auCentime(f.centre.coutVariableParHeure + f.centre.chargesFixes / f.centre.activiteNormale);

/** La fiche de coût préétabli d'une enceinte. */
export function coutPreetabli(f: FicheDeLUsine, m: ModeleDeNova) {
  const matiere = auCentime(m.matiereParUnite * f.prixStandardDuKilo);
  const mainDOeuvre = auCentime(m.heuresParUnite * f.tauxHoraireStandard);
  const centre = auCentime(m.heuresMachineParUnite * coutStandardDeLHeureMachine(f));
  const total = auCentime(matiere + mainDOeuvre + centre);
  return { matiere, mainDOeuvre, centre, total, marge: auCentime(m.prixPrevu - total) };
}

/** Les charges de production d'une quantité de chaque modèle, au coût préétabli, poste par poste. */
function auPreetabli(f: FicheDeLUsine, quantite: (m: ModeleDeNova) => number) {
  const somme = (g: (c: ReturnType<typeof coutPreetabli>) => number) => auCentime(f.modeles.reduce((t, m) => t + quantite(m) * g(coutPreetabli(f, m)), 0));
  return {
    kilos: auCentime(f.modeles.reduce((t, m) => t + quantite(m) * m.matiereParUnite, 0)),
    heures: auCentime(f.modeles.reduce((t, m) => t + quantite(m) * m.heuresParUnite, 0)),
    heuresMachine: auCentime(f.modeles.reduce((t, m) => t + quantite(m) * m.heuresMachineParUnite, 0)),
    matiere: somme((c) => c.matiere),
    mainDOeuvre: somme((c) => c.mainDOeuvre),
    centre: somme((c) => c.centre),
    total: somme((c) => c.total),
  };
}

/** Tout le contrôle budgétaire du trimestre. */
export function controleBudgetaire(f: FicheDeLUsine) {
  const r = f.realise;
  const prevue = (m: ModeleDeNova) => m.quantitePrevue;
  const reelle = (m: ModeleDeNova) => r.ventes[m.code].quantite;
  const budgetStandard = auPreetabli(f, prevue);
  const preetabliDuReel = auPreetabli(f, reelle);
  const cHm = coutStandardDeLHeureMachine(f);
  const reel = {
    matiere: auCentime(r.matiere.kilos * r.matiere.prixDuKilo),
    mainDOeuvre: auCentime(r.mainDOeuvre.heures * r.mainDOeuvre.tauxHoraire),
    centre: r.centre.cout,
  };
  const reelTotal = auCentime(reel.matiere + reel.mainDOeuvre + reel.centre);

  const matiere = {
    global: auCentime(reel.matiere - preetabliDuReel.matiere),
    prix: auCentime((r.matiere.prixDuKilo - f.prixStandardDuKilo) * r.matiere.kilos),
    quantite: auCentime((r.matiere.kilos - preetabliDuReel.kilos) * f.prixStandardDuKilo),
  };
  const mainDOeuvre = {
    global: auCentime(reel.mainDOeuvre - preetabliDuReel.mainDOeuvre),
    taux: auCentime((r.mainDOeuvre.tauxHoraire - f.tauxHoraireStandard) * r.mainDOeuvre.heures),
    temps: auCentime((r.mainDOeuvre.heures - preetabliDuReel.heures) * f.tauxHoraireStandard),
  };
  const budgetFlexibleDuCentre = auCentime(f.centre.chargesFixes + f.centre.coutVariableParHeure * r.centre.heuresMachine);
  const centre = {
    global: auCentime(reel.centre - preetabliDuReel.centre),
    budgetFlexible: budgetFlexibleDuCentre,
    budget: auCentime(reel.centre - budgetFlexibleDuCentre),
    activite: auCentime(budgetFlexibleDuCentre - cHm * r.centre.heuresMachine),
    rendement: auCentime((r.centre.heuresMachine - preetabliDuReel.heuresMachine) * cHm),
    /** Le coefficient d'imputation rationnelle : activité réelle ÷ activité normale. */
    coefficient: auCentime(r.centre.heuresMachine / f.centre.activiteNormale),
    fixesImputes: auCentime((f.centre.chargesFixes * r.centre.heuresMachine) / f.centre.activiteNormale),
  };

  const marge = (m: ModeleDeNova) => coutPreetabli(f, m).marge;
  const qTotalePrevue = f.modeles.reduce((t, m) => t + prevue(m), 0);
  const qTotaleReelle = f.modeles.reduce((t, m) => t + reelle(m), 0);
  const margePrevue = auCentime(f.modeles.reduce((t, m) => t + prevue(m) * marge(m), 0));
  const margeMoyennePrevue = auCentime(margePrevue / qTotalePrevue);
  const chiffreDAffairesPrevu = auCentime(f.modeles.reduce((t, m) => t + prevue(m) * m.prixPrevu, 0));
  const chiffreDAffairesReel = auCentime(f.modeles.reduce((t, m) => t + reelle(m) * r.ventes[m.code].prix, 0));
  /** La quantité de chaque modèle si la quantité totale réelle avait gardé la composition prévue. */
  const auMixPrevu = (m: ModeleDeNova) => auCentime((qTotaleReelle * prevue(m)) / qTotalePrevue);
  const ventes = {
    chiffreDAffairesPrevu,
    chiffreDAffairesReel,
    ecartDeChiffreDAffaires: auCentime(chiffreDAffairesReel - chiffreDAffairesPrevu),
    prix: auCentime(f.modeles.reduce((t, m) => t + (r.ventes[m.code].prix - m.prixPrevu) * reelle(m), 0)),
    quantiteSurChiffreDAffaires: auCentime(f.modeles.reduce((t, m) => t + (reelle(m) - prevue(m)) * m.prixPrevu, 0)),
    margePrevue,
    margeMoyennePrevue,
    volume: auCentime(f.modeles.reduce((t, m) => t + (reelle(m) - prevue(m)) * marge(m), 0)),
    quantiteGlobale: auCentime((qTotaleReelle - qTotalePrevue) * margeMoyennePrevue),
    composition: auCentime(f.modeles.reduce((t, m) => t + (reelle(m) - auMixPrevu(m)) * marge(m), 0)),
    qTotalePrevue,
    qTotaleReelle,
    auMixPrevu: Object.fromEntries(f.modeles.map((m) => [m.code, auMixPrevu(m)])) as Record<ModeleDeNova["code"], number>,
  };

  const resultatPrevu = auCentime(chiffreDAffairesPrevu - budgetStandard.total - f.distributionPrevue);
  const resultatReel = auCentime(chiffreDAffairesReel - reelTotal - r.distribution);
  const distribution = auCentime(r.distribution - f.distributionPrevue);
  /**
   * Le tableau de passage du résultat prévu au résultat réel, chaque écart pris avec son effet sur
   * le résultat (positif favorable) : les ventes au coût préétabli, puis chaque charge de
   * production, puis la distribution.
   */
  const passage: readonly { poste: string; effet: number }[] = [
    { poste: "Ventes : écart sur prix", effet: ventes.prix },
    { poste: "Ventes : écart sur quantité globale", effet: ventes.quantiteGlobale },
    { poste: "Ventes : écart sur composition", effet: ventes.composition },
    { poste: "Matière : écart sur prix", effet: -matiere.prix },
    { poste: "Matière : écart sur quantité", effet: -matiere.quantite },
    { poste: "Main-d'œuvre directe : écart sur taux", effet: -mainDOeuvre.taux },
    { poste: "Main-d'œuvre directe : écart sur temps", effet: -mainDOeuvre.temps },
    { poste: "Centre de montage : écart sur budget", effet: -centre.budget },
    { poste: "Centre de montage : écart sur activité", effet: -centre.activite },
    { poste: "Centre de montage : écart sur rendement", effet: -centre.rendement },
    { poste: "Distribution", effet: -distribution },
  ].map((l) => ({ ...l, effet: auCentime(l.effet) + 0 }));
  return {
    coutStandardDeLHeureMachine: cHm,
    budgetStandard,
    preetabliDuReel,
    reel,
    reelTotal,
    ecartGlobalSurCouts: auCentime(reelTotal - preetabliDuReel.total),
    matiere,
    mainDOeuvre,
    centre,
    ventes,
    distribution,
    passage,
    resultatPrevu,
    resultatReel,
    ecartDeResultat: auCentime(resultatReel - resultatPrevu),
  };
}

export type ControleBudgetaire = ReturnType<typeof controleBudgetaire>;
