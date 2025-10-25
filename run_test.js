// 这是一个用于本地测试核心逻辑的脚本
// 运行方式: node run_test.js

const { searchGithub } = require('./backend/src/github_search.js');
const { validateAndFilterSources } = require('./backend/src/validator.js');
const { mergeSources } = require('./backend/src/merger.js');

async function main() {
    console.log("--- 开始本地冒烟测试 ---");

    // 从环境变量中获取GitHub Token（如果存在）
    const githubToken = process.env.GH_TOKEN || null;
    if (githubToken) {
        console.log("检测到GH_TOKEN，将使用认证方式请求API。");
    } else {
        console.log("未检测到GH_TOKEN，将以非认证方式请求API（可能会有速率限制）。");
    }

    try {
        // 1. 测试GitHub搜索
        console.log("\n[步骤 1/3] 正在测试GitHub源搜索...");
        let urls = await searchGithub('', githubToken); // 使用默认关键字

        if (urls.length === 0) {
            console.warn("搜索测试失败或未找到任何URL。将注入模拟数据以继续测试后续流程...");
            // 注入一些已知的高质量源URL作为模拟数据
            urls = [
                "https://raw.githubusercontent.com/FongMi/CatVodSpider/main/json/config.json",
                "https://raw.githubusercontent.com/gaotianliuyun/gao/master/js.json",
                "https://raw.githubusercontent.com/youshandefeiyang/IPTV/main/main/IPTV.json",
                "https://raw.githubusercontent.com/bad_url/test/main/non_existent.json" // 一个无效URL用于测试健壮性
            ];
            console.log(`已注入 ${urls.length} 个模拟URL。`);
        } else {
            console.log(`搜索测试成功：找到 ${urls.length} 个URL。`);
            console.log("示例URL:", urls.slice(0, 3));
        }

        // 2. 测试源验证
        console.log("\n[步骤 2/3] 正在测试源验证与筛选...");
        const validSources = await validateAndFilterSources(urls); // 使用全部URL进行测试
        if (validSources.length === 0) {
            console.warn("验证测试警告：在前20个URL中未找到有效的源。这可能是正常的，取决于搜索结果的质量。");
        } else {
            console.log(`验证测试成功：找到 ${validSources.length} 个有效源。`);
        }

        // 3. 测试源合并
        console.log("\n[步骤 3/3] 正在测试源合并...");
        const mergedSource = mergeSources(validSources);
        console.log("合并测试成功。最终聚合结果统计：");
        console.log(`- 站点 (sites): ${mergedSource.sites.length}`);
        console.log(`- 直播 (lives): ${mergedSource.lives.length}`);
        console.log(`- 规则 (rules): ${mergedSource.rules.length}`);

        console.log("\n--- 本地冒烟测试完成 ---");

    } catch (error) {
        console.error("\n测试过程中发生严重错误:", error);
    }
}

main();
