import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_QUALITE, qualiteDeNova } from "../../chapitres/le-cout-de-la-non-qualite";
import { demarcheQualite } from "../../monde/capacite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT DE LA NON-QUALITÉ » : UNE SEULE DÉMARCHE QUALITÉ CETTE ANNÉE
 * (BTS GPME, gestion des risques, palier 3).
 *
 * Le gérant ne financera qu'une démarche qualité cette année, et hésite entre les deux du catalogue de
 * la fiche : la standardisation des postes, qui PRÉVIENT (moins de défauts), et le contrôle automatisé
 * en ligne, qui DÉTECTE plus tôt (autant de défauts, mais moins partent chez les clients). L'élève
 * CROISE les deux effets : le contrôle n'évite aucun défaut, il en fait retoucher à l'atelier qui
 * seraient revenus des clients, et il garde les ventes qu'un client déçu fait perdre. Un curseur sur la
 * part des défauts que trouve le contrôle montre, avant le calcul, où il se rembourse en un an. La
 * réponse demande un jugement : la standardisation se rembourse plus vite, le contrôle rapporte plus
 * sur l'horizon du gérant ; c'est l'horizon qui décide, et le délai de récupération ne dit pas ce qui
 * vient après.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `demarcheQualite`, au budget de prévention actuel, sur les enceintes du plan de
 * N + 1. HYPOTHÈSE DU COURS : chaque démarche garde ses effets, et chaque année gagne autant que la
 * première. Le cas se jouait au bistrot de l'arène, sur deux démarches rejouées par le moteur.
 */

/** L'horizon du plan du gérant : trois ans. Une hypothèse du cours. */
export const HORIZON_DU_GERANT_EN_ANNEES = 3;

/** Les bornes du curseur de la détection du contrôle en ligne, en %. */
export const DETECTION_DU_CURSEUR = { min: 80, max: 100 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const ans = (x: number) => `${qte(x)} an${x >= 2 ? "s" : ""}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "standardisation" | "controle-en-ligne" | "aucune";

/** Les deux démarches, leurs gains, leurs délais, et celle qui rapporte le plus sur l'horizon du gérant. */
export function deuxDemarches(c: Pick<Cas, "code">) {
  const x = qualiteDeNova(c);
  const horizon = HORIZON_DU_GERANT_EN_ANNEES;
  const standardisation = demarcheQualite(x.f, "standardisation", { volume: x.volume, horizon });
  const controle = demarcheQualite(x.f, "controle-en-ligne", { volume: x.volume, horizon });
  const delai = (d: typeof standardisation) => auCentime(d.delai ?? Number.POSITIVE_INFINITY);
  const delaiSurLesCouts = (d: typeof standardisation) => auCentime(d.delaiSurLesCouts ?? Number.POSITIVE_INFINITY);
  const meilleure = standardisation.gainNet >= controle.gainNet ? standardisation : controle;
  const verdict: Verdict = meilleure.gainNet <= 0 ? "aucune" : meilleure.code;
  // Le curseur : la plus petite détection (en % entier) où le contrôle en ligne se rembourse en un an, ventes comprises.
  const q = x.f.qualite;
  const parPoint = (x.actuel.defauts / 100) * (q.coutDUnDefautLivre - q.coutDUnDefautDetecte + q.ventesPerduesParDefautLivre * x.m);
  const detectionQuiRembourse = Math.ceil(q.controleFinal.tauxDeDetection * 100 + controle.cout / parPoint - 1e-9);
  return {
    x,
    standardisation,
    controle,
    delais: {
      standardisation: { couts: delaiSurLesCouts(standardisation), ventes: delai(standardisation) },
      controle: { couts: delaiSurLesCouts(controle), ventes: delai(controle) },
    },
    retouchesEnPlus: auCentime(controle.avec.detectes - controle.sans.detectes),
    avanceDuControle: auCentime(controle.gainNet - standardisation.gainNet),
    parPoint,
    detectionQuiRembourse,
    meilleure: meilleure.code,
    verdict,
  };
}

export const UNE_SEULE_DEMARCHE_QUALITE: Situation = {
  code: "une-seule-demarche-qualite",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: ["le-cout-de-la-non-qualite"],
  commanditaire: "Le gérant",
  titre: "Une seule démarche qualité cette année",
  accroche:
    "Le gérant ne financera qu'une démarche qualité cette année, et hésite entre prévenir et détecter plus tôt. Ce que chacune fait gagner, le temps qu'elle met à se rembourser, ce qu'elle rapporte sur son plan, et le choix à lui rendre.",
  objectifs: [
    "Chiffrer le gain d'une démarche qui prévient et d'une démarche qui détecte",
    "Compter les ventes que la qualité perçue fait perdre, en plus des coûts",
    "Comparer deux démarches par leur délai de récupération et par leur gain sur un horizon",
    "Répondre au gérant en disant le critère qui décide",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_QUALITE,
    pourquoi: "ce cas reprend le chapitre « Le coût de la non-qualité », qui se joue dans la simulation du cours chez NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      tableau: (c) => {
        const d = deuxDemarches(c);
        const x = d.x;
        const q = x.f.qualite;
        return {
          titre: `La qualité ${dE(x.f.entreprise)} au budget actuel, et les deux démarches`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Enceintes de l'année", valeurs: [qte(x.volume)] },
            { libelle: "Taux de défaut au budget actuel", valeurs: [pct(x.actuel.tauxDeDefaut)] },
            { libelle: "Part des défauts que le contrôle final trouve", valeurs: [pct(q.controleFinal.tauxDeDetection)] },
            { libelle: "Retouche d'un défaut trouvé", valeurs: [eur(q.coutDUnDefautDetecte)] },
            { libelle: "Retour sous garantie d'un défaut livré", valeurs: [eur(q.coutDUnDefautLivre)] },
            { libelle: "Ventes perdues par défaut livré, à la marge d'une enceinte", valeurs: [`${qte(q.ventesPerduesParDefautLivre)} × ${eur(x.m)}`] },
            { libelle: `${d.standardisation.nom}, payée une fois`, valeurs: [`${eur(d.standardisation.cout)} ; ${qte(d.standardisation.baisseDuTauxDeDefaut * 100)} point de taux de défaut en moins`] },
            { libelle: `${d.controle.nom}, payé une fois`, valeurs: [`${eur(d.controle.cout)} ; ${pct(d.controle.tauxDeDetection!)} des défauts trouvés`] },
          ],
        };
      },
      texte: (c) => {
        const d = deuxDemarches(c);
        return [
          `« Nous ne financerons qu'une démarche qualité cette année : la ${d.standardisation.nom.toLowerCase()}, ou le ${d.controle.nom.toLowerCase()}. L'une évite des défauts, l'autre les trouve plus tôt. Sur les ${HORIZON_DU_GERANT_EN_ANNEES} ans de mon plan, laquelle ${d.x.f.entreprise} doit-elle choisir ? »`,
          "Pas de cours cette fois : vous avez les données de la qualité et les deux démarches, la méthode est celle du chapitre, à vous d'en trouver l'ordre. Chaque démarche est supposée garder ses effets, et gagner chaque année autant que la première.",
        ];
      },
      repere: () =>
        "À rendre : ce que chaque démarche fait gagner par an, sur les coûts puis ventes comprises, son délai de récupération, ce qu'elle rapporte sur l'horizon du gérant, et votre choix.",
    },
    {
      id: "sur-les-couts",
      type: "montants",
      titre: "Ce que chaque démarche fait gagner sur les coûts",
      notions: ["variable_costs"],
      question: () =>
        "Calculez le gain de l'année sur le coût total de la qualité avec la standardisation, puis avec le contrôle en ligne, et le délai de récupération du contrôle en ligne sur les coûts, en années, au centième.",
      champs: (c) => {
        const d = deuxDemarches(c);
        const q = d.x.f.qualite;
        const s = d.standardisation;
        const k = d.controle;
        return [
          {
            libelle: "Gain de l'année sur les coûts, standardisation",
            attendu: s.gainDesCouts,
            calcul: `${qte(s.defautsEvites)} défauts évités × ${eur(d.x.coutMoyenDUnDefaut)} de coût moyen d'un défaut = ${eur(s.gainDesCouts)}`,
          },
          {
            libelle: "Gain de l'année sur les coûts, contrôle en ligne",
            attendu: k.gainDesCouts,
            calcul: `${qte(k.livresEvites)} défauts livrés de moins × ${eur(q.coutDUnDefautLivre)} − ${qte(d.retouchesEnPlus)} retouches de plus × ${eur(q.coutDUnDefautDetecte)} = ${eur(k.gainDesCouts)}`,
          },
          { libelle: "Délai de récupération du contrôle en ligne, sur les coûts", attendu: d.delais.controle.couts, calcul: `${eur(k.cout)} ÷ ${eur(k.gainDesCouts)} = ${ans(d.delais.controle.couts)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const d = deuxDemarches(c);
        return [
          `Le contrôle en ligne n'évite aucun défaut : il en fait trouver ${qte(d.retouchesEnPlus)} de plus à l'atelier, qui seraient revenus des clients. Chacun coûte une retouche au lieu d'un retour. Sur les coûts seuls, la standardisation se rembourse en ${ans(d.delais.standardisation.couts)}, le contrôle en ${ans(d.delais.controle.couts)}.`,
        ];
      },
    },
    {
      id: "la-detection-au-curseur",
      type: "curseur",
      titre: "La détection qui rembourse le contrôle",
      notions: ["variable_costs", "irr_payback"],
      question: (c) => {
        const d = deuxDemarches(c);
        return `Le contrôle en ligne coûte ${eur(d.controle.cout)}. Faites varier la part des défauts que le contrôle trouve avec lui, de ${qte(DETECTION_DU_CURSEUR.min)} à ${qte(DETECTION_DU_CURSEUR.max)} %. Une droite donne ce qu'il fait gagner en un an, coûts et ventes gardées compris, l'autre son coût. Placez le curseur sur la plus petite détection où une année de gain le rembourse, puis validez.`;
      },
      grandeur: () => ({ libelle: "Défauts trouvés au contrôle", unite: "%" }),
      cible: (c) => ({ attendu: deuxDemarches(c).detectionQuiRembourse, min: DETECTION_DU_CURSEUR.min, max: DETECTION_DU_CURSEUR.max }),
      zones: ["Remboursé en un an", "Plus d'un an pour se rembourser"],
      rates: () => ({
        dessous: "À cette détection, une année de gain ne rembourse pas encore le contrôle.",
        dessus: "Plus bas, une année de gain le rembourse encore : cherchez la plus petite détection.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, t) => {
        const d = deuxDemarches(c);
        const q = d.x.f.qualite;
        const avec = (t / 100 - q.controleFinal.tauxDeDetection) * d.x.actuel.defauts;
        return [
          { libelle: "Défauts livrés de moins", montant: auCentime(avec) },
          { libelle: "Gain sur les coûts", montant: auCentime(avec * (q.coutDUnDefautLivre - q.coutDUnDefautDetecte)) },
          { libelle: "Marge des ventes gardées", montant: auCentime(avec * q.ventesPerduesParDefautLivre * d.x.m) },
          { libelle: "Gain de l'année, ventes comprises", montant: auCentime((t - q.controleFinal.tauxDeDetection * 100) * d.parPoint), fort: true },
        ];
      },
      droites: (c) => {
        const d = deuxDemarches(c);
        const base = d.x.f.qualite.controleFinal.tauxDeDetection * 100;
        return { produit: (t) => (t - base) * d.parPoint, cout: () => d.controle.cout, libelles: ["Gain de l'année, ventes comprises", "Coût du contrôle en ligne"] };
      },
      explication: (c) => {
        const d = deuxDemarches(c);
        return [
          `Dès ${qte(d.detectionQuiRembourse)} % des défauts trouvés, une année de gain rembourse le contrôle en ligne, ventes gardées comprises ; le fournisseur en promet ${pct(d.controle.tauxDeDetection!)}. Chaque point de détection en plus vaut ${eur(auCentime(d.parPoint))} par an : un défaut trouvé au lieu d'être livré coûte une retouche (${eur(d.x.f.qualite.coutDUnDefautDetecte)}) au lieu d'un retour (${eur(d.x.f.qualite.coutDUnDefautLivre)}), et garde ${qte(d.x.f.qualite.ventesPerduesParDefautLivre)} ventes.`,
        ];
      },
    },
    {
      id: "ventes-comprises",
      type: "montants",
      titre: "Les ventes gardées",
      notions: ["demand_market_share", "irr_payback"],
      question: () =>
        "Ajoutez aux gains sur les coûts la marge des ventes que chaque démarche garde. Calculez le gain de l'année, ventes comprises, de la standardisation, puis du contrôle en ligne, et le délai de récupération du contrôle en ligne, ventes comprises, au centième.",
      champs: (c) => {
        const d = deuxDemarches(c);
        const q = d.x.f.qualite;
        const s = d.standardisation;
        const k = d.controle;
        return [
          {
            libelle: "Gain de l'année ventes comprises, standardisation",
            attendu: s.gain,
            calcul: `${eur(s.gainDesCouts)} + ${qte(s.livresEvites)} défauts livrés de moins × ${qte(q.ventesPerduesParDefautLivre)} × ${eur(d.x.m)} = ${eur(s.gainDesCouts)} + ${eur(s.gainDesVentes)} = ${eur(s.gain)}`,
          },
          {
            libelle: "Gain de l'année ventes comprises, contrôle en ligne",
            attendu: k.gain,
            calcul: `${eur(k.gainDesCouts)} + ${qte(k.livresEvites)} × ${qte(q.ventesPerduesParDefautLivre)} × ${eur(d.x.m)} = ${eur(k.gainDesCouts)} + ${eur(k.gainDesVentes)} = ${eur(k.gain)}`,
          },
          { libelle: "Délai de récupération du contrôle en ligne, ventes comprises", attendu: d.delais.controle.ventes, calcul: `${eur(k.cout)} ÷ ${eur(k.gain)} = ${ans(d.delais.controle.ventes)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const d = deuxDemarches(c);
        return [
          `Ventes comprises, la standardisation se rembourse en ${ans(d.delais.standardisation.ventes)}, le contrôle en ligne en ${ans(d.delais.controle.ventes)}. Le contrôle garde plus de ventes : il réduit les défauts livrés de ${qte(d.controle.livresEvites)}, la standardisation de ${qte(d.standardisation.livresEvites)} seulement, et c'est un défaut livré qui fait perdre un client.`,
        ];
      },
    },
    {
      id: "sur-l-horizon",
      type: "montants",
      titre: "Sur l'horizon du gérant",
      notions: ["irr_payback"],
      question: () =>
        `Calculez ce que chaque démarche rapporte net sur les ${HORIZON_DU_GERANT_EN_ANNEES} ans du plan, ventes comprises (le gain des ${HORIZON_DU_GERANT_EN_ANNEES} années moins le coût de la démarche), puis l'avance du contrôle en ligne sur la standardisation.`,
      champs: (c) => {
        const d = deuxDemarches(c);
        const s = d.standardisation;
        const k = d.controle;
        const h = HORIZON_DU_GERANT_EN_ANNEES;
        return [
          { libelle: "Gain net sur le plan, standardisation", attendu: s.gainNet, calcul: `${eur(s.gain)} × ${h} − ${eur(s.cout)} = ${eur(s.gainNet)}` },
          { libelle: "Gain net sur le plan, contrôle en ligne", attendu: k.gainNet, calcul: `${eur(k.gain)} × ${h} − ${eur(k.cout)} = ${eur(k.gainNet)}` },
          { libelle: "Avance du contrôle en ligne sur le plan", attendu: d.avanceDuControle, calcul: `${eur(k.gainNet)} − ${eur(s.gainNet)} = ${eur(d.avanceDuControle)}` },
        ];
      },
      explication: (c) => {
        const d = deuxDemarches(c);
        return [
          `La standardisation se rembourse plus vite (${ans(d.delais.standardisation.ventes)} contre ${ans(d.delais.controle.ventes)}), mais sur les ${HORIZON_DU_GERANT_EN_ANNEES} ans du plan, le contrôle en ligne rapporte ${eur(d.avanceDuControle)} de plus. Le délai de récupération dit quand l'argent revient, pas combien il en revient ensuite.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const d = deuxDemarches(c);
        const s = d.standardisation;
        const k = d.controle;
        const h = HORIZON_DU_GERANT_EN_ANNEES;
        return [
          {
            texte: `Le contrôle en ligne : sur ${h} ans, il rapporte le plus, ventes comprises`,
            juste: d.verdict === "controle-en-ligne",
            retour:
              d.verdict === "controle-en-ligne"
                ? `Oui : ${eur(k.gainNet)} net sur le plan, contre ${eur(s.gainNet)} pour la standardisation. Il coûte plus et se rembourse moins vite (${ans(d.delais.controle.ventes)} contre ${ans(d.delais.standardisation.ventes)}), mais tous deux se remboursent dans l'année, et le gérant décide sur ${h} ans : c'est ce que chaque démarche rapporte sur l'horizon qui tranche.`
                : `Non : sur ${h} ans, la standardisation rapporte plus (${eur(s.gainNet)} contre ${eur(k.gainNet)}).`,
          },
          {
            texte: "La standardisation : elle se rembourse plus vite que le contrôle",
            juste: d.verdict === "standardisation",
            retour:
              d.verdict === "standardisation"
                ? `Oui : sur ${h} ans, ${eur(s.gainNet)} contre ${eur(k.gainNet)}.`
                : `Non : c'est vrai (${ans(d.delais.standardisation.ventes)} contre ${ans(d.delais.controle.ventes)}), mais le délai ne dit pas ce qui vient après. Sur les ${h} ans du plan, le contrôle rapporte ${eur(d.avanceDuControle)} de plus.`,
          },
          {
            texte: "La standardisation : elle coûte bien moins cher à financer",
            juste: false,
            retour: `Non : ${eur(s.cout)} contre ${eur(k.cout)}, mais une démarche se juge sur ce qu'elle rapporte, pas sur ce qu'elle coûte seulement. Le contrôle rapporte ${eur(k.gain)} par an, la standardisation ${eur(s.gain)}.`,
          },
          {
            texte: "Aucune : le contrôle en ligne déplace les défauts sans en réduire le nombre",
            juste: d.verdict === "aucune",
            retour: `Non : il n'en réduit pas le nombre, mais il les fait payer à l'atelier (${eur(d.x.f.qualite.coutDUnDefautDetecte)}) plutôt que chez le client (${eur(d.x.f.qualite.coutDUnDefautLivre)}), et garde les ventes qu'un client déçu ferait perdre.`,
          },
        ];
      },
    },
  ],
};
