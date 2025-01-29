import axios from "axios";


const headers = {
    authtoken:"blt3be993f843939631",
    organization_uid:"bltbc1e4d98081f0bb5"
}


const fetchProjects = async () => {
    try {
        console.log('Fetching Projects...');
        const response = await axios.get('https://gcp-na-app.contentstack.com/automations-api/projects/', { headers });
        const projects = response.data || [];
        const projectIDs = projects.map((project) => project.id);
        console.log('Project IDs:', projectIDs);
        return projectIDs;
    } catch (error) {
        console.error('Error fetching projects:', error.response?.data ?? error);
        return [];
    }
};

const api = async (projectID) => {
    try {
        console.log('Deleting Project ID:', projectID);
        const response = await axios.delete(`https://gcp-na-app.contentstack.com/automations-api/projects/${projectID}`, { headers });
        console.log(response.status, " Delete success");
    } catch (error) {
        console.error('Error deleting project ID:', projectID, error.response?.data ?? error);
    }
};

const main = async () => {
    console.log('Starting main function...');
    const projectIDs = await fetchProjects();
    console.log('Fetched Project IDs:', projectIDs);
    if (projectIDs.length > 0) {
        for (let projectID of projectIDs) {
            await api(projectID);
        }
    } else {
        console.log('No projects to delete.');
    }
};

main();
