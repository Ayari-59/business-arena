import type { CompanyRoundResult, SupplierDef } from "../../../engine/types";
import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CHOISIR SON FOURNISSEUR, PRIX, QUALITÉ ET DÉLAI DE PAIEMENT (BTS GPME, palier 2).
 *
 * Chaque entreprise du cours a, dans son scénario, plusieurs offres de fournisseurs : celle de
 * référence (la première, celle que l'entreprise garde si elle ne choisit rien), une moins chère
 * et une plus chère. Chacune a son prix (un multiplicateur du coût d'achat d'une unité), son
 * bonus de qualité perçue, son délai de paiement et son risque de rupture d'approvisionnement
 * (`suppliers`, src/engine/types.ts : SupplierDef). Le chapitre les compare sur le papier, puis
 * l'arène rejoue l'année avec chacune, choisie dès le premier trimestre et gardée toute l'année
 * (`supplierChoice`, reconduit par le moteur), tout le reste identique (gestion-de-la-pme.ts).
 *
 * Ce que le moteur fait du choix, et que le chapitre lit : le coût d'achat (matière × prix de
 * l'offre), la dette fournisseurs de fin de trimestre (achats du trimestre × délai ÷ durée du
 * trimestre, TTC quand la TVA joue ; le délai de l'offre remplace celui du scénario), la qualité
 * perçue (le bonus, qui fait la demande), la rupture tirée au hasard (la capacité du trimestre
 * baisse). Le taux de rebuts ne dépend pas du fournisseur : il suit la qualité produite, celle du
 * budget qualité, qui baisse quand l'outil tourne au-dessus de son seuil de charge ; un rebut
 * coûte ce qu'il a coûté à produire, donc moins avec une offre moins chère.
 *
 * LA BOUTIQUE N'EN EST PAS : chaque référence de sa gamme a son propre catalogue de
 * fournisseurs (`products[].suppliers`), et une offre du scénario n'y vaut pas pour toute la
 * production (un code absent d'un catalogue retombe sur son premier fournisseur). Le chapitre
 * garde les entreprises dont les offres valent pour tout ce qu'elles achètent.
 */

/** Les entreprises dont les offres du scénario valent pour toute la production : celles sans gamme. */
export const ENTREPRISES_A_UN_CATALOGUE = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.products);

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (x: number) => (x > 0 ? `+${x.toLocaleString("fr-FR")}` : x.toLocaleString("fr-FR").replace(/^-/, "−"));
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Le délai d'une offre, dans une phrase : « à 45 jours », ou « comptant ». */
const aDelai = (jours: number) => (jours === 0 ? "comptant" : `à ${jours} jours`);
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));

/** Les achats du trimestre : le coût variable produit, moins les autres charges variables décaissées. */
export const achatsDuTrimestre = (r: CompanyRoundResult) =>
  r.incomeStatement.variableProductionCost + (r.cashFlow.items.find((i) => i.label === "couts_variables_decaisses")?.amount ?? 0);

/** Ce que l'arène fait d'une offre gardée toute l'année. */
function anneeAvec(c: Cas, o: SupplierDef, reference: boolean) {
  const s = scenarioByCode(c.code).scenario;
  const annee = reference ? anneeDeReference(c.code) : rejouerAvec(c.code, `fournisseur-${o.code}`, (_t, d) => ({ ...d, supplierChoice: o.code }));
  const fin = annee.at(-1)!;
  return {
    code: o.code,
    nom: o.name,
    prixUnitaire: auCentime(s.product.materialCostPerUnit * o.costMultiplier),
    multiplicateur: o.costMultiplier,
    delai: o.paymentDelayDays,
    bonus: o.qualityBonus,
    risque: Math.round(o.supplyRiskProbability * 1000) / 10,
    perteDeCapacite: Math.round((1 - o.supplyRiskAvailabilityHit) * 1000) / 10,
    achats: Math.round(surLAnnee(annee, achatsDuTrimestre)),
    achatsT4: auCentime(achatsDuTrimestre(fin)),
    ventes: Math.round(surLAnnee(annee, soldUnits)),
    rebuts: Math.round(surLAnnee(annee, (r) => r.qualityCosts?.internalFailure ?? 0)),
    ruptures: annee.filter((r) => r.supplier?.supplyDisruption).length,
    resultat: Math.round(surLAnnee(annee, (r) => r.incomeStatement.netIncome)),
    dettes: Math.round(fin.balanceSheet.payables),
    creances: Math.round(fin.balanceSheet.receivables),
    stocks: Math.round(fin.balanceSheet.inventoryValue),
    tvaAReverser: Math.round(fin.balanceSheet.vatLiability ?? 0),
    tresorerie: Math.round(fin.functionalBalance.netTreasury),
    affacturageImpose: Math.round(surLAnnee(annee, (r) => r.treasury?.forcedFactored ?? 0)),
  };
}

export type ParOffre = ReturnType<typeof anneeAvec>;
export type Tresorerie = "plus-que-le-resultat" | "moins-que-le-resultat" | "baisse";

/** Les offres du scénario, l'année rejouée avec chacune, et ce qui sépare la moins chère de celle de référence. */
export function choixDuFournisseur(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const catalogue = s.suppliers ?? [];
  if (catalogue.length < 3) throw new Error(`Pas de trois offres de fournisseurs pour ${c.code}`);
  const parPrix = [...catalogue].sort((a, b) => a.costMultiplier - b.costMultiplier);
  const offres = catalogue.map((o, k) => anneeAvec(c, o, k === 0));
  const reference = offres[0]!;
  const moinsChere = offres.find((o) => o.code === parPrix[0]!.code)!;
  const plusChere = offres.find((o) => o.code === parPrix.at(-1)!.code)!;
  const tva = s.finance.vatRate ?? 0;
  const jours = s.roundDays;
  // Les dettes fournisseurs de fin d'année : les achats du dernier trimestre, au délai de l'offre.
  const dettesAttendues = offres.map((o) => auCentime(o.achatsT4 * (1 + tva) * Math.min(1, o.delai / jours)));
  const economieAProductionEgale = Math.round(reference.achats * (1 - moinsChere.multiplicateur / reference.multiplicateur));
  const meilleure = offres.reduce((m, o) => (o.resultat > m.resultat ? o : m));
  // D'où vient l'écart de trésorerie entre la moins chère et la référence : le résultat, puis
  // le besoin en fonds de roulement (dettes et TVA qui restent à payer, créances et stocks).
  const d = {
    resultat: moinsChere.resultat - reference.resultat,
    dettes: moinsChere.dettes - reference.dettes,
    tva: moinsChere.tvaAReverser - reference.tvaAReverser,
    creances: moinsChere.creances - reference.creances,
    stocks: moinsChere.stocks - reference.stocks,
  };
  const ecartDeTresorerie = d.resultat + d.dettes + d.tva - d.creances - d.stocks;
  const tresorerie: Tresorerie = ecartDeTresorerie < 0 ? "baisse" : ecartDeTresorerie > d.resultat ? "plus-que-le-resultat" : "moins-que-le-resultat";
  return {
    tva,
    jours,
    matiere: s.product.materialCostPerUnit,
    avecRebuts: !!s.qualityCosts,
    avecStocks: offres.some((o) => o.stocks !== 0),
    offres,
    reference,
    moinsChere,
    plusChere,
    dettesAttendues,
    economieAProductionEgale,
    meilleure,
    d,
    ecartDeTresorerie,
    tresorerie,
  };
}

const nomDe = (o: { nom: string }) => `« ${o.nom} »`;

export const CHOISIR_SON_FOURNISSEUR: Chapitre = {
  code: "choisir-son-fournisseur",
  parcours: "gpme",
  palier: 2,
  blocs: ["BTS GPME Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME"],
  titre: "Choisir son fournisseur : prix, qualité et délai de paiement",
  accroche:
    "Le moins cher n'est pas toujours le meilleur fournisseur, et le meilleur résultat ne fait pas toujours la meilleure trésorerie. Les offres du scénario, comparées sur le papier, puis l'année rejouée avec chacune.",
  objectifs: [
    "Comparer des offres de fournisseurs sur le prix, la qualité, le délai et le risque",
    "Calculer la dette fournisseurs que crée un délai de paiement",
    "Lire ce qu'une offre change au résultat de l'année",
    "Expliquer l'écart de trésorerie par le résultat et le besoin en fonds de roulement",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_A_UN_CATALOGUE,
    pourquoi:
      "ce chapitre compare des offres qui valent pour toute la production, et à la boutique chaque référence de la gamme a son propre catalogue de fournisseurs.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les offres des fournisseurs",
      notions: ["variable_costs", "payment_terms"],
      texte: (c) => {
        const f = choixDuFournisseur(c);
        return [
          `${c.entreprise} achète ce qu'il faut pour produire : ${eur(f.matiere)} par unité chez son fournisseur habituel, ${nomDe(f.reference)}, payé ${aDelai(f.reference.delai)}. D'autres offres existent, et aucune n'est meilleure sur tous les points.`,
          `Le prix fait le coût d'achat. Le bonus de qualité s'ajoute à la qualité que les clients perçoivent, et elle fait la demande. Le délai de paiement dit combien de temps le fournisseur fait crédit. Le risque de rupture est la probabilité, chaque trimestre, que l'approvisionnement manque : la capacité du trimestre baisse alors.`,
        ];
      },
      tableau: (c) => {
        const f = choixDuFournisseur(c);
        return {
          titre: `Les offres des fournisseurs ${dE(c.entreprise)}`,
          colonnes: f.offres.map(nomDe),
          lignes: [
            { libelle: "Prix d'achat d'une unité", valeurs: f.offres.map((o) => eur(o.prixUnitaire)) },
            { libelle: "Bonus de qualité perçue", valeurs: f.offres.map((o) => signe(o.bonus)) },
            { libelle: "Délai de paiement (jours)", valeurs: f.offres.map((o) => String(o.delai)) },
            { libelle: "Risque de rupture par trimestre", valeurs: f.offres.map((o) => pct(o.risque)) },
            { libelle: "Capacité perdue en cas de rupture", valeurs: f.offres.map((o) => pct(o.perteDeCapacite)) },
          ],
        };
      },
      repere: () => "Un fournisseur se choisit sur quatre critères à la fois : le prix, la qualité, le délai de paiement et la sûreté de l'approvisionnement.",
    },
    {
      id: "prix",
      type: "montants",
      titre: "Ce que coûte une unité",
      notions: ["variable_costs"],
      question: (c) => {
        const f = choixDuFournisseur(c);
        return `Calculez le prix d'achat d'une unité chez ${nomDe(f.moinsChere)} et chez ${nomDe(f.plusChere)}, puis ce que l'offre la moins chère ferait économiser sur l'année si ${c.entreprise} produisait autant : ses achats de l'année chez ${nomDe(f.reference)} ont été de ${eur(f.reference.achats)}.`;
      },
      champs: (c) => {
        const f = choixDuFournisseur(c);
        return [
          {
            libelle: `Prix d'une unité, ${nomDe(f.moinsChere)}`,
            attendu: f.moinsChere.prixUnitaire,
            calcul: `${eur(f.matiere)} × ${f.moinsChere.multiplicateur.toLocaleString("fr-FR")} = ${eur(f.moinsChere.prixUnitaire)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Prix d'une unité, ${nomDe(f.plusChere)}`,
            attendu: f.plusChere.prixUnitaire,
            calcul: `${eur(f.matiere)} × ${f.plusChere.multiplicateur.toLocaleString("fr-FR")} = ${eur(f.plusChere.prixUnitaire)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Économie sur l'année, à production égale",
            attendu: f.economieAProductionEgale,
            calcul: `${eur(f.reference.achats)} × (1 − ${f.moinsChere.multiplicateur.toLocaleString("fr-FR")}) = ${eur(f.economieAProductionEgale)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const f = choixDuFournisseur(c);
        return [
          `Sur le prix seul, ${nomDe(f.moinsChere)} ferait gagner ${eur(f.economieAProductionEgale)} dans l'année. Mais l'offre se paie ${aDelai(f.moinsChere.delai)}, quand ${nomDe(f.reference)} se paie ${aDelai(f.reference.delai)}, et son risque de rupture de ${pct(f.moinsChere.risque)} par trimestre : le prix ne dit pas tout.`,
        ];
      },
    },
    {
      id: "delai",
      type: "montants",
      titre: "Le délai de paiement et la dette au bilan",
      notions: ["payment_terms", "bfr"],
      tableau: (c) => {
        const f = choixDuFournisseur(c);
        return {
          titre: "Le dernier trimestre de l'année, rejoué avec chaque offre",
          colonnes: f.offres.map(nomDe),
          lignes: [
            { libelle: `Achats du trimestre (hors taxes)`, valeurs: f.offres.map((o) => eur(o.achatsT4)) },
            { libelle: "Délai de paiement (jours)", valeurs: f.offres.map((o) => String(o.delai)) },
          ],
        };
      },
      question: (c) => {
        const f = choixDuFournisseur(c);
        return f.tva > 0
          ? `Un trimestre dure ${f.jours} jours. Calculez, pour chaque offre, les dettes fournisseurs au bilan de fin d'année : les achats du trimestre, TVA comprise (${pct(f.tva * 100)}), × délai ÷ ${f.jours}.`
          : `Un trimestre dure ${f.jours} jours. Calculez, pour chaque offre, les dettes fournisseurs au bilan de fin d'année : achats du trimestre × délai ÷ ${f.jours}.`;
      },
      champs: (c) => {
        const f = choixDuFournisseur(c);
        return f.offres.map((o, k) => ({
          libelle: `Dettes fournisseurs, ${nomDe(o)}`,
          attendu: f.dettesAttendues[k]!,
          calcul:
            f.tva > 0
              ? `${eur(o.achatsT4)} × ${(1 + f.tva).toLocaleString("fr-FR")} × ${o.delai} ÷ ${f.jours} = ${eur(f.dettesAttendues[k]!)}`
              : `${eur(o.achatsT4)} × ${o.delai} ÷ ${f.jours} = ${eur(f.dettesAttendues[k]!)}`,
          tolerance: 1,
        }));
      },
      explication: (c) => {
        const f = choixDuFournisseur(c);
        const sansCredit = f.offres.filter((o) => o.delai === 0);
        return [
          `La dette fournisseurs, c'est l'argent que le fournisseur laisse à l'entreprise en attendant d'être payé : un crédit gratuit. Avec ${nomDe(f.reference)}, ${c.entreprise} doit ${eur(f.reference.dettes)} à la clôture ; avec ${nomDe(f.moinsChere)}, ${eur(f.moinsChere.dettes)}.`,
          sansCredit.length > 0
            ? `${sansCredit.map(nomDe).join(" et ")} se paie${sansCredit.length > 1 ? "nt" : ""} comptant : pas de dette, donc pas de crédit, et la trésorerie paie les achats dès qu'ils sont faits.`
            : "Plus le délai est long, plus ce crédit est grand : à achats égaux, il est proportionnel au délai.",
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année avec chaque offre",
      notions: ["variable_costs", "income_statement"],
      tableau: (c) => {
        const f = choixDuFournisseur(c);
        return {
          titre: "L'année jouée avec chaque offre, tout le reste identique",
          colonnes: f.offres.map(nomDe),
          lignes: [
            { libelle: "Achats de l'année", valeurs: f.offres.map((o) => eur(o.achats)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: f.offres.map((o) => qte(o.ventes)) },
            ...(f.avecRebuts ? [{ libelle: "Coût des rebuts de l'année", valeurs: f.offres.map((o) => eur(o.rebuts)) }] : []),
            { libelle: "Trimestres avec une rupture d'approvisionnement", valeurs: f.offres.map((o) => String(o.ruptures)) },
            { libelle: "Résultat de l'exercice", valeurs: f.offres.map((o) => eur(o.resultat)) },
            { libelle: "Trésorerie nette de fin d'année", valeurs: f.offres.map((o) => eur(o.tresorerie)) },
          ],
        };
      },
      question: (c) => {
        const f = choixDuFournisseur(c);
        return `Par rapport à l'année jouée avec ${nomDe(f.reference)}, calculez l'économie réelle sur les achats avec ${nomDe(f.moinsChere)}, puis l'écart de résultat de l'exercice avec ${nomDe(f.moinsChere)} et avec ${nomDe(f.plusChere)}.`;
      },
      champs: (c) => {
        const f = choixDuFournisseur(c);
        const economie = f.reference.achats - f.moinsChere.achats;
        return [
          { libelle: `Économie réelle sur les achats, ${nomDe(f.moinsChere)}`, attendu: economie, calcul: `${eur(f.reference.achats)} − ${eur(f.moinsChere.achats)} = ${eur(economie)}`, tolerance: 1 },
          {
            libelle: `Écart de résultat, ${nomDe(f.moinsChere)}`,
            attendu: f.moinsChere.resultat - f.reference.resultat,
            calcul: `${eur(f.moinsChere.resultat)} − ${retranche(f.reference.resultat)} = ${eur(f.moinsChere.resultat - f.reference.resultat)}`,
            tolerance: 1,
          },
          {
            libelle: `Écart de résultat, ${nomDe(f.plusChere)}`,
            attendu: f.plusChere.resultat - f.reference.resultat,
            calcul: `${eur(f.plusChere.resultat)} − ${retranche(f.reference.resultat)} = ${eur(f.plusChere.resultat - f.reference.resultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const f = choixDuFournisseur(c);
        const economie = f.reference.achats - f.moinsChere.achats;
        const p = f.plusChere;
        const r = f.reference;
        const paye = p.resultat >= r.resultat ? "et assez pour payer son prix" : "mais pas assez pour payer son prix";
        return [
          Math.abs(economie - f.economieAProductionEgale) <= 1
            ? `L'économie réelle est celle du calcul à production égale (${eur(economie)}) : l'arène a produit autant avec les deux offres.`
            : `L'économie réelle (${eur(economie)}) n'est pas tout à fait celle du calcul à production égale (${eur(f.economieAProductionEgale)}) : avec un autre fournisseur, l'arène ne produit pas exactement autant, parce que la qualité perçue, et les ruptures quand il y en a, changent un peu les ventes.`,
          p.ventes > r.ventes
            ? `La qualité de l'offre ${nomDe(p)} attire des clients (ventes de l'année : ${qte(p.ventes)} ${c.unites}, contre ${qte(r.ventes)}), ${paye}.`
            : `La qualité de l'offre ${nomDe(p)} ne fait pas vendre davantage cette année (ventes de l'année : ${qte(p.ventes)} ${c.unites}, contre ${qte(r.ventes)}) : ${p.resultat >= r.resultat ? "son prix est pourtant couvert" : "son prix n'est couvert par rien"}.`,
          ...(f.avecRebuts
            ? [
                `Le taux de rebuts ne dépend pas du fournisseur, mais de la qualité produite (le budget qualité, et un outil qui ne tourne pas trop chargé) ; chaque rebut coûte en revanche ce qu'il a coûté à produire, d'où des rebuts ${f.moinsChere.rebuts <= r.rebuts ? "moins chers" : "plus chers"} avec ${nomDe(f.moinsChere)} (${eur(f.moinsChere.rebuts)} contre ${eur(r.rebuts)}).`,
              ]
            : []),
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "D'où vient l'écart de trésorerie",
      notions: ["bfr", "net_treasury"],
      tableau: (c) => {
        const f = choixDuFournisseur(c);
        const m = f.moinsChere;
        const r = f.reference;
        return {
          titre: "À la clôture, avec l'offre de référence et avec la moins chère",
          colonnes: [nomDe(r), nomDe(m), "Écart"],
          lignes: [
            { libelle: "Résultat de l'exercice", valeurs: [eur(r.resultat), eur(m.resultat), ecart(f.d.resultat)] },
            { libelle: "Dettes fournisseurs", valeurs: [eur(r.dettes), eur(m.dettes), ecart(f.d.dettes)] },
            ...(f.tva > 0 ? [{ libelle: "TVA à reverser à l'État", valeurs: [eur(r.tvaAReverser), eur(m.tvaAReverser), ecart(f.d.tva)] }] : []),
            { libelle: "Créances clients", valeurs: [eur(r.creances), eur(m.creances), ecart(f.d.creances)] },
            ...(f.avecStocks ? [{ libelle: "Stocks", valeurs: [eur(r.stocks), eur(m.stocks), ecart(f.d.stocks)] }] : []),
          ],
        };
      },
      question: () =>
        "Le reste du bilan est le même avec les deux offres. Calculez l'écart de trésorerie nette de fin d'année : l'écart de résultat, plus l'écart des dettes qui restent à payer, moins l'écart des créances et des stocks qui attendent d'être encaissés.",
      champs: (c) => {
        const f = choixDuFournisseur(c);
        const termes = [
          eur(f.d.resultat),
          `${f.d.dettes < 0 ? "−" : "+"} ${eur(Math.abs(f.d.dettes))}`,
          ...(f.tva > 0 ? [`${f.d.tva < 0 ? "−" : "+"} ${eur(Math.abs(f.d.tva))}`] : []),
          `${f.d.creances < 0 ? "+" : "−"} ${eur(Math.abs(f.d.creances))}`,
          ...(f.avecStocks ? [`${f.d.stocks < 0 ? "+" : "−"} ${eur(Math.abs(f.d.stocks))}`] : []),
        ];
        return [{ libelle: "Écart de trésorerie nette", attendu: f.ecartDeTresorerie, calcul: `${termes.join(" ")} = ${eur(f.ecartDeTresorerie)}`, tolerance: 3 }];
      },
      explication: (c) => {
        const f = choixDuFournisseur(c);
        const m = f.moinsChere;
        const r = f.reference;
        const lecture =
          f.tresorerie === "baisse"
            ? `${f.d.resultat > 0 ? `Le résultat monte de ${eur(f.d.resultat)}, et pourtant` : `Le résultat change de ${eur(f.d.resultat)}, et`} la trésorerie de fin d'année baisse de ${eur(-f.ecartDeTresorerie)}.`
            : f.tresorerie === "plus-que-le-resultat"
              ? `La trésorerie gagne ${eur(f.ecartDeTresorerie)}, plus que le résultat (${eur(f.d.resultat)}).`
              : `La trésorerie gagne ${eur(f.ecartDeTresorerie)}, moins que le résultat (${eur(f.d.resultat)}).`;
        const dettes =
          f.d.dettes < 0
            ? ` L'offre ${nomDe(m)} se paie ${aDelai(m.delai)}, quand ${nomDe(r)} se paie ${aDelai(r.delai)} : la dette fournisseurs de la clôture fond de ${eur(-f.d.dettes)}, et ce qu'on ne doit plus est de l'argent déjà sorti.`
            : f.d.dettes > 0
              ? ` L'offre ${nomDe(m)} se paie ${aDelai(m.delai)}, quand ${nomDe(r)} se paie ${aDelai(r.delai)} : à la clôture, l'entreprise lui doit ${eur(f.d.dettes)} de plus, autant d'argent encore en caisse.`
              : "";
        const impose =
          r.affacturageImpose > m.affacturageImpose
            ? ` Avec ${nomDe(r)}, la banque a même dû céder d'office ${eur(r.affacturageImpose - m.affacturageImpose)} de créances de plus, faute de trésorerie : c'est ce qui baisse ses créances clients.`
            : "";
        return [lecture + dettes + impose, "Un fournisseur change le résultat par son prix, et la trésorerie par son prix et par son délai : les deux se regardent ensemble."];
      },
    },
    {
      id: "choix",
      type: "choix",
      titre: "Quelle offre retenir ?",
      notions: ["variable_costs", "payment_terms"],
      question: (c) => `Sur l'année rejouée, quelle offre donne à ${c.entreprise} le meilleur résultat de l'exercice ?`,
      options: (c) => {
        const f = choixDuFournisseur(c);
        const autre = (o: ParOffre) => `${nomDe(o)} donne ${eur(o.resultat)}, contre ${eur(f.meilleure.resultat)} avec ${nomDe(f.meilleure)}.`;
        const motif = (o: ParOffre) =>
          o === f.reference ? "le fournisseur habituel" : o === f.moinsChere ? "le prix le plus bas" : o === f.plusChere ? "la meilleure qualité" : "une offre de plus";
        return f.offres.map((o) => ({
          texte: `${nomDe(o)}, ${motif(o)}`,
          juste: o === f.meilleure,
          retour:
            o === f.meilleure
              ? `Oui : ${eur(o.resultat)} sur l'année, ${o === f.reference ? "plus qu'avec les autres offres" : `soit ${eur(o.resultat - f.reference.resultat)} de plus qu'avec ${nomDe(f.reference)}`}. ${o.delai < f.reference.delai ? `Elle se paie ${aDelai(o.delai)}, plus tôt que l'offre habituelle : la trésorerie est à surveiller.` : `Elle se paie ${aDelai(o.delai)}, pas plus tôt que l'offre habituelle : la trésorerie n'y perd pas.`}`
              : `Non : ${autre(o)}`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payment_terms"],
      texte: (c) => {
        const f = choixDuFournisseur(c);
        return [
          `Chez ${c.entreprise}, ${nomDe(f.meilleure)} donne le meilleur résultat de l'année (${eur(f.meilleure.resultat)}). ${f.tresorerie === "baisse" ? `Mais la trésorerie de fin d'année baisse avec ${nomDe(f.moinsChere)} : le crédit du fournisseur habituel compte autant que son prix.` : `La trésorerie suit, de ${eur(f.ecartDeTresorerie)} avec ${nomDe(f.moinsChere)}.`}`,
          "Choisir un fournisseur, c'est arbitrer entre le prix (le coût d'achat et le résultat), la qualité (les ventes), le délai de paiement (la trésorerie) et le risque de rupture (la capacité). Une offre moins chère payée comptant peut améliorer le résultat et creuser la trésorerie.",
        ];
      },
      repere: () => "Dettes fournisseurs = achats du trimestre (TTC) × délai ÷ durée du trimestre. Écart de trésorerie = écart de résultat + écart des dettes − écart des créances et des stocks.",
    },
  ],
};
