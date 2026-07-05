import { callDeepSeek } from "./client";
import type { TokenUsage } from "@salesagent/shared-types";

// ── Types ──────────────────────────────────────────────────────────

export interface Tool {
  name: string;
  description: string;
  execute: (input: string) => Promise<string>;
}

export interface AgentStep {
  thought: string;
  tool: string;
  toolInput: string;
  observation: string;
}

export interface AgentRunResult {
  result: string;
  steps: AgentStep[];
  success: boolean;
  usage?: TokenUsage;
}

// ── System prompt template ─────────────────────────────────────────

const REACT_SYSTEM = `你是一个销售助手 Agent，负责执行销售跟进任务。

可用工具：
{{TOOLS}}

严格按以下格式输出，每次只选一个行动：

思考：[分析当前情况和下一步]
行动：[工具名称]
行动输入：[传给工具的内容]

任务完成时输出：
思考：[总结]
最终答案：[结果说明]`;

/**
 * ReAct (Reasoning + Acting) agent loop.
 *
 * Runs up to `maxSteps` iterations of:
 *   Thought → Action → Action Input → Observation → repeat
 *
 * Uses DeepSeek via callDeepSeek() — compatible with existing AICallMetric
 * logging when wired from the worker caller.
 */
export async function runReActAgent(
  task: string,
  tools: Tool[],
  maxSteps = 6,
): Promise<AgentRunResult> {
  const steps: AgentStep[] = [];
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  const toolDescriptions = tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  const system = REACT_SYSTEM.replace("{{TOOLS}}", toolDescriptions);

  let scratchpad = "";

  for (let i = 0; i < maxSteps; i++) {
    const response = await callDeepSeek(
      `任务：${task}\n\n执行记录：\n${scratchpad || "（刚开始）"}`,
      system,
      { temperature: 0, timeoutMs: 30_000 },
    );

    const output = response.content;

    // Check for completion signal
    const finalMatch = output.match(/最终答案[：:]([\s\S]+)/);
    if (finalMatch) {
      return {
        result: finalMatch[1].trim(),
        steps,
        success: true,
        usage: response.usage,
      };
    }

    // Parse ReAct format
    const thoughtMatch = output.match(/思考[：:]([\s\S]+?)(?=行动[：:]|\n*$)/);
    const actionMatch = output.match(/行动[：:](.+)/);
    const inputMatch = output.match(/行动输入[：:](.+)/);

    if (!actionMatch || !inputMatch) {
      // Format error — add the raw output as a thought and break
      steps.push({
        thought: thoughtMatch?.[1]?.trim() ?? output.slice(0, 200),
        tool: "_parse_error",
        toolInput: "",
        observation: `Agent 输出格式错误，已终止。原始响应: ${output.slice(0, 300)}`,
      });
      break;
    }

    const thought = thoughtMatch?.[1]?.trim() ?? "";
    const toolName = actionMatch[1].trim();
    const toolInput = inputMatch[1].trim();
    const tool = toolMap.get(toolName);

    let observation: string;
    if (tool) {
      try {
        observation = await tool.execute(toolInput);
      } catch (e) {
        observation = `工具执行失败: ${e instanceof Error ? e.message : "未知错误"}`;
      }
    } else {
      observation = `工具 "${toolName}" 不存在，可用工具: ${tools.map((t) => t.name).join(", ")}`;
    }

    const step: AgentStep = { thought, tool: toolName, toolInput, observation };
    steps.push(step);

    scratchpad += `\n思考：${thought}\n行动：${toolName}\n行动输入：${toolInput}\n观察：${observation}\n`;
  }

  return {
    result: "已达到最大步骤限制，任务未完成。",
    steps,
    success: false,
  };
}
