import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/layouts/main-layout';
import { motion } from 'framer-motion';

export default function TypographyDemo() {
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8 space-y-8"
      >
        <div>
          <h1 className="fluid-h1 font-bold">Fluid Typography System</h1>
          <p className="fluid-body text-muted-foreground mt-2">
            Typography that scales smoothly between viewport sizes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="fluid-h3">Heading Elements</CardTitle>
            <CardDescription>
              Heading elements automatically scale based on viewport width
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h1 className="fluid-h1 font-bold">H1: Main Heading (fluid-h1)</h1>
              <h2 className="fluid-h2 font-semibold">H2: Section Heading (fluid-h2)</h2>
              <h3 className="fluid-h3 font-medium">H3: Subsection Heading (fluid-h3)</h3>
              <h4 className="fluid-h4 font-medium">H4: Group Heading (fluid-h4)</h4>
              <h5 className="fluid-h5 font-medium">H5: Minor Heading (fluid-h5)</h5>
              <h6 className="fluid-h6 font-medium">H6: Small Heading (fluid-h6)</h6>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Resize your browser to see how these headings scale smoothly
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="fluid-h3">Body Text</CardTitle>
              <CardDescription>Body text for readability at any screen size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="fluid-body fluid-leading-normal">
                This is standard body text (fluid-body) with normal line height
                (fluid-leading-normal). It scales smoothly between viewport sizes, ensuring optimal
                readability on any device. The line height also scales proportionally for improved
                readability.
              </p>

              <p className="fluid-small fluid-leading-relaxed text-muted-foreground">
                This is smaller text (fluid-small) with a relaxed line height
                (fluid-leading-relaxed). Good for secondary information or notes. It maintains
                readability even at smaller sizes.
              </p>

              <p className="fluid-xs fluid-leading-loose text-muted-foreground">
                This is extra small text (fluid-xs) with loose line height (fluid-leading-loose).
                Useful for captions, footnotes, or legal text where space is at a premium.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="fluid-h3">Line Heights</CardTitle>
              <CardDescription>
                Different line-height options for various content types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2">Tight (1.2)</p>
                <p className="fluid-body fluid-leading-tight bg-muted p-3 rounded-md">
                  This paragraph uses tight line height (fluid-leading-tight). Good for headings and
                  short paragraphs where vertical space needs to be conserved.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Normal (1.5)</p>
                <p className="fluid-body fluid-leading-normal bg-muted p-3 rounded-md">
                  This paragraph uses normal line height (fluid-leading-normal). A good default for
                  most body text. Ensures good readability while maintaining a compact appearance.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Relaxed (1.625)</p>
                <p className="fluid-body fluid-leading-relaxed bg-muted p-3 rounded-md">
                  This paragraph uses relaxed line height (fluid-leading-relaxed). Provides more
                  breathing room between lines for comfortable reading of longer text passages.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="fluid-h3">In Context Example</CardTitle>
            <CardDescription>
              How fluid typography looks in a realistic content layout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <article className="prose dark:prose-invert max-w-none">
              <h1 className="fluid-h2 font-bold not-prose">Building Intelligent AI Agents</h1>
              <p className="fluid-body fluid-leading-relaxed text-muted-foreground not-prose mb-6">
                Published on May 24, 2023 • 5 min read
              </p>

              <h2 className="fluid-h3 font-semibold not-prose">Introduction</h2>
              <p className="fluid-body fluid-leading-relaxed not-prose">
                Intelligent agents are becoming increasingly important in today's technological
                landscape. These autonomous systems can perceive their environment, make decisions,
                and take actions to achieve specific goals. In this article, we'll explore the
                fundamental concepts behind building effective AI agents and how they can be applied
                to solve real-world problems.
              </p>

              <h2 className="fluid-h3 font-semibold not-prose mt-8">Key Components</h2>
              <p className="fluid-body fluid-leading-relaxed not-prose">
                Creating an effective AI agent requires several key components working in harmony:
              </p>

              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li className="fluid-body not-prose">
                  <span className="font-medium">Perception</span>: The ability to gather and
                  interpret data from the environment
                </li>
                <li className="fluid-body not-prose">
                  <span className="font-medium">Reasoning</span>: Processing information to draw
                  conclusions and make decisions
                </li>
                <li className="fluid-body not-prose">
                  <span className="font-medium">Learning</span>: Adapting behavior based on
                  experience and feedback
                </li>
                <li className="fluid-body not-prose">
                  <span className="font-medium">Action</span>: Executing decisions in a way that
                  affects the environment
                </li>
              </ul>

              <blockquote className="fluid-body italic border-l-4 border-primary pl-4 py-2 my-6 not-prose">
                "The ultimate goal of AI agents is not just to mimic human intelligence, but to
                create systems that can learn, adapt, and improve over time in ways that complement
                human capabilities."
              </blockquote>
            </article>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  );
}
