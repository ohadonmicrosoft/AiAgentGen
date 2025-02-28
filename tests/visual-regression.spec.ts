import { expect, test } from "@playwright/test";

// Test data
const USER_EMAIL = "test@example.com";
const USER_PASSWORD = "password123";

// Pages to test for visual regression
const PAGES_TO_TEST = [
  { name: "login", path: "/login", needsAuth: false },
  { name: "dashboard", path: "/dashboard", needsAuth: true },
  { name: "agents", path: "/agents", needsAuth: true },
  { name: "settings", path: "/settings", needsAuth: true },
  { name: "profile", path: "/profile", needsAuth: true },
];

test.describe("Visual Regression Tests", () => {
  // Login helper function
  async function login(page) {
    await page.goto("/login");
    await page.fill('input[name="email"]', USER_EMAIL);
    await page.fill('input[name="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
  }

  // Test each page
  for (const { name, path, needsAuth } of PAGES_TO_TEST) {
    test(`${name} page visual regression`, async ({ page }) => {
      // Login if needed
      if (needsAuth) {
        await login(page);
      }

      // Navigate to the page
      await page.goto(path);

      // Wait for page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Additional wait to ensure animations are complete
      await page.waitForTimeout(1000);

      // Take a screenshot and compare with baseline
      await expect(page).toHaveScreenshot(`${name}-page.png`, {
        fullPage: true,
        // Allow small differences due to rendering variations
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  // Test responsive layouts
  const VIEWPORT_SIZES = [
    { width: 375, height: 667, name: "mobile" },
    { width: 768, height: 1024, name: "tablet" },
    { width: 1280, height: 800, name: "desktop" },
    { width: 1920, height: 1080, name: "large-desktop" },
  ];

  for (const { width, height, name } of VIEWPORT_SIZES) {
    test(`dashboard responsive layout - ${name}`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width, height });

      // Login
      await login(page);

      // Wait for page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Additional wait to ensure animations are complete
      await page.waitForTimeout(1000);

      // Take a screenshot and compare with baseline
      await expect(page).toHaveScreenshot(`dashboard-${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  // Test dark mode
  test("dashboard in dark mode", async ({ page }) => {
    // Login
    await login(page);

    // Toggle dark mode (assuming there's a dark mode toggle button)
    await page.click('button[aria-label="Toggle dark mode"]');

    // Wait for theme change to apply
    await page.waitForTimeout(500);

    // Take a screenshot and compare with baseline
    await expect(page).toHaveScreenshot("dashboard-dark-mode.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  // Test UI components in isolation
  test("button states", async ({ page }) => {
    // Go to a page with buttons
    await page.goto("/login");

    // Capture default state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveScreenshot("button-default.png");

    // Capture hover state
    await submitButton.hover();
    await expect(submitButton).toHaveScreenshot("button-hover.png");

    // Capture focus state
    await submitButton.focus();
    await expect(submitButton).toHaveScreenshot("button-focus.png");

    // Capture disabled state (if possible)
    // First make the form invalid to disable the button
    await page.fill('input[name="email"]', "invalid-email");
    await page.click("body"); // Click away to trigger validation
    await expect(submitButton).toHaveScreenshot("button-disabled.png");
  });

  // Test error states
  test("form error states", async ({ page }) => {
    await page.goto("/login");

    // Submit empty form to trigger validation errors
    await page.click('button[type="submit"]');

    // Wait for error messages
    await page.waitForSelector("text=Email is required");

    // Take screenshot of form with errors
    await expect(page).toHaveScreenshot("login-form-errors.png");

    // Fill with invalid email
    await page.fill('input[name="email"]', "invalid-email");
    await page.click("body"); // Click away to trigger validation

    // Take screenshot of specific error
    await expect(page).toHaveScreenshot("login-form-invalid-email.png");
  });
});
