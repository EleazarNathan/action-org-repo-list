import {getClient} from './repo'

export default async function makeTable(
  org: string,
  githubToken: string,
  containsArchived: boolean,
  excludeRepoNames: string[],
  wrapWithDetails: boolean
): Promise<string> {
  const github = getClient(githubToken)

  const allRepo = await github.paginate(github.repos.listForOrg, {
    org
  })

  let repoInfo = allRepo.map(repo => {
    let desc = repo.description ?? '<no description>'
    if (desc.includes('|')) {
      desc = desc.replace(/\|/g, '\\|')
    }
    const topics = repo.topics?.join(', ') ?? '<no topics>'
    return {
      name: repo.name,
      stars: repo.stargazers_count ?? 0,
      url: repo.html_url,
      description: desc,
      latestCommit: repo.updated_at,
      archived: (repo.archived = repo.archived ?? false),
      topics
    }
  })

  // sort by stars
  repoInfo = repoInfo
    .sort((a, b) => {
      return b.stars - a.stars
    })
    .filter(repo => containsArchived || !repo.archived)
    .filter(repo => !excludeRepoNames.includes(repo.name))

  // make a markdown table
  let table = `| Name | Description | Stars | Latest Commit | Topics |\n| ---- | --- | ----------- | ------------- | ------ |\n`
  for (const repo of repoInfo) {
    table += `| [${repo.name}](${repo.url}) | ${repo.description} | ${repo.stars} | ${repo.latestCommit} | ${repo.topics} |\n`
  }

  if (wrapWithDetails) {
    table = `<details><summary>📖 Repositories</summary>

${table}

</details>`
  }

  return table
}
