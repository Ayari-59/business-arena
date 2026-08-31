CREATE UNIQUE INDEX "competition_entries_label_ci_uq" ON "competition_entries" ("competition_id", lower("team_label"));
