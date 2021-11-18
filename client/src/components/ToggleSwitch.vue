<template>
    <div class="toggle__button" @click="toggle">
        <div class="toggle__switch" :style="style" :class="{ active: isActive }"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Toggle button which allows to specify a default state and a custom color
 *
 * @example: <ToggleSwitch :default-state="true" custom-color="#a88529"></ToggleSwitch>
 */
export default defineComponent({
    props: {
        defaultState: {
            type: Boolean,
            default: false,
        },
        customColor: {
            type: String,
            default: null,
        },
    },
    emits: ['onClicked'],
    methods: {
        /**
         * Toggles the buttons value
         */
        toggle(): void {
            this.isActive = !this.isActive;
            this.$emit('onClicked', this.isActive);
        },
    },
    data() {
        return {
            currentState: this.defaultState as boolean,
        };
    },
    computed: {
        isActive: {
            get() {
                return this.currentState;
            },
            set(newValue: boolean) {
                this.currentState = newValue;
            },
        },
        checkedValue: {
            get() {
                return this.currentState;
            },
            set(newValue: boolean) {
                this.currentState = newValue;
            },
        },
        /**
         * Sets the background to a custom value if one was specified
         */
        style() {
            if (this.isActive) {
                return `background: ${this.customColor ? this.customColor : 'black'};`;
            }

            return '';
        },
    },
    watch: {
        /**
         * Watches the current state value
         *
         * @param val   The new value
         */
        defaultState(val: boolean): void {
            this.currentState = val;
        },
    },
});
</script>

<style lang="scss" scoped>
.toggle__button {
    cursor: pointer;
    height: 24px;
    width: 48px;
    background: white;
    box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.25);
    border: 0.25px solid #d6d4d4;
    border-radius: 90px;
}

.toggle__switch {
    left: 0;
    position: relative;
    height: 100%;
    width: 60%;
    background: black;
    border-radius: 90px;
    transition: all 0.25s;
}

.active {
    left: calc(40%);
    background: wheat;
}
</style>
