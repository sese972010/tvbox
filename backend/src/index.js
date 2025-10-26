// --- FINAL Production-Ready Script ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Use a global tasks object. For production, a more persistent store is recommended.
const tasks = {};

// Helper for creating consistent JSON responses.
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders },
  });
}

// The core aggregation logic.
async function runAggregation(taskId, env) {
  const log = (message) => {
    if (tasks[taskId]) tasks[taskId].logs += `[${new Date().toLocaleTimeString()}] ${message}\n`;
  };

  try {
    tasks[taskId].status = 'running';
    log('任务开始: 聚合TVBox源');

    // Step 1: Search for source files on GitHub
    log('步骤 1/5: 正在从 GitHub 搜索源文件...');
    const ghToken = env.GH_TOKEN;
    if (!ghToken) throw new Error("关键配置错误: 未找到 GH_TOKEN。");

    const query = 'q=sites+spider+extension:json+tvbox';
    const searchUrl = `https://api.github.com/search/code?${query}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${ghToken}`,
        'User-Agent': 'TVBox-Aggregator-Worker'
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`GitHub API 搜索失败: ${searchResponse.status} ${errorText}`);
    }

    const searchResult = await searchResponse.json();
    const sourceUrls = searchResult.items.map(item => item.html_url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'));

    if (sourceUrls.length === 0) {
      log("警告: 未找到任何源文件。");
      tasks[taskId].status = 'completed';
      tasks[taskId].result = { "message": "未找到任何源文件。" };
      return;
    }
    log(`搜索完成，发现 ${sourceUrls.length} 个潜在源。`);

    // Step 2: Download all source files
    log(`步骤 2/5: 正在下载 ${sourceUrls.length} 个文件...`);
    const downloadPromises = sourceUrls.map(url => fetch(url).then(res => res.json()).catch(err => ({ error: err.message, url })));
    const downloadResults = await Promise.allSettled(downloadPromises);

    // Step 3: Merge and deduplicate content
    log('步骤 3/5: 正在合并内容...');
    const aggregatedJson = { "sites": [], "lives": [], "rules": [], "ads": [], "spider": null };
    const siteKeys = new Set();
    const liveNames = new Set();
    const ruleNames = new Set();

    for (const result of downloadResults) {
      if (result.status === 'fulfilled' && !result.value.error) {
        const sourceJson = result.value;
        if (Array.isArray(sourceJson.sites)) {
          sourceJson.sites.forEach(site => {
            if (site.key && !siteKeys.has(site.key)) {
              aggregatedJson.sites.push(site);
              siteKeys.add(site.key);
            }
          });
        }
        if (Array.isArray(sourceJson.lives)) {
          sourceJson.lives.forEach(live => {
            if (live.name && !liveNames.has(live.name)) {
              aggregatedJson.lives.push(live);
              liveNames.add(live.name);
            }
          });
        }
        if (Array.isArray(sourceJson.rules)) {
            sourceJson.rules.forEach(rule => {
                if (rule.name && !ruleNames.has(rule.name)) {
                    aggregatedJson.rules.push(rule);
                    ruleNames.add(rule.name);
                }
            });
        }
        if (Array.isArray(sourceJson.ads)) {
            aggregatedJson.ads.push(...sourceJson.ads);
        }
        if (sourceJson.spider && !aggregatedJson.spider) {
          aggregatedJson.spider = sourceJson.spider;
        }
      }
    }
    log(`合并完成。聚合结果: ${aggregatedJson.sites.length} 站点, ${aggregatedJson.lives.length} 直播源, ${aggregatedJson.rules.length} 规则。`);

    // Step 4: Write result to KV store
    log('步骤 4/5: 正在将结果写入永久存储...');
    if (!env.TVBOX_KV) throw new Error("关键配置错误: 未绑定KV存储 'TVBOX_KV'。");
    await env.TVBOX_KV.put('latest_result', JSON.stringify(aggregatedJson, null, 2));
    log('写入成功！');

    // Step 5: Finalize task
    log('步骤 5/5: 任务成功完成！');
    tasks[taskId].status = 'completed';
    tasks[taskId].result = aggregatedJson;

  } catch (error) {
    log(`任务失败: ${error.message}`);
    tasks[taskId].status = 'failed';
    tasks[taskId].error = error.message;
  }
}

export default {
  async fetch(request, env, ctx) {
    // --- Robust Router ---
    const url = new URL(request.url);
    // Normalize pathname: remove trailing slashes if they exist
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // --- API Endpoints ---
    if (pathname === '/start-task') {
      const taskId = `task-${Date.now()}`;
      tasks[taskId] = { id: taskId, status: 'pending', logs: '', result: null, error: null };
      ctx.waitUntil(runAggregation(taskId, env));
      return jsonResponse({ message: '任务已启动', taskId: taskId });

    } else if (pathname === '/task-status') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
      return jsonResponse(tasks[taskId]);

    } else if (pathname === '/get-result') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId || !tasks[taskId]) return jsonResponse({ error: '任务不存在或已过期' }, 404);
      if (tasks[taskId].status !== 'completed') return jsonResponse({ error: '任务尚未完成' }, 400);
      return jsonResponse({ result: tasks[taskId].result });

    } else if (pathname === '/subscribe') {
      if (!env.TVBOX_KV) return jsonResponse({ error: "后端配置错误: 未绑定KV存储。" }, 500);
      const latestResult = await env.TVBOX_KV.get('latest_result');
      if (latestResult === null) return jsonResponse({ message: "订阅源尚未生成，请先运行一次聚合任务。" }, 404);

      return new Response(latestResult, {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders },
      });

    } else {
      return jsonResponse({ error: `路径 '${pathname}' 未找到` }, 404);
    }
  },
};
