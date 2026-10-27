import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { dE, rang } from "../../chapitres/l-offre-et-la-demande";
import {
  LE_PRIX_D_EQUILIBRE,
  calculDeLEcart,
  chercherLePrix,
  constat,
  ecartDemandeOffre,
  optionsDeLaSituation,
  ouEstLePrix,
  tableauDuDepart,
  tableauDuMilieu,
  tableauDuTatonnement,
} from "../../chapitres/le-prix-d-equilibre";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PRIX QUI ÉQUILIBRE LE MARCHÉ » : LE PRIX DE FIN D'ANNÉE
 * (seconde, sciences économiques et sociales, palier 1).
 *
 * Le dirigeant prépare la fin d'année suivante. Au 4e trimestre de l'année du cours, la demande
 * et l'offre ne se valaient pas ; à quel prix se seraient-elles accordées ? L'élève refait seul
 * la recherche du chapitre sur un autre trimestre : la situation au prix de l'année, les essais
 * de l'arène (`chercherLePrix`, clés « le-prix-d-equilibre:t4-… » : seul le prix du 4e trimestre
 * change, la quantité mise en vente reste celle que le bon gestionnaire avait décidée), l'essai au
 * milieu, puis il répond. Le verdict se calcule : selon l'entreprise, le prix qui équilibre la fin
 * d'année est au-dessus ou en dessous du prix pratiqué, et le dernier essai le situe.
 *
 * Le cas est neuf par sa question : le chapitre cherche le prix du 1er trimestre ; la fin
 * d'année a sa propre demande (la saison) et sa propre offre, et donc son propre prix.
 */

/** Le trimestre du cas : le 4e, la fin d'année. */
export const TRIMESTRE_DE_FIN_D_ANNEE = 4;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export const prixDeFinDAnnee = (c: Cas) => chercherLePrix(c.code, TRIMESTRE_DE_FIN_D_ANNEE);

export const LE_PRIX_DE_FIN_D_ANNEE: Situation = {
  code: "le-prix-de-fin-d-annee",
  parcours: "seconde-ses",
  palier: 1,
  blocs: [],
  reprend: [LE_PRIX_D_EQUILIBRE.code],
  commanditaire: "Le dirigeant",
  titre: "Le prix de fin d'année",
  accroche:
    "En fin d'année, la demande et l'offre ne se valaient pas. Le dirigeant veut savoir à quel prix elles se seraient accordées. Lire les essais de l'arène, serrer le prix, et lui répondre.",
  objectifs: [
    "Reconnaître une pénurie ou un excédent",
    "Calculer l'écart entre la demande et l'offre à chaque prix essayé",
    "Situer le prix d'équilibre et répondre au dirigeant",
  ],
  libre: false,
  entreprises: LE_PRIX_D_EQUILIBRE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      tableau: (c) => tableauDuDepart(c, prixDeFinDAnnee(c)),
      texte: (c) => {
        const p = prixDeFinDAnnee(c);
        return [
          `« Au ${rang(p.trimestre)} trimestre, nous avons vendu à ${eur(p.depart.prix)}, et ça ne collait pas : ${constat(p.depart, c)}. L'an prochain, à la même saison, quel prix accorderait la demande et ce que nous mettons en vente ? »`,
          `Pas de cours cette fois. L'arène a rejoué le ${rang(p.trimestre)} trimestre ${dE(c.entreprise)} à d'autres prix : seul le prix change, la quantité mise en vente reste celle de l'année.`,
        ];
      },
      repere: () => "À rendre : la situation au prix de l'année, les écarts aux prix essayés, et le prix que vous conseillez.",
    },
    {
      id: "la-situation",
      type: "choix",
      titre: "La fin d'année, au prix de l'année",
      notions: ["demand_market_share", "stock"],
      question: (c) => {
        const p = prixDeFinDAnnee(c);
        return `Au prix de l'année, ${eur(p.depart.prix)}, dans quelle situation était le marché ${dE(c.entreprise)} au ${rang(p.trimestre)} trimestre ?`;
      },
      options: (c) => optionsDeLaSituation(prixDeFinDAnnee(c).depart, c),
    },
    {
      id: "les-essais",
      type: "montants",
      titre: "Les essais de l'arène",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuTatonnement(c, prixDeFinDAnnee(c)),
      question: (c) => {
        const p = prixDeFinDAnnee(c);
        return `D'après le tableau, calculez l'écart entre la demande reçue et la quantité mise en vente au prix de l'année, puis au dernier prix essayé, ${eur(p.dernier.prix)} (négatif quand l'offre dépasse la demande).`;
      },
      champs: (c) => {
        const p = prixDeFinDAnnee(c);
        return [
          { libelle: `Demande − offre, à ${eur(p.depart.prix)}`, attendu: ecartDemandeOffre(p.depart), calcul: calculDeLEcart(p.depart), tolerance: 0 },
          { libelle: `Demande − offre, à ${eur(p.dernier.prix)}`, attendu: ecartDemandeOffre(p.dernier), calcul: calculDeLEcart(p.dernier), tolerance: 0 },
        ];
      },
      explication: (c) => {
        const p = prixDeFinDAnnee(c);
        return [`L'écart change de signe entre ${eur(p.avant.prix)} et ${eur(p.dernier.prix)} : le prix qui équilibre la fin d'année est entre les deux.`];
      },
    },
    {
      id: "le-milieu",
      type: "montants",
      titre: "L'essai au milieu",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuMilieu(c, prixDeFinDAnnee(c)),
      question: (c) => {
        const p = prixDeFinDAnnee(c);
        return `L'arène a aussi rejoué le trimestre à ${eur(p.milieu.prix)}, au milieu de ${eur(p.bas.prix)} et ${eur(p.haut.prix)}. Calculez l'écart entre la demande reçue et la quantité mise en vente à ce prix.`;
      },
      champs: (c) => {
        const p = prixDeFinDAnnee(c);
        return [{ libelle: `Demande − offre, à ${eur(p.milieu.prix)}`, attendu: ecartDemandeOffre(p.milieu), calcul: calculDeLEcart(p.milieu), tolerance: 0 }];
      },
      explication: (c) => {
        const p = prixDeFinDAnnee(c);
        return [`À ${eur(p.milieu.prix)}, ${constat(p.milieu, c)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["price_elasticity", "demand_market_share"],
      question: () => "Quel prix conseillez-vous au dirigeant pour la prochaine fin d'année, si ce qu'il met en vente ne change pas ?",
      options: (c) => {
        const p = prixDeFinDAnnee(c);
        const garder = p.situation === "equilibre";
        const faits = `à ${eur(p.milieu.prix)}, ${constat(p.milieu, c)}`;
        return [
          {
            texte: `Entre ${eur(p.bas.prix)} et ${eur(p.milieu.prix)}`,
            juste: !garder && p.equilibre === "sous-le-milieu",
            retour: !garder && p.equilibre === "sous-le-milieu" ? `Oui : ${faits}. Le prix qui équilibre est ${ouEstLePrix(p)}.` : `Non : ${faits}.`,
          },
          {
            texte: `Entre ${eur(p.milieu.prix)} et ${eur(p.haut.prix)}`,
            juste: !garder && p.equilibre === "au-dessus-du-milieu",
            retour: !garder && p.equilibre === "au-dessus-du-milieu" ? `Oui : ${faits}. Le prix qui équilibre est ${ouEstLePrix(p)}.` : `Non : ${faits}.`,
          },
          {
            texte: `Tout près de ${eur(p.milieu.prix)}`,
            juste: !garder && p.equilibre === "au-milieu",
            retour: !garder && p.equilibre === "au-milieu" ? `Oui : ${faits}.` : `Non : ${faits}.`,
          },
          {
            texte: `Garder le prix de cette année, ${eur(p.depart.prix)}`,
            juste: garder,
            retour: garder ? `Oui : au prix de l'année, ${constat(p.depart, c)}.` : `Non : au prix de l'année, ${constat(p.depart, c)}.`,
          },
        ];
      },
    },
  ],
};
