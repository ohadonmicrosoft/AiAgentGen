import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/contexts/toast-context';
import DashboardPage from '@/pages/dashboard';
import LoginPage from '@/pages/login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock API calls
jest.mock('@/lib/api', () => ({
  login: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Get the mocked API
const api = require('@/lib/api');

describe('Login Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock successful login by default
    api.login.mockResolvedValue({
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      token: 'fake-token',
    });

    // Mock current user
    api.getCurrentUser.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  // Helper function to render the component with all required providers
  const renderWithProviders = (initialRoute = '/login') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('should render the login form', () => {
    renderWithProviders();

    // Check that the login form is rendered
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderWithProviders();

    // Submit the form without filling in any fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // API should not be called
    expect(api.login).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email', async () => {
    renderWithProviders();

    // Fill in invalid email
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    // API should not be called
    expect(api.login).not.toHaveBeenCalled();
  });

  it('should successfully log in with valid credentials', async () => {
    renderWithProviders();

    // Fill in valid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    // API should be called with correct credentials
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('should show error message for invalid credentials', async () => {
    // Mock failed login
    api.login.mockRejectedValue({
      message: 'Invalid email or password',
      status: 401,
    });

    renderWithProviders();

    // Fill in credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // Should not redirect
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle network errors during login', async () => {
    // Mock network error
    api.login.mockRejectedValue({
      message: 'Network Error',
      isNetworkError: true,
    });

    renderWithProviders();

    // Fill in credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    // Should show network error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard if already logged in', async () => {
    // Mock that user is already logged in
    localStorage.setItem('auth_token', 'existing-token');

    renderWithProviders();

    // Should redirect to dashboard without needing to log in
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // Login API should not be called
    expect(api.login).not.toHaveBeenCalled();

    // Clean up
    localStorage.removeItem('auth_token');
  });
});
