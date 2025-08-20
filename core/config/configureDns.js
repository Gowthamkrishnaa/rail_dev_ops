

const AWS = require('aws-sdk');

const getHostedZone = async(profile, domain) => {
    setProfile(profile);
    const route53 = new AWS.Route53({region: process.env.REGION});
    const hostedZones = await route53.listHostedZonesByName({
        DNSName: domain.toLowerCase()
    }).promise();
    const hostedZone = hostedZones.HostedZones.find( ({Name}) => Name === `${domain}.`.toLowerCase());
    const hostedZoneId = hostedZone.Id.replace('/hostedzone/','');
    return hostedZoneId;
}

const getCertificate = async(profile, domain) => {
    setProfile(profile);
    const acm = new AWS.ACM({region: process.env.REGION});
    const certificates = await acm.listCertificates({
        CertificateStatuses: ['PENDING_VALIDATION']
    }).promise();
    const certificate = certificates.CertificateSummaryList.find( ({DomainName}) => DomainName === domain.toLowerCase());
    const certificateArn = certificate.CertificateArn;
    return certificateArn;
}


/* Fetch NameServers from new hosted zone */
const getNameServers = async (profile, domain, hostedZoneId) => {
    setProfile(profile);
    const route53 = new AWS.Route53({region: process.env.REGION});
    const recordSets = await route53.listResourceRecordSets({
        HostedZoneId: hostedZoneId
    }).promise();
    const recordSet = recordSets.ResourceRecordSets
        .filter(r=> { return r.Type === 'NS'})
        .filter(f=> { return f.Name === `${domain}.`.toLowerCase()})
    return recordSet[0];
};

const getCertificateDomainValidationOptions = async (profile, certificateArn) => {
    setProfile(profile);
    const acm = new AWS.ACM({region: process.env.REGION});

    const certificate = await acm.describeCertificate({
        CertificateArn: certificateArn
    }).promise();
    const domainOptions = certificate && certificate.Certificate && certificate.Certificate.DomainValidationOptions;
    return domainOptions;
}

const assignDnsCnames = async(profile, domain, hostedZoneId, certificateDomainValidationOptions) => {
    setProfile(profile);
    const route53 = new AWS.Route53({region: process.env.REGION});
    const params = {
        ChangeBatch: {
            Comment: `Certificate for ${process.env.STACK_SUFFIX}`,
            Changes: [],
        },
        HostedZoneId: hostedZoneId,
    }
    certificateDomainValidationOptions.map(d=>{
        if (
            d.DomainName != domain.toLowerCase() &&
            d.DomainName != `*.api.${domain}` && 
            d.DomainName != `*.simulation.${domain}` && 
            d.ValidationMethod === 'DNS' && 
            d.ValidationStatus != 'SUCCESS'
        ){
            params.ChangeBatch.Changes.push({
                Action: 'UPSERT',
                ResourceRecordSet: {
                    Name: d.ResourceRecord.Name,
                    Type: d.ResourceRecord.Type,
                    TTL: 60,
                    ResourceRecords: [
                        {
                            Value: d.ResourceRecord.Value,
                        }
                    ],
                }
            })
        }
    });
    if(params.ChangeBatch.Changes.length) {
        const results = await route53.changeResourceRecordSets(params).promise();
        return results;
    }
}

const setProfile = (profileName) => {
    const credentials = new AWS.SharedIniFileCredentials({profile: profileName});
    AWS.config.credentials = credentials;
}

const addNameServersToLegacy = async (profile, domain, nameServerRecordSet) => {
    setProfile(profile);
    const route53 = new AWS.Route53({region: process.env.REGION});
    const hostedZones = await route53.listHostedZonesByName({
        DNSName: domain
    }).promise();
    const hostedZone = hostedZones.HostedZones.find( ({Name}) => Name === `${domain}.`);
    const hostedZoneId = hostedZone.Id.replace('/hostedzone/','');

    const params = {
        ChangeBatch: {
            Comment: `NameServers for ${process.env.STACK_SUFFIX} Environment`,
            Changes: [{
                Action: 'UPSERT',
                ResourceRecordSet: nameServerRecordSet
            }],
        },
        HostedZoneId: hostedZoneId,
    }
    const results = await route53.changeResourceRecordSets(params).promise();
    return results;
};

(async() => {
    let domainName = `${process.env.DOMAIN}.com`.toLowerCase();
    let subDomainName = process.env.SUB_DOMAIN && process.env.SUB_DOMAIN.toLowerCase() || `${process.env.STACK_SUFFIX}.digitaltwin`.toLowerCase();
    let absoluteDomainName = `${subDomainName}.${domainName}`.toLowerCase();

    /* First argument defines environment where we are deploying the cerfificates to */
    let profile = process.argv[2] || 'dev';

    /* HostedZone ID as an environment variable is the perferred method to use */
    const hostedZoneId = process.env.HOSTED_ZONE_ID || await getHostedZone(profile, absoluteDomainName);
    const certificateArn    = await getCertificate(profile, absoluteDomainName);
    const validationOptions = await getCertificateDomainValidationOptions(profile, certificateArn);

    /* Second argument defines environment where Route53 Parent HostedZone to add CNAMES to */
    profile = process.argv[3] || 'dev';

    const assignedDnsCnames = await assignDnsCnames(profile, absoluteDomainName, hostedZoneId, validationOptions);
    const nameServers       = await getNameServers(profile, absoluteDomainName, hostedZoneId);

    console.log('✅ Finished Setting up Subdomian');
})().catch(console.error);

/*
    TODO: Code to undo all of this 
        Route53 NS records in legacy
        Hosted Zone in STACK_SUFFIX (eg. dev)
          |-> Before Zone can be deleted must delete all entries other than NS and SOA
            
*/
