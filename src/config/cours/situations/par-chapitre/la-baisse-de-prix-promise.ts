import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_SEUIL, seuilDuMois } from "../../chapitres/seuil-de-rentabilite";
import { donneesDuMois, seuilDeRentabilite } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES LEVIERS DU SEUIL : LE PRIX, LE LEVIER OPÉRATIONNEL, LA GAMME »
 * (contrôle de gestion, palier 2).
 *
 * Le commercial de NOVA veut baisser le prix de `BAISSE_DU_CAS` et promet `HAUSSE_PROMISE` de ventes
 * en plus. L'élève refait le calcul du chapitre (`seuilDeRentabilite`, au nouveau prix) : la marge
 * sur coût variable unitaire, le nouveau seuil, les ventes qui gardent le résultat de janvier, et
 * les ventes que promet le commercial.
 */

/** LA BAISSE DE PRIX PROPOSÉE (hypothèse du cas) : 5 %. */
export const BAISSE_DU_CAS = 0.05;
/** LA HAUSSE DES VENTES QUE PROMET LE COMMERCIAL (hypothèse du cas) : autant que la baisse de prix. */
export const HAUSSE_PROMISE = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

export function baisseDePrixPromise() {
  const x = seuilDuMois({ code: "nova" });
  const prix = auCentime(x.m.prix * (1 - BAISSE_DU_CAS));
  const b = seuilDeRentabilite(donneesDuMois(x.f, { prix }));
  const ventesPourLeResultat = plafond((x.s.chargesFixes + x.s.resultat) / b.margeUnitaire);
  const ventesPromises = Math.floor(x.m.quantite * (1 + HAUSSE_PROMISE) + 1e-9);
  return { x, prix, marge: b.margeUnitaire, seuil: b.seuilQuantite!, ventesPourLeResultat, ventesPromises, suffit: ventesPromises >= ventesPourLeResultat };
}

export const LA_BAISSE_DE_PRIX_PROMISE: Situation = {
  code: "la-baisse-de-prix-promise",
  parcours: "controle-de-gestion",
  palier: 2,
  blocs: [],
  reprend: ["les-leviers-du-seuil"],
  commanditaire: "Le directeur commercial",
  titre: "Une baisse de prix promise",
  accroche: "Le commercial promet autant de ventes en plus que de prix en moins : le résultat de janvier tiendrait-il ?",
  objectifs: ["Calculer la marge sur coût variable et le seuil à un autre prix", "Retrouver les ventes qui gardent le résultat", "Répondre au commercial, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_SEUIL, pourquoi: "ce cas reprend le mois de janvier de NOVA, celui du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du commercial",
      texte: () => {
        const k = baisseDePrixPromise();
        return [
          `« Baissons l'enceinte de ${pct(BAISSE_DU_CAS)}, à ${eur(k.prix)}. Je vous promets ${pct(HAUSSE_PROMISE)} de ventes en plus : ${qte(k.ventesPromises)} ${k.x.f.unites} au lieu de ${qte(k.x.m.quantite)}. Le résultat de janvier, ${eur(k.x.s.resultat)}, ne bougera pas. » Le directeur commercial`,
          "Pas de cours cette fois : la marge, le seuil et les ventes qui gardent le résultat, vous savez les calculer.",
        ];
      },
      repere: () => "À rendre : la nouvelle marge sur coût variable unitaire, le nouveau seuil, les ventes qui gardent le résultat, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le mois au nouveau prix",
      notions: ["breakeven", "contribution_margin"],
      question: () => "Au nouveau prix, calculez la marge sur coût variable d'une enceinte, le seuil de rentabilité en quantité (arrondi au-dessus), puis les ventes qui gardent le résultat de janvier (arrondies au-dessus).",
      champs: () => {
        const k = baisseDePrixPromise();
        const s = k.x.s;
        return [
          { libelle: "Marge sur coût variable unitaire", attendu: k.marge, calcul: `${eur(k.prix)} − ${eur(s.coutVariableUnitaire)} = ${eur(k.marge)}` },
          { libelle: "Seuil de rentabilité en quantité", attendu: k.seuil, calcul: `${eur(s.chargesFixes)} ÷ ${eur(k.marge)}, arrondi au-dessus : ${qte(k.seuil)}` },
          { libelle: "Ventes qui gardent le résultat", attendu: k.ventesPourLeResultat, calcul: `(${eur(s.chargesFixes)} + ${eur(s.resultat)}) ÷ ${eur(k.marge)}, arrondi au-dessus : ${qte(k.ventesPourLeResultat)}` },
        ];
      },
      explication: () => {
        const k = baisseDePrixPromise();
        return [`Le prix perd ${pct(BAISSE_DU_CAS)}, la marge d'une enceinte bien plus : de ${eur(k.x.s.margeUnitaire)} à ${eur(k.marge)}. Il faut ${qte(k.ventesPourLeResultat)} ${k.x.f.unites} pour garder le résultat.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au commercial",
      question: () => "Que répondez-vous au directeur commercial ?",
      options: () => {
        const k = baisseDePrixPromise();
        return [
          {
            texte: `Non : il faudrait ${qte(k.ventesPourLeResultat)} ventes, pas ${qte(k.ventesPromises)}`,
            juste: !k.suffit,
            retour: `Oui : la baisse se prend sur la marge, pas sur le prix. ${qte(k.ventesPromises)} ${k.x.f.unites} à ${eur(k.marge)} ne paient pas les charges fixes et le résultat de janvier.`,
          },
          {
            texte: "Oui : autant de ventes en plus que de prix en moins, le chiffre d'affaires et donc le résultat ne bougent presque pas",
            juste: false,
            retour: "Non : le chiffre d'affaires bouge peu, mais chaque vente en plus coûte aussi son coût variable. C'est la marge sur coût variable qui fait le résultat.",
          },
          {
            texte: "Oui : le seuil ne dépend que des charges fixes, une baisse de prix ne le déplace pas",
            juste: false,
            retour: `Non : le seuil se divise par la marge unitaire ; il passe de ${qte(k.x.seuilQuantite)} à ${qte(k.seuil)} ${k.x.f.unites}.`,
          },
        ];
      },
    },
  ],
};
