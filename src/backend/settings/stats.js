import { fetchCloudflareLimits } from "../ai/limits.js";
import { getStorageStats } from "../database/storage_stats.js";

export async function StatsFunction(env) {
  try {
    // Fetch AI usage limits
    const aiStats = await fetchCloudflareLimits(env);
    
    // Fetch storage statistics
    const storageStats = await getStorageStats(env);
    
    return {
      ai: aiStats,
      storage: storageStats
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      ai: {
        daily: {
          used: 0,
          limit: 10000,
          percentage: 0,
          unit: "neurons"
        },
        models: []
      },
      storage: {
        totalBytes: 0,
        capacityGB: 20,
        items: [
          { key: "files/", label: "lumaris/files/", bytes: 0 },
          { key: "study-notes/", label: "lumaris/study-notes/", bytes: 0 },
        ]
      }
    };
  }
}
