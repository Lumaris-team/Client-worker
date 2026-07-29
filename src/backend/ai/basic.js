import { callModel } from "./core.js";
import { getGatewayMetadata } from "./gateway_metadata.js";

export async function basic(env, model, body = {}) {
	const category = "basic";
	const prompt = body?.prompt || (`Basic AI request: ${body?.query || body?.text || ""}`);
	
	const result = await callModel(env, model, prompt, body?.options || {}, getGatewayMetadata);
	
	// Return conversation info from gateway metadata
	const gatewayMeta = result?.gatewayMetadata || {};
	const conversationId = gatewayMeta.conversationId || body?.conversationId;
	const conversationName = gatewayMeta.conversationName || body?.conversationName;
	
	return { result, conversationId, conversationName };
}

