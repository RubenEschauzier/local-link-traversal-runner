"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../../../../link-prioritisation-reimplementations/comunica-source-attribution/packages/statistic-intermediate-results/lib");
const comunica_runner_1 = require("../packages/comunica-runner");
const bottleneck_queries_1 = require("../queries/bottleneck-queries");
const statistic_link_discovery_1 = require("@comunica/statistic-link-discovery");
const runner = new comunica_runner_1.ComunicaRunner();
// runSingleQuery(runner, queries.d_1_1, 10);
runSingleQueryStreaming(runner, bottleneck_queries_1.bottleNeckQueries.traversal, 1);
async function runSingleQuery(runner, query, repeats) {
    for (let i = 0; i < repeats; i++) {
        console.log(`${i + 1}/${repeats}`);
        let links = 0;
        let intermediateResults = 0;
        const statistic = new statistic_link_discovery_1.StatisticLinkDiscovery();
        const statisticIntermediateResults = new lib_1.StatisticIntermediateResults();
        statistic.on((data) => {
            links++;
        });
        statisticIntermediateResults.on((data) => {
            intermediateResults++;
        });
        const bs = await runner.executeQuery(query, {
            "lenient": true,
            [statistic.key.name]: statistic,
            [statisticIntermediateResults.key.name]: statisticIntermediateResults
        });
        const { result, elapsed } = await runner.timeIt(async (bs) => await bs.toArray(), bs);
        console.log(`${result.length} results, ${links} links, and ${intermediateResults} intermediate results
        in ${(elapsed / 1000).toFixed(4)} seconds`);
    }
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
        const start = performance.now();
        bs.on('data', () => {
            console.log(`Result after: ${(performance.now() - start) / 1000} seconds`);
        });
        bs.on('end', () => {
            console.log(`${links} links in ${(performance.now() - start) / 1000} seconds`);
        });
    }
}
//# sourceMappingURL=run-single-solidbench-query.js.map