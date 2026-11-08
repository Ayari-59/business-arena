import { describe, expect, it } from "vitest";
import { LE_PROCESSUS_ET_LE_PGI as CH } from "../../src/config/cours/chapitres/le-processus-et-le-pgi";
import { CAMPUSTECH } from "../../src/config/cours/monde/exercice-de-nova";
import { COMMANDES_QUI_PAIENT_LE_PGI, COUT_HORAIRE_DE_NOVA, economieDuPgi, processusDeLaCommande } from "../../src/config/cours/monde/processus-de-commande";
import { DEUX_POSTES_DE_PLUS, deuxPostesDePlus } from "../../src/config/cours/situations/par-chapitre/deux-postes-de-plus";
import { attendusSgn, gardeDuCasSgn, gardeDuCurseurSgn, gardeDuProgrammeSgn, gardesDeTexteSgn, justeSgn, triSgn } from "./gardes-de-la-sgn";

/**
 * « LE PROCESSUS ET LE PGI » (SGN T2.3), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 1 + 2 + 5 + 1 + 3 = 12 jours jusqu'à la facture sans PGI, 1 + 0 + 5 + 1 + 0 = 7 avec ;
 * CampusTech paie à 80 jours : 92 jours ou 87. L'heure : 10 650 € ÷ 4 ÷ 151,67 h = 17,55 € ; 2 ressaisies de
 * 30 minutes, une heure par commande ; 4 postes à 75 € = 300 € ; 300 ÷ 17,55 = 17,1 : 18 commandes.
 * Le cas : 40 × 17,55 = 702 € pour 6 × 75 = 450 € : 252 €.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la SGN, se joue chez NOVA", () => {
    gardeDuProgrammeSgn(CH, "STMG Thème 2 · Numérique et intelligence collective");
    expect(CH.entreprises?.codes).toEqual(["nova"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteSgn(CH);
  });
});

describe("le processus, avec ou sans PGI", () => {
  it("12 jours ou 7 jusqu'à la facture, 5 jours gagnés sur l'encaissement", () => {
    expect(CAMPUSTECH.delai).toBe(80);
    expect(attendusSgn(CH, "le-delai")).toEqual([12, 7, 5]);
    const k = processusDeLaCommande();
    expect([k.encaissementSans, k.encaissementAvec]).toEqual([92, 87]);
  });

  it("le curseur : 18 commandes par mois", () => {
    expect(COUT_HORAIRE_DE_NOVA).toBe(17.55);
    expect(COMMANDES_QUI_PAIENT_LE_PGI).toBe(18);
    gardeDuCurseurSgn(CH, "le-pgi-qui-se-paie", 18);
    expect(economieDuPgi(17).gain).toBeLessThan(0);
  });

  it("une base de données unique ; la relance automatique, la négociation humaine", () => {
    expect(justeSgn(CH, "le-pgi")[0]).toMatch(/base de données/);
    const t = triSgn(CH, "a-distance-et-l-ia");
    expect(t["Envoyer une relance quand une facture n'est pas payée à l'échéance"]).toBe("automatisable");
    expect(t["Négocier avec CampusTech un délai de paiement plus court"]).toBe("humain");
  });
});

describe("le cas du chapitre", () => {
  it("6 postes et 40 commandes : 702 € gagnés pour 450 € d'abonnement", () => {
    gardeDuCasSgn(DEUX_POSTES_DE_PLUS, CH);
    const k = deuxPostesDePlus();
    expect([k.temps, k.abonnement, k.gain]).toEqual([702, 450, 252]);
  });
});
