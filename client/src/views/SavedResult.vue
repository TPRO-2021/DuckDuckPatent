<template>
    <!-- Saved page container -->
    <div class="saved-page">
        <!-- Page controls (BackButton, Info Button) -->
        <div class="page-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
            <Button class="saved-btn" iconKey="bookmark" :btnText="btnText">Saved</Button>
        </div>

        <!-- Saved items container -->
        <div class="saved-list">
            <div class="saved-patents-container card box-shadow">
                <!-- Placeholder if no saved patents available -->
                <div v-if="Object.keys(savedPatents).length === 0" class="empty-placeholder">No saved patents yet!</div>

                <!-- Saved patents list -->
                <div class="saved-patents">
                    <savedPatent
                        class="patent-container"
                        v-for="(savedPatent, index) in savedPatents"
                        :key="index"
                        :savedPatentTitle="savedPatent.patent.title"
                        :savedPatentAbstract="savedPatent.patent.abstract"
                        @click="onSelectPatent(savedPatent)"
                        v-on:on-remove="this.removeFromSaved(savedPatent.patent)"
                        v-on:on-close="this.selectedPatent = null"
                    />

                    <!-- Last child to avoid spacing issues (invisible) -->
                    <div class="card box-shadow patent-container"></div>
                </div>

                <!-- Bottom controls (clear button) -->
                <div class="bottom-controls" v-if="Object.keys(savedPatents).length > 0">
                    <ChipButton
                        text="Clear saved items"
                        icon-key="delete_forever"
                        v-on:on-select="$store.commit('CLEAR_SAVED_ITEMS')"
                    ></ChipButton>
                </div>
            </div>
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
import ChipButton from '@/components/ChipButton.vue';
import { PatentMap } from '@/models/PatentMap';

/**
 * View which is responsible for displaying the /saved page
 */
export default defineComponent({
    name: 'SavedResult',
    components: {
        Button,
        ChipButton,
        DetailedPatentView,
        RoundButton,
        savedPatent,
    },
    data() {
        return {
            saved: [] as Patent[],
            selectedPatent: null as ExtendedPatent | null,
        };
    },
    computed: {
        /**
         * Returns patents from the store
         */
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        /**
         * Returns saved patents map from the store
         */
        savedPatents(): PatentMap {
            return this.$store.state.savedPatents;
        },
        /**
         * Returns search terms from the store
         */
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        /**
         * Returns button text depending on the amount of saved item(s)
         */
        btnText(): string {
            return Object.keys(this.savedPatents).length === 1 ? 'Saved item' : 'Saved items';
        },
    },
    mounted() {
        // adds the loading screen for 0.5s
        this.$store.commit('SHOW_LOADING_SCREEN');
        setTimeout(() => {
            this.$store.commit('HIDE_LOADING_SCREEN');
        }, 500);
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

            // use the routers back function to go back
            this.$router.back();
        },

        /**
         * Removes a patent from the saved items collection
         *
         * @param patent The patent which should be removed
         */
        removeFromSaved(patent: Patent): void {
            this.$store.commit('REMOVE_SAVED_PATENT', { patent });
        },

        /**
         * Sets a patent as the selected patent and marks it twice on preview
         *
         * @param patent The patent which should be selected & marked
         */
        onSelectPatent(patent: ExtendedPatent): void {
            //highlight and mark off
            this.$store.commit('HIGHLIGHT_NODE_OFF');

            // show blur mask
            this.$store.commit('SHOW_DIALOG_MASK');

            // set selected patent to the patent reference
            this.selectedPatent = patent;

            //set mark twice on viewed node
            this.$store.commit('ADD_MARK', { pID: patent.patent.id, twice: true });

            //set mark twice on viewed node
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', { pID: patent.patent.id, nodeType: 'patent' });
            });
        },
    },
});
</script>

<style lang="scss" scoped>
.saved-page {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.page-controls {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    gap: 20px;
    margin: 20px;
    height: 40px;
    z-index: 100;
}

.saved-btn {
}
.back-btn {
    height: 40px;
    width: 40px;
}
.saved-list {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    overflow: hidden;
}

.saved-patents-container {
    margin-top: 106px;
    margin-bottom: 28px;
    width: 90vw;
    min-height: 15vh;
    max-height: 94vh;
    overflow: scroll;
}

.saved-patents {
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
}

.patent-container {
    flex-grow: 1;
    width: 500px;
    height: 325px;
    max-height: 400px;
}

.patent-container:last-child {
    flex-grow: 7;
    visibility: hidden;
    height: 0;
    padding: 0;
    margin: 0;
}

.bottom-controls {
    display: flex;
    justify-content: flex-end;
}

.empty-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
