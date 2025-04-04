import { default as axios } from "axios";

/**
 * @function Creates an automation project in the destination Org
 * @param {*} authToken User Auth Token of the destination org
 * @param {*} organization_uid Destination Org UID
 * @param {*} projectName Destination Org's project name
 * @returns ID of the created Project
 */
export const createProject = async (
  authToken,
  organization_uid,
  projectName
) => {
  const headers = {
    authToken,
    organization_uid,
    "Content-Type": "application/json",
  };
  console.log(typeof projectName, " Create Project File ", projectName);

  // Adjusted payload to match the expected API format
  const payload = {
    title: projectName,
    description: "",
    tags: [],
  };

  try {
    const response = await axios.post(
      "https://gcp-eu-app.contentstack.com/automations-api/projects",
      payload,
      { headers }
    );
    console.log(`Project created with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
};