output "compute" {
    value = "ssh opc@${oci_core_instance.compute[0].public_ip}"
}