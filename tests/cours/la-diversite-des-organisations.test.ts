import { describe, expect, it } from "vitest";
import { arrondi2 } from "../../src/pedagogy/cours/deux-decimales";
import { LA_DIVERSITE_DES_ORGANISATIONS } from "../../src/config/cours/chapitres/la-diversite-des-organisations";
import { organisationsComparees } from "../../src/config/cours/monde/organisations-comparees";
import { LE_GYMNASE_DEVIENT_PAYANT, gymnasePayant } from "../../src/config/cours/situations/par-chapitre/le-gymnase-devient-payant";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « QUI POSSÈDE, QUI DIRIGE, QUI CONTRÔLE ? » (SGN T1.2 et management 1.2), ET SON CAS.
 *
 * Refait à la main sur les fiches : la communauté reçoit 3 100 000 + 5 200 000 + 700 000 = 9 000 000 €,
 * dont 700 000 € des usagers (7,8 %) ; le club reçoit 30 000 + 18 000 + 12 000 + 8 000 = 68 000 € et en
 * dépense 42 000 + 11 000 + 9 000 + 4 000 = 66 000 € : 2 000 € d'excédent ; la subvention fait 26,5 % de ses
 * recettes ; il occupe le gymnase 6 × 32 = 192 heures, et son excédent paierait 10 € l'heure (1 920 €),
 * pas 11 € (2 112 €).
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 1 de la SGN, puis le thème 1 du management : un chapitre partagé", () => {
    gardeDuProgrammeSgn(LA_DIVERSITE_DES_ORGANISATIONS, "STMG Thème 1 · De l'individu à l'acteur");
    expect(LA_DIVERSITE_DES_ORGANISATIONS.blocs[1]).toBe("STMG Thème 1 · À la rencontre du management des organisations");
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(LA_DIVERSITE_DES_ORGANISATIONS);
  });
});

describe("trois organisations, côte à côte", () => {
  it("ce qui les finance : 7,78 % payés par les usagers, 26,47 % de subvention", () => {
    const k = organisationsComparees();
    expect([k.communaute.recettes, k.communaute.usagers, k.communaute.impotsEtDotations]).toEqual([9_000_000, 700_000, 8_300_000]);
    expect(attendusSgn(LA_DIVERSITE_DES_ORGANISATIONS, "qui-finance")).toEqual([7.78, 26.47]);
  });

  it("trois excédents : 2 000 € au club, 500 000 € virés à l'investissement, le dividende de NOVA", () => {
    const k = organisationsComparees();
    expect([k.club.recettes, k.club.depenses, k.club.excedent]).toEqual([68_000, 66_000, 2_000]);
    const [club, communaute, part] = attendusSgn(LA_DIVERSITE_DES_ORGANISATIONS, "trois-excedents");
    expect([club, communaute]).toEqual([2_000, 500_000]);
    expect(part).toBe(arrondi2((k.nova.dividendes / k.nova.benefice) * 100));
    expect(k.nova.dividendes).toBeGreaterThan(0);
    expect(k.nova.dividendes).toBeLessThan(k.nova.benefice);
  });

  it("le curseur : 10 € l'heure au plus, sur 192 heures", () => {
    expect(organisationsComparees().club.heuresDeGymnase).toBe(192);
    gardeDuCurseurSgn(LA_DIVERSITE_DES_ORGANISATIONS, "le-gymnase-paye", 10);
  });

  it("les familles et les finalités", () => {
    const t = triSgn(LA_DIVERSITE_DES_ORGANISATIONS, "les-familles");
    expect(t["La Communauté de communes du Haut-Verdasse"]).toBe("organisation-publique");
    expect(t["Un syndicat de salariés de la métallurgie"]).toBe("societe-civile");
    expect(justeSgn(LA_DIVERSITE_DES_ORGANISATIONS, "la-finalite")).toEqual(["NOVA"]);
  });
});

describe("le cas du chapitre", () => {
  it("le gymnase à 12 € l'heure : 2 304 € de location, 304 € de déficit, 1,27 € par adhérent", () => {
    gardeDuCasSgn(LE_GYMNASE_DEVIENT_PAYANT, LA_DIVERSITE_DES_ORGANISATIONS);
    const k = gymnasePayant();
    expect([k.location, k.excedent, k.deficit, k.adherents, k.hausseParAdherent]).toEqual([12 * 192, 2_000 - 2_304, 304, 240, 1.27]);
  });
});
