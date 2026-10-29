import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { margeUnitaire } from "../monde/capacite";
import {
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  coutAnnuelDUnOperateur,
  enceintesParOperateur,
  ficheDeNova,
  heuresParTrimestre,
  margeApresLEquipe,
  production as productionDeNova,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRODUIRE, CAPACITÉ, ÉQUIPE ET PRODUCTIVITÉ (bac STMG, management, palier 1).
 *
 * Produire, c'est combiner des ressources : une ligne de montage, une équipe, du temps. Le chapitre
 * lit l'année N + 1 de NOVA, trimestre par trimestre (monde/production-et-logistique.ts, qui relit
 * nova-capacite.ts) : la capacité des 4 postes (7 000 enceintes par trimestre) et celle des 4
 * opérateurs (7 200), la demande prévue (27 200 enceintes). L'élève en tire la capacité de l'année,
 * son taux d'utilisation, la ressource qui bride la production, la productivité du travail, puis il
 * juge une embauche : la ligne bride, un opérateur de plus ne fait rien produire de plus.
 *
 * L'EXPÉRIENCE. Un curseur : ce que chaque opérateur doit monter, au moins, pour que l'équipe ne bride
 * pas la ligne (1 750 enceintes par trimestre ; il en monte 1 800). Un laboratoire : l'effectif qui
 * laisse la meilleure marge une fois l'équipe payée (4 opérateurs).
 *
 * CE QUI A CHANGÉ. L'arène rejouait l'année de sept entreprises avec une embauche de plus ; le
 * chapitre se joue chez NOVA seule, sur ses fiches.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_PRODUCTION: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** Les bornes du curseur (les enceintes d'un opérateur par trimestre) et du laboratoire (l'effectif). */
const PRODUCTIVITE_DU_CURSEUR = { min: 1_000, max: 2_500 } as const;
const EFFECTIF_DU_LABORATOIRE = { min: 2, max: 6, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString("fr-FR")} %`;
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);

const f = (c: Pick<Cas, "code">) => ficheDeNova(c);

/** Les chiffres du chapitre : l'année N + 1, sa capacité, son goulot, sa productivité, et l'embauche. */
export const production = (c: Pick<Cas, "code">) => productionDeNova(f(c));

/** Ce que chaque opérateur doit monter, au moins, pour que l'équipe suive les postes. */
export const productiviteQuiSuitLaLigne = (c: Pick<Cas, "code">) => Math.ceil(production(c).capaciteOutil / f(c).plan.operateurs);

/** L'effectif du laboratoire : celui qui laisse la meilleure marge une fois l'équipe payée. */
export function effectifDuLaboratoire(c: Pick<Cas, "code">) {
  const positions = Array.from({ length: EFFECTIF_DU_LABORATOIRE.max - EFFECTIF_DU_LABORATOIRE.min + 1 }, (_, i) => margeApresLEquipe(f(c), EFFECTIF_DU_LABORATOIRE.min + i));
  return positions.reduce((m, x) => (x.reste > m.reste ? x : m));
}

/** L'année N + 1, trimestre par trimestre : la demande, les deux capacités, la production. */
export function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const t = production(c).annee.trimestres;
  return {
    titre: `L'année N + 1 de ${c.entreprise}, prévue`,
    colonnes: t.map((x) => `${rang(x.trimestre)} trimestre`),
    lignes: [
      { libelle: `Demande des clients (${c.unites})`, valeurs: t.map((x) => qte(x.demande)) },
      { libelle: `Capacité des postes (${c.unites})`, valeurs: t.map((x) => qte(x.capaciteOutil)) },
      { libelle: `Capacité des opérateurs (${c.unites})`, valeurs: t.map((x) => qte(x.capaciteEquipe)) },
      { libelle: `Production (${c.unites})`, valeurs: t.map((x) => qte(x.production)) },
    ],
  };
}

export const PRODUIRE: Chapitre = {
  code: "produire",
  parcours: "stmg-management",
  palier: 1,
  blocs: [
    "STMG Thème 1 · Les organisations et l'activité de production de biens et de services",
    "STMG Thème 1 · À la rencontre du management des organisations",
  ],
  titre: "Produire : capacité, équipe et productivité",
  accroche:
    "Une ligne de montage, une équipe, du temps : ce que l'entreprise peut produire en un an, ce qu'elle produira, ce que produit chaque salarié. Puis une embauche, jugée sur ce qu'elle fait produire.",
  objectifs: [
    "Calculer la capacité de l'entreprise et son taux d'utilisation",
    "Dire quelle ressource bride la production : les équipements ou l'équipe",
    "Calculer la productivité du travail, par salarié et par heure",
    "Juger une embauche sur ce qu'elle fait produire et sur le résultat",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_PRODUCTION, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des ressources pour produire",
      notions: ["capacity", "productivity"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const x = f(c);
        return [
          `Pour produire, ${c.entreprise} combine des ressources : une ligne de ${qte(x.ligne.postes)} postes de montage, ${qte(x.plan.operateurs)} opérateurs, et du temps. Chaque opérateur travaille ${qte(heuresParTrimestre(x))} heures par trimestre, et une ${c.unite} demande ${qte(x.operateurs.heuresParEnceinte)} heure de montage.`,
          `Chaque ressource a sa capacité : le plus que les postes peuvent monter en un trimestre, et le plus que l'équipe peut monter (ses heures ÷ le temps d'une ${c.unite}). La capacité de l'entreprise est la plus petite des deux : la ressource la plus faible bride toute la production.`,
          "Le tableau donne l'année N + 1, prévue trimestre par trimestre : ce que les clients demanderont, et ce que la ligne et l'équipe pourront monter.",
        ];
      },
      repere: () => "Capacité de l'entreprise = la plus petite des capacités de ses ressources, les équipements ou l'équipe.",
    },
    {
      id: "capacite",
      objectifs: [0],
      type: "montants",
      titre: "La capacité et son utilisation",
      notions: ["capacity"],
      tableau: tableauDeLAnnee,
      question: (c) =>
        `Calculez la capacité de l'entreprise sur l'année (chaque trimestre, la plus petite des deux capacités, puis la somme des 4 trimestres), la production de l'année, puis le taux d'utilisation de la capacité (production ÷ capacité × 100, au dixième), en ${c.unites}.`,
      champs: (c) => {
        const p = production(c);
        const t = p.annee.trimestres;
        return [
          { libelle: "Capacité de l'entreprise sur l'année", attendu: p.annee.capacite, calcul: `${t.map((x) => qte(x.capacite)).join(" + ")} = ${qte(p.annee.capacite)}`, tolerance: 0 },
          { libelle: "Production de l'année", attendu: p.annee.production, calcul: `${t.map((x) => qte(x.production)).join(" + ")} = ${qte(p.annee.production)}`, tolerance: 0 },
          { libelle: "Taux d'utilisation de la capacité (%)", attendu: Math.round(p.utilisation * 10) / 10, calcul: `${qte(p.annee.production)} ÷ ${qte(p.annee.capacite)} × 100 = ${pct(p.utilisation)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const p = production(c);
        return [
          `${c.entreprise} utilisera ${pct(p.utilisation)} de sa capacité. Aux trimestres calmes, la ligne aura du jeu ; aux trimestres forts, elle sera pleine, et ${qte(p.annee.refusees)} ${c.unites} demandées ne seront pas montées.`,
          "Une capacité inutilisée coûte quand même : les postes s'usent et les opérateurs sont payés, que la ligne tourne ou non.",
        ];
      },
    },
    {
      id: "ce-qui-bride",
      objectifs: [1],
      type: "choix",
      titre: "La ressource qui bride la production",
      notions: ["capacity"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const p = production(c);
        return `Chaque trimestre, les postes peuvent monter ${qte(p.capaciteOutil)} ${c.unites}, l'équipe ${qte(p.capaciteEquipe)}. Quelle ressource bride la production ?`;
      },
      options: (c) => {
        const p = production(c);
        return [
          {
            texte: "Les postes de la ligne",
            juste: p.goulot === "outil",
            retour:
              p.goulot === "outil"
                ? `Oui : les postes montent moins que l'équipe (${qte(p.capaciteOutil)} contre ${qte(p.capaciteEquipe)}). Pour produire plus, il faudrait d'abord un poste de plus ; un opérateur de plus n'aurait pas de poste où monter.`
                : `Non : les postes pourraient monter ${qte(p.capaciteOutil)} ${c.unites}, plus que l'équipe.`,
          },
          {
            texte: "L'équipe des opérateurs",
            juste: p.goulot === "equipe",
            retour:
              p.goulot === "equipe"
                ? `Oui : l'équipe monte moins que les postes (${qte(p.capaciteEquipe)} contre ${qte(p.capaciteOutil)}).`
                : `Non : l'équipe pourrait monter ${qte(p.capaciteEquipe)} ${c.unites} par trimestre, plus que les postes (${qte(p.capaciteOutil)}).`,
          },
          {
            texte: "Les deux, car leurs capacités s'additionnent",
            juste: false,
            retour: "Non : un poste sans opérateur ne monte rien, un opérateur sans poste non plus. Les capacités ne s'additionnent pas : c'est la plus petite qui compte.",
          },
        ];
      },
    },
    {
      id: "productivite",
      objectifs: [2],
      type: "montants",
      titre: "La productivité du travail",
      notions: ["productivity"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const x = f(c);
        return `La productivité du travail mesure ce que produit le travail. Calculez la production par opérateur sur l'année (production ÷ ${qte(x.plan.operateurs)} opérateurs), les heures de travail de l'année (${qte(x.plan.operateurs)} opérateurs × ${qte(heuresParTrimestre(x))} heures × 4 trimestres), puis la production par heure de travail (au centième).`;
      },
      champs: (c) => {
        const p = production(c);
        const x = f(c);
        return [
          { libelle: "Production par opérateur", attendu: p.parOperateur, calcul: `${qte(p.annee.production)} ÷ ${qte(x.plan.operateurs)} = ${qte(p.parOperateur)}`, tolerance: 0 },
          { libelle: "Heures de travail de l'année", attendu: p.heures, calcul: `${qte(x.plan.operateurs)} × ${qte(heuresParTrimestre(x))} × 4 = ${qte(p.heures)} h`, tolerance: 0 },
          { libelle: "Production par heure de travail", attendu: Math.round(p.parHeure * 100) / 100, calcul: `${qte(p.annee.production)} ÷ ${qte(p.heures)} = ${qte(p.parHeure)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const p = production(c);
        return [
          `Chaque opérateur montera ${qte(p.parOperateur)} ${c.unites} sur l'année, soit ${qte(p.parHeure)} par heure de travail.`,
          "C'est une productivité apparente : elle rapporte toute la production au seul travail, alors que la ligne y a sa part. Ici, c'est la ligne qui bride : un opérateur de plus ajouterait des heures sans rien monter de plus, et la production par opérateur baisserait.",
        ];
      },
    },
    {
      id: "une-embauche",
      objectifs: [3],
      type: "montants",
      titre: "Un opérateur de plus",
      notions: ["productivity", "payroll"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const x = f(c);
        return `Le responsable de la production propose d'embaucher un opérateur de plus pour l'année N + 1. Il coûte ${eur(x.personnel.coutDUnRecrutement)} de recrutement, puis ${eur(coutAnnuelDUnOperateur(x))} sur l'année. Calculez la capacité de l'équipe par trimestre avec lui, la production de l'année avec lui, puis l'écart de résultat (la marge des ${c.unites} gagnées, à ${eur(margeUnitaire(x))} chacune, moins ce qu'il coûte).`;
      },
      champs: (c) => {
        const p = production(c);
        const x = f(c);
        const equipe = p.avec.trimestres[0]!.capaciteEquipe;
        return [
          { libelle: "Capacité de l'équipe par trimestre, avec lui", attendu: equipe, calcul: `${qte(p.avec.operateurs)} × ${qte(enceintesParOperateur(x))} = ${qte(equipe)}`, tolerance: 0 },
          { libelle: "Production de l'année, avec lui", attendu: p.avec.production, calcul: `${p.avec.trimestres.map((t) => qte(t.production)).join(" + ")} = ${qte(p.avec.production)}`, tolerance: 0 },
          {
            libelle: "Écart de résultat de l'année",
            attendu: p.ecartDeResultat,
            calcul: `${qte(p.productionGagnee)} × ${eur(margeUnitaire(x))} − (${eur(x.personnel.coutDUnRecrutement)} + ${eur(coutAnnuelDUnOperateur(x))}) = ${eur(p.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = production(c);
        return [
          `L'équipe pourrait monter ${qte(p.avec.trimestres[0]!.capaciteEquipe)} ${c.unites} par trimestre, mais les postes n'en montent toujours que ${qte(p.capaciteOutil)} : la production ne bouge pas, et le résultat baisse de ${eur(-p.ecartDeResultat)}.`,
          `La production par opérateur tombe de ${qte(p.parOperateur)} à ${qte(p.avec.production / p.avec.operateurs)} ${c.unites} : le travail ajouté ne trouve pas de poste où monter.`,
        ];
      },
    },
    {
      id: "embaucher",
      objectifs: [3],
      type: "choix",
      titre: "Embaucher pour produire plus ?",
      notions: ["productivity", "capacity"],
      question: (c) => `Faut-il embaucher un opérateur de plus chez ${c.entreprise} pour l'année N + 1 ?`,
      options: (c) => {
        const p = production(c);
        const faits = `la production ${p.productionGagnee > 0 ? `gagne ${qte(p.productionGagnee)} ${c.unites}` : "ne gagne rien"}, et le résultat ${p.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(p.ecartDeResultat))}.`;
        const verdict = p.productionGagnee <= 0 ? "rien" : p.ecartDeResultat > 0 ? "paie" : "pas-assez";
        return [
          { texte: "Oui : la production monte, et paie son salaire", juste: verdict === "paie", retour: `${verdict === "paie" ? "Oui" : "Non"} : ${faits}` },
          { texte: "Non : la production monte, mais trop peu", juste: verdict === "pas-assez", retour: `${verdict === "pas-assez" ? "Oui" : "Non"} : ${faits}` },
          {
            texte: "Non : il ne ferait rien produire",
            juste: verdict === "rien",
            retour: `${verdict === "rien" ? "Oui" : "Non"} : ${faits} Ce sont les postes qui brident : pour produire plus, il faudrait d'abord un poste de plus.`,
          },
        ];
      },
    },
    {
      id: "ce-que-doit-monter-un-operateur",
      objectifs: [1],
      type: "curseur",
      titre: "Ce que doit monter un opérateur",
      notions: ["productivity", "capacity"],
      question: (c) => {
        const p = production(c);
        const x = f(c);
        return `Faites varier ce que chaque opérateur monte en un trimestre. Une droite donne ce que monte l'équipe de ${qte(x.plan.operateurs)}, l'autre ce que montent les postes (${qte(p.capaciteOutil)} ${c.unites}). Placez le curseur sur la plus petite production par opérateur qui fait que l'équipe ne bride pas la ligne, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ce que monte un opérateur en un trimestre", unite: c.unites }),
      cible: (c) => ({ attendu: productiviteQuiSuitLaLigne(c), ...PRODUCTIVITE_DU_CURSEUR }),
      zones: ["L'équipe suit la ligne", "L'équipe bride la ligne"],
      rates: () => ({
        dessous: "À ce rythme, l'équipe monte moins que les postes : c'est elle qui bride la production.",
        dessus: "À ce rythme, l'équipe suit la ligne, mais moins suffirait : cherchez la plus petite production.",
      }),
      montrer: "Montrer la production",
      lecture: (c, q) => {
        const p = production(c);
        const equipe = q * f(c).plan.operateurs;
        return [
          { libelle: "Ce que monte l'équipe", montant: equipe, fort: true },
          { libelle: "Ce que montent les postes", montant: p.capaciteOutil },
          { libelle: "Capacité de l'entreprise", montant: Math.min(equipe, p.capaciteOutil) },
        ];
      },
      droites: (c) => {
        const p = production(c);
        const n = f(c).plan.operateurs;
        return { produit: (q) => q * n, cout: () => p.capaciteOutil, libelles: ["Ce que monte l'équipe", "Ce que montent les postes"] };
      },
      explication: (c) => {
        const p = production(c);
        const x = f(c);
        const q = productiviteQuiSuitLaLigne(c);
        return [
          `Il suffit que chaque opérateur monte ${qte(q)} ${c.unites} par trimestre : ${qte(x.plan.operateurs)} × ${qte(q)} = ${qte(q * x.plan.operateurs)}, ce que montent les postes. Il en monte ${qte(enceintesParOperateur(x))} : l'équipe a de la marge, c'est la ligne qui bride.`,
          `Si chaque opérateur montait plus vite, la production n'en bougerait pas : les postes resteraient à ${qte(p.capaciteOutil)}.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-effectif",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de l'effectif",
      notions: ["productivity", "payroll"],
      question: (c) =>
        `Faites varier le nombre d'opérateurs de l'année N + 1, en partant de ${qte(production(c).avec.operateurs)} (avec l'embauche proposée). Le tableau donne la production de l'année, sa marge, ce que coûte l'équipe et ce qui reste. Relevez le défi.`,
      leviers: (c) => [{ code: "operateurs", libelle: "Opérateurs", unite: "opérateurs", ...EFFECTIF_DU_LABORATOIRE, depart: production(c).avec.operateurs }],
      lecture: (c, p) => {
        const x = margeApresLEquipe(f(c), p.operateurs!);
        const d = margeApresLEquipe(f(c), production(c).avec.operateurs);
        return [
          { libelle: "Production de l'année", montant: x.production, unite: c.unites, reference: d.production },
          { libelle: "Marge des ventes", montant: x.marge, reference: d.marge },
          { libelle: "Coût de l'équipe sur l'année", montant: x.equipe, reference: d.equipe },
          { libelle: "Ce qui reste, l'équipe payée", montant: x.reste, reference: d.reste, fort: true },
        ];
      },
      defi: (c) => {
        const juste = effectifDuLaboratoire(c);
        return {
          consigne: "Trouvez l'effectif qui laisse le plus de marge une fois l'équipe payée.",
          atteint: (p) => p.operateurs === juste.operateurs,
          indice: (p) => {
            const x = margeApresLEquipe(f(c), p.operateurs!);
            return `Avec ${qte(x.operateurs)} opérateurs, la ligne monte ${qte(x.production)} ${c.unites} et il reste ${eur(x.reste)}. Un opérateur de plus ferait-il monter davantage ?`;
          },
          solution: { operateurs: juste.operateurs },
        };
      },
      explication: (c, p) => {
        const x = margeApresLEquipe(f(c), p.operateurs!);
        return [
          `Défi relevé : avec ${qte(x.operateurs)} opérateurs, il reste ${eur(x.reste)}. Avec un de moins, l'équipe bride la ligne et la marge perdue dépasse le salaire économisé ; avec un de plus, la ligne bride et le salaire ne rapporte rien.`,
          "Le bon effectif suit la ressource la plus faible : il ne cherche pas à servir toute la demande.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "productivity"],
      texte: (c) => {
        const p = production(c);
        return [
          `En N + 1, ${c.entreprise} pourra monter ${qte(p.annee.capacite)} ${c.unites} et en montera ${qte(p.annee.production)} : ${pct(p.utilisation)} de sa capacité. Ce sont ses postes qui brident la production, et chaque opérateur montera ${qte(p.parOperateur)} ${c.unites}.`,
          "Produire, pour un manager, c'est faire travailler ensemble des ressources dont la plus faible fixe la capacité. Ajouter une ressource ne sert que si c'est elle qui bride : ici, une embauche ne ferait rien produire de plus, et ferait baisser la productivité du travail.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : comparez la capacité de vos équipements et celle de votre équipe avant d'embaucher.",
        ];
      },
      repere: () => "Taux d'utilisation = production ÷ capacité × 100. Productivité du travail = production ÷ effectif, ou ÷ heures de travail.",
    },
  ],
};
