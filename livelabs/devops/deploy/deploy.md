# Lab 5: Deployment Pipeline

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Get familiar with OCI DevOps

1. Go back to the OCI DevOps Project.
  
  ![xxx](images/xxx.png)

2. Scroll down until you will find the **Latest environments**, that contain the Kubernetes Cluster where OCI DevOps is going to deploy the application.

  ![xxx](images/xxx.png)

3. Click on the environment and take a look at the reference.

  ![xxx](images/xxx.png)

## Task 2: Run Deploy Pipeline

2. Go back to the DevOps Project. You can use the breadcrumbs menu like in the picture or use the back bottom on your browser.

  ![xxx](images/xxx.png)

3. Scroll down until you see the **Latest deployment pipelines**. Click on the Deployment Pipeline you created with Terraform.

  ![xxx](images/xxx.png)

4. Take a look, there is one stage: **Deploy with Kustomize**. This stage will deploy with Kustomize to the Kubernetes Cluster.

  ![xxx](images/xxx.png)

5. Click **Run pipeline**.

  ![xxx](images/xxx.png)

6. This Pipeline has no Parameters, but keep them in mind to customize your deployment pipeline in the future.

  ![xxx](images/xxx.png)

7. Click **Start manual run** to kick off the pipeline.

  ![xxx](images/xxx.png)

8. Wait until the deployment pipeline is finished. It might take up to 7 minutes.

  ![xxx](images/xxx.png)

9. Finally, confirm the success and explore the console log. You can minimize some of the other panels.

  ![xxx](images/xxx.png)

10. At the end of the logs, you will see a curl command. Copy and paste it on the terminal.

  ![xxx](images/xxx.png)

You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023
