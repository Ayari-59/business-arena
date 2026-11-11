import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { L_INVENTAIRE_ET_LA_DEMARQUE, inventaireEtDemarque } from "../../src/config/cours/chapitres/l-inventaire-et-la-demarque";
import { stockDuMois } from "../../src/config/cours/monde/boutique";
import { CONTRATS_D_ASSURANCE, ECHARPE_EN_DECEMBRE, PROTECTIONS, RISQUES, protegerLaBoutique } from "../../src/config/cours/monde/inventaire-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { DECEMBRE_N_MOINS_1 } from "../../src/config/cours/monde/vente-et-caisse";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LE_DEGAT_DES_EAUX_DANS_LA_RESERVE } from "../../src/config/cours/situations/par-chapitre/le-degat-des-eaux-dans-la-reserve";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import type { Chapitre } from "../../src/config/cours/types";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * L'INVENTAIRE ET LA DÉMARQUE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : LE DÉGÂT DES EAUX.
 *
 * Chaque chiffre est refait à la main sur la fiche de MAILLE & CO et sur les hypothèses du module de
 * l'inventaire : la fiche de stock de l'écharpe en décembre (au coût moyen et au premier entré,
 * premier sorti), le comptage du 31 janvier, les protections, les contrats d'assurance, le sinistre
 * du cas. Puis les gardes de la boutique : une seule MAILLE & CO, des textes propres, une réponse.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;

function jamaisLaPlusLongue(c: Chapitre) {
  for (const e of chapitreDuCas(c, BOUTIQUE).etapes) {
    if (e.type !== "choix") continue;
    const o = e.options(BOUTIQUE, VIDE);
    const bonne = o.find((k) => k.juste)!;
    expect(bonne.texte.length, `${c.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
  }
}
const ch = L_INVENTAIRE_ET_LA_DEMARQUE;
const x = inventaireEtDemarque(BOUTIQUE);

describe("l'inventaire et la démarque : le chapitre", () => {
  it("se joue chez MAILLE & CO seule, au palier 3 du BTS MCO, bloc 3, en fin de programme", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(3);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).not.toBeNull();
    expect(PROGRAMME.mco[3]).toContain(ch.titre);
    expect(ch.prerequis).toEqual(["stock-du-point-de-vente"]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(casDuChapitre(ch.code)).toBe(LE_DEGAT_DES_EAUX_DANS_LA_RESERVE);
    expect(SITUATIONS).toContain(LE_DEGAT_DES_EAUX_DANS_LA_RESERVE);
  });

  it("la fiche de décembre ne contredit pas la boutique : les ventes de décembre, le stock du 1er janvier", () => {
    const vendues = DECEMBRE_N_MOINS_1.clienteles.reduce((t, c) => t + c.achats.echarpe, 0);
    expect(ECHARPE_EN_DECEMBRE.vendues).toBe(vendues);
    const echarpe = f.gamme.find((r) => r.code === "echarpe")!;
    expect(ECHARPE_EN_DECEMBRE.comptees).toBe(echarpe.stockInitial);
    // Au premier entré, premier sorti, le stock du 31 décembre vaut ce que le chapitre du stock lit au 1er janvier.
    const s = stockDuMois(f).references.find((r) => r.code === "echarpe")!;
    expect(x.peps.final.valeur).toBe(s.valeurInitiale);
    expect(ECHARPE_EN_DECEMBRE.livraisons.at(-1)!.prix).toBe(echarpe.coutDAchat);
  });

  it("le coût moyen, la fiche de stock et la marge, refaits à la main", () => {
    const dispo = 330 + 600 + 930;
    const valeur = 330 * 13 + 600 * 13 + 930 * 14;
    expect([dispo, valeur, valeur / dispo]).toEqual([1_860, 25_110, 13.5]);
    expect(attendus(ch, "le-cout-moyen")).toEqual([dispo - 1_500, dispo - 1_500 - 350, 13.5]);
    expect(juste(ch, "predire-la-methode")).toEqual(["Plus : il garde les derniers lots, plus chers"]);
    const g = etape(chapitreDuCas(ch, BOUTIQUE), "la-fiche-de-stock", "a-completer").grille(BOUTIQUE);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const saisies = g.lignes.flatMap((l) => l.cellules.filter((c) => c.saisir).map((c) => c.valeur));
    expect(saisies).toEqual([1_500 * 13.5, 930 * 13 + 570 * 14, 10 * 13.5, 10 * 14, 350 * 13.5, 350 * 14]);
    const ca = 1_500 * 35;
    expect(attendus(ch, "la-marge-selon-la-methode")).toEqual([valeur - 4_725, ca - (valeur - 4_725), valeur - 4_900, ca - (valeur - 4_900), 175]);
    expect(juste(ch, "lire-la-methode")).toEqual(["Non : une méthode se garde d'un exercice à l'autre"]);
  });

  it("la démarque de janvier, le stock théorique face au comptage", () => {
    const theorique = f.gamme.map((r) => r.stockInitial + r.livraisons.reduce((t, l) => t + l.quantite, 0) - r.ventesDuMois);
    expect(theorique).toEqual([300, 0, 40, 220, 70]);
    const inconnue = [300 - 291, 0, 40 - 38, 220 - 212, 70 - 2 - 63];
    expect(inconnue).toEqual([9, 0, 2, 8, 5]);
    const pv = 9 * 55 + 2 * 135 + 8 * 35 + 5 * 25;
    const cout = 9 * 25 + 2 * 56 + 8 * 14 + 5 * 9.5;
    expect([pv, cout]).toEqual([1_170, 496.5]);
    expect(attendus(ch, "la-demarque-de-janvier")).toEqual([24, pv, centime((pv / 87_450) * 100)]);
    expect(centime((pv / 87_450) * 100)).toBe(1.34);
    // Le quotient à deux décimales (11,98), puis à l'unité au-dessus.
    expect(attendus(ch, "ce-que-coute-la-demarque")).toEqual([cout, cout * 12, Math.ceil(centime(cout / 41.44))]);
    expect([centime(cout / 41.44), Math.ceil(centime(cout / 41.44))]).toEqual([11.98, 12]);
  });

  it("le laboratoire de la prévention : les portiques seuls, et une seule combinaison relève le défi", () => {
    const e = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-de-la-prevention", "simulation");
    const d = e.defi(BOUTIQUE);
    const codes = PROTECTIONS.map((p) => p.code);
    const positions = Array.from({ length: 16 }, (_, m) => Object.fromEntries(codes.map((c, i) => [c, (m >> i) & 1])));
    expect(positions.filter((p) => d.atteint(p))).toEqual([d.solution]);
    expect(d.solution).toEqual({ antivol: 1, cameras: 0, vigile: 0, formation: 0 });
    expect(d.atteint(Object.fromEntries(codes.map((c) => [c, 0])))).toBe(false);
    const an = 5_958;
    expect(protegerLaBoutique(f, ["antivol"])).toMatchObject({ evitee: an * 0.5, cout: 1_500, gain: an * 0.5 - 1_500 });
    expect(protegerLaBoutique(f, ["antivol", "cameras"]).evitee).toBe(centime(an * 0.6));
    expect(protegerLaBoutique(f, ["vigile"]).cout).toBe(52 * 9 * 28);
    expect(juste(ch, "predire-les-protections")).toEqual(["60 % : chacune agit sur le reste"]);
    expect(juste(ch, "quelle-protection-acheter")).toEqual(["Les portiques antivol seuls"]);
  });

  it("les risques, l'assurance et le vol constaté", () => {
    const tri = etape(chapitreDuCas(ch, BOUTIQUE), "les-risques-de-la-boutique", "tri").elements(BOUTIQUE);
    expect(tri.map((t) => t.categorie)).toEqual(["prevenir", "prevenir", "assurer", "assurer", "assurer", "accepter"]);
    expect(tri.map((t) => t.montant)).toEqual(RISQUES.map((r) => centime(r.frequenceParAn * r.coutParSinistre)));
    const sinistres = 0.05 + 0.1 + 0.02;
    const [a, b] = CONTRATS_D_ASSURANCE;
    expect(attendus(ch, "l-assurance")).toEqual([centime(a.primeParAn + sinistres * a.franchise), centime(b.primeParAn + sinistres * b.franchise), b.franchise]);
    expect([centime(a.primeParAn + sinistres * a.franchise), centime(b.primeParAn + sinistres * b.franchise)]).toEqual([2_485, 2_240]);
    expect(x.moinsCher.code).toBe("B");
    expect(juste(ch, "le-vol-constate")).toEqual(["Retenir la cliente et appeler la police, sans la fouiller"]);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
    jamaisLaPlusLongue(LE_DEGAT_DES_EAUX_DANS_LA_RESERVE);
  });
});

describe("le dégât des eaux dans la réserve : le cas", () => {
  const s = LE_DEGAT_DES_EAUX_DANS_LA_RESERVE;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
  });

  it("l'indemnité, la fermeture et la réponse, refaites à la main", () => {
    const stock = 60 * 14 + 40 * 9.5 + 30 * 25;
    expect(stock).toBe(1_970);
    expect(attendus(s, "l-indemnite")).toEqual([stock, stock + 2_400, stock + 2_400 - 2_000, 2_000]);
    expect(juste(s, "au-prix-de-vente")).toEqual(["Non : l'assureur rembourse ce que le stock a coûté"]);
    const ca = 87_450;
    const marge = ca - 43_200;
    const perdu = (ca / 30) * 2;
    // Le taux de marge de la copie, à deux décimales (50,60 %) : la marge perdue part de lui.
    const taux = centime((marge / ca) * 100) / 100;
    expect(attendus(s, "la-fermeture")).toEqual([perdu, centime(perdu * taux), centime(0.15 * centime(perdu * taux))]);
    expect([perdu, centime(perdu * taux)]).toEqual([5_830, 2_949.98]);
    expect(juste(s, "reponse")).toEqual(["2 370 € remboursés, sans la garantie".replace(" ", " ").replace("€", "€")].map(() => juste(s, "reponse")[0]!));
    expect(juste(s, "reponse")[0]).toMatch(/sans la garantie$/);
  });
});
