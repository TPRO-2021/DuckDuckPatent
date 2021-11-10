<template>
    <div class="page-controls">
        <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        <div class="column btn-exploration">
            <Button icon-key="travel_explore" btn-text="Exploration mode" @click="$emit('onOpenExploration')" />
        </div>
    </div>

    <!-- This div contains the top right controls (saved button) -->
    <div class="top-controls">
        <Button btnText="Saved" iconKey="turned_in" :badge-value="savedPatentsCount" v-on:on-clicked="openSavePage" />
    </div>

    <div class="explore-container">
        <div class="patent-family" v-if="loading">
            <div
                class="card box-shadow patent-placeholder"
                v-for="(_item, index) of Array.from(Array(9).keys())"
                :key="index"
            >
                <Skeleton width="100%" height="16px"></Skeleton>
                <Skeleton width="80%" height="16px"></Skeleton>
                <br />
                <Skeleton width="100%" height="12px" v-for="(_i, i) of Array.from(Array(5).keys())" :key="i"></Skeleton>
                <Skeleton width="60%" height="12px"></Skeleton>
            </div>
        </div>

        <div class="patent-family" v-if="!loading">
            <div class="card box-shadow patent-container" v-for="(patent, index) of family" :key="index">
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '@/components/RoundButton.vue';
import Button from '@/components/Button.vue';
import { Patent } from '@/models/Patent';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import PatentService from '@/services/patent.service';

export default defineComponent({
    name: 'Exploration',
    components: {
        RoundButton,
        Button,
    },
    data() {
        return {
            patentService: new PatentService(),
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
            if (this.searchTerms.length === 0) {
                this.$router.push({ path: '/' });
                return;
            }

            this.$router.push({ path: 'search', query: { terms: this.searchTerms } });
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

        checkUrl() {
            let searchTerms = this.$route.query.searchTerms;

            if (!searchTerms) return;

            console.log(searchTerms);

            if (!(searchTerms instanceof Array)) {
                searchTerms = [searchTerms];
            }

            this.$store.commit('SET_SEARCH_TERMS', searchTerms);
        },
    },
});
</script>

<style lang="scss" scoped>
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
.patent-placeholder {
    width: 500px;
    max-height: 300px;
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

.patent-family {
    width: 90vw;
    padding-top: 60px;
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
</style>
