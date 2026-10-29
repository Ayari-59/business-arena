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
 * Le dirigeant de NOVA prépare la fin d'année. Au 4e trimestre, la demande grandit avec Noël, et la
 * ligne monte tout ce qu'elle peut. À quel prix la demande et l'offre s'accorderaient-elles ?
 * L'élève refait seul la recherche du chapitre sur ce trimestre : la situation au prix de 59 €, le
 * tâtonnement par pas de 10 %, l'essai au milieu, puis il répond. Le verdict se calcule.
 *
 * HYPOTHÈSES DU CAS (monde/mercatique-de-nova.ts) : au 4e trimestre, la demande est celle du premier,
 * multipliée par ce que l'année N a livré de plus (6 940 enceintes contre 4 778) ; NOVA met en vente
 * ce que sa ligne peut monter, 7 000 enceintes.
 *
 * Le cas est neuf par sa question : le chapitre cherche le prix du 1er trimestre ; la fin d'année a sa
 * propre demande (la saison) et sa propre offre, et donc son propre prix.
 */

/** Le trimestre du cas : le 4e, la fin d'année. */
export const TRIMESTRE_DE_FIN_D_ANNEE = 4 as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");

export const prixDeFinDAnnee = (c: Cas) => chercherLePrix(c, TRIMESTRE_DE_FIN_D_ANNEE);

export const LE_PRIX_DE_FIN_D_ANNEE: Situation = {
  code: "le-prix-de-fin-d-annee",
  parcours: "seconde-ses",
  palier: 1,
  blocs: [],
  reprend: [LE_PRIX_D_EQUILIBRE.code],
  commanditaire: "Le dirigeant",
  titre: "Le prix de fin d'année",
  accroche:
    "En fin d'année, la demande et l'offre ne se valent pas. Le dirigeant veut savoir à quel prix elles s'accorderaient. Lire les essais, serrer le prix, et lui répondre.",
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
          `« Au ${rang(p.trimestre)} trimestre, si nous vendons à ${eur(p.depart.prix)}, ça ne collera pas : ${constat(p.depart, c)}. Quel prix accorderait la demande et ce que nous mettons en vente ? »`,
          `Pas de cours cette fois. À Noël, la demande ${dE(c.entreprise)} grandit avec la saison, et sa ligne monte tout ce qu'elle peut, ${qte(p.depart.offre)} ${c.unites}. Le tableau essaie d'autres prix : seul le prix change, la quantité mise en vente reste la même.`,
        ];
      },
      repere: () => "À rendre : la situation au prix de départ, les écarts aux prix essayés, et le prix que vous conseillez.",
    },
    {
      id: "la-situation",
      type: "choix",
      titre: "La fin d'année, au prix de départ",
      notions: ["demand_market_share", "stock"],
      question: (c) => {
        const p = prixDeFinDAnnee(c);
        return `Au prix de départ, ${eur(p.depart.prix)}, dans quelle situation est le marché ${dE(c.entreprise)} au ${rang(p.trimestre)} trimestre ?`;
      },
      options: (c) => optionsDeLaSituation(prixDeFinDAnnee(c).depart, c),
    },
    {
      id: "les-essais",
      type: "montants",
      titre: "Les essais, prix après prix",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuTatonnement(c, prixDeFinDAnnee(c)),
      question: (c) => {
        const p = prixDeFinDAnnee(c);
        return `D'après le tableau, calculez l'écart entre la demande reçue et la quantité mise en vente au prix de départ, puis au dernier prix essayé, ${eur(p.dernier.prix)} (négatif quand l'offre dépasse la demande).`;
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
        return `Le tableau essaie aussi le trimestre à ${eur(p.milieu.prix)}, au milieu de ${eur(p.bas.prix)} et ${eur(p.haut.prix)}. Calculez l'écart entre la demande reçue et la quantité mise en vente à ce prix.`;
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
            texte: `Garder ${eur(p.depart.prix)}`,
            juste: garder,
            retour: garder ? `Oui : au prix de départ, ${constat(p.depart, c)}.` : `Non : au prix de départ, ${constat(p.depart, c)}.`,
          },
        ];
      },
    },
  ],
};
