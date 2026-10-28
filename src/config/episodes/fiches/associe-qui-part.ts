/**
 * FICHE ENSEIGNANT · ÉPISODE 80, L'ASSOCIÉ QUI VEUT VENDRE SES PARTS.
 *
 * Valoriser des parts par la méthode d'un pacte (EBE retraité, multiple,
 * endettement net, décote), puis protéger par le montage ce qui peut partir
 * avec le cédant : dans un cabinet, la valeur tient en partie à ses clients.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "associe-qui-part",
  formations: ["dcg", "dscg", "but-gea"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "DSCG · UE 2, Finance",
    "DCG · UE 2, Droit des affaires",
  ],
  notion:
    "Le prix d'une entreprise de services ne se lit pas sur un multiple de presse appliqué à l'EBE publié : il se calcule sur un EBE retraité, puis il se négocie sur ce qui peut partir avec le vendeur. Deux erreurs se répondent : payer le prix réclamé comptant pour avoir la paix, ou opposer sèchement le pacte. Chez Atlas Conseil, Wilfrid Vasselot réclame 2 988 k€ comptant pour ses 18 %, « huit fois l'EBE » ; le pacte qu'il a signé donne 1 867 k€ (six fois un EBE retraité de 2 200 k€, moins 1 000 k€ d'endettement net, décote de minorité de 15 %). Mais ses trois grands comptes valent 2 580 k€ pour le cabinet, et deux d'entre eux tiennent à sa personne. L'élève découvre qu'on calcule d'abord le prix du pacte, qu'on fait une revue des comptes avant de payer, que ce qui part avec le cédant se protège par la façon de payer (comptant réduit, complément de prix sur ce qu'il maîtrise, clauses proportionnées, accompagnement) et qu'emprunter au taux du marché ne détruit pas de valeur quand la trésorerie tomberait sous son seuil.",
  objectifs: [
    "Je retraite un EBE (rémunération normative des dirigeants, éléments non récurrents) et j'en déduis une valeur d'entreprise par un multiple.",
    "Je passe de la valeur d'entreprise à la valeur des titres : endettement financier net, quote-part, décote de minorité.",
    "Je compare des montages de paiement (comptant, crédit vendeur, complément de prix) selon que le risque principal se réalise ou non.",
    "Je choisis le financement d'un rachat en regardant la trésorerie au point bas, et non le seul coût des intérêts.",
  ],
  prerequis:
    "L'EBE, l'endettement financier net et la notion de capitaux propres doivent être connus. La valorisation par les multiples et le principe d'un pacte d'associés peuvent être présentés en quinze minutes avant la séance ; le complément de prix (earn-out) se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/associe-qui-part?hasard=30 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la valeur des parts de Wilfrid selon la méthode du pacte, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez l'offre écrite de la semaine 4 (son prix, le pacte, le montage équilibré, le montage maximal), le financement de la semaine 8 et la réponse de la semaine 10 au gel de Lavaudière. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 2 : faire la revue des comptes, ou ne pas sonder.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir des comptes et du pacte : EBE de 3 000 k€, moins 6 × 100 k€ de rémunération normative, moins 350 k€ de marge non récurrente, plus 150 k€ de charges non récurrentes, soit 2 200 k€ ; 6 × 2 200 = 13 200 k€ de valeur d'entreprise ; moins 1 000 k€ d'endettement net, 12 200 k€ ; 18 %, 2 196 k€ ; décote de 15 %, 1 867 k€. Vous faites expliquer les valeurs éloignées (2 196, 2 601 ou 2 020), puis retrouver les 2 988 k€ de Wilfrid : huit fois l'EBE retraité, sans décote.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 4 et vous faites remplir au tableau ce que coûte chaque offre si les trois comptes restent et s'ils partent : 2 988 ou 2 988 ; 1 867 ou 1 867 ; 2 200 ou 1 600 ; 2 300 ou 1 000, face à 2 580 k€ de valeur des comptes. Vous enchaînez sur la semaine 8 (payer sur la trésorerie la ferait tomber à 0 k€ au point bas, pour un seuil de 600 k€) et sur la semaine 10 : pourquoi un complément de prix doit porter sur ce que le cédant maîtrise.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 30, « Sécuriser par le montage » crée 372 k€ pour les associés restants, pour un objectif de 200 k€ ; « La paix à tout prix » en détruit 2 331 k€, et l'attentisme 1 178 k€. Vous montrez ensuite la décision la plus trompeuse : ne pas sonder les comptes fait mieux que la revue 24 fois sur 30, et perd 41 k€ en moyenne, parce que, quand on se trompe sur un compte qui tient à Wilfrid, on paie pour un compte qui part ; sous le tirage n° 30, c'est ce qui arrive. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : calculer le prix sur l'EBE retraité, puis protéger par la façon de payer ce qui peut partir avec le vendeur. Vous la déclinez en trois gestes : la méthode du pacte comme base, un montage qui lie une part du prix au maintien des comptes, et un financement qui garde la trésorerie au-dessus de son seuil. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 1866.6,
    etapes: [
      "Source « Reprendre les comptes 2026 avec l'expert-comptable » : EBE publié 3 000 k€. Rémunération normative : six associés payés 140 k€ au lieu de 240 k€ au prix du marché, soit 6 × 100 = 600 k€ à retirer. Éléments non récurrents : 350 k€ de marge exceptionnelle à retirer, 150 k€ de charges de déménagement à réintégrer. EBE retraité : 3 000 − 600 − 350 + 150 = 2 200 k€.",
      "Source « Relire le pacte d'associés avec Maître Guéhenneuc », article 9 : valeur d'entreprise de six fois l'EBE retraité, 6 × 2 200 = 13 200 k€, diminuée de l'endettement financier net, 3 600 − 2 600 = 1 000 k€ : fonds propres de 12 200 k€.",
      "Quote-part de Wilfrid : 18 % × 12 200 = 2 196 k€. Cession de moins du tiers du capital : décote de minorité de 15 %, 2 196 × 0,85 = 1 866,6 k€.",
      "Le chiffre ne dépend pas du hasard : 1 866,6 k€ pour toute la classe, environ 1 867 k€. L'épisode le juge juste à 15 k€ près, proche à 60 k€. Les 2 988 k€ réclamés sont 18 % de huit fois l'EBE retraité moins l'endettement net, sans décote.",
    ],
    erreurs: [
      {
        valeur: 2196,
        cause:
          "La décote de minorité oubliée (18 % × 12 200) : le pacte l'applique à toute cession de moins du tiers du capital, et 18 % en font partie.",
      },
      {
        valeur: 2601,
        cause:
          "L'EBE publié au lieu de l'EBE retraité (6 × 3 000 − 1 000, puis 18 % et la décote) : la rémunération normative et les éléments non récurrents font partie de la méthode du pacte.",
      },
      {
        valeur: 2020,
        cause:
          "L'endettement net oublié (18 % × 13 200 × 0,85 ≈ 2 019,6) : la valeur d'entreprise appartient aussi aux prêteurs ; les associés n'en ont que les fonds propres.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La présidente ne veut pas de guerre entre fondateurs, et Oswald Bertrandias le dit : un associé fâché qui reste six mois coûte plus cher que quelques centaines de milliers d'euros.",
      ceQuiLeDejoue:
        "Le pacte que Wilfrid a signé donne 1 867 k€, et le « huit fois » de Bordeaux comprenait, selon la note de l'expert-comptable, trois ans de complément de prix et des associés restés aux commandes ; Wilfrid n'a lu que le communiqué. Payer tout comptant laisse le cabinet seul face au départ de ses comptes. Amalric Malivel : « Ce qui part avec le cédant se protège par la façon de payer, pas par le chiffre du prix. » Rejoué sur les trente tirages à la place du pacte comme point de départ et d'un prix lié aux comptes, accepter son prix perd 74 k€ en moyenne ; il ne fait mieux qu'une fois sur 30.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Le pacte s'applique, Wilfrid l'a signé : lui opposer 1 867 k€ comptant, sans rien d'autre à discuter, paraît rigoureux et défendable.",
      ceQuiLeDejoue:
        "Le prix du pacte ne protège rien : payé comptant, il laisse Wilfrid libre de faire ce qu'il annonce : « Je vais regarder ce que valent mes clients ailleurs », et la source sur Halden montre qu'à Rennes deux associés qui s'estimaient mal traités par leur pacte ont fait partir quatre grands comptes sur six. Siegfried Aurenche, qui ouvre l'Ouest pour Halden, connaît Wilfrid depuis l'école. Rejoué sur les trente tirages à la place du pacte comme point de départ et d'un prix lié aux comptes, le pacte sec perd 94 k€ en moyenne ; il ne fait mieux qu'une fois sur 30.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Oswald le dit : on connaît nos clients, et faire le tour des comptes, c'est leur annoncer qu'il y a un problème.",
      ceQuiLeDejoue:
        "Tempora montre que Wilfrid signe seul les trois comptes mais n'y passe que 6 % de ses jours : nos fichiers ne disent pas si la relation tient à lui ou à l'équipe. Un compte qui tient à sa personne a suivi le cédant une fois sur deux, un compte tenu par l'équipe une fois sur quinze ; la revue est discrète, sans parler de cession, et coûte 12 k€. Le directeur général de Herlinval a déjà demandé si Wilfrid partait. Rejoué sur les trente tirages à la place de la revue, ne pas sonder perd 41 k€ en moyenne, mais fait mieux 24 fois sur 30 : quand on se trompe, on paie pour des comptes qui partent.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "La paix entre associés n'a pas de prix : 2 988 k€ comptant à la signature, et l'affaire est close.",
      ceQuiLeDejoue:
        "Le chiffrage des offres le montre : son prix coûte 2 988 k€ que les comptes restent ou partent, quand le montage équilibré coûte 2 200 k€ s'ils restent et 1 600 k€ s'ils partent. Payer 2 988 k€ sur 2 600 k€ de trésorerie, avec un point bas prévu à 1 300 k€ avant tout rachat, fait plonger l'été. Rejoué sur les trente tirages à la place du montage équilibré, son prix comptant détruit 1 251 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Wilfrid ne veut pas d'une clause qui lui interdise de travailler : s'en tenir au pacte évite de le braquer avant la signature.",
      ceQuiLeDejoue:
        "Maître Guéhenneuc le rappelle : en l'état, sans non-sollicitation, il peut démarcher ses clients dès l'an prochain. Une non-concurrence de deux ans sur le conseil en performance opérationnelle dans le Grand Ouest, et une non-sollicitation de trois ans, sont valables et proportionnées ; payées 60 k€, elles ont réduit d'environ un tiers les départs de comptes, et Wilfrid accepte « deux ans, le Grand Ouest, et payé ». Six mois d'accompagnement divisent par trois les départs d'un compte quand le cédant est intéressé à le garder. Rejoué sur les trente tirages à la place des clauses et de l'accompagnement ciblé, le pacte seul perd 172 k€ en moyenne ; il fait mieux 19 fois sur 30.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Emprunter pour racheter un associé qui part, c'est 168 k€ d'intérêts sur cinq ans « jetés par la fenêtre », dit Oswald, alors qu'il y a 2,6 M€ en banque.",
      ceQuiLeDejoue:
        "La projection de l'été montre un point bas de 1 300 k€ fin août sans le rachat : payer 1 300 k€ sur la trésorerie le ferait tomber à 0 k€, pour un seuil de sécurité de 600 k€, et il faudrait céder des créances en urgence, 25 k€ plus 6 % de ce qui manque sous le seuil. Au taux du marché, les intérêts paient le temps et ne retirent rien à la valeur ; seuls les frais de dossier, 0,5 à 0,8 %, sont une perte. Rejoué sur les trente tirages à la place de l'emprunt, le paiement sur la trésorerie perd 59 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le protocole est prêt, et avec le gel de Lavaudière, le cabinet ne paiera pas sa part du complément : Oswald veut signer vite, tel quel.",
      ceQuiLeDejoue:
        "Le recalcul montre que, honoraires gelés à 70 % de ceux de 2026, Wilfrid perdrait les 200 k€ de Lavaudière quoi qu'il fasse, et n'aurait plus aucune raison de transmettre le compte. Il l'a vu : il ne signera pas un complément qui dépend du plan d'économies d'un client, et refusera une fois sur deux ; on irait devant l'expert du pacte et les clauses négociées tomberaient. Réécrit sur le maintien du compte, le complément coûte 200 k€ de plus si Lavaudière reste et garde Wilfrid intéressé. Rejoué sur les trente tirages à la place de la réécriture, signer tel quel perd 430 k€ en moyenne ; il fait mieux 14 fois sur 30.",
    },
  ],
  debrief: [
    "En semaine 1, Wilfrid réclamait 2 988 k€ et le pacte donnait 1 867 k€. Quels retraitements séparent l'EBE publié de l'EBE retraité, et lequel pèse le plus ?",
    "La note de l'expert-comptable dit que le « huit fois » de Bordeaux comprenait trois ans de complément de prix. Qu'est-ce qu'un multiple publié dans la presse ne dit pas de la façon dont le prix a été payé ?",
    "Ses trois comptes valent 2 580 k€ pour le cabinet. Remplissez le tableau des quatre offres, comptes gardés et comptes partis : laquelle partage le risque avec Wilfrid sans qu'il le vive comme de la défiance ?",
    "Ne pas sonder les comptes fait mieux que la revue 24 fois sur 30, et perd pourtant en moyenne. Comment une décision peut-elle gagner le plus souvent et rester mauvaise ?",
    "Oswald veut payer comptant pour ne pas payer 168 k€ d'intérêts. Pourquoi ces intérêts ne retirent-ils rien à la valeur du cabinet, et qu'est-ce qui coûte vraiment si on paie sur la trésorerie ?",
    "Sous le tirage n° 30, ceux qui ont acheté la paix détruisent 2 331 k€, ceux qui ont sécurisé par le montage en créent 372. Si les comptes étaient tous restés, la paix aurait-elle été une bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour racheter les parts d'un associé dont la valeur tient à ses clients ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un cabinet d'expertise publie un EBE de 1 200 k€. Ses quatre associés se versent 120 k€ chacun, quand un associé payé au prix du marché coûterait 180 k€ ; l'exercice contient 100 k€ de produits non récurrents. Ses emprunts s'élèvent à 1 500 k€ et sa trésorerie à 700 k€. Le pacte fixe la valeur d'entreprise à six fois l'EBE retraité et applique une décote de 15 % à toute cession de moins du tiers du capital. Un associé cède 25 % du capital. 1) Calculez l'EBE retraité. 2) Calculez la valeur d'entreprise, puis les fonds propres. 3) Calculez le prix du pacte. 4) Un montage propose 600 k€ comptant et un complément de 400 k€ si ses clients restent deux ans. Que paie le cabinet dans chaque cas, comparé au prix du pacte payé comptant ?",
    corrige:
      "1) Rémunération normative : 4 × (180 − 120) = 240 k€ à retirer ; produits non récurrents : 100 k€ à retirer. EBE retraité : 1 200 − 240 − 100 = 860 k€. 2) Valeur d'entreprise : 6 × 860 = 5 160 k€ ; endettement net : 1 500 − 700 = 800 k€ ; fonds propres : 5 160 − 800 = 4 360 k€. 3) 25 % × 4 360 = 1 090 k€ ; décote de 15 % : 1 090 × 0,85 = 926,5 k€. 4) Clients gardés : 600 + 400 = 1 000 k€, soit 73,5 k€ de plus que le pacte, pour des clients qui restent ; clients partis : 600 k€, soit 326,5 k€ de moins. Le montage transfère au cédant une part du risque que le prix comptant laisse au cabinet.",
  },
  evaluation: [
    "La valeur des parts selon le pacte est calculée juste (EBE retraité de 2 200 k€, 13 200 k€, 12 200 k€, 2 196 k€, décote, 1 866,6 k€) à partir des sources nommées.",
    "L'offre faite à Wilfrid est comparée aux autres dans les deux cas, comptes gardés et comptes partis, au regard de la valeur des comptes.",
    "La protection des comptes repose sur une revue préalable, des clauses proportionnées et un accompagnement ciblé, avec leurs coûts.",
    "Le financement du comptant est choisi en regardant la trésorerie au point bas et son seuil, et non le seul montant des intérêts.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 30.",
  ],
  vigilance:
    "Les règles juridiques que l'épisode pose sont à relire au texte avec un enseignant de droit des affaires : le recours à l'expert de l'article 1843-4 du Code civil, la validité d'une clause de non-concurrence liée à une cession de titres (limitée dans le temps, l'espace et l'activité, proportionnée à la clientèle cédée) et la rédaction d'un complément de prix. Le traitement fiscal et comptable du complément de prix n'est pas abordé par l'épisode.",
};
