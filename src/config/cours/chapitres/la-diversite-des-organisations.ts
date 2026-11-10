import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { HAUT_VERDASSE, SOUTIEN_AU_HANDBALL } from "../monde/haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "../monde/haut-verdasse-handball";
import { excedentDuClubAuTarif, organisationsComparees } from "../monde/organisations-comparees";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : QUI POSSÈDE, QUI DIRIGE, QUI CONTRÔLE ? LA DIVERSITÉ DES ORGANISATIONS (Bac STMG, sciences
 * de gestion et numérique de première, thème 1, question 2 : « Comment définir les différents types
 * d'organisation ? » ; et management de première, thème 1, question 2 : « Comment appréhender la
 * diversité des organisations ? »).
 *
 * Un chapitre partagé (audit du chantier STMG, point 9) : il est écrit une fois, sous la SGN, et cite
 * en second le thème du management. Trois organisations du même territoire, côte à côte : NOVA, une
 * SAS qui vend des enceintes ; la Communauté de communes du Haut-Verdasse, qui tient une piscine, un
 * gymnase et une médiathèque ; le Handball Club du Haut-Verdasse, une association. Leurs buts
 * (lucratif ou non), ce qu'elles produisent (marchand ou non marchand), ce qui les finance (les
 * clients, l'impôt, les cotisations et la subvention), à qui elles appartiennent, qui les dirige et
 * qui contrôle leurs dirigeants, et ce que devient leur excédent. Les autres familles du programme
 * (entreprise publique, ONG, syndicat, fondation) se rangent avec elles ; un partenariat public-privé
 * clôt le tour. Un curseur chiffre la dépendance du club au soutien public : le plus haut tarif auquel
 * il pourrait louer le gymnase qu'on lui prête.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : ses chiffres sont ceux de son exercice N
 * (comptes-du-lycee.ts) ; ceux de la communauté et du club viennent de leurs fiches, rangés côte à
 * côte par monde/organisations-comparees.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts des usagers, de la subvention et du bénéfice
 * distribué se donnaient au dixième de point, elles sont à deux décimales
 * (monde/organisations-comparees.ts).
 */

export const ENTREPRISES_DES_ORGANISATIONS = ["nova"] as const;


function lesTrois(c: Cas): TableauDeDonnees {
  return {
    titre: "Trois organisations du Haut-Verdasse",
    colonnes: [c.entreprise, "Communauté de communes", "Handball Club"],
    lignes: [
      { libelle: "Forme", valeurs: ["Société par actions simplifiée (SAS)", "Établissement public intercommunal", "Association loi 1901"] },
      { libelle: "Ce qu'elle produit", valeurs: ["Des enceintes, vendues", "Piscine, gymnase, médiathèque", "Entraînements et matchs de handball"] },
      { libelle: "Qui y travaille", valeurs: ["Des salariés", `${qte(HAUT_VERDASSE.agents.effectif)} agents territoriaux`, `${qte(HAUT_VERDASSE_HANDBALL.benevoles)} bénévoles et ${qte(HAUT_VERDASSE_HANDBALL.salaries.length)} salariés`] },
    ],
  };
}

function lesBudgets(c: Cas): TableauDeDonnees {
  const k = organisationsComparees();
  return {
    titre: "Ce que chacune reçoit dans l'année",
    colonnes: [c.entreprise, "Communauté de communes", "Handball Club"],
    lignes: [
      { libelle: "Total reçu", valeurs: [eur(k.nova.produits), eur(k.communaute.recettes), eur(k.club.recettes)] },
      { libelle: "Payé par les clients ou les usagers", valeurs: [eur(k.nova.ventes), eur(k.communaute.usagers), "Cotisations des adhérents"] },
      { libelle: "Impôts et dotations de l'État", valeurs: ["Aucun", eur(k.communaute.impotsEtDotations), "Aucun"] },
      { libelle: "Subvention de la communauté", valeurs: ["Aucune", "Sans objet", eur(k.club.subvention)] },
    ],
  };
}

export const LA_DIVERSITE_DES_ORGANISATIONS: Chapitre = {
  code: "la-diversite-des-organisations",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · De l'individu à l'acteur", "STMG Thème 1 · À la rencontre du management des organisations"],
  titre: "Qui possède, qui dirige, qui contrôle ? La diversité des organisations",
  accroche:
    "Une SAS qui vend des enceintes, une communauté de communes qui tient une piscine, un club de handball : trois organisations du même territoire, qui n'ont ni les mêmes buts, ni les mêmes financeurs, ni les mêmes maîtres.",
  objectifs: [
    "Classer une organisation selon sa finalité et son statut, privé ou public",
    "Distinguer une production marchande d'une production non marchande, et dire qui la finance",
    "Dire qui possède l'organisation, qui la dirige et qui contrôle ses dirigeants",
    "Chiffrer ce que devient l'excédent de chaque organisation",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ORGANISATIONS,
    pourquoi: "ce chapitre compare NOVA à la communauté de communes et au club de handball de son territoire, dont le cours tient les budgets.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois organisations, un territoire",
      tableau: lesTrois,
      texte: (c) => [
        `${c.entreprise} fabrique ses enceintes dans le Haut-Verdasse. Sur le même territoire, la communauté de communes réunit ${qte(HAUT_VERDASSE.communes)} communes pour tenir une piscine, un gymnase et une médiathèque ; le Handball Club du Haut-Verdasse fait jouer ${qte(HAUT_VERDASSE_HANDBALL.categories.reduce((n, x) => n + x.adherents, 0))} adhérents au gymnase.`,
        "Toutes trois sont des organisations : des personnes qui agissent ensemble, avec des règles et des moyens, vers un but commun. Mais leurs buts, leurs financeurs et ceux qui les dirigent diffèrent. C'est ce que le chapitre compare.",
      ],
      repere: () => "Une organisation se définit par sa finalité (pourquoi elle existe), son statut (privé ou public), ce qu'elle produit, qui la finance, à qui elle appartient et qui la dirige.",
    },
    {
      id: "les-familles",
      objectifs: [0],
      type: "tri",
      titre: "Ranger les organisations",
      question: () => "Rangez chaque organisation dans sa famille.",
      categories: [
        { code: "entreprise-privee", libelle: "Entreprise privée" },
        { code: "entreprise-publique", libelle: "Entreprise publique" },
        { code: "organisation-publique", libelle: "Organisation publique" },
        { code: "societe-civile", libelle: "Société civile (sans but lucratif)" },
      ],
      elements: (c) => [
        { libelle: `${c.entreprise}, une SAS détenue par ses associés`, montant: 0, categorie: "entreprise-privee", pourquoi: "Des associés privés en détiennent le capital et elle cherche un bénéfice : une entreprise privée." },
        { libelle: "Une société de transport dont l'État détient la majorité du capital", montant: 0, categorie: "entreprise-publique", pourquoi: "Elle vend ses services sur un marché, mais la puissance publique la contrôle par le capital : une entreprise publique." },
        { libelle: "La Communauté de communes du Haut-Verdasse", montant: 0, categorie: "organisation-publique", pourquoi: "Dirigée par des élus, financée surtout par l'impôt, elle rend un service public : une organisation publique." },
        { libelle: "Le Handball Club du Haut-Verdasse", montant: 0, categorie: "societe-civile", pourquoi: "Une association loi 1901 : des membres réunis dans un but autre que le partage de bénéfices." },
        { libelle: "Une organisation non gouvernementale d'aide humanitaire", montant: 0, categorie: "societe-civile", pourquoi: "Une ONG est une association, indépendante des États : elle relève de la société civile." },
        { libelle: "Un syndicat de salariés de la métallurgie", montant: 0, categorie: "societe-civile", pourquoi: "Un syndicat défend les intérêts de ses membres, sans but lucratif : la société civile." },
        { libelle: "Une fondation qui finance la recherche médicale", montant: 0, categorie: "societe-civile", pourquoi: "Des biens affectés pour toujours à une œuvre d'intérêt général, sans but lucratif." },
      ],
      relance: "Demandez-vous : qui la contrôle (des associés privés, l'État, des élus, des membres), et cherche-t-elle un bénéfice à partager ?",
      explication: () => [
        "Deux questions suffisent à ranger une organisation : qui la contrôle, une personne privée ou la puissance publique ? Et cherche-t-elle un profit à partager ? Une entreprise, privée ou publique, vend sur un marché ; une organisation publique rend un service public ; les associations, ONG, syndicats et fondations forment la société civile.",
      ],
    },
    {
      id: "la-finalite",
      objectifs: [0],
      type: "choix",
      titre: "La finalité",
      question: () => "Laquelle des trois organisations a pour but de dégager un bénéfice pour le partager entre ses membres ?",
      options: (c) => [
        { texte: c.entreprise, juste: true, retour: `Oui : ${c.entreprise} a une finalité lucrative. Son bénéfice revient à ses associés, qui en reçoivent une part en dividendes.` },
        { texte: "La communauté de communes", juste: false, retour: "Non : sa finalité est l'intérêt général, rendre un service public à tous les habitants. Son excédent ne se partage pas, il finance les travaux." },
        { texte: "Le club de handball", juste: false, retour: "Non : une association peut faire un excédent, mais elle ne le partage jamais entre ses membres. Sa finalité est de faire jouer au handball." },
      ],
    },
    {
      id: "qui-finance",
      objectifs: [1],
      type: "montants",
      titre: "Qui paie ?",
      tableau: lesBudgets,
      question: () =>
        "Calculez, à deux décimales : la part des recettes de la communauté que paient les usagers, et la part de la subvention dans les recettes du club.",
      champs: () => {
        const k = organisationsComparees();
        return [
          { libelle: "Part des usagers dans les recettes de la communauté (%)", attendu: k.communaute.partDesUsagersPct, calcul: `${eur(k.communaute.usagers)} ÷ ${eur(k.communaute.recettes)} × 100 = ${pct(k.communaute.partDesUsagersPct)}` },
          { libelle: "Part de la subvention dans les recettes du club (%)", attendu: k.club.partDeLaSubventionPct, calcul: `${eur(k.club.subvention)} ÷ ${eur(k.club.recettes)} × 100 = ${pct(k.club.partDeLaSubventionPct)}` },
        ];
      },
      explication: (c) => {
        const k = organisationsComparees();
        return [
          `Les usagers ne paient que ${pct(k.communaute.partDesUsagersPct)} de ce que reçoit la communauté : le reste vient de l'impôt et de l'État, c'est un financement public. Chez ${c.entreprise}, les clients paient ${pct(k.nova.partDesVentesPct)} de ce qu'elle reçoit : un financement privé, par le marché. Le club est entre les deux : ses adhérents, ses sponsors, et une subvention qui fait plus du quart de ses recettes.`,
        ];
      },
    },
    {
      id: "marchand-ou-non",
      objectifs: [1],
      type: "choix",
      titre: "Marchand ou non marchand",
      question: (c) => `La médiathèque est gratuite pour les moins de 18 ans ; une entrée à la piscine coûte bien moins que ce qu'elle coûte à la communauté. Une enceinte de ${c.entreprise}, elle, se vend à un prix qui couvre ses coûts. Comment nomme-t-on ce que produit la communauté ?`,
      options: () => [
        { texte: "Un service non marchand : son prix est nul ou bas", juste: true, retour: "Oui : un service est non marchand quand il est gratuit, ou vendu à un prix qui ne couvre pas la moitié de son coût. Le reste est payé par l'impôt : tout habitant y accède, quels que soient ses revenus." },
        { texte: "Un service marchand, puisque les usagers paient leur entrée", juste: false, retour: "Non : payer une entrée ne suffit pas. Ce qui compte, c'est que le prix couvre au moins la moitié du coût, et ici l'impôt en paie l'essentiel." },
        { texte: "Un bien marchand, comme les enceintes vendues par l'entreprise", juste: false, retour: "Non : la communauté rend des services (nager, lire, jouer), et ne les vend pas à leur coût." },
      ],
    },
    {
      id: "a-qui-appartient",
      objectifs: [2],
      type: "choix",
      titre: "À qui appartient-elle ?",
      question: (c) => `Les associés de ${c.entreprise} ont apporté ${eur(organisationsComparees().nova.capital)} de capital à sa création. À qui appartient chacune des trois organisations ?`,
      options: (c) => [
        { texte: `${c.entreprise} à ses associés ; la communauté et le club à personne`, juste: true, retour: "Oui : les associés possèdent le capital de la SAS. La communauté est une personne publique : elle relève des habitants et de leurs élus, pas de propriétaires. Le club n'a pas de propriétaire non plus : ses adhérents en sont membres, ils n'en possèdent aucune part." },
        { texte: "Toutes trois à ceux qui les dirigent : le président, les élus, le bureau du club", juste: false, retour: "Non : diriger n'est pas posséder. Le président de NOVA est désigné par les associés ; les élus et le bureau du club exercent un mandat, ils ne possèdent rien." },
        { texte: "Toutes trois à ceux qui les financent : les clients, les contribuables, la communauté", juste: false, retour: "Non : financer n'est pas posséder. Un client ou un contribuable ne détient aucune part ; la subvention ne rend pas la communauté propriétaire du club." },
      ],
    },
    {
      id: "qui-decide",
      objectifs: [2],
      type: "tri",
      titre: "Qui décide, qui dirige",
      question: () => "Dans chaque organisation, rangez chaque organe : décide-t-il des grandes orientations, ou dirige-t-il au quotidien ?",
      categories: [
        { code: "orientations", libelle: "Décide les orientations" },
        { code: "quotidien", libelle: "Dirige au quotidien" },
      ],
      elements: (c) => [
        { libelle: `L'assemblée des associés de ${c.entreprise}`, montant: 0, categorie: "orientations", pourquoi: "Elle approuve les comptes, décide du sort du bénéfice et nomme le président." },
        { libelle: `Le président de ${c.entreprise}`, montant: 0, categorie: "quotidien", pourquoi: "Il dirige la SAS et la représente, dans le cadre que fixent les statuts et les associés." },
        { libelle: "Le conseil communautaire, élu", montant: 0, categorie: "orientations", pourquoi: "Il vote le budget et décide des services à rendre : c'est l'organe délibérant." },
        { libelle: "La directrice générale des services", montant: 0, categorie: "quotidien", pourquoi: "Elle dirige les agents et fait appliquer ce que les élus ont décidé." },
        { libelle: "L'assemblée générale du club", montant: 0, categorie: "orientations", pourquoi: "Les adhérents y votent le budget et les cotisations, et élisent le conseil d'administration." },
        { libelle: "Le bureau du club, élu parmi les adhérents", montant: 0, categorie: "quotidien", pourquoi: "Bénévoles élus, ils font vivre le club entre deux assemblées." },
      ],
      relance: "Demandez-vous : cet organe fixe-t-il le cap une ou deux fois par an, ou fait-il tourner l'organisation chaque jour ?",
      explication: () => [
        "Partout, on retrouve la même séparation : ceux qui fixent le cap (les associés, les élus, les adhérents) et ceux qui l'appliquent chaque jour. C'est le gouvernement de l'organisation. Ce qui change, c'est qui fixe le cap : ceux qui ont apporté le capital, les citoyens par leur vote, ou les membres.",
      ],
    },
    {
      id: "qui-controle",
      objectifs: [2],
      type: "choix",
      titre: "Qui contrôle les dirigeants ?",
      question: () => "Les élus de la communauté de communes décident de l'argent des contribuables. Qui contrôle ce qu'ils en font ?",
      options: () => [
        { texte: "Les électeurs, le préfet et la chambre régionale des comptes", juste: true, retour: "Oui : les électeurs jugent les élus au scrutin suivant ; le préfet vérifie que leurs décisions respectent la loi ; la chambre régionale des comptes contrôle les comptes et la gestion. Chez NOVA, ce sont les associés qui contrôlent le président, en approuvant les comptes à l'assemblée." },
        { texte: "Personne : un élu ne rend de comptes qu'au moment de son élection", juste: false, retour: "Non : entre deux élections, le préfet contrôle la légalité des décisions, et la chambre régionale des comptes contrôle la gestion." },
        { texte: "Les associés de l'entreprise, qui paient l'impôt local", juste: false, retour: "Non : payer l'impôt ne donne aucun droit de contrôle sur la gestion. Ce sont les électeurs et les juridictions qui contrôlent les élus." },
      ],
    },
    {
      id: "trois-excedents",
      objectifs: [3],
      type: "montants",
      titre: "Trois excédents, trois destinations",
      question: (c) =>
        `Chacune garde un reste à la fin de l'année. Calculez l'excédent du club (recettes moins dépenses), relevez le virement de la communauté à sa section d'investissement, et la part du bénéfice de ${c.entreprise} versée en dividendes, à deux décimales.`,
      champs: (c) => {
        const k = organisationsComparees();
        return [
          { libelle: "Excédent du club", attendu: k.club.excedent, calcul: `${eur(k.club.recettes)} − ${eur(k.club.depenses)} = ${eur(k.club.excedent)}` },
          { libelle: "Virement de la communauté à l'investissement", attendu: k.communaute.autofinancement, calcul: `Ligne du budget de fonctionnement : ${eur(k.communaute.autofinancement)}` },
          { libelle: `Part du bénéfice de ${c.entreprise} distribuée (%)`, attendu: k.nova.partDistribueePct, calcul: `${eur(k.nova.dividendes)} ÷ ${eur(k.nova.benefice)} × 100 = ${pct(k.nova.partDistribueePct)}` },
        ];
      },
      explication: (c) => {
        const k = organisationsComparees();
        return [
          `${c.entreprise} verse ${eur(k.nova.dividendes)} à ses associés et garde le reste de son bénéfice en réserves. La communauté vire ${eur(k.communaute.autofinancement)} à son budget d'investissement : ce n'est pas un bénéfice, c'est ce qui paiera les travaux de la piscine. Le club met ses ${eur(k.club.excedent)} en réserve pour son matériel.`,
        ];
      },
    },
    {
      id: "l-excedent-du-club",
      objectifs: [3],
      type: "choix",
      titre: "L'excédent d'une association",
      question: () => "Un adhérent propose de rembourser une part de leur cotisation aux joueurs, avec l'excédent de la saison. Que lui répond le trésorier ?",
      options: () => [
        { texte: "Non : l'excédent reste au club, il ne se partage pas", juste: true, retour: "Oui : une association ne partage jamais ses bénéfices entre ses membres, sous aucune forme. Son excédent sert son objet : ici, du matériel neuf. C'est ce qui la distingue d'une société." },
        { texte: "Oui, à condition que l'assemblée générale le vote à la majorité", juste: false, retour: "Non : même votée, une distribution aux membres est interdite. Elle ferait du club une société déguisée." },
        { texte: "Oui, comme une SAS verse un dividende à ses associés", juste: false, retour: "Non : c'est justement ce qu'une association ne peut pas faire. Le dividende est réservé aux sociétés." },
      ],
    },
    {
      id: "le-partenariat",
      objectifs: [0],
      type: "choix",
      titre: "Un partenariat public-privé",
      question: () =>
        "La communauté veut un centre aquatique neuf. Une entreprise privée propose de le construire, de l'entretenir pendant 25 ans, et de recevoir de la communauté un loyer chaque année. De quoi s'agit-il ?",
      options: () => [
        { texte: "Un partenariat public-privé : le privé construit, le public paie", juste: true, retour: "Oui : la communauté garde le service public et sa décision, l'entreprise apporte le financement et le savoir-faire, payée sur la durée. Le contrat engage les contribuables pour 25 ans : il se négocie de près." },
        { texte: "Une privatisation : la piscine devient une entreprise privée lucrative", juste: false, retour: "Non : la communauté reste responsable du service et de ses tarifs ; l'entreprise est son partenaire, pas son propriétaire." },
        { texte: "Une subvention de la communauté à une entreprise du territoire", juste: false, retour: "Non : une subvention aide une activité sans contrepartie fixée ; ici, la communauté paie un loyer pour un équipement et son entretien." },
      ],
    },
    {
      id: "le-gymnase-paye",
      objectifs: [3],
      type: "curseur",
      titre: "Si le gymnase était payant",
      sens: "plus-grande",
      question: () => {
        const k = organisationsComparees();
        return `La communauté prête le gymnase au club, ${qte(k.club.heuresDeGymnase)} heures par saison. Si elle le lui louait, quel tarif le club pourrait-il payer avec son excédent ? Faites varier le tarif horaire : une droite donne l'excédent de la saison, l'autre la location. Placez le curseur sur le plus haut tarif, à l'euro, que le club pourrait payer sans passer en déficit.`;
      },
      grandeur: () => ({ libelle: "Tarif de location du gymnase", unite: "€ l'heure" }),
      cible: () => ({ attendu: organisationsComparees().club.tarifSupportable, max: 30 }),
      zones: ["Le club reste en excédent", "Le club passe en déficit"],
      rates: () => ({ dessous: "L'excédent paierait un tarif plus haut : cherchez plus haut.", dessus: "À ce tarif, la location dépasse l'excédent : le club serait en déficit." }),
      montrer: "Montrer le tarif",
      lecture: (_c, tarif) => {
        const k = organisationsComparees();
        return [
          { libelle: "Excédent de la saison, gymnase prêté", montant: k.club.excedent },
          { libelle: "Location du gymnase", montant: tarif * k.club.heuresDeGymnase },
          { libelle: "Excédent, gymnase loué", montant: excedentDuClubAuTarif(tarif), fort: true },
        ];
      },
      droites: () => {
        const k = organisationsComparees();
        return { produit: () => k.club.excedent, cout: (tarif) => tarif * k.club.heuresDeGymnase, libelles: ["Excédent de la saison", "Location du gymnase"] };
      },
      explication: () => {
        const k = organisationsComparees();
        return [
          `Le club pourrait payer ${eur(k.club.tarifSupportable)} l'heure ; la communauté loue son gymnase ${eur(SOUTIEN_AU_HANDBALL.gymnase.tarifHoraire)} l'heure aux autres utilisateurs, soit ${eur(k.club.miseADisposition)} sur la saison. Sans ce prêt, le club serait en déficit, ou devrait monter ses cotisations.`,
          "C'est la marque d'une organisation de la société civile : elle vit de ses membres, de ses bénévoles, et du soutien public que lui vaut son utilité pour le territoire.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = organisationsComparees();
        return [
          `${c.entreprise} est une entreprise privée à but lucratif : elle vend des biens marchands, ses clients la financent, ses associés la possèdent et contrôlent son président, et ils reçoivent ${eur(k.nova.dividendes)} de dividendes. La communauté de communes est une organisation publique : elle rend des services non marchands, financés à plus de ${pct(Math.floor(100 - k.communaute.partDesUsagersPct))} par l'impôt et l'État, dirigés par des élus que contrôlent les électeurs et les juridictions. Le club est une association : ses adhérents décident, ses bénévoles le font vivre, et son excédent ne se partage pas.`,
          "Les comparer, c'est poser six questions à toute organisation : son but, son statut, ce qu'elle produit, qui la finance, à qui elle appartient, qui la dirige et la contrôle. Dans l'arène, ce sont des entreprises qui s'affrontent ; leur territoire, lui, compte aussi des organisations qui ne cherchent pas le profit.",
        ];
      },
      repere: () => "Finalité lucrative ou non ; statut privé ou public ; production marchande ou non marchande ; financement par le marché, l'impôt ou les membres.",
    },
  ],
};
