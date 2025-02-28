import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import StatsCard from '@/components/StatsCard';
import QuickActionCard from '@/components/QuickActionCard';
import AgentCard from '@/components/AgentCard';
import AgentWizard from '@/components/wizard/AgentWizard';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  MessageSquare,
  BarChart3,
  Plus,
  Edit2,
  Terminal,
  HelpCircle,
  Settings,
  Palette,
  FormInput,
  Layout,
  Move,
  GripVertical,
  ScrollText,
  EyeIcon,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/animations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft';
  lastUpdated: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { ref, controls } = useScrollAnimation();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Mock data - would come from API in real implementation
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: () => ({
      activeAgents: 4,
      savedPrompts: 12,
      totalInteractions: 231,
    }),
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: () => [
      {
        id: '1',
        name: 'Customer Support Bot',
        description:
          'Handles customer inquiries automatically with a formal response style.',
        status: 'active',
        lastUpdated: 'Updated 2 days ago',
      },
      {
        id: '2',
        name: 'Product Recommendation',
        description:
          'Suggests products based on customer preferences and past purchases.',
        status: 'active',
        lastUpdated: 'Updated 5 days ago',
      },
      {
        id: '3',
        name: 'Email Assistant',
        description: 'Drafts email responses based on incoming inquiries.',
        status: 'draft',
        lastUpdated: 'Created 1 week ago',
      },
    ],
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="fluid-h2 font-bold mb-2">Dashboard</h1>
          <p className="fluid-body text-muted-foreground mb-6">
            Welcome to the AI Agent Generator. Create, test, and manage your AI
            agents.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="fluid-h4">Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/create-agent">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="fluid-body">Create New Agent</span>
                  </Button>
                </Link>
                <Link href="/agents">
                  <Button className="w-full justify-start" variant="outline">
                    <Bot className="mr-2 h-4 w-4" />
                    <span className="fluid-body">View All Agents</span>
                  </Button>
                </Link>
                <Link href="/prompts">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span className="fluid-body">Manage Prompts</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="fluid-body">Settings</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="fluid-h4">Recent Agents</CardTitle>
                <CardDescription>Your recently created agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="fluid-body text-muted-foreground">
                    You haven't created any agents yet. Get started by creating
                    your first agent.
                  </p>
                  <Link href="/create-agent">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="fluid-h4">UI Demos</CardTitle>
                <CardDescription>Explore UI enhancements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="fluid-body text-muted-foreground">
                  Check out our UI enhancement demos to see the latest
                  improvements.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/form-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <FormInput className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Form Animations</span>
                    </Button>
                  </Link>
                  <Link href="/typography-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Typography System</span>
                    </Button>
                  </Link>
                  <Link href="/palette-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <Palette className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Color Palette</span>
                    </Button>
                  </Link>
                  <Link href="/spacing-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <Layout className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Dynamic Spacing</span>
                    </Button>
                  </Link>
                  <Link href="/drag-drop-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <Move className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Drag & Drop</span>
                    </Button>
                  </Link>
                  <Link href="/infinite-scroll-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <ScrollText className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Infinite Scroll</span>
                    </Button>
                  </Link>
                  <Link href="/contrast-checker-demo">
                    <Button variant="outline" className="w-full justify-start">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Contrast Checker</span>
                    </Button>
                  </Link>
                  <Link href="/performance-dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span className="fluid-body">Performance</span>
                    </Button>
                  </Link>
                  <Link
                    to="/error-handling-demo"
                    className={buttonVariants({
                      variant: 'outline',
                      className: 'justify-start',
                    })}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Error Handling
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
