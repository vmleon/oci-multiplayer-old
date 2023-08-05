# Enhance the application architecture

## Introduction
In this lab, we will enhance our application to continue moving toward a more Cloud Native design. For this, an autonomous database will be deployed, new application components will be added, and the entire solution will be deployed to Oracle Container Engine for Kubernetes (OKE).

![OKE Logo](images/oke.png)

Estimated Lab Time: 15 minutes

### Objectives

In this lab, you will complete the process of deploying the application on a Kubernetes Cluster in Oracle Cloud. The deployment process utilizes some scripts, `kubectl` and manual deployment of a Database and Kubernetes Cluster through the UI. With that, you will know how to deploy your applications in many different ways.

## Task 1: Create OKE Cluster with Virtual Nodes

1. Minimize Cloud Shell and navigate to **`Developer Services`** -> **`Kubernetes Cluster (OKE)`**.

  ![xxx](./images/xxx.png)

2. Click **Create cluster**, select [Quick create], then click **Submit**.

  ![xxx](./images/xxx.png)

3. Provide a name for the cluster, under _Node Type_ choose **Managed**, leaving all other settings as default.

  ![xxx](./images/xxx.png)

4. Click **Next**, review the details of your cluster, and click **Create cluster**.

  ![xxx](./images/xxx.png)

5. It will take just a couple of minutes to create the requisite resources. You can proceed to the next task while this is happening.

  ![xxx](./images/xxx.png)

## Task 2: Create Autonomous Database (ATP)

1. Navigate to **`Oracle Databases`** -> **`Autonomous Transaction Processing`**.

  ![xxx](./images/xxx.png)

2. Click **Create Autonomous Database**

  ![xxx](./images/xxx.png)

1. Provide `multiplayer` as both the display name and the database name.

    ```bash
    <copy>multiplayer</copy>
    ```

  ![xxx](./images/xxx.png)

4. Scroll down and provide a database password for the Admin user. Recover the password you generated before by running this command. Copy and paste it twice on the form.

    ```bash
    <copy>cat ~/oci-multiplayer/.env.json | jq .adbPassword</copy>
    ```

  ![xxx](./images/xxx.png)

5. Click **Create Autonomous Database**.

  ![xxx](./images/xxx.png)

6. It will take about a minute to create the DB. You may proceed to the next task.

  ![xxx](./images/xxx.png)

## Task 3: Create and deploy the application

1. Navigate to **`Developer Services`** -> **`Kubernetes Cluster (OKE)`**.

  ![xxx](./images/xxx.png)

2. Wait until the cluster is `Active`.

  ![xxx](./images/xxx.png)

3. Click on the cluster link to access your brand-new Kubernetes Cluster.

  ![xxx](./images/xxx.png)

4. Click **Access Cluster** then copy the command found under item 2 displayed on the screen.

  ![Cluster Access](images/cluster-access.png)

5. Return to Cloud Shell, paste the above command and execute. This will enable you to communicate with the OKE API endpoint for your cluster.

6. Ensure you are in the root directory.

    ```
    <copy>cd ~/oci-multiplayer</copy>
    ```

7. Release all application components.

    ```
    <copy>npx zx scripts/release.mjs -a</copy>
    ```

8. Update the deployment manifest with the latest versions.

    ```
    <copy>npx zx scripts/deploy.mjs</copy>
    ```

9. Deploy all application components to OKE.

    ```
    <copy>kubectl apply -k deploy/k8s/overlays/prod</copy>
    ```

10. Verify the pods were deployed (it might take a minute or so for all pods to come online).

    ```
    <copy>kubectl get pods</copy>
    ```

  ![Get Pods](images/get_pods.png)

11. Obtain the external service IP for the application you just deployed.

    ```
    <copy>kubectl -n ingress-nginx get svc</copy>
    ```

  ![Get Ingress Service](images/ext_svc_ip.png)

12. Paste the IP address from step 12 in a new browser tab and check it out!

  ![xxx](./images/xxx.png)

Optionally, if you want to clean up the workshop resources on Oracle Cloud; you may now [proceed to the next lab](#next).

## Acknowledgements

* **Author** - Victor Martin - Technology Product Strategy Director - EMEA
* **Author** - Wojciech (Vojtech) Pluta - Developer Relations - Immersive Technology Lead
* **Author** - Eli Schilling - Developer Advocate - Cloud Native and DevOps
* **Last Updated By/Date** - August, 2023
