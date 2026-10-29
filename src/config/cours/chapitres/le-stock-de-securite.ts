import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  DELAI_DU_FOURNISSEUR,
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  JOURS_DE_MONTAGE_PAR_TRIMESTRE,
  JOURS_DE_SECURITE,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  RETARD_REDOUTE,
  STOCK_DU_SOIR,
  ficheDeNova,
  kitsDuTrimestre,
  retardCouvert,
  securiteFaceAuRetard,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE STOCK DE SÉCURITÉ ET LE POINT DE COMMANDE (2de pro GATL, palier 1).
 *
 * Quand faut-il recommander ? Chez NOVA, chaque enceinte se monte avec un kit de composants acheté à
 * Électro-Composants Lyon. Au 1er trimestre de N + 1, la ligne monte 5 800 enceintes en 58 jours :
 * 100 kits par jour. Le fournisseur livre 6 jours après la commande ; NOVA garde 3 jours de stock de
 * sécurité. L'élève calcule la consommation par jour, la consommation pendant le délai, le stock de
 * sécurité, le point de commande (900 kits), dit s'il faut commander ce soir, puis ce que le stock de
 * sécurité immobilise.
 *
 * L'EXPÉRIENCE. Un curseur : le plus grand retard du fournisseur que le point de commande couvre
 * (3 jours). Un laboratoire : le stock de sécurité qui ne laisse perdre aucune enceinte quand le
 * fournisseur a 2 jours de retard, avec le moins d'argent immobilisé (2 jours).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/production-et-logistique.ts : les jours de montage,
 * le délai, le stock de sécurité, le stock du soir et le retard redouté sont ses hypothèses ; la
 * production du trimestre et le coût d'un kit viennent des fiches de NOVA). CE QUI A CHANGÉ : il se
 * jouait chez PIXEL & CO, sur une année de l'arène ; il se joue chez NOVA, sur ses composants.
 */

/** Les entreprises du chapitre : NOVA seule, qui garde un stock de kits de composants. */
export const ENTREPRISES_DU_STOCK_DE_SECURITE: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

export { JOURS_DE_SECURITE };

/** Les bornes du curseur (le retard du fournisseur, en jours) et du laboratoire (le stock de sécurité, en jours). */
const RETARD_DU_CURSEUR = { min: 0, max: 8 } as const;
const SECURITE_DU_LABORATOIRE = { min: 0, max: 6, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const jours = (n: number) => `${qte(n)} ${n >= 2 ? "jours" : "jour"}`;

const f = (c: Pick<Cas, "code">) => ficheDeNova(c);

/** Les kits du 1er trimestre de N + 1 : consommation, délai, sécurité, point de commande. */
export const stockEtPointDeCommande = (c: Pick<Cas, "code">) => kitsDuTrimestre(f(c), 1);

/** Le stock de sécurité du laboratoire : le plus petit qui ne laisse perdre aucune enceinte au retard redouté. */
export function securiteDuLaboratoire(c: Pick<Cas, "code">) {
  for (let s = SECURITE_DU_LABORATOIRE.min; s <= SECURITE_DU_LABORATOIRE.max; s++) if (securiteFaceAuRetard(f(c), s).perdues === 0) return s;
  return SECURITE_DU_LABORATOIRE.max;
}

function tableauDesKits(c: Cas): TableauDeDonnees {
  const k = stockEtPointDeCommande(c);
  return {
    titre: `Les kits de composants de ${c.entreprise}, le 1er trimestre de N + 1`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} à monter (un kit chacune)`, valeurs: [qte(k.montees)] },
      { libelle: "Jours de montage du trimestre", valeurs: [qte(JOURS_DE_MONTAGE_PAR_TRIMESTRE)] },
      { libelle: "Délai du fournisseur (jours de montage)", valeurs: [qte(DELAI_DU_FOURNISSEUR)] },
      { libelle: "Stock de sécurité voulu (jours de consommation)", valeurs: [qte(JOURS_DE_SECURITE)] },
      { libelle: "Coût d'un kit", valeurs: [eur(f(c).enceinte.coutVariable.composants)] },
    ],
  };
}

export const LE_STOCK_DE_SECURITE: Chapitre = {
  code: "le-stock-de-securite",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion"],
  titre: "Le stock de sécurité et le point de commande",
  accroche:
    "Quand faut-il recommander ? Assez tôt pour que la ligne ne s'arrête jamais, assez tard pour ne pas remplir le magasin d'argent qui dort. La consommation par jour, le délai du fournisseur, le stock de sécurité et le point de commande.",
  objectifs: [
    "Calculer une consommation par jour",
    "Calculer le stock de sécurité et le point de commande",
    "Dire s'il faut commander, en comparant le stock au point de commande",
    "Mesurer ce qu'un stock de sécurité immobilise, et ce qu'il évite",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_STOCK_DE_SECURITE, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Commander avant de manquer",
      notions: ["stock"],
      tableau: tableauDesKits,
      texte: (c) => [
        `Chaque ${c.unite} ${c.entreprise} se monte avec un kit de composants (haut-parleur, carte, batterie, coque), acheté à Électro-Composants Lyon. Sans kit, la ligne s'arrête.`,
        `Le fournisseur livre ${jours(DELAI_DU_FOURNISSEUR)} après la commande. Pendant ce délai, la ligne continue de consommer : il faut donc commander quand le stock suffit encore pour tout le délai, plus une réserve pour un retard. Cette réserve est le stock de sécurité.`,
        "Le stock à partir duquel il faut commander est le point de commande.",
      ],
      repere: () => "Point de commande = consommation par jour × délai du fournisseur + stock de sécurité.",
    },
    {
      id: "le-point-de-commande",
      objectifs: [0, 1],
      type: "montants",
      titre: "Le point de commande",
      notions: ["stock"],
      tableau: tableauDesKits,
      question: () => "Calculez la consommation par jour (au kit supérieur), la consommation pendant le délai du fournisseur, le stock de sécurité, puis le point de commande, en kits.",
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          { libelle: "Consommation par jour", attendu: k.parJour, calcul: `${qte(k.montees)} ÷ ${qte(JOURS_DE_MONTAGE_PAR_TRIMESTRE)} = ${qte(k.parJour)}`, tolerance: 0 },
          { libelle: "Consommation pendant le délai", attendu: k.pendantLeDelai, calcul: `${qte(k.parJour)} × ${qte(DELAI_DU_FOURNISSEUR)} = ${qte(k.pendantLeDelai)}`, tolerance: 0 },
          { libelle: "Stock de sécurité", attendu: k.securite, calcul: `${qte(k.parJour)} × ${qte(JOURS_DE_SECURITE)} = ${qte(k.securite)}`, tolerance: 0 },
          { libelle: "Point de commande", attendu: k.pointDeCommande, calcul: `${qte(k.pendantLeDelai)} + ${qte(k.securite)} = ${qte(k.pointDeCommande)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [`Dès que le stock descend à ${qte(k.pointDeCommande)} kits, le magasinier commande : les ${qte(k.pendantLeDelai)} premiers servent pendant le délai, les ${qte(k.securite)} autres attendent un retard.`];
      },
    },
    {
      id: "commander",
      objectifs: [2],
      type: "choix",
      titre: "Faut-il commander ce soir ?",
      notions: ["stock"],
      question: () => `Ce soir, le magasinier compte ${qte(STOCK_DU_SOIR)} kits en stock. Faut-il commander ?`,
      options: (c) => {
        const k = stockEtPointDeCommande(c);
        const sous = STOCK_DU_SOIR <= k.pointDeCommande;
        return [
          {
            texte: "Oui, dès ce soir",
            juste: sous,
            retour: sous
              ? `Oui : ${qte(STOCK_DU_SOIR)} kits, c'est moins que le point de commande (${qte(k.pointDeCommande)}). Le stock ne couvre plus le délai et la sécurité.`
              : `Non : le stock est au-dessus du point de commande (${qte(k.pointDeCommande)}).`,
          },
          {
            texte: "Non, il reste plus que le délai",
            juste: !sous,
            retour: !sous
              ? "Oui : le stock couvre encore le délai et la sécurité."
              : `Non : il reste de quoi tenir le délai (${qte(k.pendantLeDelai)} kits), mais plus toute la sécurité : en cas de retard, la ligne s'arrêterait.`,
          },
          { texte: "Non, il faut attendre que le stock soit vide", juste: false, retour: `Non : commandé à vide, le kit arriverait ${jours(DELAI_DU_FOURNISSEUR)} trop tard, et la ligne s'arrêterait tout ce temps.` },
        ];
      },
    },
    {
      id: "ce-qu-immobilise-la-securite",
      objectifs: [3],
      type: "montants",
      titre: "Ce que la sécurité immobilise",
      notions: ["stock"],
      question: (c) => `Le stock de sécurité ne sert qu'en cas de retard, mais il a été payé. Calculez ce qu'il immobilise (kits de sécurité × ${eur(f(c).enceinte.coutVariable.composants)}).`,
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [{ libelle: "Argent immobilisé par le stock de sécurité", attendu: k.immobilise, calcul: `${qte(k.securite)} × ${eur(f(c).enceinte.coutVariable.composants)} = ${eur(k.immobilise)}` }];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [`${eur(k.immobilise)} dorment dans le magasin, toute l'année : c'est le prix de la tranquillité. Chaque jour de sécurité en plus en immobilise ${eur(k.parJour * f(c).enceinte.coutVariable.composants)} de plus.`];
      },
    },
    {
      id: "le-retard-couvert",
      objectifs: [3],
      type: "curseur",
      titre: "Le retard que la sécurité couvre",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Le magasinier a commandé à ${qte(k.pointDeCommande)} kits. Faites varier le retard du fournisseur, en jours : une droite donne le stock de la commande, l'autre ce que la ligne consomme avant la livraison (${qte(k.parJour)} kits par jour, pendant le délai et le retard). Placez le curseur sur le plus grand retard que le stock couvre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Retard du fournisseur", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => {
        const k = stockEtPointDeCommande(c);
        return { attendu: retardCouvert(k.pointDeCommande, k.parJour), ...RETARD_DU_CURSEUR };
      },
      zones: ["La ligne tourne", "La ligne s'arrête"],
      rates: () => ({
        dessous: "Ce retard est couvert, mais un plus long aussi : cherchez le plus long.",
        dessus: "Avec ce retard, le stock s'épuise avant la livraison : la ligne s'arrête.",
      }),
      montrer: "Montrer le retard",
      lecture: (c, q) => {
        const k = stockEtPointDeCommande(c);
        return [
          { libelle: "Stock au moment de commander", montant: k.pointDeCommande },
          { libelle: "Consommé avant la livraison", montant: k.parJour * (DELAI_DU_FOURNISSEUR + q), fort: true },
          { libelle: "Stock à la livraison", montant: k.pointDeCommande - k.parJour * (DELAI_DU_FOURNISSEUR + q) },
        ];
      },
      droites: (c) => {
        const k = stockEtPointDeCommande(c);
        return { produit: () => k.pointDeCommande, cout: (q) => k.parJour * (DELAI_DU_FOURNISSEUR + q), libelles: ["Stock au moment de commander", "Consommé avant la livraison"] };
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        const r = retardCouvert(k.pointDeCommande, k.parJour);
        return [`Le stock couvre un retard de ${jours(r)} : ${qte(k.parJour)} × (${qte(DELAI_DU_FOURNISSEUR)} + ${qte(r)}) = ${qte(k.parJour * (DELAI_DU_FOURNISSEUR + r))}, le point de commande. C'est exactement le stock de sécurité, compté en jours.`];
      },
    },
    {
      id: "le-laboratoire-de-la-securite",
      objectifs: [1, 3],
      type: "simulation",
      titre: "Le laboratoire de la sécurité",
      notions: ["stock"],
      question: (c) =>
        `Le fournisseur a déjà livré avec ${jours(RETARD_REDOUTE)} de retard. Faites varier le stock de sécurité, en jours de consommation, en partant de celui de ${c.entreprise} (${jours(JOURS_DE_SECURITE)}). Le tableau donne le point de commande, les ${c.unites} que la ligne ne monterait pas pendant un retard de ${jours(RETARD_REDOUTE)}, et l'argent immobilisé. Relevez le défi.`,
      leviers: () => [{ code: "securite", libelle: "Stock de sécurité", unite: "jours", ...SECURITE_DU_LABORATOIRE, depart: JOURS_DE_SECURITE }],
      lecture: (c, p) => {
        const s = securiteFaceAuRetard(f(c), p.securite!);
        const d = securiteFaceAuRetard(f(c), JOURS_DE_SECURITE);
        return [
          { libelle: "Point de commande", montant: s.pointDeCommande, unite: "kits", reference: d.pointDeCommande },
          { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} non montées pendant le retard`, montant: s.perdues, unite: c.unites, reference: d.perdues },
          { libelle: "Marge perdue", montant: s.margePerdue, reference: d.margePerdue },
          { libelle: "Argent immobilisé par la sécurité", montant: s.immobilise, reference: d.immobilise, fort: true },
        ];
      },
      defi: (c) => {
        const juste = securiteDuLaboratoire(c);
        return {
          consigne: `Ne perdez aucune ${c.unite} pendant un retard de ${jours(RETARD_REDOUTE)}, en immobilisant le moins d'argent possible.`,
          atteint: (p) => p.securite === juste,
          indice: (p) => {
            const s = securiteFaceAuRetard(f(c), p.securite!);
            return s.perdues > 0
              ? `Avec ${jours(s.joursDeSecurite)} de sécurité, la ligne s'arrête et ${qte(s.perdues)} ${c.unites} ne sont pas montées.`
              : `Aucune ${c.unite} perdue, mais ${eur(s.immobilise)} immobilisés : un jour de moins suffirait-il ?`;
          },
          solution: { securite: juste },
        };
      },
      explication: (c, p) => {
        const s = securiteFaceAuRetard(f(c), p.securite!);
        return [
          `Défi relevé : ${jours(s.joursDeSecurite)} de sécurité couvrent un retard de ${jours(RETARD_REDOUTE)}, pour ${eur(s.immobilise)} immobilisés. En dessous, la ligne s'arrête ; au-dessus, l'argent dort sans rien éviter de plus.`,
          "Le stock de sécurité se règle sur le retard qu'on redoute, pas sur le délai normal du fournisseur.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock"],
      texte: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `Au 1er trimestre de N + 1, ${c.entreprise} consomme ${qte(k.parJour)} kits par jour ; avec un délai de ${jours(DELAI_DU_FOURNISSEUR)} et ${jours(JOURS_DE_SECURITE)} de sécurité, elle commande dès que son stock descend à ${qte(k.pointDeCommande)} kits.`,
          "Trop peu de stock, et la ligne s'arrête au premier retard ; trop de stock, et l'argent dort dans le magasin. Le point de commande dit quand commander, le stock de sécurité dit combien de retard on accepte de couvrir.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : comparez, à chaque tour, votre stock et la demande que vous prévoyez.",
        ];
      },
      repere: () => "Stock de sécurité = consommation par jour × jours de sécurité. Point de commande = consommation pendant le délai + stock de sécurité.",
    },
  ],
};
