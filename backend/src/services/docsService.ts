export type DocPage = {
  slug: string;
  title: string;
  category: string;
  content: string;
};

const docs: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    category: "Onboarding",
    content: `# Getting Started\n\nMintair Cloud provisions GPU and CPU instances in minutes.\n\n## Quick Start\n\n1. Add an SSH key in **SSH Keys**.\n2. Browse the marketplace and pick a region.\n3. Deploy and wait for provisioning to complete.\n\n\`\`\`bash\nssh ubuntu@your-instance-ip\n\`\`\``
  },
  {
    slug: "deployment-lifecycle",
    title: "Deployment Lifecycle",
    category: "Compute",
    content: `# Deployment Lifecycle\n\nInstances move through states:\n\n- PROVISIONING\n- RUNNING\n- STOPPED\n- RESTARTING\n- TERMINATED\n- FAILED\n\n\`\`\`json\n{ "status": "PROVISIONING", "eta": "2m" }\n\`\`\``
  },
  {
    slug: "billing-and-credits",
    title: "Billing and Credits",
    category: "Billing",
    content: `# Billing and Credits\n\nCharges are deducted hourly based on your selected profile.\n\n- Debits are compute usage and deployment holds.\n- Credits include account top-ups and referral rewards.\n- Invoices aggregate monthly activity.`
  },
  {
    slug: "api-keys",
    title: "API Keys",
    category: "Security",
    content: `# API Keys\n\nGenerate API keys in Settings. You can only view the secret once.\n\n\`\`\`http\nAuthorization: Bearer mk_...\n\`\`\``
  }
];

export function listDocs() {
  return docs.map((doc) => ({ slug: doc.slug, title: doc.title, category: doc.category }));
}

export function getDoc(slug: string) {
  return docs.find((doc) => doc.slug === slug) ?? null;
}

export function searchDocs(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return docs;
  }

  return docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(normalized) ||
      doc.category.toLowerCase().includes(normalized) ||
      doc.content.toLowerCase().includes(normalized)
  );
}
