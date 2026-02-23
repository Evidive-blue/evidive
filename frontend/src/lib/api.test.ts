import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setToken,
  clearToken,
  isAuthenticated,
  centerApi,
  bookingApi,
  reviewApi,
} from "./api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearToken();
  });

  describe("Auth helpers", () => {
    it("isAuthenticated returns false when no token", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("isAuthenticated returns true after setToken", () => {
      setToken("test-token");
      expect(isAuthenticated()).toBe(true);
    });

    it("isAuthenticated returns false after clearToken", () => {
      setToken("test-token");
      clearToken();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("centerApi", () => {
    it("has all expected methods", () => {
      expect(typeof centerApi.getProfile).toBe("function");
      expect(typeof centerApi.updateProfile).toBe("function");
      expect(typeof centerApi.getStats).toBe("function");
      expect(typeof centerApi.getKPIs).toBe("function");
      expect(typeof centerApi.getBookings).toBe("function");
      expect(typeof centerApi.getBooking).toBe("function");
      expect(typeof centerApi.confirmBooking).toBe("function");
      expect(typeof centerApi.cancelBooking).toBe("function");
      expect(typeof centerApi.getServices).toBe("function");
      expect(typeof centerApi.createService).toBe("function");
      expect(typeof centerApi.updateService).toBe("function");
      expect(typeof centerApi.deleteService).toBe("function");
      expect(typeof centerApi.getStaff).toBe("function");
      expect(typeof centerApi.addStaff).toBe("function");
      expect(typeof centerApi.updateStaffMember).toBe("function");
      expect(typeof centerApi.removeStaff).toBe("function");
      expect(typeof centerApi.getPayments).toBe("function");
      expect(typeof centerApi.getRevenue).toBe("function");
      expect(typeof centerApi.getCommissions).toBe("function");
      expect(typeof centerApi.getCalendar).toBe("function");
      expect(typeof centerApi.getBlockedDates).toBe("function");
      expect(typeof centerApi.createBlockedDate).toBe("function");
      expect(typeof centerApi.deleteBlockedDate).toBe("function");
      expect(typeof centerApi.respondToReview).toBe("function");
    });
  });

  describe("bookingApi", () => {
    it("has all expected methods", () => {
      expect(typeof bookingApi.getAll).toBe("function");
      expect(typeof bookingApi.create).toBe("function");
      expect(typeof bookingApi.getById).toBe("function");
      expect(typeof bookingApi.cancel).toBe("function");
      expect(typeof bookingApi.confirm).toBe("function");
      expect(typeof bookingApi.checkAvailability).toBe("function");
    });
  });

  describe("reviewApi", () => {
    it("has all expected methods", () => {
      expect(typeof reviewApi.getCenterReviews).toBe("function");
      expect(typeof reviewApi.create).toBe("function");
      expect(typeof reviewApi.getReviewableBookings).toBe("function");
    });
  });

  describe("API calls", () => {
    it("centerApi.getProfile calls correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "test", display_name: "Test Center" }),
      });

      setToken("test-token");
      const result = await centerApi.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/center/profile"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
      expect(result.display_name).toBe("Test Center");
    });

    it("bookingApi.create sends correct body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "booking-1" }),
      });

      setToken("test-token");
      await bookingApi.create({
        service_id: "svc-1",
        center_id: "center-1",
        booking_date: "2026-03-01",
        time_slot: "10:00",
        start_time: "2026-03-01T10:00:00Z",
        end_time: "2026-03-01T11:00:00Z",
        participants: 2,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/bookings"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("svc-1"),
        })
      );
    });

    it("reviewApi.getCenterReviews calls correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const result = await reviewApi.getCenterReviews("center-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/public/centers/center-1/reviews"),
        expect.any(Object)
      );
      expect(result).toEqual([]);
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Invalid token" }),
      });

      await expect(centerApi.getProfile()).rejects.toThrow("Invalid token");
    });
  });
});
