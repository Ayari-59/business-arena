import { describe, expect, it } from "vitest";
import { arrondi2, natureDuChamp } from "../../src/pedagogy/cours/deux-decimales";
import { champJuste } from "../../src/pedagogy/cours/correcteur";
import { egalitesDuCorrige, type Substitutions } from "../helpers/chaines-des-corriges";
import { etapesDeMontants } from "../helpers/corriges-du-cours";

/**
 * L'ÉLÈVE QUI N'ARRONDIT QU'À LA FIN EST ACCEPTÉ (décision du propriétaire, 11 novembre 2026 : « accepter
 * les deux chemins » ; audit pédagogique, P1-1).
 *
 * La règle des deux décimales arrondit chaque ligne, et promettait l'élève qui n'arrondit qu'à la fin
 * accepté par la tolérance d'un centième (pedagogy/cours/deux-decimales.ts). C'était faux dès qu'un
 * résultat arrondi est repris et multiplié : « 1,88 × 28 560 € − 8 500 € = 45 192,80 € » refusait
 * l'élève qui gardait 1,875 compte (45 050 €), et 45 champs au moins faisaient de même.
 *
 * Pour chaque champ de montant, de pourcentage ou de grandeur du cours (chapitres et cas pratiques, dans
 * chaque entreprise où ils se jouent), la garde refait la chaîne de calcul de son corrigé sans arrondi
 * intermédiaire (tests/helpers/chaines-des-corriges.ts : un résultat arrondi de l'étape, repris plus
 * loin, y garde tous ses chiffres), l'arrondit à la fin, et vérifie que le champ l'accepte, par son
 * attendu ou par son autre chemin (`autreChemin`). Elle vérifie aussi que chaque autre chemin déclaré
 * est bien celui que le corrigé donne sans arrondi, ou un résultat que l'étape écrit, ou un chemin nommé
 * ci-dessous, avec sa raison.
 */

/**
 * LES AUTRES CHEMINS QUE LE CORRIGÉ NE CALCULE PAS, chacun avec sa raison : un résultat arrondi d'une étape
 * précédente (la garde ne suit les reprises que dans une même étape), ou un corrigé qui garde tous les
 * chiffres, l'autre chemin étant alors celui de la ligne arrondie.
 */
const AUTRES_CHEMINS_HORS_DU_CORRIGE: Readonly<Record<string, string>> = {
  "valeur-d-un-client / recruter-ou-fideliser / Journées demandées par le plus grand portefeuille":
    "le corrigé garde le portefeuille d'équilibre avec tous ses chiffres (8 ÷ 18,75 % × 60 = 2 560 journées) ; l'autre chemin part du portefeuille arrondi de la ligne d'avant, 42,67 × 60 = 2 560,20",
};

const ETAPES = etapesDeMontants();
const tolerance = (c: { tolerance?: number }) => (c.tolerance ?? 0.01) + 1e-9;

interface Lu {
  ou: string;
  cle: string;
  libelle: string;
  attendu: number;
  autreChemin?: number;
  /** Le résultat sans arrondi intermédiaire, arrondi à la fin ; null si le corrigé ne se lit pas jusqu'à l'attendu. */
  exact: number | null;
  /** Un résultat que le corrigé ou l'explication de l'étape écrit, dans une égalité qui tient. */
  ecrits: number[];
  accepte: boolean;
}

const LUS: Lu[] = ETAPES.flatMap((e) => {
  const subst: Substitutions = new Map();
  // Les résultats que l'explication de l'étape écrit, dans une égalité qui tient.
  const expliques = e.explication.flatMap((t) => egalitesDuCorrige(t).filter((x) => x.tient).map((x) => x.droite));
  return e.champs.flatMap((c): Lu[] => {
    const egalites = egalitesDuCorrige(c.calcul, subst);
    const nature = natureDuChamp(c);
    if (nature === "quantite" || nature === "coefficient") return [];
    const finale = [...egalites].reverse().find((x) => x.tient && Math.abs(Math.abs(x.droite) - Math.abs(c.attendu)) <= tolerance(c));
    const exact = finale ? (c.attendu < 0 ? -1 : 1) * arrondi2(Math.abs(finale.exact)) : null;
    const ecrits = [...egalites.filter((x) => x.tient).map((x) => x.droite), ...expliques];
    return [
      {
        ou: e.ou,
        cle: `${e.code} / ${e.etape} / ${c.libelle}`,
        libelle: c.libelle,
        attendu: c.attendu,
        ...(c.autreChemin !== undefined ? { autreChemin: c.autreChemin } : {}),
        exact,
        ecrits,
        accepte: exact === null || champJuste(String(exact).replace(".", ","), c),
      },
    ];
  });
});

describe("l'élève qui n'arrondit qu'à la fin est accepté", () => {
  it("le correcteur accepte l'attendu et l'autre chemin, chacun à sa tolérance", () => {
    const champ = { attendu: 45_192.8, autreChemin: 45_050 };
    expect(["45192,80", "45 192,81", "45050", "45 049,99"].map((t) => champJuste(t, champ))).toEqual([true, true, true, true]);
    expect(["45121,40", "45050,02", ""].map((t) => champJuste(t, champ))).toEqual([false, false, false]);
    expect(champJuste("45050", { attendu: 45_192.8 })).toBe(false);
  });

  it(`${LUS.length} champs de montant, de pourcentage ou de grandeur, dont ${LUS.filter((l) => l.exact !== null).length} se refont sans arrondi`, () => {
    expect(LUS.length).toBeGreaterThan(4_500);
    expect(LUS.filter((l) => l.exact !== null).length).toBeGreaterThan(4_000);
  });

  it("chaque champ accepte le calcul exact, arrondi à la fin", () => {
    const refuses = [...new Set(LUS.filter((l) => !l.accepte).map((l) => `${l.ou} : ${l.libelle} : attendu ${l.attendu}, sans arrondi intermédiaire ${l.exact}`))];
    expect(refuses).toEqual([]);
  });

  it("chaque autre chemin est le calcul exact du corrigé, un résultat que l'étape écrit, ou un chemin nommé", () => {
    const douteux = LUS.filter((l) => l.autreChemin !== undefined)
      .filter((l) => {
        const t = 0.01 + 1e-9;
        if (l.exact !== null && Math.abs(l.exact - l.attendu) > t) return Math.abs(l.exact - l.autreChemin!) > t;
        if (l.ecrits.some((x) => Math.abs(Math.abs(x) - Math.abs(l.autreChemin!)) <= t)) return false;
        return !(l.cle in AUTRES_CHEMINS_HORS_DU_CORRIGE);
      })
      .map((l) => `${l.ou} : ${l.libelle} : autre chemin ${l.autreChemin}, sans arrondi intermédiaire ${l.exact ?? "non lu"}`);
    expect([...new Set(douteux)]).toEqual([]);
  });

  it("la liste des chemins nommés n'a pas d'entrée morte", () => {
    const servis = new Set(LUS.filter((l) => l.autreChemin !== undefined).map((l) => l.cle));
    expect(Object.keys(AUTRES_CHEMINS_HORS_DU_CORRIGE).filter((k) => !servis.has(k))).toEqual([]);
  });
});
