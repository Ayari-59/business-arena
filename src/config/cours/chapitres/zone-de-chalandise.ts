import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  COMMUNE_DE_VAUCLAIR,
  DEPENSE_DE_JANVIER_PAR_HABITANT,
  HAUSSE_VISEE_DANS_LA_ZONE,
  ORIGINE_DES_CLIENTS,
  POLES_DE_REILLY,
  ZONES,
  gagnerDansLaZone,
  partDuCentreVille,
  pointDeRupture,
  pointsPourLObjectif,
  reilly,
  zoneDeChalandise,
  type CodeDeZone,
} from "../monde/clientele-de-la-boutique";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./taux-de-marque";

/**
 * CHAPITRE : LA ZONE DE CHALANDISE (BTS MCO, bloc 1, palier 2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), ses
 * clientes fidèles et ses passants de janvier, et la zone où ils habitent (monde/clientele-de-la-boutique.ts,
 * `zoneDeChalandise`, `reilly`, `gagnerDansLaZone`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : d'où viennent les clients, combien la zone dépense, et quelle part la boutique en prend.
 * L'élève découpe la zone en temps d'accès, calcule la dépense commercialisable de chaque zone
 * (population × dépense par habitant × indice de disparité), le chiffre d'affaires que la boutique y
 * réalise (le relevé des codes postaux en caisse), la part de marché réelle, le taux d'emprise, puis la
 * part de marché théorique par la méthode des surfaces. Il compare l'attraction du centre-ville à celle
 * du centre commercial par la loi de Reilly, trouve le point de rupture au curseur, lit la zone du site
 * (l'unité commerciale virtuelle), et décide où porter l'effort pour l'objectif de la direction.
 *
 * Le piège central : la zone primaire, où la boutique fait le plus de chiffre, est déjà au-dessus de sa
 * part théorique ; le réservoir est la zone secondaire. Et une grosse dépense lointaine ne se capte pas :
 * le centre commercial l'attire.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026) :
 *   · guidé : intro, les-sources, la-depense, le-chiffre-par-zone (la formule dans la question) ;
 *   · autonome : la-part-de-marche, le-taux-d-emprise, la-part-theorique ;
 *   · l'expérience avant la formule : predire-reilly puis reilly-a-vauclair, et le-point-de-rupture au
 *     curseur (la dépense d'une commune attirée par chaque pôle selon sa distance) ;
 *   · le laboratoire : le-laboratoire-de-la-zone (la zone et les points de part de marché gagnés,
 *     l'objectif face à la part théorique ; le graphique du chiffre gagné) ;
 *   · expert : la-zone-du-site, l-objectif-a-rebours ; puis ou-porter-l-effort et la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts de marché, d'emprise et de Reilly se donnent à deux
 * décimales (au dixième, avant) ; le rapport de Reilly est une grandeur au centième, et la part part
 * de lui ; les clients et les passages sont des quantités, les passages arrondis à l'unité au-dessus.
 */

const qte = nombreAuCentieme;
const enKm = (m: number) => `${(m / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;

/** Pourquoi la boutique seule, dit à l'élève qui arrive d'une autre entreprise. */
export const POURQUOI_LA_ZONE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les clients de janvier et les communes où ils habitent : la zone de chalandise se trace autour d'elle, quelle que soit votre entreprise.";

/** Les zones, dans l'ordre du levier à choix du laboratoire (rang à partir de 1). */
export const rangDeLaZone = (code: CodeDeZone) => ZONES.findIndex((z) => z.code === code) + 1;
export const zoneDuRang = (rang: number): CodeDeZone => ZONES[rang - 1]!.code;

/** Le départ du laboratoire : la zone primaire, sans point gagné. La solution : la zone secondaire, au plus petit nombre de points qui atteint l'objectif. */
export const DEPART_DU_LABORATOIRE = { zone: "primaire" as CodeDeZone, points: 1 };
export const POINTS_DU_LABORATOIRE = { min: 0, max: 4, pas: 0.1 } as const;

/** La zone de chalandise du chapitre : tout ce que le chapitre et son cas demandent. */
export function zoneDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = zoneDeChalandise(f);
  const v = reilly(POLES_DE_REILLY.centreVille.surface, POLES_DE_REILLY.centreCommercial.surface, COMMUNE_DE_VAUCLAIR.versLeCentreVille, COMMUNE_DE_VAUCLAIR.versLeCentreCommercial);
  const secondaire = ZONES.find((z) => z.code === "secondaire")!;
  const depenseDeVauclair = auCentime(COMMUNE_DE_VAUCLAIR.population * DEPENSE_DE_JANVIER_PAR_HABITANT * secondaire.idc);
  const rupture = Math.round(pointDeRupture());
  const s = k.zone("secondaire");
  const partVisee = (s.chiffre + k.objectif) / s.depense;
  const passagesEnPlus = Math.ceil(k.objectif / k.panierTtcDesPassants - 1e-9);
  return {
    f,
    k,
    v,
    depenseDeVauclair,
    // La copie de Reilly : le rapport au centième, puis la part à deux décimales, puis la dépense au centime.
    rapport: auCentime(v.rapport),
    partDuCentreVille: auCentime((auCentime(v.rapport) / (1 + auCentime(v.rapport))) * 100),
    versLeCentreVille: auCentime((depenseDeVauclair * auCentime((auCentime(v.rapport) / (1 + auCentime(v.rapport))) * 100)) / 100),
    rupture,
    partVisee,
    passagesEnPlus,
    pointsSecondaire: pointsPourLObjectif(f, "secondaire"),
  };
}

/** La dépense d'une commune de la taille de Vauclair, attirée par le centre-ville, à une distance donnée du centre-ville. */
export const attireeParLeCentreVille = (c: Pick<Cas, "code">, distance: number) => auCentime(zoneDuChapitre(c).depenseDeVauclair * partDuCentreVille(distance));

/** Les zones : accès, population, indice de disparité, surfaces de maille. Le document de départ. */
export function tableauDesZones(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = zoneDuChapitre(c);
  return {
    titre: `La zone de chalandise de ${x.f.entreprise}`,
    colonnes: ["Accès", "Habitants", "Indice de disparité", "Surfaces de maille"],
    lignes: x.k.zones.map((z) => ({ libelle: z.nom, valeurs: [z.acces, qte(z.population), qte(z.idc), `${qte(z.surfaceDeMaille)} m²`] })),
  };
}

/** D'où viennent les clients de janvier : le relevé des codes postaux en caisse. */
export function tableauDesOrigines(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = zoneDuChapitre(c);
  const ligne = (libelle: string, cle: CodeDeZone | "horsZone") => ({
    libelle,
    valeurs: [pct(ORIGINE_DES_CLIENTS.fideles[cle] * 100), pct(ORIGINE_DES_CLIENTS.passants[cle] * 100)],
  });
  return {
    titre: `D'où viennent les clients de ${x.f.moisDeReference} (fidèles : ${eur(x.k.fideles.ttc)} TTC ; passants : ${eur(x.k.passants.ttc)} TTC)`,
    colonnes: ["Clientes fidèles", "Passants"],
    lignes: [...x.k.zones.map((z) => ligne(z.nom, z.code)), ligne("Hors zone", "horsZone")],
  };
}

/** La synthèse : la zone, zone par zone. */
function tableauDeLaSynthese(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = zoneDuChapitre(c);
  return {
    titre: `Les trois zones de ${x.f.entreprise}, en ${x.f.moisDeReference}`,
    colonnes: ["Dépense", "Chiffre TTC", "Part réelle", "Part théorique", "Potentiel"],
    lignes: x.k.zones.map((z) => ({ libelle: z.nom, valeurs: [eur(z.depense), eur(z.chiffre), pct(auCentime(z.part * 100)), pct(z.partTheorique * 100), eur(z.potentiel)] })),
  };
}

export const ZONE_DE_CHALANDISE: Chapitre = {
  code: "zone-de-chalandise",
  parcours: "mco",
  palier: 2,
  blocs: ["BTS MCO Bloc 1 · Développer la relation client et assurer la vente conseil"],
  titre: "La zone de chalandise",
  accroche:
    "D'où viennent les clients, combien leur zone dépense en maille, et quelle part la boutique en prend ? Dépense commercialisable, part de marché réelle et théorique, loi de Reilly : où porter l'effort pour gagner 10 % de chiffre d'affaires.",
  objectifs: [
    "Découper une zone de chalandise en temps d'accès et nommer les sources qui la décrivent",
    "Calculer la dépense commercialisable de chaque zone et le chiffre d'affaires que la boutique y réalise",
    "Calculer la part de marché réelle, le taux d'emprise et la part de marché théorique d'une zone",
    "Comparer l'attraction de deux pôles par la loi de Reilly et trouver le point de rupture",
    "Choisir la zone où porter l'effort, et la part de marché à gagner pour un objectif",
  ],
  libre: false,
  prerequis: ["indicateurs-du-point-de-vente"],
  ensuite: ["interroger-les-clients"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI_LA_ZONE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une zone, trois cercles",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDesZones,
      texte: (c) => {
        const x = zoneDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, en ${x.f.moisDeReference}. La zone de chalandise est le territoire d'où vient l'essentiel de ses clients. On la découpe en temps d'accès, par des courbes isochrones : la zone primaire, la plus proche, puis la secondaire et la tertiaire.`,
          "Chaque zone se décrit par ses habitants (combien, quels revenus, quel âge), par ses concurrents et par ses accès. Le manager s'en sert pour viser ses actions : où distribuer un tract, quel horaire ouvrir, quelle gamme mettre en avant.",
          `Ce que la simulation suppose. Un habitant dépense en moyenne ${eur(DEPENSE_DE_JANVIER_PAR_HABITANT)} TTC en maille en ${x.f.moisDeReference}. L'indice de disparité corrige cette moyenne selon les revenus de la zone. Les comités d'entreprise ne sont pas des ménages : ils restent hors de la zone.`,
        ];
      },
      repere: () => "Dépense commercialisable d'une zone = habitants × dépense moyenne par habitant × indice de disparité.",
    },
    {
      id: "les-sources",
      objectifs: [0],
      type: "tri",
      titre: "Les sources de la zone",
      notions: ["segmentation"],
      question: () =>
        "Pour tracer et décrire sa zone, la boutique croise plusieurs sources. Rangez chacune : une source interne vient de la boutique elle-même, une source externe vient d'un organisme ou du terrain.",
      categories: [
        { code: "interne", libelle: "Source interne" },
        { code: "externe", libelle: "Source externe" },
      ],
      elements: () => [
        { libelle: "Le relevé des codes postaux en caisse", montant: 0, categorie: "interne", pourquoi: "La boutique le tient elle-même, client par client : c'est l'outil le plus simple pour tracer la zone réelle." },
        { libelle: "Les adresses du fichier de la carte de fidélité", montant: 0, categorie: "interne", pourquoi: "Le fichier clients appartient à la boutique : il situe les fidèles, rue par rue." },
        { libelle: "La mesure d'audience du site de la boutique", montant: 0, categorie: "interne", pourquoi: "Elle situe les visiteurs du site : la zone de l'unité commerciale virtuelle." },
        { libelle: "Le recensement de la population par l'INSEE", montant: 0, categorie: "externe", pourquoi: "Un organisme public le publie : habitants, âges, ménages, commune par commune." },
        { libelle: "L'indice de disparité de la dépense publié pour la commune", montant: 0, categorie: "externe", pourquoi: "Il vient d'un organisme d'études : il dit si la zone dépense plus ou moins que la moyenne." },
        { libelle: "Le relevé des concurrents et de leurs surfaces", montant: 0, categorie: "externe", pourquoi: "C'est une observation du terrain, hors de la boutique : une source externe, que l'on recueille soi-même." },
      ],
      explication: () => [
        "Les sources internes disent qui sont les clients d'aujourd'hui ; les sources externes disent qui pourrait le devenir. Une information se recherche, se recueille, se range dans le système d'information de la boutique, puis se met à jour : le recensement change, les concurrents aussi.",
      ],
      relance: "Demandez-vous qui produit l'information : la boutique, avec ses propres outils, ou quelqu'un d'autre ?",
    },
    {
      id: "la-depense",
      objectifs: [1],
      type: "montants",
      titre: "Ce que chaque zone dépense",
      notions: ["demand_market_share"],
      tableau: tableauDesZones,
      question: () =>
        `Calculez la dépense commercialisable de janvier en maille de chaque zone : ses habitants × ${eur(DEPENSE_DE_JANVIER_PAR_HABITANT)} par habitant × son indice de disparité.`,
      champs: (c) =>
        zoneDuChapitre(c).k.zones.map((z) => ({
          libelle: `Dépense commercialisable · ${z.nom}`,
          attendu: z.depense,
          calcul: `${qte(z.population)} × ${eur(DEPENSE_DE_JANVIER_PAR_HABITANT)} × ${qte(z.idc)} = ${eur(z.depense)}`,
        })),
      explication: (c) => {
        const x = zoneDuChapitre(c);
        const p = x.k.zone("primaire");
        const t = x.k.zone("tertiaire");
        return [
          `Les trois zones dépensent ${eur(x.k.depense)} en maille en janvier. La zone tertiaire pèse le plus, ${eur(t.depense)}, parce qu'elle est peuplée ; la zone primaire dépense plus par habitant (indice ${qte(p.idc)}), mais compte moins d'habitants.`,
        ];
      },
    },
    {
      id: "le-chiffre-par-zone",
      objectifs: [1],
      type: "montants",
      titre: "Ce que la boutique réalise dans chaque zone",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDesOrigines,
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `Le relevé des codes postaux dit d'où viennent les clients. Calculez le chiffre d'affaires TTC de janvier que la boutique réalise dans chaque zone : la part de la zone × le chiffre des fidèles (${eur(x.k.fideles.ttc)}), plus la part de la zone × celui des passants (${eur(x.k.passants.ttc)}).`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        return x.k.zones.map((z) => ({
          libelle: `Chiffre d'affaires TTC · ${z.nom}`,
          attendu: z.chiffre,
          calcul: `${pct(ORIGINE_DES_CLIENTS.fideles[z.code] * 100)} × ${eur(x.k.fideles.ttc)} + ${pct(ORIGINE_DES_CLIENTS.passants[z.code] * 100)} × ${eur(x.k.passants.ttc)} = ${eur(z.chiffre)}`,
        }));
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        return [
          `Les trois zones font ${eur(x.k.chiffreEnCaisse - x.k.horsZone.chiffre)} ; le reste, ${eur(x.k.horsZone.chiffre)}, vient de passants d'au-delà. La zone primaire fait presque la moitié du chiffre en caisse : la boutique vit d'abord de ses voisins.`,
        ];
      },
    },
    {
      id: "la-part-de-marche",
      objectifs: [2],
      type: "montants",
      titre: "La part de marché, zone par zone",
      notions: ["demand_market_share"],
      question: () => "Sans formule cette fois. Calculez la part de marché de la boutique dans chaque zone en janvier, en pourcentage, à deux décimales.",
      champs: (c) =>
        zoneDuChapitre(c).k.zones.map((z) => ({
          libelle: `Part de marché · ${z.nom} (%)`,
          attendu: auCentime(z.part * 100),
          calcul: `${eur(z.chiffre)} ÷ ${eur(z.depense)} × 100 = ${pct(auCentime(z.part * 100))}`,
        })),
      explication: (c) => {
        const x = zoneDuChapitre(c);
        const [p, s, t] = x.k.zones;
        return [
          `La boutique prend ${pct(auCentime(p!.part * 100))} de la dépense de ses voisins, ${pct(auCentime(s!.part * 100))} de la première couronne, ${pct(auCentime(t!.part * 100))} au-delà. Plus on s'éloigne, plus d'autres magasins sont plus près du client : la part de marché fond avec la distance.`,
        ];
      },
    },
    {
      id: "le-taux-d-emprise",
      objectifs: [2],
      type: "montants",
      titre: "Le taux d'emprise",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDesOrigines,
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `Les ${qte(x.k.fideles.tickets)} clientes fidèles et les ${qte(x.k.passants.tickets)} passants se répartissent comme le tableau l'indique. Comptez les clients de chaque zone, puis le taux d'emprise de la zone primaire et de la zone secondaire : leurs clients ÷ leurs habitants, en pourcentage, au centième.`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        const p = x.k.zone("primaire");
        const s = x.k.zone("secondaire");
        return [
          ...x.k.zones.map((z) => ({ libelle: `Clients · ${z.nom}`, nature: "quantite" as const, attendu: z.clients, calcul: `${qte(z.fideles)} fidèles + ${qte(z.passants)} passants = ${qte(z.clients)}` })),
          { libelle: "Taux d'emprise · Zone primaire (%)", attendu: auCentime(p.emprise * 100), calcul: `${qte(p.clients)} ÷ ${qte(p.population)} × 100 = ${pct(auCentime(p.emprise * 100))}` },
          { libelle: "Taux d'emprise · Zone secondaire (%)", attendu: auCentime(s.emprise * 100), calcul: `${qte(s.clients)} ÷ ${qte(s.population)} × 100 = ${pct(auCentime(s.emprise * 100))}` },
        ];
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        const p = x.k.zone("primaire");
        const s = x.k.zone("secondaire");
        return [
          `Dans la zone primaire, ${pct(auCentime(p.emprise * 100))} des habitants sont passés en caisse en janvier ; dans la secondaire, ${pct(auCentime(s.emprise * 100))}. Le taux d'emprise compte des personnes, la part de marché des euros : les deux disent la même chose, que la boutique touche bien moins la première couronne.`,
        ];
      },
    },
    {
      id: "la-part-theorique",
      objectifs: [2],
      type: "montants",
      titre: "La part de marché théorique",
      notions: ["demand_market_share"],
      tableau: tableauDesZones,
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `Par la méthode des surfaces, la part théorique d'un magasin dans une zone est sa surface (${qte(x.f.surfaceDeVente)} m²) ÷ les surfaces de maille où achètent les habitants de la zone. Calculez la part théorique de chaque zone, en pourcentage, puis le chiffre que la boutique pourrait encore gagner dans la zone secondaire et dans la tertiaire.`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        const s = x.k.zone("secondaire");
        const t = x.k.zone("tertiaire");
        return [
          ...x.k.zones.map((z) => ({
            libelle: `Part théorique · ${z.nom} (%)`,
            attendu: auCentime(z.partTheorique * 100),
            calcul: `${qte(x.f.surfaceDeVente)} ÷ ${qte(z.surfaceDeMaille)} × 100 = ${pct(z.partTheorique * 100)}`,
          })),
          { libelle: "Chiffre à gagner · Zone secondaire", attendu: s.potentiel, calcul: `${pct(s.partTheorique * 100)} × ${eur(s.depense)} − ${eur(s.chiffre)} = ${eur(s.chiffreTheorique)} − ${eur(s.chiffre)} = ${eur(s.potentiel)}` },
          { libelle: "Chiffre à gagner · Zone tertiaire", attendu: t.potentiel, calcul: `${pct(t.partTheorique * 100)} × ${eur(t.depense)} − ${eur(t.chiffre)} = ${eur(t.chiffreTheorique)} − ${eur(t.chiffre)} = ${eur(t.potentiel)}` },
        ];
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        const p = x.k.zone("primaire");
        const s = x.k.zone("secondaire");
        return [
          `Dans la zone primaire, la boutique fait déjà plus que sa part théorique (${pct(auCentime(p.part * 100))} contre ${pct(p.partTheorique * 100)}) : elle y est au-dessus de ce que sa taille laisse attendre. La zone secondaire, elle, laisse ${eur(s.potentiel)} à prendre : c'est le réservoir.`,
        ];
      },
    },
    {
      id: "predire-reilly",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur Vauclair",
      notions: ["demand_market_share"],
      question: () =>
        `Avant de calculer, pariez. Vauclair est sur la route du centre commercial, à ${enKm(COMMUNE_DE_VAUCLAIR.versLeCentreVille)} du centre-ville (${qte(POLES_DE_REILLY.centreVille.surface)} m² de maille) et à ${enKm(COMMUNE_DE_VAUCLAIR.versLeCentreCommercial)} du centre commercial (${qte(POLES_DE_REILLY.centreCommercial.surface)} m²). La part de sa dépense en maille qui va au centre-ville est d'environ…`,
      options: (c) => {
        const x = zoneDuChapitre(c);
        const voir = "Le calcul suivant tranche : la loi de Reilly pèse la taille de chaque pôle et le carré de la distance.";
        return [
          { texte: "Un cinquième", juste: Math.abs(x.v.partDeA - 0.2) < 0.01, retour: `Bon pari. ${voir}` },
          { texte: "Un peu moins de la moitié", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus de la moitié", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "reilly-a-vauclair",
      objectifs: [3],
      type: "montants",
      titre: "La loi de Reilly à Vauclair",
      notions: ["demand_market_share"],
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `La loi de Reilly : dépense attirée par le centre-ville ÷ dépense attirée par le centre commercial = (surface du centre-ville ÷ surface du centre commercial) × (distance au centre commercial ÷ distance au centre-ville)². Calculez ce rapport pour Vauclair, la part de sa dépense qui va au centre-ville (en %), puis cette dépense, sur les ${eur(x.depenseDeVauclair)} que dépensent ses ${qte(COMMUNE_DE_VAUCLAIR.population)} habitants en janvier.`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        const a = POLES_DE_REILLY.centreVille.surface;
        const b = POLES_DE_REILLY.centreCommercial.surface;
        return [
          { libelle: "Rapport des dépenses attirées", nature: "grandeur", attendu: x.rapport, calcul: `(${qte(a)} ÷ ${qte(b)}) × (${qte(COMMUNE_DE_VAUCLAIR.versLeCentreCommercial / 1000)} ÷ ${qte(COMMUNE_DE_VAUCLAIR.versLeCentreVille / 1000)})² = ${qte(auCentime(x.v.rapport))}` },
          { libelle: "Part de la dépense qui va au centre-ville (%)", attendu: x.partDuCentreVille, calcul: `${qte(x.rapport)} ÷ (1 + ${qte(x.rapport)}) × 100 = ${pct(x.partDuCentreVille)}` },
          { libelle: "Dépense de Vauclair attirée par le centre-ville", attendu: x.versLeCentreVille, calcul: `${eur(x.depenseDeVauclair)} × ${pct(x.partDuCentreVille)} = ${eur(x.versLeCentreVille)}` },
        ];
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        return [
          `Vauclair est plus près du centre commercial, qui est aussi plus grand : il attire ${pct(auCentime((1 - x.v.partDeA) * 100))} de sa dépense. Le centre-ville n'en garde que ${eur(x.versLeCentreVille)}, à partager entre ses boutiques. La distance compte au carré : c'est elle qui ferme la zone.`,
        ];
      },
    },
    {
      id: "le-point-de-rupture",
      objectifs: [3],
      type: "curseur",
      titre: "Le point de rupture",
      notions: ["demand_market_share"],
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `Déplacez une commune de la taille de Vauclair (${eur(x.depenseDeVauclair)} de dépense) sur la route, du centre-ville (0 m) au centre commercial (${qte(POLES_DE_REILLY.distance)} m). Une droite donne la dépense attirée par le centre-ville, l'autre celle attirée par le centre commercial. Placez le curseur à la plus grande distance où le centre-ville attire au moins autant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Distance au centre-ville", unite: "m" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: zoneDuChapitre(c).rupture, min: 0, max: POLES_DE_REILLY.distance }),
      zones: ["Le centre-ville attire plus", "Le centre commercial attire plus"],
      rates: () => ({
        dessous: "À cette distance, le centre-ville attire encore plus : la commune peut s'éloigner davantage.",
        dessus: "À cette distance, le centre commercial attire déjà plus : rapprochez la commune du centre-ville.",
      }),
      montrer: "Montrer le point de rupture",
      lecture: (c, d) => {
        const x = zoneDuChapitre(c);
        const a = attireeParLeCentreVille(c, d);
        return [
          { libelle: "Dépense attirée par le centre-ville", montant: a },
          { libelle: "Dépense attirée par le centre commercial", montant: auCentime(x.depenseDeVauclair - a) },
          { libelle: "Écart en faveur du centre-ville", montant: auCentime(2 * a - x.depenseDeVauclair), fort: true },
        ];
      },
      droites: (c) => {
        const x = zoneDuChapitre(c);
        return {
          produit: (d) => x.depenseDeVauclair * partDuCentreVille(d),
          cout: (d) => x.depenseDeVauclair * (1 - partDuCentreVille(d)),
          libelles: ["Dépense attirée par le centre-ville", "Dépense attirée par le centre commercial"],
        };
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        return [
          `Les deux pôles attirent autant à ${enKm(x.rupture)} du centre-ville : c'est le point de rupture, la limite de la zone d'attraction du centre-ville sur cette route. Point de rupture = distance entre les pôles ÷ (1 + √(surface du centre commercial ÷ surface du centre-ville)) = ${qte(POLES_DE_REILLY.distance)} ÷ (1 + √(${qte(POLES_DE_REILLY.centreCommercial.surface)} ÷ ${qte(POLES_DE_REILLY.centreVille.surface)})) = ${qte(x.rupture)} m.`,
          "Au-delà, un tract de la boutique parle à des clients que le centre commercial attire déjà : il rapporte peu.",
        ];
      },
    },
    {
      id: "la-zone-du-site",
      objectifs: [0, 1],
      type: "montants",
      titre: "La zone du site",
      notions: ["demand_market_share", "segmentation"],
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `Le site de la boutique a reçu ${qte(x.k.visites)} visites en janvier, dont ${qte(x.k.zones.find((z) => z.code === "primaire")!.visites)} de la zone primaire, ${qte(x.k.zone("secondaire").visites)} de la secondaire, ${qte(x.k.zone("tertiaire").visites)} de la tertiaire et ${qte(x.k.visites - x.k.zones.reduce((t, z) => t + z.visites, 0))} d'au-delà. Calculez la part des visites venues d'au-delà de la zone, puis la part des ${qte(x.k.fideles.tickets + x.k.passants.tickets)} passages en caisse qui sont des retraits de commandes passées sur le site (${qte(x.k.retraits)}), en pourcentage, à deux décimales.`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        const hors = x.k.visites - x.k.zones.reduce((t, z) => t + z.visites, 0);
        return [
          { libelle: "Part des visites venues d'au-delà de la zone (%)", attendu: auCentime(x.k.partDesVisitesHorsZone * 100), calcul: `${qte(hors)} ÷ ${qte(x.k.visites)} × 100 = ${pct(auCentime(x.k.partDesVisitesHorsZone * 100))}` },
          { libelle: "Part des passages qui sont des retraits (%)", attendu: auCentime(x.k.partDesRetraits * 100), calcul: `${qte(x.k.retraits)} ÷ ${qte(x.k.fideles.tickets + x.k.passants.tickets)} × 100 = ${pct(auCentime(x.k.partDesRetraits * 100))}` },
        ];
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        return [
          `La zone d'une unité commerciale virtuelle ne s'arrête pas aux isochrones : ${pct(auCentime(x.k.partDesVisitesHorsZone * 100))} des visiteurs du site habitent au-delà. Elle se trace avec la mesure d'audience et les adresses de livraison, et elle dépend de ce que le site sait livrer. Tant que la commande se retire en boutique, ces visiteurs lointains n'achètent pas.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-zone",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la zone",
      notions: ["demand_market_share"],
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `La direction veut ${pct(HAUSSE_VISEE_DANS_LA_ZONE * 100)} de chiffre d'affaires en caisse de plus, soit ${eur(x.k.objectif)} TTC par mois. Choisissez la zone où porter l'effort et les points de part de marché à y gagner : le tableau suit le chiffre gagné, la part atteinte et la part théorique ; le graphique trace le chiffre gagné selon les points. Puis relevez le défi.`;
      },
      leviers: () => [
        {
          code: "zone",
          libelle: "Zone visée",
          unite: "",
          min: 1,
          max: ZONES.length,
          pas: 1,
          depart: rangDeLaZone(DEPART_DU_LABORATOIRE.zone),
          choix: ZONES.map((z) => ({ valeur: rangDeLaZone(z.code), libelle: z.nom })),
        },
        { code: "points", libelle: "Points de part de marché gagnés", unite: "points", min: POINTS_DU_LABORATOIRE.min, max: POINTS_DU_LABORATOIRE.max, pas: POINTS_DU_LABORATOIRE.pas, depart: DEPART_DU_LABORATOIRE.points },
      ],
      lecture: (c, p) => {
        const f = ficheDe(c);
        const g = gagnerDansLaZone(f, zoneDuRang(p.zone!), p.points!);
        const d = gagnerDansLaZone(f, DEPART_DU_LABORATOIRE.zone, DEPART_DU_LABORATOIRE.points);
        return [
          { libelle: "Dépense commercialisable de la zone", montant: g.zone.depense, reference: d.zone.depense },
          { libelle: "Chiffre d'affaires TTC gagné", montant: g.gagne, reference: d.gagne },
          { libelle: "Écart à l'objectif", montant: auCentime(g.gagne - g.objectif), reference: auCentime(d.gagne - d.objectif), effet: true, fort: true },
          { libelle: "Part de marché atteinte", montant: auCentime(g.partApres * 100), reference: auCentime(d.partApres * 100), unite: "%" },
          { libelle: "Part de marché théorique de la zone", montant: auCentime(g.zone.partTheorique * 100), reference: auCentime(d.zone.partTheorique * 100), unite: "%" },
        ];
      },
      graphique: (c) => {
        const f = ficheDe(c);
        return {
          levier: "points",
          courbes: [
            { libelle: "Chiffre d'affaires TTC gagné", valeur: (p) => gagnerDansLaZone(f, zoneDuRang(p.zone!), p.points!).gagne },
            { libelle: "Objectif de la direction", valeur: () => zoneDeChalandise(f).objectif },
          ],
        };
      },
      defi: (c) => {
        const f = ficheDe(c);
        const ok = (p: Readonly<Record<string, number>>) => {
          const g = gagnerDansLaZone(f, zoneDuRang(p.zone!), p.points!);
          const unPasDeMoins = gagnerDansLaZone(f, zoneDuRang(p.zone!), p.points! - POINTS_DU_LABORATOIRE.pas);
          return g.atteintLObjectif && g.sousLaPartTheorique && !unPasDeMoins.atteintLObjectif;
        };
        return {
          consigne: "Atteignez l'objectif avec le moins de points possible, sans dépasser la part théorique de la zone.",
          atteint: ok,
          indice: (p) => {
            const g = gagnerDansLaZone(f, zoneDuRang(p.zone!), p.points!);
            if (!g.atteintLObjectif) return `Avec ${qte(g.points)} points, la zone rapporte ${eur(g.gagne)} : il manque ${eur(auCentime(g.objectif - g.gagne))}. Gagnez plus de points, ou visez une zone qui dépense plus.`;
            if (!g.sousLaPartTheorique)
              return `L'objectif est atteint, mais la part de la zone monterait à ${pct(auCentime(g.partApres * 100))}, au-dessus de sa part théorique (${pct(g.zone.partTheorique * 100)}) : un tel gain n'est pas réaliste. Cherchez une zone où la boutique a de la marge.`;
            return `L'objectif est atteint dans la part théorique, mais avec plus de points qu'il n'en faut : retirez des points jusqu'au plus petit nombre qui l'atteint encore.`;
          },
          solution: { zone: rangDeLaZone("secondaire"), points: pointsPourLObjectif(f, "secondaire") },
        };
      },
      montrer: "Montrer la zone et les points",
      explication: (c, p) => {
        const x = zoneDuChapitre(c);
        const g = gagnerDansLaZone(x.f, zoneDuRang(p.zone!), p.points!);
        return [
          `${qte(g.points)} points dans la ${g.zone.nom.toLowerCase()} rapportent ${eur(g.gagne)} par mois : la part y passerait de ${pct(auCentime(g.zone.part * 100))} à ${pct(auCentime(g.partApres * 100))}, sous sa part théorique de ${pct(g.zone.partTheorique * 100)}. Dans la zone primaire, il faudrait ${qte(pointsPourLObjectif(x.f, "primaire"))} points, au-delà de ce que la boutique peut y prendre ; dans la tertiaire, ${qte(pointsPourLObjectif(x.f, "tertiaire"))} points, face au centre commercial.`,
        ];
      },
    },
    {
      id: "l-objectif-a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "L'objectif, à rebours",
      notions: ["demand_market_share", "average_basket"],
      question: (c) => {
        const x = zoneDuChapitre(c);
        return `À rebours. Pour gagner ${eur(x.k.objectif)} TTC dans la zone secondaire, calculez la part de marché à y atteindre (en %, au centième). Puis comptez les passages de passants en plus qu'il faut chaque mois, à leur panier TTC de ${eur(x.k.panierTtcDesPassants)}, arrondis à l'unité supérieure.`;
      },
      champs: (c) => {
        const x = zoneDuChapitre(c);
        const s = x.k.zone("secondaire");
        return [
          { libelle: "Part de marché à atteindre · Zone secondaire (%)", attendu: auCentime(x.partVisee * 100), calcul: `(${eur(s.chiffre)} + ${eur(x.k.objectif)}) ÷ ${eur(s.depense)} × 100 = ${pct(auCentime(x.partVisee * 100))}` },
          { libelle: "Passages de passants en plus par mois", nature: "quantite", attendu: x.passagesEnPlus, calcul: `${eur(x.k.objectif)} ÷ ${eur(x.k.panierTtcDesPassants)} = ${qte(auCentime(x.k.objectif / x.k.panierTtcDesPassants))}, soit ${qte(x.passagesEnPlus)} passages à l'unité au-dessus : un de moins ne ferait pas l'objectif` },
        ];
      },
      explication: (c) => {
        const x = zoneDuChapitre(c);
        const s = x.k.zone("secondaire");
        return [
          `La part de la zone secondaire doit passer de ${pct(auCentime(s.part * 100))} à ${pct(auCentime(x.partVisee * 100))} : ${qte(x.passagesEnPlus)} passages de plus par mois, sur ${qte(s.population)} habitants. C'est l'objectif concret d'une action locale : un tract dans les communes de la première couronne, le retrait en boutique des commandes du site.`,
        ];
      },
    },
    {
      id: "ou-porter-l-effort",
      objectifs: [4],
      type: "choix",
      titre: "Où porter l'effort ?",
      notions: ["demand_market_share", "segmentation"],
      question: () => "La direction a de quoi financer un tract et une offre de retrait en boutique dans une seule zone. Que lui conseillez-vous ?",
      options: (c) => {
        const x = zoneDuChapitre(c);
        const p = x.k.zone("primaire");
        const s = x.k.zone("secondaire");
        const t = x.k.zone("tertiaire");
        return [
          {
            texte: "La zone secondaire : elle laisse le plus à prendre",
            juste: true,
            retour: `Oui. La boutique n'y prend que ${pct(auCentime(s.part * 100))} de la dépense, pour une part théorique de ${pct(s.partTheorique * 100)} : ${eur(s.potentiel)} à prendre, et ${qte(x.pointsSecondaire)} points suffisent à l'objectif. Reste à vérifier, par une étude, ce qui ferait venir ces clients.`,
          },
          {
            texte: "La zone primaire : la boutique y fait déjà le plus de chiffre d'affaires",
            juste: false,
            retour: `Non : elle y prend déjà ${pct(auCentime(p.part * 100))} de la dépense, plus que sa part théorique (${pct(p.partTheorique * 100)}). Gagner l'objectif là demanderait ${qte(pointsPourLObjectif(x.f, "primaire"))} points de plus : la zone est saturée.`,
          },
          {
            texte: "La zone tertiaire : c'est celle qui dépense le plus",
            juste: false,
            retour: `Non : elle dépense ${eur(t.depense)}, mais le centre commercial l'attire, et la part théorique de la boutique n'y est que de ${pct(t.partTheorique * 100)}. Il ne reste que ${eur(t.potentiel)} à y prendre.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDeLaSynthese,
      texte: (c) => {
        const x = zoneDuChapitre(c);
        return [
          "La zone de chalandise se découpe en temps d'accès. Elle se décrit par des sources internes (codes postaux en caisse, fichier clients, audience du site) et externes (recensement, indice de disparité, relevé des concurrents).",
          `Dépense commercialisable = habitants × dépense par habitant × indice de disparité. Part de marché = chiffre d'affaires de la zone ÷ sa dépense. Part théorique (méthode des surfaces) = surface du magasin ÷ surfaces de la zone. L'écart entre les deux dit où est le réservoir : ici la zone secondaire, ${eur(x.k.zone("secondaire").potentiel)} à prendre.`,
          `La loi de Reilly pèse la taille des pôles et le carré de la distance ; le point de rupture, à ${enKm(x.rupture)} sur la route du centre commercial, borne la zone. La zone d'un site, elle, se trace par son audience et ce qu'il sait livrer.`,
          "Au niveau de l'examen, vous savez tracer et chiffrer une zone, calculer parts de marché réelle et théorique et taux d'emprise, appliquer la loi de Reilly, et dire où porter une action et quelle part elle doit gagner.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Dépense commercialisable = habitants × dépense par habitant × indice de disparité. Part de marché = chiffre de la zone ÷ dépense de la zone. Reilly : VA ÷ VB = (SA ÷ SB) × (DB ÷ DA)².",
    },
  ],
};
