import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { PRODUIRE, production } from "../../chapitres/produire";
import { margeUnitaire } from "../../monde/capacite";
import { anneeAvec, coutAnnuelDUnOperateur, enceintesParOperateur, ficheDeNova } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRODUIRE : CAPACITÉ, ÉQUIPE ET PRODUCTIVITÉ » : DEUX EMBAUCHES POUR
 * PRODUIRE PLUS (bac STMG, management, palier 1).
 *
 * Le responsable de la production de NOVA voit la demande de Noël (7 800 enceintes) dépasser ce que
 * monte l'équipe (7 200) : il veut deux opérateurs de plus pour l'année N + 1. L'élève calcule la
 * capacité de l'équipe et celle de l'entreprise avec eux, ce qu'ils coûtent, et répond. Les chiffres
 * sont ceux du chapitre (monde/production-et-logistique.ts) ; seul change le nombre d'embauches,
 * hypothèse du cas nommée ci-dessous. Le verdict se calcule : ce sont les postes qui brident.
 */

/** Les embauches que demande le responsable de la production (hypothèse du cas). */
export const EMBAUCHES_DU_CAS = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

export type VerdictDesEmbauches = "se-paient" | "trop-peu" | "rien";

/** Le cas : l'équipe et l'entreprise avec deux opérateurs de plus, ce qu'ils coûtent, et le verdict. */
export function deuxEmbauches(c: Pick<Cas, "code">) {
  const f = ficheDeNova(c);
  const p = production(c);
  const operateurs = p.annee.operateurs + EMBAUCHES_DU_CAS;
  const avec = anneeAvec(f, { operateurs });
  const equipe = operateurs * enceintesParOperateur(f);
  const t4 = avec.trimestres[3]!;
  const productionGagnee = avec.production - p.annee.production;
  const cout = EMBAUCHES_DU_CAS * (f.personnel.coutDUnRecrutement + coutAnnuelDUnOperateur(f));
  const ecartDeResultat = Math.round((productionGagnee * margeUnitaire(f) - cout) * 100) / 100;
  const verdict: VerdictDesEmbauches = productionGagnee <= 0 ? "rien" : ecartDeResultat > 0 ? "se-paient" : "trop-peu";
  return { f, p, operateurs, avec, equipe, t4, capacite: Math.min(t4.capaciteOutil, equipe), productionGagnee, cout, ecartDeResultat, verdict };
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
    "Le responsable de la production veut deux opérateurs de plus pour servir la demande de Noël. Calculer la capacité qu'ils ajoutent, ce qu'ils coûtent, et lui répondre.",
  objectifs: [
    "Calculer la capacité de l'équipe et celle de l'entreprise après une embauche",
    "Calculer ce qu'une embauche change à la production et au résultat",
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
          `« Au 4e trimestre de N + 1, les clients demanderont ${qte(k.t4.demande)} ${c.unites}, et nos ${qte(k.p.annee.operateurs)} opérateurs n'en montent que ${qte(k.p.capaciteEquipe)}. Embauchons-en ${qte(EMBAUCHES_DU_CAS)} de plus dès janvier : nous servirons tout le monde. Dites-moi si j'ai raison. »`,
          `Pas de cours cette fois : les chiffres sont ceux de l'année N + 1 du chapitre. Chaque opérateur coûte ${eur(k.f.personnel.coutDUnRecrutement)} de recrutement, puis ${eur(coutAnnuelDUnOperateur(k.f))} sur l'année.`,
        ];
      },
      tableau: (c) => {
        const k = deuxEmbauches(c);
        return {
          titre: `${c.entreprise}, l'année N + 1`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Demande de l'année (${c.unites})`, valeurs: [qte(k.p.annee.demande)] },
            { libelle: `Ce que montent les postes, par trimestre (${c.unites})`, valeurs: [qte(k.p.capaciteOutil)] },
            { libelle: `Ce que monte un opérateur, par trimestre (${c.unites})`, valeurs: [qte(enceintesParOperateur(k.f))] },
            { libelle: `Production prévue de l'année (${c.unites})`, valeurs: [qte(k.p.annee.production)] },
            { libelle: "Marge sur coût variable d'une enceinte", valeurs: [eur(margeUnitaire(k.f))] },
          ],
        };
      },
      repere: () => "À rendre : la capacité avec les deux opérateurs, la production et le résultat qu'ils changent, et votre réponse.",
    },
    {
      id: "la-capacite",
      type: "montants",
      titre: "La capacité avec deux opérateurs de plus",
      notions: ["capacity", "productivity"],
      question: (c) => {
        const k = deuxEmbauches(c);
        return `Avec ${qte(EMBAUCHES_DU_CAS)} embauches, l'équipe compte ${qte(k.operateurs)} opérateurs. Calculez ce que monte l'équipe par trimestre, la capacité de l'entreprise au 4e trimestre, puis la production gagnée sur l'année (production avec les embauches, ${qte(k.avec.production)} ${c.unites}, moins production prévue).`;
      },
      champs: (c) => {
        const k = deuxEmbauches(c);
        return [
          { libelle: "Ce que monte l'équipe par trimestre", attendu: k.equipe, calcul: `${qte(k.operateurs)} × ${qte(enceintesParOperateur(k.f))} = ${qte(k.equipe)}`, tolerance: 0 },
          { libelle: "Capacité de l'entreprise au 4e trimestre", attendu: k.capacite, calcul: `la plus petite de ${qte(k.t4.capaciteOutil)} et ${qte(k.equipe)} : ${qte(k.capacite)}`, tolerance: 0 },
          { libelle: "Production gagnée sur l'année", attendu: k.productionGagnee, calcul: `${qte(k.avec.production)} − ${qte(k.p.annee.production)} = ${qte(k.productionGagnee)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const k = deuxEmbauches(c);
        return [
          `L'équipe pourrait monter ${qte(k.equipe)} ${c.unites} par trimestre, mais les postes n'en montent que ${qte(k.t4.capaciteOutil)} : ce sont eux qui fixent la capacité, et la demande de Noël reste refusée pour ${qte(k.t4.refusees)} ${c.unites}.`,
        ];
      },
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que coûtent les deux embauches",
      notions: ["payroll", "contribution_margin"],
      question: (c) => `Calculez ce que coûtent les ${qte(EMBAUCHES_DU_CAS)} opérateurs sur l'année (recrutement et salaires), puis l'écart de résultat de l'année (marge des ${c.unites} gagnées moins ce coût).`,
      champs: (c) => {
        const k = deuxEmbauches(c);
        return [
          {
            libelle: "Coût des deux embauches sur l'année",
            attendu: k.cout,
            calcul: `${qte(EMBAUCHES_DU_CAS)} × (${eur(k.f.personnel.coutDUnRecrutement)} + ${eur(coutAnnuelDUnOperateur(k.f))}) = ${eur(k.cout)}`,
            tolerance: 1,
          },
          { libelle: "Écart de résultat de l'année", attendu: k.ecartDeResultat, calcul: `${qte(k.productionGagnee)} × ${eur(margeUnitaire(k.f))} − ${eur(k.cout)} = ${eur(k.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = deuxEmbauches(c);
        return [`Les deux embauches font baisser le résultat de ${eur(-k.ecartDeResultat)} : elles ajoutent des heures de travail, pas de postes où les employer.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable de la production",
      question: () => "Que répondez-vous au responsable de la production ?",
      options: (c) => {
        const k = deuxEmbauches(c);
        const faits = `avec les deux embauches, la production ${k.productionGagnee > 0 ? `gagne ${qte(k.productionGagnee)} ${c.unites}` : "ne gagne rien"}, et le résultat ${k.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeResultat))}.`;
        return [
          { texte: "Embaucher les deux : leur production paie leurs salaires", juste: k.verdict === "se-paient", retour: `${k.verdict === "se-paient" ? "Oui" : "Non"} : ${faits}` },
          { texte: "En embaucher un seul, pour Noël", juste: false, retour: `Non : un seul opérateur ne ferait pas plus que deux, les postes restent à ${qte(k.t4.capaciteOutil)} ${c.unites}.` },
          {
            texte: "Ne pas embaucher : les postes brident",
            juste: k.verdict === "rien",
            retour: `${k.verdict === "rien" ? "Oui" : "Non"} : ${faits} Pour servir Noël, il faudrait d'abord un poste de plus.`,
          },
          { texte: "Embaucher les deux : une équipe plus nombreuse produit toujours davantage", juste: false, retour: `Non : la capacité de l'entreprise est la plus petite de celle des postes et de celle de l'équipe ; ${faits}` },
        ];
      },
    },
  ],
};
