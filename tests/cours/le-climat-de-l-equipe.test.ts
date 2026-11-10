import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { LE_CLIMAT_DE_L_EQUIPE } from "../../src/config/cours/chapitres/le-climat-de-l-equipe";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { RETENIR_LA_VENDEUSE } from "../../src/config/cours/situations/par-chapitre/retenir-la-vendeuse";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE CLIMAT DE L'ÉQUIPE, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : RETENIR LA VENDEUSE.
 *
 * Les indicateurs sociaux, le coût des absences, la panne de caisse et le départ d'une vendeuse sont
 * refaits à la main sur la fiche (les heures des contrats, la caisse de janvier, l'affluence du
 * samedi) et les hypothèses du module de l'équipe. Le laboratoire n'a qu'une solution. Puis les
 * gardes de la boutique, et la bonne réponse jamais la plus longue.
 */

const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const ch = LE_CLIMAT_DE_L_EQUIPE;
const MARGE_D_UN_PASSAGE = 41.44;
const HEURE_COMPLEMENTAIRE = 19.53;

function jamaisLaPlusLongue(c: Chapitre) {
  for (const e of chapitreDuCas(c, BOUTIQUE).etapes) {
    if (e.type !== "choix") continue;
    const o = e.options(BOUTIQUE, VIDE);
    const bonne = o.find((k) => k.juste)!;
    expect(bonne.texte.length, `${c.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
  }
}

describe("le climat de l'équipe : le chapitre", () => {
  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 4, en fin de programme", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).not.toBeNull();
    expect(PROGRAMME.mco[4]!.at(-1)).toBe(ch.titre);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(casDuChapitre(ch.code)).toBe(RETENIR_LA_VENDEUSE);
  });

  it("les indicateurs sociaux et le coût des absences", () => {
    const heures = centime(f.equipe.reduce((t, s) => t + centime((s.heuresParSemaine * 52) / 12), 0));
    expect(heures).toBe(715.01);
    expect(attendus(ch, "les-indicateurs-sociaux")).toEqual([centime((31 / heures) * 100), centime((18 / 104) * 100), centime(((2 + 2) / 2 / 6) * 100)]);
    expect(centime(12.5 * 1.1 * 1.42 + 1e-9)).toBe(HEURE_COMPLEMENTAIRE);
    const remplacement = centime(14 * HEURE_COMPLEMENTAIRE);
    const perdue = centime(17 * MARGE_D_UN_PASSAGE);
    expect(attendus(ch, "le-cout-des-absences")).toEqual([HEURE_COMPLEMENTAIRE, remplacement, perdue, centime(remplacement + perdue), centime((remplacement + perdue) * 12)]);
    expect(centime(remplacement + perdue)).toBe(977.9);
    expect(juste(ch, "predire-le-remplacement")).toEqual(["Remplacer le plus d'heures possible"]);
  });

  it("le laboratoire des absences : remplacer les 15 heures permises, et seulement elles", () => {
    gardeDuLaboratoire(ch, "le-laboratoire-des-absences");
    const d = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-des-absences", "simulation").defi(BOUTIQUE);
    expect(d.solution).toEqual({ absences: 31, remplacees: 15 });
    const e = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-des-absences", "simulation");
    const lu = Object.fromEntries(e.lecture(BOUTIQUE, d.solution).map((l) => [l.libelle, l.montant]));
    expect(lu["Coût du mois"]).toBe(centime(15 * HEURE_COMPLEMENTAIRE + 16 * MARGE_D_UN_PASSAGE));
  });

  it("les signes, le conflit, l'entretien, la réunion et le client agressif", () => {
    const tri = etape(chapitreDuCas(ch, BOUTIQUE), "signes-et-facteurs", "tri").elements(BOUTIQUE);
    expect(tri.map((t) => t.categorie)).toEqual(["signe", "signe", "signe", "facteur", "facteur", "facteur"]);
    expect(tri.map((t) => t.montant)).toEqual([4, 18, 18.18, 3, 12_480, 2]);
    expect(juste(ch, "le-conflit")).toEqual(["Un conflit d'intérêt : une médiation, puis une règle commune"]);
    expect(juste(ch, "l-entretien")).toEqual(["Elle prépare les faits, écoute, reformule et convient d'un plan"]);
    expect(juste(ch, "la-reunion")[0]).toMatch(/^Une réunion, puis le planning affiché 7 jours ouvrés avant$/);
    expect(juste(ch, "le-client-agressif")).toEqual(["Le rejoindre, parler calmement, isoler le client"]);
    expect(juste(ch, "la-premiere-mesure")).toEqual(["Un entretien avec lui, puis la règle des samedis"]);
  });

  it("la panne de caisse d'un samedi, refaite sur l'affluence et la caisse de janvier", () => {
    const semaine = Object.values(f.affluence).flat().reduce((t, v) => t + v, 0);
    expect(semaine).toBe(888);
    const panne = f.affluence.samedi[4]! + f.affluence.samedi[5]! + f.affluence.samedi[6]!;
    expect(panne).toBe(74);
    const ventes = centime(((77_250 * 12) / 52) * (panne / semaine));
    const taux = (87_450 - 43_200) / 87_450;
    expect(attendus(ch, "la-panne-de-caisse")).toEqual([ventes, centime(ventes * 0.8), centime(ventes * 0.1), centime((centime(ventes * 0.8) - centime(ventes * 0.1)) * taux)]);
    expect(juste(ch, "le-plan-de-communication")).toEqual(["Un vendeur à la porte et un message clair, répété"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
  });
});

describe("retenir la vendeuse : le cas", () => {
  const s = RETENIR_LA_VENDEUSE;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
    jamaisLaPlusLongue(s);
  });

  it("le coût du départ et celui de la demande, refaits à la main", () => {
    const vacance = centime(22 * 2 * MARGE_D_UN_PASSAGE);
    const manques = centime((140 / (52 / 12)) * (0.4 + 0.2 + 0.05));
    expect(manques).toBe(21);
    const apprentissage = centime(manques * MARGE_D_UN_PASSAGE);
    expect(attendus(s, "le-cout-du-depart")).toEqual([vacance, manques, apprentissage, centime(344.91 + vacance + apprentissage)]);
    const horaire = 2_000 / 151.67;
    // Le taux horaire de la copie, au centime : 13,19 €.
    const parMois = centime(8 * centime(horaire) * 1.25 * 1.42);
    expect(attendus(s, "le-cout-de-la-demande")).toEqual([centime(horaire), parMois, centime(parMois * 12)]);
    expect(centime(parMois * 12)).toBeLessThan(centime(344.91 + vacance + apprentissage));
    expect(juste(s, "reponse")).toEqual(["Accepter, et passer les samedis en roulement pour tous"]);
  });
});
