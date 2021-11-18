<template>
    <!-- Page controls (back-btn, navigation-btn, saved-btn -->
    <div class="page-controls">
        <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        <div class="column btn-exploration">
            <Button icon-key="travel_explore" btn-text="Exploration mode" />
        </div>
        <!-- This div contains the top right controls (saved button) -->
        <div class="top-controls">
            <Button
                btnText="Saved"
                iconKey="turned_in"
                :badge-value="savedPatentsCount"
                v-on:on-clicked="openSavePage"
            />
        </div>
    </div>

    <!-- Exploration content -->
    <div class="explore-container">
        <div class="patent-information card box-shadow duckduckpatent">
            <!-- Patent information -->
            <PatentPlaceholder v-if="loading" />
            <div v-if="!loading">
                <div class="legend-patent-title">{{ patent?.patent.title }}</div>
                <div class="legend-patent-owner">
                    <span v-for="(applicant, index) in patent?.patent.applicants" :key="index">
                        {{ applicant }}
                        <span v-if="index !== patent.patent.applicants.length - 1">, </span>
                        <span v-if="index <= patent.patent.applicants.length - 1"> </span>
                    </span>
                </div>
                <div class="legend-patent-abstract">{{ patent?.patent.abstract }}</div>

                <div class="legend-patent-controls" v-if="!isSaved">
                    <ChipButton text="Add to saved items" icon-key="bookmark" v-on:on-select="savePatent" />
                </div>
            </div>

            <div class="exploration-content">
                <!-- Patent family -->
                <Divider align="left">
                    <Chip
                        :has-action="false"
                        text="Family"
                        class="divider-label"
                        custom-color="rgb(137, 105, 120)"
                    ></Chip>
                </Divider>
                <div class="patent-family" v-if="loading">
                    <PreviewPlaceholder
                        class="card box-shadow family-placeholder"
                        v-for="(_item, index) of Array.from(Array(5).keys())"
                        :key="index"
                    />
                </div>

                <div class="patent-family" v-if="!loading">
                    <div
                        class="card box-shadow patent-container"
                        v-for="(patent, index) of family"
                        :key="index"
                        @click="onSelectPatent(patent)"
                    >
                        <div class="patent-info">
                            <div class="patent-title">
                                <h2>{{ patent.title }}</h2>
                            </div>
                            <div class="patent-abstract">
                                <p>{{ patent.abstract?.slice(0, 300) }} ...</p>
                            </div>
                        </div>
                    </div>
                    <!-- This is here to hacky-fix the placement issue. Don't tell anyone about it! -->
                    <PreviewPlaceholder class="card box-shadow family-placeholder" />
                </div>

                <!-- Patent citations -->
                <Divider align="left" v-if="loading || citationsAvailable">
                    <Chip :has-action="false" text="Citations" class="divider-label" custom-color="#487909"></Chip>
                </Divider>
                <div class="patent-citations patent-family">
                    <div
                        v-for="(item, index) of citations"
                        :key="index"
                        class="family-placeholder card box-shadow patent-container"
                    >
                        <PreviewPlaceholder v-if="item.isLoading" />

                        <div @click="onSelectPatent(item, 'citation')" v-if="!item.isLoading">
                            <div class="patent-info">
                                <div class="patent-title">
                                    <h2>{{ item.title }}</h2>
                                </div>
                                <div class="patent-abstract">
                                    <p>{{ item.abstract?.slice(0, 300) }} ...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card box-shadow family-placeholder patent-container"></div>
                </div>

                <!-- Patent inventors -->
                <Divider align="left" v-if="loading || inventorAvailable">
                    <Chip
                        :has-action="false"
                        text="More from the inventor(s)"
                        class="divider-label"
                        custom-color="rgb(41, 115, 168)"
                    ></Chip>
                </Divider>
                <div class="patent-citations patent-family">
                    <div
                        v-for="(item, index) of inventorSuggestions"
                        :key="index"
                        class="family-placeholder card box-shadow patent-container"
                    >
                        <PreviewPlaceholder v-if="item.isLoading" />

                        <div @click="onSelectPatent(item, 'citation')" v-if="!item.isLoading">
                            <div class="patent-info">
                                <div class="patent-title">
                                    <h2>{{ item.title }}</h2>
                                </div>
                                <div class="patent-abstract">
                                    <p>{{ item.abstract?.slice(0, 300) }} ...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card box-shadow family-placeholder patent-container"></div>
                </div>

                <!-- Patent applicants -->
                <Divider align="left" v-if="loading || applicantAvailable">
                    <Chip
                        :has-action="false"
                        text="More from the applicant(s)"
                        class="divider-label"
                        custom-color="rgb(168, 41, 41)"
                    ></Chip>
                </Divider>
                <div class="patent-citations patent-family">
                    <div
                        v-for="(item, index) of applicantSuggestions"
                        :key="index"
                        class="family-placeholder card box-shadow patent-container"
                    >
                        <PreviewPlaceholder v-if="item.isLoading" />

                        <div @click="onSelectPatent(item, 'citation')" v-if="!item.isLoading">
                            <div class="patent-info">
                                <div class="patent-title">
                                    <h2>{{ item.title }}</h2>
                                </div>
                                <div class="patent-abstract">
                                    <p>{{ item.abstract?.slice(0, 300) }} ...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card box-shadow family-placeholder patent-container"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Detailed patent card -->
    <DetailedPatentView
        :extended-patent="selectedPatent"
        :is-saved-page="false"
        v-on:on-close="
            selectedPatent = null;
            $store.commit('HIDE_DIALOG_MASK');
        "
        :show-explore-btn="showExplorationButton"
        v-on:on-save-patent-detailed="onSave"
    />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '@/components/RoundButton.vue';
import Button from '@/components/Button.vue';
import { Patent } from '@/models/Patent';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import PatentService from '@/services/patent.service';
import DetailedPatentView from '@/components/DetailedPatentView.vue';
import Chip from '@/components/Chip.vue';
import PreviewPlaceholder from '@/components/PreviewPlaceholder.vue';
import PatentPlaceholder from '@/components/PatentPlaceholder.vue';
import ChipButton from '@/components/ChipButton.vue';
import ExplorationHelperService from '@/services/exploration-helper.service';

/**
 * View which is responsible for displaying the /exploration page for a selected patent
 */
export default defineComponent({
    name: 'Exploration',
    components: {
        Button,
        Chip,
        ChipButton,
        DetailedPatentView,
        RoundButton,
        PatentPlaceholder,
        PreviewPlaceholder,
    },
    data() {
        return {
            applicants: [] as string[],
            applicantSuggestions: [] as Patent[],
            citations: [] as Patent[],
            inventors: [] as string[],
            inventorSuggestions: [] as Patent[],
            patentService: new PatentService(),
            selectedPatent: null as ExtendedPatent | null,
            selectedItemType: 'patent' as 'patent' | 'citation',
        };
    },
    watch: {
        /**
         * Watches for route changes and re-initializes the data to provide the ability
         * of navigating through patents
         *
         * @param newVal The new route
         */
        $route(newVal) {
            // since this hook is only deregistered after the component was destroyed we need to prevent the reinitialization
            // on other paths
            if (!(newVal.path === '/explore')) {
                return;
            }

            // if the route params change we need to reinitialize the data
            this.initView();
        },
    },
    computed: {
        /**
         * Returns the id of the patent from the current query parameter 'patentId'
         */
        patentId(): string {
            return (this.$route.query.patentId as string) || '';
        },
        /**
         * Returns the search terms from the state
         */
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        /**
         * Returns true if the loading placeholders should be shown based on the value of the patentId and the family
         */
        loading(): boolean {
            if (!this.patentId) return true;

            return !this.family;
        },
        /**
         * Returns the family for the current patent from the store
         */
        family(): Patent[] {
            return this.$store.state.patentFamilies[this.patentId];
        },
        /**
         * Returns the current patent from the store
         */
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentId];
        },
        /**
         * Returns the saved patents count as a string
         */
        savedPatentsCount(): string {
            const items = Object.keys(this.$store.state.savedPatents).length;
            if (items === 0) {
                return '';
            }

            return items.toString();
        },
        /**
         * Returns whether citations are available or not based on the length of the citations array reference
         */
        citationsAvailable(): boolean {
            return this.citations.length > 0;
        },
        /**
         * Returns whether the exploration button should be shown or not
         */
        showExplorationButton(): boolean {
            return this.selectedItemType === 'citation';
        },
        /**
         * Returns if the current patent is saved in the store
         */
        isSaved(): boolean {
            return this.$store.state.savedPatents[this.patentId];
        },
        /**
         * Returns whether an applicant is available on the current patent
         */
        applicantAvailable(): boolean {
            return this.applicantSuggestions.length > 0;
        },
        /**
         * Returns whether an inventor is available on the current patent
         */
        inventorAvailable(): boolean {
            return this.inventorSuggestions.length > 0;
        },
    },
    async created() {
        // for consistency show the loading screen for 0.5s
        this.$store.commit('SHOW_LOADING_SCREEN');
        setTimeout(() => {
            this.$store.commit('HIDE_LOADING_SCREEN');
        }, 500);

        // initialize view
        await this.initView();
    },
    methods: {
        /**
         * Attempts to go to the previous route
         */
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            this.$router.back();
        },

        /**
         * Initializes the view with the current data
         */
        async initView(): Promise<void> {
            // check the current url to retrieve query params
            this.checkUrl();

            // show the loading indicator
            this.$store.commit('SHOW_LOADING_BAR');

            // if no patent is available in the vuex store load the patent from the backend
            if (!this.patent) {
                await this.loadPatent();
            } else {
                // set citations array to the patents citations
                this.citations = (this.patent.patent.citations || []).map((citation) => ({
                    ...citation,
                    isLoading: true,
                }));

                this.applicants = this.patent.patent.applicants || [];
                this.inventors = this.patent.patent.inventors || [];
            }

            const promises = [] as Promise<void>[];

            // if no family is present in the state load the family for the patent as well
            if (!this.family) {
                promises.push(this.loadFamily());
            }

            // Citations and related (inventors and applicants) patents can be loaded in parallel to reduce loading time
            await Promise.all(promises.concat([this.loadCitations(), this.loadRelated()]));

            //  after all loading has finished hide the indicator
            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Loads the patent from the backend
         */
        async loadPatent() {
            if (!this.patentId) return;

            try {
                const patent = await this.patentService.get(this.patentId);
                this.$store.commit('STORE_PATENT', { patent, searchTerms: this.searchTerms });

                this.citations = (patent.citations || []).map((citation) => ({ ...citation, isLoading: true }));
                this.applicants = patent.applicants || [];
                this.inventors = patent.inventors || [];
            } catch (err) {
                console.error(err);
            }
        },

        /**
         * Loads the patent family of the current patent
         */
        async loadFamily() {
            if (!this.patent) return;

            try {
                const family = await this.patentService.queryFamily(this.patent.patent.id);

                this.$store.commit('STORE_FAMILY', { patentId: this.patent.patent.id, family });
            } catch (err) {
                console.error(err);
            }
        },

        /**
         * Checks the url for query parameters and adds them to the state
         */
        checkUrl() {
            let searchTerms = this.$route.query.searchTerms;

            // if no patentId or search terms go back to landing page
            if (!this.patentId || !searchTerms) {
                this.$router.push('/');
            }

            if (!(searchTerms instanceof Array)) {
                searchTerms = [searchTerms];
            }

            this.$store.commit('SET_SEARCH_TERMS', searchTerms);
        },

        /**
         * Opens the saved page
         */
        openSavePage(): void {
            this.$router.push({ path: '/saved' });
        },

        /**
         * Event handler which sets a patent as the selected patent
         * @param patent    The selected patent
         * @param type      The type of the selected patent
         */
        onSelectPatent(patent: Patent, type = 'patent' as 'citation' | 'patent'): void {
            this.selectedItemType = type;
            this.selectedPatent = { patent: patent, searchTerms: this.searchTerms };
            this.$store.commit('SHOW_DIALOG_MASK');
        },

        /**
         * Loads citation data from the backend
         */
        async loadCitations() {
            // mapping all requests into a promises array
            const promises = this.citations.map((citation, index) => {
                return new Promise((res) => {
                    this.patentService
                        .get(citation.id)
                        .then((patent) => {
                            const newCit = { ...citation, ...patent, isLoading: false };
                            this.citations[index] = newCit;
                            res(newCit);
                        })
                        .catch((err) => {
                            console.error(err);
                            res({});
                        });
                });
            });

            // waiting for all promises to finish and then hiding the loading bar
            await Promise.all(promises);

            // Since some requests are running into a 404 error therefore we need to filter those citations out
            this.citations = this.citations.filter((citation) => !citation.isLoading);
        },

        /**
         * Adds a patent to the store
         */
        savePatent() {
            this.$store.commit('ADD_SAVED_PATENT', this.patent);
        },

        /**
         * Loads related patents for the patent
         */
        async loadRelated() {
            const applicants = this.patent.patent.applicants || [];
            const inventors = this.patent.patent.inventors || [];

            const [applicantCits, inventorCits] = await Promise.all([
                Promise.all(this.queryRelatedPatents(applicants, 'applicant')),
                Promise.all(this.queryRelatedPatents(inventors, 'inventor')),
            ]);

            const applicantSuggestions = ExplorationHelperService.shuffle(
                ExplorationHelperService.getPatentsArray(applicantCits),
            );
            const inventorSuggestions = ExplorationHelperService.shuffle(
                ExplorationHelperService.getPatentsArray(inventorCits),
            );

            this.applicantSuggestions = applicantSuggestions.splice(0, 10) as Patent[];
            this.inventorSuggestions = inventorSuggestions.splice(0, 10) as Patent[];
        },

        /**
         * Queries the backend for applicants and inventors
         * @param queryList The list of patents which should be loaded
         * @param type  The type of the patent-relation
         */
        queryRelatedPatents(queryList: string[], type: 'applicant' | 'inventor') {
            return queryList.map((related) => {
                return new Promise<Patent[] | null>((res) => {
                    this.patentService
                        .query(
                            [],
                            [
                                {
                                    id: 1,
                                    type: type,
                                    isSelectionOpen: false,
                                    value: ExplorationHelperService.processRelatedName(related),
                                },
                            ],
                            0,
                            false,
                        )
                        .then((data) => res(data.patents))
                        .catch(() => res(null));
                });
            });
        },

        /**
         * Event handler which saves a patent to the vuex store
         * @param event The event containing the extended patent
         */
        onSave(event: { patent: ExtendedPatent }) {
            this.$store.commit('ADD_SAVED_PATENT', event.patent);
        },
    },
});
</script>

<style lang="scss" scoped>
.btn-exploration > div:hover {
    background: black;
    cursor: default;
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

.back-btn {
    height: 40px;
    width: 40px;
}

.top-controls {
    margin: 20px;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 100;
}

.family-placeholder:last-child {
    flex-grow: 7;
    visibility: hidden;
    height: 0;
    padding: 0;
    margin: 0;
}

.patent-container,
.family-placeholder {
    flex-grow: 1;
    width: 500px;
    height: 325px;
    max-height: 400px;
}

.patent-container,
.family-placeholder {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.patent-container:hover {
    cursor: pointer;
    background: #eaeaea;
    transition: all 0.5s ease;
}

.explore-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    overflow: hidden;
}

.exploration-content {
}

.patent-information {
    width: 90vw;
    max-height: 94vh;
    overflow: scroll;
    margin-top: 86px;
    margin-bottom: 28px;
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
    max-height: 150px;
    overflow: hidden;
}

.legend-patent-title {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    padding-left: 20px;
    padding-right: 20px;
    padding-top: 10px;
}

.legend-patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
    padding-left: 20px;
}

.legend-patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-right: 20px;
    padding-left: 20px;
    font-style: normal;
    font-size: 16px;
    overflow-y: auto;
}

.legend-patent-controls {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
    padding-right: 8px;
}

.patent-citations,
.patent-family {
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
}
</style>
