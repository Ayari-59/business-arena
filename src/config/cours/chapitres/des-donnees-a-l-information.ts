import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { type Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_GESTION,
  PART_STABLE,
  commandePourGarderLaPart,
  donneesALInformation as donneesDuMonde,
  tableDesVentes as lignesDeLaTable,
  type LigneDeVentes,
} from "../monde/gestion-et-information";
import { DELAI_CONVENU_DE_CAMPUSTECH, RETARD_DE_CAMPUSTECH } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DES DONNÉES À L'INFORMATION, TRIER, REGROUPER, CALCULER (Bac STMG, systèmes
 * d'information de gestion, palier 1).
 *
 * Une table de la base de données des ventes : une ligne par mois et par clientèle, avec les ventes
 * et le chiffre d'affaires. L'élève y distingue la donnée (une case de la table) de l'information
 * (ce qu'on en tire), puis fait à la main ce que fait une requête : regrouper les lignes par
 * clientèle et additionner, choisir le critère et le regroupement qui répondent à une question,
 * filtrer les lignes d'un trimestre et calculer une part. La question de gestion : NOVA dépend-elle
 * moins de CampusTech, son client professionnel qui paie en retard, d'un trimestre à l'autre ? Un
 * curseur (ce que CampusTech devrait commander pour garder sa part) et un laboratoire (filtrer un
 * mois, trouver celui où CampusTech pèse le moins).
 *
 * Il ne double pas « Le marché et la part de marché » (mercatique) : ici, la part se calcule dans le
 * chiffre d'affaires de l'entreprise, et l'objet est le traitement des données.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : les ventes du semestre, clientèle par
 * clientèle (nova-gestion.ts, lues par monde/gestion-et-information.ts), au prix de 59 € hors
 * taxes. La règle de lecture PART_STABLE est là-bas.
 *
 * CE QUI A CHANGÉ. La table comptait une ligne par trimestre et par enseigne de l'année de l'arène,
 * dans neuf entreprises. Elle compte maintenant douze lignes : six mois, deux clientèles. La part de
 * CampusTech passe de 20,1 % du chiffre d'affaires au premier trimestre à 15,8 % au deuxième.
 */

export { PART_STABLE };

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const points = (t: number) => `${Math.abs(t).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} point${Math.abs(t) >= 2 ? "s" : ""}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const POURQUOI_LES_DONNEES = "ce chapitre lit la table des ventes de NOVA, mois par mois et clientèle par clientèle, sur le semestre que le cours tient.";

/** Le trimestre écrit court, en chiffres : « 1er », « 2e ». */
export const ordinal = (t: number) => (t === 1 ? "1er" : `${t}e`);

export type { LigneDeVentes };

/** La table des ventes du semestre : une ligne par mois et par clientèle. */
export const extraitDesVentes = (_c?: Cas): LigneDeVentes[] => lignesDeLaTable(FICHE_DE_GESTION);

/** Ce que les données donnent, une fois triées, regroupées et calculées. */
export const donneesALInformation = (_c?: Cas) => donneesDuMonde(FICHE_DE_GESTION);

export function tableDesVentes(c: Cas): TableauDeDonnees {
  return {
    titre: "Extrait de la table des ventes : une ligne par mois et par clientèle",
    colonnes: ["Mois", "Clientèle", `Ventes (${c.unites})`, "Chiffre d'affaires"],
    lignes: extraitDesVentes(c).map((l) => ({ libelle: `Ligne ${l.numero}`, valeurs: [majuscule(l.nomDuMois), l.nomDeLaClientele, qte(l.ventes), eur(l.chiffreDAffaires)] })),
  };
}

const CAMPUSTECH = () => FICHE_DE_GESTION.semestre.clienteles.find((x) => x.code === "campustech")!;

export const DES_DONNEES_A_L_INFORMATION: Chapitre = {
  code: "des-donnees-a-l-information",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Des données à l'information : trier, regrouper, calculer",
  accroche:
    "Une table de la base de données des ventes, une ligne par mois et par clientèle : des données brutes. Les filtrer, les regrouper et calculer, comme le fait une requête, pour en tirer une information qui aide à décider.",
  objectifs: [
    "Distinguer une donnée d'une information",
    "Regrouper des lignes et calculer une somme, une moyenne, une part",
    "Choisir le critère et le regroupement d'une requête",
    "Dire ce que l'information obtenue permet de décider",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LES_DONNEES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un extrait de la base de données",
      notions: ["dashboard", "revenue"],
      tableau: tableDesVentes,
      texte: (c) => {
        const k = donneesALInformation(c);
        return [
          `Le système d'information ${dE(c.entreprise)} enregistre chaque mois ses ventes, clientèle par clientèle : les particuliers, qui commandent en ligne et paient à la commande, et ${CAMPUSTECH().nom}, un client professionnel qui paie à ${qte(CAMPUSTECH().delai)} jours, en retard de ${qte(RETARD_DE_CAMPUSTECH)} jours sur les ${qte(DELAI_CONVENU_DE_CAMPUSTECH)} convenus. La table des ventes en garde une ligne par mois et par clientèle : ${qte(k.lignes.length)} lignes pour le semestre.`,
          `Chaque case est une donnée : un fait brut, enregistré tel quel. Une donnée seule ne répond à aucune question. La direction veut savoir si ${c.entreprise} dépend moins de ${CAMPUSTECH().nom} au fil du semestre : pour le dire, il faut trier les lignes, les regrouper et calculer.`,
        ];
      },
      repere: () => "Une donnée est un fait brut enregistré. Une information est une donnée traitée (triée, regroupée, calculée) qui répond à une question et aide à décider.",
    },
    {
      id: "donnee-ou-information",
      type: "tri",
      titre: "Donnée ou information ?",
      notions: ["dashboard"],
      question: () =>
        "Rangez chaque montant : une donnée se lit telle quelle dans une case de la table ; une information s'obtient en traitant plusieurs lignes (les regrouper, les additionner, en faire la moyenne).",
      categories: [
        { code: "donnee", libelle: "Donnée" },
        { code: "information", libelle: "Information" },
      ],
      elements: () => {
        const k = donneesALInformation();
        const p = k.lignes[0]!;
        const d = k.lignes.at(-1)!;
        const ct = k.parClientele.find((x) => x.code === "campustech")!;
        return [
          { libelle: `Chiffre d'affaires des ${p.nomDeLaClientele.toLowerCase()} en ${p.nomDuMois}`, montant: p.chiffreDAffaires, categorie: "donnee", pourquoi: `Une case de la ligne ${p.numero}, lue telle quelle.` },
          { libelle: `Chiffre d'affaires de ${ct.nom} sur le semestre`, montant: ct.chiffre, categorie: "information", pourquoi: `Les ${qte(ct.lignes)} lignes de ${ct.nom}, regroupées et additionnées.` },
          { libelle: `Chiffre d'affaires de ${d.nomDeLaClientele} en ${d.nomDuMois}`, montant: d.chiffreDAffaires, categorie: "donnee", pourquoi: `Une case de la ligne ${d.numero}, la dernière de l'extrait.` },
          { libelle: `Chiffre d'affaires moyen de ${ct.nom} par mois`, montant: auCentime(ct.chiffre / ct.lignes), categorie: "information", pourquoi: `Le chiffre d'affaires du semestre, ${eur(ct.chiffre)}, divisé par ${qte(ct.lignes)} mois : une moyenne.` },
          { libelle: "Chiffre d'affaires de toutes les clientèles au 1er trimestre", montant: k.premier.total, categorie: "information", pourquoi: "Les lignes de janvier, février et mars, filtrées puis additionnées." },
        ];
      },
      explication: () => [
        "Une donnée ne change pas selon la question : elle est enregistrée une fois. Une information dépend de la question posée, et du traitement choisi pour y répondre. Le même extrait donne autant d'informations qu'on lui pose de questions.",
      ],
    },
    {
      id: "regrouper",
      type: "montants",
      titre: "Regrouper les lignes par clientèle",
      notions: ["revenue", "dashboard"],
      tableau: tableDesVentes,
      question: () => "Regroupez les lignes par clientèle et additionnez : le chiffre d'affaires du semestre de chaque clientèle, à l'euro.",
      champs: () => {
        const k = donneesALInformation();
        return k.parClientele.map((g) => ({
          libelle: `Chiffre d'affaires du semestre, ${g.nom}`,
          attendu: g.chiffre,
          calcul: `${k.lignes.filter((l) => l.clientele === g.code).map((l) => eur(l.chiffreDAffaires)).join(" + ")} = ${eur(g.chiffre)}`,
        }));
      },
      explication: () => {
        const k = donneesALInformation();
        return [
          `Les ${qte(k.lignes.length)} lignes de l'extrait sont devenues ${qte(k.parClientele.length)} totaux, un par clientèle : c'est un regroupement.`,
          "Une requête le fait en une phrase. En langage de requête (SQL), elle s'écrit : SELECT Clientele, SUM(ChiffreAffaires) FROM Ventes GROUP BY Clientele. SUM additionne ; GROUP BY dit sur quelle colonne regrouper.",
        ];
      },
    },
    {
      id: "la-requete",
      type: "choix",
      titre: "Le critère et le regroupement",
      notions: ["dashboard"],
      question: () => "La direction veut connaître, mois par mois, le chiffre d'affaires des particuliers. Quelle requête lui répond ?",
      options: () => {
        const k = donneesALInformation();
        const janvier = k.lignes.find((l) => l.mois === 1 && l.clientele === "particuliers")!;
        const resultat = `En janvier, la requête donne ${eur(janvier.chiffreDAffaires)}.`;
        return [
          { texte: "Garder les lignes des particuliers, regrouper par mois, additionner", juste: true, retour: `Oui : le critère écarte les lignes de ${CAMPUSTECH().nom}, le regroupement fait un total par mois, la somme additionne. ${resultat}` },
          { texte: "Garder les lignes des particuliers, regrouper par clientèle, additionner", juste: false, retour: `Non : regrouper par clientèle donne le total du semestre des particuliers, pas celui de chaque mois. ${resultat}` },
          { texte: "Garder toutes les lignes, regrouper par mois, additionner", juste: false, retour: `Non : sans critère, les lignes de ${CAMPUSTECH().nom} entrent dans le total, qui devient celui de toutes les clientèles. ${resultat}` },
          { texte: "Garder les lignes des particuliers, regrouper par mois, faire la moyenne", juste: false, retour: `Non : chaque mois n'a qu'une ligne de particuliers ; la moyenne ne réunit rien, et ne répondrait pas à une question sur plusieurs clientèles. ${resultat}` },
        ];
      },
    },
    {
      id: "critere-et-part",
      type: "montants",
      titre: "Un critère, puis une part",
      notions: ["revenue", "dashboard"],
      tableau: tableDesVentes,
      question: () =>
        `Filtrez les lignes du premier trimestre (critère : janvier, février ou mars), puis celles du deuxième (avril, mai ou juin). Pour chacun, calculez le chiffre d'affaires de toutes les clientèles, puis la part de ${CAMPUSTECH().nom} dans ce total, en pourcentage au dixième.`,
      champs: () => {
        const k = donneesALInformation();
        const ct = CAMPUSTECH().nom;
        return [
          { libelle: "Chiffre d'affaires du premier trimestre", attendu: k.premier.total, calcul: `Les lignes de janvier, février et mars, additionnées : ${eur(k.premier.total)}` },
          { libelle: `Part de ${ct}, premier trimestre (%)`, attendu: k.premier.part, calcul: `${eur(k.premier.campustech)} ÷ ${eur(k.premier.total)} × 100 = ${pct(k.premier.part)}`, tolerance: 0.1 },
          { libelle: "Chiffre d'affaires du deuxième trimestre", attendu: k.second.total, calcul: `Les lignes d'avril, mai et juin, additionnées : ${eur(k.second.total)}` },
          { libelle: `Part de ${ct}, deuxième trimestre (%)`, attendu: k.second.part, calcul: `${eur(k.second.campustech)} ÷ ${eur(k.second.total)} × 100 = ${pct(k.second.part)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = donneesALInformation();
        return [
          `La part de ${CAMPUSTECH().nom} passe de ${pct(k.premier.part)} à ${pct(k.second.part)} du chiffre d'affaires, d'un trimestre à l'autre. Le critère choisit les lignes, la somme les réunit, la division les compare : trois traitements pour une information.`,
          "Une part se calcule toujours dans un total qui a le même critère : le chiffre d'affaires d'une clientèle au deuxième trimestre, divisé par celui de toutes les clientèles au deuxième trimestre, jamais sur le semestre.",
        ];
      },
    },
    {
      id: "decider",
      type: "choix",
      titre: "Ce que l'information permet de décider",
      notions: ["payment_terms", "dashboard"],
      question: (c) => {
        const k = donneesALInformation(c);
        return `D'un trimestre à l'autre, la part de ${CAMPUSTECH().nom} dans le chiffre d'affaires ${dE(c.entreprise)} passe de ${pct(k.premier.part)} à ${pct(k.second.part)}. Que dit cette information ? (Selon la règle du cours, une part qui bouge de moins de ${points(PART_STABLE)} est stable.)`;
      },
      options: (c) => {
        const k = donneesALInformation(c);
        const ecart = `${k.ecart > 0 ? "+" : "−"}${points(k.ecart)} d'un trimestre à l'autre`;
        const ct = CAMPUSTECH().nom;
        return [
          {
            texte: `${c.entreprise} dépend moins de ${ct} : sa part recule`,
            juste: k.lecture === "baisse",
            retour:
              k.lecture === "baisse"
                ? `Oui : ${ecart}. ${ct} commande autant, mais les particuliers achètent de plus en plus. Un client qui paie en retard pèse moins dans les ventes, et donc dans la trésorerie : l'information rassure, sans dispenser de relancer ${ct}.`
                : `Non : ${ecart}.`,
          },
          { texte: `${c.entreprise} dépend autant de ${ct} : sa part ne bouge presque pas`, juste: k.lecture === "stable", retour: k.lecture === "stable" ? `Oui : ${ecart}.` : `Non : ${ecart}.` },
          { texte: `${c.entreprise} dépend plus de ${ct} : sa part monte`, juste: k.lecture === "monte", retour: k.lecture === "monte" ? `Oui : ${ecart}.` : `Non : ${ecart}.` },
        ];
      },
    },
    {
      id: "garder-sa-part",
      type: "curseur",
      titre: "Ce qu'il faudrait pour garder sa part",
      notions: ["revenue", "dashboard"],
      question: () => {
        const k = donneesALInformation();
        const ct = CAMPUSTECH();
        return `${ct.nom} commande ${qte(ct.quantites[0]!)} enceintes par mois. Au deuxième trimestre, les particuliers font ${eur(k.second.particuliers)}. Faites varier les enceintes que ${ct.nom} commanderait chaque mois du deuxième trimestre : une droite donne son chiffre d'affaires, l'autre ce qu'il lui faudrait pour peser autant qu'au premier trimestre, ${pct(k.premier.part)} du total. Placez le curseur sur la plus petite commande qui lui garde sa part.`;
      },
      grandeur: () => ({ libelle: "Enceintes commandées chaque mois", unite: "enceintes" }),
      cible: () => ({ attendu: commandePourGarderLaPart(FICHE_DE_GESTION), min: 300, max: 600 }),
      zones: ["CampusTech garde sa part", "La part de CampusTech recule"],
      montrer: "Montrer la commande",
      lecture: (_c, q) => {
        const k = donneesALInformation();
        const prix = FICHE_DE_GESTION.moisDeReference.prix;
        const ca = auCentime(3 * q * prix);
        return [
          { libelle: "Chiffre d'affaires de CampusTech, deuxième trimestre", montant: ca, fort: true },
          { libelle: "Chiffre d'affaires du deuxième trimestre", montant: auCentime(k.second.particuliers + ca) },
          { libelle: "Ce qu'il faudrait pour garder la part du premier trimestre", montant: auCentime((k.premier.campustech / k.premier.total) * (k.second.particuliers + ca)) },
        ];
      },
      droites: () => {
        const k = donneesALInformation();
        const prix = FICHE_DE_GESTION.moisDeReference.prix;
        const part = k.premier.campustech / k.premier.total;
        return { produit: (q) => 3 * q * prix, cout: (q) => part * (k.second.particuliers + 3 * q * prix), libelles: ["Chiffre d'affaires de CampusTech", "Ce qu'il faudrait"] };
      },
      explication: () => {
        const q = commandePourGarderLaPart(FICHE_DE_GESTION);
        const ct = CAMPUSTECH();
        return [
          `Il faudrait que ${ct.nom} commande ${qte(q)} enceintes par mois au lieu de ${qte(ct.quantites[3]!)} pour peser autant qu'au premier trimestre. Elle ne le fait pas : sa part recule parce que les autres ventes grandissent, pas parce qu'elle achète moins.`,
          "Une part dépend de deux nombres : ce qu'on compte, et le total. Elle baisse quand le total monte plus vite.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-filtre",
      type: "simulation",
      titre: "Le laboratoire du filtre",
      notions: ["dashboard", "revenue"],
      question: () => `Un filtre ne garde que les lignes d'un mois. Choisissez le mois, et lisez la part de ${CAMPUSTECH().nom} dans le chiffre d'affaires de ce mois.`,
      leviers: () => [
        {
          code: "mois",
          libelle: "Mois filtré",
          unite: "",
          min: 1,
          max: FICHE_DE_GESTION.semestre.mois.length,
          pas: 1,
          depart: 1,
          choix: FICHE_DE_GESTION.semestre.mois.map((m, i) => ({ valeur: i + 1, libelle: majuscule(m.nom) })),
        },
      ],
      lecture: (_c, p) => {
        const m = donneesALInformation().parMois[p.mois! - 1]!;
        const d = donneesALInformation().parMois[0]!;
        return [
          { libelle: "Chiffre d'affaires du mois", montant: m.total, reference: d.total },
          { libelle: "Chiffre d'affaires de CampusTech", montant: m.campustech, reference: d.campustech },
          { libelle: "Part de CampusTech", montant: m.part, unite: "%", reference: d.part, fort: true },
        ];
      },
      defi: () => {
        const k = donneesALInformation();
        const juste = k.parMois.indexOf(k.moisLePlusFaible) + 1;
        return {
          consigne: "Trouvez le mois où CampusTech pèse le moins dans le chiffre d'affaires.",
          atteint: (p) => p.mois === juste,
          indice: (p) => {
            const m = k.parMois[p.mois! - 1]!;
            return `En ${m.nom}, ${CAMPUSTECH().nom} fait ${pct(m.part)} du chiffre d'affaires. Un autre mois fait-il moins ?`;
          },
          solution: { mois: juste },
        };
      },
      explication: (c, p) => {
        const k = donneesALInformation(c);
        const m = k.parMois[p.mois! - 1]!;
        const max = k.parMois.reduce((g, x) => (x.part > g.part ? x : g));
        return [
          `Défi relevé : en ${m.nom}, ${CAMPUSTECH().nom} ne fait plus que ${pct(m.part)} du chiffre d'affaires ${dE(c.entreprise)}. Sa part la plus haute est en ${max.nom}, ${pct(max.part)} : le mois le plus court, où les particuliers achètent le moins.`,
          "Le même filtre, posé sur un autre mois, donne une autre information. Choisir le critère, c'est choisir la question.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = donneesALInformation(c);
        return [
          `Chez ${c.entreprise}, ${qte(k.lignes.length)} lignes de données brutes ont donné une information : la part de ${CAMPUSTECH().nom} dans le chiffre d'affaires est passée de ${pct(k.premier.part)} à ${pct(k.second.part)} d'un trimestre à l'autre.`,
          "Une requête choisit les lignes (le critère), les range en groupes (le regroupement) et calcule (somme, moyenne, part). Le bon traitement dépend de la question. Dans l'arène, les tableaux de fin de tour sont déjà des informations : demandez-vous de quelles données elles viennent.",
        ];
      },
      repere: () => "Données brutes, puis critère, regroupement et calcul : l'information. Elle ne vaut que si elle répond à la question posée.",
    },
  ],
};
