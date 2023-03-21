# Kubernetes Deployment

## Set Up

### Kubernetes Cluster

Create a Kubernetes cluster through the OCI web console.

Follow [Creating a Kubernetes Cluster](https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke.htm).

Configure kubectl on Cloud Shell. Follow steps on Quick start on your Kubernetes Cluster.

### Autonomous Database

Create an Autonomous database. Write down db name, and password.

### Clone repo

Clone this repository in your local machine:

```
git clone https://github.com/vmleon/oci-multiplayer.git
```

Change directory to the `oci-multiplayer`:

```
cd oci-multiplayer
```

## Build and Deployment

To complete the environment setup you need an Auth Token from OCI.

Export the variable `OCI_OCIR_TOKEN` for best practices. Otherwise the script will ask for the token.

> Keep the double quotes to escape the token

```bash
export OCI_OCIR_TOKEN="[your_auth_token]"
```

You can also export `OCI_OCIR_USER` to the user (email) to login to the OCI container registry.

```bash
export OCI_OCIR_USER=[your_email]
```

Score backend use Oracle Autonomous Database, to find it we need compartment, name and the password you set at creation time.

```bash
export ADB_COMPARTMENT_NAME=[comapartmentName]
```

```bash
export ADB_NAME=[Autonomous DB name]
```

```bash
export ADB_PASSWORD="[Autonomous DB password]"
```

Set environment:
```bash
npx zx scripts/setenv.mjs
```

> This script will:
> - check dependencies
> - create self-signed certs, if needed
> - login to container registry
> - print components versions

Release all components:
```bash
npx zx scripts/release.mjs -a
```

Run the setup for the deployment:
```bash
npx zx scripts/deploy.mjs
```
When the output says:
> Ready to deploy.
> Run: kubectl apply -k deploy/k8s/overlays/prod

You can run the kubectl apply:
```bash
kubectl apply -k deploy/k8s/overlays/prod
```

Get the Public IP of the load balancer
```bash
kubectl -n ingress-nginx get svc
```

## Develop

Change the code, and bump the version of the component:

Web:
```bash
npx zx scripts/bump.mjs web
```

Web Socket Server:
```bash
npx zx scripts/bump.mjs server
```

Score Backend:
```bash
npx zx scripts/bump.mjs score
```

Run release script for the component to push the new image.
```bash
npx zx scripts/release.mjs [component]
```

Update `deploy/k8s/overlays/prod/kustomization.yaml` to the new version for the component.

Redeploy with:
```bash
kubectl apply -k deploy/k8s/overlays/prod
```

## Clean Up

Destroy all the infrastructure:

```
kubectl delete -k deploy/k8s/overlays/prod
```

> TODO delete container images on OCI registry

To run in dev mode:
Server:
```
export REDIS_PASSWORD=fk3ampeHq
zx scripts/start_redis.mjs
cd server && npm start
```

Client:
```
cd web
npm run dev
```

Make sure you change the local ip for localhost on the browser.

Can you add the steps to run on dev in the README?