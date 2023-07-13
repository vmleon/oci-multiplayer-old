# Lab 6: New Feature and Rollback

## Introduction

XXX

Estimated Lab Time: XX minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Bump the version of a service

1. You are going to change the code of one of the application services. You are going to use Cloud Editor, a code editor included in Oracle Cloud.

  ![xxx](./images/xxx.png)

1. Open the file `server/package.json` and change `1.0.0` to `1.0.1` on line 3.

  ![xxx](./images/xxx.png)

3. Open the file `server/index.js` and change `hello` to `hola` on line 72.

  ![xxx](./images/xxx.png)

4. Run the git add

    ```bash
    <copy>git add server/</copy>
    ```

  ![xxx](./images/xxx.png)

5. Run the git commit

    ```bash
    <copy>git commit -m "bump ws server to 1.0.1"</copy>
    ```

  ![xxx](./images/xxx.png)

6. Run the git push

    ```bash
    <copy>git push origin main</copy>
    ```

  ![xxx](./images/xxx.png)

7. At this point, the service is changed and the version is bumped.

  ![xxx](./images/xxx.png)

## Task 2: Build and Deploy

1. Go to OCI DevOps Build Pipeline.

  ![xxx](./images/xxx.png)

2. Run Build Pipeline

  ![xxx](./images/xxx.png)

3. After a successful build execution of the pipeline

  ![xxx](./images/xxx.png)

4. Go to the Deployment pipeline and run it.

  ![xxx](./images/xxx.png)

5. Get the curl command and execute it.

  ![xxx](./images/xxx.png)

6. The `message` will be `hola` and the `version` will be `1.0.1`

  ![xxx](./images/xxx.png)

7. XXX

  ![xxx](./images/xxx.png)

## Task 3: Rollback

1. From Cloud Shell, run the revert of the last commit, undoing the latest change.

    ```bash
    <copy>git revert --no-edit main~1</copy>
    ```

  ![xxx](./images/xxx.png)

2. Run the git push

    ```bash
    <copy>git push origin main</copy>
    ```

  ![xxx](./images/xxx.png)

1. Go to OCI DevOps Build Pipeline.

  ![xxx](./images/xxx.png)

2. Run Build Pipeline

  ![xxx](./images/xxx.png)

3. After a successful build execution of the pipeline

  ![xxx](./images/xxx.png)

4. Go to the Deployment pipeline and run it.

  ![xxx](./images/xxx.png)

5. Get the curl command and execute it.

  ![xxx](./images/xxx.png)

6. The `message` will be `hello` and the `version` will be `1.0.0`

  ![xxx](./images/xxx.png)

7. XXX

  ![xxx](./images/xxx.png)


You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023