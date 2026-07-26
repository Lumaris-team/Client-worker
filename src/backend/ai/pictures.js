import { callModel, addMessagePair } from "./core.js";

export async function pictures(env, model, body = {}) {
	const category = "pictures";
	const prompt = body?.prompt || (`Generate or describe an image for: ${body?.query || body?.text || ""}`);
	
	const callOptions = { ...body?.options, isImageModel: true };
	
	const result = await callModel(env, model, prompt, callOptions);
	
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

