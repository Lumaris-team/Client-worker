// Using Cloudflare Gateway AI for storage via logs API
import { markMessageAsDeleted } from "./gateway_logs.js";

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
        const userTimestamp = new Date().toISOString();
        gatewayMetadata = await gatewayMetadataFn(env, conversationId, conversationName, message, "user", titleModel, userTimestamp);
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
      let content;
      if (isImageModel) {
        content = response?.image || response?.data?.[0]?.url || JSON.stringify(response);
      } else {
        // OpenAI-style format (REST API)
        if (response?.choices?.[0]?.message?.content) {
          content = response.choices[0].message.content;
          // If content is empty but reasoning_content exists, use reasoning_content
          if (!content && response.choices[0].message.reasoning_content) {
            content = response.choices[0].message.reasoning_content;
          }
        } else if (response?.choices?.[0]?.message?.reasoning_content) {
          // Fallback to reasoning_content if content is empty
          content = response.choices[0].message.reasoning_content;
        } else if (typeof response === 'string') {
          content = response;
        } else if (response?.response) {
          content = response.response;
        } else if (response?.result) {
          content = response.result;
        } else if (response?.generated_text) {
          content = response.generated_text;
        } else {
          // Last resort: return empty string instead of JSON
          content = "";
        }
      }
      
      // Save assistant response to Gateway logs using a lightweight model call
      // This is necessary because Cloudflare Gateway doesn't have a direct API to create logs
      if (conversationId && gatewayMetadataFn && typeof gatewayMetadataFn === 'function') {
        try {
          // Use the user message's timestamp + 1000ms to ensure assistant response comes after
          const userTimestamp = gatewayMetadata?.gateway?.metadata?.timestamp;
          const assistantTimestamp = userTimestamp ? new Date(new Date(userTimestamp).getTime() + 1000).toISOString() : new Date().toISOString();
          
          // Use the same conversationName from the user message metadata
          const conversationName = gatewayMetadata?.gateway?.metadata?.conversationName || null;
          
          // Save the ACTUAL assistant response content in metadata
          const assistantMetadata = await gatewayMetadataFn(env, conversationId, conversationName, content, "assistant", null, assistantTimestamp);
          
          // Use a lightweight model to create the log entry (content is in metadata)
          await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
            messages: [{ role: "assistant", content: "ACK" }]
          }, assistantMetadata);
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
        gatewayMetadata: gatewayMetadata,
        conversationId: conversationId,
        conversationName: gatewayMetadata?.gateway?.metadata?.conversationName || null,
        // Include assistant response so it can be saved with next user message
        assistantResponse: content
      };
      
      return result;
    } catch (error) {
      console.error("Cloudflare AI error:", error);
      
      // Mark user message as deleted when error occurs
      if (conversationId && gatewayMetadataFn && typeof gatewayMetadataFn === 'function') {
        try {
          await markMessageAsDeleted(env, conversationId, message, "user");
        } catch (markError) {
          console.error("Failed to mark message as deleted:", markError);
        }
      }
      
      const errorResult = { ok: false, error: error.message || "Failed to call AI model" };
      return errorResult;
    }
  }

  // Fallback: mocked response
  const fallbackResult = { ok: true, model: actualModel, response: `Mock response for model=${actualModel} prompt=${message}` };
  return fallbackResult;
}
