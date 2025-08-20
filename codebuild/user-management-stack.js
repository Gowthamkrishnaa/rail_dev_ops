const cdk = require('aws-cdk-lib');
const cb = require('aws-cdk-lib/aws-codebuild');
const CodeBuildResource = cb.CfnProject;

module.exports = class CBRailUserManagementDeploy extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const projectName = `RailUserManagement${props.env.suffix}-Direct`;
        const codeBuildDirect = new CodeBuildResource(this, 'RailUserManagement-Direct', {
            name: projectName,
            artifacts: {
                type: "NO_ARTIFACTS"
            },
            source: {
                type: "GITHUB",
                auth: {
                    type: "OAUTH"
                },
                buildSpec: "direct-buildspec.yml",
                gitCloneDepth: 1,
                gitSubmodulesConfig: {
                    fetchSubmodules: false
                },
                location: "https://github.com/Loram-Technologies/rail_user_management.git",
                reportBuildStatus: false
            },
            serviceRole: props.serviceRole,
            environment: {
                image: 'aws/codebuild/standard:7.0',
                computeType: 'BUILD_GENERAL1_SMALL',
                privileged: false,
                type: "LINUX_CONTAINER",
                environmentVariables: [
                    {
                        name: "STACK_SUFFIX",
                        value: props.stackSuffix || "Dev",
                        type: "PLAINTEXT"
                    },
                    {
                        name: "ACCOUNT_ID",
                        value: props.accountId || "569575870388",
                        type: "PLAINTEXT"
                    },
                    {
                        name: "REGION",
                        value: process.env.REGION || "us-east-1",
                        type: "PLAINTEXT"
                    },
                    {
                        name: "SUB_DOMAIN",
                        value: props.subDomain || process.env.SUB_DOMAIN || "dev.digitaltwin",
                        type: "PLAINTEXT"
                    },
                    {
                        name: "API_DOMAIN_NAME",
                        value: props.apiDomainName || process.env.UM_API_DOMAIN_NAME || "user.digitaltwin.loram.com",
                        type: "PLAINTEXT"
                    },
                ]
            },
            badgeEnabled: false,
            cache: {
                type: "NO_CACHE"
            },
            description: "Rail User Management Direct Build",
            logsConfig: {
                cloudWatchLogs: {
                    status: "ENABLED"
                },
                s3Logs: {
                    status: "DISABLED"
                }
            },
            queuedTimeoutInMinutes: 8 * 60,
            tags: [{
                key: 'Name',
                value: projectName
            }],
            timeoutInMinutes: 240
        });

        new cdk.CfnOutput(this, 'RailUserManagementDirect', {
            value: codeBuildDirect.attrArn,
            exportName: `${id}:RailUserManagementDirect`,
        });
        new cdk.CfnOutput(this, 'version', {
            value: props.version || '0.0.0',
            exportName: `${id}:version`,
        });
    }
}
