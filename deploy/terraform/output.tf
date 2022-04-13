output "compute_web" {
    value = "ssh opc@${oci_core_instance.compute_web[0].public_ip}"
}
output "compute_server" {
    value = "ssh opc@${oci_core_instance.compute_server[0].public_ip}"
}