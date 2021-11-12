<template>
    <!--  This div includes the settings button that disappears when clicked. Instead a menu appears for 5 seconds -->
    <RoundButton
        class="settingsBtn"
        icon-key="settings"
        type="light"
        v-show="openMenu === false"
        @click="openMenu = true"
    />

    <!--  This div the menu container with nodes, togglers, and filters  -->
    <div
        class="main-container box-shadow card no-select"
        v-show="openMenu === true"
        @mouseleave="timeOut()"
        @mouseenter="resetTimer()"
    >
        <!--  This is where the nodes can be activated and deactivated using togglers  -->
        <h4 class="labels">Selected data</h4>
        <div class="nodes-container">
            <div
                class="nodes-toggle-container"
                v-for="node in nodes"
                :key="node.type"
                @click="onClicked(!isOptionOn(node.type), node.type)"
            >
                <label :for="`toggle-switch-${node.type}`">{{ node.type }}</label>
                <div class="nodes-toggle">
                    <ToggleSwitch
                        :id="`toggle-switch-${node.type}`"
                        :default-state="isOptionOn(node.type)"
                        :custom-color="node.color"
                    ></ToggleSwitch>
                </div>
            </div>
        </div>

        <!--  Filters  -->
        <h4 class="labels">Filters</h4>
        <div class="filters-container">
            <Filters
                :filters="$props.filters"
                v-on:add-filter="$emit('addFilter', $event)"
                v-on:remove-filter="$emit('removeFilter', $event)"
                v-on:update-filter="$emit('updateFilter', $event)"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import ToggleSwitch from '../components/ToggleSwitch.vue';
import Filters from '../components/Filters.vue';

export default defineComponent({
    name: 'OptionsMenu',
    components: { RoundButton, ToggleSwitch, Filters },
    data() {
        return {
            openMenu: false,
            timer: 0,
            nodes: [
                { type: 'patents', color: '#A88529' },
                { type: 'families', color: '#896978' },
                { type: 'authors', color: '#A82929' },
                { type: 'companies', color: '#2973A8' },
                { type: 'citations', color: '#487909' },
            ],
        };
    },
    props: {
        options: {
            type: Array,
            required: true,
        },

        filters: {
            type: Array,
            required: true,
        },
    },
    emits: ['addNode', 'removeNode', 'updateFilter', 'removeFilter', 'addFilter'],
    methods: {
        isOptionOn(type: string) {
            return this.$props.options.includes(type);
        },
        /**
         *  @function to hide the options menu once the mouse left the panel for 5 seconds
         * - openMenu is set to false
         * - timeout can be adjusted, if needed
         */
        timeOut(): void {
            this.timer = setTimeout(() => (this.openMenu = !this.openMenu), 5000);
        },
        /**
         *  @function to reset the timer once the mouse enters the panel again
         * - timer var is reset
         *
         */
        resetTimer(): void {
            clearTimeout(this.timer);
        },
        /**
         *  @function emits events to adjust (add or remove) the type of nodes available on the network graph. Accepts two params:
         *  - @param {boolean} togglerState -  state of toggle which is retrieved from ToggleSwitch
         * -  @param {string} nodeType - type of node , passed as a string (nodes[index].type), depending on the toggle clicked
         * - if state of toggle is true, the node type is requested to be added. else, it's requested to be removed
         */
        onClicked(togglerState: boolean, nodeType: string): void {
            if (togglerState) {
                this.$emit('addNode', nodeType);
            } else {
                this.$emit('removeNode', nodeType);
            }
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/colors.scss';

.settingsBtn {
    float: left;
    background-color: white;
    font-size: 30px;
}
.main-container {
    width: 430px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    transition: 0.5s;
    margin-left: 0;
}

.nodes-container {
    display: inline-block;
}

.labels {
    padding-top: 3px;
    padding-left: 5px;
    text-align: start;
}
.nodes-toggle-container {
    height: 41px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    cursor: pointer;
}
.nodes-toggle-container:first-child {
    margin-top: 16px;
}
.nodes-toggle-container:last-child {
    margin-bottom: 16px;
}

.nodes-toggle-container.highlight {
    background-color: #eee;
    border-radius: 1em;
}

.nodes-toggle {
    display: flex;
    width: 50%;
    justify-content: flex-end;
}
</style>
