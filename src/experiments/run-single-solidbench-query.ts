import { ComunicaRunner } from '../packages/comunica-runner';
import { queries } from '../queries/solidbench-queries';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import { StatisticLinkDereference } from '@comunica/statistic-link-dereference';

const runnerOuter = new ComunicaRunner();
runQueriesRepeat([queries.d_6_1], ["d_8_1"], 3, false);

type QueryMetrics = {
    totalTimeTaken: number[];
    firstTs: number[];
    lastTs: number[];
    nResults: number[];
    linksDereferenced: number[];
};

async function runQueriesRepeat(queries: string[], queryNames: string[], repeats: number, newRunner: boolean) {
    // Initialize the dictionary mapping query names to their metric arrays
    const resultsByQuery: Record<string, QueryMetrics> = {};
    for (const name of queryNames) {
        resultsByQuery[name] = {
            totalTimeTaken: [],
            firstTs: [],
            lastTs: [],
            nResults: [],
            linksDereferenced: []
        };
    }
    let runner = new ComunicaRunner();

    for (let i = 0; i < repeats; i++) {
        for (let qIndex = 0; qIndex < queries.length; qIndex++) {
            const query = queries[qIndex];
            const queryName = queryNames[qIndex];
            const metrics = resultsByQuery[queryName];

            if (newRunner) {
                runner = new ComunicaRunner();
            }
            console.log(`Query: ${queryName} - Repetition: ${i + 1}/${repeats}`);

            let links = 0;
            const statistic = new StatisticLinkDereference();
            const dereferenced = new Set();
            statistic.on((data) => {
                dereferenced.add(data.url);
                links++;
            });

            const bs = await runner.executeQuery(query, {
                "lenient": true,
                // noCache: true,
                [statistic.key.name]: statistic,
            });

            const result = await trackTimestamps(bs);
            
            // Push results to the specific query's arrays
            metrics.totalTimeTaken.push(result.endTime);
            metrics.firstTs.push(result.timestamps[0] || 0); // Guard against queries with 0 results
            metrics.lastTs.push(result.timestamps[result.timestamps.length - 1] || 0);
            metrics.nResults.push(result.nResults);
            metrics.linksDereferenced.push(dereferenced.size);

            console.log(`${queryName}: ${(result.endTime).toFixed(4)} seconds, ${result.nResults} results, ${dereferenced.size} links`);
            await sleep(500);
        }
    }

    // Calculate and print stats for each query
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
}

function trackTimestamps(bs: NodeJS.ReadableStream): Promise<{ timestamps: number[], endTime: number, nResults: number }> {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const timestamps: number[] = [];
        let nResults = 0;

        bs.on('data', () => {
            timestamps.push((performance.now() - start) / 1000);
            nResults += 1;
        });

        bs.on('end', () => {
            const endTime = (performance.now() - start) / 1000;
            resolve({ timestamps, endTime, nResults });
        });
        bs.on('error', (err) => {
            console.log(err);
            const endTime = (performance.now() - start) / 1000;
            reject({ timestamps, endTime, nResults })
        })
    });
}

async function runSingleQueryStreaming(runner: ComunicaRunner, query: string, repeats: number) {
    for (let i = 0; i < repeats; i++) {
        console.log(`${i + 1}/${repeats}`)
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
            console.log(`Result after: ${(performance.now() - start) / 1000} seconds`);
        });
        bs.on('end', () => {
            console.log(`${links} links in ${(performance.now() - start) / 1000} seconds`);
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