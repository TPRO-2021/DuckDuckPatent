<p align='center'>
    <a href="https://duckduckpatent.com">
        <img src="https://duckduckpatent.com/img/logo.0d3137d9.svg" alt="DuckDuckPatent">
    </a>
</p>
<h1 align="center">Explore the world of patents in new ways!</h1>

<p align="center">
    <a href="https://github.com/TPRO-2021/DuckDuckPatent/actions/workflows/ci.yml">
        <img src="https://img.shields.io/github/workflow/status/TPRO-2021/duckduckpatent/CI?label=CI&logo=github" alt="tag" /></a>
    <a href="https://github.com/TPRO-2021/DuckDuckPatent/actions/workflows/cd.yml">
        <img src="https://img.shields.io/github/workflow/status/TPRO-2021/duckduckpatent/CD?label=CD&logo=github" alt="tag" /></a>
    <a href="https://github.com/TPRO-2021/DuckDuckPatent/releases">
        <img src="https://img.shields.io/github/release/TPRO-2021/duckduckpatent.svg?logo=github" alt="release" /></a>
    <a href="https://github.com/TPRO-2021/DuckDuckPatent/graphs/contributors">
        <img src="https://img.shields.io/github/contributors/TPRO-2021/duckduckpatent.svg" alt="contributors" /></a>
    <a href="https://nodejs.org/">
        <img src="https://img.shields.io/badge/Node.js-v14.18-informational?logo=node.js&logoColor=white" alt="Vue.js" /></a>
    <br>
    <a href="https://vuejs.org/">
        <img src="https://img.shields.io/badge/Vue.js-v3.0.0-informational?logo=vue.js" alt="Vue.js" /></a>
    <a href="https://nestjs.com/">
        <img src="https://img.shields.io/badge/NestJS-v8.0.0-informational?logo=nestjs" alt="NestJS" /></a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/TypeScript-informational?logo=typescript&logoColor=white" alt="Typescript" /></a>
</p>

**DuckDuckPatent** is an innovative patent search engine which is designed for researchers, exploring the world of
patents! The visualization of patents and related entities allows you to quickly get an overview of your search result.
Additional information (e.g. Inventors, Applicants or Citations) can be dynamically added to the visualization by the
user.

Try it out [here](https://duckduckpatent.com)!

# Deployment

## Requirements

* NodeJS v14.18 or later
* [OPS-Developer Account](https://developers.epo.org/user/register)
* Running KeywordSuggestion-API Docker container

## Preparing client & server

* Run `npm install` in the `client` and `server` directories
* Inside the `server` directory run the command `cp .env.example .env` and add the environment variables in the newly
  copied file:
    * `OPS_CONSUMER_KEY` and `OPS_CONSUMER_SECRET` should be adapted from the OPS Developer portal
    * `PATENT_API_URL` should be the base-endpoint of the used PatentAPI
    * `SUGGESTIONS_API_URL` should be the endpoint of the keywords suggestion API

## Building and deploying client & server

* Inside the client directory run `npm run build`. After finishing, the files for the frontend should be located in
  the `client/dist/` folder and can be copied to a webservers root location of your choice
* Inside the server directory run `npm run build`. After finishing, the server can be started using the
  command `node ./dist/main.js`
