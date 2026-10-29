import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  capacite,
  demandeAuPrix,
  marcheAuPrix,
  prixDeNova,
  prixLePlusBasServi,
  saisonDuMarche,
  segmentation,
  troisPrix,
  type MarcheDuTrimestre,
} from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'OFFRE ET LA DEMANDE SUR UN MARCHÉ (seconde, sciences économiques et sociales,
 * palier 1).
 *
 * Le raisonnement de l'économiste, sur le marché des enceintes de NOVA : d'un côté les acheteurs (la
 * demande), de l'autre les vendeurs (l'offre), et un prix. L'élève lit la demande que NOVA reçoit et
 * ce qui la fait varier, son offre (ce qu'elle met en vente), la quantité échangée (la plus petite des
 * deux), puis la demande à trois prix : la loi de la demande. Puis l'expérience : un curseur (combien
 * mettre en vente pour servir toute la demande ?) et un laboratoire (à quel prix la ligne sert-elle
 * toute la demande ?).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/mercatique-de-nova.ts, monde/economie-et-marketing.ts) :
 * le premier trimestre de NOVA, la droite de demande de nova-gestion.ts (16 755 − 203 × prix), la
 * quantité que la ligne a fabriquée (4 778 enceintes, NOVA n'a pas de stock), sa capacité (7 000), le
 * marché de toutes les enceintes mois par mois, les trois clientèles de la fiche.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'année de l'arène, rejouée à trois prix, chez six
 * entreprises. Il se joue chez NOVA seule, sur un trimestre : 4 778 enceintes demandées à 59 €,
 * autant mises en vente (toute la demande de N a été servie).
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DU_MARCHE: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** Le trimestre que le chapitre lit : le premier de l'année, janvier à mars. */
export const TRIMESTRE_LU = 1;

/** Les deux autres prix du trimestre : 10 % moins cher et 10 % plus cher (l'écart de la fiche). */
export const PRIX_BAS = 0.9;
export const PRIX_HAUT = 1.1;

/** Le bas du curseur : la quantité mise en vente, à partir de 4 000 enceintes. */
const QUANTITE_MINIMALE_DU_CURSEUR = 4_000;

/** Les bornes du laboratoire : le prix, à l'euro. */
const PRIX_ESSAYES = { min: 48, max: 66, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** « de » devant un nom : élidé devant une voyelle. */
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « que » devant un nom : élidé devant une voyelle. */
export const quE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
export const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** Une quantité et son unité, au singulier pour une seule. */
export const enUnites = (n: number, c: Pick<Cas, "unite" | "unites">) => `${qte(n)} ${Math.abs(n) <= 1 ? c.unite : c.unites}`;

const f = (c: Cas) => mercatiqueDe(c);

/** Le premier trimestre au prix de NOVA, avec ce que la ligne a fabriqué. */
export const marcheDuTrimestre = (c: Cas): MarcheDuTrimestre => marcheAuPrix(f(c));

/** Le marché à un prix, toute la ligne mise en vente : ce que le laboratoire lit. */
export function aPleineLigne(c: Cas, prix: number) {
  const demande = demandeAuPrix(f(c), prix);
  const ligne = capacite(f(c));
  return { prix, demande, ligne, servie: Math.min(demande, ligne), sansEnceinte: Math.max(0, demande - ligne) };
}

function tableauDesClienteles(c: Cas): TableauDeDonnees {
  const g = segmentation(f(c));
  return {
    titre: `Le marché ${dE(c.entreprise)} au ${rang(TRIMESTRE_LU)} trimestre, en ${c.unites}`,
    colonnes: ["Achats de toute la clientèle", `Demande reçue par ${c.entreprise}`],
    lignes: g.clienteles.map((k) => ({ libelle: k.nom, valeurs: [qte(k.taille), qte(k.demande)] })),
  };
}

function tableauDesSensibilites(c: Cas): TableauDeDonnees {
  const g = segmentation(f(c));
  return {
    titre: `La sensibilité au prix des clientèles ${dE(c.entreprise)}`,
    colonnes: ["Demande perdue quand le prix monte de 1 %"],
    lignes: g.clienteles.map((k) => ({ libelle: k.nom, valeurs: [`environ ${pct(k.elasticite)}`] })),
  };
}

function tableauDeLaSaison(c: Cas): TableauDeDonnees {
  const s = saisonDuMarche(f(c));
  return {
    titre: "Les enceintes achetées sur tout le marché, mois par mois",
    colonnes: ["Achats du mois"],
    lignes: s.mois.map((m) => ({ libelle: m.nom.charAt(0).toUpperCase() + m.nom.slice(1), valeurs: [qte(m.ventes)] })),
  };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const m = marcheDuTrimestre(c);
  return {
    titre: `${c.entreprise} au ${rang(TRIMESTRE_LU)} trimestre, en ${c.unites}`,
    colonnes: [`Au prix de ${eur(m.prix)}`],
    lignes: [
      { libelle: "Demande reçue", valeurs: [qte(m.demande)] },
      { libelle: "Quantité mise en vente", valeurs: [qte(m.offre)] },
    ],
  };
}

function tableauDesTroisPrix(c: Cas): TableauDeDonnees {
  const d = troisPrix(f(c));
  const ligne = (libelle: string, g: (x: MarcheDuTrimestre) => string) => ({ libelle, valeurs: [g(d.bas), g(d.base), g(d.haut)] });
  return {
    titre: `Le ${rang(TRIMESTRE_LU)} trimestre ${dE(c.entreprise)} à trois prix, en ${c.unites}`,
    colonnes: [`${d.ecart} % moins cher`, `Prix ${dE(c.entreprise)}`, `${d.ecart} % plus cher`],
    lignes: [
      ligne("Prix", (x) => eur(x.prix)),
      ligne("Demande reçue", (x) => qte(x.demande)),
      ligne("Quantité mise en vente", (x) => qte(x.offre)),
      ligne("Quantité échangée", (x) => qte(x.echangee)),
    ],
  };
}

export const L_OFFRE_ET_LA_DEMANDE: Chapitre = {
  code: "l-offre-et-la-demande",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "L'offre et la demande sur un marché",
  accroche:
    "Des acheteurs d'un côté, des vendeurs de l'autre, et un prix : un marché. Lire la demande que l'entreprise reçoit et ce qui la fait varier, ce qu'elle met en vente, et ce qui s'échange vraiment.",
  objectifs: [
    "Distinguer la demande et l'offre sur un marché",
    "Dire ce qui fait varier la demande : le prix, la qualité, la publicité, la saison",
    "Calculer la quantité échangée, la plus petite de la demande et de l'offre",
    "Lire la loi de la demande dans un tableau : plus le prix monte, moins on demande",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_MARCHE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un marché : des acheteurs, des vendeurs, un prix",
      notions: ["demand_market_share", "segmentation"],
      tableau: tableauDesClienteles,
      texte: (c) => {
        const k = f(c).marche.enseignes.filter((e) => e.code !== "nova").map((e) => e.nom);
        return [
          "Un marché, c'est la rencontre de ceux qui veulent acheter et de ceux qui vendent. Les acheteurs forment la demande, les vendeurs forment l'offre, et ils se rencontrent à un prix.",
          `Sur le marché des enceintes, les acheteurs se rangent en clientèles, et plusieurs vendeurs se les disputent : ${c.entreprise}, ses deux grands concurrents, ${k.join(" et ")}, et de plus petits.`,
          `Le tableau donne, pour chaque clientèle, ce qu'elle a acheté à tous les vendeurs au ${rang(TRIMESTRE_LU)} trimestre, et la demande que ${c.entreprise} en a reçue à son prix de ${eur(prixDeNova(f(c)))} : les acheteurs qui ont choisi son offre.`,
        ];
      },
      repere: () =>
        "La demande : ce que les acheteurs veulent acheter, à un prix donné. L'offre : ce que les vendeurs mettent en vente. Le marché les fait se rencontrer à un prix.",
    },
    {
      id: "ce-qui-fait-varier",
      type: "choix",
      titre: "Ce qui fait varier la demande reçue",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) => `Voici quatre décisions ${quE(c.entreprise)} peut prendre. Laquelle ne change pas la demande qu'elle reçoit ?`,
      options: (c) => [
        { texte: "Monter son prix", juste: false, retour: "Non, elle la change : un prix plus haut fait renoncer des acheteurs, qui vont chez un concurrent ou n'achètent pas du tout." },
        { texte: "Améliorer la qualité de son offre", juste: false, retour: "Non, elle la change : chaque clientèle tient plus ou moins à la qualité, et une offre meilleure attire davantage d'acheteurs." },
        { texte: "Faire de la publicité", juste: false, retour: "Non, elle la change : la publicité fait connaître l'offre et attire des acheteurs, de moins en moins à chaque euro ajouté." },
        {
          texte: `Mettre plus ${dE(c.unites)} en vente`,
          juste: true,
          retour: `Oui : mettre plus en vente change ce ${quE(c.entreprise)} peut vendre, pas ce que les acheteurs veulent. La demande dépend du prix, de la qualité, de la publicité et de la saison ; la quantité mise en vente n'y entre pas. Elle est l'autre côté du marché : l'offre.`,
        },
      ],
    },
    {
      id: "qui-reagit-au-prix",
      type: "choix",
      titre: "La clientèle qui réagit le plus au prix",
      notions: ["price_elasticity", "segmentation"],
      tableau: tableauDesSensibilites,
      question: (c) => `Toutes les clientèles ne réagissent pas de la même façon au prix. D'après le tableau, quelle clientèle ${dE(c.entreprise)} réagit le plus quand le prix monte ?`,
      options: (c) => {
        const g = segmentation(f(c));
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.promotion.code,
          retour:
            k.code === g.promotion.code
              ? `Oui : quand le prix monte de 1 %, sa demande baisse d'environ ${pct(k.elasticite)}, plus que celle de toute autre clientèle. Une clientèle qui compare beaucoup les prix part vite quand le prix monte.`
              : `Non : quand le prix monte de 1 %, sa demande baisse d'environ ${pct(k.elasticite)}, moins que celle de la clientèle « ${g.promotion.nom} » (environ ${pct(g.promotion.elasticite)}).`,
        }));
      },
    },
    {
      id: "la-saison",
      type: "montants",
      titre: "La demande change avec la saison",
      notions: ["seasonality", "demand_market_share"],
      tableau: tableauDeLaSaison,
      question: () =>
        "La demande ne dépend pas que des décisions des vendeurs : d'un mois à l'autre, elle change d'elle-même. D'après le tableau, calculez les enceintes achetées sur tout le marché pendant le semestre, puis l'écart entre le mois le plus fort et le mois le plus faible.",
      champs: (c) => {
        const s = saisonDuMarche(f(c));
        return [
          { libelle: "Achats du semestre", attendu: s.total, calcul: `${s.mois.map((m) => qte(m.ventes)).join(" + ")} = ${qte(s.total)}`, tolerance: 0 },
          { libelle: "Écart entre le mois le plus fort et le plus faible", attendu: s.ecart, calcul: `${qte(s.plusFort.ventes)} − ${qte(s.plusFaible.ventes)} = ${qte(s.ecart)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const s = saisonDuMarche(f(c));
        return [
          `Le mois de ${s.plusFort.nom} est le plus fort, celui de ${s.plusFaible.nom} le plus faible : ${qte(s.ecart)} ${c.unites} d'écart. Au printemps, on s'équipe pour l'été : le marché grandit.`,
          "Ces variations ne viennent d'aucune décision des vendeurs : elles déplacent la demande à tous les prix à la fois.",
        ];
      },
    },
    {
      id: "l-offre-et-l-echange",
      type: "montants",
      titre: "L'offre et la quantité échangée",
      notions: ["stock", "capacity"],
      tableau: tableauDuTrimestre,
      question: (c) =>
        `L'offre ${dE(c.entreprise)}, c'est ce qu'elle met en vente : ce que sa ligne a fabriqué dans le trimestre, car ${c.entreprise} n'a pas de stock d'enceintes finies. Sur un marché, on n'échange ni plus que ce que les acheteurs demandent, ni plus que ce que les vendeurs offrent : la quantité échangée est la plus petite des deux. Calculez la quantité échangée au ${rang(TRIMESTRE_LU)} trimestre, puis la demande non servie et l'offre non vendue (zéro s'il n'y en a pas).`,
      champs: (c) => {
        const m = marcheDuTrimestre(c);
        return [
          { libelle: "Quantité échangée", attendu: m.echangee, calcul: `la plus petite de ${qte(m.demande)} et ${qte(m.offre)} : ${qte(m.echangee)}`, tolerance: 0 },
          { libelle: "Demande non servie", attendu: m.nonServie, calcul: `${qte(m.demande)} − ${qte(m.echangee)} = ${qte(m.nonServie)}`, tolerance: 0 },
          { libelle: "Offre non vendue", attendu: m.nonVendue, calcul: `${qte(m.offre)} − ${qte(m.echangee)} = ${qte(m.nonVendue)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const m = marcheDuTrimestre(c);
        return [
          m.nonServie > 0
            ? `La demande dépasse l'offre : ${c.entreprise} vend tout ce qu'elle a mis en vente, et des acheteurs repartent sans rien, pour une demande de ${enUnites(m.nonServie, c)}.`
            : m.nonVendue > 0
              ? `L'offre dépasse la demande : tous les acheteurs sont servis, et il reste ${enUnites(m.nonVendue, c)} sans acheteur.`
              : "L'offre et la demande se valent : tous les acheteurs sont servis, et rien ne reste.",
          "Ni l'acheteur ni le vendeur ne décide seul de ce qui s'échange : il faut les deux.",
        ];
      },
    },
    {
      id: "trois-prix",
      type: "lecture",
      titre: "Le trimestre à trois prix",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: tableauDesTroisPrix,
      texte: (c) => {
        const d = troisPrix(f(c));
        return [
          `Que se serait-il passé à un autre prix ? La demande reçue par ${c.entreprise} suit une droite : chaque euro de plus fait renoncer des acheteurs. Le tableau la lit au prix ${dE(c.entreprise)}, puis ${d.ecart} % moins cher et ${d.ecart} % plus cher, avec la même quantité mise en vente : la ligne a fabriqué avant que le prix ne change.`,
          "L'économiste en tire une courbe de demande : le prix sur un axe, la quantité demandée sur l'autre, un point par prix.",
        ];
      },
      repere: () => "La courbe de demande relie chaque prix à la quantité demandée à ce prix.",
    },
    {
      id: "la-loi-de-la-demande",
      type: "choix",
      titre: "La loi de la demande",
      notions: ["price_elasticity"],
      tableau: tableauDesTroisPrix,
      question: () => "Que montre le tableau du trimestre à trois prix ?",
      options: (c) => {
        const d = troisPrix(f(c));
        const faits = `${qte(d.bas.demande)} au prix bas, ${qte(d.base.demande)} au prix ${dE(c.entreprise)}, ${qte(d.haut.demande)} au prix haut`;
        return [
          {
            texte: "Plus le prix est bas, plus la demande reçue est grande",
            juste: d.sens === "baisse",
            retour: d.sens === "baisse" ? `Oui : ${faits}. Quand le prix monte, des acheteurs renoncent ou vont ailleurs : la courbe de demande descend. C'est la loi de la demande.` : `Non : ${faits}.`,
          },
          {
            texte: "La demande reçue ne suit pas le prix",
            juste: d.sens === "aucun",
            retour: d.sens === "aucun" ? `Oui : ${faits}.` : `Non : ${faits}. La demande change avec le prix, et toujours dans le même sens.`,
          },
          {
            texte: "Plus le prix est haut, plus la demande reçue est grande",
            juste: d.sens === "hausse",
            retour: d.sens === "hausse" ? `Oui : ${faits}.` : `Non : ${faits}. Un prix plus haut fait renoncer des acheteurs, il n'en attire pas.`,
          },
        ];
      },
    },
    {
      id: "au-prix-bas",
      type: "montants",
      titre: "Ce que change le prix bas",
      notions: ["price_elasticity", "capacity"],
      tableau: tableauDesTroisPrix,
      question: (c) => {
        const d = troisPrix(f(c));
        return `À ${d.ecart} % moins cher, de combien la demande reçue par ${c.entreprise} augmente-t-elle, par rapport à son prix ? Et la quantité échangée ?`;
      },
      champs: (c) => {
        const d = troisPrix(f(c));
        return [
          { libelle: "Demande reçue en plus, au prix bas", attendu: d.demandeEnPlus, calcul: `${qte(d.bas.demande)} − ${qte(d.base.demande)} = ${qte(d.demandeEnPlus)}`, tolerance: 0 },
          { libelle: "Quantité échangée en plus, au prix bas", attendu: d.echangeeEnPlus, calcul: `${qte(d.bas.echangee)} − ${qte(d.base.echangee)} = ${qte(d.echangeeEnPlus)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const d = troisPrix(f(c));
        return [
          d.echangeeEnPlus < d.demandeEnPlus
            ? `La demande reçue gagne ${enUnites(d.demandeEnPlus, c)}, la quantité échangée ${d.echangeeEnPlus > 0 ? `seulement ${qte(d.echangeeEnPlus)}` : "rien"} : l'offre ne suit pas. ${c.entreprise} a mis en vente ${qte(d.bas.offre)} ${c.unites}, pas une de plus ; les acheteurs que le prix bas attire repartent sans rien.`
            : `La demande reçue gagne ${enUnites(d.demandeEnPlus, c)}, et la quantité échangée autant : l'offre a suivi.`,
          "Un prix plus bas fait venir des acheteurs ; il ne fait pas apparaître l'offre qui les servirait. Ce qui s'échange dépend des deux côtés du marché.",
        ];
      },
    },
    {
      id: "l-offre-qui-suit",
      type: "curseur",
      titre: "Mettre en vente ce que les acheteurs demandent",
      notions: ["capacity", "demand_market_share"],
      question: (c) => {
        const m = marcheDuTrimestre(c);
        return `Au prix de ${eur(m.prix)}, les acheteurs demandent ${qte(m.demande)} ${c.unites} à ${c.entreprise} chaque trimestre : ${eur(m.demande * m.prix)} de chiffre d'affaires, si elle les sert tous. Faites varier la quantité mise en vente : une droite donne le chiffre d'affaires des ventes, l'autre celui que la demande apporterait. Placez le curseur sur la plus petite quantité qui sert toute la demande, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Quantité mise en vente", unite: c.unites }),
      cible: (c) => ({ attendu: marcheDuTrimestre(c).demande, min: QUANTITE_MINIMALE_DU_CURSEUR, max: capacite(f(c)) }),
      zones: ["Toute la demande est servie", "Des acheteurs repartent sans rien"],
      rates: () => ({
        dessous: "Avec si peu mis en vente, des acheteurs repartent encore sans enceinte.",
        dessus: "Toute la demande est servie, mais une partie de ce qui est mis en vente reste sans acheteur : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer la quantité",
      lecture: (c, q) => {
        const m = marcheAuPrix(f(c), { offre: q });
        return [
          { libelle: "Chiffre d'affaires que la demande apporterait", montant: m.demande * m.prix },
          { libelle: "Chiffre d'affaires des ventes", montant: m.echangee * m.prix, fort: true },
          { libelle: "Ventes manquées, en chiffre d'affaires", montant: m.nonServie * m.prix },
        ];
      },
      droites: (c) => ({
        produit: (q) => marcheAuPrix(f(c), { offre: q }).echangee * prixDeNova(f(c)),
        cout: () => marcheDuTrimestre(c).demande * prixDeNova(f(c)),
        libelles: ["Chiffre d'affaires des ventes", "Chiffre d'affaires de la demande"],
      }),
      explication: (c) => {
        const m = marcheDuTrimestre(c);
        return [
          `Il faut mettre en vente ${qte(m.demande)} ${c.unites} : autant que la demande. Avec une de moins, un acheteur repart sans rien ; avec une de plus, elle reste sans acheteur.`,
          `Au ${rang(TRIMESTRE_LU)} trimestre, la ligne en avait fabriqué ${qte(m.offre)} : il en manquait ${qte(m.nonServie)}. Elle aurait pu en monter ${qte(capacite(f(c)))}.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Le laboratoire du prix",
      notions: ["price_elasticity", "capacity"],
      question: (c) =>
        `Et si ${c.entreprise} mettait en vente tout ce que sa ligne peut monter, ${qte(capacite(f(c)))} ${c.unites} par trimestre ? Faites varier le prix : la demande reçue répond, la ligne ne bouge pas. Relevez le défi.`,
      leviers: (c) => [{ code: "prix", libelle: "Prix de l'enceinte", unite: "€", ...PRIX_ESSAYES, depart: prixDeNova(f(c)) }],
      lecture: (c, p) => {
        const x = aPleineLigne(c, p.prix!);
        const depart = aPleineLigne(c, prixDeNova(f(c)));
        return [
          { libelle: "Demande reçue", montant: x.demande, unite: c.unites, reference: depart.demande, fort: true },
          { libelle: "Ce que la ligne peut monter", montant: x.ligne, unite: c.unites },
          { libelle: "Quantité échangée", montant: x.servie, unite: c.unites, reference: depart.servie },
          { libelle: "Acheteurs sans enceinte", montant: x.sansEnceinte, unite: c.unites, reference: depart.sansEnceinte },
        ];
      },
      graphique: (c) => ({
        levier: "prix",
        unite: c.unites,
        courbes: [
          { libelle: "Demande reçue", valeur: (p) => aPleineLigne(c, p.prix!).demande },
          { libelle: "Ce que la ligne peut monter", valeur: () => capacite(f(c)) },
        ],
      }),
      defi: (c) => {
        const juste = prixLePlusBasServi(f(c), capacite(f(c)));
        return {
          consigne: "Trouvez le prix le plus bas, à l'euro, auquel la ligne sert toute la demande.",
          atteint: (p) => p.prix === juste,
          indice: (p) => {
            const x = aPleineLigne(c, p.prix!);
            return x.sansEnceinte > 0
              ? `À ${eur(x.prix)}, la demande dépasse la ligne de ${enUnites(x.sansEnceinte, c)} : il faut un prix plus haut.`
              : `À ${eur(x.prix)}, la ligne sert toute la demande. Un prix plus bas le permettrait-il encore ?`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const x = aPleineLigne(c, p.prix!);
        const avant = aPleineLigne(c, p.prix! - 1);
        return [
          `Défi relevé : à ${eur(x.prix)}, les acheteurs demandent ${qte(x.demande)} ${c.unites}, et la ligne peut en monter ${qte(x.ligne)}. Un euro moins cher, ils en demanderaient ${qte(avant.demande)}, et ${enUnites(avant.sansEnceinte, c)} manqueraient.`,
          "Baisser le prix fait monter la demande ; l'offre a une limite, ce que l'entreprise peut produire. Au-delà, le prix bas ne fait que des acheteurs déçus.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const d = troisPrix(f(c));
        const m = marcheDuTrimestre(c);
        return [
          `Sur le marché des enceintes, la demande reçue par ${c.entreprise} dépend du prix, de la qualité, de la publicité et de la saison. Au ${rang(TRIMESTRE_LU)} trimestre, elle passe de ${qte(d.bas.demande)} à ${qte(d.haut.demande)} ${c.unites} quand le prix passe de ${eur(d.bas.prix)} à ${eur(d.haut.prix)} : c'est la loi de la demande.`,
          `L'offre, c'est ce que les vendeurs mettent en vente. ${c.entreprise} a reçu une demande de ${qte(m.demande)} ${c.unites} et en a mis ${qte(m.offre)} en vente : il s'en est échangé ${qte(m.echangee)}, la plus petite des deux.`,
          "Dans l'arène, votre entreprise reçoit chaque tour sa demande et met en vente ce qu'elle a produit : le marché du tour compte les acheteurs repartis sans rien. Le chapitre suivant cherche le prix qui accorde la demande et l'offre.",
        ];
      },
      repere: () => "Quantité échangée = la plus petite de la demande et de l'offre. Loi de la demande : quand le prix monte, la quantité demandée baisse.",
    },
  ],
};
