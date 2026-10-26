import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";

/**
 * UN ATELIER ANNONCE LE NOMBRE DE SÉANCES QU'IL A (audit d'octobre 2026).
 *
 * La séance d'essai a été ajoutée en tête des ateliers sans reprendre leurs
 * textes : treize ateliers sur seize annonçaient une séance de moins dans leur
 * titre ou leur accroche (« Prendre les commandes de Nova en quatre séances »
 * pour cinq), et l'enseignant planifiait en conséquence. Le champ `format` était
 * déjà gardé ; les textes ne l'étaient pas.
 *
 * La garde lit les textes qui disent le TOTAL : le titre, l'accroche, le résumé,
 * et le nom des formats (« Six séances hebdomadaires »). Un nombre de séances
 * écrit là doit être celui du tableau des séances.
 */
const MOTS = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"];

function nombresDeSeances(texte: string): number[] {
  return [...texte.matchAll(/\b([a-zéè]+) séances\b/gi)]
    .map((m) => MOTS.indexOf(m[1]!.toLowerCase()))
    .filter((n) => n >= 0);
}

describe("le nombre de séances annoncé", () => {
  it("le titre, l'accroche, le résumé et le nom des formats disent le nombre réel de séances", () => {
    const faux: string[] = [];
    for (const a of ATELIERS) {
      const n = a.seances.length;
      const textes: [string, string][] = [
        ["titre", a.titre],
        ["pitch", a.pitch],
        ["resume", a.resume],
        ...(a.formats ?? []).map((f) => ["format", f.nom] as [string, string]),
      ];
      for (const [champ, texte] of textes) {
        for (const annonce of nombresDeSeances(texte)) {
          if (annonce !== n) faux.push(`${a.code} (${n} séances) : ${champ} annonce ${MOTS[annonce]} séances`);
        }
      }
    }
    expect(faux).toEqual([]);
  });
});
