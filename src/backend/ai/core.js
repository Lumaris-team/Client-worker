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
      // Get gateway metadata for user message
      let gatewayMetadata = null;
      let conversationId = options?.conversationId || null;
      if (gatewayMetadataFn && typeof gatewayMetadataFn === 'function') {
        const conversationName = options?.conversationName || null;
        const titleModel = options?.titleGenerationModel || null;
        gatewayMetadata = await gatewayMetadataFn(env, conversationId, conversationName, message, "user", titleModel);
        // Don't overwrite conversationId - trust what was passed in
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
      
      // Extract content from response
      let content = response?.response || response?.output || response?.image || JSON.stringify(response);
      
      // If content is a JSON string, try to parse it and extract the actual message content
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          // Handle OpenAI-compatible format with choices array
          if (parsed.choices && parsed.choices.length > 0 && parsed.choices[0].message) {
            content = parsed.choices[0].message.content;
          }
          // Handle direct content field
          else if (parsed.content) {
            content = parsed.content;
          }
        } catch (e) {
          // Not JSON, use as-is
        }
      }
      
      // Save assistant response to Gateway logs with metadata using a lightweight model call
      // Make this synchronous with a short timeout to ensure it completes before response
      if (conversationId && gatewayMetadataFn && typeof gatewayMetadataFn === 'function') {
        try {
          // Use the user message's timestamp + 100ms to ensure assistant response comes after
          const userTimestamp = gatewayMetadata?.gateway?.metadata?.timestamp;
          const assistantTimestamp = userTimestamp ? new Date(new Date(userTimestamp).getTime() + 100).toISOString() : new Date().toISOString();
          
          // Use the same conversationName from the user message metadata
          const conversationName = gatewayMetadata?.gateway?.metadata?.conversationName || null;
          
          const assistantMetadata = await gatewayMetadataFn(env, conversationId, conversationName, content, "assistant", null, assistantTimestamp);
          
          // Use Promise.race to add timeout but still try to complete synchronously
          const savePromise = env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
            messages: [{ role: "assistant", content: "ACK" }]
          }, assistantMetadata);
          
          // Wait for save with a 15 second timeout (increased to ensure completion)
          await Promise.race([
            savePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
          ]).catch(err => {
            if (err.message === "Timeout") {
              // Continue in background if timeout
              savePromise.catch(bgErr => {
                // Silent background error
              });
            }
          });
        } catch (error) {
          // Don't fail the main request if this fails
        }
      }
      
      // Build result object
      const result = {
        ok: true,
        model: actualModel,
        response: content,
        raw: response,
        gatewayMetadata: gatewayMetadata?.gateway?.metadata || null,
      };
      
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
