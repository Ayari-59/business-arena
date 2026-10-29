import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  NOUVELLES_CARTES_PAR_MOIS,
  TAUX_DE_DEPART_PAR_MOIS,
  TAUX_ESSAYES,
  anneeDuFichier,
  carteDeFidelite,
  moisDuFichier,
  tauxQuiGardeLeFichier,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VENTE } from "./le-panier-moyen";

/**
 * CHAPITRE : LE CLIENT QUI REVIENT ET LE CLIENT QUI PART (Bac pro Métiers du commerce et de la
 * vente, terminale, palier 2).
 *
 * La vendeuse d'une boutique voit ses clientes fidèles revenir chaque mois, ou partir. Le chapitre
 * compte celles qui reviennent et celles qui partent, ce que vaut une cliente gardée toute
 * l'année (sa marge), ce que coûte une cliente qui part. Puis l'expérience : un curseur (combien de
 * nouvelles cartes par mois pour que le fichier ne baisse pas ?) et un laboratoire (le plus haut
 * taux de départ que le fichier supporte sur l'année).
 *
 * Il ne double pas « La valeur d'un client » (BTS NDRC, palier 3 : taux d'attrition, valeur vie
 * client, coût d'acquisition, portefeuille d'équilibre) : ici, des soustractions et des
 * multiplications, mois par mois.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la clientèle des clientes fidèles de MAILLE & CO en
 * janvier (monde/maille-et-co.ts : 340 passages en caisse, leurs articles référence par référence,
 * la marge de leurs achats). Les calculs sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : une cliente fidèle passe en caisse une fois par mois
 * (340 passages font 340 clientes) ; 5 % des clientes de la carte ne reviennent pas le mois
 * suivant ; 15 passants prennent la carte chaque mois ; la marge d'un passage est celle de janvier.
 *
 * CE QUI A CHANGÉ. Le chapitre comptait les adhérents de la salle de sport de l'arène (2 200 au
 * deuxième trimestre, 558 partis, 74,6 % qui reviennent, 376,01 € de marge sur l'année) et
 * rejouait l'année avec des travaux. Il compte maintenant les clientes de la carte de MAILLE & CO :
 * 340 en janvier, 17 qui partent en février, 95 % qui reviennent, 693,12 € de marge pour une
 * cliente gardée toute l'année.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** La carte de fidélité et son mois de février. */
export function clientesDeLaCarte(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const carte = carteDeFidelite(f);
  const fevrier = moisDuFichier(carte.clientes);
  return {
    ...carte,
    fevrier,
    reviennent: auDixieme((fevrier.revenues / fevrier.debut) * 100),
    partDesRevenues: auDixieme((fevrier.revenues / fevrier.fin) * 100),
  };
}

export function tableauDeLaCarte(c: Cas): TableauDeDonnees {
  const k = clientesDeLaCarte(c);
  return {
    titre: `Les clientes fidèles ${dE(c.entreprise)} en janvier`,
    colonnes: ["Janvier"],
    lignes: [
      { libelle: "Clientes de la carte (un passage par mois)", valeurs: [qte(k.clientes)] },
      { libelle: "Articles achetés", valeurs: [qte(k.articles)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(k.chiffreDAffaires)] },
      { libelle: "Coût des articles vendus", valeurs: [eur(k.coutDesVentes)] },
    ],
  };
}

export const LE_CLIENT_QUI_REVIENT: Chapitre = {
  code: "le-client-qui-revient",
  parcours: "vente",
  palier: 2,
  blocs: ["Bac pro MCV Bloc 3 · Fidéliser la clientèle et développer la relation client"],
  titre: "Le client qui revient et le client qui part",
  accroche: "Chaque mois, des clientes fidèles reviennent, d'autres ne reviennent plus. Combien reviennent, que rapporte une cliente gardée toute l'année, et que coûte une cliente qu'on perd ?",
  objectifs: [
    "Compter les clients qui reviennent et ceux qui partent",
    "Dire quelle part des clients revient",
    "Calculer la marge d'un client gardé toute l'année",
    "Calculer ce que coûte un client qui part",
    "Voir combien de nouveaux clients il faut pour remplacer ceux qui partent",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VENTE,
    pourquoi: "ce chapitre compte les clientes de la carte de fidélité de la boutique du cours, MAILLE & CO, mois par mois.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des clientes qui reviennent, d'autres qui partent",
      notions: ["churn_rate", "customer_portfolio"],
      tableau: tableauDeLaCarte,
      texte: (c) => {
        const k = clientesDeLaCarte(c);
        return [
          `${c.entreprise} a une carte de fidélité. Dans le cas du cours, une cliente fidèle passe en caisse une fois par mois : les ${qte(k.tickets)} passages de janvier sont ${qte(k.clientes)} clientes.`,
          `Chaque mois, certaines ne reviennent pas : elles déménagent, achètent ailleurs, oublient la boutique. Le cours suppose que ${pct(TAUX_DE_DEPART_PAR_MOIS * 100)} des clientes de la carte ne reviennent pas le mois suivant, et que ${qte(NOUVELLES_CARTES_PAR_MOIS)} passants prennent la carte chaque mois.`,
        ];
      },
      repere: () => "Clientes à la fin du mois = clientes du début − clientes parties + nouvelles clientes.",
    },
    {
      id: "partis",
      objectifs: [0],
      type: "montants",
      titre: "Combien reviennent, combien partent",
      notions: ["churn_rate", "customer_portfolio"],
      question: (c) => {
        const k = clientesDeLaCarte(c);
        return `Pour février, calculez les clientes qui ne reviennent pas (${pct(TAUX_DE_DEPART_PAR_MOIS * 100)} des ${qte(k.clientes)} de janvier, à l'unité), celles qui reviennent, puis les clientes de la carte à la fin de février, avec les ${qte(k.fevrier.nouvelles)} nouvelles.`;
      },
      champs: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return [
          { libelle: "Clientes parties", attendu: k.parties, calcul: `${qte(k.debut)} × ${pct(TAUX_DE_DEPART_PAR_MOIS * 100)} = ${qte(k.parties)}` },
          { libelle: "Clientes revenues", attendu: k.revenues, calcul: `${qte(k.debut)} − ${qte(k.parties)} = ${qte(k.revenues)}` },
          { libelle: "Clientes de la carte fin février", attendu: k.fin, calcul: `${qte(k.revenues)} + ${qte(k.nouvelles)} = ${qte(k.fin)}` },
        ];
      },
      explication: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return [
          k.fin < k.debut
            ? `Le fichier passe de ${qte(k.debut)} à ${qte(k.fin)} clientes : les ${qte(k.nouvelles)} nouvelles ne remplacent pas les ${qte(k.parties)} parties.`
            : `Le fichier passe de ${qte(k.debut)} à ${qte(k.fin)} clientes : les nouvelles remplacent les parties.`,
        ];
      },
    },
    {
      id: "poids-des-gardes",
      objectifs: [1],
      type: "montants",
      titre: "Le poids des clientes qui reviennent",
      notions: ["churn_rate"],
      question: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return `Calculez la part des clientes de janvier qui reviennent en février (${qte(k.revenues)} ÷ ${qte(k.debut)} × 100), puis la part des clientes revenues dans le fichier de fin février (${qte(k.revenues)} ÷ ${qte(k.fin)} × 100), au dixième.`;
      },
      champs: (c) => {
        const k = clientesDeLaCarte(c);
        return [
          { libelle: "Part qui revient (%)", attendu: k.reviennent, calcul: `${qte(k.fevrier.revenues)} ÷ ${qte(k.fevrier.debut)} × 100 = ${pct(k.reviennent)}`, tolerance: 0.1 },
          { libelle: "Part des revenues dans le fichier (%)", attendu: k.partDesRevenues, calcul: `${qte(k.fevrier.revenues)} ÷ ${qte(k.fevrier.fin)} × 100 = ${pct(k.partDesRevenues)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = clientesDeLaCarte(c);
        return [`${pct(k.reviennent)} des clientes reviennent, et elles font ${pct(k.partDesRevenues)} du fichier de fin février : la boutique vit d'abord de celles qu'elle garde.`];
      },
    },
    {
      id: "garde-toute-l-annee",
      objectifs: [2],
      type: "montants",
      titre: "Une cliente gardée toute l'année",
      notions: ["contribution_margin", "customer_lifetime_value"],
      question: (c) => {
        const k = clientesDeLaCarte(c);
        return `En janvier, les achats des clientes fidèles ont laissé ${eur(k.marge)} de marge (${eur(k.chiffreDAffaires)} de chiffre d'affaires, moins ${eur(k.coutDesVentes)} de coût des articles), pour ${qte(k.tickets)} passages. Calculez la marge d'un passage, au centime, puis la marge d'une cliente gardée toute l'année, qui passe chaque mois.`;
      },
      champs: (c) => {
        const k = clientesDeLaCarte(c);
        return [
          { libelle: "Marge d'un passage", attendu: k.margeDUnPassage, calcul: `${eur(k.marge)} ÷ ${qte(k.tickets)} = ${eur(k.margeDUnPassage)}` },
          { libelle: "Marge d'une cliente sur l'année", attendu: k.margeDeLAnnee, calcul: `12 × ${eur(k.margeDUnMois)} = ${eur(k.margeDeLAnnee)}` },
        ];
      },
      explication: (c) => [`Une cliente gardée toute l'année laisse ${eur(clientesDeLaCarte(c).margeDeLAnnee)} de marge à la boutique : bien plus que son panier d'un jour.`],
    },
    {
      id: "parti-apres-le-premier",
      objectifs: [3],
      type: "montants",
      titre: "Une cliente qui part après janvier",
      notions: ["churn_rate", "customer_lifetime_value"],
      question: () => "Une cliente passe en janvier, puis ne revient plus. Calculez la marge que la boutique ne fera pas avec elle, sur les mois qui restent dans l'année.",
      champs: (c) => {
        const k = clientesDeLaCarte(c);
        return [{ libelle: "Marge perdue avec une cliente partie", attendu: k.margePerdueSiEllePart, calcul: `11 × ${eur(k.margeDUnMois)} = ${eur(k.margePerdueSiEllePart)}` }];
      },
      explication: (c) => {
        const k = clientesDeLaCarte(c);
        const perte = k.fevrier.parties * k.margePerdueSiEllePart;
        return [
          `Une cliente qui part coûte ${eur(k.margePerdueSiEllePart)} de marge sur l'année. Les ${qte(k.fevrier.parties)} parties de février, c'est ${eur(perte)} de marge en moins d'ici décembre, si personne ne les remplace.`,
        ];
      },
    },
    {
      id: "ce-que-dit-le-fichier",
      objectifs: [4],
      type: "choix",
      titre: "Ce que dit le fichier",
      notions: ["churn_rate", "customer_portfolio"],
      question: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return `En février, ${qte(k.parties)} clientes partent et ${qte(k.nouvelles)} prennent la carte. Que dire ?`;
      },
      options: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        const baisse = k.parties > k.nouvelles;
        return [
          {
            texte: "Le fichier baisse : les départs dépassent les nouvelles cartes",
            juste: baisse,
            retour: baisse ? `Oui : ${qte(k.debut)} clientes en janvier, ${qte(k.fin)} fin février. Il faut garder les clientes, ou en gagner davantage.` : `Non : ${qte(k.nouvelles)} nouvelles pour ${qte(k.parties)} parties, le fichier ne baisse pas.`,
          },
          {
            texte: "Le fichier tient : les nouvelles cartes remplacent les départs",
            juste: !baisse,
            retour: !baisse ? `Oui : ${qte(k.nouvelles)} nouvelles pour ${qte(k.parties)} parties.` : `Non : ${qte(k.nouvelles)} nouvelles ne remplacent pas ${qte(k.parties)} parties.`,
          },
          {
            texte: "Les départs ne comptent pas : seules les nouvelles cartes font vendre",
            juste: false,
            retour: `Non : chaque cliente qui part emporte ${eur(clientesDeLaCarte(c).margePerdueSiEllePart)} de marge sur l'année. Les garder compte autant que d'en gagner.`,
          },
        ];
      },
    },
    {
      id: "remplacer-les-departs",
      objectifs: [4],
      type: "curseur",
      titre: "Remplacer les départs",
      notions: ["customer_portfolio", "churn_rate"],
      question: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return `En février, ${qte(k.parties)} clientes ne reviennent pas. Faites varier les nouvelles cartes du mois : une droite donne les clientes de fin février, l'autre celles de janvier. Placez le curseur sur le plus petit nombre de nouvelles cartes qui garde le fichier au moins à son niveau de janvier, puis validez.`;
      },
      grandeur: () => ({ libelle: "Nouvelles cartes dans le mois", unite: "clientes" }),
      cible: (c) => ({ attendu: clientesDeLaCarte(c).fevrier.parties, min: 0, max: 40 }),
      zones: ["Le fichier se maintient", "Le fichier baisse"],
      rates: () => ({
        dessous: "Avec si peu de nouvelles cartes, le fichier baisse : les départs ne sont pas remplacés.",
        dessus: "Le fichier tient, mais moins de nouvelles cartes suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les nouvelles cartes",
      lecture: (c, q) => {
        const k = clientesDeLaCarte(c);
        const m = moisDuFichier(k.clientes, TAUX_DE_DEPART_PAR_MOIS, q);
        return [
          { libelle: "Clientes parties", montant: m.parties },
          { libelle: "Nouvelles cartes", montant: q },
          { libelle: "Clientes de fin février", montant: m.fin, fort: true },
          { libelle: "Clientes de janvier", montant: k.clientes },
        ];
      },
      droites: (c) => {
        const k = clientesDeLaCarte(c);
        return { produit: (q) => moisDuFichier(k.clientes, TAUX_DE_DEPART_PAR_MOIS, q).fin, cout: () => k.clientes, libelles: ["Clientes de fin février", "Clientes de janvier"] };
      },
      explication: (c) => {
        const k = clientesDeLaCarte(c).fevrier;
        return [
          `Il faut ${qte(k.parties)} nouvelles cartes, autant que de départs, pour que le fichier ne baisse pas. Avec ${qte(k.nouvelles)}, il perd ${qte(k.parties - k.nouvelles)} clientes chaque mois.`,
          "Pour garder un fichier, on peut gagner plus de clientes, ou en perdre moins : les deux leviers comptent.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-fidelite",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la fidélité",
      notions: ["churn_rate", "customer_portfolio"],
      question: (c) => {
        const k = clientesDeLaCarte(c);
        return `La boutique veut finir l'année avec au moins ses ${qte(k.clientes)} clientes de janvier, en gardant ${qte(NOUVELLES_CARTES_PAR_MOIS)} nouvelles cartes par mois. Faites varier la part des clientes qui ne reviennent pas chaque mois (un meilleur accueil, une relance, une invitation la fait baisser) : le fichier se refait mois par mois jusqu'en décembre. Relevez le défi.`;
      },
      leviers: () => [{ code: "taux", libelle: "Clientes qui ne reviennent pas chaque mois", unite: "%", ...TAUX_ESSAYES, depart: Math.round(TAUX_DE_DEPART_PAR_MOIS * 100) }],
      lecture: (c, p) => {
        const f = ficheDe(c);
        const a = anneeDuFichier(f, p.taux! / 100);
        const depart = anneeDuFichier(f);
        return [
          { libelle: "Clientes parties en février", montant: a.fevrier.parties, unite: "clientes", reference: depart.fevrier.parties },
          { libelle: "Clientes de la carte fin décembre", montant: a.finDeDecembre, unite: "clientes", reference: depart.finDeDecembre, fort: true },
          { libelle: "Clientes de janvier", montant: a.depart, unite: "clientes" },
        ];
      },
      graphique: (c) => ({
        levier: "taux",
        courbes: [
          { libelle: "Clientes fin décembre", valeur: (p) => anneeDuFichier(ficheDe(c), p.taux! / 100).finDeDecembre },
          { libelle: "Clientes de janvier", valeur: () => carteDeFidelite(ficheDe(c)).clientes },
        ],
        unite: "clientes",
      }),
      defi: (c) => {
        const juste = tauxQuiGardeLeFichier(ficheDe(c));
        return {
          consigne: "Trouvez la plus haute part de départs par mois qui laisse encore au moins autant de clientes fin décembre qu'en janvier.",
          atteint: (p) => p.taux === juste,
          indice: (p) => {
            const a = anneeDuFichier(ficheDe(c), p.taux! / 100);
            return a.finDeDecembre < a.depart
              ? `Fin décembre, il ne reste que ${qte(a.finDeDecembre)} clientes, pour ${qte(a.depart)} en janvier : il faut perdre moins de clientes.`
              : `Le fichier tient (${qte(a.finDeDecembre)} clientes fin décembre). La boutique pourrait-elle supporter un peu plus de départs ? Cherchez la plus haute part.`;
          },
          solution: { taux: juste },
        };
      },
      explication: (c, p) => {
        const f = ficheDe(c);
        const a = anneeDuFichier(f, p.taux! / 100);
        const plus = anneeDuFichier(f, (p.taux! + 1) / 100);
        const depart = anneeDuFichier(f);
        return [
          `Défi relevé : à ${pct(p.taux!)} de départs par mois, la carte compte ${qte(a.finDeDecembre)} clientes fin décembre. À ${pct(p.taux! + 1)}, elle n'en aurait plus que ${qte(plus.finDeDecembre)}.`,
          `Aujourd'hui, à ${pct(TAUX_DE_DEPART_PAR_MOIS * 100)}, la carte finit l'année avec ${qte(depart.finDeDecembre)} clientes : chaque point de départs en moins se compte en clientes gardées. Fidéliser coûte souvent moins cher que conquérir.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["churn_rate", "customer_lifetime_value"],
      texte: (c) => {
        const k = clientesDeLaCarte(c);
        return [
          `Chez ${c.entreprise}, ${pct(k.reviennent)} des clientes de la carte reviennent d'un mois à l'autre. Une cliente gardée toute l'année laisse ${eur(k.margeDeLAnnee)} de marge ; une cliente qui part après janvier en emporte ${eur(k.margePerdueSiEllePart)}.`,
          "Un fichier de clients se garde comme un stock : ce qui part doit être remplacé. Dans l'arène, les chiffres de votre entreprise seront différents : le compte sera le même.",
        ];
      },
      repere: () => "Clients à la fin = clients du début − partis + nouveaux. Marge d'un client gardé = marge d'une visite × visites de l'année.",
    },
  ],
};
