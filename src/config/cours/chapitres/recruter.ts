import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { MOIS_DE_L_EXERCICE } from "../monde/exercice-de-nova";
import {
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  FICHE_RH,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  recrutementDeNPlus1,
  type LeviersDuRecrutement,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RECRUTER, CE QUE COÛTE UNE EMBAUCHE ET CE QU'ELLE APPORTE (Bac STMG, ressources
 * humaines, palier 1).
 *
 * Une embauche coûte son recrutement tout de suite et un salaire chaque mois ensuite ; la recrue
 * n'arrive qu'une fois le recrutement fait, et monte moins son premier mois. Le chapitre calcule ce
 * qu'elle coûte sur l'année et ce qu'elle doit faire vendre pour se payer (le curseur), puis regarde
 * ce qu'elle change : la capacité de l'équipe monte, mais les ventes ne suivent que si l'équipe était
 * ce qui les limitait. Le laboratoire cherche ce qu'il faut pour servir toute la demande : un poste
 * de plus sur la ligne, et quelqu'un pour le tenir.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur l'année N + 1 prévue : la demande, la
 * ligne de 7 000 enceintes par trimestre, les 4 opérateurs (600 enceintes chacun par mois), le coût
 * d'un opérateur (celui de la paie de l'exercice), le recrutement (2 mois, 3 000 €), l'intégration et
 * le cinquième poste manuel sont ceux de nova-capacite.ts (monde/ressources-humaines-de-nova.ts).
 * Le recrutement lancé en janvier est une hypothèse du cours, nommée là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène avec un salarié de plus, trimestre par
 * trimestre ; il suit maintenant l'année N + 1 de NOVA, mois par mois : la recrue coûte 29 625 € et
 * ne fait rien vendre de plus, la ligne étant le goulot.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const mois = (m: number) => MOIS_DE_L_EXERCICE[m - 1]!;
/** Les ventes en plus, dites : « 800 enceintes de plus », ou « aucune enceinte de plus ». */
const enPlus = (n: number) => (n > 0 ? `${qte(n)} enceinte${n > 1 ? "s" : ""} de plus` : "aucune enceinte de plus");
const leMois = (m: number) => (m === 1 ? "le 1er janvier" : `le 1er ${mois(m)}`);

export type Verdict = "rien-de-plus" | "pas-assez" | "se-paie";

/** L'embauche du chapitre : son coût, ce qu'elle doit faire vendre, et ce qu'elle change (les cas la reprennent). */
export function recrutement(_c?: Cas, l: Partial<LeviersDuRecrutement> = {}) {
  const r = recrutementDeNPlus1({ poste: 0, embauche: 1, ...l });
  const sans = recrutementDeNPlus1({ ...l, poste: r.poste, embauche: 0 });
  const enceintesDeLaRecrue = r.joue.production - sans.joue.production;
  const ecartDeResultat = Math.round((enceintesDeLaRecrue * r.marge - r.coutDeLaRecrue) * 100) / 100;
  const verdict: Verdict = ecartDeResultat > 0 ? "se-paie" : enceintesDeLaRecrue > 0 ? "pas-assez" : "rien-de-plus";
  return { ...r, sans, enceintesDeLaRecrue, ecartDeLaRecrue: ecartDeResultat, verdict, lancement: l.moisDuRecrutement ?? r.arrivee! - FICHE_RH.personnel.delaiDeRecrutementEnMois };
}

const NOMS_DES_POSTES = ["La ligne de 4 postes", "Un cinquième poste"] as const;

export const RECRUTER: Chapitre = {
  code: "recruter",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  titre: "Recruter : ce que coûte une embauche, ce qu'elle apporte",
  accroche:
    "Une embauche coûte son recrutement tout de suite et un salaire chaque mois ensuite. Elle ne rapporte que si le travail manquait : ce qu'une recrue change à l'année qui vient.",
  objectifs: [
    "Calculer le coût d'une embauche sur l'année",
    "Calculer les ventes qu'une embauche doit apporter pour se payer",
    "Lire ce qu'une embauche change à la capacité de l'équipe",
    "Juger une embauche sur les ventes qu'elle apporte réellement",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un opérateur de plus",
      notions: ["payroll", "capacity"],
      texte: (c) => {
        const r = recrutement(c);
        return [
          `Pour l'année N + 1, ${c.entreprise} prévoit ${qte(r.plan.demande)} ${c.unites} de demande, plus qu'en N. La gérante envisage un cinquième opérateur et lance le recrutement en ${mois(r.lancement)}. Le recrutement (l'annonce, les entretiens, les essais) coûte ${eur(r.recrutement)} et dure ${FICHE_RH.personnel.delaiDeRecrutementEnMois} mois : la recrue arrive ${leMois(r.arrivee!)}.`,
          `Elle coûte alors ${eur(r.coutMensuel)} par mois, comme chaque opérateur, et monte son premier mois la moitié de ce que monte un opérateur formé. En échange, l'équipe peut monter davantage d'enceintes. Encore faut-il que ce soit l'équipe qui limite les ventes.`,
        ];
      },
      tableau: (c) => {
        const r = recrutement(c);
        return {
          titre: `L'embauche ${dE(c.entreprise)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Coût du recrutement", valeurs: [eur(r.recrutement)] },
            { libelle: "Coût d'un opérateur par mois (brut et cotisations patronales)", valeurs: [eur(r.coutMensuel)] },
            { libelle: "Mois payés dans l'année, de son arrivée à décembre", valeurs: [String(r.moisDeLaRecrue)] },
            { libelle: "Marge d'une enceinte vendue (prix moins coût variable)", valeurs: [eur(r.marge)] },
          ],
        };
      },
      repere: () => "Une embauche se paie si les ventes qu'elle apporte laissent assez de marge pour couvrir son coût.",
    },
    {
      id: "cout",
      objectifs: [0, 1],
      type: "montants",
      titre: "Ce que coûte l'embauche, ce qu'elle doit faire vendre",
      notions: ["payroll", "contribution_margin"],
      question: (c) => `Calculez le coût de l'embauche sur l'année (le recrutement, plus le coût de la recrue les mois où elle est payée), puis le nombre d'${c.unites} à vendre en plus pour le couvrir (coût ÷ marge d'une enceinte, arrondi à l'unité supérieure).`,
      champs: (c) => {
        const r = recrutement(c);
        return [
          { libelle: "Coût de l'embauche sur l'année", attendu: r.coutDeLaRecrue, calcul: `${eur(r.recrutement)} + ${eur(r.coutMensuel)} × ${r.moisDeLaRecrue} = ${eur(r.coutDeLaRecrue)}`, tolerance: 1 },
          { libelle: `Ventes à faire en plus (${c.unites})`, attendu: r.enceintesPourSePayer, calcul: `${eur(r.coutDeLaRecrue)} ÷ ${eur(r.marge)} = ${qte(r.enceintesPourSePayer)}, à l'unité supérieure`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = recrutement(c);
        return [
          `Pour se payer, l'embauche doit faire vendre ${qte(r.enceintesPourSePayer)} ${c.unites} de plus dans l'année. Ce n'est pas la recrue qui crée ces ventes : il faut des clients pour les acheter, et que l'équipe actuelle n'ait pas pu les servir.`,
        ];
      },
    },
    {
      id: "l-annee",
      objectifs: [2],
      type: "montants",
      titre: "Ce que la recrue change à l'année",
      notions: ["capacity", "productivity"],
      tableau: (c) => {
        const r = recrutement(c);
        return {
          titre: `L'année N + 1, en ${c.unites} par trimestre`,
          colonnes: r.joue.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Demande prévue", valeurs: r.joue.trimestres.map((t) => qte(t.demande)) },
            { libelle: "Capacité de la ligne", valeurs: r.joue.trimestres.map((t) => qte(t.capaciteOutil)) },
            { libelle: "Capacité de l'équipe, sans la recrue", valeurs: r.sans.joue.trimestres.map((t) => qte(t.capaciteEquipe)) },
            { libelle: "Capacité de l'équipe, avec la recrue", valeurs: r.joue.trimestres.map((t) => qte(t.capaciteEquipe)) },
          ],
        };
      },
      question: () =>
        "Chaque trimestre, NOVA monte la plus petite des trois quantités : la demande, ce que la ligne peut monter, ce que l'équipe peut monter. Calculez les enceintes montées sur l'année sans la recrue, puis avec elle, et l'écart.",
      champs: (c) => {
        const r = recrutement(c);
        const detail = (x: typeof r.joue) => x.trimestres.map((t) => qte(t.production)).join(" + ");
        return [
          { libelle: `Montées sans la recrue (${c.unites})`, attendu: r.sans.joue.production, calcul: `${detail(r.sans.joue)} = ${qte(r.sans.joue.production)}`, tolerance: 0 },
          { libelle: `Montées avec la recrue (${c.unites})`, attendu: r.joue.production, calcul: `${detail(r.joue)} = ${qte(r.joue.production)}`, tolerance: 0 },
          { libelle: `Ventes en plus (${c.unites})`, attendu: r.enceintesDeLaRecrue, calcul: `${qte(r.joue.production)} − ${qte(r.sans.joue.production)} = ${qte(r.enceintesDeLaRecrue)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const r = recrutement(c);
        return [
          r.enceintesDeLaRecrue > 0
            ? `La recrue fait monter ${qte(r.enceintesDeLaRecrue)} ${c.unites} de plus : certains trimestres, c'est l'équipe qui limitait les ventes.`
            : `L'équipe pourrait monter bien plus, mais pas une enceinte de plus ne sort : au printemps et à Noël, c'est la ligne qui borne la production, à ${qte(r.joue.trimestres[1]!.capaciteOutil)} ${c.unites}. Le reste de l'année, la demande est servie sans elle.`,
        ];
      },
    },
    {
      id: "verdict",
      objectifs: [3],
      type: "choix",
      titre: "L'embauche se paie-t-elle ?",
      notions: ["payroll", "capacity"],
      question: (c) => {
        const r = recrutement(c);
        return `L'embauche coûte ${eur(r.coutDeLaRecrue)} sur l'année et fait vendre ${enPlus(r.enceintesDeLaRecrue)}. Que conclure ?`;
      },
      options: (c) => {
        const r = recrutement(c);
        return [
          {
            texte: "Elle ne fait rien vendre : l'équipe ne limite pas les ventes",
            juste: r.verdict === "rien-de-plus",
            retour:
              r.verdict === "rien-de-plus"
                ? `Oui : les ventes ne bougent pas, et l'embauche retire ${eur(r.coutDeLaRecrue)} au résultat. Avant de recruter, il faut vérifier que le travail manque : ici, c'est la ligne qui manque.`
                : `Non : elle fait vendre ${qte(r.enceintesDeLaRecrue)} ${c.unites} de plus.`,
          },
          {
            texte: "Elle fait vendre davantage, mais pas assez pour couvrir son coût",
            juste: r.verdict === "pas-assez",
            retour:
              r.verdict === "pas-assez"
                ? `Oui : ${qte(r.enceintesDeLaRecrue)} ${c.unites} de plus, quand il en fallait ${qte(r.enceintesPourSePayer)} pour la payer.`
                : `Non : elle ${r.enceintesDeLaRecrue > 0 ? "fait vendre assez pour se payer" : "ne fait vendre aucune enceinte de plus"}.`,
          },
          {
            texte: "Elle se paie : chaque opérateur en plus fait monter les ventes",
            juste: r.verdict === "se-paie",
            retour:
              r.verdict === "se-paie"
                ? `Oui : le résultat monte de ${eur(r.ecartDeLaRecrue)}.`
                : `Non : un opérateur de plus ne fait vendre que si l'équipe était le goulot. Ici, ${r.enceintesDeLaRecrue > 0 ? `les ${qte(r.enceintesDeLaRecrue)} ${c.unites} de plus ne couvrent pas les ${eur(r.coutDeLaRecrue)} de l'embauche` : `aucune vente de plus ne vient couvrir ses ${eur(r.coutDeLaRecrue)}`}.`,
          },
        ];
      },
    },
    {
      id: "les-ventes-qui-paient-l-embauche",
      objectifs: [1],
      type: "curseur",
      titre: "Les ventes qui paient l'embauche",
      notions: ["contribution_margin", "payroll"],
      sens: "plus-petite",
      question: (c) => {
        const r = recrutement(c);
        return `Si la recrue faisait vendre des ${c.unites} de plus, combien en faudrait-il ? Faites varier les ventes en plus : une droite donne la marge qu'elles laissent, à ${eur(r.marge)} l'${c.unite}, l'autre le coût de l'embauche sur l'année. Placez le curseur sur le plus petit nombre d'${c.unites} qui la paie.`;
      },
      grandeur: (c) => ({ libelle: "Ventes en plus dans l'année", unite: c.unites }),
      cible: () => ({ attendu: recrutement().enceintesPourSePayer, max: 3_000 }),
      zones: ["L'embauche se paie", "L'embauche coûte plus qu'elle ne rapporte"],
      rates: () => ({ dessous: "À ces ventes, la marge ne couvre pas l'embauche.", dessus: "L'embauche se paie, mais avec moins de ventes aussi : cherchez le plus petit nombre." }),
      montrer: "Montrer les ventes",
      lecture: (_c, q) => {
        const r = recrutement();
        return [
          { libelle: "Marge des ventes en plus", montant: q * r.marge, fort: true },
          { libelle: "Coût de l'embauche sur l'année", montant: r.coutDeLaRecrue },
        ];
      },
      droites: () => {
        const r = recrutement();
        return { produit: (q) => q * r.marge, cout: () => r.coutDeLaRecrue, libelles: ["Marge des ventes en plus", "Coût de l'embauche"] };
      },
      explication: (c) => {
        const r = recrutement(c);
        const q = r.enceintesPourSePayer;
        return [
          `À ${qte(q)} ${c.unites}, la marge fait ${eur(q * r.marge)} et couvre les ${eur(r.coutDeLaRecrue)} de l'embauche ; à ${qte(q - 1)}, elle n'en fait que ${eur((q - 1) * r.marge)}.`,
          `Pour se payer, la recrue devait donc faire vendre au moins ${qte(q)} ${c.unites} que l'équipe ne pouvait pas monter. Elle fait vendre ${enPlus(r.enceintesDeLaRecrue)} : ${r.enceintesDeLaRecrue >= q ? "elle se paie" : "le compte n'y est pas"}.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-atelier",
      objectifs: [2],
      type: "simulation",
      titre: "Servir toute la demande",
      notions: ["capacity", "payroll"],
      question: (c) => {
        const r = recrutement(c);
        return `Au printemps et à Noël, ${qte(r.refusees)} ${c.unites} demandées ne seront pas servies. Un cinquième poste sur la ligne coûte ${eur(r.machine.prix)} et monte ${qte(r.machine.capaciteEnPlus)} ${c.unites} de plus par trimestre, s'il y a quelqu'un pour le tenir. Choisissez la ligne et l'équipe, et regardez les ${c.unites} refusées.`;
      },
      leviers: () => [
        { code: "poste", libelle: "La ligne", unite: "", min: 0, max: 1, pas: 1, depart: 0, choix: NOMS_DES_POSTES.map((libelle, valeur) => ({ valeur, libelle })) },
        {
          code: "embauche",
          libelle: "L'équipe",
          unite: "",
          min: 0,
          max: 1,
          pas: 1,
          depart: 1,
          choix: [
            { valeur: 0, libelle: "Les 4 opérateurs" },
            { valeur: 1, libelle: "Une recrue de plus" },
          ],
        },
      ],
      lecture: (_c, p) => {
        const r = recrutementDeNPlus1({ poste: p.poste as 0 | 1, embauche: p.embauche as 0 | 1 });
        const d = recrutementDeNPlus1({ poste: 0, embauche: 1 });
        return [
          { libelle: "Enceintes montées dans l'année", montant: r.joue.production, unite: "enceintes", reference: d.joue.production },
          { libelle: "Enceintes refusées", montant: r.refusees, unite: "enceintes", reference: d.refusees, fort: true },
          { libelle: "Marge gagnée face au plan", montant: r.margeEnPlus, effet: true },
          { libelle: "Coût de la recrue et du poste dans l'année", montant: Math.round((r.coutDeLaRecrue + r.coutDuPoste) * 100) / 100 },
        ];
      },
      defi: () => ({
        consigne: "Trouvez la ligne et l'équipe qui servent toute la demande prévue de N + 1.",
        atteint: (p) => recrutementDeNPlus1({ poste: p.poste as 0 | 1, embauche: p.embauche as 0 | 1 }).refusees === 0,
        indice: (p) => {
          const r = recrutementDeNPlus1({ poste: p.poste as 0 | 1, embauche: p.embauche as 0 | 1 });
          const goulot = r.goulots.includes("outil") ? "la ligne" : "l'équipe";
          return `${qte(r.refusees)} enceintes sont encore refusées : c'est ${goulot} qui les borne.`;
        },
        solution: { poste: 1, embauche: 1 },
      }),
      explication: (c) => {
        const r = recrutementDeNPlus1({ poste: 1, embauche: 1 });
        const seul = recrutementDeNPlus1({ poste: 1, embauche: 0 });
        return [
          `Défi relevé : avec un cinquième poste et une recrue, toute la demande est servie, ${qte(r.enceintesEnPlus)} ${c.unites} de plus que le plan. Le poste seul n'en sert que ${qte(seul.enceintesEnPlus)} de plus : l'équipe devient alors le goulot.`,
          `Servir tous les clients a un prix : ${eur(r.margeEnPlus)} de marge gagnée, pour ${eur(r.coutDeLaRecrue + r.coutDuPoste)} de recrue et de poste dans l'année. Une embauche se décide avec l'outil, et sur ce qu'elle rapporte.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const r = recrutement(c);
        return [
          `Chez ${c.entreprise}, une embauche lancée en ${mois(r.lancement)} coûte ${eur(r.coutDeLaRecrue)} sur l'année et devrait faire vendre ${qte(r.enceintesPourSePayer)} ${c.unites} de plus pour se payer ; seule, elle fait vendre ${enPlus(r.enceintesDeLaRecrue)}.`,
          "Recruter se décide sur ce qui limite l'activité : si ce sont les clients ou l'outil, un salarié de plus n'ajoute qu'une charge. Et l'embauche se prépare tôt : elle coûte dès qu'on la décide, et la recrue n'arrive qu'une fois le recrutement fait.",
        ];
      },
      repere: () => "Ventes à faire en plus = coût de l'embauche ÷ marge d'une unité.",
    },
  ],
};
