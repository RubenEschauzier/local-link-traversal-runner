"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comunica_runner_1 = require("../packages/comunica-runner");
const solidbench_queries_1 = require("../queries/solidbench-queries");
const statistic_link_discovery_1 = require("@comunica/statistic-link-discovery");
const statistic_link_dereference_1 = require("@comunica/statistic-link-dereference");
const statistic_traversal_topology_1 = require("@comunica/statistic-traversal-topology");
const fs = require("fs");
const runner = new comunica_runner_1.ComunicaRunner();
runSingleQuery(runner, solidbench_queries_1.queries.d_2_5, 3);
async function runSingleQuery(runner, query, repeats) {
    for (let i = 0; i < repeats; i++) {
        let links = 0;
        const statisticDiscovery = new statistic_link_discovery_1.StatisticLinkDiscovery();
        const statisticDereference = new statistic_link_dereference_1.StatisticLinkDereference();
        const statisticTopology = new statistic_traversal_topology_1.StatisticTraversalTopology(statisticDiscovery, statisticDereference);
        statisticTopology.on((data) => {
            const dataToWrite = JSON.stringify(data, null, 2);
            fs.writeFileSync('output.json', dataToWrite, 'utf8');
        });
        const start = performance.now();
        const bs = await runner.executeQuery(query, {
            "lenient": true,
            [statisticDiscovery.key.name]: statisticDiscovery,
            [statisticDereference.key.name]: statisticDereference,
            [statisticTopology.key.name]: statisticTopology
        });
        const { result, elapsed } = await runner.timeIt(async (bs) => await bs.toArray(), bs);
        console.log(`${result.length} results took ${(performance.now() - start) / 1000} seconds`);
    }
}
//# sourceMappingURL=run-solidbench-query-full-tracking.js.map