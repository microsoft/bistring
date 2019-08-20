import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";

import pkg from "./package.json";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: pkg.main,
                format: "cjs",
                exports: "named",
            },
            {
                file: pkg.module,
                format: "esm",
                exports: "named",
            },
        ],
        external: [
            ...Object.keys(pkg.dependencies),
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
            }),
            babel({
                exclude: "node_modules/**",
                extensions: [".js", ".ts"],
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
        },
        external: [
            ...Object.keys(pkg.dependencies),
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
            }),
            babel({
                exclude: "node_modules/**",
                extensions: [".js", ".ts"],
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
