import { HOTEL_SITUATIONS } from "../hotel/situations";
import { patchSituationText, type SituationTextPatch } from "../situation-patch";
import type { SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de L'ESCALE · GAMME.
 *
 * Même dramaturgie que l'hôtel d'origine (reprise, brader ou tenir, haute
 * saison, plateformes, rénovation, écarts, et les trois situations
 * détectées), posée sur trois chambres qui se partagent le même bâtiment.
 * Ce que la gamme ajoute : le MIX. Un revenu par chambre disponible se lit
 * par type de chambre, un seuil se calcule à mix constant, on brade la
 * standard sans toucher à la suite, et un écart de chiffre d'affaires cache
 * un écart de mix.
 *
 * Les situations sont HÉRITÉES de l'hôtel : même structure (matrice des
 * modèles, options, indices, notions), sous d'autres codes, et le texte de
 * celles que le mix change est réécrit ; les autres sont reprises telles
 * quelles, le raisonnement y étant le même en un ou trois prix.
 */

const CODE = (code: string) => code.replace(/^hotel_/, "hotelg_");

const PATCHES: Record<string, SituationTextPatch> = {
  hotel_t1_reprise: {
    title: "Soixante chambres, trois prix",
    narrative:
      "Vous reprenez L'ESCALE : 60 chambres, quatorze salariés, 900 000 € de crédit immobilier. L'ancien exploitant vendait « la nuitée » à un prix moyen ; vous vendez trois chambres, la standard des vacanciers et des groupes, la supérieure des clients d'affaires et des escapades, la suite des grandes occasions. Le trimestre offre 5 400 nuitées à répartir entre les trois. Pas une de plus, pas une reportable.",
    problem:
      "Qu'est-ce qui distingue une nuitée invendue d'un article invendu, et pourquoi le prix moyen ne suffit-il plus quand on vend trois chambres ?",
    diagnosticLabels: [
      "Elle est définitivement perdue : une nuit ne se stocke pas et ne se revend jamais, quel que soit le type de chambre",
      "Les charges de structure tombent que les chambres soient occupées ou non, et elles sont communes aux trois types",
      "Elle se reporte sur le trimestre suivant, comme un stock",
      "Elle ne coûte rien puisqu'on n'a rien dépensé pour elle",
    ],
    hintTexts: [
      "Comptez ce que l'hôtel peut vendre au maximum sur un trimestre : 60 chambres × 90 nuits, tous types confondus.",
      "Une chambre vide ce soir ne se vendra pas deux fois demain. La capacité est offerte chaque jour et expire chaque nuit, pour la suite comme pour la standard.",
      "Vos charges de structure (salaires, énergie, taxes, assurances) ne dépendent ni du nombre de clients ni du type de chambre vendu.",
      "Marge par nuitée : standard 88 − 21 = 67 €, supérieure 125 − 26 = 99 €, suite 220 − 39 = 181 €. Charges de structure décaissées = 158 000 € par trimestre.",
      "Le seuil se calcule à mix constant : charges de structure divisées par la marge MOYENNE d'une nuitée vendue au mix prévu. Plus de suites dans le mix, moins de nuitées à vendre pour équilibrer.",
    ],
    modelExplain:
      "Le seuil de rentabilité traduit la question du secteur en une phrase : quel taux d'occupation faut-il atteindre pour ne plus perdre d'argent ? Avec trois chambres, il se calcule à mix constant, et le mix devient une décision.",
  },
  hotel_t2_yield: {
    title: "Brader la standard, tenir la suite ?",
    narrative:
      "Jeudi soir, 18 h. Dix-sept chambres standard sont encore libres pour la nuit, et deux suites. Une plateforme vous propose d'écouler les standard à 58 €, bien en dessous de votre tarif de 88 €, et propose de faire de même pour les suites à 140 €, sous les yeux de vos clients habituels.",
    problem:
      "Accepter 58 € pour une chambre qui vaut 88 € : décision absurde ou bonne gestion ? Et la même règle vaut-elle pour la suite ?",
    diagnosticLabels: [
      "Tant que le prix dépasse le coût variable de la chambre (21 € pour la standard, 39 € pour la suite), la vente améliore le résultat",
      "Mais brader systématiquement abîme le tarif de référence, et la suite porte l'image de tout l'hôtel : on la brade en dernier",
      "Il ne faut jamais vendre sous le tarif affiché, à aucune condition",
      "Il faut refuser : 58 € ne couvre pas le coût complet d'une chambre",
    ],
    hintTexts: [
      "Posez la question autrement : que se passe-t-il si vous refusez ? La chambre reste vide et rapporte zéro, standard ou suite.",
      "Comparez deux scénarios pour chaque type : vendre au prix bradé, ou ne rien vendre du tout. Qu'est-ce qui change dans vos charges ?",
      "Les charges de structure sont déjà engagées : elles ne dépendent pas de cette décision. On parle de coûts non pertinents.",
      "Standard : 58 − 21 = 37 € de marge gagnée face à zéro. Suite : 140 − 39 = 101 € face à zéro. Le calcul comptable est le même.",
      "Mais l'arbitrage n'est pas seulement comptable : le tarif bradé est visible, et la suite est ce que vos clients d'affaires et vos grandes occasions regardent. Le yield management brade tard, peu, et d'abord la chambre qui porte le moins l'image.",
    ],
    modelExplain:
      "L'analyse des coûts pertinents isole ce que la décision change vraiment, le coût variable de la chambre concernée, et écarte les charges déjà engagées. Elle se fait chambre par chambre : brader une standard ne brade pas la suite.",
  },
  hotel_t3_saison: {
    title: "La haute saison change le mix",
    narrative:
      "L'été approche : le tourisme de loisirs double sur les standard, les escapades remplissent les supérieures, la clientèle affaires s'effondre et les séminaires disparaissent. Les grandes occasions, elles, font leur saison sur les suites. Vos concurrents affichent déjà leurs tarifs de juillet, chambre par chambre.",
    problem:
      "Comment vos trois tarifs et vos effectifs doivent-ils suivre une demande qui change de nature et de mix, pas seulement de volume ?",
    diagnosticLabels: [
      "Le mix de clientèle change par type de chambre : le segment qui domine l'été n'a ni la même élasticité ni le même délai de paiement",
      "Les embauches doivent être décidées avant le pic : elles ne produisent leur effet qu'au tour suivant, et une suite demande plus d'heures qu'une standard",
      "Les trois tarifs doivent rester identiques toute l'année, par souci d'équité",
      "La capacité augmente naturellement en haute saison",
    ],
    hintTexts: [
      "Regardez la saisonnalité de chaque segment séparément, chambre par chambre, pas seulement la saisonnalité globale.",
      "L'été, les affaires tombent à 0,5 sur la supérieure, mais les loisirs grimpent à 2,0 sur la standard et les grandes occasions à 1,5 sur la suite. Ce n'est pas un pic : c'est un autre mix.",
      "Chaque segment a son élasticité et son délai de paiement : le mix vendu détermine à la fois votre latitude tarifaire et votre trésorerie.",
      "Côté capacité, 0,75 h de travail par nuitée standard, 1,3 h par suite : à 14 salariés, la main-d'œuvre peut devenir contraignante avant les chambres, surtout si le mix monte.",
      "Décidez les embauches AU TOUR PRÉCÉDENT le pic : le coût de recrutement est immédiat, l'effet sur la capacité arrive au tour suivant.",
    ],
    modelExplain:
      "L'analyse de capacité, croisée avec la saisonnalité par segment et par chambre, dimensionne effectifs et tarifs avant le pic plutôt qu'après, en comptant les heures que chaque type de chambre consomme.",
  },
  hotel_t6_ecarts: {
    title: "La saison prévue, la saison vécue, chambre par chambre",
    narrative:
      "La saison est finie. Vous aviez annoncé un taux d'occupation et un prix moyen ; l'hôtel a fait autre chose. Le chiffre d'affaires final est proche de la prévision, mais pas pour les raisons que vous croyiez : vous avez vendu plus de standard et moins de suites que prévu, et le prix moyen a baissé sans qu'aucun tarif n'ait bougé.",
    problem:
      "Un chiffre d'affaires conforme à la prévision suffit-il à dire que la saison s'est passée comme prévu, quand le mix a changé ?",
    diagnosticLabels: [
      "Un écart global peut cacher trois écarts de sens contraire, sur le volume, sur les prix et sur le mix des chambres vendues",
      "Vendre plus de standard et moins de suites n'a pas les mêmes conséquences que l'inverse : le personnel a travaillé autrement, et la marge n'est pas la même",
      "Un chiffre d'affaires conforme signifie que la prévision était juste",
      "Un écart qui se répète d'une saison à l'autre relève du hasard",
    ],
    hintTexts: [
      "Ouvrez l'historique de vos ventes : vos prévisions y figurent en face du réalisé, tour par tour et chambre par chambre.",
      "Séparez l'écart en trois : combien de nuitées de plus ou de moins, à quel prix par chambre, et dans quel mix ?",
      "Multipliez l'écart de volume par le prix prévu de chaque chambre : voilà l'écart imputable au remplissage. Ce que le mix explique se lit en comparant le prix moyen prévu au prix moyen réalisé à tarifs inchangés.",
      "Regardez le SENS de vos écarts sur les six tours. Toujours plus de standard que prévu ? Toujours moins de suites ?",
      "Un écart constant dans le même sens n'est pas de la malchance : c'est votre méthode qui est biaisée, et elle se corrige.",
    ],
    modelExplain:
      "L'analyse des écarts sépare ce que le volume explique, ce que le prix explique, et ce que le mix explique. Un chiffre d'affaires conforme peut recouvrir trois erreurs qui se compensent.",
  },
  hotel_detect_idle_cash: {
    title: "Le compte plein de fin de saison, et trois chambres à faire passer l'hiver",
    narrative:
      "La saison forte est passée : les suites des grandes occasions et les supérieures des escapades ont fait le plein, et le compte affiche plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an ; il facture votre découvert 9 %. L'échéance du crédit immobilier, elle, tombera comme chaque trimestre, saison creuse comprise, et l'hiver ne vendra ni suites ni escapades.",
    problem:
      "Cet argent qui dort, faut-il le placer, et jusqu'à quel montant, quand le mix de l'hiver ne ressemble pas à celui de l'été ?",
    diagnosticLabels: [
      "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner",
      "Le montant bloqué ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir, avec le mix de chambres que l'hiver vendra vraiment",
      "Puisque le placement rapporte, autant y mettre la totalité du solde",
      "Placer améliore le résultat d'exploitation de l'entreprise",
    ],
    hintTexts: [
      "Comparez votre solde aux charges d'un seul trimestre : combien de trimestres pourriez-vous tenir sans vendre une nuitée ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez la saison creuse chambre par chambre : la standard des groupes et la supérieure des affaires reviennent, les suites et les escapades s'effacent. Salaires, énergie, entretien et échéance du crédit tombent quand même.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ],
    modelExplain:
      "Le budget de trésorerie projette la saison creuse à venir, chambre par chambre, échéance du crédit comprise. Seul lui distingue un vrai excédent de ce qui doit faire passer l'hiver.",
  },
};

export const HOTEL_GAMME_SITUATIONS: SituationDef[] = HOTEL_SITUATIONS.map((s) => {
  const patch = PATCHES[s.code];
  const renamed: SituationDef = { ...s, code: CODE(s.code) };
  return patch ? patchSituationText(renamed, patch) : renamed;
});
