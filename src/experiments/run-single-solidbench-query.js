"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comunica_runner_1 = require("../packages/comunica-runner");
const solidbench_queries_1 = require("../queries/solidbench-queries");
const statistic_link_discovery_1 = require("@comunica/statistic-link-discovery");
const statistic_link_dereference_1 = require("@comunica/statistic-link-dereference");
runSingleQuery(solidbench_queries_1.queries.local_d_6_0, 1);
async function runSingleQuery(query, repeats, runner) {
    const totalTimeTaken = [];
    const firstTs = [];
    const lastTs = [];
    const nResults = [];
    for (let i = 0; i < repeats; i++) {
        const runner = new comunica_runner_1.ComunicaRunner();
        console.log(`${i + 1}/${repeats}`);
        let links = 0;
        const statistic = new statistic_link_dereference_1.StatisticLinkDereference();
        statistic.on((data) => {
            links++;
        });
        // let intermediateResults = 0;
        // const statistic = new StatisticLinkDiscovery();
        // const linksEmitted: Set<string> = new Set();
        // const statisticIntermediateResults = new StatisticIntermediateResults();
        // statistic.on((data) => {
        //     if (!linksEmitted.has(data.edge[1])){
        //         linksEmitted.add(data.edge[1]);
        //         links++;
        //     }
        // });
        // statisticIntermediateResults.on((data) => {
        //     intermediateResults++
        // });
        // const timestamps = [];
        // const start = performance.now();
        const bs = await runner.executeQuery(query, {
            "lenient": true,
            noCache: true,
            // log: new LoggerPretty({ level: 'debug' })
            [statistic.key.name]: statistic,
            // [statisticIntermediateResults.key.name]: statisticIntermediateResults
        });
        const result = await trackTimestamps(bs);
        totalTimeTaken.push(result.endTime);
        firstTs.push(result.timestamps[0]);
        lastTs.push(result.timestamps[result.timestamps.length - 1]);
        nResults.push(result.nResults);
        console.log(`${(totalTimeTaken[totalTimeTaken.length - 1]).toFixed(4)} seconds, ${nResults[nResults.length - 1]} results, ${links} links`);
        await sleep(500);
    }
    const { mean, std } = getStats(totalTimeTaken);
    const { mean: meanFirst, std: stdFirst } = getStats(firstTs);
    const { mean: meanLast, std: stdLast } = getStats(lastTs);
    const { mean: meanResult, std: stdResults } = getStats(nResults);
    console.log(`Execution time: ${mean}(${std})`);
    console.log(`First ts: ${meanFirst}(${stdFirst})`);
    console.log(`Last ts: ${meanLast}(${stdLast})`);
    console.log(`Results: ${meanResult}(${stdResults})`);
}
function trackTimestamps(bs) {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const timestamps = [];
        let nResults = 0;
        bs.on('data', () => {
            timestamps.push((performance.now() - start) / 1000);
            nResults += 1;
            console.log("Found data");
        });
        bs.on('end', () => {
            const endTime = (performance.now() - start) / 1000;
            resolve({ timestamps, endTime, nResults });
        });
        bs.on('error', (err) => {
            console.log(err);
            const endTime = (performance.now() - start) / 1000;
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
        const start = performance.now();
        bs.on('data', () => {
            console.log(`Result after: ${(performance.now() - start) / 1000} seconds`);
        });
        bs.on('end', () => {
            console.log(`${links} links in ${(performance.now() - start) / 1000} seconds`);
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
`
Default:
Execution time: 4.186129396125001(0.3234682246751786)
First ts: 0.8993861942500014(0.1947914953027016)
Last ts: 1.11254683425(0.22251503310573326)
Results: 6(0)
Fixed-min-index:
Execution time: 2.6007704186249994(0.47325979027136944)
First ts: 0.7889877312499991(0.43696611212360453)
Last ts: 0.8390577231249994(0.45009665646657526)
Results: 6(0)
Lottery:
Execution time: 2.5118684554999997(0.239776353242635)
First ts: 0.6692206422500001(0.19015717899060885)
Last ts: 0.7392682557499998(0.15377096900358228)
Results: 6(0)
Lottery signature-based:
Execution time: 3.4850449025(2.4942489317108425)
First ts: 0.7051670757500001(0.10495525440143293)
Last ts: 0.7672689716250004(0.20778836106071646)
Results: 6(0)

`;
//# sourceMappingURL=run-single-solidbench-query.js.map