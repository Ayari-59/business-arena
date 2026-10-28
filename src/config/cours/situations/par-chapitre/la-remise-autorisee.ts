import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_NEGOCIATION, negociationDuCabinet, tableauDuCabinet } from "../../chapitres/negocier-le-prix";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « NÉGOCIER LE PRIX » : LA REMISE AUTORISÉE (BTS NDRC, palier 2).
 *
 * La directrice commerciale d'ATLAS CONSEIL veut fixer, une fois pour toutes, la remise que ses
 * commerciaux peuvent accorder sans lui en référer. Sa règle : aucune affaire ne doit laisser moins de
 * 10 % de son coût complet en bénéfice. L'élève refait seul le chemin du chapitre (le coût complet, le
 * plancher de la règle, la remise qu'il laisse sous le prix catalogue), place au curseur la consigne
 * au pourcentage entier, puis la remonte à rebours : jusqu'à quel volume de l'année la consigne
 * tient-elle ? La part des fixes d'une journée dépend des journées vendues ; une consigne fixée sur
 * l'année N casse si le cabinet vend moins. Il croise enfin la règle avec la remise que demande le
 * groupe Orvane, qui tient au coût complet mais pas à la règle. La réponse demande un jugement : une
 * consigne, et la condition qui la fait tenir.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses chiffres
 * sont ceux de `negociationDuCabinet`, sur la fiche du cabinet. Il ne lit du cas que son code.
 */

/**
 * LE BÉNÉFICE MINIMAL EXIGÉ SUR CHAQUE AFFAIRE, hypothèse du cas : 10 % de son coût complet. C'est une
 * règle de maison courante chez les prestataires des entreprises : elle garde de quoi absorber un aléa
 * (une journée de préparation de plus, un déplacement imprévu) sans que l'affaire bascule en perte.
 */
export const BENEFICE_MINIMAL_SUR_COUT_COMPLET = 0.1;

/**
 * UNE CONSIGNE FRAGILE, hypothèse du cas : une consigne de remise qui casse dès que l'année vend moins de
 * 5 % de journées de moins que N est à revoir à chaque baisse d'activité.
 */
export const BAISSE_QUI_REND_UNE_CONSIGNE_FRAGILE = 0.05;

/** Les bornes du curseur de la consigne, en pourcentage du prix catalogue. */
export const REMISE_DU_CURSEUR_DE_LA_CONSIGNE = { min: 0, max: 25 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (part: number, chiffres = 2) => `${(Math.round(part * 100 * 10 ** chiffres) / 10 ** chiffres + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const du = (x: string) => x.replace(/^le /, "du ").replace(/^la /, "de la ");
const au = (x: string) => x.replace(/^le /, "au ").replace(/^la /, "à la ");

export type Verdict = "fragile" | "solide";

/** Les chiffres de la réponse, calculés une fois sur la fiche. */
export function remiseAutorisee(c: Pick<Cas, "code">) {
  const n = negociationDuCabinet(c);
  const regle = BENEFICE_MINIMAL_SUR_COUT_COMPLET;
  const beneficeMinimal = auCentime(n.coutComplet * regle);
  const plancher = auCentime(n.coutComplet + beneficeMinimal);
  const remiseParJournee = auCentime(n.prix - plancher);
  const remise = remiseParJournee / n.prix;
  // La consigne au pourcentage entier : la plus forte remise qui garde le prix au plancher de la règle.
  const consigne = Math.floor(remise * 100 + 1e-9);
  const prixALaConsigne = auCentime(n.prix * (1 - consigne / 100));
  // À rebours : le coût complet le plus haut que ce prix tolère avec la règle (au centime inférieur), la
  // part des fixes qu'il laisse, et le moins de journées que l'année doit vendre pour la tenir.
  const coutCompletMaximal = Math.floor((prixALaConsigne / (1 + regle)) * 100 + 1e-9) / 100;
  const partDesFixesMaximale = auCentime(coutCompletMaximal - n.coutVariable);
  const journeesMinimales = Math.ceil(n.chargesFixes / partDesFixesMaximale - 1e-9);
  const margeDeJournees = n.journeesDeLAnnee - journeesMinimales;
  // La remise que demande le client, face à la règle : ce qu'elle laisse sur le coût complet.
  const beneficeDeLaDemande = auCentime(n.prixRemise - n.coutComplet);
  // Les erreurs classiques : le bénéfice pris sur le prix de vente, et le coût variable majoré de la règle
  // (les charges fixes oubliées).
  const plancherSurLePrix = auCentime(n.coutComplet / (1 - regle));
  const consigneSurLePrix = Math.floor((1 - plancherSurLePrix / n.prix) * 100 + 1e-9);
  const consigneSansLesFixes = Math.floor((1 - (n.coutVariable * (1 + regle)) / n.prix) * 100 + 1e-9);
  const verdict: Verdict = margeDeJournees < n.journeesDeLAnnee * BAISSE_QUI_REND_UNE_CONSIGNE_FRAGILE ? "fragile" : "solide";
  return {
    n,
    regle,
    beneficeMinimal,
    plancher,
    remiseParJournee,
    remise,
    remiseAuDixieme: auDixieme(remise * 100),
    remiseSurLaCommande: auCentime(remiseParJournee * n.journeesDeLAffaire),
    consigne,
    prixALaConsigne,
    beneficeALaConsigne: auCentime(prixALaConsigne - n.coutComplet),
    coutCompletMaximal,
    partDesFixesMaximale,
    journeesMinimales,
    margeDeJournees,
    beneficeDeLaDemande,
    plancherSurLePrix,
    consigneSurLePrix,
    consigneSansLesFixes,
    verdict,
  };
}

/** Le document de départ : les chiffres du cabinet et de l'affaire, et la règle de la directrice. */
function tableauDeLaDemande(c: Pick<Cas, "code">): TableauDeDonnees {
  const t = tableauDuCabinet(c);
  return {
    ...t,
    lignes: [...t.lignes, { libelle: "Bénéfice minimal exigé, en part du coût complet", valeurs: [pct(BENEFICE_MINIMAL_SUR_COUT_COMPLET)] }],
  };
}

export const LA_REMISE_AUTORISEE: Situation = {
  code: "la-remise-autorisee",
  parcours: "ndrc",
  palier: 2,
  blocs: [],
  reprend: ["negocier-le-prix"],
  commanditaire: "La directrice commerciale",
  titre: "La remise que le commercial peut accorder",
  accroche:
    "La directrice commerciale veut un bénéfice minimal sur chaque affaire. Quelle remise ses commerciaux peuvent-ils accorder sans lui en parler, et jusqu'à quand la consigne tiendra-t-elle ?",
  objectifs: [
    "Calculer un prix plancher qui garde un bénéfice minimal sur le coût complet",
    "En déduire la remise autorisée, en euros et en pourcentage, puis la consigne au pourcentage entier",
    "Retrouver à rebours le volume de l'année sous lequel la consigne ne tient plus",
    "Rédiger une consigne chiffrée pour l'équipe commerciale",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_NEGOCIATION,
    pourquoi:
      "ce cas reprend le chapitre « Négocier le prix », qui se joue chez ATLAS CONSEIL, le cabinet de la simulation du cours : ses journées se vendent affaire par affaire, et la remise s'y négocie.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice commerciale",
      tableau: tableauDeLaDemande,
      texte: (c) => {
        const r = remiseAutorisee(c);
        return [
          `« Nos commerciaux me demandent sans arrêt jusqu'où ils peuvent descendre. Je pose une règle : aucune affaire ne doit laisser moins de ${pct(r.regle)} de son coût complet en bénéfice. Dites-moi quelle remise, au pourcentage entier, ils peuvent accorder seuls sur le prix catalogue, si cette consigne tiendra l'an prochain, et ce que je réponds ${au(r.n.client)}, qui demande ${pct(r.n.remiseDemandee)}. »`,
          "Pas de cours cette fois : vous avez les chiffres de l'année N et la règle de la directrice. La méthode est celle du chapitre, à vous de l'enchaîner. Tout est hors taxes.",
        ];
      },
      repere: () =>
        "À rendre : le prix plancher de la règle, la remise autorisée en euros et en pourcentage, la consigne au pourcentage entier, le volume de l'année qu'elle suppose, et votre réponse.",
    },
    {
      id: "le-plancher-de-la-regle",
      type: "montants",
      titre: "Le prix plancher de la règle",
      notions: ["full_unit_cost", "price_floor"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `Calculez le coût complet d'une journée, le bénéfice minimal que la règle exige sur chacune (${pct(r.regle)} du coût complet), puis le prix plancher sous lequel un commercial ne peut pas descendre seul.`;
      },
      champs: (c) => {
        const r = remiseAutorisee(c);
        const n = r.n;
        return [
          {
            libelle: "Coût complet d'une journée",
            attendu: n.coutComplet,
            calcul: `${eur(n.coutVariable)} + ${eur(n.chargesFixes)} ÷ ${qte(n.journeesDeLAnnee)} = ${eur(n.coutVariable)} + ${eur(n.partDesFixes)} = ${eur(n.coutComplet)}`,
          },
          { libelle: "Bénéfice minimal par journée", attendu: r.beneficeMinimal, calcul: `${eur(n.coutComplet)} × ${pct(r.regle)} = ${eur(r.beneficeMinimal)}` },
          { libelle: "Prix plancher de la règle", attendu: r.plancher, calcul: `${eur(n.coutComplet)} + ${eur(r.beneficeMinimal)} = ${eur(r.plancher)}` },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `Le bénéfice se prend sur le coût complet, pas sur le prix : à ${eur(r.plancher)}, chaque journée paie ses frais, sa part des charges fixes, et laisse ${eur(r.beneficeMinimal)} au cabinet. Sans la règle, le plancher d'un prix fait à tous serait le coût complet, ${eur(r.n.coutComplet)}.`,
        ];
      },
    },
    {
      id: "la-remise-autorisee",
      type: "montants",
      titre: "La remise autorisée",
      notions: ["price_floor"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `Entre le prix catalogue et ce plancher, quelle remise par journée reste-t-il ? Exprimez-la en pourcentage du prix catalogue, au dixième, puis calculez ce qu'elle représente au plus sur les ${qte(r.n.journeesDeLAffaire)} journées ${du(r.n.client)}.`;
      },
      champs: (c) => {
        const r = remiseAutorisee(c);
        const n = r.n;
        return [
          { libelle: "Remise autorisée par journée", attendu: r.remiseParJournee, calcul: `${eur(n.prix)} − ${eur(r.plancher)} = ${eur(r.remiseParJournee)}` },
          {
            libelle: "Remise autorisée (%)",
            attendu: r.remiseAuDixieme,
            tolerance: 0.1,
            calcul: `${eur(r.remiseParJournee)} ÷ ${eur(n.prix)} × 100 = ${pct(r.remise, 3)}, soit ${pct(r.remiseAuDixieme / 100, 1)} au dixième`,
          },
          { libelle: "Remise au plus sur la commande", attendu: r.remiseSurLaCommande, calcul: `${eur(r.remiseParJournee)} × ${qte(n.journeesDeLAffaire)} = ${eur(r.remiseSurLaCommande)}` },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `Sans la règle, la marge de manœuvre allait jusqu'au coût complet : ${pct(r.n.remiseMaximale)} du prix. La règle en garde une part pour le bénéfice : il reste ${pct(r.remise, 3)}, soit ${eur(r.remiseParJournee)} par journée. Au-delà, la décision remonte à la directrice.`,
        ];
      },
    },
    {
      id: "la-consigne",
      type: "curseur",
      titre: "La consigne au pourcentage entier",
      notions: ["price_floor"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `Les commerciaux ne remisent que par points entiers. Sur la commande ${du(r.n.client)} (${qte(r.n.journeesDeLAffaire)} journées), faites varier la remise : une droite donne le chiffre d'affaires de la commande, l'autre ce qu'elle vaut au plancher de la règle (${qte(r.n.journeesDeLAffaire)} × ${eur(r.plancher)}). Placez le curseur sur la plus forte remise qui garde la commande au-dessus du plancher, puis validez.`;
      },
      grandeur: () => ({ libelle: "Remise accordée", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: remiseAutorisee(c).consigne, min: REMISE_DU_CURSEUR_DE_LA_CONSIGNE.min, max: REMISE_DU_CURSEUR_DE_LA_CONSIGNE.max }),
      lecture: (c, remise) => {
        const r = remiseAutorisee(c);
        const j = r.n.journeesDeLAffaire;
        const prix = auCentime(r.n.prix * (1 - remise / 100));
        return [
          { libelle: "Prix remisé de la journée", montant: prix },
          { libelle: "Bénéfice par journée", montant: auCentime(prix - r.n.coutComplet) },
          { libelle: "Chiffre d'affaires de la commande", montant: auCentime(prix * j) },
          { libelle: "Commande au plancher de la règle", montant: auCentime(r.plancher * j) },
          { libelle: "Marge au-dessus du plancher", montant: auCentime((prix - r.plancher) * j), fort: true },
        ];
      },
      droites: (c) => {
        const r = remiseAutorisee(c);
        const j = r.n.journeesDeLAffaire;
        return {
          produit: (x) => j * r.n.prix * (1 - x / 100),
          cout: () => j * r.plancher,
          libelles: ["Chiffre d'affaires de la commande", "La commande au plancher de la règle"],
        };
      },
      zones: ["La règle est tenue", "La règle est enfreinte"],
      rates: () => ({
        dessous: "Plus forte, la remise tient encore la règle : cherchez la plus forte.",
        dessus: "À cette remise, le prix passe sous le plancher de la règle : la décision remonte à la directrice.",
      }),
      montrer: "Montrer la consigne",
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `La consigne est de ${qte(r.consigne)} % : la journée y vaut ${eur(r.prixALaConsigne)}, ${eur(auCentime(r.prixALaConsigne - r.plancher))} au-dessus du plancher, et laisse ${eur(r.beneficeALaConsigne)} de bénéfice. Un point de plus, et elle passe sous les ${eur(r.plancher)} de la règle.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Jusqu'où la consigne tient",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `La consigne a été calculée sur les ${qte(r.n.journeesDeLAnnee)} journées de N. Si le cabinet en vend moins l'an prochain, chaque journée porte plus de charges fixes. Retrouvez le coût complet le plus haut qu'autorise un prix de ${eur(r.prixALaConsigne)} avec la règle (au centime inférieur), la part des fixes qu'il laisse, puis le moins de journées que l'année doit vendre pour que la consigne tienne.`;
      },
      champs: (c) => {
        const r = remiseAutorisee(c);
        const n = r.n;
        return [
          { libelle: "Coût complet le plus haut", attendu: r.coutCompletMaximal, calcul: `${eur(r.prixALaConsigne)} ÷ ${qte(1 + r.regle)} = ${eur(r.coutCompletMaximal)} (au centime inférieur)` },
          { libelle: "Part des fixes la plus haute", attendu: r.partDesFixesMaximale, calcul: `${eur(r.coutCompletMaximal)} − ${eur(n.coutVariable)} = ${eur(r.partDesFixesMaximale)}` },
          {
            libelle: "Journées à vendre au moins dans l'année",
            attendu: r.journeesMinimales,
            calcul: `${eur(n.chargesFixes)} ÷ ${eur(r.partDesFixesMaximale)} = ${qte(Math.round((n.chargesFixes / r.partDesFixesMaximale) * 100) / 100)}, soit ${qte(r.journeesMinimales)} journées (à la journée supérieure)`,
          },
        ];
      },
      explication: (c) => {
        const r = remiseAutorisee(c);
        return [
          `La consigne de ${qte(r.consigne)} % ne tient que si l'année vend au moins ${qte(r.journeesMinimales)} journées : ${qte(r.margeDeJournees)} de moins que N, pas davantage. Le coût complet n'est pas une donnée fixe : il dépend du volume sur lequel se répartissent les charges fixes. Une consigne de remise se revoit dès que l'activité baisse.`,
        ];
      },
    },
    {
      id: "la-demande-d-orvane",
      type: "choix",
      titre: "La remise demandée par le client",
      notions: ["price_floor", "contribution_margin"],
      question: (c) => {
        const r = remiseAutorisee(c);
        return `${majuscule(r.n.client)} maintient sa demande : ${pct(r.n.remiseDemandee)} de remise, ${eur(r.n.prixRemise)} la journée. Que fait le commercial, avec la règle de la directrice ?`;
      },
      options: (c) => {
        const r = remiseAutorisee(c);
        const n = r.n;
        const auDessusDuComplet = n.prixRemise >= n.coutComplet;
        const dansLaRegle = n.prixRemise >= r.plancher;
        return [
          {
            texte: "Il la soumet à la directrice : elle dépasse la règle",
            juste: !dansLaRegle,
            retour: dansLaRegle
              ? `Non : ${eur(n.prixRemise)} restent au-dessus du plancher de la règle, ${eur(r.plancher)}.`
              : `Oui : à ${eur(n.prixRemise)}, la journée ne laisse que ${eur(r.beneficeDeLaDemande)} sur son coût complet, ${pct(r.beneficeDeLaDemande / n.coutComplet)}, loin des ${eur(r.beneficeMinimal)} de la règle. Elle ne fait rien perdre au cabinet : elle sort de ce que le commercial accorde seul. La directrice peut l'accepter contre du volume, ${qte(n.contrepartie.journeesNecessaires ?? 0)} journées au lieu de ${qte(n.journeesDeLAffaire)}.`,
          },
          {
            texte: `Il l'accorde seul : ${eur(n.prixRemise)} couvrent encore le coût complet`,
            juste: dansLaRegle,
            retour: dansLaRegle
              ? `Oui : ${eur(n.prixRemise)} restent au-dessus du plancher de la règle.`
              : `Non : couvrir le coût complet ne suffit plus. La règle exige ${eur(r.beneficeMinimal)} de bénéfice par journée, et ${eur(n.prixRemise)} n'en laissent que ${eur(r.beneficeDeLaDemande)}.`,
          },
          {
            texte: `Il la refuse : à ${eur(n.prixRemise)}, l'affaire fait perdre de l'argent`,
            juste: false,
            retour: auDessusDuComplet
              ? `Non : ${eur(n.prixRemise)} restent au-dessus du coût complet de ${eur(n.coutComplet)}. L'affaire rapporte moins que la règle ne l'exige ; elle ne fait rien perdre.`
              : "Non : sous le coût complet, la décision n'appartient pas au commercial ; elle remonte à la directrice.",
          },
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice commerciale",
      question: () => "Quelle consigne proposez-vous à la directrice commerciale ?",
      options: (c) => {
        const r = remiseAutorisee(c);
        const n = r.n;
        return [
          {
            texte: `${qte(r.consigne)} % au plus, tant que l'année vend ${qte(r.journeesMinimales)} journées`,
            juste: true,
            retour: `Oui : ${eur(n.coutComplet)} de coût complet, plus ${pct(r.regle)} de bénéfice, donnent un plancher de ${eur(r.plancher)}, soit ${pct(r.remise, 3)} sous le prix catalogue : ${qte(r.consigne)} % au pourcentage entier. Et la consigne repose sur le volume de N : sous ${qte(r.journeesMinimales)} journées, la part des fixes monte et la règle casse. La demande ${du(n.client)}, ${pct(n.remiseDemandee)}, vous revient.`,
          },
          {
            texte: `${qte(n.remiseEntiere)} % au plus : le prix couvre encore le coût complet`,
            juste: false,
            retour: `Non : c'est la remise maximale du chapitre, celle qui ne laisse presque aucun bénéfice. À ${eur(n.prixALaRemiseEntiere)}, la journée laisse ${eur(auCentime(n.prixALaRemiseEntiere - n.coutComplet))}, quand la règle en exige ${eur(r.beneficeMinimal)}.`,
          },
          {
            texte: `${qte(r.consigneSurLePrix)} % au plus : le bénéfice pris sur le prix de vente`,
            juste: false,
            retour: `Non : la règle prend ses ${pct(r.regle)} sur le coût complet, pas sur le prix. Pris sur le prix, le plancher monte à ${eur(r.plancherSurLePrix)} (${eur(n.coutComplet)} ÷ ${qte(1 - r.regle)}), et la consigne se resserre sans raison.`,
          },
          {
            texte: `${qte(r.consigneSansLesFixes)} % au plus : le coût variable majoré de ${pct(r.regle)}`,
            juste: false,
            retour: `Non : ce plancher oublie les charges fixes. Chaque journée en porte ${eur(n.partDesFixes)} ; vendue à ce prix à tous les clients, ${n.entreprise} ne paierait plus ses consultants ni son loyer.`,
          },
        ];
      },
    },
  ],
};
