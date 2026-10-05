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
};
