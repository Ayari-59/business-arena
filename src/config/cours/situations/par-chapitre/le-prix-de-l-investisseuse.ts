import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { AUGMENTATION_DE_CAPITAL, BESOIN_DE_FONDS, PRIX_DE_L_INVESTISSEUSE, augmentationDeCapital } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'AUGMENTATION DE CAPITAL » (DCG · Comptabilité approfondie, palier 4).
 *
 * Avant l'assemblée de juin N + 1, une investisseuse propose de souscrire toute l'émission, mais à
 * `PRIX_DE_L_INVESTISSEUSE` l'action, sous le prix prévu. La présidente veut savoir ce que NOVA y
 * perdrait, et ce que les anciens associés y perdraient. L'élève refait les calculs du chapitre
 * (`augmentationDeCapital`) au prix proposé.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export function prixDeLInvestisseuse() {
  const prevu = augmentationDeCapital();
  const propose = augmentationDeCapital(AUGMENTATION_DE_CAPITAL.parite, PRIX_DE_L_INVESTISSEUSE);
  return { prevu, propose, manque: Math.round((BESOIN_DE_FONDS - propose.fonds) * 100) / 100 };
}

export const LE_PRIX_DE_L_INVESTISSEUSE: Situation = {
  code: "le-prix-de-l-investisseuse",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: [],
  reprend: ["l-augmentation-de-capital"],
  commanditaire: "La présidente",
  titre: "Le prix de l'investisseuse",
  accroche: "Une investisseuse veut toute l'émission, à un euro de moins l'action : ce que NOVA lèverait, et ce que les anciens associés y perdraient.",
  objectifs: ["Recalculer les fonds levés et la prime à un autre prix", "Recalculer le droit de souscription", "Répondre à la présidente, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend l'augmentation de capital de NOVA, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la présidente",
      texte: () => {
        const k = prixDeLInvestisseuse();
        return [
          `« L'investisseuse prendrait les ${k.prevu.nouvelles.toLocaleString("fr-FR")} actions nouvelles d'un coup, mais à ${eur(PRIX_DE_L_INVESTISSEUSE)} au lieu de ${eur(AUGMENTATION_DE_CAPITAL.prixDEmission)}. Il nous faut ${eur(BESOIN_DE_FONDS)} pour la seconde ligne. Que lèverions-nous, et que perdraient les associés qui ne suivent pas ? » La présidente`,
          "Pas de cours cette fois : la prime et le droit de souscription, vous savez les calculer.",
        ];
      },
      repere: () => "À rendre : les fonds levés, la prime, le droit de souscription au prix proposé, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "L'émission au prix proposé",
      notions: ["dilution_issuance"],
      question: () => `À ${eur(PRIX_DE_L_INVESTISSEUSE)} l'action, calculez les fonds levés, la prime d'émission et le droit de souscription d'une action ancienne.`,
      champs: () => {
        const { propose: a } = prixDeLInvestisseuse();
        return [
          { libelle: "Fonds levés", attendu: a.fonds, calcul: `${a.nouvelles.toLocaleString("fr-FR")} × ${eur(a.prix)} = ${eur(a.fonds)}` },
          { libelle: "Prime d'émission", attendu: a.prime, calcul: `${a.nouvelles.toLocaleString("fr-FR")} × (${eur(a.prix)} − ${eur(a.nominal)}) = ${eur(a.prime)}` },
          { libelle: "Droit de souscription", attendu: a.droit, calcul: `(${eur(a.valeurAvant)} − ${eur(a.prix)}) × 1 ÷ ${a.parite + 1} = ${eur(a.droit)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const k = prixDeLInvestisseuse();
        return [`Un euro de moins par action, c'est ${eur(k.manque)} de moins à lever, et un droit qui passe de ${eur(k.prevu.droit)} à ${eur(k.propose.droit)} : la perte de valeur des anciens grossit.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la présidente",
      question: () => "Que répondez-vous à la présidente ?",
      options: () => {
        const k = prixDeLInvestisseuse();
        return [
          {
            texte: `Il manquerait ${eur(k.manque)}, et les droits se vendraient plus cher`,
            juste: true,
            retour: `Oui : ${eur(k.propose.fonds)} ne couvrent pas les ${eur(BESOIN_DE_FONDS)}. Et si l'investisseuse prend toute l'émission, les anciens associés doivent lui céder leurs droits, à ${eur(k.propose.droit)} au moins, faute de quoi ils perdent cette valeur.`,
          },
          {
            texte: "Accepter : le capital augmente de la même façon, puisque le nominal ne change pas",
            juste: false,
            retour: `Non : le capital augmente bien de ${eur(k.propose.augmentationDuCapital)}, mais la prime fond, de ${eur(k.prevu.prime)} à ${eur(k.propose.prime)}, et les fonds levés avec elle.`,
          },
          {
            texte: "Accepter : un prix plus bas ne change rien pour les anciens, qui gardent leurs actions",
            juste: false,
            retour: `Non : chaque action ancienne vaudrait ${eur(k.propose.valeurApres)} après l'opération, contre ${eur(k.prevu.valeurApres)} au prix prévu. Les anciens y perdent, sauf à vendre leurs droits.`,
          },
        ];
      },
    },
  ],
};
