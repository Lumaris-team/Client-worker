// Using Cloudflare Gateway AI for storage via logs API
// Storage functions removed - now using Gateway AI logs for conversation persistence

// Simple model caller using Cloudflare Workers AI
export async function callModel(env, model, prompt, options = {}, gatewayMetadataFn = null) {
  const message = typeof prompt === "string" ? prompt : JSON.stringify(prompt);
  
  // Convert model name to Cloudflare format if needed
  // If model doesn't start with @cf/, try to convert from display name to ID
  let actualModel = model;
  if (!model.startsWith("@cf/")) {
    // Model name conversion would require metadata - using as-is for now
    actualModel = model;
  }
  
  // Use Cloudflare Workers AI binding
  if (env.AI) {
    try {
      // Get gateway metadata if function is provided
      let gatewayMetadata = null;
      if (gatewayMetadataFn && typeof gatewayMetadataFn === 'function') {
        const conversationId = options?.conversationId || null;
        const conversationName = options?.conversationName || null;
        gatewayMetadata = await gatewayMetadataFn(env, conversationId, conversationName, message);
      }

      // Check if this is an image generation model (text-to-image)
      // Image models require 'prompt' parameter instead of 'messages' format
      const modelId = (actualModel || "").toLowerCase();
      const isImageModel = modelId.includes("stable-diffusion") || 
                          modelId.includes("flux") || 
                          modelId.includes("text-to-image") ||
                          modelId.includes("llava") ||
                          options.isImageModel === true;
      
      let aiModel;
      if (isImageModel) {
        // Image generation format
        aiModel = env.AI.run(actualModel, {
          prompt: message,
        }, gatewayMetadata);
      } else {
        // Text generation format
        aiModel = env.AI.run(actualModel, {
          messages: [{ role: "user", content: message }],
          max_tokens: options.maxTokens || 512,
        }, gatewayMetadata);
      }
      
      const response = await aiModel;
      const content = response?.response || response?.output || response?.image || JSON.stringify(response);
      
      // Build result object
      const result = {
        ok: true,
        model: actualModel,
        response: content,
        raw: response,
      };
      
      // For image models, mark the response as image
      if (isImageModel) {
        result.isImage = true;
      }
      
      
      return result;
    } catch (error) {
      console.error("Cloudflare AI error:", error);
      const errorResult = { ok: false, error: error.message || "Failed to call AI model" };
      return errorResult;
    }
  }

  // Fallback: mocked response
  const fallbackResult = { ok: true, model: actualModel, response: `Mock response for model=${actualModel} prompt=${message}` };
  return fallbackResult;
}
