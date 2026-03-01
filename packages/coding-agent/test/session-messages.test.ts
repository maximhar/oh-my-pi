import { describe, expect, it } from "bun:test";
import type { AgentMessage } from "@oh-my-pi/pi-agent-core";
import type { Message } from "@oh-my-pi/pi-ai";
import { inferCopilotInitiator } from "@oh-my-pi/pi-ai/providers/github-copilot-headers";
import { convertToLlm } from "@oh-my-pi/pi-coding-agent/session/messages";

function expectAttribution(message: Message | undefined, expected: "user" | "agent"): void {
	expect(message).toBeDefined();
	if (!message) return;
	if (message.role === "assistant") {
		throw new Error("Assistant messages do not expose attribution");
	}
	expect(message.attribution).toBe(expected);
}
describe("convertToLlm custom message mapping", () => {
	it("maps async-result custom messages to developer role", () => {
		const messages: AgentMessage[] = [
			{
				role: "custom",
				customType: "async-result",
				content: "Background task completed",
				display: true,
				timestamp: Date.now(),
			},
		];

		const converted = convertToLlm(messages);

		expect(converted).toHaveLength(1);
		expect(converted[0]?.role).toBe("developer");
		expectAttribution(converted[0], "agent");
		expect(inferCopilotInitiator(converted)).toBe("agent");
	});

	it("defaults non-user custom messages to agent attribution", () => {
		const messages: AgentMessage[] = [
			{
				role: "custom",
				customType: "ttsr-injection",
				content: "<system-reminder>Read file</system-reminder>",
				display: false,
				timestamp: Date.now(),
			},
		];

		const converted = convertToLlm(messages);

		expect(converted).toHaveLength(1);
		expect(converted[0]?.role).toBe("user");
		expectAttribution(converted[0], "agent");
		expect(inferCopilotInitiator(converted)).toBe("agent");
	});

	it("allows custom messages to opt into user attribution", () => {
		const messages: AgentMessage[] = [
			{
				role: "custom",
				customType: "skill-prompt",
				content: "Run this skill with my arguments",
				display: true,
				attribution: "user",
				timestamp: Date.now(),
			},
		];

		const converted = convertToLlm(messages);

		expect(converted).toHaveLength(1);
		expect(converted[0]?.role).toBe("user");
		expectAttribution(converted[0], "user");
		expect(inferCopilotInitiator(converted)).toBe("user");
	});
});
