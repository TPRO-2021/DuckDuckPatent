<template>
    <div class="chip" :style="chipColor" :class="{ 'chip-suggestion': isSuggestion, 'box-shadow': hasShadow }">
        <span class="chip-text no-select">{{ text }}</span>
        <span class="chip-icon material-icons no-select" @click="$emit('onSelect')" v-if="hasAction">{{
            iconKey || 'add_circle'
        }}</span>
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
        hasShadow: {
            type: Boolean,
            default: true,
        },
        hasAction: {
            type: Boolean,
            default: true,
        },
        customColor: {
            type: String,
        },
    },
    emits: ['onSelect'],
    computed: {
        chipColor(): string {
            let color;
            if (this.customColor) {
                color = this.customColor;
            } else if (this.isSuggestion) {
                color = '#5b9761';
            } else {
                color = '#000000';
            }

            return 'background: '.concat(color).concat(';');
        },
    },
});
</script>

<style lang="scss">
@import '~@/styles/global';

.chip {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    border-radius: 90px;
    border: none;
    min-height: 26px;
    width: fit-content;
    padding: 2px 12px 2px 12px;
    margin: 5px 5px;
}

.chip-icon {
    color: white;
    font-size: 22px;
    transform: translateX(6px);
}

.chip-icon:hover {
    cursor: pointer;
}

.chip-text {
    color: white;
}

.chip-text:hover {
    cursor: default;
}
</style>
