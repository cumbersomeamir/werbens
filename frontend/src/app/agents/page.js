import { AgentsFlow } from "./components/AgentsFlow";

export const metadata = {
  title: "Agents | Werbens — Human-in-the-Loop Flows",
  description:
    "Create custom agent flows. Describe what you want, AI designs the flow. Human tasks for what the platform can't do.",
  keywords: "agents, flows, human in the loop, content automation",
};

export default function AgentsPage() {
  return <AgentsFlow />;
}
