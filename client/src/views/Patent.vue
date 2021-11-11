<template>
    <div class="patent-page">
        <div class="patent-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        </div>

        <div class="top-controls">
            <Button
                btnText="Saved"
                iconKey="turned_in"
                :badge-value="savedPatentsCount"
                v-on:on-clicked="openSavePage"
            />
        </div>

        <div class="patent-title" v-html="highlightTitle(this.patent.patent.title, this.patent.searchTerms)"></div>
        <div class="patent-owner">
            <span v-for="(applicant, index) in patent.patent.applicants" :key="index">
                {{ applicant }}
                <span v-if="index !== patent.patent.applicants.length - 1">, </span>
                <span v-if="index <= patent.patent.applicants.length - 1"> </span>
            </span>
        </div>
        <div class="patent-abstract">
            <h1>Abstract</h1>
            <div v-html="highlightAbstract(this.patent.patent.abstract, this.patent.searchTerms)"></div>
        </div>

        <div class="patent-info">
            <div>
                <h3>Inventors</h3>
                <ul class="inventors-list">
                    <li v-for="(inventor, index) in patent.patent.inventors" :key="index">{{ inventor }}</li>
                </ul>
            </div>
            <div>
                <h3>Applicants</h3>
                <ul class="inventors-list">
                    <li v-for="(applicant, index) in patent.patent.applicants" :key="index">{{ applicant }}</li>
                </ul>
            </div>
        </div>
        <div class="patent-additional-info">
            <div class="keywords">
                <div class="label-keywords">Searched keywords:</div>
                <span class="keyword-chips">
                    <Chip
                        v-for="(keyword, index) in patent.searchTerms"
                        :key="index"
                        :has-action="false"
                        :text="keyword"
                    ></Chip>
                </span>
            </div>
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
            </div>

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
export default defineComponent({
    name: 'Patent',
    components: { RoundButton, Attachment, Button, Chip },
    data() {
        return {
            patentService: new PatentService(),
            documents: null as DocumentInformation[] | null,
            documentService: new DocumentService(),
            noDocuments: false,
            explorationAvailable: false,
        };
    },
    computed: {
        patentID(): string {
            return (this.$route.query.patentId as string) || '';
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentID];
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
        if (!this.patent) {
            await this.loadPatent();
        }
        await this.loadDocuments();
        await this.loadFamily();
    },
    // async mounted() {
    //     await this.loadDocuments();
    // },
    methods: {
        /**
         * Attempts to take the user back to the previous page
         */
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            this.$router.back();
        },
        highlightTitle(title: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return title.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },
        highlightAbstract(abstract: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return abstract.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },
        openSavePage(): void {
            this.$router.push({ path: '/saved' });
        },
        async loadPatent() {
            if (!this.patentID) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const patent = await this.patentService.get(this.patentID);
                console.log(this.patentID);

                this.$store.commit('STORE_PATENT', { patent, searchTerms: this.searchTerms });
            } catch (err) {
                console.error(err);
            }
            this.$store.commit('HIDE_LOADING_BAR');
        },
        async loadFamily() {
            // if no exploration button should be shown we don't need to load the data

            const extPatent = this.patent as ExtendedPatent;

            if (!extPatent) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const family = await this.patentService.queryFamily(extPatent.patent.id);

                this.$store.commit('STORE_FAMILY', { patentId: extPatent.patent.id, family });
                this.explorationAvailable = true;
            } catch (err) {
                console.error(err);
                this.explorationAvailable = false;
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },
        /**
         * Opens the document view and passes the document as a query parameter
         * @param document
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
         * Loads the documents for the current patent
         */
        async loadDocuments() {
            // if a new patent is available load the documents for it
            this.$store.commit('SHOW_LOADING_BAR');
            try {
                this.documents = await this.documentService.query((this.patent as ExtendedPatent)?.patent?.id);
            } catch (err) {
                this.noDocuments = true;
                console.error(err);
            }
            this.$store.commit('HIDE_LOADING_BAR');
        },
        openExploration() {
            const patent = this.patent as ExtendedPatent;

            //TODO: Save current state in vuex store
            this.$store.commit('STORE_PATENT', patent);

            this.$router.push({
                path: '/explore',
                query: { patentId: patent.patent.id, searchTerms: patent.searchTerms },
            });
            this.$store.commit('HIDE_DIALOG_MASK');
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
    font-size: 30px;
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
    font-size: 20px;
    padding-bottom: 70px;
    overflow-y: auto;
}
.patent-info {
    display: flex;
    width: 100%;
    gap: 120px;
    padding-left: 40px;
    padding-bottom: 100px;
    text-align: justify;
}
.inventors-list {
    transform: translateX(25px);
}
.applicant-list {
    transform: translateX(200px);
}

.patent-additional-info {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    gap: 100px;
}
.attachments {
    display: flex;
    flex-direction: column;
    width: 90vw;
}
.label-attachment {
    text-align: left;
    transform: translateX(10px);
    font-size: 30px;
}

.attachment-items {
    display: flex;
    padding-top: 30px;
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
    font-size: 30px;
    text-align: left;
    padding-left: 40px;
}

.btn-exploration {
    width: 300px;
    display: flex;
    padding-top: 60px;
}
</style>
