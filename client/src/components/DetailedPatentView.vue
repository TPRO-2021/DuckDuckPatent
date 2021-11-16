<template>
    <!-- The prime vue dialog -->
    <Dialog
        v-model:visible="patentAvailable"
        :close-on-escape="true"
        :modal="true"
        v-on:hide="handleClose"
        :dismissable-mask="true"
    >
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container">
            <div class="settings-btn">
                <RoundButton class="round-btn" icon-key="more_horiz" @click="isSubMenuOpen = !isSubMenuOpen" />
            </div>

            <div class="settings-menu" v-if="isSubMenuOpen">
                <!--TODO: Add actions! Once all actions are added this can be moved to a computed property-->
                <RoundButton
                    v-if="isSavedPage"
                    class="round-btn"
                    icon-key="delete_forever"
                    v-on:on-clicked="onRemove"
                />
                <RoundButton
                    v-if="!isSavedPage && !isSaved"
                    class="round-btn"
                    icon-key="bookmark"
                    @click="this.savePatent"
                ></RoundButton>
                <RoundButton class="round-btn" icon-key="open_in_new" @click="this.showPatentPage" />
            </div>
        </div>

        <!-- patent title and first applicant -->
        <template #header>
            <div>
                <div
                    class="patent-title"
                    v-html="highlightText(this.extendedPatent.patent.title, this.extendedPatent.searchTerms)"
                ></div>
                <div class="patent-owner">
                    <span v-for="(applicant, index) in extendedPatent.patent.applicants" :key="index">
                        {{ applicant }}
                        <span v-if="index !== extendedPatent.patent.applicants.length - 1">, </span>
                        <span v-if="index <= extendedPatent.patent.applicants.length - 1"> </span>
                    </span>
                </div>
            </div>
        </template>

        <!-- Patent abstract -->
        <h3>Abstract</h3>
        <div
            class="patent-abstract"
            v-html="highlightText(this.extendedPatent.patent.abstract, this.extendedPatent.searchTerms)"
        ></div>

        <!-- Patent info (inventors, applicants) -->
        <div class="patent-info">
            <div>
                <h3>Inventors</h3>
                <ul class="inventors-list">
                    <li v-for="(inventor, index) in extendedPatent.patent.inventors" :key="index">{{ inventor }}</li>
                </ul>
            </div>
            <div>
                <h3>Applicants</h3>
                <ul class="inventors-list">
                    <li v-for="(applicant, index) in extendedPatent.patent.applicants" :key="index">{{ applicant }}</li>
                </ul>
            </div>
        </div>

        <!-- Footer containing searched keywords, attachments and exploration button -->
        <template #footer>
            <!-- Divide the card in 3 column:First column hold the attachments second the keywords and last the exploration button -->
            <div class="footer-container">
                <div class="patent-additional-info">
                    <!-- Searched keywords -->
                    <div class="keywords">
                        <div class="label-keywords">Searched keywords:</div>
                        <span class="keyword-chips">
                            <Chip
                                v-for="(keyword, index) in extendedPatent.searchTerms"
                                :key="index"
                                :has-action="false"
                                :text="keyword"
                            ></Chip>
                        </span>
                    </div>
                    <!-- patents attachments -->
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
                <!-- Exploration button -->
                <div class="column btn-exploration" v-if="explorationAvailable && showExploreBtn">
                    <Button icon-key="travel_explore" btn-text="Start exploration" @click="openExploration" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import Button from '@/components/Button.vue';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import DocumentService from '@/services/document.service';
import { DocumentInformation } from '@/models/DocumentInformation';
import Chip from '@/components/Chip.vue';
import Attachment from '@/components/Attachment.vue';
import PatentService from '@/services/patent.service';

/**
 * This component previews the content of a patent inside of a PrimeVue-Dialog overlay.
 *
 * Since it is displayed over other content it emits several events which can be used by the parent
 * component:
 *      - on-close (emitted when the dialog is closed)
 *      - on-open-exploration (emitted when the exploration button is clicked)
 *      - on-save-patent-detailed (emitted when the save-patent button is clicked)
 *      - remove-from-saved (emitted when the patent is removed from the saved page)
 */
export default defineComponent({
    name: 'DetailedPatentView',
    components: {
        Attachment,
        Button,
        Chip,
        RoundButton,
    },
    props: {
        extendedPatent: { type: Object },
        isSavedPage: {
            type: Boolean,
            default: false,
        },
        showExploreBtn: {
            type: Boolean,
            default: true,
        },
    },
    emits: {
        onClose: null,
        onOpenExploration: null,
        onSavePatentDetailed: (event: { patent: ExtendedPatent }) => event,
        removeFromSaved: null,
    },
    data() {
        return {
            documents: null as DocumentInformation[] | null,
            documentService: new DocumentService(),
            familyAvailable: false,
            index: 0,
            isSubMenuOpen: false,
            noDocuments: false,
            optionButtons: [{ iconKey: 'bookmark', action: this.savePatent }],
            pageDisplay: '',
            patentAvailable: false,
            patentService: new PatentService(),
            saved: true,
        };
    },
    watch: {
        /**
         * Watch the extendedPatent reference and load information when it changes
         * @param newVal    The new value of the extended patent
         */
        async extendedPatent(newVal: ExtendedPatent): Promise<void> {
            this.patentAvailable = !!newVal;

            if (!this.patentAvailable) {
                return;
            }

            // load documents and family for the patent
            await Promise.all([this.loadDocuments(), this.loadFamily()]);
        },
    },
    created() {
        // load the patents family when the component is created
        this.loadFamily();
    },
    unmounted() {
        // hide the dialog mask when the component is destroyed
        this.$store.commit('HIDE_DIALOG_MASK');
    },
    computed: {
        /**
         * Determines whether the exploration mode button should be displayed based on a family or citations
         * being available
         */
        explorationAvailable() {
            return this.familyAvailable || (this.extendedPatent || ({} as ExtendedPatent))?.patent.citations.length > 0;
        },
        /**
         * Determines whether the patent is saved
         */
        isSaved(): boolean {
            return (this.$store.state.savedPatents || {})[this.extendedPatent?.patent?.id];
        },
    },
    methods: {
        /**
         * Handles closing of the preview and also resets the "state" values
         */
        handleClose(): void {
            this.familyAvailable = false;
            this.patentAvailable = false;
            this.documents = null;
            this.noDocuments = false;
            this.$emit('onClose');
        },

        /**
         * Emits the save patent event and also closes the option menu
         */
        savePatent(): void {
            this.$emit('onSavePatentDetailed', { patent: this.extendedPatent as ExtendedPatent });
            this.isSubMenuOpen = false;
        },

        /**
         * Opens the patent page for the current patent inside of a new tab
         */
        showPatentPage(): void {
            const patent = this.extendedPatent as ExtendedPatent;
            this.$store.commit('STORE_PATENT', patent);

            const route = this.$router.resolve({
                path: '/patent',
                query: { patentId: patent.patent.id, searchTerms: patent.searchTerms },
            });

            window.open(route.href, '_blank');
            this.$store.commit('HIDE_DIALOG_MASK');
        },

        /**
         * Closes the modal and emits the removeFromSave event
         */
        onRemove(): void {
            this.patentAvailable = false;
            this.$emit('removeFromSaved');
        },

        /**
         * Highlights keywords in a provided text
         * @param title The text which should be highlighted
         * @param keywords  The keyword which should be highlighted
         */
        highlightText(title: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return title.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },

        /**
         * Opens the document view and passes the document as a query parameter
         * @param document  The document which should be opened
         */
        openDocument(document: DocumentInformation) {
            // create a route reference
            const routeData = this.$router.resolve({
                name: 'Document',
                query: {
                    document: btoa(JSON.stringify(document)),
                    patentId: (this.extendedPatent as ExtendedPatent).patent.id,
                    page: 1,
                },
            });

            // opens the route in a new tab
            window.open(routeData.href, '_blank');
        },

        /**
         * Loads the documents for the current patent
         */
        async loadDocuments() {
            this.$store.commit('SHOW_LOADING_BAR');

            try {
                this.documents = await this.documentService.query((this.extendedPatent as ExtendedPatent)?.patent?.id);
            } catch (err) {
                this.noDocuments = true;
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Loads the patent family of the current patent
         */
        async loadFamily() {
            // if no exploration button should be shown we don't need to load the data
            if (!this.showExploreBtn) {
                return;
            }

            const extPatent = this.extendedPatent as ExtendedPatent;

            if (!extPatent) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const family = await this.patentService.queryFamily(extPatent.patent.id);

                this.$store.commit('STORE_FAMILY', { patentId: extPatent.patent.id, family });
                this.familyAvailable = true;
            } catch (err) {
                console.error(err);
                this.familyAvailable = false;
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Opens the exploration page for a patent
         */
        async openExploration() {
            const patent = this.extendedPatent as ExtendedPatent;

            this.$store.commit('STORE_PATENT', patent);

            await this.$router.push({
                path: '/explore',
                query: { patentId: patent.patent.id, searchTerms: patent.searchTerms },
            });

            this.handleClose();
            this.$store.commit('HIDE_DIALOG_MASK');
        },
    },
});
</script>

<style lang="scss" scoped>
.settings-container {
    position: absolute;
    right: 24px;
    top: 36px;
    display: flex;
    flex-direction: column;
}

.round-btn {
    width: 32px;
    height: 32px;
}

.patent-title {
    text-align: left;
    padding-right: 42px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
}

.patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-right: 60px;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    padding-bottom: 24px;
    overflow-y: auto;
}

.patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}

.settings-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
}

.settings-button {
    margin-bottom: 14px;
}

.label-attachment {
    text-align: left;
    transform: translateX(10px);
}

.attachments {
    display: flex;
    flex-direction: column;
    margin: 10px;
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
.pdf-doc {
    display: inline-flex;
    background: rgba(196, 196, 196, 0.22);
    border: 1px solid #000000;
    box-sizing: border-box;
    width: 220px;
    height: 100px;
}
.name-doc {
    position: absolute;
    display: flex;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 240px;
    gap: 126px;
}
.material-icons {
    cursor: pointer;
}

.keywords {
    display: flex;
    flex-direction: column;
    margin: 10px;
}

.keyword-chips {
    display: flex;
    margin: 6px 10px 6px 0;
}

.label-keywords {
    display: flex;
    align-items: flex-start;
}

.btn-exploration {
    width: 230px;
    display: flex;
    align-items: flex-end;
}

.footer-container {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 40px;
    justify-content: space-between;
}

.patent-additional-info {
    display: flex;
    flex-grow: 1;
    gap: 40px;
}

.patent-info {
    display: flex;
    width: 100%;
    gap: 120px;
}

.inventors-list {
    transform: translateX(20px);
}
</style>
