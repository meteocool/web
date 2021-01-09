import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import {
    terser
} from 'rollup-plugin-terser';
import svelteSVG from "rollup-plugin-svelte-svg";
import babel from '@rollup/plugin-babel';
import sveltePreprocess from 'svelte-preprocess';
import copy from 'rollup-plugin-copy';
import path from 'path';
import postcss from 'rollup-plugin-postcss'


const production = !process.env.ROLLUP_WATCH;

function serve() {
    let server;

    function toExit() {
        if (server) server.kill(0);
    }

    return {
        writeBundle() {
            if (server) return;
            server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        }
    };
}

export default {
    input: 'src/main.js',
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/build/bundle.js'
    },
    plugins: [
        svelte({
            preprocess: sveltePreprocess({
                sourceMap: !production,
            }),
            compilerOptions: {
                // enable run-time checks when not in production
                dev: !production
            }
        }),
        svelteSVG(),
        resolve({
            browser: true,
            dedupe: ['svelte']
        }),

        copy({
            targets: [{
                src: path.resolve(__dirname, 'node_modules/@shoelace-style/shoelace/dist/shoelace/icons'),
                dest: path.resolve(__dirname, 'public/build')
            }]
        }),
        postcss({
            extract: path.resolve('public/build/bundle.css')
        }),
        commonjs(),
        babel({
            babelHelpers: 'bundled'
        }),
        // In dev mode, call `npm run start` once
        // the bundle has been generated
        !production && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        !production && livereload('public'),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser({
            ecma: 2020,
        })
    ],
    watch: {
        clearScreen: false
    },
    onwarn: function (warning, superOnWarn) {
        /*
         * skip certain warnings
         * https://github.com/openlayers/openlayers/issues/10245
         */
        if (warning.code === 'THIS_IS_UNDEFINED') {
            return;
        }
        superOnWarn(warning);
    }
};
