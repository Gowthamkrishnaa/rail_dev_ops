const execSync = require('child_process').execSync;

(async ()=>{
    const domain = process.env.CODE_ARTIFACT_DOMAIN || 'loram-digital-domain';
    const repository = process.env.CODE_ARTIFACT_REPOSITORY || 'loram-digital';

    const results = await execSync(`aws codeartifact list-packages --domain ${domain} --repository ${repository}`);
    const {packages} = JSON.parse(results.toString('utf-8'));

    await Promise.all(packages.map(async package => {
        let response = await execSync(`aws codeartifact list-package-versions --domain ${domain} --repository ${repository} --format ${package.format} --namespace ${package.namespace} --package ${package.package}`);
        let versions = JSON.parse(response.toString('utf-8'));
        console.log(`Versions for ${package.package}:\n`, versions);
    }));

    console.log('Deleting a package version: https://docs.aws.amazon.com/cli/latest/reference/codeartifact/delete-package-versions.html')
    console.log(`aws codeartifact delete-package-versions --domain ${domain} --repository ${repository} --namespace loram-digital --format npm --package <name_of_package> --versions <version_to_delete>`)
    console.log('\n')
    console.log('Deleting Tags from Local and GitHub repos')
    console.log(`git tag -d <tag_name> && git push --delete origin <tag_name>`)
})()
