# Welcome to your CDK Fargate automation!

The `cdk.json` file tells the CDK Toolkit how to execute the app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## .env

- ACCOUNT=
- REGION=
- APP_NAME=NAME_TO_PREFIX_AWS_SERVICES
- REPO_NAME=ECR_REPO_NAME
- CONTAINER_PORT=DOCKER_INSTANCES_LISTEN_ON
- DESIRED_COUNT=ECS_SERVICE_TASK_COUNT
