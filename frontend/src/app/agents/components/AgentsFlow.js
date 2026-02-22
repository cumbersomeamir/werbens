"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getAgents,
  deleteAgent,
  runAgent,
} from "@/api/services/agentService.js";

function AgentCard({ agent, onSelect, onDelete }) {
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-elevated border border-werbens-dark-cyan/10 hover:border-werbens-dark-cyan/30 transition-all cursor-pointer"
      onClick={() => onSelect(agent)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-werbens-text">{agent.name || "Untitled"}</h3>
          <p className="text-sm text-werbens-muted mt-1 line-clamp-2">{agent.description || "No description"}</p>
          {agent.flow?.blocks?.length > 0 && (
            <p className="text-xs text-werbens-dark-cyan mt-2">{agent.flow.blocks.length} blocks</p>
          )}
        </div>
        {!agent.isSystemAgent && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent);
            }}
            className="text-werbens-muted hover:text-red-600 p-1"
            aria-label="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/** Topological order - same as backend execution order (sequential) */
function flowOrder(blocks) {
  const idToBlock = new Map(blocks.map((b) => [b.id, b]));
  const visited = new Set();
  const order = [];
  const sorted = [...blocks].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const block = idToBlock.get(id);
    if (block?.inputs?.length) for (const inp of block.inputs) visit(inp);
    order.push(id);
  }
  for (const b of sorted) visit(b.id);
  return order.map((id) => blocks.find((b) => b.id === id)).filter(Boolean);
}

function getInputTypeLabel(block) {
  if (block.type !== "human_task") return null;
  const t = block.config?.inputType || "text";
  const inst = (block.config?.instruction || "").toLowerCase();
  if (t === "url") return "Requires: URL";
  if (t === "image") return "Requires: Image upload";
  if (t === "urls") return "Requires: URLs";
  if (t === "text" || t === "freeform") {
    if (/comment|comma/.test(inst)) return "Requires: Text (comma-separated)";
    return "Requires: Text";
  }
  return `Requires: ${t}`;
}

function FlowBlock({ block, value, onChange, isMissing }) {
  const typeColors = {
    llm: "bg-blue-50 text-blue-800 border-blue-200",
    image_gen: "bg-purple-50 text-purple-800 border-purple-200",
    human_task: "bg-amber-50 text-amber-800 border-amber-200",
    url_fetch: "bg-green-50 text-green-800 border-green-200",
  };
  const color = typeColors[block.type] || "bg-gray-50 text-gray-800 border-gray-200";
  const inputLabel = getInputTypeLabel(block);
  const isHumanTask = block.type === "human_task";

  return (
    <div className={`rounded-xl border ${color} text-sm font-medium min-w-[240px] max-w-[340px] shadow-sm overflow-hidden ${isMissing ? "ring-2 ring-red-400/60" : ""}`}>
      <div className="px-4 py-3 text-center">
        <div>{block.label}</div>
        {isHumanTask && inputLabel ? (
          <span className="block text-xs font-semibold text-amber-700 mt-1">{inputLabel}</span>
        ) : !isHumanTask ? (
          <span className="block text-xs opacity-70 mt-0.5">{block.type.replace("_", " ")}</span>
        ) : null}
      </div>
      {isHumanTask && (
        <div className="px-4 pb-4 pt-0 border-t border-amber-200/50 bg-amber-50/50">
          <HumanTaskInputBlock block={block} value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function HumanTaskInputBlock({ block, value, onChange }) {
  const inputType = block.config?.inputType || "text";
  const instruction = block.config?.instruction || "Provide input";
  const isComments = /comment|comma/i.test(instruction || "");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(block.id, reader.result);
    reader.readAsDataURL(file);
  };

  const isDataUrl = typeof value === "string" && value.startsWith("data:image");
  const placeholder =
    inputType === "url"
      ? "e.g. https://instagram.com/p/..."
      : inputType === "image"
        ? null
        : isComments
          ? "Comment 1, Comment 2, Comment 3..."
          : "Enter your input...";

  return (
    <div className="space-y-2">
      <p className="text-xs text-werbens-text/90 font-medium">{instruction}</p>
      {inputType === "url" && (
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(block.id, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-werbens-dark-cyan/20 text-sm focus:ring-2 focus:ring-werbens-dark-cyan/30"
        />
      )}
      {(inputType === "text" || inputType === "freeform" || inputType === "urls") && (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(block.id, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-werbens-dark-cyan/20 text-sm focus:ring-2 focus:ring-werbens-dark-cyan/30"
        />
      )}
      {inputType === "image" && (
        <label className="flex flex-col items-center justify-center w-full min-h-[90px] border-2 border-dashed border-werbens-dark-cyan/30 rounded-lg cursor-pointer hover:bg-amber-100/50 transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {isDataUrl ? (
            <img src={value} alt="Preview" className="max-h-20 object-contain rounded" />
          ) : (
            <span className="text-xs text-werbens-muted py-2">Click to upload image</span>
          )}
        </label>
      )}
    </div>
  );
}

function FlowChart({ blocks, humanInputs, onHumanInputChange, missingBlockId }) {
  const ordered = flowOrder(blocks);
  if (ordered.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-0 py-4">
      {ordered.map((block, i) => (
        <div key={block.id} className="flex flex-col items-center">
          <FlowBlock
            block={block}
            value={block.type === "human_task" ? humanInputs[block.id] : undefined}
            onChange={block.type === "human_task" ? onHumanInputChange : undefined}
            isMissing={missingBlockId === block.id}
          />
          {i < ordered.length - 1 && (
            <div className="flex flex-col items-center py-2">
              <div className="w-0.5 h-3 bg-werbens-dark-cyan/40" />
              <svg className="w-5 h-5 text-werbens-dark-cyan/60 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AgentDetail({ agent, onBack }) {
  const { userId } = useCurrentUser();
  const [localAgent, setLocalAgent] = useState(agent);
  const [running, setRunning] = useState(false);
  const [humanInputs, setHumanInputs] = useState({});
  const [missingBlockId, setMissingBlockId] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLocalAgent(agent);
    setHumanInputs({});
  }, [agent]);

  const handleRun = async () => {
    if (!userId) return;
    const inputsForApi = {};
    for (const [k, v] of Object.entries(humanInputs)) {
      inputsForApi[k] = typeof v === "string" && v.startsWith("data:image") ? v.split(",")[1] : v;
    }
    setRunning(true);
    setMissingBlockId(null);
    setResult(null);
    try {
      const res = await runAgent(userId, agent._id, {
        initialContext: {},
        humanInputs: inputsForApi,
      });
      if (res.status === "human_required") {
        setMissingBlockId(res.humanTask.blockId);
      } else {
        setResult(res);
      }
    } catch (err) {
      alert(err.message || "Failed to run");
    } finally {
      setRunning(false);
    }
  };

  const handleHumanInputChange = (blockId, value) => {
    setHumanInputs((prev) => ({ ...prev, [blockId]: value }));
    setMissingBlockId(null);
  };

  const blocks = localAgent?.flow?.blocks || [];

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-werbens-dark-cyan hover:underline mb-4"
      >
        ← Back to agents
      </button>
      <h1 className="text-2xl font-bold text-werbens-text mb-2">{localAgent.name}</h1>
      <p className="text-werbens-muted mb-6">{localAgent.description}</p>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-werbens-dark-cyan mb-3">Flow</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-werbens-muted mb-3">This agent has no configured flow.</p>
        ) : (
          <div className="rounded-xl border border-werbens-dark-cyan/10 bg-white/50 p-6 mb-3">
            <p className="text-sm text-werbens-muted mb-4">Fill all inputs below, then run.</p>
            <FlowChart
              blocks={blocks}
              humanInputs={humanInputs}
              onHumanInputChange={handleHumanInputChange}
              missingBlockId={missingBlockId}
            />
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                className="px-5 py-2.5 bg-werbens-dark-cyan text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {running ? "Running…" : "Run agent"}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-werbens-dark-cyan/20 p-4 bg-werbens-mist/20">
          <h3 className="text-sm font-semibold text-werbens-dark-cyan mb-3">Output</h3>
          {result.status === "completed" ? (
            (() => {
              const img = result.context?.image || result.context?.imageBase64;
              const fetched = result.context?.fetched_image;
              const src = (raw) =>
                typeof raw === "string" && raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
              if (img) {
                return <img src={src(img)} alt="Generated" className="rounded-xl max-w-full border" />;
              }
              if (fetched) {
                return (
                  <div>
                    <p className="text-xs text-werbens-muted mb-2">Fetched image (no image_gen in flow yet)</p>
                    <img src={src(fetched)} alt="Fetched" className="rounded-xl max-w-full border" />
                  </div>
                );
              }
              return (
                <p className="text-sm text-werbens-muted">
                  Flow completed. No image output—ensure the flow includes an image_gen (Nano Banana Pro) block.
                </p>
              );
            })()
          ) : (
            <p className="text-sm text-werbens-muted">{result.status || "Done"}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentsFlow() {
  const { userId } = useCurrentUser();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!userId) {
      setAgents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getAgents(userId)
      .then((list) => setAgents(Array.isArray(list) ? list : []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDelete = async (agent) => {
    if (!userId || !confirm("Delete this agent?")) return;
    try {
      await deleteAgent(userId, agent._id);
      setAgents((a) => a.filter((x) => x._id !== agent._id));
      if (selected?._id === agent._id) setSelected(null);
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  if (selected) {
    return <AgentDetail agent={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <section className="px-4 sm:px-6 pb-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-werbens-dark-cyan">Agents</h1>
            <p className="text-werbens-muted mt-1">
              Fixed app agents with predefined backend steps.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-werbens-muted">Loading…</p>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-werbens-dark-cyan/20 p-12 text-center">
            <p className="text-werbens-muted mb-4">No agents available.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a) => (
              <AgentCard key={a._id} agent={a} onSelect={setSelected} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
