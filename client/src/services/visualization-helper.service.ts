import { Patent } from '@/models/Patent';
import { VisualPatentNode } from '@/models/VisualPatentNode';
import { Selection, SimulationLinkDatum } from 'd3';
import { VisualizationOptions } from '@/models/VisualizationOptions';
import { RelationMap } from '@/models/RelationMap';

export default class VisualizationHelperService {
    static linkDataset: { source: string; target: string }[]; // contains the list of patents and their sources. Set in getLinks method.
    /**
     * Processes the passed patents and returns them as nodes for D3 to display them.
     * A SimulationNodeDatum needs a unique identifier which we can provide by using the
     * unique patent id
     */
    static getNodes(
        patents: Patent[],
        citationMap: RelationMap,
        familyMap: { [id: string]: string[] },
        vizOptions: string[],
        selectedNode: VisualPatentNode | null,
        authorsMap: RelationMap,
        companyMap: RelationMap,
    ): VisualPatentNode[] {
        const patentMap = VisualizationHelperService.buildMap(patents, 'id'); // Build a map of all patents, this should make finding them by ID faster.

        let nodes: VisualPatentNode[] = [];
        if (vizOptions.includes('patents')) {
            nodes = patents.map((patent) => ({
                id: patent.id,
                patent,
                type: 'patent',
                size: this.patentSize(patent.id),
            })) as VisualPatentNode[];
        }

        // If the user has selected to view authors
        if (vizOptions.includes('authors')) {
            const authorNodes = VisualizationHelperService.getCreatorNodes(
                Object.keys(authorsMap),
                authorsMap,
                selectedNode,
                patentMap,
                'author',
            );

            nodes = [...nodes, ...authorNodes]; // Extend the nodes array with author nodes
        }

        // If the user has selected to view companies
        if (vizOptions.includes('companies')) {
            const companyNodes = VisualizationHelperService.getCreatorNodes(
                Object.keys(companyMap),
                companyMap,
                selectedNode,
                patentMap,
                'company',
            );

            nodes = [...nodes, ...companyNodes];
        }

        // If the user has selected to view citations
        if (vizOptions.includes('citations')) {
            const citationNodes = Object.keys(citationMap) // Get the keys (citation ids) from the citationMap.
                .filter((citationId) => !patentMap[citationId]) // Remove patent-node to patent-node citations (these nodes are already shown)
                .filter((citationId) => {
                    // Default to only showing citations that are cited by multiple patents (for clarity)
                    if (citationMap[citationId].length > 1) {
                        return true;
                    }
                    // If none selected (and not multiple citaitons), don't show
                    if (selectedNode == null) {
                        return false;
                    }
                    // If a node is selected, only show if connected to it
                    let connectedPatents = [selectedNode.patent.id];
                    if (selectedNode.type === 'citation') {
                        connectedPatents = citationMap[selectedNode.id] || []; // TODO: citations should always have atleast one
                    }
                    return connectedPatents.some((t) => citationMap[citationId].includes(t));
                })
                .map((citationId) => {
                    const citingPatents = citationMap[citationId]; // With the citations of this patent
                    const patentId = citingPatents[0]; // Select the first patentId arbitrarily (this should change later)
                    return {
                        id: citationId, // Set the Id to the citation Id (this is important so we can look up it's other links later)
                        patent: patentMap[patentId], // Set the "patent" to the "first" patent (this should change later)
                        type: 'citation', // Set the type to citation
                        size: citingPatents.length * 3 + 5, // Use dynamic sizing to show relative importance
                        x: selectedNode?.x,
                        y: selectedNode?.y,
                    } as VisualPatentNode;
                });

            nodes = [...nodes, ...citationNodes]; // Extend the nodes array with the citation nodes
        }
        if (vizOptions.includes('families')) {
            const familyNodes = Object.keys(familyMap)
                .filter((t) => familyMap[t].length > 1)
                .map((id) => {
                    const patentsInFamily = familyMap[id];
                    return {
                        id, // Set the id to be the family Id
                        patent: patentMap[patentsInFamily[0]], // used for tooltip ect. - this should change
                        type: 'family', // Set the type of the node to 'family'
                        size: patentsInFamily.length * 3 + 5, // Use dynamic sizing to show relative importance
                    } as VisualPatentNode;
                });
            nodes = [...nodes, ...familyNodes];
        }

        return nodes;
    }
    /**
     * Processes the passed patents and finds relations between them.
     */
    static getLinks(
        nodes: VisualPatentNode[],
        citationMap: RelationMap,
        familyMap: { [id: string]: string[] },
        authorsMap: RelationMap,
        companyMap: RelationMap,
    ): SimulationLinkDatum<VisualPatentNode>[] {
        const patentNodes = nodes.filter((t) => t.type === 'patent' && t.patent); // Start with just the 'initial' patent nodes
        const nodeMap = VisualizationHelperService.buildMap(patentNodes, 'id'); // Create a map for faster lookups

        // Add links between nodes that have cited one another
        const interNodeCitations = patentNodes.reduce(
            // first we need to create an array, containing the relations
            (relations, node) => [
                ...relations, // extend the relations...
                ...(node.patent.citations || []).map(
                    (citedPatent: Patent) =>
                        ({
                            // ... with a map of nodes to source & target
                            source: node, // Source is citing patent node
                            target: nodeMap[citedPatent.id], // target is the patent node being cited
                        } as { source: VisualPatentNode; target: VisualPatentNode }),
                ),
            ],
            [] as { source: VisualPatentNode; target: VisualPatentNode }[],
        );

        // Add citations for patents that aren't displayed (but are cited by more than one patent)
        const citationLinks = nodes
            .filter((t) => t.type === 'citation') // Only build links for citations
            .reduce(
                (links, node) => [
                    // Create a large list
                    ...links, // Extend the current list...
                    ...citationMap[node.id].map((t) => ({
                        // ...with the citations (mapped to source/target)
                        source: nodeMap[t], // Set the source to the citing patent patent
                        target: node, // Set the target to the current node (the citation)
                    })),
                ],
                [] as { source: VisualPatentNode; target: VisualPatentNode }[],
            );

        // add author links
        const authorLinks = VisualizationHelperService.getCreatorLinks(nodes, nodeMap, 'author', authorsMap);

        // add company links
        const companyLinks = VisualizationHelperService.getCreatorLinks(nodes, nodeMap, 'company', companyMap);

        const familyLinks = nodes
            .filter((t) => t.type === 'family') // Only build links for family nodes
            .reduce(
                (links, node) => [
                    // Create a large list
                    ...links, // Extend the current list...
                    ...familyMap[node.id].map((t) => ({
                        // ...with the family nodes (mapped to source/target)
                        source: nodeMap[t], // Set the source to the patent that is part of the family
                        target: node, // Set the target to the current family node (the citation)
                    })),
                ],
                [] as { source: VisualPatentNode; target: VisualPatentNode }[],
            );

        // stores the data with links in a variable for later access by patentSize TODO:check if should be changed
        this.linkDataset = [...interNodeCitations, ...citationLinks, ...authorLinks, ...companyLinks, ...familyLinks]
            .filter((t) => t.source && t.target)
            .map((e) => ({ source: e.source.id, target: e.target.id } as { source: string; target: string }));

        // Combine all links together
        return [...interNodeCitations, ...citationLinks, ...authorLinks, ...companyLinks, ...familyLinks]
            .filter((t) => t.source && t.target) // Filter out any that have sources/targets that are either: null, 0, '', undefined, or false
            .map((t, index) => ({ ...t, index })); // Extend citations with an index that VueJS can use when enumerating them
    }

    /**
     * Create a key -> value map that allows for easy look up of all patents that have cited a specific citation
     */
    static getCitationMap(patents: Patent[]): { [id: string]: string[] } {
        return patents
            .reduce(
                (citations, patent) => [
                    // Iterate through the patents, adding citations to a large list
                    ...citations, // Extend current citations collected...
                    ...(patent.citations || []).map(
                        (citedPatent: Patent) =>
                            ({
                                // ...with the citations of the current patent
                                source: citedPatent.id, // first map to source/target ids
                                target: patent.id,
                            } as { source: string; target: string }),
                    ),
                ],
                [] as { source: string; target: string }[],
            )
            .reduce(
                // Finally reduce the array to a map
                (citations, link) => {
                    let updatedCitations = citations[link.source] ?? [];
                    if (!updatedCitations.includes(link.target)) {
                        // If this target doesn't already exist
                        updatedCitations = [...updatedCitations, link.target]; // Add it
                    }
                    return {
                        ...citations, // extend the current citationMap...
                        [link.source]: updatedCitations, // with an extended version of the sourceId (citedPatentId) 's array
                    };
                },
                {} as { [id: string]: string[] },
            );
    }

    /**
     * Gets a map for creators of patents (inventors or applicants)
     * @param patents
     * @param path
     */
    static getCreatorMap(patents: Patent[], path: 'inventors' | 'applicants'): { [id: string]: string[] } {
        return patents
            .reduce(
                (stakeholders, patent) => [
                    ...stakeholders,
                    ...(patent[path] || []).map((id: string) => ({
                        source: id,
                        target: patent.id,
                    })),
                ],
                [] as { source: string; target: string }[],
            )
            .reduce((stakeholders, link) => {
                let updatedNodes = stakeholders[link.source] ?? [];

                if (!updatedNodes.includes(link.target)) {
                    updatedNodes = [...updatedNodes, link.target];
                }
                return {
                    ...stakeholders,
                    [link.source]: updatedNodes,
                };
            }, {} as { [id: string]: string[] });
    }

    /**
     * Gets links for creators (authors or company)
     * @param nodes
     * @param nodeMap
     * @param nodeType
     * @param relationMap
     */
    static getCreatorLinks(
        nodes: VisualPatentNode[],
        nodeMap: { [p: string]: VisualPatentNode },
        nodeType: 'author' | 'company',
        relationMap: RelationMap,
    ): { source: VisualPatentNode; target: VisualPatentNode }[] {
        return nodes
            .filter((t) => t.type === nodeType)
            .reduce(
                (links, node) => [
                    ...links,
                    ...(relationMap[node.id] || []).map((t) => ({
                        source: node,
                        target: nodeMap[t],
                    })),
                ],
                [] as { source: VisualPatentNode; target: VisualPatentNode }[],
            );
    }

    /**
     * Gets creator nodes (authors | company)
     * @param stakeholders
     * @param stakeholderMap
     * @param selectedNode
     * @param patentMap
     * @param nodeColor
     * @param stakeholderType
     */
    static getCreatorNodes(
        stakeholders: string[],
        stakeholderMap: RelationMap,
        selectedNode: VisualPatentNode | null,
        patentMap: { [p: string]: Patent },
        stakeholderType: 'author' | 'company',
    ): VisualPatentNode[] {
        return stakeholders
            .filter((stakeholderId) => {
                // Default to only showing authors that are responsible for multiple patents (for clarity)
                if (stakeholderMap[stakeholderId].length > 1) {
                    return true;
                }
                // If none selected (and not multiple authors), don't show
                if (selectedNode === null) {
                    return false;
                }

                // If a node is selected, only show if connected to it
                let patents = [selectedNode.id];
                if (selectedNode.type === stakeholderType) {
                    patents = stakeholderMap[selectedNode.id] || [];
                }
                return patents.some((t) => stakeholderMap[stakeholderId].includes(t));
            })
            .map((stakeholder) => {
                const relatedPatents = stakeholderMap[stakeholder];
                const patentId = relatedPatents[0]; // Select the first patentId arbitrarily (this should change later)
                return {
                    id: stakeholder,
                    type: stakeholderType,
                    patent: patentMap[patentId],
                    size: relatedPatents.length * 3 + 5,
                    x: selectedNode?.x,
                    y: selectedNode?.y,
                };
            }) as VisualPatentNode[];
    }

    /**
     * Create a key -> value map that allows for easy look up of patents for given familyId
     */
    static getFamilyMap(patents: Patent[]): { [id: string]: string[] } {
        return patents.reduce((map: { [id: string]: string[] }, b: Patent) => {
            // Ignore patents without familyIds
            if (b.familyId == null) {
                return map;
            }
            const patentIds = map[b.familyId] || []; // Get current array of patentIds
            return { ...map, [b.familyId]: [...patentIds, b.id] }; // extend the family with a new patentId
        }, {});
    }

    /**
     * Create a key -> value map that allows for easy look up of something for given Id
     */
    static buildMap<T>(items: T[], idKey: keyof T): { [id: string]: T } {
        return items.reduce((map, b) => {
            // Reduce the array to an object
            // eslint-disable-next-line
            const key = b[idKey] as any as string; // unclear if there is clean way to do this in typescript
            // Don't add null/undefined ids to the map
            if (key == null) {
                return map;
            }
            return { ...map, [key]: b }; // extend the object with a specific key
        }, {});
    }
    /**
     *  Determines size of patent node based on the count of incoming edges
     */
    static patentSize(id: string): number {
        if (!this.linkDataset) {
            return 10;
        }

        const count = this.linkDataset.filter((e) => e.target === id).length;
        return count * 2 + 10;
    }
    /**
     * Assigns a checkmark class based on patent size
     */
    static patentMark(
        graph: Selection<SVGSVGElement, VisualPatentNode, SVGGraphicsElement, unknown>,
        marked: string[],
        checkmarkType: string,
    ): void {
        marked.forEach((e: string) => {
            const target = graph.filter((d: VisualPatentNode) => d.id === e);
            target.classed(checkmarkType, true);
        });
    }

    /**
     * Returns the options used for the visualization
     */
    static getVisualizationOptions(): VisualizationOptions {
        return {
            center: {
                x: 0.5,
                y: 0.5,
            },
            charge: {
                enabled: true,
                strength: -700,
                distanceMin: 60,
                distanceMax: 1000,
            },
            collide: {
                enabled: true,
                strength: 0.7,
                iterations: 1,
                radius: 60,
            },
            forceX: {
                enabled: true,
                strength: 0.05,
                x: 0.3,
            },
            forceY: {
                enabled: true,
                strength: 0.1,
                y: 0.3,
            },
            link: {
                enabled: true,
                strength: 0.1,
                distance: 300,
                iterations: 1,
            },
        };
    }
}
