path "fabric/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/health" {
  capabilities = ["read"]
}
