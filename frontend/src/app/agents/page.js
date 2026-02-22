import { AgentsFlow } from "./components/AgentsFlow";

export const metadata = {
  title: "Agents | Werbens",
  description:
    "Run predefined app agents with fixed backend pipelines and tools.",
  keywords: "agents, fixed pipelines, content automation",
};

export default function AgentsPage() {
  return <AgentsFlow />;
}
