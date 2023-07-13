# Lab 4: Build Pipeline

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Get familiar with OCI DevOps

1. Go to **Menu** > **Developer Services** > **DevOps**.
  
  ![xxx](images/xxx.png)

1. Click on **Projects**

  > NOTE: Make sure you select the compartment, or that the root compartment is selected.
  >  
  > ![xxx](images/xxx.png)
  >  
  
  ![xxx](images/xxx.png)

1. You will see our OCI DevOps Project, click on it.

  ![xxx](images/xxx.png)

4. You will find code repositories, that contain the mirrored GitHub Repository.

  ![xxx](images/xxx.png)

  > NOTE: OCI DevOps can host your code without the need of GitHub or any other git service. This is the preferred way, for security and integration, it is the easiest way. In this workshop, we take the approach of GitHub so you can see a more complex scenario with a minutely synchronized mirroring between OCI DevOps Code Repository and Github.

5. Click on the mirrored repository to take a look at the code.

  ![xxx](images/xxx.png)

  > NOTE: Take into account that the initial code mirroring takes a few minutes. The system will tell you if the process is on-going.

## Task 2: Run Build Pipeline

1. Scroll to the bottom to see the same code you have on GitHub.

  ![xxx](images/xxx.png)

2. Go back to the DevOps Project. You can use the breadcrumbs menu like in the picture or use the back bottom on your browser.

  ![xxx](images/xxx.png)

3. Scroll down until you see the **Latest Build pipelines**. Click on the Build Pipeline you created with Terraform.

  ![xxx](images/xxx.png)

4. Take a look, there are two stages: **Build Services** and **Deliver Artifacts**. The first stage will build the Node and Java Applications. The second stage will deploy the container images with the applications on Oracle Cloud Container Registry.

  ![xxx](images/xxx.png)

5. Click **Start manual run**.

  ![xxx](images/xxx.png)

6. This Build Pipeline has some Parameters, keep them in mind to customize your build pipeline in the future.

  ![xxx](images/xxx.png)

7. Click **Start manual run** to kick off the pipeline.

  ![xxx](images/xxx.png)

8. Wait until the build pipeline is finished. It might take up to 7 minutes.

  ![xxx](images/xxx.png)

9. Finally, confirm the success and explore the console log. You can minimize some of the other panels.

  ![xxx](images/xxx.png)

10. When done, come back to the OCI DevOps Project.

  ![xxx](images/xxx.png)

## Task 3: Check the delivery of the container images

1. Go to **Menu** > **Developer Services** > **Container Images**

  ![xxx](images/xxx.png)

2. Change to the root compartment to list the images.

  ![xxx](images/xxx.png)

3. Take a look at the versions

  ![xxx](images/xxx.png)


You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023