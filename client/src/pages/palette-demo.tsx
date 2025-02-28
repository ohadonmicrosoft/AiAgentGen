import { PaletteGenerator } from '@/components/palette-generator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/layouts/main-layout';
import { motion } from 'framer-motion';

export default function PaletteDemo() {
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8 space-y-8"
      >
        <div>
          <h1 className="fluid-h1 font-bold">Color Palette Generator</h1>
          <p className="fluid-body text-muted-foreground mt-2 max-w-3xl">
            Create harmonious color schemes for your AI agents. This tool helps you generate
            consistent and accessible color palettes that can be applied to customize the user
            interface.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PaletteGenerator />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="fluid-h4">How It Works</CardTitle>
                <CardDescription>Understanding color theory and palette generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="fluid-h5 font-medium mb-2">Color Harmony</h3>
                  <p className="fluid-small text-muted-foreground">
                    Our palette generator creates harmonious color combinations based on color
                    theory principles:
                  </p>
                  <ul className="mt-2 space-y-1 fluid-small text-muted-foreground list-disc pl-4">
                    <li>Complementary colors (opposite on color wheel)</li>
                    <li>Analogous colors (adjacent on color wheel)</li>
                    <li>Triadic colors (equidistant on color wheel)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="fluid-h5 font-medium mb-2">Variations</h3>
                  <p className="fluid-small text-muted-foreground">
                    For each base color, the generator creates:
                  </p>
                  <ul className="mt-2 space-y-1 fluid-small text-muted-foreground list-disc pl-4">
                    <li>
                      <span className="font-medium">Shades</span>: Darker variations of the base
                      color
                    </li>
                    <li>
                      <span className="font-medium">Tints</span>: Lighter variations of the base
                      color
                    </li>
                    <li>
                      <span className="font-medium">Tones</span>: Desaturated variations of the base
                      color
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="fluid-h5 font-medium mb-2">Accessibility</h3>
                  <p className="fluid-small text-muted-foreground">
                    Colors are evaluated for accessibility, with contrast ratios indicated by
                    badges:
                  </p>
                  <ul className="mt-2 space-y-1 fluid-small text-muted-foreground list-disc pl-4">
                    <li>
                      <span className="font-medium">AAA</span>: High contrast (7:1 ratio)
                    </li>
                    <li>
                      <span className="font-medium">AA</span>: Good contrast (4.5:1 ratio)
                    </li>
                    <li>
                      <span className="font-medium">AA Large</span>: Suitable for large text (3:1
                      ratio)
                    </li>
                  </ul>
                  <p className="mt-2 fluid-small text-muted-foreground">
                    The palette generator automatically chooses text colors that maintain
                    readability.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="fluid-h4">Tips</CardTitle>
                <CardDescription>Get the most out of the color palette generator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 fluid-small text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                      1
                    </span>
                    <span>Start with a brand color as your base to maintain consistency</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                      2
                    </span>
                    <span>
                      Use the "Apply to Theme" button to see the palette in action across the entire
                      interface
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                      3
                    </span>
                    <span>Click on any color swatch to copy its hex code to the clipboard</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                      4
                    </span>
                    <span>
                      Use the "Theme Preview" tab to see how the colors work together in UI
                      components
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium text-xs">
                      5
                    </span>
                    <span>
                      Pay attention to contrast ratios (AAA, AA badges) for accessibility compliance
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
