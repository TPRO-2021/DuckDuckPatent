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
            <div class="nodes-labels">
                <p v-for="node in nodes" :key="node.type">{{ node.type }}</p>
            </div>
            <div class="nodes-togglers">
                <ToggleSwitch
                    :default-state="isPatentsOn"
                    custom-color="#a88529"
                    v-on:on-clicked="onClicked($event, nodes[0].type)"
                ></ToggleSwitch>
                <ToggleSwitch
                    :default-state="isAuthorsOn"
                    custom-color="#A82929"
                    v-on:on-clicked="onClicked($event, nodes[1].type)"
                ></ToggleSwitch>
                <ToggleSwitch
                    :default-state="isCompaniesOn"
                    custom-color="#2973A8"
                    v-on:on-clicked="onClicked($event, nodes[2].type)"
                ></ToggleSwitch>
                <ToggleSwitch
                    :default-state="isCitationsOn"
                    custom-color="#487909"
                    v-on:on-clicked="onClicked($event, nodes[3].type)"
                ></ToggleSwitch>
            </div>
        </div>

        <!--  TODO: This is where filters for narrowing down the results will be placed  -->
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
            nodes: [{ type: 'patents' }, { type: 'authors' }, { type: 'companies' }, { type: 'citations' }],
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
    computed: {
        isPatentsOn(): boolean {
            return this.$props.options.includes('patents');
        },
        isAuthorsOn(): boolean {
            return this.$props.options.includes('authors');
        },
        isCompaniesOn(): boolean {
            return this.$props.options.includes('companies');
        },
        isCitationsOn(): boolean {
            return this.$props.options.includes('citations');
        },
    },
    methods: {
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
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
}

.labels {
    text-align: start;
}
.nodes-labels {
    width: 50%;
    align-items: flex-start;
    text-align: start;
}
.nodes-togglers {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
}
p {
    margin: 16px 0;
}
</style>
