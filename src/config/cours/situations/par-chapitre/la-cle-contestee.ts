import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { COUT_PAR_PRODUIT, coutsParProduit } from "../../chapitres/cout-par-produit";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT PAR PRODUIT » : LA CLÉ CONTESTÉE (contrôle de gestion,
 * palier 3).
 *
 * Le responsable d'une référence trouve qu'elle porte trop de charges communes avec la
 * répartition aux heures de travail. Il demande qu'on les répartisse au chiffre
 * d'affaires : sa référence, dit-il, deviendrait plus rentable, et la gamme avec elle. Le
 * dirigeant veut les chiffres avant de trancher. L'élève refait seul le chemin du
 * chapitre pour cette référence (coût direct, coût de l'heure, charges imputées,
 * résultat), puis le refait avec l'autre clé, et rend sa réponse.
 *
 * Le cas est neuf par sa question : la clé n'est plus celle du chapitre, et le calcul se
 * fait. La référence contestée est celle que la répartition aux heures charge le plus
 * par rapport à son chiffre d'affaires. Les chiffres sont ceux du mois en gamme
 * (`coutsParProduit`).
 */

/**
 * L'unité d'œuvre de la clé proposée : cent euros de chiffre d'affaires, celle que le
 * chapitre « Coût complet » donne déjà au centre distribution.
 */
export const ASSIETTE_DU_CHIFFRE_D_AFFAIRES = 100;

const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
/** Un résultat dit en mots, après « de » ou après « à » : « d'une perte de 882,01 € », « à un bénéfice de 589,48 € ». */
const deResultat = (x: number) => (x >= 0 ? `d'un bénéfice de ${eur(x)}` : `d'une perte de ${eur(-x)}`);
const aResultat = (x: number) => (x >= 0 ? `à un bénéfice de ${eur(x)}` : `à une perte de ${eur(-x)}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function cleContestee(c: Cas) {
  const k = coutsParProduit(c);
  const chiffreDAffaires = auCentime(k.parReference.reduce((s, l) => s + l.chiffreDAffaires, 0));
  const directes = auCentime(k.parReference.reduce((s, l) => s + l.direct, 0));
  const centaines = chiffreDAffaires / ASSIETTE_DU_CHIFFRE_D_AFFAIRES;
  // Le coût de cent euros de chiffre d'affaires, arrondi au centime : celui que l'élève calcule, puis emploie.
  const coutDesCent = auCentime(k.communes / centaines);
  const lignes = k.parReference.map((l) => {
    const imputeesAuChiffre = auCentime((l.chiffreDAffaires / ASSIETTE_DU_CHIFFRE_D_AFFAIRES) * coutDesCent);
    return { ...l, imputeesAuChiffre, resultatAuChiffre: auCentime(l.chiffreDAffaires - l.direct - imputeesAuChiffre) };
  });
  // La référence contestée : celle que les heures chargent le plus, par rapport au chiffre d'affaires.
  const x = [...lignes].sort((a, b) => b.imputees - b.imputeesAuChiffre - (a.imputees - a.imputeesAuChiffre))[0]!;
  return {
    ...k,
    chiffreDAffaires,
    directes,
    centaines,
    coutDesCent,
    lignes,
    x,
    gain: auCentime(x.resultatAuChiffre - x.resultat),
    // Le résultat de la gamme ne dépend pas de la clé : le chiffre d'affaires, moins les charges propres, moins les charges communes.
    resultatDeLaGamme: auCentime(chiffreDAffaires - directes - k.communes),
    // Le coût de l'heure et celui des cent euros sont arrondis : quelques centimes d'écart sont admis.
    // Le résultat de la gamme, refait en additionnant les résultats des références, porte les arrondis des deux coûts unitaires.
    toleranceDeLaGamme: Math.max(1, auCentime((centaines + k.heures) * 0.005) + 0.01),
    toleranceAuChiffre: Math.max(0.05, auCentime((x.chiffreDAffaires / ASSIETTE_DU_CHIFFRE_D_AFFAIRES) * 0.005) + 0.01),
  };
}

export const LA_CLE_CONTESTEE: Situation = {
  code: "la-cle-contestee",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [],
  reprend: ["cout-par-produit"],
  entreprises: COUT_PAR_PRODUIT.entreprises,
  commanditaire: "Le dirigeant",
  titre: "La clé de répartition contestée",
  accroche:
    "Un responsable de produit veut qu'on répartisse les charges communes au chiffre d'affaires plutôt qu'aux heures. Sa référence y gagnerait-elle, et la gamme avec elle ?",
  objectifs: [
    "Calculer le coût direct d'une référence et le coût d'une unité d'œuvre",
    "Calculer les charges communes imputées et le résultat d'une référence avec deux clés",
    "Montrer ce qu'une clé de répartition change, et ce qu'elle ne change pas",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const r = cleContestee(c);
        return [
          `« Le responsable de la référence ${r.x.nom} trouve qu'elle porte trop de charges communes : on les répartit aux heures de travail, et elle en demande beaucoup. Il veut qu'on les répartisse au chiffre d'affaires. ${r.x.nom} deviendrait plus rentable, dit-il, et ${c.entreprise} avec elle. Avant de trancher, je veux les chiffres des deux façons de faire. »`,
          "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = cleContestee(c);
        const ligne = (libelle: string, f: (l: (typeof r.lignes)[number]) => string, total = "") => ({
          libelle,
          valeurs: [...r.lignes.map(f), total],
        });
        return {
          titre: `La gamme du mois · ${c.entreprise}`,
          colonnes: [...r.lignes.map((l) => l.nom), "Toute la gamme"],
          lignes: [
            ligne("Unités vendues", (l) => qte(l.quantite)),
            ligne("Prix de vente, hors taxes", (l) => eur(l.prix)),
            ligne("Chiffre d'affaires", (l) => eur(l.chiffreDAffaires), eur(r.chiffreDAffaires)),
            ligne("Coût variable d'une unité", (l) => eur(l.coutVariableUnitaire)),
            ligne("Publicité", (l) => eur(l.publicite)),
            ligne("Qualité", (l) => eur(l.qualite)),
            ligne("Heures de travail par unité", (l) => `${qte(l.heuresParUnite)} h`),
            ligne("Charges communes (structure, entretien, usure)", () => "", eur(r.communes)),
          ],
        };
      },
      repere: (c) =>
        `À rendre : le résultat de la référence ${cleContestee(c).x.nom} avec les heures, puis avec le chiffre d'affaires, celui de la gamme, et votre réponse.`,
    },
    {
      id: "aux-heures",
      type: "montants",
      titre: "Aux heures, comme aujourd'hui",
      notions: ["full_unit_cost"],
      question: (c) => {
        const x = cleContestee(c).x;
        return `Commencez par la répartition d'aujourd'hui. Le coût direct de la référence ${x.nom} (coût variable, publicité et qualité), le coût d'une heure de travail pour toute la gamme, les charges communes imputées à ${x.nom}, puis son résultat (négatif pour une perte).`;
      },
      champs: (c) => {
        const r = cleContestee(c);
        const x = r.x;
        return [
          { libelle: `Coût direct : ${x.nom}`, attendu: x.direct, tolerance: 0.05, calcul: `${qte(x.quantite)} × ${eur(x.coutVariableUnitaire)} + ${eur(x.publicite)} + ${eur(x.qualite)} = ${eur(x.direct)}` },
          {
            libelle: "Coût d'une heure",
            attendu: r.coutDeLHeure,
            tolerance: 0.01,
            calcul: `${eur(r.communes)} ÷ (${r.parReference.map((l) => `${qte(l.quantite)} × ${qte(l.heuresParUnite)} h`).join(" + ")}) = ${eur(r.communes)} ÷ ${qte(r.heures)} h = ${eur(r.coutDeLHeure)}`,
          },
          { libelle: `Charges communes imputées : ${x.nom}`, attendu: x.imputees, tolerance: 0.05, calcul: `${qte(x.heures)} h × ${eur(r.coutDeLHeure)} = ${eur(x.imputees)}` },
          { libelle: `Résultat : ${x.nom}`, attendu: x.resultat, tolerance: 0.05, calcul: `${eur(x.chiffreDAffaires)} − ${eur(x.direct)} − ${eur(x.imputees)} = ${eur(x.resultat)}` },
        ];
      },
      explication: (c) => {
        const r = cleContestee(c);
        const x = r.x;
        const partDesHeures = Math.round((x.heures / r.heures) * 100);
        const partDuChiffre = Math.round((x.chiffreDAffaires / r.chiffreDAffaires) * 100);
        return [
          `${x.nom} demande ${partDesHeures} % des heures de la gamme pour ${partDuChiffre} % du chiffre d'affaires : aux heures, elle porte une grosse part des charges communes, ${eur(x.imputees)}.`,
        ];
      },
    },
    {
      id: "au-chiffre-d-affaires",
      type: "montants",
      titre: "Au chiffre d'affaires",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const x = cleContestee(c).x;
        return `Refaites le calcul avec la clé proposée : le coût des charges communes pour ${eur(ASSIETTE_DU_CHIFFRE_D_AFFAIRES)} de chiffre d'affaires, les charges imputées à ${x.nom}, son résultat, puis le résultat de toute la gamme.`;
      },
      champs: (c) => {
        const r = cleContestee(c);
        const x = r.x;
        return [
          {
            libelle: `Coût pour ${ASSIETTE_DU_CHIFFRE_D_AFFAIRES} € de chiffre d'affaires`,
            attendu: r.coutDesCent,
            tolerance: 0.01,
            calcul: `${eur(r.communes)} ÷ (${eur(r.chiffreDAffaires)} ÷ ${ASSIETTE_DU_CHIFFRE_D_AFFAIRES}) = ${eur(r.coutDesCent)}`,
          },
          {
            libelle: `Charges communes imputées : ${x.nom}`,
            attendu: x.imputeesAuChiffre,
            tolerance: r.toleranceAuChiffre,
            calcul: `${eur(x.chiffreDAffaires)} ÷ ${ASSIETTE_DU_CHIFFRE_D_AFFAIRES} × ${eur(r.coutDesCent)} = ${eur(x.imputeesAuChiffre)}`,
          },
          {
            libelle: `Résultat : ${x.nom}`,
            attendu: x.resultatAuChiffre,
            tolerance: r.toleranceAuChiffre,
            calcul: `${eur(x.chiffreDAffaires)} − ${eur(x.direct)} − ${eur(x.imputeesAuChiffre)} = ${eur(x.resultatAuChiffre)}`,
          },
          {
            libelle: "Résultat de la gamme",
            attendu: r.resultatDeLaGamme,
            tolerance: r.toleranceDeLaGamme,
            calcul: `${eur(r.chiffreDAffaires)} − ${eur(r.directes)} de coûts directs − ${eur(r.communes)} de charges communes = ${eur(r.resultatDeLaGamme)}`,
          },
        ];
      },
      explication: (c) => {
        const r = cleContestee(c);
        const x = r.x;
        return [
          `Au chiffre d'affaires, ${x.nom} ne porte plus que ${eur(x.imputeesAuChiffre)} de charges communes : son résultat passe ${deResultat(x.resultat)} ${aResultat(x.resultatAuChiffre)}. Mais les ${eur(r.communes)} restent à payer, en entier : les charges que la référence ${x.nom} ne porte plus, les autres les portent.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = cleContestee(c);
        const x = r.x;
        return [
          {
            texte: `${x.nom} gagnerait ${eur(r.gain)}, pris aux autres : la gamme reste à ${eur(r.resultatDeLaGamme)}`,
            juste: true,
            retour: `Oui : ${x.nom} passerait ${deResultat(x.resultat)} ${aResultat(x.resultatAuChiffre)}, mais les charges communes, ${eur(r.communes)}, ne changent pas. La clé déplace les charges d'une référence à l'autre ; le résultat de la gamme, ${eur(r.resultatDeLaGamme)}, ne bouge pas.`,
          },
          {
            texte: `La gamme gagnerait ${eur(r.gain)} de plus, puisque la référence ${x.nom} porterait moins de charges communes`,
            juste: false,
            retour: `Non : les ${eur(r.gain)} que la référence ${x.nom} ne porterait plus retombent sur les autres. Les charges communes restent de ${eur(r.communes)}, et le résultat de la gamme de ${eur(r.resultatDeLaGamme)}.`,
          },
          {
            texte: `Rien ne changerait pour ${x.nom} : ses charges propres et son chiffre d'affaires restent les mêmes`,
            juste: false,
            retour: `Non : ses charges propres restent de ${eur(x.direct)}, mais sa part des charges communes passerait de ${eur(x.imputees)} à ${eur(x.imputeesAuChiffre)}. Son résultat en coût complet dépend de la clé.`,
          },
        ];
      },
    },
  ],
};
