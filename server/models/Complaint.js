/**
 * Mongoose schema for ComplaintItem (mirrors src/types.ts on the frontend).
 *
 * Fields the app queries/sorts/filters by (id, trackingNumber, status,
 * mineId, currentResponsibleRole) are declared explicitly and indexed.
 * Everything else (submittedBy, inspectedBy, maintenanceBy,
 * auditVerifiedBy, media, workflowHistory, ...) is stored as-is via
 * `strict: false` so the schema doesn't have to be hand-kept in sync with
 * every nested field the frontend adds — the frontend's TypeScript
 * interface remains the single source of truth for document shape.
 */

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    trackingNumber: { type: String, index: true },
    status: { type: String, index: true },
    mineId: { type: String, index: true },
    currentResponsibleRole: { type: String, index: true }
  },
  { strict: false, timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
