"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:inspector/promises");
const node_fs_1 = require("node:fs");
const promises_2 = require("node:fs/promises");
const node_perf_hooks_1 = require("node:perf_hooks");
const comunica_runner_1 = require("../packages/comunica-runner");
const solidbench_queries_1 = require("../queries/solidbench-queries");
const statistic_link_discovery_1 = require("@comunica/statistic-link-discovery");
const statistic_link_dereference_1 = require("@comunica/statistic-link-dereference");
const path = require("node:path");
runQueriesRepeat([solidbench_queries_1.queries.d_6_1], ["d_6_1"], 5, false, false);
async function runQueriesRepeat(queries, queryNames, repeats, newRunner, enableProfiling = false, profilingOutputDir) {
    const resultsByQuery = {};
    for (const name of queryNames) {
        resultsByQuery[name] = {
            totalTimeTaken: [], firstTs: [], lastTs: [],
            nResults: [], linksDereferenced: [],
            eluActive: [], eluUtilization: []
        };
    }
    if (enableProfiling && profilingOutputDir) {
        await (0, promises_2.mkdir)(profilingOutputDir, { recursive: true });
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
            let session;
            let tracingComplete;
            let eluStart;
            let traceFile = `trace_${queryName}_rep_${i + 1}.json`;
            if (profilingOutputDir) {
                traceFile = path.join(profilingOutputDir, traceFile);
            }
            if (enableProfiling) {
                session = new promises_1.Session();
                session.connect();
                const traceStream = (0, node_fs_1.createWriteStream)(traceFile);
                traceStream.write('[');
                let firstEntry = true;
                session.on('NodeTracing.dataCollected', (event) => {
                    for (const traceEvent of event.params.value) {
                        if (!firstEntry) {
                            traceStream.write(',');
                        }
                        traceStream.write(JSON.stringify(traceEvent));
                        firstEntry = false;
                    }
                });
                tracingComplete = new Promise((resolve) => {
                    session.once('NodeTracing.tracingComplete', () => {
                        traceStream.write(']');
                        traceStream.end();
                        resolve(undefined);
                    });
                });
                await session.post('NodeTracing.start', {
                    traceConfig: {
                        includedCategories: [
                            'node',
                            'node.async_hooks',
                            'v8',
                            // 'disabled-by-default-v8.cpu_profiler',
                        ]
                    }
                });
                eluStart = node_perf_hooks_1.performance.eventLoopUtilization();
            }
            const bs = await runner.executeQuery(query, {
                "lenient": true,
                [statistic.key.name]: statistic,
            });
            const result = await trackTimestamps(bs);
            if (enableProfiling && session && eluStart && tracingComplete) {
                const eluEnd = node_perf_hooks_1.performance.eventLoopUtilization(eluStart);
                await session.post('NodeTracing.stop');
                await tracingComplete;
                session.disconnect();
                metrics.eluActive.push(eluEnd.active);
                metrics.eluUtilization.push(eluEnd.utilization);
                console.log(`Event Loop: ${(eluEnd.utilization * 100).toFixed(2)}% utilization`);
                console.log(`Trace saved: ${traceFile}`);
            }
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
        if (enableProfiling && metrics.eluUtilization.length > 0) {
            const { mean: meanEluUtil } = getStats(metrics.eluUtilization);
            console.log(`Mean ELU:       ${(meanEluUtil * 100).toFixed(2)}%`);
        }
    }
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
            console.log(await runner.explainQuery(query, { "lenient": true }, explainType));
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