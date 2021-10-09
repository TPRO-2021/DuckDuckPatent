<template>
    <div class="chip" :class="{ 'chip-suggestion': isSuggestion }">
        <span class="chip-text">{{ text }}</span>
        <span class="chip-icon material-icons" @click="$emit('onSelect')">{{ iconKey || 'add_circle' }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Simple chip component.
 *
 * The text displayed can be modified using the text property
 * The action icon can be modified using google font icon keys.
 *
 * Example:
 * <Chip text="keyword" icon-key="cancel" is-suggestion="true"></Chip>
 *
 * Usually used icons:
 * cancel || add_circle
 */
export default defineComponent({
    name: 'Chip',
    props: {
        text: String,
        iconKey: String,
        isSuggestion: Boolean,
    },
    emits: ['onSelect'],
});
</script>

<style lang="scss">
.chip {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    background: #000000;
    border-radius: 90px;
    border: none;
    min-height: 26px;
    max-width: fit-content;
    padding: 2px 10px;
    margin: 5px 5px;
}

.chip-suggestion {
    background: #5b9761;
}

.chip-icon {
    color: white;
    width: 20px;
    font-size: 20px;

    // disable selection of the icon
    -webkit-user-select: none;
    user-select: none;
    -moz-user-select: none;
}

.chip-icon:hover {
    cursor: pointer;
}

.chip-text {
    padding-left: 2px;
    color: white;
}

.chip-text:hover {
    cursor: default;
}
</style>
