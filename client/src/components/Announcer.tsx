import React, { useEffect, useRef, useState } from 'react';
import { AnnouncementType } from '@/lib/accessibility';

interface AnnouncerProps {
  /**
   * The message to be announced
   */
  message: string;
  
  /**
   * The type of announcement
   */
  type?: AnnouncementType;
  
  /**
   * The politeness level
   * @default 'polite'
   */
  politeness?: 'polite' | 'assertive';
  
  /**
   * The role of the announcer
   * @default 'status'
   */
  role?: 'status' | 'alert';
  
  /**
   * Whether to clear the message after announcing
   * @default true
   */
  clearAfter?: number | boolean;
}

/**
 * Component that announces messages to screen readers
 */
export function Announcer({
  message,
  type = 'polite',
  politeness = 'polite',
  role = 'status',
  clearAfter = true
}: AnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState(message);
  const announcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Update the message when the prop changes
  useEffect(() => {
    // Clear any existing timeout
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
      announcementTimeoutRef.current = null;
    }
    
    // If the message is empty, don't announce anything
    if (!message) {
      setCurrentMessage('');
      return;
    }
    
    // Clear the message first to ensure the screen reader announces it again
    // even if the same message is sent twice
    setCurrentMessage('');
    
    // Use setTimeout to ensure the previous state change is processed
    const timeout = setTimeout(() => {
      setCurrentMessage(message);
      
      // Clear the message after a delay if clearAfter is enabled
      if (clearAfter) {
        const clearDelay = typeof clearAfter === 'number' ? clearAfter : 5000;
        announcementTimeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearDelay);
      }
    }, 50);
    
    return () => {
      clearTimeout(timeout);
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, [message, clearAfter]);
  
  return (
    <div
      aria-live={politeness}
      role={role}
      aria-atomic="true"
      className="sr-only"
      data-testid="announcer"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Component that uses the Announcer to provide live region announcements for a list of items
 */
export function LiveRegion({
  items, 
  itemType,
  loading = false,
  error = null,
  emptyMessage = 'No items found',
  loadingMessage = 'Loading items',
  errorMessage = 'Error loading items',
  politeness = 'polite'
}: {
  items: any[];
  itemType: string;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  politeness?: 'polite' | 'assertive';
}) {
  const getMessage = () => {
    if (loading) return loadingMessage;
    if (error) return errorMessage;
    if (items.length === 0) return emptyMessage;
    return `${items.length} ${itemType}${items.length === 1 ? '' : 's'} loaded`;
  };
  
  return <Announcer message={getMessage()} politeness={politeness} />;
} 