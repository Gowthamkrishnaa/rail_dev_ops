# Rail Dev Ops CDK Deployment
Deploys Rail Platform Stack Core and DevOps infrastructure to support the development and deployment of the Rail Platform and its services.

## Prerequisites
* AWS CLI v2.4.15+ Installed
* Configure CLI to use correct AWS Account
* AWS Access Key with correct permissions
* AWS Account has been bootstrapped for CDKv2 (https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)
    * Run $ ```cdk bootstrap --template scripts/aws-cdk-bootstrap.yaml```
* New AWS Accounts:
    * GitHub Access to Private Org (currently setup using legacy token)
    * Create new CodeBuild deployment user with administrator permissions (TODO: Configure with least privileged access) and generate an Access Key for AWS Parameter Store
    * Configure AWS Parameter Store with the following: codebuild-key, codebuild-secret, docker-access-token, git-access-token

## Install Rail Platform Stack
Installation will deploy: Route53 HostedZones, Networking and Topology, CodeArtifact Domain and Repositories, CodeBuild Projects and their IAM Roles.
### Step 1: Deploy Core Infrastructure 
* Run $ ```npm install```
* Ensure ```.env``` is configured for the correct environment
    * ❗ Add ```STACK_INITIALIZE='true'``` upon initial deployment of DevOps stack
    * ❗ (Only Prod) Add env variable ```SUB_DOMAIN='rail'```
* Run $ ```npm run deploy-stack```
    * ❗ RailDomainManagement will pause on creation of ```AWS::CertificateManager::Certificate```
    * When deployment is paused, run $ ```npm run configure-dns```
        * ❗When deploying to account that does NOT manage the HostedZone
            * Pass parameters ```<current_account> <route53_account>``` 
            * Example: ```npm run configure-dns prod dev```
        * Deployment will continue shortly after running the script
* (Dev & Stg) Upon completion, navigate to CodeBuild > Settings > Connections
    * There should be a pending connection prefixed with 'Rail'
    * Click on connection name
    * In connection settings page, at the top, click on "Update Pending Connection"
    * If you already have created the connection to GitHUb, select it in the search input, or "Install a new app"
### Step 2: Initialize Dependent Package Versions (Dev Only)
Version in package.json will determine the initial tag number
* Start the RailCalculationPackage-NPM CodeBuild project
    * Update PlatformUI package.json with new package version
    * Update RailApi package.json with new package version (before running RailApi-NPM)
* Start the RailApi-NPM CodeBuild project
### Step 3: Deploy Individual Services
* 3.1: Start the RailUserManagement-Direct CodeBuild project
    * Requires a configuration script to be customized and run before logging into the platform (Step 4)
* 3.2: Start the RailApi-Direct CodeBuild project
* 3.3: Start the RailSimulation-Direct CodeBuild project
* 3.4: Configure & Start the RailPlatformUI-Direct CodeBuild project
    * ❗ Project Environment Variables must be updated beforehand (choose one option below)
        1. Run RailDevOps Codebuild Project within console
        2. Reference Outputs from RailUserManagement to populate the following:
            * VUE_APP_USER_POOL_WEB_CLIENT_ID maps to RailUserManagement:AdminApiAppClientId
            * VUE_APP_USER_POOL_ID maps to RailUserManagement:UserPoolId
            * VUE_APP_SAML_CLIENT_ID maps to RailUserManagement:SAMLAppClientId
            * VUE_APP_SAML_USER_POOL maps to RailUserManagement:SAMLUserPoolId
    * ❗Manual Configuration of CloudFront Origins
        1. Navigate to CloudFront / Distributions / Click on Id of Distro 
        2. Navigate to Origins / Select Origin / Edit
        3. Origin Access (currently selected "Public")
            3a. Select: "Origin access control settings (recommended)"
            3b. Select: "DigitalTwinAccessControl" that was created during initial PlatformUI build through IaC
            3c. "Save Changes" as the policy already has been created on the s3 bucket
        4. Copy Distribution domain name, wait a min and try to connect to the Distribution
### Step 4: Configure Platform for Initial Login
The platform requires a company and valid user before logging in.
* Confirm ENV variables are correctly configured.
* Run $ ```npm run configure-user```
    * Depends on RailUserManagement to be deployed
    * Override ADMIN_USER in .env to configure using a different email
    * Upon completion, the defined Admin user will receive an email inviting them to login
* Run $ ```npm run configure-api```
    * Depends on RailApi to be deployed
    * Creates customer for Rail Modules

## Delete Rail Platform Stack
Multi-part process requiring some manual steps. Confirm ENV variables are correctly configured.

* IAM Roles: Delete RailDevOps`Env`-Core-RailCodeBuildRole-`ID`
* Route53 HostedZones: Delete all records that are not (NS or SOA) within `Env`.rail.digitalclone.com
* Run $ ```npm run destroy-services```
    * This will begin deleting the services not associated with RailDevOps
    * !! RailUserManagement stack sometimes will fail to delete and must be manually deleted
    * !!! Confirm Services have been deleted in CloudFormaiton before continuing to next step
* To delete remaining infrastructure run $ ```npm run destroy-stack```

# Topology Stack 
Configures SNS and SQS creation for cross service events. 
* For every domain the stack creates a topic, message and dead letter queue, and topic policy for sending messages  
* Subscriptions are created and automatically subscribed to topics. 
** The operation and resource must match the filter policy when defining publish call to prevent being filtered.
```
{
    "name": String - Name of the Service (w/o suffix) to create a topic for
    "subscriptions": [{
      "name": String - Name of the Service(s) (w/o suffix) to subscribe to this topic
      "filterPolicy": {
        "op": Array - String, the permitted operation (eg. ["INSERT","UPDATE","DELETE"])
        "resource": Array - String, named resources that must be in publish request
      }
    }]
}
```

# Running Scripts
Scripts found under ~/scripts perform various maintenance operations 
## Updating CodePipeline's Source Folder
This script will update the Source Action for CodePipeline to watch a specific branch (default Main/Master). 

Prerequisites:

* AWS CLI v2.4.15+ Installed

* Configure CLI to use correct AWS Account

* AWS Access Key with correct permissions

Running the script for UI Pipeline:

* Run $ ```npm run update-pipeline <branch_name> <pipelines>```
* <branch_name> ```"ppeccia/PLAT-21"```
* <pipelines> ```"UI,API,SIM"```
   
   
