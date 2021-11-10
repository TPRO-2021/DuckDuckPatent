<template>
    <div class="page-controls">
        <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        <div class="column btn-exploration">
            <Button icon-key="travel_explore" btn-text="Exploration mode" />
        </div>
    </div>

    <!-- This div contains the top right controls (saved button) -->
    <div class="top-controls">
        <Button btnText="Saved" iconKey="turned_in" :badge-value="savedPatentsCount" v-on:on-clicked="openSavePage" />
    </div>

    <div class="explore-container">
        <div class="patent-information card box-shadow">
            <div v-if="loading" class="patent-placeholder">
                <Skeleton width="100%" height="16px"></Skeleton>
                <Skeleton width="80%" height="16px"></Skeleton>
                <Skeleton width="20%" height="16px"></Skeleton>
                <br />
                <Skeleton width="100%" height="12px" v-for="(_i, i) of Array.from(Array(5).keys())" :key="i"></Skeleton>
            </div>
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
                <div
                    class="card box-shadow family-placeholder"
                    v-for="(_item, index) of Array.from(Array(9).keys())"
                    :key="index"
                >
                    <Skeleton width="100%" height="16px"></Skeleton>
                    <Skeleton width="80%" height="16px"></Skeleton>
                    <br />
                    <Skeleton
                        width="100%"
                        height="12px"
                        v-for="(_i, i) of Array.from(Array(5).keys())"
                        :key="i"
                    ></Skeleton>
                    <Skeleton width="60%" height="12px"></Skeleton>
                </div>
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
                            <p>{{ patent.abstract?.slice(0, 350) }} ...</p>
                        </div>
                    </div>
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

export default defineComponent({
    name: 'Exploration',
    components: {
        Button,
        Chip,
        DetailedPatentView,
        RoundButton,
    },
    data() {
        return {
            patentService: new PatentService(),
            selectedPatent: null as ExtendedPatent | null,
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
    },
    async created() {
        this.checkUrl();

        if (!this.patent) {
            await this.loadPatent();
        }

        if (!this.family) {
            await this.loadFamily();
        }
    },
    methods: {
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            this.$router.back();
        },

        async loadPatent() {
            if (!this.patentId) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const patent = await this.patentService.get(this.patentId);

                this.$store.commit('STORE_PATENT', { patent, searchTerms: this.searchTerms });
            } catch (err) {
                console.error(err);
            }
            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Loads the patent family of the current patent
         */
        async loadFamily() {
            if (!this.patent) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const family = await this.patentService.queryFamily(this.patent.patent.id);

                this.$store.commit('STORE_FAMILY', { patentId: this.patent.patent.id, family });
            } catch (err) {
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
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
    width: 500px;
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

.patent-container,
.family-placeholder {
    width: 500px;
    height: 300px;
    max-height: 400px;
}

.patent-placeholder {
    height: 250px;
    width: 100%;
}

.patent-container,
.family-placeholder,
.patent-placeholder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    float: left;
}

.patent-container:hover {
    cursor: pointer;
    background: #eaeaea;
    transition: all 0.5s ease;
}

.explore-container {
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
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
</style>
