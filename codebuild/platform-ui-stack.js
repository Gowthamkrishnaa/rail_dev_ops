
const cdk = require('aws-cdk-lib');
const cb = require('aws-cdk-lib/aws-codebuild');
const CodeBuildResource = cb.CfnProject;

module.exports = class CBRailPlatformUIDeploy extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const projectName = `RailPlatformUI${props.env.suffix}-Direct`;
        const apiUrl = process.env.VUE_APP_RAIL_API_BASE && `https://${process.env.VUE_APP_RAIL_API_BASE}/prod` 
            || props.apiBase && `https://${props.apiBase}/prod` 
            || null;
        const userApiUrl = process.env.VUE_APP_UM_API_BASE && `https://${process.env.VUE_APP_UM_API_BASE}/prod` 
            || props.userApiBase && `https://${props.userApiBase}/prod` 
            || null;

        const codeBuildDirect = new CodeBuildResource(this, 'RailPlatformUIDirect', {
            name: projectName,
            tags: [{
                key: 'Name',
                value: projectName
            }],
            artifacts: {
                type: "NO_ARTIFACTS"
            },
            source: {
                type: "GITHUB",
                auth: {
                    type: "OAUTH"
                },
                buildSpec: "buildspec.yml",
                gitCloneDepth: 1,
                gitSubmodulesConfig: {
                    fetchSubmodules: false
                },
                location: "https://github.com/Loram-Technologies/digitalclone_rail-ui.git",
                reportBuildStatus: false
            },
            serviceRole: props.serviceRole,
            environment: {
                image: 'aws/codebuild/standard:7.0',
                computeType: 'BUILD_GENERAL1_MEDIUM',
                privileged: false,
                type: "LINUX_CONTAINER",
                environmentVariables: [
                    {
                      name: "NODE_ENV",
                      value: props.nodeEnv || process.env.NODE_ENV || "'development'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "ACCOUNT_ID",
                      value: props.accountId || "'569575870388'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "STACK_SUFFIX",
                      value: props.stackSuffix || "'Dev'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "REGION",
                      value: process.env.REGION || "'us-east-1'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "SUB_DOMAIN",
                      value: props.subDomain || process.env.SUB_DOMAIN || "'dev.digitaltwin'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_SUB_DOMAIN",
                      value: props.subDomain || process.env.VUE_APP_SUB_DOMAIN || "'dev.digitaltwin'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_ENV_NAME",
                      value: process.env.VUE_APP_ENV_NAME || props.vueEnv || "dev",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_RAIL_API_BASE",
                      value: apiUrl || "'https://api.digitaltwin.loram.com/prod'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_UM_API_BASE",
                      value: userApiUrl || "'https://user.digitaltwin.loram.com/prod'",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_USER_POOL_WEB_CLIENT_ID",
                      value: process.env.VUE_APP_USER_POOL_WEB_CLIENT_ID || props.umAppClientId || "",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_USER_POOL_ID",
                      value: process.env.VUE_APP_USER_POOL_ID || props.umAppUserPoolId || "",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_SAML_CLIENT_ID",
                      value: process.env.VUE_APP_SAML_CLIENT_ID || props.umSSOClientId || "",
                      type: "PLAINTEXT"
                    },
                    {
                      name: "VUE_APP_SAML_USER_POOL",
                      value: process.env.VUE_APP_SAML_USER_POOL || props.umSSOUserPoolId || "",
                      type: "PLAINTEXT"
                    }
                ],
            },
            badgeEnabled: false,
            cache: {
                type: "NO_CACHE"
            },
            description: "Rail Platform UI Direct Build",
            logsConfig: {
                cloudWatchLogs: {
                    status: "ENABLED"
                },
                s3Logs: {
                    status: "DISABLED"
                }
            },
            queuedTimeoutInMinutes: 8 * 60,
            timeoutInMinutes: 240
        });

        new cdk.CfnOutput(this, 'RailPlatformUIDirectARN', {
            value: codeBuildDirect.attrArn,
            exportName: `${id}:RailPlatformUIDirect`,
        });
    }
}
