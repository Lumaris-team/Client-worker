// Using Cloudflare AI Gateway GraphQL API for usage analytics

// Fetch AI usage limits from Cloudflare AI Gateway GraphQL API
export async function fetchCloudflareLimits(env) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  
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
  
  try {
    // Calculate time range for today (use wider range to catch all data)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = now.toISOString();
    
    // GraphQL query to fetch AI Gateway usage - use higher limit and no time filter to get all data
    const query = `{
      viewer {
        accounts(filter: { accountTag: "${accountId}" }) {
          requests: aiGatewayRequestsAdaptiveGroups(
            limit: 10000
            filter: { datetimeHour_geq: "${startOfDay}", datetimeHour_leq: "${endOfDay}" }
          ) {
            count
            dimensions {
              model
              provider
              gateway
            }
          }
        }
      }
    }`;
    
    console.log("Fetching AI Gateway analytics via GraphQL");
    
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
    
    const data = await response.json();
    console.log("GraphQL response:", JSON.stringify(data));
    
    let dailyUsed = 0;
    let modelUsage = [];
    
    // Parse GraphQL response
    if (data.data && data.data.viewer && data.data.viewer.accounts && data.data.viewer.accounts[0]) {
      const account = data.data.viewer.accounts[0];
      if (account.requests && Array.isArray(account.requests)) {
        // Group by model
        const modelMap = new Map();
        
        for (const request of account.requests) {
          const modelName = request.dimensions.model || "unknown";
          const count = request.count || 0;
          
          dailyUsed += count;
          
          if (modelMap.has(modelName)) {
            modelMap.set(modelName, modelMap.get(modelName) + count);
          } else {
            modelMap.set(modelName, count);
          }
        }
        
        // Convert to array
        modelUsage = Array.from(modelMap.entries()).map(([name, consumption]) => ({
          id: name,
          name: name,
          brand: extractBrandFromModelId(name),
          consumption: consumption,
          percentage: 0
        }));
      }
    }
    
    // Calculate percentages
    if (dailyUsed > 0) {
      modelUsage = modelUsage.map(m => ({
        ...m,
        percentage: Math.round((m.consumption / dailyUsed) * 100)
      }));
    }
    
    // Default limit (you can adjust this based on your Cloudflare plan)
    const dailyLimit = 10000;
    const percentage = dailyLimit > 0 ? Math.round((dailyUsed / dailyLimit) * 100) : 0;
    
    console.log(`Daily usage: ${dailyUsed}/${dailyLimit} requests`);
    console.log(`Model usage:`, JSON.stringify(modelUsage));
    
    return {
      daily: {
        used: dailyUsed,
        limit: dailyLimit,
        percentage: percentage,
        unit: "neurons"
      },
      models: modelUsage
    };
  } catch (error) {
    console.error("Failed to fetch AI usage from GraphQL:", error);
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
