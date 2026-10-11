"use client";

import { useMemo, useState } from "react";
import { bouton } from "@/components/bouton";
import { CarteDOffre } from "@/components/carte-d-offre";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { sansMolette } from "@/components/sans-molette";
import { enregistrerOffreAction, type EtatDeLEditeur } from "@/app/admin/offres/actions";
import {
  carteDeTarif,
  erreursDeLOffre,
  euros,
  libelleDuTarif,
  LIBELLES_DES_FORMULAIRES,
  LIBELLES_DES_PUBLICS,
  LIBELLES_DES_RUBRIQUES,
  LIBELLES_DES_TARIFS,
  remplir,
  texteDeLaMention,
  type Catalogue,
  type CompositionDeModule,
  type Formulaire,
  type OffreDuCatalogue,
  type ParametresArene,
  type PublicDeLOffre,
  type Rubrique,
  type Tarif,
} from "@/config/catalogue";

/**
 * L'ÉDITEUR D'UNE OFFRE (/admin/offres), AVEC L'APERÇU DE SA CARTE.
 *
 * Tout ce qu'une offre porte : son nom, pour qui, son public, sa rubrique sur /tarifs, son
 * tarif (un prix de référence par an, ou sur devis), ce qu'elle inclut, ses modules et
 * leurs paramètres, sa mention comparative (calculée sur les prix, ou saisie), son ordre,
 * sa visibilité, son bouton. L'APERÇU rend la carte telle que /tarifs la montrera, variables
 * remplies, AVANT d'enregistrer ; les refus de la règle (`erreursDeLOffre`) s'affichent
 * pendant la saisie, et le serveur les refait à l'enregistrement.
 *
 * La mise en avant (le seul bouton plein de /tarifs) ne se coche pas ici : elle se DÉPLACE
 * depuis la liste des offres, pour qu'il y en ait toujours exactement une.
 */

const CHAMP = "mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none";
const ETIQUETTE = "text-sm font-medium text-slate-300";
const lignes = (t: string) => t.split("\n");
const texte = (l: readonly string[]) => l.join("\n");

const ARENE_PAR_DEFAUT: ParametresArene = { entreprises: "toutes", niveaux: "tous", enseignants: null, partiesEnCours: null };

export function EditeurDOffre({
  initiale,
  mode,
  catalogue,
  variables,
  nomFige,
  prixPublics,
}: {
  initiale: OffreDuCatalogue;
  mode: "creation" | "modification";
  catalogue: Catalogue;
  /** Les variables des textes et ce qu'elles valent aujourd'hui. */
  variables: Readonly<Record<string, string>>;
  /** Le nom est-il figé (cité par les murs de licence et les phrases du site) ? */
  nomFige: boolean;
  /** Les prix s'affichent-ils sur le site ? Éteint, le prix est une référence interne. */
  prixPublics: boolean;
}) {
  const [o, setO] = useState<OffreDuCatalogue>(initiale);
  const maj = (patch: Partial<OffreDuCatalogue>) => setO((x) => ({ ...x, ...patch }));
  const etatInitial: EtatDeLEditeur = { erreurs: [] };
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    enregistrerOffreAction,
    etatInitial,
    { label: "enregistrement d'une offre" },
  );

  // Le catalogue tel qu'il serait avec cette offre : la mention et l'aperçu s'y calculent.
  const avecElle = useMemo<Catalogue>(
    () => ({ ...catalogue, offres: [...catalogue.offres.filter((x) => x.code !== initiale.code), o] }),
    [catalogue, initiale.code, o],
  );
  const aCorriger = erreursDeLOffre(o, { ...catalogue, offres: catalogue.offres.filter((x) => x.code !== initiale.code) }, Object.keys(variables));
  const nettes = (l: readonly string[]) => l.filter((x) => x.trim() !== "");
  const carte = carteDeTarif({ ...o, inclus: nettes(o.inclus), precisions: nettes(o.precisions) }, avecElle, variables, {
    prix: prixPublics,
  });
  const arene = o.modules.find((m) => m.module === "arene");
  const reglerModule = (code: string, present: boolean) => {
    const sans = o.modules.filter((m) => m.module !== code);
    const ajout: CompositionDeModule = code === "arene" ? { module: code, parametres: { ...ARENE_PAR_DEFAUT } } : { module: code };
    maj({ modules: present ? [...sans, ajout] : sans });
  };
  const reglerArene = (patch: Partial<ParametresArene>) =>
    maj({
      modules: o.modules.map((m) =>
        m.module === "arene" ? { ...m, parametres: { ...(m.parametres ?? ARENE_PAR_DEFAUT), ...patch } } : m,
      ),
    });
  const referencesPossibles = catalogue.offres.filter((x) => x.tarif === "prix" && x.code !== o.code);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" data-editeur-offre={o.code || "nouvelle"}>
      <form ref={formRef} action={formAction} className="carte grid gap-4 p-4 sm:p-6">
        <input type="hidden" name="offre" value={JSON.stringify(o)} />
        <input type="hidden" name="mode" value={mode} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETTE}>Code (adresse du devis)</span>
            <input
              value={o.code}
              readOnly={mode === "modification"}
              onChange={(e) => maj({ code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              placeholder="campus-episodes"
              className={CHAMP}
              data-champ-offre="code"
            />
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Nom</span>
            <input
              value={o.nom}
              readOnly={nomFige}
              onChange={(e) => maj({ nom: e.target.value })}
              className={CHAMP}
              data-champ-offre="nom"
            />
            {nomFige ? (
              <span className="mt-1 block text-xs text-slate-400">
                Figé : les murs de licence et les phrases du site le citent.
              </span>
            ) : null}
          </label>
          <label className="block sm:col-span-2">
            <span className={ETIQUETTE}>Pour qui (sous-titre)</span>
            <input value={o.sousTitre} onChange={(e) => maj({ sousTitre: e.target.value })} className={CHAMP} />
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Public</span>
            <select value={o.public} onChange={(e) => maj({ public: e.target.value as PublicDeLOffre })} className={CHAMP}>
              {Object.entries(LIBELLES_DES_PUBLICS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Place sur /tarifs</span>
            <select value={o.rubrique} onChange={(e) => maj({ rubrique: e.target.value as Rubrique })} className={CHAMP}>
              {Object.entries(LIBELLES_DES_RUBRIQUES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Tarif</span>
            <select
              value={o.tarif}
              onChange={(e) => {
                const tarif = e.target.value as Tarif;
                maj({ tarif, prixCents: tarif === "prix" ? (o.prixCents ?? 100000) : null });
              }}
              className={CHAMP}
              data-champ-offre="tarif"
            >
              {Object.entries(LIBELLES_DES_TARIFS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {o.tarif === "prix" ? (
            <label className="block">
              <span className={ETIQUETTE}>
                Prix de référence par an (€){prixPublics ? "" : ", interne"}
              </span>
              <input
                type="number"
                onWheel={sansMolette}
                min={1}
                step={1}
                value={o.prixCents === null ? "" : o.prixCents / 100}
                onChange={(e) =>
                  maj({ prixCents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) })
                }
                className={CHAMP}
                data-champ-offre="prix"
              />
              {prixPublics ? null : (
                <span className="mt-1 block text-xs text-slate-400">
                  Non affiché sur le site : il prépare le devis et le montant des licences.
                </span>
              )}
            </label>
          ) : o.rubrique === "option" ? (
            <label className="block">
              <span className={ETIQUETTE}>Libellé du tarif (facultatif)</span>
              <input
                value={o.libelleTarif ?? ""}
                placeholder={LIBELLES_DES_TARIFS[o.tarif]}
                onChange={(e) => maj({ libelleTarif: e.target.value || null })}
                className={CHAMP}
              />
            </label>
          ) : null}
        </div>

        <label className="block">
          <span className={ETIQUETTE}>Inclus (une ligne par élément)</span>
          <textarea
            rows={6}
            value={texte(o.inclus)}
            onChange={(e) => maj({ inclus: lignes(e.target.value) })}
            className={CHAMP}
            data-champ-offre="inclus"
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Précisions (une ligne par précision)</span>
          <textarea rows={3} value={texte(o.precisions)} onChange={(e) => maj({ precisions: lignes(e.target.value) })} className={CHAMP} />
        </label>
        {o.rubrique === "episodes" ? (
          <fieldset className="grid gap-3 rounded-xl border border-white/10 p-4">
            <legend className={`px-2 ${ETIQUETTE}`}>Formules (bande des épisodes)</legend>
            {o.formules.map((f, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
                <input
                  aria-label={`Nom de la formule ${i + 1}`}
                  value={f.nom}
                  onChange={(e) => maj({ formules: o.formules.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)) })}
                  className="champ px-3 py-2 text-sm"
                />
                <textarea
                  aria-label={`Lignes de la formule ${i + 1}`}
                  rows={3}
                  value={texte(f.inclus)}
                  onChange={(e) =>
                    maj({ formules: o.formules.map((x, j) => (j === i ? { ...x, inclus: lignes(e.target.value) } : x)) })
                  }
                  className="champ px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => maj({ formules: o.formules.filter((_, j) => j !== i) })}
                  className={bouton({ variante: "secondaire", taille: "s" })}
                >
                  Retirer
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => maj({ formules: [...o.formules, { nom: "", inclus: [] }] })}
              className={`${bouton({ variante: "secondaire", taille: "s" })} justify-self-start`}
            >
              Ajouter une formule
            </button>
          </fieldset>
        ) : null}

        <fieldset className="grid gap-3 rounded-xl border border-white/10 p-4" data-modules-de-l-offre="">
          <legend className={`px-2 ${ETIQUETTE}`}>Modules inclus</legend>
          {catalogue.modules.map((m) => {
            const present = o.modules.some((x) => x.module === m.code);
            return (
              <div key={m.code}>
                <label className="flex items-start gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={present}
                    disabled={!m.actif && !present}
                    onChange={(e) => reglerModule(m.code, e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                    data-module={m.code}
                  />
                  <span>
                    <span className="font-semibold">{m.nom}</span>{" "}
                    <span className="text-xs text-slate-400">
                      {m.effet ? "· effet dans le produit (verrou)" : "· descriptif (vendu, sans verrou)"}
                      {m.actif ? "" : " · inactif"}
                    </span>
                  </span>
                </label>
                {m.code === "arene" && present && arene?.parametres ? (
                  <div className="ml-7 mt-2 grid gap-3 sm:grid-cols-2" data-parametres-arene="">
                    <label className="block">
                      <span className={ETIQUETTE}>Entreprises</span>
                      <select
                        value={arene.parametres.entreprises}
                        onChange={(e) => reglerArene({ entreprises: e.target.value as ParametresArene["entreprises"] })}
                        className={CHAMP}
                      >
                        <option value="une">Une, choisie à l&apos;achat</option>
                        <option value="toutes">Toutes</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={ETIQUETTE}>Niveaux</span>
                      <select
                        value={arene.parametres.niveaux}
                        onChange={(e) => reglerArene({ niveaux: e.target.value as ParametresArene["niveaux"] })}
                        className={CHAMP}
                      >
                        <option value="un">Un, choisi à l&apos;achat</option>
                        <option value="tous">Tous</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={ETIQUETTE}>Enseignants</span>
                      <select
                        value={
                          arene.parametres.enseignants === null
                            ? "illimite"
                            : arene.parametres.enseignants === "devis"
                              ? "devis"
                              : "nombre"
                        }
                        onChange={(e) =>
                          reglerArene({
                            enseignants: e.target.value === "illimite" ? null : e.target.value === "devis" ? "devis" : 1,
                          })
                        }
                        className={CHAMP}
                      >
                        <option value="nombre">Un nombre</option>
                        <option value="devis">Fixé au devis</option>
                        <option value="illimite">Sans limite</option>
                      </select>
                      {typeof arene.parametres.enseignants === "number" ? (
                        <input
                          type="number"
                          onWheel={sansMolette}
                          min={1}
                          step={1}
                          aria-label="Nombre d'enseignants"
                          value={arene.parametres.enseignants}
                          onChange={(e) => reglerArene({ enseignants: Math.max(1, Math.round(Number(e.target.value))) })}
                          className={CHAMP}
                        />
                      ) : null}
                    </label>
                    <label className="block">
                      <span className={ETIQUETTE}>Parties en cours en même temps</span>
                      <select
                        value={arene.parametres.partiesEnCours === null ? "illimite" : "nombre"}
                        onChange={(e) => reglerArene({ partiesEnCours: e.target.value === "illimite" ? null : 1 })}
                        className={CHAMP}
                      >
                        <option value="nombre">Un nombre</option>
                        <option value="illimite">Sans plafond</option>
                      </select>
                      {arene.parametres.partiesEnCours !== null ? (
                        <input
                          type="number"
                          onWheel={sansMolette}
                          min={1}
                          step={1}
                          aria-label="Nombre de parties en cours"
                          value={arene.parametres.partiesEnCours}
                          onChange={(e) => reglerArene({ partiesEnCours: Math.max(1, Math.round(Number(e.target.value))) })}
                          className={CHAMP}
                        />
                      ) : null}
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>

        <fieldset className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
          <legend className={`px-2 ${ETIQUETTE}`}>Mention comparative</legend>
          <label className="block">
            <span className={ETIQUETTE}>Mention</span>
            <select
              value={o.mention?.mode ?? "aucune"}
              onChange={(e) =>
                maj({
                  mention:
                    e.target.value === "calculee"
                      ? { mode: "calculee", reference: referencesPossibles[0]?.code ?? "", unite: "groupes" }
                      : e.target.value === "saisie"
                        ? { mode: "saisie", texte: "" }
                        : null,
                })
              }
              className={CHAMP}
            >
              <option value="aucune">Aucune</option>
              <option value="calculee">Calculée sur les prix</option>
              <option value="saisie">Saisie</option>
            </select>
          </label>
          {o.mention?.mode === "calculee" ? (
            <>
              <label className="block">
                <span className={ETIQUETTE}>Comparée à</span>
                <select
                  value={o.mention.reference}
                  onChange={(e) => maj({ mention: { mode: "calculee", reference: e.target.value, unite: o.mention?.mode === "calculee" ? o.mention.unite : "" } })}
                  className={CHAMP}
                >
                  {referencesPossibles.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.nom} ({euros(x.prixCents ?? 0)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={ETIQUETTE}>Unité (« groupes », « entreprises »)</span>
                <input
                  value={o.mention.unite}
                  onChange={(e) => maj({ mention: { mode: "calculee", reference: o.mention?.mode === "calculee" ? o.mention.reference : "", unite: e.target.value } })}
                  className={CHAMP}
                />
              </label>
            </>
          ) : o.mention?.mode === "saisie" ? (
            <label className="block sm:col-span-2">
              <span className={ETIQUETTE}>Texte de la mention</span>
              <input
                value={o.mention.texte}
                onChange={(e) => maj({ mention: { mode: "saisie", texte: e.target.value } })}
                className={CHAMP}
              />
            </label>
          ) : null}
          {o.mention ? (
            <p className="text-sm text-slate-300 sm:col-span-2" data-mention-calculee="">
              {prixPublics || o.mention.mode === "saisie"
                ? `Lue sur /tarifs : ${texteDeLaMention(o, avecElle.offres) ?? "aucune (prix manquant ou égal)"}`
                : `Calculée : ${texteDeLaMention(o, avecElle.offres) ?? "aucune"}. Non affichée tant que les prix sont cachés.`}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={ETIQUETTE}>Ordre d&apos;affichage</span>
            <input
              type="number"
              onWheel={sansMolette}
              step={10}
              value={o.ordre}
              onChange={(e) => maj({ ordre: Math.round(Number(e.target.value)) })}
              className={CHAMP}
            />
          </label>
          <label className="flex items-end gap-3 pb-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={o.visible}
              onChange={(e) => maj({ visible: e.target.checked })}
              className="h-4 w-4 accent-amber-400"
            />
            Visible sur /tarifs
          </label>
          <p className="flex items-end pb-2 text-sm text-slate-400">
            {o.miseEnAvant ? "Mise en avant : le seul bouton plein de /tarifs." : "Pas mise en avant."}
          </p>
          {o.rubrique !== "option" ? (
            <>
              <label className="block">
                <span className={ETIQUETTE}>Libellé du bouton</span>
                <input value={o.bouton.libelle} onChange={(e) => maj({ bouton: { ...o.bouton, libelle: e.target.value } })} className={CHAMP} />
              </label>
              <label className="block">
                <span className={ETIQUETTE}>Cible du bouton</span>
                <input
                  value={o.bouton.cible}
                  placeholder={`/devis?offre=${o.code || "code"}`}
                  onChange={(e) => maj({ bouton: { ...o.bouton, cible: e.target.value } })}
                  className={CHAMP}
                />
              </label>
              <label className="block">
                <span className={ETIQUETTE}>Formulaire du devis</span>
                <select value={o.formulaire} onChange={(e) => maj({ formulaire: e.target.value as Formulaire })} className={CHAMP}>
                  {Object.entries(LIBELLES_DES_FORMULAIRES).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-3">
                <span className={ETIQUETTE}>Nom dans la liste de /devis (facultatif)</span>
                <input
                  value={o.devisLibelle ?? ""}
                  placeholder={o.rubrique === "arene" ? `Offre ${o.nom}` : o.nom}
                  onChange={(e) => maj({ devisLibelle: e.target.value || null })}
                  className={CHAMP}
                />
              </label>
            </>
          ) : null}
        </div>

        <details className="rounded-xl border border-white/10 p-4 text-sm text-slate-300">
          <summary className="cursor-pointer text-slate-200">Variables des textes</summary>
          <p className="mt-2 text-slate-400">
            Un nombre tiré du produit ne s&apos;écrit pas : écrivez la variable, la page la remplit.
          </p>
          <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
            {Object.entries(variables).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-slate-200">{`{${k}}`}</dt>
                <dd className="text-slate-400">{v}</dd>
              </div>
            ))}
          </dl>
        </details>

        {aCorriger.length > 0 ? (
          <ul role="status" className="space-y-1 rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-200" data-a-corriger="">
            {aCorriger.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
        {state.erreurs.length > 0 ? (
          <ul role="alert" className="space-y-1 rounded-lg encadre-perte px-3 py-2 text-sm text-red-300" data-refus-offre="">
            {state.erreurs.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
        <GuardError message={guardError} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={bouton()}>
            {pending ? "Enregistrement…" : mode === "creation" ? "Créer l'offre" : "Enregistrer l'offre"}
          </button>
          <span className="text-xs text-slate-400">
            /tarifs et /devis suivent dès l&apos;enregistrement ; les licences déjà vendues gardent leurs conditions.
          </span>
        </div>
      </form>

      <aside aria-label="Aperçu" className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <p className="libelle">Aperçu sur /tarifs</p>
        {o.rubrique === "arene" ? (
          <CarteDOffre offre={carte} apercu />
        ) : o.rubrique === "option" ? (
          <p className="carte flex items-baseline justify-between gap-4 px-4 py-3 text-base text-slate-200">
            <span>{remplir(o.nom, variables)}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-300">{libelleDuTarif(o, prixPublics)}</span>
          </p>
        ) : o.rubrique === "reseau" ? (
          <p className="carte p-4 text-base leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200">{remplir(o.nom, variables)}.</span> {remplir(o.sousTitre, variables)}{" "}
            <span className="underline">{o.bouton.libelle}</span>
          </p>
        ) : (
          <div className="carte p-4">
            <p className="titre-carte text-slate-100">{remplir(o.sousTitre || o.nom, variables)}</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {[...o.inclus, ...o.formules.map((f) => f.nom)].filter(Boolean).map((x, i) => (
                <li key={i}>{remplir(x, variables)}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-400">{libelleDuTarif(o, prixPublics)}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
