import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OfflineIndicator } from '../offline-indicator';
import * as offlineForms from '@/lib/offline-forms';
import { useToast } from '@/hooks/use-toast';

// Mock the offline forms functionality
jest.mock('@/lib/offline-forms', () => ({
  isOnline: jest.fn(),
  getPendingForms: jest.fn(),
  syncOfflineForms: jest.fn(),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('OfflineIndicator Component', () => {
  // Default mock implementations
  beforeEach(() => {
    jest.clearAllMocks();

    // Default to online with no pending forms
    (offlineForms.isOnline as jest.Mock).mockReturnValue(true);
    (offlineForms.getPendingForms as jest.Mock).mockResolvedValue([]);
    (offlineForms.syncOfflineForms as jest.Mock).mockResolvedValue({ success: 0, failed: 0 });

    // Mock the toast hook
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
  });

  it('renders nothing when online with no pending forms', async () => {
    const { container } = render(<OfflineIndicator />);

    // Wait for any async operations
    await act(async () => {
      // Simulate the useEffect
    });

    expect(container.firstChild).toBeNull();
  });

  it('shows offline indicator when offline', async () => {
    // Mock offline status
    (offlineForms.isOnline as jest.Mock).mockReturnValue(false);

    render(<OfflineIndicator />);

    // Wait for any async operations
    await act(async () => {
      // Simulate the useEffect
    });

    // Check for offline text
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows pending items count when there are pending forms', async () => {
    // Mock pending forms
    (offlineForms.getPendingForms as jest.Mock).mockResolvedValue([
      {
        id: '1',
        url: '/api/test',
        method: 'POST',
        body: '{}',
        headers: {},
        timestamp: Date.now(),
        retries: 0,
      },
      {
        id: '2',
        url: '/api/test2',
        method: 'POST',
        body: '{}',
        headers: {},
        timestamp: Date.now(),
        retries: 0,
      },
    ]);

    render(<OfflineIndicator />);

    // Wait for any async operations
    await act(async () => {
      // Force the pending forms check to complete
      await Promise.resolve();
    });

    // Check for pending items text
    expect(screen.getByText('2 items pending')).toBeInTheDocument();
  });

  it('shows "Sync Now" button when online with pending forms', async () => {
    // Mock online status with pending forms
    (offlineForms.isOnline as jest.Mock).mockReturnValue(true);
    (offlineForms.getPendingForms as jest.Mock).mockResolvedValue([
      {
        id: '1',
        url: '/api/test',
        method: 'POST',
        body: '{}',
        headers: {},
        timestamp: Date.now(),
        retries: 0,
      },
    ]);

    render(<OfflineIndicator />);

    // Wait for any async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Check for sync button
    expect(screen.getByText('Sync Now')).toBeInTheDocument();
  });

  it('syncs forms when "Sync Now" button is clicked', async () => {
    // Mock successful sync
    (offlineForms.isOnline as jest.Mock).mockReturnValue(true);
    (offlineForms.getPendingForms as jest.Mock).mockResolvedValue([
      {
        id: '1',
        url: '/api/test',
        method: 'POST',
        body: '{}',
        headers: {},
        timestamp: Date.now(),
        retries: 0,
      },
    ]);
    (offlineForms.syncOfflineForms as jest.Mock).mockResolvedValue({ success: 1, failed: 0 });

    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });

    render(<OfflineIndicator />);

    // Wait for initial rendering
    await act(async () => {
      await Promise.resolve();
    });

    // Click sync button
    fireEvent.click(screen.getByText('Sync Now'));

    // Wait for sync to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Check that sync was called and toast was shown
    expect(offlineForms.syncOfflineForms).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sync completed',
      }),
    );
  });

  it('shows error toast when sync fails', async () => {
    // Mock online status with pending forms
    (offlineForms.isOnline as jest.Mock).mockReturnValue(true);
    (offlineForms.getPendingForms as jest.Mock).mockResolvedValue([
      {
        id: '1',
        url: '/api/test',
        method: 'POST',
        body: '{}',
        headers: {},
        timestamp: Date.now(),
        retries: 0,
      },
    ]);

    // Mock sync failure
    (offlineForms.syncOfflineForms as jest.Mock).mockRejectedValue(new Error('Sync failed'));

    const mockToast = jest.fn();
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });

    render(<OfflineIndicator />);

    // Wait for initial rendering
    await act(async () => {
      await Promise.resolve();
    });

    // Click sync button
    fireEvent.click(screen.getByText('Sync Now'));

    // Wait for sync to complete (with error)
    await act(async () => {
      try {
        await Promise.resolve();
      } catch (error) {
        // Ignore error
      }
    });

    // Check that toast was shown with error message
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sync failed',
        variant: 'destructive',
      }),
    );
  });

  it('applies custom className correctly', async () => {
    // Mock offline to ensure rendering
    (offlineForms.isOnline as jest.Mock).mockReturnValue(false);

    render(<OfflineIndicator className="custom-class" />);

    // Wait for any async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Find the container element
    const container = screen.getByText('Offline').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});
