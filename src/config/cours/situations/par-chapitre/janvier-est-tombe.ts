import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_CORRELATION } from "../../chapitres/correlation-et-lissage";
import { ALPHA_A_LA_MAIN, JANVIER_N_PLUS_1_AUX_PARTICULIERS, VENTES_LISSEES, lissage, meilleurAlpha, previsionDeFevrier } from "../../monde/correlation-et-lissage";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRÉVOIR LES VENTES : CORRÉLATION ET LISSAGE » : JANVIER EST TOMBÉ
 * (contrôle de gestion, palier 4).
 *
 * Le transporteur des colis de NOVA réserve ses enlèvements de février : il demande combien
 * d'enceintes partiront en ligne aux particuliers. Janvier N + 1 vient de tomber, 1 400 ventes
 * (HYPOTHÈSE DU CAS, monde/correlation-et-lissage.ts, JANVIER_N_PLUS_1_AUX_PARTICULIERS), bien sous
 * la prévision lissée. L'élève poursuit le lissage d'un mois, sans cours : l'erreur de janvier, la
 * prévision de février avec la constante retenue au chapitre, puis avec une constante plus prudente,
 * et rend un nombre au transporteur.
 */

const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres du cas : le lissage au meilleur α, et le même avec l'α prudent du lissage à la main. */
export function janvierEstTombe(_c?: Pick<Cas, "code">) {
  const alpha = meilleurAlpha();
  const retenu = previsionDeFevrier(alpha);
  const prudent = previsionDeFevrier(ALPHA_A_LA_MAIN);
  return { alpha, retenu, prudent, sommes: { retenu: lissage(alpha).sommeDesCarres, prudent: lissage(ALPHA_A_LA_MAIN).sommeDesCarres } };
}

export const JANVIER_EST_TOMBE: Situation = {
  code: "janvier-est-tombe",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["correlation-et-lissage"],
  commanditaire: "Le transporteur des colis",
  titre: "Janvier est tombé",
  accroche: "Janvier N + 1 a vendu bien moins que la prévision lissée. Combien de colis le transporteur doit-il prévoir pour février ?",
  objectifs: ["Mesurer l'erreur d'une prévision lissée", "Poursuivre un lissage exponentiel d'un mois", "Comparer deux constantes de lissage", "Rendre une prévision justifiée"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CORRELATION,
    pourquoi: "ce cas reprend le chapitre « Prévoir les ventes : corrélation et lissage », qui se calcule sur les ventes en ligne de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du transporteur",
      texte: () => {
        const x = janvierEstTombe();
        return [
          "« Nous réservons nos camions de février cette semaine. Combien de colis d'enceintes partiront chez vos clients en ligne ? Un enlèvement réservé et vide vous sera facturé. »",
          `Le lissage de N, avec α = ${qte(x.alpha)}, prévoyait ${qte(auCentieme(x.retenu.janvierPrevu))} ventes pour janvier N + 1. Janvier en a fait ${qte(JANVIER_N_PLUS_1_AUX_PARTICULIERS)}. Pas de cours cette fois : vous avez la règle du lissage.`,
        ];
      },
      tableau: () => {
        const x = janvierEstTombe();
        return {
          titre: "Ce que NOVA sait de ses ventes en ligne",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Ventes de décembre N", valeurs: [qte(VENTES_LISSEES.at(-1)!)] },
            { libelle: `Prévision de janvier N + 1, α = ${qte(x.alpha)}`, valeurs: [qte(auCentieme(x.retenu.janvierPrevu))] },
            { libelle: `Prévision de janvier N + 1, α = ${qte(ALPHA_A_LA_MAIN)}`, valeurs: [qte(auCentieme(x.prudent.janvierPrevu))] },
            { libelle: "Ventes de janvier N + 1", valeurs: [qte(JANVIER_N_PLUS_1_AUX_PARTICULIERS)] },
          ],
        };
      },
      repere: () => "À rendre : l'erreur de janvier, la prévision de février avec chaque constante, et le nombre de colis à réserver.",
    },
    {
      id: "fevrier-au-alpha-retenu",
      type: "montants",
      titre: "Février, avec la constante retenue",
      notions: ["seasonality"],
      question: () => {
        const x = janvierEstTombe();
        return `Avec α = ${qte(x.alpha)}, calculez l'erreur de janvier N + 1 (la vente moins la prévision), puis la prévision de février, au centième.`;
      },
      champs: () => {
        const { retenu: r, alpha } = janvierEstTombe();
        return [
          { libelle: "Erreur de janvier", attendu: auCentieme(r.erreur), tolerance: 0.02, calcul: `${qte(r.janvier)} − ${qte(auCentieme(r.janvierPrevu))} = ${qte(auCentieme(r.erreur))}` },
          { libelle: "Prévision de février", attendu: auCentieme(r.fevrier), tolerance: 0.02, calcul: `${qte(alpha)} × ${qte(r.janvier)} + ${qte(auCentieme(1 - alpha))} × ${qte(auCentieme(r.janvierPrevu))} = ${qte(auCentieme(r.fevrier))}` },
        ];
      },
      explication: () => {
        const { retenu: r, alpha } = janvierEstTombe();
        return [`La prévision descend de ${qte(auCentieme(r.janvierPrevu))} à ${qte(auCentieme(r.fevrier))} : elle rattrape ${qte(alpha * 100)} % de l'erreur de janvier, comme le veut α.`];
      },
    },
    {
      id: "fevrier-au-alpha-prudent",
      type: "montants",
      titre: "Février, avec une constante prudente",
      notions: ["seasonality"],
      question: () => `Le magasinier préfère α = ${qte(ALPHA_A_LA_MAIN)}, qui « bouge moins ». Avec cette constante, calculez l'erreur de janvier, puis la prévision de février, au centième.`,
      champs: () => {
        const { prudent: r } = janvierEstTombe();
        return [
          { libelle: "Erreur de janvier", attendu: auCentieme(r.erreur), tolerance: 0.02, calcul: `${qte(r.janvier)} − ${qte(auCentieme(r.janvierPrevu))} = ${qte(auCentieme(r.erreur))}` },
          { libelle: "Prévision de février", attendu: auCentieme(r.fevrier), tolerance: 0.02, calcul: `${qte(ALPHA_A_LA_MAIN)} × ${qte(r.janvier)} + ${qte(auCentieme(1 - ALPHA_A_LA_MAIN))} × ${qte(auCentieme(r.janvierPrevu))} = ${qte(auCentieme(r.fevrier))}` },
        ];
      },
      explication: () => {
        const x = janvierEstTombe();
        return [
          `Avec α = ${qte(ALPHA_A_LA_MAIN)}, février est prévu à ${qte(auCentieme(x.prudent.fevrier))}, plus haut. Sur N, cette constante a fait des erreurs plus fortes : ${qte(Math.round(x.sommes.prudent))} de somme des carrés, contre ${qte(Math.round(x.sommes.retenu))}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au transporteur",
      notions: ["seasonality"],
      question: () => "Combien de colis NOVA annonce-t-elle au transporteur pour février ?",
      options: () => {
        const x = janvierEstTombe();
        const n = (v: number) => qte(Math.round(v));
        return [
          { texte: `${n(x.retenu.fevrier)} colis, le lissage à α = ${qte(x.alpha)}`, juste: true, retour: `Oui. La constante retenue sur N est celle qui s'y est le moins trompée ; elle a déjà corrigé ${qte(x.alpha * 100)} % de la mauvaise surprise de janvier. Un enlèvement de trop se paie : ni l'élan de Noël, ni la prudence d'un petit α ne servent ici.` },
          { texte: `${n(x.prudent.fevrier)} colis, le lissage plus prudent à α = ${qte(ALPHA_A_LA_MAIN)}`, juste: false, retour: "Non : ce α s'est plus trompé sur N, et il traîne encore le niveau de Noël. Un enlèvement réservé et vide se paie." },
          { texte: `${n(x.retenu.janvierPrevu)} colis, la prévision de janvier, qui tenait compte de Noël`, juste: false, retour: "Non : c'est la prévision que janvier vient de démentir. Le lissage la corrige d'un mois à l'autre." },
          { texte: `${n(JANVIER_N_PLUS_1_AUX_PARTICULIERS)} colis, autant qu'en janvier N + 1`, juste: false, retour: `Non : c'est un lissage à α = 1, qui recopie le dernier mois. Sur N, plus α montait au-delà de ${qte(x.alpha)}, plus les erreurs grandissaient.` },
        ];
      },
    },
  ],
};
