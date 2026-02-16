"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  generateFlow,
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
      </div>
    </div>
  );
}

function CreateAgentModal({ onClose, onCreated }) {
  const { userId } = useCurrentUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const agent = await createAgent(userId, { name, description, context });
      onCreated(agent);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-werbens-dark-cyan mb-4">Create new agent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-werbens-text mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Comments to Image"
              className="w-full px-4 py-2 rounded-xl border border-werbens-dark-cyan/20 focus:ring-2 focus:ring-werbens-dark-cyan/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-werbens-text mb-1">Type / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Takes Instagram URL + comments, creates styled image"
              className="w-full px-4 py-2 rounded-xl border border-werbens-dark-cyan/20 focus:ring-2 focus:ring-werbens-dark-cyan/30"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-werbens-text mb-1">Context (optional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Additional context, style preferences..."
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-werbens-dark-cyan/20 focus:ring-2 focus:ring-werbens-dark-cyan/30"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-werbens-muted hover:text-werbens-text">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-werbens-dark-cyan text-white rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FlowBlock({ block }) {
  const typeColors = {
    llm: "bg-blue-50 text-blue-800",
    image_gen: "bg-purple-50 text-purple-800",
    human_task: "bg-amber-50 text-amber-800",
    url_fetch: "bg-green-50 text-green-800",
  };
  const color = typeColors[block.type] || "bg-gray-50 text-gray-800";
  return (
    <div className={`rounded-xl px-4 py-2 ${color} text-sm font-medium`}>
      {block.label} <span className="opacity-70">({block.type})</span>
    </div>
  );
}

function AgentDetail({ agent, onBack, onUpdated }) {
  const { userId } = useCurrentUser();
  const [localAgent, setLocalAgent] = useState(agent);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [humanTask, setHumanTask] = useState(null);
  const [humanInputs, setHumanInputs] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => setLocalAgent(agent), [agent]);

  const handleGenerateFlow = async () => {
    if (!userId) return;
    setGenerating(true);
    try {
      const { blocks } = await generateFlow(userId, agent._id);
      setLocalAgent((a) => ({ ...a, flow: { blocks } }));
      onUpdated?.();
    } catch (err) {
      alert(err.message || "Failed to generate flow");
    } finally {
      setGenerating(false);
    }
  };

  const handleRun = async (extraHumanInputs = {}) => {
    if (!userId) return;
    setRunning(true);
    setHumanTask(null);
    setResult(null);
    try {
      const res = await runAgent(userId, agent._id, {
        initialContext: {},
        humanInputs: { ...humanInputs, ...extraHumanInputs },
      });
      if (res.status === "human_required") {
        setHumanTask(res.humanTask);
        setHumanInputs((prev) => ({ ...prev, [res.humanTask.blockId]: null }));
      } else {
        setResult(res);
      }
    } catch (err) {
      alert(err.message || "Failed to run");
    } finally {
      setRunning(false);
    }
  };

  const handleHumanSubmit = (blockId, value) => {
    const next = { ...humanInputs, [blockId]: value };
    setHumanInputs(next);
    setHumanTask(null);
    setRunning(true);
    runAgent(userId, agent._id, { initialContext: {}, humanInputs: next })
      .then((res) => {
        if (res.status === "human_required") {
          setHumanTask(res.humanTask);
        } else {
          setResult(res);
        }
      })
      .catch((err) => alert(err.message || "Failed to run"))
      .finally(() => setRunning(false));
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
          <p className="text-sm text-werbens-muted mb-3">No flow yet. Generate one from your description.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {blocks.map((b) => (
              <FlowBlock key={b.id} block={b} />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerateFlow}
          disabled={generating}
          className="px-4 py-2 bg-werbens-dark-cyan text-white rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "Generating…" : blocks.length ? "Regenerate flow" : "Generate flow"}
        </button>
      </div>

      {blocks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-werbens-dark-cyan mb-3">Run</h2>
          {humanTask ? (
            <div className="rounded-xl border border-werbens-dark-cyan/20 p-4 bg-werbens-mist/30">
              <p className="text-sm font-medium text-werbens-text mb-2">{humanTask.instruction}</p>
              {humanTask.inputType === "url" ? (
                <input
                  type="url"
                  placeholder="Paste URL..."
                  className="w-full px-4 py-2 rounded-lg border mb-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleHumanSubmit(humanTask.blockId, e.target.value);
                  }}
                  id="human-url"
                />
              ) : (
                <textarea
                  placeholder="Paste or type..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border mb-2"
                  id="human-text"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(humanTask.inputType === "url" ? "human-url" : "human-text");
                  handleHumanSubmit(humanTask.blockId, el?.value || "");
                }}
                className="px-4 py-2 bg-werbens-dark-cyan text-white rounded-lg text-sm"
              >
                Submit & continue
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleRun()}
              disabled={running}
              className="px-4 py-2 bg-werbens-dark-cyan text-white rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Running…" : "Run agent"}
            </button>
          )}
        </div>
      )}

      {result?.context && (() => {
        const img = result.context.image || result.context.imageBase64;
        if (!img) return null;
        const src = typeof img === "string" && img.startsWith("data:") ? img : `data:image/png;base64,${img}`;
        return (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-werbens-dark-cyan mb-2">Output</h3>
            <img src={src} alt="Generated" className="rounded-xl max-w-full border" />
          </div>
        );
      })()}
    </div>
  );
}

export function AgentsFlow() {
  const { userId } = useCurrentUser();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
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
    return (
      <AgentDetail
        agent={selected}
        onBack={() => setSelected(null)}
        onUpdated={() => {
          const updated = agents.find((a) => a._id === selected._id);
          if (updated) setSelected(updated);
        }}
      />
    );
  }

  return (
    <section className="px-4 sm:px-6 pb-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-werbens-dark-cyan">Agents</h1>
            <p className="text-werbens-muted mt-1">
              Create custom flows. Describe what you want, AI designs the flow. Human tasks for what we can&apos;t do.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-werbens-dark-cyan text-white rounded-xl font-medium hover:opacity-90"
          >
            Create new agent
          </button>
        </div>

        {loading ? (
          <p className="text-werbens-muted">Loading…</p>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-werbens-dark-cyan/20 p-12 text-center">
            <p className="text-werbens-muted mb-4">No agents yet.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-werbens-dark-cyan font-medium hover:underline"
            >
              Create your first agent
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a) => (
              <AgentCard key={a._id} agent={a} onSelect={setSelected} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={(agent) => {
            setAgents((prev) => [agent, ...prev]);
            setSelected(agent);
            setShowCreate(false);
          }}
        />
      )}
    </section>
  );
}
