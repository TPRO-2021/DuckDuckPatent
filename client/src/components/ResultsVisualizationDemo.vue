<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        :width="width + 'px'"
        :height="height + 'px'"
        @mousemove="drag($event)"
        @mouseup="drop()"
    >
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
import { SimulationNodeDatum, SimulationLinkDatum, Simulation } from 'd3';

type d3Event = { x: number; y: number; node: SimulationNodeDatum };
type forceSim = Simulation<SimulationNodeDatum, SimulationLinkDatum<SimulationNodeDatum>>;
type d3Graph = { nodes: SimulationNodeDatum[]; links: SimulationLinkDatum<SimulationNodeDatum>[]; };

export default defineComponent({
    name: 'ResultsVisualizationDemo',
    props: {
        width: { default: 1000, type: Number },
        height: { default: 500, type: Number },
        padding: { default: 100, type: Number },
        patents: { required: true, type: Array },
    },
    data() {
        return {
            graph: {
                nodes: [],
                links: [],
            } as d3Graph,
            simulation: null as forceSim | null,
            currentMove: null as d3Event | null,
        };
    },
    created() { 
        this.updateGraph();
    },
    computed: {
        bounds() {
            return { minX: 0, maxX: this.$props.width, minY: 0, maxY: this.$props.height };
        },
        coords() {
            // Typescript has funny ideas about how encapsulation works in JavaScript
            const graph = this.graph as d3Graph;
            const bounds = this.bounds as { minX: number; maxX: number; minY: number; maxY: number };
            const padding = this.$props.padding;
            const width = this.$props.width;
            const height = this.$props.height;

            return graph.nodes.map((node) => {
                return {
                    x:
                        padding +
                        (((node.x || 0) - bounds.minX) * (width - 2 * padding)) / (bounds.maxX - bounds.minX),
                    y:
                        padding +
                        (((node.y || 0) - bounds.minY) * (height - 2 * padding)) / (bounds.maxY - bounds.minY),
                };
            });
        },
    },
    watch: {
        patents(val, oldVal) { this.updateGraph(); }
    },
    methods: {
        updateGraph() {
            const patents = this.$props.patents as Patent[];
            this.graph.nodes = patents.map((t, index) => ({ index, x: 100, y: 500 })) as SimulationNodeDatum[];
            this.graph.links = patents
                .reduce((a, b) => a.concat(b.citations.map((t: string) => ({ from: b.id, to: t}))), [] as { from: string, to: string }[])
                .map((t, index) => ({ 
                    index, 
                    source: this.graph.nodes[patents.findIndex((k) => k.id === t.from)], 
                    target: this.graph.nodes[patents.findIndex((k) => k.id === t.to)], 
                }))
                .filter((t: SimulationLinkDatum<SimulationNodeDatum>) => t.source != null && t.target != null)

            this.simulation = d3
                .forceSimulation<SimulationNodeDatum>(this.graph.nodes)
                .force("link", d3.forceLink(this.graph.links).strength(0.01))
                .force("charge", d3.forceManyBody().strength(-30))
                .force("center", d3.forceCenter(this.$props.width / 2, this.$props.height / 2));
        },
        drag(e: { screenX: number; screenY: number }) {
            if (this.currentMove == null) { return; }

            this.currentMove.node.fx =
                this.currentMove.node.x! -
                ((this.currentMove.x! - e.screenX) * (this.bounds.maxX - this.bounds.minX)) /
                    (this.$props.width - 2 * this.$props.padding);
            this.currentMove.node.fy =
                this.currentMove.node.y! -
                ((this.currentMove.y! - e.screenY) * (this.bounds.maxY - this.bounds.minY)) /
                    (this.$props.height - 2 * this.$props.padding);
            this.currentMove!.x = e.screenX;
            this.currentMove!.y = e.screenY;
        },
        drop() {
            if (this.currentMove == null) { return; }

            delete this.currentMove.node!.fx;
            delete this.currentMove.node!.fy;
            this.currentMove = null;

            if (this.simulation == null) { return; }
            this.simulation!.alpha(1);
            this.simulation!.restart();
        },
    },
});
</script>
