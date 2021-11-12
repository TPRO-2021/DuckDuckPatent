<template>
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

    <div class="explore-container">
        <div class="patent-information card box-shadow">
            <PatentPlaceholder v-if="loading" />
            <!-- Patent information -->
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
            </div>

            <!-- Patent family -->
            <Divider align="left"><Chip :has-action="false" text="Family" class="divider-label"></Chip></Divider>
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

                    <div @click="onSelectPatent(item)" v-if="!item.isLoading">
                        <div class="patent-info">
                            <div class="patent-title">
                                <h2>{{ item.title }}</h2>
                            </div>
                            <div class="patent-abstract">
                                <p>{{ item.abstract?.slice(0, 300) }} ...</p>
                            </div>
                        </div>
                    </div>

                    <PreviewPlaceholder
                        class="card box-shadow family-placeholder"
                        v-if="index === citations.length - 1"
                    />
                </div>
            </div>
        </div>
    </div>

    <DetailedPatentView
        :extended-patent="selectedPatent"
        :is-saved-page="false"
        v-on:on-close="
            selectedPatent = null;
            this.$store.commit('HIDE_DIALOG_MASK');
        "
        :show-explore-btn="false"
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

export default defineComponent({
    name: 'Exploration',
    components: {
        Button,
        Chip,
        DetailedPatentView,
        RoundButton,
        PatentPlaceholder,
        PreviewPlaceholder,
    },
    data() {
        return {
            patentService: new PatentService(),
            selectedPatent: null as ExtendedPatent | null,
            citations: [] as Patent[],
        };
    },
    computed: {
        patentId(): string {
            return (this.$route.query.patentId as string) || '';
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        loading(): boolean {
            if (!this.patentId) return true;

            return !this.family;
        },
        family(): Patent[] {
            return this.$store.state.patentFamilies[this.patentId];
        },
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentId];
        },
        savedPatentsCount(): string {
            const items = Object.keys(this.$store.state.savedPatents).length;
            if (items === 0) {
                return '';
            }

            return items.toString();
        },
        citationsAvailable(): boolean {
            return this.citations.length > 0;
        },
    },
    async created() {
        // for consistency show the loading screen for 0.5s
        this.$store.commit('SHOW_LOADING_SCREEN');
        setTimeout(() => {
            this.$store.commit('HIDE_LOADING_SCREEN');
        }, 500);

        // check the current url to retrieve query params
        this.checkUrl();

        // show the loading indicator
        this.$store.commit('SHOW_LOADING_BAR');

        // if no patent is available in the vuex store load the patent from the backend
        if (!this.patent) {
            await this.loadPatent();
        } else {
            // set citations array to the patents citations
            this.citations = (this.patent.patent.citations || []).map((citation) => ({ ...citation, isLoading: true }));
        }

        // if no family is present in the state load the family for the patent as well
        if (!this.family) {
            await this.loadFamily();
        }

        // load the citation data
        await this.loadCitations();

        //  after all loading has finished hide the indicator
        this.$store.commit('HIDE_LOADING_BAR');
    },
    methods: {
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            this.$router.back();
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
         * Set a patent as the selected patent and mark it twice on preview
         * @param patent
         */
        onSelectPatent(patent: Patent): void {
            this.selectedPatent = { patent: patent, searchTerms: this.searchTerms };
            this.$store.commit('SHOW_DIALOG_MASK');
        },

        /**
         * Loads citation data from the backend
         */
        async loadCitations() {
            // mapping all requests into a promises array
            const promises = this.citations.map((citation, index) => {
                return new Promise((res, rej) => {
                    this.patentService
                        .get(citation.id)
                        .then((patent) => {
                            const newCit = { ...citation, ...patent, isLoading: false };
                            this.citations[index] = newCit;
                            res(newCit);
                        })
                        .catch((err) => rej(err));
                });
            });

            // waiting for all promises to finish and then hiding the loading bar
            try {
                await Promise.all(promises);
            } catch (err) {
                console.error(err);
            }
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
    position: sticky;
    top: 0;
    left: 0;
    display: flex;
    gap: 20px;
    padding: 20px;
    height: 40px;
    z-index: 100;
}

.divider-label {
    font-family: 'Saira', sans-serif;
}

.back-btn {
    height: 40px;
    width: 40px;
}

.top-controls {
    margin: 20px;
    position: absolute;
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
    margin-bottom: 5vh;
}

.patent-information {
    width: 90vw;
    margin-top: 60px;
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
    padding-right: 42px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
}

.legend-patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}

.legend-patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-right: 60px;
    font-style: normal;
    font-size: 16px;
    overflow-y: auto;
}

.patent-citations,
.patent-family {
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
}
</style>
