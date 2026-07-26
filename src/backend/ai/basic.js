import { callModel, addMessagePair } from "./core.js";

export async function basic(env, model, body = {}) {
	const category = "basic";
	const prompt = body?.prompt || (`Basic AI request: ${body?.query || body?.text || ""}`);
	
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

