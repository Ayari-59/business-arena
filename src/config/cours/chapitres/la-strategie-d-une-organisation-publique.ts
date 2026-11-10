import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  CONTRIBUTIONS_ESSAYEES,
  DELEGATION,
  ENTREPRISES_DE_LA_STRATEGIE_PUBLIQUE,
  HAUT_VERDASSE_DE_LA_STRATEGIE as H,
  contributionMaximale,
  piscineDeleguee,
  piscineEnRegie,
  type Niveau,
  type Principe,
} from "../monde/strategie-du-haut-verdasse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA STRATÉGIE D'UNE ORGANISATION PUBLIQUE (Bac STMG, management de première, question 3.2,
 * palier 1).
 *
 * La Communauté de communes du Haut-Verdasse a une stratégie, comme NOVA, mais pour l'intérêt général.
 * L'élève lit ses domaines et sa finalité, chiffre ce que coûte sa piscine en régie et ce qu'en paient
 * les usagers, range des décisions selon les principes du service public, cherche au laboratoire la plus
 * haute contribution qu'une délégation de service public pourrait coûter, juge la délégation sur
 * d'autres critères que le coût, puis situe l'action publique (central, territorial, européen) et
 * reconnaît les groupes de pression, le conflit d'intérêts, l'entreprise publique, la transparence et
 * le contrôle des comptes publics.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, l'entreprise du cas, face à l'organisation
 * publique du cours : monde/strategie-du-haut-verdasse.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const PRINCIPES: readonly { code: Principe; libelle: string }[] = [
  { code: "continuite", libelle: "Continuité" },
  { code: "egalite", libelle: "Égalité" },
  { code: "adaptabilite", libelle: "Adaptabilité" },
];

export const NIVEAUX_DE_L_ACTION_PUBLIQUE: readonly { code: Niveau; libelle: string }[] = [
  { code: "central", libelle: "Niveau central : l'État" },
  { code: "territorial", libelle: "Niveau territorial : la communauté" },
  { code: "europeen", libelle: "Cadre européen" },
];

export const LA_STRATEGIE_D_UNE_ORGANISATION_PUBLIQUE: Chapitre = {
  code: "la-strategie-d-une-organisation-publique",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les choix stratégiques des organisations"],
  titre: "La stratégie d'une organisation publique",
  accroche:
    "Une communauté de communes ne cherche pas le profit, mais elle choisit : quels services rendre, à quel prix pour l'usager, en régie ou en délégation. Sa piscine chiffrée, les principes du service public, les niveaux de l'action publique et ceux qui la contrôlent.",
  objectifs: [
    "Reconnaître la finalité et les domaines d'une stratégie publique",
    "Chiffrer le coût d'un service public et la part qu'en paie l'usager",
    "Appliquer les principes du service public",
    "Comparer la régie et la délégation de service public",
    "Situer l'action publique et ce qui l'encadre : niveaux, groupes de pression, contrôle",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRATEGIE_PUBLIQUE,
    pourquoi: "ce chapitre oppose à NOVA, l'entreprise du cas, la communauté de communes du cours, dont il tient le budget et les services.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une stratégie pour l'intérêt général",
      texte: (c) => [
        `${H.nom} réunit ${qte(H.communes)} communes et ${qte(H.habitants)} habitants. ${H.presentation} Elle est dirigée par ${qte(H.elus.conseillersCommunautaires)} élus et ${qte(H.agents.effectif)} agents.`,
        `Comme ${c.entreprise}, elle fait des choix qui engagent son avenir : quels services ouvrir, avec quels moyens, comment les financer. Mais sa finalité n'est pas le profit : c'est l'intérêt général, l'accès de tous au sport, à la lecture et à la culture. Ses domaines stratégiques sont ses missions de service public.`,
      ],
      repere: () => "Stratégie publique : des choix pour l'intérêt général, sous le respect des principes du service public (continuité, égalité, adaptabilité).",
    },
    {
      id: "la-finalite",
      objectifs: [0],
      type: "choix",
      titre: "Ce que vise la stratégie",
      question: () => "La piscine coûte chaque année plus qu'elle ne rapporte en entrées. Que doit en conclure la communauté ?",
      options: () => [
        {
          texte: "Rien d'anormal : elle se juge sur le service rendu, pas sur un bénéfice",
          juste: true,
          retour: "Oui : un service public n'a pas à être rentable. Il se juge sur l'intérêt général qu'il sert, à un coût maîtrisé : c'est ce qu'il faut chiffrer et suivre.",
        },
        {
          texte: "Il faut la fermer : une organisation qui perd de l'argent sur un service doit l'arrêter",
          juste: false,
          retour: "Non : c'est le raisonnement d'une entreprise. La piscine sert l'apprentissage de la natation et le sport de tous ; l'impôt paie ce que les entrées ne couvrent pas.",
        },
        {
          texte: "Il faut monter les tarifs jusqu'à ce que les entrées paient toutes les charges",
          juste: false,
          retour: "Non : des tarifs qui couvriraient tout écarteraient les familles modestes, contre le principe d'égalité.",
        },
      ],
    },
    {
      id: "ce-que-coute-la-piscine",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûte la piscine",
      tableau: () => {
        const p = piscineEnRegie();
        return {
          titre: `${p.nom}, sur une année`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Personnel (${qte(p.agents)} agents à ${eur(p.coutMoyen)})`, valeurs: [eur(p.personnel)] },
            { libelle: "Énergie, eau, produits et entretien", valeurs: [eur(p.fonctionnement)] },
            { libelle: "Entrées et abonnements payés par les usagers", valeurs: [eur(p.recettes)] },
            { libelle: "Entrées dans l'année", valeurs: [qte(p.entrees)] },
          ],
        };
      },
      question: () => "Calculez le coût net de la piscine pour la communauté (ses charges moins ses recettes), son coût net par entrée (au centime), puis la part des charges payée par les usagers, en pourcentage au dixième.",
      champs: () => {
        const p = piscineEnRegie();
        return [
          { libelle: "Coût net de la piscine", attendu: p.coutNet, calcul: `${eur(p.personnel)} + ${eur(p.fonctionnement)} − ${eur(p.recettes)} = ${eur(p.coutNet)}`, tolerance: 1 },
          { libelle: "Coût net par entrée", attendu: p.coutNetParEntree, calcul: `${eur(p.coutNet)} ÷ ${qte(p.entrees)} = ${eur(p.coutNetParEntree)}`, tolerance: 0.01 },
          { libelle: "Part des charges payée par les usagers (%)", attendu: p.partDesUsagers, calcul: `${eur(p.recettes)} ÷ ${eur(p.charges)} × 100 = ${pct(p.partDesUsagers)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const p = piscineEnRegie();
        return [
          `Chaque entrée coûte ${eur(p.coutNetParEntree)} à la communauté, payés par l'impôt et les dotations : les usagers ne paient que ${pct(p.partDesUsagers)} des charges. C'est un choix politique, celui d'un service ouvert à tous ; la communauté doit pourtant maîtriser ce coût, car son budget est voté en équilibre.`,
        ];
      },
    },
    {
      id: "les-principes",
      objectifs: [2],
      type: "tri",
      titre: "Les principes du service public",
      question: () => "Rangez chaque décision de la communauté selon le principe du service public qu'elle applique.",
      categories: PRINCIPES,
      elements: () => [
        { libelle: "Pendant les travaux de l'été, les deux bassins ferment l'un après l'autre, jamais ensemble", montant: 0, categorie: "continuite", pourquoi: "Le service ne s'interrompt pas : la continuité." },
        { libelle: "Les écoles gardent leurs créneaux de natation toute l'année scolaire", montant: 0, categorie: "continuite", pourquoi: "Un service assuré sans rupture : la continuité." },
        { libelle: "Le même tarif pour un habitant de la ville centre et pour celui d'un village", montant: 0, categorie: "egalite", pourquoi: "Les usagers sont traités de la même façon : l'égalité." },
        { libelle: "Un tarif réduit pour les demandeurs d'emploi", montant: 0, categorie: "egalite", pourquoi: "L'accès de tous, quels que soient les revenus : l'égalité." },
        { libelle: "Des cours d'aquagym le soir, pour les habitants qui travaillent", montant: 0, categorie: "adaptabilite", pourquoi: "Le service suit les besoins des usagers : l'adaptabilité." },
      ],
      relance: "La décision garantit-elle que le service ne s'arrête pas, que chacun y accède de la même façon, ou qu'il suit les besoins qui changent ?",
      explication: () => ["Continuité, égalité, adaptabilité : ces trois principes encadrent toute stratégie publique. Ils garantissent l'intérêt général, et ils ont un coût que l'impôt accepte de payer."],
    },
    {
      id: "regie-ou-delegation",
      objectifs: [3],
      type: "choix",
      titre: "Régie ou délégation",
      question: () => `Une entreprise propose de tenir la piscine pendant ${qte(DELEGATION.annees)} ans, aux tarifs et aux horaires fixés par la communauté, en gardant les entrées et contre une contribution chaque année. Qu'est-ce qu'une délégation de service public ?`,
      options: () => [
        {
          texte: "La communauté confie la gestion à une entreprise et garde le contrôle",
          juste: true,
          retour: "Oui : le service reste public. La communauté fixe les règles (tarifs, horaires, créneaux scolaires) et contrôle le délégataire ; l'entreprise gère, et se rémunère par les entrées et la contribution.",
        },
        {
          texte: "La communauté vend la piscine à l'entreprise, qui en fait ce qu'elle veut",
          juste: false,
          retour: "Non : déléguer n'est pas vendre. Le service reste public, ses règles aussi.",
        },
        {
          texte: "La communauté garde tout, mais embauche des agents dans une entreprise",
          juste: false,
          retour: "Non : en régie, la communauté gère elle-même avec ses agents. En délégation, c'est l'entreprise qui gère.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-delegation",
      objectifs: [3],
      type: "simulation",
      titre: "Ce que la délégation peut coûter",
      question: () => {
        const p = piscineEnRegie();
        return `En régie, la piscine coûte ${eur(p.coutNet)} net par an à la communauté. Déléguée, elle coûterait la contribution versée au délégataire, plus ${eur(DELEGATION.controleParAn)} par an pour contrôler le contrat. Faites varier la contribution que l'entreprise demande.`;
      },
      leviers: () => [{ code: "contribution", libelle: "Contribution annuelle demandée", unite: "€", ...CONTRIBUTIONS_ESSAYEES, depart: CONTRIBUTIONS_ESSAYEES.max }],
      lecture: (_c, p) => {
        const d = piscineDeleguee(p.contribution!);
        return [
          { libelle: "Coût de la piscine déléguée", montant: d.cout, fort: true },
          { libelle: "Coût de la piscine en régie", montant: d.regie },
          { libelle: "Écart pour la communauté (délégation moins régie)", montant: d.ecart, effet: true },
        ];
      },
      defi: () => {
        const juste = contributionMaximale();
        return {
          consigne: `Trouvez la plus haute contribution, de ${eur(CONTRIBUTIONS_ESSAYEES.pas)} en ${eur(CONTRIBUTIONS_ESSAYEES.pas)}, pour laquelle la délégation coûte moins que la régie.`,
          atteint: (p) => p.contribution === juste,
          indice: (p) => {
            const d = piscineDeleguee(p.contribution!);
            return d.ecart >= 0
              ? `À ${eur(p.contribution!)}, la délégation coûte ${eur(d.ecart)} de plus que la régie, ou autant.`
              : `À ${eur(p.contribution!)}, la délégation coûte moins : une contribution plus haute le ferait-elle encore ?`;
          },
          solution: { contribution: juste },
        };
      },
      explication: (_c, p) => {
        const d = piscineDeleguee(p.contribution!);
        return [
          `Défi relevé : jusqu'à ${eur(p.contribution!)} de contribution, la délégation coûte ${eur(-d.ecart)} de moins que la régie. Au-delà, la communauté paierait plus cher pour le même service.`,
          "C'est un plafond, pas une décision : il reste à vérifier que le délégataire tiendra les principes du service public.",
        ];
      },
    },
    {
      id: "deleguer",
      objectifs: [3],
      type: "choix",
      titre: "Déléguer, à quelles conditions ?",
      question: () => {
        const juste = contributionMaximale();
        return `L'entreprise demande ${eur(juste)} par an : la délégation coûterait moins que la régie. Les élus doivent-ils déléguer ?`;
      },
      options: () => [
        {
          texte: "Oui, si le contrat garantit continuité, égalité des tarifs et contrôle",
          juste: true,
          retour: "Oui : le coût n'est qu'un critère. La communauté doit s'assurer que les écoles gardent leurs créneaux, que les tarifs restent accessibles et qu'elle pourra contrôler le délégataire, et sanctionner un manquement.",
        },
        {
          texte: "Oui, sans condition : moins cher, c'est forcément mieux pour les habitants",
          juste: false,
          retour: "Non : une économie obtenue en fermant l'été ou en montant les tarifs irait contre le service public.",
        },
        {
          texte: "Non : un service public ne peut jamais être confié à une entreprise privée",
          juste: false,
          retour: "Non : la délégation de service public est prévue par la loi, et la mise en concurrence des candidats aussi. Le service reste public, la gestion change.",
        },
      ],
    },
    {
      id: "les-niveaux",
      objectifs: [4],
      type: "tri",
      titre: "Qui décide de quoi ?",
      question: () => "Rangez chaque décision selon le niveau de l'action publique où elle se prend.",
      categories: NIVEAUX_DE_L_ACTION_PUBLIQUE,
      elements: () => [
        { libelle: "Verser à la communauté ses dotations de fonctionnement", montant: 0, categorie: "central", pourquoi: "C'est l'État qui verse les dotations : le niveau central." },
        { libelle: "Fixer les programmes de natation des écoles", montant: 0, categorie: "central", pourquoi: "L'Éducation nationale fixe les programmes : le niveau central." },
        { libelle: "Voter le tarif d'entrée de la piscine", montant: 0, categorie: "territorial", pourquoi: "Le conseil communautaire vote les tarifs : le niveau territorial." },
        { libelle: "Choisir de déléguer la piscine ou de la garder en régie", montant: 0, categorie: "territorial", pourquoi: "C'est le choix des élus de la communauté : territorial." },
        { libelle: "Imposer une mise en concurrence pour les grands contrats publics", montant: 0, categorie: "europeen", pourquoi: "Les règles européennes de la commande publique s'imposent aux collectivités : le cadre européen." },
      ],
      relance: "La décision revient-elle à l'État, aux élus de la communauté, ou à des règles fixées à l'échelle de l'Union européenne ?",
      explication: () => ["L'action publique s'organise à plusieurs niveaux : l'État fixe le cadre national et verse des dotations, les collectivités choisissent leurs services, et tout s'inscrit dans les règles européennes."],
    },
    {
      id: "groupes-de-pression",
      objectifs: [4],
      type: "choix",
      titre: "Les groupes de pression",
      question: () => "Le club de handball, les parents d'élèves et un club de natation demandent chacun plus de créneaux au gymnase et à la piscine. Comment la communauté doit-elle les recevoir ?",
      options: () => [
        {
          texte: "Les écouter, puis décider pour l'intérêt général, pas pour le plus insistant",
          juste: true,
          retour: "Oui : ce sont des groupes de pression, qui défendent un intérêt particulier. Les entendre est légitime et utile ; la décision, elle, doit servir l'ensemble des usagers.",
        },
        {
          texte: "Donner raison à celui qui réunit le plus de monde à la réunion publique",
          juste: false,
          retour: "Non : le nombre de présents ne fait pas l'intérêt général. Les élus pèsent les besoins de tous les usagers.",
        },
        {
          texte: "Refuser de les recevoir : une organisation publique ne doit subir aucune influence",
          juste: false,
          retour: "Non : les usagers et les associations ont le droit de se faire entendre. C'est la décision qui doit rester indépendante.",
        },
      ],
    },
    {
      id: "conflit-d-interets",
      objectifs: [4],
      type: "choix",
      titre: "Le conflit d'intérêts",
      question: () => "Imaginons qu'un conseiller communautaire soit aussi le trésorier du club de handball. Le conseil vote la subvention du club. Que doit faire ce conseiller ?",
      options: () => [
        {
          texte: "Ne pas prendre part au vote, ni au débat",
          juste: true,
          retour: "Oui : il est en conflit d'intérêts, son intérêt pour le club pourrait peser sur une décision publique. Il se retire : c'est la règle, et c'est ce qui garde la confiance des habitants.",
        },
        {
          texte: "Voter, puisqu'il connaît mieux que personne les besoins du club",
          juste: false,
          retour: "Non : sa connaissance du club peut éclairer le débat, par d'autres que lui. Voter une subvention à une association qu'il dirige le placerait en conflit d'intérêts.",
        },
        {
          texte: "Voter contre la subvention, pour prouver qu'il ne favorise pas son club",
          juste: false,
          retour: "Non : voter contre est aussi une façon de peser sur la décision. Il ne doit pas voter du tout.",
        },
      ],
    },
    {
      id: "entreprise-publique",
      objectifs: [0],
      type: "choix",
      titre: "Et l'entreprise publique ?",
      question: (c) => `La Poste est une société anonyme dont le capital est détenu par des acteurs publics, l'État et la Caisse des dépôts. Qu'est-ce qui la distingue de la communauté de communes, et de ${c.entreprise} ?`,
      options: () => [
        {
          texte: "Une propriété publique, mais une activité marchande, face à des concurrents",
          juste: true,
          retour: "Oui : comme la communauté, elle appartient à des acteurs publics et a des missions de service public ; comme une entreprise, elle vend ses services sur des marchés en concurrence.",
        },
        {
          texte: "Rien ne la distingue de la communauté : toutes deux se financent par l'impôt",
          juste: false,
          retour: "Non : une entreprise publique vit d'abord de ce que lui paient ses clients, pas de l'impôt.",
        },
        {
          texte: "Rien ne la distingue de NOVA : son capital ne change rien à sa stratégie",
          juste: false,
          retour: "Non : ses propriétaires publics lui fixent des missions de service public, que NOVA n'a pas.",
        },
      ],
    },
    {
      id: "transparence-et-controle",
      objectifs: [4],
      type: "choix",
      titre: "Rendre des comptes",
      question: () => "La communauté dépense chaque année l'argent de l'impôt. Qui vérifie qu'elle l'emploie bien ?",
      options: () => [
        {
          texte: "La chambre régionale des comptes, et les habitants, qui lisent son budget",
          juste: true,
          retour: "Oui : le budget est voté en séance publique et se consulte. La chambre régionale des comptes contrôle les collectivités, comme la Cour des comptes contrôle l'État : elles vérifient l'emploi des fonds publics et évaluent la performance.",
        },
        {
          texte: "Personne : une collectivité élue n'a de comptes à rendre qu'au moment des élections",
          juste: false,
          retour: "Non : l'emploi de l'argent public est contrôlé en continu, par les juridictions financières et par la publicité des budgets.",
        },
        {
          texte: "Ses usagers, qui peuvent cesser de payer leurs impôts s'ils ne sont pas d'accord",
          juste: false,
          retour: "Non : l'impôt est obligatoire. Les habitants s'expriment par le vote et le débat public, et des juridictions contrôlent les comptes.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const p = piscineEnRegie();
        return [
          `La piscine coûte ${eur(p.coutNet)} net par an, ${eur(p.coutNetParEntree)} par entrée : la communauté l'accepte, parce que sa stratégie sert l'intérêt général, sous les principes de continuité, d'égalité et d'adaptabilité. Elle choisit aussi comment rendre le service, en régie ou en délégation, et ne délègue que sous conditions.`,
          `Son action s'inscrit entre l'État et l'Europe, sous l'influence de groupes de pression, et elle rend des comptes. Là où ${c.entreprise} se juge sur son résultat, l'organisation publique se juge sur le service rendu et son coût. L'arène ne joue que des entreprises : la question du service public s'y lit en creux, chez les clients qu'aucune entreprise ne sert.`,
        ];
      },
      repere: () => "Organisation publique : finalité d'intérêt général, principes du service public, régie ou délégation, niveaux central, territorial et européen, contrôle des comptes publics.",
    },
  ],
};
