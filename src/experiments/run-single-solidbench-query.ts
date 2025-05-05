import { resourceLimits } from 'worker_threads';
import { ComunicaRunner } from '../packages/comunica-runner';
import { queries } from '../queries/solidbench-queries';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import { LoggerPretty } from '@comunica/logger-pretty';

// runSingleQuery(runner, queries.d_1_1, 100);
runSingleQuery(queries.d_8_5, 8);
// runSingleQueryStreaming(runner, bottleNeckQueries.traversal, 1);

async function runSingleQuery(query: string, repeats: number, runner?: ComunicaRunner){
    const totalTimeTaken = [];
    const firstTs = [];
    const lastTs = [];
    const nResults = [];
    for (let i = 0; i < repeats; i++){
        const runner = new ComunicaRunner();
        console.log(process.memoryUsage())
        console.log(`${i+1}/${repeats}`);

        // let links = 0;
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
            // [statistic.key.name]: statistic,
            // [statisticIntermediateResults.key.name]: statisticIntermediateResults
        });
        const result = await trackTimestamps(bs);
        console.log(result);
        totalTimeTaken.push(result.endTime);
        firstTs.push(result.timestamps[0]);
        lastTs.push(result.timestamps[result.timestamps.length-1]);
        nResults.push(result.nResults);
        // const result = await bs.toArray();

        // const timeTaken = (performance.now() - start)/1000;
        // totalTimeTaken.push(timeTaken);
        console.log(`${(totalTimeTaken[totalTimeTaken.length-1]).toFixed(4)} seconds, ${nResults[nResults.length-1]} results`);    
        if (global.gc) {
            global.gc();
        } else {
            console.log('Garbage collection unavailable.  Pass --expose-gc '
              + 'when launching node to enable forced garbage collection.');
        }
        sleep(5000);
        // console.log(`${result.length} results, ${links} links, and ${intermediateResults} intermediate results
        // in ${(timeTaken).toFixed(4)} seconds`
        // );    
    }
    const {mean, std} = getStats(totalTimeTaken);
    const {mean: meanFirst, std: stdFirst}  = getStats(firstTs);
    const {mean: meanLast, std: stdLast} = getStats(lastTs);
    console.log(`Execution time: ${mean}(${std})`);
    console.log(`First ts: ${meanFirst}(${stdFirst})`);
    console.log(`Last ts: ${meanLast}(${stdLast})`);
}

function trackTimestamps(bs: NodeJS.ReadableStream): Promise<{ timestamps: number[], endTime: number, nResults: number }> {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const timestamps: number[] = [];
        let nResults = 0;

        bs.on('data', () => {
            timestamps.push((performance.now() - start) / 1000);
            nResults += 1;
            console.log("Got data")
        });

        bs.on('end', () => {
            const endTime = (performance.now() - start) / 1000;
            resolve({ timestamps, endTime, nResults });
        });
        bs.on('error', (err) => {
            console.log(err);
            const endTime = (performance.now() - start) / 1000;
            reject({timestamps, endTime, nResults })
        })
    });
}

async function runSingleQueryStreaming(runner: ComunicaRunner, query: string, repeats: number){
    for (let i = 0; i < repeats; i++){
        console.log(`${i+1}/${repeats}`)
        let links = 0;
        const statistic = new StatisticLinkDiscovery()
        statistic.on((data) => {
            links++;
        });
        const bs = await runner.executeQuery(query, {
            "lenient": true, 
            [statistic.key.name]: statistic,
        });
        const start = performance.now();
        bs.on('data', () => {
            console.log(`Result after: ${(performance.now() - start)/1000} seconds`);
        });
        bs.on('end', () => {
            console.log(`${links} links in ${(performance.now()-start)/1000} seconds`);
        });
    }
}

function getStats(arr: number[]): { mean: number; std: number } {
    if (arr.length === 0) return { mean: 0, std: 0 };
  
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  
    const variance =
      arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  
    const std = Math.sqrt(variance);
  
    return { mean, std };
}

function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
// "Type-index: 5.01260620078"
// BFS Execution time: 5.151359135539996(0.40667891642476683)
// Type-Index Execution Time: 5.1037558031700065(0.5047199817937335)
`
Type Index:
Execution time: 4.784637267709996(0.420810544381306)
First ts: 0.9192274094399958(0.1947151810088686)
Last ts: 1.1635524492999962(0.5465982741765153)
BFS:
Execution time: 5.0480078823199985(0.5673089988421482)
First ts: 1.08714607718(0.6613737574271775)
Last ts: 1.3708740904099992(0.8669249627766322)
`
