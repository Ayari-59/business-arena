import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { scenarioByCode } from "@/config/scenarios/registry";
import { PERIODICITY_DAYS, type Periodicity } from "@/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "@/config/scenarios/situation-texte";
import { LIASSES } from "@/config/courriers/registre";
import { courrierDeLaPartie } from "@/config/courriers/de-la-partie";
import { textesDuCourrier } from "@/config/courriers/texte";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * MAILLE & CO ET PIXEL & CO : AU MOIS ET À L'ANNÉE, LE RÉCIT NE NOMME PLUS UN
 * MOMENT DU CALENDRIER.
 *
 * La saisonnalité se lit une valeur par tour à toutes les durées (ADR-01, en-tête
 * de `periodicity.ts`) : le tour 4 reste le tour du pic au mois comme à l'année.
 * Au mois, il n'est pourtant pas décembre, et à l'année un tour n'est ni Noël, ni
 * les soldes, ni la rentrée. Ces deux métiers parlaient beaucoup de Noël, des
 * soldes et des fêtes : le récit était faux à ces deux durées.
 *
 * Cette garde rend chaque situation des quatre scénarios du groupe et chaque
 * courrier des deux liasses (variante sans assurance comprise) au mois et à
 * l'année, et vérifie :
 *  · qu'aucun nom de mois, aucune saison du calendrier, aucune fête datée, ni
 *    « rentrée », « soldes », « vacances », « fêtes », « Black Friday » ou « fin
 *    d'année » ne reste, hors des exceptions nommées une par une ;
 *  · qu'au trimestre, le texte est octet pour octet celui des relevés
 *    (tests/fixtures/situations-batiment-boutique-ecommerce-au-trimestre.json et
 *    tests/fixtures/courriers-au-trimestre.json), aux seules corrections près des
 *    situations détectées, qui supposaient au trimestre même une saison que le
 *    tour n'avait pas (décision du propriétaire, `corrections-des-dates.ts`).
 */

const SCENARIOS = ["boutique", "boutique-mono", "ecommerce", "ecommerce-gamme"] as const;
const LES_LIASSES = ["boutique", "ecommerce"] as const;
const DUREES: Periodicity[] = ["month", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };

/**
 * Ce qui date. « été » ne compte qu'avec ce qui en fait une saison (« l'été »,
 * « en été », « cet été », « d'été ») : le participe passé (« a été payé ») ne
 * date rien. « soldes » au pluriel seulement : « le solde » est celui du compte.
 */
const QUI_DATE = new RegExp(
  [
    "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre",
    "décembre", "hiver", "printemps", "automne", "noël", "pâques", "toussaint", "rentrée", "soldes", "vacances",
    "fêtes", "black friday", "fin d'année", "l'été", "d'été", "en été", "cet été",
  ]
    .map((m) => `(?<!\\p{L})${m}(?!\\p{L})`)
    .join("|"),
  "giu",
);

/**
 * LES EXCEPTIONS, une par une, avec leur raison. La clé est « code : mot ». Une
 * exception qui ne sert plus fait échouer la garde : elle ne couvre rien en silence.
 */
const EXCEPTIONS: Record<string, string> = {};

const datesDe = (t: string) => [...t.matchAll(QUI_DATE)].map((m) => m[0].toLowerCase());

const SITUATIONS_AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-batiment-boutique-ecommerce-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, Record<string, string[]>>;
const COURRIERS_AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/courriers-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

const courriersDe = (liasse: string) => LIASSES.find((l) => l.code === liasse)!.courriers;

/** Les textes d'un courrier à cette durée, avec et sans assurance (la variante n'existe que pour quelques-uns). */
const lettres = (code: string, jours: number) => ({
  [code]: textesDuCourrier(courrierDeLaPartie(code, { jours })!),
  [`${code} (sans assurance)`]: textesDuCourrier(courrierDeLaPartie(code, { jours, assurance: false })!),
});

/** Chaque mot qui date, au mois ou à l'année, avec le texte qui le porte. */
interface Trouvaille {
  cle: string;
  mot: string;
  texte: string;
}

function trouvailles(code: string, textes: string[]): Trouvaille[] {
  return textes.flatMap((texte) => datesDe(texte).map((mot) => ({ cle: `${code} : ${mot}`, mot, texte })));
}

const situationsA = (code: (typeof SCENARIOS)[number], periodicity: Periodicity) =>
  scenarioByCode(code).situations.flatMap((def) =>
    trouvailles(def.code, textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]))),
  );

const courriersA = (liasse: string, periodicity: Periodicity) =>
  courriersDe(liasse).flatMap((c) =>
    Object.entries(lettres(c.code, PERIODICITY_DAYS[periodicity])).flatMap(([cle, textes]) => trouvailles(cle, textes)),
  );

const sansException = (ts: Trouvaille[]) =>
  ts.filter((t) => !EXCEPTIONS[t.cle]).map((t) => `${t.cle} dans « ${t.texte} »`);

describe("au mois et à l'année, le récit ne nomme plus un moment du calendrier", () => {
  for (const periodicity of DUREES) {
    describe(NOM[periodicity], () => {
      for (const code of SCENARIOS) {
        it(`les situations de ${code}`, () => {
          expect(sansException(situationsA(code, periodicity))).toEqual([]);
        });
      }
      for (const liasse of LES_LIASSES) {
        it(`les courriers de la liasse ${liasse}`, () => {
          expect(sansException(courriersA(liasse, periodicity))).toEqual([]);
        });
      }
    });
  }

  it("chaque exception sert encore", () => {
    const servies = new Set(
      DUREES.flatMap((p) => [
        ...SCENARIOS.flatMap((code) => situationsA(code, p)),
        ...LES_LIASSES.flatMap((l) => courriersA(l, p)),
      ]).map((t) => t.cle),
    );
    expect(Object.keys(EXCEPTIONS).filter((k) => !servies.has(k))).toEqual([]);
  });
});

describe("au trimestre, le texte est celui des relevés, octet pour octet", () => {
  for (const code of SCENARIOS) {
    it(`les situations de ${code}`, () => {
      const situations = scenarioByCode(code).situations;
      expect(situations.map((s) => s.code).sort()).toEqual(Object.keys(SITUATIONS_AVANT[code]!).sort());
      for (const def of situations) {
        expect(textesDe(situationDeLaPartie(def, PERIODICITY_DAYS.quarter)), def.code).toEqual(
          corrigerLesDates(def.code, SITUATIONS_AVANT[code]![def.code]!),
        );
      }
    });
  }
  for (const liasse of LES_LIASSES) {
    it(`les courriers de la liasse ${liasse}`, () => {
      for (const c of courriersDe(liasse)) {
        for (const [cle, textes] of Object.entries(lettres(c.code, PERIODICITY_DAYS.quarter))) {
          // La variante sans assurance n'est relevée que là où elle existe.
          if (!COURRIERS_AVANT[cle] && cle.endsWith("(sans assurance)")) {
            expect(textes, cle).toEqual(corrigerLesDates(c.code, COURRIERS_AVANT[c.code]!));
            continue;
          }
          expect(textes, cle).toEqual(corrigerLesDates(cle, COURRIERS_AVANT[cle]!));
        }
      }
    });
  }
});

/**
 * CE QUE LE RÉCIT DIT DU TOUR EST VRAI SUR LE TABLEAU DE SAISONNALITÉ.
 *
 * Au mois et à l'année, la phrase ne nomme plus Noël : elle dit « le plus gros tour
 * de la partie », « le tour du pic vient de… », « au tour du pic, juste après ».
 * Chacune de ces affirmations se vérifie ici sur les tableaux du scénario (une
 * valeur par tour, la même à toutes les durées) et sur le tour où la situation tombe.
 */
describe("au mois et à l'année, ce que le récit dit du tour est vrai sur les tableaux", () => {
  interface Tableau {
    nom: string;
    t: readonly number[];
  }

  /** Tous les tableaux d'un scénario : le marché, ses segments, chaque référence et ses segments. */
  function tableaux(code: (typeof SCENARIOS)[number]): Tableau[] {
    const s = scenarioByCode(code).scenario;
    const propres = (segments: { code: string; seasonality?: number[] }[]) =>
      segments.flatMap((g) => (g.seasonality ? [{ nom: g.code, t: g.seasonality }] : []));
    return [
      { nom: "marché", t: s.market.seasonality },
      ...propres(s.market.segments),
      ...(s.products ?? []).flatMap((p) => [
        { nom: p.code, t: p.market.seasonality ?? s.market.seasonality },
        ...propres(p.market.segments),
      ]),
    ];
  }

  /** Le tour du pic : celui du plus haut coefficient du marché, seul à ce niveau. */
  const tourDuPic = (t: readonly number[]) => {
    const haut = Math.max(...t);
    expect(t.filter((x) => x === haut), "un seul tour au plus haut").toHaveLength(1);
    return t.indexOf(haut) + 1;
  };

  /**
   * La pièce de mi-saison de MAILLE & CO : le cardigan culmine au tour 3 (1,2) et
   * non au pic (1,1). Le récit ne lui prête aucun pic : il parle des pulls, des
   * écharpes et des bonnets, et la boutique, elle, culmine bien au tour 4.
   */
  const SANS_PIC: Record<string, string> = { cardigan: "la pièce de mi-saison lisse la courbe" };

  for (const code of SCENARIOS) {
    it(`${code} : le plus gros tour de la partie est celui du pic, dans chaque tableau`, () => {
      const pic = tourDuPic(scenarioByCode(code).scenario.market.seasonality);
      for (const { nom, t } of tableaux(code)) {
        if (SANS_PIC[nom]) {
          expect(Math.max(...t), `${nom} n'a vraiment pas son pic au tour ${pic}`).toBeGreaterThan(t[pic - 1]!);
          continue;
        }
        expect(t.indexOf(Math.max(...t)) + 1, `${code} / ${nom}`).toBe(pic);
      }
    });
  }

  /** Les phrases qui situent le tour, et le tour où elles doivent tomber, depuis celui du pic. */
  const AFFIRMATIONS: { motif: RegExp; tour: (pic: number) => number }[] = [
    { motif: /plus gros tour de la|^Ce tour pèse/, tour: (pic) => pic },
    { motif: /Le tour du pic vient de/, tour: (pic) => pic + 1 },
    { motif: /au tour du pic, juste après|qui arrive au tour suivant|du pic qui arrive/, tour: (pic) => pic - 1 },
  ];

  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]}, chaque phrase qui situe le tour tombe au tour qu'elle dit`, () => {
      const vues = new Set<RegExp>();
      for (const code of SCENARIOS) {
        const pic = tourDuPic(scenarioByCode(code).scenario.market.seasonality);
        for (const def of scenarioByCode(code).situations) {
          for (const t of textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]))) {
            for (const a of AFFIRMATIONS.filter((x) => x.motif.test(t))) {
              vues.add(a.motif);
              expect("round" in def.trigger ? def.trigger.round : def.trigger, `${def.code} : « ${t} »`).toBe(
                a.tour(pic),
              );
            }
          }
        }
      }
      // Une garde qui ne trouve aucune phrase ne vérifie rien.
      expect(vues.size).toBe(AFFIRMATIONS.length);
    });
  }

  it("MAILLE & CO : écharpes et bonnets font plus du double au pic que juste avant", () => {
    const pic = tourDuPic(scenarioByCode("boutique").scenario.market.seasonality);
    const parNom = new Map(tableaux("boutique").map((x) => [x.nom, x.t]));
    for (const nom of ["echarpe", "bonnet"]) {
      const t = parNom.get(nom)!;
      expect(t[pic - 1]! / t[pic - 2]!, nom).toBeGreaterThan(2);
    }
  });

  it("PIXEL & CO : le tour qui suit le pic n'est pas le plus creux du tableau, le récit ne le dit plus", () => {
    for (const code of ["ecommerce", "ecommerce-gamme"] as const) {
      const t = scenarioByCode(code).scenario.market.seasonality;
      const pic = tourDuPic(t);
      expect(t[pic]!, code).toBeGreaterThan(Math.min(...t));
    }
  });
});
