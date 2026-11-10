import { describe, expect, it } from "vitest";
import { arrondi2 } from "../../src/pedagogy/cours/deux-decimales";
import { DOMAINES_D_ACTIVITE } from "../../src/config/cours/chapitres/domaines-d-activite";
import { PROGRAMME } from "../../src/config/cours/registre";
import { ABANDONNER_L_ENCEINTE_NOMADE } from "../../src/config/cours/situations/par-chapitre/abandonner-l-enceinte-nomade";
import { NOVA, attendus, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { bonneReponseJamaisLaPlusLongue } from "./gardes-du-management";

/**
 * DOMAINES D'ACTIVITÉ (management de première, 3.1, lot B STMG), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur le mois en gamme : Go à 34 € (19 € de coût variable, 195 unités, 373 € de
 * publicité), One à 59 € (38 €, 1 160, 1 233 €), Studio à 129 € (70 €, 217, 393 €) ; 0,18, 0,3 et 0,5
 * heure-machine l'unité, 700 heures pour les deux lignes. SoundBox à 51 € (16 + 12 €, qualité 0,96),
 * Auris à 79 € (34 + 18 €, 1,31), NOVA à 59 € (22 + 16 €, 1).
 */

const go = 15 * 195 - 373;
const one = 21 * 1_160 - 1_233;
const studio = (q: number) => 59 * q - 393;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(DOMAINES_D_ACTIVITE, PROGRAMME["stmg-management"][1]!);
    expect(DOMAINES_D_ACTIVITE.blocs[0]).toBe("STMG Thème 3 · Les choix stratégiques des organisations");
    gardeDuCas(ABANDONNER_L_ENCEINTE_NOMADE, DOMAINES_D_ACTIVITE);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, servis par le serveur", () => {
    gardesDeTexte(DOMAINES_D_ACTIVITE);
    bonneReponseJamaisLaPlusLongue(DOMAINES_D_ACTIVITE);
    bonneReponseJamaisLaPlusLongue(ABANDONNER_L_ENCEINTE_NOMADE);
  });
});

describe("les domaines de NOVA", () => {
  it("les contributions : 2 552 €, 23 127 € et 12 410 € ; One en fait 60,72 %", () => {
    const total = go + one + studio(217);
    expect(attendus(DOMAINES_D_ACTIVITE, "ce-que-rapporte-chaque-domaine")).toEqual([go, one, studio(217), arrondi2((one / total) * 100)]);
    expect([go, one, studio(217), arrondi2((one / total) * 100)]).toEqual([2_552, 23_127, 12_410, 60.72]);
  });

  it("le laboratoire : 356 Studio font passer One sous la moitié, 355 non ; la ligne suit", () => {
    const e = gardeDuLaboratoire(DOMAINES_D_ACTIVITE, "le-laboratoire-de-la-dependance");
    expect(e.defi(NOVA).solution).toEqual({ studio: 356 });
    const part = (q: number) => one / (go + one + studio(q));
    expect([part(356) < 0.5, part(355) < 0.5]).toEqual([true, false]);
    expect(0.18 * 195 + 0.3 * 1_160 + 0.5 * 356).toBeLessThanOrEqual(700);
  });

  it("les tris et les choix : stratégie globale ou de domaine, spécialisation, avantage concurrentiel, secret", () => {
    expect(Object.values(triDe(DOMAINES_D_ACTIVITE, "globale-ou-de-domaine")).sort()).toEqual(["domaine", "domaine", "domaine", "globale", "globale"]);
    expect(Object.values(triDe(DOMAINES_D_ACTIVITE, "l-avantage-concurrentiel"))).toEqual(["couts", "differenciation", "milieu"]);
    expect(Object.keys(triDe(DOMAINES_D_ACTIVITE, "l-avantage-concurrentiel"))[0]).toBe("SoundBox : 51 €, 28 € de coût variable, qualité de conception 0,96");
    expect(juste(DOMAINES_D_ACTIVITE, "specialisee")).toEqual(["Spécialisée : une gamme, un seul métier, celui du son"]);
    expect(Object.values(triDe(DOMAINES_D_ACTIVITE, "transparence-et-secret")).sort()).toEqual(["publier", "publier", "secret", "secret", "secret"]);
  });
});

describe("le cas du chapitre", () => {
  it("abandonner Go : 2 552 € perdus, 35,1 heures prises, 208,4 heures libres sur 700", () => {
    const heures = 0.18 * 195 + 0.3 * 1_160 + 0.5 * 217;
    expect(attendus(ABANDONNER_L_ENCEINTE_NOMADE, "ce-que-go-apporte")).toEqual([go, Math.round(0.18 * 195 * 100) / 100, Math.round((700 - heures) * 100) / 100]);
    expect(juste(ABANDONNER_L_ENCEINTE_NOMADE, "reponse")).toEqual([`Garder Go : elle rapporte ${go.toLocaleString("fr-FR")} € par mois`]);
  });
});
