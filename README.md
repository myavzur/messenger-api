<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->



## Running with Docker 🐋

```bash
# Build image for the first time
$ sudo docker-compose build

# Run existing image for next times
$ sudo docker-compose up -d
```

## Developing 👨🏻‍💻

(with default `.env`)

### Instal necessary packages for effective develop 📈
```bash
# Use version of node specified in .nvmrc before adding new deps to project
$ nvm use

# When version of node is correct, use command for clean install with usage of package-lock.json
$ npm ci
```

### Terminology 📘
- **Local Chat** - `Chat` between only 2 users, flag `is_group = true`
- **Group Chat** - `Chat` between 2+ users, flag `is_group = false`
- **Any Chat** - **Local Chat** or **Group Chat**

### Software ⚙️

- _`RabbitMQ`_ is running on default `5672` port
- _`PostgreSQL`_ is running on default `5432` port
- _`Redis`_ is running on default `6379` port


### GUI 💻

- [HTTP:15672](http://localhost:15672) - _`RabbitMQ - Management`_
- [HTTP:15432](http://localhost:15432) - _`PostgreSQL Admin`_
  - [x] Disabled. Uncomment line for `postgres_admin` in `docker-compose.yml` to enable.
  - [] Enabled

### Protocols of Microservices 🖥

- [HTTP:4000](http://localhost:4000) - _`API Gateway`_
- [AMQP](#) - _`Authorization`_
- [WS:5000](#) | [AMQP](#) - _`Presence`_
- [WS:6000](#) | [AMQP](#) - _`Chat`_

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
