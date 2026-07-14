import {AgentWorkspace} from "@/components/ai-agents/agent-workspace";export default async function Page({params}:{params:Promise<{id:string}>}){await params;return <AgentWorkspace view="edit"/>}
