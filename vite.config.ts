import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig as terrazzoDefineConfig, parse, build } from '@terrazzo/parser';
import css from '@terrazzo/plugin-css';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

// Vite plugin to compile Terrazo tokens
function terrazo() {
	async function compileTokens() {
		const config = terrazzoDefineConfig(
			{
				plugins: [
					css({
						filename: 'gen_tokens.css',
						baseSelector: ':root',
						legacyHex: true
					})
				]
			},
			{ cwd: new URL('.', import.meta.url) }
		);

		const tokensSrc = await readFile('./tokens.json', 'utf-8');
		const { tokens, sources } = await parse(
			[{ filename: new URL('./tokens.json', import.meta.url), src: tokensSrc }],
			{ config }
		);
		const result = await build(tokens, { sources, config });

		// Write output files to disk
		for (const file of result.outputFiles) {
			const filePath = `./src/lib/styles/${file.filename}`;
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, file.contents, 'utf-8');
		}
	}

	return {
		name: 'vite-plugin-terrazo',
		async buildStart() {
			console.log('🎨 Compiling design tokens...');
			try {
				await compileTokens();
				console.log('✓ Design tokens compiled');
			} catch (error) {
				console.error('Failed to compile design tokens:', error);
			}
		},
		async handleHotUpdate({ file, server }: { file: string; server: any }) {
			if (file.includes('tokens.json')) {
				console.log('🎨 Recompiling design tokens...');
				try {
					await compileTokens();
					console.log('✓ Design tokens recompiled');
					server.ws.send({
						type: 'full-reload',
						path: '*'
					});
				} catch (error) {
					console.error('Failed to recompile design tokens:', error);
				}
			}
		}
	};
}

export default defineConfig({
	plugins: [terrazo(), sveltekit()],
	build: {
		sourcemap: false
	},
	server: {
		fs: {
			allow: ['..']
		},
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	preview: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});