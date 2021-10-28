<template>
    <div class="saved-page">
        <div class="saved-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="backPage"></RoundButton>
            <Button class="saved-btn" iconKey="bookmark" btnText="saved item">Saved</Button>
        </div>
        <div class="saved-list">
            <savedPatent
                v-for="(patent, index) in savedPatents"
                :key="index"
                :savedPatentTitle="patent.title"
                :savedpatentAbstract="patent.abstract"
                @click="onSelectPatent(patent)"
            >
            </savedPatent>
        </div>

        <DetailedPatentView :patent="selectedPatent"></DetailedPatentView>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import savedPatent from '@/components/SavedPatent.vue';
import Button from '@/components/Button.vue';
import RoundButton from '@/components/RoundButton.vue';
import { Patent } from '@/models/Patent';
import DetailedPatentView from '@/components/DetailedPatentView.vue';

export default defineComponent({
    name: 'SavedResult',
    components: {
        RoundButton,
        savedPatent,
        Button,
        DetailedPatentView,
    },
    data() {
        return {
            saved: [] as Patent[],
            selectedPatent: null as Patent | null,
        };
    },
    computed: {
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        savedPatents(): Patent[] {
            return this.$store.state.savedPatents;
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
    },
    methods: {
        backPage(): void {
            this.$router.push({ path: 'search', query: { terms: this.searchTerms } });
        },
        onSelectPatent(patent: Patent): void {
            this.selectedPatent = patent;
        },
    },
});
</script>

<style lang="scss" scoped>
.saved-page {
    height: 100vh;
    width: 100%;
}

.saved-controls {
    position: sticky;
    top: 0;
    left: 0;
    width: 500px;
    display: flex;
    gap: 20px;
    padding: 20px;
}

.saved-btn {
}
.back-btn {
    height: 40px;
    width: 40px;
}
.saved-list {
    padding-left: 0 !important;
    gap: 65px;
    flex-grow: 5;
    display: flex;
    justify-content: center;
    flex-direction: row;
    flex-wrap: wrap;
    padding-bottom: 65px;
}
</style>
