import { callModel } from "./core.js";
import { getGatewayMetadata } from "./gateway_metadata.js";

export async function pictures(env, model, body = {}) {
	const category = "pictures";
	const prompt = body?.prompt || (`Generate or describe an image for: ${body?.query || body?.text || ""}`);
	
	const callOptions = { ...body?.options, isImageModel: true };
	
	const result = await callModel(env, model, prompt, callOptions, getGatewayMetadata);
	
	// Return conversation info from gateway metadata
	const gatewayMeta = result?.gatewayMetadata || {};
	const conversationId = gatewayMeta.conversationId || body?.conversationId;
	const conversationName = gatewayMeta.conversationName || body?.conversationName;
	
	return { result, conversationId, conversationName };
}

