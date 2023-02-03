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

Clone this repository in your local machine:

```
git clone https://github.com/vmleon/oci-multiplayer.git
```

Change directory to the `oci-multiplayer`:

```
cd oci-multiplayer
```

## Build and Deployment

Create certs:
```
npx zx scripts/gen_certs.mjs
```

Deploy server:
```bash
npx zx scripts/release.mjs
```

Answer: `server`
Answer: `patch`

Deploy web:
```bash
npx zx scripts/release.mjs
```

Answer: `web`
Answer: `patch`

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
./stop.sh
```
