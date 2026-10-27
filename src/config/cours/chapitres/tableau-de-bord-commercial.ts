import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { BAISSE_DU_SERVICE_QUI_SIGNALE_L_OFFRE } from "../negociation";
import type { Chapitre } from "../types";
import { NEGOCIATIONS } from "./negocier-le-prix";

/**
 * CHAPITRE : LE TABLEAU DE BORD COMMERCIAL (BTS NDRC, palier 4).
 *
 * Le dernier chapitre du parcours rassemble les autres sur une année : le chiffre d'affaires,
 * la demande que le marché adresse à l'entreprise, les ventes qu'elle en tire, le taux de
 * service, la part de marché et la marge, trimestre par trimestre. Le commercial y lit un
 * trimestre qui décroche, en cherche la cause (une demande qui baisse, ou une demande qu'on ne
 * sert pas), chiffre les ventes manquées, et range ses indicateurs.
 *
 * Les quatre trimestres sont ceux de l'année de l'arène (`anneeJouee`), chez les entreprises
 * qui négocient avec des clients professionnels. Aucune hypothèse n'est ajoutée : un objectif
 * chiffré serait une hypothèse, le chapitre compare donc les trimestres entre eux.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const ordinal = (n: number) => (n === 1 ? "premier" : `${n}e`);

/** Un trimestre du tableau de bord. */
export interface TrimestreCommercial {
  trimestre: number;
  chiffreDAffaires: number;
  demande: number;
  ventes: number;
  /** Les ventes rapportées à la demande adressée, en %, au dixième. */
  service: number;
  partDeMarche: number;
  marge: number;
  tauxDeMarge: number;
  prixMoyen: number;
}

/** L'année de l'entreprise en indicateurs commerciaux, et le trimestre qui décroche. */
export function tableauCommercial(c: Cas) {
  const trimestres: TrimestreCommercial[] = anneeJouee(c.code).partie.rounds.map((t, i) => {
    const r = t.results["joueur"]!;
    const segments = Object.values(r.market.bySegment);
    const demande = Math.round(segments.reduce((s, v) => s + v.demandForCompany, 0));
    const ventes = Math.round(segments.reduce((s, v) => s + v.sold, 0));
    const ca = Math.round(r.incomeStatement.revenue);
    const marge = Math.round(r.incomeStatement.grossMargin);
    return {
      trimestre: i + 1,
      chiffreDAffaires: ca,
      demande,
      ventes,
      service: auDixieme((ventes / demande) * 100),
      partDeMarche: auDixieme(r.market.totalShare * 100),
      marge,
      tauxDeMarge: auDixieme((marge / ca) * 100),
      prixMoyen: Math.round((ca / ventes) * 100) / 100,
    };
  });
  const t1 = trimestres[0]!;
  const dernier = trimestres.at(-1)!;
  // Le trimestre qui décroche : la plus forte baisse de chiffre d'affaires d'un trimestre au suivant.
  const baisses = trimestres.slice(1).map((t, i) => ({ t, avant: trimestres[i]!, baisse: trimestres[i]!.chiffreDAffaires - t.chiffreDAffaires }));
  const chute = baisses.reduce((a, b) => (b.baisse > a.baisse ? b : a));
  const manquees = dernier.demande - dernier.ventes;
  return {
    trimestres,
    t1,
    dernier,
    chute,
    evolutionCa: auDixieme((dernier.chiffreDAffaires / t1.chiffreDAffaires - 1) * 100),
    evolutionDemande: auDixieme((chute.t.demande / chute.avant.demande - 1) * 100),
    pointsDePart: auDixieme(chute.t.partDeMarche - chute.avant.partDeMarche),
    manquees,
    caManque: Math.round(manquees * dernier.prixMoyen),
  };
}

/** Ce qui fait décrocher un trimestre : la demande ne suit plus, ou l'offre ne la sert pas. */
export function causeDeLaChute(k: ReturnType<typeof tableauCommercial>): "offre" | "demande" | "prix" {
  const { t, avant } = k.chute;
  if (t.service < avant.service - BAISSE_DU_SERVICE_QUI_SIGNALE_L_OFFRE) return "offre";
  if (t.demande < avant.demande) return "demande";
  return "prix";
}

export const TABLEAU_DE_BORD_COMMERCIAL: Chapitre = {
  code: "tableau-de-bord-commercial",
  parcours: "ndrc",
  palier: 4,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
  ],
  titre: "Le tableau de bord commercial",
  accroche:
    "Quatre trimestres, six indicateurs. Repérer celui qui décroche, en trouver la cause, chiffrer ce qu'il coûte, et savoir quel indicateur regarder en premier.",
  objectifs: [
    "Lire un tableau de bord commercial sur une année",
    "Calculer un taux de service et une évolution",
    "Distinguer une demande qui baisse d'une demande qu'on ne sert pas",
    "Chiffrer les ventes manquées",
    "Ranger les indicateurs par ce qu'ils mesurent",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce chapitre suit l'activité commerciale d'une entreprise qui négocie avec des clients professionnels.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année d'activité commerciale",
      notions: ["dashboard"],
      texte: (c) => {
        const k = tableauCommercial(c);
        return [
          `Voici l'année, chez ${c.entreprise}, dans l'arène, trimestre par trimestre : la demande que le marché lui a adressée, ce qu'elle en a vendu, son chiffre d'affaires, sa part de marché et sa marge.`,
          `Sur l'année, le chiffre d'affaires ne suit pas une ligne droite : le ${ordinal(k.chute.t.trimestre)} trimestre décroche de ${eur(k.chute.baisse)} par rapport au précédent. Le tableau de bord sert à repérer ce décrochage, puis à en comprendre la cause.`,
        ];
      },
      tableau: (c) => {
        const k = tableauCommercial(c);
        return {
          titre: `Le tableau de bord commercial, chez ${c.entreprise}`,
          colonnes: k.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: k.trimestres.map((t) => eur(t.chiffreDAffaires)) },
            { libelle: `Demande adressée (${c.unites})`, valeurs: k.trimestres.map((t) => qte(t.demande)) },
            { libelle: `Ventes (${c.unites})`, valeurs: k.trimestres.map((t) => qte(t.ventes)) },
            { libelle: "Part de marché", valeurs: k.trimestres.map((t) => pct(t.partDeMarche)) },
            { libelle: "Marge sur les ventes", valeurs: k.trimestres.map((t) => eur(t.marge)) },
          ],
        };
      },
      repere: () => "Taux de service = ventes ÷ demande adressée. Il dit quelle part de la demande l'entreprise a su servir.",
    },
    {
      id: "service",
      type: "montants",
      titre: "Le taux de service",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const k = tableauCommercial(c);
        return `Calculez le taux de service du premier trimestre (${qte(k.t1.ventes)} ventes pour ${qte(k.t1.demande)} demandées), celui du dernier (${qte(k.dernier.ventes)} pour ${qte(k.dernier.demande)}), en pourcentage au dixième, puis l'évolution du chiffre d'affaires du premier au dernier trimestre.`;
      },
      champs: (c) => {
        const k = tableauCommercial(c);
        return [
          { libelle: "Taux de service, premier trimestre (%)", attendu: k.t1.service, calcul: `${qte(k.t1.ventes)} ÷ ${qte(k.t1.demande)} × 100 = ${pct(k.t1.service)}`, tolerance: 0.1 },
          { libelle: "Taux de service, dernier trimestre (%)", attendu: k.dernier.service, calcul: `${qte(k.dernier.ventes)} ÷ ${qte(k.dernier.demande)} × 100 = ${pct(k.dernier.service)}`, tolerance: 0.1 },
          {
            libelle: "Évolution du chiffre d'affaires (%)",
            attendu: k.evolutionCa,
            calcul: `(${eur(k.dernier.chiffreDAffaires)} ÷ ${eur(k.t1.chiffreDAffaires)} − 1) × 100 = ${pct(k.evolutionCa)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = tableauCommercial(c);
        return [
          `Au dernier trimestre, ${c.entreprise} n'a servi que ${pct(k.dernier.service)} de la demande qu'elle recevait. Un chiffre d'affaires qui baisse ne dit pas, seul, si les clients manquent ou si c'est l'entreprise qui ne les sert pas : le taux de service le dit.`,
        ];
      },
    },
    {
      id: "diagnostic",
      type: "choix",
      titre: "Pourquoi le trimestre décroche",
      notions: ["dashboard", "demand_market_share"],
      tableau: (c) => {
        const k = tableauCommercial(c);
        const { t, avant } = k.chute;
        return {
          titre: `Du ${ordinal(avant.trimestre)} au ${ordinal(t.trimestre)} trimestre`,
          colonnes: [`T${avant.trimestre}`, `T${t.trimestre}`],
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: [eur(avant.chiffreDAffaires), eur(t.chiffreDAffaires)] },
            { libelle: "Demande adressée", valeurs: [qte(avant.demande), qte(t.demande)] },
            { libelle: "Ventes", valeurs: [qte(avant.ventes), qte(t.ventes)] },
            { libelle: "Taux de service", valeurs: [pct(avant.service), pct(t.service)] },
            { libelle: "Prix moyen", valeurs: [eur(avant.prixMoyen), eur(t.prixMoyen)] },
          ],
        };
      },
      question: (c) => {
        const k = tableauCommercial(c);
        return `Le chiffre d'affaires baisse de ${eur(k.chute.baisse)} au ${ordinal(k.chute.t.trimestre)} trimestre. Qu'est-ce qui a décroché ?`;
      },
      options: (c) => {
        const k = tableauCommercial(c);
        const cause = causeDeLaChute(k);
        const { t, avant } = k.chute;
        return [
          {
            texte: "La demande était là, mais l'entreprise ne l'a pas servie",
            juste: cause === "offre",
            retour:
              cause === "offre"
                ? `Oui : la demande passe de ${qte(avant.demande)} à ${qte(t.demande)}, mais le taux de service tombe de ${pct(avant.service)} à ${pct(t.service)}. Les clients étaient là ; ce sont les ${c.unites} proposés qui ont manqué. Le remède n'est pas commercial : il faut produire ou planifier au niveau de la demande.`
              : `Non : le taux de service reste à ${pct(t.service)}.`,
          },
          {
            texte: "La demande a baissé : il y avait moins de clients",
            juste: cause === "demande",
            retour:
              cause === "demande"
                ? `Oui : la demande passe de ${qte(avant.demande)} à ${qte(t.demande)}, et l'entreprise en sert toujours l'essentiel. C'est le marché qui a ralenti : prospection, offre, prix sont à revoir.`
                : `Non : la demande ${t.demande >= avant.demande ? "a même monté" : "a peu baissé"}, de ${qte(avant.demande)} à ${qte(t.demande)}${cause === "offre" ? ` ; ce sont les ventes qui n'ont pas suivi` : ""}.`,
          },
          {
            texte: "Le prix a baissé",
            juste: cause === "prix",
            retour:
              cause === "prix"
                ? `Oui : le prix moyen passe de ${eur(avant.prixMoyen)} à ${eur(t.prixMoyen)}, pour des ventes comparables.`
                : `Non : le prix moyen ${Math.abs(t.prixMoyen - avant.prixMoyen) < 1 ? "n'a pas bougé" : `passe de ${eur(avant.prixMoyen)} à ${eur(t.prixMoyen)}`} ; il n'explique pas la baisse.`,
          },
        ];
      },
    },
    {
      id: "part-de-marche",
      type: "montants",
      titre: "La part de marché",
      notions: ["demand_market_share"],
      question: (c) => {
        const k = tableauCommercial(c);
        return `Au même trimestre, la part de marché passe de ${pct(k.chute.avant.partDeMarche)} à ${pct(k.chute.t.partDeMarche)}. Calculez la variation en points, puis l'évolution de la demande adressée, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const k = tableauCommercial(c);
        return [
          { libelle: "Variation de la part de marché (points)", attendu: k.pointsDePart, calcul: `${pct(k.chute.t.partDeMarche)} − ${pct(k.chute.avant.partDeMarche)} = ${qte(k.pointsDePart)} points`, tolerance: 0.1 },
          {
            libelle: "Évolution de la demande adressée (%)",
            attendu: k.evolutionDemande,
            calcul: `(${qte(k.chute.t.demande)} ÷ ${qte(k.chute.avant.demande)} − 1) × 100 = ${pct(k.evolutionDemande)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = tableauCommercial(c);
        return [
          `Une part de marché se compte en points, pas en pourcentage : elle passe de ${pct(k.chute.avant.partDeMarche)} à ${pct(k.chute.t.partDeMarche)}, soit ${qte(k.pointsDePart)} points. Dans l'arène, elle se mesure sur les ventes : une demande qu'on ne sert pas part chez les concurrents, et la part de marché baisse avec elle.`,
        ];
      },
    },
    {
      id: "manquees",
      type: "montants",
      titre: "Ce que coûtent les ventes manquées",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const k = tableauCommercial(c);
        return `Au dernier trimestre, ${c.entreprise} a reçu ${qte(k.dernier.demande)} demandes et vendu ${qte(k.dernier.ventes)} ${c.unites}. Combien de ventes a-t-elle manquées ? Au prix moyen du trimestre (${eur(k.dernier.prixMoyen)}), quel chiffre d'affaires représentent-elles, à l'euro ?`;
      },
      champs: (c) => {
        const k = tableauCommercial(c);
        return [
          { libelle: "Ventes manquées", attendu: k.manquees, calcul: `${qte(k.dernier.demande)} − ${qte(k.dernier.ventes)} = ${qte(k.manquees)}` },
          { libelle: "Chiffre d'affaires manqué", attendu: k.caManque, calcul: `${qte(k.manquees)} × ${eur(k.dernier.prixMoyen)} = ${eur(k.caManque)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = tableauCommercial(c);
        return [
          `${eur(k.caManque)} de chiffre d'affaires sont restés sur la table, des clients venus d'eux-mêmes que personne n'a servis. Les servir ne demanderait aucune campagne : ils sont déjà venus.`,
        ];
      },
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Ranger les indicateurs",
      notions: ["dashboard"],
      question: () => "Un tableau de bord commercial range ses indicateurs par ce qu'ils mesurent. Classez chacun : l'activité de l'entreprise, sa place sur le marché, ou ce que ses ventes lui rapportent.",
      categories: [
        { code: "activite", libelle: "Activité" },
        { code: "marche", libelle: "Marché" },
        { code: "rentabilite", libelle: "Rentabilité" },
      ],
      elements: (c) => {
        const t = tableauCommercial(c).dernier;
        return [
          { libelle: "Chiffre d'affaires", montant: t.chiffreDAffaires, categorie: "activite", pourquoi: "Il mesure le volume d'affaires réalisé, en euros." },
          { libelle: "Ventes en unités", montant: t.ventes, categorie: "activite", pourquoi: "Elles mesurent le volume vendu, sans l'effet du prix." },
          { libelle: "Demande adressée", montant: t.demande, categorie: "marche", pourquoi: "Elle mesure ce que le marché a voulu acheter à l'entreprise, servi ou non." },
          { libelle: "Part de marché (%)", montant: t.partDeMarche, categorie: "marche", pourquoi: "Elle mesure la place de l'entreprise face à ses concurrents." },
          { libelle: "Marge sur les ventes", montant: t.marge, categorie: "rentabilite", pourquoi: "Elle mesure ce que les ventes laissent une fois payés leurs coûts variables." },
          { libelle: "Taux de marge (%)", montant: t.tauxDeMarge, categorie: "rentabilite", pourquoi: "Il mesure la part de chaque euro de ventes qui reste en marge." },
        ];
      },
      explication: () => [
        "Les trois familles se lisent ensemble : une activité qui monte sans la rentabilité, c'est vendre trop bas ; une activité stable avec une part de marché qui baisse, c'est un marché qui grandit sans l'entreprise.",
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = tableauCommercial(c);
        return [
          `Sur l'année, ${c.entreprise} a vu son chiffre d'affaires évoluer de ${pct(k.evolutionCa)}, et a laissé ${qte(k.manquees)} ventes sur la table au dernier trimestre. Le tableau de bord ne se lit pas indicateur par indicateur : c'est en croisant la demande, les ventes et le taux de service qu'on sait si le problème vient du marché ou de l'entreprise.`,
          "L'arène ne suit ni les visites, ni les devis, ni les relances : le taux de transformation des devis et le nombre de rendez-vous, au cœur du tableau de bord d'un commercial terrain, n'y existent pas.",
        ];
      },
      repere: () => "Un tableau de bord commercial croise l'activité (chiffre d'affaires, ventes), le marché (demande, part de marché) et la rentabilité (marge), trimestre après trimestre.",
    },
  ],
};
