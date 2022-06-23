# OCI Multiplayer Game

This is a Three.js "game" with a multiplayer feature using WebSockets.

![Screenshot](images/screenshot.png)

ARCHITECTURE DIAGRAM GOES HERE

## Requirements

- Oracle Cloud Infrastructure account
- OCI CLI, Terraform and Ansible configured.

## TODO

Improvements:
- Use private subnets
- Save state
- Score board
- Rewards (achivements for x)
- auth/authz
- Analytics (data points, latency, etc)
- Migrate to Kubernetes
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

Export an environment variable with the base directory:
```
export BASE_DIR=$(pwd)
```

## Build

Build the frontend static content.

Change directory to the frontend code:
```
cd $BASE_DIR/web
```

> NOTE: For the next step, make sure you have an up-to-date version of Node.js
> Use `node -v` to check it, is the version >= 14?

Install dependencies:
```
npm install
```

Build the static content:
```
npm run build
```

## Deployment

Change directory to `deploy/terraform`:
```
cd $BASE_DIR/deploy/terraform
```

Authenticate with OCI, it will open a browser where you can log in:
```
oci session authenticate
```

Input the region, and an a session name. You will use that in the `terraform.tfvars` in the next step.

Copy the template for the terraform variables:
```
cp terraform.tfvars.template terraform.tfvars
```

Edit the variables values:
```
vim terraform.tfvars
```

You have to modify:
- `config_file_profile` from the `oci session` command
- `tenancy_ocid` from your OCI tenancy
- `compartment_ocid` the compartment you want, or root compartment (that is the `tenancy_ocid`)
- `ssh_public_key` with your public SSH key, usually in `~/.ssh/id_rsa.pub`

Initialize the terraform provider:
```
terraform init
```

Apply the infrastructure, with auto approval:
```
terraform apply -auto-approve
```


Inside the `deploy/terraform` directory

```
terraform init
```

```
terraform apply -auto-approve
```

Provision with Ansible:
```
ansible-playbook -i generated/app.ini ../ansible/site.yaml
```

> NOTE: You will be asked a few times:
> `Are you sure you want to continue connecting (yes/no/[fingerprint])?`
> Type `yes` and `[ENTER]`.

Print the load balancer IP from the terraform output again:
```
terraform output lb_public_ip
```

Copy and paste the IP on your browser.

## Clean Up

Destroy all the infrastructure:
```
terraform destroy -auto-approve
```
