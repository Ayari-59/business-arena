/**
 * LE LOT QU'IL FAUT PEUT-ÊTRE RAPPELER — le contenu de l'épisode.
 *
 * Annaïg Le Dantec est la responsable qualité de la Laiterie de Kerbrélan.
 * Un vendredi à 17 h, l'autocontrôle d'un lot de fromage blanc de l'usine de
 * Pontivy revient présomptif positif à Listeria monocytogenes ; les palettes
 * sont parties chez Celtis et Opaline, la confirmation demande 48 à 72 heures,
 * et le directeur commercial demande d'attendre. Six décisions, d'octobre à
 * décembre, chacune précédée de ce qu'une responsable qualité reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Entreprise, enseignes, personnes et chiffres sont fictifs. Les institutions
 * sont nommées par leur fonction.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "perimetre",
    t: "Une contamination après pasteurisation peut toucher tout ce que la ligne 3 a rempli entre deux nettoyages complets : le risque est déjà en rayon, et son périmètre se lit dans les enregistrements de la ligne",
  },
  {
    id: "lot",
    t: "Le lot L3-279-K est contaminé : c'est ce lot-là qu'il faut sortir des rayons",
  },
  {
    id: "presomptif",
    t: "Un résultat présomptif n'est pas un résultat : tant que le laboratoire n'a pas confirmé, le vrai risque est d'affoler les enseignes pour rien",
  },
  {
    id: "lait",
    t: "Le lait d'une exploitation de la collecte était contaminé : c'est l'amont qu'il faut remonter, et tout ce qui a été fabriqué avec ce lait",
  },
] as const;

const BLEUNVENN = {
  de: "Bleunvenn Coatanéa",
  role: "Laborantine, contrôle qualité de Pontivy",
} as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const CHINWE = {
  de: "Chinwe Okonkwo",
  role: "Microbiologiste, laboratoire départemental d'analyses",
} as const;
const ZBIGNIEW = { de: "Zbigniew Galliou", role: "Technicien de maintenance, Pontivy" } as const;
const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const TREPHINE = { de: "Tréphine Laouénan", role: "Directrice qualité, Celtis" } as const;
const TIEMOKO = { de: "Tiémoko Larvor", role: "Chef de groupe ultra-frais, Opaline" } as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const LANSANA = { de: "Lansana Kerangal", role: "Chef d'équipe de la ligne 3, Pontivy" } as const;
export const DDPP = {
  de: "DDPP du Morbihan",
  role: "Service de la sécurité sanitaire des aliments",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · vendredi, 17 h",
    titre: "Présomptif positif",
    jusqua: 1,
    messages: () => [
      {
        ...BLEUNVENN,
        heure: "17:04",
        alerte: true,
        texte:
          "Annaïg, le laboratoire départemental vient d'appeler : autocontrôle du lot L3-279-K, fromage blanc Kerbrélan 500 g rempli mardi sur la ligne 3, présomptif positif à Listeria monocytogenes. Confirmation, identification et dénombrement, lundi soir, mardi midi au plus tard.",
      },
      {
        ...YSEE,
        heure: "17:20",
        texte:
          "Le L3-279-K est parti mercredi vers l'entrepôt Celtis de Plérin et l'entrepôt Opaline de Vannes, comme les lots de lundi et de mercredi. Seules six palettes du L3-280-C sont encore à quai, départ lundi. Un pot passe deux jours en entrepôt et trois à six jours en rayon : ce soir, à peu près deux palettes expédiées sur trois sont encore en entrepôt ou en magasin ; lundi soir, il en restera quatre sur dix.",
      },
      {
        ...BAPTISTIN,
        heure: "17:41",
        texte:
          "Annaïg, un présomptif, ce n'est pas un résultat. Si on appelle Celtis un vendredi soir pour rien, on y laisse le contrat du fromage blanc à leur marque. Attendons la confirmation de lundi, et on avisera.",
      },
      {
        ...FANCHON,
        heure: "17:55",
        texte:
          "La ligne 3 s'arrête ce soir pour le week-end ; elle redémarre lundi après la NEP de 5 h. Dis-moi ce que tu veux qu'on fasse d'ici là.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "enregistrements",
        titre: "Tirer les enregistrements de la ligne 3 et des NEP de la semaine",
        cout: 1,
        nature: "decisive",
        resultat:
          "NEP complètes de la ligne 3 (soude, acide, désinfection) : lundi à 5 h et jeudi à 5 h. Entre les deux, deux rinçages à l'eau chaude aux changements de format, mardi 13 h 40 et mercredi 14 h 10 : des rinçages, pas des nettoyages. Lots remplis entre les deux NEP : L3-278-K, Kerbrélan 500 g, 7 palettes ; L3-278-C, MDD Celtis 1 kg, 5 ; L3-279-K, Kerbrélan 500 g, 7 (le lot présomptif) ; L3-279-O, MDD Opaline 500 g, 5 ; L3-280-K, Kerbrélan 500 g, 7 ; L3-280-C, MDD Celtis 1 kg, 6, encore à quai. Mardi à 13 h 20, avant le changement de format, la maintenance a changé le joint d'une vanne de dosage de la remplisseuse. Après la NEP de jeudi : quatre lots, 24 palettes, dont les 12 de vendredi à quai.",
      },
      {
        id: "reglement",
        titre:
          "Relire le règlement sur la sécurité des aliments et le guide de gestion des alertes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Article 19 du règlement européen sur la sécurité des aliments : l'exploitant qui considère ou a des raisons de penser qu'une denrée qu'il a mise sur le marché n'est pas sûre engage immédiatement son retrait et en informe les autorités compétentes. Le guide de gestion des alertes d'origine alimentaire : à défaut d'éléments plus précis, le périmètre d'un retrait couvre tous les lots produits entre deux nettoyages-désinfections complets de la ligne ; un rinçage ne le borne pas. Un rappel des consommateurs s'ajoute au retrait quand le danger est confirmé dans un produit déjà vendu. Le laboratoire est tenu, lui aussi, de transmettre à l'administration un résultat qui montre qu'une denrée peut être préjudiciable à la santé.",
      },
      {
        id: "laboratoire",
        titre: "Appeler la microbiologiste du laboratoire départemental",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chinwe Okonkwo : « Quatre colonies typiques sur gélose chromogène, après enrichissement. Sur nos présomptifs Listeria monocytogenes en produits laitiers frais, environ trois sur quatre sont confirmés ; les autres sont des Listeria innocua, qui ne rendent pas malade mais disent que Listeria circule dans l'atelier. Gardez les échantillons conservés des lots voisins : on pourra les analyser. »",
      },
      {
        id: "collecte",
        titre: "Relire les analyses du lait de collecte de septembre",
        cout: 1,
        nature: "bruit",
        resultat:
          "Hoel Quiniou : deux citernes de la collecte ont eu des Listeria spp. sur lait cru en septembre, comme presque chaque automne, chez deux exploitations différentes. Le lait du fromage blanc est pasteurisé à 75 °C pendant 20 secondes ; les enregistrements du pasteurisateur de Pontivy sont conformes toute la semaine.",
      },
      {
        id: "conseil",
        titre: "Appeler Efflam Jézéquel, le directeur industriel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Efflam : « Ce soir, bloque ce qui peut l'être et appelle l'astreinte de la DDPP. Le périmètre, prends-le dans les enregistrements de la ligne, pas dans les craintes de Baptistin, ni dans les tiennes. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous ce soir ?",
    options: [
      {
        t: "Attendre la confirmation du laboratoire avant de bloquer quoi que ce soit ou de prévenir qui que ce soit",
        d: "Ne coûte rien ce soir. Si le résultat est confirmé, on agira mardi.",
      },
      {
        t: "Faire retirer le seul lot L3-279-K, sans bruit, et prévenir la DDPP si la confirmation tombe",
        d: "Sept palettes à retirer chez Celtis et Opaline, avec leurs frais de retrait. Le reste de la production reste en vente.",
      },
      {
        t: "Bloquer et faire retirer les six lots remplis entre les deux NEP complètes, et informer la DDPP ce soir",
        d: "Toutes leurs palettes, à quai et en entrepôt, et des frais de retrait chez les deux enseignes. Baptistin désapprouve.",
      },
      {
        t: "Retirer et rappeler tout le fromage blanc de Pontivy du dernier mois, par précaution",
        d: "240 palettes et un avis de rappel des consommateurs dès ce soir. Personne ne pourra dire que vous avez minimisé.",
      },
    ],
    reactions: [
      [
        {
          ...BAPTISTIN,
          texte:
            "Merci. Lundi on y verra clair, et on n'aura pas affolé Celtis pour un présomptif.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Celtis et Opaline retirent le L3-279-K de leurs entrepôts et de leurs magasins. Leurs services qualité demandent pourquoi ce lot-là seulement.",
        },
      ],
      [
        {
          ...DDPP,
          texte:
            "Information enregistrée à 19 h 10 par l'astreinte. Transmettez-nous la liste des lots, leur diffusion et vos mesures de retrait ; nous attendons avec vous la confirmation.",
        },
        {
          ...BLEUNVENN,
          texte:
            "Les six palettes du L3-280-C sont bloquées en chambre froide, étiquetées « ne pas expédier ». Celtis et Opaline retirent les cinq autres lots ce soir.",
        },
      ],
      [
        {
          ...MORWENNA,
          texte:
            "Un rappel d'un mois de fromage blanc Kerbrélan, publié un vendredi soir… Les réseaux sociaux s'en sont emparés avant minuit, et deux journalistes ont déjà appelé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · lundi, 6 h",
    titre: "La ligne 3 doit-elle redémarrer ?",
    jusqua: 2,
    messages: (ctx) => [
      {
        ...FANCHON,
        heure: "06:02",
        alerte: true,
        texte:
          "La NEP de 5 h est faite. L'équipe de la ligne 3 est là, et les commandes de la semaine aussi : 60 palettes de fromage blanc. On redémarre ?",
      },
      {
        ...BAPTISTIN,
        heure: "06:40",
        texte:
          "Celtis attend son fromage blanc mercredi. Une rupture, ce sont des pénalités logistiques, et une place en rayon qu'on ne retrouve pas.",
      },
      {
        ...ZBIGNIEW,
        heure: "07:15",
        texte:
          "Je repense au joint de la vanne de dosage que j'ai changé mardi : l'ancien était fendu. Et sous la remplisseuse, l'eau stagne depuis que le siphon est à moitié bouché.",
      },
      {
        ...BLEUNVENN,
        heure: "07:30",
        texte: ctx.attente
          ? "Toujours rien du laboratoire : la confirmation est attendue ce soir. Personne n'est prévenu, ni chez Celtis, ni à la DDPP."
          : "Le laboratoire confirmera ce soir. Les lots retirés sont bloqués dans les entrepôts des enseignes en attendant.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "historique",
        titre: "Relire les analyses environnementales de la ligne 3 depuis un an",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le plan actuel : cinq prélèvements par semaine, presque tous en zone 3 (sols, siphons, pieds de machines). Listeria spp. trouvées deux fois sur le siphon sous la remplisseuse, en juillet et en septembre, traitées par un nettoyage. Aucun prélèvement en zone 1, les surfaces au contact du produit (buses, vannes de la remplisseuse), depuis le printemps. Une souche installée dans un joint survit aux NEP : on ne la trouve qu'en prélevant là où elle est.",
      },
      {
        id: "redemarrage",
        titre: "Chiffrer avec Fanchon les manières de redémarrer",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La libération positive garde chaque lot trois jours en chambre froide, jusqu'à des analyses négatives : 2 500 € par semaine en analyses, en stockage et en DLC perdue. Une campagne de 40 prélèvements en zones 1, 2 et 3 : 3 500 €, résultats mercredi. Un jour d'arrêt de la ligne 3 coûte 2 800 € : la marge perdue, le lait écoulé en spot, les pénalités de rupture ; Loudéac reprend une partie des volumes.",
      },
    ],
    question: "Comment la ligne 3 repart-elle ?",
    options: [
      {
        t: "Redémarrer après la NEP habituelle : les enseignes attendent leurs commandes",
        d: "Ne coûte rien de plus. Le plan d'analyses habituel continue.",
      },
      {
        t: "Redémarrer en libération positive, lancer 40 prélèvements environnementaux, et arrêter la ligne si la remplisseuse est positive",
        d: "2 500 € par semaine de libération positive et 3 500 € de prélèvements. Des livraisons décalées de trois jours.",
      },
      {
        t: "Garder la ligne 3 à l'arrêt jusqu'à la fin de l'enquête, trois semaines, et servir ce qu'on peut depuis Loudéac",
        d: "2 800 € par jour d'arrêt, prélèvements compris. Rien ne sort de la ligne 3 d'ici là.",
      },
      {
        t: "Redémarrer en libération positive, sans prélèvements de plus",
        d: "2 500 € par semaine. Chaque lot attend ses résultats avant de partir.",
      },
    ],
    reactions: [
      [
        {
          ...LANSANA,
          texte: "La ligne tourne depuis 7 h 20. Premier lot de la semaine à quai à midi.",
        },
      ],
      null,
      null,
      [
        {
          ...LANSANA,
          texte:
            "La ligne tourne. Les lots attendent leurs résultats en chambre froide ; il va falloir de la place.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Jusqu'où va le rappel ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...CHINWE,
        heure: "09:10",
        alerte: true,
        texte: ctx.confirme
          ? "Je vous confirme le résultat de lundi soir : Listeria monocytogenes dans le L3-279-K, 40 ufc par gramme. La souche est partie au centre national de référence pour typage."
          : "Je vous confirme le résultat de lundi soir : pas de Listeria monocytogenes dans l'échantillon du L3-279-K ; les colonies étaient des Listeria innocua. Listeria circule quelque part dans l'atelier.",
      },
      ...(ctx.campagne
        ? [
            {
              ...BLEUNVENN,
              heure: "10:30",
              texte: ctx.nicheVue
                ? "Les prélèvements de mercredi : zone 1 positive sur le corps d'une vanne de dosage de la remplisseuse, Listeria monocytogenes. Zone 3 positive sur le siphon."
                : "Les prélèvements de mercredi : zone 1 et zone 2 négatives. Zone 3 positive à Listeria spp. sur le siphon sous la remplisseuse.",
            },
          ]
        : []),
      {
        ...BAPTISTIN,
        heure: "11:15",
        texte: ctx.confirme
          ? "Un deuxième communiqué, ce serait avouer qu'on ne maîtrise rien. On s'en tient à ce qui est annoncé."
          : "Ce n'était pas la bonne Listeria : on lève tout, et on n'en parle plus.",
      },
      ...(ctx.alerteConnue
        ? [
            {
              ...TREPHINE,
              heure: "14:00",
              texte: ctx.confirme
                ? "Votre périmètre tient-il ? Avant de remettre votre fromage blanc en rayon, nous voulons savoir si d'autres lots sont concernés."
                : "Le résultat n'est pas confirmé, nous dit-on. Sur quels éléments comptez-vous lever le retrait ?",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "echantillons",
        titre: "Faire le point sur les échantillons conservés",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un pot de chaque lot est gardé jusqu'à sa DLC. Les cinq autres lots de l'intervalle et les huit lots voisins (le jeudi et le vendredi avant la NEP du lundi, le jeudi et le vendredi après celle du jeudi) : 13 analyses à 180 €, résultats mercredi. Une souche installée dans la ligne se retrouve presque toujours dans les lots voisins ; une contamination ponctuelle, au changement de format du mardi, n'irait pas au-delà des lots de ce jour-là.",
      },
      {
        id: "extension",
        titre: "Chiffrer avec Ysée une extension du rappel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les huit lots voisins : 48 palettes, dont 12 parties lundi matin. Trois semaines de production, depuis la dernière analyse environnementale négative : 180 palettes ; la plupart des pots sont mangés, on rembourse et on ne récupère presque rien. Chaque opération de retrait se paie dans les 230 magasins de Celtis et d'Opaline, 50 € par magasin.",
      },
    ],
    question: "Que faites-vous du périmètre ?",
    options: [
      {
        t: "Faire analyser les échantillons conservés de l'intervalle et des lots voisins, et étendre le rappel aux seuls lots positifs",
        d: "2 340 €, résultats mercredi. Si tout est négatif, on lève ce qui peut l'être, avec l'accord de la DDPP.",
      },
      {
        t: "S'en tenir au périmètre annoncé",
        d: "Pas de nouveau communiqué. Ne coûte rien de plus.",
      },
      {
        t: "Étendre par précaution le retrait et le rappel à trois semaines de production",
        d: "180 palettes, un nouvel avis de rappel si le résultat est confirmé. Plus personne ne pourra dire que c'était trop peu.",
      },
      {
        t: "Étendre dès maintenant le retrait aux huit lots voisins, sans attendre d'analyses",
        d: "48 palettes de plus, des frais de retrait, un nouvel avis de rappel si le résultat est confirmé.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...BAPTISTIN,
          texte: "Merci. On a assez fait parler de nous comme ça.",
        },
      ],
      [
        {
          ...TIEMOKO,
          texte:
            "Trois semaines de fromage blanc Kerbrélan et MDD retirées : nos rayons sont vides, et nos clients demandent si tout le frais de Kerbrélan est concerné.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Les huit lots voisins sont retirés chez Celtis et Opaline. Il en restait peu en rayon ; les frais de retrait suivent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Trouver la source",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...KLERVI,
        heure: "08:30",
        alerte: true,
        texte: ctx.nicheVue
          ? "La vanne de dosage positive en zone 1 n'est que l'endroit où on a prélevé. La souche peut être dans n'importe quel joint de la remplisseuse. Il faut décider ce qu'on démonte."
          : "On a remis la ligne d'aplomb, mais personne ne sait d'où venaient les Listeria. Le siphon positif, on le connaît depuis juillet. Il faut décider ce qu'on fait de la zone.",
      },
      {
        ...FANCHON,
        heure: "10:05",
        texte: `Ligne 3 : ${ctx.arret} jours d'arrêt depuis le début de l'alerte, taux de service du fromage blanc à ${ctx.service} cette semaine. Chaque jour de plus se voit chez les enseignes.`,
      },
      {
        ...ZBIGNIEW,
        heure: "11:40",
        texte:
          "Une désinfection choc, on la fait samedi et on repart lundi. Démonter la remplisseuse, c'est deux jours, et tout refaire, une semaine.",
      },
    ],
    sources: [
      {
        id: "zones",
        titre: "Relire les résultats environnementaux avec Klervi",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.nicheVue
              ? "Zone 1 positive : le corps d'une vanne de dosage de la remplisseuse, la même souche que le lot. Zone 3 : le siphon."
              : ctx.campagne
                ? "Zone 1 négative sur les 40 prélèvements ; zone 3 positive à Listeria spp. sur le siphon."
                : "Pas de campagne : le plan habituel a trouvé Listeria spp. sur le siphon, rien d'autre ; personne n'a prélevé sur les vannes."
          } Rechercher la source (démonter la remplisseuse et ses vannes, écouvillonner point par point, refaire le siphon) : 9 000 € et deux jours d'arrêt ; elle trouve une niche environ six fois sur sept quand une campagne a dit où chercher, une fois sur deux sinon. Refaire toute la zone : 26 000 € et cinq jours d'arrêt, et plus de niche possible. Une désinfection choc sans démonter tue ce qui est en surface, rarement ce qui est dans un joint : une fois sur cinq.`,
      },
      {
        id: "recidive",
        titre: "Demander à Efflam ce que coûte une récidive",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Efflam : « Un nouveau positif sur la même ligne, c'est un nouveau retrait, un nouvel avis de rappel, une mise en demeure de la DDPP et la presse qui ressort le premier. Et la zone finit refaite de toute façon, une semaine d'arrêt en plus. »",
      },
    ],
    question: "Que faites-vous de la zone de conditionnement ?",
    options: [
      {
        t: "Rechercher la source : démonter la remplisseuse et ses vannes, écouvillonner chaque point, refaire le siphon",
        d: "9 000 €, deux jours d'arrêt.",
      },
      {
        t: "Refaire toute la zone de conditionnement : joints, vannes, sol et siphons",
        d: "26 000 €, cinq jours d'arrêt.",
      },
      {
        t: "Faire une désinfection choc et renforcer les NEP, sans démonter",
        d: "3 000 €, un jour d'arrêt.",
      },
      {
        t: "Garder le nettoyage habituel : les NEP sont conformes",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...KLERVI,
          texte:
            "On démonte lundi. Zbigniew a la liste des points à écouvillonner, joint par joint.",
        },
      ],
      [
        {
          ...KLERVI,
          texte:
            "L'entreprise de travaux commence lundi : tous les joints et les vannes changés, le sol et les siphons repris. La ligne repart vendredi.",
        },
      ],
      [
        {
          ...ZBIGNIEW,
          texte: "Désinfection faite samedi, NEP renforcées. La ligne repart lundi.",
        },
      ],
      [
        {
          ...LANSANA,
          texte: "On garde les NEP comme avant. La ligne tourne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Celtis veut comprendre",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...TREPHINE,
        heure: "09:00",
        alerte: true,
        texte: ctx.alerteConnue
          ? "Le fromage blanc à marque Celtis porte notre nom. Avant de décider de son maintien, nous voulons auditer Pontivy : traçabilité, résultats, source, plan d'actions."
          : "Nous lançons nos audits fournisseurs de fin d'année. Pontivy est sur la liste : traçabilité, analyses environnementales, plan d'actions.",
      },
      {
        ...TIEMOKO,
        heure: "10:20",
        texte: ctx.alerteConnue
          ? "Nos frais de retrait arrivent : 90 magasins, 50 € par magasin et par opération, et les pénalités de rupture des semaines où le rayon est resté vide."
          : "Rien de particulier de notre côté. Nous suivons vos taux de service de près en fin d'année.",
      },
      {
        ...BAPTISTIN,
        heure: "11:00",
        texte:
          "Proposons à Celtis une opération promotionnelle en novembre. Un beau prospectus, et l'incident sera oublié.",
      },
    ],
    sources: [
      {
        id: "celtis",
        titre: "Appeler Tréphine Laouénan",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La décision appartient à la direction qualité de Celtis, pas à ses acheteurs. Ce qu'elle veut voir : la traçabilité, les résultats, la source, le plan d'actions. L'an dernier, elle a suspendu deux fournisseurs : celui qui avait contesté ses frais de retrait, et celui dont elle avait appris le rappel par la presse.",
      },
      {
        id: "promotion",
        titre: "Chiffrer l'opération promotionnelle avec Morwenna",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Deux semaines à 30 % de remise sur le fromage blanc Kerbrélan chez Celtis, sous le plafond de 34 % : 18 000 €. La dernière opération de ce type avait fait 40 % de volume en plus pendant quinze jours.",
      },
    ],
    question: "Que répondez-vous à Celtis ?",
    options: [
      {
        t: "Recevoir l'audit de Celtis à Pontivy avec tout le dossier, et régler les frais de retrait justifiés",
        d: "2 500 € de préparation, deux jours de l'équipe qualité.",
      },
      {
        t: "Proposer à Celtis de financer une opération promotionnelle sur le fromage blanc en novembre",
        d: "18 000 €, deux semaines à 30 % de remise.",
      },
      {
        t: "Contester les frais de retrait et décliner l'audit : le retrait a été fait dans les règles",
        d: "3 000 € de conseil juridique.",
      },
      {
        t: "Laisser Naïm Lefeuvre répondre aux demandes au fil de l'eau",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...TREPHINE,
          texte:
            "Merci pour le dossier. Vos auditeurs nous ont montré la ligne, les résultats et le plan. Nous rendons notre décision la semaine prochaine.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Les acheteurs de Celtis prennent l'opération. Leur direction qualité, elle, maintient sa demande d'audit.",
        },
      ],
      [
        {
          ...TREPHINE,
          texte: "Nous prenons acte de votre refus. Notre décision suivra.",
        },
      ],
      [
        {
          ...NAIM,
          texte: "J'ai répondu à leurs trois mails de la semaine. Ils en ont envoyé un quatrième.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Que retenir de l'alerte ?",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...YANNIG,
        heure: "08:45",
        alerte: true,
        texte:
          "Annaïg, le comité de direction veut savoir ce qui change pour que ça ne recommence pas. L'audit IFS est en janvier, et les enseignes le liront.",
      },
      {
        ...IWAN,
        heure: "10:30",
        texte: `L'alerte a coûté ${ctx.cout} à ce jour, pour une provision de 150 k€. ${ctx.palettes} palettes retirées ou détruites.`,
      },
    ],
    sources: [
      {
        id: "ifs",
        titre: "Relire le rapport du dernier audit IFS",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "En mars, l'auditeur avait noté un plan d'échantillonnage environnemental « peu orienté vers la recherche de la source ». Après une alerte, l'audit de janvier regardera d'abord le zonage, les prélèvements en zone 1 et le suivi de chaque positif. Une non-conformité majeure, c'est un audit complémentaire, un plan d'actions, et deux enseignes qui demandent des comptes : 25 000 € environ.",
      },
      {
        id: "comparaison",
        titre: "Comparer ce que trouvent les analyses de produits et celles de l'environnement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Dans les laiteries de la région, quand un plan environnemental cherche en zone 1 et remonte chaque positif à sa source, l'environnement donne l'alerte avant le produit sept fois sur dix. Une analyse de produit fini trouve la contamination quand elle est déjà dans les pots.",
      },
    ],
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: "Réviser le plan d'échantillonnage environnemental (zonage, vingt prélèvements par semaine dont la zone 1, recherche de la source à chaque positif) et former les équipes de nettoyage",
        d: "1 200 € par semaine et 3 000 € de formation.",
      },
      {
        t: "Faire analyser chaque lot de produit fini, trois pots par lot",
        d: "2 000 € par semaine. Les lots partent comme avant ; les résultats suivent.",
      },
      {
        t: "Garder la ligne 3 en libération positive jusqu'à la fin de l'année",
        d: "2 500 € par semaine, et des livraisons décalées de trois jours.",
      },
      {
        t: "Revenir au plan habituel : l'alerte est close",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...FANCHON,
          texte:
            "Le nouveau plan est affiché à l'entrée de l'atelier. Les équipes de nettoyage ont fait leur première journée de formation, et le premier positif de zone 3 a été remonté jusqu'à un tuyau de lavage.",
        },
      ],
      [
        {
          ...BLEUNVENN,
          texte:
            "Trois pots par lot, ça fait du monde au laboratoire. Les résultats arrivent quand les palettes sont déjà chez Celtis.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Les lots attendent trois jours à quai. Les enseignes acceptent, mais la chambre froide est pleine et la DLC raccourcit.",
        },
      ],
      [
        {
          ...YANNIG,
          texte: "Entendu. On tourne la page.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Protéger d'abord, délimiter sur les faits", chemin: [2, 1, 0, 0, 0, 0] },
  { nom: "Tout retirer par précaution", chemin: [3, 2, 2, 1, 1, 2] },
  { nom: "Attendre la confirmation", chemin: [0, 0, 1, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : attendre la preuve et protéger
 * les ventes (attendre la confirmation, redémarrer comme avant, ne pas étendre, nettoyer plus
 * fort sans chercher, acheter la paix par une promotion), ou s'affoler (rappeler un mois de
 * production, étendre à trois semaines sans analyses).
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 1],
  [2, 2],
  [3, 2],
  [4, 1],
] as const;

export const REPONSES = {
  confirme:
    "Résultat confirmé : Listeria monocytogenes dans l'échantillon du L3-279-K, 40 ufc par gramme. Le rapport part chez vous et à l'administration.",
  nonConfirme:
    "Résultat non confirmé : les colonies étaient des Listeria innocua. Pas de Listeria monocytogenes dans l'échantillon du L3-279-K.",
  campagneNiche:
    "Résultats des 40 prélèvements, mercredi : zone 1 positive à Listeria monocytogenes sur le corps d'une vanne de dosage de la remplisseuse ; zone 3 positive sur le siphon.",
  campagneSiphon:
    "Résultats des 40 prélèvements, mercredi : zones 1 et 2 négatives ; zone 3 positive à Listeria spp. sur le siphon sous la remplisseuse.",
  arretJeudi: "La ligne 3 s'arrête jeudi matin, jusqu'au traitement de la source.",
  liberationContinue:
    "La ligne continue en libération positive ; aucun lot n'est sorti sans résultat négatif.",
  echantillonsVoisins:
    "Échantillons conservés : positifs dans trois autres lots de l'intervalle et dans cinq des huit lots voisins, avant et après les deux NEP. La souche est installée dans la ligne. Les lots positifs sont retirés et rappelés mercredi.",
  echantillonsMardi:
    "Échantillons conservés : le L3-279-O, rempli le même mardi après le changement de format, est positif ; les quatre autres lots de l'intervalle et les huit lots voisins sont négatifs. Une contamination ponctuelle, ce mardi-là.",
  echantillonsNegatifs: "Échantillons conservés : les treize analyses sont négatives.",
  levee:
    "La DDPP accepte la levée : les palettes encore bloquées à l'usine et dans les entrepôts sont reprises et déclassées, plutôt que détruites.",
} as const;
