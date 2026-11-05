import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../monde/amortissement";
import { AUDIO_COMPTOIR, NOVA_DIFFUSION, PART_DE_NOVA, groupeNova, pourcentages } from "../../monde/groupe-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INITIATION À LA CONSOLIDATION » (comptabilité générale, palier 4 ; BTS CG
 * P2 2.7.1 et 2.7.2).
 *
 * Le directeur de NOVA DIFFUSION demande à racheter des actions à NOVA, pour porter sa part à 30 %
 * (PART_DEMANDEE_PAR_LE_DIRECTEUR, hypothèse du cours). La présidente veut savoir ce qu'elle garde :
 * le contrôle, la méthode, ses intérêts dans la boutique du projet, et ce qui irait aux minoritaires.
 * L'élève refait le chemin du chapitre (monde/groupe-nova.ts) avec une autre part.
 */

/** LA PART QUE DEMANDE LE DIRECTEUR (hypothèse du cours) : 30 % du capital de la filiale. */
export const PART_DEMANDEE_PAR_LE_DIRECTEUR = 0.3;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const F = NOVA_DIFFUSION.nom;

/** Le groupe, si NOVA ne gardait que 70 % de sa filiale. */
export function directeurAvecPlusDActions() {
  const g = groupeNova();
  const part = Math.round((1 - PART_DEMANDEE_PAR_LE_DIRECTEUR) * 100) / 100;
  const p = pourcentages(part, AUDIO_COMPTOIR.partDeLaFiliale);
  const minoritaires = auCentime(g.capitauxPropres * PART_DEMANDEE_PAR_LE_DIRECTEUR);
  return { g, part, p, minoritaires, minoritairesAvant: g.minoritaires.total };
}

export const LE_DIRECTEUR_VEUT_PLUS_D_ACTIONS: Situation = {
  code: "le-directeur-veut-plus-d-actions",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["initiation-a-la-consolidation"],
  commanditaire: "La présidente",
  titre: "Le directeur veut 30 %",
  accroche: "Le directeur de la filiale demande une plus grande part : ce que NOVA garderait du contrôle, de la méthode et des intérêts.",
  objectifs: ["Calculer les pourcentages de contrôle et d'intérêts après une cession de titres", "Partager les capitaux propres de la filiale", "Répondre à la présidente, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend la filiale de distribution de NOVA, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la présidente",
      tableau: () => {
        const k = directeurAvecPlusDActions();
        return {
          titre: `${F} au 31 décembre N + 1`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Part de NOVA aujourd'hui", valeurs: [pct(PART_DE_NOVA)] },
            { libelle: "Part demandée par le directeur", valeurs: [pct(PART_DEMANDEE_PAR_LE_DIRECTEUR)] },
            { libelle: `Part de ${F} dans ${AUDIO_COMPTOIR.nom}, en projet`, valeurs: [pct(AUDIO_COMPTOIR.partDeLaFiliale)] },
            { libelle: "Capitaux propres de la filiale", valeurs: [eur(k.g.capitauxPropres)] },
          ],
        };
      },
      texte: () => [
        `« Le directeur de ${F} veut nous racheter des actions pour en détenir ${pct(PART_DEMANDEE_PAR_LE_DIRECTEUR)}. Garderons-nous la main sur la filiale, et sur la boutique qu'elle veut acheter ? Et que perdrions-nous ? » La présidente`,
        "Pas de cours cette fois : le contrôle, les intérêts et le partage des capitaux propres, vous les connaissez.",
      ],
      repere: () => "À rendre : le contrôle et les intérêts de NOVA dans la boutique, la part des minoritaires, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Les pourcentages, et la part des minoritaires",
      notions: ["consolidation", "minority_translation"],
      question: () => `Si NOVA ne garde que ${pct(1 - PART_DEMANDEE_PAR_LE_DIRECTEUR)} de ${F}, calculez, en pour cent, son contrôle et ses intérêts dans ${AUDIO_COMPTOIR.nom}, puis, en euros, les intérêts minoritaires de la filiale au 31 décembre N + 1.`,
      champs: () => {
        const k = directeurAvecPlusDActions();
        return [
          { libelle: `Contrôle de NOVA dans ${AUDIO_COMPTOIR.nom}`, attendu: k.p.controleIndirect * 100, calcul: `NOVA contrôle encore ${F} (${pct(k.part)}) : ${pct(k.p.controleIndirect)}` },
          { libelle: `Intérêts de NOVA dans ${AUDIO_COMPTOIR.nom}`, attendu: k.p.interetsIndirects * 100, calcul: `${pct(k.part)} × ${pct(AUDIO_COMPTOIR.partDeLaFiliale)} = ${pct(k.p.interetsIndirects)}` },
          { libelle: "Intérêts minoritaires", attendu: k.minoritaires, calcul: `${eur(k.g.capitauxPropres)} × ${pct(PART_DEMANDEE_PAR_LE_DIRECTEUR)} = ${eur(k.minoritaires)}` },
        ];
      },
      explication: () => {
        const k = directeurAvecPlusDActions();
        return [
          `À ${pct(k.part)}, NOVA garde plus de la moitié des droits de vote : le contrôle exclusif, l'intégration globale, et le contrôle de la boutique. Ses intérêts, eux, baissent : ${pct(k.p.interetsIndirects)} dans la boutique, et ${eur(k.minoritaires)} des capitaux propres de la filiale aux minoritaires, contre ${eur(k.minoritairesAvant)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la présidente",
      question: () => "Que répondez-vous à la présidente ?",
      options: () => {
        const k = directeurAvecPlusDActions();
        return [
          {
            texte: `Le contrôle reste, les intérêts tombent à ${pct(k.p.interetsIndirects)}`,
            juste: true,
            retour: `Oui : la méthode ne change pas, l'intégration globale reprend toujours toute la filiale ; seul le partage change, ${eur(k.minoritaires)} aux minoritaires. Au-delà de la moitié des droits de vote cédés, NOVA perdrait la main.`,
          },
          {
            texte: "NOVA perd le contrôle exclusif : il faudra mettre la filiale en équivalence, comme une simple participation",
            juste: false,
            retour: `Non : ${pct(k.part)} des droits de vote, c'est plus de la moitié. Le contrôle exclusif reste, et la méthode avec lui.`,
          },
          {
            texte: `Rien ne change : NOVA contrôle la filiale, elle garde ses ${pct(PART_DE_NOVA)} d'intérêts dans les comptes du groupe`,
            juste: false,
            retour: "Non : les intérêts suivent le capital détenu ; le résultat et les capitaux propres de la filiale se partagent autrement.",
          },
        ];
      },
    },
  ],
};
