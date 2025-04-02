"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComunicaRunner = void 0;
class ComunicaRunner {
    constructor() {
        const QueryEngine = require('@comunica/query-sparql-link-traversal-solid').QueryEngine;
        this.engine = new QueryEngine();
    }
    async executeQuery(query, context) {
        const bindingsStream = await this.engine.queryBindings(query, context);
        return bindingsStream;
    }
    consumeStream(bindingsStream, cb) {
    }
    async timeIt(toTime, functionArguments) {
        const start = performance.now();
        const result = await toTime(functionArguments);
        const elapsed = performance.now() - start;
        return { result, elapsed };
    }
}
exports.ComunicaRunner = ComunicaRunner;
//# sourceMappingURL=comunica-runner.js.map