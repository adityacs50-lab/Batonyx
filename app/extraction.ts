import type { Deal, Evidence, HandoffField, Transcript } from "./types";

type FieldDefinition = {
  key: string;
  label: string;
  required: boolean;
  hints: string[];
  fallback?: (deal: Deal) => string;
};

const fieldDefinitions: FieldDefinition[] = [
  {
    key: "account_overview",
    label: "Account Overview",
    required: true,
    hints: ["bought", "buying", "account", "stage", "acv"],
    fallback: (deal) =>
      `${deal.accountName} is a ${deal.stage.toLowerCase()} opportunity owned by ${deal.owner} with ${deal.acv} ACV. Assigned CSM: ${deal.assignedCsm}.`,
  },
  {
    key: "buying_story",
    label: "Buying Story",
    required: true,
    hints: ["why", "bought", "buying now", "customer bought"],
  },
  {
    key: "pain_points",
    label: "Pain Points",
    required: true,
    hints: ["pain", "problem", "scattered", "repeat", "missed", "friction"],
  },
  {
    key: "goals",
    label: "Goals and Success Criteria",
    required: true,
    hints: ["outcome", "success", "metric", "readiness", "within", "hours"],
  },
  {
    key: "stakeholders",
    label: "Stakeholder Map",
    required: true,
    hints: ["stakeholder", "buyer", "champion", "security", "sponsor"],
    fallback: (deal) =>
      deal.contacts
        .map((contact) => `${contact.name}, ${contact.title} - ${contact.role}`)
        .join("\n"),
  },
  {
    key: "risks",
    label: "Risks and Objections",
    required: true,
    hints: ["risk", "blocker", "objection", "security", "retention", "missing"],
  },
  {
    key: "promises",
    label: "Promises and Commitments",
    required: true,
    hints: ["promise", "committed", "commitment", "include", "alert"],
  },
  {
    key: "next_steps",
    label: "Next Steps",
    required: true,
    hints: ["next step", "owner", "procurement", "kickoff", "validating"],
  },
];

export function generateHandoffFields(deal: Deal, transcript: Transcript): HandoffField[] {
  const sources = [
    { kind: "CRM" as const, label: "HubSpot deal notes", text: deal.notes },
    { kind: "Transcript" as const, label: transcript.title, text: transcript.content },
  ];

  return fieldDefinitions.map((definition) => {
    const evidence = sources.flatMap((source) =>
      extractEvidence(source.text, definition.hints).slice(0, 2).map<Evidence>((excerpt) => ({
        source: source.kind,
        label: source.label,
        excerpt,
      })),
    );

    const evidenceText = evidence.map((item) => cleanExcerpt(item.excerpt)).filter(Boolean);
    const fallback = definition.fallback?.(deal);
    const value = summarizeField(definition.key, evidenceText, fallback);
    const missing = !value || value.length < 20;

    return {
      key: definition.key,
      label: definition.label,
      value: missing ? "" : value,
      required: definition.required,
      missing,
      confidence: missing ? 0 : Math.min(96, 68 + evidence.length * 9),
      evidence,
    };
  });
}

export function calculateCompletion(fields: HandoffField[]) {
  const required = fields.filter((field) => field.required);
  const complete = required.filter((field) => !field.missing);
  return Math.round((complete.length / required.length) * 100);
}

function extractEvidence(text: string, hints: string[]) {
  const sentences = text
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+|(?=\d{2}:\d{2}\s)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.filter((sentence) =>
    hints.some((hint) => sentence.toLowerCase().includes(hint.toLowerCase())),
  );
}

function summarizeField(key: string, evidenceText: string[], fallback?: string) {
  const snippets = Array.from(new Set(evidenceText)).slice(0, 3);

  if (fallback && (key === "account_overview" || snippets.length === 0)) {
    return fallback;
  }

  if (snippets.length === 0) {
    return fallback ?? "";
  }

  if (key === "stakeholders") {
    return snippets.join("\n");
  }

  return snippets
    .map((snippet) => snippet.replace(/^\d{2}:\d{2}\s+[A-Za-z ]+:\s*/, ""))
    .join(" ");
}

function cleanExcerpt(excerpt: string) {
  return excerpt.replace(/\s+/g, " ").trim();
}
