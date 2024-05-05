const { Octokit } = require('octokit');

async function fetchRepoDetails(username, repoName, accessToken) {
  try {
    const octokit = new Octokit({
      auth: accessToken,
    });

    const response = await octokit.request('GET /repos/{owner}/{repo}', {
      owner: username,
      repo: repoName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // extract the languages_url from the response and fetch the languages using octokit
    const languagesResponse = await octokit.request(
      'GET /repos/{owner}/{repo}/languages',
      {
        owner: username,
        repo: repoName,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    const languages = languagesResponse.data;

    return { ...response.data, languages };
  } catch (error) {
    console.error(`Error fetching repository details: ${error}`);
    throw error;
  }
}

module.exports = { fetchRepoDetails };
