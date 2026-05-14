ui = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

# tls_disable should be false for prod lvl, temporary true for testing

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true 
}

api_addr     = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"
