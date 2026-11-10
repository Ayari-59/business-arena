import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { DESTINATAIRES_QUI_PAIENT, FICHIER_DE_MAILLE, campagne, clienteleDeJanvier, tauxDePenetrationPct } from "../monde/fichier-de-maille";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DONNÉES PERSONNELLES ET DONNÉES OUVERTES (Bac STMG, sciences de gestion et numérique de
 * première, thème 2, question 1 : « En quoi les technologies transforment-elles l'information en
 * ressource ? »).
 *
 * MAILLE & CO tient un fichier de clientes par sa carte de fidélité. Le chapitre fait passer ses
 * données brutes à l'information (le panier moyen d'une fidèle face à celui d'un passant), puis à la
 * connaissance (à qui écrire quand arrive la nouvelle collection). Il fait reconnaître une donnée
 * personnelle et une donnée sensible, et appliquer les règles du règlement général sur la protection
 * des données au niveau du lycée : une finalité, le consentement, le strict nécessaire, une durée de
 * conservation, les droits de la personne. Une donnée ouverte du recensement devient une information
 * (la part des femmes de la zone qui ont la carte). Le curseur chiffre la valeur de l'information : le
 * nombre de clientes consentantes à partir duquel une campagne par courriel paie son coût.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO seule : les achats de janvier de chaque
 * clientèle et la gamme sont ceux de la fiche (maille-et-co.ts) ; le fichier, le consentement, la
 * donnée ouverte et la campagne sont des hypothèses du cours, nommées dans monde/fichier-de-maille.ts.
 * Le point de vue n'est ni celui du fichier qu'on qualifie pour cibler (BTS NDRC), ni celui de la
 * table qu'on trie et regroupe (« Des données à l'information ») : ici, ce que vaut l'information, et
 * ce que la loi protège.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la part des femmes de la zone qui ont la carte se donnait au
 * dixième de point, elle est à deux décimales (monde/fichier-de-maille.ts).
 */

export const ENTREPRISES_DES_DONNEES = ["boutique"] as const;


function lesClienteles(c: Cas): TableauDeDonnees {
  const f = clienteleDeJanvier("fideles");
  const p = clienteleDeJanvier("passants");
  return {
    titre: `Les ventes de janvier de ${c.entreprise}, en caisse`,
    colonnes: ["Clientes fidèles", "Passants"],
    lignes: [
      { libelle: "Passages en caisse", valeurs: [qte(f.tickets), qte(p.tickets)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(f.chiffreDAffaires), eur(p.chiffreDAffaires)] },
    ],
  };
}

export const DONNEES_PERSONNELLES_ET_DONNEES_OUVERTES: Chapitre = {
  code: "donnees-personnelles-et-donnees-ouvertes",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Données personnelles et données ouvertes",
  accroche:
    "Une carte de fidélité, un fichier de clientes, une donnée publique du recensement : de quoi faire de l'information, et de la connaissance. Ce que vaut l'information, et ce que la loi protège.",
  objectifs: [
    "Distinguer une donnée, une information et une connaissance",
    "Reconnaître une donnée personnelle et appliquer les règles qui la protègent",
    "Transformer une donnée ouverte en information utile",
    "Chiffrer la valeur d'une information pour une décision",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_DONNEES,
    pourquoi: "ce chapitre lit le fichier de clientes de MAILLE & CO, dont le cours tient les ventes de janvier, clientèle par clientèle.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une carte de fidélité",
      notions: ["segmentation"],
      tableau: lesClienteles,
      texte: () => [
        `À chaque passage en caisse, la carte de fidélité enregistre la date, les articles, le montant. Le fichier compte ${qte(FICHIER_DE_MAILLE.inscrites)} clientes : leur nom, leur courriel, leur date de naissance, leur ville, et ce qu'elles achètent.`,
        "Ces données ne disent rien seules. Rassemblées, calculées, elles deviennent de l'information ; interprétées par celle qui décide, de la connaissance. Mais ce sont des données personnelles : la loi encadre ce qu'on en fait.",
      ],
      repere: () => "Donnée (un fait brut) → information (une donnée mise en forme, qui a un sens) → connaissance (une information comprise, qui guide l'action).",
    },
    {
      id: "donnee-information-connaissance",
      objectifs: [0],
      type: "tri",
      titre: "Donnée, information, connaissance",
      question: () => "Rangez chaque élément : est-ce une donnée, une information ou une connaissance ?",
      categories: [
        { code: "donnee", libelle: "Donnée" },
        { code: "information", libelle: "Information" },
        { code: "connaissance", libelle: "Connaissance" },
      ],
      elements: () => [
        { libelle: "Ticket du 14 janvier : un cardigan, 75 € hors taxes", montant: 0, categorie: "donnee", pourquoi: "Un fait enregistré, isolé, sans traitement : une donnée." },
        { libelle: "Le nombre de passages en caisse des clientes fidèles en janvier", montant: 0, categorie: "donnee", pourquoi: "Un comptage brut, qu'il faut encore rapprocher d'autre chose pour qu'il dise quelque chose." },
        { libelle: "Le panier moyen d'une fidèle est presque le double de celui d'un passant", montant: 0, categorie: "information", pourquoi: "Des données calculées et comparées : une information, qui a un sens." },
        { libelle: "Les fidèles achètent surtout la maille chère : c'est à elles d'annoncer la collection", montant: 0, categorie: "connaissance", pourquoi: "Une information interprétée, qui guide une décision : une connaissance." },
      ],
      relance: "Demandez-vous : est-ce un fait brut, un fait mis en forme qui a un sens, ou une compréhension qui guide l'action ?",
      explication: () => [
        "Le numérique enregistre des données en masse, à chaque passage en caisse. Quand elles se comptent par millions, arrivent sans cesse et sous toutes les formes (les achats en ligne, les clics, les avis), on parle de mégadonnées (big data) : seuls des outils puissants savent les traiter. Leur valeur vient du traitement qui en fait de l'information, et de la personne qui en tire une connaissance.",
      ],
    },
    {
      id: "le-panier-moyen",
      objectifs: [0],
      type: "montants",
      titre: "Des données à l'information",
      notions: ["average_basket"],
      tableau: lesClienteles,
      question: () => "Calculez le panier moyen d'une cliente fidèle et celui d'un passant, en janvier (chiffre d'affaires ÷ passages en caisse).",
      champs: () => {
        const f = clienteleDeJanvier("fideles");
        const p = clienteleDeJanvier("passants");
        return [
          { libelle: "Panier moyen d'une cliente fidèle", attendu: f.panierMoyen, calcul: `${eur(f.chiffreDAffaires)} ÷ ${qte(f.tickets)} = ${eur(f.panierMoyen)}` },
          { libelle: "Panier moyen d'un passant", attendu: p.panierMoyen, calcul: `${eur(p.chiffreDAffaires)} ÷ ${qte(p.tickets)} = ${eur(p.panierMoyen)}` },
        ];
      },
      explication: () => {
        const f = clienteleDeJanvier("fideles");
        const p = clienteleDeJanvier("passants");
        return [
          `Les deux clientèles font presque le même chiffre d'affaires, mais une fidèle dépense ${eur(f.panierMoyen)} à chaque passage, un passant ${eur(p.panierMoyen)}. Sans la carte, la boutique ne le saurait pas : c'est la donnée enregistrée qui devient information.`,
        ];
      },
    },
    {
      id: "donnees-personnelles",
      objectifs: [1],
      type: "tri",
      titre: "Qu'est-ce qu'une donnée personnelle ?",
      question: () => "Rangez chaque donnée que tient la boutique : est-elle personnelle, personnelle et sensible, ou ne concerne-t-elle personne ?",
      categories: [
        { code: "personnelle", libelle: "Personnelle" },
        { code: "sensible", libelle: "Sensible" },
        { code: "aucune", libelle: "Pas personnelle" },
      ],
      elements: () => [
        { libelle: "L'adresse de courriel d'une cliente", montant: 0, categorie: "personnelle", pourquoi: "Elle identifie une personne : une donnée personnelle." },
        { libelle: "Le numéro de la carte de fidélité", montant: 0, categorie: "personnelle", pourquoi: "Il identifie une cliente, indirectement : c'est encore une donnée personnelle." },
        { libelle: "Une allergie à la laine notée par une vendeuse", montant: 0, categorie: "sensible", pourquoi: "Une donnée de santé : sensible, son traitement est en principe interdit." },
        { libelle: "Le chiffre d'affaires du rayon maille en janvier", montant: 0, categorie: "aucune", pourquoi: "Un total de la boutique, qui ne renvoie à personne." },
        { libelle: "Les entrées comptées à la porte chaque heure", montant: 0, categorie: "aucune", pourquoi: "Un comptage anonyme : aucune personne n'y est reconnaissable." },
      ],
      relance: "Demandez-vous : permet-elle de reconnaître une personne, même indirectement ? Touche-t-elle à sa santé, ses opinions, sa religion ?",
      explication: () => [
        "Une donnée est personnelle dès qu'elle permet de reconnaître une personne, directement ou non. Les données sensibles (santé, opinions, religion, orientation sexuelle, origine) sont protégées plus fortement encore : la boutique n'a pas à noter une allergie.",
      ],
    },
    {
      id: "la-finalite",
      objectifs: [1],
      type: "choix",
      titre: "Vendre le fichier ?",
      question: () => "Un institut de beauté voisin propose d'acheter le fichier des clientes pour leur écrire. Le gérant peut-il le lui vendre ?",
      options: () => [
        { texte: "Non : ces données ont été confiées pour la carte seule", juste: true, retour: "Oui : une donnée personnelle se collecte pour une finalité précise, dite à la personne. La céder à une autre entreprise demande l'accord exprès de chaque cliente. Sans lui, la vente est illégale." },
        { texte: "Oui : le fichier appartient à la boutique, qui l'a constitué", juste: false, retour: "Non : la boutique tient le fichier, mais les données restent celles des clientes, qui gardent des droits sur elles." },
        { texte: "Oui, à condition de ne pas transmettre les dates de naissance", juste: false, retour: "Non : retirer une colonne ne change rien. Les courriels sont des données personnelles, collectées pour une autre finalité." },
      ],
    },
    {
      id: "le-strict-necessaire",
      objectifs: [1],
      type: "choix",
      titre: "Le strict nécessaire",
      question: () => "Le nouveau formulaire de la carte demande la profession et le revenu de la cliente, « pour mieux la connaître ». Que dire de ces deux questions ?",
      options: () => [
        { texte: "Elles sont de trop : la carte n'en a pas besoin", juste: true, retour: "Oui : le règlement demande de ne collecter que les données nécessaires à la finalité, ici la fidélité et les offres. C'est la minimisation. Une donnée inutile est un risque de plus en cas de fuite." },
        { texte: "Elles sont permises si la cliente peut ne pas répondre", juste: false, retour: "Non : facultatives ou non, elles ne servent pas la finalité de la carte. Le strict nécessaire s'applique à tout le formulaire." },
        { texte: "Elles sont utiles : plus le fichier est riche, plus il a de valeur", juste: false, retour: "Non : la loi ne mesure pas la valeur commerciale. Elle limite la collecte à ce que la finalité demande." },
      ],
    },
    {
      id: "la-duree-et-les-droits",
      objectifs: [1],
      type: "choix",
      titre: "Combien de temps, et quels droits ?",
      question: () => "Une cliente qui n'est pas venue depuis quatre ans demande qu'on efface ses données. Que fait la boutique ?",
      options: () => [
        { texte: "Elle efface tout, sous un mois : c'est son droit", juste: true, retour: "Oui : toute personne a un droit d'accès, de rectification, d'opposition et d'effacement. Et la boutique aurait dû supprimer d'elle-même une cliente sans achat depuis trois ans, la durée que la CNIL recommande pour un fichier de prospects." },
        { texte: "Elle garde ses données, mais ne lui écrit plus", juste: false, retour: "Non : ne plus écrire répond au droit d'opposition, pas à la demande d'effacement. Les données doivent disparaître du fichier." },
        { texte: "Elle les garde : une carte de fidélité ne se supprime jamais", juste: false, retour: "Non : aucune donnée ne se garde sans limite. Une durée de conservation est fixée selon la finalité." },
      ],
    },
    {
      id: "la-donnee-ouverte",
      objectifs: [2],
      type: "montants",
      titre: "Une donnée ouverte devient une information",
      question: () =>
        `Les données ouvertes du recensement, publiées gratuitement, comptent ${qte(FICHIER_DE_MAILLE.femmesDeLaZone)} femmes de 25 à 64 ans dans les communes d'où viennent les clientes. Calculez la part de ces femmes qui ont la carte de la boutique, à deux décimales.`,
      champs: () => [
        {
          libelle: "Part des femmes de la zone qui ont la carte (%)",
          attendu: tauxDePenetrationPct(),
          calcul: `${qte(FICHIER_DE_MAILLE.inscrites)} ÷ ${qte(FICHIER_DE_MAILLE.femmesDeLaZone)} × 100 = ${pct(tauxDePenetrationPct())}`,
        },
      ],
      explication: () => [
        `Une donnée publique, rapprochée d'une donnée de la boutique, fait une information : ${pct(tauxDePenetrationPct())} des clientes possibles ont la carte. Il reste de la place pour en gagner. Les données ouvertes (open data) sont publiées par l'État, les collectivités, des entreprises, pour que chacun les réutilise.`,
      ],
    },
    {
      id: "la-valeur-de-l-information",
      objectifs: [3],
      type: "curseur",
      titre: "Ce que vaut le consentement",
      notions: ["segmentation"],
      sens: "plus-petite",
      question: () => {
        const f = clienteleDeJanvier("fideles");
        return `Une campagne par courriel coûte ${eur(FICHIER_DE_MAILLE.campagne.cout)} ; ${pct(FICHIER_DE_MAILLE.campagne.tauxDeRetour * 100)} des clientes qui la reçoivent viennent acheter, et chaque passage d'une fidèle laisse ${eur(f.margeParTicket)} de marge. Seules les clientes qui ont donné leur accord peuvent la recevoir. Faites varier leur nombre : placez le curseur sur le plus petit nombre de clientes consentantes pour que la campagne paie son coût.`;
      },
      grandeur: () => ({ libelle: "Clientes consentantes", unite: "clientes" }),
      cible: () => ({ attendu: DESTINATAIRES_QUI_PAIENT, max: FICHIER_DE_MAILLE.inscrites }),
      zones: ["La campagne paie son coût", "La campagne coûte plus qu'elle ne rapporte"],
      rates: () => ({ dessous: "Avec si peu de destinataires, la marge ne paie pas la campagne.", dessus: "La campagne se paie déjà avec moins de clientes : cherchez plus bas." }),
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const k = campagne(n);
        return [
          { libelle: "Marge des achats que la campagne fait venir", montant: k.marge },
          { libelle: "Coût de la campagne", montant: k.cout },
          { libelle: "Ce que la campagne rapporte", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => n * campagne(1).parDestinataire, cout: () => FICHIER_DE_MAILLE.campagne.cout, libelles: ["Marge des achats que la campagne fait venir", "Coût de la campagne"] }),
      explication: () => {
        const k = campagne(FICHIER_DE_MAILLE.consentantes);
        return [
          `Il faut ${qte(DESTINATAIRES_QUI_PAIENT)} clientes consentantes pour que la campagne paie ses ${eur(FICHIER_DE_MAILLE.campagne.cout)}. La boutique en a ${qte(FICHIER_DE_MAILLE.consentantes)} : la campagne rapporte ${eur(k.gain)}.`,
          "L'information a une valeur parce qu'elle sert une décision ; elle ne la garde que si elle est juste, à jour, et utilisable dans le respect de la loi. Une cliente qui n'a pas consenti ne compte pas.",
        ];
      },
    },
    {
      id: "le-systeme-d-information",
      objectifs: [3],
      type: "choix",
      titre: "Ce qui donne sa valeur à l'information",
      question: () => "La moitié des courriels du fichier datent de plus de cinq ans, et beaucoup reviennent en erreur. Que perd l'information ?",
      options: () => [
        { texte: "Sa fiabilité : une information périmée trompe la décision", juste: true, retour: "Oui : une information vaut si elle est fiable, à jour, pertinente, et accessible à qui en a besoin au bon moment. Le système d'information de la boutique (la caisse, le fichier, l'outil d'envoi) doit être tenu : c'est un coût, et c'est ce qui garde sa valeur." },
        { texte: "Rien : un fichier ancien compte plus de clientes, il vaut plus", juste: false, retour: "Non : des adresses fausses font des envois perdus et des calculs faux. La taille d'un fichier ne fait pas sa valeur." },
        { texte: "Son caractère personnel : une donnée ancienne n'est plus protégée", juste: false, retour: "Non : une donnée personnelle reste protégée tant qu'elle est gardée, et elle ne doit pas l'être au-delà de sa durée de conservation." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Chez ${c.entreprise}, la carte de fidélité enregistre des données ; calculées, elles deviennent une information (le panier moyen d'une fidèle, ${eur(clienteleDeJanvier("fideles").panierMoyen)}) ; comprises, une connaissance qui guide la décision. Les données ouvertes, rapprochées des siennes, en apprennent davantage.`,
        `Ce sont des données personnelles : une finalité dite, le consentement pour une offre, le strict nécessaire, une durée de conservation, et les droits des clientes. Leur valeur se chiffre : ${qte(DESTINATAIRES_QUI_PAIENT)} consentantes suffisent à payer une campagne. Dans l'arène, la boutique ne tient pas de fichier ; ses clientèles, elles, se lisent au marché du tour.`,
      ],
      repere: () => "Une donnée personnelle se collecte pour une finalité, avec le strict nécessaire, pour une durée limitée, et la personne garde ses droits sur elle.",
    },
  ],
};
