import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface Repository {
	id: number
	name: string
	description: string | null
	stargazers_count: number
	forks_count: number
	open_issues_count: number
	language: string | null
	updated_at: string
}

const fetchRepositories = async (sort: string) => {
	const url = new URL('https://api.github.com/search/repositories')

	// Search for popular Facebook repositories as an example
	url.searchParams.set('q', '@facebook')
	// Only set sort if it's not the default (best match)
	sort && url.searchParams.set('sort', sort)

	const response = await fetch(url)

	if (!response.ok) {
		throw new Error('Failed to fetch repositories')
	}

	const data = await response.json()
	return data.items as Repository[]
}

const useRepositoryList = (sort: string) => {
	return useQuery<Repository[]>({
		queryKey: ['repositories', sort],
		queryFn: () => fetchRepositories(sort),
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}

function App() {
	const [sort, setSort] = useState<string>('')
	const { data, isLoading, isError } = useRepositoryList(sort)

	return (
		<div className="container">
			<div className="header">
				<h1>GitHub Repositories</h1>
				<select
					disabled={isLoading}
					value={sort}
					onChange={(e) => setSort(e.target.value)}
					className="sort-select"
				>
					<option value="">Best match</option>
					<option value="stars">Most stars</option>
					<option value="forks">Most forks</option>
					<option value="updated">Recently updated</option>
				</select>
			</div>

			{isLoading && <div className="loading">Loading repositories...</div>}

			{isError && <div className="error">Error fetching repositories!</div>}

			<div className="repo-list">
				{data?.map((repo) => (
					<div key={repo.id} className="repo-item">
						<div className="repo-header">
							<h2 className="repo-name">{repo.name}</h2>
							{repo.language && (
								<span className="repo-language">{repo.language}</span>
							)}
						</div>
						{repo.description && (
							<p className="repo-description">{repo.description}</p>
						)}
						<div className="repo-stats">
							<span className="stat">
								⭐ {repo.stargazers_count.toLocaleString()}
							</span>
							<span className="stat">
								🍴 {repo.forks_count.toLocaleString()}
							</span>
							<span className="stat">
								⚠️ {repo.open_issues_count.toLocaleString()}
							</span>
							<span className="stat">
								🕒 {new Date(repo.updated_at).toLocaleDateString()}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default App
