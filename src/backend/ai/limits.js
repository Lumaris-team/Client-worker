// Using Cloudflare AI Gateway logs API for token usage analytics

// Fetch AI usage limits from Cloudflare AI Gateway logs API
export async function fetchCloudflareLimits(env) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.GATEWAY_ID;
  
  if (!accountId || !apiToken) {
    console.log("Cloudflare credentials not configured, returning mock data");
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
  
  if (!gatewayId) {
    console.log("Gateway ID not configured, returning mock data");
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
  
  try {
    console.log("Fetching Workers AI usage via GraphQL");
    
    // Calculate time range for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = now.toISOString();
    
    // Use correct GraphQL dataset for Workers AI: aiInferenceAdaptiveGroups
    const query = `{
      viewer {
        accounts(filter: { accountTag: "${accountId}" }) {
          aiInferenceAdaptiveGroups(
            filter: { datetime_geq: "${startOfDay}", datetime_leq: "${endOfDay}" }
            limit: 10000
            orderBy: [datetimeHour_DESC]
          ) {
            count
            sum {
              totalInputTokens
              totalOutputTokens
              totalRequestBytesIn
            }
            dimensions {
              modelId
              datetimeHour
            }
          }
        }
      }
    }`;
    
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GraphQL API error:", response.status, errorText);
      // Fallback to AI Gateway logs
      return await fetchFromGatewayLogs(accountId, apiToken, gatewayId);
    }
    
    const data = await response.json();
    console.log("GraphQL response:", JSON.stringify(data));
    
    let totalTokens = 0;
    let modelUsage = [];
    
    if (data.data && data.data.viewer && data.data.viewer.accounts && data.data.viewer.accounts[0]) {
      const account = data.data.viewer.accounts[0];
      if (account.aiInferenceAdaptiveGroups && Array.isArray(account.aiInferenceAdaptiveGroups)) {
        const modelMap = new Map();
        
        for (const inference of account.aiInferenceAdaptiveGroups) {
          const modelName = inference.dimensions.modelId || "unknown";
          const inputTokens = inference.sum?.totalInputTokens || 0;
          const outputTokens = inference.sum?.totalOutputTokens || 0;
          const totalTokensForModel = inputTokens + outputTokens;
          
          totalTokens += totalTokensForModel;
          
          if (modelMap.has(modelName)) {
            modelMap.set(modelName, modelMap.get(modelName) + totalTokensForModel);
          } else {
            modelMap.set(modelName, totalTokensForModel);
          }
        }
        
        modelUsage = Array.from(modelMap.entries()).map(([name, consumption]) => ({
          id: name,
          name: name,
          brand: extractBrandFromModelId(name),
          consumption: consumption,
          percentage: 0
        }));
      }
    }
    
    // If GraphQL returned no data, fallback to Gateway logs
    if (totalTokens === 0) {
      console.log("GraphQL returned no usage data, falling back to Gateway logs");
      return await fetchFromGatewayLogs(accountId, apiToken, gatewayId);
    }
    
    // Calculate percentages
    if (totalTokens > 0) {
      modelUsage = modelUsage.map(m => ({
        ...m,
        percentage: Math.round((m.consumption / totalTokens) * 100)
      }));
    }
    
    console.log(`Daily usage: ${totalTokens}/10000 neurons`);
    console.log(`Model usage:`, JSON.stringify(modelUsage));
    
    return {
      daily: {
        used: totalTokens,
        limit: 10000,
        percentage: totalTokens > 0 ? Math.round((totalTokens / 10000) * 100) : 0,
        unit: "neurons"
      },
      models: modelUsage
    };
  } catch (error) {
    console.error("Failed to fetch from GraphQL:", error);
    // Fallback to AI Gateway logs
    return await fetchFromGatewayLogs(accountId, apiToken, gatewayId);
  }
}

// Fallback function to fetch from AI Gateway logs
async function fetchFromGatewayLogs(accountId, apiToken, gatewayId) {
  console.log("Fallback: Fetching AI Gateway logs for token usage");
  
  try {
    let allLogs = [];
    let page = 1;
    const perPage = 50;
    
    while (true) {
      console.log(`Fetching page ${page} of AI Gateway logs...`);
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-gateway/gateways/${gatewayId}/logs?page=${page}&per_page=${perPage}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway logs API error:", response.status, errorText);
        break;
      }
      
      const data = await response.json();
      console.log(`Page ${page} response:`, JSON.stringify(data).substring(0, 500));
      
      if (!data.success || !data.result || data.result.length === 0) {
        console.log(`Page ${page}: no more logs or invalid response`);
        break;
      }
      
      allLogs = allLogs.concat(data.result);
      console.log(`Page ${page}: fetched ${data.result.length} logs, total so far: ${allLogs.length}`);
      
      // Check if there are more pages
      if (data.result.length < perPage) {
        break;
      }
      
      page++;
      
      // Safety limit to avoid infinite loops
      if (page > 100) {
        console.log("Reached safety limit of 100 pages");
        break;
      }
    }
    
    console.log(`Fetched ${allLogs.length} log entries total`);
    
    if (allLogs.length === 0) {
      console.log("No logs found, returning zero usage");
      return {
        daily: {
          used: 0,
          limit: 10000,
          percentage: 0,
          unit: "neurons"
        },
        models: []
      };
    }
    
    // Log first log entry structure for debugging
    console.log("First log entry structure:", JSON.stringify(allLogs[0]).substring(0, 500));
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(`Filtering logs from ${startOfDay.toISOString()} to ${now.toISOString()}`);
    
    const modelMap = new Map();
    let totalTokens = 0;
    let filteredCount = 0;
    
    for (const log of allLogs) {
      const logDate = new Date(log.created_at);
      
      if (logDate >= startOfDay) {
        filteredCount++;
        const modelName = log.model || "unknown";
        const tokensIn = log.tokens_in || 0;
        const tokensOut = log.tokens_out || 0;
        const totalTokensForRequest = tokensIn + tokensOut;
        
        console.log(`Log: model=${modelName}, tokens_in=${tokensIn}, tokens_out=${tokensOut}, total=${totalTokensForRequest}`);
        
        totalTokens += totalTokensForRequest;
        
        if (modelMap.has(modelName)) {
          modelMap.set(modelName, modelMap.get(modelName) + totalTokensForRequest);
        } else {
          modelMap.set(modelName, totalTokensForRequest);
        }
      }
    }
    
    console.log(`Filtered ${filteredCount} logs from today out of ${allLogs.length} total`);
    console.log(`Total tokens: ${totalTokens}`);
    
    let modelUsage = Array.from(modelMap.entries()).map(([name, consumption]) => ({
      id: name,
      name: name,
      brand: extractBrandFromModelId(name),
      consumption: consumption,
      percentage: 0
    }));
    
    // Calculate percentages
    if (totalTokens > 0) {
      modelUsage = modelUsage.map(m => ({
        ...m,
        percentage: Math.round((m.consumption / totalTokens) * 100)
      }));
    }
    
    // Default limit (you can adjust this based on your Cloudflare plan)
    const dailyLimit = 10000;
    const percentage = dailyLimit > 0 ? Math.round((totalTokens / dailyLimit) * 100) : 0;
    
    console.log(`Daily token usage: ${totalTokens}/${dailyLimit} tokens (${percentage}%)`);
    console.log(`Model usage:`, JSON.stringify(modelUsage));
    
    return {
      daily: {
        used: totalTokens,
        limit: dailyLimit,
        percentage: percentage,
        unit: "neurons"
      },
      models: modelUsage
    };
  } catch (error) {
    console.error("Failed to fetch AI usage from logs API:", error);
    return {
      daily: {
        used: 0,
        limit: 10000,
        percentage: 0,
        unit: "neurons"
      },
      models: []
    };
  }
}

// Helper function to extract brand from model ID
function extractBrandFromModelId(modelId) {
  if (!modelId) return "Unknown";
  const withoutPrefix = modelId.replace(/^@cf\//, "");
  const parts = withoutPrefix.split("/");
  
  if (parts.length >= 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  
  return "Unknown";
}
