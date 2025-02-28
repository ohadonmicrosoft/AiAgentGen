import { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import AgentWizard from '@/components/wizard/AgentWizard';

export default function CreateAgent() {
  return (
    <MainLayout title="Create Agent">
      <div className="py-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create a New AI Agent</h1>

        <div className="p-6 bg-card rounded-lg shadow-sm">
          <AgentWizard />
        </div>
      </div>
    </MainLayout>
  );
}
