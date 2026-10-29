import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { masseSalariale } from "../chapitres/effectif-et-masse-salariale";
import { salaire } from "../chapitres/salaire-brut-net-cout";
import { anneeDeProduction, enceintesParOperateurEtParMois, margeUnitaire } from "../monde/capacite";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES, FICHE_RH } from "../monde/ressources-humaines-de-nova";
import type { Situation } from "./types";

/**
 * CAS PRATIQUE : EMBAUCHER POUR LA SAISON ? (Bac STMG, ressources humaines, palier 1).
 *
 * La direction de NOVA veut un opérateur de plus pour le trimestre de Noël de N + 1, payé comme ceux
 * de l'équipe. Avant de signer le contrat, elle demande ce qu'il coûtera, ce qu'il change à la masse
 * salariale et au taux de frais de personnel, et combien il faudra vendre en plus pour qu'il se paie.
 * L'élève rend ces chiffres, puis sa réponse ; la correction rappelle ce que la ligne peut monter.
 *
 * Aucun cours : les calculs sont ceux des chapitres « Du salaire brut au coût pour l'entreprise » et
 * « L'effectif et la masse salariale », appelés tels quels (`salaire`, `masseSalariale`), dans le
 * monde du cours. La marge d'une enceinte, la ligne et la demande de Noël sont celles de
 * nova-capacite.ts. Seule la durée du contrat est posée ci-dessous.
 *
 * CE QUI A CHANGÉ. Le cas lisait la paie et le mois de chaque entreprise de l'arène ; il se joue chez
 * NOVA : 7 987,50 € pour le contrat, 381 enceintes à vendre en plus, et une ligne déjà pleine à Noël.
 */

/** Le contrat de saison : le trimestre de Noël, trois mois de salaire (octobre, novembre, décembre). */
export const MOIS_DE_LA_SAISON = 3;
/** Le trimestre de la saison : le 4e, Noël. */
export const TRIMESTRE_DE_LA_SAISON = 4;
/** Les mois d'une année, pour l'erreur classique qui compte l'embauche sur l'année entière. */
const MOIS_PAR_AN = 12;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const taux = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auDessus = (x: number) => Math.ceil(x - 1e-9);

/** L'opérateur de la saison, ce qu'il coûte, et les ventes qui le paient. */
export function embaucheDeSaison(_c?: Cas) {
  const s = salaire();
  const m = masseSalariale();
  const f = FICHE_RH;
  const prix = f.enceinte.prix;
  const coutVariable = auCentime(f.enceinte.coutVariable.composants + f.enceinte.coutVariable.autres);
  const margeDUneUnite = margeUnitaire(f);
  const coutDeLaSaison = auCentime(s.cout * MOIS_DE_LA_SAISON);
  const masseAvec = auCentime(m.masse + coutDeLaSaison);
  const ventesNecessaires = auDessus(coutDeLaSaison / margeDUneUnite);
  const noel = anneeDeProduction(f, { annee: "N+1" }).trimestres[TRIMESTRE_DE_LA_SAISON - 1]!;
  return {
    s,
    m,
    prix,
    coutVariable,
    coutDeLaSaison,
    masseAvec,
    tauxAvec: auDixieme((masseAvec / m.ventes) * 100),
    margeDUneUnite,
    ventesNecessaires,
    caNecessaire: auCentime(ventesNecessaires * prix),
    noel,
    /** Ce que l'équipe monterait de plus à Noël avec l'opérateur de la saison, et ce que la ligne en laisse sortir. */
    equipeAvec: noel.capaciteEquipe + MOIS_DE_LA_SAISON * enceintesParOperateurEtParMois(f),
    enPlusANoel: Math.max(0, Math.min(noel.demande, noel.capaciteOutil) - noel.production),
    // Les erreurs classiques : le brut au lieu du coût, le prix au lieu de la marge, l'année au lieu de la saison.
    avecLeBrut: auDessus((s.brut * MOIS_DE_LA_SAISON) / margeDUneUnite),
    avecLePrix: auDessus(coutDeLaSaison / prix),
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
    "La direction veut un opérateur de plus pour le trimestre de Noël. Ce qu'il coûte, ce qu'il pèse dans la masse salariale, et ce qu'il faudra vendre pour qu'il se paie.",
  objectifs: [
    "Calculer le coût employeur d'un salarié à partir de son salaire brut",
    "Calculer la masse salariale et le taux de frais de personnel avec une embauche",
    "Calculer les ventes nécessaires pour qu'une embauche se paie",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend la paie et la masse salariale de NOVA, celles des chapitres, et l'atelier de son année N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `« Pour Noël, nos clients demanderont ${qte(r.noel.demande)} enceintes. Je pense embaucher un opérateur de plus pour les ${MOIS_DE_LA_SAISON} mois du trimestre, au salaire de l'équipe, ${eur(r.s.brut)} bruts par mois. Avant de signer le contrat, dites-moi ce qu'il nous coûtera vraiment, ce que cela change à notre masse salariale, et combien il faudra vendre en plus pour que l'embauche se paie. » La direction`,
          `L'équipe compte aujourd'hui ${qte(r.s.effectif)} opérateurs, et la masse salariale est celle du premier exercice. Pas de cours cette fois : les calculs sont ceux que vous connaissez.`,
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
            { libelle: "Prix d'une enceinte, hors taxes", valeurs: [eur(r.prix)] },
            { libelle: "Coût variable d'une enceinte", valeurs: [eur(r.coutVariable)] },
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
        "Calculez la marge d'une enceinte (prix moins coût variable), le nombre d'enceintes à vendre en plus dans le trimestre pour payer le contrat (arrondi à l'unité supérieure), et le chiffre d'affaires que ces ventes représentent.",
      champs: (c) => {
        const r = embaucheDeSaison(c);
        return [
          { libelle: "Marge d'une enceinte", attendu: r.margeDUneUnite, calcul: `${eur(r.prix)} − ${eur(r.coutVariable)} = ${eur(r.margeDUneUnite)}` },
          { libelle: "Enceintes à vendre en plus", attendu: r.ventesNecessaires, calcul: `${eur(r.coutDeLaSaison)} ÷ ${eur(r.margeDUneUnite)} = ${qte(r.ventesNecessaires)} (arrondi au-dessus)` },
          { libelle: "Chiffre d'affaires en plus", attendu: r.caNecessaire, calcul: `${qte(r.ventesNecessaires)} × ${eur(r.prix)} = ${eur(r.caNecessaire)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = embaucheDeSaison(c);
        return [
          `Chaque enceinte vendue en plus laisse ${eur(r.margeDUneUnite)} de marge : il en faut ${qte(r.ventesNecessaires)} pour payer les ${eur(r.coutDeLaSaison)} du contrat, soit ${eur(r.caNecessaire)} de chiffre d'affaires. C'est la marge qui paie le salaire, pas le chiffre d'affaires.`,
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
            retour: `Oui : ${eur(r.coutDeLaSaison)} de coût employeur, divisés par ${eur(r.margeDUneUnite)} de marge par enceinte. Encore faut-il pouvoir les monter : avec l'opérateur de plus, l'équipe monterait ${qte(r.equipeAvec)} enceintes à Noël, mais la ligne n'en monte que ${qte(r.noel.capaciteOutil)}. ${r.enPlusANoel > 0 ? `Elle en laisserait sortir ${qte(r.enPlusANoel)} de plus.` : "Elle est déjà pleine : la direction ferait mieux de ne pas signer."}`,
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
