import { describe, expect, it } from "vitest";
import { enTeteDuChapitre } from "@/config/cours/en-tete-du-chapitre";
import { essaiDuDiplome } from "@/config/cours/chapitres-libres";
import { chapitresDeLaPageDuDiplome } from "@/config/cours/parcours-de-formation";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { FORMATIONS, formationParCode } from "@/config/formations";

/**
 * L'EN-TÊTE D'UN CHAPITRE PORTE LE DIPLÔME D'OÙ L'ON VIENT (audit UX du 11 novembre 2026, P2-12 ; décision
 * du propriétaire du même jour). L'essai du BTS SAM ou du BUT GEA s'ouvrait sous « Bac STMG · … » alors que
 * l'adresse portait le diplôme.
 */

const titreDuParcours = (code: string) => PARCOURS.find((p) => p.code === code)!.titre;

describe("l'en-tête d'un chapitre", () => {
  it("nomme le diplôme de l'adresse quand le chapitre en est, puis la matière", () => {
    const bancal: string[] = [];
    for (const f of FORMATIONS) {
      for (const c of chapitresDeLaPageDuDiplome(f.code)) {
        const enTete = enTeteDuChapitre(c, f.code);
        const parcours = PARCOURS.find((p) => p.code === c.parcours)!;
        // Le diplôme du parcours lui-même : l'en-tête d'avant, qui le nomme déjà.
        if (parcours.formation === f.code) {
          if (enTete !== parcours.titre) bancal.push(`${f.code} · ${c.code} : ${enTete}`);
          continue;
        }
        if (!enTete.startsWith(`${f.sigle} · `)) bancal.push(`${f.code} · ${c.code} : ${enTete}`);
      }
    }
    expect(bancal).toEqual([]);
  });

  it("l'essai d'un diplôme s'ouvre sous son nom, pas sous celui d'un autre", () => {
    for (const f of FORMATIONS) {
      const essai = essaiDuDiplome(f.code);
      if (!essai || essai.diplome.code !== f.code) continue;
      const enTete = enTeteDuChapitre(essai.chapitre, f.code);
      const parcours = PARCOURS.find((p) => p.code === essai.chapitre.parcours)!;
      if (parcours.formation === f.code) expect(enTete, f.code).toBe(parcours.titre);
      else if (enTete !== parcours.titre) expect(enTete, f.code).toMatch(new RegExp(`^${f.sigle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} · `));
    }
    // Le cas de l'audit : un chapitre d'un parcours d'un autre diplôme, ouvert depuis le BUT TC.
    const negocier = CHAPITRES.find((c) => c.code === "negocier-le-prix")!;
    expect(titreDuParcours(negocier.parcours)).toBe("BTS NDRC · Négocier et développer la relation client");
    expect(enTeteDuChapitre(negocier, "but-tc")).toBe(`${formationParCode("but-tc")!.sigle} · Négocier et développer la relation client`);
  });

  it("sans diplôme, avec un diplôme inconnu, ou pour un chapitre qui n'en est pas : le parcours, comme avant", () => {
    const c = CHAPITRES.find((x) => x.code === "creation-premier-bilan")!;
    expect(enTeteDuChapitre(c, null)).toBe(titreDuParcours(c.parcours));
    expect(enTeteDuChapitre(c, "pas-un-diplome")).toBe(titreDuParcours(c.parcours));
    expect(enTeteDuChapitre(c, "bts-cg")).toBe("BTS CG · Comptabilité générale");
    // Un chapitre hors de la page du diplôme garde son parcours (un lien d'un chapitre à l'autre garde le diplôme).
    const ailleurs = CHAPITRES.find((x) => !chapitresDeLaPageDuDiplome("bts-mco").some((y) => y.code === x.code))!;
    expect(enTeteDuChapitre(ailleurs, "bts-mco")).toBe(titreDuParcours(ailleurs.parcours));
  });
});
