import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import {
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "../../src/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "../../src/config/scenarios/situation-texte";
import type { CompanyState, EngineScenarioConfig } from "../../src/engine/types";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * ROUTE & CIE ET LA TABLE D'AUGUSTIN SE LISENT À LA DURÉE DU TOUR DE LEUR PARTIE.
 *
 * Hors abonnement, le moteur garde le prix et le coût d'une palette ou d'un
 * couvert, et met à la durée du tour tout ce qui se compte par tour : charges de
 * structure, amortissements, capacité du parc, heures de la brigade, terrasse.
 * Au mois, le bistrot couvre 30 000 € de structure, pas 90 000 ; son seuil est de
 * 1 500 couverts, pas 4 500 ; sa terrasse s'amortit sur trente-six mois. Les
 * énoncés disaient le trimestre quelle que soit la partie. Cette garde rend chaque
 * situation des trois scénarios au mois, au trimestre et à l'année, et vérifie :
 *  · que CHAQUE NOMBRE écrit en chiffres est l'un de ceux que le test recalcule
 *    ici depuis le scénario JOUÉ à cette durée (`composerLeScenarioJoue`, monde
 *    figé) et l'entreprise de départ mise à cette durée, sans passer par le
 *    module des jetons, ou un invariant lu dans ce même scénario joué (un coût
 *    d'unité, un délai en jours, un taux annuel), donc vérifié à chaque durée ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran ;
 *  · qu'au trimestre, le texte est octet pour octet celui d'avant les jetons
 *    (tests/fixtures/situations-transport-bistrot-au-trimestre.json, relevé sur
 *    1c6bc002 avant toute modification), aux corrections nommées près, dont
 *    celle du traiteur au tour 3 de LA TABLE D'AUGUSTIN · gamme, qui le disait à
 *    l'abri du creux (décision du propriétaire, `corrections-des-dates.ts`).
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const GROUPE = ["transport", "bistrot", "bistrot-gamme"] as const;
type Code = (typeof GROUPE)[number];

const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-transport-bistrot-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

/**
 * LES ERREURS QUE LE TEXTE CONTENAIT DÉJÀ AU TRIMESTRE, corrigées et nommées : la
 * fixture garde le texte d'avant, et c'est ici, et nulle part ailleurs, que le
 * texte au trimestre a le droit de s'en écarter.
 */
const CORRECTIONS: { codes: string[]; avant: string; apres: string }[] = [
  {
    // Passer du grossiste à 21 jours au cash & carry comptant supprime la dette
    // fournisseurs, qui vaut les achats × min(1, 21 ÷ jours du tour) (`payableRatio`,
    // engine/finance/statements.ts) : 21 jours d'achats, soit moins du quart des achats
    // d'un trimestre, et non leur totalité. À l'année, « vos achats annuels » aurait
    // été dix-sept fois trop.
    codes: ["bistrot_t2_fournisseur", "bistrotg_t2_fournisseur"],
    avant: "augmente le BFR du montant de vos achats trimestriels.",
    apres: "augmente le BFR de 21 jours d'achats.",
  },
  {
    // Le parc de départ compte un fourgon, trois porteurs et une semi-remorque
    // (`equipment.initialFleet`) : cinq véhicules, et non « sept porteurs », chiffre
    // d'un ancien réglage. Le nombre se lit désormais du parc.
    codes: ["transport_t1_revient"],
    avant: "Vous reprenez ROUTE & CIE : sept porteurs,",
    apres: "Vous reprenez ROUTE & CIE : cinq véhicules,",
  },
  // Le porteur du contrat refusé emmenait 1 400 palettes par trimestre ; la configuration
  // en donne 2 000 à un `porteur_12t` (`equipment.types`), et c'est sur elle que le
  // moteur compte la capacité de la flotte. Le récit lit désormais cette capacité, et
  // toute l'arithmétique de la situation suit : un contrat de quatre mille palettes, un
  // porteur qui rapporte 64 000 € sous contrat contre 84 800 € aujourd'hui.
  ...(
    [
      ["deux mille huit cents palettes", "quatre mille palettes"],
      ["mille quatre cents palettes", "deux mille palettes"],
      ["mille cent vingt", "mille six cents"],
      ["44 800 €", "64 000 €"],
      ["59 360 €", "84 800 €"],
      ["14 560 €", "20 800 €"],
      ["emmène 845 palettes", "emmène 1 208 palettes"],
    ] as const
  ).map(([avant, apres]) => ({ codes: ["transport_t6_contrat_refuse"], avant, apres })),
];

/** Le texte au trimestre attendu : la fixture, corrections nommées appliquées (chaque occurrence). */
function attenduAuTrimestre(code: string): string[] {
  return corrigerLesDates(
    code,
    AVANT[code]!.map((t) =>
      CORRECTIONS.filter((c) => c.codes.includes(code)).reduce((acc, c) => acc.split(c.avant).join(c.apres), t),
    ),
  );
}

/** La capacité d'un porteur 12 t sur un tour, telle que le scénario joué la porte. */
const porteur = (s: EngineScenarioConfig) => s.equipment!.types.find((t) => t.code === "porteur_12t")!.capacityPerUnit;

/** L'instantané qu'une partie fige à cette durée, monde figé. */
const joue = (code: Code, periodicity: Periodicity): EngineScenarioConfig =>
  composerLeScenarioJoue({ scenario: scenarioByCode(code).scenario, seed: 7, concurrents: 6, periodicity });

/** L'entreprise de départ, mise à cette durée comme la partie la crée. */
const entreprise = (code: Code, periodicity: Periodicity): CompanyState =>
  applyPeriodicityToCompany(scenarioByCode(code).company("t", "T", "human"), periodicity);

const net = (x: number) => Number(x.toFixed(9));
const milliers = (n: number) => String(Math.round(net(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const virgule = (x: number, decimales: number) => x.toFixed(decimales).replace(".", ",");
const dix = (x: number) => Math.round(net(x) / 10) * 10;
const cinquante = (x: number) => Math.round(net(x) / 50) * 50;
const cent = (x: number) => Math.round(net(x) / 100) * 100;

/** Le prix d'un fournisseur, rapporté au circuit de référence. */
const multiplicateur = (s: EngineScenarioConfig, fournisseur: string) =>
  s.suppliers!.find((f) => f.code === fournisseur)!.costMultiplier;
/** La hausse d'un événement scripté sur le coût des matières. */
const hausse = (s: EngineScenarioConfig, evenement: string) =>
  s.events.find((e) => e.code === evenement)!.modifiers.find((m) => m.target === "material_cost")!.value;

/**
 * Le couvert du bistrot : ses denrées et ses autres frais variables. LA TABLE
 * D'AUGUSTIN · GAMME hérite de ces énoncés ; ils y parlent du couvert du bistrot
 * d'origine, que la garde lit donc dans le scénario du bistrot joué à la même durée.
 */
const couvert = (periodicity: Periodicity) => joue("bistrot", periodicity).product;

/**
 * Les nombres qu'un énoncé peut citer à cette durée : ceux qui en dépendent,
 * recalculés depuis l'instantané et l'entreprise, et ceux qui n'en dépendent pas,
 * lus dans ce même instantané. Ces derniers sont donc vérifiés à chaque durée :
 * si le moteur se mettait à redimensionner le coût d'un couvert, la garde le dirait.
 */
function nombresAttendus(code: Code, periodicity: Periodicity): Set<string> {
  const s = joue(code, periodicity);
  const e = entreprise(code, periodicity);
  const k = s.roundDays / 90;
  const flux = (x: number) => x * k;
  const charges = s.fixedCostsPerRound;
  const n = new Set<string>();
  const ajoute = (...xs: number[]) => xs.forEach((x) => n.add(milliers(x)));

  if (code === "transport") {
    // Une palette : le prix moyen du récit, le gazole et l'entretien du scénario.
    const prix = 74;
    const gazole = s.product.materialCostPerUnit;
    const entretien = s.product.otherVariableCostPerUnit;
    const route = gazole + entretien;
    const marge = prix - route;
    const surcout = gazole * (hausse(s, "transport_gazole") - 1);
    const margeApres = marge - surcout;
    const capacite = e.machineCapacity;
    const seuil = charges / marge;
    const seuilApres = charges / margeApres;
    // Le trafic du récit, et ce qu'il laisse : un flux par tour.
    const trafic = dix(flux(7400));
    // Un porteur du parc, plein ou aux quatre cinquièmes.
    const plein = Math.round(net(porteur(s)));
    const quatreCinquiemes = Math.round(net((plein * 4) / 5));
    ajoute(charges, seuil, dix(seuil), cinquante(seuilApres), seuilApres);
    ajoute(cent(charges / (prix - gazole)), cent(charges / prix), capacite, trafic, dix(flux(4900)));
    ajoute((52 - route) * trafic, charges + s.finance.depreciationPerRound);
    ajoute(flux(21000), flux(5500), flux(21000) - flux(5500));
    ajoute((57 - route) * plein, (78 - route) * quatreCinquiemes);
    ajoute((78 - route) * quatreCinquiemes - (57 - route) * plein, ((57 - route) * plein) / (78 - route));
    // Ce que la durée ne change pas.
    ajoute(prix, gazole, entretien, marge, prix - gazole, route, 52, 52 - route, 54, 57, 57 - route, 78, 78 - route);
    n.add(virgule(surcout, 2)).add(virgule(margeApres, 2));
    // Le seuil rapporté à la capacité : charges et capacité suivent le même facteur.
    ajoute(Math.round((seuil / capacite) * 100));
    // Les porteurs neufs, un achat ponctuel ; la paie des chauffeurs, un jour du mois.
    ajoute(315000, 30);
    return n;
  }

  // LA TABLE D'AUGUSTIN, mono et gamme : le couvert du bistrot, à 33 € de ticket.
  const c = couvert(periodicity);
  const ticket = 33;
  const marge = ticket - c.materialCostPerUnit - c.otherVariableCostPerUnit;
  const margeCash = ticket - c.materialCostPerUnit * multiplicateur(s, "cash_carry") - c.otherVariableCostPerUnit;
  const flambee = hausse(joue("bistrot", periodicity), "bistrot_matieres_premieres");
  const margeHausse = ticket - c.materialCostPerUnit * flambee - c.otherVariableCostPerUnit;
  const heures = e.hoursPerEmployee;
  const brigade = e.headcount * heures;
  const parCouvert = c.hoursPerUnit;
  const frequentation = flux(6000);
  const terrasse = s.investment!;
  ajoute(charges, charges / marge, cent(charges / margeCash), charges / margeCash, cent(flux(5200)), cent(flux(2800)));
  ajoute(frequentation, (margeCash - marge) * frequentation);
  ajoute(dix(charges / margeHausse), charges / margeHausse, cent(charges / margeHausse - charges / marge));
  ajoute(cent(flux(3900)), cent(flux(7200)), (marge - margeHausse) * frequentation);
  // Les heures d'un salarié telles que l'énoncé les affiche, à l'heure près (« environ
  // 152 h » au mois, 151,67 au moteur) : le calcul demandé part de ce nombre affiché.
  const heuresLues = Math.round(net(heures));
  const brigadeLue = e.headcount * heuresLues;
  ajoute(e.machineCapacity, heuresLues, brigadeLue / parCouvert, brigadeLue, brigadeLue / (parCouvert / 2), brigadeLue * parCouvert);
  ajoute(cent(0.02 * ticket * frequentation), flux(1000), flux(64));
  ajoute(terrasse.maxPerRound, 48000 / terrasse.depreciationRounds);
  // Ce que la durée ne change pas : le couvert et ses ratios, la brigade de départ.
  ajoute(ticket, c.materialCostPerUnit, c.otherVariableCostPerUnit, marge, e.headcount);
  n.add(virgule(parCouvert, 1));
  n.add(virgule(c.materialCostPerUnit * multiplicateur(s, "cash_carry"), 2));
  n.add(virgule(margeCash, 2)).add(virgule(margeCash - marge, 2));
  n.add(virgule(c.materialCostPerUnit * flambee, 2));
  n.add(virgule(margeHausse, 2)).add(virgule(marge - margeHausse, 2));
  ajoute(Math.round(((1 - multiplicateur(s, "cash_carry")) * 100)), Math.round((multiplicateur(s, "circuit_court") - 1) * 100));
  ajoute(Math.round((flambee - 1) * 100));
  // Le ratio matières (10 ÷ 33) et ses leurres, la cible de la profession (28 à 32 %),
  // deux points de ratio sur un ticket de 33 €, 70 places et 70 couverts par jour.
  ajoute(Math.round((c.materialCostPerUnit / ticket) * 100), ticket - c.materialCostPerUnit, 28, 32, 2, 70);
  n.add(virgule(ticket / c.materialCostPerUnit, 1)).add(virgule(0.02 * ticket, 2)).add(virgule(0.2 * ticket, 2));
  // Les délais en jours, les taux annuels du banquier : la durée ne les touche pas.
  ajoute(s.finance.supplierPaymentDelayDays, s.suppliers!.find((f) => f.code === "circuit_court")!.paymentDelayDays);
  const banquets = joue("bistrot", periodicity).market.segments.find((x) => x.code === "groupes")!;
  ajoute(banquets.paymentDelayDays, Math.round(s.finance.overdraftAnnualRate * 100));
  ajoute(Math.round((s.treasury!.placementAnnualRate ?? 0) * 100));
  // L'élasticité et la saisonnalité, lues par tour ; l'inertie de la réputation.
  n.add("1,5").add("1,2").add("1,85").add("1,25").add("0,6").add("0,5").add("0,45");
  // La terrasse, un achat ponctuel ; un exemple de 300 couverts de trop ; 100 € vendus.
  ajoute(48000, 300, 100, 1);
  if (code === "bistrot-gamme") {
    ajoute(dix(flux(4400)));
    // Les heures de la brigade, à la dizaine (dix fois les heures affichées d'un salarié).
    ajoute(dix(brigade));
    // Les quatre cartes : leur prix, leurs denrées, leur marge, leur temps de brigade, ce
    // que la flambée leur ajoute (des grandeurs d'unité), et leurs délais de règlement.
    const euros = (x: number) => (Number.isInteger(x) ? milliers(x) : virgule(x, 2));
    for (const p of s.products!) {
      const prix = p.market!.segments[0]!.refPrice;
      const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
      n.add(euros(prix)).add(euros(p.materialCostPerUnit)).add(euros(variable)).add(euros(prix - variable));
      n.add(euros(net(p.materialCostPerUnit * (flambee - 1))));
      n.add(virgule(p.hoursPerUnit, Number.isInteger(p.hoursPerUnit * 10) ? 1 : 2));
      for (const seg of p.market!.segments) ajoute(seg.paymentDelayDays);
    }
    // La flambée du soir arrondie au dime (12 × 0,24 = 2,88), l'élasticité des gourmets,
    // et le traiteur à bâtir : un développement ponctuel.
    n.add("2,90").add("0,9");
    ajoute(s.products!.find((p) => p.code === "traiteur")!.development!.cost);
  }
  return n;
}

/** Tous les nombres écrits en chiffres d'un texte : « 186 000 », « 45,76 », « 3 ». */
const nombres = (t: string) => t.match(/\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?/g) ?? [];

for (const code of GROUPE) {
  const def = scenarioByCode(code);

  describe(`${def.shortName} : chaque situation se rend à la durée du tour de sa partie`, () => {
    for (const periodicity of DUREES) {
      const attendus = nombresAttendus(code, periodicity);

      describe(NOM[periodicity], () => {
        for (const situation of def.situations) {
          const textes = textesDe(situationDeLaPartie(situation, PERIODICITY_DAYS[periodicity]));

          it(`${situation.code} : chaque nombre cité est celui du scénario joué`, () => {
            for (const t of textes) {
              for (const m of nombres(t)) expect(attendus.has(m), `« ${m} » dans « ${t} »`).toBe(true);
            }
          });

          it(`${situation.code} : aucun jeton n'atteint l'écran${periodicity === "quarter" ? "" : ", aucun trimestre ne reste"}`, () => {
            for (const t of textes) {
              expect(t, t).not.toMatch(/\{\{|\}\}/);
              if (periodicity !== "quarter") expect(t, t).not.toMatch(/trimestr|trois mois/i);
            }
          });
        }
      });
    }

    it("au trimestre, le texte est octet pour octet celui d'avant les jetons", () => {
      const codes = Object.keys(AVANT).filter((c) => def.situations.some((s) => s.code === c));
      expect(codes.sort()).toEqual(def.situations.map((s) => s.code).sort());
      for (const situation of def.situations) {
        expect(textesDe(situationDeLaPartie(situation, 90)), situation.code).toEqual(attenduAuTrimestre(situation.code));
        // Le registre porte le texte au trimestre : catalogue, éditeur, référentiel semé.
        expect(textesDe(situation), situation.code).toEqual(attenduAuTrimestre(situation.code));
      }
    });
  });
}

/** La situation de ce code, telle que sa partie la montre à cette durée. */
const rendue = (code: Code, situation: string, periodicity: Periodicity) =>
  situationDeLaPartie(
    scenarioByCode(code).situations.find((s) => s.code === situation)!,
    PERIODICITY_DAYS[periodicity],
  );

describe("ce que les énoncés disent au mois et à l'année, phrase par phrase", () => {
  it("ROUTE & CIE au mois : le seuil, la capacité et le trafic du mois", () => {
    const s = joue("transport", "month");
    const t1 = rendue("transport", "transport_t1_revient", "month");
    expect(s.fixedCostsPerRound).toBe(62000);
    expect(t1.quiz[1]!.prompt).toContain("Avec 62 000 € de charges de structure décaissées");
    expect(t1.quiz[1]!.explain).toContain("62 000 ÷ 49 ≈ 1 265 palettes");
    expect(t1.hints[4]!.text).toContain("Rapporté à 3 333 palettes de capacité");
    const t2 = rendue("transport", "transport_t2_retour_vide", "month");
    expect(t2.quiz[1]!.explain).toContain(
      "les deux mille quatre cent soixante-dix palettes du mois donnent 66 690 €, quand la structure et la flotte en réclament 70 667",
    );
  });

  it("ROUTE & CIE : le gazole déplace le seuil des seuls chiffres affichés", () => {
    const t3 = rendue("transport", "transport_t3_gazole", "month");
    expect(t3.quiz[0]!.options[0]!.label).toBe("Environ 1 350 palettes, contre 1 270 auparavant");
    expect(t3.quiz[0]!.explain).toContain("ne bouge que de quatre-vingts palettes");
    expect(t3.quiz[0]!.explain).toContain("les deux mille trois cents palettes du mois");
    const an = rendue("transport", "transport_t3_gazole", "year");
    expect(an.quiz[0]!.explain).toContain("ne bouge que de mille soixante-dix palettes");
  });

  it("ROUTE & CIE : le contrat refusé se recalcule avec les palettes qu'il affiche", () => {
    for (const periodicity of DUREES) {
      const t6 = rendue("transport", "transport_t6_contrat_refuse", periodicity);
      const plein = Math.round(net(porteur(joue("transport", periodicity))));
      const reste = Math.round(net((plein * 4) / 5));
      expect(t6.quiz[0]!.options[0]!.label, periodicity).toContain(
        `${milliers(32 * plein)} € contre ${milliers(53 * reste)} €, soit ${milliers(53 * reste - 32 * plein)} € de moins`,
      );
      // Le contrat repasse derrière dès soixante pour cent de remplissage, à toute durée.
      expect(Math.round(((32 * plein) / 53 / plein) * 100), periodicity).toBe(60);
    }
    const mois = rendue("transport", "transport_t6_contrat_refuse", "month");
    expect(mois.narrative).toContain("un contrat mensuel de mille trois cent trente-quatre palettes à 57 €");
    expect(mois.narrative).toContain("Un porteur emmène six cent soixante-sept palettes par mois");
    // Le porteur du récit est celui du parc : 2 000 palettes au trimestre, et non 1 400.
    const trimestre = rendue("transport", "transport_t6_contrat_refuse", "quarter");
    expect(porteur(joue("transport", "quarter"))).toBe(2000);
    expect(trimestre.narrative).toContain("Un porteur emmène deux mille palettes par trimestre");
    expect(rendue("transport", "transport_t6_contrat_refuse", "year").narrative).toContain(
      "Un porteur emmène huit mille palettes par an",
    );
  });

  it("ROUTE & CIE : un placement est bloqué un tour, quelle que soit sa durée", () => {
    expect(rendue("transport", "transport_detect_idle_cash", "month").narrative).toContain("Le placer à un mois");
    expect(rendue("transport", "transport_detect_idle_cash", "year").narrative).toContain("Le placer à un an");
  });

  it("LA TABLE D'AUGUSTIN au mois : le seuil, la brigade et la terrasse du mois", () => {
    const t1 = rendue("bistrot", "bistrot_t1_reprise", "month");
    expect(t1.hints[4]!.text).toContain("Seuil = 30 000 ÷ 20 = 1 500 couverts par mois, soit 70 par jour sur 21 jours");
    const t4 = rendue("bistrot", "bistrot_t4_banquets", "month");
    expect(t4.quiz[1]!.prompt).toContain("Votre salle permet 3 000 couverts par mois");
    // 455 h par trimestre font 151,67 h par mois : l'énoncé dit « environ 152 h », et le
    // calcul qu'il demande tombe juste avec ce nombre affiché.
    expect(t4.quiz[1]!.prompt).toContain("10 salariés à environ 152 h,");
    expect(t4.quiz[1]!.explain).toContain("10 × 152 ÷ 0,5 = 3 040 couverts");
    // L'indice des deux plafonds dit le même nombre que l'option juste.
    expect(t4.hints[2]!.text).toContain("3 000 couverts en salle, 3 040 en heures de brigade");
    expect(t4.quiz[1]!.options.map((o) => o.label)).toEqual([
      "3 040 couverts : les deux contraintes se valent presque",
      "1 520 couverts : la brigade est très limitante",
      "6 080 couverts : la brigade n'est jamais limitante",
      "760 couverts",
    ]);
    // Là où l'heure tombe juste, ni « environ » ni arrondi.
    const t4an = rendue("bistrot", "bistrot_t4_banquets", "year");
    expect(t4an.quiz[1]!.prompt).toContain("10 salariés à 1 820 h,");
    expect(t4an.quiz[1]!.explain).toContain("10 × 1 820 ÷ 0,5 = 36 400 couverts");
    for (const periodicity of DUREES) {
      expect(textesDe(rendue("bistrot", "bistrot_t4_banquets", periodicity)).join(" "), periodicity).not.toMatch(/\d,\d\d h/);
    }
    const t5 = rendue("bistrot", "bistrot_t5_terrasse", "month");
    expect(t5.narrative).toContain("48 000 €, amortis sur trente-six mois. Elle ajouterait environ 600 couverts par mois");
    expect(t5.quiz.at(-1)!.explain).toContain("ignore les trente-cinq suivants");
    const an = rendue("bistrot", "bistrot_t5_terrasse", "year");
    expect(an.narrative).toContain("amortis sur trois exercices");
  });

  it("LA TABLE D'AUGUSTIN · GAMME suit la durée de SES parties, textes hérités compris", () => {
    const t1 = rendue("bistrot-gamme", "bistrotg_t1_reprise", "month");
    expect(t1.hints[3]!.text).toContain("Charges de structure décaissées = 30 000 € par mois");
    expect(t1.quiz[1]!.explain).toContain("les 30 000 € de charges de structure du mois");
    const t4 = rendue("bistrot-gamme", "bistrotg_t4_banquets", "month");
    expect(t4.hints[2]!.text).toContain("3 000 couverts en salle et cuisine, environ 1 520 heures de brigade (3 040 couverts");
    expect(rendue("bistrot-gamme", "bistrotg_t4_banquets", "year").hints[2]!.text).toContain(
      "36 000 couverts en salle et cuisine, 18 200 heures de brigade (36 400 couverts",
    );
  });

  it("LA TABLE D'AUGUSTIN : deux points de ratio rapportent ce que le calcul affiché donne", () => {
    // 0,66 € × 6 000 couverts = 3 960 € : « près de 4 000 € » au trimestre. Au mois,
    // 0,66 × 2 000 = 1 320 € et à l'année 0,66 × 24 000 = 15 840 € : un peu PLUS que la
    // centaine dite, et « près de » aurait dit un peu moins.
    const phrase = (periodicity: Periodicity) => rendue("bistrot", "bistrot_detect_below_breakeven", periodicity).quiz[0]!.explain;
    expect(phrase("quarter")).toContain("Sur 6 000 couverts, cela fait près de 4 000 € par trimestre");
    expect(phrase("month")).toContain("Sur 2 000 couverts, cela fait un peu plus de 1 300 € par mois");
    expect(phrase("year")).toContain("Sur 24 000 couverts, cela fait un peu plus de 15 800 € par an");
  });

  it("les invariants : ce que l'énoncé écrit en clair vaut à toutes les durées", () => {
    for (const periodicity of DUREES) {
      const t = joue("transport", periodicity);
      const marge = 74 - t.product.materialCostPerUnit - t.product.otherVariableCostPerUnit;
      expect(marge, periodicity).toBe(49);
      // Le seuil rapporté à la flotte : charges et capacité suivent le même facteur.
      const flotte = entreprise("transport", periodicity).machineCapacity;
      expect(Math.round((t.fixedCostsPerRound / marge / flotte) * 100), periodicity).toBe(38);
      // Le coût de revient complet d'une palette du récit : structure et flotte sur le trafic.
      const k = t.roundDays / 90;
      expect(
        Math.round(25 + (t.fixedCostsPerRound + t.finance.depreciationPerRound) / (7400 * k)),
        periodicity,
      ).toBe(54);
      // La capacité du parc : celle des équipements de départ, celle de l'entreprise.
      for (const code of GROUPE) {
        const s = joue(code, periodicity);
        const parc = s.equipment!.initialFleet.reduce(
          (total, f) => total + f.count * s.equipment!.types.find((x) => x.code === f.typeCode)!.capacityPerUnit,
          0,
        );
        expect(parc, `${code} ${periodicity}`).toBeCloseTo(entreprise(code, periodicity).machineCapacity, 9);
      }
      // Le couvert du bistrot : 20 € de marge, 70 couverts par jour d'ouverture.
      const b = joue("bistrot", periodicity);
      const margeCouvert = 33 - b.product.materialCostPerUnit - b.product.otherVariableCostPerUnit;
      expect(margeCouvert, periodicity).toBe(20);
      expect(Math.round(b.fixedCostsPerRound / margeCouvert / ((64 * b.roundDays) / 90)), periodicity).toBe(70);
      // La gamme partage les charges, la cuisine et la terrasse du bistrot.
      const g = joue("bistrot-gamme", periodicity);
      expect(g.fixedCostsPerRound, periodicity).toBe(b.fixedCostsPerRound);
      expect(g.investment, periodicity).toEqual(b.investment);
      // Les taux du banquier sont annuels ; les délais, des jours.
      expect(t.finance.overdraftAnnualRate, periodicity).toBe(0.13);
      expect(b.finance.overdraftAnnualRate, periodicity).toBe(0.14);
      expect(b.treasury!.placementAnnualRate, periodicity).toBe(0.02);
      expect(b.finance.supplierPaymentDelayDays, periodicity).toBe(21);
    }
  });
});
