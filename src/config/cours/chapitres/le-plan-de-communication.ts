import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { HAUT_VERDASSE_HANDBALL } from "../monde/haut-verdasse-handball";
import {
  ACTIONS_DE_LA_RENTREE,
  ANNONCE_DE_LA_RENTREE,
  CAMPAGNE_DE_LA_RENTREE,
  PARRAINAGE_DU_CLUB,
  adherentDeLaSalle,
  adhesionsQuiPaient,
  campagneAvec,
  meilleurSupport,
  supportsLus,
} from "../monde/volt-fitness";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PLAN DE COMMUNICATION, OBJECTIFS, CIBLES, MÉDIAS, COPY STRATEGY (Bac STMG, mercatique de
 * terminale, thème 3, question 3.1 : « Quelle visibilité et quels médias pour valoriser l'offre ? »).
 *
 * « Ce que rapporte la communication » chiffre un budget de publicité chez NOVA. Ce chapitre construit
 * la campagne elle-même, chez VOLT FITNESS, pour la rentrée : son objectif (faire connaître, faire aimer,
 * faire agir), sa cible (le cœur, la cible principale, les relais), ses moyens (les médias, le marketing
 * direct, la promotion des ventes, le parrainage, le mécénat, l'événement), le choix d'un support sur son
 * coût et sur sa cible, la copy strategy de l'annonce, et le nombre d'adhésions qui paie la campagne (le
 * curseur). Le parrainage et le mécénat se jouent avec le Handball Club du Haut-Verdasse.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/volt-fitness.ts), chez VOLT FITNESS seule : l'abonnement,
 * son coût et la publicité du cas figé ; la campagne, les supports et l'annonce sont des hypothèses
 * nommées dans la fiche.
 */

export const ENTREPRISES_DE_LA_SALLE = ["fitness"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

function lesSupports(): TableauDeDonnees {
  const s = supportsLus();
  return {
    titre: "Les supports proposés pour la rentrée",
    colonnes: ["Prix", "Contacts", "Dans la cible"],
    lignes: s.map((x) => ({ libelle: `${x.media} : ${x.nom}`, valeurs: [eur(x.prix), qte(x.contacts), pct(x.partDansLaCible * 100)] })),
  };
}

export const LE_PLAN_DE_COMMUNICATION: Chapitre = {
  code: "le-plan-de-communication",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 3 · La communication de l'offre"],
  titre: "Le plan de communication : objectifs, cibles, médias, copy strategy",
  accroche:
    "Une salle de sport prépare sa rentrée. Que veut-elle obtenir, de qui, par quels moyens et avec quel message ? Et combien d'adhésions la campagne doit-elle faire pour se payer ?",
  objectifs: [
    "Fixer l'objectif et la cible d'une communication",
    "Distinguer les moyens : médias, marketing direct, promotion, parrainage, mécénat, événement",
    "Choisir un support sur son coût et sur sa cible",
    "Lire la copy strategy d'une annonce",
    "Chiffrer les adhésions qui paient une campagne",
  ],
  libre: false,
  prerequis: ["ce-que-rapporte-la-communication"],
  ensuite: ["influence-communaute-et-e-reputation"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_SALLE,
    pourquoi: "ce chapitre prépare la campagne de rentrée de VOLT FITNESS, sur ses adhérents et son abonnement.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La rentrée d'une salle de sport",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const a = adherentDeLaSalle();
        return [
          `${c.entreprise} compte ${qte(a.adherents)} adhérents, qui paient ${eur(a.prix)} hors taxes par mois ; chacun lui coûte ${eur(a.cout)} par mois en entretien, énergie et serviettes. Elle dépense ${eur(a.publiciteDuMois)} de publicité par mois.`,
          `Septembre est le mois des bonnes résolutions : la salle y consacre une campagne de ${eur(CAMPAGNE_DE_LA_RENTREE.budget)}. Un plan de communication dit ce qu'elle veut obtenir, de qui, par quels moyens, avec quel message, et comment elle le mesurera.`,
        ];
      },
      repere: () => "Le plan de communication : l'objet (ce dont on parle), l'objectif, la cible, le message, les moyens et les supports, le budget, le calendrier, le contrôle des résultats.",
    },
    {
      id: "l-objectif",
      objectifs: [0],
      type: "choix",
      titre: "Faire connaître, faire aimer, faire agir",
      notions: ["customer_acquisition_cost"],
      question: () => "La salle veut que des habitants viennent à sa journée portes ouvertes et s'inscrivent en septembre. Quel est l'objectif de la campagne ?",
      options: () => [
        { texte: "Conatif : faire agir", juste: true, retour: "Oui : l'objectif est un comportement, venir et s'inscrire. Un objectif cognitif ferait connaître la salle ; un objectif affectif la ferait aimer." },
        { texte: "Cognitif : faire connaître la salle", juste: false, retour: "Non : la salle est déjà connue dans le territoire. Elle veut maintenant que les habitants passent la porte." },
        { texte: "Affectif : donner une image sympathique", juste: false, retour: "Non : l'image compte, mais ici, la réussite se mesure aux inscriptions." },
      ],
    },
    {
      id: "l-objet",
      objectifs: [0],
      type: "choix",
      titre: "De quoi parle-t-on",
      notions: ["brand_capital"],
      question: (c) => `Une affiche montre les adhérents de ${c.entreprise} au marathon du territoire, avec ces mots : « La salle qui fait bouger le Haut-Verdasse ». Elle ne parle d'aucun abonnement. Quel est l'objet de cette communication ?`,
      options: () => [
        { texte: "La salle elle-même, son image", juste: true, retour: "Oui : c'est une communication institutionnelle (ou corporate) : elle parle de l'organisation, de ses valeurs, pour la faire aimer. Une communication commerciale parlerait d'une offre : un abonnement, un prix, une séance d'essai." },
        { texte: "Un abonnement, à un prix donné", juste: false, retour: "Non : l'affiche ne cite aucune offre. Parler d'un abonnement et de son prix, ce serait une communication commerciale, sur le produit." },
        { texte: "Le marathon, qui a ses propres organisateurs", juste: false, retour: "Non : le marathon est le décor. Ce que l'affiche met en valeur, c'est la salle et ce qu'elle apporte au territoire." },
      ],
    },
    {
      id: "la-cible",
      objectifs: [0],
      type: "choix",
      titre: "À qui parler",
      notions: ["segmentation"],
      question: () => "Les comités d'entreprise du territoire recommandent la salle à leurs salariés. Pour la campagne, que sont-ils ?",
      options: () => [
        { texte: "Une cible relais, des prescripteurs", juste: true, retour: "Oui : ils n'adhèrent pas eux-mêmes, mais ils influencent ceux qui adhèrent. On leur parle pour qu'ils parlent de la salle." },
        { texte: "Le cœur de cible, ceux qui adhèrent", juste: false, retour: `Non : le cœur de cible, ce sont les personnes que la salle veut voir s'inscrire, ${CAMPAGNE_DE_LA_RENTREE.cible}.` },
        { texte: "Des concurrents de la salle", juste: false, retour: "Non : un comité d'entreprise ne vend pas de séances de sport. Il est un intermédiaire utile." },
      ],
    },
    {
      id: "les-moyens",
      objectifs: [1],
      type: "tri",
      titre: "Les moyens de communication",
      notions: ["customer_acquisition_cost"],
      question: () => "Rangez chaque action envisagée pour la rentrée sous le moyen de communication qu'elle emploie.",
      categories: [
        { code: "media", libelle: "Un média (publicité)" },
        { code: "marketing-direct", libelle: "Le marketing direct" },
        { code: "promotion", libelle: "La promotion des ventes" },
        { code: "parrainage", libelle: "Le parrainage" },
        { code: "mecenat", libelle: "Le mécénat" },
        { code: "evenement", libelle: "L'événement" },
      ],
      elements: () => ACTIONS_DE_LA_RENTREE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.moyen, pourquoi: x.pourquoi })),
      relance: "Le message est-il payé et vu par tous, envoyé à une personne, ou fait-il vivre quelque chose ? Attend-on une contrepartie ?",
      explication: () => ["La publicité dans les médias touche beaucoup de monde, sans savoir qui. Le hors-média (marketing direct, promotion, parrainage, mécénat, événement) touche moins de monde, mais de plus près."],
    },
    {
      id: "media-et-support",
      objectifs: [1],
      type: "choix",
      titre: "Un média, un support",
      notions: ["customer_acquisition_cost"],
      question: () => "La salle hésite entre la radio et l'affichage. Elle choisit la radio locale du Haut-Verdasse. Qu'est-ce qui est le média, et qu'est-ce qui est le support ?",
      options: () => [
        { texte: "Média : la radio ; support : la station", juste: true, retour: "Oui : le média est la famille (la radio, la presse, l'affichage, internet) ; le support est le titre précis qui diffuse le message (cette station, ce journal, ces abribus)." },
        { texte: "La station est le média, le spot le support", juste: false, retour: "Non : le spot est le message. La station est le support, la radio le média." },
        { texte: "Les deux mots disent la même chose", juste: false, retour: "Non : on choisit d'abord un média, puis, dans ce média, les supports qui touchent la cible." },
      ],
    },
    {
      id: "le-cout-pour-mille",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûtent mille contacts",
      notions: ["customer_acquisition_cost"],
      tableau: lesSupports,
      question: () => "Le coût pour mille contacts compare des supports de tailles différentes : le prix, divisé par les contacts, multiplié par mille. Calculez-le pour les abribus, puis pour la radio.",
      champs: () => {
        const [abribus, radio] = supportsLus();
        return [
          { libelle: "Coût pour mille, abribus", attendu: abribus!.coutPourMille, calcul: `${eur(abribus!.prix)} ÷ ${qte(abribus!.contacts)} × 1 000 = ${eur(abribus!.coutPourMille)}` },
          { libelle: "Coût pour mille, radio", attendu: radio!.coutPourMille, calcul: `${eur(radio!.prix)} ÷ ${qte(radio!.contacts)} × 1 000 = ${eur(radio!.coutPourMille)}` },
        ];
      },
      explication: () => {
        const [abribus, radio] = supportsLus();
        return [`La radio coûte ${eur(radio!.coutPourMille)} pour mille contacts, les abribus ${eur(abribus!.coutPourMille)}. Mais un contact ne vaut que s'il est dans la cible : il faut regarder qui est touché.`];
      },
    },
    {
      id: "le-bon-support",
      objectifs: [2],
      type: "choix",
      titre: "Toucher la cible au meilleur coût",
      notions: ["customer_acquisition_cost", "segmentation"],
      tableau: lesSupports,
      question: () => `Quel support touche la cible, ${CAMPAGNE_DE_LA_RENTREE.cible}, au plus bas coût, une fois comptée la part des contacts qui sont dans la cible ?`,
      options: () => {
        const s = supportsLus();
        const m = meilleurSupport();
        const radio = s.find((x) => x.code === "radio")!;
        const autre = s.find((x) => x.code !== m.code && x.code !== radio.code)!;
        return [
          { texte: `${m.media} : ${minuscule(m.nom)}`, juste: true, retour: `Oui : ${qte(m.utiles)} contacts dans la cible, pour ${eur(m.coutPourMilleUtiles)} les mille, contre ${eur(radio.coutPourMilleUtiles)} pour la radio. Le support le moins cher pour mille contacts n'est pas le moins cher pour toucher la cible.` },
          { texte: `${radio.media} : le coût pour mille le plus bas du tableau`, juste: false, retour: `Non : seuls ${pct(radio.partDansLaCible * 100)} de ses auditeurs sont dans la cible. Pour mille contacts utiles, elle coûte ${eur(radio.coutPourMilleUtiles)}.` },
          { texte: `${autre.media} : ${minuscule(autre.nom)}`, juste: false, retour: `Non : ${qte(autre.utiles)} contacts dans la cible, à ${eur(autre.coutPourMilleUtiles)} les mille.` },
        ];
      },
    },
    {
      id: "la-copy-strategy",
      objectifs: [3],
      type: "choix",
      titre: "La copy strategy de l'annonce",
      notions: ["brand_capital"],
      question: () => {
        const a = ANNONCE_DE_LA_RENTREE;
        return `La copy strategy fixe ce que l'annonce dit et comment : la promesse, la preuve, le ton. Dans l'annonce de la rentrée, laquelle de ces phrases est la preuve ? « ${a.promesse} » « ${a.preuve} » « ${a.ton} »`;
      },
      options: () => {
        const a = ANNONCE_DE_LA_RENTREE;
        return [
          { texte: a.preuve, juste: true, retour: "Oui : la preuve rend la promesse crédible, par des faits : des coachs diplômés, des horaires larges." },
          { texte: a.promesse, juste: false, retour: "Non : c'est la promesse, le bénéfice que l'annonce fait espérer au client." },
          { texte: a.ton, juste: false, retour: "Non : c'est le ton, la façon de parler et de montrer, qui donne son style à l'annonce." },
        ];
      },
    },
    {
      id: "parrainage-ou-mecenat",
      objectifs: [1],
      type: "choix",
      titre: "Soutenir le club : parrainage ou mécénat",
      notions: ["brand_capital"],
      question: () => `La salle verse ${eur(PARRAINAGE_DU_CLUB.montantParSaison)} par saison au ${HAUT_VERDASSE_HANDBALL.nom}, une association, et son logo paraît sur les maillots. Pourquoi est-ce du parrainage et non du mécénat ?`,
      options: () => [
        { texte: "Elle attend une contrepartie", juste: true, retour: "Oui : le parrainage (ou sponsoring) est un échange, un soutien contre de la visibilité. Le mécénat soutient une cause sans contrepartie publicitaire, comme le don de matériel à l'école de handball." },
        { texte: "Le club est une association", juste: false, retour: "Non : on peut parrainer une association comme faire un don à une association. C'est la contrepartie qui fait la différence." },
        { texte: "La somme dépasse un certain montant", juste: false, retour: "Non : le montant ne compte pas. Ce qui compte, c'est que la salle attende une visibilité en retour." },
      ],
    },
    {
      id: "les-adhesions-qui-paient",
      objectifs: [4],
      type: "curseur",
      titre: "Combien d'adhésions pour payer la campagne",
      notions: ["customer_acquisition_cost", "breakeven"],
      question: () => {
        const a = adherentDeLaSalle();
        return `Un nouvel adhérent laisse ${eur(a.margeDUnMois)} par mois et reste en moyenne ${qte(a.mois)} mois. Faites varier le nombre d'adhésions gagnées : une droite donne la marge qu'elles laissent, l'autre le budget de la campagne (${eur(CAMPAGNE_DE_LA_RENTREE.budget)}). Placez le curseur sur le plus petit nombre d'adhésions qui paie la campagne, puis validez.`;
      },
      grandeur: () => ({ libelle: "Adhésions gagnées", unite: "adhésions" }),
      cible: () => ({ attendu: adhesionsQuiPaient(), max: 3 * adhesionsQuiPaient() }),
      zones: ["La campagne se paie", "La campagne coûte plus qu'elle ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu d'adhésions, la campagne ne se paie pas encore.",
        dessus: "La campagne se paie, mais avec moins d'adhésions aussi : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const k = campagneAvec(n);
        return [
          { libelle: "Marge des nouveaux adhérents", montant: k.marge },
          { libelle: "Budget de la campagne", montant: k.budget },
          { libelle: "Ce que rapporte la campagne", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => campagneAvec(n).marge, cout: (n) => campagneAvec(n).budget, libelles: ["Marge des nouveaux adhérents", "Budget de la campagne"] }),
      explication: () => {
        const n = adhesionsQuiPaient();
        const a = adherentDeLaSalle();
        return [
          `À ${qte(n)} adhésions, la campagne se paie : ${qte(n)} × ${eur(a.margeDUnNouvelAdherent)} couvrent ${eur(CAMPAGNE_DE_LA_RENTREE.budget)}. C'est l'objectif chiffré à inscrire au plan, et à contrôler fin septembre.`,
          "Un objectif de communication se mesure : sans résultat à atteindre, on ne sait pas si la campagne a payé.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "segmentation"],
      texte: (c) => [
        `La campagne de ${c.entreprise} a un objectif (faire s'inscrire), une cible et ses relais, des moyens choisis sur leur coût pour toucher la cible. Son annonce a une promesse, une preuve, un ton. Et elle a un résultat à atteindre : ${qte(adhesionsQuiPaient())} adhésions pour se payer.`,
        "Dans l'arène, relevez ce que vous dépensez en publicité à chaque tour et les clients gagnés : votre communication se paie-t-elle ?",
      ],
      repere: () => "Coût pour mille = prix ÷ contacts × 1 000, à comparer sur les contacts dans la cible. Parrainage : un soutien contre une contrepartie ; mécénat : sans contrepartie.",
    },
  ],
};
