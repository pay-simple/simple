import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import type { Mock } from "bun:test";

import { BASE_URL } from "../lib/constants";
// import the actual sdk, to execute the code, and get the resetState function
import "../index.ts";

/// <reference lib="dom" />

//spays
const spyConsoleDebug = spyOn(console, "debug");

// Helper functions
const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 0));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Helper function to create an email input
function createEmailInput() {
  const input = document.createElement("input");
  input.type = "email";
  input.className = "simple-email";
  document.body.appendChild(input);
  return input;
}

describe("SDK", () => {
  beforeEach(() => {
    // Mock fetch for verify-ids
    const verifyIdsResponse = new Response(JSON.stringify({ error: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    const getRegisterEmailResponse = (email: string) =>
      new Response(
        JSON.stringify({ isRegistered: email.includes("registered") }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    const mockFetch = mock((url: string) => {
      if (url.includes("/api/popup/verify-ids")) {
        return Promise.resolve(verifyIdsResponse);
      }
      if (url.includes("/api/popup/check-email")) {
        return Promise.resolve(
          getRegisterEmailResponse(url.match(/email=([^&]*)/)?.[0] || ""),
        );
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    window.fetch = mockFetch as unknown as typeof fetch;

    // mock window.open
    const mockWindowOpen = mock(() => ({ closed: true }));
    window.open = mockWindowOpen as unknown as typeof window.open;
  });

  afterEach(async () => {
    // Reset DOM
    document.body.innerHTML = "";

    // Reset config
    window.applySimpleConfig();

    // reset all timers
    let id = setTimeout(() => {}, 0) as unknown as number;
    while (id--) {
      clearTimeout(id);
    }

    spyConsoleDebug.mockClear();
    (fetch as Mock<typeof fetch>).mockRestore();
    (window.open as Mock<typeof window.open>).mockRestore();
  });

  describe("Configuration", () => {
    test("should apply valid config", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011", // Valid ObjectId format
        organizationTaxId: "12345678901",
        amount: "100",
      };
      await window.applySimpleConfig(config);
      await waitForNextTick();
      expect(fetch).toHaveBeenCalled();
      expect(spyConsoleDebug).toHaveBeenCalledWith("Simple config:", config);
    });

    test("should reject invalid config", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "invalid-id",
        organizationTaxId: "",
        amount: "-1",
      };

      await window.applySimpleConfig(config);

      // wait For the error logger timeout
      await sleep(600);

      expect(spyConsoleDebug).toHaveBeenCalledWith(
        "Simple config validation errors:",
        expect.arrayContaining([
          "Invalid platformId!",
          "Invalid organizationTaxId!",
          "Invalid amount!",
        ]),
      );
    });
  });

  describe("DOM Manipulation", () => {
    test("should add Simple icon to email input", async () => {
      const input = createEmailInput();
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      };

      await window.applySimpleConfig(config);

      await waitForNextTick();
      const wrapper = input.parentElement;
      expect(wrapper?.classList.contains("simple-wrapper")).toBe(true);
      expect(wrapper?.querySelector("div:last-child")).toBeTruthy();
    });

    test("should remove Simple icon when config is cleared", async () => {
      const input = createEmailInput();

      // First add the icon
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      };
      await window.applySimpleConfig(config);
      await waitForNextTick();
      // first lets verify that the icon is added, so we can remove it
      expect(input.parentElement?.classList.contains("simple-wrapper")).toBe(
        true,
      );

      // Then clear the config
      await window.applySimpleConfig(undefined);
      // wait for the remove transition to finish
      await sleep(1100);
      expect(input.parentElement?.classList.contains("simple-wrapper")).toBe(
        false,
      );
    });
  });

  describe("Email Validation", () => {
    test("should check registered email", async () => {
      const input = createEmailInput();
      input.value = "test@example.com";

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      // wait for the timeout to start validate the email
      await sleep(1100);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );
    });

    test("should not check email before timeout", async () => {
      const input = createEmailInput();
      input.value = "test@example.com";

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      // don't wait for the timeout

      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );
    });

    test("should auto-open popup for registered email", async () => {
      const input = createEmailInput();
      input.value = "registered@example.com"; // Using the mock's check for "registered"

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      // wait for the email revalidation timeout
      await sleep(1100);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(`${BASE_URL}/payment?`),
        "PopupWindow",
        expect.any(String),
      );
    });

    test("should not auto-open popup for unregistered email", async () => {
      const input = createEmailInput();
      input.value = "new-email@example.com";

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      // wait for the email revalidation timeout
      await sleep(1100);

      expect(window.open).not.toHaveBeenCalled();
    });

    test("should not check invalid email format", async () => {
      const input = createEmailInput();
      input.value = "invalid-email";

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      // wait for the timeout
      await sleep(1100);

      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );
    });

    test("should cache email validation results", async () => {
      const input = createEmailInput();
      input.value = "registered@example.com";

      // First check
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      await sleep(1100);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );

      // Second check with same email
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });

      await sleep(1100);
      // Should still be 1 as it uses cached result
      const checkEmailFetchCalls = (
        fetch as Mock<typeof fetch>
      ).mock.calls.filter((call) =>
        String(call[0]).includes("/api/popup/check-email"),
      );
      expect(checkEmailFetchCalls).toHaveLength(1);
    });
  });

  describe("Validation Errors", () => {
    test("should log all validation errors", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "invalid-id",
        organizationTaxId: "",
        amount: "-100",
        email: "invalid-email",
      };

      await window.applySimpleConfig(config);

      // wait for the logger timeout
      await sleep(600);

      expect(spyConsoleDebug).toHaveBeenCalledWith(
        "Simple config validation errors:",
        expect.arrayContaining([
          "Invalid platformId!",
          "Invalid organizationTaxId!",
          "Invalid amount!",
        ]),
      );
    });

    test("should not validate backend IDs if unchanged", async () => {
      const config: Partial<SimpleConfig> = {
        // set different platformId and organizationTaxId
        // workaround to change the cached fields used in the tests
        platformId: "517f1f77bcf86cd799439011",
        organizationTaxId: "23255544",
        amount: "100",
      };

      // First call to validate IDs
      await window.applySimpleConfig(config);
      await waitForNextTick();
      expect(window.fetch).toHaveBeenCalledTimes(1);
      await waitForNextTick();

      // Second call with same IDs
      await window.applySimpleConfig(config);
      await waitForNextTick();
      // Should still be 1 as it skips validation for same IDs
      expect(window.fetch).toHaveBeenCalledTimes(1);
    });

    test("should revalidate backend IDs when changed", async () => {
      // First config
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439012",
        organizationTaxId: "12345678901",
        amount: "100",
      };
      await window.applySimpleConfig(config);
      await waitForNextTick();

      expect(fetch).toHaveBeenCalledTimes(1);
      await waitForNextTick();

      // Second config with different IDs
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439022",
        organizationTaxId: "12345678902",
        amount: "100",
      });
      await waitForNextTick();
      // Should be 2 as it revalidates different IDs
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test("should clear validation error timeout on new config", async () => {
      // First invalid config
      await window.applySimpleConfig({
        platformId: "invalid-id",
        organizationTaxId: "",
        amount: "-100",
      });

      // Immediately apply valid config before timeout
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });

      await sleep(600);
      // Should not see the validation errors from first config
      expect(spyConsoleDebug).not.toHaveBeenCalledWith(
        "Simple config validation errors:",
        expect.any(Array),
      );
    });
  });

  describe("Payment Popup", () => {
    test("should open popup with correct parameters", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: "test@example.com",
      };
      const input = createEmailInput();
      await window.applySimpleConfig(config);

      await waitForNextTick();
      // expect the icon to be there
      expect(input.parentElement?.classList.contains("simple-wrapper")).toBe(
        true,
      );

      // Trigger popup opening
      const icon = input.parentElement?.querySelector("div:last-child");
      icon?.dispatchEvent(new Event("click"));
      await waitForNextTick();

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(`${BASE_URL}/payment?`),
        "PopupWindow",
        expect.any(String),
      );

      // Verify all config parameters are in the URL
      const urlArg = (window.open as Mock<typeof window.open>).mock
        .lastCall?.[0] as string;
      expect(urlArg).toContain(`platformId=${config.platformId}`);
      expect(urlArg).toContain(`organizationTaxId=${config.organizationTaxId}`);
      expect(urlArg).toContain(`amount=${config.amount}`);
      expect(urlArg).toContain(`email=${encodeURIComponent(config.email!)}`);
    });

    test("should open popup with subscription schedule parameters", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: "test@example.com",
        schedule: {
          intervalType: "month",
          intervalCount: 1,
          startDate: "2024-01-01",
          totalPayments: 12,
        },
      };
      createEmailInput(); // Create input to trigger SDK initialization
      await window.applySimpleConfig(config);
      await waitForNextTick();

      const icon = document.querySelector("div[title='Pay with Simple']");
      icon?.dispatchEvent(new Event("click"));
      await waitForNextTick();

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(`${BASE_URL}/payment?`),
        "PopupWindow",
        expect.any(String),
      );

      const urlArg = decodeURIComponent(
        (window.open as Mock<typeof window.open>).mock.lastCall?.[0] as string,
      );
      // Verify subscription parameters
      const schedule = config.schedule;
      if (schedule) {
        expect(urlArg).toContain(`intervalType=${schedule.intervalType}`);
        expect(urlArg).toContain(`intervalCount=${schedule.intervalCount}`);
        expect(urlArg).toContain(`startDate=${schedule.startDate}`);
        expect(urlArg).toContain(`totalPayments=${schedule.totalPayments}`);
      }
    });

    test("should not include empty or undefined parameters in popup URL", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: "", // Empty email
        schedule: {
          intervalType: "month",
          intervalCount: 1,
          // startDate and endDate omitted
          totalPayments: undefined, // Undefined value
        },
      };
      createEmailInput(); // Create input to trigger SDK initialization
      await window.applySimpleConfig(config);
      await waitForNextTick();

      const icon = document.querySelector("div[title='Pay with Simple']");
      icon?.dispatchEvent(new Event("click"));
      await waitForNextTick();

      const urlArg = decodeURIComponent(
        (window.open as Mock<typeof window.open>).mock.lastCall?.[0] as string,
      );
      // Verify required parameters are present
      expect(urlArg).toContain(`platformId=${config.platformId}`);
      expect(urlArg).toContain(`organizationTaxId=${config.organizationTaxId}`);
      expect(urlArg).toContain(`amount=${config.amount}`);
      const schedule = config.schedule;
      if (schedule) {
        expect(urlArg).toContain(`intervalType=${schedule.intervalType}`);
        expect(urlArg).toContain(`intervalCount=${schedule.intervalCount}`);
      }

      // Verify empty/undefined parameters are not included
      expect(urlArg).not.toContain("email=");
      expect(urlArg).not.toContain("startDate=");
      expect(urlArg).not.toContain("endDate=");
      expect(urlArg).not.toContain("totalPayments=");
    });

    test("should encode special characters in URL parameters", async () => {
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: "test+special@example.com", // Email with special characters
      };
      createEmailInput(); // Create input to trigger SDK initialization
      await window.applySimpleConfig(config);
      await waitForNextTick();

      const icon = document.querySelector("div[title='Pay with Simple']");
      icon?.dispatchEvent(new Event("click"));
      await waitForNextTick();

      const urlArg = (window.open as Mock<typeof window.open>).mock
        .lastCall?.[0] as string;
      expect(urlArg).toBeString();
      // Verify email is properly encoded
      expect(urlArg).toContain(
        `email=${encodeURIComponent(config.email || "")}`,
      );
      expect(urlArg).toContain("test%2Bspecial%40example.com");
    });
  });

  describe("Response Handling", () => {
    test("should call onSuccess callback with response data when receiving success message", async () => {
      const mockOnSuccess = mock(() => {});
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        onSuccess: mockOnSuccess,
      };

      await window.applySimpleConfig(config);
      await waitForNextTick();

      // Simulate a success message from the payment popup
      const responseData = {
        id: "123",
        amount: 10000,
        platformId: config.platformId,
        organizationTaxId: config.organizationTaxId,
        name: "Test User",
        gatewayTransactionId: "gw_123",
        createdAt: new Date().toISOString(),
      };

      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "success", data: responseData },
          origin: BASE_URL,
        }),
      );

      await waitForNextTick();
      expect(mockOnSuccess).toHaveBeenCalledWith(responseData);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    test("should not call onSuccess callback for messages from different origin", async () => {
      const mockOnSuccess = mock(() => {});
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        onSuccess: mockOnSuccess,
      };

      await window.applySimpleConfig(config);
      await waitForNextTick();

      // Simulate a message from a different origin
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "success", data: {} },
          origin: "https://malicious-site.com",
        }),
      );

      await waitForNextTick();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test("should not call onSuccess callback for non-success message types", async () => {
      const mockOnSuccess = mock(() => {});
      const config: Partial<SimpleConfig> = {
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        onSuccess: mockOnSuccess,
      };

      await window.applySimpleConfig(config);
      await waitForNextTick();

      // Simulate a non-success message
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "error", data: {} },
          origin: BASE_URL,
        }),
      );

      await waitForNextTick();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Console Logging", () => {
    test("should log when adding Simple icon", async () => {
      createEmailInput();
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });

      await waitForNextTick();
      expect(spyConsoleDebug).toHaveBeenCalledWith("Injecting Simple icon");
      expect(spyConsoleDebug).toHaveBeenCalledWith("Simple icon added");
    });

    test("should log when removing Simple icon", async () => {
      createEmailInput();

      // First add the icon
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });
      await waitForNextTick();

      // Then remove it
      await window.applySimpleConfig(undefined);
      expect(spyConsoleDebug).toHaveBeenCalledWith("Removing Simple icon");
    });

    test("should log when checking registered email", async () => {
      const input = createEmailInput();
      // set different email than the previous test
      // to make sure the email is not cached
      input.value = "registered-new@example.com";

      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799339011",
        organizationTaxId: "12121212133",
        amount: "100",
        email: input.value,
      });

      await sleep(1100);
      expect(spyConsoleDebug).toHaveBeenCalledWith(
        "Checking if email is registered:",
        "registered-new@example.com",
      );
      expect(spyConsoleDebug).toHaveBeenCalledWith(
        "Email is registered, opening popup",
      );
    });

    test("should log when using cached email validation", async () => {
      const input = createEmailInput();
      input.value = "registered@example.com";

      // First check
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });
      await sleep(1100);

      // Second check
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
        email: input.value,
      });
      await sleep(1100);

      expect(spyConsoleDebug).toHaveBeenCalledWith(
        "Using cached email validation result",
      );
    });
  });

  describe("Input Event Handling", () => {
    test("should update config when email input changes", async () => {
      const input = createEmailInput();
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });
      await waitForNextTick();

      // Simulate typing in the input
      input.value = "test@example.com";
      input.dispatchEvent(new Event("input"));

      await sleep(1100);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );
    });

    test("should abort previous email check when input changes rapidly", async () => {
      const input = createEmailInput();
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });
      await waitForNextTick();

      // Simulate typing multiple times quickly
      input.value = "test1@example.com";
      input.dispatchEvent(new Event("input"));

      await sleep(100);

      input.value = "test2@example.com";
      input.dispatchEvent(new Event("input"));

      await sleep(1100);

      // Should only check the last value
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("test1@example.com"),
        expect.any(Object),
      );
    });

    test("should cleanup event listeners when config is cleared", async () => {
      const input = createEmailInput();
      await window.applySimpleConfig({
        platformId: "507f1f77bcf86cd799439011",
        organizationTaxId: "12345678901",
        amount: "100",
      });
      await waitForNextTick();
      input.value = "test-previous@example.com";
      input.dispatchEvent(new Event("input"));
      await waitForNextTick();

      await window.applySimpleConfig(undefined);

      // expect the fetch to have been called
      await sleep(1100);
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );

      // After cleanup, input events should not trigger email checks
      input.value = "test@example.com";
      input.dispatchEvent(new Event("input"));

      await sleep(1100);
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/api/popup/check-email"),
        expect.any(Object),
      );
    });
  });
});
