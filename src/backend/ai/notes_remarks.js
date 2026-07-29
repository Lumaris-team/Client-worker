import { callModel } from "./core.js";
import { getGatewayMetadata } from "./gateway_metadata.js";

export async function notes_remarks(env, model, body = {}) {
	const category = "notes_remarks";
	const prompt = body?.prompt || (`Notes and remarks task: ${body?.query || body?.text || ""}`);
	
	const result = await callModel(env, model, prompt, body?.options || {}, getGatewayMetadata);
	
	// Return conversation info from gateway metadata
	const gatewayMeta = result?.gatewayMetadata || {};
	const conversationId = gatewayMeta.conversationId || body?.conversationId;
	const conversationName = gatewayMeta.conversationName || body?.conversationName;
	
	return { result, conversationId, conversationName };
}

