# Lab 1: GitHub Fork

## Introduction

XXX

Estimated Lab Time: 15 minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Fork repo

1. Open a new tab in your browser and go to the [OCI DevOps OKE](https://github.com/vmleon/oci-multiplayer) repository.
  
  ![xxx](images/xxx-xxx-xxx.png)

2. Click on **Fork**.
  
  ![xxx](images/xxx-xxx-xxx.png)

3. When the fork process has finished.
  
  ![xxx](images/xxx-xxx-xxx.png)

## Task 2: Create an access token

1. Go to your profile icon in GitHub.
  
  ![xxx](images/xxx-xxx-xxx.png)

2. Go to **Settings**.

3. Scroll all the way to the end, and click **Developer settings**.

4. Expand **Personal access tokens**.

5. Click on **Fine-grained tokens**.

6. Click **Generate new token**.

7. Fill in the form: **Token name**, **Expiration**, **Description**, **Resource owner**

8. Check **Only select repositories**.

9. Select your `oci-multiplayer`.

10. On permissions, set **Contents** to **Read-only**. (to be confirmed that this is enough)

11. Click **Generate token**.

12. Copy the generated token in a safe place. You will need it later.

## Task 3: Clone a new repository

1. Log in on Oracle Cloud and open Cloud Shell.
  
  ![xxx](images/xxx-xxx-xxx.png)

2. Clone the forked repository. Click Code and select HTTPS.
    
  ![xxx](images/xxx-xxx-xxx.png)

1. Click the copy button and paste it on Cloud Shell to git cloning.

  ![xxx](images/xxx-xxx-xxx.png)

    ```bash
    <copy>git clone https://github.com/YOUR_USER_HANDLER/oci-multiplayer.git</copy>
    ```

  ![xxx](images/xxx-xxx-xxx.png)

1. Change the directory to the cloned repository:
    
    ```bash
    <copy>cd oci-multiplayer</copy>
    ```

You may now [proceed to the next lab](#next).

## Acknowledgments

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023