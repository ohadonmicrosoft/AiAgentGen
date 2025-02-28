import React, { useState, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfiniteScrollLoader, LoadingIndicator } from '@/components/ui/loading-indicator';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Generate a random color for cards
const getRandomColor = () => {
  const colors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-yellow-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-teal-100',
    'bg-orange-100',
    'bg-red-100',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate a random item with an ID, title, and color
const generateRandomItem = (id: number) => ({
  id,
  title: `Item ${id}`,
  description: `This is the description for item ${id}`,
  color: getRandomColor(),
  height: Math.floor(Math.random() * 100) + 100, // Random height between 100-200px
});

// Generate initial items
const generateInitialItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => generateRandomItem(i + 1));
};

const InfiniteScrollDemo: React.FC = () => {
  const [items, setItems] = useState(() => generateInitialItems(20));
  const [totalItems, setTotalItems] = useState(100);
  const [delayMs, setDelayMs] = useState(1000);
  const [shouldError, setShouldError] = useState(false);
  const [scrollType, setScrollType] = useState<'window' | 'container'>('window');

  const containerRef = useRef<HTMLDivElement>(null);

  // Callback to load more items
  const loadMoreItems = useCallback(async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Simulate error if shouldError is true
    if (shouldError) {
      throw new Error('Failed to load more items');
    }

    // Add more items
    setItems((prev) => [
      ...prev,
      ...Array.from({ length: 10 }, (_, i) => generateRandomItem(prev.length + i + 1)),
    ]);
  }, [delayMs, shouldError]);

  // Use our infinite scroll hook
  const { sentinelRef, isLoading, error, loadMore } = useInfiniteScroll({
    hasMore: items.length < totalItems,
    onLoadMore: loadMoreItems,
    scrollContainer: scrollType === 'container' ? containerRef : undefined,
  });

  // Reset the demo
  const handleReset = () => {
    setItems(generateInitialItems(20));
    setShouldError(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Infinite Scroll Demo</h1>
          <p className="text-muted-foreground mb-6">
            Demonstrating smooth infinite scrolling with loading indicators and error handling
          </p>

          <Card className="p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="delay" className="block text-sm font-medium mb-1">
                  Loading Delay (ms)
                </label>
                <Input
                  id="delay"
                  type="number"
                  min={0}
                  max={5000}
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="totalItems" className="block text-sm font-medium mb-1">
                  Total Items
                </label>
                <Input
                  id="totalItems"
                  type="number"
                  min={20}
                  max={1000}
                  value={totalItems}
                  onChange={(e) => setTotalItems(parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleReset} className="mr-2">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant={shouldError ? 'destructive' : 'outline'}
                  onClick={() => setShouldError(!shouldError)}
                >
                  {shouldError ? 'Error Enabled' : 'Simulate Error'}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Scroll Type</label>
              <div className="flex gap-2">
                <Button
                  variant={scrollType === 'window' ? 'default' : 'outline'}
                  onClick={() => setScrollType('window')}
                >
                  Window Scroll
                </Button>
                <Button
                  variant={scrollType === 'container' ? 'default' : 'outline'}
                  onClick={() => setScrollType('container')}
                >
                  Container Scroll
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading items</AlertTitle>
              <AlertDescription>
                {error.message}
                <Button variant="outline" size="sm" className="ml-2" onClick={() => loadMore()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <h2 className="text-xl font-semibold mb-4">
            Items ({items.length}/{totalItems})
          </h2>

          {scrollType === 'container' ? (
            <div
              ref={containerRef}
              style={{
                height: '600px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
              }}
              className="rounded-md"
            >
              <div className="p-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}

                <div ref={sentinelRef} className="py-4">
                  {isLoading && <InfiniteScrollLoader />}
                </div>
              </div>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}

              <div ref={sentinelRef} className="py-4">
                {isLoading && <InfiniteScrollLoader />}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
};

interface ItemProps {
  item: {
    id: number;
    title: string;
    description: string;
    color: string;
    height: number;
  };
}

const ItemCard: React.FC<ItemProps> = ({ item }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className={`p-4 ${item.color}`}>
        <div style={{ minHeight: `${item.height}px` }}>
          <h3 className="text-lg font-medium">{item.title}</h3>
          <p className="text-muted-foreground">{item.description}</p>
          <p className="text-xs text-muted-foreground mt-2">ID: {item.id}</p>
        </div>
      </Card>
    </motion.div>
  );
};

export default InfiniteScrollDemo;
