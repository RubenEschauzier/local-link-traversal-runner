export const queries: Record<string, string> = {
    d_1_1:
`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT ?messageId ?messageCreationDate ?messageContent WHERE {
  ?message snvoc:hasCreator <https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/card#me>;
    rdf:type snvoc:Post;
    snvoc:content ?messageContent;
    snvoc:creationDate ?messageCreationDate;
    snvoc:id ?messageId.
}
`,
d_2_5: `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT ?messageId ?messageCreationDate ?messageContent WHERE {
  ?message snvoc:hasCreator <https://solidbench.linkeddatafragments.org/pods/00000006597069767117/profile/card#me>;
    snvoc:content ?messageContent;
    snvoc:creationDate ?messageCreationDate;
    snvoc:id ?messageId.
  { ?message rdf:type snvoc:Post. }
  UNION
  { ?message rdf:type snvoc:Comment. }
}`,
d_6_1: `
PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?forumId ?forumTitle WHERE {
  ?message snvoc:hasCreator <https://solidbench.linkeddatafragments.org/pods/00000000000000000933/profile/card#me>.
  ?forum snvoc:containerOf ?message;
    snvoc:id ?forumId;
    snvoc:title ?forumTitle.
}
`,
d_8_5: `
PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?creator ?messageContent WHERE {
  <https://solidbench.linkeddatafragments.org/pods/00000006597069767117/profile/card#me> snvoc:likes _:g_0.
  _:g_0 (snvoc:hasPost|snvoc:hasComment) ?message.
  ?message snvoc:hasCreator ?creator.
  ?otherMessage snvoc:hasCreator ?creator;
    snvoc:content ?messageContent.
}
LIMIT 10`,
d_7_5: `
PREFIX snvoc: <https://solidbench.linkeddatafragments.org/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?firstName ?lastName WHERE {
  ?message snvoc:hasCreator <https://solidbench.linkeddatafragments.org/pods/00000006597069767117/profile/card#me>.
  ?forum snvoc:containerOf ?message;
    snvoc:hasModerator ?moderator.
  ?moderator snvoc:firstName ?firstName;
    snvoc:lastName ?lastName.
}`,
local_d_6_0: `
PREFIX snvoc: <http://solidbench-server:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?forumId ?forumTitle WHERE {
  ?message snvoc:hasCreator <http://solidbench-server:3000/pods/00000000000000000933/profile/card#me>.
  ?forum snvoc:containerOf ?message;
    snvoc:id ?forumId;
    snvoc:title ?forumTitle.
}
`,
local_d_7_0: `
PREFIX snvoc: <http://solidbench-server:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?firstName ?lastName WHERE {
  ?message snvoc:hasCreator <http://solidbench-server:3000/pods/00000000000000000933/profile/card#me>.
  ?forum snvoc:containerOf ?message;
    snvoc:hasModerator ?moderator.
  ?moderator snvoc:firstName ?firstName;
    snvoc:lastName ?lastName.
}
`
};
