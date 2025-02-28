import { useState, useEffect } from 'react';
import {
  generatePalette,
  getContrastRatio,
  getAccessibleTextColor,
  generateThemeColors,
  toHslString,
} from '@/lib/color-palette';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Paintbrush, Save, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/use-theme';
import { motion } from 'framer-motion';

interface ColorSwatchProps {
  color: string;
  label?: string;
  showHex?: boolean;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ColorSwatch = ({
  color,
  label,
  showHex = true,
  onClick,
  selected = false,
  size = 'md',
}: ColorSwatchProps) => {
  const [copied, setCopied] = useState(false);
  const textColor = getAccessibleTextColor(color);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const contrastRatio = getContrastRatio(color, textColor);

  // Determine WCAG compliance
  const isAALarge = contrastRatio >= 3;
  const isAA = contrastRatio >= 4.5;
  const isAAA = contrastRatio >= 7;

  let badgeText = '';
  let badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary' =
    'destructive';

  if (isAAA) {
    badgeText = 'AAA';
    badgeVariant = 'default';
  } else if (isAA) {
    badgeText = 'AA';
    badgeVariant = 'secondary';
  } else if (isAALarge) {
    badgeText = 'AA Large';
    badgeVariant = 'outline';
  }

  return (
    <div
      onClick={onClick}
      className={`
        ${size === 'sm' ? 'h-8' : size === 'lg' ? 'h-24' : 'h-16'}
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        rounded-md overflow-hidden cursor-pointer group relative
        ${onClick ? 'hover:scale-105 transition-transform' : ''}
      `}
      style={{ backgroundColor: color }}
    >
      <div
        className="h-full w-full p-2 flex flex-col justify-between"
        style={{ color: textColor }}
      >
        {label && <div className="text-xs font-medium opacity-80">{label}</div>}

        <div className="flex justify-between items-end">
          {showHex && (
            <div className="text-xs font-mono">{color.toUpperCase()}</div>
          )}

          {badgeText && size !== 'sm' && (
            <Badge variant={badgeVariant} className="text-[0.65rem] h-4">
              {badgeText}
            </Badge>
          )}

          <button
            onClick={copyToClipboard}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Copy color code"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ColorRowProps {
  colors: string[];
  label?: string;
}

const ColorRow = ({ colors, label }: ColorRowProps) => {
  return (
    <div className="space-y-2">
      {label && <h3 className="text-sm font-medium">{label}</h3>}
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color, index) => (
          <ColorSwatch
            key={`${color}-${index}`}
            color={color}
            size="sm"
            showHex={false}
          />
        ))}
      </div>
    </div>
  );
};

const randomColor = () => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
};

export function PaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#3B82F6'); // Default to a nice blue
  const [inputColor, setInputColor] = useState(baseColor);
  const [palette, setPalette] = useState(generatePalette(baseColor));
  const { setTheme } = useTheme();
  const [themePreview, setThemePreview] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('palette');

  useEffect(() => {
    // Update theme preview when base color changes
    const themeColors = generateThemeColors(baseColor);
    const preview: Record<string, string> = {};

    Object.entries(themeColors).forEach(([key, value]) => {
      preview[key] = `hsl(${value})`;
    });

    setThemePreview(preview);
  }, [baseColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputColor(e.target.value);
  };

  const updatePalette = () => {
    try {
      // Validate color format
      if (/^#[0-9A-F]{6}$/i.test(inputColor)) {
        setBaseColor(inputColor);
        setPalette(generatePalette(inputColor));
      }
    } catch (error) {
      console.error('Invalid color format', error);
    }
  };

  const generateRandomPalette = () => {
    const newColor = randomColor();
    setInputColor(newColor);
    setBaseColor(newColor);
    setPalette(generatePalette(newColor));
  };

  const applyTheme = () => {
    // Apply the generated theme to the application
    const root = document.documentElement;
    const themeColors = generateThemeColors(baseColor);

    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Update the current theme to custom
    setTheme('custom');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="fluid-h4">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            <span>Color Palette Generator</span>
          </div>
        </CardTitle>
        <CardDescription>
          Create and preview harmonious color palettes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="baseColor">Base Color</Label>
            <div className="flex space-x-2">
              <div className="flex-1 flex space-x-2">
                <div
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: inputColor }}
                />
                <Input
                  id="baseColor"
                  type="text"
                  value={inputColor}
                  onChange={handleColorChange}
                  className="font-mono"
                  placeholder="#RRGGBB"
                />
              </div>
              <Input
                type="color"
                value={inputColor}
                onChange={handleColorChange}
                className="w-12 p-1 h-10"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={updatePalette} className="flex-1">
              Generate
            </Button>
            <Button
              variant="outline"
              onClick={generateRandomPalette}
              className="px-3"
              title="Generate random palette"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="palette">Color Harmony</TabsTrigger>
            <TabsTrigger value="theme">Theme Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="palette" className="space-y-6 pt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Base & Complementary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ColorSwatch
                    color={palette.base}
                    label="Base"
                    size="lg"
                    selected={true}
                  />
                  <ColorSwatch
                    color={palette.complementary}
                    label="Complementary"
                    size="lg"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Harmonious Combinations</h3>

                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">
                    Analogous Colors
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {palette.analogous.map((color, index) => (
                      <ColorSwatch
                        key={`analogous-${index}`}
                        color={color}
                        selected={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">
                    Triadic Colors
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {palette.triadic.map((color, index) => (
                      <ColorSwatch
                        key={`triadic-${index}`}
                        color={color}
                        selected={index === 0}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Variations</h3>
                <ColorRow colors={palette.shades} label="Shades" />
                <ColorRow colors={palette.tints} label="Tints" />
                <ColorRow colors={palette.tones} label="Tones" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Primary & Secondary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-xs text-muted-foreground">Primary</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <ColorSwatch
                        color={themePreview.primary || ''}
                        label="Primary"
                      />
                      <ColorSwatch
                        color={themePreview.primaryForeground || ''}
                        label="Primary Foreground"
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs text-muted-foreground">
                      Secondary & Accent
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <ColorSwatch
                        color={themePreview.secondary || ''}
                        label="Secondary"
                      />
                      <ColorSwatch
                        color={themePreview.accent || ''}
                        label="Accent"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Background & Surfaces</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-xs text-muted-foreground">
                      Background
                    </h4>
                    <ColorSwatch
                      color={themePreview.background || ''}
                      label="Background"
                    />
                    <ColorSwatch
                      color={themePreview.foreground || ''}
                      label="Foreground"
                      size="sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs text-muted-foreground">
                      Card/Surface
                    </h4>
                    <ColorSwatch color={themePreview.card || ''} label="Card" />
                    <ColorSwatch
                      color={themePreview.cardForeground || ''}
                      label="Card Foreground"
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">UI Elements</h3>
                <div className="grid grid-cols-3 gap-3">
                  <ColorSwatch color={themePreview.muted || ''} label="Muted" />
                  <ColorSwatch
                    color={themePreview.border || ''}
                    label="Border"
                  />
                  <ColorSwatch
                    color={themePreview.destructive || ''}
                    label="Destructive"
                  />
                </div>
              </div>

              <div className="pt-3">
                <div
                  className="rounded-md border p-4"
                  style={{ backgroundColor: themePreview.background }}
                >
                  <div
                    className="space-y-3"
                    style={{ color: themePreview.foreground }}
                  >
                    <div style={{ color: themePreview.primary }}>
                      <h3 className="text-lg font-semibold">Theme Preview</h3>
                      <p className="text-sm opacity-80">
                        This is how your theme would look with the selected
                        colors.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div
                        className="px-3 py-1.5 text-sm font-medium rounded-md"
                        style={{
                          backgroundColor: themePreview.primary,
                          color: themePreview.primaryForeground,
                        }}
                      >
                        Primary Button
                      </div>

                      <div
                        className="px-3 py-1.5 text-sm font-medium rounded-md"
                        style={{
                          backgroundColor: themePreview.secondary,
                          color: themePreview.secondaryForeground,
                        }}
                      >
                        Secondary Button
                      </div>

                      <div
                        className="px-3 py-1.5 text-sm font-medium rounded-md"
                        style={{
                          backgroundColor: themePreview.accent,
                          color: themePreview.accentForeground,
                        }}
                      >
                        Accent Button
                      </div>

                      <div
                        className="px-3 py-1.5 text-sm font-medium rounded-md border"
                        style={{
                          borderColor: themePreview.border,
                          color: themePreview.foreground,
                        }}
                      >
                        Outline Button
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-md border"
                      style={{
                        backgroundColor: themePreview.card,
                        color: themePreview.cardForeground,
                        borderColor: themePreview.border,
                      }}
                    >
                      <h4 className="text-sm font-medium">Card Component</h4>
                      <p
                        className="text-xs mt-1"
                        style={{ color: themePreview.mutedForeground }}
                      >
                        Cards will appear with these colors
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={generateRandomPalette}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Random
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={applyTheme}>
                <Paintbrush className="h-4 w-4 mr-2" />
                Apply to Theme
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Apply this palette to the current theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
