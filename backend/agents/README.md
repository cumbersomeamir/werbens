# Agents — Human-in-the-Loop Flows

A modular system for creating custom agent flows. The AI determines what tasks are needed; the platform executes what it can; humans complete the rest.

---

## Perspective

**Problem:** Building custom integrations for every use case (Instagram scrape, comment extraction, etc.) is brittle and doesn't scale.

**Approach:** Human-in-the-loop. Whatever the system can't do, the human does. Example: user pastes the Instagram URL and top comments; the platform downloads the image, structures the data, and generates the styled output via Nano Banana.

**Flow:** User describes the app/service → AI generates a flowchart of blocks → Blocks chain platform services (LLM, image gen, URL fetch) and human tasks → Execution runs until a human task → User provides input → Execution continues.

---

## Structure

```
agents/
├── README.md                 # This file
├── index.js                  # Module exports, route handlers
├── constants/
│   └── blockTypes.js         # BLOCK_TYPES, HUMAN_TASK_INPUT_TYPES, PLATFORM_SERVICES
├── schema/
│   └── flowSchema.js         # JSDoc types for flow/block structure
├── blocks/
│   ├── registry.js           # Maps block type → executor function
│   ├── llmBlock.js           # runCommonChat — text generation, structuring
│   ├── imageGenBlock.js      # runCommonImage — Nano Banana Pro
│   ├── humanTaskBlock.js     # Pauses flow, returns human input request
│   └── urlFetchBlock.js      # Fetch URL (e.g. download image)
├── prompts/
│   └── flowGeneratorPrompt.js # System + user prompt for AI flow generation
├── services/
│   ├── agentService.js       # CRUD, generateFlow, runAgent
│   └── flowGeneratorService.js # Calls LLM to produce blocks from description
├── orchestrator/
│   └── flowOrchestrator.js   # Topological sort, executes blocks, handles human pause
├── models/
│   └── agentModel.js        # Agent document schema
└── routes/
    └── agents.js            # API handlers
```

---

## Block Types

| Type | Purpose | Executor |
|------|---------|----------|
| `llm` | Text generation, filtering, structuring | `runCommonChat` |
| `image_gen` | Image generation (Nano Banana Pro) | `runCommonImage` |
| `url_fetch` | Download content from URL | `fetch` |
| `human_task` | User provides input | Returns `__humanTask` marker, pauses flow |
| `post` | Social posting | Placeholder (not implemented) |

---

## Human Tasks

When a block is `human_task`, the orchestrator does not execute it. It returns:

```json
{
  "status": "human_required",
  "humanTask": {
    "blockId": "block_1",
    "inputType": "url",
    "instruction": "Paste the Instagram post URL",
    "outputKey": "url"
  }
}
```

The client shows an input form. On submit, the client calls `/run` again with `humanInputs: { block_1: "https://..." }`. The flow resumes with that value in context.

**Input types:** `text`, `url`, `image`, `urls`, `freeform`

---

## Flow Execution

1. **Topological sort** — Blocks ordered by `inputs` (dependencies).
2. **Context** — Each block receives `context` (outputs from previous blocks).
3. **Templates** — Blocks use `{{key}}` in prompts to inject context values.
4. **Human pause** — If a block returns `__humanTask`, orchestrator stops and returns.
5. **Resume** — Client passes `humanInputs`; orchestrator re-runs from start with those values filled in.

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/agents` | Create agent |
| GET | `/api/agents` | List agents |
| GET | `/api/agents/:id` | Get agent |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |
| POST | `/api/agents/:id/generate-flow` | AI generates flow from description |
| POST | `/api/agents/:id/run` | Execute flow (`initialContext`, `humanInputs`) |
| GET | `/api/agents/constants` | Block types, human input types |

---

## Adding a New Block Type

1. Add type to `constants/blockTypes.js`.
2. Create `blocks/<type>Block.js` with `execute<Type>Block(block, context, options)`.
3. Register in `blocks/registry.js`.
4. Update `prompts/flowGeneratorPrompt.js` so the AI can emit the new type.

---

## Example: Comments to Image

**User creates agent:** Name "Comments to Image", description "Takes Instagram URL + comments, creates styled image with top comments overlaid."

**AI generates flow:**
1. `human_task` (url) — "Paste Instagram post URL"
2. `human_task` (text) — "Paste top comments (one per line)"
3. `url_fetch` — Download image from URL
4. `llm` — Filter/format comments for display
5. `image_gen` — Create image with reference + comments, style from user context

**Execution:** User provides URL and comments → platform fetches image, structures text, generates final image.
