locals {
  src_path = "${path.module}/../lambda"

  lambdas = {
    forum : {
      path    = "forum"
      memory  = 512
      timeout = 10
      route   = "/api/forum"
      envs = {
        NODE_ENV = terraform.workspace,
        ACCOUNT  = var.ACCOUNT,
        KEY      = var.KEY,
        CSRF     = var.CSRF,
      }
    },
  }
}
