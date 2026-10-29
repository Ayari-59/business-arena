import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_CLOTURE, clotureDeNova } from "../../chapitres/la-cloture";
import { interetsDuPlacement } from "../../monde/cloture";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « APRÈS LA CLÔTURE : L'IMPÔT QUI DÉCIDE, LA MÉTHODE QUI DÉPLACE »
 * (comptabilité générale, palier 3).
 *
 * La banque propose à NOVA de placer au compte à terme, à `TAUX_PROPOSE_PAR_LA_BANQUE`, les fonds de
 * l'emprunt, du jour du dépôt au 31 décembre. La présidente demande si l'emprunt devient alors
 * rentable. L'élève refait le calcul du chapitre (`clotureDeNova`, emprunter-pour-placer) à ce
 * taux : les intérêts du placement (année de 360 jours, comme au chapitre), le coût net de
 * l'opération avant impôt, puis après impôt au taux marginal.
 */

/** LE TAUX PROPOSÉ PAR LA BANQUE (hypothèse du cas) : 4 % l'an, au-dessus du taux du chapitre. */
export const TAUX_PROPOSE_PAR_LA_BANQUE = 0.04;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export function compteATermeMieuxRemunere() {
  const x = clotureDeNova({ code: "nova" });
  const produit = interetsDuPlacement(x.f.pret.capital, TAUX_PROPOSE_PAR_LA_BANQUE, x.f.placement.date, x.f.cloture);
  const coutNetAvantImpot = auCentime(x.chargeDeLEmprunt - produit);
  const coutNetApresImpot = auCentime(coutNetAvantImpot * (1 - x.f.impot.tauxNormal));
  return { x, produit, coutNetAvantImpot, coutNetApresImpot, rentable: coutNetApresImpot < 0 };
}

export const LE_COMPTE_A_TERME_MIEUX_REMUNERE: Situation = {
  code: "le-compte-a-terme-mieux-remunere",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["decider-apres-la-cloture"],
  commanditaire: "La présidente",
  titre: "Le compte à terme mieux rémunéré",
  accroche: "La banque offre un meilleur taux au compte à terme : l'emprunt placé devient-il rentable, une fois l'impôt compté ?",
  objectifs: ["Calculer les intérêts d'un placement à un autre taux", "Chiffrer le coût net d'emprunter pour placer, avant et après impôt", "Répondre à la présidente, au taux marginal de l'impôt"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_CLOTURE, pourquoi: "ce cas reprend l'emprunt et le compte à terme du premier exercice de NOVA, ceux du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la présidente",
      texte: () => {
        const k = compteATermeMieuxRemunere();
        return [
          `« La banque nous offrirait ${pct(TAUX_PROPOSE_PAR_LA_BANQUE)} au compte à terme. Si nous y avions placé les ${eur(k.x.f.pret.capital)} de l'emprunt, l'opération aurait-elle rapporté, une fois l'impôt payé ? » La présidente`,
          `Pas de cours cette fois : l'emprunt a coûté ${eur(k.x.chargeDeLEmprunt)} d'intérêts sur l'exercice, et le placement court ${k.x.joursDuPlacement.toLocaleString("fr-FR")} jours, sur une année de 360 jours comme au chapitre.`,
        ];
      },
      repere: () => "À rendre : les intérêts du placement, le coût net avant et après impôt, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "L'emprunt placé au nouveau taux",
      notions: ["loan_schedule"],
      question: () => `À ${pct(TAUX_PROPOSE_PAR_LA_BANQUE)}, calculez les intérêts du placement, le coût net de l'opération avant impôt (positif si elle coûte), puis après impôt au taux marginal.`,
      champs: () => {
        const k = compteATermeMieuxRemunere();
        const f = k.x.f;
        return [
          { libelle: "Intérêts du placement", attendu: k.produit, calcul: `${eur(f.pret.capital)} × ${pct(TAUX_PROPOSE_PAR_LA_BANQUE)} × ${k.x.joursDuPlacement.toLocaleString("fr-FR")} ÷ 360 = ${eur(k.produit)}` },
          { libelle: "Coût net avant impôt", attendu: k.coutNetAvantImpot, calcul: `${eur(k.x.chargeDeLEmprunt)} − ${eur(k.produit)} = ${eur(k.coutNetAvantImpot)}` },
          { libelle: "Coût net après impôt", attendu: k.coutNetApresImpot, calcul: `${eur(k.coutNetAvantImpot)} × (1 − ${pct(f.impot.tauxNormal)}) = ${eur(k.coutNetApresImpot)}` },
        ];
      },
      explication: () => {
        const k = compteATermeMieuxRemunere();
        return [`Le placement rapporte ${eur(k.produit)}, l'emprunt coûte ${eur(k.x.chargeDeLEmprunt)} : l'impôt prend sa part de l'écart, au taux marginal, mais ne le comble pas.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la présidente",
      question: () => "Que répondez-vous à la présidente ?",
      options: () => {
        const k = compteATermeMieuxRemunere();
        return [
          {
            texte: `Non : il coûte encore ${eur(k.coutNetApresImpot)} après impôt`,
            juste: !k.rentable,
            retour: `Oui : ${eur(k.coutNetAvantImpot)} de coût avant impôt, dont l'impôt ne rend que le quart, au taux marginal de ${pct(k.x.f.impot.tauxNormal)}. Il faudrait un taux d'au moins ${pct(k.x.tauxQuiPaieLEmprunt / 10_000)} pour que le placement paie l'emprunt.`,
          },
          {
            texte: "Oui : l'impôt sur les intérêts de l'emprunt rend l'opération gratuite, quel que soit le taux du placement",
            juste: false,
            retour: `Non : l'impôt ne rend que le quart du coût net, au taux marginal ; il reste ${eur(k.coutNetApresImpot)} à la charge de NOVA.`,
          },
          {
            texte: `Oui : à ${pct(TAUX_PROPOSE_PAR_LA_BANQUE)}, le placement rapporte plus que l'impôt moyen de l'exercice ne coûte`,
            juste: false,
            retour: "Non : on compare ce que rapporte le placement à ce que coûte l'emprunt, puis on applique le taux marginal ; le taux moyen de l'impôt ne décide de rien ici.",
          },
        ];
      },
    },
  ],
};
