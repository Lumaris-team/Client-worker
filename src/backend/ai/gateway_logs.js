// Functions to fetch and parse Cloudflare Gateway AI logs

// Get list of deleted conversation IDs from KV
export async function getDeletedConversations(env) {
  try {
    const deleted = await env.DELETED_CONVERSATIONS.get("deleted_list");
    return deleted ? JSON.parse(deleted) : [];
  } catch (error) {
    console.error("Failed to get deleted conversations:", error);
    return [];
  }
}

// Add a conversation to the deleted list
export async function addDeletedConversation(env, conversationId) {
  try {
    const deleted = await getDeletedConversations(env);
    if (!deleted.includes(conversationId)) {
      deleted.push(conversationId);
      await env.DELETED_CONVERSATIONS.put("deleted_list", JSON.stringify(deleted));
    }
  } catch (error) {
    console.error("Failed to add deleted conversation:", error);
  }
}

// Mark a specific message as deleted (for error handling)
export async function markMessageAsDeleted(env, conversationId, messageContent, role) {
  try {
    const deletedMessages = await getDeletedMessages(env);
    const messageKey = `${conversationId}:${role}:${messageContent.substring(0, 100)}`;
    
    if (!deletedMessages.includes(messageKey)) {
      deletedMessages.push(messageKey);
      await env.DELETED_MESSAGES.put("deleted_list", JSON.stringify(deletedMessages));
    }
  } catch (error) {
    console.error("Failed to mark message as deleted:", error);
  }
}

// Get list of deleted messages
export async function getDeletedMessages(env) {
  try {
    const deleted = await env.DELETED_MESSAGES.get("deleted_list");
    return deleted ? JSON.parse(deleted) : [];
  } catch (error) {
    return [];
  }
}

// Fetch Gateway AI logs from Cloudflare API
export async function fetchGatewayLogs(env, options = {}) {
  const { limit = 50, page = 1, metadataFilters = [] } = options;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken || !gatewayId) {
    return { logs: [], error: "missing_credentials", hasMore: false };
  }
  
  try {
    const perPage = Math.min(limit, 50);
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    
    // Add metadata filters if provided (according to Cloudflare API docs)
    if (metadataFilters.length > 0) {
      url.searchParams.append('filters', JSON.stringify(metadataFilters));
    }
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { logs: [], error: errorText, hasMore: false };
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result) {
      return { logs: [], error: "Invalid response", hasMore: false };
    }
    
    // Cloudflare API returns logs in reverse chronological order (newest first)
    // Reverse them to get chronological order (oldest first)
    const chronologicalLogs = data.result.reverse();
    
    const hasMore = data.result.length >= perPage;
    
    return { logs: chronologicalLogs, error: null, hasMore };
  } catch (error) {
    return { logs: [], error: error.message, hasMore: false };
  }
}

// Parse Gateway logs to extract conversations
export async function parseConversationsFromLogs(logs, env = null) {
  const conversations = new Map();
  
  // Get list of deleted conversations to filter them out
  const deletedConversationIds = env ? await getDeletedConversations(env) : [];
  
  // Get list of deleted messages to filter them out
  const deletedMessageKeys = env ? await getDeletedMessages(env) : [];
  
  for (const log of logs) {
    try {
      if (!log) {
        continue;
      }
      
      const metadata = log?.gateway?.metadata || log?.metadata || {};
      const conversationId = metadata.conversationId;
      const conversationName = metadata.conversationName;
      // Use metadata timestamp first (when message was sent), then log creation time
      const timestamp = metadata.timestamp || log.timestamp || log.created_at || new Date().toISOString();
      const messageRole = metadata.messageRole;
      const messageContent = metadata.messageContent;
      const previousAssistantResponse = metadata.previousAssistantResponse;
      const previousAssistantTimestamp = metadata.previousAssistantTimestamp;
      
      if (!conversationId) {
        continue;
      }
      
      // Skip deleted conversations
      if (deletedConversationIds.includes(conversationId)) {
        continue;
      }
      
      // Skip deleted messages
      const messageKey = `${conversationId}:${messageRole}:${messageContent?.substring(0, 100) || ''}`;
      if (deletedMessageKeys.includes(messageKey)) {
        continue;
      }
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          name: conversationName || "Untitled Conversation",
          lastPromptDate: timestamp,
          messageCount: 0,
          messages: []
        });
      }
      
      const conversation = conversations.get(conversationId);
      
      conversation.messageCount++;
      
      // Extract message from metadata if available (new format)
      if (messageRole && messageContent) {
        conversation.messages.push({
          role: messageRole,
          content: messageContent,
          timestamp: timestamp
        });
      }
      
      // Extract previous assistant response from metadata if available
      // This is how we save assistant responses without making extra AI calls
      if (previousAssistantResponse && previousAssistantTimestamp) {
        conversation.messages.push({
          role: "assistant",
          content: previousAssistantResponse,
          timestamp: previousAssistantTimestamp
        });
      }
      
    } catch (error) {
      // Skip malformed logs silently
    }
  }
  
  // Convert to array and sort by last prompt date
  const sortedConversations = Array.from(conversations.values()).sort((a, b) => {
    return new Date(b.lastPromptDate) - new Date(a.lastPromptDate);
  });
  
  return sortedConversations;
}

// Get conversations list with pagination
export async function getConversations(env, limit = 100, offset = 0) {
  const page = Math.floor(offset / 50) + 1;
  
  const { logs, error, hasMore } = await fetchGatewayLogs(env, { limit, page });
  
  if (error) {
    return { conversations: [], error, hasMore: false };
  }
  
  const conversations = await parseConversationsFromLogs(logs, env);
  
  return { conversations, error: null, hasMore };
}

// Get specific conversation with messages
export async function getConversationMessages(env, conversationId, limit = 100, offset = 0) {
  if (!conversationId) {
    return { messages: [], error: "invalid_conversation_id", hasMore: false };
  }
  
  // Check if conversation is deleted
  const deletedConversationIds = await getDeletedConversations(env);
  if (deletedConversationIds.includes(conversationId)) {
    return { messages: [], error: "conversation_deleted", hasMore: false };
  }
  
  // Fetch ALL logs with automatic pagination
  // Cloudflare API doesn't support filtering by nested metadata fields, so we fetch all and filter server-side
  const allLogs = [];
  let page = 1;
  const perPage = 50;
  let hasMore = true;
  let emptyPageCount = 0;
  
  while (hasMore) {
    const { logs: pageLogs, hasMore: pageHasMore } = await fetchGatewayLogs(env, { limit: perPage, page });
    
    // Filter logs by conversationId from metadata
    const conversationLogs = pageLogs.filter(log => {
      const metadata = log?.gateway?.metadata || log?.metadata || {};
      return metadata.conversationId === conversationId;
    });
    
    // Add logs to array (they're already in chronological order from fetchGatewayLogs)
    allLogs.push(...conversationLogs);
    
    // Track empty pages to detect when we've reached the end
    if (pageLogs.length === 0) {
      emptyPageCount++;
    } else {
      emptyPageCount = 0;
    }
    
    // Stop if we've had 3 consecutive empty pages (end of logs)
    if (emptyPageCount >= 3) {
      break;
    }
    
    // Continue as long as there are more pages available
    hasMore = pageHasMore;
    
    // Increase safety limit to 100 pages (5000 logs) to ensure we get all messages
    if (page >= 100) {
      break;
    }
    
    page++;
  }
  
  // Sort all logs chronologically to ensure correct order across pages
  // Use metadata.timestamp (when message was sent) for accurate ordering
  allLogs.sort((a, b) => {
    const metadataA = a?.gateway?.metadata || a?.metadata || {};
    const metadataB = b?.gateway?.metadata || b?.metadata || {};
    const timeA = new Date(metadataA.timestamp || a.created_at || a.timestamp).getTime() || 0;
    const timeB = new Date(metadataB.timestamp || b.created_at || b.timestamp).getTime() || 0;
    return timeA - timeB;
  });
  
  const conversations = await parseConversationsFromLogs(allLogs, env);
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return { messages: [], error: "conversation_not_found", hasMore: false };
  }
  
  let messages = conversation.messages || [];
  
  // Simple chronological sort by timestamp only
  messages.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeA - timeB;
  });
  
  const paginatedMessages = messages.slice(offset, offset + limit);
  const hasMoreMessages = messages.length > offset + limit;
  
  return { messages: paginatedMessages, error: null, hasMore: hasMoreMessages };
}
