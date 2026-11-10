import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CONSULTANTS } from "../monde/atlas-conseil";
import {
  JOURNEES_OU_L_EMBAUCHE_SE_PAIE,
  JOURNEE_D_UN_INDEPENDANT,
  JOURS_D_UN_CONSULTANT,
  MARGE_D_UNE_JOURNEE,
  activiteDAtlas,
  servirLeTrimestre4,
} from "../monde/liens-de-travail-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : QUALIFICATION, COMPÉTENCES ET NOUVEAUX LIENS DE TRAVAIL (Bac STMG, sciences de gestion et
 * numérique de première, thème 1, question 3 : « Comment concilier une gestion efficace des ressources
 * humaines et le coût du travail ? »).
 *
 * Les chapitres de ressources humaines du cours chiffrent déjà le salaire, la masse salariale, le
 * recrutement, la formation et les indicateurs sociaux. Celui-ci apporte ce que l'audit y trouvait
 * absent : l'approche par la qualification ou par la compétence, les nouveaux liens de travail (salarié,
 * intérimaire, indépendant, portage), le choix d'internaliser ou d'externaliser, le lien entre
 * conditions de travail et comportements, et le conflit qui cherche un consensus. Il se joue chez ATLAS
 * CONSEIL, dont le trimestre 4 est plein : 80 journées refusées. Embaucher un onzième consultant, ou
 * confier des journées à des indépendants ? Un curseur (les journées par an à partir desquelles
 * l'embauche coûte moins) et un laboratoire (servir le trimestre 4 et gagner de l'argent).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez ATLAS CONSEIL seule : ses consultants, leurs journées et
 * leur coût sont ceux de la fiche (atlas-conseil.ts) ; le prix d'une journée d'indépendant est une
 * hypothèse du cours, dite dans monde/liens-de-travail-d-atlas.ts.
 */

export const ENTREPRISES_DES_LIENS_DE_TRAVAIL = ["conseil"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

function tableauDeBord(c: Cas): TableauDeDonnees {
  const k = activiteDAtlas();
  return {
    titre: `L'activité des consultants ${dE(c.entreprise)} en N`,
    colonnes: k.trimestres.map((t) => `T${t.numero}`),
    lignes: [
      { libelle: "Journées demandées", valeurs: k.trimestres.map((t) => qte(t.demandees)) },
      { libelle: "Journées vendues", valeurs: k.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Journées que l'équipe peut faire", valeurs: k.trimestres.map(() => qte(k.capacite)) },
    ],
  };
}

export const QUALIFICATION_COMPETENCES_ET_LIENS_DE_TRAVAIL: Chapitre = {
  code: "qualification-competences-et-liens-de-travail",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · De l'individu à l'acteur"],
  titre: "Qualification, compétences et nouveaux liens de travail",
  accroche:
    "Un cabinet de conseil refuse des missions en fin d'année, faute de consultants. Embaucher un salarié de plus, ou confier ces journées à des indépendants ? Ce que coûte chaque lien de travail, et ce qu'il change pour l'équipe.",
  objectifs: [
    "Distinguer la qualification de la compétence",
    "Reconnaître les liens de travail : salarié, intérimaire, indépendant, portage",
    "Lire les indicateurs d'activité d'une équipe et ce qu'ils disent des conditions de travail",
    "Chiffrer le choix entre embaucher et faire appel à un indépendant",
    "Repérer un conflit et la voie d'un consensus",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_LIENS_DE_TRAVAIL,
    pourquoi: "ce chapitre suit les consultants d'ATLAS CONSEIL, dont le cours tient les journées, le prix et le coût.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un trimestre plein",
      notions: ["productivity"],
      tableau: tableauDeBord,
      texte: (c) => {
        const k = activiteDAtlas();
        return [
          `${c.entreprise} vend des journées de conseil et de formation. Ses ${qte(CONSULTANTS.nombre)} consultants sont salariés : chacun coûte ${eur(CONSULTANTS.coutAnnuel)} par an, salaire et cotisations, et peut facturer ${qte(JOURS_D_UN_CONSULTANT)} jours dans l'année.`,
          `Au dernier trimestre, l'équipe a fait toutes les journées qu'elle pouvait, et ${qte(k.trimestres[3]!.refusees)} journées demandées ont été refusées. Faut-il un consultant de plus ? Pas forcément salarié : le travail se fait aussi avec des intérimaires, des indépendants, des consultants portés. Chaque lien de travail a son coût, et ses effets sur l'équipe.`,
        ];
      },
      repere: () => "Gérer les ressources humaines, c'est avoir les compétences qu'il faut, quand il le faut, à un coût du travail que l'activité paie.",
    },
    {
      id: "qualification-ou-competence",
      objectifs: [0],
      type: "tri",
      titre: "Qualification ou compétence",
      question: () => "Le cabinet recrute. Rangez chaque élément du dossier d'une candidate : relève-t-il de sa qualification, ou de ses compétences ?",
      categories: [
        { code: "qualification", libelle: "Qualification" },
        { code: "competence", libelle: "Compétence" },
      ],
      elements: () => [
        { libelle: "Un master en gestion des ressources humaines", montant: 0, categorie: "qualification", pourquoi: "Un diplôme atteste un niveau de savoirs : il fonde la qualification." },
        { libelle: "Le niveau de classification prévu par la convention collective", montant: 0, categorie: "qualification", pourquoi: "La classification range le poste et fixe le salaire minimal : c'est la qualification reconnue." },
        { libelle: "Animer un atelier de 12 managers qui ne se connaissent pas", montant: 0, categorie: "competence", pourquoi: "Une capacité mise en œuvre en situation, qui se constate à l'œuvre : une compétence." },
        { libelle: "Rédiger un diagnostic qu'un client accepte sans retouche", montant: 0, categorie: "competence", pourquoi: "Un résultat obtenu au travail : une compétence, que le diplôme ne garantit pas." },
      ],
      relance: "Demandez-vous : est-ce un titre ou un rang qu'on lui reconnaît, ou ce qu'elle sait faire en situation ?",
      explication: () => [
        "La qualification se lit sur un diplôme et une classification : elle est stable, et elle fixe le salaire minimal. La compétence se lit au travail : elle évolue, se développe par la formation et l'expérience. Un cabinet qui vend des missions recrute de plus en plus sur les compétences.",
      ],
    },
    {
      id: "les-liens-de-travail",
      objectifs: [1],
      type: "tri",
      titre: "Les liens de travail",
      question: () => "Rangez chaque personne qui pourrait faire les journées en plus : est-elle salariée (sous l'autorité d'un employeur), ou travaille-t-elle à son compte ?",
      categories: [
        { code: "salarie", libelle: "Salariée" },
        { code: "independant", libelle: "À son compte" },
      ],
      elements: (c) => [
        { libelle: `Un consultant embauché en contrat à durée indéterminée par ${c.entreprise}`, montant: 0, categorie: "salarie", pourquoi: "Un contrat de travail, un employeur, un salaire : le lien de subordination." },
        { libelle: "Une consultante en contrat à durée déterminée de 6 mois", montant: 0, categorie: "salarie", pourquoi: "Le CDD est un contrat de travail, limité dans le temps : elle est salariée du cabinet." },
        { libelle: "Un formateur envoyé par une agence d'intérim", montant: 0, categorie: "salarie", pourquoi: "L'intérimaire est salarié de l'agence, qui le met à disposition du cabinet." },
        { libelle: "Une consultante en portage salarial", montant: 0, categorie: "salarie", pourquoi: "Elle trouve ses missions seule, mais la société de portage la salarie et facture le cabinet." },
        { libelle: "Un consultant installé en micro-entreprise", montant: 0, categorie: "independant", pourquoi: "Il facture ses journées, choisit ses clients et son organisation : il n'a pas d'employeur." },
      ],
      relance: "Demandez-vous : a-t-elle un employeur qui lui verse un salaire, ou facture-t-elle elle-même son travail ?",
      explication: () => [
        "Le salariat reste la règle, mais il prend des formes plus souples (CDD, intérim, portage), et le travail indépendant grandit. Pour l'organisation, ces liens changent le coût (payé toute l'année ou à la mission), la souplesse, et ce que la personne sait de l'entreprise et de ses clients.",
      ],
    },
    {
      id: "l-activite-de-l-equipe",
      objectifs: [2],
      type: "montants",
      titre: "Le tableau de bord de l'équipe",
      notions: ["productivity", "dashboard"],
      tableau: tableauDeBord,
      question: () => "Calculez le taux d'occupation des consultants au trimestre 3 et au trimestre 4 (journées vendues ÷ journées que l'équipe peut faire, en %), et le coût d'une journée de consultant salarié (son coût de l'année ÷ ses jours facturables).",
      champs: () => {
        const k = activiteDAtlas();
        const t3 = k.trimestres[2]!;
        const t4 = k.trimestres[3]!;
        return [
          { libelle: "Taux d'occupation au trimestre 3 (%)", attendu: t3.occupationPct, calcul: `${qte(t3.vendues)} ÷ ${qte(k.capacite)} × 100 = ${pct(t3.occupationPct)}`, tolerance: 0.1 },
          { libelle: "Taux d'occupation au trimestre 4 (%)", attendu: t4.occupationPct, calcul: `${qte(t4.vendues)} ÷ ${qte(k.capacite)} × 100 = ${pct(t4.occupationPct)}`, tolerance: 0.1 },
          { libelle: "Coût d'une journée de consultant salarié", attendu: k.coutJournalier, calcul: `${eur(CONSULTANTS.coutAnnuel)} ÷ ${qte(JOURS_D_UN_CONSULTANT)} = ${eur(k.coutJournalier)}` },
        ];
      },
      explication: () => {
        const k = activiteDAtlas();
        return [
          `L'été, l'équipe n'est occupée qu'à ${pct(k.trimestres[2]!.occupationPct)} ; en fin d'année, à ${pct(k.trimestres[3]!.occupationPct)}. Une journée de salarié coûte ${eur(k.coutJournalier)} quand elle est vendue, mais le salaire se paie aussi les jours sans mission : c'est le coût du travail d'un salarié, fixe sur l'année.`,
        ];
      },
    },
    {
      id: "conditions-de-travail",
      objectifs: [2],
      type: "choix",
      titre: "Un trimestre à 100 %",
      question: () =>
        "Au trimestre 4, les consultants ont enchaîné les missions sans un jour de préparation ; deux arrêts maladie et une démission ont suivi en janvier. Que montre le tableau de bord ?",
      options: () => [
        { texte: "Des conditions de travail qui pèsent sur les comportements", juste: true, retour: "Oui : une charge sans répit use l'équipe. La fatigue, l'absentéisme et les départs sont des comportements qui répondent aux conditions de travail, et ils coûtent : des missions à reporter, un recrutement à faire." },
        { texte: "Une équipe très productive, qu'il faut féliciter et garder à ce rythme", juste: false, retour: "Non : vendre toutes les journées est un bon chiffre, mais tenir ce rythme fait partir des consultants. Un indicateur d'activité se lit avec les indicateurs sociaux." },
        { texte: "Rien sur l'équipe : les arrêts maladie relèvent de la vie privée", juste: false, retour: "Non : une hausse de l'absentéisme après un trimestre surchargé est un signal que l'organisation doit lire." },
      ],
    },
    {
      id: "embaucher-ou-externaliser",
      objectifs: [3],
      type: "choix",
      titre: "Internaliser ou externaliser",
      question: (c) =>
        `Pour les journées en plus, ${c.entreprise} peut embaucher un onzième consultant (internaliser), ou les confier à des indépendants, à ${eur(JOURNEE_D_UN_INDEPENDANT)} la journée (externaliser). Qu'est-ce qui distingue les deux coûts ?`,
      options: () => [
        { texte: "Le salarié coûte toute l'année ; l'indépendant, à la journée", juste: true, retour: `Oui : le salarié coûte ${eur(CONSULTANTS.coutAnnuel)}, qu'il ait des missions ou non ; l'indépendant ne coûte que les journées commandées, plus cher l'une que l'autre. Le bon choix dépend du nombre de journées à faire dans l'année.` },
        { texte: "L'indépendant coûte toujours moins, puisqu'il n'y a pas de cotisations à payer", juste: false, retour: `Non : sa journée coûte ${eur(JOURNEE_D_UN_INDEPENDANT)}, plus que celle d'un salarié occupé, car il paie lui-même ses cotisations et ses jours sans mission.` },
        { texte: "Le salarié coûte toujours moins, puisque sa journée revient moins cher", juste: false, retour: "Non : sa journée revient moins cher seulement s'il est occupé. Payé l'été sans mission, il coûte plus qu'il ne rapporte." },
      ],
    },
    {
      id: "quand-l-embauche-se-paie",
      objectifs: [3],
      type: "curseur",
      titre: "À partir de combien de journées ?",
      notions: ["make_or_buy"],
      sens: "plus-petite",
      question: () =>
        `Faites varier les journées en plus à faire dans l'année : une droite donne ce qu'elles coûteraient confiées à des indépendants, l'autre le coût d'un consultant salarié de plus. Placez le curseur sur le plus petit nombre de journées à partir duquel l'embauche coûte moins que les indépendants.`,
      grandeur: () => ({ libelle: "Journées en plus dans l'année", unite: "journées" }),
      cible: () => ({ attendu: JOURNEES_OU_L_EMBAUCHE_SE_PAIE, max: JOURS_D_UN_CONSULTANT }),
      zones: ["L'embauche coûte moins", "Les indépendants coûtent moins"],
      rates: () => ({ dessous: "À ce nombre de journées, les indépendants coûtent encore moins qu'un salarié.", dessus: "L'embauche coûte déjà moins avec moins de journées : cherchez plus bas." }),
      montrer: "Montrer les journées",
      lecture: (_c, j) => [
        { libelle: "Journées confiées à des indépendants", montant: j * JOURNEE_D_UN_INDEPENDANT },
        { libelle: "Un consultant salarié de plus", montant: CONSULTANTS.coutAnnuel },
        { libelle: "Ce que l'embauche économise", montant: j * JOURNEE_D_UN_INDEPENDANT - CONSULTANTS.coutAnnuel, fort: true },
      ],
      droites: () => ({ produit: (j) => j * JOURNEE_D_UN_INDEPENDANT, cout: () => CONSULTANTS.coutAnnuel, libelles: ["Journées confiées à des indépendants", "Un consultant salarié de plus"] }),
      explication: () => [
        `À ${qte(JOURNEES_OU_L_EMBAUCHE_SE_PAIE)} journées, les indépendants coûteraient ${eur(JOURNEES_OU_L_EMBAUCHE_SE_PAIE * JOURNEE_D_UN_INDEPENDANT)}, autant que le salarié : au-delà, embaucher coûte moins. En deçà, mieux vaut externaliser.`,
        `Ce n'est pas tout le choix : un salarié connaît les clients et la méthode du cabinet, se forme, reste ; un indépendant apporte de la souplesse, mais ses compétences repartent avec lui.`,
      ],
    },
    {
      id: "servir-le-trimestre-4",
      objectifs: [3],
      type: "simulation",
      titre: "Servir la fin d'année",
      notions: ["make_or_buy", "capacity"],
      question: (c) => {
        const r = servirLeTrimestre4(0, 0).refusees;
        return `Les ${qte(r)} journées refusées du trimestre 4 laissent chacune ${eur(MARGE_D_UNE_JOURNEE)} une fois payés les frais et les supports. Un consultant salarié de plus en fait ${qte(CONSULTANTS.joursFacturablesParTrimestre)} au trimestre, mais coûte toute son année ; les trimestres 1 à 3 ${dE(c.entreprise)} avaient déjà de la place. Choisissez les embauches et les journées confiées à des indépendants.`;
      },
      leviers: () => [
        { code: "embauches", libelle: "Consultants salariés embauchés", unite: "", min: 0, max: 1, pas: 1, depart: 0, choix: [{ valeur: 0, libelle: "Aucun" }, { valeur: 1, libelle: "Un de plus" }] },
        { code: "independants", libelle: "Journées confiées à des indépendants", unite: "journées", min: 0, max: 80, pas: 20, depart: 0 },
      ],
      lecture: (_c, p) => {
        const k = servirLeTrimestre4(p.embauches!, p.independants!);
        return [
          { libelle: "Journées encore refusées", montant: k.encoreRefusees, unite: "journées", reference: k.refusees, fort: true },
          { libelle: "Marge des journées servies", montant: k.marge },
          { libelle: "Coût des embauches et des indépendants", montant: k.cout },
          { libelle: "Gain", montant: k.gain, effet: true },
        ];
      },
      defi: () => ({
        consigne: "Servez toutes les journées refusées, et que le gain soit positif.",
        atteint: (p) => {
          const k = servirLeTrimestre4(p.embauches!, p.independants!);
          return k.encoreRefusees === 0 && k.gain > 0;
        },
        indice: (p) => {
          const k = servirLeTrimestre4(p.embauches!, p.independants!);
          if (k.encoreRefusees > 0) return `${qte(k.encoreRefusees)} journées restent refusées.`;
          return `Toutes les journées sont servies, mais le gain est de ${eur(k.gain)} : un salarié payé toute l'année pour un seul trimestre plein coûte trop.`;
        },
        solution: { embauches: 0, independants: 80 },
      }),
      explication: () => {
        const k = servirLeTrimestre4(0, 80);
        const e = servirLeTrimestre4(1, 20);
        return [
          `Défi relevé : ${qte(k.servies)} journées confiées à des indépendants coûtent ${eur(k.cout)} et laissent ${eur(k.marge)} de marge, soit ${eur(k.gain)} de gain. Avec un salarié de plus et ${qte(20)} journées d'indépendants, le gain serait de ${eur(e.gain)}.`,
          "Une pointe d'activité se sert mieux en externalisant ; une hausse durable, au-delà du seuil du curseur, justifie une embauche.",
        ];
      },
    },
    {
      id: "le-conflit",
      objectifs: [4],
      type: "choix",
      titre: "Un conflit, un consensus",
      question: () =>
        "Les commerciaux veulent signer toutes les missions de fin d'année ; les consultants refusent de dépasser leurs jours facturables. La présidente réunit les deux équipes. Quelle issue fait un consensus ?",
      options: () => [
        { texte: "Un plafond de jours par consultant, le reste confié à des indépendants", juste: true, retour: "Oui : chacun y trouve une part de ce qu'il défend. Les commerciaux signent, les consultants gardent un rythme tenable, et le cabinet paie le surplus à la journée. Un consensus naît d'une négociation, pas d'une victoire." },
        { texte: "La présidente tranche pour les commerciaux : les ventes passent d'abord", juste: false, retour: "Non : c'est une décision d'autorité, qui laisse le conflit entier, et l'usure de l'équipe s'aggrave." },
        { texte: "Refuser toutes les missions en plus : la santé des consultants passe d'abord, sans discussion", juste: false, retour: "Non : c'est l'autre camp qui l'emporte, et le cabinet perd des clients. Le consensus cherche une issue que les deux acceptent." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Chez ${c.entreprise}, la qualification se lit sur le diplôme et la classification, la compétence au travail. Les liens de travail se sont diversifiés : salarié en CDI ou en CDD, intérimaire, consultant porté, indépendant. Chacun a son coût : le salarié coûte toute l'année, l'indépendant à la journée, et l'embauche ne se paie qu'au-delà de ${qte(JOURNEES_OU_L_EMBAUCHE_SE_PAIE)} journées par an.`,
        "Le tableau de bord de l'activité se lit avec les conditions de travail : une équipe à 100 % s'use, et ses comportements le disent. Les intérêts des commerciaux et des consultants divergent ; une négociation peut en faire un consensus. Dans l'arène, le cabinet décide de ses embauches à chaque tour.",
      ],
      repere: () => "Internaliser quand l'activité est durable et proche du métier ; externaliser une pointe ou une activité annexe. Le coût du travail se juge avec ce que l'équipe vit.",
    },
  ],
};
