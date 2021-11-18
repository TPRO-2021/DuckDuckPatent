<template>
    <div class="wrapper">
        <Chip
            :is-suggestion="true"
            v-for="keyword in providedKeywords"
            icon-key="add"
            :text="keyword"
            :key="keyword"
            v-on:on-select="addKeyword(keyword)"
        ></Chip>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Chip from '@/components/Chip.vue';

/**
 * Component which shows available keyword suggestions as green chips
 */
export default defineComponent({
    name: 'KeywordSuggestions',
    props: {
        providedKeywords: Array,
    },
    components: {
        Chip,
    },
    emits: ['onAddKeyword'],
    methods: {
        /**
         * Event handler which emits the 'on-add-keyword' to the parent component
         *
         * @param keyword   The keyword which should be added
         */
        addKeyword(keyword: string) {
            this.$emit('onAddKeyword', { value: keyword });
        },
    },
});
</script>

<style lang="scss" scoped>
.wrapper {
    padding: 16px 0;
    div {
        float: left;
    }
}
</style>
