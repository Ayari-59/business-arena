import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  DOMAINES,
  ENTREPRISES_DES_DOMAINES,
  PART_DE_LA_DEPENDANCE,
  VENTES_DE_STUDIO_ESSAYEES,
  avantagesDuMarche,
  clienteleDe,
  gammeDuMois,
  studioQuiReduitLaDependance,
  type Avantage,
} from "../monde/domaines-d-activite-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DOMAINES D'ACTIVITÉ, SE SPÉCIALISER OU SE DIVERSIFIER (Bac STMG, management de première,
 * question 3.1, palier 1).
 *
 * En N + 1, NOVA vend trois enceintes à trois clientèles, face à des concurrents différents : trois
 * domaines d'activité stratégique. L'élève sépare la stratégie globale (dans quels domaines être) des
 * stratégies de domaine (comment y gagner), chiffre ce que chaque domaine apporte, mesure la dépendance
 * de NOVA à la One et cherche au laboratoire les ventes de Studio qui la réduisent, distingue
 * spécialisation et diversification, reconnaît l'avantage concurrentiel de chaque enseigne (coûts ou
 * différenciation) et son caractère éphémère, puis pèse le numérique, la transparence et le secret.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : monde/domaines-d-activite-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const NIVEAUX_DE_STRATEGIE = [
  { code: "globale", libelle: "Stratégie globale" },
  { code: "domaine", libelle: "Stratégie de domaine" },
] as const;

export const SPECIALISER_OU_DIVERSIFIER = [
  { code: "specialisation", libelle: "Spécialisation : le même métier" },
  { code: "diversification", libelle: "Diversification : un métier de plus" },
] as const;

export const AVANTAGES: readonly { code: Avantage; libelle: string }[] = [
  { code: "couts", libelle: "Domination par les coûts" },
  { code: "differenciation", libelle: "Différenciation" },
  { code: "milieu", libelle: "Aucun avantage net" },
];

export const TRANSPARENCE_OU_SECRET = [
  { code: "publier", libelle: "Se publie" },
  { code: "secret", libelle: "Reste secret" },
] as const;

export const DOMAINES_D_ACTIVITE: Chapitre = {
  code: "domaines-d-activite",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les choix stratégiques des organisations"],
  titre: "Domaines d'activité : se spécialiser ou se diversifier",
  accroche:
    "Go, One et Studio : chacune sa clientèle, ses concurrents, son domaine d'activité. Dans lesquels être, et comment gagner dans chacun ? Ce que chaque domaine rapporte, la dépendance à une seule enceinte, l'avantage concurrentiel et ce qui se dit ou se tait.",
  objectifs: [
    "Reconnaître un domaine d'activité stratégique, et séparer stratégie globale et stratégie de domaine",
    "Mesurer ce que chaque domaine apporte et la dépendance à un seul",
    "Distinguer spécialisation et diversification",
    "Caractériser l'avantage concurrentiel : coûts ou différenciation, et sa durée",
    "Peser le numérique, la transparence et le secret dans les choix stratégiques",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_DOMAINES,
    pourquoi: "ce chapitre suit la gamme de NOVA, dont le cours tient les prix, les coûts, la publicité, les clientèles et les concurrents.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une gamme, trois domaines",
      texte: (c) => {
        const g = gammeDuMois();
        return [
          `En N + 1, ${c.entreprise} vend une gamme : ${g.go.nom} (${eur(g.go.prix)}), ${g.one.nom} (${eur(g.one.prix)}) et ${g.studio.nom} (${eur(g.studio.prix)}). Chacune s'adresse à sa clientèle (${clienteleDe(DOMAINES.go.clientele).nom.toLowerCase()}, ${clienteleDe(DOMAINES.one.clientele).nom.toLowerCase()}, ${clienteleDe(DOMAINES.studio.clientele).nom.toLowerCase()}) et rencontre ses concurrents.`,
          "Une entreprise découpe ses activités en domaines d'activité stratégique (DAS) : chacun a ses clients, ses besoins, ses concurrents, et demande sa propre stratégie. Le choix des domaines où être est la stratégie globale ; la façon de gagner dans chacun est la stratégie de domaine.",
        ];
      },
      repere: () => "Domaine d'activité stratégique : des clients, des besoins et des concurrents communs. Stratégie globale : dans quels domaines être. Stratégie de domaine : comment y gagner.",
    },
    {
      id: "qu-est-ce-qu-un-domaine",
      objectifs: [0],
      type: "choix",
      titre: "Ce qui fait un domaine",
      question: (c) => `Pourquoi ${c.entreprise} traite-t-elle Go et Studio comme deux domaines différents, alors que ce sont toutes deux des enceintes ?`,
      options: () => [
        {
          texte: "Elles n'ont ni les mêmes clients ni les mêmes concurrents",
          juste: true,
          retour: "Oui : Go vise des clients qui comparent les prix, face à des enceintes bon marché ; Studio des clients qui paient la qualité, face au haut de gamme. On n'y gagne pas de la même façon : ce sont deux domaines.",
        },
        {
          texte: "Elles ne sortent pas de la même ligne de montage, donc elles relèvent de deux métiers",
          juste: false,
          retour: "Non : un domaine se définit par ses clients, leurs besoins et ses concurrents, pas par la machine qui le fabrique.",
        },
        {
          texte: "Leur prix est différent : chaque prix de vente fait un domaine à lui seul",
          juste: false,
          retour: "Non : deux modèles à des prix voisins, pour les mêmes clients et face aux mêmes concurrents, feraient un seul domaine.",
        },
      ],
    },
    {
      id: "globale-ou-de-domaine",
      objectifs: [0],
      type: "tri",
      titre: "Stratégie globale ou de domaine ?",
      question: (c) => `Rangez chaque choix ${dE(c.entreprise)} : relève-t-il de la stratégie globale ou d'une stratégie de domaine ?`,
      categories: NIVEAUX_DE_STRATEGIE,
      elements: () => [
        { libelle: "Ajouter les casques audio aux enceintes", montant: 0, categorie: "globale", pourquoi: "C'est choisir un domaine de plus : la stratégie globale." },
        { libelle: "Abandonner l'enceinte nomade", montant: 0, categorie: "globale", pourquoi: "C'est sortir d'un domaine : la stratégie globale." },
        { libelle: "Baisser le prix de Go face aux enceintes bon marché", montant: 0, categorie: "domaine", pourquoi: "C'est la façon de gagner dans le domaine de Go : une stratégie de domaine." },
        { libelle: "Soigner le son et la finition de Studio", montant: 0, categorie: "domaine", pourquoi: "C'est la façon de gagner dans le haut de gamme : une stratégie de domaine." },
        { libelle: "Faire de la publicité pour la One auprès des familles", montant: 0, categorie: "domaine", pourquoi: "Elle sert le domaine de la One : une stratégie de domaine." },
      ],
      relance: "Le choix dit-il dans quels domaines être, ou comment gagner dans l'un d'eux ?",
      explication: () => ["La stratégie globale dessine le portefeuille de domaines ; chaque stratégie de domaine y construit un avantage face aux concurrents de ce domaine."],
    },
    {
      id: "ce-que-rapporte-chaque-domaine",
      objectifs: [1],
      type: "montants",
      titre: "Ce que rapporte chaque domaine",
      tableau: () => {
        const g = gammeDuMois();
        return {
          titre: "Le mois en gamme",
          colonnes: [g.go.nom, g.one.nom, g.studio.nom],
          lignes: [
            { libelle: "Prix", valeurs: [eur(g.go.prix), eur(g.one.prix), eur(g.studio.prix)] },
            { libelle: "Coût variable d'une unité", valeurs: [eur(g.go.coutVariableUnitaire), eur(g.one.coutVariableUnitaire), eur(g.studio.coutVariableUnitaire)] },
            { libelle: "Unités vendues", valeurs: [qte(g.go.quantite), qte(g.one.quantite), qte(g.studio.quantite)] },
            { libelle: "Publicité du mois", valeurs: [eur(g.go.publicite), eur(g.one.publicite), eur(g.studio.publicite)] },
          ],
        };
      },
      question: () =>
        "Calculez la contribution de chaque domaine sur le mois (la marge sur coût variable, moins sa publicité), puis la part de la One dans le total des contributions, en pourcentage au dixième.",
      champs: () => {
        const g = gammeDuMois();
        const ligne = (r: typeof g.go) => ({
          libelle: `Contribution de ${r.nom}`,
          attendu: r.contribution,
          calcul: `(${eur(r.prix)} − ${eur(r.coutVariableUnitaire)}) × ${qte(r.quantite)} − ${eur(r.publicite)} = ${eur(r.contribution)}`,
          tolerance: 1,
        });
        return [
          ligne(g.go),
          ligne(g.one),
          ligne(g.studio),
          { libelle: "Part de la One dans les contributions (%)", attendu: g.partDeOne, calcul: `${eur(g.one.contribution)} ÷ ${eur(g.total)} × 100 = ${pct(g.partDeOne)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const g = gammeDuMois();
        return [
          `Les trois domaines rapportent ${eur(g.total)} sur le mois, mais One en apporte ${pct(g.partDeOne)} à elle seule. Si un concurrent prenait le marché des familles, ${c.entreprise} perdrait plus de la moitié de ce qui paie ses charges communes.`,
        ];
      },
    },
    {
      id: "specialisee",
      objectifs: [2],
      type: "choix",
      titre: "Spécialisée ou diversifiée ?",
      question: (c) => `Avec Go, One et Studio, ${c.entreprise} est-elle spécialisée ou diversifiée ?`,
      options: () => [
        {
          texte: "Spécialisée : une gamme, un seul métier, celui du son",
          juste: true,
          retour: "Oui : trois domaines, mais le même métier, les mêmes savoir-faire et la même ligne. La spécialisation fait maîtriser son métier ; elle expose aussi à un seul marché, celui des enceintes.",
        },
        {
          texte: "Diversifiée : dès qu'une entreprise vend plus d'un produit, elle se diversifie",
          juste: false,
          retour: "Non : allonger sa gamme dans le même métier reste une spécialisation. Se diversifier, c'est entrer dans un autre métier.",
        },
        {
          texte: "Ni l'une ni l'autre : la question ne se pose qu'aux grands groupes",
          juste: false,
          retour: "Non : toute entreprise choisit entre rester dans son métier et en ajouter un ; une PME comme NOVA aussi.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-dependance",
      objectifs: [1],
      type: "simulation",
      titre: "Moins dépendre d'une seule enceinte",
      question: (c) => {
        const g = gammeDuMois();
        return `${c.entreprise} veut que la One ne fasse plus la moitié de ses contributions, sans rien lui retirer : elle pousse Studio. Faites varier les ventes de Studio du mois, de ${qte(VENTES_DE_STUDIO_ESSAYEES.min)} à la demande du mois de pointe, ${qte(VENTES_DE_STUDIO_ESSAYEES.max)} ; les lignes de montage ont ${qte(g.capaciteHeures)} heures-machine.`;
      },
      leviers: () => [{ code: "studio", libelle: "Ventes de Studio du mois", unite: "unités", ...VENTES_DE_STUDIO_ESSAYEES, depart: VENTES_DE_STUDIO_ESSAYEES.min }],
      lecture: (_c, p) => {
        const g = gammeDuMois(p.studio!);
        const d = gammeDuMois();
        return [
          { libelle: "Contribution de Studio", montant: g.studio.contribution, reference: d.studio.contribution },
          { libelle: "Contributions de la gamme", montant: g.total, reference: d.total },
          { libelle: "Part de la One dans les contributions", montant: g.partDeOne, unite: "%", reference: d.partDeOne, fort: true },
          { libelle: "Heures-machine utilisées", montant: g.heures, unite: "heures" },
        ];
      },
      graphique: () => ({ levier: "studio", unite: "%", courbes: [{ libelle: "Part de la One", valeur: (p) => gammeDuMois(p.studio!).partDeOne }] }),
      defi: () => {
        const juste = studioQuiReduitLaDependance();
        return {
          consigne: `Trouvez les plus petites ventes de Studio, à l'unité, qui font passer la part de la One sous ${qte(PART_DE_LA_DEPENDANCE)} %.`,
          atteint: (p) => p.studio === juste,
          indice: (p) => {
            const g = gammeDuMois(p.studio!);
            return (g.one.contribution / g.total) * 100 >= PART_DE_LA_DEPENDANCE
              ? `À ${qte(p.studio!)} Studio, One fait encore ${pct(g.partDeOne)} des contributions.`
              : `À ${qte(p.studio!)} Studio, One passe sous la moitié : moins de Studio suffirait-il ?`;
          },
          solution: { studio: juste },
        };
      },
      explication: (c, p) => {
        const g = gammeDuMois(p.studio!);
        return [
          `Défi relevé : à ${qte(p.studio!)} Studio par mois, One ne fait plus que ${pct(g.partDeOne)} des contributions ${dE(c.entreprise)}, et la ligne utilise ${qte(g.heures)} heures-machine sur ${qte(g.capaciteHeures)}.`,
          "Un portefeuille de domaines plus équilibré rend l'entreprise moins fragile : la perte d'un domaine ne l'emporte pas tout entière.",
        ];
      },
    },
    {
      id: "specialiser-ou-diversifier",
      objectifs: [2],
      type: "tri",
      titre: "Spécialisation ou diversification",
      question: (c) => `Rangez chaque projet ${dE(c.entreprise)} : reste-t-il dans son métier, ou en ajoute-t-il un ?`,
      categories: SPECIALISER_OU_DIVERSIFIER,
      elements: () => [
        { libelle: "Une enceinte étanche pour la plage", montant: 0, categorie: "specialisation", pourquoi: "Une enceinte de plus : le même métier." },
        { libelle: "Une version de la One pour les magasins d'un autre pays", montant: 0, categorie: "specialisation", pourquoi: "Le même produit, ailleurs : le même métier." },
        { libelle: "Un atelier de réparation de téléphones", montant: 0, categorie: "diversification", pourquoi: "Un service, pour d'autres appareils : un autre métier." },
        { libelle: "Des casques audio", montant: 0, categorie: "diversification", pourquoi: "Un produit voisin, mais d'autres savoir-faire et d'autres concurrents : une diversification proche du métier." },
        { libelle: "Une salle de concert", montant: 0, categorie: "diversification", pourquoi: "Un métier sans rapport avec la fabrication : une diversification." },
      ],
      relance: "Le projet garde-t-il le métier de l'entreprise, ses savoir-faire et sa ligne, ou lui en demande-t-il de nouveaux ?",
      explication: () => ["Se spécialiser, c'est approfondir son métier et le maîtriser mieux que d'autres ; se diversifier, c'est répartir ses risques sur plusieurs métiers, au prix de savoir-faire à acquérir."],
    },
    {
      id: "l-avantage-concurrentiel",
      objectifs: [3],
      type: "tri",
      titre: "L'avantage de chaque enseigne",
      question: () => "Sur le marché de l'enceinte du salon, rangez chaque enseigne selon l'avantage concurrentiel qu'elle tient.",
      categories: AVANTAGES,
      elements: () =>
        avantagesDuMarche().map((e) => ({
          libelle: `${e.nom} : ${eur(e.prix)}, ${eur(e.coutVariable)} de coût variable, qualité de conception ${qte(e.qualite)}`,
          montant: 0,
          categorie: e.avantage,
          pourquoi:
            e.avantage === "couts"
              ? "Le coût le plus bas, par des achats et une fabrication en très grandes séries : elle peut vendre moins cher que tous."
              : e.avantage === "differenciation"
                ? "Une qualité nettement au-dessus, que les clients paient plus cher : elle se différencie."
                : "Ni le coût le plus bas, ni une qualité à part : au milieu, sans avantage net.",
        })),
      relance: "L'enseigne vend-elle moins cher parce qu'elle produit moins cher, plus cher parce qu'elle offre plus, ou ni l'un ni l'autre ?",
      explication: (c) => [
        `L'avantage concurrentiel se construit par les coûts (produire moins cher que les autres) ou par la différenciation (offrir ce que les autres n'offrent pas, et le faire payer). ${c.entreprise}, au milieu, n'a encore ni l'un ni l'autre sur One : c'est là que ses domaines doivent choisir.`,
      ],
    },
    {
      id: "un-avantage-ephemere",
      objectifs: [3],
      type: "choix",
      titre: "Un avantage qui ne dure pas",
      question: () => "Auris tient sa différenciation par la qualité. Un concurrent sort une enceinte aussi bonne, moins chère. Que lui arrive-t-il ?",
      options: () => [
        {
          texte: "Son avantage s'use : elle doit innover pour le retrouver",
          juste: true,
          retour: "Oui : un avantage concurrentiel est éphémère. Les concurrents copient, les technologies changent ; il faut le renouveler sans cesse.",
        },
        {
          texte: "Rien : un avantage concurrentiel acquis l'est une fois pour toutes",
          juste: false,
          retour: "Non : la concurrence et l'innovation finissent par rattraper tout avantage qu'on n'entretient pas.",
        },
        {
          texte: "Elle doit baisser ses prix sous ceux de SoundBox pour garder ses clients",
          juste: false,
          retour: "Non : avec ses coûts, elle y perdrait sa marge, et SoundBox produit bien moins cher. Elle doit renouveler sa différenciation.",
        },
      ],
    },
    {
      id: "le-numerique",
      objectifs: [4],
      type: "choix",
      titre: "Le numérique change la donne",
      question: (c) => `Une grande plateforme de vente en ligne propose de vendre les enceintes ${dE(c.entreprise)} dans toute l'Europe, contre une commission et l'accès aux données de ses clients. Qu'est-ce que le numérique change à sa stratégie ?`,
      options: () => [
        {
          texte: "Des clients bien plus nombreux, mais une dépendance à la plateforme et à ses données",
          juste: true,
          retour: "Oui : les plateformes ouvrent des marchés immenses, mais elles fixent leurs règles, prennent une commission et gardent la connaissance des clients. Le choix est stratégique.",
        },
        {
          texte: "Rien : vendre en ligne ou en magasin revient au même pour la stratégie de l'entreprise",
          juste: false,
          retour: "Non : le canal change les clients atteints, les marges et qui détient les données.",
        },
        {
          texte: "Il oblige à accepter : refuser une plateforme, c'est disparaître",
          juste: false,
          retour: "Non : c'est un choix, qui se pèse. Vendre en direct garde la marge et la relation avec les clients.",
        },
      ],
    },
    {
      id: "transparence-et-secret",
      objectifs: [4],
      type: "tri",
      titre: "Transparence et secret",
      question: (c) => `Rangez chaque information ${dE(c.entreprise)} : se publie-t-elle, ou reste-t-elle secrète ?`,
      categories: TRANSPARENCE_OU_SECRET,
      elements: () => [
        { libelle: "Ses comptes annuels, déposés chaque année", montant: 0, categorie: "publier", pourquoi: "Une société dépose ses comptes : ses partenaires et ses salariés peuvent les consulter." },
        { libelle: "Ses engagements pour l'environnement", montant: 0, categorie: "publier", pourquoi: "Ses parties prenantes les attendent : ils se publient, et se vérifient." },
        { libelle: "La date de sortie de la prochaine enceinte", montant: 0, categorie: "secret", pourquoi: "La dire trop tôt aiderait les concurrents : elle reste secrète." },
        { libelle: "Le coût de revient de chaque enceinte", montant: 0, categorie: "secret", pourquoi: "Il dirait aux clients et aux concurrents jusqu'où baisser : secret." },
        { libelle: "Un projet de rachat d'un concurrent", montant: 0, categorie: "secret", pourquoi: "Annoncé trop tôt, il ferait monter le prix ou échouer : secret." },
      ],
      relance: "L'information est-elle due aux parties prenantes, ou donnerait-elle un avantage aux concurrents ?",
      explication: () => ["Les parties prenantes exigent de la transparence ; la concurrence impose le secret des objectifs stratégiques. L'entreprise publie ce qu'elle doit et ce qui la rend digne de confiance, et garde ce qui ferait gagner ses concurrents."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const g = gammeDuMois();
        return [
          `${c.entreprise} est spécialisée : trois domaines dans le même métier. One y fait ${pct(g.partDeOne)} des contributions, une dépendance que la stratégie globale peut réduire, en poussant un autre domaine ou en se diversifiant. Dans chaque domaine, la stratégie construit un avantage, par les coûts ou par la différenciation, qui s'use et se renouvelle.`,
          "Dans l'arène, à partir du niveau où l'entreprise vend une gamme, chaque référence se décide à part : ce sont ses domaines.",
        ];
      },
      repere: () => "Stratégie globale : spécialisation ou diversification. Stratégie de domaine : domination par les coûts ou différenciation. L'avantage concurrentiel est éphémère.",
    },
  ],
};
