export class ComunicaRunner {
    public engine: any;

    public constructor(){
        const QueryEngine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
        this.engine = new QueryEngine();
    }

    public async executeQuery(query: string, context: Record<string, any>){
        const bindingsStream = await this.engine.queryBindings(query, context);
        return bindingsStream
    }
    
    public async explainQuery(query: string, context: Record<string, any>, explainType: string){
        return await this.engine.explain(query, context, explainType);
    }
    
    public async timeIt(toTime: Function, functionArguments: Record<string, any>): Promise<ITimingResult>{
        const start = performance.now();
        const result = await toTime(functionArguments)
        const elapsed = performance.now() - start;
        return { result, elapsed }
    }
}

export interface ITimingResult{
    result: any,
    elapsed: number
}