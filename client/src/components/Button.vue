<template>
    <button class="button" @click="$emit('onClicked')">
        <!-- The icon-->
        <span class="btn-icon material-icons">{{ iconKey }}</span>
        <!-- The text -->
        <span class="btn-text">{{ btnText }}</span>
    </button>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

/**
 * Simple component which provides a button.
 *
 * The button text can be modified with the property btnText.
 * Additionally an icon can be passed to the button using the iconKey value.
 *
 * This component uses google icons (https://fonts.google.com/icons)
 *
 * Once the button is pressed it emits an event called 'onClicked'
 * which can be handled by the parent component using @on-clicked="handler"
 *
 * */
@Options({
    props: {
        btnText: String,
        iconKey: String,
    },
    emits: ['onClicked'],
})
export default class Button extends Vue {}
</script>

<style lang="scss" scoped>
.button {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000000;
    border-radius: 90px;
    border: none;
    min-height: 26px;
}

.btn-icon {
    color: white;
    height: 24px;
}

.btn-text {
    color: white;
    margin: 5px 7px;
}
</style>
