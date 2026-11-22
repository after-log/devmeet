-- Keep preset versions referenced by recommendation batches and historical performance.
ALTER TABLE matching_presets ADD COLUMN deleted_at timestamp(6) NULL;
