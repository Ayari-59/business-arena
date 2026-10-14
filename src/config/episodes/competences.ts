/**
 * LE RÉFÉRENTIEL : dix compétences de décision, et ce que chaque décision observe.
 *
 * Une compétence n'est gardée que si les épisodes peuvent l'observer :
 * soit une trace de la partie la mesure directement (les sources consultées,
 * le diagnostic, sa réévaluation, les réflexes, la prévision), soit elle est
 * la compétence principale d'au moins cinq décisions, dans plusieurs épisodes.
 *
 * Chaque décision des épisodes a UNE compétence principale, celle que
 * la décision départage le mieux, et des compétences secondaires qu'elle
 * touche aussi. On observe des décisions, jamais une personne : aucune
 * compétence ne parle de personnalité, de style ou de potentiel.
 *
 * L'étiquetage est un jugement d'auteur, fait en une seule lecture : il doit
 * être revu par d'autres praticiens avant qu'un score soit montré à quiconque.
 */

export type CodeCompetence = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8" | "R9" | "R10";

/** Les traces : ce qu'une partie mesure directement, par une règle écrite. */
export type CodeTrace = "information" | "diagnostic" | "revision" | "reflexes" | "calibrage";

export interface Competence {
  code: CodeCompetence;
  nom: string;
  definition: string;
  /** Ce qu'on voit faire, dans les choix de la partie. */
  comportement: string;
  /** La trace qui la mesure directement, s'il y en a une. */
  trace: CodeTrace | null;
  /** Peut-elle recevoir un score ? Non quand rien ne la mesure assez souvent. */
  score: boolean;
  /** Ce que la mesure ne dit pas, à écrire à côté de chaque score. */
  limite: string;
}

export const COMPETENCES: readonly Competence[] = [
  {
    code: "R1",
    nom: "S'informer avant d'agir",
    definition: "Aller chercher l'information qui explique la situation avant de trancher.",
    comportement:
      "Consulte les sources décisives, évite le bruit, n'attend pas au-delà du raisonnable.",
    trace: "information",
    score: true,
    limite: "Consulter une information n'est pas s'en servir. En Expert, l'accès est limité.",
  },
  {
    code: "R2",
    nom: "Diagnostiquer la cause",
    definition: "Distinguer la cause du symptôme.",
    comportement: "Retient le bon problème principal, traite la cause plutôt que l'effet.",
    trace: "diagnostic",
    score: true,
    limite: "Un diagnostic à quatre choix se devine une fois sur quatre.",
  },
  {
    code: "R3",
    nom: "Réviser son jugement",
    definition: "Changer d'avis quand un fait le contredit, le garder quand il le confirme.",
    comportement: "Corrige un diagnostic faux, maintient un diagnostic juste.",
    trace: "revision",
    score: true,
    limite: "Seul un diagnostic d'abord faux met vraiment la révision à l'épreuve.",
  },
  {
    code: "R4",
    nom: "Éviter la réponse réflexe",
    definition:
      "Ne pas répondre à la pression par le geste attendu : la remise, les heures supplémentaires, la sanction.",
    comportement: "Choisit rarement les options réflexes.",
    trace: "reflexes",
    score: true,
    limite: "Les listes de réflexes sont écrites par les auteurs des épisodes.",
  },
  {
    code: "R5",
    nom: "Arbitrer sous incertitude",
    definition:
      "Choisir entre des options qui ont chacune un coût, en pesant la moyenne et le pire cas.",
    comportement:
      "Choisit l'option de meilleure espérance, ou une option plus sûre à un coût modéré.",
    trace: null,
    score: true,
    limite: "Dépend du calibrage des modèles des épisodes.",
  },
  {
    code: "R6",
    nom: "Anticiper les effets différés",
    definition: "Voir ce qu'une décision déclenche dans trois semaines.",
    comportement:
      "Choisit l'option dont le bénéfice vient plus tard plutôt que le soulagement immédiat.",
    trace: null,
    score: true,
    limite: "Se confond parfois avec l'arbitrage.",
  },
  {
    code: "R7",
    nom: "Calibrer ses prévisions",
    definition: "Estimer juste, et savoir à quel point on est sûr.",
    comportement: "Prévision proche du réel, confiance en rapport avec la justesse.",
    trace: "calibrage",
    score: false,
    limite: "Une seule prévision par partie, sur des échelles différentes : pas encore de score.",
  },
  {
    code: "R8",
    nom: "Préserver la capacité de l'équipe",
    definition: "Retirer du travail plutôt qu'en demander plus, déléguer, protéger la charge.",
    comportement:
      "Évite les heures supplémentaires et la pression, répartit, délègue avec un cadre.",
    trace: null,
    score: true,
    limite: "Proche de l'engagement des personnes dans plusieurs décisions.",
  },
  {
    code: "R9",
    nom: "Engager les personnes",
    definition: "Traiter un cas individuel ou faire adhérer un groupe sans imposer ni céder.",
    comportement: "Reçoit, écoute, confie une mission, associe aux décisions.",
    trace: null,
    score: true,
    limite: "Observée par des choix, pas par la conduite d'un entretien.",
  },
  {
    code: "R10",
    nom: "Piloter par les faits, et les dire",
    definition: "Mesurer ce qui compte et dire tôt ce que les chiffres montrent.",
    comportement: "Choisit le bon indicateur, refuse de maquiller, annonce le dépassement.",
    trace: null,
    score: true,
    limite: "Regroupe deux idées, mesurer et communiquer, qui pourraient diverger.",
  },
];

export const competenceParCode = (code: CodeCompetence): Competence =>
  COMPETENCES.find((c) => c.code === code)!;

export interface Etiquette {
  /** La compétence que la décision départage le mieux. */
  principale: CodeCompetence;
  /** Celles qu'elle touche aussi ; elles comptent moitié moins. */
  secondaires: readonly CodeCompetence[];
}

/**
 * Les six décisions de chaque épisode, dans l'ordre de ses étapes.
 * Le titre de l'étape est rappelé en commentaire.
 */
export const ETIQUETTES: Readonly<Record<string, readonly Etiquette[]>> = {
  // 1. Le trimestre qui dérape
  "trimestre-qui-derape": [
    // D1 · La transformation décroche
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Les artisans veulent être livrés demain
    { principale: "R2", secondaires: ["R4"] },
    // D3 · Julie n'en peut plus
    { principale: "R8", secondaires: ["R9"] },
    // D4 · Vos clients paient de plus en plus tard
    { principale: "R5", secondaires: ["R2"] },
    // D5 · Delta demande 8 %
    { principale: "R5", secondaires: ["R2"] },
    // D6 · Deux semaines pour finir
    { principale: "R4", secondaires: ["R6"] },
  ],
  // 2. L'équipe qui s'épuise
  "equipe-qui-s-epuise": [
    // D1 · Les délais explosent
    { principale: "R2", secondaires: ["R8", "R4"] },
    // D2 · Mathieu s'en va
    { principale: "R9", secondaires: ["R8", "R6"] },
    // D3 · Sophie et Romain ne se parlent plus
    { principale: "R9", secondaires: ["R2"] },
    // D4 · Le marketing lance une promotion
    { principale: "R6", secondaires: ["R8"] },
    // D5 · L'équipe demande du télétravail
    { principale: "R9", secondaires: ["R8"] },
    // D6 · Finir le trimestre
    { principale: "R10", secondaires: ["R8"] },
  ],
  // 3. Le dépôt qui déborde
  "depot-qui-deborde": [
    // D1 · En rupture, et plein à craquer
    { principale: "R2", secondaires: ["R4", "R10"] },
    // D2 · L'inventaire ne colle pas
    { principale: "R10", secondaires: ["R2"] },
    // D3 · Le fournisseur décroche
    { principale: "R2", secondaires: ["R5", "R4"] },
    // D4 · Le dépôt déborde
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D5 · Les agences se couvrent
    { principale: "R10", secondaires: ["R2", "R4"] },
    // D6 · Un chantier de 220 logements
    { principale: "R1", secondaires: ["R6"] },
  ],
  // 4. Le budget qui ne tient pas
  "budget-qui-ne-tient-pas": [
    // D1 · Le budget ne tient pas
    { principale: "R2", secondaires: ["R4"] },
    // D2 · La direction financière veut un chiffre
    { principale: "R10", secondaires: [] },
    // D3 · L'énergie dérive
    { principale: "R2", secondaires: ["R1"] },
    // D4 · Le prestataire facture plus que prévu
    { principale: "R5", secondaires: ["R1", "R4"] },
    // D5 · Les chariots lâchent
    { principale: "R6", secondaires: ["R5"] },
    // D6 · Finir le trimestre
    { principale: "R6", secondaires: ["R10"] },
  ],
  // 5. Le projet qui glisse
  "projet-qui-glisse": [
    // D1 · Le projet a glissé
    { principale: "R2", secondaires: ["R4"] },
    // D2 · Les utilisateurs clés ne viennent pas
    { principale: "R6", secondaires: ["R8"] },
    // D3 · Le directeur commercial veut le devis en ligne
    { principale: "R9", secondaires: ["R1"] },
    // D4 · Le comité de pilotage
    { principale: "R5", secondaires: ["R10", "R4"] },
    // D5 · La recette n'aura pas fini
    { principale: "R6", secondaires: ["R4"] },
    // D6 · Préparer l'ouverture
    { principale: "R5", secondaires: ["R9"] },
  ],
  // 6. Le fournisseur qui augmente
  "fournisseur-qui-augmente": [
    // D1 · Placova augmente de 12 %
    { principale: "R2", secondaires: ["R5"] },
    // D2 · Placova vient négocier
    { principale: "R5", secondaires: ["R2"] },
    // D3 · Les agences ne veulent pas augmenter
    { principale: "R2", secondaires: ["R1"] },
    // D4 · Combien confier à Brévent ?
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Placova arrête un four
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Les réserves du trimestre
    { principale: "R10", secondaires: ["R9"] },
  ],
  // 7. Le poste qui reste vide
  "poste-qui-reste-vide": [
    // D1 · Le poste reste vide
    { principale: "R2", secondaires: ["R9"] },
    // D2 · L'équipe sature
    { principale: "R8", secondaires: ["R2"] },
    // D3 · Le coup de cœur
    { principale: "R4", secondaires: ["R1"] },
    // D4 · L'offre
    { principale: "R5", secondaires: ["R1"] },
    // D5 · Les premières semaines
    { principale: "R6", secondaires: ["R8"] },
    // D6 · La période d'essai
    { principale: "R9", secondaires: ["R10"] },
  ],
  // 8. La réclamation qui enfle
  "reclamation-qui-enfle": [
    // D1 · Les malaxeurs reviennent
    { principale: "R2", secondaires: ["R10", "R4"] },
    // D2 · Pélissier Construction menace de partir
    { principale: "R4", secondaires: ["R1"] },
    // D3 · Vantrel nie le défaut
    { principale: "R5", secondaires: ["R10"] },
    // D4 · Faut-il rappeler les appareils ?
    { principale: "R2", secondaires: ["R5"] },
    // D5 · Le bruit court chez les artisans
    { principale: "R10", secondaires: ["R9"] },
    // D6 · Le lot corrigé arrive
    { principale: "R1", secondaires: ["R5"] },
  ],
  // 9. Le quai dangereux
  "quai-dangereux": [
    // D1 · Un chariot frôle un piéton
    { principale: "R2", secondaires: ["R9", "R4"] },
    // D2 · Le CACES de Dylan
    { principale: "R5", secondaires: ["R9"] },
    // D3 · Avant la saison
    { principale: "R2", secondaires: ["R4"] },
    // D4 · La saison bat son plein
    { principale: "R8", secondaires: ["R6"] },
    // D5 · Que faire des signaux
    { principale: "R10", secondaires: ["R9"] },
    // D6 · Finir le trimestre
    { principale: "R5", secondaires: ["R10"] },
  ],
  // 10. La réorganisation qui coince
  "reorganisation-qui-coince": [
    // D1 · L'annonce a mal pris
    { principale: "R9", secondaires: ["R1"] },
    // D2 · La bascule de lundi
    { principale: "R9", secondaires: ["R5"] },
    // D3 · L'outil reste vide
    { principale: "R2", secondaires: ["R9"] },
    // D4 · Patrick
    { principale: "R9", secondaires: [] },
    // D5 · La semaine 13 approche
    { principale: "R5", secondaires: ["R8"] },
    // D6 · Finir le trimestre
    { principale: "R10", secondaires: ["R9"] },
  ],
  // 11. La trésorerie qui fond
  "tresorerie-qui-fond": [
    // D1 · Le découvert approche
    { principale: "R2", secondaires: ["R4"] },
    // D2 · La banque demande des comptes
    { principale: "R10", secondaires: ["R7"] },
    // D3 · Cimier Construction ne paie plus
    { principale: "R5", secondaires: ["R1"] },
    // D4 · Le stock a gonflé
    { principale: "R2", secondaires: ["R6"] },
    // D5 · Norvia propose un escompte
    { principale: "R5", secondaires: ["R2"] },
    // D6 · Le pic de la semaine 12
    { principale: "R6", secondaires: ["R7", "R10"] },
  ],
  // 12. L'agence qui démarre
  "agence-qui-demarre": [
    // D1 · La fréquentation ne décolle pas
    { principale: "R1", secondaires: ["R4"] },
    // D2 · Bastien veut prospecter
    { principale: "R2", secondaires: ["R8"] },
    // D3 · Le stock d'une agence mature
    { principale: "R10", secondaires: ["R2"] },
    // D4 · Morel Bâtiment veut des prix
    { principale: "R5", secondaires: ["R1"] },
    // D5 · Faire venir les autres
    { principale: "R1", secondaires: ["R4"] },
    // D6 · Finir le trimestre
    { principale: "R4", secondaires: ["R1"] },
  ],
  // 13. La panne qui paralyse
  "panne-qui-paralyse": [
    // D1 · Plus rien ne fonctionne
    { principale: "R5", secondaires: ["R8"] },
    // D2 · Les clients veulent savoir
    { principale: "R10", secondaires: ["R7"] },
    // D3 · Redémarrer, mais comment ?
    { principale: "R5", secondaires: ["R1"] },
    // D4 · Ferrand Habitat menace de partir
    { principale: "R10", secondaires: ["R7"] },
    // D5 · Les équipes sont à bout
    { principale: "R8", secondaires: ["R6"] },
    // D6 · Sortir de la crise
    { principale: "R3", secondaires: ["R8"] },
  ],
  // 14. Le collaborateur qui décroche
  "collaborateur-qui-decroche": [
    // D1 · Didier décroche
    { principale: "R9", secondaires: ["R1"] },
    // D2 · Construire la suite
    { principale: "R9", secondaires: ["R2"] },
    // D3 · L'équipe gronde
    { principale: "R8", secondaires: ["R10", "R9"] },
    // D4 · Le point à mi-parcours
    { principale: "R3", secondaires: ["R9"] },
    // D5 · La nouvelle gamme de fixations
    { principale: "R8", secondaires: ["R9"] },
    // D6 · Le rush de fin d'année
    { principale: "R9", secondaires: ["R3"] },
  ],
  // 15. L'indicateur qui ment
  "indicateur-qui-ment": [
    // D1 · Le tableau est vert, les ventes baissent
    { principale: "R10", secondaires: ["R1"] },
    // D2 · La prime du mois prochain
    { principale: "R10", secondaires: ["R9"] },
    // D3 · Des conseillers très inégaux
    { principale: "R8", secondaires: ["R10"] },
    // D4 · Le siège veut reprendre deux postes
    { principale: "R10", secondaires: [] },
    // D5 · Le pic de printemps
    { principale: "R5", secondaires: ["R10"] },
    // D6 · Le tableau de bord de demain
    { principale: "R10", secondaires: ["R9"] },
  ],
  // 16. L'appel d'offres
  "appel-d-offres": [
    // D1 · Trois consultations, une équipe
    { principale: "R5", secondaires: ["R8"] },
    // D2 · Les questions à l'acheteuse
    { principale: "R1", secondaires: ["R10"] },
    // D3 · Le mémoire technique
    { principale: "R2", secondaires: ["R10"] },
    // D4 · Le prix
    { principale: "R5", secondaires: ["R4"] },
    // D5 · La négociation
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Le premier client s'impatiente
    { principale: "R2", secondaires: ["R4"] },
  ],
  // 17. Le prix qui ne passe plus
  "prix-qui-ne-passe-plus": [
    // D1 · La marge fond
    { principale: "R2", secondaires: ["R4"] },
    // D2 · Les dérogations s'envolent
    { principale: "R10", secondaires: ["R9"] },
    // D3 · Les commerciaux ne savent plus quoi répondre
    { principale: "R9", secondaires: ["R8"] },
    // D4 · Altinéo prépare quelque chose
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Garon Bâtiment veut ses anciens prix
    { principale: "R10", secondaires: ["R5"] },
    // D6 · Finir le trimestre
    { principale: "R10", secondaires: ["R4"] },
  ],
  // 18. L'agenda qui déborde
  "agenda-qui-deborde": [
    // D1 · Soixante heures, et toujours en retard
    { principale: "R8", secondaires: ["R4"] },
    // D2 · La réunion du lundi
    { principale: "R8", secondaires: ["R10"] },
    // D3 · Le drive n'avance pas
    { principale: "R6", secondaires: ["R9"] },
    // D4 · Les entretiens annuels
    { principale: "R9", secondaires: ["R8"] },
    // D5 · Le devis Aubrac
    { principale: "R2", secondaires: ["R8"] },
    // D6 · L'appel d'offres du groupe scolaire
    { principale: "R9", secondaires: ["R8"] },
  ],
  // 19. Le préavis de grève
  "preavis-de-greve": [
    // D1 · Le préavis est déposé
    { principale: "R10", secondaires: ["R1"] },
    // D2 · Lundi, la grève
    { principale: "R9", secondaires: ["R5"] },
    // D3 · Que mettre sur la table ?
    { principale: "R2", secondaires: ["R5"] },
    // D4 · Les samedis de la saison haute
    { principale: "R8", secondaires: ["R6"] },
    // D5 · Le dernier tour
    { principale: "R5", secondaires: ["R9"] },
    // D6 · Tenir ce qui a été conclu
    { principale: "R10", secondaires: ["R6"] },
  ],
  // 20. Le client qui s'en va
  "client-qui-s-en-va": [
    // D1 · Les artisans s'en vont sans bruit
    { principale: "R10", secondaires: ["R1"] },
    // D2 · Le comptoir du matin
    { principale: "R2", secondaires: ["R4"] },
    // D3 · Ceux qui commandent moins
    { principale: "R5", secondaires: ["R9"] },
    // D4 · Faire revenir ceux qui sont partis ?
    { principale: "R2", secondaires: ["R6"] },
    // D5 · Un concurrent ouvre à Décines
    { principale: "R4", secondaires: ["R2"] },
    // D6 · Clore le trimestre
    { principale: "R10", secondaires: ["R6"] },
  ],
  // 21. Les tournées qui débordent
  "tournees-qui-debordent": [
    // D1 · Les tournées qui débordent
    { principale: "R2", secondaires: ["R4"] },
    // D2 · Le sous-traitant augmente ses tarifs
    { principale: "R5", secondaires: ["R6"] },
    // D3 · Trois livraisons pour un même chantier
    { principale: "R2", secondaires: ["R10"] },
    // D4 · Le pic de printemps
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Les livraisons ratées
    { principale: "R6", secondaires: ["R1"] },
    // D6 · Finir le trimestre
    { principale: "R9", secondaires: ["R8"] },
  ],
  // 22. Le site qui ne vend pas
  "site-qui-ne-vend-pas": [
    // D1 · Beaucoup de visites, peu de commandes
    { principale: "R2", secondaires: ["R4"] },
    // D2 · Les agences freinent
    { principale: "R9", secondaires: ["R2"] },
    // D3 · Le nouveau tunnel de commande
    { principale: "R5", secondaires: ["R10"] },
    // D4 · Le prestataire veut tripler la publicité
    { principale: "R10", secondaires: ["R4"] },
    // D5 · Le printemps arrive
    { principale: "R6", secondaires: ["R2"] },
    // D6 · Le comité veut couper
    { principale: "R10", secondaires: [] },
  ],
  // 23. Le talent qui veut partir
  "talent-qui-veut-partir": [
    // D1 · La meilleure est approchée
    { principale: "R1", secondaires: ["R9"] },
    // D2 · L'offre écrite
    { principale: "R9", secondaires: ["R6"] },
    // D3 · Habib ne tient plus
    { principale: "R8", secondaires: ["R2"] },
    // D4 · Mathilde se lasse
    { principale: "R9", secondaires: [] },
    // D5 · Le poste régional
    { principale: "R10", secondaires: ["R9"] },
    // D6 · Valdane vise Kofi
    { principale: "R9", secondaires: ["R8"] },
  ],
  // 24. Les compétences qui manquent
  "competences-qui-manquent": [
    // D1 · Deux départs, une machine
    { principale: "R6", secondaires: ["R8"] },
    // D2 · Ce qui n'est écrit nulle part
    { principale: "R8", secondaires: ["R6"] },
    // D3 · Et si l'un d'eux manquait ?
    { principale: "R5", secondaires: ["R8"] },
    // D4 · L'agenceur veut plus
    { principale: "R5", secondaires: ["R8"] },
    // D5 · Le dernier mois de René
    { principale: "R9", secondaires: ["R6"] },
    // D6 · Joaquim s'en va
    { principale: "R6", secondaires: ["R8"] },
  ],
  // 25. La facture qui flambe
  "facture-qui-flambe": [
    // D1 · Le contrat arrive à échéance
    { principale: "R1", secondaires: ["R10"] },
    // D2 · Signer avant ce soir
    { principale: "R5", secondaires: ["R4"] },
    // D3 · Un plan pour l'hiver
    { principale: "R9", secondaires: ["R2"] },
    // D4 · Investir, mais dans quoi ?
    { principale: "R2", secondaires: ["R5"] },
    // D5 · Le bilan carbone d'Ostral
    { principale: "R10", secondaires: [] },
    // D6 · Le froid annoncé
    { principale: "R6", secondaires: ["R5"] },
  ],
  // 26. Le contrôle qui s'annonce
  "controle-qui-s-annonce": [
    // D1 · Le contrôle est annoncé
    { principale: "R1", secondaires: ["R5"] },
    // D2 · Le circuit des factures
    { principale: "R2", secondaires: ["R6"] },
    // D3 · Les remises sans papier
    { principale: "R10", secondaires: ["R5"] },
    // D4 · Le contrôleur arrive lundi
    { principale: "R10", secondaires: ["R9"] },
    // D5 · Le procès-verbal
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Après le contrôle
    { principale: "R6", secondaires: ["R8"] },
  ],
  // 27. La fusion des agences
  "fusion-des-agences": [
    // D1 · Deux agences, une seule enseigne
    { principale: "R10", secondaires: ["R1"] },
    // D2 · Deux chefs pour un comptoir
    { principale: "R9", secondaires: [] },
    // D3 · Raymond est toujours là
    { principale: "R9", secondaires: [] },
    // D4 · Un seul logiciel
    { principale: "R5", secondaires: ["R8"] },
    // D5 · Ce que le négoce fait mieux
    { principale: "R3", secondaires: ["R5"] },
    // D6 · Le concurrent attaque
    { principale: "R2", secondaires: ["R4"] },
  ],
  // 28. Le nouveau service
  "nouveau-service": [
    // D1 · Douze agences au trimestre
    { principale: "R5", secondaires: ["R1"] },
    // D2 · Les premiers chiffres
    { principale: "R10", secondaires: ["R7"] },
    // D3 · Ce que le terrain raconte
    { principale: "R2", secondaires: ["R1"] },
    // D4 · Étendre, ou pas
    { principale: "R3", secondaires: ["R10"] },
    // D5 · Ferlane baisse ses prix
    { principale: "R4", secondaires: ["R2"] },
    // D6 · Avant le comité
    { principale: "R10", secondaires: [] },
  ],
  // 29. L'équipe dispersée
  "equipe-dispersee": [
    // D1 · La direction veut savoir où ils sont
    { principale: "R10", secondaires: ["R9"] },
    // D2 · Killian se décourage
    { principale: "R8", secondaires: ["R9"] },
    // D3 · Les comptes rendus ne remontent plus
    { principale: "R10", secondaires: ["R9"] },
    // D4 · Ambre écoute les offres
    { principale: "R9", secondaires: [] },
    // D5 · Une nouvelle gamme à lancer
    { principale: "R8", secondaires: ["R9"] },
    // D6 · Finir le trimestre
    { principale: "R2", secondaires: ["R9"] },
  ],
  // 30. Les cent premiers jours
  "cent-premiers-jours": [
    // D1 · Votre premier lundi
    { principale: "R1", secondaires: ["R4"] },
    // D2 · Le premier point avec la direction
    { principale: "R2", secondaires: ["R9"] },
    // D3 · Christophe
    { principale: "R9", secondaires: [] },
    // D4 · La direction veut un plan
    { principale: "R9", secondaires: ["R4"] },
    // D5 · La résidence des Peupliers
    { principale: "R5", secondaires: ["R8"] },
    // D6 · Le bilan des cent jours
    { principale: "R10", secondaires: ["R7"] },
  ],
  // 31. La commande à prix cassé
  "commande-a-prix-casse": [
    // D1 · Un promoteur à 39 € le panneau
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Préparer la pleine saison
    { principale: "R6", secondaires: ["R5", "R8"] },
    // D3 · Rioult veut le même prix
    { principale: "R5", secondaires: ["R4", "R9"] },
    // D4 · Cévral en redemande
    { principale: "R4", secondaires: ["R6", "R2"] },
    // D5 · La scie doit être révisée
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Le coût complet a bougé
    { principale: "R10", secondaires: ["R2", "R4"] },
  ],
  // 32. Le produit qui perd de l'argent
  "produit-deficitaire": [
    // D1 · La plomberie-chauffage dans le rouge
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le corner peinture
    { principale: "R2", secondaires: ["R5", "R4"] },
    // D3 · Calorive casse les prix
    { principale: "R4", secondaires: ["R2", "R6"] },
    // D4 · Le compromis de la direction
    { principale: "R6", secondaires: ["R8"] },
    // D5 · L'opération de décembre
    { principale: "R5", secondaires: ["R4", "R1"] },
    // D6 · Finir le trimestre
    { principale: "R4", secondaires: ["R10"] },
  ],
  // 33. Faire ou faire faire
  "faire-ou-faire-faire": [
    // D1 · L'offre de Ventajol
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le contrat de Ventajol
    { principale: "R5", secondaires: ["R6"] },
    // D3 · La location des porteurs arrive à échéance
    { principale: "R4", secondaires: ["R2", "R6"] },
    // D4 · La pointe de printemps
    { principale: "R8", secondaires: ["R5", "R4"] },
    // D5 · Le coût complet monte
    { principale: "R10", secondaires: ["R4", "R2"] },
    // D6 · Le transporteur dérape
    { principale: "R5", secondaires: ["R6"] },
  ],
  // 34. Le seuil qui bouge
  "seuil-qui-bouge": [
    // D1 · Un mois après l'ouverture
    { principale: "R5", secondaires: ["R4", "R2"] },
    // D2 · Le bail définitif
    { principale: "R5", secondaires: ["R4"] },
    // D3 · Brenaz ouvre son drive
    { principale: "R4", secondaires: ["R2", "R1"] },
    // D4 · Les matins de pointe
    { principale: "R5", secondaires: ["R4"] },
    // D5 · Bâtir Nord-Isère veut un prix
    { principale: "R4", secondaires: ["R5"] },
    // D6 · La semaine de Noël
    { principale: "R4", secondaires: ["R6"] },
  ],
  // 35. Les écarts du budget
  "ecarts-du-budget": [
    // D1 · Dix-huit mille euros de dépassement
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le demi-sac de trop
    { principale: "R10", secondaires: ["R4", "R2"] },
    // D3 · La cimenterie augmente encore
    { principale: "R4", secondaires: ["R5", "R1"] },
    // D4 · La commande de la ZAC
    { principale: "R5", secondaires: ["R4", "R10"] },
    // D5 · Armel part en retraite
    { principale: "R6", secondaires: ["R8", "R5"] },
    // D6 · La revue trimestrielle
    { principale: "R10", secondaires: ["R4", "R6"] },
  ],
  // 36. L'atelier saturé
  "atelier-sature": [
    // D1 · Le carnet déborde
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · La commande du bailleur
    { principale: "R4", secondaires: ["R5"] },
    // D3 · Desserrer le goulot
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D4 · La broche vibre
    { principale: "R5", secondaires: ["R6", "R4"] },
    // D5 · Le pic d'avant les fêtes
    { principale: "R4", secondaires: ["R6"] },
    // D6 · Finir le trimestre
    { principale: "R10", secondaires: ["R4"] },
  ],
  // 37. L'investissement à choisir
  "investissement-a-choisir": [
    // D1 · Trois dossiers, une enveloppe
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le fournisseur pousse la version étendue
    { principale: "R5", secondaires: ["R4"] },
    // D3 · La mezzanine inachevée
    { principale: "R4", secondaires: ["R2"] },
    // D4 · Plomb ou lithium
    { principale: "R6", secondaires: ["R4"] },
    // D5 · Commander l'extension ?
    { principale: "R5", secondaires: ["R6", "R1"] },
    // D6 · Le contrat de maintenance
    { principale: "R6", secondaires: ["R5"] },
  ],
  // 38. La croissance à financer
  "croissance-a-financer": [
    // D1 · Le marché Altaïr démarre
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D2 · Le groupe attend son dividende
    { principale: "R6", secondaires: ["R10", "R4"] },
    // D3 · Le salon de l'habitat
    { principale: "R5", secondaires: ["R4", "R6"] },
    // D4 · Un second marché se présente
    { principale: "R5", secondaires: ["R4", "R6"] },
    // D5 · Valcourt atteint son plafond
    { principale: "R6", secondaires: ["R4", "R5"] },
    // D6 · La semaine des primes
    { principale: "R5", secondaires: ["R2"] },
  ],
  // 39. Louer ou acheter
  "louer-ou-acheter": [
    // D1 · Renouveler les mini-pelles
    { principale: "R5", secondaires: ["R4", "R2"] },
    // D2 · Trois nacelles pour Elvatec
    { principale: "R4", secondaires: ["R5"] },
    // D3 · Le chantier de Ganivet
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Sillon passe aux tarifs de saison
    { principale: "R4", secondaires: ["R5"] },
    // D5 · La vieille nacelle lâche
    { principale: "R4", secondaires: ["R6"] },
    // D6 · La saison va-t-elle tenir ?
    { principale: "R5", secondaires: ["R6"] },
  ],
  // 40. Le client à risque
  "client-a-risque": [
    // D1 · Corvelle veut 500 k€
    { principale: "R5", secondaires: ["R4", "R2"] },
    // D2 · Une traite de Guénard revient impayée
    { principale: "R4", secondaires: ["R2", "R9"] },
    // D3 · Un nouveau client veut un compte
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Corvelle paie en retard et demande plus
    { principale: "R10", secondaires: ["R5", "R4"] },
    // D5 · Brondel Couverture en redressement judiciaire
    { principale: "R5", secondaires: ["R10"] },
    // D6 · La direction veut serrer la vis
    { principale: "R4", secondaires: ["R10", "R2"] },
  ],
  // 41. Le discounter qui arrive
  "discounter-qui-arrive": [
    // D1 · Tarval ouvre dans quinze jours
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Ce que Tarval ne sait pas faire
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Le fabricant qui livre aussi Tarval
    { principale: "R4", secondaires: ["R6"] },
    // D4 · Les premiers chiffres
    { principale: "R3", secondaires: ["R10"] },
    // D5 · L'opération d'hiver de Tarval
    { principale: "R5", secondaires: ["R4"] },
    // D6 · Le cap de l'an prochain
    { principale: "R6", secondaires: ["R10"] },
  ],
  // 42. Le concurrent à racheter
  "concurrent-a-racheter": [
    // D1 · Mourgue est à vendre
    { principale: "R2", secondaires: ["R4", "R5"] },
    // D2 · Auditer, ou prendre l'exclusivité
    { principale: "R1", secondaires: ["R4", "R6"] },
    // D3 · L'offre ferme
    { principale: "R3", secondaires: ["R4", "R1"] },
    // D4 · Le dernier tour
    { principale: "R5", secondaires: ["R4"] },
    // D5 · La garantie de passif
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Le directeur commercial
    { principale: "R6", secondaires: ["R9", "R5"] },
  ],
  // 43. Le marché qui s'ouvre
  "marche-qui-s-ouvre": [
    // D1 · Un marché de 650 millions ?
    { principale: "R1", secondaires: ["R5", "R4"] },
    // D2 · Ce que le test doit dire
    { principale: "R10", secondaires: ["R1"] },
    // D3 · Les artisans
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Le fabricant
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Les chiffres du test
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Solvéane
    { principale: "R4", secondaires: ["R5"] },
  ],
  // 44. Le fabricant qui vend en direct
  "fabricant-en-direct": [
    // D1 · Mérindal vend en direct
    { principale: "R4", secondaires: ["R2", "R1"] },
    // D2 · Les grands comptes demandent un geste
    { principale: "R2", secondaires: ["R4"] },
    // D3 · Une seconde marque de menuiseries
    { principale: "R1", secondaires: ["R5"] },
    // D4 · Une marque propre ?
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Les premiers chiffres
    { principale: "R3", secondaires: ["R4"] },
    // D6 · Mérindal à la table
    { principale: "R5", secondaires: ["R4", "R6"] },
  ],
  // 45. Le projet qu'on n'ose pas arrêter
  "projet-a-arreter": [
    // D1 · Arvel Maison, dix-huit mois après
    { principale: "R4", secondaires: ["R10", "R2"] },
    // D2 · Les visites montent
    { principale: "R1", secondaires: ["R3"] },
    // D3 · Brémond s'intéresse à Rillieux
    { principale: "R5", secondaires: ["R3", "R4"] },
    // D4 · Saint-Priest : tenir le cap ?
    { principale: "R3", secondaires: ["R4", "R1"] },
    // D5 · Le comité de mardi
    { principale: "R10", secondaires: ["R9", "R4"] },
    // D6 · Écully, la vitrine
    { principale: "R5", secondaires: ["R3", "R6"] },
  ],
  // 46. Le réseau d'agences à redessiner
  "reseau-a-redessiner": [
    // D1 · Talvère cherche un terrain à Mions
    { principale: "R5", secondaires: ["R2", "R4"] },
    // D2 · Bron, dernière du classement
    { principale: "R1", secondaires: ["R4", "R5"] },
    // D3 · Talvère annonce Mions
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Villeurbanne-Nord : les premiers chiffres
    { principale: "R3", secondaires: ["R10", "R4"] },
    // D5 · Le terrain du boulevard
    { principale: "R5", secondaires: ["R6", "R4"] },
    // D6 · Les primes des directeurs d'agence
    { principale: "R10", secondaires: ["R9", "R4"] },
  ],
  // 47. Le pari du réemploi
  "pari-du-reemploi": [
    // D1 · Premier ou suiveur ?
    { principale: "R5", secondaires: ["R6", "R4"] },
    // D2 · Sartel et Grollier veulent une réponse
    { principale: "R6", secondaires: ["R5"] },
    // D3 · L'accord-cadre de la Métropole
    { principale: "R1", secondaires: ["R5"] },
    // D4 · Le premier bilan
    { principale: "R3", secondaires: ["R10"] },
    // D5 · L'offre d'Orréa
    { principale: "R6", secondaires: ["R4"] },
    // D6 · La plateforme, maintenant ?
    { principale: "R5", secondaires: ["R4"] },
  ],
  // 48. Le grand compte qui veut l'exclusivité
  "grand-compte-exclusif": [
    // D1 · Un quart de la région sur un seul client
    { principale: "R2", secondaires: ["R4", "R5"] },
    // D2 · Le stock dédié
    { principale: "R5", secondaires: ["R6"] },
    // D3 · Moulinier et Batival
    { principale: "R6", secondaires: ["R9"] },
    // D4 · Sarlève veut étendre le contrat à l'Isère
    { principale: "R1", secondaires: ["R5"] },
    // D5 · Le chantier des Vergnes est suspendu
    { principale: "R3", secondaires: ["R4"] },
    // D6 · La revue annuelle des prix
    { principale: "R4", secondaires: ["R5"] },
  ],
  // 49. Les chambres qu'on brade
  "chambres-bradees": [
    // D1 · Le pick-up est en retard
    { principale: "R4", secondaires: ["R2"] },
    // D2 · Un groupe sur le pont de l'Ascension
    { principale: "R5", secondaires: ["R4"] },
    // D3 · Bookalia propose son programme
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Un allotement pour l'été
    { principale: "R1", secondaires: ["R5"] },
    // D5 · L'été se dessine
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Le taux d'occupation de juin
    { principale: "R10", secondaires: ["R4"] },
  ],
  // 50. Le séminaire qui chasse les clients
  "seminaire-qui-evince": [
    // D1 · Cinquante-cinq chambres en juin
    { principale: "R4", secondaires: ["R5", "R2"] },
    // D2 · Le contrat
    { principale: "R6", secondaires: ["R5"] },
    // D3 · La convention Mélizane
    { principale: "R4", secondaires: ["R10"] },
    // D4 · La série de Tavenne
    { principale: "R1", secondaires: ["R5", "R7"] },
    // D5 · Mélizane se réorganise
    { principale: "R3", secondaires: ["R6"] },
    // D6 · Les groupes de fin juillet
    { principale: "R10", secondaires: ["R4"] },
  ],
  // 51. Les chambres vendues deux fois
  surreservation: [
    // D1 · Une politique avant le premier salon
    { principale: "R5", secondaires: ["R2", "R4"] },
    // D2 · Qui déloger ?
    { principale: "R2", secondaires: ["R5"] },
    // D3 · Faut-il garantir les réservations ?
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Le congrès national d'Annecy
    { principale: "R4", secondaires: ["R2"] },
    // D5 · Novembre et ses salons
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Les directeurs veulent arrêter
    { principale: "R4", secondaires: ["R10"] },
  ],
  // 52. La note qui chute
  "note-qui-chute": [
    // D1 · La note qui chute
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le buffet vide de 8 h 40
    { principale: "R2", secondaires: ["R6"] },
    // D3 · Baisser les prix de l'été ?
    { principale: "R10", secondaires: ["R5"] },
    // D4 · Une agence promet de remonter la note
    { principale: "R4", secondaires: ["R5"] },
    // D5 · La canicule arrive
    { principale: "R5", secondaires: ["R6"] },
    // D6 · La note remonte trop lentement
    { principale: "R6", secondaires: ["R4"] },
  ],
  // 53. Le ratio matière qui dérape
  "ratio-matiere": [
    // D1 · 36,4 % de ratio matière
    { principale: "R2", secondaires: ["R1", "R4"] },
    // D2 · La carte d'automne
    { principale: "R5", secondaires: ["R2"] },
    // D3 · Septembre clôturé, les assiettes au passe
    { principale: "R10", secondaires: ["R3"] },
    // D4 · Changer de grossiste ?
    { principale: "R4", secondaires: ["R2"] },
    // D5 · Novembre s'annonce creux
    { principale: "R6", secondaires: ["R4"] },
    // D6 · Avant la fermeture pour travaux
    { principale: "R6", secondaires: ["R4"] },
  ],
  // 54. L'intersaison qui assèche la caisse
  intersaison: [
    // D1 · La saison se termine
    { principale: "R5", secondaires: ["R2", "R4"] },
    // D2 · Les acomptes de l'été et de l'hiver
    { principale: "R5", secondaires: ["R6"] },
    // D3 · Le programme de travaux
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Les factures de l'hiver
    { principale: "R4", secondaires: ["R6"] },
    // D5 · La légionelle
    { principale: "R3", secondaires: ["R10", "R1"] },
    // D6 · Alpine Horizons et l'hiver prochain
    { principale: "R5", secondaires: ["R6"] },
  ],
  // 55. Les chambres pas prêtes à 15 h
  "chambres-pas-pretes": [
    // D1 · Les chambres pas prêtes à 15 h
    { principale: "R4", secondaires: ["R2", "R6"] },
    // D2 · Les clients de 13 h attendent
    { principale: "R2", secondaires: ["R10"] },
    // D3 · La recouche de tous les jours
    { principale: "R6", secondaires: ["R9"] },
    // D4 · Le salon de février
    { principale: "R5", secondaires: ["R8"] },
    // D5 · Les oublis dans les avis
    { principale: "R10", secondaires: ["R8"] },
    // D6 · Un groupe à 12 h 30
    { principale: "R5", secondaires: ["R6"] },
  ],
  // 56. La brigade à bout
  "brigade-a-bout": [
    // D1 · Une brigade à bout
    { principale: "R8", secondaires: ["R2", "R4"] },
    // D2 · La mise en place en double
    { principale: "R8", secondaires: ["R4"] },
    // D3 · Préparer décembre
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Les repas de groupe de décembre
    { principale: "R4", secondaires: ["R10"] },
    // D5 · La carte de décembre
    { principale: "R6", secondaires: ["R4"] },
    // D6 · Les soirs de fêtes
    { principale: "R8", secondaires: ["R4"] },
  ],
  // 57. La rénovation sans fermer
  "renovation-sans-fermer": [
    // D1 · Trois étages à refaire avant la rentrée
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D2 · Que dire aux clients ?
    { principale: "R6", secondaires: ["R4", "R10"] },
    // D3 · Qui loger où ?
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Suivre le chantier
    { principale: "R1", secondaires: ["R10"] },
    // D5 · Le chantier a du retard
    { principale: "R3", secondaires: ["R5", "R6"] },
    // D6 · Cimalp prépare la rentrée
    { principale: "R9", secondaires: ["R10"] },
  ],
  // 58. Les saisonniers de juillet
  "saisonniers-de-juillet": [
    // D1 · Huit saisonniers dans quatre semaines
    { principale: "R6", secondaires: ["R8", "R4"] },
    // D2 · Trois saisonniers sans logement
    { principale: "R5", secondaires: ["R9"] },
    // D3 · La première semaine de rush
    { principale: "R3", secondaires: ["R8", "R10"] },
    // D4 · Elif s'en va
    { principale: "R1", secondaires: ["R9", "R5"] },
    // D5 · Les ventes additionnelles
    { principale: "R4", secondaires: ["R10", "R6"] },
    // D6 · Finir la saison
    { principale: "R8", secondaires: ["R9", "R5"] },
  ],
  // 59. Les postes qu'on ne pourvoit plus
  "postes-introuvables": [
    // D1 · Soixante-quatre postes pour l'été
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Les directeurs veulent une prime
    { principale: "R4", secondaires: ["R9", "R6"] },
    // D3 · La coupure
    { principale: "R5", secondaires: ["R8", "R6"] },
    // D4 · Le vivier se tarit
    { principale: "R9", secondaires: ["R4"] },
    // D5 · Le pick-up de l'été
    { principale: "R3", secondaires: ["R10", "R1"] },
    // D6 · Les postes qui resteront vides
    { principale: "R6", secondaires: ["R5", "R4"] },
  ],
  // 60. Les apprentis qui décrochent
  "apprentis-qui-decrochent": [
    // D1 · La rentrée des apprentis
    { principale: "R4", secondaires: ["R6", "R8"] },
    // D2 · Le calendrier du CFA
    { principale: "R6", secondaires: ["R4"] },
    // D3 · Zénobie s'arrête
    { principale: "R5", secondaires: ["R9"] },
    // D4 · Sanaa décroche
    { principale: "R9", secondaires: ["R1", "R2"] },
    // D5 · Deux contrats de plus ?
    { principale: "R4", secondaires: ["R6"] },
    // D6 · Les repas de fin d'année
    { principale: "R8", secondaires: ["R5"] },
  ],
  // 61. La cuisine centrale qu'on n'attendait pas
  "cuisine-centrale": [
    // D1 · Le laboratoire ouvre, les cuisines se ferment
    { principale: "R9", secondaires: ["R2", "R4"] },
    // D2 · La date du comité
    { principale: "R5", secondaires: ["R1", "R6"] },
    // D3 · Les premières livraisons
    { principale: "R5", secondaires: ["R10", "R4"] },
    // D4 · Ce que disent les assiettes
    { principale: "R10", secondaires: ["R1", "R9"] },
    // D5 · La suite de la bascule
    { principale: "R3", secondaires: ["R9", "R6"] },
    // D6 · Ce qu'on confie encore au laboratoire
    { principale: "R4", secondaires: ["R2", "R6"] },
  ],
  // 62. Le spa qui ne se rentabilise pas seul
  "spa-a-financer": [
    // D1 · Trois usages pour le même argent
    { principale: "R4", secondaires: ["R2"] },
    // D2 · Combien vaut un spa sur le prix d'une chambre ?
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Les séminaires d'Évian
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Un spa « à l'équilibre »
    { principale: "R4", secondaires: ["R6"] },
    // D5 · Le dossier du conseil de famille
    { principale: "R3", secondaires: ["R1"] },
    // D6 · Le financement
    { principale: "R4", secondaires: ["R5"] },
  ],
  // 63. L'enseigne qui frappe à la porte
  "enseigne-a-la-porte": [
    // D1 · Orméa frappe à la porte
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Un essai avant de signer
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Les maisons de caractère
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Le projet de contrat
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Les chiffres de l'essai
    { principale: "R3", secondaires: ["R10"] },
    // D6 · La réponse d'Orméa
    { principale: "R5", secondaires: ["R4"] },
  ],
  // 64. Les appels d'offres en rafale
  "appels-d-offres-en-rafale": [
    // D1 · Douze appels d'offres en six semaines
    { principale: "R2", secondaires: ["R4", "R5"] },
    // D2 · Le dossier de Vilaine Métropole
    { principale: "R1", secondaires: ["R4"] },
    // D3 · Qui écrit les mémoires ?
    { principale: "R8", secondaires: ["R6"] },
    // D4 · Halden casse les prix à Kermelin
    { principale: "R5", secondaires: ["R4"] },
    // D5 · Un treizième appel d'offres
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Les premiers résultats
    { principale: "R3", secondaires: ["R10"] },
  ],
  // 65. Le client qui en demande toujours plus
  "client-qui-en-demande-plus": [
    // D1 · Quatre petites choses
    { principale: "R2", secondaires: ["R1", "R4"] },
    // D2 · La ligne de surgelés démarre
    { principale: "R5", secondaires: ["R4", "R6"] },
    // D3 · Le comité de pilotage intermédiaire
    { principale: "R10", secondaires: ["R9"] },
    // D4 · Les coups de main
    { principale: "R3", secondaires: ["R8", "R10"] },
    // D5 · Préparer la suite
    { principale: "R1", secondaires: ["R5", "R7"] },
    // D6 · La dernière demande
    { principale: "R6", secondaires: ["R9"] },
  ],
  // 66. Le livrable que le client refuse
  "livrable-refuse": [
    // D1 · Le rapport intermédiaire est refusé
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · La phase 2 doit démarrer
    { principale: "R6", secondaires: ["R1", "R5"] },
    // D3 · Les premières fiches partent
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Deux erreurs dans les fiches
    { principale: "R3", secondaires: ["R2", "R1"] },
    // D5 · Basile part sur une avant-vente
    { principale: "R5", secondaires: ["R8", "R10"] },
    // D6 · Le comité de pilotage final
    { principale: "R10", secondaires: ["R4", "R5"] },
  ],
  // 67. Les jours qu'on ne facture pas
  "jours-non-factures": [
    // D1 · Occupés comme jamais, et la marge baisse
    { principale: "R1", secondaires: ["R2"] },
    // D2 · Kervalan ne tiendra pas la date
    { principale: "R5", secondaires: ["R6", "R1"] },
    // D3 · Le TJM moyen monte
    { principale: "R2", secondaires: ["R1"] },
    // D4 · Des juniors sur le banc, une banque qui demande du monde
    { principale: "R4", secondaires: ["R2"] },
    // D5 · Talvenec veut déployer
    { principale: "R1", secondaires: ["R6"] },
    // D6 · La phase 2 de Kervalan
    { principale: "R3", secondaires: ["R6"] },
  ],
  // 68. Le forfait vendu sous son coût
  "forfait-trop-bas": [
    // D1 · Les forfaits finissent en perte
    { principale: "R2", secondaires: ["R1", "R4"] },
    // D2 · Des propositions perdues au prix
    { principale: "R4", secondaires: ["R3", "R5"] },
    // D3 · Trois analystes sans mission
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D4 · Le budget de Valmorin
    { principale: "R5", secondaires: ["R2"] },
    // D5 · L'accord-cadre des collectivités
    { principale: "R5", secondaires: ["R1", "R4"] },
    // D6 · La mutuelle veut reconduire
    { principale: "R4", secondaires: ["R10", "R5"] },
  ],
  // 69. Le travail fait qu'on n'a pas facturé
  "factures-qui-dorment": [
    // D1 · Le DSO à 96 jours
    { principale: "R2", secondaires: ["R1", "R4"] },
    // D2 · Le portail rejette encore
    { principale: "R2", secondaires: ["R4"] },
    // D3 · Les jalons glissent encore
    { principale: "R10", secondaires: ["R6"] },
    // D4 · Ollivro conteste 240 k€
    { principale: "R5", secondaires: ["R4", "R9"] },
    // D5 · Le comité de crédit de la banque
    { principale: "R10", secondaires: ["R5", "R4"] },
    // D6 · Avant la clôture de décembre
    { principale: "R6", secondaires: ["R4"] },
  ],
  // 70. Le staffing du lundi
  "staffing-du-lundi": [
    // D1 · Trois associés, deux seniors
    { principale: "R4", secondaires: ["R2", "R6"] },
    // D2 · Une mission signée, personne pour la faire
    { principale: "R1", secondaires: ["R5", "R4"] },
    // D3 · Le creux d'octobre
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Un analyste seul au Pays de Retz
    { principale: "R5", secondaires: ["R6"] },
    // D5 · L'avenant des urgences
    { principale: "R3", secondaires: ["R4"] },
    // D6 · La restitution et le séminaire
    { principale: "R4", secondaires: ["R5", "R9"] },
  ],
  // 71. Le consultant star
  "consultant-star": [
    // D1 · Le meilleur consultant de l'équipe
    { principale: "R9", secondaires: ["R4", "R2"] },
    // D2 · Ilham veut quitter la mission
    { principale: "R8", secondaires: ["R9"] },
    // D3 · La banque signe un deuxième lot
    { principale: "R8", secondaires: ["R6", "R4"] },
    // D4 · Qui forme les analystes ?
    { principale: "R1", secondaires: ["R5"] },
    // D5 · La nuit avant le comité Lagrave
    { principale: "R3", secondaires: ["R4", "R10"] },
    // D6 · Les comités de fin de trimestre
    { principale: "R9", secondaires: ["R6"] },
  ],
  // 72. La promotion qu'il faudra refuser
  "promotion-refusee": [
    // D1 · Une place pour trois
    { principale: "R1", secondaires: ["R10"] },
    // D2 · Les entretiens annuels
    { principale: "R10", secondaires: ["R9"] },
    // D3 · La note au comité
    { principale: "R4", secondaires: ["R10"] },
    // D4 · Le comité a tranché
    { principale: "R9", secondaires: ["R6"] },
    // D5 · La demande de compensation
    { principale: "R4", secondaires: ["R6"] },
    // D6 · La prise de poste
    { principale: "R5", secondaires: ["R8", "R6"] },
  ],
  // 73. Les consultants qui partent à deux ans
  "departs-a-deux-ans": [
    // D1 · 24 % de départs
    { principale: "R4", secondaires: ["R2"] },
    // D2 · Quatorze juniors en intercontrat
    { principale: "R6", secondaires: ["R4", "R9"] },
    // D3 · Les seniors ne voient pas la suite
    { principale: "R1", secondaires: ["R9"] },
    // D4 · Six consultants sans mission, une practice qui recrute
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Le plan de recrutement du printemps
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Il manque six seniors
    { principale: "R4", secondaires: ["R9"] },
  ],
  // 74. Embaucher ou louer des freelances
  "freelances-ou-embauches": [
    // D1 · Huit consultants de moins que la demande
    { principale: "R2", secondaires: ["R4", "R5"] },
    // D2 · Qui va chez Kervalis ?
    { principale: "R5", secondaires: ["R6"] },
    // D3 · Freelancia propose un accord-cadre
    { principale: "R6", secondaires: ["R5"] },
    // D4 · Kervalis étend son contrat-cadre
    { principale: "R3", secondaires: ["R4"] },
    // D5 · Quatre consultants de Kéroual
    { principale: "R1", secondaires: ["R5", "R4"] },
    // D6 · Le comité de mars
    { principale: "R6", secondaires: ["R10", "R4"] },
  ],
  // 75. La practice dont le marché s'éteint
  "practice-a-reorienter": [
    // D1 · Le marché qui s'éteint
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D2 · Des experts, ou pas
    { principale: "R5", secondaires: ["R6", "R1"] },
    // D3 · Qui part en binôme ?
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Ceux qui ne veulent pas changer
    { principale: "R9", secondaires: ["R5", "R4"] },
    // D5 · Une commande d'audits tardive
    { principale: "R6", secondaires: ["R4", "R1"] },
    // D6 · Le plan de décembre à février
    { principale: "R3", secondaires: ["R10", "R4"] },
  ],
  // 76. L'assistant d'IA qui change le métier
  "assistant-ia": [
    // D1 · L'assistant est déjà là
    { principale: "R4", secondaires: ["R2", "R1"] },
    // D2 · Les jours de régie qui disparaissent
    { principale: "R5", secondaires: ["R2"] },
    // D3 · Ceux qui n'y touchent pas
    { principale: "R9", secondaires: ["R8"] },
    // D4 · Ce que les relectures disent
    { principale: "R3", secondaires: ["R2"] },
    // D5 · Orvanne veut sa part
    { principale: "R1", secondaires: ["R5"] },
    // D6 · Le comité de juin
    { principale: "R6", secondaires: ["R10"] },
  ],
  // 77. L'associé qui veut vendre ses parts
  "associe-qui-part": [
    // D1 · Wilfrid veut vendre
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Ce qui retient ses trois comptes
    { principale: "R1", secondaires: ["R6"] },
    // D3 · L'offre
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Protéger les comptes
    { principale: "R6", secondaires: ["R9"] },
    // D5 · Financer le rachat
    { principale: "R10", secondaires: ["R5"] },
    // D6 · Le protocole à signer
    { principale: "R3", secondaires: ["R4"] },
  ],
  // 78. Rester généraliste ou se spécialiser
  "generaliste-ou-specialiste": [
    // D1 · Halden ouvre à Nantes
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Le premier pas
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Les clients historiques s'inquiètent
    { principale: "R4", secondaires: ["R9"] },
    // D4 · Des consultants sans mission
    { principale: "R6", secondaires: ["R4", "R5"] },
    // D5 · Les premiers chiffres
    { principale: "R3", secondaires: ["R10", "R1"] },
    // D6 · Le GHT veut 15 %
    { principale: "R5", secondaires: ["R4", "R6"] },
  ],
  // 79. Les lits qui restent vides
  "lits-vides": [
    // D1 · Huit lits vides
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Soixante noms sur la liste
    { principale: "R1", secondaires: ["R10"] },
    // D3 · Orchidia ouvre à Beaune
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Sur dossier, comme Orchidia
    { principale: "R4", secondaires: ["R5"] },
    // D5 · La grippe aux Tilleuls
    { principale: "R5", secondaires: ["R2"] },
    // D6 · Préparer le printemps
    { principale: "R10", secondaires: ["R6"] },
  ],
  // 80. Les sorties qui bloquent
  "sorties-qui-bloquent": [
    // D1 · Trente-quatre jours
    { principale: "R4", secondaires: ["R2", "R6"] },
    // D2 · Les dossiers en attente
    { principale: "R2", secondaires: ["R6"] },
    // D3 · Des places chez l'aval
    { principale: "R5", secondaires: ["R1"] },
    // D4 · Rentrer chez soi
    { principale: "R6", secondaires: ["R4"] },
    // D5 · L'épidémie
    { principale: "R4", secondaires: ["R1"] },
    // D6 · Les fêtes
    { principale: "R6", secondaires: ["R8"] },
  ],
  // 81. La famille qui écrit à l'ARS
  "famille-qui-ecrit": [
    // D1 · La lettre de l'ARS
    { principale: "R4", secondaires: ["R2", "R9"] },
    // D2 · Mme Durupt demande des comptes
    { principale: "R9", secondaires: ["R10"] },
    // D3 · La réponse à l'ARS
    { principale: "R10", secondaires: ["R4", "R5"] },
    // D4 · Le matin du week-end
    { principale: "R5", secondaires: ["R8", "R6"] },
    // D5 · Le linge
    { principale: "R2", secondaires: ["R5"] },
    // D6 · Les familles
    { principale: "R9", secondaires: ["R10", "R6"] },
  ],
  // 82. L'intérim qui flambe
  "interim-qui-flambe": [
    // D1 · La facture de l'intérim
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Un pool de remplacement ?
    { principale: "R5", secondaires: ["R6"] },
    // D3 · Les postes vacants
    { principale: "R5", secondaires: ["R9"] },
    // D4 · La grippe
    { principale: "R8", secondaires: ["R4"] },
    // D5 · Les congés de l'été
    { principale: "R6", secondaires: ["R8"] },
    // D6 · Le contrat-cadre de Soralis
    { principale: "R1", secondaires: ["R4", "R3"] },
  ],
  // 83. La section qui plonge
  "section-en-deficit": [
    // D1 · Le conseil veut supprimer deux postes
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le personnel de nuit
    { principale: "R10", secondaires: ["R2"] },
    // D3 · Le GMP et le PMP
    { principale: "R5", secondaires: ["R1", "R6"] },
    // D4 · Le prix de journée
    { principale: "R2", secondaires: ["R10"] },
    // D5 · Les chambres vides
    { principale: "R6", secondaires: ["R8"] },
    // D6 · Boucler les propositions
    { principale: "R5", secondaires: ["R2"] },
  ],
  // 84. L'heure d'aide à domicile
  "heure-a-domicile": [
    // D1 · Une heure à 26 €, une perte de 240 k€
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D2 · Personne derrière la porte
    { principale: "R2", secondaires: ["R1"] },
    // D3 · Une association ferme
    { principale: "R4", secondaires: ["R5"] },
    // D4 · Couper dans le temps non facturé
    { principale: "R8", secondaires: ["R6"] },
    // D5 · Le dossier du CPOM
    { principale: "R5", secondaires: ["R10"] },
    // D6 · Préparer l'été
    { principale: "R6", secondaires: ["R8"] },
  ],
  // 85. Les chutes de la nuit
  "chutes-la-nuit": [
    // D1 · Quarante et une chutes
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Les traitements du soir
    { principale: "R6", secondaires: ["R2"] },
    // D3 · Le fils de Mme Lamboley
    { principale: "R9", secondaires: ["R1"] },
    // D4 · Bouger, ou protéger
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Des capteurs pour la nuit
    { principale: "R2", secondaires: ["R4"] },
    // D6 · Les contentions avant l'hiver
    { principale: "R4", secondaires: ["R10"] },
  ],
  // 86. Le dossier de soins que personne ne remplit
  "dossier-de-soins": [
    // D1 · La tablette de nuit dort dans un tiroir
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Des plans de soins qui ne disent pas ce qu'on fait
    { principale: "R9", secondaires: ["R2"] },
    // D3 · Qui accompagne les équipes ?
    { principale: "R6", secondaires: ["R9", "R4"] },
    // D4 · Un pansement non refait
    { principale: "R5", secondaires: ["R4", "R3"] },
    // D5 · La veille canicule commence
    { principale: "R1", secondaires: ["R5"] },
    // D6 · L'été et ses remplaçants
    { principale: "R6", secondaires: ["R4"] },
  ],
  // 87. Passer en douze heures
  "postes-de-douze-heures": [
    // D1 · Une équipe coupée en deux
    { principale: "R4", secondaires: ["R1", "R9"] },
    // D2 · La trame des 12 heures
    { principale: "R5", secondaires: ["R8"] },
    // D3 · Le CSE
    { principale: "R9", secondaires: ["R6"] },
    // D4 · Les premiers chiffres
    { principale: "R3", secondaires: ["R1", "R10"] },
    // D5 · Deux rythmes dans une équipe
    { principale: "R2", secondaires: ["R9"] },
    // D6 · Ce que vous proposez pour janvier
    { principale: "R10", secondaires: ["R6"] },
  ],
  // 88. L'absentéisme qui s'installe
  "absenteisme-qui-s-installe": [
    // D1 · Seize pour cent
    { principale: "R2", secondaires: ["R1"] },
    // D2 · Le planning de mai
    { principale: "R6", secondaires: ["R8"] },
    // D3 · Toujours les mêmes
    { principale: "R1", secondaires: ["R8"] },
    // D4 · Le retour de Fanta
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Les matins du premier étage
    { principale: "R4", secondaires: ["R9"] },
    // D6 · Ce qu'on garde
    { principale: "R3", secondaires: ["R10"] },
  ],
  // 89. Former ses propres soignants
  "former-ses-soignants": [
    // D1 · Trente-quatre postes vacants à la rentrée
    { principale: "R2", secondaires: ["R4", "R6"] },
    // D2 · Qui va suivre les parcours ?
    { principale: "R8", secondaires: ["R6"] },
    // D3 · Une chute la nuit à Montbard
    { principale: "R5", secondaires: ["R4", "R1"] },
    // D4 · L'IFAS ouvre une rentrée en apprentissage
    { principale: "R5", secondaires: ["R8"] },
    // D5 · Orchidia ouvre à Chenôve
    { principale: "R9", secondaires: ["R4"] },
    // D6 · Le jury de la cohorte pilote
    { principale: "R6", secondaires: ["R4", "R2"] },
  ],
  // 90. L'équipe de jour et l'équipe de nuit
  "equipes-jour-et-nuit": [
    // D1 · Deux équipes qui se renvoient la faute
    { principale: "R4", secondaires: ["R9", "R6"] },
    // D2 · Trois minutes à 6 h 45
    { principale: "R6", secondaires: ["R10"] },
    // D3 · Les deux demandes de mutation
    { principale: "R9", secondaires: ["R5"] },
    // D4 · Qui fait quoi, et à quelle heure
    { principale: "R5", secondaires: ["R2", "R9"] },
    // D5 · Une chute à 5 h 40
    { principale: "R4", secondaires: ["R2", "R10"] },
    // D6 · Le roulement du printemps
    { principale: "R6", secondaires: ["R4", "R8"] },
  ],
  // 91. Reconstruire ou regrouper
  "reconstruire-ou-regrouper": [
    // D1 · Deux EHPAD à reprendre
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le dossier d'aide
    { principale: "R1", secondaires: ["R6"] },
    // D3 · Le plafond du département
    { principale: "R5", secondaires: ["R6"] },
    // D4 · Ce que dit le territoire
    { principale: "R3", secondaires: ["R1"] },
    // D5 · Le terrain de Montbard
    { principale: "R5", secondaires: ["R4"] },
    // D6 · Ce qu'on dit aux familles
    { principale: "R10", secondaires: ["R9"] },
  ],
  // 92. L'association qui demande à être reprise
  "association-a-reprendre": [
    // D1 · L'ARS demande une reprise
    { principale: "R2", secondaires: ["R4", "R5"] },
    // D2 · Auditer, et jusqu'où
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Le dossier pour l'ARS
    { principale: "R10", secondaires: ["R5"] },
    // D4 · Le budget commercial de l'ESAT
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Voter, rouvrir, ou se retirer
    { principale: "R3", secondaires: ["R1", "R5"] },
    // D6 · Les équipes des Primevères
    { principale: "R9", secondaires: ["R8"] },
  ],
  // 93. Le virage vers le domicile
  "virage-domiciliaire": [
    // D1 · Le schéma gèle les places
    { principale: "R5", secondaires: ["R4", "R6"] },
    // D2 · Orchidia s'installe à Dijon
    { principale: "R4", secondaires: ["R5"] },
    // D3 · Un centre de ressources territorial
    { principale: "R10", secondaires: ["R4"] },
    // D4 · Les chiffres du dispositif renforcé
    { principale: "R3", secondaires: ["R5"] },
    // D5 · L'accueil de jour de Beaune
    { principale: "R1", secondaires: ["R6"] },
    // D6 · Le mandat de négociation du CPOM
    { principale: "R5", secondaires: ["R6", "R4"] },
  ],
  // 94. Les changements qui mangent la ligne
  "changements-de-format": [
    // D1 · Une ligne à 57 %
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Le chantier des changements
    { principale: "R9", secondaires: ["R6"] },
    // D3 · L'ordre des recettes
    { principale: "R6", secondaires: ["R5"] },
    // D4 · Juin arrive
    { principale: "R4", secondaires: ["R5"] },
    // D5 · Les pots mal scellés
    { principale: "R5", secondaires: [] },
    // D6 · Avant l'été
    { principale: "R6", secondaires: ["R8"] },
  ],
  // 95. Les palettes qui périment
  "dlc-qui-tombe": [
    // D1 · La casse à 2,8 %
    { principale: "R2", secondaires: ["R7"] },
    // D2 · Les volumes de Celtis arrivent trop tard
    { principale: "R1", secondaires: ["R6"] },
    // D3 · Les palettes refusées
    { principale: "R10", secondaires: ["R6", "R4"] },
    // D4 · Celtis facture les ruptures
    { principale: "R5", secondaires: ["R2"] },
    // D5 · L'opération de rentrée
    { principale: "R6", secondaires: ["R1"] },
    // D6 · La règle de l'automne
    { principale: "R9", secondaires: ["R10"] },
  ],
  // 96. Le lot qu'il faut peut-être rappeler
  "lot-a-rappeler": [
    // D1 · Présomptif positif
    { principale: "R4", secondaires: ["R1", "R6"] },
    // D2 · La ligne 3 doit-elle redémarrer ?
    { principale: "R5", secondaires: ["R1"] },
    // D3 · Jusqu'où va le rappel ?
    { principale: "R1", secondaires: ["R3", "R10"] },
    // D4 · Trouver la source
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Celtis veut comprendre
    { principale: "R10", secondaires: ["R9"] },
    // D6 · Que retenir de l'alerte ?
    { principale: "R6", secondaires: ["R10"] },
  ],
  // 97. Les négociations du 1er mars
  "negociations-annuelles": [
    // D1 · Moins 2 %, ou douze références en moins
    { principale: "R6", secondaires: ["R1"] },
    // D2 · La part agricole contestée
    { principale: "R4", secondaires: ["R2"] },
    // D3 · Le reste se négocie
    { principale: "R5", secondaires: ["R4"] },
    // D4 · La pression monte
    { principale: "R1", secondaires: ["R10"] },
    // D5 · Le dernier rendez-vous
    { principale: "R5", secondaires: ["R4"] },
    // D6 · Avant le 1er mars
    { principale: "R6", secondaires: ["R5"] },
  ],
  // 98. La promotion qui remplit les caddies
  "promotion-qui-coute": [
    // D1 · Doubler les opérations de l'été ?
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Mesurer avant de généraliser
    { principale: "R1", secondaires: ["R5"] },
    // D3 · Les volumes annoncés à l'usine
    { principale: "R10", secondaires: ["R6"] },
    // D4 · Les opérations de juillet
    { principale: "R3", secondaires: ["R4", "R6"] },
    // D5 · Nordal attaque
    { principale: "R4", secondaires: ["R5", "R6"] },
    // D6 · La proposition de Celtis
    { principale: "R6", secondaires: ["R4"] },
  ],
  // 99. La marque du distributeur
  "appel-d-offres-mdd": [
    // D1 · Opaline lance son appel d'offres
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Le second tour
    { principale: "R5", secondaires: ["R4"] },
    // D3 · L'audit de Pontivy et le plan de décembre
    { principale: "R3", secondaires: ["R6"] },
    // D4 · Les emballages aux couleurs d'Opaline
    { principale: "R6", secondaires: ["R5"] },
    // D5 · Kerbrélan face à la MDD
    { principale: "R1", secondaires: ["R5"] },
    // D6 · Celtis veut sa MDD
    { principale: "R4", secondaires: ["R2"] },
  ],
  // 100. Les producteurs qui arrêtent
  "producteurs-qui-arretent": [
    // D1 · Le lait qui part
    { principale: "R4", secondaires: ["R1", "R6"] },
    // D2 · Les tournées s'étirent
    { principale: "R6", secondaires: ["R5"] },
    // D3 · Le dispositif d'installation
    { principale: "R6", secondaires: ["R5", "R2"] },
    // D4 · Nordal chez les Guillouzic
    { principale: "R9", secondaires: ["R4"] },
    // D5 · Le pic de Noël
    { principale: "R5", secondaires: ["R4"] },
    // D6 · Les terres qui se libèrent
    { principale: "R2", secondaires: ["R1", "R6"] },
  ],
  // 101. Le pot en plastique qu'il faut remplacer
  "pot-a-remplacer": [
    // D1 · Le carton pour le salon
    { principale: "R1", secondaires: ["R4", "R2"] },
    // D2 · Les bobines de polystyrène
    { principale: "R6", secondaires: ["R5"] },
    // D3 · Choisir la matière
    { principale: "R10", secondaires: ["R4", "R3"] },
    // D4 · Le dossier pour Celtis
    { principale: "R5", secondaires: ["R10"] },
    // D5 · La bascule des lignes
    { principale: "R6", secondaires: ["R4", "R8"] },
    // D6 · Le salon
    { principale: "R10", secondaires: ["R4"] },
  ],
  // 102. La facture d'énergie de l'usine
  "energie-de-l-usine": [
    // D1 · La facture a presque doublé
    { principale: "R1", secondaires: ["R4", "R2"] },
    // D2 · Les premiers relevés
    { principale: "R2", secondaires: ["R1"] },
    // D3 · Une canicule s'annonce
    { principale: "R5", secondaires: ["R4", "R6"] },
    // D4 · La chaleur des groupes froids
    { principale: "R6", secondaires: ["R5"] },
    // D5 · Le contrat d'électricité
    { principale: "R5", secondaires: ["R4"] },
    // D6 · La rentrée
    { principale: "R10", secondaires: ["R6", "R4"] },
  ],
  // 103. La ligne qui s'arrête quand il manque quelqu'un
  "polyvalence-des-operateurs": [
    // D1 · Trois personnes pour une ligne
    { principale: "R4", secondaires: ["R6", "R2"] },
    // D2 · Les réglages qui ne sont écrits nulle part
    { principale: "R6", secondaires: ["R1"] },
    // D3 · Plus de responsabilités, même paie
    { principale: "R9", secondaires: ["R8"] },
    // D4 · Ursuline s'arrête trois semaines
    { principale: "R5", secondaires: ["R4"] },
    // D5 · Cinq semaines de mars
    { principale: "R8", secondaires: ["R4"] },
    // D6 · Préparer l'été sans Yvonnick
    { principale: "R6", secondaires: ["R10"] },
  ],
  // 104. La maintenance qui court après les pannes
  "maintenance-qui-court": [
    // D1 · Dix-neuf heures par mois
    { principale: "R2", secondaires: ["R4", "R1"] },
    // D2 · Neuf heures pour un vérin
    { principale: "R5", secondaires: ["R1"] },
    // D3 · Ce que les conducteurs voient
    { principale: "R9", secondaires: ["R5", "R8"] },
    // D4 · Un morceau de joint
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Produire d'avance
    { principale: "R6", secondaires: ["R4"] },
    // D6 · Le dispositif de décembre
    { principale: "R4", secondaires: ["R6", "R10"] },
  ],
  // 105. Le pic des fêtes
  "pic-des-fetes": [
    // D1 · Le double en décembre
    { principale: "R6", secondaires: ["R4", "R1"] },
    // D2 · Les congés de Noël
    { principale: "R8", secondaires: ["R9", "R4"] },
    // D3 · Ouvrir le week-end
    { principale: "R5", secondaires: ["R9"] },
    // D4 · Deux semaines avant le pic
    { principale: "R4", secondaires: ["R1"] },
    // D5 · Le pic commence
    { principale: "R8", secondaires: ["R6"] },
    // D6 · Les deux semaines de Noël
    { principale: "R4", secondaires: ["R2"] },
  ],
  // 106. Les desserts qui plaisent à l'export
  "export-a-ouvrir": [
    // D1 · Six cents supermarchés, cinq ans d'exclusivité
    { principale: "R1", secondaires: ["R5"] },
    // D2 · Ce qui passe les Pyrénées
    { principale: "R2", secondaires: ["R5"] },
    // D3 · L'étiquette en espagnol
    { principale: "R6", secondaires: ["R5"] },
    // D4 · Un drapeau à Madrid ?
    { principale: "R5", secondaires: ["R4"] },
    // D5 · Les chiffres du test
    { principale: "R3", secondaires: ["R10"] },
    // D6 · Le contrat
    { principale: "R5", secondaires: ["R4"] },
  ],
  // 107. La gamme végétale
  "gamme-vegetale": [
    // D1 · Le rayon qui monte
    { principale: "R5", secondaires: ["R1", "R4"] },
    // D2 · Ce que le test mesurera
    { principale: "R1", secondaires: ["R10"] },
    // D3 · Le lancement
    { principale: "R6", secondaires: ["R4"] },
    // D4 · Les créneaux du façonnier
    { principale: "R5", secondaires: ["R6"] },
    // D5 · Ce que dit le test
    { principale: "R3", secondaires: ["R10", "R4"] },
    // D6 · Produire après le test
    { principale: "R6", secondaires: ["R5"] },
  ],
  // 108. L'offre de rachat
  "offre-de-rachat": [
    // D1 · L'offre de Nordal
    { principale: "R4", secondaires: ["R2", "R5"] },
    // D2 · Ouvrir les comptes à un concurrent
    { principale: "R1", secondaires: ["R6"] },
    // D3 · L'offre expire dans deux semaines
    { principale: "R5", secondaires: ["R4"] },
    // D4 · Le rapport d'audit
    { principale: "R4", secondaires: ["R10"] },
    // D5 · Le protocole de cession
    { principale: "R5", secondaires: ["R6"] },
    // D6 · Les producteurs du Méné
    { principale: "R3", secondaires: ["R6"] },
  ],
};
