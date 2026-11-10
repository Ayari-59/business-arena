import { eur, nombreAuCentieme, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import {
  FACTEURS_DE_FIDELITE,
  MESSAGES_NUMERIQUES,
  RELANCE_DES_ANCIENNES,
  fichierCrm,
  relanceDesAnciennes,
  retoursQuiPaient,
  valeurVieDUneCliente,
} from "../monde/relation-numerique-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : FIDÉLISER GRÂCE AU NUMÉRIQUE, PROGRAMME, VALEUR VIE, GESTION DE LA RELATION CLIENT (Bac STMG,
 * mercatique de terminale, thème 3, question 3.2 : « Comment enrichir la relation client grâce au
 * numérique ? »).
 *
 * MAILLE & CO a une carte de fidélité. Le chapitre range ce qui retient une cliente (la satisfaction, les
 * avantages du programme, l'habitude), calcule la valeur vie d'une cliente de la carte, dit ce que font un
 * programme de fidélité et un logiciel de gestion de la relation client (CRM, Customer Relationship
 * Management), puis prépare une relance numérique ciblée, dans le respect du consentement et de la durée
 * de conservation des données. Le curseur cherche le plus petit nombre de clientes revenues qui paie la
 * relance. Le chapitre finit sur le choix du canal numérique de chaque message.
 *
 * LE CHAPITRE N'EST PAS « FIDÉLISER LA CLIENTÈLE » DU BTS MCO, qui mesure la satisfaction et chiffre la
 * remise de la carte : il en garde la valeur d'une cliente, au niveau du lycée, et ajoute ce que le
 * numérique change, le fichier, le ciblage et le canal.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/relation-numerique-de-la-boutique.ts), chez MAILLE & CO
 * seule : la carte et son fichier de clientele-de-la-boutique.ts ; la relance est une hypothèse nommée
 * dans la fiche.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la durée de vie moyenne est une grandeur, au centième de mois
 * (au dixième près, avant), et la valeur vie en repart, au centime (à l'euro près, avant) ; les
 * clientes à qui écrire sont une quantité.
 */

export const ENTREPRISES_DE_LA_RELATION = ["boutique"] as const;


function leFichier(): TableauDeDonnees {
  const f = fichierCrm();
  return {
    titre: "Le fichier de la carte, par date du dernier achat",
    colonnes: ["Cartes", "Offres acceptées par SMS ou courriel"],
    lignes: f.rangs.map((r) => ({ libelle: `Dernier achat : ${r.dernierAchat}`, valeurs: [qte(r.cartes), qte(r.consentement)] })),
  };
}

export const FIDELISER_GRACE_AU_NUMERIQUE: Chapitre = {
  code: "fideliser-grace-au-numerique",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 3 · La communication de l'offre"],
  titre: "Fidéliser grâce au numérique : programme, valeur vie, gestion de la relation client",
  accroche:
    "Une cliente qui revient chaque mois vaut bien plus que son panier. Ce qui la retient, ce qu'elle vaut, et comment un fichier bien tenu permet de lui parler au bon moment, avec son accord.",
  objectifs: [
    "Distinguer les facteurs de fidélité",
    "Calculer la valeur vie d'une cliente",
    "Dire ce que font un programme de fidélité et un logiciel de gestion de la relation client",
    "Chiffrer une relance numérique ciblée, dans le respect des données personnelles",
    "Choisir le canal numérique de chaque message",
  ],
  libre: false,
  prerequis: ["le-parcours-client"],
  ensuite: ["influence-communaute-et-e-reputation"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_RELATION,
    pourquoi: "ce chapitre lit la carte de fidélité de MAILLE & CO et le fichier de ses clientes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une carte et un fichier",
      notions: ["customer_lifetime_value"],
      tableau: leFichier,
      texte: (c) => {
        const v = valeurVieDUneCliente();
        const f = fichierCrm();
        return [
          `${c.entreprise} a ouvert ${qte(f.cartes)} cartes de fidélité depuis leur lancement. ${qte(v.clientes)} clientes de la carte sont passées en janvier ; chacune laisse ${eur(v.margeDUnMois)} de marge par mois.`,
          "Chaque carte enregistre les achats : la boutique sait qui achète quoi, et quand. C'est la matière d'une relation suivie, à condition de respecter ce que la cliente a accepté.",
        ];
      },
      repere: () => "Fidéliser, c'est faire revenir : garder une cliente coûte moins cher qu'en gagner une nouvelle, et elle rapporte chaque mois qu'elle reste.",
    },
    {
      id: "ce-qui-retient",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui retient une cliente",
      notions: ["churn_rate"],
      question: () => "Rangez chaque raison de revenir sous le facteur de fidélité qu'elle illustre.",
      categories: [
        { code: "satisfaction", libelle: "La satisfaction" },
        { code: "avantages", libelle: "Les avantages du programme" },
        { code: "habitude", libelle: "L'habitude et la proximité" },
      ],
      elements: () => FACTEURS_DE_FIDELITE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.facteur, pourquoi: x.pourquoi })),
      relance: "La cliente revient-elle parce qu'elle est contente, parce qu'elle y gagne, ou parce que c'est plus simple ?",
      explication: () => ["La fidélité la plus solide vient de la satisfaction : les avantages l'entretiennent, l'habitude la rend facile. Une cliente retenue par la seule habitude part dès qu'un concurrent s'installe plus près."],
    },
    {
      id: "la-valeur-vie",
      objectifs: [1],
      type: "montants",
      titre: "Ce que vaut une cliente",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: () => {
        const v = valeurVieDUneCliente();
        return `Chaque mois, ${pct(v.departs * 100)} des clientes de la carte ne reviennent pas. La durée de vie moyenne d'une cliente, en mois, se lit comme 1 divisé par ce taux de départ. Calculez cette durée, puis la valeur vie d'une cliente : la marge d'un mois (${eur(v.margeDUnMois)}) multipliée par la durée.`;
      },
      champs: () => {
        const v = valeurVieDUneCliente();
        return [
          { libelle: "Durée de vie moyenne (mois)", nature: "grandeur", attendu: v.dureeDeVie, calcul: `1 ÷ ${pct(v.departs * 100)} = ${nombreAuCentieme(v.dureeDeVie)} mois` },
          { libelle: "Valeur vie d'une cliente", attendu: v.valeur, calcul: `${eur(v.margeDUnMois)} × ${nombreAuCentieme(v.dureeDeVie)} = ${eur(v.valeur)}` },
        ];
      },
      explication: () => {
        const v = valeurVieDUneCliente();
        return [`Une cliente de la carte vaut ${eur(v.valeur)} de marge sur toute sa relation avec la boutique, pas ${eur(v.margeDUnMois)}. Perdre une cliente, c'est perdre cette valeur ; en garder une de plus chaque mois, c'est la gagner.`];
      },
    },
    {
      id: "le-programme",
      objectifs: [2],
      type: "choix",
      titre: "À quoi sert le programme",
      notions: ["customer_lifetime_value"],
      question: () => "La carte de fidélité sert à récompenser les clientes. À quoi d'autre sert-elle à la boutique ?",
      options: () => [
        { texte: "À savoir ce que chaque cliente achète", juste: true, retour: "Oui : chaque passage avec la carte s'enregistre. La boutique sait qui achète quoi et quand, et peut adapter ses offres à chacune." },
        { texte: "À vendre plus cher aux clientes fidèles", juste: false, retour: "Non : un programme qui ferait payer plus les fidèles les ferait partir. Il les récompense." },
        { texte: "À remplacer la qualité des produits", juste: false, retour: "Non : sans satisfaction, aucun avantage ne retient longtemps. Le programme entretient une fidélité qui vient d'abord de l'offre." },
      ],
    },
    {
      id: "le-crm",
      objectifs: [2],
      type: "choix",
      titre: "Gérer la relation client",
      notions: ["customer_portfolio"],
      question: () => "La boutique loue un logiciel de gestion de la relation client (en anglais, Customer Relationship Management, ou CRM). Que fait un tel outil ?",
      options: () => [
        { texte: "Il suit chaque cliente, une à une", juste: true, retour: "Oui : il réunit l'historique de chaque cliente (achats, dernier passage, consentements) et permet de cibler un message : une relance à celles qui ne viennent plus, une offre à celles qui aiment le cardigan." },
        { texte: "Il compte l'argent de la caisse chaque soir", juste: false, retour: "Non : c'est la caisse. Le CRM suit les clientes, pas les espèces." },
        { texte: "Il envoie la même publicité à tous les habitants", juste: false, retour: "Non : c'est l'inverse d'un CRM, qui personnalise le message selon la cliente." },
      ],
    },
    {
      id: "qui-contacter",
      objectifs: [3],
      type: "montants",
      titre: "À qui écrire, et pour combien",
      notions: ["customer_portfolio"],
      tableau: leFichier,
      question: () => {
        const f = fichierCrm();
        return `Les données d'une cliente qui n'achète plus se gardent ${qte(f.ansDeConservation)} ans après son dernier achat : les cartes dormantes s'effacent. Et seule une cliente qui l'a accepté peut recevoir une offre. Calculez le nombre de clientes à qui la boutique peut écrire, puis le coût d'un SMS à chacune (${eur(f.coutDUnSms)} le SMS).`;
      },
      champs: () => {
        const f = fichierCrm();
        const garde = f.rangs.filter((r) => r.code !== "dormantes");
        return [
          { libelle: "Clientes à qui écrire", nature: "quantite", attendu: f.destinataires, calcul: `${garde.map((r) => qte(r.consentement)).join(" + ")} = ${qte(f.destinataires)}` },
          { libelle: "Coût du SMS à toutes", attendu: f.coutDeLaCampagne, calcul: `${qte(f.destinataires)} × ${eur(f.coutDUnSms)} = ${eur(f.coutDeLaCampagne)}` },
        ];
      },
      explication: () => {
        const f = fichierCrm();
        return [`Sur ${qte(f.cartes)} cartes, la boutique ne peut écrire qu'à ${qte(f.destinataires)} clientes. Les ${qte(f.aEffacer)} cartes dormantes s'effacent, et ${qte(f.gardees - f.destinataires)} clientes gardées n'ont pas accepté les offres : la boutique ne leur en envoie pas.`];
      },
    },
    {
      id: "le-consentement",
      objectifs: [2, 3],
      type: "choix",
      titre: "Avec l'accord de la cliente",
      notions: ["customer_portfolio"],
      question: () => "Une cliente récente a refusé, à l'inscription, de recevoir des offres par SMS. La boutique peut-elle lui envoyer la vente privée par SMS ?",
      options: () => [
        { texte: "Non : elle a refusé les offres", juste: true, retour: "En effet : la cliente a dit non, et la boutique doit respecter ce choix (le règlement général sur la protection des données, et le code des postes et des communications électroniques pour les SMS et les courriels). La vendeuse peut lui parler de la vente privée en boutique." },
        { texte: "Oui, puisqu'elle a une carte de la boutique", juste: false, retour: "Non : avoir une carte ne vaut pas accord pour recevoir des offres, surtout quand la cliente les a refusées. Et un accord donné se retire quand on veut." },
        { texte: "Oui, si le message est court", juste: false, retour: "Non : la longueur ne change rien. La cliente a refusé les offres : pas de SMS commercial." },
      ],
    },
    {
      id: "la-relance",
      objectifs: [3],
      type: "montants",
      titre: "Relancer les anciennes clientes",
      notions: ["customer_lifetime_value", "contribution_margin"],
      question: () => {
        const k = RELANCE_DES_ANCIENNES;
        const r = relanceDesAnciennes(0);
        return `La boutique veut relancer les ${qte(r.destinataires)} anciennes clientes (dernier achat : ${fichierCrm().anciennes.dernierAchat}) qui ont accepté les offres : un SMS chacune, et un bon de ${eur(k.bon)} sur leur prochain achat. Le logiciel de gestion de la relation client coûte ${eur(k.logicielParMois)} par mois. Calculez ce que laisse une cliente qui revient, bon déduit (une marge d'un mois), puis le coût de la relance hors bons : les SMS et le logiciel.`;
      },
      champs: () => {
        const k = RELANCE_DES_ANCIENNES;
        const r = relanceDesAnciennes(0);
        const f = fichierCrm();
        return [
          { libelle: "Ce que laisse une cliente revenue", attendu: r.margeDUnRetour, calcul: `${eur(valeurVieDUneCliente().margeDUnMois)} − ${eur(k.bon)} = ${eur(r.margeDUnRetour)}` },
          { libelle: "Coût de la relance hors bons", attendu: r.coutFixe, calcul: `${qte(r.destinataires)} × ${eur(f.coutDUnSms)} + ${eur(k.logicielParMois)} = ${eur(r.coutFixe)}` },
        ];
      },
      explication: () => {
        const r = relanceDesAnciennes(0);
        return [`Le bon ne coûte que si la cliente revient : il se paie sur sa marge. Le reste de la relance, ${eur(r.coutFixe)}, se paie quoi qu'il arrive.`];
      },
    },
    {
      id: "les-retours-qui-paient",
      objectifs: [3],
      type: "curseur",
      titre: "Combien de retours pour payer la relance",
      notions: ["customer_lifetime_value", "breakeven"],
      question: () => `Faites varier le nombre d'anciennes clientes qui reviennent avec leur bon : une droite donne la marge qu'elles laissent, l'autre le coût de la relance hors bons (${eur(relanceDesAnciennes(0).coutFixe)}). Placez le curseur sur le plus petit nombre de retours qui paie la relance, puis validez.`,
      grandeur: () => ({ libelle: "Clientes revenues", unite: "clientes" }),
      cible: () => ({ attendu: retoursQuiPaient(), max: relanceDesAnciennes(0).destinataires }),
      zones: ["La relance se paie", "La relance coûte plus qu'elle ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu de retours, la relance ne se paie pas encore.",
        dessus: "La relance se paie, mais avec moins de retours aussi : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const r = relanceDesAnciennes(n);
        return [
          { libelle: "Marge des clientes revenues", montant: r.marge },
          { libelle: "SMS et logiciel", montant: r.coutFixe },
          { libelle: "Ce que rapporte la relance", montant: r.gain, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => relanceDesAnciennes(n).marge, cout: (n) => relanceDesAnciennes(n).coutFixe, libelles: ["Marge des clientes revenues", "SMS et logiciel"] }),
      explication: () => {
        const n = retoursQuiPaient();
        const r = relanceDesAnciennes(n);
        return [
          `${qte(n)} retours sur ${qte(r.destinataires)} suffisent : la relance rapporte alors ${eur(r.gain)}. Un message ciblé, à des clientes qui ont déjà acheté, coûte peu et se paie vite.`,
          `Et une cliente revenue peut rester : sa valeur vie, ${eur(valeurVieDUneCliente().valeur)}, dépasse de loin ce seul passage.`,
        ];
      },
    },
    {
      id: "le-bon-canal",
      objectifs: [4],
      type: "choix",
      titre: "Un canal pour chaque message",
      notions: ["customer_portfolio"],
      question: () => `La boutique doit prévenir ses clientes de ${MESSAGES_NUMERIQUES.ventePrivee}. Quel canal numérique choisir ?`,
      options: () => [
        { texte: "Le SMS, lu dans l'heure", juste: true, retour: "Oui : un message court et urgent passe par le SMS, que l'on lit vite. La lettre d'information par courriel, plus longue, convient mieux à la nouvelle collection ; les réseaux sociaux, à l'image de la boutique." },
        { texte: "Une publication sur un réseau social", juste: false, retour: "Non : toutes les clientes ne suivent pas la boutique, et la publication se perd vite dans le fil. Une vente privée se réserve aux clientes de la carte." },
        { texte: "La lettre d'information du mois prochain", juste: false, retour: "Non : elle arriverait après la vente. Le canal se choisit selon l'urgence et la longueur du message." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_lifetime_value", "churn_rate", "customer_portfolio"],
      texte: (c) => {
        const v = valeurVieDUneCliente();
        return [
          `Une cliente de la carte vaut ${eur(v.valeur)} chez ${c.entreprise} : la satisfaction la retient, le programme l'entretient, et le fichier permet de lui parler au bon moment, si elle l'a accepté. Le numérique rend la relation suivie et ciblée, et peu coûteuse.`,
          "Dans l'arène, comparez d'un tour à l'autre les ventes de votre clientèle la plus fidèle : les gardez-vous ?",
        ];
      },
      repere: () => "Durée de vie moyenne = 1 ÷ taux de départ. Valeur vie = marge d'une période × durée de vie. Pas d'offre par SMS ou courriel sans le consentement de la cliente.",
    },
  ],
};
