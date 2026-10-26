-- Allow identical snapshot hashes across distinct audit events.
DROP INDEX "AuditTrailHash_hash_value_key";

-- Make logical audit events idempotent under sequential and concurrent delivery.
CREATE UNIQUE INDEX "AuditTrail_tenant_id_entity_type_entity_id_action_key"
ON "AuditTrail"("tenant_id", "entity_type", "entity_id", "action");
