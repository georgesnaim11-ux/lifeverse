-- ---------------------------------------------------------------------------
-- Sports depth: contracts, loans, per-season history, ratings, honours.
-- Additive ALTERs on sports_career (010).
-- ---------------------------------------------------------------------------

ALTER TABLE sports_career ADD COLUMN contract_years   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sports_career ADD COLUMN avg_rating       REAL    NOT NULL DEFAULT 0;
ALTER TABLE sports_career ADD COLUMN clean_sheets     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sports_career ADD COLUMN season_history   TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE sports_career ADD COLUMN pending_offer_type TEXT;                    -- transfer | loan | renewal
ALTER TABLE sports_career ADD COLUMN loan_return_club TEXT;
ALTER TABLE sports_career ADD COLUMN loan_years       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sports_career ADD COLUMN captain          INTEGER NOT NULL DEFAULT 0;
