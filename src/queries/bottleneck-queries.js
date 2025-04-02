"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bottleNeckQueries = void 0;
exports.bottleNeckQueries = {
    traversal: `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
        SELECT ?person WHERE {
        <https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/card#me> snvoc:knows ?knows.
        ?knows snvoc:hasPerson ?person .
    }`
};
//# sourceMappingURL=bottleneck-queries.js.map