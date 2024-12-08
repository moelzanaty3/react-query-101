import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useEffect, useMemo, useState } from 'react'

interface Repository {
	id: number
	name: string
	description: string | null
	stargazers_count: number
	forks_count: number
	open_issues_count: number
	language: string | null
	updated_at: string
	owner: {
		login: string
	}
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
		// refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
		enabled: !!query,
	})
}

interface Issue {
	id: number
	title: string
	state: string
	created_at: string
	html_url: string
}

const fetchRepositoryIssues = async (owner: string, repo: string) => {
	// url example: https://api.github.com/repos/facebook/react/issues
	const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`)
	const response = await fetch(url)

	if (!response.ok) {
		const errorData = await response.json()
		if (errorData.errors) {
			throw new Error(errorData.errors[0].message)
		} else {
			throw new Error('Failed to fetch repository issues')
		}
	}

	return response.json()
}

const useRepositoryIssues = (owner: string, repoName: string | null) => {
	return useQuery<Issue[]>({
		queryKey: ['issues', owner, repoName],
		queryFn: () => fetchRepositoryIssues(owner, repoName!),
		enabled: !!repoName, // Only fetch when a repository is selected
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
	})
}

function App() {
	const [sort, setSort] = useState<string>('')
	const [query, setQuery] = useState<string>('@facebook')
	const [debouncedQuery, setDebouncedQuery] = useState<string>('')
	const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
	const [selectedRepoOwner, setSelectedRepoOwner] = useState<string | null>(
		null,
	)
	const { data, isLoading, isError, isStale, refetch, error, dataUpdatedAt } =
		useRepositoryList(debouncedQuery, sort)
	const {
		data: issues,
		isLoading: isLoadingIssues,
		error: issuesError,
	} = useRepositoryIssues(selectedRepoOwner || '', selectedRepo)

	const debouncedSetQuery = useMemo(
		() =>
			debounce((value: string) => {
				setDebouncedQuery(value)
				console.log('✅ Executed:', value)
			}, 500),
		[],
	)
	useEffect(() => {
		// Log when a new call is queued
		console.log('🕒 Queued:', query)

		debouncedSetQuery(query)

		return () => {
			console.log('🧹 Cleaned up pending call for:', query)
			debouncedSetQuery.cancel()
		}
	}, [query, debouncedSetQuery])

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
				{!isLoading && !isError && (
					<strong>
						Last updated at {new Date(dataUpdatedAt).toLocaleString()}
					</strong>
				)}

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
						<div className="repo-actions">
							<button
								className="issues-button"
								onClick={() => {
									const isCurrentlySelected = repo.name === selectedRepo
									setSelectedRepo(isCurrentlySelected ? null : repo.name)
									setSelectedRepoOwner(
										isCurrentlySelected ? null : repo.owner.login,
									)
								}}
							>
								{selectedRepo === repo.name ? 'Hide Issues' : 'Show Issues'}
							</button>
						</div>

						{selectedRepo === repo.name && (
							<div className="issues-section">
								{isLoadingIssues && <div>Loading issues...</div>}
								{issuesError && <div>{issuesError.message}</div>}
								{issues && (
									<ul className="issues-list">
										{issues.slice(0, 10).map((issue) => (
											<li key={issue.id}>
												⏤{' '}
												<a
													href={issue.html_url}
													target="_blank"
													rel="noopener noreferrer"
												>
													{issue.title.length > 80
														? issue.title.substring(0, 77) + '...'
														: issue.title}
												</a>
												<span className="issue-meta">
													{issue.state} •{' '}
													{new Date(issue.created_at).toLocaleDateString()}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

export default App
