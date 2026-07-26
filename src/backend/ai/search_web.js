import { callModel, addMessagePair } from "./core.js";

export async function search_web(env, model, body = {}) {
	const category = "search_web";
	const prompt = body?.prompt || (`Search web and summarize for: ${body?.query || body?.text || ""}`);
	
	const result = await callModel(env, model, prompt, body?.options || {});
	
	const conversationId = body?.conversationId;
	const conversationName = body?.conversationName;
	const assistantContent = result?.response ?? String(result);
	const discussion = await addMessagePair(env, category, {
		discussionId: conversationId,
		userContent: prompt,
		assistantContent,
		metadata: { model }
	});
	
	return { result, discussion, conversationId, conversationName };
}

