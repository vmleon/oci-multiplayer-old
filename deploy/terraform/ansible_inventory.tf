resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/inventory.tftpl",
    {
     web_public_ip = oci_core_instance.compute_web[0].public_ip
     server_public_ip = oci_core_instance.compute_server[0].public_ip
    }
  )
  filename = "${path.module}/generated/app.ini"
}