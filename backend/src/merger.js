/**
 * 合并多个TVBox源对象，并进行去重处理。
 * @param {Array<{url: string, content: object}>} validSources - 一个包含有效源URL及其JSON内容的数组。
 * @returns {object} - 返回一个合并和去重后的TVBox源JSON对象。
 */
function mergeSources(validSources) {
    console.log(`开始合并 ${validSources.length} 个有效的源...`);

    const mergedSource = {
        "sites": [],
        "lives": [],
        "rules": []
        // 可以根据需要添加其他顶级键，如 "spider"
    };

    // 用于记录已添加的key或name，以实现去重
    const siteKeys = new Set();
    const liveNames = new Set();

    validSources.forEach(sourceObj => {
        const sourceContent = sourceObj.content;

        // 合并站点 (sites)
        if (Array.isArray(sourceContent.sites)) {
            sourceContent.sites.forEach(site => {
                // 使用 "key" 作为唯一标识符进行去重
                if (site && site.key && !siteKeys.has(site.key)) {
                    mergedSource.sites.push(site);
                    siteKeys.add(site.key);
                }
            });
        }

        // 合并直播源 (lives)
        if (Array.isArray(sourceContent.lives)) {
            sourceContent.lives.forEach(live => {
                // 使用 "name" 作为唯一标识符进行去重
                if (live && live.name && !liveNames.has(live.name)) {
                    mergedSource.lives.push(live);
                    liveNames.add(live.name);
                }
            });
        }

        // 合并解析规则 (rules) - 通常解析规则比较通用，可以选择性合并或覆盖
        if (Array.isArray(sourceContent.rules)) {
            // 简单地将所有规则附加进来，也可以实现更复杂的去重逻辑
            mergedSource.rules.push(...sourceContent.rules);
        }
    });

    console.log(`合并完成。`);
    console.log(`- 聚合站点数量: ${mergedSource.sites.length}`);
    console.log(`- 聚合直播源数量: ${mergedSource.lives.length}`);

    // 可以选择性地对解析规则进行去重
    if (mergedSource.rules.length > 0) {
        // 示例：基于 "host" 属性对解析规则去重
        const ruleHosts = new Set();
        mergedSource.rules = mergedSource.rules.filter(rule => {
            if (rule && rule.host && !ruleHosts.has(rule.host)) {
                ruleHosts.add(rule.host);
                return true;
            }
            // 保留没有host属性的规则
            return !rule.host;
        });
        console.log(`- 聚合解析规则数量 (去重后): ${mergedSource.rules.length}`);
    }

    return mergedSource;
}

module.exports = { mergeSources };
