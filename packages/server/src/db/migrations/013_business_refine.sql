-- ---------------------------------------------------------------------------
-- Business rebalance: supplier discovery (Find Better Supplier unlocks tiers).
-- Product JSON is reshaped in the model's read backfill (price/marketing/
-- inventory/improveLevel), so no data migration is needed for existing saves.
-- ---------------------------------------------------------------------------

ALTER TABLE businesses ADD COLUMN supplier_unlocked INTEGER NOT NULL DEFAULT 2;
