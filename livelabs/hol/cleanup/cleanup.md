# Clean Up (optional)

## Destroy Infrastructure

In this lab, you are going to destroy all the resources you have created on Oracle Cloud to make sure your tenancy is clean from everything done during this workshop.

![xxx](images/xxx.png)

Estimated Lab Time: 10 minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account

## Task 1: Kubernetes deployment.

13. Run the delete command to clean up Kubernetes.

    ```bash
    <copy>kubectl delete -k deploy/k8s/overlays/prod</copy>
    ```

  ![xxx](images/xxx.png)

## Task 2: VMs and Container Instances.

1. Make sure you are still on the directory `deploy/vm/tf-ci`.

    ```
    <copy>cd ~/oci-multiplayer/deploy/vm/tf-ci</copy>
    ```

  ![xxx](images/xxx.png)

2. Run Terraform destroy to delete the resources.

    ```
    <copy>terraform destroy -auto-approve</copy>
    ```

  ![xxx](/images/xxx.png) 

  ![xxx](/images/xxx.png) 

3. Change the directory back to the root of the project with the following command:

    ```
    <copy>cd ~/oci-multiplayer</copy>
    ```

4. Run the `ci.mjs` command that will give you information about how to delete your container instance.

    ```
    <copy>npx zx scripts/ci.mjs</copy>
    ```

  ![xxx](/images/xxx.png) 

5. Copy and paste on the console the second yellow command to delete the container instance.

  ![xxx](/images/xxx.png) 

6. On the list of container instances, you will see the id of your container instance. Replace `CONTAINER_INSTANCE_OCID` with the id and run the command.

  ![xxx](/images/xxx.png) 

7. Confirm that you are sure you want to delete this resource by typing `y`.

  ![xxx](/images/xxx.png) 

8. Clean also the infrastructure from Lab 1 by running this command:

    ```
    <copy>./scripts/stop_VM.sh</copy>
    ```

  ![xxx](/images/xxx.png) 

9. When Terraform completes the `destroy` you will get this green message.

  ![xxx](/images/xxx.png) 

## Task 3: Autonomous Database and Kubernetes Cluster

1. Delete OKE

2. Delete ADB

3. Delete VCN

## Acknowledgements

* **Author** - Victor Martin - Technology Product Strategy Director - EMEA
* **Author** - Wojciech (Vojtech) Pluta - Developer Relations - Immersive Technology Lead
* **Last Updated By/Date** - August, 2023
