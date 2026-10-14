/**
 * LE CONCURRENT À RACHETER — le contenu de l'épisode.
 *
 * Idriss Zerrouki dirige le développement d'Arvel Distribution. Mourgue
 * Matériaux, un négoce familial de quatre agences en Isère, est à vendre, et
 * Sérac Matériaux, un groupe adossé à un fonds, est sur les rangs. De l'offre
 * indicative au closing : six décisions, chacune précédée de ce qu'un
 * directeur du développement reçoit vraiment — le banquier de la cédante qui
 * presse, le directeur régional qui veut gagner, le président qui ne veut pas
 * voir Mourgue chez Sérac, l'audit qui chiffre ce que les comptes ne disaient
 * pas.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : l'EBE retraité, la valeur d'entreprise autonome, les
 * synergies, le prix plafond, la perte si Sérac l'emporte, le complément de
 * prix qu'il faudrait pour égaler Sérac.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  DETTE_NETTE,
  DIRECTEUR,
  EBE_PUBLIE,
  FRAIS_TRANSACTION,
  INTEGRATION,
  PASSIF,
  RETRAITEMENTS,
  STOCK_AFFICHE,
  SYNERGIES,
  VALEUR_SYNERGIES_COUTS,
  VALEUR_SYNERGIES_REVENUS,
} from "@/engine/episodes/concurrent-a-racheter";
import { kE, taux } from "./format";
import type { Contexte, Etape } from "./types";

export const BERNADETTE = {
  de: "Bernadette Mourgue",
  role: "Présidente de Mourgue Matériaux",
} as const;
export const FELICIEN = {
  de: "Félicien Rabaud",
  role: "Banquier d'affaires, conseil de la cédante",
} as const;
export const MOUNIA = {
  de: "Mounia Kherbache",
  role: "Contrôleuse de gestion, fusions et acquisitions",
} as const;
export const VIANNEY = {
  de: "Vianney Charrel",
  role: "Directeur régional Isère, Arvel Distribution",
} as const;
export const ROZENN = {
  de: "Rozenn Cadiou",
  role: "Directrice administrative et financière",
} as const;
export const JEAN_BAPTISTE = {
  de: "Jean-Baptiste Morvillier",
  role: "Président d'Arvel Distribution",
} as const;
export const SIXTINE = { de: "Sixtine Penven", role: "Associée, cabinet d'audit" } as const;
export const ONDINE = { de: "Ondine Lagrange", role: "Avocate d'affaires" } as const;
export const ANTHELME = {
  de: "Anthelme Rostaing",
  role: "Directeur commercial de Mourgue Matériaux",
} as const;

export const DIAGNOSTICS = [
  {
    id: "prix",
    t: "Le prix maximal se calcule avant d'entrer dans la vente, sur l'EBE retraité et les seules synergies sûres ; il ne bouge pas parce que Sérac surenchérit, seul l'audit peut le faire baisser",
  },
  {
    id: "synergies",
    t: "Ce sont les synergies qui font la valeur du rachat : il faut les chiffrer finement, coûts et revenus, et n'en céder qu'une partie au vendeur",
  },
  {
    id: "course",
    t: "Le danger, c'est Sérac, à vingt minutes de nos agences : il faut emporter Mourgue avant lui, quitte à payer une prime de contrôle",
  },
  {
    id: "marche",
    t: "Le prix, c'est le marché qui le fixe : cinq fois et demie l'EBE du dernier exercice ; il faut s'y aligner et aller vite",
  },
] as const;

/** Le message du banquier de la cédante, selon ce que Sérac a fait de l'offre ferme d'Arvel. */
const relanceDuBanquier = (ctx: Contexte): string =>
  !ctx.enLice
    ? "Monsieur Zerrouki, je vous confirme que Mme Mourgue poursuit avec Sérac Matériaux. Nous vous remercions de l'intérêt que vous avez porté au dossier."
    : ctx.exclusif
      ? "Votre exclusivité court jusqu'au protocole. Mme Mourgue est prête à signer, mais elle attend un geste : 250 k€ de plus, et elle signe cette semaine. Elle sait que Sérac attend la fin de votre exclusivité."
      : ctx.serac === "surenchere"
        ? `Sérac a reçu votre offre ferme et porte la sienne à ${ctx.annonceSerac}, et la dit finale. Mme Mourgue vous laisse jusqu'à mardi pour une dernière offre ; je vous conseille de ne pas la décevoir.`
        : "Sérac se retire de la vente. Je ne vous cache pas qu'un fonds d'investissement regarde le dossier : un geste de 250 k€, et Mme Mourgue signe avec vous cette semaine.";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Mourgue est à vendre",
    jusqua: 2,
    messages: () => [
      {
        ...FELICIEN,
        heure: "08:30",
        alerte: true,
        texte:
          "Monsieur Zerrouki, comme convenu : Mme Mourgue cède 100 % de Mourgue Matériaux. Quatre agences, Voiron, Crolles, Vizille et La Mure, 21,5 M€ de chiffre d'affaires, 1,5 M€ d'EBE. Les offres indicatives sont attendues vendredi prochain, en valeur d'entreprise. Vous n'êtes pas seuls sur les rangs.",
      },
      {
        ...VIANNEY,
        heure: "09:15",
        texte:
          "Idriss, si Sérac met la main sur Mourgue, il aura quatre agences à vingt minutes de Grenoble-Sud et de Moirans. Il faut l'emporter, et frapper fort dès le premier tour.",
      },
      {
        ...JEAN_BAPTISTE,
        heure: "11:40",
        texte:
          "Le comité de direction veut votre recommandation jeudi : un prix, et jusqu'où nous sommes prêts à aller. Pas un prix pour faire plaisir à Mme Mourgue, un prix que nous saurons défendre dans trois ans.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptes",
        titre: "Relire les comptes de Mourgue et la plaquette du banquier",
        cout: 1,
        nature: "decisive",
        resultat: `EBE du dernier exercice : ${kE(EBE_PUBLIE)}. Mais ${kE(-RETRAITEMENTS.chantier)} de marge viennent du chantier du collège de Vizille, livré en mars, qui ne se répétera pas. La présidente se versait 50 k€ par an ; un directeur général coûtera 130 k€ chargés, soit ${kE(-RETRAITEMENTS.remuneration)} de charges en plus. À l'inverse, ${kE(RETRAITEMENTS.litige)} d'honoraires d'un litige clos avec un ancien fournisseur ne reviendront pas. Emprunts moins trésorerie : ${kE(DETTE_NETTE)} de dette nette. Stock au bilan : ${kE(STOCK_AFFICHE)}.`,
      },
      {
        id: "comparables",
        titre: "Rassembler les rachats de négoces de la région depuis trois ans",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sept négoces régionaux ont changé de mains : entre 5 et 6 fois l'EBE retraité, médiane 5,5 fois, en valeur d'entreprise. Le prix des titres s'en déduit en retirant la dette nette. Sérac Matériaux a racheté trois d'entre eux, à 5,4 ; 5,7 et 5,9 fois l'EBE retraité ; à Chambéry, il s'est retiré quand les enchères ont atteint 6 fois.",
      },
      {
        id: "synergies",
        titre: "Demander à Mounia Kherbache de chiffrer les synergies",
        cout: 0.5,
        nature: "decisive",
        resultat: `Synergies de coûts : ${kE(SYNERGIES.achats)} par an sur les achats, aux conditions d'Arvel, et ${kE(SYNERGIES.logistique)} de logistique, soit ${kE(VALEUR_SYNERGIES_COUTS)} de valeur au multiple de 5,5. Synergies de revenus, les ventes croisées : ${kE(SYNERGIES.revenus)} par an, ${kE(VALEUR_SYNERGIES_REVENUS)} de valeur. Sur nos deux derniers rachats, nous avons tenu ${taux(SYNERGIES.realisationCouts, 0)} des synergies de coûts, et un tiers seulement des synergies de revenus. Coûts d'intégration : ${kE(INTEGRATION)} ; frais de la transaction : ${kE(FRAIS_TRANSACTION)}.`,
      },
      {
        id: "banquier",
        titre: "Recevoir le banquier de la cédante",
        cout: 1,
        nature: "bruit",
        resultat:
          "Félicien Rabaud : « Un négoce familial de cette qualité, sans dette excessive, avec un tel ancrage : le marché est à six fois l'EBE, et Sérac est très motivé. En dessous de 8,5 M€, je ne suis pas sûr que vous passiez le premier tour. » Il ne parle que de l'EBE publié, et ne dit rien du chantier de Vizille.",
      },
      {
        id: "conseil",
        titre: "Appeler Aristide Malleval, administrateur d'Arvel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Aristide Malleval, ancien directeur financier d'un groupe de négoce : « Écris ton prix maximal avant d'entrer dans la salle : la cible seule, sur un EBE nettoyé de ce qui ne se répétera pas, plus les synergies dont tu es sûr, moins ce que le rachat coûte. Tout ce que tu paies au-delà, tu le donnes au vendeur. Et ne laisse jamais filer l'audit pour gagner deux semaines. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle offre indicative remettez-vous ?",
    options: [
      {
        t: "7,2 M€, sur l'EBE retraité, sous réserve d'audit, avec un prix plafond de 7,7 M€ arrêté en comité",
        d: "Une offre sous ce que la cédante espère ; le plafond reste interne.",
      },
      {
        t: "8,25 M€ : cinq fois et demie l'EBE de 1,5 M€, le multiple du marché",
        d: "L'offre que le banquier de la cédante attend ; elle passera le premier tour.",
      },
      {
        t: "7,9 M€ d'emblée, plus que Sérac ne paie d'habitude, pour l'écarter de la vente",
        d: "Une offre au-dessus de six fois l'EBE retraité ; Sérac aura du mal à suivre.",
      },
      {
        t: "Ne pas faire d'offre au premier tour, et voir comment Sérac se positionne",
        d: "Rien n'est engagé ; la cédante poursuit avec les autres candidats.",
      },
    ],
    reactions: [
      [
        {
          ...FELICIEN,
          texte:
            "Offre reçue. Je ne vous cache pas que Mme Mourgue espérait davantage, mais elle vous retient pour le second tour.",
        },
      ],
      [
        {
          ...FELICIEN,
          texte:
            "Offre reçue : Mme Mourgue y voit le signe d'un acquéreur sérieux. Vous êtes retenus pour le second tour.",
        },
      ],
      [
        {
          ...FELICIEN,
          texte:
            "Voilà une offre ! Mme Mourgue est très sensible à votre engagement. Vous êtes évidemment retenus pour le second tour.",
        },
      ],
      [
        {
          ...VIANNEY,
          texte:
            "Pas d'offre ? Sérac va avoir le champ libre. J'espère que tu sais ce que tu fais.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Auditer, ou prendre l'exclusivité",
    jusqua: 5,
    messages: (ctx) =>
      ctx.enLice
        ? [
            {
              ...FELICIEN,
              heure: "10:00",
              alerte: true,
              texte: `Deux offres sont retenues pour le second tour : la vôtre, ${ctx.offre}, et celle de Sérac, ${ctx.indicativeSerac}. La data room ouvre lundi ; offres fermes en semaine 6. Mme Mourgue vous fait aussi une proposition : quatre semaines d'exclusivité si vous ${ctx.exclusiviteDemande} et renoncez à un audit approfondi. Sérac serait écarté.`,
            },
            {
              ...VIANNEY,
              heure: "11:30",
              texte: `Prends l'exclusivité, Idriss. ${ctx.surcoutExclusivite}, et Sérac est dehors. Un audit, c'est trois semaines et 85 k€ pour nous dire ce qu'on sait déjà : c'est une belle maison.`,
            },
            {
              ...ROZENN,
              heure: "14:20",
              texte:
                "Le cabinet d'audit demande 85 k€ pour un audit complet (comptes, stocks, clients, social), 40 k€ pour les comptes et les stocks seulement. Résultats en semaine 5.",
            },
          ]
        : [
            {
              ...FELICIEN,
              heure: "10:00",
              texte: `Mme Mourgue a retenu l'offre de Sérac, ${ctx.indicativeSerac}, et poursuit avec lui seul. La data room lui est ouverte lundi.`,
            },
            {
              ...VIANNEY,
              heure: "11:30",
              alerte: true,
              texte:
                "Sérac est seul dans la data room. On ne peut plus rien faire, sauf espérer qu'il trébuche.",
            },
          ],
    reevaluation: true,
    sources: [
      {
        id: "auditeur",
        titre: "Demander au cabinet d'audit ce qu'il trouve d'habitude",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sixtine Penven : « Sur les négoces familiaux que nous auditons, quatre sur dix sont conformes à leurs comptes. Un sur trois a un stock surévalué : des références dormantes gardées au prix d'achat, souvent 10 à 15 % du stock. Un sur quatre dépend d'un client qui ne restera pas. L'audit complet trouve les deux ; l'audit des comptes et des stocks ne voit pas les clients ; la data room ne montre que ce que la cédante veut bien y mettre. Et une garantie de passif ne rattrape pas un stock surévalué : elle couvre des dettes, pas la valeur qu'on donnait aux marchandises. »",
      },
      {
        id: "dataroom",
        titre: "Parcourir la data room",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Bâtisseurs du Grésivaudan pèse 18 % du chiffre d'affaires ; leur contrat-cadre arrive à échéance en mars. Une note de l'expert-comptable signale un contrôle URSSAF en cours sur trois exercices. Anthelme Rostaing, le directeur commercial, suit en direct les trente plus gros artisans. Rien sur l'ancienneté du stock.",
      },
    ],
    question: "Que faites-vous avant l'offre ferme ?",
    options: [
      {
        t: "Lancer l'audit complet : comptes, inventaire contradictoire des stocks, contrats clients, social",
        d: "85 k€ et trois semaines ; Sérac reste dans la vente.",
      },
      {
        t: "Faire auditer les comptes et les stocks seulement",
        d: "40 k€ et trois semaines ; Sérac reste dans la vente.",
      },
      {
        t: "Prendre l'exclusivité au prix demandé, sans audit approfondi",
        d: "Au moins 7,8 M€ ; Sérac est écarté, le protocole se signe sur les comptes et la data room.",
      },
      {
        t: "S'en tenir à la data room, sans cabinet",
        d: "Rien à payer ; on lit ce que la cédante y a mis.",
      },
    ],
    reactions: [
      [
        {
          ...ROZENN,
          texte: "Le cabinet démarre lundi. Inventaire tournant dans les quatre agences.",
        },
      ],
      [{ ...ROZENN, texte: "Le cabinet démarre lundi, sur les comptes et les stocks." }],
      [
        {
          ...FELICIEN,
          texte:
            "Excellente décision. Mme Mourgue est ravie : nous informons Sérac que le processus est suspendu pour quatre semaines.",
        },
      ],
      [{ ...MOUNIA, texte: "J'ai mes accès à la data room. Je vous fais une synthèse." }],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'offre ferme",
    jusqua: 7,
    messages: (ctx) => [
      ctx.audit
        ? {
            ...SIXTINE,
            heure: "09:00",
            alerte: Boolean(ctx.risquesTrouves),
            texte: `Notre rapport est dans votre boîte. ${ctx.auditResume}`,
          }
        : {
            ...MOUNIA,
            heure: "09:00",
            texte: ctx.enLice
              ? "Sans audit, je n'ai rien de plus que les comptes et la data room. Je ne peux chiffrer aucun risque."
              : "Nous ne sommes plus dans la vente : rien à chiffrer.",
          },
      {
        ...VIANNEY,
        heure: "11:00",
        texte: ctx.enLice
          ? `Nous avons annoncé ${ctx.offre} à Mme Mourgue. Si on revient dessus maintenant, on passe pour des marchands de tapis, et Sérac ramasse la mise. Confirme, Idriss.`
          : "Sérac a le champ libre. Nos agences de Grenoble-Sud et de Moirans vont le sentir.",
      },
      {
        ...FELICIEN,
        heure: "16:45",
        texte: !ctx.enLice
          ? "Le processus se poursuit avec Sérac."
          : ctx.exclusif
            ? "Mme Mourgue attend votre offre ferme lundi, pour le protocole. Elle tient à ce que les engagements pris soient tenus."
            : "Je vous rappelle que les offres fermes sont attendues lundi. Mme Mourgue tient à ce que les engagements pris soient tenus.",
      },
    ],
    sources: [
      {
        id: "rapport",
        titre: "Reprendre le rapport d'audit poste par poste avec Mounia",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.enLice
            ? "Nous ne sommes plus dans la vente."
            : !ctx.audit
              ? "Sans audit, il n'y a rien à reprendre poste par poste : l'EBE, le stock et les clients sont ceux que la cédante présente. L'offre ne pourrait se revoir que par principe."
              : `${ctx.auditDetail} Offre révisée de ce que l'audit a chiffré : ${ctx.offreRevisee}. Prix plafond recalculé : ${ctx.plafondRevise}.`,
      },
      {
        id: "retrade",
        titre: "Demander à Ondine Lagrange comment la cédante prendra une baisse",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ondine Lagrange : « Revoir son prix de ce que l'audit découvre est admis : c'est l'objet de la réserve de votre lettre d'offre. Revenir sur ce que les comptes montraient déjà, ou baisser sans rien justifier, s'appelle un retrade. Quand ça arrive, une cédante sur deux rompt les discussions et se tourne vers l'autre acquéreur ; quatre sur dix quand la baisse est forfaitaire. »",
      },
    ],
    question: "Quelle offre ferme remettez-vous ?",
    options: [
      {
        t: "Confirmer l'offre annoncée : revenir dessus nous décrédibiliserait face à Sérac",
        d: "L'offre indicative devient ferme, au même prix ; le plafond ne change pas.",
      },
      {
        t: "Réviser l'offre poste par poste de ce que l'audit a chiffré, et recalculer le prix plafond",
        d: "Une offre justifiée ligne à ligne ; Sérac peut en profiter pour surenchérir.",
      },
      {
        t: "Baisser l'offre de 10 % pour se garder une marge de négociation",
        d: "Une offre ferme à 90 % de l'offre indicative ; le plafond ne change pas.",
      },
      {
        t: "Se retirer de la vente",
        d: "Les frais d'audit sont perdus ; Mourgue ira à Sérac.",
      },
    ],
    reactions: [
      [{ ...VIANNEY, texte: "Bien. Une parole est une parole." }],
      [
        {
          ...MOUNIA,
          texte:
            "L'offre ferme part avec l'annexe de l'audit, poste par poste. Le plafond est mis à jour.",
        },
      ],
      [{ ...FELICIEN, texte: "Je transmets. Je doute que Mme Mourgue apprécie." }],
      [
        {
          ...JEAN_BAPTISTE,
          texte:
            "Si les chiffres ne tiennent pas, on ne rachète pas. Mais je n'aime pas laisser Mourgue à Sérac.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le dernier tour",
    jusqua: 9,
    messages: (ctx) => [
      { ...FELICIEN, heure: "09:30", alerte: Boolean(ctx.enLice), texte: relanceDuBanquier(ctx) },
      {
        ...JEAN_BAPTISTE,
        heure: "12:10",
        texte: ctx.enLice
          ? "Idriss, je ne veux pas lire dans la presse que Mourgue est chez Sérac. Faites le nécessaire."
          : "Mourgue sera chez Sérac. Préparez nos agences de Grenoble-Sud et de Moirans à ce voisin.",
      },
      {
        ...VIANNEY,
        heure: "15:00",
        texte: ctx.enLice
          ? "250 k€ de plus sur 7 M€, c'est 3 %. On ne va pas perdre Mourgue pour ça."
          : "Sérac va casser les prix à Voiron et à Crolles pour se faire connaître. On va le sentir.",
      },
    ],
    sources: [
      {
        id: "plafond",
        titre: "Refaire avec Mounia le calcul du prix plafond",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.enLice
            ? `Nous ne sommes plus dans la vente. Si Sérac l'emporte, nos agences de Grenoble-Sud et de Moirans perdront environ ${ctx.perteSerac} de valeur.`
            : `Notre prix plafond, tel que nous l'avons arrêté : ${ctx.plafond}. Au-delà, nous payons au vendeur des synergies que nous n'aurons pas. Si Sérac l'emporte, nos agences de Grenoble-Sud et de Moirans perdront environ ${ctx.perteSerac} de valeur : c'est tout ce que vaut le fait de l'en empêcher, pas plus. ${ctx.complementPourEgaler}`,
      },
      {
        id: "serac",
        titre: "Chercher ce que Sérac peut encore payer, et qui regarde le dossier",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          !ctx.enLice
            ? "Sérac a fait son propre inventaire des stocks ; il signera dans les prochains jours."
            : ctx.serac === "surenchere"
              ? `Sérac a fait son propre inventaire des stocks, pas l'audit des clients. Son fonds n'est jamais allé au-delà de 5,9 fois l'EBE retraité, soit ${ctx.maxSerac}${ctx.stockSerac}. À Chambéry, il s'est retiré plutôt que d'aller au-delà.`
              : `${ctx.exclusif ? "Sérac attend la fin de votre exclusivité, sans accès à la data room." : "Sérac a fermé ses accès à la data room."} Aucun autre candidat ne l'a ouverte ni n'a signé d'accord de confidentialité : le « fonds » du banquier n'a pas d'existence connue.`,
      },
    ],
    question: "Que répondez-vous à la cédante ?",
    options: [
      {
        t: "Relever l'offre de 250 k€ au-dessus de la dernière enchère, ou du geste demandé : Mourgue ne doit pas nous échapper",
        d: "Le prix monte ; la signature est acquise.",
      },
      {
        t: "Suivre une surenchère jusqu'à notre prix plafond, pas au-delà ; sans surenchère, tenir l'offre",
        d: "Au-dessus du plafond, Mourgue ira à Sérac.",
      },
      {
        t: "Suivre jusqu'au plafond en prix ferme, et au-delà par un complément de prix versé seulement si l'EBE tient deux ans",
        d: "Le complément est limité à 800 k€. Sans surenchère, l'offre reste la même.",
      },
    ],
    reactions: [
      [
        {
          ...FELICIEN,
          texte: "Voilà qui devrait convaincre Mme Mourgue. Je vous rappelle très vite.",
        },
      ],
      [{ ...FELICIEN, texte: "Je transmets votre position à Mme Mourgue." }],
      [
        {
          ...FELICIEN,
          texte:
            "Un complément de prix… Mme Mourgue croit en son entreprise : l'idée peut lui plaire. Je transmets.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La garantie de passif",
    jusqua: 11,
    messages: (ctx) =>
      ctx.achete
        ? [
            {
              ...ONDINE,
              heure: "09:00",
              alerte: true,
              texte: `Le projet de contrat de cession est arrivé. La cédante propose une garantie d'actif et de passif plafonnée à 5 % du prix, soit ${ctx.garantieCedante}, avec une franchise de 50 k€, valable un an, sans séquestre ni caution bancaire.`,
            },
            {
              ...BERNADETTE,
              heure: "11:20",
              texte:
                "Monsieur Zerrouki, mes trois enfants attendent le produit de la vente. Je ne laisserai pas des centaines de milliers d'euros bloqués chez un notaire pendant un an et demi. Ma maison a toujours payé ses dettes.",
            },
            {
              ...ROZENN,
              heure: "15:40",
              texte: "Le closing est calé en semaine 12. Ne rouvrons pas tout pour une clause.",
            },
          ]
        : [
            {
              ...ROZENN,
              heure: "09:00",
              texte:
                "Mourgue est chez Sérac : pas de contrat de cession à négocier. Je classe le dossier.",
            },
          ],
    sources: [
      {
        id: "urssaf",
        titre: "Faire chiffrer le contrôle URSSAF en cours",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le contrôle porte sur 2023 à 2025 : les frais professionnels et les primes des chauffeurs. Sur ce type de dossier, un redressement de l'ordre de ${kE(PASSIF.montant)}, quatre fois sur dix. La lettre d'observations est attendue avant le closing. Une garantie plafonnée à 5 % du prix, avec 50 k€ de franchise, n'en couvrirait qu'une partie.`,
      },
      {
        id: "recouvrement",
        titre: "Demander à Ondine Lagrange ce que vaut une garantie sans séquestre",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Ondine Lagrange : « Une garantie vaut ce que vaut le garant. Mme Mourgue distribuera le prix à ses enfants dans l'année : sans séquestre ni caution, on récupère une fois sur deux, après un procès. Un séquestre de 10 % du prix, ${ctx.sequestre}, règle la question. Elle demandera sans doute une contrepartie sur le prix, de 30 à 100 k€. »`,
      },
    ],
    question: "Quelle garantie signez-vous ?",
    options: [
      {
        t: "Accepter la garantie proposée par la cédante, pour ne pas compromettre la signature",
        d: "5 % du prix, franchise 50 k€, un an ; rien sous séquestre.",
      },
      {
        t: "Exiger une garantie de 15 % du prix sur trois ans, dont 10 % du prix sous séquestre pendant dix-huit mois",
        d: "La cédante demandera une contrepartie sur le prix.",
      },
      {
        t: "Renoncer à toute garantie contre une baisse de prix de 50 k€",
        d: "50 k€ de moins à payer ; plus aucun recours après le closing.",
      },
    ],
    reactions: [
      [{ ...ONDINE, texte: "C'est noté : la garantie de la cédante, telle quelle." }],
      null,
      [
        {
          ...BERNADETTE,
          texte: "Voilà qui est raisonnable. 50 k€ de moins, et l'on n'en parle plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le directeur commercial",
    jusqua: 13,
    messages: (ctx) =>
      ctx.achete
        ? [
            {
              ...ANTHELME,
              heure: "08:10",
              alerte: true,
              texte:
                "Monsieur Zerrouki, je préfère vous le dire avant le closing : Sérac m'a fait une offre la semaine dernière. Je n'ai rien décidé. Je voudrais savoir ce que je deviens chez Arvel.",
            },
            {
              ...BERNADETTE,
              heure: "10:00",
              texte:
                "Anthelme est chez nous depuis vingt-deux ans. Il restera, je le connais. Signons, maintenant.",
            },
            {
              ...ROZENN,
              heure: "14:30",
              texte: "Closing mardi en huit. Tous les actes sont prêts.",
            },
          ]
        : [
            {
              ...VIANNEY,
              heure: "08:10",
              texte:
                "Sérac a débauché deux commerciaux de Mourgue pour ses nouvelles agences. Nos clients de Moirans reçoivent déjà ses tarifs.",
            },
          ],
    sources: [
      {
        id: "portefeuille",
        titre: "Analyser le portefeuille d'Anthelme Rostaing",
        cout: 0.5,
        nature: "decisive",
        resultat: `Il suit en direct les trente plus gros artisans de Mourgue, un tiers de sa marge, et c'est sur lui que reposent les ventes croisées. S'il part, ses clients emportent environ 60 k€ d'EBE par an, ${kE(DIRECTEUR.clients)} de valeur, et les synergies de revenus avec eux. Dans le négoce, un directeur commercial sollicité par un concurrent pendant une cession part dans l'année presque une fois sur deux ; sous une clause de non-concurrence, il n'emmène qu'un tiers de ses clients.`,
      },
      {
        id: "precedents",
        titre: "Relire ce qui s'est passé à Bourgoin et à Annonay",
        cout: 0.5,
        nature: "utile",
        resultat:
          "À Bourgoin, le directeur commercial est parti six mois après le closing, sans que rien n'ait été prévu : la moitié des ventes croisées ne s'est jamais faite. À Annonay, une prime de fidélisation sur deux ans, signée avant le closing, l'a gardé ; il dirige aujourd'hui les ventes de trois agences.",
      },
    ],
    question: "Que faites-vous avant le closing ?",
    options: [
      {
        t: "Signer le closing sans attendre : son contrat de travail le lie, on verra ensuite",
        d: "Rien à payer ; le closing a lieu en semaine 12.",
      },
      {
        t: "Faire d'un accord de fidélisation avec lui une condition du closing : 100 k€ de prime sur deux ans",
        d: "Versée à 12 et 24 mois, s'il est toujours là.",
      },
      {
        t: "Lui faire signer une clause de non-concurrence de deux ans, payée 50 k€",
        d: "Il peut partir, mais pas chez un concurrent de la région.",
      },
      {
        t: "Demander à la cédante une baisse de prix de 150 k€ au titre du risque",
        d: "Elle acceptera, ou pas ; rien n'est proposé au directeur commercial.",
      },
    ],
    reactions: [
      [{ ...ROZENN, texte: "Parfait : closing mardi en huit." }],
      [
        {
          ...ANTHELME,
          texte:
            "Merci. C'est la reconnaissance que j'attendais. Je décline l'offre de Sérac, et je signe.",
        },
      ],
      [
        {
          ...ANTHELME,
          texte: "Je signe la clause. Mais je vous avoue que ce n'est pas ce que j'espérais.",
        },
      ],
      null,
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le prix avant l'enchère", chemin: [0, 0, 1, 2, 1, 1] },
  { nom: "Gagner la cible", chemin: [2, 2, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 0, 1, 0, 0] },
] as const;

/**
 * Les réflexes de l'acquéreur pressé : surenchérir pour écarter le
 * concurrent, renoncer à l'audit pour aller vite, défendre l'offre annoncée
 * plutôt que la réviser, suivre l'enchère quel qu'en soit le prix, et
 * signer sans protéger ce qui reste incertain. [décision, option]
 */
export const REFLEXES = [
  [0, 2],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  sequestreAccepte:
    "Mme Mourgue accepte la garantie de 15 % sur trois ans et le séquestre, contre 30 k€ de plus sur le prix. C'est signé.",
  sequestreCher:
    "Mme Mourgue finit par accepter le séquestre, mais pas à moins de 100 k€ de plus sur le prix. Ses enfants y tenaient. C'est signé.",
  baisseAcceptee:
    "Mme Mourgue accepte de baisser le prix de 150 k€. « Anthelme restera, vous verrez. »",
  baisseRefusee:
    "Mme Mourgue refuse : « Anthelme n'est pas à vendre, et mon prix non plus. » Le prix ne bouge pas.",
} as const;
