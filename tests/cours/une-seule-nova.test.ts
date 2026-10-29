import { describe, expect, it } from "vitest";
import { anneeDuMarche } from "../../src/config/cours/monde/attractivite";
import { coefficientDeSaison, demandeAuPrix, marcheEtPart } from "../../src/config/cours/monde/economie-et-marketing";
import { VENTES_AUX_PARTICULIERS } from "../../src/config/cours/monde/exercice-de-nova";
import { MARCHE_A_TROIS } from "../../src/config/cours/monde/marche-a-trois";
import { MERCATIQUE_DE_NOVA } from "../../src/config/cours/monde/mercatique-de-nova";
import { ANNEE_N } from "../../src/config/cours/monde/nova-capacite";
import { CHARGES_FIXES_DU_MOIS, NOVA_GESTION, VENTES_A_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { compteDuLycee, exerciceDe } from "../../src/config/cours/monde/comptes-du-lycee";
import { PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "../../src/config/cours/monde/exercice-de-nova";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { paieDUnOperateur } from "../../src/config/cours/monde/ressources-humaines-de-nova";

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
