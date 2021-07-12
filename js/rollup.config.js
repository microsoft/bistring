import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

import pkg from "./package.json";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: pkg.main,
                format: "cjs",
                exports: "named",
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: "esm",
                exports: "named",
                sourcemap: true,
            },
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
            }),
            babel({
                exclude: "node_modules/**",
                extensions: [".js", ".ts"],
                babelHelpers: "bundled",
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            corejs: 3,
                            targets: {
                                node: "current",
                            },
                            useBuiltIns: "usage",
                            shippedProposals: true,
                        },
                    ],
                ],
            }),
            commonjs(),
        ],
    },
    {
        input: "src/index.ts",
        output: {
            file: pkg.browser,
            format: "umd",
            exports: "named",
            name: "bistring",
            sourcemap: true,
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            "regenerator-runtime/runtime",
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
            }),
            babel({
                exclude: "node_modules/**",
                extensions: [".js", ".ts"],
                babelHelpers: "bundled",
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
    },
];
