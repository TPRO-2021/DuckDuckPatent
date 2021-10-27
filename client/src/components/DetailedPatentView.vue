<template>
    <div class="card">
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container">
            <div class="settings-btn">
                <RoundButton class="round-button" icon-key="more_horiz" @click="isSubMenuOpen = !isSubMenuOpen" />
            </div>

            <div class="settings-menu" v-if="isSubMenuOpen">
                <RoundButton
                    v-for="(option, index) in optionButtons"
                    :key="index"
                    class="round-button"
                    :icon-key="option.iconKey"
                    @click="option.action"
                />
            </div>
        </div>

        <div class="patent-info">
            <div class="patent-title">here is the title of patent</div>

            <!-- TODO: Add applicant/owner of the patent -->
            <div class="patent-owner">Company/Author</div>

            <div class="patent-abstract">
                The description of patentue recommends using templates to build your HTML in the vast majority of cases.
                There are situations however, where you really need the full programmatic power of JavaScript. That’s
                where you can use the render function, a closer-to-the-compiler alternative to templates. ue recommends
            </div>
        </div>
        <!-- Divide the card in 3 column:First column hold the attachments second the keywords and last the exploration button -->
        <div class="row">
            <div class="column">
                <div class="label-attachment">Attachments</div>

                <div class="attachments">
                    <iframe class="pdf-doc" src="" title="info.pdf" />

                    <div class="name-doc">
                        info.pdf
                        <div>
                            <span class="material-icons"> open_in_new </span>
                            <span class="material-icons"> file_download</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="column">
                <span class="keywords label-keywords">Searched keywords:</span>
                <span class="keywords">Soil, Energy </span>
            </div>
            <div class="column btn-exploration"><Button icon-key="travel_explore" btn-text="Start exploration" /></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import Button from '@/components/Button.vue';
import { Patent } from '@/models/Patent';

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'DetailedPatentView',
    components: { RoundButton, Button },
    props: {
        patent: { type: Object },
    },
    emits: {},
    data() {
        return {
            pageDisplay: '',
            isSubMenuOpen: false,
            index: 0,
            saved: true,
            /**
             * Holds the submenu buttons
             */
            optionButtons: [
                { iconKey: 'push_pin', action: 'save' },
                { iconKey: 'visibility_off', action: 'dontLike' },
                { iconKey: 'done', action: 'like' },
            ],
        };
    },
    computed: {
        savedPatents(): Patent[] {
            return this.$store.state.savedPatents;
        },
        searchPage(): boolean {
            return this.$route.path == '/search';
        },
    },
    methods: {
        save(event: { index: number; value: Patent }): void {
            if (this.saved) {
                this.$store.commit('ADD_SAVED_PATENT', event);
                this.saved = !this.saved;
            } else {
                this.$store.commit('REMOVE_SAVED_PATENT', event);
                this.saved = !this.saved;
            }
        },
        optionButton(): void {
            if (!this.searchPage) {
                this.optionButtons = this.optionButtons.filter((iconKey, action) => action !== 1);
            }
        },
    },
});
</script>

<style scoped>
.card {
    display: flex;
    flex-direction: column;
    height: 70vh;
    width: 70vw;
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
    transform: translateX(20%) translateY(10%) !important;
    backdrop-filter: blur(4px);
    padding: 30px 30px;
}

.settings-container {
    position: absolute;
    right: 28px;
    top: 28px;
    display: flex;
    flex-direction: column;
}

.round-button {
    width: 28px;
    height: 28px;
}

.patent-info {
    justify-content: start;
    transition: 0.5s;
    margin: 8px;
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
    margin-bottom: 14px;
    max-height: 250px;
    width: 98%;
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
}

.settings-btn {
    margin-bottom: 14px;
}

.label-attachment {
    text-align: left;
    margin: 15px 0;
}
.attachments {
    position: absolute;
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
.column {
    float: left;
    width: 33.33%;
}

.keywords {
    display: block;
    text-align: left;
    padding-left: 124px;
}
.label-keywords {
    padding-top: 15px;
}
.btn-exploration {
    width: 230px;
    margin-top: 150px;
    margin-left: 120px;
}
</style>
