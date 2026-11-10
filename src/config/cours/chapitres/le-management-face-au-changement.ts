import { eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import {
  ENTREPRISES_DU_CHANGEMENT,
  PARTIES_PRENANTES,
  PRIX_ESSAYES,
  cyberattaque,
  empreinteDeLAnnee,
  hausseDesComposants,
  margeDuTrimestre,
  prixQuiRegule,
  type CoteDuNumerique,
  type PilierDeLaRse,
} from "../monde/changements-de-l-environnement";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE MANAGEMENT FACE AU CHANGEMENT (Bac STMG, management de première, question 1.4, palier 1).
 *
 * NOVA vit au milieu de ses parties prenantes, et son environnement bouge : un fournisseur augmente
 * ses prix, le numérique ouvre des ventes et des risques, l'écologie impose des règles et en appelle
 * d'autres. L'élève range les parties prenantes, suit une hausse des composants à travers
 * l'entreprise (l'organisation est un système complexe), cherche au laboratoire le prix qui régule le
 * mieux (la régulation managériale), chiffre le risque d'une cyberattaque et l'empreinte de l'année,
 * puis distingue ce que la loi impose de ce que la responsabilité sociétale ajoute.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : monde/changements-de-l-environnement.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les marges et les coûts de la cyberattaque attendent le
 * centime (à l'euro près, avant) ; l'emballage de l'année et sa part non valorisée sont des
 * grandeurs, au centième de kilo (au kilo près, avant) ; les taux s'écrivent à deux décimales.
 */

const qte = nombreAuCentieme;
const pct = (t: number) => pourcent(t * 100);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const COTES_DES_PARTIES_PRENANTES = [
  { code: "interne", libelle: "Partie prenante interne" },
  { code: "externe", libelle: "Partie prenante externe" },
] as const;

export const COTES_DU_NUMERIQUE: readonly { code: CoteDuNumerique; libelle: string }[] = [
  { code: "opportunite", libelle: "Une source de développement" },
  { code: "risque", libelle: "Un risque à maîtriser" },
];

export const PILIERS_DE_LA_RSE: readonly { code: PilierDeLaRse; libelle: string }[] = [
  { code: "economique", libelle: "Économique" },
  { code: "social", libelle: "Social" },
  { code: "environnemental", libelle: "Environnemental" },
];

export const LE_MANAGEMENT_FACE_AU_CHANGEMENT: Chapitre = {
  code: "le-management-face-au-changement",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · À la rencontre du management des organisations"],
  titre: "Le management face au changement",
  accroche:
    "Un fournisseur augmente ses prix, un site de vente peut tomber, l'emballage pèse sur l'environnement. Les parties prenantes, l'organisation vue comme un système, et la façon dont le management régule.",
  objectifs: [
    "Distinguer les parties prenantes internes et externes",
    "Suivre un changement à travers l'organisation, vue comme un système complexe",
    "Réguler : ajuster une décision à un changement de l'environnement",
    "Mesurer ce que les transformations numériques apportent et font risquer",
    "Distinguer les obligations écologiques et les engagements de la RSE",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CHANGEMENT,
    pourquoi: "ce chapitre suit NOVA, dont le cours tient les coûts, la demande, le site de vente et l'empreinte de l'année.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une organisation au milieu des autres",
      texte: (c) => [
        `${c.entreprise} ne vit pas seule : des salariés, des associés, des clients, un fournisseur, une banque, l'État agissent sur elle et attendent quelque chose d'elle. Ce sont ses parties prenantes, internes ou externes.`,
        "Son environnement bouge sans cesse : les prix, les technologies numériques, les règles écologiques. Un changement venu de l'une des parties prenantes se propage aux autres : l'organisation est un système complexe. Le management y répond en ajustant ses décisions pour retrouver un équilibre, financier, social, technologique, écologique : c'est la régulation.",
      ],
      repere: () => "Parties prenantes : tous ceux qui agissent sur l'organisation ou en attendent quelque chose. Internes : dans l'organisation. Externes : hors d'elle.",
    },
    {
      id: "parties-prenantes",
      objectifs: [0],
      type: "tri",
      titre: "Les parties prenantes",
      question: (c) => `Rangez chaque partie prenante ${dE(c.entreprise)} : interne ou externe ?`,
      categories: COTES_DES_PARTIES_PRENANTES,
      elements: () => PARTIES_PRENANTES.map((p) => ({ libelle: p.libelle, montant: 0, categorie: p.cote, pourquoi: p.pourquoi })),
      relance: "Cette partie prenante est-elle membre de l'entreprise, ou agit-elle sur elle de l'extérieur ?",
      explication: (c) => [
        `Chacune attend quelque chose ${dE(c.entreprise)} : un salaire, un dividende, une enceinte, une commande, un remboursement, l'impôt. Le management doit tenir compte de toutes, et elles ne veulent pas la même chose.`,
      ],
    },
    {
      id: "la-hausse-se-propage",
      objectifs: [1],
      type: "montants",
      titre: "Une hausse qui se propage",
      tableau: () => {
        const h = hausseDesComposants();
        return {
          titre: "Une enceinte, avant et après la hausse des composants",
          colonnes: ["Avant", "Après"],
          lignes: [
            { libelle: "Composants", valeurs: [eur(h.avant.composants), eur(h.apres.composants)] },
            { libelle: "Prix de vente", valeurs: [eur(h.avant.prix), eur(h.apres.prix)] },
            { libelle: "Enceintes demandées au premier trimestre", valeurs: [qte(h.avant.demande), qte(h.apres.demande)] },
          ],
        };
      },
      question: (c) => {
        const h = hausseDesComposants();
        return `Électro-Composants Lyon augmente ses composants de ${pct(h.hausse)}. Si ${c.entreprise} garde son prix, calculez le coût variable nouveau d'une enceinte (composants et autres coûts), sa marge par enceinte, puis la marge perdue sur le premier trimestre.`;
      },
      champs: () => {
        const h = hausseDesComposants();
        return [
          { libelle: "Coût variable d'une enceinte, après", attendu: h.apres.coutVariable, calcul: `${eur(h.apres.composants)} + ${eur(h.apres.coutVariable - h.apres.composants)} = ${eur(h.apres.coutVariable)}` },
          { libelle: "Marge par enceinte, après", attendu: h.apres.margeUnitaire, calcul: `${eur(h.apres.prix)} − ${eur(h.apres.coutVariable)} = ${eur(h.apres.margeUnitaire)}` },
          { libelle: "Marge perdue sur le trimestre", attendu: h.margePerdue, calcul: `${eur(h.avant.marge)} − ${eur(h.apres.marge)} = ${eur(h.margePerdue)}` },
        ];
      },
      explication: (c) => {
        const h = hausseDesComposants();
        return [
          `La décision d'un fournisseur coûte ${eur(h.margePerdue)} de marge à ${c.entreprise} sur un seul trimestre. Et cela ne s'arrête pas là : moins de marge, c'est moins pour les associés, moins pour investir, peut-être une hausse de salaire refusée. Un changement d'une partie prenante se propage à toutes les autres.`,
        ];
      },
    },
    {
      id: "reguler",
      objectifs: [2],
      type: "choix",
      titre: "Réguler",
      question: (c) => `Comment le président ${dE(c.entreprise)} peut-il réguler, c'est-à-dire retrouver un équilibre après la hausse ?`,
      options: () => [
        {
          texte: "Ajuster plusieurs décisions : renégocier, changer de fournisseur, revoir le prix",
          juste: true,
          retour: "Oui : réguler, c'est ajuster ses décisions au changement. Aucune ne suffit seule ; ensemble, elles limitent la perte. Le laboratoire chiffre l'une d'elles, le prix.",
        },
        {
          texte: "Ne rien changer : une hausse de fournisseur finit toujours par passer",
          juste: false,
          retour: "Non : sans réaction, la perte se répète chaque trimestre. Le management répond aux changements de l'environnement.",
        },
        {
          texte: "Monter le prix de toute la hausse, et plus, pour que la marge ne baisse pas du tout",
          juste: false,
          retour: "Non : les clients répondent au prix. Un prix trop haut fait partir des clients, et la marge du trimestre baisse quand même. Le laboratoire le montre.",
        },
      ],
    },
    {
      id: "le-laboratoire-du-prix",
      objectifs: [2],
      type: "simulation",
      titre: "Le prix qui régule le mieux",
      question: (c) => {
        const h = hausseDesComposants();
        return `Après la hausse, une enceinte ${dE(c.entreprise)} coûte ${eur(h.apres.coutVariable)} de coût variable. Faites varier le prix de vente : la demande du premier trimestre baisse quand le prix monte. Regardez la marge du trimestre.`;
      },
      leviers: () => [{ code: "prix", libelle: "Prix de vente d'une enceinte", unite: "€", min: PRIX_ESSAYES.min, max: PRIX_ESSAYES.max, pas: PRIX_ESSAYES.pas, depart: PRIX_ESSAYES.min }],
      lecture: (_c, p) => {
        const m = margeDuTrimestre(p.prix!);
        const h = hausseDesComposants();
        return [
          { libelle: "Enceintes demandées au trimestre", montant: m.demande, unite: "enceintes", reference: h.apres.demande },
          { libelle: "Marge par enceinte", montant: m.margeUnitaire, reference: h.apres.margeUnitaire },
          { libelle: "Marge du trimestre", montant: m.marge, reference: h.apres.marge, fort: true },
          { libelle: "Marge du trimestre avant la hausse", montant: h.avant.marge },
        ];
      },
      graphique: () => ({ levier: "prix", courbes: [{ libelle: "Marge du trimestre", valeur: (p) => margeDuTrimestre(p.prix!).marge }] }),
      defi: () => {
        const juste = prixQuiRegule();
        return {
          consigne: `Trouvez le prix, de ${eur(PRIX_ESSAYES.pas)} en ${eur(PRIX_ESSAYES.pas)}, qui rend la plus grande marge du trimestre après la hausse.`,
          atteint: (p) => p.prix === juste,
          indice: (p) => {
            const m = margeDuTrimestre(p.prix!);
            return p.prix! < juste
              ? `À ${eur(p.prix!)}, la marge du trimestre est de ${eur(m.marge)} : un prix un peu plus haut rapporterait davantage.`
              : `À ${eur(p.prix!)}, la marge du trimestre est de ${eur(m.marge)} : trop de clients partent, un prix plus bas rapporterait davantage.`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const m = margeDuTrimestre(p.prix!);
        const h = hausseDesComposants();
        return [
          `Défi relevé : à ${eur(p.prix!)}, la marge du trimestre remonte à ${eur(m.marge)}, contre ${eur(h.apres.marge)} au prix d'avant. Elle reste sous les ${eur(h.avant.marge)} d'avant la hausse : ${c.entreprise} ne fait pas tout payer à ses clients, qui partiraient.`,
          "La régulation ne ramène pas toujours à l'état d'avant : elle cherche le meilleur équilibre possible dans un environnement qui a changé.",
        ];
      },
    },
    {
      id: "le-numerique-et-son-risque",
      objectifs: [3],
      type: "montants",
      titre: "Le site de vente et son risque",
      question: (c) => {
        const k = cyberattaque();
        return `${c.entreprise} vend aux particuliers sur son site. Une cyberattaque le ferait tomber : ${eur(k.dommages)} pour le remettre en état et ${qte(k.ventesPerdues)} enceintes qui ne se vendraient pas, à ${eur(k.marge)} de marge chacune. Elle a ${pct(k.probabilite)} de chances de tomber dans l'année. Calculez son coût si elle tombe, puis son coût moyen sur l'année (coût × probabilité).`;
      },
      champs: () => {
        const k = cyberattaque();
        return [
          { libelle: "Coût de la cyberattaque si elle tombe", attendu: k.cout, calcul: `${eur(k.dommages)} + ${qte(k.ventesPerdues)} × ${eur(k.marge)} = ${eur(k.cout)}` },
          { libelle: "Coût moyen sur l'année", attendu: k.coutMoyen, calcul: `${eur(k.cout)} × ${qte(k.probabilite)} = ${eur(k.coutMoyen)}` },
        ];
      },
      explication: (c) => {
        const k = cyberattaque();
        return [
          `Le numérique fait vendre ${c.entreprise} sans magasin ni intermédiaire, mais il expose à de nouveaux risques : ${eur(k.cout)} si l'attaque tombe, ${eur(k.coutMoyen)} par an en moyenne. Le management s'en protège (sauvegardes, mises à jour, assurance) au lieu d'y renoncer.`,
        ];
      },
    },
    {
      id: "developpement-ou-risque",
      objectifs: [3],
      type: "tri",
      titre: "Développement ou risque ?",
      question: (c) => `Rangez chaque effet du numérique chez ${c.entreprise} : une source de développement ou un risque à maîtriser ?`,
      categories: COTES_DU_NUMERIQUE,
      elements: () => [
        { libelle: "Vendre en ligne dans toute la France sans ouvrir de magasin", montant: 0, categorie: "opportunite", pourquoi: "De nouveaux clients, sans le coût d'un magasin : un développement." },
        { libelle: "Lire chaque jour les ventes et les avis des clients", montant: 0, categorie: "opportunite", pourquoi: "Une information à jour pour décider : un développement." },
        { libelle: "Des données de clients qui peuvent être volées", montant: 0, categorie: "risque", pourquoi: "La loi protège ces données : leur fuite est un risque à maîtriser." },
        { libelle: "Un site à l'arrêt après une attaque", montant: 0, categorie: "risque", pourquoi: "Des ventes perdues et une remise en état : un risque." },
        { libelle: "Un avis négatif qui se répand en quelques heures", montant: 0, categorie: "risque", pourquoi: "La réputation se joue en ligne : un risque à surveiller." },
      ],
      relance: "L'effet aide-t-il l'entreprise à vendre ou à décider, ou peut-il lui coûter des ventes, de l'argent ou sa réputation ?",
      explication: () => ["La digitalisation est à la fois source de développement et porteuse de risques : le management ne choisit pas l'un sans l'autre, il les pèse."],
    },
    {
      id: "l-empreinte-de-l-annee",
      objectifs: [4],
      type: "montants",
      titre: "L'empreinte de l'année",
      notions: ["csr_index"],
      tableau: (c) => {
        const e = empreinteDeLAnnee();
        return {
          titre: `L'année N ${dE(c.entreprise)}, côté environnement`,
          colonnes: ["Par enceinte"],
          lignes: [
            { libelle: "Électricité du montage", valeurs: [`${qte(e.kwhParEnceinte)} kWh`] },
            { libelle: "Emballage", valeurs: [`${qte(e.kgParEnceinte)} kg`] },
            { libelle: "Part de l'emballage valorisée (recyclée)", valeurs: [pct(e.partValorisee)] },
          ],
        };
      },
      question: () => {
        const e = empreinteDeLAnnee();
        return `En N, ${qte(e.enceintes)} enceintes ont été montées. Calculez l'emballage de l'année, en kilogrammes, puis l'emballage qui n'est pas valorisé (à l'unité).`;
      },
      champs: () => {
        const e = empreinteDeLAnnee();
        return [
          { libelle: "Emballage de l'année (kg)", nature: "grandeur", attendu: e.emballage, calcul: `${qte(e.enceintes)} × ${qte(e.kgParEnceinte)} = ${qte(e.emballage)} kg` },
          { libelle: "Emballage non valorisé (kg)", nature: "grandeur", attendu: e.nonValorise, calcul: `${qte(e.emballage)} × (1 − ${qte(e.partValorisee)}) = ${qte(e.nonValorise)} kg` },
        ];
      },
      explication: () => {
        const e = empreinteDeLAnnee();
        return [
          `Plus de ${qte(Math.floor(e.nonValorise / 1_000))} tonnes d'emballage partent sans être recyclées, et le montage consomme ${qte(e.kwh)} kWh, soit ${qte(e.kgCo2)} kg de CO2. Les mutations écologiques changent ce qu'on attend d'une entreprise : la loi encadre, et l'entreprise peut aller plus loin.`,
        ];
      },
    },
    {
      id: "la-loi-ou-l-engagement",
      objectifs: [4],
      type: "choix",
      titre: "Ce que la loi impose, ce que l'entreprise ajoute",
      question: (c) => `Comme tout fabricant d'équipements électriques, ${c.entreprise} doit financer la collecte et le recyclage de ses enceintes en fin de vie. Elle décide en plus de passer à un emballage en carton recyclé, que rien ne lui impose. Qu'est-ce qui relève de sa responsabilité sociétale ?`,
      options: () => [
        {
          texte: "L'emballage recyclé : un engagement au-delà de ce que la loi impose",
          juste: true,
          retour: "Oui : la collecte et le recyclage des appareils sont une obligation, qui s'impose à tous les fabricants. La RSE, c'est ce que l'entreprise décide de faire en plus pour l'environnement et la société, de sa propre initiative.",
        },
        {
          texte: "La collecte des enceintes usagées, puisque c'est elle qui protège le plus l'environnement",
          juste: false,
          retour: "Non : c'est une obligation légale. Elle protège l'environnement, mais elle ne relève pas d'un choix de l'entreprise.",
        },
        {
          texte: "Ni l'un ni l'autre : une entreprise n'a pas de responsabilité au-delà de ses clients",
          juste: false,
          retour: "Non : une entreprise répond aussi de ses effets sur l'environnement et la société. C'est le sens de sa responsabilité sociétale.",
        },
      ],
    },
    {
      id: "les-trois-piliers",
      objectifs: [4],
      type: "tri",
      titre: "Les trois volets de la RSE",
      question: (c) => `Rangez chaque engagement ${dE(c.entreprise)} dans le volet de la responsabilité sociétale qu'il sert.`,
      categories: PILIERS_DE_LA_RSE,
      elements: () => [
        { libelle: "Passer à un emballage en carton recyclé", montant: 0, categorie: "environnemental", pourquoi: "Moins de déchets : le volet environnemental." },
        { libelle: "Éteindre la ligne et le chauffage la nuit", montant: 0, categorie: "environnemental", pourquoi: "Moins d'électricité et de CO2 : environnemental." },
        { libelle: "Faire tourner les opérateurs sur les postes pour limiter les gestes répétitifs", montant: 0, categorie: "social", pourquoi: "La santé des salariés : le volet social." },
        { libelle: "Former chaque opérateur au contrôle de la qualité", montant: 0, categorie: "social", pourquoi: "Les compétences des salariés : social." },
        { libelle: "Payer ses fournisseurs à la date convenue", montant: 0, categorie: "economique", pourquoi: "Une relation loyale avec ses partenaires : le volet économique." },
      ],
      relance: "L'engagement protège-t-il l'environnement, les personnes qui travaillent, ou la relation économique avec les partenaires ?",
      explication: () => ["La RSE tient en trois volets : économique, social et environnemental. Une entreprise responsable cherche à les tenir ensemble, sans sacrifier l'un aux deux autres."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const h = hausseDesComposants();
        const juste = prixQuiRegule();
        return [
          `Une hausse de ${pct(h.hausse)} des composants coûte ${eur(h.margePerdue)} de marge par trimestre à ${c.entreprise} : un changement d'une partie prenante se propage dans tout le système. Le management régule : à ${eur(juste)}, la marge remonte à ${eur(margeDuTrimestre(juste).marge)}, sans revenir à ce qu'elle était.`,
          "Le numérique ouvre des ventes et des risques ; l'écologie impose des règles, et la RSE va au-delà. Dans l'arène, l'environnement change aussi d'un tour à l'autre, et la feuille de décision s'ajuste.",
        ];
      },
      repere: () => "L'organisation, système complexe : un changement se propage. Réguler : ajuster ses décisions pour retrouver un équilibre. RSE : ce que l'entreprise fait au-delà de la loi, en trois volets.",
    },
  ],
};
