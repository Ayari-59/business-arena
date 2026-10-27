import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { PRODUIRE, anneeAvecEmbauches, anneeDeProduction, production, type AnneeDeProduction, type VerdictDeLEmbauche } from "../../chapitres/produire";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRODUIRE : CAPACITÉ, ÉQUIPE ET PRODUCTIVITÉ » : DEUX EMBAUCHES POUR
 * PRODUIRE PLUS (bac STMG, management, palier 1).
 *
 * Le responsable de la production veut embaucher deux salariés dès le premier trimestre pour
 * produire davantage. L'élève calcule la capacité de l'équipe et de l'entreprise une fois les deux
 * salariés arrivés, lit l'année rejouée par l'arène, et répond. Les chiffres sont ceux du chapitre
 * (`anneeDeProduction`) ; seul change le nombre d'embauches, hypothèse du cas nommée ci-dessous,
 * posées en plus de celles que le gestionnaire fait lui-même (`embauchesEnPlus`). Le verdict se
 * calcule : l'embauche fait produire plus et se paie là où l'équipe bride la production.
 */

/** Les embauches que demande le responsable de la production (hypothèse du cas). */
export const EMBAUCHES_DU_CAS = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const enJours = (c: Cas) => c.code === "conseil";
const duree = (c: Cas, x: number) => (enJours(c) ? `${qte(x)} ${x >= 2 ? "jours" : "jour"}` : `${qte(x)} h`);

/** Le cas : la capacité au deuxième trimestre, l'année rejouée, et le verdict. */
export function deuxEmbauches(c: Cas) {
  const p = production(c);
  const avec = anneeDeProduction(c.code, anneeAvecEmbauches(c.code, EMBAUCHES_DU_CAS, "cas-deux-embauches-au-premier-trimestre"));
  // Au deuxième trimestre, les deux salariés sont là ; les embauches du gestionnaire au premier
  // trimestre aussi, s'il en fait.
  const effectif = avec.trimestres[1]!.effectif;
  const equipe = Math.floor((effectif * p.heuresParSalarie) / p.heuresParUnite + 1e-9);
  const outil = p.annee.trimestres[1]!.outil;
  const productionGagnee = avec.production - p.annee.production;
  const ecartDeResultat = avec.resultat - p.annee.resultat;
  const verdict: VerdictDeLEmbauche =
    productionGagnee <= 0 ? "ne-produit-pas-plus" : ecartDeResultat > 0 ? "produit-plus-et-se-paie" : "produit-plus-sans-se-payer";
  return { p, avec, effectif, equipe, outil, capacite: Math.min(outil, equipe), productionGagnee, ecartDeResultat, verdict };
}

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const k = deuxEmbauches(c);
  const ligne = (libelle: string, f: (a: AnneeDeProduction) => string) => ({ libelle, valeurs: [f(k.p.annee), f(k.avec)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec deux embauches de plus`,
    colonnes: ["L'année du cours", "Avec les deux embauches"],
    lignes: [
      ligne("Effectif moyen", (a) => qte(a.effectifMoyen)),
      ligne(`Capacité de l'entreprise sur l'année (${c.unites})`, (a) => qte(a.capacite)),
      ligne(`Production de l'année (${c.unites})`, (a) => qte(a.production)),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

export const DEUX_EMBAUCHES_POUR_PRODUIRE_PLUS: Situation = {
  code: "deux-embauches-pour-produire-plus",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: [PRODUIRE.code],
  commanditaire: "Le responsable de la production",
  titre: "Deux embauches pour produire plus",
  accroche:
    "Le responsable de la production veut deux salariés de plus dès janvier. Calculer la capacité qu'ils ajoutent, lire l'année rejouée par l'arène, et lui répondre.",
  objectifs: [
    "Calculer la capacité de l'équipe et celle de l'entreprise après une embauche",
    "Lire ce qu'une embauche change à la production et au résultat",
    "Répondre au responsable avec les chiffres",
  ],
  libre: false,
  entreprises: PRODUIRE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable de la production",
      texte: (c) => {
        const k = deuxEmbauches(c);
        return [
          `« Nous sommes ${qte(k.p.effectifDeDepart)} salariés. Embauchons-en ${qte(EMBAUCHES_DU_CAS)} de plus dès le premier trimestre : nous produirons davantage, et la production paiera leurs salaires. Dites-moi si j'ai raison. »`,
          `Pas de cours cette fois. Chaque salarié coûte ${eur(k.p.recrutement)} de recrutement, puis ${eur(k.p.salaire)} par trimestre. L'arène a rejoué l'année avec ces deux embauches, en plus de celles que le gestionnaire fait lui-même, avec les mêmes concurrents et la même façon de gérer.`,
        ];
      },
      repere: () => "À rendre : la capacité avec les deux salariés, ce que l'année rejouée a produit, et votre réponse.",
    },
    {
      id: "la-capacite",
      type: "montants",
      titre: "La capacité avec deux salariés de plus",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const k = deuxEmbauches(c);
        return `Au deuxième trimestre, les deux salariés sont arrivés : l'équipe compte ${qte(k.effectif)} salariés, qui donnent chacun ${duree(c, k.p.heuresParSalarie)} de travail par trimestre, et ${accord(c, "un")} ${c.unite} demande ${duree(c, k.p.heuresParUnite)}. Les équipements peuvent faire ${qte(k.outil)} ${c.unites} par trimestre. Calculez la capacité de l'équipe au deuxième trimestre (arrondie à l'unité inférieure), puis celle de l'entreprise.`;
      },
      champs: (c) => {
        const k = deuxEmbauches(c);
        return [
          {
            libelle: "Capacité de l'équipe au 2e trimestre",
            attendu: k.equipe,
            calcul: `${qte(k.effectif)} × ${duree(c, k.p.heuresParSalarie)} ÷ ${duree(c, k.p.heuresParUnite)} = ${qte(k.equipe)}`,
            tolerance: 1,
          },
          { libelle: "Capacité de l'entreprise au 2e trimestre", attendu: k.capacite, calcul: `la plus petite de ${qte(k.outil)} et ${qte(k.equipe)} : ${qte(k.capacite)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = deuxEmbauches(c);
        return [
          k.equipe > k.outil
            ? `L'équipe pourrait faire ${qte(k.equipe)} ${c.unites}, mais les équipements n'en font que ${qte(k.outil)} : ce sont eux qui fixent la capacité.`
            : `Les équipements pourraient faire ${qte(k.outil)} ${c.unites}, et l'équipe en fait ${qte(k.equipe)} : c'est elle qui fixe la capacité.`,
        ];
      },
    },
    {
      id: "l-annee-rejouee",
      type: "montants",
      titre: "L'année rejouée avec les deux embauches",
      notions: ["productivity", "income_statement"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        "D'après le tableau, calculez la production gagnée sur l'année, puis l'écart de résultat de l'activité (avec les deux embauches moins l'année du cours).",
      champs: (c) => {
        const k = deuxEmbauches(c);
        return [
          { libelle: "Production gagnée avec les deux embauches", attendu: k.productionGagnee, calcul: `${qte(k.avec.production)} − ${qte(k.p.annee.production)} = ${qte(k.productionGagnee)}`, tolerance: 0 },
          {
            libelle: "Écart de résultat, avec les deux embauches moins sans",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.avec.resultat)} − ${retranche(k.p.annee.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = deuxEmbauches(c);
        return [
          `${k.productionGagnee > 0 ? `La production gagne ${qte(k.productionGagnee)} ${c.unites} sur l'année` : "La production ne gagne rien"}, et le résultat de l'activité ${
            k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`
          }.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable de la production",
      question: () => "Que répondez-vous au responsable de la production ?",
      options: (c) => {
        const k = deuxEmbauches(c);
        const faits = `avec les deux embauches, la production ${k.productionGagnee > 0 ? `gagne ${qte(k.productionGagnee)} ${c.unites}` : "ne gagne rien"} sur l'année, et le résultat ${
          k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`
        }.`;
        const bride =
          k.equipe > k.outil
            ? `Ce sont les équipements qui brident : ils ne font que ${qte(k.outil)} ${c.unites} par trimestre.`
            : "C'est l'équipe qui bride : du travail en plus fait produire plus, tant que les clients le demandent.";
        return [
          {
            texte: "Embaucher les deux : la production monte et paie leurs salaires",
            juste: k.verdict === "produit-plus-et-se-paie",
            retour: `${k.verdict === "produit-plus-et-se-paie" ? "Oui" : "Non"} : ${faits} ${bride}`,
          },
          {
            texte: "Embaucher quand même : produire plus vaut un résultat plus bas",
            juste: k.verdict === "produit-plus-sans-se-payer",
            retour: `${k.verdict === "produit-plus-sans-se-payer" ? "Oui, si le but est de servir plus de clients" : "Non"} : ${faits} ${bride}`,
          },
          {
            texte: "Ne pas embaucher : ils ne feraient rien produire de plus",
            juste: k.verdict === "ne-produit-pas-plus",
            retour: `${k.verdict === "ne-produit-pas-plus" ? "Oui" : "Non"} : ${faits} ${bride}`,
          },
          {
            texte: "Embaucher les deux : une équipe plus nombreuse produit toujours davantage, quels que soient les équipements",
            juste: false,
            retour: `Non : la capacité de l'entreprise est la plus petite de celle des équipements et de celle de l'équipe ; ${faits}`,
          },
        ];
      },
    },
  ],
};
