# OCI Multiplayer Game

This is a Three.js "game" with a multiplayer backend using WebSockets ([socket.io](https://socket.io/)).

![Screenshot](images/screenshot.png)

## Requirements

- Oracle Cloud Infrastructure account
- OCI CLI installed and configured
- OCI Kubernetes Cluster
- `kubectl` configured
- OCI user with Auth Token
- Node.js

## Deployment Choices

- [Virtual Machines](./VM.md)
- [Container Instances](./CI.md)
- [Kubernetes](./K8S.md)

## TODO

Improvements:

- Scale number of backend
- WebWorker
- Create a stress test
- Water and boats with heading
- Waste Generator
- Winning logic
- Score board
- Analytics (data points, latency, etc)
- Add LogAnalytics
- Authentication?