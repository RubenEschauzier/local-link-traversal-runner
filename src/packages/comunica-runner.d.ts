export declare class ComunicaRunner {
    engine: any;
    constructor();
    executeQuery(query: string, context: Record<string, any>): Promise<any>;
    consumeStream(bindingsStream: any, cb: () => void): void;
    timeIt(toTime: Function, functionArguments: Record<string, any>): Promise<ITimingResult>;
}
export interface ITimingResult {
    result: any;
    elapsed: number;
}
