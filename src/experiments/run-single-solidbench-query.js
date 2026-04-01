"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_perf_hooks_1 = require("node:perf_hooks");
const comunica_runner_1 = require("../packages/comunica-runner");
const solidbench_queries_1 = require("../queries/solidbench-queries");
const statistic_link_discovery_1 = require("@comunica/statistic-link-discovery");
const statistic_link_dereference_1 = require("@comunica/statistic-link-dereference");
runRepeatRepeatExperiments(solidbench_queries_1.queries.d_7_1, "d_7_1", 2, 1, false);
async function runRepeatRepeatExperiments(query, queryName, repeats, repeatsOfRepeats, newRunner) {
    for (let i = 0; i < repeatsOfRepeats; i++) {
        const resultsByQuery = await runQueriesRepeat([query], [queryName], repeats, newRunner);
        console.log(resultsByQuery);
    }
}
async function runQueriesRepeat(queries, queryNames, repeats, newRunner) {
    const resultsByQuery = {};
    for (const name of queryNames) {
        resultsByQuery[name] = {
            totalTimeTaken: [], firstTs: [], lastTs: [],
            nResults: [], linksDereferenced: [],
            eluActive: [], eluUtilization: []
        };
    }
    let runner = new comunica_runner_1.ComunicaRunner();
    for (let i = 0; i < repeats; i++) {
        for (let qIndex = 0; qIndex < queries.length; qIndex++) {
            const query = queries[qIndex];
            const queryName = queryNames[qIndex];
            const metrics = resultsByQuery[queryName];
            if (newRunner) {
                runner = new comunica_runner_1.ComunicaRunner();
            }
            console.log(`\nQuery: ${queryName} - Repetition: ${i + 1}/${repeats}`);
            let links = 0;
            const statistic = new statistic_link_dereference_1.StatisticLinkDereference();
            const dereferenced = new Set();
            statistic.on((data) => {
                dereferenced.add(data.url);
                links++;
            });
            const bs = await runner.executeQuery(query, {
                "lenient": true,
                [statistic.key.name]: statistic,
            });
            const result = await trackTimestamps(bs);
            metrics.totalTimeTaken.push(result.endTime);
            metrics.firstTs.push(result.timestamps[0] || 0);
            metrics.lastTs.push(result.timestamps[result.timestamps.length - 1] || 0);
            metrics.nResults.push(result.nResults);
            metrics.linksDereferenced.push(dereferenced.size);
            console.log(`${queryName}: ${result.endTime.toFixed(4)}s, ${result.nResults} results, ${dereferenced.size} links`);
            await sleep(500);
        }
    }
    console.log('\n--- FINAL RESULTS ---');
    for (const [queryName, metrics] of Object.entries(resultsByQuery)) {
        console.log(`\nResults for query: ${queryName}`);
        const { mean, std } = getStats(metrics.totalTimeTaken);
        const { mean: meanFirst, std: stdFirst } = getStats(metrics.firstTs);
        const { mean: meanLast, std: stdLast } = getStats(metrics.lastTs);
        const { mean: meanResult, std: stdResults } = getStats(metrics.nResults);
        const { mean: meanLinks, std: stdLinks } = getStats(metrics.linksDereferenced);
        console.log(`Execution time: ${mean.toFixed(4)} (${std.toFixed(4)})`);
        console.log(`First ts:       ${meanFirst.toFixed(4)} (${stdFirst.toFixed(4)})`);
        console.log(`Last ts:        ${meanLast.toFixed(4)} (${stdLast.toFixed(4)})`);
        console.log(`Results:        ${meanResult.toFixed(2)} (${stdResults.toFixed(2)})`);
        console.log(`Links:          ${meanLinks.toFixed(2)} (${stdLinks.toFixed(2)})`);
    }
    return resultsByQuery;
}
async function explainQueriesRepeat(queries, queryNames, repeats, newRunner, explainType) {
    let runner = new comunica_runner_1.ComunicaRunner();
    for (let i = 0; i < repeats; i++) {
        for (let qIndex = 0; qIndex < queries.length; qIndex++) {
            const query = queries[qIndex];
            const queryName = queryNames[qIndex];
            if (newRunner) {
                runner = new comunica_runner_1.ComunicaRunner();
            }
            console.log(`Query: ${queryName}, repetition: ${i}:`);
            console.log(await runner.explainQuery(query, {
                "lenient": true,
                // log: new LoggerPretty({ level: 'debug' }), 
            }, explainType));
        }
    }
}
function trackTimestamps(bs) {
    return new Promise((resolve, reject) => {
        const start = node_perf_hooks_1.performance.now();
        const timestamps = [];
        let nResults = 0;
        bs.on('data', () => {
            timestamps.push((node_perf_hooks_1.performance.now() - start) / 1000);
            nResults += 1;
        });
        bs.on('end', () => {
            const endTime = (node_perf_hooks_1.performance.now() - start) / 1000;
            resolve({ timestamps, endTime, nResults });
        });
        bs.on('error', (err) => {
            console.log(err);
            const endTime = (node_perf_hooks_1.performance.now() - start) / 1000;
            reject({ timestamps, endTime, nResults });
        });
    });
}
async function runSingleQueryStreaming(runner, query, repeats) {
    for (let i = 0; i < repeats; i++) {
        console.log(`${i + 1}/${repeats}`);
        let links = 0;
        const statistic = new statistic_link_discovery_1.StatisticLinkDiscovery();
        statistic.on((data) => {
            links++;
        });
        const bs = await runner.executeQuery(query, {
            "lenient": true,
            [statistic.key.name]: statistic,
        });
        const start = node_perf_hooks_1.performance.now();
        bs.on('data', () => {
            console.log(`Result after: ${(node_perf_hooks_1.performance.now() - start) / 1000} seconds`);
        });
        bs.on('end', () => {
            console.log(`${links} links in ${(node_perf_hooks_1.performance.now() - start) / 1000} seconds`);
        });
    }
}
function getStats(arr) {
    if (arr.length === 0)
        return { mean: 0, std: 0 };
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    const std = Math.sqrt(variance);
    return { mean, std };
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//# sourceMappingURL=run-single-solidbench-query.js.map