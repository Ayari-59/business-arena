import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { SCENARIOS, scenarioByCode } from "@/config/scenarios/registry";
import { applyPeriodicity, PERIODICITY_DAYS, type Periodicity } from "@/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "@/config/scenarios/situation-texte";
import { courrierDeLaPartie } from "@/config/courriers/de-la-partie";
import { textesDuCourrier } from "@/config/courriers/texte";
import { COURRIERS, COURRIERS_ENTREPRISE_CODES, COURRIERS_MARCHE_CODES, LIASSES } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE } from "@/config/courriers/routine";
import { COURRIERS_EN_RETOUR } from "@/config/courriers/reponses";
import { ETAPES_D_INVESTISSEMENT } from "@/config/investissement-par-niveau";
import * as GROUPE from "@/config/groupe/nova";
import * as GAZETTE from "@/config/gazette/banque";
import { CORRECTIONS_DES_DATES } from "./corrections-des-dates";

/**
 * CE QUI NE PASSE PAS PAR LE RÉCIT À LA DURÉE NE DATE AUCUN TOUR, À AUCUNE DURÉE.
 *
 * Le récit des situations et des courriers se rend à la durée du tour : au
 * trimestre il garde ses dates, au mois et à l'année il dit ce que le tour est
 * pour le moteur (gardes `saisons-*.test.ts` de chaque groupe). Des textes
 * échappent à ce mécanisme, et une date y est fausse au trimestre même :
 *
 *  · LES TEXTES DE CONFIGURATION AFFICHÉS : noms de segments et de références,
 *    offres de commande, fournisseurs, accueil et dilemme du registre, module de
 *    NOVA Home, motifs de la gazette. Ils s'affichent tels quels, à tout tour où
 *    ils tombent : une offre se tire à n'importe quel tour, un nom de segment se
 *    lit à chaque tour. « Pic de fin d'année » s'affichait au tour 1 comme au
 *    tour 4, au trimestre compris ;
 *  · LES SITUATIONS DÉTECTÉES, déclenchées par les résultats à n'importe quel
 *    tour : « La caisse pleine d'après-soldes » ou « La saison forte est passée »
 *    supposaient une saison que le tour n'avait pas ;
 *  · TROIS TEXTES datés d'un moment faux au tour où ils tombent, au trimestre
 *    même : « février » au tour 2 de MARTEL & FILS, « l'approche de la fin
 *    d'année » au tour 5 de NOVA, « la clôture budgétaire » d'un courrier tiré à
 *    tout tour ;
 *  · LES COURRIERS, TOUS : un courrier tiré au sort, ou posé par l'enseignant au
 *    tour qu'il veut, tombait au tour 3 comme au tour 4 avec « le marché de
 *    Noël » ou « le premier lundi de janvier », au trimestre compris. Ceux qui
 *    tombent d'eux-mêmes à un tour fixe (étapes d'investissement, événements
 *    scriptés) se posent aussi à la main, à n'importe quel tour : « cet
 *    automne » ou « l'été » y devenaient faux. Aucun courrier ne garde de date ;
 *  · LES RÉCITS MÉTÉO DES COURRIERS ET DE LA GAZETTE : une canicule tirée au
 *    tour 5 tombait en plein hiver au trimestre, un grand froid en plein été.
 *    L'événement garde son effet, son récit ne suppose plus aucune saison.
 *
 * Pour tous ceux-là, la forme retenue ne date rien et reste vraie à toutes les
 * durées, trimestre compris. Cette garde le vérifie, et vérifie que ce qui
 * remplace la date est vrai aux tableaux de saisonnalité.
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };

/** Les bornes d'un mot, accents compris : `\b` ne connaît que l'ASCII. */
const mot = (source: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, "giu");

const MOIS = "janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre";
const SAISONS =
  "été|hivers?|printemps|automnes?|estiva(?:l|le|les|ux)|hiverna(?:l|le|les|ux)|automna(?:l|le|les|ux)|printani(?:er|ère|ers|ères)";
const FETES = "noël|après-noël|pâques|toussaint|réveillon|nouvel an|saint-sylvestre|fêtes|après-fêtes|black friday";
const AUTRES =
  "rentrée|soldes|après-soldes|vacances|congés|fin d['’]année|début d['’]année|fin de l['’]année|saison des (?:mariages|cadeaux|fêtes)";
const CALENDRIER = mot(`${MOIS}|${SAISONS}|${FETES}|${AUTRES}`);

/** « a été payé », « n'ont pas été facturés », « l'a été », « n'ait été baissé » : le participe d'« être » ne date rien. */
const PARTICIPE = mot(
  "(?:a|ont|ai|as|avons|avez|avait|avaient|aura|auront|aurait|auraient|ait|aient|ayant|avoir|eût)(?:\\s+[\\p{L}'’]+){0,2}\\s+été",
);

/** Les mots du calendrier d'un texte, participes d'« être » retirés. */
const motsDuCalendrier = (t: string): string[] =>
  [...t.replace(PARTICIPE, "").matchAll(CALENDRIER)].map((m) => m[0].toLowerCase());

/**
 * CE QU'UNE SITUATION DÉTECTÉE NE PEUT PAS SUPPOSER : qu'une saison vient de
 * finir, qu'une autre commence, qu'un pic est passé. Elle tombe à n'importe quel
 * tour, avant le pic comme après. Les principes généraux (« en saison creuse,
 * ajuster le tarif… », « après un pic de ventes, une part du solde… ») restent :
 * ils ne disent pas où l'on est.
 */
const SUPPOSITIONS = new RegExp(
  [
    "fin de (?:la )?saison",
    "saison (?:forte|haute) est passée",
    "saison creuse (?:qui vient|à venir)",
    "projetez la saison creuse",
    "le plus creux de l['’]année",
    "trimestre (?:qui s['’]ouvre|creux)",
    "pic (?:est )?passé",
    "ventes du pic ont",
    "pic des fêtes",
    "vague (?:des bonnes résolutions|d['’]inscriptions) a",
    "après (?:le pic|les soldes|les fêtes)",
  ].join("|"),
  "iu",
);

// ---------------------------------------------------------------------------
// 1. Les textes de configuration affichés
// ---------------------------------------------------------------------------

/** Un identifiant (code, clé, chemin) n'est pas du texte affiché : minuscules, chiffres, tirets, soulignés. */
const identifiant = (s: string) => /^[a-z0-9_.:/-]*$/.test(s);

function chaines(o: unknown, ou: string, vus: Set<unknown>, sortie: { ou: string; texte: string }[]) {
  if (typeof o === "string") {
    if (!identifiant(o)) sortie.push({ ou, texte: o });
    return;
  }
  if (!o || typeof o !== "object" || vus.has(o)) return;
  vus.add(o);
  for (const [k, v] of Object.entries(o)) chaines(v, `${ou}.${k}`, vus, sortie);
}

/**
 * Tout le texte de configuration qu'un joueur peut lire, scénario mis à la durée
 * du tour : la définition du registre hors situations (accueil, contexte,
 * dilemme, segments, références, offres, fournisseurs), le groupe de NOVA et sa
 * nouveauté, la banque de la gazette.
 */
function textesDeConfiguration(periodicity: Periodicity): { ou: string; texte: string }[] {
  const sortie: { ou: string; texte: string }[] = [];
  for (const d of SCENARIOS) {
    const { situations: _situations, scenario, ...definition } = d;
    chaines(definition, d.code, new Set(), sortie);
    chaines(applyPeriodicity(scenario, periodicity), `${d.code}.scenario`, new Set(), sortie);
  }
  chaines(GROUPE, "groupe/nova", new Set(), sortie);
  chaines(GAZETTE, "gazette", new Set(), sortie);
  return sortie;
}

/**
 * LES MOTS DU CALENDRIER QUI RESTENT À JUSTE TITRE dans un texte de
 * configuration, un par un : le texte exact, le mot, la raison. Un texte qui
 * change fait échouer « chaque exception sert encore ».
 */
const EXCEPTIONS: { texte: string; mot: string; raison: string }[] = [
  {
    texte: "MAILLE & CO · Habillez l'hiver",
    mot: "hiver",
    raison:
      "le titre du scénario nomme la marchandise, la maille qu'on porte par temps froid ; il ne dit d'aucun tour qu'il est l'hiver (à trancher par le propriétaire, voir le rapport)",
  },
  {
    texte: "Tourisme loisirs (week-ends et vacances)",
    mot: "vacances",
    raison: "le segment dit le motif du séjour (un week-end, des vacances), pas un moment de la partie",
  },
  {
    texte: "Associations et fêtes de famille",
    mot: "fêtes",
    raison: "les fêtes de famille (noces, anniversaires) sont une clientèle de toute l'année, pas une saison",
  },
  {
    texte: "des associations et des fêtes de famille",
    mot: "fêtes",
    raison: "le même segment, nommé par la gazette",
  },
];

const retenus = (texte: string) =>
  motsDuCalendrier(texte).filter((m) => !EXCEPTIONS.some((e) => e.texte === texte && e.mot === m));

describe("les textes de configuration affichés ne datent aucun tour, à aucune durée", () => {
  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]}, aucun texte de configuration ne nomme un moment du calendrier`, () => {
      const restes = textesDeConfiguration(periodicity).flatMap(({ ou, texte }) =>
        retenus(texte).map((m) => `${ou} : « ${m} » dans « ${texte} »`),
      );
      expect(restes).toEqual([]);
    });
  }

  it("chaque exception sert encore", () => {
    const textes = new Set(textesDeConfiguration("quarter").map((x) => x.texte));
    for (const e of EXCEPTIONS) {
      expect(textes.has(e.texte), e.texte).toBe(true);
      expect(motsDuCalendrier(e.texte), e.texte).toContain(e.mot);
    }
  });

  it("le relevé atteint bien les textes affichés : segments, offres, fournisseurs, accueil, module, gazette", () => {
    const ou = textesDeConfiguration("quarter").map((x) => x.ou);
    for (const attendu of [
      /^fitness\.scenario\.market\.segments\.\d+\.name$/,
      /^transport\.scenario\.orderOffers\.\d+\.title$/,
      /^batiment\.scenario\.orderOffers\.\d+\.narrative$/,
      /^boutique\.scenario\.products\.\d+\.suppliers\.\d+\.narrative$/,
      /^fitness\.context$/,
      /^conseil-gamme\.dilemma\.routes\.\d+\.gain$/,
      /^groupe\/nova\.NOVA_HOME\.reference\.suppliers\.\d+\.narrative$/,
      /^gazette\.MOTIFS\.\w+\.motif$/,
    ]) {
      expect(ou.some((x) => attendu.test(x)), String(attendu)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Les situations détectées
// ---------------------------------------------------------------------------

const DETECTEES = SCENARIOS.flatMap((d) =>
  d.situations.filter((s) => "detect" in s.trigger).map((def) => ({ code: `${d.code}/${def.code}`, def })),
);

describe("une situation détectée tombe à n'importe quel tour : elle ne suppose aucune saison, à aucune durée", () => {
  it("il y en a dans chaque scénario intégré", () => {
    for (const d of SCENARIOS) expect(DETECTEES.some((x) => x.code.startsWith(`${d.code}/`)), d.code).toBe(true);
  });

  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]}, aucune ne nomme un moment du calendrier`, () => {
      const restes = DETECTEES.flatMap(({ code, def }) =>
        textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity])).flatMap((t) =>
          motsDuCalendrier(t).map((m) => `${code} : « ${m} » dans « ${t} »`),
        ),
      );
      expect(restes).toEqual([]);
    });

    it(`${NOM[periodicity]}, aucune ne suppose qu'une saison commence ou finit`, () => {
      const restes = DETECTEES.flatMap(({ code, def }) =>
        textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]))
          .filter((t) => SUPPOSITIONS.test(t))
          .map((t) => `${code} : « ${t.match(SUPPOSITIONS)![0]} » dans « ${t} »`),
      );
      expect(restes).toEqual([]);
    });
  }
});

describe("la garde voit ce qu'elle doit voir", () => {
  it("les textes d'avant datent ou supposent une saison", () => {
    expect(motsDuCalendrier("Pic de fin d'année d'un e-commerçant")).toEqual(["fin d'année"]);
    expect(motsDuCalendrier("Bonnes résolutions (janvier, volatils)")).toEqual(["janvier"]);
    expect(motsDuCalendrier("La caisse pleine d'après-soldes")).toEqual(["après-soldes"]);
    expect(motsDuCalendrier("Saison des mariages")).toEqual(["saison des mariages"]);
    expect(motsDuCalendrier("sur des clients qui achètent en été")).toEqual(["été"]);
    expect(SUPPOSITIONS.test("La saison forte est passée et le compte affiche")).toBe(true);
    expect(SUPPOSITIONS.test("Le trimestre qui s'ouvre est le plus creux de l'année")).toBe(true);
    expect(SUPPOSITIONS.test("Le compte plein de fin de saison")).toBe(true);
  });
  it("le participe passé, le solde, la saison qui ne date rien et les principes généraux passent", () => {
    expect(motsDuCalendrier("la publicité a été coupée ; des chantiers n'ont pas été facturés")).toEqual([]);
    expect(motsDuCalendrier("sans qu'aucun prix n'ait été baissé ; qu'ils aient été servis")).toEqual([]);
    expect(motsDuCalendrier("le solde du compte ; les factures sont rentrées ; la saison passée ; les soldes intermédiaires")).toEqual(
      ["soldes"],
    );
    expect(SUPPOSITIONS.test("En saison creuse, ajuster le tarif peut maintenir un flux minimum")).toBe(false);
    expect(SUPPOSITIONS.test("Après un pic de ventes, une part du solde encaissé est déjà engagée")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Les trois textes datés d'un moment faux au tour où ils tombent
// ---------------------------------------------------------------------------

const situationDe = (scenario: string, code: string) => scenarioByCode(scenario).situations.find((s) => s.code === code)!;

describe("les textes datés à tort au trimestre ne datent plus rien, à aucune durée", () => {
  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]} : batiment_t2_devis, nova_inv_retournement, conseil_appel_offres_gagne`, () => {
      const jours = PERIODICITY_DAYS[periodicity];
      const textes = [
        ...textesDe(situationDeLaPartie(situationDe("batiment", "batiment_t2_devis"), jours)),
        ...["nova_inv_retournement", "conseil_appel_offres_gagne"].flatMap((code) => [
          ...textesDuCourrier(courrierDeLaPartie(code, { jours })!),
          ...textesDuCourrier(courrierDeLaPartie(code, { jours, assurance: false })!),
        ]),
      ];
      expect(textes.flatMap((t) => motsDuCalendrier(t).map((m) => `« ${m} » dans « ${t} »`))).toEqual([]);
      expect(textes.join("\n")).not.toMatch(/clôture budgétaire/);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Ce qui remplace la date est vrai aux tableaux de saisonnalité
// ---------------------------------------------------------------------------

const scenarioDe = (code: string) => scenarioByCode(code).scenario;
const produit = (scenario: string, code: string) => scenarioDe(scenario).products!.find((p) => p.code === code)!;
const segmentDe = (scenario: string, code: string) =>
  [...scenarioDe(scenario).market.segments, ...(scenarioDe(scenario).products ?? []).flatMap((p) => p.market.segments)].find(
    (s) => s.code === code,
  )!;
const tourDuMax = (t: readonly number[]) => t.indexOf(Math.max(...t)) + 1;
const tourDuMin = (t: readonly number[]) => t.indexOf(Math.min(...t)) + 1;

/** Tous les textes d'une situation, aux trois durées. */
const aToutesLesDurees = (scenario: string, code: string) =>
  DUREES.map((p) => textesDe(situationDeLaPartie(situationDe(scenario, code), PERIODICITY_DAYS[p])).join("\n"));

describe("ce que disent les textes neutres est vrai au tableau de saisonnalité", () => {
  it("VOLT FITNESS : les bonnes résolutions arrivent par vagues, au plus haut à plusieurs tours", () => {
    const resolutions = segmentDe("fitness", "resolutions").seasonality!;
    expect(resolutions.filter((x) => x === Math.max(...resolutions)).length).toBeGreaterThan(1);
    expect(scenarioDe("fitness").market.segments.find((s) => s.code === "resolutions")!.name).toMatch(/par vagues/);
    expect(scenarioByCode("fitness").context).toMatch(/à chaque vague de bonnes résolutions/);
  });

  it("MAILLE & CO : les écharpes et les bonnets du fournisseur « avant le pic » culminent au tour du pic de la boutique", () => {
    const pic = tourDuMax(scenarioDe("boutique").market.seasonality);
    for (const code of ["echarpe", "bonnet"]) {
      const p = produit("boutique", code);
      expect(tourDuMax(p.market.seasonality!), code).toBe(pic);
      expect(p.suppliers!.map((s) => s.narrative).join("\n")).toMatch(/avant le pic|volume du pic/);
    }
  });

  it("NOVA Home : le module de Taikon rompt plus souvent aux pics de ventes", () => {
    const r = GROUPE.NOVA_HOME.regles.ruptures!.find((x) => x.fournisseur === "taikon")!;
    expect(r.probabiliteAuxPics).toBeGreaterThan(r.probabilite);
    expect(GROUPE.NOVA_HOME.reference.suppliers!.find((s) => s.code === "taikon")!.narrative).toMatch(/aux pics de ventes/);
  });

  it("ATLAS CONSEIL · gamme : les DSI achètent encore quand le cabinet creuse", () => {
    const creux = tourDuMin(scenarioDe("conseil-gamme").market.seasonality);
    const dsi = segmentDe("conseil-gamme", "dsi").seasonality!;
    expect(dsi[creux - 1]!).toBeGreaterThan(scenarioDe("conseil-gamme").market.seasonality[creux - 1]!);
    expect(JSON.stringify(scenarioByCode("conseil-gamme").dilemma)).toMatch(/achètent encore au creux/);
  });

  it("NOVA : le retournement tombe au tour qui suit le pic, « au sortir du pic » à toutes les durées", () => {
    const pic = tourDuMax(scenarioDe("nova").market.seasonality);
    expect(ETAPES_D_INVESTISSEMENT.find((e) => e.suffixe === "retournement")!.tour).toBe(pic + 1);
    for (const p of DUREES) {
      expect(textesDuCourrier(courrierDeLaPartie("nova_inv_retournement", { jours: PERIODICITY_DAYS[p] })!).join("\n"), p).toMatch(
        /au sortir du pic/,
      );
    }
  });

  it("LA TABLE D'AUGUSTIN · gamme, tour 3 : le traiteur n'échappe pas au creux, il creuse autant que les déjeuners d'affaires", () => {
    const def = situationDe("bistrot-gamme", "bistrotg_t3_matieres");
    expect(def.trigger).toEqual({ round: 3 });
    const traiteur = produit("bistrot-gamme", "traiteur").market.seasonality!;
    const midi = segmentDe("bistrot-gamme", "midi_affaires").seasonality!;
    expect(traiteur[2]!).toBeLessThan(1);
    expect(traiteur[2]!).toBeLessThanOrEqual(midi[2]!);
    for (const s of produit("bistrot-gamme", "traiteur").market.segments) expect(s.seasonality![2]!, s.code).toBeLessThanOrEqual(midi[2]!);
    for (const t of aToutesLesDurees("bistrot-gamme", "bistrotg_t3_matieres")) {
      expect(t).not.toMatch(/continuent de partir|garde ses clients/);
      expect(t).toMatch(/traiteur, si vous en avez, n'y échappent pas/);
      expect(t).toMatch(/traiteur, si elle est bâtie, n'y échappe pas/);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Les corrections au trimestre sont nommées, et chacune sert
// ---------------------------------------------------------------------------

const RELEVES = [
  "situations-fitness-au-trimestre.json",
  "situations-nova-courriers-au-trimestre.json",
  "situations-transport-bistrot-au-trimestre.json",
  "situations-batiment-boutique-ecommerce-au-trimestre.json",
  "situations-conseil-hotel-au-trimestre.json",
  "courriers-au-trimestre.json",
].map((nom) => JSON.parse(readFileSync(new URL(`../fixtures/${nom}`, import.meta.url), "utf-8")) as Record<string, unknown>);

/** Les textes relevés au trimestre d'un code de situation ou de courrier, quel que soit le relevé. */
function releve(code: string): string[] {
  const textes: string[] = [];
  const parcourir = (o: Record<string, unknown>) => {
    for (const [cle, v] of Object.entries(o)) {
      if (Array.isArray(v)) {
        if (cle.replace(/ \(sans assurance\)$/, "").split("/").pop() === code) textes.push(...(v as string[]));
      } else if (v && typeof v === "object") parcourir(v as Record<string, unknown>);
    }
  };
  RELEVES.forEach(parcourir);
  return textes;
}

/** Les textes rendus au trimestre d'un code de situation ou de courrier. */
function rendu(code: string): string[] {
  const def = SCENARIOS.flatMap((d) => d.situations).find((s) => s.code === code);
  if (def) return textesDe(situationDeLaPartie(def, PERIODICITY_DAYS.quarter));
  return textesDuCourrier(courrierDeLaPartie(code, { jours: PERIODICITY_DAYS.quarter })!);
}

describe("les corrections des dates au trimestre (corrections-des-dates.ts)", () => {
  it("chacune s'applique encore à son relevé, et le texte rendu porte bien la phrase d'après", () => {
    for (const c of CORRECTIONS_DES_DATES) {
      for (const code of c.codes) {
        expect(releve(code).some((t) => t.includes(c.avant)), `${code} : « ${c.avant} » absent du relevé`).toBe(true);
        expect(rendu(code).some((t) => t.includes(c.apres)), `${code} : « ${c.apres} » absent du rendu`).toBe(true);
        expect(rendu(code).some((t) => t.includes(c.avant)), `${code} : « ${c.avant} » encore rendu`).toBe(false);
      }
    }
  });

  it("aucune ne date un tour, et chacune dit pourquoi", () => {
    for (const c of CORRECTIONS_DES_DATES) {
      expect(motsDuCalendrier(c.apres), c.apres).toEqual([]);
      expect(c.pourquoi.length, c.avant).toBeGreaterThan(20);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Les courriers, tirés au sort ou posés à la main
// ---------------------------------------------------------------------------

/**
 * LES TOURS FIXES : un courrier tombe de lui-même à un tour dit quand il est une
 * étape d'investissement (`ETAPES_D_INVESTISSEMENT`, posée par le calendrier du
 * niveau) ou un événement scripté d'un scénario, et qu'aucun scénario ne le tire
 * au sort (probabilité nulle partout). Tous les autres se tirent, ou se posent, à
 * n'importe quel tour : les événements à probabilité non nulle, ceux que seul
 * l'enseignant pose (probabilité nulle, aucun tour dit), et les courriers de
 * routine et en retour, qui tombent à chaque tour.
 *
 * Décision du propriétaire (« On règle ces 2 là ») : l'enseignant pose aussi un
 * courrier à tour fixe au tour qu'il veut (`distribuerUnCourrier`, en mode
 * apprentissage). Aucun courrier ne garde donc de date, à tour fixe ou non : la
 * distinction ne sert plus qu'à vérifier que le relevé atteint bien les deux.
 */
const TOURS_FIXES = new Map<string, Set<number>>();
const poser = (code: string, tour: number) => TOURS_FIXES.set(code, (TOURS_FIXES.get(code) ?? new Set()).add(tour));
for (const d of SCENARIOS) for (const s of d.scenario.scriptedEvents) poser(s.eventCode, s.round);
for (const c of COURRIERS) {
  const etape = ETAPES_D_INVESTISSEMENT.find((e) => c.code.endsWith(`_inv_${e.suffixe}`));
  if (etape) poser(c.code, etape.tour);
}
const tireQuelquePart = (code: string) =>
  SCENARIOS.some((d) => d.scenario.events.some((e) => e.code === code && e.probability > 0));
const aTourFixe = (code: string) => TOURS_FIXES.has(code) && !tireQuelquePart(code);

const LIASSE_DE = new Map(LIASSES.flatMap((l) => l.courriers.map((c) => [c.code, l.code] as const)));
const TOUS = [...COURRIERS, ...COURRIERS_DE_ROUTINE, ...COURRIERS_EN_RETOUR].map((c) => c.code);
const TIRES = TOUS.filter((code) => !aTourFixe(code));
const FIXES = COURRIERS.map((c) => c.code).filter(aTourFixe);

/** Tous les textes d'un courrier à une durée, avec et sans l'assurance. */
const textesDuCourrierA = (code: string, periodicity: Periodicity) => {
  const jours = PERIODICITY_DAYS[periodicity];
  return [
    ...textesDuCourrier(courrierDeLaPartie(code, { jours })!),
    ...textesDuCourrier(courrierDeLaPartie(code, { jours, assurance: false })!),
  ];
};

/**
 * LES MOTS DU CALENDRIER QUI RESTENT À JUSTE TITRE dans un courrier, un par un :
 * le texte exact, le mot, la raison.
 */
const EXCEPTIONS_DES_COURRIERS: { code: string; texte: string; mot: string; raison: string }[] = [
  {
    code: "batiment_intemperies",
    texte: "Caisse des congés et intempéries du bâtiment",
    mot: "congés",
    raison: "le nom de l'organisme qui indemnise les jours d'intempéries ; il ne dit d'aucun tour qu'il est un temps de congés",
  },
];

/**
 * LES DATES QUE GARDE, AU TRIMESTRE, UN COURRIER À TOUR FIXE : vraies au tour où
 * il tombe, lu au calendrier de la partie au trimestre (tour 1 de janvier à mars,
 * tour 2 d'avril à juin, tour 3 de juillet à septembre, tour 4 d'octobre à
 * décembre, tour 5 de janvier à mars). Au mois et à l'année, elles ne datent
 * rien (gardes `saisons-*.test.ts` des groupes, et ci-dessous).
 *
 * Décision du propriétaire : le trimestre est la référence. Ces dates restent, bien que
 * l'enseignant puisse poser ces courriers à la main au tour qu'il veut : posés hors de
 * leur tour, ils dateraient faux ; c'est une limite annoncée, pas une correction.
 */
const DATES_A_TOUR_FIXE: { code: string; tour: number; mot: string; raison: string }[] = [
  {
    code: "nova_inv_concurrent",
    tour: 4,
    mot: "automne",
    raison: "au tour 4 (octobre à décembre), la ligne que Kelvox « inaugurera cet automne » ouvre pendant le tour",
  },
  {
    code: "boutique_inv_concurrent",
    tour: 4,
    mot: "automne",
    raison: "au tour 4 (octobre à décembre), « d'ici la fin de l'automne » tombe avant la fin du tour",
  },
  {
    code: "hotel_inv_signal",
    tour: 2,
    mot: "automne",
    raison:
      "au tour 2 (avril à juin), les circuits d'automne sont à venir, et le contingent arrive au tour 3, comme l'annonce « dès le trimestre prochain »",
  },
  {
    code: "hotel_inv_concurrent",
    tour: 4,
    mot: "fin de l'année",
    raison: "au tour 4 (octobre à décembre), la fin de l'année est la fin du tour",
  },
  {
    code: "bistrot_inv_signal",
    tour: 2,
    mot: "rentrée",
    raison: "au tour 2 (avril à juin), la rentrée tombe au tour suivant, celui où Montclar arrive (le grand compte du tour 3)",
  },
  {
    code: "bistrot_inv_concurrent",
    tour: 4,
    mot: "fin de l'année",
    raison: "au tour 4 (octobre à décembre), la fin de l'année est la fin du tour",
  },
  {
    code: "fitness_energie",
    tour: 3,
    mot: "été",
    raison: "scripté au tour 3 (juillet à septembre), le creux de la salle à son tableau de saisonnalité",
  },
  {
    code: "boutique_inv_retournement",
    tour: 5,
    mot: "plus douce que prévu",
    raison: "au tour 5 (janvier à mars), un hiver plus doux que prévu freine la maille, ce que dit le distributeur",
  },
];

/** Ce qu'un courrier ne peut pas supposer non plus : la saison du tour, quelle qu'elle soit. */
const SUPPOSITIONS_DU_TIRAGE = new RegExp(`${SUPPOSITIONS.source}|hors saison`, "iu");

describe("un courrier tombe à n'importe quel tour, tiré au sort ou posé à la main : il ne date rien, à aucune durée", () => {
  it("le relevé distingue bien les courriers tirés des courriers à tour fixe", () => {
    for (const l of LIASSES) {
      if (l.code === "rse") continue;
      expect(TIRES.some((code) => LIASSE_DE.get(code) === l.code), l.code).toBe(true);
      expect(FIXES.some((code) => LIASSE_DE.get(code) === l.code), l.code).toBe(true);
    }
    // Un événement à probabilité nulle et sans tour dit, que seul l'enseignant pose, est tiré.
    expect(TIRES).toContain("boutique_marche_noel");
    expect(TIRES).toContain("ecom_black_friday");
    // Une étape d'investissement et un événement scripté sont à tour fixe.
    expect(FIXES).toContain("nova_inv_retournement");
    expect(FIXES).toContain("fitness_energie");
    expect(TIRES).toContain(COURRIERS_DE_ROUTINE[0]!.code);
  });

  it("l'enseignant peut poser un courrier à tour fixe à n'importe quel tour : il est dans la liasse qu'il distribue", () => {
    // `distribuerUnCourrier` puise dans la liasse du marché (ou des entreprises), parmi
    // les événements du scénario de la partie. Si ce test échoue parce que la porte se
    // ferme, les dates vraies à un seul tour redeviennent possibles : à rediscuter.
    const distribuables = new Set([...COURRIERS_MARCHE_CODES, ...COURRIERS_ENTREPRISE_CODES]);
    const restes = FIXES.filter(
      (code) => !distribuables.has(code) || !SCENARIOS.some((d) => d.scenario.events.some((e) => e.code === code)),
    );
    expect(restes).toEqual([]);
  });

  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]}, aucun courrier ne nomme un moment du calendrier, à tour fixe ou non`, () => {
      const restes = TOUS.flatMap((code) =>
        textesDuCourrierA(code, periodicity).flatMap((t) =>
          motsDuCalendrier(t)
            .filter((m) => !EXCEPTIONS_DES_COURRIERS.some((e) => e.code === code && e.texte === t && e.mot === m))
            .filter((m) => periodicity !== "quarter" || !DATES_A_TOUR_FIXE.some((d) => d.code === code && d.mot === m))
            .map((m) => `${code} : « ${m} » dans « ${t} »`),
        ),
      );
      expect([...new Set(restes)]).toEqual([]);
    });

    it(`${NOM[periodicity]}, aucun courrier ne suppose la saison du tour`, () => {
      const restes = TOUS.flatMap((code) =>
        textesDuCourrierA(code, periodicity)
          .filter((t) => SUPPOSITIONS_DU_TIRAGE.test(t))
          .map((t) => `${code} : « ${t.match(SUPPOSITIONS_DU_TIRAGE)![0]} » dans « ${t} »`),
      );
      expect([...new Set(restes)]).toEqual([]);
    });
  }

  it("le motif de la gazette d'un événement ne suppose pas davantage la saison du tour", () => {
    const restes = Object.entries({ ...GAZETTE.MOTIFS, ...GAZETTE.MOTIFS_D_INVESTISSEMENT })
      .filter(([, m]) => SUPPOSITIONS_DU_TIRAGE.test(m.motif) || motsDuCalendrier(m.motif).length > 0)
      .map(([code, m]) => `${code} : « ${m.motif} »`);
    expect(restes).toEqual([]);
  });

  it("chaque exception sert encore", () => {
    for (const e of EXCEPTIONS_DES_COURRIERS) {
      expect(TOUS, e.code).toContain(e.code);
      const textes = DUREES.flatMap((p) => textesDuCourrierA(e.code, p));
      expect(textes, e.code).toContain(e.texte);
      expect(motsDuCalendrier(e.texte), e.texte).toContain(e.mot);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Les récits météo
// ---------------------------------------------------------------------------

/**
 * UN TEMPS QUI SUPPOSE UNE SAISON. Un événement météo se tire à plusieurs tours,
 * et le calendrier de la partie boucle : la canicule de VOLT FITNESS, permise dès
 * le tour 2, tombait au tour 5 (de janvier à mars au trimestre), le grand froid de
 * NOVA en plein été. Ce que le récit garde : un temps possible en toute saison
 * (intempéries, pluies, vents violents, pollution de l'air, beau temps), qui
 * justifie le même effet.
 *
 * Les faux positifs écartés : le gel des budgets ou des prix (« gel » suivi de
 * « des », « du », « de »), la chaîne du froid, la chambre ou le groupe froid,
 * le chauffage et l'eau chaude d'une facture d'énergie (aucun ne suppose le temps
 * qu'il fait).
 */
const METEO_DE_SAISON = mot(
  [
    "canicul\\p{L}*",
    "vagues? de (?:chaleur|froid)",
    "fortes? chaleurs?",
    "chaleurs? estivales?",
    "grands? froids?",
    "froids? (?:intenses?|polaires?|glacials?)",
    "gel(?!\\s+(?:des|du|de)\\s)",
    "gelées?",
    "neiges?",
    "enneig\\p{L}*",
    "verglas",
    "températures? (?:négatives|glaciales|caniculaires)",
    "heures les plus chaudes",
    "plus (?:doux|douce) que prévu",
    "douceur",
  ].join("|"),
);

const meteoDe = (t: string): string[] => [...t.matchAll(METEO_DE_SAISON)].map((m) => m[0].toLowerCase());

describe("un récit météo ne suppose aucune saison, à aucune durée", () => {
  for (const periodicity of DUREES) {
    it(`${NOM[periodicity]}, aucun courrier ne raconte un temps de saison`, () => {
      const restes = TOUS.flatMap((code) =>
        textesDuCourrierA(code, periodicity).flatMap((t) =>
          meteoDe(t)
            .filter((m) => periodicity !== "quarter" || !DATES_A_TOUR_FIXE.some((d) => d.code === code && d.mot === m))
            .map((m) => `${code} : « ${m} » dans « ${t} »`),
        ),
      );
      expect([...new Set(restes)]).toEqual([]);
    });
  }

  it("ni aucun motif de la gazette", () => {
    const restes = Object.entries({ ...GAZETTE.MOTIFS, ...GAZETTE.MOTIFS_D_INVESTISSEMENT }).flatMap(([code, m]) =>
      meteoDe(m.motif).map((x) => `${code} : « ${x} » dans « ${m.motif} »`),
    );
    expect(restes).toEqual([]);
  });

  it("la garde voit ce qu'elle doit voir, et laisse passer ce qui ne parle pas du temps", () => {
    expect(meteoDe("Épisode caniculaire, recommandations aux établissements sportifs")).toEqual(["caniculaire"]);
    expect(meteoDe("Le département est placé en vigilance canicule pour la semaine.")).toEqual(["canicule"]);
    expect(meteoDe("Épisode de grand froid, restrictions de circulation")).toEqual(["grand froid"]);
    expect(meteoDe("Un épisode de froid intense frappe la région")).toEqual(["froid intense"]);
    expect(meteoDe("La période de pluie et de gel annoncée")).toEqual(["gel"]);
    expect(meteoDe("Une vague de chaleur cumule tout")).toEqual(["vague de chaleur"]);
    expect(meteoDe("La saison est plus douce que prévu")).toEqual(["plus douce que prévu"]);
    expect(
      meteoDe(
        "Gel des budgets de conseil ; la chaîne du froid ; une chambre froide ; le groupe froid central ; chauffage, eau chaude sanitaire ; trois semaines de beau temps ; des pluies diluviennes",
      ),
    ).toEqual([]);
  });
});

describe("un courrier à tour fixe garde, au trimestre, la date vraie à son tour", () => {
  it("chaque date gardée tombe encore à son tour, et seulement à lui, et sert encore", () => {
    for (const d of DATES_A_TOUR_FIXE) {
      expect(FIXES, d.code).toContain(d.code);
      expect([...TOURS_FIXES.get(d.code)!], d.code).toEqual([d.tour]);
      const auTrimestre = textesDuCourrierA(d.code, "quarter");
      expect(auTrimestre.flatMap((t) => [...motsDuCalendrier(t), ...meteoDe(t)]), d.code).toContain(d.mot);
    }
  });
});
