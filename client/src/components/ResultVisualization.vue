<template>
    <div class="d3-container">
        <svg xmlns="http://www.w3.org/2000/svg" @mousemove="drag($event)" @mouseup="drop()">
            <g class="nodes-container">
                <line
                    v-for="link in graph.links"
                    :key="link.index"
                    :x1="link.source.x"
                    :y1="link.source.y"
                    :x2="link.target.x"
                    :y2="link.target.y"
                    stroke="grey"
                    stroke-width="2"
                />
                <circle
                    class=".node"
                    v-for="node in graph.nodes"
                    :key="node.index"
                    :cx="node.x"
                    :cy="node.y"
                    :r="26"
                    stroke="black"
                    stroke-width="1"
                    @mousemove="currentNode = node"
                    @mousedown="currentMove = { x: $event.screenX, y: $event.screenY, node: node }"
                />
            </g>
        </svg>
        <div class="tooltip card box-shadow">{{ this.currentNode?.patent['invention-title'] }}</div>
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
import { CitedPatent } from '@/models/CitedPatent';
import { PatentNode } from '@/models/PatentNode';

type d3Event = { x: number; y: number; node: SimulationNodeDatum };
type d3ForceSim = Simulation<PatentNode, SimulationLinkDatum<PatentNode>>;
type d3Graph = { nodes: PatentNode[]; links: SimulationLinkDatum<SimulationNodeDatum>[] };

export default defineComponent({
    name: 'ResultVisualization',
    props: {
        patents: {
            required: true,
            type: Array,
        },
    },
    data() {
        return {
            currentMove: null as d3Event | null,
            currentNode: null as PatentNode | null,
            container: null as Selection<BaseType, unknown, HTMLElement, unknown> | null,
            documentWidth: document.documentElement.clientWidth,
            documentHeight: document.documentElement.clientHeight,
            graph: {
                nodes: [],
                links: [],
            } as d3Graph,
            resizeEvent: -1,
            simulation: null as d3ForceSim | null,
        };
    },
    created() {
        // adding the event listener for the resize event here
        window.addEventListener('resize', this.onResize);
        this.updateGraph();
    },
    mounted() {
        this.$nextTick(() => {
            this.addZoomHandler();
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
    },
    methods: {
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
            this.graph.nodes = this.getPatentNodes();
            this.graph.links = this.getPatentLinks();

            this.simulation = forceSimulation<PatentNode>(this.graph.nodes as PatentNode[])
                // center the results
                .force('center', forceCenter(this.documentWidth / 2, this.documentHeight / 2))
                // adds the links
                .force('link', forceLink(this.graph.links).strength(0.01))
                // the x and y alignment of the nodes
                .force('x', forceX(this.documentWidth / 2).strength(0.1))
                .force('y', forceY(this.documentHeight / 2).strength(0.13))
                // set the attraction level between the nodes (default -30)
                .force('charge', forceManyBody().strength(-400))
                // avoid collision
                .force('collide', forceCollide().radius(40));

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
         * Processes the passed patents and returns them as nodes for D3 to display them.
         * A SimulationNodeDatum needs a unique identifier which we can provide by using the
         * unique patent_number
         */
        getPatentNodes(): PatentNode[] {
            return (this.patents as Patent[]).map((patent) => ({
                id: patent['@doc-number'],
                patent: patent,
            })) as PatentNode[];
        },

        /**
         * Processes the passed patents and finds relations between them.
         */
        getPatentLinks(): SimulationLinkDatum<SimulationNodeDatum>[] {
            return (
                (this.patents as Patent[])
                    // first we need to create an array, containing the relations
                    .reduce(
                        (relations, patent) =>
                            relations.concat(
                                patent.cited_patents.map((citedPatent: CitedPatent) => ({
                                    source: patent['@doc-number'],
                                    target: citedPatent.cited_patent_number,
                                })),
                            ),
                        [] as { source: string; target: string }[],
                    )
                    .map((relation, index) => ({
                        index,
                        source: this.graph.nodes[
                            (this.patents as Patent[]).findIndex((k) => k['@doc-number'] === relation.source)
                        ],
                        target: this.graph.nodes[
                            (this.patents as Patent[]).findIndex((k) => k['@doc-number'] === relation.target)
                        ],
                    }))
                    .filter((t: SimulationLinkDatum<SimulationNodeDatum>) => t.source && t.target)
            );
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
         * Adds a zoom handler for the
         */
        addZoomHandler(): void {
            // TODO: Implement zoom functionality (currently this is buggy in combination with the click event)
            // select the g-tag from the element
            // const group = select<SVGSVGElement, unknown>('g');
            //
            // // add the zoom handler to the g-tag
            // group.call(zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 20]).on('zoom', onZoom));
            //
            // // eslint-disable-next-line
            // function onZoom(event: any) {
            //     if (!event.sourceEvent.ctrlKey) {
            //         return;
            //     }
            //
            //     // group.selectAll('line').attr('transform', event.transform);
            //     group.attr('transform', event.transform);
            //     // group.selectAll('circle').attr('transform', event.transform);
            //     group.attr('transform', event.transform);
            // }
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
