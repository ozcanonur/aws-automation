import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecr from '@aws-cdk/aws-ecr';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
// import * as s3 from '@aws-cdk/aws-s3';
// import * as s3Deploy from '@aws-cdk/aws-s3-deployment';

export class AutomateFargate extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dockerRepositoryName = process.env.REPO_NAME || '';
    const appName = process.env.APP_NAME || '';
    const containerPort = parseInt(process.env.CONTAINER_PORT || '80');
    const desiredCount = parseInt(process.env.DESIRED_COUNT || '2');
    const region = process.env.REGION || '';
    const accessKeyId = process.env.ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.SECRET_ACCESS_KEY || '';

    const defaultVpc = ec2.Vpc.fromLookup(this, 'vpc-lookup', {
      isDefault: true,
    });

    // Create cluster
    const cluster = new ecs.Cluster(this, 'cluster', {
      clusterName: `${appName}-cluster`,
      vpc: defaultVpc,
    });

    // Create task definitions
    const taskDefinition = new ecs.TaskDefinition(this, 'task-definition', {
      family: `${appName}-task-definition`,
      compatibility: ecs.Compatibility.FARGATE,
      memoryMiB: '0.5GB',
      cpu: '.25 vCPU',
    });

    const repo = ecr.Repository.fromRepositoryName(this, 'repository', dockerRepositoryName);
    taskDefinition.addContainer('container', {
      containerName: `${appName}-container`,
      image: ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
      memoryLimitMiB: 350,
      environment: {
        REGION: region,
        ACCESS_KEY_ID: accessKeyId,
        SECRET_ACCESS_KEY: secretAccessKey,
      },
      portMappings: [
        {
          containerPort,
        },
      ],
    });

    // Create service
    const serviceSg = new ec2.SecurityGroup(this, 'sg', {
      vpc: defaultVpc,
      securityGroupName: `${appName}-service-sg`,
    });

    serviceSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    // This is for postgres inbound
    serviceSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432));

    const service = new ecs.FargateService(this, 'service', {
      cluster,
      taskDefinition,
      serviceName: `${appName}-service`,
      desiredCount,
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      enableECSManagedTags: true,
      assignPublicIp: true,
      securityGroups: [serviceSg],
    });

    // Create load balancer
    const loadBalancer = new elb.ApplicationLoadBalancer(this, 'lb', {
      loadBalancerName: `${appName}-lb`,
      vpc: defaultVpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener('Listener', {
      port: 80,
    });

    // Connect lb with service
    service.registerLoadBalancerTargets({
      containerName: `${appName}-container`,
      containerPort,
      newTargetGroupId: `${appName}-target`,
      listener: ecs.ListenerConfig.applicationListener(listener, {
        protocol: elb.ApplicationProtocol.HTTP,
      }),
    });

    // // Create s3 bucket
    // const bucket = new s3.Bucket(this, 'bucket', {
    //   bucketName: `${appName}-images`,
    // });

    // // Need to do yarn bootstrap before this to setup intermediary bucket
    // new s3Deploy.BucketDeployment(this, 'deployment', {
    //   sources: [s3Deploy.Source.asset('./s3Images')],
    //   destinationBucket: bucket,
    // });

    // Add port:5432 > source: service-sg to postgre SG
  }
}
