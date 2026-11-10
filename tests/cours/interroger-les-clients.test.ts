import { describe, expect, it } from "vitest";
import { INTERROGER_LES_CLIENTS } from "../../src/config/cours/chapitres/interroger-les-clients";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { FAUT_IL_LIVRER_A_DOMICILE } from "../../src/config/cours/situations/par-chapitre/faut-il-livrer-a-domicile";
import type { EtapeSimulation, EtapeTri } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, juste } from "./gardes-de-la-boutique";
import { gardesDuBloc1 } from "./gardes-du-bloc-1-mco";

/**
 * INTERROGER LES CLIENTS (BTS MCO, bloc 1, palier 2), SUR LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : FAUT-IL
 * LIVRER À DOMICILE ?
 *
 * Refait à la main sur la fiche de MAILLE & CO : 340 passages de fidèles, 600 de passants, 8 commandes de
 * comités ; un client sur quatre interrogé (85, 150, 2) ; l'échantillon obtenu (120, 115, 2) et ses
 * réponses (monde/clientele-de-la-boutique.ts) ; la marge d'incertitude 1,96 × √(p(1 − p) ÷ n) ; le fichier
 * de la carte (640, 380 et 240 cartes ; 300, 110 et 90 accords).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const q = (x: number) => Math.round(x * 10_000) / 10_000 + 0;
const ch = INTERROGER_LES_CLIENTS;
const n = 237;
// Les réponses redressées, à la main : fidèles × 85 ÷ 120, passants × 150 ÷ 115 (des coefficients, au dix-millième).
const pf = q(85 / 120);
const pp = q(150 / 115);
const retouches = 54 * pf + 23 * pp;
const nocturne = 24 * pf + 46 * pp;

describe("interroger les clients, à la boutique du monde du cours", () => {
  it("se joue chez MAILLE & CO, au palier 2 du BTS MCO, bloc 1, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 2]);
    gardeDuProgramme(ch, PROGRAMME.mco[2]!, () => "bts-mco", /^BTS MCO /);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(FAUT_IL_LIVRER_A_DOMICILE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDuBloc1(ch);
  });

  it("les quotas, le tri à plat et le tri croisé, refaits à la main", () => {
    expect(attendus(ch, "les-quotas")).toEqual([948, 85, 150, 2]);
    expect(85 + 150 + 2).toBe(n);
    // Le tri à plat brut : 77, 70, 41 et 49 réponses sur 237.
    expect(attendus(ch, "le-tri-a-plat")).toEqual([77, 70, 41, 49].map((x) => c((x / n) * 100)));
    expect(attendus(ch, "le-tri-a-plat").slice(0, 2)).toEqual([32.49, 29.54]);
    expect(attendus(ch, "le-tri-croise")).toEqual([c((24 / 120) * 100), c((46 / 115) * 100), c((54 / 120) * 100), c((23 / 115) * 100)]);
    expect(attendus(ch, "le-tri-croise")).toEqual([20, 40, 45, 20]);
    expect(juste(ch, "predire-le-biais")).toEqual(["Perdraient la première place"]);
  });

  it("le redressement : la nocturne passe devant, refait à la main", () => {
    expect([c(retouches), c(nocturne)]).toEqual([68.25, 77]);
    expect(attendus(ch, "le-redressement")).toEqual([0.7083, 1.3043, 68.25, 77]);
    // Avec les poids au dix-millième, l'élève retombe sur les réponses exactes au centième ; au centième
    // (0,71 et 1,30), il trouverait 68,24 et 76,84, hors de la tolérance de 0,01.
    expect(Math.abs(54 * 0.7083 + 23 * 1.3043 - 68.25)).toBeLessThan(0.01);
    expect(Math.abs(24 * 0.7083 + 46 * 1.3043 - 77)).toBeLessThan(0.01);
    expect(Math.abs(24 * 0.71 + 46 * 1.3 - 77)).toBeGreaterThan(0.01);
  });

  it("le laboratoire de l'échantillon : seul le quota répond comme la population", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-l-echantillon");
    const lab = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-l-echantillon", "simulation") as EtapeSimulation;
    expect(lab.defi(BOUTIQUE).solution).toEqual({ fideles: 85 });
    const lire = (f: number) => Object.fromEntries(lab.lecture(BOUTIQUE, { fideles: f }).map((x) => [x.libelle, x.montant]));
    // À 120 fidèles (le départ), les retouches devancent la nocturne ; à 85, la nocturne devance.
    const part = (f: number, a: number, b: number) => c(((f * a + (235 - f) * b) / n) * 100);
    expect(lire(120)["Part des retouches"]).toBe(part(120, 0.45, 0.2));
    expect(lire(85)["Part de la nocturne"]).toBe(c((nocturne / n) * 100));
    expect(lire(120)["Part des retouches"]).toBeGreaterThan(lire(120)["Part de la nocturne"]!);
    expect(lire(85)["Part de la nocturne"]).toBeGreaterThan(lire(85)["Part des retouches"]!);
  });

  it("la marge d'incertitude et l'échantillon qui départagerait, refaits à la main", () => {
    const p = nocturne / n;
    const m = 1.96 * Math.sqrt((p * (1 - p)) / n);
    expect(c(m * 100)).toBe(5.96);
    expect(attendus(ch, "la-marge-d-incertitude")).toEqual([5.96, c(c(p * 100) - 5.96), c(c(p * 100) + 5.96)]);
    expect(attendus(ch, "la-marge-d-incertitude")).toEqual([5.96, 26.53, 38.45]);
    // Les retouches (28,80 %) sont dans l'intervalle : l'écart n'est pas significatif.
    expect(c((retouches / n) * 100)).toBe(28.8);
    const ecart = (nocturne - retouches) / n;
    const besoin = Math.ceil((1.96 ** 2 * p * (1 - p)) / ecart ** 2);
    expect(besoin).toBe(619);
    expect(attendus(ch, "l-echantillon-qui-departage")).toEqual([besoin, c((besoin / 948) * 100)]);
  });

  it("les facteurs d'influence, le fichier et sa conservation, refaits à la main", () => {
    expect(attendus(ch, "les-facteurs-d-influence")).toEqual([c((46 / 115) * 100), c((35 / 115) * 100), c((12 / 120) * 100)]);
    const tri = etape(chapitreDuCas(ch, BOUTIQUE), "le-fichier", "tri") as EtapeTri;
    expect(tri.elements(BOUTIQUE).filter((x) => x.categorie === "non").map((x) => x.libelle)).toEqual(["Le numéro de la carte bancaire", "Les revenus du ménage", "La religion ou les opinions"]);
    expect(attendus(ch, "la-conservation")).toEqual([240, 640 + 380, 300 + 110, c(410 * 0.08)]);
    expect(juste(ch, "le-defaut-de-l-etude")).toEqual(["Elle n'entend pas ceux qui ressortent sans acheter"]);
    expect(juste(ch, "quel-service")).toEqual(["Essayer la nocturne un mois, puis mesurer"]);
  });
});

describe("le cas : faut-il livrer à domicile ?", () => {
  const s = FAUT_IL_LIVRER_A_DOMICILE;

  it("tient la forme d'un cas dédié, aux textes propres", () => {
    gardeDuCas(s, ch);
    gardesDuBloc1(s);
  });

  it("les poids, le redressement, la marge et le fichier, refaits à la main", () => {
    expect(attendus(s, "les-poids")).toEqual([85, 150, q(85 / 50), q(150 / 185)]);
    const oui = 15 * q(85 / 50) + 74 * q(150 / 185) + 2;
    expect(c(oui)).toBe(87.5);
    expect(attendus(s, "le-redressement")).toEqual([87.5, c((oui / n) * 100)]);
    const p = q(c((c(oui) / n) * 100) / 100);
    const m = c(1.96 * Math.sqrt((p * (1 - p)) / n) * 100);
    expect([p, m]).toEqual([0.3692, 6.14]);
    expect(attendus(s, "la-marge")).toEqual([m, c(36.92 - m)]);
    expect(c(36.92 - m)).toBeGreaterThan(30);
    expect(attendus(s, "a-qui-l-annoncer")).toEqual([240, 410, 32.8]);
    expect(juste(s, "reponse")).toEqual(["Lancer, et l'annoncer aux 410 clientes qui l'ont accepté"]);
  });
});
