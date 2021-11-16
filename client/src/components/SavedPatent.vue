<template>
    <div class="main-container box-shadow card">
        <div class="patent-info">
            <div class="patent-title">
                <h2>{{ savedPatentTitle }}</h2>
            </div>
            <div class="patent-abstract">
                <p>{{ savedPatentAbstract?.slice(0, 350) }} ...</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Patent } from '@/models/Patent';

/**
 * Component which shows a preview of a saved patent
 */
export default defineComponent({
    name: 'savedPatent',
    props: {
        savedPatentTitle: String,
        savedPatentAbstract: String,
    },
    emits: ['onRemove'],
    computed: {
        /**
         * Gets the patents from the state
         */
        patents(): Patent[] {
            return this.$store.state.patents;
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: flex-start;
    width: 500px;
}

.main-container:hover {
    cursor: pointer;
    background: #eaeaea;
    transition: all 0.5s ease;
}

.patent-info {
    transition: 0.5s;
    margin: 8px;
}
.patent-title {
    text-align: left;
    font-style: normal;
    font-size: 12px;
    margin-bottom: 20px;
}
.patent-abstract {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
}
</style>
