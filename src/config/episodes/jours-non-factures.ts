/**
 * LES JOURS QU'ON NE FACTURE PAS — le contenu de l'épisode.
 *
 * Clélia Kerhervé est directrice des opérations d'Atlas Conseil au bureau de
 * Nantes, le siège : 75 consultants facturables, des missions en régie et au
 * forfait pour des industriels, des collectivités et des hôpitaux. Le taux
 * d'occupation n'a jamais été aussi haut, et la marge baisse. Six décisions,
 * d'avril à juin, chacune précédée de ce qu'une directrice des opérations
 * reçoit vraiment.
 *
 * La notion est le TAUX DE RÉALISATION (jours facturés ÷ jours passés) à côté
 * du taux d'occupation (jours staffés ÷ jours disponibles), et la marge lue
 * mission par mission. Les chiffres que les sources donnent sont ceux du
 * modèle : un test le vérifie.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, clients, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const DARIUSH = { de: "Dariush Vahidi", role: "Associé, directeur commercial" } as const;
const EVANGELINE = { de: "Évangéline Quilliec", role: "Manager, mission Kervalan" } as const;
const OIHANA = { de: "Oïhana Larralde", role: "Manager, mission Talvenec" } as const;
const FANCH = {
  de: "Fañch Kerros",
  role: "Acheteur, centre hospitalier de Kervalan",
} as const;
const WIEBKE = { de: "Wiebke Hansel", role: "Achats de prestations, Banque de l'Erdre" } as const;
const ZAKARIA = {
  de: "Zakaria Bellouti",
  role: "Directeur supply chain, Talvenec Emballages",
} as const;
const NELL = { de: "Nell Abiven", role: "Consultante, mission Kervalan" } as const;

export const DIAGNOSTICS = [
  {
    id: "forfaits",
    t: "Trois forfaits sous-estimés font passer des jours qu'on ne facture pas : les consultants sont occupés, mais à perte",
  },
  { id: "kervalan", t: "Kervalan dérape : le CHU a élargi le périmètre sans avenant" },
  { id: "banc", t: "Trop de consultants sur le banc : il faut remonter l'occupation" },
  { id: "prix", t: "Nos TJM sont trop bas pour nos salaires : il faut vendre plus cher" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Occupés comme jamais, et la marge baisse",
    jusqua: 3,
    messages: () => [
      {
        ...PRUNE,
        heure: "07:55",
        alerte: true,
        texte:
          "Clôture du premier trimestre, bureau de Nantes : marge des missions 362 k€, contre 448 k€ il y a un an. En mars, taux d'occupation des consultants : 72,0 %, le plus haut depuis deux ans (66 % en mars dernier). Le trimestre d'avril à juin commence aujourd'hui.",
      },
      {
        ...VICTOIRE,
        heure: "08:40",
        texte:
          "Clélia, je ne comprends pas : tout le monde court et la marge recule. Et on a encore une douzaine de consultants sur le banc. Je veux 80 % d'occupation en juin. Dis-moi vendredi comment tu y vas.",
      },
      {
        ...EVANGELINE,
        heure: "09:20",
        texte:
          "Sur Kervalan, on ne s'en sort pas : le CHU nous demande toujours plus d'entretiens. Si tu peux me donner trois juniors du banc, je les prends tout de suite.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tempora",
        titre: "Extraire de Tempora les jours passés et facturés de mars, mission par mission",
        cout: 1,
        nature: "decisive",
        resultat:
          "Mars : 1 500 jours disponibles, 1 080 jours passés en mission. Régie : 320 jours passés, 320 facturés. Les quinze forfaits dans les clous : 420 passés, 408 facturés (l'avancement valorisé aux jours vendus). Kervalan, schéma directeur du système d'information du CHU : 120 passés, 60 facturés. Montlouvel, plan de transformation de l'agglomération : 100 passés, 55 facturés. Talvenec, refonte de la supply chain : 120 passés, 75 facturés.",
      },
      {
        id: "restes",
        titre: "Refaire avec Prune le reste à faire et la marge des trois forfaits qui dérapent",
        cout: 1,
        nature: "decisive",
        resultat:
          "Coût journalier, salaire chargé ÷ 210 jours : 340 € pour un junior, 590 € pour un senior. Kervalan (4 juniors, 2 seniors, TJM de l'équipe 840 €) : 110 jours vendus restants, soit 92,4 k€ à gagner, pour 260 jours de reste à faire et 90 € de frais par jour que le forfait ne rembourse pas ; marge à terminaison : −41,1 k€. Montlouvel (3 et 2, 864 €) : 80 jours vendus restants, 69,1 k€, 150 jours de reste à faire ; −2,1 k€. Talvenec (4 et 2, 840 €) : 64 jours vendus restants, 53,8 k€, 110 jours de reste à faire ; +0,6 k€.",
      },
      {
        id: "bureaux",
        titre: "Comparer l'occupation des quatre bureaux",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Taux d'occupation de mars : Nantes 72 %, Paris 74 %, Bordeaux 70 %, Rennes 69 %. La cible du cabinet est de 75 %. Nantes est dans la moyenne, un peu au-dessus.",
      },
      {
        id: "chefs",
        titre: "Faire le tour des chefs de mission",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Évangéline (Kervalan) : « Le CHU a ajouté deux établissements et une série d'entretiens au comité de février. Rien n'est écrit, mais on ne peut pas dire non. » Tangi (Montlouvel) : « Les élus veulent des ateliers en plus dans chaque commune. » Oïhana (Talvenec) : « On a refait le diagnostic deux fois, le client changeait d'interlocuteur. » Tous demandent du monde.",
      },
      {
        id: "leocadie",
        titre: "Appeler Chiamaka Darrigade, associée fondatrice du cabinet",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Chiamaka : « L'occupation compte les jours où les consultants travaillent, pas ceux que le client paie. Regarde les jours facturés sur les jours passés, et regarde-les mission par mission : en général, deux ou trois missions font tout le trou. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Placer six consultants du banc en renfort sur les missions en cours",
        d: "Trois sur Kervalan, deux sur Montlouvel, un sur Talvenec, dès la semaine 2. L'occupation passe à 80 %.",
      },
      {
        t: "Faire la revue des forfaits : reste à faire mission par mission, recentrage sur les cahiers des charges, demandes hors périmètre tracées",
        d: "Trois jours de vos managers cette semaine, et une revue mensuelle ensuite.",
      },
      {
        t: "Reprendre le seul dossier Kervalan, la plus grosse dérive",
        d: "Deux jours avec Évangéline et le directeur de la practice Data.",
      },
      {
        t: "Attendre la clôture d'avril pour y voir clair",
        d: "Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...NELL,
          texte:
            "On est arrivés à trois sur Kervalan lundi. Évangéline n'a pas eu le temps de nous briefer avant mercredi ; on relit des comptes rendus d'entretiens.",
        },
      ],
      [
        {
          ...PRUNE,
          texte:
            "Revue faite. Chaque mission a son reste à faire, ce qui sort du cahier des charges est listé et daté. Les trois chefs de mission recentrent leurs équipes dès lundi.",
        },
      ],
      [
        {
          ...EVANGELINE,
          texte:
            "On a repris Kervalan ligne à ligne : on arrête ce qui ne sert pas le livrable, et les demandes du CHU sont maintenant écrites. Les deux autres missions, on n'y a pas touché.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte: "Attendre ? On en reparle fin avril. J'espère que ça aura bougé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Kervalan ne tiendra pas la date",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...EVANGELINE,
        heure: "10:10",
        alerte: true,
        texte: `Reste à faire de Kervalan : ${ctx.rafKervalan}. Le schéma directeur doit être remis au comité de pilotage de la fin de la semaine 10, et le CCAP prévoit 400 € de pénalités par jour calendaire de retard. Avec trois consultants de plus, je tiens la date.`,
      },
      {
        ...PRUNE,
        heure: "14:30",
        texte: `Fin de la semaine 3 : occupation ${ctx.occupation}, réalisation ${ctx.realisation}. Marge des missions à date : ${ctx.marge}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "ccap",
        titre: "Relire le marché, le CCAP et les comptes rendus des comités",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un quart du reste à faire sort du cahier des charges : les deux établissements ajoutés en février et les entretiens qui vont avec. Chiffré à 40 jours au TJM de l'équipe, soit 33,6 k€, ce hors-périmètre fait 9,3 % d'un marché de 360 k€ : moins de 10 % du marché initial, une modification que l'acheteur peut signer sans nouvelle mise en concurrence. ${
            ctx.trace
              ? "Depuis la revue de la semaine 1, chaque demande est datée et rattachée au compte rendu du comité qui l'a faite."
              : "Mais rien n'est écrit : les demandes ont été faites oralement, en comité."
          }`,
      },
      {
        id: "rythme",
        titre: "Regarder ce qui fixe le rythme de la mission",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le CHU tient un comité toutes les trois semaines, et chaque livrable attend sa validation. Les entretiens se calent sur l'agenda des chefs de service. Un consultant de plus ne fait pas venir les chefs de service plus vite : il faut l'intégrer, relire son travail, et payer son train et son hôtel, à la charge du cabinet sur ce forfait.",
      },
    ],
    question: "Que faites-vous de Kervalan ?",
    options: [
      {
        t: "Ajouter trois consultants du banc pour tenir le comité de la semaine 10",
        d: "Trois juniors dès la semaine 4. Les frais de déplacement sont à la charge du cabinet.",
      },
      {
        t: "Chiffrer le hors-périmètre et proposer un avenant au CHU",
        d: "40 jours, 33,6 k€, et une semaine de délai. L'acheteur dira oui ou non ; en attendant, l'équipe continue.",
      },
      {
        t: "Recentrer la mission sur le cahier des charges, sans négocier",
        d: "Une lettre au CHU : les deux établissements ajoutés et leurs entretiens sortent du périmètre.",
      },
      {
        t: "Laisser l'équipe finir comme prévu",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...EVANGELINE,
          texte:
            "Merci pour les renforts. Il me faut deux jours pour les mettre dans le bain, et ils partent lundi à Kervalan.",
        },
      ],
      [
        {
          ...EVANGELINE,
          texte:
            "Le projet d'avenant est parti à l'acheteur du CHU avec les comptes rendus. Il répond la semaine prochaine.",
        },
      ],
      [
        {
          ...EVANGELINE,
          texte:
            "La lettre est partie. Le directeur des systèmes d'information du CHU a pris acte, sèchement. On livre le cahier des charges, rien que lui.",
        },
      ],
      [
        {
          ...EVANGELINE,
          texte: "D'accord. On fait au mieux, et on verra au comité de la semaine 10.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le TJM moyen monte",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...DARIUSH,
        heure: "09:05",
        alerte: true,
        texte: `TJM moyen facturé du bureau : ${ctx.tjm}, contre 842 € il y a un an. Nos prix passent ! Je propose de relever de 6 % tous nos TJM sur les propositions de mai : il y en a pour une quinzaine de consultants à partir de la semaine 8.`,
      },
      {
        ...VICTOIRE,
        heure: "11:30",
        texte: `Marge des missions à date : ${ctx.marge}. Si les prix passent, profitons-en.`,
      },
    ],
    sources: [
      {
        id: "grades",
        titre: "Décomposer le TJM moyen facturé par grade",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "TJM facturé des juniors : 720 €, des seniors : 1 080 €, les mêmes qu'il y a un an. Ce qui a changé, c'est la part des juniors dans les jours facturés : 60,6 % en mars, contre 66,0 % un an plus tôt. Les juniors sont sur le banc ou sur des jours non facturés ; à la structure de l'an dernier, le TJM moyen de mars serait de 842 €.",
      },
      {
        id: "realise",
        titre: "Comparer le chiffrage et le réalisé des forfaits de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Chiffrés au cahier des charges, comme d'habitude, les forfaits de l'an dernier ont tourné à 86 % de réalisation en moyenne, et de 70 à 100 % selon les missions. Chiffrés sur le réalisé de missions comparables, avec une provision pour aléas de 10 % et des jalons de facturation, à 96 %, presque tous entre 93 et 99 %.",
      },
      {
        id: "transformation",
        titre: "Relire les dix dernières propositions",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Quatre gagnées sur dix. Sur les six perdues, trois l'ont été sur le prix : Kéroual Consulting était 5 à 8 % moins cher, et le critère prix pesait 40 % de la note. Les acheteurs publics demandent presque toujours un prix forfaitaire.",
      },
      {
        id: "syndicat",
        titre: "Lire l'enquête annuelle de la profession sur les TJM",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Selon l'enquête, les TJM du conseil en management ont progressé de 2 à 3 % en un an au niveau national, davantage à Paris qu'en région.",
      },
    ],
    question: "Comment chiffrez-vous les propositions de mai ?",
    options: [
      {
        t: "Relever les TJM de 6 % sur toutes les propositions",
        d: "Juniors à 763 €, seniors à 1 145 €.",
      },
      {
        t: "Garder les TJM, et chiffrer les forfaits sur le réalisé des missions comparables, avec une provision pour aléas et des jalons",
        d: "Un go / no-go des opérations sur chaque forfait. Des prix un peu plus hauts, quelques propositions perdues.",
      },
      {
        t: "Proposer en régie dès que le périmètre est flou",
        d: "Facturé au temps passé. Les acheteurs publics préfèrent un forfait.",
      },
      {
        t: "Chiffrer comme d'habitude",
        d: "Au cahier des charges, aux TJM catalogue.",
      },
    ],
    reactions: [
      [
        {
          ...DARIUSH,
          texte:
            "Les propositions partent avec les nouveaux tarifs. Deux acheteurs nous ont déjà demandé si c'était une erreur.",
        },
      ],
      [
        {
          ...DARIUSH,
          texte:
            "On chiffre sur le réalisé, provision comprise. Un peu plus cher, mais je sais défendre chaque ligne devant l'acheteur.",
        },
      ],
      [
        {
          ...DARIUSH,
          texte:
            "On propose de la régie partout où c'est possible. Deux consultations publiques imposent un forfait : on ne répondra pas.",
        },
      ],
      [{ ...DARIUSH, texte: "Comme d'habitude, alors. Les propositions partent lundi." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Des juniors sur le banc, une banque qui demande du monde",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...WIEBKE,
        heure: "09:40",
        alerte: true,
        texte:
          "Nous cherchons trois consultants juniors en régie, des semaines 8 à 13, pour le pilotage de notre projet de conformité. Notre budget est de 650 € par jour et par consultant. Vous pouvez répondre lundi ?",
      },
      {
        ...EVANGELINE,
        heure: "11:15",
        texte: `Kervalan entre dans la dernière ligne droite : ${ctx.rafKervalan} de reste à faire. Avec quatre juniors de plus, je tiens le comité sans y passer mes nuits. Le banc en a, non ?`,
      },
      {
        ...PRUNE,
        heure: "16:50",
        texte: `Semaine 7 : occupation ${ctx.occupation}, ${ctx.bancJuniors} juniors sur le banc. Réalisation ${ctx.realisation}.`,
      },
    ],
    sources: [
      {
        id: "banc",
        titre: "Calculer ce que rapporte un jour de banc et un jour de régie à 650 €",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un junior coûte 340 € par jour de salaire chargé, qu'il soit sur le banc, en renfort ou chez un client : c'est un coût fixe. Un jour de banc rapporte 0 €, un jour de renfort sur une mission au forfait déjà dépassée aussi, frais en plus. Un jour de régie à 650 € rapporte 650 € de plus qu'un jour de banc, même sous le TJM catalogue de 720 €.",
      },
      {
        id: "renforts",
        titre: "Demander à Évangéline ce que changeraient quatre renforts",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Évangéline : « Ils reprendraient les comptes rendus et la mise en page. Mais il faudrait que je les forme, à deux ou trois semaines de la fin, et ce qui reste, ce sont les arbitrages avec le directeur du CHU : ça, c'est moi, et son agenda. » Leur train et leur hôtel seraient à la charge du cabinet.",
      },
      {
        id: "erdre",
        titre: "Regarder ce que la Banque de l'Erdre a fait l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'an dernier, la banque avait négocié dur : sur trois demandes de régie, elle a accepté une seule fois le tarif catalogue et est allée deux fois chez Kéroual Consulting.",
      },
    ],
    question: "Que faites-vous des juniors disponibles ?",
    options: [
      {
        t: "Les mettre en renfort sur Kervalan pour la dernière ligne droite, et décliner la banque",
        d: "« Nous n'avons personne de disponible. » L'occupation remonte.",
      },
      {
        t: "Accepter la régie de la Banque de l'Erdre à 650 €, avec trois juniors du banc",
        d: "Six semaines, sous le TJM catalogue de 720 €.",
      },
      {
        t: "Contre-proposer au TJM catalogue, 720 €",
        d: "La banque acceptera, ou ira voir ailleurs.",
      },
      {
        t: "Décliner : une régie à 650 € casse nos prix",
        d: "Les juniors restent disponibles pour la suite.",
      },
    ],
    reactions: [
      [
        {
          ...EVANGELINE,
          texte:
            "Les quatre renforts sont arrivés à Kervalan. Je leur confie les comptes rendus ; je les relirai le soir.",
        },
      ],
      [
        {
          ...WIEBKE,
          texte: "Parfait. Vos trois consultants commencent lundi, semaine 8.",
        },
      ],
      null,
      [
        {
          ...WIEBKE,
          texte: "Dommage. Nous allons voir un autre cabinet.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Talvenec veut déployer",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ZAKARIA,
        heure: "10:30",
        alerte: true,
        texte:
          "Le nouveau schéma logistique est validé. Nous voulons le déployer sur nos trois sites, à partir de la semaine 10, avec la même équipe. Et au même prix que la première phase : 60 jours. C'est possible ?",
      },
      {
        ...OIHANA,
        heure: "12:05",
        texte:
          "Trois sites au lieu d'un : sur ce que la phase 1 nous a réellement coûté, il faut 120 jours. L'équipe serait trois juniors et un senior.",
      },
      {
        ...PRUNE,
        heure: "17:10",
        texte: `Semaine 9 : réalisation ${ctx.realisation}, occupation ${ctx.occupation}. Marge à date : ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "phase1",
        titre: "Comparer le prix demandé au réalisé de la phase 1",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Au TJM de l'équipe de déploiement, 810 €, « même prix » veut dire 60 jours vendus, 48,6 k€, pour 120 jours de travail : 50 % de réalisation. Rechiffré sur le réalisé avec des jalons de facturation, 114 jours, 92,3 k€ : 95 % de réalisation si le déploiement prend les 120 jours prévus. En juin, les managers manquent : chaque jour de senior qu'on n'a pas se prend chez Freelancia, à 900 €.",
      },
      {
        id: "talvenec",
        titre: "Demander à Oïhana comment Talvenec achète",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Talvenec veut des prix fermes et des jalons ; la régie, ils n'aiment pas. Quand on leur a montré un chiffrage détaillé, ils l'ont accepté plus de deux fois sur trois. Zakaria a besoin de l'équipe qui connaît le dossier.",
      },
    ],
    question: "Que répondez-vous à Talvenec ?",
    options: [
      {
        t: "Accepter : même équipe, même prix",
        d: "60 jours vendus, 48,6 k€. L'équipe enchaîne dès la semaine 10.",
      },
      {
        t: "Rechiffrer sur le réalisé de la phase 1, avec des jalons de facturation",
        d: "114 jours, 92,3 k€. Talvenec peut refuser.",
      },
      {
        t: "Proposer le déploiement en régie",
        d: "Facturé au temps passé, au TJM catalogue.",
      },
      {
        t: "Décliner",
        d: "L'équipe reste disponible.",
      },
    ],
    reactions: [
      [
        {
          ...ZAKARIA,
          texte: "Parfait. On démarre lundi sur le premier site.",
        },
      ],
      null,
      null,
      [
        {
          ...ZAKARIA,
          texte: "Je comprends. Nous ferons le déploiement en interne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "La phase 2 de Kervalan",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...FANCH,
        heure: "09:15",
        alerte: true,
        texte:
          "Le CHU souhaite une phase 2 : l'accompagnement à la mise en œuvre du schéma directeur dans ses quatre établissements, à partir de la semaine 12. Notre budget est de 60 k€ HT au forfait.",
      },
      {
        ...EVANGELINE,
        heure: "11:40",
        texte: `${ctx.kervalanEtat} Sur ce que la phase 1 nous a coûté, l'accompagnement des quatre établissements, c'est 130 jours. L'équipe pourrait enchaîner, quatre juniors et deux seniors.`,
      },
      {
        ...VICTOIRE,
        heure: "15:00",
        texte: `L'été arrive, et le banc avec. Une phase 2 qui occupe l'équipe jusqu'en septembre, c'est bon pour l'occupation. Marge à date : ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "phase2",
        titre: "Chiffrer la phase 2 sur le réalisé de la phase 1",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Au TJM de l'équipe, 840 €, 60 k€ paient 71 jours. Pour les quatre établissements, il en faut 130 : 55 % de réalisation, et une perte à terminaison. Recoupé à deux établissements en tranche ferme, les deux autres en tranche optionnelle, le périmètre demande 75 jours : 95 % de réalisation au budget du CHU.",
      },
      {
        id: "acheteur",
        titre: "Demander à l'acheteur comment le CHU peut commander",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Fañch : « Je préfère un forfait. Des tranches, je sais faire ; des bons de commande en régie, mon contrôleur financier les regarde de près. »${
            ctx.retard
              ? " Il ajoute que la remise en retard du schéma directeur a laissé des traces chez le directeur."
              : ""
          }`,
      },
    ],
    question: "Que proposez-vous au CHU ?",
    options: [
      {
        t: "Accepter le budget du CHU : 60 k€ au forfait, pour les quatre établissements",
        d: "L'équipe Kervalan enchaîne en semaine 12, et elle est occupée tout l'été.",
      },
      {
        t: "Proposer la phase 2 en régie, par bons de commande",
        d: "Facturée au temps passé, au TJM catalogue.",
      },
      {
        t: "Recouper le périmètre au budget : deux établissements en tranche ferme, chiffrés sur le réalisé, deux en tranche optionnelle",
        d: "60 k€ pour 75 jours de travail. Le CHU doit l'accepter.",
      },
      {
        t: "Décliner la phase 2",
        d: "L'équipe revient au bureau.",
      },
    ],
    reactions: [
      [{ ...FANCH, texte: "Entendu : 60 k€, quatre établissements. Bon de démarrage lundi." }],
      [
        {
          ...EVANGELINE,
          texte: "La proposition en régie est partie. Fañch répond en début de semaine.",
        },
      ],
      [
        {
          ...EVANGELINE,
          texte:
            "La proposition en deux tranches est partie, avec le chiffrage établissement par établissement. Fañch répond en début de semaine.",
        },
      ],
      [{ ...FANCH, texte: "Bien noté. Nous consulterons d'autres cabinets." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Lire la réalisation, agir mission par mission", chemin: [1, 1, 1, 1, 1, 2] },
  { nom: "Monter l'occupation", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier quand la marge baisse et que l'occupation est le chiffre
 * qu'on regarde : mettre le banc en renfort sur les missions qui dérapent, croire
 * le TJM moyen, vendre au prix du client pour occuper l'équipe. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  avenantSigne:
    "Les demandes sont dans nos comptes rendus : je signe l'avenant, 33,6 k€, et le comité final passe en semaine 11.",
  avenantRefuse:
    "Je ne retrouve ces demandes nulle part par écrit. Pas d'avenant : le marché, rien que le marché, et le comité reste en semaine 10. Et ce qui a été commencé doit être terminé.",
  erdreCatalogue: "Bon. Nous acceptons 720 € pour ne pas perdre de temps. Début lundi, semaine 8.",
  erdreRefuse:
    "720 €, c'est au-dessus de notre budget. Nous avons trouvé chez Kéroual Consulting, à 640 €.",
  talvenecRechiffreOui:
    "Votre chiffrage est solide, et les jalons me conviennent. Nous signons : démarrage en semaine 10.",
  talvenecRechiffreNon:
    "92 k€, c'est le double. Nous allons faire le déploiement avec nos équipes.",
  talvenecRegieOui:
    "D'accord pour la régie, à condition d'un point hebdomadaire sur les jours passés.",
  talvenecRegieNon: "De la régie, non : nous voulons un prix ferme. Nous ferons en interne.",
  phase2Oui: "Votre proposition nous convient. Bon de démarrage pour la semaine 12.",
  phase2Non: "Nous ne retiendrons pas votre proposition pour la phase 2.",
  penalites:
    "Le schéma directeur a été remis après la date du comité. Conformément au CCAP, le CHU applique les pénalités de retard.",
} as const;
