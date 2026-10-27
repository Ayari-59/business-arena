import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { TRIMESTRE_DE_L_ACHAT, machineDuChapitre } from "../../chapitres/croitre-en-investissant";
import { TAUX_TRIMESTRIEL, projet } from "../../chapitres/la-valeur-actuelle-nette";
import { LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, deuxProjets, machineSuivante } from "../../chapitres/le-tri-et-le-choix-entre-deux-projets";
import type { Situation } from "../types";

/** Au centime, sans zéro négatif. */
const centime = (x: number) => auCentime(x) || 0;
/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const coef4 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX DE RENTABILITÉ INTERNE ET LE CHOIX ENTRE DEUX PROJETS » :
 * ACHETER LES DEUX MACHINES (DSCG, UE2 Finance, palier 4).
 *
 * Le chapitre a traité les deux machines comme des projets qui s'excluent. La directrice générale
 * demande pourquoi choisir : l'arène accepte les deux. Elle rejoue donc le projet avec les deux
 * machines achetées au trimestre 1. Leurs ventes se partagent la même demande : la VAN de
 * l'ensemble n'est pas la somme des deux VAN, et la question devient de savoir si la seconde
 * machine ajoute encore de la valeur à la première.
 *
 * LE FINANCEMENT. Payées ensemble sur la trésorerie, les deux machines font défaillir L'ESCALE
 * (le découvert ne couvre pas leur prix) : le rejeu de l'ensemble les paie donc par un emprunt du
 * même montant, partout. Les flux d'exploitation n'en dépendent pas (l'EBE et le résultat
 * d'exploitation sont ceux du rejeu payé comptant là où celui-ci ne défaille pas, la garde le
 * vérifie) : la VAN laisse le financement au taux d'actualisation, comme au chapitre.
 */

export type Verdict = "les-deux" | "le-meilleur-seul" | "aucune";

/** L'ensemble des deux machines, face à chacune seule. */
export function acheterLesDeux(c: Cas) {
  const { a, b } = deuxProjets(c);
  const ensemble = projet(c.code, [machineDuChapitre(c.code), machineSuivante(c.code)], undefined, "emprunt");
  const meilleur = a.van >= b.van ? { nom: "A" as const, p: a } : { nom: "B" as const, p: b };
  const somme = centime(a.van + b.van);
  const perdu = centime(somme - ensemble.van);
  const gain = centime(ensemble.van - meilleur.p.van);
  const verdict: Verdict = ensemble.van > meilleur.p.van && ensemble.van > 0 ? "les-deux" : meilleur.p.van > 0 ? "le-meilleur-seul" : "aucune";
  return { a, b, ensemble, meilleur, somme, perdu, gain, verdict };
}

const T = TRIMESTRE_DE_L_ACHAT;
const TAUX_PCT = auCentieme(TAUX_TRIMESTRIEL * 100);

export const ACHETER_LES_DEUX_MACHINES: Situation = {
  code: "acheter-les-deux-machines",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS.code],
  commanditaire: "La directrice générale",
  titre: "Acheter les deux machines",
  accroche:
    "Pourquoi choisir entre les deux machines ? La directrice générale voudrait les acheter toutes les deux. L'arène rejoue le projet avec l'une et l'autre : leurs ventes se partagent la même demande, et les VAN ne s'additionnent pas.",
  objectifs: [
    "Calculer la VAN d'un ensemble de deux investissements",
    "Mesurer ce que deux projets qui se partagent la même demande perdent à être menés ensemble",
    "Dire si un second investissement ajoute de la valeur au premier",
    "Répondre à la directrice générale, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice générale",
      texte: (c) => {
        const { a, b } = acheterLesDeux(c);
        return [
          `« Vous m'avez fait choisir entre la machine « ${a.machine} » et la machine « ${b.machine} ». Mais rien ne nous oblige à choisir : achetons les deux au trimestre ${T}, la banque prêtera leur prix. Que vaut l'ensemble ? »`,
          `Pas de cours cette fois : l'arène a rejoué les ${a.duree} trimestres avec les deux machines. Le tableau donne les flux de trésorerie d'exploitation de l'ensemble, après impôt, calculés comme au chapitre, et les VAN de chaque machine seule, au taux de ${pct(TAUX_PCT)} par trimestre.`,
        ];
      },
      tableau: (c) => {
        const { a, b, ensemble } = acheterLesDeux(c);
        return {
          titre: `Les deux machines ${dE(c.entreprise)}, achetées ensemble`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix des deux machines, décaissé au trimestre ${T}`, valeurs: [eur(ensemble.cout)] },
            ...ensemble.lignes.map((l) => ({ libelle: `Flux des deux machines, trimestre ${l.trimestre}`, valeurs: [eur(l.flux)] })),
            { libelle: `Valeur résiduelle nette des deux, fin du trimestre ${ensemble.duree}`, valeurs: [eur(ensemble.vr.nette)] },
            { libelle: "VAN du projet A seul", valeurs: [eur(a.van)] },
            { libelle: "VAN du projet B seul", valeurs: [eur(b.van)] },
          ],
        };
      },
      repere: () => "À rendre : la VAN des deux machines ensemble, ce qu'elles perdent à se partager la demande, et votre réponse.",
    },
    {
      id: "van",
      type: "montants",
      titre: "La VAN de l'ensemble",
      notions: ["discounting", "capacity"],
      question: () =>
        `Au taux de ${pct(TAUX_PCT)} par trimestre, calculez la valeur actuelle des flux des deux machines, celle de leur valeur résiduelle, puis la VAN de l'ensemble.`,
      champs: (c) => {
        const { ensemble: p } = acheterLesDeux(c);
        return [
          { libelle: "Valeur actuelle des flux des deux machines", attendu: p.va, calcul: `la somme des flux × (1 + ${pct(TAUX_PCT)})^(−k), k de 1 à ${p.duree} : ${eur(p.va)}`, tolerance: p.tolerance },
          { libelle: "Valeur actuelle de leur valeur résiduelle", attendu: p.vaResiduelle, calcul: `${eur(p.vr.nette)} × ${coef4(p.coefFin)} = ${eur(p.vaResiduelle)}`, tolerance: 1 },
          { libelle: "VAN des deux machines ensemble", attendu: p.van, calcul: `${eur(p.va)} + ${eur(p.vaResiduelle)} − ${eur(p.cout)} = ${eur(p.van)}`, tolerance: p.tolerance + 1 },
        ];
      },
      explication: (c) => {
        const { ensemble } = acheterLesDeux(c);
        return [
          ensemble.van > 0
            ? `L'ensemble crée ${eur(ensemble.van)} de valeur au coût du capital.`
            : `L'ensemble détruit ${eur(-ensemble.van)} de valeur au coût du capital.`,
        ];
      },
    },
    {
      id: "comparer",
      type: "montants",
      titre: "Ensemble ou séparément",
      notions: ["cannibalization", "discounting"],
      question: () =>
        "Calculez la somme des VAN des deux projets menés seuls, ce que l'ensemble perd face à cette somme, puis l'écart entre la VAN de l'ensemble et celle du meilleur projet seul (l'ensemble moins le meilleur).",
      champs: (c) => {
        const { a, b, ensemble, meilleur, somme, perdu, gain } = acheterLesDeux(c);
        return [
          { libelle: "Somme des VAN des deux projets seuls", attendu: somme, calcul: `${eur(a.van)} + ${retranche(b.van)} = ${eur(somme)}`, tolerance: 1 },
          { libelle: "Valeur perdue en les menant ensemble", attendu: perdu, calcul: `${eur(somme)} − ${retranche(ensemble.van)} = ${eur(perdu)}`, tolerance: ensemble.tolerance + 1 },
          {
            libelle: "Écart avec le meilleur projet seul",
            attendu: gain,
            calcul: `${eur(ensemble.van)} − ${retranche(meilleur.p.van)}, la VAN du projet ${meilleur.nom} = ${eur(gain)}`,
            tolerance: ensemble.tolerance + 1,
          },
        ];
      },
      explication: (c) => {
        const { meilleur, perdu, gain } = acheterLesDeux(c);
        return [
          `Menés ensemble, les deux projets valent ${eur(perdu)} de moins que leurs VAN additionnées : les deux machines servent les mêmes clients, et la capacité de l'une prend une part des ventes que l'autre aurait faites seule.`,
          gain > 0
            ? `Ajoutée au projet ${meilleur.nom}, l'autre machine apporte encore ${eur(gain)} de valeur : la demande suffit à remplir une partie de la capacité en plus.`
            : `Ajoutée au projet ${meilleur.nom}, l'autre machine retire ${eur(-gain)} de valeur : la demande ne suffit pas à remplir la capacité en plus.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice générale",
      notions: ["cannibalization"],
      question: () => "Quelle phrase envoyez-vous à la directrice générale ?",
      options: (c) => {
        const { a, b, ensemble, meilleur, gain, perdu, verdict } = acheterLesDeux(c);
        return [
          {
            texte: "Achetons les deux : l'ensemble vaut plus que le meilleur projet seul",
            juste: verdict === "les-deux",
            retour:
              verdict === "les-deux"
                ? `Oui : la VAN de l'ensemble, ${eur(ensemble.van)}, dépasse de ${eur(gain)} celle du projet ${meilleur.nom} seul. Les deux machines se partagent la demande, mais la seconde ajoute encore de la valeur.`
                : `Non : la VAN de l'ensemble, ${eur(ensemble.van)}, est sous celle du projet ${meilleur.nom} seul, ${eur(meilleur.p.van)}.`,
          },
          {
            texte: `N'achetons que la machine du projet ${meilleur.nom} : la seconde retire de la valeur`,
            juste: verdict === "le-meilleur-seul",
            retour:
              verdict === "le-meilleur-seul"
                ? `Oui : seule, la machine du projet ${meilleur.nom} crée ${eur(meilleur.p.van)} ; avec l'autre, l'ensemble ne vaut que ${eur(ensemble.van)}. La capacité en plus ne trouve pas assez de clients pour payer la seconde machine.`
                : verdict === "les-deux"
                  ? `Non : la seconde machine ajoute ${eur(gain)} de valeur à la première.`
                  : `Non : même seule, la machine du projet ${meilleur.nom} ne crée pas de valeur.`,
          },
          {
            texte: "N'achetons rien : ni l'une ni l'autre ne crée de valeur",
            juste: verdict === "aucune",
            retour: verdict === "aucune" ? "Oui : aucune VAN n'est positive, ni seule ni ensemble." : `Non : la machine du projet ${meilleur.nom} crée ${eur(meilleur.p.van)} de valeur.`,
          },
          {
            texte: "Achetons les deux : leurs VAN s'additionnent, puisque chacune des deux machines est rentable de son côté",
            juste: false,
            retour: `Non : les VAN des projets seuls, ${eur(a.van)} et ${eur(b.van)}, supposent chacune toute la demande pour une seule machine. Ensemble, elles se la partagent : l'ensemble perd ${eur(perdu)} face à leur somme.`,
          },
        ];
      },
    },
  ],
};
