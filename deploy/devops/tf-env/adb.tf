locals {
  adb_name = "stwldevopsadb"
}

resource "oci_database_autonomous_database" "adb" {
  compartment_id = var.compartment_ocid
  db_name        = local.adb_name

  admin_password           = random_password.adb_admin_password.result
  cpu_core_count           = 1
  data_storage_size_in_tbs = 1
  db_workload              = "OLTP"
  display_name             = local.adb_name
  is_auto_scaling_enabled  = true
  license_model            = "BRING_YOUR_OWN_LICENSE"
}

# resource "oci_database_autonomous_database_wallet" "adb_wallet" {
#   autonomous_database_id = oci_database_autonomous_database.adb.id
#   password               = random_password.adb_wallet_password.result
#   base64_encode_content  = "true"
# }

# resource "local_file" "adb_wallet_file" {
#   content_base64 = oci_database_autonomous_database_wallet.adb_wallet.content
#   filename       = "${path.module}/generated/${var.autonomous_database_db_name}_wallet.zip"
# }
