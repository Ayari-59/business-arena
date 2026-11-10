import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  CALENDRIER_DU_RECRUTEMENT,
  COUT_D_UN_MOIS_DE_SAISONNIER,
  MOIS_POUR_UN_SAISONNIER,
  SEMAINES_AVANT_LA_SAISON,
  TAUX_DU_PLACEMENT,
  placementDeLEte,
  saisonsDeLEscale,
} from "../monde/temps-de-l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TEMPS DE L'ORGANISATION, HORIZON, SAISONS, PLANNING, VALEUR DU TEMPS (Bac STMG, sciences
 * de gestion et numérique de première, thème 4, question 1 : « Quelle prise en compte du temps dans la
 * gestion ? »).
 *
 * Ce que l'audit trouvait absent de la question, hors du seuil et du budget (deux chapitres à part) :
 * l'horizon et la période d'une décision, les contraintes saisonnières et institutionnelles, les outils
 * de planification et le calendrier, la veille, l'asymétrie d'information, et le lien entre le temps et
 * la valeur financière. Il se joue à L'ESCALE, un hôtel dont l'été est plein et l'hiver creux : ses
 * saisons, le calendrier à rebours du recrutement des saisonniers, la veille de la directrice, et le
 * placement de l'excédent de l'été jusqu'à l'été suivant (le curseur : les mois de placement dont les
 * intérêts paient un mois de saisonnier). L'actualité de l'information, elle, est le sujet de « Une
 * information qui circule à temps », que le programme range aussi sous ce thème.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez L'ESCALE seule : les saisons et le coût de l'équipe
 * viennent de la fiche de l'hôtel, le taux du placement du fonds monétaire du cours ; le calendrier et le
 * placement de l'été sont des hypothèses du cours, nommées dans monde/temps-de-l-escale.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux d'occupation se donnaient au dixième de point, ils
 * sont à deux décimales (monde/temps-de-l-escale.ts) ; les nuitées refusées et les semaines sont
 * des quantités.
 */

export const ENTREPRISES_DU_TEMPS = ["hotel"] as const;

const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

function lesSaisons(c: Cas): TableauDeDonnees {
  const s = saisonsDeLEscale();
  return {
    titre: `Les quatre saisons ${dE(c.entreprise)}, en nuitées`,
    colonnes: s.map((t) => `T${t.numero}`),
    lignes: [
      { libelle: "Nuitées demandées", valeurs: s.map((t) => qte(t.demande)) },
      { libelle: "Nuitées offertes", valeurs: s.map((t) => qte(t.offertes)) },
      { libelle: "Nuitées vendues", valeurs: s.map((t) => qte(t.vendues)) },
      { libelle: "Résultat du trimestre", valeurs: s.map((t) => eur(t.resultat)) },
    ],
  };
}

function leCalendrier(): TableauDeDonnees {
  return {
    titre: "Le recrutement des saisonniers, tâche par tâche",
    colonnes: ["Durée"],
    lignes: CALENDRIER_DU_RECRUTEMENT.map((t) => ({ libelle: t.tache, valeurs: [`${qte(t.semaines)} semaine${t.semaines > 1 ? "s" : ""}`] })),
  };
}

export const LE_TEMPS_DE_L_ORGANISATION: Chapitre = {
  code: "le-temps-de-l-organisation",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 4 · Temps et risque"],
  titre: "Le temps de l'organisation : horizon, saisons, planning, valeur du temps",
  accroche:
    "Un hôtel plein l'été et à moitié vide l'hiver : il vit au rythme des saisons et des calendriers. Décider à la semaine ou à dix ans, recruter à temps, guetter ce qui change, et placer l'argent de l'été jusqu'à l'été suivant.",
  objectifs: [
    "Situer une décision dans son horizon : court, moyen ou long terme",
    "Tenir compte des contraintes saisonnières et institutionnelles, et planifier",
    "Relier le temps et la valeur de l'argent : l'intérêt simple",
    "Expliquer ce que la veille et l'asymétrie d'information changent à la décision",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TEMPS,
    pourquoi: "ce chapitre suit l'année de L'ESCALE, dont le cours tient les saisons, l'équipe et ce qu'elle coûte.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un hôtel au rythme des saisons",
      notions: ["seasonality", "occupancy_revpar"],
      tableau: lesSaisons,
      texte: (c) => [
        `${c.entreprise} offre chaque trimestre le même nombre de nuitées. Mais ses clients ne viennent pas au même rythme : les touristes l'été, les clients d'affaires et les séminaires au printemps et à l'automne. L'été, des clients sont refusés ; l'hiver, des chambres restent vides.`,
        "Gérer, c'est aussi gérer le temps : décider à la bonne échéance, prévoir ce que chaque saison demande, s'y préparer à temps, et faire travailler l'argent qui attend.",
      ],
      repere: () => "Le temps en gestion : un horizon (court, moyen, long terme), des périodes (le mois, le trimestre, l'exercice), des contraintes (les saisons, les calendriers fixés par les institutions).",
    },
    {
      id: "les-saisons",
      objectifs: [1],
      type: "montants",
      titre: "L'été et l'hiver",
      notions: ["occupancy_revpar", "seasonality"],
      tableau: lesSaisons,
      question: () => "Calculez le taux d'occupation de l'hiver (trimestre 1) et de l'été (trimestre 3), à deux décimales, et les nuitées refusées l'été.",
      champs: () => {
        const s = saisonsDeLEscale();
        const h = s[0]!;
        const e = s[2]!;
        return [
          { libelle: "Taux d'occupation de l'hiver (%)", attendu: h.occupationPct, calcul: `${qte(h.vendues)} ÷ ${qte(h.offertes)} × 100 = ${pct(h.occupationPct)}` },
          { libelle: "Taux d'occupation de l'été (%)", attendu: e.occupationPct, calcul: `${qte(e.vendues)} ÷ ${qte(e.offertes)} × 100 = ${pct(e.occupationPct)}` },
          { libelle: "Nuitées refusées l'été", nature: "quantite", attendu: e.refusees, calcul: `${qte(e.demande)} − ${qte(e.vendues)} = ${qte(e.refusees)}` },
        ];
      },
      explication: () => {
        const s = saisonsDeLEscale();
        return [`L'hiver, ${pct(s[0]!.occupationPct)} des chambres servent ; l'été, toutes, et ${qte(s[2]!.refusees)} nuitées sont refusées. Le résultat suit : ${eur(s[0]!.resultat)} l'hiver, ${eur(s[2]!.resultat)} l'été. C'est une contrainte saisonnière : l'hôtel ne la choisit pas, il s'y organise.`];
      },
    },
    {
      id: "l-horizon",
      objectifs: [0],
      type: "tri",
      titre: "L'horizon d'une décision",
      question: () => "Rangez chaque décision de la directrice selon son horizon : court, moyen ou long terme.",
      categories: [
        { code: "court", libelle: "Court terme" },
        { code: "moyen", libelle: "Moyen terme" },
        { code: "long", libelle: "Long terme" },
      ],
      elements: () => [
        { libelle: "Le planning des femmes de chambre de la semaine prochaine", montant: 0, categorie: "court", pourquoi: "Une décision de quelques jours, qui se reprend la semaine suivante : le court terme." },
        { libelle: "Le prix d'une nuitée ce week-end, selon les réservations", montant: 0, categorie: "court", pourquoi: "Un ajustement immédiat : le court terme." },
        { libelle: "Le budget de l'année prochaine et le nombre de saisonniers", montant: 0, categorie: "moyen", pourquoi: "Une décision pour l'exercice à venir : le moyen terme." },
        { libelle: "Construire une aile de 20 chambres", montant: 0, categorie: "long", pourquoi: "Un investissement qui engage l'hôtel pour des années : le long terme." },
      ],
      relance: "Demandez-vous : la décision engage-t-elle l'hôtel quelques jours, une année, ou bien plus ?",
      explication: () => [
        "Plus l'horizon est lointain, plus la décision engage, et plus l'information est incertaine. Le court terme se pilote (le planning), le moyen terme se budgète, le long terme relève de la stratégie.",
      ],
    },
    {
      id: "les-contraintes",
      objectifs: [1],
      type: "tri",
      titre: "Saisons et calendriers",
      question: () => "Rangez chaque contrainte : vient-elle du rythme du marché (saisonnière), ou d'une règle fixée par une institution (institutionnelle) ?",
      categories: [
        { code: "saisonniere", libelle: "Saisonnière" },
        { code: "institutionnelle", libelle: "Institutionnelle" },
      ],
      elements: () => [
        { libelle: "Les touristes qui arrivent en juillet et en août", montant: 0, categorie: "saisonniere", pourquoi: "Le rythme de la demande : une contrainte saisonnière." },
        { libelle: "Les séminaires d'entreprise du printemps et de l'automne", montant: 0, categorie: "saisonniere", pourquoi: "Le rythme d'une clientèle : saisonnier aussi." },
        { libelle: "Les dates des vacances scolaires, fixées par l'État", montant: 0, categorie: "institutionnelle", pourquoi: "Un calendrier décidé par une institution : institutionnel." },
        { libelle: "La durée maximale de travail d'un salarié dans la semaine", montant: 0, categorie: "institutionnelle", pourquoi: "Une règle du droit du travail : institutionnelle." },
        { libelle: "Le dépôt des comptes de l'exercice dans les délais légaux", montant: 0, categorie: "institutionnelle", pourquoi: "Une échéance que la loi fixe : institutionnelle." },
      ],
      relance: "Demandez-vous : est-ce le marché qui l'impose, ou une loi, une administration, un calendrier officiel ?",
      explication: () => [
        "Les deux pèsent sur le calendrier de l'hôtel : la saison dit quand il faut du monde, les règles disent comment on peut l'employer. L'outil qui les réunit, c'est le planning.",
      ],
    },
    {
      id: "le-calendrier",
      objectifs: [1],
      type: "montants",
      titre: "Recruter à temps",
      tableau: leCalendrier,
      question: () => "Les saisonniers doivent être prêts le 1er juillet. Les tâches du recrutement se suivent, sans se chevaucher. Combien de semaines avant le 1er juillet la directrice doit-elle publier l'annonce ?",
      champs: () => [
        {
          libelle: "Semaines avant le 1er juillet",
          nature: "quantite",
          attendu: SEMAINES_AVANT_LA_SAISON,
          calcul: `${CALENDRIER_DU_RECRUTEMENT.map((t) => qte(t.semaines)).join(" + ")} = ${qte(SEMAINES_AVANT_LA_SAISON)} semaines`,
        },
      ],
      explication: () => [
        `L'annonce doit partir ${qte(SEMAINES_AVANT_LA_SAISON)} semaines avant la saison, début mai. C'est un rétroplanning : on part de l'échéance et l'on remonte le temps, tâche par tâche. Un diagramme de Gantt le dessine, une barre par tâche sur un calendrier, et montre ce qui retarde tout si une tâche glisse.`,
      ],
    },
    {
      id: "la-veille",
      objectifs: [3],
      type: "tri",
      titre: "La veille",
      question: () => "La directrice consacre une heure par semaine à la veille. Rangez chaque information qu'elle guette selon sa veille.",
      categories: [
        { code: "concurrentielle", libelle: "Concurrentielle" },
        { code: "commerciale", libelle: "Commerciale" },
        { code: "reglementaire", libelle: "Réglementaire" },
        { code: "technologique", libelle: "Technologique" },
      ],
      elements: () => [
        { libelle: "Les prix affichés par Le Comptoir pour l'été", montant: 0, categorie: "concurrentielle", pourquoi: "Ce que font les concurrents : la veille concurrentielle." },
        { libelle: "Les avis de ses clients et ce qu'ils attendent", montant: 0, categorie: "commerciale", pourquoi: "Les clients et leurs attentes : la veille commerciale." },
        { libelle: "Une nouvelle règle sur la taxe de séjour", montant: 0, categorie: "reglementaire", pourquoi: "Ce que la loi change : la veille réglementaire." },
        { libelle: "Les serrures qui s'ouvrent avec le téléphone du client", montant: 0, categorie: "technologique", pourquoi: "Ce que la technique permet : la veille technologique." },
      ],
      relance: "Demandez-vous : l'information porte-t-elle sur les concurrents, les clients, la loi, ou la technique ?",
      explication: () => [
        "La veille rend l'information actuelle : elle signale un changement assez tôt pour qu'on s'y prépare. Une information juste mais tardive vaut peu, comme le montre le chapitre « Une information qui circule à temps ».",
      ],
    },
    {
      id: "l-asymetrie",
      objectifs: [3],
      type: "choix",
      titre: "L'asymétrie d'information",
      question: () => "Un client qui réserve ne voit pas la chambre avant d'arriver ; l'hôtel, lui, sait si elle donne sur la rue bruyante. Comment nomme-t-on cette situation, et qu'est-ce qui la réduit ?",
      options: () => [
        { texte: "Une asymétrie d'information, que les avis réduisent", juste: true, retour: "Oui : l'une des parties sait ce que l'autre ignore. Le client se méfie et paie moins volontiers. Au sein d'une équipe aussi, celui qui retient une information garde un avantage sur les autres. Les avis publiés, les photos, une description honnête réduisent l'écart : ils rendent l'information plus égale, et l'hôtel y gagne la confiance." },
        { texte: "Un retard d'information, que la veille corrige", juste: false, retour: "Non : l'information n'est pas en retard, elle est inégale. L'hôtel la détient, le client ne l'a pas." },
        { texte: "Une contrainte saisonnière, qui disparaît hors de l'été", juste: false, retour: "Non : la chambre donne sur la rue en toute saison. C'est un écart d'information entre deux parties." },
      ],
    },
    {
      id: "l-enquete",
      objectifs: [1],
      type: "choix",
      titre: "Prévoir l'été prochain",
      question: () =>
        "Pour décider du nombre de saisonniers de l'été prochain, la directrice hésite entre reprendre les chiffres de cet été, ou interroger ses clients et les offices de tourisme sur leurs projets. Que lui apporte l'enquête ?",
      options: () => [
        { texte: "Une information sur l'avenir, que le passé ne donne pas", juste: true, retour: "Oui : les chiffres passés disent ce qui a été ; l'enquête, ce que les clients projettent (un salon annoncé, un séminaire déplacé). C'est un outil de prospective, comme le budget et le seuil de rentabilité : il réduit l'incertitude, sans la supprimer." },
        { texte: "Rien : l'été prochain sera comme celui-ci, les saisons reviennent", juste: false, retour: "Non : la saison revient, mais son niveau change (un concurrent, un événement, la météo). Le passé seul ne le dit pas." },
        { texte: "Une certitude : ce que disent les clients se réalisera", juste: false, retour: "Non : une intention n'est pas une réservation. L'enquête réduit l'incertitude, elle ne la supprime pas." },
      ],
    },
    {
      id: "les-interets",
      objectifs: [2],
      type: "montants",
      titre: "L'argent de l'été placé",
      notions: ["discounting"],
      question: () => {
        const k = placementDeLEte(6);
        return `Le 1er octobre, la directrice place le résultat de l'été, ${eur(k.capital)}, sur un fonds monétaire à ${pct(TAUX_DU_PLACEMENT * 100)} l'an, en intérêts simples. Calculez les intérêts et la valeur acquise au bout de ${qte(k.mois)} mois.`;
      },
      champs: () => {
        const k = placementDeLEte(6);
        return [
          { libelle: `Intérêts de ${qte(k.mois)} mois`, attendu: k.interets, calcul: `${eur(k.capital)} × ${pct(TAUX_DU_PLACEMENT * 100)} × ${qte(k.mois)} ÷ 12 = ${eur(k.interets)}` },
          { libelle: "Valeur acquise", attendu: k.valeurAcquise, calcul: `${eur(k.capital)} + ${eur(k.interets)} = ${eur(k.valeurAcquise)}` },
        ];
      },
      explication: () => {
        const k = placementDeLEte(6);
        return [`${qte(k.mois)} mois plus tard, ${eur(k.capital)} sont devenus ${eur(k.valeurAcquise)} : le temps a une valeur. Un euro d'aujourd'hui vaut plus qu'un euro dans un an, parce qu'il peut rapporter d'ici là.`];
      },
    },
    {
      id: "le-placement-qui-paie",
      objectifs: [2],
      type: "curseur",
      titre: "Combien de mois de placement ?",
      notions: ["discounting"],
      sens: "plus-petite",
      question: () =>
        `Un saisonnier coûte ${eur(COUT_D_UN_MOIS_DE_SAISONNIER)} par mois. Faites varier la durée du placement de l'été : une droite donne les intérêts, l'autre le coût d'un mois de saisonnier. Placez le curseur sur le plus petit nombre de mois dont les intérêts paient un mois de saisonnier.`,
      grandeur: () => ({ libelle: "Durée du placement", unite: "mois" }),
      cible: () => ({ attendu: MOIS_POUR_UN_SAISONNIER, max: 12 }),
      zones: ["Les intérêts paient un mois de saisonnier", "Les intérêts ne suffisent pas"],
      rates: () => ({ dessous: "Les intérêts ne paient pas encore un mois de saisonnier.", dessus: "Les intérêts suffisent déjà avec moins de mois : cherchez plus bas." }),
      montrer: "Montrer la durée",
      lecture: (_c, n) => {
        const k = placementDeLEte(n);
        return [
          { libelle: "Intérêts du placement", montant: k.interets },
          { libelle: "Un mois de saisonnier", montant: COUT_D_UN_MOIS_DE_SAISONNIER },
          { libelle: "Ce que les intérêts laissent", montant: k.interets - COUT_D_UN_MOIS_DE_SAISONNIER, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => (placementDeLEte(0).capital * TAUX_DU_PLACEMENT * n) / 12, cout: () => COUT_D_UN_MOIS_DE_SAISONNIER, libelles: ["Intérêts du placement", "Un mois de saisonnier"] }),
      explication: () => {
        const k = placementDeLEte(MOIS_POUR_UN_SAISONNIER);
        return [
          `Au bout de ${qte(MOIS_POUR_UN_SAISONNIER)} mois, le 1er juillet, les intérêts font ${eur(k.interets)} : l'argent de l'été, placé jusqu'à l'été suivant, paie le premier mois d'un saisonnier. Placé un mois de moins, il ne le paierait pas.`,
          "Un fonds monétaire se retire le lendemain : l'hôtel garde l'argent disponible pour l'hiver, s'il en a besoin. Plus le placement est long et bloqué, plus il rapporte, et moins il laisse de souplesse.",
        ];
      },
    },
    {
      id: "la-valeur-du-temps",
      objectifs: [2],
      type: "choix",
      titre: "Payer maintenant ou plus tard",
      question: () => "Le fournisseur de linge propose 6 000 € payés aujourd'hui, ou 6 000 € payés dans 6 mois, sans frais. L'hôtel a l'argent. Que choisir ?",
      options: () => [
        { texte: "Payer dans 6 mois, et placer l'argent d'ici là", juste: true, retour: "Oui : la même somme payée plus tard coûte moins, puisque l'argent rapporte en attendant. Le temps a une valeur : c'est pourquoi un fournisseur qui fait attendre son paiement fait crédit à son client." },
        { texte: "Payer aujourd'hui : une dette payée est un souci de moins", juste: false, retour: "Non : sans frais ni escompte, payer tôt revient à prêter gratuitement au fournisseur l'argent qu'on aurait pu placer." },
        { texte: "Les deux se valent : c'est la même somme, 6 000 €", juste: false, retour: "Non : 6 000 € aujourd'hui valent plus que 6 000 € dans 6 mois, parce que les premiers peuvent rapporter des intérêts." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const s = saisonsDeLEscale();
        return [
          `${c.entreprise} vit au rythme des saisons : ${pct(s[0]!.occupationPct)} d'occupation l'hiver, un été plein qui refuse ${qte(s[2]!.refusees)} nuitées. Chaque décision a son horizon : le planning à la semaine, le budget à l'année, l'investissement à dix ans et plus. Les contraintes saisonnières et institutionnelles se réunissent dans le planning, construit à rebours depuis l'échéance : l'annonce part ${qte(SEMAINES_AVANT_LA_SAISON)} semaines avant la saison.`,
          `La veille garde l'information actuelle ; les avis réduisent l'asymétrie d'information avec les clients. Et le temps a une valeur : l'argent de l'été, placé ${qte(MOIS_POUR_UN_SAISONNIER)} mois, paie un mois de saisonnier. Dans l'arène, chaque tour est un trimestre : la saison de l'hôtel se joue tour après tour.`,
        ];
      },
      repere: () => "Intérêt simple : I = C × t × n ÷ 12 (n en mois). Valeur acquise = C + I.",
    },
  ],
};
