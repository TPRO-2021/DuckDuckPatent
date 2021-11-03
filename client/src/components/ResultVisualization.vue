<template>
    <div class="d3-container">
        <svg xmlns="http://www.w3.org/2000/svg" @click="canvasClicked">
            <defs>
                <marker
                    id="endarrow"
                    refX="14"
                    refY="2"
                    orient="auto"
                    markerWidth="8"
                    markerHeight="8"
                    overflow="visible"
                >
                    <!-- This design the type of arrow
                    d - define the design of arrow
                    -->
                    <path d="M0,0V 4L6,2Z" style="fill: black"></path>
                </marker>
            </defs>
        </svg>
        <div class="tooltip card box-shadow no-select">{{ this.currentNode?.patent.title }}</div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Patent } from '@/models/Patent';
import {
    BaseType,
    D3DragEvent,
    D3ZoomEvent,
    drag,
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY,
    select,
    Selection,
    Simulation,
    SimulationLinkDatum,
    SimulationNodeDatum,
    zoom,
} from 'd3';

import { VisualPatentNode } from '@/models/VisualPatentNode';

type d3Event = { x: number; y: number; node: SimulationNodeDatum };
type d3ForceSim = Simulation<VisualPatentNode, SimulationLinkDatum<VisualPatentNode>>;
type d3Graph = { nodes: VisualPatentNode[]; links: SimulationLinkDatum<VisualPatentNode>[] };
type d3Selection = {
    graph: Selection<SVGGraphicsElement, unknown, HTMLElement, unknown>;
    svg: Selection<SVGElement, unknown, HTMLElement, unknown>;
    tooltip: Selection<HTMLElement, unknown, HTMLElement, unknown>;
};

export default defineComponent({
    name: 'ResultVisualization',
    props: {
        patents: {
            required: true,
            type: Array,
        },
        visualizationOptions: {
            required: true,
            type: Array,
        },
    },
    emits: {
        onPatentSelected: (e: { patent?: Patent; index: number }) => e,
    },
    data() {
        return {
            currentMove: null as d3Event | null,
            currentNode: null as VisualPatentNode | null,
            container: null as Selection<BaseType, unknown, HTMLElement, unknown> | null,
            nodeSelected: false,
            documentWidth: document.documentElement.clientWidth,
            documentHeight: document.documentElement.clientHeight,
            graph: {
                nodes: [],
                links: [],
            } as d3Graph,
            resizeEvent: -1,
            simulation: null as d3ForceSim | null,

            width: 0,
            height: 0,
            selections: {} as d3Selection,
            zoom: null as any,
            forceProperties: {
                center: {
                    x: 0.5,
                    y: 0.5,
                },
                charge: {
                    enabled: true,
                    strength: -700,
                    distanceMin: 10,
                    distanceMax: 2000,
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
                    distance: 300,
                    iterations: 1,
                },
            },
            dragActive: false,
            dragTimeoutHandler: -1,
        };
    },
    computed: {
        onClickSave(): boolean {
            return this.$store.state.onClickSave;
        },
        nodes(): VisualPatentNode[] {
            return this.graph.nodes;
        },
        links(): SimulationLinkDatum<VisualPatentNode>[] {
            return this.graph.links;
        },
    },
    created() {
        this.updateData();

        // adding the event listener for the resize event here
        window.addEventListener('resize', this.onResize);

        // You can set the component width and height in any way
        // you prefer. It's responsive! :)
        this.width = window.innerWidth - 10;
        this.height = window.innerHeight - 110;

        this.simulation = forceSimulation<VisualPatentNode>()
            .force('link', forceLink())
            .force('charge', forceManyBody())
            .force('collide', forceCollide())
            .force('center', forceCenter())
            .force('forceX', forceX())
            .force('forceY', forceY())
            // .force('center', forceCenter(this.width / 2, this.height / 2))
            .on('tick', this.tick);

        this.updateForces();
    },
    mounted() {
        this.$nextTick(() => {
            this.setupGraph();
            this.updateGraph();
        });
    },
    unmounted() {
        // unregistering the event listener for the resize event
        window.removeEventListener('resize', this.onResize);
    },
    watch: {
        /**
         * Watches the patents value and updates the graph
         */
        patents(): void {
            this.updateData();
            this.updateGraph();
        },
        visualizationOptions() {
            this.updateData();
            this.updateGraph();
        },
        dragActive(newVal): void {
            if (!newVal) {
                this.selections.tooltip.style('visibility', 'visible');
                return;
            }

            this.selections.tooltip.style('visibility', 'hidden');
        },
    },
    methods: {
        /**
         * Sets up the svg for the d3 simulation
         */
        setupGraph() {
            // Selecting the svg as the root for the d3 simulation
            this.container = select('.d3-container');
            this.selections.svg = select('svg');
            this.selections.tooltip = select('.tooltip');

            const svg = this.selections.svg;

            // Define the arrow marker
            svg.append('svg:defs')
                .selectAll('marker')
                .data(['end']) // Different link/path types can be defined here
                .enter()
                .append('svg:marker') // This section adds in the arrows
                .attr('id', String)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 43) // Prevents arrowhead from being covered by circle
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5');

            // Define arrow for self-links
            svg.append('svg:defs')
                .selectAll('marker')
                .data(['end-self'])
                .enter()
                .append('svg:marker') // This section adds in the arrows
                .attr('id', String)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 40)
                .attr('refY', -15)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 285)
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5');

            // Add zoom and panning triggers
            this.zoom = zoom<SVGSVGElement, unknown>()
                .scaleExtent([1 / 4, 4])
                .on('zoom', this.zoomed);
            svg.call(this.zoom);

            this.selections.graph = svg.append('g');
        },
        /**
         * Is called every frame the simulation is active
         */
        tick() {
            // If no data is passed to the Vue component, do nothing
            if (!this.patents) {
                return;
            }

            // eslint-disable-next-line
            const transform = (d: any) => {
                return 'translate(' + d.x + ',' + d.y + ')';
            };

            // eslint-disable-next-line
            const link = (d: any) => {
                // Self-link support
                if (d.source.index === d.target.index) {
                    return `M${d.source.x - 1},${d.source.y - 1}A30,30 -10,1,0 ${d.target.x + 1},${d.target.y + 1}`;
                } else {
                    return 'M' + d.source.x + ',' + d.source.y + ' L' + d.target.x + ',' + d.target.y;
                }
            };

            const graph = this.selections.graph;
            graph.selectAll('path').attr('d', link);
            graph.selectAll('circle').attr('transform', transform);
            graph.selectAll('text').attr('transform', transform);
        },
        /**
         * Updates the graph simulation
         */
        updateGraph() {
            this.simulation?.nodes(this.nodes);
            this.simulation?.force('link', forceLink(this.links as SimulationLinkDatum<VisualPatentNode>[]));

            const graph = this.selections.graph;

            // Links should only exit if not needed anymore
            graph.selectAll('path').data(this.graph.links).exit().remove();
            graph
                .selectAll<SVGPathElement, SimulationLinkDatum<VisualPatentNode>>('path')
                .data(this.graph.links)
                .enter()
                .append('path')
                // TODO: Create a type for extended link datum
                .attr('class', (d: any) => 'link ' + d.type);

            // Nodes should always be redrawn to avoid lines above them
            graph.selectAll('circle').remove();
            graph
                .selectAll<SVGSVGElement, VisualPatentNode>('circle')
                .data(this.graph.nodes)
                .enter()
                .append('circle')
                .attr('r', (d) => d.size)
                .attr('class', (d: VisualPatentNode) => d.type)
                .call(
                    drag<SVGCircleElement, VisualPatentNode>()
                        .on('start', this.nodeDragStarted)
                        .on('drag', this.dragged)
                        .on('end', this.drop),
                )
                .on('mouseover', this.nodeMouseOver)
                .on('mouseout', this.mouseOut)
                .on('click', this.nodeClick)
                .on('mousemove', this.mouseMove);

            // Add 'marker-end' attribute to each path
            const svg = select('svg');
            svg.selectAll('g')
                .selectAll('path')
                .attr('marker-end', (d: any) => {
                    // Caption items doesn't have source and target
                    if (d.source && d.target && d.source.index === d.target.index) return 'url(#end-self)';
                    else return 'url(#end)';
                });

            // Update caption every time data changes
            this.simulation?.alpha(1).restart();
        },

        /**
         * Updates the data for the simulation
         */
        updateData(): void {
            const patents = this.patents as Patent[];
            const citationMap = this.getCitationMap(patents);
            this.graph.nodes = this.getNodes(patents, citationMap);
            this.graph.links = this.getLinks(this.graph.nodes, citationMap);
        },

        /**
         * Processes the passed patents and returns them as nodes for D3 to display them.
         * A SimulationNodeDatum needs a unique identifier which we can provide by using the
         * unique patent id
         */
        getNodes(patents: Patent[], citationMap: { [id: string]: string[] }): VisualPatentNode[] {
            let nodes = patents.map((patent) => ({
                id: patent.id,
                patent,
                type: 'patent',
                color: 'rgb(168, 133, 41)',
                size: 18,
            })) as VisualPatentNode[];

            // If the user has selected to view authors
            if (this.visualizationOptions.includes('authors')) {
                const brown = 'rgb(168, 41, 41)';
                // TODO: When we have real authors we can add them here
                // For the moment we just add one extra node to each
                const authorNodes = patents.map(
                    (patent) =>
                        ({
                            id: `${patent.id}:author`, // Set the id to be the "parent" patent id + 'author'
                            patent, // Set the patent for tooltip viewing (this should change later)
                            type: 'author', // Set the type of the node to 'author'
                            color: brown, // Set the color to brown
                            size: 10, // We use a static size that is smaller than the patent size
                        } as VisualPatentNode),
                );
                nodes = [...nodes, ...authorNodes]; // Extend the nodes array with author nodes
            }

            // If the user has selected to view companies
            if (this.visualizationOptions.includes('companies')) {
                // TODO: When we have real companies we can add them here
                const blue = 'rgb(41, 115, 168)';
                const companyNodes = patents.map(
                    (patent) =>
                        ({
                            id: `${patent.id}:company`,
                            patent: patent, // Set the patent for tooltip viewing (this should change later)
                            type: 'company', // Set the type of the node to 'company'
                            color: blue, // Set the color to blue
                            size: 10, // Set the size to 10
                        } as VisualPatentNode),
                );
                nodes = [...nodes, ...companyNodes]; // Extend the nodes array with the company nodes
            }

            // If the user has selected to view citations
            if (this.visualizationOptions.includes('citations')) {
                const green = 'rgb(72, 121, 9)';
                const patentMap = this.buildMap(patents, 'id'); // Build a map of all patents, this should make finding them by ID faster.
                const citationNodes = Object.keys(citationMap) // Get the keys (citation ids) from the citationMap.
                    .filter((citationId) => !patentMap[citationId]) // Remove patent-node to patent-node citations (these nodes are already shown)
                    .filter((citationId) => citationMap[citationId].length > 1) // Only show citations that are cited by multiple patents (for clarity)
                    .map((citationId) => {
                        const citingPatents = citationMap[citationId]; // With the citations of this patent
                        const patentId = citingPatents[0]; // Select the first patentId arbitrarily (this should change later)
                        return {
                            id: citationId, // Set the Id to the citation Id (this is important so we can look up it's other links later)
                            patent: patentMap[patentId], // Set the "patent" to the "first" patent (this should change later)
                            type: 'citation', // Set the type to citation
                            color: green, // Set to color to green
                            size: citingPatents.length * 3 + 5, // Use dynamic sizing to show relative importance
                        } as VisualPatentNode;
                    });

                nodes = [...nodes, ...citationNodes]; // Extend the nodes array with the company nodes
            }

            return nodes;
        },

        /**
         * Create a key -> value map that allows for easy look up of something for given Id
         */
        buildMap<T>(items: T[], idKey: keyof T): { [id: string]: T } {
            return items.reduce((map, b) => {
                // Reduce the array to an object
                // eslint-disable-next-line
                const key = b[idKey] as any as string; // unclear if there is clean way to do this in typescript
                return { ...map, [key]: b }; // extend the object with a specific key
            }, {});
        },

        /**
         * Create a key -> value map that allows for easy look up of all patents that have cited a specific citation
         */
        getCitationMap(patents: Patent[]): { [id: string]: string[] } {
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
                    (citations, link) => ({
                        // Finally reduce the array to a map
                        ...citations, // extend the current citationMap...
                        [link.source]: [...(citations[link.source] ?? []), link.target], // with an extended version of the sourceId (citedPatentId) 's array
                    }),
                    {} as { [id: string]: string[] },
                );
        },

        /**
         * Processes the passed patents and finds relations between them.
         */
        getLinks(
            nodes: VisualPatentNode[],
            citationMap: { [id: string]: string[] },
        ): SimulationLinkDatum<VisualPatentNode>[] {
            const patentNodes = nodes.filter((t) => t.type === 'patent' && t.patent); // Start with just the 'initial' patent nodes
            const nodeMap = this.buildMap(patentNodes, 'id'); // Create a map for faster lookups

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
                            source: node, // Set the source to the current node (the citation)
                            target: nodeMap[t], // Set the target to the citing patent patent
                        })),
                    ],
                    [] as { source: VisualPatentNode; target: VisualPatentNode }[],
                );

            // Add other links between the patents and companies/authors
            const otherLinks = nodes
                .filter((t) => t.type !== 'patent' && t.type !== 'citation') // Patents & citations are handled separately
                .map((t) => ({
                    // Map the nodes to source and target (one link per node)
                    source: t, // The source is the author or company
                    target: nodeMap[t.patent.id], // The target is the patent
                })) as { source: VisualPatentNode; target: VisualPatentNode }[];

            // Combine all links together
            return [...interNodeCitations, ...citationLinks, ...otherLinks]
                .filter((t) => t.source && t.target) // Filter out any that have sources/targets that are either: null, 0, '', undefined, or false
                .map((t, index) => ({ ...t, index })); // Extend citations with an index that VueJS can use when enumerating them
        },

        /**
         * Function which triggers the updateGraph function after a specific delay is hit
         */
        onResize(): void {
            if (this.resizeEvent > -1) {
                clearTimeout(this.resizeEvent);
            }

            this.documentHeight = document.documentElement.clientHeight;
            this.documentWidth = document.documentElement.clientWidth;
            this.resizeEvent = setTimeout(this.updateGraph, 300);
        },

        /**
         * Emits an empty selection when the canvas only is selected
         */
        canvasClicked(): void {
            if (this.nodeSelected) {
                this.nodeSelected = false;
                return;
            }

            this.$emit('onPatentSelected', { index: -1 });
        },

        /**
         * Zoom handler for zooming the canvas
         * @param event
         */
        zoomed(event: D3ZoomEvent<SVGGraphicsElement, unknown>) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transform = event.transform as any;
            this.selections.graph.attr('transform', transform);

            // Define some world boundaries based on the graph total size
            // so we don't scroll indefinitely
            const graphBox = this.selections.graph.node()?.getBBox();

            if (graphBox) {
                const margin = 500;
                const worldTopLeft = [graphBox.x - margin, graphBox.y - margin];
                const worldBottomRight = [graphBox.x + graphBox.width + margin, graphBox.y + graphBox.height + margin];
                this.zoom.translateExtent([worldTopLeft, worldBottomRight]);
            }
        },

        /**
         * Drag started handler for a node
         * @param event
         * @param d
         */
        nodeDragStarted(event: D3DragEvent<SVGCircleElement, unknown, unknown>, d: VisualPatentNode) {
            this.selections.tooltip.style('visibility', 'hidden');

            if (event.active) {
                this.simulation?.alphaTarget(0.3).restart();
            }

            this.dragActive = true;

            d.fx = d.x;
            d.fy = d.y;
        },

        /**
         * Drag handler for a node
         * @param event
         * @param d
         */
        dragged(event: DragEvent, d: VisualPatentNode) {
            d.fx = event.x;
            d.fy = event.y;

            this.mouseMove(event);

            // restart the simulation for the tick function to be called again
            this.simulation?.alphaTarget(0.0001).restart();
        },

        /**
         * Drag-end handler for a node
         * @param event
         * @param d
         */
        drop(event: D3DragEvent<SVGCircleElement, unknown, unknown>, d: VisualPatentNode) {
            if (!event.active) {
                this.simulation?.alphaTarget(0.0001);
            }
            d.fx = null;
            d.fy = null;

            clearTimeout(this.dragTimeoutHandler);

            this.dragTimeoutHandler = setTimeout(() => {
                this.dragActive = false;
            }, 100);
        },

        /**
         * Called when the mouse is moved over a node
         * @param event
         * @param node
         */
        nodeMouseOver(event: MouseEvent, node: VisualPatentNode) {
            // set current node to the value of the hovered node
            this.currentNode = node;

            // get related items and highlight them on hovering
            const graph = this.selections.graph;
            const circle = graph.selectAll('circle');
            const path = graph.selectAll('path');

            const related: VisualPatentNode[] = [node];
            const relatedLinks = [];

            this.graph.links.forEach((link) => {
                if (link.source === node || link.target === node) {
                    relatedLinks.push(link);
                    if (related.indexOf(link.source as VisualPatentNode) === -1) {
                        related.push(link.source as VisualPatentNode);
                    }
                    if (related.indexOf(link.target as VisualPatentNode) === -1) {
                        related.push(link.target as VisualPatentNode);
                    }
                }
            });

            circle.classed('faded', true);
            circle.filter((df) => related.indexOf(df as VisualPatentNode) > -1).classed('highlight', true);
            path.classed('faded', true);
            path.filter((df: any) => df.source === node || df.target === node).classed('highlight', true);

            this.selections.tooltip.style('visibility', 'visible');
            this.mouseMove(event);

            // This ensures that tick is called so the node count is updated
            this.simulation?.alphaTarget(0.0001).restart();
        },

        /**
         * Event handler for the 'mousemove' event on a node. It will move the tooltip relative to the current mouse
         * position
         * @param e
         */
        mouseMove(e: MouseEvent): void {
            this.selections.tooltip
                .style('top', `${Math.max(0, e.pageY - 100)}px`)
                .style('left', `${Math.max(e.pageX - 200, 0)}px`);
        },

        /**
         * Event handler for the 'out' event on a node. It will hide the tooltip and reset the classes of the items
         * in the canvas
         */
        mouseOut() {
            // hide tooltip
            this.selections.tooltip.style('visibility', 'hidden');

            const graph = this.selections.graph;
            const circle = graph.selectAll('circle');
            const path = graph.selectAll('path');

            // reset classes for nodes and paths
            circle.classed('faded', false);
            circle.classed('highlight', false);
            path.classed('faded', false);
            path.classed('highlight', false);

            // This ensures that tick is called so the node count is updated
            this.simulation?.restart();
        },

        /**
         * Selects the clicked node
         * @param event
         * @param node
         */
        nodeClick(event: PointerEvent, node: VisualPatentNode) {
            this.selections.graph
                .selectAll('circle')
                .classed('selected', false)
                .filter((td) => td === node)
                .classed('selected', true);

            this.$emit('onPatentSelected', { patent: node.patent, index: node.index ?? -1 });

            // in order to prevent a canvas event to be triggered specify that a node is selected
            this.nodeSelected = true;
        },

        updateForces() {
            const { simulation, forceProperties, width, height } = this;

            simulation?.force(
                'center',
                forceCenter(width * forceProperties.center.x, height * forceProperties.center.y),
            );

            simulation?.force(
                'charge',
                forceManyBody()
                    .strength(forceProperties.charge.strength * (forceProperties.charge.enabled ? 1 : 0))
                    .distanceMin(forceProperties.charge.distanceMin)
                    .distanceMax(forceProperties.charge.distanceMax),
            );

            simulation?.force(
                'collide',
                forceCollide()
                    .strength(forceProperties.collide.strength * (forceProperties.charge.enabled ? 1 : 0))
                    .radius(forceProperties.collide.radius)
                    .iterations(forceProperties.collide.iterations),
            );

            simulation?.force(
                'forceX',
                forceX(width * forceProperties.forceX.x).strength(
                    forceProperties.forceX.strength * (forceProperties.charge.enabled ? 1 : 0),
                ),
            );

            simulation?.force(
                'forceY',
                forceY(height * forceProperties.forceY.y).strength(
                    forceProperties.forceY.strength * (forceProperties.forceY.enabled ? 1 : 0),
                ),
            );

            simulation?.force(
                'link',
                forceLink().distance(forceProperties.link.distance).iterations(forceProperties.link.iterations),
            );

            // updates ignored until this is run
            // restarts the simulation (important if simulation has already slowed down)
            simulation?.alpha(1).restart();
        },
    },
});
</script>

<style lang="scss">
.d3-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    svg {
        height: 100%;
        width: 100%;
    }
}

.tooltip {
    position: absolute;
    visibility: hidden;
    z-index: 1000;
    pointer-events: none;
    top: 0;
    left: 0;

    margin-bottom: 30px;
}

.faded {
    opacity: 0.6;
    transition: 0.3s opacity;
}

.highlight {
    opacity: 1;
}

path {
    stroke-width: 1.5px;
    stroke: #666;
}

path.link {
    fill: none;
    stroke-width: 1.5px;
    stroke: #666;
}

path.link.depends {
    stroke: #005900;
    stroke-dasharray: 5, 2;
}

path.link.needs {
    stroke: #7f3f00;
}

circle {
    fill: #ffff99;
    stroke: #191900;
    stroke-width: 1.5px;
}

circle.patent {
    fill: rgb(168, 133, 41);
    stroke: none;
    r: 16px;
}
circle.citation {
    fill: green;
    stroke: none;
}
circle.init {
    fill: #b2e8b2;
    stroke: #001900;
}

circle.selected {
    stroke: #ff6666ff !important;
    stroke-width: 3px;
    animation: selected 2s infinite alternate ease-in-out;
}

@keyframes selected {
    from {
        stroke-width: 5px;
        r: 16;
    }
    to {
        stroke-width: 1px;
        r: 22;
    }
}

text {
    font: 10px sans-serif;
    pointer-events: none;
    text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
}

rect.caption {
    fill: #ccccccac;
    stroke: #666;
    stroke-width: 1px;
}
text.caption {
    font-size: 14px;
    font-weight: bold;
}
</style>
