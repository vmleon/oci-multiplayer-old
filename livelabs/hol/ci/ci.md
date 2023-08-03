# Containerize and migrate to OCI Container Instances

## Introduction

In this lab, we will create container images for the application components and deploy them to the Container Instances service. Container Instances is an excellent tool for running containerized applications, without the need to manage any underlying infrastructure. Just deploy and go.

To help streamline the process, you'll use a custom script to create and publish container images to the OCI Container Registry. Container Registry makes it easy to store, share, and managed container images. Registries can be private (default) or public.

Estimated Lab Time: 15 minutes

### Prerequisites

* An Oracle Free Tier or Paid Cloud Account

## Task 1: Prepare the environment

1. Run the script to set the environment. This script will

    - check dependencies
    - create self-signed certificates, if needed
    - log into the container registry to validate credentials
    - print component versions.

    ```
    <copy>npx zx scripts/setenv.mjs</copy>
    ```

  ![xxx](/images/xxx.png) 

2. Create and publish the **`server`** container image.

    ```
    <copy>npx zx scripts/release.mjs server</copy>
    ```

  ![xxx](/images/xxx.png) 

3. Create and publish the **`web`** container image.

    ```
    <copy>npx zx scripts/release.mjs web</copy>
    ```

  ![xxx](/images/xxx.png) 

4. Run the `ci.mjs` command that will give you information about how to create your container instance.

    ```
    <copy>npx zx scripts/ci.mjs</copy>
    ```

  ![xxx](/images/xxx.png) 

5. Copy the yellow command, paste it on Cloud Shell, and run it.

  ![xxx](/images/xxx.png) 

6. In the Web UI, you can navigate to **`Developer Services`** -> **`Container Instances`** to watch the progress of the deployment. Observe when the two containers move to an Active state.

    ![CI Related Containers](images/ContainerInstance-containers.png)

7. Locate the private IP address for your container instance.

    ![CI Private IP](images/ContainerInstance-privateIp.png)

## Task 2: Create a Load Balancer

In this second and final task, you will add the Container Instance private IP address to the backend set of a new load balancer. This process will be done with Terraform so you can easily clean it up.

1. The Terraform file `terraform.tfvars` contains variables. You are going to generate that file by running the following command:

    ```
    <copy>npx zx scripts/tfvars.mjs ci</copy>
    ```

2. During the execution of the script, you will have to answer a few questions. The first one is the _CI Deployment Compartment Name_. You just type _**ENTER**_ to select the root compartment. If you are familiar with OCI compartments, then feel free to pick an existing compartment name.

  ![xxx](images/xxx.png)

3. The second one will be the Private IP address from Task 1.

  ![xxx](images/xxx.png)

4. Change the directory to `deploy/vm/tf-ci` with the following command:

    ```
    <copy>cd deploy/vm/tf-ci</copy>
    ```

5. Run Terraform Init to set up the Terraform environment.

    ```
    <copy>terraform init</copy>
    ```

6. Run Terraform apply to start creating the resources.

    ```
    <copy>terraform apply -auto-approve</copy>
    ```


7. Change the directory back to the root of the project with the following command:

    ```
    <copy>cd ../../..</copy>
    ```

8. XXX

## Task 3: Clean up VMs and Container Instances.

1. Chance directory to `deploy/vm/tf-ci`.


    ```
    <copy>cd deploy/vm/tf-ci</copy>
    ```

2. Run Terraform destroy to delete the resources.

    ```
    <copy>terraform destroy -auto-approve</copy>
    ```

3. Change the directory back to the root of the project with the following command:

    ```
    <copy>cd ../../..</copy>
    ```

8. 8.  Run the `ci.mjs` command that will give you information about how to delete your container instance.

    ```
    <copy>npx zx scripts/ci.mjs</copy>
    ```

  ![xxx](/images/xxx.png) 

9. Copy and paste on the console the second yellow command to delete the container instance.

  ![xxx](/images/xxx.png) 

10. On the list of container instances, you will see the id of your container instance. Replace `CONTAINER_INSTANCE_OCID` with the id and run the command.

  ![xxx](/images/xxx.png) 

11. Confirm that you are sure you want to delete this resource by typing `y`.

  ![xxx](/images/xxx.png) 

12. Clean also the infrastructure from Lab 1 by running this command:

    ```
    <copy>./scripts/stop_VM.sh</copy>
    ```

  ![xxx](/images/xxx.png) 

13. When Terraform completes the `destroy` you will get this green message.

  ![xxx](/images/xxx.png) 

You may now [proceed to the next lab](#next).

## Acknowledgements

* **Author** - Victor Martin - Technology Product Strategy Director - EMEA
* **Author** - Wojciech (Vojtech) Pluta - Developer Relations - Immersive Technology Lead
* **Author** - Eli Schilling - Developer Advocate - Cloud Native and DevOps
* **Last Updated By/Date** - March, 2023
