import { arrondi2, eur, nombreAuCentieme, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_LA_VALEUR } from "../../chapitres/les-formes-de-la-valeur";
import { L_ESCALE } from "../../monde/l-escale";
import { NOTES_DES_CONCURRENTS, PRIX_D_HIVER_DU_COMPTOIR, coutCompletDUneNuitee, resultatADemandeEgale, valeurDeLEscale } from "../../monde/valeur-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES FORMES DE LA VALEUR » : LE COMPTOIR BAISSE SON PRIX (Bac STMG, SGN de
 * première, palier 1).
 *
 * Le Comptoir annonce 72 € la nuitée pour l'hiver prochain (PRIX_D_HIVER_DU_COMPTOIR). Un associé de
 * L'ESCALE veut s'aligner. Les calculs sont ceux du chapitre : le coût complet d'une nuitée d'hiver et
 * le résultat de l'hiver à demande égale ; la réponse s'appuie sur la valeur perçue.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le résultat de l'hiver attend le centime (à l'euro près,
 * avant) ; les notes s'écrivent au centième.
 */

const note = (x: number) => `${nombreAuCentieme(x)} sur 5`;

export function leComptoirBaisse() {
  const k = coutCompletDUneNuitee(1);
  const r = resultatADemandeEgale(1, PRIX_D_HIVER_DU_COMPTOIR);
  return { ...k, prix: PRIX_D_HIVER_DU_COMPTOIR, ecartParNuitee: arrondi2(PRIX_D_HIVER_DU_COMPTOIR - k.coutComplet), resultat: r.resultat };
}

export const LE_COMPTOIR_BAISSE_SON_PRIX: Situation = {
  code: "le-comptoir-baisse-son-prix",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["les-formes-de-la-valeur"],
  commanditaire: "Un associé de l'hôtel",
  titre: "Le Comptoir baisse son prix",
  accroche: "L'hôtel concurrent, moins bien noté, annonce un prix d'hiver plus bas encore. Un associé veut s'aligner. Faut-il le suivre ?",
  objectifs: ["Comparer un prix au coût complet", "Chiffrer le résultat d'un prix aligné", "Répondre à l'associé, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "le cas reprend l'hiver de L'ESCALE et ses concurrents, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'associé",
      texte: () => {
        const v = valeurDeLEscale();
        return [
          `« Le Comptoir passe à ${eur(PRIX_D_HIVER_DU_COMPTOIR)} la nuitée cet hiver. Alignons-nous, sinon nos clients partiront chez lui. » L'associé`,
          `Le Comptoir est noté ${note(NOTES_DES_CONCURRENTS[0]!)} ; L'ESCALE, ${note(v.noteMoyenne)}. L'hiver, l'hôtel vend ${qte(coutCompletDUneNuitee(1).vendues)} nuitées, à ${eur(L_ESCALE.prixDeLAnnee)}.`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût complet d'une nuitée d'hiver, ce que l'hôtel gagnerait ou perdrait par nuitée à ce prix, le résultat de l'hiver, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Le prix aligné, face au coût",
      notions: ["full_unit_cost"],
      question: () => "À demande égale, calculez le coût complet d'une nuitée d'hiver, l'écart entre le prix du Comptoir et ce coût (négatif si l'hôtel perd), et le résultat de l'hiver à ce prix.",
      champs: () => {
        const k = leComptoirBaisse();
        return [
          { libelle: "Coût complet d'une nuitée d'hiver", attendu: k.coutComplet, calcul: `${eur(L_ESCALE.coutVariableParNuitee)} + ${eur(L_ESCALE.chargesFixesParTrimestre)} ÷ ${qte(k.vendues)} = ${eur(k.coutComplet)}` },
          { libelle: "Écart par nuitée", attendu: k.ecartParNuitee, calcul: `${eur(k.prix)} − ${eur(k.coutComplet)} = ${eur(k.ecartParNuitee)}` },
          { libelle: "Résultat de l'hiver", attendu: k.resultat, calcul: `${qte(k.vendues)} × (${eur(k.prix)} − ${eur(L_ESCALE.coutVariableParNuitee)}) − ${eur(L_ESCALE.chargesFixesParTrimestre)} = ${eur(k.resultat)}` },
        ];
      },
      explication: () => {
        const k = leComptoirBaisse();
        return [`À ${eur(k.prix)}, chaque nuitée d'hiver laisse ${eur(k.ecartParNuitee)} : l'hiver finirait à ${eur(k.resultat)}, même en gardant tous ses clients.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associé",
      question: () => "Que répondez-vous à l'associé ?",
      options: () => {
        const k = leComptoirBaisse();
        const perd = k.resultat < 0;
        return [
          {
            texte: `Ne pas s'aligner : l'hiver perdrait ${eur(-k.resultat)}`,
            juste: perd,
            retour: perd
              ? `Oui : à ${eur(k.prix)}, l'hôtel vend sous son coût complet. Mieux vaut défendre ce que les clients perçoivent, la note et l'accueil, que suivre un concurrent moins bien noté.`
              : "Non : l'hiver resterait bénéficiaire.",
          },
          {
            texte: "S'aligner : un prix plus bas fera venir assez de clients pour couvrir tous les coûts",
            juste: !perd,
            retour: perd ? "Non : même à demande égale, l'hiver perd. L'hôtel n'a pas assez de chambres vides pour qu'un surcroît de clients compense une perte sur chaque nuitée vendue." : "Oui : l'hiver reste bénéficiaire.",
          },
          {
            texte: "S'aligner, puis remonter le prix l'été, quand l'hôtel est plein",
            juste: false,
            retour: "Non : l'été ne se rejoue pas sur l'hiver. Et un prix qui saute d'une saison à l'autre brouille la valeur que les clients perçoivent.",
          },
        ];
      },
    },
  ],
};
