export declare class ComunicaRunner {
    engine: any;
    constructor();
    executeQuery(query: string, context: Record<string, any>): Promise<any>;
    explainQuery(query: string, context: Record<string, any>, explainType: string): Promise<any>;
    timeIt(toTime: Function, functionArguments: Record<string, any>): Promise<ITimingResult>;
}
export interface ITimingResult {
    result: any;
    elapsed: number;
}
