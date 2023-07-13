# Lab 3: DevOps Infrastructure

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Set up Terraform configuration file

1. From the **Cloud Shell**, run this command.
    
    ```bash
    <copy>npx zx scripts/tfvars.mjs devops</copy>
    ```

    > This `tfvars.mjs` will create a file called `terraform.tfvars` with the values needed by Terraform to create all the DevOps infrastructure.

2. During the execution of the script, you will have to answer a question.
  
  ![xxx](images/xxx.png)

3. The _GitHub URL_. You just type/paste the URL of your forked GitHub repository.
  
  ![xxx](images/xxx.png)


## Task 2: Apply DevOps infrastructure

1. Change to the folder `tf-devops` where all the DevOps infrastructure definitions are.
    
    ```bash
    <copy>cd tf-devops</copy>
    ```

2. Run the `init` command for terraform.
    
    ```bash
    <copy>terraform init</copy>
    ```

3. Then, run the `apply` command for Terraform to create resources on Oracle Cloud.
    
    ```bash
    <copy>terraform apply -auto-approve</copy>
    ```

4. The `apply` process might take up to 10 minutes. You will use this time to understand a bit more about the infrastructure that you are creating.

  ![xxx](./images/xxx-xxx-xxx.png)

5. The DevOps infrastructure includes:
    - DevOps project
    - DevOps GitHub repository mirroring
    - DevOps Build Pipeline and its stages
    - DevOps Deployment Pipeline and its stages
    - Networking requirements.

6. Let's explore them one by one.

7. DevOps project is the main entity that groups up all the resources associated with the same application/project.

8. DevOps GitHub repository mirroring is an entity that configures the mirroring of the GitHub repository, basically, a connection with your forked repository that allows synchronization of code between GitHub and OCI DevOps.

    > OCI DevOps has its own git repository for your code with high level of security and the best integration possible in case you don't want to use other 3rd party source code version control.

9. DevOps Build Pipeline and its stages will build your source code, run your tests, and generate artifacts like files, and container images.

10. DevOps Deployment Pipeline and its stages are where all the artifacts get deployed on an environment. In your case, a Kubernetes Cluster but it could be anything from virtual machines to container instances.

11. Also, Terraform will create all the networking fabric needed to run the build and deployment pipelines.

## Task 3: Terraform output

1. After 5 to 10 minutes, you will see that terraform has terminated.

2. Make sure the terraform apply process printed the output with no error.
    
  ![xxx](./images/xxx-xxx-xxx.png)

3. Come back to the parent directory.

    ```bash
    <copy>cd ..</copy>
    ```

4. You have completed this lab.

You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023