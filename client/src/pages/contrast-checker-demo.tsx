import { MainLayout } from "@/components/layouts/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  checkContrast,
  getContrastLevel,
  getRecommendedTextColor,
  suggestBetterContrast,
} from "@/lib/color-contrast";
import { hexToRgb, rgbToHex } from "@/lib/color-utils";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

const ContrastCheckerDemo: React.FC = () => {
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#FFFFFF");
  const [sampleText, setSampleText] = useState("Sample Text");
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState("normal");
  const [contrastResult, setContrastResult] = useState<{
    ratio: number;
    aa: boolean;
    aaLarge: boolean;
    aaa: boolean;
    aaaLarge: boolean;
  } | null>(null);
  const [suggestedColor, setSuggestedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const [copied, setCopied] = useState(false);

  // Calculate contrast when colors change
  useEffect(() => {
    try {
      const result = checkContrast(foreground, background);
      setContrastResult(result);

      // Only suggest a new color if contrast is insufficient
      if (!result.aa) {
        const suggested = suggestBetterContrast(foreground, background);
        setSuggestedColor(suggested);
      } else {
        setSuggestedColor(null);
      }
    } catch (error) {
      console.error("Error calculating contrast:", error); // eslint-disable-line no-console
      setContrastResult(null);
    }
  }, [foreground, background]);

  // Handle color input changes
  const handleForegroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForeground(e.target.value);
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackground(e.target.value);
  };

  // Copy suggested color to clipboard
  const copySuggestedColor = () => {
    if (suggestedColor) {
      navigator.clipboard.writeText(suggestedColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Apply suggested color
  const applySuggestedColor = () => {
    if (suggestedColor) {
      setForeground(suggestedColor);
    }
  };

  // Swap foreground and background colors
  const swapColors = () => {
    const temp = foreground;
    setForeground(background);
    setBackground(temp);
  };

  // Get recommended text color based on background
  const getAutoTextColor = () => {
    const recommended = getRecommendedTextColor(background);
    setForeground(recommended);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Color Contrast Checker</h1>
          <p className="text-muted-foreground mb-6">
            Ensure your color combinations meet WCAG accessibility guidelines
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Color Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Colors</CardTitle>
                <CardDescription>
                  Select foreground and background colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="foreground">Foreground (Text) Color</Label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: foreground }}
                    />
                    <Input
                      id="foreground"
                      type="text"
                      value={foreground}
                      onChange={handleForegroundChange}
                    />
                    <Input
                      type="color"
                      value={foreground}
                      onChange={handleForegroundChange}
                      className="w-12 p-1 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Background Color</Label>
                  <div className="flex gap-2">
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: background }}
                    />
                    <Input
                      id="background"
                      type="text"
                      value={background}
                      onChange={handleBackgroundChange}
                    />
                    <Input
                      type="color"
                      value={background}
                      onChange={handleBackgroundChange}
                      className="w-12 p-1 h-10"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    onClick={swapColors}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Swap Colors
                  </Button>

                  <Button
                    variant="outline"
                    onClick={getAutoTextColor}
                    className="w-full"
                  >
                    Auto Text Color
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how your colors look together
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="ui">UI Elements</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div
                      className="p-8 rounded-md transition-colors"
                      style={{
                        backgroundColor: background,
                        color: foreground,
                      }}
                    >
                      <div className="space-y-4">
                        <div>
                          <p
                            style={{
                              fontSize: `${fontSize}px`,
                              fontWeight,
                            }}
                          >
                            {sampleText}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                            Large Bold Text (24px)
                          </p>
                          <p style={{ fontSize: "18px" }}>
                            Regular paragraph text (18px) that might appear in
                            your application. This demonstrates how body copy
                            would look with your selected colors.
                          </p>
                          <p style={{ fontSize: "14px" }}>
                            Small text (14px) like captions or footnotes that
                            still needs to be readable.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sampleText">Sample Text</Label>
                        <Input
                          id="sampleText"
                          value={sampleText}
                          onChange={(e) => setSampleText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fontSize">
                          Font Size: {fontSize}px
                        </Label>
                        <Slider
                          id="fontSize"
                          min={12}
                          max={36}
                          step={1}
                          value={[fontSize]}
                          onValueChange={(value) => setFontSize(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fontWeight">Font Weight</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              fontWeight === "normal" ? "default" : "outline"
                            }
                            onClick={() => setFontWeight("normal")}
                            className="flex-1"
                          >
                            Normal
                          </Button>
                          <Button
                            variant={
                              fontWeight === "bold" ? "default" : "outline"
                            }
                            onClick={() => setFontWeight("bold")}
                            className="flex-1"
                          >
                            Bold
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ui" className="space-y-4">
                    <div
                      className="p-8 rounded-md transition-colors"
                      style={{
                        backgroundColor: background,
                        color: foreground,
                      }}
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div
                            className="p-3 rounded-md border"
                            style={{
                              borderColor: foreground,
                              backgroundColor: "transparent",
                            }}
                          >
                            Input field
                          </div>

                          <div
                            className="p-3 rounded-md flex items-center justify-center"
                            style={{
                              backgroundColor: foreground,
                              color: background,
                            }}
                          >
                            Button
                          </div>

                          <div
                            className="p-3 rounded-md border"
                            style={{
                              borderColor: foreground,
                              backgroundColor: "transparent",
                            }}
                          >
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-sm mr-2 border"
                                style={{ borderColor: foreground }}
                              />
                              <span>Checkbox</span>
                            </div>
                          </div>

                          <div
                            className="p-3 rounded-md"
                            style={{
                              backgroundColor: `${foreground}33`,
                              color: foreground,
                            }}
                          >
                            Alert / Notice
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Contrast Results</CardTitle>
                <CardDescription>
                  WCAG accessibility guidelines for color contrast
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contrastResult && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted p-4 rounded-md text-center">
                        <div className="text-3xl font-bold mb-1">
                          {contrastResult.ratio.toFixed(2)}:1
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Contrast Ratio
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-md text-center">
                        <div className="text-3xl font-bold mb-1">
                          {contrastResult.aa ? (
                            <span className="text-green-500">Pass</span>
                          ) : (
                            <span className="text-red-500">Fail</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          WCAG AA (4.5:1)
                        </div>
                      </div>

                      <div className="bg-muted p-4 rounded-md text-center">
                        <div className="text-3xl font-bold mb-1">
                          {contrastResult.aaa ? (
                            <span className="text-green-500">Pass</span>
                          ) : (
                            <span className="text-red-500">Fail</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          WCAG AAA (7:1)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Normal Text</h3>
                        <div className="flex items-center">
                          <div
                            className={`p-1 rounded-full mr-2 ${contrastResult.aa ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            {contrastResult.aa ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <span>
                            WCAG AA: {contrastResult.aa ? "Pass" : "Fail"}{" "}
                            (4.5:1 required)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`p-1 rounded-full mr-2 ${contrastResult.aaa ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            {contrastResult.aaa ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <span>
                            WCAG AAA: {contrastResult.aaa ? "Pass" : "Fail"}{" "}
                            (7:1 required)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                          Large Text (18pt+ or 14pt+ bold)
                        </h3>
                        <div className="flex items-center">
                          <div
                            className={`p-1 rounded-full mr-2 ${contrastResult.aaLarge ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            {contrastResult.aaLarge ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <span>
                            WCAG AA: {contrastResult.aaLarge ? "Pass" : "Fail"}{" "}
                            (3:1 required)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`p-1 rounded-full mr-2 ${contrastResult.aaaLarge ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            {contrastResult.aaaLarge ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <span>
                            WCAG AAA:{" "}
                            {contrastResult.aaaLarge ? "Pass" : "Fail"} (4.5:1
                            required)
                          </span>
                        </div>
                      </div>
                    </div>

                    {suggestedColor && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Contrast could be improved</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                          <div>
                            Try using{" "}
                            <span className="font-mono">{suggestedColor}</span>{" "}
                            instead for better contrast.
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copySuggestedColor}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {copied ? "Copied!" : "Copy"}
                            </Button>
                            <Button size="sm" onClick={applySuggestedColor}>
                              Apply Suggested Color
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ContrastCheckerDemo;
