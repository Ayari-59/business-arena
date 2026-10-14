/**
 * LE PRIX QUI NE PASSE PLUS — le contenu de l'épisode.
 *
 * Malik Ziani construit la politique de prix d'Arvel Distribution pour la
 * région lyonnaise : le tarif de cinq agences, et les règles qui disent ce
 * qu'un commercial peut accorder. Les coûts d'achat ont pris 6 %, la marge
 * fond, les remises dérogatoires grimpent, et la direction veut une hausse.
 * Six décisions, chacune précédée de ce qu'un responsable des prix reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "bloc",
    t: "Le prix est piloté d'un seul bloc : les remises fuient là où personne ne compare, et ceux qui comparent partiraient sur une hausse uniforme",
  },
  {
    id: "couts",
    t: "Les coûts ont pris 6 % et le tarif n'a pas suivi : il faut répercuter la hausse",
  },
  {
    id: "concurrence",
    t: "Altinéo casse ses prix : la région n'est plus compétitive",
  },
  {
    id: "volume",
    t: "Les volumes baissent : c'est un problème commercial, pas un problème de prix",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La marge fond",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord de la région",
        role: "Alerte automatique",
        heure: "07:40",
        alerte: true,
        texte:
          "Taux de marge commerciale la semaine dernière : 24,2 %, contre 29,9 % il y a un an. Remises dérogatoires : 3,4 % du chiffre d'affaires, contre 1,5 %.",
      },
      {
        de: "Régis Lachaux",
        role: "Directeur régional",
        heure: "08:15",
        texte:
          "Malik, nos achats ont pris 6 % en deux mois et nous n'avons rien répercuté. Je veux une hausse des prix de vente au 1er du mois : +6 %, comme les coûts. Dis-moi vendredi comment tu la construis.",
      },
      {
        de: "Dimitri Marquet",
        role: "Technico-commercial, Est lyonnais",
        heure: "09:30",
        texte:
          "Si on passe +6 % sur le ciment, je perds la moitié de mes maçons dans le mois. Ils ont le tarif d'Altinéo dans la poche.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "elasticite",
        titre: "Reprendre ce qu'a donné la dernière hausse, famille par famille",
        cout: 1,
        nature: "decisive",
        resultat:
          "En 2024, +4 % sur tout le tarif, Altinéo n'avait pas bougé : le gros œuvre a perdu 11 % de volume en six semaines, et les maçons partis ont emporté une partie de leurs achats de technique. Fixations et étanchéité : −1,5 %. Livraisons et découpes : rien. Sept devis comparés sur dix portent sur quarante références de gros œuvre : ciment, parpaings, plaque standard, rond à béton. La technique et les services ne sont presque jamais chiffrés ailleurs.",
      },
      {
        id: "derogations",
        titre: "Extraire les remises dérogatoires des trois derniers mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "3,4 % du chiffre d'affaires, contre 1,5 % il y a un an. 58 % portent sur la technique et les services, où aucun concurrent ne propose de prix comparable. Motif saisi : « fidélité » ou « pour ne pas le perdre » dans deux cas sur trois ; un devis concurrent est joint dans un cas sur six. Un commercial peut accorder jusqu'à 15 % sans demander l'accord de personne.",
      },
      {
        id: "concurrence",
        titre: "Relever les prix d'Altinéo sur cinquante références",
        cout: 1,
        nature: "utile",
        resultat:
          "Altinéo annonce +2 % sur le gros œuvre au 1er du mois, et rien sur le reste. Le sac de ciment de 35 kg : 9,45 € chez lui, 9,30 € chez vous. Sur la technique, ses prix sont 4 à 9 % au-dessus des vôtres ; il ne livre pas avant 10 heures.",
      },
      {
        id: "regions",
        titre: "Comparer votre taux de marge à celui des autres régions",
        cout: 1,
        nature: "bruit",
        resultat:
          "24,2 % chez vous, 25,1 % en moyenne dans le groupe. Toutes les régions ont perdu entre quatre et six points depuis la hausse des coûts. Rien qui vous distingue.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Chantal Ngoma, la plus ancienne directrice d'agence",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Chantal : « Avant de toucher au tarif, regarde où partent nos remises, et qui compare vraiment. Un maçon connaît le prix du ciment ; personne ne connaît le prix d'une cheville chimique. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment construisez-vous la hausse ?",
    options: [
      {
        t: "Passer +6 % sur tout le tarif au 1er du mois",
        d: "La demande de la direction, telle quelle : une hausse simple à annoncer, la même pour tous.",
      },
      {
        t: "Différencier la hausse : +2 % sur le gros œuvre, +9 % sur la technique, +15 % sur les services",
        d: "Le gros œuvre aligné sur Altinéo, la livraison facturée sous 250 € de commande. Un tarif à refaire famille par famille avant la fin de la semaine.",
      },
      {
        t: "Ne rien augmenter ce trimestre, pour ne perdre aucun client",
        d: "Le tarif reste tel quel ; la marge absorbe la hausse des coûts.",
      },
      {
        t: "Répercuter le coût famille par famille : +7,5 % sur le gros œuvre, +4,5 % sur la technique, +4 % sur les services",
        d: "Chaque famille reprend exactement ce que ses achats ont pris. Facile à justifier devant un client.",
      },
    ],
    reactions: [
      [
        {
          de: "Dimitri Marquet",
          role: "Technico-commercial, Est lyonnais",
          texte:
            "La grille est partie. Trois maçons m'ont déjà appelé : le ciment est plus cher chez nous que chez Altinéo.",
        },
      ],
      [
        {
          de: "Soraya Benhamou",
          role: "Vendeuse comptoir, agence de Vaulx-en-Velin",
          texte:
            "Le ciment n'a presque pas bougé, personne n'a rien dit. La livraison facturée, deux clients ont râlé, puis ont regroupé leurs commandes.",
        },
      ],
      [
        {
          de: "Régis Lachaux",
          role: "Directeur régional",
          texte:
            "Pas de hausse ? Alors explique-moi comment tu tiens le budget avec 6 % de coûts en plus.",
        },
      ],
      [
        {
          de: "Dimitri Marquet",
          role: "Technico-commercial, Est lyonnais",
          texte:
            "Plus 7,5 % sur le ciment et les parpaings. Les maçons comparent au centime, Malik. Ils vont comparer.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Les dérogations s'envolent",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Ingrid Solano",
        role: "Contrôle de gestion",
        heure: "17:10",
        alerte: true,
        texte: `Remises dérogatoires en semaine 3 : ${ctx.remises} du chiffre d'affaires. Hausse réellement encaissée, remises comprises : ${ctx.hausseNette}, pour ${ctx.hausseAffichee} affichée au tarif.`,
      },
      {
        de: "Mamadou Kanté",
        role: "Directeur des ventes, région",
        heure: "17:40",
        texte: ctx.sansHausse
          ? "Pas de hausse, donc rien à expliquer aux clients. Mais les remises continuent de monter : c'est devenu une habitude, et je ne vais pas la reprocher à des gens qui gardent leurs clients."
          : ctx.baseHaute
            ? "Mes commerciaux se font assaillir depuis la hausse, surtout sur le ciment et les parpaings. Ils accordent ce qu'il faut pour garder leurs clients ; je ne vais pas le leur reprocher."
            : "La hausse passe mieux que je ne le craignais. Quelques clients la contestent, et les commerciaux font un geste quand il le faut ; je ne vais pas le leur reprocher.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "detail",
        titre: "Lire les dérogations de la semaine, ligne par ligne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.remises} du chiffre d'affaires cette semaine. 62 % des remises portent sur des fixations, de l'étanchéité et des livraisons, que personne ne fait chiffrer ailleurs ; un devis concurrent est joint dans un cas sur six. Cinq commerciaux sur vingt-deux accordent la moitié des dérogations. ${
            ctx.sansHausse
              ? "Le motif le plus fréquent : « client ancien »."
              : "Le motif le plus fréquent : « hausse contestée » — y compris sur des familles où la hausse est passée sans un mot."
          }`,
      },
      {
        id: "alpes",
        titre: "Demander aux autres régions comment elles tiennent leurs remises",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La région Alpes a une grille de délégation depuis un an : jusqu'à 3 % le commercial, jusqu'à 6 % le chef d'agence, au-delà la région, et un devis concurrent exigé au-delà de 3 %. Ses dérogations sont à 1,7 % du chiffre d'affaires ; ses volumes n'ont pas bougé. La région Est a tout interdit l'an dernier : elle a perdu deux grands comptes en un mois.",
      },
    ],
    question: "Que faites-vous des remises dérogatoires ?",
    options: [
      {
        t: "Interdire toute remise dérogatoire à partir de lundi",
        d: "Plus aucune remise hors tarif, sans exception. Effet immédiat sur la marge.",
      },
      {
        t: "Encadrer : une grille de délégation, un motif et un devis concurrent au-delà de 3 %, une revue chaque lundi",
        d: "Les commerciaux gardent la main jusqu'à 3 %, les chefs d'agence jusqu'à 6 %. Une heure par semaine avec le contrôle de gestion : 400 € de temps.",
      },
      {
        t: "Laisser les commerciaux juges : ils connaissent leurs clients",
        d: "Pas de nouvelle règle. Le suivi reste mensuel.",
      },
      {
        t: "Proposer à la direction de calculer la prime des commerciaux sur la marge plutôt que sur le chiffre d'affaires",
        d: "Dès le mois prochain si la direction l'accepte. Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte:
            "Plus aucune dérogation ? J'ai deux clients avec un devis d'Altinéo sur le bureau. Je leur dis quoi ?",
        },
      ],
      [
        {
          de: "Mamadou Kanté",
          role: "Directeur des ventes, région",
          texte:
            "La grille est claire. Les commerciaux râlent sur le devis à joindre, mais ils savent enfin jusqu'où ils peuvent aller.",
        },
      ],
      [
        {
          de: "Dimitri Marquet",
          role: "Technico-commercial, Est lyonnais",
          texte: "Merci de nous faire confiance. On fera au mieux pour garder les clients.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Les commerciaux ne savent plus quoi répondre",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Mamadou Kanté",
        role: "Directeur des ventes, région",
        heure: "08:50",
        alerte: true,
        texte:
          "Réunion commerciale hier : la moitié de l'équipe dit ne pas savoir quoi répondre quand un client conteste un prix. Ils me demandent des consignes.",
      },
      {
        de: "Gaëtan Rigaud",
        role: "Maçon à Brignais, client",
        heure: "11:20",
        texte: ctx.sansHausse
          ? "Votre commercial m'a fait 5 % sans que je demande rien. Si vous avez de la marge à donner, je prends."
          : "Votre commercial m'annonce une hausse « parce que c'est la direction ». Moi, quand mes prix bougent, j'explique pourquoi à mes clients.",
      },
      {
        de: "Tableau de bord de la région",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Volumes du gros œuvre en semaine 5 : ${ctx.volumeBase} de leur niveau d'avant la hausse. Taux de marge : ${ctx.taux}.`,
      },
    ],
    sources: [
      {
        id: "tournee",
        titre: "Accompagner Dimitri une journée en tournée",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur neuf clients visités, six parlent des prix. Dimitri n'a rien d'autre à répondre que « c'est la direction », et propose une remise dans quatre cas. Deux clients auraient accepté une alternative s'il l'avait eue : l'enlèvement en agence plutôt que la livraison, une gamme équivalente moins chère. Aucun n'a parlé d'acheter sa technique ailleurs.",
      },
    ],
    question: "Comment armez-vous les commerciaux ?",
    options: [
      {
        t: "Envoyer la grille tarifaire aux commerciaux, avec une note",
        d: "Deux pages : les nouveaux prix et le calendrier. Ne coûte rien.",
      },
      {
        t: "Réunir chaque équipe une demi-journée : pourquoi la hausse, comment la présenter, quelles alternatives proposer",
        d: "Un argumentaire, les lettres de hausse des fournisseurs à montrer, l'enlèvement et la gamme équivalente à proposer. 3 000 €, et une demi-journée de vente en moins.",
      },
      {
        t: "Fixer à chaque commercial un objectif de volume pour compenser",
        d: "+5 % de tonnage d'ici la fin du trimestre, suivi chaque semaine.",
      },
      {
        t: "Écrire à tous les clients pour expliquer la hausse",
        d: "Un courrier de la direction régionale : les matières, l'énergie, le transport. 1 500 €.",
      },
    ],
    reactions: [
      [
        {
          de: "Soraya Benhamou",
          role: "Vendeuse comptoir, agence de Vaulx-en-Velin",
          texte:
            "J'ai lu la note. Au comptoir, ça ne change pas grand-chose : les clients posent la question, je réponds que c'est le tarif.",
        },
      ],
      [
        {
          de: "Dimitri Marquet",
          role: "Technico-commercial, Est lyonnais",
          texte:
            "Hier, j'ai montré à un plaquiste la lettre de hausse de notre fournisseur et proposé l'enlèvement en agence. Il a signé sans remise.",
        },
      ],
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte:
            "Plus 5 % de tonnage ? Je vais le trouver sur le ciment, avec une remise. C'est le seul moyen rapide.",
        },
      ],
      [
        {
          de: "Gaëtan Rigaud",
          role: "Maçon à Brignais, client",
          texte:
            "J'ai reçu votre courrier, c'est clair. Votre commercial, lui, m'a quand même proposé 5 %.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Altinéo prépare quelque chose",
    jusqua: 9,
    messages: () => [
      {
        de: "Florian Duchêne",
        role: "Commercial grands comptes",
        heure: "10:05",
        alerte: true,
        texte:
          "Deux clients me disent qu'Altinéo prépare une opération sur le gros œuvre pour la semaine 9 : ciment, parpaings, plaque standard, −6 % pendant trois semaines. Rien n'est sûr.",
      },
      {
        de: "Régis Lachaux",
        role: "Directeur régional",
        heure: "11:30",
        texte:
          "Si Altinéo attaque, je ne veux pas perdre le gros œuvre. Mais je ne veux pas non plus d'une guerre des prix. Propose-moi quelque chose.",
      },
    ],
    sources: [
      {
        id: "rumeur",
        titre: "Appeler trois clients qui achètent aussi chez Altinéo",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.baseHaute
            ? "Les trois confirment que l'opération est en discussion. Un maçon : « Ils savent que vous êtes devenus chers sur le gros œuvre, ils vont en profiter. » Elle porterait sur une quarantaine de références d'appel."
            : "Deux sur trois en ont entendu parler, sans plus. Un maçon : « Sur le ciment, vous êtes au même prix qu'eux ; ils n'ont pas grand-chose à y gagner. » Elle porterait sur une quarantaine de références d'appel.",
      },
      {
        id: "exposition",
        titre: "Mesurer ce que pèsent les références d'appel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les quarante références d'appel font 40 % du chiffre d'affaires du gros œuvre, et trente-cinq clients en achètent les deux tiers. Lors de la dernière opération d'Altinéo, en 2024, un client du gros œuvre sur cinq est allé voir pendant trois semaines, et un sur dix n'est pas revenu.",
      },
    ],
    question: "Comment vous préparez-vous ?",
    options: [
      {
        t: "Baisser tout de suite le gros œuvre de 5 % pour couper l'herbe sous le pied d'Altinéo",
        d: "Sur toute la famille, jusqu'à la fin du trimestre. Effet immédiat, et Altinéo n'a plus d'argument.",
      },
      {
        t: "Préparer une riposte ciblée : s'aligner sur les références d'appel, pendant l'opération seulement, pour les clients qui montrent l'offre",
        d: "Une consigne et une liste prêtes ; les commerciaux s'alignent au cas par cas. Ne coûte que si Altinéo attaque.",
      },
      {
        t: "Ne rien faire : ce n'est qu'une rumeur",
        d: "On verra bien si elle se confirme.",
      },
      {
        t: "Garantir par écrit à vos trente-cinq plus gros clients l'alignement sur toute offre concurrente jusqu'à la fin du trimestre",
        d: "Ils n'ont plus de raison d'aller voir ailleurs. Chaque devis qu'ils rapportent se paie, opération ou pas.",
      },
    ],
    reactions: [
      [
        {
          de: "Régis Lachaux",
          role: "Directeur régional",
          texte:
            "La baisse est passée lundi. Les maçons sont contents ; la marge du gros œuvre, beaucoup moins.",
        },
      ],
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte:
            "La liste des quarante références est dans l'outil de devis, avec la consigne. Si un client montre l'offre, on sait quoi faire.",
        },
      ],
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte: "Je garde l'oreille tendue.",
        },
      ],
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte:
            "Les lettres sont parties. Trois clients m'ont déjà envoyé des devis de petits négoces pour faire jouer la garantie.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Garon Bâtiment veut ses anciens prix",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Benjamin Albertini",
        role: "Responsable achats, Garon Bâtiment",
        heure: "09:10",
        alerte: true,
        texte: ctx.sansHausse
          ? "Monsieur Ziani, Altinéo nous propose ses prix de gros œuvre garantis six mois. Je veux 3 % de plus sur tout ce que nous achetons chez vous, sinon nous consultons pour le second semestre."
          : "Monsieur Ziani, vos prix ont augmenté sans que personne vienne nous en parler. Je veux revenir aux conditions d'avant, sinon nous consultons pour le second semestre.",
      },
      {
        de: "Florian Duchêne",
        role: "Commercial grands comptes",
        heure: "09:40",
        texte:
          "C'est mon plus gros client. Je peux lui faire 6 % sur tout et on n'en parle plus. Tu me dis.",
      },
    ],
    sources: [
      {
        id: "compte",
        titre: "Analyser les achats de Garon Bâtiment sur un an",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "9 % du chiffre d'affaires de la région. 60 % de gros œuvre, qu'il fait chiffrer chez Altinéo à chaque chantier ; 40 % de technique, qu'il n'a jamais fait chiffrer ailleurs : ses chefs de chantier veulent vos fixations et votre livraison à 7 heures. Il a menacé de consulter deux fois en trois ans, et l'a fait une fois, pour moitié.",
      },
      {
        id: "precedent",
        titre: "Demander à Florian ce que savent les autres grands comptes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les acheteurs des grands comptes de la région se connaissent. L'an dernier, après un geste de fin d'année accordé à Garon, deux d'entre eux ont demandé « les conditions de Garon » dans le mois.",
      },
    ],
    question: "Que répondez-vous à Garon Bâtiment ?",
    options: [
      {
        t: "Lui accorder ce qu'il demande",
        d: "Ses conditions d'avant, et au moins 3 % sur tout ce qu'il achète. Il reste, c'est sûr.",
      },
      {
        t: "Le recevoir avec Florian : expliquer la hausse, tenir la technique, offrir un prix ferme sur le gros œuvre contre un engagement de volume",
        d: "Un rendez-vous chez lui la semaine prochaine. Il peut accepter, ou consulter quand même.",
      },
      {
        t: "Refuser : le tarif est le même pour tous",
        d: "Un courrier poli et ferme. Il peut s'en contenter, ou consulter.",
      },
      {
        t: "Laisser Florian négocier",
        d: "Il connaît le client ; il parle de 6 % sur tout.",
      },
    ],
    reactions: [
      [
        {
          de: "Benjamin Albertini",
          role: "Responsable achats, Garon Bâtiment",
          texte: "Merci. Je savais qu'on finirait par s'entendre.",
        },
      ],
      null,
      null,
      [
        {
          de: "Florian Duchêne",
          role: "Commercial grands comptes",
          texte:
            "C'est réglé : 6 % sur tout, il reste. Il m'a demandé de ne pas le dire aux autres.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Régis Lachaux",
        role: "Directeur régional",
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant la clôture. Taux de marge en semaine 11 : ${ctx.taux}. Mamadou propose 3 % de remise sur tout pour finir le trimestre en volume. Qu'en penses-tu ?`,
      },
      {
        de: "Ingrid Solano",
        role: "Contrôle de gestion",
        heure: "10:15",
        texte: `Remises dérogatoires en semaine 11 : ${ctx.remises} du chiffre d'affaires.`,
      },
    ],
    sources: [
      {
        id: "fuites",
        titre: "Rapprocher les bons de livraison des factures du trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Livraisons express, découpes, palettes consignées : à peu près 2 800 € par semaine de prestations sont faites sans être facturées, sans que personne l'ait décidé. ${
            ctx.encadre
              ? "Les dérogations, elles, sont tenues : la grille fonctionne, il reste peu à reprendre."
              : `Les dérogations sont à ${ctx.remises} du chiffre d'affaires ; une sur deux ne porte ni motif ni devis.`
          }`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Accorder 3 % de remise sur tout pour les deux dernières semaines",
        d: "Du volume pour finir le trimestre, et des commerciaux contents.",
      },
      {
        t: "Facturer ce qui est fait sans être facturé : livraisons express, découpes, palettes",
        d: "Une consigne aux agences et un contrôle des bons de livraison. Quelques clients surpris.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
      {
        t: "Revoir les dérogations client par client avec chaque commercial, et revenir au tarif là où rien ne les justifie",
        d: "Deux jours de revue avec le contrôle de gestion et les chefs d'agence. Quelques clients à rappeler.",
      },
    ],
    reactions: [
      [
        {
          de: "Mamadou Kanté",
          role: "Directeur des ventes, région",
          texte:
            "Les commerciaux ont fait le plein de commandes. La marge de la semaine, je préfère ne pas la regarder.",
        },
      ],
      [
        {
          de: "Aïcha Mesbah",
          role: "Responsable logistique, région",
          texte:
            "Les chauffeurs font signer les bons avec le supplément. Deux clients ont demandé pourquoi ; aucun n'a refusé.",
        },
      ],
      [
        {
          de: "Régis Lachaux",
          role: "Directeur régional",
          texte: "Le trimestre se termine. On fera le point lundi.",
        },
      ],
      [
        {
          de: "Ingrid Solano",
          role: "Contrôle de gestion",
          texte:
            "La revue est faite. Les clients sans motif sont revenus au tarif ; Florian a défendu les siens un par un.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Différencier, encadrer, accompagner", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Le prix d'un seul bloc", chemin: [0, 2, 2, 0, 0, 0] },
  { nom: "Attentiste", chemin: [2, 2, 0, 2, 3, 2] },
] as const;

/**
 * Les réflexes du métier sous pression sur les prix : appliquer le même
 * chiffre à tout le monde (+6 % partout, aucune dérogation, −5 % sur toute la
 * famille), ou céder de peur de perdre (ne rien augmenter, acheter du volume,
 * rendre ses prix au client qui menace, remise de fin de trimestre) :
 * [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 2],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  primeAcceptee:
    "D'accord pour essayer : à partir du mois prochain, la moitié de la prime de vos commerciaux sera calculée sur la marge. On fera le bilan à la fin du trimestre.",
  primeRefusee:
    "Pas ce trimestre : le plan de rémunération est signé jusqu'en décembre et les autres régions ne suivraient pas. On en reparle à la prochaine négociation.",
  operation:
    "Altinéo a lancé son opération lundi : −6 % sur le ciment, les parpaings et la plaque standard, pendant trois semaines. Les maçons l'ont tous reçue par SMS.",
  pasDOperation:
    "Finalement, Altinéo n'a rien lancé : ses agences ont manqué de ciment, et l'opération est repoussée sine die.",
  garonAccord:
    "Votre proposition nous va : prix ferme sur le gros œuvre jusqu'en juin, et nous passons chez vous les commandes de nos deux nouveaux chantiers. Le reste du tarif, je l'entends.",
  garonPartielRendezVous:
    "Merci d'être venus. Mais votre prix ferme ne suffit pas : nous mettons la moitié de nos achats en consultation dès la semaine prochaine.",
  garonGarde:
    "J'ai bien reçu votre courrier. Je ne suis pas content, mais vos fixations et votre livraison à 7 heures, je ne les trouve pas ailleurs. Nous restons.",
  garonPartielRefus:
    "Puisque le tarif est le même pour tous, nous allons voir ailleurs pour une bonne partie de nos achats. Le gros œuvre part chez Altinéo dès lundi.",
} as const;
