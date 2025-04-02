import { StatisticIntermediateResults } from '../../../../link-prioritisation-reimplementations/comunica-source-attribution/packages/statistic-intermediate-results/lib';
import { ComunicaRunner } from '../packages/comunica-runner';
import { queries } from '../queries/solidbench-queries';
import { bottleNeckQueries } from '../queries/bottleneck-queries';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';

const runner = new ComunicaRunner();
// runSingleQuery(runner, queries.d_1_1, 10);
runSingleQueryStreaming(runner, bottleNeckQueries.traversal, 1);

async function runSingleQuery(runner: ComunicaRunner, query: string, repeats: number){
    for (let i = 0; i < repeats; i++){
        console.log(`${i+1}/${repeats}`)
        let links = 0;
        let intermediateResults = 0;
        const statistic = new StatisticLinkDiscovery()
        const statisticIntermediateResults = new StatisticIntermediateResults();
        statistic.on((data) => {
            links++;
        })
        statisticIntermediateResults.on((data) => {
            intermediateResults++
        })
        const bs = await runner.executeQuery(query, {
            "lenient": true, 
            [statistic.key.name]: statistic,
            [statisticIntermediateResults.key.name]: statisticIntermediateResults
        });

        const { result, elapsed } = await runner.timeIt(
            async (bs: any) => await bs.toArray(), bs
        );
        console.log(`${result.length} results, ${links} links, and ${intermediateResults} intermediate results
        in ${(elapsed/1000).toFixed(4)} seconds`
        );    
    }
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