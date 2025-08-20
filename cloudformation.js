const cdk = require('aws-cdk-lib');
const npmPackage = require('./package.json');

/* Core Services */
const DomainManagementStack = require('./core/domain-management-stack');
const NetworkingStack = require('./core/networking-stack');
const TopologyStack = require('./core/topology-stack');

/* Codebuild Projects */
const DevOpsCoreStack = require('./codebuild/devops-core-stack.js');
const UserManagementStack = require('./codebuild/user-management-stack.js');
const PlatformStack = require('./codebuild/platform-ui-stack.js');
const ApiStack = require('./codebuild/platform-api-stack.js');
const SimulationStack = require('./codebuild/platform-simulation-stack.js');
const PackagesStack = require('./codebuild/packages-stack.js');
const CodePipelineStack = require('./codebuild/devops-pipeline-stack.js');

const getVueEnv = (suffix) => {
    switch(suffix.toLowerCase()) {
        case 'prod':
            return 'prod';
        case 'dev':
        case 'test':
            return 'dev';
        case 'stg':
            return 'qa';
        default:
            return 'local';
    }
}

const app = new cdk.App();

// Env Variable used to signify initial creation of Rail DevOps Stack
const stackInitialize = process.env.STACK_INITIALIZE || false;

const accountId = process.env.ACCOUNT_ID || '569575870388';
const stackSuffix = process.env.STACK_SUFFIX || 'Dev';
const version = process.env.VERSION || npmPackage.version;
const railImageAmi = process.env.RAIL_IMAGE_AMI || '';
const env = {account: accountId, region: process.env.REGION, suffix: stackSuffix};

const skipPipeline = process.env.SKIP_PIPELINE || 0;

/* Deploy Core Services (Domain Management, Topology, Networking) */
const domain = process.env.DOMAIN || 'loram';
const subDomain = process.env.SUB_DOMAIN || `${stackSuffix.toLowerCase()}.digitaltwin`;
const domainManagementStackName = `RailDomainManagement${stackSuffix}`;
/* When deploying Domain Management, will pause on CREATE_IN_PROGRESS for Certificate
    At this point you must run: $ npm run configure-dns */
const dmStackRef = new DomainManagementStack(app, domainManagementStackName, {
    env,
    stackSuffix,
    version,
    domain,
    subDomain,
    hostedZoneId: process.env.HOSTED_ZONE_ID
});

const networkingStackName = `RailNetworking${stackSuffix}`;
const netStackRef = new NetworkingStack(app, networkingStackName, {version});
const topologyStackName = `RailTopology${stackSuffix}`;
const topStackRef = new TopologyStack(app, topologyStackName, {version});

/* DevOps Build Stack */
const devOpsStackName = `RailDevOps${stackSuffix}`;
const devOpsCoreStackName = `${devOpsStackName}-Core`;
const artifactDomainName = process.env.CODE_ARTIFACT_DOMAIN || 'loram-digital-domain';
const artifactRepositoryName = process.env.CODE_ARTIFACT_REPOSITORY || 'loram-digital';
const devOpsStackRef = new DevOpsCoreStack(app, devOpsCoreStackName, {
    env,
    version,
    accountId,
    subDomain,
    artifactDomainName,
    artifactRepositoryName,
    prodAccountId: process.env.PROD_ACCOUNT_ID,
    stgAccountId: process.env.STG_ACCOUNT_ID,
});
devOpsStackRef.addDependency(dmStackRef);

/* User Build Stack */
const umStackRef = new UserManagementStack(app, `${devOpsStackName}-UserManagement`, {
    env,
    version,
    stackSuffix,
    accountId,
    subDomain,
    apiDomainName: cdk.Fn.importValue(`${domainManagementStackName}:userManagementDomainName`),
    serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:CodeBuildRoleARN`)
});
umStackRef.addDependency(devOpsStackRef);
umStackRef.addDependency(dmStackRef);

/* UI Build Stack */
const userManagementStackName = `RailUserManagement${stackSuffix}`;
const platformStackRef = new PlatformStack(app, `${devOpsStackName}-PlatformUI`, {
    env,
    version,
    accountId,
    stackSuffix,
    subDomain,
    vueEnv: getVueEnv(stackSuffix),
    nodeEnv: (stackSuffix.toLowerCase() === 'prod') ? 'production' : 'development',
    serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:CodeBuildRoleARN`),
    apiBase: cdk.Fn.importValue(`${domainManagementStackName}:apiDomainName`),
    userApiBase: cdk.Fn.importValue(`${domainManagementStackName}:userManagementDomainName`),
    umAppClientId: (stackInitialize) ? null : cdk.Fn.importValue(`${userManagementStackName}:ClientAppClientId`),
    umAppUserPoolId: (stackInitialize) ? null : cdk.Fn.importValue(`${userManagementStackName}:UserPoolId`),
    umSSOClientId: (stackInitialize) ? null : cdk.Fn.importValue(`${userManagementStackName}:SAMLAppClientId`),
    umSSOUserPoolId: (stackInitialize) ? null : cdk.Fn.importValue(`${userManagementStackName}:SAMLUserPoolId`)
});
platformStackRef.addDependency(devOpsStackRef);
platformStackRef.addDependency(dmStackRef);

/* API Build Stack */
const apiStackRef = new ApiStack(app, `${devOpsStackName}-Api`, {
    env,
    version,
    accountId,
    stackSuffix,
    railImageAmi,
    apiDomainName: cdk.Fn.importValue(`${domainManagementStackName}:apiDomainName`),
    serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:CodeBuildRoleARN`)
});
apiStackRef.addDependency(devOpsStackRef);
apiStackRef.addDependency(dmStackRef);

/* Simulation Build Stack */
const simulationStackRef = new SimulationStack(app, `${devOpsStackName}-Simulation`, {
    env,
    version,
    accountId,
    stackSuffix,
    simulationDomainName: cdk.Fn.importValue(`${domainManagementStackName}:simulationDomainName`),
    serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:CodeBuildRoleARN`)
});
simulationStackRef.addDependency(devOpsStackRef);
simulationStackRef.addDependency(dmStackRef);

/* CodeArtifact Stack (Dev) */
if(stackSuffix.toLowerCase() === 'dev') {
    const packageStackRef = new PackagesStack(app, `${devOpsStackName}-Packages`, {
        env,
        version,
        serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:ServicesCodeBuildRoleARN`)
    });
    packageStackRef.addDependency(devOpsStackRef);
}

/* CodePipeline Stack (Stg & Dev) */
if( skipPipeline == 0 && ['dev','stg'].includes(stackSuffix.toLowerCase()) ) {
    const pipelineStackRef = new CodePipelineStack(app, `${devOpsStackName}-CodePipeline`, {
        env,
        version,
        accountId,
        stackSuffix,
        repositoryUI: cdk.Fn.importValue(`${devOpsCoreStackName}:PlatformUIURL`),
        repositoryAPI: cdk.Fn.importValue(`${devOpsCoreStackName}:RailAPIURL`),
        repositorySIMULATION: cdk.Fn.importValue(`${devOpsCoreStackName}:RailSimulationURL`),
        serviceRole: cdk.Fn.importValue(`${devOpsCoreStackName}:ServicesPipelineARN`),
        codeBuildUI: cdk.Fn.importValue(`${devOpsCoreStackName}:RailPlatformUIDirect`),
    });
    pipelineStackRef.addDependency(devOpsStackRef);
    pipelineStackRef.addDependency(dmStackRef);   
}

app.synth();
