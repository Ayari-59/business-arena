import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { masseSalariale } from "../chapitres/effectif-et-masse-salariale";
import { salaire } from "../chapitres/salaire-brut-net-cout";
import type { Situation } from "./types";

/**
 * CAS PRATIQUE : EMBAUCHER POUR LA SAISON ? (Bac STMG, ressources humaines, palier 1).
 *
 * La direction veut un salarié de plus pour un trimestre chargé, payé comme ceux de
 * l'équipe. Avant de signer le contrat, elle demande ce qu'il coûtera, ce qu'il change à
 * la masse salariale et au taux de frais de personnel, et combien il faudra vendre en plus
 * pour qu'il se paie. L'élève rend ces chiffres, puis sa réponse.
 *
 * Aucun cours : les calculs sont ceux des chapitres « Du salaire brut au coût pour
 * l'entreprise » et « L'effectif et la masse salariale », appelés tels quels (`salaire`,
 * `masseSalariale`). Le prix et le coût variable d'une unité sont ceux du mois du cas.
 * Seule la durée du contrat est posée ci-dessous.
 */

/** Le contrat de saison : un trimestre, trois mois de salaire. */
export const MOIS_DE_LA_SAISON = 3;
/** Les mois d'une année, pour l'erreur classique qui compte l'embauche sur l'année entière. */
const MOIS_PAR_AN = 12;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const taux = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auDessus = (x: number) => Math.ceil(x - 1e-9);

/** Le salarié de la saison, ce qu'il coûte, et les ventes qui le paient. */
export function embaucheDeSaison(c: Cas) {
  const s = salaire(c);
  const m = masseSalariale(c);
  const g = c.gestion;
  const coutDeLaSaison = auCentime(s.cout * MOIS_DE_LA_SAISON);
  const masseAvec = auCentime(m.masse + coutDeLaSaison);
  const margeDUneUnite = auCentime(g.prixMoyen - g.coutVariableUnitaire);
  const ventesNecessaires = auDessus(coutDeLaSaison / margeDUneUnite);
  return {
    s,
    m,
    prix: g.prixMoyen,
    coutVariable: g.coutVariableUnitaire,
    coutDeLaSaison,
    masseAvec,
    tauxAvec: auDixieme((masseAvec / m.ventes) * 100),
    margeDUneUnite,
    ventesNecessaires,
    caNecessaire: auCentime(ventesNecessaires * g.prixMoyen),
    // Les erreurs classiques : le brut au lieu du coût, le prix au lieu de la marge, l'année au lieu de la saison.
    avecLeBrut: auDessus((s.brut * MOIS_DE_LA_SAISON) / margeDUneUnite),
    avecLePrix: auDessus(coutDeLaSaison / g.prixMoyen),
    surLAnnee: auDessus((s.cout * MOIS_PAR_AN) / margeDUneUnite),
  };
}

export const EMBAUCHER_POUR_LA_SAISON: Situation = {
  code: "embaucher-pour-la-saison",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["effectif-et-masse-salariale", "salaire-brut-net-cout"],
  commanditaire: "La direction",
  titre: "Embaucher pour la saison ?",
  accroche:
    "La direction veut un salarié de plus pour un trimestre chargé. Ce qu'il coûte, ce qu'il pèse dans la masse salariale, et ce qu'il faudra vendre pour qu'il se paie.",
  objectifs: [
    "Calculer le coût employeur d'un salarié à partir de son salaire brut",
    "Calculer la masse salariale et le taux de frais de personnel avec une embauche",
    "Calculer les ventes nécessaires pour qu'une embauche se paie",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `« Le prochain trimestre s'annonce chargé : je pense embaucher une personne de plus pour ${MOIS_DE_LA_SAISON} mois, au salaire de l'équipe, ${eur(r.s.brut)} brut par mois. Avant de signer le contrat, dites-moi ce qu'elle nous coûtera vraiment, ce que cela change à notre masse salariale, et combien il faudra vendre en plus pour que l'embauche se paie. » La direction`,
          `L'équipe compte aujourd'hui ${qte(r.s.effectif)} salariés. Pas de cours cette fois : les calculs sont ceux que vous connaissez.`,
        ];
      },
      tableau: (c) => {
        const r = embaucheDeSaison(c);
        return {
          titre: `Le personnel et les ventes · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Salaire brut mensuel de la personne embauchée", valeurs: [eur(r.s.brut)] },
            { libelle: "Taux des cotisations patronales", valeurs: [taux(r.s.tauxPatronal)] },
            { libelle: "Durée du contrat", valeurs: [`${MOIS_DE_LA_SAISON} mois`] },
            { libelle: "Masse salariale de l'année, sans l'embauche", valeurs: [eur(r.m.masse)] },
            { libelle: "Ventes de l'année", valeurs: [eur(r.m.ventes)] },
            { libelle: `Prix de vente moyen d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.coutVariable)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût employeur de la personne embauchée, la masse salariale et le taux de frais de personnel avec l'embauche, les ventes nécessaires, et votre réponse.",
    },
    {
      id: "cout-employeur",
      type: "montants",
      titre: "Ce que coûte la personne embauchée",
      notions: ["payroll"],
      question: () =>
        `Calculez les cotisations patronales d'un mois, le coût employeur d'un mois (brut et cotisations patronales), puis le coût des ${MOIS_DE_LA_SAISON} mois du contrat.`,
      champs: (c) => {
        const r = embaucheDeSaison(c);
        return [
          { libelle: "Cotisations patronales d'un mois", attendu: r.s.patronales, calcul: `${eur(r.s.brut)} × ${taux(r.s.tauxPatronal)} = ${eur(r.s.patronales)}` },
          { libelle: "Coût employeur d'un mois", attendu: r.s.cout, calcul: `${eur(r.s.brut)} + ${eur(r.s.patronales)} = ${eur(r.s.cout)}` },
          { libelle: "Coût du contrat de saison", attendu: r.coutDeLaSaison, calcul: `${eur(r.s.cout)} × ${MOIS_DE_LA_SAISON} = ${eur(r.coutDeLaSaison)}` },
        ];
      },
      explication: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `Pour ${eur(r.s.brut)} de brut, l'entreprise paie ${eur(r.s.cout)} par mois : les cotisations patronales s'ajoutent au brut. C'est ce coût, pas le brut, qui pèse sur le résultat.`,
        ];
      },
    },
    {
      id: "masse-salariale",
      type: "montants",
      titre: "La masse salariale avec l'embauche",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        "Calculez la masse salariale de l'année avec l'embauche, puis le taux de frais de personnel (masse salariale ÷ ventes × 100, au dixième) sans l'embauche et avec, à ventes inchangées.",
      champs: (c) => {
        const r = embaucheDeSaison(c);
        return [
          { libelle: "Masse salariale avec l'embauche", attendu: r.masseAvec, calcul: `${eur(r.m.masse)} + ${eur(r.coutDeLaSaison)} = ${eur(r.masseAvec)}` },
          { libelle: "Taux de frais de personnel sans l'embauche (%)", attendu: r.m.tauxDeFraisDePersonnel, calcul: `${eur(r.m.masse)} ÷ ${eur(r.m.ventes)} × 100 = ${pct(r.m.tauxDeFraisDePersonnel)}`, tolerance: 0.1 },
          { libelle: "Taux de frais de personnel avec l'embauche (%)", attendu: r.tauxAvec, calcul: `${eur(r.masseAvec)} ÷ ${eur(r.m.ventes)} × 100 = ${pct(r.tauxAvec)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `Si les ventes ne bougent pas, le taux de frais de personnel passe de ${pct(r.m.tauxDeFraisDePersonnel)} à ${pct(r.tauxAvec)} : le salaire se paie que les clients viennent ou non. Une embauche se juge donc aux ventes qu'elle permet.`,
        ];
      },
    },
    {
      id: "ventes-necessaires",
      type: "montants",
      titre: "Les ventes qui paient l'embauche",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        "Calculez la marge d'une unité (prix moins coût variable), le nombre d'unités à vendre en plus dans le trimestre pour payer le contrat (arrondi à l'unité supérieure), et le chiffre d'affaires que ces ventes représentent.",
      champs: (c) => {
        const r = embaucheDeSaison(c);
        return [
          { libelle: "Marge d'une unité", attendu: r.margeDUneUnite, calcul: `${eur(r.prix)} − ${eur(r.coutVariable)} = ${eur(r.margeDUneUnite)}` },
          { libelle: "Unités à vendre en plus", attendu: r.ventesNecessaires, calcul: `${eur(r.coutDeLaSaison)} ÷ ${eur(r.margeDUneUnite)} = ${qte(r.ventesNecessaires)} (arrondi au-dessus)` },
          { libelle: "Chiffre d'affaires en plus", attendu: r.caNecessaire, calcul: `${qte(r.ventesNecessaires)} × ${eur(r.prix)} = ${eur(r.caNecessaire)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `Chaque ${c.unite} ${accord(c, "vendu")} en plus laisse ${eur(r.margeDUneUnite)} de marge : il en faut ${qte(r.ventesNecessaires)} pour payer les ${eur(r.coutDeLaSaison)} du contrat, soit ${eur(r.caNecessaire)} de chiffre d'affaires. C'est la marge qui paie le salaire, pas le chiffre d'affaires.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Que répondez-vous à la direction ?",
      options: (c) => {
        const r = embaucheDeSaison(c);
        const phrase = (n: number) => `Elle se paie si nous vendons ${qte(n)} ${c.unites} de plus dans le trimestre`;
        // Les quatre nombres dans l'ordre croissant, comme on les lirait sur une copie.
        const options = [
          {
            texte: phrase(r.ventesNecessaires),
            n: r.ventesNecessaires,
            juste: true,
            retour: `Oui : ${eur(r.coutDeLaSaison)} de coût employeur, divisés par ${eur(r.margeDUneUnite)} de marge par ${c.unite}.`,
          },
          {
            texte: phrase(r.avecLeBrut),
            n: r.avecLeBrut,
            juste: false,
            retour: `Non : ce nombre paie le brut, pas les cotisations patronales. Le contrat coûte ${eur(r.coutDeLaSaison)}, il faut ${qte(r.ventesNecessaires)} ${c.unites}.`,
          },
          {
            texte: phrase(r.avecLePrix),
            n: r.avecLePrix,
            juste: false,
            retour: `Non : ce nombre divise le coût par le prix. Mais sur chaque vente, le coût variable est déjà dépensé : seule la marge, ${eur(r.margeDUneUnite)}, paie le salaire.`,
          },
          {
            texte: phrase(r.surLAnnee),
            juste: false,
            retour: `Non : ce nombre paierait un an de salaire. Le contrat ne dure que ${MOIS_DE_LA_SAISON} mois : ${qte(r.ventesNecessaires)} ${c.unites} suffisent.`,
            n: r.surLAnnee,
          },
        ];
        return options.sort((x, y) => x.n - y.n).map(({ n: _n, ...o }) => o);
      },
    },
  ],
};
