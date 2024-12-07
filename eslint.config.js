import defaultConfig from '@epic-web/config/eslint'
import pluginTanstackQuery from '@tanstack/eslint-plugin-query'

/** @type {import('eslint').Linter.Config[]} */
export default [
	...defaultConfig,
	{
		plugins: {
			'@tanstack/query': pluginTanstackQuery,
		},
		rules: {
			...pluginTanstackQuery.configs.recommended.rules,
		},
	},
]
