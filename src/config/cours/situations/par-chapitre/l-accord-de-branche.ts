import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, equipeEtPlanning, tableauDeLEquipe } from "../../chapitres/equipe-et-planning";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ÉQUIPE ET SON PLANNING » : L'ACCORD DE BRANCHE (BTS MCO, palier 4).
 *
 * Un accord de branche revalorise les salaires de 3 %. La direction de MAILLE & CO veut savoir ce que
 * coûtera l'heure de l'équipe, ce que pèsera le personnel, et comment payer la hausse. Le responsable
 * de la boutique propose une économie : ne pas renouveler le CDD de l'étudiante, qui coûte plus que la
 * hausse. L'élève chiffre la hausse, remonte à rebours des euros de marge aux passages en caisse et au
 * taux de transformation qui la paient, puis croise l'économie proposée avec le planning : sans
 * l'étudiante, les heures de vente ne couvrent plus le besoin lu sur l'affluence. La réponse demande un
 * jugement : la bonne économie n'est pas la plus grosse. Un curseur sur les passages en caisse montre,
 * avant le calcul, combien de clients de plus paient la hausse.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `equipeEtPlanning`, sur la fiche de la boutique.
 */

/**
 * LA REVALORISATION DES SALAIRES (hypothèse du cours) : 3 %, l'ordre de grandeur d'une hausse annuelle
 * des minima d'une branche du commerce. Les cotisations se calculant sur le brut, le coût chargé de
 * l'équipe monte du même pourcentage.
 */
export const HAUSSE_DES_SALAIRES = 0.03;

/** Le contrat que le responsable propose de ne pas renouveler : le CDD de l'étudiante (hypothèse de l'histoire). */
export const CONTRAT_NON_RENOUVELE = "etudiante";

/** Les bornes du curseur des passages en caisse du mois. */
export const PASSAGES_DU_CURSEUR = { min: 900, max: 1_100 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const h = (x: number) => `${qte(x)} h`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

export type Verdict = "garder-l-etudiante" | "l-economie-tient";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function accordDeBranche(c: Pick<Cas, "code">) {
  const x = equipeEtPlanning(c);
  const coutApres = auCentime(x.e.cout * (1 + HAUSSE_DES_SALAIRES));
  const hausse = auCentime(coutApres - x.e.cout);
  const caEnPlus = plafond(hausse / x.tauxMcv);
  const passagesEnPlus = plafond(caEnPlus / x.panier);
  // Un seul panier, celui de la caisse : la marge d'un passage se lit sur le chiffre d'affaires encaissé ;
  // celle des commandes des comités, hors caisse, ne change pas.
  const margeParPassage = (x.caEnCaisse * x.tauxMcv) / x.tickets;
  const margeAvant = auCentime(x.ca * x.tauxMcv);
  const margeDesCommandes = x.commandes * x.tauxMcv;
  // L'économie du responsable : le contrat de l'étudiante, et les heures de vente qu'il emporte.
  const etudiante = x.e.salaries.find((s) => s.code === CONTRAT_NON_RENOUVELE)!;
  const venteSansElle = x.planning.heuresPlanifiees - etudiante.heuresParSemaine;
  const enManqueAuMieux = Math.max(0, x.besoin.heuresDeVente - venteSansElle);
  return {
    x,
    coutApres,
    hausse,
    tauxHoraireApres: auCentime(coutApres / x.e.heuresDuMois),
    partApres: auDixieme((coutApres / x.ca) * 100),
    caEnPlus,
    passagesEnPlus,
    transformationVisee: auDixieme(((x.tickets + passagesEnPlus) / x.entreesDuMois) * 100),
    margeParPassage,
    margeDesCommandes,
    margeAvant,
    margeARetrouver: auCentime(margeAvant + hausse),
    passagesAuCurseur: plafond((margeAvant + hausse - margeDesCommandes) / margeParPassage),
    etudiante,
    economie: etudiante.cout,
    venteSansElle,
    enManqueAuMieux,
    verdict: (enManqueAuMieux > 0 ? "garder-l-etudiante" : "l-economie-tient") as Verdict,
    // Les erreurs classiques : payer la hausse avec autant de ventes qu'elle coûte, ou du même pourcentage.
    caDuMemePourcentage: auCentime(x.ca * HAUSSE_DES_SALAIRES),
  };
}

export const L_ACCORD_DE_BRANCHE: Situation = {
  code: "l-accord-de-branche",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["equipe-et-planning"],
  commanditaire: "La direction",
  titre: "L'accord de branche",
  accroche:
    "Un accord de branche revalorise les salaires. La direction veut savoir ce que coûtera l'heure de l'équipe et comment payer la hausse ; le responsable propose de ne pas renouveler un contrat. Que vaut son économie face au planning ?",
  objectifs: [
    "Chiffrer une revalorisation des salaires sur le coût horaire et la part du personnel",
    "Remonter de la hausse aux ventes, aux passages en caisse et au taux de transformation qui la paient",
    "Croiser une économie de personnel avec le besoin d'heures lu sur l'affluence",
    "Répondre à la direction en raisonnant sur la marge et sur le planning",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « L'équipe et son planning », qui se joue à la boutique du cours, MAILLE & CO, et à son planning créneau par créneau.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDeLEquipe,
      texte: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          `« L'accord de branche revalorise les salaires de ${pct(HAUSSE_DES_SALAIRES * 100)} au 1er du mois prochain ; les cotisations suivent. Je veux savoir ce que coûtera une heure de l'équipe de ${x.f.entreprise}, ce que pèsera le personnel, et comment nous paierons la hausse. Le responsable de la boutique propose de ne pas renouveler le CDD de l'étudiante : il dit que l'économie couvre la hausse. Qu'en pensez-vous ? »`,
          `Les chiffres de janvier : ${eur(x.e.cout)} de paie pour ${h(x.e.heuresDuMois)} payées, ${eur(x.ca)} de chiffre d'affaires, ${qte(x.entreesDuMois)} entrées et ${qte(x.tickets)} passages en caisse, un taux de marge sur coût variable de ${pct(x.tauxMcvAffiche)}. L'affluence demande ${h(x.besoin.heuresDeVente)} de vente par semaine ; le planning en donne ${h(x.planning.heuresPlanifiees)}, et l'étudiante y tient ${h(r.etudiante.heuresParSemaine)}, le mercredi et le samedi.`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre.",
        ];
      },
      repere: () =>
        "À rendre : le coût horaire et la part du personnel après la hausse, les ventes et les passages en caisse qui la paient, ce que l'économie proposée ferait au planning, et votre réponse.",
    },
    {
      id: "apres-la-hausse",
      type: "montants",
      titre: "Après la hausse",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Avec ${pct(HAUSSE_DES_SALAIRES * 100)} de plus, calculez le coût du personnel du mois, la hausse mensuelle, le nouveau coût horaire chargé (au centime), puis la nouvelle part du personnel au chiffre d'affaires de janvier (au dixième).`,
      champs: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          { libelle: "Coût du personnel après la hausse", attendu: r.coutApres, calcul: `${eur(x.e.cout)} × ${qte(1 + HAUSSE_DES_SALAIRES)} = ${eur(r.coutApres)}` },
          { libelle: "Hausse mensuelle", attendu: r.hausse, calcul: `${eur(r.coutApres)} − ${eur(x.e.cout)} = ${eur(r.hausse)}` },
          { libelle: "Nouveau coût horaire chargé", attendu: r.tauxHoraireApres, tolerance: 0.02, calcul: `${eur(r.coutApres)} ÷ ${h(x.e.heuresDuMois)} = ${eur(r.tauxHoraireApres)}` },
          { libelle: "Nouvelle part du personnel (%)", attendu: r.partApres, tolerance: 0.1, calcul: `${eur(r.coutApres)} ÷ ${eur(x.ca)} × 100 = ${pct(r.partApres)}` },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          `L'équipe ne fait pas une heure de plus, mais chaque heure coûte ${eur(r.tauxHoraireApres)} au lieu de ${eur(x.tauxHoraire)}. Sans ventes en plus, le résultat de ${x.f.entreprise} perd ${eur(r.hausse)} chaque mois, et la part du personnel passe de ${pct(x.partDuPersonnel)} à ${pct(r.partApres)}.`,
        ];
      },
    },
    {
      id: "le-curseur-des-passages",
      type: "curseur",
      titre: "Les passages en caisse qui paient la hausse",
      notions: ["contribution_margin", "average_basket"],
      question: (c) => {
        const r = accordDeBranche(c);
        return `Au panier moyen de janvier, chaque passage en caisse laisse ${eur(auCentime(r.margeParPassage))} de marge sur coût variable ; les commandes des comités, hors caisse, en laissent ${eur(auCentime(r.margeDesCommandes))}. Faites varier les passages en caisse du mois : à partir de combien la marge paie-t-elle la paie revalorisée, soit la marge de janvier plus la hausse (${eur(r.margeARetrouver)}) ? Placez le curseur sur le plus petit nombre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Passages en caisse du mois", unite: "passages" }),
      cible: (c) => ({ attendu: accordDeBranche(c).passagesAuCurseur, min: PASSAGES_DU_CURSEUR.min, max: PASSAGES_DU_CURSEUR.max }),
      zones: ["La hausse est payée", "La hausse pèse sur le résultat"],
      rates: () => ({
        dessous: "À cette position, la marge ne couvre pas encore la hausse : il manque des passages en caisse.",
        dessus: "Plus bas, la marge couvre encore la hausse : cherchez le plus petit nombre de passages.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, n) => {
        const r = accordDeBranche(c);
        const marge = auCentime(n * r.margeParPassage + r.margeDesCommandes);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: auCentime(n * r.x.panier + r.x.commandes) },
          { libelle: "Marge sur coût variable", montant: marge },
          { libelle: "Marge de janvier plus la hausse", montant: r.margeARetrouver },
          { libelle: "Ce que la hausse laisse au résultat", montant: auCentime(marge - r.margeARetrouver), fort: true },
        ];
      },
      droites: (c) => {
        const r = accordDeBranche(c);
        return { produit: (n) => n * r.margeParPassage + r.margeDesCommandes, cout: () => r.margeARetrouver, libelles: ["Marge sur coût variable des passages", "Marge de janvier plus la hausse"] };
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        return [
          `Il faut ${qte(r.passagesAuCurseur)} passages en caisse au lieu de ${qte(r.x.tickets)} : ${qte(r.passagesAuCurseur - r.x.tickets)} clients qui achètent de plus par mois paient la hausse. L'étape suivante le refait en euros, puis en taux de transformation.`,
        ];
      },
    },
    {
      id: "les-ventes-qui-paient",
      type: "montants",
      titre: "Les ventes qui paient la hausse",
      notions: ["contribution_margin", "fixed_costs", "conversion_rate"],
      question: () =>
        "La hausse se paie avec la marge des ventes en plus. Quel chiffre d'affaires faut-il réaliser en plus chaque mois (à l'euro, arrondi au-dessus) ? Combien de passages en caisse de plus, au panier moyen de janvier (arrondi au-dessus) ? Quel taux de transformation faut-il alors, au même trafic (au dixième) ?",
      champs: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          { libelle: "Chiffre d'affaires à réaliser en plus", attendu: r.caEnPlus, tolerance: 2, calcul: `${eur(r.hausse)} ÷ ${pct(x.tauxMcvAffiche)} = ${eur(r.caEnPlus)}` },
          { libelle: "Passages en caisse en plus", attendu: r.passagesEnPlus, calcul: `${eur(r.caEnPlus)} ÷ ${eur(auCentime(x.panier))} = ${qte(auCentime(r.caEnPlus / x.panier))}, arrondi à ${qte(r.passagesEnPlus)}` },
          {
            libelle: "Taux de transformation à atteindre (%)",
            attendu: r.transformationVisee,
            tolerance: 0.1,
            calcul: `(${qte(x.tickets)} + ${qte(r.passagesEnPlus)}) ÷ ${qte(x.entreesDuMois)} × 100 = ${pct(r.transformationVisee)}`,
          },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          `Chaque euro de ventes en plus ne laisse que ${pct(x.tauxMcvAffiche)} de marge : pour payer ${eur(r.hausse)}, il en faut ${eur(r.caEnPlus)}, soit ${qte(r.passagesEnPlus)} passages en caisse de plus, une transformation de ${pct(r.transformationVisee)} au lieu de ${pct(auDixieme((x.tickets / x.entreesDuMois) * 100))}. C'est un objectif à la portée d'une équipe au complet.`,
        ];
      },
    },
    {
      id: "l-economie-proposee",
      type: "montants",
      titre: "L'économie proposée, face au planning",
      notions: ["payroll", "capacity"],
      question: (c) => {
        const r = accordDeBranche(c);
        return `Le responsable propose de ne pas renouveler le CDD de l'étudiante (${h(r.etudiante.heuresParSemaine)} par semaine, ${eur(r.etudiante.brutMensuel)} de brut). Calculez l'économie mensuelle, cotisations comprises, les heures de vente du planning sans elle, puis les heures du besoin qui resteraient en manque même avec le meilleur planning possible.`;
      },
      champs: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        return [
          { libelle: "Économie mensuelle", attendu: r.economie, calcul: `${eur(r.etudiante.brutMensuel)} × ${qte(1 + x.f.tauxPatronal)} = ${eur(r.economie)}` },
          { libelle: "Heures de vente du planning sans elle", attendu: r.venteSansElle, calcul: `${h(x.planning.heuresPlanifiees)} − ${h(r.etudiante.heuresParSemaine)} = ${h(r.venteSansElle)}` },
          {
            libelle: "Heures en manque au mieux",
            attendu: r.enManqueAuMieux,
            calcul: `${h(x.besoin.heuresDeVente)} de vente nécessaires − ${h(r.venteSansElle)} = ${h(r.enManqueAuMieux)}, même toutes les heures bien placées`,
          },
        ];
      },
      explication: (c) => {
        const r = accordDeBranche(c);
        return [
          `L'économie, ${eur(r.economie)}, dépasse la hausse de ${eur(r.hausse)}. Mais sans l'étudiante, la boutique n'a plus que ${h(r.venteSansElle)} de vente pour ${h(r.x.besoin.heuresDeVente)} nécessaires : ${h(r.enManqueAuMieux)} manqueraient chaque semaine quel que soit le planning, sur les créneaux les plus chargés.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["contribution_margin", "capacity"],
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const r = accordDeBranche(c);
        const x = r.x;
        const garder = r.verdict === "garder-l-etudiante";
        return [
          {
            texte: `Garder l'équipe, et viser ${eur(r.caEnPlus)} de ventes en plus par mois`,
            juste: garder,
            retour: garder
              ? `Oui : la hausse coûte ${eur(r.hausse)} par mois, que ${eur(r.caEnPlus)} de ventes en plus paient par leur marge, ${qte(r.passagesEnPlus)} passages en caisse. Sans l'étudiante, ${h(r.enManqueAuMieux)} de vente manqueraient chaque semaine : l'économie se paierait en clients mal servis.`
              : "Non : le planning tient sans l'étudiante, l'économie couvre la hausse.",
          },
          {
            texte: `Ne pas renouveler l'étudiante : ${eur(r.economie)} d'économie, plus que la hausse`,
            juste: !garder,
            retour: garder
              ? `Non : c'est regarder la paie sans le planning. Sans elle, ${h(r.venteSansElle)} de vente pour ${h(x.besoin.heuresDeVente)} nécessaires : ${h(r.enManqueAuMieux)} manquent, même avec le meilleur planning.`
              : "Oui : le planning garde assez d'heures pour couvrir le besoin.",
          },
          {
            texte: `Viser ${eur(r.hausse)} de ventes en plus, le montant de la hausse`,
            juste: false,
            retour: `Non : ${eur(r.hausse)} de ventes en plus ne laissent que ${eur(auCentime(r.hausse * x.tauxMcv))} de marge. C'est la marge qui paie la hausse : il faut ${eur(r.caEnPlus)} de ventes.`,
          },
          {
            texte: `Viser ${pct(HAUSSE_DES_SALAIRES * 100)} de ventes en plus, ${eur(r.caDuMemePourcentage)}, comme les salaires`,
            juste: false,
            retour: `Non : le personnel ne pèse que ${pct(x.partDuPersonnel)} du chiffre d'affaires. ${pct(HAUSSE_DES_SALAIRES * 100)} de ventes en plus laisseraient ${eur(auCentime(r.caDuMemePourcentage * x.tauxMcv))} de marge pour ${eur(r.hausse)} de hausse : ${eur(r.caEnPlus)} suffisent.`,
          },
        ];
      },
    },
  ],
};
