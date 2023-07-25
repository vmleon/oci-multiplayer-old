# Release New Feature

## Introduction

As part of a normal software development lifecycle, you will have to create new features and deploy those new features. OCI DevOps helps you to do that.

Estimated Lab Time: 15 minutes

### Objectives

In this lab, you are going to change the code to one of the components and release the application again. The release will be done by running the Build pipeline and Deployment pipeline.

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Bump the version of a service

1. You are going to change the version of the server, representing the addition of one new feature. Go to your GitHub forked repository.

  ![GitHub Forked repo](./images/github-forked-repo.png)

2. Click on the `server` folder on the code panel.

  ![GitHub server folder](./images/github-server-folder.png)

3. Click on the `package.json` file.

  ![GitHub server package open](./images/github-server-package-open.png)

4. Click the **Edit this file** button.

  ![GitHub server package edit](./images/github-server-package-edit.png)

5. Edit the `version` and click **Commit changes...** button.

  ![GitHub server package edit version](./images/github-server-package-edit-version.png)

## Task 2: Build and Deploy

1. Go to OCI DevOps Build Pipeline.

  ![DevOps Build Pipeline button](./images/devops-build-pipeline-button.png)

2. Click **Start manual run**

  ![DevOps Build Pipeline Start ](./images/devops-build-pipeline-start.png)

3. Click **Start manual run** to confirm on the parameters screen.

  ![DevOps Build Pipeline Start ](./images/devops-build-pipeline-start-run.png)

4. After a successful build execution of the pipeline

  ![DevOps Build Pipeline Success](./images/devops-build-pipeline-success.png)

5. Go back to the DevOps project.

  ![Go back to DevOps Project](./images/back-to-project.png)

6. Go to the Deployment pipeline.

  ![Deployment Pipeline Button](./images/deployment-pipeline-button.png)

7. Click **Run Pipeline**.

  ![Deployment Pipeline Run](./images/deployment-pipeline-run.png)

8. Confirm the **Start manual run**.

  ![Deployment Pipeline Run confirm](./images/deployment-pipeline-run-confirm.png)

9. Get the curl command and execute it.

  ![Deployment Pipeline Success](./images/deployment-pipeline-success.png)

10. The Server version would be the one you bumped.

  ![xxx](./images/xxx.png)

## Task 3: Rollback (Optional)

1. From a terminal configured with GitHub run the revert of the last commit, just to simulate a rollback.

    ```bash
    <copy>git revert --no-edit main~1</copy>
    ```

  ![xxx](./images/xxx.png)

2. Run the git push

    ```bash
    <copy>git push origin main</copy>
    ```

  ![xxx](./images/xxx.png)

3. Go to OCI DevOps Build Pipeline.

  ![DevOps Build Pipeline button](./images/devops-build-pipeline-button.png)

4. Click **Start manual run**

  ![DevOps Build Pipeline Start ](./images/devops-build-pipeline-start.png)

5. Click **Start manual run** to confirm on the parameters screen.

  ![DevOps Build Pipeline Start ](./images/devops-build-pipeline-start-run.png)

6. After a successful build execution of the pipeline

  ![DevOps Build Pipeline Success](./images/devops-build-pipeline-success.png)

7. Go back to the DevOps project.

  ![Go back to DevOps Project](./images/back-to-project.png)

8. Go to the Deployment pipeline.

  ![Deployment Pipeline Button](./images/deployment-pipeline-button.png)

9. Click **Run Pipeline**.

  ![Deployment Pipeline Run](./images/deployment-pipeline-run.png)

10. Confirm the **Start manual run**.

  ![Deployment Pipeline Run confirm](./images/deployment-pipeline-run-confirm.png)

11. Get the curl command and execute it.

  ![Deployment Pipeline Success](./images/deployment-pipeline-success.png)

12. The Server version would be the one you rollbacked to.

  ![xxx](./images/xxx.png)

You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023