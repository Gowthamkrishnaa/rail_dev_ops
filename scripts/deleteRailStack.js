
const { resolve } = require('path');

const execSync = require('child_process').execSync;

const env = process.env.STACK_SUFFIX || 'Dev';

function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
}

(async ()=>{
    console.log(`Starting to tear down the stack in ${env}`)

    const results1 = await execSync(`aws cloudformation delete-stack --stack-name RailPlatformUI${env}`);
    console.log('Deleting PlatformUI Stack', results1.toString('utf-8'))
    await delay(2000);

    const results2a = await execSync(`aws s3 rb s3://loram-digital-wear-uploads-${env.toLowerCase()}/ --force`);
    console.log('Deleting Rail API S3 Wear Bucket', results2a.toString('utf-8'))
    const results2b = await execSync(`aws s3 rb s3://loram-digital-vti-files-${env.toLowerCase()}/ --force`);
    console.log('Deleting Rail API S3 VTI Bucket', results2b.toString('utf-8'))
    await delay(2000);

    const results2c = await execSync(`aws cloudformation delete-stack --stack-name RailApi${env}`);
    console.log('Deleting Rail API Stack', results2c.toString('utf-8'))
    await delay(5000);

    const results3 = await execSync(`aws cloudformation delete-stack --stack-name RailUserManagement${env}`);
    console.log('Deleting Rail UserManagement Stack', results3.toString('utf-8'))
    await delay(1000);

    console.log(`Completed Step 1`);
    console.log('Step 2: $ npm run destroy-stack');
    console.log('!!! Manual Steps include deleting...');
    console.log('1.) IAM - delete RailCodeBuildRole');
    console.log(`2.) Hosted Zones - delete RailPlatformHostedZone`);
    console.log(`3.) CloudFront Origin access - delete Access Control`);
})()
