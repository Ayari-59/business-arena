import { describe, expect, it } from "vitest";
import { bilanDeLExercice } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { SECONDE_LIGNE } from "../../src/config/cours/monde/comptabilite-approfondie";
import { ACTIONS_DE_NOVA as ACTIONS_DU_DCG, AUGMENTATION_DE_CAPITAL as AUGMENTATION_DU_DCG } from "../../src/config/cours/monde/comptabilite-approfondie";
import { affectationDeNova, augmentation as augmentationDuBts, perteDePixel } from "../../src/config/cours/monde/capitaux-propres";
import { annexe as annexeDeN, comptesAnnuels } from "../../src/config/cours/monde/comptes-annuels";
import { EXERCICES_DE_PIXEL } from "../../src/config/cours/monde/projets-et-financement";
import { DIVIDENDE_DEMANDE_PAR_ACTION as DIVIDENDE_DU_BAC } from "../../src/config/cours/monde/affectation-du-resultat";
import { SECONDE_LIGNE_PAYEE_EN_DECEMBRE, tableauDeFinancement, tableauDesFlux } from "../../src/config/cours/monde/tableaux-de-flux";
import { EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { anneeDuMarche } from "../../src/config/cours/monde/attractivite";
import { coefficientDeSaison, demandeAuPrix, marcheEtPart } from "../../src/config/cours/monde/economie-et-marketing";
import { CLOTURE_DE_LA_FICHE, COMPOSANTS_DE_DECEMBRE, VENTES_AUX_PARTICULIERS } from "../../src/config/cours/monde/exercice-de-nova";
import { JEUX_REVENUS_SANS_BON, concordance, moisDeGestion } from "../../src/config/cours/monde/comptabilite-de-gestion";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { MERCATIQUE_DE_NOVA } from "../../src/config/cours/monde/mercatique-de-nova";
import { ANNEE_N, ANNEE_N_PLUS_1 } from "../../src/config/cours/monde/nova-capacite";
import { novaEnN, previsionDeNPlus1 } from "../../src/config/cours/monde/prevision-des-ventes";
import { methodeABC } from "../../src/config/cours/monde/couts-par-activites";
import { CHARGES_FIXES_DU_MOIS, GAMME_DE_NOVA, MARCHE_DES_ENCEINTES, NOVA_GESTION, VENTES_A_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { compteDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "../../src/config/cours/monde/exercice-de-nova";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { EQUIPE as EQUIPE_DE_MAILLE } from "../../src/config/cours/monde/maille-et-co";
import { L_USINE_DE_NOVA } from "../../src/config/cours/monde/nova-usine";
import { HEURES_LEGALES_PAR_MOIS, paieDUnOperateur, SMIC_HORAIRE_BRUT, SMIC_MENSUEL_BRUT, TAUX_PATRONAL } from "../../src/config/cours/monde/ressources-humaines-de-nova";
import { insecables } from "@/lib/typographie";
import { PRIX_DE_MARCHE_DE_L_ENCEINTE, chargesDeLAtelier, coutCibleDeLaGo, coutStandardDeLEnceinte, extractionDuMois, fixesDesCentres, reportingDuTrimestre } from "../../src/config/cours/monde/centres-de-nova";
import { coutCompletDuMois, coutCompletRationnel, tableauDeBord } from "../../src/config/cours/monde/couts-et-budgets";
import { SANS_STOCK, VENTES_PREVUES_APRES_JUIN, tresorerieAvecLeStock } from "../../src/config/cours/monde/budgets-operationnels";
import { budgetDeTresorerie } from "../../src/config/cours/monde/couts-et-budgets";
import { bilanDOuverture, realiseDuPlan } from "../../src/config/cours/monde/equilibre-de-tresorerie";
import { EQUIPEMENT, LIVRAISONS_DU_MOIS, PLACEMENT } from "../../src/config/cours/monde/exercice-de-nova";
import { moisAleatoireDeLaFiche, seuilAleatoire } from "../../src/config/cours/monde/seuil-aleatoire";
import { anneeDeProduction, coutsDeLaQualite } from "../../src/config/cours/monde/capacite";
import { defautsDePoids, paretoDesDefauts } from "../../src/config/cours/monde/qualite-de-la-ligne";
import { chaineDeValeur, chargesDeLAtelierParNature, durabiliteDuSalaire, trimestreAuPrix } from "../../src/config/cours/monde/organisation-du-controle";
import { budgetDActivite, budgetsParCentre, commandesDuMois, navette, reseauDesBudgets } from "../../src/config/cours/monde/demarche-budgetaire";
import { investissementDeLaFiche, repartitionDesCentres, trimestreDeDecision } from "../../src/config/cours/monde/couts-et-budgets";
import { COMMANDES_DE_JANVIER } from "../../src/config/cours/monde/couts-par-activites";
import { formeCanonique as formeDuProgramme, laGoServieDAbord, programmeOptimal, valeurDUneHeureDePlus } from "../../src/config/cours/monde/programmation-de-nova";
import { planSousFacteurRare } from "../../src/config/cours/monde/couts-et-budgets";
import { COMMANDES_D_AUJOURD_HUI, PRIX_DU_JEU, consommationDeNPlus1, consommationDuDelai } from "../../src/config/cours/monde/approvisionnement-de-nova";
import { anneeAvec, ficheDeNova, kitsDuTrimestre } from "../../src/config/cours/monde/production-et-logistique";
import { ELECTRO_COMPOSANTS, FACTURES_DE_COMPOSANTS_HT } from "../../src/config/cours/monde/exercice-de-nova";
import { VENTES_LISSEES, correlationBrute, serieCVS } from "../../src/config/cours/monde/correlation-et-lissage";
import { ajustementLineaire, coefficientsSaisonniers } from "../../src/config/cours/monde/prevision-des-ventes";
import { tresorerieAOptimiser } from "../../src/config/cours/monde/tresorerie-a-optimiser";
import { affecter, beneficeAAffecter } from "../../src/config/cours/monde/affectation-du-resultat";
import { augmentationDeCapital } from "../../src/config/cours/monde/comptabilite-approfondie";
import { bilanDuLycee } from "../../src/config/cours/monde/comptes-du-lycee";
import { financer } from "../../src/config/cours/chapitres/financer-l-entreprise";
import { factureDeCampusTech, fondsDeRoulement } from "../../src/config/cours/chapitres/fonds-de-roulement-et-tresorerie";
import { INVESTISSEMENT_DE_LA_GAMME, structureDeNova } from "../../src/config/cours/monde/structure-financiere";
import { B, FACTURE_DE_DECEMBRE, garantieSurSonora } from "../../src/config/cours/monde/financer-et-placer";
import { CONDITIONS_DE_LA_BANQUE } from "../../src/config/cours/monde/equilibre-de-tresorerie";
import { cloture } from "../../src/config/cours/monde/cloture";
import { BANC, EMPRUNT_DE_LA_LIGNE, EMPRUNT_DU_PLAN_EQUILIBRE, LIGNE_A_FINANCER, RESERVE_DE_LA_GAMME, TAUX_DE_L_IMPOT, fluxDeLEmprunt, planDeFinancementDeLaGamme } from "../../src/config/cours/monde/financement-de-la-gamme";
import { PRET_BANCAIRE, remboursements } from "../../src/config/cours/monde/financement-du-lycee";
import { fluxDuProjet } from "../../src/config/cours/monde/finance";
import { PROJET_LIGNE_SEMI_AUTOMATIQUE } from "../../src/config/cours/monde/projets-et-financement";
import { CONTRAT_DE_PRET, IMPOT_SUR_LES_SOCIETES } from "../../src/config/cours/monde/exercice-de-nova";
import { INVESTISSEMENT_ENVISAGE } from "../../src/config/cours/monde/nova-gestion";
import { PAIEMENT_ECHELONNE, RENOUVELLEMENT, RESERVE_PLACEE, TAUX_DE_LA_BANQUE, interetsCourusDeLaReserve } from "../../src/config/cours/monde/valeur-et-temps";
import { EMETTEUR, PLACEMENT_SANS_RISQUE, RENTABILITE_EXIGEE } from "../../src/config/cours/monde/marche-financier";
import { DETTES_DU_31_DECEMBRE, EMPRUNT_DE_N_PLUS_1, PRIX_DE_L_ACTION, augmentationVueParLesActionnaires, coutDuCreditBail, coutParLeDividendeEnProgression, tableauDeLEmprunt } from "../../src/config/cours/monde/couts-de-financement";
import { AUGMENTATION_DE_CAPITAL } from "../../src/config/cours/monde/comptabilite-approfondie";
import { comparaison } from "../../src/config/cours/monde/financement-de-la-gamme";
import { TAUX_D_ACTUALISATION_DE_NOVA } from "../../src/config/cours/monde/projets-et-financement";
import { ANNEE_TYPE, DELAIS_DE_LA_FICHE, besoinAuBilan, bfrNormatif } from "../../src/config/cours/monde/bfr-normatif";
import { APPORT_DE_LA_BUSINESS_ANGEL, BESOIN_EXTERNE, engagementBancaire, engagementsEnCours } from "../../src/config/cours/monde/acteurs-du-financement";
import { BESOIN_DE_FONDS } from "../../src/config/cours/monde/comptabilite-approfondie";
import { DELAI_DE_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, DELAI_CONVENU_DE_CAMPUSTECH, PRIX_DE_L_ENCEINTE } from "../../src/config/cours/monde/nova-gestion";
import { CADRE_DE_LA_NEGOCIATION, MAGASINS_DE_CAMPUSTECH, referencementDeNova } from "../../src/config/cours/monde/referencement-de-nova";

/**
 * UNE SEULE NOVA DANS LE MONDE DU COURS (réconciliation d'octobre 2026). Les fiches qui disent la
 * demande et la capacité de NOVA disent les mêmes chiffres :
 *   · la droite de demande de nova-gestion.ts donne, à 59 €, les enceintes vendues au premier
 *     trimestre de N (exercice-de-nova.ts, nova-capacite.ts), ce que la ligne a fabriqué ;
 *   · toute la demande de N a été servie : chaque trimestre de N tient dans la ligne ;
 *   · le trimestre type du marché à trois donne à NOVA, à 59 €, cette même demande ;
 *   · les clientèles de la mercatique refont la droite, et le marché à trois est fait des ventes des
 *     trois enseignes sur le marché de toutes les enceintes, de janvier à mars ;
 *   · UNE SEULE PAIE (lot M6) : les opérateurs de l'atelier sont les salariés de la paie de l'exercice,
 *     aux taux du chapitre « La paie » ; les charges fixes du contrôle de gestion, le personnel du
 *     compte de résultat, le cas figé et les chapitres de ressources humaines disent le même coût.
 */

const T1_DE_N = [0, 1, 2].reduce((t, m) => t + VENTES_AUX_PARTICULIERS[m]! + VENTES_A_CAMPUSTECH[m]!, 0);

describe("une seule NOVA, d'une fiche à l'autre", () => {
  it("à 59 €, la droite de demande donne les 4 778 enceintes vendues et fabriquées au premier trimestre de N", () => {
    expect(T1_DE_N).toBe(4_778);
    expect(demandeAuPrix(MERCATIQUE_DE_NOVA, 59)).toBe(T1_DE_N);
    expect(ANNEE_N.demande[0]).toBe(T1_DE_N);
    expect(NOVA_GESTION.decision.production).toBe(T1_DE_N);
  });

  it("toute la demande de N a été servie : chaque trimestre tient dans la ligne, et la saison refait la demande de chaque trimestre à 59 €", () => {
    for (const d of ANNEE_N.demande) expect(d).toBeLessThanOrEqual(NOVA_GESTION.decision.capacite);
    expect(demandeAuPrix(MERCATIQUE_DE_NOVA, 59, 4)).toBe(ANNEE_N.demande[3]);
    expect(coefficientDeSaison(MERCATIQUE_DE_NOVA, 4)).toBe(ANNEE_N.demande[3]! / ANNEE_N.demande[0]!);
  });

  it("le trimestre type du marché à trois donne à NOVA, à 59 €, la demande de la droite", () => {
    const a = anneeDuMarche(MARCHE_A_TROIS);
    for (const t of a.nova.trimestres) expect(t.demande).toBe(demandeAuPrix(MERCATIQUE_DE_NOVA, 59));
    expect(a.nova.offre.prix).toBe(NOVA_GESTION.decision.prix);
  });

  it("les clientèles refont la droite, et le marché à trois est fait des ventes des trois enseignes de janvier à mars", () => {
    const k = MERCATIQUE_DE_NOVA.clienteles;
    expect(k.reduce((t, x) => t + x.demandeAPrixNul, 0)).toBe(NOVA_GESTION.decision.demande.aPrixNul);
    expect(k.reduce((t, x) => t + x.perdueParEuro, 0)).toBe(NOVA_GESTION.decision.demande.perdueParEuro);
    // À l'arrondi près des ventes de SoundBox et d'Auris, tirées des proportions du marché à trois.
    expect(Math.abs(MARCHE_A_TROIS.marche.parTrimestre - marcheEtPart(MERCATIQUE_DE_NOVA).ventesDesTrois)).toBeLessThanOrEqual(1);
  });
});

describe("une seule paie de NOVA, d'une fiche à l'autre", () => {
  it("4 opérateurs à 1 875 € bruts font les 7 500 € de la paie ; 42 % de cotisations patronales partout", () => {
    const o = NOVA_CAPACITE.operateurs;
    expect(o.nombre).toBe(PAIE_DU_MOIS.effectif);
    expect(NOVA_CAPACITE.plan.operateurs).toBe(PAIE_DU_MOIS.effectif);
    expect(o.nombre * o.salaireBrutMensuel).toBe(PAIE_DU_MOIS.brut);
    expect(o.tauxDesCotisationsPatronales).toBeCloseTo(TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite, 12);
  });

  it("le personnel coûte 10 650 € par mois au contrôle de gestion, 127 800 € au compte de résultat, autant au cas figé et aux ressources humaines", () => {
    const cout = PAIE_DU_MOIS.brut * (1 + TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite);
    expect(CHARGES_FIXES_DU_MOIS.personnel).toBe(cout);
    expect(compteDuLycee(exerciceDe("nova")).personnel).toBe(12 * cout);
    const cas = CAS_DES_ENTREPRISES.nova!.personnel;
    expect([cas.effectif, cas.brut, cas.cout, cas.tauxSalarial, cas.tauxPatronal]).toEqual([
      PAIE_DU_MOIS.effectif,
      PAIE_DU_MOIS.brut,
      cout,
      TAUX_DE_LA_PAIE.salarialUrssaf + TAUX_DE_LA_PAIE.salarialRetraite,
      TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite,
    ]);
    const p = paieDUnOperateur();
    expect([p.effectif * p.brut, p.effectif * p.cout]).toEqual([PAIE_DU_MOIS.brut, cout]);
  });
});

describe("aucun salaire horaire du monde sous le SMIC du cours", () => {
  it("le SMIC du cours : 12,31 € de l'heure, 1 867,02 € pour 151,67 heures", () => {
    expect(SMIC_HORAIRE_BRUT).toBe(12.31);
    expect(HEURES_LEGALES_PAR_MOIS).toBe(Math.round((35 * 52 * 100) / 12) / 100);
    // 12,31 × 35 × 52 ÷ 12 (et non × 151,67 arrondi, qui donnerait 1 867,06 €).
    expect(Math.round(((12.31 * 35 * 52) / 12) * 100) / 100).toBe(SMIC_MENSUEL_BRUT);
  });

  it("les opérateurs de NOVA : 1 875 € pour 151,67 heures payées, 12,36 € de l'heure, sans heures supplémentaires", () => {
    const o = NOVA_CAPACITE.operateurs;
    expect(o.heuresPayeesParMois).toBe(HEURES_LEGALES_PAR_MOIS);
    expect(o.heuresParMois).toBeLessThanOrEqual(o.heuresPayeesParMois);
    expect(o.salaireBrutMensuel / o.heuresPayeesParMois).toBeGreaterThanOrEqual(SMIC_HORAIRE_BRUT);
    expect(Math.round((1_875 / 151.67) * 100) / 100).toBe(12.36);
    // Le salaire du marché reste au-dessus du SMIC mensuel, et le seuil de démission (95 %) aussi
    // pour N + 1, l'année des décisions. En N, le seuil (1 852,50 €) passe sous le SMIC de juin 2026 :
    // ce n'est qu'un repère de comportement, aucun salaire payé n'y descend (1 875 €, plus haut).
    const m = NOVA_CAPACITE.personnel.salaireDuMarche;
    expect(Math.min(m.n, m.nPlus1)).toBeGreaterThanOrEqual(SMIC_MENSUEL_BRUT);
    expect(m.nPlus1 * 0.95).toBeGreaterThanOrEqual(SMIC_MENSUEL_BRUT);
  });

  it("l'équipe de Maille & Co : chaque salarié, au prorata de ses heures, au moins au SMIC", () => {
    for (const s of EQUIPE_DE_MAILLE) {
      const heuresDuMois = Math.round((s.heuresParSemaine * 52 * 100) / 12) / 100;
      expect(s.brutMensuel / heuresDuMois, s.code).toBeGreaterThanOrEqual(SMIC_HORAIRE_BRUT);
    }
  });

  it("la main-d'œuvre de l'usine : ses taux horaires chargés, ramenés au brut, au-dessus du SMIC", () => {
    for (const t of [L_USINE_DE_NOVA.tauxHoraireStandard, L_USINE_DE_NOVA.realise.mainDOeuvre.tauxHoraire]) {
      expect(t / (1 + TAUX_PATRONAL)).toBeGreaterThanOrEqual(SMIC_HORAIRE_BRUT);
    }
  });
});

describe("une seule publicité de NOVA, d'un chapitre à l'autre (audit pédagogique, P0-2)", () => {
  // Le coût par produit et le cas figé donnent à NOVA en gamme sa publicité, par référence ; aucun
  // chapitre ne dit plus « NOVA ne fait pas de publicité » : le premier exercice est sans campagne,
  // la gamme en a une, et les chapitres du lycée disent les deux.
  const PUB = GAMME_DE_NOVA.references.reduce((t, r) => t + r.publicite, 0);
  const textes = (code: string) => JSON.stringify(servirLeChapitre(CHAPITRES.find((c) => c.code === code)!, casDeLEntreprise("nova")));

  it("la gamme fait 1 999 € de publicité par mois, ce que le cas figé arrondit à 2 000 €", () => {
    expect(PUB).toBe(1_999);
    expect(Math.abs(CAS_DES_ENTREPRISES.nova!.marche.marketing - PUB)).toBeLessThanOrEqual(1);
  });

  it.each(["ce-que-rapporte-la-communication", "decider-avec-des-chiffres"])("%s dit la publicité de la gamme, et jamais que NOVA n'en fait pas", (code) => {
    const t = textes(code);
    expect(t).not.toMatch(/ne fait pas de publicité/);
    expect(t).toContain(insecables(`${montantEcrit(PUB)} par mois`));
  });

  it("aucun chapitre ni cas ne dit que NOVA ne fait pas de publicité", () => {
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      if (c.entreprises && !c.entreprises.codes.includes("nova")) continue;
      expect(JSON.stringify(servirLeChapitre(c, casDeLEntreprise("nova"))), c.code).not.toMatch(/NOVA ne fait (?:pas|aucune) (?:de )?publicité/);
    }
  }, 60_000);
});

/**
 * UNE SEULE NOVA DANS LA COMPTABILITÉ DE GESTION (le coût complet pas à pas, la concordance) : les
 * douze mois de la gestion lisent les livraisons, les achats, le chiffre d'affaires, le loyer et la
 * paie de l'exercice ; la fiche de stock de décembre est celle de la clôture, au seul bon du 24 près ;
 * et le tableau de passage retrouve le résultat net de la clôture, sans second jeu de chiffres.
 */
describe("une seule NOVA, de la comptabilité de gestion à la clôture", () => {
  const k = concordance();
  const s = k.cg.soldes;
  it("les douze mois de la gestion font les achats, les ventes, les autres charges, le loyer et la paie des comptes", () => {
    const mois = k.exercice.mois;
    const somme = (f: (m: (typeof mois)[number]) => number) => Math.round(mois.reduce((t, m) => t + f(m), 0) * 100) / 100;
    expect(somme((m) => m.achats)).toBe(s["601"]);
    expect(somme((m) => m.chiffreDAffaires)).toBe(-s["701"]!);
    expect(somme((m) => m.autres)).toBe(s["606"]);
    expect(somme((m) => m.repartition.charges.loyer)).toBe(s["6132"]);
    expect(somme((m) => m.repartition.charges.personnel)).toBe(s["641"]! + s["645"]!);
    expect(somme((m) => m.repartition.charges.assurance)).toBe(s["616"]);
    expect(mois.map((m) => m.repartition.charges.personnel)).toEqual(mois.map(() => CHARGES_FIXES_DU_MOIS.personnel));
  });

  it("la fiche de décembre de la gestion est celle de la clôture, au bon du 24 près, et l'inventaire compte le stock des comptes", () => {
    const fiche = k.stockDeGestion.fiche;
    const sorties = (f: typeof COMPOSANTS_DE_DECEMBRE) => f.mouvements.filter((m) => m.sens === "sortie").map((m) => m.quantite);
    expect(sorties(fiche)).toEqual(sorties(COMPOSANTS_DE_DECEMBRE).map((q, i) => (i === 1 ? q + JEUX_REVENUS_SANS_BON : q)));
    expect(fiche.mouvements.filter((m) => m.sens === "entree").map((m) => m.quantite)).toEqual(COMPOSANTS_DE_DECEMBRE.mouvements.filter((m) => m.sens === "entree").map((m) => m.quantite));
    expect(k.stockGeneral).toBe(CLOTURE_DE_LA_FICHE.travaux.stockFinal);
    expect(k.stockPhysique.quantite - k.stockDeGestion.final.quantite).toBe(JEUX_REVENUS_SANS_BON);
  });

  it("le tableau de passage retrouve le résultat net de la clôture, au centime", () => {
    expect(k.resultatRetrouve).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(k.dotation).toBe(CLOTURE_DE_LA_FICHE.travaux.dotationAuxAmortissements);
    expect(k.usureDeGestion).toBe(12 * CHARGES_FIXES_DU_MOIS.amortissement);
  });
});

/**
 * UNE SEULE NOVA DANS SES DEUX CENTRES (piloter un centre) : l'atelier et le service commercial se
 * partagent les charges fixes du mois et le coût complet de janvier ; leurs résultats refont, mois par
 * mois, celui du tableau de bord ; le prix de marché est le sous-traitant de la fiche, et la Go du coût
 * cible est celle de la gamme.
 */
describe("une seule NOVA, des deux centres au tableau de bord", () => {
  it("les charges fixes des centres font celles du mois, et l'atelier porte le coût de production du coût complet", () => {
    const k = fixesDesCentres(NOVA_GESTION);
    expect(Math.round((k.atelier + k.commercial) * 100) / 100).toBe(CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement);
    expect(chargesDeLAtelier(NOVA_GESTION, NOVA_GESTION.moisDeReference.quantite).total).toBe(coutCompletDuMois(NOVA_GESTION).coutDeProduction);
    const rationnel = coutCompletRationnel(NOVA_GESTION);
    expect(coutStandardDeLEnceinte(NOVA_GESTION)).toBe(Math.round((rationnel.coutDeProduction / rationnel.quantite) * 100) / 100);
  });

  it("chaque mois du trimestre, l'atelier et le service commercial refont le résultat et les ventes du tableau de bord", () => {
    const bord = tableauDeBord(NOVA_GESTION).mois;
    for (const m of reportingDuTrimestre(NOVA_GESTION).mois) {
      expect(m.nova, m.nom).toBe(bord[m.indice]!.resultat);
      expect(m.leviers.quantite, m.nom).toBe(bord[m.indice]!.quantite);
    }
    expect(extractionDuMois(NOVA_GESTION).quantite).toBe(bord[1]!.quantite);
  });

  it("le prix de marché est le sous-traitant de la fiche, et la Go du coût cible est celle de la gamme", () => {
    expect(PRIX_DE_MARCHE_DE_L_ENCEINTE).toBe(NOVA_GESTION.decision.coutDuSousTraitant);
    const go = GAMME_DE_NOVA.references.find((r) => r.code === "go")!;
    const k = coutCibleDeLaGo();
    expect([k.prix, k.coutRetenu, k.coutCible]).toEqual([go.prix, go.coutVariableUnitaire, go.coutVariableUnitaire]);
  });
});

/**
 * UNE SEULE NOVA DANS LA PRÉVISION DES VENTES ET LA MÉTHODE ABC (BTS CG P5). La prévision de N + 1,
 * arrondie à la centaine, est la demande de N + 1 des chapitres de la capacité ; elle part des ventes
 * de N et du marché du semestre de nova-gestion.ts. La méthode ABC range les charges de janvier de la
 * comptabilité de gestion, au centime, et la compare au coût des mêmes centres d'analyse.
 */
describe("une seule NOVA, de la prévision des ventes à la capacité, et de la méthode ABC aux centres d'analyse", () => {
  it("la prévision de N + 1, à la centaine, est la demande de N + 1 de la capacité ; elle part des ventes et du marché de N", () => {
    const p = previsionDeNPlus1();
    expect(p.trimestres.map((t) => t.plan)).toEqual(ANNEE_N_PLUS_1.demande);
    expect(novaEnN().ventes).toEqual(ANNEE_N.demande);
    expect(novaEnN().marche.slice(0, 2)).toEqual([0, 3].map((m) => MARCHE_DES_ENCEINTES.slice(m, m + 3).reduce((t, x) => t + x, 0)));
    expect(p.capacite).toBe(NOVA_GESTION.decision.capacite);
  });

  it("la méthode ABC range les 35 383 € de janvier des centres d'analyse, sur les enceintes livrées en janvier", () => {
    const m = methodeABC();
    const janvier = moisDeGestion(0);
    expect(m.total).toBe(janvier.repartition.total);
    expect(m.charges).toEqual(janvier.repartition.charges);
    const produits = Object.values(m.produits);
    expect(produits.reduce((t, p) => t + p.vente.enceintes, 0)).toBe(janvier.livrees);
    expect(produits.reduce((t, p) => t + p.chiffreDAffaires, 0)).toBe(janvier.chiffreDAffaires);
    for (const p of produits) expect(Math.round(p.centres.unitaire * 100) / 100).toBe(Math.round(janvier.coutDeRevientUnitaire * 100) / 100);
    expect(m.activites.find((a) => a.code === "monter")!.volume).toBe(janvier.livrees * NOVA_CAPACITE.operateurs.heuresParEnceinte);
  });
});

/**
 * UNE SEULE NOVA DANS LES BUDGETS DU SEMESTRE (des ventes aux achats, équilibrer la trésorerie) : sans
 * stock, les budgets opérationnels refont au centime le budget de trésorerie du chapitre « Le budget de
 * trésorerie » ; les ventes prévues après juin sont les livraisons de l'exercice ; le bilan d'ouverture
 * des états prévisionnels est celui de la création ; le relevé de janvier du suivi est le compte
 * courant de l'exercice.
 */
describe("une seule NOVA, des budgets opérationnels aux états prévisionnels", () => {
  it("sans stock, les budgets opérationnels retombent sur le budget de trésorerie, mois par mois", () => {
    const sansStock = tresorerieAvecLeStock(NOVA_GESTION, SANS_STOCK);
    const budget = budgetDeTresorerie(NOVA_GESTION);
    expect(sansStock.mois).toEqual(budget.mois);
    expect(sansStock.fin).toEqual(budget.fin);
    expect(VENTES_PREVUES_APRES_JUIN).toEqual([LIVRAISONS_DU_MOIS[6], LIVRAISONS_DU_MOIS[7]]);
  });

  it("le bilan d'ouverture est la création : l'apport et le prêt font la ligne TTC, le placement et la trésorerie de départ", () => {
    const o = bilanDOuverture(NOVA_GESTION);
    expect(o.passif.capital + o.passif.emprunt).toBe(EQUIPEMENT.ttc + PLACEMENT.montant + NOVA_GESTION.semestre.tresorerieDeDepart);
    expect(o.actif.ligne + o.actif.tvaDeLaLigne).toBe(EQUIPEMENT.ttc);
  });

  it("le relevé de janvier du suivi est le compte courant de l'exercice, 58 959,27 €", () => {
    expect(realiseDuPlan(NOVA_GESTION).mois[0]!.realise).toBe(58_959.27);
  });
});

/**
 * UNE SEULE NOVA EN AVENIR ALÉATOIRE ET DANS LA QUALITÉ (DCG UE 11) : le seuil probabilisé est celui du
 * mois de janvier du seuil de rentabilité, l'espérance des ventes est la vente du mois, et l'espérance
 * du résultat est son résultat ; les défauts que pilote « Piloter la qualité » sont ceux de la fiche de
 * capacité, au budget de prévention actuel, et le défaut de poids n'en est qu'une part.
 */
describe("une seule NOVA, du seuil de rentabilité au seuil probabilisé, et de la non-qualité au pilotage de la qualité", () => {
  it("l'espérance des ventes est la vente de janvier, et l'espérance du résultat son résultat", () => {
    const x = seuilAleatoire(moisAleatoireDeLaFiche(NOVA_GESTION));
    const m = NOVA_GESTION.moisDeReference;
    expect(x.moyenne).toBe(m.quantite);
    expect(x.prix).toBe(m.prix);
    expect(x.chargesFixes).toBe(m.chargesFixes.loyer + m.chargesFixes.personnel + m.chargesFixes.amortissement);
    expect(x.resultat.esperance).toBe(tableauDeBord(NOVA_GESTION).mois[0]!.resultat);
  });

  it("les défauts du Pareto sont ceux de la fiche de capacité, et le défaut de poids en est une part", () => {
    const q = coutsDeLaQualite(NOVA_CAPACITE, { volume: anneeDeProduction(NOVA_CAPACITE).production });
    const p = paretoDesDefauts(NOVA_CAPACITE);
    expect(p.total).toBe(q.defauts);
    expect(p.causes.reduce((t, k) => t + k.nombre, 0)).toBe(q.defauts);
    expect(defautsDePoids(NOVA_CAPACITE).nombre).toBeLessThan(q.defauts);
  });
});

/**
 * UNE SEULE NOVA DANS LA DCG UE11 2025 (la masse salariale, le coût cible et les coûts cachés, les
 * indicateurs de durabilité) : la masse salariale de N est celle de la paie et des comptes ; le départ
 * et le cinquième opérateur de N + 1 sont ceux des chapitres de ressources humaines ; aucun salaire ne
 * descend sous le SMIC ; la Go et son coût cible sont ceux de « Piloter un centre » ; les coûts cachés
 * relisent le départ, les absences et la qualité de N + 1 ; le tableau de bord durable porte, mois par
 * mois, les ventes et le résultat du tableau de bord.
 */
describe("une seule NOVA, de la paie au budget de la masse salariale, du coût cible aux coûts cachés, du tableau de bord à la durabilité", async () => {
  const M = await import("../../src/config/cours/monde/masse-salariale-de-nova");
  const V = await import("../../src/config/cours/monde/valeur-et-couts-caches");
  const D = await import("../../src/config/cours/monde/tableau-de-bord-durable");
  const RH = await import("../../src/config/cours/monde/ressources-humaines-de-nova");
  const K = await import("../../src/config/cours/monde/capacite");

  it("la masse de N est la paie de l'exercice et les comptes 641 et 645 ; le départ et la recrue sont ceux des ressources humaines", () => {
    expect(M.EFFECTIF_DE_DECEMBRE_N * M.SALAIRE_DE_DECEMBRE_N).toBe(PAIE_DU_MOIS.brut);
    expect(M.budgetDeLaMasse().chargeeDeN).toBe(RH.masseSalarialeDeN().masseDuCompte);
    expect(M.DEPART.dernierMois).toBe(K.departDeLaFiche(RH.FICHE_RH).dernierMois);
    expect(M.DEPART.arriveeDuRemplacant).toBe(RH.indicateursDeNPlus1().arrivee);
    expect(M.ARRIVEE_DU_CINQUIEME).toBe(RH.recrutementDeNPlus1().arrivee);
    expect(M.SALAIRE_D_EMBAUCHE).toBe(Math.ceil(RH.FICHE_RH.personnel.salaireDuMarche.nPlus1 * RH.FICHE_RH.personnel.seuilDeDemission));
  });

  it("aucun salaire du budget ni du réalisé ne descend sous le SMIC horaire", () => {
    for (const h of [M.HYPOTHESES_DU_BUDGET, M.HYPOTHESES_DU_REALISE]) expect(M.plusBasSalaireDeLAnnee(h) / HEURES_LEGALES_PAR_MOIS).toBeGreaterThanOrEqual(SMIC_HORAIRE_BRUT);
  });

  it("le coût cible est celui de « Piloter un centre », et l'enquête retrouve le prix de la Go de la gamme", () => {
    expect(V.coutCibleDeLaGo()).toEqual(coutCibleDeLaGo());
    const go = GAMME_DE_NOVA.references.find((r) => r.code === "go")!;
    expect(V.acceptabiliteDesPrix().prix).toBe(go.prix);
    expect(V.valeurDeLaGoLancee().total).toBe(go.coutVariableUnitaire);
  });

  it("les coûts cachés relisent le départ, les absences et la qualité de N + 1, et la masse chargée des comptes", () => {
    const k = V.coutsCachesDeNPlus1();
    expect(k.parDysfonctionnement.rotation).toBe(K.departDUnSalarie(RH.FICHE_RH).coutDuDepart);
    const q = K.coutsDeLaQualite(RH.FICHE_RH);
    expect(k.parDysfonctionnement.nonQualite).toBe(Math.round((q.nonQualite + q.margePerdue) * 100) / 100);
    expect(k.rattrapees + k.perdues).toBe(RH.indicateursDeNPlus1().heuresDAbsence);
    expect(k.masseChargee).toBe(RH.masseSalarialeDeN().masseDuCompte);
    expect(V.chmcv().production).toBe(K.anneeDeProduction(RH.FICHE_RH).production);
  });

  it("le tableau de bord durable porte, mois par mois, les ventes, le chiffre d'affaires et le résultat du tableau de bord", () => {
    const bord = tableauDeBord(NOVA_GESTION);
    const t = D.tableauDeBordDurable(NOVA_GESTION);
    for (const [i, m] of t.mois.entries()) {
      expect(m.quantite, m.nom).toBe(bord.mois[i]!.quantite);
      expect(m.financier.chiffreDAffaires, m.nom).toBe(bord.mois[i]!.chiffreDAffaires);
      expect(m.resultat, m.nom).toBe(bord.mois[i]!.resultat);
      expect(m.heuresPayees, m.nom).toBe(Math.round(PAIE_DU_MOIS.effectif * HEURES_LEGALES_PAR_MOIS * 100) / 100);
      expect(m.valeurs.delaiFournisseurs, m.nom).toBe(NOVA_GESTION.semestre.fournisseur.delai);
    }
    expect(t.semestre.resultat).toBe(bord.semestre.resultat);
  });
});

/**
 * UNE SEULE NOVA DANS L'ORGANISATION DU CONTRÔLE ET LA DÉMARCHE BUDGÉTAIRE (DCG UE11) : le trimestre au
 * prix de la fiche est le trimestre de décision ; les charges de l'atelier, rangées par nature, refont
 * celles du chapitre « Piloter un centre » ; la chaîne de valeur range les charges fixes du coût complet ;
 * la paie des opérateurs est le personnel des charges fixes ; le réseau des budgets est celui de « Des
 * ventes aux achats » sans stock ; la navette sans demande est le budget de trésorerie ; le budget
 * d'activité part des commandes de janvier de la méthode ABC.
 */
describe("une seule NOVA, de l'organisation du contrôle à la démarche budgétaire", () => {
  it("le trimestre au prix de la fiche est le trimestre de décision, et les charges de l'atelier sont celles de « Piloter un centre »", () => {
    expect(trimestreAuPrix(NOVA_GESTION).resultat).toBe(trimestreDeDecision(NOVA_GESTION).resultat);
    expect(trimestreAuPrix(NOVA_GESTION).ventes).toBe(NOVA_GESTION.decision.production);
    const a = chargesDeLAtelierParNature(NOVA_GESTION);
    expect(a.nonMaitrisables).toBe(fixesDesCentres(NOVA_GESTION).atelier);
    expect(a.total).toBe(chargesDeLAtelier(NOVA_GESTION, a.quantite).total);
    expect(chaineDeValeur(NOVA_GESTION).total).toBe(repartitionDesCentres(NOVA_GESTION).total);
    const s = durabiliteDuSalaire();
    expect(s.salaire * s.operateurs * (1 + s.tauxPatronal)).toBe(CHARGES_FIXES_DU_MOIS.personnel);
  });

  it("le réseau des budgets est celui de « Des ventes aux achats », la navette du banc d'avril sans publicité le budget de trésorerie, le budget d'activité la méthode ABC", () => {
    const r = reseauDesBudgets(NOVA_GESTION);
    const sansStock = tresorerieAvecLeStock(NOVA_GESTION, SANS_STOCK);
    expect(r.tresorerieFin).toBe(sansStock.tresorerieFin);
    expect(r.plusBas).toEqual(sansStock.plusBas);
    expect(navette(NOVA_GESTION, { moisDuBanc: 3, publicite: 0 }).tresorerieFin).toBe(budgetDeTresorerie(NOVA_GESTION, { investissement: investissementDeLaFiche(NOVA_GESTION) }).tresorerieFin);
    expect(budgetsParCentre(NOVA_GESTION).total).toBe(6 * (CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement));
    expect(commandesDuMois(NOVA_GESTION, 0).total).toBe(COMMANDES_DE_JANVIER["en-ligne"].commandes + COMMANDES_DE_JANVIER.campustech.commandes);
    expect(budgetDActivite(NOVA_GESTION).coutDeJanvier).toBe(methodeABC().activites.find((x) => x.code === "commandes")!.cout);
  });
});

/**
 * UNE SEULE NOVA DANS LES TECHNIQUES PRÉVISIONNELLES DU DCG (programmer la production, approvisionner
 * au moindre coût, corrélation et lissage). Le programme linéaire part de la gamme et de son mois de
 * pointe, et retombe sans le banc sur le plan du facteur rare de « Coût par produit » ; les jeux achetés
 * en N + 1 sont la production de N + 1 des chapitres de la capacité, au prix et au délai du
 * fournisseur ; le lissage lit les ventes en ligne de l'exercice, la corrélation la droite de la
 * prévision des ventes.
 */
describe("une seule NOVA, de la programmation de la production aux approvisionnements et au lissage", () => {
  it("le programme linéaire part de la gamme ; sans le banc, il retombe sur le plan du facteur rare, la Go servie entière", () => {
    const f = formeDuProgramme();
    const ref = (code: string) => GAMME_DE_NOVA.references.find((r) => r.code === code)!;
    expect(f.contraintes[0]!.c).toBeCloseTo(GAMME_DE_NOVA.capaciteHeuresMachine - ref("go").demandeDuMoisDePointe * ref("go").heuresMachineParUnite, 9);
    expect(f.marge).toEqual({ x: ref("one").prix - ref("one").coutVariableUnitaire, y: ref("studio").prix - ref("studio").coutVariableUnitaire });
    const plan = planSousFacteurRare(NOVA_GESTION).plan;
    const quantite = (code: string) => plan.find((r) => r.code === code)!.quantite;
    const sansLeBanc = programmeOptimal({}, false).optimal;
    expect(sansLeBanc.y).toBe(quantite("studio"));
    expect(Math.floor(sansLeBanc.x)).toBe(quantite("one"));
    expect(laGoServieDAbord().unites).toBe(quantite("go"));
    const go = ref("go");
    expect((go.prix - go.coutVariableUnitaire) / go.heuresMachineParUnite).toBeGreaterThan(valeurDUneHeureDePlus("heures-machine").valeur);
  });

  it("les jeux de N + 1 sont la production de N + 1 de la capacité, au prix d'Électro-Composants, et la consommation du délai celle du stock de sécurité", () => {
    const f = ficheDeNova({ code: "nova" });
    const c = consommationDeNPlus1();
    expect(c.trimestres).toEqual(anneeAvec(f).trimestres.map((t) => t.production));
    expect(c.trimestres).toEqual(ANNEE_N_PLUS_1.demande.map((d) => Math.min(d, NOVA_GESTION.decision.capacite)));
    expect(PRIX_DU_JEU).toBe(ELECTRO_COMPOSANTS.prixDuJeu);
    expect(PRIX_DU_JEU).toBe(NOVA_GESTION.moisDeReference.coutVariable.composants);
    expect(consommationDuDelai().moyenne).toBe(kitsDuTrimestre(f, 1).pendantLeDelai);
    expect(COMMANDES_D_AUJOURD_HUI).toBe(FACTURES_DE_COMPOSANTS_HT.length);
  });

  it("le lissage lit les ventes en ligne de l'exercice ; la corrélation et la série CVS, la droite et les coefficients de la prévision des ventes", () => {
    expect(VENTES_LISSEES).toEqual(VENTES_AUX_PARTICULIERS);
    expect(correlationBrute().r).toBe(ajustementLineaire().r);
    expect(serieCVS().slice(0, 4).map((x) => x.coefficient)).toEqual(coefficientsSaisonniers("lineaire").coefficients);
  });
});

/**
 * UNE SEULE NOVA, DE LA TRÉSORERIE À L'AFFECTATION DU RÉSULTAT (Bac STMG gestion et finance, 3.2 et
 * 3.3) : la trésorerie à optimiser est celle du chapitre « Fonds de roulement », le compte à terme
 * celui de la fiche, la facture escomptée une facture de CampusTech ; le bénéfice affecté est celui du
 * compte de résultat du lycée, sa réserve légale celle de « L'augmentation de capital », et la
 * deuxième ligne celle de « Financer l'entreprise ».
 */
describe("une seule NOVA, de la trésorerie du 31 décembre à l'affectation du bénéfice", () => {
  const f = exerciceDe("nova");

  it("la trésorerie à optimiser est celle du bilan du lycée, et le compte à terme celui de la fiche", () => {
    const k = tresorerieAOptimiser(f);
    const b = fondsDeRoulement({ code: "nova" });
    expect(k.tresorerie).toBe(b.tresorerie);
    expect(k.banque).toBe(b.poste("banque"));
    expect(k.capitalPlace).toBe(PLACEMENT.montant);
    expect(k.facture.ttc).toBe(factureDeCampusTech(b));
    expect(k.besoinDeLAnnee).toBe(financer({ code: "nova" }).montant);
  });

  it("le bénéfice affecté est celui du lycée, la réserve légale celle de l'augmentation de capital", () => {
    const k = beneficeAAffecter(f);
    expect(k.benefice).toBe(compteDuLycee(f).resultatNet);
    expect(k.benefice).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(k.reserveLegale).toBe(augmentationDeCapital().reserveLegale);
    expect(k.caf).toBe(financer({ code: "nova" }).caf);
    // Sans dividende, l'affectation de « L'augmentation de capital » : tout reste dans les capitaux propres.
    const sans = affecter(k, { dividendeParAction: 0, reservesFacultatives: 0 });
    expect(sans.capitauxPropres).toBe(augmentationDeCapital().capitauxPropres);
    expect(affecter(k, { dividendeParAction: 2, reservesFacultatives: 0 }).capitauxPropres).toBe(bilanDuLycee(f, { dividende: 30_000 }).capitauxPropres);
  });
});

/**
 * UNE SEULE NOVA DANS LA STRUCTURE FINANCIÈRE ET LA TRÉSORERIE DE N+1 (ratios de structure et bilan
 * financier, financer et placer la trésorerie) : le bilan financier part du bilan comptable de la
 * clôture et retombe sur son total, moins-value latente ôtée ; la CAF et les ressources stables sont
 * celles des soldes intermédiaires et du bilan fonctionnel ; les échéances de l'année sont celles du
 * contrat de prêt ; la banque est celle du chapitre « Équilibrer la trésorerie » ; l'effet escompté est
 * la dernière facture de CampusTech du 31 décembre ; la perte de Sonora est celle que N+1 constate.
 */
describe("une seule NOVA, du bilan financier à la trésorerie de N+1", () => {
  it("le bilan financier retombe sur le bilan comptable de la clôture, moins-value latente ôtée", () => {
    const s = structureDeNova(EXERCICE_DE_NOVA);
    const k = cloture(EXERCICE_DE_NOVA);
    expect(s.financier.totalActif).toBe(Math.round((k.bilan.totalActif - s.financier.moinsValueLatente) * 100) / 100);
    expect(s.financier.totalPassif).toBe(s.financier.totalActif);
    expect(s.caf).toBe(k.caf.additive);
    expect(s.caf).toBe(k.caf.soustractive);
    expect(s.ressourcesStables).toBe(k.fonctionnel.ressourcesStables.total);
    expect(s.postes.resultat).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(s.financier.echeancesAMoinsDUnAn).toBe(4 * (CONTRAT_DE_PRET.capital / (CONTRAT_DE_PRET.dureeAns * CONTRAT_DE_PRET.echeancesParAn)));
    expect(s.postes.capitalRestantDu).toBe(68_000);
  });

  it("la trésorerie de N+1 : la banque du cours, la facture de CampusTech du 20 décembre, la perte de Sonora", () => {
    expect(B).toBe(CONDITIONS_DE_LA_BANQUE);
    const f = EXERCICE_DE_NOVA;
    expect(FACTURE_DE_DECEMBRE.ttc).toBe(Math.round(f.campustech.enceintesParFacture * f.prixDeLEnceinte * (1 + f.tauxDeTva) * 100) / 100);
    expect(FACTURE_DE_DECEMBRE.echeance).toEqual({ jour: 10, mois: 3, exercice: 1 });
    expect(garantieSurSonora().perteHt).toBe(Math.round(28_025 * (1 - EXERCICE_DE_NOVA.suites.sonora.partEncaissee) * 100) / 100);
    expect(INVESTISSEMENT_DE_LA_GAMME).toBe(PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs.reduce((t, a) => t + a.montant, 0));
  });
});

/**
 * UNE SEULE NOVA DANS LE FINANCEMENT DE LA GAMME (BTS CG P6, emprunt ou crédit-bail, le plan de
 * financement) : la ligne à financer est la ligne semi-automatique du projet B, la banque prête au
 * taux du prêt de l'exercice, l'impôt est le taux normal de la fiche, la réserve est le compte à
 * terme ; le tableau de l'emprunt est celui du prêt bancaire de « Financer autrement » ; la CAF du
 * plan sans emprunt et ses variations de BFR sont les flux de la gamme du chapitre « La VAN » ; le
 * banc du cas est celui du contrôle de gestion.
 */
describe("une seule NOVA, du choix du projet au plan de financement", () => {
  it("la ligne, la banque, l'impôt et la réserve sont ceux des autres chapitres de NOVA", () => {
    expect(LIGNE_A_FINANCER).toBe(PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs[0]);
    expect([LIGNE_A_FINANCER.montant, LIGNE_A_FINANCER.dureeDAmortissement]).toEqual([150_000, 6]);
    expect(EMPRUNT_DE_LA_LIGNE.taux).toBe(CONTRAT_DE_PRET.tauxAnnuel);
    expect(TAUX_DE_L_IMPOT).toBe(IMPOT_SUR_LES_SOCIETES.tauxNormal);
    expect(RESERVE_DE_LA_GAMME).toBe(PLACEMENT.montant);
    expect([BANC.montant, BANC.dureeDAmortissement * 12]).toEqual([INVESTISSEMENT_ENVISAGE.montantHt, INVESTISSEMENT_ENVISAGE.dureeDAmortissementMois]);
  });

  it("le tableau de l'emprunt de la ligne est celui du prêt bancaire de « Financer autrement »", () => {
    const pret = remboursements(PRET_BANCAIRE(EXERCICE_DE_NOVA), LIGNE_A_FINANCER.montant);
    expect(fluxDeLEmprunt(EMPRUNT_DE_LA_LIGNE).annees.map((a) => [a.interets, a.amortissement, a.annuite])).toEqual(pret.map((r) => [r.interets, r.capital, r.total]));
  });

  it("sans emprunt, la CAF du plan est le flux d'exploitation de la gamme, et ses variations de BFR celles du projet", () => {
    const projet = fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE);
    const plan = planDeFinancementDeLaGamme();
    expect(plan.annees.map((a) => a.caf)).toEqual(projet.annees.map((a) => a.fluxDExploitation));
    expect(plan.annees.map((a) => a.augmentationDuBfr - a.diminutionDuBfr)).toEqual(projet.variationsDuBfr.slice(0, plan.annees.length));
    expect(plan.annees[0]!.investissements).toBe(projet.investissement);
  });
});

/**
 * UNE SEULE NOVA DANS LES TABLEAUX DE FLUX (le tableau de financement, le tableau des flux de
 * trésorerie) : la CAF est celle des soldes intermédiaires, le fonds de roulement, le besoin et la
 * trésorerie ceux du bilan fonctionnel, les flux stables ceux de la fiche (l'apport, le prêt, la
 * ligne) ; la seconde ligne payée en décembre est celle de N + 1.
 */
describe("une seule NOVA, du bilan fonctionnel aux tableaux de flux", () => {
  it("la CAF, le fonds de roulement, le besoin et la trésorerie sont ceux de la clôture figée", () => {
    const t = tableauDeFinancement(EXERCICE_DE_NOVA);
    const fo = CLOTURE_DE_LA_FICHE.fonctionnel;
    expect(t.ressources.caf).toBe(CLOTURE_DE_LA_FICHE.capaciteDAutofinancement);
    expect(t.variationDuFondsDeRoulement).toBe(fo.fondsDeRoulement);
    expect(t.partie2.variationDExploitation).toBe(fo.besoinDExploitation);
    expect(t.partie2.variationHorsExploitation).toBe(fo.besoinHorsExploitation);
    expect(t.partie2.variationDeTresorerie).toBe(fo.tresorerieNette);
    expect(tableauDesFlux(EXERCICE_DE_NOVA).variationDeTresorerie).toBe(fo.tresorerieNette);
  });

  it("les flux stables sont ceux de la création et du prêt ; la variation du fonds de roulement depuis le 6 janvier, celle du chapitre du bilan fonctionnel", () => {
    const t = tableauDeFinancement(EXERCICE_DE_NOVA);
    const x = bilanDeLExercice({ code: "nova" });
    expect(t.ressources.augmentationDeCapital).toBe(EXERCICE_DE_NOVA.apport.montant);
    expect(t.ressources.nouveauxEmprunts).toBe(EXERCICE_DE_NOVA.pret.capital);
    expect(t.emplois.acquisitions).toBe(EQUIPEMENT.ht);
    expect(t.emplois.remboursements).toBe(x.rembourse);
    expect(t.variationDuFondsDeRoulement - x.creation.fondsDeRoulement).toBeCloseTo(x.variationDuFondsDeRoulement, 2);
  });

  it("la seconde ligne payée en décembre est la seconde ligne de N + 1, au même prix", () => {
    expect(SECONDE_LIGNE_PAYEE_EN_DECEMBRE.ht).toBe(SECONDE_LIGNE.ht);
    expect(SECONDE_LIGNE_PAYEE_EN_DECEMBRE.ht + SECONDE_LIGNE_PAYEE_EN_DECEMBRE.tva).toBe(EQUIPEMENT.ttc);
  });
});

/**
 * UNE SEULE NOVA DANS LA FINANCE DE LA DCG UE6 (la valeur et le temps, le marché financier, les coûts
 * de financement) : la réserve est le compte à terme de l'exercice, et ses intérêts courus ceux de la
 * clôture ; la ligne à remplacer est la première ligne ; le comptant du fournisseur est le prix de la
 * ligne semi-automatique, la banque prête au taux du prêt de NOVA ; l'émetteur coté est le fournisseur
 * de composants ; l'emprunt de N+1 est celui qui équilibre le plan de financement ; l'augmentation de
 * capital est celle de juin N+1 ; le crédit-bail coûte ce que son chapitre calcule ; l'exigence des
 * actionnaires par le dividende retombe sur le coût du capital de l'activité de NOVA.
 */
describe("une seule NOVA, de la valeur du temps au coût du capital", () => {
  it("la réserve, la ligne à remplacer, l'offre du fournisseur et la banque sont celles des autres chapitres de NOVA", () => {
    expect(RESERVE_PLACEE).toBe(PLACEMENT);
    expect(interetsCourusDeLaReserve()).toBe(CLOTURE_DE_LA_FICHE.travaux.interetsDuPlacement);
    expect([RENOUVELLEMENT.prixDAujourdHui, RENOUVELLEMENT.versements + 1]).toEqual([EQUIPEMENT.ht, EQUIPEMENT.dureeAns]);
    expect(PAIEMENT_ECHELONNE.comptant).toBe(LIGNE_A_FINANCER.montant);
    expect(TAUX_DE_LA_BANQUE).toBe(CONTRAT_DE_PRET.tauxAnnuel);
  });

  it("le marché se lit par le fournisseur de composants, au taux sans risque et à la prime de la fiche des projets", () => {
    expect(EMETTEUR).toBe(NOVA_GESTION.semestre.fournisseur.nom);
    expect(EMETTEUR).toBe(ELECTRO_COMPOSANTS.nom);
    expect(RENTABILITE_EXIGEE).toBe(TAUX_D_ACTUALISATION_DE_NOVA);
    expect(PLACEMENT_SANS_RISQUE).toBe(PLACEMENT.tauxAnnuel);
  });

  it("l'emprunt de N+1, les dettes, l'augmentation de capital et le crédit-bail sont ceux des autres chapitres", () => {
    expect([EMPRUNT_DE_N_PLUS_1.montant, EMPRUNT_DE_N_PLUS_1.taux]).toEqual([EMPRUNT_DU_PLAN_EQUILIBRE, CONTRAT_DE_PRET.tauxAnnuel]);
    const pret = remboursements(PRET_BANCAIRE(EXERCICE_DE_NOVA), EMPRUNT_DE_N_PLUS_1.montant);
    expect(tableauDeLEmprunt("amortissement-constant").annees.map((a) => [a.interets, a.amortissement, a.annuite])).toEqual(pret.map((r) => [r.interets, r.capital, r.total]));
    expect(DETTES_DU_31_DECEMBRE).toBe(CONTRAT_DE_PRET.capital - 3 * (CONTRAT_DE_PRET.capital / (CONTRAT_DE_PRET.dureeAns * CONTRAT_DE_PRET.echeancesParAn)));
    const a = augmentationVueParLesActionnaires();
    expect(a).toMatchObject(augmentationDeCapital());
    expect(a.capitauxPropres).toBeCloseTo(beneficeAAffecter(EXERCICE_DE_NOVA).capital + CLOTURE_DE_LA_FICHE.resultatNet, 2);
    expect(PRIX_DE_L_ACTION).toBe(AUGMENTATION_DE_CAPITAL.prixDEmission);
    expect(coutDuCreditBail()).toBe(comparaison().tauxDuCreditBail);
    expect(Math.round(coutParLeDividendeEnProgression() * 1e9) / 1e9).toBe(TAUX_D_ACTUALISATION_DE_NOVA);
  });
});

/**
 * UNE SEULE NOVA DANS LE BFR NORMATIF ET LES ACTEURS DU FINANCEMENT (DCG UE6 2.2, 3.1 et 3.2) : l'année
 * type reprend les ventes de l'exercice (les particuliers, le contrat de CampusTech) et les délais de la
 * fiche ; le besoin du bilan est celui de la clôture ; les 80 000 € à financer sont ceux qui équilibrent
 * le plan de la gamme ; l'apport de la business angel est l'augmentation de capital de N+1 ; l'emprunt
 * en cours est celui de la création.
 */
describe("une seule NOVA, du BFR normatif aux acteurs du financement", () => {
  it("l'année type et ses délais sont ceux de la fiche ; le besoin du bilan, celui de la clôture", () => {
    const f = EXERCICE_DE_NOVA;
    expect(ANNEE_TYPE.particuliers).toBe(f.ventesAuxParticuliers.reduce((t, q) => t + q, 0));
    expect(ANNEE_TYPE.campustech).toBe(12 * f.campustech.enceintesParFacture);
    expect(DELAIS_DE_LA_FICHE.campustech).toBe(DELAI_DE_CAMPUSTECH);
    expect(DELAIS_DE_LA_FICHE.campustech).toBe(f.campustech.delai);
    expect(DELAIS_DE_LA_FICHE.fournisseur).toBe(f.fournisseur.delai);
    expect(bfrNormatif().caHt).toBe((ANNEE_TYPE.particuliers + ANNEE_TYPE.campustech) * f.prixDeLEnceinte);
    expect(besoinAuBilan()).toBe(cloture(f).fonctionnel.besoinDExploitation);
    expect(besoinAuBilan()).toBe(CLOTURE_DE_LA_FICHE.fonctionnel.besoinDExploitation);
  });

  it("les 80 000 € équilibrent le plan de la gamme ; la business angel est l'augmentation de N+1 ; l'emprunt en cours, celui de la création", () => {
    expect(BESOIN_EXTERNE).toBe(EMPRUNT_DU_PLAN_EQUILIBRE);
    expect(planDeFinancementDeLaGamme({ emprunt: BESOIN_EXTERNE }).equilibre).toBe(true);
    expect(engagementBancaire(BESOIN_EXTERNE).tableau).toEqual(planDeFinancementDeLaGamme({ emprunt: BESOIN_EXTERNE }).tableauDeLEmprunt);
    expect(APPORT_DE_LA_BUSINESS_ANGEL.montant).toBe(BESOIN_DE_FONDS);
    expect(APPORT_DE_LA_BUSINESS_ANGEL.prix).toBe(AUGMENTATION_DE_CAPITAL.prixDEmission);
    expect(engagementsEnCours().capitalRestantDu).toBe(CONTRAT_DE_PRET.capital - 3 * 4_000);
  });
});

/**
 * UNE SEULE NOVA SUR TROIS EXERCICES (DCG UE6, le diagnostic et l'investissement durable) : N est la
 * clôture du cours ; N + 1 lit la seconde ligne manuelle de la comptabilité approfondie (60 000 €, ses
 * composants), l'augmentation de capital du 30 juin N + 1, le prêt de N échéance par échéance, la
 * demande de One de nova-capacite.ts, la gamme du projet A et l'équipe qu'il demande, et les
 * équipements d'efficacité du chapitre « Évaluer un investissement durable ».
 */
describe("une seule NOVA, de la clôture de N au diagnostic de trois exercices", () => {
  it("N est la clôture : le même résultat, la même CAF, la même trésorerie nette", async () => {
    const { exercicesDeNova } = await import("../../src/config/cours/monde/diagnostic-de-nova");
    const [n] = exercicesDeNova();
    const k = cloture(EXERCICE_DE_NOVA);
    expect([n!.resultatNet, n!.caf, n!.tresorerieNette, n!.dettesFinancieres]).toEqual([CLOTURE_DE_LA_FICHE.resultatNet, k.caf.additive, k.fonctionnel.tresorerieNette, k.fonctionnel.ressourcesStables.dettesFinancieres]);
  });

  it("N + 1 et N + 2 lisent la seconde ligne, l'augmentation de capital, le prêt, la demande et la gamme des autres fiches", async () => {
    const { exercicesDeNova, dotationsDesExercices, EFFECTIFS } = await import("../../src/config/cours/monde/diagnostic-de-nova");
    const { composantsDeLaSecondeLigne, SECONDE_LIGNE } = await import("../../src/config/cours/monde/comptabilite-approfondie");
    const { empruntALaCloture } = await import("../../src/config/cours/monde/emprunt");
    const { ANNEE_N_PLUS_1 } = await import("../../src/config/cours/monde/nova-capacite");
    const { VENTES_DE_GO, VENTES_DE_ONE_PERDUES, VENTES_DE_STUDIO, PROJET_LIGNE_MANUELLE, COUT_ANNUEL_D_UN_OPERATEUR } = await import("../../src/config/cours/monde/projets-et-financement");
    const { EQUIPEMENTS_D_EFFICACITE } = await import("../../src/config/cours/monde/investissement-durable");
    const [, n1, n2] = exercicesDeNova();
    expect(n1!.investissements).toBe(SECONDE_LIGNE.ht + PROJET_LIGNE_MANUELLE.actifs[1]!.montant + EQUIPEMENTS_D_EFFICACITE.montant);
    expect(PROJET_LIGNE_MANUELLE.actifs[0]!.montant).toBe(SECONDE_LIGNE.ht);
    expect(dotationsDesExercices()["N+1"]).toBeGreaterThan(composantsDeLaSecondeLigne().total);
    expect(n1!.apports).toBe(augmentationDeCapital().fonds);
    expect([n1!.dettesFinancieres, n2!.dettesFinancieres]).toEqual([empruntALaCloture(CONTRAT_DE_PRET, 1).capitalRestantDu, empruntALaCloture(CONTRAT_DE_PRET, 2).capitalRestantDu]);
    expect(n1!.enceintes).toBe(ANNEE_N_PLUS_1.demande.reduce((t, q) => t + q, 0) - VENTES_DE_ONE_PERDUES[0] + VENTES_DE_GO[0] + VENTES_DE_STUDIO[0]);
    expect(n1!.personnel).toBe((PAIE_DU_MOIS.effectif + 2) * COUT_ANNUEL_D_UN_OPERATEUR);
    expect(EFFECTIFS.N).toBe(PAIE_DU_MOIS.effectif);
    // Le résultat de N est affecté sans dividende : aucun dividende en N + 1.
    expect(n1!.dividendes).toBe(0);
  });
});

describe("une seule NOVA, chez son distributeur CampusTech (BTS NDRC, se faire référencer)", () => {
  it("le référencement lit le prix de 59 €, le coût variable de 38 € et les 320 enceintes par mois de CampusTech", () => {
    const r = referencementDeNova(NOVA_GESTION);
    const a = r.aujourdHui;
    expect([a.prixDAchat, a.coutVariable]).toEqual([PRIX_DE_L_ENCEINTE, COMPOSANTS_PAR_ENCEINTE + AUTRES_COUTS_PAR_ENCEINTE]);
    expect(a.parMagasin * MAGASINS_DE_CAMPUSTECH).toBe(VENTES_A_CAMPUSTECH[0]);
    expect(a.ventesDeLAnnee).toBe(12 * VENTES_A_CAMPUSTECH[0]);
    // Aujourd'hui, ni remise ni commission : le canal indirect de la mercatique, au même délai convenu.
    expect([a.remise, a.cooperation, MERCATIQUE_DE_NOVA.canal.commission]).toEqual([0, 0, 0]);
    expect(a.margeDeNova).toBe(12 * 320 * (59 - 38));
    expect(CADRE_DE_LA_NEGOCIATION.delaiDePaiement).toBe(DELAI_CONVENU_DE_CAMPUSTECH);
  });
});

/**
 * UNE SEULE NOVA DANS LES CAPITAUX PROPRES ET LES COMPTES ANNUELS (BTS CG P2) : le capital est celui
 * de la fiche, en actions du DCG ; le bénéfice de N, celui de la clôture figée ; son affectation, la
 * version unique du bac (décision D2) ; l'augmentation, celle du DCG ; la perte de PIXEL & CO, celle
 * du déficit reporté ; le bilan, le compte de résultat et l'emprunt de l'annexe, ceux de la clôture.
 */
describe("une seule NOVA, de la constitution aux comptes annuels", () => {
  it("le capital, le bénéfice, le dividende et l'augmentation sont ceux des chapitres qui les ont posés", () => {
    const x = affectationDeNova();
    expect(x.capital).toBe(EXERCICE_DE_NOVA.apport.montant);
    expect(x.actions * ACTIONS_DU_DCG.nominal).toBe(EXERCICE_DE_NOVA.apport.montant);
    expect(x.benefice).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(x.dividendes).toBe(DIVIDENDE_DU_BAC * ACTIONS_DU_DCG.nombre);
    const a = augmentationDuBts();
    expect(a.nouvelles * AUGMENTATION_DU_DCG.parite).toBe(ACTIONS_DU_DCG.nombre);
    expect(a.prix).toBe(AUGMENTATION_DU_DCG.prixDEmission);
  });

  it("la perte de PIXEL & CO part de son exercice N en perte, et son capital de son cas", () => {
    const p = perteDePixel();
    expect(p.perteComptable).toBe(-EXERCICES_DE_PIXEL[1]!.resultatComptable);
    expect(p.capital).toBe(CAS_DES_ENTREPRISES.ecommerce!.capital);
  });

  it("les comptes annuels sont ceux de la clôture figée, et l'annexe y retombe", () => {
    const k = comptesAnnuels();
    expect(k.resultat.resultatNet).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(k.bilan.totalActif).toBe(CLOTURE_DE_LA_FICHE.totalDuBilan);
    expect(k.resultat.amortissements).toBe(CLOTURE_DE_LA_FICHE.travaux.dotationAuxAmortissements);
    const x = annexeDeN();
    expect(x.immobilisations.fin).toBe(EQUIPEMENT.ht);
    expect(Math.round((x.empruntAUnAn + x.empruntAPlusDUnAn) * 100) / 100).toBe(k.bilan.passif.emprunts);
  });
});
