<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

#DuckDuckPatent API

## Description
This folder contains the source files for the backend of DuckDuckPatent

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Running the term-suggestion service (word2vec)
After unziping the given project file (not included in this repo), follow the instructions included in the README.md 
Set the `SUGGESTIONS_API_URL` env variable in `.env` to where the address the docker file is mapped to. (For example: `http://localhost:8100`)
```
$ docker build -t word2vec .
$ docker run -p 8100:80 word2vec:latest
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```