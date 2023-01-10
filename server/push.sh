#!/bin/bash

get_region_long_name() {
    region="${1:-FRA}"
    uppercase_region=${region^^}
    filter='.[] | select(.key | contains("'
    filter+=$uppercase_region
    filter+='")) | .name'
    oci iam region list --query data | jq "$filter"
}


get_region_long_name

server_version=$(npm version --json | jq ".server" | tr -d "\"")

tenancy_namespace=$(oci os ns get --query data | tr -d "\"")

echo Docker Login:
echo "docker login -u $tenancy_namespace/email@address.com ${region,,}.ocir.io"
local_image=multiplayer/server:$server_version
remote_image=fra.ocir.io/$tenancy_namespace/multiplayer/server:$server_version
docker tag $local_image $remote_image
echo Local Image $local_image tagged as $remote_image
docker push $remote_image