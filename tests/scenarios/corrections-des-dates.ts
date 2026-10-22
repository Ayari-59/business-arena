/**
 * LES CORRECTIONS AU TRIMESTRE DES TEXTES QUI DATAIENT UN TOUR À TORT.
 *
 * Décision du propriétaire (« On corrige ») : trois sortes de textes portaient une
 * date fausse AU TRIMESTRE MÊME, et les relevés de `tests/fixtures/` l'ont
 * enregistrée telle quelle. Leur nouveau texte ne date rien et reste vrai à toutes
 * les durées (garde : saisons-textes-neutres.test.ts) ; au trimestre, il s'écarte
 * donc du relevé, et chaque écart est nommé ici, une fois, pour toutes les gardes
 * qui comparent à ces relevés :
 *
 *  · tests/scenarios/saisons-boutique-ecommerce.test.ts ;
 *  · tests/scenarios/saisons-fitness-nova-batiment-transport.test.ts ;
 *  · tests/scenarios/saisons-hotel-bistrot-conseil.test.ts ;
 *  · tests/scenarios/textes-a-la-duree.test.ts (VOLT FITNESS) ;
 *  · tests/scenarios/textes-a-la-duree-batiment-boutique-ecommerce.test.ts ;
 *  · tests/scenarios/textes-a-la-duree-conseil-hotel.test.ts ;
 *  · tests/scenarios/textes-a-la-duree-courriers.test.ts ;
 *  · tests/scenarios/textes-a-la-duree-nova-courriers.test.ts ;
 *  · tests/scenarios/textes-a-la-duree-transport-bistrot.test.ts.
 *
 * Les relevés ne sont pas réenregistrés : un écart que cette liste ne nomme pas
 * reste une régression. Chaque correction porte le code de la situation ou du
 * courrier (la variante sans assurance d'un courrier en hérite), la phrase
 * d'avant, celle d'après, et sa raison. `saisons-textes-neutres.test.ts` vérifie
 * que chacune s'applique encore à un relevé.
 */

export interface CorrectionDeDate {
  codes: string[];
  avant: string;
  apres: string;
  pourquoi: string;
}

const DETECTEE = "situation détectée : elle tombe à n'importe quel tour, la saison qu'elle supposait était souvent fausse";
const TIRE = "courrier tiré au sort, ou posé par l'enseignant : il tombe à n'importe quel tour, la date qu'il portait était souvent fausse";
const METEO =
  "récit météo d'un événement tiré à plusieurs tours, le calendrier de la partie bouclant : le temps qu'il racontait supposait une saison";

export const CORRECTIONS_DES_DATES: CorrectionDeDate[] = [
  // --- Les deux dates fausses au tour où elles tombent -----------------------
  {
    codes: ["batiment_t2_devis"],
    avant: "Mais vos équipes ont deux semaines creuses en février, et elles seront payées de toute façon.",
    apres: "Mais vos équipes ont deux semaines creuses entre deux chantiers, et elles seront payées de toute façon.",
    pourquoi: "au tour 2, le trimestre n'est pas celui de février ; les deux semaines sont un trou de planning (le tour 2 est l'un des plus chargés)",
  },
  {
    codes: ["batiment_t2_devis"],
    avant: "Les compagnons seront payés en février, chantier ou pas chantier.",
    apres: "Les compagnons seront payés pendant ces deux semaines, chantier ou pas chantier.",
    pourquoi: "le même trou de planning, sans date",
  },
  {
    codes: ["nova_inv_retournement"],
    avant: "nos stocks de rayon audio sont élevés à l'approche de la fin d'année.",
    apres: "nos stocks de rayon audio sont encore élevés au sortir du pic.",
    pourquoi: "le retournement tombe au tour 5, au lendemain du pic du tour 4 : au trimestre, la fin d'année est passée",
  },
  // --- Un courrier tiré à n'importe quel tour --------------------------------
  {
    codes: ["conseil_appel_offres_gagne"],
    avant: "La clôture budgétaire des collectivités approche :",
    apres: "Les collectivités lancent leurs consultations :",
    pourquoi: "le courrier se tire à tout tour : la clôture budgétaire n'approche qu'en fin d'année",
  },
  // --- LA TABLE D'AUGUSTIN · gamme, tour 3 : le traiteur tombe aussi ---------
  {
    codes: ["bistrotg_t3_matieres"],
    avant: "Seuls les buffets traiteur, si vous en avez, continuent de partir.",
    apres:
      "Les buffets traiteur, si vous en avez, n'y échappent pas : les entreprises et les collectivités du quartier commandent moins, elles aussi.",
    pourquoi: "au tour 3, le traiteur tombe à la saisonnalité des déjeuners d'affaires, et ses segments plus bas encore",
  },
  {
    codes: ["bistrotg_t3_matieres"],
    avant: "Seule l'activité traiteur, si elle est bâtie, garde ses clients.",
    apres: "L'activité traiteur, si elle est bâtie, n'y échappe pas : elle creuse au moins autant que les déjeuners d'affaires.",
    pourquoi: "la même affirmation, fausse au tableau de saisonnalité",
  },
  // --- Les situations détectées ----------------------------------------------
  {
    codes: ["novag_detect_stockout"],
    avant: "la Go double à Noël, pas la Studio",
    apres: "la Go double au pic, pas la Studio",
    pourquoi: DETECTEE,
  },
  { codes: ["novag_detect_idle_cash"], avant: "La caisse pleine d'après-Noël", apres: "La caisse pleine, et trois références à financer", pourquoi: DETECTEE },
  {
    codes: ["novag_detect_idle_cash"],
    avant: "Les ventes du pic ont été encaissées, CampusTech et la grande distribution ont fini par payer,",
    apres: "Vos ventes ont été encaissées, vos clients à terme ont fini par payer,",
    pourquoi: `${DETECTEE} ; CampusTech n'achète rien avant le tour 3`,
  },
  {
    codes: ["boutique_detect_profitable_illiquid", "bmono_detect_profitable_illiquid"],
    avant: "Le réassort de Noël",
    apres: "Le réassort du pic",
    pourquoi: DETECTEE,
  },
  {
    codes: ["boutique_detect_idle_cash", "bmono_detect_idle_cash"],
    avant: "La caisse pleine d'après-soldes",
    apres: "La caisse pleine entre deux collections",
    pourquoi: DETECTEE,
  },
  {
    codes: ["boutique_detect_idle_cash", "bmono_detect_idle_cash"],
    avant: "Les soldes ont vidé la réserve et rempli le compte",
    apres: "Vos ventes ont vidé la réserve et rempli le compte",
    pourquoi: DETECTEE,
  },
  {
    codes: ["boutique_detect_idle_cash", "bmono_detect_idle_cash"],
    avant: "La collection d'automne, elle,",
    apres: "La collection suivante, elle,",
    pourquoi: DETECTEE,
  },
  {
    codes: ["boutique_detect_idle_cash", "bmono_detect_idle_cash"],
    avant: "un solde de trésorerie élevé après les soldes signifie surtout que…",
    apres: "un solde de trésorerie élevé entre deux collections signifie surtout que…",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_capacity_saturated", "hotelg_detect_capacity_saturated"],
    avant: "Une capacité créée pour trois semaines d'été",
    apres: "Une capacité créée pour trois semaines de pic",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_capacity_saturated", "hotelg_detect_capacity_saturated"],
    avant: "(un pic d'été)",
    apres: "(un pic de haute saison)",
    pourquoi: DETECTEE,
  },
  { codes: ["hotel_detect_idle_cash"], avant: "Le compte plein de fin de saison", apres: "Le compte plein d'un métier saisonnier", pourquoi: DETECTEE },
  {
    codes: ["hotel_detect_idle_cash"],
    avant: "La saison forte est passée et le compte affiche",
    apres: "Le compte affiche",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_idle_cash"],
    avant: "tombera comme chaque trimestre, saison creuse comprise.",
    apres: "tombera comme chaque trimestre, que les chambres soient pleines ou vides.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_idle_cash", "hotelg_detect_idle_cash"],
    avant: "Le solde de septembre n'est pas un excédent : c'est ce qui doit faire passer l'hiver.",
    apres: "Le solde de fin de haute saison n'est pas un excédent : c'est ce qui doit faire passer la saison creuse.",
    pourquoi: `${DETECTEE} ; le principe reste, sans le mois ni la saison du calendrier`,
  },
  {
    codes: ["hotel_detect_idle_cash", "hotelg_detect_idle_cash"],
    avant: "Le budget de trésorerie projette la saison creuse à venir,",
    apres: "Le budget de trésorerie projette les tours à venir,",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_idle_cash", "hotelg_detect_idle_cash"],
    avant: "Seul lui distingue un vrai excédent de ce qui doit faire passer l'hiver.",
    apres: "Seul lui distingue un vrai excédent de ce qui doit faire passer la saison creuse.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotel_detect_idle_cash"],
    avant: "Projetez la saison creuse qui vient : salaires, énergie, entretien et échéance du crédit tombent alors que le remplissage s'effondre.",
    apres: "Projetez les tours qui viennent : salaires, énergie, entretien et échéance du crédit tombent même quand le remplissage s'effondre.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant: "Le compte plein de fin de saison, et trois chambres à faire passer l'hiver",
    apres: "Le compte plein, et trois chambres aux saisons différentes",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant:
      "La saison forte est passée : les suites des grandes occasions et les supérieures des escapades ont fait le plein, et le compte affiche",
    apres: "Le compte affiche",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant: "tombera comme chaque trimestre, saison creuse comprise, et l'hiver ne vendra ni suites ni escapades.",
    apres: "tombera comme chaque trimestre, que les chambres soient pleines ou vides, et chaque type de chambre a sa propre saison.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant: "quand le mix de l'hiver ne ressemble pas à celui de l'été ?",
    apres: "quand le mix des tours à venir ne ressemblera pas forcément à celui qui l'a rempli ?",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant: "avec le mix de chambres que l'hiver vendra vraiment",
    apres: "avec le mix de chambres que les tours à venir vendront vraiment",
    pourquoi: DETECTEE,
  },
  {
    codes: ["hotelg_detect_idle_cash"],
    avant:
      "Projetez la saison creuse chambre par chambre : la standard des groupes et la supérieure des affaires reviennent, les suites et les escapades s'effacent.",
    apres:
      "Projetez les tours qui viennent chambre par chambre : les groupes, les affaires, les escapades et les grandes occasions ne culminent pas tous au même tour.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["conseilg_detect_idle_cash"],
    avant: "qui vendrait à des DSI qui ne connaissent pas les congés,",
    apres: "qui vendrait à des DSI qui achètent en toute saison,",
    pourquoi: DETECTEE,
  },
  { codes: ["ecom_detect_idle_cash"], avant: "L'après-fêtes", apres: "Le compte plein", pourquoi: DETECTEE },
  {
    codes: ["ecomg_detect_idle_cash"],
    avant: "L'après-fêtes, et la capsule qui attend",
    apres: "Le compte plein, et la capsule qui attend",
    pourquoi: DETECTEE,
  },
  {
    codes: ["ecom_detect_idle_cash", "ecomg_detect_idle_cash"],
    avant: "Le pic des fêtes a rempli le compte",
    apres: "Vos ventes ont rempli le compte",
    pourquoi: DETECTEE,
  },
  {
    codes: ["ecom_detect_idle_cash"],
    avant: "Le trimestre qui s'ouvre est le plus creux de l'année, et les retours de décembre",
    apres: "Rien ne dit que le tour qui s'ouvre vendra autant, et les retours des dernières ventes",
    pourquoi: `${DETECTEE} ; le tour qui suit le pic n'est pas non plus le plus creux du tableau`,
  },
  {
    codes: ["ecomg_detect_idle_cash"],
    avant: "Le trimestre qui s'ouvre est le plus creux de l'année, les retours de décembre",
    apres: "Rien ne dit que le tour qui s'ouvre vendra autant, les retours des dernières ventes",
    pourquoi: `${DETECTEE} ; le tour qui suit le pic n'est pas non plus le plus creux du tableau`,
  },
  {
    codes: ["ecom_detect_idle_cash", "ecomg_detect_idle_cash"],
    avant: "Le solde de janvier porte encore les remboursements de décembre.",
    apres: "Le solde du tour d'après porte encore les remboursements du pic.",
    pourquoi: `${DETECTEE} ; la question pose elle-même « après un pic de ventes »`,
  },
  {
    codes: ["ecom_detect_idle_cash", "ecomg_detect_idle_cash"],
    avant: "Projetez le trimestre creux",
    apres: "Projetez le tour qui vient",
    pourquoi: DETECTEE,
  },
  {
    codes: ["ecom_detect_idle_cash", "ecomg_detect_idle_cash"],
    avant: "règlement des fournisseurs du pic, et remboursement des retours de décembre.",
    apres: "règlement des fournisseurs, et remboursement des derniers retours.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["ecom_detect_idle_cash", "ecomg_detect_idle_cash"],
    avant: "Le trimestre creux ne justifie pas un stock élevé.",
    apres: "Un compte plein ne justifie pas un stock élevé.",
    pourquoi: DETECTEE,
  },
  { codes: ["fitness_detect_idle_cash"], avant: "Janvier a rempli la caisse", apres: "La caisse pleine d'avance", pourquoi: DETECTEE },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "Les inscriptions de début d'année ont fait entrer",
    apres: "Les abonnements payés d'avance ont fait entrer",
    pourquoi: DETECTEE,
  },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "Cet argent doit pourtant faire vivre la salle jusqu'à décembre, y compris pendant l'été où plus personne ne s'inscrit.",
    apres: "Cet argent doit pourtant faire vivre la salle pendant toute la durée de ces abonnements, et les charges, elles, tombent à chaque tour.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "Bloquer cette somme reviendrait à financer janvier avec l'argent de novembre, qui n'est pas encore gagné.",
    apres: "Bloquer cette somme reviendrait à engager dès maintenant l'argent des derniers mois de l'abonnement, qui n'est pas encore gagné.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "les charges que l'encaissement de janvier doit couvrir.",
    apres: "les charges que cet encaissement d'avance doit couvrir.",
    pourquoi: DETECTEE,
  },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "Projetez l'année entière, et surtout le creux de l'été :",
    apres: "Projetez l'année entière, et surtout les tours creux :",
    pourquoi: DETECTEE,
  },
  {
    codes: ["fitness_detect_idle_cash"],
    avant: "le solde couvre les décaissements du trimestre, été compris.",
    apres: "le solde couvre les décaissements des tours à venir.",
    pourquoi: DETECTEE,
  },
  // --- Les courriers tirés au sort ------------------------------------------
  // Décision du propriétaire (« On traite les 27 courriers ») : un courrier tiré, ou
  // posé par l'enseignant au tour qu'il veut, tombe à n'importe quel tour ; sa date
  // était fausse à la plupart d'entre eux, au trimestre compris. Le métier et
  // l'événement restent, seule la date part.
  {
    codes: ["student_fair"],
    avant: "Salon de la Rentrée Étudiante · Commissariat général",
    apres: "Salon de l'Étudiant · Commissariat général",
    pourquoi: `${TIRE} ; le salon reste un salon d'étudiants`,
  },
  {
    codes: ["xxl_order"],
    avant: "pour notre opération de fin d'année",
    apres: "pour notre grande opération commerciale",
    pourquoi: TIRE,
  },
  {
    codes: ["xxl_order"],
    avant: "Notre opération de fin d'année portera",
    apres: "Notre grande opération commerciale portera",
    pourquoi: TIRE,
  },
  {
    codes: ["nova_campus_tender"],
    avant: "Appel d'offres — référencement audio de la rentrée",
    apres: "Appel d'offres — renouvellement du référencement audio",
    pourquoi: TIRE,
  },
  {
    codes: ["nova_campus_tender"],
    avant: "Notre enseigne renouvelle son rayon audio pour la rentrée et consulte quatre fabricants.",
    apres: "Notre enseigne renouvelle son rayon audio et consulte quatre fabricants.",
    pourquoi: TIRE,
  },
  {
    codes: ["nova_press_award"],
    avant: "La distinction paraîtra en couverture du numéro de rentrée ;",
    apres: "La distinction paraîtra en couverture de notre prochain numéro ;",
    pourquoi: TIRE,
  },
  {
    codes: ["boutique_pretexte_fete"],
    avant: "Saison des cadeaux avancée de trois semaines",
    apres: "Vos clientes fidèles achètent plus tôt que d'habitude",
    pourquoi: `${TIRE} ; l'objet dit l'effet, la demande des clientes fidèles`,
  },
  {
    codes: ["boutique_pretexte_fete"],
    avant: "Les magazines féminins ont lancé la saison plus tôt que d'habitude.",
    apres: "Les magazines féminins ont lancé les nouvelles collections plus tôt que d'habitude.",
    pourquoi: TIRE,
  },
  {
    codes: ["boutique_commande_ce"],
    avant: "pulls pour notre arbre de Noël",
    apres: "pulls pour la dotation de nos salariés",
    pourquoi: `${TIRE} ; la dotation du comité, comme l'offre de commande du même client`,
  },
  {
    codes: ["boutique_marche_noel"],
    avant: "Implantation du marché de Noël devant votre boutique",
    apres: "Implantation d'un marché artisanal devant votre boutique",
    pourquoi: `${TIRE} ; le marché, ses chalets et ses passants restent, comme dans la gazette`,
  },
  {
    codes: ["hotel_meteo_radieuse"],
    avant: "Été indien — hausse des réservations de dernière minute",
    apres: "Beau temps annoncé : hausse des réservations de dernière minute",
    pourquoi: `${TIRE} ; « hors saison », la forme d'hier au mois et à l'année, était faux au tour 3, le pic de L'ESCALE`,
  },
  {
    codes: ["hotel_meteo_radieuse"],
    avant: "Trois semaines de beau temps hors saison sont annoncées",
    apres: "Trois semaines de beau temps sont annoncées",
    pourquoi: `${TIRE} ; au tour 3, le pic de L'ESCALE, le beau temps n'est pas hors saison`,
  },
  {
    codes: ["hotel_festival"],
    avant: "Première édition du festival d'été",
    apres: "Première édition d'un festival de musique",
    pourquoi: `${TIRE} ; le corps dit déjà « un festival de musique »`,
  },
  {
    codes: ["ecom_banque_conciliante"],
    avant: "Financement de votre stock de fin d'année",
    apres: "Accord de financement de votre stock",
    pourquoi: `${TIRE} ; l'objet dit l'accord de la banque, le corps le détaille sans le répéter`,
  },
  {
    codes: ["ecom_black_friday"],
    avant: "Préparation de l'opération commerciale de fin novembre",
    apres: "Préparation de la grande opération commerciale du secteur",
    pourquoi: `${TIRE} ; l'opération et ses quatre jours restent, comme dans la gazette`,
  },
  {
    codes: ["fitness_rentree_sportive"],
    avant: "Affluence du premier lundi de janvier",
    apres: "Affluence d'un lundi de bonnes résolutions",
    pourquoi: `${TIRE} ; l'effet porte sur le segment des bonnes résolutions`,
  },
  {
    codes: ["fitness_rentree_sportive"],
    avant: "Ces adhérents-là remplissent la salle et repartent au printemps :",
    apres: "Ces adhérents-là remplissent la salle et repartent quand l'élan retombe :",
    pourquoi: TIRE,
  },
  {
    codes: ["fitness_contrat_surprise"],
    avant: "un accès à votre club à compter de janvier,",
    apres: "un accès à votre club dès à présent,",
    pourquoi: `${TIRE} ; les adhérents sont inscrits d'office au tour du courrier`,
  },
  {
    codes: ["fitness_marathon"],
    avant: "Les inscriptions sont ouvertes pour l'édition de printemps,",
    apres: "Les inscriptions sont ouvertes pour la prochaine édition,",
    pourquoi: TIRE,
  },
  {
    codes: ["fitness_marathon"],
    avant: "c'est combien seront encore là en juin.",
    apres: "c'est combien seront encore là une fois la course passée.",
    pourquoi: TIRE,
  },
  {
    codes: ["fitness_appli_gratuite"],
    avant: "les primo-pratiquants, ceux qui s'inscrivent en janvier,",
    apres: "les primo-pratiquants, ceux des bonnes résolutions,",
    pourquoi: `${TIRE} ; l'effet porte sur la demande des bonnes résolutions`,
  },
  {
    codes: ["transport_pic_ecommerce"],
    avant: "Appel à capacité pour le pic de fin d'année",
    apres: "Appel à capacité pour notre pic d'activité",
    pourquoi: `${TIRE} (dès le tour 2) ; le pic du donneur d'ordres est le sien`,
  },
  {
    codes: ["transport_pic_ecommerce"],
    avant: "Nos entrepôts passeront en trois-huit du quinze novembre au vingt-quatre décembre.",
    apres: "Nos entrepôts passeront en trois-huit pendant les six semaines de notre pic d'activité.",
    pourquoi: TIRE,
  },
  {
    codes: ["transport_peages"],
    avant: "augmentent de six pour cent au premier janvier",
    apres: "augmentent de six pour cent à la date de revalorisation",
    pourquoi: `${TIRE} ; la hausse s'applique au tour du courrier, l'effet le dit`,
  },
  // --- Les récits météo -------------------------------------------------------
  // Même décision : l'événement garde son effet, son tirage et ses tours ; seul le
  // récit change, pour un temps possible en toute saison qui justifie le même effet.
  {
    codes: ["fitness_canicule"],
    avant: "Épisode caniculaire — recommandations aux établissements sportifs",
    apres: "Pollution de l'air : recommandations aux établissements sportifs",
    pourquoi: `${METEO} (dès le tour 2, donc au tour 5) ; un épisode de pollution de l'air réduit l'accueil de même, en toute saison`,
  },
  {
    codes: ["fitness_canicule"],
    avant:
      "Le département est placé en vigilance canicule pour la semaine. Il est recommandé de limiter la fréquentation aux heures les plus chaudes et d'interrompre les activités si la température intérieure dépasse trente degrés.",
    apres:
      "Le département est placé en alerte pour un épisode de pollution de l'air toute la semaine. Il est recommandé de réduire l'intensité des séances, de limiter la fréquentation des plateaux et des cours collectifs, et de déconseiller la pratique aux personnes sensibles.",
    pourquoi: METEO,
  },
  {
    codes: ["fitness_canicule"],
    avant: "L'été cumule tout : moins d'adhérents, plus d'énergie, et des charges qui ne bougent pas.",
    apres: "Une salle qui accueille moins ne coûte pas moins : le loyer et les salaires tombent comme à chaque tour.",
    pourquoi: `${METEO} ; l'effet ne porte que sur la capacité d'accueil, pas sur l'énergie`,
  },
  {
    codes: ["cold_wave"],
    avant: "Épisode de grand froid — restrictions de circulation",
    apres: "Vigilance intempéries : restrictions de circulation",
    pourquoi: `${METEO} (dès le tour 2, donc en plein été au trimestre) ; des intempéries arrêtent les poids lourds en toute saison`,
  },
  {
    codes: ["cold_wave"],
    avant:
      "Un épisode de froid intense frappe la région pour plusieurs jours. La circulation des poids lourds est restreinte, les livraisons sont retardées et les ateliers non chauffés doivent réduire leur activité.",
    apres:
      "Un épisode de pluies diluviennes et de vents violents frappe la région pour plusieurs jours. La circulation des poids lourds est restreinte, les livraisons sont retardées et des coupures de courant ralentissent les ateliers.",
    pourquoi: `${METEO} ; les coupures de courant justifient la même perte de disponibilité des machines`,
  },
  {
    codes: ["batiment_intemperies"],
    avant: "La période de pluie et de gel annoncée",
    apres: "La période de fortes pluies et de vents violents annoncée",
    pourquoi: `${METEO} (dès le tour 2) ; la pluie et le vent arrêtent un chantier en toute saison, le gel non`,
  },
  // --- Deux étapes d'investissement, datées à tort à leur tour fixe ---------
  {
    codes: ["hotel_inv_retournement"],
    avant: "Révision des volumes de notre programmation d'automne",
    apres: "Révision des volumes de notre programmation",
    pourquoi:
      "le retournement tombe au tour 5 et réduit le contingent pendant deux tours, le sien et le suivant (de janvier à juin au trimestre) : aucun n'est l'automne",
  },
  {
    codes: ["ecom_inv_retournement"],
    avant: "redéploie son espace de tête de rayon vers la rentrée scolaire",
    apres: "redéploie son espace de tête de rayon vers d'autres catégories",
    pourquoi:
      "le retournement tombe au tour 5 (janvier à mars au trimestre) et vaut pour ce tour et le suivant : la rentrée scolaire est loin de l'un comme de l'autre",
  },
];

/** Le code d'une clé de relevé : « hotel/hotel_detect_idle_cash » ou « nova_inv_retournement (sans assurance) ». */
const codeDe = (cle: string) => cle.replace(/ \(sans assurance\)$/, "").split("/").pop()!;

/** Les textes d'un relevé, aux corrections des dates près. */
export function corrigerLesDates(cle: string, textes: readonly string[]): string[] {
  const code = codeDe(cle);
  const siennes = CORRECTIONS_DES_DATES.filter((c) => c.codes.includes(code));
  return textes.map((t) => siennes.reduce((acc, c) => acc.split(c.avant).join(c.apres), t));
}
