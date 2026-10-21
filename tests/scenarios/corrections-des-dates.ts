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
];

/** Le code d'une clé de relevé : « hotel/hotel_detect_idle_cash » ou « nova_inv_retournement (sans assurance) ». */
const codeDe = (cle: string) => cle.replace(/ \(sans assurance\)$/, "").split("/").pop()!;

/** Les textes d'un relevé, aux corrections des dates près. */
export function corrigerLesDates(cle: string, textes: readonly string[]): string[] {
  const code = codeDe(cle);
  const siennes = CORRECTIONS_DES_DATES.filter((c) => c.codes.includes(code));
  return textes.map((t) => siennes.reduce((acc, c) => acc.split(c.avant).join(c.apres), t));
}
