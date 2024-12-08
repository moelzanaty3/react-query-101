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

const fetchRepositories = async (query: string, sort: string) => {
	const url = new URL('https://api.github.com/search/repositories')

	// Search for popular Facebook repositories as an example
	url.searchParams.set('q', query)
	// Only set sort if it's not the default (best match)
	sort && url.searchParams.set('sort', sort)

	const response = await fetch(url)

	if (!response.ok) {
		const errorData = await response.json()
		if (errorData.errors) {
			throw new Error(errorData.errors[0].message)
		} else {
			throw new Error('Failed to fetch repositories')
		}
	}

	const data = await response.json()
	return data.items as Repository[]
}

const useRepositoryList = (query: string, sort: string) => {
	return useQuery<Repository[]>({
		queryKey: ['repositories', query, sort],
		queryFn: () => fetchRepositories(query, sort),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 30 * 1000, // 30 seconds
		enabled: !!query,
	})
}

function App() {
	const [sort, setSort] = useState<string>('')
	const [query, setQuery] = useState<string>('')
	const { data, isLoading, isError, isStale, refetch, error } =
		useRepositoryList(query, sort)
	return (
		<div className="container">
			<div className="header">
				<h1>GitHub Repositories</h1>
				<select
					disabled={isLoading || !data}
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
			<form className="search-form">
				<input
					type="text"
					name="query"
					placeholder="Search Keywords"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</form>

			{isLoading && <div className="loading">Loading repositories...</div>}

			{isError && <div className="error">{error?.message}</div>}

			<div className="repo-list">
				{isStale && !isLoading && !isError && (
					<p className="message">
						Repositories data may be outdated. Click{' '}
						<button className="link" onClick={() => refetch()}>
							Refresh
						</button>{' '}
						to get the latest updates.
					</p>
				)}

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
