import type { EquipmentTypeDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { TRIMESTRE_DE_L_ACHAT, machineDuChapitre } from "./croitre-en-investissant";
import {
  COUT_DU_CAPITAL_ANNUEL,
  DUREE_DU_PROJET,
  ENTREPRISES_DE_L_ACTUALISATION,
  TAUX_TRIMESTRIEL,
  projet,
  tauxAnnuelEquivalent,
  toleranceDActualisation,
  vanAuTaux,
  vanExacte,
} from "./la-valeur-actuelle-nette";

/** Au centime, sans zéro négatif. */
const centime = (x: number) => auCentime(x) || 0;
/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dixieme = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** « 1 + t » d'un taux composé ; négatif, le taux se retranche : « 1 − 7,43 % », jamais « 1 + −7,43 % ». */
const unPlus = (t: number) => (t < 0 ? `1 − ${pct(-t)}` : `1 + ${pct(t)}`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/**
 * CHAPITRE : LE TAUX DE RENTABILITÉ INTERNE ET LE CHOIX ENTRE DEUX PROJETS (DSCG, UE2 Finance,
 * palier 4).
 *
 * Deux projets qui s'excluent, que l'arène sait jouer : le projet A est la machine du chapitre
 * précédent (« La valeur actuelle nette d'un investissement »), le premier équipement du parc ; le
 * projet B est la machine suivante du catalogue, celle qui ajoute un peu plus de capacité pour un
 * prix plus élevé (`machineSuivante`). Chacune est achetée au trimestre 1, payée sur la
 * trésorerie, et l'arène rejoue les douze trimestres du projet avec elle : les flux, l'impôt et la
 * valeur résiduelle se calculent comme au chapitre précédent (`projet`).
 *
 * Le chapitre calcule la VAN de chacun, son TRI par dichotomie (l'élève l'encadre entre deux taux
 * entiers et interpole, puis vérifie qu'au TRI la VAN s'annule), son indice de profitabilité et
 * son délai de récupération actualisé. Quand la VAN et le TRI ne classent pas les deux projets
 * dans le même ordre, il calcule le taux d'intersection de Fisher, celui qui annule la VAN des
 * flux différentiels ; quand ils les classent pareil, il dit pourquoi. Le choix final se fait à
 * la VAN, au coût du capital du cours (`COUT_DU_CAPITAL_ANNUEL`).
 *
 * Ce n'est pas « Voir plus grand », le cas pratique de « Croître en investissant », qui compare la
 * plus grande machine à la petite sur le résultat net d'une année : ici, les deux projets se
 * comparent sur leurs flux actualisés, et par trois critères qui peuvent se contredire.
 *
 * LES ENTREPRISES sont celles du chapitre précédent, pour les mêmes raisons ; la machine suivante
 * n'y fait défaillir aucun rejeu (la garde le vérifie). Chez MAILLE & CO, aucun des deux projets
 * n'est acceptable : leurs TRI sont négatifs, et le classement des deux critères, qui diverge, ne
 * décide rien. Le chapitre ne cherche alors pas le taux de Fisher, et le dit.
 */

/** Le projet B : la machine du catalogue qui suit celle du chapitre, la plus petite de celles qui ajoutent plus de capacité. */
export function machineSuivante(code: string): EquipmentTypeDef {
  const a = machineDuChapitre(code);
  return [...scenarioByCode(code).scenario.equipment!.types]
    .filter((t) => t.capacityPerUnit > a.capacityPerUnit)
    .sort((x, y) => x.capacityPerUnit - y.capacityPerUnit)[0]!;
}

/** Les bornes où la dichotomie cherche un taux trimestriel : de −50 % à +500 % par trimestre. */
export const BORNES_DE_LA_DICHOTOMIE = [-0.5, 5] as const;
/** La dichotomie s'arrête quand l'intervalle est plus étroit qu'un millionième de point. */
const PRECISION = 1e-8;

/**
 * Le taux qui annule la VAN, cherché par dichotomie : on coupe l'intervalle en deux, et on garde
 * la moitié où la VAN change de signe. Absent quand la VAN ne change pas de signe entre les bornes.
 */
export function tauxQuiAnnule(cout: number, flux: readonly number[], residuelle: number, bas: number = BORNES_DE_LA_DICHOTOMIE[0]) {
  let lo = bas;
  let hi: number = BORNES_DE_LA_DICHOTOMIE[1];
  const van = (r: number) => vanExacte(cout, flux, residuelle, r);
  if (!(van(lo) > 0 && van(hi) < 0)) return null;
  let pas = 0;
  while (hi - lo > PRECISION) {
    const m = (lo + hi) / 2;
    if (van(m) > 0) lo = m;
    else hi = m;
    pas++;
  }
  return { taux: (lo + hi) / 2, pas };
}

/** Le TRI d'un projet, et son encadrement entre deux taux trimestriels entiers, comme l'élève le cherche. */
function rendement(cout: number, flux: readonly number[], residuelle: number, bas?: number) {
  const trouve = tauxQuiAnnule(cout, flux, residuelle, bas);
  if (!trouve) return null;
  const pctExact = trouve.taux * 100;
  const triPct = auCentieme(pctExact);
  const lo = Math.floor(pctExact);
  const hi = lo + 1;
  const vanLo = vanAuTaux(cout, flux, residuelle, lo / 100).van;
  const vanHi = vanAuTaux(cout, flux, residuelle, hi / 100).van;
  const interpolation = auCentieme(lo + vanLo / (vanLo - vanHi));
  const toleranceVan = toleranceDActualisation(flux, residuelle) + 1;
  const ecart = Math.abs(interpolation - triPct);
  // L'élève qui interpole sur ses propres VAN s'écarte d'autant que ses VAN s'écartent.
  const toleranceInterpolation = auCentieme(Math.max(0.02, (2 * toleranceVan) / (vanLo - vanHi) + 0.01));
  // Celui qui cherche le TRI par une autre voie (interpolation ou tableur) : l'écart de l'interpolation, et un peu plus.
  const toleranceTri = auCentieme(Math.max(0.05, ecart + 0.02));
  const annuel = (p: number) => tauxAnnuelEquivalent(p / 100) * 100;
  return {
    taux: trouve.taux,
    pas: trouve.pas,
    triPct,
    triAnnuelPct: auCentieme(annuel(pctExact)),
    lo,
    hi,
    vanLo,
    vanHi,
    interpolation,
    toleranceVan,
    toleranceInterpolation,
    toleranceTri,
    toleranceAnnuelle: auCentieme(annuel(pctExact + toleranceTri) - annuel(pctExact) + 0.02),
    // La VAN au TRI arrondi au centième de point : zéro, à l'arrondi du taux près.
    vanAuTri: vanAuTaux(cout, flux, residuelle, triPct / 100).van,
  };
}

export type Prefere = "A" | "B";
export type Retenu = Prefere | "aucun";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Les deux projets, leurs critères, et ce qui les départage. */
export function deuxProjets(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const a = projet(code, [machineDuChapitre(code)]);
  const b = projet(code, [machineSuivante(code)]);
  const ra = rendement(a.cout, a.flux, a.vr.nette)!;
  const rb = rendement(b.cout, b.flux, b.vr.nette)!;

  // Les flux différentiels, B moins A : leur VAN est l'écart des deux VAN, à chaque taux. Sans actualiser, ce que
  // le projet B rend de plus, revente comprise, face à ce qu'il coûte de plus.
  const dCout = b.cout - a.cout;
  const dFlux = b.flux.map((f, k) => centime(f - a.flux[k]!));
  const dResiduelle = centime(b.vr.nette - a.vr.nette);
  const dSansActualiser = centime(dFlux.reduce((t, f) => t + f, 0) + dResiduelle);
  // Le taux de Fisher se cherche à des taux positifs : c'est là que se place un coût du capital.
  const fisher = rendement(dCout, dFlux, dResiduelle, 0);

  const vanPrefere: Prefere = a.van >= b.van ? "A" : "B";
  const triPrefere: Prefere = ra.triPct >= rb.triPct ? "A" : "B";
  const ipPrefere: Prefere = a.ip >= b.ip ? "A" : "B";
  const retenu: Retenu = Math.max(a.van, b.van) > 0 ? vanPrefere : "aucun";
  const fisherAuDessus = fisher !== null && fisher.taux > TAUX_TRIMESTRIEL;
  return {
    a,
    b,
    ra,
    rb,
    dCout,
    dFlux,
    dResiduelle,
    dSansActualiser,
    fisher,
    // Les deux VAN au taux de Fisher, arrondi au centième de point : égales, à l'arrondi près.
    vanAuFisher: fisher
      ? { a: vanAuTaux(a.cout, a.flux, a.vr.nette, fisher.triPct / 100).van, b: vanAuTaux(b.cout, b.flux, b.vr.nette, fisher.triPct / 100).van }
      : null,
    vanPrefere,
    triPrefere,
    ipPrefere,
    conflit: vanPrefere !== triPrefere,
    fisherAuDessus,
    retenu,
  };
}

/**
 * Le taux de Fisher se lit quand les deux critères divergent sur des projets dont l'un au moins
 * est acceptable. Quand les deux VAN sont négatives, le classement ne décide rien : on rejette
 * les deux, et le chapitre ne cherche pas où leurs courbes se croisent.
 */
export const fisherSeLit = (k: ReturnType<typeof deuxProjets>) => k.conflit && k.retenu !== "aucun" && k.fisher !== null;

const T = TRIMESTRE_DE_L_ACHAT;
const TAUX_PCT = auCentieme(TAUX_TRIMESTRIEL * 100);
const COUT_PCT = auCentieme(COUT_DU_CAPITAL_ANNUEL * 100);
const nomDu = (x: Prefere) => `le projet ${x}`;

export const LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS: Chapitre = {
  code: "le-tri-et-le-choix-entre-deux-projets",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "Le taux de rentabilité interne et le choix entre deux projets",
  accroche:
    "Deux machines, une seule place : la VAN de chacune, son taux de rentabilité interne cherché par dichotomie, son indice de profitabilité et son délai de récupération actualisé. Quand la VAN et le TRI ne désignent pas la même, le taux de Fisher dit pourquoi, et la VAN tranche.",
  objectifs: [
    "Calculer la VAN de deux projets au même coût du capital",
    "Encadrer le TRI d'un projet entre deux taux, l'interpoler, et vérifier qu'il annule la VAN",
    "Calculer l'indice de profitabilité et le délai de récupération actualisé",
    "Dire si la VAN et le TRI classent deux projets pareil, et calculer le taux d'intersection de Fisher quand ils divergent",
    "Choisir entre deux projets qui s'excluent",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTUALISATION,
    pourquoi: `ce chapitre compare deux machines sur ${DUREE_DU_PROJET} trimestres rejoués, comme le chapitre sur la valeur actuelle nette, et dans les mêmes entreprises : NOVA, MAILLE & CO, L'ESCALE et VOLT FITNESS, où les machines font vendre et où chaque exercice finit en bénéfice.`,
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux machines, une seule place",
      notions: ["discounting", "irr_payback"],
      texte: (c) => {
        const { a, b } = deuxProjets(c);
        return [
          `${c.entreprise} hésite entre deux machines, à acheter au trimestre ${T} et à payer sur sa trésorerie. Le projet A est celui du chapitre précédent : « ${a.machine} », ${eur(a.cout)}. Le projet B est la machine suivante du catalogue, « ${b.machine} », ${eur(b.cout)}, qui ajoute plus de capacité. La direction n'en financera qu'un : les deux projets s'excluent.`,
          `L'arène a rejoué les ${a.duree} trimestres avec chacune. Le tableau donne leurs flux de trésorerie d'exploitation après impôt, calculés comme au chapitre précédent, et leur valeur résiduelle nette d'impôt à la fin du projet.`,
          `Deux critères vont les juger : la VAN, en euros, au coût du capital de ${pct(COUT_PCT)} par an, soit ${pct(TAUX_PCT)} par trimestre ; et le taux de rentabilité interne, le taux qui annule la VAN.`,
        ];
      },
      tableau: (c) => {
        const { a, b } = deuxProjets(c);
        return {
          titre: `Les deux projets ${dE(c.entreprise)}`,
          colonnes: ["Projet A", "Projet B"],
          lignes: [
            { libelle: "Machine", valeurs: [a.machine, b.machine] },
            { libelle: `Prix, décaissé au trimestre ${T}`, valeurs: [eur(a.cout), eur(b.cout)] },
            { libelle: `Capacité ajoutée par trimestre (${c.unites})`, valeurs: [qte(a.capacite), qte(b.capacite)] },
            ...a.lignes.map((l, k) => ({ libelle: `Flux du trimestre ${l.trimestre}`, valeurs: [eur(l.flux), eur(b.lignes[k]!.flux)] })),
            { libelle: `Valeur résiduelle nette, fin du trimestre ${a.duree}`, valeurs: [eur(a.vr.nette), eur(b.vr.nette)] },
          ],
        };
      },
      repere: () => "Le TRI est le taux d'actualisation qui annule la VAN. Un projet est acceptable si son TRI dépasse le coût du capital.",
    },
    {
      id: "van",
      type: "montants",
      titre: "La VAN de chaque projet",
      notions: ["discounting"],
      question: () =>
        `Au taux de ${pct(TAUX_PCT)} par trimestre, calculez la VAN de chacun des deux projets : flux et valeur résiduelle actualisés, moins le prix de la machine.`,
      champs: (c) => {
        const { a, b } = deuxProjets(c);
        return [
          {
            libelle: "VAN du projet A",
            attendu: a.van,
            calcul: `${eur(a.va)} + ${eur(a.vaResiduelle)} − ${eur(a.cout)} = ${eur(a.van)}`,
            tolerance: a.tolerance + 1,
          },
          {
            libelle: "VAN du projet B",
            attendu: b.van,
            calcul: `${eur(b.va)} + ${eur(b.vaResiduelle)} − ${eur(b.cout)} = ${eur(b.van)}`,
            tolerance: b.tolerance + 1,
          },
        ];
      },
      explication: (c) => {
        const { a, b } = deuxProjets(c);
        const positives = [a.van > 0, b.van > 0];
        return [
          positives.every(Boolean)
            ? "Les deux VAN sont positives : chacun des deux projets, seul, créerait de la valeur."
            : positives.some(Boolean)
              ? `Seule la VAN du projet ${a.van > 0 ? "A" : "B"} est positive : l'autre machine rapporte moins que le coût du capital.`
              : "Aucune des deux VAN n'est positive : aucun des deux projets ne crée de valeur.",
          `La VAN du projet B est ${b.van >= a.van ? "plus forte" : "plus faible"} de ${eur(Math.abs(centime(b.van - a.van)))} : le projet B investit ${eur(b.cout - a.cout)} de plus, et ce supplément ${b.van >= a.van ? "rapporte plus qu'il ne coûte" : "ne rapporte pas ce qu'il coûte"}, au coût du capital.`,
        ];
      },
    },
    {
      id: "encadrer",
      type: "montants",
      titre: "Encadrer le TRI du projet A",
      notions: ["irr_payback"],
      question: (c) => {
        const { ra } = deuxProjets(c);
        return `Le TRI du projet A est le taux trimestriel qui annule sa VAN. Encadrez-le : calculez la VAN du projet A à ${pct(ra.lo)} et à ${pct(ra.hi)} par trimestre, puis interpolez linéairement entre ces deux taux.`;
      },
      champs: (c) => {
        const { a, ra } = deuxProjets(c);
        return [
          {
            libelle: `VAN du projet A à ${pct(ra.lo)} par trimestre`,
            attendu: ra.vanLo,
            calcul: `les flux actualisés à ${pct(ra.lo)}, plus la valeur résiduelle actualisée, moins ${eur(a.cout)} : ${eur(ra.vanLo)}`,
            tolerance: ra.toleranceVan,
          },
          {
            libelle: `VAN du projet A à ${pct(ra.hi)} par trimestre`,
            attendu: ra.vanHi,
            calcul: `au même calcul, à ${pct(ra.hi)} : ${eur(ra.vanHi)}`,
            tolerance: ra.toleranceVan,
          },
          {
            libelle: "TRI trimestriel du projet A, par interpolation (%)",
            attendu: ra.interpolation,
            calcul: `${qte(ra.lo)} + ${eur(ra.vanLo)} ÷ (${eur(ra.vanLo)} − ${retranche(ra.vanHi)}) = ${pct(ra.interpolation)}`,
            tolerance: ra.toleranceInterpolation,
          },
        ];
      },
      explication: (c) => {
        const { ra } = deuxProjets(c);
        const ecart = auCentieme(Math.abs(ra.interpolation - ra.triPct));
        return [
          `La VAN change de signe entre ${pct(ra.lo)} et ${pct(ra.hi)} : le TRI est entre les deux. Le chapitre l'a cherché par dichotomie, en coupant l'intervalle en deux et en gardant la moitié où la VAN change de signe, ${qte(ra.pas)} fois : ${pct(ra.triPct)} par trimestre, soit ${pct(ra.triAnnuelPct)} par an.`,
          ecart === 0
            ? "L'interpolation tombe sur le même taux, au centième de point près."
            : `L'interpolation linéaire le donne à ${ecart.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} point près : entre deux taux, la VAN n'est pas une droite.`,
          `Vérification : au taux de ${pct(ra.triPct)}, la VAN du projet A vaut ${eur(ra.vanAuTri)}, zéro à l'arrondi du taux près.`,
        ];
      },
    },
    {
      id: "tri",
      type: "montants",
      titre: "Le TRI des deux projets",
      notions: ["irr_payback"],
      question: () =>
        "Cherchez de même le TRI trimestriel du projet B, puis exprimez les TRI des deux projets en taux annuels équivalents, pour les comparer au coût du capital.",
      champs: (c) => {
        const { ra, rb } = deuxProjets(c);
        return [
          {
            libelle: "TRI trimestriel du projet B (%)",
            attendu: rb.triPct,
            calcul: `la VAN du projet B vaut ${eur(rb.vanLo)} à ${pct(rb.lo)} et ${eur(rb.vanHi)} à ${pct(rb.hi)} ; la dichotomie converge sur ${pct(rb.triPct)}`,
            tolerance: rb.toleranceTri,
          },
          {
            libelle: "TRI annuel équivalent du projet A (%)",
            attendu: ra.triAnnuelPct,
            calcul: `(${unPlus(ra.triPct)})^4 − 1 = ${pct(ra.triAnnuelPct)}`,
            tolerance: ra.toleranceAnnuelle,
          },
          {
            libelle: "TRI annuel équivalent du projet B (%)",
            attendu: rb.triAnnuelPct,
            calcul: `(${unPlus(rb.triPct)})^4 − 1 = ${pct(rb.triAnnuelPct)}`,
            tolerance: rb.toleranceAnnuelle,
          },
        ];
      },
      explication: (c) => {
        const { ra, rb, triPrefere } = deuxProjets(c);
        const accepte = (t: number) => t > COUT_PCT;
        const acceptes = [accepte(ra.triAnnuelPct), accepte(rb.triAnnuelPct)];
        const fort = pct(triPrefere === "A" ? ra.triAnnuelPct : rb.triAnnuelPct);
        const faible = pct(triPrefere === "A" ? rb.triAnnuelPct : ra.triAnnuelPct);
        return [
          acceptes.every(Boolean)
            ? `Les deux TRI dépassent le coût du capital, ${pct(COUT_PCT)} par an : chacun des deux projets, seul, serait acceptable, comme leurs VAN positives le disaient.`
            : acceptes.some(Boolean)
              ? `Le TRI du projet ${acceptes[0] ? "B" : "A"} reste sous le coût du capital, ${pct(COUT_PCT)} par an : seul, ce projet serait à rejeter, comme sa VAN négative le disait.`
              : `Les deux TRI restent sous le coût du capital, ${pct(COUT_PCT)} par an : aucun des deux projets, seul, ne serait acceptable, comme leurs VAN négatives le disaient.`,
          acceptes.some(Boolean)
            ? `Au TRI, ${nomDu(triPrefere)} l'emporte : ${fort} par an, contre ${faible}.`
            : `Au TRI, ${nomDu(triPrefere)} est le moins mauvais : ${fort} par an, contre ${faible}.${ra.triPct < 0 && rb.triPct < 0 ? " Un TRI négatif dit que les flux et la revente, même sans actualiser, ne rendent pas le prix de la machine." : ""}`,
        ];
      },
    },
    {
      id: "indices",
      type: "montants",
      titre: "Indice de profitabilité et délai actualisé",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const { a, b } = deuxProjets(c);
        const delais = a.delai !== null && b.delai !== null;
        const seul = a.delai !== null ? "A" : b.delai !== null ? "B" : null;
        return `Calculez l'indice de profitabilité de chaque projet : ce que rendent ses flux et sa revente, actualisés, pour un euro investi.${delais ? " Puis son délai de récupération actualisé : le nombre de trimestres au bout duquel ses flux actualisés cumulés rejoignent son prix, en interpolant dans le trimestre où ils le rejoignent." : seul !== null ? ` Puis le délai de récupération actualisé du projet ${seul}, le seul que ses flux récupèrent avant la fin du projet : le nombre de trimestres au bout duquel ses flux actualisés cumulés rejoignent son prix, en interpolant dans le trimestre où ils le rejoignent.` : ""}`;
      },
      champs: (c) => {
        const { a, b } = deuxProjets(c);
        const delai = (p: typeof a, x: Prefere) =>
          p.delai === null
            ? []
            : [
                {
                  libelle: `Délai de récupération actualisé du projet ${x} (trimestres)`,
                  attendu: p.delai,
                  calcul: `les flux actualisés cumulés rejoignent ${eur(p.cout)} au cours du trimestre ${Math.ceil(p.delai)} : ${dixieme(p.delai)} trimestres`,
                  tolerance: 0.1,
                },
              ];
        return [
          { libelle: "Indice de profitabilité du projet A", attendu: a.ip, calcul: `(${eur(a.va)} + ${eur(a.vaResiduelle)}) ÷ ${eur(a.cout)} = ${qte(a.ip)}`, tolerance: 0.01 },
          { libelle: "Indice de profitabilité du projet B", attendu: b.ip, calcul: `(${eur(b.va)} + ${eur(b.vaResiduelle)}) ÷ ${eur(b.cout)} = ${qte(b.ip)}`, tolerance: 0.01 },
          ...delai(a, "A"),
          ...delai(b, "B"),
        ];
      },
      explication: (c) => {
        const { a, b, ipPrefere } = deuxProjets(c);
        const ipFort = ipPrefere === "A" ? a.ip : b.ip;
        return [
          `Chaque euro investi dans ${nomDu(ipPrefere)} en rend ${qte(ipFort)} en valeur actuelle, contre ${qte(ipPrefere === "A" ? b.ip : a.ip)} pour l'autre. L'indice rapporte la valeur créée à la mise : il départage des projets quand les capitaux manquent pour les financer tous, pas quand ils s'excluent.`,
          a.delai !== null && b.delai !== null
            ? `Le projet A rend son prix, actualisé, en ${dixieme(a.delai)} trimestres, le projet B en ${dixieme(b.delai)}. Le délai dit le risque d'attendre, pas la valeur : il ignore tout ce qui vient après.`
            : a.delai === null && b.delai === null && a.van <= 0 && b.van <= 0
              ? "Aucun des deux projets ne rend son prix, actualisé, avant la fin du projet : même revente comprise, leurs VAN restent négatives. Le délai dit le risque d'attendre, pas la valeur."
              : `${[a, b]
                  .map((p, i) => ({ p, x: i === 0 ? "A" : "B" }))
                  .filter(({ p }) => p.delai === null)
                  .map(({ p, x }) => `Le projet ${x} ne rend pas son prix, actualisé, avant la fin du projet : ${p.van > 0 ? "sans sa revente, ses flux n'y suffisent pas" : "même revente comprise, sa VAN reste négative"}.`)
                  .join(" ")} Le délai dit le risque d'attendre, pas la valeur.`,
        ];
      },
    },
    {
      id: "classement",
      type: "choix",
      titre: "Les deux critères classent-ils pareil ?",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const { a, b, ra, rb } = deuxProjets(c);
        return `Projet A : VAN de ${eur(a.van)}, TRI de ${pct(ra.triPct)} par trimestre. Projet B : VAN de ${eur(b.van)}, TRI de ${pct(rb.triPct)}. Au coût du capital, que disent les deux critères ?`;
      },
      options: (c) => {
        const k = deuxProjets(c);
        const { vanPrefere: v, triPrefere: t, fisher, dCout, dSansActualiser } = k;
        const pourquoiPareil =
          fisher === null
            ? `Même sans actualiser, les flux en plus du projet B (${eur(dSansActualiser)}, revente comprise) ${dSansActualiser < dCout ? "ne remboursent pas" : "remboursent tout juste"} ses ${eur(dCout)} d'investissement en plus : les deux courbes de VAN ne se croisent à aucun taux positif, et le projet A l'emporte quel que soit le taux.`
            : `Les deux courbes de VAN se croisent à ${pct(fisher.triPct)} par trimestre, sous le coût du capital : à ce taux, les deux critères désignent le même projet.`;
        const conflit = `le projet A rend plus par euro investi, le projet B rapporte plus d'euros : il investit ${eur(dCout)} de plus, et ce supplément rapporte encore plus que le coût du capital.`;
        const non = `Non : la VAN préfère ${nomDu(v)}, le TRI ${nomDu(t)}.`;
        // Deux VAN négatives : le classement se lit, mais il ne décide rien.
        const rienARetenir = `Oui : la VAN préfère ${nomDu(v)}, qui détruit le moins de valeur, et le TRI ${nomDu(t)}, le moins mauvais. Mais les deux VAN sont négatives : aucun projet n'est acceptable, et le classement ne décide rien.`;
        const oui = (x: string) => (k.retenu === "aucun" ? rienARetenir : x);
        return [
          {
            texte: "La VAN préfère le projet B, le TRI préfère le projet A",
            juste: v === "B" && t === "A",
            retour: v === "B" && t === "A" ? oui(`Oui : ${conflit}`) : non,
          },
          {
            texte: "La VAN préfère le projet A, le TRI préfère le projet B",
            juste: v === "A" && t === "B",
            retour: v === "A" && t === "B" ? oui("Oui : le projet B rend plus par euro investi, mais le projet A crée plus de valeur au coût du capital.") : non,
          },
          {
            texte: "Les deux critères préfèrent le projet A",
            juste: v === "A" && t === "A",
            retour: v === "A" && t === "A" ? oui(`Oui : le projet A a la plus forte VAN et le plus fort TRI. ${pourquoiPareil}`) : non,
          },
          {
            texte: "Les deux critères préfèrent le projet B",
            juste: v === "B" && t === "B",
            retour: v === "B" && t === "B" ? oui("Oui : le projet B a la plus forte VAN et le plus fort TRI : il rapporte plus d'euros, et plus par euro investi.") : non,
          },
        ];
      },
    },
    {
      id: "fisher",
      type: "montants",
      titre: "Le taux d'intersection de Fisher",
      notions: ["irr_payback", "discounting"],
      si: (c) => fisherSeLit(deuxProjets(c)),
      tableau: (c) => {
        const k = deuxProjets(c);
        return {
          titre: "Les flux différentiels, projet B moins projet A",
          colonnes: ["Projet B moins projet A"],
          lignes: [
            { libelle: `Investissement en plus, trimestre ${T}`, valeurs: [eur(-k.dCout)] },
            ...k.dFlux.map((f, i) => ({ libelle: `Flux du trimestre ${i + 1}`, valeurs: [eur(f)] })),
            { libelle: `Valeur résiduelle nette, fin du trimestre ${k.a.duree}`, valeurs: [eur(k.dResiduelle)] },
          ],
        };
      },
      question: () =>
        "Le taux d'intersection de Fisher est le taux auquel les deux projets ont la même VAN : celui qui annule la VAN des flux différentiels, B moins A. Calculez-le par trimestre, puis son équivalent annuel.",
      champs: (c) => {
        const f = deuxProjets(c).fisher!;
        return [
          {
            libelle: "Taux de Fisher, par trimestre (%)",
            attendu: f.triPct,
            calcul: `la VAN des flux différentiels vaut ${eur(f.vanLo)} à ${pct(f.lo)} et ${eur(f.vanHi)} à ${pct(f.hi)} ; la dichotomie converge sur ${pct(f.triPct)}`,
            tolerance: f.toleranceTri,
          },
          {
            libelle: "Taux de Fisher, équivalent annuel (%)",
            attendu: f.triAnnuelPct,
            calcul: `(${unPlus(f.triPct)})^4 − 1 = ${pct(f.triAnnuelPct)}`,
            tolerance: f.toleranceAnnuelle,
          },
        ];
      },
      explication: (c) => {
        const k = deuxProjets(c);
        const f = k.fisher!;
        return [
          `Au taux de ${pct(f.triPct)} par trimestre, les deux projets valent autant : ${eur(k.vanAuFisher!.a)} pour le projet A, ${eur(k.vanAuFisher!.b)} pour le projet B, à l'arrondi du taux près. Au-dessous, le projet B a la plus forte VAN ; au-dessus, le projet A. Le coût du capital, ${pct(TAUX_PCT)} par trimestre, est au-dessous : à ce taux, la VAN choisit le projet B, quoi que dise le TRI.`,
          `Le TRI suppose que chaque euro rendu par un projet se replace à son propre TRI, ${pct(k.ra.triPct)} par trimestre pour le projet A ; la VAN suppose qu'il se replace au coût du capital, ce qui est plus réaliste.`,
        ];
      },
    },
    {
      id: "choix",
      type: "choix",
      titre: "Quel projet retenir ?",
      notions: ["discounting", "profitability_vs_return"],
      question: () => `Les deux projets s'excluent. Au coût du capital de ${pct(COUT_PCT)} par an, lequel retenir ?`,
      options: (c) => {
        const { a, b, ra, rb, retenu, triPrefere } = deuxProjets(c);
        const meilleur = retenu === "A" ? a : b;
        return [
          {
            texte: `Le projet A, « ${a.machine} »`,
            juste: retenu === "A",
            retour:
              retenu === "A"
                ? `Oui : sa VAN, ${eur(a.van)}, est la plus forte, et positive. C'est la valeur qu'il crée, en euros d'aujourd'hui.`
                : retenu === "B"
                  ? `Non : sa VAN, ${eur(a.van)}, est plus faible que celle du projet B, ${eur(b.van)}.${triPrefere === "A" ? ` Son TRI plus fort, ${pct(ra.triPct)} par trimestre, mesure un rendement par euro, pas la valeur créée.` : ""}`
                  : `Non : sa VAN est négative, ${eur(a.van)}.`,
          },
          {
            texte: `Le projet B, « ${b.machine} »`,
            juste: retenu === "B",
            retour:
              retenu === "B"
                ? `Oui : sa VAN, ${eur(b.van)}, est la plus forte, et positive. Son TRI, ${pct(rb.triPct)} par trimestre, est ${triPrefere === "B" ? "aussi le plus fort" : "plus faible, mais il ne mesure qu'un rendement par euro, pas la valeur créée"}.`
                : retenu === "A"
                  ? `Non : sa VAN, ${eur(b.van)}, est plus faible que celle du projet A, ${eur(a.van)}.`
                  : `Non : sa VAN est négative, ${eur(b.van)}.`,
          },
          {
            texte: "Aucun des deux : aucun ne crée de valeur au coût du capital",
            juste: retenu === "aucun",
            retour: retenu === "aucun" ? "Oui : les deux VAN sont négatives." : `Non : ${nomDu(retenu as Prefere)} a une VAN positive, ${eur(meilleur.van)}.`,
          },
          {
            texte: "Celui qui a le meilleur TRI, quelle que soit sa VAN",
            juste: false,
            retour:
              triPrefere === retenu
                ? `Non : ici, le meilleur TRI désigne le même projet que la VAN, mais par la rencontre des chiffres. Entre deux projets qui s'excluent, c'est la VAN qui tranche : le TRI ne dit pas combien de valeur un projet crée.`
                : retenu === "aucun"
                  ? `Non : le meilleur TRI désigne ${nomDu(triPrefere)}, dont la VAN est négative, ${eur(triPrefere === "A" ? a.van : b.van)}. C'est la VAN qui tranche, et elle écarte les deux projets.`
                  : `Non : le meilleur TRI désigne ${nomDu(triPrefere)}, qui crée moins de valeur. Entre deux projets qui s'excluent, c'est la VAN qui tranche.`,
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["irr_payback", "discounting"],
      texte: (c) => {
        const k = deuxProjets(c);
        const tete = k.retenu === "aucun" ? "aucun des deux projets ne crée de valeur" : `${nomDu(k.retenu)} l'emporte`;
        const criteres = !k.conflit
          ? "La VAN et le TRI désignaient le même projet."
          : k.retenu === "aucun"
            ? `Le TRI préférait ${nomDu(k.triPrefere)}, la VAN ${nomDu(k.vanPrefere)} ; mais quand aucune VAN n'est positive, le classement ne décide rien.`
            : fisherSeLit(k)
              ? `Le TRI préférait ${nomDu(k.triPrefere)}, mais au-dessous du taux de Fisher, ${pct(k.fisher!.triPct)} par trimestre, la VAN choisit l'autre.`
              : `Le TRI préférait ${nomDu(k.triPrefere)}, mais entre deux projets qui s'excluent, la VAN tranche.`;
        return [
          `Chez ${c.entreprise}, ${tete} au coût du capital : VAN de ${eur(k.a.van)} pour le projet A, de ${eur(k.b.van)} pour le projet B. ${criteres}`,
          `L'arène simplifie comme au chapitre précédent : un seul taux d'impôt, une revente à une part fixe de la valeur nette comptable, un projet arrêté au bout de ${k.a.duree} trimestres. Et les deux projets ne s'excluent que parce que la direction le décide : l'arène accepterait les deux machines, et leurs ventes se partageraient la même demande.`,
        ];
      },
      repere: () =>
        "Entre deux projets qui s'excluent, on retient la plus forte VAN positive. Le TRI et l'indice de profitabilité éclairent le choix, ils ne le tranchent pas quand ils divergent.",
    },
  ],
};
