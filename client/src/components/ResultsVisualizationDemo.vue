<template>
    <svg xmlns="http://www.w3.org/2000/svg" @mousemove="drag($event)" @mouseup="drop()">
        <line
            v-for="link in graph.links"
            :key="link.index"
            :x1="coords[link.source.index].x"
            :y1="coords[link.source.index].y"
            :x2="coords[link.target.index].x"
            :y2="coords[link.target.index].y"
            stroke="grey"
            stroke-width="2"
        />
        <circle
            v-for="(node, i) in graph.nodes"
            :key="node.index"
            :cx="coords[i].x"
            :cy="coords[i].y"
            :r="20"
            stroke="black"
            stroke-width="1"
            @mousedown="currentMove = { x: $event.screenX, y: $event.screenY, node: node }"
        />
    </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as d3 from 'd3';
import { Patent } from '@/models/Patent';
import { SimulationLinkDatum, Simulation, SimulationNodeDatum } from 'd3';
import { CitedPatent } from '@/models/CitedPatent';
import { PatentNode } from '@/models/PatentNode';

type d3Event = { x: number; y: number; node: PatentNode };
type d3ForceSim = Simulation<SimulationNodeDatum, SimulationLinkDatum<SimulationNodeDatum>>;
type d3Graph = { nodes: SimulationNodeDatum[]; links: SimulationLinkDatum<SimulationNodeDatum>[] };

export default defineComponent({
    name: 'ResultsVisualizationDemo',
    props: {
        padding: {
            default: 1,
            type: Number,
        },
        patents: {
            required: true,
            type: Array,
        },
    },
    data() {
        return {
            graph: {
                nodes: [],
                links: [],
            } as d3Graph,
            simulation: null as d3ForceSim | null,
            currentMove: null as d3Event | null,
            resizeEvent: -1,
            documentWidth: document.documentElement.clientWidth,
            documentHeight: document.documentElement.clientHeight,
        };
    },
    created() {
        // adding the event listener for the resize event here
        window.addEventListener('resize', this.onResize);
        this.updateGraph();
    },
    unmounted() {
        // unregistering the event listener for the resize event
        window.removeEventListener('resize', this.onResize);
    },
    computed: {
        /**
         * Computed property which specifies the bounds of the d3 playground based on the available size
         */
        bounds(): { minX: number; maxX: number; minY: number; maxY: number } {
            return {
                minX: 0,
                maxX: this.documentWidth,
                minY: 0,
                maxY: this.documentHeight,
            };
        },
        coords() {
            // Typescript has funny ideas about how encapsulation works in JavaScript
            const graph = this.graph as d3Graph;
            const bounds = this.bounds;
            const padding = this.$props.padding;
            const width = document.documentElement.clientWidth;
            const height = document.documentElement.clientHeight;

            return graph.nodes.map((node) => {
                return {
                    x: padding + (((node.x || 0) - bounds.minX) * (width - 2 * padding)) / (bounds.maxX - bounds.minX),
                    y: padding + (((node.y || 0) - bounds.minY) * (height - 2 * padding)) / (bounds.maxY - bounds.minY),
                };
            });
        },
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
        /**
         * Updates the graph simulation
         */
        updateGraph() {
            this.graph.nodes = this.getPatentNodes();
            this.graph.links = this.getPatentLinks();

            this.simulation = d3
                .forceSimulation(this.graph.nodes)
                // center the results
                .force('center', d3.forceCenter(this.documentWidth / 2, this.documentHeight / 2))
                // adds the links
                .force('link', d3.forceLink(this.graph.links).strength(0.01))
                // set the attraction level between the nodes (default -30)
                .force('charge', d3.forceManyBody().strength(-10));
        },
        drag(e: { screenX: number; screenY: number }) {
            if (this.currentMove === null) {
                return;
            }

            this.currentMove.node.fx =
                (this.currentMove.node.x || 0) -
                ((this.currentMove.x - e.screenX) * (this.bounds.maxX - this.bounds.minX)) /
                    (document.documentElement.clientWidth - 2 * this.$props.padding);
            this.currentMove.node.fy =
                (this.currentMove.node.y || 0) -
                ((this.currentMove.y - e.screenY) * (this.bounds.maxY - this.bounds.minY)) /
                    (document.documentElement.clientHeight - 2 * this.$props.padding);
            this.currentMove.x = e.screenX;
            this.currentMove.y = e.screenY;
        },
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
        getPatentNodes(): SimulationNodeDatum[] {
            return (this.patents as Patent[]).map((patent) => ({
                id: patent.patent_number,
                patent: patent,
            })) as SimulationNodeDatum[];
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
                                    source: patent.patent_number,
                                    target: citedPatent.cited_patent_number,
                                })),
                            ),
                        [] as { source: string; target: string }[],
                    )
                    .map((relation, index) => ({
                        index,
                        source: this.graph.nodes[
                            (this.patents as Patent[]).findIndex((k) => k.patent_number === relation.source)
                        ],
                        target: this.graph.nodes[
                            (this.patents as Patent[]).findIndex((k) => k.patent_number === relation.target)
                        ],
                    }))
                    .filter((t: SimulationLinkDatum<SimulationNodeDatum>) => t.source != null && t.target != null)
            );
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
            this.resizeEvent = setTimeout(this.updateGraph, 200);
        },
    },
});
</script>
