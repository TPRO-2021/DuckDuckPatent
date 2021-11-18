<template>
    <!-- Top controls (back-button & save button) -->
    <div class="patent-controls">
        <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
    </div>
    <div class="top-controls">
        <Button btnText="Saved" iconKey="turned_in" :badge-value="savedPatentsCount" v-on:on-clicked="openSavePage" />
    </div>

    <!-- Patent content -->
    <div class="patent-container">
        <!-- Patent title and owner -->
        <div>
            <div class="patent-title" v-html="highlightText(patent?.patent.title, patent?.searchTerms)"></div>
            <div class="patent-owner">
                <span v-for="(applicant, index) in patent?.patent.applicants" :key="index">
                    {{ applicant }}
                    <span v-if="index !== patent?.patent.applicants.length - 1">, </span>
                    <span v-if="index <= patent?.patent.applicants.length - 1"> </span>
                </span>
            </div>
        </div>

        <!-- Patent abstract, inventors and applicants -->
        <div class="patent-abstract">
            <h2>Abstract</h2>
            <div v-html="highlightText(patent?.patent.abstract, patent?.searchTerms)"></div>
        </div>
        <div class="patent-info">
            <div>
                <h3>Inventors</h3>
                <ul class="inventors-list">
                    <li v-for="(inventor, index) in patent?.patent.inventors" :key="index">{{ inventor }}</li>
                </ul>
            </div>
            <div>
                <h3>Applicants</h3>
                <ul class="inventors-list">
                    <li v-for="(applicant, index) in patent?.patent.applicants" :key="index">{{ applicant }}</li>
                </ul>
            </div>
        </div>

        <!-- Footer containing the searched keyword chips as well as the attachments and the exploration button -->
        <div class="footer-container">
            <div class="patent-additional-info">
                <!-- Keyword-Chips -->
                <div class="keywords">
                    <div class="label-keywords">Searched keywords:</div>
                    <span class="keyword-chips">
                        <Chip
                            v-for="(keyword, index) in patent?.searchTerms"
                            :key="index"
                            :has-action="false"
                            :text="keyword"
                        ></Chip>
                    </span>
                </div>

                <!-- Attachments -->
                <div class="attachments" v-if="!noDocuments">
                    <div class="label-attachment">Attachments</div>
                    <div class="attachment-items" v-if="documents">
                        <Attachment
                            v-for="(attachment, index) in documents"
                            :key="index"
                            :type="attachment.type"
                            v-on:on-open="openDocument(attachment)"
                        ></Attachment>
                    </div>

                    <!-- Display skeleton to indicate loading -->
                    <div class="attachment-items" v-if="!documents">
                        <div class="card box-shadow" v-for="(_item, index) in [1, 2, 3]" :key="index">
                            <Skeleton width="60px" height="30px"></Skeleton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Explore Button -->
            <div class="column btn-exploration" v-if="explorationAvailable">
                <Button icon-key="travel_explore" btn-text="Start exploration" @click="openExploration" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '@/components/RoundButton.vue';
import Button from '@/components/Button.vue';
import PatentService from '@/services/patent.service';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import { DocumentInformation } from '@/models/DocumentInformation';
import DocumentService from '@/services/document.service';
import Attachment from '@/components/Attachment.vue';
import Chip from '@/components/Chip.vue';
import { Patent } from '@/models/Patent';

/**
 * View which is responsible for displaying the /patent page for a selected patent
 */
export default defineComponent({
    name: 'Patent',
    components: { RoundButton, Attachment, Button, Chip },
    data() {
        return {
            documents: null as DocumentInformation[] | null,
            documentService: new DocumentService(),
            explorationAvailable: false,
            noDocuments: false,
            patentService: new PatentService(),
        };
    },
    computed: {
        /**
         * Returns the patentId taken from the query parameter 'patentId' of the current URL
         */
        patentId(): string {
            return (this.$route.query.patentId as string) || '';
        },
        /**
         * Returns the searchTerms from the store
         */
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        /**
         * Returns the extended patent from the store
         */
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentId];
        },
        /**
         * Returns the patent family from the store
         */
        family(): Patent[] {
            return this.$store.state.patentFamilies[this.patentId];
        },
        /**
         * Returns the saved patents count from the store
         */
        savedPatentsCount(): string {
            const items = Object.keys(this.$store.state.savedPatents).length;
            if (items === 0) {
                return '';
            }

            return items.toString();
        },
    },
    async created() {
        // check the url to make sure the query params are applied
        this.checkUrl();

        // if no patent is available (after a refresh or sharing the link) the patent should be loaded
        if (!this.patent) {
            await this.loadPatent();
        }

        // if no family is available (after a refresh or sharing the link) it should be loaded
        if (!this.family) {
            await this.loadFamily();
        } else {
            this.explorationAvailable = true;
        }

        // load documents for the patent
        await this.loadDocuments();
    },
    methods: {
        /**
         * Attempts to take the user back to the previous page
         */
        goBack(): void {
            this.$router.back();
        },

        /**
         * Highlights keywords in a text
         * @param text
         * @param keywords
         */
        highlightText(text = '', keywords = [] as string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return text.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },

        /**
         * Opens the saved page
         */
        openSavePage(): void {
            this.$router.push({ path: '/saved' });
        },

        /**
         * Loads a patent from the backend
         */
        async loadPatent() {
            // if no patent id is present we can return
            if (!this.patentId) return;

            this.$store.commit('SHOW_LOADING_BAR');

            try {
                const patent = await this.patentService.get(this.patentId);

                this.$store.commit('STORE_PATENT', { patent, searchTerms: this.searchTerms });
            } catch (err) {
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Loads the family of the current patent
         */
        async loadFamily() {
            // if no exploration button should be shown we don't need to load the data
            const extPatent = this.patent as ExtendedPatent;

            if (!extPatent) return;

            this.$store.commit('SHOW_LOADING_BAR');

            try {
                const family = await this.patentService.queryFamily(this.patentId);
                this.$store.commit('STORE_FAMILY', { patentId: this.patentId, family });
                this.explorationAvailable = true;
            } catch (err) {
                console.error(err);
                this.explorationAvailable = false;
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Opens the document view and passes the document as a query parameter
         * @param document  The document that should be opened
         */
        openDocument(document: DocumentInformation) {
            const routeData = this.$router.resolve({
                name: 'Document',
                query: {
                    document: btoa(JSON.stringify(document)),
                    patentId: (this.patent as ExtendedPatent).patent.id,
                    page: 1,
                },
            });

            window.open(routeData.href, '_blank');
        },

        /**
         * Loads the documents for the current patent from the backend
         */
        async loadDocuments() {
            this.$store.commit('SHOW_LOADING_BAR');

            try {
                this.documents = await this.documentService.query(this.patentId);
            } catch (err) {
                this.noDocuments = true;
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Opens the exploration mode for a patent
         */
        openExploration() {
            const patent = this.patent as ExtendedPatent;

            this.$store.commit('STORE_PATENT', patent);

            this.$router.push({
                path: '/explore',
                query: { patentId: patent.patent.id, searchTerms: patent.searchTerms },
            });

            // finally hide the dialog mask since otherwise it would blur the exploration mode
            this.$store.commit('HIDE_DIALOG_MASK');
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
    },
});
</script>

<style lang="scss" scoped>
.patent-page {
    height: 100vh;
    width: 100%;
}
.patent-controls {
    position: sticky;
    top: 0;
    left: 0;
    width: 500px;
    display: flex;
    gap: 20px;
    padding: 20px;
}
.patent-container {
    width: 500px;
    height: 300px;
    max-height: 400px;
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
.patent-title {
    text-align: left;
    padding-left: 40px;
    font-weight: bold;
    font-size: 25px;
}
.patent-owner {
    padding-bottom: 70px;
    padding-top: 10px;
    padding-left: 40px;
    text-align: left;
    font-size: 15px;
}
.patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-left: 40px;
    padding-right: 40px;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    padding-bottom: 70px;
    overflow-y: auto;
}
.patent-info {
    display: flex;
    width: 100%;
    gap: 120px;
    padding-left: 40px;
    padding-bottom: 50px;
    text-align: justify;
}
.inventors-list {
    transform: translateX(20px);
}
.footer-container {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 40px;
    justify-content: space-between;
    padding-bottom: 5vh;
}

.patent-additional-info {
    display: flex;
    flex-grow: 1;
    gap: 40px;
}
.attachments {
    display: flex;
    flex-direction: column;
}
.label-attachment {
    text-align: left;
    transform: translateX(10px);
    font-size: 20px;
}

.attachment-items {
    display: flex;
}
.attachment {
    border: 1px solid #cccccc;
    box-sizing: border-box;
    border-radius: 10px;
    width: 250px;
    height: 146px;
    padding: 10px;
}

.keywords {
    display: flex;
    flex-direction: column;
}

.keyword-chips {
    display: flex;
    margin: 6px 12px 6px 40px;
}

.label-keywords {
    display: inline-flex;
    align-items: flex-start;
    font-size: 20px;
    text-align: left;
    padding-left: 40px;
}

.btn-exploration {
    width: 230px;
    display: flex;
    align-items: flex-end;
    margin-right: 20px;
}

.patent-container {
    width: 100%;
    height: 100%;
    padding: 5vh 5vw;
}
</style>
