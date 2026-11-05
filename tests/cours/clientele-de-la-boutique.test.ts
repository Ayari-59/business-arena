import { describe, expect, it } from "vitest";
import {
  ECHANTILLON_OBTENU,
  FICHIER_DE_LA_CARTE,
  ORIGINE_DES_CLIENTS,
  REPONSES_INFLUENCE,
  REPONSES_SERVICE,
  RETRAITS_DE_JANVIER,
  SAMEDI_APRES_LA_FORMATION,
  SAMEDI_DES_VENDEURS,
  VISITES_DU_SITE,
  ZONES,
  echantillonBrut,
  etudeDuService,
  pointDeRupture,
  remiseQuiTient,
  samediDesVendeurs,
  satisfaction,
  valeurDUneCliente,
  zoneDeChalandise,
} from "../../src/config/cours/monde/clientele-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { carteDeFidelite, TAUX_DE_DEPART_PAR_MOIS } from "../../src/config/cours/monde/vente-et-caisse";

/**
 * LA CLIENTÈLE DE MAILLE & CO, SA ZONE ET SON FICHIER (monde/clientele-de-la-boutique.ts) NE CONTREDISENT
 * PAS LA FICHE. Les clients des trois zones refont les 940 passages et les 77 250 € HT encaissés en caisse ;
 * l'étude interroge un quart de ces passages ; le samedi des vendeurs tient dans les 240 entrées de
 * l'affluence du samedi, avec des vendeurs de l'équipe ; la carte est celle du bac pro (340 clientes, 5 %
 * de départs). Chaque chiffre est refait à la main.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

describe("la clientèle de MAILLE & CO ne contredit pas la fiche", () => {
  it("les clients des zones refont les passages et le chiffre encaissé en caisse de janvier", () => {
    const k = zoneDeChalandise(f);
    const fid = f.clienteles.find((x) => x.code === "fideles")!;
    const pas = f.clienteles.find((x) => x.code === "passants")!;
    for (const o of Object.values(ORIGINE_DES_CLIENTS)) expect(c(somme(Object.values(o)))).toBe(1);
    expect(somme(k.zones.map((z) => z.fideles))).toBe(fid.tickets);
    expect(somme(k.zones.map((z) => z.passants)) + k.horsZone.passants).toBe(pas.tickets);
    expect(k.chiffreEnCaisse).toBe(c(77_250 * 1.2));
    expect(c(somme(k.zones.map((z) => z.chiffre)) + k.horsZone.chiffre)).toBe(k.chiffreEnCaisse);
    expect(k.zone("primaire").surfaceDeMaille).toBeGreaterThan(f.surfaceDeVente);
    expect(ZONES.map((z) => z.population)).toEqual([28_000, 52_000, 75_000]);
    expect(somme(Object.values(VISITES_DU_SITE))).toBe(4_000);
    expect(RETRAITS_DE_JANVIER).toBeLessThan(fid.tickets + pas.tickets);
    expect(pointDeRupture()).toBe(5_600);
  });

  it("l'étude interroge un quart des passages, et chaque clientèle répond autant qu'elle a été interrogée", () => {
    const e = etudeDuService(f);
    expect(e.populationMere).toBe(f.clienteles.reduce((t, x) => t + x.tickets, 0));
    expect(e.taille).toBe(somme(Object.values(ECHANTILLON_OBTENU)));
    for (const k of Object.keys(ECHANTILLON_OBTENU) as (keyof typeof ECHANTILLON_OBTENU)[]) {
      expect(somme(Object.values(REPONSES_SERVICE[k])), k).toBe(ECHANTILLON_OBTENU[k]);
      expect(somme(Object.values(REPONSES_INFLUENCE[k])), k).toBe(ECHANTILLON_OBTENU[k]);
    }
    // L'échantillon brut au quota refait l'étude redressée.
    expect(echantillonBrut(85).part("nocturne") * 237).toBeCloseTo(77, 9);
  });

  it("le samedi tient dans les entrées du samedi, avec des vendeurs de l'équipe", () => {
    const s = samediDesVendeurs(f);
    expect(s.entrees).toBe(somme(f.affluence.samedi));
    expect(s.entrees).toBe(240);
    expect(s.prisEnCharge).toBeLessThanOrEqual(s.entrees);
    for (const v of [...SAMEDI_DES_VENDEURS, SAMEDI_APRES_LA_FORMATION]) {
      expect(f.equipe.map((x) => x.code)).toContain(v.code);
      expect(v.echarpesAvecLeCardigan).toBeLessThanOrEqual(Math.min(v.ventes.cardigan, v.ventes.echarpe));
      expect(v.tickets).toBeLessThanOrEqual(v.prisEnCharge);
    }
    // La transformation du samedi reste proche de celle du mois (940 ÷ 3 848 = 24,4 %).
    expect(c(s.tickets / s.entrees)).toBe(0.24);
    expect([s.tickets, s.articles, s.chiffre]).toEqual([57, 85, 4_765]);
  });

  it("la carte est celle du bac pro : 340 clientes, 57,76 € par passage, 5 % de départs", () => {
    const v = valeurDUneCliente(f);
    expect(v.clientes).toBe(carteDeFidelite(f).clientes);
    expect(v.margeDUnPassage).toBe(carteDeFidelite(f).margeDUnPassage);
    expect(v.departs).toBe(TAUX_DE_DEPART_PAR_MOIS);
    expect(v.valeur).toBe(c(57.76 * 20));
    expect(FICHIER_DE_LA_CARTE.find((r) => r.code === "recentes")!.cartes).toBeGreaterThanOrEqual(v.clientes);
    expect([remiseQuiTient(f, 0.04), remiseQuiTient(f, 0.045), remiseQuiTient(f, 0.05)]).toEqual([10, 5, 0]);
    const s = satisfaction(f);
    expect([s.reponses, s.passages, s.nps]).toEqual([200, 940, 15]);
  });
});
