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
                <pattern id="markOnce" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <image
                        xlink:href="../assets/singleTick.svg"
                        style="fill-opacity: 0.5"
                        stroke="black"
                        x="-4"
                        y="-4"
                    ></image>
                </pattern>
                <pattern id="markTwice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <image
                        xlink:href="../assets/doubleTick.svg"
                        style="fill-opacity: 0.5"
                        stroke="black"
                        x="-6"
                        y="-4"
                    ></image>
                </pattern>
            </defs>
        </svg>
        <div class="tooltip card box-shadow no-select">{{ tooltipOnNodes }}</div>
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
import VisualizationHelperService from '@/services/visualization-helper.service';
import { VisualPatentLink } from '@/models/VisualPatentLink';
import { RelationMap } from '@/models/RelationMap';

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            zoom: null as any,
            forceProperties: VisualizationHelperService.getVisualizationOptions(),
            dragActive: false,
            selectedNode: null as VisualPatentNode | null,
        };
    },
    computed: {
        /**
         * Tooltip on patent, author and company nodes
         * When the results from DB is empty a tooltip with no data is displayed
         */
        tooltipOnNodes(): string | undefined {
            switch (this.currentNode?.type) {
                case 'patent':
                    return this.currentNode?.patent.title;
                case 'author':
                    return this.currentNode?.id;
                case 'company':
                    return this.currentNode?.id;
            }
            return 'No Data';
        },
        onClickSave(): boolean {
            return this.$store.state.onClickSave;
        },
        nodes(): VisualPatentNode[] {
            return this.graph.nodes;
        },
        links(): SimulationLinkDatum<VisualPatentNode>[] {
            return this.graph.links;
        },
        highlightNode(): boolean {
            return this.$store.state.highlightNode;
        },
    },
    watch: {
        /**
         * Watches the patents value and updates the graph
         */
        patents(): void {
            this.updateData();
            this.updateGraph();
        },
        /**
         * Once the visualization options change the simulation needs to be updated
         */
        visualizationOptions() {
            this.updateData();
            this.updateGraph();
        },
        /**
         * If drag is active the tooltip needs to be hidden, otherwise it will be buggy
         * @param newVal
         */
        dragActive(newVal): void {
            if (!newVal) {
                this.selections.tooltip.style('visibility', 'visible');
                return;
            }

            this.selections.tooltip.style('visibility', 'hidden');
        },

        /**
         * Call highlight once previewing node's card is true
         */
        highlightNode(newVal) {
            if (newVal) {
                this.highlightAndMarkNodes();
            }
        },
    },
    created() {
        // update the sent data
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
    methods: {
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
                .attr('refX', 13.5) // Prevents arrowhead from being covered by circle
                .attr('refY', 2)
                .attr('markerWidth', 8)
                .attr('markerHeight', 8)
                .attr('orient', 'auto')
                .attr('overflow', 'visible')
                .append('svg:path')
                .attr('d', 'M0,0V 4L6,2Z')
                .attr('style', 'fill: black');

            // Add zoom and panning triggers
            this.zoom = zoom<SVGSVGElement, unknown>()
                .scaleExtent([1 / 4, 4])
                .on('zoom', this.zoomed);
            svg.call(this.zoom);

            // append the g tag
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

            const link = (d: VisualPatentLink<VisualPatentNode>) => {
                return 'M' + d.source.x + ',' + d.source.y + ' L' + d.target.x + ',' + d.target.y;
            };

            const graph = this.selections.graph;
            graph.selectAll<SVGPathElement, VisualPatentLink<VisualPatentNode>>('path').attr('d', link);
            graph.selectAll<SVGCircleElement, VisualPatentNode>('circle').attr('transform', (d: VisualPatentNode) => {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
            this.updateMarks();
        },

        /**
         * Updates the graph simulation
         */
        updateGraph(alpha = 0.6) {
            this.simulation?.nodes(this.nodes);
            this.simulation?.force('link', forceLink(this.links as SimulationLinkDatum<VisualPatentNode>[]));

            const graph = this.selections.graph;

            // Links should only exit if not needed anymore
            graph.selectAll('path').data(this.graph.links).exit().remove();
            graph
                .selectAll<SVGPathElement, VisualPatentLink<VisualPatentNode>>('path')
                .data(this.graph.links)
                .enter()
                .append('path')
                .attr('class', (d) => 'link ' + (d as VisualPatentLink<VisualPatentNode>).type);

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
                        .on('start', this.dragStart)
                        .on('drag', this.dragged)
                        .on('end', this.drop),
                )
                .on('mouseover', this.mouseOver)
                .on('mouseout', this.mouseOut)
                .on('click', this.nodeClick)
                .on('mousemove', this.mouseMove);

            // Add 'marker-end' attribute to each path
            const svg = select('svg');
            svg.selectAll('g')
                .selectAll<SVGPathElement, VisualPatentLink<VisualPatentNode>>('path')
                .attr('marker-end', (d) => {
                    // Caption items doesn't have source and target
                    if (d.source && d.target && d.source.index === d.target.index) return 'url(#end-self)';
                    else return 'url(#end)';
                });

            // Update caption every time data changes
            this.simulation?.alpha(alpha).restart();
        },

        /**
         * Updates the data for the simulation
         */
        updateData(): void {
            const patents = this.patents as Patent[];
            const citationMap = VisualizationHelperService.getCitationMap(patents);
            const familyMap = VisualizationHelperService.getFamilyMap(patents);

            let authorsMap = {} as RelationMap;
            if (this.visualizationOptions.includes('authors')) {
                authorsMap = VisualizationHelperService.getCreatorMap(patents, 'inventors');
            }

            let companyMap = {} as RelationMap;
            if (this.visualizationOptions.includes('companies')) {
                companyMap = VisualizationHelperService.getCreatorMap(patents, 'applicants');
            }

            const nextNodes = VisualizationHelperService.getNodes(
                patents,
                citationMap,
                familyMap,
                this.visualizationOptions as string[],
                this.selectedNode,
                authorsMap,
                companyMap,
            );
            const newNodes = nextNodes.filter((t) => !this.graph.nodes.some((k) => k.id === t.id));
            this.graph.nodes = this.graph.nodes.filter((t) => nextNodes.some((k) => k.id === t.id)).concat(newNodes);

            this.graph.links = VisualizationHelperService.getLinks(
                this.graph.nodes,
                citationMap,
                familyMap,
                authorsMap,
                companyMap,
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
            this.selectedNode = null;
            this.updateData();
            this.updateGraph(0.01);
            this.$emit('onPatentSelected', { index: -1 });
            //turn highlight of node border off
            this.$store.commit('HIGHLIGHT_NODE_OFF');
            this.selections.graph.selectAll('circle').classed('selected', false);
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
        dragStart(event: D3DragEvent<SVGCircleElement, unknown, unknown>, d: VisualPatentNode) {
            this.selections.tooltip.style('visibility', 'hidden');

            if (event.active) {
                this.simulation?.alphaTarget(0.3).restart();
            }

            this.dragActive = true;

            d.fx = d.x;
            d.fy = d.y;

            this.nodeClick({} as PointerEvent, d);
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
            this.simulation?.alphaTarget(0.01).restart();
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
        },

        /**
         * Called when the mouse is moved over a node
         * @param event
         * @param node
         */
        mouseOver(event: MouseEvent, node: VisualPatentNode) {
            // set current node to the value of the hovered node
            this.currentNode = node;

            // get related items and highlight them on hovering
            const graph = this.selections.graph;
            const circle = graph.selectAll('circle');
            const path = graph.selectAll<SVGPathElement, VisualPatentLink<VisualPatentNode>>('path');

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
            path.classed('faded-link', true);
            path.filter((df) => df.source === node || df.target === node).classed('highlight', true);

            this.selections.tooltip.style('visibility', 'visible');
            this.mouseMove(event);

            // This ensures that tick is called so the node count is updated
            this.simulation?.alphaTarget(0.001).restart();
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
            path.classed('faded-link', false);
            path.classed('highlight', false);

            this.nodeSelected = false;
            this.simulation?.restart();
        },

        /**
         * Selects the clicked node
         * @param event
         * @param node
         */
        nodeClick(event: PointerEvent, node: VisualPatentNode) {
            if (node.type === 'patent') {
                this.$emit('onPatentSelected', { patent: node.patent, index: node.index ?? -1 });
            } else {
                this.$emit('onPatentSelected', { index: -1 });
            }

            // in order to prevent a canvas event to be triggered specify that a node is selected
            this.selectedNode = node;
            this.nodeSelected = true;
            this.$store.commit('HIGHLIGHT_NODE_OFF');
            this.updateData();
            this.updateGraph(0.01);

            this.selections.graph
                .selectAll('circle')
                .classed('selected', false)
                .filter((td) => td === node)
                //highlight border
                .classed('selected', true);

            // turn highlight on node on. Timeout so to have the component react to state change
            // highlight node also set the mark once on
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', { pID: node.patent.id, twice: false });
            });
        },

        /**
         * Updates the forces based on the config
         */
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
            simulation?.alpha(2).restart();
        },

        /**
         * Highlights border color of a node, once node or preview cards are viewed.
         * Node is marked once when the small preview card is displayed.
         * It's marked twice when the extended panel is accessed on results or saved pages.
         *
         */
        highlightAndMarkNodes(): void {
            // reset highlight
            if (!this.selections.graph) {
                return;
            }
            this.selections.graph.selectAll('circle').classed('selected', false);

            // find patentIndex
            const patentID = this.$store.state.patentID as string;
            const patentIndex = (this.patents as Patent[]).findIndex((e) => e.id === patentID);

            // if patent index not found, no highlight/mark
            if (patentIndex < 0) return;

            //find node and highlight it
            const target = this.selections.graph
                .selectAll('circle')
                .filter(function (d, i) {
                    return i === patentIndex;
                })
                .classed('selected', true);

            this.$store.state.markTwice ? target.classed('markedTwice', true) : target.classed('markedOnce', true);
        },

        /**
         * Once the visualization changes, the marks need to be set again
         *
         */
        updateMarks(): void {
            // set marks for viewed once
            if (!this.selections.graph) {
                return;
            }
            const markedOnce = this.$store.state.markedOnce;

            markedOnce.forEach((element: string) => {
                //find node and highlight it
                const nodeIndex = (this.patents as Patent[]).findIndex((e) => e.id === element);
                // if patent index not found, no highlight/mark
                if (nodeIndex < 0) return;

                this.selections.graph
                    .selectAll('circle')
                    .filter(function (d, i) {
                        return i === nodeIndex;
                    })
                    // add a mark to indicate it has been viewed
                    .classed('markedOnce', true);
            });

            //set marks for viewed twice
            const markedTwice = this.$store.state.markedTwice;

            markedTwice.forEach((element: string) => {
                //find node and highlight it
                const nodeIndex = (this.patents as Patent[]).findIndex((e) => e.id === element);
                // if patent index not found, no highlight/mark
                if (nodeIndex < 0) return;
                this.selections.graph
                    .selectAll('circle')
                    .filter(function (d, i) {
                        return i === nodeIndex;
                    })
                    //remove the old mark if any
                    .classed('markedOnce', false)
                    // add a mark to indicate it has been viewed
                    .classed('markedTwice', true);
            });
        },
    },
});
</script>

<style lang="scss">
@import '../styles/colors';

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

.faded-link,
.faded {
    opacity: 0.6;
    transition: 0.3s opacity;
}

.faded-link {
    opacity: 0.1 !important;
}

.highlight {
    opacity: 1 !important;
}

path.link {
    fill: none;
    stroke-width: 2px;
    stroke: black;
}

circle {
    fill: black;
    stroke: #191900;
    stroke-width: 1.5px;
}

circle.patent {
    fill: $brown;
    stroke: none;
}

circle.citation {
    fill: $green;
    stroke: none;
}

circle.family {
    fill: $yellow;
    stroke: none;
}

circle.author {
    fill: $red;
    stroke: none;
}

circle.company {
    fill: $blue;
    stroke: none;
}

circle.selected {
    stroke: #0048ba !important;
    stroke-width: 6px !important;
    animation: selected 2s infinite alternate ease-in-out;
}

circle.markedOnce {
    fill: url(#markOnce) #cccccc;
    stroke: rgb(168, 133, 41);
    stroke-width: 6px;
}

circle.markedTwice {
    fill: url(#markTwice);
    stroke: rgb(168, 133, 41);
    stroke-width: 6px;
}
</style>
