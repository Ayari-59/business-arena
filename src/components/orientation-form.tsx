"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  diplomesProposes,
  OBJECTIFS,
  recommander,
  type Semestre,
} from "@/config/orientation";
import { PERIODICITY_LABELS } from "@/config/scenarios/periodicity";

/**
 * Le formulaire d'orientation.
 *
 * Quatre questions, une recommandation immédiate. Elle s'affiche pendant qu'on
 * répond plutôt qu'après un envoi : un enseignant qui compare deux hypothèses
 * ne doit pas attendre une réponse par courrier pour voir ce que chacune donne.
 *
 * Le message n'est donc pas le cœur du formulaire, c'est sa sortie de secours :
 * il part avec le profil et la recommandation déjà écrits, pour que la réponse
 * commence là où la page s'est arrêtée.
 *
 * Sans adresse de contact configurée, le bouton d'envoi disparaît, et rien ne
 * le remplace : l'état de la configuration regarde l'administrateur, pas le
 * visiteur, à qui la recommandation suffit.
 */
export function OrientationForm({ contactEmail }: { contactEmail: string }) {
  const diplomes = diplomesProposes();
  const [diplome, setDiplome] = useState(diplomes[0]!.code);
  const [semestre, setSemestre] = useState<Semestre>("s1");
  const [objectif, setObjectif] = useState(OBJECTIFS[0]!.code);
  const [message, setMessage] = useState("");

  const reco = useMemo(
    () => recommander({ diplome, semestre, objectif }),
    [diplome, semestre, objectif],
  );

  const periodiciteLabel = PERIODICITY_LABELS[reco.periodicite].singular.toLowerCase();
  const lienCourrier = useMemo(() => {
    if (!contactEmail) return null;
    const corps = [
      `Diplôme : ${diplomes.find((d) => d.code === diplome)?.libelle ?? diplome}`,
      `Moment de l'année : ${semestre === "s1" ? "premier semestre" : "second semestre"}`,
      `Objectif : ${OBJECTIFS.find((o) => o.code === objectif)?.libelle ?? objectif}`,
      "",
      "Recommandation de la page :",
      `· Entreprise : ${reco.scenarioTitre}`,
      `· Niveau ${reco.niveau} · ${reco.niveauNom}`,
      `· ${reco.tours} tours, un ${periodiciteLabel} par tour`,
      reco.atelierCode ? `· Atelier : ${reco.atelierCode}` : "· Aucun atelier publié pour ce diplôme",
      "",
      "Ce que je cherche :",
      message.trim() || "(à compléter)",
    ].join("\n");
    return `mailto:${contactEmail}?subject=${encodeURIComponent(
      "Choix d'une simulation",
    )}&body=${encodeURIComponent(corps)}`;
  }, [contactEmail, diplome, diplomes, message, objectif, periodiciteLabel, reco, semestre]);

  const champ =
    "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
  const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <label className="block">
          <span className={etiquette}>Le diplôme préparé</span>
          <select
            value={diplome}
            onChange={(e) => setDiplome(e.target.value)}
            className={champ}
          >
            {diplomes.map((d) => (
              <option key={d.code} value={d.code}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className={etiquette}>Où vous en êtes dans l&apos;année</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["s1", "Premier semestre", "La classe découvre l'outil et la matière"],
                ["s2", "Second semestre", "Les bases sont posées, on peut ouvrir"],
              ] as const
            ).map(([code, titre, aide]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSemestre(code)}
                aria-pressed={semestre === code}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  semestre === code
                    ? "border-amber-400/60 bg-amber-950/20 text-slate-100"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/25"
                }`}
              >
                <span className="block font-medium">{titre}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                  {aide}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={etiquette}>Ce que vous voulez faire travailler</span>
          <select
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            className={champ}
          >
            {OBJECTIFS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={etiquette}>Votre contexte, en quelques lignes</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1200}
            placeholder="Effectif, volume horaire, contraintes de salle, ce que vous avez déjà essayé, ce qui vous manque…"
            className={champ}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Facultatif. C&apos;est ce champ qui nous permet de répondre autre chose que la
            recommandation automatique.
          </span>
        </label>
      </div>

      <div className="space-y-4 rounded-2xl border border-amber-400/25 bg-amber-950/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
          Ce que nous vous conseillons
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-400">Entreprise</dt>
          <dd className="font-medium text-slate-100">{reco.scenarioTitre}</dd>
          <dt className="text-slate-400">Niveau</dt>
          <dd className="font-medium text-slate-100">
            {reco.niveau} · {reco.niveauNom}
          </dd>
          <dt className="text-slate-400">Durée</dt>
          <dd className="font-medium text-slate-100">
            {reco.tours} tours, un {periodiciteLabel} par tour
          </dd>
          <dt className="text-slate-400">Atelier</dt>
          <dd className="font-medium text-slate-100">
            {reco.atelierCode ? (
              <Link
                href={`/animations/${reco.atelierCode}`}
                className="text-amber-300 underline-offset-4 hover:underline"
              >
                Voir le déroulé prêt à animer
              </Link>
            ) : (
              "Aucun atelier publié pour ce diplôme"
            )}
          </dd>
        </dl>

        <ul className="space-y-2 border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-300">
          {reco.pourquoi.map((raison) => (
            <li key={raison}>· {raison}</li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/entreprises#${reco.scenarioCode}`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            La fiche de cette entreprise
          </Link>
          {lienCourrier ? (
            <a
              href={lienCourrier}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Nous écrire avec ce profil
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
