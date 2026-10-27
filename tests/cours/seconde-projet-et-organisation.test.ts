import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { LE_PROJET_D_ENTREPRISE, moyensDeDepart } from "../../src/config/cours/chapitres/le-projet-d-entreprise";
import {
  ENTREPRISES_DE_L_ORGANISATION,
  ORGANISER_L_ACTIVITE,
  activiteDuTrimestre,
  renfortRejoue,
} from "../../src/config/cours/chapitres/organiser-l-activite";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LA_COMMANDE_EXCEPTIONNELLE, commandeExceptionnelle } from "../../src/config/cours/situations/par-chapitre/la-commande-exceptionnelle";
import { UN_EQUIPEMENT_DE_PLUS_AU_DEPART, equipementDePlus } from "../../src/config/cours/situations/par-chapitre/un-equipement-de-plus-au-depart";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX PREMIERS CHAPITRES DU PARCOURS SECONDE · MANAGEMENT ET GESTION, ET LEURS CAS PRATIQUES.
 *
 * Le projet d'entreprise (besoins et ressources de départ, trésorerie qui tient) et l'organisation
 * de l'activité (capacité de l'outil et de l'équipe, occupation, ce qui limite, délais). Ces gardes
 * recomposent leurs chiffres avec le moteur, dans chaque entreprise où ils se jouent : le bilan
 * d'ouverture, l'échéancier de l'emprunt, les charges fixes du premier trimestre, les capacités que
 * le moteur rend, le renfort rejoué, la commande exceptionnelle livrée. Et elles vérifient que les
 * textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, des élisions faites, des
 * accords justes avec les unités féminines, une seule bonne réponse, aucune option qui en contienne
 * une autre, des libellés uniques.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "préparé", "perdu", "livré", "prévu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/« «|» »/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      const codes = new Set(e.categories.map((k) => k.code));
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) {
        expect(codes.has(x.categorie), `${e.id} : ${x.libelle}`).toBe(true);
        // Le test de bout en bout trouve l'élément par son libellé, dans un attribut entre guillemets.
        expect(x.libelle, e.id).not.toContain('"');
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse du cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Les champs d'une étape de montants, par libellé. */
function champs(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants`);
  return Object.fromEntries(e.champs(cas, { soldes: {} }).map((c) => [c.libelle, c.attendu]));
}

const justeDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${id} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const auDixieme = (x: number) => Math.round(x * 10) / 10;

describe("les deux chapitres et leurs cas, dans le parcours Seconde · Management et gestion", () => {
  it("portent les titres du programme, au palier 1, et un bloc du programme de seconde qui se résout", () => {
    const attendus: [Chapitre, string][] = [
      [LE_PROJET_D_ENTREPRISE, "2de MG · S'engager et entreprendre, de l'intention à la création"],
      [ORGANISER_L_ACTIVITE, "2de MG · Organiser et décider, des objectifs à la réalisation"],
    ];
    for (const [ch, bloc] of attendus) {
      expect(PROGRAMME["seconde-mg"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("seconde-mg");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual([bloc]);
      const cite = referentielDeCitation(bloc);
      expect(cite?.code, bloc).toBe("seconde-mg");
      expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace("2de MG · ", ""));
    }
    expect(PROGRAMME["seconde-mg"][1]!.slice(0, 2)).toEqual([LE_PROJET_D_ENTREPRISE.titre, ORGANISER_L_ACTIVITE.titre]);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [UN_EQUIPEMENT_DE_PLUS_AU_DEPART, LE_PROJET_D_ENTREPRISE],
      [LA_COMMANDE_EXCEPTIONNELLE, ORGANISER_L_ACTIVITE],
    ];
    for (const [s, ch] of paires) {
      expect(s.reprend, s.code).toEqual([ch.code]);
      expect(s.palier, s.code).toBe(ch.palier);
      expect(s.parcours, s.code).toBe(ch.parcours);
      expect(s.entreprises?.codes, s.code).toEqual(ch.entreprises?.codes);
      expect(s.libre, s.code).toBe(false);
      expect(s.blocs, s.code).toEqual([]);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture"), s.code).toHaveLength(0);
      expect(s.etapes.at(-1)!.type, s.code).toBe("choix");
      expect(s.code, s.code).not.toBe(ch.code);
    }
  });

  it("le projet se joue partout ; l'organisation, dans les entreprises d'un seul produit servi dans le trimestre", () => {
    expect(LE_PROJET_D_ENTREPRISE.entreprises).toBeUndefined();
    expect([...ENTREPRISES_DE_L_ORGANISATION]).toEqual(["nova", "hotel", "bistrot", "conseil", "ecommerce", "batiment", "transport"]);
    expect(ORGANISER_L_ACTIVITE.entreprises?.codes).toBe(ENTREPRISES_DE_L_ORGANISATION);
    // Celles qui en sont écartées : une gamme (boutique), un abonnement (salle de sport).
    expect(scenarioByCode("boutique").scenario.products!.length).toBeGreaterThan(1);
    expect(scenarioByCode("fitness").scenario.subscription).toBeDefined();
  });
});

describe.each(ENTREPRISES_DU_COURS)("le projet d'entreprise chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const { partie, depart } = anneeJouee(code);
  const f = depart.finance;

  it("les besoins et les ressources sont le bilan d'ouverture du moteur, et s'équilibrent", () => {
    const m = moyensDeDepart(cas);
    // Rien d'autre au bilan d'ouverture que ce que le chapitre range.
    expect(f.overdraft).toBe(0);
    expect(f.vatLiability ?? 0).toBe(0);
    expect(f.shortTermInvestment ?? 0).toBe(0);
    expect(f.goodwill ?? 0).toBe(0);
    expect(m.totalDesBesoins).toBeCloseTo(f.fixedAssetsNet + f.inventoryValue + f.receivables + f.cash, 2);
    expect(m.totalDesRessources).toBeCloseTo(f.equity + f.financialDebt + f.payables, 2);
    expect(m.totalDesBesoins).toBeCloseTo(m.totalDesRessources, 2);
    expect(m.equipements).toBe(depart.fleet!.reduce((t, l) => t + l.bookValue, 0));
    expect(m.autresBiens).toBeGreaterThan(0);
    expect(m.lignes.every((l) => l.montant > 0)).toBe(true);
    const k = champs(LE_PROJET_D_ENTREPRISE, "equilibre", cas);
    expect(k["Total des besoins"]).toBeCloseTo(f.fixedAssetsNet + f.inventoryValue + f.receivables + f.cash, 2);
    expect(k["Total des ressources"]).toBeCloseTo(f.equity + f.financialDebt + f.payables, 2);
  });

  it("qui paie : la part des associés et de la banque, et l'emprunt remboursé selon son échéancier", () => {
    const k = champs(LE_PROJET_D_ENTREPRISE, "qui-paie", cas);
    const total = f.equity + f.financialDebt + f.payables;
    expect(k["Part apportée par les associés (%)"]).toBe(auDixieme((f.equity / total) * 100));
    expect(k["Part prêtée par la banque (%)"]).toBe(auDixieme((f.financialDebt / total) * 100));
    const pret = depart.loans![0]!;
    expect(depart.loans).toHaveLength(1);
    expect(pret.remaining).toBe(f.financialDebt);
    expect(k["Trimestres pour rembourser l'emprunt"]! * pret.perRound).toBe(f.financialDebt);
    // L'échéance que le moteur prélève au premier trimestre est bien celle que le chapitre annonce.
    expect(partie.rounds[0]!.results["joueur"]!.debt!.mandatoryRepayment).toBeCloseTo(pret.perRound, 2);
  });

  it("la trésorerie de départ paie les charges fixes que le moteur compte au premier trimestre", () => {
    const m = moyensDeDepart(cas);
    const k = champs(LE_PROJET_D_ENTREPRISE, "tresorerie", cas);
    const r = partie.rounds[0]!.results["joueur"]!;
    expect(r.incomeStatement.fixedCosts).toBe(s.fixedCostsPerRound);
    expect(k["Charges fixes d'une journée"]).toBeCloseTo(s.fixedCostsPerRound / s.roundDays, 2);
    const jours = k["Jours payés par la trésorerie de départ"]!;
    expect(jours * k["Charges fixes d'une journée"]!).toBeLessThanOrEqual(f.cash);
    expect((jours + 1) * k["Charges fixes d'une journée"]!).toBeGreaterThan(f.cash);
    expect(m.tresorerieFinDuPremierTrimestre).toBe(Math.round(r.balanceSheet.cash - r.balanceSheet.overdraft));
    expect(justeDe(LE_PROJET_D_ENTREPRISE, "lecture-de-la-tresorerie", cas)).toBe(
      jours >= s.roundDays
        ? "La trésorerie de départ paie tout un trimestre, même sans aucune vente"
        : "Les ventes doivent rentrer vite : seule, la trésorerie ne tient pas un trimestre",
    );
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_PROJET_D_ENTREPRISE, code));
});

describe.each(ENTREPRISES_DU_COURS)("un équipement de plus au départ chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const { depart } = anneeJouee(code);

  it("le prix est celui du catalogue, la banque peut le prêter, et le moteur accorde l'emprunt", () => {
    const k = equipementDePlus(cas);
    const type = s.equipment!.types.find((t) => t.code === depart.fleet![0]!.typeCode)!;
    expect(k.prix).toBe(type.costPerUnit);
    expect(k.prix).toBe(cas.immobilisation.prixUnitaire);
    expect(k.plafond).toBe(s.finance.maxDebtToEquity! * depart.finance.equity - depart.finance.financialDebt);
    expect(k.plafond).toBeGreaterThan(k.prix);
    const annee = rejouerAvec(code, "le-projet-d-entreprise:emprunt-de-l-equipement", (tour, d) =>
      tour === 1 ? { ...d, finance: { ...(d.finance ?? {}), newLoan: k.prix } } : undefined,
    );
    expect(annee[0]!.bank?.loanGranted).toBeCloseTo(k.prix, 2);
    expect(annee[0]!.debt?.loanRefused).toBeUndefined();
    expect(k.remboursement * s.finance.loanDurationRounds!).toBeCloseTo(k.prix, 0);
  });

  it("les calculs se recomposent, et le verdict suit la trésorerie qui reste", () => {
    const k = equipementDePlus(cas);
    const m = moyensDeDepart(cas);
    const comptant = champs(UN_EQUIPEMENT_DE_PLUS_AU_DEPART, "comptant", cas);
    expect(comptant["Trésorerie après l'achat"]).toBeCloseTo(depart.finance.cash - k.prix, 2);
    expect(comptant["Jours de charges fixes encore payés"]).toBe(depart.finance.cash > k.prix ? Math.floor((depart.finance.cash - k.prix) / m.chargesParJour) : 0);
    const emprunt = champs(UN_EQUIPEMENT_DE_PLUS_AU_DEPART, "emprunter", cas);
    expect(emprunt["Total des ressources avec l'emprunt"]).toBeCloseTo(m.totalDesRessources + k.prix, 2);
    expect(emprunt["Part apportée par les associés ensuite (%)"]).toBe(auDixieme((depart.finance.equity / (m.totalDesRessources + k.prix)) * 100));
    expect(k.verdict).toBe(k.prix > depart.finance.cash ? "impossible" : k.joursApres >= s.roundDays ? "comptant" : "emprunter");
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(UN_EQUIPEMENT_DE_PLUS_AU_DEPART, code);
    reponseSansIndice(UN_EQUIPEMENT_DE_PLUS_AU_DEPART, code);
  });
});

describe("le projet et son cas, sur les neuf entreprises", () => {
  it("la trésorerie de départ tient un trimestre chez les unes, pas chez les autres", () => {
    const lectures = new Set(ENTREPRISES_DU_COURS.map((c) => moyensDeDepart(casDeLEntreprise(c)).tientUnTrimestre));
    expect([...lectures].sort()).toEqual([false, true]);
  });

  it("les trois réponses aux associés se rencontrent", () => {
    const verdicts = new Set(ENTREPRISES_DU_COURS.map((c) => equipementDePlus(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["comptant", "emprunter", "impossible"]);
  });
});

describe.each(ENTREPRISES_DE_L_ORGANISATION)("organiser l'activité chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const { partie, depart } = anneeJouee(code);
  const r = partie.rounds[0]!.results["joueur"]!;

  it("les deux capacités sont celles que le moteur rend au premier trimestre", () => {
    const k = champs(ORGANISER_L_ACTIVITE, "capacites", cas);
    expect(depart.availability).toBe(1);
    expect(depart.productivity).toBe(1);
    expect(k["Capacité des équipements"]).toBe(Math.round(r.production.machineCapacity));
    expect(k["Capacité des équipements"]).toBe(depart.machineCapacity);
    expect(k["Capacité de l'équipe"]).toBe(Math.floor(r.production.laborCapacity + 1e-9));
    expect(k["Capacité de l'équipe"]).toBe(Math.floor((depart.headcount * depart.hoursPerEmployee) / s.product.hoursPerUnit + 1e-9));
    expect(k["Capacité de l'entreprise"]).toBe(Math.min(k["Capacité des équipements"]!, k["Capacité de l'équipe"]!));
  });

  it("l'occupation et les ventes manquées se recomposent avec le premier trimestre du moteur", () => {
    const a = activiteDuTrimestre(cas);
    const segments = Object.values(r.market.bySegment);
    expect(a.production).toBe(Math.round(r.production.produced));
    expect(a.ventes).toBe(Math.round(soldUnits(r)));
    expect(a.demande).toBe(Math.round(segments.reduce((t, v) => t + v.demandForCompany, 0)));
    expect(a.stock).toBe(s.perishable ? 0 : depart.finishedGoods.quantity);
    // Rien n'a été produit au-delà de la capacité.
    expect(a.production).toBeLessThanOrEqual(a.capacite);
    const k = champs(ORGANISER_L_ACTIVITE, "premier-trimestre", cas);
    expect(k["Taux d'occupation (%)"]).toBe(auDixieme((a.production / a.capacite) * 100));
    expect(k["Ventes manquées"]).toBe(a.demande - a.ventes);
    // Les ventes manquées sont celles que le moteur perd, à l'arrondi près.
    expect(Math.abs(k["Ventes manquées"]! - segments.reduce((t, v) => t + v.lost, 0))).toBeLessThanOrEqual(1);
    const limite = a.manquees === 0 ? "clients" : a.demande <= a.stock + a.capacite ? "prevision" : a.outil <= a.equipe ? "outil" : "equipe";
    expect(a.limite).toBe(limite);
  });

  it("le renfort : un équipement ou un salarié de plus, et le délai que le moteur fait jouer", () => {
    const a = activiteDuTrimestre(cas);
    const k = champs(ORGANISER_L_ACTIVITE, "renfort", cas);
    expect(k["Capacité avec un équipement de plus"]).toBe(Math.min(a.outil + a.equipement.capacite, a.equipe));
    expect(k["Capacité avec un salarié de plus"]).toBe(Math.min(a.outil, Math.floor(((a.effectif + 1) * a.heuresParSalarie) / a.heuresParUnite + 1e-9)));
    expect(a.gainEquipement).not.toBe(a.gainSalarie);
    expect(a.equipement.prix).toBe(cas.immobilisation.prixUnitaire);
    // Décidé au premier trimestre, le renfort ne change rien au premier, tout au deuxième.
    const rj = renfortRejoue(cas);
    expect(rj.premier).toEqual({ outil: a.outil, equipe: a.equipe });
    expect(rj.deuxieme).toEqual({ outil: a.outilPlus, equipe: a.equipePlus });
    expect(justeDe(ORGANISER_L_ACTIVITE, "delais", cas)).toBe("Au deuxième trimestre : il faut le temps d'installer et de recruter");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(ORGANISER_L_ACTIVITE, code));
});

describe.each(ENTREPRISES_DE_L_ORGANISATION)("la commande exceptionnelle chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;

  it("la commande est celle que l'arène propose au premier trimestre, et le moteur en livre ce que le cas annonce", () => {
    const k = commandeExceptionnelle(cas);
    const proposee = anneeJouee(code).partie.rounds[0]!.results["joueur"]!.orderOffer!;
    const offre = s.orderOffers!.find((o) => o.code === proposee.code)!;
    expect(proposee.accepted).toBe(false);
    expect(k.unites).toBe(offre.units);
    expect(k.prix).toBe(offre.price);
    expect(Math.abs(k.livreeParLArene - k.livrable)).toBeLessThanOrEqual(1);
    if (k.verdict === "pas-en-entier") expect(k.livrable).toBeLessThan(k.unites);
    else expect(k.livreeParLArene).toBe(k.unites);
    const champ = champs(LA_COMMANDE_EXCEPTIONNELLE, "ce-qui-reste", cas);
    expect(champ["Capacité de l'entreprise"]).toBe(k.a.capacite);
    expect(champ["Production pour tout servir"]).toBe(Math.max(0, k.a.demande + k.unites - k.a.stock));
    expect(champ["Reste pour la commande"]).toBe(k.livrable);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_COMMANDE_EXCEPTIONNELLE, code);
    reponseSansIndice(LA_COMMANDE_EXCEPTIONNELLE, code);
  });
});

describe("l'organisation et son cas, sur les sept entreprises", () => {
  it("ce qui limite les ventes change d'une entreprise à l'autre", () => {
    const limites = new Set(ENTREPRISES_DE_L_ORGANISATION.map((c) => activiteDuTrimestre(casDeLEntreprise(c)).limite));
    expect([...limites].sort()).toEqual(["clients", "equipe", "prevision"]);
    const ajouts = new Set(ENTREPRISES_DE_L_ORGANISATION.map((c) => justeDe(ORGANISER_L_ACTIVITE, "quoi-ajouter", casDeLEntreprise(c))));
    expect(ajouts.size).toBe(2);
  });

  it("les trois réponses à la direction se rencontrent", () => {
    const verdicts = new Set(ENTREPRISES_DE_L_ORGANISATION.map((c) => commandeExceptionnelle(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["deja-prevue", "en-produisant-plus", "pas-en-entier"]);
  });
});
