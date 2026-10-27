import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { PERIODICITY_DAYS, type Periodicity } from "../../src/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "../../src/config/scenarios/situation-texte";
import { LIASSES } from "../../src/config/courriers/registre";
import { VARIANTES_SANS_ASSURANCE } from "../../src/config/courriers/sans-assurance";
import { courrierALaDuree, textesDuCourrier } from "../../src/config/courriers/texte";
import { courrierDeLaPartie } from "../../src/config/courriers/de-la-partie";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * L'ESCALE, LA TABLE D'AUGUSTIN ET ATLAS CONSEIL NE DATENT PLUS UN TOUR AU MOIS NI À L'ANNÉE.
 *
 * La saisonnalité se lit une valeur par tour, à toutes les durées (ADR-01, en-tête
 * de `periodicity.ts`) : au mois, le tour 3 de L'ESCALE reste son pic et celui du
 * bistrot son creux, mais ce n'est plus « l'été » ni « août ». Les récits l'étaient
 * restés. Cette garde rend chaque situation des six scénarios du groupe et chaque
 * courrier de leurs trois liasses (variante sans assurance comprise), et vérifie :
 *  · qu'au mois et à l'année, aucun nom de mois, aucune saison du calendrier (et
 *    ses adjectifs : estival, hivernal), aucune fête datée (Noël, Pâques,
 *    Toussaint, la fin d'année), ni « rentrée », « soldes », « vacances » ou
 *    « congés » ne reste, hors exceptions justifiées une par une ;
 *  · qu'au trimestre, le texte est octet pour octet celui des fixtures, aux
 *    corrections près que les gardes des textes à la durée nomment ;
 *  · que ce que le récit affirme d'un tour à la place de la date (le pic, le creux)
 *    est vrai au tableau de saisonnalité du scénario, à l'année ; au mois sur le
 *    calendrier, la garde tests/scenarios/textes-au-calendrier.test.ts le vérifie.
 */

const CODES = ["hotel", "hotel-gamme", "bistrot", "bistrot-gamme", "conseil", "conseil-gamme"] as const;
const LIASSES_DU_GROUPE = ["hotel", "bistrot", "conseil"] as const;
const AILLEURS: Periodicity[] = ["month", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };

const lettre = "\\p{L}";
const mot = (alternatives: string) => new RegExp(`(?<!${lettre})(?:${alternatives})(?!${lettre})`, "iu");

/**
 * Ce qui date un tour. « été » n'est une saison que hors du participe passé :
 * « a été », « ont été », « l'a été depuis longtemps » ne datent rien.
 */
const CALENDRIER: { nom: string; motif: RegExp }[] = [
  {
    nom: "un nom de mois",
    motif: mot("janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre"),
  },
  {
    nom: "une saison du calendrier",
    motif: mot("hivers?|printemps|automnes?|estiva(?:l|le|les|ux)|hiverna(?:l|le|les|ux)|automna(?:l|le|les|ux)|printani(?:er|ère|ers|ères)"),
  },
  {
    nom: "l'été",
    motif: new RegExp(
      `(?<!(?<!${lettre})(?:a|ai|as|avons|avez|ont|avait|avaient|aura|auront|aurait|auraient|ayant)\\s+(?:(?:pas|jamais|déjà|encore|toujours|bien)\\s+)?)(?<!${lettre})étés?(?!${lettre})`,
      "iu",
    ),
  },
  { nom: "une fête datée", motif: mot("noël|pâques|toussaint|réveillon|nouvel an|saint-sylvestre|fin d['’]année|fin de l['’]année") },
  { nom: "la rentrée, les soldes, les vacances, les congés", motif: mot("rentrée|soldes|vacances|congés") },
];

/** Un mot du calendrier resté à juste titre au mois ou à l'année : où, lequel, pourquoi. Aucun aujourd'hui. */
const EXCEPTIONS: { ou: string; mot: string; raison: string }[] = [];

/** Les mots du calendrier d'un texte, exceptions retirées. */
function datations(ou: string, texte: string): string[] {
  return CALENDRIER.flatMap(({ nom, motif }) => {
    const trouve = texte.match(new RegExp(motif.source, "giu")) ?? [];
    return trouve
      .filter((m) => !EXCEPTIONS.some((e) => e.ou === ou && e.mot.toLowerCase() === m.toLowerCase()))
      .map((m) => `${nom} : « ${m} »`);
  });
}

/** Les textes de chaque situation du scénario, à cette durée, sous la clé de la fixture. */
function situations(code: string, periodicity: Periodicity): [string, string[]][] {
  return scenarioByCode(code).situations.map((def) => [
    `${code}/${def.code}`,
    textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity])),
  ]);
}

/** Les textes de chaque courrier de la liasse, à cette durée, variante sans assurance comprise. */
function courriers(liasse: string, periodicity: Periodicity): [string, string[]][] {
  const jours = PERIODICITY_DAYS[periodicity];
  return LIASSES.find((l) => l.code === liasse)!.courriers.flatMap((c) => {
    const lui: [string, string[]] = [c.code, textesDuCourrier(courrierALaDuree(c, jours))];
    if (!VARIANTES_SANS_ASSURANCE[c.code]) return [lui];
    const sans = courrierDeLaPartie(c.code, { jours, assurance: false })!;
    return [lui, [`${c.code} (sans assurance)`, textesDuCourrier(sans)] as [string, string[]]];
  });
}

describe("au mois et à l'année, aucun texte ne date un tour", () => {
  for (const periodicity of AILLEURS) {
    for (const code of CODES) {
      it(`${code} ${NOM[periodicity]} : les situations`, () => {
        const restes = situations(code, periodicity).flatMap(([cle, textes]) =>
          textes.flatMap((t) => datations(cle, t).map((d) => `${cle} : ${d} dans « ${t} »`)),
        );
        expect(restes).toEqual([]);
      });
    }
    for (const liasse of LIASSES_DU_GROUPE) {
      it(`la liasse ${liasse} ${NOM[periodicity]} : les courriers`, () => {
        const restes = courriers(liasse, periodicity).flatMap(([cle, textes]) =>
          textes.flatMap((t) => datations(cle, t).map((d) => `${cle} : ${d} dans « ${t} »`)),
        );
        expect(restes).toEqual([]);
      });
    }
  }

  it("chaque exception sert encore, à l'une des deux durées", () => {
    for (const e of EXCEPTIONS) {
      const textes = AILLEURS.flatMap((p) => [
        ...CODES.flatMap((code) => situations(code, p)),
        ...LIASSES_DU_GROUPE.flatMap((l) => courriers(l, p)),
      ])
        .filter(([cle]) => cle === e.ou)
        .flatMap(([, t]) => t);
      expect(textes.some((t) => t.toLowerCase().includes(e.mot.toLowerCase())), `${e.ou} : ${e.mot}`).toBe(true);
    }
  });
});

describe("la garde voit ce qu'elle doit voir", () => {
  it("les textes d'avant la réécriture, au trimestre, datent leurs tours", () => {
    expect(datations("", "L'été approche : le tourisme de loisirs double.")).toHaveLength(1);
    expect(datations("", "Nous sommes en août, la salle est à moitié vide.")).toHaveLength(1);
    expect(datations("", "Décembre arrive : les banquets de fin d'année.")).toHaveLength(2);
    expect(datations("", "la forte demande estivale")).toHaveLength(1);
    expect(datations("", "emménagera à la rentrée")).toHaveLength(1);
  });
  it("le participe passé, le solde et les rentrées d'argent ne sont pas des dates", () => {
    expect(datations("", "La mission a été citée ; aucun engagement n'a été pris ; qu'il ne l'a été depuis longtemps.")).toEqual([]);
    expect(datations("", "Le solde du compte ; les factures sont rentrées d'un coup ; la saison creuse.")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Au trimestre, rien ne change
// ---------------------------------------------------------------------------

const fixture = (nom: string) =>
  JSON.parse(readFileSync(new URL(`../fixtures/${nom}`, import.meta.url), "utf-8")) as Record<string, string[]>;
/** Les deux fixtures sous une même clé, « scénario/situation » (celle du bistrot ne porte que la situation). */
const AVANT_SITUATIONS: Record<string, string[]> = {
  ...fixture("situations-conseil-hotel-au-trimestre.json"),
  ...Object.fromEntries(
    Object.entries(fixture("situations-transport-bistrot-au-trimestre.json"))
      .filter(([k]) => k.startsWith("bistrot"))
      .map(([k, v]) => [`${k.startsWith("bistrotg_") ? "bistrot-gamme" : "bistrot"}/${k}`, v]),
  ),
};
const AVANT_COURRIERS = fixture("courriers-au-trimestre.json");

/**
 * Les corrections du texte au trimestre, nommées et justifiées dans la garde de leur
 * groupe ; reprises ici pour comparer à la même fixture. Aucune ne vient des saisons.
 * S'y ajoutent, par `corrige`, celles des dates fausses au trimestre même (décision
 * du propriétaire) : le traiteur du tour 3 de la gamme du bistrot, la clôture
 * budgétaire du courrier `conseil_appel_offres_gagne`, et les situations détectées,
 * qui tombent à n'importe quel tour (`corrections-des-dates.ts`).
 */
const CORRECTIONS: { cles: string[]; avant: string; apres: string; garde: string }[] = [
  {
    garde: "textes-a-la-duree-conseil-hotel.test.ts",
    cles: ["hotel/hotel_detect_capacity_saturated", "hotel-gamme/hotelg_detect_capacity_saturated"],
    avant: "comparez le coût de la capacité (100 € par nuitée trimestrielle)",
    apres: "comparez le coût de la capacité (de 89 à 115 € par nuitée trimestrielle selon le type de chambre)",
  },
  {
    garde: "textes-a-la-duree-transport-bistrot.test.ts",
    cles: ["bistrot/bistrot_t2_fournisseur", "bistrot-gamme/bistrotg_t2_fournisseur"],
    avant: "augmente le BFR du montant de vos achats trimestriels.",
    apres: "augmente le BFR de 21 jours d'achats.",
  },
  {
    garde: "textes-a-la-duree-courriers.test.ts",
    cles: ["hotel_groupe_impromptu"],
    avant: "Demande d'hébergement en urgence pour quarante passagers",
    apres: "Demande d'hébergement en urgence pour nos circuits",
  },
  {
    garde: "textes-a-la-duree-courriers.test.ts",
    cles: ["hotel_groupe_impromptu"],
    avant:
      "Notre autocar est immobilisé sur l'autoroute à la suite d'une avarie. Quarante passagers doivent être logés ce soir. Nous réglons comptant à l'arrivée, dans la limite des chambres que vous pourrez libérer.",
    apres:
      "L'hôtel qui accueillait nos circuits ferme ses portes après un dégât des eaux. Nos groupes doivent être relogés sans attendre : quatre cents nuitées ce trimestre, que nous réglons comptant à l'arrivée, dans la limite des chambres que vous pourrez libérer.",
  },
  {
    garde: "textes-a-la-duree-courriers.test.ts",
    cles: ["bistrot_matieres_premieres"],
    avant: "une révision de vingt-quatre pour cent sur ces familles, qui représentent la moitié de vos commandes habituelles.",
    apres: "une révision de vingt-quatre pour cent sur l'ensemble de notre barème, ces familles en tête.",
  },
];

const corrige = (cle: string, textes: string[]) =>
  corrigerLesDates(
    cle,
    textes.map((t) =>
      CORRECTIONS.filter((c) => c.cles.includes(cle)).reduce((acc, c) => acc.split(c.avant).join(c.apres), t),
    ),
  );

describe("au trimestre, le texte est octet pour octet celui des fixtures", () => {
  for (const code of CODES) {
    it(`${code} : les situations`, () => {
      const rendus = situations(code, "quarter");
      expect(rendus.map(([cle]) => cle).sort()).toEqual(Object.keys(AVANT_SITUATIONS).filter((k) => k.startsWith(`${code}/`)).sort());
      for (const [cle, textes] of rendus) expect(textes, cle).toEqual(corrige(cle, AVANT_SITUATIONS[cle]!));
      // Le registre porte le texte au trimestre : catalogue, éditeur, référentiel semé.
      for (const def of scenarioByCode(code).situations) {
        const cle = `${code}/${def.code}`;
        expect(textesDe(def), cle).toEqual(corrige(cle, AVANT_SITUATIONS[cle]!));
      }
    });
  }
  for (const liasse of LIASSES_DU_GROUPE) {
    it(`la liasse ${liasse} : les courriers`, () => {
      for (const [cle, textes] of courriers(liasse, "quarter")) {
        expect(AVANT_COURRIERS[cle], cle).toBeDefined();
        expect(textes, cle).toEqual(corrige(cle, AVANT_COURRIERS[cle]!));
      }
      // Les listes portent le texte au trimestre : la liasse imprimée sans durée le lit.
      for (const c of LIASSES.find((l) => l.code === liasse)!.courriers) {
        expect(textesDuCourrier(c), c.code).toEqual(corrige(c.code, AVANT_COURRIERS[c.code]!));
      }
    });
  }
  it("chaque correction reprise s'applique encore à la fixture", () => {
    for (const c of CORRECTIONS) {
      for (const cle of c.cles) {
        const avant = (AVANT_SITUATIONS[cle] ?? AVANT_COURRIERS[cle])!;
        expect(avant.some((t) => t.includes(c.avant)), `${cle} (${c.garde})`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Ce qui remplace la date est vrai au tableau de saisonnalité
// ---------------------------------------------------------------------------

/** La saisonnalité d'un tour (1 = premier), globale ou d'un segment, dans le scénario de la définition. */
function saison(code: string, tour: number, segment?: string): number[] {
  const s = scenarioByCode(code).scenario;
  const tableau = (t?: number[]) => t ?? [];
  if (!segment) return tableau(s.market.seasonality);
  const seg =
    s.market.segments.find((x) => x.code === segment) ??
    (s.products ?? []).flatMap((p) => p.market?.segments ?? []).find((x) => x.code === segment);
  if (!seg?.seasonality) throw new Error(`${code} : pas de saisonnalité pour « ${segment} » au tour ${tour}`);
  return seg.seasonality;
}
const auPic = (t: number[], tour: number) => t[tour - 1] === Math.max(...t);
const auCreux = (t: number[], tour: number) => t[tour - 1] === Math.min(...t);
const offre = (code: string, produit: string) =>
  scenarioByCode(code).scenario.products!.find((p) => p.code === produit)!.market!.seasonality!;

/**
 * Chaque affirmation qui remplace une date : où elle se lit, à l'année,
 * et ce que le tableau de saisonnalité doit montrer pour qu'elle soit vraie.
 */
const AFFIRMATIONS: { code: string; situation: string; tour: number; texte: string; vrai: () => boolean; pourquoi: string }[] = [
  {
    code: "hotel", situation: "hotel_t3_saison", tour: 3, texte: "Votre tour le plus chargé approche",
    vrai: () => auPic(saison("hotel", 3), 3), pourquoi: "le tour 3 porte la saisonnalité globale la plus haute de L'ESCALE",
  },
  {
    code: "hotel-gamme", situation: "hotelg_t3_saison", tour: 3, texte: "Votre tour le plus chargé approche",
    vrai: () => auPic(saison("hotel-gamme", 3), 3), pourquoi: "la gamme garde la saisonnalité globale de l'hôtel",
  },
  {
    code: "bistrot", situation: "bistrot_t3_matieres", tour: 3, texte: "Vous êtes au plus creux de l'activité",
    vrai: () => auCreux(saison("bistrot", 3), 3), pourquoi: "le tour 3 porte la saisonnalité globale la plus basse du bistrot",
  },
  {
    code: "bistrot-gamme", situation: "bistrotg_t3_matieres", tour: 3, texte: "les banquets attendent leur plus gros tour",
    vrai: () => auCreux(saison("bistrot-gamme", 3), 3) && auPic(offre("bistrot-gamme", "banquets"), 4),
    pourquoi: "le tour 3 est le creux de la gamme, et les banquets culminent au tour suivant",
  },
  {
    code: "bistrot", situation: "bistrot_t4_banquets", tour: 4, texte: "Votre plus gros tour arrive : les repas d'entreprise et les banquets y dépensent plus qu'à aucun autre tour",
    vrai: () => auPic(saison("bistrot", 4), 4) && auPic(saison("bistrot", 4, "groupes"), 4),
    pourquoi: "le tour 4 est le pic du bistrot et celui des banquets",
  },
  {
    code: "bistrot-gamme", situation: "bistrotg_t4_banquets", tour: 4, texte: "Votre plus gros tour arrive : les repas d'entreprise et les banquets y dépensent plus qu'à aucun autre tour",
    vrai: () => auPic(saison("bistrot-gamme", 4), 4) && auPic(offre("bistrot-gamme", "banquets"), 4),
    pourquoi: "le tour 4 est le pic de la gamme et celui de l'offre banquets",
  },
  {
    code: "conseil", situation: "conseil_t3_banc", tour: 3, texte: "Votre tour le plus creux",
    vrai: () => auCreux(saison("conseil", 3), 3) && auCreux(saison("conseil", 3, "public"), 3),
    pourquoi: "le tour 3 est le creux du cabinet, et celui des marchés publics",
  },
  {
    code: "conseil-gamme", situation: "conseilg_t3_banc", tour: 3, texte: "Votre tour le plus creux",
    vrai: () => auCreux(saison("conseil-gamme", 3), 3) && saison("conseil-gamme", 3, "dsi")[2]! > saison("conseil-gamme", 3, "public")[2]!,
    pourquoi: "le tour 3 est le creux du cabinet, et les DSI y achètent plus que le public",
  },
];

describe("ce qui remplace la date est vrai au tableau de saisonnalité, à l'année", () => {
  for (const a of AFFIRMATIONS) {
    it(`${a.situation} : « ${a.texte} »`, () => {
      const def = scenarioByCode(a.code).situations.find((s) => s.code === a.situation)!;
      expect(def.trigger, a.situation).toEqual({ round: a.tour });
      // À l'année : au mois sur le calendrier, la situation s'ouvre au premier mois de son
      // trimestre, sur une saison répartie par mois, et ce qu'elle affirme se vérifie mois de
      // départ par mois de départ (tests/scenarios/textes-au-calendrier.test.ts).
      for (const p of ["year"] as Periodicity[]) {
        expect(textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[p])).join("\n"), `${a.situation} ${NOM[p]}`).toContain(a.texte);
      }
      expect(a.vrai(), a.pourquoi).toBe(true);
    });
  }
});
