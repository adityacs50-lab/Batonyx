"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Cloud,
  FileText,
  Flag,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UserRoundCheck,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { calculateCompletion, generateHandoffFields } from "./extraction";
import { defaultTranscript, sampleDeals } from "./sample-data";
import type { Deal, Handoff, HandoffField, Review, Transcript } from "./types";

const requiredKeys = ["buying_story", "pain_points", "goals", "stakeholders", "risks", "promises", "next_steps"];
const storageKey = "batonyx-mvp-state-v1";

export default function Home() {
  const [selectedDealId, setSelectedDealId] = useState(sampleDeals[0].id);
  const [transcript, setTranscript] = useState<Transcript>(defaultTranscript);
  const [isExtracting, setIsExtracting] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [inlineComment, setInlineComment] = useState("Confirm data-retention language before kickoff.");
  const [aiFields, setAiFields] = useState<HandoffField[] | null>(null);
  const [extractionError, setExtractionError] = useState("");
  const [review, setReview] = useState<Review>({
    reviewed: false,
    rating: 0,
    comment: "",
    flags: [],
  });

  const selectedDeal = sampleDeals.find((deal) => deal.id === selectedDealId) ?? sampleDeals[0];
  const fallbackFields = useMemo(() => generateHandoffFields(selectedDeal, transcript), [selectedDeal, transcript]);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const sourceFields = aiFields ?? fallbackFields;
  const fields = sourceFields.map((field) => ({
    ...field,
    value: editedFields[field.key] ?? field.value,
    missing: !(editedFields[field.key] ?? field.value).trim(),
  }));
  const completion = calculateCompletion(fields);
  const missingRequired = fields.filter((field) => field.required && field.missing);
  const handoff: Handoff = {
    id: "handoff-9001",
    status: isExtracting ? "extracting" : review.reviewed ? "reviewed" : missingRequired.length > 0 ? "missing_fields" : "ready",
    completion,
    updatedAt: new Date().toISOString(),
    fields,
    review,
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        selectedDealId?: string;
        transcript?: Transcript;
        editedFields?: Record<string, string>;
        aiFields?: HandoffField[] | null;
        review?: Review;
        notificationSent?: boolean;
        inlineComment?: string;
      };

      if (parsed.selectedDealId) setSelectedDealId(parsed.selectedDealId);
      if (parsed.transcript) setTranscript(parsed.transcript);
      if (parsed.editedFields) setEditedFields(parsed.editedFields);
      if (parsed.aiFields) setAiFields(parsed.aiFields);
      if (parsed.review) setReview(parsed.review);
      if (typeof parsed.notificationSent === "boolean") setNotificationSent(parsed.notificationSent);
      if (parsed.inlineComment) setInlineComment(parsed.inlineComment);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        selectedDealId,
        transcript,
        editedFields,
        aiFields,
        review,
        notificationSent,
        inlineComment,
      }),
    );
  }, [selectedDealId, transcript, editedFields, aiFields, review, notificationSent, inlineComment]);

  function handleDealChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedDealId(event.target.value);
    setNotificationSent(false);
    setReview({ reviewed: false, rating: 0, comment: "", flags: [] });
    setEditedFields({});
    setAiFields(null);
    setExtractionError("");
  }

  function handleTranscriptText(value: string) {
    setTranscript((current) => ({
      ...current,
      source: "Manual Upload",
      title: "Manual transcript",
      uploadedAt: new Date().toISOString(),
      content: value,
    }));
    setNotificationSent(false);
    setAiFields(null);
    setExtractionError("");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setTranscript({
      id: `transcript-${Date.now()}`,
      title: file.name,
      source: "Manual Upload",
      uploadedAt: new Date().toISOString(),
      content,
    });
    setNotificationSent(false);
    setAiFields(null);
    setExtractionError("");
  }

  async function runExtraction() {
    setIsExtracting(true);
    setNotificationSent(false);
    setExtractionError("");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal: selectedDeal, transcript }),
      });
      const payload = (await response.json()) as { fields?: HandoffField[]; error?: string };

      if (!response.ok || !payload.fields) {
        throw new Error(payload.error ?? "Extraction failed.");
      }

      setAiFields(payload.fields);
      setEditedFields({});
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  }

  function toggleFlag(flag: string) {
    setReview((current) => ({
      ...current,
      flags: current.flags.includes(flag)
        ? current.flags.filter((item) => item !== flag)
        : [...current.flags, flag],
    }));
  }

  function markReviewed() {
    setReview((current) => ({
      ...current,
      reviewed: true,
      rating: current.rating || 4,
    }));
  }

  return (
    <main className="app-shell">
      <aside className="workspace-rail" aria-label="Workspace navigation">
        <div className="brand-mark">B</div>
        <button className="rail-button active" title="Handoff document">
          <FileText size={20} />
        </button>
        <button className="rail-button" title="Reviews">
          <ClipboardCheck size={20} />
        </button>
        <button className="rail-button" title="Notifications">
          <Bell size={20} />
        </button>
        <button className="rail-button" title="Security">
          <ShieldCheck size={20} />
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sales-to-CS handoff</p>
            <h1>{selectedDeal.accountName}</h1>
          </div>
          <div className="topbar-actions">
            <label className="select-control">
              <span>Deal</span>
              <select value={selectedDealId} onChange={handleDealChange}>
                {sampleDeals.map((deal) => (
                  <option value={deal.id} key={deal.id}>
                    {deal.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
            <button className="primary-action" onClick={runExtraction} disabled={isExtracting}>
              {isExtracting ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}
              {isExtracting ? "Extracting" : "Generate handoff"}
            </button>
          </div>
        </header>

        <div className="status-strip">
          <Metric label="Completion" value={`${handoff.completion}%`} tone={completion === 100 ? "good" : "warn"} />
          <Metric label="Missing fields" value={String(missingRequired.length)} tone={missingRequired.length ? "warn" : "good"} />
          <Metric label="Assigned CSM" value={selectedDeal.assignedCsm} />
          <Metric label="Close date" value={formatDate(selectedDeal.closeDate)} />
          <Metric label="Review" value={review.reviewed ? "Reviewed" : "Pending"} tone={review.reviewed ? "good" : "neutral"} />
        </div>

        <div className="main-grid">
          <article className="handoff-document">
            <div className="doc-header">
              <div>
                <p className="eyebrow">Customer context page</p>
                <h2>{selectedDeal.name}</h2>
              </div>
              <StatusBadge status={handoff.status} />
            </div>

            {extractionError && (
              <div className="error-banner">
                <AlertTriangle size={18} />
                <span>{extractionError}</span>
              </div>
            )}

            {aiFields && (
              <div className="success-banner">
                <Sparkles size={18} />
                <span>AI extraction complete. This handoff is saved in this browser.</span>
              </div>
            )}

            <section className="account-summary">
              <div>
                <span>Account</span>
                <strong>{selectedDeal.accountName}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>{selectedDeal.owner}</strong>
              </div>
              <div>
                <span>ACV</span>
                <strong>{selectedDeal.acv}</strong>
              </div>
              <div>
                <span>Stage</span>
                <strong>{selectedDeal.stage}</strong>
              </div>
            </section>

            <div className="doc-sections">
              {fields.map((field) => (
                <HandoffSection
                  field={field}
                  key={field.key}
                  value={editedFields[field.key] ?? field.value}
                  onChange={(value) => setEditedFields((current) => ({ ...current, [field.key]: value }))}
                  comment={field.key === "risks" ? inlineComment : ""}
                  onCommentChange={field.key === "risks" ? setInlineComment : undefined}
                />
              ))}
            </div>
          </article>

          <aside className="side-panel">
            <section className="panel-section">
              <div className="section-title">
                <Cloud size={18} />
                <h3>HubSpot sync</h3>
              </div>
              <p className="muted">One CRM connector for MVP. Deal context, contacts, ACV, owner, stage, and notes are imported into the handoff.</p>
              <div className="integration-row">
                <span>Connected</span>
                <strong>batonyx-demo.hubspot.com</strong>
              </div>
              <button className="secondary-action" onClick={runExtraction} disabled={isExtracting}>
                <RefreshCw size={17} />
                Sync deal context
              </button>
            </section>

            <section className="panel-section">
              <div className="section-title">
                <Upload size={18} />
                <h3>Transcript source</h3>
              </div>
              <div className="source-pill">
                <CircleDot size={14} />
                {transcript.source}: {transcript.title}
              </div>
              <label className="upload-box">
                <Upload size={18} />
                Upload .txt transcript
                <input type="file" accept=".txt,.md,.vtt" onChange={handleFileUpload} />
              </label>
              <textarea
                className="transcript-input"
                value={transcript.content}
                onChange={(event) => handleTranscriptText(event.target.value)}
                aria-label="Transcript text"
              />
            </section>

            <section className="panel-section">
              <div className="section-title">
                <Bell size={18} />
                <h3>Notify CSM</h3>
              </div>
              <p className="muted">
                Sends a ready-for-review alert to {selectedDeal.assignedCsm} and flags RevOps if required context is missing.
              </p>
              <button
                className="primary-action full"
                onClick={() => setNotificationSent(true)}
                disabled={isExtracting}
              >
                {notificationSent ? <CheckCircle2 size={18} /> : <Send size={18} />}
                {notificationSent ? "Notification sent" : "Send handoff alert"}
              </button>
            </section>

            <ReviewPanel review={review} setReview={setReview} onFlag={toggleFlag} onReviewed={markReviewed} />
          </aside>
        </div>
      </section>
    </main>
  );
}

function HandoffSection({
  field,
  value,
  onChange,
  comment,
  onCommentChange,
}: {
  field: HandoffField;
  value: string;
  onChange: (value: string) => void;
  comment?: string;
  onCommentChange?: (value: string) => void;
}) {
  return (
    <section className={`handoff-section ${field.missing ? "missing" : ""}`}>
      <div className="section-heading">
        <div>
          <h3>{field.label}</h3>
          <span>{field.missing ? "Needs AE input" : `${field.confidence}% extraction confidence`}</span>
        </div>
        {field.missing ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}
      </div>
      <textarea
        className="field-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Add ${field.label.toLowerCase()} before sending to CS`}
      />
      {field.evidence.length > 0 && (
        <div className="evidence-list">
          {field.evidence.slice(0, 2).map((item, index) => (
            <div className="evidence-item" key={`${field.key}-${index}`}>
              <span>{item.source}</span>
              <p>{item.excerpt}</p>
            </div>
          ))}
        </div>
      )}
      {onCommentChange && (
        <label className="comment-box">
          <span>
            <MessageSquareText size={15} />
            Inline CSM comment
          </span>
          <input value={comment} onChange={(event) => onCommentChange(event.target.value)} />
        </label>
      )}
    </section>
  );
}

function ReviewPanel({
  review,
  setReview,
  onFlag,
  onReviewed,
}: {
  review: Review;
  setReview: (review: Review | ((current: Review) => Review)) => void;
  onFlag: (flag: string) => void;
  onReviewed: () => void;
}) {
  return (
    <section className="panel-section">
      <div className="section-title">
        <UserRoundCheck size={18} />
        <h3>CSM review</h3>
      </div>
      <div className="rating-row" aria-label="Handoff quality rating">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            className={review.rating >= rating ? "star active" : "star"}
            key={rating}
            onClick={() => setReview((current) => ({ ...current, rating }))}
            title={`${rating} star rating`}
          >
            <Star size={18} />
          </button>
        ))}
      </div>
      <div className="flag-grid">
        {["Missing goals", "Wrong stakeholder", "Unclear promise", "Risk needs owner"].map((flag) => (
          <button
            className={review.flags.includes(flag) ? "flag active" : "flag"}
            key={flag}
            onClick={() => onFlag(flag)}
          >
            <Flag size={14} />
            {flag}
          </button>
        ))}
      </div>
      <textarea
        className="review-note"
        value={review.comment}
        onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))}
        placeholder="Leave handoff feedback for AE or RevOps"
      />
      <button className="secondary-action full" onClick={onReviewed}>
        <ClipboardCheck size={17} />
        Mark reviewed
      </button>
    </section>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "neutral" }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: Handoff["status"] }) {
  const labels: Record<Handoff["status"], string> = {
    draft: "Draft",
    extracting: "Extracting",
    ready: "Ready",
    reviewed: "Reviewed",
    missing_fields: "Needs context",
  };

  return <span className={`status-badge ${status}`}>{labels[status]}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
