/**
 * LES DEUX FICHES D'UNE PAGE.
 *
 * Le guide en ligne existe et il est complet, mais une page web ne se
 * distribue pas en salle : l'élève qui ouvre l'appli n'a pas trois onglets,
 * et l'enseignant qui lance sa première séance n'a pas une main libre pour
 * faire défiler. Deux feuilles A4, imprimées depuis la partie elle-même, donc
 * portant SON code, SON scénario, SON niveau.
 *
 * Les textes vivent ici, séparés de la mise en page : ce sont eux qui
 * vieillissent quand l'appli change, et un test peut les tenir.
 *
 * RÈGLE D'ÉCRITURE : chaque ligne décrit un geste que l'appli fait vraiment.
 * Une fiche qui promet un bouton qui n'existe pas coûte plus cher que pas de
 * fiche du tout — l'élève cherche, ne trouve pas, et n'ouvre plus la feuille.
 */

export interface Etape {
  titre: string;
  texte: string;
}

export interface FaitsDeLaPartie {
  /** Le nom du scénario joué (« NOVA · gamme »). */
  scenario: string;
  /** Le nom de l'entreprise du joueur, quand le scénario en impose un. */
  entreprise: string | null;
  /** Le code d'invitation, ou null si la partie n'en a pas. */
  code: string | null;
  /** L'adresse à recopier au tableau. */
  adresse: string;
  /** Le nom du niveau (« Pilotage ») et son rang. */
  niveau: { rang: number; nom: string };
  /** Le nombre de tours et leur nom (« trimestre »). */
  tours: number;
  periode: string;
  /** Champs de décision ouverts par le niveau. */
  champs: number;
  /** Les questions de connaissances sont-elles posées ? */
  avecQuiz: boolean;
  /** Minutes à prévoir pour un tour ordinaire, et pour le premier. */
  minutesTourCourant: number;
  minutesPremierTour: number;
  /** Ce nombre vient-il d'une mesure sur cette partie, ou du modèle ? */
  mesure: boolean;
  /** Nombre d'équipes humaines. */
  equipes: number;
  /**
   * Le premier tour est-il derrière nous ? La fiche enseignant annonce alors
   * une seule durée : rappeler le coût de la prise en main à la quatrième
   * séance n'aide personne.
   */
  premierTourDejaJoue: boolean;
}

/**
 * LA FICHE ÉLÈVE — ce qu'on fait, dans l'ordre, la première fois.
 *
 * Elle s'arrête à la validation du premier tour : au-delà, l'élève a compris
 * la boucle et la feuille ne sert plus. Les deux pièges qu'on ne devine pas
 * sont dits : le poste partagé et l'échéance.
 */
export function etapesEleve(f: FaitsDeLaPartie): Etape[] {
  return [
    {
      titre: "Entrez le code",
      texte: `Ouvrez ${f.adresse} et saisissez le code ${f.code ?? "donné par votre enseignant"}, puis votre prénom. Si un autre prénom que le vôtre s'affiche déjà, cliquez « Ce n'est pas moi » AVANT de saisir : le poste appartient encore à l'élève précédent.`,
    },
    {
      titre: "Trouvez votre équipe",
      texte: `Vous êtes placé automatiquement dans l'équipe la moins remplie. Au premier tour, vous pouvez en changer vous-même pour rejoindre vos camarades, et votre équipe peut se donner un nom. Ensuite, c'est l'enseignant qui déplace.`,
    },
    {
      titre: "Lisez la situation",
      texte: `Onglet « Situation » : l'entreprise${f.entreprise ? ` — ${f.entreprise} —` : ""} vous met devant un cas réel. Lisez-le en entier avant de toucher à quoi que ce soit : tout ce qu'il faut pour décider y est, et rien n'y est décoratif.`,
    },
    {
      titre: "Analysez avant de décider",
      texte: f.avecQuiz
        ? `Onglet « Analyser » : cochez votre diagnostic, choisissez le modèle d'analyse qui convient, répondez aux questions. Les indices existent et coûtent des points — cinq indices laissent tout de même 80 % du score. Chercher d'abord vaut mieux ; demander de l'aide ne disqualifie pas.`
        : `Onglet « Analyser » : cochez le diagnostic qui vous paraît juste et choisissez le modèle d'analyse qui convient. Les indices existent et coûtent des points — cinq indices laissent tout de même 80 % du score.`,
    },
    {
      titre: "Décidez",
      texte: `Onglet « Décider » : ${f.champs} champs répartis en étapes. Chaque champ arrive avec une valeur proposée — la reconduire sans y toucher, c'est ne pas décider, et l'enseignant le voit. Votre saisie est gardée au fur et à mesure : un onglet fermé par erreur ne coûte rien.`,
    },
    {
      titre: "Écrivez ce que vous attendez",
      texte: `Au premier tour, une phrase est demandée : ce que vous attendez de ces choix. Elle vous reviendra au tour suivant, en face du résultat. C'est la comparaison entre les deux qui apprend quelque chose, pas la phrase.`,
    },
    {
      titre: "Validez avant l'échéance",
      texte: `Le bouton « Valider » envoie les décisions de toute l'équipe. Vous pouvez les modifier jusqu'à la clôture du tour par l'enseignant, et l'écran vous dit qui a validé et à quelle heure. Après l'échéance, plus rien n'est accepté : validez, quitte à revenir corriger.`,
    },
  ];
}

/**
 * LA FICHE ENSEIGNANT — le déroulé d'une séance, dans l'ordre où il se joue.
 *
 * Elle ne répète pas les réglages (ils sont dans la page de partie, avec leur
 * aide) : elle dit ce qu'on fait, quand, et depuis quel écran.
 */
export function etapesEnseignant(f: FaitsDeLaPartie): Etape[] {
  const tour = f.mesure ? `environ ${f.minutesTourCourant} min (mesuré chez vous)` : `environ ${f.minutesTourCourant} min`;
  return [
    {
      titre: "Avant la séance",
      texte: `Vérifiez le niveau (${f.niveau.rang} · ${f.niveau.nom}, ${f.champs} décisions ouvertes) et le nombre de tours (${f.tours}). Si vous voulez borner le temps, posez les fenêtres dans « Planning des tours » : l'élève verra alors l'heure de fermeture et un décompte. Imprimez cette fiche et la fiche élève.`,
    },
    {
      titre: "Les cinq premières minutes",
      texte: `Ouvrez « Projeter pour la classe » et laissez le panneau « Code d'entrée » au mur : le code${f.code ? ` ${f.code}` : ""} et l'adresse ${f.adresse} en grand, avec le compte d'élèves connectés qui monte. Vous savez quand tout le monde est entré sans demander.`,
    },
    {
      titre: "Pendant le tour",
      texte: `Passez le panneau projeté sur « Ce tour » : le compte de validations et le nom de chaque équipe, verte ou en attente. Comptez ${f.premierTourDejaJoue ? tour : `${f.minutesPremierTour} min pour le premier tour et ${tour} pour les suivants`}. Les équipes qui traînent se voient au mur, sans que vous ayez à circuler.`,
    },
    {
      titre: "Le courrier (mode apprentissage)",
      texte: `Entre deux tours, distribuez une carte événement depuis « Animer ». La liasse s'imprime aussi : chaque pli se découpe et se plie, l'élève reçoit une enveloppe qu'il retourne pour lire. C'est ce qui fait entrer le hasard du marché dans la salle.`,
    },
    {
      titre: "La clôture",
      texte: `« Clore le tour et simuler » : l'écran dit combien d'équipes ont validé et ce que feront les autres — elles reconduisent leurs décisions du tour précédent. Le geste est irréversible et la simulation prend une quinzaine de secondes.`,
    },
    {
      titre: "Le débriefing",
      texte: `Le classement reste le vôtre tant que vous ne l'avez pas révélé : les équipes voient leurs propres chiffres, pas leur place. Révélez-le, projetez le panneau « Classement », et partez des justifications écrites avant le résultat — elles sont dans le tableau des équipes, sous chaque validation.`,
    },
    {
      titre: "Après la séance",
      texte: `« Observation de séance » répond à la question qui compte à la première utilisation : est-ce qu'ils ont joué ? Participation tour par tour, part des équipes qui ont validé sans rien changer, temps médian. Le relevé de notes, lui, est dans « Lire ».`,
    },
  ];
}
