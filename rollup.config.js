import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from 'rollup-plugin-node-resolve';

import pkg from "./package.json";

export default {
    input: "demo.js",
    output: {
        file: pkg.browser,
        format: "iife",
    },
    plugins: [
        resolve({
            mainFields: ["module", "main"],
        }),
        babel({
            include: "node_modules/bistring/**",
            presets: [
                [
                    "@babel/preset-env",
                    {
                        corejs: 3,
                        targets: {
                            browsers: "> 2%, not dead",
                        },
                        useBuiltIns: "usage",
                        shippedProposals: true,
                    },
                ],
            ],
        }),
        commonjs(),
    ],
};
