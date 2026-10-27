import type { Cas } from "../cas";

/**
 * LE MONDE DU COURS : LE CAS DE CHAQUE ENTREPRISE, FIGÉ.
 *
 * Les montants du cours pour les neuf entreprises : apports, emprunt, équipement, achat, ventes du
 * mois, paie, loyer, stock d'un trimestre, année en grandes masses, contrat d'emprunt, marché du mois
 * et regard du contrôle de gestion. Relevés une fois sur l'arène (le 27 octobre 2026, l'année que
 * le cours y jouait alors), puis écrits ici : le cours ne les recalcule plus, et une évolution du
 * moteur ne les change pas (décision du propriétaire, voir l-escale.ts).
 *
 * Ne pas régénérer ce fichier depuis l'arène sans décision du propriétaire : tous les chapitres
 * qui lisent le cas changeraient de chiffres.
 */
export const CAS_DES_ENTREPRISES: Readonly<Record<string, Cas>> = {
  "nova": {
    "code": "nova",
    "marche": {
      "clienteles": [
        {
          "code": "etudiants",
          "nom": "Étudiants (sensibles au prix)",
          "demande": 1342,
          "vendu": 1113,
          "manque": 229,
          "chiffreDAffaires": 65658
        },
        {
          "code": "passionnes",
          "nom": "Passionnés (sensibles à la qualité)",
          "demande": 579,
          "vendu": 480,
          "manque": 99,
          "chiffreDAffaires": 28309
        }
      ],
      "capacite": 2333,
      "marketing": 2000
    },
    "entreprise": "NOVA",
    "unite": "enceinte",
    "unites": "enceintes",
    "capital": 150000,
    "emprunt": 80000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 1452521,
      "achats": 534284.66,
      "autresCoutsVariables": 388570.67,
      "commissions": 0,
      "publicite": 24000,
      "qualite": 0,
      "entretien": 18744,
      "personnel": 128000,
      "loyerEtFrais": 236000,
      "interets": 3700,
      "dotation": 20000,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 99221.67,
        "impot": 24805.42,
        "resultatNet": 74416.25
      }
    },
    "pret": {
      "tauxAnnuel": 0.05,
      "nombreEcheances": 20,
      "capitalParEcheance": 4000
    },
    "loyer": {
      "montant": 19700,
      "date": 5
    },
    "immobilisation": {
      "quantite": 4,
      "prixUnitaire": 15000,
      "ht": 60000,
      "tauxTva": 0.2,
      "tva": 12000,
      "ttc": 72000,
      "compte": "2154",
      "acceptes": [
        "215",
        "2155"
      ],
      "designation": "Ligne manuelle",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 1590,
      "prixUnitaire": 22,
      "ht": 34980,
      "tauxTva": 0.2,
      "tva": 6996,
      "ttc": 41976,
      "compte": "601",
      "acceptes": [
        "602"
      ],
      "designation": "Composants pour 1 590 enceintes",
      "fournisseur": "Électro-Composants Lyon",
      "date": 10,
      "delai": 22,
      "echeance": 32
    },
    "venteCredit": {
      "quantite": 320,
      "prixUnitaire": 59,
      "ht": 18880,
      "tauxTva": 0.2,
      "tva": 3776,
      "ttc": 22656,
      "compte": "701",
      "acceptes": [],
      "client": "CampusTech",
      "date": 20,
      "delai": 80,
      "echeance": 100
    },
    "personnel": {
      "effectif": 4,
      "brut": 7500,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 1650,
      "net": 5850,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 3150,
      "cout": 10650,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 1270,
      "prixUnitaire": 59,
      "ht": 74930,
      "tauxTva": 0.2,
      "tva": 14986,
      "ttc": 89916,
      "compte": "701",
      "acceptes": [],
      "qui": "les enceintes vendues en ligne aux particuliers, payées par carte à la commande",
      "date": 31
    },
    "gestion": {
      "quantite": 1590,
      "chiffreDAffaires": 93810,
      "prixMoyen": 59,
      "matiereParUnite": 22,
      "autresParUnite": 16,
      "autresCoutsVariables": "emballage, transport et énergie de la chaîne",
      "coutVariableUnitaire": 38,
      "amortissement": 833,
      "dureeAmortissementMois": 72,
      "chargesFixes": 31183
    }
  },
  "boutique": {
    "code": "boutique",
    "marche": {
      "clienteles": [
        {
          "code": "pull_fideles",
          "nom": "Clientes fidèles · pull col rond",
          "demande": 207,
          "vendu": 207,
          "manque": 0,
          "chiffreDAffaires": 11372
        },
        {
          "code": "pull_passage",
          "nom": "Passants · pull col rond",
          "demande": 298,
          "vendu": 298,
          "manque": 0,
          "chiffreDAffaires": 16410
        },
        {
          "code": "pull_ce",
          "nom": "Comités d'entreprise · pull col rond",
          "demande": 70,
          "vendu": 70,
          "manque": 0,
          "chiffreDAffaires": 3867
        },
        {
          "code": "cardigan_fideles",
          "nom": "Clientes fidèles · cardigan",
          "demande": 155,
          "vendu": 143,
          "manque": 12,
          "chiffreDAffaires": 10612
        },
        {
          "code": "cardigan_passage",
          "nom": "Passants · cardigan",
          "demande": 149,
          "vendu": 138,
          "manque": 11,
          "chiffreDAffaires": 10182
        },
        {
          "code": "merinos_fideles",
          "nom": "Clientes fidèles · pull mérinos",
          "demande": 75,
          "vendu": 75,
          "manque": 0,
          "chiffreDAffaires": 10134
        },
        {
          "code": "merinos_affaires",
          "nom": "Cadeaux d'affaires · pull mérinos (règlement à 60 j)",
          "demande": 36,
          "vendu": 36,
          "manque": 0,
          "chiffreDAffaires": 4832
        },
        {
          "code": "echarpe_passage",
          "nom": "Passants · écharpe",
          "demande": 238,
          "vendu": 238,
          "manque": 0,
          "chiffreDAffaires": 8578
        },
        {
          "code": "echarpe_ce",
          "nom": "Comités d'entreprise · écharpe",
          "demande": 59,
          "vendu": 59,
          "manque": 0,
          "chiffreDAffaires": 2125
        },
        {
          "code": "bonnet_passage",
          "nom": "Passants · bonnet",
          "demande": 217,
          "vendu": 217,
          "manque": 0,
          "chiffreDAffaires": 5638
        },
        {
          "code": "bonnet_ce",
          "nom": "Comités d'entreprise · bonnet",
          "demande": 52,
          "vendu": 52,
          "manque": 0,
          "chiffreDAffaires": 1357
        }
      ],
      "capacite": 2500,
      "marketing": 1500
    },
    "entreprise": "MAILLE & CO",
    "unite": "article",
    "unites": "articles",
    "capital": 97510,
    "emprunt": 70000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": {
      "trimestre": 1,
      "debut": 1,
      "fin": 90,
      "initial": {
        "quantite": 1110,
        "valeur": 27510
      },
      "achats": {
        "quantite": 4564,
        "prixUnitaire": 25,
        "ht": 114100,
        "tauxTva": 0.2,
        "tva": 22820,
        "ttc": 136920
      },
      "vendues": 4601,
      "cump": 24.96,
      "final": {
        "quantite": 1073,
        "valeur": 26782.08
      },
      "coutDAchatDesVendues": 114827.92,
      "ventes": {
        "quantite": 4601,
        "prixUnitaire": 55.49,
        "ht": 255309.49,
        "tauxTva": 0.2,
        "tva": 51061.9,
        "ttc": 306371.39
      }
    },
    "annee": {
      "ventes": 1113938,
      "achats": 451574.56,
      "autresCoutsVariables": 63220.44,
      "commissions": 0,
      "publicite": 18000,
      "qualite": 0,
      "entretien": 11040,
      "personnel": 172800,
      "loyerEtFrais": 163200,
      "interets": 3367,
      "dotation": 20666.67,
      "stock": {
        "nature": "marchandises",
        "initial": 27510,
        "final": 0
      },
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 182559.33,
        "impot": 45639.83,
        "resultatNet": 136919.5
      }
    },
    "pret": {
      "tauxAnnuel": 0.052,
      "nombreEcheances": 20,
      "capitalParEcheance": 3500
    },
    "loyer": {
      "montant": 13600,
      "date": 5
    },
    "immobilisation": {
      "quantite": 1,
      "prixUnitaire": 16000,
      "ht": 16000,
      "tauxTva": 0.2,
      "tva": 3200,
      "ttc": 19200,
      "compte": "2184",
      "acceptes": [
        "218",
        "2181"
      ],
      "designation": "Rayonnage simple",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 1530,
      "prixUnitaire": 25,
      "ht": 38250,
      "tauxTva": 0.2,
      "tva": 7650,
      "ttc": 45900,
      "compte": "607",
      "acceptes": [],
      "designation": "1 530 pulls de la collection",
      "fournisseur": "Filature des Vosges",
      "date": 10,
      "delai": 45,
      "echeance": 55
    },
    "venteCredit": {
      "quantite": 70,
      "prixUnitaire": 55,
      "ht": 3850,
      "tauxTva": 0.2,
      "tva": 770,
      "ttc": 4620,
      "compte": "707",
      "acceptes": [],
      "client": "le comité d'entreprise des Laboratoires Morel",
      "date": 20,
      "delai": 45,
      "echeance": 65
    },
    "personnel": {
      "effectif": 6,
      "brut": 10100,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 2222,
      "net": 7878,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 4242,
      "cout": 14342,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 1460,
      "prixUnitaire": 56,
      "ht": 81760,
      "tauxTva": 0.2,
      "tva": 16352,
      "ttc": 98112,
      "compte": "707",
      "acceptes": [],
      "qui": "les pulls vendus en boutique, réglés en caisse",
      "date": 31
    },
    "gestion": {
      "quantite": 1530,
      "chiffreDAffaires": 85610,
      "prixMoyen": 55.95,
      "matiereParUnite": 25,
      "autresParUnite": 3.5,
      "autresCoutsVariables": "emballages, étiquettes et frais de carte bancaire",
      "coutVariableUnitaire": 28.5,
      "amortissement": 333,
      "dureeAmortissementMois": 48,
      "chargesFixes": 28275
    }
  },
  "hotel": {
    "code": "hotel",
    "marche": {
      "clienteles": [
        {
          "code": "affaires",
          "nom": "Clientèle affaires (semaine, note de frais)",
          "demande": 433,
          "vendu": 433,
          "manque": 0,
          "chiffreDAffaires": 38107
        },
        {
          "code": "loisirs",
          "nom": "Tourisme loisirs (week-ends et vacances)",
          "demande": 348,
          "vendu": 348,
          "manque": 0,
          "chiffreDAffaires": 30619
        },
        {
          "code": "groupes",
          "nom": "Groupes & séminaires (contrat négocié, 45 j)",
          "demande": 361,
          "vendu": 361,
          "manque": 0,
          "chiffreDAffaires": 31755
        }
      ],
      "capacite": 1800,
      "marketing": 2667
    },
    "entreprise": "L'ESCALE",
    "unite": "nuitée",
    "unites": "nuitées",
    "capital": 660000,
    "emprunt": 900000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 1419393.75,
      "achats": 204891.43,
      "autresCoutsVariables": 153668.57,
      "commissions": 0,
      "publicite": 32000,
      "qualite": 0,
      "entretien": 43200,
      "personnel": 481600,
      "loyerEtFrais": 150400,
      "interets": 36382.5,
      "dotation": 58000,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 259251.25,
        "impot": 64812.81,
        "resultatNet": 194438.44
      }
    },
    "pret": {
      "tauxAnnuel": 0.042,
      "nombreEcheances": 40,
      "capitalParEcheance": 22500
    },
    "loyer": {
      "montant": 12500,
      "date": 5
    },
    "immobilisation": {
      "quantite": 4,
      "prixUnitaire": 80000,
      "ht": 320000,
      "tauxTva": 0.2,
      "tva": 64000,
      "ttc": 384000,
      "compte": "2181",
      "acceptes": [
        "218",
        "2135"
      ],
      "designation": "Chambre standard",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 1140,
      "prixUnitaire": 12,
      "ht": 13680,
      "tauxTva": 0.2,
      "tva": 2736,
      "ttc": 16416,
      "compte": "6063",
      "acceptes": [
        "606",
        "602"
      ],
      "designation": "Linge et produits d'accueil pour 1 140 nuitées",
      "fournisseur": "Blanchisserie du Port",
      "date": 10,
      "delai": 30,
      "echeance": 40
    },
    "venteCredit": {
      "quantite": 790,
      "prixUnitaire": 88,
      "ht": 69520,
      "tauxTva": 0.1,
      "tva": 6952,
      "ttc": 76472,
      "compte": "706",
      "acceptes": [],
      "client": "l'agence Voyages Horizon",
      "date": 20,
      "delai": 45,
      "echeance": 65
    },
    "personnel": {
      "effectif": 14,
      "brut": 28300,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 6226,
      "net": 22074,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 11886,
      "cout": 40186,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 350,
      "prixUnitaire": 88,
      "ht": 30800,
      "tauxTva": 0.1,
      "tva": 3080,
      "ttc": 33880,
      "compte": "706",
      "acceptes": [],
      "qui": "les nuitées réglées par les clients à leur départ",
      "date": 31
    },
    "gestion": {
      "quantite": 1140,
      "chiffreDAffaires": 100320,
      "prixMoyen": 88,
      "matiereParUnite": 12,
      "autresParUnite": 9,
      "autresCoutsVariables": "blanchisserie, énergie et frais de réservation",
      "coutVariableUnitaire": 21,
      "amortissement": 3333,
      "dureeAmortissementMois": 96,
      "chargesFixes": 56019
    }
  },
  "bistrot": {
    "code": "bistrot",
    "marche": {
      "clienteles": [
        {
          "code": "midi_affaires",
          "nom": "Déjeuners d'affaires (formule du midi)",
          "demande": 735,
          "vendu": 690,
          "manque": 45,
          "chiffreDAffaires": 23452
        },
        {
          "code": "soir_locaux",
          "nom": "Dîners clientèle locale",
          "demande": 1020,
          "vendu": 957,
          "manque": 63,
          "chiffreDAffaires": 32526
        },
        {
          "code": "groupes",
          "nom": "Banquets & repas d'entreprise (30 j)",
          "demande": 388,
          "vendu": 364,
          "manque": 24,
          "chiffreDAffaires": 12385
        }
      ],
      "capacite": 3000,
      "marketing": 1167
    },
    "entreprise": "LA TABLE D'AUGUSTIN",
    "unite": "couvert",
    "unites": "couverts",
    "capital": 92000,
    "emprunt": 105000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 937882.02,
      "achats": 309362.92,
      "autresCoutsVariables": 92808.88,
      "commissions": 0,
      "publicite": 14000,
      "qualite": 9000,
      "entretien": 17600,
      "personnel": 288000,
      "loyerEtFrais": 72000,
      "interets": 5709.38,
      "dotation": 18000,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 111400.84,
        "impot": 27850.21,
        "resultatNet": 83550.63
      }
    },
    "pret": {
      "tauxAnnuel": 0.058,
      "nombreEcheances": 24,
      "capitalParEcheance": 4375
    },
    "loyer": {
      "montant": 6000,
      "date": 5
    },
    "immobilisation": {
      "quantite": 2,
      "prixUnitaire": 15000,
      "ht": 30000,
      "tauxTva": 0.2,
      "tva": 6000,
      "ttc": 36000,
      "compte": "2154",
      "acceptes": [
        "215",
        "2155"
      ],
      "designation": "Cuisine traditionnelle",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 2010,
      "prixUnitaire": 10,
      "ht": 20100,
      "tauxTva": 0.055,
      "tva": 1105.5,
      "ttc": 21205.5,
      "compte": "601",
      "acceptes": [
        "607",
        "602"
      ],
      "designation": "Denrées pour 2 010 couverts",
      "fournisseur": "Primeurs des Halles",
      "date": 11,
      "delai": 21,
      "echeance": 32
    },
    "venteCredit": {
      "quantite": 360,
      "prixUnitaire": 34,
      "ht": 12240,
      "tauxTva": 0.1,
      "tva": 1224,
      "ttc": 13464,
      "compte": "706",
      "acceptes": [
        "707"
      ],
      "client": "la société Brunet, pour ses repas d'affaires",
      "date": 20,
      "delai": 30,
      "echeance": 50
    },
    "personnel": {
      "effectif": 10,
      "brut": 16900,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 3718,
      "net": 13182,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 7098,
      "cout": 23998,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 1650,
      "prixUnitaire": 34,
      "ht": 56100,
      "tauxTva": 0.1,
      "tva": 5610,
      "ttc": 61710,
      "compte": "706",
      "acceptes": [
        "707"
      ],
      "qui": "les repas servis en salle, réglés à table",
      "date": 31
    },
    "gestion": {
      "quantite": 2010,
      "chiffreDAffaires": 68340,
      "prixMoyen": 34,
      "matiereParUnite": 10,
      "autresParUnite": 3,
      "autresCoutsVariables": "énergie de cuisine, boissons offertes et frais de carte",
      "coutVariableUnitaire": 13,
      "amortissement": 500,
      "dureeAmortissementMois": 60,
      "chargesFixes": 30498
    }
  },
  "conseil": {
    "code": "conseil",
    "marche": {
      "clienteles": [
        {
          "code": "grands_comptes",
          "nom": "Grands comptes (missions longues, 60 j)",
          "demande": 86,
          "vendu": 43,
          "manque": 43,
          "chiffreDAffaires": 24220
        },
        {
          "code": "pme",
          "nom": "PME régionales (missions courtes, 30 j)",
          "demande": 127,
          "vendu": 64,
          "manque": 63,
          "chiffreDAffaires": 35841
        },
        {
          "code": "public",
          "nom": "Secteur public (appels d'offres, 60 j)",
          "demande": 112,
          "vendu": 56,
          "manque": 55,
          "chiffreDAffaires": 31593
        }
      ],
      "capacite": 500,
      "marketing": 2333
    },
    "entreprise": "ATLAS CONSEIL",
    "unite": "jour-conseil",
    "unites": "jours-conseil",
    "capital": 205000,
    "emprunt": 70000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 1440937.28,
      "achats": 142340,
      "autresCoutsVariables": 90580,
      "commissions": 0,
      "publicite": 28000,
      "qualite": 0,
      "entretien": 30800,
      "personnel": 604800,
      "loyerEtFrais": 241000,
      "interets": 4208.75,
      "dotation": 14333.33,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 284875.19,
        "impot": 71218.8,
        "resultatNet": 213656.39
      }
    },
    "pret": {
      "tauxAnnuel": 0.065,
      "nombreEcheances": 20,
      "capitalParEcheance": 3500
    },
    "loyer": {
      "montant": 15600,
      "date": 5
    },
    "immobilisation": {
      "quantite": 2,
      "prixUnitaire": 8000,
      "ht": 16000,
      "tauxTva": 0.2,
      "tva": 3200,
      "ttc": 19200,
      "compte": "2183",
      "acceptes": [
        "218"
      ],
      "designation": "Poste junior",
      "date": 6,
      "ratioDeRevente": 0.3
    },
    "achat": {
      "quantite": 160,
      "prixUnitaire": 55,
      "ht": 8800,
      "tauxTva": 0.2,
      "tva": 1760,
      "ttc": 10560,
      "compte": "604",
      "acceptes": [],
      "designation": "Études et documentation pour 160 jours de mission",
      "fournisseur": "Documentation Pro",
      "date": 10,
      "delai": 30,
      "echeance": 40
    },
    "venteCredit": {
      "quantite": 130,
      "prixUnitaire": 560,
      "ht": 72800,
      "tauxTva": 0.2,
      "tva": 14560,
      "ttc": 87360,
      "compte": "706",
      "acceptes": [],
      "client": "le groupe Vidal Industries",
      "date": 20,
      "delai": 60,
      "echeance": 80
    },
    "personnel": {
      "effectif": 12,
      "brut": 35500,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 7810,
      "net": 27690,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 14910,
      "cout": 50410,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 30,
      "prixUnitaire": 560,
      "ht": 16800,
      "tauxTva": 0.2,
      "tva": 3360,
      "ttc": 20160,
      "compte": "706",
      "acceptes": [],
      "qui": "les missions courtes, réglées à la remise du rapport",
      "date": 31
    },
    "gestion": {
      "quantite": 160,
      "chiffreDAffaires": 89600,
      "prixMoyen": 560,
      "matiereParUnite": 55,
      "autresParUnite": 35,
      "autresCoutsVariables": "déplacements et frais de mission",
      "coutVariableUnitaire": 90,
      "amortissement": 444,
      "dureeAmortissementMois": 36,
      "chargesFixes": 66454
    }
  },
  "ecommerce": {
    "code": "ecommerce",
    "marche": {
      "clienteles": [
        {
          "code": "acquisition",
          "nom": "Nouveaux clients (trafic payant)",
          "demande": 455,
          "vendu": 455,
          "manque": 0,
          "chiffreDAffaires": 28226
        },
        {
          "code": "fideles",
          "nom": "Clients récurrents (base installée)",
          "demande": 370,
          "vendu": 370,
          "manque": 0,
          "chiffreDAffaires": 22914
        },
        {
          "code": "marketplace",
          "nom": "Marketplaces tierces (commission)",
          "demande": 243,
          "vendu": 243,
          "manque": 0,
          "chiffreDAffaires": 15057
        }
      ],
      "capacite": 2333,
      "marketing": 5000
    },
    "entreprise": "PIXEL & CO",
    "unite": "commande",
    "unites": "commandes",
    "capital": 78000,
    "emprunt": 90000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": {
      "trimestre": 1,
      "debut": 1,
      "fin": 90,
      "initial": {
        "quantite": 2000,
        "valeur": 54000
      },
      "achats": {
        "quantite": 3778,
        "prixUnitaire": 27,
        "ht": 102006,
        "tauxTva": 0.2,
        "tva": 20401.2,
        "ttc": 122407.2
      },
      "vendues": 3203,
      "cump": 27,
      "final": {
        "quantite": 2575,
        "valeur": 69525
      },
      "coutDAchatDesVendues": 86481,
      "ventes": {
        "quantite": 3203,
        "prixUnitaire": 62,
        "ht": 198586,
        "tauxTva": 0.2,
        "tva": 39717.2,
        "ttc": 238303.2
      }
    },
    "annee": {
      "ventes": 1020386.44,
      "achats": 394308,
      "autresCoutsVariables": 160644,
      "commissions": 27186.97,
      "publicite": 60000,
      "qualite": 0,
      "entretien": 20428,
      "personnel": 164000,
      "loyerEtFrais": 44000,
      "interets": 5056.88,
      "dotation": 11900,
      "stock": {
        "nature": "marchandises",
        "initial": 54000,
        "final": 0
      },
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 78862.6,
        "impot": 19715.65,
        "resultatNet": 59146.95
      }
    },
    "pret": {
      "tauxAnnuel": 0.062,
      "nombreEcheances": 16,
      "capitalParEcheance": 5625
    },
    "loyer": {
      "montant": 3700,
      "date": 5
    },
    "immobilisation": {
      "quantite": 3,
      "prixUnitaire": 5000,
      "ht": 15000,
      "tauxTva": 0.2,
      "tva": 3000,
      "ttc": 18000,
      "compte": "2154",
      "acceptes": [
        "215",
        "2181",
        "218"
      ],
      "designation": "Préparation manuelle",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 1060,
      "prixUnitaire": 27,
      "ht": 28620,
      "tauxTva": 0.2,
      "tva": 5724,
      "ttc": 34344,
      "compte": "607",
      "acceptes": [],
      "designation": "Articles de décoration pour 1 060 commandes",
      "fournisseur": "Déco Import",
      "date": 10,
      "delai": 45,
      "echeance": 55
    },
    "venteCredit": {
      "quantite": 240,
      "prixUnitaire": 62,
      "ht": 14880,
      "tauxTva": 0.2,
      "tva": 2976,
      "ttc": 17856,
      "compte": "707",
      "acceptes": [],
      "client": "la place de marché MaisonPlus, qui reverse en fin de période",
      "date": 26,
      "delai": 30,
      "echeance": 56
    },
    "personnel": {
      "effectif": 5,
      "brut": 9600,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 2112,
      "net": 7488,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 4032,
      "cout": 13632,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 820,
      "prixUnitaire": 62,
      "ht": 50840,
      "tauxTva": 0.2,
      "tva": 10168,
      "ttc": 61008,
      "compte": "707",
      "acceptes": [],
      "qui": "les commandes payées par carte sur le site",
      "date": 31
    },
    "gestion": {
      "quantite": 1060,
      "chiffreDAffaires": 65720,
      "prixMoyen": 62,
      "matiereParUnite": 27,
      "autresParUnite": 11,
      "autresCoutsVariables": "préparation, emballage et livraison",
      "coutVariableUnitaire": 38,
      "amortissement": 417,
      "dureeAmortissementMois": 36,
      "chargesFixes": 17749
    }
  },
  "fitness": {
    "code": "fitness",
    "marche": {
      "clienteles": [
        {
          "code": "resolutions",
          "nom": "Bonnes résolutions (par vagues, volatils)",
          "demande": 200,
          "vendu": 200,
          "manque": 0,
          "chiffreDAffaires": 20968
        },
        {
          "code": "reguliers",
          "nom": "Pratiquants réguliers (base fidèle)",
          "demande": 47,
          "vendu": 47,
          "manque": 0,
          "chiffreDAffaires": 4900
        },
        {
          "code": "entreprises",
          "nom": "Contrats entreprises (45 j)",
          "demande": 34,
          "vendu": 34,
          "manque": 0,
          "chiffreDAffaires": 3532
        }
      ],
      "capacite": 733,
      "marketing": 2333
    },
    "entreprise": "VOLT FITNESS",
    "unite": "adhérent",
    "unites": "adhérents",
    "capital": 285000,
    "emprunt": 420000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 835013.05,
      "achats": 52447.18,
      "autresCoutsVariables": 78670.77,
      "commissions": 0,
      "publicite": 28000,
      "qualite": 0,
      "entretien": 35492,
      "personnel": 224000,
      "loyerEtFrais": 196000,
      "interets": 21862.5,
      "dotation": 16857.14,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 181683.45,
        "impot": 45420.86,
        "resultatNet": 136262.59
      }
    },
    "pret": {
      "tauxAnnuel": 0.055,
      "nombreEcheances": 28,
      "capitalParEcheance": 15000
    },
    "loyer": {
      "montant": 16300,
      "date": 5
    },
    "immobilisation": {
      "quantite": 2,
      "prixUnitaire": 18000,
      "ht": 36000,
      "tauxTva": 0.2,
      "tva": 7200,
      "ttc": 43200,
      "compte": "2154",
      "acceptes": [
        "215",
        "2184",
        "218"
      ],
      "designation": "Plateau basique",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 280,
      "prixUnitaire": 6,
      "ht": 1680,
      "tauxTva": 0.2,
      "tva": 336,
      "ttc": 2016,
      "compte": "6063",
      "acceptes": [
        "606"
      ],
      "designation": "Produits d'entretien et petit matériel pour 280 adhérents",
      "fournisseur": "Hygiène Pro",
      "date": 10,
      "delai": 30,
      "echeance": 40
    },
    "venteCredit": {
      "quantite": 30,
      "prixUnitaire": 105,
      "ht": 3150,
      "tauxTva": 0.2,
      "tva": 630,
      "ttc": 3780,
      "compte": "706",
      "acceptes": [],
      "client": "le comité d'entreprise de la mairie",
      "date": 20,
      "delai": 45,
      "echeance": 65
    },
    "personnel": {
      "effectif": 8,
      "brut": 13100,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 2882,
      "net": 10218,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 5502,
      "cout": 18602,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 250,
      "prixUnitaire": 105,
      "ht": 26250,
      "tauxTva": 0.2,
      "tva": 5250,
      "ttc": 31500,
      "compte": "706",
      "acceptes": [],
      "qui": "les abonnements individuels, payés à l'inscription",
      "date": 31
    },
    "gestion": {
      "quantite": 280,
      "chiffreDAffaires": 29400,
      "prixMoyen": 105,
      "matiereParUnite": 6,
      "autresParUnite": 9,
      "autresCoutsVariables": "énergie, eau et serviettes par adhérent",
      "coutVariableUnitaire": 15,
      "amortissement": 500,
      "dureeAmortissementMois": 72,
      "chargesFixes": 35402
    }
  },
  "batiment": {
    "code": "batiment",
    "marche": {
      "clienteles": [
        {
          "code": "particuliers",
          "nom": "Particuliers (paient vite, comparent tout)",
          "demande": 223,
          "vendu": 169,
          "manque": 55,
          "chiffreDAffaires": 69085
        },
        {
          "code": "syndics",
          "nom": "Syndics de copropriété (gros volumes, 60 j)",
          "demande": 190,
          "vendu": 143,
          "manque": 46,
          "chiffreDAffaires": 58671
        },
        {
          "code": "marches_publics",
          "nom": "Marchés publics (prix serré, mandat à 90 j)",
          "demande": 97,
          "vendu": 73,
          "manque": 24,
          "chiffreDAffaires": 29958
        }
      ],
      "capacite": 500,
      "marketing": 2667
    },
    "entreprise": "MARTEL & FILS",
    "unite": "mètre carré",
    "unites": "mètres carrés",
    "capital": 443600,
    "emprunt": 240000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": {
      "trimestre": 4,
      "debut": 274,
      "fin": 365,
      "initial": {
        "quantite": 39,
        "valeur": 6552
      },
      "achats": {
        "quantite": 1470,
        "prixUnitaire": 168,
        "ht": 246960,
        "tauxTva": 0.2,
        "tva": 49392,
        "ttc": 296352
      },
      "vendues": 1325,
      "cump": 168,
      "final": {
        "quantite": 184,
        "valeur": 30912
      },
      "coutDAchatDesVendues": 222600,
      "ventes": {
        "quantite": 1325,
        "prixUnitaire": 409.86,
        "ht": 543064.5,
        "tauxTva": 0.2,
        "tva": 108612.9,
        "ttc": 651677.4
      }
    },
    "annee": {
      "ventes": 2026115.82,
      "achats": 817488,
      "autresCoutsVariables": 204372,
      "commissions": 0,
      "publicite": 32000,
      "qualite": 0,
      "entretien": 43120,
      "personnel": 537600,
      "loyerEtFrais": 134400,
      "interets": 13050,
      "dotation": 43404.76,
      "stock": {
        "nature": "en-cours",
        "initial": 54600,
        "final": 38693.36
      },
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 184774.42,
        "impot": 46193.61,
        "resultatNet": 138580.82
      }
    },
    "pret": {
      "tauxAnnuel": 0.058,
      "nombreEcheances": 24,
      "capitalParEcheance": 10000
    },
    "loyer": {
      "montant": 11200,
      "date": 5
    },
    "immobilisation": {
      "quantite": 2,
      "prixUnitaire": 35000,
      "ht": 70000,
      "tauxTva": 0.2,
      "tva": 14000,
      "ttc": 84000,
      "compte": "2155",
      "acceptes": [
        "215",
        "2154"
      ],
      "designation": "Outillage manuel",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 390,
      "prixUnitaire": 168,
      "ht": 65520,
      "tauxTva": 0.2,
      "tva": 13104,
      "ttc": 78624,
      "compte": "601",
      "acceptes": [
        "602"
      ],
      "designation": "Matériaux pour 390 mètres carrés",
      "fournisseur": "Négoce Matériaux Durand",
      "date": 10,
      "delai": 45,
      "echeance": 55
    },
    "venteCredit": {
      "quantite": 310,
      "prixUnitaire": 410,
      "ht": 127100,
      "tauxTva": 0.2,
      "tva": 25420,
      "ttc": 152520,
      "compte": "704",
      "acceptes": [
        "706"
      ],
      "client": "un cabinet médical qui rénove ses locaux",
      "date": 20,
      "delai": 90,
      "echeance": 110
    },
    "personnel": {
      "effectif": 14,
      "brut": 31500,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 6930,
      "net": 24570,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 13230,
      "cout": 44730,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 80,
      "prixUnitaire": 410,
      "ht": 32800,
      "tauxTva": 0.2,
      "tva": 6560,
      "ttc": 39360,
      "compte": "704",
      "acceptes": [
        "706"
      ],
      "qui": "les petits dépannages dans des commerces, réglés en fin de chantier",
      "date": 31
    },
    "gestion": {
      "quantite": 390,
      "chiffreDAffaires": 159900,
      "prixMoyen": 410,
      "matiereParUnite": 168,
      "autresParUnite": 42,
      "autresCoutsVariables": "location de petit matériel, carburant et évacuation des déchets",
      "coutVariableUnitaire": 210,
      "amortissement": 1167,
      "dureeAmortissementMois": 60,
      "chargesFixes": 57097
    }
  },
  "transport": {
    "code": "transport",
    "marche": {
      "clienteles": [
        {
          "code": "industriels",
          "nom": "Industriels sous contrat (réguliers, 60 j)",
          "demande": 1210,
          "vendu": 936,
          "manque": 274,
          "chiffreDAffaires": 63651
        },
        {
          "code": "distribution",
          "nom": "Grande distribution (volumes, prix serré, 45 j)",
          "demande": 1143,
          "vendu": 884,
          "manque": 259,
          "chiffreDAffaires": 60144
        },
        {
          "code": "affretement",
          "nom": "Bourse de fret (comptant, prix du jour)",
          "demande": 588,
          "vendu": 454,
          "manque": 133,
          "chiffreDAffaires": 30905
        }
      ],
      "capacite": 3333,
      "marketing": 1567
    },
    "entreprise": "ROUTE & CIE",
    "unite": "palette",
    "unites": "palettes",
    "capital": 715000,
    "emprunt": 300000,
    "dates": {
      "capital": 2,
      "emprunt": 3
    },
    "stock": null,
    "annee": {
      "ventes": 2314841.99,
      "achats": 656855.83,
      "autresCoutsVariables": 255443.93,
      "commissions": 0,
      "publicite": 18800,
      "qualite": 30000,
      "entretien": 41360,
      "personnel": 496000,
      "loyerEtFrais": 248000,
      "interets": 14625,
      "dotation": 80071.43,
      "stock": null,
      "tauxIS": 0.25,
      "arene": {
        "resultatAvantImpot": 473685.8,
        "impot": 118421.45,
        "resultatNet": 355264.35
      }
    },
    "pret": {
      "tauxAnnuel": 0.052,
      "nombreEcheances": 24,
      "capitalParEcheance": 12500
    },
    "loyer": {
      "montant": 20700,
      "date": 5
    },
    "immobilisation": {
      "quantite": 1,
      "prixUnitaire": 45000,
      "ht": 45000,
      "tauxTva": 0.2,
      "tva": 9000,
      "ttc": 54000,
      "compte": "2182",
      "acceptes": [
        "218"
      ],
      "designation": "Fourgon urbain",
      "date": 6,
      "ratioDeRevente": 0.4
    },
    "achat": {
      "quantite": 2270,
      "prixUnitaire": 18,
      "ht": 40860,
      "tauxTva": 0.2,
      "tva": 8172,
      "ttc": 49032,
      "compte": "6061",
      "acceptes": [
        "606"
      ],
      "designation": "Gazole pour 2 270 palettes livrées",
      "fournisseur": "Carburants de l'Ouest",
      "date": 17,
      "delai": 15,
      "echeance": 32
    },
    "venteCredit": {
      "quantite": 1820,
      "prixUnitaire": 68,
      "ht": 123760,
      "tauxTva": 0.2,
      "tva": 24752,
      "ttc": 148512,
      "compte": "706",
      "acceptes": [],
      "client": "le chargeur Logidis",
      "date": 20,
      "delai": 60,
      "echeance": 80
    },
    "personnel": {
      "effectif": 10,
      "brut": 29100,
      "tauxSalarial": 0.22,
      "cotisationsSalariales": 6402,
      "net": 22698,
      "tauxPatronal": 0.42,
      "cotisationsPatronales": 12222,
      "cout": 41322,
      "date": 28,
      "dateUrssaf": 46
    },
    "venteComptant": {
      "quantite": 450,
      "prixUnitaire": 68,
      "ht": 30600,
      "tauxTva": 0.2,
      "tva": 6120,
      "ttc": 36720,
      "compte": "706",
      "acceptes": [],
      "qui": "les envois de messagerie payés à l'enlèvement",
      "date": 31
    },
    "gestion": {
      "quantite": 2270,
      "chiffreDAffaires": 154360,
      "prixMoyen": 68,
      "matiereParUnite": 18,
      "autresParUnite": 7,
      "autresCoutsVariables": "péages, pneus et entretien au kilomètre",
      "coutVariableUnitaire": 25,
      "amortissement": 750,
      "dureeAmortissementMois": 60,
      "chargesFixes": 62772
    }
  }
};
