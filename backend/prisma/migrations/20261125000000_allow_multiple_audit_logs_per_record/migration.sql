-- Allow multiple audit log entries per compensation record (one per write).
-- Previously one-to-one; now one-to-many so edits can be audited too.
DROP INDEX "audit_logs_compensation_record_id_key";
