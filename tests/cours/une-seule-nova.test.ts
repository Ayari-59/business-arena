import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { anneeDuMarche } from "../../src/config/cours/monde/attractivite";
import { coefficientDeSaison, demandeAuPrix, marcheEtPart } from "../../src/config/cours/monde/economie-et-marketing";
import { VENTES_AUX_PARTICULIERS } from "../../src/config/cours/monde/exercice-de-nova";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { MERCATIQUE_DE_NOVA } from "../../src/config/cours/monde/mercatique-de-nova";
import { ANNEE_N } from "../../src/config/cours/monde/nova-capacite";
import { CHARGES_FIXES_DU_MOIS, GAMME_DE_NOVA, NOVA_GESTION, VENTES_A_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { compteDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "../../src/config/cours/monde/exercice-de-nova";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { EQUIPE as EQUIPE_DE_MAILLE } from "../../src/config/cours/monde/maille-et-co";
import { L_USINE_DE_NOVA } from "../../src/config/cours/monde/nova-usine";
import { HEURES_LEGALES_PAR_MOIS, paieDUnOperateur, SMIC_HORAIRE_BRUT, SMIC_MENSUEL_BRUT, TAUX_PATRONAL } from "../../src/config/cours/monde/ressources-humaines-de-nova";

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
  it("le SMIC du cours : 12,02 € de l'heure, 1 823,03 € pour 151,67 heures", () => {
    expect(SMIC_HORAIRE_BRUT).toBe(12.02);
    expect(HEURES_LEGALES_PAR_MOIS).toBe(Math.round((35 * 52 * 100) / 12) / 100);
    // 12,02 × 35 × 52 ÷ 12 (et non × 151,67 arrondi, qui donnerait 1 823,07 €).
    expect(Math.round(((12.02 * 35 * 52) / 12) * 100) / 100).toBe(SMIC_MENSUEL_BRUT);
  });

  it("les opérateurs de NOVA : 1 875 € pour 151,67 heures payées, 12,36 € de l'heure, sans heures supplémentaires", () => {
    const o = NOVA_CAPACITE.operateurs;
    expect(o.heuresPayeesParMois).toBe(HEURES_LEGALES_PAR_MOIS);
    expect(o.heuresParMois).toBeLessThanOrEqual(o.heuresPayeesParMois);
    expect(o.salaireBrutMensuel / o.heuresPayeesParMois).toBeGreaterThanOrEqual(SMIC_HORAIRE_BRUT);
    expect(Math.round((1_875 / 151.67) * 100) / 100).toBe(12.36);
    // Le salaire du marché et le seuil de démission (95 %) restent au-dessus du SMIC mensuel.
    const m = NOVA_CAPACITE.personnel.salaireDuMarche;
    expect(Math.min(m.n, m.nPlus1) * 0.95).toBeGreaterThanOrEqual(SMIC_MENSUEL_BRUT);
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
    expect(t).toContain(`${montantEcrit(PUB)} par mois`);
  });

  it("aucun chapitre ni cas ne dit que NOVA ne fait pas de publicité", () => {
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      if (c.entreprises && !c.entreprises.codes.includes("nova")) continue;
      expect(JSON.stringify(servirLeChapitre(c, casDeLEntreprise("nova"))), c.code).not.toMatch(/NOVA ne fait (?:pas|aucune) (?:de )?publicité/);
    }
  }, 60_000);
});
