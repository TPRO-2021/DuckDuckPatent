<template>
    <div class="chip-button" @click="$emit('onSelect')">
        <span class="chip-button-icon material-icons no-select">{{ iconKey || 'add_circle' }}</span>
        <span class="chip-button-text no-select">{{ text }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Simple chip-button component.
 *
 * The text displayed can be modified using the text property
 * The action icon can be modified using google font icon keys.
 *
 * Example:
 * <ChipButton text="keyword" icon-key="cancel"></ChipButton>
 *
 * Commonly used icons:
 * cancel || add_circle
 */
export default defineComponent({
    name: 'ChipButton',
    props: {
        text: String,
        iconKey: String,
    },
    emits: ['onSelect'],
});
</script>

<style lang="scss">
@import '~@/styles/global';

.chip-button {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
    background: #000000;
    border-radius: 90px;
    border: none;
    min-height: 26px;
    padding: 2px 15px 2px 10px;
    margin: 5px 5px;
    cursor: pointer;
}

.chip-button-icon {
    color: white;
    font-size: 22px;
}

.chip-button-text {
    padding-left: 2px;
    color: white;
    text-align: center;
}
</style>
