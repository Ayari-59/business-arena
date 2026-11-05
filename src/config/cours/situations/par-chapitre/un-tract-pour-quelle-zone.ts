import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/taux-de-marque";
import { DEPENSE_DE_JANVIER_PAR_HABITANT, NOUVEAU_CONCURRENT, zoneAvecLeConcurrent } from "../../monde/clientele-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA ZONE DE CHALANDISE » : UN TRACT POUR QUELLE ZONE ? (BTS MCO, palier 2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : la zone de la boutique MAILLE & CO (monde/clientele-de-la-boutique.ts,
 * `zoneAvecLeConcurrent`). Une enseigne de maille ouvre 300 m² dans la première couronne. La direction
 * garde son objectif (10 % de chiffre en caisse de plus) et demande si la zone secondaire suffit encore.
 * L'élève refait seul les calculs du chapitre : la dépense et la part de marché de la zone, sa nouvelle
 * part théorique, ce qu'il reste à y prendre ; puis il voit que la zone secondaire ne suffit plus et
 * chiffre l'appoint de la tertiaire.
 *
 * Les pièges : garder l'ancienne part théorique ; reporter tout l'effort sur la zone primaire, déjà
 * au-dessus de la sienne ; renoncer à la zone secondaire, qui reste la plus grosse réserve.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les chiffres du cas, calculés une fois sur la fiche. */
export function unTractPourQuelleZone(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  return { f, ...zoneAvecLeConcurrent(f) };
}

const tableauDuCas = (c: Pick<Cas, "code">): TableauDeDonnees => {
  const x = unTractPourQuelleZone(c);
  return {
    titre: `La zone de ${x.f.entreprise} après l'ouverture du concurrent`,
    colonnes: ["Habitants", "Indice de disparité", "Surfaces de maille", "Chiffre TTC de janvier"],
    lignes: x.k.zones.map((z) => ({
      libelle: z.nom,
      valeurs: [qte(z.population), qte(z.idc), `${qte(z.code === NOUVEAU_CONCURRENT.zone ? x.surface : z.surfaceDeMaille)} m²`, eur(z.chiffre)],
    })),
  };
};

export const UN_TRACT_POUR_QUELLE_ZONE: Situation = {
  code: "un-tract-pour-quelle-zone",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["zone-de-chalandise"],
  commanditaire: "La direction",
  titre: "Un tract pour quelle zone ?",
  accroche:
    "Une enseigne de maille ouvre dans la première couronne. La zone secondaire suffit-elle encore à l'objectif de la direction, ou faut-il aller chercher ailleurs ?",
  objectifs: [
    "Calculer la dépense, le chiffre d'affaires et la part de marché d'une zone",
    "Recalculer la part théorique d'une zone quand un concurrent s'installe",
    "Chiffrer ce qu'il reste à prendre dans chaque zone face à un objectif",
    "Répondre à la direction sur la zone où distribuer le tract",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend la zone de chalandise du chapitre, autour de la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDuCas,
      texte: (c) => {
        const x = unTractPourQuelleZone(c);
        return [
          `« Une enseigne de maille ouvre ${qte(NOUVEAU_CONCURRENT.surface)} m² dans la première couronne. Nous gardons notre objectif : ${eur(x.k.objectif)} TTC de chiffre en caisse de plus par mois. Nous avions prévu de tout miser sur la zone secondaire : est-ce encore possible ? Sinon, où mettre le reste de l'effort ? »`,
          `Pas de cours cette fois : vous avez la zone de janvier et la méthode du chapitre. La boutique fait ${qte(x.f.surfaceDeVente)} m² ; un habitant dépense ${eur(DEPENSE_DE_JANVIER_PAR_HABITANT)} TTC en maille en janvier, corrigés de l'indice de disparité.`,
        ];
      },
      repere: () => "À rendre : la dépense et la part de marché de la zone secondaire, sa nouvelle part théorique, ce qu'il reste à prendre dans chaque zone, l'appoint nécessaire, et votre réponse.",
    },
    {
      id: "la-zone-secondaire",
      type: "montants",
      titre: "La zone secondaire en janvier",
      notions: ["demand_market_share"],
      tableau: tableauDuCas,
      question: () => "Calculez la dépense commercialisable de janvier de la zone secondaire, puis la part de marché que la boutique y prend, en pourcentage, au dixième.",
      champs: (c) => {
        const x = unTractPourQuelleZone(c);
        return [
          { libelle: "Dépense commercialisable · Zone secondaire", attendu: x.z.depense, calcul: `${qte(x.z.population)} × ${eur(DEPENSE_DE_JANVIER_PAR_HABITANT)} × ${qte(x.z.idc)} = ${eur(x.z.depense)}` },
          { libelle: "Part de marché · Zone secondaire (%)", attendu: auDixieme(x.z.part * 100), tolerance: 0.1, calcul: `${eur(x.z.chiffre)} ÷ ${eur(x.z.depense)} × 100 = ${pct(auDixieme(x.z.part * 100))}` },
        ];
      },
      explication: (c) => {
        const x = unTractPourQuelleZone(c);
        return [`La boutique prend ${pct(auDixieme(x.z.part * 100))} de la dépense de la première couronne : c'est là qu'elle est le moins présente, au regard de ce que la zone dépense.`];
      },
    },
    {
      id: "la-nouvelle-part-theorique",
      type: "montants",
      titre: "La part théorique, avec le concurrent",
      notions: ["demand_market_share"],
      question: () =>
        "Avec le concurrent, calculez la nouvelle part théorique de la zone secondaire (méthode des surfaces, en %), ce qu'il reste à y prendre, puis ce qu'il reste à prendre dans la zone tertiaire, dont la part théorique ne change pas.",
      champs: (c) => {
        const x = unTractPourQuelleZone(c);
        const t = x.tertiaire;
        return [
          { libelle: "Part théorique · Zone secondaire (%)", attendu: auCentime(x.partTheorique * 100), calcul: `${qte(x.f.surfaceDeVente)} ÷ ${qte(x.surface)} × 100 = ${pct(x.partTheorique * 100)}` },
          { libelle: "Chiffre à gagner · Zone secondaire", attendu: x.potentiel, calcul: `${pct(x.partTheorique * 100)} × ${eur(x.z.depense)} − ${eur(x.z.chiffre)} = ${eur(x.potentiel)}` },
          { libelle: "Chiffre à gagner · Zone tertiaire", attendu: t.potentiel, calcul: `${qte(x.f.surfaceDeVente)} ÷ ${qte(t.surfaceDeMaille)} × ${eur(t.depense)} − ${eur(t.chiffre)} = ${eur(t.potentiel)}` },
        ];
      },
      explication: (c) => {
        const x = unTractPourQuelleZone(c);
        return [`Le concurrent fait tomber la part théorique de la zone secondaire de ${pct(x.z.partTheorique * 100)} à ${pct(x.partTheorique * 100)}. Il y reste ${eur(x.potentiel)} à prendre, toujours la plus grosse réserve, mais moins que l'objectif.`];
      },
    },
    {
      id: "l-appoint",
      type: "montants",
      titre: "L'appoint de la zone tertiaire",
      notions: ["demand_market_share"],
      question: () =>
        "Calculez ce qui manque à l'objectif une fois la zone secondaire prise à sa part théorique, puis les points de part de marché à gagner dans la zone tertiaire pour le combler (au centième).",
      champs: (c) => {
        const x = unTractPourQuelleZone(c);
        return [
          { libelle: "Ce qui manque à l'objectif", attendu: x.manque, calcul: `${eur(x.k.objectif)} − ${eur(x.potentiel)} = ${eur(x.manque)}` },
          { libelle: "Points à gagner · Zone tertiaire", attendu: auCentime(x.pointsDansLaTertiaire), tolerance: 0.01, calcul: `${eur(x.manque)} ÷ ${eur(x.tertiaire.depense)} × 100 = ${qte(auCentime(x.pointsDansLaTertiaire))}` },
        ];
      },
      explication: (c) => {
        const x = unTractPourQuelleZone(c);
        return [
          `Il manque ${eur(x.manque)} : ${qte(auCentime(x.pointsDansLaTertiaire))} point dans la zone tertiaire, où la boutique peut encore prendre ${eur(x.tertiaire.potentiel)}. L'appoint tient dans sa part théorique.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const x = unTractPourQuelleZone(c);
        return [
          {
            texte: "Garder la zone secondaire, et compléter par la tertiaire",
            juste: true,
            retour: `Oui : la zone secondaire n'offre plus que ${eur(x.potentiel)}, il manque ${eur(x.manque)}, que la tertiaire peut donner (${eur(x.tertiaire.potentiel)} à prendre). Le tract vise la première couronne, et ses communes les plus proches du centre-ville au-delà, avant le point de rupture.`,
          },
          {
            texte: "Tout reporter sur la zone primaire, où le concurrent n'est pas installé",
            juste: false,
            retour: `Non : la boutique y prend déjà plus que sa part théorique (${pct(auDixieme(x.k.zone("primaire").part * 100))} pour ${pct(x.k.zone("primaire").partTheorique * 100)}). Le concurrent ne change rien à cette saturation.`,
          },
          {
            texte: `Renoncer à la zone secondaire : sa part théorique tombe à ${pct(x.partTheorique * 100)}`,
            juste: false,
            retour: `Non : elle baisse, mais il reste ${eur(x.potentiel)} à y prendre, plus que partout ailleurs. Y renoncer laisserait l'objectif hors de portée.`,
          },
          {
            texte: "Garder la zone secondaire seule : elle suffit encore à l'objectif",
            juste: false,
            retour: `Non : avec le concurrent, elle n'offre plus que ${eur(x.potentiel)} pour ${eur(x.k.objectif)} visés. Il faut ${eur(x.manque)} ailleurs.`,
          },
        ];
      },
    },
  ],
};
