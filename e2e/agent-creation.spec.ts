import { test, expect } from '@playwright/test';

// Test data
const USER_EMAIL = 'test@example.com';
const USER_PASSWORD = 'password123';
const AGENT_NAME = 'Test Agent';
const AGENT_DESCRIPTION = 'This is a test agent created by automated tests';
const AGENT_SYSTEM_PROMPT =
  'You are a helpful assistant that provides information about testing.';

test.describe('Agent Creation Flow', () => {
  // Before each test, log in
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', USER_EMAIL);
    await page.fill('input[name="password"]', USER_PASSWORD);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify we're logged in
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should create a new agent', async ({ page }) => {
    // Navigate to agents page
    await page.click('a:has-text("Agents")');
    await page.waitForURL('**/agents');

    // Click create new agent button
    await page.click('button:has-text("Create Agent")');

    // Wait for create agent form
    await expect(page.locator('h2:has-text("Create New Agent")')).toBeVisible();

    // Fill in agent details
    await page.fill('input[name="name"]', AGENT_NAME);
    await page.fill('textarea[name="description"]', AGENT_DESCRIPTION);
    await page.fill('textarea[name="systemPrompt"]', AGENT_SYSTEM_PROMPT);

    // Select model (assuming dropdown)
    await page.click('select[name="model"]');
    await page.click('option:has-text("gpt-4o")');

    // Set temperature
    await page.fill('input[name="temperature"]', '0.7');

    // Submit form
    await page.click('button:has-text("Create Agent")');

    // Wait for success message
    await expect(page.locator('text=Agent created successfully')).toBeVisible();

    // Verify agent appears in the list
    await expect(page.locator(`h3:has-text("${AGENT_NAME}")`)).toBeVisible();
    await expect(
      page.locator(`p:has-text("${AGENT_DESCRIPTION}")`),
    ).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Navigate to agents page
    await page.click('a:has-text("Agents")');
    await page.waitForURL('**/agents');

    // Click create new agent button
    await page.click('button:has-text("Create Agent")');

    // Submit empty form
    await page.click('button:has-text("Create Agent")');

    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=System prompt is required')).toBeVisible();
  });

  test('should edit an existing agent', async ({ page }) => {
    // First create an agent
    await page.click('a:has-text("Agents")');
    await page.waitForURL('**/agents');
    await page.click('button:has-text("Create Agent")');

    await page.fill('input[name="name"]', AGENT_NAME);
    await page.fill('textarea[name="description"]', AGENT_DESCRIPTION);
    await page.fill('textarea[name="systemPrompt"]', AGENT_SYSTEM_PROMPT);
    await page.click('select[name="model"]');
    await page.click('option:has-text("gpt-4o")');
    await page.fill('input[name="temperature"]', '0.7');
    await page.click('button:has-text("Create Agent")');

    // Wait for success and agent to appear in list
    await expect(page.locator('text=Agent created successfully')).toBeVisible();

    // Click on the agent to edit
    await page.click(`h3:has-text("${AGENT_NAME}")`);

    // Wait for agent details page
    await expect(page.locator(`h1:has-text("${AGENT_NAME}")`)).toBeVisible();

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Update agent details
    const updatedName = `${AGENT_NAME} (Updated)`;
    await page.fill('input[name="name"]', updatedName);

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success message
    await expect(page.locator('text=Agent updated successfully')).toBeVisible();

    // Verify changes were saved
    await expect(page.locator(`h1:has-text("${updatedName}")`)).toBeVisible();
  });

  test('should test an agent with a message', async ({ page }) => {
    // Navigate to agents page
    await page.click('a:has-text("Agents")');
    await page.waitForURL('**/agents');

    // Click on an existing agent (assuming one exists)
    await page.click(`h3:has-text("${AGENT_NAME}")`);

    // Wait for agent details page
    await expect(page.locator(`h1:has-text("${AGENT_NAME}")`)).toBeVisible();

    // Click test button
    await page.click('button:has-text("Test Agent")');

    // Type a test message
    await page.fill(
      'textarea[placeholder="Type a message"]',
      'Tell me about testing',
    );

    // Send message
    await page.click('button:has-text("Send")');

    // Wait for response
    await expect(page.locator('.agent-response')).toBeVisible({
      timeout: 30000,
    });

    // Verify response contains relevant content
    const responseText = await page.locator('.agent-response').textContent();
    expect(responseText).toContain('test');
  });

  test('should delete an agent', async ({ page }) => {
    // Navigate to agents page
    await page.click('a:has-text("Agents")');
    await page.waitForURL('**/agents');

    // Click on an existing agent
    await page.click(`h3:has-text("${AGENT_NAME}")`);

    // Wait for agent details page
    await expect(page.locator(`h1:has-text("${AGENT_NAME}")`)).toBeVisible();

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion in modal
    await page.click('button:has-text("Confirm Delete")');

    // Wait for success message
    await expect(page.locator('text=Agent deleted successfully')).toBeVisible();

    // Verify agent no longer appears in list
    await expect(
      page.locator(`h3:has-text("${AGENT_NAME}")`),
    ).not.toBeVisible();
  });
});
