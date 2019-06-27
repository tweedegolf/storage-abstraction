FROM docker.tgrep.nl/docker/node-10-stretch:latest

RUN apt-get -qq update && DEBIAN_FRONTEND=noninteractive apt-get -qq install --no-install-recommends -y \
        libpq-dev \
        python-dev \
    && rm -rf /var/lib/apt/lists/*
