const readline = require('readline');
const oci = require('oci-sdk');
const ociConfigFile = "~/.oci/config"; // Replace with the path to your OCI config file
const ociProfile = "<OCI_PROFILE>"; // Replace with your OCI profile name
const compartmentId = "<COMPARTMENT_OCID>"; // Replace with the OCID of your compartment

// Create an instance of the OCI SDK's ContainerInstanceClient
const containerInstanceClient = new oci.containerinstance.ContainerInstanceClient({
    authenticationDetailsProvider: new oci.configFileAuthenticationDetailsProvider(ociConfigFile, ociProfile),
});

// Create a readline interface for prompting the user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// List all containers in the compartment
containerInstanceClient.listContainerInstances({
    compartmentId: compartmentId
}).then((response) => {
    const instances = response.items;
    console.log(`Found ${instances.length} containers:`);
    instances.forEach((instance, i) => {
        console.log(`${i+1}. ${instance.displayName} (${instance.id})`);
    });
    rl.question("Enter the number of the container instance to delete (or 'q' to quit): ", (input) => {
        if (input === "q") {
            console.log("Aborted");
            process.exit(0);
        }
        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= instances.length) {
            console.log("Invalid input");
            process.exit(1);
        }
        const instance = instances[index];
        console.log(`Deleting container instance ${instance.displayName} (${instance.id})...`);
        return containerInstanceClient.deleteContainerInstance({
            containerInstanceId: instance.id,
            ifMatch: instance.etag
        });
    }).then((response) => {
        console.log("Container instance deleted");
        process.exit(0);
    }).catch((error) => {
        console.log("An error occurred:", error);
        process.exit(1);
    });
}).catch((error) => {
    console.log("An error occurred:", error);
    process.exit(1);
});
