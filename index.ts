import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";

// Init S3 Bucket //

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket");

// Export the name of the bucket
export const bucketName = bucket.id;


// Chainlink Node //

// Create VPC and Networking
const myVpc = new aws.ec2.Vpc("myVpc", {
  cidrBlock: "10.10.0.0/16",
  tags: {
    Name: "clnode-pulumi-vpc",
  },
});

const mySubnet = new aws.ec2.Subnet("mySubnet", {
  vpcId: myVpc.id,
  cidrBlock: "10.10.1.0/24",
  availabilityZone: "us-east-1a",
  tags: {
    Name: "clnode-pulumi-subnet",
  },
});

const fooNetworkInterface = new aws.ec2.NetworkInterface("fooNetworkInterface", {
  subnetId: mySubnet.id,
  privateIps: ["10.10.1.25"],
  tags: {
    Name: "clnode-pulumi-primary-nic"
  }
});

// Create AWS instance
const ubuntu = aws.ec2.getAmi({
  mostRecent: true,
  filters: [
    {
      name: "name",
      values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"],
    },
    {
      name: "virtualization-type",
      values: ["hvm"],
    },
  ],
  owners: ["099720109477"]
});

const clnode = new aws.ec2.Instance("clnode", {
  ami: ubuntu.then(ubuntu => ubuntu.id),
  instanceType: "t3.small",
  networkInterfaces: [{
    networkInterfaceId: fooNetworkInterface.id,
    deviceIndex: 0,
  }],
  creditSpecification: {
    cpuCredits: "unlimited",
  },
  tags: {
    Name: "clnode-pulumi",
  }
});

// K8s example //
// need to set up k8s access to eks cluster
// https://www.pulumi.com/registry/packages/kubernetes/installation-configuration/
//
// const appLabels = { app: "nginx" };
//
// const deployment = new k8s.apps.v1.Deployment("nginx", {
//   spec: {
//     selector: { matchLabels: appLabels },
//     replicas: 1,
//     template: {
//       metadata: { labels: appLabels },
//       spec: { containers: [{ name: "nginx", image: "nginx" }] }
//     }
//   }
// });
