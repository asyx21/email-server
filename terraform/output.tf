# Generated public API GW endpoint URL to access private Fargate Cluster
output "apigw_endpoint" {
  value       = aws_apigatewayv2_api.apigw_api_endpoint.api_endpoint
  description = "API Gateway Endpoint"
}

output "lambda_functions" {
  # value       = aws_lambda_function.functions.*.function_name
  value       = [for func in aws_lambda_function.functions : func.function_name]
  description = "Lambda function name"
}
