<template>
    <button
        type="button"
        class="roundButton"
        @click="onClick"
        :class="{ 'button-active': isClicked || type === 'light' }"
    >
        <span class="btn-icon material-icons">{{ this.iconKey }}</span>
    </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
        onClick(): void {
            if (this.isToggle) {
                this.isClicked = !this.isClicked;
                this.$emit('onClicked', this.isClicked);
                console.log('emitted');
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
    width: 58px;
    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.3);
}

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
