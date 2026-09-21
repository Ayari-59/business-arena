/**
 * LE MANUEL DE L'ENSEIGNANT.
 *
 * La fiche d'une page dit quoi faire pendant la séance ; elle ne dit pas
 * pourquoi l'appli est faite ainsi, ni ce que font les réglages, ni quoi faire
 * quand quelque chose se passe mal. C'est ce manuel-là — celui qu'on lit une
 * fois avant de se lancer, ou qu'on dépose dans un classeur d'établissement.
 *
 * DEUX PARTIS PRIS.
 *
 * Aucune capture d'écran. Une capture vieillit à la première retouche de
 * couleur et personne ne la refait ; le manuel deviendrait alors faux sans que
 * rien ne le signale. On nomme les écrans et les boutons par leur intitulé
 * exact, et les gardes de tests vérifient que ces intitulés existent encore.
 *
 * Aucun chiffre recopié. Le nombre de secteurs, la liste des niveaux, les
 * dimensions de l'IPG et leurs poids, les modes de questions : tout se LIT des
 * registres au moment du rendu, et passe ici en `FaitsDuManuel`. Un scénario
 * ajouté demain apparaît dans le manuel sans qu'on y touche.
 */

export interface Bloc {
  type: "texte" | "liste" | "table" | "encadre";
  /** `texte` et `encadre` : le corps. */
  texte?: string;
  /** `liste` et `table` : l'intitulé du bloc ; `encadre` : son titre. */
  titre?: string;
  items?: string[];
  colonnes?: string[];
  lignes?: string[][];
}

export interface Chapitre {
  id: string;
  titre: string;
  chapeau: string;
  blocs: Bloc[];
}

export interface FaitsDuManuel {
  /** Les scénarios jouables : nom, secteur, accroche. */
  scenarios: { nom: string; secteur: string; accroche: string }[];
  /** Les niveaux, du plus simple au plus complet. */
  niveaux: { rang: number; nom: string; accroche: string; champs: number }[];
  /** Les dimensions de l'IPG et leur poids sur un scénario de référence. */
  dimensions: { nom: string; poids: number }[];
  /** Le scénario dont les poids sont donnés en exemple. */
  scenarioDesPoids: string;
  /** Les modes de questions, avec leur aide. */
  modesDeQuestions: { nom: string; aide: string }[];
  /** Les politiques de situation manquée. */
  situationsManquees: { nom: string; aide: string }[];
  /** Ce que coûte chaque niveau d'indice, en pourcentage du score restant. */
  scoreRestantParIndice: number[];
  /** L'adresse d'entrée des élèves. */
  adresse: string;
}

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

export function manuel(f: FaitsDuManuel): Chapitre[] {
  return [
    {
      id: "principe",
      titre: "Ce que fait cette application",
      chapeau:
        "Un simulateur d'entreprise où l'on n'apprend pas une notion avant de s'en servir, mais parce qu'on en a besoin pour décider.",
      blocs: [
        {
          type: "texte",
          texte:
            "Une partie est une suite de tours. À chaque tour, l'équipe reçoit une situation — un fait de gestion daté, chiffré, qui appelle un arbitrage —, pose un diagnostic, puis prend ses décisions : un prix, un volume, des budgets. La simulation calcule le marché, la production, les comptes, et rend des résultats. L'équipe recommence avec ce qu'elle vient d'apprendre.",
        },
        {
          type: "texte",
          texte:
            "Ce n'est pas un exercice déguisé. L'application ne demande jamais « calculez le besoin en fonds de roulement » : elle met l'équipe devant une trésorerie qui se tend, et la notion arrive quand elle sert. C'est ce qui change la nature du travail, et aussi ce qui le rend exigeant — il n'y a pas de bonne réponse écrite quelque part.",
        },
        {
          type: "encadre",
          titre: "La boucle en une phrase",
          texte:
            "Lire la situation, poser un diagnostic, décider, subir le résultat, comprendre l'écart. C'est l'écart entre ce qu'on attendait et ce qui est arrivé qui enseigne, pas le résultat lui-même — d'où la phrase demandée au premier tour, qui revient au tour suivant en face du constat.",
        },
      ],
    },
    {
      id: "scenarios",
      titre: "Choisir un secteur et un niveau",
      chapeau:
        "Deux décisions à la création, et ce sont les seules qui changent vraiment la séance.",
      blocs: [
        {
          type: "texte",
          texte:
            "Le SECTEUR décide de l'univers : ce qu'on vend, à qui, avec quelles contraintes. Une salle de sport vit d'un portefeuille d'abonnés qu'elle perd lentement ; un bâtiment vit de chantiers et de retards de paiement. Les situations, le courrier et les indicateurs suivent le secteur.",
        },
        {
          type: "table",
          titre: "Les secteurs disponibles",
          colonnes: ["Scénario", "Secteur", "Ce qui s'y joue"],
          lignes: f.scenarios.map((s) => [s.nom, s.secteur, s.accroche]),
        },
        {
          type: "texte",
          texte:
            "Le NIVEAU décide du nombre de leviers ouverts, donc de la charge de travail et du temps d'un tour. Il ne change pas la difficulté du marché : une partie de niveau 1 n'est pas plus facile à gagner, elle demande moins de décisions.",
        },
        {
          type: "table",
          titre: "Les niveaux",
          colonnes: ["Niveau", "Nom", "Champs à remplir", "Ce qu'il ajoute"],
          lignes: f.niveaux.map((n) => [
            String(n.rang),
            n.nom,
            String(n.champs),
            n.accroche,
          ]),
        },
        {
          type: "encadre",
          titre: "Si vous hésitez",
          texte:
            "Niveau 3 pour une première séance : le prix, le volume, la qualité, l'entretien et la finance, sans les ressources humaines ni l'investissement. Trois entreprises sur le marché, rythme trimestriel. Vous monterez d'un niveau à la partie suivante, quand la classe demandera plus de leviers.",
        },
      ],
    },
    {
      id: "entree",
      titre: "Faire entrer la classe",
      chapeau: "Un code, une adresse, et rien à installer sur les postes.",
      blocs: [
        {
          type: "liste",
          titre: "Dans l'ordre",
          items: [
            `Projetez le code : « Projeter pour la classe », panneau « Code d'entrée ». Le code et l'adresse ${f.adresse} s'affichent en grand, et le compte d'élèves connectés monte pendant qu'ils entrent.`,
            "Chaque élève saisit le code et son prénom. Il est placé automatiquement dans l'équipe la moins remplie.",
            "Au premier tour, l'élève peut changer d'équipe lui-même pour rejoindre ses camarades, et l'équipe peut se donner un nom.",
            "Ensuite, c'est vous qui déplacez, depuis « Composition des équipes ». Un élève déplacé après un tour joué emporte le résultat économique de sa nouvelle équipe pour toute la partie : l'écran vous le rappelle.",
          ],
        },
        {
          type: "encadre",
          titre: "Le poste partagé, le cas qui coûte le plus cher",
          texte:
            "L'identité d'un élève tient dans un cookie de son navigateur, valable un an. En salle informatique, le poste passe d'une classe à l'autre : sans précaution, le deuxième élève hérite de l'identité du premier, et les deux ne font plus qu'un seul joueur. L'écran d'entrée affiche le prénom déjà présent et propose « Ce n'est pas moi » : dites-le à la classe une fois, en début de séance. Si l'erreur est passée, vous réparez en déplaçant l'élève dans la bonne équipe.",
        },
      ],
    },
    {
      id: "tour-eleve",
      titre: "Le tour, côté élève",
      chapeau: "Trois étapes guidées, dans l'ordre, et rien d'obligatoire qui ne serve.",
      blocs: [
        {
          type: "liste",
          titre: "Les trois onglets",
          items: [
            "« Situation » — le fait de gestion du tour, chiffré et daté. Tout ce qu'il faut pour décider y est.",
            "« Analyser » — le diagnostic à cocher, le modèle d'analyse à choisir, les questions de connaissances si vous les avez activées.",
            "« Décider » — les champs de décision, répartis en étapes pour qu'on ne fasse jamais défiler quarante champs.",
          ],
        },
        {
          type: "texte",
          texte: `Les INDICES sont à la main de l'élève, cinq niveaux par situation, et chacun coûte une part du score. Le barème laisse ${pourcent(f.scoreRestantParIndice[f.scoreRestantParIndice.length - 1] ?? 0.8)} du score à qui les ouvre tous : chercher seul vaut mieux, demander de l'aide ne disqualifie pas. Le coût s'annonce sur le bouton avant le clic.`,
        },
        {
          type: "texte",
          texte:
            "La JUSTIFICATION est demandée au premier tour seulement : une phrase sur ce que l'équipe attend de ses choix. Elle lui revient au tour suivant, collée au constat. L'exiger à tous les tours en ferait une case à cocher expédiée en deux mots, et une formalité n'enseigne rien.",
        },
        {
          type: "encadre",
          titre: "Ce que vous voyez et qu'ils ne voient pas",
          texte:
            "Le tableau des équipes signale d'une pastille « par défaut » toute équipe qui a validé sans modifier ni le prix ni le volume. C'est la mesure la plus dure du dispositif : une équipe qui valide sans rien toucher n'a pas décidé, elle a cliqué. Si la pastille revient tour après tour, le problème n'est pas dans l'application.",
        },
      ],
    },
    {
      id: "animer",
      titre: "Animer le tour",
      chapeau: "Ce que vous tenez pendant que la classe joue.",
      blocs: [
        {
          type: "liste",
          titre: "Vos quatre gestes",
          items: [
            "PROJETER — « Projeter pour la classe » : le code pendant qu'ils se connectent, l'état des validations pendant le tour, le classement après la clôture. Une chose à la fois, écrite assez grand pour le fond de la salle.",
            "BORNER — « Planning des tours » : une ouverture et une échéance par tour. L'élève voit alors l'heure de fermeture et un décompte dans les dix dernières minutes. Sans bornes, le tour suit votre pilotage manuel.",
            "DISTRIBUER — en mode apprentissage, une carte événement entre deux tours, à toute la classe ou à une entreprise. La liasse s'imprime aussi : un pli se découpe, se plie, et l'élève reçoit une enveloppe qu'il retourne pour lire.",
            "ARBITRER — une équipe en cessation de paiements peut déposer une demande de subvention. C'est le seul geste du jeu qui vous appartienne entièrement : vous accordez, vous refusez, vous fixez le montant.",
          ],
        },
        {
          type: "texte",
          texte:
            "La CLÔTURE est le geste qui fait avancer la partie. L'écran de confirmation dit combien d'équipes ont validé et ce qu'il adviendra des autres : elles reconduisent leurs décisions du tour précédent. L'action est irréversible et la simulation prend une quinzaine de secondes.",
        },
      ],
    },
    {
      id: "resultats",
      titre: "Lire les résultats",
      chapeau: "Un indice composite, un rideau, et un relevé de notes.",
      blocs: [
        {
          type: "texte",
          texte: `L'IPG — indice de performance globale — compose plusieurs dimensions. Une entreprise qui gagne de l'argent en cassant sa trésorerie ne monte pas : c'est tout l'intérêt d'un indice composite sur un jeu de gestion. Les poids ci-dessous sont ceux de ${f.scenarioDesPoids} ; ils se règlent par scénario.`,
        },
        {
          type: "table",
          titre: "Les dimensions de l'IPG",
          colonnes: ["Dimension", "Poids"],
          lignes: f.dimensions.map((d) => [d.nom, pourcent(d.poids)]),
        },
        {
          type: "encadre",
          titre: "Le rideau",
          texte:
            "Le classement est le vôtre tant que vous ne l'avez pas révélé, tour par tour, et il se referme à chaque nouvelle clôture. Les élèves gardent pendant ce temps leurs propres chiffres et leur IPG : c'est leur progression, pas leur place. Sans ce rideau, la classe lit le classement sur son téléphone avant que vous ne le projetiez, et son moment n'existe pas.",
        },
        {
          type: "texte",
          texte:
            "Le RELEVÉ DE NOTES traduit le travail pédagogique en note sur vingt : diagnostics, modèles d'analyse, questions, moins le coût des indices ouverts. Il se lit par équipe et par élève, et s'exporte.",
        },
      ],
    },
    {
      id: "reglages",
      titre: "Les réglages qui changent la séance",
      chapeau: "Trois boutons valent la peine d'être compris avant la première partie.",
      blocs: [
        {
          type: "table",
          titre: "Questions posées dans les situations",
          colonnes: ["Mode", "Ce qu'il fait"],
          lignes: f.modesDeQuestions.map((m) => [m.nom, m.aide]),
        },
        {
          type: "table",
          titre: "Situations manquées",
          colonnes: ["Politique", "Ce qu'elle fait"],
          lignes: f.situationsManquees.map((m) => [m.nom, m.aide]),
        },
        {
          type: "texte",
          texte:
            "Le MONDE VARIABLE, enfin, se choisit à la création : avec lui, la conjoncture bouge d'un tour à l'autre et deux parties du même scénario ne se ressemblent pas. Sans lui, le monde est figé et deux classes vivent exactement la même partie — utile quand on compare des groupes, ou qu'on refait la séance l'année suivante.",
        },
      ],
    },
    {
      id: "apres",
      titre: "Après la séance",
      chapeau: "Trois écrans pour savoir ce qui s'est passé, et ce qu'il faut changer.",
      blocs: [
        {
          type: "liste",
          items: [
            "« Observation de séance » — la participation tour par tour, la part des équipes qui ont validé sans rien changer, le temps médian d'un tour. C'est l'écran de la première fois : il répond à « est-ce qu'ils ont joué ? », pas à « qui gagne ? ».",
            "Le COCKPIT Excel — un classeur d'aide à la décision par équipe : marges par référence, mix, prévisions. À donner aux équipes qui veulent préparer leurs décisions hors séance.",
            "Le DOSSIER d'équipe — le récapitulatif imprimable d'une partie, à distribuer en fin de séquence ou à joindre à un dossier d'examen.",
          ],
        },
        {
          type: "encadre",
          titre: "Le signal à surveiller",
          texte:
            "Une classe qui décroche au troisième tour, c'est une classe. Trois classes qui décrochent au troisième tour, c'est le dispositif. L'observation de séance est faite pour lire la deuxième phrase.",
        },
      ],
    },
    {
      id: "depannage",
      titre: "Quand quelque chose se passe mal",
      chapeau: "Les cas qui arrivent vraiment, et ce qu'on fait.",
      blocs: [
        {
          type: "liste",
          items: [
            "UN ÉLÈVE VOIT LE PRÉNOM D'UN AUTRE — le poste porte encore l'identité du précédent. « Ce n'est pas moi » sur l'écran d'entrée, puis il saisit son code. S'il a déjà joué sous la mauvaise identité, déplacez-le dans la bonne équipe.",
            "UN ÉLÈVE EST DANS LA MAUVAISE ÉQUIPE — « Composition des équipes ». Après un tour joué, il emportera le résultat économique de sa nouvelle équipe pour toute la partie.",
            "UNE ÉQUIPE NE VALIDE PAS — clôturez quand même : elle reconduira ses décisions du tour précédent, et l'écran de confirmation vous le dit avant le clic. Ce n'est pas une sanction, c'est le seul moyen de ne pas bloquer la classe.",
            "L'ÉQUIPE S'ÉCRASE ELLE-MÊME — plusieurs élèves d'une même équipe saisissent en parallèle ; le dernier qui valide remplace le précédent. L'écran affiche qui a validé et à quelle heure : faites-leur désigner une personne qui envoie.",
            "UNE ENTREPRISE EST DÉFAILLANTE — deux tours consécutifs de cessation de paiements. L'activité est gelée et la note financière tombe à zéro. Seule une augmentation de capital qui ramène le découvert sous le plafond la fait repartir ; une subvention accordée par vous peut aussi la sauver.",
            "LA PARTIE S'ARRÊTE AVANT LA FIN — le palier gratuit borne le nombre de tours. L'écran le dit et nomme ce qu'une licence ouvre.",
          ],
        },
      ],
    },
  ];
}
