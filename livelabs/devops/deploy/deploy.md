# Lab 5: Deployment Pipeline

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Run Deploy Pipeline

1. Make sure you are back to OCI DevOps Project.
  
  ![DevOps Project](images/devops-project.png)

3. Scroll down until you see the **Latest deployment pipelines**. Click on the Deployment Pipeline you created with Terraform.

  ![Deployment pipelines](images/deployment-pipelines.png)

4. Take a look, there is one stage: **Deploy with Kustomize**. This stage will deploy with Kustomize to the Kubernetes Cluster.

  ![Deployment pipeline stage](images/deployment-stage.png)

5. Click **Run pipeline**.

  ![Deployment pipeline run](images/deployment-run-button.png)

6. This Pipeline has no Parameters, but keep them in mind to customize your deployment pipeline in the future.

  ![Deployment Params](images/deployment-params.png)

7. Click **Start manual run** to kick off the pipeline.

  ![Deployment Start Manual Run](images/deployment-start-manual-run.png)

8. Wait until the deployment pipeline is finished. It might take up to 7 minutes.

  ![Deployment Running](images/deployment-running.png)

1. Finally, confirm the success and explore the console log. You can minimize some of the other panels.

  ![Deployment Success minimize](images/deployment-success-minimize.png)

10. At the end of the logs, you will see a curl command.

  ![xxx](images/deployment-run-curl.png)

1.  Copy and paste the URL into the browser.

  ![URL browser](images/url-browser.png)

You may now [proceed to the next lab](#next).

## Acknowledgements

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023
