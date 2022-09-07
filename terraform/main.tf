##############################
# Lambda - functions
##############################
// Creates unique hash to watch file change
resource "random_pet" "func_hashs" {
  for_each = local.lambdas
  keepers = {
    for filename in setunion(
      fileset("${local.src_path}/${each.value.path}", "*.js"),
    ) :
    filename => filemd5("${local.src_path}/${each.value.path}/${filename}")
  }
}

// Trigger rebuild only when package.json changes
resource "null_resource" "npm_installs" {
  for_each = local.lambdas
  provisioner "local-exec" {
    command = "npm install --prefix ${local.src_path}/${each.value.path} cwd ${local.src_path}/${each.value.path}"
  }

  triggers = {
    dependencies_versions = filemd5("${local.src_path}/${each.value.path}/package.json")
  }
}

// Creates zip files out of lambda codes
data "archive_file" "func_zip" {
  depends_on = [null_resource.npm_installs]
  for_each   = local.lambdas

  source_dir  = "${local.src_path}/${each.value.path}/"
  output_path = "${local.src_path}/${each.value.path}_${random_pet.func_hashs[each.key].id}.zip"
  excludes = [
    "${local.src_path}/${each.value.path}/*.js",
    "${local.src_path}/${each.value.path}/node_modules",
    "${local.src_path}/${each.value.path}/*.json",
  ]
  type = "zip"
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambdas

  function_name = "${terraform.workspace}-${var.app_name}-${each.key}"
  architectures = ["arm64"]
  publish       = true

  source_code_hash = data.archive_file.func_zip[each.key].output_base64sha256
  filename         = data.archive_file.func_zip[each.key].output_path

  runtime     = "nodejs16.x"
  handler     = "index.handler"
  memory_size = each.value.memory
  timeout     = each.value.timeout

  role = aws_iam_role.lambda_exec.arn

  // define environment variable for this Lambda function
  environment {
    variables = each.value.envs
  }

  tags = merge(var.default_tags, { Project = var.app_name, Environment = terraform.workspace })
}

#################################
# Lambda Logging and Access
#################################
resource "aws_cloudwatch_log_group" "lambdas" {
  for_each          = aws_lambda_function.functions
  name              = "/aws/lambda/${aws_lambda_function.functions[each.key].function_name}"
  retention_in_days = 7

  tags = merge(var.default_tags, { Project = var.app_name, Environment = terraform.workspace })
}

// add role for the function
resource "aws_iam_role" "lambda_exec" {
  name = "${terraform.workspace}-${var.app_name}-lambda_execute"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

// attaches policy the IAM role to allow writing to CloudWatch logs
resource "aws_iam_role_policy_attachment" "exec" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

// allows API GW to execute Lambda
resource "aws_lambda_permission" "api_gw" {
  for_each      = aws_lambda_function.functions
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.apigw_api_endpoint.execution_arn}/*/*"
}

##############################
# API Gateway HTTP
##############################
# Create the API Gateway HTTP endpoint
resource "aws_apigatewayv2_api" "apigw_api_endpoint" {
  name          = "${terraform.workspace}-${var.app_name}-endpoint"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["*"]
    allow_origins = ["*"]
    allow_headers = ["*"]
  }

  tags = merge(var.default_tags, { Project = var.app_name, Environment = terraform.workspace })
}

# Create the API Gateway HTTP integration
resource "aws_apigatewayv2_integration" "integration" {
  for_each         = aws_lambda_function.functions
  api_id           = aws_apigatewayv2_api.apigw_api_endpoint.id
  integration_uri  = aws_lambda_function.functions[each.key].invoke_arn
  integration_type = "AWS_PROXY"
}

# API GW route with ANY method
resource "aws_apigatewayv2_route" "lambda_route" {
  depends_on = [aws_apigatewayv2_integration.integration]
  for_each   = local.lambdas

  api_id    = aws_apigatewayv2_api.apigw_api_endpoint.id
  route_key = "POST ${each.value.route}"
  target    = "integrations/${aws_apigatewayv2_integration.integration[each.key].id}"
}

# Set a default stage
resource "aws_apigatewayv2_stage" "apigw_stage" {
  depends_on  = [aws_apigatewayv2_api.apigw_api_endpoint, aws_cloudwatch_log_group.api_gw]
  api_id      = aws_apigatewayv2_api.apigw_api_endpoint.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format          = jsonencode(local.http_api_access_logs)
  }

  default_route_settings {
    # logging_level           = "INFO"
    detailed_metrics_enabled = true
    throttling_burst_limit   = 100
    throttling_rate_limit    = 100
  }

  tags = merge(var.default_tags, { Project = var.app_name, Environment = terraform.workspace })
}

# ##########################################
# # API GW logging
# ##########################################
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.apigw_api_endpoint.name}"
  retention_in_days = 7

  tags = merge(var.default_tags, { Project = var.app_name, Environment = terraform.workspace })
}

locals {
  http_api_access_logs = {
    # General info
    "requestTime"     = "$context.requestTime"
    "requestId"       = "$context.requestId"
    "httpMethod"      = "$context.httpMethod"
    "path"            = "$context.path"
    "resourcePath"    = "$context.resourcePath"
    "status"          = "$context.status"
    "responseLatency" = "$context.responseLatency"
    # Integration
    "stage"             = "$context.stage"
    "integrationStatus" = "$context.integration.integrationStatus"
    "integrationError"  = "$context.integration.error"
    # Identity
    "ip"        = "$context.identity.sourceIp"
    "userAgent" = "$context.identity.userAgent"
    # Misc
    "protocol"          = "$context.protocol"
    "endpointRequestId" = "$context.awsEndpointRequestId"
    "responseType"      = "$context.error.responseType"
    "errorMsg"          = "$context.error.message"
    "errorMsgString"    = "$context.error.messageString"
  }
}
