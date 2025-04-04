
import { default as axios } from "axios";
import fs from "fs";
import path from "path";

// Utility to get current time in IST format
const getISTTime = () => {
  const now = new Date();
  const options = { timeZone: "Asia/Kolkata", hour12: false };
  return now.toLocaleString("en-IN", options).replace(",", "");
};

// Utility to log messages to a file inside the Export folder
const logToFile = (exportFolder, message) => {
  const successLogFilePath = path.join(exportFolder, "success.log");
  const logMessage = `[${getISTTime()}] ${message}\n`;
  fs.appendFileSync(successLogFilePath, logMessage, "utf8");
};


// Function to save data to a file inside the Export folder
const saveToFile = (exportFolder, fileName, data) => {
  const filePath = path.join(exportFolder, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  logToFile(exportFolder, `Data saved to ${filePath}`);
};

/**
 * Function to extract all the Automation projects of a given Org
 * @param {*} authToken - User Auth Token
 * @param {*} organization_uid - Organization UID
 * @returns An array of objects which includes project ID & project name
 */
export const extractAutomationProjects = async (
  authToken,
  organization_uid,
  exportFolder
) => {
  const headers = { authToken, organization_uid };
  const uri = "https://gcp-na-app.contentstack.com/automations-api/projects/";

  try {
    const response = await axios.get(uri, { headers });

    saveToFile(exportFolder, "projects.json", response.data);

    const projects = response.data.map((project) => ({
      id: project.id,
      title: project.title.replace(/[^a-zA-Z0-9-_]/g, "_"),
    }));

    logToFile(
      exportFolder,
      `Successfully extracted ${projects.length} projects.`
    );
    return projects;
  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    logToFile(
      path.join(exportFolder, "error.log"),
      `Failed to extract projects. Error: ${errorMsg}`
    );
    return [];
  }
};

/**
 * Function to extract automations of a project and store it
 * @param {*} authToken - User Auth Token
 * @param {*} organization_uid - Organization UID
 * @param {*} project - Project object fetched from @extractAutomationProjects function
 * @param {*} exportFolder - Path to the Export folder
 */
export const extractProjectRules = async (
  authToken,
  organization_uid,
  project,
  exportFolder
) => {
  const headers = { authToken, organization_uid };
  const uri = `https://gcp-na-app.contentstack.com/automations-api/projects/${project.id}/rules`;

  try {
    const response = await axios.get(uri, { headers });
    logToFile(
      exportFolder,
      `Successfully extracted rules for project '${project.title}' (ID: ${project.id})`
    );

    saveToFile(exportFolder, `rules-${project.title}.json`, response.data);
  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    logToFile(
      path.join(exportFolder, "error.log"),
      `Error extracting rules for Project ${project.title}: ${errorMsg}`
    );
  }
};
