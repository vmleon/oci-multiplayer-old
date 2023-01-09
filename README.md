# OCI Multiplayer Game

This is a Three.js "game" with a multiplayer backend using WebSockets ([socket.io](https://socket.io/)).

![Screenshot](images/screenshot.png)

ARCHITECTURE DIAGRAM GOES HERE

## Requirements

- Oracle Cloud Infrastructure account
- OCI CLI, Terraform and Ansible configured.

## TODO

Improvements:

- Migrate to Kubernetes
- Scale number of backend
- Use private subnets
- Save state
- Score board
- Rewards (achivements for x)
- auth/authz
- Analytics (data points, latency, etc)
- Add LogAnalytics
- GraalVM

Scaling:

- [Redis Adaptor for Socket.io](https://socket.io/docs/v4/redis-adapter/); [Examples](https://github.com/socketio/socket.io/tree/master/examples)
- Add in-memory Db
- Measure latency
- Create OCI Dashboard
- Create a stress test
- Scale backend
- WebWorker

## Set Up

Clone this repository in your local machine:

```
git clone https://github.com/vmleon/oci-multiplayer.git
```

Change directory to the `oci-multiplayer`:

```
cd oci-multiplayer
```

## Build and Deployment

Change to directory `deploy/terraform`:

```
cd deploy/terraform
```

Copy the template for the terraform variables:

```
cp terraform.tfvars.template terraform.tfvars
```

Edit the variables values:

```
vim terraform.tfvars
```

You have to modify:

- `tenancy_ocid` from your OCI tenancy
- `compartment_ocid` the compartment you want, or root compartment (that is the `tenancy_ocid`)
- `ssh_public_key` with your public SSH key, usually in `~/.ssh/id_rsa.pub`

Run the script:

```
./start.sh
```

The final output will show the Public IPs.

Copy and paste the `lb_public_ip` IP address on your browser.

## Clean Up

Destroy all the infrastructure:

```
./stop.sh
```
