/**
 * FICHE ENSEIGNANT · ÉPISODE 50, LE BUREAU QUI S'ÉCHAUFFE.
 *
 * Un épisode du « premier poste » : l'élève joue un apprenti de bureau. Le
 * rapprochement des factures, et les relations de travail : écouter, vérifier
 * les faits, dire les choses tôt et en face. Le piège : vider la pile sans
 * vérifier, et soulager la tension du moment au prix de la suite.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "bureau-qui-s-echauffe",
  formations: ["seconde-pro-gatl"],
  programme: [
    "2de pro GATL · Domaine 1, Gérer des relations interpersonnelles",
    "2de pro GATL · Domaine 3, Mettre en œuvre et contrôler les processus administratifs",
  ],
  notion:
    "Une facture fournisseur ne se paie qu'après le rapprochement : le bon de commande, le bon de livraison signé et la facture doivent dire la même chose. Quand une pile de factures grossit, l'erreur classique consiste à accuser la charge ou une personne, puis à courir plus vite (payer sans vérifier, faire des heures supplémentaires), au lieu de chercher ce qui bloque. Dans l'épisode, le bureau de l'agence Arvel Distribution de Bourgoin-Jallieu a 90 factures en attente pour 60 reçues par semaine ; 15 ont passé leur échéance la semaine dernière, à 40 € d'indemnité chacune. Le tri de la pile montre que 30 % des factures arrivent sans leur bon de livraison, resté sur le bureau du magasinier, et que les bons ne montent qu'une fois par semaine, alors que le volume n'a augmenté que de 4 % en un an. La même logique vaut pour les cinq situations de relation qui suivent : un transporteur écouté et dont on cherche la facture devant lui se calme, un désaccord dit en face avec des faits se règle, une erreur de 9 000 € dite tout de suite se récupère en entier, un client qui conteste a raison quatre fois sur dix et se vérifie sur le bon signé. L'élève découvre que la réponse réflexe (payer, renvoyer ailleurs, se taire, cacher, se justifier) soulage sur le moment et coûte ensuite.",
  objectifs: [
    "Je rapproche une facture du bon de commande et du bon de livraison signé avant de la faire payer.",
    "Je cherche ce qui bloque un circuit administratif avant d'accuser la charge de travail ou une collègue.",
    "Je reçois une personne en colère en l'écoutant, en vérifiant son dossier devant elle et en lui disant quand elle aura sa réponse.",
    "Je dis tout de suite une erreur à ma responsable, avec les faits et une solution, et je reçois une remarque sur mon travail sans me justifier.",
    "Je fais une estimation chiffrée par une multiplication simple, et je la compare ensuite au réalisé.",
  ],
  prerequis:
    "Les documents commerciaux (bon de commande, bon de livraison, facture, avoir) et l'idée d'échéance de paiement doivent avoir été vus en cours. Le rapprochement à trois documents peut être rappelé en cinq minutes avant de jouer ; l'écoute active et la reformulation peuvent être découvertes pendant la séance.",
  dureeMinutes: 90,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/bureau-qui-s-echauffe?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez Sacha, apprenti au bureau, et vous demandez de noter sur papier, avant de valider la semaine 1, le nombre de factures attendues en semaine 3 et le calcul qui y mène, puis la réponse choisie à chacune des six situations.",
    },
    {
      minutes: 25,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez deux choses : la manière de remettre les factures à jour en semaine 1 (payer, bannette, relances ou heures) et la réponse au double paiement en semaine 6, où la classe se partage souvent entre dire et se taire. Un binôme qui a fini tôt rejoue en changeant la seule décision du désaccord avec Fabienne.",
    },
    {
      minutes: 10,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous refaites la multiplication avec la classe : 12 factures par jour ouvré, 5 jours ouvrés, 60 factures par semaine. Vous faites expliquer les valeurs éloignées (12, 90 ou 180). Vous montrez ensuite que ces 60 factures sont aussi l'objectif de la pile : une semaine de factures en attente, au plus, quand il y en a 90 le premier lundi.",
    },
    {
      minutes: 20,
      titre: "Les situations où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et de la semaine 6. Pour la semaine 1, vous faites lire la source « Trier les factures en attente » : 30 % des factures sans bon de livraison, et c'est la cause, pas la charge (4 % de factures en plus en un an). Pour la semaine 6, vous faites lire ce que dit Fabienne : tout de suite, l'avoir passe tout seul ; dans deux mois, le fournisseur aura clôturé. Deux élèves jouent ensuite devant la classe l'accueil de M. Bressan, une fois en le renvoyant au siège, une fois en cherchant sa facture devant lui.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Écouter, vérifier, dire » finit 12,1 k€ sous le plafond de 40 k€ ; « Éviter les conflits » et « Faire comme d'habitude » finissent 32,5 k€ et 33,2 k€ au-delà. Sur les trente tirages, chaque réponse réflexe, rejouée à la place de la bonne, fait moins bien à chaque fois. Le hasard ne joue que sur deux suites : la promesse faite à M. Bressan, tenue une fois sur trois (pas sous le tirage n° 12), et le double paiement caché, découvert par Nathalie six fois sur dix (sous le tirage n° 12, il l'est). Vous faites dire si une promesse tenue par chance aurait rendu la décision bonne.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois gestes de l'épisode : écouter, vérifier les faits sur les documents, dire les choses tôt et en face. Vous les reliez au circuit des factures : une facture se paie après le rapprochement, et une pile qui grossit se traite en cherchant ce qui la bloque. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 60,
    etapes: [
      "Le repère de la prévision : le bureau reçoit environ 12 factures fournisseurs par jour ouvré, et il y a 5 jours ouvrés par semaine.",
      "Factures reçues en une semaine : 12 × 5 = 60 factures. La question porte sur les factures reçues pendant la semaine 3, pas sur la pile en attente ni sur le cumul depuis le début.",
      "La source « Comparer le nombre de factures à l'an dernier » donne 4 % de plus qu'il y a un an : le repère de 12 par jour est déjà le rythme d'aujourd'hui, il n'y a rien à ajouter. Les 90 factures en attente du lundi sont un stock, pas ce qui arrive chaque semaine.",
      "Sous le tirage de la classe, le modèle donne environ 64 factures reçues en semaine 3 (les arrivées varient un peu d'une semaine à l'autre) : 60 est juste, l'épisode accepte 4 factures d'écart et juge proche à 10. L'imprévu « Fin de grands chantiers », qui fait arriver 30 % de factures en plus, ne tombe pas en semaine 3 sous ce tirage.",
    ],
    erreurs: [
      {
        valeur: 12,
        cause:
          "Les factures d'un seul jour, sans multiplier par les 5 jours ouvrés de la semaine.",
      },
      {
        valeur: 90,
        cause:
          "Les factures en attente du lundi de la semaine 1 prises pour les factures reçues : c'est la pile, pas ce qui arrive chaque semaine.",
      },
      {
        valeur: 180,
        cause:
          "Les factures reçues des semaines 1 à 3 additionnées (60 × 3) : la question porte sur la seule semaine 3.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Les fournisseurs se plaignent d'être payés en retard et Nathalie veut la pile à jour : payer sans attendre les bons la vide tout de suite.",
      ceQuiLeDejoue:
        "La source « Trier les factures en attente » le dit : sans bon de livraison, on ne peut pas vérifier que la marchandise est arrivée. Fabienne le constate dès la semaine suivante : une palette de carrelage payée que le dépôt n'a jamais reçue. La source « Suivre un bon de livraison » montre la vraie cause, des bons qui ne montent au bureau qu'une fois par semaine. Rejoué sur les trente tirages à la place de la bannette, payer sans vérifier coûte 18,6 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Il y a trop de factures pour deux personnes : huit heures de plus par semaine pendant quatre semaines rattrapent la pile.",
      ceQuiLeDejoue:
        "Le volume n'a augmenté que de 4 % en un an (source « Comparer le nombre de factures »), et 30 % des factures restent bloquées faute de bon : les heures traitent plus vite les factures complètes, pas celles qui attendent leur bon. Fabienne le voit : « La pile baisse, mais les bons arrivent toujours aussi peu. » Les heures coûtent 200 € par semaine ; rejouées sur les trente tirages à la place de la bannette, elles coûtent 16,6 k€ de plus en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Les paiements se font au siège : ce n'est pas le service de Sacha, et il vaut mieux renvoyer M. Bressan vers ceux qui décident.",
      ceQuiLeDejoue:
        "La source « Chercher la facture Bressan » montre que la facture est bloquée à l'agence : arrivée il y a huit semaines, il lui manque le bon signé resté au dépôt, et une fois le bon retrouvé elle part au virement de mardi. Transports Bressan livre l'agence trois fois par semaine depuis six ans, sans litige. Renvoyé, il répond que le siège le renvoie à l'agence, et il écrit à la directrice. Rejoué sur les trente tirages à la place de l'écoute, le renvoi coûte 3,7 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Il crie dans un bureau : il faut savoir se faire respecter, même quand on est apprenti.",
      ceQuiLeDejoue:
        "Sa colère a une cause vérifiable : une facture de deux mois, bloquée par un bon resté au dépôt, que dix minutes d'écoute et un passage au dépôt suffisent à débloquer. Rembarré, il refuse de charger les marchandises de l'agence pendant quinze jours, et la scène devant les collègues pèse sur l'entente du bureau. Rejouée sur les trente tirages à la place de l'écoute, la réponse sur le même ton coûte 7,1 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Nathalie est la responsable : c'est à elle de répartir le travail, et lui en parler évite une dispute avec Fabienne.",
      ceQuiLeDejoue:
        "La source « Noter pendant une semaine qui fait quoi » montre que chacun croit en faire plus : Sacha prend presque tous les appels, mais Fabienne fait toutes les saisies, que Sacha ne sait pas encore faire. Nathalie le reconnaît : « Je n'ai jamais écrit qui faisait quoi. » Recadrée sans avoir été prévenue, Fabienne ne fait plus que sa part. Rejouée sur les trente tirages à la place d'une discussion au calme avec un partage écrit, la plainte coûte 16,4 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Dire une erreur de 9 000 € à sa responsable fait peur, et personne ne la remarquera peut-être.",
      ceQuiLeDejoue:
        "Fabienne l'a expliqué (source « Demander à Fabienne comment on récupère un double paiement ») : un avoir demandé tout de suite passe tout seul ; dans deux mois, la comptabilité du fournisseur aura clôturé, et ce sera long. Cachée, l'erreur se récupère mal, et quand Nathalie la découvre, la confiance s'en va : sous le tirage n° 12, elle la découvre en semaine 11. Rejouée sur les trente tirages à la place de l'aveu immédiat, cacher l'erreur coûte 6,0 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le logiciel se trompe rarement : la facture est juste, et l'appel est vite terminé.",
      ceQuiLeDejoue:
        "Le bon de livraison signé par M. Chabert compte une seule palette, la facture deux : l'erreur vient de l'agence. Le cahier des appels montre qu'environ 6 clients contestent une facture chaque semaine, et qu'ils ont raison 4 fois sur 10 ; plusieurs à qui l'on a répondu « la facture est juste » ont cessé de commander. Rejouée sur les trente tirages à la place de la vérification sur le bon signé, cette réponse coûte 6,5 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Une remise de 200 € et le client raccroche content : c'est rapide, et on garde le client.",
      ceQuiLeDejoue:
        "La remise va à tous ceux qui appellent, alors que six fois sur dix ils ont tort, et l'erreur reste dans le logiciel : M. Chabert prévient que la prochaine facture aura la même. Six appels par semaine à 200 €, c'est environ 1 200 € par semaine, quand vérifier prend dix minutes par appel et ne fait l'avoir que s'il est dû. Rejouée sur les trente tirages à la place de la vérification, la remise coûte 4,2 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Fabienne n'a pas tout montré et le logiciel est mal fait : faire le dossier seul prouvera qu'on sait travailler.",
      ceQuiLeDejoue:
        "La source « Regarder les erreurs que Nathalie a relevées » montre des erreurs qui se ressemblent (un code fournisseur mal choisi, une quantité recopiée de travers) qu'une relecture rapide aurait toutes vues. La liste des avoirs compte une douzaine d'avoirs chez sept fournisseurs, pour 7 200 € : Fabienne connaît les fournisseurs, Sacha connaît les bons. Seul, le dossier n'est fait qu'à moitié. Rejouée sur les trente tirages à la place de l'écoute et du dossier partagé, la justification coûte 3,5 k€ de plus en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu trop de factures, d'autres une collègue qui ne fait pas sa part. Qu'est-ce qui, dans les sources, montrait que les factures attendaient autre chose ? Que fallait-il changer, et avec qui ?",
    "Pourquoi une facture ne se paie-t-elle pas sans le bon de livraison signé ? Que s'est-il passé chez ceux qui ont vidé la pile sans vérifier ?",
    "M. Bressan, puis M. Chabert : deux personnes en colère, et chaque fois une erreur de l'agence. Qu'avez-vous fait pour savoir s'ils avaient raison ? Qu'est-ce qui les a calmés ?",
    "Avec Fabienne, chacun pensait en faire plus que l'autre. Pourquoi noter une semaine qui fait quoi change-t-il la discussion ? Pourquoi passer par Nathalie sans en parler à Fabienne a-t-il abîmé l'entente ?",
    "Le double paiement de 9 000 € : ceux qui l'ont dit tout de suite ont tout récupéré. Pourquoi un mail court le vendredi soir ne suffit-il pas ? Qu'est-ce que Nathalie attend quand on lui annonce une erreur ?",
    "Sous le tirage n° 12, la promesse faite à M. Bressan n'a pas été tenue ; une fois sur trois, elle l'est. Si elle avait été tenue, la promesse aurait-elle été une bonne décision ? Qu'est-ce qui distingue une bonne décision d'un bon résultat ?",
    "Quelle règle gardez-vous pour votre prochain stage quand quelqu'un est en colère, ou quand vous avez fait une erreur ? Dites-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Un bureau reçoit 15 factures fournisseurs par jour ouvré, 5 jours par semaine. Ce lundi, 125 factures sont en attente. Le bureau peut traiter 100 factures par semaine, mais 25 % des factures n'ont pas leur bon de livraison et ne peuvent pas être rapprochées. Chaque semaine, la moitié des factures en attente au-delà d'une semaine de factures passe son échéance, et chacune coûte 40 € d'indemnité. 1) Combien de factures le bureau reçoit-il par semaine ? 2) Combien peut-il en traiter vraiment ? 3) Que devient la pile, et combien coûtent les retards chaque semaine ? 4) Une bannette convenue avec le dépôt fait tomber les factures sans bon à 5 % : calculez la pile en fin de semaine pendant trois semaines, et les indemnités de ces trois semaines.",
    corrige:
      "1) 15 × 5 = 75 factures par semaine. 2) 100 × 0,75 = 75 factures : autant que ce qui arrive. 3) La pile reste à 125 ; (125 − 75) / 2 = 25 factures passent leur échéance chaque semaine, soit 25 × 40 = 1 000 € par semaine, 13 000 € sur treize semaines. 4) 100 × 0,95 = 95 factures traitées : la pile passe à 125 + 75 − 95 = 105, puis 85, puis 65. Les retards : (105 − 75) / 2 = 15 factures, soit 600 € ; puis (85 − 75) / 2 = 5, soit 200 € ; puis aucun, la pile étant sous une semaine de factures. En tout 800 €, contre 3 000 € sans bannette sur les mêmes trois semaines.",
  },
  evaluation: [
    "Le calcul des factures reçues par semaine est juste (12 × 5 = 60), et l'élève distingue le flux de la semaine de la pile en attente.",
    "Le diagnostic de la semaine 1 s'appuie sur les sources : les bons de livraison qui restent au dépôt, et non la charge ou la collègue.",
    "Dans les situations de relation, l'élève justifie sa réponse par un fait vérifié (la facture bloquée, le bon signé, les notes de la semaine) et non par l'émotion du moment.",
    "L'élève sait expliquer pourquoi une erreur se dit tout de suite, avec les faits et la solution, en citant ce que dit Fabienne sur la clôture du fournisseur.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode compte 40 € par facture payée en retard : c'est l'indemnité forfaitaire pour frais de recouvrement due entre professionnels, à laquelle s'ajoutent en droit des pénalités de retard que le modèle ne compte pas. L'option des heures supplémentaires (huit heures de plus par semaine) est posée sans dire qui les fait ; si l'on rappelle que Sacha est apprenti en seconde, donc souvent mineur, la durée du travail d'un apprenti de moins de 18 ans est encadrée (en principe 8 heures par jour et 35 heures par semaine, sauf dérogation) : à relire avant d'en parler en classe.",
};
