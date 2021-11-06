<template>
    <div class="saved-page">
        <div class="saved-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
            <Button class="saved-btn" iconKey="bookmark" btnText="saved item">Saved</Button>
        </div>
        <div class="saved-list">
            <savedPatent
                v-for="(savedPatent, index) in savedPatents"
                :key="index"
                :savedPatentTitle="savedPatent.patent.title"
                :savedpatentAbstract="savedPatent.patent.abstract"
                @click="onSelectPatent(savedPatent)"
                v-on:on-remove="this.removeFromSaved(savedPatent.patent)"
                v-on:on-close="this.selectedPatent = null"
            />
        </div>

        <DetailedPatentView
            :extended-patent="selectedPatent"
            :is-saved-page="true"
            v-on:remove-from-saved="removeFromSaved(selectedPatent.patent)"
            v-on:on-close="
                selectedPatent = null;
                this.$store.commit('HIDE_DIALOG_MASK');
            "
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import savedPatent from '@/components/SavedPatent.vue';
import Button from '@/components/Button.vue';
import RoundButton from '@/components/RoundButton.vue';
import { Patent } from '@/models/Patent';
import DetailedPatentView from '@/components/DetailedPatentView.vue';
import { ExtendedPatent } from '@/models/ExtendedPatent';

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
            selectedPatent: null as ExtendedPatent | null,
        };
    },
    computed: {
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        savedPatents(): ExtendedPatent[] {
            return this.$store.state.savedPatents;
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
    },
    methods: {
        /**
         * Attempts to take the user back to the previous page
         */
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            if (this.searchTerms.length === 0) {
                this.$router.push({ path: '/' });
                return;
            }

            this.$router.push({ path: 'search', query: { terms: this.searchTerms } });
        },

        /**
         * Removes a patent from the saved page
         * @param patent
         */
        removeFromSaved(patent: Patent): void {
            this.$store.commit('REMOVE_SAVED_PATENT', { patent });
        },

        /**
         * Set a patent as the selected patent and mark it twice on preview
         * @param patent
         */
        onSelectPatent(patent: ExtendedPatent): void {
            //highlight and mark off
            this.$store.commit('HIGHLIGHT_NODE_OFF');

            this.selectedPatent = patent;
            this.$store.commit('SHOW_DIALOG_MASK');
            //set mark twice on viewed node
            this.$store.commit('MARK_NODE_ON', { pID: patent.patent.id, twice: true });
            //set mark twice on viewed node
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', patent.patent.id);
            });
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
