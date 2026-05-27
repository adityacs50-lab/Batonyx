import type { Deal, Transcript } from "./types";

export const sampleDeals: Deal[] = [
  {
    id: "deal-1007",
    name: "Acme Growth - Enterprise Rollout",
    accountName: "Acme Growth",
    stage: "Closed Won",
    closeDate: "2026-05-29",
    owner: "Maya Chen",
    assignedCsm: "Jordan Lee",
    acv: "$84,000",
    contacts: [
      {
        id: "contact-1",
        name: "Priya Nair",
        title: "VP Revenue Operations",
        role: "Economic buyer",
        email: "priya@acmegrowth.example",
      },
      {
        id: "contact-2",
        name: "Luis Ortega",
        title: "Director of Customer Success",
        role: "Primary champion",
        email: "luis@acmegrowth.example",
      },
      {
        id: "contact-3",
        name: "Sam Patel",
        title: "Security Lead",
        role: "Technical evaluator",
        email: "sam@acmegrowth.example",
      },
    ],
    notes:
      "Acme bought to reduce repeated onboarding discovery and preserve sales promises during handoff. Pain points: CSMs lack deal context, implementation calls repeat questions, and RevOps has inconsistent templates. Success metrics include 90% kickoff readiness, handoff generated within 24 hours of closed-won, and fewer escalations about missed commitments. Security review passed with standard DPA. Promise: include HubSpot deal notes and Zoom transcripts in every handoff. Risk: rollout must be ready before their July onboarding wave.",
  },
  {
    id: "deal-1008",
    name: "Northstar Labs - CS Handoff Pilot",
    accountName: "Northstar Labs",
    stage: "Negotiation",
    closeDate: "2026-06-12",
    owner: "Maya Chen",
    assignedCsm: "Nadia Brooks",
    acv: "$42,000",
    contacts: [
      {
        id: "contact-4",
        name: "Elena Morris",
        title: "Founder",
        role: "Executive sponsor",
        email: "elena@northstarlabs.example",
      },
    ],
    notes:
      "Northstar wants a pilot before expanding. Missing clear success metric and CSM owner confirmation. Primary pain is promises made in late-stage sales calls not reaching onboarding.",
  },
];

export const defaultTranscript: Transcript = {
  id: "transcript-501",
  title: "Zoom discovery and close call",
  source: "Zoom",
  uploadedAt: "2026-05-27T10:45:00.000Z",
  content: `00:01 Maya Chen: Priya, can you restate why Acme is buying now?
00:09 Priya Nair: We are entering a July onboarding wave and our CSMs keep asking customers to repeat goals already discussed in sales.
00:25 Luis Ortega: The biggest pain points are scattered notes, unclear owners, and missed promises between AE and CSM.
00:44 Maya Chen: What outcomes should Jordan optimize for in kickoff?
00:50 Priya Nair: We need every closed-won account to have a handoff within 24 hours and at least 90% kickoff readiness.
01:09 Luis Ortega: Stakeholders are Priya as economic buyer, me as champion, and Sam for security questions.
01:28 Sam Patel: Risk is data retention. We need confirmation that transcripts can be deleted after the pilot if requested.
01:45 Maya Chen: We committed to HubSpot deal notes, Zoom transcripts, and a Slack alert to the assigned CSM.
02:02 Luis Ortega: Next steps are procurement by Friday, implementation kickoff next Tuesday, and RevOps validating required fields.`,
};
