
const cdk = require('aws-cdk-lib');
const certificateManager = require('aws-cdk-lib/aws-certificatemanager');
const route53 = require('aws-cdk-lib/aws-route53');
const apigw = require('aws-cdk-lib/aws-apigateway');
const Output = cdk.CfnOutput;

module.exports = class DomainStack extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const stackSuffix = props.stackSuffix;
        const hostedZoneId = props.hostedZoneId;

        /* New Certificate */
        const certificate = new certificateManager.CfnCertificate(this, 'RailPlatformCertificate', {
            domainName: `${props.subDomain}.${props.domain}.com`.toLowerCase(),
            subjectAlternativeNames: [
                `*.${props.subDomain}.${props.domain}.com`.toLowerCase(),
                `user.${props.subDomain}.${props.domain}.com`.toLowerCase(),
                `api.${props.subDomain}.${props.domain}.com`.toLowerCase(),
                `*.api.${props.subDomain}.${props.domain}.com`.toLowerCase(),
                `simulation.${props.subDomain}.${props.domain}.com`.toLowerCase(),
                `*.simulation.${props.subDomain}.${props.domain}.com`.toLowerCase(),
            ],
            tags: [
                {'key': 'Name', 'value': `RailPlatformCertificate${stackSuffix}`},
                {'key': 'Environment', 'value': stackSuffix},
            ],
            validationMethod: 'DNS',
        });

        /* New Hosted Zone 
            Has been replaced with the manual configuration of the HostedZone
        */
        /* const hostedZone = new route53.CfnHostedZone(this, 'RailPlatformHostedZone', {
            name: `${props.subDomain}.${props.domain}.com`.toLowerCase(),
            hostedZoneConfig: {
                comment: `Rail ${stackSuffix} Environment`
            },
            hostedZoneTags: [
                {'key': 'Name', 'value': `RailPlatformHostedZone${stackSuffix}`},
                {'key': 'Environment', 'value': stackSuffix},
            ],
        }); */

        /* Create API Domain for API Gateway */
        const apiDomainName = new apigw.CfnDomainName(this, 'RailPlatformAPICustomDomain', {
            domainName: `api.${props.subDomain}.${props.domain}.com`.toLowerCase(),
            certificateArn: certificate.ref,
            endpointConfiguration: {
                types: ['EDGE']
            },
        });

        /* TODO: Enable CDK to assume a role and deploy resources accross accounts */
        if( 'dev' === stackSuffix.toLowerCase() || 'stg' === stackSuffix.toLowerCase() ) {
            const apiDomainRecord = new route53.CfnRecordSet(this, 'RailPlatformAPIRecord', {
                name: apiDomainName.domainName,
                type: 'A',
                hostedZoneId: hostedZoneId,
                aliasTarget: {
                    dnsName: apiDomainName.attrDistributionDomainName,
                    hostedZoneId: apiDomainName.attrDistributionHostedZoneId
                }
            });
            apiDomainRecord.addDependsOn(apiDomainName);
        }

        /* Create UserManagement Domain for API Gateway */
        const umDomainName = new apigw.CfnDomainName(this, 'RailUserManagementCustomDomain', {
            domainName: `user.${props.subDomain}.${props.domain}.com`.toLowerCase(),
            certificateArn: certificate.ref,
            endpointConfiguration: {
                types: ['EDGE']
            },
        });
        
        /* TODO: Enable CDK to assume a role and deploy resources accross accounts */
        if( 'dev' === stackSuffix.toLowerCase() || 'stg' === stackSuffix.toLowerCase() ) {
            const umDomainRecord = new route53.CfnRecordSet(this, 'RailUserManagementRecord', {
                name: umDomainName.domainName,
                type: 'A',
                hostedZoneId: hostedZoneId,
                aliasTarget: {
                    dnsName: umDomainName.attrDistributionDomainName,
                    hostedZoneId: umDomainName.attrDistributionHostedZoneId
                }
            });
            umDomainRecord.addDependsOn(umDomainName);
        }

        /* Create Services Domain for API Gateway */
        const simulationDomainName = new apigw.CfnDomainName(this, 'RailSimulationCustomDomain', {
            domainName: `simulation.${props.subDomain}.${props.domain}.com`.toLowerCase(),
            certificateArn: certificate.ref,
            endpointConfiguration: {
                types: ['EDGE']
            },
        });
        /* TODO: Enable CDK to assume a role and deploy resources accross accounts */
        if( 'dev' === stackSuffix.toLowerCase() || 'stg' === stackSuffix.toLowerCase() ) {
            const simulationDomainRecord = new route53.CfnRecordSet(this, 'RailSimulationRecord', {
                name: simulationDomainName.domainName,
                type: 'A',
                hostedZoneId: hostedZoneId,
                aliasTarget: {
                    dnsName: simulationDomainName.attrDistributionDomainName,
                    hostedZoneId: simulationDomainName.attrDistributionHostedZoneId
                }
            });
            simulationDomainRecord.addDependsOn(simulationDomainName);
        }

        new Output(this, 'certificate', {
            value: certificate.ref,
            exportName: `${id}:certificate`
        });
        new Output(this, 'hostedZoneId', {
            value: hostedZoneId,
            exportName: `${id}:hostedZoneId`
        });
        new Output(this, 'apiDomainName', {
            value: apiDomainName.ref,
            exportName: `${id}:apiDomainName`
        });
        new Output(this, 'userManagementDomainName', {
            value: umDomainName.ref,
            exportName: `${id}:userManagementDomainName`
        });
        new Output(this, 'simulationDomainName', {
            value: simulationDomainName.ref,
            exportName: `${id}:simulationDomainName`
        });
        new Output(this, 'version', {
            value: props.version || '0.0.0',
            exportName: `${id}:version`
        });
        new Output(this, 'subDomain', {
            value: props.subDomain,
            exportName: `${id}:subDomain`
        });
    }
};
