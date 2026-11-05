import { describe, expect, it } from "vitest";
import { FIDELISER_LA_CLIENTELE } from "../../src/config/cours/chapitres/fideliser-la-clientele";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { LA_CARTE_DU_PRESTATAIRE } from "../../src/config/cours/situations/par-chapitre/la-carte-du-prestataire";
import type { EtapeSimulation, EtapeTri } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, juste } from "./gardes-de-la-boutique";
import { gardesDuBloc1 } from "./gardes-du-bloc-1-mco";

/**
 * FIDÉLISER LA CLIENTÈLE (BTS MCO, bloc 1, palier 3), SUR LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LA
 * CARTE DU PRESTATAIRE.
 *
 * Refait à la main sur la fiche de MAILLE & CO et le bac pro : 340 clientes de la carte, 38 825 € hors
 * taxes et 19 640 € de marge en janvier (114,19 € et 57,76 € par passage), 5 % de départs par mois ; les
 * hypothèses du monde : 200 notes, 19 réclamations, la remise étudiée (5 %, départs à 4 %), la note en
 * ligne (4,5 puis 4,1), le mérinos réclamé (135 € HT, 56 € d'achat, 5 € d'autres coûts).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const d = (x: number) => Math.round(x * 10) / 10 + 0;
const ch = FIDELISER_LA_CLIENTELE;
const PANIER = c(38_825 / 340);
const MARGE = c(19_640 / 340);
/** La valeur d'une cliente à une remise r et des départs t, à la main (la remise d'un passage au centime). */
const valeur = (r: number, t: number) => c(c(MARGE - c(r * PANIER)) / t);

describe("fidéliser la clientèle, à la boutique du monde du cours", () => {
  it("se joue chez MAILLE & CO, au palier 3 du BTS MCO, bloc 1, au programme, avec ses voisins", () => {
    expect(CHAPITRES).toContain(ch);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    gardeDuProgramme(ch, PROGRAMME.mco[3]!, () => "bts-mco", /^BTS MCO /);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(casDuChapitre(ch.code)).toBe(LA_CARTE_DU_PRESTATAIRE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, notions existantes", () => {
    gardesDuBloc1(ch);
  });

  it("la satisfaction et les réclamations, refaites à la main", () => {
    const notes = [0, 0, 0, 6, 8, 14, 22, 30, 40, 42, 38];
    const moyenne = notes.reduce((t, n, i) => t + n * i, 0) / 200;
    expect(moyenne).toBe(7.7);
    expect(attendus(ch, "la-satisfaction")).toEqual([7.7, 40, 25, 15]);
    expect(attendus(ch, "les-reclamations")).toEqual([d((19 / 940) * 100), d((9 / 19) * 100)]);
  });

  it("la valeur d'une cliente fidèle, refaite à la main", () => {
    expect([PANIER, MARGE]).toEqual([114.19, 57.76]);
    expect(attendus(ch, "la-valeur-d-une-cliente")).toEqual([95, 20, c(MARGE * 20), d(0.95 ** 12 * 100)]);
    expect(attendus(ch, "la-valeur-d-une-cliente").slice(2)).toEqual([1_155.2, 54]);
    expect(juste(ch, "predire-la-valeur")[0]).toMatch(/^Environ 1/);
  });

  it("la remise au curseur et chiffrée : 10 % au plus à 4 % de départs", () => {
    const base = c(MARGE / 0.05);
    expect([valeur(0.1, 0.04) >= base, valeur(0.11, 0.04) >= base]).toEqual([true, false]);
    const e = gardeDuCurseur(ch, "la-remise-au-curseur", 10);
    expect(Object.fromEntries(e.lecture(BOUTIQUE, 10).map((x) => [x.libelle, x.montant]))["Valeur d'une cliente avec la remise"]).toBe(valeur(0.1, 0.04));
    expect(attendus(ch, "la-remise-chiffree")).toEqual([c(0.05 * PANIER), c(MARGE - c(0.05 * PANIER)), valeur(0.05, 0.04), c(valeur(0.05, 0.04) - base), c(0.05 * 38_825)]);
    expect(attendus(ch, "la-remise-chiffree")).toEqual([5.71, 52.05, 1_301.25, 146.05, 1_941.25]);
  });

  it("le laboratoire de la carte : 5 % au plus si les départs ne tombent qu'à 4,5 %", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-carte");
    const lab = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-la-carte", "simulation") as EtapeSimulation;
    expect(lab.defi(BOUTIQUE).solution).toEqual({ remise: 5, departs: 4.5 });
    const base = c(MARGE / 0.05);
    expect([valeur(0.05, 0.045), valeur(0.06, 0.045)]).toEqual([1_156.67, 1_131.33]);
    expect([valeur(0.05, 0.045) >= base, valeur(0.06, 0.045) >= base]).toEqual([true, false]);
  });

  it("l'e-réputation, les garanties, la réclamation et le verdict, refaits à la main", () => {
    // 4 dixièmes × 2 % = 8 % de 3 160 entrées ; 253 × 600 ÷ 3 160 passages ; 48 × 32,18 €.
    const entrees = Math.round(3_160 * 0.08);
    const passages = Math.round(entrees * (600 / 3_160));
    expect([entrees, passages]).toEqual([253, 48]);
    expect(attendus(ch, "l-e-reputation")).toEqual([entrees, passages, c(passages * c(19_310 / 600))]);
    const tri = etape(chapitreDuCas(ch, BOUTIQUE), "les-garanties", "tri") as EtapeTri;
    expect(tri.elements(BOUTIQUE).map((x) => x.categorie)).toEqual(["legale", "legale", "commerciale", "aucune", "aucune"]);
    expect(attendus(ch, "le-cout-de-la-reclamation")).toEqual([56 + 5, 135 - 61 - 61, -61]);
    expect(juste(ch, "lancer-la-remise")[0]).toMatch(/^L'essayer à 5/);
  });
});

describe("le cas : la carte du prestataire", () => {
  const s = LA_CARTE_DU_PRESTATAIRE;

  it("tient la forme d'un cas dédié, aux textes propres", () => {
    gardeDuCas(s, ch);
    gardesDuBloc1(s);
  });

  it("la valeur aujourd'hui, avec la carte à 8 %, et les départs qui tiennent, refaits à la main", () => {
    const base = c(MARGE / 0.05);
    expect(attendus(s, "aujourd-hui")).toEqual([20, base]);
    const apres = c(MARGE - c(0.08 * PANIER));
    expect(apres).toBe(48.62);
    expect(attendus(s, "la-carte-a-8")).toEqual([apres, c(apres / 0.04), c(apres / 0.045)]);
    expect(attendus(s, "la-carte-a-8")).toEqual([48.62, 1_215.5, 1_080.44]);
    expect(attendus(s, "a-rebours")).toEqual([c((apres / base) * 100), 5]);
    expect(attendus(s, "a-rebours")[0]).toBe(4.21);
    expect(juste(s, "reponse")[0]).toMatch(/^Négocier la remise à 5/);
  });
});
