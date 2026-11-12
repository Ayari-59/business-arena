import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { RECRUTER_INTEGRER_FORMER, recruterIntegrerFormer } from "../../src/config/cours/chapitres/recruter-integrer-former";
import { meilleurRenfort, renfortDeDecembre } from "../../src/config/cours/monde/equipe-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { UN_APPRENTI_OU_UN_TEMPS_PARTIEL } from "../../src/config/cours/situations/par-chapitre/un-apprenti-ou-un-temps-partiel";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import type { Chapitre } from "../../src/config/cours/types";
import { BOUTIQUE, VIDE, attendus, etape, gardeDuCas, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * RECRUTER, INTÉGRER, FORMER, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : UN APPRENTI OU UN TEMPS
 * PARTIEL ?
 *
 * Les chiffres sont refaits à la main : le besoin de décembre (l'affluence à 1,8 fois janvier, créneau
 * par créneau), le coût d'un CDD et de ses indemnités, le coût d'un recrutement aux taux horaires
 * chargés de la fiche, le renfort le moins cher, la courbe d'apprentissage, la formation, puis
 * l'apprenti face au temps partiel. Puis les gardes de la boutique.
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
const ch = RECRUTER_INTEGRER_FORMER;
const x = recruterIntegrerFormer(BOUTIQUE);
const taux = (code: string) => {
  const s = f.equipe.find((k) => k.code === code)!;
  // Le taux horaire chargé de la copie, au centime : c'est lui que l'élève multiplie.
  return centime(centime(s.brutMensuel * 1.42) / centime((s.heuresParSemaine * 52) / 12));
};

describe("recruter, intégrer, former : le chapitre", () => {
  it("se joue chez MAILLE & CO seule, au palier 4 du BTS MCO, bloc 4, en fin de programme", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("mco");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 4 · Manager l'équipe commerciale"]);
    for (const b of ch.blocs) expect(blocOfficiel(b, referentielDeCitation(b)!.code), b).not.toBeNull();
    expect(PROGRAMME.mco[4]).toContain(ch.titre);
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(casDuChapitre(ch.code)).toBe(UN_APPRENTI_OU_UN_TEMPS_PARTIEL);
  });

  it("le besoin de décembre et le coût d'un CDD", () => {
    // À 1,8 fois l'affluence, aucun créneau n'a d'heures en trop : 230 heures de vente, plus 20 de tâches.
    expect(attendus(ch, "le-besoin-de-decembre")).toEqual([250, 165, 85]);
    const salaires = 35 * 4 * 12.5;
    const ifc = salaires * 0.1;
    const cp = (salaires + ifc) * 0.1;
    const cout = centime((salaires + ifc + cp) * 1.42);
    expect([salaires, ifc, cp, cout]).toEqual([1_750, 175, 192.5, 3_006.85]);
    expect(attendus(ch, "le-cout-d-un-cdd")).toEqual([salaires, ifc, cp, cout, centime(cout / 140)]);
    expect(juste(ch, "quel-motif")).toEqual(["Un CDD pour accroissement temporaire d'activité"]);
    expect(juste(ch, "le-profil-de-poste")).toEqual(["Vendeur, l'accueil, libre le samedi"]);
  });

  it("le coût du recrutement, aux taux horaires chargés de la responsable et de l'adjointe", () => {
    const tri = centime(2 * taux("responsable"));
    // 4,5 h × (25,28 + 20,13) = 204,345 : le demi-centime s'arrondit au-dessus.
    const entretiens = centime(6 * 0.75 * (taux("responsable") + taux("adjointe")) + 1e-9);
    const total = centime(90 + tri + entretiens);
    expect([tri, entretiens, total]).toEqual([50.56, 204.35, 344.91]);
    expect(attendus(ch, "le-cout-du-recrutement")).toEqual([tri, entretiens, total, centime((3_006.85 + total) / 140)]);
  });

  it("le laboratoire du renfort : les avenants, un CDD, l'intérim pour l'appoint", () => {
    const m = meilleurRenfort(f);
    expect([m.avenants, m.cdd, m.interim]).toEqual([24, 1, 26]);
    const avenants = 24 * 4 * 12.5 * 1.42;
    const cdd = 3_006.85 + 344.91;
    const interim = 26 * 4 * 12.5 * 2.1;
    expect(m.r.total).toBe(centime(avenants + cdd + interim));
    expect(m.r.total).toBe(7_785.76);
    const e = etape(chapitreDuCas(ch, BOUTIQUE), "le-laboratoire-du-renfort", "simulation");
    const d = e.defi(BOUTIQUE);
    expect(d.atteint({ avenants: 0, cdd: 0, interim: 0 })).toBe(false);
    expect(d.atteint(d.solution)).toBe(true);
    expect(d.atteint({ avenants: 24, cdd: 1, interim: 27 })).toBe(false);
    expect(d.atteint({ avenants: 24, cdd: 2, interim: 0 })).toBe(false);
    expect(renfortDeDecembre(f, { avenants: 0, cdd: 0, interim: 85 }).total).toBe(85 * 4 * 26.25);
    expect(juste(ch, "predire-le-renfort")).toEqual(["Un CDD, puis l'intérim pour l'appoint"]);
    expect(juste(ch, "quel-renfort-retenir")).toEqual(["Les avenants, 1 CDD intégré, l'intérim pour 26 h"]);
  });

  it("le droit du recrutement : l'entretien, la période d'essai, la déclaration", () => {
    expect(juste(ch, "l-entretien")).toEqual(["Que proposeriez-vous à un client qui hésite ?"]);
    expect(attendus(ch, "la-periode-d-essai")).toEqual([4, 8]);
    expect(juste(ch, "le-plan-de-formation")).toEqual(["Non : une formation d'adaptation au poste est du temps de travail payé"]);
  });

  it("la courbe d'apprentissage et la formation", () => {
    const parSemaine = 35 * 3;
    const sans = centime(parSemaine * (0.4 + 0.2 + 0.05));
    const avec = centime(parSemaine * (0.2 + 0.05));
    expect([sans, avec]).toEqual([68.25, 26.25]);
    const tutorat = centime(6 * taux("adjointe"));
    expect(attendus(ch, "la-courbe-d-apprentissage")).toEqual([sans, avec, centime((sans - avec) * 38.43), centime((sans - avec) * 38.43 - tutorat)]);
    const heures = centime(7 * (taux("adjointe") + taux("vendeur") + 3 * taux("vendeuse-partiel")));
    const cout = centime(5 * 280 * 0.5 + heures);
    // La marge d'un article au centime, 29,29 €, comme sur la copie.
    const gain = centime(770 * 0.05 * centime(38_950 / 1_330));
    expect([cout, gain]).toEqual([1_344.7, 1_127.67]);
    expect(attendus(ch, "la-formation")).toEqual([cout, gain, centime(cout / gain)]);
    expect(x.fo.passages).toBe(940 - 170);
  });

  // Servi dans chaque entreprise, le chapitre dépasse les 5 s par défaut sous la suite entière (déjà
  // vrai sur 467c0aa, 5,5 s seul) : la garde a sa durée à elle.
  it("textes propres, une seule bonne réponse, notions existantes", () => {
    gardesDeTexte(ch);
    jamaisLaPlusLongue(ch);
    jamaisLaPlusLongue(UN_APPRENTI_OU_UN_TEMPS_PARTIEL);
  }, 60_000);
});

describe("un apprenti ou un temps partiel ? : le cas", () => {
  const s = UN_APPRENTI_OU_UN_TEMPS_PARTIEL;
  it("reprend son chapitre, sans cours, avec une réponse", () => {
    gardeDuCas(s, ch);
  });

  it("l'apprenti face au CDI de 24 heures, refaits à la main", () => {
    const brut = centime(1_867.02 * 0.53);
    const salaire = centime(brut * 1.08 * 12);
    const tutorat = centime(2 * 47 * taux("adjointe"));
    const net = centime(salaire - 5_000 + tutorat);
    expect(attendus(s, "l-apprenti")).toEqual([brut, salaire, tutorat, net]);
    expect(brut).toBe(989.52);
    const cdi = 1_300 * 1.42 * 12;
    expect(attendus(s, "l-heure-en-boutique")).toEqual([cdi, 24 * 47, 21 * 47, centime(cdi / (24 * 47)), centime(net / (21 * 47))]);
    expect(centime(net / (21 * 47))).toBeLessThan(centime(cdi / (24 * 47)));
    expect(juste(s, "le-contrat-d-apprentissage")).toEqual(["Les jours à l'école sont du temps de travail, payés"]);
    expect(juste(s, "reponse")).toEqual(["L'apprenti : moins cher à l'heure, et la relève"]);
  });
});
