import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DES DONNÉES À L'INFORMATION, TRIER, REGROUPER, CALCULER (Bac STMG, systèmes
 * d'information de gestion, palier 1).
 *
 * Une table de la base de données des ventes : une ligne par trimestre et par enseigne, avec les
 * ventes et le chiffre d'affaires. Ce sont les chiffres de l'année du cours (`anneeJouee` :
 * l'entreprise, jouée par le bon gestionnaire de l'élève, et ses deux concurrents, joués par les
 * robots du scénario), arrondis à l'unité et à l'euro. Une enseigne qui ne vend plus n'a plus de ligne ;
 * sur l'année du cours, dont les concurrents sont assainis (arene-du-cours.ts), aucune ne cesse
 * de vendre, et la lecture « un concurrent a cessé de vendre » reste écrite pour une partie où le
 * moteur en déclarerait une.
 *
 * L'élève y distingue la donnée (une case de la table) de l'information (ce qu'on en tire), puis
 * fait à la main ce que fait une requête : regrouper les lignes par enseigne et additionner,
 * choisir le critère et le regroupement qui répondent à une question, filtrer les lignes d'un
 * semestre et calculer une part. La question de gestion : l'entreprise gagne-t-elle du terrain
 * sur ses concurrents d'un semestre à l'autre ? L'information obtenue dit où porter l'effort.
 *
 * Il ne double pas « Le marché et la part de marché » (mercatique : la part en volume, face à la
 * demande du marché) : ici, la part se calcule dans le chiffre d'affaires des enseignes, et
 * l'objet est le traitement des données.
 *
 * VOLT FITNESS EN EST : le chapitre ne divise jamais son chiffre d'affaires par ses ventes. Ses
 * ventes comptent les nouveaux adhérents du trimestre, son chiffre d'affaires les cotisations de
 * tous ses adhérents ; l'extrait le dit.
 */

/**
 * LA RÈGLE DE LECTURE DU COURS : d'un semestre à l'autre, une part du chiffre d'affaires qui
 * bouge de moins de 1 point se lit comme stable. L'écart tient alors à la saison et au hasard des
 * ventes, pas à une place gagnée ou perdue.
 */
export const PART_STABLE = 1;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const points = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} point${Math.abs(t) >= 2 ? "s" : ""}`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** Le trimestre écrit court, en chiffres : « 1er », « 2e ». */
export const ordinal = (t: number) => (t === 1 ? "1er" : `${t}e`);

export interface LigneDeVentes {
  /** Le numéro de la ligne dans l'extrait, à partir de 1. */
  numero: number;
  trimestre: number;
  /** L'identifiant de l'enseigne dans l'arène (« joueur » pour l'entreprise). */
  id: string;
  enseigne: string;
  ventes: number;
  chiffreDAffaires: number;
}

/**
 * La table des ventes de l'année du cours : une ligne par trimestre et par enseigne qui a vendu,
 * l'entreprise d'abord, puis ses deux concurrents, dans l'ordre du scénario.
 */
export function extraitDesVentes(c: Cas): LigneDeVentes[] {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const enseignes = [{ id: "joueur", nom: c.entreprise }, ...def.bots.slice(0, 2).map((b) => ({ id: b.id, nom: b.name }))];
  const lignes = partie.rounds.flatMap((tour, k) =>
    enseignes.map((e) => {
      const r = tour.results[e.id]!;
      return {
        trimestre: k + 1,
        id: e.id,
        enseigne: e.nom,
        ventes: Math.round(Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0)),
        chiffreDAffaires: Math.round(r.incomeStatement.revenue),
      };
    }),
  );
  return lignes.filter((l) => l.ventes > 0).map((l, i) => ({ numero: i + 1, ...l }));
}

export type LectureDesSemestres = "monte-depart" | "monte" | "stable" | "baisse";

/** Ce que les données donnent, une fois triées, regroupées et calculées. */
export function donneesALInformation(c: Cas) {
  const def = scenarioByCode(c.code);
  const lignes = extraitDesVentes(c);
  const somme = (garder: (l: LigneDeVentes) => boolean) => lignes.filter(garder).reduce((t, l) => t + l.chiffreDAffaires, 0);
  const enseignes = [{ id: "joueur", nom: c.entreprise }, ...def.bots.slice(0, 2).map((b) => ({ id: b.id, nom: b.name }))].map((e) => ({
    ...e,
    /** Le chiffre d'affaires de l'année : les lignes de l'enseigne, additionnées. */
    chiffreDeLAnnee: somme((l) => l.id === e.id),
    lignes: lignes.filter((l) => l.id === e.id).length,
  }));
  const entreprise = enseignes[0]!;
  const concurrents = enseignes.slice(1);
  const ventesDeLAnnee = lignes.filter((l) => l.id === "joueur").reduce((t, l) => t + l.ventes, 0);
  const semestre = (debut: number, fin: number) => {
    const total = somme((l) => l.trimestre >= debut && l.trimestre <= fin);
    const deLEntreprise = somme((l) => l.trimestre >= debut && l.trimestre <= fin && l.id === "joueur");
    return { total, deLEntreprise, part: auDixieme((deLEntreprise / total) * 100) };
  };
  const premier = semestre(1, 2);
  const second = semestre(3, 4);
  const ecart = auDixieme(second.part - premier.part);
  const dernier = Math.max(...lignes.map((l) => l.trimestre));
  // Un concurrent a cessé de vendre quand il n'a plus de ligne au dernier trimestre.
  const partis = concurrents.filter((e) => !lignes.some((l) => l.id === e.id && l.trimestre === dernier));
  const lecture: LectureDesSemestres =
    ecart > PART_STABLE ? (partis.length > 0 ? "monte-depart" : "monte") : ecart < -PART_STABLE ? "baisse" : "stable";
  // La requête de l'étape « la-requete » : les lignes des concurrents, regroupées par trimestre.
  const concurrentsAuPremier = somme((l) => l.trimestre === 1 && l.id !== "joueur");
  const premiere = lignes[0]!;
  const derniere = lignes.at(-1)!;
  return {
    lignes,
    enseignes,
    entreprise,
    concurrents,
    ventesDeLAnnee,
    premier,
    second,
    ecart,
    partis,
    lecture,
    concurrentsAuPremier,
    /** Le chiffre d'affaires moyen d'un trimestre de l'entreprise, au centime. */
    moyenneParTrimestre: auCentime(entreprise.chiffreDeLAnnee / entreprise.lignes),
    marcheAuPremier: somme((l) => l.trimestre === 1),
    premiere,
    derniere,
  };
}

export function tableDesVentes(c: Cas): TableauDeDonnees {
  const abonnement = !!scenarioByCode(c.code).scenario.subscription;
  return {
    titre: "Extrait de la table des ventes : une ligne par trimestre et par enseigne",
    colonnes: ["Trimestre", "Enseigne", abonnement ? `Ventes (nouveaux ${c.unites})` : `Ventes (${c.unites})`, "Chiffre d'affaires"],
    lignes: extraitDesVentes(c).map((l) => ({
      libelle: `Ligne ${l.numero}`,
      valeurs: [`T${l.trimestre}`, l.enseigne, qte(l.ventes), eur(l.chiffreDAffaires)],
    })),
  };
}

export const DES_DONNEES_A_L_INFORMATION: Chapitre = {
  code: "des-donnees-a-l-information",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Des données à l'information : trier, regrouper, calculer",
  accroche:
    "Une table de la base de données des ventes, une ligne par trimestre et par enseigne : des données brutes. Les filtrer, les regrouper et calculer, comme le fait une requête, pour en tirer une information qui aide à décider.",
  objectifs: [
    "Distinguer une donnée d'une information",
    "Regrouper des lignes et calculer une somme, une moyenne, une part",
    "Choisir le critère et le regroupement d'une requête",
    "Dire ce que l'information obtenue permet de décider",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un extrait de la base de données",
      notions: ["dashboard", "revenue"],
      tableau: tableDesVentes,
      texte: (c) => {
        const k = donneesALInformation(c);
        const [a, b] = k.concurrents;
        const abonnement = !!scenarioByCode(c.code).scenario.subscription;
        return [
          `Le système d'information ${dE(c.entreprise)} enregistre chaque trimestre les ventes de l'entreprise et celles de ses concurrents, ${a!.nom} et ${b!.nom}. La table des ventes en garde une ligne par trimestre et par enseigne : ${qte(k.lignes.length)} lignes sur l'année du cours.`,
          "Chaque case est une donnée : un fait brut, enregistré tel quel. Une donnée seule ne répond à aucune question. La direction veut savoir si l'entreprise gagne du terrain sur ses concurrents au fil de l'année : pour le dire, il faut trier les lignes, les regrouper et calculer.",
          ...(abonnement
            ? [
                `Chez ${c.entreprise}, les ventes comptent les nouveaux ${c.unites} du trimestre ; le chiffre d'affaires, les cotisations de tous les ${c.unites}, nouveaux et anciens.`,
              ]
            : []),
          ...(k.partis.length > 0
            ? [`${k.partis.map((e) => e.nom).join(" et ")} n'${k.partis.length > 1 ? "ont" : "a"} plus de ligne à la fin de l'année : une enseigne qui ne vend plus n'enregistre plus rien.`]
            : []),
        ];
      },
      repere: () =>
        "Une donnée est un fait brut enregistré. Une information est une donnée traitée (triée, regroupée, calculée) qui répond à une question et aide à décider.",
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
      elements: (c) => {
        const k = donneesALInformation(c);
        const p = k.premiere;
        const d = k.derniere;
        return [
          {
            libelle: `Chiffre d'affaires ${dE(p.enseigne)} au ${ordinal(p.trimestre)} trimestre`,
            montant: p.chiffreDAffaires,
            categorie: "donnee",
            pourquoi: `Une case de la ligne ${p.numero}, lue telle quelle.`,
          },
          {
            libelle: `Chiffre d'affaires ${dE(c.entreprise)} sur l'année`,
            montant: k.entreprise.chiffreDeLAnnee,
            categorie: "information",
            pourquoi: `Les ${qte(k.entreprise.lignes)} lignes ${dE(c.entreprise)}, regroupées et additionnées.`,
          },
          {
            libelle: `Chiffre d'affaires ${dE(d.enseigne)} au ${ordinal(d.trimestre)} trimestre`,
            montant: d.chiffreDAffaires,
            categorie: "donnee",
            pourquoi: `Une case de la ligne ${d.numero}, la dernière de l'extrait.`,
          },
          {
            libelle: `Chiffre d'affaires moyen ${dE(c.entreprise)} par trimestre`,
            montant: k.moyenneParTrimestre,
            categorie: "information",
            pourquoi: `Le chiffre d'affaires de l'année, ${eur(k.entreprise.chiffreDeLAnnee)}, divisé par ${qte(k.entreprise.lignes)} trimestres : une moyenne.`,
          },
          {
            libelle: "Chiffre d'affaires des enseignes réunies au 1er trimestre",
            montant: k.marcheAuPremier,
            categorie: "information",
            pourquoi: "Les lignes du 1er trimestre, filtrées puis additionnées.",
          },
        ];
      },
      explication: () => [
        "Une donnée ne change pas selon la question : elle est enregistrée une fois. Une information dépend de la question posée, et du traitement choisi pour y répondre. Le même extrait donne autant d'informations qu'on lui pose de questions.",
      ],
    },
    {
      id: "regrouper",
      type: "montants",
      titre: "Regrouper les lignes par enseigne",
      notions: ["revenue", "dashboard"],
      tableau: tableDesVentes,
      question: (c) =>
        `Regroupez les lignes par enseigne et additionnez : le chiffre d'affaires de l'année de chaque enseigne, à l'euro. Puis, en ne gardant que les lignes ${dE(c.entreprise)}, ses ventes de l'année.`,
      champs: (c) => {
        const k = donneesALInformation(c);
        const lignesDe = (id: string) => k.lignes.filter((l) => l.id === id);
        return [
          ...k.enseignes.map((e) => ({
            libelle: `Chiffre d'affaires de l'année, ${e.nom}`,
            attendu: e.chiffreDeLAnnee,
            calcul: `${lignesDe(e.id).map((l) => eur(l.chiffreDAffaires)).join(" + ")} = ${eur(e.chiffreDeLAnnee)}`,
            tolerance: 1,
          })),
          {
            libelle: `Ventes de l'année, ${c.entreprise}`,
            attendu: k.ventesDeLAnnee,
            calcul: `${lignesDe("joueur").map((l) => qte(l.ventes)).join(" + ")} = ${qte(k.ventesDeLAnnee)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = donneesALInformation(c);
        const premiere = [...k.enseignes].sort((a, b) => b.chiffreDeLAnnee - a.chiffreDeLAnnee)[0]!;
        return [
          `Sur l'année, ${premiere.nom} fait le plus gros chiffre d'affaires : ${eur(premiere.chiffreDeLAnnee)}. Les ${qte(k.lignes.length)} lignes de l'extrait sont devenues ${qte(k.enseignes.length)} totaux, un par enseigne : c'est un regroupement.`,
          "Une requête le fait en une phrase. En langage de requête (SQL), elle s'écrit : SELECT Enseigne, SUM(ChiffreAffaires) FROM Ventes GROUP BY Enseigne. SUM additionne ; GROUP BY dit sur quelle colonne regrouper. Pour les ventes, un critère s'ajoute, WHERE : ne garder que les lignes de l'entreprise.",
        ];
      },
    },
    {
      id: "la-requete",
      type: "choix",
      titre: "Le critère et le regroupement",
      notions: ["dashboard"],
      question: (c) =>
        `La direction veut connaître, trimestre par trimestre, le chiffre d'affaires de ses concurrents réunis. Quelle requête lui répond ? (${c.entreprise} est l'entreprise ; ses concurrents sont les autres enseignes.)`,
      // La bonne réponse est la même dans toutes les entreprises : la question porte sur la méthode.
      options: (c) => {
        const k = donneesALInformation(c);
        const resultat = `Au 1er trimestre, la requête donne ${eur(k.concurrentsAuPremier)}.`;
        return [
          {
            texte: "Garder les lignes des concurrents, regrouper par trimestre, additionner",
            juste: true,
            retour: `Oui : le critère écarte les lignes ${dE(c.entreprise)}, le regroupement fait un total par trimestre, la somme additionne. ${resultat}`,
          },
          {
            texte: "Garder les lignes des concurrents, regrouper par enseigne, additionner",
            juste: false,
            retour: `Non : regrouper par enseigne donne le total de l'année de chaque concurrent, pas celui de chaque trimestre. ${resultat}`,
          },
          {
            texte: "Garder toutes les lignes, regrouper par trimestre, additionner",
            juste: false,
            retour: `Non : sans critère, les lignes ${dE(c.entreprise)} entrent dans le total, qui devient celui de toutes les enseignes. ${resultat}`,
          },
          {
            texte: "Garder les lignes des concurrents, regrouper par trimestre, faire la moyenne",
            juste: false,
            retour: `Non : la moyenne donnerait le chiffre d'affaires d'un concurrent moyen, pas celui des concurrents réunis. ${resultat}`,
          },
        ];
      },
    },
    {
      id: "critere-et-part",
      type: "montants",
      titre: "Un critère, puis une part",
      notions: ["revenue", "demand_market_share", "seasonality"],
      tableau: tableDesVentes,
      question: (c) =>
        `Filtrez les lignes du premier semestre (critère : trimestre 1 ou 2), puis celles du second (trimestre 3 ou 4). Pour chacun, calculez le chiffre d'affaires des enseignes réunies, puis la part ${dE(c.entreprise)} dans ce total, en pourcentage au dixième.`,
      champs: (c) => {
        const k = donneesALInformation(c);
        return [
          {
            libelle: "Chiffre d'affaires des enseignes, premier semestre",
            attendu: k.premier.total,
            calcul: `Les lignes des trimestres 1 et 2, additionnées : ${eur(k.premier.total)}`,
            tolerance: 1,
          },
          {
            libelle: `Part ${dE(c.entreprise)}, premier semestre (%)`,
            attendu: k.premier.part,
            calcul: `${eur(k.premier.deLEntreprise)} ÷ ${eur(k.premier.total)} × 100 = ${pct(k.premier.part)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Chiffre d'affaires des enseignes, second semestre",
            attendu: k.second.total,
            calcul: `Les lignes des trimestres 3 et 4, additionnées : ${eur(k.second.total)}`,
            tolerance: 1,
          },
          {
            libelle: `Part ${dE(c.entreprise)}, second semestre (%)`,
            attendu: k.second.part,
            calcul: `${eur(k.second.deLEntreprise)} ÷ ${eur(k.second.total)} × 100 = ${pct(k.second.part)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = donneesALInformation(c);
        return [
          `La part ${dE(c.entreprise)} passe de ${pct(k.premier.part)} à ${pct(k.second.part)} du chiffre d'affaires des enseignes, d'un semestre à l'autre. Le critère choisit les lignes, la somme les réunit, la division les compare : trois traitements pour une information.`,
          "Une part se calcule toujours dans un total qui a le même critère : le chiffre d'affaires de l'entreprise au second semestre, divisé par celui de toutes les enseignes au second semestre, jamais sur l'année.",
        ];
      },
    },
    {
      id: "decider",
      type: "choix",
      titre: "Ce que l'information permet de décider",
      notions: ["demand_market_share", "dashboard"],
      question: (c) => {
        const k = donneesALInformation(c);
        return `D'un semestre à l'autre, la part ${dE(c.entreprise)} dans le chiffre d'affaires des enseignes passe de ${pct(k.premier.part)} à ${pct(k.second.part)}. Que dit cette information ${dE(c.entreprise)} ? (Selon la règle du cours, une part qui bouge de moins de ${points(PART_STABLE)} est stable.)`;
      },
      options: (c) => {
        const k = donneesALInformation(c);
        const ecart = `${k.ecart > 0 ? "+" : ""}${points(k.ecart).replace(/^-/, "−")} d'un semestre à l'autre`;
        const partis = k.partis.map((e) => e.nom).join(" et ");
        const neVendPlus = `${partis} ${k.partis.length > 1 ? "ne vendent" : "ne vend"} plus`;
        const non = `Non : ${ecart}${k.partis.length > 0 ? `, et ${neVendPlus} à la fin de l'année` : ", et chaque concurrent vend encore à la fin de l'année"}.`;
        const oui = (texte: string) => `Oui : ${ecart}. ${texte}`;
        return [
          {
            texte: "Elle gagne du terrain, surtout parce qu'un concurrent a cessé de vendre",
            juste: k.lecture === "monte-depart",
            retour:
              k.lecture === "monte-depart"
                ? oui(
                    `${neVendPlus} : ${k.partis.length > 1 ? "leurs" : "ses"} clients se répartissent entre les enseignes qui restent. L'information dit où porter l'effort : servir cette demande qui se libère, sans croire que l'entreprise a battu ses concurrents.`,
                  )
                : non,
          },
          {
            texte: "Elle gagne du terrain sur des concurrents qui vendent toujours",
            juste: k.lecture === "monte",
            retour:
              k.lecture === "monte"
                ? oui("Les mêmes enseignes vendent encore : l'entreprise prend une plus grande part du même marché. L'information confirme les choix de l'année ; on les garde, et on cherche ce qui a fait la différence.")
                : non,
          },
          {
            texte: "Elle garde sa place : sa part ne bouge presque pas",
            juste: k.lecture === "stable",
            retour:
              k.lecture === "stable"
                ? oui("Rien n'a changé dans le partage du marché. L'information ne pousse à rien changer, mais elle dit que l'entreprise n'a pris aucun client à ses concurrents : pour grandir, il faudra un autre levier.")
                : non,
          },
          {
            texte: "Elle perd du terrain : sa part recule",
            juste: k.lecture === "baisse",
            retour:
              k.lecture === "baisse"
                ? oui("Les concurrents prennent une plus grande part du marché. L'information pousse à chercher pourquoi : le prix, la qualité, la communication.")
                : non,
          },
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
          `Chez ${c.entreprise}, ${qte(k.lignes.length)} lignes de données brutes ont donné une information : une part du chiffre d'affaires des enseignes passée de ${pct(k.premier.part)} à ${pct(k.second.part)} d'un semestre à l'autre.`,
          "Une requête choisit les lignes (le critère), les range en groupes (le regroupement) et calcule (somme, moyenne, part). Le bon traitement dépend de la question : la même table répond à beaucoup de questions, à condition de choisir le critère et le regroupement qui vont avec chacune.",
        ];
      },
      repere: () => "Données brutes, puis critère, regroupement et calcul : l'information. Elle ne vaut que si elle répond à la question posée, et elle se lit avec ce qui s'est passé sur le marché.",
    },
  ],
};
