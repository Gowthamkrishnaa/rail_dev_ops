
const cdk = require('aws-cdk-lib');
const iam = require('aws-cdk-lib/aws-iam');
const codeartifact = require('aws-cdk-lib/aws-codeartifact');
const kms = require('aws-cdk-lib/aws-kms');
const cb = require('aws-cdk-lib/aws-codebuild');

const CodeBuildResource = cb.CfnProject;
const RoleResource = iam.CfnRole;

module.exports = class RailDevOpsCoreStack extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);
    
        const projectName = `RailDevOps${props.env.suffix}-Direct`;
        const repoPlatformUI = process.env.REPOSITORY_UI || 'Loram-Technologies/digitalclone_rail-ui';
        const repoRailAPI = process.env.REPOSITORY_API || 'Loram-Technologies/rail-api';
        const repoRailSimlation = process.env.REPOSITORY_SIMULATION || 'Loram-Technologies/rail-simulation';

        const codeBuildPolicyStatement = {
            Effect: 'Allow',
            Action: [
                'iam:GetRole',
                'iam:CreateRole',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                'iam:DeleteRole',
                'iam:PassRole',
                'ssm:GetParameters',
                'sts:GetServiceBearerToken',
                's3:PutObject',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:GetBucketAcl',
                's3:GetBucketLocation',
                'dynamodb:DescribeTable',
                'dynamodb:CreateTable',
                'dynamodb:DeleteTable',
                'apigateway:GET',
                'apigateway:PATCH',
                'apigateway:POST',
                'apigateway:DELETE',
                'lambda:GetFunction',
                'lambda:AddPermission',
                'lambda:CreateFunction',
                'lambda:DeleteFunction',
                'lambda:PutFunctionConcurrency',
                'lambda:GetEventSourceMapping',
                'lambda:RemovePermission',
                'lambda:CreateEventSourceMapping',
                'lambda:DeleteEventSourceMapping',
                'lambda:UpdateFunctionCode',
                'codebuild:CreateReportGroup',
                'codebuild:CreateReport',
                'codebuild:UpdateReport',
                'codebuild:BatchPutTestCases',
                'codebuild:BatchPutCodeCoverages',
                'codeartifact:GetAuthorizationToken',
                'codeartifact:GetRepositoryEndpoint',
                'codeartifact:ListPackages',
                'codeartifact:ListPackageVersions',
                'codeartifact:ReadFromRepository',
                'cloudformation:ListExports',
                'cloudformation:ListExports',
                'cloudformation:DescribeStacks',
                'cloudformation:CreateChangeSet',
                'cloudformation:DescribeChangeSet',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:DescribeStackEvents',
                'cloudformation:GetTemplate',
                'cloudformation:DeleteChangeSet',
                'cognito-idp:CreateUserPool',
                'cognito-idp:DeleteUserPool',
                'cognito-idp:SetUserPoolMfaConfig',
                'cognito-idp:SetRiskConfiguration',
                'cognito-idp:CreateUserPoolClient',
                'cognito-idp:DeleteUserPoolClient',
                'cognito-idp:CreateUserPoolDomain',
                'cognito-idp:DeleteUserPoolDomain',
                'cognito-identity:CreateIdentityPool',
                'cognito-identity:DeleteIdentityPool',
                'cognito-identity:SetIdentityPoolRoles',
                'codestar-connections:UseConnection'
            ],
            Resource: '*'
        }
        
        const codeBuildPolicyLogs = {
            Effect: 'Allow',
            Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            Resource: 'arn:aws:logs:*:*:*'
        }

        const codebuildRole = new RoleResource(this, 'RailCodeBuildRole', {
            path: '/',
            assumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'codebuild.amazonaws.com'
                    },
                    Action: 'sts:AssumeRole'
                }
            },
            policies: [
                {
                    policyName: 'logs',
                    policyDocument: {
                        Statement: [codeBuildPolicyLogs]
                    }
                },
                {
                    policyName: 'servicesDeployment',
                    policyDocument: {
                        Statement: [codeBuildPolicyStatement]
                    }
                }
            ]
        });

        const codebuildServicesRole = new RoleResource(this, 'RailServicesCodeBuildRole', {
            path: '/',
            assumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'codebuild.amazonaws.com'
                    },
                    Action: 'sts:AssumeRole'
                }
            },
            policies: [
                {
                    policyName: 'servicesCreation',
                    policyDocument: {
                        Statement: {
                            Effect: 'Allow',
                            Action: [
                                'SNS:*',
                                'SQS:*',
                                'ec2:*',
                                'S3:*'
                            ],
                            Resource: '*'
                        }
                    }
                },
                {
                    policyName: 'logs',
                    policyDocument: {
                        Statement: [codeBuildPolicyLogs]
                    }
                },
                {
                    policyName: 'servicesDeployment',
                    policyDocument: {
                        Statement: [codeBuildPolicyStatement]
                    }
                }
            ]
        });

        const codebuildPipelineRole = new RoleResource(this, 'RailServicesPipelineRole', {
            path: '/',
            assumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'codepipeline.amazonaws.com'
                    },
                    Action: 'sts:AssumeRole'
                }
            },
            policies: [
                {
                    policyName: 'logs',
                    policyDocument: {
                        Statement: [codeBuildPolicyLogs]
                    }
                },
                {
                    policyName: 'servicesDeployment',
                    policyDocument: {
                        Statement: [codeBuildPolicyStatement]
                    }
                },
                {
                    policyName: 'codePipeline',
                    policyDocument: {
                        Statement: {
                            Effect: 'Allow',
                            Action: [
                                'codepipeline:*',
                                'codestar:*',
                                's3:*',
                                'codebuild:StartBuild',
                                'codebuild:BatchGetBuilds'
                            ],
                            Resource: '*'
                        }
                    }
                },
            ]
        });

        const codeBuildDirect = new CodeBuildResource(this, 'RailDevOpsDirect', {
            artifacts: {
                type: 'NO_ARTIFACTS',
            },
            environment: {
                computeType: 'BUILD_GENERAL1_SMALL',
                image: 'aws/codebuild/standard:7.0',
                type: 'LINUX_CONTAINER',
                privilegedMode: true, // Must be true to run docker build
                environmentVariables: [
                    {
                        name: 'ACCOUNT_ID',
                        value: props.accountId || '569575870388',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'STG_ACCOUNT_ID',
                        value: process.env.STG_ACCOUNT_ID || '',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'PROD_ACCOUNT_ID',
                        value: process.env.PROD_ACCOUNT_ID || '',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'REGION',
                        value: process.env.REGION || 'us-east-1',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'DOMAIN',
                        value: process.env.DOMAIN || 'loram',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'SUB_DOMAIN',
                        value: props.subDomain || 'dev.digitaltwin',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'STACK_SUFFIX',
                        value: process.env.STACK_SUFFIX || 'Dev',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'CODE_ARTIFACT_REPOSITORY',
                        value: process.env.CODE_ARTIFACT_REPOSITORY || 'loram-digital',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'CODE_ARTIFACT_DOMAIN',
                        value: process.env.CODE_ARTIFACT_DOMAIN || 'loram-digital-domain',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'VERSION',
                        value: process.env.VERSION || '3.0.0',
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'REPOSITORY_UI',
                        value: repoPlatformUI,
                        type: 'PLAINTEXT'
                    },
                    {
                        name: 'REPOSITORY_API',
                        value: repoRailAPI,
                        type: 'PLAINTEXT'
                    }
                ]
            },
            name: projectName,
            serviceRole: codebuildRole.attrArn,
            source: {
                type: 'GITHUB',
                auth: {
                    type: 'OAUTH',
                },
                buildSpec: 'buildspec.yml',
                gitCloneDepth: 1,
                gitSubmodulesConfig: {
                    fetchSubmodules: false
                },
                location: 'https://github.com/Loram-Technologies/rail_dev_ops.git',
                reportBuildStatus: false,
            },
            badgeEnabled: false,
            cache: {
                type: 'NO_CACHE',
            },
            description: 'Rail Api Direct Build',
            logsConfig: {
                cloudWatchLogs: {
                    status: 'ENABLED',
                },
                s3Logs: {
                    status: 'DISABLED',
                }
            },
            queuedTimeoutInMinutes: 8 * 60,
            tags: [
                {
                    key: 'Name',
                    value: projectName
                }
            ],
            timeoutInMinutes: 240,
        });

        /* Only Deploy Code Artifact to Dev */
        if(process.env.STACK_SUFFIX.toLowerCase() === 'dev') {
            var encryptionKey = new kms.Key(this, 'Key', {
                enableKeyRotation: true,
            });
    
            var domain = new codeartifact.CfnDomain(this, 'RailPlatformDomain', {
                domainName: props.artifactDomainName,
                encryptionKey: encryptionKey.attrArn,
                permissionsPolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                AWS: [
                                    'arn:aws:iam::' + props.prodAccountId + ':root'
                                ]
                            },
                            Action: [
                                "codeartifact:CreateRepository",
                                "codeartifact:DescribeDomain",
                                "codeartifact:GetAuthorizationToken",
                                "codeartifact:GetDomainPermissionsPolicy",
                                "codeartifact:ListRepositoriesInDomain",
                                "sts:GetServiceBearerToken"
                            ],
                            Resource: '*'
                        }
                    ]
                }
            });
    
            var repository = new codeartifact.CfnRepository(this, 'RailPlatformRepository', {
                domainName: domain.domainName,
                repositoryName: props.artifactRepositoryName,
                description: 'Rail platform private npm package repository',
                permissionsPolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                AWS: [
                                    'arn:aws:iam::' + props.prodAccountId + ':root'
                                ]
                            },
                            Action: [
                                'codeartifact:DescribePackageVersion',
                                'codeartifact:DescribeRepository',
                                'codeartifact:GetPackageVersionReadme',
                                'codeartifact:GetRepositoryEndpoint',
                                'codeartifact:ListPackageVersionAssets',
                                'codeartifact:ListPackageVersionDependencies',
                                'codeartifact:ListPackageVersions',
                                'codeartifact:ListPackages',
                                'codeartifact:PublishPackageVersion',
                                'codeartifact:PutPackageMetadata',
                                'codeartifact:ReadFromRepository'
                            ],
                            Resource: '*'
                        }
                    ]
                }
            }).addDependsOn(domain);
        }

        new cdk.CfnOutput(this, 'RailDevOpsProject', {
            value: codeBuildDirect.attrArn,
            exportName: `${id}:RailDevOpsProject`,
        });
        new cdk.CfnOutput(this, 'CodeBuildRoleARN', {
            value: codebuildRole.attrArn,
            exportName: `${id}:CodeBuildRoleARN`,
        });
        new cdk.CfnOutput(this, 'ServicesCodeBuildRoleARN', {
            value: codebuildServicesRole.attrArn,
            exportName: `${id}:ServicesCodeBuildRoleARN`,
        });
        new cdk.CfnOutput(this, 'ServicesPipelineARN', {
            value: codebuildPipelineRole.attrArn,
            exportName: `${id}:ServicesPipelineARN`,
        });
        new cdk.CfnOutput(this, 'PlatformUIURL', {
            value: repoPlatformUI,
            exportName: `${id}:PlatformUIURL`,
        });
        new cdk.CfnOutput(this, 'RailAPIURL', {
            value: repoRailAPI,
            exportName: `${id}:RailAPIURL`,
        });
        new cdk.CfnOutput(this, 'RailSimulationURL', {
            value: repoRailSimlation,
            exportName: `${id}:RailSimulationURL`,
        });

        /* Only Deploy Code Artifact to Dev */
        if(process.env.STACK_SUFFIX.toLowerCase() === 'dev') {
            new cdk.CfnOutput(this, 'CodeArtifactDomainARN', {
                value: domain.attrArn,
                exportName: `${id}:CodeArtifactDomainARN`,
            });
            new cdk.CfnOutput(this, 'CodeArtifactConnection', {
                value: `aws codeartifact login --tool npm --repository ${props.artifactRepositoryName} --domain ${props.artifactDomainName} --domain-owner ${props.accountId}`,
                exportName: `${id}:CodeArtifactConnection`,
            });
        }
    }
}
