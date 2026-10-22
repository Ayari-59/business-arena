import type { EngineScenarioConfig } from "../../engine/types";
import {
  applyPeriodicity,
  composerPerte,
  PERIODICITY_DAYS,
  periodicityFromRoundDays,
  type Periodicity,
} from "./periodicity";
import type { SituationDef } from "./situation-kit";
// conseil-hotel : l'entreprise de départ, d'où se lisent les jours-consultants et les nuitées.
import { applyPeriodicityToCompany } from "./periodicity";
import { conseilCompany } from "./conseil";
import { conseilGammeCompany } from "./conseil-gamme";
import { hotelCompany } from "./hotel";
import { hotelGammeCompany } from "./hotel-gamme";
import { isProductAvailable } from "../../engine/gamme";
import { NOVA_HOME } from "../groupe/nova";
import { applyRoundsCount } from "./rounds";
import { auCalendrierMensuel, MOIS_MAX, tourDuTrimestre, trimestresDeLaPartie } from "./calendrier-mensuel";

/**
 * LE TEXTE D'UNE SITUATION SE REND À LA DURÉE DU TOUR DE SA PARTIE.
 *
 * Une partie se joue au mois, au trimestre ou à l'année (ADR-01) : le moteur
 * multiplie les flux par k = jours / 90. Les situations, elles, étaient écrites
 * au trimestre, montants compris. Une salle de VOLT FITNESS jouée au mois
 * facture 35 € par adhérent et en garde 30 de marge ; son énoncé disait « 105 €
 * par trimestre » et « 90 € de marge ». La situation entière était fausse, et
 * rien ne le signalait.
 *
 * DES JETONS DANS LES CHAÎNES, ET NON DES FONCTIONS DU SCÉNARIO. Le choix tient
 * à ce qu'une situation est une DONNÉE : on la sème en base
 * (`pedagogy-seed.service`), on la copie dans un scénario d'enseignant
 * (`serialize.ts`), on en édite le texte (`situation-patch.ts`), on en compte les
 * signes (`duree-du-tour.ts`). Une fonction ne survit à aucun de ces trajets ;
 * une chaîne à jetons, si. Le dépôt a déjà ce patron pour les guides
 * (`config/guides/jetons.ts`, `{{nom}}`), et un énoncé à jetons se lit encore
 * comme une phrase : « paient {{entier: abonnement}} € {{par trimestre}} ».
 *
 * Deux sortes de jetons.
 *  · Les MOTS DE DURÉE s'écrivent tels qu'au trimestre : `{{par trimestre}}`,
 *    `{{du trimestre}}`, `{{trimestrielle}}`. La table ci-dessous dit ce qu'ils
 *    deviennent au mois et à l'année. Les mots retenus sont masculins (mois,
 *    exercice), pour ne casser aucun accord ; l'article fait partie du jeton
 *    quand l'élision le change (« du trimestre », « de l'exercice »). Un jeton
 *    qui commence par une majuscule rend sa forme capitalisée.
 *  · Les MONTANTS s'écrivent `{{format: expression}}`. L'expression lit des
 *    grandeurs du scénario (`abonnement`, `marge`, `charges`, `attrition`…) :
 *    aucun montant de configuration n'est écrit à la main, conformément à la
 *    règle du dépôt.
 *
 * D'OÙ SE LISENT LES MONTANTS. Du scénario de la partie mis à SA durée de tour
 * par `applyPeriodicity` même : la règle du moteur, pas une copie. Le scénario
 * est celui de la définition (le registre pour un secteur intégré), et non
 * l'instantané brut de la partie : le monde variable, coché par défaut, tire les
 * charges de structure à plus ou moins 2 %, et l'instantané d'une partie au
 * trimestre aurait fait dire « 106 438 € » là où l'énoncé dit « 105 000 € »
 * depuis toujours. Le texte d'une partie au trimestre reste donc, octet pour
 * octet, celui d'avant ; au mois et à l'année, il dit ce que le moteur facture
 * dans le monde figé (garde : tests/scenarios/textes-a-la-duree.test.ts).
 *
 * LE REGISTRE GARDE LE TEXTE AU TRIMESTRE. `situationsAuTrimestre` rend les
 * sources une fois, au chargement, et c'est ce rendu que portent
 * `scenarioByCode(…).situations` et `situationByCode`. Un chemin qui n'a pas de
 * partie (catalogue, éditeur, référentiel semé) lit donc la version
 * trimestrielle sans rien faire, et un chemin oublié montrerait le texte d'hier,
 * jamais des accolades. Un chemin qui a une partie passe par
 * `situationDeLaPartie`, qui retrouve la source par l'identité de l'objet.
 */

// ---------------------------------------------------------------------------
// Les mots de durée
// ---------------------------------------------------------------------------

/**
 * Ce que devient, au mois et à l'année, une tournure écrite au trimestre. La clé
 * est le texte au trimestre, sauf quand elle ne peut pas l'être : `quarter` le
 * porte alors (« quatre trimestres » rend « 4 trimestres », sans chiffre dans la
 * clé d'un mot).
 */
const MOTS: Record<string, { month: string; year: string; quarter?: string }> = {
  trimestre: { month: "mois", year: "exercice" },
  trimestres: { month: "mois", year: "exercices" },
  "par trimestre": { month: "par mois", year: "par an" },
  "le trimestre": { month: "le mois", year: "l'exercice" },
  "du trimestre": { month: "du mois", year: "de l'exercice" },
  "au trimestre": { month: "au mois", year: "à l'exercice" },
  "de trimestre": { month: "de mois", year: "d'exercice" },
  "de trimestres": { month: "de mois", year: "d'exercices" },
  "ce trimestre": { month: "ce mois-ci", year: "cet exercice" },
  "ce trimestre-ci": { month: "ce mois-ci", year: "cet exercice" },
  trimestriel: { month: "mensuel", year: "annuel" },
  trimestrielle: { month: "mensuelle", year: "annuelle" },
  trimestriels: { month: "mensuels", year: "annuels" },
  trimestrielles: { month: "mensuelles", year: "annuelles" },
  // À l'année, l'engagement annuel EST le tour : la tournure se décale d'un cran.
  "engagements annuels plutôt que trimestriels": {
    month: "engagements annuels plutôt que mensuels",
    year: "engagements pluriannuels plutôt qu'annuels",
  },
  // --- transport-bistrot ---------------------------------------------------
  // Un placement est bloqué UN tour (`placement_arrive_a_terme`, finance/statements.ts) :
  // « à trois mois » au trimestre, c'est « jusqu'au tour suivant ».
  "à trois mois": { month: "à un mois", year: "à un an" },
  // --- fin transport-bistrot -----------------------------------------------
  // Une campagne de crédit : « avant la fin du second mois » donnait un rang de mois, et la
  // campagne, au mois sur le calendrier, dure en temps réel (`calendrier-mensuel.ts`).
  "avant la fin du second trimestre": { month: "avant la fin de la campagne", year: "avant la fin du second exercice" },
  // --- conseil-hotel ---
  // Un flux annuel écrit comme quatre tours d'un trimestre : douze tours d'un mois, un seul d'un an.
  // La formule l'écrit en chiffres (« × 4 trimestres ») ; la clé, en lettres.
  "quatre trimestres": { quarter: "4 trimestres", month: "12 mois", year: "1 exercice" },
  // --- nova-courriers : les tournures des situations NOVA et des courriers ---
  "ce trimestre-là": { month: "ce mois-là", year: "cet exercice-là" },
  // --- retouches ---
  // Un tour d'un an se clôt sur les comptes annuels : la situation n'y est plus « intermédiaire ».
  "situation intermédiaire": { month: "situation intermédiaire", year: "situation comptable" },
  // « Aucun effet sur ce mois-ci » : le « -ci » n'y désigne rien que « ce mois » ne dise.
  "sur ce trimestre": { month: "sur ce mois", year: "sur cet exercice" },
  // L'échelle d'une commande d'office : « (échelle exercice) » se dit « (échelle annuelle) ».
  "échelle trimestre": { month: "échelle mois", year: "échelle annuelle" },
  // VOLT FITNESS : l'adhérent paie à chaque tour, et chaque mois quand le tour dure un an
  // (`echeance`) ; sans quoi la formule annuelle ne se comparerait plus à rien.
  "par trimestre aujourd'hui": { month: "par mois aujourd'hui", year: "par mois aujourd'hui" },
  // Un engagement d'un an ne dépasse pas l'exercice quand le tour dure un an : il le couvre.
  "au-delà du trimestre": { month: "au-delà du mois", year: "sur tout l'exercice" },
  // --- groupe batiment-boutique-ecommerce ---
  // Une part du tour, à la même cadence : deux mois de location sur trois en
  // font vingt jours sur trente, et huit mois sur douze.
  "deux mois par trimestre": { month: "vingt jours par mois", year: "huit mois par an" },
  "qu'un mois par trimestre": { month: "que dix jours par mois", year: "que quatre mois par an" },
  // Un budget plus fin que le tour : un cran sous la durée du tour.
  "mois par mois, pas trimestre par trimestre": {
    month: "semaine par semaine, pas mois par mois",
    year: "mois par mois, pas exercice par exercice",
  },
  // --- fin du groupe batiment-boutique-ecommerce ---
  // --- groupe fitness-nova-batiment-transport : le récit des saisons ---
  // La saisonnalité se lit une valeur par tour à toutes les durées (ADR-01) : au mois,
  // le tour 3 de VOLT FITNESS n'est pas juillet ; à l'année, il n'est pas l'été. Au mois
  // et à l'année, le récit dit donc ce que le tour EST pour le moteur (le creux, le pic,
  // la vague d'inscriptions), jamais le moment du calendrier. Aucune nouvelle sorte de
  // jeton : une tournure de la table, dont la clé est le texte au trimestre, rendu tel
  // quel. Une phrase entière quand elle ne porte ni chiffre (garde : un mot de durée
  // n'en porte aucun) ni autre jeton ; sinon, le plus court passage qui date.
  // Garde : tests/scenarios/saisons-fitness-nova-batiment-transport.test.ts.
  //
  // VOLT FITNESS. Marché [1,5 ; 0,9 ; 0,5 ; 1,0 ; 1,5 ; 0,9] : la vague des bonnes
  // résolutions aux tours 1 et 5, le creux au tour 3 (l'attrition y monte de moitié),
  // la reprise au tour 4.
  "mais l'été arrive": { month: "mais le creux de la saison viendra", year: "mais le creux de la saison viendra" },
  "inscrits de janvier": { month: "inscrits des bonnes résolutions", year: "inscrits des bonnes résolutions" },
  "Comparez deux adhérents : celui de janvier qui part en avril, et le régulier présent depuis six ans.": {
    month: "Comparez deux adhérents : celui des bonnes résolutions qui part sitôt l'élan retombé, et le régulier présent depuis six ans.",
    year: "Comparez deux adhérents : celui des bonnes résolutions qui part sitôt l'élan retombé, et le régulier présent depuis six ans.",
  },
  "Le creux de l'été": { month: "Le creux de la saison", year: "Le creux de la saison" },
  "Juillet. Le plateau est vide à quatorze heures, les cours collectifs sont annulés faute d'inscrits, et la moitié des adhérents de janvier ne s'est pas réinscrite.": {
    month: "Saison creuse. Le plateau est vide à quatorze heures, les cours collectifs sont annulés faute d'inscrits, et la moitié des adhérents des bonnes résolutions ne s'est pas réinscrite.",
    year: "Plein creux. Le plateau est vide à quatorze heures, les cours collectifs sont annulés faute d'inscrits, et la moitié des adhérents des bonnes résolutions ne s'est pas réinscrite.",
  },
  "Licencier l'équipe pour l'été et réembaucher en septembre": {
    month: "Licencier l'équipe pour le creux et réembaucher à la reprise",
    year: "Licencier l'équipe pour le creux et réembaucher à la reprise",
  },
  "La demande chute de moitié en juillet. De combien baissent vos charges de structure ?": {
    month: "La demande chute en saison creuse. De combien baissent vos charges de structure ?",
    year: "La demande chute de moitié au creux. De combien baissent vos charges de structure ?",
  },
  // L'option qui reprenait « de moitié » : au mois, l'énoncé ne dit plus de combien.
  "De moitié également": { month: "Dans la même proportion", year: "De moitié également" },
  "Comment traverser un trimestre où la demande s'effondre alors que les charges ne bougent pas ?": {
    month: "Comment traverser une saison où la demande s'effondre alors que les charges ne bougent pas ?",
    year: "Comment traverser un exercice où la demande s'effondre alors que les charges ne bougent pas ?",
  },
  "Tout le reste continue de courir : c'est ce qui rend le creux d'été si dangereux.": {
    month: "Tout le reste continue de courir : c'est ce qui rend le creux de la saison si dangereux.",
    year: "Tout le reste continue de courir : c'est ce qui rend le creux de la saison si dangereux.",
  },
  "Un été qui en fait partir": { month: "Un creux qui en fait partir", year: "Un creux qui en fait partir" },
  "Le creux de l'été se prépare avant : une campagne ciblée au printemps ou une offre estivale peut limiter la chute des inscriptions.": {
    month: "Le creux se prépare avant : une campagne ciblée au tour qui le précède ou une offre pensée pour le creux peut limiter la chute des inscriptions.",
    year: "Le creux se prépare avant : une campagne ciblée au tour qui le précède ou une offre pensée pour le creux peut limiter la chute des inscriptions.",
  },
  "un tarif estival réduit": { month: "un tarif réduit pour le creux", year: "un tarif réduit pour le creux" },
  "L'été est le moment idéal pour l'entretien lourd, mais ne coupez pas la maintenance visible : les adhérents qui restent jugent la salle vide plus sévèrement.": {
    month: "Le creux est le moment idéal pour l'entretien lourd, mais ne coupez pas la maintenance visible : les adhérents qui restent jugent la salle vide plus sévèrement.",
    year: "Le creux est le moment idéal pour l'entretien lourd, mais ne coupez pas la maintenance visible : les adhérents qui restent jugent la salle vide plus sévèrement.",
  },
  "Le chiffre d'affaires d'un abonnement annuel encaissé en janvier…": {
    month: "Le chiffre d'affaires d'un abonnement annuel encaissé à l'inscription…",
    year: "Le chiffre d'affaires d'un abonnement annuel encaissé à l'inscription…",
  },
  "ou une seule fois en janvier ?": { month: "ou une seule fois, à l'inscription ?", year: "ou une seule fois, à l'inscription ?" },
  "Ajoutez enfin l'attrition évitée : un adhérent engagé douze mois ne part pas en mars.": {
    month: "Ajoutez enfin l'attrition évitée : un adhérent engagé douze mois ne part pas au creux.",
    year: "Ajoutez enfin l'attrition évitée : un adhérent engagé douze mois ne part pas au creux.",
  },
  //
  // NOVA et NOVA · GAMME. Le pic au tour 4 (marché à 1,35, la Go à 1,9, le module radio
  // y rompt plus souvent), le contrecoup au tour 5. L'arc CampusTech n'est pas une
  // saison : il reste tel quel.
  "Qu'est-ce qui limite réellement votre production, et que pouvez-vous y faire avant le pic de fin d'année ?": {
    month: "Qu'est-ce qui limite réellement votre production, et que pouvez-vous y faire avant le pic à venir ?",
    year: "Qu'est-ce qui limite réellement votre production, et que pouvez-vous y faire avant le pic du tour suivant ?",
  },
  "qu'elle rapportera d'ici Noël": { month: "qu'elle rapportera d'ici le pic", year: "qu'elle rapportera d'ici le pic" },
  "Quelle référence produire en priorité, et que préparer avant le pic de fin d'année ?": {
    month: "Quelle référence produire en priorité, et que préparer avant le pic à venir ?",
    year: "Quelle référence produire en priorité, et que préparer avant le pic du tour suivant ?",
  },
  "Il faut produire AVANT le pic pour constituer du stock, sur les références qui se vendront à Noël": {
    month: "Il faut produire AVANT le pic pour constituer du stock, sur les références qui se vendront au pic",
    year: "Il faut produire AVANT le pic pour constituer du stock, sur les références qui se vendront au pic",
  },
  "Le stock immobilise du cash, mais il sauve les ventes : et sur une gamme, on stocke ce qui se vendra à Noël, la Go des cadeaux avant tout.": {
    month: "Le stock immobilise du cash, mais il sauve les ventes : et sur une gamme, on stocke ce qui se vendra au pic, la Go des cadeaux avant tout.",
    year: "Le stock immobilise du cash, mais il sauve les ventes : et sur une gamme, on stocke ce qui se vendra au pic, la Go des cadeaux avant tout.",
  },
  "pour stocker la Go et la One avant Noël": { month: "pour stocker la Go et la One avant le pic", year: "pour stocker la Go et la One avant le pic" },
  "Trimestre record : Noël a doublé les Go, CampusTech a passé sa grosse commande de One, les studios ont pris leurs Studio.": {
    month: "La haute saison s'ouvre : CampusTech a passé sa grosse commande de One, et la grande distribution remplit ses rayons de Go.",
    year: "Exercice record : le pic des cadeaux a doublé les Go, CampusTech a passé sa grosse commande de One, les studios ont pris leurs Studio.",
  },
  // NOVA : le paradoxe du succès s'ouvre au premier mois des fêtes, pas à leur sommet.
  "Trimestre record : le pic saisonnier et la grosse commande CampusTech gonflent votre chiffre d'affaires": {
    month: "La haute saison s'ouvre et la grosse commande CampusTech gonfle votre chiffre d'affaires",
    year: "Exercice record : le pic saisonnier et la grosse commande CampusTech gonflent votre chiffre d'affaires",
  },
  // Le tour du trimestre 2 suit le premier ; au mois sur le calendrier, la situation s'ouvre
  // en avril (ou au premier mois d'une partie commencée en mai ou en juin) : le mois qui
  // vient de se clore n'est le premier que d'une partie commencée en mars.
  "Le premier tour est bouclé.": { month: "Le mois écoulé est bouclé.", year: "Le premier tour est bouclé." },
  "Vos ventes du premier tour sont tombées.": {
    month: "Vos ventes du mois écoulé sont tombées.",
    year: "Vos ventes du premier tour sont tombées.",
  },
  "Le premier tour a tranché.": { month: "Le mois écoulé a tranché.", year: "Le premier tour a tranché." },
  // Le pic que la production doit précéder : au trimestre, le tour qui suit ; au mois, des mois plus loin.
  "le pic du tour quatre": { quarter: "le pic du tour 4", month: "le pic à venir", year: "le pic du tour 4" },
  "Une innovation se lance quand son marché est connu, quitte à arriver après Noël": {
    month: "Une innovation se lance quand son marché est connu, quitte à arriver après le pic",
    year: "Une innovation se lance quand son marché est connu, quitte à arriver après le pic",
  },
  "Et Noël arrive : c'est là que le module radio manque le plus souvent.": {
    month: "Et la haute saison s'ouvre : c'est là que le module radio manque le plus souvent.",
    year: "Et le pic est là : c'est là que le module radio manque le plus souvent.",
  },
  "Faut-il la pousser avant Noël, ou garder l'atelier pour la One ?": {
    month: "Faut-il la pousser en haute saison, ou garder l'atelier pour la One ?",
    year: "Faut-il la pousser en plein pic, ou garder l'atelier pour la One ?",
  },
  "Un fournisseur se juge aussi à sa tenue aux pics : un module qui manque à Noël coûte les ventes du meilleur tour": {
    month: "Un fournisseur se juge aussi à sa tenue aux pics : un module qui manque au pic coûte les ventes du meilleur tour",
    year: "Un fournisseur se juge aussi à sa tenue aux pics : un module qui manque au pic coûte les ventes du meilleur tour",
  },
  // MARTEL & FILS : le carnet du cinquième tour. Au mois sur le calendrier, il s'ouvre en
  // janvier, le mois du gel, sous un mois ordinaire ; c'est la saison qui s'ouvre, celle du
  // premier trimestre, qui déborde.
  "Le carnet déborde": { month: "Le carnet de la saison qui s'ouvre déborde", year: "Le carnet déborde" },
  // --- fin du groupe fitness-nova-batiment-transport ---
  // --- hotel-bistrot-conseil : le récit des saisons ------------------------
  // Au trimestre, le tour 3 de L'ESCALE est l'été, celui du bistrot et du cabinet le
  // creux d'août, le tour 4 du bistrot décembre. Au mois et à l'année, la saisonnalité
  // se lit encore une valeur par tour (ADR-01) : le tour reste le pic ou le creux, il
  // n'est plus une date. Ces phrases disent donc ce que le tour EST, la même forme aux
  // deux durées (`aLaSaison`, en bas du bloc). Une phrase entière par jeton ; quand
  // elle porte un chiffre, le jeton s'arrête avant lui, car un mot de durée n'en porte
  // aucun. Chaque affirmation est vérifiée au tableau de saisonnalité
  // (tests/scenarios/saisons-hotel-bistrot-conseil.test.ts).
  // L'ESCALE, et sa gamme : le tour 3 est le pic, les tours creux suivent.
  // Au mois sur le calendrier, la situation s'ouvre en juillet, ou au premier mois d'une partie
  // commencée en août ou en septembre : le plus chargé est août, et septembre en sort. Ce qui
  // reste vrai des trois mois : la haute saison, les loisirs au-dessus d'une fois et demie,
  // les affaires et les séminaires sous leur niveau ordinaire.
  "L'été approche : le tourisme de loisirs double, la clientèle affaires s'effondre et les séminaires disparaissent complètement.": {
    month: "La haute saison est là : le tourisme de loisirs bondit, la clientèle affaires recule et les séminaires se font rares.",
    year: "Votre tour le plus chargé approche : le tourisme de loisirs double, la clientèle affaires s'effondre et les séminaires disparaissent complètement.",
  },
  "L'été approche : le tourisme de loisirs double sur les standard, les escapades remplissent les supérieures, la clientèle affaires s'effondre et les séminaires disparaissent.": {
    month: "La haute saison est là : le tourisme de loisirs bondit sur les standard, les escapades remplissent les supérieures, la clientèle affaires recule et les séminaires se font rares.",
    year: "Votre tour le plus chargé approche : le tourisme de loisirs double sur les standard, les escapades remplissent les supérieures, la clientèle affaires s'effondre et les séminaires disparaissent.",
  },
  "La haute saison arrive": { month: "La haute saison est là", year: "La haute saison arrive" },
  "Vos concurrents affichent déjà leurs tarifs de juillet.": aLaSaison("Vos concurrents affichent déjà leurs tarifs de haute saison."),
  "Vos concurrents affichent déjà leurs tarifs de juillet, chambre par chambre.":
    aLaSaison("Vos concurrents affichent déjà leurs tarifs de haute saison, chambre par chambre."),
  "Le mix de clientèle change : le segment qui domine l'été n'a ni la même élasticité ni le même délai de paiement":
    aLaSaison("Le mix de clientèle change : le segment qui domine la haute saison n'a ni la même élasticité ni le même délai de paiement"),
  "Le mix de clientèle change par type de chambre : le segment qui domine l'été n'a ni la même élasticité ni le même délai de paiement":
    aLaSaison("Le mix de clientèle change par type de chambre : le segment qui domine la haute saison n'a ni la même élasticité ni le même délai de paiement"),
  "L'été, la clientèle loisirs": aLaSaison("En haute saison, la clientèle loisirs"),
  "L'été, les affaires tombent": aLaSaison("À ce tour, les affaires tombent"),
  "La forte demande estivale": aLaSaison("La forte demande de la haute saison"),
  "Décider en juillet pour juillet, c'est décider trop tard.": {
    month: "Décider en pleine saison pour la saison, c'est décider trop tard.",
    year: "Décider pendant le pic pour le pic, c'est décider trop tard.",
  },
  // LA TABLE D'AUGUSTIN, et sa gamme : le tour 3 est le creux, le tour 4 le pic des banquets.
  // Au mois sur le calendrier, la situation des denrées s'ouvre en juillet (ou au premier
  // mois d'une partie commencée en août ou en septembre) : le plus creux est août. Les trois
  // mois sont la saison creuse, le midi d'affaires sous son niveau ordinaire. Celle des
  // banquets s'ouvre en octobre (ou en novembre, en décembre) : le plus gros mois est
  // décembre, mais les trois sont la saison où les banquets dépensent le plus.
  "Nous sommes en août, la salle est à moitié vide et les bureaux du quartier sont fermés.": {
    month: "Vous êtes en saison creuse : la salle se clairsème et les bureaux du quartier se vident.",
    year: "Vous êtes au plus creux de l'activité : la salle est à moitié vide et les bureaux du quartier se sont vidés.",
  },
  "Nous sommes en août, la salle est à moitié vide, les bureaux du quartier sont fermés et les banquets attendent décembre.": {
    month: "Vous êtes en saison creuse : la salle se clairsème, les bureaux du quartier se vident et les banquets attendent leur saison.",
    year: "Vous êtes au plus creux de l'activité : la salle est à moitié vide, les bureaux du quartier se sont vidés et les banquets attendent leur plus gros tour.",
  },
  "en plein creux d'août, c'est hors d'atteinte.": {
    month: "en saison creuse, c'est hors d'atteinte.",
    year: "en plein creux de l'activité, c'est hors d'atteinte.",
  },
  "Le mois d'août amplifie tout": { month: "La saison creuse amplifie tout", year: "Le creux de l'activité amplifie tout" },
  "En août, la demande chute : ajustez la préparation à la baisse pour éviter le gâchis de denrées déjà plus chères.": {
    month: "En saison creuse, la demande chute : ajustez la préparation à la baisse pour éviter le gâchis de denrées déjà plus chères.",
    year: "Au creux de l'activité, la demande chute : ajustez la préparation à la baisse pour éviter le gâchis de denrées déjà plus chères.",
  },
  // Le jeton porte « ce trimestre » en toutes lettres : au mois, dire que le budget annuel
  // tombe sur un mois, à l'année qu'il tombe sur l'année, ne dirait plus rien du pic.
  "Décembre arrive : les repas d'entreprise et les banquets de fin d'année concentrent l'essentiel de leur budget annuel sur ce trimestre": {
    month: "La saison des banquets est là : les repas d'entreprise et les banquets y dépensent plus qu'en aucune autre saison",
    year: "Votre plus gros tour arrive : les repas d'entreprise et les banquets y dépensent plus qu'à aucun autre tour",
  },
  "La demande de décembre bondit : ajustez la préparation à la hausse, mais restez sous les plafonds salle et brigade pour éviter le gâchis de denrées perdues.": {
    month: "La demande de la saison des banquets bondit : ajustez la préparation à la hausse, mais restez sous les plafonds salle et brigade pour éviter le gâchis de denrées perdues.",
    year: "La demande de votre plus gros tour bondit : ajustez la préparation à la hausse, mais restez sous les plafonds salle et brigade pour éviter le gâchis de denrées perdues.",
  },
  // Le coefficient que l'indice demande de lire : au trimestre, celui du quatrième ; au mois,
  // celui du mois où la situation s'ouvre, que l'indice suivant cite (`saisonLue`).
  "au quatrième trimestre": { month: "ce mois-ci", year: "au quatrième exercice" },
  "Anticipez l'entretien pour éviter une panne en plein rush de décembre.":
    aLaSaison("Anticipez l'entretien pour éviter une panne en plein rush des banquets."),
  // La verrière : le moteur ajoute sa capacité à chaque tour ; c'est le temps qu'il fait, pas la date, qui vide la terrasse.
  "mais du printemps à l'automne seulement : en plein hiver, personne ne s'y installe.":
    aLaSaison("mais seulement quand le temps s'y prête : par grand froid, personne ne s'y installe."),
  // ATLAS CONSEIL, et sa gamme : le tour 3 est le creux, celui des marchés publics aussi.
  // Au mois sur le calendrier, juillet, août ou septembre : le plus creux est août, mais les
  // trois mois sont la saison creuse du cabinet, chaque offre sous son niveau ordinaire.
  "L'été : les décideurs sont en congés, les marchés publics ne se notifient plus, le carnet se vide.": {
    month: "La saison creuse : les décideurs lèvent le pied, les marchés publics ne se notifient plus, le carnet se vide.",
    year: "Votre tour le plus creux : les décideurs lèvent le pied, les marchés publics ne se notifient plus, le carnet se vide.",
  },
  "L'été : les décideurs sont en congés, les marchés publics ne se notifient plus, la stratégie s'arrête, l'audit tourne au ralenti.": {
    month: "La saison creuse : les décideurs lèvent le pied, les marchés publics ne se notifient plus, la stratégie et l'audit tournent au ralenti.",
    year: "Votre tour le plus creux : les décideurs lèvent le pied, les marchés publics ne se notifient plus, la stratégie s'arrête, l'audit tourne au ralenti.",
  },
  // Les DSI creusent le moins au tour 3 de la gamme (`dsi`) : c'est ce qui reste vrai de « ne connaît pas les congés ».
  "Le creux de l'été est aussi le moment où une offre cyber-sécurité, qui ne connaît pas les congés, remplit le banc sans brader.": {
    month: "La saison creuse est aussi le moment où une offre cyber-sécurité, que les DSI continuent d'acheter, remplit le banc sans brader.",
    year: "Ce tour creux est aussi le moment où une offre cyber-sécurité, que les DSI continuent d'acheter, remplit le banc sans brader.",
  },
  // --- fin hotel-bistrot-conseil -------------------------------------------
  // --- groupe boutique-ecommerce : le récit des saisons ---------------------
  // MAILLE & CO et PIXEL & CO racontaient Noël, les soldes, les fêtes et la
  // rentrée. La saisonnalité se lit une valeur par tour à toutes les durées
  // (`periodicity.ts`) : au mois et à l'année, le tour 4 reste le pic, mais il
  // n'est pas décembre. La phrase entière est le jeton, écrite telle qu'au
  // trimestre ; elle dit, au mois et à l'année, ce que le tour EST pour le
  // moteur (le pic, le tour qui le suit), vérifié sur les tableaux de chaque
  // scénario. Aucune sorte de jeton nouvelle : une chaîne seule vaut pour le mois
  // et pour l'année, un couple quand l'une des deux formes sonnerait faux.
  // Garde : tests/scenarios/saisons-boutique-ecommerce.test.ts.
  ...Object.fromEntries(
    Object.entries({
      // MAILLE & CO, gamme et mono : le tour 4 est le plus haut de la boutique (1,5 ;
      // 1,45 en mono) et de chaque référence (jusqu'à 2,3 sur les accessoires), sauf
      // le cardigan, pièce de mi-saison dont le récit ne dit pas le pic.
      //
      // AU MOIS SUR LE CALENDRIER, la situation du pic s'ouvre en octobre, ou au premier mois
      // d'une partie commencée en novembre ou en décembre : le plus gros mois de la maille
      // est décembre (septembre en mono-produit, la rentrée y pèse plus), celui de PIXEL &
      // CO novembre. Ce qui est vrai des trois : c'est la saison qui fait l'année. Ce qu'elle
      // pèse se dit de la saison entière, dont les trois mois font ensemble le trimestre
      // (`calendrier-mensuel.ts`) ; ce que pèse le mois, l'indice le lit dans la partie
      // (`saisonLue`). Une forme par durée : l'année garde la sienne.
      "Le trimestre qui fait l'année": { month: "La saison qui fait l'année", year: "Le plus gros tour de la partie" },
      "La maille se vend l'hiver : au quatrième trimestre, les pulls partent une fois et demie plus vite, les écharpes et les bonnets plus de deux fois, et les comités d'entreprise passent leurs dotations.": {
        month:
          "C'est la saison qui fait la maille : les pulls y partent une fois et demie plus vite, les écharpes et les bonnets plus de deux fois, et les comités d'entreprise passent leurs dotations.",
        year: "C'est le plus gros tour de la maille : les pulls partent une fois et demie plus vite, les écharpes et les bonnets plus de deux fois, et les comités d'entreprise passent leurs dotations.",
      },
      "Le quatrième trimestre pèse près d'une fois et demie un trimestre ordinaire, et les comités d'entreprise passent leurs commandes de fin d'année.": {
        month: "Cette saison pèse près d'une fois et demie une saison ordinaire, et les comités d'entreprise y passent leurs plus grosses commandes.",
        year: "Ce tour pèse près d'une fois et demie un tour ordinaire, et les comités d'entreprise y passent leurs plus grosses commandes.",
      },
      "Le quatrième trimestre pèse plus d'une fois et demie un trimestre ordinaire.": {
        month: "Cette saison pèse plus d'une fois et demie une saison ordinaire.",
        year: "Le quatrième exercice pèse plus d'une fois et demie un exercice ordinaire.",
      },
      "Le quatrième trimestre pèse plus d'une fois et demie un trimestre ordinaire, et les luminaires s'y vendent presque le double.": {
        month: "Cette saison pèse plus d'une fois et demie une saison ordinaire, et les luminaires s'y vendent presque le double.",
        year: "Le quatrième exercice pèse plus d'une fois et demie un exercice ordinaire, et les luminaires s'y vendent presque le double.",
      },
      // L'indice du pic : au mois, le coefficient lu est celui du mois, pas celui du pic.
      "Le pic vaut": { month: "Ce mois vaut", year: "Le pic vaut" },
      "les accessoires plus du double": { month: "les accessoires davantage", year: "les accessoires plus du double" },
      "les comités d'entreprise concentrent l'essentiel de leur budget sur ce tour": {
        month: "les comités d'entreprise concentrent l'essentiel de leur budget sur cette saison",
        year: "les comités d'entreprise concentrent l'essentiel de leur budget sur ce tour",
      },
      // Le coefficient d'un mois se rapporte à un mois ordinaire, pas au mois d'avant.
      "vos ventes du tour précédent": { month: "vos ventes d'un mois ordinaire", year: "vos ventes du tour précédent" },
      "La marge par pièce ne tranche que lorsque les références se disputent une place limitée — la réserve à Noël, par exemple.":
        "La marge par pièce ne tranche que lorsque les références se disputent une place limitée, comme la réserve au tour du pic.",
      "Combien commander pour Noël, de quelle référence, et à quel risque ?":
        "Combien commander pour ce pic, de quelle référence, et à quel risque ?",
      "Combien commander pour Noël, et que risquez-vous en vous trompant dans un sens ou dans l'autre ?":
        "Combien commander pour ce pic, et que risquez-vous en vous trompant dans un sens ou dans l'autre ?",
      "Trop peu : des ventes définitivement perdues. Trop : du stock payé qui dort jusqu'au printemps":
        "Trop peu : des ventes définitivement perdues. Trop : du stock payé qui dort une fois le pic passé",
      "Attendre les premières ventes de décembre pour se réapprovisionner":
        "Attendre les premières ventes du pic pour se réapprovisionner",
      "Attendre de voir les premières ventes de décembre pour se réapprovisionner":
        "Attendre de voir les premières ventes du pic pour se réapprovisionner",
      "À Noël": "Au tour du pic",
      "À Noël votre trafic passe": "Au tour du pic, votre trafic passe",
      "la demande de Noël la dépasse": "la demande du pic la dépasse",
      "À Noël, certains segments sont moins sensibles au prix : c'est le moment de placer les références à plus forte marge et de soigner le panier moyen.":
        "Au tour du pic, certains segments sont moins sensibles au prix : c'est le moment de placer les références à plus forte marge et de soigner le panier moyen.",
      // Le tour 5 suit le pic dans tous les tableaux.
      // Janvier : le plus gros mois de la maille mono-produit est septembre, mais la saison
      // forte, celle d'octobre à décembre, vient de se clore.
      "Le trimestre de Noël vient de vider votre trésorerie dans le réassort.": {
        month: "La saison forte vient de vider votre trésorerie dans le réassort.",
        year: "Le tour du pic vient de vider votre trésorerie dans le réassort.",
      },
      // Le déstockage du tour 3 : le tour 4, juste après, est le pic de la maille
      // (les écharpes et les bonnets y font plus du double d'un tour ordinaire).
      "Solder, ou garder pour l'an prochain": "Solder, ou garder pour la prochaine collection",
      "de la collection de printemps": "de la dernière collection",
      "refuser, c'est occuper une réserve jusqu'au printemps prochain, quand la collection aura tourné":
        "refuser, c'est occuper une réserve pendant des tours, le temps que la collection tourne",
      "refuser, c'est occuper une réserve jusqu'au printemps prochain, quand la mode aura tourné":
        "refuser, c'est occuper une réserve pendant des tours, le temps que la mode tourne",
      // Au mois, le déstockage s'ouvre en juillet, août ou septembre : la saison forte suit,
      // pas au mois suivant.
      "Le mètre de linéaire qu'ils occupent porterait les écharpes et les bonnets de l'hiver, qui tourneront deux fois d'ici le printemps": {
        month: "Le mètre de linéaire qu'ils occupent porterait les écharpes et les bonnets, qui se vendent plus du double dans la saison forte qui suit",
        year: "Le mètre de linéaire qu'ils occupent porterait les écharpes et les bonnets, qui se vendent plus du double au tour du pic, juste après",
      },
      "Le mètre de linéaire qu'elles occupent porterait la collection suivante, qui tournerait deux fois d'ici le printemps": {
        month: "Le mètre de linéaire qu'elles occupent porterait la collection suivante, celle de la saison forte qui suit",
        year: "Le mètre de linéaire qu'elles occupent porterait la collection suivante, celle du pic qui arrive au tour suivant",
      },
      "une vente incertaine dans un an": "une vente incertaine à la collection suivante",
      "Et regardez la rotation, qui est l'argument du commerçant : un pull qui dort une saison entière est un emplacement qui n'a rien vendu, alors que les accessoires de l'hiver y tourneraient.":
        "Et regardez la rotation, qui est l'argument du commerçant : un pull qui dort des tours entiers est un emplacement qui n'a rien vendu, alors que les accessoires du pic y tourneraient.",
      "La place libérée par le déstockage accueille les références de l'hiver, qui tourneront : pensez rotation du stock, pas récupération du coût d'achat.":
        "La place libérée par le déstockage accueille les références du pic qui arrive, qui tourneront : pensez rotation du stock, pas récupération du coût d'achat.",
      // Au tour 6 d'une partie au mois, la boutique a six mois : pas encore les
      // comptes d'une année. À l'année, le tour EST l'année.
      "Votre banquier reçoit les comptes de l'année.": {
        month: "Votre banquier reçoit vos derniers comptes.",
        year: "Votre banquier reçoit les comptes de l'année.",
      },
      "Les achats de la collection de Noël se paient aux façonniers avant que Noël ne rapporte quoi que ce soit":
        "Les achats de la collection du pic se paient aux façonniers avant que le pic ne rapporte quoi que ce soit",
      "Les achats de la collection de Noël se paient avant que Noël ne rapporte quoi que ce soit":
        "Les achats de la collection du pic se paient avant que le pic ne rapporte quoi que ce soit",

      // PIXEL & CO et sa gamme : le tour 4 est le plus haut de chaque tableau
      // (1,6 ; 1,45 à 1,7 selon le rayon).
      "Black Friday et fêtes": { month: "La saison qui fait l'année", year: "Le plus gros tour de la partie" },
      "Black Friday et fêtes, sur quatre rayons": {
        month: "La saison qui fait l'année, sur quatre rayons",
        year: "Le plus gros tour de la partie, sur quatre rayons",
      },
      "Vos concurrents ont réservé leurs espaces publicitaires depuis septembre":
        "Vos concurrents ont réservé leurs espaces publicitaires depuis des semaines",
      "Il suffit d'avoir du stock : à Noël, tout se vend": "Il suffit d'avoir du stock : au tour du pic, tout se vend",
      "Beaucoup d'e-commerçants rentables meurent en décembre.":
        "Beaucoup d'e-commerçants rentables meurent au plus fort de leur saison.",
      "Les enchères publicitaires montent en période de fêtes.": "Les enchères publicitaires montent au tour du pic.",
    } satisfies Record<string, string | { month: string; year: string }>).map(([cle, forme]) => [
      cle,
      typeof forme === "string" ? { month: forme, year: forme } : forme,
    ]),
  ),
  // --- fin du groupe boutique-ecommerce : le récit des saisons --------------
  // --- les courriers à tour fixe : leur date, vraie au trimestre à leur tour ---
  // Décision du propriétaire : le trimestre est la référence. Ces courriers (étapes
  // d'investissement, hausse d'énergie de VOLT FITNESS) tombent à un tour fixe où leur
  // date est vraie au trimestre ; elle reste. Au mois et à l'année, le tour n'est plus
  // cette date (ADR-01) : la forme sans date. Posés à la main par l'enseignant hors de
  // leur tour, ils peuvent dater faux : c'est une limite annoncée, pas corrigée.
  "Le groupe Montclar Ingénierie emménagera à la rentrée dans l'immeuble voisin de la place.": aLaSaison("Le groupe Montclar Ingénierie emménagera prochainement dans l'immeuble voisin de la place."),
  "Sa direction annonce une formule du midi inférieure d'environ un cinquième à celles du quartier jusqu'à la fin de l'année.": aLaSaison("Sa direction annonce une formule du midi inférieure d'environ un cinquième à celles du quartier, le temps de reconstituer sa clientèle."),
  "L'enseigne Les Tricots Valmont ouvrira trois boutiques dans l'agglomération d'ici la fin de l'automne et renouvelle l'ensemble de sa ligne de maille.": aLaSaison("L'enseigne Les Tricots Valmont ouvrira trois boutiques dans l'agglomération dans les semaines qui viennent et renouvelle l'ensemble de sa ligne de maille."),
  "La saison est plus douce que prévu et nos ventes de maille restent en deçà des hypothèses retenues au référencement.": aLaSaison("Nos ventes de maille restent en deçà des hypothèses retenues au référencement."),
  "Une charge qui grimpe quand la salle est vide : l'été, elle tombe sans aucun abonnement pour la couvrir.": aLaSaison("Une charge qui grimpe ne se répercute pas d'elle-même : tant que l'abonnement ne bouge pas, c'est la marge de chaque adhérent qui la paie."),
  "Le voyagiste Sillage Voyages nous a fait savoir qu'il envisage d'ajouter notre ville à ses circuits d'automne.": aLaSaison("Le voyagiste Sillage Voyages nous a fait savoir qu'il envisage d'ajouter notre ville à ses prochains circuits."),
  "Sa direction annonce des tarifs inférieurs d'environ dix pour cent à ceux du quartier jusqu'à la fin de l'année.": aLaSaison("Sa direction annonce des tarifs inférieurs d'environ dix pour cent à ceux du quartier, le temps de reconstituer sa clientèle."),
  "Notre adhérent Kelvox Acoustique inaugurera cet automne une seconde ligne d'assemblage et doublera ainsi sa capacité d'enceintes nomades.": aLaSaison("Notre adhérent Kelvox Acoustique inaugurera prochainement une seconde ligne d'assemblage et doublera ainsi sa capacité d'enceintes nomades."),
  // --- fin des courriers à tour fixe ---
  // Les situations détectées et les courriers, tous (tirés au sort, ou posés par
  // l'enseignant au tour qu'il veut, étapes d'investissement et événements scriptés
  // compris), comme les textes datés à tort au trimestre même, ne passent plus par
  // cette table : leur texte ne date rien, à aucune durée (garde :
  // tests/scenarios/saisons-textes-neutres.test.ts).
};

// --- hotel-bistrot-conseil ---------------------------------------------------
/**
 * Une phrase du récit des saisons, la même au mois et à l'année : elle dit ce que le
 * tour est pour le moteur (le pic, le creux), qui ne dépend pas de la durée du tour.
 * Une déclaration de fonction, hissée : la table ci-dessus la lit au chargement.
 */
function aLaSaison(phrase: string): { month: string; year: string } {
  return { month: phrase, year: phrase };
}
// --- fin hotel-bistrot-conseil -----------------------------------------------

const capitaliser = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function motDeDuree(cle: string, periodicite: Periodicity): string | undefined {
  const exact = MOTS[cle];
  if (exact) return periodicite === "quarter" ? (exact.quarter ?? cle) : exact[periodicite];
  const minuscule = cle.charAt(0).toLowerCase() + cle.slice(1);
  const mot = minuscule === cle ? undefined : MOTS[minuscule];
  if (!mot) return undefined;
  return periodicite === "quarter" ? (mot.quarter ? capitaliser(mot.quarter) : cle) : capitaliser(mot[periodicite]);
}

// ---------------------------------------------------------------------------
// Les grandeurs et leurs expressions
// ---------------------------------------------------------------------------

/**
 * Un taux tel que le texte le montre : au dixième de point. L'élève refait le
 * calcul avec le taux qu'il lit ; la valeur vie se calcule donc avec lui, et
 * non avec les décimales que l'énoncé ne donne pas.
 */
const tauxLu = (x: number) => Math.round(x * 1000) / 1000;

/** Supprime le bruit des flottants avant d'arrondir : 90 ÷ 0,16 vaut 562,5, pas 562,4999… */
const net = (x: number) => Number(x.toFixed(9));

type Grandeur = (s: EngineScenarioConfig) => number;

const abonnementDe = (s: EngineScenarioConfig) => {
  if (!s.subscription) throw new Error("Situation : le jeton « abonnement » suppose un scénario par abonnement");
  return s.subscription;
};

/** Les échéances d'un abonnement dans l'année : une par tour, une par mois quand le tour dure un an. */
const echeancesParAn = (s: EngineScenarioConfig) => (s.roundDays >= 360 ? 12 : 360 / s.roundDays);

// --- conseil-hotel ---
/** Les entreprises de départ dont une situation lit la capacité. */
const ENTREPRISES_DE_DEPART: Record<string, typeof conseilCompany> = {
  conseil: conseilCompany,
  "conseil-gamme": conseilGammeCompany,
  hotel: hotelCompany,
  "hotel-gamme": hotelGammeCompany,
};

/** L'entreprise de départ du scénario, mise à la durée de son tour par la règle du moteur. */
function entrepriseDeDepart(s: EngineScenarioConfig) {
  const fabrique = ENTREPRISES_DE_DEPART[s.code];
  if (!fabrique) throw new Error(`Situation : aucune entreprise de départ connue pour « ${s.code} »`);
  return applyPeriodicityToCompany(fabrique("situation", "situation", "human"), periodicityFromRoundDays(s.roundDays), {
    abonnement: s.subscription !== undefined,
  });
}

const investissementDe = (s: EngineScenarioConfig) => {
  if (!s.investment) throw new Error("Situation : ce jeton suppose un scénario à investissement capacitaire");
  return s.investment;
};

// --- nova-courriers : de quoi lire l'investissement, la R&D et les commandes -----


/**
 * Le premier tour où une référence en développement se vend, par la règle même
 * du moteur (`isProductAvailable`) : la R&D cumulée des tours PASSÉS doit
 * couvrir son coût, le tour de disponibilité être atteint, et, pour un
 * développement par étapes, la durée minimale écoulée depuis le démarrage.
 * `partFinancee(t)` dit quelle part du coût est engagée à la fin du tour t ; le
 * démarrage est au tour 1, celui où l'énoncé engage la première tranche. Le
 * retard de certification, un tirage, n'y entre pas : l'énoncé le dit à part.
 */
function premiereVente(s: EngineScenarioConfig, code: string, partFinancee: (tour: number) => number): number {
  const produit = s.products?.find((p) => p.code === code);
  const dev = produit?.development;
  if (!dev) throw new Error(`Situation : la référence « ${code} » n'est pas à développer dans ce scénario`);
  for (let tour = 2; tour <= 100; tour++) {
    const rd = { invested: dev.cost * partFinancee(tour - 1), launched: false, techLevel: 0, demarreAuTour: 1 };
    if (isProductAvailable({ development: dev }, rd, tour)) return tour;
  }
  throw new Error(`Situation : la référence « ${code} » ne se vend jamais`);
}

/** Les unités d'une commande d'office (cible `order`) de l'événement nommé, dans ce scénario. */
function unitesDeCommande(s: EngineScenarioConfig, code: string): number {
  const modificateurs = s.events.find((e) => e.code === code)?.modifiers.filter((m) => m.target === "order") ?? [];
  if (modificateurs.length === 0) throw new Error(`Situation : « ${code} » n'est pas une commande d'office de ce scénario`);
  return modificateurs.reduce((total, m) => total + m.value, 0);
}

/** Les grandeurs qu'un énoncé peut citer, lues du scénario mis à la durée du tour. */
const GRANDEURS: Record<string, Grandeur> = {
  /** Le prix d'un tour d'abonnement (référence du scénario). */
  abonnement: (s) => abonnementDe(s).refPrice,
  /** Le coût variable d'une unité vendue : matières et autres charges variables. */
  variable: (s) => s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit,
  /** La marge d'un tour d'abonnement. */
  marge: (s) => abonnementDe(s).refPrice - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit,
  /** Les charges de structure d'un tour. */
  charges: (s) => s.fixedCostsPerRound,
  /** L'attrition de base d'un tour, telle que le texte la montre. */
  attrition: (s) => tauxLu(abonnementDe(s).baseChurnRate),
  /** Le nombre de tours dans une année. */
  tours_par_an: (s) => 360 / s.roundDays,
  // --- retouches : ce que l'adhérent paie à chaque échéance ---
  /**
   * Les échéances d'un abonnement dans l'année : une par tour, et une par mois quand le
   * tour dure un an. La formule annuelle de VOLT FITNESS se compare à ce que l'adhérent
   * paie « aujourd'hui » : à l'année, payer une fois par tour ne la distinguerait de rien.
   */
  echeances_par_an: (s) => echeancesParAn(s),
  /** Ce que l'adhérent paie à chaque échéance : l'abonnement d'une année divisé par leur nombre. */
  echeance: (s) => (abonnementDe(s).refPrice * (360 / s.roundDays)) / echeancesParAn(s),
  // --- transport-bistrot ---------------------------------------------------
  /**
   * La capacité du parc de départ, par tour : les machines (camions, cuisines) du parc
   * initial, chacune à sa capacité par tour. Hors abonnement, `applyPeriodicity` la met
   * à la durée du tour (× k) : 10 000 palettes au trimestre, 3 333 au mois.
   */
  capacite_parc: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « capacite_parc » suppose un parc d'équipements");
    const types = new Map(s.equipment.types.map((t) => [t.code, t.capacityPerUnit]));
    return s.equipment.initialFleet.reduce((total, f) => {
      const capacite = types.get(f.typeCode);
      if (capacite === undefined) throw new Error(`Situation : type d'équipement inconnu « ${f.typeCode} »`);
      return total + f.count * capacite;
    }, 0);
  },
  /** Les amortissements d'un tour (`finance.depreciationPerRound`). */
  amortissements: (s) => s.finance.depreciationPerRound,
  /**
   * La durée d'amortissement d'un investissement de capacité, en tours. Une durée réelle :
   * elle se compte en tours de la nouvelle durée (12 trimestres, 36 mois, 3 exercices).
   */
  investissement_duree: (s) => {
    if (!s.investment) throw new Error("Situation : le jeton « investissement_duree » suppose un investissement");
    return s.investment.depreciationRounds;
  },
  /** La capacité qu'un investissement peut ajouter au plus en un tour : un flux par tour. */
  /** Le nombre de véhicules (ou de machines) du parc de départ, tous types confondus. */
  vehicules: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « vehicules » suppose un parc d'équipements");
    return s.equipment.initialFleet.reduce((total, f) => total + f.count, 0);
  },
  investissement_plafond: (s) => {
    if (!s.investment) throw new Error("Situation : le jeton « investissement_plafond » suppose un investissement");
    return s.investment.maxPerRound;
  },
  /**
   * Ce qu'un porteur 12 t emmène en un tour à pleine charge : la capacité de son type
   * dans le parc (`equipment.types`), celle sur laquelle le moteur compte la flotte.
   * Hors abonnement, `applyPeriodicity` la met à la durée du tour (× k).
   */
  capacite_porteur: (s) => {
    const porteur = s.equipment?.types.find((t) => t.code === "porteur_12t");
    if (!porteur) throw new Error("Situation : le jeton « capacite_porteur » suppose un porteur 12 t dans le parc");
    return porteur.capacityPerUnit;
  },
  // --- fin transport-bistrot -----------------------------------------------
  // --- conseil-hotel ---
  /** Les jours d'un tour : les nuits qu'une chambre offre, au calendrier du moteur (30, 90, 360). */
  jours_du_tour: (s) => s.roundDays,
  /**
   * Ce que l'entreprise de départ peut vendre en un tour : le plus petit de son parc
   * et des heures de son équipe, comme le moteur produit (`engine/production`). Les
   * 720 jours-consultants d'ATLAS CONSEIL, les 5 400 nuitées de L'ESCALE au trimestre.
   */
  capacite: (s) => {
    const e = entrepriseDeDepart(s);
    return Math.min(e.machineCapacity, (e.headcount * e.hoursPerEmployee) / s.product.hoursPerUnit);
  },
  /** Les heures d'un salarié sur un tour ; au conseil, l'unité est la journée : ses jours ouvrés. */
  heures_par_salarie: (s) => entrepriseDeDepart(s).hoursPerEmployee,
  /** Le salaire chargé d'un salarié sur un tour. */
  salaire: (s) => {
    if (!s.hr) throw new Error("Situation : le jeton « salaire » suppose un scénario à effectif");
    return s.hr.salaryPerEmployeePerRound;
  },
  /** Le prix d'une unité de capacité PAR TOUR achetée en investissement. */
  cout_capacite: (s) => investissementDe(s).costPerCapacityUnit,
  /** La durée d'amortissement d'un investissement capacitaire, en tours. */
  duree_investissement: (s) => investissementDe(s).depreciationRounds,

  // --- nova-courriers : les situations NOVA et les courriers ------------------
  /** La capacité de l'atelier au départ : le parc initial, ligne par ligne, à la durée du tour. */
  capacite_initiale: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « capacite_initiale » suppose un parc d'équipements");
    const types = new Map(s.equipment.types.map((t) => [t.code, t]));
    return s.equipment.initialFleet.reduce((total, l) => total + l.count * types.get(l.typeCode)!.capacityPerUnit, 0);
  },
  /** Le plus gros investissement capacitaire d'un tour, en unités de capacité par tour. */
  investissement_max: (s) => investissementDe(s).maxPerRound,
  /** La durée d'amortissement de cet investissement, en tours. */
  amortissement_investissement: (s) => investissementDe(s).depreciationRounds,
  /** Le taux d'actualisation par tour de l'étude de projet : le taux d'emprunt annuel au prorata du tour. */
  actualisation_du_tour: (s) => (s.finance.loanAnnualRate * s.roundDays) / 360,
  /** Le premier tour où se vend la Studio de NOVA · GAMME, financée en entier au tour 1. */
  vente_studio: (s) => premiereVente(s, "nova-studio", () => 1),
  /** Le premier tour où se vend la NOVA Home, financée en entier au tour 1 : son lancement au plus tôt. */
  home_au_plus_tot: (s) => premiereVente(s, "nova-home", () => 1),
  /** Le premier tour où se vend la NOVA Home financée par étapes : un tiers au tour 1, le reste au tour 2. */
  home_par_etapes: (s) => premiereVente(s, "nova-home", (tour) => (tour >= 2 ? 1 : 1 / 3)),
  /** La plateforme de la NOVA Home, par tour : × jours / 90, comme le niveau 7 la pose (`avecLeGroupe`). */
  plateforme_home: (s) => (NOVA_HOME.regles.plateforme.coutFixeParTour * s.roundDays) / 90,
  /** Les unités des commandes d'office, telles que le moteur les applique (`applyPeriodicity` : × jours / 90). */
  commande_tight_order: (s) => unitesDeCommande(s, "tight_order"),
  commande_xxl_order: (s) => unitesDeCommande(s, "xxl_order"),
  commande_big_order: (s) => unitesDeCommande(s, "big_order"),
  commande_boutique_commande_ce: (s) => unitesDeCommande(s, "boutique_commande_ce"),
  commande_conseil_mission_urgente: (s) => unitesDeCommande(s, "conseil_mission_urgente"),
  commande_hotel_groupe_impromptu: (s) => unitesDeCommande(s, "hotel_groupe_impromptu"),
  commande_ecom_btob: (s) => unitesDeCommande(s, "ecom_commande_b2b"),
  commande_batiment_chantier_surprise: (s) => unitesDeCommande(s, "batiment_chantier_surprise"),
  commande_transport_lot_surprise: (s) => unitesDeCommande(s, "transport_lot_surprise"),
  commande_bistrot_banquet_surprise: (s) => unitesDeCommande(s, "bistrot_banquet_surprise"),
  commande_fitness_contrat_surprise: (s) => unitesDeCommande(s, "fitness_contrat_surprise"),
  // --- groupe batiment-boutique-ecommerce (capacité du parc : `capacite_parc`, salaire : `salaire`) ---
  /** Le coût d'une embauche : un ponctuel, que la durée du tour ne change pas. */
  embauche: (s) => {
    if (!s.hr) throw new Error("Situation : le jeton « embauche » suppose un module RH");
    return s.hr.hiringCost;
  },
  // --- hotel-bistrot-conseil : le prix de la capacité, lu du parc ---------------
  /**
   * Le prix d'une unité de capacité PAR TOUR quand le scénario achète sa capacité en
   * équipements typés, que le moteur lit alors (`engine/investment/plafond.ts`) : le
   * coût d'un type divisé par sa capacité par tour, du type le moins cher au plus cher.
   * À L'ESCALE, de la chambre standard à la suite premium. Hors abonnement,
   * `applyPeriodicity` met la capacité à la durée du tour, et le prix suit (÷ k).
   */
  cout_capacite_parc_min: (s) => Math.min(...prixDeLaCapacite(s)),
  cout_capacite_parc_max: (s) => Math.max(...prixDeLaCapacite(s)),
  // --- fin hotel-bistrot-conseil -------------------------------------------------
};

// --- hotel-bistrot-conseil ---------------------------------------------------
/** Le prix d'une unité de capacité par tour, type d'équipement par type. */
function prixDeLaCapacite(s: EngineScenarioConfig): number[] {
  if (!s.equipment?.types.length) throw new Error("Situation : ce jeton suppose un parc d'équipements typés");
  return s.equipment.types.map((t) => t.costPerUnit / t.capacityPerUnit);
}
// --- fin hotel-bistrot-conseil -----------------------------------------------

// --- le calendrier des parties au mois : le coefficient de saison du tour -----
/**
 * LE COEFFICIENT DE SAISON DU TOUR OÙ LE TEXTE SE LIT : `{{coefficient: saison}}`,
 * `{{coefficient: saison_groupes}}`, `{{coefficient: saison_banquets}}`.
 *
 * Une sorte de grandeur de plus, et la seule qui dépende du TOUR où le texte se lit, et
 * non du seul scénario. Au trimestre et à l'année, la saisonnalité se lit une valeur par
 * tour, et une situation à tour fixe s'ouvre au tour qu'elle dit : « 1,85 fois leur
 * niveau ordinaire » se recopiait donc du tableau. Sur le calendrier des parties au mois
 * (`calendrier-mensuel.ts`), la même situation s'ouvre au premier mois de son trimestre,
 * ou au mois 1 si ce trimestre est en cours au départ, et la saison de ce mois est celle
 * du trimestre répartie par le profil du métier : les banquets font 1,67 en octobre et
 * 2,22 en décembre, pas les 1,85 du trimestre. Le chiffre dépend du mois de départ que
 * l'enseignant choisit : il ne se lit que dans le scénario de la partie, au tour où la
 * situation s'ouvre (`situationDeLaPartie`).
 *
 * `saison` lit le marché ; `saison_<code>` une référence (son marché) ou une clientèle (la
 * sienne, ou celle de son marché), comme le moteur les lit. Un code à tirets s'écrit avec
 * des soulignés (`saison_pull_col_rond`). Le tour vient du rendu : celui que la situation
 * dit, ou, au mois sur le calendrier, celui où elle s'ouvre. Une situation détectée ou de
 * fin de partie n'a pas de tour écrit : le jeton y lève, dès le chargement.
 */
function saisonLue(nom: string, s: EngineScenarioConfig, tour: number | undefined): number | undefined {
  if (nom !== "saison" && !nom.startsWith("saison_")) return undefined;
  if (tour === undefined) throw new Error(`Situation : le jeton « ${nom} » suppose une situation à tour fixe`);
  const tableau = nom === "saison" ? s.market.seasonality : tableauDeSaison(s, nom.slice("saison_".length));
  const valeur = tableau[tour - 1];
  if (valeur === undefined) throw new Error(`Situation : « ${nom} » n'a pas de saison au tour ${tour} de « ${s.code} »`);
  return valeur;
}

/** Le tableau de saison qu'une référence ou une clientèle lit : le sien, ou celui de son marché. */
function tableauDeSaison(s: EngineScenarioConfig, code: string): readonly number[] {
  const nomme = (c: string) => c.replace(/-/g, "_") === code;
  const produit = s.products?.find((p) => nomme(p.code));
  if (produit) return produit.market.seasonality ?? s.market.seasonality;
  const segment = s.market.segments.find((g) => nomme(g.code));
  if (segment) return segment.seasonality ?? s.market.seasonality;
  for (const p of s.products ?? []) {
    const g = p.market.segments.find((x) => nomme(x.code));
    if (g) return g.seasonality ?? p.market.seasonality ?? s.market.seasonality;
  }
  throw new Error(`Situation : ni référence ni clientèle « ${code} » dans « ${s.code} »`);
}
// --- fin du calendrier des parties au mois ------------------------------------

const FONCTIONS: Record<string, (x: number, s: EngineScenarioConfig) => number> = {
  /** Un taux de perte écrit au trimestre, ramené à la durée du tour par la règle du moteur. */
  perte: (x, s) => tauxLu(composerPerte(x, s.roundDays / 90)),
  /** Un montant arrondi à l'unité, quand l'énoncé calcule avec un nombre qu'il a déjà arrondi. */
  arrondi: (x) => Math.round(net(x)),
  /**
   * Un flux du récit écrit au trimestre (un montant ou un volume par tour que le scénario
   * ne porte pas : une offre, un contrat), mis à la durée du tour comme le moteur met les
   * siens (× jours / 90). Un chiffre que le scénario porte se lit par sa grandeur, jamais
   * par `flux`.
   */
  flux: (x, s) => (x * s.roundDays) / 90,
  // --- transport-bistrot ---------------------------------------------------
  // Les « environ » d'un énoncé : le même arrondi à toutes les durées. Chacun rend, au
  // trimestre, le chiffre que le texte écrivait (3 800, 4 050, 4 200…).
  /** Arrondi à la dizaine. */
  dizaine: (x) => Math.round(net(x) / 10) * 10,
  /** Arrondi à la cinquantaine. */
  cinquantaine: (x) => Math.round(net(x) / 50) * 50,
  /** Arrondi à la centaine. */
  centaine: (x) => Math.round(net(x) / 100) * 100,
  // --- fin transport-bistrot -----------------------------------------------
  // --- groupe batiment-boutique-ecommerce (l'arrondi à la dizaine : `dizaine`) ---
  /** L'entier supérieur : un seuil en unités ne s'atteint qu'à l'unité entière suivante. */
  plafond: (x) => Math.ceil(net(x)),
};

/** Une petite arithmétique : nombres, grandeurs, fonctions, + − × ÷ et parenthèses. */
function evaluer(source: string, s: EngineScenarioConfig, tour?: number): number {
  const jetons = source.match(/\d+(?:\.\d+)?|[a-z_]+|[-+*/()]/g) ?? [];
  if (jetons.join("") !== source.replace(/\s+/g, "")) {
    throw new Error(`Situation : expression illisible « ${source} »`);
  }
  let i = 0;
  const lire = () => jetons[i++];
  const voir = () => jetons[i];
  const facteur = (): number => {
    const t = lire();
    if (t === undefined) throw new Error(`Situation : expression incomplète « ${source} »`);
    if (t === "-") return -facteur();
    if (t === "(") {
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return v;
    }
    if (/^\d/.test(t)) return Number(t);
    if (voir() === "(") {
      const f = FONCTIONS[t];
      if (!f) throw new Error(`Situation : fonction inconnue « ${t} »`);
      lire();
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return f(v, s);
    }
    const g = GRANDEURS[t];
    if (g) return g(s);
    const saison = saisonLue(t, s, tour);
    if (saison === undefined) throw new Error(`Situation : grandeur inconnue « ${t} »`);
    return saison;
  };
  const produit = (): number => {
    let v = facteur();
    while (voir() === "*" || voir() === "/") v = lire() === "*" ? v * facteur() : v / facteur();
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (voir() === "+" || voir() === "-") v = lire() === "+" ? v + produit() : v - produit();
    return v;
  };
  const v = somme();
  if (i !== jetons.length) throw new Error(`Situation : expression illisible « ${source} »`);
  if (!Number.isFinite(v)) throw new Error(`Situation : expression sans valeur « ${source} »`);
  return v;
}

// ---------------------------------------------------------------------------
// Les formats
// ---------------------------------------------------------------------------

/** Les milliers séparés d'une espace, comme les énoncés l'ont toujours écrit. */
const milliers = (n: number) => String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const entier = (x: number) => {
  const n = Math.round(net(x));
  return (n < 0 ? "-" : "") + milliers(n);
};
const avecVirgule = (x: number, min: number, max: number) =>
  net(x).toLocaleString("fr-FR", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: false });

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un entier de 0 à 99 en toutes lettres (orthographe traditionnelle). */
function enMots(n: number, feminin: boolean): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  const un = feminin ? "une" : "un";
  if (n === 1) return un;
  if (n <= 16) return UNITES[n]!;
  if (n < 20) return `dix-${UNITES[n - 10]}`;
  if (n >= 80) {
    const reste = n - 80;
    return reste === 0 ? "quatre-vingts" : `quatre-vingt-${reste === 1 ? un : enMots(reste, feminin)}`;
  }
  const dizaine = n >= 60 ? 60 : Math.floor(n / 10) * 10;
  const reste = n - dizaine;
  const tete = DIZAINES[dizaine / 10]!;
  if (reste === 0) return tete;
  if (reste === 1) return `${tete} et ${un}`;
  if (reste === 11 && dizaine === 60) return "soixante et onze";
  return `${tete}-${enMots(reste, feminin)}`;
}

/** Des points d'écart : en toutes lettres quand c'est un entier, sinon au dixième ; singulier sous deux. */
function points(x: number): string {
  const v = Math.round(net(x * 100) * 10) / 10;
  const nombre = Number.isInteger(v) && v <= 16 ? enMots(v, false) : avecVirgule(v, 0, 1);
  return `${nombre} ${Math.abs(v) < 2 ? "point" : "points"}`;
}

// --- transport-bistrot -----------------------------------------------------

/** Un entier de 0 à 999, en toutes lettres ; `devant` : suivi de « mille », qui fige « cent » et « vingt ». */
function centaines(n: number, devant: boolean): string {
  const c = Math.floor(n / 100);
  const reste = n % 100;
  let mots = reste === 0 && c > 0 ? "" : enMots(reste, false);
  if (devant && mots.endsWith("quatre-vingts")) mots = mots.slice(0, -1);
  if (c === 0) return mots;
  const cent = c === 1 ? "cent" : `${enMots(c, false)} cent${reste === 0 && !devant ? "s" : ""}`;
  return mots ? `${cent} ${mots}` : cent;
}

/**
 * Un entier de 0 à 999 999 en toutes lettres (orthographe traditionnelle) : « sept mille
 * quatre cents », « mille cent vingt », « deux mille quatre cent soixante-dix ».
 */
function enLettres(x: number): string {
  const n = Math.round(net(x));
  if (n < 0 || n > 999_999) return entier(n);
  const m = Math.floor(n / 1000);
  const reste = n % 1000;
  if (m === 0) return centaines(reste, false);
  const mille = m === 1 ? "mille" : `${centaines(m, true)} mille`;
  return reste === 0 ? mille : `${mille} ${centaines(reste, false)}`;
}

// --- fin transport-bistrot -------------------------------------------------

// --- retouches ---------------------------------------------------------------

/**
 * Un nombre que le récit lit, arrondi au pas donné : tel quel quand il tombe juste,
 * précédé d'« environ » sinon. Les 455 heures d'un salarié par trimestre font
 * 151,67 h au mois : l'énoncé dit « environ 152 h », et le calcul qu'il demande
 * part de 152 (`arrondi(…)`), pour tomber juste avec le nombre affiché. La brigade
 * de dix fait alors « environ 1 520 heures » (au pas de la dizaine), soit
 * 3 040 couverts, les mêmes que dix fois 152 heures.
 */
const environ = (pas: number) => (x: number): string => {
  const n = Math.round(net(x) / pas) * pas;
  return net(x) === n ? entier(n) : `environ ${entier(n)}`;
};

/**
 * Un résultat dit à la centaine : « près de 4 000 » pour 3 960, mais « un peu plus
 * de 1 300 » pour 1 320, que « près de » dirait un peu moins qu'il n'est.
 */
function approcheCentaine(x: number): string {
  const n = Math.round(net(x) / 100) * 100;
  return `${net(x) <= n ? "près de" : "un peu plus de"} ${entier(n)}`;
}

/**
 * Un écart rapporté à la mission longue du récit (le quotient par sa durée) :
 * « moins d'une mission longue » quand il y tient, « plus de deux missions
 * longues » quand il en dépasse deux. ATLAS CONSEIL manque son seuil de 41 jours
 * au trimestre, mais de 165 à l'année, quand la mission longue en fait 60.
 */
function missionsLongues(x: number): string {
  const n = Math.floor(net(x));
  if (n < 1) return "moins d'une mission longue";
  if (n < 2) return "plus d'une mission longue";
  return `plus de ${enMots(n, false)} missions longues`;
}

// --- fin retouches -----------------------------------------------------------

const FORMATS: Record<string, (x: number) => string> = {
  /** Un montant à l'euro : « 105 000 ». */
  entier,
  /** Un montant au centime : « 13,50 ». */
  centimes: (x) => avecVirgule(x, 2, 2),
  /** Un taux en pour cent, au dixième : « 15 », « 5,3 ». */
  taux: (x) => avecVirgule(Math.round(net(x * 100) * 10) / 10, 0, 1),
  /** Un rapport en pour cent entier : « 50 ». */
  pourcent: (x) => entier(x * 100),
  /** Un taux en fraction, au millième : « 0,15 », « 0,053 ». */
  decimal: (x) => avecVirgule(x, 2, 3),
  /** La partie entière, en toutes lettres : « six ». */
  mots: (x) => enMots(Math.floor(net(x)), false),
  /** La même, au féminin : « une fois ». */
  mots_f: (x) => enMots(Math.floor(net(x)), true),
  /** Un écart de taux en points : « cinq points », « 1,8 point ». */
  points,
  Points: (x) => capitaliser(points(x)),
  // --- transport-bistrot ---------------------------------------------------
  /** Un entier en toutes lettres, jusqu'à 999 999 : « sept mille quatre cents ». */
  lettres: enLettres,
  // --- fin transport-bistrot -----------------------------------------------
  // --- retouches -----------------------------------------------------------
  /** Un nombre à l'unité, « environ » quand il ne tombe pas juste : « 455 », « environ 152 ». */
  environ: environ(1),
  /** Le même à la dizaine : « 4 550 », « environ 1 520 ». */
  environ_dizaine: environ(10),
  /** Un résultat à la centaine, « près de 4 000 » ou « un peu plus de 1 300 ». */
  approche_centaine: approcheCentaine,
  /** Un écart compté en missions longues (son quotient par leur durée) : « moins d'une mission longue ». */
  missions_longues: missionsLongues,
  // --- fin retouches -------------------------------------------------------

  // --- nova-courriers ---------------------------------------------------------
  /** Le même, en tête de phrase : « Neuf cents palettes ». */
  Lettres: (x) => capitaliser(enLettres(x)),
  /** Un taux en pour cent, au centième : « 1,25 », « 0,42 », « 5 ». */
  taux_centieme: (x) => avecVirgule(Math.round(net(x * 100) * 100) / 100, 0, 2),
  /** Un coefficient de saison, au centième, une décimale au moins : « 1,85 », « 0,5 », « 2,0 ». */
  coefficient: (x) => avecVirgule(Math.round(net(x * 100)) / 100, 1, 2),
  /** Le tour où une chose arrive, depuis le premier : « au suivant » pour le deuxième, « au tour 4 » au-delà. */
  au_tour: (x) => (Math.round(net(x)) === 2 ? "au suivant" : `au tour ${Math.round(net(x))}`),
};

// ---------------------------------------------------------------------------
// Le rendu
// ---------------------------------------------------------------------------

const JETON = /\{\{([^{}]+)\}\}/g;

/**
 * Le texte, ses jetons rendus pour ce scénario (déjà mis à la durée du tour). `tour` :
 * celui où le texte se lit, pour le coefficient de saison (`saisonLue`) ; absent, ce
 * jeton lève.
 */
export function rendreTexte(texte: string, scenario: EngineScenarioConfig, tour?: number): string {
  if (!texte.includes("{{")) return texte;
  const periodicite = periodicityFromRoundDays(scenario.roundDays);
  return texte.replace(JETON, (_, brut: string) => {
    const contenu = brut.trim();
    const deuxPoints = contenu.indexOf(":");
    const format = deuxPoints > 0 ? contenu.slice(0, deuxPoints).trim() : "";
    if (format === "accord") {
      // {{accord: expression | singulier | pluriel}} : le verbe suit le nombre.
      const [expression, singulier, pluriel] = contenu.slice(deuxPoints + 1).split("|").map((p) => p.trim());
      if (!expression || singulier === undefined || pluriel === undefined) {
        throw new Error(`Situation : accord mal écrit {{${brut}}}`);
      }
      const v = Math.round(net(evaluer(expression, scenario, tour) * 100) * 10) / 10;
      return Math.abs(v) < 2 ? singulier : pluriel;
    }
    if (format && FORMATS[format]) return FORMATS[format]!(evaluer(contenu.slice(deuxPoints + 1).trim(), scenario, tour));
    const mot = motDeDuree(contenu, periodicite);
    if (mot === undefined) throw new Error(`Situation : jeton inconnu {{${brut}}}`);
    return mot;
  });
}

/** Les jetons d'un texte brut. */
export const jetonsDe = (texte: string): string[] => [...texte.matchAll(JETON)].map((m) => m[1]!.trim());

/**
 * Tous les champs textuels d'une situation, rendus : ceux que l'élève ou l'enseignant lit.
 * `tour` : celui où elle se lit ; absent, celui qu'elle dit (`tourEcrit`).
 */
export function rendreSituation(
  def: SituationDef,
  scenario: EngineScenarioConfig,
  tour: number | undefined = tourEcrit(def),
): SituationDef {
  const r = (t: string) => rendreTexte(t, scenario, tour);
  return {
    ...def,
    title: r(def.title),
    narrative: r(def.narrative),
    problem: r(def.problem),
    diagnosticOptions: def.diagnosticOptions.map((o) => ({ ...o, label: r(o.label) })),
    quiz: def.quiz.map((q) => ({
      ...q,
      prompt: r(q.prompt),
      explain: r(q.explain),
      options: q.options.map((o) => ({
        ...o,
        label: r(o.label),
        ...(o.aide !== undefined ? { aide: r(o.aide) } : {}),
      })),
    })),
    hints: def.hints.map((h) => ({ ...h, text: r(h.text) })),
    decisionLevers: def.decisionLevers.map((l) => ({ ...l, hint: r(l.hint) })),
  };
}

/** Tous les textes d'une situation, à plat : de quoi chercher un jeton ou un mot oublié. */
export function textesDe(def: SituationDef): string[] {
  return [
    def.title,
    def.narrative,
    def.problem,
    ...def.diagnosticOptions.map((o) => o.label),
    ...def.quiz.flatMap((q) => [q.prompt, q.explain, ...q.options.flatMap((o) => [o.label, o.aide ?? ""])]),
    ...def.hints.map((h) => h.text),
    ...def.decisionLevers.map((l) => l.hint),
  ];
}

// ---------------------------------------------------------------------------
// Le registre au trimestre, et la partie à sa durée
// ---------------------------------------------------------------------------

interface Rendus {
  source: SituationDef;
  parDuree: Record<Periodicity, SituationDef>;
  /** Le scénario du registre, d'où se compose la partie au mois sur le calendrier. */
  scenario: EngineScenarioConfig;
  /** Au mois sur le calendrier, le rendu de chaque mois de départ, fait à la première lecture. */
  auCalendrier: Map<number, SituationDef>;
}

/** Le rendu au trimestre que porte le registre → sa source et ses rendus à chaque durée. */
const RENDUS = new WeakMap<SituationDef, Rendus>();

/**
 * Les situations d'un scénario, rendues au trimestre pour le registre. Les trois
 * durées sont rendues dès le chargement : un jeton mal écrit lève à l'import, et
 * non au milieu d'une partie au mois. Une situation sans jeton est rendue telle
 * quelle, même objet.
 */
export function situationsAuTrimestre(sources: SituationDef[], scenario: EngineScenarioConfig): SituationDef[] {
  const auMois = applyPeriodicity(scenario, "month");
  const aLAnnee = applyPeriodicity(scenario, "year");
  return sources.map((source) => {
    if (!textesDe(source).some((t) => t.includes("{{"))) return source;
    const trimestre = rendreSituation(source, applyPeriodicity(scenario, "quarter"));
    RENDUS.set(trimestre, {
      source,
      parDuree: {
        quarter: trimestre,
        month: rendreSituation(source, auMois),
        year: rendreSituation(source, aLAnnee),
      },
      scenario,
      auCalendrier: new Map(),
    });
    return trimestre;
  });
}

/** La durée d'un tour lue dans un instantané de partie (90 jours par défaut). */
export function dureeDuTourDe(instantane: unknown): number {
  const jours = (instantane as { roundDays?: unknown } | null | undefined)?.roundDays;
  return typeof jours === "number" && jours > 0 ? jours : PERIODICITY_DAYS.quarter;
}

/** Le mois de départ d'une partie au mois sur le calendrier, lu dans son instantané ; absent pour toute autre partie. */
export function moisDeDepartDe(instantane: unknown): number | undefined {
  const mois = (instantane as { moisDeDepart?: unknown } | null | undefined)?.moisDeDepart;
  return typeof mois === "number" ? mois : undefined;
}

/**
 * La situation telle que SA partie la montre. `def` est celle du registre (ou
 * d'un scénario d'enseignant, rendue telle quelle : son texte est déjà écrit).
 * Au trimestre, c'est le même objet : rien ne change, au bit près.
 *
 * `moisDeDepart` : celui d'une partie au mois sur le calendrier (`moisDeDepartDe`). Ses
 * mots sont ceux du mois ; ses coefficients de saison se lisent dans le scénario de la
 * partie, au tour où la situation s'ouvre (`saisonLue`). Absent au mois (une partie
 * d'avant le calendrier, un chemin sans partie), le rendu au mois de toujours, où le
 * tour du trimestre est aussi celui du mois.
 */
export function situationDeLaPartie(def: SituationDef, roundDays: number, moisDeDepart?: number): SituationDef {
  const rendus = RENDUS.get(def);
  if (!rendus) return def;
  const periodicite = periodicityFromRoundDays(roundDays);
  if (periodicite !== "month" || moisDeDepart === undefined) return rendus.parDuree[periodicite];
  const deja = rendus.auCalendrier.get(moisDeDepart);
  if (deja) return deja;
  const ecrit = tourEcrit(rendus.source);
  const tour = ecrit === undefined ? null : tourDuTrimestre(ecrit, moisDeDepart, MOIS_MAX);
  // Une situation qui ne s'ouvre à aucun mois de cette partie n'a pas de mois où se lire.
  const rendue =
    tour === null ? rendus.parDuree.month : rendreSituation(rendus.source, auCalendrier(rendus.scenario, moisDeDepart), tour);
  rendus.auCalendrier.set(moisDeDepart, rendue);
  return rendue;
}

/** Le tour qu'une situation dit : celui de son déclencheur, sauf détectée ou de fin de partie. */
function tourEcrit(def: SituationDef): number | undefined {
  return "round" in def.trigger && !def.trigger.finDePartie ? def.trigger.round : undefined;
}

/** Le scénario au mois sur le calendrier, de ce mois de départ, par mois de départ et par scénario. */
const CALENDRIERS = new WeakMap<EngineScenarioConfig, Map<number, EngineScenarioConfig>>();

/**
 * Le scénario d'une partie au mois sur le calendrier, composé comme la création le compose
 * (`composerLeScenarioJoue`) : au trimestre sur les trimestres que la plus longue partie
 * touche, mis au mois, puis rendu mois par mois (`auCalendrierMensuel`). Les montants y
 * sont ceux du mois, comme au rendu de toujours ; la saison, celle de chaque mois.
 */
function auCalendrier(scenario: EngineScenarioConfig, moisDeDepart: number): EngineScenarioConfig {
  const parMois = CALENDRIERS.get(scenario) ?? new Map<number, EngineScenarioConfig>();
  CALENDRIERS.set(scenario, parMois);
  const deja = parMois.get(moisDeDepart);
  if (deja) return deja;
  const trimestres = applyRoundsCount(scenario, trimestresDeLaPartie(MOIS_MAX, moisDeDepart), "quarter");
  const compose = auCalendrierMensuel(applyPeriodicity(trimestres, "month"), moisDeDepart, MOIS_MAX);
  parMois.set(moisDeDepart, compose);
  return compose;
}

/** La source à jetons d'une situation du registre ; la situation elle-même si elle n'en a pas. */
export function sourceDe(def: SituationDef): SituationDef {
  return RENDUS.get(def)?.source ?? def;
}
