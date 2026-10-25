import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { CHAPITRES } from "../../src/config/cours/registre";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { projectionDeLEtape } from "../../src/pedagogy/cours/projection";
import { REMARQUES_PAR_ETAPE, type ProgressionLue } from "../../src/pedagogy/cours/suivi";
import type { EtapeChoix } from "../../src/config/cours/types";

/**
 * LA PROJECTION COMPTE CE QUE LA CLASSE A RÉPONDU.
 *
 * Une question à choix du chapitre pilote, quatre élèves : l'un juste du premier coup, un
 * autre après une erreur, un troisième avec la correction, un quatrième dans une autre
 * entreprise, dont les montants diffèrent mais qui s'est trompé de la même réponse. Chaque
 * réponse compte ses élèves à sa place dans la liste ; les compteurs de l'étape s'accordent.
 */

const pilote = CHAPITRES[0]!;
const nova = casDeLEntreprise("nova");
const hotel = casDeLEntreprise("hotel");
const etape = chapitreDuCas(pilote, nova).etapes.find((e): e is EtapeChoix => e.type === "choix")!;
const optionsDe = (code: "nova" | "hotel") => {
  const cas = code === "nova" ? nova : hotel;
  const ch = chapitreDuCas(pilote, cas);
  const i = ch.etapes.findIndex((e) => e.id === etape.id);
  return (ch.etapes[i] as EtapeChoix).options(cas, etatAvant(ch, cas, i));
};
const fausse = (code: "nova" | "hotel") => optionsDe(code).findIndex((o) => !o.juste);
const eleve = (nom: string, entreprise: string, s: ProgressionLue["etapes"][string], erreurs: string[] = []): ProgressionLue => ({
  eleve: nom,
  entreprise,
  etape: 99,
  etapes: { [etape.id]: s },
  erreurs: erreurs.length ? { [etape.id]: erreurs } : {},
  majLe: new Date(0),
});

describe("une question à choix projetée", () => {
  const progressions = [
    eleve("Ana", "nova", { essais: 1, reussi: true, aide: false }),
    eleve("Béa", "nova", { essais: 2, reussi: true, aide: false }, [`A répondu : « ${optionsDe("nova")[fausse("nova")]!.texte} »`]),
    eleve("Cyril", "nova", { essais: 1, reussi: true, aide: true }),
    eleve("Dina", "hotel", { essais: 1, reussi: false, aide: false }, [`A répondu : « ${optionsDe("hotel")[fausse("hotel")]!.texte} »`]),
    { ...eleve("Éli", "nova", { essais: 0, reussi: false, aide: false }), etapes: {}, etape: 0 },
  ];
  const p = projectionDeLEtape({ chapitre: pilote, cas: nova, id: etape.id, progressions, casDe: casDeLEntreprise })!;

  it("chaque réponse compte ses élèves, quelle que soit leur entreprise", () => {
    expect(p.reponses).not.toBeNull();
    const juste = p.reponses!.findIndex((r) => r.juste);
    expect(p.reponses![juste]!.eleves).toBe(2); // Ana et Béa l'ont trouvée ; Cyril l'a reçue.
    // Les réponses viennent dans l'ordre affiché (mélangé) : la fausse se retrouve par son texte.
    const laFausse = p.reponses!.find((r) => r.texte === optionsDe("nova")[fausse("nova")]!.texte)!;
    expect(laFausse.eleves).toBe(2); // Béa (nova) et Dina (hôtel).
    expect(p.reponses!.reduce((t, r) => t + r.eleves, 0)).toBe(4);
  });

  it("les compteurs de l'étape s'accordent, et aucun nom n'apparaît", () => {
    expect(p.eleves).toBe(5);
    expect(p.atteinte).toBe(4);
    expect(p.premierCoup).toBe(1);
    expect(p.apresErreur).toBe(1);
    expect(p.aidees).toBe(1);
    expect(p.enCours).toBe(1);
    expect(JSON.stringify(p)).not.toMatch(/Ana|Béa|Cyril|Dina|Éli/);
  });

  it("une étape inconnue ne se projette pas", () => {
    expect(projectionDeLEtape({ chapitre: pilote, cas: nova, id: "n-existe-pas", progressions, casDe: casDeLEntreprise })).toBeNull();
  });
});

describe("une écriture projetée", () => {
  const apport = chapitreDuCas(pilote, nova).etapes.find((e) => e.type === "ecriture")!;
  const remarques = ["Le débit d'abord.", "Le compte 512.", "Le montant.", "La date.", "Le libellé."];
  // Le premier élève fait toutes les erreurs, le deuxième les deux premières, le troisième la première.
  const progressions: ProgressionLue[] = [5, 2, 1].map((n, i) => ({
    eleve: `Élève ${i}`,
    entreprise: i === 1 ? "hotel" : "nova",
    etape: 99,
    etapes: { [apport.id]: { essais: 2, reussi: true, aide: false } },
    erreurs: { [apport.id]: remarques.slice(0, n) },
    majLe: new Date(0),
  }));
  const p = projectionDeLEtape({ chapitre: pilote, cas: nova, id: apport.id, progressions, casDe: casDeLEntreprise })!;

  it("les remarques les plus fréquentes d'abord, pas plus que la vue de la classe", () => {
    expect(p.reponses).toBeNull();
    expect(p.remarques).toHaveLength(REMARQUES_PAR_ETAPE);
    expect(p.remarques.slice(0, 2)).toEqual([
      { texte: "Le débit d'abord.", eleves: 3 },
      { texte: "Le compte 512.", eleves: 2 },
    ]);
    expect(p.apresErreur).toBe(3);
  });
});
