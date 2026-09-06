import type { AtelierDefinition } from "./types";

/**
 * ATELIER PROFESSIONNEL · DCG — RSE & PERFORMANCE.
 *
 * Six séances de trois heures sur NOVA, au niveau qui ouvre le financement,
 * l'investissement et l'engagement RSE. L'atelier ne fait pas un cours de
 * morale : il met l'élève devant l'ARBITRAGE que la RSE impose vraiment, celui
 * qu'aucun sujet ne fait éprouver puisqu'il donne les conséquences. L'équipe
 * dépense pour son image, son sourcing, son process propre ; elle paie tout de
 * suite, et découvre plus tard, ou pas, le retour : demande, conditions
 * bancaires, climat social, cartes de réputation. La dernière séance rend
 * compte par une déclaration de performance extra-financière simplifiée.
 *
 * RATTACHEMENT AU PROGRAMME, PRUDENT : le programme réformé du DCG inscrit la
 * durabilité dans plusieurs unités (c'est ce que dit la source du référentiel
 * lu sur le texte). On cite donc les UNITÉS mobilisées, telles que le programme
 * les intitule, sans prêter à l'arrêté un intitulé de compétence précis sur la
 * RSE que nous n'avons pas confronté au texte. La mention reste au niveau de
 * l'unité, pas de la compétence.
 */
export const ATELIER_DCG_RSE: AtelierDefinition = {
  code: "dcg-rse",
  titre: "RSE et performance : un engagement qui se pilote",
  diplome: "DCG",
  annee: "Deuxième ou troisième année",
  nature: "Atelier professionnel",
  traceLabel: "passeport professionnel",
  referentielLabel: "Unités d'enseignement",
  referentielAccord: "mobilisées",
  pitch:
    "Six séances de trois heures. Chaque équipe dirige la même entreprise industrielle et y engage une politique RSE : elle dépense pour son image, choisit ses fournisseurs, investit dans un process plus propre, puis mesure tour après tour ce que cet engagement lui rapporte, ou lui coûte. La dernière séance produit une déclaration de performance extra-financière soutenue devant un jury.",
  resume:
    "Cinq trimestres pour transformer un engagement RSE en performance, du premier arbitrage budgétaire à la déclaration extra-financière soutenue.",
  difficulte: 4,
  difficulteLabel: "Avancé",
  format: "6 séances de 3 h",
  pourquoi:
    "Un sujet d'examen présente la RSE comme un chapitre : on définit, on classe les trois piliers, on récite les obligations de reporting. L'élève apprend le vocabulaire sans jamais rencontrer la seule question qui rend la RSE difficile à gérer : elle coûte maintenant et rapporte plus tard, quand elle rapporte. Ici l'équipe décide elle-même du montant qu'elle engage, le paie sur sa marge du trimestre, et découvre aux tours suivants un capital d'image qui monte lentement, un financement qui se détend, un climat social qui se tient, ou au contraire un bad buzz et une sanction quand l'engagement reste tiède. Elle apprend alors ce qu'aucune récitation ne transmet : que la responsabilité est un investissement à horizon, qu'elle peut être un mauvais calcul à court terme, et qu'un rapport extra-financier n'a de valeur que s'il rend compte de décisions réellement prises.",
  reglages: {
    scenarioCode: "nova",
    periodicite: "quarter",
    periodiciteLabel: "Un trimestre par tour",
    niveau: 5,
    niveauNom: "Stratégie",
    equipes: 5,
    bots: 2,
    tva: true,
    mondeVariable: true,
    quizMode: "Modèle d'analyse seul",
    tours: 5,
    effectifParEquipe: "trois élèves",
    notes:
      "NOVA porte un cycle d'exploitation complet, des fournisseurs, de la non-qualité et une capacité qui s'investit : de quoi rendre la RSE tangible plutôt que déclarative. Le niveau Stratégie ouvre le financement, l'investissement et l'engagement RSE, c'est-à-dire les leviers de l'atelier. Le monde variable est activé : à ce niveau, distinguer une bonne décision d'un bon résultat fait partie de ce qui s'évalue, et la RSE en est l'illustration la plus nette, puisqu'un engagement juste peut ne pas payer sur cinq tours. La cinquième séance joue le dernier tour ; la sixième ne joue rien et sert à rendre compte.",
  },
  seances: [
    {
      numero: 1,
      titre: "Mesurer avant d'agir : diagnostic RSE d'ouverture",
      dureeMinutes: 180,
      tourJoue: 1,
      processus: ["UE7 · Management des organisations", "UE11 · Contrôle de gestion"],
      objectif:
        "Lire l'indice RSE d'une entreprise et ses trois piliers, situer sa marge de manœuvre, et engager un premier budget en sachant qu'il pèse sur le résultat du trimestre.",
      competences: [
        "Je lis un indice extra-financier et j'explique ce que mesure chacun de ses trois piliers.",
        "Je relie une décision de gestion à son empreinte environnementale, sociale ou de gouvernance.",
        "Je justifie un premier montant d'engagement en le confrontant à la marge qu'il ampute.",
      ],
      notions: [
        "responsabilité sociétale des entreprises",
        "piliers environnement, social, gouvernance",
        "indicateur extra-financier",
        "arbitrage coût immédiat et bénéfice différé",
      ],
      preparation:
        "Créez la partie avec les réglages ci-dessus et notez le code d'invitation. Constituez des équipes de trois élèves. Préparez une trame de note de diagnostic RSE en deux pages, et annoncez d'emblée que l'engagement se paie dans le trimestre alors que son retour, s'il vient, se lira plus tard.",
      deroule: [
        { minutes: 20, titre: "Consignes et cadrage", detail: "Présentation de l'entreprise, des trois piliers et de la règle du jeu : la RSE coûte maintenant, rapporte plus tard." },
        { minutes: 40, titre: "Diagnostic RSE d'ouverture", detail: "Chaque équipe lit l'indice et ses piliers, repère le pilier le plus faible et formule une priorité." },
        { minutes: 45, titre: "Premières décisions", detail: "L'équipe fixe son budget d'engagement et ses décisions courantes, puis dépose son plan pour le trimestre." },
        { minutes: 45, titre: "Clôture et lecture des résultats", detail: "Le tour est clos ; l'équipe lit l'effet du budget sur sa marge et note que la demande n'a pas encore bougé." },
        { minutes: 30, titre: "Note de diagnostic", detail: "Rédaction de la note à deux pages : état des lieux ESG et priorité retenue, argumentée." },
      ],
      livrable:
        "Une note de diagnostic RSE de deux pages : lecture de l'indice et des trois piliers, priorité retenue et premier engagement chiffré, justifié face à la marge.",
      tracePasseport:
        "J'ai établi le diagnostic extra-financier d'une entreprise et engagé une première dépense RSE en assumant son coût immédiat.",
      evaluation: [
        "La lecture des trois piliers est exacte et hiérarchisée.",
        "L'engagement chiffré est relié à la marge qu'il ampute.",
        "La priorité retenue est argumentée, pas décrétée.",
      ],
    },
    {
      numero: 2,
      titre: "L'arbitrage inter-temporel : le capital d'image",
      dureeMinutes: 180,
      tourJoue: 2,
      processus: ["UE7 · Management des organisations", "UE6 · Finance d'entreprise"],
      objectif:
        "Comprendre qu'un engagement soutenu bâtit un capital d'image qui relève la demande aux tours suivants, à l'inverse d'un budget marketing qui agit vite et s'éteint vite.",
      competences: [
        "Je distingue une dépense qui agit dans le trimestre d'un engagement qui se capitalise dans la durée.",
        "Je lis l'effet différé d'un capital d'image sur la part de marché.",
        "Je décide de maintenir ou d'ajuster un engagement en raisonnant sur l'horizon de la partie.",
      ],
      notions: [
        "capital de marque",
        "effet différé",
        "inertie d'un stock",
        "horizon de décision",
      ],
      preparation:
        "Relevez pour chaque équipe l'engagement du tour précédent et l'évolution de sa part de marché. Préparez au tableau la comparaison entre l'effet du marketing, immédiat, et celui de l'image, lent.",
      deroule: [
        { minutes: 20, titre: "Retour sur le tour précédent", detail: "Lecture collective : qui a engagé, qui a vu sa demande bouger, et pourquoi le retour se fait attendre." },
        { minutes: 30, titre: "Le capital qui se construit", detail: "Explication du capital d'image : un stock lissé qui monte lentement et retombe si on cesse d'entretenir." },
        { minutes: 50, titre: "Décisions du trimestre", detail: "L'équipe arbitre entre marketing et engagement RSE selon l'horizon restant, puis dépose son plan." },
        { minutes: 45, titre: "Clôture et analyse", detail: "Le tour est clos ; l'équipe mesure le premier effet de l'image sur sa part et le compare à celui du marketing." },
        { minutes: 35, titre: "Fiche d'analyse", detail: "Rédaction d'une fiche opposant les deux leviers sur le rythme et la persistance de leur effet." },
      ],
      livrable:
        "Une fiche d'analyse qui oppose marketing et engagement RSE sur deux critères, la vitesse de l'effet et sa persistance, chiffres de la partie à l'appui.",
      tracePasseport:
        "J'ai distingué une dépense à effet immédiat d'un engagement qui se capitalise, et j'ai arbitré selon l'horizon.",
      evaluation: [
        "La distinction entre effet immédiat et effet différé est juste.",
        "L'analyse s'appuie sur les chiffres réels de la partie.",
        "La décision tient compte de l'horizon restant.",
      ],
    },
    {
      numero: 3,
      titre: "Sourcing responsable et investissement propre",
      dureeMinutes: 180,
      tourJoue: 3,
      processus: ["UE11 · Contrôle de gestion", "UE7 · Management des organisations"],
      objectif:
        "Piloter l'empreinte par le choix du fournisseur et l'investissement dans un process propre, et lire l'effet durable de cet investissement sur les rebuts.",
      competences: [
        "Je choisis un fournisseur en pesant son coût, sa qualité et l'empreinte qu'il porte.",
        "Je décide d'un investissement propre en comparant son décaissement immédiat à la baisse durable des rebuts.",
        "Je suis l'évolution du taux de rebuts et je l'impute aux décisions qui l'ont fait bouger.",
      ],
      notions: [
        "coûts de la non-qualité",
        "sourcing responsable",
        "investissement et amortissement de l'effet",
        "intensité de l'empreinte",
      ],
      preparation:
        "Préparez le tableau comparatif des fournisseurs du scénario, coût et qualité. Rappelez que l'investissement propre se paie dans le trimestre mais que sa baisse de rebuts se prolonge sur les suivants.",
      deroule: [
        { minutes: 20, titre: "Le coût caché de la non-qualité", detail: "Rappel : un rebut est payé en matières et en main-d'œuvre mais invendable ; le réduire libère de la marge." },
        { minutes: 30, titre: "Comparaison des fournisseurs", detail: "Les équipes confrontent coût, qualité et empreinte, et choisissent en connaissance de cause." },
        { minutes: 50, titre: "Décisions du trimestre", detail: "Arbitrage entre fournisseur et investissement propre, puis dépôt du plan." },
        { minutes: 45, titre: "Clôture et lecture des rebuts", detail: "Le tour est clos ; l'équipe lit la baisse des rebuts et la relie à son investissement." },
        { minutes: 35, titre: "Fiche de pilotage", detail: "Rédaction d'une fiche reliant les décisions de sourcing et d'investissement à l'empreinte et à la marge." },
      ],
      livrable:
        "Une fiche de pilotage de l'empreinte : le choix de fournisseur et l'investissement propre du trimestre, leur coût, et leur effet lu sur le taux de rebuts et la marge.",
      tracePasseport:
        "J'ai piloté l'empreinte d'une entreprise par son sourcing et un investissement propre, et j'en ai mesuré l'effet durable.",
      evaluation: [
        "Le choix de fournisseur pèse les trois critères sans en oublier.",
        "L'investissement propre est justifié par son effet durable, pas par principe.",
        "L'effet sur les rebuts est chiffré et correctement imputé.",
      ],
    },
    {
      numero: 4,
      titre: "Financement vert et climat social",
      dureeMinutes: 180,
      tourJoue: 4,
      processus: ["UE6 · Finance d'entreprise", "UE7 · Management des organisations"],
      objectif:
        "Constater qu'un standing RSE établi détend les conditions bancaires et retient les salariés, et intégrer ces retours dans le pilotage financier et social.",
      competences: [
        "Je relie un capital d'image à la confiance de la banque et à des conditions de découvert plus favorables.",
        "Je relie un engagement social à un turnover réduit et aux coûts de recrutement évités.",
        "J'intègre ces retours différés dans un plan de financement et une politique d'effectif.",
      ],
      notions: [
        "financement vert",
        "confiance bancaire et découvert",
        "climat social et turnover",
        "coûts de recrutement évités",
      ],
      preparation:
        "Relevez pour chaque équipe les conditions de découvert obtenues et les mouvements d'effectif des tours passés. Préparez la lecture du lien entre standing RSE, banque et rétention du personnel.",
      deroule: [
        { minutes: 20, titre: "Retour sur les conditions obtenues", detail: "Lecture : à engagement comparable, qui a obtenu un découvert plus large ou un taux plus doux." },
        { minutes: 30, titre: "Le standing change les conditions", detail: "Explication : l'image rassure la banque, et un employeur engagé perd moins de salariés quand le salaire glisse." },
        { minutes: 50, titre: "Décisions du trimestre", detail: "L'équipe cale son financement et sa politique d'effectif en tenant compte de ces retours, puis dépose son plan." },
        { minutes: 45, titre: "Clôture et analyse", detail: "Le tour est clos ; l'équipe lit l'effet du standing sur ses charges financières et ses départs." },
        { minutes: 35, titre: "Note financière et sociale", detail: "Rédaction d'une note reliant le standing RSE aux conditions bancaires et à la rétention du personnel." },
      ],
      livrable:
        "Une note financière et sociale : le lien entre le standing RSE et les conditions de financement obtenues, l'effet sur le climat social et les départs évités, et l'intégration de ces retours dans le plan du trimestre.",
      tracePasseport:
        "J'ai intégré les retours d'un engagement RSE sur le financement et le climat social dans le pilotage de l'entreprise.",
      evaluation: [
        "Le lien entre standing et conditions bancaires est établi sur les chiffres.",
        "L'effet social est distingué d'une simple politique salariale.",
        "Les retours différés sont intégrés au plan, pas seulement constatés.",
      ],
    },
    {
      numero: 5,
      titre: "Le monde réagit : label, réputation et sanction",
      dureeMinutes: 180,
      tourJoue: 5,
      processus: ["UE7 · Management des organisations", "UE5 · Économie contemporaine"],
      objectif:
        "Affronter les cartes qui matérialisent la réaction des parties prenantes, du label qui récompense un engagement mûr au bad buzz et à la sanction qui frappent un engagement tiède.",
      competences: [
        "J'anticipe une réaction des parties prenantes à partir du standing RSE atteint.",
        "Je distingue un risque de réputation d'un risque financier et j'estime la portée de chacun.",
        "Je décide en dernier tour en tenant compte du risque autant que du rendement.",
      ],
      notions: [
        "parties prenantes",
        "risque de réputation",
        "risque de sanction",
        "asymétrie du risque et du rendement",
      ],
      preparation:
        "Préparez la présentation des quatre cartes RSE et de leurs déclencheurs. Rappelez qu'un engagement tiède, ni nul ni mûr, est le plus exposé, et qu'un capital nul ne déclenche rien.",
      deroule: [
        { minutes: 20, titre: "Les parties prenantes réagissent", detail: "Présentation des cartes : label, éco-subvention, bad buzz, sanction, et de ce qui les déclenche." },
        { minutes: 30, titre: "Où en est mon standing", detail: "Chaque équipe situe son capital et estime le risque ou la récompense qu'elle encourt au dernier tour." },
        { minutes: 50, titre: "Décisions du dernier tour", detail: "L'équipe arbitre une dernière fois entre rendement immédiat et risque de réputation, puis dépose son plan." },
        { minutes: 45, titre: "Clôture et cartes tirées", detail: "Le tour est clos ; les cartes tombent, et chaque équipe lit l'effet sur sa demande ou sa trésorerie." },
        { minutes: 35, titre: "Fiche de risque", detail: "Rédaction d'une fiche qui relie le standing atteint aux cartes rencontrées et à leur effet chiffré." },
      ],
      livrable:
        "Une fiche de risque extra-financier : le standing atteint, les cartes rencontrées, et leur effet chiffré sur la demande ou la trésorerie, avec ce que l'équipe aurait pu faire autrement.",
      tracePasseport:
        "J'ai anticipé la réaction des parties prenantes à un standing RSE et distingué le risque de réputation du risque financier.",
      evaluation: [
        "Le risque est anticipé à partir du standing, pas subi après coup.",
        "Réputation et sanction financière sont distinguées et estimées.",
        "La décision de dernier tour pèse le risque autant que le rendement.",
      ],
    },
    {
      numero: 6,
      titre: "Rendre compte : la déclaration de performance extra-financière",
      dureeMinutes: 180,
      tourJoue: null,
      processus: ["UE11 · Contrôle de gestion", "UE13 · Communication professionnelle"],
      objectif:
        "Consolider les cinq trimestres en une déclaration de performance extra-financière simplifiée, et la soutenir devant un jury en assumant les arbitrages faits.",
      competences: [
        "Je consolide des indicateurs extra-financiers sur plusieurs exercices en une synthèse lisible.",
        "Je commente une trajectoire ESG et une empreinte en distinguant la mesure de l'engagement qui l'a produite.",
        "Je soutiens un rapport et je réponds aux objections d'un jury sans esquiver les arbitrages perdants.",
      ],
      notions: [
        "déclaration de performance extra-financière",
        "consolidation pluriannuelle",
        "trajectoire et tendance",
        "reddition de comptes",
      ],
      preparation:
        "Préparez la grille de soutenance et rappelez que la synthèse extra-financière du produit est indicative et non normée : elle sert de support, l'analyse reste le travail de l'équipe. Prévoyez l'ordre de passage des équipes.",
      deroule: [
        { minutes: 20, titre: "Cadre de la reddition", detail: "Rappel de ce qu'est une déclaration extra-financière et de ce que le jury attend : des faits, une trajectoire, des arbitrages assumés." },
        { minutes: 70, titre: "Rédaction de la déclaration", detail: "Les équipes consolident leur trajectoire ESG, leur empreinte et leurs faits marquants en une synthèse argumentée." },
        { minutes: 70, titre: "Soutenances devant le jury", detail: "Chaque équipe présente sa déclaration et répond aux questions ; le jury sonde les arbitrages, y compris ceux qui n'ont pas payé." },
        { minutes: 20, titre: "Bilan collectif", detail: "Retour transversal : ce que la RSE a coûté, ce qu'elle a rapporté, et à quel horizon, d'une équipe à l'autre." },
      ],
      livrable:
        "Une déclaration de performance extra-financière de quatre pages, consolidant la trajectoire ESG, l'empreinte et les faits marquants des cinq trimestres, soutenue devant un jury.",
      tracePasseport:
        "J'ai rédigé et soutenu une déclaration de performance extra-financière consolidant cinq trimestres d'engagement RSE.",
      evaluation: [
        "La consolidation est exacte et lisible sur les cinq trimestres.",
        "La trajectoire est commentée en distinguant mesure et engagement.",
        "La soutenance assume les arbitrages, y compris les perdants.",
      ],
    },
  ],
  formats: [
    {
      nom: "Hebdomadaire",
      quand: "Une séance par semaine sur six semaines",
      comment:
        "Le rythme naturel de l'atelier : un trimestre par séance, la reddition en dernière semaine. Chaque équipe garde la main sur sa partie entre deux séances si l'enseignant le décide.",
    },
    {
      nom: "Semaine bloquée",
      quand: "Six demi-journées sur une semaine",
      comment:
        "Les cinq trimestres s'enchaînent du lundi au vendredi, la soutenance en fin de semaine. La tension de l'arbitrage se ressent mieux resserrée, au prix d'un temps de recul plus court entre les tours.",
    },
    {
      nom: "Fil rouge annuel",
      quand: "Une séance par mois d'octobre à mars",
      comment:
        "L'atelier accompagne le cours de finance et de contrôle de gestion sur un semestre : chaque séance illustre la notion vue en cours le mois même, la reddition clôt le semestre.",
    },
  ],
  evaluationFinale: [
    "La déclaration extra-financière consolide fidèlement les cinq trimestres et se lit sans le produit sous les yeux.",
    "L'équipe distingue partout la mesure de l'engagement qui l'a produite, et n'attribue pas à la RSE ce qui revient au marché.",
    "La soutenance assume les arbitrages, y compris ceux qui n'ont pas payé sur l'horizon de la partie.",
    "Les traces de passeport des six séances forment un parcours cohérent, du diagnostic à la reddition.",
  ],
  prolongements: [
    "Rejouer une partie avec un horizon plus long pour voir si des arbitrages RSE perdants sur cinq tours deviennent gagnants sur huit.",
    "Confronter la déclaration produite aux exigences réelles d'un cadre de reporting extra-financier, pour mesurer l'écart entre la synthèse indicative du jeu et une norme.",
    "Faire régler par l'enseignant les paramètres RSE de la partie, puis observer comment l'arbitrage se déplace quand l'effet image ou la sanction changent d'ampleur.",
  ],
  faq: [
    {
      question: "Faut-il avoir traité la RSE en cours avant l'atelier ?",
      reponse:
        "Non. L'atelier peut ouvrir le sujet : la première séance pose les trois piliers et l'indice, et le reste se découvre en jouant. Il gagne toutefois à venir après une première approche du reporting extra-financier, que la dernière séance vient alors incarner.",
    },
    {
      question: "La synthèse extra-financière du jeu est-elle une vraie DPEF ?",
      reponse:
        "Non, et l'atelier le dit aux élèves. La synthèse du produit est indicative et simplifiée, l'empreinte carbone y est un proxy pédagogique et non une comptabilité carbone. Elle sert de support à la reddition ; le travail d'analyse et de mise en forme reste celui de l'équipe.",
    },
    {
      question: "Que faire si une équipe n'engage jamais la RSE ?",
      reponse:
        "C'est un choix de gestion légitime, et l'atelier le laisse ouvert : sans engagement, une équipe ne décroche ni label ni sanction, et son rapport le constate. Le débriefing compare alors sa performance financière à celle des équipes engagées, sur l'horizon de la partie.",
    },
    {
      question: "Cinq tours suffisent-ils pour que la RSE paie ?",
      reponse:
        "Pas toujours, et c'est voulu. L'effet de l'image met plusieurs tours à se construire ; sur cinq trimestres, un engagement tardif peut rester un mauvais calcul. Le prolongement sur un horizon plus long permet précisément d'en discuter.",
    },
    {
      question: "Le monde variable ne rend-il pas l'évaluation injuste ?",
      reponse:
        "Il la rend plus juste, à ce niveau. La distinction entre une bonne décision et un bon résultat est au cœur de l'atelier : une équipe peut avoir raison et voir un aléa effacer son retour. La soutenance évalue la qualité des arbitrages, pas la seule chance du tirage.",
    },
  ],
};
