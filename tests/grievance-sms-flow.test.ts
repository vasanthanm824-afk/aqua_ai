import { test, describe } from "node:test";
import assert from "node:assert";
import { formatIndianPhoneNumber, maskPhoneNumber, sendGrievanceSmsConfirmation } from "../src/lib/sms";
import { generateUniqueTrackingId } from "../src/lib/complaint-routing";

describe("AQUA-LENS Grievance → Admin → SMS Flow Integration Tests", () => {
  test("should validate Indian 10-digit mobile numbers with +91 handling", () => {
    const valid1 = formatIndianPhoneNumber("9876543210");
    assert.strictEqual(valid1.isValid, true);
    assert.strictEqual(valid1.formatted, "+919876543210");

    const valid2 = formatIndianPhoneNumber("+91 8765432109");
    assert.strictEqual(valid2.isValid, true);
    assert.strictEqual(valid2.formatted, "+918765432109");

    const invalidShort = formatIndianPhoneNumber("12345");
    assert.strictEqual(invalidShort.isValid, false);

    const invalidPrefix = formatIndianPhoneNumber("1234567890"); // Starts with 1
    assert.strictEqual(invalidPrefix.isValid, false);
  });

  test("should securely mask citizen phone numbers for privacy protection", () => {
    const masked1 = maskPhoneNumber("9876543210");
    assert.strictEqual(masked1, "+91 ******3210");

    const masked2 = maskPhoneNumber("+91 8765432109");
    assert.strictEqual(masked2, "+91 ******2109");
  });

  test("should generate authoritative server-side unique tracking IDs", () => {
    const trackingId = generateUniqueTrackingId({
      state: "Tamil Nadu",
      district: "Ramanathapuram",
      count: 123,
    });
    assert.ok(trackingId.startsWith("AQL-2026-TN-RAM-"));
    assert.ok(trackingId.endsWith("000123"));
  });

  test("should format SMS text according to exact specification", async () => {
    const result = await sendGrievanceSmsConfirmation({
      toPhoneNumber: "9876543210",
      trackingId: "AQL-2026-TN-RAM-000124",
      complaintNumber: "CMP-2026-0001",
      category: "WATER_SUPPLY",
      department: "TWAD Board",
      locationName: "Mandapam Coastal Habitation",
    });

    assert.strictEqual(result.recipient, "+919876543210");
    assert.ok(result.message.includes("Aqua-Lens: Your grievance has been registered successfully."));
    assert.ok(result.message.includes("Tracking ID: AQL-2026-TN-RAM-000124"));
    assert.ok(result.message.includes("Use this ID to track your complaint."));
  });
});
