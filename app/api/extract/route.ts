import { NextResponse } from "next/server";
import { generateHandoffFields } from "@/app/extraction";
import type { Deal, Evidence, HandoffField, Transcript } from "@/app/types";

export const runtime = "nodejs";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const fieldLabels: Record<string, string> = {
  account_overview: "Account Overview",
  buying_story: "Buying Story",
  pain_points: "Pain Points",
  goals: "Goals and Success Criteria",
  stakeholders: "Stakeholder Map",
  risks: "Risks and Objections",
  promises: "Promises and Commitments",
  next_steps: "Next Steps",
};

const requiredKeys = Object.keys(fieldLabels);

type AiField = {
  key: string;
  value?: string;
  confidence?: number;
  evidence?: Array<{
    source?: "CRM" | "Transcript";
    excerpt?: string;
  }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing GROQ_API_KEY. Add it locally or in Vercel environment variables.",
      },
      { status: 500 },
    );
  }

  const { deal, transcript } = (await request.json()) as {
    deal?: Deal;
    transcript?: Transcript;
  };

  if (!deal || !transcript) {
    return NextResponse.json({ error: "Deal and transcript are required." }, { status: 400 });
  }

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract B2B SaaS Sales-to-Customer Success handoff context. Optimize for completeness, traceability, and operational usefulness. Do not invent facts. Return only valid JSON.",
          },
          {
            role: "user",
            content: buildPrompt(deal, transcript),
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: `Groq extraction failed: ${message.slice(0, 500)}` },
        { status: response.status },
      );
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;
    const parsed = parseAiJson(content);
    const fields = normalizeAiFields(parsed.fields, deal, transcript);

    return NextResponse.json({ fields, model: GROQ_MODEL });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown extraction error." },
      { status: 500 },
    );
  }
}

function buildPrompt(deal: Deal, transcript: Transcript) {
  return `Extract a structured handoff for Customer Success.

Required field keys:
${requiredKeys.map((key) => `- ${key}: ${fieldLabels[key]}`).join("\n")}

For each field, return:
- key
- value: concise but complete notes for a CSM
- confidence: integer 0-100
- evidence: 1-3 direct snippets from CRM notes or transcript that support the value

Return this exact JSON shape:
{
  "fields": [
    {
      "key": "buying_story",
      "value": "...",
      "confidence": 87,
      "evidence": [
        { "source": "Transcript", "excerpt": "..." }
      ]
    }
  ]
}

CRM deal:
${JSON.stringify(
  {
    name: deal.name,
    accountName: deal.accountName,
    stage: deal.stage,
    closeDate: deal.closeDate,
    owner: deal.owner,
    assignedCsm: deal.assignedCsm,
    acv: deal.acv,
    contacts: deal.contacts,
    notes: deal.notes,
  },
  null,
  2,
)}

Transcript source: ${transcript.source}
Transcript title: ${transcript.title}
Transcript:
${transcript.content}`;
}

function parseAiJson(content: unknown) {
  if (typeof content !== "string") {
    throw new Error("Groq returned an empty extraction.");
  }

  try {
    return JSON.parse(content) as { fields?: AiField[] };
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq returned non-JSON output.");
    }
    return JSON.parse(match[0]) as { fields?: AiField[] };
  }
}

function normalizeAiFields(fields: unknown, deal: Deal, transcript: Transcript): HandoffField[] {
  const fallbackFields = generateHandoffFields(deal, transcript);
  const byKey = new Map<string, AiField>();

  if (Array.isArray(fields)) {
    fields.forEach((field) => {
      if (field && typeof field === "object" && "key" in field) {
        const candidate = field as AiField;
        if (candidate.key && requiredKeys.includes(candidate.key)) {
          byKey.set(candidate.key, candidate);
        }
      }
    });
  }

  return requiredKeys.map((key) => {
    const fallback = fallbackFields.find((field) => field.key === key);
    const aiField = byKey.get(key);
    const aiValue = typeof aiField?.value === "string" ? aiField.value.trim() : "";
    const value = aiValue || fallback?.value || "";
    const evidence = normalizeEvidence(aiField?.evidence, fallback?.evidence ?? [], transcript.title);

    return {
      key,
      label: fieldLabels[key],
      value,
      required: true,
      missing: value.length < 8,
      confidence: aiValue ? clampConfidence(aiField?.confidence) : fallback?.confidence ?? 65,
      evidence,
    };
  });
}

function normalizeEvidence(
  evidence: AiField["evidence"],
  fallback: Evidence[],
  transcriptTitle: string,
) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return fallback;
  }

  return evidence
    .filter((item) => item?.excerpt)
    .slice(0, 3)
    .map<Evidence>((item) => ({
      source: item.source === "CRM" ? "CRM" : "Transcript",
      label: item.source === "CRM" ? "HubSpot deal notes" : transcriptTitle,
      excerpt: String(item.excerpt).trim(),
    }));
}

function clampConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 75;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}
