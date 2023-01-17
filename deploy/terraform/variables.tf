variable "tenancy_ocid" {
  type = string
}

variable "region" {
  type    = string
  default = "uk-london-1"
}

variable "compartment_ocid" {
  type = string
}

variable "ssh_public_key" {
  type = string
}
variable "private_key_path" {}
variable "fingerprint" {}
variable "user_ocid" {}