import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { MOIS_PROBABLES, MOIS_RECLAMES, PART_RECOUVREE, TAUX_DE_PERTE_ESTIME, creanceDouteuse, litige } from "../provisions";
import type { Chapitre } from "../types";
import { planDAmortissement } from "./immobilisations";
import { balanceApresInventaire, cloture } from "./la-cloture";

/**
 * CHAPITRE : DÉPRÉCIATIONS ET PROVISIONS (comptabilité générale, palier 4).
 *
 * La suite de « La clôture » : l'année de l'arène est en balance, amortissements et stock
 * passés. Avant l'impôt, le comptable regarde ce que l'année laisse de risques. Un client
 * qui ne paiera pas tout : sa créance passe en douteuse et se déprécie de la perte
 * probable, hors taxes. Un salarié qui conteste son licenciement : une provision pour le
 * montant probable, pas pour celui qu'il réclame. L'équipement : sa valeur de revente est
 * sous sa valeur nette comptable, mais il sert, et ne se déprécie pas. Puis le résultat et
 * l'impôt, et l'année suivante : le liquidateur paie, le reste est perdu, la dépréciation
 * se reprend.
 *
 * Les montants sont ceux de l'arène, les événements ceux du cours (`provisions.ts`) :
 * l'arène ne connaît ni client défaillant ni litige.
 */

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Le résultat et l'impôt, avant et après les dépréciations et la provision. */
export function resultatApresProvisions(c: Cas) {
  const k = cloture(c);
  const d = creanceDouteuse(c);
  const l = litige(c);
  const resultat = auCentime(k.resultatAvantImpot - d.depreciation - l.provision);
  const impot = resultat > 0 ? Math.round(resultat * k.tauxIS) : 0;
  return { avant: k.resultatAvantImpot, impotAvant: k.impot, resultat, impot, tauxIS: k.tauxIS, economie: k.impot - impot };
}

/**
 * Le journal en ouvrant le chapitre : la balance de « La clôture », la dotation et le stock
 * déjà passés, et la créance de fin d'année sortie de la banque, TVA comprise.
 */
function ouverture(c: Cas): Ecriture {
  const d = creanceDouteuse(c);
  const lignes = [...balanceApresInventaire(c)];
  lignes.push({ compte: "411", debit: d.ttc, credit: 0 }, { compte: "44571", debit: 0, credit: d.tva }, { compte: "512", debit: 0, credit: d.ht });
  return { date: "31 décembre", libelle: "Balance après amortissements et stock : l'année de l'arène, et ce que les clients doivent encore", lignes };
}

export const DEPRECIATIONS_ET_PROVISIONS: Chapitre = {
  code: "depreciations-et-provisions",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Dépréciations et provisions",
  accroche:
    "Un client qui ne paiera pas tout, un salarié qui conteste son licenciement : au 31 décembre, le comptable compte les pertes probables avant les gains, et l'année suivante dit s'il a bien estimé.",
  objectifs: [
    "Appliquer le principe de prudence à la clôture",
    "Reclasser une créance douteuse et la déprécier sur son montant hors taxes",
    "Constituer une provision pour risque au montant probable",
    "Dire quand une immobilisation se déprécie, et quand elle ne se déprécie pas",
    "Solder une créance irrécouvrable, récupérer la TVA et reprendre la dépréciation",
  ],
  libre: false,
  ouverture,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La prudence",
      notions: ["income_statement", "payment_terms"],
      texte: (c) => {
        const k = cloture(c);
        return [
          `Vous retrouvez l'année de ${c.entreprise} là où « La clôture » l'a laissée : la balance, la dotation aux amortissements et le stock sont passés. Le résultat avant impôt est de ${eur(k.resultatAvantImpot)}.`,
          "Avant l'impôt, le comptable regarde ce que l'année laisse de risques. La règle est celle de la prudence : une perte probable se compte dès qu'on la connaît, un gain seulement quand il est acquis.",
          "Dans l'arène, tous les clients paient et personne ne va au tribunal. Les montants de ce chapitre sont ceux de l'arène ; les deux événements sont ceux du cours.",
        ];
      },
      repere: () =>
        "Une dépréciation constate qu'un actif vaut moins que son prix au bilan : une créance, un stock, une immobilisation. Une provision constate une dette probable, dont le montant ou l'échéance restent incertains.",
    },
    {
      id: "client-douteux",
      type: "choix",
      titre: "Un client en difficulté",
      notions: ["payment_terms"],
      question: (c) => {
        const d = creanceDouteuse(c);
        return `Au 31 décembre, ${d.client} doit ${eur(d.ttc)} à ${c.entreprise}, TVA comprise : ce que les clients doivent encore à la fin de l'année de l'arène. Le même jour, le tribunal ouvre une procédure de redressement judiciaire contre ${d.client} ; le mandataire laisse craindre une perte de ${pct(TAUX_DE_PERTE_ESTIME)} de la créance. Que fait le comptable ?`;
      },
      options: () => [
        {
          texte: "Il passe la créance en clients douteux, et la déprécie de la perte probable, calculée sur le montant hors taxes.",
          juste: true,
          retour:
            "C'est cela. La créance change de compte pour qu'on la suive à part, et la dépréciation constate dès cette année la perte probable. Hors taxes : si la perte se confirme, l'État rendra la TVA de la part perdue ; ce n'est pas une perte pour l'entreprise.",
        },
        {
          texte: "Rien pour l'instant : la perte n'est pas sûre, on la passera quand le tribunal aura statué.",
          juste: false,
          retour: "La prudence demande l'inverse : une perte probable se compte dès qu'on la connaît. Attendre, c'est présenter un résultat trop beau cette année.",
        },
        {
          texte: "Il passe toute la créance en perte, puisque le client ne paiera sans doute pas.",
          juste: false,
          retour: "La perte n'est ni sûre ni totale : le mandataire laisse espérer une partie. On déprécie la perte probable ; la perte définitive viendra à la fin de la procédure.",
        },
      ],
    },
    {
      id: "reclassement",
      type: "ecriture",
      titre: "La créance devient douteuse",
      notions: ["payment_terms"],
      evenement: (c) => {
        const d = creanceDouteuse(c);
        return `Passez la créance ${d.deClient}, ${eur(d.ttc)}, en clients douteux.`;
      },
      ecriture: (c) => {
        const d = creanceDouteuse(c);
        return {
          date: "31 décembre",
          libelle: `Créance douteuse, ${d.client}`,
          lignes: [
            { role: "la créance douteuse", compte: "416", sens: "debit", montant: d.ttc, indice: "la créance entière, TVA comprise" },
            { role: "la créance qui quitte le compte clients", compte: "411", sens: "credit", montant: d.ttc, indice: "la créance entière, TVA comprise" },
          ],
        };
      },
      indices: () => [
        "Un compte de clients vers un autre : rien ne change dans le résultat.",
        "Au débit, les clients douteux ou litigieux, 416 ; au crédit, le compte clients, 411. Le montant : toute la créance, TVA comprise.",
      ],
      explication: (c) => [
        `${c.entreprise} n'a rien perdu en passant cette écriture : la créance est la même, rangée à part pour qu'on la suive jusqu'à la fin de la procédure.`,
      ],
    },
    {
      id: "montant-depreciation",
      type: "montants",
      titre: "Le montant de la dépréciation",
      notions: ["payment_terms"],
      question: (c) => {
        const d = creanceDouteuse(c);
        return `La créance est de ${eur(d.ttc)} TVA comprise, avec une TVA à ${pct(d.tauxTva)}. La perte probable est de ${pct(TAUX_DE_PERTE_ESTIME)}. Calculez la créance hors taxes, puis la dépréciation.`;
      },
      champs: (c) => {
        const d = creanceDouteuse(c);
        return [
          { libelle: "Créance hors taxes", attendu: d.ht, calcul: `${eur(d.ttc)} ÷ ${(1 + d.tauxTva).toLocaleString("fr-FR")} = ${eur(d.ht)}` },
          { libelle: "Dépréciation", attendu: d.depreciation, calcul: `${eur(d.ht)} × ${pct(TAUX_DE_PERTE_ESTIME)} = ${eur(d.depreciation)}` },
        ];
      },
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [
          `La TVA de la créance, ${eur(d.tva)}, a été versée à l'État quand la vente a été facturée. Si le client ne paie pas, l'État la rend sur la part perdue : la dépréciation ne porte que sur le hors taxes.`,
        ];
      },
    },
    {
      id: "dotation-depreciation",
      type: "ecriture",
      titre: "La dépréciation, au journal",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => `Passez la dépréciation de la créance ${creanceDouteuse(c).deClient}.`,
      ecriture: (c) => {
        const d = creanceDouteuse(c);
        return {
          date: "31 décembre",
          libelle: `Dépréciation de la créance ${d.deClient}`,
          lignes: [
            {
              role: "la charge de l'année, la dotation aux dépréciations",
              compte: "6817",
              acceptes: ["681"],
              sens: "debit",
              montant: d.depreciation,
              indice: "la dépréciation calculée",
            },
            { role: "la dépréciation de la créance", compte: "491", sens: "credit", montant: d.depreciation, indice: "la dépréciation calculée" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : une dotation, comme pour les amortissements, mais aux dépréciations des actifs circulants (6817).",
        "Au crédit, le compte qui se soustrait de la créance au bilan : les dépréciations des comptes de clients, 491.",
      ],
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [
          `Au bilan, la créance garde sa valeur d'origine, ${eur(d.ttc)}, et la dépréciation s'en soustrait : la créance vaut ${eur(auCentime(d.ttc - d.depreciation))} net. Au compte de résultat, ${eur(d.depreciation)} de charges en plus, et pas un euro de sorti.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "litige",
      type: "choix",
      titre: "Un salarié aux prud'hommes",
      notions: ["income_statement"],
      question: (c) => {
        const l = litige(c);
        return `Un salarié licencié en novembre conteste son licenciement devant le conseil de prud'hommes. Il gagnait ${eur(l.salaire)} brut par mois et réclame ${MOIS_RECLAMES} mois de salaire, ${eur(l.reclame)}. L'avocat de ${c.entreprise} juge probable une condamnation à ${MOIS_PROBABLES} mois. Que constate le comptable au 31 décembre ?`;
      },
      options: (c) => {
        const l = litige(c);
        return [
          {
            texte: `Une provision pour litige de ${eur(l.provision)} : le montant probable.`,
            juste: true,
            retour: `C'est cela : ${eur(l.salaire)} × ${MOIS_PROBABLES} = ${eur(l.provision)}, arrondi à l'euro. La dette est probable, son montant incertain : c'est une provision. Elle se mesure à ce que l'entreprise risque vraiment, selon l'avocat, pas à ce que l'adversaire demande.`,
          },
          {
            texte: `Une provision de ${eur(l.reclame)} : ce que le salarié réclame.`,
            juste: false,
            retour: "La demande d'un adversaire n'est pas une estimation. La provision se mesure à la sortie d'argent probable : ici, celle que juge l'avocat.",
          },
          {
            texte: "Rien : tant que le jugement n'est pas rendu, l'entreprise ne doit rien.",
            juste: false,
            retour: "La prudence demande de constater une dette probable dès qu'on la connaît, même si son montant n'est pas encore fixé. C'est l'objet même d'une provision.",
          },
        ];
      },
    },
    {
      id: "provision",
      type: "ecriture",
      titre: "La provision, au journal",
      notions: ["income_statement"],
      evenement: (c) => `Passez la provision pour litige de ${eur(litige(c).provision)}.`,
      ecriture: (c) => {
        const l = litige(c);
        return {
          date: "31 décembre",
          libelle: "Provision pour litige prud'homal",
          lignes: [
            { role: "la charge de l'année, la dotation aux provisions", compte: "6815", acceptes: ["681"], sens: "debit", montant: l.provision, indice: "le montant probable" },
            { role: "la provision pour litige", compte: "1511", acceptes: ["151"], sens: "credit", montant: l.provision, indice: "le montant probable" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : une dotation aux provisions d'exploitation (6815).",
        "Au crédit, une dette dont le montant reste incertain : les provisions pour litiges, 1511. Elle se range au passif, entre les capitaux propres et les dettes.",
      ],
      explication: (c) => [
        `L'année porte la charge du litige qu'elle a fait naître, même si ${c.entreprise} ne paiera, s'il le faut, qu'après le jugement.`,
      ],
      vue: "resultat",
    },
    {
      id: "equipement",
      type: "choix",
      titre: "Et l'équipement ?",
      notions: ["depreciation"],
      question: (c) => {
        const p = planDAmortissement(c);
        const vente = auCentime(p.vncFinAnnee1 * c.immobilisation.ratioDeRevente);
        return `Au 31 décembre, l'équipement de ${c.entreprise} (${c.immobilisation.designation}) vaut ${eur(p.vncFinAnnee1)} au bilan, après un an d'amortissement. Revendu, l'arène n'en donnerait que ${pct(c.immobilisation.ratioDeRevente)}, ${eur(vente)}. Faut-il le déprécier ?`;
      },
      options: (c) => {
        const p = planDAmortissement(c);
        const vente = auCentime(p.vncFinAnnee1 * c.immobilisation.ratioDeRevente);
        return [
          {
            texte: "Non : l'entreprise s'en sert, et ce qu'il lui rapporte en servant dépasse ce qu'il vaut au bilan.",
            juste: true,
            retour:
              "C'est cela. La valeur actuelle d'une immobilisation est la plus grande de deux : sa valeur de revente, et sa valeur d'usage, ce qu'elle rapportera à l'entreprise qui la garde. On ne déprécie que si cette valeur actuelle tombe sous la valeur nette comptable. Un équipement qui fait tourner l'activité de l'année vaut plus que son prix de revente.",
          },
          {
            texte: `Oui, de ${eur(auCentime(p.vncFinAnnee1 - vente))} : la différence entre sa valeur au bilan et son prix de revente.`,
            juste: false,
            retour:
              "Ce serait juste si l'entreprise allait le revendre. Elle le garde : c'est sa valeur d'usage qui compte, et elle dépasse la valeur au bilan tant que l'équipement sert. La perte de revente se constatera, dans le résultat de la cession, le jour où il sera vendu.",
          },
          {
            texte: "Non : une immobilisation ne se déprécie jamais, elle s'amortit.",
            juste: false,
            retour:
              "Une immobilisation peut se déprécier en plus de son amortissement : une machine abîmée, un fonds de commerce dont la clientèle part. On compare alors sa valeur actuelle à sa valeur nette comptable. Ici, la comparaison ne donne rien à déprécier.",
          },
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat de l'année",
      notions: ["income_statement"],
      question: (c) => {
        const r = resultatApresProvisions(c);
        const d = creanceDouteuse(c);
        const l = litige(c);
        return `Avant ce chapitre, le résultat avant impôt était de ${eur(r.avant)}. Vous avez passé ${eur(d.depreciation)} de dépréciation et ${eur(l.provision)} de provision. L'impôt sur les sociétés est au taux de ${pct(r.tauxIS)}, arrondi à l'euro ; une perte ne paie pas d'impôt. Calculez le nouveau résultat avant impôt et l'impôt.`;
      },
      champs: (c) => {
        const r = resultatApresProvisions(c);
        const d = creanceDouteuse(c);
        const l = litige(c);
        return [
          {
            libelle: "Résultat avant impôt",
            attendu: r.resultat,
            calcul: `${eur(r.avant)} − ${eur(d.depreciation)} − ${eur(l.provision)} = ${eur(r.resultat)}`,
          },
          {
            libelle: "Impôt sur les sociétés",
            attendu: r.impot,
            calcul: r.resultat > 0 ? `${eur(r.resultat)} × ${pct(r.tauxIS)} = ${eur(r.impot)}` : "une perte : pas d'impôt, 0 €",
          },
        ];
      },
      explication: (c) => {
        const r = resultatApresProvisions(c);
        return [
          r.economie > 0
            ? `Sans ce chapitre, l'impôt aurait été de ${eur(r.impotAvant)}. La prudence coûte ${eur(auCentime(r.avant - r.resultat))} de résultat, et fait payer ${eur(r.economie)} d'impôt en moins : une dépréciation ou une provision bien justifiée est une charge déductible.`
            : "L'année était déjà en perte : ces charges l'augmentent, et la perte se reporte sur les bénéfices des années suivantes, qui paieront moins d'impôt.",
        ];
      },
      vue: "resultat",
    },
    {
      id: "annee-suivante",
      type: "lecture",
      titre: "L'année suivante",
      notions: ["payment_terms"],
      texte: (c) => {
        const d = creanceDouteuse(c);
        return [
          `En juin de l'année suivante, le redressement ${d.deClient} se termine en liquidation. Le liquidateur verse ${pct(PART_RECOUVREE)} de la créance, ${eur(d.recouvre)} ; le reste, ${eur(d.perdu)}, ne sera jamais payé.`,
          `Le mandataire laissait craindre une perte de ${pct(TAUX_DE_PERTE_ESTIME)} : elle est de ${pct(1 - PART_RECOUVREE)}. Une estimation reste une estimation ; les trois écritures qui suivent soldent la créance et corrigent l'écart.`,
        ];
      },
      repere: () => "Une dépréciation ne s'oublie pas : quand le risque se dénoue, elle se reprend, et la perte réelle se constate.",
    },
    {
      id: "encaissement",
      type: "ecriture",
      titre: "Ce que le liquidateur verse",
      notions: ["payment_terms"],
      evenement: (c) => {
        const d = creanceDouteuse(c);
        return `Le 30 juin de l'année suivante, la banque reçoit ${eur(d.recouvre)} du liquidateur ${d.deClient}. Passez l'encaissement.`;
      },
      ecriture: (c) => {
        const d = creanceDouteuse(c);
        return {
          date: "30 juin N+1",
          libelle: `Règlement du liquidateur, ${d.client}`,
          lignes: [
            { role: "l'argent reçu", compte: "512", sens: "debit", montant: d.recouvre, indice: "ce que verse le liquidateur" },
            { role: "la créance douteuse, en partie réglée", compte: "416", sens: "credit", montant: d.recouvre, indice: "ce que verse le liquidateur" },
          ],
        };
      },
      indices: () => ["La banque au débit.", "Au crédit, la créance douteuse : c'est elle que le liquidateur règle, pas le compte clients."],
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [`Il reste ${eur(d.perdu)} au compte 416, que personne ne paiera.`];
      },
    },
    {
      id: "perte",
      type: "ecriture",
      titre: "La part perdue",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const d = creanceDouteuse(c);
        return `Le liquidateur certifie que les ${eur(d.perdu)} restants sont irrécouvrables. Soldez la créance : la perte se passe hors taxes, et l'État rend la TVA qu'elle contient.`;
      },
      ecriture: (c) => {
        const d = creanceDouteuse(c);
        return {
          date: "30 juin N+1",
          libelle: `Créance irrécouvrable, ${d.client}`,
          lignes: [
            { role: "la perte sur créance irrécouvrable", compte: "654", sens: "debit", montant: d.perteHt, indice: "la part perdue, hors taxes" },
            { role: "la TVA récupérée sur la part perdue", compte: "44571", sens: "debit", montant: d.tvaRecuperee, indice: "la TVA contenue dans la part perdue" },
            { role: "la créance douteuse, soldée", compte: "416", sens: "credit", montant: d.perdu, indice: "ce qui reste au compte 416" },
          ],
        };
      },
      indices: (c) => {
        const d = creanceDouteuse(c);
        return [
          `Au crédit, le reste de la créance douteuse, ${eur(d.perdu)}, TVA comprise.`,
          `Au débit, deux lignes : la perte hors taxes au compte 654, et la TVA de cette part, qui vient en moins de la TVA collectée (44571). Le hors taxes : ${eur(d.perdu)} ÷ ${(1 + d.tauxTva).toLocaleString("fr-FR")}.`,
        ];
      },
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [
          `${eur(d.perdu)} perdus TVA comprise, mais ${eur(d.perteHt)} seulement pour ${c.entreprise} : les ${eur(d.tvaRecuperee)} de TVA, versés à l'État sur une vente jamais payée, s'imputent sur la prochaine déclaration.`,
        ];
      },
    },
    {
      id: "reprise",
      type: "ecriture",
      titre: "La reprise de la dépréciation",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => {
        const d = creanceDouteuse(c);
        return `La créance est soldée : la dépréciation de ${eur(d.depreciation)} n'a plus d'objet. Reprenez-la.`;
      },
      ecriture: (c) => {
        const d = creanceDouteuse(c);
        return {
          date: "30 juin N+1",
          libelle: `Reprise de la dépréciation, ${d.client}`,
          lignes: [
            { role: "la dépréciation qui disparaît", compte: "491", sens: "debit", montant: d.depreciation, indice: "la dépréciation du 31 décembre" },
            {
              role: "le produit de la reprise",
              compte: "7817",
              acceptes: ["781"],
              sens: "credit",
              montant: d.depreciation,
              indice: "la dépréciation du 31 décembre",
            },
          ],
        };
      },
      indices: () => [
        "L'écriture inverse de la dotation, pour le même montant.",
        "Au crédit, un produit : les reprises sur dépréciations des actifs circulants, 7817.",
      ],
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [
          `L'année suivante porte la perte, ${eur(d.perteHt)}, et la reprise, ${eur(d.depreciation)} : ${eur(auCentime(d.perteHt - d.depreciation))} de charge nette, l'écart entre la perte réelle et la perte estimée. Le reste de la perte, l'année du redressement l'avait déjà porté.`,
        ];
      },
    },
    {
      id: "deux-annees",
      type: "montants",
      titre: "Ce que la créance a coûté",
      notions: ["income_statement"],
      question: () =>
        "Sur les deux années, combien la créance perdue a-t-elle coûté au résultat ? Et combien de ce coût l'année du redressement a-t-elle porté ?",
      champs: (c) => {
        const d = creanceDouteuse(c);
        return [
          {
            libelle: "Coût total sur les deux années",
            attendu: d.perteHt,
            calcul: `${eur(d.depreciation)} de dotation + ${eur(d.perteHt)} de perte − ${eur(d.depreciation)} de reprise = ${eur(d.perteHt)}`,
          },
          { libelle: "Porté par l'année du redressement", attendu: d.depreciation, calcul: `la dotation : ${eur(d.depreciation)}` },
        ];
      },
      explication: (c) => {
        const d = creanceDouteuse(c);
        return [
          `Au bout du compte, la créance coûte ce qui a été perdu, hors taxes : ${eur(d.perteHt)}. La dépréciation n'ajoute ni n'enlève rien ; elle déplace la charge vers l'année où le risque est né, pour que le résultat de cette année-là dise vrai.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => {
        const r = resultatApresProvisions(c);
        return [
          `Vous avez fait les travaux de prudence de ${c.entreprise} : une créance dépréciée, une provision pour litige, un équipement examiné et laissé tel quel. Le résultat avant impôt passe de ${eur(r.avant)} à ${eur(r.resultat)}.`,
          "Un stock se déprécie de la même façon, quand ce qu'on en tirera tombe sous son coût : une collection démodée, des produits proches de leur date. Dans l'arène, aucune entreprise du cours ne finit l'année avec du stock, et le chapitre n'en a pas à déprécier.",
        ];
      },
      repere: () =>
        "Dépréciation d'un actif, provision pour une dette probable : une dotation au 31 décembre, une reprise quand le risque se dénoue. Le montant est toujours celui qu'on estime probable, jamais celui qu'on redoute ou qu'on espère.",
    },
  ],
};
