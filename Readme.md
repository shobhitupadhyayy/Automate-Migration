
# Automation Migration

This project automates the process of extracting automations from a source Contentstack organization in one region and importing them into a destination organization in another region. It facilitates seamless migration of automations between different Contentstack instances.



## Prerequistes

Before running this project, make sure you have the following:

* A Contentstack account with the necessary permissions for both the source and destination organizations.
* Node.js version 19 or greater installed on your local machine.
* A valid contentstack auth token and organization ID for both source and destination organizations
* Automations should be in a correct format



## How to run 

* **Install all the node modules**

```bash
  cd my-project
  npm install my-project
```

* **Run index.js**

```bash
  npm run dev
```

* **Enter source org user auth token & org ID**

```bash
  Enter Source Org Auth Token: ************
  Enter Source Organization ID: ***********
```
This will start the export of the automations in the source Org.

* **Enter destination org user auth & org ID**

```bash
  Enter Destination Org Auth Token: ************
  Enter Destination Organization ID: ***********
```
This will start the import of all the automations in the destination org on another region.

**Note - Import process will take some time to complete. Once completed it will store in the "Import" folder inside the "Migration Data" folder created.**
## Pros

- Seamless migration of the automation data.
- Supports migration across different regions.
- Enables migration of all the automation projects across various regions in a single go.

## Limitations

- Users must manually set triggers using their Contentstack credentials.
- Third-party connected apps need to be reconfigured with valid credentials.

