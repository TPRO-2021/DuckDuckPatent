<template>
    <div class="main-container box-shadow card">
        <div class="patent-info">
            <div class="patent-title">
                <h2>{{ savedPatentTitle }}</h2>
            </div>
            <div class="patent-abstract">
                <p>{{ savedpatentAbstract?.slice(0, 150) }}</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Patent } from '@/models/Patent';
export default defineComponent({
    name: 'savedPatent',
    props: {
        savedPatentTitle: String,
        savedpatentAbstract: String,
    },
    computed: {
        patents(): Patent[] {
            return this.$store.state.patents;
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: start;
    width: 216px;
}
.patent-info {
    justify-content: start;
    transition: 0.5s;
    margin: 8px;
}
.patent-title {
    font-style: normal;
    font-size: 12px;
    margin-bottom: 20px;
}
.patent-abstract {
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
}
</style>
