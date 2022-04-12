terraform {
  required_providers {
    oci = {
      source = "oracle/oci"
      version = "~> 4.0"
    }
  }
}

provider "oci" {
  fingerprint          = var.api_fingerprint
  private_key_path     = var.api_private_key_path
  region               = var.region
  tenancy_ocid         = var.tenancy_id
  user_ocid            = var.user_id
}

variable "region" {
  type = string
}
variable "tenancy_id" {
  type = string
}
variable "compartment_id" {
  type = string
}
variable "api_private_key_path" {
  type = string
}
variable "api_fingerprint" {
  type = string
}
variable "user_id" {
  type = string
}

variable "ssh_public_key" {
  type = string
}