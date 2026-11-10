import { aLUnite, arrondi2, eur, nombreAuCentieme, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_L_ORGANISATION_DE_LA_PRODUCTION, REPRISE, repriseDesEnceintes } from "../../monde/organisation-de-la-production";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER LA PRODUCTION » : REPRENDRE LES ENCEINTES USAGÉES ? (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre pensait le produit jusqu'à sa fin de vie ; le cas chiffre une reprise des enceintes
 * usagées. Hypothèses : monde/organisation-de-la-production.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les reprises qui paient la campagne sont une quantité : le
 * quotient à deux décimales, puis l'unité supérieure, que le corrigé nomme.
 */


/** Une quantité calculée : la valeur à deux décimales quand la division ne tombe pas juste, puis l'arrondi et sa raison. */
const aLUniteEcrite = (x: number, raison: string, arrondir: (x: number) => number = aLUnite) =>
  Number.isInteger(arrondi2(x)) ? qte(arrondir(x)) : `${nombreAuCentieme(x)}, soit ${qte(arrondir(x))} ${raison}`;

export const REPRENDRE_LES_ENCEINTES_USAGEES: Situation = {
  code: "reprendre-les-enceintes-usagees",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["organiser-la-production"],
  commanditaire: "Le président",
  titre: "Reprendre les enceintes usagées ?",
  accroche: "Un prestataire recycle les enceintes que les clients rapportent, et NOVA revend leurs composants. La reprise paie-t-elle sa campagne ?",
  objectifs: ["Chiffrer une démarche de fin de vie du produit", "Trouver le volume qui paie un coût fixe", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ORGANISATION_DE_LA_PRODUCTION, pourquoi: "le cas reprend les enceintes NOVA et leur fin de vie." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => [
        `« Le prestataire nous facture ${eur(REPRISE.recyclageParEnceinte)} par enceinte reprise, et nous revendons ses composants ${eur(REPRISE.composantsRevendus)}. Nous espérons ${qte(REPRISE.reprisesAttendues)} reprises la première année, et la campagne qui l'annonce coûte ${eur(REPRISE.campagne)}. La reprise vaut-elle la peine ? » Le président`,
        "Pas de cours cette fois : la démarche est celle du chapitre.",
      ],
      repere: () => "À rendre : ce que rapporte une reprise, les reprises qui paient la campagne, le gain de l'année et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que rapporte la reprise",
      question: () => "Calculez ce que rapporte une enceinte reprise, le nombre de reprises qui paie la campagne (à l'unité supérieure), puis le gain de l'année.",
      champs: () => {
        const r = repriseDesEnceintes();
        return [
          { libelle: "Ce que rapporte une reprise", attendu: r.parEnceinte, calcul: `${eur(REPRISE.composantsRevendus)} − ${eur(REPRISE.recyclageParEnceinte)} = ${eur(r.parEnceinte)}` },
          { libelle: "Reprises qui paient la campagne", nature: "quantite", attendu: r.pourPayerLaCampagne, calcul: `${eur(REPRISE.campagne)} ÷ ${eur(r.parEnceinte)} = ${aLUniteEcrite(REPRISE.campagne / r.parEnceinte, "à l'unité supérieure : une de moins ne paierait pas la campagne", (y) => Math.ceil(y - 1e-9))}` },
          { libelle: "Gain de l'année", attendu: r.gain, calcul: `${qte(r.reprises)} × ${eur(r.parEnceinte)} − ${eur(REPRISE.campagne)} = ${eur(r.gain)}` },
        ];
      },
      explication: () => {
        const r = repriseDesEnceintes();
        return [`À ${qte(r.reprises)} reprises, la démarche laisse ${eur(r.gain)} : elle paie sa campagne dès ${qte(r.pourPayerLaCampagne)} reprises.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const r = repriseDesEnceintes();
        return [
          {
            texte: `La lancer : elle paie sa campagne et rapporte ${eur(r.gain)}`,
            juste: true,
            retour: `Oui : au-delà de ${qte(r.pourPayerLaCampagne)} reprises, chaque enceinte rapportée laisse ${eur(r.parEnceinte)}. La reprise répond aussi aux attentes de recyclage des clients, et les fait revenir.`,
          },
          {
            texte: "La refuser : recycler un produit en fin de vie ne rapporte jamais rien à l'entreprise",
            juste: false,
            retour: "Non : les composants récupérés se revendent plus cher que le recyclage ne coûte.",
          },
          {
            texte: `La lancer sans campagne, pour garder les ${eur(REPRISE.campagne)} et autant de reprises`,
            juste: false,
            retour: "Non : sans campagne, les clients ne sauront pas qu'ils peuvent rapporter leurs enceintes ; les reprises attendues supposent de l'annoncer.",
          },
        ];
      },
    },
  ],
};
