import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_ECARTS, ETAPE_DE_LA_PRODUCTION, budgetsDeLUsine, ecartDit, tableauDesStandards } from "../../chapitres/le-cout-preetabli-et-les-budgets";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT PRÉÉTABLI, LE BUDGET STANDARD ET LE BUDGET FLEXIBLE » : LE
 * BUDGET DÉPASSÉ (contrôle de gestion, palier 4).
 *
 * Le directeur de l'usine lit le réel du trimestre face au budget standard et veut annoncer au
 * comité de direction l'écart entier comme un dérapage, alors que l'usine a fabriqué moins
 * d'enceintes que prévu. L'élève refait seul les calculs du chapitre : le coût standard de
 * l'heure-machine et la fiche de chaque enceinte, le coût préétabli de la production réelle,
 * l'effet des quantités produites et l'écart global sur coûts, puis les écarts par poste et le
 * seuil de significativité. Il croise la baisse des quantités et la hausse du préétabli (la
 * composition a glissé vers la Salon, ce que le curseur du chapitre, « experience-production »,
 * fait voir avant la question), et rend un jugement : quel chiffre annoncer, et où chercher.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : tous les chiffres viennent du
 * modèle du contrôle budgétaire, par `budgetsDeLUsine`, et le seuil est celui du chapitre.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const enListe = (t: readonly string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);

/** Ce que le cas lit du chapitre : les budgets, et les postes au-dessus du seuil. */
export function budgetDepasse(c: Pick<Cas, "code">) {
  const b = budgetsDeLUsine(c);
  const aAnalyser = b.postes.filter((p) => p.aAnalyser);
  return { ...b, aAnalyser, nomsAAnalyser: enListe(aAnalyser.map((p) => p.nom.toLowerCase())) };
}

function tableauDuDirecteur(c: Cas): TableauDeDonnees {
  const b = budgetDepasse(c);
  const e = b.e;
  return {
    titre: `Le trimestre de l'usine ${b.f.entreprise}, tel que le directeur le lit`,
    colonnes: ["Budget", "Réel"],
    lignes: [
      ...b.modeles.map((x) => ({ libelle: `${x.m.nom} fabriquées`, valeurs: [qte(x.prevue), qte(x.reelle)] })),
      { libelle: "Matière", valeurs: [eur(e.budgetStandard.matiere), eur(e.reel.matiere)] },
      { libelle: "Main-d'œuvre directe", valeurs: [eur(e.budgetStandard.mainDOeuvre), eur(e.reel.mainDOeuvre)] },
      { libelle: `Centre de ${b.f.centre.nom.toLowerCase()}`, valeurs: [eur(e.budgetStandard.centre), eur(e.reel.centre)] },
      { libelle: "Coûts de production", valeurs: [eur(e.budgetStandard.total), eur(e.reelTotal)] },
    ],
  };
}

export const LE_BUDGET_DEPASSE: Situation = {
  code: "le-budget-depasse",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["le-cout-preetabli-et-les-budgets"],
  commanditaire: "Le directeur de l'usine",
  titre: "Le budget dépassé",
  accroche:
    "Le directeur lit les coûts du trimestre face au budget et veut annoncer tout l'écart comme un dérapage, alors que l'usine a fabriqué moins d'enceintes que prévu. Quel chiffre annoncer, et où chercher ?",
  objectifs: [
    "Établir le coût préétabli de la production réelle",
    "Séparer l'effet des quantités produites et l'écart global sur coûts",
    "Calculer les écarts par poste et leur appliquer un seuil de significativité",
    "Répondre au directeur, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ECARTS,
    pourquoi: "ce cas reprend le chapitre « Le coût préétabli, le budget standard et le budget flexible », qui se joue à l'usine de NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le directeur et son budget",
      tableau: tableauDuDirecteur,
      texte: (c) => {
        const b = budgetDepasse(c);
        return [
          `« Nous avons dépensé ${eur(b.e.reelTotal)} pour ${eur(b.e.budgetStandard.total)} budgétés : ${eur(b.reelMoinsBudget)} de dérapage, et pourtant nous avons fabriqué ${qte(b.qTotaleReelle)} enceintes au lieu de ${qte(b.qTotalePrevue)}. Je veux l'annoncer lundi au comité de direction. Dites-moi si c'est le bon chiffre, et quels postes regarder en premier : le comité n'examine que les écarts au-dessus de ${pct(b.seuilPct)} du coût préétabli du poste. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. Les standards de chaque enceinte sont dans la fiche de l'usine, à l'étape suivante.",
        ];
      },
      repere: () => "À rendre : le coût préétabli de chaque enceinte, celui de la production réelle, l'écart global sur coûts et les écarts par poste, puis votre réponse au directeur.",
    },
    {
      id: "fiche",
      type: "montants",
      titre: "Les fiches de coût préétabli",
      notions: ["standard_costing"],
      tableau: tableauDesStandards,
      question: (c) => {
        const b = budgetDepasse(c);
        const f = b.f;
        return `Le kilo de matière est au standard à ${eur(f.prixStandardDuKilo)}, l'heure de main-d'œuvre directe à ${eur(f.tauxHoraireStandard)}. Le centre de ${f.centre.nom.toLowerCase()} coûte ${eur(f.centre.coutVariableParHeure)} par heure-machine et ${eur(f.centre.chargesFixes)} de charges fixes, pour une activité normale de ${qte(f.centre.activiteNormale)} heures-machine. Calculez le coût standard de l'heure-machine, puis le coût préétabli de chaque enceinte.`;
      },
      champs: (c) => {
        const b = budgetDepasse(c);
        const f = b.f;
        return [
          {
            libelle: "Coût standard de l'heure-machine",
            attendu: b.cHm,
            calcul: `${eur(f.centre.coutVariableParHeure)} + ${eur(f.centre.chargesFixes)} ÷ ${qte(f.centre.activiteNormale)} = ${eur(b.cHm)}`,
          },
          ...b.modeles.map((x) => ({
            libelle: `Coût préétabli d'une ${x.m.nom}`,
            attendu: x.cout.total,
            calcul: `${qte(x.m.matiereParUnite)} × ${eur(f.prixStandardDuKilo)} + ${qte(x.m.heuresParUnite)} × ${eur(f.tauxHoraireStandard)} + ${qte(x.m.heuresMachineParUnite)} × ${eur(b.cHm)} = ${eur(x.cout.total)}`,
          })),
        ];
      },
      explication: (c) => {
        const b = budgetDepasse(c);
        return [`${b.modeles.map((x, i) => `${i === 0 ? "Une" : "une"} ${x.m.nom} vaut ${eur(x.cout.total)} au coût préétabli`).join(" ; ")}.`];
      },
    },
    {
      id: "production-reelle",
      type: "montants",
      titre: "Ce que la production réelle devait coûter",
      notions: ["standard_costing", "cost_variance"],
      question: () =>
        "Calculez le coût préétabli de la production réelle, puis la part de l'écart du directeur qui ne vient que des quantités produites, et l'écart global sur coûts. Négatif pour un écart favorable.",
      champs: (c) => {
        const b = budgetDepasse(c);
        const e = b.e;
        return [
          {
            libelle: "Coût préétabli de la production réelle",
            attendu: e.preetabliDuReel.total,
            calcul: `${b.modeles.map((x) => `${qte(x.reelle)} × ${eur(x.cout.total)}`).join(" + ")} = ${eur(e.preetabliDuReel.total)}`,
          },
          { libelle: "Effet des quantités produites", attendu: b.effetDeLaProduction, calcul: `${eur(e.preetabliDuReel.total)} − ${eur(e.budgetStandard.total)} = ${eur(b.effetDeLaProduction)}` },
          { libelle: "Écart global sur coûts", attendu: e.ecartGlobalSurCouts, calcul: `${eur(e.reelTotal)} − ${eur(e.preetabliDuReel.total)} = ${eur(e.ecartGlobalSurCouts)}` },
        ];
      },
      explication: (c) => {
        const b = budgetDepasse(c);
        return [`${eur(b.reelMoinsBudget)} = ${eur(b.effetDeLaProduction)} + ${eur(b.e.ecartGlobalSurCouts)}. Seul le second mesure comment l'usine a produit.`];
      },
    },
    {
      // L'expérience du chapitre, sans sa leçon : le cas ne fait que constater.
      ...ETAPE_DE_LA_PRODUCTION,
      explication: (c: Cas) => ETAPE_DE_LA_PRODUCTION.explication(c).slice(0, 1),
    },
    {
      id: "moins-d-enceintes",
      type: "choix",
      titre: "Moins d'enceintes, plus de coût",
      notions: ["standard_costing"],
      question: (c) => {
        const b = budgetDepasse(c);
        return `L'usine a fabriqué ${qte(b.qTotalePrevue - b.qTotaleReelle)} enceintes de moins que prévu, et pourtant sa production réelle vaut ${eur(b.effetDeLaProduction)} de plus au coût préétabli. Pourquoi ?`;
      },
      options: (c) => {
        const b = budgetDepasse(c);
        const detail = `${b.modeles.map((x) => `${x.reelle >= x.prevue ? "+" : "−"}${qte(Math.abs(x.reelle - x.prevue))} ${x.m.nom} × ${eur(x.cout.total)}`).join(" ; ")} : au total ${eur(b.effetDeLaProduction)}.`;
        const salon = [...b.modeles].sort((a, z) => z.cout.total - a.cout.total)[0]!;
        const glisse = salon.reelle > salon.prevue && b.effetDeLaProduction > 0;
        return [
          {
            texte: `Plus de ${salon.m.nom}, la plus coûteuse, à la place d'autres enceintes`,
            juste: glisse,
            retour: glisse ? `Oui. ${detail} La composition de la production a changé : c'est elle qui pèse, pas le nombre d'enceintes.` : `Non. ${detail}`,
          },
          {
            texte: "Le coût préétabli de la production réelle se calcule au prix réel du kilo et au taux réel",
            juste: false,
            retour: `Non : le coût préétabli prend les quantités réelles, mais toujours aux coûts standards. Sinon il contiendrait déjà les écarts qu'il sert à mesurer. ${detail}`,
          },
          {
            texte: "Les charges fixes du centre se répartissent sur moins d'enceintes, chacune coûte donc plus",
            juste: !glisse,
            retour: glisse
              ? `Non : au coût préétabli, chaque enceinte porte la même part de charges fixes quel que soit le volume ; c'est l'écart sur activité qui mesure leur absorption. ${detail}`
              : `Oui. ${detail}`,
          },
        ];
      },
    },
    {
      id: "par-poste",
      type: "montants",
      titre: "Les écarts par poste",
      notions: ["cost_variance"],
      question: () =>
        "Calculez l'écart global de chaque poste, matière, main-d'œuvre directe et centre de montage, face au coût préétabli de la production réelle. Négatif pour un écart favorable.",
      champs: (c) => {
        const b = budgetDepasse(c);
        const e = b.e;
        const preetabli = (g: (x: (typeof b.modeles)[number]) => number, total: number) => `${b.modeles.map((x) => `${qte(x.reelle)} × ${eur(g(x))}`).join(" + ")} = ${eur(total)}`;
        return [
          {
            libelle: "Écart global sur matière",
            attendu: e.matiere.global,
            calcul: `${eur(e.reel.matiere)} − (${preetabli((x) => x.cout.matiere, e.preetabliDuReel.matiere)}) = ${eur(e.matiere.global)}`,
          },
          {
            libelle: "Écart global sur main-d'œuvre directe",
            attendu: e.mainDOeuvre.global,
            calcul: `${eur(e.reel.mainDOeuvre)} − (${preetabli((x) => x.cout.mainDOeuvre, e.preetabliDuReel.mainDOeuvre)}) = ${eur(e.mainDOeuvre.global)}`,
          },
          {
            libelle: "Écart global sur le centre de montage",
            attendu: e.centre.global,
            calcul: `${eur(e.reel.centre)} − (${preetabli((x) => x.cout.centre, e.preetabliDuReel.centre)}) = ${eur(e.centre.global)}`,
          },
        ];
      },
      explication: (c) => {
        const b = budgetDepasse(c);
        return [
          `Rapportés au coût préétabli de leur poste : ${b.postes.map((p) => `${p.nom.charAt(0).toLowerCase()}${p.nom.slice(1)} ${pct(p.part)}`).join(", ")}. Le seuil du comité est de ${pct(b.seuilPct)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      notions: ["cost_variance", "standard_costing"],
      question: () => "Quelle réponse rendez-vous au directeur ?",
      options: (c) => {
        const b = budgetDepasse(c);
        const e = b.e;
        const chiffres = `Sur ${eur(b.reelMoinsBudget)}, ${eur(b.effetDeLaProduction)} sont le coût préétabli de la production réellement faite ; l'écart global sur coûts est de ${ecartDit(e.ecartGlobalSurCouts)}. Au-dessus du seuil de ${pct(b.seuilPct)} : ${b.nomsAAnalyser}.`;
        const mod = b.postes.find((p) => p.code === "mainDOeuvre")!;
        const nomsCourts = b.aAnalyser.map((p) => (p.code === "centre" ? "le centre" : p.code === "matiere" ? "la matière" : "la main-d'œuvre"));
        return [
          {
            texte: `Annoncez ${eur(e.ecartGlobalSurCouts)} d'écart, à creuser sur ${enListe(nomsCourts)}`,
            juste: true,
            retour: `Oui. ${chiffres} La main-d'œuvre directe, à ${pct(mod.part)}, reste sous le seuil sur son global ; il faudra tout de même la décomposer, car deux écarts peuvent s'y compenser.`,
          },
          {
            texte: `Annoncez ${eur(b.reelMoinsBudget)} de dérapage : c'est le réel moins le budget voté au comité`,
            juste: false,
            retour: `Non : c'est comparer le réel au budget standard, qui chiffre une autre production. ${chiffres}`,
          },
          {
            texte: `Annoncez ${eur(e.ecartGlobalSurCouts - b.effetDeLaProduction)} : l'écart global moins les ${eur(b.effetDeLaProduction)} des quantités produites`,
            juste: false,
            retour: `Non : c'est retrancher deux fois l'effet des quantités produites, déjà sorti de l'écart global. ${chiffres}`,
          },
          {
            texte: `Annoncez ${eur(e.ecartGlobalSurCouts)} d'écart, à répartir sur les trois postes à proportion de leur budget`,
            juste: false,
            retour: `Non : chaque poste a son propre écart, et ils ne pèsent pas pareil : ${b.postes.map((p) => `${p.nom.toLowerCase()} : ${eur(p.ecart)}`).join(" ; ")}. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
