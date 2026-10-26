import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { ASSIETTE_D_APPROVISIONNEMENT, ASSIETTE_DE_DISTRIBUTION } from "../../centres";
import { coutComplet } from "../../chapitres/cout-complet";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT COMPLET ET CENTRES D'ANALYSE » : UN NOUVEAU CLIENT
 * RÉGULIER (contrôle de gestion, palier 3).
 *
 * Un nouveau client apporterait chaque mois des ventes en plus, au même prix, sans rien
 * changer aux charges indirectes : le local, l'équipe et l'équipement suffisent. Le
 * directeur commercial compte préparer ses devis sur le coût de revient d'aujourd'hui.
 * L'élève refait seul le chemin du chapitre au nouveau volume : le coût des unités
 * d'œuvre, la chaîne des coûts, le coût de revient d'une unité, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le volume n'est plus celui du chapitre. Les centres
 * d'analyse, après répartition, sont ceux du mois du cas (`coutComplet`) : leurs charges
 * ne bougent pas avec les ventes.
 */

/**
 * La hausse des ventes qu'apporterait le nouveau client : 20 %, un client régulier qui
 * pèse un cinquième de l'activité du mois, ce qu'une petite entreprise peut servir sans
 * agrandir son local ni embaucher.
 */
export const HAUSSE_DES_VENTES = 0.2;

const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function nouveauClientRegulier(c: Cas) {
  const k = coutComplet(c);
  const quantite = Math.round(k.quantite * (1 + HAUSSE_DES_VENTES));
  const matieres = auCentime(quantite * k.matiereParUnite);
  const autres = auCentime(quantite * k.autresParUnite);
  const chiffreDAffaires = auCentime(quantite * k.prixMoyen);
  const centainesDAchats = matieres / ASSIETTE_D_APPROVISIONNEMENT;
  const centaines = chiffreDAffaires / ASSIETTE_DE_DISTRIBUTION;
  const uo = {
    approvisionnement: auCentime(k.final.approvisionnement / centainesDAchats),
    production: auCentime(k.final.production / quantite),
    distribution: auCentime(k.final.distribution / centaines),
  };
  const coutDAchat = auCentime(matieres + k.final.approvisionnement);
  const coutDeProduction = auCentime(coutDAchat + autres + k.final.production);
  const coutDeRevient = auCentime(coutDeProduction + k.final.distribution);
  const unitaire = auCentime(coutDeRevient / quantite);
  const aujourdhui = auCentime(k.coutDeRevientUnitaire);
  return {
    ...k,
    aujourdhui,
    nouvelle: { quantite, matieres, autres, chiffreDAffaires, centainesDAchats, centaines, uo, coutDAchat, coutDeProduction, coutDeRevient, unitaire },
    baisse: auCentime(aujourdhui - unitaire),
    resultat: auCentime(chiffreDAffaires - coutDeRevient),
    // L'erreur classique : partager tout le coût de revient, charges directes comprises, sur plus d'unités.
    toutPartage: auCentime(aujourdhui / (1 + HAUSSE_DES_VENTES)),
  };
}

export const UN_NOUVEAU_CLIENT_REGULIER: Situation = {
  code: "un-nouveau-client-regulier",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [],
  reprend: ["cout-complet"],
  commanditaire: "Le directeur commercial",
  titre: "Un nouveau client régulier",
  accroche:
    "Un nouveau client apporterait des ventes en plus chaque mois. Le directeur commercial veut chiffrer ses devis sur le coût de revient : lequel ?",
  objectifs: [
    "Calculer le coût des unités d'œuvre à un nouveau volume d'activité",
    "Remonter la chaîne des coûts : coût d'achat, coût de production, coût de revient",
    "Voir comment le coût de revient d'une unité dépend des quantités",
    "Rédiger une réponse chiffrée au directeur commercial",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur commercial",
      texte: (c) => {
        const r = nouveauClientRegulier(c);
        return [
          `« Un nouveau client nous apporterait ${pct(HAUSSE_DES_VENTES)} de ventes en plus chaque mois, au même prix. Le local, l'équipe et l'équipement suffisent : les charges indirectes ne bougeront pas. Pour ses devis, je compte sur le coût de revient d'aujourd'hui, ${eur(r.aujourdhui)} par ${c.unite}. Est-ce le bon chiffre ? »`,
          "Pas de cours cette fois : vous avez les chiffres du mois et les centres déjà répartis, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = nouveauClientRegulier(c);
        return {
          titre: `Les chiffres du mois · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Prix de vente moyen, hors taxes", valeurs: [eur(r.prixMoyen)] },
            { libelle: `Unités vendues dans le mois (${c.unites})`, valeurs: [qte(r.quantite)] },
            { libelle: "Achats consommés par unité", valeurs: [eur(r.matiereParUnite)] },
            { libelle: `Autres charges directes par unité (${c.gestion.autresCoutsVariables})`, valeurs: [eur(r.autresParUnite)] },
            { libelle: `Centre approvisionnement, après répartition (unité d'œuvre : ${eur(ASSIETTE_D_APPROVISIONNEMENT)} d'achats)`, valeurs: [eur(r.final.approvisionnement)] },
            { libelle: "Centre production, après répartition (unité d'œuvre : une unité produite)", valeurs: [eur(r.final.production)] },
            { libelle: `Centre distribution, après répartition (unité d'œuvre : ${eur(ASSIETTE_DE_DISTRIBUTION)} de chiffre d'affaires)`, valeurs: [eur(r.final.distribution)] },
            { libelle: "Hausse des ventes avec le nouveau client", valeurs: [pct(HAUSSE_DES_VENTES)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût des unités d'œuvre au nouveau volume, la chaîne des coûts, le coût de revient d'une unité, et votre réponse.",
    },
    {
      id: "unites-d-oeuvre",
      type: "montants",
      titre: "Les unités d'œuvre au nouveau volume",
      notions: ["full_unit_cost"],
      question: () =>
        `Avec le nouveau client, les ventes, les achats et le chiffre d'affaires montent de ${pct(HAUSSE_DES_VENTES)} ; les centres gardent les mêmes charges. Calculez le nombre d'unités vendues, puis le coût de chaque unité d'œuvre.`,
      champs: (c) => {
        const r = nouveauClientRegulier(c);
        const n = r.nouvelle;
        return [
          { libelle: "Unités vendues avec le nouveau client", attendu: n.quantite, tolerance: 0, calcul: `${qte(r.quantite)} × (1 + ${pct(HAUSSE_DES_VENTES)}) = ${qte(n.quantite)}` },
          {
            libelle: `Approvisionnement : coût pour ${ASSIETTE_D_APPROVISIONNEMENT} € d'achats`,
            attendu: n.uo.approvisionnement,
            tolerance: 0.01,
            calcul: `${eur(r.final.approvisionnement)} ÷ (${qte(n.quantite)} × ${eur(r.matiereParUnite)} ÷ ${ASSIETTE_D_APPROVISIONNEMENT}) = ${eur(r.final.approvisionnement)} ÷ ${qte(auCentime(n.centainesDAchats))} = ${eur(n.uo.approvisionnement)}`,
          },
          {
            libelle: "Production : coût d'une unité",
            attendu: n.uo.production,
            tolerance: 0.01,
            calcul: `${eur(r.final.production)} ÷ ${qte(n.quantite)} = ${eur(n.uo.production)}`,
          },
          {
            libelle: `Distribution : coût pour ${ASSIETTE_DE_DISTRIBUTION} € de chiffre d'affaires`,
            attendu: n.uo.distribution,
            tolerance: 0.01,
            calcul: `${eur(r.final.distribution)} ÷ (${qte(n.quantite)} × ${eur(r.prixMoyen)} ÷ ${ASSIETTE_DE_DISTRIBUTION}) = ${eur(r.final.distribution)} ÷ ${qte(auCentime(n.centaines))} = ${eur(n.uo.distribution)}`,
          },
        ];
      },
      explication: (c) => {
        const r = nouveauClientRegulier(c);
        return [
          `Les charges des centres ne bougent pas, mais elles se partagent sur plus d'activité : l'unité d'œuvre de production passe de ${eur(auCentime(r.uo.production))} à ${eur(r.nouvelle.uo.production)}, et les deux autres baissent dans la même proportion.`,
        ];
      },
    },
    {
      id: "chaine-des-couts",
      type: "montants",
      titre: "La chaîne des coûts au nouveau volume",
      notions: ["full_unit_cost", "fixed_costs"],
      question: () =>
        "Remontez la chaîne des coûts du mois avec le nouveau client : le coût d'achat, le coût de production, le coût de revient, puis le coût de revient d'une unité.",
      champs: (c) => {
        const r = nouveauClientRegulier(c);
        const n = r.nouvelle;
        return [
          {
            libelle: "Coût d'achat",
            attendu: n.coutDAchat,
            tolerance: 0.05,
            calcul: `${qte(n.quantite)} × ${eur(r.matiereParUnite)} + ${eur(r.final.approvisionnement)} = ${eur(n.matieres)} + ${eur(r.final.approvisionnement)} = ${eur(n.coutDAchat)}`,
          },
          {
            libelle: "Coût de production",
            attendu: n.coutDeProduction,
            tolerance: 0.05,
            calcul: `${eur(n.coutDAchat)} + ${qte(n.quantite)} × ${eur(r.autresParUnite)} + ${eur(r.final.production)} = ${eur(n.coutDAchat)} + ${eur(n.autres)} + ${eur(r.final.production)} = ${eur(n.coutDeProduction)}`,
          },
          {
            libelle: "Coût de revient",
            attendu: n.coutDeRevient,
            tolerance: 0.05,
            calcul: `${eur(n.coutDeProduction)} + ${eur(r.final.distribution)} = ${eur(n.coutDeRevient)}`,
          },
          {
            libelle: "Coût de revient d'une unité",
            attendu: n.unitaire,
            tolerance: 0.01,
            calcul: `${eur(n.coutDeRevient)} ÷ ${qte(n.quantite)} = ${eur(n.unitaire)}`,
          },
        ];
      },
      explication: (c) => {
        const r = nouveauClientRegulier(c);
        const n = r.nouvelle;
        return [
          `Le coût de revient du mois monte, de ${eur(r.coutDeRevient)} à ${eur(n.coutDeRevient)}, mais celui d'une unité baisse de ${eur(r.aujourdhui)} à ${eur(n.unitaire)} : les charges directes suivent les ventes, les charges indirectes se partagent sur plus d'unités.`,
          n.unitaire <= r.prixMoyen
            ? `Au prix moyen de ${eur(r.prixMoyen)}, ${c.entreprise} couvrirait son coût complet, avec un résultat analytique de ${eur(r.resultat)} dans le mois.`
            : `Même ainsi, le prix moyen de ${eur(r.prixMoyen)} ne couvrirait pas le coût complet : le mois resterait en perte de ${eur(-r.resultat)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      question: () => "Quelle phrase envoyez-vous au directeur commercial ?",
      options: (c) => {
        const r = nouveauClientRegulier(c);
        const n = r.nouvelle;
        return [
          {
            texte: `Non : avec ce client, il baisse à ${eur(n.unitaire)} par ${c.unite}`,
            juste: true,
            retour: `Oui : ${eur(n.coutDeRevient)} pour ${qte(n.quantite)} ${c.unites} font ${eur(n.unitaire)} par unité, ${eur(r.baisse)} de moins qu'aujourd'hui. Les charges des centres restent les mêmes ; seules les charges directes suivent les ventes.`,
          },
          {
            texte: `Oui : le coût de revient d'une unité ne dépend pas du nombre d'unités vendues, il reste à ${eur(r.aujourdhui)}`,
            juste: false,
            retour: `Non : le coût de revient d'une unité contient une part de charges indirectes, ${eur(auCentime(r.indirectes / r.quantite))} aujourd'hui. Partagées sur ${qte(n.quantite)} ${c.unites} au lieu de ${qte(r.quantite)}, elles pèsent moins sur chacune.`,
          },
          {
            texte: `Non : tout le coût se partage sur ${pct(HAUSSE_DES_VENTES)} d'unités en plus, il baisse donc à ${eur(r.toutPartage)}`,
            juste: false,
            retour: `Non : seules les charges indirectes se partagent. Les achats et les autres charges directes, ${eur(auCentime(r.matiereParUnite + r.autresParUnite))} par unité, se paient pour chaque unité en plus : le coût d'une unité baisse moins, à ${eur(n.unitaire)}.`,
          },
        ];
      },
    },
  ],
};
