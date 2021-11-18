<template>
    <!--  This div includes the settings button that disappears when clicked. Instead a menu appears for 5 seconds -->
    <RoundButton
        class="settingsBtn"
        icon-key="settings"
        type="light"
        @click="this.openMenu = !this.openMenu"
        :class="{ openMenu: openMenu }"
    />

    <!--  This div the menu container with nodes, togglers, and filters  -->
    <div
        class="main-container box-shadow card no-select"
        v-if="openMenu"
        v-vue-click-away="onClickAwayMenu"
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
                <label :for="`toggle-switch-${node.type}`">{{ getOptionName(node.type) }}</label>
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
import { directive } from 'vue3-click-away';

/**
 * Component which adds an options menu which can be opened by clicking on the options button
 */
export default defineComponent({
    name: 'OptionsMenu',
    components: { RoundButton, ToggleSwitch, Filters },
    directives: {
        VueClickAway: directive,
    },
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
        /**
         * Checks if a node type is turned on in the options menu
         *
         * @param type  The node type that should be checked
         */
        isOptionOn(type: string) {
            return this.$props.options.includes(type);
        },

        /**
         *  Hides the options menu once the mouse left the panel for 5 seconds
         *  - openMenu is set to false
         *  - timeout can be adjusted, if needed
         */
        timeOut(): void {
            this.timer = setTimeout(() => {
                this.openMenu = false;
            }, 5000);
        },

        /**
         *  Resets the timer once the mouse enters the panel again
         *  - timer var is reset
         *
         */
        resetTimer(): void {
            clearTimeout(this.timer);
        },

        /**
         *  Emits events to adjust (add or remove) the type of nodes available on the network graph. Accepts two params:
         *
         *  @param togglerState The state of toggle which is retrieved from ToggleSwitch
         *  @param nodeType The type of node , passed as a string (nodes[index].type), depending on the toggle clicked
         */
        onClicked(togglerState: boolean, nodeType: string): void {
            // if state of toggle is true, the node type is requested to be added. else, it's requested to be removed
            if (togglerState) {
                this.$emit('addNode', nodeType);
            } else {
                this.$emit('removeNode', nodeType);
            }
        },

        /**
         * Gets the name for the options menu from the type
         * @param type  The option-type for which to get the name
         */
        getOptionName(type: string): string {
            switch (type) {
                case 'authors':
                    return 'inventors';
                case 'companies':
                    return 'applicants';
                default:
                    return type;
            }
        },

        /**
         * On clicking away from option menu dialog the card is closing and the filters a clean
         */
        onClickAwayMenu(): void {
            this.$store.commit('CLOSE_CLEAN_FILTERS');
            this.openMenu = !this.openMenu;
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
.settingsBtn:hover {
    background: #d3d3d3;
    border-color: #d3d3d3;
}
.openMenu {
    display: none;
}
</style>
