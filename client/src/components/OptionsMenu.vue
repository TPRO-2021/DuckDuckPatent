<template>
    <!--  This div includes the settings button that disappears when clicked. Instead a menu appears for 5 seconds -->
    <RoundButton
        class="settingsBtn"
        icon-key="settings"
        type="light"
        v-show="openMenu === false"
        @click="
            openMenu = true;
            timeOut();
        "
    />

    <!--  This div the menu container with nodes, togglers, and filters  -->
    <div class="main-container" v-show="openMenu === true">
        <!--  This is where the nodes can be activated and deactivated using togglers  -->
        <h4 class="labels">Selected data</h4>
        <div class="nodes-container">
            <div class='nodes-labels'>
                <p>patents</p>
                <p>authors</p>
                <p>companies</p>
                <p>citations</p>
            </div>
            <div class="nodes-togglers">
                <ToggleSwitch :default-state="true" custom-color="#a88529" ></ToggleSwitch>
                <ToggleSwitch :default-state="false" custom-color="#A82929" ></ToggleSwitch>
                <ToggleSwitch :default-state="false" custom-color="#2973A8" ></ToggleSwitch>
                <ToggleSwitch :default-state="false" custom-color="#487909" ></ToggleSwitch>
            </div>
        </div>

        <!--  TODO: This is where filters for narrowing down the results will be placed  -->
        <h4 class="labels">Filters</h4>
        <div class="filters-container"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import ToggleSwitch from '../components/ToggleSwitch.vue';

export default defineComponent({
    name: 'Search',
    components: { RoundButton, ToggleSwitch },
    data() {
        return {
            openMenu: false,
        };
    },
    methods: {
        /**
         *  @function to hide the options menu after 5 seconds
         * - openMenu is set to false
         * - timeout can be adjusted, if needed
         */
        timeOut: function () {
            setTimeout(() => (this.openMenu = !this.openMenu), 5000);
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
    width: 240px;
    border-radius: 5px;
    padding: 10px 20px;
    display: flex;
    justify-content: start;
    flex-direction: column;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    transition: 0.5s;
    background-color: white;
}

.nodes-container {
    display: flex;
    flex-direction: row;
    justify-content: start;
    margin: 8px;
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
    margin: 7px 0;
}
</style>
