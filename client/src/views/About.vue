<template>
    <div class="about container">
        <div class="about-wrapper">
            <div class="section">
                <h1>About</h1>
            </div>

            <Divider align="left">
                <Chip :has-action="false" text="What is this?" class="divider-label"></Chip>
            </Divider>

            <div class="section">
                <div class="text-wrapper">
                    <!-- About -->
                    <div class="about-text">
                        Duckduckpatent is an innovative patent search engine which is designed for researchers,
                        exploring the world of patents! The visualization of patents and related entities allows you to
                        quickly get an overview of your search result. Additional information (e.g. Inventors,
                        Applicants or Citations) can be dynamically added to the visualization by the user.
                    </div>
                </div>
                <div class="about-btn">
                    <ChipButton text="Start exploring!" icon-key="explore" v-on:on-select="$router.push('/')">
                    </ChipButton>
                </div>
            </div>
            <div class="section">
                <Divider align="left">
                    <Chip :has-action="false" text="Contributors" class="divider-label"></Chip>
                </Divider>
                <div class="about-contributors">
                    <!-- About -->
                    <div class="column">
                        <a
                            :href="contributor.ghProfile"
                            target="_blank"
                            class="contributor card box-shadow"
                            v-for="(contributor, index) of contributors"
                            :key="index"
                        >
                            <div class="contributor-icon">
                                <img :src="contributor.avatarUrl" :alt="contributor.name" />
                            </div>
                            <div class="contributor-name">{{ contributor.name }}</div>
                        </a>
                    </div>
                </div>
            </div>
            <Divider></Divider>
            <div class="section">
                <div class="cooperation">
                    <div>In cooperation with</div>
                    <div class="logos">
                        <div id="thu-logo">
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/e/e0/THU_Logo_Subline_deutsch_RGB.png"
                                alt="THU Logo"
                            />
                        </div>
                        <div class="partner-logo">
                            <img
                                src="https://exxcellent.de/app/uploads/2021/02/eXXcellent-solutions-logo.svg"
                                alt="exxcellent logo"
                                style="color: black"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Chip from '@/components/Chip.vue';
import ExplorationHelperService from '@/services/exploration-helper.service';
import ChipButton from '@/components/ChipButton.vue';

export default defineComponent({
    name: 'About.vue',
    components: {
        Chip,
        ChipButton,
    },
    mounted() {
        // adds the loading screen for 0.5s
        this.$store.commit('SHOW_LOADING_SCREEN');
        setTimeout(() => {
            this.$store.commit('HIDE_LOADING_SCREEN');
        }, 800);
    },
    data() {
        return {
            contributors: ExplorationHelperService.shuffle([
                {
                    name: 'icicala',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/34209362?v=4',
                    ghProfile: 'https://github.com/icicala',
                },
                {
                    name: 'fiordidoma',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/35006400?v=4',
                    ghProfile: 'https://github.com/fiordidoma',
                },
                {
                    name: 'micahh2',
                    avatarUrl:
                        'https://camo.githubusercontent.com/f43d4cf8180884493e328a1bdd38015088bfc07d81cf1972f5c7a1f99831190e/68747470733a2f2f312e67726176617461722e636f6d2f6176617461722f36633631313636366163323462366137396466656337643631383466333135623f643d68747470732533412532462532466769746875622e6769746875626173736574732e636f6d253246696d6167657325324667726176617461727325324667726176617461722d757365722d3432302e706e6726723d6726733d3330',
                    ghProfile: 'https://github.com/micahh2',
                },
                {
                    name: 'samuelhuebner',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/36863168?v=4',
                    ghProfile: 'https://github.com/samuelhuebner',
                },
                {
                    name: 'duaakelzi',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/73340604?v=4',
                    ghProfile: 'https://github.com/duaakelzi',
                },
                {
                    name: 'AlbinaMuzafarova',
                    avatarUrl: 'https://avatars.githubusercontent.com/u/36408342?v=4',
                    ghProfile: 'https://github.com/AlbinaMuzafarova',
                },
            ]),
        };
    },
});
</script>

<style lang="scss">
.about {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-height: 100vh;
    overflow: scroll;
}

.about-wrapper {
    margin: 2rem;
    width: 70vw;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.about-contributors {
    display: flex;
    width: 100%;
    justify-content: center;
}

.about-text {
    width: 50vw;
}

.section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.column {
    max-width: 800px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.contributor {
    display: flex;
    align-items: center;
    gap: 2rem;
    width: 20rem;
    transition: all 0.2s linear;
    text-decoration: none;
    color: unset;
}

.contributor:hover {
    transform: scale(1.1);
    box-shadow: 3px 3px 10px rgba(227, 88, 88, 0.22);
}

.contributor-icon {
    height: 2.5rem;
    border-radius: 90px;
    overflow: hidden;
    img {
        height: 100%;
    }
}

.text-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
}

.partner-logo {
    height: 2.8rem;
    img {
        height: 100%;
        filter: invert(1);
    }
}

.cooperation {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 4rem;
    justify-content: center;
}

#thu-logo {
    width: 10rem;
    img {
        width: 100%;
    }
}

.logos {
    display: flex;
    align-items: center;
    gap: 2rem;
}

@media screen and (max-width: 900px) {
    .about-wrapper {
        width: 95vw;
    }

    .about-text {
        width: 90vw;
    }

    .cooperation,
    .logos {
        flex-direction: column;
    }

    .about-btn {
        justify-content: center !important;
    }
}

.about-btn {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;

    div {
        height: 8px;
    }
}
</style>
