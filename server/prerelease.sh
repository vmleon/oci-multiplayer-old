#!/bin/bash

server_version=$(npm version prerelease)
docker build . -t multiplayer/server:$server_version