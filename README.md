# OCI Multiplayer Game

This is a Three.js "game" with a multiplayer backend using WebSockets ([socket.io](https://socket.io/)).

![Screenshot](images/screenshot.png)

ARCHITECTURE DIAGRAM GOES HERE

## Requirements

- Oracle Cloud Infrastructure account
- OCI Kubernetes Cluster
- `kubectl` configured
- Node.js

## TODO

Improvements:

- Scale number of backend
- Save state
- Score board
- Rewards (achivements for x)
- auth/authz
- Analytics (data points, latency, etc)
- Add LogAnalytics

Scaling:

- Measure latency
- Create OCI Dashboard
- Create a stress test
- Scale backend
- WebWorker

## Set Up

### Kubernetes Cluster

Create a Kubernetes cluster through the OCI web console.

Follow [Creating a Kubernetes Cluster](https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke.htm).

Configure kubectl on Cloud Shell. Follow steps on Quick start on your Kubernetes Cluster.

### Clone repo

Clone this repository in your local machine:

```
git clone --branch k8s https://github.com/vmleon/oci-multiplayer.git
```

Change directory to the `oci-multiplayer`:

```
cd oci-multiplayer
```

## Build and Deployment

To complete the environment setup you need an Auth Token from OCI.

Export the variable `OCI_OCIR_TOKEN` for best practices. Otherwise the script will ask for the token.

You can also export `OCI_OCIR_USER` to the user (email) to login to the OCI container registry.

Set environment:
```bash
npx zx scripts/setenv.mjs
```

> This script will:
> - check dependencies
> - create self-signed certs, if needed
> - login to container registry
> - print components versions

Release the server:
```bash
npx zx scripts/release.mjs
```

Answer: `server`

Release the web:
```bash
npx zx scripts/release.mjs
```

Answer: `web`

Prepare deployment to Kubernetes:
```bash
npx zx scripts/deploy.mjs
```

Apply deployment:
```bash
kubectl apply -k deploy/k8s/overlays/prod
```

Get the Public IP of the load balancer
```bash
kubectl -n ingress-nginx get svc
```


## Clean Up

Destroy all the infrastructure:

```
kubectl delete -k deploy/k8s/overlays/prod
```

> TODO delete container images on OCI registry