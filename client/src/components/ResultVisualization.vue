<template>
    <div class="d3-container">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            @mousemove="drag($event)"
            @mouseup="drop()"
            @wheel="zoomWithWheel($event)"
            @mousedown="canvasClicked"
        >
            <g class="nodes-container" id="testID">
                <!-- Create the line that connect the notes-->
                <line
                    v-for="link in graph.links"
                    :key="link.index"
                    :x1="link.source.x"
                    :y1="link.source.y"
                    :x2="link.target.x"
                    :y2="link.target.y"
                    stroke="black"
                    stroke-width="2"
                    marker-end="url(#endarrow)"
                />
                <!-- Create the nodes that represent the patent -->
                <circle
                    class=".node"
                    id="circle"
                    v-for="node in graph.nodes"
                    :key="node.id"
                    :cx="node.x"
                    :cy="node.y"
                    :r="node.size"
                    :fill="node.color"
                    @mousemove.capture="currentNode = node"
                    @click.capture="nodeClicked({ x: $event.screenX, y: $event.screenY, node: node })"
                />
            </g>
            <!-- define the arrow marker to position the arrow refx and refy was used -->
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
                    <!-- This design the type of arrow d - define the design of arrow-->
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
    SimulationLinkDatum,
    Simulation,
    SimulationNodeDatum,
    forceSimulation,
    forceCenter,
    forceLink,
    forceX,
    forceY,
    forceManyBody,
    forceCollide,
    select,
    selectAll,
    Selection,
    BaseType,
} from 'd3';

import { VisualPatentNode } from '@/models/VisualPatentNode';
import Panzoom from '@panzoom/panzoom';

type d3Event = { x: number; y: number; node: SimulationNodeDatum };
type d3ForceSim = Simulation<VisualPatentNode, SimulationLinkDatum<VisualPatentNode>>;
type d3Graph = { nodes: VisualPatentNode[]; links: SimulationLinkDatum<SimulationNodeDatum>[] };

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
            zoomLevel: 1,
            panzoomDefault: {
                cursor: 'default',
                maxScale: 6,
                minScale: 0.2,
                origin: '50% 50%',
            },
            panzoomZoomOptions: { animate: true, duration: 2000, easing: 'ease-in-out' },
        };
    },
    computed: {
        onClickSave(): boolean {
            return this.$store.state.onClickSave;
        },
        /**
         * Expose the state variables for zoom in/out
         */
        zoomIn(): boolean {
            return this.$store.state.zoomingIn;
        },
        zoomOut(): boolean {
            return this.$store.state.zoomingOut;
        },
    },
    created() {
        // adding the event listener for the resize event here
        window.addEventListener('resize', this.onResize);
    },
    mounted() {
        this.$nextTick(() => {
            this.updateGraph();
            this.setupGraph();
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
            this.updateGraph();
        },
        visualizationOptions() {
            this.updateGraph();
        },
        zoomIn(newVal): void {
            if (!newVal) {
                return;
            }
            this.zoomWithButton(newVal); //true => zoom-in
            this.$store.commit('BUTTON_ZOOM_IN_OFF');
        },
        zoomOut(newVal): void {
            if (!newVal) {
                return;
            }
            this.zoomWithButton(!newVal); // false => zoom-out
            this.$store.commit('BUTTON_ZOOM_OUT_OFF');
        },
    },
    methods: {
        /**
         * Calculates the zoom level.
         */
        calcZoom(zoomingIn: boolean): void {
            if (zoomingIn) {
                this.zoomLevel += 0.2;
                return;
            }
            this.zoomLevel < 0.4 ? (this.zoomLevel = 0) : (this.zoomLevel -= 0.2);
        },
        /**
         * Zooms in/out at button click. SVG centered.
         */
        zoomWithButton(zoomingIn: boolean): void {
            const elem = document.getElementById('testID') as HTMLElement;
            const panzoom = Panzoom(elem, this.panzoomDefault);
            panzoom.setOptions({ disablePan: true });

            this.calcZoom(zoomingIn); //checks whether we zoom in or out

            panzoom.zoom(this.zoomLevel, this.panzoomZoomOptions);
        },
        /**
         * Zooms in/out on mousewheel. Currently centers the svg instead of focusing on the location of the cursor
         */
        zoomWithWheel(event: WheelEvent): void {
            this.calcZoom(event.deltaY < 0);

            const elem = document.getElementById('testID') as HTMLElement;
            const panzoom = Panzoom(elem, this.panzoomDefault);

            panzoom.zoomToPoint(this.zoomLevel, event, this.panzoomZoomOptions);
        },
        setupGraph() {
            this.container = select('.d3-container');
            // Selecting the svg as the root for the d3 simulation
            const svg = select('svg');

            // Append a group for the nodes
            svg.append('g').attr('class', 'nodes-container');
        },
        /**
         * Updates the graph simulation
         */
        updateGraph() {
            const patents = this.patents as Patent[];
            const citationMap = this.getCitationMap(patents);
            this.graph.nodes = this.getNodes(patents, citationMap);
            this.graph.links = this.getLinks(this.graph.nodes, citationMap);

            this.simulation = forceSimulation<VisualPatentNode>(this.graph.nodes as VisualPatentNode[])
                // center the results
                .force('center', forceCenter(this.documentWidth / 2, this.documentHeight / 2))
                // adds the links
                .force('link', forceLink(this.graph.links).strength(0.1))
                // the x and y alignment of the nodes
                .force('x', forceX(this.documentWidth / 2).strength(0.1))
                .force('y', forceY(this.documentHeight / 2).strength(0.13))
                // set the attraction level between the nodes (default -30)
                .force('charge', forceManyBody().strength(-400))
                // avoid collision
                .force('collide', forceCollide().radius(26));

            // because the nodes are not available now we have to do the setup in the next tick
            this.$nextTick(() => {
                this.setupTooltip();
            });
        },

        /**
         * Handles the mouse down event on a node
         * @param e
         */
        drag(e: MouseEvent) {
            if (this.currentMove === null) {
                return;
            }

            this.currentMove.node.fx = e.clientX;
            this.currentMove.node.fy = e.clientY;
        },

        /**
         * Handler for when the mouse button is released.
         */
        drop() {
            if (this.currentMove == null) {
                return;
            }

            delete this.currentMove.node?.fx;
            delete this.currentMove.node?.fy;
            this.currentMove = null;

            if (this.simulation == null) {
                return;
            }

            this.simulation?.alpha(1);
            this.simulation?.restart();
        },

        /**
         * Emits the event onPatentSelected to the parent component
         * @param e
         */
        nodeClicked(e: { x: number; y: number; node: VisualPatentNode }) {
            this.currentMove = e;
            this.$emit('onPatentSelected', { patent: e.node.patent, index: e.node.index ?? -1 });

            // in order to prevent a canvas event to be triggered specify that a node is selected
            this.nodeSelected = true;
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
                        const citingPatents = citationMap[citationId]; // With the citations of the this patent
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

        /*
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
        ): SimulationLinkDatum<SimulationNodeDatum>[] {
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
         * Sets up the tooltip which shows info about the patent
         */
        setupTooltip(): void {
            if (!this.container) {
                return;
            }

            // Select the tooltip
            const tooltip = select('.tooltip');
            selectAll('circle')
                .on('mouseover', () => tooltip.style('visibility', 'visible'))
                .on('mousemove', (e) => {
                    tooltip
                        .style('top', `${Math.max(0, e.pageY - 100)}px`)
                        .style('left', `${Math.max(e.pageX - 200, 0)}px`);
                })
                .on('mouseout', () => tooltip.style('visibility', 'hidden'));
        },

        /**
         * Adds a zoom handler for the TODO: remove after review
         */
        // addZoomHandler(): void {
        //     console.log('in addZoomHandler');
        //     // TODO: Implement zoom functionality (currently this is buggy in combination with the click event)
        //     // select the g-tag from the element
        //     const group = select<SVGSVGElement, unknown>('g');
        //     console.log('group', group);
        //
        //     // add the zoom handler to the g-tag
        //     group.call(zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 20]).on('zoom', onZoom));
        //
        //     // eslint-disable-next-line
        //     function onZoom(event: any) {
        //         console.log('in onZoom');
        //         if (!event.sourceEvent.ctrlKey) {
        //             return;
        //         }
        //
        //         // group.selectAll('line').attr('transform', event.transform);
        //         group.attr('transform', event.transform);
        //         // group.selectAll('circle').attr('transform', event.transform);
        //         // group.attr('transform', event.transform);
        //     }
        // },

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
}
</style>
