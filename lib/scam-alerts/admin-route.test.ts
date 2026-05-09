import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn(async () => {});
const listScamAlertsForAdmin = vi.fn(async () => [{ id: "a1", title: "Alert 1" }]);
const updateScamAlertStatus = vi.fn(async () => ({ id: "a1", status: "published" }));
const updateScamAlertContent = vi.fn(async () => ({ id: "a1", title: "Edited" }));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin
}));

vi.mock("@/lib/scam-alerts/admin-service", () => ({
  listScamAlertsForAdmin,
  updateScamAlertStatus,
  updateScamAlertContent
}));

describe("admin scam alerts route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    listScamAlertsForAdmin.mockClear();
    updateScamAlertStatus.mockClear();
    updateScamAlertContent.mockClear();
  });

  it("non-admin cannot access", async () => {
    requireAdmin.mockRejectedValueOnce(new Error("forbidden"));
    const { GET } = await import("@/app/api/admin/scam-alerts/route");
    const response = await GET(new Request("http://localhost/api/admin/scam-alerts"));
    expect(response.status).toBe(403);
  });

  it("admin can list alerts", async () => {
    const { GET } = await import("@/app/api/admin/scam-alerts/route");
    const response = await GET(new Request("http://localhost/api/admin/scam-alerts?status=draft"));
    expect(response.status).toBe(200);
    expect(listScamAlertsForAdmin).toHaveBeenCalledWith("draft");
  });

  it("admin can publish draft", async () => {
    const { PATCH } = await import("@/app/api/admin/scam-alerts/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/scam-alerts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "a1", action: "publish" })
      })
    );
    expect(response.status).toBe(200);
    expect(updateScamAlertStatus).toHaveBeenCalledWith("a1", "published");
  });

  it("admin can archive alert", async () => {
    const { PATCH } = await import("@/app/api/admin/scam-alerts/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/scam-alerts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "a1", action: "archive" })
      })
    );
    expect(response.status).toBe(200);
    expect(updateScamAlertStatus).toHaveBeenCalledWith("a1", "archived");
  });
});
