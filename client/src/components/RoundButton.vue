<template>
    <button
        type="button"
        class="roundButton box-shadow"
        @click="onClick"
        :class="{ 'button-active': isToggle && isClicked, 'button-light': !isToggle && type === 'light' }"
    >
        <span class="btn-icon material-icons">{{ this.iconKey }}</span>
    </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Round button which can contain an icon.
 * - Can be turned into a toggle button by specifying "is-toggle" on the component
 * - The color of the button can be changed by specifying the type (light or dark) this is only available when isToggle==false
 */
export default defineComponent({
    props: {
        isToggle: {
            type: Boolean,
            default: false,
        },
        iconKey: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: 'dark',
        },
    },
    emits: ['onClicked'],
    data() {
        return {
            isClicked: false,
        };
    },
    methods: {
        /**
         * Click handler which emits the 'onClicked' event to the parent.
         * If the isToggle property is set it will contain the current state of the button
         * */
        onClick(): void {
            if (this.isToggle) {
                this.isClicked = !this.isClicked;
                this.$emit('onClicked', this.isClicked);
                return;
            }

            this.$emit('onClicked');
        },
    },
});
</script>

<style lang="scss" scoped>
.roundButton,
.roundButton:hover,
.button-active,
.button-active:hover {
    transition: all 1s ease;
}

.roundButton {
    float: right;
    background-color: black;
    border: none;
    cursor: pointer;
    border-radius: 100%;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
}

.button-light,
.button-active {
    background: white;
    .btn-icon {
        color: black;
    }
}

.btn-icon {
    color: white;
}
</style>
