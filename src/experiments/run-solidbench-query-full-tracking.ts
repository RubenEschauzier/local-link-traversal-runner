import { ComunicaRunner } from '../packages/comunica-runner';
import { queries } from '../queries/solidbench-queries';
import { StatisticLinkDiscovery } from '@comunica/statistic-link-discovery';
import { StatisticLinkDereference } from '@comunica/statistic-link-dereference';
import { StatisticTraversalTopology} from '@comunica/statistic-traversal-topology';
import * as fs from 'fs';
const runner = new ComunicaRunner();
runSingleQuery(runner, queries.d_2_5, 3);


async function runSingleQuery(runner: ComunicaRunner, query: string, repeats: number){
    for (let i = 0; i < repeats; i++){
        let links = 0;
        const statisticDiscovery = new StatisticLinkDiscovery();
        const statisticDereference = new StatisticLinkDereference();
        const statisticTopology = new StatisticTraversalTopology(statisticDiscovery, statisticDereference);
        statisticTopology.on((data) => {
            const dataToWrite = JSON.stringify(data, null, 2);
            fs.writeFileSync('output.json', dataToWrite, 'utf8');
        });
        const start = performance.now()
        const bs = await runner.executeQuery(query, {
            "lenient": true, 
            [statisticDiscovery.key.name]: statisticDiscovery,
            [statisticDereference.key.name]: statisticDereference,
            [statisticTopology.key.name]: statisticTopology
        });
        const { result, elapsed } = await runner.timeIt(
            async (bs: any) => await bs.toArray(), bs
        );
        
        console.log(`${result.length} results took ${(performance.now() - start)/1000} seconds`);
    }
}
