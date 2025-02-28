import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fluidSpacingToClassName } from '@/hooks/use-fluid-spacing';
import { MainLayout } from '@/layouts/main-layout';
import { fluidSpaceScale } from '@/lib/fluid-spacing';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SpacingDemo() {
  const [selectedTab, setSelectedTab] = useState<string>('containers');

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8 space-y-8"
      >
        <div>
          <h1 className="fluid-h1 font-bold">Dynamic Spacing System</h1>
          <p className="fluid-body text-muted-foreground mt-2 max-w-3xl">
            Explore the dynamic spacing system that automatically adjusts spacing based on viewport
            size. This creates more harmonious layouts that maintain visual hierarchy across all
            device sizes.
          </p>
        </div>

        <Tabs defaultValue="containers" onValueChange={setSelectedTab} value={selectedTab}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="grids">Grids</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          </TabsList>

          <TabsContent value="containers" className="space-y-8 mt-6">
            <section>
              <h2 className="fluid-h3 font-semibold mb-4">Fluid Containers</h2>
              <p className="fluid-body text-muted-foreground mb-6">
                Containers with dynamic padding that adjusts based on screen size
              </p>

              <div className="space-y-8">
                <div className="fluid-container border-2 border-dashed border-primary/40 rounded-lg p-4">
                  <div className="bg-muted p-8 rounded-md text-center">
                    <h3 className="fluid-h4 mb-2">Standard Container</h3>
                    <p className="text-sm text-muted-foreground">
                      Responsive width with fluid padding
                    </p>
                  </div>
                </div>

                <div className="fluid-container-narrow border-2 border-dashed border-primary/40 rounded-lg p-4">
                  <div className="bg-muted p-8 rounded-md text-center">
                    <h3 className="fluid-h4 mb-2">Narrow Container</h3>
                    <p className="text-sm text-muted-foreground">
                      Optimized for reading text (65ch max-width)
                    </p>
                  </div>
                </div>

                <div className="fluid-container-wide border-2 border-dashed border-primary/40 rounded-lg p-4">
                  <div className="bg-muted p-8 rounded-md text-center">
                    <h3 className="fluid-h4 mb-2">Wide Container</h3>
                    <p className="text-sm text-muted-foreground">
                      For layouts that need more horizontal space
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="spacing" className="space-y-8 mt-6">
            <section>
              <h2 className="fluid-h3 font-semibold mb-4">Fluid Spacing Scale</h2>
              <p className="fluid-body text-muted-foreground mb-6">
                Spacing values that scale proportionally with the viewport
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Padding Example</CardTitle>
                    <CardDescription>Elements with fluid padding utilities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(fluidSpaceScale).map(([key, value]) => (
                      <div key={key} className="rounded-md bg-muted/30 border">
                        <div
                          className={`bg-primary/10 border border-primary/30 rounded-md text-center ${fluidSpacingToClassName({ padding: key as any })}`}
                        >
                          <p className="text-sm">fluid-p-{key}</p>
                          <p className="text-xs text-muted-foreground">Computed: {value}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Margin Example</CardTitle>
                    <CardDescription>Elements with fluid margin utilities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <div className="bg-muted/30 p-4 rounded-md">
                      {Object.entries(fluidSpaceScale).map(([key, value]) => (
                        <div
                          key={key}
                          className={`bg-primary/10 border border-primary/30 rounded-md text-center mb-1 ${fluidSpacingToClassName({ margin: key as any })}`}
                        >
                          <p className="text-sm">fluid-m-{key}</p>
                          <p className="text-xs text-muted-foreground">Computed: {value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="grids" className="space-y-8 mt-6">
            <section>
              <h2 className="fluid-h3 font-semibold mb-4">Fluid Grid Gaps</h2>
              <p className="fluid-body text-muted-foreground mb-6">
                Grid layouts with fluid gap spacing that adjusts based on viewport
              </p>

              <Tabs defaultValue="xs">
                <TabsList>
                  <TabsTrigger value="xs">XS</TabsTrigger>
                  <TabsTrigger value="sm">SM</TabsTrigger>
                  <TabsTrigger value="md">MD</TabsTrigger>
                  <TabsTrigger value="lg">LG</TabsTrigger>
                  <TabsTrigger value="xl">XL</TabsTrigger>
                </TabsList>

                <TabsContent value="xs" className="mt-4">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${fluidSpacingToClassName({ gap: 'xs' })}`}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs">Item {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">fluid-gap-xs</p>
                </TabsContent>

                <TabsContent value="sm" className="mt-4">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${fluidSpacingToClassName({ gap: 'sm' })}`}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs">Item {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">fluid-gap-sm</p>
                </TabsContent>

                <TabsContent value="md" className="mt-4">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${fluidSpacingToClassName({ gap: 'md' })}`}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs">Item {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">fluid-gap-md</p>
                </TabsContent>

                <TabsContent value="lg" className="mt-4">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${fluidSpacingToClassName({ gap: 'lg' })}`}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs">Item {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">fluid-gap-lg</p>
                </TabsContent>

                <TabsContent value="xl" className="mt-4">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${fluidSpacingToClassName({ gap: 'xl' })}`}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center"
                      >
                        <span className="text-xs">Item {i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">fluid-gap-xl</p>
                </TabsContent>
              </Tabs>
            </section>
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-8 mt-6">
            <section>
              <h2 className="fluid-h3 font-semibold mb-4">Content Hierarchy Example</h2>
              <p className="fluid-body text-muted-foreground mb-6">
                Spacing that adjusts based on content importance
              </p>

              <div className="border rounded-lg p-6 space-y-6">
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                  <h3 className="fluid-h3 font-semibold">Primary Content</h3>
                  <p className="fluid-body mt-2 text-muted-foreground">
                    Important content has more generous spacing (primary importance)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                    <h4 className="fluid-h5 font-medium">Secondary Content</h4>
                    <p className="fluid-body text-sm mt-2 text-muted-foreground">
                      Secondary content has moderate spacing (secondary importance)
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4 border">
                    <h4 className="fluid-h5 font-medium">Secondary Content</h4>
                    <p className="fluid-body text-sm mt-2 text-muted-foreground">
                      Consistent spacing for content of equal importance
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 border">
                      <h5 className="text-sm font-medium">Tertiary Item {i + 1}</h5>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Tertiary content uses compact spacing
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="fluid-h3 font-semibold mb-4">Content-Aware Spacing</h2>
              <p className="fluid-body text-muted-foreground mb-6">
                Spacing that adjusts based on content length
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Short Content</CardTitle>
                    <CardDescription>More spacing for brief content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-6">
                      <p>This is a short paragraph.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long Content</CardTitle>
                    <CardDescription>Reduced spacing for longer content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm">
                        This is a much longer paragraph that contains more information. When content
                        is longer, we can reduce the spacing to make better use of the available
                        space and maintain a good content density. This helps create a more balanced
                        visual hierarchy and improves readability for longer blocks of text.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}
