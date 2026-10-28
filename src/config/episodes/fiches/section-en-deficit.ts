/**
 * FICHE ENSEIGNANT · ÉPISODE 87, LA SECTION QUI PLONGE.
 *
 * Le budget d'un EHPAD se lit section par section, chacune avec son
 * financeur : hébergement, soins, dépendance. Le piège est de couper dans
 * les aides-soignants pour combler un déficit qui est dans l'hébergement.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "section-en-deficit",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · P5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Évaluer l'activité de l'organisation",
  ],
  notion:
    "Un EHPAD a trois budgets en un : l'hébergement, payé par le résident ou l'aide sociale au prix de journée arrêté par le département ; les soins, forfait de l'ARS ; la dépendance, forfait du département. Les sections ne se compensent pas, et un excédent de soins est repris par l'ARS. L'erreur classique consiste à lire le déficit global et à couper là où la masse salariale est la plus visible, dans les aides-soignants. Dans l'épisode, l'EHPAD d'Auxonne de l'Association Solvanne (64 places habilitées à l'aide sociale) affiche 310 k€ de déficit à l'ERRD, et le conseil d'administration veut supprimer deux postes d'aides-soignants, 86 k€ par an. La lecture par section montre un hébergement à −338 k€, un soins à +50 k€ et une dépendance à −22 k€ ; les aides-soignants sont imputés au soins et à la dépendance, et l'économie de leur suppression irait au soins, où l'ARS la reprendrait. L'hébergement souffre d'une occupation à 92,5 %, d'un prix de journée de 66,40 € sous le coût de revient, et d'une erreur d'imputation : les trois aides-soignants de nuit, saisis comme « veilleurs », pèsent 129 k€ sur l'hébergement. L'élève découvre qu'on redresse une section par ses propres leviers (imputation corrigée, coupe GMP et PMP préparée, mesure de rattrapage démontrée par le coût de revient, circuit d'admission raccourci), et qu'une économie se juge à la section qui la garde.",
  objectifs: [
    "Je calcule le résultat d'une section tarifaire à partir des journées facturées, du prix de journée et des charges imputées.",
    "J'applique une clé de répartition et je mesure ce qu'une erreur d'imputation déplace d'une section à l'autre.",
    "Je dis, pour une économie proposée, quelle section elle touche et si l'association la garde ou si le financeur la reprend.",
    "Je calcule ce que vaut un point d'occupation pour la section hébergement, une fois payées les charges variables.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de charges directes et indirectes, de clé de répartition, de coût de revient et de charges variables doivent avoir été vues. Les trois sections tarifaires d'un EHPAD, le rôle de l'ARS et du département, l'ERRD et le GMP peuvent être présentés en dix minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/section-en-deficit?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez l'EHPAD (64 places, 310 k€ de déficit, deux postes que le conseil veut supprimer) et vous dessinez au tableau les trois sections et leurs financeurs, sans chiffre. Vous demandez de noter sur papier le résultat de la section hébergement calculé en semaine 1, avec son calcul, et la proposition faite au conseil.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la proposition au conseil (semaine 1), la réponse à la ligne de nuit (semaine 2) et la façon d'aborder la coupe (semaine 4), où la classe se partage. Un binôme qui a fini tôt recalcule les trois sections après correction de la ligne de nuit.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les résultats relevés, puis vous refaites le calcul avec la classe : 21 608 journées à 66,40 €, moins les neuf lignes de charges imputées à l'hébergement. Vous faites expliquer les valeurs éloignées (−310, −209 ou −222 k€). Vous reconstituez ensuite le déficit global (−338 + 50 − 22 = −310 k€) et vous posez la question : sur quelle section pèsent les deux postes que le conseil veut supprimer ?",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 et de la semaine 4. Pour la semaine 2, faites refaire la correction de la ligne de nuit (129 k€ répartis à 70 % sur le soins et 30 % sur la dépendance) et comparez-la à l'option qui passe des agents de service au soins : l'une corrige une erreur, l'autre en crée une. Pour la semaine 4, faites calculer le forfait soins avec la formule de la source (GMP + 2,59 × PMP) × 64 × 10,34 € et rappelez ce que disent les médecins valideurs sur les coupes non préparées.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Lire le budget par section » finit à 129,6 k€ de déficit prévu que l'association garde, coût des mesures compris, contre 386,4 k€ pour « Couper dans les postes » et 386,8 k€ pour « Attentiste » : la coupe préparée a été validée et le département a accordé la mesure de rattrapage. Vous faites lire la coupe sans préparation, qui fait mieux 9 fois sur 30 et perd 22 k€ en moyenne, et l'imputation des agents de service au soins, qui ne fait jamais mieux et perd 106 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la question à poser avant toute économie : quelle section la porte, qui la finance, à qui revient l'économie ? Vous la déclinez par section : à l'hébergement, l'occupation, le prix de journée et les charges propres ; au soins et à la dépendance, des forfaits qui suivent le GMP et le PMP validés. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: -338.2,
    etapes: [
      "Source « Reprendre avec Mihaela Vasilescu le compte de la section hébergement » : 21 608 journées facturées au prix de journée de 66,40 €. Produits de la section : 21 608 × 66,40 = 1 434 771 €, soit 1 434,8 k€.",
      "Même source, les charges imputées à l'hébergement : direction et administration 262 + agents de service 277 + restauration 266 + linge et entretien 94 + bâtiment 468 + énergie 124 + frais de siège 98 + autres charges 55 + personnel de nuit 129 = 1 773 k€.",
      "Résultat de la section hébergement : 1 434,8 − 1 773 = −338,2 k€. Le modèle, qui garde les centaines d'euros que la source arrondit (277,2 k€ d'agents de service, 54,6 k€ d'autres charges), donne −338,03 k€ ; l'épisode juge la prévision juste à 5 k€ près, proche à 20. Le chiffre ne dépend pas du hasard.",
      "Contrôle par les deux autres sections (source « Lire les sections soins et dépendance de l'ERRD ») : soins +50 k€, dépendance −22 k€ ; −338 + 50 − 22 = −310 k€, le déficit global de l'ERRD.",
      "Pour la suite : si les aides-soignants de nuit étaient imputés comme ceux de jour, l'hébergement passerait à −209 k€ ; et la suppression de deux postes d'aides-soignants (86 k€) ne toucherait pas l'hébergement.",
    ],
    erreurs: [
      {
        valeur: -310,
        cause:
          "Le déficit global de l'ERRD pris pour celui de l'hébergement : il additionne trois sections qui ne se compensent pas, dont un soins en excédent.",
      },
      {
        valeur: -209.2,
        cause:
          "La ligne de personnel de nuit (129 k€) retirée d'office parce qu'elle relève du soins : c'est la correction à proposer en semaine 2, pas le résultat de l'ERRD tel qu'il est déposé.",
      },
      {
        valeur: -221.9,
        cause:
          "Les produits calculés sur 64 places × 365 jours (23 360 journées à 66,40 €), comme si l'établissement était plein : seules les 21 608 journées facturées rapportent.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le conseil le demande, la masse salariale est la première charge, et 86 k€ de moins par an se voient tout de suite dans les propositions budgétaires.",
      ceQuiLeDejoue:
        "Le tableau des effectifs donne la règle : les aides-soignants sont imputés à 70 % sur le soins et à 30 % sur la dépendance, et la lecture des sections montre un soins en excédent de 50 k€, que l'ARS reprendra. Le chiffrage de Mihaela Vasilescu le dit : supprimer les postes, c'est 60 k€ au soins, repris sur le forfait, et 26 k€ à la dépendance, rien pour l'hébergement. Ermeline Bichot rappelle qu'elles sont trois la nuit pour 64 résidents. Rejouée sur les trente tirages à la place de la note par section, la suppression perd 59 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Ne plus remplacer les absences économise sans supprimer de poste : personne n'est licencié, et le conseil voit un geste.",
      ceQuiLeDejoue:
        "Les remplacements d'aides-soignants relèvent eux aussi du soins et de la dépendance : l'économie ne touche pas l'hébergement, où est le déficit. Tassadit Truchot prévient qu'au-delà de quelques semaines, ce sont les toilettes et les transmissions qui raccourcissent. Rejoué sur les trente tirages, le gel des remplacements perd 25,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "La section soins est en excédent et l'ARS va le reprendre : autant y imputer une partie des agents de service et soulager l'hébergement de 79 k€.",
      ceQuiLeDejoue:
        "La source sur la répartition des charges de nuit montre que l'excédent de soins n'existe pas : ce sont les aides-soignants de nuit, mal codés, qui pèsent 129 k€ sur l'hébergement. Le CPOM rappelle que toute modification de la répartition doit être justifiée, et Mihaela Vasilescu prévient que les agents de service ne figurent pas dans la règle d'imputation au soins : si l'ARS regarde le détail, elle le verra, et la coupe comme la mesure de rattrapage perdent leur crédit. Rejouée sur les trente tirages à la place de la correction, cette imputation perd 106 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "L'ARS ouvre une enveloppe de crédits non reconductibles : demander à couvrir le déficit, ERRD à l'appui, ne coûte qu'un courrier.",
      ceQuiLeDejoue:
        "La note de l'ARS le précise : ces crédits relèvent de l'assurance maladie et financent la section soins, matériel et prévention des chutes. Ils ne peuvent pas couvrir un déficit d'hébergement, et le courrier attire l'attention sur l'excédent de soins. Le coût de revient de la journée retraitée (72,54 € à 97 % d'occupation, pour un prix de 66,40 €) fonde une demande au département, qui a accordé ailleurs 3 à 4 € de rattrapage. Rejouée sur les trente tirages à la place de la mesure de rattrapage, la demande à l'ARS perd 50 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le bureau redemande la suppression au 1er janvier : 86 k€ de charges en moins, c'est le plus gros chantier sur la table.",
      ceQuiLeDejoue:
        "Le chiffrage des chantiers : les 86 k€ se partagent entre 60 k€ au soins, repris par l'ARS, et 26 k€ à la dépendance. Le linge plat externalisé et l'énergie au groupement d'achat retirent 20 k€ par an à l'hébergement lui-même, pour 2 k€ de mise en place. Rejouée sur les trente tirages à la place de ce chantier, la suppression des postes perd 51 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu trop d'aides-soignants, d'autres des frais de siège trop lourds, d'autres l'hébergement. Qu'est-ce que la lecture des sections soins et dépendance permettait de voir que le déficit global de 310 k€ cachait ?",
    "Supprimer deux postes d'aides-soignants retire 86 k€ de charges. Qui garde cette économie ? Pourquoi une économie dans une section en excédent ne sert-elle à rien à l'association ?",
    "Corriger la ligne de nuit et passer des agents de service au soins font tous deux baisser les charges de l'hébergement. Qu'est-ce qui distingue une correction d'une manipulation de la répartition ?",
    "Une coupe préparée est validée huit à neuf fois sur dix, une coupe non préparée moins d'une fois sur deux. Sur les trente tirages, ne pas la préparer fait mieux 9 fois. Pourquoi reste-t-elle le mauvais choix ?",
    "Un point d'occupation vaut 14 k€ pour l'hébergement, et rien pour le soins ni la dépendance. Pourquoi ? Que rapporte le circuit d'admission raccourci, et que coûte-t-il ?",
    "Sous le tirage n° 12, la coupe a été validée et le département a accordé le rattrapage. Si l'un ou l'autre avait été refusé, la méthode par section aurait-elle été mauvaise ?",
    "Quelle règle présentez-vous au conseil avant toute économie ? Formulez-la en une phrase, avec le mot « section » dedans.",
  ],
  prolongement: {
    enonce:
      "Un EHPAD de 50 places habilitées à l'aide sociale a facturé 17 155 journées l'an dernier au prix de journée de 70 €. Les charges imputées à sa section hébergement s'élèvent à 1 300 k€, dont 100 k€ de deux aides-soignants de nuit codés par erreur en « veilleurs » ; la règle impute les aides-soignants à 70 % sur le soins et à 30 % sur la dépendance. Les charges variables de l'hébergement sont de 7 € par journée. 1) Quel est son taux d'occupation ? 2) Calculez le résultat de la section hébergement. 3) Corrigez l'imputation : que devient l'hébergement, et combien chacune des deux autres sections reçoit-elle de charges en plus ? 4) Que vaut, pour l'hébergement, un point d'occupation de plus sur une année ? 5) Le conseil propose de supprimer un poste d'aide-soignant de jour à 43 k€ : quelle section voit ses charges baisser, et de combien ?",
    corrige:
      "1) 50 × 365 = 18 250 journées possibles ; 17 155 / 18 250 = 94 %. 2) 17 155 × 70 = 1 200 850 € de produits ; 1 200 850 − 1 300 000 = −99 150 €. 3) Sans les 100 k€ de nuit, l'hébergement passe à 1 200 850 − 1 200 000 = +850 € ; le soins reçoit 70 k€ de charges en plus et la dépendance 30 k€. 4) Un point, c'est 182,5 journées ; chacune rapporte 70 − 7 = 63 € de marge, soit 182,5 × 63 ≈ 11 500 € par an. 5) Le soins baisse de 0,7 × 43 = 30,1 k€ et la dépendance de 0,3 × 43 = 12,9 k€ ; l'hébergement ne bouge pas.",
  },
  evaluation: [
    "Le résultat de la section hébergement est calculé juste (21 608 × 66,40 € moins 1 773 k€, environ −338 k€), à partir de la source nommée, et rapproché du déficit global.",
    "Chaque économie proposée est rattachée à sa section et à son financeur, en disant si l'association la garde.",
    "L'erreur d'imputation de la ligne de nuit est corrigée par la règle de répartition, et l'élève refuse une imputation au soins qui n'en relève pas.",
    "Les demandes aux autorités de tarification sont adressées au bon financeur et appuyées sur un calcul (coût de revient de la journée, GMP et PMP préparés).",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La tarification des EHPAD évolue : la fusion des sections soins et dépendance est engagée dans une partie des départements, et l'épisode garde l'organisation en trois sections. L'équation tarifaire du forfait soins, la valeur du point GIR départemental, les règles de reprise des excédents fixées par le CPOM, les crédits non reconductibles et la convention d'habilitation partielle à l'aide sociale sont repris tels que l'épisode les pose : un enseignant de la filière ou un professionnel de la tarification doit les vérifier sur les textes en vigueur avant de les présenter comme des règles. Les clés de répartition (70 % et 30 %) sont celles de l'établissement fictif, pas des clés réglementaires.",
};
