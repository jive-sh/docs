// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

export default defineConfig({
	site: 'https://docs.jive.sh',
	integrations: [
		mermaid(),
		starlight({
			title: 'Jive API',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/jive-sh' }],
			sidebar: [
				{ label: 'Overview', slug: '' },
				{
					label: 'Packages',
					items: ['packages/names', 'packages/abstracts', 'packages/cicd'],
				},
				{
					label: 'Resources',
					items: ['resources/providers', 'resources/connect', 'resources/provision'],
				},
				{
					label: 'Server',
					items: ['server/sessions', 'server/functions'],
				},
				{ label: 'CLI', slug: 'cli' },
			],
		}),
	],
});
