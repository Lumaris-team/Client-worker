import { callModel } from "./core.js";
import { getGatewayMetadata } from "./gateway_metadata.js";

export async function reasonning(env, model, body = {}) {
	const category = "reasonning";
	const prompt = body?.prompt || (`Perform reasoning task: ${body?.query || body?.text || ""}`);
	
	const result = await callModel(env, model, prompt, body?.options || {}, getGatewayMetadata);
	
	// Return conversation info from gateway metadata
	const gatewayMeta = result?.gatewayMetadata || {};
	const conversationId = gatewayMeta.conversationId || body?.conversationId;
	const conversationName = gatewayMeta.conversationName || body?.conversationName;
	
	return { result, conversationId, conversationName };
}

