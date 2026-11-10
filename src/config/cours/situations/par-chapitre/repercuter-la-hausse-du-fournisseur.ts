import { aLUnite, arrondi2, arrondi2 as auCentime, eur, nombreAuCentieme, pct, produit2, qte } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { DEMANDE_ET_PRIX, demandeEtPrix } from "../../chapitres/demande-et-prix";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique. */

/** « que » devant un nom, élidé devant une voyelle : qu'ATLAS CONSEIL. */
const que = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈÊ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « LA DEMANDE RÉPOND AU PRIX » : RÉPERCUTER LA HAUSSE DU
 * FOURNISSEUR ? (Bac STMG, mercatique, palier 1).
 *
 * Un fournisseur augmente ses tarifs. Pour la répercuter, la direction envisage une hausse
 * de prix plus petite que celle du chapitre, et demande ce qu'elle ferait à la
 * demande et au chiffre d'affaires. L'élève calcule l'élasticité sur le premier trimestre de NOVA,
 * comme au chapitre, puis s'en sert pour prévoir : le nouveau prix, la variation de la
 * demande, la demande et le chiffre d'affaires attendus, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre mesure l'élasticité sur une hausse de prix
 * jouée, le cas l'utilise pour prévoir l'effet d'une autre hausse, qui n'a pas été jouée.
 * La demande aux deux prix est celle du chapitre (`demandeEtPrix`).
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les variations se donnent à deux décimales (au dixième, avant),
 * l'élasticité au centième ; la demande attendue, à deux décimales puis arrondie à l'unité, et le
 * chiffre d'affaires se calcule sur cette demande arrondie, au centime. Les tolérances (quelques
 * enceintes, 311 € de chiffre d'affaires) couvraient l'arrondi au dixième : elles tombent à un
 * centième.
 */

/**
 * La hausse de prix envisagée : 5 %, de quoi répercuter une hausse des tarifs d'un
 * fournisseur sans aller jusqu'aux 10 % du chapitre. L'élasticité mesurée sur
 * 10 % sert à prévoir l'effet de ces 5 %.
 */
export const HAUSSE_DE_PRIX_ENVISAGEE = 0.05;


/** Les chiffres de la réponse, calculés une fois du cas. */
export function hausseDuFournisseur(c: Cas) {
  const d = demandeEtPrix(c);
  const hausse = HAUSSE_DE_PRIX_ENVISAGEE * 100;
  const nouveauPrix = auCentime(d.base.prix * (1 + HAUSSE_DE_PRIX_ENVISAGEE));
  // La variation prévue de la demande : l'élasticité multipliée par la variation du prix.
  const variationDemande = arrondi2(d.elasticite * hausse);
  // Chaque ligne arrondie : la demande à deux décimales, puis à l'unité (des enceintes), et le chiffre
  // d'affaires sur cette demande arrondie, au centime.
  const demandeCalculee = produit2(d.base.demande, 1 + variationDemande / 100);
  const demandePrevue = aLUnite(demandeCalculee);
  const caPrevu = produit2(demandePrevue, nouveauPrix);
  return {
    d,
    hausse,
    nouveauPrix,
    variationDemande,
    demandeCalculee,
    demandePrevue,
    caAvant: d.caAvant,
    caPrevu,
    variationCa: arrondi2((caPrevu / d.caAvant - 1) * 100),
    // L'erreur classique : diviser la variation du prix par l'élasticité, au lieu de multiplier.
    variationDivisee: arrondi2(hausse / Math.abs(d.elasticite)),
  };
}

export const REPERCUTER_LA_HAUSSE_DU_FOURNISSEUR: Situation = {
  code: "repercuter-la-hausse-du-fournisseur",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["demande-et-prix"],
  commanditaire: "La direction",
  titre: "Répercuter la hausse du fournisseur ?",
  accroche:
    "Un fournisseur augmente ses tarifs, et la direction envisage de monter ses prix de 5 %. Ce que l'élasticité permet de prévoir : la demande et le chiffre d'affaires après la hausse.",
  objectifs: [
    "Calculer l'élasticité de la demande au prix",
    "Prévoir la variation de la demande avec l'élasticité",
    "Calculer la demande et le chiffre d'affaires attendus après une hausse de prix",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: DEMANDE_ET_PRIX.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          `« Nos fournisseurs augmentent leurs tarifs. Pour le répercuter, je pense monter nos prix de ${pct(r.hausse)}. Nous connaissons la demande de notre premier trimestre avec ${pct(r.d.ecart)} de hausse, pas avec ${pct(r.hausse)}. Servez-vous de ce trimestre pour me dire ce ${que(c.entreprise)} perdrait de clients, et ce que deviendrait notre chiffre d'affaires. »`,
          "Pas de cours cette fois : vous avez la demande aux deux prix, et la méthode est celle du chapitre. À vous de l'enchaîner, puis de vous en servir pour prévoir.",
        ];
      },
      tableau: (c) => {
        const r = hausseDuFournisseur(c);
        return {
          titre: `Le premier trimestre, à deux prix · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix pratiqué", valeurs: [eur(r.d.base.prix)] },
            { libelle: `Demande au prix pratiqué (${c.unites})`, valeurs: [qte(r.d.base.demande)] },
            { libelle: `Prix ${qte(r.d.ecart)} % plus cher`, valeurs: [eur(r.d.haut.prix)] },
            { libelle: `Demande au prix plus cher (${c.unites})`, valeurs: [qte(r.d.haut.demande)] },
            { libelle: "Hausse de prix envisagée", valeurs: [pct(r.hausse)] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'élasticité de la demande au prix, le nouveau prix, la variation et le niveau de la demande attendus, le chiffre d'affaires attendu, et votre réponse.",
    },
    {
      id: "elasticite",
      type: "montants",
      titre: "L'élasticité de la demande",
      notions: ["price_elasticity"],
      question: () =>
        "Du prix pratiqué au prix plus cher, calculez la variation de la demande, en pourcentage à deux décimales, puis l'élasticité de la demande au prix, au centième.",
      champs: (c) => {
        const { d } = hausseDuFournisseur(c);
        return [
          { libelle: "Variation de la demande (%)", attendu: d.variationDemande, calcul: `(${qte(d.haut.demande)} ÷ ${qte(d.base.demande)} − 1) × 100 = ${pct(d.variationDemande)}` },
          { libelle: "Élasticité de la demande au prix", nature: "grandeur", attendu: d.elasticite, calcul: `${pct(d.variationDemande)} ÷ ${pct(d.variationPrix)} = ${nombreAuCentieme(d.elasticite)}` },
        ];
      },
      explication: (c) => {
        const { d } = hausseDuFournisseur(c);
        return [
          `L'élasticité vaut ${nombreAuCentieme(d.elasticite)} : pour 1 % de hausse de prix, la demande adressée à ${c.entreprise} baisse d'environ ${qte(Math.abs(d.elasticite))} %. C'est ce coefficient qui permet de prévoir l'effet d'une hausse qui n'a pas été jouée.`,
        ];
      },
    },
    {
      id: "demande-prevue",
      type: "montants",
      titre: "La demande au nouveau prix",
      notions: ["price_elasticity"],
      question: (c) => {
        const r = hausseDuFournisseur(c);
        return `Avec une hausse de ${pct(r.hausse)}, calculez le nouveau prix, la variation de la demande attendue (élasticité × variation du prix, en pourcentage au centième), puis la demande attendue, à l'unité.`;
      },
      champs: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          { libelle: "Nouveau prix", attendu: r.nouveauPrix, calcul: `${eur(r.d.base.prix)} × (1 + ${pct(r.hausse)}) = ${eur(r.nouveauPrix)}` },
          { libelle: "Variation de la demande attendue (%)", attendu: r.variationDemande, calcul: `${nombreAuCentieme(r.d.elasticite)} × ${qte(r.hausse)} = ${pct(r.variationDemande)}` },
          {
            libelle: `Demande attendue (${c.unites})`,
            nature: "quantite",
            attendu: r.demandePrevue,
            calcul: `${qte(r.d.base.demande)} × (1 ${r.variationDemande < 0 ? "−" : "+"} ${pct(Math.abs(r.variationDemande))}) = ${nombreAuCentieme(r.demandeCalculee)}, arrondi à l'unité : ${qte(r.demandePrevue)}`,
          },
        ];
      },
      explication: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          `Le prix monte de ${pct(r.hausse)}, la demande baisserait de ${pct(Math.abs(r.variationDemande))} : ${qte(r.d.base.demande - r.demandePrevue)} ${c.unites} de moins sur le trimestre. C'est une prévision : l'élasticité mesurée sur ${pct(r.d.ecart)} de hausse donne un ordre de grandeur pour une hausse voisine.`,
        ];
      },
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "Le chiffre d'affaires attendu",
      notions: ["price_elasticity", "revenue"],
      question: () =>
        "Si l'entreprise servait toute la demande, quel chiffre d'affaires ferait-elle au prix pratiqué, puis au nouveau prix avec la demande attendue ? Calculez-les au centime, puis la variation, en pourcentage à deux décimales.",
      champs: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          { libelle: "Chiffre d'affaires au prix pratiqué", attendu: r.caAvant, calcul: `${qte(r.d.base.demande)} × ${eur(r.d.base.prix)} = ${eur(r.caAvant)}` },
          { libelle: "Chiffre d'affaires attendu au nouveau prix", attendu: r.caPrevu, calcul: `${qte(r.demandePrevue)} × ${eur(r.nouveauPrix)} = ${eur(r.caPrevu)}` },
          { libelle: "Variation du chiffre d'affaires (%)", attendu: r.variationCa, calcul: `(${eur(r.caPrevu)} ÷ ${eur(r.caAvant)} − 1) × 100 = ${pct(r.variationCa)}` },
        ];
      },
      explication: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          r.d.elastique
            ? `La demande est élastique : elle baisse plus vite que le prix ne monte, et le chiffre d'affaires ${r.variationCa < 0 ? `recule de ${pct(Math.abs(r.variationCa))}` : "ne progresse presque pas"}. Répercuter la hausse du fournisseur coûterait des clients à ${c.entreprise}.`
            : `La demande est peu élastique : elle baisse moins vite que le prix ne monte, et le chiffre d'affaires ${r.variationCa > 0 ? `progresse de ${pct(r.variationCa)}` : "tient à peu près"}. Les clients de ${c.entreprise} acceptent la hausse, ou presque.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = hausseDuFournisseur(c);
        return [
          {
            texte:
              r.variationCa < 0
                ? `La hausse ferait perdre ${pct(Math.abs(r.variationCa))} de chiffre d'affaires`
                : `La hausse ferait gagner ${pct(r.variationCa)} de chiffre d'affaires`,
            juste: true,
            retour: `Oui : avec une élasticité de ${nombreAuCentieme(r.d.elasticite)}, ${pct(r.hausse)} de hausse font ${pct(Math.abs(r.variationDemande))} de demande en moins, soit ${qte(r.demandePrevue)} ${c.unites} à ${eur(r.nouveauPrix)} : ${eur(r.caPrevu)} contre ${eur(r.caAvant)} aujourd'hui.`,
          },
          {
            texte: `Le chiffre d'affaires monterait de ${pct(r.hausse)}, comme le prix`,
            juste: false,
            retour: `Non : ce serait vrai si la demande ne bougeait pas. Elle baisse de ${pct(Math.abs(r.variationDemande))}, et le chiffre d'affaires varie de ${pct(r.variationCa)}.`,
          },
          {
            texte: `La demande baisserait de ${pct(r.variationDivisee)}, la hausse divisée par l'élasticité`,
            juste: false,
            retour: `Non : l'élasticité se multiplie par la variation du prix, elle ne la divise pas. ${nombreAuCentieme(r.d.elasticite)} × ${qte(r.hausse)} donne ${pct(r.variationDemande)} de demande.`,
          },
        ];
      },
    },
  ],
};
