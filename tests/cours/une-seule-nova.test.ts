import { describe, expect, it } from "vitest";
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
import { chaineDeValeur, chargesDeLAtelierParNature, durabiliteDuSalaire, trimestreAuPrix } from "../../src/config/cours/monde/organisation-du-controle";
import { budgetDActivite, budgetsParCentre, commandesDuMois, navette, reseauDesBudgets } from "../../src/config/cours/monde/demarche-budgetaire";
import { investissementDeLaFiche, repartitionDesCentres, trimestreDeDecision } from "../../src/config/cours/monde/couts-et-budgets";
import { COMMANDES_DE_JANVIER } from "../../src/config/cours/monde/couts-par-activites";

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
