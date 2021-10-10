<template>
    {{ terms }}
    <div>
        <h1>ifo</h1>
        <table class="table table-bordered">
            <thead class="thead-dark">
                <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Date</th>
                    <th scope="col">abstract</th>
                    <th scope="col">Full Text</th>
                    <th scope="col">Citation</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="inff in info" :key="inff.id">
                    <td>{{ inff.title }}</td>
                    <td>{{ inff.date }}</td>
                    <td>{{ inff.abstract }}</td>
                    <td>{{ inff.fulltext }}</td>
                    <td>{{ inff.citations }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Results',

    data() {
        return {
            info: [] as string[],
            terms: [] as string[],
        };
    },
    async created() {
        this.terms = this.$route.query.terms as string[];
        let queryString = '';

        this.terms.forEach((term, index) => {
            if (index === 0) {
                queryString = `keywords=${term}`;
                return;
            }

            queryString += `&keywords=${term}`;
        });

        const response = await fetch(`http://localhost:3000/patents?${queryString}`, { method: 'GET' });
        this.info = (await response.json()) as string[];
    },
});
</script>

<style lang="scss" scoped>
.table {
    border: 1px solid black;
    width: 100%;
    margin-bottom: -48px;
}
.thead-dark {
    border: 1px solid black;
    width: 100%;
}
</style>
