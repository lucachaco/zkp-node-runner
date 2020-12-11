FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="shindu666@gmail.com"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update && apt-get install --yes geth
RUN apt-get install bootnode
RUN adduser --disabled-login --gecos "" eth_user

COPY eth_common /home/eth_user/eth_common
RUN chown -R eth_user:eth_user /home/eth_user/eth_common

USER eth_user

WORKDIR /home/eth_user

RUN geth init eth_common/master-genesis.json
RUN ./eth_common/setup_account
RUN cp /home/eth_user/eth_common/UTC--2019-09-09T22-13-02.168739674Z--0c1c28336f5f256bd6657215f00ee83121e51336 /home/eth_user/.ethereum/keystore

