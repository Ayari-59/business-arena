import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_CADRE } from "../../chapitres/le-cadre-de-la-comptabilite";
import { ATELIER_DE_REPARATION, FORMES, MANQUE_POUR_UNE_SA, SEUILS_DU_COMMISSAIRE_AUX_COMPTES, commissaireAuxComptes } from "../../monde/cadre-de-la-comptabilite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CADRE DE LA COMPTABILITÉ » : CRÉER L'ATELIER DE RÉPARATION
 * (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : NOVA en N + 1 ; deux de ses opérateurs
 * veulent créer un atelier de réparation d'enceintes (monde/cadre-de-la-comptabilite.ts,
 * ATELIER_DE_REPARATION) et demandent conseil au comptable. L'élève refait seul le chemin du
 * chapitre : le capital qu'exigerait une SA, les seuils du commissaire aux comptes, la responsabilité,
 * les obligations comptables d'une société, puis la forme qu'il conseille.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR");

/** Les chiffres du cas. */
export function atelierDuCas(_c: Pick<Cas, "code">) {
  const a = ATELIER_DE_REPARATION;
  return { a, manque: MANQUE_POUR_UNE_SA, cac: commissaireAuxComptes(a.criteres) };
}

export const CREER_L_ATELIER_DE_REPARATION: Situation = {
  code: "creer-l-atelier-de-reparation",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["le-cadre-de-la-comptabilite"],
  commanditaire: "Des opérateurs de NOVA",
  titre: "Créer l'atelier de réparation",
  accroche: "Deux opérateurs de NOVA veulent ouvrir un atelier qui répare les enceintes, et faire entrer plus tard un investisseur. Quelle forme leur conseiller, et qu'impose-t-elle ?",
  objectifs: [
    "Confronter un projet aux exigences de chaque forme : capital, nombre d'associés, dirigeant",
    "Dire si un commissaire aux comptes s'impose, et ce que risquent les associés",
    "Conseiller une forme d'entreprise, et la justifier",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CADRE,
    pourquoi: "ce cas reprend le chapitre « Le cadre de la comptabilité », qui se lit depuis NOVA en N + 1 dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question des opérateurs",
      texte: (c) => {
        const { a } = atelierDuCas(c);
        return [
          `« Nous voulons ouvrir à ${qte(a.associes)} un atelier qui répare les enceintes, les nôtres et celles des autres marques. Nous apportons ${eur(a.apports)} à nous deux. La première année, nous prévoyons ${eur(a.criteres.chiffreDAffaires)} de chiffre d'affaires, ${qte(a.criteres.effectif)} salariés et un bilan de ${eur(a.criteres.totalDuBilan)}. Nous ne voulons pas risquer notre maison, nous voulons faire entrer plus tard un investisseur sans lui céder la direction, et écrire nous-mêmes qui décide de quoi. Quelle forme choisir ? »`,
          "Pas de cours cette fois : vous avez le tableau des cinq formes et les seuils du chapitre.",
        ];
      },
      tableau: () => ({
        titre: "Les formes et leurs exigences",
        colonnes: ["Qui la détient", "Capital minimal", "Dirigeant"],
        lignes: (["EI", "SARL", "SA", "SAS"] as const).map((k) => {
          const f = FORMES[k];
          return { libelle: f.nom, valeurs: [f.associes, f.capitalMinimal === null ? "aucun" : f.capitalMinimal === 1 ? "libre, 1 € au moins" : eur(f.capitalMinimal), f.dirigeant] };
        }),
      }),
      repere: () => "À rendre : ce qui manquerait pour une SA, les seuils dépassés, ce que risquent les associés, ce que la société devra tenir, et la forme que vous conseillez.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le capital et les seuils",
      question: (c) => {
        const { a } = atelierDuCas(c);
        return `Les opérateurs apportent ${eur(a.apports)}. Calculez ce qui leur manquerait pour constituer une société anonyme, puis le nombre de seuils du commissaire aux comptes que l'atelier dépasserait la première année.`;
      },
      champs: (c) => {
        const x = atelierDuCas(c);
        const s = SEUILS_DU_COMMISSAIRE_AUX_COMPTES;
        return [
          { libelle: "Apport manquant pour une SA", attendu: x.manque, calcul: `${eur(FORMES.SA.capitalMinimal!)} − ${eur(x.a.apports)} = ${eur(x.manque)}` },
          {
            libelle: "Seuils du commissaire aux comptes dépassés",
            attendu: x.cac.depasses,
            calcul: `${eur(x.a.criteres.totalDuBilan)} contre ${eur(s.totalDuBilan)}, ${eur(x.a.criteres.chiffreDAffaires)} contre ${eur(s.chiffreDAffaires)}, ${qte(x.a.criteres.effectif)} salariés contre ${qte(s.effectif)} : ${qte(x.cac.depasses)}`,
          },
        ];
      },
      explication: () => ["La SA est hors de portée et trop lourde ; aucun commissaire aux comptes ne s'impose : l'atelier reste loin des seuils."],
    },
    {
      id: "la-responsabilite",
      type: "choix",
      titre: "Ce qu'ils risquent",
      question: () => "Dans une SARL comme dans une SAS, que risqueraient les opérateurs si l'atelier ne pouvait pas payer ses dettes ?",
      options: (c) => {
        const { a } = atelierDuCas(c);
        return [
          { texte: `Leurs apports, ${eur(a.apports)}`, juste: true, retour: "Oui : leur responsabilité est limitée à leurs apports ; leur maison est à l'abri, sauf s'ils se portent caution d'un emprunt de l'atelier." },
          { texte: "Toutes les dettes de l'atelier, sur leurs biens personnels", juste: false, retour: "Non : ce serait une responsabilité illimitée, que ni la SARL ni la SAS ne connaissent." },
          { texte: "Rien : seule la société répond de ses dettes, et ils ne perdent rien", juste: false, retour: "Leurs apports sont perdus avec la société : la responsabilité est limitée, pas nulle." },
        ];
      },
    },
    {
      id: "la-comptabilite-de-l-atelier",
      type: "choix",
      titre: "Ce que la société devra tenir",
      question: () => "Une fois la société créée, quelles obligations comptables aura l'atelier ?",
      options: () => [
        {
          texte: "Une comptabilité complète et des comptes annuels",
          juste: true,
          retour: "Oui : toute société commerciale tient un journal, un grand livre et un inventaire, établit chaque année son bilan, son compte de résultat et son annexe, et les fait approuver par ses associés. Aucun commissaire aux comptes ne s'impose sous les seuils.",
        },
        { texte: "Aucune la première année : une jeune société en est dispensée tant qu'elle ne fait pas de bénéfice", juste: false, retour: "Non : les obligations comptables naissent avec la société, bénéfice ou non." },
        { texte: "Un simple livre des recettes et des dépenses, comme un micro-entrepreneur", juste: false, retour: "Le livre des recettes est réservé au micro-entrepreneur, une entreprise individuelle ; une société tient une comptabilité complète." },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre conseil",
      question: () => "Quelle forme conseillez-vous aux opérateurs ?",
      options: () => [
        {
          texte: "Une SAS",
          juste: true,
          retour:
            "Oui. Elle accueille 2 associés ou plus, son capital est libre, leur responsabilité est limitée à leurs apports, et ses statuts organisent le pouvoir comme ils le veulent : un investisseur pourra entrer en actionnaire sans prendre la direction. Elle paiera l'impôt sur les sociétés.",
        },
        {
          texte: "Une SARL : un gérant, des parts sociales, la forme la plus répandue des petites sociétés",
          juste: false,
          retour: "Elle les protège aussi, mais ses règles de pouvoir sont fixées par la loi, et l'entrée d'un investisseur demande l'agrément de la majorité des associés : elle répond moins bien à ce qu'ils veulent.",
        },
        {
          texte: "Une société anonyme, la forme qui rassure le plus les investisseurs",
          juste: false,
          retour: `Il leur manquerait ${eur(MANQUE_POUR_UNE_SA)} de capital, et une SA demande un conseil d'administration : beaucoup trop lourd pour un atelier qui démarre.`,
        },
        {
          texte: "Une entreprise individuelle, pour démarrer au plus simple, à deux",
          juste: false,
          retour: "Une entreprise individuelle n'a qu'un entrepreneur : elle ne peut pas réunir deux associés, ni accueillir un investisseur.",
        },
      ],
    },
  ],
};
