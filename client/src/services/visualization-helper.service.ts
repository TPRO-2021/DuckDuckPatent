import { Patent } from '@/models/Patent';
import { VisualPatentNode } from '@/models/VisualPatentNode';
import { SimulationLinkDatum } from 'd3';
import { VisualizationOptions } from '@/models/VisualizationOptions';
import { RelationMap } from '@/models/RelationMap';

export default class VisualizationHelperService {
    /**
     * Processes the passed patents and returns them as nodes for D3 to display them.
     * A SimulationNodeDatum needs a unique identifier which we can provide by using the
     * unique patent id
     */
    static getNodes(
        patents: Patent[],
        citationMap: RelationMap,
        vizOptions: string[],
        selectedNode: VisualPatentNode | null,
        authorsMap: RelationMap,
        companyMap: RelationMap,
    ): VisualPatentNode[] {
        const patentMap = VisualizationHelperService.buildMap(patents, 'id'); // Build a map of all patents, this should make finding them by ID faster.

        let nodes = patents.map((patent) => ({
            id: patent.id,
            patent,
            type: 'patent',
            color: 'rgb(168, 133, 41)',
            size: 18,
        })) as VisualPatentNode[];

        // If the user has selected to view authors
        if (vizOptions.includes('authors')) {
            const authorNodes = VisualizationHelperService.getCreatorNodes(
                Object.keys(authorsMap),
                authorsMap,
                selectedNode,
                patentMap,
                'rgb(168, 41, 41)',
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
                'rgb(41, 115, 168)',
                'company',
            );

            nodes = [...nodes, ...companyNodes];
        }

        // If the user has selected to view citations
        if (vizOptions.includes('citations')) {
            const green = 'rgb(72, 121, 9)';
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
                    let patents = [selectedNode.patent.id];
                    if (selectedNode.type === 'citation') {
                        patents = citationMap[selectedNode.id];
                    }
                    return patents.some((t) => citationMap[citationId].includes(t));
                })
                .map((citationId) => {
                    const citingPatents = citationMap[citationId]; // With the citations of this patent
                    const patentId = citingPatents[0]; // Select the first patentId arbitrarily (this should change later)
                    return {
                        id: citationId, // Set the Id to the citation Id (this is important so we can look up it's other links later)
                        patent: patentMap[patentId], // Set the "patent" to the "first" patent (this should change later)
                        type: 'citation', // Set the type to citation
                        color: green, // Set to color to green
                        size: citingPatents.length * 3 + 5, // Use dynamic sizing to show relative importance
                        x: selectedNode?.x,
                        y: selectedNode?.y,
                    } as VisualPatentNode;
                });

            nodes = [...nodes, ...citationNodes]; // Extend the nodes array with the citation nodes
        }

        return nodes;
    }

    /**
     * Processes the passed patents and finds relations between them.
     */
    static getLinks(
        nodes: VisualPatentNode[],
        citationMap: RelationMap,
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

        // Add other links between the patents and companies/authors
        const otherLinks = nodes
            .filter((t) => t.type !== 'patent' && t.type !== 'citation' && t.type !== 'author' && t.type !== 'company') // Patents & citations are handled separately
            .map((t) => ({
                // Map the nodes to source and target (one link per node)
                source: t, // The source is the author or company
                target: nodeMap[t.patent?.id], // The target is the patent
            })) as { source: VisualPatentNode; target: VisualPatentNode }[];

        // Combine all links together
        return [...interNodeCitations, ...citationLinks, ...authorLinks, ...companyLinks, ...otherLinks]
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
                    ...(patent[path] || []).map((inventor: string) => ({
                        source: inventor,
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
                    ...relationMap[node.id].map((t) => ({
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
        nodeColor: string,
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
                    color: nodeColor,
                    size: relatedPatents.length * 3 + 5,
                    x: selectedNode?.x,
                    y: selectedNode?.y,
                };
            }) as VisualPatentNode[];
    }

    /**
     * Create a key -> value map that allows for easy look up of something for given Id
     */
    static buildMap<T>(items: T[], idKey: keyof T): { [id: string]: T } {
        return items.reduce((map, b) => {
            // Reduce the array to an object
            // eslint-disable-next-line
            const key = b[idKey] as any as string; // unclear if there is clean way to do this in typescript
            return { ...map, [key]: b }; // extend the object with a specific key
        }, {});
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
