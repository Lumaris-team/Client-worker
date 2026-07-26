import { callModel, addMessagePair } from "./core.js";

export async function reasonning(env, model, body = {}) {
	const category = "reasonning";
	const prompt = body?.prompt || (`Perform reasoning task: ${body?.query || body?.text || ""}`);
	
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

