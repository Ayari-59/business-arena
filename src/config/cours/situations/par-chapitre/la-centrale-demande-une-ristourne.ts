import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_REFERENCEMENT, referencement } from "../../chapitres/se-faire-referencer";
import { LINEAIRE_DE_NOVA, MAGASINS_DE_CAMPUSTECH, MISE_EN_AVANT, PRIX_PUBLIC_TTC } from "../../monde/referencement-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SE FAIRE RÉFÉRENCER CHEZ UN DISTRIBUTEUR » : LA CENTRALE DEMANDE UNE
 * RISTOURNE (BTS NDRC, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA face à CampusTech (monde/referencement-de-nova.ts), à
 * partir de l'offre que le chapitre a retenue : la mise en avant et 1 € de remise sur facture.
 * Hypothèse du cas : au dernier rendez-vous, l'acheteur demande en plus une ristourne de fin d'année de
 * 2 % du prix net, sur toute l'année, et veut afficher la NOVA One à 64,90 € à la rentrée. L'élève
 * refait seul le chemin du chapitre : ce que coûte la ristourne, ce qu'elle donne au distributeur
 * (dont la place est déjà gardée), le seuil de revente à perte qui en découle, puis sa réponse.
 *
 * Le jugement : la ristourne ne sert à rien à NOVA, sa place est déjà gagnée ; elle ne se cède que
 * contre une contrepartie. Et le prix de la rentrée resterait sous le seuil, même avec elle.
 */

/** La ristourne de fin d'année demandée (hypothèse du cas) : 2 % du prix net facturé. */
export const RISTOURNE_DEMANDEE = 0.02;

/** Le prix que l'acheteur veut afficher à la rentrée (hypothèse du cas), toutes taxes comprises. */
export const PRIX_VOULU_A_LA_RENTREE = 64.9;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** La ristourne sur l'offre retenue au chapitre. */
export function ristourneDeLaCentrale(c: Pick<Cas, "code">) {
  const x = referencement(c);
  const m = x.meilleure;
  const tva = x.f.semestre.tauxDeTva;
  const parEnceinte = auCentime(m.prixNet * RISTOURNE_DEMANDEE);
  const deLAnnee = auCentime(parEnceinte * m.ventesDeLAnnee);
  const margeDeNova = auCentime(m.margeDeNova - deLAnnee);
  const margeParMagasin = auCentime(m.margeParMagasin + m.parMagasin * parEnceinte);
  const margeParMetre = auCentime(margeParMagasin / LINEAIRE_DE_NOVA);
  const seuilHt = auCentime(m.seuilHt - parEnceinte);
  const seuilTtc = auCentime(seuilHt * (1 + tva));
  return { x, m, parEnceinte, deLAnnee, margeDeNova, margeParMagasin, margeParMetre, seuilHt, seuilTtc, rentreeAPerte: PRIX_VOULU_A_LA_RENTREE < seuilTtc };
}

export const LA_CENTRALE_DEMANDE_UNE_RISTOURNE: Situation = {
  code: "la-centrale-demande-une-ristourne",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["se-faire-referencer"],
  commanditaire: "Le dirigeant de NOVA",
  titre: "La centrale demande une ristourne",
  accroche:
    "L'accord semblait trouvé. Au dernier rendez-vous, l'acheteur de CampusTech veut une ristourne de fin d'année et un prix choc pour la rentrée. Que lui répondre ?",
  objectifs: [
    "Chiffrer ce qu'une ristourne coûte au fournisseur et donne au distributeur",
    "Recalculer le seuil de revente à perte avec un avantage de plus",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_REFERENCEMENT,
    pourquoi:
      "ce cas se joue chez NOVA, le fabricant, face à la centrale de CampusTech, la chaîne qui revend ses enceintes : c'est là que se négocient un référencement, un linéaire et ses marges.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          `« Nous avions un accord : la mise en avant à ${eur(MISE_EN_AVANT.prixParAn)} par an et ${eur(r.m.remise)} de remise par enceinte. L'acheteur veut maintenant une ristourne de fin d'année de ${pct(RISTOURNE_DEMANDEE * 100)} du prix net, sur toute l'année. Il veut aussi afficher la NOVA One à ${eur(PRIX_VOULU_A_LA_RENTREE)} à la rentrée. Que lui répondons-nous ? »`,
          `L'acheteur exige toujours ${eur(r.x.margeExigee)} de marge par mètre de rayon. Les ventes de l'accord sont celles du chapitre : ${qte(r.m.parMagasin)} enceintes par magasin et par mois, dans ${qte(MAGASINS_DE_CAMPUSTECH)} magasins.`,
          "Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = ristourneDeLaCentrale(c);
        return {
          titre: "L'accord de départ · NOVA chez CampusTech",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix net facturé par enceinte", valeurs: [eur(r.m.prixNet)] },
            { libelle: "Mise en avant, par an", valeurs: [eur(MISE_EN_AVANT.prixParAn)] },
            { libelle: "Enceintes de l'année", valeurs: [qte(r.m.ventesDeLAnnee)] },
            { libelle: "Marge de CampusTech par mètre", valeurs: [eur(r.m.margeParMetre)] },
            { libelle: "Marge de NOVA sur l'année", valeurs: [eur(r.m.margeDeNova)] },
            { libelle: "Prix public, toutes taxes comprises", valeurs: [eur(PRIX_PUBLIC_TTC)] },
          ],
        };
      },
    },
    {
      id: "la-ristourne",
      objectifs: [0],
      type: "montants",
      titre: "Ce que coûte la ristourne",
      notions: ["markup_coefficient", "contribution_margin"],
      question: () => "Calculez la ristourne par enceinte, ce qu'elle coûte à NOVA sur l'année, puis la marge de NOVA chez CampusTech une fois la ristourne payée.",
      champs: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          { libelle: "Ristourne par enceinte", attendu: r.parEnceinte, calcul: `${eur(r.m.prixNet)} × ${pct(RISTOURNE_DEMANDEE * 100)} = ${eur(r.parEnceinte)}` },
          { libelle: "Ristourne de l'année", attendu: r.deLAnnee, calcul: `${eur(r.parEnceinte)} × ${qte(r.m.ventesDeLAnnee)} = ${eur(r.deLAnnee)}` },
          { libelle: "Marge de NOVA après ristourne", attendu: r.margeDeNova, calcul: `${eur(r.m.margeDeNova)} − ${eur(r.deLAnnee)} = ${eur(r.margeDeNova)}` },
        ];
      },
      explication: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [`La ristourne coûte ${eur(r.deLAnnee)} par an à NOVA, bien plus que l'animation de la rentrée (${eur(r.x.animation.cout)}). Reste à voir ce qu'elle achète.`];
      },
    },
    {
      id: "ce-qu-elle-donne",
      objectifs: [0],
      type: "montants",
      titre: "Ce qu'elle donne au distributeur",
      notions: ["sales_per_sqm"],
      question: () => "Calculez la marge de CampusTech sur la NOVA One par magasin et par mois avec la ristourne, puis sa marge par mètre de linéaire.",
      champs: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          { libelle: "Marge par magasin et par mois", attendu: r.margeParMagasin, calcul: `${eur(r.m.margeParMagasin)} + ${qte(r.m.parMagasin)} × ${eur(r.parEnceinte)} = ${eur(r.margeParMagasin)}` },
          { libelle: "Marge par mètre", attendu: r.margeParMetre, calcul: `${eur(r.margeParMagasin)} ÷ ${qte(LINEAIRE_DE_NOVA)} = ${eur(r.margeParMetre)}` },
        ];
      },
      explication: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [`Le mètre de NOVA passerait de ${eur(r.m.margeParMetre)} à ${eur(r.margeParMetre)}, quand ${eur(r.x.margeExigee)} suffisent. La place est déjà gardée : la ristourne ne la rend pas plus sûre.`];
      },
    },
    {
      id: "le-nouveau-seuil",
      objectifs: [1],
      type: "montants",
      titre: "Le seuil avec la ristourne",
      notions: ["price_floor"],
      question: () => "La ristourne est un avantage financier de plus. Calculez le seuil de revente à perte hors taxes avec elle, puis taxes comprises.",
      champs: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          { libelle: "Seuil de revente à perte hors taxes", attendu: r.seuilHt, calcul: `${eur(r.m.prixNet)} − ${eur(r.m.cooperationParEnceinte)} − ${eur(r.parEnceinte)} = ${eur(r.seuilHt)}` },
          { libelle: "Seuil de revente à perte TTC", attendu: r.seuilTtc, calcul: `${eur(r.seuilHt)} × ${qte(1 + r.x.f.semestre.tauxDeTva)} = ${eur(r.seuilTtc)}` },
        ];
      },
      explication: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          r.rentreeAPerte
            ? `Même avec la ristourne, le seuil reste à ${eur(r.seuilTtc)} : ${eur(PRIX_VOULU_A_LA_RENTREE)} serait une revente à perte.`
            : `Avec la ristourne, le seuil descend à ${eur(r.seuilTtc)} : ${eur(PRIX_VOULU_A_LA_RENTREE)} deviendrait possible.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      objectifs: [2],
      titre: "Votre réponse au dirigeant",
      notions: ["price_floor", "markup_coefficient"],
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = ristourneDeLaCentrale(c);
        return [
          {
            texte: "Refuser la ristourne sans contrepartie, et le prix de la rentrée",
            juste: r.rentreeAPerte,
            retour: `Oui : la ristourne coûterait ${eur(r.deLAnnee)} pour une place déjà gardée (${eur(r.m.margeParMetre)} par mètre pour ${eur(r.x.margeExigee)} exigés). Elle ne se cède que contre une contrepartie, un mètre de plus par exemple. Et ${eur(PRIX_VOULU_A_LA_RENTREE)} resterait sous le seuil, ${eur(r.seuilTtc)} : une revente à perte.`,
          },
          {
            texte: `Accepter : la ristourne ne coûte que ${eur(r.parEnceinte)} par enceinte`,
            juste: false,
            retour: `Non : ${eur(r.parEnceinte)} sur ${qte(r.m.ventesDeLAnnee)} enceintes font ${eur(r.deLAnnee)} par an, pour rien de plus que ce que NOVA a déjà.`,
          },
          {
            texte: "Accepter les deux : avec la ristourne, le prix de la rentrée devient légal",
            juste: !r.rentreeAPerte,
            retour: `Non : avec la ristourne, le seuil n'est que de ${eur(r.seuilTtc)}, au-dessus de ${eur(PRIX_VOULU_A_LA_RENTREE)}.`,
          },
        ];
      },
    },
  ],
};
