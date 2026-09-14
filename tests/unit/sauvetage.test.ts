import { describe, expect, it } from "vitest";
import { messageSauvetage, verdictSauvetage } from "@/services/sauvetage";
import { formatEuro } from "@/lib/format";

/**
 * LA RÈGLE DU FINANCEMENT DE SAUVETAGE, ÉCRITE UNE FOIS.
 *
 * L'écran s'en sert pour dire ce qui manque et bloquer le bouton, l'action
 * serveur pour refuser une décision qui n'y répond pas. Deux usages, une seule
 * règle : c'est ce qui évite qu'un écran autorise ce que le serveur refusera —
 * la pire des expériences, puisque l'élève ne comprend ni pourquoi il est
 * bloqué ni ce qu'il faut changer.
 */

const exigence = { manque: 46000, capaciteEmprunt: 70000, enveloppeApport: 50000 };

describe("verdictSauvetage", () => {
  it("emprunt et apport se cumulent : c'est le total qui compte", () => {
    expect(verdictSauvetage(exigence, { emprunt: 46000, apport: 0 }).suffisant).toBe(true);
    expect(verdictSauvetage(exigence, { emprunt: 0, apport: 46000 }).suffisant).toBe(true);
    expect(verdictSauvetage(exigence, { emprunt: 30000, apport: 16000 }).suffisant).toBe(true);
  });

  it("en dessous, il dit ce qu'il reste à trouver", () => {
    const v = verdictSauvetage(exigence, { emprunt: 20000, apport: 6000 });
    expect(v.suffisant).toBe(false);
    if (!v.suffisant) {
      expect(v.reste).toBe(20000);
      expect(v.leviersEpuises).toBe(false);
    }
  });

  it("à un euro près : les montants viennent de calculs flottants", () => {
    // Refuser une décision pour 40 centimes d'écart serait incompréhensible.
    expect(verdictSauvetage(exigence, { emprunt: 45999.6, apport: 0 }).suffisant).toBe(true);
  });

  it("des montants négatifs ne créent pas de trésorerie", () => {
    // Le garde-fou du bricolage : saisir −50 000 dans un champ ne doit pas
    // compenser un emprunt insuffisant.
    const v = verdictSauvetage(exigence, { emprunt: 46000, apport: -10000 });
    expect(v.suffisant).toBe(true);
    const w = verdictSauvetage(exigence, { emprunt: -10000, apport: 10000 });
    expect(w.suffisant).toBe(false);
  });

  it("reconnaît le cas où les deux leviers sont épuisés", () => {
    // LE CAS QUI COMPTE : même en empruntant et en apportant tout ce qui est
    // possible, le compte n'y est pas. C'est lui qui ouvrira la subvention
    // exceptionnelle — et d'ici là, bloquer l'équipe serait une impasse.
    const mur = { manque: 200000, capaciteEmprunt: 40000, enveloppeApport: 30000 };
    const v = verdictSauvetage(mur, { emprunt: 40000, apport: 30000 });
    expect(v.suffisant).toBe(false);
    if (!v.suffisant) expect(v.leviersEpuises).toBe(true);
  });

  it("sans plafond déclaré, les leviers ne sont jamais épuisés", () => {
    // Un scénario sans capacité d'endettement ni enveloppe d'apport laisse
    // toujours une porte : on ne déclare pas une impasse qui n'existe pas.
    const libre = { manque: 900000, capaciteEmprunt: null, enveloppeApport: null };
    const v = verdictSauvetage(libre, { emprunt: 0, apport: 0 });
    expect(v.suffisant).toBe(false);
    if (!v.suffisant) expect(v.leviersEpuises).toBe(false);
  });
});

describe("messageSauvetage", () => {
  it("ne dit rien quand le compte y est", () => {
    expect(messageSauvetage({ suffisant: true }, formatEuro)).toBeNull();
  });

  it("nomme le montant manquant et les deux leviers", () => {
    const m = messageSauvetage(verdictSauvetage(exigence, { emprunt: 0, apport: 0 }), formatEuro)!;
    expect(m).toMatch(/46\s000\s€/);
    expect(m).toContain("Empruntez");
    expect(m).toContain("associés");
  });

  it("quand les leviers sont épuisés, il le dit au lieu de réclamer l'impossible", () => {
    const mur = { manque: 200000, capaciteEmprunt: 40000, enveloppeApport: 30000 };
    const m = messageSauvetage(verdictSauvetage(mur, { emprunt: 40000, apport: 30000 }), formatEuro)!;
    expect(m).toContain("épuisés");
    expect(m).not.toContain("Empruntez");
  });
});
