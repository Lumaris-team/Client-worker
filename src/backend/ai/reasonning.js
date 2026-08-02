import { callModel } from "./core.js";
import { getGatewayMetadata } from "./gateway_metadata.js";

export async function reasonning(env, model, body = {}) {
	const category = "reasonning";
	const prompt = body?.prompt || (`Perform reasoning task: ${body?.query || body?.text || ""}`);
	
	// Merge conversation options with existing options
	const options = {
		...body?.options,
		conversationId: body?.conversationId || null,
		conversationName: body?.conversationName || null,
		titleGenerationModel: body?.titleGenerationModel || null
	};
	
	const result = await callModel(env, model, prompt, options, getGatewayMetadata);
	
	// Return conversation info from gateway metadata
	const gatewayMeta = result?.gatewayMetadata || {};
	const finalConversationId = gatewayMeta?.gateway?.metadata?.conversationId || result?.conversationId || options.conversationId;
	const finalConversationName = gatewayMeta?.gateway?.metadata?.conversationName || result?.conversationName || options.conversationName;
	
	// Include conversation metadata directly in the result object for frontend
	result.conversationId = finalConversationId;
	result.conversationName = finalConversationName;
	
	return result;
}

