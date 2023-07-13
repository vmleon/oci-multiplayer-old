# Lab 7: Clean Up (Optional)

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Delete Load Balancer from Kubernetes

1. Go to **Menu** > **Developer Services** > **Kubernetes Clusters (OKE)**

  ![xxx](images/xxx.png)

2. The Kubernetes Cluster will be on the list, the name starting with `DevOps`.

  ![xxx](images/xxx.png)

3. Click on the Kubernetes Cluster name.

  ![xxx](images/xxx.png)

4. At the top, click on **Access Cluster**.

  ![xxx](images/xxx.png)

5. If you have the Cloud Shell still open, jump to step 2. If not, click on **Launch Cloud Shell**.

  ![xxx](images/xxx.png)

1. Copy the command from step 2. And paste it on the Cloud Shell. Run the command.

  ![xxx](images/xxx.png)

7. Check it is configured. Run the following command and see the services.

    ```bash
    <copy>kubectl get pods</copy>
    ```

  ![xxx](images/xxx.png)

8. After that, delete the ingress controller, hence the load balancer.

    ```bash
    <copy>kubectl delete ns ingress-nginx</copy>
    ```

  ![xxx](images/xxx.png)

9. It will take a couple of minutes.

  ![xxx](images/xxx.png)

## Task 2: Delete infrastructure

1. From the Cloud Shell, make sure you are in `tf-devops` folder.

    ```bash
    <copy>pwd</copy>
    ```

2. It should look like this:

  ![xxx](./images/xxx.png)

2. If you are not in `tf-devops` folder, change the current directory until you get there.

  ![xxx](./images/xxx.png)

1. Run the following command to destroy the OCI DevOps infrastructure.

    ```bash
    <copy>terraform destroy -auto-approve</copy>
    ```

  ![xxx](./images/xxx.png)

4. When the Terraform `destroy` finishes successfully.

  ![xxx](./images/xxx.png)

5. Change the directory to the `tf-env`

    ```bash
    <copy>cd ../tf-env</copy>
    ```

6. Run the following command to destroy the rest of the infrastructure.

    ```bash
    <copy>terraform destroy -auto-approve</copy>
    ```

  ![xxx](./images/xxx.png)

7. When the Terraform `destroy` finishes successfully, you have finished cleaning up.

  ![xxx](./images/xxx.png)

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023