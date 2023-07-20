# Lab 1: GitHub Fork

## Introduction
During this lab, you are going to clone a GitHub repository to have your own copy. The rest of the workshop will be working based on your fork.

Estimated Lab Time: 15 minutes

### Prerequisites

* An Oracle Free Tier, Paid or LiveLabs Cloud Account
* Active Oracle Cloud Account with available credits to use for Data Science service.

## Task 1: Fork repo

1. Open a new tab in your browser and go to the [OCI DevOps OKE](https://github.com/vmleon/oci-multiplayer) repository.
  
  ![GitHub base repo](images/github-base-repo.png)

1. Click on **Fork**.
  
  ![GitHub fork Button](images/github-fork-button.png)

3. Leave the repo name and click **Create fork**, it takes just a few seconds.
  
  ![GitHub fork form](images/github-fork-form.png)
  
  
4. When the fork process has finished take a look to the URL. Now the repo is under your GitHub user.
  
  ![GitHub forked](images/github-forked.png)
  

## Task 2: Create an access token

1. Go to your profile icon in GitHub.
  
  ![GitHub profile button](images/github-profile-button.png)

2. Go to **Settings**.
  
  ![GitHub profile settings](images/github-profile-settings.png)

1. Scroll to the end, and click **Developer settings**.
  
  ![GitHub profile developer settings](images/github-profile-developer-settings.png)

1. Expand **Personal access tokens** and click on **Fine-grained tokens**.
  
  ![GitHub profile personal access token](images/github-profile-personal-access-tokens.png)

1. Click **Generate new token**.
  
  ![GitHub profile pat generate](images/github-profile-pat-generate-button.png)

1. Fill in the form: **Token name**, **Expiration**, **Description**, **Resource owner**
  
  ![GitHub PAT form](images/github-pat-form.png)

1. Check **Only select repositories**.
  
  ![GitHub PAT form repo access](images/github-pat-form-repo-access.png)

8.  On permissions, set **Contents** to **Read-only**. (to be confirmed that this is enough)
  
  ![GitHub PAT form permissions](images/github-pat-form-permissions.png)

9.  Click **Generate token**.
  
  ![GitHub PAT form overview](images/github-pat-form-overview.png)

1.  It will ask for your GitHub Account password to confirm.
  
  ![GitHub PAT Password](images/github-pat-form-confirm-password.png)

1.  Copy the generated token in a safe place. You will need it later. Make sure to copy your personal access token now as you will not be able to see this again.
  
  ![GitHub PAT Copy](images/github-pat-copy.png)

## Task 3: Clone the new repository

1. Clone the forked repository. Click Code and select HTTPS.
    
  ![GitHub Clone Button](images/github-clone-button.png)

1. Log in on Oracle Cloud and open Cloud Shell.
  
  ![Cloud Shell button](images/oci-cloud-shell-button.png)

1. Git Clone the repository. Type `git clone ` and then paste the URL copied from GitHub.

  ![xxx](images/git-clone-command.png)

    ```bash
    <copy>git clone https://github.com/YOUR_USER_HANDLER/oci-multiplayer.git</copy>
    ```

1. Change the directory to the cloned repository:
    
    ```bash
    <copy>cd oci-multiplayer</copy>
    ```

You may now [proceed to the next lab](#next).

## Acknowledgements

* **Author** - Victor Martin, Tech Product Strategy Director (EMEA)
* **Contributors** - Wojciech Pluta - DevRel, Eli Schilling - DevRel
* **Last Updated By/Date** - July 1st, 2023