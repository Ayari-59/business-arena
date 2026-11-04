import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_ACTEURS } from "../../chapitres/les-acteurs-et-les-modes-de-financement";
import { BESOIN_EXTERNE, GARANTIE, pretGaranti, sansGarantie } from "../../monde/acteurs-du-financement";
import { EMPRUNT_DE_LA_LIGNE } from "../../monde/financement-de-la-gamme";
import { PREMIERE_ANNEE_MAXIMALE, PRET_PARTICIPATIF } from "../../monde/financement-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ACTEURS ET LES MODES DE FINANCEMENT » : LA BANQUE DEMANDE UNE GARANTIE
 * (comptabilité générale, palier 4 ; DCG UE6 3.1 et 3.2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre (monde/acteurs-du-financement.ts).
 *
 * HYPOTHÈSES DU CAS (GARANTIE) : la banque prête les 80 000 € à 5 % sur 5 ans, mais au-delà de 50 000 €
 * elle veut la moitié du prêt garantie, par la caution personnelle du dirigeant ou par Bpifrance (1 %
 * l'an du capital garanti restant dû). Le dirigeant refuse la caution. L'autre voie : 50 000 € à la
 * banque sans garantie, 30 000 € en prêt participatif (6 %, 4 ans, en une fois). Les associés ne
 * veulent pas que les nouveaux financements prennent plus de 16 000 € la première année
 * (PREMIERE_ANNEE_MAXIMALE, celle de « Financer autrement »). L'élève valorise les deux engagements et
 * tranche.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres du cas. */
export function banqueQuiDemandeUneGarantie(_c: Pick<Cas, "code">) {
  const g = pretGaranti(BESOIN_EXTERNE);
  const s = sansGarantie();
  return { g, s, ecart: Math.round((s.aRendre - g.aRendre) * 100) / 100 };
}

export const LA_BANQUE_DEMANDE_UNE_GARANTIE: Situation = {
  code: "la-banque-demande-une-garantie",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-acteurs-et-les-modes-de-financement"],
  commanditaire: "Le dirigeant",
  titre: "La banque demande une garantie",
  accroche: "La banque prêterait les 80 000 €, mais veut la moitié garantie. Pas question de caution personnelle : la garantie de Bpifrance, ou moins de banque et des internautes ?",
  objectifs: [
    "Valoriser la commission d'une garantie et l'engagement total d'un prêt garanti",
    "Valoriser l'engagement d'un montage qui combine deux prêteurs",
    "Choisir un financement selon une contrainte de trésorerie et rendre une réponse",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ACTEURS,
    pourquoi: "ce cas reprend le chapitre « Les acteurs et les modes de financement », qui se joue sur la gamme de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: () => [
        `« La banque prête les ${eur(BESOIN_EXTERNE)}, à ${pct(EMPRUNT_DE_LA_LIGNE.taux)} sur ${EMPRUNT_DE_LA_LIGNE.dureeAns} ans, capital en parts égales. Mais au-delà de ${eur(GARANTIE.sansGarantieJusqua)}, elle veut la moitié du prêt garantie. Ma caution personnelle, c'est non. Bpifrance garantirait, contre une commission. Ou je prends ${eur(GARANTIE.sansGarantieJusqua)} à la banque et le reste sur une plateforme de prêt. Les associés ne veulent pas plus de ${eur(PREMIERE_ANNEE_MAXIMALE)} de sorties la première année. Qu'est-ce que je choisis ? »`,
        "Pas de cours cette fois : vous avez les conditions des deux voies.",
      ],
      tableau: () => ({
        titre: "Les deux voies",
        colonnes: ["Conditions"],
        lignes: [
          { libelle: "Banque et garantie de Bpifrance", valeurs: [`${eur(BESOIN_EXTERNE)} à ${pct(EMPRUNT_DE_LA_LIGNE.taux)}, la moitié garantie ; commission de ${pct(GARANTIE.commission)} l'an du capital garanti restant dû en début d'année`] },
          { libelle: "Banque et prêt participatif", valeurs: [`${eur(GARANTIE.sansGarantieJusqua)} à la banque sans garantie ; ${eur(BESOIN_EXTERNE - GARANTIE.sansGarantieJusqua)} à ${pct(PRET_PARTICIPATIF.taux)} sur ${PRET_PARTICIPATIF.dureeAns} ans, remboursés en une fois`] },
        ],
      }),
      repere: () => "À rendre : la commission de garantie, ce que chaque voie engage à rendre, ses sorties de la première année, et votre réponse.",
    },
    {
      id: "la-garantie",
      type: "montants",
      titre: "Le prêt garanti",
      notions: ["loan_schedule"],
      question: () => "Calculez la commission de garantie sur toute la durée, puis ce que NOVA s'engage à rendre (capital, intérêts et commission) et ses sorties de la première année.",
      champs: (c) => {
        const { g } = banqueQuiDemandeUneGarantie(c);
        return [
          { libelle: "Commission de garantie, toute la durée", attendu: g.commission, calcul: `la moitié des capitaux restant dus, × ${pct(GARANTIE.commission)} : ${g.commissions.map(eur).join(" + ")} = ${eur(g.commission)}` },
          { libelle: "Engagement total du prêt garanti", attendu: g.aRendre, calcul: `${eur(g.e.capital)} + ${eur(g.e.interets)} + ${eur(g.commission)} = ${eur(g.aRendre)}` },
          { libelle: "Sorties de la première année", attendu: g.premiereAnnee, calcul: `${eur(g.e.premiereAnnee)} d'annuité + ${eur(g.commissions[0]!)} de commission = ${eur(g.premiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const { g } = banqueQuiDemandeUneGarantie(c);
        return [`La garantie coûte peu, ${eur(g.commission)} sur ${EMPRUNT_DE_LA_LIGNE.dureeAns} ans, mais elle ne change rien au rythme du prêt : la première année prend ${eur(g.premiereAnnee)}.`];
      },
    },
    {
      id: "sans-garantie",
      type: "montants",
      titre: "Sans garantie",
      notions: ["loan_schedule"],
      question: () => "Calculez, pour la voie sans garantie, les intérêts des deux prêts sur toute leur durée, ce que NOVA s'engage à rendre, et ses sorties de la première année.",
      champs: (c) => {
        const { s } = banqueQuiDemandeUneGarantie(c);
        return [
          { libelle: "Intérêts des deux prêts", attendu: s.interets, calcul: `${eur(s.banque.interets)} + ${eur(s.participatif.interets)} = ${eur(s.interets)}` },
          { libelle: "Engagement total", attendu: s.aRendre, calcul: `${eur(BESOIN_EXTERNE)} + ${eur(s.interets)} = ${eur(s.aRendre)}` },
          { libelle: "Sorties de la première année", attendu: s.premiereAnnee, calcul: `${eur(s.banque.premiereAnnee)} + ${eur(s.participatif.premiereAnnee)} = ${eur(s.premiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const k = banqueQuiDemandeUneGarantie(c);
        return [`Cette voie engage ${eur(k.ecart)} de plus sur toute la durée, mais prend ${eur(k.g.premiereAnnee - k.s.premiereAnnee)} de moins la première année : le prêt participatif ne rembourse son capital qu'à la fin.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["loan_schedule"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const k = banqueQuiDemandeUneGarantie(c);
        return [
          {
            texte: "La banque et le prêt participatif",
            juste: true,
            retour: `Oui. Elle engage ${eur(k.ecart)} de plus, mais c'est la seule qui tient la limite des associés : ${eur(k.s.premiereAnnee)} la première année, contre ${eur(k.g.premiereAnnee)} avec la garantie. Attention à la quatrième année, où ${eur(BESOIN_EXTERNE - GARANTIE.sansGarantieJusqua)} reviendront d'un coup : à préparer dès maintenant.`,
          },
          {
            texte: `La garantie de Bpifrance : la voie la moins chère, ${eur(k.ecart)} de moins`,
            juste: false,
            retour: `Moins chère sur la durée, mais ${eur(k.g.premiereAnnee)} la première année, au-dessus des ${eur(PREMIERE_ANNEE_MAXIMALE)} que les associés acceptent.`,
          },
          {
            texte: "La caution du dirigeant : elle ne coûte rien à NOVA",
            juste: false,
            retour: "Elle ne coûte rien à NOVA, mais engage le patrimoine du dirigeant, qui l'a refusée ; et elle laisse la première année aussi lourde qu'avec la garantie.",
          },
        ];
      },
    },
  ],
};
