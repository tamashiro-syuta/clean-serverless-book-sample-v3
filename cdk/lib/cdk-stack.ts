import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
} from "aws-cdk-lib/aws-lambda";
import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as dotenv from "dotenv";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

dotenv.config({ path: "../.env" });

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const dynamoTable = new Table(this, "ResourceTable", {
      partitionKey: { name: "PK", type: AttributeType.STRING },
      sortKey: { name: "SK", type: AttributeType.STRING },
      tableName: process.env.DYNAMO_TABLE_NAME,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // API Gateway
    const api = new RestApi(this, "CleanServerlessBookSampleApi", {
      restApiName: "CleanServerlessBookSampleAPI",
      deployOptions: {
        stageName: "dev",
      },
    });

    // Lambda Functions and API Gateway Integrations
    const imagePath = "../app";
    const createLambdaFunction = (target: string, functionName: string) => {
      return new DockerImageFunction(this, functionName, {
        functionName: `clean-serverless-${functionName}`,
        code: DockerImageCode.fromImageAsset(imagePath, {
          target: target,
        }),
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(30),
        memorySize: 1280,
        environment: {
          DYNAMO_TABLE_NAME: process.env.DYNAMO_TABLE_NAME || "",
          DYNAMO_PK_NAME: process.env.DYNAMO_PK_NAME || "",
          DYNAMO_SK_NAME: process.env.DYNAMO_SK_NAME || "",
        },
      });
    };

    const addApiIntegration = (
      path: string,
      method: string,
      lambdaFunction: DockerImageFunction
    ) => {
      const integration = new LambdaIntegration(lambdaFunction);
      api.root.resourceForPath(path).addMethod(method, integration);
    };

    // Define all Lambda functions
    const functions = [
      {
        name: "deleteMicropost",
        method: "DELETE",
        apiPath: "/v1/users/{user_id}/microposts/{micropost_id}",
      },
      { name: "deleteUser", method: "DELETE", apiPath: "/v1/users/{user_id}" },
      {
        name: "getMicropost",
        method: "GET",
        apiPath: "/v1/users/{user_id}/microposts/{micropost_id}",
      },
      {
        name: "getMicroposts",
        method: "GET",
        apiPath: "/v1/users/{user_id}/microposts",
      },
      { name: "getUser", method: "GET", apiPath: "/v1/users/{user_id}" },
      { name: "getUsers", method: "GET", apiPath: "/v1/users" },
      {
        name: "postMicroposts",
        method: "POST",
        apiPath: "/v1/users/{user_id}/microposts",
      },
      { name: "postUsers", method: "POST", apiPath: "/v1/users" },
      {
        name: "putMicropost",
        method: "PUT",
        apiPath: "/v1/users/{user_id}/microposts/{micropost_id}",
      },
      { name: "putUser", method: "PUT", apiPath: "/v1/users/{user_id}" },
      { name: "hello", method: "POST", apiPath: "/v1/hello" },
    ];

    // Create Lambda functions and integrate them with API Gateway
    for (const { name, apiPath, method } of functions) {
      const lambdaFunction = createLambdaFunction("api", name);
      dynamoTable.grantFullAccess(lambdaFunction);
      lambdaFunction.addToRolePolicy(
        new PolicyStatement({
          actions: ["dynamodb:*", "logs:*"],
          effect: Effect.ALLOW,
          resources: ["*"],
        })
      );
      addApiIntegration(apiPath, method, lambdaFunction);
    }

    // S3 Bucket
    const bucket = new Bucket(this, "CleanServerlessTestBucket", {
      bucketName: "clean-serverless-test",
    });

    // NOTE: Lambda 関数の作成と S3 バケットの紐づけ:
    const s3HandlerFunction = createLambdaFunction("s3event", "s3Handler");
    // NOTE: アクセス権限の付与
    bucket.grantReadWrite(s3HandlerFunction);
    dynamoTable.grantFullAccess(s3HandlerFunction);
    // NOTE: ロールにポリシーを追加
    s3HandlerFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:*", "logs:*"],
        effect: Effect.ALLOW,
        resources: ["*"],
      })
    );
    // NOTE: S3 イベント通知の追加
    // NOTE: addEventNotificationメソッドを使い、S3バケットにオブジェクトが作成or削除されたときにLambdaを起動
    bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(s3HandlerFunction)
    );
    bucket.addEventNotification(
      EventType.OBJECT_REMOVED,
      new LambdaDestination(s3HandlerFunction)
    );

    // Schedule Event Handler
    const scheduleHandler = createLambdaFunction("schedule", "scheduleHandler");
    scheduleHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["logs:*"],
        effect: Effect.ALLOW,
        resources: ["*"],
      })
    );
    // Create EventBridge Rule
    const eventRule = new Rule(this, "ScheduleRule", {
      // NOTE: 5分ごとに実行
      schedule: Schedule.rate(Duration.minutes(5)),
    });
    eventRule.addTarget(new LambdaFunction(scheduleHandler));
  }
}
