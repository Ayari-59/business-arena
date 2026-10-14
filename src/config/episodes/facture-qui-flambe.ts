/**
 * LA FACTURE QUI FLAMBE — le contenu de l'épisode.
 *
 * Cyprien Lavergne est responsable RSE et énergie d'Arvel Distribution : une
 * plateforme logistique à Saint-Priest et sept agences. Le contrat
 * d'électricité et de gaz s'achève à la fin de la semaine 4, le marché est
 * nerveux, la facture pourrait presque doubler, et Ostral Construction, le
 * plus gros client, exige un bilan carbone et un plan de réduction chiffré
 * pour renouveler son contrat. Six décisions, chacune précédée de ce qu'un
 * responsable énergie reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const PASCALE = {
  de: "Murielle Andrieu",
  role: "Directrice administrative et financière",
} as const;
const RACHID = {
  de: "Hakim Boukhari",
  role: "Chef de la plateforme de Saint-Priest",
} as const;
const KILLIAN = {
  de: "Killian Morisot",
  role: "Technicien de maintenance",
} as const;
const CHLOE = {
  de: "Fanny Lebrun",
  role: "Responsable de l'agence de Vaulx-en-Velin",
} as const;
const TOMAS = { de: "Tomás Herrera", role: "Courtier en énergie" } as const;
const BERENICE = {
  de: "Brigitte Collin",
  role: "Chargée de clientèle entreprises, Volténa Énergies",
} as const;
const INGRID = {
  de: "Astrid Solberg",
  role: "Responsable achats responsables, Ostral Construction",
} as const;
const CSE = { de: "Steven Mallard", role: "Secrétaire du CSE" } as const;
const TABLEAU = { de: "Suivi énergie", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "horsHoraires",
    t: "Près de la moitié de l'énergie part quand les sites sont fermés : chauffage et éclairage tournent la nuit et le week-end",
  },
  {
    id: "prix",
    t: "Le prix : le nouveau contrat va presque doubler la facture",
  },
  {
    id: "gaspillage",
    t: "Les équipes gaspillent : il faut les sensibiliser aux éco-gestes",
  },
  {
    id: "batiments",
    t: "Les bâtiments sont vétustes : sans gros travaux d'isolation, rien ne bougera",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le contrat arrive à échéance",
    jusqua: 2,
    messages: () => [
      {
        ...BERENICE,
        heure: "08:10",
        alerte: true,
        texte:
          "Monsieur Lavergne, votre contrat d'électricité et de gaz s'achève le 31 octobre. Notre offre de renouvellement, à prix fixe sur trois ans : 195 €/MWh d'électricité et 76 €/MWh de gaz. Elle est valable jusqu'à vendredi prochain.",
      },
      {
        ...PASCALE,
        heure: "08:45",
        texte:
          "Cyprien, aux prix de Volténa, l'énergie du trimestre passerait de 103 k€ l'an dernier à près de 180 k€. J'ai budgété 150 k€, pas un euro de plus, et le comité de direction ne veut pas entendre parler d'investissements lourds. Qu'est-ce que tu proposes ?",
      },
      {
        ...INGRID,
        heure: "09:30",
        texte:
          "Bonjour Monsieur Lavergne. Notre contrat-cadre avec Arvel arrive à renouvellement en décembre. Comme à tous nos fournisseurs, nous vous demanderons pour la fin de la semaine 10 votre bilan carbone et un plan de réduction chiffré.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "courbe",
        titre: "Lire la courbe de charge des compteurs (télérelève)",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sites fermés, la nuit et le week-end, la plateforme et les agences appellent encore 180 kW d'électricité, contre 430 kW en pleine activité, et la chaudière de la plateforme ne s'arrête jamais. Sur une semaine, 42 % de l'énergie, électricité et gaz confondus, est consommée quand personne n'est là.",
      },
      {
        id: "tournee",
        titre: "Faire le tour de la plateforme et de deux agences un samedi matin",
        cout: 1,
        nature: "decisive",
        resultat:
          "Plateforme fermée : les aérothermes soufflent à 17 °C sous onze mètres de plafond, une allée sur trois reste éclairée, le compresseur redémarre toutes les dix minutes, signe d'une fuite, et la porte du quai 2 est restée ouverte. À Décines, le chauffage tourne à 22 °C, sans programmateur ; à Vaulx, les convecteurs du showroom sont allumés.",
      },
      {
        id: "factures",
        titre: "Décomposer les factures de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Au quatrième trimestre de l'an dernier : 1 700 MWh, dont 63 % de gaz, pour 103 k€. Le chauffage de la plateforme pèse à lui seul 38 % de l'énergie, celui des agences 26 %. Aux prix de Volténa, les mêmes volumes coûteraient 177 k€.",
      },
      {
        id: "ratios",
        titre: "Comparer la consommation au mètre carré avec d'autres négoces",
        cout: 1,
        nature: "bruit",
        resultat:
          "Arvel consomme 148 kWh par mètre carré et par an ; les négoces du panel régional se situent entre 120 et 170. Rien d'anormal à première vue.",
      },
      {
        id: "conseil",
        titre: "Appeler la conseillère énergie de la chambre de commerce",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Yasmina Cherkaoui : « Avant de couper quoi que ce soit, regardez quand vous consommez. Dans un entrepôt, c'est souvent la nuit que part l'argent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous cette semaine ?",
    options: [
      {
        t: "Baisser le chauffage à 14 °C et couper un éclairage sur deux, partout, dès demain",
        d: "Plateforme, agences, bureaux et comptoirs. Ne coûte rien, effet immédiat sur la facture.",
      },
      {
        t: "Poser des sous-compteurs et lire la consommation site par site, heure par heure",
        d: "Huit sous-compteurs et un logiciel de suivi : 2 800 €. Deux semaines avant d'avoir des courbes.",
      },
      {
        t: "Lancer une campagne d'éco-gestes dans tous les sites",
        d: "Affiches, message de la direction, une fiche réflexe par poste. 600 €.",
      },
      {
        t: "Se concentrer sur le contrat : c'est le prix qui fait la facture",
        d: "Rien ne change dans les sites d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...CHLOE,
          texte:
            "14 °C au comptoir : les clients gardent leur blouson, mes vendeurs aussi. Deux d'entre eux ont rapporté un radiateur de chez eux.",
        },
      ],
      [
        {
          ...KILLIAN,
          texte:
            "Les sous-compteurs sont posés. Premier constat dès mercredi : le compresseur tourne toute la nuit, et les aérothermes n'ont jamais été passés à l'horaire d'hiver. J'ai réglé les deux.",
        },
      ],
      [
        {
          ...RACHID,
          texte:
            "Les affiches sont au mur et les gars les ont lues. Pour le reste, je ne vois pas bien ce qui a changé.",
        },
      ],
      [
        {
          ...PASCALE,
          texte: "D'accord pour le contrat. Mais d'ici là, on chauffe comme l'an dernier ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Signer avant ce soir",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...BERENICE,
        heure: "09:00",
        alerte: true,
        texte:
          "Monsieur Lavergne, je me permets de vous rappeler que notre offre à prix fixe expire ce soir. Après, ce sera le prix du marché du jour, et il bouge beaucoup en ce moment.",
      },
      {
        ...TOMAS,
        heure: "10:30",
        texte:
          "Bonjour Cyprien. J'ai trois structures de contrat chiffrées pour vous, valables jusqu'à lundi. Le marché à terme du trimestre est à 160 €/MWh pour l'électricité et 62 €/MWh pour le gaz.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Électricité sur le marché cette semaine : ${ctx.prixMarche}. Coût de l'énergie à date : ${ctx.couts}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "offres",
        titre: "Lire les trois offres du courtier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Prix fixe sur tout le volume : 176 €/MWh d'électricité et 68 €/MWh de gaz, sur deux ans ; la sous-consommation n'est facturée qu'en deçà de 70 % du volume. Mixte : un ruban de la moitié du volume de l'an dernier à 166 € et 64 €, le reste au prix du marché plus 3 %. Tout indexé : le prix du marché plus 3 %. Courtage : 1 500 €. L'hiver dernier, trois semaines de froid ont fait monter le marché de 70 %.${
            ctx.mesure
              ? " Tomás : « Vos sous-compteurs montrent que vous allez consommer moins. Un ruban sur la moitié du volume ne vous fera jamais payer ce que vous ne consommez pas. »"
              : ""
          }`,
      },
      {
        id: "clause",
        titre: "Relire l'offre de Volténa, clause par clause",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trois ans à 195 €/MWh d'électricité et 76 €/MWh de gaz, sans possibilité de sortie. Article 7 : si vous consommez moins de 90 % du volume de l'an dernier, l'écart vous est facturé à 35 % du prix. Toute économie au-delà de 10 % sera donc en partie payée quand même.",
      },
    ],
    question: "Quel contrat signez-vous ?",
    options: [
      {
        t: "Signer l'offre de Volténa avant ce soir",
        d: "Prix fixe sur trois ans : 195 €/MWh d'électricité, 76 €/MWh de gaz. Plus de surprise sur le prix.",
      },
      {
        t: "Passer par le courtier : contrat mixte, un ruban à prix fixe et le reste au marché",
        d: "La moitié du volume de l'an dernier à 166 €/MWh, le reste au prix du marché. 1 500 € de courtage.",
      },
      {
        t: "Passer par le courtier : prix fixe sur tout le volume",
        d: "176 €/MWh d'électricité, 68 €/MWh de gaz, sur deux ans. 1 500 € de courtage.",
      },
      {
        t: "Passer par le courtier : tout au prix du marché",
        d: "Le prix du jour plus 3 %, semaine après semaine. 1 500 € de courtage.",
      },
    ],
    reactions: [
      [
        {
          ...BERENICE,
          texte:
            "Merci de votre confiance, Monsieur Lavergne. Le contrat démarre le 1er novembre, pour trois ans.",
        },
      ],
      [
        {
          ...TOMAS,
          texte:
            "Le ruban est réservé à 166 €. Le reste suivra le marché : je vous envoie chaque lundi le prix de la semaine.",
        },
      ],
      [
        {
          ...TOMAS,
          texte: "Prix fixe signé à 176 €. Vous dormirez tranquille : c'est ce que vous paierez.",
        },
      ],
      [
        {
          ...TOMAS,
          texte:
            "C'est signé. Je vous préviens quand même : quand il fait froid, le marché ne prévient pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Un plan pour l'hiver",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...PASCALE,
        heure: "08:30",
        alerte: true,
        texte: `Le nouveau contrat démarre lundi. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus. Il nous faut un plan pour l'hiver, et que les sites l'appliquent.`,
      },
      {
        ...CSE,
        heure: "11:15",
        texte: ctx.coupe
          ? "Les salariés des comptoirs travaillent à 14 °C depuis trois semaines, et les radiateurs d'appoint se multiplient sur des multiprises. Le CSE demande à être consulté avant qu'on aille plus loin."
          : "Le CSE a entendu parler d'un plan d'économies d'énergie. Nous souhaitons être consultés avant qu'on touche aux températures.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Consommation corrigée du climat en semaine 4 : indice ${ctx.indice} (100, c'est l'an dernier). Énergie consommée sites fermés : ${ctx.horsHoraires}.`,
      },
    ],
    sources: [
      {
        id: "souscompteurs",
        titre: "Lire les consommations site par site",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.mesure
            ? "Les sous-compteurs sont formels. Chauffage de la plateforme : 38 % de l'énergie, dont plus de la moitié la nuit et le week-end, dans des zones de stockage où personne ne travaille. Agences : 26 %, dont 40 % sites fermés ; quatre sur sept n'ont pas de programmateur. Talon électrique de nuit, compresseur réparé : 15 MWh par semaine, dont 7 évitables (éclairage, ventilation, convecteurs)."
            : "Il n'y a que les compteurs généraux de chaque site. On sait combien chaque site consomme dans le mois, pas à quelle heure ni pour quoi : le plan se fera à l'estime.",
      },
      {
        id: "chefs",
        titre: "Demander aux chefs de site ce qu'ils sont prêts à faire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Hakim : « Le hors-gel la nuit dans les zones de stockage, aucun problème, personne n'y travaille. Mais on ne prépare pas des commandes à 14 °C. » Fanny : « Un programmateur et 19 °C au comptoir, d'accord. Encore faut-il que quelqu'un vérifie le soir. »",
      },
    ],
    question: "Quel plan de sobriété lancez-vous ?",
    options: [
      {
        t: "Un plan ciblé, avec un référent par site",
        d: "Chauffage et éclairage calés sur les horaires, hors-gel la nuit dans les zones de stockage, portes de quai fermées, 19 °C dans les bureaux et les comptoirs. 1 500 € de programmateurs.",
      },
      {
        t: "Verrouiller les thermostats à 17 °C partout et interdire les radiateurs d'appoint",
        d: "Une note de la direction, appliquée dès lundi. Ne coûte rien.",
      },
      {
        t: "Lancer un défi entre les sites, avec un classement chaque mois",
        d: "Le site qui baisse le plus gagne un repas d'équipe. 1 000 €.",
      },
      {
        t: "Laisser chaque site s'organiser",
        d: "Chaque chef de site connaît ses contraintes.",
      },
    ],
    reactions: [
      [
        {
          ...RACHID,
          texte:
            "Les programmateurs sont réglés : les zones de stockage passent en hors-gel à 20 h. Les gars ont même proposé de fermer le quai 2 l'après-midi, il ne sert presque plus.",
        },
      ],
      [
        {
          ...CSE,
          texte:
            "Le CSE prend acte de la note. Les salariés des quais demandent des gants chauffants et des pauses au chaud.",
        },
      ],
      [
        {
          ...CHLOE,
          texte:
            "Le classement est affiché en salle de pause. Décines est premier, personne ne sait trop comment.",
        },
      ],
      [
        {
          ...RACHID,
          texte: "On fait au mieux, chacun de son côté. Mais personne ne sait ce que fait l'autre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Investir, mais dans quoi ?",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...PASCALE,
        heure: "09:00",
        alerte: true,
        texte:
          "Cyprien, le comité de direction accepte un investissement s'il est financé en bonne partie par les aides et qu'il rapporte vite. Rien qui pèse sur la trésorerie.",
      },
      {
        de: "Aymeric Toussaint",
        role: "Chargé d'affaires, installateur d'éclairage",
        heure: "10:20",
        texte:
          "Monsieur Lavergne, nous équipons les entrepôts de la région en LED avec détection de présence : jusqu'à 60 % d'économie sur l'éclairage, et les certificats d'économies d'énergie en financent une partie. Je peux passer mardi.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus. Indice de consommation en semaine 6 : ${ctx.indice}.`,
      },
    ],
    sources: [
      {
        id: "postes",
        titre: "Classer les investissements possibles par temps de retour",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.mesure
              ? "Les sous-compteurs le confirment : le premier poste est le chauffage de la plateforme, sous onze mètres de plafond où l'air chaud reste en haut."
              : "Sans sous-compteurs, il faut raisonner sur les factures : le gaz fait 63 % des MWh, et la plateforme en consomme la plus grande part."
          } Déstratificateurs et rideaux d'air sur les quais : 34 k€, dont 24 k€ d'aides ; un quart du chauffage de la plateforme en moins ; retour en un hiver. LED avec détection : 52 k€, dont 14 k€ d'aides ; 45 % de l'éclairage en moins ; retour en trois ans. Pompes à chaleur et solaire pour les agences : 420 k€, 30 % d'aides, retour en dix ans, après une étude de 9 000 €.`,
      },
      {
        id: "financement",
        titre: "Demander à la banque comment financer ces travaux",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les LED et les déstratificateurs peuvent passer en location financière, aides déduites : 550 € par semaine pour les LED, 120 € pour les déstratificateurs. L'étude des pompes à chaleur se paie comptant, et ne rapporte rien avant les travaux.",
      },
    ],
    question: "Que lancez-vous ?",
    options: [
      {
        t: "Passer la plateforme en LED avec détection de présence",
        d: "52 k€, dont 14 k€ d'aides ; le reste en location, 550 € par semaine. Posées en semaine 8.",
      },
      {
        t: "Installer des déstratificateurs et des rideaux d'air sur les quais",
        d: "34 k€, dont 24 k€ d'aides ; le reste en location, 120 € par semaine. Posés en semaine 8.",
      },
      {
        t: "Lancer l'étude des pompes à chaleur et du solaire pour toutes les agences",
        d: "9 000 € d'étude ce trimestre, pour un programme de 420 k€.",
      },
      {
        t: "Ne rien investir ce trimestre",
        d: "La direction ne veut pas d'investissement lourd.",
      },
    ],
    reactions: [
      [
        {
          ...RACHID,
          texte:
            "Les LED sont posées. On y voit comme en plein jour, et les allées s'éteignent toutes seules quand personne n'y passe.",
        },
      ],
      [
        {
          ...KILLIAN,
          texte:
            "Les déstratificateurs tournent. Il faisait 26 °C sous le toit et 14 °C au sol : la chaleur redescend là où on travaille, et les rideaux d'air la gardent dedans.",
        },
      ],
      [
        {
          de: "Bureau d'études thermiques",
          role: "Prestataire",
          texte: "Les relevés commencent dans les sept agences. Rapport attendu en février.",
        },
      ],
      [
        {
          ...PASCALE,
          texte: "Entendu. On en reparlera au budget de l'an prochain.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le bilan carbone d'Ostral",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...INGRID,
        heure: "09:15",
        alerte: true,
        texte:
          "Monsieur Lavergne, nous attendons votre bilan carbone et votre plan de réduction pour la fin de la semaine 10. Notre comité fournisseurs se réunit en semaine 12.",
      },
      {
        de: "Yohan Pichon",
        role: "Directeur grands comptes",
        heure: "11:40",
        texte:
          "Cyprien, Ostral, c'est 45 k€ de marge par trimestre. Leur acheteuse m'a glissé que deux négoces ont déjà été écartés pour des plans « trop marketing ».",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Émissions du trimestre à date : ${ctx.co2}, contre ${ctx.co2ADate} l'an dernier à météo égale.`,
      },
    ],
    sources: [
      {
        id: "exigences",
        titre: "Lire le questionnaire fournisseurs d'Ostral",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ostral demande les émissions des scopes 1 et 2, mesurées et non estimées, un objectif à trois ans et, pour chaque action engagée, son effet chiffré. Une note précise : « Les plans fondés sur la compensation ou sur l'achat de garanties d'origine seules ne sont pas recevables. »",
      },
      {
        id: "donnees",
        titre: "Rassembler les données dont vous disposez",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.mesure
            ? `Les sous-compteurs donnent la consommation semaine par semaine et site par site depuis la semaine 3. Indice de consommation en semaine 8 : ${ctx.indice}, corrigé du climat.`
            : `Vous avez les factures mensuelles de chaque site, rien de plus fin : une partie du bilan sera estimée. Indice de consommation en semaine 8 : ${ctx.indice}, corrigé du climat.`,
      },
      {
        id: "concurrent",
        titre: "Regarder ce que publient les concurrents",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le négoce d'en face affiche « neutre en carbone en 2030 » sur ses camions et son site internet. Il ne dit pas comment.",
      },
    ],
    question: "Que remettez-vous à Ostral ?",
    options: [
      {
        t: "Un bilan carbone mesuré et un plan chiffré, action par action",
        d: "Un cabinet spécialisé, 4 000 €. Les actions engagées, leur effet mesuré, un objectif à trois ans.",
      },
      {
        t: "Une brochure d'engagement : « neutres en carbone en 2030 »",
        d: "Conçue par l'agence de communication, 1 500 €. Prête en une semaine.",
      },
      {
        t: "Des garanties d'origine pour afficher une électricité 100 % renouvelable",
        d: "6 000 € pour l'année. Un certificat à joindre au dossier.",
      },
      {
        t: "Demander à Ostral un délai jusqu'au trimestre prochain",
        d: "Le temps d'avoir des chiffres solides.",
      },
    ],
    reactions: [
      [
        {
          ...INGRID,
          texte:
            "Merci, le dossier est complet. Notre auditeur l'étudie avant le comité de la semaine 12.",
        },
      ],
      [
        {
          ...INGRID,
          texte:
            "Nous avons bien reçu votre brochure. Notre auditeur vous demandera sans doute sur quoi repose l'objectif de 2030.",
        },
      ],
      [
        {
          ...INGRID,
          texte:
            "Nous avons bien reçu le certificat. Il ne dit rien de vos actions de réduction, mais nous le transmettons au comité.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le froid annoncé",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...RACHID,
        heure: "08:20",
        alerte: true,
        texte:
          "Cyprien, les prévisionnistes annoncent un risque de vague de froid pour la fin de l'année. Et entre les fêtes, la plateforme tourne au ralenti.",
      },
      {
        ...TOMAS,
        heure: "10:05",
        texte: `Le marché s'agite : l'électricité est à ${ctx.prixMarche} cette semaine. Si le froid arrive, elle peut prendre 70 % en quelques jours. ${
          ctx.prixFixe
            ? "Vous êtes à prix fixe : cela ne vous touche pas directement."
            : "Votre part indexée y sera exposée."
        }`,
      },
      {
        ...PASCALE,
        heure: "17:30",
        texte: `Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus. Finis le trimestre proprement.`,
      },
    ],
    sources: [
      {
        id: "meteo",
        titre: "Lire les prévisions et l'état du stock sensible au gel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Quatre chances sur dix d'une vague de froid à partir de la semaine 11, avec des nuits à −8 °C. Dans la plateforme, 380 k€ de produits craignent le gel : peintures, colles, mastics, adjuvants pour béton. Regroupés dans la zone chauffée, ils tiennent sur six travées.",
      },
      {
        id: "effacement",
        titre: "Demander au courtier ce que rapporte l'effacement",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.pilotable
            ? "Pendant une vague de froid, le réseau paie environ 2 500 € par semaine un site qui sait baisser sa consommation aux heures de pointe. Vos programmateurs le permettent."
            : "Le réseau paie les sites qui baissent leur consommation aux heures de pointe pendant le froid, à condition de pouvoir la piloter. Sans programmation, vous n'en tirerez qu'une petite part.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Préparer le froid : stock sensible au chaud, hors-gel ailleurs, effacement aux heures de pointe",
        d: "Une journée de manutention, 1 000 €. Le réseau rémunère l'effacement s'il fait froid.",
      },
      {
        t: "Couper le chauffage de la plateforme pendant les fêtes",
        d: "Elle tourne au ralenti du 20 décembre au 2 janvier. Seuls les bureaux restent chauffés.",
      },
      {
        t: "Bloquer dès maintenant le prix de la part indexée jusqu'à la fin du trimestre",
        d: "Au prix à terme du jour, qui intègre déjà le risque de froid. 500 € de frais.",
      },
      {
        t: "Ne rien changer",
        d: "Le plan d'hiver est en place.",
      },
    ],
    reactions: [
      [
        {
          ...RACHID,
          texte:
            "Les peintures et les colles sont dans la travée chauffée. Le reste de la plateforme passe en hors-gel à 8 °C pendant les fêtes.",
        },
      ],
      [
        {
          ...RACHID,
          texte: "Chauffage coupé à partir du 20. J'ai laissé les bureaux à 19 °C.",
        },
      ],
      [
        {
          ...TOMAS,
          texte:
            "C'est bloqué jusqu'au 31 décembre, sur la part de votre contrat qui suit le marché.",
        },
      ],
      [
        {
          ...PASCALE,
          texte: "D'accord. Rendez-vous au bilan du trimestre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mesurer, puis cibler", chemin: [1, 1, 0, 1, 0, 0] },
  { nom: "Couper et signer vite", chemin: [0, 0, 1, 0, 1, 1] },
  { nom: "Attentiste", chemin: [3, 0, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous la pression de la facture : couper partout,
 * signer la première offre, afficher sans prouver. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 1],
  [4, 1],
  [5, 1],
] as const;

export const REPONSES = {
  delaiAccepte:
    "Nous pouvons attendre votre plan jusqu'en mars et prolonger le contrat d'un trimestre, contre une remise de 4 000 € sur les commandes en cours.",
  delaiRefuse:
    "Je suis désolée, notre comité ne fait pas d'exception : sans plan en semaine 10, votre dossier passera au comité incomplet.",
  ostralOui:
    "Notre comité a retenu votre plan : des émissions mesurées, des actions engagées et chiffrées. Nous renouvelons le contrat-cadre pour trois ans.",
  ostralNonPlan:
    "Notre comité a hésité, puis préféré un négoce dont le plan s'appuyait sur davantage de mesures. Nous ne renouvelons pas le contrat-cadre.",
  ostralNonAffichage:
    "Notre auditeur n'a trouvé dans votre dossier ni émissions mesurées ni actions chiffrées. Nous ne pouvons pas renouveler le contrat-cadre.",
  ostralProlonge:
    "Comme convenu, le contrat est prolongé d'un trimestre. Nous attendons votre plan pour mars.",
  ostralSansPlan:
    "Faute de plan, notre comité n'a pas pu retenir Arvel. Nous ne renouvelons pas le contrat-cadre.",
  ostralOuiQuandMeme:
    "Malgré un dossier léger, notre comité renouvelle le contrat-cadre, pour un an seulement. Nous attendons un vrai plan l'an prochain.",
  alerte:
    "Le CSE exerce son droit d'alerte : des salariés travaillent dans le froid, certains avec des radiateurs bricolés sur des multiprises. Nous demandons le rétablissement du chauffage aux postes de travail.",
  gel: "Le thermomètre de la plateforme est descendu à −3 °C pendant le week-end. Les peintures, colles et adjuvants de trois travées ont gelé : 35 k€ de marchandise à la benne.",
  froid:
    "Vague de froid à partir de lundi, −9 °C la nuit. Le marché de l'électricité a pris 70 % en trois jours.",
} as const;
