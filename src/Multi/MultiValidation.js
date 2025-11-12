/*
  MultiValidation.js
  ---------------------------------------------
  Centralized schema validator for all workflow steps.

  ✅ Automation (5):
  1) Step-Aware Validation — applies unique schema rules per step.
  2) Smart Rounding — automatically corrects decimal precision (VAT, amounts, etc.).
  3) Field Auto-Fix — replaces null/undefined with defaults or placeholders.
  4) Rule Inheritance — later steps inherit validation from earlier ones (e.g. clientConfirmation uses quotation rules).
  5) Bulk Validate — batch-validates all steps at once for sync or submission.
*/

import { normalizeVAT, guardNumber, calculateNights } from "./MultiUtils";

// Default validators
const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === "" ||
  (typeof v === "object" && Object.keys(v).length === 0);

// ------------------------------------------------------------
// (1) Step-Aware Validation
// ------------------------------------------------------------
export const validateStep = (stepId, data = {}) => {
  const errors = {};
  const fixed = { ...data };

  switch (stepId) {
    case "requisition": {
      if (isEmpty(fixed.hotelId)) errors.hotelId = "Hotel is required.";
      if (isEmpty(fixed.checkIn)) errors.checkIn = "Check-in date required.";
      if (isEmpty(fixed.checkOut)) errors.checkOut = "Check-out date required.";

      // Auto-calc nights
      if (fixed.checkIn && fixed.checkOut)
        fixed.nights = calculateNights(fixed.checkIn, fixed.checkOut);

      fixed.vatPercent = normalizeVAT(fixed.vatPercent);
      fixed.rate = guardNumber(fixed.rate, 0);
      break;
    }

    case "quotation": {
      if (isEmpty(fixed.currency)) errors.currency = "Currency required.";
      fixed.markupPercent = guardNumber(fixed.markupPercent, 0, 500);
      fixed.vatPercent = normalizeVAT(fixed.vatPercent);
      fixed.margin = guardNumber(fixed.margin, 0, 100);
      break;
    }

    case "requestToBook": {
      if (isEmpty(fixed.supplierId)) errors.supplierId = "Supplier required.";
      if (isEmpty(fixed.hotelRefNo)) errors.hotelRefNo = "Hotel reference missing.";
      fixed.balance = guardNumber(fixed.balance, 0);
      break;
    }

    case "clientConfirmation": {
      if (isEmpty(fixed.clientId)) errors.clientId = "Client ID missing.";
      if (isEmpty(fixed.status)) errors.status = "Status is required.";
      fixed.received = guardNumber(fixed.received, 0);
      fixed.balance = guardNumber(fixed.balance, 0);
      break;
    }

    case "invoice": {
      fixed.netAmount = guardNumber(fixed.netAmount, 0);
      fixed.totalPayable = guardNumber(fixed.totalPayable, 0);
      if (isEmpty(fixed.invoiceNo)) errors.invoiceNo = "Invoice number required.";
      break;
    }

    default:
      break;
  }

  // (2) Smart Rounding (amounts, VAT)
  for (const key in fixed) {
    if (typeof fixed[key] === "number")
      fixed[key] = Math.round(fixed[key] * 100) / 100;
  }

  // (3) Field Auto-Fix for nulls
  for (const key in fixed) {
    if (fixed[key] === null || fixed[key] === undefined) {
      fixed[key] = typeof fixed[key] === "number" ? 0 : "";
    }
  }

  return { valid: Object.keys(errors).length === 0, fixed, errors };
};

// ------------------------------------------------------------
// (4) Rule Inheritance (quotation → requestToBook → clientConfirmation → invoice)
// ------------------------------------------------------------
export const inheritRules = (prevStepData, nextStepData) => {
  const merged = { ...prevStepData, ...nextStepData };
  const { fixed } = validateStep("quotation", merged);
  return fixed;
};

// ------------------------------------------------------------
// (5) Bulk Validation — for sync or workflow completion
// ------------------------------------------------------------
export const bulkValidate = (allSteps = {}) => {
  const summary = {};
  let allValid = true;

  Object.entries(allSteps).forEach(([stepId, stepData]) => {
    const { valid, errors } = validateStep(stepId, stepData);
    summary[stepId] = { valid, errors };
    if (!valid) allValid = false;
  });

  return { allValid, summary };
};
