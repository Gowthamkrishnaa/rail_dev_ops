
const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');

const VPC_CIDR = '10.1.0.0/16';
const PUBLIC_SUBNET_1_CIDR = '10.1.1.0/24';
const PUBLIC_SUBNET_2_CIDR = '10.1.2.0/24';
const PRIVATE_SUBNET_1_CIDR = '10.1.10.0/24';
const PRIVATE_SUBNET_2_CIDR = '10.1.11.0/24';
const PRIVATE_SUBNET_3_CIDR = '10.1.12.0/24';

module.exports = class VpcStack extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const prefix = 'Rail';
    
        /* VPC Setup */
        const vpc = new ec2.CfnVPC(this, `${prefix}Vpc`,{
            cidrBlock: VPC_CIDR,
            tags: [{'key': 'Name', 'value': `${id} Vpc`}],
        });
        const internetGateway = new ec2.CfnInternetGateway(this, `${prefix}InternetGateway`, {
            vpcId: vpc.ref,
            tags: [{'key': 'Name', 'value': `${id} Internet Gateway`}],
        });
        new ec2.CfnVPCGatewayAttachment(this, `${prefix}VpcGatewayAttachment`, {
            vpcId: vpc.ref,
            internetGatewayId: internetGateway.ref,
            tags: [{'key': 'Name', 'value': `${id} VPC Gateway Attachment`}],
        });

        /* Public Subnets */
        const publicSubnet1 = new ec2.CfnSubnet(this, `${prefix}PublicSubnet1`, {
            vpcId: vpc.ref,
            cidrBlock: PUBLIC_SUBNET_1_CIDR,
            mapPublicIpOnLaunch: true,
            availabilityZone: `${cdk.Aws.REGION}a`,
            tags: [{'key': 'Name', 'value': `${id} Public Subnet - 1`}],
        });
        const publicSubnet2 = new ec2.CfnSubnet(this, `${prefix}PublicSubnet2`, {
            vpcId: vpc.ref,
            cidrBlock: PUBLIC_SUBNET_2_CIDR,
            mapPublicIpOnLaunch: true,
            availabilityZone: `${cdk.Aws.REGION}b`,
            tags: [{'key': 'Name', 'value': `${id} Public Subnet - 2`}],
        });

        /* Private Subnets */
        const privateSubnet1 = new ec2.CfnSubnet(this, `${prefix}PrivateSubnet1`, {
            vpcId: vpc.ref,
            cidrBlock: PRIVATE_SUBNET_1_CIDR,
            mapPublicIpOnLaunch: false,
            availabilityZone: `${cdk.Aws.REGION}a`,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet - 1`}],
        });

        const privateSubnet2 = new ec2.CfnSubnet(this, `${prefix}PrivateSubnet2`, {
            vpcId: vpc.ref,
            cidrBlock: PRIVATE_SUBNET_2_CIDR,
            mapPublicIpOnLaunch: false,
            availabilityZone: `${cdk.Aws.REGION}b`,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet - 2`}],
        });
        const privateSubnet3 = new ec2.CfnSubnet(this, `${prefix}PrivateSubnet3`, {
            vpcId: vpc.ref,
            cidrBlock: PRIVATE_SUBNET_3_CIDR,
            mapPublicIpOnLaunch: false,
            availabilityZone: `${cdk.Aws.REGION}c`,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet - 3`}],
        });


        /* Networking Gateway */
        const natGateway1EIP = new ec2.CfnEIP(this, `${prefix}NAT_EIP1`, {
            domain: 'vpc',
            tags: [{'key': 'Name', 'value': `${id} NAT EIP - 1`}],
        });
        const natGateway1 = new ec2.CfnNatGateway(this, `${prefix}NATGateway1`, {
            allocationId: natGateway1EIP.attrAllocationId,
            subnetId: publicSubnet1.ref,
            tags: [{'key': 'Name', 'value': `${id} NAT Gateway - 1`}],
        });
        const publicRouteTable = new ec2.CfnRouteTable(this, `${prefix}PublicRouteTable`, {
            vpcId: vpc.ref,
            tags: [{'key': 'Name', 'value': `${id} Public Route Table`}],
        });

        /* Public Route Table */
        new ec2.CfnRoute(this, `${prefix}PublicRoute`, {
            routeTableId: publicRouteTable.ref,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.ref,
            tags: [{'key': 'Name', 'value': `${id} Public Route`}],
        });
        new ec2.CfnSubnetRouteTableAssociation(this, `${prefix}PublicSubnet1RouteTableAssociation`, {
            routeTableId: publicRouteTable.ref,
            subnetId: publicSubnet1.ref,
            tags: [{'key': 'Name', 'value': `${id} Public Subnet Route Table Association - 1`}],
        });
        new ec2.CfnSubnetRouteTableAssociation(this, `${prefix}PublicSubnet2RouteTableAssociation`, {
            routeTableId: publicRouteTable.ref,
            subnetId: publicSubnet2.ref,
            tags: [{'key': 'Name', 'value': `${id} Public Subnet Route Table Association - 2`}],
        });

        /* Private Route Table */
        const privateRouteTable = new ec2.CfnRouteTable(this, `${prefix}PrivateRouteTable`, {
            vpcId: vpc.ref,
            tags: [{'key': 'Name', 'value': `${id} Private Route Table`}],
        });
        new ec2.CfnRoute(this, `${prefix}PrivateRoute`, {
            routeTableId: privateRouteTable.ref,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway1.ref,
            tags: [{'key': 'Name', 'value': `${id} Private Route`}],
        });
        new ec2.CfnSubnetRouteTableAssociation(this, `${prefix}PrivateSubnet1RouteTableAssociation`, {
            routeTableId: privateRouteTable.ref,
            subnetId: privateSubnet1.ref,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet Route Table Association - 1`}],
        });
        new ec2.CfnSubnetRouteTableAssociation(this, `${prefix}PrivateSubnet2RouteTableAssociation`, {
            routeTableId: privateRouteTable.ref,
            subnetId: privateSubnet2.ref,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet Route Table Association - 2`}],
        });
        new ec2.CfnSubnetRouteTableAssociation(this, `${prefix}PrivateSubnet3RouteTableAssociation`, {
            routeTableId: privateRouteTable.ref,
            subnetId: privateSubnet3.ref,
            tags: [{'key': 'Name', 'value': `${id} Private Subnet Route Table Association - 3`}],
        });

        /* No Ingress Security Group */
        new ec2.CfnSecurityGroup(this, `${prefix}NoIngressSecurityGroup`, {
            vpcId: vpc.ref,
            groupName: 'no-ingress-sg',
            groupDescription: 'Security group with no ingress rule',
            tags: [{'key': 'Name', 'value': `${id} No Ingress Security Group`}],
        });

        /* Cloud Formation Outputs */
        new cdk.CfnOutput(this, 'version', {
            value: props.version,
            exportName: `${id}:version`,
        });
        new cdk.CfnOutput(this, 'vpc', {
            value: vpc.ref,
            exportName: `${id}:vpc`,
        });
        new cdk.CfnOutput(this, 'internetGateway', {
            value: internetGateway.ref,
            exportName: `${id}:internetGateway`,
        });
        new cdk.CfnOutput(this, 'natGateway1', {
            value: natGateway1.ref,
            exportName: `${id}:natGateway1`,
        });
        new cdk.CfnOutput(this, 'privateSubnet1', {
            value: privateSubnet1.ref,
            exportName: `${id}:privateSubnet1`,
        });
        new cdk.CfnOutput(this, 'privateSubnet2', {
            value: privateSubnet2.ref,
            exportName: `${id}:privateSubnet2`,
        });
        new cdk.CfnOutput(this, 'privateSubnet3', {
            value: privateSubnet3.ref,
            exportName: `${id}:privateSubnet3`,
        });
        new cdk.CfnOutput(this, 'publicSubnet1', {
            value: publicSubnet1.ref,
            exportName: `${id}:publicSubnet1`,
        });
        new cdk.CfnOutput(this, 'publicSubnet2', {
            value: publicSubnet2.ref,
            exportName: `${id}:publicSubnet2`,
        });
    }
}
